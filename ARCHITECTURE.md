# 📂 Detailed Project File Structure: Plant Doctors

A comprehensive map of every directory and key file in the **Plant Doctors** ecosystem, along with descriptions of their functions.

---

## 🌳 Root Directory
| File/Folder | Description |
| :--- | :--- |
| **`web/`** | The Next.js 16 frontend application. |
| **`backend/`** | The FastAPI Python backend engine. |
| **`PlantVillage-Dataset/`** | AI training data and dataset processing utilities. |
| **`static/`** | Public assets, AI reports, and uploaded farmer images. |
| `start_platform.sh` | One-click bash script to launch both Backend and Frontend. |
| `docker-compose.yml` | Container orchestration for production deployment. |
| `PROJECT_COMPREHENSIVE_GUIDE.md` | High-level technical documentation. |
| `PROJECT_BUSINESS_STRATEGY.md` | Strategic USPs and farmer value proposition. |
| `README.md` | Standard project introduction. |

---

## 🌐 `web/` (Frontend - Next.js)
The frontend uses the **App Router** architecture for optimized performance.

### `web/src/app/` (The Routes)
- **`dashboard/`**: The main command center (Weather, Soil Health, Mandi Prices).
- **`scanner/`**: AI Camera interface for crop disease diagnosis.
- **`marketplace/`**: "Krishi Bazaar" for buying/selling agri-products.
- **`community/`**: Social feed for farmer-to-farmer knowledge sharing.
- **`expert/`**: Interface for triggering AI Voice Calls.
- **`admin/`**: High-fidelity dashboard for monitoring AI system health.
- **`profile/`**: User settings and scan history.
- **`api/`**: Next.js internal API routes (proxies and local handlers).

### `web/src/components/`
- **`ui/`**: Atomic components (Buttons, Inputs, Cards) styled with Tailwind 4.0.
- **`3d/`**: Three.js / React Three Fiber components for immersive visuals.
- **`glass/`**: Specialized components for the glassmorphic design system.

### `web/src/hooks/` & `lib/`
- `useExpertCall.ts`: Custom hook to manage the Vapi call lifecycle.
- `api-client.ts`: Unified fetch wrapper for backend communication.

---

## ⚙️ `backend/` (Backend - FastAPI)
The backend follows a **Clean Architecture** pattern.

### `backend/app/`
- **`api/routes/`**:
    - `ai.py`: Handles image uploads and diagnostic logic.
    - `expert_calls.py`: Manages Vapi outbound call triggers.
    - `store.py`: Marketplace logic (Product listing, Payments).
    - `community.py`: Social feed backend.
    - `admin_ai.py`: Observability and AI accuracy metrics.
- **`core/`**: Database connections (MongoDB), configuration management (Environment variables).
- **`models/`**: Pydantic schemas for data validation.
- **`services/`**: Business logic (Threat map generation, PDF report creation).
- **`ai_model.py`**: The wrapper for the PyTorch MobileNetV3 diagnostic engine.
- **`engine.py`**: The "Intelligence Engine" that coordinates multiple AI responses.

### `backend/scripts/`
- `train_lite.py`: Script to train a small MobileNet model locally.
- `evaluate_field.py`: Benchmarks AI performance against "real-world" field data.
- `generate_knowledge_assets.py`: Builds the treatment and translation CSV bundle.

---

## 🧠 `PlantVillage-Dataset/`
Contains the raw material for the AI intelligence.

- **`raw/color/`**: 50,000+ categorized images of healthy and diseased leaves.
- **`leaf_grouping/`**: Algorithms to map specific leaves to general crop categories.
- **`field/`**: Images captured in real farming conditions (used for validation).
- **`utils/`**: Image preprocessing scripts (resizing, normalization).

---

## 📊 `static/`
This folder is mounted by the backend to serve public files.

- **`uploads/`**: Temporary storage for farmer-uploaded images during diagnosis.
- **`accuracy.json`**: Real-time dump of the AI model's training performance.
- **`model_registry.json`**: Tracks different versions of the AI model.
- **`confusion_matrix.png`**: Visual report of AI diagnostic accuracy.

---

> **Note**: This structure is optimized for high-performance AI inference and a premium user experience. Every file has a specific role in the "Plant Doctors" ecosystem.
# 🌿 Plant Doctors: The Billion-Dollar Agri-Tech AI Platform

Welcome to the comprehensive technical guide for **Plant Doctors**. This project is a state-of-the-art agricultural intelligence platform designed to empower millions of farmers with real-time AI disease diagnosis, community-driven pest tracking, and a premium marketplace.

---

## 🚀 The Tech Stack (Basic to Advanced)

This project leverages a sophisticated mix of modern technologies to deliver a high-performance, low-latency, and visually stunning experience.

### 🌐 Frontend (The Web Engine)
Built with **Next.js 16 (App Router)** and **React 19**, the frontend is designed for speed and interactivity.

- **Core**: JavaScript/TypeScript, React 19, Next.js 16 (Server Components).
- **Styling**: **Tailwind CSS 4.0** (The latest in utility-first CSS for extreme design flexibility).
- **Animations**: **Framer Motion** for smooth, cinematic UI transitions and micro-interactions.
- **3D Graphics**: **Three.js** & **@react-three/fiber** for immersive 3D elements in the dashboard.
- **Visualizations**: **Recharts** and **Chart.js** for real-time crop health and market price analysis.
- **Inference**: **TensorFlow.js** for client-side AI processing (Edge AI).

### ⚙️ Backend (The Intelligence Layer)
Driven by **FastAPI**, the backend is a high-speed asynchronous engine.

- **Framework**: **FastAPI** (Python 3.10+) for high-concurrency API handling.
- **Database**: **MongoDB** with **Motor** (Asynchronous driver) for flexible, geospatial-enabled data storage.
- **Task Orchestration**: Custom logic for real-time weather integration and AI service dispatching.
- **Voice AI**: **Vapi API** integration for outbound AI expert voice calls.
- **Payments**: **Razorpay** integration for a seamless marketplace checkout experience.
- **PDF Generation**: **FPDF2** for generating official crop health reports.

### 🧠 AI & Machine Learning (The Neural Engine)
The heart of the application is its multi-layer AI pipeline.

- **Model Architecture**: **MobileNetV3** (CNN) trained on the **PlantVillage** dataset (~50,000+ images).
- **Frameworks**: **PyTorch** for server-side inference and **Scikit-learn** for agricultural data analysis.
- **Smart Logic**: Geospatial early-warning system that alerts farmers when 14+ neighbors report the same disease.

---

## 📂 Project Structure

```text
/Plant Doctors
├── 📂 backend             # FastAPI Engine
│   ├── 📂 app             # Core Application Logic
│   │   ├── 📂 api         # API Routes (Auth, AI, Marketplace, Community)
│   │   ├── 📂 core        # Database config, security, and settings
│   │   ├── 📂 models      # Pydantic Schemas (Data Validations)
│   │   ├── 📂 services    # Business logic (Threat Map, Reports, Expert Calls)
│   │   ├── 📄 ai_model.py # PyTorch MobileNetV3 Wrapper
│   │   └── 📄 main.py     # Master Entry Point
│   ├── 📄 requirements.txt # Python Dependencies
│   └── 📄 .env            # Secrets (Vapi, Mongo, Razorpay)
├── 📂 web                 # Next.js Frontend
│   ├── 📂 src
│   │   ├── 📂 app         # File-based Routing (Dashboard, Scanner, etc.)
│   │   ├── 📂 components  # Reusable UI Glassmorphic Components
│   │   ├── 📂 core        # Global Contexts (Expert Call, Auth)
│   │   └── 📂 styles      # Design System Tokens
│   ├── 📄 package.json    # JS Dependencies
│   └── 📄 tailwind.config # Advanced Design Tokens
├── 📂 static              # Global static assets (logs, reports)
└── 📄 start_platform.sh   # One-click startup script
```

---

## ✨ Core Features: Deep Dive

### 1. 🔍 AI Plant Scanner
- **Action**: Farmers upload a photo of a sick leaf.
- **Tech**: The image is processed via PyTorch on the backend.
- **Output**: Instant diagnosis, confidence score, and a **Step-by-Step Treatment Plan** (Medicine name, Dosage, Frequency).

### 2. 📞 AI Expert Voice Call (Vapi)
- **Problem**: Farmers often prefer speaking over reading.
- **Solution**: A button triggers a real outbound call to the farmer's phone.
- **Experience**: An AI "Plant Doctor" talks in **Hinglish**, asks about symptoms, and provides verbal solutions.

### 3. ⛈️ Smart Weather Dashboard
- **Integration**: Real-time data from **OpenWeatherMap**.
- **Intelligence**: If rain is predicted, the AI warns: *"Don't spray Urea today, it will wash away!"*
- **Health Score**: A dynamic 0-100 score of current farm suitability.

### 4. 🏘️ Community Threat Map
- **Geo-Fencing**: Uses MongoDB `$near` queries to find disease outbreaks.
- **Early Warning**: If a disease is detected within 10km of a farmer, they get a "Network Alert" to start preventive measures.

### 5. 🛒 Krishi Bazaar (Marketplace)
- **B2B**: Buy seeds/fertilizers from verified brands.
- **C2C**: Farmers can list used tractors or surplus produce for nearby farmers.

---

## 🛠️ How It Was Built (The Workflow)

1.  **Architecture First**: We designed a "Clean Architecture" separation between AI inference, data storage, and the UI.
2.  **UI/UX Transformation**: We moved from basic HTML to a **Dark-Mode Glassmorphic Design** inspired by premium fintech apps.
3.  **The Intelligence Pipeline**:
    - Trained a MobileNetV3 model for crop disease detection.
    - Integrated Vapi for voice-based expert assistance.
    - Built a custom "Small Farmer" localization engine for 8+ Indian languages.
4.  **Production Readiness**: Implemented robust error handling, database indexing, and a unified startup script.

---

## 🚦 Getting Started

To run the entire ecosystem locally:

1.  **Grant Permissions**: `chmod +x start_platform.sh`
2.  **Execute**: `./start_platform.sh`
3.  **Access**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📈 Future Roadmap
- **Satellite Integration**: Real-time NDVI (Normalized Difference Vegetation Index) monitoring.
- **Offline AI**: Moving the PyTorch models to the mobile device for zero-internet areas.
- **Government Integration**: Real-time Mandi price parity across all of India.

---

> **Built for the billion-dollar future of Agriculture.** 🌾✨
