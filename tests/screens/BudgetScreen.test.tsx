import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BudgetScreen from '../../src/screens/BudgetScreen';
import {
  fetchUserWallets,
  fetchJars,
  fetchCategoryBudgets,
  fetchCategories,
  saveJarAllocation
} from '../../src/services/budgetService';

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
  };
}, { virtual: true });

// Mock budgetService
jest.mock('../../src/services/budgetService', () => ({
  fetchUserWallets: jest.fn(),
  fetchJars: jest.fn(),
  fetchCategoryBudgets: jest.fn(),
  fetchCategories: jest.fn(),
  saveJarAllocation: jest.fn(),
  saveCategoryBudget: jest.fn(),
  deleteJar: jest.fn(),
  deleteCategoryBudget: jest.fn(),
  createCategory: jest.fn(),
  toggleJarAlert: jest.fn(),
  toggleCategoryBudgetAlert: jest.fn()
}));

// Mock supabaseClient
let mockTotalBudget = 10000000;
let mockRolloverEnabled = false;
const mockProfileUpdate = jest.fn().mockResolvedValue({ error: null });

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } }, error: null })),
    },
    from: jest.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: { total_budget: mockTotalBudget, rollover_enabled: mockRolloverEnabled }, error: null }))
            }))
          })),
          update: jest.fn((data: any) => {
            mockProfileUpdate(data);
            return {
              eq: jest.fn().mockResolvedValue({ error: null })
            };
          })
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

// Mock WalletTabBar
jest.mock('../../src/components/budget/WalletTabBar', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    WalletTabBar: ({ wallets, activeWalletId, onChangeWallet }: any) => (
      <View testID="mock-wallet-tab-bar">
        {wallets.map((w: any) => (
          <TouchableOpacity key={w.id} onPress={() => onChangeWallet(w.id)} testID={`wallet-tab-${w.id}`}>
            <Text>{w.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  };
});

// Mock JarCard
jest.mock('../../src/components/budget/JarCard', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    JarCard: ({ jar, onEditJar, onDeleteJar }: any) => (
      <View testID={`jar-card-${jar.type}`}>
        <Text>{jar.name}</Text>
        <Text>{jar.pct}%</Text>
        <Text>{jar.limit}đ</Text>
        <TouchableOpacity onPress={onEditJar} testID={`edit-jar-${jar.type}`}><Text>Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={onDeleteJar} testID={`delete-jar-${jar.type}`}><Text>Delete</Text></TouchableOpacity>
      </View>
    )
  };
});

// Mock JarEditSheet
jest.mock('../../src/components/budget/JarEditSheet', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    JarEditSheet: ({ visible, onClose, onSave, jarData }: any) => {
      if (!visible) return null;
      return (
        <View testID="mock-jar-edit-sheet">
          <Text>Editing {jarData.name}</Text>
          <TouchableOpacity onPress={() => onSave({ name: jarData.name, icon: jarData.icon, pct: 20, categories: [] })} testID="save-jar-config"><Text>Save</Text></TouchableOpacity>
          <TouchableOpacity onPress={onClose} testID="close-jar-edit-sheet"><Text>Cancel</Text></TouchableOpacity>
        </View>
      );
    }
  };
});

// Mock PremiumModal
jest.mock('../../src/components/budget/PremiumModal', () => {
  const { View } = require('react-native');
  return {
    PremiumModal: () => <View testID="mock-premium-modal" />
  };
});

describe('BudgetScreen', () => {
  const mockWallets = [
    { id: 'w-1', name: 'Ví Cá Nhân', rollover_enabled: false },
    { id: 'w-2', name: 'Ví Gia Đình', rollover_enabled: false }
  ];

  const mockJars = [
    { id: 'j-1', type: 'NEC', allocation_percentage: 50, spent_amount: 1000000, enable_alerts: true },
    { id: 'j-2', type: 'PLAY', allocation_percentage: 50, spent_amount: 500000, enable_alerts: false }
  ];

  const mockCategories = [
    { id: 'c-1', name: 'Ăn uống', type: 'expense', jar_type: 'NEC' },
    { id: 'c-2', name: 'Xem phim', type: 'expense', jar_type: 'PLAY' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads wallets, loads budget, and displays values', async () => {
    mockTotalBudget = 5000000;
    (fetchUserWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });
    (fetchCategoryBudgets as jest.Mock).mockResolvedValue({ success: true, data: [] });
    (fetchCategories as jest.Mock).mockResolvedValue({ success: true, data: mockCategories });

    const { getByText, queryByText, getByTestId } = render(<BudgetScreen />);

    // Wait until the jars are loaded and rendered
    await waitFor(() => {
      expect(getByText('Thiết yếu (NEC)')).toBeTruthy();
    });

    // Total budget is 5M, should display "5.000.000đ"
    expect(getByText(/5[.,]000[.,]000/)).toBeTruthy();

    expect(getByText('Hưởng thụ (PLAY)')).toBeTruthy();
  });

  it('allows starting edit mode for total budget and saving changes', async () => {
    mockTotalBudget = 10000000;
    (fetchUserWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });
    (fetchCategoryBudgets as jest.Mock).mockResolvedValue({ success: true, data: [] });
    (fetchCategories as jest.Mock).mockResolvedValue({ success: true, data: mockCategories });
    (saveJarAllocation as jest.Mock).mockResolvedValue({ success: true });

    const { getByTestId, getByPlaceholderText, getByText } = render(<BudgetScreen />);

    await waitFor(() => {
      expect(getByText('Thiết yếu (NEC)')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByTestId('btn-edit-total-budget')).toBeTruthy();
    });

    // Start editing total budget
    fireEvent.press(getByTestId('btn-edit-total-budget'));

    // Check TextInput is rendered
    const input = getByPlaceholderText('Nhập tổng ngân sách...');
    expect(input).toBeTruthy();

    // Change value and save
    fireEvent.changeText(input, '15000000');
    await act(async () => {
      fireEvent.press(getByTestId('btn-save-total-budget'));
    });

    // Verify it updates profiles and database allocations
    expect(mockProfileUpdate).toHaveBeenCalledWith({ total_budget: 15000000 });
    expect(saveJarAllocation).toHaveBeenCalledTimes(2); // Since there are 2 jars
    expect(saveJarAllocation).toHaveBeenCalledWith('user-123', 'NEC', 50, 7500000); // 15M * 50%
    expect(saveJarAllocation).toHaveBeenCalledWith('user-123', 'PLAY', 50, 7500000); // 15M * 50%
  });

  it('validates total budget must be greater than 0', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (fetchUserWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });
    (fetchCategoryBudgets as jest.Mock).mockResolvedValue({ success: true, data: [] });
    (fetchCategories as jest.Mock).mockResolvedValue({ success: true, data: mockCategories });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('10000000');

    const { getByTestId, getByPlaceholderText, getByText } = render(<BudgetScreen />);

    await waitFor(() => {
      expect(getByText('Thiết yếu (NEC)')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByTestId('btn-edit-total-budget')).toBeTruthy();
    });

    fireEvent.press(getByTestId('btn-edit-total-budget'));
    const input = getByPlaceholderText('Nhập tổng ngân sách...');
    
    // Test invalid negative / zero budget
    fireEvent.changeText(input, '0');
    fireEvent.press(getByTestId('btn-save-total-budget'));
    expect(alertSpy).toHaveBeenCalledWith('Lỗi', 'Tổng ngân sách phải lớn hơn 0đ.');

    alertSpy.mockRestore();
  });

  it('loads rollover setting from profile and displays correct preview for surplus', async () => {
    mockTotalBudget = 10000000;
    mockRolloverEnabled = true;
    (fetchUserWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars }); // spent sum = 1,500,000đ
    (fetchCategoryBudgets as jest.Mock).mockResolvedValue({ success: true, data: [] });
    (fetchCategories as jest.Mock).mockResolvedValue({ success: true, data: mockCategories });

    const { getByTestId, getByText } = render(<BudgetScreen />);

    await waitFor(() => {
      expect(getByText('Thiết yếu (NEC)')).toBeTruthy();
    });

    // Check forecast calculations: 10M (budget) + (10M - 1.5M spent) = 18.5M
    await waitFor(() => {
      expect(getByTestId('text-next-budget-amount')).toBeTruthy();
      expect(getByText(/18[.,]500[.,]000/)).toBeTruthy();
      expect(getByText(/Dồn dư/)).toBeTruthy();
    });
  });

  it('displays correct preview for deficit when spending exceeds budget with rollover enabled', async () => {
    mockTotalBudget = 10000000;
    mockRolloverEnabled = true;
    const overspentJars = [
      { id: 'j-1', type: 'NEC', allocation_percentage: 50, spent_amount: 8000000, enable_alerts: true },
      { id: 'j-2', type: 'PLAY', allocation_percentage: 50, spent_amount: 4000000, enable_alerts: false }
    ]; // spent sum = 12,000,000đ (overbudget by 2M)
    (fetchUserWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: overspentJars });
    (fetchCategoryBudgets as jest.Mock).mockResolvedValue({ success: true, data: [] });
    (fetchCategories as jest.Mock).mockResolvedValue({ success: true, data: mockCategories });

    const { getByText, getByTestId } = render(<BudgetScreen />);

    // Forecast: 10M budget + (10M - 12M spent) = 8M next month budget
    await waitFor(() => {
      expect(getByTestId('text-next-budget-amount')).toBeTruthy();
      expect(getByText(/8[.,]000[.,]000/)).toBeTruthy();
      expect(getByText(/Bù lạm chi/)).toBeTruthy();
    });
  });

  it('allows toggling rollover setting and updates profiles table', async () => {
    mockTotalBudget = 10000000;
    mockRolloverEnabled = false;
    (fetchUserWallets as jest.Mock).mockResolvedValue({ success: true, data: mockWallets });
    (fetchJars as jest.Mock).mockResolvedValue({ success: true, data: mockJars });
    (fetchCategoryBudgets as jest.Mock).mockResolvedValue({ success: true, data: [] });
    (fetchCategories as jest.Mock).mockResolvedValue({ success: true, data: mockCategories });

    const { getByTestId, getByText } = render(<BudgetScreen />);

    await waitFor(() => {
      expect(getByTestId('btn-toggle-rollover')).toBeTruthy();
    });

    // Press switch to toggle
    await act(async () => {
      fireEvent.press(getByTestId('btn-toggle-rollover'));
    });

    // Verify it updates profiles database with active state
    expect(mockProfileUpdate).toHaveBeenCalledWith({ rollover_enabled: true });
  });
});

