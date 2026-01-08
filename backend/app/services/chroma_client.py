"""ChromaDB client for vector search."""

import logging
from functools import lru_cache
from typing import Optional

import chromadb
from chromadb.api.models.Collection import Collection

from app.schemas import SearchResultItem, SourceType
from app.settings import get_settings

logger = logging.getLogger(__name__)


@lru_cache
def get_chroma_client() -> chromadb.PersistentClient:
    """Get cached ChromaDB client."""
    settings = get_settings()
    return chromadb.PersistentClient(path=str(settings.chroma_path))


def get_collection() -> Optional[Collection]:
    """Get the Aozora chunks collection."""
    settings = get_settings()
    client = get_chroma_client()

    try:
        return client.get_collection(name=settings.chroma_collection)
    except Exception as e:
        logger.warning(f"Collection not found: {e}")
        return None


async def query_similar(
    query_text: str,
    k: int = 5,
    where_filter: Optional[dict] = None,
) -> list[SearchResultItem]:
    """
    Query ChromaDB for similar documents.

    Args:
        query_text: The search query
        k: Number of results to return
        where_filter: Optional metadata filter

    Returns:
        List of SearchResultItem
    """
    collection = get_collection()
    if collection is None:
        logger.error("ChromaDB collection not available")
        return []

    try:
        results = collection.query(
            query_texts=[query_text],
            n_results=k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        items = []
        if results and results["ids"] and results["ids"][0]:
            ids = results["ids"][0]
            documents = results["documents"][0] if results["documents"] else []
            metadatas = results["metadatas"][0] if results["metadatas"] else []
            distances = results["distances"][0] if results["distances"] else []

            for i, doc_id in enumerate(ids):
                doc = documents[i] if i < len(documents) else ""
                meta = metadatas[i] if i < len(metadatas) else {}
                distance = distances[i] if i < len(distances) else 1.0

                # Convert distance to similarity score (0-1)
                # ChromaDB returns L2 distance, smaller = more similar
                score = max(0.0, 1.0 - (distance / 2.0))

                items.append(
                    SearchResultItem(
                        id=doc_id,
                        source=SourceType.AOZORA,
                        text=doc,
                        score=score,
                        title=meta.get("title"),
                        author=meta.get("author"),
                        work_id=meta.get("work_id"),
                        offset_start=meta.get("offset_start"),
                        offset_end=meta.get("offset_end"),
                        context_text=meta.get("context_text"),
                    )
                )

        return items

    except Exception as e:
        logger.error(f"ChromaDB query failed: {e}")
        return []
