# Tài liệu Yêu cầu: Quản lý Ví (Wallet Screen)

Tài liệu này bao gồm các yêu cầu Nghiệp vụ (BRD), Sản phẩm (PRD), và Đặc tả Kỹ thuật (SRS) cho màn hình **Quản lý Ví (Wallets)**.

---

## 1. Yêu cầu Nghiệp vụ (BRD)
*   **Mục tiêu:** Cung cấp giao diện trung tâm quản lý tài sản tài chính bao gồm cả ví cá nhân và ví chung.
*   **Kiểm soát Giới hạn (Quota Gating):** Áp dụng giới hạn tạo tài nguyên chặt chẽ cho người dùng gói miễn phí (Free) để kích thích nhu cầu nâng cấp gói Premium:
    *   Tối đa 2 ví cá nhân hoạt động.
    *   Tối đa 1 ví chung hoạt động.
    *   Tối đa 3 thành viên tham gia ví chung (bao gồm cả chủ ví).

---

## 2. Yêu cầu Sản phẩm (PRD)

### 2.1 Danh sách Ví (Wallet Deck)
*   Hiển thị danh sách ví hoạt động dưới dạng thẻ (cards) gradient bo góc tròn `borderRadius: 20` sang trọng:
    *   *Ví cá nhân:* Hồng nhạt `#FFB7C5` sang đỏ đất `#944652`.
    *   *Ví chung:* Hồng san hô `#FE9DA9` sang xám ấm `#71585C`.
*   Nút cài đặt ⚙️ được gắn trên mỗi thẻ (chỉ hiển thị nếu vai trò người dùng hiện hành là Owner hoặc Editor; hoàn toàn ẩn đối với Viewer).
*   Nút **"+ Tạo ví mới"** nằm dưới cùng danh sách. Nếu đạt giới hạn quota, nút chuyển sang disabled (màu `#D6C2C4`) kèm dòng chữ cảnh báo bên dưới: *"Bạn đã đạt giới hạn ví miễn phí (2 cá nhân, 1 chung). Nâng cấp Premium để tạo thêm"*.

### 2.2 Bottom Sheet Tạo Ví Mới (`WalletCreateSheet`)
*   Nhập Tên ví (1-32 ký tự), chọn loại ví (Cá nhân/Chung), số dư ban đầu, bảng màu sắc & icon.
*   Lưu thông tin tạo ví và tự động khởi tạo 6 hũ mặc định.

### 2.3 Bottom Sheet Cài đặt Ví (`WalletEditSheet`)
*   **Cấu hình tỷ lệ 6 Hũ:** Cho phép điều chỉnh % phân bổ bằng nút `-` và `+` (mỗi bước tăng/giảm 5%). Nút "Lưu" chỉ kích hoạt khi tổng hũ bằng **chính xác 100%**. Có nút reset nhanh về tỷ lệ chuẩn (55-10-10-10-10-5).
*   **Đặt làm ví Mặc định:** Đặt ví hiện hành làm ví mặc định và đồng bộ qua DB Cloud.
*   **Quản lý thành viên (Ví chung):** Hiển thị danh sách thành viên kèm vai trò. Cho phép Owner xóa thành viên và mở mã mời tham gia ví chung mới.
*   **Xóa ví (Soft Delete):** Đặt cờ `is_deleted = true` kèm thông báo xác nhận: *"Cảnh báo: Bạn có chắc chắn muốn xóa ví '[Tên ví]' không? Hành động này sẽ ẩn toàn bộ lịch sử chi tiêu của ví này và không thể hiển thị lại trên ứng dụng."*

---

## 3. Đặc tả Kỹ thuật (SRS)

### 3.1 Cấu trúc Dữ liệu & PostgreSQL Triggers
*   **Bảng `public.wallets`:**
    *   `id` UUID (Khóa chính).
    *   `user_id` UUID (Chủ ví).
    *   `name` VARCHAR(32) (Tên ví).
    *   `balance` NUMERIC(15,2) (Số dư).
    *   `type` VARCHAR(16) ('personal' / 'shared').
    *   `is_default` BOOLEAN (Ví mặc định).
    *   `is_deleted` BOOLEAN (Cờ xóa mềm).
*   **Trigger `trigger_check_wallet_limits`:** Tự động đếm số ví hoạt động hiện tại của người dùng trước khi thực hiện câu lệnh `INSERT` mới. Nếu vượt quá giới hạn (2 ví cá nhân, 1 ví chung cho gói Free), ném ngoại lệ chặn request ghi từ phía DB.

### 3.2 APIs & Dịch vụ liên quan
*   **`createWallet(walletData)`**: Gửi câu lệnh Insert tạo ví mới lên DB.
*   **`updateJarAllocations(walletId, allocations)`**: Cập nhật đồng loạt tỷ lệ phần trăm phân bổ cho 6 hũ tài chính của ví.
*   **`setDefaultWallet(walletId, userId)`**: Gọi Postgres RPC function `set_default_wallet` đặt ví mặc định an toàn cho người dùng, tự động gán `is_default = false` cho các ví khác.
*   **`deleteWallet(walletId)`**: Gọi Update đặt `is_deleted = true` để thực thi xóa mềm ví.
