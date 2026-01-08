"use client";

import { useChat } from "ai/react";
import { useState } from "react";
import { Search, Send, BookOpen, Globe, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SidePanelContent {
  title: string;
  author: string;
  text: string;
}

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const [sidePanel, setSidePanel] = useState<SidePanelContent | null>(null);

  const handleCitationClick = (title: string, author: string, text: string) => {
    setSidePanel({ title, author, text });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidePanel ? "w-2/3" : "w-full"}`}>
        {/* Header */}
        <header className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">青空文庫 RAG 検索</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            青空文庫アーカイブを自然言語で探索
          </p>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-medium text-muted-foreground">
                質問を入力してください
              </h2>
              <p className="text-sm text-muted-foreground/70 mt-2 max-w-md">
                例：「夏目漱石の作品で猫が登場するものは？」
                「芥川龍之介の短編小説について教えて」
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "user" ? (
                  <p>{message.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        // Style citation links
                        a: ({ href, children }) => {
                          if (href?.startsWith("aozora://")) {
                            return (
                              <button
                                onClick={() =>
                                  handleCitationClick(
                                    String(children),
                                    "",
                                    "..."
                                  )
                                }
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <BookOpen className="h-3 w-3" />
                                {children}
                              </button>
                            );
                          }
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse flex gap-1">
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
                  <span className="text-sm text-muted-foreground">検索中...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="青空文庫について質問してください..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              送信
            </button>
          </form>
        </div>
      </div>

      {/* Side Panel */}
      {sidePanel && (
        <div className="w-1/3 border-l bg-muted/30 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="font-medium">{sidePanel.title}</h3>
              {sidePanel.author && (
                <p className="text-sm text-muted-foreground">{sidePanel.author}</p>
              )}
            </div>
            <button
              onClick={() => setSidePanel(null)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {sidePanel.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
