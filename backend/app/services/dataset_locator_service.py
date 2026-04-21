from pathlib import Path
from typing import Iterable, Optional

BACKEND_ROOT = Path(__file__).resolve().parents[2]

AGRICULTURE_PRICE_DATASET_CANDIDATES = [
    BACKEND_ROOT / "data" / "generated" / "Agriculture_price_dataset.csv",
    BACKEND_ROOT / "Agriculture_price_dataset.csv",
]

CROP_RECOMMENDATION_CANDIDATES = [
    BACKEND_ROOT / "data" / "generated" / "crop_recommendation.csv",
    BACKEND_ROOT / "crop_recommendation.csv",
]

FERTILIZER_RECOMMENDATION_CANDIDATES = [
    BACKEND_ROOT / "data" / "generated" / "fertilizer_recommendation.csv",
    BACKEND_ROOT / "fertilizer_recommendation.csv",
]


def first_existing_path(paths: Iterable[Path]) -> Optional[Path]:
    for path in paths:
        if path.exists():
            return path
    return None
