# Dashboard & Quick Add Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai màn hình Dashboard và Popup Thêm nhanh giao dịch (Quick Add) cho Capy's Money. Đảm bảo hỗ trợ chuyển đổi ví, hiển thị 6 hũ với cảnh báo ngân sách thông minh, điều chỉnh tỷ lệ hũ (tổng 100%), và lưu giao dịch lên Supabase (với trigger tự động tính toán số tiền đã tiêu trong hũ).

---

### Task 1: Supabase Database Migration (Jars & Triggers)

**Files:**
- Create: [20260520000000_add_jars_and_triggers.sql](file:///d:/Personal%20projects/Capy's%20Money/supabase/migrations/20260520000000_add_jars_and_triggers.sql)

- [ ] **Step 1: Write SQL migration file**
  - Create table `public.jars` with RLS policies.
  - Add `jar_type` columns to `public.categories` and `public.transactions`.
  - Create trigger function `recalculate_jar_spent_amount` to automatically update `spent_amount` in the `jars` table on transaction modifications.
  - Apply RLS policy on `public.jars` to limit read access to members of the wallet and update access to owners/editors.

- [ ] **Step 2: Verify migration locally**
  - Apply the migration to the Supabase database.
  - Verify tables, triggers, and constraints are correctly configured.

---

### Task 2: Smart Budget Checker Utility (TDD)

**Files:**
- Create: [budgetChecker.ts](file:///d:/Personal%20projects/Capy's%20Money/src/utils/budgetChecker.ts)
- Create: [budgetChecker.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/utils/budgetChecker.test.ts)

- [ ] **Step 1: Write the failing tests**
  - Test `NORMAL` status when spent is below limit.
  - Test `NORMAL` status when spent is 81% but date is after 15th.
  - Test `SPENDING_TOO_FAST` status when spent is 81% and date is 15th or earlier.
  - Test `OVER_BUDGET` status when spent is 100% or more.
  - Test `NORMAL` status if limit is 0.

- [ ] **Step 2: Run test to verify they fail**
  - Command: `npm test tests/utils/budgetChecker.test.ts`
  - Expected: Fail (Module not found / incorrect outputs).

- [ ] **Step 3: Implement minimal logic in `budgetChecker.ts`**
  - Implement function `evaluateJarBudget(spentAmount, budgetLimit, currentDate)`.

- [ ] **Step 4: Verify tests pass**
  - Command: `npm test tests/utils/budgetChecker.test.ts`
  - Expected: Pass.

- [ ] **Step 5: Commit**
  - Conventional commit: `test(dashboard): add unit tests and logic for smart budget checker`

---

### Task 3: Dashboard API Services (TDD)

**Files:**
- Create: [dashboardService.ts](file:///d:/Personal%20projects/Capy's%20Money/src/services/dashboardService.ts)
- Create: [dashboardService.test.ts](file:///d:/Personal%20projects/Capy's%20Money/tests/services/dashboardService.test.ts)

- [ ] **Step 1: Write failing tests for Dashboard API operations**
  - Fetch wallets for user (returns personal & shared wallets).
  - Fetch 6 jars for wallet (returns spent, limit, and allocations).
  - Save transaction (validates amount > 0, notes <= 200, handles transaction inserts).
  - Update jar allocations (validates total percentage == 100%).

- [ ] **Step 2: Run tests to verify failures**
  - Command: `npm test tests/services/dashboardService.test.ts`
  - Expected: Fail.

- [ ] **Step 3: Write minimal implementation in `dashboardService.ts`**
  - Add `fetchWallets(userId)`, `fetchJars(walletId)`, `createTransaction(txData)`, and `updateJarAllocations(walletId, allocations)`.
  - Wire up Supabase Javascript client direct queries.

- [ ] **Step 4: Verify tests pass**
  - Command: `npm test tests/services/dashboardService.test.ts`
  - Expected: Pass.

- [ ] **Step 5: Commit**
  - Conventional commit: `feat(dashboard): implement database query services for dashboard and quick add`

---

### Task 4: Quick Add Bottom Sheet UI Component (TDD)

**Files:**
- Create: [QuickAddBottomSheet.tsx](file:///d:/Personal%20projects/Capy's%20Money/src/components/QuickAddBottomSheet.tsx)
- Create: [QuickAddBottomSheet.test.tsx](file:///d:/Personal%20projects/Capy's%20Money/tests/components/QuickAddBottomSheet.test.tsx)

- [ ] **Step 1: Write failing UI tests for QuickAddBottomSheet**
  - Renders input amount, tabs (Khoản chi / Khoản thu), 6 Jars selection, Subcategory selection list, Date selection, and Note.
  - Error wording displays if trying to submit with 0 or negative amount.
  - Note character limit input check.
  - Callback triggered on successful save.

- [ ] **Step 2: Run tests to verify failures**
  - Command: `npm test tests/components/QuickAddBottomSheet.test.tsx`
  - Expected: Fail.

- [ ] **Step 3: Implement UI in `QuickAddBottomSheet.tsx`**
  - Design using Stitch colors (pink theme, smooth transitions, drag indicator handle).
  - Add text fields, picker components, and button logic.
  - Hook up state and validation warnings.

- [ ] **Step 4: Verify tests pass**
  - Command: `npm test tests/components/QuickAddBottomSheet.test.tsx`
  - Expected: Pass.

- [ ] **Step 5: Commit**
  - Conventional commit: `feat(dashboard): create quick add transaction bottom sheet UI component`

---

### Task 5: Dashboard Screen UI Integration & Switcher (TDD)

**Files:**
- Modify: [DashboardScreen.tsx](file:///d:/Personal%20projects/Capy's%20Money/src/screens/DashboardScreen.tsx)
- Create/Modify: [DashboardScreen.test.tsx](file:///d:/Personal%20projects/Capy's%20Money/tests/screens/DashboardScreen.test.tsx)

- [ ] **Step 1: Write tests for DashboardScreen integration**
  - Renders Wallet Switcher with wallets fetched from Supabase.
  - active wallet has a distinct visual indicator.
  - Displays the 6 Jars with their respective budget limits, spent amounts, and progress bars.
  - Renders proper colors (pink defaults, pink-dark for warnings, red for over-budget) and labels based on the smart budget alerts rules.
  - Floating action button (FAB) displays and toggles the Quick Add Bottom Sheet.
  - Adjust jar percentages popup/overlay allows modifying allocations.

- [ ] **Step 2: Run tests to verify failures**
  - Command: `npm test tests/screens/DashboardScreen.test.tsx`
  - Expected: Fail.

- [ ] **Step 3: Re-implement `DashboardScreen.tsx`**
  - Fetch active wallet profile.
  - Query actual database records for `jars` and `wallets`.
  - Bind the `QuickAddBottomSheet` trigger state.
  - Update display with styling tokens and mascot prompts.

- [ ] **Step 4: Verify tests pass**
  - Command: `npm test tests/screens/DashboardScreen.test.tsx`
  - Expected: Pass.

- [ ] **Step 5: Commit**
  - Conventional commit: `feat(dashboard): integrate database services and quick add overlay into main dashboard UI`
