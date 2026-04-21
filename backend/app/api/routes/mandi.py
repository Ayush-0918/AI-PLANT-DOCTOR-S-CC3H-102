import os
import logging
import csv
from typing import List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.mandi_trend_service import mandi_trend_service
from app.services.dataset_locator_service import (
    AGRICULTURE_PRICE_DATASET_CANDIDATES,
    first_existing_path,
)

router = APIRouter(prefix="/mandi", tags=["Mandi"])
logger = logging.getLogger(__name__)

# OGD Portal Details (Mandi Prices)
DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY") # User should add this to .env
MANDI_RESOURCE_ID = "9ef27c38-7f0e-4341-860e-48a0a8117765"
API_URL = f"https://api.data.gov.in/resource/{MANDI_RESOURCE_ID}"

# Simple in-memory cache
_mandi_cache = {
    "data": [],
    "last_updated": 0,
    "expiry": 3600 # 1 hour
}

class MandiPrice(BaseModel):
    state: str
    district: str
    market: str
    commodity: str
    variety: str
    min_price: float
    max_price: float
    modal_price: float
    date: str

class MandiResponse(BaseModel):
    success: bool
    data: List[MandiPrice]
    count: int
    source: str = "local" # "live" or "local"

@router.get("/trends")
async def get_mandi_trends(
    state: Optional[str] = Query(None),
    commodity: Optional[str] = Query(None)
):
    trends = mandi_trend_service.get_crop_trends(state=state, commodity=commodity)
    return {
        "success": True,
        "trends": trends,
        "count": len(trends)
    }

@router.get("/prices", response_model=MandiResponse)
async def get_mandi_prices(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    commodity: Optional[str] = Query(None),
    limit: int = Query(20)
):
    # Logic for Mandi Prices (as implemented before)
    # 1. Try Live OGD API
    if DATA_GOV_API_KEY:
        try:
            import httpx
            params = {
                "api-key": DATA_GOV_API_KEY,
                "format": "json",
                "limit": limit
            }
            if state: params["filters[state]"] = state
            if commodity: params["filters[commodity]"] = commodity
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(API_URL, params=params)
                if resp.status_code == 200:
                    raw = resp.json()
                    records = raw.get("records", [])
                    data = [
                        MandiPrice(
                            state=r["state"], district=r["district"], market=r["market"],
                            commodity=r["commodity"], variety=r["variety"],
                            min_price=float(r["min_price"]), max_price=float(r["max_price"]),
                            modal_price=float(r["modal_price"]), date=r["arrival_date"]
                        ) for r in records
                    ]
                    return MandiResponse(success=True, data=data, count=len(data), source="live")
        except Exception as e:
            logger.error(f"Live Mandi API Failed: {e}")

    # 2. Fallback to Local CSV
    try:
        actual_csv = first_existing_path(AGRICULTURE_PRICE_DATASET_CANDIDATES)
        if actual_csv is None:
            return MandiResponse(success=False, data=[], count=0, source="error")

        data = []
        with open(actual_csv, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if state and state.lower() not in row.get("STATE", "").lower(): continue
                if commodity and commodity.lower() not in row.get("Commodity", "").lower(): continue
                
                data.append(MandiPrice(
                    state=row["STATE"], district=row.get("District Name", "Unknown"), 
                    market=row.get("Market Name", "Unknown"), commodity=row["Commodity"],
                    variety=row.get("Variety", "Other"), min_price=float(row["Min_Price"]),
                    max_price=float(row["Max_Price"]), modal_price=float(row["Modal_Price"]),
                    date=row.get("Price Date", "N/A")
                ))
                if len(data) >= limit: break
        
        return MandiResponse(success=True, data=data, count=len(data), source="local")
    except Exception as e:
        logger.error(f"CSV Mandi Failed: {e}")
        return MandiResponse(success=False, data=[], count=0, source="error")
