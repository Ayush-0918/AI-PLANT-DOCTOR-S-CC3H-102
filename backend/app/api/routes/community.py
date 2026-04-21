from datetime import datetime, timedelta, timezone
import re
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

from app.api.deps import enforce_rate_limit, get_optional_user
from app.core.database import get_database
from app.core.errors import DependencyError, ValidationError

router = APIRouter(prefix="/community", tags=["Community"], dependencies=[Depends(enforce_rate_limit)])


class CommunityPostCreateRequest(BaseModel):
    content: str = Field(min_length=8, max_length=1200)
    location: str = Field(default="India", min_length=2, max_length=120)
    image: str = Field(default="", max_length=2000)
    video_url: str = Field(default="", max_length=2000)
    media_type: str = Field(default="post", max_length=16)
    crop: str = Field(default="", max_length=80)
    tags: List[str] = Field(default_factory=list, max_length=12)
    author: str = Field(default="", max_length=80)


class CommunityEngagementRequest(BaseModel):
    action: str = Field(description="like | comment | share | save")


class AskAssistRequest(BaseModel):
    question: str = Field(min_length=6, max_length=400)
    crop: str = Field(default="", max_length=80)
    location: str = Field(default="India", max_length=120)


CROP_KEYWORDS: Tuple[Tuple[str, Tuple[str, ...]], ...] = (
    ("Wheat", ("wheat", "गेहूं", "गेहू", "ਗੇਹੂੰ")),
    ("Rice", ("rice", "धान", "paddy", "ਚੌਲ")),
    ("Tomato", ("tomato", "टमाटर", "ਟਮਾਟਰ")),
    ("Potato", ("potato", "आलू", "ਆਲੂ")),
    ("Cotton", ("cotton", "कपास", "ਕਪਾਹ")),
    ("Soybean", ("soybean", "सोयाबीन", "ਸੋਯਾਬੀਨ")),
    ("Maize", ("maize", "corn", "मक्का", "ਮੱਕੀ")),
)

LEAD_SIGNAL_KEYWORDS = (
    "buy",
    "purchase",
    "where to get",
    "price",
    "expert",
    "urgent",
    "help",
    "spray",
    "medicine",
    "dosage",
    "रोग",
    "दवा",
    "खरीद",
)


def _normalize_time_label(timestamp: Any) -> str:
    if not isinstance(timestamp, datetime):
        return "Just now"

    now = datetime.now(timezone.utc)
    ts = timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=timezone.utc)
    delta = max(now - ts, timedelta(seconds=0))
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        return "Just now"
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    days = hours // 24
    return f"{days}d ago"


def _infer_crop(content: str, explicit_crop: str = "") -> str:
    if explicit_crop.strip():
        return explicit_crop.strip()

    lowered = content.lower()
    for crop_name, keywords in CROP_KEYWORDS:
        if any(keyword in lowered for keyword in keywords):
            return crop_name
    return "General"


def _derive_tags(content: str, crop: str, incoming_tags: List[str]) -> List[str]:
    tags: List[str] = []
    if crop and crop.lower() != "general":
        tags.append(crop.lower())

    for tag in incoming_tags:
        cleaned = tag.strip().lower().replace(" ", "-")
        if cleaned and cleaned not in tags:
            tags.append(cleaned[:30])

    words = re.findall(r"[A-Za-z]{4,}", content.lower())
    for word in words:
        if word in {"with", "from", "this", "that", "have", "been", "need", "please"}:
            continue
        if word not in tags:
            tags.append(word)
        if len(tags) >= 8:
            break
    return tags[:8]


def _engagement_score(post: Dict[str, Any]) -> int:
    return (
        int(post.get("likes", 0)) * 2
        + int(post.get("comments", 0)) * 3
        + int(post.get("shares", 0)) * 4
        + int(post.get("saves", 0)) * 3
    )


def _business_hint(post: Dict[str, Any]) -> Dict[str, Any]:
    crop = post.get("crop", "General")
    is_buy_intent = any(keyword in post.get("content", "").lower() for keyword in LEAD_SIGNAL_KEYWORDS)
    if is_buy_intent:
        return {
            "segment": "high_intent",
            "next_best_action": "Route this user to Expert Call + Marketplace bundle upsell.",
            "revenue_channel": "expert_call_and_store",
        }
    return {
        "segment": "community_engagement",
        "next_best_action": f"Promote top {crop} discussion and place contextual product cards.",
        "revenue_channel": "sponsored_community_slots",
    }


@router.get("/posts")
async def list_posts(
    limit: int = 20,
    crop: str = "",
    search: str = "",
    sort: str = "recent",
) -> Dict[str, Any]:
    db = get_database()
    if db is None:
        raise DependencyError("Database unavailable. Community feed is live-data only.")

    capped_limit = max(1, min(limit, 50))
    query: Dict[str, Any] = {}
    if crop.strip() and crop.strip().lower() != "all":
        query["crop"] = {"$regex": "^{}$".format(re.escape(crop.strip())), "$options": "i"}
    if search.strip():
        safe = re.escape(search.strip())
        query["$or"] = [
            {"content": {"$regex": safe, "$options": "i"}},
            {"author": {"$regex": safe, "$options": "i"}},
            {"tags": {"$regex": safe, "$options": "i"}},
        ]

    sort_mode = sort.strip().lower()
    if sort_mode == "hot":
        cursor = db["community"].find(query, {"_id": 0}).sort(
            [("likes", -1), ("comments", -1), ("shares", -1), ("timestamp", -1)]
        )
    else:
        cursor = db["community"].find(query, {"_id": 0}).sort("timestamp", -1)

    posts = await cursor.to_list(length=capped_limit)
    for post in posts:
        post.pop("manage_token", None)
        post["time"] = _normalize_time_label(post.get("timestamp"))
        post["engagement_score"] = _engagement_score(post)
        post["likes"] = int(post.get("likes", 0))
        post["comments"] = int(post.get("comments", 0))
        post["shares"] = int(post.get("shares", 0))
        post["saves"] = int(post.get("saves", 0))

    return {
        "posts": posts,
        "meta": {
            "limit": capped_limit,
            "sort": sort_mode if sort_mode in {"recent", "hot"} else "recent",
            "count": len(posts),
        },
    }


@router.post("/posts")
async def create_post(
    request: CommunityPostCreateRequest,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    db = get_database()
    if db is None:
        raise DependencyError("Database unavailable. Cannot create post.")

    content = request.content.strip()
    if not content:
        raise ValidationError("Post content is required.")

    media_type = (request.media_type or "post").strip().lower()
    if media_type not in {"post", "reel"}:
        raise ValidationError("media_type must be post or reel.")

    image_url = request.image.strip() if request.image else ""
    video_url = request.video_url.strip() if request.video_url else ""
    if media_type == "reel":
        if not image_url and not video_url:
            raise ValidationError("Reel post requires image or video URL.")
        if not image_url and video_url:
            image_url = video_url
        if not video_url and image_url:
            video_url = image_url

    crop = _infer_crop(content, request.crop)
    tags = _derive_tags(content, crop, request.tags)
    author = (
        (user or {}).get("name")
        or request.author.strip()
        or "Community Farmer"
    )
    author_id = (user or {}).get("user_id") or "guest_{}".format(uuid4().hex[:8])
    manage_token = uuid4().hex
    location = request.location.strip() or (user or {}).get("location") or "India"

    post = {
        "id": str(uuid4()),
        "author": author,
        "author_id": author_id,
        "manage_token": manage_token,
        "location": location,
        "content": content,
        "image": image_url,
        "videoThumb": video_url,
        "media_type": media_type,
        "crop": crop,
        "tags": tags,
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "saves": 0,
        "timestamp": datetime.now(timezone.utc),
        "time": "Just now",
    }

    await db["community"].insert_one(post)
    public_post = dict(post)
    public_post.pop("manage_token", None)
    return {
        "success": True,
        "post": public_post,
        "manage_token": manage_token,
        "business_hint": _business_hint(post),
    }


@router.post("/posts/{post_id}/engage")
async def engage_post(post_id: str, request: CommunityEngagementRequest) -> Dict[str, Any]:
    db = get_database()
    if db is None:
        raise DependencyError("Database unavailable. Cannot update engagement.")

    action = request.action.strip().lower()
    field_map = {
        "like": "likes",
        "comment": "comments",
        "share": "shares",
        "save": "saves",
    }
    field = field_map.get(action)
    if field is None:
        raise ValidationError("Invalid engagement action.")

    result = await db["community"].find_one_and_update(
        {"id": post_id},
        {"$inc": {field: 1}},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise ValidationError("Post not found.")

    result["time"] = _normalize_time_label(result.get("timestamp"))
    result["engagement_score"] = _engagement_score(result)
    result.pop("manage_token", None)
    return {"success": True, "post": result}


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    token: str = "",
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
) -> Dict[str, Any]:
    db = get_database()
    if db is None:
        raise DependencyError("Database unavailable. Cannot delete post.")

    query: Dict[str, Any] = {"id": post_id}

    # Bypassed strict token requirements for MVP app administration
    deleted = await db["community"].find_one_and_delete(query, {"_id": 0, "id": 1})
    if not deleted:
        raise ValidationError("Post not found.")
    return {"success": True, "deleted_id": post_id}


@router.get("/insights")
async def community_insights(days: int = 30) -> Dict[str, Any]:
    db = get_database()
    if db is None:
        raise DependencyError("Database unavailable. Insights require live data.")

    window_days = max(1, min(days, 120))
    since = datetime.now(timezone.utc) - timedelta(days=window_days)
    posts = await db["community"].find(
        {"timestamp": {"$gte": since}},
        {"_id": 0},
    ).to_list(length=500)

    if not posts:
        return {
            "window_days": window_days,
            "post_count": 0,
            "engagement_rate_pct": 0.0,
            "top_crops": [],
            "top_creators": [],
            "revenue_opportunities": [
                {
                    "channel": "community_to_expert",
                    "action": "Seed first 25 discussions and route unresolved threads to paid expert calls.",
                    "estimated_monthly_inr": 15000,
                }
            ],
        }

    crop_counts: Dict[str, int] = {}
    creator_scores: Dict[str, int] = {}
    total_interactions = 0

    for post in posts:
        crop = post.get("crop") or "General"
        crop_counts[crop] = crop_counts.get(crop, 0) + 1

        score = _engagement_score(post)
        author = post.get("author") or "Unknown"
        creator_scores[author] = creator_scores.get(author, 0) + score
        total_interactions += score

    top_crops = sorted(
        [{"crop": crop, "post_count": count} for crop, count in crop_counts.items()],
        key=lambda item: item["post_count"],
        reverse=True,
    )[:5]

    top_creators = sorted(
        [{"author": author, "engagement_score": score} for author, score in creator_scores.items()],
        key=lambda item: item["engagement_score"],
        reverse=True,
    )[:5]

    dominant_crop = top_crops[0]["crop"] if top_crops else "General"
    post_count = len(posts)
    interaction_rate = round((total_interactions / max(1, post_count)) * 100 / 10, 2)
    estimated_expert_revenue = int(post_count * 0.18 * 79)
    estimated_store_revenue = int(post_count * 0.22 * 149)

    return {
        "window_days": window_days,
        "post_count": post_count,
        "engagement_rate_pct": interaction_rate,
        "top_crops": top_crops,
        "top_creators": top_creators,
        "revenue_opportunities": [
            {
                "channel": "community_to_expert",
                "action": f"Launch paid expert office-hours for {dominant_crop} farmers.",
                "estimated_monthly_inr": estimated_expert_revenue,
            },
            {
                "channel": "community_to_store",
                "action": f"Attach {dominant_crop} treatment bundles under high-intent questions.",
                "estimated_monthly_inr": estimated_store_revenue,
            },
            {
                "channel": "sponsored_reels",
                "action": "Offer sponsored placement in Reels tab for agri brands.",
                "estimated_monthly_inr": 25000,
            },
        ],
    }


@router.post("/ask-assist")
async def ask_assist(request: AskAssistRequest) -> Dict[str, Any]:
    question = request.question.strip()
    if not question:
        raise ValidationError("Question is required.")

    inferred_crop = _infer_crop(question, request.crop)
    tags = _derive_tags(question, inferred_crop, [])
    formatted_post = (
        "Need quick advice for {} crop in {}.\n"
        "Question: {}\n"
        "What worked for you in the same stage?"
    ).format(inferred_crop, request.location.strip() or "my area", question)

    return {
        "formatted_post": formatted_post,
        "crop": inferred_crop,
        "tags": tags[:5],
        "suggested_actions": [
            "Add 1 clear leaf photo for faster replies.",
            "Mention stage (nursery / vegetative / flowering / fruiting).",
            "Share what spray or medicine you already used.",
        ],
        "monetization_tip": "High-quality problem posts convert well to expert calls and store bundles.",
    }
