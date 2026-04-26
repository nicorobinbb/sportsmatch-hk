# SportsMatch Clean Stack

This repo now defaults to the clean rebuilt stack:

- API: `artifacts/clean-api` (`http://localhost:3001`)
- Web: `artifacts/clean-web` (`http://localhost:5176`)

## Run

From repo root:

```bash
./start.sh
```

Open `http://localhost:5176`.

## Stop

```bash
./stop.sh
```

## Legacy fallback

Legacy stack scripts are preserved:

```bash
./start-legacy.sh
./stop-legacy.sh
```

Legacy ports:

- API: `3000`
- Frontend: `5173`

## Clean stack notes

- Admin routes require Supabase sign-in and admin user ID in `ADMIN_USER_IDS`.
- Clean web supports:
  - public coach listing
  - admin status check
  - coach/review/photo/report moderation
  - coach detail editing via `/admin/coaches/:id`
