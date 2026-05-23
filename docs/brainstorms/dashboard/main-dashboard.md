---
type: brainstorm
feature: dashboard
idea_slug: main-dashboard
status: approved
mode: deep
lang: vi
owner: Antigravity
created: 2026-05-20
updated: 2026-05-20
complexity_flags: [has_multi_role]
links: [Stitch Dashboard Mockup (Mobile)](https://lh3.googleusercontent.com/aida/ADBb0uhRhWJ26ifer82D0pan53TpIzzGWOE8B-to5zgCUbnc8x-iyWPKruhW-3XjBN2BiKzsb9Ls7pX_fdURJNGAN6VRp5xtFLQoivDlAo7_9Thqh8cxPZRP4nE_ixXOKGNGfJEKOKHOaeFYvcMDvO5MtcrHonsBZINoTuXHrqo3guBB2U1SYuxNcncWepLjRR8g4KFsG3LcDbWd5AJjEILJ6AWM_ZTP_NBRSsDu-3YQjqIRsuSO2ycG7sdFL05r)
tags: [brainstorm, dashboard, home-screen]
stale_reason: ""
changelog: []
---

# Báo cáo Brainstorm: Màn hình Dashboard chính (Home Screen) - Capy's Money

> Feature: dashboard | Idea: main-dashboard
> Tài liệu thiết kế ý tưởng độc lập cho màn hình Dashboard chính (Home Screen) thuộc MVP Capy's Money.

## 1. Idea Seed

- Màn hình Dashboard chính hiển thị tổng quan thu/chi của người dùng.
- Giúp người dùng dễ dàng theo dõi tình hình chi tiêu, biết mình tiêu quá tay vào đâu và có thể tiết kiệm ở mục nào.
- Yêu cầu cho MVP:
  - Đồng nhất giao diện cho mọi phân khúc user (không có khác biệt giữa Free và Premium).
  - Hỗ trợ đổi ví (Ví cá nhân và Ví chung). Trong Ví chung, người được mời (role Viewer) có quyền xem và chỉnh sửa giao dịch, nhưng không được phép xóa ví.
  - Cảnh báo ngân sách cho hệ thống 6 chiếc hũ:
    - Khi chi tiêu chạm mốc 80% hạn mức: Đổi màu sang hồng đậm kèm thông báo cảnh báo "Tiêu dùng nhanh!" chỉ khi chi tiêu vượt 80% quá nhanh (ví dụ trước ngày 15 giữa tháng). Nếu cuối tháng mới tiêu hết 80% thì giữ hiển thị bình thường.
    - Khi chi tiêu vượt 100%: Chuyển sang màu đỏ báo động "Vượt hạn mức!".
  - Popup thêm nhanh giao dịch (Quick Add Bottom Sheet) kích hoạt qua nút FAB:
    - Chuyển đổi tab Khoản chi / Khoản thu dạng nút pill.
    - Số tiền nhập (VND) hiển thị lớn và rõ ràng.
    - Lựa chọn Hũ (trong 6 hũ thiết yếu, tiết kiệm, giáo dục, hưởng thụ, đầu tư, từ thiện).
    - Lựa chọn Hạng mục con (được thiết lập tương ứng với hũ đã chọn, ví dụ hũ Thiết yếu có hạng mục con là tiền thuê nhà, ăn uống... người dùng tự thiết lập).
    - Chọn ngày giờ (mặc định là hiện tại) và ghi chú (tùy chọn).

## 2. Context

- **Tại sao cần làm bây giờ?** Dashboard là trung tâm tương tác của ứng dụng Capy's Money (Home Screen). Người dùng cần có trải nghiệm tức thời khi mở app để quản lý tài chính theo triết lý "6 chiếc hũ".
- **Tính năng liên quan:** Quản lý Ví (Ví cá nhân, Ví chung), Lịch sử giao dịch (Ledger), Quản lý ngân sách (Budget & Limits).
- **Nguyên lý thiết kế:** Tuân thủ hệ thống thiết kế Stitch Design System (Màu pastel hồng chủ đạo `#FFB7C5`, font Plus Jakarta Sans, góc bo pill-first `rounded-full` hoặc `rounded-xl`).

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| **Wallet Owner (Chủ ví)** | Khó quản lý nhiều nguồn tiền và kiểm soát các quỹ chung/riêng, sợ chi tiêu lạm vào các quỹ tiết kiệm/đầu tư. | Xem số dư tổng hợp, phân bổ dòng tiền vào 6 hũ tự động và chia sẻ ví chung cho người thân cùng quản lý. |
| **Wallet Editor (Người chỉnh sửa ví)** | Cần cập nhật giao dịch nhanh khi chi tiêu chung mà không muốn thao tác phức tạp, cần biết quỹ chung còn bao nhiêu. | Ghi chép giao dịch nhanh trong 3 giây và xem hạn mức chi tiêu còn lại của các hũ chung. |
| **Wallet Viewer (Người xem ví)** | Được mời vào ví chung nhưng chỉ có vai trò theo dõi hoặc cập nhật hộ giao dịch, lo ngại lỡ tay xóa mất cấu hình ví chung của chủ ví. | Xem báo cáo chi tiêu, thêm giao dịch mới nhưng bị giới hạn quyền xóa ví để bảo vệ an toàn dữ liệu. |

## 4. Capabilities Breakdown

### P0 — must have
- **Wallet Switcher (Bộ chuyển đổi ví):** Thẻ cuộn ngang tại Dashboard để chuyển đổi nhanh giữa các ví cá nhân và ví chung.
- **Tổng số dư tự động:** Tính toán tổng số dư thực tế theo ví được chọn.
- **Hệ thống 6 chiếc hũ (6 Jars Summary):** Hiển thị danh sách 6 hũ với tiến độ chi tiêu (%) và số tiền đã dùng trực quan.
- **Cảnh báo tiến độ thông minh (Smart Budget Alerts):**
  - Trạng thái 1: Chi tiêu vượt 80% hạn mức trước ngày 15 -> Thanh tiến trình màu hồng đậm `#fe9da9` kèm nhãn "Tiêu dùng nhanh!".
  - Trạng thái 2: Chi tiêu vượt 100% hạn mức bất kỳ lúc nào -> Thanh tiến trình màu đỏ `#ba1a1a` kèm nhãn "Vượt hạn mức!".
- **FAB & Quick Add Bottom Sheet (Thêm nhanh giao dịch):** Popup đẩy từ dưới lên hỗ trợ chọn Loại (Thu/Chi), số tiền, hũ, hạng mục con, ngày giờ và ghi chú.

### P1 — should have
- **Đồng bộ hóa ngoại tuyến (Offline-first Sync):** Cho phép thêm nhanh giao dịch khi offline và tự động đồng bộ qua `sync_queue` khi trực tuyến.
- **Thiết lập hạng mục con (Subcategory Management):** Cho phép người dùng trực tiếp quản lý (thêm/sửa/xóa) các hạng mục con tương ứng với từng hũ từ màn hình thiết lập.

### P2 — nice to have
- **Capy Animations:** Hiệu ứng hoạt hình chú chuột lang Capybara động viên khi người dùng tiết kiệm tốt hoặc đưa ra lời khuyên khéo léo khi hũ Thiết yếu chuyển sang màu hồng đậm.

## 5. Core Flows (Happy Path)

### 5.1 Chuyển đổi Ví trên Dashboard (Switch Wallet)

1. Người dùng mở màn hình Dashboard.
2. Hệ thống tải dữ liệu ví đang active mặc định (Ví Cá Nhân Chính).
3. Người dùng thực hiện vuốt ngang (Horizontal scroll) danh sách thẻ ví ở mục "Đổi Ví" và chạm chọn một ví khác (ví dụ: Ví Nhà Chung).
4. Hệ thống cập nhật trạng thái thẻ ví mới thành Active (hiển thị viền hồng gradient và dấu tích xanh, giảm độ sáng các thẻ ví còn lại).
5. Hệ thống tính toán lại tổng số dư, danh sách 6 hũ và ngân sách tương ứng của ví được chọn và cập nhật UI tức thời.

```
+-------------------------------------------------------+
|  User                 Dashboard UI           Database |
+-------------------------------------------------------+
|    |                       |                     |    |
|    |--- Swipes & Taps ---->|                     |    |
|    |    new wallet card    |                     |    |
|    |                       |--- Load wallet ---->|    |
|    |                       |    data (local DB)  |    |
|    |                       |<-- Return balances -|    |
|    |                       |    and jar budgets  |    |
|    |<-- Updates UI with ---|                     |    |
|    |    active state &     |                     |    |
|    |    re-rendered data   |                     |    |
|    |                       |                     |    |
```

### 5.2 Thêm nhanh giao dịch (Quick Add Transaction)

1. Người dùng nhấn nút FAB (Floating Action Button) có dấu cộng ở góc dưới bên phải màn hình.
2. Bottom Sheet "Thêm Giao Dịch" trượt lên từ phía dưới, làm mờ màn hình nền.
3. Người dùng chọn tab "Khoản chi" (mặc định), nhập số tiền bằng bàn phím số hiển thị trên màn hình.
4. Người dùng vuốt chọn Hũ chi tiêu (ví dụ: Thiết yếu).
5. Danh sách các hạng mục con của hũ Thiết yếu tải ra (ví dụ: Ăn uống, Thuê nhà, Khác). Người dùng chọn "Ăn uống".
6. Người dùng giữ ngày giờ mặc định (Hôm nay) hoặc thay đổi, thêm ghi chú (ví dụ: "Ăn trưa với đồng nghiệp") rồi nhấn "Lưu giao dịch".
7. Hệ thống lưu giao dịch vào cơ sở dữ liệu nội bộ (WatermelonDB), cập nhật ngay lập tức số dư và tiến độ hũ trên UI (Optimistic UI update), đồng thời đẩy giao dịch vào hàng đợi đồng bộ (`sync_queue`) lên Supabase.

```
+---------------------------------------------------------------------------------+
| User             Quick Add UI           Local DB (Watermelon)       Supabase (Remote) |
+---------------------------------------------------------------------------------+
|   |                   |                         |                         |     |
|   |-- Tap FAB ------->|                         |                         |     |
|   |   & fill form     |                         |                         |     |
|   |-- Tap "Lưu" ----->|                         |                         |     |
|   |                   |-- Write transaction --->|                         |     |
|   |                   |<-- Success & updated ---|                         |     |
|   |                   |    balances (Instant)   |                         |     |
|   |<-- Close sheet & -|                         |                         |     |
|   |    re-render UI   |                         |                         |     |
|   |                   |-- Sync Queue Trigger ---------------------------->|     |
|   |                   |   (Background)                                    |     |
|   |                   |<-- Sync Confirmed --------------------------------|     |
|   |                   |                         |                         |     |
```

### 5.3 Đánh giá và Cảnh báo Ngân sách Tự động (Budget Warning Assessment)

1. Khi có giao dịch chi tiêu mới được thêm vào một hũ.
2. Hệ thống tính toán lại tỷ lệ chi tiêu của hũ đó: `Tỷ lệ = Số tiền đã tiêu / Hạn mức hũ`.
3. Hệ thống xác định ngày hiện tại trong tháng (`current_day`).
4. Áp dụng logic rẽ nhánh để xác định trạng thái cảnh báo ngân sách.
5. Cập nhật màu sắc thanh tiến trình và nhãn cảnh báo trên Dashboard tương ứng.

```
                                  [Chi tiêu mới]
                                        |
                            [Tính Tỷ lệ = Tiêu/Hạn mức]
                                        |
                                  /           \
                           Tỷ lệ >= 1.0?     Tỷ lệ < 1.0
                              /                   \
                            YES                   NO
                            /                       \
             [Trạng thái: VƯỢT HẠN MỨC]        Tỷ lệ >= 0.8?
             - Màu thanh: Đỏ (#ba1a1a)            /        \
             - Nhãn: "Vượt hạn mức!"            YES        NO
                                                /            \
                                    Ngày trong tháng <= 15?   [Trạng thái: BÌNH THƯỜNG]
                                         /          \         - Màu thanh: Hồng nhạt/Xám
                                       YES          NO        - Không nhãn cảnh báo
                                       /              \
                        [Trạng thái: TIÊU NHANH]     [Trạng thái: BÌNH THƯỜNG]
                        - Màu thanh: Hồng đậm         - Màu thanh: Hồng nhạt/Xám
                          (#fe9da9)                   - Không nhãn cảnh báo
                        - Nhãn: "Tiêu dùng nhanh!"
```

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | Thêm nhanh giao dịch | Khi người dùng nhấn nút "Lưu giao dịch" | Kiểm tra số tiền nhập vào có > 0 không. Nếu hợp lệ, lưu giao dịch vào DB nội bộ. | Nếu số tiền = 0 hoặc để trống, hiển thị thông báo lỗi "Vui lòng nhập số tiền lớn hơn 0" và giữ nguyên giao diện để sửa. |
| D2 | Đánh giá ngân sách hũ | Khi tính toán lại chi tiêu hũ hàng ngày hoặc sau mỗi giao dịch mới | Nếu tỷ lệ tiêu dùng hũ `>= 80%` và ngày hiện tại trong tháng `<= 15`, kích hoạt hiển thị cảnh báo `TIÊU NHANH` (Màu hồng đậm, nhãn "Tiêu dùng nhanh!"). | Nếu đã qua ngày 15, hiển thị thanh tiến trình ở trạng thái bình thường (màu hồng thương hiệu mặc định) không có cảnh báo. |
| D3 | Thao tác trên Ví Chung | Khi người dùng thực hiện hành động xóa ví | Kiểm tra quyền của thành viên. Nếu vai trò là `Owner`, cho phép thực hiện quy trình xóa ví (yêu cầu mật khẩu xác nhận). | Nếu vai trò là `Viewer` hoặc `Editor`, nút "Xóa ví" bị ẩn hoặc báo lỗi "Bạn không có quyền thực hiện hành động này". |

### 6.2 Scenario Matrix (Roles & Permissions)

| From State | To State | Rule | Action | Result |
|------------|----------|------|--------|--------|
| **Viewer** | **Editor/Owner** | Viewer cố tình thực hiện thao tác xóa Ví chung. | Nhấn nút "Xóa ví" từ cài đặt ví. | Hệ thống chặn hành động, hiển thị thông báo: "Chỉ chủ ví mới có quyền xóa ví này." |
| **Viewer** | **Dashboard** | Viewer truy cập Dashboard Ví chung để thêm giao dịch chi tiêu chung. | Nhấn FAB -> Điền thông tin -> Nhấn Lưu giao dịch. | Giao dịch được ghi nhận thành công, số dư ví chung cập nhật cho toàn bộ thành viên. |
| **Bình thường** | **Tiêu dùng nhanh** | Chi tiêu hũ Thiết yếu vượt 80% hạn mức vào ngày 10 của tháng. | Lưu giao dịch chi tiêu mới. | Hũ chuyển sang trạng thái cảnh báo: thanh tiến trình màu hồng đậm `#fe9da9`, hiện icon `bolt` và nhãn "Tiêu dùng nhanh!". |
| **Bình thường** | **Vượt hạn mức** | Chi tiêu hũ Hưởng thụ vượt 100% hạn mức vào bất kỳ ngày nào trong tháng. | Lưu giao dịch chi tiêu mới. | Hũ chuyển sang màu đỏ `#ba1a1a` kèm icon `warning` và nhãn "Vượt hạn mức!". |

### 6.3 Other Edge Cases

- **Ví chưa được thiết lập hạn mức hũ (Empty Budget):** Nếu người dùng chọn ví mới và các hũ chưa được thiết lập hạn mức tháng (hạn mức = 0):
  - Tiến độ hũ sẽ hiển thị dạng xám (Chưa thiết lập) thay vì báo đỏ vượt hạn mức.
  - Hiển thị nút bấm nhỏ "Cài đặt hạn mức" ngay trên thẻ hũ để dẫn người dùng đến màn hình thiết lập hạn mức.
- **Mất kết nối mạng khi đang thêm giao dịch (Offline State):**
  - Giao dịch vẫn được lưu trực tiếp vào WatermelonDB cục bộ.
  - Dashboard cập nhật số dư tức thời để phản ánh đúng số tiền thực tế người dùng vừa chi tiêu.
  - Giao dịch được đánh dấu `sync_status = 'pending'` và tự động đẩy lên Supabase khi thiết bị có kết nối Internet trở lại.
- **Đồng thời chỉnh sửa giao dịch trên nhiều thiết bị (Concurrent edits trên Ví Chung):**
  - Áp dụng cơ chế giải quyết xung đột dựa trên mốc thời gian sửa đổi cuối cùng (`updated_at`). Giao dịch nào có `updated_at` lớn hơn (sau cùng) sẽ ghi đè dữ liệu cũ trên Supabase.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| **Số tiền (Amount)** | Bắt buộc nhập, phải là số nguyên dương lớn hơn 0 và nhỏ hơn 1.000.000.000 đ (tránh lỗi tràn số nhập liệu). |
| **Hũ tài chính (Jar)** | Bắt buộc phải chọn 1 trong 6 hũ tiêu chuẩn. |
| **Hạng mục con (Category)** | Bắt buộc phải chọn 1 hạng mục con hoạt động (nếu hũ chưa có hạng mục nào, hệ thống tự chọn mục mặc định "Khác"). |
| **Ghi chú (Note)** | Không bắt buộc, giới hạn tối đa 200 ký tự. |
| **Ngày giờ (Transaction Date)** | Bắt buộc, không được chọn ngày trong tương lai (không cho phép ghi trước giao dịch tương lai trên dashboard chính). |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| **Hạn mức giao dịch tối đa** | 999.999.999 đ | Mỗi giao dịch | Từ chối lưu, báo lỗi nhập quá giới hạn. |
| **Số lượng ví cá nhân tối đa** | 2 ví | Vĩnh viễn (Free tier) | Ẩn nút "Tạo thêm ví", hiển thị gợi ý nâng cấp (dù MVP chưa phân biệt nhưng cần giữ giới hạn logic). |
| **Số lượng ví chung tối đa** | 1 ví | Vĩnh viễn (Free tier) | Giới hạn tạo tối đa 1 ví chung. |
| **Thành viên ví chung tối đa** | 3 thành viên | Vĩnh viễn | Không cho phép mời thêm thành viên thứ 4 vào ví chung. |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Số tiền nhập bằng 0 hoặc trống | "Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại." | E-TX-001 |
| Chọn ngày giao dịch ở tương lai | "Ngày giao dịch không thể ở tương lai. Vui lòng chọn ngày hôm nay hoặc trước đó." | E-TX-002 |
| Ghi chú quá 200 ký tự | "Ghi chú quá dài (tối đa 200 ký tự). Vui lòng rút ngắn." | E-TX-003 |
| Viewer cố xóa ví chung | "Bạn không có quyền xóa ví chung này. Chỉ chủ ví mới có thể thực hiện." | E-WL-001 |
| Mời quá 3 thành viên vào ví | "Ví chung đã đạt giới hạn tối đa 3 thành viên." | E-WL-002 |

#### Success messages

| Tình huống | Wording |
|---|---|
| Thêm giao dịch thành công | "Đã thêm giao dịch thành công!" |
| Chuyển đổi ví thành công | "Đã chuyển sang [Tên Ví]" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Cảnh báo chi tiêu nhanh (< ngày 15 & >= 80%) | "Tiêu dùng nhanh!" |
| Cảnh báo vượt ngân sách hũ (>= 100%) | "Vượt hạn mức!" |
| Nhắc nhở hũ chưa cài ngân sách | "Chưa cài đặt hạn mức tháng" |

## 8. Assumptions

- **Thời gian hệ thống:** Ứng dụng dựa vào thời gian nội bộ của thiết bị để tính toán xem giao dịch có nằm trước ngày 15 của tháng hay không. Thiết bị của người dùng cần được đồng bộ thời gian chuẩn.
- **Hệ thống 6 Hũ:** Mọi ví (kể cả ví chung) đều được phân bổ theo triết lý 6 hũ tiêu chuẩn. Hạn mức ngân sách được cấu hình theo tháng dương lịch.
- **Tiền tệ:** MVP chỉ hỗ trợ hiển thị và tính toán bằng Việt Nam Đồng (VND).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Người dùng đổi thời gian trên điện thoại để lách luật cảnh báo ngân sách. | Thỉnh thoảng | Hiển thị cảnh báo sai lệch so với thực tế chi tiêu. | Sử dụng thời gian server Supabase làm mốc chuẩn khi đồng bộ và ghi nhận lịch sử cảnh báo nếu cần thiết. |
| Nhiều thành viên ví chung thêm giao dịch cùng lúc khi offline gây lệch số dư. | Hiếm | Số dư hiển thị không chính xác sau khi online trở lại. | Tự động tính toán lại số dư tổng (re-calculate balance) sau khi quá trình đồng bộ sync_queue hoàn tất. |
| Người dùng cảm thấy phiền phức vì cảnh báo "Tiêu dùng nhanh" xuất hiện liên tục. | Thường | Giảm trải nghiệm người dùng, họ có thể tắt thông báo hoặc xóa app. | Cho phép tùy chọn bật/tắt hoặc điều chỉnh ngưỡng cảnh báo chi tiêu nhanh trong phần cài đặt của từng hũ. |

## 10. Success Criteria (preliminary)

- **Tốc độ ghi chép (Time-to-Transaction):** Người dùng hoàn thành thêm nhanh 1 giao dịch qua Bottom Sheet trong vòng dưới 4 giây.
- **Tốc độ tải Dashboard (Dashboard Load Time):** Màn hình chính render dữ liệu số dư và tiến độ hũ dưới 300ms nhờ cơ chế cache local-first của WatermelonDB.
- **Tỷ lệ đồng bộ lỗi (Sync Error Rate):** Dưới 0.5% tổng số giao dịch ngoại tuyến bị lỗi khi đồng bộ lên Supabase.

## 11. Open Questions

- [x] **OQ-1**: Người dùng có được phép tự định nghĩa lại tỷ lệ phần trăm phân bổ mặc định của 6 hũ trên dashboard (ví dụ: Thiết yếu 50%, Tiết kiệm 15%...) hay bắt buộc phải theo tỷ lệ chuẩn 55-10-10-10-10-5?
  - *Trả lời*: Có, người dùng có thể tự điều chỉnh tỷ lệ này tại màn hình/tab **"Cài đặt Hũ" (Jar Settings)** hoặc **"Phân bổ Hũ" (Jar Allocation)**.
- [x] **OQ-2**: Đối với Ví Chung, ngân sách của 6 hũ là ngân sách chung của cả ví hay mỗi thành viên có hạn mức chi tiêu riêng trong từng hũ?
  - *Trả lời*: Đây là hạn mức chi tiêu dùng chung cho cả ví (tất cả các thành viên cùng tiêu chung trên một tổng hạn mức hũ).
- [x] **OQ-3**: Có cần hỗ trợ đính kèm hình ảnh hóa đơn/chứng từ vào phần Ghi chú của popup Thêm nhanh giao dịch ngay trong bản MVP không?
  - *Trả lời*: MVP chưa cần tính năng đính kèm hình ảnh hóa đơn này.

## 12. Next Steps

Sau khi bạn duyệt qua bản Brainstorm này, chúng ta sẽ thực hiện các bước sau:
1. Viết tài liệu **User Requirements Document (URD)** cho tính năng Dashboard & Quick Add.
2. Viết tài liệu **Business Requirements Document (BRD)** để định rõ luật tính toán ngân sách và quyền hạn thành viên.
3. Viết tài liệu **Product Requirements Document (PRD)** để chốt scope kỹ thuật cho phần triển khai code.
