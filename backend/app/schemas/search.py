"""Search API schemas."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SourceType(str, Enum):
    """Source type for search results."""

    AOZORA = "aozora"
    WEB = "web"


class SearchResultItem(BaseModel):
    """A single search result item."""

    id: str = Field(..., description="Unique identifier for the result")
    source: SourceType = Field(..., description="Source of the result")
    text: str = Field(..., description="The text content")
    score: float = Field(..., description="Relevance score (0-1)")

    # Aozora-specific fields
    title: Optional[str] = Field(None, description="Work title (for aozora)")
    author: Optional[str] = Field(None, description="Author name (for aozora)")
    work_id: Optional[str] = Field(None, description="Work ID (for aozora)")
    offset_start: Optional[int] = Field(None, description="Start offset in text")
    offset_end: Optional[int] = Field(None, description="End offset in text")
    context_text: Optional[str] = Field(None, description="Expanded context (2000 tokens)")

    # Web-specific fields
    url: Optional[str] = Field(None, description="URL (for web)")
    snippet: Optional[str] = Field(None, description="Snippet (for web)")


class SearchRequest(BaseModel):
    """Search request payload."""

    query: str = Field(..., description="Search query", min_length=1, max_length=1000)
    k_internal: int = Field(5, description="Number of internal results", ge=1, le=20)
    k_web: int = Field(3, description="Number of web results", ge=0, le=10)
    include_web: bool = Field(True, description="Include web search results")
    timeout_ms: Optional[int] = Field(None, description="Custom timeout in milliseconds")


class SearchResponse(BaseModel):
    """Search response payload."""

    query: str = Field(..., description="Original query")
    aozora_results: list[SearchResultItem] = Field(
        default_factory=list, description="Results from Aozora archive"
    )
    web_results: list[SearchResultItem] = Field(
        default_factory=list, description="Results from web search"
    )
    timing_ms: int = Field(..., description="Total search time in milliseconds")
    errors: list[str] = Field(default_factory=list, description="Any errors encountered")
