"""Exa API client for web search with caching."""

import hashlib
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from exa_py import Exa

from app.schemas import SearchResultItem, SourceType
from app.settings import get_settings

logger = logging.getLogger(__name__)


class ExaCache:
    """Simple SQLite-based cache for Exa results."""

    def __init__(self, cache_path: str = "../data/exa_cache.sqlite"):
        self.cache_path = Path(cache_path).resolve()
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        """Initialize the cache database."""
        with sqlite3.connect(self.cache_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            conn.commit()

    def _make_key(self, query: str, k: int) -> str:
        """Create a cache key from query parameters."""
        content = f"{query}:{k}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, query: str, k: int, ttl_days: int = 7) -> Optional[list[dict]]:
        """Get cached results if available and not expired."""
        key = self._make_key(query, k)

        with sqlite3.connect(self.cache_path) as conn:
            cursor = conn.execute(
                "SELECT value, created_at FROM cache WHERE key = ?", (key,)
            )
            row = cursor.fetchone()

            if row:
                value, created_at = row
                created = datetime.fromisoformat(created_at)
                if datetime.now() - created < timedelta(days=ttl_days):
                    return json.loads(value)

        return None

    def set(self, query: str, k: int, results: list[dict]) -> None:
        """Cache the results."""
        key = self._make_key(query, k)

        with sqlite3.connect(self.cache_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO cache (key, value, created_at)
                VALUES (?, ?, ?)
                """,
                (key, json.dumps(results), datetime.now().isoformat()),
            )
            conn.commit()


# Global cache instance
_cache: Optional[ExaCache] = None


def get_cache() -> ExaCache:
    """Get or create the cache instance."""
    global _cache
    if _cache is None:
        _cache = ExaCache()
    return _cache


def get_exa_client() -> Optional[Exa]:
    """Get Exa client if API key is configured."""
    settings = get_settings()
    if not settings.exa_api_key:
        logger.warning("Exa API key not configured")
        return None
    return Exa(api_key=settings.exa_api_key)


async def search_web(
    query: str,
    k: int = 3,
    timeout_seconds: float = 2.0,
) -> list[SearchResultItem]:
    """
    Search the web using Exa API.

    Args:
        query: Search query
        k: Number of results
        timeout_seconds: Timeout for the request

    Returns:
        List of SearchResultItem
    """
    settings = get_settings()
    cache = get_cache()

    # Check cache first
    cached = cache.get(query, k, ttl_days=settings.exa_cache_ttl_days)
    if cached is not None:
        logger.info(f"Cache hit for query: {query[:50]}...")
        return [SearchResultItem(**item) for item in cached]

    # Get client
    client = get_exa_client()
    if client is None:
        return []

    try:
        # Search with Exa
        response = client.search_and_contents(
            query=query,
            num_results=k,
            type="auto",
            text={"max_characters": 500},
            use_autoprompt=True,
        )

        items = []
        for i, result in enumerate(response.results):
            item = SearchResultItem(
                id=f"web_{i}_{hashlib.md5(result.url.encode()).hexdigest()[:8]}",
                source=SourceType.WEB,
                text=result.text if hasattr(result, "text") and result.text else "",
                score=0.8 - (i * 0.05),  # Decreasing score by position
                url=result.url,
                title=result.title if hasattr(result, "title") else None,
                snippet=result.text[:200] if hasattr(result, "text") and result.text else None,
            )
            items.append(item)

        # Cache the results
        cache.set(query, k, [item.model_dump() for item in items])

        return items

    except Exception as e:
        logger.error(f"Exa search failed: {e}")
        return []
