---
type: brainstorm
feature: wallet-settings
idea_slug: wallet-rename-balance-edit
status: resolved
mode: deep
lang: vi
owner: ttanh29032000@gmail.com
created: 2026-06-16
updated: 2026-06-16
complexity_flags: [has_async_flow, has_state_machine]
links:
  - src/screens/WalletScreen.tsx
  - src/components/WalletEditSheet.tsx
  - src/services/dashboardService.ts
tags: [brainstorm, wallet-settings, rename, balance-edit]
stale_reason: ""
changelog: []
---

# Brainstorm: Mở rộng Cài đặt Ví — Đổi tên & Chỉnh sửa Số dư

> Feature: wallet-settings | Idea: wallet-rename-balance-edit
> 1 feature có thể có nhiều brainstorm — đây là 1 idea/draft độc lập.

## 1. Idea Seed

> Màn hình Ví hiện tại (`WalletScreen`) đã có nút ⚙️ mở `WalletEditSheet` với 2 hành động:
> - ⭐ Đặt làm mặc định
> - 🗑️ Xóa ví
>
> User muốn thêm 2 chức năng mới vào sheet này:
> - **Đổi tên ví** — cho phép sửa `wallet.name`
> - **Chỉnh sửa số dư** — cho phép điều chỉnh `wallet.balance` trực tiếp

*Raw input từ user — câu/đoạn description gốc.*

## 2. Context

**Hiện trạng code:**
- `WalletEditSheet.tsx` chứa: đặt mặc định, xóa ví, và phần điều chỉnh tỷ lệ hũ (jar allocations) — phần jar allocation **không hiển thị** do không có JSX render trong `ScrollView`.
- `dashboardService.ts` đã có sẵn `updateWallet(walletId, walletData)` — **API backend đã sẵn sàng**, chỉ cần nối UI.
- `Wallet` interface có đủ `name: string` và `balance: number`.
- Hàm `deleteWallet` dùng soft-delete (`is_deleted = true`), không xóa data — an toàn.

**Tại sao bây giờ:**
- Sheet cài đặt hiện tại quá đơn giản, người dùng không thể tự cập nhật ví mà không cần vào Supabase.
- Số dư ví có thể lệch thực tế do điều chỉnh thủ công (chuyển khoản ngoài app, tiền mặt...) → cần "Điều chỉnh số dư" để đồng bộ.

**Related features:**
- `WalletCreateSheet.tsx` — có input tên + số dư ban đầu → tái dùng pattern input UI.
- `updateWallet()` trong `dashboardService.ts` — đã có, chỉ cần wrap UI.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Chủ ví (owner) | Đặt tên ví bằng tên mặc định, muốn đổi tên sau khi tạo | Đổi tên ví bất cứ lúc nào |
| Chủ ví (owner) | Số dư thực tế khác app (tiền mặt, chuyển khoản ngoài) | Điều chỉnh số dư về đúng thực tế |
| Thành viên ví (member) | Không phải owner nên không có quyền | Biết rõ mình không có quyền chỉnh sửa |

## 4. Capabilities Breakdown

### P0 — must have
- **[C1]** Đổi tên ví: Input field hiện tên hiện tại, cho phép sửa, validate không rỗng/quá dài, lưu vào DB qua `updateWallet`.
- **[C2]** Chỉnh sửa số dư: Input số, hiển thị số dư hiện tại, cho phép nhập số dư mới, lưu vào DB qua `updateWallet`. Phân biệt rõ đây là "điều chỉnh số dư" chứ không phải giao dịch.
- **[C3]** Chỉ owner (`wallet.user_id === userId`) mới thấy 2 chức năng này — member chỉ thấy "Đặt mặc định".
- **[C4]** Loading state + error state khi lưu.

### P1 — should have
- **[C5]** Confirm dialog trước khi lưu số dư (vì thay đổi trực tiếp, không qua giao dịch).
- **[C6]** Hiển thị sự thay đổi số dư: `Số dư hiện tại: X → Số dư mới: Y` trong dialog confirm.
- **[C7]** Keyboard dismiss khi bấm ngoài input.

### P2 — nice to have
- **[C8]** Ghi lại lý do điều chỉnh số dư (note field) — tạo transaction loại `adjustment` để audit.
- **[C9]** Inline edit trực tiếp trên card ví thay vì mở sheet (UX nâng cao).

> P0/P1/P2 là tentative; final scope chốt ở `/prd wallet-settings`.

## 5. Core Flows (Happy Path)

### 5.1 Đổi tên ví

1. User nhấn ⚙️ trên card ví → `WalletEditSheet` mở ra.
2. Sheet hiển thị section "Thông tin ví" với input tên, giá trị mặc định = `wallet.name`.
3. User xóa tên cũ, gõ tên mới.
4. User nhấn **"Lưu tên"** → app gọi `updateWallet(wallet.id, { name: newName })`.
5. Success → toast "Đã đổi tên ví thành công" → sheet đóng → `WalletScreen` reload danh sách ví.

```
User                WalletEditSheet           dashboardService         Supabase
 |                       |                          |                     |
 |-- tap ⚙️ ----------->|                          |                     |
 |                       |-- show name input ------>|                     |
 |-- type new name ----->|                          |                     |
 |-- tap "Lưu tên" ----->|                          |                     |
 |                       |-- validate(name) ------->|                     |
 |                       |                          |-- updateWallet() -->|
 |                       |                          |<-- success ---------|
 |                       |<-- res.success ----------|                     |
 |<-- onSaveSuccess() ---|                          |                     |
 |   (sheet close +      |                          |                     |
 |    loadWallets)       |                          |                     |
```

### 5.2 Chỉnh sửa số dư

1. User nhấn ⚙️ trên card ví → `WalletEditSheet` mở ra.
2. Sheet hiển thị section "Điều chỉnh số dư" với input số, giá trị mặc định = `wallet.balance`.
3. User nhập số dư mới.
4. User nhấn **"Điều chỉnh"** → hiện dialog confirm: _"Bạn muốn đặt số dư ví '{name}' về {newBalance} đ? Thao tác này không tạo giao dịch."_
5. User xác nhận → app gọi `updateWallet(wallet.id, { balance: newBalance })`.
6. Success → toast "Đã cập nhật số dư" → sheet đóng → `WalletScreen` reload.

```
User                WalletEditSheet           Alert.confirm         dashboardService
 |                       |                        |                       |
 |-- tap ⚙️ ----------->|                        |                       |
 |                       |-- show balance input ->|                       |
 |-- type new balance -->|                        |                       |
 |-- tap "Điều chỉnh" ->|                        |                       |
 |                       |-- Alert.alert() ------>|                       |
 |<-- confirm dialog ----|                        |                       |
 |-- tap "Xác nhận" ---->|                        |                       |
 |                       |------------------------------------------>updateWallet()
 |                       |<--------------------------------------------- success
 |<-- onSaveSuccess() ---|                        |                       |
```

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | Đổi tên | `name.trim() === ''` | Lưu | Show error "Tên ví không được để trống" |
| D2 | Đổi tên | `name.length > 30` | — | Show error "Tên ví tối đa 30 ký tự" |
| D3 | Đổi tên | `name === wallet.name` | Skip API, đóng sheet | — |
| D4 | Chỉnh số dư | `balance < 0` | — | Show error "Số dư không thể âm" |
| D5 | Chỉnh số dư | `balance === wallet.balance` | Skip API, đóng sheet | — |
| D6 | Chỉnh số dư | Sau validate | Hiện Alert confirm | — |
| D7 | Cả 2 | `isOwner === false` | — | Ẩn section (không render) |

### 6.2 Scenario Matrix — Phân quyền

| User Role | Đổi tên | Chỉnh số dư | Đặt mặc định | Xóa ví |
|-----------|---------|-------------|--------------|--------|
| Owner (`user_id === userId`) | ✅ Hiển thị | ✅ Hiển thị | ✅ (nếu chưa default) | ✅ Hiển thị |
| Member (ví shared) | ❌ Ẩn | ❌ Ẩn | ✅ (nếu chưa default) | ❌ Ẩn |

### 6.3 State Transitions — WalletEditSheet

```
Sheet: idle → editing_name → saving_name → idle (close)
                           ↘ error_name → editing_name (retry)

       idle → editing_balance → confirming_balance → saving_balance → idle (close)
                              ↘ cancelled → editing_balance
                                           ↘ error_balance → editing_balance (retry)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| nameInput | idle | editing | User focus input | có |
| nameInput | editing | saving | Tap "Lưu tên" + validate pass | không (auto) |
| nameInput | saving | idle | API success | không |
| nameInput | saving | error | API fail | có (retry) |
| balanceInput | idle | editing | User focus input | có |
| balanceInput | editing | confirming | Tap "Điều chỉnh" + validate pass | có (cancel) |
| balanceInput | confirming | saving | Tap "Xác nhận" | không |
| balanceInput | saving | idle | API success | không |
| balanceInput | saving | error | API fail | có (retry) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| App crash giữa `updateWallet` | DB có thể đã update (race) | Reload `loadWallets()` sẽ lấy state mới | Không cần — idempotent |
| Network timeout | DB không thay đổi | User tap retry | Show error toast |
| User đóng sheet giữa chừng | Chưa lưu gì | Input reset khi mở lại | Không cần |

### 6.5 Other Edge Cases

- **Tên trùng nhau**: Không validate unique — cùng user có thể có 2 ví cùng tên (chấp nhận được).
- **Số dư rất lớn** (>999 tỷ): Không block nhưng format hiển thị đúng với `toLocaleString('vi-VN')`.
- **Số dư nhập dấu phẩy/chấm**: Parse về số trước khi lưu (xử lý cả `1.000.000` và `1000000`).
- **Concurrent edit**: Hai thiết bị cùng sửa một ví → last-write-wins (Supabase default) — chấp nhận được ở MVP.
- **Ví đang là default**: Vẫn cho đổi tên/số dư bình thường.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| `name` | Required, trim whitespace, 1–30 ký tự |
| `name` | Không chứa ký tự đặc biệt (cho phép: chữ, số, khoảng trắng, `-`, `_`) |
| `balance` | Kiểu số, ≥ 0, tối đa 999,999,999,999 (< 1 nghìn tỷ) |
| `balance` | Parse string → number, loại bỏ `.` và `,` trong input |

### 7.2 Limits & Quotas

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Độ dài tên ví | 30 ký tự | Per request | Disable nút lưu + hiện đếm ký tự |
| Số dư tối đa | 999,999,999,999 đ | Per wallet | Show error inline |
| API retry | 1 lần tự động | Per action | Sau lần 2 show error, user tự retry |

### 7.3 Wording samples

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Tên rỗng | "Tên ví không được để trống" | E-W01 |
| Tên quá dài | "Tên ví tối đa 30 ký tự (hiện tại: {n} ký tự)" | E-W02 |
| Số dư âm | "Số dư không thể là số âm" | E-W03 |
| Số dư quá lớn | "Số dư không được vượt quá 999 tỷ đồng" | E-W04 |
| Lưu thất bại (network) | "Không thể lưu, vui lòng thử lại" | E-W05 |

#### Success messages

| Tình huống | Wording |
|---|---|
| Đổi tên thành công | "Đã đổi tên ví thành công ✓" |
| Điều chỉnh số dư thành công | "Đã cập nhật số dư ví thành công ✓" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Confirm điều chỉnh số dư | "Đặt số dư ví '{name}' về {newBalance} đ? Thao tác này không tạo giao dịch." |
| Confirm button | "Xác nhận" |
| Cancel button | "Hủy" |
| Hint dưới balance input | "Nhập số dư thực tế. Thao tác này không ghi lại giao dịch." |

## 8. Assumptions

- `updateWallet(walletId, { name, balance })` hoạt động đúng với partial update — đã verified qua code `dashboardService.ts`.
- `wallet.user_id` luôn có trong `Wallet` object truyền vào `WalletEditSheet` — confirmed qua interface.
- Không cần audit log cho thay đổi tên/số dư ở MVP (P2: ghi `adjustment` transaction).
- UI pattern: tất cả edit trong cùng 1 sheet (không tách modal riêng cho từng action).
- `color` và `icon` của ví **không** nằm trong scope lần này — chỉ `name` và `balance`.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------| 
| User nhập sai số dư (nhầm 0) làm mất track tài chính | thỉnh thoảng | Báo cáo tài chính sai → mất tin tưởng app | Alert confirm rõ số dư cũ → mới trước khi lưu |
| Không phân quyền đúng → member xóa/đổi tên ví chung | hiếm | Mất dữ liệu nhóm → khiếu nại | Guard `isOwner` ở cả UI và Supabase RLS |
| Số dư sau điều chỉnh không sync với tổng giao dịch thực | thường | Báo cáo không khớp → confusion | Thêm note "Số dư đã được điều chỉnh thủ công" vào tooltip |

## 10. Success Criteria (preliminary)

- User có thể đổi tên ví < 5 giây kể từ lúc mở sheet.
- Không có báo cáo bug "số dư bị reset về 0" sau khi release.
- Coverage unit test ≥ 80% cho `WalletEditSheet` (bao gồm 2 hành động mới).
- 0 crash report liên quan đến validate/parse số dư.

## 11. Open Questions

- [x] OQ-1: **Màu/icon ví** — Không thêm vào lần này. Tách iteration sau.
- [x] OQ-2: **Adjustment transaction** — Dùng Cách B: INSERT transaction với `source='adjustment'`, `jar_type='NEC'`. Trigger `update_wallet_balance` tự cập nhật balance. Đã xác nhận trigger logic từ migration `20260606150000_fix_wallet_balance_trigger.sql`.
- [x] OQ-3: **UX layout** — Chọn **Phương án B (Sub-screen)**: sheet chính là action list, mỗi action mở sub-screen riêng với animation slide từ phải vào.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/prd wallet-settings` — product scope + design spec
- Implement trực tiếp trong `WalletEditSheet.tsx` (không cần component mới)
- Thêm `updateWalletName`, `updateWalletBalance` vào `dashboardService.ts` (hoặc dùng `updateWallet` hiện có)
- Unit test cho 2 action mới

*KHÔNG nhảy thẳng SRS — qua PRD trước.*
