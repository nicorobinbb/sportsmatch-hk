# 運對 — Sports Coach Marketplace

## Overview

Hong Kong's most transparent sports coach review and search platform (運對). Built with React + Vite, Express.js, and PostgreSQL. Coaches list services with transparent pricing, students browse with personalised recommendations, and an admin manages approvals.

**Slogan**: 香港最透明、最值得信賴的運動教練審核與搜尋平台

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

## Brand

- **Primary colour**: Yellow `hsl(60 100% 50%)` with dark foreground `hsl(222 47% 11%)`
- **Admin users**: `user_3CL2v3QfZ8oeJFcMSutb6qClVmH`, `user_3CL6ohwA5xBIDSQak8xNNYNhaEh` (via `ADMIN_USER_IDS` env var)

## Features

- **Homepage**: Searchable coach directory, sport category filters, coach type filter (專業運動員 / 持牌教練), personalized feed, featured coaches
- **Coach Profile**: Bio, transparent pricing table (pricingPlans JSON), photo gallery, star reviews, wishlist (heart) button, report modal
- **Onboarding**: Multi-step wizard (sports → goals → availability → district) saved to userProfiles
- **Dashboard**: Saved coaches (wishlist), personalised recommendations, my coach profiles with edit requests
- **Admin Dashboard**: Pending coaches/reviews/photos, analytics (sports + district breakdown, user CRM, top wishlisted), reports management
- **Support Widget**: Floating customer support bubble in bottom-right on all pages
- **Coach Registration**: Full multi-field form with cover photo, profile photo, qualifications, transparent pricing rows

## Database Schema

- `coaches` — full coach profile with `pricing_plans` JSON, `cover_photo_url`, `qualifications`, `youtube_url`, `pending_edits`, `is_rejected`
- `reviews` — coach_id, user_id, rating, comment, is_approved
- `photos` — coach_id, image_url, is_approved
- `user_category_clicks` — userId, category, click_count (personalized feed)
- `user_profiles` — userId, displayName, goals[], availability[], preferredDistricts[], preferredSports[], onboardingCompleted
- `wishlists` — userId, coachId (unique constraint)
- `reports` — userId, coachId, reason, description, status, adminNote

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Route Structure (API)

- `GET /api/coaches` — list approved coaches (sort: featured first, limit=40)
- `POST /api/coaches` — create new coach (auth required)
- `GET /api/coaches/me` — my coach profiles (auth required) — **must be before /:id**
- `GET /api/coaches/stats/summary` — marketplace stats — **must be before /:id**
- `GET /api/coaches/:id` — coach detail with reviews + photos + pricingPlans + qualifications
- `PATCH /api/coaches/:id/edit-request` — submit coach edit (goes to pendingEdits for admin review)
- `GET /api/coaches/:id/reviews` — coach reviews
- `GET /api/coaches/:id/photos` — coach photos
- `POST /api/coaches/:id/photos` — upload photo
- `POST /api/reviews` — submit review
- `GET /api/categories` — sport categories with counts
- `GET /api/featured` — featured coaches
- `GET /api/user/preferences` — personalized category data
- `POST /api/user/preferences` — track category click
- `GET /api/user/profile` — get user profile
- `PUT /api/user/profile` — upsert user profile (onboarding data)
- `GET /api/wishlist` — get saved coaches
- `POST /api/wishlist/:coachId` — save coach
- `DELETE /api/wishlist/:coachId` — unsave coach
- `GET /api/wishlist/check/:coachId` — check if saved
- `POST /api/reports` — submit report
- `GET /api/reports/admin` — list all reports (admin)
- `PATCH /api/reports/admin/:id` — update report status (admin)
- `GET /api/admin/coaches/pending` — pending coach approvals
- `POST /api/admin/coaches/:id/approve` — approve coach
- `POST /api/admin/coaches/:id/reject` — reject coach
- `GET /api/admin/analytics` — platform analytics
- `GET /api/admin/users` — user CRM (admin)
- Same approve/reject pattern for `/admin/reviews/` and `/admin/photos/`

## Important Implementation Notes

- **Clerk auth pattern**: `setAuthTokenGetter(() => getToken())` AND `setTokenGetter(() => getToken())` — both wired in App.tsx
- **DB user_ids**: Seeded coaches use `seed_u1`–`seed_u50` (NOT `seed_user_1`) + `seed_athletics_1-3`
- **Qualifications**: `QualEntry = {id: string, text: string, proofUrl: string}`; submitted as JSON
- **Pricing rows**: stored as `pricingPlans` JSON; each row: `{sessionType, price, maxStudents, duration}`; `trialPrice`=min, `regularPrice`=max for backwards compat
- **Coach type filter**: `stagedCoachTypes` (UI state) + `appliedCoachTypes` (query state) — applied on search submit only
- **isRejected**: pending query uses `AND isApproved=false AND isRejected=false`
- **Route ordering**: `/api/coaches/me` and `/api/coaches/stats/summary` must come BEFORE `/:id`
- **Body limit**: `express.json({ limit: "10mb" })` in `app.ts`
- **OnboardingRedirect**: skips `/onboarding`, `/sign-in`, `/sign-up`, `/coach/register`, `/admin`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
