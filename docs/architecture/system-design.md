# 📐 Capy's Money — System Design Document

> **Version**: 1.0 | **Date**: 2026-05-18 | **Author**: Tran Tuan Anh  
> **Stack**: React Native (Expo) + Supabase | **Target**: 10,000 users | **Solo dev**  
> **Source concepts**: [[system-design-mint]], [[caching-strategies]], [[asynchronism-patterns]], [[application-layer-design]], [[cap-theorem]]

---

## 1. Requirements Summary

| Dimension | Phase 1 (MVP) | Phase 2+ |
|-----------|--------------|----------|
| **Users** | 0 → 10,000 | 10,000+ |
| **Platform** | Mobile (React Native) | Mobile + Web |
| **Entry mode** | Manual input | Manual + Bank Sync |
| **Currency** | VND only | Multi-currency |
| **Monetization** | Free | Freemium + Premium |
| **AI features** | ❌ | ✅ Auto-categorize, insights |
| **Export** | ❌ | ✅ CSV/PDF |
| **Report latency** | 1–3 min delay OK | Near real-time |
| **Offline** | ✅ Required | ✅ |
| **Notifications** | ✅ Push (budget alerts) | ✅ |
| **Infra budget** | Supabase Free Tier | Supabase Pro+ |

---

## 2. Architecture Overview

### 2.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React Native / Expo)              │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Local SQLite │  │ Sync Engine  │  │ Push Token Store │   │
│  │ (offline DB) │◄►│ (WatermelonDB│  │ (Expo Push)      │   │
│  └─────────────┘  │  or MMKV)    │  └──────────────────┘   │
│                   └──────┬───────┘                          │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS (REST + Realtime channel)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (BaaS Layer)                     │
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐  │
│  │  Auth     │  │ PostgREST │  │  Storage  │  │Realtime│  │
│  │ (JWT/OTP) │  │ (Auto API)│  │(avatars,  │  │(future)│  │
│  └───────────┘  └─────┬─────┘  │ receipts) │  └────────┘  │
│                       │        └───────────┘               │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │              PostgreSQL (Primary DB)                   │ │
│  │   RLS Policies ─ Row-level multi-tenant isolation      │ │
│  │   pg_cron ─ Scheduled report aggregation jobs          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Supabase Edge Functions (Deno)          │   │
│  │  • budget-checker  • notification-sender             │   │
│  │  • report-aggregator (cron trigger)                  │   │
│  │  • [Phase 2] bank-sync-worker                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Expo Push Service     │
              │  (FCM / APNs bridge)   │
              └────────────────────────┘
```

### 2.2 Kiến trúc lựa chọn: **Lean BaaS Monolith**

> **Lý do**: Solo dev + Free tier + 10k users = Supabase hoàn toàn đủ.  
> Microservices chỉ cần khi có team ≥ 5 engineers hoặc > 500k MAU.  
> *(Ref: [[application-layer-design]] — "Don't start microservices, start decoupled")*

**Nguyên tắc thiết kế:**
- **Stateless API**: PostgREST auto-generated từ schema → không cần viết controller
- **Security tại DB layer**: Mọi business rule security = RLS Policies, không chỉ ở app layer
- **Async cho heavy jobs**: Budget check, notification gửi → Edge Function (không block client)
- **Offline-first**: Client giữ SQLite local → sync queue khi có mạng

---

## 3. Database Schema Design

### 3.1 Core Tables

```sql
-- ═══════════════════════════════════════════════
-- USERS & AUTH (managed by Supabase Auth)
-- ═══════════════════════════════════════════════
-- auth.users (built-in — do NOT modify directly)

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  tier         TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  locale       TEXT NOT NULL DEFAULT 'vi',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- WALLETS (cá nhân + ví chung)
-- ═══════════════════════════════════════════════
CREATE TABLE public.wallets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('personal', 'shared')),
  currency     TEXT NOT NULL DEFAULT 'VND',
  icon         TEXT,
  color        TEXT,
  initial_balance BIGINT NOT NULL DEFAULT 0, -- stored in smallest unit (đồng)
  is_default   BOOLEAN DEFAULT FALSE,
  created_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Members của ví chung
CREATE TABLE public.wallet_members (
  wallet_id  UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (wallet_id, user_id)
);

-- ═══════════════════════════════════════════════
-- CATEGORIES
-- ═══════════════════════════════════════════════
CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id), -- NULL = system category
  name       TEXT NOT NULL,
  icon       TEXT,
  color      TEXT,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  is_system  BOOLEAN DEFAULT FALSE,
  parent_id  UUID REFERENCES public.categories(id) -- sub-categories
);

-- ═══════════════════════════════════════════════
-- TRANSACTIONS (core data — high write volume)
-- ═══════════════════════════════════════════════
CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES public.wallets(id),
  category_id     UUID REFERENCES public.categories(id),
  amount          BIGINT NOT NULL,              -- positive value, direction from type
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  note            TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- user-set date/time
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  is_deleted      BOOLEAN DEFAULT FALSE,        -- soft delete for sync safety
  client_id       UUID UNIQUE,                  -- idempotency key from offline sync
  -- [Phase 2] bank sync fields
  external_id     TEXT,
  source          TEXT DEFAULT 'manual'
);

-- Index for common queries
CREATE INDEX idx_transactions_wallet_date ON public.transactions(wallet_id, occurred_at DESC);
CREATE INDEX idx_transactions_user_date ON public.transactions(created_by, occurred_at DESC);

-- ═══════════════════════════════════════════════
-- BUDGETS
-- ═══════════════════════════════════════════════
CREATE TABLE public.budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id    UUID NOT NULL REFERENCES public.wallets(id),
  category_id  UUID REFERENCES public.categories(id),
  amount_limit BIGINT NOT NULL,
  period       TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  start_date   DATE NOT NULL,
  end_date     DATE,
  is_recurring BOOLEAN DEFAULT TRUE,
  created_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- REPORT SNAPSHOTS (pre-aggregated — 1-3 min delay)
-- ═══════════════════════════════════════════════
CREATE TABLE public.report_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id    UUID NOT NULL REFERENCES public.wallets(id),
  period_type  TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly')),
  period_key   TEXT NOT NULL,  -- '2026-05' or '2026-05-18'
  total_income BIGINT DEFAULT 0,
  total_expense BIGINT DEFAULT 0,
  net          BIGINT GENERATED ALWAYS AS (total_income - total_expense) STORED,
  breakdown    JSONB,           -- { category_id: amount, ... }
  computed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, period_type, period_key)
);

-- ═══════════════════════════════════════════════
-- SYNC QUEUE (offline-first support)
-- ═══════════════════════════════════════════════
CREATE TABLE public.sync_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id),
  operation    TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name   TEXT NOT NULL,
  payload      JSONB NOT NULL,
  client_ts    TIMESTAMPTZ NOT NULL,  -- timestamp from device
  synced_at    TIMESTAMPTZ,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'conflict', 'failed')),
  retry_count  INT DEFAULT 0
);

-- ═══════════════════════════════════════════════
-- INVITATIONS (ví chung)
-- ═══════════════════════════════════════════════
CREATE TABLE public.wallet_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   UUID NOT NULL REFERENCES public.wallets(id),
  invited_by  UUID NOT NULL REFERENCES public.profiles(id),
  invited_email TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  role        TEXT NOT NULL DEFAULT 'editor',
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- NOTIFICATIONS LOG
-- ═══════════════════════════════════════════════
CREATE TABLE public.notification_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id),
  type       TEXT NOT NULL, -- 'budget_alert', 'wallet_invite', 'monthly_summary'
  title      TEXT,
  body       TEXT,
  data       JSONB,
  sent_at    TIMESTAMPTZ DEFAULT NOW(),
  read_at    TIMESTAMPTZ
);
```

### 3.2 Multi-Tenancy: RLS Policies

```sql
-- Chiến lược: mọi row đều bị giới hạn bởi user context
-- RLS là "phòng thủ cuối cùng" — an toàn ngay cả khi app code bug

-- Wallets: user chỉ thấy ví mình sở hữu HOẶC là thành viên
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_access" ON public.wallets
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.wallet_members
      WHERE wallet_id = wallets.id AND user_id = auth.uid()
    )
  );

-- Transactions: chỉ thấy transaction trong ví mình có quyền
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaction_access" ON public.transactions
  USING (
    wallet_id IN (
      SELECT id FROM public.wallets
      WHERE created_by = auth.uid()
      UNION
      SELECT wallet_id FROM public.wallet_members WHERE user_id = auth.uid()
    )
  );

-- [Tương tự cho budgets, report_snapshots, categories]
```

---

## 4. Offline-First Strategy

> **Vấn đề**: User nhập giao dịch khi không có mạng → phải sync sau mà không mất data.

### 4.1 Architecture: Local-First với Sync Queue

```
[User nhập giao dịch]
        │
        ▼
[SQLite local (WatermelonDB)]  ← Ghi ngay lập tức (UI responsive)
        │
        │ Background sync khi có network
        ▼
[Supabase sync_queue table]
        │
        ▼ Edge Function: sync-resolver
[Kiểm tra client_id (idempotency key)]
        │
   ┌────┴────┐
  Mới      Trùng
   │          │
   ▼          ▼
 INSERT    IGNORE (idempotent)
```

### 4.2 Conflict Resolution Rules

| Tình huống | Quy tắc | Ví dụ |
|-----------|---------|-------|
| Cùng `client_id` | Server wins (idempotent insert) | Offline gửi 2 lần → chỉ insert 1 |
| Ví chung: 2 người edit cùng | **Last-write-wins** trên `updated_at` | Device A update lúc T1, Device B lúc T2 > T1 → B thắng |
| Soft delete + edit | Delete wins | Ai xóa trước → record bị xóa |
| Transaction xóa offline | Mark `is_deleted = TRUE` | Không DELETE cứng để đồng bộ được |

### 4.3 Recommended Library

```
WatermelonDB (React Native)
  ├── Schema mirrors Supabase tables
  ├── Auto-generates sync queue entries
  └── Pull/Push sync protocol built-in
```

---

## 5. Report Aggregation Pipeline (1–3 min delay)

> *Dựa trên [[asynchronism-patterns]]: "Use it for anything that doesn't need to be completed in Human Real-time"*

```
[Transaction INSERT/UPDATE/DELETE]
        │
        ▼
[Postgres Trigger → pg_notify('tx_changed', wallet_id)]
        │
        ▼
[Supabase pg_cron — chạy mỗi 1 phút]
        │
        ▼
[Edge Function: report-aggregator]
  SELECT SUM(amount) GROUP BY category_id, period
        │
        ▼
[UPSERT into report_snapshots]
        │
        ▼
[Budget Checker: so sánh total_expense vs budgets.amount_limit]
        │
   Vượt ngưỡng?
        │ YES
        ▼
[notification-sender Edge Function]
        │
        ▼
[Expo Push → FCM/APNs]
```

### pg_cron setup (trong Supabase SQL Editor)
```sql
-- Chạy mỗi 1 phút
SELECT cron.schedule(
  'aggregate-reports',
  '* * * * *',
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/report-aggregator',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  )$$
);
```

---

## 6. Shared Wallet & Invitation Flow

```
[Owner: Mời email]
        │
        ▼
[INSERT wallet_invitations (token, 7-day TTL)]
        │
        ▼
[Edge Function: send-invitation-email]
  Gửi email chứa deep link: capymoney://invite?token=<token>
        │
        ▼
[Người được mời: mở app → click link]
        │
        ▼
[Edge Function: accept-invitation]
  1. Validate token (chưa expire, status=pending)
  2. INSERT wallet_members (wallet_id, user_id, role)
  3. UPDATE invitation status = 'accepted'
  4. Notify owner: "X đã tham gia ví"
```

**Permission Matrix (Ví chung)**:

| Hành động | Owner | Editor | Viewer |
|-----------|-------|--------|--------|
| Xem giao dịch | ✅ | ✅ | ✅ |
| Thêm giao dịch | ✅ | ✅ | ❌ |
| Sửa/xóa của mình | ✅ | ✅ | ❌ |
| Sửa/xóa của người khác | ✅ | ❌ | ❌ |
| Mời thành viên | ✅ | ❌ | ❌ |
| Xóa ví | ✅ | ❌ | ❌ |
| Đặt budget | ✅ | ✅ | ❌ |

---

## 7. Notification Architecture

```
Trigger sources:
  ├── Budget alert  → Edge Function (chạy sau report-aggregator)
  ├── Wallet invite → Edge Function (on invitation create)
  ├── Monthly summary → pg_cron (ngày 1 hàng tháng 8:00 AM)
  └── [Phase 2] Bank sync done → async worker callback

Flow:
  Edge Function
      │
      ▼
  Expo Push API (https://exp.host/--/api/v2/push/send)
      │ Batched (max 100/request)
      ▼
  FCM (Android) / APNs (iOS)
      │
      ▼
  INSERT notification_log (tracking)
```

**Expo Push Token storage**: lưu trong `profiles.push_token` (update mỗi lần app mở).

---

## 8. Freemium Feature Gating

| Feature | Free | Premium |
|---------|------|---------|
| Số ví cá nhân | 2 | Unlimited |
| Số ví chung | 1 | Unlimited |
| Thành viên/ví chung | 3 | 10 |
| Lịch sử giao dịch | 3 tháng | Unlimited |
| Export CSV/PDF | ❌ | ✅ |
| Bank sync | ❌ | ✅ |
| AI categorization | ❌ | ✅ |
| Budget alerts | 3 budgets | Unlimited |
| Widgets | ❌ | ✅ |

**Implementation**: `profiles.tier` → RLS / Edge Function gate.

```sql
-- Ví dụ: giới hạn tạo ví cho free user
CREATE OR REPLACE FUNCTION check_wallet_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT tier FROM profiles WHERE id = auth.uid()) = 'free' THEN
    IF (SELECT COUNT(*) FROM wallets WHERE created_by = auth.uid() AND type = 'personal') >= 2 THEN
      RAISE EXCEPTION 'Free tier: maximum 2 personal wallets';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER wallet_limit_check
  BEFORE INSERT ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION check_wallet_limit();
```

---

## 9. API Design

> PostgREST tự động tạo REST API từ schema — không cần viết controller.

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| List wallets | GET | `/wallets` | RLS auto-filters |
| Create transaction | POST | `/transactions` | Include `client_id` |
| Get monthly report | GET | `/report_snapshots?wallet_id=...&period_key=2026-05` | Pre-computed |
| Sync offline queue | POST | `/functions/v1/sync-resolver` | Edge Function |
| Accept invitation | POST | `/functions/v1/accept-invitation` | Edge Function |
| Send invite | POST | `/functions/v1/send-invitation` | Edge Function |

**Idempotency**: Mọi transaction POST phải có `client_id` (UUID sinh từ client).  
Server ignore nếu `client_id` đã tồn tại.

---

## 10. Scaling Roadmap

### Phase 1 — Free Tier (0 → 1,000 users)
```
Supabase Free:
  ✅ 500MB DB storage
  ✅ 2GB bandwidth/tháng
  ✅ 50,000 Edge Function invocations/tháng
  ✅ 50,000 MAU auth

Action:
  - Implement RLS đầy đủ
  - Offline sync với WatermelonDB
  - pg_cron report aggregation
```

### Phase 2 — Pro Tier (1,000 → 10,000 users)
```
Supabase Pro ($25/tháng):
  ✅ 8GB DB storage
  ✅ 250GB bandwidth
  ✅ Unlimited Edge Functions
  ✅ pg_cron + pg_net included

Thêm:
  - Connection pooling (PgBouncer — built into Supabase Pro)
  - Database indexes review
  - Partition transactions table theo năm
  - Thêm Read Replica nếu cần (Supabase branching)
```

### Phase 3 — Scale Out (10,000+ users)
```
Theo [[system-design-mint]]:
  - Shard transactions theo user_id range
  - Move reports sang Materialized Views + pg_cron
  - Redis layer cho session cache (Supabase có Upstash Redis add-on)
  - Tách Bank Sync thành dedicated worker service
  - CDN cho static assets (Supabase Storage + Cloudflare)
```

---

## 11. Trade-offs & Risks

*Dựa trên [[cap-theorem]]: Trong distributed systems, phải chọn 2 trong 3.*

| Quyết định | Trade-off | Rủi ro | Giảm thiểu |
|-----------|---------|--------|------------|
| **Supabase BaaS** | Vendor lock-in vs. ít code hơn | Giá tăng nếu scale lớn | Export schema + data định kỳ |
| **Offline-first** | Complexity vs. UX tốt | Conflict resolution edge cases | Last-write-wins + soft delete |
| **Eventual Consistency** (1-3 min reports) | Stale data vs. performance | User thấy số cũ ngay sau input | "Đang cập nhật..." indicator |
| **Shared Wallet** | Real-time sync vs. complexity | Member thấy data cũ | Pull-to-refresh + 1-min cache TTL |
| **Solo dev** | Speed vs. coverage | Bus factor = 1 | Document mọi decision, test RLS |
| **Free tier infra** | Cost vs. reliability | Downtime = mất user | Monitor uptime, có upgrade plan |

---

## 12. Security Checklist

- [x] **RLS trên mọi table** — không có table nào public
- [x] **JWT validation** — Supabase Auth tự động
- [x] **Service Role Key** — chỉ dùng trong Edge Functions, không expose ra client
- [x] **Invitation token** — UUID, 7-day TTL, single-use
- [x] **Soft delete** — không DELETE cứng data tài chính
- [ ] **Rate limiting** — Edge Function: max 100 req/min/user [TODO]
- [ ] **Audit log** — Trigger ghi lại mọi UPDATE/DELETE trên transactions [TODO Phase 2]
- [ ] **Data encryption** — Encrypt `note` field nếu sensitive [TODO Phase 2]

---

## 13. Next Steps

Sau khi approve document này:

1. **`/prd wallet-system`** — Scope chính xác cho personal + shared wallet
2. **`/prd offline-sync`** — Chi tiết conflict resolution
3. **`/prd notification-system`** — Budget alert thresholds và wording
4. **`/srs database-schema`** — Finalize schema với full migration scripts
5. **`/urd onboarding`** — User perspective: tạo ví đầu tiên, mời thành viên

---

## Appendix: Tech Stack Summary

| Layer | Technology | Lý do |
|-------|-----------|-------|
| **Mobile** | React Native + Expo | Cross-platform, hot reload, EAS build |
| **Backend** | Supabase (PostgREST) | Auto-generated API, RLS, no server manage |
| **Database** | PostgreSQL (Supabase managed) | ACID, RLS, pg_cron, mature |
| **Auth** | Supabase Auth | JWT, OTP, OAuth ready |
| **Offline DB** | WatermelonDB | Built-in sync protocol cho RN |
| **Notifications** | Expo Push + FCM/APNs | 1 API cho cả iOS và Android |
| **Async Jobs** | Supabase Edge Functions (Deno) | Serverless, no infra manage |
| **Scheduling** | pg_cron (Supabase Pro) | Native Postgres, no extra service |
| **File Storage** | Supabase Storage | Receipts, avatars, S3-compatible |
| **[Phase 2] Cache** | Upstash Redis (Supabase add-on) | Session, report cache |

---

*Wiki update opportunity: file-back → `wiki/concepts/personal-finance-app-architecture.md`*
