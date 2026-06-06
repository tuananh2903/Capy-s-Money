# CLAUDE.md — Capy's Money

# Expo HAS CHANGED

## Running Tests

```bash
# Run all tests
node tests/run-all.js

# Run individual test files
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

## Architecture

The project is organized into several core components:

- **agents/** - Specialized subagents for delegation (planner, code-reviewer, tdd-guide, etc.)
- **skills/** - Workflow definitions and domain knowledge (coding standards, patterns, testing)
- **commands/** - Slash commands invoked by users (/tdd, /plan, /e2e, etc.)
- **hooks/** - Trigger-based automations (session persistence, pre/post-tool hooks)
- **rules/** - Always-follow guidelines (security, coding style, testing requirements)
- **mcp-configs/** - MCP server configurations for external integrations
- **scripts/** - Cross-platform Node.js utilities for hooks and setup
- **tests/** - Test suite for scripts and utilities

## Key Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Implementation planning
- `/e2e` - Generate and run E2E tests
- `/code-review` - Quality review
- `/build-fix` - Fix build errors
- `/learn` - Extract patterns from sessions
- `/skill-create` - Generate skills from git history

## Development Notes

- Package manager detection: npm, pnpm, yarn, bun (configurable via `CLAUDE_PACKAGE_MANAGER` env var or project config)
- Cross-platform: Windows, macOS, Linux support via Node.js scripts
- Agent format: Markdown with YAML frontmatter (name, description, tools, model)
- Skill format: Markdown with clear sections for when to use, how it works, examples
- Skill placement: Curated in skills/; generated/imported under ~/.claude/skills/. See docs/SKILL-PLACEMENT-POLICY.md
- Hook format: JSON with matcher conditions and command/notification hooks

## Contributing

Follow the formats in CONTRIBUTING.md:
- Agents: Markdown with frontmatter (name, description, tools, model)
- Skills: Clear sections (When to Use, How It Works, Examples)
- Commands: Markdown with description frontmatter
- Hooks: JSON with matcher and hooks array

File naming: lowercase with hyphens (e.g., `python-reviewer.md`, `tdd-workflow.md`)

## Skills

Use the following skills when working on related files:

| File(s) | Skill |
|---------|-------|
| `README.md` | `/readme` |
| `.github/workflows/*.yml` | `/ci-workflow` |

When spawning subagents, always pass conventions from the respective skill into the agent's prompt.

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## KHÔNG TỰ Ý SỬA ĐỔI FILE NÀY TRỪ KHI CÓ SỰ CHỈ DẪN RÕ RÀNG.

Các hướng dẫn về hành vi để giảm thiểu các lỗi lập trình LLM thường gặp. Kết hợp với các hướng dẫn cụ thể của dự án khi cần thiết.

**Sự đánh đổi:** Các hướng dẫn này ưu tiên sự thận trọng hơn tốc độ. Đối với các nhiệm vụ đơn giản, hãy sử dụng khả năng phán đoán.

## 1. Suy nghĩ trước khi lập trình

**Đừng giả định. Đừng che giấu sự nhầm lẫn. Hãy nêu rõ các sự đánh đổi.**

Trước khi thực hiện:

- Nêu rõ các giả định của bạn. Nếu không chắc chắn, hãy hỏi.

- Nếu có nhiều cách hiểu khác nhau, hãy trình bày chúng - đừng chọn một cách im lặng.

- Nếu có một cách tiếp cận đơn giản hơn, hãy nói ra. Phản đối khi cần thiết.

- Nếu có điều gì đó không rõ ràng, hãy dừng lại. Nêu rõ điều gì gây nhầm lẫn. Hãy hỏi.

## 2. Đơn giản là trên hết

**Mã tối thiểu giải quyết được vấn đề. Không có gì mang tính suy đoán.**

- Không có tính năng nào vượt quá yêu cầu.

- Không có sự trừu tượng hóa cho mã chỉ sử dụng một lần.

- Không có "tính linh hoạt" hoặc "khả năng cấu hình" nào không được yêu cầu.

- Không có xử lý lỗi cho các trường hợp bất khả thi.

- Nếu bạn viết 200 dòng mà có thể rút gọn xuống 50 dòng, hãy viết lại.

Hãy tự hỏi: "Một kỹ sư cấp cao có cho rằng đoạn mã này quá phức tạp không?" Nếu có, hãy đơn giản hóa.

## 3. Thay đổi có chọn lọc

**Chỉ chỉnh sửa những gì cần thiết. Chỉ dọn dẹp những lỗi do chính mình gây ra.**

Khi chỉnh sửa mã hiện có:

- Không "cải thiện" mã, chú thích hoặc định dạng liền kề.

- Không chỉnh sửa lại những thứ không bị lỗi.

- Tuân theo phong cách hiện có, ngay cả khi bạn muốn làm theo cách khác.

- Nếu bạn nhận thấy mã chết không liên quan, hãy đề cập đến nó - đừng xóa nó.

Khi các thay đổi của bạn tạo ra các dòng mã mồ côi:

- Loại bỏ các import/biến/hàm mà các thay đổi CỦA BẠN đã khiến chúng không được sử dụng.

- Không xóa mã chết đã tồn tại trừ khi được yêu cầu.

Bài kiểm tra: Mỗi dòng được thay đổi phải trực tiếp dẫn đến yêu cầu của người dùng.

## 4. Thực thi theo mục tiêu

**Xác định tiêu chí thành công.** Lặp lại cho đến khi được xác minh.**

Chuyển đổi các nhiệm vụ thành các mục tiêu có thể kiểm chứng:
- "Thêm xác thực" → "Viết các bài kiểm tra cho các đầu vào không hợp lệ, sau đó làm cho chúng vượt qua"
- "Sửa lỗi" → "Viết một bài kiểm tra để tái tạo lỗi, sau đó làm cho nó vượt qua"
- "Tái cấu trúc X" → "Đảm bảo các bài kiểm tra vượt qua trước và sau khi"

Đối với các nhiệm vụ nhiều bước, hãy nêu một kế hoạch ngắn gọn:

```
1. [Bước] → xác minh: [kiểm tra]

2. [Bước] → xác minh: [kiểm tra]

3. [Bước] → xác minh: [kiểm tra]

```

Tiêu chí thành công mạnh mẽ cho phép bạn lặp lại độc lập. Tiêu chí yếu ("làm cho nó hoạt động") yêu cầu làm rõ liên tục.

---

**Những hướng dẫn này hoạt động nếu:** ít thay đổi không cần thiết trong diff, ít viết lại do quá phức tạp và các câu hỏi làm rõ được đưa ra trước khi thực hiện chứ không phải sau khi mắc lỗi.

> **Nguồn sự thật duy nhất** cho mọi AI agent làm việc trong repo này.  
> Đọc toàn bộ file này trước khi viết bất kỳ dòng code nào.

---

## 0. Quick Reference

| Mục | Nội dung |
|-----|---------|
| **Stack** | React Native (Expo SDK 54) + Supabase + WatermelonDB |
| **Design** | Stitch Design System — Plus Jakarta Sans, Pastel Pink (#FFB7C5) |
| **DB** | PostgreSQL (Supabase) — RLS trên mọi table |
| **Auth** | Supabase Auth (JWT/OTP) |
| **Docs Expo** | https://docs.expo.dev/versions/v54.0.0/ |
| **System Design** | `capy-money-system-design.md` |
| **Brainstorm** | `/brainstorm` — `.claude/skills/brainstorm/SKILL.md` |

---

## 1. Expo — RULE BẮT BUỘC

> **Expo HAS CHANGED.** Luôn đọc docs versioned **v54.0.0** trước khi viết code.

```
https://docs.expo.dev/versions/v54.0.0/
```

- Không assume API từ version cũ (< 54).
- Không dùng `expo-cli` — dùng `npx expo`.
- Build → EAS Build (`eas build`), không `expo build`.
- Push notification → `expo-notifications` SDK 54 API.

---

## 2. Product — Capy's Money

### 2.1 Vision

Capy's Money là **ứng dụng quản lý tài chính cá nhân** thân thiện như chính con capybara — thư giãn, không gây áp lực, nhưng giúp người dùng nắm rõ từng đồng chi tiêu.

**Target**: 10,000 users (Phase 1: 0→1,000 trên Supabase Free).  
**Platform**: Mobile (React Native) → Phase 2+ Web.  
**Monetization**: Free → Freemium + Premium.

### 2.2 Core Features (Phase 1 — MVP)

| Feature | Mô tả |
|---------|-------|
| **Ví cá nhân** | Tạo tối đa 2 ví (free tier) |
| **Ví chung** | 1 ví chung, tối đa 3 thành viên |
| **Giao dịch** | Thu / Chi / Chuyển khoản — nhập tay |
| **Ngân sách** | Tối đa 3 budget alerts (free tier) |
| **Báo cáo** | Tháng/năm — 1–3 phút delay (pre-aggregated) |
| **Offline** | ✅ WatermelonDB local sync |
| **Notifications** | Push: budget alert, lời mời ví chung |

### 2.3 Freemium Gating

| Feature | Free | Premium |
|---------|------|---------|
| Ví cá nhân | 2 | Unlimited |
| Ví chung | 1 | Unlimited |
| Thành viên/ví chung | 3 | 10 |
| Lịch sử | 3 tháng | Unlimited |
| Export CSV/PDF | ❌ | ✅ |
| Bank sync | ❌ | ✅ |
| AI categorization | ❌ | ✅ |
| Budget alerts | 3 | Unlimited |
| Widgets | ❌ | ✅ |

**Gate tại**: `profiles.tier` → RLS + Edge Function check.

---

## 3. Design System — Stitch (Source of Truth)

> **Stitch Project ID**: `15272842135916552597`  
> Mọi UI mới phải match design system này. Không tự ý đổi màu hay font.

### 3.1 Brand Identity

Capy's Money là **radical friendliness** — Finance thường gây lo âu; app này phải cảm giác như người bạn đồng hành nhẹ nhàng, không phải công cụ khô khan.

**Aesthetic**: Soft-Modern Minimalism — airy, optimistic, organic shapes, gentle colors.

### 3.2 Color Palette

```
Primary (Pastel Pink):   #864e5a  /  container: #ffb7c5
Secondary (Soft Coral):  #944652  /  container: #fe9da9
Background:              #fff8f7  (warm off-white, NOT pure white)
Surface:                 #fff8f7
On-Surface:              #23191a  (warm dark brown, NOT black)
Error:                   #ba1a1a  /  container: #ffdad6
Outline:                 #837375
```

**Quy tắc màu:**
- Không dùng màu thuần túy (red, blue, green thô).
- Shadows dùng tint hồng: `rgba(255, 183, 197, 0.2)` — KHÔNG shadow đen.
- Background blend: luôn có tông ấm, tránh trắng lạnh.

### 3.3 Typography

**Font duy nhất**: **Plus Jakarta Sans** (Google Fonts) — dùng cho headline, body, label.

| Token | Size | Weight | Line Height |
|-------|------|--------|-------------|
| `headline-xl` | 40px | 700 | 1.2 |
| `headline-lg` | 32px | 700 | 1.2 |
| `headline-md` | 24px | 600 | 1.3 |
| `body-lg` | 18px | 400 | 1.6 |
| `body-md` | 16px | 400 | 1.6 |
| `label-md` | 14px | 600 | 1.4 (letter-spacing: 0.02em) |
| `label-sm` | 12px | 500 | 1.4 |

### 3.4 Spacing (8px Scale)

```
xs: 4px  |  sm: 12px  |  base: 8px  |  md: 24px
lg: 40px  |  xl: 64px
margin-mobile: 20px  |  margin-desktop: 48px  |  gutter: 16px
```

### 3.5 Shapes — Pill-First

- **Cards**: minimum `borderRadius: 32` (2rem)
- **Buttons**: fully pill-shaped (`borderRadius: 9999`)
- **Inputs**: fully rounded, filled style với tertiary light pink background
- **Standard radius**: `sm: 8px | default: 16px | md: 24px | lg: 32px | xl: 48px | full: 9999px`

**Không dùng sharp corners** — mọi element phải rounded.

### 3.6 Elevation & Depth ("Pillowy")

```
Level 0 (Background): #fff8f7
Level 1 (Cards): shadow — blur 24px, color rgba(255,183,197,0.2)
Level 2 (Active): scale(1.02) + tăng shadow spread
Overlays: backdrop-filter: blur — "light as air"
```

### 3.7 Component Rules

**Buttons**: Large, pill, gradient primary→secondary. Text semi-bold.  
**Cards**: 32px radius, 1px border `#FFDDE2`, diffused shadow, 24px inner padding.  
**Inputs**: Rounded filled, tertiary bg, focus = 2px glow primary pink.  
**Icons**: Chunky & rounded — 2.5pt stroke, no sharp 90° angles, filled-duotone style.  
**Charts**: Bar charts = pill-shaped bars. Line charts = smooth Bezier (no jagged points).  
**Progress Bars**: Fully rounded ends.

---

## 4. Tech Stack

| Layer | Technology | Ghi chú |
|-------|-----------|---------|
| Mobile | **React Native + Expo SDK 54** | Cross-platform, EAS Build |
| Backend | **Supabase** (PostgREST) | Auto-generated API từ schema |
| Database | **PostgreSQL** (Supabase managed) | ACID, RLS, pg_cron |
| Auth | **Supabase Auth** | JWT, OTP, OAuth ready |
| Offline DB | **WatermelonDB** | Built-in sync protocol cho RN |
| Notifications | **Expo Push** + FCM/APNs | 1 API cho iOS + Android |
| Async Jobs | **Supabase Edge Functions** (Deno) | Serverless |
| Scheduling | **pg_cron** (Supabase Pro) | Native Postgres |
| Storage | **Supabase Storage** | Receipts, avatars |
| [Phase 2] Cache | Upstash Redis | Session, report cache |

### Architecture: Lean BaaS Monolith

> Solo dev + Free tier + 10k users = Supabase đủ.  
> KHÔNG microservices cho đến khi có team ≥ 5 hoặc > 500k MAU.

**Nguyên tắc không phá vỡ:**
1. **Stateless API** — PostgREST từ schema, không viết controller thủ công
2. **Security tại DB layer** — mọi rule security = RLS, không chỉ ở app layer
3. **Async cho heavy jobs** — budget check, notification → Edge Function
4. **Offline-first** — SQLite local → sync queue khi có mạng

---

## 5. Database Schema

> Full schema tại `capy-money-system-design.md` — Mục 3.

### Core Tables

```
profiles          — user info, tier (free/premium)
wallets           — ví cá nhân + ví chung
wallet_members    — members của ví chung (owner/editor/viewer)
categories        — hệ thống + custom (income/expense/transfer)
transactions      — giao dịch (soft delete, idempotency key)
budgets           — ngân sách theo period
report_snapshots  — pre-aggregated reports (1-3 min delay)
sync_queue        — offline sync queue
wallet_invitations — lời mời ví chung (7-day TTL)
notification_log  — log push notifications
```

### RLS — KHÔNG ĐƯỢC BỎ QUA

```sql
-- MỌI table phải có RLS enabled
-- Pattern chuẩn cho wallets:
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_access" ON public.wallets
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.wallet_members
      WHERE wallet_id = wallets.id AND user_id = auth.uid()
    )
  );
```

**Rule bắt buộc**: Service Role Key chỉ dùng trong Edge Functions, **KHÔNG BAO GIỜ** expose ra client.

### Tiền tệ

Lưu tiền dưới dạng `BIGINT` (đơn vị: đồng VND). Không dùng `DECIMAL` hay `FLOAT`.

---

## 6. Offline-First Strategy

### Flow

```
User nhập → SQLite local (WatermelonDB) → sync background khi có mạng
         → Supabase sync_queue → Edge Function sync-resolver
         → Check client_id idempotency → INSERT hoặc IGNORE
```

### Conflict Resolution

| Tình huống | Rule |
|-----------|------|
| Cùng `client_id` | Server wins (idempotent) |
| Ví chung: 2 user edit cùng | **Last-write-wins** theo `updated_at` |
| Soft delete + edit | Delete wins |
| Transaction xóa offline | `is_deleted = TRUE` (không DELETE cứng) |

**Idempotency**: Mọi transaction POST phải có `client_id` (UUID từ client).

---

## 7. Notification Architecture

**Trigger sources**: Budget alert → Wallet invite → Monthly summary (pg_cron ngày 1/tháng 8:00 AM)

**Flow**: Edge Function → Expo Push API → FCM/APNs → INSERT `notification_log`

**Push Token**: Lưu trong `profiles.push_token`, update mỗi lần app khởi động.

---

## 8. Coding Conventions

### File Structure

```
src/
├── components/     — Reusable UI components
├── screens/        — Screen-level components
└── services/       — API calls, Supabase client, WatermelonDB
```

### TypeScript

- Dùng TypeScript strict mode.
- Generate Supabase types: `supabase gen types typescript`.
- Không dùng `any` — nếu không biết type, dùng `unknown` + type guard.

### React Native / Expo

- Luôn đọc docs **Expo v54** trước khi dùng bất kỳ API nào.
- Dùng `expo-router` cho navigation (file-based routing).
- Dùng `expo-secure-store` cho sensitive data (tokens).
- Không hardcode secrets — dùng `.env` + `expo-constants`.

### Supabase

- Client-side: chỉ dùng `anon` key.
- Edge Functions: dùng `service_role` key (server-side only).
- Mọi query phải rely on RLS — không filter by `user_id` ở app layer nếu RLS đã cover.

### Git

- Commit message: `type(scope): description` (Conventional Commits).
- Không commit secrets, `.env`, `service_role` key.

---

## 9. Security Checklist

> Chạy checklist này khi tạo table mới hoặc thêm Edge Function.

- [ ] RLS enabled trên table mới
- [ ] `service_role` key không xuất hiện trong client code
- [ ] Invitation token: UUID, 7-day TTL, single-use
- [ ] Tiền lưu dạng BIGINT, không FLOAT
- [ ] `client_id` (idempotency) có trong mọi transaction insert
- [ ] Soft delete (`is_deleted`) thay vì DELETE cứng cho financial data
- [ ] Rate limiting trên Edge Functions (TODO Phase 2)
- [ ] Audit log cho UPDATE/DELETE trên `transactions` (TODO Phase 2)

---

## 10. /brainstorm — Skill Workflow

> `/brainstorm` là skill **IT Business Analyst** — dùng để clarify feature trước khi code.

### Khi nào dùng

Bất kỳ feature mới nào cần đi qua `/brainstorm` TRƯỚC khi tạo PRD/SRS/code.

### Cách dùng

```
/brainstorm                          # interactive
/brainstorm <idea>                   # inline
/brainstorm <idea> --shallow         # fast mode
/brainstorm @path/to/file.md         # từ file
```

### Ví dụ cho Capy's Money

```
/brainstorm thêm giao dịch nhanh từ widget màn hình chính
/brainstorm mời thành viên vào ví chung qua link
/brainstorm budget alert khi chi tiêu vượt 80%
/brainstorm báo cáo tháng — export PDF
```

### Skill sẽ làm

1. **Phase A**: Auto-detect feature slug + complexity (external redirect, multi-role, state machine...)
2. **Phase B**: 7-section interview — **1 section/lần**, chờ reply trước khi tiếp
   - Section 1: Overview
   - Section 2: Users & Access
   - Section 3: Core Flow (Happy Path)
   - Section 4: Deep Dive (chỉ khi có complexity) — ASCII flow, scenario matrix, state transitions
   - Section 5: Validation, Limits & **Exact wording** (error/success messages)
   - Section 6: System Context (business-level ONLY)
   - Section 7: Edge cases, Risks, Open Questions
3. **Phase C**: Synthesize + self-check 10-item quality checklist
4. **Phase D**: L1 approval preview → Write file
5. **Phase E**: Loop resolve Open Questions từng câu, cascade scan side-effect

### Output

```
docs/{feature}/brainstorms/{idea-slug}.md
```

### Nguyên tắc IT-BA (KHÔNG vi phạm)

- **KHÔNG hỏi**: DB column name, SDK name, function name, JWT vs session, endpoint URL
- **CHỈ hỏi**: "lưu thông tin gì?", "system làm gì?", "dịch vụ ngoài nào?"
- **No-re-ask**: Scan context + existing doc trước mỗi câu — không hỏi lại câu đã trả lời
- **Push exact values**: "rate limit bao nhiêu/phút", "câu error chính xác là gì"
- **L1 preview**: Prose tự nhiên — KHÔNG bảng tag/flag/checklist kiểu dev

---

## 11. System Design Reference

> **File đầy đủ**: `capy-money-system-design.md`

Đây là nguồn sự thật cho:
- Architecture diagram (Lean BaaS Monolith)
- Full database schema + indexes
- RLS policies pattern
- Offline sync flow + conflict resolution
- Report aggregation pipeline (pg_cron)
- Shared wallet invitation flow
- Freemium feature gating (SQL trigger)
- API design (PostgREST endpoints)
- Scaling roadmap (Phase 1→2→3)
- Trade-offs & risks

**Khi có conflict** giữa CLAUDE.md và `capy-money-system-design.md` → **system design doc thắng** (chi tiết hơn).

---

## 12. Agent Rules Summary

> Đây là tổng hợp quy tắc — không cần hỏi lại user.

| Rule | Chi tiết |
|------|---------|
| Design Alignment | **BẮT BUỘC** follow thiết kế Stitch & tài liệu `/docs`. Nếu có khác biệt, không đồng nhất giữa code product, thiết kế Stitch và tài liệu (PRD, BRD, URD, SRS, plan) -> PHẢI hỏi lại ý kiến USER để thống nhất trước khi code. |
| Expo docs | Luôn đọc https://docs.expo.dev/versions/v54.0.0/ |
| Design system | Follow Stitch — Plus Jakarta Sans, Pastel Pink, pill shapes |
| Colors | Không màu thuần túy — palette từ Mục 3.2 |
| Database | BIGINT cho tiền, UUID cho IDs, soft delete cho financial data |
| RLS | Bắt buộc trên mọi table — không bao giờ skip |
| Secrets | service_role chỉ trong Edge Functions |
| Feature mới | `/brainstorm` trước, rồi mới code |
| Architecture | Lean BaaS Monolith — không microservices |
| Language | Vietnamese-first trong docs/brainstorm output |

---

*Last updated: 2026-05-18 | Maintainer: Tran Tuan Anh*  
*System Design: `capy-money-system-design.md` | Stitch: project/15272842135916552597*
