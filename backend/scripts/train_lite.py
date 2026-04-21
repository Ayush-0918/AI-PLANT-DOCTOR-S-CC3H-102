import argparse
import hashlib
import json
import os
import random
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import torch  # type: ignore[import]
import torch.nn as nn  # type: ignore[import]
import torch.optim as optim  # type: ignore[import]
from torch.utils.data import DataLoader, Subset  # type: ignore[import]
from torchvision import datasets, models, transforms  # type: ignore[import]

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "PlantVillage-Dataset"
RAW_COLOR_DIR = DATASET_ROOT / "raw" / "color"
LIGHT_COLOR_DIR = DATASET_ROOT / "lightweight" / "color"
BUNDLE_COLOR_DIR = DATASET_ROOT / "training_bundle" / "color"
MODEL_SAVE_PATH = PROJECT_ROOT / "backend" / "app" / "plantvillage_model.pth"
STATIC_DIR = PROJECT_ROOT / "backend" / "static"
METRICS_PATH = STATIC_DIR / "accuracy.json"
CM_PATH = STATIC_DIR / "confusion_matrix.png"
REPORT_PATH = STATIC_DIR / "training_report.json"
MODEL_REGISTRY_PATH = STATIC_DIR / "model_registry.json"

PRESET_CONFIGS: dict[str, dict[str, Any]] = {
    "light": {
        "max_images_per_class": 100,
        "epochs": 1,
        "batch_size": 32,
        "learning_rate": 5e-4,
        "val_ratio": 0.2,
    },
    "medium": {
        "max_images_per_class": 100,
        "epochs": 2,
        "batch_size": 32,
        "learning_rate": 3e-4,
        "val_ratio": 0.2,
    },
    "full": {
        "max_images_per_class": None,
        "epochs": 4,
        "batch_size": 24,
        "learning_rate": 2e-4,
        "val_ratio": 0.2,
    },
}


def resolve_dataset_dir(dataset_dir_override: Optional[str] = None) -> Path:
    if dataset_dir_override:
        candidate = Path(dataset_dir_override).expanduser().resolve()
        if candidate.exists():
            return candidate
    if BUNDLE_COLOR_DIR.exists():
        return BUNDLE_COLOR_DIR
    if LIGHT_COLOR_DIR.exists():
        return LIGHT_COLOR_DIR
    return RAW_COLOR_DIR


def select_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def create_transforms() -> dict[str, Any]:
    return {
        "train": transforms.Compose([
            transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.08, contrast=0.08, saturation=0.08),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]),
        "val": transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]),
    }


def build_balanced_indices(
    image_folder: datasets.ImageFolder,
    max_images_per_class: Optional[int],
    val_ratio: float,
    seed: int,
) -> tuple[list[int], list[int], list[dict[str, Any]]]:
    rng = random.Random(seed)
    indices_by_class: dict[int, list[int]] = defaultdict(list)

    for idx, (_, class_idx) in enumerate(image_folder.samples):
        indices_by_class[class_idx].append(idx)

    train_indices: list[int] = []
    val_indices: list[int] = []
    class_distribution: list[dict[str, Any]] = []

    for class_idx, indices in indices_by_class.items():
        rng.shuffle(indices)
        capped_indices = indices[:max_images_per_class] if max_images_per_class else indices

        if len(capped_indices) <= 1:
            class_train = capped_indices
            class_val: list[int] = []
        else:
            val_count = max(1, int(len(capped_indices) * val_ratio))
            if val_count >= len(capped_indices):
                val_count = len(capped_indices) - 1
            class_val = capped_indices[:val_count]
            class_train = capped_indices[val_count:]

        train_indices.extend(class_train)
        val_indices.extend(class_val)
        class_distribution.append({
            "class_name": image_folder.classes[class_idx],
            "train_count": len(class_train),
            "val_count": len(class_val),
            "total_used": len(capped_indices),
        })

    rng.shuffle(train_indices)
    rng.shuffle(val_indices)
    class_distribution.sort(key=lambda entry: str(entry["class_name"]))
    return train_indices, val_indices, class_distribution


def build_model(num_classes: int, warm_start: bool) -> tuple[nn.Module, str]:
    weight_source = "random-init"

    if MODEL_SAVE_PATH.exists():
        model = models.mobilenet_v3_large(weights=None)
    else:
        try:
            weights = models.MobileNet_V3_Large_Weights.DEFAULT if warm_start else None
            model = models.mobilenet_v3_large(weights=weights)
            if warm_start:
                weight_source = "imagenet"
        except Exception:
            model = models.mobilenet_v3_large(weights=None)

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)

    if MODEL_SAVE_PATH.exists():
        try:
            state_dict = torch.load(MODEL_SAVE_PATH, map_location="cpu")
            model.load_state_dict(state_dict, strict=True)
            weight_source = "existing-plantvillage-weights"
        except Exception as exc:
            print(f"⚠️ Could not warm start from saved weights: {exc}")

    return model, weight_source


def save_confusion_matrix(labels: list[int], predictions: list[int], class_names: list[str]) -> bool:
    try:
        from sklearn.metrics import confusion_matrix
        import matplotlib.pyplot as plt
        import seaborn as sns
    except ImportError:
        print("⚠️ Metrics plotting libraries missing; skipping confusion matrix.")
        return False

    matrix = confusion_matrix(labels, predictions)
    plt.figure(figsize=(24, 20))
    sns.heatmap(matrix, annot=False, cmap="Blues", xticklabels=class_names, yticklabels=class_names)
    plt.title("Plant Doctor Lite Training Confusion Matrix", fontsize=24)
    plt.ylabel("True Class", fontsize=18)
    plt.xlabel("Predicted Class", fontsize=18)
    plt.xticks(rotation=90, fontsize=8)
    plt.yticks(rotation=0, fontsize=8)
    plt.tight_layout()
    plt.savefig(CM_PATH, dpi=150)
    plt.close()
    print(f"✅ Confusion Matrix saved to {CM_PATH}")
    return True


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


def update_model_registry(
    metrics: dict[str, Any],
    class_distribution: list[dict[str, Any]],
    preset: str,
) -> None:
    registry = _read_json(MODEL_REGISTRY_PATH)
    models = registry.get("models")
    if not isinstance(models, list):
        models = []

    model_entry = {
        "model_version": metrics["model_version"],
        "architecture": metrics["model"],
        "training_preset": preset,
        "dataset_path": metrics["dataset_path"],
        "dataset_signature": metrics["dataset_signature"],
        "dataset_classes": metrics["dataset_classes"],
        "train_samples": metrics["train_samples"],
        "val_samples": metrics["val_samples"],
        "accuracy_pct": metrics["accuracy_pct"],
        "epochs_trained": metrics["epochs_trained"],
        "device": metrics["device"],
        "weight_source": metrics["weight_source"],
        "confidence_threshold": 75.0,
        "status": metrics["status"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    models = [entry for entry in models if entry.get("model_version") != metrics["model_version"]]
    models.append(model_entry)

    registry["models"] = models[-100:]
    registry["active_model"] = model_entry
    registry["updated_at"] = datetime.now(timezone.utc).isoformat()
    registry["latest_class_distribution"] = class_distribution
    _write_json(MODEL_REGISTRY_PATH, registry)
    print(f"🧾 Model registry updated at {MODEL_REGISTRY_PATH}")


def train_real(
    max_images_per_class: Optional[int],
    epochs: int,
    batch_size: int,
    learning_rate: float,
    val_ratio: float,
    seed: int,
    save_matrix: bool,
    preset: str,
    dataset_dir_override: Optional[str],
) -> dict[str, Any]:
    STATIC_DIR.mkdir(parents=True, exist_ok=True)

    dataset_dir = resolve_dataset_dir(dataset_dir_override)
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found at {dataset_dir}")

    print(f"🚀 Training with dataset: {dataset_dir}")
    print(f"🎯 Max images per class: {max_images_per_class or 'all'}")

    transforms_map = create_transforms()
    split_source = datasets.ImageFolder(dataset_dir)
    num_classes = len(split_source.classes)
    train_indices, val_indices, class_distribution = build_balanced_indices(
        split_source,
        max_images_per_class=max_images_per_class,
        val_ratio=val_ratio,
        seed=seed,
    )

    train_dataset = datasets.ImageFolder(dataset_dir, transform=transforms_map["train"])
    val_dataset = datasets.ImageFolder(dataset_dir, transform=transforms_map["val"])

    train_subset = Subset(train_dataset, train_indices)
    val_subset = Subset(val_dataset, val_indices)

    train_loader = DataLoader(train_subset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_subset, batch_size=batch_size, shuffle=False, num_workers=0)

    model, weight_source = build_model(num_classes, warm_start=True)
    device = select_device()
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate)

    print(f"💻 Using device: {device}")
    print(f"🧠 Weight source: {weight_source}")
    print(f"📊 Train samples: {len(train_indices)} | Val samples: {len(val_indices)} | Classes: {num_classes}")

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        running_corrects = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data).item()

        epoch_loss = running_loss / max(len(train_indices), 1)
        epoch_acc = running_corrects / max(len(train_indices), 1)
        print(f"🔥 Epoch {epoch + 1}/{epochs} | loss={epoch_loss:.4f} | acc={epoch_acc:.4f}")

    model.eval()
    all_preds: list[int] = []
    all_labels: list[int] = []
    val_correct = 0

    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)

            val_correct += torch.sum(preds == labels.data).item()
            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(labels.cpu().tolist())

    val_acc = val_correct / max(len(val_indices), 1)
    print(f"✨ Validation Accuracy: {val_acc * 100:.2f}%")

    matrix_saved = False
    if save_matrix and all_labels and all_preds:
        matrix_saved = save_confusion_matrix(all_labels, all_preds, split_source.classes)

    dataset_signature = hashlib.sha256(
        json.dumps(class_distribution, sort_keys=True).encode("utf-8")
    ).hexdigest()[:16]
    run_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    model_version = f"pv-mobilenetv3-{run_stamp}-c{num_classes}-t{len(train_indices)}"

    metrics = {
        "model": "MobileNetV3_Large",
        "model_version": model_version,
        "training_preset": preset,
        "dataset_path": str(dataset_dir),
        "dataset_signature": dataset_signature,
        "dataset_classes": num_classes,
        "epochs_trained": epochs,
        "train_samples": len(train_indices),
        "val_samples": len(val_indices),
        "accuracy_pct": round(val_acc * 100, 2),
        "status": "Verified Real AI",
        "confusion_matrix_route": "/static/confusion_matrix.png" if matrix_saved else None,
        "device": str(device),
        "weight_source": weight_source,
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    report = {
        **metrics,
        "class_distribution": class_distribution,
        "seed": seed,
        "batch_size": batch_size,
        "learning_rate": learning_rate,
        "val_ratio": val_ratio,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    update_model_registry(metrics, class_distribution, preset)

    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"💾 Model saved to {MODEL_SAVE_PATH}")
    print(f"🧾 Metrics saved to {METRICS_PATH}")
    print(f"🧾 Training report saved to {REPORT_PATH}")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a PlantVillage model with light/medium/full presets.")
    parser.add_argument("--preset", choices=sorted(PRESET_CONFIGS.keys()), default="light", help="Training preset profile.")
    parser.add_argument("--max-images-per-class", type=int, default=None, help="Override class sample cap for selected preset.")
    parser.add_argument("--epochs", type=int, default=None, help="Override number of fine-tuning epochs.")
    parser.add_argument("--batch-size", type=int, default=None, help="Override training batch size.")
    parser.add_argument("--learning-rate", type=float, default=None, help="Override optimizer learning rate.")
    parser.add_argument("--val-ratio", type=float, default=None, help="Override validation split ratio per class.")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Optional ImageFolder dataset root override.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument("--save-confusion-matrix", action="store_true", help="Generate and save confusion matrix image.")
    args = parser.parse_args()

    preset_cfg = dict(PRESET_CONFIGS[args.preset])
    max_images_per_class = args.max_images_per_class if args.max_images_per_class is not None else preset_cfg["max_images_per_class"]
    epochs = args.epochs if args.epochs is not None else preset_cfg["epochs"]
    batch_size = args.batch_size if args.batch_size is not None else preset_cfg["batch_size"]
    learning_rate = args.learning_rate if args.learning_rate is not None else preset_cfg["learning_rate"]
    val_ratio = args.val_ratio if args.val_ratio is not None else preset_cfg["val_ratio"]

    print(f"🧪 Training preset: {args.preset}")

    random.seed(args.seed)
    torch.manual_seed(args.seed)

    train_real(
        max_images_per_class=max_images_per_class,
        epochs=epochs,
        batch_size=batch_size,
        learning_rate=learning_rate,
        val_ratio=val_ratio,
        seed=args.seed,
        save_matrix=args.save_confusion_matrix,
        preset=args.preset,
        dataset_dir_override=args.dataset_dir,
    )


if __name__ == "__main__":
    main()
