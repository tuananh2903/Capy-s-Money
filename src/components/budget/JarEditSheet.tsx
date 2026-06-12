import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';

interface CategoryItem {
  id?: string;
  category_id?: string;
  name: string;
  limit: number;
}

interface JarEditSheetProps {
  visible: boolean;
  onClose: () => void;
  jarData?: {
    name: string;
    icon: string;
    pct: number;
    totalBudget: number;
    categories: CategoryItem[];
  };
  onSave: (data: { name: string; icon: string; pct: number; categories: CategoryItem[] }) => void;
  isSaving?: boolean;
}

export const JarEditSheet: React.FC<JarEditSheetProps> = ({ visible, onClose, jarData, onSave, isSaving = false }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍔');
  const [pct, setPct] = useState(10);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    if (jarData) {
      setName(jarData.name);
      setIcon(jarData.icon);
      setPct(jarData.pct);
      setCategories(jarData.categories || []);
    } else {
      setName('');
      setIcon('🍔');
      setPct(10);
      setCategories([]);
    }
  }, [jarData, visible]);

  const addCategory = () => {
    setCategories([...categories, { name: 'Hạng mục mới', limit: 0 }]);
  };

  const deleteCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, key: 'name' | 'limit', val: string | number) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [key]: val };
    setCategories(updated);
  };

  const decreasePct = () => {
    setPct(prev => Math.max(prev - 5, 0));
  };

  const increasePct = () => {
    setPct(prev => Math.min(prev + 5, 100));
  };

  // Calculate current jar limit based on totalBudget and percentage
  const totalBudgetVal = jarData?.totalBudget || 0;
  const jarLimit = Math.round(totalBudgetVal * (pct / 100));

  // Sum of subcategory limits
  const subcategoriesTotal = categories.reduce((sum, cat) => sum + Math.round(cat.limit || 0), 0);
  
  // Validation flag
  const isValidationError = categories.length > 0 && Math.round(subcategoriesTotal) !== Math.round(jarLimit);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{jarData ? 'Chỉnh sửa Hũ' : 'Thêm Hũ Mới'}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }}>
            <View style={styles.group}>
              <Text style={styles.label}>Tên hũ</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ví dụ: Thiết yếu (NEC)" />
            </View>
            <View style={styles.group}>
              <Text style={styles.label}>Icon (Emoji)</Text>
              <TextInput style={styles.input} value={icon} onChangeText={setIcon} placeholder="🍔" />
            </View>
            <View style={styles.group}>
              <Text style={styles.label}>Tỷ lệ phân bổ: {pct}% (Hạn mức hũ: {jarLimit.toLocaleString('vi-VN')}đ)</Text>
              <View style={styles.pctButtonsRow}>
                <TouchableOpacity onPress={decreasePct} style={styles.pctBtn}><Text style={styles.pctBtnText}>-5%</Text></TouchableOpacity>
                <TouchableOpacity onPress={increasePct} style={styles.pctBtn}><Text style={styles.pctBtnText}>+5%</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.categorySection}>
              <View style={styles.catHeader}>
                <View>
                  <Text style={styles.label}>Hạng mục con</Text>
                  {categories.length > 0 && (
                    <Text style={[styles.catTotalLabel, isValidationError && { color: '#ba1a1a' }]}>
                      Tổng phân bổ: {subcategoriesTotal.toLocaleString('vi-VN')}đ / {jarLimit.toLocaleString('vi-VN')}đ
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={addCategory} style={styles.addBtn}><Text style={styles.addText}>+ Thêm</Text></TouchableOpacity>
              </View>

              {categories.map((cat, idx) => (
                <View key={idx} style={styles.catRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    value={cat.name}
                    onChangeText={(val) => updateCategory(idx, 'name', val)}
                    placeholder="Tên danh mục"
                  />
                  <TextInput
                    style={[styles.input, { width: 100, marginRight: 8 }]}
                    keyboardType="numeric"
                    value={cat.limit.toString()}
                    onChangeText={(val) => {
                      const cleanVal = val.replace(/[^0-9]/g, '');
                      updateCategory(idx, 'limit', parseInt(cleanVal, 10) || 0);
                    }}
                    placeholder="Hạn mức"
                  />
                  <TouchableOpacity onPress={() => deleteCategory(idx)}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          {isValidationError && (
            <Text style={styles.errorText}>
              ⚠️ Tổng hạn mức của các hạng mục con ({subcategoriesTotal.toLocaleString('vi-VN')}đ) phải bằng hạn mức của hũ ({jarLimit.toLocaleString('vi-VN')}đ).
            </Text>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, (isSaving || isValidationError) && { backgroundColor: '#c09aa0' }]}
            onPress={() => !isSaving && !isValidationError && onSave({ name, icon, pct, categories })}
            disabled={isSaving || isValidationError}
          >
            <Text style={styles.saveText}>{isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(35, 25, 26, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#864e5a', fontFamily: 'Plus Jakarta Sans' },
  close: { fontSize: 16, color: '#837375' },
  group: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#837375', marginBottom: 4, fontFamily: 'Plus Jakarta Sans' },
  input: { borderWidth: 1, borderColor: '#FFDDE2', borderRadius: 12, padding: 8, fontSize: 12, color: '#23191a', fontFamily: 'Plus Jakarta Sans' },
  pctButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  pctBtn: { backgroundColor: '#fff8f7', borderWidth: 1, borderColor: '#FFDDE2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 },
  pctBtnText: { fontSize: 12, color: '#864e5a', fontWeight: 'bold', fontFamily: 'Plus Jakarta Sans' },
  categorySection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#ffd5db', paddingTop: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addBtn: { backgroundColor: '#ffb7c5', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 9999 },
  addText: { fontSize: 9, color: '#864e5a', fontWeight: 'bold', fontFamily: 'Plus Jakarta Sans' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  deleteIcon: { fontSize: 16, padding: 4 },
  saveBtn: { backgroundColor: '#864e5a', borderRadius: 9999, padding: 12, alignItems: 'center', marginTop: 16 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: 'Plus Jakarta Sans' },
  catTotalLabel: { fontSize: 10, color: '#10b981', fontWeight: '600', marginTop: 2, fontFamily: 'Plus Jakarta Sans' },
  errorText: { fontSize: 10, color: '#ba1a1a', fontWeight: 'bold', marginTop: 8, fontFamily: 'Plus Jakarta Sans', textAlign: 'center' }
});
