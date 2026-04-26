#!/bin/bash

echo "🛑 Stopping SportsMatch Legacy Servers..."

if [ -f /tmp/sportsmatch-backend.pid ]; then
    kill "$(cat /tmp/sportsmatch-backend.pid)" 2>/dev/null && echo "✅ Legacy backend stopped"
    rm /tmp/sportsmatch-backend.pid
fi

if [ -f /tmp/sportsmatch-frontend.pid ]; then
    kill "$(cat /tmp/sportsmatch-frontend.pid)" 2>/dev/null && echo "✅ Legacy frontend stopped"
    rm /tmp/sportsmatch-frontend.pid
fi

# Fallback: kill by port
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "✅ Legacy servers stopped"
