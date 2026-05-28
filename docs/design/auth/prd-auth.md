# Product Requirements Document (PRD) - Authentication & Onboarding

## 1. Yêu cầu Giao diện & Trải nghiệm (UI/UX)
*   **Giao diện Đăng nhập (`LoginScreen`):**
    *   Trường Email (nhập văn bản), Mật khẩu (ẩn ký tự).
    *   Validate định dạng email hợp lệ. Mật khẩu tối thiểu 6 ký tự.
    *   Thông báo lỗi rõ ràng nếu sai tài khoản/mật khẩu hoặc mất kết nối mạng.
*   **Giao diện Đăng ký (`RegisterScreen`):**
    *   Nhập Email, Mật khẩu, Xác nhận Mật khẩu, và Tên hiển thị (Display Name).
    *   Xác thực khớp mật khẩu trước khi gửi yêu cầu đăng ký lên server.
*   **Giao diện Khảo sát Onboarding (`OnboardingScreen`):**
    *   Hiển thị sau khi đăng ký tài khoản thành công lần đầu tiên.
    *   Giao diện gồm các câu hỏi trắc nghiệm định hình phong cách tài chính (ví dụ: "Mục tiêu tài chính lớn nhất của bạn là gì?", "Bạn thường phân bổ thu nhập như thế nào?").
    *   Dựa trên câu trả lời, hệ thống đề xuất tỷ lệ 6 hũ ban đầu phù hợp:
        *   *Tiết kiệm:* NEC 50%, LTSS 15%, EDU 10%, PLAY 10%, FFA 10%, GIVE 5%.
        *   *Đầu tư:* NEC 45%, LTSS 10%, EDU 10%, PLAY 10%, FFA 20%, GIVE 5%.
        *   *Mặc định:* NEC 55%, LTSS 10%, EDU 10%, PLAY 10%, FFA 10%, GIVE 5%.
