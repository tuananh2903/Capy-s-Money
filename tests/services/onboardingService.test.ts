import { completeOnboarding } from '../../src/services/onboardingService';
import { supabase } from '../../src/services/supabaseClient';

const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();

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
    mockInsert.mockResolvedValue({ error: null });

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
    mockInsert.mockResolvedValue({ error: { message: 'DB Error inserting wallet' } });

    const res = await completeOnboarding('user-123', 'Goal', 1000, 'My Wallet');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Cập nhật hồ sơ thành công nhưng không thể khởi tạo ví. Vui lòng tạo ví thủ công ở màn hình chính.');
  });
});
