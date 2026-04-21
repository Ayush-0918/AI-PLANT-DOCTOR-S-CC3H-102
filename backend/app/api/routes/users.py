from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends

from app.api.deps import enforce_rate_limit, get_current_user
from app.core.database import get_database
from app.models.schemas import UserHistoryResponse, UserPublic, PreferencesUpdate

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(enforce_rate_limit)])


@router.get("/me/history", response_model=UserHistoryResponse)
async def get_my_history(user=Depends(get_current_user)) -> UserHistoryResponse:
    db = get_database()
    scans = []
    calls = []
    feedback = []
    
    if db is not None:
        try:
            user_id = user["user_id"]
            scans = await db["scans"].find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(length=30)
            calls = await db["expert_call_logs"].find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(length=30)
            feedback = await db["model_feedback"].find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(length=30)
        except Exception as e:
            import logging
            logging.error(f"Error fetching user history: {e}")

    user_public = UserPublic(
        user_id=user["user_id"],
        name=user["name"],
        phone_number=user["phone_number"],
        role=user.get("role", "farmer"),
        language=user.get("language", "hi"),
        location=user.get("location"),
        soil_type=user.get("soil_type"),
    )
    return UserHistoryResponse(user=user_public, scans=scans, calls=calls, feedback=feedback)


@router.patch("/me/preferences")
async def update_preferences(
    prefs: PreferencesUpdate,
    user=Depends(get_current_user),
):
    db = get_database()
    update_fields: Dict[str, Any] = {}
    if prefs.language is not None:
        update_fields["language"] = prefs.language
    if prefs.location is not None:
        update_fields["location"] = prefs.location
    if prefs.soil_type is not None:
        update_fields["soil_type"] = prefs.soil_type

    if db is not None and update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc)
        await db["users"].update_one(
            {"user_id": user["user_id"]},
            {"$set": update_fields},
        )
    return {
        "success": True,
        "language": update_fields.get("language", user.get("language", "hi")),
        "location": update_fields.get("location", user.get("location")),
        "soil_type": update_fields.get("soil_type", user.get("soil_type")),
    }


@router.get("/me/scans")
async def get_my_scans(user=Depends(get_current_user)):
    db = get_database()
    if db is None:
        return {"success": False, "scans": []}
    scans = await db["scans"].find(
        {"user_id": user["user_id"]},
        {"_id": 0},
    ).sort("timestamp", -1).to_list(length=50)
    return {"success": True, "scans": scans}
