import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path
from statistics import median
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import enforce_rate_limit, get_optional_user
from app.core.database import get_database
from app.core.errors import DependencyError, ValidationError
from app.services.dataset_locator_service import (
    AGRICULTURE_PRICE_DATASET_CANDIDATES,
    first_existing_path,
)
from app.services.mandi_trend_service import mandi_trend_service
from app.services.soil_advice_service import estimate_fertilizer_investment
from app.services.threat_map_service import ThreatMapService
from app.services.weather_service import fetch_7day_forecast, fetch_live_weather

router = APIRouter(prefix="/intelligence", tags=["Advanced Intelligence"], dependencies=[Depends(enforce_rate_limit)])

CROP_METADATA = {
    "wheat": {"maturity_days": 120, "avg_yield_kg_per_acre": 2000, "ops_cost_inr_per_acre": 9000},
    "rice": {"maturity_days": 135, "avg_yield_kg_per_acre": 1800, "ops_cost_inr_per_acre": 11000},
    "tomato": {"maturity_days": 80, "avg_yield_kg_per_acre": 12000, "ops_cost_inr_per_acre": 26000},
    "potato": {"maturity_days": 100, "avg_yield_kg_per_acre": 10000, "ops_cost_inr_per_acre": 22000},
    "corn": {"maturity_days": 110, "avg_yield_kg_per_acre": 2500, "ops_cost_inr_per_acre": 9500},
    "cotton": {"maturity_days": 160, "avg_yield_kg_per_acre": 1600, "ops_cost_inr_per_acre": 15000},
    "soybean": {"maturity_days": 105, "avg_yield_kg_per_acre": 1400, "ops_cost_inr_per_acre": 8500},
    "sugarcane": {"maturity_days": 300, "avg_yield_kg_per_acre": 30000, "ops_cost_inr_per_acre": 32000},
}

CROP_ALIASES = {
    "maize": "corn",
    "paddy": "rice",
    "aloo": "potato",
    "gehun": "wheat",
    "gehu": "wheat",
}

SOIL_IRRIGATION_BUFFER_DAYS = {
    "sandy": 2,
    "sandy_loam": 2,
    "loamy": 3,
    "alluvial": 3,
    "black_soil": 4,
    "clay": 4,
    "laterite": 3,
    "red": 3,
}

CROP_LIFECYCLE_LIBRARY: dict[str, list[dict[str, Any]]] = {
    "wheat": [
        {"day_offset": 0, "category": "sowing", "task": "Sowing and seed treatment"},
        {"day_offset": 7, "category": "irrigation", "task": "Light irrigation for establishment"},
        {"day_offset": 21, "category": "nutrition", "task": "First urea split application"},
        {"day_offset": 35, "category": "monitoring", "task": "Scout rust and aphids"},
        {"day_offset": 45, "category": "irrigation", "task": "Second critical irrigation (tillering)"},
        {"day_offset": 60, "category": "nutrition", "task": "Second nitrogen top dressing"},
        {"day_offset": 78, "category": "protection", "task": "Preventive fungicide if humidity stays high"},
        {"day_offset": 90, "category": "monitoring", "task": "Grain-fill stress check and irrigation planning"},
    ],
    "rice": [
        {"day_offset": 0, "category": "nursery", "task": "Nursery sowing and seed treatment"},
        {"day_offset": 14, "category": "transplant", "task": "Transplanting and puddling checks"},
        {"day_offset": 25, "category": "nutrition", "task": "First nitrogen split after establishment"},
        {"day_offset": 35, "category": "irrigation", "task": "Start AWD cycle for water saving"},
        {"day_offset": 50, "category": "protection", "task": "BPH and blast scouting"},
        {"day_offset": 65, "category": "nutrition", "task": "Second nitrogen split and potash support"},
        {"day_offset": 80, "category": "irrigation", "task": "Flowering-stage moisture stability"},
        {"day_offset": 90, "category": "monitoring", "task": "Panicle health and pest watch"},
    ],
    "tomato": [
        {"day_offset": 0, "category": "nursery", "task": "Seedling nursery care"},
        {"day_offset": 12, "category": "transplant", "task": "Transplant and drip setup"},
        {"day_offset": 20, "category": "nutrition", "task": "Basal feeding and calcium support"},
        {"day_offset": 32, "category": "protection", "task": "Early blight preventive spray window"},
        {"day_offset": 45, "category": "irrigation", "task": "Uniform irrigation to avoid cracking"},
        {"day_offset": 58, "category": "nutrition", "task": "Potash and micronutrient support"},
        {"day_offset": 72, "category": "protection", "task": "Late blight vigilance"},
        {"day_offset": 90, "category": "harvest", "task": "Staggered harvest and mandi planning"},
    ],
}


def _normalize_crop(crop: str) -> str:
    normalized = crop.strip().lower().replace(" ", "_")
    normalized = CROP_ALIASES.get(normalized, normalized)
    if normalized not in CROP_METADATA and normalized.endswith("_crop"):
        normalized = normalized.replace("_crop", "")
    return normalized or "wheat"


def _display_crop(crop_key: str) -> str:
    return crop_key.replace("_", " ").title()


def _parse_planting_date(planting_date: Optional[str], fallback_days: int = 30) -> datetime:
    try:
        if not planting_date:
            raise ValueError("missing")
        parsed = datetime.fromisoformat(planting_date.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        return datetime.now(timezone.utc) - timedelta(days=fallback_days)


def _resolve_coordinates(
    lat: Optional[float],
    lon: Optional[float],
    latitude: Optional[float],
    longitude: Optional[float],
) -> tuple[float, float]:
    resolved_lat = lat if lat is not None else latitude
    resolved_lon = lon if lon is not None else longitude
    if resolved_lat is None or resolved_lon is None:
        raise ValidationError("Provide coordinates via lat/lon or latitude/longitude.")
    return float(resolved_lat), float(resolved_lon)


def _safe_float(value: Any, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _lookup_mandi_price_per_kg(crop_key: str) -> float:
    dataset_path = first_existing_path(AGRICULTURE_PRICE_DATASET_CANDIDATES)
    if dataset_path is None:
        return 25.0

    prices: list[float] = []
    crop_name = _display_crop(crop_key).lower()
    with open(Path(dataset_path), mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            commodity = str(row.get("Commodity", "")).strip().lower()
            if commodity and crop_name in commodity:
                modal_price_q = _safe_float(row.get("Modal_Price"), 0.0)
                if modal_price_q > 0:
                    prices.append(modal_price_q / 100.0)
            if len(prices) >= 300:
                break

    return round(median(prices), 2) if prices else 25.0


def _lookup_mandi_trend(crop_key: str) -> dict[str, Any]:
    trends = mandi_trend_service.get_crop_trends(commodity=_display_crop(crop_key))
    if not trends:
        return {
            "trend": "stable",
            "delta_pct": 0.0,
            "insight": "Trend unavailable; using stable-market fallback.",
        }
    row = trends[0]
    return {
        "trend": row.get("trend", "stable"),
        "delta_pct": _safe_float(row.get("delta_pct"), 0.0),
        "insight": row.get("insight", ""),
    }


def _yield_projection(crop_key: str, planting_dt: datetime, area_acres: float) -> dict[str, Any]:
    meta = CROP_METADATA.get(crop_key, {"maturity_days": 100, "avg_yield_kg_per_acre": 1000, "ops_cost_inr_per_acre": 9000})
    harvest_date = planting_dt + timedelta(days=int(meta["maturity_days"]))
    days_left = (harvest_date - datetime.now(timezone.utc)).days
    progress = min(100, max(0, int(((int(meta["maturity_days"]) - days_left) / int(meta["maturity_days"])) * 100)))
    predicted_yield_kg = float(meta["avg_yield_kg_per_acre"]) * float(area_acres)
    return {
        "meta": meta,
        "harvest_date": harvest_date,
        "days_until_harvest": max(0, days_left),
        "maturity_progress_pct": progress,
        "estimated_yield_kg": round(predicted_yield_kg, 2),
    }


@router.get("/yield-prediction")
async def get_yield_prediction(
    crop: str = Query("Wheat", description="Crop name"),
    planting_date: Optional[str] = Query(default=None, description="ISO planting date"),
    area_acres: float = Query(1.0, description="Field area in acres"),
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
):
    _ = lat, lon, latitude, longitude
    if area_acres <= 0:
        raise ValidationError("area_acres must be greater than 0.")

    crop_key = _normalize_crop(crop)
    planting_dt = _parse_planting_date(planting_date, fallback_days=60)
    projection = _yield_projection(crop_key=crop_key, planting_dt=planting_dt, area_acres=area_acres)
    mandi_price_per_kg = _lookup_mandi_price_per_kg(crop_key)
    projected_revenue = projection["estimated_yield_kg"] * mandi_price_per_kg

    return {
        "success": True,
        "prediction": {
            "crop": _display_crop(crop_key),
            "harvest_date": projection["harvest_date"].isoformat(),
            "days_until_harvest": projection["days_until_harvest"],
            "maturity_progress_pct": projection["maturity_progress_pct"],
            "estimated_yield_kg": projection["estimated_yield_kg"],
            "projected_revenue_inr": round(projected_revenue, 2),
            "mandi_price_ref_kg": mandi_price_per_kg,
            "confidence_score": 85.5,
        },
    }


@router.get("/crop-lifecycle")
async def crop_lifecycle(
    crop: str = Query("Wheat"),
    sowing_date: Optional[str] = Query(default=None),
    window_days: int = Query(default=90, ge=30, le=180),
):
    crop_key = _normalize_crop(crop)
    sowing_dt = _parse_planting_date(sowing_date, fallback_days=20)
    template = CROP_LIFECYCLE_LIBRARY.get(crop_key, CROP_LIFECYCLE_LIBRARY["wheat"])

    today = datetime.now(timezone.utc).date()
    tasks = []
    for row in template:
        day_offset = int(row.get("day_offset", 0))
        if day_offset > window_days:
            continue
        due_date = (sowing_dt + timedelta(days=day_offset)).date()
        if due_date < today:
            status = "completed"
        elif due_date <= today + timedelta(days=5):
            status = "current"
        else:
            status = "upcoming"
        tasks.append(
            {
                "day_offset": day_offset,
                "due_date": due_date.isoformat(),
                "category": row.get("category", "task"),
                "task": row.get("task", "Field action"),
                "status": status,
            }
        )

    next_critical = next((item for item in tasks if item["status"] in {"current", "upcoming"}), None)
    return {
        "success": True,
        "crop": _display_crop(crop_key),
        "sowing_date": sowing_dt.date().isoformat(),
        "window_days": window_days,
        "tasks": tasks,
        "next_critical": next_critical,
    }


def _soil_buffer_days(soil_type: str) -> int:
    normalized = soil_type.strip().lower().replace(" ", "_")
    return SOIL_IRRIGATION_BUFFER_DAYS.get(normalized, 3)


def _resolve_soil_type(soil_type: Optional[str], user: Optional[dict[str, Any]]) -> str:
    if soil_type and soil_type.strip():
        return soil_type.strip()
    if user and isinstance(user.get("soil_type"), str) and user.get("soil_type", "").strip():
        return str(user.get("soil_type")).strip()
    return "loamy"


def _smart_irrigation_message(
    crop_name: str,
    soil_type: str,
    today_rain: float,
    tomorrow_rain: float,
    buffer_days: int,
) -> str:
    if tomorrow_rain >= 10:
        return f"Do not irrigate today for {crop_name}. Heavy rain expected tomorrow ({tomorrow_rain:.1f} mm)."
    if tomorrow_rain >= 5:
        return f"Use only light irrigation for {crop_name} today. Moderate rain is likely tomorrow ({tomorrow_rain:.1f} mm)."
    if today_rain >= 4:
        return f"Skip irrigation today for {crop_name}; recent rain already covered root-zone moisture."
    return (
        f"Irrigate {crop_name} in {buffer_days} day intervals for {soil_type} soil unless rainfall spikes above 5 mm/day."
    )


@router.get("/smart-irrigation")
async def smart_irrigation(
    crop: str = Query("Wheat"),
    soil_type: Optional[str] = Query(default=None),
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
    user: Optional[dict[str, Any]] = Depends(get_optional_user),
):
    resolved_lat, resolved_lon = _resolve_coordinates(lat, lon, latitude, longitude)
    crop_key = _normalize_crop(crop)
    crop_name = _display_crop(crop_key)
    resolved_soil_type = _resolve_soil_type(soil_type, user)
    buffer_days = _soil_buffer_days(resolved_soil_type)

    source = "live_forecast"
    try:
        current_weather = await fetch_live_weather(lat=resolved_lat, lon=resolved_lon)
        forecast = await fetch_7day_forecast(lat=resolved_lat, lon=resolved_lon)
    except Exception:
        current_weather = {
            "temperature_c": 30.0,
            "humidity_pct": 62,
            "rain_1h_mm": 0.0,
            "description": "fallback_clear",
            "disease_risk": {"risk_score": 25, "risk_level": "low"},
        }
        forecast = []
        source = "fallback"

    today_rain = _safe_float(current_weather.get("rain_1h_mm"), 0.0) * 4.0
    tomorrow_rain = _safe_float(forecast[1]["rain_mm"], 0.0) if len(forecast) > 1 else 0.0
    message = _smart_irrigation_message(
        crop_name=crop_name,
        soil_type=resolved_soil_type,
        today_rain=today_rain,
        tomorrow_rain=tomorrow_rain,
        buffer_days=buffer_days,
    )

    week_plan = []
    for day in forecast[:7]:
        rain_mm = _safe_float(day.get("rain_mm"), 0.0)
        if rain_mm >= 8:
            action = "skip"
        elif rain_mm >= 4:
            action = "light"
        else:
            action = "normal"
        week_plan.append(
            {
                "date": day.get("date"),
                "rain_mm": rain_mm,
                "action": action,
                "note": "Rain-optimized adjustment" if action != "normal" else f"Standard {buffer_days}-day cycle",
            }
        )

    return {
        "success": True,
        "crop": crop_name,
        "soil_type": resolved_soil_type,
        "recommendation": message,
        "irrigation_interval_days": buffer_days,
        "source": source,
        "current_weather": current_weather,
        "forecast": forecast[:7],
        "week_plan": week_plan,
    }


@router.get("/roi-dashboard")
async def roi_dashboard(
    crop: str = Query("Wheat"),
    area_acres: float = Query(1.0, gt=0),
    sowing_date: Optional[str] = Query(default=None),
    soil_type: Optional[str] = Query(default=None),
    growth_stage: str = Query("vegetative"),
    user: Optional[dict[str, Any]] = Depends(get_optional_user),
):
    crop_key = _normalize_crop(crop)
    planting_dt = _parse_planting_date(sowing_date, fallback_days=45)
    yield_projection = _yield_projection(crop_key=crop_key, planting_dt=planting_dt, area_acres=area_acres)
    mandi_price_per_kg = _lookup_mandi_price_per_kg(crop_key)
    trend = _lookup_mandi_trend(crop_key)
    resolved_soil_type = _resolve_soil_type(soil_type, user)

    fertilizer = estimate_fertilizer_investment(
        crop=_display_crop(crop_key),
        growth_stage=growth_stage,
        area_acres=area_acres,
        soil_type=resolved_soil_type,
    )

    ops_cost = float(yield_projection["meta"]["ops_cost_inr_per_acre"]) * area_acres
    total_investment = fertilizer["estimated_cost_value_inr"] + ops_cost
    expected_income = yield_projection["estimated_yield_kg"] * mandi_price_per_kg
    net_profit = expected_income - total_investment
    roi_pct = round((net_profit / total_investment) * 100, 2) if total_investment > 0 else 0.0
    margin_pct = round((net_profit / expected_income) * 100, 2) if expected_income > 0 else 0.0

    return {
        "success": True,
        "crop": _display_crop(crop_key),
        "soil_type": resolved_soil_type,
        "area_acres": area_acres,
        "harvest_date": yield_projection["harvest_date"].date().isoformat(),
        "progress_pct": yield_projection["maturity_progress_pct"],
        "market": {
            "mandi_price_per_kg": mandi_price_per_kg,
            "trend": trend["trend"],
            "delta_pct": trend["delta_pct"],
            "insight": trend["insight"],
        },
        "investment": {
            "fertilizer_inr": fertilizer["estimated_cost_value_inr"],
            "operations_inr": round(ops_cost, 2),
            "total_inr": round(total_investment, 2),
            "fertilizer_breakdown": fertilizer["recommended_fertilizers"],
        },
        "income": {
            "estimated_yield_kg": yield_projection["estimated_yield_kg"],
            "gross_inr": round(expected_income, 2),
            "net_inr": round(net_profit, 2),
            "roi_pct": roi_pct,
            "margin_pct": margin_pct,
        },
    }


@router.get("/spatial-risk")
async def get_spatial_risk(
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
    radius_km: float = 10,
    radius: Optional[float] = Query(default=None),
):
    db = get_database()
    if db is None:
        raise DependencyError("Database offline")

    resolved_lat, resolved_lon = _resolve_coordinates(lat, lon, latitude, longitude)
    resolved_radius = float(radius if radius is not None else radius_km)
    resolved_radius = max(1.0, min(resolved_radius, 100.0))

    threat_service = ThreatMapService(db)
    threat_data = await threat_service.check_threats(
        latitude=resolved_lat,
        longitude=resolved_lon,
        radius_km=resolved_radius,
    )

    heatmap_points = []
    two_days_ago = datetime.now(timezone.utc) - timedelta(days=2)
    radius_meters = resolved_radius * 1000

    try:
        cursor = db.scans.find(
            {
                "timestamp": {"$gte": two_days_ago},
                "disease": {"$not": {"$regex": "healthy", "$options": "i"}},
                "location": {
                    "$near": {
                        "$geometry": {"type": "Point", "coordinates": [resolved_lon, resolved_lat]},
                        "$maxDistance": radius_meters,
                    }
                },
            }
        ).limit(50)

        async for scan in cursor:
            coords = scan.get("location", {}).get("coordinates", [])
            if coords and len(coords) == 2:
                heatmap_points.append(
                    {
                        "lat": coords[1],
                        "lon": coords[0],
                        "intensity": 0.8 if scan.get("confidence", 0) > 0.8 else 0.5,
                        "label": scan.get("disease", "Threat"),
                    }
                )
    except Exception as exc:
        print(f"Heatmap query error: {exc}")

    weather = await fetch_live_weather(lat=resolved_lat, lon=resolved_lon)
    disease_risk = weather.get("disease_risk", {})
    risk_score = int(disease_risk.get("risk_score", 0))

    return {
        "success": True,
        "threat_summary": threat_data,
        "heatmap": heatmap_points,
        "environmental_risk": disease_risk,
        "field_health_index": max(0, min(100, 100 - risk_score)),
    }
