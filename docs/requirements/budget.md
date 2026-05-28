# Tài liệu Yêu cầu: Ngân Sách (Budget Screen)

Tài liệu này bao gồm các yêu cầu Nghiệp vụ (BRD), Sản phẩm (PRD), và Đặc tả Kỹ thuật (SRS) cho màn hình **Ngân Sách (Budget)**.

---

## 1. Yêu cầu Nghiệp vụ (BRD)
*   **Mục tiêu:** Cho phép người dùng kiểm soát hành vi chi tiêu bằng cách áp đặt hạn mức chi tiêu tối đa hàng tháng cho từng hũ tài chính của ví active.
*   **Lợi ích:** Giúp giảm thiểu rủi ro thâm hụt tài chính cá nhân, hỗ trợ kỷ luật hóa việc tiêu dùng theo kế hoạch định trước.

---

## 2. Yêu cầu Sản phẩm (PRD)

### 2.1 Thành phần Giao diện & Tương tác
*   **Thiết lập Hạn mức:**
    *   Hiển thị danh sách 6 hũ tài chính hiện tại.
    *   Mỗi hũ có ô nhập số tiền hạn mức mong muốn thiết lập cho tháng hiện hành (ví dụ: hũ Thiết yếu (NEC) giới hạn 5,000,000 đ/tháng).
    *   Nhập số tiền bằng bộ gõ số trực quan.
*   **Visual Alert Badge (Huy hiệu cảnh báo):**
    *   Hệ thống tính toán tiến độ chi tiêu thực tế để hiển thị nhãn cảnh báo trực quan kế bên từng hũ:
        *   `Bình thường` (Màu xanh): Chi tiêu thực tế dưới 70% hạn mức.
        *   `Tiêu dùng nhanh` (Màu cam): Chi tiêu thực tế vượt mức dự kiến trung bình theo ngày trôi qua trong tháng hoặc đạt 70%-99% hạn mức.
        *   `Vượt hạn mức!` (Màu đỏ): Chi tiêu thực tế đạt hoặc vượt quá 100% hạn mức đã cài đặt.

---

## 3. Đặc tả Kỹ thuật (SRS)

### 3.1 Cấu trúc Dữ liệu & APIs
*   **Bảng `public.jars`:**
    *   `budget_limit` NUMERIC(15,2) (Hạn mức ngân sách tối đa).
    *   `spent_amount` NUMERIC(15,2) (Số tiền lũy kế đã tiêu dùng trong tháng).
*   **Dịch vụ:**
    *   `updateBudgetLimit(jarId, amount)`: API cập nhật cột `budget_limit` cho hũ tài chính tương ứng trên Supabase.

### 3.2 Thuật toán Cảnh báo Ngân sách (Budget Checker Algorithm)
Thuật toán phân tích tốc độ chi tiêu được tính toán như sau:
1.  **Lấy số ngày trong tháng hiện tại:** `totalDaysInMonth`.
2.  **Lấy ngày hiện tại:** `currentDay`.
3.  **Tỷ lệ thời gian đã trôi qua:** `timeRatio = currentDay / totalDaysInMonth`.
4.  **Tỷ lệ chi tiêu thực tế:** `spentRatio = spent_amount / budget_limit`.
5.  **Phán quyết:**
    *   Nếu `spentRatio >= 1.0` -> `OVER_BUDGET`.
    *   Nếu `spentRatio >= 0.5` VÀ `spentRatio > (timeRatio + 0.2)` -> `SPENDING_TOO_FAST`.
    *   Các trường hợp còn lại -> `NORMAL`.
