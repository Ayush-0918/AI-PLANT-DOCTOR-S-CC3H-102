from typing import Optional, Tuple

from fastapi import APIRouter, Depends, Query

from app.api.deps import enforce_rate_limit
from app.core.database import get_database
from app.core.errors import DependencyError, ValidationError

from app.services.weather_service import fetch_live_weather

# Optional: Import cache helpers if redis is available
try:
    from app.core.cache import cache_get, cache_set
    cache_available = True
except ImportError:
    cache_available = False
    cache_get = None
    cache_set = None

router = APIRouter(prefix="/geo", tags=["Geo Intelligence"], dependencies=[Depends(enforce_rate_limit)])


def _resolve_coordinates(
    lat: Optional[float],
    lon: Optional[float],
    latitude: Optional[float],
    longitude: Optional[float],
) -> Tuple[float, float]:
    resolved_lat = lat if lat is not None else latitude
    resolved_lon = lon if lon is not None else longitude
    if resolved_lat is None or resolved_lon is None:
        raise ValidationError("Provide coordinates via lat/lon or latitude/longitude.")
    return float(resolved_lat), float(resolved_lon)


@router.get("/weather")
async def geo_weather(
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
    q: Optional[str] = Query(default=None),
):
    if q and q.strip():
        weather = await fetch_live_weather(q=q.strip())
        return {
            "success": True,
            "weather": weather,
            "disease_risk": weather.get("disease_risk", {}),
        }
    else:
        resolved_lat, resolved_lon = _resolve_coordinates(lat, lon, latitude, longitude)
        cache_key = f"weather:{resolved_lat:.2f}:{resolved_lon:.2f}"
        
        # Try to use cache if available
        if cache_available and cache_get:
            cached = await cache_get(cache_key)
            if cached:
                return {
                    "success": True,
                    "weather": cached,
                    "disease_risk": cached.get("disease_risk", {}),
                    "cached": True
                }
        
        weather = await fetch_live_weather(lat=resolved_lat, lon=resolved_lon)
        
        # Store in cache if available
        if cache_available and cache_set:
            await cache_set(cache_key, weather, ttl=1800)  # 30 min cache
        
        return {
            "success": True,
            "weather": weather,
            "disease_risk": weather.get("disease_risk", {}),
            "cached": False
        }


@router.get("/threats")
async def geo_threats(
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
    radius_km: Optional[int] = Query(default=None),
    radius: Optional[int] = Query(default=None),
):
    db = get_database()
    if db is None:
        raise DependencyError("Database unavailable. Threat detection requires live community data.")

    try:
        from app.services.threat_map_service import ThreatMapService  # type: ignore[import]
    except Exception as exc:
        raise DependencyError("Threat mapping service unavailable.", details={"error": str(exc)})

    resolved_lat, resolved_lon = _resolve_coordinates(lat, lon, latitude, longitude)
    resolved_radius = int(radius_km if radius_km is not None else (radius if radius is not None else 10))
    resolved_radius = max(1, min(resolved_radius, 100))

    service = ThreatMapService(db)
    await service.ensure_geospatial_index()
    return await service.check_threats(
        latitude=resolved_lat,
        longitude=resolved_lon,
        radius_km=resolved_radius,
    )
