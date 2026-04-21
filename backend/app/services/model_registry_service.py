import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from app.core.config import settings


def _read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _default_registry() -> Dict[str, Any]:
    accuracy = _read_json(settings.accuracy_path)
    model_version = accuracy.get("model_version", "pv-mobilenetv3-legacy")
    return {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "active_model": {
            "model_version": model_version,
            "architecture": accuracy.get("model", "MobileNetV3_Large"),
            "status": accuracy.get("status", "Unknown"),
            "accuracy_pct": accuracy.get("accuracy_pct"),
            "dataset_classes": accuracy.get("dataset_classes"),
            "train_samples": accuracy.get("train_samples"),
            "val_samples": accuracy.get("val_samples"),
            "confidence_threshold": settings.ai_confidence_threshold,
            "source": "accuracy.json",
        },
        "models": [],
    }


def get_registry() -> Dict[str, Any]:
    raw = _read_json(settings.model_registry_path)
    if not raw:
        raw = _default_registry()
        _write_json(settings.model_registry_path, raw)
    return raw


def get_active_model() -> Dict[str, Any]:
    registry = get_registry()
    active = registry.get("active_model") or {}
    if not active:
        return _default_registry()["active_model"]
    return active


def list_models() -> List[Dict[str, Any]]:
    registry = get_registry()
    models = registry.get("models", [])
    if isinstance(models, list):
        return models
    return []


def upsert_model(model_payload: Dict[str, Any], set_active: bool = True) -> Dict[str, Any]:
    registry = get_registry()
    models = list_models()

    version = str(model_payload.get("model_version", "")).strip()
    if not version:
        raise ValueError("model_version is required")

    model_payload = {
        **model_payload,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    replaced = False
    for idx, entry in enumerate(models):
        if entry.get("model_version") == version:
            models[idx] = {**entry, **model_payload}
            replaced = True
            break

    if not replaced:
        models.append(model_payload)

    registry["models"] = models[-100:]
    registry["updated_at"] = datetime.now(timezone.utc).isoformat()
    if set_active:
        registry["active_model"] = model_payload

    _write_json(settings.model_registry_path, registry)
    return registry

