#!/bin/bash
# Fetch Aozora Bunko repository (shallow clone for demo)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/../data"
REPO_DIR="${DATA_DIR}/aozora_repo"

echo "=== Aozora Bunko Repository Fetch ==="

# Create data directory if needed
mkdir -p "${DATA_DIR}"

if [ -d "${REPO_DIR}" ]; then
    echo "Repository already exists at ${REPO_DIR}"
    echo "To refresh, delete the directory and run again."
    exit 0
fi

echo "Cloning Aozora Bunko repository (shallow clone)..."
echo "This may take a few minutes..."

git clone --depth 1 https://github.com/aozorabunko/aozorabunko.git "${REPO_DIR}"

echo ""
echo "=== Clone complete ==="
echo "Repository cloned to: ${REPO_DIR}"
echo ""
echo "Next steps:"
echo "  1. cd scripts"
echo "  2. python ingest_pipeline.py"
