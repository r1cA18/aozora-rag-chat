"use client";

import { BookOpen, Globe } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/types";

interface CitationHoverContentProps {
  citation: Citation;
}

export function CitationHoverContent({ citation }: CitationHoverContentProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-sm">{citation.title}</p>
          {citation.author && (
            <p className="text-xs text-muted-foreground">{citation.author}</p>
          )}
        </div>
        <Badge
          variant={citation.type === "aozora" ? "default" : "secondary"}
          className="text-[10px]"
        >
          {citation.type === "aozora" ? "青空文庫" : "Web"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
        {citation.text}
      </p>
      <p className="text-[10px] text-primary">クリックして詳細を表示 →</p>
    </div>
  );
}

interface CitationLinkProps {
  href?: string;
  children: React.ReactNode;
  citations: Map<string, Citation>;
  onCitationClick?: (citation: Citation) => void;
}

export function CitationLink({
  href,
  children,
  citations,
  onCitationClick,
}: CitationLinkProps) {
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
          <CitationHoverContent citation={citation} />
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
    <button className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
      <BookOpen className="h-3 w-3" />
      {children}
    </button>
  );
}

interface InlineCitationBadgeProps {
  title: string;
  author?: string;
  isWeb: boolean;
  citation?: Citation;
  onCitationClick?: (citation: Citation) => void;
}

export function InlineCitationBadge({
  title,
  author,
  isWeb,
  citation,
  onCitationClick,
}: InlineCitationBadgeProps) {
  const displayText = author ? `${title} - ${author}` : title;

  if (citation) {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            onClick={() => onCitationClick?.(citation)}
            className={cn(
              "inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-full text-xs",
              "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
              "hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors cursor-pointer"
            )}
          >
            {isWeb ? <Globe className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
            <span className="max-w-[150px] truncate">{title}</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80">
          <CitationHoverContent citation={citation} />
        </HoverCardContent>
      </HoverCard>
    );
  }

  // No citation data - just show badge without hover
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-full text-xs",
        "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
      )}
    >
      {isWeb ? <Globe className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
      <span className="max-w-[150px] truncate">{displayText}</span>
    </span>
  );
}
