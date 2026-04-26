#!/bin/bash

cd "$(dirname "$0")"

echo "🚀 Starting SportsMatch Legacy Servers..."
echo ""

# Clear ports that may have been occupied by clean/dev variants
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
lsof -ti:5175 | xargs kill -9 2>/dev/null
lsof -ti:5176 | xargs kill -9 2>/dev/null
lsof -ti:5177 | xargs kill -9 2>/dev/null
lsof -ti:5178 | xargs kill -9 2>/dev/null

# Check if already running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Legacy backend already running on port 3000"
else
    echo "📦 Starting Legacy Backend..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    cd artifacts/api-server
    export DATABASE_URL="postgresql://postgres.vosbykmmrfcyrdrkvinx:Felixisagenius!@db.vosbykmmrfcyrdrkvinx.supabase.co:5432/postgres?sslmode=require"
    export SUPABASE_URL="https://vosbykmmrfcyrdrkvinx.supabase.co"
    export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2J5a21tcmZjeXJkcmt2aW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQyMjQ3NiwiZXhwIjoyMDkxOTk4NDc2fQ.TG-M_vjLz4Xb13b1sIWU_mIYqy9E9tILZSfIBJ8wg7Q"
    export PORT=3000
    export ADMIN_USER_IDS="b45a40dc-6042-4be4-bc44-7f5ff2aba1e7"
    npm run dev &
    echo $! > /tmp/sportsmatch-backend.pid
    cd ../..
    echo "✅ Legacy backend started on http://localhost:3000"
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo "⚠️  Legacy frontend already running on port 5173"
else
    echo ""
    echo "📦 Starting Legacy Frontend..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    cd artifacts/coach-marketplace
    export PORT=5173
    export BASE_PATH="/"
    export VITE_SUPABASE_URL="https://vosbykmmrfcyrdrkvinx.supabase.co"
    export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2J5a21tcmZjeXJkcmt2aW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjI0NzYsImV4cCI6MjA5MTk5ODQ3Nn0.YcVY4b7OlwvLJV3_JvmnZ6xbrnTa8cC96SOrm_4laBw"
    npm run dev &
    echo $! > /tmp/sportsmatch-frontend.pid
    cd ../..
    echo "✅ Legacy frontend started on http://localhost:5173"
fi

echo ""
echo "🌐 Open http://localhost:5173 in your browser"
echo ""
echo "To stop legacy: ./stop-legacy.sh"
