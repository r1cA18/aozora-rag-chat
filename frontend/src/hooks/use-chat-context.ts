"use client";

import { useState, useCallback } from "react";

export interface ContextItem {
  id: string;
  type: "tab" | "selection";
  title: string;
  subtitle?: string;
  content: string;
}

export function useChatContext() {
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);

  const setTabContext = useCallback(
    (workId: string, title: string, author: string, excerpt: string) => {
      setContextItems((prev) => {
        // Remove existing tab context (only keep one tab at a time)
        const filtered = prev.filter((item) => item.type !== "tab");
        return [
          {
            id: `tab-${workId}`,
            type: "tab",
            title,
            subtitle: author,
            content: excerpt,
          },
          ...filtered,
        ];
      });
    },
    []
  );

  const clearTabContext = useCallback(() => {
    setContextItems((prev) => prev.filter((item) => item.type !== "tab"));
  }, []);

  const setSelectionContext = useCallback(
    (workId: string, title: string, selectedText: string) => {
      setContextItems((prev) => {
        // Remove existing selection context (only keep one selection at a time)
        const filtered = prev.filter((item) => item.type !== "selection");
        return [
          ...filtered,
          {
            id: `selection-${workId}`,
            type: "selection",
            title: `${title}より`,
            content: selectedText,
          },
        ];
      });
    },
    []
  );

  const clearSelectionContext = useCallback(() => {
    setContextItems((prev) => prev.filter((item) => item.type !== "selection"));
  }, []);

  const removeContext = useCallback((id: string) => {
    setContextItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAllContext = useCallback(() => {
    setContextItems([]);
  }, []);

  const getContextPrompt = useCallback(() => {
    if (contextItems.length === 0) return "";

    const parts: string[] = [];

    for (const item of contextItems) {
      if (item.type === "tab") {
        parts.push(
          `【参照中の作品】\n作品: ${item.title}\n著者: ${item.subtitle}\n抜粋:\n${item.content}`
        );
      } else if (item.type === "selection") {
        parts.push(`【選択されたテキスト - ${item.title}】\n${item.content}`);
      }
    }

    return parts.join("\n\n");
  }, [contextItems]);

  return {
    contextItems,
    setTabContext,
    clearTabContext,
    setSelectionContext,
    clearSelectionContext,
    removeContext,
    clearAllContext,
    getContextPrompt,
  };
}
