# Tài liệu Yêu cầu: Sổ Giao Dịch (Ledger Screen)

Tài liệu này bao gồm các yêu cầu Nghiệp vụ (BRD), Sản phẩm (PRD), và Đặc tả Kỹ thuật (SRS) cho màn hình **Sổ Giao Dịch (Ledger)**.

---

## 1. Yêu cầu Nghiệp vụ (BRD)
*   **Mục tiêu:** Cung cấp giải pháp ghi chép giao dịch tài chính (Thu nhập, Chi tiêu, Chuyển khoản nội bộ giữa các hũ) nhanh chóng, chính xác.
*   **Contextual Filtering:** Hỗ trợ lọc giao dịch theo ví hiện hành để phục vụ cho cả nhu cầu cá nhân lẫn theo dõi nhóm (ví chung).

---

## 2. Yêu cầu Sản phẩm (PRD)

### 2.1 Các Chế độ Xem (Tabs)
*   **Tab Hàng ngày (Daily):** Hiển thị danh sách giao dịch nhóm theo ngày giảm dần (mới nhất ở trên cùng). Mỗi ngày hiển thị tổng thu nhập và tổng chi tiêu.
*   **Tab Hàng tháng (Monthly):** Hiển thị tổng thu nhập, tổng chi tiêu trong tháng hiện tại và danh mục biểu đồ các khoản chi tiêu chiếm tỷ trọng lớn nhất.
*   **Tab Lịch (Calendar):** Hiển thị lịch tháng trực quan. Ngày có giao dịch chi tiêu hiển thị chấm đỏ, ngày có giao dịch thu nhập hiển thị chấm xanh lá cây. Nhấp vào một ngày sẽ hiển thị danh sách giao dịch của ngày đó ở bên dưới.

### 2.2 Luồng Tạo Giao Dịch Nhanh (Quick Add Sheet)
*   Trượt lên dưới dạng Bottom Sheet từ nút FAB `+` ở Trang chủ hoặc Sổ giao dịch.
*   **Các thông tin đầu vào:**
    *   Số tiền (Numeric).
    *   Loại giao dịch: Thu nhập (Income), Chi tiêu (Expense), Chuyển khoản (Transfer).
    *   Hũ liên kết (NEC, LTSS, EDU, PLAY, FFA, GIVE).
    *   Danh mục chi tiết (Ví dụ: Ăn uống, Di chuyển, Mua sắm).
    *   Ghi chú ngắn (tùy chọn).
*   **Optimistic UI:** Cập nhật số dư ví cục bộ ngay lập tức để đem lại trải nghiệm mượt mà, sau đó đồng bộ ngầm lên server.

---

## 3. Đặc tả Kỹ thuật (SRS)

### 3.1 Cấu trúc Dữ liệu (Supabase / PostgreSQL)
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

### 3.2 Tối ưu hóa UI & Offline-first Sync
*   **`useMemo` Client-side Partitioning:** Khi fetch dữ liệu giao dịch của tháng về thiết bị, sử dụng `useMemo` để phân tách và tính toán dữ liệu cho cả 3 tab (Daily, Monthly, Calendar) thay vì gọi API request mới mỗi khi chuyển tab con. Việc này giúp quá trình chuyển tab đạt tốc độ tức thì (< 50ms).
*   **Auto-allocation Trigger:** Khi thêm giao dịch thu nhập (`income`) vào ví, hệ thống tự động nhân số tiền thu nhập với tỷ lệ phần trăm phân bổ của từng hũ tài chính đã thiết lập để cộng tiền tương ứng vào số dư của 6 hũ.
