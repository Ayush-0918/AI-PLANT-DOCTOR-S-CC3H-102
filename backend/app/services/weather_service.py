from collections import defaultdict
from datetime import date, timedelta
from typing import Any, Dict, List

import httpx  # type: ignore[import]

from app.core.config import settings
from app.core.errors import DependencyError


def compute_disease_risk(temp_c: float, humidity: int, rain_1h_mm: float, wind_kmh: float) -> Dict[str, Any]:
    score = 0
    reasons = []
    farming_alerts = []

    if 22 <= temp_c <= 32:
        score += 25
        reasons.append("temperature favorable for fungal growth")
    if temp_c > 35:
        farming_alerts.append(f"☀️ High temperature ({temp_c}°C) — risk of heat stress on sensitive crops")
    if temp_c < 10:
        farming_alerts.append(f"🌨️ Low temperature ({temp_c}°C) — protect crops from frost damage")
    if humidity >= 80:
        score += 35
        reasons.append("high humidity")
        farming_alerts.append(f"💧 High humidity ({humidity}%) — favorable conditions for fungal/mold growth")
    if rain_1h_mm >= 2:
        score += 20
        reasons.append("leaf wetness due to rain")
        farming_alerts.append(f"🌧️ Rain detected ({rain_1h_mm}mm/hr) — delay spraying until dry")
    if wind_kmh >= 25:
        score += 10
        reasons.append("wind can accelerate spread")
        farming_alerts.append(f"💨 High wind ({wind_kmh} km/h) — avoid spraying, disease spread risk")

    score = min(100, max(0, score))
    if score >= 70:
        level = "high"
    elif score >= 40:
        level = "medium"
    else:
        level = "low"

    return {
        "risk_score": score,
        "risk_level": level,
        "reasons": reasons,
        "farming_alerts": farming_alerts,
    }


async def fetch_live_weather(lat: float = None, lon: float = None, q: str = None) -> Dict[str, Any]:
    if not settings.openweather_api_key:
        raise DependencyError("OPENWEATHER_API_KEY missing.")

    try:
        params: Dict[str, Any] = {"appid": settings.openweather_api_key, "units": "metric"}
        if q and q.strip():
            params["q"] = q.strip()
        elif lat is not None and lon is not None:
            params["lat"] = lat
            params["lon"] = lon
        else:
            raise DependencyError("Must provide location string 'q' or 'lat'/'lon'.")

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://api.openweathermap.org/data/2.5/weather", params=params)
            response.raise_for_status()
    except Exception as exc:
        raise DependencyError("Failed to fetch live weather.", details={"error": str(exc)})

    weather = response.json()
    temp_c = round(float(weather["main"]["temp"]), 1)
    humidity = int(weather["main"]["humidity"])
    rain_1h = float(weather.get("rain", {}).get("1h", 0.0))
    wind_kmh = round(float(weather.get("wind", {}).get("speed", 0.0)) * 3.6, 1)
    risk = compute_disease_risk(temp_c, humidity, rain_1h, wind_kmh)

    return {
        "temperature_c": temp_c,
        "feels_like_c": round(float(weather["main"]["feels_like"]), 1),
        "humidity_pct": humidity,
        "wind_kmh": wind_kmh,
        "rain_1h_mm": rain_1h,
        "cloud_pct": int(weather.get("clouds", {}).get("all", 0)),
        "description": weather["weather"][0]["description"],
        "city": weather.get("name"),
        "source": "openweathermap_live",
        "disease_risk": risk,
    }


async def fetch_7day_forecast(lat: float, lon: float) -> List[Dict[str, Any]]:
    if not settings.openweather_api_key:
        raise DependencyError("OPENWEATHER_API_KEY missing.")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/forecast",
                params={
                    "appid": settings.openweather_api_key,
                    "units": "metric",
                    "lat": lat,
                    "lon": lon,
                },
            )
            response.raise_for_status()
    except Exception as exc:
        raise DependencyError("Failed to fetch weather forecast.", details={"error": str(exc)})

    data = response.json()
    entries = data.get("list", [])
    day_buckets: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in entries:
        timestamp = row.get("dt_txt")
        if not timestamp:
            continue
        day_key = timestamp.split(" ")[0]
        day_buckets[day_key].append(row)

    daily = []
    for day_key in sorted(day_buckets.keys())[:7]:
        rows = day_buckets[day_key]
        if not rows:
            continue
        min_temp = min(float(item.get("main", {}).get("temp_min", 0.0)) for item in rows)
        max_temp = max(float(item.get("main", {}).get("temp_max", 0.0)) for item in rows)
        avg_humidity = sum(float(item.get("main", {}).get("humidity", 0.0)) for item in rows) / max(1, len(rows))
        rain_mm = sum(float(item.get("rain", {}).get("3h", 0.0)) for item in rows)
        max_wind_kmh = max(float(item.get("wind", {}).get("speed", 0.0)) * 3.6 for item in rows)
        description = rows[len(rows) // 2].get("weather", [{}])[0].get("description", "no data")
        risk = compute_disease_risk(
            temp_c=round((min_temp + max_temp) / 2, 1),
            humidity=int(round(avg_humidity)),
            rain_1h_mm=round(rain_mm / 3, 2) if rain_mm > 0 else 0.0,
            wind_kmh=round(max_wind_kmh, 1),
        )
        daily.append(
            {
                "date": day_key,
                "min_temp_c": round(min_temp, 1),
                "max_temp_c": round(max_temp, 1),
                "humidity_pct": int(round(avg_humidity)),
                "rain_mm": round(rain_mm, 2),
                "wind_kmh": round(max_wind_kmh, 1),
                "description": description,
                "disease_risk": risk,
            }
        )

    if len(daily) < 7 and daily:
        last_date = date.fromisoformat(daily[-1]["date"])
        template = dict(daily[-1])
        while len(daily) < 7:
            last_date = last_date + timedelta(days=1)
            synthetic = {**template, "date": last_date.isoformat(), "source": "synthetic_extension"}
            daily.append(synthetic)

    return daily[:7]
