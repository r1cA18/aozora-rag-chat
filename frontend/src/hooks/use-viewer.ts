"use client";

import { useState, useCallback } from "react";
import type { ViewerTab } from "@/components/viewer/text-viewer";

export function useViewer() {
  const [tabs, setTabs] = useState<ViewerTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | undefined>();

  const openTab = useCallback(
    (tab: Omit<ViewerTab, "id">) => {
      let resultTabId: string | undefined;

      setTabs((prev) => {
        const existingTab = prev.find((t) => t.workId === tab.workId);

        if (existingTab) {
          // Update existing tab with new content
          resultTabId = existingTab.id;
          return prev.map((t) =>
            t.id === existingTab.id
              ? {
                  ...t,
                  title: tab.title,
                  author: tab.author,
                  content: tab.content,
                  highlightRange: tab.highlightRange,
                }
              : t
          );
        }

        // Create new tab
        const newTab: ViewerTab = {
          ...tab,
          id: `${tab.workId}-${Date.now()}`,
        };
        resultTabId = newTab.id;
        return [...prev, newTab];
      });

      // Set active tab after state update
      if (resultTabId) {
        setActiveTabId(resultTabId);
      }

      return resultTabId;
    },
    []
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const newTabs = prev.filter((t) => t.id !== tabId);

        // If closing active tab, switch to another
        if (activeTabId === tabId && newTabs.length > 0) {
          const closedIndex = prev.findIndex((t) => t.id === tabId);
          const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
          setActiveTabId(newTabs[newActiveIndex]?.id);
        } else if (newTabs.length === 0) {
          setActiveTabId(undefined);
        }

        return newTabs;
      });
    },
    [activeTabId]
  );

  const updateTabHighlight = useCallback(
    (tabId: string, highlightRange?: { start: number; end: number }) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, highlightRange } : t))
      );
    },
    []
  );

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    updateTabHighlight,
  };
}
