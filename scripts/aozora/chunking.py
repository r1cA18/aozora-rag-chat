"""Text chunking utilities."""

import re
from dataclasses import dataclass
from typing import Iterator

from .schema import ChunkMetadata, WorkInfo


def estimate_tokens(text: str) -> int:
    """
    Estimate token count for Japanese text.

    Rough approximation: ~1.5 characters per token for Japanese.
    This is a demo approximation; production should use tiktoken.
    """
    # Count characters (excluding whitespace)
    char_count = len(re.sub(r"\s+", "", text))
    return int(char_count / 1.5)


def split_into_sentences(text: str) -> list[str]:
    """Split text into sentences for Japanese."""
    # Split on Japanese sentence endings
    sentences = re.split(r"(?<=[。！？」』\n])", text)
    return [s for s in sentences if s.strip()]


@dataclass
class TextChunk:
    """A chunk of text with metadata."""

    text: str
    offset_start: int
    offset_end: int
    token_count: int


def chunk_text(
    text: str,
    target_tokens: int = 400,
    overlap_tokens: int = 50,
) -> Iterator[TextChunk]:
    """
    Chunk text into pieces of approximately target_tokens.

    Uses sentence boundaries to avoid cutting mid-sentence.
    """
    sentences = split_into_sentences(text)
    if not sentences:
        return

    current_chunk = []
    current_tokens = 0
    current_start = 0
    text_position = 0

    for sentence in sentences:
        sentence_tokens = estimate_tokens(sentence)

        # If adding this sentence exceeds target (and we have content)
        if current_tokens + sentence_tokens > target_tokens and current_chunk:
            # Yield current chunk
            chunk_text = "".join(current_chunk)
            yield TextChunk(
                text=chunk_text,
                offset_start=current_start,
                offset_end=text_position,
                token_count=current_tokens,
            )

            # Start new chunk with overlap
            # Keep last few sentences for overlap
            overlap_text = ""
            overlap_sentences = []
            overlap_token_count = 0

            for s in reversed(current_chunk):
                s_tokens = estimate_tokens(s)
                if overlap_token_count + s_tokens <= overlap_tokens:
                    overlap_sentences.insert(0, s)
                    overlap_token_count += s_tokens
                else:
                    break

            current_chunk = overlap_sentences
            current_tokens = overlap_token_count
            current_start = text_position - len("".join(overlap_sentences))

        # Add sentence to current chunk
        current_chunk.append(sentence)
        current_tokens += sentence_tokens
        text_position += len(sentence)

    # Yield final chunk
    if current_chunk:
        chunk_text = "".join(current_chunk)
        yield TextChunk(
            text=chunk_text,
            offset_start=current_start,
            offset_end=text_position,
            token_count=current_tokens,
        )


def create_chunks_with_context(
    text: str,
    work_info: WorkInfo,
    search_tokens: int = 400,
    context_tokens: int = 2000,
    overlap_tokens: int = 50,
) -> list[tuple[str, ChunkMetadata]]:
    """
    Create chunks for search with expanded context for LLM.

    Returns list of (search_chunk_text, metadata) tuples.
    The metadata includes context_text with expanded context.
    """
    chunks = list(chunk_text(text, target_tokens=search_tokens, overlap_tokens=overlap_tokens))
    results = []

    for i, chunk in enumerate(chunks):
        # Calculate context window
        context_start = chunk.offset_start
        context_end = chunk.offset_end

        # Expand context backwards
        target_context_chars = int(context_tokens * 1.5)  # Approximate chars
        half_context = target_context_chars // 2

        context_start = max(0, chunk.offset_start - half_context)
        context_end = min(len(text), chunk.offset_end + half_context)

        # Adjust to sentence boundaries
        if context_start > 0:
            # Find previous sentence end
            prev_text = text[:context_start]
            match = re.search(r"[。！？」』\n][^。！？」』\n]*$", prev_text)
            if match:
                context_start = match.start() + 1

        if context_end < len(text):
            # Find next sentence end
            next_text = text[context_end:]
            match = re.search(r"[。！？」』\n]", next_text)
            if match:
                context_end += match.end()

        context_text = text[context_start:context_end]

        # Create metadata
        chunk_id = ChunkMetadata.create_id(work_info.work_id, i, chunk.offset_start)
        metadata = ChunkMetadata(
            chunk_id=chunk_id,
            work_id=work_info.work_id,
            title=work_info.title,
            author=work_info.author,
            source_path=work_info.source_path,
            chunk_index=i,
            offset_start=chunk.offset_start,
            offset_end=chunk.offset_end,
            chunk_tokens=chunk.token_count,
            context_text=context_text,
        )

        results.append((chunk.text, metadata))

    return results
