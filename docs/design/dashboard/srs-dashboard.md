# Software Requirements Specification (SRS) - Dashboard

## 1. APIs & Dịch vụ tích hợp
*   **`fetchWallets(userId)`:** Lấy danh sách ví hoạt động (không bị xóa mềm) của người dùng hoặc các ví chung được chia sẻ.
*   **`fetchJars(walletId)`:** Lấy thông tin chi tiết số dư, hạn mức, số tiền đã chi tiêu và tỷ lệ phần trăm phân bổ của 6 hũ thuộc ví được chọn.
*   **`ensureJarsExist(walletId, jars, ratios)`:** Hàm đảm bảo khởi tạo đầy đủ 6 hũ khi người dùng truy cập ví lần đầu.

## 2. Logic Cảnh báo Ngân sách (Budget Checker)
*   Hệ thống kiểm tra ngân sách cục bộ dựa trên tỷ lệ phần trăm thời gian trôi qua trong tháng:
    *   Tỷ lệ thời gian trôi qua: `elapsedDays / totalDaysInMonth`.
    *   Nếu `spent_amount > budget_limit`, trả về cảnh báo `OVER_BUDGET` (Vượt hạn mức).
    *   Nếu tỷ lệ số tiền tiêu dùng vượt quá tỷ lệ thời gian trôi qua hơn 20% (và tổng tiêu dùng đã vượt 50% hạn mức), trả về cảnh báo `SPENDING_TOO_FAST` (Tiêu dùng nhanh).
*   Đồng bộ ví hoạt động cuối cùng của người dùng bằng cách lưu trữ `last_active_wallet_id_${userId}` vào `AsyncStorage` cục bộ để khôi phục khi mở lại ứng dụng.
