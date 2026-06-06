import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions, scheduleDailyReminder } from '../../src/services/notificationService';

// Mock expo-notifications — MUST include setNotificationHandler since
// it's called at module-level when notificationService.ts is imported.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
}));

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermissions', () => {
    it('returns true if permission is already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      const granted = await requestNotificationPermissions();
      expect(granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission and returns true if granted after requesting', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      const granted = await requestNotificationPermissions();
      expect(granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('requests permission and returns false if denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      const granted = await requestNotificationPermissions();
      expect(granted).toBe(false);
    });

    it('returns false if getPermissionsAsync throws an error', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Permission error'));
      const granted = await requestNotificationPermissions();
      expect(granted).toBe(false);
    });
  });

  describe('scheduleDailyReminder', () => {
    const RealDate = global.Date;

    /**
     * Helper: override `new Date()` (no-arg) to return a clone of the
     * given fakeNow, while keeping `new Date(y, m, d, h, ...)` working
     * normally so trigger-time assertions use real Date objects.
     */
    function mockDateNow(fakeNow: Date) {
      const MockDate = function (...args: any[]) {
        if (args.length === 0) {
          // `new Date()` — return a mutable clone of fakeNow
          return new RealDate(fakeNow.getTime());
        }
        // `new Date(year, month, ...)` — pass through to real constructor
        return new (RealDate as any)(...args);
      } as any;

      MockDate.prototype = RealDate.prototype;
      MockDate.now = () => fakeNow.getTime();
      MockDate.parse = RealDate.parse;
      MockDate.UTC = RealDate.UTC;

      global.Date = MockDate;
    }

    afterEach(() => {
      // Restore real Date
      global.Date = RealDate;
    });

    it('schedules reminder for tomorrow 9 PM if user has transactions today', async () => {
      // Current time: May 28, 2026 10:00 AM
      mockDateNow(new RealDate(2026, 4, 28, 10, 0, 0, 0));

      await scheduleDailyReminder(true);

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "🦦 Hôm nay tiêu gì thế bạn ơi?",
          }),
          trigger: {
            type: 'date',
            date: new RealDate(2026, 4, 29, 21, 0, 0, 0), // May 29 9 PM
          },
        })
      );
    });

    it('schedules reminder for today 9 PM if user has no transactions today and time is before 9 PM', async () => {
      // Current time: May 28, 2026 10:00 AM
      mockDateNow(new RealDate(2026, 4, 28, 10, 0, 0, 0));

      await scheduleDailyReminder(false);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: {
            type: 'date',
            date: new RealDate(2026, 4, 28, 21, 0, 0, 0), // May 28 9 PM (Today)
          },
        })
      );
    });

    it('schedules reminder for tomorrow 9 PM if user has no transactions today but time is after 9 PM', async () => {
      // Current time: May 28, 2026 10:00 PM (22:00)
      mockDateNow(new RealDate(2026, 4, 28, 22, 0, 0, 0));

      await scheduleDailyReminder(false);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: {
            type: 'date',
            date: new RealDate(2026, 4, 29, 21, 0, 0, 0), // May 29 9 PM
          },
        })
      );
    });

    it('does not throw when scheduleNotificationAsync fails', async () => {
      mockDateNow(new RealDate(2026, 4, 28, 10, 0, 0, 0));
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('scheduling failed')
      );

      // Should not throw
      await expect(scheduleDailyReminder(false)).resolves.toBeUndefined();
    });
  });
});
