/**
 * API client for backend communication.
 * Uses local API proxy routes to communicate with backend.
 */

import type {
  WorkItem,
  WorkListResponse,
  WorkTextResponse,
  SearchResultItem,
  SearchResponse,
} from "./types";

// Re-export types for convenience
export type { WorkItem, WorkListResponse, WorkTextResponse, SearchResultItem, SearchResponse };

// Use relative URLs to go through the Next.js API proxy
const API_BASE = "";

/**
 * Fetch list of works from the backend.
 * Supports optional search query to filter by title or author.
 */
export async function fetchWorks(limit = 100, offset = 0, query?: string): Promise<WorkListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (query) {
    params.set("q", query);
  }
  const res = await fetch(`${API_BASE}/api/works?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch works: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch the full text of a work by work_id.
 */
export async function fetchWorkText(workId: string): Promise<WorkTextResponse> {
  const res = await fetch(`${API_BASE}/api/works/${workId}/text`);
  if (!res.ok) {
    throw new Error(`Failed to fetch work text: ${res.status}`);
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
  const res = await fetch(`${API_BASE}/api/search`, {
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
