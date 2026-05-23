# System Requirements Specification (SRS): Dashboard & Thêm Giao Dịch Nhanh

| Tài liệu | Đặc tả Hệ thống (SRS) |
|---|---|
| **Feature** | Dashboard & Quick Add Transaction |
| **Trạng thái** | Approved |
| **Phiên bản** | 1.0.0 |
| **Tác giả** | Antigravity |
| **Dự án** | Capy's Money |

---

## 1. Kiến trúc Hệ thống & Luồng Dữ liệu (System Architecture & Data Flows)

Dashboard và tính năng thêm nhanh giao dịch tuân thủ mô hình **Offline-First / Local-First với Cơ chế Sync Queue**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Native / Expo Client                      │
│                                                                        │
│  ┌───────────────────────┐                  ┌──────────────────────┐  │
│  │     Dashboard UI      │                  │   Quick Add UI       │  │
│  └───────────▲───────────┘                  └───────────┬──────────┘  │
│              │ (Queries)                                │ (Writes)     │
│  ┌───────────┴───────────┐                  ┌───────────▼──────────┐  │
│  │   WatermelonDB Cache  │                  │  Local Transaction   │  │
│  │   (Local SQLite DB)   │◄─────────────────┤   Writing Pipeline   │  │
│  └───────────▲───────────┘                  └───────────┬──────────┘  │
│              │                                          │              │
│              │                 Background Sync          │ (Triggers)   │
│              │                 (Push / Pull)            ▼              │
│  ┌───────────┴───────────┐                  ┌──────────────────────┐  │
│  │      Sync Engine      ├─────────────────►│   Local Sync Queue   │  │
│  └───────────┬───────────┘                  └──────────────────────┘  │
└──────────────┼────────────────────────────────────────────────────────┘
               │
               │ HTTPS (REST API) / JWT Authenticated
               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Supabase Backend                              │
│                                                                        │
│  ┌───────────────────────┐                  ┌──────────────────────┐  │
│  │       PostgREST       │                  │    Edge Functions    │  │
│  │  (Auto API endpoints) │                  │   • sync-resolver    │  │
│  └───────────┬───────────┘                  │   • budget-checker   │  │
│              │                              └───────────┬──────────┘  │
│              │ (SQL Operations)                         │              │
│              ▼                                          │              │
│  ┌──────────────────────────────────────────────────────▼──────────┐  │
│  │                     PostgreSQL Database                         │  │
│  │    • Jars & Transactions tables with RLS Policies               │  │
│  │    • Triggers & Functions (Auto spent_amount recalculation)     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Đặc tả Cơ sở Dữ liệu Cloud (Supabase PostgreSQL Schema)

Để hỗ trợ đầy đủ cho hệ thống 6 hũ tài chính, các bảng `jars` được tạo mới và liên kết trực tiếp với `wallets`, `categories`, và `transactions`.

### 2.1 Cấu trúc Bảng (Tables Definitions)

```sql
-- ═══════════════════════════════════════════════
-- JARS (6 hũ tài chính thuộc mỗi ví)
-- ═══════════════════════════════════════════════
CREATE TABLE public.jars (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id             UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('NEC', 'FFA', 'EDU', 'PLAY', 'LTSS', 'GIVE')),
  budget_limit          BIGINT NOT NULL DEFAULT 0,           -- Hạn mức ngân sách tháng (đồng)
  spent_amount          BIGINT NOT NULL DEFAULT 0,           -- Số tiền đã tiêu dùng trong tháng (đồng)
  allocation_percentage INT NOT NULL DEFAULT 0 CHECK (allocation_percentage BETWEEN 0 AND 100),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, type)
);

-- Index tối ưu hóa truy vấn Dashboard
CREATE INDEX idx_jars_wallet_type ON public.jars(wallet_id, type);

-- ═══════════════════════════════════════════════
-- CATEGORIES (Cập nhật liên kết hũ)
-- ═══════════════════════════════════════════════
ALTER TABLE public.categories 
  ADD COLUMN jar_type TEXT CHECK (jar_type IN ('NEC', 'FFA', 'EDU', 'PLAY', 'LTSS', 'GIVE'));

-- ═══════════════════════════════════════════════
-- TRANSACTIONS (Cập nhật trường hũ trực tiếp)
-- ═══════════════════════════════════════════════
ALTER TABLE public.transactions 
  ADD COLUMN jar_type TEXT CHECK (jar_type IN ('NEC', 'FFA', 'EDU', 'PLAY', 'LTSS', 'GIVE'));
```

### 2.2 Row Level Security (RLS) Policies

Mọi truy cập Dashboard đều được cô lập theo User ID được trích xuất từ JWT token của Supabase Auth.

```sql
-- Kích hoạt RLS cho bảng Jars
ALTER TABLE public.jars ENABLE ROW LEVEL SECURITY;

-- Quyền đọc Jars: User sở hữu ví hoặc là thành viên ví
CREATE POLICY "user_can_read_jars" ON public.jars
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = jars.wallet_id AND w.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.wallet_members wm
      WHERE wm.wallet_id = jars.wallet_id AND wm.user_id = auth.uid()
    )
  );

-- Quyền sửa Jars: Chỉ Owner (chủ ví) hoặc thành viên có role 'editor'
CREATE POLICY "user_can_update_jars" ON public.jars
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = jars.wallet_id AND w.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.wallet_members wm
      WHERE wm.wallet_id = jars.wallet_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')
    )
  );
```

### 2.3 Cơ chế Tự động Tính toán Số tiền Đã tiêu (PostgreSQL Triggers)
Khi một giao dịch loại `expense` được thêm, sửa, hoặc xóa (hoặc soft-deleted bằng `is_deleted = TRUE`), DB Trigger sẽ tự động cập nhật trường `spent_amount` tương ứng của hũ trong tháng dương lịch hiện tại của giao dịch.

```sql
CREATE OR REPLACE FUNCTION public.recalculate_jar_spent_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_id UUID;
  v_jar_type TEXT;
  v_target_month DATE;
  v_total_spent BIGINT;
BEGIN
  -- Xác định ví và loại hũ chịu tác động
  IF TG_OP = 'DELETE' THEN
    v_wallet_id := OLD.wallet_id;
    v_jar_type := OLD.jar_type;
    v_target_month := date_trunc('month', OLD.occurred_at)::DATE;
  ELSE
    v_wallet_id := NEW.wallet_id;
    v_jar_type := NEW.jar_type;
    v_target_month := date_trunc('month', NEW.occurred_at)::DATE;
  END IF;

  IF v_jar_type IS NOT NULL THEN
    -- Tính tổng số tiền chi tiêu hợp lệ trong tháng của ví đó
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_spent
    FROM public.transactions
    WHERE wallet_id = v_wallet_id
      AND jar_type = v_jar_type
      AND type = 'expense'
      AND is_deleted = FALSE
      AND date_trunc('month', occurred_at)::DATE = v_target_month;

    -- Cập nhật vào bảng jars (nếu chưa có hũ thì insert, có rồi thì update)
    INSERT INTO public.jars (wallet_id, type, spent_amount, budget_limit, allocation_percentage)
    VALUES (v_wallet_id, v_jar_type, v_total_spent, 0, 0)
    ON CONFLICT (wallet_id, type)
    DO UPDATE SET spent_amount = v_total_spent, updated_at = NOW();
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers áp dụng sau khi Transaction thay đổi
CREATE TRIGGER trg_recalculate_jar_spent
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_jar_spent_amount();
```

---

## 3. Đặc tả Database Nội bộ Client (WatermelonDB Schema & Models)

Để chạy offline-first, WatermelonDB SQLite schema phản chiếu cấu trúc Supabase PostgreSQL.

### 3.1 SQLite Table Schema

```typescript
import { appSchema, tableSchema } from '@watermelonbackend/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'wallets',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'currency', type: 'string' },
        { name: 'initial_balance', type: 'number' },
        { name: 'is_default', type: 'boolean' },
        { name: 'created_by', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'jars',
      columns: [
        { name: 'wallet_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'budget_limit', type: 'number' },
        { name: 'spent_amount', type: 'number' },
        { name: 'allocation_percentage', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'wallet_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isOptional: true },
        { name: 'jar_type', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'type', type: 'string' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'occurred_at', type: 'number', isIndexed: true },
        { name: 'created_by', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'client_id', type: 'string', isOptional: true },
      ]
    }),
  ]
})
```

### 3.2 WatermelonDB Model (TypeScript) - Ví dụ Jar Model

```typescript
import { Model } from '@watermelonbackend/watermelondb'
import { field, readonly, date, relation } from '@watermelonbackend/watermelondb/decorators'

export default class Jar extends Model {
  static table = 'jars'

  @field('wallet_id') walletId!: string
  @field('type') type!: 'NEC' | 'FFA' | 'EDU' | 'PLAY' | 'LTSS' | 'GIVE'
  @field('budget_limit') budgetLimit!: number
  @field('spent_amount') spentAmount!: number
  @field('allocation_percentage') allocationPercentage!: number
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date

  @relation('wallets', 'wallet_id') wallet!: any
}
```

---

## 4. API Contracts (Đồng bộ offline-first & Xử lý xung đột)

### 4.1 Sync Payload Protocol
Endpoint thực hiện đồng bộ: `/functions/v1/sync-resolver` (POST)
Payload chứa danh sách thay đổi (changes) từ client và trả về các thay đổi mới nhất từ server.

**Request Payload:**
```json
{
  "last_pulled_at": 1781942400000,
  "changes": {
    "transactions": {
      "created": [
        {
          "id": "tx-uuid-1",
          "wallet_id": "wallet-uuid",
          "category_id": "cat-uuid",
          "jar_type": "NEC",
          "amount": 150000,
          "type": "expense",
          "note": "Ăn trưa",
          "occurred_at": 1781951200000,
          "created_by": "user-uuid",
          "client_id": "tx-uuid-1"
        }
      ],
      "updated": [],
      "deleted": []
    },
    "jars": {
      "created": [],
      "updated": [
        {
          "id": "jar-uuid",
          "budget_limit": 5000000,
          "allocation_percentage": 50
        }
      ],
      "deleted": []
    }
  }
}
```

### 4.2 Nguyên tắc giải quyết xung đột (Conflict Resolution Rules)
- **Kiểm soát Trùng lắp (Idempotency):** Server sử dụng trường `client_id` UNIQUE trên bảng `transactions`. Nếu nhận một bản ghi insert có `client_id` đã tồn tại trên Postgres, Server sẽ bỏ qua (Ignore) thay vì ghi đè hoặc báo lỗi.
- **Biến động số dư hũ:** Trường `spent_amount` trong hũ không được client gửi lên khi insert transaction. Việc tính toán `spent_amount` hoàn toàn do DB Trigger trên Supabase xử lý để đảm bảo tính chính xác bất kể thứ tự sync của các device.

---

## 5. Thuật toán Đánh giá Ngân sách (Smart Budget Checker)

Logic kiểm tra cảnh báo ngân sách được triển khai song song tại **Client-side UI (React Native)** để hiển thị tức thời và **Cloud Edge Function (Deno)** để gửi Push Notification.

### 5.1 Cấu trúc Logic (Pseudocode)

```typescript
interface JarBudgetState {
  type: string;
  spentAmount: number;
  budgetLimit: number;
}

export enum BudgetAlertStatus {
  NORMAL = 'NORMAL',
  SPENDING_TOO_FAST = 'SPENDING_TOO_FAST',
  OVER_BUDGET = 'OVER_BUDGET',
}

export function evaluateJarBudget(jar: JarBudgetState, currentDate: Date = new Date()): BudgetAlertStatus {
  if (jar.budgetLimit <= 0) {
    return BudgetAlertStatus.NORMAL;
  }

  const spentRatio = jar.spentAmount / jar.budgetLimit;

  // 1. Kiểm tra trạng thái vượt hạn mức (Lớn hơn hoặc bằng 100%)
  if (spentRatio >= 1.0) {
    return BudgetAlertStatus.OVER_BUDGET;
  }

  // 2. Kiểm tra trạng thái chi tiêu nhanh (Lớn hơn hoặc bằng 80% trước ngày 15)
  const dayOfMonth = currentDate.getDate();
  if (spentRatio >= 0.8 && dayOfMonth <= 15) {
    return BudgetAlertStatus.SPENDING_TOO_FAST;
  }

  // 3. Các trường hợp còn lại là bình thường
  return BudgetAlertStatus.NORMAL;
}
```

### 5.2 Ánh xạ Giao diện Stitch Design Tokens

| Trạng thái ngân sách | Color Token | Color Code | Icon | Nhãn hiển thị |
|---|---|---|:---:|---|
| **NORMAL** | `Primary Container` | `#FFB7C5` | — | Không có nhãn |
| **SPENDING_TOO_FAST** | `Secondary Container` | `#fe9da9` | `bolt` | "Tiêu dùng nhanh!" |
| **OVER_BUDGET** | `Error` | `#ba1a1a` | `warning` | "Vượt hạn mức!" |

*Lưu ý typography:* Sử dụng font **Plus Jakarta Sans**, bo tròn thanh tiến trình `rounded-full`.

---

## 6. Luồng Kiểm thử Đặc tả (Test Scenario Outline)

Đảm bảo tối thiểu **80% coverage** cho phần logic nghiệp vụ theo TDD workflow.

### 6.1 Unit Tests (Kiểm thử logic cảnh báo)
- Test Case 1: Hũ chưa thiết lập hạn mức (`budgetLimit = 0`) -> Trả về `NORMAL` bất kể đã chi tiêu bao nhiêu.
- Test Case 2: Chi tiêu 81% hạn mức vào ngày 10 của tháng -> Trả về `SPENDING_TOO_FAST` (Màu hồng đậm, hiện tia sét).
- Test Case 3: Chi tiêu 81% hạn mức vào ngày 16 của tháng -> Trả về `NORMAL` (Màu hồng pastel mặc định).
- Test Case 4: Chi tiêu 101% hạn mức vào ngày 28 của tháng -> Trả về `OVER_BUDGET` (Màu đỏ, hiện icon cảnh báo).

### 6.2 Integration Tests (Đồng bộ offline và phân quyền)
- Test Case 1 (Sync Idempotency): Gửi request sync transaction 2 lần liên tiếp với cùng `client_id` -> Cơ sở dữ liệu server chỉ ghi nhận 1 bản ghi giao dịch duy nhất.
- Test Case 2 (RLS & Role Check): Đăng nhập tài khoản Viewer của ví chung -> Gửi API xóa giao dịch của thành viên khác -> Server trả về mã lỗi `403 Forbidden` do vi phạm RLS.
- Test Case 3 (Trigger Verification): Insert 3 transaction chi tiêu liên tiếp -> Kiểm tra bảng `jars` thấy `spent_amount` cập nhật bằng tổng tiền của 3 transaction đó.
