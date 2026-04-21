import os
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.ai_model import ai_model
from app.core.config import settings
from app.core.errors import DependencyError, ValidationError
from app.services.knowledge_base_service import (
    get_growth_care_recommendations,
    get_localized_treatment_summary,
    get_localized_medicine,
    normalize_language,
    get_treatment_record,
)
from app.services.model_registry_service import get_active_model
from app.services.prediction_log_service import image_sha256, log_prediction
from app.services.weather_service import fetch_live_weather

import io
try:
    from PIL import Image
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
except ImportError:
    Image = None
    torch = None


BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _resolve_severity_from_weather_risk(risk_payload: Dict[str, Any]) -> str:
    score = float(risk_payload.get("risk_score", 0))
    if score >= 85:
        return "critical"
    if score >= 70:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _extract_crop_name(diagnosis_class: str) -> str:
    raw_crop = diagnosis_class.split("___", 1)[0]
    return raw_crop.replace("_(maize)", " (maize)").replace("_", " ").replace(",", "").strip()


async def run_scan_inference(
    db,
    image_bytes: bytes,
    lat: float,
    lon: float,
    user_id: Optional[str],
    source: str = "api_v1",
    language: str = "English",
    stage: str = "vegetative",
) -> Dict[str, Any]:
    started = time.perf_counter()
    result = ai_model.predict(image_bytes)
    latency_ms = round((time.perf_counter() - started) * 1000, 2)

    if not result.get("success"):
        raise ValidationError(result.get("error", "AI model prediction failed."))

    diagnosis = result.get("diagnosis", "Unknown")
    confidence_pct = float(result.get("confidence", 0.0))
    class_id = result.get("class_id", "unknown")
    treatment = result.get("treatment", {})
    model_meta = get_active_model()
    model_version = model_meta.get("model_version", "pv-mobilenetv3-legacy")

    weather_payload: Optional[Dict[str, Any]] = None
    weather_risk: Dict[str, Any] = {"risk_score": 0, "risk_level": "low", "reasons": []}
    try:
        weather_payload = await fetch_live_weather(lat=lat, lon=lon)
        weather_risk = weather_payload.get("disease_risk", weather_risk)
    except Exception as exc:
        weather_payload = {
            "source": "openweathermap_unavailable",
            "error": str(exc),
        }

    severity = _resolve_severity_from_weather_risk(weather_risk)
    treatment_record = get_treatment_record(
        disease_class=diagnosis,
        stage=stage,
        severity=severity,
    )
    localized_summary = get_localized_treatment_summary(treatment_record, language)
    crop_name = _extract_crop_name(diagnosis)
    growth_care = get_growth_care_recommendations(
        crop=crop_name,
        stage=stage,
        weather_risk=str(weather_risk.get("risk_level", "medium")),
        language=language,
        limit=4,
    )

    escalation_required = confidence_pct < settings.ai_confidence_threshold or diagnosis.lower() == "unknown"
    escalation_reason = None
    if escalation_required:
        escalation_reason = "low_confidence" if confidence_pct < settings.ai_confidence_threshold else "unknown_diagnosis"

    normalized_user_id = user_id or "anonymous"
    persisted = db is not None
    prediction_id = ""

    scan_doc = {
        "user_id": normalized_user_id,
        "disease": diagnosis,
        "confidence": confidence_pct,
        "class_id": class_id,
        "model_version": model_version,
        "escalation_required": escalation_required,
        "location": {"type": "Point", "coordinates": [lon, lat]},
        "source": source,
        "timestamp": datetime.now(timezone.utc),
    }

    prediction_doc = {
        "user_id": normalized_user_id,
        "diagnosis": diagnosis,
        "confidence_pct": confidence_pct,
        "class_id": class_id,
        "latency_ms": latency_ms,
        "model_version": model_version,
        "escalation_required": escalation_required,
        "escalation_reason": escalation_reason,
        "threshold_pct": settings.ai_confidence_threshold,
        "image_hash": image_sha256(image_bytes),
        "source": source,
        "timestamp": datetime.now(timezone.utc),
    }

    if db is not None:
        await db["scans"].insert_one(scan_doc)
        prediction_id = await log_prediction(db, prediction_doc)
        await db["users"].update_one(
            {"user_id": normalized_user_id},
            {"$inc": {"total_scans": 1}, "$set": {"last_active_at": datetime.now(timezone.utc)}},
            upsert=True,
        )

    default_recommendation_action = (
        "Confidence low. Connect to human agronomist before spraying."
        if escalation_required
        else (
            "Crop looks healthy. Continue routine monitoring."
            if "healthy" in diagnosis.lower()
            else "Disease detected. Follow treatment and re-scan in 48 hours."
        )
    )
    recommendation_action = localized_summary or default_recommendation_action
    summary_en = get_localized_treatment_summary(treatment_record, "English")
    summary_hi = get_localized_treatment_summary(treatment_record, "हिंदी")
    normalized_language = normalize_language(language)
    if summary_en and summary_hi and summary_en.strip() != summary_hi.strip():
        if normalized_language == "English":
            recommendation_action = summary_en
        elif normalized_language == "हिंदी":
            recommendation_action = summary_hi
    elif not recommendation_action and summary_en:
        recommendation_action = summary_en

    merged_treatment: Dict[str, Any] = dict(treatment)
    if treatment_record:
        raw_med = treatment_record.get("medicine_name", merged_treatment.get("medicine"))
        localized_med = get_localized_medicine(raw_med, language)
        merged_treatment.update(
            {
                "medicine": localized_med,
                "raw_medicine": raw_med,
                "dosage": treatment_record.get("dosage_per_liter", merged_treatment.get("dosage")),
                "instructions": treatment_record.get("cultural_control", merged_treatment.get("instructions")),
                "active_ingredient": treatment_record.get("active_ingredient"),
                "dosage_per_acre": treatment_record.get("dosage_per_acre"),
                "spray_interval_days": treatment_record.get("spray_interval_days"),
                "waiting_period_days": treatment_record.get("waiting_period_days"),
                "recovery_window_days": treatment_record.get("recovery_window_days"),
                "irrigation_advice": treatment_record.get("irrigation_advice"),
                "chemical_control": treatment_record.get("chemical_control"),
                "precautionary_notes": treatment_record.get("precautionary_notes"),
                "escalation_rule": treatment_record.get("escalation_rule"),
            }
        )

    return {
        "success": True,
        "prediction_id": prediction_id or None,
        "diagnosis": {
            "name": diagnosis,
            "class_id": class_id,
            "confidence": confidence_pct,
            "treatment": merged_treatment,
            "model_version": model_version,
        },
        "escalation_required": escalation_required,
        "escalation_reason": escalation_reason,
        "confidence_threshold": settings.ai_confidence_threshold,
        "context": {
            "language": language,
            "stage": stage,
            "severity": severity,
        },
        "weather": weather_payload,
        "disease_risk": weather_risk,
        "knowledge": {
            "treatment_record": treatment_record,
            "localized_summary": localized_summary,
            "summary_en": summary_en,
            "summary_hi": summary_hi,
            "growth_care_recommendations": growth_care,
        },
        "recommendation": {
            "action": recommendation_action,
            "action_en": summary_en or default_recommendation_action,
            "action_hi": summary_hi,
        },
        "observability": {
            "latency_ms": latency_ms,
            "persisted": persisted,
            "source": source,
        },
    }


async def run_soil_inference(
    image_bytes: bytes,
    model_path: str = "soil_classifier.pth",
    labels_path: str = "soil_labels.txt"
) -> Dict[str, Any]:
    """
    Attempts to use a custom trained PyTorch model for soil classification.
    Returns success=False if model is not found, allowing fallback to OCR.
    """
    resolved_model_path = Path(model_path)
    if not resolved_model_path.is_absolute():
        resolved_model_path = BACKEND_ROOT / resolved_model_path

    resolved_labels_path = Path(labels_path)
    if not resolved_labels_path.is_absolute():
        resolved_labels_path = BACKEND_ROOT / resolved_labels_path

    if not torch or not Image or not resolved_model_path.exists():
        return {"success": False, "reason": "Model file or dependencies missing"}

    try:
        # 1. Load Labels
        if resolved_labels_path.exists():
            with open(resolved_labels_path, 'r') as f:
                classes = [line.strip() for line in f.readlines() if line.strip()]
        else:
            classes = ["Alluvial Soil", "Black Soil", "Cinder Soil", "Red Soil"] # Default fallback

        # 2. Detect Device (Match training script)
        device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

        # 3. Load Model
        model = models.resnet18()
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, len(classes)) 
        
        model.load_state_dict(torch.load(str(resolved_model_path), map_location=device))
        model.to(device)
        model.eval()

        # 4. Preprocess
        preprocess = transforms.Compose([
            transforms.Resize(256), transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_tensor = preprocess(img).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(input_tensor)
            _, preds = torch.max(outputs, 1)
            confidence = torch.nn.functional.softmax(outputs, dim=1)[0][preds[0]].item()

        predicted_class = classes[preds[0]]

        if confidence < 0.65:
            return {"success": False, "reason": "Image not recognized. Please provide a clear soil photo."}

        return {
            "success": True,
            "diagnosis": predicted_class,
            "confidence": round(confidence * 100, 2),
            "model_version": "custom-soil-v1"
        }
    except Exception as e:
        return {"success": False, "reason": str(e)}
