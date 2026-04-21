import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any, Dict

from app.core.config import settings


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(plain_password: str, iterations: int = 120000) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        iterations,
    )
    return "pbkdf2_sha256${}${}${}".format(
        iterations,
        _b64url_encode(salt),
        _b64url_encode(digest),
    )


def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        scheme, iterations_raw, salt_raw, digest_raw = stored_hash.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        iterations = int(iterations_raw)
        salt = _b64url_decode(salt_raw)
        expected = _b64url_decode(digest_raw)
    except Exception:
        return False

    computed = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(computed, expected)


def create_access_token(payload: Dict[str, Any], expires_in_minutes: int = None) -> str:
    expiry_minutes = expires_in_minutes or settings.jwt_expiry_minutes
    now = int(time.time())
    claims = {
        **payload,
        "iat": now,
        "exp": now + expiry_minutes * 60,
        "iss": "plant-doctors",
    }
    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_claims = _b64url_encode(json.dumps(claims, separators=(",", ":")).encode("utf-8"))
    signing_input = "{}.{}".format(encoded_header, encoded_claims).encode("ascii")
    signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    encoded_signature = _b64url_encode(signature)
    return "{}.{}.{}".format(encoded_header, encoded_claims, encoded_signature)


def decode_access_token(token: str) -> Dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Malformed token")

    encoded_header, encoded_claims, encoded_signature = parts
    signing_input = "{}.{}".format(encoded_header, encoded_claims).encode("ascii")
    expected_signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    provided_signature = _b64url_decode(encoded_signature)

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise ValueError("Invalid token signature")

    claims = json.loads(_b64url_decode(encoded_claims).decode("utf-8"))
    if int(claims.get("exp", 0)) < int(time.time()):
        raise ValueError("Token expired")
    return claims


def normalize_phone_number(phone_number: str) -> str:
    normalized = "".join(ch for ch in phone_number if ch.isdigit() or ch == "+").strip()
    if normalized.startswith("+"):
        return normalized
    if len(normalized) == 10:
        return "+91{}".format(normalized)
    raise ValueError("Invalid phone number format")

