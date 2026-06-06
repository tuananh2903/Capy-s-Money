# ALIGNMENT CHECK REPORT

This report evaluates the alignment between the mobile source code implementation of the Dashboard and Shared Wallet features, the specifications under `/docs`, and the design rules based on the Stitch Design System.

## 1. Overview of Checked Components
- **Code Files Evaluated**:
  - `src/screens/DashboardScreen.tsx`
  - `src/screens/WalletInviteScreen.tsx`
  - `src/screens/WalletJoinScreen.tsx`
  - `src/components/QuickAddBottomSheet.tsx`
  - `src/utils/budgetChecker.ts`
- **Spec & Design Documents**:
  - `docs/design/dashboard/prd-dashboard.md` (Product Requirements Document - Dashboard)
  - `docs/design/dashboard/srs-dashboard.md` (System Requirements Specification - Dashboard)
  - `docs/design/wallet/prd-shared-wallet-invite.md` (Product Requirements Document - Shared Wallet Invite)
  - Design Guidelines in `AGENTS.md` and `CLAUDE.md`.

---

## 2. StitchMCP Connection Status
> [!NOTE]
> Connection to the StitchMCP server returned a "tool is not enabled" error. As a secondary check, all design evaluations were conducted by auditing code against the specific design system tokens and guidelines defined in the project files (e.g., `CLAUDE.md`, `AGENTS.md`, and `/docs`).

---

## 3. Discrepancies and Deviations Identified

The audit revealed the following discrepancies and implementation gaps, categorized by type:

### A. Typography & Fonts (Inconsistency)
* **Design Spec**: The typography system must use the **Plus Jakarta Sans** font.
* **Current Code**: None of the checked UI components (`DashboardScreen.tsx`, `WalletInviteScreen.tsx`, `WalletJoinScreen.tsx`, `QuickAddBottomSheet.tsx`) specify a `fontFamily` in their StyleSheets.
* **Impact**: Medium. The application is currently rendering default system fonts (San Francisco on iOS, Roboto on Android) instead of the brand typography.
* **Proposed Fix**: Configure and load `'Plus Jakarta Sans'` in the app entry point, and update the StyleSheets to include `fontFamily: 'Plus Jakarta Sans'`.

### B. Shapes & Border Radiuses (Mismatch)
* **Design Spec**:
  - Card components must have a minimum `borderRadius` of **32px**.
  - Pill buttons must be fully rounded (`borderRadius: 100`).
  - The Join Wallet invitation code input field must be **32px rounded**.
* **Current Code**:
  - **Cards**: Several containers representing cards do not meet the 32px minimum:
    - `balanceCard` in `DashboardScreen.tsx` uses `borderRadius: 28` (Line 563).
    - `memberCard` in `DashboardScreen.tsx` uses `borderRadius: 24` (Line 677).
    - `personalWalletCard` in `DashboardScreen.tsx` uses `borderRadius: 24` (Line 692).
    - `quoteCard` in `DashboardScreen.tsx` uses `borderRadius: 24` (Line 629).
    - `jarGridItem` in `DashboardScreen.tsx` uses `borderRadius: 16` (Line 646).
    - `codeCard` in `WalletInviteScreen.tsx` uses `borderRadius: 20` (Line 271).
  - **Inputs**: The invitation code input field `input` in `WalletJoinScreen.tsx` uses `borderRadius: 20` (Line 304) instead of the specified `32`.
* **Proposed Fix**:
  - Increase the `borderRadius` of `balanceCard`, `memberCard`, `personalWalletCard`, and `quoteCard` to `32`.
  - Increase `borderRadius` of `input` in `WalletJoinScreen.tsx` to `32`.

### C. Color Mappings (Mismatch)
* **Design Spec**:
  - The "Tham gia ngay" (Join Wallet) success action button should be colored in **Primary Container** (`#FFB7C5` / Pastel Pink).
* **Current Code**:
  - In `WalletJoinScreen.tsx` (Line 378), the success action button uses `COLORS.primary` (`#864E5A`).
* **Proposed Fix**:
  - Change the action button background in the success view of `WalletJoinScreen.tsx` to `COLORS.primaryContainer` (`#FFB7C5`) and its text color to `COLORS.primary` (`#864E5A`) for optimal accessibility and brand alignment.

### D. Spacing & 8px Grid Alignment (Inconsistency)
* **Design Spec**: Spacing values must adhere strictly to the 8px scale.
* **Current Code**: Numerous non-8px spacing values (such as 20, 18, 14, 12, 10, 6, 4) are hardcoded:
  - `header`: `paddingHorizontal: 20`, `paddingVertical: 12`
  - `scrollContent`: `paddingHorizontal: 20`, `paddingBottom: 110`
  - `balanceCard`: `marginTop: 20`
  - `walletPill`: `marginRight: 10`
  - `sectionTitle`: `marginTop: 20`, `marginBottom: 12`
  - `jarGridItem`: `padding: 12`, `marginBottom: 12`
  - `tabContainer` (Quick Add): `marginBottom: 20`
  - `amountInputContainer`: `paddingHorizontal: 18`
* **Proposed Fix**: Refactor all hardcoded spacing values to align with the 8px grid (e.g. change 20 to 16 or 24, 12 to 8 or 16, 10 to 8, 14 to 16, 18 to 16).

### E. Business Logic & Permissions (Critical Bug)
* **Design Spec (`prd-shared-wallet-invite.md`)**:
  - In a Shared Wallet, only the **Owner** is authorized to invite new members (`US-01` & `US-02`). An **Editor** member is explicitly forbidden from inviting new members ("Editor: KHÔNG ĐƯỢC mời thêm thành viên mới.").
* **Current Code**:
  - In `DashboardScreen.tsx` (Line 389), the `inviteButton` ("+ Mời thành viên") is rendered based purely on the member count (`walletMembers.length < 3`). It does not verify the current user's role or whether the user is the owner of the wallet.
  - This allows **Editor** and **Viewer** roles to see the invite button, click it, and generate invitation codes.
* **Proposed Fix**: Restrict the invite button visibility in `DashboardScreen.tsx` to the wallet owner:
  ```typescript
  const isOwner = selectedWallet.user_id === userId;
  // ...
  {!loadingMembers && walletMembers.length < 3 && isOwner ? (
    <TouchableOpacity style={styles.inviteButton} ...>
      <Text>+ Mời thành viên</Text>
    </TouchableOpacity>
  ) : ...
  ```

### F. Quick Add Default Flow & Gaps
* **Design Spec (`prd-dashboard.md`)**:
  - The default transaction tab in the Quick Add Bottom Sheet must be **"Khoản chi"** (Expense).
  - The date picker should allow users to touch the chip and select a date (excluding future dates).
  - Wording for validations:
    - Amount <= 0: `"Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại."`
    - Note > 200: `"Ghi chú quá dài (tối đa 200 ký tự). Vui lòng rút ngắn."`
* **Current Code**:
  - **Default Tab**: In `QuickAddBottomSheet.tsx` (Line 87), the default state is set to `'income'` (Khoản thu). This hides the 6 Jars selector on open (since jars only show for expenses), requiring an extra tap to get to the core 6-Jar workflow.
  - **Date Picker**: There is no actual date picker functionality; the date chip is static and hardcoded to display "Hôm nay".
  - **Validation Wording**: 
    - Amount <= 0 uses: `"Số tiền giao dịch phải lớn hơn 0."` (Missing "đ. Vui lòng nhập lại.")
    - Note > 200 uses: `"Ghi chú không được vượt quá 200 ký tự."` (Missing "quá dài... Vui lòng rút ngắn.")
* **Proposed Fix**:
  - Change default state in `QuickAddBottomSheet.tsx` to `'expense'`.
  - Update the validation error messages to match the exact wording specified in the PRD.
  - Implement a React Native DatePicker component in the Quick Add Bottom Sheet.

---

## 4. Documentation Discrepancies
* **PRD Typo**: In `prd-dashboard.md` (Lines 68 & 71), there is a typo swapping the abbreviations of:
  - "Hũ Tiết kiệm" (Long-term Savings) -> labeled as "FFA" (should be LTSS).
  - "Hũ Đầu tư" (Financial Freedom) -> labeled as "LTSS" (should be FFA).
* **Code Implementation**: The code correctly maps `LTSS` to "Tiết kiệm" and `FFA` to "Tự do TC". This represents a typo in the PRD, but the code implementation is correct.

---

## 5. Summary Table of Action Items

| Component | Issue | Spec Requirement | Current Value in Code | Severity | Proposed Fix |
|---|---|---|---|---|---|
| All Components | Missing Font | Plus Jakarta Sans | Default system font | Medium | Add `fontFamily: 'Plus Jakarta Sans'` to StyleSheet |
| `DashboardScreen.tsx` | Card border radius | `borderRadius: 32` minimum | `28` (balance card), `24` (other cards) | Medium | Increase to `32` |
| `WalletJoinScreen.tsx` | Input border radius | `borderRadius: 32` | `20` | Medium | Increase to `32` |
| `WalletJoinScreen.tsx` | Success button color | Primary Container (`#FFB7C5`) | Primary (`#864E5A`) | Low | Update to `COLORS.primaryContainer` |
| `DashboardScreen.tsx` | Invite button permission | Owner only | Visible to all members | **High** | Restrict button to `selectedWallet.user_id === userId` |
| `QuickAddBottomSheet.tsx` | Default tab | Expense (Khoản chi) | Income (Khoản thu) | Medium | Set default type state to `'expense'` |
| `QuickAddBottomSheet.tsx` | Date Picker | Interactive date picker | Hardcoded "Hôm nay" chip | Medium | Implement date picker component |
| `QuickAddBottomSheet.tsx` | Validation Wordings | PRD specific wordings | Generic error messages | Low | Update validation strings |
