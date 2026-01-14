"""Text cleaning utilities for Aozora Bunko texts."""

import re
import zipfile
import io
from pathlib import Path


def remove_ruby(text: str) -> str:
    """
    Remove ruby annotations from text.

    Patterns:
    - ｜base《ruby》 → base
    - base《ruby》 → base (when no ｜)
    - 《...》 alone → removed
    """
    # Pattern: ｜base《ruby》
    text = re.sub(r"｜([^《]+)《[^》]+》", r"\1", text)

    # Pattern: base《ruby》 (kanji followed by ruby)
    text = re.sub(r"([一-龯々]+)《[^》]+》", r"\1", text)

    # Remove any remaining ruby brackets
    text = re.sub(r"《[^》]*》", "", text)

    return text


def remove_annotations(text: str) -> str:
    """
    Remove Aozora-specific annotations.

    Patterns:
    - ［＃...］ (editorial notes)
    - ※［＃...］ (gaiji notes)
    """
    # Remove ※［＃...］ (gaiji annotations)
    text = re.sub(r"※［＃[^］]*］", "", text)

    # Remove ［＃...］ (general annotations)
    text = re.sub(r"［＃[^］]*］", "", text)

    return text


def extract_body(text: str) -> str:
    """
    Extract the main body text, removing header and footer.

    Removes:
    - Header info before the main text
    - Ruby/annotation explanation section
    - Footer with 底本, 校正, etc.
    """
    lines = text.split("\n")

    # Find start of main text
    # Look for the LAST dashed line separator in the first 50 lines
    # (to skip the header explanation section that may have its own separators)
    start_idx = 0
    last_separator_idx = -1

    for i, line in enumerate(lines[:50]):
        if re.match(r"^[-－ー]+$", line.strip()) and len(line.strip()) >= 10:
            last_separator_idx = i

    if last_separator_idx > 0:
        start_idx = last_separator_idx + 1
    else:
        # Fallback: look for empty line after title/author block
        for i, line in enumerate(lines):
            if i > 0 and i < 20 and line.strip() == "" and lines[i - 1].strip():
                if any(
                    kw in "".join(lines[:i])
                    for kw in ["作者", "著者", "訳者"]
                ):
                    start_idx = i + 1
                    break

    # Find end of main text (before footer)
    end_idx = len(lines)
    footer_markers = [
        "底本：",
        "底本:",
        "入力：",
        "校正：",
        "このファイルは",
        "青空文庫作成ファイル",
        "-------",
        "━━━━━",
    ]

    for i in range(len(lines) - 1, max(len(lines) - 50, 0), -1):
        line = lines[i].strip()
        if any(marker in line for marker in footer_markers):
            end_idx = i
            break

    # Extract body
    body_lines = lines[start_idx:end_idx]

    return "\n".join(body_lines)


def clean_aozora_text(text: str) -> str:
    """
    Full cleaning pipeline for Aozora text.

    1. Extract body (remove header/footer)
    2. Remove ruby annotations
    3. Remove editorial annotations
    4. Normalize whitespace
    """
    # Extract body first
    text = extract_body(text)

    # Remove ruby
    text = remove_ruby(text)

    # Remove annotations
    text = remove_annotations(text)

    # Normalize whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()

    return text


def read_aozora_file(filepath: Path) -> str:
    """
    Read an Aozora Bunko text file with proper encoding handling.

    Handles:
    - ZIP compressed files (extract .txt from inside)
    - Shift-JIS encoded files
    - UTF-8 encoded files
    - Skips XML/HTML files

    Most files are Shift-JIS, some are UTF-8.
    """
    # Read raw bytes first to detect file type
    with open(filepath, "rb") as f:
        raw_data = f.read()

    # Check for ZIP magic bytes (PK\x03\x04)
    if raw_data[:4] == b"PK\x03\x04":
        return _extract_text_from_zip(raw_data)

    # Check for XML/HTML (skip these)
    if raw_data[:5] == b"<?xml" or raw_data[:6] == b"<!DOCT":
        raise ValueError("XML/HTML file, not plain text")

    # Decode as text
    return _decode_text(raw_data)


def _extract_text_from_zip(zip_data: bytes) -> str:
    """Extract text content from a ZIP archive."""
    try:
        with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
            # Find the main text file inside the ZIP
            txt_files = [n for n in zf.namelist() if n.endswith(".txt")]
            if not txt_files:
                raise ValueError("No .txt file found in ZIP")

            # Read the first .txt file
            txt_name = txt_files[0]
            txt_data = zf.read(txt_name)

            return _decode_text(txt_data)
    except zipfile.BadZipFile:
        raise ValueError("Invalid ZIP file")


def _decode_text(data: bytes) -> str:
    """Decode bytes to string, trying multiple encodings."""
    # Try UTF-8 first
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        pass

    # Fall back to Shift-JIS (CP932 for Windows compatibility)
    try:
        return data.decode("cp932")
    except UnicodeDecodeError:
        pass

    # Last resort: UTF-8 with error handling
    return data.decode("utf-8", errors="replace")
