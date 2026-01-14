/**
 * Shared type definitions for the frontend.
 */

/**
 * Work item from the backend API.
 */
export interface WorkItem {
  work_id: string;
  title: string;
  author: string;
  source_path?: string;
}

/**
 * Simplified work representation used in UI.
 */
export interface Work {
  id: string;
  title: string;
  author: string;
}

/**
 * Response from the works list endpoint.
 */
export interface WorkListResponse {
  works: WorkItem[];
  total: number;
}

/**
 * Response from the work text endpoint.
 */
export interface WorkTextResponse {
  work_id: string;
  title: string;
  author: string;
  text: string;
}

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

/**
 * Response from the search endpoint.
 */
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
  title: string;
  author?: string;
  workId?: string;
  url?: string;
}

/**
 * Chat message from AI SDK.
 */
export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
}
