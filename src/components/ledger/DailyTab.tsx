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
      const date = new Date(tx.occurred_at);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `Ngày ${day}/${month}`;
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
