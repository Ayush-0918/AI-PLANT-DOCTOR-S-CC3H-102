import csv
import json
import random
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Union


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "PlantVillage-Dataset" / "raw" / "color"
OUTPUT_DIR = PROJECT_ROOT / "backend" / "data" / "generated"
MANIFEST_PATH = OUTPUT_DIR / "knowledge_manifest.json"

TREATMENT_PATH = OUTPUT_DIR / "treatment_knowledge.csv"
TRANSLATION_PATH = OUTPUT_DIR / "translations_core.csv"
GROWTH_CARE_PATH = OUTPUT_DIR / "plant_growth_care_recommendations.csv"
CROP_RECOMMENDATION_PATH = OUTPUT_DIR / "crop_recommendation.csv"
FERTILIZER_RECOMMENDATION_PATH = OUTPUT_DIR / "fertilizer_recommendation.csv"
PLANTS_PATH = OUTPUT_DIR / "plants.csv"

LEGACY_BACKEND_DIR = PROJECT_ROOT / "backend"
LEGACY_CROP_PATH = LEGACY_BACKEND_DIR / "crop_recommendation.csv"
LEGACY_FERTILIZER_PATH = LEGACY_BACKEND_DIR / "fertilizer_recommendation.csv"
LEGACY_PLANTS_PATH = LEGACY_BACKEND_DIR / "plants.csv"

STAGES = ["nursery", "vegetative", "flowering_fruiting"]
SEVERITIES = ["low", "medium", "high", "critical"]
PRIORITY_GENERAL_CROPS = [
    "Apple",
    "Corn (maize)",
    "Grape",
    "Orange",
    "Peach",
    "Pepper",
    "Potato",
    "Soybean",
    "Squash",
    "Strawberry",
    "Tomato",
]

TRANSLATION_TARGET_ROWS = 1000
TRANSLATION_LANG_COLUMNS = {
    "English": "English",
    "हिंदी": "हिंदी",
    "भोजपुरी": "भोजपुरी",
    "ਪੰਜਾਬੀ": "ਪੰਜਾਬੀ",
    "मराठी": "मराठी",
}

SYNTH_THEMES = [
    ("weather", "weather planning", "मौसम योजना", "मौसम योजना", "ਮੌਸਮ ਯੋਜਨਾ", "हवामान नियोजन"),
    ("scan", "leaf scan quality", "पत्ती स्कैन गुणवत्ता", "पत्ता स्कैन गुणवत्ता", "ਪੱਤਾ ਸਕੈਨ ਕੁਆਲਿਟੀ", "पान स्कॅन गुणवत्ता"),
    ("soil", "soil readiness", "मिट्टी तैयारी", "माटी तैयारी", "ਮਿੱਟੀ ਤਿਆਰੀ", "माती तयारी"),
    ("irrigation", "irrigation timing", "सिंचाई समय", "सिंचाई समय", "ਸਿੰਚਾਈ ਸਮਾਂ", "सिंचन वेळ"),
    ("nutrition", "nutrient balance", "पोषण संतुलन", "पोषण संतुलन", "ਪੋਸ਼ਣ ਸੰਤੁਲਨ", "पोषण संतुलन"),
    ("canopy", "canopy management", "पौध संरचना प्रबंधन", "पौधा बनावट प्रबंधन", "ਛਤਰੀ ਪ੍ਰਬੰਧਨ", "छत्र व्यवस्थापन"),
    ("community", "community support", "समुदाय सहायता", "समुदाय सहारा", "ਕਮਿਊਨਿਟੀ ਸਹਾਇਤਾ", "समुदाय मदत"),
    ("market", "market readiness", "बाजार तैयारी", "बाजार तैयारी", "ਮਾਰਕੀਟ ਤਿਆਰੀ", "बाजार तयारी"),
    ("expert", "expert escalation", "विशेषज्ञ सहायता", "विशेषज्ञ मदद", "ਮਾਹਰ ਸਹਾਇਤਾ", "तज्ञ सल्ला"),
    ("report", "report generation", "रिपोर्ट निर्माण", "रिपोर्ट बनावल", "ਰਿਪੋਰਟ ਤਿਆਰ", "अहवाल निर्मिती"),
]

SYNTH_ACTIONS = [
    ("review", "Review and confirm", "जांचें और पुष्टि करें", "जांचीं आ पक्का करीं", "ਜਾਂਚੋ ਅਤੇ ਪੁਸ਼ਟੀ ਕਰੋ", "तपासा आणि खात्री करा"),
    ("improve", "Improve", "सुधारें", "सुधार करीं", "ਸੁਧਾਰੋ", "सुधारा"),
    ("monitor", "Monitor", "निगरानी रखें", "निगरानी करीं", "ਨਿਗਰਾਨੀ ਕਰੋ", "निगराणी ठेवा"),
    ("stabilize", "Stabilize", "स्थिर रखें", "स्थिर राखीं", "ਸਥਿਰ ਰੱਖੋ", "स्थिर ठेवा"),
    ("prepare", "Prepare", "तैयार करें", "तइयार करीं", "ਤਿਆਰ ਕਰੋ", "तयार करा"),
    ("validate", "Validate", "सत्यापित करें", "पक्का करीं", "ਤਸਦੀਕ ਕਰੋ", "प्रमाणित करा"),
]

SYNTH_CONTEXTS = [
    ("morning", "for morning field rounds", "सुबह खेत निरीक्षण के लिए", "भोर खेत जांच खातिर", "ਸਵੇਰੇ ਖੇਤ ਜਾਂਚ ਲਈ", "सकाळच्या फेरीसाठी"),
    ("noon", "for midday checks", "दोपहर जांच के लिए", "दुपहरिया जांच खातिर", "ਦੁਪਹਿਰ ਜਾਂਚ ਲਈ", "दुपारच्या तपासणीसाठी"),
    ("evening", "for evening review", "शाम समीक्षा के लिए", "सांझ समीक्षा खातिर", "ਸ਼ਾਮ ਸਮੀਖਿਆ ਲਈ", "सायंकाळी आढाव्यासाठी"),
    ("rain", "before expected rainfall", "बारिश से पहले", "बरखा से पहिले", "ਮੀਹ ਤੋਂ ਪਹਿਲਾਂ", "पावसापूर्वी"),
    ("spray", "before spray decision", "छिड़काव निर्णय से पहले", "छिड़काव फैसला से पहिले", "ਛਿੜਕਾਅ ਫ਼ੈਸਲੇ ਤੋਂ ਪਹਿਲਾਂ", "फवारणी निर्णयापूर्वी"),
]


def get_class_names() -> list[str]:
    if DATASET_ROOT.exists():
        return sorted(path.name for path in DATASET_ROOT.iterdir() if path.is_dir())
    return []


def humanize_crop(raw_crop: str) -> str:
    return (
        raw_crop.replace("_(maize)", " (maize)")
        .replace("_(including_sour)", " (including sour)")
        .replace(",", "")
        .replace("_", " ")
        .strip()
    )


def humanize_disease(raw_disease: str) -> str:
    return raw_disease.replace("_", " ").replace("(", "").replace(")", "").strip()


def parse_class_name(class_name: str) -> dict[str, Union[str, bool]]:
    if "___" in class_name:
        crop_raw, disease_raw = class_name.split("___", 1)
    else:
        crop_raw, disease_raw = class_name, "unknown"

    crop_display = humanize_crop(crop_raw)
    disease_display = humanize_disease(disease_raw)
    disease_lower = disease_raw.lower()
    healthy = "healthy" in disease_lower

    pathogen_type = "physiology"
    if "virus" in disease_lower:
        pathogen_type = "virus"
    elif "bacterial" in disease_lower:
        pathogen_type = "bacteria"
    elif "mite" in disease_lower:
        pathogen_type = "pest"
    elif any(
        keyword in disease_lower
        for keyword in ["rust", "mildew", "blight", "spot", "scab", "rot", "mold", "scorch", "greening"]
    ):
        pathogen_type = "fungal_or_foliar"

    return {
        "crop_raw": crop_raw,
        "crop_display": crop_display,
        "disease_raw": disease_raw,
        "disease_display": disease_display,
        "healthy": healthy,
        "pathogen_type": pathogen_type,
    }


def stage_text(stage: str) -> str:
    return {
        "nursery": "nursery or early transplant stage",
        "vegetative": "vegetative stage",
        "flowering_fruiting": "flowering or fruiting stage",
    }.get(stage, "current crop stage")


def severity_multiplier(severity: str) -> float:
    return {
        "low": 0.9,
        "medium": 1.0,
        "high": 1.1,
        "critical": 1.2,
    }.get(severity, 1.0)


def resolve_protocol(
    metadata: dict[str, Union[str, bool]],
    stage: str,
    severity: str,
) -> dict[str, str]:
    disease_lower = str(metadata["disease_raw"]).lower()
    crop_display = str(metadata["crop_display"])
    stage_label = stage_text(stage)
    scale = severity_multiplier(severity)

    if bool(metadata["healthy"]):
        return {
            "medicine_name": "No chemical treatment required",
            "active_ingredient": "Not applicable",
            "dosage_per_liter": "0",
            "dosage_per_acre": "0",
            "spray_interval_days": "0",
            "waiting_period_days": "0",
            "recovery_window_days": "0",
            "irrigation_advice": f"Maintain balanced irrigation for {crop_display} during {stage_label}.",
            "cultural_control": "Continue scouting, remove dead leaves, and keep field airflow open.",
            "chemical_control": "No chemical intervention recommended.",
            "precautionary_notes": "Avoid unnecessary spraying when crop is healthy.",
            "escalation_rule": "Escalate only if new lesions spread after re-scan.",
        }

    if "virus" in disease_lower or "greening" in disease_lower:
        return {
            "medicine_name": "Vector management + rogue infected plants",
            "active_ingredient": "Imidacloprid / yellow sticky traps / sanitation",
            "dosage_per_liter": f"{round(0.6 * scale, 2)} ml/L",
            "dosage_per_acre": f"{round(120 * scale, 1)} ml/acre",
            "spray_interval_days": "5" if severity in {"high", "critical"} else "7",
            "waiting_period_days": "3",
            "recovery_window_days": "14",
            "irrigation_advice": "Avoid water stress and reduce movement through infected rows.",
            "cultural_control": "Remove infected plants, sanitize tools, and control vector pressure quickly.",
            "chemical_control": "Target insect vectors; disease itself has no direct curative spray.",
            "precautionary_notes": "Do not claim cure. Focus on containment and vector suppression.",
            "escalation_rule": "Escalate to expert if virus-like symptoms appear in multiple rows.",
        }

    if "bacterial" in disease_lower:
        return {
            "medicine_name": "Copper-based bactericide",
            "active_ingredient": "Copper oxychloride / copper hydroxide",
            "dosage_per_liter": f"{round(2.2 * scale, 2)} g/L",
            "dosage_per_acre": f"{round(320 * scale, 1)} g/acre",
            "spray_interval_days": "5" if severity in {"high", "critical"} else "7",
            "waiting_period_days": "5",
            "recovery_window_days": "10",
            "irrigation_advice": "Avoid overhead irrigation and keep leaf wetness low.",
            "cultural_control": "Remove infected leaves, improve spacing, and avoid field work in wet conditions.",
            "chemical_control": "Use protective copper spray and rotate chemistry in repeated outbreaks.",
            "precautionary_notes": "Do not overdose copper; repeated heavy use can stress foliage.",
            "escalation_rule": "Escalate if spotting reaches fruit or tender new growth.",
        }

    if "mite" in disease_lower:
        return {
            "medicine_name": "Neem-based miticide support",
            "active_ingredient": "Neem oil / abamectin rotation",
            "dosage_per_liter": f"{round(2.8 * scale, 2)} ml/L",
            "dosage_per_acre": f"{round(420 * scale, 1)} ml/acre",
            "spray_interval_days": "4" if severity in {"high", "critical"} else "6",
            "waiting_period_days": "3",
            "recovery_window_days": "7",
            "irrigation_advice": "Prevent crop stress and dust build-up; both increase mite pressure.",
            "cultural_control": "Spray underside of leaves and remove severely infested foliage.",
            "chemical_control": "Rotate miticide class when infestation rebounds after two cycles.",
            "precautionary_notes": "Avoid spraying under harsh afternoon heat.",
            "escalation_rule": "Escalate when webbing appears in multiple plants.",
        }

    if "late_blight" in disease_lower:
        return {
            "medicine_name": "Systemic + contact fungicide program",
            "active_ingredient": "Metalaxyl-M + Mancozeb",
            "dosage_per_liter": f"{round(2.4 * scale, 2)} g/L",
            "dosage_per_acre": f"{round(360 * scale, 1)} g/acre",
            "spray_interval_days": "4" if severity in {"high", "critical"} else "6",
            "waiting_period_days": "7",
            "recovery_window_days": "7",
            "irrigation_advice": "Reduce prolonged leaf wetness and stop overhead irrigation immediately.",
            "cultural_control": "Destroy heavily infected foliage and avoid moving tools between wet plots.",
            "chemical_control": "Immediate curative spray required with short repeat interval.",
            "precautionary_notes": "High-risk disease; do not wait for spread confirmation in humid weather.",
            "escalation_rule": "Escalate when visible field spread continues after treatment cycle.",
        }

    return {
        "medicine_name": "Protective foliar fungicide",
        "active_ingredient": "Mancozeb / Chlorothalonil rotation",
        "dosage_per_liter": f"{round(2.0 * scale, 2)} g/L",
        "dosage_per_acre": f"{round(300 * scale, 1)} g/acre",
        "spray_interval_days": "5" if severity in {"high", "critical"} else "7",
        "waiting_period_days": "5",
        "recovery_window_days": "10",
        "irrigation_advice": f"Keep irrigation stable for {crop_display} and avoid prolonged leaf wetness.",
        "cultural_control": "Remove infected lower leaves and improve sunlight penetration in canopy.",
        "chemical_control": "Start protective spray rotation and re-scan after 48 hours.",
        "precautionary_notes": "Match spray to crop label and local residue rules.",
        "escalation_rule": "Escalate if lesion size grows after two spray cycles.",
    }


def build_localized_summary(
    crop: str,
    stage: str,
    severity: str,
    protocol: dict[str, str],
) -> dict[str, str]:
    stage_label = stage_text(stage)
    severity_word = severity.capitalize()
    med = protocol["medicine_name"]
    cultural = protocol["cultural_control"]
    return {
        "summary_en": (
            f"{severity_word} risk detected in {crop} during {stage_label}. "
            f"Start with {med}, follow {cultural.lower()}, and review field in 48 hours."
        ),
        "summary_hi": (
            f"{crop} में {stage_label} पर {severity_word.lower()} स्तर का जोखिम दिख रहा है। "
            f"{med} से शुरुआत करें, {cultural} और 48 घंटे बाद खेत दोबारा देखें।"
        ),
        "summary_bho": (
            f"{crop} में {stage_label} पर {severity_word.lower()} स्तर के समस्या दिख रहल बा। "
            f"पहिले {med} से काम शुरू करीं, {cultural} आ 48 घंटा बाद फेर जांच करीं।"
        ),
        "summary_pa": (
            f"{crop} ਵਿੱਚ {stage_label} ਦੌਰਾਨ {severity_word.lower()} ਪੱਧਰ ਦਾ ਖਤਰਾ ਦਿੱਸ ਰਿਹਾ ਹੈ। "
            f"{med} ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ, {cultural} ਅਤੇ 48 ਘੰਟਿਆਂ ਬਾਅਦ ਖੇਤ ਮੁੜ ਵੇਖੋ।"
        ),
        "summary_mr": (
            f"{crop} मध्ये {stage_label} दरम्यान {severity_word.lower()} पातळीचा धोका दिसतो आहे. "
            f"{med} पासून सुरुवात करा, {cultural} आणि 48 तासांनी पुन्हा पाहणी करा."
        ),
    }


def generate_treatment_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    class_names = get_class_names()
    if not class_names:
        raise FileNotFoundError(
            f"No classes found. Expected PlantVillage class folders at: {DATASET_ROOT}"
        )

    for class_name in class_names:
        metadata = parse_class_name(class_name)
        for stage in STAGES:
            for severity in SEVERITIES:
                protocol = resolve_protocol(metadata, stage, severity)
                localized = build_localized_summary(str(metadata["crop_display"]), stage, severity, protocol)
                rows.append(
                    {
                        "record_type": "disease_protocol",
                        "disease_class": class_name,
                        "crop": str(metadata["crop_display"]),
                        "disease_name": str(metadata["disease_display"]),
                        "health_status": "healthy" if bool(metadata["healthy"]) else "attention",
                        "pathogen_type": str(metadata["pathogen_type"]),
                        "stage": stage,
                        "severity": severity,
                        **protocol,
                        **localized,
                        "source_type": "generated_baseline",
                        "evidence_level": "synthetic_foundation",
                        "review_status": "needs_agronomist_review",
                    }
                )

    for crop in PRIORITY_GENERAL_CROPS:
        for severity in SEVERITIES:
            stage = "preventive_general"
            protocol = {
                "medicine_name": "Preventive scouting + balanced nutrition",
                "active_ingredient": "Not applicable",
                "dosage_per_liter": "0",
                "dosage_per_acre": "0",
                "spray_interval_days": "0",
                "waiting_period_days": "0",
                "recovery_window_days": "0",
                "irrigation_advice": f"Maintain stable irrigation for {crop} and avoid stress swings.",
                "cultural_control": "Scout border rows, remove weak foliage, and keep field hygiene strong.",
                "chemical_control": "Spray only after disease confirmation or expert recommendation.",
                "precautionary_notes": "Preventive baseline entry for onboarding datasets.",
                "escalation_rule": "Escalate if repeated symptoms appear in three or more patches.",
            }
            localized = build_localized_summary(crop, stage, severity, protocol)
            rows.append(
                {
                    "record_type": "crop_prevention",
                    "disease_class": f"{crop}___preventive_monitoring",
                    "crop": crop,
                    "disease_name": "Preventive field monitoring",
                    "health_status": "preventive",
                    "pathogen_type": "general_prevention",
                    "stage": stage,
                    "severity": severity,
                    **protocol,
                    **localized,
                    "source_type": "generated_baseline",
                    "evidence_level": "synthetic_foundation",
                    "review_status": "needs_agronomist_review",
                }
            )

    return rows


def _base_translation_rows() -> list[dict[str, str]]:
    base_entries: list[tuple[str, str, str, str, str, str, str]] = [
        ("app_title", "Plant Doctors", "प्लांट डॉक्टर्स", "प्लांट डॉक्टर्स", "ਪਲਾਂਟ ਡਾਕਟਰਜ਼", "प्लांट डॉक्टर्स", "branding"),
        ("nav_dashboard", "Dashboard", "डैशबोर्ड", "डैशबोर्ड", "ਡੈਸ਼ਬੋਰਡ", "डॅशबोर्ड", "navigation"),
        ("nav_scanner", "Scanner", "स्कैनर", "स्कैनर", "ਸਕੈਨਰ", "स्कॅनर", "navigation"),
        ("nav_community", "Community", "समुदाय", "समुदाय", "ਕਮਿਊਨਿਟੀ", "समुदाय", "navigation"),
        ("nav_expert", "Expert", "विशेषज्ञ", "विशेषज्ञ", "ਮਾਹਰ", "तज्ञ", "navigation"),
        ("nav_profile", "Profile", "प्रोफाइल", "प्रोफाइल", "ਪ੍ਰੋਫ਼ਾਈਲ", "प्रोफाइल", "navigation"),
        ("btn_scan_now", "Scan Now", "अभी स्कैन करें", "अबही स्कैन करीं", "ਹੁਣੇ ਸਕੈਨ ਕਰੋ", "आत्ताच स्कॅन करा", "scanner"),
        ("btn_new_scan", "New Scan", "नया स्कैन", "नया स्कैन", "ਨਵਾਂ ਸਕੈਨ", "नवीन स्कॅन", "scanner"),
        ("btn_call_expert", "Call Expert", "विशेषज्ञ को कॉल करें", "विशेषज्ञ से बात करीं", "ਮਾਹਰ ਨੂੰ ਕਾਲ ਕਰੋ", "तज्ञांना कॉल करा", "expert"),
        (
            "btn_download_pdf",
            "Download PDF Report",
            "PDF रिपोर्ट डाउनलोड करें",
            "PDF रिपोर्ट डाउनलोड करीं",
            "PDF ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ",
            "PDF अहवाल डाउनलोड करा",
            "pdf",
        ),
        ("label_confidence", "Confidence", "विश्वास स्तर", "विश्वास स्तर", "ਭਰੋਸਾ ਪੱਧਰ", "विश्वास पातळी", "ai"),
        ("label_diagnosis", "Diagnosis", "निदान", "निदान", "ਨਿਦਾਨ", "निदान", "ai"),
        ("label_treatment", "Treatment", "उपचार", "इलाज", "ਇਲਾਜ", "उपचार", "ai"),
        ("label_dosage", "Dosage", "मात्रा", "मात्रा", "ਮਾਤਰਾ", "मात्रा", "ai"),
        ("label_precautions", "Precautions", "सावधानियां", "सावधानी", "ਸਾਵਧਾਨੀਆਂ", "काळजी सूचना", "ai"),
        ("label_weather", "Weather", "मौसम", "मौसम", "ਮੌਸਮ", "हवामान", "weather"),
        ("label_disease_risk", "Disease Risk", "रोग जोखिम", "रोग खतरा", "ਰੋਗ ਖਤਰਾ", "रोग धोका", "weather"),
        ("label_low", "Low", "कम", "कम", "ਘੱਟ", "कमी", "common"),
        ("label_medium", "Medium", "मध्यम", "मध्यम", "ਦਰਮਿਆਨਾ", "मध्यम", "common"),
        ("label_high", "High", "उच्च", "ज्यादा", "ਉੱਚ", "जास्त", "common"),
        ("label_critical", "Critical", "गंभीर", "गंभीर", "ਗੰਭੀਰ", "गंभीर", "common"),
        (
            "error_low_confidence",
            "This scan is uncertain. Connect to a human expert.",
            "यह स्कैन अनिश्चित है। विशेषज्ञ से बात करें।",
            "ई स्कैन पक्का नइखे। विशेषज्ञ से बात करीं।",
            "ਇਹ ਸਕੈਨ ਪੱਕਾ ਨਹੀਂ। ਮਾਹਰ ਨਾਲ ਗੱਲ ਕਰੋ।",
            "हा स्कॅन निश्चित नाही. तज्ञाशी बोला.",
            "errors",
        ),
        (
            "voice_weather_response",
            "There is a strong chance of rain tomorrow. Avoid spraying today.",
            "कल बारिश की मजबूत संभावना है। आज छिड़काव न करें।",
            "काल्ह बरखा के जादे आसार बा। आज छिड़काव मत करीं।",
            "ਕੱਲ੍ਹ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਜ਼ਿਆਦਾ ਹੈ। ਅੱਜ ਛਿੜਕਾਅ ਨਾ ਕਰੋ।",
            "उद्या पावसाची शक्यता जास्त आहे. आज फवारणी टाळा.",
            "voice",
        ),
        (
            "voice_scan_response",
            "Open the scanner and capture a clear leaf image.",
            "स्कैनर खोलें और पत्ते की साफ फोटो लें।",
            "स्कैनर खोलीं आ पात के साफ फोटो लीं।",
            "ਸਕੈਨਰ ਖੋਲ੍ਹੋ ਅਤੇ ਪੱਤੇ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਲਓ।",
            "स्कॅनर उघडा आणि पानाचा स्पष्ट फोटो घ्या.",
            "voice",
        ),
        (
            "pdf_title",
            "Plant Doctors Crop Health Report",
            "प्लांट डॉक्टर्स फसल स्वास्थ्य रिपोर्ट",
            "प्लांट डॉक्टर्स फसल स्वास्थ्य रिपोर्ट",
            "ਪਲਾਂਟ ਡਾਕਟਰਜ਼ ਫਸਲ ਸਿਹਤ ਰਿਪੋਰਟ",
            "प्लांट डॉक्टर्स पीक आरोग्य अहवाल",
            "pdf",
        ),
        (
            "pdf_disclaimer",
            "This report supports decisions but does not replace field expert judgement.",
            "यह रिपोर्ट निर्णय में मदद करती है लेकिन विशेषज्ञ निर्णय का विकल्प नहीं है।",
            "ई रिपोर्ट मदद करेले बाकिर विशेषज्ञ राय के जगह नइखे लेत।",
            "ਇਹ ਰਿਪੋਰਟ ਮਦਦ ਕਰਦੀ ਹੈ ਪਰ ਮਾਹਰ ਫੈਸਲੇ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦੀ।",
            "हा अहवाल मदत करतो पण तज्ञ निर्णयाची जागा घेत नाही.",
            "pdf",
        ),
        (
            "cropcare_heading",
            "Growth and Care Recommendations",
            "विकास और देखभाल सलाह",
            "बढ़त आ देखभाल सलाह",
            "ਵਿਕਾਸ ਅਤੇ ਦੇਖਭਾਲ ਸਲਾਹ",
            "वाढ आणि काळजी शिफारसी",
            "cropcare",
        ),
        ("cropcare_irrigation", "Irrigation", "सिंचाई", "सिंचाई", "ਸਿੰਚਾਈ", "सिंचन", "cropcare"),
        ("cropcare_nutrition", "Nutrition", "पोषण", "पोषण", "ਪੋਸ਼ਣ", "पोषण", "cropcare"),
        ("cropcare_canopy", "Canopy Management", "पौध प्रबंधन", "पौधा प्रबंधन", "ਛਤਰੀ ਪ੍ਰਬੰਧਨ", "छत्र व्यवस्थापन", "cropcare"),
        ("cropcare_scouting", "Scouting", "निरीक्षण", "निरीक्षण", "ਨਿਗਰਾਨੀ", "निरिक्षण", "cropcare"),
    ]

    rows: list[dict[str, str]] = []
    for key, en, hi, bho, pa, mr, category in base_entries:
        rows.append(
            {
                "key": key,
                "English": en,
                "हिंदी": hi,
                "भोजपुरी": bho,
                "ਪੰਜਾਬੀ": pa,
                "मराठी": mr,
                "category": category,
            }
        )
    return rows


def generate_translation_rows(target_rows: int = TRANSLATION_TARGET_ROWS) -> list[dict[str, str]]:
    rows = _base_translation_rows()
    seen_keys = {row["key"] for row in rows}

    idx = 0
    while len(rows) < target_rows:
        theme = SYNTH_THEMES[idx % len(SYNTH_THEMES)]
        action = SYNTH_ACTIONS[(idx // len(SYNTH_THEMES)) % len(SYNTH_ACTIONS)]
        context = SYNTH_CONTEXTS[(idx // (len(SYNTH_THEMES) * len(SYNTH_ACTIONS))) % len(SYNTH_CONTEXTS)]

        theme_code, theme_en, theme_hi, theme_bho, theme_pa, theme_mr = theme
        action_code, action_en, action_hi, action_bho, action_pa, action_mr = action
        context_code, context_en, context_hi, context_bho, context_pa, context_mr = context

        key = f"auto_{theme_code}_{action_code}_{context_code}_{idx:04d}"
        idx += 1
        if key in seen_keys:
            continue
        seen_keys.add(key)

        rows.append(
            {
                "key": key,
                "English": f"{action_en} {theme_en} {context_en}.",
                "हिंदी": f"{action_hi} {theme_hi} {context_hi}।",
                "भोजपुरी": f"{action_bho} {theme_bho} {context_bho}।",
                "ਪੰਜਾਬੀ": f"{action_pa} {theme_pa} {context_pa}।",
                "मराठी": f"{action_mr} {theme_mr} {context_mr}.",
                "category": "synthetic_extension",
            }
        )

    return rows[:target_rows]


def growth_template(crop: str, stage: str, weather_risk: str, care_area: str) -> dict[str, str]:
    stage_map = {
        "nursery": "nursery stage",
        "vegetative": "vegetative stage",
        "flowering_fruiting": "flowering and fruiting stage",
    }
    weather_map = {
        "low": "stable weather",
        "medium": "moderate weather fluctuation",
        "high": "high disease-weather pressure",
        "critical": "critical disease-weather pressure",
    }
    care_actions = {
        "irrigation": "keep moisture even and avoid long dry-wet swings",
        "nutrition": "support crop with balanced nutrition and avoid excess nitrogen",
        "canopy": "keep canopy open for airflow and light entry",
        "scouting": "walk field twice weekly and mark suspicious patches early",
    }
    action = care_actions[care_area]
    return {
        "advice_en": f"For {crop} during {stage_map[stage]} under {weather_map[weather_risk]}, {action}.",
        "advice_hi": f"{crop} में {stage_map[stage]} पर {weather_map[weather_risk]} होने पर {action}।",
        "advice_bho": f"{crop} में {stage_map[stage]} पर {weather_map[weather_risk]} रहे त {action}।",
        "advice_pa": f"{crop} ਵਿੱਚ {stage_map[stage]} ਦੌਰਾਨ {weather_map[weather_risk]} ਹੋਵੇ ਤਾਂ {action}।",
        "advice_mr": f"{crop} मध्ये {stage_map[stage]} आणि {weather_map[weather_risk]} असताना {action}.",
    }


def generate_growth_care_rows() -> list[dict[str, str]]:
    crops = [
        "Tomato",
        "Potato",
        "Corn (maize)",
        "Wheat",
        "Rice",
        "Apple",
        "Grape",
        "Pepper",
        "Soybean",
        "Strawberry",
        "Cotton",
        "Mustard",
    ]
    care_areas = ["irrigation", "nutrition", "canopy", "scouting", "disease_watch"]
    rows: list[dict[str, str]] = []

    for crop in crops:
        for stage in STAGES:
            for weather_risk in SEVERITIES:
                for care_area in care_areas:
                    area = care_area if care_area != "disease_watch" else "scouting"
                    localized = growth_template(crop, stage, weather_risk, area)
                    rows.append(
                        {
                            "crop": crop,
                            "stage": stage,
                            "weather_risk": weather_risk,
                            "care_area": care_area,
                            "priority": "urgent" if weather_risk in {"high", "critical"} else "planned",
                            **localized,
                            "frequency": (
                                "daily"
                                if care_area in {"scouting", "disease_watch"} and weather_risk in {"high", "critical"}
                                else "weekly"
                            ),
                            "source_type": "generated_baseline",
                            "review_status": "needs_agronomist_review",
                        }
                    )
    return rows


def _random_in_range(rng: random.Random, low: float, high: float) -> float:
    return round(rng.uniform(low, high), 2)


def generate_crop_recommendation_rows(seed: int = 42) -> list[dict[str, str]]:
    rng = random.Random(seed)
    crop_profiles: dict[str, dict[str, Any]] = {
        "rice": {"N": (70, 110), "P": (25, 55), "K": (30, 60), "temperature": (20, 32), "humidity": (70, 95), "ph": (5.0, 7.0), "rainfall": (150, 350), "season": "kharif"},
        "wheat": {"N": (40, 90), "P": (20, 45), "K": (20, 40), "temperature": (12, 26), "humidity": (40, 70), "ph": (6.0, 7.8), "rainfall": (40, 120), "season": "rabi"},
        "maize": {"N": (60, 100), "P": (25, 60), "K": (25, 55), "temperature": (18, 33), "humidity": (55, 85), "ph": (5.5, 7.5), "rainfall": (60, 220), "season": "kharif"},
        "potato": {"N": (50, 90), "P": (20, 55), "K": (40, 80), "temperature": (12, 24), "humidity": (45, 80), "ph": (5.2, 6.8), "rainfall": (40, 140), "season": "rabi"},
        "tomato": {"N": (45, 90), "P": (20, 55), "K": (35, 75), "temperature": (18, 32), "humidity": (50, 85), "ph": (5.5, 7.2), "rainfall": (40, 180), "season": "zaid"},
        "soybean": {"N": (20, 60), "P": (20, 55), "K": (25, 55), "temperature": (20, 34), "humidity": (55, 85), "ph": (6.0, 7.5), "rainfall": (70, 220), "season": "kharif"},
        "cotton": {"N": (50, 110), "P": (20, 45), "K": (35, 70), "temperature": (21, 38), "humidity": (40, 75), "ph": (5.8, 8.0), "rainfall": (40, 160), "season": "kharif"},
        "sugarcane": {"N": (80, 140), "P": (30, 60), "K": (50, 95), "temperature": (20, 36), "humidity": (55, 85), "ph": (6.0, 8.0), "rainfall": (90, 280), "season": "annual"},
        "mustard": {"N": (35, 70), "P": (20, 45), "K": (20, 40), "temperature": (12, 28), "humidity": (35, 65), "ph": (6.0, 7.8), "rainfall": (30, 90), "season": "rabi"},
        "chickpea": {"N": (20, 55), "P": (20, 50), "K": (20, 45), "temperature": (14, 30), "humidity": (35, 70), "ph": (6.0, 8.0), "rainfall": (30, 110), "season": "rabi"},
        "groundnut": {"N": (25, 60), "P": (20, 45), "K": (25, 50), "temperature": (20, 35), "humidity": (45, 80), "ph": (5.8, 7.4), "rainfall": (45, 190), "season": "kharif"},
        "millet": {"N": (25, 70), "P": (15, 40), "K": (20, 45), "temperature": (20, 38), "humidity": (30, 70), "ph": (5.5, 7.8), "rainfall": (25, 130), "season": "kharif"},
    }
    soil_types = ["loamy", "clay", "sandy_loam", "black_soil", "alluvial"]

    rows: list[dict[str, str]] = []
    for crop, profile in crop_profiles.items():
        for _ in range(45):
            rows.append(
                {
                    "N": str(_random_in_range(rng, *profile["N"])),
                    "P": str(_random_in_range(rng, *profile["P"])),
                    "K": str(_random_in_range(rng, *profile["K"])),
                    "temperature": str(_random_in_range(rng, *profile["temperature"])),
                    "humidity": str(_random_in_range(rng, *profile["humidity"])),
                    "ph": str(_random_in_range(rng, *profile["ph"])),
                    "rainfall": str(_random_in_range(rng, *profile["rainfall"])),
                    "label": crop,
                    "season": str(profile["season"]),
                    "soil_type": rng.choice(soil_types),
                    "source_type": "generated_baseline",
                }
            )
    return rows


def _fertilizer_choice(n_status: str, p_status: str, k_status: str) -> tuple[str, str, int]:
    if n_status == "low":
        return ("Urea + FYM", "split_dose_root_zone", 55)
    if p_status == "low":
        return ("DAP / SSP blend", "basal_application", 45)
    if k_status == "low":
        return ("MOP (Muriate of Potash)", "side_dressing", 40)
    if n_status == "high":
        return ("Biofertilizer + irrigation flush", "soil_correction", 25)
    return ("NPK 19:19:19 balanced feed", "foliar_plus_basal", 35)


def generate_fertilizer_recommendation_rows(seed: int = 42) -> list[dict[str, str]]:
    rng = random.Random(seed)
    crops = [
        "rice",
        "wheat",
        "maize",
        "potato",
        "tomato",
        "soybean",
        "cotton",
        "sugarcane",
        "mustard",
        "chickpea",
        "groundnut",
        "millet",
    ]
    growth_stages = ["nursery", "vegetative", "flowering_fruiting", "grain_fill"]
    soil_types = ["loamy", "clay", "sandy_loam"]
    nutrient_states = [
        ("low", "balanced", "balanced"),
        ("balanced", "low", "balanced"),
        ("balanced", "balanced", "low"),
        ("balanced", "balanced", "balanced"),
        ("high", "balanced", "balanced"),
    ]

    rows: list[dict[str, str]] = []
    for crop in crops:
        for stage in growth_stages:
            for soil in soil_types:
                for n_status, p_status, k_status in nutrient_states:
                    fertilizer, method, base_dose = _fertilizer_choice(n_status, p_status, k_status)
                    dose = base_dose + rng.randint(-5, 10)
                    advisory_en = (
                        f"For {crop} at {stage}, apply {fertilizer} ({dose} kg/acre) via {method} and re-check in 7 days."
                    )
                    rows.append(
                        {
                            "crop": crop,
                            "soil_type": soil,
                            "growth_stage": stage,
                            "n_status": n_status,
                            "p_status": p_status,
                            "k_status": k_status,
                            "recommended_fertilizer": fertilizer,
                            "dosage_kg_per_acre": str(max(10, dose)),
                            "application_method": method,
                            "advisory_en": advisory_en,
                            "advisory_hi": f"{crop} के {stage} चरण में {fertilizer} ({max(10, dose)} kg/acre) {method} से दें और 7 दिन बाद जांच करें।",
                            "advisory_bho": f"{crop} के {stage} दौर में {fertilizer} ({max(10, dose)} kg/acre) {method} से दीं आ 7 दिन बाद फेर जांच करीं।",
                            "advisory_pa": f"{crop} ਦੇ {stage} ਪੜਾਅ ਵਿੱਚ {fertilizer} ({max(10, dose)} kg/acre) {method} ਨਾਲ ਦਿਓ ਅਤੇ 7 ਦਿਨ ਬਾਅਦ ਮੁੜ ਜਾਂਚੋ।",
                            "advisory_mr": f"{crop} च्या {stage} टप्प्यात {fertilizer} ({max(10, dose)} kg/acre) {method} ने द्या आणि 7 दिवसांनी पुन्हा तपासा.",
                            "source_type": "generated_baseline",
                            "review_status": "needs_agronomist_review",
                        }
                    )
    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        raise ValueError(f"No rows available for {path}")
    with path.open("w", encoding="utf-8", newline="") as file_obj:
        writer = csv.DictWriter(file_obj, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def sync_legacy_csvs() -> None:
    LEGACY_BACKEND_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(CROP_RECOMMENDATION_PATH, LEGACY_CROP_PATH)
    shutil.copy2(FERTILIZER_RECOMMENDATION_PATH, LEGACY_FERTILIZER_PATH)
    if PLANTS_PATH.exists():
        shutil.copy2(PLANTS_PATH, LEGACY_PLANTS_PATH)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    treatment_rows = generate_treatment_rows()
    translation_rows = generate_translation_rows(TRANSLATION_TARGET_ROWS)
    growth_rows = generate_growth_care_rows()
    crop_rows = generate_crop_recommendation_rows()
    fertilizer_rows = generate_fertilizer_recommendation_rows()

    write_csv(TREATMENT_PATH, treatment_rows)
    write_csv(TRANSLATION_PATH, translation_rows)
    write_csv(GROWTH_CARE_PATH, growth_rows)
    write_csv(CROP_RECOMMENDATION_PATH, crop_rows)
    write_csv(FERTILIZER_RECOMMENDATION_PATH, fertilizer_rows)
    sync_legacy_csvs()

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "treatment_knowledge_rows": len(treatment_rows),
        "translation_rows": len(translation_rows),
        "growth_care_rows": len(growth_rows),
        "crop_recommendation_rows": len(crop_rows),
        "fertilizer_recommendation_rows": len(fertilizer_rows),
        "paths": {
            "treatment_knowledge": str(TREATMENT_PATH),
            "translations_core": str(TRANSLATION_PATH),
            "growth_care": str(GROWTH_CARE_PATH),
            "crop_recommendation": str(CROP_RECOMMENDATION_PATH),
            "fertilizer_recommendation": str(FERTILIZER_RECOMMENDATION_PATH),
        },
        "legacy_sync": {
            "crop_recommendation": str(LEGACY_CROP_PATH),
            "fertilizer_recommendation": str(LEGACY_FERTILIZER_PATH),
            "plants": str(LEGACY_PLANTS_PATH),
        },
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
