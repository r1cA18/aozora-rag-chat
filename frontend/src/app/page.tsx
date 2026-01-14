"use client";

import { useChat } from "ai/react";
import { useState, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Sidebar } from "@/components/sidebar/sidebar";
import { TextViewer } from "@/components/viewer/text-viewer";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useViewer } from "@/hooks/use-viewer";
import { useChatContext } from "@/hooks/use-chat-context";
import { searchWorks, fetchWorkText, type SearchResultItem } from "@/lib/api";

interface Work {
  id: string;
  title: string;
  author: string;
}

interface Citation {
  type: "aozora" | "web";
  title: string;
  author?: string;
  text: string;
  workId?: string;
  url?: string;
}

export default function Home() {
  const { tabs, activeTabId, setActiveTabId, openTab, closeTab } = useViewer();
  const {
    contextItems,
    setTabContext,
    clearTabContext,
    setSelectionContext,
    clearSelectionContext,
    removeContext,
    getContextPrompt,
  } = useChatContext();

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    body: {
      contextPrompt: getContextPrompt(),
    },
  });

  const [recentWorks, setRecentWorks] = useState<Work[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string>();
  const [citations, setCitations] = useState<Map<string, Citation>>(new Map());
  const [lastSearchResults, setLastSearchResults] = useState<SearchResultItem[]>([]);

  // Update citations when we get search results
  useEffect(() => {
    if (lastSearchResults.length > 0) {
      const newCitations = new Map<string, Citation>();
      for (const result of lastSearchResults) {
        if (result.source === "aozora" && result.work_id) {
          const key = `aozora://${result.work_id}`;
          newCitations.set(key, {
            type: "aozora",
            title: result.title || "不明",
            author: result.author,
            text: result.context_text || result.text,
            workId: result.work_id,
          });
        }
      }
      setCitations(newCitations);
    }
  }, [lastSearchResults]);

  const handleWorkSelect = useCallback(
    async (work: Work) => {
      setSelectedWorkId(work.id);

      // Add to recent
      setRecentWorks((prev) => {
        const filtered = prev.filter((w) => w.id !== work.id);
        return [work, ...filtered].slice(0, 5);
      });

      // Open tab with loading state first
      openTab({
        workId: work.id,
        title: work.title,
        author: work.author,
        content: "本文を読み込み中...",
      });

      // Fetch the full text
      try {
        const response = await fetchWorkText(work.id);
        openTab({
          workId: work.id,
          title: response.title,
          author: response.author,
          content: response.text,
        });
      } catch (err) {
        console.error("Failed to fetch work text:", err);
        openTab({
          workId: work.id,
          title: work.title,
          author: work.author,
          content: "テキストの読み込みに失敗しました",
        });
      }
    },
    [openTab]
  );

  const handleCitationClick = useCallback(
    (citation: Citation) => {
      if (citation.type === "aozora" && citation.workId) {
        // Add to recent
        const work = {
          id: citation.workId,
          title: citation.title,
          author: citation.author || "",
        };
        setRecentWorks((prev) => {
          const filtered = prev.filter((w) => w.id !== work.id);
          return [work, ...filtered].slice(0, 5);
        });

        openTab({
          workId: citation.workId,
          title: citation.title,
          author: citation.author || "",
          content: citation.text,
        });
      }
    },
    [openTab]
  );

  const handleOpenAozora = useCallback((workId: string) => {
    // Open Aozora Bunko page
    window.open(`https://www.aozora.gr.jp/`, "_blank");
  }, []);

  // Auto-add active tab to context when it changes
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && activeTab.content && activeTab.content !== "本文を読み込み中...") {
      const excerpt = activeTab.content.slice(0, 500);
      setTabContext(activeTab.workId, activeTab.title, activeTab.author, excerpt);
    } else {
      clearTabContext();
    }
  }, [activeTabId, tabs, setTabContext, clearTabContext]);

  // Handle text selection change - auto add/remove selection context
  const handleSelectionChange = useCallback(
    (workId: string, title: string, selectedText: string | null) => {
      if (selectedText) {
        setSelectionContext(workId, title, selectedText);
      } else {
        clearSelectionContext();
      }
    },
    [setSelectionContext, clearSelectionContext]
  );

  // Custom submit handler to capture search results
  const handleChatSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      // Run search in parallel with chat
      const query = input.trim();
      searchWorks(query)
        .then((results) => {
          setLastSearchResults([...results.aozora_results, ...results.web_results]);
        })
        .catch((err) => {
          console.error("Search error:", err);
        });

      // Submit to chat
      handleSubmit(e);
    },
    [input, handleSubmit]
  );

  return (
    <AppLayout
      sidebar={
        <Sidebar
          recentWorks={recentWorks}
          selectedWorkId={selectedWorkId}
          onWorkSelect={handleWorkSelect}
        />
      }
      viewer={
        <TextViewer
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onTabClose={closeTab}
          onOpenAozora={handleOpenAozora}
          onSelectionChange={handleSelectionChange}
        />
      }
      chat={
        <ChatPanel
          messages={messages}
          input={input}
          isLoading={isLoading}
          citations={citations}
          contextItems={contextItems}
          onInputChange={handleInputChange}
          onSubmit={handleChatSubmit}
          onCitationClick={handleCitationClick}
          onRemoveContext={removeContext}
        />
      }
    />
  );
}
