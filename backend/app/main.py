# ============================================================
# Plant Doctor AI — Master FastAPI Backend
# Version: 4.0.0 (Clean Architecture)
# ============================================================

import os
import sys
import random
import time
import io
from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, Form, Request  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore[import]
from fastapi.responses import JSONResponse  # type: ignore[import]
from fastapi.staticfiles import StaticFiles  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
try:
    from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore[import]
except Exception:
    AsyncIOMotorClient = None  # type: ignore[assignment]
try:
    import razorpay
except ImportError:
    razorpay = None
from gtts import gTTS  # type: ignore[import]
from fpdf import FPDF  # type: ignore[import]
from dotenv import load_dotenv  # type: ignore[import]

# Load environment variables from .env
load_dotenv()

from app.core.config import settings
from app.core.database import close_database, ensure_database_indexes, init_database
from app.core.errors import register_error_handlers

# Try to import cache (optional, will fallback if redis not available)
try:
    from app.core.cache import init_cache
    cache_available = True
except ImportError:
    cache_available = False
    init_cache = None

# --- AI MODEL IMPORT ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from ai_model import ai_model  # type: ignore[import]
except ImportError:
    from app.ai_model import ai_model  # type: ignore[import]

# ==========================================================
# APP SETUP
# ==========================================================
app = FastAPI(title="PlantDoctor AI Backend", version="4.0.0")
register_error_handlers(app)

# Redis cache startup/shutdown events (optional)
if cache_available:
    @app.on_event("startup")
    async def startup_redis_cache():
        from app.core.cache import init_cache as init_cache_fn
        await init_cache_fn()
    
    @app.on_event("shutdown")
    async def shutdown_redis_cache():
        try:
            from app.core.cache import cache_client
            if cache_client:
                await cache_client.close()
        except Exception:
            pass

# --- INTELLIGENCE ENGINE MOUNT ---
try:
    from app.engine import router as engine_router  # type: ignore[import]
    app.include_router(engine_router, prefix="/api/engine", tags=["Intelligence"])
    print("✅ Intelligence Engine Wired Up.")
except ImportError as e:
    print(f"⚠️ Engine Module not found or error: {e}")

# --- OPENENV MOUNT ---
try:
    from app.openenv import router as openenv_router  # type: ignore[import]
    app.include_router(openenv_router, prefix="/api/env", tags=["OpenEnv"])
    print("✅ OpenEnv RL System Wired Up.")
except ImportError as e:
    print(f"⚠️ OpenEnv Module not found or error: {e}")

# --- PRODUCTION V1 ROUTERS ---
ROUTER_MAP = {
    "auth": "app.api.routes.auth",
    "ai": "app.api.routes.ai",
    "users": "app.api.routes.users",
    "expert": "app.api.routes.expert_calls",
    "admin": "app.api.routes.admin_ai",
    "geo": "app.api.routes.geo",
    "community": "app.api.routes.community",
    "health": "app.api.routes.health",
    "voice": "app.api.routes.voice",
    "store": "app.api.routes.store",
    "mandi": "app.api.routes.mandi",
    "ai_chat": "app.api.routes.ai_chat",
    "intelligence": "app.api.routes.intelligence",
}

import importlib
for name, module_path in ROUTER_MAP.items():
    try:
        module = importlib.import_module(module_path)
        app.include_router(module.router, prefix="/api/v1")
        print(f"✅ V1 Router Loaded: {name}")
    except Exception as e:
        print(f"❌ Failed to load V1 router {name}: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC FILES FOR REPORTS ---
os.makedirs("static", exist_ok=True)
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

LEGACY_API_PREFIXES = (
    "/api/voice/",
    "/api/geo/",
    "/api/pay/",
    "/api/admin/",
    "/api/calendar/",
    "/api/marketplace/",
    "/api/ai/",
    "/api/expert/",
    "/api/community/",
    "/api/users/",
)


@app.middleware("http")
async def block_legacy_api_routes(request: Request, call_next):
    path = request.url.path
    if not settings.enable_legacy_api and any(path.startswith(prefix) for prefix in LEGACY_API_PREFIXES):
        return JSONResponse(
            status_code=410,
            content={
                "success": False,
                "error": "legacy_api_disabled",
                "message": "Legacy API routes are disabled. Use /api/v1/* endpoints.",
                "path": path,
            },
        )
    return await call_next(request)

# ==========================================================
# CONFIGURATION
# ==========================================================
MONGO_URI         = os.getenv("MONGO_URI", "mongodb://localhost:27017")
RAZORPAY_KEY      = os.getenv("RAZORPAY_KEY", "")
RAZORPAY_SECRET   = os.getenv("RAZORPAY_SECRET", "")

# --- VAPI CONFIG ---
VAPI_API_KEY      = os.getenv("VAPI_API_KEY", "")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID", "")
VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID", "")
VAPI_URL         = "https://api.vapi.ai/call"

try:
    if AsyncIOMotorClient is None:
        raise RuntimeError("motor/pymongo not available")
    mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    db = mongo_client.plant_doctor
    users_collection = db["users"]
    products_collection = db["products"]
    community_collection = db["community"]
    print("✅ MongoDB Connected.")
except Exception as e:
    db = None
    users_collection = None
    products_collection = None
    community_collection = None
    print(f"⚠️  MongoDB Offline — Using fallbacks. ({e})")

if razorpay and RAZORPAY_KEY and RAZORPAY_SECRET:
    try:
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))
    except Exception as e:
        print(f"⚠️ Razorpay Client init failed: {e}")
        razorpay_client = None
else:
    razorpay_client = None

# ==========================================================
# PYDANTIC MODELS
# ==========================================================
class PaymentRequest(BaseModel):
    amount: int
    currency: str = "INR"
    receipt: str

# ==========================================================
# STARTUP: SEED DB + INDEXES
# ==========================================================
@app.on_event("startup")
async def seed_database():
    if db is None:
        return
    if await db.products.count_documents({}) == 0:
        print("🌱 Seeding Products...")
        await db.products.insert_many([
            {"title": "Bayer Fungicide Plus", "description": "Broad-spectrum disease control", "price": "₹450", "category": "Medicines", "rating": 4.8, "reviews": 128, "seller": "AgriGrow Supply", "sellerBadge": "Verified", "image": "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?q=80&w=400", "stock": 42},
            {"title": "Syngenta Isabion", "description": "Amino acid organic biostimulant", "price": "₹1200", "category": "Medicines", "rating": 4.9, "reviews": 312, "seller": "FarmCare Direct", "sellerBadge": "Premium", "image": "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=400", "stock": 15},
            {"title": "Neem Oil Extract 100%", "description": "Natural pest deterrent for early stages", "price": "₹250", "category": "Medicines", "rating": 4.5, "reviews": 89, "seller": "Green Earth", "sellerBadge": "Eco", "image": "https://images.unsplash.com/photo-1615485906371-d64e9a3b6d08?q=80&w=400", "stock": 100},
            {"title": "Mahindra Tractor 275 DI", "description": "39 HP robust farming tractor", "price": "₹5,50,000", "category": "Machines", "rating": 4.5, "reviews": 46, "seller": "Mahindra Auth. Dealer", "sellerBadge": "Official", "image": "https://images.unsplash.com/photo-1533227268408-a774693194a8?q=80&w=400", "stock": 5},
            {"title": "John Deere 5050E", "description": "50 HP heavy duty tractor with EMI option", "price": "₹8,20,000", "category": "Machines", "rating": 4.7, "reviews": 23, "seller": "JD Agromotors", "sellerBadge": "Verified", "image": "https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?q=80&w=400", "stock": 2},
            {"title": "Premium Combine Harvester", "description": "High yield crop harvesting machine", "price": "₹1500/hr", "category": "Rental", "rating": 4.6, "reviews": 75, "seller": "Kisan Rentals", "sellerBadge": "Trusted", "image": "https://images.unsplash.com/photo-1517404212739-650058e578f2?q=80&w=400", "stock": 10},
            {"title": "Laser Land Leveler", "description": "Precision land leveling for better watering", "price": "₹800/hr", "category": "Rental", "rating": 4.8, "reviews": 112, "seller": "AgriTech Services", "sellerBadge": "Top Rated", "image": "https://images.unsplash.com/photo-1444858291040-58f756a3bcd6?q=80&w=400", "stock": 8},
        ])
    await db.scans.create_index([("location", "2dsphere")])


@app.on_event("startup")
async def startup_v1_dependencies():
    db_ready = await init_database()
    if db_ready:
        await ensure_database_indexes()
        print("✅ V1 database indexes ready.")
    else:
        print("⚠️ V1 database unavailable.")


@app.on_event("shutdown")
async def shutdown_v1_dependencies():
    await close_database()

# ==========================================================
# HELPERS
# ==========================================================
LANG_ISO_MAP = {
    'English': 'en-IN', 'हिंदी': 'hi', 'भोजपुरी': 'hi', 'मैथिली': 'hi',
    'ਪੰਜਾਬੀ': 'pa', 'मराठी': 'mr', 'ગુજરાતી': 'gu', 'తెలుగు': 'te'
}

def localize(lang: str, topic: str) -> str:
    """Return the correct localized NLP response string for the given language and topic."""
    responses = {
        "weather": {
            'हिंदी':    "कल बारिश होने की 70% संभावना है। आज यूरिया का छिड़काव न करें।",
            'भोजपुरी':  "काल्ह 70% बरखा के उमीद बा। आज यूरिया जनि छिड़कीं।",
            'ਪੰਜਾਬੀ':   "ਕੱਲ੍ਹ ਮੀਂਹ ਪੈਣ ਦੀ 70% ਸੰਭਾਵਨਾ ਹੈ। ਅੱਜ ਯੂਰੀਆ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ।",
            'मैथिली':   "काल्हि वर्षाक 70% संभावना अछि। आइ यूरियाक छिड़काव नहि करू।",
            'मराठी':    "उद्या पावसाची 70% शक्यता आहे. आज युरिया फवारू नका.",
            'ગુજરાતી':  "આવતીકાલે વરસાદની 70% સંભાવના છે. આજે યુરિયાનો છંટકાવ ન કરો.",
            'తెలుగు':   "రేపు 70% వర్షం పడే అవకాశం ఉంది. ఈ రోజు యూరియా పిచికారీ చేయవద్దు.",
            'default':  "There is a 70% chance of rain tomorrow. Do not spray urea today.",
        },
        "disease": {
            'हिंदी':    "कृपया अपनी फसल को स्कैन करने के लिए कैमरा खोलें। मैं तुरंत इसका निदान करूंगा।",
            'भोजपुरी':  "किरपा क के फसल स्कैन करे खातिर कैमरा खोलीं। हम एकर तुरंत जांच करब।",
            'ਪੰਜਾਬੀ':   "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਫਸਲ ਨੂੰ ਸਕੈਨ ਕਰਨ ਲਈ ਕੈਮਰਾ ਖੋਲ੍ਹੋ। ਮੈਂ ਤੁਰੰਤ ਇਸਦੀ ਜਾਂਚ ਕਰਾਂਗਾ।",
            'मैथिली':   "कृपा कऽ अपन फसलकें स्कैन करबाक लेल कैमरा खोलू। हम तुरंत एकर निदान करब।",
            'मराठी':    "कृपया तुमचे पीक स्कॅन करण्यासाठी कॅमेरा उघडा. मी लगेच त्याचे निदान करेन.",
            'ગુજરાતી':  "કૃપા કરીને તમારા પાકને સ્કેન કરવા માટે કેમેરા ખોલો. હું તરત જ તેનું નિદાન કરીશ.",
            'తెలుగు':   "దయచేసి మీ పంటను స్కాన్ చేయడానికి కెమెరాను తెరవండి. నేను వెంటనే దాన్ని నిర్ధారిస్తాను.",
            'default':  "Please open the camera to scan your crop. I will diagnose it instantly.",
        },
        "fallback": {
            'हिंदी':    "मैं आपका स्मार्ट कृषि सहायक हूँ। कृपया फिर से बोलें।",
            'भोजपुरी':  "हम राउर स्मार्ट खेत सहायक बानी। किरपा क के फेर से बोलीं।",
            'ਪੰਜਾਬੀ':   "ਮੈਂ ਤੁਹਾਡਾ ਸਮਾਰਟ ਖੇਤੀ ਸਹਾਇਕ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।",
            'मैथिली':   "हम अहाँक स्मार्ट कृषि सहायक छी। कृपा कऽ फेरसँ बाजु।",
            'मराठी':    "मी तुमचा स्मार्ट कृषी सहाय्यक आहे. कृपया पुन्हा बोला.",
            'ગુજરાતી':  "હું તમારો સ્માર્ટ કૃષિ સહાયક છું. કૃપા કરીને ફરીથી બોલો.",
            'తెలుగు':   "నేను మీ స్మార్ట్ వ్యవసాయ సహాయకుడిని. దయచేసి మళ్లీ మాట్లాడండి.",
            'default':  "I am your Smart Farm Assistant. Please speak again.",
        },
    }
    return responses.get(topic, {}).get(lang, responses[topic]['default'])


# ==========================================================
# ENDPOINTS
# ==========================================================

# 1 — VOICE AI
@app.post("/api/voice/intent")
async def parse_voice_command(
    audio: UploadFile = File(None),
    text: str = Form(None),
    lang: str = Form("English")
):
    command_text = text.lower() if text else "what is the weather?"

    if any(k in command_text for k in ["weather", "mausam", "mausami", "havaman"]):
        intent = "check_weather"
        response_text = localize(lang, "weather")
    elif any(k in command_text for k in ["disease", "bimari", "rog"]):
        intent = "disease_scan"
        response_text = localize(lang, "disease")
    else:
        intent = "unknown"
        response_text = localize(lang, "fallback")

    gtts_lang = LANG_ISO_MAP.get(lang, 'en-IN')
    tts = gTTS(text=response_text, lang=gtts_lang)
    mp3_fp = io.BytesIO()
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    return {
        "success": True,
        "input_text": command_text,
        "mapped_intent": intent,
        "assistant_response": response_text,
        "audio_url": "/api/static/voice_response_1.mp3"
    }


# 2 — WEATHER + GEO ALERTS (Real OpenWeatherMap)
OWM_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

@app.get("/api/geo/weather")
async def get_weather_and_alerts(lat: float, lon: float, user_id: str = "default_user"):
    import httpx  # type: ignore[import]

    weather_data = {}
    pest_alert = {}
    health_score = random.randint(70, 95)

    # ── Fetch REAL weather from OpenWeatherMap ──
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": OWM_API_KEY,
                    "units": "metric",   # Celsius
                }
            )
            resp.raise_for_status()
            owm = resp.json()

            temp_c      = round(owm["main"]["temp"], 1)
            feels_like  = round(owm["main"]["feels_like"], 1)
            humidity    = owm["main"]["humidity"]
            wind_kmh    = round(owm["wind"]["speed"] * 3.6, 1)   # m/s → km/h
            description = owm["weather"][0]["description"].capitalize()
            city_name   = owm.get("name", "Your Location")
            rain_1h     = owm.get("rain", {}).get("1h", 0)       # mm/h, may be absent
            cloud_pct   = owm["clouds"]["all"]

            # ── Smart Farming Alerts from real data ──
            alerts = []
            if temp_c > 38:
                alerts.append("🌡️ Extreme heat — water crops early morning and evening.")
                health_score = max(50, health_score - 15)
            elif temp_c > 32:
                alerts.append("☀️ High temperature — risk of heat stress on sensitive crops.")
            if humidity > 85:
                alerts.append("💧 High humidity — fungal disease risk. Avoid foliar sprays.")
            if humidity < 30:
                alerts.append("🏜️ Very low humidity — increase irrigation frequency.")
            if wind_kmh > 40:
                alerts.append("💨 Strong winds — postpone pesticide/fertilizer spraying.")
                health_score = max(50, health_score - 10)
            if rain_1h > 5:
                alerts.append("🌧️ Active rainfall — do not spray chemicals today.")
            if cloud_pct > 80 and rain_1h == 0:
                alerts.append("⛅ Overcast — good time for manual crop inspection.")
            if not alerts:
                alerts.append(f"✅ {description}. Conditions look good for field work.")

            weather_data = {
                "temperature":   f"{temp_c}°C",
                "feels_like":    f"{feels_like}°C",
                "humidity":      f"{humidity}%",
                "wind_speed":    f"{wind_kmh} km/h",
                "description":   description,
                "city":          city_name,
                "rain_1h_mm":    rain_1h,
                "cloud_pct":     cloud_pct,
                "weather_alerts": alerts,
                "data_source":   "OpenWeatherMap Live"
            }

    except Exception as e:
        print(f"⚠️ OpenWeatherMap error: {e} — using regional fallback")
        if not settings.allow_legacy_mocks:
            return {
                "success": False,
                "error": "live_weather_unavailable",
                "message": "Live weather unavailable. Legacy fallback disabled in production mode.",
            }
        # Fallback: smart regional estimate
        temp_c   = 28 if lat > 20 else 34
        humidity = 65
        weather_data = {
            "temperature":   f"{temp_c}°C",
            "feels_like":    f"{temp_c - 2}°C",
            "humidity":      f"{humidity}%",
            "wind_speed":    "12 km/h",
            "description":   "Partly Cloudy (offline estimate)",
            "city":          "Your Area",
            "rain_1h_mm":    0,
            "cloud_pct":     40,
            "weather_alerts": ["⚠️ Live weather unavailable. Showing regional estimate."],
            "data_source":   "Fallback"
        }

    # ── Save location to DB (best-effort) ──
    if db is not None:
        try:
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"last_location": {"type": "Point", "coordinates": [lon, lat]}, "last_active": datetime.now()}},
                upsert=True
            )
            recent = await db.scans.find_one({"disease": {"$regex": ".*", "$not": {"$regex": "healthy"}}}, sort=[("timestamp", -1)])
            if recent:
                pest_alert = {"threat": recent.get("disease"), "distance": "Nearby", "severity": "High", "confidence": "Confirmed by ML"}
                health_score = max(50, health_score - 15)
        except Exception as e:
            print("DB Error:", e)

    if not pest_alert:
        pest_alert = {"threat": "Fall Armyworm", "distance": "2.4 km", "severity": "High", "confidence": "Confirmed by 14 farmers"}

    return {
        **weather_data,
        "pest_network_alert": pest_alert,
        "crop_health_score":  health_score,
    }


# 2b — THREAT MAP (Community-driven early warning)
@app.get("/api/geo/threats")
async def get_threat_alerts(lat: float, lon: float, radius: int = 10):
    """
    Community-driven pest early warning system
    Returns disease threats detected nearby (when 14+ farmers report same disease within 10km)
    """
    if db is None:
        if not settings.allow_legacy_mocks:
            return {
                "success": False,
                "error": "database_unavailable",
                "message": "Threat map requires live community scan data.",
            }
        # Fallback mock data
        return {
            "has_threats": True,
            "threats": [
                {
                    "disease": "Tomato___Early_blight",
                    "farmer_count": 16,
                    "distance_km": 3.2,
                    "alert_level": "HIGH",
                    "confidence_score": 92,
                    "hours_since_last_detection": 2.5,
                    "hours_remaining_alert": 45.5,
                    "recommendation": "Apply preventive spray within 24 hours. Tomato___Early_blight spreading in area.",
                    "affected_area_km2": 4.2
                }
            ],
            "location": {"latitude": lat, "longitude": lon},
            "search_radius_km": radius,
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        # Import threat service
        from app.services.threat_map_service import ThreatMapService  # type: ignore[import]
        
        # Ensure geospatial index exists
        service = ThreatMapService(db)
        await service.ensure_geospatial_index()
        
        # Get threats
        threats_data = await service.check_threats(lat, lon, radius)
        return threats_data
        
    except ImportError:
        print("Threat service not available")
        return {
            "has_threats": False,
            "threats": [],
            "location": {"latitude": lat, "longitude": lon},
            "search_radius_km": radius,
            "error": "Threat service unavailable"
        }
    except Exception as e:
        print(f"Threat API error: {e}")
        return {
            "has_threats": False,
            "threats": [],
            "location": {"latitude": lat, "longitude": lon},
            "search_radius_km": radius,
            "error": str(e)
        }


# 3 — RAZORPAY PAYMENT
@app.post("/api/pay/order")
def create_order(req: PaymentRequest):
    data = {"amount": req.amount * 100, "currency": req.currency, "receipt": req.receipt, "payment_capture": 1}
    try:
        if razorpay_client is None:
            raise RuntimeError("Razorpay credentials not configured.")
        payment = razorpay_client.order.create(data=data)
        return {"id": payment["id"], "amount": payment["amount"], "currency": payment["currency"]}
    except Exception as e:
        if not settings.allow_legacy_mocks:
            return {
                "success": False,
                "error": "payment_unavailable",
                "message": "Payment provider unavailable in production mode.",
                "details": str(e),
            }
        return {"id": f"order_{int(time.time())}", "amount": data["amount"], "currency": "INR", "mocked": True}


# 4 — ADMIN METRICS
@app.get("/api/admin/metrics")
async def get_startup_metrics():
    if db is None:
        if not settings.allow_legacy_mocks:
            return {"success": False, "error": "db_unavailable"}
        return {
            "revenue_trend": [
                {"month": "Jan", "gmv": 120000}, {"month": "Feb", "gmv": 240000},
                {"month": "Mar", "gmv": 480000}, {"month": "Apr", "gmv": 960000},
            ],
            "geographic_density": [
                {"lat": 28.7, "lon": 77.1, "intensity": 0.90, "label": "Delhi NCR"},
                {"lat": 19.0, "lon": 72.8, "intensity": 0.80, "label": "Mumbai"},
                {"lat": 25.5, "lon": 85.1, "intensity": 0.95, "label": "Bihar Belt"},
            ],
            "kpi": {"arr": "$12.4M", "active_farmers_mau": "1.2M", "pest_reports_handled": "430K"}
        }

    # Real DB query
    total_users = await db.users.count_documents({})
    total_scans = await db.scans.count_documents({})
    
    # Calculate geographical density from scans
    density_pipeline = [
        {"$group": {
            "_id": "$location.coordinates",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    density_cursor = db.scans.aggregate(density_pipeline)
    geo_density = []
    async for doc in density_cursor:
        coords = doc["_id"]
        if coords and len(coords) == 2:
            geo_density.append({
                "lat": coords[1], "lon": coords[0],
                "intensity": min(1.0, doc["count"] / 10.0), # Normalizing intensity
                "label": "Active Zone"
            })
            
    return {
        "revenue_trend": [
            {"month": "Last 30 Days", "gmv": total_users * 150},
        ],
        "geographic_density": geo_density,
        "kpi": {
            "arr": f"₹{total_users * 1500}", 
            "active_farmers_mau": str(total_users), 
            "pest_reports_handled": str(total_scans)
        }
    }


# 5 — CROP CALENDAR / PLANNER
@app.get("/api/calendar/planner")
def get_smart_calendar(crop: str, sow_date: str):
    # Dynamic algorithmic logic instead of hardcode
    try:
        sow = datetime.fromisoformat(sow_date.replace('Z', '+00:00'))
    except Exception:
        sow = datetime.now()

    # Define crop maturity schedules
    crop_rules = {
        "Wheat": {"harvest": 120, "fert_1": 25, "fert_2": 55, "profit": "35%"},
        "Rice": {"harvest": 135, "fert_1": 20, "fert_2": 60, "profit": "40%"},
        "Tomato": {"harvest": 80, "fert_1": 15, "fert_2": 40, "profit": "55%"},
        "Potato": {"harvest": 100, "fert_1": 20, "fert_2": 50, "profit": "45%"},
    }
    
    rules = crop_rules.get(crop.capitalize(), {"harvest": 100, "fert_1": 20, "fert_2": 50, "profit": "30%"})

    harvest_start = sow + timedelta(days=rules["harvest"] - 7)
    harvest_end = sow + timedelta(days=rules["harvest"] + 7)

    return {
        "crop": crop,
        "expected_profit_margin": rules["profit"],
        "best_fertilizer_dates": [
            {"date": (sow + timedelta(days=rules["fert_1"])).strftime("%Y-%m-%d"), "action": "First Fertilizer Application"},
            {"date": (sow + timedelta(days=rules["fert_2"])).strftime("%Y-%m-%d"), "action": "Second Fertilizer Application"},
        ],
        "harvest_window": f"{harvest_start.strftime('%b %d')} - {harvest_end.strftime('%b %d')}"
    }


# 6 — C2C MARKETPLACE
@app.get("/api/marketplace/c2c")
async def get_farmer_listings():
    if db is None:
        if not settings.allow_legacy_mocks:
            return []
        return [
            {"seller_id": "far_123", "name": "Mohan Lal",    "product": "Used John Deere Tractor",  "price": "4 Lakh", "distance": "5km",  "chat_enabled": True},
            {"seller_id": "far_456", "name": "Rajesh Kumar",  "product": "Organic Wheat Seeds 50kg", "price": "₹1500",  "distance": "12km", "chat_enabled": True},
        ]
        
    listings = []
    cursor = db.c2c_listings.find().sort("timestamp", -1).limit(20)
    async for listing in cursor:
        listing["_id"] = str(listing["_id"])
        listings.append(listing)
    return listings

@app.post("/api/marketplace/c2c")
async def create_farmer_listing(req: dict):
    if db is not None:
        listing = {
            "seller_id": req.get("seller_id", "anonymous"),
            "name": req.get("name", "Farmer"),
            "product": req.get("product", "Unknown Item"),
            "price": req.get("price", "Contact for price"),
            "distance": req.get("distance", "Unknown"),
            "chat_enabled": True,
            "timestamp": datetime.now()
        }
        await db.c2c_listings.insert_one(listing)
    return {"success": True}


# 7 — SMART NOTIFICATIONS
@app.get("/api/ai/notifications")
async def get_smart_notifications(lat: float = 0.0, lon: float = 0.0):
    if db is None:
        return {"location_based_alerts": [
            {"type": "disease", "title": "Pest Network Alert", "message": "Live connection lost. General threat: Fall Armyworm in season."}
        ]}
    
    # Real query: Find scans within 10km radius in last 48 hours
    two_days_ago = datetime.now() - timedelta(days=2)
    recent_threats_cursor = db.scans.find({
        "timestamp": {"$gte": two_days_ago},
        "disease": {"$not": {"$regex": "healthy", "$options": "i"}},
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lon, lat]},
                "$maxDistance": 10000
            }
        }
    }).limit(3)
    
    alerts = []
    async for threat in recent_threats_cursor:
         alerts.append({
             "type": "disease",
             "title": "Local Threat Alert",
             "message": f"{threat.get('disease')} detected recently in your area. Consider preventive action."
         })
         
    if not alerts:
        alerts.append({
            "type": "weather",
            "title": "Clear Conditions",
            "message": "No new local threats detected in the last 48 hours."
        })
        
    return {"location_based_alerts": alerts}


# 8 — AI CROP SCAN (PyTorch CNN)
@app.post("/api/ai/scan")
async def scan_plant(
    image: UploadFile = File(...),
    lat: float = Form(0.0),
    lon: float = Form(0.0),
    user_id: str = Form("default_user")
):
    image_bytes = await image.read()
    result = ai_model.predict(image_bytes)

    if not result["success"]:
        return {"success": False, "error": result.get("error")}

    disease_name = result["diagnosis"]
    confidence   = result["confidence"]
    class_id     = result["class_id"]

    if db is not None:
        await db.scans.insert_one({
            "user_id":  user_id,
            "disease":  disease_name,
            "confidence": confidence,
            "class_id": class_id,
            "location": {"type": "Point", "coordinates": [lon, lat]},
            "timestamp": datetime.now()
        })
        if users_collection is not None:
            await users_collection.update_one({"user_id": user_id}, {"$inc": {"total_scans": 1}}, upsert=True)

    recommendation = "Crop looks excellent. Maintain normal watering." if "healthy" in disease_name.lower() \
                     else f"Detected: {disease_name}. Apply targeted treatment within 48 hours."

    return {
        "success": True,
        "diagnosis": {
            "name": disease_name, 
            "class_id": class_id, 
            "confidence": confidence,
            "treatment": result.get("treatment", {})
        },
        "recommendation": {"action": recommendation}
    }


# 11 — EXPERT CALLS (REAL VAPI OUTBOUND)
@app.post("/api/expert/call")
async def request_expert_call(req: dict):
    """Trigger a real outbound AI call to the farmer's phone via Vapi."""
    import httpx  # type: ignore[import]
    
    phone = req.get("phone_number")
    if not phone:
        return {"success": False, "message": "Phone number is required."}
    
    # Format number if needed (ensure + prefix)
    clean_phone = phone.strip()
    if not clean_phone.startswith("+"):
        # Assume India (+91) if 10 digits
        if len(clean_phone) == 10:
            clean_phone = f"+91{clean_phone}"
        else:
            return {"success": False, "message": "Please provide country code (e.g. +91)."}

    headers = {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    PLANT_DOCTOR_PROMPT = (
        "You are an advanced AI Plant Doctor and Agricultural Expert for the Plant Doctors app.\n\n"
        "Your role is to help farmers diagnose plant diseases accurately and suggest effective treatments.\n\n"
        "Conversation Style:\n"
        "- Speak in simple Hindi + English mix (Hinglish)\n"
        "- Be friendly, confident, and helpful like a real doctor\n"
        "- Keep responses short but informative\n"
        "- You are calling the farmer on their phone, so be warm and conversational\n\n"
        "Step-by-Step Diagnosis Flow:\n"
        "1. Ask Smart Questions ONE AT A TIME:\n"
        "   - Kaunsa plant hai? (crop name)\n"
        "   - Leaves, stem ya roots me problem hai?\n"
        "   - Symptoms kya hain? (spots, yellowing, holes, insects, fungus)\n"
        "   - Kab se problem start hui?\n"
        "   - Weather conditions kaisi hain?\n\n"
        "2. Analyze based on symptoms — identify disease, or give 2-3 possibilities if unsure.\n\n"
        "3. Give Solution (VERY IMPORTANT):\n"
        "   - Exact medicine/pesticide/fungicide name\n"
        "   - Dosage (per liter water)\n"
        "   - Frequency of use\n"
        "   - Organic + chemical both options\n\n"
        "4. Prevention Tips: watering, sunlight, spacing tips.\n\n"
        "Safety: Never suggest harmful or banned chemicals. If unsure, say 'Image ya expert inspection better hoga.'\n"
        "Smart: Simplify for beginners, give practical solutions for farmers, be supportive always."
    )

    FIRST_MESSAGE = (
        "Namaste! Main aapka AI Plant Doctor hoon. "
        "Main aapki madad kar sakta hoon disease identify karne aur treatment suggest karne me. "
        "Aapke plant me kya problem aa rahi hai?"
    )

    payload = {
        "assistantId": VAPI_ASSISTANT_ID,
        "phoneNumberId": VAPI_PHONE_NUMBER_ID,
        "customer": {
            "number": clean_phone
        },
        "assistantOverrides": {
            "firstMessage": FIRST_MESSAGE,
            "model": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "systemPrompt": PLANT_DOCTOR_PROMPT
            }
        }
    }

    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(VAPI_URL, json=payload, headers=headers)
            res_json = response.json()
            
            if response.status_code == 201 or response.status_code == 200:
                print(f"📞 Vapi Outbound Call Triggered for {clean_phone}")
                return {"success": True, "message": "Call initiated...", "call_id": res_json.get("id")}
            else:
                print(f"❌ Vapi Error: {res_json}")
                return {"success": False, "message": res_json.get("message", "Vapi call failed.")}
                
    except Exception as e:
        print(f"⚠️ Vapi Exception: {e}")
        return {"success": False, "message": "Server error while reaching Vapi."}

# 12 — COMMUNITY FEED
@app.get("/api/community/posts")
async def get_community_posts():
    # Return DB data only
    posts = []
    if community_collection is not None:
        try:
            posts = await community_collection.find().sort("timestamp", -1).to_list(20)
            for p in posts: p["_id"] = str(p["_id"])
        except: pass
    return posts

@app.post("/api/community/posts")
async def create_post(req: dict):
    if community_collection is not None:
        post = {
            "author": req.get("author", "Farmer"),
            "content": req.get("content"),
            "location": req.get("location", "India"),
            "likes": 0, "comments": 0,
            "timestamp": datetime.now(),
            "time": "Just now"
        }
        await community_collection.insert_one(post)
    return {"success": True}


# 9 — DOSAGE CALCULATOR
@app.post("/api/ai/dosage")
def calculate_smart_dosage(req: dict):
    crop = req.get("crop", "Unknown")
    disease = req.get("disease", "Unknown Threat")
    area_acres = float(req.get("area_acres", 1.0))
    
    # Advanced logic based on disease type
    chemical_name = "General Broad-Spectrum Fungicide"
    base_chem_per_acre = 0.5
    base_water_per_acre = 150 # Liters
    
    disease_lower = disease.lower()
    if "blight" in disease_lower or "fung" in disease_lower or "mildew" in disease_lower:
        chemical_name = "Mancozeb 75% WP"
        base_chem_per_acre = 0.6  # kg
    elif "worm" in disease_lower or "insect" in disease_lower or "pest" in disease_lower:
        chemical_name = "Chlorpyrifos 20% EC"
        base_chem_per_acre = 0.8  # Liters
    elif "virus" in disease_lower or "mosaic" in disease_lower:
        chemical_name = "Imidacloprid (Vector Control)"
        base_chem_per_acre = 0.2  # Liters
        
    total_chem = base_chem_per_acre * area_acres
    total_water = base_water_per_acre * area_acres
    unit = "kg" if "WP" in chemical_name else "Liters"
    
    return {
        "dosage_exact": {
            "chemical": f"{total_chem:.1f} {unit} of {chemical_name}", 
            "water_mix": f"{int(total_water)} Liters"
        },
        "instructions": f"Mix {chemical_name} in {int(total_water)}L water. Ensure uniform coverage on {crop} leaves. Spray early morning.",
        "ai_analysis":  {
            "targeted_threat": disease,
            "safety_interval": "Do not harvest for 7 days after application."
        },
        "warnings": "Wear protective mask and gloves. Keep away from water bodies."
    }

@app.post("/api/ai/report")
async def generate_report(req: dict):
    diagnosis = req.get("diagnosis", "Unknown Disease")
    treatment = req.get("treatment", {})
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="PlantDoctor AI - Health Report", ln=True, align='C')
    pdf.ln(10)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, txt=f"Diagnosis: {diagnosis}", ln=True)
    pdf.set_font("Arial", '', 11)
    pdf.multi_cell(0, 10, txt=f"Medicine: {treatment.get('medicine', 'N/A')}")
    pdf.multi_cell(0, 10, txt=f"Dosage: {treatment.get('dosage', 'N/A')}")
    pdf.multi_cell(0, 10, txt=f"Instructions: {treatment.get('instructions', 'N/A')}")
    
    pdf.ln(10)
    pdf.set_font("Arial", 'I', 10)
    pdf.cell(200, 10, txt=f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True)
    
    report_path = f"report_{int(time.time())}.pdf"
    pdf.output(os.path.join("static", report_path))
    
    return {"success": True, "report_url": f"/static/{report_path}"}


# Removed redundant marketplace products endpoint - now handled by /api/v1/store/products


# 11 — USER LANGUAGE PREFERENCE SYNC
@app.post("/api/users/preferences")
async def update_user_preferences(req: dict):
    if db is not None:
        await db.users.update_one(
            {"user_id": req.get("user_id", "default_user")},
            {"$set": {"language": req.get("language", "English")}},
            upsert=True
        )
    return {"success": True}


# 12 — USER PROFILE
@app.get("/api/users/{user_id}")
async def get_user_profile(user_id: str):
    if db is not None:
        user  = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        scans = await db.scans.count_documents({"user_id": user_id})
        if user:
            user["total_scans_logged"] = scans
            return user
    return {"error": "User not found or DB offline"}


# 13 — REAL AI ACCURACY (CONFUSION MATRIX & METRICS)
@app.get("/api/admin/model_accuracy")
async def get_model_accuracy():
    import os, json
    metrics_path = os.path.join(os.path.dirname(__file__), "..", "static", "accuracy.json")
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r") as f:
                return json.load(f)
        except Exception as e:
            return {"error": f"Failed to read accuracy log: {str(e)}", "status": "Error"}
    
    # If not trained yet, return a graceful response so the UI knows to prompt training
    return {
        "status": "Not Trained",
        "error": "Real AI model not trained yet. Run `python backend/scripts/train_lite.py` to generate the Confusion Matrix."
    }

if __name__ == "__main__":
    import uvicorn  # type: ignore[import]
    uvicorn.run(app, host="0.0.0.0", port=8000)
