# Tài liệu Yêu cầu: Trang Chủ (Dashboard Screen)

Tài liệu này bao gồm các yêu cầu Nghiệp vụ (BRD), Sản phẩm (PRD), và Đặc tả Kỹ thuật (SRS) cho **Trang Chủ (Dashboard)**.

---

## 1. Yêu cầu Nghiệp vụ (BRD)
*   **Mục tiêu:** Cung cấp cho người dùng một giao diện trung tâm trực quan hiển thị tức thì tình hình tài chính tổng quan, số dư của ví hiện tại, tiến độ chi tiêu của 6 hũ tài chính để từ đó đưa ra quyết định chi tiêu hợp lý.
*   **Mascot Tương tác:** Sử dụng chú chuột lang Capy làm đại diện để trò chuyện, cổ vũ và nhắc nhở người dùng ghi chép chi tiêu mỗi ngày, tạo cảm giác thân thiện và tăng tỷ lệ giữ chân người dùng (Retention Rate).

---

## 2. Yêu cầu Sản phẩm (PRD)

### 2.1 Thành phần Giao diện
*   **Header:** Hiển thị Avatar người dùng, Tên hiển thị cá nhân hóa và nút chuông thông báo. Nhấp vào Avatar sẽ mở Menu dropdown chứa các tùy chọn (Thông tin cá nhân, Cài đặt, Đăng xuất).
*   **Bộ chuyển đổi Ví (Wallet Switcher):** Thanh cuộn ngang chứa danh sách các ví đang hoạt động (Ví cá nhân & Ví chung). Cho phép người dùng bấm chuyển đổi để thay đổi ví làm việc hiện tại.
*   **Mascot Capy Quote Card:**
    *   Hộp thoại Capy Mascot hiển thị ngẫu nhiên các câu thoại hài hước hoặc thông thái về tiền bạc.
*   **Tiến độ 6 Hũ (Jar Progress Bars):**
    *   Hiển thị danh sách 6 hũ tương ứng của ví active: Thiết yếu (NEC), Tiết kiệm (LTSS), Giáo dục (EDU), Hưởng thụ (PLAY), Đầu tư (FFA), Từ thiện (GIVE).
    *   Mỗi hũ có một thanh tiến trình biểu thị tỉ lệ phần trăm số tiền đã tiêu so với ngân sách hạn mức thiết lập.
    *   Hiển thị nhãn cảnh báo động: `VỰT HẠN MỨC!` (Đỏ) hoặc `TIÊU DÙNG NHANH!` (Cam) nếu chi tiêu tăng quá nhanh.

---

## 3. Đặc tả Kỹ thuật (SRS)

### 3.1 APIs & Dịch vụ tích hợp
*   **`fetchWallets(userId)`:** Lấy danh sách ví hoạt động (không bị xóa mềm) của người dùng hoặc các ví chung được chia sẻ.
*   **`fetchJars(walletId)`:** Lấy thông tin chi tiết số dư, hạn mức, số tiền đã chi tiêu và tỷ lệ phần trăm phân bổ của 6 hũ thuộc ví được chọn.
*   **`ensureJarsExist(walletId, jars, ratios)`:** Hàm đảm bảo khởi tạo đầy đủ 6 hũ khi người dùng truy cập ví lần đầu.

### 3.2 Logic Cảnh báo Ngân sách (Budget Checker)
*   Hệ thống kiểm tra ngân sách cục bộ dựa trên tỷ lệ phần trăm thời gian trôi qua trong tháng:
    *   Tỷ lệ thời gian trôi qua: `elapsedDays / totalDaysInMonth`.
    *   Nếu `spent_amount > budget_limit`, trả về cảnh báo `OVER_BUDGET` (Vượt hạn mức).
    *   Nếu tỷ lệ số tiền tiêu dùng vượt quá tỷ lệ thời gian trôi qua hơn 20% (và tổng tiêu dùng đã vượt 50% hạn mức), trả về cảnh báo `SPENDING_TOO_FAST` (Tiêu dùng nhanh).
*   Đồng bộ ví hoạt động cuối cùng của người dùng bằng cách lưu trữ `last_active_wallet_id_${userId}` vào `AsyncStorage` cục bộ để khôi phục khi mở lại ứng dụng.
