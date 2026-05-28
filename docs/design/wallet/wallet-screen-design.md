# Đặc tả Thiết kế: Màn hình Quản lý Ví (Wallet Screen Design)

Tài liệu này đặc tả chi tiết giao diện và luồng nghiệp vụ của màn hình **Ví (Wallets)** cho ứng dụng Capy's Money, giúp người dùng quản lý danh sách ví, cấu hình tỷ lệ phân bổ 6 hũ tài chính, và quản lý thành viên ví chung.

---

## 1. Tổng quan & Mục tiêu (Overview & Goal)

Mục tiêu của màn hình Ví là cung cấp một giao diện trung tâm để người dùng quản lý tài sản tài chính (ví cá nhân và ví chung) một cách trực quan, đồng thời thiết lập kế hoạch phân bổ tiền thông minh vào 6 hũ tài chính.

### Các chức năng chính:
1.  **Danh sách Ví (Wallet Deck):** Hiển thị danh sách ví dưới dạng thẻ (cards) gradient bo góc tròn, hiển thị số dư và loại ví.
2.  **Đặt ví Mặc định (Set Default):** Đánh dấu ví mặc định hiển thị khi khởi động app, đồng bộ hóa qua Cloud DB.
3.  **Tùy chỉnh 6 Hũ (Jar Allocation):** Điều chỉnh tỷ lệ phần trăm phân bổ thu nhập cho 6 hũ bằng thanh trượt trực quan.
4.  **Quản lý ví chung (Shared Wallet Management):** Hiển thị danh sách thành viên và nút mời thành viên mới bằng liên kết/mã invite.
5.  **Tạo Ví Mới:** Thêm ví mới (giới hạn 2 ví cá nhân, 1 ví chung cho gói Free) với luồng thiết lập đầy đủ.
6.  **Xóa Ví (Soft Delete):** Xóa mềm ví và ẩn lịch sử giao dịch kèm cảnh báo mạnh mẽ để tránh mất mát dữ liệu sync.

---

## 2. Giao diện Người dùng (UI/UX Specification)

### 2.1 Màn hình chính: Danh sách Ví
*   **Thẻ Ví (Wallet Card):**
    *   Sử dụng bo góc `borderRadius: 20`, đổ bóng hồng mờ nhạt (`rgba(255, 183, 197, 0.2)`).
    *   Màu nền: Sử dụng gradient tuyến tính (`LinearGradient`). 
        *   *Ví cá nhân:* Gradient từ hồng nhạt `#FFB7C5` sang đỏ đất `#944652`.
        *   *Ví chung:* Gradient từ hồng san hô `#FE9DA9` sang xám ấm `#71585C`.
    *   Nội dung thẻ: Tên ví, Nhãn loại ví (Cá nhân / Ví chung), Số dư lớn ở góc dưới trái, và nút **"Cài đặt ⚙️"** ở góc dưới phải.
*   **Nút "+ Tạo ví mới" & Kiểm soát Giới hạn (Quota Gating):**
    *   Thiết kế dạng viên thuốc lớn (`borderRadius: 9999`), màu đỏ hồng `#944652`, căn giữa ở dưới cùng danh sách ví.
    *   **Logic Gating:** Khi hệ thống kiểm tra người dùng thuộc gói `free` và đã đạt giới hạn (tối đa 2 ví cá nhân, 1 ví chung):
        *   Nút chuyển sang trạng thái **Vô hiệu hóa (Disabled)**, màu xám nhạt `#D6C2C4`, text màu xám tối `#837375`.
        *   Hiển thị dòng ghi chú nhỏ bên dưới nút: *"Bạn đã đạt giới hạn ví miễn phí (2 cá nhân, 1 chung). Nâng cấp Premium để tạo thêm"*.

### 2.2 Bottom Sheet Tạo Ví Mới
*   Trượt lên từ cạnh dưới khi nhấn "+ Tạo ví mới" (chỉ khi chưa vượt quá giới hạn).
*   **Các trường thông tin:**
    *   **Tên ví (Text Input):** Bắt buộc, giới hạn 1–32 ký tự.
    *   **Loại ví (Segmented Control):** Chọn giữa "Cá nhân" (Personal) và "Ví chung" (Shared).
    *   **Số dư ban đầu (Numeric Input):** Nhập số tiền khởi tạo (mặc định bằng 0đ).
    *   **Màu sắc & Icon (Grid Picker):** Chọn từ danh sách 6 màu pastel và 6 icon Capy/Nhà/Ví cơ bản có sẵn.
    *   **Nút Lưu:** Chỉ sáng và kích hoạt khi Tên ví đã được điền.

### 2.3 Bottom Sheet Cài đặt Ví (Settings Sheet)
*   Kích hoạt khi nhấn nút **"Cài đặt ⚙️"** trên thẻ ví.
*   **Phân quyền hiển thị:**
    *   **Viewer:** Ẩn hoàn toàn nút "Cài đặt ⚙️". Người xem ví chung không thể truy cập cấu hình ví.
    *   **Owner / Editor:** Xem được cấu hình ví và điều chỉnh tỷ lệ hũ.
*   **Quản lý thành viên (chỉ xuất hiện đối với Ví chung):**
    *   Hiển thị danh sách thành viên hiện tại kèm vai trò (Chủ ví, Người sửa, Người xem).
    *   **Nút "➕ Mời thành viên mới":** Nhấn vào sẽ kích hoạt popup/screen mời thành viên (`WalletInviteScreen`) để sinh link hoặc mã mời (tối đa 3 người cho gói Free).
*   **Cấu hình phân bổ 6 Hũ (Jar Allocation Sliders):**
    *   Hiển thị danh sách 6 hũ tài chính (Thiết yếu - NEC, Tiết kiệm - LTSS, Giáo dục - EDU, Hưởng thụ - PLAY, Đầu tư - FFA, Từ thiện - GIVE).
    *   Mỗi hũ có một thanh kéo trượt (Slider) để tăng/giảm phần trăm.
    *   Góc trên cùng hiển thị nhãn **"Tổng hũ: X%"**.
    *   Nút **"Lưu tỷ lệ hũ"** chỉ kích hoạt khi tổng tỷ lệ của 6 hũ bằng **chính xác 100%**. Nếu khác 100%, nút sẽ bị vô hiệu hóa.
    *   Có nút phụ **"Đặt lại mặc định"** để gán nhanh tỷ lệ về mức chuẩn (NEC 55%, LTSS 10%, EDU 10%, PLAY 10%, FFA 10%, GIVE 5%).
*   **Tính năng đặt làm mặc định:**
    *   Nút bấm **"⭐ Mặc định"** (hoặc "Đặt làm mặc định"). Khi bấm, gửi request cập nhật cột `is_default = true` cho ví hiện tại lên Supabase Cloud DB và set các ví khác của tài khoản đó về `is_default = false`.
*   **Hành động Xóa ví (Delete Wallet):**
    *   Nút **"🗑️ Xóa ví"** màu đỏ ở góc dưới sheet (chỉ hiển thị cho Owner của ví).
    *   Khi nhấn, hiển thị Popup xác nhận hệ thống với câu chữ cảnh báo:
        > *"Cảnh báo: Bạn có chắc chắn muốn xóa ví '[Tên ví]' không? Hành động này sẽ ẩn toàn bộ lịch sử chi tiêu của ví này và không thể hiển thị lại trên ứng dụng."*
    *   Xác nhận xóa sẽ kích hoạt luồng **xóa mềm (soft delete)** bằng cách cập nhật cột `is_deleted = true` trên bảng `wallets` và ẩn ví khỏi UI.

---

## 3. Thiết kế Cấu trúc Dữ liệu & API (Data & API Design)

### 3.1 Cập nhật Database & RLS Triggers
*   **Bảng `public.wallets`:**
    *   Trường `is_default` BOOLEAN mặc định `FALSE`.
    *   Khi cập nhật ví mặc định, cần thực hiện cập nhật toàn bộ ví khác của người dùng thành `FALSE`. Chúng ta sẽ xử lý việc này bằng một Transaction hoặc một hàm Postgres Function để tránh bất đồng bộ.
*   **Giới hạn số lượng ví (Free tier trigger):**
    *   Trigger `wallet_limit_check` hoạt động trên bảng `public.wallets` ở mức database RLS để ngăn chặn việc tạo ví lách luật từ API bên ngoài.

```sql
-- Hàm Postgres cập nhật ví mặc định an toàn
CREATE OR REPLACE FUNCTION set_default_wallet(p_wallet_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.wallets 
  SET is_default = FALSE 
  WHERE created_by = p_user_id;

  UPDATE public.wallets 
  SET is_default = TRUE 
  WHERE id = p_wallet_id AND created_by = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 Tích hợp Offline-first (WatermelonDB)
*   Các thao tác Tạo ví, Đổi tên/màu sắc/icon, Đặt mặc định, Cập nhật tỷ lệ hũ, Xóa ví đều được ghi vào **WatermelonDB local** trước tiên.
*   Hệ thống đẩy các thay đổi này vào `sync_queue` với trạng thái `pending` và thực hiện đồng bộ lên Supabase ngầm khi có mạng.
*   Xóa ví thực hiện đặt cờ `is_deleted = TRUE` thay vì gọi lệnh `DELETE` cứng trên DB để đảm bảo luồng sync hoạt động đồng bộ.

---

## 4. Kế hoạch Kiểm thử & Xác minh (Verification Plan)

### 4.1 Kiểm thử Tự động (Automated Tests)
*   **Unit Tests:**
    *   Kiểm thử hàm `updateJarAllocations` với các tham số tổng khác 100% (mong đợi trả về lỗi) và bằng 100% (mong đợi thành công).
    *   Kiểm thử logic vô hiệu hóa nút "+ Tạo ví mới" khi danh sách ví cá nhân đạt 2 và ví chung đạt 1.
*   **Integration Tests:**
    *   Kiểm thử gọi hàm `set_default_wallet` trên Supabase, xác minh chỉ duy nhất 1 ví có `is_default = true`.
    *   Kiểm thử RLS trên bảng `wallets` and `wallet_members`, xác minh người dùng có vai trò `viewer` bị từ chối cập nhật tên ví hoặc tỷ lệ hũ từ API.

### 4.2 Kiểm thử Thủ công (Manual Verification)
*   **Kiểm tra giao diện:** Mở giả lập, chuyển sang tab Ví, xác minh giao diện thẻ ví hiển thị đúng màu gradient của Stitch.
*   **Kiểm tra giới hạn:** Tạo đủ 2 ví cá nhân và 1 ví chung trên tài khoản Free. Xác minh nút "+ Tạo ví mới" bị mờ và hiển thị đúng dòng thông báo giới hạn.
*   **Kiểm tra thanh trượt hũ:** Thử kéo thanh trượt cấu hình hũ sao cho tổng khác 100% và kiểm tra nút "Lưu" có bị khóa hay không.
*   **Kiểm tra phân quyền Viewer:** Dùng tài khoản của một thành viên được mời làm Viewer, kiểm tra xem nút "Cài đặt ⚙️" trên thẻ ví chung có bị ẩn hoàn toàn hay không.
