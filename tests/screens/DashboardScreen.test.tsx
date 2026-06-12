import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DashboardScreen from '../../src/screens/DashboardScreen';
import { fetchWallets, fetchJars } from '../../src/services/dashboardService';
import { fetchProfile, updateProfileName } from '../../src/services/profileService';


// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: ({ name }: any) => <View testID={`icon-ionicons-${name}`} />,
    MaterialIcons: ({ name }: any) => <View testID={`icon-material-${name}`} />,
    MaterialCommunityIcons: ({ name }: any) => <View testID={`icon-material-community-${name}`} />,
  };
}, { virtual: true });

// Mock dashboardService
jest.mock('../../src/services/dashboardService', () => ({
  fetchWallets: jest.fn(),
  fetchJars: jest.fn(),
  createTransaction: jest.fn(),
  fetchWalletIncome: jest.fn(() => Promise.resolve({ success: true, data: 2500000 })),
  fetchWalletExpense: jest.fn(() => Promise.resolve({ success: true, data: 1500000 })),
  ensureJarsExist: jest.fn(() => Promise.resolve({ success: true })),
  checkHasTransactionsToday: jest.fn(() => Promise.resolve(false)),
}));

// Mock profileService
jest.mock('../../src/services/profileService', () => ({
  fetchProfile: jest.fn(() => Promise.resolve({ success: true, data: { id: 'user-123', display_name: 'Capy User' } })),
  updateProfileName: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock supabaseClient
let mockTotalBudget = 10000000;
let mockRolloverEnabled = false;

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { email: 'test@example.com', phone: '0123456789' } }, error: null })),
    },
    from: jest.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: { total_budget: mockTotalBudget, rollover_enabled: mockRolloverEnabled }, error: null }))
            }))
          }))
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      };
    })
  },
}));

// Mock CapyMascot
jest.mock('../../src/components/CapyMascot', () => {
  const { View, Text } = require('react-native');
  return function MockCapyMascot({ type }: { type: string }) {
    return <View><Text>CapyMascot {type}</Text></View>;
  };
});

// Mock QuickAddBottomSheet
jest.mock('../../src/components/QuickAddBottomSheet', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockQuickAddBottomSheet({ visible, onClose, onSaveSuccess }: any) {
    if (!visible) return null;
    return (
      <View>
        <Text>MockQuickAddBottomSheet</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
        <TouchableOpacity onPress={onSaveSuccess}><Text>Save</Text></TouchableOpacity>
      </View>
    );
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
}));

// Mock notificationService
jest.mock('../../src/services/notificationService', () => ({
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
  scheduleDailyReminder: jest.fn(() => Promise.resolve()),
}));

describe('DashboardScreen', () => {
  const mockWallets = [
    { id: 'w-1', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'cash' },
    { id: 'w-2', name: 'Ví Chung Gia Đình', balance: 15000000, is_default: false, type: 'shared' },
  ];

  const mockJars = [
    { type: 'NEC', allocation_percentage: 55, spent_amount: 1000000, budget_limit: 2750000 },
    { type: 'PLAY', allocation_percentage: 10, spent_amount: 450000, budget_limit: 500000 },
    { type: 'FFA', allocation_percentage: 10, spent_amount: 600000, budget_limit: 500000 },
    { type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000 },
    { type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000 },
    { type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 250000 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRolloverEnabled = false;
  });

  it('renders loading state first, then lists wallets and active wallet data', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });

    const { getByText, queryByText } = render(
      <DashboardScreen userId="user-123" onSignOut={jest.fn()} />
    );

    // Verify loading screen is shown initially
    expect(getByText(/Đang chuẩn bị/i)).toBeTruthy();

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Check header title
    expect(getByText("Capy's Money")).toBeTruthy();

    // Check balance card: wallet name shown as switcher, balance in vi-VN format
    expect(getByText('Ví Cá Nhân')).toBeTruthy();
    // Balance 5000000 formatted as vi-VN with đ suffix
    expect(getByText(/5[.,]000[.,]000/)).toBeTruthy();

    // Jars details check
    expect(getByText(/Thiết yếu/)).toBeTruthy();
    expect(getByText(/Hưởng thụ/)).toBeTruthy();
    expect(getByText(/Đầu tư/)).toBeTruthy();
  });

  it('allows switching between wallets', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });

    const { getByText, queryByText, queryAllByText } = render(
      <DashboardScreen userId="user-123" onSignOut={jest.fn()} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Press to open wallet selector
    const switcher = getByText('Ví Cá Nhân');
    act(() => {
      fireEvent.press(switcher);
    });

    // Click on the second wallet
    const otherWalletOption = getByText('Ví Chung Gia Đình');
    await act(async () => {
      fireEvent.press(otherWalletOption);
    });

    // Verify fetchJars was called for the account user-123
    expect(fetchJars).toHaveBeenLastCalledWith('user-123');
  });

  it('opens and closes QuickAddBottomSheet when FAB/Button is clicked', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });

    const { getByText, queryByText, getByTestId } = render(
      <DashboardScreen userId="user-123" onSignOut={jest.fn()} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Press Add Transaction button
    const addButton = getByTestId('fab-add-transaction');
    fireEvent.press(addButton);

    // Verify QuickAddBottomSheet is visible
    expect(getByText('MockQuickAddBottomSheet')).toBeTruthy();

    // Press Close
    const closeBtn = getByText('Close');
    fireEvent.press(closeBtn);

    // Verify sheet is dismissed
    expect(queryByText('MockQuickAddBottomSheet')).toBeNull();
  });

  it('opens profile dropdown menu when avatar is clicked, and calls onSignOut when Sign Out is clicked', async () => {
    const onSignOutMock = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
      return {} as any;
    });
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });

    const { getByTestId, queryByText, getByText } = render(
      <DashboardScreen userId="user-123" onSignOut={onSignOutMock} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Profile options should not be visible initially
    expect(queryByText('Thông tin người dùng')).toBeNull();
    expect(queryByText('Cài đặt')).toBeNull();
    expect(queryByText('Đăng xuất')).toBeNull();

    // Click on avatar
    const avatarButton = getByTestId('avatar-button');
    fireEvent.press(avatarButton);

    // Profile options should now be visible
    expect(getByText('Thông tin người dùng')).toBeTruthy();
    expect(getByText('Cài đặt')).toBeTruthy();
    expect(getByText('Đăng xuất')).toBeTruthy();

    // Click "Đăng xuất" (Sign Out) in the dropdown
    const logoutBtn = getByTestId('dropdown-logout');
    fireEvent.press(logoutBtn);

    // Verify onSignOut was called
    expect(onSignOutMock).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });

  it('shows notification alert when bell button is clicked, without triggering onSignOut', async () => {
    const onSignOutMock = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });

    const { getByTestId, queryByText } = render(
      <DashboardScreen userId="user-123" onSignOut={onSignOutMock} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Press bell button
    const bellBtn = getByTestId('bell-button');
    fireEvent.press(bellBtn);

    // Verify alert was shown
    expect(alertSpy).toHaveBeenCalledWith('Thông báo', 'Hiện tại bạn chưa có thông báo mới nào.');
    // Verify onSignOut was NOT called
    expect(onSignOutMock).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('opens User Info modal, lets user edit and save display name within limits', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });
    (fetchProfile as jest.Mock).mockResolvedValue({ success: true, data: { id: 'user-123', display_name: 'Capy User' } });
    (updateProfileName as jest.Mock).mockResolvedValue({ success: true });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId, queryByText, getByPlaceholderText, getByText } = render(
      <DashboardScreen userId="user-123" onSignOut={jest.fn()} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Open dropdown
    fireEvent.press(getByTestId('avatar-button'));
    
    // Press User Info
    fireEvent.press(getByTestId('dropdown-profile-info'));

    // Check modal displays profile details
    await waitFor(() => {
      expect(getByText('Thông tin cá nhân')).toBeTruthy();
      expect(getByPlaceholderText('Nhập tên hiển thị')).toBeTruthy();
    });

    // Edit name to be empty (invalid)
    const nameInput = getByPlaceholderText('Nhập tên hiển thị');
    fireEvent.changeText(nameInput, '');
    fireEvent.press(getByTestId('save-profile-btn'));

    expect(alertSpy).toHaveBeenCalledWith('Lỗi', 'Tên hiển thị không được để trống.');

    // Edit name to a valid value and save
    fireEvent.changeText(nameInput, 'Capy Master');
    await act(async () => {
      fireEvent.press(getByTestId('save-profile-btn'));
    });

    expect(updateProfileName).toHaveBeenCalledWith('user-123', 'Capy Master');
    expect(alertSpy).toHaveBeenCalledWith('Thành công', 'Cập nhật tên hiển thị thành công!');
    alertSpy.mockRestore();
  });

  it('displays rollover forecast banner on dashboard when rollover is enabled with surplus', async () => {
    mockRolloverEnabled = true;
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars }); // spent sum = 1,450,000đ

    const { getByTestId, getByText, queryByText } = render(
      <DashboardScreen userId="user-123" onSignOut={jest.fn()} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Check rollover banner text for surplus: 10M budget - 2.05M spent = 7.95M surplus
    await waitFor(() => {
      expect(getByTestId('banner-rollover-forecast')).toBeTruthy();
      expect(getByText(/Dự kiến cộng thêm/)).toBeTruthy();
      expect(getByText(/7[.,]950[.,]000/)).toBeTruthy();
    });

    // Verify mascot quotes updated
    expect(getByText(/Duy trì phong độ nhé/)).toBeTruthy();
  });

  it('displays rollover warning banner on dashboard when rollover is enabled with deficit', async () => {
    mockRolloverEnabled = true;
    const overspentJars = [
      { type: 'NEC', allocation_percentage: 55, spent_amount: 8000000, budget_limit: 2750000 },
      { type: 'PLAY', allocation_percentage: 10, spent_amount: 4000000, budget_limit: 500000 },
    ]; // spent sum = 12M (exceeds 10M budget by 2M)
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: overspentJars });

    const { getByTestId, getByText, queryByText } = render(
      <DashboardScreen userId="user-123" onSignOut={jest.fn()} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Check rollover banner text for deficit: 10M budget - 12M spent = 2M deficit
    await waitFor(() => {
      expect(getByTestId('banner-rollover-forecast')).toBeTruthy();
      expect(getByText(/Lạm chi -2[.,]000[.,]000/)).toBeTruthy();
    });

    // Verify mascot quotes updated for deficit
    expect(getByText(/Tiêu quá tay rồi bạn ơi/)).toBeTruthy();
  });
});


