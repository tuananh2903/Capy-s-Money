# Business Requirements Document (BRD) - Sổ Giao Dịch

## 1. Context & Business Problem
Theo thống kê, hành vi ghi chép chi tiêu thủ công thất bại chủ yếu do quy trình nhập liệu quá rườm rà (quá nhiều trường thông tin) hoặc giao diện hiển thị lịch sử giao dịch khó theo dõi. Người dùng không thấy được bức tranh tổng quan của dòng tiền theo từng ngày hoặc cả tháng.
Ứng dụng cần một hệ thống **Sổ giao dịch (Ledger)** mạnh mẽ giúp đơn giản hóa việc nhập liệu (chỉ trong 3 bước), hiển thị dòng tiền trực quan qua 3 góc nhìn khác nhau (Hàng ngày, Hàng tháng, Lịch) và hỗ trợ quản lý chi tiêu nhóm minh bạch.

## 2. Business Objectives & Success Metrics
*   **Thời gian ghi chép nhanh:** Người dùng có thể hoàn thành việc nhập 1 giao dịch mới trong vòng dưới `5 giây`.
*   **Trải nghiệm xem mượt mà:** Khả năng chuyển đổi qua lại giữa 3 chế độ xem (Daily, Monthly, Calendar) tức thì, không có độ trễ tải dữ liệu từ server.
*   **Quản lý chi tiêu minh bạch:** Thành viên ví chung có thể thấy được ai đã ghi chép giao dịch nào, vào thời gian nào để tránh tranh cãi tài chính.

## 3. Core Business Features
*   **3 Chế độ xem lịch sử linh hoạt:**
    *   *Daily (Hàng ngày):* Phù hợp để kiểm tra dòng tiền chi tiết phát sinh hôm nay hoặc hôm qua.
    *   *Monthly (Hàng tháng):* Giúp người dùng so sánh tổng thu nhập vs tổng chi tiêu của tháng để biết mình đang thặng dư hay thâm hụt tài chính.
    *   *Calendar (Lịch):* Trực quan hóa tần suất chi tiêu bằng đồ thị màu sắc trên ô lịch, giúp người dùng nhận ra ngày nào mình tiêu quá tay.
*   **Ghi chép nhanh (FAB Quick Add):**
    *   Nút bấm nổi bật dễ tiếp cận ở mọi màn hình.
    *   Hỗ trợ tự động gợi ý các danh mục chi tiêu phổ biến (Ăn uống, Đi lại, Nhà cửa).
