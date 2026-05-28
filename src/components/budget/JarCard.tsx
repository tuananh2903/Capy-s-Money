import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';

interface CategoryBudget {
  id: string;
  name: string;
  amountLimit: number;
  enableAlerts: boolean;
}

interface JarCardProps {
  jar: {
    id: string;
    type: string;
    name: string;
    icon: string;
    pct: number;
    limit: number;
    spent: number;
    enableAlerts: boolean;
  };
  categories: CategoryBudget[];
  onToggleAlert: (type: 'jar' | 'category', id: string, value: boolean) => void;
  onEditJar: () => void;
  onDeleteJar: () => void;
}

export const JarCard: React.FC<JarCardProps> = ({ jar, categories, onToggleAlert, onEditJar, onDeleteJar }) => {
  const [expanded, setExpanded] = useState(false);
  const pctSpent = jar.limit > 0 ? (jar.spent / jar.limit) * 100 : 0;
  
  let progressColor = '#10b981';
  if (pctSpent >= 100) progressColor = '#ba1a1a';
  else if (pctSpent >= 80) progressColor = '#f59e0b';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.mainRow} onPress={() => setExpanded(!expanded)}>
        <View style={styles.left}>
          <Text style={styles.icon}>{jar.icon}</Text>
          <View>
            <Text style={styles.name}>{jar.name} ({jar.pct}%)</Text>
            <Text style={styles.subtext}>Đã chi: {jar.spent.toLocaleString()}đ</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.limit}>{jar.limit.toLocaleString()}đ</Text>
          <Switch
            value={jar.enableAlerts}
            onValueChange={(val) => onToggleAlert('jar', jar.id, val)}
            trackColor={{ true: '#864e5a' }}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(pctSpent, 100)}%`, backgroundColor: progressColor }]} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEditJar}>
          <Text style={styles.actionText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDeleteJar}>
          <Text style={styles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.categoryList}>
          {categories.length === 0 ? (
            <Text style={styles.noCategories}>Không có danh mục con</Text>
          ) : (
            categories.map(cat => (
              <View key={cat.id} style={styles.catRow}>
                <Text style={styles.catName}>🍔 {cat.name}</Text>
                <View style={styles.catRight}>
                  <Text style={styles.catLimit}>{cat.amountLimit.toLocaleString()}đ</Text>
                  <Switch
                    value={cat.enableAlerts}
                    onValueChange={(val) => onToggleAlert('category', cat.id, val)}
                    trackColor={{ true: '#864e5a' }}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FFDDE2' },
  mainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 24, marginRight: 12 },
  name: { fontSize: 13, fontWeight: 'bold', color: '#23191a' },
  subtext: { fontSize: 10, color: '#837375' },
  right: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  limit: { fontSize: 13, fontWeight: 'bold', color: '#864e5a', marginRight: 4 },
  barBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#fff2f4', paddingTop: 6 },
  actionBtn: { padding: 4, borderRadius: 9999, backgroundColor: '#fff8f7' },
  actionText: { fontSize: 12 },
  categoryList: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#ffd5db', borderStyle: 'dashed', paddingTop: 8 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, alignItems: 'center' },
  catName: { fontSize: 11, color: '#4b5563' },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catLimit: { fontSize: 11, fontWeight: 'bold' },
  noCategories: { fontSize: 10, color: '#837375', textAlign: 'center', paddingVertical: 4 }
});
