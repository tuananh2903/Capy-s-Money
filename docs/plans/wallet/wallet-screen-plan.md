# Wallet Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Wallet Screen (tab "Ví") allowing users to view their list of wallets, create new wallets (gated by Free Tier limits), delete/edit wallets, set a wallet as default, manage shared members, and adjust 6-jar allocation percentages.

**Architecture:** Extend `dashboardService` for wallet actions, build clean modular React Native components for sheets (`WalletCreateSheet`, `WalletEditSheet`), create a main `WalletScreen`, and integrate it into `DashboardScreen`'s tab routing.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, Supabase client, Jest (TDD), AsyncStorage.

---

### Task 1: Wallet DB Services & Service Tests

**Files:**
- Modify: [dashboardService.ts](file:///d:/Personal%20projects/Capy's%20Money/src/services/dashboardService.ts)
- Modify: [dashboardService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/dashboardService.test.ts)

- [ ] **Step 1: Write the failing tests for new wallet operations**
  Add mock tests for `createWallet`, `updateWallet`, `deleteWallet`, and `setDefaultWallet` in `tests/services/dashboardService.test.ts`.

  ```typescript
  // Add this inside describe('dashboardService', ...) in tests/services/dashboardService.test.ts:
  describe('createWallet', () => {
    it('should insert a new wallet successfully', async () => {
      const walletData = { name: 'Ví tiết kiệm', type: 'personal', created_by: 'user-1' };
      mockInsert.mockResolvedValue({ data: [{ id: 'w-new', ...walletData }], error: null });
      const res = await createWallet(walletData);
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe('w-new');
      expect(supabase.from).toHaveBeenCalledWith('wallets');
    });
  });

  describe('setDefaultWallet', () => {
    it('should call rpc to set default wallet', async () => {
      const mockRpc = jest.fn().mockResolvedValue({ error: null });
      (supabase as any).rpc = mockRpc;
      const res = await setDefaultWallet('w-1', 'user-1');
      expect(res.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('set_default_wallet', { p_wallet_id: 'w-1', p_user_id: 'user-1' });
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test tests/services/dashboardService.test.ts`
  Expected: FAIL (functions not defined)

- [ ] **Step 3: Implement wallet functions in dashboardService.ts**
  ```typescript
  export async function createWallet(walletData: any): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert(walletData)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: data as Wallet };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng.' };
    }
  }

  export async function updateWallet(walletId: string, walletData: Partial<Wallet>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('wallets')
        .update(walletData)
        .eq('id', walletId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng.' };
    }
  }

  export async function deleteWallet(walletId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ is_deleted: true })
        .eq('id', walletId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng.' };
    }
  }

  export async function setDefaultWallet(walletId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('set_default_wallet', {
        p_wallet_id: walletId,
        p_user_id: userId
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng.' };
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test tests/services/dashboardService.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit changes**
  Run: `git add src/services/dashboardService.ts tests/services/dashboardService.test.ts; git commit -m "feat: add wallet db service functions and tests"`

---

### Task 2: Create Wallet Bottom Sheet Component

**Files:**
- Create: [WalletCreateSheet.tsx](file:///d:/Personal%20projects%27/Capy%27s%20Money/src/components/WalletCreateSheet.tsx)
- Create: [WalletCreateSheet.test.tsx](file:///d:/Personal%20projects%27/Capy%27s%20Money/tests/components/WalletCreateSheet.test.tsx)

- [ ] **Step 1: Write test for WalletCreateSheet**
  Ensure basic form fields render (name text input, personal/shared selection, initial balance input) and submit calls `createWallet`.

- [ ] **Step 2: Run test to verify it fails**
  Expected: FAIL

- [ ] **Step 3: Implement WalletCreateSheet Component**
  Create a bottom sheet using `react-native` Modal with input fields for Tên ví, Loại ví (Cá nhân/Chung), Số dư ban đầu, and color selectors matching the Stitch colors (Pastel Pink #FFB7C5, Soft Coral #FE9DA9, etc.). When saved, calls `createWallet`.

- [ ] **Step 4: Run test to verify it passes**
  Expected: PASS

- [ ] **Step 5: Commit changes**
  Run: `git add src/components/WalletCreateSheet.tsx tests/components/WalletCreateSheet.test.tsx; git commit -m "feat: implement WalletCreateSheet component"`

---

### Task 3: Edit & Jar Allocation Settings Bottom Sheet Component

**Files:**
- Create: [WalletEditSheet.tsx](file:///d:/Personal%20projects%27/Capy%27s%20Money/src/components/WalletEditSheet.tsx)
- Create: [WalletEditSheet.test.tsx](file:///d:/Personal%20projects%27/Capy%27s%20Money/tests/components/WalletEditSheet.test.tsx)

- [ ] **Step 1: Write tests for WalletEditSheet**
  Validate sliders display properly, total percentage checks (disable Save if not exactly 100%), and role permissions check (hide save/edit if role is viewer).

- [ ] **Step 2: Run test to verify it fails**
  Expected: FAIL

- [ ] **Step 3: Implement WalletEditSheet Component**
  - Implement a list of 6 hũ with sliders (using `@react-native-community/slider` or native custom touchable track for cross-platform compatibility).
  - Add text label showing the current sum of percentages (e.g. `Tổng hũ: 100%`).
  - Disable "Lưu tỷ lệ hũ" if sum !== 100%.
  - Add "Đặt lại mặc định" button to reset sliders to 55-10-10-10-10-5.
  - Add "⭐ Mặc định" button (calls `setDefaultWallet`) and "🗑️ Xóa ví" button (shows alert dialogue option B and calls `deleteWallet` on confirm).
  - Add members list and "➕ Mời thành viên mới" button if the wallet type is `shared`.

- [ ] **Step 4: Run test to verify it passes**
  Expected: PASS

- [ ] **Step 5: Commit changes**
  Run: `git add src/components/WalletEditSheet.tsx tests/components/WalletEditSheet.test.tsx; git commit -m "feat: implement WalletEditSheet with Jar Allocation Sliders"`

---

### Task 4: Main Wallet Screen & Integration

**Files:**
- Create: [WalletScreen.tsx](file:///d:/Personal%20projects%27/Capy%27s%20Money/src/screens/WalletScreen.tsx)
- Modify: [DashboardScreen.tsx](file:///d:/Personal%20projects%27/Capy%27s%20Money/src/screens/DashboardScreen.tsx)

- [ ] **Step 1: Write test for WalletScreen and Dashboard integration**
  Verify the list of wallets render correctly, active wallet displays settings trigger unless role is viewer, "+ Tạo ví mới" button becomes disabled with info warning when free tier quotas (2 personal, 1 shared) are met.

- [ ] **Step 2: Run test to verify it fails**
  Expected: FAIL

- [ ] **Step 3: Implement WalletScreen and mount in DashboardScreen**
  - Replace the static wallets tab code in `DashboardScreen.tsx` with `<WalletScreen userId={userId} ... />`.
  - Render list of wallet cards with LinearGradient, styling as Option C.
  - Add "+ Tạo ví mới" button at the bottom of the screen.
  - Apply the quota verification check:
    ```typescript
    const personalCount = wallets.filter(w => w.type === 'personal').length;
    const sharedCount = wallets.filter(w => w.type === 'shared').length;
    const isLimitReached = (personalCount >= 2 && sharedCount >= 1);
    ```
    If `isLimitReached` is true, render the button in disabled mode with warning text: *"Bạn đã đạt giới hạn ví miễn phí (2 cá nhân, 1 chung). Nâng cấp Premium để tạo thêm"*.

- [ ] **Step 4: Run test to verify it passes**
  Expected: PASS

- [ ] **Step 5: Commit changes**
  Run: `git add src/screens/WalletScreen.tsx src/screens/DashboardScreen.tsx; git commit -m "feat: integrate WalletScreen with quota gating"`
