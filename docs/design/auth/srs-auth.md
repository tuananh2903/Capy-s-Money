# Software Requirements Specification (SRS) - Authentication & Onboarding

## 1. Đặc tả Kỹ thuật & API
*   **Bảng `auth.users`:** Quản lý tài khoản đăng nhập bảo mật (do Supabase Auth xử lý tự động).
*   **Bảng `public.profiles`:**
    *   `id` UUID (Khóa chính, tham chiếu sang `auth.users.id`).
    *   `display_name` TEXT.
    *   `jars_ratios` JSONB (Lưu tỷ lệ phân bổ mặc định 6 hũ dạng key-value).
    *   `financial_goal` TEXT (Mục tiêu tài chính).
*   **Xác thực:** Ứng dụng sử dụng JWT Token cấp bởi Supabase để xác thực các request.
*   **Onboarding:** Khi người dùng hoàn tất khảo sát onboarding, API sẽ cập nhật trường `jars_ratios` và `financial_goal` trong bảng `public.profiles` của người dùng.
