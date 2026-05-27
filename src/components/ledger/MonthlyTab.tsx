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
