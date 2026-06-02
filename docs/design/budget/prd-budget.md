# Product Requirements Document (PRD) - Ngân Sách

## 1. Yêu cầu Giao diện & Trải nghiệm (UI/UX)
*   **Thiết lập Hạn mức:**
    *   Hiển thị danh sách 6 hũ tài chính hiện tại.
    *   Mỗi hũ có ô nhập số tiền hạn mức mong muốn thiết lập cho tháng hiện hành (ví dụ: hũ Thiết yếu (NEC) giới hạn 5,000,000 đ/tháng).
    *   Nhập số tiền bằng bộ gõ số trực quan.
*   **Visual Alert Badge (Huy hiệu cảnh báo):**
    *   Hệ thống tính toán tiến độ chi tiêu thực tế để hiển thị nhãn cảnh báo trực quan kế bên từng hũ:
        *   `Bình thường` (Màu xanh): Chi tiêu thực tế dưới 70% hạn mức.
        *   `Tiêu dùng nhanh` (Màu cam): Chi tiêu thực tế vượt mức dự kiến trung bình theo ngày trôi qua trong tháng hoặc đạt 70%-99% hạn mức.
        *   `Vượt hạn mức!` (Màu đỏ): Chi tiêu thực tế đạt hoặc vượt quá 100% hạn mức đã cài đặt.
        *   Cảnh báo ngân sách hỗ trợ gating hạn mức cho gói Free.

---

## 2. Tính năng Dồn ngân sách (Budget Rollover)
Tính năng cho phép kết nối ngân sách tháng hiện tại với tháng sau, tự động bù trừ số tiền dư thừa hoặc lạm chi vào đầu chu kỳ mới.

### 2.1. Yêu cầu chức năng
*   **Trạng thái bật/tắt (Toggle):**
    *   Đặt tại màn hình Quản lý ngân sách (`BudgetScreen.tsx`), ngay dưới thông tin tổng ngân sách ví.
    *   Nút bật/tắt phải có phản hồi thị giác sinh động (Micro-interactions, chuyển đổi icon trạng thái, phát hạt hiệu ứng).
*   **Cơ chế hoạt động:**
    *   **Thặng dư (Surplus):** Nếu thực chi thấp hơn hạn mức vào ngày cuối tháng, số tiền thừa sẽ được cộng thêm vào hạn mức thực tế của tháng sau.
    *   **Thâm hụt (Deficit):** Nếu thực chi vượt hạn mức (lạm chi), số tiền lạm chi sẽ bị trừ trực tiếp vào hạn mức thực tế của tháng sau.
*   **Hiển thị xem trước (Preview):**
    *   Khi bật Toggle, hiển thị ngay số tiền dự kiến sẽ được dồn sang tháng sau dựa trên số liệu chi tiêu hiện tại.
    *   Hiển thị nhãn trạng thái đi kèm rõ ràng: `+X.XXX.XXXđ Dồn dư` (màu xanh lá) hoặc `-X.XXX.XXXđ Bù lạm chi` (màu đỏ).
*   **Thông báo & Cảnh báo (Notifications):**
    *   Vào ngày đầu tiên của tháng mới, gửi thông báo đẩy (Push Notification) tóm tắt kết quả dồn tiền cho người dùng.
    *   Hiển thị Banner cảnh báo/chúc mừng trực quan trên Tab **Trang chủ** (Home) để người dùng nắm được ngân sách thực tế mới.
    *   Capy Mascot cập nhật lời thoại phản hồi tương ứng với trạng thái thặng dư hoặc thâm hụt.

### 2.2. User Stories
*   *Là một người dùng kỷ luật*, tôi muốn dồn số tiền chưa tiêu hết sang tháng sau để có thể tự thưởng cho mình một món quà lớn hơn mà không lo bị quá tay.
*   *Là một người dùng đang học cách tiết kiệm*, tôi muốn số tiền lạm chi của tháng này bị trừ đi ở tháng sau để tôi có động lực thắt chặt chi tiêu và tự cân đối tài chính.

### 2.3. Ràng buộc gói cước (Gating)
*   Tính năng này được mở rộng cho **tất cả người dùng** (cả gói miễn phí và Premium đều có đầy đủ tính năng dồn ngân sách bù trừ hai chiều thặng dư và thâm hụt như nhau).


