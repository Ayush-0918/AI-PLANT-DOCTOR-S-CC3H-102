from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import enforce_rate_limit, get_current_user, get_optional_user
from app.core.database import get_database
from app.core.errors import ValidationError
from app.models.schemas import (
    DosageRequest,
    DosageResponse,
    GrowthCareResponse,
    PredictionFeedbackRequest,
    PredictionFeedbackResponse,
    ScanReportRequest,
    ScanReportResponse,
    ScanResponse,
    SoilReportResponse,
)
from app.services.ai_inference_service import run_scan_inference, run_soil_inference
from app.services.knowledge_base_service import get_growth_care_recommendations, get_treatment_record
from app.services.prediction_log_service import store_feedback
from app.services.report_service import generate_scan_report
from app.services.soil_advice_service import build_soil_report_from_ocr, build_soil_report_from_prediction
import io
try:
    from PIL import Image
    import pytesseract
except ImportError:
    Image = None
    pytesseract = None

router = APIRouter(prefix="/ai", tags=["AI"], dependencies=[Depends(enforce_rate_limit)])


@router.post("/scan", response_model=ScanResponse)
async def scan_crop(
    image: UploadFile = File(...),
    lat: float = Form(0.0),
    lon: float = Form(0.0),
    user_id: Optional[str] = Form(default=None),
    language: str = Form(default="English"),
    stage: str = Form(default="vegetative"),
    user=Depends(get_optional_user),
) -> ScanResponse:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise ValidationError("Uploaded file must be an image.")
    image_bytes = await image.read()
    if not image_bytes:
        raise ValidationError("Empty image upload.")

    resolved_user_id = user.get("user_id") if user else user_id
    db = get_database()
    response = await run_scan_inference(
        db=db,
        image_bytes=image_bytes,
        lat=lat,
        lon=lon,
        user_id=resolved_user_id,
        source="api_v1_scan",
        language=language,
        stage=stage,
    )
    return ScanResponse(**response)


# ── Dosage instruction templates per language ──────────────────────────────
_DOSAGE_INSTRS = {
    "हिंदी": (
        "{crop} की पत्तियों पर समान रूप से छिड़काव करें। "
        "{window} में छिड़काव को प्राथमिकता दें और 48 घंटे बाद खेत की जाँच करें।"
    ),
    "ਪੰਜਾਬੀ": (
        "{crop} ਦੇ ਪੱਤਿਆਂ 'ਤੇ ਬਰਾਬਰ ਛਿੜਕਾਅ ਕਰੋ। "
        "{window} ਵਿੱਚ ਛਿੜਕਾਅ ਕਰੋ ਅਤੇ 48 ਘੰਟਿਆਂ ਬਾਅਦ ਖੇਤ ਦੀ ਜਾਂਚ ਕਰੋ।"
    ),
    "मराठी": (
        "{crop} च्या पानांवर समान प्रमाणात फवारणी करा। "
        "{window} मध्ये फवारणी करा आणि 48 तासांनंतर शेताची तपासणी करा।"
    ),
    "ગુજરાતી": (
        "{crop} ના પાન પર સમાન છંટકાવ કરો। "
        "{window} માં છંટકાવ કરો અને 48 કલાક પછી ખેતર ચકાસો।"
    ),
    "తెలుగు": (
        "{crop} ఆకులపై సమానంగా పిచికారీ చేయండి। "
        "{window} లో పిచికారీ చేయండి మరియు 48 గంటల తర్వాత పొలాన్ని తనిఖీ చేయండి।"
    ),
    "भोजपुरी": (
        "{crop} के पत्तन पर बराबर छिड़काव करीं। "
        "{window} में छिड़काव करीं आउर 48 घंटा बाद खेत जाँचीं।"
    ),
    "मैथिली": (
        "{crop} के पत्तिन पर समान छिड़काव करीं। "
        "{window} में छिड़काव करीं आउर 48 घंटा बाद खेत जाँचीं।"
    ),
}

_SPRAY_WINDOW_TRANS = {
    "हिंदी": {"early morning": "सुबह जल्दी", "early morning in zone-wise batches": "सुबह जल्दी, क्षेत्र-वार"},
    "ਪੰਜਾਬੀ": {"early morning": "ਸਵੇਰੇ ਜਲਦੀ", "early morning in zone-wise batches": "ਸਵੇਰੇ ਜਲਦੀ, ਜ਼ੋਨ-ਵਾਰ"},
    "मराठी": {"early morning": "पहाटे लवकर", "early morning in zone-wise batches": "पहाटे लवकर, क्षेत्रवार"},
    "ગુજરાતી": {"early morning": "વહેલી સવારે", "early morning in zone-wise batches": "વહેલી સવારે, ઝોન-વાઇઝ"},
    "తెలుగు": {"early morning": "తెల్లవారుజామున", "early morning in zone-wise batches": "తెల్లవారుజామున, జోన్-వారీ"},
    "भोजपुरी": {"early morning": "सुबह जल्दी", "early morning in zone-wise batches": "सुबह जल्दी, क्षेत्र-वार"},
    "मैथिली": {"early morning": "भोरे जल्दी", "early morning in zone-wise batches": "भोरे जल्दी, क्षेत्र-वार"},
}

_WARNINGS_TRANS = {
    "हिंदी": "सुरक्षात्मक उपकरण पहनें और तेज हवा या बारिश में छिड़काव से बचें।",
    "ਪੰਜਾਬੀ": "ਸੁਰੱਖਿਆ ਉਪਕਰਣ ਪਹਿਨੋ ਅਤੇ ਤੇਜ਼ ਹਵਾ ਜਾਂ ਮੀਂਹ ਵਿੱਚ ਛਿੜਕਾਅ ਤੋਂ ਬਚੋ।",
    "मराठी": "संरक्षणात्मक साहित्य घाला आणि वारा किंवा पावसात फवारणी टाळा।",
    "ગુજરાતી": "સુરક્ષા સાધનો પહેરો અને તેઝ પવન કે વરસાદમાં છંટકાવ ટાળો।",
    "తెలుగు": "రక్షణాత్మక పరికరాలు ధరించండి మరియు గాలి లేదా వర్షంలో పిచికారీ నివారించండి।",
    "भोजपुरी": "सुरक्षा गियर पहिरीं आउर तेज हवा या बरसात में छिड़काव से बचीं।",
    "मैथिली": "सुरक्षात्मक सामान पहिरीं आउर तेज हवा या वर्षा में छिड़काव से बचीं।",
}


@router.post("/dosage", response_model=DosageResponse)
async def calculate_dosage(request: DosageRequest) -> DosageResponse:
    area = float(request.area_acres)
    crop_name = request.crop.strip()
    disease_name = (request.disease or "general_crop_stress").strip()
    lang = getattr(request, "language", "English") or "English"

    base_chemical_liters = max(0.3, round(0.5 * area, 2))
    base_water_liters = max(60, int(round(100 * area)))
    spray_window_en = "early morning" if area <= 5 else "early morning in zone-wise batches"

    # Translate spray window
    window_trans = _SPRAY_WINDOW_TRANS.get(lang, {})
    spray_window = window_trans.get(spray_window_en, spray_window_en)

    # Build instructions in the right language
    instr_tmpl = _DOSAGE_INSTRS.get(lang)
    if instr_tmpl:
        instructions = instr_tmpl.format(crop=crop_name, window=spray_window)
    else:
        instructions = (
            "Apply uniform leaf coverage on {}. Prefer {} and re-check field after 48 hours."
        ).format(crop_name, spray_window_en)

    warnings = _WARNINGS_TRANS.get(
        lang,
        "Wear protective gear and avoid spraying during strong wind or active rainfall.",
    )

    return DosageResponse(
        dosage_exact={
            "chemical": "{:.1f} Liters".format(base_chemical_liters),
            "water_mix": "{} Liters".format(base_water_liters),
        },
        instructions=instructions,
        ai_analysis={
            "target_disease": disease_name,
            "spray_strategy": "dose_scaled_by_area",
            "note": "Always confirm dosage label for the selected chemical before spraying.",
        },
        warnings=warnings,
    )


@router.get("/growth-care", response_model=GrowthCareResponse)
async def growth_care(
    crop: str,
    stage: str = "vegetative",
    weather_risk: str = "medium",
    language: str = "English",
) -> GrowthCareResponse:
    recommendations = get_growth_care_recommendations(
        crop=crop,
        stage=stage,
        weather_risk=weather_risk,
        language=language,
        limit=4,
    )
    return GrowthCareResponse(
        success=True,
        crop=crop,
        stage=stage,
        weather_risk=weather_risk,
        recommendations=recommendations,
    )


@router.post("/report", response_model=ScanReportResponse)
async def scan_report(request: ScanReportRequest) -> ScanReportResponse:
    diagnosis_crop = (
        request.diagnosis_name.split("___", 1)[0].replace("_", " ").strip()
        if "___" in request.diagnosis_name
        else ""
    )
    report_crop = diagnosis_crop or request.crop

    treatment_record = get_treatment_record(
        disease_class=request.diagnosis_name,
        stage=request.stage,
        severity=request.severity,
    )
    care_recommendations = get_growth_care_recommendations(
        crop=report_crop,
        stage=request.stage,
        weather_risk=request.weather_risk,
        language=request.language,
        limit=4,
    )
    result = generate_scan_report(
        language=request.language,
        farmer_name=request.farmer_name,
        location=request.location,
        crop=report_crop,
        diagnosis_name=request.diagnosis_name,
        confidence=request.confidence,
        treatment=request.treatment,
        recommendation=request.recommendation,
        treatment_record=treatment_record,
        care_recommendations=care_recommendations,
        stage=request.stage,
        severity=request.severity,
        weather_risk=request.weather_risk,
    )
    return ScanReportResponse(success=True, **result)


@router.post("/feedback", response_model=PredictionFeedbackResponse)
async def submit_feedback(
    request: PredictionFeedbackRequest,
    user=Depends(get_current_user),
) -> PredictionFeedbackResponse:
    normalized_verdict = request.verdict.strip().lower()
    if normalized_verdict not in {"correct", "incorrect", "unsure"}:
        raise ValidationError("verdict must be one of: correct, incorrect, unsure")

    db = get_database()
    feedback_id = await store_feedback(
        db=db,
        prediction_id=request.prediction_id,
        user_id=user["user_id"],
        verdict=normalized_verdict,
        rating=request.rating,
        notes=request.notes or "",
    )
    return PredictionFeedbackResponse(
        success=True,
        feedback_id=feedback_id,
        prediction_id=request.prediction_id,
    )

@router.post("/soil-scan", response_model=SoilReportResponse)
async def scan_soil_report(
    image: UploadFile = File(...),
    crop: str = Form(default=""),
    growth_stage: str = Form(default="vegetative"),
    area_acres: float = Form(default=1.0),
    language: str = Form(default="English"),
):
    try:
        image_bytes = await image.read()
        if not image_bytes:
            raise ValidationError("Empty image upload.")

        inference_res = await run_soil_inference(image_bytes)
        if inference_res.get("success"):
            return SoilReportResponse(
                **build_soil_report_from_prediction(
                    diagnosis=str(inference_res.get("diagnosis", "Field Soil")),
                    confidence_pct=inference_res.get("confidence"),
                    crop=crop,
                    growth_stage=growth_stage,
                    area_acres=area_acres,
                    source_model=str(inference_res.get("model_version", "custom-soil-v1")),
                    language=language,
                )
            )


        if Image is None:
            return SoilReportResponse(
                success=False,
                analysis_method="unavailable",
                source_model="soil_model_missing",
                area_acres=max(1.0, float(area_acres or 1.0)),
                nitrogen_advice="Soil model could not run and OCR fallback needs Pillow installed.",
                potassium_advice="Install pillow to enable image decoding for OCR fallback.",
                phosphorus_advice="If you want OCR fallback, add pillow + pytesseract and restart the backend.",
                raw_text=str(inference_res.get("reason", "")),
            )

        if pytesseract is None:
            return SoilReportResponse(
                success=False,
                analysis_method="model_only",
                source_model="soil_model_missing",
                area_acres=max(1.0, float(area_acres or 1.0)),
                nitrogen_advice="Custom soil model did not return a result and OCR fallback is unavailable.",
                potassium_advice="Install pytesseract to enable soil-card OCR fallback.",
                phosphorus_advice="Image-based soil classification is preferred for raw soil photos.",
                raw_text=str(inference_res.get("reason", "")),
            )

        img = Image.open(io.BytesIO(image_bytes))
        try:
            raw_text = pytesseract.image_to_string(img)
        except Exception as exc:
            if "tesseract is not installed" in str(exc).lower():
                return SoilReportResponse(
                    success=False,
                    analysis_method="ocr_missing",
                    source_model="pytesseract",
                    area_acres=max(1.0, float(area_acres or 1.0)),
                    nitrogen_advice="Tesseract OCR is not installed on this machine.",
                    potassium_advice="Run `brew install tesseract` on macOS or install `tesseract-ocr` on Linux.",
                    phosphorus_advice="Once installed, restart the backend and retry the soil scan.",
                    raw_text=str(inference_res.get("reason", "")),
                )
            raise exc

        return SoilReportResponse(
            **build_soil_report_from_ocr(
                raw_text=raw_text,
                crop=crop,
                area_acres=area_acres,
                language=language,
            )
        )

    except Exception as exc:
        return SoilReportResponse(
            success=False,
            analysis_method="error",
            source_model="soil_scan",
            area_acres=max(1.0, float(area_acres or 1.0)),
            nitrogen_advice=f"Soil analysis failed: {exc}",
            potassium_advice="Retry with a sharper image of the soil surface or soil card.",
            phosphorus_advice="If the problem persists, check backend dependencies and the soil model files.",
            raw_text="",
        )
