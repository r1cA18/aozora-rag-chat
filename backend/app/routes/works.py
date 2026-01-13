"""Works API route for retrieving work list and chunk details."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.chroma_client import get_collection

router = APIRouter(prefix="/api/works", tags=["works"])


class WorkItem(BaseModel):
    """A single work item."""

    work_id: str
    title: str
    author: str
    chunk_count: int = 0


class WorkListResponse(BaseModel):
    """Response for work list."""

    works: list[WorkItem]
    total: int


@router.get("", response_model=WorkListResponse)
async def list_works(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> WorkListResponse:
    """
    Get list of all works in the database.

    Returns unique works with their metadata.
    """
    collection = get_collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # Get all documents with metadata
        result = collection.get(
            include=["metadatas"],
            limit=10000,  # Get all chunks
        )

        if not result or not result["metadatas"]:
            return WorkListResponse(works=[], total=0)

        # Extract unique works
        works_map: dict[str, WorkItem] = {}
        for meta in result["metadatas"]:
            work_id = meta.get("work_id", "")
            if work_id and work_id not in works_map:
                works_map[work_id] = WorkItem(
                    work_id=work_id,
                    title=meta.get("title", ""),
                    author=meta.get("author", ""),
                    chunk_count=1,
                )
            elif work_id:
                works_map[work_id].chunk_count += 1

        # Sort by title and apply pagination
        works = sorted(works_map.values(), key=lambda w: w.title)
        total = len(works)
        works = works[offset : offset + limit]

        return WorkListResponse(works=works, total=total)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ChunkResponse(BaseModel):
    """Response for a single chunk."""

    work_id: str
    chunk_id: str
    title: Optional[str] = None
    author: Optional[str] = None
    text: str
    context_text: Optional[str] = None
    offset_start: Optional[int] = None
    offset_end: Optional[int] = None


@router.get("/{work_id}/chunk/{chunk_id}", response_model=ChunkResponse)
async def get_chunk(work_id: str, chunk_id: str) -> ChunkResponse:
    """
    Get a specific chunk by work_id and chunk_id.

    Used by the frontend to load text for the side panel.
    """
    collection = get_collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        result = collection.get(
            ids=[chunk_id],
            include=["documents", "metadatas"],
        )

        if not result or not result["ids"]:
            raise HTTPException(status_code=404, detail="Chunk not found")

        doc = result["documents"][0] if result["documents"] else ""
        meta = result["metadatas"][0] if result["metadatas"] else {}

        # Verify work_id matches
        if meta.get("work_id") != work_id:
            raise HTTPException(status_code=404, detail="Chunk not found for this work")

        return ChunkResponse(
            work_id=work_id,
            chunk_id=chunk_id,
            title=meta.get("title"),
            author=meta.get("author"),
            text=doc,
            context_text=meta.get("context_text"),
            offset_start=meta.get("offset_start"),
            offset_end=meta.get("offset_end"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
