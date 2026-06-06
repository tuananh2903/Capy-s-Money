# Software Requirements Specification (SRS) - Daily Reminder Notifications

## 1. Kiến trúc Kỹ thuật & Quản lý Thông báo Local
Vì tính chất ngoại tuyến và tiết kiệm tài nguyên mạng, tính năng này sử dụng hoàn toàn **Local Notifications** của thư viện `expo-notifications` thay vì Push Notifications từ Server.

---

## 2. API Thiết lập & Lập lịch

### 2.1 Quản lý Quyền thông báo (`requestNotificationPermissions`)
Yêu cầu quyền hiển thị thông báo từ hệ điều hành (iOS / Android):
```typescript
import * as Notifications from 'expo-notifications';

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}
```

### 2.2 Thuật toán Lập lịch thông minh (`scheduleDailyReminder`)
*   **Mục tiêu:** Tính toán xem hôm nay người dùng đã tạo giao dịch nào chưa.
    *   Truy vấn danh sách giao dịch có ngày tạo trùng với ngày hiện tại (múi giờ local).
    *   Nếu có giao dịch -> Huỷ toàn bộ thông báo đang chờ và lên lịch thông báo mới vào lúc 9 PM ngày mai.
    *   Nếu không có giao dịch -> Huỷ toàn bộ thông báo đang chờ và lên lịch thông báo mới vào lúc 9 PM ngày hôm nay (nếu hiện tại trước 9 PM) hoặc 9 PM ngày mai (nếu hiện tại sau 9 PM).
*   **Trigger chạy thuật toán:**
    1.  Khi App khởi chạy (DashboardScreen `useEffect` mount).
    2.  Khi lưu thành công một giao dịch mới từ `QuickAddBottomSheet`.

### 2.3 Mã nguồn Lập lịch
```typescript
export async function scheduleDailyReminder(hasTransactionsToday: boolean) {
  // 1. Hủy lịch nhắc cũ để tránh trùng lặp
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Tính thời điểm kích hoạt nhắc nhở
  const now = new Date();
  const triggerTime = new Date();
  triggerTime.setHours(21, 0, 0, 0); // 9:00 PM

  if (hasTransactionsToday || now.getTime() >= triggerTime.getTime()) {
    // Đã ghi chép hoặc đã quá 9PM hôm nay -> Lên lịch nhắc 9PM ngày mai
    triggerTime.setDate(triggerTime.getDate() + 1);
  }

  // 3. Thiết lập thông báo
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🦦 Hôm nay tiêu gì thế bạn ơi?",
      body: "Capy đang đợi bạn ghi chép chi tiêu cuối ngày để cập nhật các hũ tài chính đây! Nhấp vào để ghi nhanh nhé. ✨",
      sound: true,
    },
    trigger: triggerTime,
  });
}
```
