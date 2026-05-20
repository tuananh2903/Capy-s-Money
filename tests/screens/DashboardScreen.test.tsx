import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../../src/screens/DashboardScreen';
import { fetchWallets, fetchJars } from '../../src/services/dashboardService';

// Mock dashboardService
jest.mock('../../src/services/dashboardService', () => ({
  fetchWallets: jest.fn(),
  fetchJars: jest.fn(),
  createTransaction: jest.fn(),
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

describe('DashboardScreen', () => {
  const mockWallets = [
    { id: 'w-1', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'cash' },
    { id: 'w-2', name: 'Ví Chung Gia Đình', balance: 15000000, is_default: false, type: 'shared' },
  ];

  const mockJars = [
    { type: 'NEC', allocation_percentage: 55, spent_amount: 1000000 }, // Normal
    { type: 'PLAY', allocation_percentage: 10, spent_amount: 450000 }, // Spent 90% (Spending too fast on mid month)
    { type: 'FFA', allocation_percentage: 10, spent_amount: 600000 },  // Over budget (Limit = 500000, Spent = 600000)
    { type: 'EDU', allocation_percentage: 10, spent_amount: 0 },
    { type: 'LTSS', allocation_percentage: 10, spent_amount: 0 },
    { type: 'GIVE', allocation_percentage: 5, spent_amount: 0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
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

    // Check header titles
    expect(getByText("Capy's Money 🦦")).toBeTruthy();

    // Check balance and current active wallet
    expect(getByText('Ví Cá Nhân')).toBeTruthy();
    expect(getByText('5,000,000 VND')).toBeTruthy();

    // Jars details check
    expect(getByText(/Thiết yếu/)).toBeTruthy();
    expect(getByText(/Hưởng thụ/)).toBeTruthy();
    expect(getByText(/Tự do TC/)).toBeTruthy();
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

    // Verify fetchJars was called for the second wallet ID 'w-2'
    expect(fetchJars).toHaveBeenLastCalledWith('w-2');
  });

  it('opens and closes QuickAddBottomSheet when FAB/Button is clicked', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });

    const { getByText, queryByText } = render(
      <DashboardScreen userId="user-123" onSignOut={jest.fn()} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang chuẩn bị/i)).toBeNull();
    });

    // Press Add Transaction button
    const addButton = getByText('+ Giao dịch');
    fireEvent.press(addButton);

    // Verify QuickAddBottomSheet is visible
    expect(getByText('MockQuickAddBottomSheet')).toBeTruthy();

    // Press Close
    const closeBtn = getByText('Close');
    fireEvent.press(closeBtn);

    // Verify sheet is dismissed
    expect(queryByText('MockQuickAddBottomSheet')).toBeNull();
  });
});
