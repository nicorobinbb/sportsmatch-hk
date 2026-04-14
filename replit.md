# Sports Coach Marketplace (CoachMatch HK)

## Overview

A full-stack Sports Coach Marketplace (similar to Carousell) built with React + Vite, Express.js, and PostgreSQL. Coaches can list their services, students can browse and book, and an admin can manage approvals.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + Tailwind CSS (artifact: `coach-marketplace` at `/`)
- **Backend**: Express 5 (artifact: `api-server` at `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (`@clerk/react` v6, `@clerk/express` v2)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

- **Homepage**: Searchable coach directory, sport category filters, personalized feed based on clicks, featured coaches at top, marketplace stats
- **Coach Profile**: Bio, transparent pricing (trial + regular), photo gallery, star reviews, submit review
- **Coach Onboarding**: Multi-field registration form with "明碼實價" transparent pricing section
- **Admin Dashboard**: Tabs to approve/reject coaches, reviews, and photos
- **Auth**: Clerk login/signup with `/sign-in` and `/sign-up` routes
- **Boost Feature**: Stripe placeholder for featured listing (pay to boost)

## Database Schema

- `coaches` — name, sports_category, location, bio, trial_price, regular_price, package_details, age_groups[], experience_level, is_featured, is_approved, profile_image_url, user_id
- `reviews` — coach_id, user_id, user_name, rating, comment, is_approved
- `photos` — coach_id, image_url, is_approved
- `user_category_clicks` — userId, category, click_count (for personalized feed)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Route Structure (API)

- `GET /api/coaches` — list approved coaches (sort: featured first)
- `POST /api/coaches` — create new coach (auth required)
- `GET /api/coaches/:id` — coach detail with reviews + photos
- `POST /api/coaches/:id/boost` — Stripe boost placeholder
- `GET /api/coaches/:id/reviews` — coach reviews
- `GET /api/coaches/:id/photos` — coach photos
- `POST /api/coaches/:id/photos` — upload photo
- `POST /api/reviews` — submit review
- `GET /api/categories` — sport categories with counts
- `GET /api/featured` — featured coaches
- `GET /api/coaches/stats/summary` — marketplace stats
- `GET /api/user/preferences` — personalized category data
- `POST /api/user/preferences` — track category click
- `GET /api/admin/coaches/pending` — pending coach approvals
- `POST /api/admin/coaches/:id/approve` — approve coach
- `POST /api/admin/coaches/:id/reject` — reject coach
- Same pattern for `/admin/reviews/` and `/admin/photos/`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
