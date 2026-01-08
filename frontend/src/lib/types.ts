/**
 * Search result from the backend.
 */
export interface SearchResultItem {
  id: string;
  source: "aozora" | "web";
  text: string;
  score: number;
  title?: string;
  author?: string;
  work_id?: string;
  offset_start?: number;
  offset_end?: number;
  context_text?: string;
  url?: string;
  snippet?: string;
}

export interface SearchResponse {
  query: string;
  aozora_results: SearchResultItem[];
  web_results: SearchResultItem[];
  timing_ms: number;
  errors: string[];
}

/**
 * Parsed citation from LLM response.
 */
export interface Citation {
  type: "aozora" | "web";
  text: string;
  title?: string;
  author?: string;
  workId?: string;
  url?: string;
}

/**
 * State for the side panel.
 */
export interface SidePanelState {
  isOpen: boolean;
  content?: {
    title: string;
    author: string;
    text: string;
    highlightStart?: number;
    highlightEnd?: number;
  };
}
