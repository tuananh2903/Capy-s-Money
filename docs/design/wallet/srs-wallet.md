# Software Requirements Specification (SRS) - Quản lý Ví

## 1. Cấu trúc Dữ liệu & PostgreSQL Triggers
*   **Bảng `public.wallets`:**
    *   `id` UUID (Khóa chính).
    *   `user_id` UUID (Chủ ví).
    *   `name` VARCHAR(32) (Tên ví).
    *   `balance` NUMERIC(15,2) (Số dư).
    *   `type` VARCHAR(16) ('personal' / 'shared').
    *   `is_default` BOOLEAN (Ví mặc định).
    *   `is_deleted` BOOLEAN (Cờ xóa mềm).
*   **Trigger `trigger_check_wallet_limits`:** Tự động đếm số ví hoạt động hiện tại của người dùng trước khi thực hiện câu lệnh `INSERT` mới. Nếu vượt quá giới hạn (2 ví cá nhân, 1 ví chung cho gói Free), ném ngoại lệ chặn request ghi từ phía DB.

## 2. APIs & Dịch vụ liên quan
*   **`createWallet(walletData)`**: Gửi câu lệnh Insert tạo ví mới lên DB.
*   **`updateJarAllocations(walletId, allocations)`**: Cập nhật đồng loạt tỷ lệ phần trăm phân bổ cho 6 hũ tài chính của ví.
*   **`setDefaultWallet(walletId, userId)`**: Gọi Postgres RPC function `set_default_wallet` đặt ví mặc định an toàn cho người dùng, tự động gán `is_default = false` cho các ví khác.
*   **`deleteWallet(walletId)`**: Gọi Update đặt `is_deleted = true` để thực thi xóa mềm ví.
