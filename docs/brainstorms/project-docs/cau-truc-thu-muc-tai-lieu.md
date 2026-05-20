---
type: brainstorm
feature: project-docs
idea_slug: cau-truc-thu-muc-tai-lieu
status: draft
mode: shallow
lang: vi
owner: "@tuananh"
created: 2026-05-18
updated: 2026-05-18
complexity_flags: []
links:
  - docs/CLAUDE.md
tags: [brainstorm, project-docs, documentation]
stale_reason: ""
changelog:
  - 2026-05-18 | /brainstorm | initial — đề xuất Phương án C (hybrid type-first + feature-first), migration thực thi ngay sau approve
---

# Cấu Trúc Thư Mục Tài Liệu — Brainstorm

> Feature: project-docs | Idea: cau-truc-thu-muc-tai-lieu

## 1. Idea Seed

> "Cấu trúc lại thư mục tài liệu cho dự án này sao cho mạch lạc, rõ ràng — chia rõ từng folder riêng: brainstorm, Tài liệu yêu cầu, Tài liệu thiết kế, Tài liệu kiểm thử, Tài liệu triển khai và vận hành. Tham khảo /superpowers."

## 2. Context

- **Vấn đề**: Cấu trúc cũ dùng `docs/superpowers/plans/` và `docs/superpowers/specs/` không phản ánh loại tài liệu, gây nhầm lẫn cho agents và developer.
- **Brainstorm skill convention** hiện tại dùng `docs/{feature}/brainstorms/` (feature-first) — cần đồng bộ với cấu trúc mới.
- **File lạc chỗ**: `capy-money-system-design.md` nằm ở root thay vì trong `docs/architecture/`.
- **Quyết định**: Phương án C — Hybrid (type-first globally, feature-first trong mỗi type).

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| AI Agent | Không biết đặt doc output vào đâu sau khi viết xong | Routing guide rõ ràng theo loại tài liệu |
| Developer | Khó tìm tài liệu khi project scale lên nhiều feature | Folder structure nhất quán, predictable |
| PM/BA | Không phân biệt được brainstorm vs spec vs plan | Tên folder tự giải thích (self-documenting) |

## 4. Capabilities Breakdown

### P0 — must have
- Cấu trúc 7 loại folder rõ ràng: `brainstorms/`, `requirements/`, `design/`, `plans/`, `architecture/`, `testing/`, `operations/`.
- `docs/CLAUDE.md` routing guide cho agents.
- Migration toàn bộ file hiện có sang đúng vị trí.
- Update brainstorm skill output path từ `docs/{feature}/brainstorms/` → `docs/brainstorms/{feature}/`.

### P1 — should have
- Xóa `docs/superpowers/` (naming gây nhầm với tooling framework).
- Move `capy-money-system-design.md` từ root vào `docs/architecture/`.

### P2 — nice to have
- `README.md` trong mỗi subfolder mô tả ngắn.
- Template files mẫu trong mỗi folder.

## 5. Cấu Trúc Được Chọn (Phương Án C — Hybrid)

```
docs/
├── CLAUDE.md              ← Routing guide cho agents
├── brainstorms/           ← /brainstorm output: docs/brainstorms/{feature}/{slug}.md
│   ├── onboarding/
│   │   └── hanh-trinh-onboard.md
│   └── project-docs/
│       └── cau-truc-thu-muc-tai-lieu.md
├── requirements/          ← URD, BRD
├── design/                ← PRD, SRS, Design Specs
│   └── auth/
│       └── login-interface-design.md
├── plans/                 ← Implementation task lists
│   └── auth/
│       └── login-interface-plan.md
├── architecture/          ← Cross-feature, ADR
│   ├── system-design.md
│   └── adr/
│       └── 2026-05-18-oauth-android-resolution.md
├── testing/               ← Test plans
└── operations/            ← Deployment, runbooks
    └── runbooks/
```

## 6. Migration Map

| File cũ | File mới | Lý do |
|---|---|---|
| `docs/onboarding/brainstorms/hanh-trinh-onboard.md` | `docs/brainstorms/onboarding/hanh-trinh-onboard.md` | Đổi sang type-first convention |
| `docs/superpowers/specs/2026-05-17-login-interface-design.md` | `docs/design/auth/login-interface-design.md` | Đúng loại: design spec |
| `docs/superpowers/plans/2026-05-17-login-interface.md` | `docs/plans/auth/login-interface-plan.md` | Đúng loại: implementation plan |
| `docs/superpowers/plans/2026-05-18-oauth-api-key-resolution.md` | `docs/architecture/adr/2026-05-18-oauth-android-resolution.md` | Đúng loại: ADR/technical decision |
| `capy-money-system-design.md` (root) | `docs/architecture/system-design.md` | Không nên ở root |
| `docs/superpowers/specs/2026-05-17-onboarding-brainstorm.md` | **XÓA** | Superseded bởi brainstorm mới |
| `docs/superpowers/plans/2026-05-17-onboarding-implementation.md` | **XÓA** | Tài liệu onboarding cũ, lỗi thời |

## 7. Tradeoffs Đã Cân Nhắc

| | Phương án A (Feature-first) | Phương án B (Type-first) | Phương án C (Hybrid — đã chọn) |
|---|---|---|---|
| Tìm theo feature | ✅ Tốt | ❌ Phải vào nhiều folder | ➖ Trung bình |
| Tìm theo loại doc | ❌ Phải vào nhiều folder | ✅ Tốt | ✅ Tốt |
| Conflict với brainstorm skill | ✅ Không | ❌ Cần sửa skill | ✅ Chỉ đổi path |
| Scale khi nhiều feature | ❌ Khó audit | ✅ Dễ audit | ✅ Dễ audit |

## 8. Assumptions

- Brainstorm skill được update output path → `docs/brainstorms/{feature}/`.
- `docs/CLAUDE.md` là nguồn sự thật duy nhất về routing — agents đọc file này trước khi tạo doc.
- Mỗi feature có thể có nhiều brainstorm ideas và nhiều design docs.
- Không dùng flat date-prefix cho tất cả (chỉ ADR và incident mới cần date).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả | Cách phòng |
|--------|----------|---------|------------|
| Agent đặt sai chỗ vì không đọc CLAUDE.md (adoption) | thỉnh thoảng | Doc không tìm được, inconsistent structure | CLAUDE.md có Quick Decision Tree rõ ràng; update skill description |
| Path cũ bị hardcode đâu đó (process) | hiếm | Brainstorm skill vẫn output sai chỗ | Check và update SKILL.md ngay sau migration |

## 10. Success Criteria (preliminary)

- 100% doc mới được đặt đúng folder theo convention.
- Agents không cần hỏi "đặt doc này ở đâu?" — tự tra `docs/CLAUDE.md`.
- 0 file doc nằm ở root project (ngoài CLAUDE.md, EXAMPLES.md là intentional).

## 11. Open Questions

- [x] OQ-1: ✅ **Resolved** — Phương án C (Hybrid) được chọn.
- [x] OQ-2: ✅ **Resolved** — `capy-money-system-design.md` move vào `docs/architecture/`.
- [x] OQ-3: ✅ **Resolved** — Xóa file onboarding cũ trong superpowers, giữ các file khác.

## 12. Next Steps

- Update `.claude/skills/brainstorm/SKILL.md` output path.
- Update `CLAUDE.md` (root) tham chiếu đến `docs/CLAUDE.md`.
- Tạo `_templates/` bổ sung cho các loại doc còn thiếu (urd.md, prd.md, ...).
