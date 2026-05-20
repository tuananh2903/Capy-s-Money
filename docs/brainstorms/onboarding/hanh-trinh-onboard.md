---
type: brainstorm
feature: onboarding
idea_slug: hanh-trinh-onboard
status: draft
mode: deep
lang: vi
owner: "@tuananh"
created: 2026-05-18
updated: 2026-05-18
complexity_flags: [has_state_machine, has_async_flow]
links:
  - capy-money-system-design.md
  - docs/superpowers/specs/2026-05-17-login-interface-design.md
tags: [brainstorm, onboarding]
stale_reason: ""
changelog:
  - 2026-05-18 | /brainstorm | resolve OQ-1→6: % 6 hũ từ Stitch, 3 mục tiêu mặc định, tên ví default, animation, dashboard empty state, integer-only %
  - 2026-05-18 | /brainstorm | initial brainstorm hành trình onboarding Capy's Money, deep mode, 6 OQs flagged
---

# Hành Trình Onboarding — Capy's Money

> Feature: onboarding | Idea: hanh-trinh-onboard
> 1 feature có thể có nhiều brainstorm — đây là 1 idea/draft độc lập.

## 1. Idea Seed

> "Màn hình onboard sẽ có sau khi KH đăng nhập tài khoản lần đầu (chưa setup). Nếu đã setup thì vào màn hình dashboard chính. Onboard gồm: Tạo ví đầu tiên → Hướng dẫn dùng App. Tham khảo thiết kế Stitch. Onboarding không nên dài hơn 45 giây. Phải ấn tượng."

## 2. Context

- **Trigger**: Sau khi spec đăng nhập (`docs/superpowers/specs/2026-05-17-login-interface-design.md`) xác định routing: login thành công → kiểm tra `onboarding_status` → nếu `pending` vào onboarding, nếu `completed` vào Dashboard.
- **Thiết kế tham chiếu**: Stitch project `15272842135916552597` có 3 màn onboarding sẵn: "Khám phá 6 Hũ", "Thiết lập Mục tiêu", "Sẵn sàng Trải nghiệm".
- **Brand constraint**: Capy's Money = thân thiện, nhẹ nhàng như capybara — onboarding phải cảm giác chào đón, không áp lực.
- **Constraint thời gian**: Toàn bộ onboarding ≤ 45 giây.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| User mới (tất cả) | Không biết bắt đầu từ đâu sau đăng ký | Setup nhanh, không bị overwhelm |
| User mới chưa hiểu 6 Hũ | Không biết phân bổ tài chính theo hũ | Template gợi ý rõ ràng, dễ follow |
| User mới đã có kinh nghiệm | Muốn tự customize ngay | Template trống, toàn quyền điều chỉnh |
| User drop-off giữa chừng | Lỡ thoát app trước khi setup xong | Vào thẳng Dashboard, không bị force onboarding lại |

## 4. Capabilities Breakdown

### P0 — must have
- Routing thông minh sau đăng nhập: check `onboarding_status` trên tài khoản → phân luồng chính xác.
- Màn 1 — Form tạo ví: tên ví (bắt buộc, max 32 ký tự, có gợi ý mặc định) + số dư ban đầu (≥ 0).
- Màn 2 — Chọn template 6 Hũ: Template A (6 Hũ mặc định, recommended) vs Template B (trống, tự customize); chỉnh tỷ lệ % từng hũ inline; nút "Tiếp tục" disabled khi tổng ≠ 100%.
- Màn 3 — Mục tiêu (optional): 3 mục tiêu gợi ý mặc định + "Khác" tự điền; có nút "Bỏ qua, làm sau".
- Gắn `onboarding_status` vào tài khoản (server-side): drop-off bất kỳ lúc nào = coi là completed.
- Multi-device: thiết bị 2 login vào account đã done onboarding → thẳng Dashboard.

### P1 — should have
- Animation thành công sau tạo ví (dùng `capy-success.json` có sẵn trong assets).
- Progress indicator nhẹ (bước 1/3 → 2/3 → 3/3).
- Thông báo inline hint khi % 6 hũ chưa đủ 100%.
- Tên ví gợi ý mặc định tự điền sẵn (user override được).

### P2 — nice to have
- Cho phép quay lại onboarding từ Settings (xem lại hướng dẫn).
- Confetti/particle animation khi vào Dashboard lần đầu.
- A/B test thứ tự màn: 6 Hũ trước hay Mục tiêu trước.

> P0/P1/P2 là tentative; chốt formal ở `/prd onboarding`.

## 5. Core Flows (Happy Path)

### 5.1 Routing sau đăng nhập

1. User đăng nhập thành công (email/password hoặc Google OAuth).
2. Hệ thống kiểm tra `onboarding_status` trên tài khoản.
3. Nếu `completed` → vào Dashboard chính ngay.
4. Nếu `pending` → chuyển sang Màn 1 (Tạo ví).

```
[Đăng nhập thành công]
         │
         ▼
[Check onboarding_status trên tài khoản]
         │
    ┌────┴────┐
completed  pending
    │          │
    ▼          ▼
Dashboard  [Màn 1: Tạo ví]
```

### 5.2 Màn 1 — Tạo ví đầu tiên

1. User thấy form: tên ví (prefill gợi ý mặc định) + số dư ban đầu (prefill 0).
2. User chỉnh tên ví nếu muốn (tối đa 32 ký tự, bắt buộc).
3. User nhập số dư ban đầu (≥ 0; để trống = 0).
4. User nhấn **"Tạo ví nào! 🐾"**.
5. Hệ thống tạo ví, lưu vào tài khoản.
6. Hiện animation chúc mừng + câu chúc.
7. Tự động chuyển sang Màn 2 sau animation.

```
[Form: Tên ví + Số dư]
         │
    [Validate]
    ┌────┴────┐
  Lỗi       OK
    │          │
    ▼          ▼
[Thông báo] [Tạo ví]
 inline        │
               ▼
        [Animation 🎉]
               │
               ▼
         [Màn 2: 6 Hũ]
```

### 5.3 Màn 2 — Chọn template 6 Hũ tài chính

1. User thấy 2 option: **Template A** (6 Hũ mặc định, badge "Đề xuất") và **Template B** (Trống — tự điền).
2. User chọn template.
3. Với Template A: hũ đã có tỷ lệ mặc định (xem bảng), user có thể chỉnh inline (chỉ số nguyên); với Template B: tất cả hũ = 0%, user tự điền.
4. Nút **"Tiếp tục"** chỉ active khi tổng % = 100%. Khi chưa đủ: disabled + hint "Còn [X]% chưa phân bổ".
5. User nhấn "Tiếp tục" → sang Màn 3.

**Phân bổ mặc định Template A (từ Stitch):**

| Hũ | % Mặc định |
|---|---|
| Thiết yếu | 55% |
| Tiết kiệm | 10% |
| Giáo dục | 10% |
| Hưởng thụ | 10% |
| Đầu tư | 10% |
| Từ thiện | 5% |

```
[Màn 2: Chọn Template]
    ┌─────────┬─────────┐
Template A  Template B
(6 Hũ mặc  (Trống —
  định)     tự điền)
    └─────────┘
         │
    [Chỉnh % từng hũ]
         │
   Tổng = 100%?
    ┌────┴────┐
   NO        YES
    │          │
    ▼          ▼
[Nút disabled] [Tiếp tục]
 + hint còn X%      │
                    ▼
              [Màn 3: Mục tiêu]
```

### 5.4 Màn 3 — Thiết lập Mục tiêu (Optional)

1. User thấy 3 mục tiêu gợi ý + option "Khác" (tự điền):
   - **Tiết kiệm mua nhà/xe** — Dành cho những dự định lớn trong tương lai gần.
   - **Quản lý chi tiêu hàng ngày** — Tối ưu hóa các khoản chi vặt để sống thảnh thơi hơn.
   - **Tự do tài chính (Đầu tư)** — Học cách để tiền tự làm việc cho bạn một cách bền vững.
   - **Khác** — User tự điền tên mục tiêu.
2. User chọn 1 hoặc nhiều mục tiêu, hoặc nhấn **"Bỏ qua, làm sau"**.
3. Hệ thống cập nhật `onboarding_status = completed` trên tài khoản.
4. User vào Dashboard chính.

```
[Màn 3: Mục tiêu]
  3 gợi ý + "Khác"
         │
    ┌────┴────┐
  Chọn     Bỏ qua
    │          │
    └────┬─────┘
         │
[onboarding_status = completed]
         │
         ▼
     [Dashboard]
```

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | Routing login | `onboarding_status == completed`? | Vào Dashboard | Vào Màn 1 (Tạo ví) |
| D2 | Màn 1 | Tên ví hợp lệ (có giá trị, ≤ 32 ký tự)? | Cho phép tạo ví | Block + show error inline |
| D3 | Màn 1 | Số dư ban đầu ≥ 0? | Cho phép tạo ví | Block + show error inline |
| D4 | Màn 2 | Tổng % các hũ = 100%? | Nút "Tiếp tục" active | Nút disabled + hint còn X% |
| D5 | Màn 2 | User chọn Template A hay B? | A: prefill % mặc định | B: tất cả hũ = 0% |
| D6 | Màn 3 | User chọn mục tiêu hay bỏ qua? | Lưu mục tiêu đã chọn | Không lưu mục tiêu, coi như done |

### 6.2 Scenario Matrix

| Tình huống | Ví | Template 6 Hũ | Mục tiêu | onboarding_status | Dashboard |
|---|---|---|---|---|---|
| Hoàn thành đầy đủ | ✅ | ✅ | ✅ | completed | ✅ full setup |
| Bỏ qua Mục tiêu | ✅ | ✅ | ❌ | completed | ✅ không có mục tiêu |
| Drop-off Màn 2 (ví xong, chưa chọn template) | ✅ | ❌ | ❌ | completed | ✅ empty state 6 Hũ |
| Drop-off Màn 1 (chưa tạo ví) | ❌ | ❌ | ❌ | completed | ✅ empty state ví |
| Thiết bị 2 — tài khoản đã done | — | — | — | completed | ✅ thẳng Dashboard |

### 6.3 State Transitions

```
onboarding_status: pending → completed
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|------|---------|--------------|
| onboarding_status | pending | completed | User hoàn thành Màn 3 (chọn hoặc bỏ qua) HOẶC drop-off (đóng app bất kỳ lúc nào) | Không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Lần sau mở app | Ghi chú |
|---|---|---|---|
| Đóng app tại Màn 1 (chưa nhấn Tạo ví) | Không có ví | Dashboard — empty state ví | Cần xử lý empty state ở Dashboard |
| Đóng app tại Màn 2 (ví đã tạo, chưa chọn template) | Ví đã có, không có template 6 hũ | Dashboard — không có ngân sách 6 hũ | Dashboard cần handle thiếu template |
| Đóng app tại Màn 3 (ví + template đã xong) | Ví + template đã lưu | Dashboard — không có mục tiêu | OK — mục tiêu là optional |
| Login thiết bị thứ 2 | onboarding_status = completed trên server | Dashboard ngay | Không thấy onboarding lại |

### 6.5 Other Edge Cases

- **Tên ví trùng**: Không block — user có thể đặt 2 ví cùng tên. Phân biệt bằng ID nội bộ.
- **Template B — tổng 0%**: Nút "Tiếp tục" disabled; user phải điền đủ 100% mới tiếp tục được.
- **% hũ chỉ nhận số nguyên**: Không cho nhập số thập phân (33.5% → không hợp lệ). Tổng bắt buộc = 100 (số nguyên).
- **Mạng chập chờn khi lưu ví**: Retry tự động; nếu vẫn fail → show "Có lỗi xảy ra, thử lại nhé!" và giữ nguyên form.
- **User xóa nội dung gợi ý tên ví**: Form về empty, validate bắt buộc khi nhấn "Tạo ví nào!".
- **Dashboard empty state — user drop-off trước khi tạo ví**: Dashboard hiện empty state với CTA nổi bật "Tạo ví đầu tiên của bạn 🐾" dẫn thẳng vào màn tạo ví. Không force lại toàn bộ onboarding — chỉ tạo ví đơn lẻ. (Xử lý tại tầng Dashboard, không phải onboarding.)

## 7. Validation, Limits & Wording

### 7.1 Validation Rules

| Field | Rule |
|---|---|
| Tên ví | Bắt buộc; giá trị gợi ý mặc định: "Ví của tôi"; tối đa 32 ký tự; không chỉ toàn khoảng trắng |
| Số dư ban đầu | Tùy chọn (mặc định 0); giá trị ≥ 0; không âm; đơn vị VND (BIGINT) |
| % từng hũ | Số nguyên dương (1–100); không nhận thập phân |
| Tổng % 6 hũ | Phải bằng chính xác 100 để kích hoạt nút Tiếp tục |
| Tên mục tiêu "Khác" | Bắt buộc nếu chọn option "Khác"; tối đa 50 ký tự |

### 7.2 Limits & Quotas

| Tham số | Giá trị | Ghi chú |
|---|---|---|
| Tên ví tối đa | 32 ký tự | |
| Số dư ban đầu | ≥ 0 | Đơn vị: VND (BIGINT) |
| Tổng % 6 hũ | = 100% | Nút Tiếp tục disabled nếu ≠ |
| Thời gian onboarding mục tiêu | ≤ 45 giây | Toàn bộ 3 màn |

### 7.3 Wording Samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Tên ví để trống | "Hãy đặt tên cho ví của bạn nhé! 🌱" | E-OB-01 |
| Tên ví vượt 32 ký tự | "Tên ví tối đa 32 ký tự thôi nha!" | E-OB-02 |
| Số dư ban đầu là số âm | "Số dư không thể nhỏ hơn 0 đâu nhé!" | E-OB-03 |
| Lưu ví thất bại (lỗi mạng) | "Có lỗi xảy ra, thử lại nhé!" | E-OB-04 |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tạo ví đầu tiên thành công | "🎉 Chúc mừng bạn đã tạo ví đầu tiên thành công! Cùng quản lý tài chính với chú capybara nào!" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Hint 6 hũ chưa đủ 100% | "Còn [X]% chưa phân bổ, bạn điều chỉnh thêm nhé!" |
| Hint có thể chỉnh lại sau | "Bạn có thể chỉnh lại tỷ lệ bất cứ lúc nào trong mục Ngân sách" |
| Intro màn Mục tiêu | "Chọn mục tiêu phù hợp để Capy giúp bạn theo dõi nhé!" |
| Nút CTA Màn 1 | "Tạo ví nào! 🐾" |
| Nút CTA Màn 2 | "Tiếp tục" |
| Nút CTA Màn 3 (đã chọn) | "Xong! Bắt đầu thôi!" |
| Nút skip Màn 3 | "Bỏ qua, làm sau" |

## 8. Assumptions

- User đã đăng nhập thành công (auth flow xử lý bởi spec đăng nhập).
- `onboarding_status` là field trên bảng `profiles` (server-side) — không phụ thuộc thiết bị.
- Ví đầu tiên tạo trong onboarding là ví cá nhân (type = `personal`), mặc định là ví mặc định (`is_default = true`).
- Template 6 Hũ trong onboarding tạo ra các budget categories tương ứng trong bảng `budgets` hoặc `categories`.
- Drop-off (đóng app bất kỳ lúc nào) → `onboarding_status` được đánh dấu `completed` ngay khi user bắt đầu flow (hoặc khi app pause/background).
- Tiền tệ: VND duy nhất trong Phase 1.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------:|
| Drop-off trước khi tạo ví → Dashboard empty state confuse user (adoption) | thỉnh thoảng | User không biết làm gì, abandon app sau lần đầu | Dashboard cần empty state rõ ràng: "Tạo ví đầu tiên của bạn ngay!" với CTA nổi bật |
| Tỷ lệ 6 Hũ mặc định không thực tế với thu nhập người dùng VN (process) | thỉnh thoảng | User bỏ qua tính năng 6 Hũ, ngân sách không được dùng | Hiển thị hint "Chỉnh lại bất cứ lúc nào trong Ngân sách"; cân nhắc tỷ lệ phù hợp VN |
| 3 màn onboarding có custom UI phức tạp (6 Hũ + % custom) cần nhiều dev time (timeline) | thỉnh thoảng | Delay MVP release | MVP fallback: chỉ Màn Tạo ví + chọn template đơn giản, custom % chuyển sang post-onboarding |

## 10. Success Criteria (preliminary)

- Tỷ lệ hoàn thành Màn 1 (tạo ví) ≥ 80% user mới.
- Thời gian trung bình hoàn thành cả 3 màn ≤ 45 giây (p50).
- Tỷ lệ user chọn Template A (6 Hũ mặc định) vs Template B → dùng để đánh giá nhu cầu education.
- Tỷ lệ user thiết lập mục tiêu trong onboarding (dù optional) ≥ 40%.

*Final metrics chốt ở `/brd onboarding`.*

## 11. Open Questions

- [x] OQ-1: ✅ **Resolved** — Template 6 Hũ mặc định (từ Stitch): Thiết yếu 55%, Tiết kiệm 10%, Giáo dục 10%, Hưởng thụ 10%, Đầu tư 10%, Từ thiện 5%.
- [x] OQ-2: ✅ **Resolved** — 3 mục tiêu mặc định (từ Stitch): "Tiết kiệm mua nhà/xe", "Quản lý chi tiêu hàng ngày", "Tự do tài chính (Đầu tư)" + "Khác" tự điền.
- [x] OQ-3: ✅ **Resolved** — Tên ví gợi ý mặc định: **"Ví của tôi"**.
- [x] OQ-4: ✅ **Resolved** — Dùng `assets/animations/capy-success.json` có sẵn cho animation thành công.
- [x] OQ-5: ✅ **Resolved** — Dashboard empty state khi user drop-off trước khi tạo ví: hiện CTA "Tạo ví đầu tiên của bạn 🐾", không force lại onboarding. Xử lý tại tầng Dashboard.
- [x] OQ-6: ✅ **Resolved** — % từng hũ chỉ nhận **số nguyên** (không cho thập phân). Tổng = 100 (số nguyên).

## 12. Next Steps

Sau khi BA review + approve brainstorm này:
- `/urd onboarding` — capture user perspective: first-time experience, expected emotions, success feeling
- `/prd onboarding` — chốt P0/P1/P2 scope + release plan
- Resolve OQ-1 và OQ-2 bằng cách xem Stitch design screens trực tiếp

*KHÔNG nhảy thẳng SRS — qua PRD trước.*
