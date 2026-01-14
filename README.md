# 青空文庫 RAG 検索システム

青空文庫の膨大なアーカイブを、自然言語で直感的に検索できるRAG（Retrieval-Augmented Generation）システムです。
単なるキーワード検索ではなく、文脈を理解した検索と、信頼できる出典の明示により、深い文学探索体験を提供します。

## ✨ 主な機能

### 1. 文脈理解による自然言語検索
「夏目漱石の作品で、猫が登場するシーンは？」「友情について書かれた短編を探して」といった曖昧な質問に対し、AIが意図を理解してアーカイブを横断検索します。

### 2. 明確な出典と根拠の提示
生成AIの回答には必ず **[出典: 作品名]** が付与されます。
リンクをクリックすると、サイドパネルに**実際のテキスト（原文）**が表示され、該当箇所がハイライトされます。「AIの作り話」ではなく「実際の記述」を確認できます。

### 3. Web情報のハイブリッド活用
青空文庫にない情報（作者の背景、現代的な解釈など）が必要な場合は、自動的にWeb検索を行い、**[Web参考]** として補足情報を提示します。
あくまで「原作」を主役とし、Web情報は脇役として扱う設計です。

---

## 🛠 技術スタック

| レイヤー | 技術 | 用途 |
| --- | --- | --- |
| **Frontend** | Next.js 15 + Vercel AI SDK | モダンなチャットUI、ストリーミング応答 |
| **Backend** | FastAPI (Python 3.11+) | 検索ロジックのオーケストレーション |
| **Vector DB** | ChromaDB | ローカルでの高速なベクトル検索 |
| **Search** | Exa API | LLM向けの高精度Web検索 |
| **LLM** | Gemini 3.0 Flash | 高速かつロングコンテキスト対応 |
| **Embedding** | OpenAI text-embedding-3 | 日本語に強い埋め込みモデル |
| **Package Manager** | bun (Frontend) / uv (Backend) | 高速な依存関係管理 |

---

## 🚀 セットアップ

### 前提条件

- **Python 3.11+**
- **Node.js 20+** または **Bun**
- **Git**
- **Docker** (Docker Composeでのデプロイ時)

### APIキーの取得

以下のAPIキーが必要です：

| サービス | 用途 | 取得先 |
| --- | --- | --- |
| Google Gemini | LLM（チャット応答） | https://aistudio.google.com/apikey |
| OpenAI | Embedding（ベクトル化） | https://platform.openai.com/api-keys |
| Exa (任意) | Web検索 | https://exa.ai |

---

## 📦 ローカル開発

### 1. リポジトリのクローン

```bash
git clone https://github.com/r1cA18/aozora-rag-chat.git
cd aozora-rag-chat
```

### 2. 環境変数の設定

```bash
# ルート（Docker Compose用）
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local

# Scripts（データ取り込み用）
cp scripts/.env.example scripts/.env
```

各ファイルを編集してAPIキーを設定：

```bash
# .env (Docker Compose用)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
EXA_API_KEY=your_exa_api_key  # 任意

# backend/.env
EXA_API_KEY=your_exa_api_key  # 任意

# frontend/.env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# scripts/.env
OPENAI_API_KEY=your_openai_api_key
```

### 3. 青空文庫データの準備

```bash
cd scripts

# 青空文庫リポジトリをクローン（約5分）
./fetch_aozora_repo.sh

# Python環境のセットアップ
uv sync

# データのインジェスト（ベクトル化）
uv run python ingest_pipeline.py

cd ..
```

> **Note:** デフォルトでは50作品のみ処理します。`scripts/.env` の `MAX_WORKS` で変更可能。

### 4. バックエンドの起動

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

→ http://localhost:8000/docs でAPIドキュメント確認

### 5. フロントエンドの起動

別ターミナルで：

```bash
cd frontend
bun install
bun run dev
```

→ http://localhost:3000 でアプリにアクセス

---

## 🐳 Docker Compose でのデプロイ

Docker Composeを使うと、Cloudflare Tunnel経由で外部公開できます。

### 1. 環境変数の設定

```bash
cp .env.example .env
# .env を編集してAPIキーを設定
```

### 2. データの準備

ローカル開発と同様に、事前にデータのインジェストが必要です：

```bash
cd scripts
./fetch_aozora_repo.sh
uv sync && uv run python ingest_pipeline.py
cd ..
```

### 3. 起動

```bash
docker compose up --build
```

起動後、ログに表示されるCloudflare TunnelのURL（`https://xxxx.trycloudflare.com`）でアクセスできます。

### サービス構成

| サービス | ポート | 説明 |
| --- | --- | --- |
| backend | 8000 | FastAPI サーバー |
| frontend | 3000 | Next.js アプリ |
| tunnel | - | Cloudflare Tunnel（自動的に公開URL生成） |

---

## 📂 ディレクトリ構成

```
aozora-rag-chat/
├── frontend/          # Next.js アプリケーション
│   ├── src/
│   │   ├── app/       # App Router
│   │   ├── components/# UIコンポーネント
│   │   ├── hooks/     # カスタムフック
│   │   └── lib/       # ユーティリティ、型定義
│   └── Dockerfile
├── backend/           # FastAPI サーバー
│   ├── app/
│   │   ├── routes/    # APIエンドポイント
│   │   ├── services/  # ビジネスロジック
│   │   ├── schemas/   # Pydanticスキーマ
│   │   └── utils/     # ユーティリティ
│   └── Dockerfile
├── scripts/           # データ取得・加工・登録パイプライン
│   ├── aozora/        # 青空文庫テキスト処理
│   └── ingest_pipeline.py
├── data/              # 青空文庫データ
│   └── aozora_repo/   # クローンされたリポジトリ
├── chroma/            # ChromaDB データ
├── docs/              # ドキュメント
└── docker-compose.yml
```

---

## 🔧 開発コマンド

### Frontend

```bash
cd frontend
bun run dev      # 開発サーバー起動
bun run build    # プロダクションビルド
bun run lint     # ESLint実行
```

### Backend

```bash
cd backend
uv run uvicorn app.main:app --reload  # 開発サーバー起動
uv run python -c "from app.main import app"  # インポート確認
```

### Docker

```bash
docker compose up --build     # ビルド＆起動
docker compose up -d          # バックグラウンド起動
docker compose logs -f        # ログ表示
docker compose down           # 停止
```

---

## 📝 ライセンス

MIT License

---

## 🙏 謝辞

- [青空文庫](https://www.aozora.gr.jp/) - 著作権フリーの日本文学アーカイブ
- [Anthropic Claude](https://claude.ai/) - 開発支援
