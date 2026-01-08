"""Text cleaning utilities for Aozora Bunko texts."""

import re
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
    - Footer with 底本, 校正, etc.
    """
    lines = text.split("\n")

    # Find start of main text (after dashed line separator or title)
    start_idx = 0
    for i, line in enumerate(lines):
        # Common separator patterns
        if re.match(r"^[-－ー]{10,}$", line.strip()):
            start_idx = i + 1
            break
        # Or after empty line following title block
        if i > 0 and i < 20 and line.strip() == "" and lines[i - 1].strip():
            # Check if previous lines look like header
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

    Most files are Shift-JIS, some are UTF-8.
    """
    # Try UTF-8 first
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        pass

    # Fall back to Shift-JIS (CP932 for Windows compatibility)
    try:
        with open(filepath, "r", encoding="cp932") as f:
            return f.read()
    except UnicodeDecodeError:
        pass

    # Last resort: UTF-8 with error handling
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        return f.read()
