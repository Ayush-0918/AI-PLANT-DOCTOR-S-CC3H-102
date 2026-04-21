import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
from uuid import uuid4

import httpx  # type: ignore[import]

from app.core.config import settings
from app.core.errors import DependencyError, ValidationError
from app.core.security import normalize_phone_number


def _ensure_call_config() -> None:
    if not settings.vapi_api_key or not settings.vapi_assistant_id or not settings.vapi_phone_number_id:
        raise DependencyError("Expert call provider not configured.")


async def _save_call_log(db, payload: Dict[str, Any]) -> str:
    if db is None:
        return ""
    call_log_id = str(uuid4())
    await db["expert_call_logs"].insert_one(
        {
            "call_log_id": call_log_id,
            **payload,
            "timestamp": payload.get("timestamp", datetime.now(timezone.utc)),
        }
    )
    return call_log_id


async def trigger_expert_call(
    db,
    phone_number: str,
    user_id: Optional[str],
    reason: str,
    metadata: Optional[Dict[str, Any]] = None,
    max_attempts: int = 3,
) -> Tuple[Dict[str, Any], str]:
    _ensure_call_config()
    try:
        normalized_phone = normalize_phone_number(phone_number)
    except ValueError as exc:
        raise ValidationError(str(exc))

    payload = {
        "assistantId": settings.vapi_assistant_id,
        "phoneNumberId": settings.vapi_phone_number_id,
        "customer": {"number": normalized_phone},
    }
    headers = {
        "Authorization": "Bearer {}".format(settings.vapi_api_key),
        "Content-Type": "application/json",
    }

    last_error = "Unknown failure"
    for attempt in range(1, max_attempts + 1):
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(settings.vapi_url, json=payload, headers=headers)
                body = response.json() if response.text else {}
                if response.status_code in {200, 201}:
                    call_id = str(body.get("id", ""))
                    call_log_id = await _save_call_log(
                        db,
                        {
                            "user_id": user_id or "anonymous",
                            "phone_number": normalized_phone,
                            "reason": reason,
                            "metadata": metadata or {},
                            "attempts": attempt,
                            "provider": "vapi",
                            "provider_response": body,
                            "status": "initiated",
                            "call_id": call_id,
                        },
                    )
                    return {
                        "success": True,
                        "call_id": call_id,
                        "status": "initiated",
                        "attempts": attempt,
                        "message": "Expert call initiated.",
                    }, call_log_id
                last_error = body.get("message") or "Provider returned {}".format(response.status_code)
        except Exception as exc:
            last_error = str(exc)

        if attempt < max_attempts:
            await asyncio.sleep(2 ** (attempt - 1))

    call_log_id = await _save_call_log(
        db,
        {
            "user_id": user_id or "anonymous",
            "phone_number": normalized_phone,
            "reason": reason,
            "metadata": metadata or {},
            "attempts": max_attempts,
            "provider": "vapi",
            "status": "failed",
            "error": last_error,
        },
    )
    return {
        "success": False,
        "status": "failed",
        "attempts": max_attempts,
        "message": "Call could not be initiated. Retry or use support channel.",
    }, call_log_id


def parse_call_status_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    call_id = str(
        payload.get("id")
        or payload.get("callId")
        or payload.get("call_id")
        or payload.get("call", {}).get("id")
        or ""
    ).strip()
    if not call_id:
        raise ValidationError("Webhook payload missing call id")

    raw_status = str(
        payload.get("status")
        or payload.get("call", {}).get("status")
        or payload.get("event")
        or payload.get("message", {}).get("status")
        or "unknown"
    ).strip().lower()

    normalized_status = "unknown"
    if raw_status in {"initiated", "ringing", "queued", "in_progress", "in-progress"}:
        normalized_status = "in_progress"
    elif raw_status in {"ended", "completed", "finished", "success"}:
        normalized_status = "completed"
    elif raw_status in {"failed", "error", "busy", "no-answer", "cancelled", "canceled"}:
        normalized_status = "failed"

    duration_seconds = payload.get("durationSeconds")
    if duration_seconds is None:
        duration_seconds = payload.get("duration")
    if duration_seconds is None:
        duration_seconds = payload.get("call", {}).get("durationSeconds")

    try:
        duration_seconds = int(duration_seconds) if duration_seconds is not None else None
    except Exception:
        duration_seconds = None

    ended_at = (
        payload.get("endedAt")
        or payload.get("endTime")
        or payload.get("call", {}).get("endedAt")
        or datetime.now(timezone.utc).isoformat()
    )

    return {
        "call_id": call_id,
        "raw_status": raw_status,
        "status": normalized_status,
        "duration_seconds": duration_seconds,
        "ended_at": ended_at,
    }


async def update_call_status_from_webhook(db, payload: Dict[str, Any]) -> Dict[str, Any]:
    parsed = parse_call_status_payload(payload)
    if db is None:
        return {
            "updated": False,
            "matched": False,
            "call_id": parsed["call_id"],
            "message": "Database unavailable",
        }

    update_result = await db["expert_call_logs"].update_one(
        {"call_id": parsed["call_id"]},
        {
            "$set": {
                "status": parsed["status"],
                "raw_status": parsed["raw_status"],
                "duration_seconds": parsed["duration_seconds"],
                "ended_at": parsed["ended_at"],
                "provider_webhook_payload": payload,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    matched = update_result.matched_count > 0
    if not matched:
        await db["expert_call_webhooks"].insert_one(
            {
                "call_id": parsed["call_id"],
                "payload": payload,
                "status": parsed["status"],
                "received_at": datetime.now(timezone.utc),
                "resolved": False,
            }
        )

    return {
        "updated": matched,
        "matched": matched,
        "call_id": parsed["call_id"],
        "status": parsed["status"],
    }
