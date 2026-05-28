# Business Requirements Document (BRD) - Authentication & Onboarding

## 1. Context & Business Problem
Hành trình của người dùng bắt đầu từ khoảnh khắc họ cài đặt ứng dụng. Nếu quy trình đăng ký/đăng nhập quá phức tạp hoặc người dùng không hiểu giá trị cốt lõi của ứng dụng ngay từ đầu, tỷ lệ rời bỏ ứng dụng (Churn Rate) sẽ rất cao. 
Đồng thời, phương pháp quản lý tài chính "6 Hũ" (Jars System) tuy hiệu quả nhưng đòi hỏi sự kiên trì và hiểu biết nhất định. Người dùng mới thường gặp khó khăn trong việc thiết lập tỷ lệ phần trăm ban đầu cho từng hũ sao cho phù hợp với lối sống của mình.

## 2. Business Objectives & Success Metrics
*   **Tăng tỷ lệ hoàn tất đăng ký:** Giảm tỷ lệ rơi rớt ở màn hình Auth xuống dưới 10% thông qua giao diện đăng nhập tinh giản, bảo mật.
*   **Onboarding cá nhân hóa:** Giúp 100% người dùng mới hiểu và thiết lập được mô hình 6 hũ tài chính ngay trong lần truy cập đầu tiên mà không cần tự tính toán.
*   **Tỷ lệ giữ chân người dùng (Retention Rate):** Đạt tỷ lệ giữ chân ngày 1 (D1 Retention) tối thiểu 50% nhờ luồng Onboarding sinh động và trực quan hóa mục tiêu.

## 3. Target Audience & Personas
*   **Người mới đi làm (22 - 26 tuổi):** Chưa biết cách tiết kiệm hoặc đầu tư, thường xuyên tiêu hết tiền trước cuối tháng. Họ cần một quy trình hướng dẫn đơn giản để đặt ra mục tiêu tài chính cụ thể (ví dụ: mua xe, đi du lịch).
*   **Người có thói quen mua sắm tự do:** Cần được khảo sát hành vi để áp đặt tỷ lệ hũ Thiết yếu (NEC) thấp hơn, tăng tỷ lệ hũ Tiết kiệm (LTSS) hoặc Đầu tư (FFA) một cách tự động mà không tạo cảm giác gò bó.

## 4. Functional Business Requirements
*   **Đăng ký & Đăng nhập:**
    *   Hỗ trợ xác thực bảo mật bằng tài khoản Email cá nhân.
    *   Hỗ trợ khôi phục mật khẩu tự động qua email khi người dùng quên.
*   **Khảo sát Định hướng Tài chính (Financial Survey):**
    *   Khảo sát tối đa 5 câu hỏi nhanh về: Thu nhập trung bình, Thói quen chi tiêu, Mục tiêu tài chính lớn nhất, và Mức độ chấp nhận rủi ro đầu tư.
    *   Tính toán điểm phong cách tiêu dùng và đề xuất cấu hình 6 hũ tài chính tối ưu tương ứng.
    *   Cho phép người dùng chọn áp dụng cấu hình đề xuất hoặc bắt đầu với tỷ lệ mặc định chuẩn (55-10-10-10-10-5).
