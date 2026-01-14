"""Search orchestrator for parallel internal + external search."""

import asyncio
import logging
import time
from dataclasses import dataclass

from app.schemas import SearchResultItem
from app.services.chroma_client import query_similar
from app.services.exa_client import search_web
from app.settings import get_settings

logger = logging.getLogger(__name__)


@dataclass
class SearchResults:
    """Combined search results from all sources."""

    aozora_results: list[SearchResultItem]
    web_results: list[SearchResultItem]
    timing_ms: int
    errors: list[str]


async def run_parallel_search(
    query: str,
    k_internal: int = 5,
    k_web: int = 3,
    include_web: bool = True,
    timeout_ms: int | None = None,
) -> SearchResults:
    """
    Run parallel search across internal (ChromaDB) and external (Exa) sources.

    Args:
        query: Search query
        k_internal: Number of internal results
        k_web: Number of web results
        include_web: Whether to include web search
        timeout_ms: Custom timeout in milliseconds

    Returns:
        SearchResults with combined results
    """
    settings = get_settings()
    timeout = (timeout_ms or settings.search_timeout_ms) / 1000.0
    errors: list[str] = []

    start_time = time.time()

    # Prepare tasks
    tasks = [query_similar(query, k=k_internal)]

    if include_web and k_web > 0:
        tasks.append(search_web(query, k=k_web, timeout_seconds=min(timeout, 2.0)))

    # Run in parallel with timeout
    try:
        results = await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=True),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        logger.warning(f"Search timeout after {timeout}s")
        errors.append("Search timeout - partial results returned")
        results = [[], []]

    # Process results
    aozora_results: list[SearchResultItem] = []
    web_results: list[SearchResultItem] = []

    # Internal results
    if len(results) > 0:
        if isinstance(results[0], Exception):
            logger.error(f"Internal search error: {results[0]}")
            errors.append(f"Internal search error: {results[0]}")
        elif isinstance(results[0], list):
            aozora_results = results[0]

    # Web results
    if include_web and len(results) > 1:
        if isinstance(results[1], Exception):
            logger.error(f"Web search error: {results[1]}")
            errors.append(f"Web search error: {results[1]}")
        elif isinstance(results[1], list):
            web_results = results[1]

    elapsed_ms = int((time.time() - start_time) * 1000)

    return SearchResults(
        aozora_results=aozora_results,
        web_results=web_results,
        timing_ms=elapsed_ms,
        errors=errors,
    )
