from collections import defaultdict, deque
from time import monotonic
from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > window_seconds:
            hits.popleft()
        if len(hits) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos. Espera unos minutos e intentalo de nuevo.",
            )
        hits.append(now)


rate_limiter = InMemoryRateLimiter()


def rate_limit_key(request: Request, scope: str, identifier: str = "") -> str:
    client_host = request.client.host if request.client else "unknown"
    normalized_identifier = identifier.strip().lower()
    return f"{scope}:{client_host}:{normalized_identifier}"
