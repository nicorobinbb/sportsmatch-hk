#!/bin/bash

# Script to update coach social media using curl to the backend API
# This requires the backend to be running on localhost:3000

BASE_URL="http://localhost:3000"

# Check if backend is running
if ! curl -s "$BASE_URL/api/coaches" > /dev/null 2>&1; then
  echo "❌ Backend is not running on localhost:3000"
  echo "Please start the backend first:"
  echo "  cd artifacts/api-server && export \$(cat .env | xargs) && node --enable-source-maps ./dist/index.mjs"
  exit 1
fi

echo "🔄 Backend is running, proceeding with updates..."
echo ""

# Social media combinations (cycling through them)
declare -a FB_URLS=(
  "https://facebook.com/coach.swimming.hk"
  ""
  ""
  "https://facebook.com/basketballcoachhk"
  "https://facebook.com/tenniscoach.hk"
  ""
  "https://facebook.com/golfacademy.hk"
  ""
  "https://facebook.com/dancestudio.hk"
  ""
  ""
  "https://facebook.com/tabletennishk"
  "https://facebook.com/taekwondohk"
  "https://facebook.com/gymnasticshk"
  ""
  "https://facebook.com/volleyballhk"
  ""
  "https://facebook.com/danceacademy.hk"
  "https://facebook.com/fitnesshk"
  ""
)

declare -a IG_URLS=(
  ""
  "https://instagram.com/yoga_with_maggie"
  ""
  "https://instagram.com/hkbasketballcoach"
  ""
  "https://instagram.com/pilateslife.hk"
  "https://instagram.com/golfpro.hk"
  ""
  ""
  "https://instagram.com/swimcoach.david"
  ""
  "https://instagram.com/ttcoach.hk"
  "https://instagram.com/tkdmaster.hk"
  ""
  "https://instagram.com/fencingcoach.hk"
  "https://instagram.com/vbcoach.hk"
  ""
  "https://instagram.com/dancepro.hk"
  ""
  "https://instagram.com/badmintoncoach"
)

declare -a WEB_URLS=(
  ""
  ""
  "https://coachchan.com"
  ""
  "https://tenniscoachhk.com"
  "https://pilateshk.com"
  "https://golfacademy.hk"
  ""
  ""
  ""
  "https://boxinggym.com"
  ""
  "https://tkdacademy.hk"
  ""
  "https://fencingpro.com"
  ""
  "https://runnersclub.hk"
  "https://dancestudio.hk"
  "https://personaltrainer.hk"
  ""
)

# Get all coaches and update them
coach_ids=$(curl -s "$BASE_URL/api/coaches" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -z "$coach_ids" ]; then
  echo "❌ Could not fetch coaches from API"
  exit 1
fi

echo "Found coaches: $coach_ids"
echo ""

# Note: Since we don't have an admin API to bulk update coaches,
# we'll provide instructions instead

cat << 'EOF'

⚠️  Note: Since there's no admin API endpoint for bulk updating coach social media,
    here's what you can do:

Option 1: Manual update via database
  - Go to Supabase Dashboard: https://supabase.com/dashboard/project/vosbykmmrfcyrdrkvinx
  - Navigate to Table Editor → coaches
  - Manually add social media URLs to each coach

Option 2: Run a SQL script via Supabase SQL Editor
  - Go to Supabase Dashboard → SQL Editor
  - Run the following SQL:

EOF

echo ""
echo "-- Copy and paste this SQL into Supabase SQL Editor:"
echo ""
echo "UPDATE coaches SET facebook_url = 'https://facebook.com/coach.swimming.hk' WHERE id = 1;"
echo "UPDATE coaches SET instagram_url = 'https://instagram.com/yoga_with_maggie' WHERE id = 2;"
echo "UPDATE coaches SET website_url = 'https://coachchan.com' WHERE id = 3;"
echo "UPDATE coaches SET facebook_url = 'https://facebook.com/basketballcoachhk', instagram_url = 'https://instagram.com/hkbasketballcoach' WHERE id = 4;"
echo "... and so on"
echo ""
