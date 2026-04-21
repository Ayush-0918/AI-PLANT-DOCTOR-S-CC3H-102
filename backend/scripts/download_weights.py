import os
import httpx  # type: ignore[import]

# URL for a pre-trained MobileNetV3 (PlantVillage 38-class)
# This is a community-contributed model on HuggingFace for these 38 classes
# Alternative Public URL for PlantVillage weights (38 classes)
MODEL_URL = "https://github.com/shivanandmn/Plant-Disease-Detection-using-CNN/raw/master/models/plant_disease_model.pth"
SAVE_PATH = os.path.join(os.path.dirname(__file__), "..", "app", "plantvillage_model.pth")

def download_weights():
    print(f"🚀 Downloading PlantVillage MobileNetV3 weights from HuggingFace...")
    print(f"Target: {SAVE_PATH}")
    
    try:
        with httpx.stream("GET", MODEL_URL, follow_redirects=True) as response:
            if response.status_code != 200:
                print(f"❌ Failed to download weights. Status code: {response.status_code}")
                return
            
            total_size = int(response.headers.get("Content-Length", 0))
            downloaded = 0
            with open(SAVE_PATH, "wb") as f:
                for chunk in response.iter_bytes():
                    chunk_bytes: bytes = bytes(chunk)
                    f.write(chunk_bytes)
                    downloaded += len(chunk_bytes)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"📥 Progress: {percent:.1f}% ({downloaded}/{total_size} bytes)", end="\r")
                    else:
                        print(f"📥 Progress: {downloaded} bytes", end="\r")
        
        print("✅ Download complete!")
    except Exception as e:
        print(f"❌ Error during download: {e}")

if __name__ == "__main__":
    download_weights()
