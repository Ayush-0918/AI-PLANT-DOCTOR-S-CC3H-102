import asyncio
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException


class InMemoryRateLimiter:
    """
    In-memory rate limiter.
    Suitable for single-process deployments and local development.
    Replace with Redis for multi-instance production.
    """

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._events: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, key: str) -> None:
        now = time.time()
        async with self._lock:
            bucket = self._events[key]
            cutoff = now - self.window_seconds
            while bucket and bucket[0] < cutoff:
                bucket.popleft()

            if len(bucket) >= self.max_requests:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_exceeded",
                        "message": "Too many requests. Please retry shortly.",
                        "window_seconds": self.window_seconds,
                        "max_requests": self.max_requests,
                    },
                )
            bucket.append(now)

