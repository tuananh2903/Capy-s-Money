# Product Requirements Document (PRD) - Capy's Money

## 1. Product Navigation & Structure
Ứng dụng sử dụng thanh điều hướng dưới cùng (Bottom Navigation Bar) gồm 4 Tab chính:
1.  **Trang chủ (Home):** Tổng quan tài sản, số dư ví hiện tại, phân phối chi tiêu 6 hũ dưới dạng biểu đồ tiến trình (progress bar) kèm bong bóng cảnh báo.
2.  **Sổ Giao Dịch (Ledger):** Hiển thị chi tiết danh sách giao dịch phân chia theo 3 tab con (Hàng ngày, Hàng tháng, Lịch) kèm bộ lọc ví.
3.  **Ngân sách (Budget):** Thiết lập hạn mức ngân sách chi tiêu hàng tháng cho từng hũ tài chính.
4.  **Ví (Wallets):** Giao diện quản lý danh sách ví cá nhân, ví chung, cấu hình tỷ lệ hũ và mời thành viên.

---

## 2. Screen-by-Screen Functional Specifications

### 2.1 Onboarding & Authentication Screens
*   **Màn hình Đăng nhập / Đăng ký:**
    *   Cho phép người dùng xác thực bằng Email/Password hợp lệ.
    *   Xử lý validate lỗi định dạng email, mật khẩu tối thiểu 6 ký tự.
*   **Màn hình Khảo sát Onboarding:**
    *   Thu thập thông tin sơ lược về xu hướng tài chính của người dùng (ví dụ: Tiết kiệm, Đầu tư, Mua sắm).
    *   Gợi ý tỷ lệ phân bổ 6 hũ mặc định phù hợp với kết quả khảo sát.

### 2.2 Trang chủ (Dashboard Screen)
*   **Mascot Capy (Mascot Interactive):**
    *   Hiển thị hình ảnh Capy dễ thương kèm bong bóng thoại chứa châm ngôn tài chính ngẫu nhiên hoặc lời nhắc ghi chép giao dịch.
*   **Wallet Switcher (Bộ chuyển đổi Ví):**
    *   Thanh cuộn ngang các ví dạng "viên thuốc" (pill shapes) cho phép chuyển đổi nhanh ví active hiện tại.
*   **Phân phối 6 Hũ:**
    *   Hiển thị danh sách 6 hũ của ví active.
    *   Từng hũ hiển thị tỷ lệ %, số tiền đã tiêu, hạn mức và thanh tiến trình chi tiêu (Progress Bar).
    *   Hũ có nhãn trạng thái cảnh báo dựa trên tiến độ chi tiêu thực tế (Normal, Tiêu dùng nhanh, Vượt hạn mức).

### 2.3 Sổ Giao Dịch (Ledger Screen)
*   **Phân nhóm Tabs:**
    *   *Hàng ngày (Daily):* Nhóm giao dịch theo ngày, hiển thị tổng thu/chi mỗi ngày.
    *   *Hàng tháng (Monthly):* Hiển thị tổng quan thu chi cả tháng và danh mục chi tiêu phổ biến.
    *   *Lịch (Calendar):* Xem lịch tháng với các dấu chấm đỏ/xanh biểu thị ngày có phát sinh giao dịch.
*   **Tạo Giao Dịch Nhanh (Quick Add Bottom Sheet):**
    *   Cho phép nhập số tiền, chọn loại giao dịch (Thu nhập, Chi tiêu, Chuyển khoản), chọn Hũ nguồn/Hũ đích và ghi chú nhanh.
    *   Tự động trừ/cộng vào số dư ví tương ứng khi hoàn tất lưu.

### 2.4 Ngân Sách (Budget Screen)
*   **Thiết lập Hạn mức:**
    *   Người dùng nhập số tiền hạn mức hàng tháng cho từng hũ tài chính.
    *   Hạn mức lưu trữ độc lập theo từng ví.
*   **Visual Alert Chips:**
    *   `Bình thường`: Dưới 70% hạn mức.
    *   `Tiêu dùng nhanh` (Warning): Tiêu thụ vượt quá tỷ lệ thời gian trôi qua trong tháng hoặc đạt 70%-99%.
    *   `Vượt hạn mức` (Danger): Chi tiêu vượt quá 100% hạn mức.

### 2.5 Ví (Wallet Screen)
*   **Wallet Cards Deck (Cuộn ngang thẻ ví):**
    *   Thẻ ví gradient bo góc tròn `borderRadius: 20` sang trọng.
    *   *Ví cá nhân:* Hồng nhạt `#FFB7C5` sang đỏ đất `#944652`.
    *   *Ví chung:* Hồng san hô `#FE9DA9` sang xám ấm `#71585C`.
    *   Hiển thị tên ví, loại ví, số dư và biểu tượng cài đặt ⚙️ (chỉ hiển thị cho vai trò Owner/Editor).
*   **Bottom Sheet Cài đặt Ví (Settings Sheet):**
    *   **Phân bổ 6 Hũ:** Cho phép tăng giảm % phân bổ bằng nút `-` và `+` (mỗi bước tăng/giảm 5%). Nút "Lưu" chỉ kích hoạt khi tổng hũ bằng **chính xác 100%**. Có nút reset về tỷ lệ chuẩn (55-10-10-10-10-5).
    *   **Mặc định:** Cho phép đặt ví hiện tại làm mặc định toàn cầu.
    *   **Xóa ví (Soft Delete):** Đặt cờ `is_deleted = true`. Yêu cầu popup xác nhận kèm cảnh báo nghiêm ngặt: *"Cảnh báo: Bạn có chắc chắn muốn xóa ví '[Tên ví]' không? Hành động này sẽ ẩn toàn bộ lịch sử chi tiêu của ví này và không thể hiển thị lại trên ứng dụng."*
    *   **Mời thành viên (Chỉ cho ví chung):** Tích hợp nút `➕ Mời thành viên mới` mở mã mời tham gia ví (giới hạn 3 người cho gói Free).

---

## 3. Product Acceptance Criteria (AC)

### AC 1: Giới hạn Quota gói Free (Wallet Gating)
*   **Scenario:** Người dùng thuộc gói miễn phí tạo ví mới.
*   **Given** Người dùng đã sở hữu 2 ví cá nhân hoạt động và 1 ví chung hoạt động.
*   **When** Người dùng truy cập màn hình quản lý ví.
*   **Then** Nút "+ Tạo ví mới" phải chuyển sang trạng thái disabled (màu `#D6C2C4`, text màu `#837375`).
*   **And** Hiển thị cảnh báo: *"Bạn đã đạt giới hạn ví miễn phí (2 cá nhân, 1 chung). Nâng cấp Premium để tạo thêm"*.

### AC 2: Xác thực Ràng buộc Tỷ lệ Hũ (Jar Allocation validation)
*   **Scenario:** Chỉnh sửa tỷ lệ phân bổ của ví.
*   **When** Người dùng kéo tăng/giảm tỷ lệ các hũ sao cho tổng hũ khác 100% (ví dụ: 95% hoặc 105%).
*   **Then** Nút "Lưu tỷ lệ hũ" bị vô hiệu hóa (disabled), không cho phép nhấn lưu.
*   **And** Hiển thị thông báo đỏ cảnh báo tổng tỷ lệ hiện tại chưa đạt 100%.

### AC 3: Xóa mềm ví (Soft delete wallet)
*   **Scenario:** Người dùng xóa ví sở hữu.
*   **Given** Người dùng nhấn nút "Xóa ví" và xác nhận cảnh báo.
*   **Then** Trạng thái ví chuyển sang `is_deleted = true` trên database local và cloud.
*   **And** Ví bị ẩn hoàn toàn khỏi danh sách hiển thị trên UI; số dư và giao dịch liên quan không còn xuất hiện trên Dashboard.
