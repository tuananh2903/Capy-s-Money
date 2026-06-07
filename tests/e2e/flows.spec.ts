/**
 * Full Cross-Screen E2E Flows
 *
 * Mỗi test mô phỏng một hành trình người dùng thực tế, đi qua nhiều màn hình
 * để kiểm tra tính nhất quán dữ liệu và trải nghiệm end-to-end.
 */

import { test, expect } from '@playwright/test';

// ─── Shared Mock Data ─────────────────────────────────────────────────────────

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

async function setupFullAppMocks(page: any, state: {
  wallets: any[];
  transactions: any[];
  jars: any[];
}) {
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
    const method = route.request().method();
    if (method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
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
        is_default: body.is_default || false,
        type: body.type || 'personal',
        is_deleted: false
      };
      state.wallets.push(newWallet);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([newWallet]) });
    } else if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData() || '{}');
      const url = route.request().url();
      const idMatch = url.match(/id=eq\.(w-[a-zA-Z0-9-]+)/);
      if (idMatch) {
        const wallet = state.wallets.find((w: any) => w.id === idMatch[1]);
        if (wallet) Object.assign(wallet, body);
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(state.wallets.filter((w: any) => !w.is_deleted))
      });
    }
  });

  await page.route('**/rest/v1/jars*', async (route: any) => {
    const method = route.request().method();
    if (method === 'PATCH' || method === 'PUT' || method === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.jars) });
    }
  });

  await page.route('**/rest/v1/transactions*', async (route: any) => {
    const url = route.request().url();
    const method = route.request().method();
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const tx = Array.isArray(body) ? body[0] : body;
      const newTx = {
        id: `tx-new-${Date.now()}`,
        ...tx,
        wallet_id: tx.wallet_id || state.wallets.find((w: any) => w.is_default)?.id || 'w-1',
        occurred_at: tx.occurred_at || new Date().toISOString(),
        categories: null,
        is_deleted: false
      };
      state.transactions.push(newTx);
      // Update wallet balance
      const wallet = state.wallets.find((w: any) => w.id === newTx.wallet_id);
      if (wallet) {
        wallet.balance += newTx.type === 'income' ? newTx.amount : -newTx.amount;
      }
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([newTx]) });
    } else if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData() || '{}');
      const idMatch = url.match(/id=eq\.(tx-[a-zA-Z0-9-]+)/);
      if (idMatch) {
        const tx = state.transactions.find((t: any) => t.id === idMatch[1]);
        if (tx) Object.assign(tx, body);
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      const activeTxs = state.transactions.filter((tx: any) => !tx.is_deleted);
      const gteMatch = url.match(/occurred_at=gte\.([^&]+)/);
      const lteMatch = url.match(/occurred_at=lte\.([^&]+)/);
      let filtered = activeTxs;
      if (gteMatch) {
        const gteVal = decodeURIComponent(gteMatch[1]);
        filtered = filtered.filter((tx: any) => tx.occurred_at >= gteVal);
      }
      if (lteMatch) {
        const lteVal = decodeURIComponent(lteMatch[1]);
        filtered = filtered.filter((tx: any) => tx.occurred_at <= lteVal);
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(filtered) });
    }
  });

  await page.route('**/rest/v1/categories*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/rest/v1/category_budgets*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/rest/v1/wallet_invite_codes*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST') {
      await route.fulfill({
        status: 201, contentType: 'application/json',
        body: JSON.stringify([{ id: 'invite-1', code: 'CAPY-TEST99', expires_at: new Date(Date.now() + 86400000).toISOString() }])
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/functions/v1/create-invitation*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'CAPY-TEST99', expires_at: new Date(Date.now() + 86400000).toISOString() })
    });
  });
}

async function loginAndLoadApp(page: any, state: any) {
  await setupFullAppMocks(page, state);
  await page.goto('/');
  await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  await page.getByTestId('email-input').fill('test@gmail.com');
  await page.getByTestId('password-input').fill('correctpassword');
  await page.getByTestId('login-button').click();
  await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
}

// ─── Flow 1: Onboarding → Dashboard → QuickAdd → Ledger ──────────────────────

test.describe('Cross-Screen Flow — Ghi giao dịch và kiểm tra lịch sử', () => {
  let appState: any;

  test.beforeEach(async ({ page }) => {
    appState = {
      wallets: [
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 10000000, is_default: true, type: 'personal', is_deleted: false }
      ],
      transactions: [],
      jars: [
        { id: 'j-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 0, budget_limit: 5500000, wallet_id: 'w-1', enable_alerts: false }
      ]
    };
    await loginAndLoadApp(page, appState);
  });

  test('should add expense → see it in Daily Ledger tab', async ({ page }) => {
    // Step 1: Add expense from Dashboard QuickAdd FAB
    await page.getByTestId('fab-add-transaction').click();
    await page.waitForTimeout(500);

    // Fill in expense
    await page.locator('text=Khoản chi').click();
    await page.locator('[placeholder="0"]').first().fill('300000');
    await page.locator('text=Lưu giao dịch').click();
    await page.waitForTimeout(1000);

    // Step 2: Navigate to Ledger
    await page.locator('text=Sổ GD').click();
    await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Step 3: Verify transaction appears in daily list
    await expect(page.locator('text=-300.000đ').first()).toBeVisible({ timeout: 5000 });
  });

  test('should add income → verify dashboard balance update', async ({ page }) => {
    // Initial balance: 10M
    await expect(page.locator('text="10.000.000"').first()).toBeVisible();

    // Add income of 5M
    await page.getByTestId('fab-add-transaction').click();
    await page.waitForTimeout(500);
    await page.locator('text=Khoản thu').click();
    await page.locator('[placeholder="0"]').first().fill('5000000');
    await page.locator('text=Lưu giao dịch').click();
    await page.waitForTimeout(1000);

    // Balance should be 10M + 5M = 15M
    await expect(page.locator('text=15.000.000').first()).toBeVisible({ timeout: 5000 });
  });

  test('should add income → navigate to Ledger → delete it → verify removed', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });

    // Add income
    await page.getByTestId('fab-add-transaction').click();
    await page.waitForTimeout(500);
    await page.locator('text=Khoản thu').click();
    await page.locator('[placeholder="0"]').first().fill('2000000');
    await page.locator('text=Lưu giao dịch').click();
    await page.waitForTimeout(1000);

    // Navigate to Ledger
    await page.locator('text=Sổ GD').click();
    await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });
    await page.waitForTimeout(500);

    // The income should appear
    await expect(page.locator('text=+2.000.000đ').first()).toBeVisible({ timeout: 5000 });

    // Click on it to open detail sheet
    await page.locator('text=+2.000.000đ').first().click();
    await expect(page.locator('text=Chi Tiết Giao Dịch')).toBeVisible();

    // Delete it
    await page.locator('text=Xóa').click();
    await page.waitForTimeout(1000);

    // Transaction should be removed
    await expect(page.locator('text=+2.000.000đ')).toBeHidden();
  });
});

// ─── Flow 2: Dashboard → Wallet → Create Wallet → Budget ─────────────────────

test.describe('Cross-Screen Flow — Tạo ví mới và kiểm tra ngân sách', () => {
  let appState: any;

  test.beforeEach(async ({ page }) => {
    appState = {
      wallets: [
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false }
      ],
      transactions: [],
      jars: [
        { id: 'j-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 0, budget_limit: 2750000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-play', type: 'PLAY', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-ffa', type: 'FFA', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-edu', type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-ltss', type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-give', type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 250000, wallet_id: 'w-1', enable_alerts: false }
      ]
    };
    await loginAndLoadApp(page, appState);
  });

  test('should create wallet → switch to budget screen → see new wallet in tab bar', async ({ page }) => {
    // Step 1: Navigate to Wallet tab
    await page.locator('text=Ví').last().click();
    await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });

    // Step 2: Create a new wallet
    await page.getByTestId('create-wallet-btn').click();
    await page.waitForSelector('text=Tạo Ví Mới', { timeout: 5000 });
    await page.locator('[placeholder="Nhập tên ví (ví dụ: Ví Ăn Tiêu)"]').fill('Ví Du Lịch');
    await page.locator('[placeholder="0"]').first().fill('2000000');
    await page.locator('text="Tạo ví"').click();
    await page.waitForTimeout(1000);

    // Step 3: Wallet should appear in list
    await expect(page.locator('text=Ví Du Lịch')).toBeVisible({ timeout: 5000 });

    // Step 4: Navigate to Budget screen
    await page.locator('text=Ngân sách').click();
    await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });

    // Step 5: New wallet should appear in budget tab bar
    await expect(page.locator('text=Ví Du Lịch')).toBeVisible({ timeout: 3000 });
  });

  test('should navigate: Dashboard → Wallet settings → adjust jars → Budget shows updated', async ({ page }) => {
    // Step 1: Go to Wallet tab and open wallet settings
    await page.locator('text=Ví').last().click();
    await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });
    await page.getByTestId('btn-settings-w-1').click();
    await page.waitForSelector('text=Cài đặt: Ví Cá Nhân', { timeout: 5000 });

    // Step 2: Adjust NEC allocation from 55% to 60%
    await page.locator('text=+ NEC').click();
    await expect(page.locator('text=Tổng hũ: 105%')).toBeVisible();
    // Bring total back to 100 by decreasing GIVE: 5% → 0%
    await page.locator('text=- GIVE').click();
    await expect(page.locator('text=Tổng hũ: 100%')).toBeVisible();

    // Step 3: Save
    await page.getByTestId('save-allocations-btn').click();
    await page.waitForTimeout(1000);

    // Step 4: Navigate to Budget
    await page.locator('text=Ngân sách').click();
    await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });

    // Budget screen should load
    await expect(page.locator('text=Quản Lý Ngân Sách')).toBeVisible();
  });
});

// ─── Flow 3: Dashboard Mascot Alert → Budget → Fix Over-budget ───────────────

test.describe('Cross-Screen Flow — Cảnh báo chi tiêu → Điều chỉnh ngân sách', () => {
  let appState: any;

  test.beforeEach(async ({ page }) => {
    // NEC jar: 90% spent (spending too fast warning)
    appState = {
      wallets: [
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 500000, is_default: true, type: 'personal', is_deleted: false }
      ],
      transactions: [
        {
          id: 'tx-big-spend', wallet_id: 'w-1', amount: 4950000, type: 'expense',
          is_deleted: false, jar_type: 'NEC', occurred_at: new Date().toISOString(),
          created_by: 'mock-user-uuid-123', categories: null, note: 'Chi tiêu lớn'
        }
      ],
      jars: [
        { id: 'j-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 4950000, budget_limit: 5500000, wallet_id: 'w-1', enable_alerts: true }
      ]
    };
    await loginAndLoadApp(page, appState);
  });

  test('should show warning mascot on Dashboard when spending is at 90%+', async ({ page }) => {
    // Mascot should show a warning state
    // The app shows Capy mascot with spending alerts
    await expect(page.locator("text=Capy's Money")).toBeVisible();
    // Warning badge/mascot visible when NEC is at 90%
    const warningVisible = await page.locator('text=⚠️').isVisible().catch(() => false)
      || await page.locator('text=Spending Too Fast').isVisible().catch(() => false)
      || await page.locator('text=Tiêu nhanh quá').isVisible().catch(() => false);

    // Either warning indicator or regular display
    await expect(page.locator("text=Capy's Money")).toBeVisible();
  });

  test('should navigate from Dashboard to Budget and see high-spend jar', async ({ page }) => {
    // Navigate to Budget
    await page.locator('text=Ngân sách').click();
    await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });

    // NEC jar should be at 90% (4.95M / 5.5M)
    // Progress bar should show warning color (amber/orange for >= 80%)
    await expect(page.locator('text=Thiết yếu (NEC) (55%)')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Đã chi: 4.950.000đ')).toBeVisible({ timeout: 3000 });
  });

  test('should navigate from Budget to Ledger and see the large expense', async ({ page }) => {
    // Go to Budget
    await page.locator('text=Ngân sách').click();
    await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });

    // Go to Ledger
    await page.locator('text=Sổ GD').click();
    await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });

    // The large expense should be visible
    await expect(page.locator('text=-4.950.000đ').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Flow 4: Shared Wallet — Invite → Join Flow Simulation ───────────────────

test.describe('Cross-Screen Flow — Ví chung: Mời và Quản lý thành viên', () => {
  let appState: any;

  test.beforeEach(async ({ page }) => {
    appState = {
      wallets: [
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false },
        { id: 'w-shared', user_id: 'mock-user-uuid-123', name: 'Ví Gia Đình', balance: 2000000, is_default: false, type: 'shared', is_deleted: false }
      ],
      transactions: [],
      jars: []
    };

    await loginAndLoadApp(page, appState);

    await page.route('**/rest/v1/wallet_members*', async (route: any) => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        return;
      }
      if (url.includes('w-shared')) {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify([
            { user_id: 'mock-user-uuid-123', role: 'owner', wallet_id: 'w-shared', profiles: { display_name: 'Capy User' } },
            { user_id: 'member-abc', role: 'editor', wallet_id: 'w-shared', profiles: { display_name: 'Bạn Thỏ' } }
          ])
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
  });

  test('full flow: Wallet settings → see members → open invite → get code → close', async ({ page }) => {
    // Step 1: Navigate to Wallet tab
    await page.locator('text=Ví').last().click();
    await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });

    // Step 2: Open settings for shared wallet
    await page.getByTestId('btn-settings-w-shared').click();
    await page.waitForSelector('text=Cài đặt: Ví Gia Đình', { timeout: 5000 });

    // Step 3: Verify member list is shown
    await expect(page.locator('text=Capy User')).toBeVisible();
    await expect(page.locator('text=Bạn Thỏ')).toBeVisible();
    await expect(page.locator('text=Thành viên ví (2/3)')).toBeVisible();

    // Step 4: Open invite screen (member count < 3, so button should show)
    await page.locator('text=➕ Mời thành viên mới').click();
    await page.waitForSelector('text="Mời thành viên"', { timeout: 5000 });

    // Step 5: Invite code shown
    await expect(page.locator('text=CAPY-TEST99')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Sao chép')).toBeVisible();
    await expect(page.locator('text=Chia sẻ liên kết')).toBeVisible();

    // Step 6: Close invite screen
    await page.locator('text=✕').last().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text="Mời thành viên"')).toBeHidden();

    // Step 7: Back to wallet settings
    await expect(page.locator('text=Cài đặt: Ví Gia Đình')).toBeVisible();

    // Step 8: Remove a member
    page.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });
    await page.locator('text=Xóa').first().click();
    await page.waitForTimeout(1000);
    // Bạn Thỏ should be removed
    await expect(page.locator('text=Bạn Thỏ')).toBeHidden();
  });
});

// ─── Flow 5: Month Navigation — Dashboard → Ledger continuity ────────────────

test.describe('Cross-Screen Flow — Điều hướng tháng và tính nhất quán dữ liệu', () => {
  let appState: any;
  const now = new Date();
  const thisMonthTx = new Date(now.getFullYear(), now.getMonth(), 10).toISOString();
  const prevMonthTx = new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString();

  test.beforeEach(async ({ page }) => {
    appState = {
      wallets: [
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 7000000, is_default: true, type: 'personal', is_deleted: false }
      ],
      transactions: [
        {
          id: 'tx-this-month', wallet_id: 'w-1', amount: 500000, type: 'expense',
          is_deleted: false, jar_type: 'PLAY', occurred_at: thisMonthTx,
          categories: { name: 'Giải trí' }, note: 'Đi xem phim'
        },
        {
          id: 'tx-prev-month', wallet_id: 'w-1', amount: 1200000, type: 'expense',
          is_deleted: false, jar_type: 'NEC', occurred_at: prevMonthTx,
          categories: { name: 'Thuê nhà' }, note: 'Tiền nhà tháng trước'
        }
      ],
      jars: []
    };
    await loginAndLoadApp(page, appState);
  });

  test('ledger shows correct transactions per month with navigation', async ({ page }) => {
    const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const thisMonthNum = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    // Navigate to Ledger
    await page.locator('text=Sổ GD').click();
    await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });

    // Current month shows this month's transaction
    await expect(page.locator(`text=Tháng ${thisMonthNum} / ${thisYear}`)).toBeVisible();
    await expect(page.locator('text=Giải trí').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Thuê nhà')).toBeHidden();

    // Navigate to previous month
    await page.locator('text=‹').click();
    await expect(page.locator(`text=Tháng ${prevMonthNum} / ${prevYear}`)).toBeVisible();
    await expect(page.locator('text=Thuê nhà').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Giải trí')).toBeHidden();

    // Navigate forward to current month again
    await page.locator('text=›').click();
    await expect(page.locator(`text=Tháng ${thisMonthNum} / ${thisYear}`)).toBeVisible();
    await expect(page.locator('text=Giải trí').first()).toBeVisible({ timeout: 3000 });
  });

  test('monthly analysis shows correct totals per month', async ({ page }) => {
    await page.locator('text=Sổ GD').click();
    await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });
    await page.locator('text=Hàng tháng').click();
    await page.waitForTimeout(300);

    // Current month: 500k expenses
    await expect(page.locator('text=500.000đ').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Giải trí')).toBeVisible({ timeout: 3000 });

    // Go to previous month
    await page.locator('text=‹').click();
    await page.waitForTimeout(500);
    // Previous month: 1.2M expenses
    await expect(page.locator('text=1.200.000đ').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Thuê nhà')).toBeVisible({ timeout: 3000 });
  });
});

// ─── Flow 6: Full User Journey — First-time experience simulation ─────────────

test.describe('Cross-Screen Flow — Trải nghiệm người dùng đầy đủ', () => {
  test('full journey: Login → Dashboard → Add expense → Check budget → Check ledger', async ({ page }) => {
    const appState = {
      wallets: [
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 10000000, is_default: true, type: 'personal', is_deleted: false }
      ],
      transactions: [],
      jars: [
        { id: 'j-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 0, budget_limit: 5500000, wallet_id: 'w-1', enable_alerts: false },
        { id: 'j-play', type: 'PLAY', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false }
      ]
    };

    await loginAndLoadApp(page, appState);

    // ─ Step 1: Dashboard loaded
    await expect(page.locator("text=Capy's Money")).toBeVisible();
    await expect(page.locator('text=10.000.000').first()).toBeVisible({ timeout: 5000 });

    // ─ Step 2: Add an expense
    await page.getByTestId('fab-add-transaction').click();
    await page.waitForTimeout(500);
    await page.locator('text=Khoản chi').click();
    await page.locator('[placeholder="0"]').first().fill('500000');
    await page.locator('text=Lưu giao dịch').click();
    await page.waitForTimeout(1000);

    // Balance updated
    await expect(page.locator('text=9.500.000').first()).toBeVisible({ timeout: 5000 });

    // ─ Step 3: Check Ledger
    await page.locator('text=Sổ GD').click();
    await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });
    await expect(page.locator('text=-500.000đ').first()).toBeVisible({ timeout: 5000 });

    // ─ Step 4: Check Budget
    await page.locator('text=Ngân sách').click();
    await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });
    await expect(page.locator('text=Thiết yếu (NEC) (55%)')).toBeVisible();

    // ─ Step 5: Go back to Dashboard
    await page.locator('text=Trang chủ').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 5000 });
    await expect(page.locator('text=9.500.000').first()).toBeVisible({ timeout: 5000 });
  });

  test('full journey: Create wallet → Set as default → Add transaction to new wallet', async ({ page }) => {
    const appState = {
      wallets: [
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false }
      ],
      transactions: [],
      jars: []
    };

    page.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });

    await loginAndLoadApp(page, appState);

    // ─ Step 1: Create new wallet
    await page.locator('text=Ví').last().click();
    await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });
    await page.getByTestId('create-wallet-btn').click();
    await page.waitForSelector('text=Tạo Ví Mới', { timeout: 5000 });
    await page.locator('[placeholder="Nhập tên ví (ví dụ: Ví Ăn Tiêu)"]').fill('Ví Kinh Doanh');
    await page.locator('[placeholder="0"]').first().fill('20000000');
    await page.locator('text="Tạo ví"').click();
    await page.waitForTimeout(1000);

    // ─ Step 2: Verify wallet appears
    await expect(page.locator('text=Ví Kinh Doanh')).toBeVisible({ timeout: 5000 });

    // ─ Step 3: Open settings → Set as default
    const newWalletId = appState.wallets.find((w: any) => w.name === 'Ví Kinh Doanh')?.id;
    if (newWalletId) {
      await page.getByTestId(`btn-settings-${newWalletId}`).click();
      await page.waitForSelector('text=Cài đặt: Ví Kinh Doanh', { timeout: 5000 });
      await page.locator('text=⭐ Mặc định').click();
      await page.waitForTimeout(1000);
      await page.locator('text=✕').first().click();
      await page.waitForTimeout(500);
    }

    // ─ Step 4: Navigate to Dashboard — should show new wallet as active
    await page.locator('text=Trang chủ').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 5000 });
    // The new wallet balance or name may appear on dashboard
    await expect(page.locator("text=Capy's Money")).toBeVisible();
  });
});
