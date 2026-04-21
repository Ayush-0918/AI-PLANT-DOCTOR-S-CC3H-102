from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException

from app.api.deps import enforce_rate_limit, get_admin_user, get_current_user, get_optional_user
from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import ExpertCallRequest, ExpertCallResponse
from app.services.expert_call_service import trigger_expert_call, update_call_status_from_webhook

router = APIRouter(prefix="/expert", tags=["Expert Calls"], dependencies=[Depends(enforce_rate_limit)])


def _seed_experts() -> list[dict]:
    base = [
        ("Dr. Neha Verma", "Wheat & Paddy Specialist", "Fungal Diseases", "👩‍⚕️", "#10b981"),
        ("Dr. Sukhdeep Singh", "Vegetable Disease Advisor", "Pest Control", "👨‍🔬", "#3b82f6"),
        ("Prof. Meena Rao", "Soil & Nutrition Expert", "Soil Health", "👩‍🌾", "#f59e0b"),
        ("Dr. Iqbal Khan", "Cotton Protection Expert", "Bollworm Control", "👨‍⚕️", "#06b6d4"),
        ("Dr. Arti Sharma", "Tomato & Chili Specialist", "Late Blight", "👩‍🔬", "#ef4444"),
        ("Dr. Amit Patil", "Sugarcane Advisor", "Stalk Borer", "👨‍🌾", "#22c55e"),
        ("Dr. Harpreet Kaur", "Rice Pathology", "Blast & Sheath Blight", "👩‍⚕️", "#8b5cf6"),
        ("Dr. Nitin Yadav", "Maize Agronomist", "Nutrient Deficiency", "👨‍🔬", "#14b8a6"),
        ("Dr. Rehana Ali", "Soybean Disease Lead", "Rust & Mosaic", "👩‍🌾", "#ec4899"),
        ("Dr. Vivek Das", "Irrigation Planner", "Water Management", "👨‍⚕️", "#0ea5e9"),
        ("Dr. Komal Joshi", "Organic Farming Coach", "Biological Control", "👩‍🔬", "#16a34a"),
        ("Dr. Rajeev Saini", "Plant Nutrition Expert", "Micronutrient Plan", "👨‍🌾", "#f97316"),
    ]
    experts: list[dict] = []
    for i in range(48):
        name, role, speciality, avatar, accent = base[i % len(base)]
        is_live = i % 3 != 0
        experts.append({
            "id": f"exp_{uuid4().hex[:10]}",
            "name": name,
            "role": role,
            "status": "Online now" if is_live else "Available in 8 min",
            "isLive": is_live,
            "rating": round(4.6 + ((i % 5) * 0.08), 1),
            "calls": 300 + (i * 37),
            "avatar": avatar,
            "bg": f"linear-gradient(135deg, {accent}18, {accent}0a)",
            "accent": accent,
            "speciality": speciality,
            "crop_focus": ["Wheat", "Rice", "Tomato", "Cotton", "Soybean", "Sugarcane", "Maize"][i % 7],
        })
    return experts


def _fallback_experts(crop: str, limit: int) -> list[dict]:
    seed = _seed_experts()
    clean_crop = crop.strip().lower()
    if clean_crop and clean_crop != "all":
        seed = [item for item in seed if clean_crop in item.get("crop_focus", "").lower()]
    return seed[:limit]


@router.post("/call", response_model=ExpertCallResponse)
async def request_expert_call(
    request: ExpertCallRequest,
    user=Depends(get_optional_user),
) -> ExpertCallResponse:
    db = get_database()
    response, call_log_id = await trigger_expert_call(
        db=db,
        phone_number=request.phone_number,
        user_id=user.get("user_id") if user else None,
        reason=request.reason,
        metadata={**request.metadata, "prediction_id": request.prediction_id},
    )
    return ExpertCallResponse(
        **response,
        message="{} log_id={}".format(response["message"], call_log_id if call_log_id else "none"),
    )


@router.get("/history")
async def my_call_history(user=Depends(get_current_user)):
    db = get_database()
    if db is None:
        return {"success": True, "calls": []}
    calls = await db["expert_call_logs"].find(
        {"user_id": user["user_id"]},
        {"_id": 0},
    ).sort("timestamp", -1).to_list(length=30)
    return {"success": True, "calls": calls}


@router.post("/webhook/vapi")
async def vapi_webhook_update(
    payload: dict,
    x_webhook_token: str = Header(default="", alias="x-webhook-token"),
):
    if settings.vapi_webhook_secret:
        if x_webhook_token != settings.vapi_webhook_secret:
            raise HTTPException(status_code=401, detail="Invalid webhook token.")
    elif settings.app_env == "production":
        raise HTTPException(status_code=503, detail="Webhook secret not configured.")

    db = get_database()
    result = await update_call_status_from_webhook(db, payload)
    return {"success": True, **result}


@router.get("/analytics")
async def call_analytics(window_days: int = 7, _admin=Depends(get_admin_user)):
    db = get_database()
    if db is None:
        return {
            "success": True,
            "window_days": max(1, min(window_days, 90)),
            "total_calls": 0,
            "completed_calls": 0,
            "failed_calls": 0,
            "in_progress_calls": 0,
            "avg_attempts": None,
            "success_rate_pct": None,
        }

    bounded_window = max(1, min(window_days, 90))
    since = datetime.now(timezone.utc) - timedelta(days=bounded_window)
    logs = await db["expert_call_logs"].find(
        {"timestamp": {"$gte": since}},
        {"_id": 0, "status": 1, "attempts": 1},
    ).to_list(length=50000)

    total_calls = len(logs)
    completed_calls = 0
    failed_calls = 0
    in_progress_calls = 0
    attempts = []
    for row in logs:
        status = str(row.get("status", "")).strip().lower()
        if status == "completed":
            completed_calls += 1
        elif status == "failed":
            failed_calls += 1
        else:
            in_progress_calls += 1

        attempt = row.get("attempts")
        if isinstance(attempt, int) and attempt > 0:
            attempts.append(attempt)

    settled_calls = completed_calls + failed_calls
    success_rate_pct = round(100.0 * completed_calls / settled_calls, 2) if settled_calls else None
    avg_attempts = round(sum(attempts) / len(attempts), 2) if attempts else None

    return {
        "success": True,
        "window_days": bounded_window,
        "total_calls": total_calls,
        "completed_calls": completed_calls,
        "failed_calls": failed_calls,
        "in_progress_calls": in_progress_calls,
        "avg_attempts": avg_attempts,
        "success_rate_pct": success_rate_pct,
    }


@router.get("/directory")
async def expert_directory(crop: str = "", limit: int = 48):
    bounded_limit = max(1, min(limit, 100))
    clean_crop = crop.strip()

    db = get_database()
    if db is None:
        experts = _fallback_experts(clean_crop, bounded_limit)
        return {"success": True, "total": len(experts), "experts": experts}

    collection = db["experts_directory"]
    total_docs = await collection.count_documents({})
    if total_docs == 0:
        await collection.insert_many(_seed_experts())

    query = {}
    if clean_crop and clean_crop.lower() != "all":
        query = {"crop_focus": {"$regex": "^{}$".format(clean_crop), "$options": "i"}}

    total = await collection.count_documents(query)
    experts = await collection.find(query, {"_id": 0}).sort(
        [("isLive", -1), ("rating", -1), ("calls", -1)]
    ).to_list(length=bounded_limit)

    if not experts:
        experts = _fallback_experts(clean_crop, bounded_limit)
        total = len(experts)

    return {"success": True, "total": total, "experts": experts}
