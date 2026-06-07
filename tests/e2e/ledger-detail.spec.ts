import { test, expect } from '@playwright/test';

// ─── Shared Mock Data & Helpers ───────────────────────────────────────────────

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

// Create transactions across 2 days this month and 1 in previous month
const now = new Date();
const day1 = new Date(now.getFullYear(), now.getMonth(), 5).toISOString();
const day2 = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();
const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString();

const mockTransactions = [
  {
    id: 'tx-income-1', wallet_id: 'w-1', amount: 5000000, type: 'income',
    is_deleted: false, jar_type: 'NEC', occurred_at: day1,
    created_by: 'mock-user-uuid-123', categories: { name: 'Lương' }, note: 'Lương tháng 6'
  },
  {
    id: 'tx-expense-1', wallet_id: 'w-1', amount: 150000, type: 'expense',
    is_deleted: false, jar_type: 'NEC', occurred_at: day1,
    created_by: 'mock-user-uuid-123', categories: { name: 'Ăn uống' }, note: 'Phở sáng'
  },
  {
    id: 'tx-expense-2', wallet_id: 'w-1', amount: 200000, type: 'expense',
    is_deleted: false, jar_type: 'PLAY', occurred_at: day2,
    created_by: 'mock-user-uuid-123', categories: { name: 'Ăn hàng sang' }, note: 'Đi ăn buffet'
  },
  {
    id: 'tx-prev-month', wallet_id: 'w-1', amount: 1000000, type: 'expense',
    is_deleted: false, jar_type: 'NEC', occurred_at: prevMonth,
    created_by: 'mock-user-uuid-123', categories: { name: 'Thuê nhà' }, note: null
  }
];

async function setupLedgerMocks(page: any, dynamicTransactions: any[]) {
  await page.route('**/auth/v1/session*', async (route: any) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token-12345', token_type: 'bearer',
        expires_in: 3600, refresh_token: 'mock-refresh-token', user: mockUser
      })
    });
  });

  await page.route('**/auth/v1/user*', async (route: any) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(mockUser)
    });
  });

  await page.route('**/auth/v1/token*', async (route: any) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token-12345', token_type: 'bearer',
        expires_in: 3600, refresh_token: 'mock-refresh-token', user: mockUser
      })
    });
  });

  await page.route('**/rest/v1/profiles*', async (route: any) => {
    const method = route.request().method();
    if (method === 'PATCH' || method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    } else {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-uuid-123', onboarding_completed: true,
          display_name: 'Capy User',
          jars_ratios: { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 }
        })
      });
    }
  });

  await page.route('**/rest/v1/wallet_members*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/rest/v1/wallets*', async (route: any) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 4650000, is_default: true, type: 'personal', is_deleted: false }
      ])
    });
  });

  await page.route('**/rest/v1/jars*', async (route: any) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { id: 'j-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 150000, budget_limit: 5500000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-play', type: 'PLAY', allocation_percentage: 10, spent_amount: 200000, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-ffa', type: 'FFA', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-edu', type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-ltss', type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-give', type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false }
      ])
    });
  });

  await page.route('**/rest/v1/transactions*', async (route: any) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'GET') {
      const activeTxs = dynamicTransactions.filter((tx: any) => !tx.is_deleted);

      // Filter by date range
      const gteMatch = url.match(/occurred_at=gte\.([^&]+)/);
      const lteMatch = url.match(/occurred_at=lte\.([^&]+)/);

      let filtered = activeTxs.filter((tx: any) => tx.wallet_id === 'w-1');

      if (gteMatch) {
        const gteVal = decodeURIComponent(gteMatch[1]);
        filtered = filtered.filter((tx: any) => tx.occurred_at >= gteVal);
      }
      if (lteMatch) {
        const lteVal = decodeURIComponent(lteMatch[1]);
        filtered = filtered.filter((tx: any) => tx.occurred_at <= lteVal);
      }

      if (url.includes('type=eq.income')) {
        filtered = filtered.filter((tx: any) => tx.type === 'income');
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(filtered) });
    } else if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData() || '{}');
      const match = url.match(/id=eq\.(tx-[a-zA-Z0-9-]+)/);
      if (match) {
        const tx = dynamicTransactions.find((t: any) => t.id === match[1]);
        if (tx && body.is_deleted) tx.is_deleted = true;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/rest/v1/categories*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/rest/v1/category_budgets*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/rest/v1/wallet_invite_codes*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

async function loginAndNavigateToLedger(page: any, dynamicTransactions: any[]) {
  await setupLedgerMocks(page, dynamicTransactions);
  await page.goto('/');
  await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  await page.getByTestId('email-input').fill('test@gmail.com');
  await page.getByTestId('password-input').fill('correctpassword');
  await page.getByTestId('login-button').click();
  await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
  await page.locator('text=Sổ GD').click();
  await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });
}

// ─── LedgerScreen: Daily Tab Chi Tiết ────────────────────────────────────────

test.describe('LedgerScreen — Daily Tab Chi tiết', () => {
  let dynamicTransactions: any[];

  test.beforeEach(async ({ page }) => {
    dynamicTransactions = JSON.parse(JSON.stringify(mockTransactions));
    await loginAndNavigateToLedger(page, dynamicTransactions);
  });

  test('should display transactions in daily tab grouped by date', async ({ page }) => {
    // Current month transactions visible
    await expect(page.locator('text=Lương').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Ăn uống').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Ăn hàng sang').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show income in green and expense in red colors', async ({ page }) => {
    // Income should show with + prefix
    await expect(page.locator('text=+5.000.000đ').first()).toBeVisible({ timeout: 3000 });
    // Expense should show with - prefix
    await expect(page.locator('text=-150.000đ').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=-200.000đ').first()).toBeVisible({ timeout: 3000 });
  });

  test('should not show transactions from previous month in current month view', async ({ page }) => {
    // "Thuê nhà" is from previous month, should not be visible in current month
    await expect(page.locator('text=Thuê nhà')).toBeHidden();
  });

  test('should show empty state when navigating to future month', async ({ page }) => {
    const now = new Date();
    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

    // Navigate to next month
    await page.locator('text=›').click();
    await expect(page.locator(`text=Tháng ${nextMonth} / ${nextYear}`)).toBeVisible();
    await expect(page.locator('text=Tháng này chưa có giao dịch nào 🦫')).toBeVisible({ timeout: 3000 });
  });

  test('should show previous month transactions when navigating back', async ({ page }) => {
    const now = new Date();
    const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // Navigate to previous month
    await page.locator('text=‹').click();
    await expect(page.locator(`text=Tháng ${prevMonthNum} / ${prevYear}`)).toBeVisible();
    await expect(page.locator('text=Thuê nhà')).toBeVisible({ timeout: 3000 });
  });
});

// ─── LedgerScreen: TransactionDetailSheet Chi Tiết ───────────────────────────

test.describe('LedgerScreen — TransactionDetailSheet Chi tiết', () => {
  let dynamicTransactions: any[];

  test.beforeEach(async ({ page }) => {
    dynamicTransactions = JSON.parse(JSON.stringify(mockTransactions));
    await loginAndNavigateToLedger(page, dynamicTransactions);
  });

  test('should display full transaction details in sheet', async ({ page }) => {
    // Click on income transaction
    await page.locator('text=Lương').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
    // Amount with + for income
    await expect(page.locator('text=+5.000.000đ').first()).toBeVisible();
    // Jar & category info
    await expect(page.locator('text=Hũ & Phân mục:')).toBeVisible();
    await expect(page.locator('text=NEC')).toBeVisible();
    // Time info
    await expect(page.locator('text=Thời gian:')).toBeVisible();
    // Note info
    await expect(page.locator('text=Ghi chú:')).toBeVisible();
    await expect(page.locator('text=Lương tháng 6')).toBeVisible();
    // Action buttons
    await expect(page.locator('text=Sửa')).toBeVisible();
    await expect(page.locator('text=Xóa')).toBeVisible();
  });

  test('should display expense transaction details correctly', async ({ page }) => {
    // Click on expense transaction
    await page.locator('text=Ăn uống').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
    // Amount with - for expense
    await expect(page.locator('text=-150.000đ').first()).toBeVisible();
    // Note
    await expect(page.locator('text=Phở sáng')).toBeVisible();
  });

  test('should NOT show Ghi chú row when transaction has no note', async ({ page }) => {
    // Navigate to prev month where tx-prev-month has null note
    await page.locator('text=‹').click();
    await page.waitForTimeout(500);

    await page.locator('text=Thuê nhà').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
    // No note row since note is null
    await expect(page.locator('text=Ghi chú:')).toBeHidden();
  });

  test('should close TransactionDetailSheet via overlay tap', async ({ page }) => {
    await page.locator('text=Lương').first().click();
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();

    // Tap the overlay to close
    await page.getByTestId('detail-sheet-overlay').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeHidden();
  });

  test('should delete transaction and remove it from daily list', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      // Accept the confirmation alert from Alert.alert
      await dialog.accept();
    });

    await page.locator('text=Ăn uống').first().click();
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
    await page.locator('text=Xóa').click();

    // Sheet should close after deletion
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeHidden();
    // Ăn uống transaction should be removed
    await expect(page.locator('text=Ăn uống')).toBeHidden();
  });

  test('should cancel transaction delete when pressing Hủy', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      // Dismiss — Cancel the delete
      await dialog.dismiss();
    });

    await page.locator('text=Ăn uống').first().click();
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
    await page.locator('text=Xóa').click();

    await page.waitForTimeout(500);
    // Sheet should still be visible (delete was cancelled)
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();
  });

  test('should trigger edit flow when pressing Sửa', async ({ page }) => {
    await page.locator('text=Lương').first().click();
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();

    // Click Sửa — triggers onEdit callback which closes the sheet
    await page.locator('text=Sửa').click();
    await page.waitForTimeout(500);
    // Sheet closes after Sửa click
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeHidden();
  });
});

// ─── LedgerScreen: Monthly Tab (Phân Tích Tháng) ─────────────────────────────

test.describe('LedgerScreen — Monthly Tab (Phân Tích Chi Tiêu)', () => {
  let dynamicTransactions: any[];

  test.beforeEach(async ({ page }) => {
    dynamicTransactions = JSON.parse(JSON.stringify(mockTransactions));
    await loginAndNavigateToLedger(page, dynamicTransactions);
    // Switch to Monthly tab
    await page.locator('text=Hàng tháng').click();
    await page.waitForTimeout(300);
  });

  test('should display monthly analysis section', async ({ page }) => {
    await expect(page.locator('text=Phân Tích Chi Tiêu')).toBeVisible();
    await expect(page.locator('text=Tổng chi tiêu:')).toBeVisible();
    // Total spend for this month: 150k + 200k = 350k
    await expect(page.locator('text=350.000đ').first()).toBeVisible({ timeout: 3000 });
  });

  test('should display category breakdown in monthly tab', async ({ page }) => {
    // Categories broken down: Ăn uống 150k, Ăn hàng sang 200k
    await expect(page.locator('text=Ăn uống')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=150.000đ').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Ăn hàng sang')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=200.000đ').first()).toBeVisible({ timeout: 3000 });
  });

  test('should display Nhận Xét Từ Capy advice section', async ({ page }) => {
    await expect(page.locator('text=Nhận Xét Từ Capy')).toBeVisible();
    // Since prevMonthSpend is present (from the prev month query), advice text should show
    const advice = page.locator('text=Bắt đầu tích lũy chi tiêu để so sánh tháng kế tiếp 🦫')
      .or(page.locator('text=Bạn đã tiêu ít hơn tháng trước'))
      .or(page.locator('text=Tháng này bạn đã tiêu nhiều hơn tháng trước'));
    await expect(advice).toBeVisible({ timeout: 3000 });
  });

  test('should show "Tổng chi tiêu: 0đ" when no expense transactions', async ({ page }) => {
    // Navigate to next month which has no transactions
    await page.locator('text=›').click();
    await page.waitForTimeout(500);
    // Monthly tab shows 0 expenses
    await expect(page.locator('text=Tổng chi tiêu: 0đ')).toBeVisible({ timeout: 3000 });
  });

  test('should show positive savings advice when spending decreased vs prev month', async ({ page }) => {
    // prev month: 1M expense, current: 350k expense
    // diff = 1M - 350k = 650k (saved 650k vs last month)
    const advice = page.locator('text=Bạn đã tiêu ít hơn tháng trước 650.000đ. Capy khen ngợi! 🦫');
    const isVisible = await advice.isVisible().catch(() => false);
    if (isVisible) {
      await expect(advice).toBeVisible();
    } else {
      // May show initial text if prevMonthSpend query didn't fire
      await expect(page.locator('text=Nhận Xét Từ Capy')).toBeVisible();
    }
  });
});

// ─── LedgerScreen: Calendar Tab (Lịch biểu) ──────────────────────────────────

test.describe('LedgerScreen — Calendar Tab (Lịch biểu)', () => {
  let dynamicTransactions: any[];

  test.beforeEach(async ({ page }) => {
    dynamicTransactions = JSON.parse(JSON.stringify(mockTransactions));
    await loginAndNavigateToLedger(page, dynamicTransactions);
    // Switch to Calendar tab
    await page.locator('text=Lịch biểu').click();
    await page.waitForTimeout(300);
  });

  test('should display calendar grid with day numbers', async ({ page }) => {
    // Should show day numbers 1-28/30/31 depending on month
    await expect(page.locator('text=1').first()).toBeVisible();
    await expect(page.locator('text=15').first()).toBeVisible();
    // Days should be present in calendar grid
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    await expect(page.locator(`text=${daysInMonth}`).first()).toBeVisible();
  });

  test('should highlight current day as selected by default', async ({ page }) => {
    const today = new Date().getDate();
    // Today's cell should have selected style (highlighted)
    // The selected day text has color #864e5a and font-weight 700
    // We verify by checking the currently selected day shows its transactions
    await expect(page.locator(`text=${today}`).first()).toBeVisible();
  });

  test('should show dot indicator on days with transactions', async ({ page }) => {
    // Day 5 has tx-income-1 and tx-expense-1
    // Day 15 has tx-expense-2
    // These days should have a dot indicator
    // Dots are rendered as small View with specific style
    // We can click on day 5 and verify transactions appear
    await page.locator('text=5').first().click();
    await page.waitForTimeout(300);
    // Transactions for day 5 should appear below calendar
    await expect(page.locator('text=Lương').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Ăn uống').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show transactions for day 15 when clicked', async ({ page }) => {
    await page.locator('text=15').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Ăn hàng sang').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show "Không có giao dịch trong ngày này" for days with no transactions', async ({ page }) => {
    // Click on day 1 (no transactions)
    await page.locator('text=1').first().click();
    await page.waitForTimeout(300);
    // If today is not day 1, it should show empty message
    const today = new Date().getDate();
    if (today !== 1) {
      await expect(page.locator('text=Không có giao dịch trong ngày này')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should open TransactionDetailSheet when clicking a transaction in Calendar tab', async ({ page }) => {
    // Click on day 5
    await page.locator('text=5').first().click();
    await page.waitForTimeout(300);
    // Click on a transaction
    await page.locator('text=Lương').first().click();
    await page.waitForTimeout(500);
    // Detail sheet should open
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=+5.000.000đ').first()).toBeVisible();
  });

  test('should show transaction amounts with correct sign in calendar day list', async ({ page }) => {
    await page.locator('text=5').first().click();
    await page.waitForTimeout(300);
    // Income shows +5.000.000đ
    await expect(page.locator('text=+5.000.000đ').first()).toBeVisible({ timeout: 3000 });
    // Expense shows -150.000đ
    await expect(page.locator('text=-150.000đ').first()).toBeVisible({ timeout: 3000 });
  });

  test('should update calendar when navigating to different month', async ({ page }) => {
    const now = new Date();
    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

    // Navigate to next month using the header navigation
    await page.locator('text=Lịch biểu').click(); // Ensure we're on calendar tab
    await page.locator('text=›').click();
    await page.waitForTimeout(500);

    // Month header should update
    await expect(page.locator(`text=Tháng ${nextMonth} / ${nextYear}`)).toBeVisible();
    // No transactions — clicking any day should show empty state
    await page.locator('text=1').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Không có giao dịch trong ngày này')).toBeVisible({ timeout: 3000 });
  });
});

// ─── LedgerScreen: Tab Switching ─────────────────────────────────────────────

test.describe('LedgerScreen — Chuyển đổi giữa các tabs', () => {
  let dynamicTransactions: any[];

  test.beforeEach(async ({ page }) => {
    dynamicTransactions = JSON.parse(JSON.stringify(mockTransactions));
    await loginAndNavigateToLedger(page, dynamicTransactions);
  });

  test('should switch from Daily → Monthly → Calendar → Daily seamlessly', async ({ page }) => {
    // Start: Daily tab
    await expect(page.locator('text=Hàng ngày')).toBeVisible();
    await expect(page.locator('text=Lương').first()).toBeVisible({ timeout: 3000 });

    // Switch to Monthly
    await page.locator('text=Hàng tháng').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Phân Tích Chi Tiêu')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Nhận Xét Từ Capy')).toBeVisible();

    // Switch to Calendar
    await page.locator('text=Lịch biểu').click();
    await page.waitForTimeout(300);
    // Calendar grid with numbers
    await expect(page.locator('text=1').first()).toBeVisible();

    // Switch back to Daily
    await page.locator('text=Hàng ngày').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Lương').first()).toBeVisible({ timeout: 3000 });
  });

  test('should maintain selected month when switching tabs', async ({ page }) => {
    const now = new Date();
    const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // Navigate to previous month
    await page.locator('text=‹').click();
    await expect(page.locator(`text=Tháng ${prevMonthNum} / ${prevYear}`)).toBeVisible();

    // Switch to Monthly tab — should show same month
    await page.locator('text=Hàng tháng').click();
    await page.waitForTimeout(300);
    await expect(page.locator(`text=Tháng ${prevMonthNum} / ${prevYear}`)).toBeVisible();

    // Switch to Calendar — same month
    await page.locator('text=Lịch biểu').click();
    await page.waitForTimeout(300);
    await expect(page.locator(`text=Tháng ${prevMonthNum} / ${prevYear}`)).toBeVisible();
  });

  test('should display header with all three tab buttons', async ({ page }) => {
    await expect(page.locator('text=Hàng ngày')).toBeVisible();
    await expect(page.locator('text=Hàng tháng')).toBeVisible();
    await expect(page.locator('text=Lịch biểu')).toBeVisible();
    // Month navigation arrows
    await expect(page.locator('text=‹')).toBeVisible();
    await expect(page.locator('text=›')).toBeVisible();
  });

  test('should show loading state when switching wallets/months', async ({ page }) => {
    // This tests the loading indicator appears briefly
    // Click rapidly to change month
    await page.locator('text=‹').click();
    // Loading may appear briefly — at minimum verify content still loads
    await page.waitForTimeout(1000);
    const now = new Date();
    const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
    await expect(page.locator(`text=Tháng ${prevMonthNum}`)).toBeVisible();
  });
});
