"use client";

import { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppLayoutProps {
  sidebar: ReactNode;
  viewer: ReactNode;
  chat: ReactNode;
}

export function AppLayout({ sidebar, viewer, chat }: AppLayoutProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-screen overflow-hidden bg-background flex">
        {/* Left Sidebar */}
        <div className="w-64 flex-none border-r bg-muted/30 overflow-hidden">
          {sidebar}
        </div>

        {/* Center Viewer */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {viewer}
        </div>

        {/* Right Chat */}
        <div className="w-96 flex-none border-l bg-muted/10 overflow-hidden">
          {chat}
        </div>
      </div>
    </TooltipProvider>
  );
}
