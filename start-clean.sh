#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$ROOT_DIR/artifacts/clean-api"
WEB_DIR="$ROOT_DIR/artifacts/clean-web"

echo "Starting clean API + clean web..."

if lsof -ti:3001 >/dev/null 2>&1; then
  echo "Port 3001 already in use, skipping API start."
else
  (cd "$API_DIR" && npm run dev >/tmp/clean-api.log 2>&1 & echo $! > /tmp/clean-api.pid)
  echo "Clean API starting on http://localhost:3001"
fi

if lsof -ti:5176 >/dev/null 2>&1; then
  echo "Port 5176 already in use, skipping clean-web start."
else
  (cd "$WEB_DIR" && npm run dev -- --port 5176 >/tmp/clean-web.log 2>&1 & echo $! > /tmp/clean-web.pid)
  echo "Clean web starting on http://localhost:5176"
fi

echo ""
echo "Open http://localhost:5176"
echo "Logs:"
echo "  /tmp/clean-api.log"
echo "  /tmp/clean-web.log"
