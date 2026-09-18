#!/usr/bin/env bash
# Builds a clean zip for Chrome Web Store upload, containing only the
# runtime files the extension actually needs (no tests/, node_modules/,
# package.json, git metadata, etc).
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT_DIR="dist"
OUT_FILE="$OUT_DIR/ai-slop-detector-v${VERSION}.zip"

mkdir -p "$OUT_DIR"
rm -f "$OUT_FILE"

zip -r "$OUT_FILE" \
  manifest.json \
  background.js \
  content/ \
  lib/ \
  popup/ \
  icons/ \
  -x "icons/generate_icons.py" \
  -x "*.DS_Store"

echo "Wrote $OUT_FILE"
