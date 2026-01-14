/**
 * Backend URL configuration for API routes.
 * These are server-side only and used by Next.js API routes to proxy requests.
 */
export const BACKEND_URLS = {
  search: process.env.BACKEND_SEARCH_URL || "http://localhost:8000/api/search",
  works: process.env.BACKEND_WORKS_URL || "http://localhost:8000/api/works",
} as const;
