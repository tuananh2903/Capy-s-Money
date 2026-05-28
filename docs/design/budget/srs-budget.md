# Software Requirements Specification (SRS) - Ngân Sách

## 1. Cấu trúc Dữ liệu & APIs
*   **Bảng `public.jars`:**
    *   `budget_limit` NUMERIC(15,2) (Hạn mức ngân sách tối đa).
    *   `spent_amount` NUMERIC(15,2) (Số tiền lũy kế đã tiêu dùng trong tháng).
*   **Dịch vụ:**
    *   `updateBudgetLimit(jarId, amount)`: API cập nhật cột `budget_limit` cho hũ tài chính tương ứng trên Supabase.

## 2. Thuật toán Cảnh báo Ngân sách (Budget Checker Algorithm)
Thuật toán phân tích tốc độ chi tiêu được tính toán như sau:
1.  **Lấy số ngày trong tháng hiện tại:** `totalDaysInMonth`.
2.  **Lấy ngày hiện tại:** `currentDay`.
3.  **Tỷ lệ thời gian đã trôi qua:** `timeRatio = currentDay / totalDaysInMonth`.
4.  **Tỷ lệ chi tiêu thực tế:** `spentRatio = spent_amount / budget_limit`.
5.  **Phán quyết:**
    *   Nếu `spentRatio >= 1.0` -> `OVER_BUDGET`.
    *   Nếu `spentRatio >= 0.5` VÀ `spentRatio > (timeRatio + 0.2)` -> `SPENDING_TOO_FAST`.
    *   Các trường hợp còn lại -> `NORMAL`.
