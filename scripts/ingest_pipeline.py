#!/usr/bin/env python3
"""
Aozora Bunko ingestion pipeline.

This script:
1. Finds text files in the Aozora repository
2. Cleans and chunks the text
3. Generates embeddings using OpenAI
4. Stores in ChromaDB
"""

import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import List, Optional

import chromadb
from dotenv import load_dotenv
from openai import OpenAI

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from aozora.cleaning import clean_aozora_text, read_aozora_file
from aozora.chunking import create_chunks_with_context
from aozora.schema import WorkInfo

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Configuration
AOZORA_REPO_PATH = Path(os.getenv("AOZORA_REPO_PATH", "../data/aozora_repo"))
CHROMA_PERSIST_DIR = Path(os.getenv("CHROMA_PERSIST_DIR", "../chroma"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "aozora_chunks_v1")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
MANIFEST_PATH = Path(os.getenv("OUTPUT_MANIFEST_PATH", "../data/manifests/aozora_index.jsonl"))

# Batch sizes
EMBEDDING_BATCH_SIZE = 100
CHROMA_BATCH_SIZE = 500

# Demo: limit number of works for faster testing
MAX_WORKS = int(os.getenv("MAX_WORKS", "50"))


def find_text_files(repo_path: Path) -> list[Path]:
    """Find all text files in the Aozora repository."""
    cards_dir = repo_path / "cards"
    if not cards_dir.exists():
        logger.error(f"Cards directory not found: {cards_dir}")
        return []

    text_files = []
    for txt_file in cards_dir.glob("**/files/*.txt"):
        # Skip certain patterns
        filename = txt_file.name.lower()
        if any(skip in filename for skip in ["readme", "index", "copyright"]):
            continue
        text_files.append(txt_file)

    return text_files


def extract_work_info(filepath: Path) -> Optional[WorkInfo]:
    """Extract work metadata from filepath and content."""
    # Aozora path pattern: cards/{author_id}/files/{work_id}_{...}.txt
    parts = filepath.parts
    try:
        # Find cards index
        cards_idx = parts.index("cards")
        author_id = parts[cards_idx + 1]

        # Extract work_id from filename (e.g., "1234_ruby_12345.txt")
        filename = filepath.stem
        match = re.match(r"(\d+)", filename)
        if not match:
            return None
        work_id = match.group(1)

        # Read first few lines to get title/author
        try:
            content = read_aozora_file(filepath)
            lines = content.split("\n")[:20]

            # First non-empty line is usually the title
            title = ""
            author = ""
            for i, line in enumerate(lines):
                line = line.strip()
                if line and not title:
                    title = line
                elif line and title and not author:
                    author = line
                    break

            if not title:
                title = f"Work {work_id}"
            if not author:
                author = f"Author {author_id}"

        except Exception as e:
            logger.warning(f"Could not read {filepath}: {e}")
            title = f"Work {work_id}"
            author = f"Author {author_id}"

        return WorkInfo(
            work_id=work_id,
            title=title[:100],  # Truncate long titles
            author=author[:50],
            source_path=str(filepath.relative_to(filepath.parents[4])),
        )

    except (ValueError, IndexError) as e:
        logger.warning(f"Could not parse path {filepath}: {e}")
        return None


def get_embeddings(texts: list[str], client: OpenAI) -> list[list[float]]:
    """Get embeddings for a batch of texts."""
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def main():
    """Run the ingestion pipeline."""
    logger.info("=== Aozora Bunko Ingestion Pipeline ===")

    # Check OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY not set. Please set it in .env")
        sys.exit(1)

    # Initialize clients
    openai_client = OpenAI()
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_PERSIST_DIR.resolve()))

    # Get or create collection
    collection = chroma_client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )

    logger.info(f"Using collection: {CHROMA_COLLECTION}")
    logger.info(f"Existing documents: {collection.count()}")

    # Find text files
    repo_path = AOZORA_REPO_PATH.resolve()
    logger.info(f"Scanning repository: {repo_path}")

    text_files = find_text_files(repo_path)
    logger.info(f"Found {len(text_files)} text files")

    if MAX_WORKS > 0:
        text_files = text_files[:MAX_WORKS]
        logger.info(f"Limited to {MAX_WORKS} works for demo")

    # Process each work
    all_chunks = []
    manifest_entries = []

    for i, filepath in enumerate(text_files):
        logger.info(f"Processing [{i+1}/{len(text_files)}]: {filepath.name}")

        # Extract work info
        work_info = extract_work_info(filepath)
        if not work_info:
            logger.warning(f"Skipping {filepath}: could not extract metadata")
            continue

        # Read and clean text
        try:
            raw_text = read_aozora_file(filepath)
            clean_text = clean_aozora_text(raw_text)

            if len(clean_text) < 100:
                logger.warning(f"Skipping {filepath}: text too short after cleaning")
                continue

        except Exception as e:
            logger.error(f"Error processing {filepath}: {e}")
            continue

        # Create chunks
        chunks = create_chunks_with_context(clean_text, work_info)
        logger.info(f"  Created {len(chunks)} chunks for {work_info.title[:30]}...")

        all_chunks.extend(chunks)

        # Add to manifest
        manifest_entries.append({
            "work_id": work_info.work_id,
            "title": work_info.title,
            "author": work_info.author,
            "source_path": work_info.source_path,
            "chunk_count": len(chunks),
        })

    logger.info(f"\nTotal chunks to process: {len(all_chunks)}")

    # Generate embeddings and store in batches
    for batch_start in range(0, len(all_chunks), EMBEDDING_BATCH_SIZE):
        batch_end = min(batch_start + EMBEDDING_BATCH_SIZE, len(all_chunks))
        batch = all_chunks[batch_start:batch_end]

        logger.info(f"Embedding batch {batch_start//EMBEDDING_BATCH_SIZE + 1}...")

        # Get texts for embedding
        texts = [chunk_text for chunk_text, _ in batch]

        try:
            embeddings = get_embeddings(texts, openai_client)
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            continue

        # Prepare for ChromaDB
        ids = [meta.chunk_id for _, meta in batch]
        documents = texts
        metadatas = [meta.to_dict() for _, meta in batch]

        # Add to collection
        try:
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )
        except Exception as e:
            logger.error(f"ChromaDB error: {e}")
            continue

    # Save manifest
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        for entry in manifest_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    logger.info(f"\nManifest saved to: {MANIFEST_PATH}")
    logger.info(f"Total documents in collection: {collection.count()}")
    logger.info("=== Ingestion complete ===")


if __name__ == "__main__":
    main()
