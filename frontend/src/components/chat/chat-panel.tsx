"use client";

import { useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ContextBadges } from "./context-badges";
import { MessageBubble } from "./message-bubble";
import type { ContextItem } from "@/hooks/use-chat-context";
import type { Message, Citation } from "@/lib/types";

interface ChatPanelProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  citations?: Map<string, Citation>;
  contextItems?: ContextItem[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCitationClick?: (citation: Citation) => void;
  onRemoveContext?: (id: string) => void;
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  citations = new Map(),
  contextItems = [],
  onInputChange,
  onSubmit,
  onCitationClick,
  onRemoveContext,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">AIアシスタント</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="text-sm">質問を入力してください</p>
              <p className="text-xs mt-2 max-w-[200px] mx-auto">
                例：「夏目漱石の作品で猫が登場するものは？」
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              citations={citations}
              onCitationClick={onCitationClick}
            />
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="bg-muted rounded-lg px-4 py-3">
                <LoadingDots />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input with Context */}
      <div className="border-t bg-background">
        <ContextBadges items={contextItems} onRemove={onRemoveContext || (() => {})} />
        <div className="p-4">
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={onInputChange}
              placeholder={
                contextItems.length > 0
                  ? "コンテキストを参照して質問..."
                  : "質問を入力..."
              }
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
      <span
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      />
      <span
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      />
    </div>
  );
}
