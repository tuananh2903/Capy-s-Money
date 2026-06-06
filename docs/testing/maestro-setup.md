# Hướng dẫn cài đặt & chạy Maestro E2E Testing - Capy's Money

Tài liệu này hướng dẫn cách cài đặt Maestro CLI, chuẩn bị môi trường giả lập (Emulator/Simulator) và chạy các kịch bản kiểm thử E2E (End-to-End) tự động cho ứng dụng Capy's Money.

---

## 1. Yêu cầu hệ thống & Cài đặt

Maestro hỗ trợ kiểm thử trên cả Android Emulator và iOS Simulator.

### 1.1 Cài đặt Maestro CLI

#### Trên macOS / Linux:
Chạy lệnh sau trong Terminal:
```bash
curl -FsSL https://get.maestro.mobile.dev | bash
```
Sau đó, khởi động lại Terminal hoặc chạy `export PATH="$PATH:$HOME/.maestro/bin"` để áp dụng PATH.

#### Trên Windows:
Maestro yêu cầu chạy thông qua **WSL (Windows Subsystem for Linux)** hoặc có thể cài đặt thông qua PowerShell (với điều kiện đã cài đặt Java và Android SDK/adb được cấu hình đúng trong Environment Variables):
```powershell
# Sử dụng PowerShell
iroute = Invoke-RestMethod -Uri "https://get.maestro.mobile.dev"
# Hoặc tham khảo chính thức tại: https://maestro.mobile.dev/getting-started/installing-maestro
```

---

## 2. Cấu hình Ứng dụng

Ứng dụng cần được định cấu hình định danh duy nhất (`App ID`) để Maestro có thể tìm thấy và tự động khởi chạy. Trong [app.json](file:///d:/Personal%20projects%20Capy's%20Money/app.json) của dự án, các khóa sau đã được thiết lập:

- **Android Package**: `com.capysmoney.app`
- **iOS Bundle Identifier**: `com.capysmoney.app`

---

## 3. Các kịch bản kiểm thử (Flows)

Các kịch bản E2E được định nghĩa dưới dạng file YAML nằm trong thư mục `.maestro/flows/`:

1. **[auth.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/auth.yaml)**: Kiểm thử luồng màn hình chào mừng (Onboarding) và Đăng nhập.
2. **[register.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/register.yaml)**: Kiểm thử luồng Đăng ký tài khoản mới.
3. **[dashboard.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/dashboard.yaml)**: Kiểm thử các tính năng trên Trang chủ (Dashboard, hiển thị số dư, avatar, cài đặt thông tin cá nhân).
4. **[budget.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/budget.yaml)**: Kiểm thử luồng Quản lý Ngân sách và 6 hũ tài chính.
5. **[ledger.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/ledger.yaml)**: Kiểm thử Thêm nhanh giao dịch và đối chiếu trong Sổ Giao Dịch.
6. **[wallet.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/wallet.yaml)**: Kiểm thử luồng Tạo ví cá nhân/ví chung từ màn hình quản lý ví.
7. **[wallet_share.yaml](file:///d:/Personal%20projects/Capy's%20Money/.maestro/flows/wallet_share.yaml)**: Kiểm thử chức năng chia sẻ ví chung và mời thành viên.

---

## 4. Hướng dẫn chạy thử nghiệm

### Bước 1: Khởi động thiết bị giả lập
- **Android**: Mở Android Studio -> Device Manager -> Khởi chạy một Android Emulator (đảm bảo `adb devices` nhận thấy thiết bị).
- **iOS (chỉ trên macOS)**: Mở Simulator bằng Xcode.

### Bước 2: Build ứng dụng
Trước khi chạy test, ứng dụng phải được cài đặt lên thiết bị giả lập. Bạn có thể build bản dev client hoặc prebuild:
```bash
# Prebuild để sinh thư mục android/ios gốc
npx expo prebuild --clean

# Chạy và cài đặt app lên emulator/simulator
npx expo run:android
# Hoặc
npx expo run:ios
```

### Bước 3: Chạy các câu lệnh test Maestro
Sử dụng các scripts đã được tích hợp sẵn trong `package.json`:

```bash
# Chạy toàn bộ các test flows
npm run maestro:all

# Chạy các luồng test cụ thể
npm run maestro:android    # Luồng Auth
npm run maestro:register   # Luồng Đăng ký
npm run maestro:dashboard  # Luồng Trang chủ
npm run maestro:budget     # Luồng Ngân sách
npm run maestro:ledger     # Luồng Giao dịch & Sổ GD
npm run maestro:wallet     # Luồng Tạo ví
npm run maestro:share      # Luồng Chia sẻ ví chung
```

Hoặc chạy thủ công qua Maestro CLI:
```bash
maestro test .maestro/flows/wallet.yaml
```

---

## 5. Mẹo viết test flow với Maestro
- Sử dụng thuộc tính `testID` trong React Native (ví dụ: `<TouchableOpacity testID="create-wallet-btn" />`) để giúp Maestro định vị chính xác phần tử UI khi tìm kiếm bằng text gặp khó khăn.
- Sử dụng lệnh `maestro studio` trong terminal để mở giao diện trực quan hỗ trợ sinh code YAML test tự động bằng cách click trực tiếp trên màn hình thiết bị giả lập.
