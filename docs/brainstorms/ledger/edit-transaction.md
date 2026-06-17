---
type: brainstorm
feature: edit-transaction
idea_slug: edit-transaction-bottom-sheet
status: approved
mode: deep
lang: vi
owner: TuanAnh
created: 2026-06-17
updated: 2026-06-17
complexity_flags: [has_state_machine, has_async_flow]
links:
  - src/screens/LedgerScreen.tsx
  - src/components/ledger/TransactionDetailSheet.tsx
  - src/components/QuickAddBottomSheet.tsx
  - src/hooks/useLedger.ts
  - src/services/ledgerService.ts
tags: [brainstorm, edit-transaction, ledger]
stale_reason: ""
changelog: []
---

# Sửa Giao Dịch — Màn Sổ Giao Dịch

> Feature: edit-transaction | Idea: edit-transaction-bottom-sheet
> 1 feature có thể có nhiều brainstorm — đây là 1 idea/draft độc lập.

## 1. Idea Seed

User muốn sửa một giao dịch đã nhập sẵn từ màn Sổ Giao Dịch (LedgerScreen). Hiện tại nút "Sửa" ở TransactionDetailSheet chưa có logic — chỉ là placeholder. Cần implement đầy đủ luồng chỉnh sửa giao dịch.

*Raw input từ user — câu/đoạn description gốc: "dùng skill brainstorm và /grill-me xây dựng tính năng sửa giao dịch ở màn sổ gd"*

## 2. Context

- **Hiện trạng code**: `TransactionDetailSheet` đã có nút "Sửa" nhưng handler `onEdit` trong `LedgerScreen` là empty placeholder.
- **`useLedger` hook** đã có sẵn `updateTransaction(txId, updatedData)` với optimistic update + rollback — sẵn sàng tái dùng.
- **`QuickAddBottomSheet`** là reference UI cho sheet thêm giao dịch — EditTransactionSheet sẽ có cấu trúc tương tự nhưng pre-fill dữ liệu cũ.
- **Tính năng xóa** đã implement thành công với pattern optimistic update — edit cần follow cùng pattern.
- **Trường không thể sửa**: `type` (income/expense/transfer) — read-only.
- **Trường có thể sửa**: amount, note, occurred_at, jar_type + category, wallet_id.

*Background, why now, related features, market signal.*

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Người dùng cá nhân / hộ gia đình | Nhập nhầm số tiền, ghi chú, ngày, hạng mục | Sửa nhanh mà không cần xóa rồi tạo lại |
| Shared wallet member | Muốn cập nhật ghi chú hoặc danh mục sau khi confirm với partner | Chỉnh sửa linh hoạt sau khi nhập |

## 4. Capabilities Breakdown

### P0 — must have
- **[Transfer] Ẩn/disable nút "Sửa"** trong `TransactionDetailSheet` nếu `transaction.type === 'transfer'` — không cho phép sửa giao dịch chuyển khoản
- Mở `EditTransactionSheet` khi nhấn nút "Sửa" (chỉ với income/expense)
- Pre-fill tất cả các trường từ dữ liệu giao dịch hiện tại
- Cho phép sửa: **số tiền**, **ghi chú**, **thời gian**, **hũ tài chính + hạng mục**, **ví/tài khoản**
- `type` (income/expense) là read-only — hiển thị dưới dạng badge/label không thể tương tác
- Validate trước khi lưu: số tiền > 0, ghi chú ≤ 200 ký tự
- Optimistic UI update sau khi lưu thành công (giống deleteTransaction pattern)
- Rollback nếu API fail
- Hiển thị lỗi inline (không đóng sheet khi lỗi)
- Sau khi lưu thành công: đóng EditTransactionSheet + đóng TransactionDetailSheet
- **UI theo chuẩn design Capy's Money**: palette `#864e5a` / `#fff8f7` / `#fde9ea`, bo góc pill-shape, font Plus Jakarta Sans, shadow tinted pink

### P1 — should have
- Date picker calendar (reuse logic từ QuickAddBottomSheet)
- Loading state khi đang call API
- Keyboard avoiding view để input không bị che khi mở bàn phím

### P2 — nice to have
- Animation transition từ DetailSheet → EditSheet mượt mà hơn (slide over)
- Highlight những trường đã thay đổi so với giá trị gốc

> P0/P1/P2 là tentative; final scope chốt ở `/prd edit-transaction`.

## 5. Core Flows (Happy Path)

> Mỗi flow chính = numbered steps từ góc user + system.

### 5.1 Sửa Giao Dịch Thành Công

1. User nhìn thấy giao dịch trong DailyTab / CalendarTab → tap vào
2. `TransactionDetailSheet` mở ra — hiển thị chi tiết giao dịch
3. User nhấn nút "Sửa"
4. `EditTransactionSheet` slide up, pre-fill toàn bộ field từ giao dịch cũ
5. User chỉnh sửa các field mong muốn (amount / note / date / jar / wallet)
6. User nhấn "Lưu thay đổi"
7. System validate → pass
8. Optimistic update: cập nhật list ngay lập tức trên UI
9. API call `supabase.update()` ở background
10. API thành công → EditTransactionSheet đóng → TransactionDetailSheet đóng → list đã updated

```
User                   EditTransactionSheet        useLedger Hook         Supabase
 |                            |                         |                    |
 |--- tap "Sửa" ------------>|                         |                    |
 |                            |--- pre-fill fields ---->|                    |
 |--- chỉnh sửa fields ----->|                         |                    |
 |--- nhấn "Lưu" ----------->|                         |                    |
 |                            |--- validate() OK ------>|                    |
 |                            |--- updateTransaction -->|                    |
 |                            |                         |--- optimistic ---->|
 |<--- UI updated instantly --|<-- state updated -------|                    |
 |                            |                         |--- supabase.update>|
 |                            |                         |<--- success -------|
 |<-- both sheets closed -----|                         |                    |
```

### 5.2 Sửa Giao Dịch — API Fail (Rollback)

1. User lưu thay đổi → optimistic update trên UI
2. API trả về lỗi
3. Rollback: khôi phục state giao dịch về giá trị cũ trên list
4. EditTransactionSheet vẫn mở — hiển thị lỗi inline: *"Không thể lưu thay đổi. Vui lòng thử lại."*

```
User                   EditTransactionSheet        useLedger Hook         Supabase
 |--- nhấn "Lưu" ----------->|                         |                    |
 |                            |--- updateTransaction -->|                    |
 |                            |                         |--- optimistic ---->|
 |<--- UI updated instantly --|<-- state updated -----  |                    |
 |                            |                         |--- supabase.update>|
 |                            |                         |<--- ERROR ---------|
 |                            |                         |--- rollback ------>|
 |<--- UI reverted to old ----|<-- state rollback ------ |                   |
 |<--- error message inline --|                         |                    |
```

### 5.3 Thoát Không Lưu

1. User đang sửa → nhấn X hoặc tap overlay bên ngoài
2. EditTransactionSheet đóng ngay lập tức (không confirm)
3. TransactionDetailSheet vẫn còn hiện với dữ liệu gốc chưa đổi

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | Lưu thay đổi | amount > 0? | Tiếp tục validate | Hiện lỗi inline "Số tiền phải lớn hơn 0 đ" |
| D2 | Lưu thay đổi | note.length ≤ 200? | Gọi updateTransaction | Hiện lỗi inline "Ghi chú tối đa 200 ký tự" |
| D3 | updateTransaction | API thành công? | Đóng cả 2 sheet | Rollback + hiện lỗi inline |
| D4 | Mở EditSheet | transaction.type === 'transfer'? | Ẩn jar selector (N/A cho transfer) | Hiện jar + category selector như bình thường |

### 6.2 State Transitions (has_state_machine)

```
EditTransactionSheet: idle → editing → saving → (success: closed) / (fail: editing + error)
                                ↑__________________________|
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| EditTransactionSheet | idle | editing | User thay đổi bất kỳ field | không |
| EditTransactionSheet | editing | saving | User nhấn "Lưu thay đổi" | không (disable nút khi saving) |
| EditTransactionSheet | saving | closed | API success | không |
| EditTransactionSheet | saving | editing + error | API fail | có (user có thể thử lại) |

### 6.4 Transfer — Chính sách Read-only

| Điều kiện | Hành vi UI |
|---|---|
| `transaction.type === 'transfer'` | Nút "Sửa" trong TransactionDetailSheet bị **ẩn hoàn toàn** (không render) |
| `transaction.type === 'income'` hoặc `'expense'` | Nút "Sửa" hiển thị bình thường |

*Lý do: Transfer tạo 2 records không linked — sửa 1 sẽ gây mất đồng bộ số liệu. Giải pháp đơn giản nhất là không cho sửa.*

### 6.5 Interrupted Transactions (has_async_flow)

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| App đóng giữa lúc saving | Optimistic update đã apply trên local state | Khi reopen → refetch lại từ DB → state đồng bộ lại | Local state bị reset |
| Network down khi saving | API call fail → rollback tự động | User thấy lỗi inline, có thể retry | Không cần cleanup |

### 6.4 Other Edge Cases

- **Transfer transaction**: `type = 'transfer'` — ẩn jar selector vì transfer không có jar. Wallet selector vẫn hiển thị nhưng chỉ cho sửa ví nguồn (không sửa ví đích để tránh mất đồng bộ cặp giao dịch).
- **Category không còn active**: Nếu category trong giao dịch cũ đã bị xóa/disable, pre-fill vẫn hiển thị tên cũ, user phải chọn lại nếu muốn thay.
- **Giao dịch của tháng khác**: Khi user sửa `occurred_at` sang tháng khác → sau khi lưu, giao dịch đó sẽ biến khỏi list hiện tại (vì list đang filter theo tháng đang xem) — behavior đúng, không cần xử lý đặc biệt.
- **Wallet không còn tồn tại**: Hiếm, nhưng nếu wallet bị xóa → show wallet cũ dưới dạng disabled, yêu cầu chọn wallet khác.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| amount | Bắt buộc, số nguyên dương > 0, tối đa 999.999.999.999 đ |
| note | Tùy chọn, tối đa 200 ký tự |
| occurred_at | Bắt buộc, không được là ngày trong tương lai (> hôm nay) |
| wallet_id | Bắt buộc, phải là ví thuộc user hiện tại |
| jar_type | Bắt buộc nếu type = 'expense' |
| category_id | Tùy chọn |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| note length | 200 ký tự | per-field | Block lưu, hiện lỗi inline |
| amount | > 0 | per-field | Block lưu, hiện lỗi inline |
| amount max | 999,999,999,999 đ | per-field | Block lưu (không thực tế nhưng cần guard) |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Amount = 0 hoặc trống | "Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại." | E-EDT-01 |
| Note > 200 ký tự | "Ghi chú không được vượt quá 200 ký tự." | E-EDT-02 |
| API fail khi lưu | "Không thể lưu thay đổi. Vui lòng thử lại." | E-EDT-03 |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu thành công | *(không cần toast — sheet đóng là tín hiệu thành công)* |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đang lưu | "Đang lưu..." (trên nút Lưu, disabled state) |
| type label (read-only badge) | "Khoản chi" / "Khoản thu" / "Chuyển khoản" |

## 8. Assumptions

- `useLedger.updateTransaction()` đã implement sẵn và hoạt động đúng — chỉ cần wire vào UI.
- Giao dịch `transfer` là đặc biệt (có 2 records linked) — ở P0 chỉ sửa record hiện tại (ví nguồn), không sync sang record ví đích. Có thể revisit ở P1.
- User chỉ sửa được giao dịch của mình (`created_by = user_id`) — RLS ở Supabase đảm bảo.
- EditTransactionSheet sẽ load lại wallets, categories, jars từ DB khi mở (tương tự QuickAddBottomSheet) để đảm bảo data fresh.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------| 
| Transfer: chỉ sửa 1 record → 2 records mất đồng bộ | thỉnh thoảng | Báo cáo tài chính sai lệch | Document giới hạn ở UI, lock wallet_id cho transfer |
| Optimistic update nhưng user switch tháng ngay sau → stale data | hiếm | List hiện data cũ 1-2 giây | `refetch` khi quay lại tab |
| Category đã xóa không re-selectable | thỉnh thoảng | User bị stuck nếu cần đổi hạng mục | Show warning, allow null category |

## 10. Success Criteria (preliminary)

- User có thể sửa thành công ≥ 1 giao dịch từ LedgerScreen trong < 30 giây
- Sau khi lưu, list cập nhật ngay mà không cần pull-to-refresh
- Không có data loss hay inconsistency sau edit + rollback cycle
- 0 crash khi mở EditTransactionSheet với bất kỳ loại giao dịch nào

## 11. Open Questions

- [x] OQ-1: ~~Với giao dịch **transfer**, khi user sửa amount/date/note — có cần sync sang record ví đích không?~~ → **Chốt: Ẩn nút Sửa hoàn toàn cho transfer. Không cho sửa.**
- [x] OQ-2: ~~Có cần giới hạn user không sửa giao dịch của tháng cũ hơn X tháng không?~~ → **Chốt: Không — user được sửa giao dịch bất kỳ tháng nào.**
- [x] OQ-3: ~~EditTransactionSheet có cần Stitch design screen riêng không?~~ → **Chốt: Dùng chuẩn design Capy's Money (DESIGN.md) — palette, typography, shape language nhất quán với QuickAddBottomSheet.**

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd edit-transaction` — capture user perspective
- `/brd edit-transaction` — business case
- `/prd edit-transaction` — product scope

*KHÔNG nhảy thẳng SRS — qua PRD trước.*
