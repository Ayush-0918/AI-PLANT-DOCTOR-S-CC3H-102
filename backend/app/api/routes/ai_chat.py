import logging
import os
from typing import List, Literal, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from gtts import gTTS

try:
    from langchain_community.chat_models import ChatOllama
    from langchain.schema import HumanMessage, AIMessage, SystemMessage
except ImportError:
    ChatOllama = None
    HumanMessage = None  # type: ignore[assignment]
    AIMessage = None  # type: ignore[assignment]
    SystemMessage = None  # type: ignore[assignment]

from app.services.mandi_trend_service import mandi_trend_service

router = APIRouter(prefix="/ai", tags=["AI Chat"])
logger = logging.getLogger(__name__)

# Configure Ollama (Local AI)
if ChatOllama is not None:
    # Switched to llama3 for better Hinglish and instruction following
    model = ChatOllama(model="llama3", temperature=0.7)
else:
    model = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "model"] = "user"
    content: str = Field(default="", max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(default="", max_length=4000)
    history: List[ChatMessage] = Field(default_factory=list)
    voice_mode: bool = Field(default=False)
    language: str = Field(default="English")


class ChatResponse(BaseModel):
    success: bool
    response: str
    voice_url: Optional[str] = None


TTS_LANG_MAP = {
    "English": "en",
    "हिंदी": "hi",
    "भोजपुरी": "hi",
    "मैथिली": "hi",
    "ਪੰਜਾਬੀ": "pa",
    "मराठी": "mr",
    "ગુજરાતી": "gu",
    "తెలుగు": "te",
}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ollama(req: ChatRequest):
    if not model:
        return ChatResponse(success=False, response="Langchain or Ollama packages are missing. Please pip install langchain-community ollama.")
    
    try:
        # Fetch high-level market context to inject into AI
        trends = mandi_trend_service.get_crop_trends()
        market_context = "\n".join([f"- {t['commodity']}: {t['trend']} ({t['delta_pct']}%)" for t in trends[:5]])

        messages = []
        
        # Market-aware agronomist prompt with multilingual output control
        system_instruction = (
            "You are an expert AI Plant Doctor for Indian farmers. "
            "You diagnose crop issues, advise treatment, and explain mandi price strategy clearly. \n"
            "CRITICAL RULES: \n"
            f"1. Reply in farmer language preference: {req.language}. If unknown, use Hinglish. \n"
            "2. Be warm, respectful (like a real expert Doctor), and very concise. \n"
            "3. If suggesting medicines or fertilizers, give exact chemical names (like Mancozeb, Urea, Neem Oil) and basic dosages if possible. \n"
            "4. If user asks about selling/holding crop, include mandi trend signal and a practical action window. \n"
            "5. Mention uncertainty honestly where data is limited; never invent medical or financial certainty. \n"
            "LIVE MANDI CONTEXT: \n"
            f"{market_context}"
        )
        
        messages.append(SystemMessage(content=system_instruction))
        
        # Convert history
        for msg in req.history:
            if not msg.content.strip():
                continue
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        
        user_message = req.message.strip()
        if not user_message:
            return ChatResponse(success=False, response="Kisan bhai, kripya apna sawal type karein.")
            
        messages.append(HumanMessage(content=user_message))

        # Ask local Ollama LLM
        response = (model.invoke(messages).content or "").strip()
        if not response:
            return ChatResponse(success=False, response="No response generated.")

        voice_url = None
        if req.voice_mode:
            try:
                tts_lang = TTS_LANG_MAP.get(req.language, "hi")
                tts = gTTS(text=response, lang=tts_lang)
                audio_filename = f"chat_response_{os.urandom(4).hex()}.mp3"
                audio_path = os.path.join("static", "uploads", audio_filename)
                os.makedirs(os.path.dirname(audio_path), exist_ok=True)
                tts.save(audio_path)
                voice_url = f"/static/uploads/{audio_filename}"
            except Exception as tts_err:
                logger.error(f"TTS Error: {tts_err}")

        return ChatResponse(success=True, response=response, voice_url=voice_url)
    except Exception as e:
        logger.error(f"Ollama Chat Error: {e}")
        return ChatResponse(success=False, response="Sorry, mera AI server (Ollama) backend connection me problem aa rahi hai. Kripya backend terminal check karein aur ensure karein ki Ollama chal raha hai.")
