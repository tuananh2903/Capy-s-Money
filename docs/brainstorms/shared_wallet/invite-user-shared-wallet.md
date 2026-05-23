# Brainstorm: Tính năng mời thành viên vào ví chung

Tài liệu này xác định các đặc tả nghiệp vụ chi tiết cho tính năng mời thành viên tham gia vào ví chung trong ứng dụng Capy's Money, tuân thủ các quy tắc bảo mật và hạn mức gói dịch vụ.

---

## 1. Tổng quan tính năng (Overview)
Tính năng cho phép **Chủ ví (Owner)** của một ví chung tạo ra một mã mời/đường dẫn mời để chia sẻ cho bạn bè thông qua các ứng dụng nhắn tin (Zalo, Messenger, Telegram...). Người nhận khi sử dụng mã/link này sẽ tham gia vào ví chung dưới vai trò thành viên chỉnh sửa.

* **Vai trò mặc định**: Thành viên được mời sẽ có quyền **Editor** (Xem toàn bộ ví, thêm giao dịch mới, chỉnh sửa/xóa giao dịch do chính mình tạo ra. Không có quyền chỉnh sửa/xóa giao dịch của thành viên khác và không có quyền xóa ví).
* **Không sử dụng vai trò Viewer** trong phiên bản này để đơn giản hóa trải nghiệm người dùng.

---

## 2. Quy trình hoạt động (Core Flow)

### 2.1 Trải nghiệm của Chủ ví (Người mời)
1. Truy cập màn hình **Chi tiết ví chung** -> Chọn tab hoặc mục **Thành viên**.
2. Nhấn nút **"Mời thành viên"**.
3. Hệ thống sinh ra một mã mời ngẫu nhiên có định dạng `CAPY-XXXXXX` (với `XXXXXX` là 6 chữ số ngẫu nhiên, ví dụ: `CAPY-829401`).
4. Đi kèm với mã là một đường dẫn kích hoạt (Deep-link): `capymoney://invite?code=CAPY-XXXXXX`.
5. Ứng dụng cung cấp hai nút thao tác nhanh:
   * **Sao chép mã**: Sao chép chuỗi `CAPY-XXXXXX` vào bộ nhớ tạm.
   * **Chia sẻ**: Gọi hộp thoại chia sẻ hệ thống (Native Share Sheet) để người dùng gửi trực tiếp link mời qua Zalo, Messenger, Telegram...

### 2.2 Trải nghiệm của Người nhận (Người được mời)
Có hai cách để người nhận tham gia ví chung:

* **Cách 1: Qua Deep-link**
  1. Người nhận nhấn vào đường link chia sẻ từ tin nhắn.
  2. Ứng dụng Capy's Money tự động mở ra và chuyển đến màn hình **Xác nhận tham gia**.
  3. Màn hình hiển thị hình ảnh mascot Capy thân thiện kèm thông tin: Tên ví chung, tên chủ ví mời, và thông điệp lưu ý quyền riêng tư.
  4. Người nhận nhấn **"Tham gia ngay"** để hoàn tất.

* **Cách 2: Nhập mã thủ công**
  1. Người nhận mở ứng dụng -> Vào mục Danh sách ví -> Chọn **"Tham gia ví bằng mã"**.
  2. Dán hoặc gõ mã mời gồm 9 ký tự (ví dụ: `CAPY-829401`).
  3. Nhấn **"Kiểm tra & Tham gia"** để hệ thống xác thực và thêm vào ví.

---

## 3. Ràng buộc & Logic nghiệp vụ (Business Rules)

### 3.1 Giới hạn và Thời hạn hiệu lực
* **Giới hạn số lượng**: Ví chung trong gói Free chỉ cho phép tối đa **3 thành viên** (bao gồm cả chủ ví). Nếu ví đã đầy (đủ 3 người), người thứ 4 khi bấm tham gia sẽ nhận thông báo: *"Ví đã đầy, vui lòng liên hệ chủ ví."*
* **Thời gian hết hạn**: Mã mời chỉ có hiệu lực trong vòng **24 giờ** kể từ thời điểm tạo. Sau 24 giờ, mã tự động vô hiệu hóa. Người dùng nhập mã hết hạn sẽ nhận thông báo: *"Mã mời này đã hết hạn. Vui lòng yêu cầu chủ ví gửi mã mới."*
* **Số lượng mã hoạt động**: Mỗi ví chung chỉ có **tối đa 1 mã mời hoạt động** tại một thời điểm. Nếu chủ ví tạo mã mới khi mã cũ chưa hết hạn, mã cũ sẽ bị vô hiệu hóa lập tức.

### 3.2 Quy định quyền riêng tư (Privacy)
* Màn hình xác nhận tham gia sẽ hiển thị rõ thông tin bảo mật: *"Lưu ý: Chỉ các giao dịch được tạo trong ví này mới được chia sẻ với thành viên khác. Ví cá nhân của bạn vẫn được bảo mật."*

### 3.3 Yêu cầu kết nối (Online Only)
* Các thao tác tạo mã mời, kiểm tra mã mời và tham gia ví bắt buộc phải có **kết nối mạng Internet**. 
* Nếu thiết bị đang ngoại tuyến, hệ thống sẽ chặn thao tác và hiển thị thông báo: *"Tính năng này cần kết nối Internet. Vui lòng kiểm tra lại kết nối của bạn."*

---

## 4. Bảo mật & Chống dò mã (Rate Limiting)
Do mã mời là chuỗi 6 số cuối dễ đoán, để bảo vệ hệ thống khỏi việc brute-force dò mã tự động:
* **Quy tắc khóa**: Nếu một tài khoản nhập sai mã mời **3 lần liên tiếp** (bất kể là mã của ví nào), tài khoản đó sẽ bị **khóa quyền nhập mã mời trong vòng 1 tiếng (60 phút)**.
* **Thông báo khi bị khóa**: *"Bạn đã nhập sai mã quá nhiều lần. Vui lòng thử lại sau 1 tiếng."*

---

## 5. Quản lý thành viên (Member Management)
* **Xóa thành viên**: Chủ ví (Owner) có toàn quyền xóa các thành viên khác (Editor) ra khỏi ví chung tại màn hình Quản lý thành viên.
* **Xử lý dữ liệu sau khi xóa**:
  * Thành viên bị xóa sẽ lập tức mất quyền truy cập và không còn thấy ví chung này trên danh sách ví của họ.
  * Các giao dịch thành viên đó đã tạo trước đây trong ví chung **vẫn được giữ lại** để tránh làm lệch số dư và lịch sử thu chi của ví.
