import os
from dataclasses import dataclass
from pathlib import Path


def _to_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _to_int(value: str, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value: str, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Settings:
    app_env: str
    mongo_uri: str
    jwt_secret_key: str
    jwt_expiry_minutes: int
    ai_confidence_threshold: float
    allow_legacy_mocks: bool
    enable_legacy_api: bool
    rate_limit_requests: int
    rate_limit_window_seconds: int
    openweather_api_key: str
    vapi_api_key: str
    vapi_assistant_id: str
    vapi_phone_number_id: str
    vapi_webhook_secret: str
    vapi_url: str
    static_dir: Path
    model_registry_path: Path
    accuracy_path: Path
    field_validation_report_path: Path


def load_settings() -> Settings:
    backend_root = Path(__file__).resolve().parents[2]
    static_dir = backend_root / "static"
    static_dir.mkdir(parents=True, exist_ok=True)

    return Settings(
        app_env=os.getenv("APP_ENV", "development"),
        mongo_uri=os.getenv("MONGO_URI", "mongodb://localhost:27017"),
        jwt_secret_key=os.getenv("JWT_SECRET_KEY", "change-me-in-production"),
        jwt_expiry_minutes=_to_int(os.getenv("JWT_EXPIRY_MINUTES"), 60 * 24),
        ai_confidence_threshold=_to_float(os.getenv("AI_CONFIDENCE_THRESHOLD"), 75.0),
        allow_legacy_mocks=_to_bool(os.getenv("ALLOW_LEGACY_MOCKS"), False),
        enable_legacy_api=_to_bool(
            os.getenv("ENABLE_LEGACY_API"),
            os.getenv("APP_ENV", "development").strip().lower() != "production",
        ),
        rate_limit_requests=_to_int(os.getenv("RATE_LIMIT_REQUESTS"), 120),
        rate_limit_window_seconds=_to_int(os.getenv("RATE_LIMIT_WINDOW_SECONDS"), 60),
        openweather_api_key=os.getenv("OPENWEATHER_API_KEY", ""),
        vapi_api_key=os.getenv("VAPI_API_KEY", ""),
        vapi_assistant_id=os.getenv("VAPI_ASSISTANT_ID", ""),
        vapi_phone_number_id=os.getenv("VAPI_PHONE_NUMBER_ID", ""),
        vapi_webhook_secret=os.getenv("VAPI_WEBHOOK_SECRET", ""),
        vapi_url=os.getenv("VAPI_URL", "https://api.vapi.ai/call"),
        static_dir=static_dir,
        model_registry_path=static_dir / "model_registry.json",
        accuracy_path=static_dir / "accuracy.json",
        field_validation_report_path=static_dir / "field_validation_report.json",
    )


settings = load_settings()
