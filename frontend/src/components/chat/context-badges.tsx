"use client";

import { X, BookOpen, TextSelect } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ContextItem } from "@/hooks/use-chat-context";

interface ContextBadgesProps {
  items: ContextItem[];
  onRemove: (id: string) => void;
}

export function ContextBadges({ items, onRemove }: ContextBadgesProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border-b bg-muted/30">
      {items.map((item) => (
        <ContextBadge key={item.id} item={item} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ContextBadgeProps {
  item: ContextItem;
  onRemove: (id: string) => void;
}

function ContextBadge({ item, onRemove }: ContextBadgeProps) {
  const Icon = item.type === "tab" ? BookOpen : TextSelect;
  const truncatedContent =
    item.content.length > 30
      ? item.content.slice(0, 30) + "..."
      : item.content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="secondary"
          className={cn(
            "pl-2 pr-1 py-1 gap-1.5 max-w-[200px] cursor-default",
            "hover:bg-secondary"
          )}
        >
          <Icon className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          <span className="truncate text-xs">
            {item.type === "tab" ? item.title : `"${truncatedContent}"`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[300px]">
        <div className="space-y-1">
          <p className="font-medium text-sm">{item.title}</p>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
          )}
          <p className="text-xs whitespace-pre-wrap line-clamp-4">
            {item.content}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
