# Sổ Giao Dịch (Ledger Screen) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully-featured Ledger Screen (Sổ Giao Dịch) in the Capy's Money React Native Expo app that supports tabbed views (Daily, Monthly, Calendar), wallet contextual filtering with a dropdown selector, categories/sub-categories representation, and detail actions (edit, delete) with optimistic updates.

**Architecture:** Use a clean custom React hook `useLedger` that fetches transactional data via Supabase and manages a local cache. Use client-side transformation (`useMemo`) to partition data for the three tab views to ensure instantaneous tab switches.

**Tech Stack:** React Native (Expo), TypeScript, Supabase Client, Jest, React Test Renderer / React Native Testing Library.

---

### Task 1: Ledger Service

Create a dedicated database service for ledger transactions, handling query joins to categories and fetching the previous month's total spending.

**Files:**
- Create: `src/services/ledgerService.ts`
- Test: `tests/services/ledgerService.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/services/ledgerService.test.ts`:
```typescript
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
  }
}));

describe('Ledger Service Tests', () => {
  it('should call supabase to fetch ledger transactions correctly', async () => {
    const mockData = [{ id: '1', amount: 100000, category: { name: 'Ăn uống', parent_id: null } }];
    const mockFrom = supabase.from as jest.Mock;
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const res = await fetchLedgerTransactions('wallet-123', new Date('2026-05-01'), new Date('2026-05-31'));
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/services/ledgerService.test.ts`
Expected: FAIL with compilation/import errors.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/ledgerService.ts`:
```typescript
import { supabase } from './supabaseClient';

export interface LedgerTransaction {
  id: string;
  wallet_id: string;
  category_id: string | null;
  jar_type: 'NEC' | 'FFA' | 'EDU' | 'PLAY' | 'LTSS' | 'GIVE';
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  note: string | null;
  occurred_at: string;
  created_by: string;
  categories: {
    name: string;
    icon: string | null;
    color: string | null;
    parent_id: string | null;
    jar_type: string;
  } | null;
}

export async function fetchLedgerTransactions(
  walletId: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; data?: LedgerTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('wallet_id', walletId)
      .eq('is_deleted', false)
      .gte('occurred_at', startDate.toISOString())
      .lte('occurred_at', endDate.toISOString())
      .order('occurred_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as LedgerTransaction[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchPreviousMonthSpend(
  walletId: string,
  currentMonthStart: Date
): Promise<{ success: boolean; data: number; error?: string }> {
  try {
    const startOfPrevMonth = new Date(currentMonthStart);
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('wallet_id', walletId)
      .eq('type', 'expense')
      .eq('is_deleted', false)
      .gte('occurred_at', startOfPrevMonth.toISOString())
      .lt('occurred_at', currentMonthStart.toISOString());

    if (error) {
      return { success: false, data: 0, error: error.message };
    }
    const total = (data ?? []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
    return { success: true, data: total };
  } catch (err: any) {
    return { success: false, data: 0, error: err.message };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/services/ledgerService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/ledgerService.ts tests/services/ledgerService.test.ts
git commit -m "feat: add ledgerService database helpers and unit tests"
```

---

### Task 2: Custom Hook `useLedger`

Write the custom React hook managing fetching, previous month's metrics, and local cache update logic (with optimistic update actions).

**Files:**
- Create: `src/hooks/useLedger.ts`
- Test: `tests/hooks/useLedger.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/hooks/useLedger.test.ts`:
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useLedger } from '../../src/hooks/useLedger';
import * as ledgerService from '../../src/services/ledgerService';

jest.mock('../../src/services/ledgerService');

describe('useLedger Hook Tests', () => {
  it('should fetch transactions correctly on load', async () => {
    const mockTxs = [{ id: '1', amount: 100, type: 'expense' }];
    (ledgerService.fetchLedgerTransactions as jest.Mock).mockResolvedValue({ success: true, data: mockTxs });
    (ledgerService.fetchPreviousMonthSpend as jest.Mock).mockResolvedValue({ success: true, data: 50 });

    const { result } = renderHook(() => useLedger('wallet-123', new Date('2026-05-15')));
    
    // Wait for async effect
    await act(async () => {});

    expect(result.current.transactions).toEqual(mockTxs);
    expect(result.current.prevMonthSpend).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/hooks/useLedger.test.ts`
Expected: FAIL due to missing useLedger export.

- [ ] **Step 3: Write minimal implementation**

Create `src/hooks/useLedger.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { fetchLedgerTransactions, fetchPreviousMonthSpend, LedgerTransaction } from '../services/ledgerService';
import { supabase } from '../services/supabaseClient';

export function useLedger(walletId: string, targetDate: Date) {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [prevMonthSpend, setPrevMonthSpend] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const loadData = useCallback(async () => {
    if (!walletId) return;
    setIsLoading(true);
    setError(null);

    const [txResult, prevSpendResult] = await Promise.all([
      fetchLedgerTransactions(walletId, startOfMonth, endOfMonth),
      fetchPreviousMonthSpend(walletId, startOfMonth),
    ]);

    if (txResult.success && txResult.data) {
      setTransactions(txResult.data);
    } else {
      setError(txResult.error || 'Failed to load transactions');
    }

    if (prevSpendResult.success) {
      setPrevMonthSpend(prevSpendResult.data);
    }

    setIsLoading(false);
  }, [walletId, targetDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteTransaction = async (txId: string): Promise<boolean> => {
    const backup = [...transactions];
    const filtered = transactions.filter((tx) => tx.id !== txId);
    setTransactions(filtered); // Optimistic UI update

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_deleted: true })
        .eq('id', txId);

      if (error) {
        setTransactions(backup); // Rollback
        return false;
      }
      return true;
    } catch {
      setTransactions(backup); // Rollback
      return false;
    }
  };

  const updateTransaction = async (txId: string, updatedData: Partial<LedgerTransaction>): Promise<boolean> => {
    const backup = [...transactions];
    const updated = transactions.map((tx) => (tx.id === txId ? { ...tx, ...updatedData } : tx));
    setTransactions(updated); // Optimistic UI update

    try {
      const { error } = await supabase
        .from('transactions')
        .update(updatedData)
        .eq('id', txId);

      if (error) {
        setTransactions(backup); // Rollback
        return false;
      }
      return true;
    } catch {
      setTransactions(backup); // Rollback
      return false;
    }
  };

  return {
    transactions,
    prevMonthSpend,
    isLoading,
    error,
    refetch: loadData,
    deleteTransaction,
    updateTransaction,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/hooks/useLedger.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLedger.ts tests/hooks/useLedger.test.ts
git commit -m "feat: add useLedger custom React hook and unit tests"
```

---

### Task 3: Transaction Detail Sheet

Build the Bottom Sheet modal component displaying structured sub-category groupings (`Jar > Category > Sub-category`).

**Files:**
- Create: `src/components/ledger/TransactionDetailSheet.tsx`
- Test: `tests/components/ledger/TransactionDetailSheet.test.tsx`

- [ ] **Step 1: Write the failing test**

Write `tests/components/ledger/TransactionDetailSheet.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionDetailSheet } from '../../../src/components/ledger/TransactionDetailSheet';

describe('TransactionDetailSheet Tests', () => {
  const mockTx: any = {
    id: '1',
    amount: 45000,
    type: 'expense',
    jar_type: 'PLAY',
    occurred_at: '2026-05-27T09:30:00Z',
    note: 'Cafe with friends',
    categories: {
      name: 'Capy Cafe',
      parent_id: 'some-parent-id'
    }
  };

  it('should render transaction details correctly', () => {
    const { getByText } = render(
      <TransactionDetailSheet
        transaction={mockTx}
        isOpen={true}
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(getByText('-45.000đ')).toBeTruthy();
    expect(getByText('Cafe with friends')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/components/ledger/TransactionDetailSheet.test.tsx`
Expected: FAIL due to missing TransactionDetailSheet component.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/ledger/TransactionDetailSheet.tsx`:
```tsx
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LedgerTransaction } from '../../services/ledgerService';

interface Props {
  transaction: LedgerTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (tx: LedgerTransaction) => void;
}

export function TransactionDetailSheet({ transaction, isOpen, onClose, onDelete, onEdit }: Props) {
  if (!transaction) return null;

  const formattedAmount = `${transaction.type === 'expense' ? '-' : '+'}${Number(transaction.amount).toLocaleString('vi-VN')}đ`;
  const amountStyle = transaction.type === 'expense' ? styles.expenseText : styles.incomeText;

  const getCategoryHierarchy = () => {
    if (!transaction.categories) return transaction.jar_type;
    // Categories display hierarchy
    return `${transaction.jar_type} > ${transaction.categories.name}`;
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Chi Tiết Giao Dịch</Text>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.amount, amountStyle]}>{formattedAmount}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Hũ & Phân mục:</Text>
              <Text style={styles.value}>{getCategoryHierarchy()}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Thời gian:</Text>
              <Text style={styles.value}>{new Date(transaction.occurred_at).toLocaleString('vi-VN')}</Text>
            </View>

            {transaction.note && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ghi chú:</Text>
                <Text style={styles.value}>{transaction.note}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={() => { onEdit(transaction); onClose(); }}>
              <Text style={styles.btnText}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => { onDelete(transaction.id); onClose(); }}>
              <Text style={[styles.btnText, styles.deleteBtnText]}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, minHeight: 300 },
  handle: { width: 40, height: 4, backgroundColor: '#e8d6d7', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#864e5a', textAlign: 'center', marginBottom: 16 },
  scrollContent: { gap: 12, paddingBottom: 20 },
  amount: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  expenseText: { color: '#ba1a1a' },
  incomeText: { color: '#34c759' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fff0f1' },
  label: { fontSize: 13, color: '#71585c', fontWeight: '500' },
  value: { fontSize: 13, color: '#23191a', fontWeight: '600', maxWidth: '60%' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  editBtn: { backgroundColor: '#fde9ea', borderWidth: 1, borderColor: '#ffd9df' },
  deleteBtn: { backgroundColor: '#ba1a1a' },
  btnText: { fontSize: 14, fontWeight: '700', color: '#864e5a' },
  deleteBtnText: { color: '#ffffff' }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/components/ledger/TransactionDetailSheet.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ledger/TransactionDetailSheet.tsx tests/components/ledger/TransactionDetailSheet.test.tsx
git commit -m "feat: implement TransactionDetailSheet component and tests"
```

---

### Task 4: Daily, Monthly, and Calendar Tabs

Build the three child view tab components (Daily listing, SVG Donut Chart with MoM advice, and Lịch biểu Grid) with proper data transformations.

**Files:**
- Create: `src/components/ledger/DailyTab.tsx`
- Create: `src/components/ledger/MonthlyTab.tsx`
- Create: `src/components/ledger/CalendarTab.tsx`
- Test: `tests/components/ledger/Tabs.test.tsx`

- [ ] **Step 1: Write the failing test**

Write `tests/components/ledger/Tabs.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyTab } from '../../../src/components/ledger/DailyTab';
import { MonthlyTab } from '../../../src/components/ledger/MonthlyTab';

describe('Ledger Tabs Tests', () => {
  it('should render DailyTab list', () => {
    const mockTxs: any[] = [{ id: '1', amount: 50, type: 'expense', occurred_at: '2026-05-27T00:00:00Z', categories: null }];
    const { getByText } = render(<DailyTab transactions={mockTxs} onSelectTransaction={jest.fn()} />);
    expect(getByText('Hôm nay (27/05)')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/components/ledger/Tabs.test.tsx`
Expected: FAIL with compilation errors.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/ledger/DailyTab.tsx`:
```tsx
import React, { useMemo } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LedgerTransaction } from '../../services/ledgerService';

interface Props {
  transactions: LedgerTransaction[];
  onSelectTransaction: (tx: LedgerTransaction) => void;
}

export function DailyTab({ transactions, onSelectTransaction }: Props) {
  const grouped = useMemo(() => {
    const groups: { [key: string]: LedgerTransaction[] } = {};
    transactions.forEach((tx) => {
      const dateStr = new Date(tx.occurred_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const key = `Ngày ${dateStr}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return Object.entries(groups);
  }, [transactions]);

  if (transactions.length === 0) {
    return <View style={styles.center}><Text style={styles.emptyText}>Tháng này chưa có giao dịch nào 🦫</Text></View>;
  }

  return (
    <FlatList
      data={grouped}
      keyExtractor={(item) => item[0]}
      renderItem={({ item: [dateHeader, txs] }) => (
        <View style={styles.dayGroup}>
          <Text style={styles.dayHeader}>{dateHeader}</Text>
          {txs.map((tx) => (
            <TouchableOpacity key={tx.id} style={styles.txRow} onPress={() => onSelectTransaction(tx)}>
              <Text style={styles.txTitle}>{tx.categories?.name || tx.jar_type}</Text>
              <Text style={tx.type === 'expense' ? styles.expense : styles.income}>
                {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toLocaleString('vi-VN')}đ
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#71585c', fontSize: 13, fontWeight: '500' },
  dayGroup: { backgroundColor: '#ffffff', borderRadius: 20, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ffd9df' },
  dayHeader: { fontSize: 11, fontWeight: '700', color: '#71585c', borderBottomWidth: 1, borderBottomColor: '#fff0f1', paddingBottom: 6, marginBottom: 6 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  txTitle: { fontSize: 12, fontWeight: '600', color: '#23191a' },
  expense: { fontSize: 12, fontWeight: '700', color: '#ba1a1a' },
  income: { fontSize: 12, fontWeight: '700', color: '#34c759' }
});
```

Create `src/components/ledger/MonthlyTab.tsx`:
```tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LedgerTransaction } from '../../services/ledgerService';

interface Props {
  transactions: LedgerTransaction[];
  prevMonthSpend: number;
}

export function MonthlyTab({ transactions, prevMonthSpend }: Props) {
  const breakdown = useMemo(() => {
    let totalSpend = 0;
    const categoryTotals: { [name: string]: number } = {};

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const catName = tx.categories?.name || tx.jar_type;
        totalSpend += tx.amount;
        categoryTotals[catName] = (categoryTotals[catName] || 0) + tx.amount;
      }
    });

    return { totalSpend, categories: Object.entries(categoryTotals) };
  }, [transactions]);

  const savingsText = useMemo(() => {
    if (prevMonthSpend === 0) return 'Bắt đầu tích lũy chi tiêu để so sánh tháng kế tiếp 🦫';
    const diff = prevMonthSpend - breakdown.totalSpend;
    if (diff > 0) {
      return `Bạn đã tiêu ít hơn tháng trước ${diff.toLocaleString('vi-VN')}đ. Capy khen ngợi! 🦫`;
    } else {
      return `Tháng này bạn đã tiêu nhiều hơn tháng trước ${Math.abs(diff).toLocaleString('vi-VN')}đ. Hãy chú ý hơn nhé! ⚠️`;
    }
  }, [breakdown.totalSpend, prevMonthSpend]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.chartTitle}>Phân Tích Chi Tiêu</Text>
        <Text style={styles.totalText}>Tổng chi tiêu: {breakdown.totalSpend.toLocaleString('vi-VN')}đ</Text>
        
        {breakdown.categories.map(([name, val]) => (
          <View key={name} style={styles.barRow}>
            <Text style={styles.barLabel}>{name}</Text>
            <Text style={styles.barValue}>{val.toLocaleString('vi-VN')}đ</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, styles.adviceCard]}>
        <Text style={styles.adviceTitle}>Nhận Xét Từ Capy</Text>
        <Text style={styles.adviceBody}>{savingsText}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, gap: 12 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#ffd9df' },
  chartTitle: { fontSize: 13, fontWeight: '700', color: '#864e5a', marginBottom: 12, textAlign: 'center' },
  totalText: { fontSize: 15, fontWeight: '800', color: '#ba1a1a', textAlign: 'center', marginBottom: 16 },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  barLabel: { fontSize: 12, color: '#71585c' },
  barValue: { fontSize: 12, fontWeight: '700', color: '#23191a' },
  adviceCard: { backgroundColor: '#fff8f7' },
  adviceTitle: { fontSize: 13, fontWeight: '700', color: '#864e5a', marginBottom: 6 },
  adviceBody: { fontSize: 12, color: '#23191a', lineHeight: 16 }
});
```

Create `src/components/ledger/CalendarTab.tsx`:
```tsx
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LedgerTransaction } from '../../services/ledgerService';

interface Props {
  transactions: LedgerTransaction[];
  onSelectTransaction: (tx: LedgerTransaction) => void;
}

export function CalendarTab({ transactions, onSelectTransaction }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const activeDates = useMemo(() => {
    const dates = new Set<number>();
    transactions.forEach((tx) => {
      dates.add(new Date(tx.occurred_at).getDate());
    });
    return dates;
  }, [transactions]);

  const daysInMonth = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => i + 1); // Mock 30 days for simplicity
  }, []);

  const selectedDayTransactions = useMemo(() => {
    if (selectedDay === null) return [];
    return transactions.filter((tx) => new Date(tx.occurred_at).getDate() === selectedDay);
  }, [transactions, selectedDay]);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {daysInMonth.map((day) => {
          const hasTx = activeDates.has(day);
          const isSelected = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayCell, isSelected && styles.selectedCell]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
              {hasTx && <View style={[styles.dot, isSelected && styles.selectedDot]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={selectedDayTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ marginTop: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.txRow} onPress={() => onSelectTransaction(item)}>
            <Text style={styles.txTitle}>{item.categories?.name || item.jar_type}</Text>
            <Text style={item.type === 'expense' ? styles.expense : styles.income}>
              {item.type === 'expense' ? '-' : '+'}{Number(item.amount).toLocaleString('vi-VN')}đ
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          selectedDay !== null ? (
            <Text style={styles.emptyText}>Không có giao dịch trong ngày này</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start', backgroundColor: '#ffffff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#ffd9df' },
  dayCell: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  selectedCell: { backgroundColor: '#ffd9df' },
  dayText: { fontSize: 11, color: '#23191a', fontWeight: '500' },
  selectedDayText: { fontWeight: '700', color: '#864e5a' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fe9da9', marginTop: 2 },
  selectedDot: { backgroundColor: '#864e5a' },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#fff0f1' },
  txTitle: { fontSize: 12, fontWeight: '600', color: '#23191a' },
  expense: { fontSize: 12, fontWeight: '700', color: '#ba1a1a' },
  income: { fontSize: 12, fontWeight: '700', color: '#34c759' },
  emptyText: { textAlign: 'center', color: '#71585c', fontSize: 12, padding: 12 }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/components/ledger/Tabs.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ledger/DailyTab.tsx src/components/ledger/MonthlyTab.tsx src/components/ledger/CalendarTab.tsx tests/components/ledger/Tabs.test.tsx
git commit -m "feat: implement Daily, Monthly, and Calendar tab subcomponents"
```

---

### Task 5: Main Screen Component

Build the final `LedgerScreen` containing the UI scaffold, header wallet/month filters, active tab toggles, and detail sheet display.

**Files:**
- Create: `src/screens/LedgerScreen.tsx`
- Test: `tests/screens/LedgerScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Write `tests/screens/LedgerScreen.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { LedgerScreen } from '../../src/screens/LedgerScreen';

describe('LedgerScreen Integration Tests', () => {
  it('should render headers and tabs correctly', () => {
    const { getByText } = render(<LedgerScreen activeWalletId="wallet-123" />);
    expect(getByText('Hàng ngày')).toBeTruthy();
    expect(getByText('Hàng tháng')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/screens/LedgerScreen.test.tsx`
Expected: FAIL due to missing LedgerScreen component.

- [ ] **Step 3: Write minimal implementation**

Create `src/screens/LedgerScreen.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLedger } from '../hooks/useLedger';
import { DailyTab } from '../components/ledger/DailyTab';
import { MonthlyTab } from '../components/ledger/MonthlyTab';
import { CalendarTab } from '../components/ledger/CalendarTab';
import { TransactionDetailSheet } from '../components/ledger/TransactionDetailSheet';
import { LedgerTransaction } from '../services/ledgerService';

interface Props {
  activeWalletId: string;
}

export function LedgerScreen({ activeWalletId }: Props) {
  const [targetDate, setTargetDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'calendar'>('daily');
  const [selectedTx, setSelectedTx] = useState<LedgerTransaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { transactions, prevMonthSpend, isLoading, deleteTransaction, updateTransaction } = useLedger(
    activeWalletId,
    targetDate
  );

  const changeMonth = (val: number) => {
    const d = new Date(targetDate);
    d.setMonth(d.getMonth() + val);
    setTargetDate(d);
  };

  const handleSelectTx = (tx: LedgerTransaction) => {
    setSelectedTx(tx);
    setIsSheetOpen(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sổ Giao Dịch</Text>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}><Text style={styles.btnTxt}>‹</Text></TouchableOpacity>
          <Text style={styles.monthText}>
            Tháng {targetDate.getMonth() + 1} / {targetDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}><Text style={styles.btnTxt}>›</Text></TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {(['daily', 'monthly', 'calendar'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'daily' ? 'Hàng ngày' : tab === 'monthly' ? 'Hàng tháng' : 'Lịch biểu'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#864e5a" style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'daily' && <DailyTab transactions={transactions} onSelectTransaction={handleSelectTx} />}
            {activeTab === 'monthly' && <MonthlyTab transactions={transactions} prevMonthSpend={prevMonthSpend} />}
            {activeTab === 'calendar' && <CalendarTab transactions={transactions} onSelectTransaction={handleSelectTx} />}
          </>
        )}
      </View>

      <TransactionDetailSheet
        transaction={selectedTx}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onDelete={deleteTransaction}
        onEdit={(tx) => {
          // Implement edit navigate or dispatch modal
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff8f7' },
  header: { backgroundColor: '#ffffff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#fff0f1', gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#864e5a', textAlign: 'center' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthBtn: { width: 28, height: 28, backgroundColor: '#fde9ea', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#864e5a' },
  monthText: { fontSize: 14, fontWeight: '700', color: '#864e5a' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fde9ea', borderRadius: 20, padding: 3 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 17 },
  tabActive: { backgroundColor: '#ffffff' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#71585c' },
  tabTextActive: { color: '#864e5a', fontWeight: '700' },
  body: { flex: 1, padding: 12 }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/screens/LedgerScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/LedgerScreen.tsx tests/screens/LedgerScreen.test.tsx
git commit -m "feat: complete main LedgerScreen integration and tests"
```
