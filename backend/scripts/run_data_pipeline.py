import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
FIELD_ZIP_DEFAULT = PROJECT_ROOT / "field_images.zip"
FIELD_FOLDER_DEFAULT = PROJECT_ROOT / "plantdoc"
FIELD_VAL_DIR = PROJECT_ROOT / "PlantVillage-Dataset" / "field" / "validation"
BUNDLE_DIR = PROJECT_ROOT / "PlantVillage-Dataset" / "training_bundle" / "color"
PIPELINE_REPORT_PATH = BACKEND_ROOT / "static" / "pipeline_report.json"


def _run(cmd: list[str], cwd: Path) -> None:
    print(f"▶ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=str(cwd), check=True)


def run_pipeline(
    python_exe: str,
    max_images_per_class: int,
    train: bool,
    preset: str,
    seed: int,
    field_source: Path,
    field_share: float,
) -> dict:
    summary: dict[str, object] = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "steps": [],
    }

    _run(
        [
            python_exe,
            "backend/scripts/generate_knowledge_assets.py",
        ],
        cwd=PROJECT_ROOT,
    )
    summary["steps"].append("knowledge_assets_generated")

    _run(
        [
            python_exe,
            "backend/scripts/clean_dataset.py",
            "--max-images-per-class",
            str(max_images_per_class),
            "--seed",
            str(seed),
        ],
        cwd=PROJECT_ROOT,
    )
    summary["steps"].append("lightweight_dataset_prepared")

    field_used = False
    if field_source.exists():
        _run(
            [
                python_exe,
                "backend/scripts/prepare_field_dataset.py",
                "--source-path",
                str(field_source),
                "--max-images-per-class",
                str(max_images_per_class),
                "--seed",
                str(seed),
            ],
            cwd=PROJECT_ROOT,
        )
        summary["steps"].append("field_dataset_prepared")
        field_used = True
    else:
        summary["steps"].append("field_dataset_skipped_zip_missing")

    build_cmd = [
        python_exe,
        "backend/scripts/build_training_bundle.py",
        "--max-images-per-class",
        str(max_images_per_class),
        "--field-share",
        str(field_share),
        "--seed",
        str(seed),
    ]
    _run(build_cmd, cwd=PROJECT_ROOT)
    summary["steps"].append("training_bundle_built")

    if train:
        _run(
            [
                python_exe,
                "backend/scripts/train_lite.py",
                "--preset",
                preset,
                "--dataset-dir",
                str(BUNDLE_DIR),
                "--seed",
                str(seed),
            ],
            cwd=PROJECT_ROOT,
        )
        summary["steps"].append("model_trained")

        if field_used and FIELD_VAL_DIR.exists():
            _run(
                [
                    python_exe,
                    "backend/scripts/evaluate_field.py",
                    "--dataset-dir",
                    str(FIELD_VAL_DIR),
                    "--batch-size",
                    "32",
                ],
                cwd=PROJECT_ROOT,
            )
            summary["steps"].append("field_validation_completed")
        else:
            summary["steps"].append("field_validation_skipped")
    else:
        summary["steps"].append("training_skipped")

    summary["completed_at"] = datetime.now(timezone.utc).isoformat()
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Run end-to-end data prep + training pipeline.")
    parser.add_argument("--python-exe", default=sys.executable)
    parser.add_argument("--max-images-per-class", type=int, default=100)
    parser.add_argument("--train", action="store_true", help="Run training + validation steps.")
    parser.add_argument("--preset", choices=["light", "medium", "full"], default="light")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--field-source",
        type=Path,
        default=None,
        help="Field source path (folder or archive). Defaults to ./plantdoc if present, else ./field_images.zip",
    )
    parser.add_argument("--field-share", type=float, default=0.3)
    args = parser.parse_args()

    if args.field_source is not None:
        field_source = args.field_source.resolve()
    elif FIELD_FOLDER_DEFAULT.exists():
        field_source = FIELD_FOLDER_DEFAULT
    else:
        field_source = FIELD_ZIP_DEFAULT.resolve()

    report = run_pipeline(
        python_exe=args.python_exe,
        max_images_per_class=args.max_images_per_class,
        train=args.train,
        preset=args.preset,
        seed=args.seed,
        field_source=field_source,
        field_share=args.field_share,
    )
    PIPELINE_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    PIPELINE_REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
