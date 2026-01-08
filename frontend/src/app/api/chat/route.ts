import { google } from "@ai-sdk/google";
import { streamText } from "ai";

import { SYSTEM_PROMPT, buildContext } from "@/lib/prompt";
import type { SearchResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the latest user message
  const lastMessage = messages[messages.length - 1];
  const query = lastMessage.content;

  // Fetch search results from backend
  const backendUrl = process.env.BACKEND_SEARCH_URL || "http://localhost:8000/api/search";

  let searchResults: SearchResponse | null = null;
  let searchError: string | null = null;

  try {
    const searchResponse = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        k_internal: 5,
        k_web: 3,
        include_web: true,
      }),
    });

    if (searchResponse.ok) {
      searchResults = await searchResponse.json();
    } else {
      searchError = `Search failed: ${searchResponse.status}`;
    }
  } catch (error) {
    searchError = `Search error: ${error}`;
    console.error("Backend search error:", error);
  }

  // Build context from search results
  let contextSection = "";
  if (searchResults) {
    contextSection = buildContext(
      searchResults.aozora_results.map((r) => ({
        title: r.title || "不明",
        author: r.author || "不明",
        text: r.text,
        context_text: r.context_text,
      })),
      searchResults.web_results.map((r) => ({
        title: r.title,
        url: r.url,
        text: r.text,
      }))
    );
  } else if (searchError) {
    contextSection = `\n\n[検索エラー: ${searchError}]\n\n`;
  }

  // Build the full prompt
  const systemWithContext = `${SYSTEM_PROMPT}\n\n${contextSection}`;

  // Stream the response using Gemini
  const result = streamText({
    model: google("gemini-3-flash-preview"),
    system: systemWithContext,
    messages,
  });

  return result.toDataStreamResponse();
}
