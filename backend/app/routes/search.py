"""Search API route."""

from fastapi import APIRouter

from app.schemas import SearchRequest, SearchResponse
from app.services.search_orchestrator import run_parallel_search

router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest) -> SearchResponse:
    """
    Search both internal (Aozora) and external (Web) sources.

    Returns combined results with internal sources prioritized.
    """
    results = await run_parallel_search(
        query=request.query,
        k_internal=request.k_internal,
        k_web=request.k_web,
        include_web=request.include_web,
        timeout_ms=request.timeout_ms,
    )

    return SearchResponse(
        query=request.query,
        aozora_results=results.aozora_results,
        web_results=results.web_results,
        timing_ms=results.timing_ms,
        errors=results.errors,
    )
