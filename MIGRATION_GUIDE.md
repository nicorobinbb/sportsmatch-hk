# SportsMatch Supabase Migration Guide

## 已準備嘅 Files（我幫你 create 咗）

✅ `lib/db/src/index.ts` - 改用 postgres-js (Supabase 兼容)
✅ `lib/db/package.json` - 更新 dependency
✅ `artifacts/api-server/src/middlewares/supabaseAuthMiddleware.ts` - 新 auth middleware
✅ `artifacts/api-server/src/app-supabase.ts` - 新 backend app (改用 Supabase)
✅ `artifacts/coach-marketplace/src/App-supabase.tsx` - 新 frontend app
✅ `artifacts/coach-marketplace/src/pages/sign-in.tsx` - 新登入頁
✅ `artifacts/coach-marketplace/src/pages/sign-up.tsx` - 新註冊頁

---

## 你要做嘅步驟

### Step 1: 開 Supabase Project

1. 去 https://supabase.com 開新 project
2. **Project name**: `sportsmatch-hk`
3. **Region**: `Singapore (Southeast Asia)`
4. 記低個 **Database password**
5. 去 Project Settings → Database → 抄 **Connection string** (Transaction mode: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

### Step 2: 設定 Environment Variables

**Backend** (`artifacts/api-server/.env`):
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[服務角色密鑰]
PORT=3000
```

**Frontend** (`artifacts/coach-marketplace/.env`):
```
VITE_SUPABASE_URL=https://[REF].supabase.co
VITE_SUPABASE_ANON_KEY=[公開密鑰]
```

### Step 3: 安裝 Dependencies

喺 project root 打：
```bash
# 安裝新 dependencies
cd lib/db && pnpm add postgres
cd ../../artifacts/api-server && pnpm add @supabase/supabase-js
cd ../coach-marketplace && pnpm add @supabase/supabase-js

# 刪除舊 Clerk dependencies
# (手動改 package.json 刪除 @clerk/*)
```

### Step 4: 更新 Backend Routes

將所有 `import { getAuth } from "@clerk/express"` 改成：
```typescript
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
```

要改嘅 files：
- `artifacts/api-server/src/routes/photos.ts`
- `artifacts/api-server/src/routes/reports.ts`
- `artifacts/api-server/src/routes/admin.ts`
- `artifacts/api-server/src/routes/userPreferences.ts`
- `artifacts/api-server/src/routes/wishlists.ts`
- `artifacts/api-server/src/routes/coachPosts.ts`
- `artifacts/api-server/src/routes/userProfile.ts`
- `artifacts/api-server/src/routes/reviews.ts`

**特別處理**：`userProfile.ts` 有用 `clerkClient`，要改成 Supabase Admin API。

### Step 5: 更新 Frontend

1. 將 `App.tsx` backup 咗，然後 copy `App-supabase.tsx` → `App.tsx`
2. 更新所有用 `useAuth()`, `useUser()` 嘅 components，改用新嘅 `useAuth()` hook
3. 更新所有用 `@clerk/react` 嘅 imports

### Step 6: Push Database Schema

```bash
cd lib/db
pnpm run push
```

### Step 7: Setup Google OAuth

喺 Supabase Dashboard → Authentication → Providers → Google：
1. 開啟 Google provider
2. 輸入 Google Client ID 同 Secret（要去 Google Cloud Console 攞）
3. Callback URL: `https://[REF].supabase.co/auth/v1/callback`

### Step 8: 測試本地

```bash
# Backend
cd artifacts/api-server
pnpm run dev

# Frontend (新 terminal)
cd artifacts/coach-marketplace
pnpm run dev
```

### Step 9: Deploy

**Backend**: 可以用 Vercel / Railway / Render
**Frontend**: Vercel

```bash
# 例子：Deploy 去 Vercel
cd artifacts/coach-marketplace
vercel
```

---

## 常見問題

**Q: 用戶 ID 格式唔同？**
A: Clerk 用 `user_xxxxx`，Supabase 用 UUID `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`。要改 database 入面嘅 user_id 欄位類型，或者將舊 user ID map 去新格式。

**Q: 點處理已登入用戶？**
A: 佢哋要重新登入，因為 auth token 唔同。建議出個公告話「系統升級，請重新登入」。

**Q: Admin 用戶點算？**
A: 新嘅 admin check 喺 `supabaseAuthMiddleware.ts` 度做，你可以喺 database 加個 `is_admin` column，或者 hardcode admin user IDs。

---

## 支援

有問題随时搵我！我可以幫手：
- 改晒剩低嘅 routes
- 整 deploy script
- 處理任何 error