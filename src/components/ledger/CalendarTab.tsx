import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LedgerTransaction } from '../../services/ledgerService';

interface Props {
  transactions: LedgerTransaction[];
  onSelectTransaction: (tx: LedgerTransaction) => void;
  targetDate: Date;
}

export function CalendarTab({ transactions, onSelectTransaction, targetDate }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    const today = new Date();
    if (targetDate.getMonth() === today.getMonth() && targetDate.getFullYear() === today.getFullYear()) {
      return today.getDate();
    }
    return 1;
  });

  useEffect(() => {
    const today = new Date();
    if (targetDate.getMonth() === today.getMonth() && targetDate.getFullYear() === today.getFullYear()) {
      setSelectedDay(today.getDate());
    } else {
      setSelectedDay(1);
    }
  }, [targetDate]);

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
