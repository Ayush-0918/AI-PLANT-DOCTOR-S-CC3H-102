import hashlib
import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from uuid import uuid4

from app.core.config import settings


def image_sha256(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()


async def log_prediction(db, payload: Dict[str, Any]) -> str:
    if db is None:
        return ""
    request_id = payload.get("request_id") or str(uuid4())
    document = {
        **payload,
        "request_id": request_id,
        "timestamp": payload.get("timestamp", datetime.now(timezone.utc)),
    }
    await db["prediction_logs"].insert_one(document)
    return request_id


async def store_feedback(
    db,
    prediction_id: str,
    user_id: str,
    verdict: str,
    rating: int,
    notes: str,
) -> str:
    if db is None:
        return ""
    feedback_id = str(uuid4())
    feedback_doc = {
        "feedback_id": feedback_id,
        "prediction_id": prediction_id,
        "user_id": user_id,
        "verdict": verdict,
        "rating": rating,
        "notes": notes,
        "timestamp": datetime.now(timezone.utc),
    }
    await db["model_feedback"].insert_one(feedback_doc)
    await db["prediction_logs"].update_one(
        {"request_id": prediction_id},
        {
            "$set": {
                "feedback.verdict": verdict,
                "feedback.rating": rating,
                "feedback.notes": notes,
                "feedback.updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return feedback_id


def _percentile(values: List[float], percentile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return round(ordered[0], 2)
    index = (len(ordered) - 1) * max(0.0, min(1.0, percentile))
    lower = math.floor(index)
    upper = math.ceil(index)
    if lower == upper:
        return round(ordered[lower], 2)
    interpolated = ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower)
    return round(interpolated, 2)


def _normalize_distribution(raw_counts: Dict[str, int]) -> Dict[str, float]:
    total = float(sum(raw_counts.values()))
    if total <= 0:
        return {}
    return {name: count / total for name, count in raw_counts.items() if count > 0}


def _kl_divergence(p: Dict[str, float], q: Dict[str, float]) -> float:
    epsilon = 1e-12
    keys = set(p.keys()) | set(q.keys())
    value = 0.0
    for key in keys:
        p_i = max(epsilon, p.get(key, 0.0))
        q_i = max(epsilon, q.get(key, 0.0))
        value += p_i * math.log(p_i / q_i, 2)
    return value


def _js_divergence(p: Dict[str, float], q: Dict[str, float]) -> float:
    keys = set(p.keys()) | set(q.keys())
    midpoint = {key: 0.5 * (p.get(key, 0.0) + q.get(key, 0.0)) for key in keys}
    return 0.5 * _kl_divergence(p, midpoint) + 0.5 * _kl_divergence(q, midpoint)


async def get_feedback_accuracy_summary(db, hours: int = 24 * 30) -> Dict[str, Any]:
    if db is None:
        return {
            "window_hours": hours,
            "feedback_count": 0,
            "resolved_feedback_count": 0,
            "correct_count": 0,
            "incorrect_count": 0,
            "unsure_count": 0,
            "feedback_accuracy_pct": None,
        }

    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    feedback_docs = await db["model_feedback"].find(
        {"timestamp": {"$gte": since}},
        {"_id": 0, "verdict": 1},
    ).to_list(length=20000)

    verdict_counts = {"correct": 0, "incorrect": 0, "unsure": 0}
    for doc in feedback_docs:
        verdict = str(doc.get("verdict", "")).strip().lower()
        if verdict in verdict_counts:
            verdict_counts[verdict] += 1

    resolved = verdict_counts["correct"] + verdict_counts["incorrect"]
    feedback_accuracy = round(100.0 * verdict_counts["correct"] / resolved, 2) if resolved else None

    return {
        "window_hours": hours,
        "feedback_count": len(feedback_docs),
        "resolved_feedback_count": resolved,
        "correct_count": verdict_counts["correct"],
        "incorrect_count": verdict_counts["incorrect"],
        "unsure_count": verdict_counts["unsure"],
        "feedback_accuracy_pct": feedback_accuracy,
    }


async def get_observability_snapshot(db, hours: int = 24) -> Dict[str, Any]:
    if db is None:
        return {
            "window_hours": hours,
            "prediction_count": 0,
            "low_confidence_count": 0,
            "avg_latency_ms": None,
            "latency_p50_ms": None,
            "latency_p95_ms": None,
            "feedback_accuracy_pct": None,
            "feedback_resolution_rate_pct": None,
            "model_versions": [],
            "drift": {
                "status": "unknown",
                "js_divergence": None,
                "current_window_count": 0,
                "previous_window_count": 0,
                "message": "Database unavailable",
            },
            "top_diseases": [],
        }

    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    previous_since = since - timedelta(hours=hours)
    prediction_cursor = db["prediction_logs"].find(
        {"timestamp": {"$gte": since}},
        {
            "_id": 0,
            "confidence_pct": 1,
            "latency_ms": 1,
            "diagnosis": 1,
            "model_version": 1,
        },
    )
    predictions = await prediction_cursor.to_list(length=20000)

    prediction_count = len(predictions)
    low_confidence_count = sum(
        1
        for row in predictions
        if float(row.get("confidence_pct", 0.0)) < settings.ai_confidence_threshold
    )
    latencies: List[float] = [
        float(row.get("latency_ms", 0.0))
        for row in predictions
        if row.get("latency_ms") is not None
    ]
    avg_latency_ms = round(sum(latencies) / len(latencies), 2) if latencies else None
    latency_p50_ms = _percentile(latencies, 0.50) if latencies else None
    latency_p95_ms = _percentile(latencies, 0.95) if latencies else None

    disease_counter: Dict[str, int] = {}
    version_counter: Dict[str, int] = {}
    for row in predictions:
        name = row.get("diagnosis", "Unknown")
        disease_counter[name] = disease_counter.get(name, 0) + 1
        version = str(row.get("model_version", "unknown"))
        version_counter[version] = version_counter.get(version, 0) + 1
    top_diseases = sorted(
        [{"name": name, "count": count} for name, count in disease_counter.items()],
        key=lambda item: item["count"],
        reverse=True,
    )[:10]
    model_versions = sorted(
        [{"model_version": version, "count": count} for version, count in version_counter.items()],
        key=lambda item: item["count"],
        reverse=True,
    )

    previous_distribution_rows = await db["prediction_logs"].aggregate(
        [
            {
                "$match": {
                    "timestamp": {
                        "$gte": previous_since,
                        "$lt": since,
                    }
                }
            },
            {"$group": {"_id": "$diagnosis", "count": {"$sum": 1}}},
        ]
    ).to_list(length=2000)
    previous_distribution = {
        str(row.get("_id", "Unknown")): int(row.get("count", 0))
        for row in previous_distribution_rows
    }
    current_distribution = {name: count for name, count in disease_counter.items()}
    normalized_current = _normalize_distribution(current_distribution)
    normalized_previous = _normalize_distribution(previous_distribution)

    if prediction_count < 40 or sum(previous_distribution.values()) < 40:
        drift_status = "insufficient_data"
        drift_score = None
        drift_message = "Need at least 40 predictions in each window for drift signal."
    else:
        drift_score = round(_js_divergence(normalized_current, normalized_previous), 4)
        if drift_score >= 0.25:
            drift_status = "high"
            drift_message = "Strong prediction distribution shift. Review data quality and model stability."
        elif drift_score >= 0.12:
            drift_status = "medium"
            drift_message = "Moderate distribution shift. Monitor class-level errors."
        else:
            drift_status = "low"
            drift_message = "No significant drift signal in current window."

    feedback_summary = await get_feedback_accuracy_summary(db, hours=hours)
    feedback_count = int(feedback_summary.get("feedback_count", 0))
    resolved_feedback_count = int(feedback_summary.get("resolved_feedback_count", 0))
    feedback_accuracy_pct = feedback_summary.get("feedback_accuracy_pct")
    feedback_resolution_rate_pct = (
        round(100.0 * resolved_feedback_count / prediction_count, 2)
        if prediction_count
        else None
    )

    return {
        "window_hours": hours,
        "prediction_count": prediction_count,
        "low_confidence_count": low_confidence_count,
        "low_confidence_rate_pct": round(100.0 * low_confidence_count / prediction_count, 2)
        if prediction_count
        else 0.0,
        "avg_latency_ms": avg_latency_ms,
        "latency_p50_ms": latency_p50_ms,
        "latency_p95_ms": latency_p95_ms,
        "feedback_count": feedback_count,
        "feedback_resolution_rate_pct": feedback_resolution_rate_pct,
        "feedback_accuracy_pct": feedback_accuracy_pct,
        "model_versions": model_versions,
        "drift": {
            "status": drift_status,
            "js_divergence": drift_score,
            "current_window_count": prediction_count,
            "previous_window_count": sum(previous_distribution.values()),
            "message": drift_message,
        },
        "top_diseases": top_diseases,
    }
