# Software Requirements Specification (SRS) - Sổ Giao Dịch

## 1. Cấu trúc Dữ liệu
*   **Bảng `public.transactions`:**
    *   `id` UUID (Khóa chính).
    *   `wallet_id` UUID (Khóa ngoại liên kết tới bảng `wallets`).
    *   `category_id` UUID (Khóa ngoại liên kết danh mục chi tiết).
    *   `jar_type` VARCHAR(8) (Loại hũ tài chính).
    *   `amount` NUMERIC(15,2) (Số tiền).
    *   `type` VARCHAR(16) (Loại: 'income', 'expense', 'transfer').
    *   `note` TEXT (Ghi chú).
    *   `occurred_at` TIMESTAMPTZ (Thời gian phát sinh giao dịch).
    *   `created_by` UUID (Khóa ngoại tới `profiles` của người tạo).

## 2. Đồng bộ & Tối ưu hóa hiệu năng
*   **`useMemo` Client-side Partitioning:** Khi fetch dữ liệu giao dịch của tháng về thiết bị, sử dụng `useMemo` để phân tách và tính toán dữ liệu cho cả 3 tab (Daily, Monthly, Calendar) thay vì gọi API request mới mỗi khi chuyển tab con. Việc này giúp quá trình chuyển tab đạt tốc độ tức thì (< 50ms).
*   **Auto-allocation Trigger:** Khi thêm giao dịch thu nhập (`income`) vào ví, hệ thống tự động nhân số tiền thu nhập với tỷ lệ phần trăm phân bổ của từng hũ tài chính đã thiết lập để cộng tiền tương ứng vào số dư của 6 hũ.
