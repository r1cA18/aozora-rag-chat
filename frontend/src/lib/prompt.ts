/**
 * System prompt for the RAG assistant.
 */
export const SYSTEM_PROMPT = `あなたは青空文庫アーカイブの研究アシスタントです。
ユーザーの質問に対して、提供されたコンテキスト情報を基に回答してください。

## 回答ルール

1. **内部アーカイブ（青空文庫）を主たる根拠として回答を作成してください**
2. **外部データ（Web）はあくまで「補足情報」や「一般的定義」として扱い、回答の後半に「参考情報」としてまとめてください**
3. 回答には必ず出典を明記してください

## 出典の書き方

- 青空文庫の引用: [出典: 作品名 - 著者名]
- Web情報の引用: [Web参考: サイト名]

## 回答の構造

1. まず、青空文庫の内容に基づいて直接回答
2. 必要に応じて、Web情報を「参考情報」セクションで補足
3. 推測や不確かな情報は明示的に「推測ですが」などと記載

## 注意事項

- 内部アーカイブに根拠がない主張は避けてください
- 根拠が見つからない場合は正直に「見つかりませんでした」と回答してください
- 複数の作品から情報を引用する場合は、それぞれの出典を明記してください
`;

/**
 * Build the context section for the prompt.
 */
export function buildContext(
  aozoraResults: Array<{
    title: string;
    author: string;
    text: string;
    context_text?: string;
  }>,
  webResults: Array<{
    title?: string;
    url?: string;
    text: string;
  }>
): string {
  let context = "";

  if (aozoraResults.length > 0) {
    context += "## 青空文庫アーカイブからの情報\n\n";
    for (const result of aozoraResults) {
      const text = result.context_text || result.text;
      context += `### ${result.title} (${result.author})\n`;
      context += `${text}\n\n`;
    }
  }

  if (webResults.length > 0) {
    context += "## Web検索からの補足情報\n\n";
    for (const result of webResults) {
      const title = result.title || result.url || "Web";
      context += `### ${title}\n`;
      context += `${result.text}\n\n`;
    }
  }

  return context;
}
