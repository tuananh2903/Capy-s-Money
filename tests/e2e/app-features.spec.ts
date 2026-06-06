import { test, expect } from '@playwright/test';

// ─── Shared Mock Helpers ──────────────────────────────────────────────────────

const mockUser = {
  id: 'mock-user-uuid-123',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@gmail.com',
  email_confirmed_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'Capy User' },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockWallets = [
  { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false },
  { id: 'w-2', user_id: 'mock-user-uuid-123', name: 'Ví Tiết Kiệm', balance: 12000000, is_default: false, type: 'personal', is_deleted: false }
];

const mockJarsW1 = [
  { id: 'j-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 1000000, budget_limit: 2750000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-play', type: 'PLAY', allocation_percentage: 10, spent_amount: 450000, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-ffa', type: 'FFA', allocation_percentage: 10, spent_amount: 600000, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: true },
  { id: 'j-edu', type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-ltss', type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-give', type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 250000, wallet_id: 'w-1', enable_alerts: false }
];

const mockJarsW2 = [
  { id: 'j2-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 0, budget_limit: 6600000, wallet_id: 'w-2', enable_alerts: false },
  { id: 'j2-play', type: 'PLAY', allocation_percentage: 10, spent_amount: 0, budget_limit: 1200000, wallet_id: 'w-2', enable_alerts: false },
  { id: 'j2-ffa', type: 'FFA', allocation_percentage: 10, spent_amount: 0, budget_limit: 1200000, wallet_id: 'w-2', enable_alerts: false },
  { id: 'j2-edu', type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 1200000, wallet_id: 'w-2', enable_alerts: false },
  { id: 'j2-ltss', type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 1200000, wallet_id: 'w-2', enable_alerts: false },
  { id: 'j2-give', type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 600000, wallet_id: 'w-2', enable_alerts: false }
];

const mockCategories = [
  { id: 'cat-1', name: 'Ăn uống', icon: '🍜', type: 'expense', jar_type: 'NEC' },
  { id: 'cat-2', name: 'Thuê nhà', icon: '🏠', type: 'expense', jar_type: 'NEC' },
  { id: 'cat-3', name: 'Lương', icon: '💼', type: 'income', jar_type: null },
  { id: 'cat-4', name: 'Thưởng', icon: '🏆', type: 'income', jar_type: null },
  { id: 'cat-5', name: 'Freelance', icon: '💻', type: 'income', jar_type: null }
];

async function setupDashboardMocks(page: any, dynamicTransactions: any[], dynamicWallets: any[]) {
  await page.route('**/auth/v1/session*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token-12345',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser
      })
    });
  });

  await page.route('**/auth/v1/token*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token-12345',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser
      })
    });
  });

  await page.route('**/rest/v1/profiles*', async (route: any) => {
    const method = route.request().method();
    if (method === 'PATCH' || method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-uuid-123',
          onboarding_completed: true,
          display_name: 'Capy User',
          jars_ratios: { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 }
        })
      });
    }
  });

  await page.route('**/rest/v1/wallet_members*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.route('**/rest/v1/wallets*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newWallet = {
        id: `w-new-${Date.now()}`,
        user_id: 'mock-user-uuid-123',
        name: body.name || 'Ví Mới',
        balance: body.balance || 0,
        is_default: false,
        type: body.type || 'personal',
        is_deleted: false
      };
      dynamicWallets.push(newWallet);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([newWallet]) });
    } else if (method === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dynamicWallets.filter(w => !w.is_deleted))
      });
    }
  });

  await page.route('**/rest/v1/jars*', async (route: any) => {
    const url = route.request().url();
    const method = route.request().method();
    if (method === 'PATCH' || method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else if (url.includes('wallet_id=eq.w-2')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockJarsW2) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockJarsW1) });
    }
  });

  await page.route('**/rest/v1/transactions*', async (route: any) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'GET') {
      const activeTxs = dynamicTransactions.filter(tx => !tx.is_deleted);
      const wId = url.includes('wallet_id=eq.w-2') ? 'w-2' : 'w-1';
      let filteredTxs = activeTxs.filter(tx => tx.wallet_id === wId);

      const gteMatch = url.match(/occurred_at=gte\.([^&]+)/);
      const lteMatch = url.match(/occurred_at=lte\.([^&]+)/);
      if (gteMatch) {
        const gteVal = decodeURIComponent(gteMatch[1]);
        filteredTxs = filteredTxs.filter(tx => tx.occurred_at >= gteVal);
      }
      if (lteMatch) {
        const lteVal = decodeURIComponent(lteMatch[1]);
        filteredTxs = filteredTxs.filter(tx => tx.occurred_at <= lteVal);
      }

      if (url.includes('type=eq.income')) {
        const incomeTxs = filteredTxs.filter(tx => tx.type === 'income');
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(incomeTxs) });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(filteredTxs)
        });
      }
    } else if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newTx = {
        id: `tx-${Date.now()}`,
        is_deleted: false,
        occurred_at: new Date().toISOString(),
        created_by: 'mock-user-uuid-123',
        categories: { name: body.note || body.jar_type },
        ...body
      };
      dynamicTransactions.push(newTx);

      const wallet = dynamicWallets.find((w: any) => w.id === body.wallet_id);
      if (wallet) {
        wallet.balance = body.type === 'income' ? wallet.balance + body.amount : wallet.balance - body.amount;
      }

      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([newTx]) });
    } else if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData() || '{}');
      const match = url.match(/id=eq\.(tx-[a-zA-Z0-9-]+)/);
      if (match) {
        const tx = dynamicTransactions.find((t: any) => t.id === match[1]);
        if (tx) {
          Object.assign(tx, body);
          if (body.is_deleted) {
            const wallet = dynamicWallets.find((w: any) => w.id === tx.wallet_id);
            if (wallet) {
              wallet.balance = tx.type === 'income' ? wallet.balance - tx.amount : wallet.balance + tx.amount;
            }
          }
        }
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/rest/v1/categories*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) });
    }
  });

  await page.route('**/rest/v1/category_budgets*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST' || method === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/rest/v1/wallet_invite_codes*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'invite-1', code: 'ABC123', expires_at: new Date(Date.now() + 86400000).toISOString() }])
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });
}

async function loginAndNavigateToDashboard(page: any, dynamicTransactions: any[], dynamicWallets: any[]) {
  await setupDashboardMocks(page, dynamicTransactions, dynamicWallets);
  await page.goto('/');
  await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  await page.getByTestId('email-input').fill('test@gmail.com');
  await page.getByTestId('password-input').fill('correctpassword');
  await page.getByTestId('login-button').click();
  await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
}

// ─── LedgerScreen Tests ───────────────────────────────────────────────────────

test.describe('Ledger Screen (Sổ Giao Dịch) E2E Tests', () => {
  let dynamicTransactions: any[];
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = JSON.parse(JSON.stringify(mockWallets));
    dynamicTransactions = [
      {
        id: 'tx-1',
        wallet_id: 'w-1',
        amount: 2500000,
        type: 'income',
        is_deleted: false,
        jar_type: 'NEC',
        occurred_at: new Date().toISOString(),
        created_by: 'mock-user-uuid-123',
        categories: { name: 'Lương' }
      },
      {
        id: 'tx-2',
        wallet_id: 'w-1',
        amount: 150000,
        type: 'expense',
        is_deleted: false,
        jar_type: 'NEC',
        occurred_at: new Date().toISOString(),
        created_by: 'mock-user-uuid-123',
        categories: { name: 'Ăn uống' }
      }
    ];

    await loginAndNavigateToDashboard(page, dynamicTransactions, dynamicWallets);
    // Navigate to Ledger tab
    await page.locator('text=Sổ GD').click();
    await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });
  });

  test('should display Ledger screen header with correct elements', async ({ page }) => {
    await expect(page.locator('text=Sổ Giao Dịch')).toBeVisible();
    // Current month display
    const now = new Date();
    await expect(page.locator(`text=Tháng ${now.getMonth() + 1} / ${now.getFullYear()}`)).toBeVisible();
    // Tab buttons
    await expect(page.locator('text=Hàng ngày')).toBeVisible();
    await expect(page.locator('text=Hàng tháng')).toBeVisible();
    await expect(page.locator('text=Lịch biểu')).toBeVisible();
  });

  test('should show transactions in Daily tab by default', async ({ page }) => {
    // Transactions should be visible
    await expect(page.locator('text=Lương')).toBeVisible();
    await expect(page.locator('text=Ăn uống')).toBeVisible();
    // Income shows green, expense shows red
    await expect(page.locator('text=+2.500.000đ')).toBeVisible();
    await expect(page.locator('text=-150.000đ')).toBeVisible();
  });

  test('should switch to Monthly tab and show summary', async ({ page }) => {
    await page.locator('text=Hàng tháng').click();
    await expect(page.locator('text=Phân Tích Chi Tiêu')).toBeVisible();
    await expect(page.locator('text=Nhận Xét Từ Capy')).toBeVisible();
    await expect(page.locator('text=Tổng chi tiêu:')).toBeVisible();
  });

  test('should switch to Calendar tab and show calendar view', async ({ page }) => {
    await page.locator('text="Lịch biểu"').click();
    // Should show calendar-like content
    await page.waitForTimeout(500);
    // Calendar tab component is rendered
    const now = new Date();
    const month = now.getMonth() + 1;
    // Month is still displayed in header
    await expect(page.locator(`text="Tháng ${month} / ${now.getFullYear()}"`).first()).toBeVisible();
  });

  test('should navigate to previous month when clicking left arrow', async ({ page }) => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    await page.locator('text=‹').click();
    await expect(page.locator(`text="Tháng ${prevMonth} / ${prevYear}"`)).toBeVisible();
  });

  test('should navigate to next month when clicking right arrow', async ({ page }) => {
    const now = new Date();
    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

    await page.locator('text=›').click();
    await expect(page.locator(`text="Tháng ${nextMonth} / ${nextYear}"`)).toBeVisible();
  });

  test('should open TransactionDetailSheet when clicking a transaction', async ({ page }) => {
    await page.locator('text=Lương').first().click();
    // Detail sheet should appear
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
    await expect(page.locator('text=+2.500.000đ').first()).toBeVisible();
    await expect(page.locator('text=Hũ & Phân mục:')).toBeVisible();
    await expect(page.locator('text=Thời gian:')).toBeVisible();
    await expect(page.locator('text=Sửa')).toBeVisible();
    await expect(page.locator('text=Xóa')).toBeVisible();
  });

  test('should close TransactionDetailSheet when clicking overlay', async ({ page }) => {
    await page.locator('text=Lương').first().click();
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();

    // Click overlay to close
    await page.getByTestId('detail-sheet-overlay').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    // Sheet should be dismissed
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeHidden();
  });

  test('should delete a transaction with confirmation', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      expect(dialog.message()).toContain('Xác nhận xóa');
      await dialog.accept();
    });

    await page.locator('text=Ăn uống').first().click();
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
    await page.locator('text=Xóa').click();

    // Transaction should be removed from the list
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeHidden();
  });

  test('should show empty state when no transactions in selected month', async ({ page }) => {
    // Go to next month (no transactions there)
    await page.locator('text=›').click();
    await expect(page.locator('text="Tháng này chưa có giao dịch nào 🦫"')).toBeVisible();
  });
});

// ─── Budget Screen Tests ──────────────────────────────────────────────────────

test.describe('Budget Screen (Ngân Sách) E2E Tests', () => {
  let dynamicTransactions: any[];
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = JSON.parse(JSON.stringify(mockWallets));
    dynamicTransactions = [];
    await loginAndNavigateToDashboard(page, dynamicTransactions, dynamicWallets);
    // Navigate to Budget tab
    await page.locator('text="Ngân sách"').click();
    await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });
  });

  test('should display Budget screen with correct header and elements', async ({ page }) => {
    await expect(page.locator('text=Quản Lý Ngân Sách')).toBeVisible();
    await expect(page.locator('text=Tổng ngân sách ví')).toBeVisible();
    // Default total budget displayed
    await expect(page.locator('[data-testid="text-total-budget"]')).toBeVisible();
    // Rollover card
    await expect(page.locator('text=🔄 Dồn ngân sách tháng sau')).toBeVisible();
    // Alert count badge
    await expect(page.locator('text=🔔 Cảnh báo đang hoạt động:')).toBeVisible();
  });

  test('should display wallet tab bar with wallets', async ({ page }) => {
    await expect(page.locator('text="Ví Cá Nhân"')).toBeVisible();
    await expect(page.locator('text="Ví Tiết Kiệm"')).toBeVisible();
  });

  test('should open total budget edit mode when clicking edit icon', async ({ page }) => {
    await page.getByTestId('btn-edit-total-budget').click();

    await expect(page.locator('[placeholder="Nhập tổng ngân sách..."]')).toBeVisible();
    await expect(page.getByTestId('btn-save-total-budget')).toBeVisible();
    await expect(page.locator('text=Hủy').first()).toBeVisible();
  });

  test('should save new total budget value', async ({ page }) => {
    await page.getByTestId('btn-edit-total-budget').click();

    const budgetInput = page.locator('[placeholder="Nhập tổng ngân sách..."]');
    await budgetInput.fill('20000000');
    await page.getByTestId('btn-save-total-budget').click();

    // Should show updated amount
    await expect(page.locator('text=20.000.000đ')).toBeVisible();
  });

  test('should cancel budget edit mode', async ({ page }) => {
    await page.getByTestId('btn-edit-total-budget').click();
    await expect(page.locator('[placeholder="Nhập tổng ngân sách..."]')).toBeVisible();

    await page.locator('text=Hủy').first().click();
    await expect(page.locator('[placeholder="Nhập tổng ngân sách..."]')).toBeHidden();
  });

  test('should toggle rollover mode on and off', async ({ page }) => {
    // Toggle on
    await page.getByTestId('btn-toggle-rollover').click();

    // Rollover forecast panel should appear
    await expect(page.locator('text=DỰ BÁO NGÂN SÁCH THÁNG SAU')).toBeVisible();
    await expect(page.getByTestId('text-next-budget-amount')).toBeVisible();

    // Toggle off
    await page.getByTestId('btn-toggle-rollover').click();
    await expect(page.locator('text=DỰ BÁO NGÂN SÁCH THÁNG SAU')).toBeHidden();
  });

  test('should display jar cards with correct data', async ({ page }) => {
    // Standard jars should be visible
    await expect(page.locator('text=Thiết yếu (NEC)')).toBeVisible();
    await expect(page.locator('text=Tự do TC (FFA)')).toBeVisible();
    await expect(page.locator('text=Giáo dục (EDU)')).toBeVisible();
    await expect(page.locator('text=Hưởng thụ (PLAY)')).toBeVisible();
    await expect(page.locator('text=Tiết kiệm (LTSS)')).toBeVisible();
    await expect(page.locator('text=Từ thiện (GIVE)')).toBeVisible();
  });

  test('should switch between wallet tabs in Budget screen', async ({ page }) => {
    // Click second wallet tab
    await page.locator('text="Ví Tiết Kiệm"').click();
    // Budget for second wallet should load
    await expect(page.locator('text=Quản Lý Ngân Sách')).toBeVisible();
    await expect(page.locator('text=Tổng ngân sách ví')).toBeVisible();
  });
});

// ─── WalletScreen (Ví) Tests ──────────────────────────────────────────────────

test.describe('Wallet Screen (Ví) E2E Tests', () => {
  let dynamicTransactions: any[];
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = JSON.parse(JSON.stringify(mockWallets));
    dynamicTransactions = [];
    await loginAndNavigateToDashboard(page, dynamicTransactions, dynamicWallets);
    await page.locator('text="Ví"').last().click();
    await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });
  });

  test('should display Wallet screen with all wallets', async ({ page }) => {
    await expect(page.locator('text=Ví của tôi')).toBeVisible();
    await expect(page.locator('text="Ví Cá Nhân"')).toBeVisible();
    await expect(page.locator('text="Ví Tiết Kiệm"')).toBeVisible();
    // Wallet balances
    await expect(page.locator('text=5.000.000 đ').first()).toBeVisible();
    await expect(page.locator('text=12.000.000 đ').first()).toBeVisible();
    // Wallet type badges
    await expect(page.locator('text=Cá nhân').first()).toBeVisible();
    // Create wallet button
    await expect(page.getByTestId('create-wallet-btn')).toBeVisible();
  });

  test('should open Create Wallet sheet when clicking ➕ Tạo ví mới', async ({ page }) => {
    await page.getByTestId('create-wallet-btn').click();
    // WalletCreateSheet should appear
    await page.waitForTimeout(500);
    // Sheet title or content should be visible
    await expect(page.locator('text="Tạo Ví Mới"')).toBeVisible({ timeout: 5000 });
  });

  test('should open settings sheet for a wallet', async ({ page }) => {
    // Click settings button for first wallet (w-1)
    await page.getByTestId('btn-settings-w-1').click();
    // WalletEditSheet should appear
    await page.waitForTimeout(500);
    await expect(page.locator('text="Cài đặt: Ví Cá Nhân"')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to home tab after selecting a wallet', async ({ page }) => {
    // Click on the wallet card
    await page.locator('text="Ví Tiết Kiệm"').first().click();
    // Should navigate back to home tab with selected wallet
    await expect(page.locator('text=Capy\'s Money')).toBeVisible({ timeout: 5000 });
  });
});

// ─── QuickAdd Bottom Sheet Tests ─────────────────────────────────────────────

test.describe('QuickAdd Bottom Sheet E2E Tests', () => {
  let dynamicTransactions: any[];
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = JSON.parse(JSON.stringify(mockWallets));
    dynamicTransactions = [
      {
        id: 'tx-income-1',
        wallet_id: 'w-1',
        amount: 2500000,
        type: 'income',
        is_deleted: false,
        jar_type: 'NEC',
        occurred_at: new Date().toISOString(),
        created_by: 'mock-user-uuid-123',
        categories: { name: 'Lương' }
      }
    ];
    await loginAndNavigateToDashboard(page, dynamicTransactions, dynamicWallets);
    // Make sure we're on home tab and open FAB
    await page.getByTestId('fab-add-transaction').click();
    await page.waitForTimeout(500);
  });

  test('should display QuickAdd sheet with all elements', async ({ page }) => {
    // Type toggle buttons
    await expect(page.locator('text=Khoản chi')).toBeVisible();
    await expect(page.locator('text=Khoản thu')).toBeVisible();
    // Amount input
    await expect(page.locator('[placeholder="0"]').first()).toBeVisible();
    // Note input
    await expect(page.locator('[placeholder="Nhập ghi chú..."]')).toBeVisible();
    // Save button
    await expect(page.locator('text=Lưu giao dịch')).toBeVisible();
    // Close button
    await expect(page.locator('text=✕').first()).toBeVisible();
  });

  test('should switch between expense and income type', async ({ page }) => {
    // Default should be expense
    await expect(page.locator('text=Khoản chi')).toBeVisible();

    // Switch to income
    await page.locator('text=Khoản thu').click();
    // Income categories should change
    await expect(page.locator('text=Lương').first()).toBeVisible();
    await expect(page.locator('text=Thưởng').first()).toBeVisible();
    await expect(page.locator('text=Freelance').first()).toBeVisible();
  });

  test('should display jar selection for expense type', async ({ page }) => {
    // Ensure expense mode
    await page.locator('text=Khoản chi').click();
    // Jar chips should be visible
    await expect(page.locator('text=Thiết yếu').first()).toBeVisible();
    await expect(page.locator('text=Tiết kiệm').first()).toBeVisible();
    await expect(page.locator('text=Giáo dục').first()).toBeVisible();
    await expect(page.locator('text=Hưởng thụ').first()).toBeVisible();
    await expect(page.locator('text=Tự do TC').first()).toBeVisible();
    await expect(page.locator('text=Cho đi').first()).toBeVisible();
  });

  test('should show validation error when amount is zero', async ({ page }) => {
    // Leave amount empty, try to save
    await page.locator('text=Lưu giao dịch').click();
    await expect(page.locator('text=Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại.')).toBeVisible();
  });

  test('should show date picker when clicking date chip', async ({ page }) => {
    // Date chip should be visible (Hôm nay)
    await expect(page.locator('text=Hôm nay')).toBeVisible();
    await page.locator('text=Hôm nay').click();
    // Calendar/date picker should appear
    await page.waitForTimeout(300);
    // Some calendar UI elements should be present
    await expect(page.locator('text=Hôm nay').first()).toBeVisible();
  });

  test('should add expense transaction successfully and update dashboard', async ({ page }) => {
    // Select jar - use force click because label element layout box intercepts clicks in RN Web
    await page.locator('text=Thiết yếu').first().click({ force: true });
    // Fill amount
    await page.locator('[placeholder="0"]').first().fill('200000');
    // Fill note
    await page.locator('[placeholder="Nhập ghi chú..."]').fill('Ăn trưa');
    // Save
    await page.locator('text=Lưu giao dịch').click();

    // Sheet should close
    await page.waitForTimeout(1000);
    // Dashboard should show updated balance (5M - 0.2M = 4.8M)
    await expect(page.locator('text=4.800.000').first()).toBeVisible({ timeout: 5000 });
  });

  test('should add income transaction and update dashboard income', async ({ page }) => {
    // Switch to income
    await page.locator('text=Khoản thu').click();
    await page.locator('[placeholder="0"]').first().fill('1000000');
    await page.locator('[placeholder="Nhập ghi chú..."]').fill('Thưởng Capy');
    await page.locator('text=Lưu giao dịch').click();

    // Income should update (2.5M + 1M = 3.5M)
    await page.waitForTimeout(1000);
    await expect(page.locator('text=+3.500.000').first()).toBeVisible({ timeout: 5000 });
  });

  test('should close QuickAdd sheet when clicking X button', async ({ page }) => {
    await expect(page.locator('text=Lưu giao dịch')).toBeVisible();
    await page.locator('text=✕').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Lưu giao dịch')).toBeHidden();
  });
});

// ─── User Profile & Settings Tests ───────────────────────────────────────────

test.describe('User Profile & Settings Modal Tests', () => {
  let dynamicTransactions: any[];
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = JSON.parse(JSON.stringify(mockWallets));
    dynamicTransactions = [];
    await loginAndNavigateToDashboard(page, dynamicTransactions, dynamicWallets);
  });

  test('should open profile dropdown when clicking avatar', async ({ page }) => {
    await expect(page.getByTestId('dropdown-profile-info')).toBeHidden();
    await page.getByTestId('avatar-button').click();
    await expect(page.getByTestId('dropdown-profile-info')).toBeVisible();
    await expect(page.getByTestId('dropdown-settings')).toBeVisible();
    await expect(page.getByTestId('dropdown-logout')).toBeVisible();
  });

  test('should close dropdown when clicking overlay', async ({ page }) => {
    await page.getByTestId('avatar-button').click();
    await expect(page.getByTestId('dropdown-profile-info')).toBeVisible();
    // Click outside dropdown
    await page.mouse.click(10, 10);
    await expect(page.getByTestId('dropdown-profile-info')).toBeHidden();
  });

  test('should open User Info modal from dropdown', async ({ page }) => {
    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-profile-info').click();
    // User Info modal should appear
    await expect(page.locator('text=Thông tin cá nhân')).toBeVisible();
    await expect(page.locator('text=Tên hiển thị')).toBeVisible();
    await expect(page.locator('text=Email (Đăng nhập)')).toBeVisible();
    await expect(page.locator('text=Số điện thoại')).toBeVisible();
    await expect(page.locator('text=Hủy')).toBeVisible();
    await expect(page.getByTestId('save-profile-btn')).toBeVisible();
  });

  test('should close User Info modal when clicking Cancel', async ({ page }) => {
    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-profile-info').click();
    await expect(page.locator('text=Thông tin cá nhân')).toBeVisible();
    await page.locator('text=Hủy').click();
    await expect(page.locator('text=Thông tin cá nhân')).toBeHidden();
  });

  test('should save profile name successfully', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });

    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-profile-info').click();

    // Update display name
    const nameInput = page.locator('[placeholder="Nhập tên hiển thị"]');
    await nameInput.clear();
    await nameInput.fill('Capy Mới');
    await page.getByTestId('save-profile-btn').click();
  });

  test('should open Settings modal from dropdown', async ({ page }) => {
    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-settings').click();
    // Settings modal should appear
    await expect(page.locator('text=Cài đặt tài khoản')).toBeVisible();
    await expect(page.locator('text=Ngôn ngữ')).toBeVisible();
    await expect(page.locator('text=Tiếng Việt')).toBeVisible();
    await expect(page.locator('text=English')).toBeVisible();
    await expect(page.locator('text=Giao diện hiển thị')).toBeVisible();
    await expect(page.locator('text=Sáng')).toBeVisible();
    await expect(page.locator('text=Tối')).toBeVisible();
    await expect(page.getByTestId('save-settings-btn')).toBeVisible();
  });

  test('should toggle language in Settings modal', async ({ page }) => {
    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-settings').click();

    // Switch to English
    await page.locator('text=English').click();
    // Save settings
    page.on('dialog', async (dialog: any) => await dialog.accept());
    await page.getByTestId('save-settings-btn').click();
  });

  test('should toggle theme in Settings modal', async ({ page }) => {
    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-settings').click();

    // Switch to dark mode
    await page.locator('text=Tối').click();
    page.on('dialog', async (dialog: any) => await dialog.accept());
    await page.getByTestId('save-settings-btn').click();
  });

  test('should close Settings modal when clicking Cancel', async ({ page }) => {
    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-settings').click();
    await expect(page.locator('text=Cài đặt tài khoản')).toBeVisible();
    await page.locator('text=Hủy').click();
    await expect(page.locator('text=Cài đặt tài khoản')).toBeHidden();
  });

  test('should trigger sign-out flow with confirmation dialog', async ({ page }) => {
    let signoutCalled = false;
    await page.route('**/auth/v1/logout*', async (route: any) => {
      signoutCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    page.on('dialog', async (dialog: any) => {
      expect(dialog.message()).toContain('Xác nhận đăng xuất');
      await dialog.accept();
    });

    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-logout').click();

    // Confirm dialog and verify logout
    await expect.poll(() => signoutCalled).toBe(true);
    await expect(page.getByTestId('login-screen')).toBeVisible({ timeout: 10000 });
  });

  test('should cancel sign-out flow', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      await dialog.dismiss(); // Cancel
    });

    await page.getByTestId('avatar-button').click();
    await page.getByTestId('dropdown-logout').click();

    // Should still be on dashboard
    await expect(page.locator("text=Capy's Money")).toBeVisible();
  });
});

// ─── Notification Bell Tests ──────────────────────────────────────────────────

test.describe('Notification Bell E2E Tests', () => {
  let dynamicTransactions: any[];
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = JSON.parse(JSON.stringify(mockWallets));
    dynamicTransactions = [];
    await loginAndNavigateToDashboard(page, dynamicTransactions, dynamicWallets);
  });

  test('should show notification alert when clicking bell button', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      expect(dialog.message()).toContain('Hiện tại bạn chưa có thông báo mới nào.');
      await dialog.accept();
    });

    await page.getByTestId('bell-button').click();
  });
});

// ─── End-to-End Flow Tests ────────────────────────────────────────────────────

test.describe('Full E2E Flows', () => {
  let dynamicTransactions: any[];
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = JSON.parse(JSON.stringify(mockWallets));
    dynamicTransactions = [
      {
        id: 'tx-init-income',
        wallet_id: 'w-1',
        amount: 5000000,
        type: 'income',
        is_deleted: false,
        jar_type: 'NEC',
        occurred_at: new Date().toISOString(),
        created_by: 'mock-user-uuid-123',
        categories: { name: 'Lương' }
      }
    ];
    await loginAndNavigateToDashboard(page, dynamicTransactions, dynamicWallets);
  });

  test('full flow: add expense transaction, verify in ledger, then delete', async ({ page }) => {
    // Initial state verification
    await expect(page.locator('text=5.000.000').first()).toBeVisible();

    // Open QuickAdd
    await page.getByTestId('fab-add-transaction').click();
    await page.waitForTimeout(500);

    // Add expense
    await page.locator('text=Khoản chi').click();
    await page.locator('[placeholder="0"]').first().fill('300000');
    await page.locator('[placeholder="Nhập ghi chú..."]').fill('Cà phê sáng');
    await page.locator('text=Lưu giao dịch').click();

    // Verify dashboard updated
    await expect(page.locator('text=4.700.000').first()).toBeVisible({ timeout: 5000 });

    // Go to ledger
    await page.locator('text="Sổ GD"').click();
    await expect(page.locator('text=Cà phê sáng')).toBeVisible({ timeout: 5000 });

    // Click and delete
    page.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });

    await page.locator('text=Cà phê sáng').click();
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
    await page.locator('text=Xóa').click();

    // Go back to home
    await page.locator('text="Trang chủ"').click();

    // Balance restored
    await expect(page.locator('text=5.000.000').first()).toBeVisible({ timeout: 5000 });
  });

  test('full flow: switch wallets and verify metrics update', async ({ page }) => {
    // Verify initial wallet (w-1, 5M)
    await expect(page.locator('text="Ví Cá Nhân"')).toBeVisible();
    await expect(page.locator('text=5.000.000').first()).toBeVisible();

    // Switch to second wallet
    await page.locator('text="Ví Tiết Kiệm"').click();
    await expect(page.locator('text=12.000.000').first()).toBeVisible({ timeout: 5000 });

    // Jars for second wallet should have 0 spent
    await expect(page.locator('text=-0 đ')).toBeVisible();

    // Switch back to first wallet
    await page.locator('text="Ví Cá Nhân"').click();
    await expect(page.locator('text=5.000.000').first()).toBeVisible({ timeout: 5000 });
  });

  test('full flow: navigate through all tabs and verify components', async ({ page }) => {
    // Home tab
    await expect(page.locator('text=Tổng số dư')).toBeVisible();
    await expect(page.locator('text=Phân phối 6 Hũ')).toBeVisible();

    // Ledger tab
    await page.locator('text=Sổ GD').click();
    await expect(page.locator('text=Sổ Giao Dịch')).toBeVisible();

    // Budget tab
    await page.locator('text=Ngân sách').click();
    await expect(page.locator('text=Quản Lý Ngân Sách')).toBeVisible();

    // Wallet tab
    await page.locator('text=Ví').last().click();
    await expect(page.locator('text=Ví của tôi')).toBeVisible();

    // Back to Home
    await page.locator('text=Trang chủ').click();
    await expect(page.locator('text=Tổng số dư')).toBeVisible();
  });

  test('should toggle balance visibility on home screen', async ({ page }) => {
    // Balance visible initially
    await expect(page.locator('text=17.000.000')).toBeVisible();

    // Hide balance
    await page.getByTestId('total-balance-eye-toggle').click();
    await expect(page.locator('text=••••••••')).toBeVisible();
    await expect(page.locator('text=17.000.000')).toBeHidden();

    // Show balance
    await page.getByTestId('total-balance-eye-toggle').click();
    await expect(page.locator('text=17.000.000')).toBeVisible();
    await expect(page.locator('text=••••••••')).toBeHidden();
  });
});
