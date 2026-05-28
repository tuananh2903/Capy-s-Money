# Product Requirements Document (PRD) - Sổ Giao Dịch

## 1. Yêu cầu Giao diện & Trải nghiệm (UI/UX)
*   **Tab Hàng ngày (Daily):** Hiển thị danh sách giao dịch nhóm theo ngày giảm dần (mới nhất ở trên cùng). Mỗi ngày hiển thị tổng thu nhập và tổng chi tiêu.
*   **Tab Hàng tháng (Monthly):** Hiển thị tổng thu nhập, tổng chi tiêu trong tháng hiện tại và danh mục biểu đồ các khoản chi tiêu chiếm tỷ trọng lớn nhất.
*   **Tab Lịch (Calendar):** Hiển thị lịch tháng trực quan. Ngày có giao dịch chi tiêu hiển thị chấm đỏ, ngày có giao dịch thu nhập hiển thị chấm xanh lá cây. Nhấp vào một ngày sẽ hiển thị danh sách giao dịch của ngày đó ở bên dưới.
*   **Luồng Tạo Giao Dịch Nhanh (Quick Add Sheet):**
    *   Trượt lên dưới dạng Bottom Sheet từ nút FAB `+` ở Trang chủ hoặc Sổ giao dịch.
    *   Nhập số tiền, loại giao dịch (Thu nhập, Chi tiêu, Chuyển khoản), Hũ nguồn/Hũ đích, Danh mục chi tiết, Ghi chú.
    *   Cập nhật số dư ví cục bộ ngay lập tức (Optimistic UI) để đem lại trải nghiệm mượt mà.
