import { completeOnboarding } from '../../src/services/onboardingService';
import { supabase } from '../../src/services/supabaseClient';

const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockInsertJars = jest.fn();

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'profiles') {
        return {
          update: mockUpdate,
        };
      }
      if (table === 'wallets') {
        return {
          insert: mockInsert,
        };
      }
      if (table === 'jars') {
        return {
          insert: mockInsertJars,
        };
      }
      return {};
    }),
  },
}));

describe('onboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it('should complete onboarding with custom wallet name and custom jars ratios', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({ data: { id: 'wallet-123' }, error: null });
    mockInsertJars.mockResolvedValue({ error: null });

    const userId = 'user-123';
    const goal = 'Tiết kiệm mua nhà';
    const balance = 5000000;
    const walletName = 'Ví Lương Chính';
    const customJars = { nec: 50, lt: 15, ffa: 15, edu: 10, play: 8, give: 2 };

    const res = await completeOnboarding(userId, goal, balance, walletName, customJars);

    expect(res.success).toBe(true);

    // Verify profiles update
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith({
      onboarding_completed: true,
      financial_goal: goal,
      jars_ratios: customJars,
    });
    expect(mockEq).toHaveBeenCalledWith('id', userId);

    // Verify wallets insert
    expect(supabase.from).toHaveBeenCalledWith('wallets');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      name: walletName,
      balance: balance,
      is_default: true,
      type: 'cash',
    });
    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockSingle).toHaveBeenCalled();

    // Verify jars insert
    expect(supabase.from).toHaveBeenCalledWith('jars');
    expect(mockInsertJars).toHaveBeenCalledWith([
      { wallet_id: 'wallet-123', type: 'NEC', allocation_percentage: 50, budget_limit: 0, spent_amount: 0 },
      { wallet_id: 'wallet-123', type: 'FFA', allocation_percentage: 15, budget_limit: 0, spent_amount: 0 },
      { wallet_id: 'wallet-123', type: 'EDU', allocation_percentage: 10, budget_limit: 0, spent_amount: 0 },
      { wallet_id: 'wallet-123', type: 'PLAY', allocation_percentage: 8, budget_limit: 0, spent_amount: 0 },
      { wallet_id: 'wallet-123', type: 'LTSS', allocation_percentage: 15, budget_limit: 0, spent_amount: 0 },
      { wallet_id: 'wallet-123', type: 'GIVE', allocation_percentage: 2, budget_limit: 0, spent_amount: 0 },
    ]);
  });

  it('should handle error when profiles update fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'DB Error updating profile' } });

    const res = await completeOnboarding('user-123', 'Goal', 1000, 'My Wallet');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Không thể cập nhật hồ sơ người dùng. Vui lòng thử lại sau.');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should handle error when wallets insert fails', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error inserting wallet' } });

    const res = await completeOnboarding('user-123', 'Goal', 1000, 'My Wallet');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Cập nhật hồ sơ thành công nhưng không thể khởi tạo ví. Vui lòng tạo ví thủ công ở màn hình chính.');
  });

  it('should handle error when jars insert fails', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({ data: { id: 'wallet-123' }, error: null });
    mockInsertJars.mockResolvedValue({ error: { message: 'DB Error inserting jars' } });

    const res = await completeOnboarding('user-123', 'Goal', 1000, 'My Wallet');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Tạo ví thành công nhưng không thể khởi tạo 6 hũ tài chính. Vui lòng thử lại.');
  });
});
