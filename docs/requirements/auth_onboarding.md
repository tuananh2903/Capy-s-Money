# Tài liệu Yêu cầu: Xác thực & Onboarding (Auth & Onboarding)

Tài liệu này bao gồm các yêu cầu Nghiệp vụ (BRD), Sản phẩm (PRD), và Đặc tả Kỹ thuật (SRS) cho luồng **Xác thực người dùng (Đăng nhập / Đăng ký)** và **Onboarding Khảo sát**.

---

## 1. Yêu cầu Nghiệp vụ (BRD)
*   **Mục tiêu:** Cho phép người dùng đăng ký tài khoản mới và đăng nhập bảo mật vào ứng dụng.
*   **Mục tiêu Onboarding:** Giúp người dùng mới định hướng tài chính và cá nhân hóa trải nghiệm bằng cách khảo sát mục tiêu tài chính, từ đó tự động đề xuất tỷ lệ phân bổ 6 hũ mặc định ban đầu.

---

## 2. Yêu cầu Sản phẩm (PRD)

### 2.1 Luồng Đăng ký & Đăng nhập
*   **Giao diện Đăng nhập (`LoginScreen`):**
    *   Trường Email (nhập văn bản), Mật khẩu (ẩn ký tự).
    *   Validate định dạng email hợp lệ. Mật khẩu tối thiểu 6 ký tự.
    *   Thông báo lỗi rõ ràng nếu sai tài khoản/mật khẩu hoặc mất kết nối mạng.
*   **Giao diện Đăng ký (`RegisterScreen`):**
    *   Nhập Email, Mật khẩu, Xác nhận Mật khẩu, và Tên hiển thị (Display Name).
    *   Xác thực khớp mật khẩu trước khi gửi yêu cầu đăng ký lên server.

### 2.2 Luồng Khảo sát Onboarding (`OnboardingScreen`)
*   Hiển thị sau khi đăng ký tài khoản thành công lần đầu tiên.
*   Giao diện gồm các câu hỏi trắc nghiệm định hình phong cách tài chính (ví dụ: "Mục tiêu tài chính lớn nhất của bạn là gì?", "Bạn thường phân bổ thu nhập như thế nào?").
*   Dựa trên câu trả lời, hệ thống đề xuất tỷ lệ 6 hũ ban đầu phù hợp:
    *   *Tiết kiệm:* NEC 50%, LTSS 15%, EDU 10%, PLAY 10%, FFA 10%, GIVE 5%.
    *   *Đầu tư:* NEC 45%, LTSS 10%, EDU 10%, PLAY 10%, FFA 20%, GIVE 5%.
    *   *Mặc định:* NEC 55%, LTSS 10%, EDU 10%, PLAY 10%, FFA 10%, GIVE 5%.

---

## 3. Đặc tả Kỹ thuật (SRS)

### 3.1 Cấu trúc Dữ liệu (Supabase / PostgreSQL)
*   **Bảng `auth.users`:** Quản lý tài khoản đăng nhập bảo mật (do Supabase Auth xử lý tự động).
*   **Bảng `public.profiles`:**
    *   `id` UUID (Khóa chính, tham chiếu sang `auth.users.id`).
    *   `display_name` TEXT.
    *   `jars_ratios` JSONB (Lưu tỷ lệ phân bổ mặc định 6 hũ dạng key-value).
    *   `financial_goal` TEXT (Mục tiêu tài chính).

### 3.2 Logic Nghiệp vụ & Xác thực
*   Ứng dụng sử dụng JWT Token cấp bởi Supabase để xác thực các request.
*   Khi người dùng hoàn tất khảo sát onboarding, API sẽ cập nhật trường `jars_ratios` và `financial_goal` trong bảng `public.profiles` của người dùng.
