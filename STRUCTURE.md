# Project Structure (Post-Cutover)

## Primary stack (active)

- `artifacts/clean-web` - active frontend app (Vite + React)
- `artifacts/clean-api` - active backend API (Express + Supabase + Postgres)
- `start.sh` / `stop.sh` - default run/stop scripts for clean stack
- `README-CLEAN.md` - clean stack runbook

## Legacy stack (fallback only)

- `artifacts/coach-marketplace` - legacy frontend
- `artifacts/api-server` - legacy backend
- `start-legacy.sh` / `stop-legacy.sh` - fallback scripts

## Shared libraries

- `lib/db` - database schema and DB utilities
- `lib/api-zod` - shared API schemas/types
- `lib/api-client-react` - generated/client-facing API hooks/utilities

## Notes

- New feature/UI work should target the clean stack under `artifacts/clean-*`.
- Legacy stack stays available for reference and rollback.
