# Plant Doctor AI Platform — Copilot Instructions

## Project Overview
**Plant Doctor** is a full-stack agritech platform combining computer vision AI for crop disease detection with a marketplace for farming inputs (seeds, pesticides, machinery). The platform targets Indian farmers with:
- **Backend**: FastAPI service with PyTorch MobileNetV3-Large CNN (38-class crop disease classification from PlantVillage Dataset)
- **Frontend**: Next.js 16 web app with Tailwind CSS + Radix UI
- **Database**: MongoDB with geospatial queries for location-based pest alerts
- **Payments**: Razorpay integration for EMI-eligible farm equipment
- **Localization**: Multi-language support (Hindi, Bhojpuri, Punjabi, Marathi, Gujarati, Telugu)

---

## Architecture & Key Components

### Backend Architecture (`/backend`)
The FastAPI backend follows a **modular endpoint-driven design** with 12+ core services:

1. **AI Model Service** (`ai_model.py`)
   - Loads pre-trained MobileNetV3-Large (from `plantvillage_model.pth`)
   - Maps 38 crop-disease classes (e.g., `"Tomato___Early_blight"`) using `PLANTVILLAGE_CLASSES` dict
   - **Critical**: Treatment protocols (`PLANT_TREATMENTS` dict) contain medicine, dosage, & farming instructions for each disease
   - Always checks if disease name contains "healthy" to determine if crop is safe
   - **Pattern**: Disease predictions use underscore-separated plant+condition format

2. **FastAPI Main Service** (`main.py`)
   - **Voice Intent Parsing** (`/api/voice/intent`): Maps farmer voice commands to intents (weather, disease_scan, fallback) with NLP localization
   - **Geolocation & Weather** (`/api/geo/weather`): Returns temp, humidity, pest alerts; saves user location to MongoDB geospatial index
   - **Crop Scanning** (`/api/ai/scan`): Core endpoint — accepts image upload, runs PyTorch inference, stores scan in `scans` collection with geolocation
   - **Marketplace** (`/api/marketplace/c2c`): C2C listings for tractors, seeds, equipment
   - **Razorpay Payments** (`/api/pay/order`): Creates payment orders for purchases
   - **Admin Metrics** (`/api/admin/metrics`): KPIs (ARR, MAU farmers, pest reports handled)
   - **Calendar Planner** (`/api/calendar/planner`): Fertilizer schedule + harvest windows per crop
   - **Community Feed** (`/api/community/posts`): User-generated content from DB or mock data
   - **Expert Calls** (`/api/expert/call`): Placeholder for agronomist consultations

3. **Database Schema**
   - Collections: `users`, `products`, `community`, `scans`
   - **Scans** table stores: user_id, disease (text), confidence (0-100), class_id, location (GeoJSON Point), timestamp
   - Indexes: Geospatial 2dsphere on location for proximity-based pest network
   - **Fallback Mode**: All endpoints gracefully degrade if MongoDB is unavailable

4. **Localization Map**
   - `LANG_ISO_MAP` maps farmer languages to gTTS language codes (e.g., `'हिंदी' -> 'hi'`)
   - `localize(lang, topic)` function returns pre-written farmhand advice in target language for weather, disease diagnosis, fallback

### Frontend Architecture (`/web`)
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 + custom component library (likely in `src/components/`)
- **State Management**: React Context (see `src/context/`)
- **Charts**: Chart.js + Recharts for analytics dashboards
- **PWA**: Next-PWA enabled for offline farm use
- **Pages** (from `/src/app`): dashboard, scanner (camera input), marketplace, community, admin, expert, guide, profile, offline fallback

---

## Critical Developer Workflows

### Running the Full Platform
```bash
bash start_platform.sh
```
This script:
1. Activates `.venv` (Python virtual env)
2. Installs backend dependencies from `requirements.txt`
3. Starts FastAPI on `http://localhost:8000` (with `--reload` for dev)
4. Installs Next.js deps + specific Radix UI packages
5. Starts Next.js dev server on `http://localhost:3000`

**Manual Backend Start** (if needed):
```bash
cd backend
source ../.venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Manual Frontend Start**:
```bash
cd web
npm install
npm run dev  # Uses webpack as bundler (see package.json)
```

### Environment Variables
Create `.env` (or export to shell):
- `MONGO_URI`: MongoDB connection string (default: `mongodb://localhost:27017`)
- `RAZORPAY_KEY` / `RAZORPAY_SECRET`: Razorpay API credentials
- **Missing vars fall back to mock/demo mode** — the platform still works offline

### Building for Production
- **Backend**: FastAPI is production-ready with uvicorn; no special build step
- **Frontend**: `npm run build` (uses webpack); outputs to `.next/`
- **AI Model**: `plantvillage_model.pth` is pre-trained; no retraining in this repo

---

## Project-Specific Conventions & Patterns

### Naming Conventions
- **Disease class labels**: Always use `"Plant___Condition"` format with triple underscore
  - Examples: `"Apple___Apple_scab"`, `"Tomato___Early_blight"`, `"Corn_(maize)___healthy"`
  - When parsing or displaying, replace underscores with readable text
- **API endpoints**: Namespace by domain (`/api/ai/`, `/api/geo/`, `/api/marketplace/`, `/api/voice/`)
- **Confidence scores**: 0–100 range (percentage format)

### Error Handling Patterns
- **Graceful MongoDB fallback**: If DB unavailable, endpoints return mock data (see `seed_database()`)
- **AI inference failures**: Return `{"success": False, "error": "..."}`; never crash
- **Language defaults**: Unrecognized languages default to English (`LANG_ISO_MAP.get(lang, 'en-IN')`)

### Data Flow Pattern: Crop Scanning (Most Complex Feature)
```
User uploads image + location via /api/ai/scan
  ↓
Image bytes → ai_model.predict() → PyTorch forward pass
  ↓
Returns: {diagnosis: str, confidence: 0-100, class_id: str, treatment: dict}
  ↓
MongoDB: Insert into scans collection with geolocation (for pest network)
  ↓
Update user.total_scans counter
  ↓
Return recommendation (healthy vs. diseased) + treatment protocol
```
**Key insight**: The treatment data is NOT fetched from a separate service—it's hardcoded in `PLANT_TREATMENTS` dict. Adding new diseases = updating this dict + retraining model weights.

### Pest Network Algorithm
- MongoDB geospatial query finds recent disease scans near farmer's location
- If pest detected within 2.4km by 14+ farmers → emit high-severity alert
- UI shows "Fall Armyworm detected 2.4km away via 14 farmers"

---

## Integration Points & Dependencies

### External Services
1. **Razorpay API**: Payment gateway for equipment purchases; mock fallback if key is invalid
2. **gTTS (Google Text-to-Speech)**: Converts localized text responses to audio files
3. **Firebase Admin SDK**: Imported but not actively used in visible codebase
4. **PyTorch + TorchVision**: Model inference; requires GPU acceleration for production

### Database Integration
- **Motor** (Async MongoDB driver): All DB operations are async/await
- **Connection pool**: Single `AsyncIOMotorClient` instance created at startup
- **Indexes**: 2dsphere geospatial index must exist on `scans.location` for proximity queries

### Frontend-Backend Communication
- All API calls to `http://localhost:8000` (CORS enabled for `*` origins in dev)
- FormData for file uploads (images in scan endpoint)
- JSON for all other requests/responses

---

## Common Tasks & Implementation Patterns

### Adding a New Crop Disease
1. Update `PLANTVILLAGE_CLASSES` dict (add class_id → label mapping)
2. Add entry to `PLANT_TREATMENTS` dict with medicine, dosage, instructions
3. Retrain model weights (outside this repo; update `plantvillage_model.pth`)
4. No code changes needed if class_id is < 38

### Extending Localization
1. Add language to `LANG_ISO_MAP` with gTTS code
2. Add localized strings to `localize()` function for each topic (weather, disease, fallback)
3. Test with `/api/voice/intent` endpoint (pass `lang` param)

### Adding Marketplace Products
- Hardcoded seed products in `seed_database()` startup hook
- To add: Insert doc into `db.products` collection with fields: id, name, price, category, rating, img, (optional) emi, unit
- Categories: "Medicines", "Machines", "Rental"

### Debugging AI Model Predictions
- Check input image format (must be RGB convertible via PIL)
- Verify confidence > 0 (indicates valid inference)
- If confidence is uniform across classes (~1/38), likely a data loading issue
- Model outputs 38-dimensional logits; code maps to `PLANTVILLAGE_CLASSES` via modulo

---

## File Structure Reference

```
backend/
  app/
    main.py              ← All 12 API endpoints + startup logic
    ai_model.py          ← PyTorch model + 38-class mapping + treatment data
    plantvillage_model.pth  ← Pre-trained weights (binary, ~100MB)
  requirements.txt       ← pip dependencies
  scripts/              ← Helper scripts (unused in main flow)

web/
  src/
    app/                ← Next.js pages (dashboard, scanner, marketplace, etc.)
    components/         ← Reusable React components
    context/            ← React Context for state
    lib/                ← Utilities
  package.json          ← npm deps (Next.js, Tailwind, Recharts)
  tsconfig.json         ← TypeScript config
  next.config.mjs       ← Next.js config (PWA, webpack settings)

PlantVillage-Dataset/   ← Referenced dataset; data generation scripts
  leaf_grouping/        ← Metadata for avoiding train/test leakage
  raw/                  ← Raw images (color, grayscale, segmented)
  plant_village.py      ← Hugging Face dataset loader

start_platform.sh       ← Master startup script (runs both services)
```

---

## Known Constraints & Gotchas

1. **PlantVillage Model is Fixed**: The `.pth` file is immutable in this repo. To add diseases, you must:
   - Retrain externally with new data
   - Upload new weights to replace `plantvillage_model.pth`
   - This repo does NOT include training scripts

2. **38-Class Limitation**: If model outputs > 38 classes, code applies modulo 38 (potential class collision)

3. **MongoDB Required for Geospatial Features**: Simpler document databases won't support `$near` queries for pest networks

4. **Farmer Localization is Hardcoded**: `localize()` function uses string matching on farmer language; new languages require explicit dict entries

5. **Next.js Webpack Mode**: The frontend uses `--webpack` flag (not default turbopack); see `package.json` dev script. This was likely a compatibility decision for PWA or specific dependencies.

6. **Offline Fallback** (`src/app/~offline`): PWA feature; content served when user is offline. Ensure it works for core scanning feature.

---

## Current Known Issues & TODOs (Priority Order)

### Frontend UI/UX Issues
1. **Language selector dropdown overlaps Continue button** (`OnboardingFlow.tsx` line ~250)
   - Modal should expand downward/upward with viewport awareness
   - Or position language selector as full-screen modal on mobile

2. **Crop selection limited to 6 visible** (line ~300)
   - `cropOptions` array has 16+ crops but only 6 fit grid
   - Should use scrollable grid or dropdown selector

3. **Color scheme too green** (overly bright emerald-500/600)
   - Replace primary green with softer palette: emerald-600 → emerald-700/800
   - Add dark theme toggle in settings
   - Use darker backgrounds for "premium" feel

4. **Camera section missing capture/stop buttons** (`scanner/page.tsx` line ~150)
   - Need clear "Capture Photo" button during live feed
   - Add "Stop Camera" button to return to gallery mode

5. **Assistant popup has no close button** (`VoiceAIFAB.tsx` line ~180)
   - Add `<X>` icon button to dismiss response bubble
   - Response should auto-dismiss after 5 seconds or on action

6. **Content not translated** 
   - Disease names still in English (should use medicine translations)
   - Disease labels need translation mapping (e.g., "Tomato___Early_blight" → हिंदी label)
   - Weather alerts in English only
   - Medicine dosages, instructions not localized

7. **Community page overlapping elements** (`community/page.tsx`)
   - Post cards overlapping in some viewport widths
   - Search bar and tabs need better spacing

8. **Language selector flow**
   - Should appear immediately on first load (before onboarding)
   - Currently hidden in top-right after splash screen

### Backend Translation Gaps
1. **Disease class labels not mapped to translations**
   - Create `DISEASE_LABELS_I18N` dict mapping class→{lang→display_name}
   - Return translated disease name in `/api/ai/scan` response

2. **Medicine info not localized**
   - Add localization to `PLANT_TREATMENTS` dict (medicine names, instructions in all languages)
   - Return localized treatment in API response based on `lang` param

3. **Weather alerts hardcoded in English**
   - Move alert messages to localized strings in `localize()` function

### Frontend Features to Add
1. **Smart Dosage Calculator** 
   - Input: crop, disease, farm size → Calculate exact liters needed
   - Show cost breakdown
   - Integrate with marketplace for direct purchase

2. **Crop Calendar/Planner**
   - Show fertilizer schedule per crop/language
   - Integrate with weather alerts
   - Desktop version with heatmap

3. **Machine Rental Section**
   - Separate "Rent Machines" from purchase
   - Integration with location-based availability

4. **Emergency Contact Button**
   - Quick dial to local agronomist/government helpline
   - Position in bottom nav or floating button

---

## Quick Reference: High-Level Data Models

**Scan Document** (MongoDB):
```javascript
{
  user_id: "string",
  disease: "Tomato___Early_blight",  // Must match PLANTVILLAGE_CLASSES
  confidence: 87.5,                   // 0-100
  class_id: "PV_29",                  // Formatted class ID
  location: { type: "Point", coordinates: [lon, lat] },
  timestamp: ISODate
}
```

**Treatment Object** (In-memory):
```javascript
{
  medicine: "Dithane M-45",           // Chemical name
  pesticide: "N/A",                   // Or specific pesticide
  dosage: "2g per Liter",             // Application rate
  instructions: "Remove lower infected leaves..."  // Farmer-friendly advice
}
```

---

## Questions for Clarification or Future Work

**For you to review & clarify:**

1. **PlantVillage Dataset Integration**: Is the dataset stored locally or downloaded via the Hugging Face hub? Are you planning to use versioned datasets for reproducible training?
2. **Model Retraining Workflow**: Where is model retraining orchestrated? Is there a separate training repo or CI/CD pipeline?
3. **Expert Call Service**: The `/api/expert/call` endpoint is a placeholder. What's the actual integration (Jio Telly, Twilio, other)?
4. **Offline Scans**: Should scans be queued locally (via service worker) and synced when online? Or require internet?
5. **Pest Network Scope**: Is the 2.4km radius hardcoded by design, or should it be configurable per region?

---

*Last Updated: 2026-03-22*  
*For issues or updates, reference the AI model class in `backend/app/ai_model.py` and main API routes in `backend/app/main.py`.*
