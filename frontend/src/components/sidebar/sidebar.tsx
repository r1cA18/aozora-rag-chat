"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Search, Clock, Library, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchWorks, type WorkItem } from "@/lib/api";
import type { Work } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";

interface SidebarProps {
  recentWorks?: Work[];
  onWorkSelect?: (work: Work) => void;
  selectedWorkId?: string;
}

export function Sidebar({ recentWorks = [], onWorkSelect, selectedWorkId }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [works, setWorks] = useState<Work[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch works from backend (with search)
  useEffect(() => {
    async function loadWorks() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchWorks(200, 0, debouncedQuery || undefined);
        setWorks(
          response.works.map((w: WorkItem) => ({
            id: w.work_id,
            title: w.title,
            author: w.author,
          }))
        );
        setTotalCount(response.total);
      } catch (err) {
        console.error("Failed to load works:", err);
        setError("作品の読み込みに失敗しました");
        setWorks([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorks();
  }, [debouncedQuery]);

  const filteredWorks = works;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Library className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-sm">青空文庫</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="作品・著者を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm bg-background"
          />
        </div>
      </div>

      <Separator />

      {/* Recent Works */}
      {recentWorks.length > 0 && (
        <>
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>最近開いた作品</span>
            </div>
          </div>
          <ScrollArea className="flex-none max-h-32">
            <div className="px-2 space-y-0.5">
              {recentWorks.slice(0, 3).map((work) => (
                <WorkItemButton
                  key={work.id}
                  work={work}
                  isSelected={work.id === selectedWorkId}
                  onClick={() => onWorkSelect?.(work)}
                  compact
                />
              ))}
            </div>
          </ScrollArea>
          <Separator />
        </>
      )}

      {/* Works List */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          <span>作品一覧</span>
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
            {isLoading ? "..." : `${filteredWorks.length}/${totalCount}`}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="px-2 py-4 text-center text-sm text-destructive">{error}</div>
          ) : filteredWorks.length === 0 ? (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              作品が見つかりません
            </div>
          ) : (
            filteredWorks.map((work) => (
              <WorkItemButton
                key={work.id}
                work={work}
                isSelected={work.id === selectedWorkId}
                onClick={() => onWorkSelect?.(work)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface WorkItemButtonProps {
  work: Work;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

function WorkItemButton({ work, isSelected, onClick, compact }: WorkItemButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors group",
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        compact && "py-1.5"
      )}
    >
      <BookOpen
        className={cn(
          "h-4 w-4 flex-none text-muted-foreground",
          isSelected && "text-primary"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className={cn("font-medium truncate", compact ? "text-xs" : "text-sm")}>
          {work.title}
        </div>
        {!compact && (
          <div className="text-xs text-muted-foreground truncate">{work.author}</div>
        )}
      </div>
      <ChevronRight
        className={cn(
          "h-4 w-4 flex-none opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground"
        )}
      />
    </button>
  );
}
