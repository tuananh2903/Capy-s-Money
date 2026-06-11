import { fetchWallets, fetchJars, createTransaction, updateJarAllocations, fetchWalletIncome, ensureJarsExist, createWallet, updateWallet, deleteWallet, setDefaultWallet } from '../../src/services/dashboardService';
import { supabase } from '../../src/services/supabaseClient';

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockUpsert = jest.fn();
const mockEq = jest.fn();
const mockOr = jest.fn();

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'wallets') {
        return {
          select: mockSelect,
          insert: mockInsert,
          update: mockUpdate,
        };
      }
      if (table === 'wallet_members') {
        return {
          select: mockSelect,
        };
      }
      if (table === 'jars') {
        return {
          select: mockSelect,
          update: mockUpdate,
          upsert: mockUpsert,
        };
      }
      if (table === 'transactions') {
        return {
          insert: mockInsert,
          select: mockSelect,
        };
      }
      return {};
    }),
  },
}));

describe('dashboardService', () => {
  const mockChain = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup chainable mock methods
    mockChain.eq = mockEq.mockReturnValue(mockChain);
    mockChain.or = mockOr.mockReturnValue(mockChain);
    mockChain.select = mockSelect.mockReturnValue(mockChain);
    
    // Default promise resolution for the chain
    mockChain.then = jest.fn((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data: null, error: null }));
    });

    mockSelect.mockReturnValue(mockChain);
    mockInsert.mockReturnValue(mockChain);
    mockUpdate.mockReturnValue(mockChain);
    mockUpsert.mockReturnValue(mockChain);
  });

  describe('fetchWallets', () => {
    it('should fetch all wallets of the user (owned) - no shared wallets', async () => {
      const mockWallets = [
        { id: 'w-1', name: 'Ví Cá Nhân', type: 'personal', balance: 5000000 },
      ];

      let callCount = 0;
      mockChain.then = jest.fn((onFulfilled) => {
        callCount++;
        if (callCount === 1) {
          // wallet_members query
          return Promise.resolve(onFulfilled({ data: [], error: null }));
        } else {
          // wallets query
          return Promise.resolve(onFulfilled({ data: mockWallets, error: null }));
        }
      });

      const res = await fetchWallets('user-123');
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockWallets);
      expect(supabase.from).toHaveBeenCalledWith('wallet_members');
      expect(supabase.from).toHaveBeenCalledWith('wallets');
    });

    it('should return error if fetching wallet_members fails', async () => {
      mockChain.then = jest.fn((onFulfilled) => {
        return Promise.resolve(onFulfilled({ data: null, error: { message: 'Database Error' } }));
      });

      const res = await fetchWallets('user-123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Không thể tải danh sách ví: Database Error');
    });
  });

  describe('fetchJars', () => {
    it('should fetch the 6 jars of a wallet', async () => {
      const mockJars = [
        { type: 'NEC', spent_amount: 1000, budget_limit: 5000, allocation_percentage: 55 },
        { type: 'PLAY', spent_amount: 200, budget_limit: 1000, allocation_percentage: 10 },
      ];

      mockEq.mockResolvedValue({ data: mockJars, error: null });

      const res = await fetchJars('w-123');
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockJars);
      expect(supabase.from).toHaveBeenCalledWith('jars');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'w-123');
    });

    it('should return error if fetching jars fails', async () => {
      mockEq.mockResolvedValue({ data: null, error: { message: 'Database Error' } });

      const res = await fetchJars('w-123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Không thể tải danh sách hũ tài chính: Database Error');
    });
  });

  describe('createTransaction', () => {
    it('should validate and insert a transaction successfully', async () => {
      const txData = {
        wallet_id: 'w-1',
        jar_type: 'NEC',
        amount: 500000,
        type: 'expense' as const,
        note: 'Tiền chợ',
        occurred_at: '2026-05-20T22:00:00Z',
        created_by: 'user-123',
      };

      const mockResult = [{ id: 'tx-1', ...txData }];
      mockInsert.mockResolvedValue({ data: mockResult, error: null });

      const res = await createTransaction(txData);
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResult);
      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(mockInsert).toHaveBeenCalledWith(txData);
    });

    it('should return error if amount is <= 0', async () => {
      const txData = {
        wallet_id: 'w-1',
        jar_type: 'NEC',
        amount: 0,
        type: 'expense' as const,
        note: 'Tiền chợ',
        occurred_at: '2026-05-20T22:00:00Z',
        created_by: 'user-123',
      };

      const res = await createTransaction(txData);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Số tiền giao dịch phải lớn hơn 0.');
    });

    it('should return error if note exceeds 200 characters', async () => {
      const txData = {
        wallet_id: 'w-1',
        jar_type: 'NEC',
        amount: 5000,
        type: 'expense' as const,
        note: 'a'.repeat(201),
        occurred_at: '2026-05-20T22:00:00Z',
        created_by: 'user-123',
      };

      const res = await createTransaction(txData);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Ghi chú không được vượt quá 200 ký tự.');
    });

    it('should return error if database insert fails', async () => {
      const txData = {
        wallet_id: 'w-1',
        jar_type: 'NEC',
        amount: 5000,
        type: 'expense' as const,
        note: 'Tiền chợ',
        occurred_at: '2026-05-20T22:00:00Z',
        created_by: 'user-123',
      };

      mockInsert.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

      const res = await createTransaction(txData);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Không thể thêm giao dịch: Insert failed');
    });
  });

  describe('updateJarAllocations', () => {
    it('should update jar allocations successfully if total is 100%', async () => {
      const allocations = [
        { type: 'NEC', percentage: 55 },
        { type: 'FFA', percentage: 10 },
        { type: 'EDU', percentage: 10 },
        { type: 'PLAY', percentage: 10 },
        { type: 'LTSS', percentage: 10 },
        { type: 'GIVE', percentage: 5 },
      ];

      // Setup custom chain for two eq() calls
      const mockEq2 = jest.fn().mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: mockEq2
        })
      });

      const res = await updateJarAllocations('w-1', allocations);
      expect(res.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('jars');
      expect(mockUpdate).toHaveBeenCalledTimes(6);
      expect(mockEq2).toHaveBeenCalledTimes(6);
    });

    it('should return error if total percentage is not 100%', async () => {
      const allocations = [
        { type: 'NEC', percentage: 50 },
        { type: 'FFA', percentage: 10 },
      ];

      const res = await updateJarAllocations('w-1', allocations);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Tổng tỷ lệ phân bổ của các hũ phải bằng 100% (hiện tại: 60%).');
    });
  });

  describe('createWallet', () => {
    it('should insert a new wallet successfully', async () => {
      const walletData = { name: 'Ví tiết kiệm', type: 'personal', created_by: 'user-1' };
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'w-new', ...walletData }, error: null });
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle
        })
      });

      const res = await createWallet(walletData);
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ id: 'w-new', ...walletData });
      expect(supabase.from).toHaveBeenCalledWith('wallets');
      expect(mockInsert).toHaveBeenCalledWith(walletData);
    });

    it('should return error if insert fails', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
        })
      });

      const res = await createWallet({ name: 'Ví lỗi' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Insert failed');
    });
  });

  describe('updateWallet', () => {
    it('should update wallet details successfully', async () => {
      mockEq.mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const res = await updateWallet('w-123', { name: 'Tên mới' });
      expect(res.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('wallets');
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Tên mới' });
      expect(mockEq).toHaveBeenCalledWith('id', 'w-123');
    });
  });

  describe('deleteWallet', () => {
    it('should soft delete wallet by setting is_deleted to true', async () => {
      mockEq.mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const res = await deleteWallet('w-123');
      expect(res.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('wallets');
      expect(mockUpdate).toHaveBeenCalledWith({ is_deleted: true });
      expect(mockEq).toHaveBeenCalledWith('id', 'w-123');
    });
  });

  describe('setDefaultWallet', () => {
    it('should call set_default_wallet RPC successfully', async () => {
      const mockRpc = jest.fn().mockResolvedValue({ error: null });
      (supabase as any).rpc = mockRpc;

      const res = await setDefaultWallet('w-123', 'user-123');
      expect(res.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('set_default_wallet', { p_wallet_id: 'w-123', p_user_id: 'user-123' });
    });

    it('should return error if RPC fails', async () => {
      const mockRpc = jest.fn().mockResolvedValue({ error: { message: 'RPC Error' } });
      (supabase as any).rpc = mockRpc;

      const res = await setDefaultWallet('w-123', 'user-123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('RPC Error');
    });
  });

  describe('fetchWalletIncome', () => {
    it('should fetch and sum all income transactions for a wallet', async () => {
      const mockTxData = [
        { amount: 500000 },
        { amount: 1200000 },
      ];

      const mockEq3 = jest.fn().mockResolvedValue({ data: mockTxData, error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: mockEq3
          })
        })
      });

      const res = await fetchWalletIncome('w-123');
      expect(res.success).toBe(true);
      expect(res.data).toBe(1700000);
      expect(supabase.from).toHaveBeenCalledWith('transactions');
    });

    it('should return error if db query fails', async () => {
      const mockEq3 = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: mockEq3
          })
        })
      });

      const res = await fetchWalletIncome('w-123');
      expect(res.success).toBe(false);
      expect(res.data).toBe(0);
      expect(res.error).toBe('Không thể tải dữ liệu thu nhập: DB error');
    });
  });

  describe('ensureJarsExist', () => {
    it('should upsert jars if they do not exist or have 0% allocation', async () => {
      const mockCurrentJars = [
        { id: 'j-1', type: 'NEC', allocation_percentage: 0, budget_limit: 0, spent_amount: 0 },
        { id: 'j-2', type: 'FFA', allocation_percentage: 10, budget_limit: 0, spent_amount: 0 },
      ] as any[];

      mockUpsert.mockResolvedValue({ error: null });

      const res = await ensureJarsExist('w-123', mockCurrentJars, { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 });
      expect(res.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('jars');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.any(Array),
        { onConflict: 'user_id,type' }
      );
      // Verifies that it upserted NEC (updated to 55%) and missing jars (PLAY, EDU, LTSS, GIVE)
      // but didn't upsert FFA (since it was already 10%)
      const upsertedPayload = mockUpsert.mock.calls[0][0];
      expect(upsertedPayload.length).toBe(5); // NEC, EDU, PLAY, LTSS, GIVE
      expect(upsertedPayload.find((p: any) => p.type === 'NEC').allocation_percentage).toBe(55);
      expect(upsertedPayload.find((p: any) => p.type === 'NEC').id).toBeUndefined(); // verify no id passed
      expect(upsertedPayload.find((p: any) => p.type === 'FFA')).toBeUndefined();
    });

    it('should do nothing if all 6 jars already exist with non-zero allocation', async () => {
      const mockCurrentJars = [
        { type: 'NEC', allocation_percentage: 55 },
        { type: 'FFA', allocation_percentage: 10 },
        { type: 'EDU', allocation_percentage: 10 },
        { type: 'PLAY', allocation_percentage: 10 },
        { type: 'LTSS', allocation_percentage: 10 },
        { type: 'GIVE', allocation_percentage: 5 },
      ] as any[];

      const res = await ensureJarsExist('w-123', mockCurrentJars);
      expect(res.success).toBe(true);
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should return error if upsert fails', async () => {
      const mockCurrentJars = [] as any[];
      mockUpsert.mockResolvedValue({ error: { message: 'Upsert failed' } });

      const res = await ensureJarsExist('w-123', mockCurrentJars);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Upsert failed');
    });
  });
});
