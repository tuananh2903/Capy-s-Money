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
