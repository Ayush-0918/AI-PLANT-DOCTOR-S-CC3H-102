import io
from typing import Dict

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import enforce_rate_limit
from app.services.knowledge_base_service import normalize_language, translate

router = APIRouter(prefix="/voice", tags=["Voice"], dependencies=[Depends(enforce_rate_limit)])


LANG_ISO_MAP: Dict[str, str] = {
    "English": "en-IN",
    "हिंदी": "hi",
    "भोजपुरी": "hi",
    "मैथिली": "hi",
    "ਪੰਜਾਬੀ": "pa",
    "मराठी": "mr",
    "ગુજરાતી": "gu",
    "తెలుగు": "te",
}


@router.post("/intent")
async def parse_voice_command(
    audio: UploadFile = File(default=None),
    text: str = Form(default=""),
    lang: str = Form(default="English"),
):
    _ = io.BytesIO() if audio is not None else None
    command_text = text.lower().strip() if text else "what is the weather?"
    lang = normalize_language(lang)

    if any(keyword in command_text for keyword in ["weather", "mausam", "mausami", "havaman"]):
        intent = "check_weather"
        response_text = translate("voice_weather_response", lang, "There is a strong chance of rain tomorrow. Avoid spraying today.")
        recommended_action = "open_weather"
    elif any(keyword in command_text for keyword in ["disease", "bimari", "rog", "scan"]):
        intent = "disease_scan"
        response_text = translate("voice_scan_response", lang, "Open the scanner and capture a clear leaf image.")
        recommended_action = "open_scanner"
    else:
        intent = "unknown"
        response_text = translate("voice_fallback_response", lang, "Please repeat slowly. I want to help correctly.")
        recommended_action = "ask_again"

    return {
        "success": True,
        "input_text": command_text,
        "mapped_intent": intent,
        "assistant_response": response_text,
        "recommended_action": recommended_action,
        "tts_lang": LANG_ISO_MAP.get(lang, "en-IN"),
    }
