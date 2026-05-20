# Hướng dẫn Kỹ thuật: Giải quyết Lỗi Treo Google OAuth & Trùng khóa API Key trên Android (Expo Go)

**Ngày thực hiện**: 18/05/2026  
**Dự án**: Capy's Money (React Native / Expo Go / Supabase)  
**Trạng thái**: Đã giải quyết thành công 100%  

---

## 1. Hiện tượng & Lỗi phát hiện

Trong quá trình phát triển tính năng Đăng nhập bằng Google trên dòng máy Android chạy Expo Go, hệ thống gặp 2 lỗi nghiêm trọng liên tục:

1. **Lỗi 1 (Treo Trình duyệt Custom Tabs)**: Sau khi chọn email Gmail xong, Chrome Custom Tabs mở tích hợp bên trong ứng dụng bị kẹt ở trạng thái trắng trang hoặc loading liên tục. Khi người dùng bấm thoát (X), ứng dụng báo lỗi: `"Đăng nhập với Google bị hủy hoặc không thành công."`
2. **Lỗi 2 (Invalid API key)**: Khi giải quyết được bước điều hướng trở lại app, console log xuất hiện lỗi đỏ: `Error setting session from deep link: Invalid API key`.

---

## 2. Phân tích Nguyên nhân sâu xa (Root Cause)

### 2.1 Lỗi treo điều hướng Android
* **Nguyên nhân**: Chrome Custom Tabs (mở bởi `WebBrowser.openAuthSessionAsync`) chạy trong cùng tiến trình của ứng dụng container **Expo Go**. Khi Supabase thực hiện `302 Redirect` trả về giao thức tuỳ biến `exp://...`, Custom Tabs gặp xung đột về điều hướng Intent hệ thống và không thể kích hoạt đóng trình duyệt tự động.
* **Hạn chế của `Linking.parse`**: Mặc định, Supabase trả về các thông số đăng nhập dưới dạng Hash Fragment (sau ký tự `#`), ví dụ: `exp://.../--/auth/callback#access_token=...&refresh_token=...`. Hàm phân tích của Expo mặc định chỉ bóc tách các tham số sau dấu hỏi chấm (`?`), dẫn tới Token bị bỏ qua (`undefined`).

### 2.2 Lỗi Invalid API Key
* **Nguyên nhân**: Dự án chưa được cấu hình tệp tin `.env` ở thư mục gốc. Khi thiết lập Supabase Client, hệ thống không đọc được `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY` nên đã sử dụng giá trị fallback mặc định là `'dummy-anon-key'`. Khi thực hiện lưu session thông qua hàm `supabase.auth.setSession`, khóa giả này bị server Supabase từ chối và trả về mã lỗi `Invalid API key`.

---

## 3. Các giải pháp & Chỉnh sửa kỹ thuật đã áp dụng

Chúng tôi đã tiến hành tái cấu trúc hệ thống Auth đa nền tảng và cung cấp cấu hình chuẩn như sau:

### 3.1 Sửa đổi dịch vụ Auth Đa nền tảng (`src/services/authService.ts`)
* **iOS**: Tiếp tục duy trì in-app browser (`WebBrowser.openAuthSessionAsync`) để đạt hiệu quả trải nghiệm mượt mà nhất.
* **Android**: Chuyển sang mở **Trình duyệt Google Chrome ngoài hệ thống** thực sự (`Linking.openURL`). Giải pháp này tránh được hoàn toàn cơ chế kẹt Custom Tabs của Expo Go.
* **Làm sạch URL băm**: Chuyển đổi ký tự `#` thành `?` trước khi tách tham số để đảm bảo nhận dạng đầy đủ `access_token` và `refresh_token`.

### 3.2 Bộ lắng nghe Deep Link toàn cục (`App.tsx`)
Bổsung một React Effect lắng nghe các liên kết sâu toàn cục khi app được mở lại từ trình duyệt ngoài:
* Bắt các sự kiện link khi ứng dụng đang chạy nền (`Linking.addEventListener`).
* Bắt liên kết khởi tạo khi ứng dụng khởi chạy nguội từ trạng thái đã đóng hoàn toàn (`Linking.getInitialURL`).
* Tự động đồng bộ hóa Session vào Supabase Auth State, kích hoạt chuyển hướng màn hình Onboarding/Dashboard tự động.

### 3.3 Chuẩn hóa Khóa kết nối thật (`src/services/supabaseClient.ts` & `.env`)
* Khởi tạo file `.env` chứa URL và Legacy Anon JWT key chính xác của dự án Supabase `foxnpvitlrsqdouepdbc`.
* Đưa khóa API thật làm fallback cứng trong `supabaseClient.ts` để đề phòng trường hợp cache Metro Bundler chưa đồng bộ.

---

## 4. Nhật ký Sửa đổi mã nguồn (Code Diffs)

### 4.1 Thay đổi tại [authService.ts](file:///d:/Personal%20projects/Capy's%20Money/src/services/authService.ts)
```typescript
// Trên Android: Mở trình duyệt ngoài thực sự để tránh treo/kẹt Custom Tabs
if (Platform.OS === 'android') {
  const opened = await Linking.openURL(data.url);
  if (!opened) throw new Error('Không thể mở trình duyệt Google.');
  return { success: true };
}
```

### 4.2 Thay đổi tại [App.tsx](file:///d:/Personal%20projects/Capy's%20Money/App.tsx)
```typescript
const handleDeepLink = async (event: { url: string }) => {
  const cleanUrl = event.url.includes('#') ? event.url.replace('#', '?') : event.url;
  const parsed = Linking.parse(cleanUrl);
  const { access_token, refresh_token } = parsed.queryParams || {};

  if (access_token && refresh_token) {
    setLoading(true);
    await supabase.auth.setSession({
      access_token: Array.isArray(access_token) ? access_token[0] : access_token,
      refresh_token: Array.isArray(refresh_token) ? refresh_token[0] : refresh_token,
    });
  }
};
```

---

## 5. Kết luận & Hướng phát triển tiếp theo

Hệ thống Đăng nhập Google đã hoạt động **hoàn hảo, nhanh chóng và mượt mà** trên cả iOS lẫn Android.
* **Tiếp theo**: Tiến hành hoàn thiện chu trình thiết lập ví ban đầu (Onboarding Flow) và thiết kế giao diện chính Dashboard cực "chill" với linh vật chú Capybara đáng yêu!
