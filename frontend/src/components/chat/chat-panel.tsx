"use client";

import { useRef, useEffect } from "react";
import { Send, BookOpen, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
}

interface Citation {
  type: "aozora" | "web";
  title: string;
  author?: string;
  text: string;
  workId?: string;
  url?: string;
}

interface ChatPanelProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  citations?: Map<string, Citation>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCitationClick?: (citation: Citation) => void;
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  citations = new Map(),
  onInputChange,
  onSubmit,
  onCitationClick,
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

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={onInputChange}
            placeholder="質問を入力..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  citations: Map<string, Citation>;
  onCitationClick?: (citation: Citation) => void;
}

function MessageBubble({ message, citations, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <CitationLink
                    href={href}
                    citations={citations}
                    onCitationClick={onCitationClick}
                  >
                    {children}
                  </CitationLink>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

interface CitationLinkProps {
  href?: string;
  children: React.ReactNode;
  citations: Map<string, Citation>;
  onCitationClick?: (citation: Citation) => void;
}

function CitationLink({ href, children, citations, onCitationClick }: CitationLinkProps) {
  const isAozora = href?.startsWith("aozora://");
  const citationKey = isAozora ? href?.replace("aozora://", "") : href;
  const citation = citationKey ? citations.get(citationKey) : undefined;

  // If we have citation data, show hover preview
  if (citation) {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            onClick={() => onCitationClick?.(citation)}
            className={cn(
              "inline-flex items-center gap-1 text-blue-600 dark:text-blue-400",
              "hover:underline cursor-pointer font-medium"
            )}
          >
            {citation.type === "aozora" ? (
              <BookOpen className="h-3 w-3" />
            ) : (
              <Globe className="h-3 w-3" />
            )}
            {children}
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{citation.title}</p>
                {citation.author && (
                  <p className="text-xs text-muted-foreground">{citation.author}</p>
                )}
              </div>
              <Badge variant={citation.type === "aozora" ? "default" : "secondary"} className="text-[10px]">
                {citation.type === "aozora" ? "青空文庫" : "Web"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
              {citation.text}
            </p>
            <p className="text-[10px] text-primary">
              クリックして詳細を表示 →
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Fallback for external links
  if (href && !isAozora) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
      >
        <Globe className="h-3 w-3" />
        {children}
      </a>
    );
  }

  // Aozora link without citation data
  return (
    <button
      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
    >
      <BookOpen className="h-3 w-3" />
      {children}
    </button>
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
