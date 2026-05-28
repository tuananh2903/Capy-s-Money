# Budget Screen & Jar Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the budget dashboard and configuration screen based on the 6-jar model, allowing per-wallet budget scoping, top-down allocation percentages, category-level budgets, and a 3-alert limit for free tier users.

**Architecture:** Scoped to each wallet, Jars and Category budgets will read/write from Supabase. Offline-first synchronization is supported via WatermelonDB models mapping to the Supabase schemas. PostgreSQL triggers will enforce the 3-alert limit on the DB level, and matching UI logic will enforce it on the app level.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, Supabase, WatermelonDB, Jest.

---

### Task 1: Database Migration & Triggers

**Files:**
- Create: `supabase/migrations/20260528000000_add_budget_alerts_gating.sql`
- Test: Run migration against Supabase local instance

- [ ] **Step 1: Create SQL migration file**
Create the migration file `supabase/migrations/20260528000000_add_budget_alerts_gating.sql` adding the alert fields and the freemium gating trigger:

```sql
-- Add enable_alerts to public.jars
ALTER TABLE public.jars 
ADD COLUMN IF NOT EXISTS enable_alerts BOOLEAN NOT NULL DEFAULT FALSE;

-- Add enable_alerts to public.budgets
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS enable_alerts BOOLEAN NOT NULL DEFAULT FALSE;

-- Trigger to enforce maximum 3 active alerts for free users
CREATE OR REPLACE FUNCTION public.check_premium_alert_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier TEXT;
  v_user_id UUID;
  v_active_jar_alerts INT := 0;
  v_active_category_alerts INT := 0;
BEGIN
  -- Resolve the user ID invoking the database action
  v_user_id := auth.uid();
  
  -- Resolve user subscription tier
  SELECT tier INTO v_tier FROM public.profiles WHERE id = v_user_id;
  
  IF v_tier = 'free' THEN
    -- Count enabled alerts on Jars
    SELECT COUNT(*) INTO v_active_jar_alerts
    FROM public.jars j
    JOIN public.wallets w ON j.wallet_id = w.id
    WHERE w.created_by = v_user_id AND j.enable_alerts = TRUE;

    -- Count enabled alerts on Category Budgets
    SELECT COUNT(*) INTO v_active_category_alerts
    FROM public.budgets b
    WHERE b.created_by = v_user_id AND b.enable_alerts = TRUE;

    -- Raise exception if user exceeds 3 active alerts
    IF (v_active_jar_alerts + v_active_category_alerts) > 3 THEN
      RAISE EXCEPTION 'Free tier users are limited to a maximum of 3 active budget alerts.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to jars table
DROP TRIGGER IF EXISTS trg_check_jars_alert_limit ON public.jars;
CREATE TRIGGER trg_check_jars_alert_limit
  AFTER INSERT OR UPDATE OF enable_alerts ON public.jars
  FOR EACH ROW
  WHEN (NEW.enable_alerts = TRUE)
  EXECUTE FUNCTION public.check_premium_alert_limit();

-- Bind trigger to budgets table
DROP TRIGGER IF EXISTS trg_check_budgets_alert_limit ON public.budgets;
CREATE TRIGGER trg_check_budgets_alert_limit
  AFTER INSERT OR UPDATE OF enable_alerts ON public.budgets
  FOR EACH ROW
  WHEN (NEW.enable_alerts = TRUE)
  EXECUTE FUNCTION public.check_premium_alert_limit();
```

- [ ] **Step 2: Apply migration to Supabase**
Run command:
`npx supabase db push`
Expected: Migration executes successfully.

- [ ] **Step 3: Commit migration**
Run:
`git add supabase/migrations/20260528000000_add_budget_alerts_gating.sql`
`git commit -m "migration: add enable_alerts and check_premium_alert_limit trigger"`

---

### Task 2: Update TypeScript Types & Offline DB Schema

**Files:**
- Modify: `src/types/database.types.ts`
- Modify: `src/models/Jar.ts`
- Modify: `src/models/Budget.ts`

- [ ] **Step 1: Generate database types**
Run command:
`npx supabase gen types typescript --local > src/types/database.types.ts`
Expected: File `src/types/database.types.ts` updated with `enable_alerts` columns.

- [ ] **Step 2: Update WatermelonDB local models**
Modify model files in `src/models/` to recognize the `enable_alerts` boolean property.

Modify `src/models/Jar.ts` schema and model:
```typescript
// Add enableAlerts property to Jar model
import { field } from '@nozbe/watermelondb/decorators'
// inside Jar class:
@field('enable_alerts') enableAlerts!: boolean
```

Modify `src/models/Budget.ts` schema and model:
```typescript
// Add enableAlerts property to Budget model
import { field } from '@nozbe/watermelondb/decorators'
// inside Budget class:
@field('enable_alerts') enableAlerts!: boolean
```

- [ ] **Step 3: Run Jest tests to check model validation**
Run command:
`npm run test -- tests/models`
Expected: All tests pass.

- [ ] **Step 4: Commit schema changes**
Run:
`git add src/types/database.types.ts src/models/Jar.ts src/models/Budget.ts`
`git commit -m "chore: update types and watermelondb models for budget alerts"`

---

### Task 3: Implement Budget UI Components

**Files:**
- Create: `src/components/budget/WalletTabBar.tsx`
- Create: `src/components/budget/JarCard.tsx`
- Create: `src/components/budget/PremiumModal.tsx`

- [ ] **Step 1: Create WalletTabBar component**
Create `src/components/budget/WalletTabBar.tsx`:
```tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Wallet {
  id: string;
  name: string;
}

interface WalletTabBarProps {
  wallets: Wallet[];
  activeWalletId: string;
  onChangeWallet: (id: string) => void;
}

export const WalletTabBar: React.FC<WalletTabBarProps> = ({ wallets, activeWalletId, onChangeWallet }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {wallets.map((wallet) => (
        <TouchableOpacity
          key={wallet.id}
          style={[styles.tab, activeWalletId === wallet.id && styles.activeTab]}
          onPress={() => onChangeWallet(wallet.id)}
        >
          <Text style={[styles.tabText, activeWalletId === wallet.id && styles.activeTabText]}>
            {wallet.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginVertical: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 9999, borderWidth: 1, borderColor: '#FFDDE2', marginRight: 8, backgroundColor: '#fff' },
  activeTab: { backgroundColor: '#864e5a', borderColor: '#864e5a' },
  tabText: { fontSize: 13, color: '#837375', fontFamily: 'Plus Jakarta Sans' },
  activeTabText: { color: '#fff', fontWeight: 'bold' }
});
```

- [ ] **Step 2: Create JarCard component**
Create `src/components/budget/JarCard.tsx` displaying the Progress Bar and alert toggles:
```tsx
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
          {categories.map(cat => (
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
          ))}
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
  right: { alignItems: 'end', flexDirection: 'row', gap: 8 },
  limit: { fontSize: 13, fontWeight: 'bold', color: '#864e5a', marginRight: 4 },
  barBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#fff2f4', paddingTop: 6 },
  actionBtn: { padding: 4, borderRadius: 9999, backgroundColor: '#fff8f7' },
  actionText: { fontSize: 12 },
  categoryList: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#ffd5db', borderStyle: 'dashed', paddingTop: 8 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  catName: { fontSize: 11, color: '#4b5563' },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catLimit: { fontSize: 11, fontWeight: 'bold' }
});
```

- [ ] **Step 3: Create PremiumModal component**
Create `src/components/budget/PremiumModal.tsx`:
```tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.capy}>🦫✨</Text>
          <Text style={styles.title}>Giới Hạn Cảnh Báo Free</Text>
          <Text style={styles.desc}>
            Tài khoản Free chỉ được bật tối đa 3 cảnh báo ngân sách. Hãy nâng cấp Premium để bật cảnh báo không giới hạn cho mọi mục chi tiêu!
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => alert('Premium update!')}>
            <Text style={styles.btnText}>Nâng Cấp Premium (12k/tháng)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Để sau</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(35, 25, 26, 0.4)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 28, padding: 24, width: 280, alignItems: 'center' },
  capy: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#864e5a', marginBottom: 8 },
  desc: { fontSize: 12, color: '#837375', textAlign: 'center', marginBottom: 16, lineHeight: 1.4 },
  btn: { backgroundColor: '#864e5a', borderRadius: 9999, paddingVertical: 10, paddingHorizontal: 20, width: '100%', alignItems: 'center', marginBottom: 8 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  closeBtn: { marginTop: 4 },
  closeText: { fontSize: 11, color: '#837375' }
});
```

- [ ] **Step 4: Commit new components**
Run:
`git add src/components/budget/WalletTabBar.tsx src/components/budget/JarCard.tsx src/components/budget/PremiumModal.tsx`
`git commit -m "feat: implement budget UI components"`

---

### Task 4: Budget & Jar Setup Sheets

**Files:**
- Create: `src/components/budget/JarEditSheet.tsx`

- [ ] **Step 1: Create JarEditSheet component**
Create bottom sheet component `src/components/budget/JarEditSheet.tsx` to handle Jar fields and its child categories CRUD list:
```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Slider, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';

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
  const [name, setName] = useState(jarData?.name || '');
  const [icon, setIcon] = useState(jarData?.icon || '🍔');
  const [pct, setPct] = useState(jarData?.pct || 10);
  const [categories, setCategories] = useState<CategoryItem[]>(jarData?.categories || []);

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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Cấu hình Hũ</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 350 }}>
            <View style={styles.group}>
              <Text style={styles.label}>Tên hũ</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />
            </View>
            <View style={styles.group}>
              <Text style={styles.label}>Icon (Emoji)</Text>
              <TextInput style={styles.input} value={icon} onChangeText={setIcon} />
            </View>
            <View style={styles.group}>
              <Text style={styles.label}>Tỷ lệ phân bổ (%): {pct}%</Text>
              <Slider
                value={pct}
                onValueChange={(val) => setPct(Math.round(val))}
                minimumValue={0}
                maximumValue={100}
                step={5}
                minimumTrackTintColor="#864e5a"
              />
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
                  />
                  <TextInput
                    style={[styles.input, { width: 100, marginRight: 8 }]}
                    keyboardType="numeric"
                    value={cat.limit.toString()}
                    onChangeText={(val) => updateCategory(idx, 'limit', parseInt(val) || 0)}
                  />
                  <TouchableOpacity onPress={() => deleteCategory(idx)}>
                    <Text style={{ fontSize: 16 }}>🗑️</Text>
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
  title: { fontSize: 15, fontWeight: 'bold', color: '#864e5a' },
  close: { fontSize: 16, color: '#837375' },
  group: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#837375', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#FFDDE2', borderRadius: 12, padding: 8, fontSize: 12 },
  categorySection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#ffd5db', paddingTop: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addBtn: { backgroundColor: '#ffb7c5', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 9999 },
  addText: { fontSize: 9, color: '#864e5a', fontWeight: 'bold' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  saveBtn: { backgroundColor: '#864e5a', borderRadius: 9999, padding: 12, alignItems: 'center', marginTop: 16 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 12 }
});
```

- [ ] **Step 2: Commit setup sheet**
Run:
`git add src/components/budget/JarEditSheet.tsx`
`git commit -m "feat: implement JarEditSheet bottom sheet component"`

---

### Task 5: Budget Screen & Integration

**Files:**
- Create: `src/screens/BudgetScreen.tsx`
- Modify: Navigation config files (like `src/app/(tabs)/_layout.tsx` or similar routing entry)

- [ ] **Step 1: Build the primary BudgetScreen**
Create `src/screens/BudgetScreen.tsx` integrating all modules, state, validation for 3-alert limit:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { WalletTabBar } from '../components/budget/WalletTabBar';
import { JarCard } from '../components/budget/JarCard';
import { JarEditSheet } from '../components/budget/JarEditSheet';
import { PremiumModal } from '../components/budget/PremiumModal';

export default function BudgetScreen() {
  const [wallets, setWallets] = useState([{ id: '1', name: 'Ví Cá nhân' }, { id: '2', name: 'Ví Gia đình' }]);
  const [activeWalletId, setActiveWalletId] = useState('1');
  const [totalBudget, setTotalBudget] = useState(10000000);
  const [jars, setJars] = useState<any[]>([]);
  const [editingJarIndex, setEditingJarIndex] = useState<number | null>(null);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);

  // Mock initial jars loading
  useEffect(() => {
    setJars([
      { id: 'j1', name: 'Thiết yếu (NEC)', icon: '🍔', pct: 55, spent: 3400000, enableAlerts: true, categories: [
        { id: 'c1', name: 'Ăn uống', amountLimit: 3000000, enableAlerts: true },
        { id: 'c2', name: 'Điện nước', amountLimit: 1500000, enableAlerts: false }
      ]}
    ]);
  }, [activeWalletId]);

  const getAlertCount = () => {
    let count = 0;
    jars.forEach(j => {
      if (j.enableAlerts) count++;
      j.categories.forEach((c: any) => {
        if (c.enableAlerts) count++;
      });
    });
    return count;
  };

  const handleToggleAlert = (type: 'jar' | 'category', id: string, value: boolean) => {
    const currentCount = getAlertCount();
    if (value && currentCount >= 3) {
      setIsPremiumModalVisible(true);
      return;
    }

    const updated = jars.map(j => {
      if (type === 'jar' && j.id === id) {
        return { ...j, enableAlerts: value };
      }
      if (type === 'category') {
        const cats = j.categories.map((c: any) => {
          if (c.id === id) return { ...c, enableAlerts: value };
          return c;
        });
        return { ...j, categories: cats };
      }
      return j;
    });
    setJars(updated);
  };

  const totalAllocation = jars.reduce((sum, j) => sum + j.pct, 0);

  return (
    <View style={styles.container}>
      <WalletTabBar wallets={wallets} activeWalletId={activeWalletId} onChangeWallet={setActiveWalletId} />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.budgetCard}>
          <Text style={styles.cardTitle}>Tổng ngân sách ví</Text>
          <Text style={styles.amount}>{totalBudget.toLocaleString()}đ</Text>
          <Text style={[styles.status, totalAllocation !== 100 && styles.error]}>
            Tổng phân bổ: {totalAllocation}% {totalAllocation === 100 ? '(Hợp lệ)' : '(Phải bằng 100%)'}
          </Text>
        </View>

        {jars.map((jar, idx) => (
          <JarCard
            key={jar.id}
            jar={{ ...jar, limit: totalBudget * (jar.pct / 100) }}
            categories={jar.categories}
            onToggleAlert={handleToggleAlert}
            onEditJar={() => {
              setEditingJarIndex(idx);
              setIsEditSheetVisible(true);
            }}
            onDeleteJar={() => {
              Alert.alert('Xác nhận', 'Bạn muốn xóa hũ này?', [
                { text: 'Hủy' },
                { text: 'Xóa', onPress: () => setJars(jars.filter((_, i) => i !== idx)) }
              ]);
            }}
          />
        ))}
      </ScrollView>

      {isEditSheetVisible && (
        <JarEditSheet
          visible={isEditSheetVisible}
          onClose={() => setIsEditSheetVisible(false)}
          jarData={editingJarIndex !== null ? jars[editingJarIndex] : undefined}
          onSave={(data) => {
            const updated = [...jars];
            if (editingJarIndex !== null) {
              updated[editingJarIndex] = { ...updated[editingJarIndex], ...data };
            }
            setJars(updated);
            setIsEditSheetVisible(false);
          }}
        />
      )}

      <PremiumModal visible={isPremiumModalVisible} onClose={() => setIsPremiumModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff8f7', paddingHorizontal: 16 },
  scroll: { paddingBottom: 24 },
  budgetCard: { backgroundColor: 'white', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFDDE2' },
  cardTitle: { fontSize: 11, color: '#837375', textTransform: 'uppercase', fontWeight: 'bold' },
  amount: { fontSize: 24, fontWeight: 'bold', color: '#864e5a', marginVertical: 4 },
  status: { fontSize: 10, color: '#10b981', fontWeight: 'bold' },
  error: { color: '#ba1a1a' }
});
```

- [ ] **Step 2: Add Budget Screen route to tabs layout**
Configure route in routing layout file `src/app/(tabs)/_layout.tsx` to display the Budget Screen tab in navigation.

- [ ] **Step 3: Commit integration**
Run:
`git add src/screens/BudgetScreen.tsx src/app/\(tabs\)/_layout.tsx`
`git commit -m "feat: complete BudgetScreen integration and tab layout routing"`
