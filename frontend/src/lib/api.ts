/**
 * API client for backend communication.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface WorkItem {
  work_id: string;
  title: string;
  author: string;
  chunk_count: number;
}

export interface WorkListResponse {
  works: WorkItem[];
  total: number;
}

export interface ChunkResponse {
  work_id: string;
  chunk_id: string;
  title: string | null;
  author: string | null;
  text: string;
  context_text: string | null;
  offset_start: number | null;
  offset_end: number | null;
}

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
}

export interface SearchResponse {
  query: string;
  aozora_results: SearchResultItem[];
  web_results: SearchResultItem[];
  timing_ms: number;
  errors: string[];
}

/**
 * Fetch list of all works from the backend.
 */
export async function fetchWorks(limit = 100, offset = 0): Promise<WorkListResponse> {
  const res = await fetch(`${BACKEND_URL}/api/works?limit=${limit}&offset=${offset}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch works: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch a specific chunk by work_id and chunk_id.
 */
export async function fetchChunk(workId: string, chunkId: string): Promise<ChunkResponse> {
  const res = await fetch(`${BACKEND_URL}/api/works/${workId}/chunk/${chunkId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch chunk: ${res.status}`);
  }
  return res.json();
}

/**
 * Search for works and web results.
 */
export async function searchWorks(
  query: string,
  options: {
    k_internal?: number;
    k_web?: number;
    include_web?: boolean;
  } = {}
): Promise<SearchResponse> {
  const res = await fetch(`${BACKEND_URL}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      k_internal: options.k_internal ?? 5,
      k_web: options.k_web ?? 3,
      include_web: options.include_web ?? true,
    }),
  });
  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }
  return res.json();
}
