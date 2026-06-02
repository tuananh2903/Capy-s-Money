import { completeOnboarding } from '../../src/services/onboardingService';
import { supabase } from '../../src/services/supabaseClient';

const mockRpc = jest.fn();

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

describe('onboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete onboarding with custom wallet name and custom jars ratios via RPC', async () => {
    mockRpc.mockResolvedValue({ error: null });

    const userId = 'user-123';
    const goal = 'Tiết kiệm mua nhà';
    const balance = 5000000;
    const walletName = 'Ví Lương Chính';
    const customJars = { nec: 50, lt: 15, ffa: 15, edu: 10, play: 8, give: 2 };

    const res = await completeOnboarding(userId, goal, balance, walletName, customJars);

    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('complete_onboarding', {
      p_user_id: userId,
      p_goal: goal,
      p_balance: balance,
      p_wallet_name: walletName,
      p_jars_ratios: customJars,
    });
  });

  it('should handle error when RPC fails', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Database transaction error' } });

    const res = await completeOnboarding('user-123', 'Goal', 1000, 'My Wallet');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Không thể hoàn tất thiết lập ví. Vui lòng thử lại sau.');
  });
});
