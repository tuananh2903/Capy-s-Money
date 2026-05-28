# Product Requirements Document (PRD) - Ngân Sách

## 1. Yêu cầu Giao diện & Trải nghiệm (UI/UX)
*   **Thiết lập Hạn mức:**
    *   Hiển thị danh sách 6 hũ tài chính hiện tại.
    *   Mỗi hũ có ô nhập số tiền hạn mức mong muốn thiết lập cho tháng hiện hành (ví dụ: hũ Thiết yếu (NEC) giới hạn 5,000,000 đ/tháng).
    *   Nhập số tiền bằng bộ gõ số trực quan.
*   **Visual Alert Badge (Huy hiệu cảnh báo):**
    *   Hệ thống tính toán tiến độ chi tiêu thực tế để hiển thị nhãn cảnh báo trực quan kế bên từng hũ:
        *   `Bình thường` (Màu xanh): Chi tiêu thực tế dưới 70% hạn mức.
        *   `Tiêu dùng nhanh` (Màu cam): Chi tiêu thực tế vượt mức dự kiến trung bình theo ngày trôi qua trong tháng hoặc đạt 70%-99% hạn mức.
        *   `Vượt hạn mức!` (Màu đỏ): Chi tiêu thực tế đạt hoặc vượt quá 100% hạn mức đã cài đặt.
        *   Cảnh báo ngân sách hỗ trợ gating hạn mức cho gói Free.
