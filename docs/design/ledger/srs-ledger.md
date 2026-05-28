# Software Requirements Specification (SRS) - Sổ Giao Dịch

## 1. Cấu trúc Dữ liệu & PostgreSQL Schema

### 1.1 Bảng `public.transactions`
Bảng lưu trữ thông tin giao dịch thu chi phát sinh:

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | ID giao dịch |
| `wallet_id` | UUID | REFERENCES public.wallets(id) | Liên kết tới ví phát sinh |
| `category_id` | UUID | REFERENCES public.categories(id) | Liên kết tới danh mục chi tiết |
| `jar_type` | VARCHAR(8) | NOT NULL | Loại hũ tài chính liên kết (NEC, LTSS,...) |
| `amount` | NUMERIC(15,2)| NOT NULL | Số tiền phát sinh giao dịch |
| `type` | VARCHAR(16) | NOT NULL CHECK (type IN ('income', 'expense', 'transfer')) | Loại: Thu nhập, Chi tiêu, Chuyển khoản |
| `note` | TEXT | NULL | Ghi chú chi tiết |
| `occurred_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời gian phát sinh thực tế |
| `created_by` | UUID | REFERENCES public.profiles(id) | Người thực hiện ghi giao dịch |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời gian hệ thống ghi nhận |

---

## 2. APIs & Data Mutation Logic

### 2.1 Logic Tự động Chia thu nhập (Income Auto-allocation)
Khi một giao dịch loại `income` (Thu nhập) được tạo ra thành công trên ví, hệ thống sẽ thực hiện phân tách tự động số tiền này vào 6 hũ dựa trên tỷ lệ phần trăm phân bổ (`allocation_percentage`) của hũ tài chính đã lưu:
*   Công thức tính số tiền cộng thêm cho hũ `i`: `added_amount = amount * (jar_i.allocation_percentage / 100)`.
*   Cập nhật đồng thời cột `balance` của ví: `new_wallet_balance = current_balance + amount`.

### 2.2 Luồng Đồng bộ Ngoại tuyến (Offline-first Synchronization Queue)
Để đảm bảo ghi chép không gián đoạn khi không có mạng:
1.  **Lưu cache local:** Tạo giao dịch mới, lưu thông tin vào SQLite cache local (hoặc hàng đợi trong AsyncStorage).
2.  **Cập nhật giao diện lập tức (Optimistic UI):** Số dư ví hiển thị trên màn hình được cộng/trừ ngay lập tức.
3.  **Hàng đợi sync (`sync_queue`):** Đẩy một Action Payload dạng:
    ```json
    {
      "action": "CREATE_TRANSACTION",
      "payload": { "id": "t-1", "wallet_id": "w-1", "amount": 50000 },
      "status": "pending"
    }
    ```
4.  **Worker đồng bộ:** Khi `NetInfo.isConnected === true`, hệ thống duyệt hàng đợi, gửi request tuần tự lên Supabase, nhận ID thực tế và cập nhật trạng thái `synced`.

---

## 3. Tối ưu hóa UI Client-side
Để tránh độ trễ mạng khi người dùng chuyển đổi tab con (Daily, Monthly, Calendar):
*   Ứng dụng fetch toàn bộ dữ liệu giao dịch của tháng được chọn **duy nhất 1 lần**.
*   Sử dụng React Hook `useMemo` để tính toán phân mảnh dữ liệu:
    *   `dailyTransactions`: Nhóm mảng giao dịch theo khóa `YYYY-MM-DD`.
    *   `monthlySummary`: Tính toán tổng thu/chi và tỷ trọng phần trăm của từng Category trong tháng.
    *   `calendarMarks`: Trả về object đánh dấu ngày phát sinh thu (chấm xanh lá) hoặc chi (chấm đỏ) phục vụ trực tiếp cho component `<Calendar>`.
