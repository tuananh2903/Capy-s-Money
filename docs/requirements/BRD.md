# Business Requirements Document (BRD) - Capy's Money

## 1. Executive Summary
Capy's Money là ứng dụng di động quản lý tài chính cá nhân và đội nhóm thông minh dành cho giới trẻ, tích hợp phương pháp phân bổ 6 Hũ tài chính (Jars System) nổi tiếng. Ứng dụng hướng tới việc xây dựng thói quen ghi chép chi tiêu kỷ luật, trực quan, hỗ trợ chia sẻ tài chính minh bạch giữa các cặp đôi, gia đình hoặc nhóm bạn.

## 2. Business Objectives & Goals
*   **User Growth:** Đạt 100,000 người dùng hoạt động hàng tháng (MAU) trong năm đầu tiên.
*   **Engagement:** Duy trì tỷ lệ người dùng mở app và ghi chép giao dịch tối thiểu 5 ngày/tuần trên 40%.
*   **Monetization:** Chuyển đổi tối thiểu 3% người dùng miễn phí sang gói trả phí (Premium) thông qua mô hình Freemium với các tính năng nâng cao (ví dụ: mở giới hạn số lượng ví, thêm thành viên ví chung).

## 3. Scope of the System
Ứng dụng di động (iOS/Android) phát triển trên Expo React Native hỗ trợ:
*   Đăng ký, đăng nhập và onboarding định hướng tài chính.
*   Quản lý ví cá nhân và ví chung (shared wallets).
*   Ghi chép giao dịch (Ledger) và phân bổ tự động vào 6 hũ tài chính.
*   Thiết lập hạn mức ngân sách (Budget) và cảnh báo tiêu dùng thông minh.
*   Đồng bộ hóa dữ liệu thời gian thực (real-time sync) qua Supabase Cloud.

---

## 4. Target Audience & Personas
*   **Persona A (Cá nhân tự lập):** Sinh viên hoặc người mới đi làm muốn tối ưu chi tiêu cá nhân, tiết kiệm tiền mua nhà/xe thông qua phương pháp 6 hũ.
*   **Persona B (Cặp đôi/Gia đình trẻ):** Có nhu cầu quản lý quỹ chung để chi tiêu sinh hoạt, tiền nhà, đi chợ chung mà không mất đi sự tự do tài chính cá nhân.

---

## 5. Monetization Strategy (Freemium Model)
Hệ thống áp dụng chính sách giới hạn tài nguyên (Quota Gating) chặt chẽ đối với người dùng gói Free:

| Tài nguyên | Gói Free (Miễn phí) | Gói Premium (Trả phí) |
| :--- | :--- | :--- |
| **Ví cá nhân** | Tối đa 2 ví | Không giới hạn |
| **Ví chung** | Tối đa 1 ví chung | Không giới hạn |
| **Thành viên ví chung** | Tối đa 3 thành viên / ví | Không giới hạn |
| **Cảnh báo ngân sách** | Hỗ trợ cơ bản | Hỗ trợ phân tích dự báo nâng cao |

---

## 6. Functional Business Areas
1.  **Authentication & Onboarding:**
    *   Xác thực người dùng qua Email/Mật khẩu.
    *   Onboarding khảo sát mục tiêu tài chính để gợi ý phân bổ tỷ lệ hũ ban đầu.
2.  **Wallet Management (Quản lý Ví):**
    *   Tạo ví cá nhân/ví chung.
    *   Cấu hình tỷ lệ 6 hũ tài chính (NEC, LTSS, EDU, PLAY, FFA, GIVE). Tổng tỷ lệ phải bằng chính xác 100%.
    *   Xác định ví mặc định phục vụ ghi chép nhanh.
3.  **Ledger Management (Sổ Giao Dịch):**
    *   Ghi chép thu nhập, chi tiêu, chuyển khoản giữa các hũ.
    *   Phân loại chi tiết theo danh mục (Categories) và hũ đích.
4.  **Budget & Alerting (Hạn mức & Cảnh báo):**
    *   Thiết lập ngân sách chi tiêu hàng tháng cho từng hũ.
    *   Hệ thống cảnh báo tự động khi phát hiện chi tiêu vượt hạn mức (Over Budget) hoặc tốc độ chi tiêu quá nhanh (Spending Too Fast).

---

## 7. Non-Functional Business Requirements
*   **UX Premium:** Giao diện nhất quán theo ngôn ngữ thiết kế Stitch (font Plus Jakarta Sans, màu ấm pastel, bo góc tròn viên thuốc, mascot Capy tương tác sống động).
*   **Offline-first Capability:** Cho phép người dùng ghi chép chi tiêu tức thì ngay cả khi mất mạng; đồng bộ ngầm khi kết nối internet hoạt động trở lại.
*   **Security & RLS:** Đảm bảo dữ liệu ví cá nhân hoàn toàn bảo mật; ví chung phân quyền rõ ràng (Owner, Editor, Viewer).
