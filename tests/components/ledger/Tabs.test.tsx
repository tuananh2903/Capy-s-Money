import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyTab } from '../../../src/components/ledger/DailyTab';
import { MonthlyTab } from '../../../src/components/ledger/MonthlyTab';

describe('Ledger Tabs Tests', () => {
  const mockTxs: any[] = [
    { id: '1', amount: 45000, type: 'expense', occurred_at: '2026-05-27T09:30:00Z', jar_type: 'PLAY', categories: { name: 'Capy Cafe' } }
  ];

  it('should render DailyTab list and group transactions by day', () => {
    const { getByText } = render(
      <DailyTab transactions={mockTxs} onSelectTransaction={jest.fn()} />
    );
    expect(getByText('Ngày 27/05')).toBeTruthy();
    expect(getByText('Capy Cafe')).toBeTruthy();
    expect(getByText('-45.000đ')).toBeTruthy();
  });

  it('should render MonthlyTab with spend breakdowns and Capy recommendations', () => {
    const { getByText } = render(
      <MonthlyTab transactions={mockTxs} prevMonthSpend={60000} />
    );
    expect(getByText('Tổng chi tiêu: 45.000đ')).toBeTruthy();
    expect(getByText('Capy Cafe')).toBeTruthy();
    expect(getByText('Bạn đã tiêu ít hơn tháng trước 15.000đ. Capy khen ngợi! 🦫')).toBeTruthy();
  });
});
