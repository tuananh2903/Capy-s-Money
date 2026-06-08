# 🛡️ Prevention Checklist: Tránh Lỗi DB Constraint & Over-Mocking

Tài liệu này hướng dẫn các quy tắc phát triển nhằm loại bỏ các lỗi cơ bản do không đồng bộ giữa Backend/Database và Frontend, đặc biệt là các lỗi không thể phát hiện qua E2E test do việc lạm dụng Mocking.

## 1. Nguyên Tắc Thiết Kế API & Mocking (E2E Tests)

### 🔴 Vấn đề đã xảy ra
Trong E2E Test của Onboarding, hàm RPC `complete_onboarding` được mock trực tiếp tại tầng mạng (network stubbing) và trả về `{ success: true }`. Tuy nhiên, trong thực tế database:
- Hàm RPC thực thi câu lệnh SQL chèn giá trị `'cash'` vào trường `type` của bảng `wallets`.
- Bảng `wallets` lại có ràng buộc `CHECK (type IN ('personal', 'shared'))`.
- Lỗi này chỉ xuất hiện trên môi trường thật, còn test E2E vẫn vượt qua do mock trả về kiểu ví là `'personal'`.

### 🟢 Nguyên tắc phòng ngừa
1. **Hạn chế mock các API nghiệp vụ cốt lõi (Core Business API)**:
   - Thay vì mock API trả về kết quả thành công giả lập ở file test E2E, hãy chạy môi trường kiểm thử với Database thật (ví dụ chạy Supabase local qua Docker bằng `supabase start`).
   - E2E test nên tương tác với dữ liệu thật được sinh ra từ database để đảm bảo mọi RLS policies, trigger và check constraint hoạt động chính xác.
2. **Khớp Hợp Đồng Dữ Liệu (Contract Matching)**:
   - Các mock data trong file test (ví dụ: `tests/e2e/onboarding.spec.ts`) **bắt buộc** phải được đối chiếu với định nghĩa schema database thật. Nếu schema thay đổi (ví dụ: đổi tên enum, đổi kiểu dữ liệu), tất cả file mock phải cập nhật tương ứng.

---

## 2. Type-Safety từ Database đến UI (Supabase Codegen)

Để đảm bảo Frontend và Backend luôn đồng bộ về kiểu dữ liệu:
1. **Sinh tự động Typescript Types từ DB**:
   - Khi có bất kỳ thay đổi nào về cấu trúc bảng (migrations), hãy chạy lệnh:
     ```bash
     npx supabase gen types typescript --local > src/types/supabase.ts
     ```
   - Sử dụng các Type được tạo ra này trong các Service Frontend (như `onboardingService.ts` hoặc `dashboardService.ts`).
   - Nếu chèn sai loại ví (ví dụ: chèn `'cash'` thay vì một trong các giá trị của Enum/Union `'personal' | 'shared'`), Typescript compiler sẽ báo lỗi lập tức trong quá trình compile/build.

---

## 3. Quản Lý Trạng Trạng UI (State Preservation)

Khi giao tiếp với các dịch vụ bất đồng bộ (Async/API calls):
1. **Không unmount component đang giữ trạng thái nhập liệu (Form Wizard)**:
   - Tránh việc thay đổi trực tiếp luồng giao diện chính (như return một màn hình Loading toàn màn hình) làm unmount Form Screen của người dùng.
   - Thay vào đó, hãy sử dụng **Loading Overlay** (hoạt động đè lên trên giao diện cũ) hoặc truyền trạng thái `loading` vào chính component đó để hiển thị spinner. Điều này giúp giữ nguyên trạng thái dữ liệu đã nhập nếu API trả về lỗi để người dùng có thể thử lại mà không phải nhập lại từ đầu.
