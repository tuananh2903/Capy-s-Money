# Stitch Design Spec — Dashboard Mobile (Home)

| Mục | Giá trị |
|-----|---------|
| **Stitch Project ID** | `15272842135916552597` |
| **Screen name** | `Dashboard / Home` |
| **Platform** | Mobile — iOS & Android (React Native) |
| **Frame** | 390 × 844 pt (iPhone 14 baseline), safe area respected |
| **Trạng thái tài liệu** | Spec ✅ · Preview HTML ✅ · **Frame trên Stitch ✅ Có** |
| **Preview local** | Mở `docs/design/dashboard/preview/home-dashboard.html` trong trình duyệt |
| **Generate Stitch** | `node scripts/stitch-generate-dashboard.mjs` (sau khi set `STITCH_API_KEY`) |
| **Tham chiếu** | [Brainstorm mockup](https://lh3.googleusercontent.com/aida/ADBb0uhRhWJ26ifer82D0pan53TpIzzGWOE8B-to5zgCUbnc8x-iyWPKruhW-3XjBN2BiKzsb9Ls7pX_fdURJNGAN6VRp5xtFLQoivDlAo7_9Thqh8cxPZRP4nE_ixXOKGNGfJEKOKHOaeFYvcMDvO5MtcrHonsBZINoTuXHrqo3guBB2U1SYuxNcncWepLjRR8g4KFsG3LcDbWd5AJjEILJ6AWM_ZTP_NBRSsDu-3YQjqIRsuSO2ycG7sdFL05r) |
| **Design tokens** | `DESIGN.md` (repo root) |

---

## 1. Mục tiêu màn hình

Dashboard là **Home** sau đăng nhập/onboarding. Người dùng trong **&lt; 3 giây** nắm được:

1. Đang xem ví nào (cá nhân / chung)
2. Số dư tổng và “sức khỏe” tài chính tháng này
3. Tiến độ 6 hũ + cảnh báo (nếu có)
4. Cách ghi giao dịch nhanh (FAB / tab Add)

**Cảm giác:** radical friendliness — không dashboard “ngân hàng”, mà companion capybara chill.

---

## 2. Design tokens (bắt buộc trên Stitch)

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `background` | `#FFF8F7` | Nền toàn màn |
| `surface-container` | `#FDE9EA` | Tab bar, chip inactive |
| `primary` | `#864E5A` | FAB, label active, icon accent |
| `primary-container` | `#FFB7C5` | Progress NORMAL, avatar ring |
| `secondary-container` | `#FE9DA9` | Alert “Tiêu dùng nhanh!” |
| `error` | `#BA1A1A` | Alert “Vượt hạn mức!” |
| `on-surface` | `#23191A` | Headline, số tiền |
| `on-surface-variant` | `#514345` | Subtitle, secondary text |
| `outline-variant` | `#D6C2C4` | Border card, divider |
| Card border | `#FFDDE2` | 1px trên balance & jar cards |
| Shadow | `0 8px 24px rgba(255,183,197,0.2)` | Cards — **không shadow đen** |

**Typography:** Plus Jakarta Sans only.

| Style | Size / Weight | Dùng cho |
|-------|---------------|----------|
| `headline-md` | 24 / 600 | Section title |
| `body-md` | 16 / 400 | Jar amounts |
| `label-md` | 14 / 600 | Wallet pills, tabs |
| `label-sm` | 12 / 500 | Subtitle header |
| Balance amount | 34 / 700 | Số dư chính |

**Radius:** Card `32px`, pill/button `9999px`, progress bar `9999px`, FAB `28px` (circle 56×56).

**Spacing:** margin ngang `20px`, section gap `24px`, card padding `24px`.

---

## 3. Cấu trúc màn hình (Z-order)

```
┌─────────────────────────────────────┐  ← Safe area top
│ HEADER (fixed, không scroll)        │
├─────────────────────────────────────┤
│ SCROLL (vertical)                   │
│  ├─ Total Balance Card (Gradient)   │
│  ├─ Wallet Switcher (horizontal)    │
│  ├─ Balance Hero Card (Wallet detail)│
│  ├─ Capy Quote Card (mascot)        │
│  ├─ Section: "6 hũ tháng này"       │
│  └─ Jar Grid (2 cột × 3 hàng)       │
├─────────────────────────────────────┤
│ FAB (+) — góc phải, trên tab bar    │
│ BOTTOM TAB BAR (fixed)              │
└─────────────────────────────────────┘
```

**Thứ tự sắp xếp:** Header → Total Balance Card → Wallet Switcher → Balance Hero Card → Quote → Jars.

---

## 4. Chi tiết từng vùng

### 4.1 Header (64px + safe area)

| Thành phần | Spec |
|------------|------|
| Trái | Avatar tròn 40px, nền `primary-container`, emoji/icon capybara 🦦 hoặc ảnh user |
| Giữa | Title: **"Capy's Money"** — 18px bold `on-surface` · Subtitle: **"Tài chính thảnh thơi ✨"** — 11px `on-surface-variant` |
| Phải | Nút chuông 40px tròn, nền `surface-container-high` (#F7E4E5), icon notification outline chunky 2.5pt |

Border bottom: 1px `outline-variant`, không shadow.

---

### 4.2 Total Balance Card

Card hiển thị tổng số dư của tất cả các ví (chung + riêng), tương tự banner màu xanh trong ảnh tham chiếu nhưng dùng palette Capy.
- **Visual:** Gradient từ `primary-container` (#FFB7C5) sang `secondary-container` (#FE9DA9), radius **32px**, padding **24px**, shadow pink.
- **Nội dung:**
  - Label: **"Tổng số dư"** hoặc **"Tài khoản của tôi"** — 13px semibold `on-surface`.
  - Amount: **"24.900.000 đ"** — 28px bold `on-surface` kèm icon 👁️ (eye toggle) để ẩn/hiện số dư.

---

### 4.3 Wallet Switcher

- Horizontal scroll, gap `12px`, padding ngang `20px`
- **Pill card** mỗi ví: min-width ~140px, height 44px, radius `9999px`, padding H `16px`

| State | Visual |
|-------|--------|
| **Active** | Gradient `primary-container` → `secondary-container`, border 2px `primary`, opacity 100%, icon ✓ tròn nhỏ bên phải |
| **Inactive** | Nền `#FFFFFF`, border 1px `outline-variant`, opacity 60% |

- Icon: 👤 ví cá nhân · 👥 ví chung
- Text: tên ví, `label-md`, truncate 1 dòng

**Microcopy khi chuyển ví:** toast **"Đã chuyển sang [Tên Ví]"** (PRD §6.2).

---

### 4.4 Balance Hero Card (Chi tiết ví được chọn)

Card hiển thị chi tiết số dư và thu chi của ví hiện đang mở (theo ảnh tham chiếu thứ nhất).
- **Visual:** Card full-width, radius **32px**, padding **24px**, nền `#FFFFFF`, border `#FFDDE2`, shadow pink.
- **Nội dung phần trên:**
  - Label: **"Số dư hiện tại"** (của ví đang mở) — 13px semibold `on-surface-variant`.
  - Amount: **"12.450.000 đ"** — 30px bold `on-surface` (phông chữ lớn nổi bật).
  - Status chip: Một trong ba trạng thái (dynamic) như "Tài chính ổn định", nằm ở góc trên bên phải.
- **Đường phân cách:** Divider mỏng 1px `#outline-variant` nằm ngang.
- **Nội dung phần dưới:** chia làm 2 cột:
  - Cột trái: **"Thu nhập"** (Label 12px) + **"+25.000.000 đ"** (Amount 14px bold màu xanh lá cây hoặc `primary`).
  - Cột phải: **"Đã chi tiêu"** (Label 12px) + **"-12.550.000 đ"** (Amount 14px bold màu đỏ gạch hoặc `error` text).

| Điều kiện Status Chip | Chip text | Màu chip |
|-----------|-----------|----------|
| Có hũ OVER_BUDGET | "Có hũ vượt ngân sách" | `error` container |
| Có hũ SPENDING_TOO_FAST | "Chi tiêu đang nhanh" | `secondary-container` |
| Còn lại | "Tài chính ổn định" | `primary-container` text `primary` |

---

### 4.4 Capy Quote Card

- Layout: mascot trái (80×80), bubble phải
- Nền card: `surface-container-low` (#FFF0F1), radius 24px, padding 16px
- Bubble copy (dynamic):

| Trạng thái | Lời thoại gợi ý |
|------------|-----------------|
| Bình thường | "Hãy quản lý tài chính thật chill cùng Capy mỗi ngày nhé!" |
| Tiêu nhanh | "Hũ đang chạy hơi nhanh — thở sâu một nhịp rồi xem lại chi tiêu nhé!" |
| Vượt hạn mức | "Có hũ đã vượt mức rồi — Capy ở đây, mình cùng điều chỉnh nhé." |

Mascot: friendly capybara illustration — soft, không realistic.

---

### 4.5 Section — 6 hũ

**Title:** **"Phân phối 6 Hũ Tài Chính"** — `headline-md`, margin top 24px.

**Layout:** Grid 2 cột, gap 12px, mỗi ô là **Jar Card** (min-height ~120px).

#### Jar Card (mỗi hũ)

| Hàng | Nội dung |
|------|----------|
| 1 | Dot màu 12px + Tên hũ + `(allocation%)` — ví dụ **"Thiết yếu (55%)"** |
| 2 | **"{spent} / {limit} đ"** — `body-md` |
| 3 | Progress bar: track `#F1DEDF` 8px cao, fill bo tròn full |
| 4 | Alert label hoặc spacer 16px |

**6 hũ — tên & màu accent (Stitch swatches)**

| Code | Tên hiển thị | Accent (jar dot / fill NORMAL) |
|------|--------------|--------------------------------|
| NEC | Thiết yếu | `#FFB7C5` |
| LTSS | Tiết kiệm | `#A8DFCE` |
| FFA | Tự do tài chính | `#FFD4A8` |
| EDU | Giáo dục | `#B4CAFF` |
| PLAY | Hưởng thụ | `#FCB7FF` |
| GIVE | Cho đi | `#C8B7FF` |

**Progress fill theo alert (SRS §5.2)**

| Status | Fill color | Label | Icon |
|--------|------------|-------|------|
| NORMAL | Màu accent hũ hoặc `#FFB7C5` | — | — |
| SPENDING_TOO_FAST | `#FE9DA9` | **"Tiêu dùng nhanh!"** | bolt |
| OVER_BUDGET | `#BA1A1A` | **"Vượt hạn mức!"** | warning |

**Empty state** (`budget_limit = 0`):

- Progress xám `#E8D6D7`
- Text: **"Chưa cài đặt hạn mức tháng"**
- Text link/button nhỏ: **"Cài đặt hạn mức"** → Jar Settings (out of scope frame, chỉ link)

---

### 4.6 FAB (Floating Action Button)

- Vị trí: bottom-right, `right: 20px`, `bottom: 90px` (hạ thấp xuống một chút để không che hũ Đầu tư / Cho đi)
- Size: 48×48 (bản nhỏ hơn để tối ưu không gian, không che khuất phần tử khác)
- Icon: **+** 24px white semibold
- Chỉ hiện khi tab **Home** active (ẩn trên Ledger/Budget nếu product quyết vậy — MVP: luôn hiện trên Home tab)

**Hành vi:** mở frame **Quick Add Bottom Sheet** (§5).

---

### 4.7 Bottom Tab Bar

Height ~72px + safe area, nền `#FFFFFF` 90% + blur nhẹ (glass optional), top border `outline-variant`.

| Tab | Label | Ghi chú |
|-----|-------|---------|
| 1 | **Home** | Active: `primary` + underline pill 4px |
| 2 | **Ledger** | Inactive: `on-surface-variant` |
| 3 | **Budget** | Inactive: `on-surface-variant` |
| 4 | **Wallets** | Inactive: `on-surface-variant` |

Icon style: rounded duotone, 24px, stroke 2.5pt — không góc vuông.

---

## 5. Frame phụ: Quick Add Bottom Sheet

Tạo **frame riêng** trên Stitch: `Dashboard — Quick Add`.

- Overlay: `rgba(35, 25, 26, 0.35)` + blur 12px
- Sheet: nền `#FFF8F7`, top radius **32px**, drag handle 40×4px `outline-variant` centered
- Max height ~85% viewport

| Block | Spec |
|-------|------|
| Title | **"Thêm giao dịch"** — `headline-md` |
| Tabs | Pill segment: **"Khoản chi"** | **"Khoản thu"** — chi mặc định selected |
| Amount | Input lớn centered, placeholder **"0 đ"**, tertiary bg `#E3C2C7` 20% |
| Jar picker | Horizontal chips 6 hũ, selected = `primary-container` border `primary` |
| Category | Grid 2 cột subcategory theo hũ chọn |
| Date | Row **"Ngày"** + value **"Hôm nay"** + chevron |
| Note | Optional, max 200 ký tự, hint **"Ghi chú (tuỳ chọn)"** |
| CTA | Full-width pill **"Lưu giao dịch"** gradient primary → secondary |

**Error inline (PRD):**

- Amount = 0: **"Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại."**

---

## 6. States cần export trên Stitch

| # | Frame variant | Mô tả |
|---|---------------|-------|
| 1 | `Home — Default` | 1 ví active, jars NORMAL, balance ổn định |
| 2 | `Home — Spending Fast` | Ít nhất 1 jar SPENDING_TOO_FAST |
| 3 | `Home — Over Budget` | Ít nhất 1 jar OVER_BUDGET |
| 4 | `Home — Multi Wallet` | ≥3 wallet pills, 1 inactive |
| 5 | `Home — Empty Jars` | Chưa setup limit |
| 6 | `Home — Loading` | Skeleton cards (optional) |
| 7 | `Quick Add — Expense` | Sheet mở, tab chi |
| 8 | `Quick Add — Income` | Tab thu selected |

---

## 7. Accessibility

- Touch target tối thiểu 44×44pt (wallet pills, tabs, FAB)
- Contrast alert đỏ `#BA1A1A` trên nền sáng ≥ 4.5:1 cho label
- Alert không chỉ dựa màu: luôn có **text + icon**
- Screen reader: balance đọc đủ "X triệu đồng", progress có `aria-valuenow`

---

## 8. Prompt Stitch (copy-paste)

Dùng trong Stitch project `15272842135916552597`:

```
Design a mobile finance app home dashboard screen (390×844) for "Capy's Money".

Style: soft-modern minimalism, radical friendliness, capybara companion vibe — NOT corporate banking.
Design system: Plus Jakarta Sans typography, warm off-white background #FFF8F7, pastel pink primary #864E5A and container #FFB7C5, pill-shaped everything (32px card radius, full pill buttons), pink-tinted shadows rgba(255,183,197,0.2), no pure black or harsh colors.

Layout top to bottom:
1. Header: capybara avatar left, app title "Capy's Money" + subtitle "Tài chính thảnh thơi", notification bell right.
2. Horizontal scroll wallet switcher pills (personal 👤 and shared 👥 wallets), active wallet with pink gradient border and checkmark.
3. Large balance card: "Số dư hiện tại", big VND amount, status chip "Tài chính ổn định".
4. Friendly quote card with capybara mascot and speech bubble in Vietnamese.
5. Section title "Phân phối 6 Hũ Tài Chính" then 2-column grid of 6 jar budget cards, each with name, spent/limit amounts, rounded progress bar, soft pastel jar colors (pink, mint, peach, blue, lavender, purple).
6. Floating pink gradient + button on the bottom left (left: 20px, bottom: 120px).
7. Bottom tab bar with 4 tabs: Home, Ledger, Budget, Wallets.

Include one jar card showing warning state "Tiêu dùng nhanh!" with coral progress #FE9DA9 and bolt icon.
Vietnamese UI copy throughout. Airy spacing, 20px side margins, 24px card padding.
```

---

## 9. Đồng bộ code hiện tại

Implementation tham chiếu: `src/screens/DashboardScreen.tsx`. Sau khi có frame Stitch final, chạy **stitch-alignment-checker** so khớp tokens và layout §3–§4.

**Lệch cần lưu ý khi design:**

- Tab bar đang dùng label tiếng Anh (Home/Ledger) — Stitch nên dùng **tiếng Việt** nếu product chốt localization: Trang chủ / Sổ giao dịch / Thêm / Ngân sách / Ví.
- Header bell hiện gắn sign-out tạm — design đúng là **notifications**.

---

*Maintainer: design từ PRD `prd-dashboard.md`, SRS `srs-dashboard.md`, brainstorm `main-dashboard.md`.*
