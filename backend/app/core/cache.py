try:
    import redis.asyncio as redis
except ImportError:
    redis = None

import json
import os
from functools import wraps
from typing import Any, Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
cache_client: Optional[Any] = None

async def init_cache():
    global cache_client
    if redis is None:
        print("⚠️  Redis not installed. Caching disabled.")
        return
    try:
        cache_client = await redis.from_url(REDIS_URL, decode_responses=True)
        print("✅ Redis connected successfully")
    except Exception as e:
        print(f"⚠️  Redis unavailable: {e}. Continuing without caching.")
        cache_client = None

async def cache_get(key: str) -> Optional[Any]:
    if not cache_client:
        return None
    try:
        value = await cache_client.get(key)
        if value is not None:
            return json.loads(value)
    except Exception:
        pass
    return None

async def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    if not cache_client:
        return False
    try:
        await cache_client.setex(key, ttl, json.dumps(value))
        return True
    except Exception:
        return False

async def cache_delete(key: str) -> bool:
    if not cache_client:
        return False
    try:
        await cache_client.delete(key)
        return True
    except Exception:
        return False
