"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { Message, Citation } from "@/lib/types";
import { parseCitations, findCitation } from "@/lib/citation-parser";
import { CitationLink, InlineCitationBadge } from "./citation-hover-card";

interface MessageBubbleProps {
  message: Message;
  citations: Map<string, Citation>;
  onCitationClick?: (citation: Citation) => void;
}

export function MessageBubble({
  message,
  citations,
  onCitationClick,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
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
                p: ({ children }) => {
                  // Process paragraph content to detect citations
                  const textContent =
                    typeof children === "string"
                      ? children
                      : Array.isArray(children)
                        ? children.map((c) => (typeof c === "string" ? c : "")).join("")
                        : "";

                  if (
                    textContent.includes("[出典:") ||
                    textContent.includes("[Web参考:")
                  ) {
                    const parts = parseCitations(textContent);
                    return (
                      <p>
                        {parts.map((part, i) => {
                          if (typeof part === "string") {
                            return <span key={i}>{part}</span>;
                          }
                          const citation = findCitation(
                            citations,
                            part.title,
                            part.author
                          );
                          return (
                            <InlineCitationBadge
                              key={i}
                              title={part.title}
                              author={part.author}
                              isWeb={part.isWeb}
                              citation={citation}
                              onCitationClick={onCitationClick}
                            />
                          );
                        })}
                      </p>
                    );
                  }
                  return <p>{children}</p>;
                },
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
