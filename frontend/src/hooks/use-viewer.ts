"use client";

import { useState, useCallback } from "react";
import type { ViewerTab } from "@/components/viewer/text-viewer";

export function useViewer() {
  const [tabs, setTabs] = useState<ViewerTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | undefined>();

  const openTab = useCallback(
    (tab: Omit<ViewerTab, "id">) => {
      const existingTab = tabs.find((t) => t.workId === tab.workId);

      if (existingTab) {
        // Update existing tab with new highlight if provided
        if (tab.highlightRange) {
          setTabs((prev) =>
            prev.map((t) =>
              t.id === existingTab.id
                ? { ...t, highlightRange: tab.highlightRange }
                : t
            )
          );
        }
        setActiveTabId(existingTab.id);
        return existingTab.id;
      }

      // Create new tab
      const newTab: ViewerTab = {
        ...tab,
        id: `${tab.workId}-${Date.now()}`,
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      return newTab.id;
    },
    [tabs]
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
