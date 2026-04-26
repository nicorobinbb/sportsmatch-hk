#!/bin/bash
set +e

echo "Stopping clean API + clean web..."

if [ -f /tmp/clean-api.pid ]; then
  kill "$(cat /tmp/clean-api.pid)" 2>/dev/null
  rm -f /tmp/clean-api.pid
fi

if [ -f /tmp/clean-web.pid ]; then
  kill "$(cat /tmp/clean-web.pid)" 2>/dev/null
  rm -f /tmp/clean-web.pid
fi

lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5176 | xargs kill -9 2>/dev/null

echo "Done."
