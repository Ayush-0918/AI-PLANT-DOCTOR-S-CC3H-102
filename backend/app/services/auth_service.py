from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from app.core.config import settings
from app.core.errors import AuthenticationError, DependencyError, ValidationError
from app.core.security import (
    create_access_token,
    hash_password,
    normalize_phone_number,
    verify_password,
)
from app.models.schemas import TokenResponse, UserPublic


def _to_user_public(user_doc: Dict[str, Any]) -> UserPublic:
    return UserPublic(
        user_id=user_doc["user_id"],
        name=user_doc["name"],
        phone_number=user_doc["phone_number"],
        role=user_doc.get("role", "farmer"),
        language=user_doc.get("language", "hi"),
        location=user_doc.get("location"),
        soil_type=user_doc.get("soil_type"),
    )


async def register_user(db, name: str, phone_number: str, password: str, language: str, location: Optional[str]) -> UserPublic:
    if db is None:
        raise DependencyError("Database unavailable. User registration disabled.")

    normalized_phone = normalize_phone_number(phone_number)
    existing = await db["users"].find_one({"phone_number": normalized_phone})
    if existing:
        raise ValidationError("Phone number already registered.")

    user_doc = {
        "user_id": str(uuid4()),
        "name": name.strip(),
        "phone_number": normalized_phone,
        "password_hash": hash_password(password),
        "role": "farmer",
        "language": language.strip(),
        "location": location.strip() if location else None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db["users"].insert_one(user_doc)
    return _to_user_public(user_doc)


async def authenticate_user(db, phone_number: str, password: str) -> Dict[str, Any]:
    if db is None:
        raise DependencyError("Database unavailable. Authentication disabled.")

    normalized_phone = normalize_phone_number(phone_number)
    user_doc = await db["users"].find_one({"phone_number": normalized_phone})
    if user_doc is None:
        raise AuthenticationError("Invalid credentials.")

    if not verify_password(password, user_doc.get("password_hash", "")):
        raise AuthenticationError("Invalid credentials.")

    return user_doc


def issue_user_token(user_doc: Dict[str, Any]) -> TokenResponse:
    claims = {
        "sub": user_doc["user_id"],
        "role": user_doc.get("role", "farmer"),
        "phone_number": user_doc["phone_number"],
    }
    access_token = create_access_token(claims, expires_in_minutes=settings.jwt_expiry_minutes)
    return TokenResponse(
        access_token=access_token,
        expires_in_seconds=settings.jwt_expiry_minutes * 60,
        user=_to_user_public(user_doc),
    )


async def get_user_by_id(db, user_id: str) -> Dict[str, Any]:
    if db is None:
        raise DependencyError("Database unavailable.")
    user_doc = await db["users"].find_one({"user_id": user_id})
    if user_doc is None:
        raise AuthenticationError("User not found.")
    return user_doc
