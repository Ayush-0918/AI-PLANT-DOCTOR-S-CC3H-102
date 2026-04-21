from typing import Any, Dict, Optional

from fastapi import Depends, Header, HTTPException, Request

from app.core.config import settings
from app.core.database import get_database
from app.core.rate_limit import InMemoryRateLimiter
from app.core.security import decode_access_token
from app.services.auth_service import get_user_by_id

rate_limiter = InMemoryRateLimiter(
    max_requests=settings.rate_limit_requests,
    window_seconds=settings.rate_limit_window_seconds,
)


def _extract_bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    return authorization.removeprefix("Bearer ").strip()


async def get_optional_user(
    authorization: Optional[str] = Header(default=None),
) -> Optional[Dict[str, Any]]:
    token = _extract_bearer(authorization)
    if not token:
        return None

    try:
        claims = decode_access_token(token)
    except Exception:
        return None

    user_id = claims.get("sub")
    if not user_id:
        return None

    db = get_database()
    if db is None:
        return None
    user_doc = await db["users"].find_one({"user_id": user_id})
    return user_doc


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    token = _extract_bearer(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    try:
        claims = decode_access_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject.")

    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable.")
    user_doc = await get_user_by_id(db, user_id)
    return user_doc


async def get_admin_user(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required.")
    return user


async def enforce_rate_limit(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
) -> None:
    if user:
        key = "user:{}".format(user.get("user_id"))
    else:
        client_host = request.client.host if request.client else "unknown"
        key = "ip:{}".format(client_host)
    await rate_limiter.check(key)

