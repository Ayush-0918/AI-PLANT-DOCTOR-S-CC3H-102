from __future__ import annotations

from functools import lru_cache
from typing import Any, Optional

import pandas as pd  # type: ignore[import]

from app.services.dataset_locator_service import (
    FERTILIZER_RECOMMENDATION_CANDIDATES,
    first_existing_path,
)

SOIL_PROFILES: dict[str, dict[str, str]] = {
    "Alluvial_Soil": {
        "display_name": "Alluvial Soil",
        "display_name_hi": "जलोढ़ मिट्टी",
        "dataset_soil_type": "loamy",
        "default_crop": "wheat",
        "n_status": "balanced",
        "p_status": "balanced",
        "k_status": "balanced",
        "summary": "River-belt soil with good moisture holding and broad crop compatibility.",
        "summary_hi": "नदी-बेल्ट की मिट्टी जिसमें अच्छी नमी धारण करने की क्षमता और व्यापक फसल अनुकूलता है।",
        "nitrogen_advice": "Nitrogen looks stable. Keep split urea application only after visible crop demand.",
        "nitrogen_advice_hi": "नाइट्रोजन स्थिर लग रहा है। स्पष्ट फसल मांग के बाद ही यूरिया का उपयोग करें।",
        "phosphorus_advice": "Phosphorus is broadly balanced. Basal DAP can stay moderate for root support.",
        "phosphorus_advice_hi": "फॉस्फोरस व्यापक रूप से संतुलित है। बेसल डीएपी जड़ों के समर्थन के लिए मध्यम रह सकता है।",
        "potassium_advice": "Potassium is in a safe range. Maintain only a light potash top-up near flowering.",
        "potassium_advice_hi": "पोटैशियम सुरक्षित सीमा में है। फूल आने के समय केवल हल्का पोटाश डालें।",
    },
    "Arid_Soil": {
        "display_name": "Arid Soil",
        "display_name_hi": "शुष्क मिट्टी",
        "dataset_soil_type": "sandy_loam",
        "default_crop": "millet",
        "n_status": "low",
        "p_status": "balanced",
        "k_status": "low",
        "summary": "Dry, fast-draining soil that usually needs moisture retention and stronger nutrient support.",
        "summary_hi": "सूखी, तेजी से जल निकासी वाली मिट्टी जिसे आमतौर पर नमी बनाए रखने और मजबूत पोषक तत्वों की आवश्यकता होती है।",
        "nitrogen_advice": "Nitrogen is likely low. Prioritize urea in split doses with irrigation support.",
        "nitrogen_advice_hi": "नाइट्रोजन कम होने की संभावना है। सिंचाई के साथ यूरिया को विभाजित खुराक में प्राथमिकता दें।",
        "phosphorus_advice": "Phosphorus is acceptable for now, but recheck after the next soil test cycle.",
        "phosphorus_advice_hi": "फॉस्फोरस अभी के लिए स्वीकार्य है, लेकिन अगले मिट्टी परीक्षण चक्र के बाद पुन: जांचें।",
        "potassium_advice": "Potassium is likely low. Add potash to improve stress tolerance and grain filling.",
        "potassium_advice_hi": "पोटैशियम कम होने की संभावना है। तनाव सहनशीलता और दाना भरने में सुधार के लिए पोटाश डालें।",
    },
    "Black_Soil": {
        "display_name": "Black Soil",
        "display_name_hi": "काली मिट्टी",
        "dataset_soil_type": "clay",
        "default_crop": "cotton",
        "n_status": "balanced",
        "p_status": "low",
        "k_status": "balanced",
        "summary": "Heavy cotton-belt soil with strong moisture holding but periodic phosphorus demand.",
        "summary_hi": "भारी कपास-बेल्ट वाली मिट्टी जिसमें नमी धारण करने की अच्छी क्षमता है लेकिन समय-समय पर फास्फोरस की आवश्यकता होती है।",
        "nitrogen_advice": "Nitrogen is manageable. Do not overspray urea unless leaves show active yellowing.",
        "nitrogen_advice_hi": "नाइट्रोजन प्रबंधनीय है। जब तक पत्तियां सक्रिय रूप से पीली न हों, यूरिया का अधिक छिड़काव न करें।",
        "phosphorus_advice": "Phosphorus is the main correction area. Basal DAP or SSP support will help root vigor.",
        "phosphorus_advice_hi": "फॉस्फोरस मुख्य सुधार क्षेत्र है। बेसल डीएपी या एसएसपी सपोर्ट जड़ों की शक्ति में मदद करेगा।",
        "potassium_advice": "Potassium is steady. Keep a maintenance dose only if your crop is at flowering or fruit set.",
        "potassium_advice_hi": "पोटैशियम स्थिर है। यदि आपकी फसल फूल आने या फल लगने की अवस्था में है, तो केवल रखरखाव की खुराक दें।",
    },
    "Laterite_Soil": {
        "display_name": "Laterite Soil",
        "display_name_hi": "लैटेराइट मिट्टी",
        "dataset_soil_type": "sandy_loam",
        "default_crop": "millet",
        "n_status": "low",
        "p_status": "low",
        "k_status": "low",
        "summary": "Highly weathered acidic soil that usually needs broad nutrient correction and organic matter.",
        "summary_hi": "अत्यधिक अपक्षयित अम्लीय मिट्टी जिसे आमतौर पर व्यापक पोषक सुधार और कार्बनिक पदार्थों की आवश्यकता होती है।",
        "nitrogen_advice": "Nitrogen is low. Use a split nitrogen plan and combine it with organic matter.",
        "nitrogen_advice_hi": "नाइट्रोजन कम है। विभाजित नाइट्रोजन योजना का उपयोग करें और इसे जैविक पदार्थों के साथ मिलाएं।",
        "phosphorus_advice": "Phosphorus is low. Basal DAP or SSP support is important for early root development.",
        "phosphorus_advice_hi": "फॉस्फोरस कम है। शुरुआती जड़ विकास के लिए बेसल डीएपी या एसएसपी समर्थन महत्वपूर्ण है।",
        "potassium_advice": "Potassium is low. Add MOP to improve stress handling and overall crop strength.",
        "potassium_advice_hi": "पोटैशियम कम है। तनाव प्रबंधन और समग्र फसल शक्ति में सुधार के लिए एमओपी डालें।",
    },
    "Mountain_Soil": {
        "display_name": "Mountain Soil",
        "display_name_hi": "पर्वतीय मिट्टी",
        "dataset_soil_type": "loamy",
        "default_crop": "potato",
        "n_status": "balanced",
        "p_status": "low",
        "k_status": "balanced",
        "summary": "Cool-region loamy soil that supports tubers well but often benefits from phosphorus support.",
        "summary_hi": "ठंडे क्षेत्र की दोमट मिट्टी जो कंदों का अच्छा समर्थन करती है लेकिन अक्सर फास्फोरस सहायता से लाभान्वित होती है।",
        "nitrogen_advice": "Nitrogen is adequate. Keep only measured top-dressing and avoid overuse.",
        "nitrogen_advice_hi": "नाइट्रोजन पर्याप्त है। केवल मापी गई टॉप-ड्रेसिंग रखें और अत्यधिक प्रयोग से बचें।",
        "phosphorus_advice": "Phosphorus is likely low. Root-zone DAP support will improve establishment and tuber set.",
        "phosphorus_advice_hi": "फॉस्फोरस कम होने की संभावना है। रूट-जोन डीएपी समर्थन से स्थापना और कंद बनने में सुधार होगा।",
        "potassium_advice": "Potassium is acceptable. Add only a moderate maintenance dose later in the crop cycle.",
        "potassium_advice_hi": "पोटैशियम स्वीकार्य है। फसल चक्र में बाद में केवल एक मध्यम रखरखाव खुराक जोड़ें।",
    },
    "Red_Soil": {
        "display_name": "Red Soil",
        "display_name_hi": "लाल मिट्टी",
        "dataset_soil_type": "loamy",
        "default_crop": "groundnut",
        "n_status": "low",
        "p_status": "low",
        "k_status": "balanced",
        "summary": "Iron-rich soil that usually runs low in nitrogen, phosphorus, and organic matter.",
        "summary_hi": "लोह-युक्त मिट्टी जिसमें आमतौर पर नाइट्रोजन, फास्फोरस और कार्बनिक पदार्थों की कमी होती है।",
        "nitrogen_advice": "Nitrogen is low. Urea support plus FYM will lift early vigor.",
        "nitrogen_advice_hi": "नाइट्रोजन कम है। यूरिया सहायता और एफवाईएम प्रारंभिक शक्ति बढ़ाएंगे।",
        "phosphorus_advice": "Phosphorus is low. DAP or SSP at the root zone will help root growth.",
        "phosphorus_advice_hi": "फॉस्फोरस कम है। रूट जोन में डीएपी या एसएसपी जड़ वृद्धि में मदद करेगा।",
        "potassium_advice": "Potassium is broadly stable. Keep only a maintenance top-up if the crop enters flowering.",
        "potassium_advice_hi": "पोटैशियम व्यापक रूप से स्थिर है। यदि फसल फूल आने की अवस्था में है, तो केवल रखरखाव खुराक दें।",
    },
    "Yellow_Soil": {
        "display_name": "Yellow Soil",
        "display_name_hi": "पीली मिट्टी",
        "dataset_soil_type": "loamy",
        "default_crop": "maize",
        "n_status": "low",
        "p_status": "balanced",
        "k_status": "low",
        "summary": "Leached soil with weaker organic matter, often needing nitrogen and potash support.",
        "summary_hi": "कम जैविक पदार्थ वाली मिट्टी, जिसे अक्सर नाइट्रोजन और पोटाश सुहारे की आवश्यकता होती है।",
        "nitrogen_advice": "Nitrogen is low. Split urea doses will help maintain green growth.",
        "nitrogen_advice_hi": "नाइट्रोजन कम है। विभाजित यूरिया खुराक हरी वृद्धि को बनाए रखने में मदद करेगी।",
        "phosphorus_advice": "Phosphorus is acceptable. Recheck only if the crop shows weak root development.",
        "phosphorus_advice_hi": "फॉस्फोरस स्वीकार्य है। केवल तभी जांचें जब फसल कमजोर जड़ विकास दिखाए।",
        "potassium_advice": "Potassium is low. Add MOP to improve stem strength and grain fill.",
        "potassium_advice_hi": "पोटैशियम कम है। तने की मजबूती और दाना भरने में सुधार के लिए एमओपी डालें।",
    },
}


DEFAULT_SOIL_PROFILE = {
    "display_name": "Field Soil",
    "display_name_hi": "खेत की मिट्टी",
    "dataset_soil_type": "loamy",
    "default_crop": "wheat",
    "n_status": "balanced",
    "p_status": "balanced",
    "k_status": "balanced",
    "summary": "Soil image classified with partial confidence. Use it as a field estimate, not a lab replacement.",
    "summary_hi": "आंशिक विश्वास के साथ वर्गीकृत मिट्टी की छवि। इसे एक अनुमान के रूप में उपयोग करें।",
    "nitrogen_advice": "Nitrogen appears manageable. Keep fertilization aligned with crop stage.",
    "nitrogen_advice_hi": "नाइट्रोजन प्रबंधनीय लग रहा है। निषेचन को फसल की अवस्था के अनुरूप रखें।",
    "phosphorus_advice": "Phosphorus looks serviceable. Add basal support only if roots are weak.",
    "phosphorus_advice_hi": "फॉस्फोरस उपयोगी लग रहा है। केवल जड़ें कमजोर होने पर ही बेसल समर्थन दें।",
    "potassium_advice": "Potassium appears manageable. Add maintenance potash near flowering if needed.",
    "potassium_advice_hi": "पोटैशियम प्रबंधनीय लग रहा है। यदि आवश्यक हो तो फूल आने के पास रखरखाव पोटाश डालें।",
}


SOIL_TYPE_ALIASES = {
    "alluvial": "Alluvial_Soil",
    "alluvial_soil": "Alluvial_Soil",
    "arid": "Arid_Soil",
    "arid_soil": "Arid_Soil",
    "black": "Black_Soil",
    "black_soil": "Black_Soil",
    "laterite": "Laterite_Soil",
    "laterite_soil": "Laterite_Soil",
    "mountain": "Mountain_Soil",
    "mountain_soil": "Mountain_Soil",
    "red": "Red_Soil",
    "red_soil": "Red_Soil",
    "yellow": "Yellow_Soil",
    "yellow_soil": "Yellow_Soil",
    "loamy": "Alluvial_Soil",
    "clay": "Black_Soil",
    "sandy_loam": "Arid_Soil",
}

FERTILIZER_PRICE_PER_KG = {
    "Urea": 6.0,
    "DAP": 27.0,
    "SSP": 7.0,
    "MOP": 17.0,
    "NPK 19:19:19": 38.0,
    "Biofertilizer": 24.0,
    "FYM": 2.0,
}

FERTILIZER_COMPONENTS = {
    "Urea + FYM": [("Urea", 0.45), ("FYM", 0.55)],
    "DAP / SSP blend": [("DAP", 0.7), ("SSP", 0.3)],
    "MOP (Muriate of Potash)": [("MOP", 1.0)],
    "NPK 19:19:19 balanced feed": [("NPK 19:19:19", 1.0)],
    "Biofertilizer + irrigation flush": [("Biofertilizer", 0.7), ("FYM", 0.3)],
}

FALLBACK_RECOMMENDATIONS = {
    "n_status": {
        "recommended_fertilizer": "Urea + FYM",
        "recommended_fertilizer_hi": "यूरिया + एफवाईएम",
        "dosage_kg_per_acre": 55.0,
        "application_method": "split_dose_root_zone",
        "advisory_en": "Apply nitrogen in split doses and re-check leaf color after 7 days.",
        "advisory_hi": "विभाजित खुराक में नाइट्रोजन लगाएं और 7 दिनों के बाद पत्तियों के रंग की जांच करें।",
    },
    "p_status": {
        "recommended_fertilizer": "DAP / SSP blend",
        "recommended_fertilizer_hi": "डीएपी / एसएसपी मिश्रण",
        "dosage_kg_per_acre": 45.0,
        "application_method": "basal_application",
        "advisory_en": "Use a basal phosphorus application close to the root zone and reassess in one week.",
        "advisory_hi": "जड़ क्षेत्र के करीब बेसल फास्फोरस का उपयोग करें और एक सप्ताह में पुनर्मूल्यांकन करें।",
    },
    "k_status": {
        "recommended_fertilizer": "MOP (Muriate of Potash)",
        "recommended_fertilizer_hi": "एमओपी (मुरिएट ऑफ पोटाश)",
        "dosage_kg_per_acre": 40.0,
        "application_method": "side_dressing",
        "advisory_en": "Apply potash beside the crop row and irrigate lightly after application.",
        "advisory_hi": "फसल की कतार के पास पोटाश लगाएं और लगाने के बाद हल्की सिंचाई करें।",
    },
    "balanced": {
        "recommended_fertilizer": "NPK 19:19:19 balanced feed",
        "recommended_fertilizer_hi": "एनपीके 19:19:19 संतुलित आहार",
        "dosage_kg_per_acre": 35.0,
        "application_method": "foliar_plus_basal",
        "advisory_en": "Balanced feed is enough for now. Re-test the soil after the next growth window.",
        "advisory_hi": "अभी के लिए संतुलित आहार पर्याप्त है। अगले विकास काल के बाद मिट्टी का पुन: परीक्षण करें।",
    },
}


NUTRIENT_LABELS = {
    "n_status": {"en": "Nitrogen", "hi": "नाइट्रोजन"},
    "p_status": {"en": "Phosphorus", "hi": "फॉस्फोरस"},
    "k_status": {"en": "Potassium", "hi": "पोटैशियम"},
}



def _format_currency(value: float) -> str:
    return f"₹{round(value):,}"


def _normalize_diagnosis(diagnosis: str) -> str:
    cleaned = diagnosis.strip().replace(" ", "_")
    if cleaned in SOIL_PROFILES:
        return cleaned
    if cleaned.endswith("_Soil"):
        return cleaned
    candidate = f"{cleaned}_Soil"
    if candidate in SOIL_PROFILES:
        return candidate
    return cleaned


def _normalize_soil_type(soil_type: str) -> str:
    normalized = soil_type.strip().lower().replace(" ", "_")
    if normalized in SOIL_PROFILES:
        return normalized
    return SOIL_TYPE_ALIASES.get(normalized, normalized)


def _normalize_crop(crop: str, default_crop: str) -> str:
    normalized = crop.strip().lower().replace(" ", "_")
    aliases = {
        "paddy": "rice",
        "corn": "maize",
        "sugar_cane": "sugarcane",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized or default_crop


def _clean_application_method(method: str) -> str:
    return method.replace("_", " ").strip().title()


def _estimate_product_cost(product_name: str, dosage_kg_per_acre: float) -> float:
    components = FERTILIZER_COMPONENTS.get(product_name, [(product_name, 1.0)])
    total = 0.0
    for component_name, share in components:
        price = FERTILIZER_PRICE_PER_KG.get(component_name, 20.0)
        total += dosage_kg_per_acre * share * price
    return round(total, 2)


@lru_cache(maxsize=1)
def _load_fertilizer_data() -> tuple[Optional[pd.DataFrame], str]:
    source_path = first_existing_path(FERTILIZER_RECOMMENDATION_CANDIDATES)
    if source_path is None:
        return None, "none"

    df = pd.read_csv(source_path)
    for col in ["crop", "soil_type", "growth_stage", "n_status", "p_status", "k_status"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.lower().str.strip()
    return df, str(source_path)


def _select_recommendation(
    crop: str,
    soil_type: str,
    growth_stage: str,
    n_status: str,
    p_status: str,
    k_status: str,
) -> dict[str, Any]:
    df, source = _load_fertilizer_data()
    if df is not None and not df.empty:
        filtered = df[df["crop"] == crop] if "crop" in df.columns else df
        if filtered.empty:
            filtered = df

        if "soil_type" in filtered.columns:
            soil_filtered = filtered[filtered["soil_type"] == soil_type]
            filtered = soil_filtered if not soil_filtered.empty else filtered

        if "growth_stage" in filtered.columns:
            stage_filtered = filtered[filtered["growth_stage"] == growth_stage]
            filtered = stage_filtered if not stage_filtered.empty else filtered

        exact = filtered[
            (filtered.get("n_status", "") == n_status)
            & (filtered.get("p_status", "") == p_status)
            & (filtered.get("k_status", "") == k_status)
        ]
        if not exact.empty:
            row = exact.iloc[0].to_dict()
            row["dataset_source"] = source
            return row

    fallback_key = "balanced"
    if n_status == "low":
        fallback_key = "n_status"
    elif p_status == "low":
        fallback_key = "p_status"
    elif k_status == "low":
        fallback_key = "k_status"

    return {
        **FALLBACK_RECOMMENDATIONS[fallback_key],
        "dataset_source": "smart_fallback",
    }


def _build_plan_item(
    nutrient_key: str,
    recommendation: dict[str, Any],
    area_acres: float,
    language: str = "English",
) -> dict[str, Any]:
    dosage_kg_per_acre = round(float(recommendation.get("dosage_kg_per_acre", 0) or 0), 2)
    dosage_for_farm = round(dosage_kg_per_acre * area_acres, 2)
    estimated_per_acre = _estimate_product_cost(
        str(recommendation.get("recommended_fertilizer", "")),
        dosage_kg_per_acre,
    )
    estimated_total = round(estimated_per_acre * area_acres, 2)

    is_hi = language in ["हिंदी", "hi", "हिन्दी"]
    nutrient_label = NUTRIENT_LABELS.get(nutrient_key, {}).get("hi" if is_hi else "en", "Nutrient")
    product_name = recommendation.get("recommended_fertilizer_hi" if is_hi else "recommended_fertilizer", recommendation.get("recommended_fertilizer", "NPK 19:19:19 balanced feed"))
    advisory = recommendation.get("advisory_hi" if is_hi else "advisory_en", recommendation.get("advisory_en", "Follow a split application and re-check in 7 days."))

    return {
        "nutrient": nutrient_label,
        "product_name": str(product_name),
        "dosage_kg_per_acre": dosage_kg_per_acre,
        "dosage_for_farm_kg": dosage_for_farm,
        "estimated_cost_inr": estimated_total,
        "estimated_cost_label": _format_currency(estimated_total),
        "application_method": _clean_application_method(str(recommendation.get("application_method", "split_dose"))),
        "advisory": str(advisory),
    }


def build_soil_report_from_prediction(
    diagnosis: str,
    confidence_pct: Optional[float],
    crop: str,
    growth_stage: str,
    area_acres: float,
    source_model: str,
    language: str = "English",
) -> dict[str, Any]:
    normalized_diagnosis = _normalize_diagnosis(diagnosis)
    profile = SOIL_PROFILES.get(normalized_diagnosis, DEFAULT_SOIL_PROFILE)

    is_hi = language in ["हिंदी", "hi", "हिन्दी"]
    soil_type = profile["display_name_hi" if is_hi else "display_name"]
    soil_type_for_dataset = profile["dataset_soil_type"]
    crop_focus = _normalize_crop(crop, profile["default_crop"])
    stage = growth_stage.strip().lower() or "vegetative"
    area = max(1.0, round(float(area_acres or 1.0), 2))

    statuses = {
        "n_status": profile["n_status"],
        "p_status": profile["p_status"],
        "k_status": profile["k_status"],
    }
    low_nutrients = [key for key, value in statuses.items() if value == "low"]
    nutrient_keys = low_nutrients or ["balanced"]

    recommended_fertilizers: list[dict[str, Any]] = []
    for nutrient_key in nutrient_keys:
        if nutrient_key == "balanced":
            recommendation = _select_recommendation(
                crop=crop_focus,
                soil_type=soil_type_for_dataset,
                growth_stage=stage,
                n_status="balanced",
                p_status="balanced",
                k_status="balanced",
            )
            recommended_fertilizers.append(_build_plan_item("n_status", recommendation, area, language))
            break

        recommendation = _select_recommendation(
            crop=crop_focus,
            soil_type=soil_type_for_dataset,
            growth_stage=stage,
            n_status="low" if nutrient_key == "n_status" else "balanced",
            p_status="low" if nutrient_key == "p_status" else "balanced",
            k_status="low" if nutrient_key == "k_status" else "balanced",
        )
        recommended_fertilizers.append(_build_plan_item(nutrient_key, recommendation, area, language))

    total_cost = round(sum(item["estimated_cost_inr"] for item in recommended_fertilizers), 2)
    per_acre_cost = round(total_cost / area, 2)
    confidence_value = round(float(confidence_pct), 2) if confidence_pct is not None else None

    if is_hi:
        confidence_text = f"{confidence_value}% विश्वास।" if confidence_value is not None else "क्षेत्र अनुमान।"
        overall_advice = (
            f"{soil_type} की पहचान की गई। {profile['summary_hi']} फोकस फसल: {crop_focus.replace('_', ' ').title()}। "
            f"{confidence_text}"
        )
    else:
        confidence_text = f"{confidence_value}% confidence." if confidence_value is not None else "Field estimate."
        overall_advice = (
            f"{soil_type} detected. {profile['summary']} Focus crop: {crop_focus.replace('_', ' ').title()}. "
            f"{confidence_text}"
        )

    return {
        "success": True,
        "soil_type": soil_type,
        "confidence_pct": confidence_value,
        "analysis_method": "soil_model",
        "source_model": source_model or "custom-soil-v1",
        "crop_focus": crop_focus.replace("_", " ").title(),
        "area_acres": area,
        "overall_advice": overall_advice,
        "nitrogen_advice": profile["nitrogen_advice_hi" if is_hi else "nitrogen_advice"],
        "phosphorus_advice": profile["phosphorus_advice_hi" if is_hi else "phosphorus_advice"],
        "potassium_advice": profile["potassium_advice_hi" if is_hi else "potassium_advice"],
        "estimated_cost": _format_currency(total_cost),
        "estimated_cost_value_inr": total_cost,
        "estimated_cost_per_acre": _format_currency(per_acre_cost),
        "recommended_fertilizers": recommended_fertilizers,
        "raw_text": f"MODEL:{source_model or 'custom-soil-v1'}",
    }


def build_soil_report_from_ocr(
    raw_text: str,
    crop: str,
    area_acres: float,
    language: str = "English",
) -> dict[str, Any]:
    area = max(1.0, round(float(area_acres or 1.0), 2))
    crop_focus = _normalize_crop(crop, "wheat").replace("_", " ").title()
    recommendation = _build_plan_item("n_status", FALLBACK_RECOMMENDATIONS["balanced"], area, language)

    is_hi = language in ["हिंदी", "hi", "हिन्दी"]

    if is_hi:
        overall_advice = "एक मृदा परीक्षण कार्ड की पहचान हुई। कृपया नीचे दिए गए OCR टेक्स्ट की पुष्टि करें और इनपुट खरीदने से पहले NPK मानों की पुष्टि करें।"
        nitrogen_advice = "नाइट्रोजन के लैब मानों की पुष्टि होने तक संतुलित आहार से शुरू करें।"
        phosphorus_advice = "डीएपी या एसएसपी के आक्रामक प्रयोग से पहले मृदा परीक्षण कार्ड के फास्फोरस मान का उपयोग करें।"
        potassium_advice = "जब तक रिपोर्ट स्पष्ट रूप से कम पोटाश न दिखाए, पोटाश की मात्रा मध्यम रखें।"
        soil_type = "मृदा कार्ड OCR"
    else:
        overall_advice = "A soil test card was detected. Please verify the OCR text below and confirm NPK values before buying inputs."
        nitrogen_advice = "Start with a balanced feed until the lab values for nitrogen are confirmed."
        phosphorus_advice = "Use the soil card phosphorus number before increasing DAP or SSP aggressively."
        potassium_advice = "Keep potash moderate unless the report clearly shows low K."
        soil_type = "Soil Card OCR"

    return {
        "success": True,
        "soil_type": soil_type,
        "confidence_pct": None,
        "analysis_method": "ocr_fallback",
        "source_model": "pytesseract",
        "crop_focus": crop_focus,
        "area_acres": area,
        "overall_advice": overall_advice,
        "nitrogen_advice": nitrogen_advice,
        "phosphorus_advice": phosphorus_advice,
        "potassium_advice": potassium_advice,
        "estimated_cost": recommendation["estimated_cost_label"],
        "estimated_cost_value_inr": recommendation["estimated_cost_inr"],
        "estimated_cost_per_acre": recommendation["estimated_cost_label"],
        "recommended_fertilizers": [recommendation],
        "raw_text": raw_text[:500],
    }



def estimate_fertilizer_investment(
    crop: str,
    growth_stage: str,
    area_acres: float,
    soil_type: str = "loamy",
) -> dict[str, Any]:
    resolved_soil_key = _normalize_soil_type(soil_type)
    profile = SOIL_PROFILES.get(resolved_soil_key, DEFAULT_SOIL_PROFILE)
    crop_focus = _normalize_crop(crop, profile["default_crop"])
    stage = growth_stage.strip().lower() or "vegetative"
    area = max(1.0, round(float(area_acres or 1.0), 2))

    statuses = {
        "n_status": profile["n_status"],
        "p_status": profile["p_status"],
        "k_status": profile["k_status"],
    }
    low_nutrients = [key for key, value in statuses.items() if value == "low"]
    nutrient_keys = low_nutrients or ["balanced"]

    recommended_fertilizers: list[dict[str, Any]] = []
    for nutrient_key in nutrient_keys:
        if nutrient_key == "balanced":
            recommendation = _select_recommendation(
                crop=crop_focus,
                soil_type=profile["dataset_soil_type"],
                growth_stage=stage,
                n_status="balanced",
                p_status="balanced",
                k_status="balanced",
            )
            recommended_fertilizers.append(_build_plan_item("n_status", recommendation, area))
            break

        recommendation = _select_recommendation(
            crop=crop_focus,
            soil_type=profile["dataset_soil_type"],
            growth_stage=stage,
            n_status="low" if nutrient_key == "n_status" else "balanced",
            p_status="low" if nutrient_key == "p_status" else "balanced",
            k_status="low" if nutrient_key == "k_status" else "balanced",
        )
        recommended_fertilizers.append(_build_plan_item(nutrient_key, recommendation, area))

    total_cost = round(sum(item["estimated_cost_inr"] for item in recommended_fertilizers), 2)
    per_acre_cost = round(total_cost / area, 2)

    return {
        "soil_type": profile["display_name"],
        "crop_focus": crop_focus.replace("_", " ").title(),
        "area_acres": area,
        "estimated_cost_value_inr": total_cost,
        "estimated_cost": _format_currency(total_cost),
        "estimated_cost_per_acre_value_inr": per_acre_cost,
        "estimated_cost_per_acre": _format_currency(per_acre_cost),
        "recommended_fertilizers": recommended_fertilizers,
    }
