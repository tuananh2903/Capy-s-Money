---
type: prd
status: draft
created: 2026-05-21
updated: 2026-05-21
version: 1.0.0
owner: "@TuanAnh"
designs:
  stitch:
    - title: "Mời thành viên Ví chung (Mobile)"
      id: "909bcf3d87ce42e8b7e8331467f04dd8"
      url: "https://lh3.googleusercontent.com/aida/ADBb0uj29UEH0bNzynYkMV-D7nk6qF8yePFA2p8-cTN3k5itAcgQjy2-U9Ki3PdMYiH1tguLaO9XSKAt-4-H-zBVjick20Gmm8SfYSt1oap4ZXS-NMFIpkpX7AgyzVxd5gwebz0JxjL8jXezmwHawysv_T1QuUBRXQXAJjzTMfvwe5fPdEr37IdjO7RCj2eWiF_R37ow-gthJNv28XSJ_wmgOMutnDL1ej3gILc7aGXC5gP5p_3TwW43HbrVxjY_"
    - title: "Tham gia Ví chung (Mobile)"
      id: "dcfb4ed6725c4548984ff5be53e04dab"
      url: "https://lh3.googleusercontent.com/aida/ADBb0uhu5EpW_GGpeUEzZDdQodAa829Y1AYphhaKZbtdscWsUojlXP3g2AtAxlL6Vg3veHSJkydVqrDqJuPiMesdzhKAKhUc1y_1wy8mSMxTEXzJTchH2j9cBzmyNbzhYdecE7sA_5N4Zqt7yFB7Rngfn2ohLeAsA8_anv8yu61tfPh8S-zPh0nQZ_Rew46-Wi87SryQw3VPflIUbie8V6MyizrHry-qGRZLq8YDW13Pg6HhOd1wdQveORo8fQr5"
links:
  - docs/design/wallet/srs-shared-wallet-invite.md
---

# Product Requirements Document (PRD) — Shared Wallet Invitation

| Project | Capy's Money (Quản lý tài chính cá nhân thân thiện) |
|---|---|
| **Feature** | Shared Wallet Invitation (Mời thành viên vào ví chung) |
| **Status** | Approved |
| **Version** | 1.0.0 |
| **Date** | 2026-05-21 |
| **Author** | Antigravity AI & Tran Tuan Anh |
| **Feature Slug** | `wallet` |

---

## 1. Mục tiêu sản phẩm (Product Goals & Business Context)

### 1.1 Vấn đề cần giải quyết
Hiện tại, người dùng Capy's Money muốn cùng nhau quản lý chi tiêu (cặp đôi, gia đình, bạn cùng phòng) nhưng chưa có phương thức kết nối ví chung thuận tiện. Việc tạo và tham gia ví chung cần được thực hiện nhanh chóng, trực quan, bảo mật cao và giảm thiểu các rào cản thao tác (nhập tay phức tạp).

### 1.2 Mục tiêu tính năng
* Cung cấp cơ chế tạo và chia sẻ mã mời/link mời ví chung chỉ với 1 lượt chạm.
* Đảm bảo tính riêng tư dữ liệu cá nhân của các thành viên.
* Bảo mật hệ thống chống tấn công dò mã (brute-force).
* Giới hạn chặt chẽ số lượng thành viên trong phạm vi gói dịch vụ MVP Free.

---

## 2. Đối tượng người dùng mục tiêu (Target Audience)
* **Chủ ví (Wallet Owner)**: Người tạo ví chung và muốn rủ người khác tham gia cùng để quản lý.
* **Người được mời (Invitee)**: Bạn bè, người thân nhận được mã/link mời và muốn tham gia ghi chép tài chính chung.

---

## 3. Yêu cầu chi tiết tính năng (Functional Requirements)

### 3.1 Use Cases & User Stories
| ID | User Story (Mô tả hành vi) | Quyền hạn & Điều kiện |
|---|---|---|
| **US-01** | Là một Chủ ví, tôi muốn tạo mã mời để gửi cho bạn bè tham gia ví chung của tôi. | Chỉ Owner. Cần kết nối mạng. |
| **US-02** | Là một Chủ ví, tôi muốn chia sẻ link mời trực tiếp qua Zalo/Messenger/Telegram từ điện thoại của tôi. | Chỉ Owner. Cần kết nối mạng. |
| **US-03** | Là một Người được mời, tôi muốn nhấp vào link mời để tự động mở ứng dụng, xem thông tin ví chung và nhấn nút đồng ý tham gia. | Bất kỳ ai nhận được link. Cần cài app & có mạng. |
| **US-04** | Là một Người được mời, tôi muốn tự gõ/dán mã mời trực tiếp vào ứng dụng để tham gia ví chung nếu không bấm được link. | Bất kỳ ai có mã. Cần có mạng. |
| **US-05** | Là một Chủ ví, tôi muốn xóa một thành viên ra khỏi ví chung của tôi. | Chỉ Owner. Cần kết nối mạng. |

### 3.2 Quy định vai trò & Phân quyền (Permissions)
Khi thành viên tham gia thành công qua mã mời, họ sẽ mặc định nhận vai trò **Editor** với phân quyền như sau:

* **Editor**:
  * Được xem toàn bộ số dư và lịch sử giao dịch của ví chung.
  * Được tạo giao dịch mới (thu/chi/chuyển khoản) trong ví chung.
  * Được chỉnh sửa hoặc xóa giao dịch **do chính mình tạo ra** trong ví chung.
  * **KHÔNG ĐƯỢC** chỉnh sửa/xóa giao dịch của thành viên khác tạo.
  * **KHÔNG ĐƯỢC** mời thêm thành viên mới.
  * **KHÔNG ĐƯỢC** thay đổi cấu hình phần trăm hũ tài chính hoặc xóa ví chung.
* **Owner (Chủ ví)**:
  * Toàn quyền quản trị ví, quản lý thành viên, đặt hạn mức, cấu hình hũ tài chính, chỉnh sửa/xóa mọi giao dịch và xóa ví.

---

## 4. Đặc tả luồng hoạt động & UI/UX (UI/UX Specification)

### 4.1 Luồng tạo & Chia sẻ mã mời (Owner Flow)
1. **Điểm truy cập (Entry Point)**: Màn hình **Cấu hình ví chung** hoặc tab **Thành viên** trên màn hình ví chung.
2. **Hành động**: Nhấn nút **"Mời thành viên"** (Button: Pill-shaped, Primary color).
3. **Xử lý hệ thống**:
   * Kiểm tra số lượng thành viên hiện tại của ví (bao gồm Owner). Nếu đã đạt tối đa 3 thành viên, hiển thị thông báo lỗi và chặn tạo mã: *"Ví đã đầy, không thể mời thêm thành viên."*
   * Sinh mã mời ngẫu nhiên có dạng `CAPY-XXXXXX` (với `XXXXXX` là 6 số ngẫu nhiên từ 000000 đến 999999).
   * Sinh link kích hoạt: `capymoney://invite?code=CAPY-XXXXXX`.
   * Ghi nhận mã vào cơ sở dữ liệu với `expires_at = NOW() + 24 giờ`.
   * Nếu trước đó đã tồn tại mã mời nào chưa hết hạn của ví này, chuyển trạng thái của mã cũ thành `expired` lập tức (Đảm bảo mỗi ví chỉ có tối đa 1 mã hoạt động tại 1 thời điểm).
4. **Hiển thị kết quả**:
   * Xuất hiện một bottom sheet hoặc card hiển thị mã `CAPY-XXXXXX` bằng font chữ to, dễ đọc.
   * Thẻ ghi chú: *"Mã mời sẽ hết hạn sau 24 giờ."*
   * Nút **"Sao chép mã"** (icon copy) -> Sao chép chuỗi mã vào clipboard.
   * Nút **"Chia sẻ link"** (icon share) -> Gọi native share sheet để chọn ứng dụng nhắn tin.

**Thiết kế Stitch Giao diện Mời thành viên (Chủ ví):**
![Mời thành viên Ví chung (Mobile)](https://lh3.googleusercontent.com/aida/ADBb0uj29UEH0bNzynYkMV-D7nk6qF8yePFA2p8-cTN3k5itAcgQjy2-U9Ki3PdMYiH1tguLaO9XSKAt-4-H-zBVjick20Gmm8SfYSt1oap4ZXS-NMFIpkpX7AgyzVxd5gwebz0JxjL8jXezmwHawysv_T1QuUBRXQXAJjzTMfvwe5fPdEr37IdjO7RCj2eWiF_R37ow-gthJNv28XSJ_wmgOMutnDL1ej3gILc7aGXC5gP5p_3TwW43HbrVxjY_)

### 4.2 Luồng tham gia ví (Invitee Flow)

#### 4.2.1 Cách 1: Người dùng nhấp vào link mời (Deep-link)
1. Người dùng mở tin nhắn chứa link `capymoney://invite?code=CAPY-XXXXXX`.
2. Hệ điều hành kích hoạt app Capy's Money.
3. Ứng dụng tự động điều hướng sang màn hình **Xác nhận tham gia**.
4. **Màn hình hiển thị**:
   * Mascot Capy vui vẻ.
   * Nhãn: *"🦦 Bạn nhận được lời mời tham gia ví chung!"*
   * Tên ví chung, Tên chủ ví mời.
   * Cảnh báo riêng tư: *"Lưu ý: Chỉ các giao dịch được tạo trong ví này mới được chia sẻ với thành viên khác. Ví cá nhân của bạn vẫn được bảo mật."*
   * Nút **"Tham gia ngay"** (màu Primary container).
   * Nút **"Từ chối"** (màu Outline/Gray).

#### 4.2.2 Cách 2: Người dùng nhập mã thủ công
1. Người dùng mở app -> Màn hình Danh sách ví -> Nhấn nút **"Tham gia ví bằng mã"**.
2. Ô nhập liệu (Input: 32px rounded, filled) hiển thị gợi ý placeholder: `CAPY-123456`.
3. Người dùng nhập mã -> Nhấn **"Kiểm tra & Tham gia"**.

**Thiết kế Stitch Giao diện Nhận lời mời & Nhập mã (Người nhận):**
![Tham gia Ví chung (Mobile)](https://lh3.googleusercontent.com/aida/ADBb0uhu5EpW_GGpeUEzZDdQodAa829Y1AYphhaKZbtdscWsUojlXP3g2AtAxlL6Vg3veHSJkydVqrDqJuPiMesdzhKAKhUc1y_1wy8mSMxTEXzJTchH2j9cBzmyNbzhYdecE7sA_5N4Zqt7yFB7Rngfn2ohLeAsA8_anv8yu61tfPh8S-zPh0nQZ_Rew46-Wi87SryQw3VPflIUbie8V6MyizrHry-qGRZLq8YDW13Pg6HhOd1wdQveORo8fQr5)

#### 4.2.3 Logic kiểm tra & Lỗi khi tham gia
Khi người dùng bấm xác nhận tham gia (ở cả hai cách), hệ thống thực hiện kiểm tra tuần tự:
* **Kiểm tra mạng**: Nếu offline -> Báo lỗi: *"Tính năng này cần kết nối Internet. Vui lòng kiểm tra lại kết nối của bạn."*
* **Kiểm tra khóa brute-force**: Nếu tài khoản đang bị khóa do nhập sai -> Báo lỗi: *"Bạn đã nhập sai mã quá nhiều lần. Vui lòng thử lại sau 1 tiếng."*
* **Kiểm tra tồn tại**: Nếu mã không có trên DB -> Tăng bộ đếm nhập sai -> Báo lỗi: *"Mã mời không tồn tại. Vui lòng kiểm tra lại."*
* **Kiểm tra thời hạn**: Nếu `expires_at` nhỏ hơn thời gian hiện tại -> Báo lỗi: *"Mã mời này đã hết hạn. Vui lòng yêu cầu chủ ví gửi mã mới."*
* **Kiểm tra trùng lặp**: Nếu người dùng đã là thành viên của ví -> Báo lỗi: *"Bạn đã tham gia ví chung này rồi."*
* **Kiểm tra số lượng thành viên**: Đếm số bản ghi trong `wallet_members` của ví. Nếu đã đạt 3 thành viên -> Báo lỗi: *"Ví đã đầy, vui lòng liên hệ chủ ví."*

Nếu vượt qua tất cả kiểm tra:
* Thêm bản ghi mới vào `wallet_members` với `user_id = auth.uid()`, `role = 'editor'`.
* Chuyển hướng người dùng về màn hình Dashboard của ví chung vừa tham gia.
* Hiển thị thông báo thành công: *"Chúc mừng! Bạn đã tham gia thành công vào ví chung [Tên ví]."*
* Gửi Push Notification đến chủ ví: *"🦦 [Tên bạn bè] đã tham gia vào ví chung [Tên ví] của bạn!"*

---

## 5. Ràng buộc bảo mật & Chống dò mã (Security & Anti-brute-force)
* **Quy tắc đếm lỗi**: Bộ đếm lỗi nhập sai được gắn trực tiếp với tài khoản người dùng (`profiles` metadata hoặc bảng lịch sử lượt thử).
* **Khóa tài khoản nhập mã**: Nếu nhập sai 3 lần liên tiếp trong ngày, khóa quyền nhập/chấp nhận mã mời của tài khoản đó trong vòng **60 phút (1 tiếng)**.
* **Tự động mở khóa**: Sau 1 tiếng, hệ thống tự động reset bộ đếm lỗi về 0 và cho phép người dùng thử lại.

---

## 6. Ngoại lệ & Quản lý thành viên (Exceptions & Management)

### 6.1 Xóa thành viên
* Chỉ Owner mới thấy nút **"Xóa khỏi ví"** bên cạnh tên của Editor trong màn hình cấu hình.
* Khi nhấn xóa:
  * Hệ thống hỏi lại: *"Bạn có chắc chắn muốn xóa thành viên [Tên] ra khỏi ví chung?"*
  * Nếu đồng ý: Xóa dòng tương ứng trong `wallet_members`.
  * Thành viên bị xóa sẽ lập tức bị thu hồi token truy cập ví chung.
  * Các giao dịch thành viên bị xóa đã nhập trong quá khứ **giữ nguyên**, không bị xóa để tránh làm lệch số dư và lịch sử giao dịch của ví.

### 6.2 Xóa ví chung
* Nếu Owner xóa ví chung, bảng `wallet_invitations` và `wallet_members` liên kết sẽ được xóa tự động thông qua cấu hình `ON DELETE CASCADE` của PostgreSQL.

---

## 7. Các điểm loại trừ ở phiên bản MVP (Out of Scope)
* Chưa hỗ trợ phân bổ các role phức tạp khác (ví dụ: chỉ cho xem - Viewer).
* Chưa hỗ trợ tự động chia sẻ quyền cho các ví cá nhân khác.
* Chưa hỗ trợ chuyển quyền sở hữu ví chung (Transfer Wallet Ownership).
