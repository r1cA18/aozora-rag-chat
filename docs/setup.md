# セットアップガイド

## 必要環境

- **Python 3.11+**
- **Node.js 20+**
- **Git**
- (推奨) **Nix** (環境構築を自動化したい場合)

---

## 0. 環境構築

### Nix を使う場合（推奨）

`nix-shell` を使うと、必要なバージョンのPythonとNode.jsが自動で揃います。

```bash
# プロジェクトルートで
nix-shell
```

これ以降の手順は `nix-shell` 内で実行してください。

---

## 1. 環境変数の設定

各ディレクトリにある `.env.example` をコピーして API キーを設定します。

```bash
# Backend (Web検索用)
cp backend/.env.example backend/.env
# EXA_API_KEY=...

# Frontend (LLM用)
cp frontend/.env.example frontend/.env.local
# GOOGLE_GENERATIVE_AI_API_KEY=...

# Scripts (埋め込み用)
cp scripts/.env.example scripts/.env
# OPENAI_API_KEY=...
```

---

## 2. Python環境の準備

backend と scripts それぞれで仮想環境（venv）を作成します。

### Scripts (データ処理用)

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### Backend (APIサーバー用)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install .  # または pip install -e . (開発モード)
deactivate
cd ..
```

---

## 3. データの準備（青空文庫）

### リポジトリの取得

青空文庫のGitリポジトリをクローンします（数分かかります）。

```bash
cd scripts
./fetch_aozora_repo.sh
```

### データのインジェスト（ベクトル化）

テキストをクリーニングし、ベクトル化してDBに保存します。

```bash
source .venv/bin/activate
python ingest_pipeline.py
```

※ デフォルトでは50作品のみ処理します（`.env` の `MAX_WORKS` で変更可能）。

---

## 4. サーバーの起動

### バックエンド (FastAPI)

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```
→ http://localhost:8000/docs でAPIドキュメントが見れます。

### フロントエンド (Next.js)

別のターミナルを開いて実行します。

```bash
cd frontend
npm install
npm run dev
```
→ http://localhost:3000 にアクセスしてチャット開始。
