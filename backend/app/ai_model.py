import torch  # type: ignore[import]
from torchvision.models import mobilenet_v3_large, MobileNet_V3_Large_Weights  # type: ignore[import]
from PIL import Image  # type: ignore[import]
import io
import os

# The full 38-class PlantVillage Dataset Mapping
PLANTVILLAGE_CLASSES = {
    0: "Apple___Apple_scab", 1: "Apple___Black_rot", 2: "Apple___Cedar_apple_rust", 3: "Apple___healthy",
    4: "Blueberry___healthy", 5: "Cherry_(including_sour)___Powdery_mildew", 6: "Cherry_(including_sour)___healthy",
    7: "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", 8: "Corn_(maize)___Common_rust_", 
    9: "Corn_(maize)___Northern_Leaf_Blight", 10: "Corn_(maize)___healthy", 11: "Grape___Black_rot",
    12: "Grape___Esca_(Black_Measles)", 13: "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", 14: "Grape___healthy",
    15: "Orange___Haunglongbing_(Citrus_greening)", 16: "Peach___Bacterial_spot", 17: "Peach___healthy",
    18: "Pepper,_bell___Bacterial_spot", 19: "Pepper,_bell___healthy", 20: "Potato___Early_blight",
    21: "Potato___Late_blight", 22: "Potato___healthy", 23: "Raspberry___healthy", 24: "Soybean___healthy",
    25: "Squash___Powdery_mildew", 26: "Strawberry___Leaf_scorch", 27: "Strawberry___healthy",
    28: "Tomato___Bacterial_spot", 29: "Tomato___Early_blight", 30: "Tomato___Late_blight",
    31: "Tomato___Leaf_Mold", 32: "Tomato___Septoria_leaf_spot", 33: "Tomato___Spider_mites Two-spotted_spider_mite",
    34: "Tomato___Target_Spot",    35: "Tomato___Tomato_Yellow_Leaf_Curl_Virus", 36: "Tomato___Tomato_mosaic_virus", 37: "Tomato___healthy"
}

NUM_CLASSES = 38

# Comprehensive Treatment Data for all 38 PlantVillage Classes
PLANT_TREATMENTS = {
    "Apple___Apple_scab": {
        "medicine": "Captan 50 WP", "pesticide": "N/A", "dosage": "2g per Liter of water",
        "instructions": "Spray during silver tip to green tip stage. Repeat every 10-14 days."
    },
    "Apple___Black_rot": {
        "medicine": "Thiophanate-methyl", "pesticide": "N/A", "dosage": "1.5g per Liter",
        "instructions": "Remove cankers and infected fruit. Spray at bloom and petal fall."
    },
    "Apple___Cedar_apple_rust": {
        "medicine": "Myclobutanil (Rally)", "pesticide": "N/A", "dosage": "0.5g per Liter",
        "instructions": "Apply at 7-10 day intervals from pink stage through second cover."
    },
    "Apple___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Maintain good pruning and soil health. No chemical treatment needed."
    },
    "Blueberry___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Ensure soil pH is 4.5-5.5. Maintain regular mulching."
    },
    "Cherry_(including_sour)___Powdery_mildew": {
        "medicine": "Sulfur (Wettable)", "pesticide": "N/A", "dosage": "3g per Liter",
        "instructions": "Apply when first leaves appear. Avoid spraying in high temperatures."
    },
    "Cherry_(including_sour)___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Monitor for birds and ensure proper drainage."
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "medicine": "Pyraclostrobin (Headline)", "pesticide": "N/A", "dosage": "1ml per Liter",
        "instructions": "Apply at VT (Tasseling) stage if disease pressure is high."
    },
    "Corn_(maize)___Common_rust_": {
        "medicine": "Propiconazole (Tilt)", "pesticide": "N/A", "dosage": "1.2ml per Liter",
        "instructions": "Apply when pustules first appear. Rotate with different fungicides."
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "medicine": "Azoxystrobin + Propiconazole (Quilt)", "pesticide": "N/A", "dosage": "1.5ml per Liter",
        "instructions": "Focus on lower leaves. Apply if lesions appear before silking."
    },
    "Corn_(maize)___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Apply Nitrogen based on soil test. Maintain weed-free environment."
    },
    "Grape___Black_rot": {
        "medicine": "Mancozeb", "pesticide": "N/A", "dosage": "2.5g per Liter",
        "instructions": "Spray from early shoot growth until 4 weeks after bloom."
    },
    "Grape___Esca_(Black_Measles)": {
        "medicine": "Sodium Arsenite (Restricted)", "pesticide": "N/A", "dosage": "Consult expert",
        "instructions": "Prune out infected wood. Use wound sealants after pruning."
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "medicine": "Copper Oxychloride", "pesticide": "N/A", "dosage": "3g per Liter",
        "instructions": "Apply after harvest or during early spring before bud burst."
    },
    "Grape___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Proper trellising and thinning of clusters for airflow."
    },
    "Orange___Haunglongbing_(Citrus_greening)": {
        "medicine": "Nutritional Sprays (Zinc, Boron)", "pesticide": "Imidacloprid (for Psyllids)", "dosage": "0.5ml per Liter",
        "instructions": "No cure. Control Asian Citrus Psyllid to prevent spread. Remove infected trees."
    },
    "Peach___Bacterial_spot": {
        "medicine": "Copper Hydroxide", "pesticide": "N/A", "dosage": "2g per Liter",
        "instructions": "Apply during dormant season and early spring. Avoid late season copper."
    },
    "Peach___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Prune for center-open shape. Monitor for borers."
    },
    "Pepper,_bell___Bacterial_spot": {
        "medicine": "Copper + Mancozeb Mix", "pesticide": "N/A", "dosage": "2g + 2g per Liter",
        "instructions": "Spray every 7 days during wet weather. Use clean seeds."
    },
    "Pepper,_bell___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Provide consistent moisture. Avoid overhead irrigation."
    },
    "Potato___Early_blight": {
        "medicine": "Chlorothalonil (Bravo)", "pesticide": "N/A", "dosage": "2ml per Liter",
        "instructions": "Apply when plants are 6-8 inches tall. Repeat every 7-10 days."
    },
    "Potato___Late_blight": {
        "medicine": "Metalaxyl-M", "pesticide": "N/A", "dosage": "2.5g per Liter",
        "instructions": "Emergency: Spray immediately once detected. High humidity spreads it fast."
    },
    "Potato___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Hilling potatoes helps prevent tuber infection. Proper crop rotation."
    },
    "Raspberry___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Keep rows narrow for airflow. Prune out old canes."
    },
    "Soybean___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Monitor for Soybean Cyst Nematode. Ensure Phosphorus levels."
    },
    "Squash___Powdery_mildew": {
        "medicine": "Potassium Bicarbonate", "pesticide": "N/A", "dosage": "5g per Liter",
        "instructions": "Spray both sides of leaves. Improve spacing for airflow."
    },
    "Strawberry___Leaf_scorch": {
        "medicine": "Benomyl", "pesticide": "N/A", "dosage": "1g per Liter",
        "instructions": "Remove old leaves in spring. Avoid excessive nitrogen."
    },
    "Strawberry___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Mulch with straw to keep fruit off soil. Pick ripe fruit daily."
    },
    "Tomato___Bacterial_spot": {
        "medicine": "Copper Oxychloride", "pesticide": "N/A", "dosage": "3g per Liter",
        "instructions": "Apply every 7-10 days. Avoid working in plants when wet."
    },
    "Tomato___Early_blight": {
        "medicine": "Dithane M-45", "pesticide": "N/A", "dosage": "2g per Liter",
        "instructions": "Remove lower infected leaves. Mulch to prevent soil splash."
    },
    "Tomato___Late_blight": {
        "medicine": "Ridomil Gold", "pesticide": "N/A", "dosage": "2.5g per Liter",
        "instructions": "Spray immediately. Destroy infected plants to stop spread."
    },
    "Tomato___Leaf_Mold": {
        "medicine": "Chlorothalonil", "pesticide": "N/A", "dosage": "2ml per Liter",
        "instructions": "Common in greenhouses. Increase ventilation and reduce humidity."
    },
    "Tomato___Septoria_leaf_spot": {
        "medicine": "Copper Fungicide", "pesticide": "N/A", "dosage": "2.5g per Liter",
        "instructions": "Fungus overwinters on debris. Deep plow after harvest."
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "medicine": "Neem Oil", "pesticide": "Abamectin", "dosage": "5ml per Liter (Neem)",
        "instructions": "Spray underside of leaves where mites hide. Increase humidity."
    },
    "Tomato___Target_Spot": {
        "medicine": "Azoxystrobin", "pesticide": "N/A", "dosage": "1ml per Liter",
        "instructions": "Avoid overhead irrigation. Ensure proper plant spacing."
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "medicine": "N/A", "pesticide": "Imidacloprid (for Whiteflies)", "dosage": "0.5ml per Liter",
        "instructions": "Viruses have no cure. Control Silverleaf Whitefly using yellow sticky traps."
    },
    "Tomato___Tomato_mosaic_virus": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "No cure. Remove and burn infected plants. Wash hands after handling."
    },
    "Tomato___healthy": {
        "medicine": "N/A", "pesticide": "N/A", "dosage": "N/A",
        "instructions": "Excellent health. Maintain consistent watering to prevent blossom end rot."
    }
}

# Path to the PlantVillage fine-tuned model weights
_MODEL_WEIGHTS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plantvillage_model.pth")


def _build_plantvillage_model():
    """
    Build a MobileNetV3-Large model with a 38-class PlantVillage head.
    Tries to load fine-tuned weights; falls back to ImageNet weights for inference.
    """
    weights = MobileNet_V3_Large_Weights.DEFAULT
    model = mobilenet_v3_large(weights=weights)

    # Replace the final classifier layer to output 38 PlantVillage classes
    in_features = model.classifier[3].in_features  # type: ignore[index]
    model.classifier[3] = torch.nn.Linear(in_features, NUM_CLASSES)  # type: ignore[index]

    # Try to load fine-tuned PlantVillage weights
    if os.path.exists(_MODEL_WEIGHTS_PATH):
        try:
            state_dict = torch.load(_MODEL_WEIGHTS_PATH, map_location="cpu")
            model.load_state_dict(state_dict)
            print(f"✅ REAL PlantVillage fine-tuned weights loaded from {_MODEL_WEIGHTS_PATH}")
        except Exception as e:
            print(f"💥 ERROR Loading Weights: {e}")
            raise RuntimeError(f"Model validation failed: {str(e)}")
    else:
        print(f"⚠️ PlantVillage weights NOT FOUND at {_MODEL_WEIGHTS_PATH}.")
        print("   ❌ Real AI mode requires proper training. Run `python backend/scripts/train_lite.py`")

    model.eval()
    return model, weights


class PlantDoctorAI:
    def __init__(self):
        print("🧠 Initializing PlantDoctor AI (MobileNetV3-Large + PlantVillage 38-class)...")
        self.model, self.base_weights = _build_plantvillage_model()
        # Use ImageNet preprocessing (standard for transfer learning)
        self.preprocess = self.base_weights.transforms()
        self._uses_plantvillage_head = os.path.exists(_MODEL_WEIGHTS_PATH)
        print("✅ PlantDoctor AI Model Ready.")

    def predict(self, image_bytes: bytes):
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            batch_tensor = self.preprocess(img).unsqueeze(0)

            with torch.no_grad():
                outputs = self.model(batch_tensor)
                probabilities = outputs.squeeze(0).softmax(0)

            class_id_raw = int(probabilities.argmax().item())
            confidence = float(probabilities[class_id_raw].item())

            # STRICT MODE: Only proceed if fine-tuned model is active
            if not self._uses_plantvillage_head:
                return {
                    "success": False,
                    "error": "Model not trained! Please run train_lite.py to train real weights on the dataset."
                }

            mapped_idx = class_id_raw  # Head is strictly 38 classes now, direct 1:1 map
            
            if confidence < 0.70:
                return {
                    "success": False,
                    "error": "Image not recognized clearly. Please capture a sharper, closer photo of the plant leaf."
                }

            result_label = PLANTVILLAGE_CLASSES.get(mapped_idx, "Unknown")

            # Fetch rich treatment data
            treatment = PLANT_TREATMENTS.get(result_label, {
                "medicine": "Consult local agronomist",
                "pesticide": "Check for local pests",
                "dosage": "Varies by region",
                "instructions": "Maintain general crop hygiene."
            })

            return {
                "success": True,
                "diagnosis": result_label,
                "confidence": float(int(confidence * 10000) / 100),
                "class_id": f"PV_{mapped_idx:02d}",
                "treatment": treatment,
                "model_type": "PlantVillage-Fine-Tuned" if self._uses_plantvillage_head else "ImageNet-Remapped"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# Global singleton instance (loaded at server startup)
ai_model = PlantDoctorAI()
