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

  const { transactions, prevMonthSpend, isLoading, deleteTransaction } = useLedger(
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
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
            <Text style={styles.btnTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            Tháng {targetDate.getMonth() + 1} / {targetDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
            <Text style={styles.btnTxt}>›</Text>
          </TouchableOpacity>
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
          // Edit navigation trigger placeholders
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
