# Software Requirements Specification (SRS) - Quản lý Ví

## 1. Cấu trúc Dữ liệu & Phân quyền Hệ thống

### 1.1 Bảng `public.wallets`
Quản lý ví cá nhân và ví chung:

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | ID duy nhất của ví |
| `user_id` | UUID | REFERENCES public.profiles(id) | ID chủ sở hữu ví |
| `name` | VARCHAR(32) | NOT NULL | Tên ví (1 - 32 ký tự) |
| `balance` | NUMERIC(15,2)| DEFAULT 0.00 | Số dư khả dụng hiện tại |
| `type` | VARCHAR(16) | DEFAULT 'personal' | Phân loại: 'personal', 'shared' |
| `color` | VARCHAR(10) | DEFAULT '#FFB7C5' | Mã màu hexa hiển thị thẻ |
| `icon` | VARCHAR(32) | DEFAULT 'wallet-outline' | Icon đại diện của ví |
| `is_default` | BOOLEAN | DEFAULT FALSE | Cờ chỉ định ví mặc định |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Cờ xóa mềm (Soft delete) |

### 1.2 Bảng `public.wallet_members`
Lưu trữ thành viên tham gia ví chung:

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `wallet_id` | UUID | REFERENCES public.wallets(id) | ID ví chung liên kết |
| `user_id` | UUID | REFERENCES public.profiles(id) | ID thành viên tham gia |
| `role` | VARCHAR(16) | CHECK (role IN ('owner', 'editor', 'viewer')) | Vai trò: Chủ ví, Biên tập, Xem |
| `joined_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời gian tham gia |

---

## 2. PostgreSQL Triggers & Safe Functions (RPC)

### 2.1 Database Trigger Chặn Tạo Ví Quá Hạn Mức Gói Free
Bảo vệ tài nguyên hệ thống ở mức lõi cơ sở dữ liệu:
```sql
CREATE OR REPLACE FUNCTION check_free_tier_wallet_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_personal_count INT;
  v_shared_count INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Đếm số ví cá nhân hiện tại (loại trừ ví đã xóa mềm)
    SELECT COUNT(*) INTO v_personal_count 
    FROM public.wallets 
    WHERE user_id = NEW.user_id AND type = 'personal' AND is_deleted = FALSE;

    -- Đếm số ví chung hiện tại do user sở hữu
    SELECT COUNT(*) INTO v_shared_count 
    FROM public.wallets 
    WHERE user_id = NEW.user_id AND type = 'shared' AND is_deleted = FALSE;

    IF NEW.type = 'personal' AND v_personal_count >= 2 THEN
      RAISE EXCEPTION 'Vượt quá giới hạn ví cá nhân cho gói Free (Tối đa 2).';
    END IF;

    IF NEW.type = 'shared' AND v_shared_count >= 1 THEN
      RAISE EXCEPTION 'Vượt quá giới hạn ví chung cho gói Free (Tối đa 1).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_wallet_limits
BEFORE INSERT ON public.wallets
FOR EACH ROW EXECUTE FUNCTION check_free_tier_wallet_limits();
```

### 2.2 Postgres function Đặt Ví Mặc định (`set_default_wallet`)
Hàm RPC gán ví mặc định an toàn cho người dùng trong một giao dịch đơn lẻ (Transaction):
```sql
CREATE OR REPLACE FUNCTION set_default_wallet(p_wallet_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Đặt tất cả ví của user về mặc định = false
  UPDATE public.wallets 
  SET is_default = FALSE 
  WHERE user_id = p_user_id;

  -- Kích hoạt mặc định cho ví được chỉ định
  UPDATE public.wallets 
  SET is_default = TRUE 
  WHERE id = p_wallet_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Client Gating & Soft-delete Handling
*   **Xóa ví mềm (Soft delete):** Khi người dùng xóa ví, hệ thống gọi API `updateWallet(walletId, { is_deleted: true })`. Trạng thái này sẽ đồng bộ lên đám mây. UI lọc bỏ các ví có `is_deleted === true` khỏi danh sách hiển thị, nhưng giữ nguyên bản ghi trong database để tránh mất dữ liệu liên kết ngoại của các giao dịch lịch sử.
*   **Mời thành viên mới:**
    *   Chỉ Owner ví chung mới có thể mở popup mời thành viên.
    *   Khi nhấn mời, app gọi Edge Function sinh mã mời dạng `CAPY-XXXXXX` có hạn dùng `24 giờ` lưu trong bảng `wallet_invitations`.
    *   Hệ thống kiểm tra số lượng thành viên trong `wallet_members` hiện tại: nếu đạt tối đa 3 người, chặn sinh mã mời mới và hiển thị cảnh báo lỗi.
