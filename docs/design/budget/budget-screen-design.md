# Thiết kế Màn hình Ngân sách (Budget Screen Design)

> **Ngày tạo**: 2026-05-28  
> **Trạng thái**: Hoàn tất brainstorm (Đã được User duyệt)  
> **Tính năng**: Quản lý Hũ tài chính, Ngân sách con (Danh mục) và Cảnh báo lạm chi (Giới hạn Freemium)  

---

## 1. Mô tả Tổng quan (Overview)

Màn hình Ngân sách giúp người dùng quản lý kế hoạch tài chính cá nhân dựa trên mô hình **6 Hũ tài chính** tích hợp chặt chẽ với các **Ví** (Wallet) của ứng dụng Capy's Money. Thiết kế áp dụng nguyên lý **Phân bổ từ trên xuống (Top-Down Allocation)**: Người dùng thiết lập tổng ngân sách của ví hàng tháng, phân bổ % cho các hũ để tự động tính ra hạn mức hũ, và cuối cùng cấu hình chi tiết hạn mức cho từng danh mục con nằm trong hũ đó.

Hệ thống sẽ theo dõi và gửi thông báo lạm chi ở 2 ngưỡng (80% và 100%) tại cả 2 cấp độ (Hũ tổng và Danh mục con). Tính năng cảnh báo tuân thủ quy tắc giới hạn Freemium (Tài khoản Free chỉ được bật tối đa 3 cảnh báo đồng thời).

---

## 2. Các Luồng Nghiệp vụ & Giao diện (UI/UX Flows)

### 2.1 Màn hình Dashboard Ngân sách chính (Budget Dashboard Screen)
* **Thanh chọn ví (Wallet Tab Bar)**: Hiển thị các Tab tương ứng với các ví đang hoạt động (Ví cá nhân, Ví Gia đình,...) để chuyển đổi nhanh dữ liệu ngân sách.
* **Tổng ngân sách ví**: Hiển thị hạn mức tổng tháng hiện tại của ví được chọn cùng thanh trạng thái tổng phân bổ (báo đỏ nếu tổng phân bổ % các hũ khác 100%).
* **Danh sách Hũ (Jar Card List)**: 
  * Hiển thị 6 hũ tiêu chuẩn (`NEC`, `FFA`, `EDU`, `PLAY`, `LTSS`, `GIVE`) dưới dạng thẻ bo tròn (border-radius 32px) theo Stitch Design System.
  * Hiển thị: Icon emoji của hũ, tên hũ, tỷ lệ %, tiến độ chi tiêu (đã tiêu / hạn mức), thanh tiến trình (Progress Bar) đổi màu linh hoạt (Xanh: <80%, Vàng: 80% - 99%, Đỏ: >=100%).
  * Nút Icon tối giản Sửa (✏️) và Xóa (🗑️) được đặt gọn gàng ở góc dưới mỗi thẻ.
  * Nút **[➕ Thêm Hũ]** nằm ở tiêu đề danh sách để tạo thêm hũ tùy chỉnh.
* **Hạng mục con (Category Budgets accordion)**: 
  * Nhấp vào thẻ Hũ để mở rộng danh sách danh mục con thuộc hũ đó.
  * Mỗi danh mục con hiển thị tên, icon, số tiền hạn mức con và nút công tắc nhận cảnh báo (🔔).

### 2.2 Bottom Sheet Cấu hình (Add/Edit Jar & Categories)
Trượt từ dưới lên khi người dùng bấm thêm hoặc sửa một hũ:
* **Thông tin Hũ**: Cho phép nhập tên hũ, chọn icon, điều chỉnh slider tỷ lệ phần trăm (%).
* **Danh sách Hạng mục con**:
  * Liệt kê các danh mục hiện có thuộc hũ.
  * Mỗi dòng có ô nhập hạn mức số tiền trực tiếp, ô đổi tên danh mục và nút Xóa (🗑️) tối giản.
  * Nút **[➕ Thêm]** ở góc phải tiêu đề mục con để thêm nhanh một dòng danh mục mới.

### 2.3 Cơ chế Cảnh báo & Giới hạn Freemium
* **Bật/tắt Cảnh báo**: Mỗi hũ và danh mục đều có nút công tắc Toggle Switch **"Nhận cảnh báo" (Enable Push Alerts)**.
* **Giới hạn Free Tier**: 
  * Tài khoản Free (`profiles.tier = 'free'`) chỉ được bật tối đa **3 nút Toggle cảnh báo đồng thời** (tổng số cảnh báo đang hoạt động của cả Jars và Category Budgets cộng lại không được vượt quá 3).
  * Nếu người dùng gạt bật cảnh báo thứ 4, ứng dụng sẽ chặn thao tác và hiển thị **Premium Modal** mời nâng cấp gói Premium (12,000 VND/tháng).

---

## 3. Thiết kế Cơ sở Dữ liệu (Database Schema)

### 3.1 Bảng Hũ (`public.jars`)
Bổ sung trường `enable_alerts` để theo dõi cài đặt thông báo lạm chi.
```sql
CREATE TABLE IF NOT EXISTS public.jars (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id             UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL, -- NEC, FFA, EDU, PLAY, LTSS, GIVE, hoặc CUSTOM_...
  budget_limit          BIGINT NOT NULL DEFAULT 0 CHECK (budget_limit >= 0),
  spent_amount          BIGINT NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
  allocation_percentage INT NOT NULL DEFAULT 0 CHECK (allocation_percentage BETWEEN 0 AND 100),
  enable_alerts         BOOLEAN NOT NULL DEFAULT FALSE, -- Mặc định không bật thông báo
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, type)
);
```

### 3.2 Bảng Hạn mức Danh mục (`public.budgets`)
Đổi tên hoặc tái sử dụng cấu trúc `public.budgets` để lưu cấu hình ngân sách danh mục con thuộc hũ.
```sql
CREATE TABLE IF NOT EXISTS public.budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id     UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount_limit  BIGINT NOT NULL CHECK (amount_limit >= 0),
  period        TEXT NOT NULL DEFAULT 'monthly' CHECK (period = 'monthly'),
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  enable_alerts BOOLEAN NOT NULL DEFAULT FALSE, -- Cảnh báo lạm chi danh mục con
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Trigger Ràng buộc Giới hạn Freemium (Database level)
Để đảm bảo an toàn bảo mật và đồng bộ ngoại tuyến (offline sync), ta viết một trigger chặn cập nhật vượt quá 3 cảnh báo ở tài khoản free:
```sql
CREATE OR REPLACE FUNCTION public.check_premium_alert_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier TEXT;
  v_user_id UUID;
  v_active_jar_alerts INT := 0;
  v_active_category_alerts INT := 0;
BEGIN
  -- Lấy user_id thực hiện hành động
  v_user_id := auth.uid();
  
  -- Lấy tier của user
  SELECT tier INTO v_tier FROM public.profiles WHERE id = v_user_id;
  
  IF v_tier = 'free' THEN
    -- Đếm số cảnh báo đang bật trên Jars của người dùng
    SELECT COUNT(*) INTO v_active_jar_alerts
    FROM public.jars j
    JOIN public.wallets w ON j.wallet_id = w.id
    WHERE w.created_by = v_user_id AND j.enable_alerts = TRUE;

    -- Đếm số cảnh báo đang bật trên Category Budgets của người dùng
    SELECT COUNT(*) INTO v_active_category_alerts
    FROM public.budgets b
    WHERE b.created_by = v_user_id AND b.enable_alerts = TRUE;

    -- Kiểm tra nếu vượt quá 3
    IF (v_active_jar_alerts + v_active_category_alerts) > 3 THEN
      RAISE EXCEPTION 'Free tier users are limited to a maximum of 3 active budget alerts.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger cho bảng jars
CREATE TRIGGER trg_check_jars_alert_limit
  AFTER INSERT OR UPDATE OF enable_alerts ON public.jars
  FOR EACH ROW
  WHEN (NEW.enable_alerts = TRUE)
  EXECUTE FUNCTION public.check_premium_alert_limit();

-- Gắn trigger cho bảng budgets
CREATE TRIGGER trg_check_budgets_alert_limit
  AFTER INSERT OR UPDATE OF enable_alerts ON public.budgets
  FOR EACH ROW
  WHEN (NEW.enable_alerts = TRUE)
  EXECUTE FUNCTION public.check_premium_alert_limit();
```

---

## 4. Kế hoạch Kiểm thử & Xác minh (Verification Plan)

### 4.1 Kiểm thử Tự động (Automated Tests)
* **Unit Tests**:
  * Kiểm thử logic tính toán hạn mức hũ dựa trên tỷ lệ % (Top-Down).
  * Kiểm thử hàm trigger `check_premium_alert_limit` trên Supabase: Đảm bảo tài khoản free không thể lưu thay đổi khi có từ 4 cảnh báo hoạt động trở lên.
* **Component Tests (React Native)**:
  * Kiểm thử component `WalletTabBar` đổi trạng thái active/inactive chính xác.
  * Kiểm thử component `JarCard` thay đổi màu sắc Progress Bar dựa trên tỷ lệ phần trăm đã tiêu.

### 4.2 Kiểm thử Thủ công (Manual Verification)
* Mở màn hình thiết lập ngân sách tháng của ví cá nhân, gạt thử lần lượt 4 nút toggle thông báo lạm chi. Xác nhận Popup Premium hiển thị đúng ở nút gạt thứ 4.
* Thêm mới một hũ tùy chỉnh, thiết lập ngân sách con cho danh mục, sau đó xóa hũ và kiểm tra xem danh sách có tự động loại bỏ hũ đó khỏi màn hình Dashboard hay không.
