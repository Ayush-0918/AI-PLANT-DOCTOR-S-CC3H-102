import kagglehub  # type: ignore[import]
import os
import shutil

# 1. Download the latest version of the dataset
print("🚀 Starting High-Speed Download...")
path = kagglehub.dataset_download("arjunyadav99/indian-agricultural-mandi-prices-2023-2025")

print(f"✅ Data downloaded to: {path}")

# 2. File ko apne 'Plant Doctors' folder mein move karo
csv_file = "Agriculture_price_dataset.csv"
source_path = os.path.join(path, csv_file)

if os.path.exists(source_path):
    shutil.copy(source_path, os.getcwd())
    print(f"🔥 Success! {csv_file} is now in your project folder.")
else:
    print("📂 Check inside the folder, file name might be slightly different.")
    print("Files found:", os.listdir(path))
