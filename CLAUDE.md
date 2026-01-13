# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

青空文庫 RAG チャット - 青空文庫（日本の著作権切れ文学作品のデジタルアーカイブ）を対象としたRAG（Retrieval-Augmented Generation）検索システム。ユーザーは自然言語で質問し、関連する文学作品の抜粋と共にLLMが回答を生成する。

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   ChromaDB      │
│   (Next.js)     │     │   (FastAPI)     │     │   (Vector DB)   │
│   + Gemini API  │     │                 │────▶│   Exa API       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Frontend**: Next.js 15 + React 19。AI SDK (`ai/react`) でストリーミングチャット。Gemini 3.0 Flash でLLM応答生成
- **Backend**: FastAPI。ChromaDB（内部検索）とExa API（Web検索）を並列実行
- **Scripts**: 青空文庫リポジトリからテキストを取得し、クリーニング・チャンキング後にOpenAI Embeddingsで埋め込み、ChromaDBに保存

### Key Data Flow

1. ユーザーがフロントエンドで質問を送信
2. `frontend/src/app/api/chat/route.ts` がバックエンドの `/api/search` を呼び出し
3. バックエンドは `search_orchestrator.py` で ChromaDB と Exa を並列検索
4. 検索結果を `prompt.ts` の `buildContext()` でコンテキスト化し、Gemini に送信
5. ストリーミングで回答を返却

## Commands

### Backend (Python)

```bash
cd backend

# Install dependencies
pip install -e ".[dev]"

# Run development server
python -m app.main
# or
uvicorn app.main:app --reload --port 8000

# Lint
ruff check .
ruff format .

# Run tests
pytest
```

### Frontend (Node.js)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev    # http://localhost:3000

# Build
npm run build

# Lint
npm run lint
```

### Data Ingestion

```bash
cd scripts

# Install dependencies
pip install -r requirements.txt

# Run ingestion pipeline (requires OPENAI_API_KEY)
python ingest_pipeline.py
```

## Environment Variables

### Backend (.env)
- `EXA_API_KEY`: Exa API key for web search
- `CHROMA_PERSIST_DIR`: ChromaDB storage path (default: `../chroma`)
- `CHROMA_COLLECTION`: Collection name (default: `aozora_chunks_v1`)

### Frontend (.env.local)
- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini API key
- `BACKEND_SEARCH_URL`: Backend URL (default: `http://localhost:8000/api/search`)

### Scripts (.env)
- `OPENAI_API_KEY`: For embeddings generation
- `AOZORA_REPO_PATH`: Path to cloned aozora-bunko repository
- `MAX_WORKS`: Limit works for testing (default: 50)

## Key Implementation Details

### Chunking Strategy (scripts/aozora/chunking.py)
- Search chunks: ~400 tokens with 50 token overlap
- Context chunks: ~2000 tokens for LLM context
- 日本語文の区切り（。！？」』）で分割

### Search Orchestrator (backend/app/services/search_orchestrator.py)
- ChromaDB と Exa を `asyncio.gather()` で並列実行
- タイムアウト管理（デフォルト8秒）
- エラーは個別にハンドリングし、部分結果を返却

### Prompt Design (frontend/src/lib/prompt.ts)
- 青空文庫を主たる根拠として優先
- Web情報は補足として後半に配置
- 出典明記ルールを明示
