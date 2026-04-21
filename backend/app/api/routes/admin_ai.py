import json
from pathlib import Path
from datetime import datetime, timezone
import csv

from fastapi import APIRouter, Depends

from app.api.deps import enforce_rate_limit, get_admin_user
from app.core.config import settings
from app.core.database import get_database
from app.core.errors import ValidationError
from app.services.model_registry_service import get_active_model, get_registry, upsert_model
from app.services.prediction_log_service import (
    get_feedback_accuracy_summary,
    get_observability_snapshot,
)

router = APIRouter(prefix="/admin/ai", tags=["Admin AI"], dependencies=[Depends(enforce_rate_limit)])

PROJECT_ROOT = Path(__file__).resolve().parents[4]
GENERATED_DIR = PROJECT_ROOT / "backend" / "data" / "generated"
TREATMENT_PATH = GENERATED_DIR / "treatment_knowledge.csv"
TRANSLATION_PATH = GENERATED_DIR / "translations_core.csv"
CROP_RECOMMENDATION_PATH = GENERATED_DIR / "crop_recommendation.csv"
FERTILIZER_RECOMMENDATION_PATH = GENERATED_DIR / "fertilizer_recommendation.csv"
GROWTH_CARE_PATH = GENERATED_DIR / "plant_growth_care_recommendations.csv"


def _csv_row_count(path: Path) -> int:
    if not path.exists():
        return 0
    with path.open("r", encoding="utf-8", newline="") as file_obj:
        reader = csv.reader(file_obj)
        rows = list(reader)
    if not rows:
        return 0
    return max(0, len(rows) - 1)


def _data_readiness_payload() -> dict:
    counts = {
        "treatment_knowledge_rows": _csv_row_count(TREATMENT_PATH),
        "translations_rows": _csv_row_count(TRANSLATION_PATH),
        "crop_recommendation_rows": _csv_row_count(CROP_RECOMMENDATION_PATH),
        "fertilizer_recommendation_rows": _csv_row_count(FERTILIZER_RECOMMENDATION_PATH),
        "growth_care_rows": _csv_row_count(GROWTH_CARE_PATH),
    }
    targets = {
        "treatment_knowledge_rows": 500,
        "translations_rows": 1000,
        "crop_recommendation_rows": 540,
        "fertilizer_recommendation_rows": 720,
    }
    meets_targets = all(counts.get(key, 0) >= target for key, target in targets.items())
    files_present = all(
        path.exists()
        for path in [
            TREATMENT_PATH,
            TRANSLATION_PATH,
            CROP_RECOMMENDATION_PATH,
            FERTILIZER_RECOMMENDATION_PATH,
            GROWTH_CARE_PATH,
        ]
    )

    return {
        "success": files_present and meets_targets,
        "generated_dir": str(GENERATED_DIR),
        "files_present": files_present,
        "meets_targets": meets_targets,
        "targets": targets,
        "counts": counts,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/model/accuracy")
async def model_accuracy(window_hours: int = 24 * 30):
    db = get_database()
    payload = {
        "status": "Not Trained",
        "error": "accuracy.json missing",
        "active_model": get_active_model(),
    }
    if settings.accuracy_path.exists():
        try:
            payload = json.loads(settings.accuracy_path.read_text(encoding="utf-8"))
            payload["active_model"] = get_active_model()
        except Exception as exc:
            payload = {
                "status": "Error",
                "error": "Failed to parse accuracy file",
                "details": str(exc),
                "active_model": get_active_model(),
            }
    payload["feedback_summary"] = await get_feedback_accuracy_summary(db, hours=window_hours)

    if settings.field_validation_report_path.exists():
        try:
            payload["field_validation"] = json.loads(
                settings.field_validation_report_path.read_text(encoding="utf-8")
            )
        except Exception as exc:
            payload["field_validation"] = {
                "status": "error",
                "message": "Failed to parse field validation report",
                "details": str(exc),
            }
    else:
        payload["field_validation"] = {
            "status": "missing",
            "message": "field_validation_report.json not found",
        }

    return payload


@router.get("/model/registry")
async def model_registry():
    return get_registry()


@router.get("/data-readiness")
async def data_readiness(_admin=Depends(get_admin_user)):
    return _data_readiness_payload()


@router.post("/model/registry/activate")
async def activate_model_registry(
    model_version: str,
    architecture: str,
    _admin=Depends(get_admin_user),
):
    model_version = model_version.strip()
    if not model_version:
        raise ValidationError("model_version is required")

    payload = {
        "model_version": model_version,
        "architecture": architecture.strip(),
        "status": "active",
        "activated_at": datetime.now(timezone.utc).isoformat(),
        "confidence_threshold": settings.ai_confidence_threshold,
    }
    registry = upsert_model(payload, set_active=True)
    return {"success": True, "active_model": registry.get("active_model")}


@router.get("/observability")
async def observability(window_hours: int = 24):
    db = get_database()
    snapshot = await get_observability_snapshot(db, hours=window_hours)
    snapshot["active_model"] = get_active_model()
    return snapshot


@router.get("/readiness")
async def readiness(_admin=Depends(get_admin_user)):
    db = get_database()
    checks = []

    db_connected = False
    if db is not None:
        try:
            await db.command("ping")
            db_connected = True
        except Exception:
            db_connected = False
    checks.append(
        {
            "name": "database_connected",
            "status": "pass" if db_connected else "fail",
            "message": "MongoDB reachable" if db_connected else "MongoDB unreachable",
        }
    )

    checks.append(
        {
            "name": "legacy_mocks_disabled",
            "status": "pass" if not settings.allow_legacy_mocks else "fail",
            "message": "ALLOW_LEGACY_MOCKS=false required for production",
        }
    )

    secret_is_default = settings.jwt_secret_key.strip() in {"", "change-me-in-production"}
    secret_is_short = len(settings.jwt_secret_key.strip()) < 24
    jwt_ok = not secret_is_default and not secret_is_short
    checks.append(
        {
            "name": "jwt_secret_strength",
            "status": "pass" if jwt_ok else "fail",
            "message": "JWT secret appears strong" if jwt_ok else "JWT secret missing/weak",
        }
    )

    weather_configured = bool(settings.openweather_api_key)
    checks.append(
        {
            "name": "weather_provider_configured",
            "status": "pass" if weather_configured else "fail",
            "message": "OPENWEATHER_API_KEY configured" if weather_configured else "OPENWEATHER_API_KEY missing",
        }
    )

    call_provider_ok = bool(settings.vapi_api_key and settings.vapi_assistant_id and settings.vapi_phone_number_id)
    checks.append(
        {
            "name": "expert_call_provider_configured",
            "status": "pass" if call_provider_ok else "fail",
            "message": "Vapi outbound credentials configured" if call_provider_ok else "Vapi credentials incomplete",
        }
    )

    webhook_secret_configured = bool(settings.vapi_webhook_secret)
    checks.append(
        {
            "name": "webhook_secret_configured",
            "status": "pass" if webhook_secret_configured else "warn",
            "message": "Webhook secret configured" if webhook_secret_configured else "Set VAPI_WEBHOOK_SECRET before public launch",
        }
    )

    active_model = get_active_model()
    has_model = bool(active_model.get("model_version"))
    checks.append(
        {
            "name": "active_model_registered",
            "status": "pass" if has_model else "fail",
            "message": "Active model version available" if has_model else "No active model version in registry",
        }
    )

    data_readiness = _data_readiness_payload()
    checks.append(
        {
            "name": "knowledge_data_generated",
            "status": "pass" if data_readiness["success"] else "fail",
            "message": (
                "Knowledge/recommendation CSV bundle present and row targets satisfied"
                if data_readiness["success"]
                else "Regenerate CSV bundle via generate_knowledge_assets.py"
            ),
            "details": data_readiness.get("counts", {}),
        }
    )

    field_report_ok = False
    field_accuracy = None
    if settings.field_validation_report_path.exists():
        try:
            field_payload = json.loads(settings.field_validation_report_path.read_text(encoding="utf-8"))
            field_accuracy = field_payload.get("field_accuracy_pct", field_payload.get("overall_accuracy_pct"))
            field_report_ok = field_accuracy is not None
        except Exception:
            field_report_ok = False
    checks.append(
        {
            "name": "field_validation_available",
            "status": "pass" if field_report_ok else "fail",
            "message": (
                "Field validation report present (accuracy: {}%)".format(field_accuracy)
                if field_report_ok
                else "Run evaluate_field.py and publish field_validation_report.json"
            ),
        }
    )

    pass_count = sum(1 for check in checks if check["status"] == "pass")
    warn_count = sum(1 for check in checks if check["status"] == "warn")
    blockers = [check for check in checks if check["status"] == "fail"]
    warnings = [check for check in checks if check["status"] == "warn"]
    readiness_score = round(((pass_count + 0.5 * warn_count) / max(1, len(checks))) * 100, 1)

    return {
        "success": len(blockers) == 0,
        "readiness_score_pct": readiness_score,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "blockers": blockers,
        "warnings": warnings,
        "checks": checks,
    }
