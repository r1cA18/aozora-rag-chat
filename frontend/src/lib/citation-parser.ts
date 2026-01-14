import type { Citation } from "./types";

export interface ParsedCitationPart {
  type: "citation";
  title: string;
  author?: string;
  isWeb: boolean;
}

export type CitationPart = string | ParsedCitationPart;

/**
 * Parse citation references like [出典: title - author] or [Web参考: title] from text.
 */
export function parseCitations(content: string): CitationPart[] {
  const citationPattern = /\[(?:出典|Web参考):\s*([^\]]+)\]/g;
  const parts: CitationPart[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(content)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const citationText = match[1];
    const isWeb = fullMatch.startsWith("[Web参考");

    // Parse "title - author" format
    const dashIndex = citationText.lastIndexOf(" - ");
    let title: string;
    let author: string | undefined;

    if (dashIndex > 0 && !isWeb) {
      title = citationText.slice(0, dashIndex).trim();
      author = citationText.slice(dashIndex + 3).trim();
    } else {
      title = citationText.trim();
    }

    parts.push({ type: "citation", title, author, isWeb });
    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

/**
 * Find matching citation from citations map by title and optionally author.
 */
export function findCitation(
  citations: Map<string, Citation>,
  title: string,
  author?: string
): Citation | undefined {
  for (const [, citation] of citations) {
    if (
      citation.title === title ||
      (author && citation.title === title && citation.author === author)
    ) {
      return citation;
    }
  }
  return undefined;
}
