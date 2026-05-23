import { generateInviteCode, joinWalletByCode, removeMember, fetchWalletMembers } from '../../src/services/walletInviteService';
import { supabase } from '../../src/services/supabaseClient';

const mockInvoke = jest.fn();
const mockDelete = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();

const mockFromChain = {
  delete: mockDelete,
  select: mockSelect,
  eq: mockEq,
};

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
    from: jest.fn(() => mockFromChain),
  },
}));

// Mock NetInfo using mock-prefixed variable allowed by Jest
let mockIsOffline = false;
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: !mockIsOffline })),
}));

describe('walletInviteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOffline = false;
    
    // Reset method chaining mocks
    mockDelete.mockReturnValue(mockFromChain);
    mockSelect.mockReturnValue(mockFromChain);
    mockEq.mockReturnValue(mockFromChain);
  });

  describe('generateInviteCode', () => {
    it('should generate an invite code successfully', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { code: 'CAPY-987654', expires_at: '2026-05-22T09:00:00.000Z' },
        error: null,
      });

      const res = await generateInviteCode('wallet-123');
      expect(res.success).toBe(true);
      expect(res.code).toBe('CAPY-987654');
      expect(res.expiresAt).toBe('2026-05-22T09:00:00.000Z');
      expect(mockInvoke).toHaveBeenCalledWith('create-invitation', {
        body: { wallet_id: 'wallet-123' },
      });
    });

    it('should return error when offline', async () => {
      mockIsOffline = true;
      const res = await generateInviteCode('wallet-123');
      expect(res.success).toBe(false);
      expect(res.error).toContain('kết nối Internet');
    });

    it('should return error if wallet is full', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { error: 'Ví đã đầy, không thể mời thêm thành viên.', code: 'E-wallet-003' },
        error: null,
      });

      const res = await generateInviteCode('wallet-123');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Ví đã đầy');
    });

    it('should return error on service failure', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Network error'));
      const res = await generateInviteCode('wallet-123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Network error');
    });
  });

  describe('joinWalletByCode', () => {
    it('should join a wallet successfully by code', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { success: true, wallet_name: 'Ví Nhà Chung Otter' },
        error: null,
      });

      const res = await joinWalletByCode('CAPY-123456');
      expect(res.success).toBe(true);
      expect(res.walletName).toBe('Ví Nhà Chung Otter');
      expect(mockInvoke).toHaveBeenCalledWith('join-wallet-by-code', {
        body: { code: 'CAPY-123456' },
      });
    });

    it('should return error when offline', async () => {
      mockIsOffline = true;
      const res = await joinWalletByCode('CAPY-123456');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('E-wallet-006');
    });

    it('should return E-wallet-001 when code does not exist', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { error: 'Mã mời không tồn tại.', code: 'E-wallet-001' },
        error: null,
      });

      const res = await joinWalletByCode('CAPY-111111');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('E-wallet-001');
    });

    it('should return E-wallet-002 when code is expired', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { error: 'Mã mời đã hết hạn.', code: 'E-wallet-002' },
        error: null,
      });

      const res = await joinWalletByCode('CAPY-222222');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('E-wallet-002');
    });

    it('should return E-wallet-005 when user is locked out due to brute-force protection', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { error: 'Bạn đã nhập sai mã quá nhiều lần.', code: 'E-wallet-005' },
        error: null,
      });

      const res = await joinWalletByCode('CAPY-333333');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('E-wallet-005');
    });
  });

  describe('removeMember', () => {
    it('should remove a member successfully', async () => {
      // Chain: from() -> delete() (returns mockFromChain) -> eq('wallet_id', wallet-123) (returns mockFromChain) -> eq('user_id', user-456) (resolves)
      mockEq
        .mockReturnValueOnce(mockFromChain)
        .mockResolvedValueOnce({ error: null });

      const res = await removeMember('wallet-123', 'user-456');
      expect(res.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('wallet_members');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenNthCalledWith(1, 'wallet_id', 'wallet-123');
      expect(mockEq).toHaveBeenNthCalledWith(2, 'user_id', 'user-456');
    });

    it('should return error when delete fails', async () => {
      mockEq
        .mockReturnValueOnce(mockFromChain)
        .mockResolvedValueOnce({ error: { message: 'Database delete failed' } });

      const res = await removeMember('wallet-123', 'user-456');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Database delete failed');
    });
  });

  describe('fetchWalletMembers', () => {
    it('should fetch wallet members successfully', async () => {
      const mockMembers = [
        { user_id: 'user-1', role: 'owner', profiles: { display_name: 'Otter Owner', avatar_url: 'http://...' } },
        { user_id: 'user-2', role: 'editor', profiles: { display_name: 'Capy Editor', avatar_url: 'http://...' } }
      ];

      mockEq.mockResolvedValueOnce({ data: mockMembers, error: null });

      const res = await fetchWalletMembers('wallet-123');
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockMembers);
      expect(supabase.from).toHaveBeenCalledWith('wallet_members');
      expect(mockSelect).toHaveBeenCalledWith('user_id, role, profiles(display_name, avatar_url)');
      expect(mockEq).toHaveBeenCalledWith('wallet_id', 'wallet-123');
    });

    it('should return database error when fetch fails', async () => {
      mockEq.mockResolvedValueOnce({ data: null, error: { message: 'Database read failed' } });

      const res = await fetchWalletMembers('wallet-123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Database read failed');
    });
  });
});
