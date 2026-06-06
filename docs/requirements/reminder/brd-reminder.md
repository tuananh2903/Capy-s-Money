# Business Requirements Document (BRD) - Daily Reminder Notifications

## 1. Context & Business Problem
Người dùng tải ứng dụng quản lý tài chính thường quên ghi chép giao dịch trong ngày. Nếu một ngày trôi qua mà không có hoạt động nào được ghi lại, khả năng người dùng tiếp tục sử dụng app vào tuần tiếp theo giảm đáng kể. 
Để duy trì thói quen và cải thiện tỷ lệ hoạt động hàng ngày (DAU), ứng dụng cần một cơ chế nhắc nhở thân thiện và thông minh vào thời điểm cuối ngày (9:00 PM), nhưng chỉ gửi nếu cả ngày hôm đó người dùng chưa ghi chép bất kỳ khoản thu chi nào. Việc tránh gửi thông báo phiền toái khi họ đã chủ động ghi chép là chìa khóa để tránh người dùng tắt thông báo của app.

## 2. Business Objectives & Success Metrics
*   **Cải thiện Tỷ lệ Giữ chân (Retention Rate):** Tăng tỷ lệ giữ chân hàng tuần (Weekly Retention) lên thêm 15% nhờ cơ chế nhắc nhở cuối ngày.
*   **Tránh Spam:** 100% không gửi thông báo nhắc nhở nếu người dùng đã có phát sinh giao dịch trong ngày, bảo đảm trải nghiệm thoải mái nhất.

## 3. Core Business Logic
*   **Thời gian nhắc nhở:** 9:00 PM hàng ngày theo múi giờ địa phương của thiết bị.
*   **Điều kiện kích hoạt:** Trong ngày hiện hành (tính từ 00:00:00 đến 20:59:59), tổng số lượng giao dịch của người dùng trên toàn bộ các ví bằng `0`.
