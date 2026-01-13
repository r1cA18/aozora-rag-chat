"use client";

import { useChat } from "ai/react";
import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Sidebar } from "@/components/sidebar/sidebar";
import { TextViewer } from "@/components/viewer/text-viewer";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useViewer } from "@/hooks/use-viewer";

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

// Demo content
const DEMO_CONTENT = `これはデモ用のテキストです。

実際のアプリケーションでは、青空文庫のAPIやChromaDBから取得したテキストがここに表示されます。

チャットで質問すると、関連する箇所がハイライトされて表示されます。`;

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const { tabs, activeTabId, setActiveTabId, openTab, closeTab } = useViewer();
  const [recentWorks, setRecentWorks] = useState<Work[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string>();
  const [citations] = useState<Map<string, Citation>>(new Map());

  const handleWorkSelect = useCallback((work: Work) => {
    setSelectedWorkId(work.id);

    // Add to recent
    setRecentWorks(prev => {
      const filtered = prev.filter(w => w.id !== work.id);
      return [work, ...filtered].slice(0, 5);
    });

    // Open in viewer
    openTab({
      workId: work.id,
      title: work.title,
      author: work.author,
      content: DEMO_CONTENT,
    });
  }, [openTab]);

  const handleCitationClick = useCallback((citation: Citation) => {
    if (citation.type === "aozora" && citation.workId) {
      openTab({
        workId: citation.workId,
        title: citation.title,
        author: citation.author || "",
        content: citation.text,
      });
    }
  }, [openTab]);

  const handleOpenAozora = useCallback((workId: string) => {
    window.open(`https://www.aozora.gr.jp/cards/${workId}/`, "_blank");
  }, []);

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
        />
      }
      chat={
        <ChatPanel
          messages={messages}
          input={input}
          isLoading={isLoading}
          citations={citations}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCitationClick={handleCitationClick}
        />
      }
    />
  );
}
