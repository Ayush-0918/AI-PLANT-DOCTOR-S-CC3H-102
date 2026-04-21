from typing import Any, Optional

try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase  # type: ignore[import]
except Exception:
    AsyncIOMotorClient = None  # type: ignore[assignment]
    AsyncIOMotorDatabase = Any  # type: ignore[assignment]

from app.core.config import settings

_mongo_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def init_database() -> bool:
    global _mongo_client, _database
    if _database is not None:
        return True
    if AsyncIOMotorClient is None:
        _mongo_client = None
        _database = None
        return False
    try:
        _mongo_client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=3000)
        await _mongo_client.admin.command("ping")
        _database = _mongo_client["plant_doctor"]
        return True
    except Exception:
        _mongo_client = None
        _database = None
        return False


def get_database() -> Optional[AsyncIOMotorDatabase]:
    return _database


async def close_database() -> None:
    global _mongo_client, _database
    if _mongo_client is not None:
        _mongo_client.close()
    _mongo_client = None
    _database = None


async def ensure_database_indexes() -> None:
    db = get_database()
    if db is None:
        return

    # Drop conflicting indexes gracefully
    try:
        await db["users"].drop_index("user_id_1")
    except Exception:
        pass
    try:
        await db["users"].drop_index("phone_number_1")
    except Exception:
        pass
    try:
        await db["users"].drop_index("idx_users_id")
    except Exception:
        pass
    
    # Drop existing scans indexes to avoid conflicts
    try:
        await db["scans"].drop_index("idx_scans_geo_time")
    except Exception:
        pass
    try:
        await db["scans"].drop_index("location_2dsphere_timestamp_-1")
    except Exception:
        pass

    # 1. Scans collection: Geospatial + time-based queries (with error handling)
    try:
        await db.scans.create_index([("location", "2dsphere"), ("timestamp", -1)])
    except Exception:
        pass
    try:
        await db.scans.create_index([("user_id", 1), ("timestamp", -1)])
    except Exception:
        pass
    try:
        await db.scans.create_index([("disease", 1), ("confidence", -1)])
    except Exception:
        pass

    # 2. Users: Fast lookups + aggregations
    try:
        await db.users.create_index([("user_id", 1)], unique=True)
    except Exception:
        pass
    try:
        await db.users.create_index([("total_scans", -1)])  # Top farmers leaderboard
    except Exception:
        pass
    try:
        await db.users.create_index([("language", 1)])       # Language-specific content
    except Exception:
        pass

    # 3. Community: Time-based feed + trending
    try:
        await db.community.create_index([("timestamp", -1)])
    except Exception:
        pass
    try:
        await db.community.create_index([("likes", -1), ("timestamp", -1)])  # Trending posts
    except Exception:
        pass
    try:
        await db.community.create_index([("tags", 1)])       # Tag search
    except Exception:
        pass

    # 4. Products: Search + category filtering
        # Products: Only one text index allowed per collection. Drop any existing text index before creating the desired one.
        try:
            existing_indexes = await db.products.index_information()
            # Find any text index
            text_index_name = None
            for name, info in existing_indexes.items():
                if info.get('key'):
                    # key is a list of tuples in Motor, e.g. [('title', 'text')]
                    if any(field_type[1] == 'text' for field_type in info['key']):
                        text_index_name = name
                        break
            if text_index_name:
                await db.products.drop_index(text_index_name)
                print(f"[DB] Dropped existing text index on products: {text_index_name}")
            await db.products.create_index([("title", "text"), ("description", "text")])  # Full-text search
            print("[DB] Created compound text index on products: title+description")
        except Exception as e:
            print(f"[DB] Index creation failed for products: {e}")

    # 5. C2C Listings: Location-based marketplace
    await db.c2c_listings.create_index([("location", "2dsphere")])
    await db.c2c_listings.create_index([("timestamp", -1)])

    try:
        await db["prediction_logs"].create_index("request_id", unique=True)
    except Exception:
        pass
    try:
        await db["prediction_logs"].create_index([("user_id", 1), ("timestamp", -1)])
    except Exception:
        pass
    try:
        await db["prediction_logs"].create_index("model_version")
    except Exception:
        pass

    try:
        await db["model_feedback"].create_index([("prediction_id", 1), ("timestamp", -1)])
    except Exception:
        pass
    try:
        await db["expert_call_logs"].create_index([("user_id", 1), ("timestamp", -1)])
    except Exception:
        pass
    try:
        await db["expert_call_logs"].create_index("call_id")
    except Exception:
        pass
    try:
        await db["expert_call_logs"].create_index([("status", 1), ("timestamp", -1)])
    except Exception:
        pass
    try:
        await db["training_runs"].create_index([("model_version", 1), ("created_at", -1)])
    except Exception:
        pass

    await db["community"].create_index([("timestamp", -1)])
    await db["community"].create_index([("crop", 1), ("timestamp", -1)])
    await db["community"].create_index([("tags", 1)])
    await db["community"].create_index([("media_type", 1), ("timestamp", -1)])
    await db["community"].create_index([("author_id", 1), ("timestamp", -1)])
    await db["community"].create_index("manage_token", sparse=True)
