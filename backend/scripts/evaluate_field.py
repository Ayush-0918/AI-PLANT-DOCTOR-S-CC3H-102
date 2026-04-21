import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import torch  # type: ignore[import]
from torch.utils.data import DataLoader  # type: ignore[import]
from torchvision import datasets, models, transforms  # type: ignore[import]

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "backend" / "app" / "plantvillage_model.pth"
STATIC_DIR = PROJECT_ROOT / "backend" / "static"
FIELD_REPORT_PATH = STATIC_DIR / "field_validation_report.json"
MODEL_REGISTRY_PATH = STATIC_DIR / "model_registry.json"

# Fallback class order (PlantVillage 38 classes) for robust evaluation.
FALLBACK_MODEL_CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _resolve_model_class_names() -> list[str]:
    registry = _read_json(MODEL_REGISTRY_PATH)
    latest_distribution = registry.get("latest_class_distribution")
    if isinstance(latest_distribution, list):
        names = [str(entry.get("class_name")) for entry in latest_distribution if entry.get("class_name")]
        if names:
            return names
    return list(FALLBACK_MODEL_CLASSES)


def _infer_model_output_classes(state: dict[str, Any], fallback: int) -> int:
    weight_tensor = state.get("classifier.3.weight")
    if weight_tensor is not None and hasattr(weight_tensor, "shape"):
        try:
            return int(weight_tensor.shape[0])
        except Exception:
            return fallback
    return fallback


def build_model() -> tuple[torch.nn.Module, int]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model weights not found at {MODEL_PATH}")
    state = torch.load(MODEL_PATH, map_location="cpu")
    inferred_classes = _infer_model_output_classes(state, fallback=38)

    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = torch.nn.Linear(in_features, inferred_classes)
    model.load_state_dict(state, strict=True)
    model.eval()
    return model, inferred_classes


def evaluate(dataset_dir: Path, batch_size: int) -> dict[str, Any]:
    eval_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    dataset = datasets.ImageFolder(dataset_dir, transform=eval_transform)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    model, model_output_classes = build_model()
    model_class_names = _resolve_model_class_names()
    if len(model_class_names) < model_output_classes:
        model_class_names.extend(
            [f"class_{i}" for i in range(len(model_class_names), model_output_classes)]
        )
    model_class_names = model_class_names[:model_output_classes]
    class_to_global = {name: idx for idx, name in enumerate(model_class_names)}

    dataset_to_global: list[Optional[int]] = []
    unmapped_classes: list[str] = []
    for class_name in dataset.classes:
        mapped = class_to_global.get(class_name)
        if mapped is None:
            unmapped_classes.append(class_name)
        dataset_to_global.append(mapped)

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model = model.to(device)

    total = 0
    correct = 0
    skipped_unmapped_samples = 0
    class_total = [0] * len(dataset.classes)
    class_correct = [0] * len(dataset.classes)

    with torch.no_grad():
        for inputs, labels in loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            preds = torch.argmax(outputs, dim=1).cpu().tolist()
            labels_list = labels.tolist()

            for sample_idx, dataset_class_idx in enumerate(labels_list):
                mapped_global = dataset_to_global[dataset_class_idx]
                class_total[dataset_class_idx] += 1
                total += 1
                if mapped_global is None:
                    skipped_unmapped_samples += 1
                    continue
                if int(preds[sample_idx]) == mapped_global:
                    correct += 1
                    class_correct[dataset_class_idx] += 1

    evaluated_samples = total - skipped_unmapped_samples
    overall_accuracy = round(100.0 * correct / max(evaluated_samples, 1), 2)
    class_metrics = []
    for class_idx, class_name in enumerate(dataset.classes):
        effective_samples = class_total[class_idx]
        class_acc = round(100.0 * class_correct[class_idx] / max(effective_samples, 1), 2)
        class_metrics.append(
            {
                "class_name": class_name,
                "samples": effective_samples,
                "accuracy_pct": class_acc,
                "mapped_to_model_class": model_class_names[dataset_to_global[class_idx]]
                if dataset_to_global[class_idx] is not None
                else None,
            }
        )

    class_metrics.sort(key=lambda x: x["accuracy_pct"])
    weakest_classes = class_metrics[:10]
    strongest_classes = sorted(class_metrics, key=lambda x: x["accuracy_pct"], reverse=True)[:10]

    report = {
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_path": str(dataset_dir),
        "total_samples": total,
        "evaluated_samples": evaluated_samples,
        "skipped_unmapped_samples": skipped_unmapped_samples,
        "class_count": len(dataset.classes),
        "model_output_classes": model_output_classes,
        "overall_accuracy_pct": overall_accuracy,
        "field_accuracy_pct": overall_accuracy,
        "unmapped_classes": unmapped_classes,
        "weakest_classes": weakest_classes,
        "strongest_classes": strongest_classes,
        "all_class_metrics": class_metrics,
        "device": str(device),
    }
    _write_json(FIELD_REPORT_PATH, report)
    return report


def update_registry_with_field_eval(report: dict[str, Any]) -> None:
    registry = _read_json(MODEL_REGISTRY_PATH)
    active = registry.get("active_model")
    if not isinstance(active, dict):
        return
    active["field_eval"] = {
        "evaluated_at": report["evaluated_at"],
        "overall_accuracy_pct": report["overall_accuracy_pct"],
        "dataset_path": report["dataset_path"],
        "total_samples": report["total_samples"],
    }
    registry["active_model"] = active
    _write_json(MODEL_REGISTRY_PATH, registry)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate model on field dataset and publish field accuracy report."
    )
    parser.add_argument(
        "--dataset-dir",
        required=True,
        help="Path to field validation dataset in ImageFolder format.",
    )
    parser.add_argument("--batch-size", type=int, default=32, help="Evaluation batch size.")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found at {dataset_dir}")

    report = evaluate(dataset_dir=dataset_dir, batch_size=args.batch_size)
    update_registry_with_field_eval(report)
    print(f"✅ Field evaluation complete: {report['overall_accuracy_pct']}%")
    print(f"🧾 Report saved: {FIELD_REPORT_PATH}")


if __name__ == "__main__":
    main()
