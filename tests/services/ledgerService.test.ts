import { fetchLedgerTransactions, fetchPreviousMonthSpend } from '../../src/services/ledgerService';
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
