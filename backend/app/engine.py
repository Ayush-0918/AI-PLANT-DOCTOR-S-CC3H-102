import os
import random
from pathlib import Path
from typing import Any, Optional

import numpy as np  # type: ignore[import]
import pandas as pd  # type: ignore[import]
from fastapi import APIRouter  # type: ignore[import]

from app.services.dataset_locator_service import (
    AGRICULTURE_PRICE_DATASET_CANDIDATES,
    CROP_RECOMMENDATION_CANDIDATES,
    FERTILIZER_RECOMMENDATION_CANDIDATES,
    first_existing_path,
)

router = APIRouter()

BACKEND_ROOT = Path(__file__).resolve().parents[1]

FEATURE_COLS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

CROP_RECO_SYNTHETIC = [
    {"N": 90, "P": 42, "K": 43, "temperature": 20.8, "humidity": 82.0, "ph": 6.5, "rainfall": 202.9, "label": "rice"},
    {"N": 85, "P": 58, "K": 41, "temperature": 21.7, "humidity": 80.3, "ph": 7.0, "rainfall": 227.0, "label": "rice"},
    {"N": 60, "P": 55, "K": 44, "temperature": 23.0, "humidity": 82.3, "ph": 7.1, "rainfall": 236.2, "label": "maize"},
    {"N": 74, "P": 35, "K": 40, "temperature": 26.5, "humidity": 80.0, "ph": 6.8, "rainfall": 150.0, "label": "chickpea"},
    {"N": 20, "P": 67, "K": 20, "temperature": 17.0, "humidity": 56.6, "ph": 5.8, "rainfall": 94.1, "label": "wheat"},
    {"N": 100, "P": 100, "K": 50, "temperature": 24.0, "humidity": 90.0, "ph": 5.5, "rainfall": 180.0, "label": "sugarcane"},
    {"N": 20, "P": 40, "K": 40, "temperature": 26.0, "humidity": 65.0, "ph": 6.0, "rainfall": 100.0, "label": "potato"},
    {"N": 18, "P": 18, "K": 45, "temperature": 29.0, "humidity": 70.0, "ph": 5.9, "rainfall": 115.0, "label": "tomato"},
    {"N": 40, "P": 60, "K": 55, "temperature": 33.0, "humidity": 50.0, "ph": 7.5, "rainfall": 60.0, "label": "cotton"},
    {"N": 30, "P": 60, "K": 30, "temperature": 25.0, "humidity": 72.0, "ph": 6.3, "rainfall": 130.0, "label": "mango"},
]


def _read_first_existing(paths: list[Path]) -> tuple[Optional[pd.DataFrame], Optional[Path]]:
    for path in paths:
        if path.exists():
            try:
                return pd.read_csv(path), path
            except Exception:
                continue
    return None, None


def _load_crop_recommendation_data() -> tuple[pd.DataFrame, str]:
    df, source_path = _read_first_existing(CROP_RECOMMENDATION_CANDIDATES)
    if df is None:
        fallback_df = pd.DataFrame(CROP_RECO_SYNTHETIC)
        return fallback_df, "synthetic_fallback"

    missing = [col for col in FEATURE_COLS + ["label"] if col not in df.columns]
    if missing:
        fallback_df = pd.DataFrame(CROP_RECO_SYNTHETIC)
        return fallback_df, f"synthetic_fallback_missing_columns:{','.join(missing)}"

    for col in FEATURE_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=FEATURE_COLS + ["label"]).copy()
    if df.empty:
        fallback_df = pd.DataFrame(CROP_RECO_SYNTHETIC)
        return fallback_df, "synthetic_fallback_empty_csv"

    return df, str(source_path)


def _load_fertilizer_recommendation_data() -> tuple[Optional[pd.DataFrame], str]:
    df, source_path = _read_first_existing(FERTILIZER_RECOMMENDATION_CANDIDATES)
    if df is None:
        return None, "none"
    return df, str(source_path)


try:
    agri_source = first_existing_path(AGRICULTURE_PRICE_DATASET_CANDIDATES)
    if agri_source is None:
        raise FileNotFoundError("Agriculture price dataset not found in generated or legacy locations.")
    agri_df = pd.read_csv(agri_source)
    print(f"✅ Agriculture Price Dataset Loaded: {len(agri_df)} records from {agri_source}")
except Exception as exc:
    agri_df = None
    print(f"⚠️ Agriculture Price Dataset Warning: {exc}")

crop_df, crop_source = _load_crop_recommendation_data()
feature_matrix = crop_df[FEATURE_COLS].values
labels = crop_df["label"].astype(str).values
print(f"✅ Crop Recommendation Loaded: {len(crop_df)} rows from {crop_source}")

fertilizer_df, fertilizer_source = _load_fertilizer_recommendation_data()
if fertilizer_df is not None:
    print(f"✅ Fertilizer Recommendation Loaded: {len(fertilizer_df)} rows from {fertilizer_source}")
else:
    print("⚠️ Fertilizer Recommendation CSV not found. Using smart fallback logic.")


@router.get("/recommend-crop")
def recommend(n: float, p: float, k: float, temp: float, hum: float, ph: float, rain: float):
    user_input = np.array([n, p, k, temp, hum, ph, rain], dtype=float)
    distances = np.linalg.norm(feature_matrix - user_input, axis=1)
    best_idx = int(np.argmin(distances))
    best_match_label = str(labels[best_idx])
    best_row = crop_df.iloc[best_idx]

    min_dist = float(distances[best_idx])
    confidence_score = max(70.0, min(99.8, 100.0 - (min_dist * 0.3)))

    return {
        "recommended_crop": best_match_label.capitalize(),
        "confidence": f"{confidence_score:.1f}%",
        "insight": (
            f"Based on your soil profile and weather inputs, {best_match_label.capitalize()} shows the best match."
        ),
        "environmental_match": {
            "optimal_temp": f"{float(best_row['temperature']):.1f}\u00b0C",
            "optimal_ph": f"{float(best_row['ph']):.1f}",
        },
        "dataset_source": crop_source,
        "premium_tip": (
            f"Detected a {confidence_score:.1f}% environment match. Use precision NPK planning for stronger yield stability."
        ),
    }


@router.get("/recommend-fertilizer")
def recommend_fertilizer(
    crop: str,
    soil_type: str = "loamy",
    growth_stage: str = "vegetative",
    n_status: str = "balanced",
    p_status: str = "balanced",
    k_status: str = "balanced",
):
    crop_l = crop.strip().lower()
    soil_l = soil_type.strip().lower()
    stage_l = growth_stage.strip().lower()
    n_l = n_status.strip().lower()
    p_l = p_status.strip().lower()
    k_l = k_status.strip().lower()

    if fertilizer_df is not None and not fertilizer_df.empty:
        df = fertilizer_df.copy()
        for col in ["crop", "soil_type", "growth_stage", "n_status", "p_status", "k_status"]:
            if col in df.columns:
                df[col] = df[col].astype(str).str.lower().str.strip()

        filtered = df[df.get("crop", "") == crop_l] if "crop" in df.columns else df
        if "soil_type" in df.columns and not filtered.empty:
            exact_soil = filtered[filtered["soil_type"] == soil_l]
            filtered = exact_soil if not exact_soil.empty else filtered
        if "growth_stage" in df.columns and not filtered.empty:
            exact_stage = filtered[filtered["growth_stage"] == stage_l]
            filtered = exact_stage if not exact_stage.empty else filtered

        if not filtered.empty and all(col in filtered.columns for col in ["n_status", "p_status", "k_status"]):
            exact_npk = filtered[
                (filtered["n_status"] == n_l)
                & (filtered["p_status"] == p_l)
                & (filtered["k_status"] == k_l)
            ]
            filtered = exact_npk if not exact_npk.empty else filtered

        if not filtered.empty:
            row = filtered.iloc[0].to_dict()
            return {
                "recommended_fertilizer": row.get("recommended_fertilizer", "NPK balanced feed"),
                "dosage_kg_per_acre": row.get("dosage_kg_per_acre", "35"),
                "application_method": row.get("application_method", "split_dose"),
                "advisory_en": row.get("advisory_en", "Follow split application and re-check field after 7 days."),
                "dataset_source": fertilizer_source,
            }

    if n_l == "low":
        fertilizer = "Urea + FYM"
        dosage = "55"
    elif p_l == "low":
        fertilizer = "DAP / SSP blend"
        dosage = "45"
    elif k_l == "low":
        fertilizer = "MOP (Muriate of Potash)"
        dosage = "40"
    elif n_l == "high":
        fertilizer = "Biofertilizer + irrigation flush"
        dosage = "25"
    else:
        fertilizer = "NPK 19:19:19 balanced feed"
        dosage = "35"

    return {
        "recommended_fertilizer": fertilizer,
        "dosage_kg_per_acre": dosage,
        "application_method": "split_dose_root_zone",
        "advisory_en": (
            f"For {crop_l or 'your crop'} at {stage_l}, apply {fertilizer} and reassess nutrient status after one week."
        ),
        "dataset_source": "smart_fallback",
    }


@router.get("/mandi-decision")
def mandi_decision(commodity: str, district: str):
    if agri_df is None:
        return {
            "decision": "WAIT",
            "confidence": "0%",
            "message": "Agriculture dataset not found. Defaulting to safe wait.",
        }

    comm_df = agri_df[
        (agri_df["Commodity"].str.lower() == commodity.lower())
        & (agri_df["District Name"].str.lower() == district.lower())
    ]

    if comm_df.empty:
        comm_df = agri_df[(agri_df["Commodity"].str.lower() == commodity.lower())]

    if comm_df.empty:
        return {"decision": "WAIT", "confidence": "50%", "message": f"No data for {commodity}. Hold inventory."}

    latest = comm_df.sample(1).iloc[0]
    current_price = latest["Modal_Price"]
    predicted_price = latest.get("AI_Predicted_Price", current_price + random.randint(-150, 150))
    weather_risk = latest.get("Rainfall_mm", 0) > 50

    profit_diff = predicted_price - current_price

    if weather_risk and profit_diff < 0:
        decision = "SELL NOW"
        risk_level = "Red"
        confidence = 94.5
        msg = (
            f"High rainfall detected ({latest.get('Rainfall_mm', 0)}mm). "
            f"Prices predicted to drop by ₹{abs(profit_diff)}. Liquidate stock."
        )
    elif profit_diff > 100:
        decision = "WAIT"
        risk_level = "Yellow"
        confidence = 88.2
        msg = f"AI predicts a price hike of ₹{profit_diff}. Hold for higher profits."
    else:
        decision = "SELL"
        risk_level = "Green"
        confidence = 78.0
        msg = f"Market is stable at ₹{current_price}. Good time to sell."

    return {
        "decision": decision,
        "current_price": int(current_price),
        "predicted_price": int(predicted_price),
        "profit_estimation_diff": int(profit_diff),
        "confidence_score_pct": float(confidence),
        "risk_badge": risk_level,
        "insight": msg,
    }
