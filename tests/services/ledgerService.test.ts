import { fetchLedgerTransactions, fetchPreviousMonthSpend, updateTransactionById } from '../../src/services/ledgerService';
import { supabase } from '../../src/services/supabaseClient';

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  }
}));

describe('Ledger Service Tests', () => {
  it('should call supabase to fetch ledger transactions correctly', async () => {
    const mockData = [{ id: '1', amount: 100000, category: { name: 'Ăn uống', parent_id: null } }];
    const mockFrom = supabase.from as jest.Mock;
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const res = await fetchLedgerTransactions(['wallet-123'], new Date('2026-05-01'), new Date('2026-05-31'));
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
  });

  it('should calculate previous month total spend correctly', async () => {
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockResolvedValue({ data: [{ amount: 15000 }, { amount: 20000 }], error: null })
    });

    const res = await fetchPreviousMonthSpend(['wallet-123'], new Date('2026-05-01'));
    expect(res.success).toBe(true);
    expect(res.data).toBe(35000);
  });
});

describe('updateTransactionById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if amount is 0', async () => {
    const res = await updateTransactionById('tx-1', { amount: 0 });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại.');
  });

  it('should return error if amount is negative', async () => {
    const res = await updateTransactionById('tx-1', { amount: -100 });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại.');
  });

  it('should return error if note exceeds 200 characters', async () => {
    const res = await updateTransactionById('tx-1', { note: 'a'.repeat(201) });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Ghi chú không được vượt quá 200 ký tự.');
  });

  it('should allow note to be exactly 200 characters', async () => {
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    });

    const res = await updateTransactionById('tx-1', { amount: 50000, note: 'a'.repeat(200) });
    expect(res.success).toBe(true);
  });

  it('should allow null note (clearing the note)', async () => {
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    });

    const res = await updateTransactionById('tx-1', { note: null });
    expect(res.success).toBe(true);
  });

  it('should call supabase.update with correct payload and return success', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({ update: mockUpdate });

    const payload = { amount: 150000, note: 'Ăn trưa', jar_type: 'NEC' as const };
    const res = await updateTransactionById('tx-abc', payload);

    expect(res.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('transactions');
    expect(mockUpdate).toHaveBeenCalledWith(payload);
    expect(mockEq).toHaveBeenCalledWith('id', 'tx-abc');
  });

  it('should return error message when API call fails', async () => {
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'DB error' } })
      })
    });

    const res = await updateTransactionById('tx-1', { amount: 50000 });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Không thể lưu thay đổi. Vui lòng thử lại.');
  });

  it('should handle network exceptions gracefully', async () => {
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockRejectedValue(new Error('Network error'))
      })
    });

    const res = await updateTransactionById('tx-1', { amount: 50000 });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Không thể lưu thay đổi. Vui lòng thử lại.');
  });
});
