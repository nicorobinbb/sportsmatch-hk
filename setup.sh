#!/bin/bash

echo "🚀 SportsMatch Supabase Migration Setup"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "pnpm-workspace.yaml" ]; then
    echo "❌ Error: Please run this script from the project root (where pnpm-workspace.yaml is)"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
pnpm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

echo "🗄️  Step 2: Pushing database schema..."
cd lib/db
pnpm run push
if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema"
    echo "💡 Make sure your DATABASE_URL is correct in artifacts/api-server/.env"
    exit 1
fi
echo "✅ Database schema pushed"
echo ""

cd ../..

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up Google OAuth in Supabase Dashboard"
echo "2. Enable RLS policies in Supabase Dashboard"
echo "3. Run the servers:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd artifacts/api-server && pnpm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd artifacts/coach-marketplace && pnpm run dev"
echo ""
echo "📖 See SETUP.md for detailed instructions"