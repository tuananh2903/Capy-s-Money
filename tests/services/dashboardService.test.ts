import { fetchWallets, fetchJars, createTransaction, updateJarAllocations } from '../../src/services/dashboardService';
import { supabase } from '../../src/services/supabaseClient';

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockOr = jest.fn();

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'wallets') {
        return {
          select: mockSelect,
        };
      }
      if (table === 'jars') {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      if (table === 'transactions') {
        return {
          insert: mockInsert,
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
    
    // Default promise resolution for the chain
    mockChain.then = jest.fn((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data: null, error: null }));
    });

    mockSelect.mockReturnValue(mockChain);
    mockInsert.mockReturnValue(mockChain);
    mockUpdate.mockReturnValue(mockChain);
  });

  describe('fetchWallets', () => {
    it('should fetch all wallets of the user (owned or shared)', async () => {
      const mockWallets = [
        { id: 'w-1', name: 'Ví Cá Nhân', type: 'personal', balance: 5000000 },
        { id: 'w-2', name: 'Ví Chung', type: 'shared', balance: 10000000 },
      ];
      
      mockOr.mockResolvedValue({ data: mockWallets, error: null });

      const res = await fetchWallets('user-123');
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockWallets);
      expect(supabase.from).toHaveBeenCalledWith('wallets');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOr).toHaveBeenCalledWith('user_id.eq.user-123,id.in.(select wallet_id from wallet_members where user_id = user-123)');
    });

    it('should return error if fetching wallets fails', async () => {
      mockOr.mockResolvedValue({ data: null, error: { message: 'Database Error' } });

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
      expect(mockEq).toHaveBeenCalledWith('wallet_id', 'w-123');
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
});
