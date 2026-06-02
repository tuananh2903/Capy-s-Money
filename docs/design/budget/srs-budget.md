# Software Requirements Specification (SRS) - Ngân Sách

## 1. Cấu trúc Dữ liệu Ngân sách (Jars Table Schema)
Thông tin hạn mức ngân sách được lưu trực tiếp trên bảng `public.jars` để tối ưu hóa hiệu năng truy vấn liên kết:

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | ID của hũ tài chính |
| `wallet_id` | UUID | REFERENCES public.wallets(id) | ID ví chứa hũ |
| `type` | VARCHAR(8) | NOT NULL CHECK (type IN ('NEC', 'FFA', 'EDU', 'PLAY', 'LTSS', 'GIVE')) | Loại hũ tài chính |
| `budget_limit` | NUMERIC(15,2) | DEFAULT 0.00 | Hạn mức chi tiêu tối đa trong tháng |
| `spent_amount` | NUMERIC(15,2) | DEFAULT 0.00 | Số tiền lũy kế đã tiêu dùng thực tế |

---

## 2. Thuật toán Đánh giá Trạng thái Ngân sách (Budget Checker Formula)
Thuật toán phân tích tốc độ chi tiêu được tính toán tự động ở Client-side:

```typescript
export enum BudgetAlertStatus {
  NORMAL = "NORMAL",
  SPENDING_TOO_FAST = "SPENDING_TOO_FAST",
  OVER_BUDGET = "OVER_BUDGET"
}

export function evaluateJarBudget(spent: number, limit: number): BudgetAlertStatus {
  if (limit <= 0) return BudgetAlertStatus.NORMAL;
  
  // 1. Kiểm tra vượt hạn mức tuyệt đối
  if (spent >= limit) {
    return BudgetAlertStatus.OVER_BUDGET;
  }
  
  // 2. Tính toán tỷ lệ phần trăm thời gian trôi qua trong tháng hiện tại
  const now = new Date();
  const currentDay = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const timeRatio = currentDay / totalDays;
  
  // 3. Tính tỷ lệ chi tiêu thực tế
  const spentRatio = spent / limit;
  
  // 4. Nếu chi tiêu vượt quá tốc độ thời gian trôi qua hơn 20%
  // và số tiền tiêu dùng đã đạt tối thiểu 50% hạn mức (để tránh nhiễu với giao dịch nhỏ đầu tháng)
  if (spentRatio > 0.5 && spentRatio > (timeRatio + 0.2)) {
    return BudgetAlertStatus.SPENDING_TOO_FAST;
  }
  
  return BudgetAlertStatus.NORMAL;
}
```

---

## 3. Tối ưu hóa hiệu năng & Cập nhật
*   **Triggers Đồng bộ lũy kế chi tiêu:** Khi có giao dịch loại `expense` được tạo mới, một trigger database (hoặc logic service) tự động cộng dồn số tiền vào trường `spent_amount` của hũ tương ứng. Khi giao dịch bị xóa hoặc sửa đổi, hệ thống thực hiện hiệu chỉnh ngược lại.
*   **Reset Hàng tháng:** Vào ngày đầu tiên của mỗi tháng mới, hệ thống tự động reset trường `spent_amount` về `0` cho toàn bộ các hũ để bắt đầu chu kỳ tính toán mới, trong khi giữ nguyên cột `budget_limit` làm cấu hình mặc định cho tháng mới.

---

## 4. Đặc tả kỹ thuật tính năng Dồn ngân sách (Budget Rollover)

### 4.1. Thay đổi cấu trúc cơ sở dữ liệu (Database Schema Modifications)
Thêm các cột cấu hình vào bảng `public.wallets`:

```sql
-- Cấu hình dồn ngân sách cho ví
ALTER TABLE public.wallets 
ADD COLUMN rollover_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN rollover_adjustment NUMERIC(15,2) DEFAULT 0.00;
```

*   `rollover_enabled`: Trạng thái Bật/Tắt tính năng dồn ngân sách.
*   `rollover_adjustment`: Lưu trữ số tiền bù trừ dồn từ tháng trước (thặng dư hoặc lạm chi) để cộng vào ngân sách thực tế tháng hiện hành.

### 4.2. Thuật toán xử lý Rollover định kỳ (Monthly Rollover Cron/Trigger)
Vào thời điểm giao thừa hàng tháng (`00:00:00` ngày 1 đầu tháng):

1.  **Bước 1: Tính toán chênh lệch (diff):**
    ```typescript
    // Tính toán cho từng ví có rollover_enabled = true
    const currentBudget = wallet.total_budget; 
    const currentSpend = wallet.total_spent; // tổng spent_amount của 6 hũ
    const diff = currentBudget - currentSpend; // Thặng dư (>0) hoặc Thâm hụt (<0)
    ```
2.  **Bước 2: Cập nhật cơ sở dữ liệu:**
    *   Lưu giá trị `diff` vào cột `rollover_adjustment` của ví cho tháng mới.
    *   Reset `spent_amount` của toàn bộ các hũ về `0` cho tháng mới.
    *   Lưu lịch sử kỳ ngân sách vào bảng log `wallet_budget_history` để phục vụ báo cáo.

### 4.3. Công thức tính Ngân sách thực tế trên Giao diện (Client-side)
Khi hiển thị hạn mức thực tế cho người dùng tại Client:
$$\text{Ngân sách thực dùng} = \text{Ngân sách gốc (total\_budget)} + \text{Số tiền dồn (rollover\_adjustment)}$$
$$\text{Hạn mức thực tế hũ } i = \text{Ngân sách thực dùng} \times \text{Tỷ lệ phân bổ hũ } i$$


