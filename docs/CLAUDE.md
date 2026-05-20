# docs/ — Hướng Dẫn Tổ Chức Tài Liệu

> **Agent**: Đọc file này TRƯỚC KHI tạo bất kỳ tài liệu nào trong `docs/`. Đặt sai chỗ = sai convention.

---

## Cấu trúc tổng quan

```
docs/
├── brainstorms/          ← Ý tưởng thô, output của /brainstorm skill
├── requirements/         ← Tài liệu yêu cầu (URD, BRD)
├── design/               ← Tài liệu thiết kế (PRD, SRS, Specs)
├── plans/                ← Kế hoạch triển khai (implementation plans)
├── architecture/         ← Kiến trúc hệ thống, ADR
├── testing/              ← Tài liệu kiểm thử
└── operations/           ← Vận hành, deployment, runbooks
```

---

## Quick Decision Tree — Tôi đang viết loại doc gì?

```
Có ý tưởng/feature mới cần làm rõ?
    → docs/brainstorms/{feature}/

Ghi lại yêu cầu từ phía user hoặc business?
    → docs/requirements/{feature}/

Spec sản phẩm hoặc spec hệ thống để team dev build?
    → docs/design/{feature}/

Kế hoạch code từng bước (task list, TDD checklist)?
    → docs/plans/{feature}/

Quyết định kiến trúc ảnh hưởng toàn hệ thống?
    → docs/architecture/adr/

System design, diagrams, high-level architecture?
    → docs/architecture/

Kịch bản test, test plan, test report?
    → docs/testing/{feature}/

Hướng dẫn deploy, runbook, fix production, config?
    → docs/operations/runbooks/
```

---

## Chi tiết từng thư mục

### `docs/brainstorms/{feature}/`

| | |
|---|---|
| **Mục đích** | Ghi chép ý tưởng thô, phỏng vấn nghiệp vụ, clarify scope trước khi viết URD/PRD |
| **Output từ skill** | `/brainstorm` |
| **Khi nào tạo** | Luôn là bước đầu tiên cho mọi feature mới — KHÔNG nhảy thẳng vào design/code |
| **Naming** | `{idea-slug}.md` (auto-derive bởi brainstorm skill) |
| **Ví dụ** | `docs/brainstorms/onboarding/hanh-trinh-onboard.md` |

> Mỗi feature có thể có nhiều brainstorm ideas. Không gộp chung vào 1 file.

---

### `docs/requirements/{feature}/`

| | |
|---|---|
| **Mục đích** | User Requirements Document (URD), Business Requirements Document (BRD) |
| **Output từ skill** | `/urd`, `/brd` |
| **Khi nào tạo** | Sau khi brainstorm được BA/PM approve |
| **Naming** | `urd-{feature}.md`, `brd-{feature}.md` |
| **Ví dụ** | `docs/requirements/onboarding/urd-onboarding.md` |

> Không viết URD/BRD khi chưa có brainstorm tương ứng.

---

### `docs/design/{feature}/`

| | |
|---|---|
| **Mục đích** | Product Requirements Document (PRD), System Requirements Spec (SRS), Design Specs |
| **Output từ skill** | `/prd`, `/srs` |
| **Khi nào tạo** | Sau khi URD/BRD hoàn thành. PRD → `/prd`. SRS → `/srs` |
| **Naming** | `prd-{feature}.md`, `srs-{feature}.md`, `{feature}-design.md` |
| **Ví dụ** | `docs/design/auth/login-interface-design.md` |

---

### `docs/plans/{feature}/`

| | |
|---|---|
| **Mục đích** | Implementation plans — task list chi tiết cho agent/dev thực thi |
| **Output từ skill** | `/plan` hoặc agent tự tạo |
| **Khi nào tạo** | Khi agent chuẩn bị bắt tay vào code một feature |
| **Naming** | `{feature}-plan.md`, `{YYYY-MM-DD}-{feature}-plan.md` |
| **Ví dụ** | `docs/plans/auth/login-interface-plan.md` |
| **Format** | Dùng checkbox `- [ ]` theo từng task/step. Hỗ trợ superpowers:executing-plans |

---

### `docs/architecture/`

| | |
|---|---|
| **Mục đích** | Tài liệu kiến trúc cross-feature, không thuộc về 1 feature cụ thể |
| **Khi nào tạo** | Quyết định kỹ thuật ảnh hưởng toàn hệ thống |
| **Subfolders** | `docs/architecture/` cho system design · `docs/architecture/adr/` cho ADR |
| **Naming (ADR)** | `YYYY-MM-DD-{decision-slug}.md` |
| **Ví dụ** | `docs/architecture/system-design.md` |
| **Ví dụ ADR** | `docs/architecture/adr/2026-05-18-oauth-android-resolution.md` |

> ADR (Architecture Decision Record) = document ghi lại vấn đề kỹ thuật, nguyên nhân, giải pháp đã chọn và lý do. Tạo ADR cho mọi quyết định kỹ thuật quan trọng.

---

### `docs/testing/{feature}/`

| | |
|---|---|
| **Mục đích** | Test plans, test cases, test reports |
| **Khi nào tạo** | Song song với docs/design, trước khi agent bắt đầu code |
| **Naming** | `test-plan-{feature}.md`, `test-cases-{feature}.md` |
| **Ví dụ** | `docs/testing/onboarding/test-plan-onboarding.md` |

---

### `docs/operations/`

| | |
|---|---|
| **Mục đích** | Hướng dẫn deploy, runbooks, incident resolution, cấu hình production |
| **Khi nào tạo** | Mọi tài liệu liên quan đến vận hành, không phải development |
| **Subfolders** | `docs/operations/runbooks/` cho step-by-step guides |
| **Naming** | `YYYY-MM-DD-{slug}.md` cho incident records |
| **Ví dụ** | `docs/operations/runbooks/oauth-android-fix.md` |

---

## Quy tắc đặt tên file

| Loại tài liệu | Convention |
|---|---|
| Brainstorm | `{idea-slug}.md` (slug tiếng Việt OK, kebab-case) |
| URD / BRD | `urd-{feature}.md` / `brd-{feature}.md` |
| PRD / SRS | `prd-{feature}.md` / `srs-{feature}.md` |
| Design spec | `{feature}-design.md` |
| Implementation plan | `{feature}-plan.md` |
| ADR / Incident | `YYYY-MM-DD-{slug}.md` |
| Test plan | `test-plan-{feature}.md` |

---

## Quy tắc feature slug

- Feature slug = tên domain chính, kebab-case ASCII, tối đa 30 ký tự
- Ví dụ: `onboarding`, `auth`, `wallet`, `budget`, `dashboard`, `transaction`
- Cross-feature hoặc không thuộc 1 feature cụ thể → dùng `architecture/` hoặc `operations/`

---

## Liên kết các workflow

```
/brainstorm → docs/brainstorms/{feature}/
/urd        → docs/requirements/{feature}/
/brd        → docs/requirements/{feature}/
/prd        → docs/design/{feature}/
/srs        → docs/design/{feature}/
/plan       → docs/plans/{feature}/
```
