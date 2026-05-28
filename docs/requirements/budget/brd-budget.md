# Business Requirements Document (BRD) - Ngân Sách

## 1. Context & Business Problem
Hạn chế lớn nhất của việc ghi chép chi tiêu thụ động là người dùng chỉ biết mình đã tiêu bao nhiêu tiền sau khi việc đã rồi. Nếu không có cơ chế lập kế hoạch và cảnh báo trước, người dùng dễ dàng chi tiêu quá tay ngay trong tuần đầu tiên của tháng, dẫn tới thâm hụt tài chính.
Do đó, ứng dụng cần tính năng **Ngân sách (Budget)** để thiết lập hạn mức trần chi tiêu cho từng hũ tài chính, đồng thời có hệ thống cảnh báo sớm thông minh để điều chỉnh hành vi tiêu dùng của người dùng theo thời gian thực.

## 2. Business Objectives & Success Metrics
*   **Kỷ luật chi tiêu:** Giúp trên 70% người dùng thiết lập ngân sách không bị chi tiêu vượt quá hạn mức trần vào cuối tháng.
*   **Cảnh báo kịp thời:** Đưa ra cảnh báo tốc độ chi tiêu quá nhanh (Spending Too Fast) trước khi người dùng thực sự tiêu hết tiền của hũ, giúp họ có 2-3 tuần điều chỉnh thói quen sinh hoạt.

## 3. Core Business Features
*   **Cài đặt ngân sách theo hũ (Jar Budgeting):**
    *   Người dùng thiết lập hạn mức tiền tối đa cho từng hũ tài chính cụ thể hàng tháng.
    *   Ngân sách được quản lý riêng biệt theo từng ví để phục vụ cho các mục tiêu độc lập.
*   **Visual Warning Badges (Nhãn cảnh báo thông minh):**
    *   Sử dụng màu sắc và thông điệp tương phản cao (Đỏ/Cam/Xanh) để cảnh báo trạng thái tiêu dùng của từng hũ trên cả Trang chủ và màn hình Ngân sách.
    *   Mascot Capy tích hợp cảnh báo để đưa ra nhắc nhở trực quan khi người dùng truy cập.
