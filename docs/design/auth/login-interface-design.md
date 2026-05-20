# Design Specification: Giao diện Đăng nhập Capy's Money

## 1. Overview & Purpose
Tính năng Đăng nhập cho Capy's Money với mục tiêu mang lại trải nghiệm "chill", nhẹ nhàng nhất cho người dùng. 
Bao gồm hai luồng chính: Đăng nhập bằng Email/Mật khẩu truyền thống và Đăng nhập qua Google (OAuth).
- Tách biệt rõ ràng luồng Đăng nhập (dành cho người đã có tài khoản) và luồng Đăng ký.
- Định tuyến thông minh: Sau khi đăng nhập, dựa vào trạng thái thiết lập (setup) của tài khoản để điều hướng (vào Onboarding cho user chưa setup, vào Dashboard 6 Hũ cho user đã setup).

## 2. Core Flows
- **Đăng nhập Email/Mật khẩu**:
  - Nhập Email, Mật khẩu. 
  - Mặc định "ghi nhớ đăng nhập" (keep logged in) vĩnh viễn cho đến khi người dùng chủ động Đăng xuất.
  - Không gửi email cảnh báo đăng nhập thiết bị mới để tránh rườm rà.
- **Đăng nhập Google**:
  - Tích hợp Google OAuth. 
  - Hệ thống chỉ yêu cầu quyền Profile cơ bản (Tên, Email, Avatar), không yêu cầu quyền sâu (như Google Drive).

## 3. Architecture & System Behavior
- **Roles & Permissions**: Hệ thống nhận diện và phân biệt các Role (Free, Advance, Pro...) ngay sau khi đăng nhập thành công.
- **Device Management**: 
  - Lưu ngầm lịch sử đăng nhập (loại máy, IP, trình duyệt) để người dùng có thể xem lại và quản lý thiết bị trong Dashboard.
  - **Không** giới hạn số lượng thiết bị đăng nhập đồng thời.

## 4. Error Handling & Edge Cases
- **Bảo mật (Lockout)**: Nhập sai mật khẩu quá 5 lần sẽ bị khóa đăng nhập trong vòng 1 tiếng.
- **Gián đoạn (Google Auth)**: Nếu kết nối mạng chập chờn hoặc người dùng ấn "Hủy" cấp quyền Google, hệ thống sẽ báo lỗi và quay về màn hình đăng nhập.
- **Wording (Thông báo chuẩn phong cách Chill)**:
  - Sai định dạng Email: *"Email không hợp lệ, vui lòng kiểm tra và nhập lại email."*
  - Sai mật khẩu (dưới 5 lần): *"Sai mật khẩu. Vui lòng thử lại. Lưu ý: Nhập sai mật khẩu quá 5 lần sẽ bị khóa đăng nhập trong vòng 1 tiếng."*
  - Khóa tài khoản (sau 5 lần sai): *"Tài khoản của bạn tạm thời bị khóa 1 tiếng do nhập sai mật khẩu quá nhiều lần. Chill đi rồi thử lại sau nhé."*
  - Lỗi Google Auth: *"Có lỗi xảy ra. Vui lòng thử đăng nhập lại."*

## 5. Future Scope (Out of Scope for initial release)
- Tính năng liên kết Số điện thoại để làm giải pháp dự phòng cho những người dùng tạo tài khoản qua Google nhưng sau đó bị mất/khóa tài khoản Google.
