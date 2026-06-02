import * as Notifications from 'expo-notifications';

/**
 * Configure notifications behaviour on how notifications should be handled when the app is foregrounded.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Yêu cầu quyền hiển thị thông báo từ hệ điều hành.
 * @returns true nếu quyền được cấp, ngược lại false.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Lên lịch nhắc nhở ghi chép chi tiêu vào lúc 9 PM.
 * @param hasTransactionsToday true nếu hôm nay đã ghi giao dịch, false nếu chưa.
 */
export async function scheduleDailyReminder(hasTransactionsToday: boolean): Promise<void> {
  try {
    // 1. Hủy lịch nhắc cũ để tránh lặp
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 2. Tính thời điểm kích hoạt nhắc nhở
    const now = new Date();
    const triggerTime = new Date();
    triggerTime.setHours(21, 0, 0, 0); // 9:00 PM hôm nay

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
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerTime,
      },
    });
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
}
