# Product Requirements Document (PRD): Màn hình Dashboard & Thêm Giao Dịch Nhanh (MVP)

| Tài liệu | Yêu cầu Sản phẩm (PRD) |
|---|---|
| **Feature** | Dashboard & Quick Add Transaction |
| **Trạng thái** | Approved (Đã phê duyệt từ Brainstorm) |
| **Phiên bản** | 1.0.0 |
| **Tác giả** | Antigravity |
| **Dự án** | Capy's Money |

---

## 1. Tổng quan & Mục tiêu (Overview & Objectives)

### 1.1 Mục tiêu sản phẩm
Màn hình Dashboard chính (Home Screen) là giao diện trung tâm của ứng dụng Capy's Money. Mục tiêu của màn hình này là mang lại trải nghiệm quản lý tài chính "chill", nhẹ nhàng nhưng cực kỳ trực quan và hiệu quả dựa trên phương pháp **6 chiếc hũ tài chính**.

Tài liệu này định nghĩa chi tiết các yêu cầu sản phẩm cho bản MVP bao gồm:
1. **Wallet Switcher:** Chuyển đổi linh hoạt giữa các ví cá nhân và ví chung.
2. **6-Jar System Summary:** Xem tổng quan số dư và tiến độ chi tiêu theo 6 hũ.
3. **Smart Budget Alerts:** Nhận cảnh báo chi tiêu thông minh bằng màu sắc và nhãn trực quan.
4. **Quick Add Bottom Sheet:** Nhập nhanh giao dịch thu/chi trong vòng 3-4 giây.
5. **Phân bổ Hũ (Jar Allocation):** Điều chỉnh tỷ lệ phần trăm phân bổ tiền của 6 hũ.

### 1.2 Yêu cầu MVP
- Đồng nhất trải nghiệm: Không phân biệt tài khoản Free/Premium cho các chức năng cốt lõi trên Dashboard ở bản MVP.
- Offline-first: Đảm bảo phản hồi UI tức thời (dưới 300ms) thông qua cơ chế lưu trữ cục bộ (WatermelonDB) và đồng bộ ngầm (Supabase).

---

## 2. Đối tượng Người dùng & Quyền hạn (User Roles & Permissions)

MVP hỗ trợ hai loại ví chính: **Ví cá nhân** (Personal Wallet) và **Ví chung** (Shared Wallet) với các vai trò phân quyền rõ ràng:

| Quyền hạn / Thao tác | Ví Cá Nhân (Chủ ví) | Ví Chung (Owner - Chủ ví) | Ví Chung (Editor - Người sửa) | Ví Chung (Viewer - Người xem) |
|---|:---:|:---:|:---:|:---:|
| **Xem Dashboard & Số dư** | ✅ Có | ✅ Có | ✅ Có | ✅ Có |
| **Chuyển đổi ví trên màn hình chính** | ✅ Có | ✅ Có | ✅ Có | ✅ Có |
| **Thêm mới giao dịch (Quick Add)** | ✅ Có | ✅ Có | ✅ Có | ✅ Có |
| **Chỉnh sửa giao dịch** | ✅ Có | ✅ Có | ✅ Có | ✅ Có |
| **Xóa giao dịch** | ✅ Có | ✅ Có | ✅ Có | ❌ Không |
| **Quản lý thành viên ví** | ❌ Không áp dụng | ✅ Có | ❌ Không | ❌ Không |
| **Cấu hình ngân sách hũ (Limits)** | ✅ Có | ✅ Có | ❌ Không | ❌ Không |
| **Xóa ví** | ✅ Có | ✅ Có | ❌ Không | ❌ Không |

*Lưu ý: Đối với Ví Chung, hạn mức/ngân sách của 6 hũ là **hạn mức chung cho cả ví**. Mọi thành viên được mời vào ví đều chi tiêu chung trên một hạn mức tổng.*

---

## 3. Các Tính Năng Chi Tiết (Functional Requirements)

### 3.1 Bộ chuyển đổi Ví (Wallet Switcher)
Nằm ở góc trên cùng của màn hình chính, cho phép cuộn ngang qua danh sách các ví mà người dùng có quyền truy cập.

- **Yêu cầu UI/UX:**
  - Thiết kế thẻ ví bo tròn dạng pill/card mềm mại theo Stitch Design System.
  - Thẻ ví đang kích hoạt (Active): Hiển thị đầy đủ màu sắc, có viền hồng gradient nổi bật (`bg-gradient-to-br from-primary-container to-secondary-container`) kèm icon tích xanh (`check_circle`).
  - Thẻ ví không kích hoạt (Inactive): Làm mờ (`opacity-60`), không có viền nổi bật.
- **Yêu cầu hệ thống:**
  - Khi người dùng chạm chọn thẻ ví khác, hệ thống sẽ tải lại toàn bộ số dư và ngân sách 6 hũ của ví đó từ DB nội bộ và cập nhật UI ngay lập tức.
  - Lưu trạng thái ví active gần nhất của người dùng. Khi mở app lần sau, tự động mở ví này.

### 3.2 Tổng quan 6 chiếc Hũ (6-Jar Summary Section)
Hiển thị danh sách 6 hũ tài chính tiêu chuẩn dưới dạng các thẻ tiến trình (Progress Bar).

- **Sáu hũ tiêu chuẩn bao gồm:**
  1. Hũ Thiết yếu (Necessities - NEC)
  2. Hũ Tiết kiệm (Long-term Savings - FFA)
  3. Hũ Giáo dục (Education - EDU)
  4. Hũ Hưởng thụ (Play - PLAY)
  5. Hũ Đầu tư (Financial Freedom - LTSS)
  6. Hũ Từ thiện (Give - GIVE)
- **Thông tin hiển thị trên mỗi thẻ hũ:**
  - Tên hũ và icon đại diện.
  - Số tiền đã chi tiêu và hạn mức ngân sách của tháng hiện tại (Ví dụ: `8,200,000 đ / 10,000,000 đ`).
  - Thanh tiến trình trực quan thể hiện tỷ lệ % đã chi tiêu.
  - Nhãn cảnh báo thông minh (nếu có).

### 3.3 Cảnh báo Ngân sách Thông minh (Smart Budget Alerts)
Hệ thống tự động tính toán tiến độ chi tiêu theo thời gian thực và đưa ra các cảnh báo trực quan dựa trên tỷ lệ và ngày trong tháng.

- **Logic Cảnh báo:**
  - **Trạng thái Tiêu dùng nhanh (SPENDING_TOO_FAST):**
    - *Điều kiện kích hoạt:* Tỷ lệ chi tiêu của hũ `>= 80%` và ngày hiện tại của tháng `<= 15`.
    - *Thể hiện trên UI:* Thanh tiến trình đổi sang màu hồng đậm thương hiệu (`#fe9da9`), hiển thị icon tia sét (`bolt`) và nhãn cảnh báo `"Tiêu dùng nhanh!"`.
    - *Mục đích:* Nhắc nhở người dùng rằng họ đang tiêu quá nhanh ngay ở nửa đầu tháng.
  - **Trạng thái Vượt hạn mức (OVER_BUDGET):**
    - *Điều kiện kích hoạt:* Tỷ lệ chi tiêu của hũ `>= 100%` tại bất kỳ thời điểm nào trong tháng.
    - *Thể hiện trên UI:* Thanh tiến trình đổi sang màu đỏ báo động (`#ba1a1a`), hiển thị icon cảnh báo (`warning`) và nhãn `"Vượt hạn mức!"`.
  - **Trạng thái Bình thường (NORMAL):**
    - *Điều kiện kích hoạt:* Chi tiêu dưới 80% hạn mức, hoặc đạt 80% - 99% nhưng đã qua ngày 15 của tháng.
    - *Thể hiện trên UI:* Thanh tiến trình hiển thị màu hồng pastel thương hiệu mặc định (`#ffb7c5`), không kèm nhãn cảnh báo.

### 3.4 Màn hình Cài đặt Phân bổ Hũ (Jar Allocation Settings)
Người dùng có thể cá nhân hóa kế hoạch tài chính bằng cách cấu hình tỷ lệ phân bổ của các hũ.

- **Yêu cầu chức năng:**
  - Hiển thị tỷ lệ phần trăm phân bổ của 6 hũ dưới dạng thanh kéo trượt (slider) hoặc nhập số trực tiếp.
  - **Quy tắc bắt buộc:** Tổng tỷ lệ phần trăm của 6 hũ phải luôn bằng **100%**. Nếu tổng khác 100%, nút "Lưu cấu hình" sẽ bị khóa và hiển thị cảnh báo đỏ nhắc nhở.
  - Tỷ lệ mặc định khi khởi tạo ví: Thiết yếu 55% | Tiết kiệm 10% | Giáo dục 10% | Hưởng thụ 10% | Đầu tư 10% | Từ thiện 5%.
  - Khi người dùng điều chỉnh tỷ lệ và lưu, các khoản thu nhập (Income) mới được thêm vào sau đó sẽ tự động được gợi ý phân bổ vào các hũ theo tỷ lệ mới.

### 3.5 Popup Thêm nhanh Giao dịch (Quick Add Bottom Sheet)
Được kích hoạt thông qua nút FAB tròn lớn ở góc dưới màn hình. Thiết kế trượt lên mềm mại từ cạnh dưới điện thoại, che phủ một phần màn hình nền bằng lớp overlay mờ.

- **Các trường thông tin đầu vào:**
  1. **Loại giao dịch (Tab):** Chuyển đổi giữa "Khoản chi" (Expense - mặc định) và "Khoản thu" (Income) dưới dạng nút pill-tab.
  2. **Số tiền (Amount):** Ô nhập số tiền lớn rõ ràng, định dạng tiền tệ VND tự động (ví dụ: `50,000 đ`). Chỉ hỗ trợ nhập số dương lớn hơn 0.
  3. **Hũ tài chính (Jar Selection):** Danh sách 6 hũ cuộn ngang kèm icon trực quan để người dùng nhấn chọn nhanh.
  4. **Hạng mục con (Category Selection):** Hiển thị danh sách các hạng mục con tương ứng với hũ đã chọn (ví dụ chọn hũ "Thiết yếu" sẽ hiện các mục: *Ăn uống, Tiền nhà, Di chuyển, Khác*). Người dùng có thể tự cấu hình danh sách hạng mục này trong phần Cài đặt.
  5. **Thời gian (Date Picker):** Mặc định là ngày giờ hiện tại. Cho phép chạm để chọn ngày khác (không cho phép chọn ngày ở tương lai).
  6. **Ghi chú (Note - Tùy chọn):** Ô nhập văn bản tự do, giới hạn tối đa 200 ký tự.
- **Tương tác:**
  - Nút "Lưu giao dịch" nổi bật ở dưới cùng.
  - Có tay cầm drag handle ở trên đầu Bottom Sheet để người dùng có thể vuốt xuống để đóng nhanh.

---

## 4. Yêu cầu Dữ liệu & Luồng Đồng Bộ (Data & Sync Requirements)

### 4.1 Cơ sở dữ liệu nội bộ (WatermelonDB) và Supabase
Hệ thống sử dụng WatermelonDB cho cơ sở dữ liệu nội bộ để đảm bảo tốc độ phản hồi offline. Mọi dữ liệu sẽ được ánh xạ 1-1 với Supabase PostgreSQL ở phía Cloud Server.

Các thực thể (Entities) cần quản lý:
- **Wallets (Ví):** `id`, `name`, `type` (personal/shared), `owner_id`, `created_at`, `updated_at`.
- **WalletMembers (Thành viên ví):** `id`, `wallet_id`, `user_id`, `role` (owner/editor/viewer).
- **Jars (Hũ ngân sách):** `id`, `wallet_id`, `type` (NEC/FFA/EDU/PLAY/LTSS/GIVE), `budget_limit`, `spent_amount`, `allocation_percentage`.
- **Categories (Hạng mục con):** `id`, `jar_type`, `name`, `icon`, `is_custom` (do user tự thêm).
- **Transactions (Giao dịch):** `id`, `wallet_id`, `user_id`, `type` (expense/income), `amount`, `jar_type`, `category_id`, `transaction_date`, `note`, `sync_status` (pending/synced).

### 4.2 Cơ chế Đồng bộ hóa ngoại tuyến (Offline Sync Flow)
1. Khi thêm/sửa giao dịch, hệ thống ghi trực tiếp vào local DB (WatermelonDB) và cập nhật số dư hiển thị ngay lập tức (Optimistic UI).
2. Tạo bản ghi hàng đợi đồng bộ với trạng thái `sync_status = 'pending'`.
3. Nếu thiết bị online, Edge Function đồng bộ của app sẽ được kích hoạt ngầm để đẩy thay đổi lên Supabase PostgreSQL. Sau khi thành công, chuyển trạng thái sang `'synced'`.
4. Nếu thiết bị offline, hàng đợi sẽ được giữ lại. Hệ thống sẽ lắng nghe trạng thái mạng (NetInfo). Ngay khi thiết bị online trở lại, tự động thực hiện tiến trình đồng bộ các bản ghi pending.

---

## 5. Yêu cầu Phi Chức Năng (Non-Functional Requirements)

### 5.1 Hiệu năng (Performance)
- **Tốc độ phản hồi UI:** Màn hình Dashboard và popup Thêm nhanh phải tải dữ liệu cục bộ và hiển thị trong dưới **300ms**.
- **Tốc độ Lưu giao dịch:** Khi nhấn "Lưu", popup phải đóng ngay và UI Dashboard cập nhật số dư mới trong dưới **100ms** (không chờ đợi phản hồi từ server).

### 5.2 Giao diện & Thẩm mỹ (Aesthetics & Styling)
- Áp dụng triết lý thiết kế Stitch Design: Sử dụng màu pastel hồng nhẹ nhàng làm chủ đạo (`#FFB7C5`), các cạnh bo góc lớn dạng viên thuốc (Pill shape), font chữ hiện đại **Plus Jakarta Sans**.
- Các màu cảnh báo (hồng đậm, đỏ) phải đảm bảo độ tương phản cao, dễ đọc trên nền sáng và có kèm theo icon bổ trợ để hỗ trợ người mù màu.

### 5.3 Bảo mật & An toàn dữ liệu
- Cơ chế RLS (Row Level Security) được bật trên tất cả các bảng ở Supabase, đảm bảo người dùng chỉ có thể đọc/ghi các ví và giao dịch mà họ là thành viên (được kiểm chứng qua JWT token).
- Viewer của ví chung tuyệt đối bị chặn quyền gọi API xóa ví chung ở cả phía client và phía cơ sở dữ liệu Supabase RLS.

---

## 6. Các Giới Hạn & Kiểm Soát Lỗi (Limits & Error Handling)

### 6.1 Giới hạn hệ thống (Quotas & Limits)
- Giới hạn tiền giao dịch: Số tiền nhập tối đa cho 1 giao dịch là `999.999.999 đ`.
- Giới hạn ký tự: Ghi chú giao dịch không vượt quá `200 ký tự`.
- Giới hạn MVP cho tài khoản (Free tier mặc định):
  - Tối đa `2 ví cá nhân`.
  - Tối đa `1 ví chung` với tối đa `3 thành viên`.

### 6.2 Xử lý lỗi nhập liệu (Wording chi tiết)
- Nhập số tiền bằng 0 hoặc bỏ trống: *"Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại."*
- Chọn ngày giao dịch ở tương lai: *"Ngày giao dịch không thể ở tương lai. Vui lòng chọn ngày hôm nay hoặc trước đó."*
- Ghi chú quá dài: *"Ghi chú quá dài (tối đa 200 ký tự). Vui lòng rút ngắn."*
- Viewer cố xóa ví chung: *"Bạn không có quyền xóa ví chung này. Chỉ chủ ví mới có thể thực hiện."*

---

## 7. Các Chỉ Số Thành Công (Success Metrics)

1. **Thời gian thêm giao dịch trung bình (Time-to-Transaction):** Dưới 4 giây kể từ khi chạm nút FAB đến khi giao dịch được lưu cục bộ.
2. **Tỷ lệ giữ chân người dùng (Retention):** Tăng tần suất truy cập hàng ngày của người dùng nhờ trải nghiệm ghi chép nhanh và không gây áp lực.
3. **Tỷ lệ đồng bộ thành công:** Đạt trên 99.5% các giao dịch được đồng bộ lên Supabase không bị xung đột hoặc mất mát dữ liệu.
