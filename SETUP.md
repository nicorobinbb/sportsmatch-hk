# SportsMatch Supabase Migration - 完成！✅

## 我做咗嘅嘢

### 1. ✅ 環境變數 (.env files)
- `artifacts/api-server/.env` - Backend 用
- `artifacts/coach-marketplace/.env` - Frontend 用

### 2. ✅ Database Layer
- 改咗 `lib/db/src/index.ts` - 改用 postgres-js (Supabase 兼容)
- 改咗 `lib/db/package.json` - 換 dependency
- 改咗 `lib/db/drizzle.config.ts` - 加 SSL 支援

### 3. ✅ Backend Auth
- 新 `supabaseAuthMiddleware.ts` - 取代 Clerk middleware
- 新 `app.ts` - 改用 Supabase auth
- 更新晒所有 routes:
  - `coaches.ts` ✅
  - `photos.ts` ✅
  - `reports.ts` ✅
  - `admin.ts` ✅
  - `userPreferences.ts` ✅
  - `wishlists.ts` ✅
  - `coachPosts.ts` ✅
  - `userProfile.ts` ✅ (改用 Supabase Admin API)
  - `reviews.ts` ✅

### 4. ✅ Frontend Auth
- 新 `App.tsx` - 改用 Supabase auth
- 新 `sign-in.tsx` - Supabase 登入頁
- 新 `sign-up.tsx` - Supabase 註冊頁
- 改 `package.json` - 加 @supabase/supabase-js，移除 @clerk/react

### 5. ✅ Package Dependencies
- Backend: 加 @supabase/supabase-js，移除 @clerk/express, http-proxy-middleware
- Frontend: 加 @supabase/supabase-js，移除 @clerk/react
- DB: 加 postgres，移除 pg

---

## 你而家要做嘅嘢

### Step 1: 安裝 Dependencies

喺 project root 打：

```bash
cd /Users/openclawhost/Desktop/sportsmatch_extracted/hksportsmatch

# 安裝 dependencies
pnpm install
```

### Step 2: Push Database Schema

```bash
cd lib/db
pnpm run push
```

如果見到錯誤，可能係 connection string 問題。檢查 `.env` 入面嘅 `DATABASE_URL`。

### Step 3: 設定 Google OAuth

1. 去 Supabase Dashboard → Authentication → Providers
2. 開啟 **Google**
3. 去 Google Cloud Console 攞 OAuth credentials:
   - https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Authorized redirect URI: `https://vosbykmmrfcyrdrkvinx.supabase.co/auth/v1/callback`
4. 將 Client ID 同 Secret 填入 Supabase

### Step 4: 開 RLS (Row Level Security)

喺 Supabase Dashboard → Table Editor → 每個 table：

1. 開 **Enable RLS**
2. 加呢個 policy (俾 service_role 完整存取):

```sql
-- 對 coaches table (其他 tables 重複)
CREATE POLICY "Allow service_role full access" ON coaches
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**或者更簡單**：喺 Dashboard 開 "Enable RLS" 後，選 "Enable read access for all users" 暫時用住，之後再 lock down。

### Step 5: 測試本地

開兩個 terminal：

**Terminal 1 (Backend):**
```bash
cd artifacts/api-server
pnpm run dev
```

**Terminal 2 (Frontend):**
```bash
cd artifacts/coach-marketplace
pnpm run dev
```

### Step 6: Deploy

**Backend** (建議用 Railway 或 Render):
```bash
# 例如 Railway
railway login
railway init
railway up
```

**Frontend** (Vercel):
```bash
cd artifacts/coach-marketplace
vercel
```

---

## ⚠️ 重要事項

### Admin Users
而家用緊 `.env` 入面嘅 `ADMIN_USER_IDS`。格式係逗號分隔：
```
ADMIN_USER_IDS=user_id_1,user_id_2
```

**點攞 Supabase user ID？**
- 用戶登入後，喺 frontend 開 console 打 `supabase.auth.getUser()`
- 或者去 Supabase Dashboard → Authentication → Users

### User ID 格式轉換
- **Clerk**: `user_xxxxx` (例如 `user_3CL2v3QfZ8oeJFcMSutb6qClVmH`)
- **Supabase**: UUID (例如 `550e8400-e29b-41d4-a716-446655440000`)

你舊嘅 database 如果有 `user_xxx` 格式嘅 seed data，可能需要更新或刪除重新 seed。

### 舊用戶資料
用戶要重新登入（因為 auth token 唔同）。建議出個公告話「系統升級，請重新登入」。

---

## 🔧  troubleshooting

### 問題: "Cannot find module '@supabase/supabase-js'"
**解決**: 喺 project root 打 `pnpm install`

### 問題: "DATABASE_URL must be set"
**解決**: 確保 `artifacts/api-server/.env` 入面有 `DATABASE_URL`

### 問題: "SSL connection error"
**解決**: Supabase 需要 SSL。檢查 `lib/db/src/index.ts` 入面有冇 `{ ssl: true }`，或者用 `postgres` library 嘅 `prepare: false` 選項（已設定）。

### 問題: "Invalid API key"
**解決**: 檢查 frontend `.env` 入面嘅 `VITE_SUPABASE_ANON_KEY` 係咪正確

---

## 📁 Files 結構

```
hksportsmatch/
├── lib/
│   └── db/
│       ├── src/
│       │   └── index.ts          ✅ (改用 postgres-js)
│       ├── drizzle.config.ts     ✅ (加 SSL)
│       └── package.json          ✅ (加 postgres)
├── artifacts/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── app.ts            ✅ (新 Supabase 版)
│   │   │   ├── app-original.ts   (舊 Clerk 版 backup)
│   │   │   ├── middlewares/
│   │   │   │   └── supabaseAuthMiddleware.ts  ✅ (新)
│   │   │   └── routes/
│   │   │       ├── *.ts          ✅ (全部更新)
│   │   ├── .env                  ✅ (已設定)
│   │   └── package.json          ✅ (加 @supabase/supabase-js)
│   └── coach-marketplace/
│       ├── src/
│       │   ├── App.tsx           ✅ (新 Supabase 版)
│       │   ├── App-original.tsx  (舊 Clerk 版 backup)
│       │   ├── App-supabase.tsx  (新 backup)
│       │   └── pages/
│       │       ├── sign-in.tsx   ✅ (新)
│       │       └── sign-up.tsx   ✅ (新)
│       ├── .env                  ✅ (已設定)
│       └── package.json          ✅ (加 @supabase/supabase-js)
└── MIGRATION_GUIDE.md            (舊 guide)
└── SETUP.md                      ✅ (呢個 file)
```

---

有問題随时搵我！🚀