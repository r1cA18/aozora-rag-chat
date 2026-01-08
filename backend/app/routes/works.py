"""Works API route for retrieving chunk details."""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.chroma_client import get_collection

router = APIRouter(prefix="/api/works", tags=["works"])


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
