import argparse
import json
import os
import random
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2] / "PlantVillage-Dataset"
RAW_COLOR_DIR = BASE_DIR / "raw" / "color"
LIGHTWEIGHT_DIR = BASE_DIR / "lightweight" / "color"
MANIFEST_PATH = BASE_DIR / "lightweight" / "manifest.json"
VALID_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def build_lightweight_dataset(max_images_per_class: int = 100, seed: int = 42) -> dict:
    if not RAW_COLOR_DIR.exists():
      raise FileNotFoundError(f"Raw dataset not found at {RAW_COLOR_DIR}")

    if LIGHTWEIGHT_DIR.parent.exists():
      shutil.rmtree(LIGHTWEIGHT_DIR.parent)

    LIGHTWEIGHT_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)

    manifest: dict[str, object] = {
      "source": str(RAW_COLOR_DIR),
      "output": str(LIGHTWEIGHT_DIR),
      "max_images_per_class": max_images_per_class,
      "seed": seed,
      "classes": [],
      "total_selected": 0,
    }

    for class_dir in sorted(path for path in RAW_COLOR_DIR.iterdir() if path.is_dir()):
      images = [path for path in class_dir.iterdir() if path.suffix.lower() in VALID_SUFFIXES]
      images.sort()
      rng.shuffle(images)
      selected = images[:max_images_per_class]

      target_dir = LIGHTWEIGHT_DIR / class_dir.name
      target_dir.mkdir(parents=True, exist_ok=True)

      for image_path in selected:
        shutil.copy2(image_path, target_dir / image_path.name)

      manifest["classes"].append({
        "class_name": class_dir.name,
        "original_count": len(images),
        "selected_count": len(selected),
      })
      manifest["total_selected"] += len(selected)

      print(f"✅ {class_dir.name}: selected {len(selected)} / {len(images)}")

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"✨ Lightweight dataset ready at {LIGHTWEIGHT_DIR}")
    print(f"🧾 Manifest saved at {MANIFEST_PATH}")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a lightweight PlantVillage copy without deleting the raw dataset.")
    parser.add_argument("--max-images-per-class", type=int, default=100, help="Maximum number of images to keep per class.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducible sampling.")
    args = parser.parse_args()

    build_lightweight_dataset(
      max_images_per_class=args.max_images_per_class,
      seed=args.seed,
    )


if __name__ == "__main__":
    main()
