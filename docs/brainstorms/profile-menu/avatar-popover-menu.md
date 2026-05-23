---
type: brainstorm
feature: profile-menu
idea_slug: avatar-popover-menu
status: draft
mode: deep
lang: vi
owner: tuananh
created: 2026-05-23
updated: 2026-05-23
complexity_flags: []
links: []
tags: [brainstorm, profile-menu]
stale_reason: ""
changelog:
  - date: "2026-05-23"
    author: "tuananh"
    message: "khởi tạo tài liệu brainstorm cho menu thả xuống từ avatar"
---

# Menu thả xuống từ Avatar Capy (avatar-popover-menu)

> Feature: profile-menu | Idea: avatar-popover-menu
> 1 feature có thể có nhiều brainstorm — đây là 1 idea/draft độc lập.

## 1. Idea Seed

"icon chuông thông báo kia là thông báo trên app, hiện tại đang là đăng xuất, sửa thành thông báo, các tính năng như đăng xuất, cài đặt, thông tin người dùng sẽ hiển thị 1 droplist khi click vào avatar capy ở bên trái"

*Raw input từ user.*

## 2. Context

- Cần hoàn thiện các tính năng cốt lõi cho bản MVP của ứng dụng Capy's Money.
- Sửa lỗi trải nghiệm người dùng (UX) khi gán chức năng Đăng xuất vào icon Chuông thông báo ở Header.
- Cung cấp nơi truy cập thông tin cá nhân và cài đặt cơ bản của tài khoản người dùng một cách trực quan, gọn gàng.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Tất cả người dùng | Không có nơi xem thông tin cá nhân và cấu hình cài đặt tài khoản; nút đăng xuất bị gán sai vị trí (icon chuông) dễ bấm nhầm. | Truy cập nhanh thông tin cá nhân, cài đặt ngôn ngữ/giao diện, và đăng xuất an toàn qua menu thả xuống dưới avatar Capy. |

## 4. Capabilities Breakdown

### P0 — must have
- Menu thả xuống dạng Popover xuất hiện ngay dưới avatar Capy ở góc trái Header khi bấm vào avatar.
- Đóng menu thả xuống khi người dùng bấm ra ngoài (overlay) hoặc chọn một chức năng.
- Tùy chọn "Thông tin người dùng" mở popup hiển thị: Tên hiển thị (cho phép sửa), Email (chỉ đọc), SĐT (chỉ đọc). Có nút "Lưu" để lưu tên mới lên database.
- Tùy chọn "Cài đặt" mở popup hiển thị: Cấu hình ngôn ngữ (Tiếng Việt / Tiếng Anh) và Giao diện (Sáng / Tối).
- Tùy chọn "Đăng xuất" hiển thị hộp thoại xác nhận đăng xuất.
- Icon chuông thông báo hiển thị popup thông báo thân thiện: "Hiện tại bạn chưa có thông báo mới nào."

### P1 — should have
- Lưu cấu hình ngôn ngữ và giao diện cục bộ (AsyncStorage) trên thiết bị để giữ trạng thái khi mở lại ứng dụng.

### P2 — nice to have
- Tự động đổi biểu cảm avatar Capy trong Header dựa trên tùy chọn giao diện hoặc trạng thái tài chính hiện tại.

## 5. Core Flows (Happy Path)

### 5.1 Luồng mở menu thả xuống và chọn mục

1. Người dùng bấm vào avatar Capy ở góc trái Header của màn hình Dashboard.
2. Hệ thống hiển thị menu thả xuống (Classic Popover) ngay dưới avatar chứa 3 mục: *Thông tin người dùng*, *Cài đặt*, *Đăng xuất* kèm một overlay mờ phía sau.
3. Người dùng chạm vào overlay mờ bên ngoài menu.
4. Hệ thống đóng menu thả xuống.

```
+-----------------------------------+
| [Avatar]  Capy's Money        [🔔] |
|   |                               |
|   v (Click)                       |
| +-------------------+             |
| | 👤 Thông tin      |             |
| | ----------------- |             |
| | ⚙️ Cài đặt         |             |
| | ----------------- |             |
| | 🚪 Đăng xuất      |             |
| +-------------------+             |
|                                   |
|         (Màn hình Dashboard)      |
+-----------------------------------+
```

### 5.2 Luồng xem và sửa Thông tin người dùng

1. Người dùng chọn "Thông tin người dùng" trong menu thả xuống.
2. Hệ thống mở popup modal "Thông tin người dùng" hiển thị: Tên hiển thị (ô nhập liệu), Email (text chỉ hiển thị), SĐT (text chỉ hiển thị).
3. Người dùng nhập tên hiển thị mới (không để trống, tối đa 32 ký tự) và bấm "Lưu".
4. Hệ thống cập nhật trường `display_name` trong bảng `profiles` của database.
5. Hệ thống đóng popup modal và hiển thị thông báo cập nhật thành công.

### 5.3 Luồng cấu hình Cài đặt

1. Người dùng chọn "Cài đặt" trong menu thả xuống.
2. Hệ thống mở popup modal "Cài đặt tài khoản" hiển thị: lựa chọn ngôn ngữ (Tiếng Việt / Tiếng Anh) và tùy chọn giao diện (Sáng / Tối).
3. Người dùng thay đổi tùy chọn (ví dụ: chọn giao diện Tối) và bấm "Lưu".
4. Hệ thống áp dụng cấu hình giao diện mới ngay lập tức, lưu trạng thái xuống AsyncStorage của thiết bị, đóng popup modal và hiển thị thông báo lưu thành công.

### 5.4 Luồng đăng xuất tài khoản

1. Người dùng chọn "Đăng xuất" trong menu thả xuống.
2. Hệ thống hiển thị hộp thoại xác nhận đăng xuất.
3. Người dùng bấm chọn "Đăng xuất" để xác nhận.
4. Hệ thống xóa session hiện tại của người dùng, đưa người dùng quay lại màn hình Đăng nhập.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | Xác nhận đăng xuất | Khi người dùng chọn "Đăng xuất" từ menu | Hiển thị hộp thoại xác nhận đăng xuất | Không hành động |
| D2 | Đồng ý đăng xuất | Khi người dùng xác nhận trên hộp thoại | Tiến hành đăng xuất tài khoản và quay về màn Login | Đóng hộp thoại xác nhận và giữ nguyên trạng thái Dashboard |
| D3 | Lưu tên hiển thị mới | Khi người dùng bấm "Lưu" trong popup Thông tin | Kiểm tra hợp lệ dữ liệu nhập (1-32 ký tự) $\rightarrow$ Cập nhật cơ sở dữ liệu | Báo lỗi nhập liệu và yêu cầu sửa lại |

### 6.5 Other Edge Cases

- **Mất mạng khi đang lưu tên mới**: Khi người dùng bấm "Lưu" nhưng thiết bị bị mất kết nối mạng hoặc server database bị lỗi, hệ thống hiển thị thông báo lỗi `Không thể cập nhật tên. Vui lòng kiểm tra lại kết nối mạng.`, giữ nguyên dữ liệu trong form và không đóng popup để người dùng có thể thử lại sau khi có mạng.
- **Lỗi AsyncStorage khi ghi cấu hình cài đặt**: Nếu thiết bị bị lỗi không thể lưu cấu hình Ngôn ngữ/Giao diện xuống bộ nhớ cục bộ, hệ thống vẫn áp dụng cấu hình mới cho phiên làm việc hiện tại, nhưng khi khởi động lại ứng dụng sẽ sử dụng các giá trị mặc định làm fallback.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên hiển thị | Bắt buộc nhập, độ dài tối thiểu 1 ký tự, tối đa 32 ký tự, tự động cắt bỏ các khoảng trắng thừa ở đầu và cuối chuỗi. |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Độ dài tên hiển thị | 32 ký tự | N/A | Không cho phép nhập thêm ký tự thứ 33 vào ô nhập liệu hoặc báo lỗi khi bấm Lưu. |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Lỗi cập nhật tên do mất kết nối | "Không thể cập nhật tên. Vui lòng kiểm tra lại kết nối mạng." | E-PROFILE-01 |
| Tên hiển thị để trống | "Tên hiển thị không được để trống." | E-PROFILE-02 |
| Tên hiển thị quá dài | "Tên hiển thị không được vượt quá 32 ký tự." | E-PROFILE-03 |

#### Success messages

| Tình huống | Wording |
|---|---|
| Cập nhật tên thành công | "Cập nhật tên hiển thị thành công!" |
| Lưu cài đặt thành công | "Đã lưu cài đặt tài khoản của bạn." |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Hộp thoại xác nhận đăng xuất | "Bạn có chắc chắn muốn đăng xuất không?" |
| Nhấn chuông thông báo | "Hiện tại bạn chưa có thông báo mới nào." |

## 8. Assumptions

- 1. Thông tin tài khoản người dùng (Email, SĐT, Tên) được quản lý qua dịch vụ của Supabase Auth và bảng `profiles` tương ứng.
- 2. Cài đặt ngôn ngữ mặc định là Tiếng Việt, cài đặt hiển thị giao diện mặc định là Sáng (Light Mode).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Lỗi bộ nhớ cục bộ không thể ghi nhớ cài đặt giao diện/ngôn ngữ của người dùng | Thỉnh thoảng | Người dùng phải chọn lại cài đặt sáng/tối hoặc ngôn ngữ mỗi lần mở lại ứng dụng | Sử dụng giá trị mặc định Tiếng Việt / Light Mode ổn định làm phương án dự phòng |

## 10. Success Criteria (preliminary)

- Thời gian phản hồi mở menu thả xuống và các popup nhỏ dưới 100ms.
- Tỷ lệ người dùng vô tình đăng xuất nhầm giảm xuống 0% nhờ cơ chế xác nhận.

## 11. Open Questions

- [ ] OQ-1: Chúng ta có cần tích hợp thêm tính năng đổi mật khẩu tài khoản trực tiếp trong popup Cài đặt ở bản MVP này không?

## 12. Next Steps

Sau brainstorm này:
- `/urd profile-menu` — capture user perspective
- `/prd profile-menu` — product scope
