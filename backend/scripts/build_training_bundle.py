import argparse
import json
import random
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


VALID_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "PlantVillage-Dataset"
LIGHT_COLOR_DIR = DATASET_ROOT / "lightweight" / "color"
RAW_COLOR_DIR = DATASET_ROOT / "raw" / "color"
FIELD_TRAIN_DIR = DATASET_ROOT / "field" / "train"
BUNDLE_DIR = DATASET_ROOT / "training_bundle" / "color"
MANIFEST_PATH = DATASET_ROOT / "training_bundle" / "manifest.json"


def _image_files(path: Path) -> list[Path]:
    if not path.exists():
        return []
    return [child for child in path.iterdir() if child.is_file() and child.suffix.lower() in VALID_SUFFIXES]


def build_training_bundle(
    in_domain_dir: Path,
    output_dir: Path,
    max_images_per_class: int = 100,
    field_train_dir: Optional[Path] = None,
    field_share: float = 0.3,
    seed: int = 42,
) -> dict:
    if not in_domain_dir.exists():
        raise FileNotFoundError(f"In-domain directory not found at {in_domain_dir}")
    if output_dir.parent.exists():
        shutil.rmtree(output_dir.parent)
    output_dir.mkdir(parents=True, exist_ok=True)

    rng = random.Random(seed)
    class_dirs = sorted(path for path in in_domain_dir.iterdir() if path.is_dir())
    manifest: dict[str, object] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "in_domain_dir": str(in_domain_dir),
        "field_train_dir": str(field_train_dir) if field_train_dir else None,
        "output_dir": str(output_dir),
        "max_images_per_class": max_images_per_class,
        "field_share": field_share,
        "seed": seed,
        "classes": [],
        "field_classes_ignored": [],
        "total_selected": 0,
    }

    for class_dir in class_dirs:
        class_name = class_dir.name
        domain_images = _image_files(class_dir)
        rng.shuffle(domain_images)

        field_images: list[Path] = []
        if field_train_dir:
            field_class_dir = field_train_dir / class_name
            field_images = _image_files(field_class_dir)
            rng.shuffle(field_images)

        field_quota = min(len(field_images), int(max_images_per_class * field_share))
        domain_quota = max_images_per_class - field_quota

        selected_domain = domain_images[:domain_quota]
        selected_field = field_images[:field_quota]

        remaining = max_images_per_class - (len(selected_domain) + len(selected_field))
        if remaining > 0:
            domain_extra = domain_images[len(selected_domain) : len(selected_domain) + remaining]
            selected_domain.extend(domain_extra)
            remaining -= len(domain_extra)
        if remaining > 0:
            field_extra = field_images[len(selected_field) : len(selected_field) + remaining]
            selected_field.extend(field_extra)

        target_class_dir = output_dir / class_name
        target_class_dir.mkdir(parents=True, exist_ok=True)

        for src in selected_domain:
            shutil.copy2(src, target_class_dir / src.name)
        for src in selected_field:
            target_name = f"field_{src.name}"
            shutil.copy2(src, target_class_dir / target_name)

        total_selected = len(selected_domain) + len(selected_field)
        manifest["classes"].append(
            {
                "class_name": class_name,
                "domain_available": len(domain_images),
                "field_available": len(field_images),
                "domain_selected": len(selected_domain),
                "field_selected": len(selected_field),
                "total_selected": total_selected,
            }
        )
        manifest["total_selected"] += total_selected
        print(
            f"✅ {class_name}: total={total_selected}, domain={len(selected_domain)}, field={len(selected_field)}"
        )

    if field_train_dir and field_train_dir.exists():
        in_domain_classes = {class_dir.name for class_dir in class_dirs}
        extra_field_classes = [
            class_dir.name
            for class_dir in sorted(field_train_dir.iterdir())
            if class_dir.is_dir() and class_dir.name not in in_domain_classes
        ]
        manifest["field_classes_ignored"] = extra_field_classes

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"🧾 Training bundle manifest saved: {MANIFEST_PATH}")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build a training bundle from in-domain + optional field images."
    )
    parser.add_argument(
        "--in-domain-dir",
        type=Path,
        default=LIGHT_COLOR_DIR,
        help="ImageFolder root for in-domain data.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=BUNDLE_DIR,
        help="Output ImageFolder root for merged training bundle.",
    )
    parser.add_argument(
        "--field-train-dir",
        type=Path,
        default=FIELD_TRAIN_DIR,
        help="Optional field train ImageFolder root.",
    )
    parser.add_argument("--max-images-per-class", type=int, default=100)
    parser.add_argument("--field-share", type=float, default=0.3)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    in_domain_dir = args.in_domain_dir.resolve()
    if not in_domain_dir.exists():
        in_domain_dir = RAW_COLOR_DIR

    field_dir: Optional[Path] = args.field_train_dir.resolve()
    if not field_dir.exists():
        field_dir = None

    build_training_bundle(
        in_domain_dir=in_domain_dir,
        output_dir=args.output_dir.resolve(),
        max_images_per_class=args.max_images_per_class,
        field_train_dir=field_dir,
        field_share=args.field_share,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
