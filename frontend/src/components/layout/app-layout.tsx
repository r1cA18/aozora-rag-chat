"use client";

import { ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  sidebar: ReactNode;
  viewer: ReactNode;
  chat: ReactNode;
}

export function AppLayout({ sidebar, viewer, chat }: AppLayoutProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-screen overflow-hidden bg-background">
        <Group orientation="horizontal" className="h-full">
          {/* Left Sidebar */}
          <Panel
            id="sidebar"
            defaultSize="15%"
            minSize="10%"
            maxSize="25%"
            className="bg-muted/30"
          >
            <div className="h-full overflow-hidden">{sidebar}</div>
          </Panel>

          <ResizeHandle />

          {/* Center Viewer */}
          <Panel
            id="viewer"
            defaultSize="55%"
            minSize="30%"
          >
            <div className="h-full overflow-hidden">{viewer}</div>
          </Panel>

          <ResizeHandle />

          {/* Right Chat */}
          <Panel
            id="chat"
            defaultSize="30%"
            minSize="20%"
            maxSize="45%"
            className="bg-muted/10"
          >
            <div className="h-full overflow-hidden">{chat}</div>
          </Panel>
        </Group>
      </div>
    </TooltipProvider>
  );
}

function ResizeHandle({ className }: { className?: string }) {
  return (
    <Separator
      className={cn(
        "w-1 bg-border hover:bg-primary/50 transition-colors",
        "data-[active]:bg-primary",
        className
      )}
    />
  );
}
