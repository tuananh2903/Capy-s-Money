# Tài liệu Đặc tả các Kịch bản Kiểm thử (Test Cases Specification) — Capy's Money

Tài liệu này mô tả chi tiết bằng ngôn ngữ tự nhiên về toàn bộ các kịch bản kiểm thử (test cases) đang có trong dự án **Capy's Money**, bao gồm cả kiểm thử đơn vị & tích hợp (chạy bằng Jest thông qua npm) và kiểm thử đầu-cuối E2E (chạy bằng Playwright cho Web và Maestro cho Mobile).

---

## 1. Tổng quan Hệ thống Kiểm thử
Dự án áp dụng mô hình kiểm thử toàn diện 3 cấp độ:
1. **Unit & Integration Tests (NPM / Jest)**: Kiểm tra hoạt động của các hàm xử lý logic (Services, Utils) và giao diện thành phần (Screens, Components) bằng cách cô lập và mô phỏng (mocking) API cơ sở dữ liệu Supabase và AsyncStorage.
2. **Web E2E Tests (Playwright)**: Chạy ứng dụng trên nền tảng Web giả lập, thực hiện các thao tác click, nhập liệu, chuyển trang thực tế và kiểm tra phản hồi từ giao diện Web.
3. **Mobile E2E Tests (Maestro)**: Chạy ứng dụng di động gốc trên Android Emulator hoặc iOS Simulator, thực hiện kiểm tra trải nghiệm người dùng thực tế trên điện thoại.

---

## 2. Chi tiết kịch bản Kiểm thử Đơn vị & Tích hợp (Jest / NPM)
Các file test được chạy bằng lệnh `npm test`, nằm trong thư mục [tests/](file:///d:/Personal%20projects/Capy's%20Money/tests).

### 2.1 Kiểm thử các Dịch vụ Logic (Services)
Nằm tại [tests/services/](file:///d:/Personal%20projects/Capy's%20Money/tests/services):

*   **[profileService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/profileService.test.ts)**:
    *   *Lấy ngân sách tổng của người dùng*: Đảm bảo hàm `fetchTotalBudget` gọi đúng API Supabase truy vấn bảng `profiles` theo ID người dùng và trả về đúng số tiền ngân sách.
    *   *Cập nhật ngân sách tổng*: Đảm bảo hàm `updateTotalBudget` cập nhật chính xác cột `total_budget` của dòng tương ứng trong bảng `profiles`.
*   **[dashboardService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/dashboardService.test.ts)**:
    *   *Lấy danh sách Hũ*: Đảm bảo trả về đúng các hũ tài chính của người dùng dựa trên `user_id` và lọc bỏ các hũ có tỷ lệ phân bổ bằng 0.
    *   *Đảm bảo các Hũ mặc định tồn tại*: Khi người dùng mới đăng nhập, hệ thống sẽ kiểm tra xem họ đã có đủ 6 hũ mặc định (NEC, FFA, EDU, PLAY, LTSS, GIVE) hay chưa. Nếu thiếu, tự động tạo mới các hũ này trong database với tỷ lệ phân bổ mặc định.
    *   *Cập nhật tỷ lệ phân bổ Hũ*: Kiểm tra việc ghi nhận tỷ lệ phân bổ mới của các hũ và tính toán lại hạn mức tiền tương ứng.
*   **[budgetService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/budgetService.test.ts)**:
    *   *Lấy danh sách hạn mức danh mục*: Đảm bảo lấy đúng thông tin hạn mức ngân sách của các hạng mục con dựa theo tài khoản người dùng (`user_id`).
    *   *Lưu hạn mức danh mục*: Kiểm tra việc thêm mới hoặc cập nhật hạn mức chi tiêu cho từng hạng mục con của hũ.
    *   *Xóa Hũ / Hạn mức*: Kiểm tra xem khi thực hiện xóa hũ hoặc danh mục con, hệ thống có gọi API xóa hẳn bản ghi khỏi bảng tương ứng trong Supabase hay không.
*   **[authService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/authService.test.ts)**:
    *   *Đăng nhập bằng Email*: Kiểm tra luồng gửi thông tin đăng nhập tới Supabase Auth, trả về session và lưu thông tin người dùng.
    *   *Đăng ký tài khoản*: Kiểm tra việc gọi API đăng ký, thiết lập hồ sơ người dùng ban đầu.
    *   *Đăng nhập bằng Google (OAuth)*: Kiểm tra luồng điều hướng, xử lý deep link callbacks và thiết lập phiên đăng nhập trên thiết bị.
*   **[ledgerService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/ledgerService.test.ts)**:
    *   *Thêm giao dịch*: Đảm bảo lưu đúng số tiền, ghi chú, loại giao dịch (thu/chi), ví sử dụng, hũ liên kết và danh mục con.
    *   *Lấy lịch sử giao dịch*: Đảm bảo hiển thị đúng danh sách giao dịch có phân trang và lọc theo ví/hũ.
*   **[notificationService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/notificationService.test.ts)**:
    *   Yêu cầu quyền thông báo và lên lịch nhắc nhở ghi chép chi tiêu hàng ngày.
*   **[onboardingService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/onboardingService.test.ts)**:
    *   Thiết lập ví đầu tiên và hoàn thành các câu hỏi khảo sát Onboarding cho tài khoản mới.

### 2.2 Kiểm thử Giao diện & Màn hình (Screens & Components)
Nằm tại [tests/screens/](file:///d:/Personal%20projects/Capy's%20Money/tests/screens) và [tests/components/](file:///d:/Personal%20projects/Capy's%20Money/tests/components):

*   **[BudgetScreen.test.tsx](file:///d:/Personal%20projects/Capy's%20Money/tests/screens/BudgetScreen.test.tsx)**:
    *   *Tải dữ liệu*: Kiểm tra hiển thị tổng ngân sách lấy từ database profile (ví dụ: hiển thị dạng `10.000.000đ`).
    *   *Thay đổi tổng ngân sách*: Nhấn nút sửa, nhập số mới (ví dụ: `15.000.000đ`), nhấn Lưu và kiểm tra xem hệ thống có cập nhật lên Supabase và tự động chia lại số dư hạn mức cho các hũ con hay không.
    *   *Kiểm tra tính hợp lệ*: Nhập tổng ngân sách `<= 0` sẽ hiện cảnh báo lỗi.
    *   *Tính năng dồn ngân sách (Rollover)*: Bật nút dồn ngân sách, kiểm tra xem giao diện hiển thị đúng phần dự báo tháng sau (thặng dư dồn thêm hoặc thâm hụt trừ đi dựa trên chi tiêu thực tế).
    *   *Bật/tắt cảnh báo vượt hạn mức*: Đảm bảo bật được cảnh báo, và nếu bật quá 3 cảnh báo ở tài khoản Free sẽ kích hoạt modal nâng cấp Premium.
*   **[DashboardScreen.test.tsx](file:///d:/Personal%20projects/Capy's%20Money/tests/screens/DashboardScreen.test.tsx)**:
    *   *Hiển thị tiến độ hũ*: Đảm bảo màn hình chính hiển thị danh sách các hũ đang hoạt động của tài khoản người dùng kèm theo thanh tiến độ chi tiêu thực tế.
    *   *Chuyển đổi ví*: Đảm bảo khi chọn ví khác nhau, số dư ví thay đổi nhưng các hũ (vì là cấp tài khoản) vẫn được hiển thị đồng bộ và giữ nguyên hạn mức chung.
*   **[QuickAddBottomSheet.test.tsx](file:///d:/Personal%20projects/Capy's%20Money/tests/components/QuickAddBottomSheet.test.tsx)**:
    *   *Lọc hũ và danh mục con khi thêm giao dịch*: Đảm bảo khi người dùng tạo giao dịch Chi tiêu, danh sách hũ chỉ hiển thị các hũ có tỷ lệ phân bổ > 0 (không hiển thị hũ đã xóa) và danh sách hạng mục con chỉ hiển thị các hạng mục đã được cấu hình hạn mức.

### 2.3 Kiểm thử Công cụ (Utils)
*   **[budgetChecker.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/utils/budgetChecker.test.ts)**:
    *   Hàm tự động kiểm tra xem chi tiêu hiện tại của một hũ hoặc hạng mục con có vượt quá ngưỡng cảnh báo (80% hoặc 100%) hay chưa để gửi push notification tương ứng.

---

## 3. Chi tiết kịch bản Kiểm thử Đầu-cuối Web (Playwright E2E)
Chạy bằng lệnh `npm run test:e2e`, nằm trong thư mục [tests/e2e/](file:///d:/Personal%20projects/Capy's%20Money/tests/e2e). Các kịch bản này chạy trên trình duyệt thực tế, gọi mock API của Supabase để test các luồng giao diện cực kỳ chi tiết:

### 3.1 Chi tiết Quản lý Ngân sách ([budget-detail.spec.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/e2e/budget-detail.spec.ts))
*   **Hiển thị thẻ Hũ**: Đảm bảo hiển thị đầy đủ 6 hũ tài chính với đúng tên, tỷ lệ phần trăm phân bổ, số tiền đã chi tiêu, và hạn mức tiền tối đa.
*   **Thanh tiến độ**: Kiểm tra xem thanh tiến độ chi tiêu có hiển thị đúng tỷ lệ phần trăm (ví dụ: đã chi 1 triệu / hạn mức 5.5 triệu thì thanh điền đầy khoảng 18%).
*   **Cài đặt Cảnh báo**:
    *   Nhấp vào switch bật cảnh báo của hũ, số lượng cảnh báo hiển thị tăng lên.
    *   Bật đến cảnh báo thứ 4 ở tài khoản Free sẽ bật lên hộp thoại thông báo giới hạn Premium.
    *   Tắt modal Premium bằng nút "Để sau", hoặc click "Nâng cấp Premium" để kích hoạt giả lập thanh toán nâng cấp.
*   **Mở rộng thông tin Hũ**: Click vào thẻ Hũ để xem danh sách các danh mục con bên dưới hũ đó. Nếu hũ chưa có hạng mục nào, hiển thị dòng chữ *"Không có danh mục con"*.
*   **Chỉnh sửa Hũ (JarEditSheet)**:
    *   Mở bảng chỉnh sửa hũ, kiểm tra dữ liệu được điền sẵn (tên hũ, tỷ lệ phân bổ).
    *   Tăng/giảm tỷ lệ phân bổ bằng nút `+5%` / `-5%`, đảm bảo không thể giảm dưới 0% hoặc tăng vượt 100%.
    *   Thêm danh mục con mới hoặc sửa tên danh mục con hiện có.
    *   Xóa bớt danh mục con.
    *   Lưu cấu hình và kiểm tra thông báo lưu thành công, bảng chỉnh sửa tự đóng.
*   **Xóa Hũ**: Click nút xóa hũ (🗑️), xác nhận hộp thoại cảnh báo và kiểm tra xem hũ đó có biến mất khỏi danh sách ngân sách hay không.
*   **Chỉnh sửa Ngân sách tổng**:
    *   Click nút sửa tổng ngân sách, điền số tiền mới (ví dụ: `20.000.000đ`), nhấn lưu.
    *   Kiểm tra tổng ngân sách hiển thị cập nhật và hạn mức của tất cả các hũ con tự động tính toán lại theo tỷ lệ phần trăm.
    *   Kiểm tra cảnh báo lỗi nếu nhập số tiền bằng 0 hoặc âm.
*   **Báo cáo dồn ngân sách (Rollover)**:
    *   Bật chế độ dồn ngân sách, bảng dự báo tháng sau hiển thị.
    *   Nếu chi tiêu ít hơn ngân sách, hiển thị dự báo thặng dư (Surplus) cộng thêm vào tháng sau.
    *   Nếu chi tiêu vượt ngân sách, hiển thị dự báo thâm hụt (Deficit) phải bù vào tháng sau.
*   **Chuyển đổi Ví**: Nhấp qua lại giữa các tab ví (Ví cá nhân, Ví tiết kiệm) và đảm bảo màn hình ngân sách cập nhật hiển thị đồng bộ.

### 3.2 Kiểm thử Đồng bộ Ngân sách Tài khoản ([account-wide-budget.spec.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/e2e/account-wide-budget.spec.ts))
*   **Đồng bộ Ngân sách từ Profile Supabase**: Xác thực màn hình Ngân sách tải đúng số ngân sách `total_budget` từ cơ sở dữ liệu (ví dụ: profile có ngân sách là 15M sẽ hiển thị đúng `15.000.000đ` thay vì giá trị mặc định).
*   **Lưu Ngân sách và Cập nhật Hũ**: Khi thay đổi tổng ngân sách thành `25.000.000đ`, kiểm tra hệ thống thực hiện gửi đúng payload cập nhật tới API profiles của Supabase, đồng thời gửi thông tin cập nhật các hũ con trong cơ sở dữ liệu với giới hạn mới tương ứng với tỷ lệ phân bổ của hũ đó.

### 3.3 Luồng tổng hợp Nghiệp vụ ([flows.spec.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/e2e/flows.spec.ts))
*   **Luồng thêm giao dịch ảnh hưởng tới Ngân sách**:
    *   Thực hiện tạo mới giao dịch chi tiêu trị giá 500.000đ vào danh mục "Ăn uống" thuộc hũ "Thiết yếu (NEC)".
    *   Quay lại màn hình Quản lý Ngân sách, kiểm tra xem số tiền "Đã chi" của hũ NEC có tăng thêm 500.000đ hay không.
    *   Kiểm tra xem thanh tiến độ chi tiêu của hũ NEC có cập nhật độ dài tương ứng.

### 3.4 Quản lý Ví ([wallet.spec.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/e2e/wallet.spec.ts))
*   Hiển thị danh sách ví hiện có.
*   Tạo ví mới (chọn icon, đặt tên ví, số dư ban đầu).
*   Chỉnh sửa thông tin ví, đổi tên ví hoặc đặt ví làm mặc định.
*   Xóa ví cá nhân và xác nhận số dư ví biến mất khỏi tổng tài sản.

### 3.5 Sổ giao dịch và Trang chủ ([ledger-detail.spec.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/e2e/ledger-detail.spec.ts), [dashboard.spec.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/e2e/dashboard.spec.ts))
*   **Sổ giao dịch**: Kiểm tra bộ lọc giao dịch theo thời gian (tháng này, tháng trước), theo danh mục, hiển thị tổng thu/tổng chi của tháng.
*   **Trang chủ**: Hiển thị tổng số dư của tất cả các ví, danh sách các giao dịch gần đây, biểu đồ tròn phân tích cơ cấu chi tiêu.

---

## 4. Chi tiết kịch bản Kiểm thử Đầu-cuối Di động (Maestro Mobile E2E)
Chạy bằng các lệnh `npm run maestro:*` trên thiết bị giả lập di động:

*   **[auth.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/auth.yaml)**:
    1.  Mở ứng dụng, kiểm tra màn hình Onboarding (chào mừng).
    2.  Nhấp qua các trang giới thiệu và nhấn "Bắt đầu".
    3.  Nhập email `test@capysmoney.com` và mật khẩu `TestCapy2024!`.
    4.  Nhấp "Đăng nhập", kiểm tra xem ứng dụng có chuyển thành công vào màn hình chính (Trang chủ) hay không.
*   **[register.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/register.yaml)**:
    1.  Trên màn hình đăng nhập, nhấp vào liên kết "Đăng ký tài khoản".
    2.  Nhập Tên hiển thị, Email mới, Mật khẩu.
    3.  Nhấp "Đăng ký", xác nhận thông báo gửi email xác nhận và trạng thái chờ xác thực.
*   **[budget.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/budget.yaml)**:
    1.  Từ thanh điều hướng dưới màn hình, nhấp vào tab "Ngân sách".
    2.  Đợi giao diện tải xong và kiểm tra sự xuất hiện của nút thêm nhanh giao dịch (FAB) trên màn hình để xác nhận tab Ngân sách đang hoạt động bình thường.
*   **[ledger.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/ledger.yaml)**:
    1.  Nhấp vào nút Thêm nhanh (FAB) ở giữa thanh tab.
    2.  Nhập số tiền chi tiêu, chọn hũ chi tiêu, chọn danh mục con, ghi chú giao dịch và nhấn "Lưu".
    3.  Chuyển sang tab Sổ Giao dịch, xác nhận giao dịch vừa nhập xuất hiện ở đầu danh sách với đúng thông tin.
*   **[wallet.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/wallet.yaml) / [wallet_share.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/wallet_share.yaml)**:
    1.  Vào phần quản lý ví, tạo ví chung (Shared Wallet).
    2.  Nhấp lấy mã mời tham gia ví (invite code).
    3.  Kiểm tra hiển thị mã mời để chia sẻ với người dùng khác.
