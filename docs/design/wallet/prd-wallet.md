# Product Requirements Document (PRD) - Quản lý Ví

## 1. Yêu cầu Giao diện & Trải nghiệm (UI/UX)
*   **Danh sách Ví (Wallet Deck):** Hiển thị danh sách ví hoạt động dưới dạng thẻ (cards) cuộn dọc/ngang gradient bo góc tròn `borderRadius: 20` sang trọng.
    *   *Ví cá nhân:* Hồng nhạt `#FFB7C5` sang đỏ đất `#944652`.
    *   *Ví chung:* Hồng san hô `#FE9DA9` sang xám ấm `#71585C`.
*   Nút cài đặt ⚙️ được gắn trên mỗi thẻ (chỉ hiển thị nếu vai trò người dùng hiện hành là Owner hoặc Editor; hoàn toàn ẩn đối với Viewer).
*   Nút **"+ Tạo ví mới"** nằm dưới cùng danh sách. Nếu đạt giới hạn quota, nút chuyển sang disabled (màu `#D6C2C4`) kèm dòng chữ cảnh báo bên dưới: *"Bạn đã đạt giới hạn ví miễn phí (2 cá nhân, 1 chung). Nâng cấp Premium để tạo thêm"*.
*   **Bottom Sheet Tạo Ví Mới (`WalletCreateSheet`):** Nhập Tên ví (1-32 ký tự), chọn loại ví (Cá nhân/Chung), số dư ban đầu, bảng màu sắc & icon.
*   **Bottom Sheet Cài đặt Ví (`WalletEditSheet`):**
    *   **Cấu hình tỷ lệ 6 Hũ:** Cho phép điều chỉnh % phân bổ bằng nút `-` và `+` (mỗi bước tăng/giảm 5%). Nút "Lưu" chỉ kích hoạt khi tổng hũ bằng **chính xác 100%**. Có nút reset nhanh về tỷ lệ chuẩn (55-10-10-10-10-5).
    *   **Đặt làm ví Mặc định:** Đặt ví hiện hành làm ví mặc định và đồng bộ qua DB Cloud.
    *   **Quản lý thành viên (Ví chung):** Hiển thị danh sách thành viên kèm vai trò. Cho phép Owner xóa thành viên và mở mã mời tham gia ví chung mới.
    *   **Xóa ví (Soft Delete):** Đặt cờ `is_deleted = true` kèm thông báo xác nhận: *"Cảnh báo: Bạn có chắc chắn muốn xóa ví '[Tên ví]' không? Hành động này sẽ ẩn toàn bộ lịch sử chi tiêu của ví này và không thể hiển thị lại trên ứng dụng."*
