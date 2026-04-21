import csv
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional


PROJECT_ROOT = Path(__file__).resolve().parents[3]
GENERATED_DIR = PROJECT_ROOT / "backend" / "data" / "generated"
TREATMENT_PATH = GENERATED_DIR / "treatment_knowledge.csv"
TRANSLATION_PATH = GENERATED_DIR / "translations_core.csv"
GROWTH_CARE_PATH = GENERATED_DIR / "plant_growth_care_recommendations.csv"

LANGUAGE_ALIASES = {
    "en": "English",
    "english": "English",
    "English": "English",
    "hi": "हिंदी",
    "hindi": "हिंदी",
    "Hindi": "हिंदी",
    "हिंदी": "हिंदी",
    "bho": "भोजपुरी",
    "भोजपुरी": "भोजपुरी",
    "bhojpuri": "भोजपुरी",
    "pa": "ਪੰਜਾਬੀ",
    "punjabi": "ਪੰਜਾਬੀ",
    "ਪੰਜਾਬੀ": "ਪੰਜਾਬੀ",
    "mr": "मराठी",
    "marathi": "मराठी",
    "मराठी": "मराठी",
}


def _read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as file_obj:
        return list(csv.DictReader(file_obj))


def normalize_language(language: str) -> str:
    if not language:
        return "English"
    # Match exact alias or lowercase version
    val = LANGUAGE_ALIASES.get(language.strip())
    if not val:
        val = LANGUAGE_ALIASES.get(language.strip().lower())
    return val if val else "English"


@lru_cache(maxsize=1)
def load_translations() -> dict[str, dict[str, str]]:
    rows = _read_csv(TRANSLATION_PATH)
    payload: dict[str, dict[str, str]] = {}
    for row in rows:
        key = row.get("key", "").strip()
        if not key:
            continue
        payload[key] = row
    return payload


@lru_cache(maxsize=1)
def load_treatment_knowledge() -> list[dict[str, str]]:
    return _read_csv(TREATMENT_PATH)


@lru_cache(maxsize=1)
def load_growth_care() -> list[dict[str, str]]:
    return _read_csv(GROWTH_CARE_PATH)


def translate(key: str, language: str, fallback: str = "") -> str:
    normalized = normalize_language(language)
    rows = load_translations()
    row = rows.get(key, {})
    return row.get(normalized) or row.get("English") or fallback or key


def get_treatment_record(
    disease_class: str,
    stage: str = "vegetative",
    severity: str = "medium",
) -> Optional[dict[str, str]]:
    disease_class = disease_class.strip()
    stage = stage.strip() or "vegetative"
    severity = severity.strip() or "medium"

    rows = load_treatment_knowledge()
    exact = [
        row
        for row in rows
        if row.get("disease_class") == disease_class and row.get("stage") == stage and row.get("severity") == severity
    ]
    if exact:
        return exact[0]

    same_disease = [row for row in rows if row.get("disease_class") == disease_class and row.get("severity") == severity]
    if same_disease:
        return same_disease[0]

    general = [row for row in rows if row.get("disease_class") == disease_class]
    if general:
        return general[0]
    return None


def get_localized_treatment_summary(record: Optional[dict[str, str]], language: str) -> str:
    if not record:
        return ""
    normalized = normalize_language(language)
    summary_column = {
        "English": "summary_en",
        "हिंदी": "summary_hi",
        "भोजपुरी": "summary_bho",
        "ਪੰਜਾਬੀ": "summary_pa",
        "मराठी": "summary_mr",
    }.get(normalized, "summary_en")
    return record.get(summary_column, "") or record.get("summary_en", "")


MEDICINE_TRANSLATIONS = {
    "English": {},
    "हिंदी": {
        "Neem-based miticide support": "नीम आधारित माइटिसाइड",
        "Systemic + contact fungicide program": "प्रणालीगत + संपर्क कवकनाशी (Fungicide)",
        "Protective foliar fungicide": "सुरक्षात्मक कवकनाशी (Fungicide)",
        "Vector management + rogue infected plants": "वेक्टर प्रबंधन और संक्रमित पौधों को हटाएं",
        "Copper-based bactericide": "कॉपर आधारित जीवाणुनाशक (Bactericide)",
        "No chemical treatment required": "किसी रसायन की आवश्यकता नहीं",
        "Preventive scouting + balanced nutrition": "रोग निरोधी निगरानी और संतुलित पोषण",
        "Remove infected lower leaves and improve sunlight penetration in canopy.": "संक्रमित निचली पत्तियों को हटाएँ और सूर्य के प्रकाश के प्रवेश में सुधार करें।"
    },
    "ਪੰਜਾਬੀ": {
        "Neem-based miticide support": "ਨਿੰਮ ਅਧਾਰਤ ਮਾਈਟੀਸਾਈਡ",
        "Systemic + contact fungicide program": "ਸਿਸਟੈਮਿਕ + ਸੰਪਰਕ ਉੱਲੀਮਾਰ (Fungicide)",
        "Protective foliar fungicide": "ਸੁਰੱਖਿਆ ਵਾਲੀ ਉੱਲੀਮਾਰ (Fungicide)",
        "Vector management + rogue infected plants": "ਵੈਕਟਰ ਪ੍ਰਬੰਧਨ ਅਤੇ ਬਿਮਾਰ ਪੌਦੇ ਹਟਾਓ",
        "Copper-based bactericide": "ਕਾਪਰ ਅਧਾਰਤ ਜੀਵਾਣੂਨਾਸ਼ਕ (Bactericide)",
        "No chemical treatment required": "ਕਿਸੇ ਰਸਾਇਣ ਦੀ ਲੋੜ ਨਹੀਂ",
        "Preventive scouting + balanced nutrition": "ਰੋਕਥਾਮ ਅਤੇ ਸੰਤੁਲਿਤ ਪੋਸ਼ਣ"
    }
}

def get_localized_medicine(medicine: str, language: str) -> str:
    if not medicine:
        return medicine
    normalized = normalize_language(language)
    trans = MEDICINE_TRANSLATIONS.get(normalized, {}).get(medicine)
    return trans if trans else medicine



def get_growth_care_recommendations(
    crop: str,
    stage: str = "vegetative",
    weather_risk: str = "medium",
    language: str = "English",
    limit: int = 4,
) -> list[dict[str, Any]]:
    normalized = normalize_language(language)
    advice_column = {
        "English": "advice_en",
        "हिंदी": "advice_hi",
        "भोजपुरी": "advice_bho",
        "ਪੰਜਾਬੀ": "advice_pa",
        "मराठी": "advice_mr",
    }.get(normalized, "advice_en")

    crop = crop.strip()
    stage = stage.strip() or "vegetative"
    weather_risk = weather_risk.strip() or "medium"

    rows = load_growth_care()
    matching = [
        row
        for row in rows
        if row.get("crop", "").strip().lower() == crop.lower()
        and row.get("stage") == stage
        and row.get("weather_risk") == weather_risk
    ]
    if not matching:
        matching = [row for row in rows if row.get("crop", "").strip().lower() == crop.lower() and row.get("stage") == stage]
    if not matching:
        matching = [row for row in rows if row.get("crop", "").strip().lower() == crop.lower()]

    payload = []
    for row in matching[: max(1, limit)]:
        payload.append(
            {
                "crop": row.get("crop"),
                "stage": row.get("stage"),
                "weather_risk": row.get("weather_risk"),
                "care_area": row.get("care_area"),
                "priority": row.get("priority"),
                "frequency": row.get("frequency"),
                "advice": row.get(advice_column) or row.get("advice_en", ""),
            }
        )
    return payload
