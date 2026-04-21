from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from fpdf import FPDF  # type: ignore[import]

from app.services.knowledge_base_service import (
    get_localized_medicine,
    get_localized_treatment_summary,
    translate,
)

PROJECT_ROOT = Path(__file__).resolve().parents[3]
STATIC_REPORT_DIR = PROJECT_ROOT / "backend" / "static" / "reports"
UNICODE_FONT_CANDIDATES = [
    Path("/Library/Fonts/Arial Unicode.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
]


def _resolve_unicode_font() -> Optional[Path]:
    for path in UNICODE_FONT_CANDIDATES:
        if path.exists():
            return path
    return None


def _build_pdf(language: str) -> FPDF:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_page()

    font_path = _resolve_unicode_font()
    if font_path is not None:
        pdf.add_font("PlantDoctorsUnicode", "", str(font_path), uni=True)
        pdf.set_font("PlantDoctorsUnicode", "", 12)
    else:
        pdf.set_font("Arial", "", 12)
    return pdf


def _set_font(pdf: FPDF, style: str = "", size: int = 12) -> None:
    if "plantdoctorsunicode" in getattr(pdf, "fonts", {}):
        pdf.set_font("PlantDoctorsUnicode", "", size)
    else:
        pdf.set_font("Arial", style, size)


def _safe_text(text: Any) -> str:
    if text is None:
        return ""
    return str(text).strip()


def _normalize_scan_label(text: str) -> str:
    return _safe_text(text).replace("___", " — ").replace("_", " ")


def _extract_crop_from_diagnosis(diagnosis_name: str) -> str:
    raw = _safe_text(diagnosis_name)
    if "___" not in raw:
        return ""
    crop = raw.split("___", 1)[0]
    return crop.replace("_(maize)", " (maize)").replace("_", " ").strip()


def _add_section_title(pdf: FPDF, title: str, r: int = 25, g: int = 70, b: int = 130) -> None:
    pdf.set_fill_color(r, g, b)
    pdf.set_text_color(255, 255, 255)
    _set_font(pdf, "B", 11)
    pdf.cell(0, 8, txt=_safe_text(title), ln=True, fill=True)
    pdf.set_text_color(20, 20, 20)
    pdf.ln(1)


def _dedupe_preserve_order(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for line in lines:
        cleaned = _safe_text(line)
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        output.append(cleaned)
    return output


def generate_scan_report(
    language: str,
    farmer_name: str,
    location: str,
    crop: str,
    diagnosis_name: str,
    confidence: float,
    treatment: dict[str, Any],
    recommendation: str,
    treatment_record: Optional[dict[str, str]] = None,
    care_recommendations: Optional[list[dict[str, Any]]] = None,
    stage: str = "vegetative",
    severity: str = "medium",
    weather_risk: str = "medium",
) -> dict[str, str]:
    STATIC_REPORT_DIR.mkdir(parents=True, exist_ok=True)
    pdf = _build_pdf(language)
    report_id = uuid4().hex[:8].upper()
    diagnosis_label = _normalize_scan_label(diagnosis_name)
    diagnosis_crop = _extract_crop_from_diagnosis(diagnosis_name)
    crop_label = _safe_text(crop) or diagnosis_crop or "Unknown"
    generated_at = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M")

    _set_font(pdf, "B", 19)
    pdf.cell(0, 10, txt=_safe_text(translate("pdf_title", language, "Plant Doctors Crop Health Report")), ln=True)
    _set_font(pdf, "", 10)
    pdf.set_text_color(70, 70, 70)
    pdf.cell(0, 6, txt="Plant Doctor Intelligence Suite | Powered by PlantVillage AI", ln=True)
    pdf.set_text_color(20, 20, 20)
    pdf.ln(2)

    pdf.set_fill_color(244, 248, 255)
    _set_font(pdf, "", 10)
    pdf.multi_cell(
        0,
        6,
        txt=(
            f"Report ID: {report_id}    |    Generated At: {generated_at}\n"
            f"Stage: {_safe_text(stage)}    |    Severity: {_safe_text(severity)}    |    Weather Risk: {_safe_text(weather_risk)}"
        ),
        fill=True,
    )
    pdf.ln(1)

    _set_font(pdf, "", 11)
    pdf.multi_cell(
        0,
        7,
        txt=_safe_text(
            translate(
                "pdf_disclaimer",
                language,
                "This report supports field decisions but does not replace certified agronomist judgment.",
            )
        ),
    )
    pdf.ln(2)

    _add_section_title(pdf, _safe_text(translate("pdf_farmer_details", language, "Farmer Details")), 33, 95, 165)
    _set_font(pdf, "", 11)
    pdf.multi_cell(
        0,
        7,
        txt=(
            f"Name: {_safe_text(farmer_name) or 'Farmer'}\n"
            f"Location: {_safe_text(location) or 'Not provided'}\n"
            f"Crop: {crop_label}\n"
            f"Generated At: {generated_at}"
        ),
    )
    pdf.ln(1)

    _add_section_title(pdf, _safe_text(translate("pdf_scan_result", language, "Scan Result")), 22, 120, 95)
    _set_font(pdf, "", 11)
    pdf.multi_cell(
        0,
        7,
        txt=(
            f"{translate('label_diagnosis', language, 'Diagnosis')}: {diagnosis_label}\n"
            f"{translate('label_confidence', language, 'Confidence')}: {round(float(confidence or 0), 2)}%\n"
            f"{translate('label_treatment', language, 'Treatment')}: {_safe_text(treatment.get('medicine'))}\n"
            f"{translate('label_dosage', language, 'Dosage')}: {_safe_text(treatment.get('dosage'))}"
        ),
    )
    pdf.ln(1)

    localized_summary = get_localized_treatment_summary(treatment_record, language)
    summary_en = get_localized_treatment_summary(treatment_record, "English")
    summary_hi = get_localized_treatment_summary(treatment_record, "हिंदी")
    if not summary_en:
        summary_en = _safe_text(recommendation)
    if not summary_hi and language == "हिंदी":
        summary_hi = _safe_text(recommendation)

    _add_section_title(pdf, _safe_text(translate("pdf_model_note", language, "AI Smart Advice (Bilingual)")), 120, 58, 136)
    _set_font(pdf, "", 11)
    advice_lines: list[str] = []
    if summary_hi:
        advice_lines.append(f"हिंदी: {summary_hi}")
    if summary_en:
        advice_lines.append(f"English: {summary_en}")
    if not advice_lines:
        fallback = localized_summary or _safe_text(recommendation) or _safe_text(treatment.get("instructions"))
        advice_lines.append(fallback)
    pdf.multi_cell(0, 7, txt="\n\n".join(_dedupe_preserve_order(advice_lines)))
    pdf.ln(1)

    _add_section_title(pdf, _safe_text(translate("pdf_follow_up", language, "Follow-up Advice")), 190, 100, 20)
    _set_font(pdf, "", 11)
    localized_instructions = get_localized_medicine(_safe_text(treatment.get("instructions")), language)
    localized_precautions = get_localized_medicine(_safe_text(treatment.get("precautionary_notes")), language)
    follow_up_lines = [
        localized_instructions,
        localized_precautions,
    ]
    if not any(follow_up_lines):
        follow_up_lines.append(_safe_text(recommendation))
    if care_recommendations:
        follow_up_lines.extend(_safe_text(row.get("advice")) for row in care_recommendations[:4])
    follow_up_lines = _dedupe_preserve_order(follow_up_lines)
    bullet_lines = [f"- {line}" for line in follow_up_lines]
    pdf.multi_cell(0, 7, txt="\n".join(bullet_lines))

    file_name = f"scan_report_{uuid4().hex[:10]}.pdf"
    file_path = STATIC_REPORT_DIR / file_name
    pdf.output(str(file_path))
    return {
        "report_url": f"/static/reports/{file_name}",
        "file_name": file_name,
    }
