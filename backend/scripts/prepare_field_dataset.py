import argparse
import json
import random
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


VALID_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ZIP_PATH = PROJECT_ROOT / "field_images.zip"
DEFAULT_FOLDER_PATH = PROJECT_ROOT / "plantdoc"
FIELD_ROOT = PROJECT_ROOT / "PlantVillage-Dataset" / "field"
EXTRACTED_DIR = FIELD_ROOT / "extracted"
TRAIN_DIR = FIELD_ROOT / "train"
VALIDATION_DIR = FIELD_ROOT / "validation"
MANIFEST_PATH = FIELD_ROOT / "field_manifest.json"

# Common class mapping from PlantDoc labels to PlantVillage labels.
PLANTDOC_TO_PLANTVILLAGE = {
    "Apple Scab Leaf": "Apple___Apple_scab",
    "Apple leaf": "Apple___healthy",
    "Apple rust leaf": "Apple___Cedar_apple_rust",
    "Bell_pepper leaf": "Pepper,_bell___healthy",
    "Bell_pepper leaf spot": "Pepper,_bell___Bacterial_spot",
    "Blueberry leaf": "Blueberry___healthy",
    "Cherry leaf": "Cherry_(including_sour)___healthy",
    "Corn Gray leaf spot": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn leaf blight": "Corn_(maize)___Northern_Leaf_Blight",
    "Corn rust leaf": "Corn_(maize)___Common_rust_",
    "Peach leaf": "Peach___healthy",
    "Potato leaf early blight": "Potato___Early_blight",
    "Potato leaf late blight": "Potato___Late_blight",
    "Raspberry leaf": "Raspberry___healthy",
    "Soyabean leaf": "Soybean___healthy",
    "Squash Powdery mildew leaf": "Squash___Powdery_mildew",
    "Strawberry leaf": "Strawberry___healthy",
    "Tomato Early blight leaf": "Tomato___Early_blight",
    "Tomato Septoria leaf spot": "Tomato___Septoria_leaf_spot",
    "Tomato leaf": "Tomato___healthy",
    "Tomato leaf bacterial spot": "Tomato___Bacterial_spot",
    "Tomato leaf late blight": "Tomato___Late_blight",
    "Tomato leaf mosaic virus": "Tomato___Tomato_mosaic_virus",
    "Tomato leaf yellow virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato mold leaf": "Tomato___Leaf_Mold",
    "grape leaf": "Grape___healthy",
    "grape leaf black rot": "Grape___Black_rot",
}


def _safe_class_name(name: str) -> str:
    clean = name.strip().replace(" ", "_")
    return clean or "unknown_class"


def _canonical_class_name(raw_name: str) -> str:
    mapped = PLANTDOC_TO_PLANTVILLAGE.get(raw_name)
    if mapped:
        return mapped
    # Try case-insensitive fallback.
    lowered = raw_name.strip().lower()
    for source_name, target_name in PLANTDOC_TO_PLANTVILLAGE.items():
        if source_name.strip().lower() == lowered:
            return target_name
    return _safe_class_name(raw_name)


def _image_files(path: Path) -> list[Path]:
    if not path.exists() or not path.is_dir():
        return []
    return [p for p in path.iterdir() if p.is_file() and p.suffix.lower() in VALID_SUFFIXES]


def _collect_leaf_dirs(root: Path) -> list[Path]:
    leaf_dirs: list[Path] = []
    for path in sorted(root.rglob("*")):
        if not path.is_dir():
            continue
        if _image_files(path):
            leaf_dirs.append(path)
    return leaf_dirs


def _clear_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def _resolve_default_source() -> Optional[Path]:
    if DEFAULT_FOLDER_PATH.exists():
        return DEFAULT_FOLDER_PATH
    if DEFAULT_ZIP_PATH.exists():
        return DEFAULT_ZIP_PATH
    return None


def _stage_input_source(source_path: Path, extracted_dir: Path) -> str:
    if source_path.is_dir():
        for item in source_path.iterdir():
            target = extracted_dir / item.name
            if item.is_dir():
                shutil.copytree(item, target)
            else:
                shutil.copy2(item, target)
        return "folder"

    suffix = source_path.suffix.lower()
    if suffix in {".zip", ".tar", ".gz", ".bz2", ".xz"}:
        shutil.unpack_archive(str(source_path), str(extracted_dir))
        return "archive"

    raise ValueError(
        f"Unsupported field source: {source_path}. Provide a folder or archive (.zip/.tar/.gz)."
    )


def _copy_selected_images(
    images: list[Path],
    target_dir: Path,
    max_images_per_class: int,
    seed: int,
    file_prefix: str,
) -> int:
    if not images:
        return 0
    rng = random.Random(seed)
    sampled = list(images)
    rng.shuffle(sampled)
    selected = sampled[:max_images_per_class]
    target_dir.mkdir(parents=True, exist_ok=True)
    for idx, image_path in enumerate(selected):
        target_name = f"{file_prefix}_{idx:04d}_{image_path.name}"
        shutil.copy2(image_path, target_dir / target_name)
    return len(selected)


def _prepare_from_train_test_splits(
    root_dir: Path,
    max_images_per_class: int,
    seed: int,
) -> dict:
    train_root = root_dir / "train"
    test_root = root_dir / "test"

    train_classes = sorted([p for p in train_root.iterdir() if p.is_dir()]) if train_root.exists() else []
    test_classes = sorted([p for p in test_root.iterdir() if p.is_dir()]) if test_root.exists() else []
    all_class_dirs = {p.name: p for p in train_classes}
    for test_dir in test_classes:
        if test_dir.name not in all_class_dirs:
            all_class_dirs[test_dir.name] = test_dir

    manifest_classes = []
    total_train = 0
    total_val = 0
    total_selected = 0

    for class_name in sorted(all_class_dirs.keys()):
        mapped_name = _canonical_class_name(class_name)
        train_images = _image_files(train_root / class_name)
        test_images = _image_files(test_root / class_name)

        copied_train = _copy_selected_images(
            images=train_images,
            target_dir=TRAIN_DIR / mapped_name,
            max_images_per_class=max_images_per_class,
            seed=seed,
            file_prefix="train",
        )
        copied_val = _copy_selected_images(
            images=test_images,
            target_dir=VALIDATION_DIR / mapped_name,
            max_images_per_class=max_images_per_class,
            seed=seed + 1,
            file_prefix="test",
        )

        total_train += copied_train
        total_val += copied_val
        total_selected += copied_train + copied_val

        manifest_classes.append(
            {
                "source_class_name": class_name,
                "mapped_class_name": mapped_name,
                "source_train_images": len(train_images),
                "source_test_images": len(test_images),
                "selected_train_images": copied_train,
                "selected_validation_images": copied_val,
            }
        )
        print(
            f"✅ {class_name} -> {mapped_name}: train={copied_train}, val={copied_val}"
        )

    return {
        "classes": manifest_classes,
        "totals": {
            "classes_detected": len(manifest_classes),
            "train_images": total_train,
            "validation_images": total_val,
            "selected_images": total_selected,
        },
        "split_mode": "train_test_direct",
    }


def _prepare_from_generic_folders(
    extracted_dir: Path,
    max_images_per_class: int,
    val_ratio: float,
    seed: int,
) -> dict:
    leaf_dirs = _collect_leaf_dirs(extracted_dir)
    if not leaf_dirs:
        raise ValueError(
            "No class image folders found in source. Expected ImageFolder-style class directories."
        )

    rng = random.Random(seed)
    classes_payload = []
    total_train = 0
    total_val = 0
    total_selected = 0

    for class_dir in leaf_dirs:
        class_name = _canonical_class_name(class_dir.name)
        images = _image_files(class_dir)
        if not images:
            continue

        rng.shuffle(images)
        selected = images[:max_images_per_class]
        if len(selected) <= 1:
            val_count = 0
        else:
            val_count = max(1, int(len(selected) * val_ratio))
            if val_count >= len(selected):
                val_count = len(selected) - 1

        val_images = selected[:val_count]
        train_images = selected[val_count:]

        target_train = TRAIN_DIR / class_name
        target_val = VALIDATION_DIR / class_name
        target_train.mkdir(parents=True, exist_ok=True)
        target_val.mkdir(parents=True, exist_ok=True)

        for idx, image_path in enumerate(train_images):
            shutil.copy2(image_path, target_train / f"train_{idx:04d}_{image_path.name}")
        for idx, image_path in enumerate(val_images):
            shutil.copy2(image_path, target_val / f"val_{idx:04d}_{image_path.name}")

        classes_payload.append(
            {
                "source_class_name": class_dir.name,
                "mapped_class_name": class_name,
                "source_images": len(images),
                "selected_images": len(selected),
                "train_images": len(train_images),
                "validation_images": len(val_images),
            }
        )
        total_train += len(train_images)
        total_val += len(val_images)
        total_selected += len(selected)
        print(
            f"✅ {class_dir.name} -> {class_name}: selected {len(selected)} (train={len(train_images)}, val={len(val_images)})"
        )

    return {
        "classes": classes_payload,
        "totals": {
            "classes_detected": len(classes_payload),
            "train_images": total_train,
            "validation_images": total_val,
            "selected_images": total_selected,
        },
        "split_mode": "random_split",
    }


def prepare_field_dataset(
    source_path: Path,
    max_images_per_class: int = 100,
    val_ratio: float = 0.2,
    seed: int = 42,
) -> dict:
    if not source_path.exists():
        raise FileNotFoundError(f"Field source not found at: {source_path}")

    FIELD_ROOT.mkdir(parents=True, exist_ok=True)
    _clear_dir(EXTRACTED_DIR)
    _clear_dir(TRAIN_DIR)
    _clear_dir(VALIDATION_DIR)

    source_mode = _stage_input_source(source_path, EXTRACTED_DIR)

    has_train_test = (EXTRACTED_DIR / "train").exists() and (EXTRACTED_DIR / "test").exists()
    if has_train_test:
        prepared = _prepare_from_train_test_splits(
            root_dir=EXTRACTED_DIR,
            max_images_per_class=max_images_per_class,
            seed=seed,
        )
    else:
        prepared = _prepare_from_generic_folders(
            extracted_dir=EXTRACTED_DIR,
            max_images_per_class=max_images_per_class,
            val_ratio=val_ratio,
            seed=seed,
        )

    manifest = {
        "prepared_at": datetime.now(timezone.utc).isoformat(),
        "source_path": str(source_path),
        "source_mode": source_mode,
        "max_images_per_class": max_images_per_class,
        "val_ratio": val_ratio,
        "seed": seed,
        "class_mapping": "plantdoc_to_plantvillage_with_fallback",
        "split_mode": prepared["split_mode"],
        "classes": prepared["classes"],
        "totals": prepared["totals"],
    }

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"🧾 Field manifest saved at {MANIFEST_PATH}")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prepare field data (folder or zip) into PlantVillage-compatible train/validation splits."
    )
    parser.add_argument(
        "--source-path",
        type=Path,
        default=None,
        help="Path to field folder or archive. If omitted, tries ./plantdoc then ./field_images.zip",
    )
    parser.add_argument(
        "--zip-path",
        type=Path,
        default=None,
        help="Backward-compatible alias for source archive path.",
    )
    parser.add_argument("--max-images-per-class", type=int, default=100)
    parser.add_argument("--val-ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    explicit_source = args.source_path or args.zip_path
    source_path = explicit_source.resolve() if explicit_source else _resolve_default_source()
    if source_path is None:
        raise FileNotFoundError(
            "No field source found. Provide --source-path or place ./plantdoc folder or ./field_images.zip"
        )

    prepare_field_dataset(
        source_path=source_path,
        max_images_per_class=args.max_images_per_class,
        val_ratio=args.val_ratio,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
