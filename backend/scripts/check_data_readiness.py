import csv
import json
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
GENERATED_DIR = PROJECT_ROOT / "backend" / "data" / "generated"
TREATMENT_PATH = GENERATED_DIR / "treatment_knowledge.csv"
TRANSLATION_PATH = GENERATED_DIR / "translations_core.csv"
CROP_RECOMMENDATION_PATH = GENERATED_DIR / "crop_recommendation.csv"
FERTILIZER_RECOMMENDATION_PATH = GENERATED_DIR / "fertilizer_recommendation.csv"
GROWTH_CARE_PATH = GENERATED_DIR / "plant_growth_care_recommendations.csv"
MODEL_PATH = PROJECT_ROOT / "backend" / "app" / "plantvillage_model.pth"
FIELD_REPORT_PATH = PROJECT_ROOT / "backend" / "static" / "field_validation_report.json"


def _csv_row_count(path: Path) -> int:
    if not path.exists():
        return 0
    with path.open("r", encoding="utf-8", newline="") as file_obj:
        reader = csv.reader(file_obj)
        rows = list(reader)
    if not rows:
        return 0
    return max(0, len(rows) - 1)


def main() -> None:
    counts = {
        "treatment_knowledge_rows": _csv_row_count(TREATMENT_PATH),
        "translations_rows": _csv_row_count(TRANSLATION_PATH),
        "crop_recommendation_rows": _csv_row_count(CROP_RECOMMENDATION_PATH),
        "fertilizer_recommendation_rows": _csv_row_count(FERTILIZER_RECOMMENDATION_PATH),
        "growth_care_rows": _csv_row_count(GROWTH_CARE_PATH),
    }
    targets = {
        "treatment_knowledge_rows": 500,
        "translations_rows": 1000,
        "crop_recommendation_rows": 540,
        "fertilizer_recommendation_rows": 720,
    }
    meets_targets = all(counts.get(key, 0) >= target for key, target in targets.items())
    files_present = all(
        path.exists()
        for path in [
            TREATMENT_PATH,
            TRANSLATION_PATH,
            CROP_RECOMMENDATION_PATH,
            FERTILIZER_RECOMMENDATION_PATH,
            GROWTH_CARE_PATH,
        ]
    )

    payload = {
        "success": files_present and meets_targets and MODEL_PATH.exists(),
        "generated_dir": str(GENERATED_DIR),
        "model_exists": MODEL_PATH.exists(),
        "field_validation_report_exists": FIELD_REPORT_PATH.exists(),
        "files_present": files_present,
        "meets_targets": meets_targets,
        "targets": targets,
        "counts": counts,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
