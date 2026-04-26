#!/bin/bash
cd "$(dirname "$0")/artifacts/coach-marketplace"
pkill -f "vite" 2>/dev/null
sleep 1
PORT=5173 BASE_PATH=/ npm run dev
