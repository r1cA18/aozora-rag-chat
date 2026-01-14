"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, BookOpen, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ViewerTab {
  id: string;
  workId: string;
  title: string;
  author: string;
  content: string;
  highlightRange?: { start: number; end: number };
}

interface TextViewerProps {
  tabs: ViewerTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onOpenAozora?: (workId: string) => void;
  onSelectionChange?: (workId: string, title: string, selectedText: string | null) => void;
}

export function TextViewer({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onOpenAozora,
  onSelectionChange,
}: TextViewerProps) {
  const [fontSize, setFontSize] = useState(16);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Handle text selection - auto add/remove from context
  const handleMouseUp = useCallback(() => {
    if (!activeTab) return;

    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      onSelectionChange?.(activeTab.workId, activeTab.title, sel.toString().trim());
    } else {
      onSelectionChange?.(activeTab.workId, activeTab.title, null);
    }
  }, [activeTab, onSelectionChange]);

  // Clear selection context when clicking outside content area
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".prose") && activeTab) {
        const sel = window.getSelection();
        if (!sel || sel.toString().trim().length === 0) {
          onSelectionChange?.(activeTab.workId, activeTab.title, null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTab, onSelectionChange]);

  // Scroll to highlight when it changes
  useEffect(() => {
    if (activeTab?.highlightRange && contentRef.current) {
      const highlight = contentRef.current.querySelector(".text-highlight");
      if (highlight) {
        highlight.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeTab?.highlightRange, activeTabId]);

  if (tabs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <BookOpen className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">作品を選択してください</p>
        <p className="text-sm mt-2">
          左のサイドバーから作品を選ぶか、チャットで質問してください
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-center border-b bg-muted/30 px-2">
        <Tabs
          value={activeTabId}
          onValueChange={onTabChange}
          className="flex-1 overflow-hidden"
        >
          <TabsList className="h-10 bg-transparent p-0 gap-0.5">
            {tabs.map((tab) => (
              <div key={tab.id} className="relative group">
                <TabsTrigger
                  value={tab.id}
                  className={cn(
                    "h-9 rounded-t-md rounded-b-none px-3 pr-8",
                    "data-[state=active]:bg-background data-[state=active]:shadow-none",
                    "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground",
                    "border border-b-0 border-transparent",
                    "data-[state=active]:border-border",
                    "max-w-[180px]"
                  )}
                >
                  <span className="truncate text-xs">{tab.title}</span>
                </TabsTrigger>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose?.(tab.id);
                  }}
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 z-10",
                    "p-0.5 rounded hover:bg-muted",
                    "opacity-0 group-hover:opacity-100 transition-opacity"
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </TabsList>
        </Tabs>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>文字を小さく</TooltipContent>
          </Tooltip>

          <span className="text-xs text-muted-foreground w-8 text-center">
            {fontSize}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setFontSize((s) => Math.min(24, s + 2))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>文字を大きく</TooltipContent>
          </Tooltip>

          {activeTab && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onOpenAozora?.(activeTab.workId)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>青空文庫で開く</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab && (
        <ScrollArea className="flex-1">
          <div className="p-8 max-w-3xl mx-auto" onMouseUp={handleMouseUp}>
            {/* Header */}
            <div className="mb-8 pb-6 border-b">
              <h1 className="text-2xl font-bold mb-2">{activeTab.title}</h1>
              <p className="text-muted-foreground">{activeTab.author}</p>
            </div>

            {/* Text Content */}
            <div
              ref={contentRef}
              className="prose prose-slate dark:prose-invert max-w-none"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
            >
              <TextContent
                content={activeTab.content}
                highlightRange={activeTab.highlightRange}
              />
            </div>
          </div>
        </ScrollArea>
      )}

    </div>
  );
}

interface TextContentProps {
  content: string;
  highlightRange?: { start: number; end: number };
}

function TextContent({ content, highlightRange }: TextContentProps) {
  if (!highlightRange) {
    return (
      <div className="whitespace-pre-wrap">
        {content}
      </div>
    );
  }

  const { start, end } = highlightRange;
  const before = content.slice(0, start);
  const highlighted = content.slice(start, end);
  const after = content.slice(end);

  return (
    <div className="whitespace-pre-wrap">
      {before}
      <mark className="text-highlight bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded">
        {highlighted}
      </mark>
      {after}
    </div>
  );
}
