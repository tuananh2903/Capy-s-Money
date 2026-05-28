# Business Requirements Document (BRD) - Quản lý Ví

## 1. Context & Business Problem
Người dùng quản lý tài chính có nhu cầu tách bạch dòng tiền cho các mục đích sử dụng khác nhau (Ví chi tiêu hàng ngày, Ví tiết kiệm dài hạn, Ví chung chi tiêu cùng gia đình/bạn bè).
Tuy nhiên, chi phí vận hành máy chủ và cơ sở dữ liệu đồng bộ đám mây thực tế rất lớn. Để đảm bảo mô hình kinh doanh bền vững, ứng dụng cần áp đặt giới hạn sử dụng tài nguyên (Quota Gating) đối với tài khoản miễn phí (Free Tier), đồng thời cung cấp động lực nâng cấp gói Premium (không giới hạn ví, cho phép thêm nhiều thành viên ví chung).

## 2. Business Objectives & Success Metrics
*   **Thúc đẩy chuyển đổi trả phí (Premium Conversion):** Chuyển đổi thành công tối thiểu `3%` tập người dùng hoạt động sang gói trả phí nhờ cơ chế giới hạn quota ví chung và ví cá nhân.
*   **Trải nghiệm hợp tác tài chính tốt:** Tối ưu hóa tính năng Ví chung (Shared Wallet) giúp các cặp đôi/nhóm bạn có thể dễ dàng quản lý quỹ chung một cách minh bạch.
*   **Bảo mật dữ liệu:** Đảm bảo phân quyền chi tiết (Owner, Editor, Viewer) trên ví chung để tránh các hành vi phá hoại dữ liệu giao dịch hoặc cấu hình ví ngoài ý muốn.

## 3. Core Business Rules & Quotas

### 3.1 Quota Gating (Giới hạn tài nguyên)

| Loại tài nguyên | Gói Free (Mặc định) | Gói Premium |
| :--- | :--- | :--- |
| **Số ví cá nhân tối đa** | 2 ví hoạt động | Không giới hạn |
| **Số ví chung tối đa** | 1 ví chung hoạt động | Không giới hạn |
| **Số thành viên ví chung tối đa**| Tối đa 3 thành viên (bao gồm cả chủ ví) | Không giới hạn |

### 3.2 Phân quyền thành viên ví chung (Role-based Access Control)
*   **Chủ ví (Owner):** Có toàn quyền điều chỉnh tỷ lệ hũ, đặt làm mặc định, mời/xóa thành viên, xóa ví (soft delete).
*   **Người chỉnh sửa (Editor):** Có quyền thêm giao dịch, điều chỉnh tỷ lệ hũ, đặt làm mặc định. Không thể mời/xóa thành viên hoặc xóa ví.
*   **Người xem (Viewer):** Chỉ có quyền xem số dư và lịch sử giao dịch. Nút **Cài đặt ví ⚙️** bị ẩn hoàn toàn để ngăn chặn mọi hành vi truy cập cấu hình ví hoặc thay đổi tỷ lệ hũ.
