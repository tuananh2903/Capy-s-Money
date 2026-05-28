import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';

interface CategoryItem {
  id?: string;
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
    categories: CategoryItem[];
  };
  onSave: (data: { name: string; icon: string; pct: number; categories: CategoryItem[] }) => void;
}

export const JarEditSheet: React.FC<JarEditSheetProps> = ({ visible, onClose, jarData, onSave }) => {
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
    setCategories([...categories, { name: 'Hạng mục mới', limit: 500000 }]);
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
              <Text style={styles.label}>Tỷ lệ phân bổ: {pct}%</Text>
              <View style={styles.pctButtonsRow}>
                <TouchableOpacity onPress={decreasePct} style={styles.pctBtn}><Text style={styles.pctBtnText}>-5%</Text></TouchableOpacity>
                <TouchableOpacity onPress={increasePct} style={styles.pctBtn}><Text style={styles.pctBtnText}>+5%</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.categorySection}>
              <View style={styles.catHeader}>
                <Text style={styles.label}>Hạng mục con</Text>
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
                    onChangeText={(val) => updateCategory(idx, 'limit', parseInt(val) || 0)}
                    placeholder="Hạn mức"
                  />
                  <TouchableOpacity onPress={() => deleteCategory(idx)}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={() => onSave({ name, icon, pct, categories })}>
            <Text style={styles.saveText}>Lưu Cấu Hình</Text>
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
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }
});
