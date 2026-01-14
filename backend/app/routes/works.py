"""Works API route for retrieving work list and text content."""

import logging
import re
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.settings import get_settings
from app.utils.aozora import (
    clean_aozora_text,
    extract_title_author,
    read_aozora_file,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/works", tags=["works"])


class WorkItem(BaseModel):
    """A single work item."""

    work_id: str
    title: str
    author: str
    source_path: str


class WorkListResponse(BaseModel):
    """Response for work list."""

    works: list[WorkItem]
    total: int


class WorkTextResponse(BaseModel):
    """Response for work full text."""

    work_id: str
    title: str
    author: str
    text: str


def get_aozora_repo_path() -> Path:
    """Get path to aozora repository."""
    settings = get_settings()
    return Path(settings.aozora_repo_path).resolve()


def extract_work_info(filepath: Path) -> dict | None:
    """Extract work metadata from filepath and content."""
    parts = filepath.parts
    try:
        # Find cards index
        parts.index("cards")

        # Extract work_id from filename (e.g., "1234_ruby_12345.txt")
        filename = filepath.stem
        match = re.match(r"(\d+)", filename)
        if not match:
            return None
        work_id = match.group(1)

        # Read file to get title/author
        try:
            content = read_aozora_file(filepath)
            title, author = extract_title_author(content)

            if title == "不明":
                return None  # Skip files without proper title

        except Exception:
            # Skip files that can't be read (corrupted ZIP, XML, etc.)
            return None

        return {
            "work_id": work_id,
            "title": title,
            "author": author,
            "source_path": str(filepath),
        }

    except (ValueError, IndexError):
        return None


def find_text_files(repo_path: Path) -> list[Path]:
    """Find all text/zip files in the Aozora repository."""
    cards_dir = repo_path / "cards"
    if not cards_dir.exists():
        return []

    text_files = []

    # Find both .txt and .zip files
    for pattern in ["**/files/*.txt", "**/files/*_ruby*.zip", "**/files/*_txt*.zip"]:
        for file in cards_dir.glob(pattern):
            # Skip certain patterns
            filename = file.name.lower()
            if any(skip in filename for skip in ["readme", "index", "copyright"]):
                continue
            text_files.append(file)

    return text_files


@lru_cache(maxsize=1)
def get_all_works() -> list[WorkItem]:
    """Get all works with caching and deduplication."""
    repo_path = get_aozora_repo_path()
    if not repo_path.exists():
        return []

    text_files = find_text_files(repo_path)
    logger.info(f"Found {len(text_files)} text files, extracting metadata...")

    # Use dict to deduplicate by work_id
    works_map: dict[str, WorkItem] = {}
    for i, filepath in enumerate(text_files):
        if i % 1000 == 0 and i > 0:
            logger.info(f"Processed {i}/{len(text_files)} files...")
        info = extract_work_info(filepath)
        if info:
            work_id = info["work_id"]
            # Keep first occurrence (prefer _ruby over _txt)
            if work_id not in works_map:
                works_map[work_id] = WorkItem(**info)

    works = list(works_map.values())
    # Sort by title
    works.sort(key=lambda w: w.title)
    logger.info(f"Loaded {len(works)} unique works")
    return works


@router.get("", response_model=WorkListResponse)
async def list_works(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    q: str | None = Query(None, description="Search query for title or author"),
) -> WorkListResponse:
    """
    Get list of all works from the filesystem.
    Supports optional search query to filter by title or author.
    """
    works = get_all_works()
    if not works:
        raise HTTPException(status_code=503, detail="No works available")

    # Filter by search query if provided
    if q:
        q_lower = q.lower()
        works = [
            w
            for w in works
            if q_lower in w.title.lower() or q_lower in w.author.lower()
        ]

    total = len(works)
    paginated = works[offset : offset + limit]

    return WorkListResponse(works=paginated, total=total)


@router.get("/{work_id}/text", response_model=WorkTextResponse)
async def get_work_text(work_id: str) -> WorkTextResponse:
    """Get the full text of a work by work_id."""
    repo_path = get_aozora_repo_path()
    if not repo_path.exists():
        raise HTTPException(status_code=503, detail="Aozora repository not found")

    # Find the file matching this work_id
    text_files = find_text_files(repo_path)
    target_file = None

    for filepath in text_files:
        filename = filepath.stem
        match = re.match(r"(\d+)", filename)
        if match and match.group(1) == work_id:
            target_file = filepath
            break

    if not target_file:
        raise HTTPException(status_code=404, detail=f"Work {work_id} not found")

    try:
        raw_text = read_aozora_file(target_file)
        clean_text = clean_aozora_text(raw_text)
        title, author = extract_title_author(raw_text)

        return WorkTextResponse(
            work_id=work_id,
            title=title or f"Work {work_id}",
            author=author or "Unknown",
            text=clean_text,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading work: {e}")
