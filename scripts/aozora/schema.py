"""Data schemas for Aozora processing."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class WorkInfo:
    """Information about a single work."""

    work_id: str
    title: str
    author: str
    source_path: str
    source_url: Optional[str] = None


@dataclass
class ChunkMetadata:
    """Metadata for a single chunk."""

    chunk_id: str
    work_id: str
    title: str
    author: str
    source_path: str
    chunk_index: int
    offset_start: int
    offset_end: int
    chunk_tokens: int
    context_text: Optional[str] = None

    @classmethod
    def create_id(cls, work_id: str, chunk_index: int, offset_start: int) -> str:
        """Create a stable, unique chunk ID."""
        return f"{work_id}:{chunk_index}:{offset_start}"

    def to_dict(self) -> dict:
        """Convert to dictionary for ChromaDB metadata."""
        return {
            "work_id": self.work_id,
            "title": self.title,
            "author": self.author,
            "source_path": self.source_path,
            "chunk_index": self.chunk_index,
            "offset_start": self.offset_start,
            "offset_end": self.offset_end,
            "chunk_tokens": self.chunk_tokens,
            "context_text": self.context_text or "",
        }
