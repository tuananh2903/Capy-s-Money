import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import WalletEditSheet from '../../src/components/WalletEditSheet';
import { updateJarAllocations, deleteWallet, setDefaultWallet } from '../../src/services/dashboardService';

// Mock dashboardService
jest.mock('../../src/services/dashboardService', () => ({
  updateJarAllocations: jest.fn(),
  deleteWallet: jest.fn(),
  setDefaultWallet: jest.fn(),
  fetchJars: jest.fn().mockResolvedValue({
    success: true,
    data: [
      { type: 'NEC', allocation_percentage: 55, spent_amount: 0, budget_limit: 0 },
      { type: 'FFA', allocation_percentage: 10, spent_amount: 0, budget_limit: 0 },
      { type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 0 },
      { type: 'PLAY', allocation_percentage: 10, spent_amount: 0, budget_limit: 0 },
      { type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 0 },
      { type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 0 },
    ],
  }),
}));

describe('WalletEditSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnSaveSuccess = jest.fn();
  const mockWallet = {
    id: 'w-1',
    user_id: 'user-123',
    name: 'Ví Ăn Tiêu',
    balance: 5000000,
    is_default: false,
    type: 'personal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders personal wallet correctly', async () => {
    const { findByText } = render(
      <WalletEditSheet
        visible={true}
        onClose={mockOnClose}
        wallet={mockWallet}
        userId="user-123"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    // Title & Sliders
    expect(await findByText('Cài đặt: Ví Ăn Tiêu')).toBeTruthy();
    expect(await findByText('⭐ Đặt làm mặc định')).toBeTruthy();
    expect(await findByText('🗑️ Xóa ví')).toBeTruthy();
  });
});
