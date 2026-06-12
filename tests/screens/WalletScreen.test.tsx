import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import WalletScreen from '../../src/screens/WalletScreen';
import { fetchWallets } from '../../src/services/dashboardService';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

// Mock Ionicons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: ({ name }: any) => <View testID={`icon-${name}`} />,
  };
}, { virtual: true });

// Mock services
jest.mock('../../src/services/dashboardService', () => ({
  fetchWallets: jest.fn(),
}));

// Mock supabaseClient
jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));

// Mock child sheets to verify rendering/callbacks
jest.mock('../../src/components/WalletCreateSheet', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockWalletCreateSheet({ visible, onClose, onSaveSuccess }: any) {
    if (!visible) return null;
    return (
      <View testID="wallet-create-sheet">
        <Text>Create Sheet Visible</Text>
        <TouchableOpacity onPress={onClose} testID="btn-close-create"><Text>Close</Text></TouchableOpacity>
        <TouchableOpacity onPress={onSaveSuccess} testID="btn-save-create"><Text>Save</Text></TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../../src/components/WalletEditSheet', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockWalletEditSheet({ visible, wallet, onClose, onSaveSuccess }: any) {
    if (!visible) return null;
    return (
      <View testID="wallet-edit-sheet">
        <Text>Edit Sheet: {wallet.name}</Text>
        <TouchableOpacity onPress={onClose} testID="btn-close-edit"><Text>Close</Text></TouchableOpacity>
        <TouchableOpacity onPress={onSaveSuccess} testID="btn-save-edit"><Text>Save</Text></TouchableOpacity>
      </View>
    );
  };
});

describe('WalletScreen', () => {
  const mockUserId = 'user-123';
  const mockOnWalletSelected = jest.fn();

  const mockPersonalWallets = [
    { id: 'w-1', name: 'Ví Ăn Tiêu', balance: 5000000, type: 'personal', is_default: true, user_id: 'user-123' },
    { id: 'w-2', name: 'Ví Tiết Kiệm', balance: 10000000, type: 'personal', is_default: false, user_id: 'user-123' },
  ];

  const mockSharedWallets = [
    { id: 'w-3', name: 'Ví Nhóm', balance: 15000000, type: 'shared', is_default: false, user_id: 'user-123' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (fetchWallets as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves
    const { getByTestId } = render(
      <WalletScreen userId={mockUserId} onWalletSelected={mockOnWalletSelected} />
    );
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders wallet cards correctly when loaded', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPersonalWallets,
    });

    const { findByText, queryByText } = render(
      <WalletScreen userId={mockUserId} onWalletSelected={mockOnWalletSelected} />
    );

    expect(await findByText('Ví Ăn Tiêu')).toBeTruthy();
    expect(await findByText('Ví Tiết Kiệm')).toBeTruthy();

    // Verify balances formatted
    expect(await findByText('5.000.000 đ')).toBeTruthy();
    expect(await findByText('10.000.000 đ')).toBeTruthy();
  });

  it('gating check: disables "+ Tạo ví mới" button and shows warning if user has >=5 wallets', async () => {
    const mockFiveWallets = [
      { id: 'w-1', name: 'Ví 1', balance: 1000000, type: 'personal', is_default: true, user_id: 'user-123' },
      { id: 'w-2', name: 'Ví 2', balance: 1000000, type: 'personal', is_default: false, user_id: 'user-123' },
      { id: 'w-3', name: 'Ví 3', balance: 1000000, type: 'personal', is_default: false, user_id: 'user-123' },
      { id: 'w-4', name: 'Ví 4', balance: 1000000, type: 'personal', is_default: false, user_id: 'user-123' },
      { id: 'w-5', name: 'Ví 5', balance: 1000000, type: 'personal', is_default: false, user_id: 'user-123' },
    ];
    (fetchWallets as jest.Mock).mockResolvedValue({
      success: true,
      data: mockFiveWallets, // 5 wallets
    });

    const { findByText, getByTestId } = render(
      <WalletScreen userId={mockUserId} onWalletSelected={mockOnWalletSelected} />
    );

    await findByText('Ví 1'); // wait for load
    
    const createBtn = getByTestId('create-wallet-btn');
    expect(createBtn.props.accessibilityState?.disabled).toBe(true);

    const warningText = await findByText(
      'Bạn đã đạt giới hạn ví miễn phí (tối đa 5 ví). Nâng cấp Premium để tạo thêm'
    );
    expect(warningText).toBeTruthy();
  });

  it('gating check: enables "+ Tạo ví mới" button if user is below quotas', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockPersonalWallets[0]], // only 1 wallet
    });

    const { findByText, getByTestId, queryByText } = render(
      <WalletScreen userId={mockUserId} onWalletSelected={mockOnWalletSelected} />
    );

    await findByText('Ví Ăn Tiêu'); // wait for load

    const createBtn = getByTestId('create-wallet-btn');
    expect(createBtn.props.accessibilityState?.disabled ?? false).toBe(false);
    expect(
      queryByText('Bạn đã đạt giới hạn ví miễn phí (tối đa 5 ví). Nâng cấp Premium để tạo thêm')
    ).toBeNull();
  });

  it('opens and closes WalletCreateSheet', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockPersonalWallets[0]],
    });

    const { findByText, getByTestId, queryByTestId } = render(
      <WalletScreen userId={mockUserId} onWalletSelected={mockOnWalletSelected} />
    );

    await findByText('Ví Ăn Tiêu');

    const createBtn = getByTestId('create-wallet-btn');
    fireEvent.press(createBtn);

    // Create sheet is now visible
    expect(getByTestId('wallet-create-sheet')).toBeTruthy();

    // Close it
    fireEvent.press(getByTestId('btn-close-create'));
    expect(queryByTestId('wallet-create-sheet')).toBeNull();
  });

  it('opens WalletEditSheet when settings gear is pressed', async () => {
    (fetchWallets as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockPersonalWallets[0]],
    });

    const { findByText, getByTestId } = render(
      <WalletScreen userId={mockUserId} onWalletSelected={mockOnWalletSelected} />
    );

    await findByText('Ví Ăn Tiêu');

    const settingsBtn = getByTestId('btn-settings-w-1');
    fireEvent.press(settingsBtn);

    expect(getByTestId('wallet-edit-sheet')).toBeTruthy();
  });


});
