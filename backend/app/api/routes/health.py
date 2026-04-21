from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.api.deps import enforce_rate_limit
from app.core.database import get_database
from app.services.model_registry_service import get_active_model

router = APIRouter(prefix="/health", tags=["Health"], dependencies=[Depends(enforce_rate_limit)])


@router.get("")
async def health_check():
    db = get_database()
    db_ok = False
    if db is not None:
        try:
            await db.command("ping")
            db_ok = True
        except Exception:
            db_ok = False

    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "dependencies": {
            "database": "connected" if db_ok else "disconnected",
            "active_model": get_active_model(),
        },
    }

