import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "青空文庫 RAG 検索",
  description: "青空文庫アーカイブを自然言語で探索",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
