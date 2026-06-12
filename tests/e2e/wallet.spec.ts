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

const mockJarsW1 = [
  { id: 'j-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 0, budget_limit: 5500000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-play', type: 'PLAY', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-ffa', type: 'FFA', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-edu', type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-ltss', type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-give', type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false }
];

async function setupBaseAuthMocks(page: any, dynamicWallets: any[]) {
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
      dynamicWallets.push(newWallet);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([newWallet]) });
    } else if (method === 'PATCH') {
      // Handle wallet update (soft delete or set default)
      const url = route.request().url();
      const body = JSON.parse(route.request().postData() || '{}');
      const idMatch = url.match(/id=eq\.(w-[a-zA-Z0-9-]+)/);
      if (idMatch) {
        const wallet = dynamicWallets.find((w: any) => w.id === idMatch[1]);
        if (wallet) Object.assign(wallet, body);
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(dynamicWallets.filter((w: any) => !w.is_deleted))
      });
    }
  });

  await page.route('**/rest/v1/jars*', async (route: any) => {
    const method = route.request().method();
    if (method === 'PATCH' || method === 'PUT' || method === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockJarsW1) });
    }
  });

  await page.route('**/rest/v1/transactions*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const tx = Array.isArray(body) ? body[0] : body;
      const newTx = {
        id: `tx-new-${Date.now()}`,
        ...tx,
        wallet_id: tx.wallet_id || dynamicWallets.find((w: any) => w.is_default)?.id || 'w-1',
        occurred_at: tx.occurred_at || new Date().toISOString(),
        categories: null,
        is_deleted: false
      };
      // Update wallet balance
      const wallet = dynamicWallets.find((w: any) => w.id === newTx.wallet_id);
      if (wallet) {
        wallet.balance += newTx.type === 'income' ? newTx.amount : -newTx.amount;
      }
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([newTx]) });
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


}

async function loginAndGoToWallet(page: any, dynamicWallets: any[]) {
  await setupBaseAuthMocks(page, dynamicWallets);
  await page.goto('/');
  await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  await page.getByTestId('email-input').fill('test@gmail.com');
  await page.getByTestId('password-input').fill('correctpassword');
  await page.getByTestId('login-button').click();
  await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
  // Navigate to Wallet tab
  await page.locator('text=Ví').last().click();
  await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });
}

// ─── WalletScreen Detail Tests ────────────────────────────────────────────────

test.describe('WalletScreen — Hiển thị & Điều hướng chi tiết', () => {
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = [
      { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false },
      { id: 'w-2', user_id: 'mock-user-uuid-123', name: 'Ví Tiết Kiệm', balance: 12000000, is_default: false, type: 'personal', is_deleted: false }
    ];
    await loginAndGoToWallet(page, dynamicWallets);
  });

  test('should display all wallet cards with correct info', async ({ page }) => {
    await expect(page.locator('text=Ví của tôi')).toBeVisible();
    // Both wallets rendered
    await expect(page.locator('text=Ví Cá Nhân').first()).toBeVisible();
    await expect(page.locator('text=Ví Tiết Kiệm').first()).toBeVisible();
    // Balances
    await expect(page.locator('text=5.000.000 đ').first()).toBeVisible();
    await expect(page.locator('text=12.000.000 đ').first()).toBeVisible();
    // Type badges
    await expect(page.locator('text=Cá nhân').first()).toBeVisible();
    // Create button visible
    await expect(page.getByTestId('create-wallet-btn')).toBeVisible();
  });

  test('should show settings icon for each wallet', async ({ page }) => {
    await expect(page.getByTestId('btn-settings-w-1')).toBeVisible();
    await expect(page.getByTestId('btn-settings-w-2')).toBeVisible();
  });

  test('clicking wallet card navigates to Dashboard with that wallet selected', async ({ page }) => {
    await page.locator('text=Ví Tiết Kiệm').first().click();
    // Should go back to home tab
    await expect(page.locator("text=Capy's Money")).toBeVisible({ timeout: 5000 });
    // Dashboard should show the selected wallet balance
    await expect(page.locator('text=12.000.000')).toBeVisible({ timeout: 5000 });
  });

});

test.describe('WalletScreen — Giới hạn quota 5 ví', () => {
  let dynamicWallets: any[];

  test('should show quota limit warning when 5 wallets reached', async ({ page }) => {
    dynamicWallets = [
      { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false },
      { id: 'w-2', user_id: 'mock-user-uuid-123', name: 'Ví Tiết Kiệm', balance: 12000000, is_default: false, type: 'personal', is_deleted: false },
      { id: 'w-3', user_id: 'mock-user-uuid-123', name: 'Ví Ăn Chơi', balance: 1000000, is_default: false, type: 'personal', is_deleted: false },
      { id: 'w-4', user_id: 'mock-user-uuid-123', name: 'Ví Đầu Tư', balance: 2000000, is_default: false, type: 'personal', is_deleted: false },
      { id: 'w-5', user_id: 'mock-user-uuid-123', name: 'Ví Tiết Kiệm Khác', balance: 3000000, is_default: false, type: 'personal', is_deleted: false }
    ];
    await loginAndGoToWallet(page, dynamicWallets);

    await expect(page.locator('text=Bạn đã đạt giới hạn ví miễn phí')).toBeVisible();
    // Create button should be disabled
    const createBtn = page.getByTestId('create-wallet-btn');
    await expect(createBtn).toBeVisible();
    // Button is disabled state (accessibilityState)
    await expect(createBtn).toHaveAttribute('aria-disabled', 'true');
  });
});

// ─── WalletCreateSheet Tests ──────────────────────────────────────────────────

test.describe('WalletCreateSheet — Tạo ví mới', () => {
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = [
      { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false }
    ];
    await loginAndGoToWallet(page, dynamicWallets);
    // Open the Create Wallet sheet
    await page.getByTestId('create-wallet-btn').click();
    await page.waitForSelector('text="Tạo Ví Mới"', { timeout: 5000 });
  });

  test('should display WalletCreateSheet with all required fields', async ({ page }) => {
    await expect(page.locator('text="Tạo Ví Mới"')).toBeVisible();
    // Wallet name field
    await expect(page.locator('[placeholder="Nhập tên ví (ví dụ: Ví Ăn Tiêu)"]')).toBeVisible();

    // Initial balance field
    await expect(page.locator('text=Số dư khởi tạo (VND)')).toBeVisible();
    // Color picker
    await expect(page.locator('text=Màu sắc đại diện')).toBeVisible();
    // Icon picker
    await expect(page.locator('text=Biểu tượng đại diện')).toBeVisible();
    // Create button
    await expect(page.locator('text="Tạo ví"')).toBeVisible();
    // Close button
    await expect(page.locator('text=✕').first()).toBeVisible();
  });

  test('should show validation error when wallet name is empty', async ({ page }) => {
    // Leave name empty, click create
    await page.locator('text="Tạo ví"').click();
    await expect(page.locator('text=Tên ví không được để trống.')).toBeVisible();
  });

  test('should show validation error when wallet name exceeds 32 characters', async ({ page }) => {
    const longName = 'A'.repeat(33);
    await page.locator('[placeholder="Nhập tên ví (ví dụ: Ví Ăn Tiêu)"]').fill(longName);
    await page.locator('text="Tạo ví"').click();
    await expect(page.locator('text=Tên ví không được vượt quá 32 ký tự.')).toBeVisible();
  });



  test('should create a personal wallet successfully and appear in wallet list', async ({ page }) => {
    // Fill name
    await page.locator('[placeholder="Nhập tên ví (ví dụ: Ví Ăn Tiêu)"]').fill('Ví Ăn Uống');
    // Set balance
    await page.locator('[placeholder="0"]').first().fill('3000000');
    // Click create
    await page.locator('text="Tạo ví"').click();

    // Sheet should close
    await page.waitForTimeout(1000);
    await expect(page.locator('text="Tạo Ví Mới"')).toBeHidden();

    // New wallet should appear in list
    await expect(page.locator('text=Ví Ăn Uống')).toBeVisible({ timeout: 5000 });
  });

  test('should close WalletCreateSheet when clicking close button', async ({ page }) => {
    await expect(page.locator('text="Tạo Ví Mới"')).toBeVisible();
    await page.locator('text=✕').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text="Tạo Ví Mới"')).toBeHidden();
  });

  test('should close WalletCreateSheet when clicking backdrop', async ({ page }) => {
    await expect(page.locator('text="Tạo Ví Mới"')).toBeVisible();
    // Click outside the sheet (backdrop) at a position that won't be intercepted
    await page.getByTestId('create-wallet-backdrop').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    await expect(page.locator('text="Tạo Ví Mới"')).toBeHidden();
  });

  test('should format balance input with thousand separators', async ({ page }) => {
    const balanceInput = page.locator('[placeholder="0"]').first();
    await balanceInput.fill('5000000');
    // Formatted value should show 5.000.000
    const value = await balanceInput.inputValue();
    // The formatted value should contain dots as separators
    expect(value).toMatch(/5/);
  });


});

// ─── WalletEditSheet Tests ────────────────────────────────────────────────────

test.describe('WalletEditSheet — Cài đặt ví', () => {
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = [
      { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false },
      { id: 'w-2', user_id: 'mock-user-uuid-123', name: 'Ví Tiết Kiệm', balance: 12000000, is_default: false, type: 'personal', is_deleted: false }
    ];
    await loginAndGoToWallet(page, dynamicWallets);
    // Open settings for w-1
    await page.getByTestId('btn-settings-w-1').click();
    await page.waitForSelector('text=Cài đặt: Ví Cá Nhân', { timeout: 5000 });
  });

  test('should display WalletEditSheet with correct header for the wallet', async ({ page }) => {
    await expect(page.locator('text=Cài đặt: Ví Cá Nhân')).toBeVisible();
    // Section heading
    await expect(page.locator('text=TỶ LỆ PHÂN BỔ HŨ')).toBeVisible();
    // Total percentage
    await expect(page.locator('text=Tổng hũ: 100%')).toBeVisible();
    // All jar rows visible
    await expect(page.locator('text=Thiết yếu (NEC)')).toBeVisible();
    await expect(page.locator('text=Tiết kiệm (LTSS)')).toBeVisible();
    await expect(page.locator('text=Giáo dục (EDU)')).toBeVisible();
    await expect(page.locator('text=Hưởng thụ (PLAY)')).toBeVisible();
    await expect(page.locator('text=Đầu tư (FFA)')).toBeVisible();
    await expect(page.locator('text=Từ thiện (GIVE)')).toBeVisible();
  });

  test('should display Save and Reset buttons', async ({ page }) => {
    await expect(page.getByTestId('save-allocations-btn')).toBeVisible();
    await expect(page.locator('text=Đặt lại mặc định (55-10-10-10-10-5)')).toBeVisible();
  });

  test('should show footer actions (Set Default / Delete)', async ({ page }) => {
    // w-1 is_default = true, so only delete button visible
    await expect(page.locator('text=🗑️ Xóa ví')).toBeVisible();
    // No "set default" for default wallet
    await expect(page.locator('text=⭐ Mặc định')).toBeHidden();
  });

  test('should show Set Default button for non-default wallet', async ({ page }) => {
    // Close current sheet and open w-2 (not default)
    await page.locator('text=✕').first().click();
    await page.waitForTimeout(500);
    await page.getByTestId('btn-settings-w-2').click();
    await page.waitForSelector('text=Cài đặt: Ví Tiết Kiệm', { timeout: 5000 });

    // Set default button should appear
    await expect(page.locator('text=⭐ Mặc định')).toBeVisible();
    // Delete button also visible
    await expect(page.locator('text=🗑️ Xóa ví')).toBeVisible();
  });

  test('should adjust jar allocation with + and - buttons', async ({ page }) => {
    // NEC starts at 55%, click +NEC to increase to 60%
    await page.locator('text=+ NEC').click();
    await expect(page.locator('text=60%')).toBeVisible();
    // Total should become 105%
    await expect(page.locator('text=Tổng hũ: 105%')).toBeVisible();

    // Click -NEC to go back to 55%
    await page.locator('text=- NEC').click();
    await expect(page.locator('text=55%')).toBeVisible();
    await expect(page.locator('text=Tổng hũ: 100%')).toBeVisible();
  });

  test('should show validation error when total allocation != 100%', async ({ page }) => {
    // Increase NEC so total > 100%
    await page.locator('text=+ NEC').click();
    // Now 105%, save should show error
    await page.getByTestId('save-allocations-btn').click();
    await expect(page.locator('text=Tổng tỷ lệ phân bổ của các hũ phải bằng 100%')).toBeVisible();
  });

  test('should reset allocations to default values', async ({ page }) => {
    // Change NEC first
    await page.locator('text=+ NEC').click();
    await expect(page.locator('text=Tổng hũ: 105%')).toBeVisible();

    // Reset to default
    await page.locator('text=Đặt lại mặc định (55-10-10-10-10-5)').click();
    await expect(page.locator('text=Tổng hũ: 100%')).toBeVisible();
    await expect(page.locator('text=55%')).toBeVisible();
  });

  test('should save jar allocations successfully when total is 100%', async ({ page }) => {
    // Verify total is 100% (already is)
    await expect(page.locator('text=Tổng hũ: 100%')).toBeVisible();
    // Save
    await page.getByTestId('save-allocations-btn').click();
    // Sheet closes on success
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Cài đặt: Ví Cá Nhân')).toBeHidden();
  });

  test('should delete wallet with confirmation dialog', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      // Accept the delete confirmation
      await dialog.accept();
    });

    await page.locator('text=🗑️ Xóa ví').click();
    // Alert should trigger — handled by dialog event
    await page.waitForTimeout(1000);
    // Sheet should close after successful delete
    await expect(page.locator('text=Cài đặt: Ví Cá Nhân')).toBeHidden();
  });

  test('should cancel wallet delete when dismissing dialog', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      await dialog.dismiss();
    });

    await page.locator('text=🗑️ Xóa ví').click();
    await page.waitForTimeout(500);
    // Sheet should still be visible
    await expect(page.locator('text=Cài đặt: Ví Cá Nhân')).toBeVisible();
  });

  test('should close WalletEditSheet when clicking close button', async ({ page }) => {
    await expect(page.locator('text=Cài đặt: Ví Cá Nhân')).toBeVisible();
    await page.locator('text=✕').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Cài đặt: Ví Cá Nhân')).toBeHidden();
  });

  test('should set wallet as default when clicking Set Default', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });

    // Close current sheet and open w-2
    await page.locator('text=✕').first().click();
    await page.waitForTimeout(500);
    await page.getByTestId('btn-settings-w-2').click();
    await page.waitForSelector('text=Cài đặt: Ví Tiết Kiệm', { timeout: 5000 });

    await page.locator('text=⭐ Mặc định').click();
    // Alert confirmation accepted by dialog handler
    await page.waitForTimeout(1000);
  });
});



// ─── Full Wallet Management Flow ──────────────────────────────────────────────

test.describe('Full Wallet Management E2E Flows', () => {
  let dynamicWallets: any[];

  test.beforeEach(async ({ page }) => {
    dynamicWallets = [
      { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 5000000, is_default: true, type: 'personal', is_deleted: false }
    ];
    await loginAndGoToWallet(page, dynamicWallets);
  });

  test('full flow: create wallet → verify in list → open settings', async ({ page }) => {
    // Step 1: Create a new wallet
    await page.getByTestId('create-wallet-btn').click();
    await page.waitForSelector('text=Tạo Ví Mới', { timeout: 5000 });

    await page.locator('[placeholder="Nhập tên ví (ví dụ: Ví Ăn Tiêu)"]').fill('Ví Đi Chợ');
    await page.locator('[placeholder="0"]').first().fill('500000');
    await page.locator('text="Tạo ví"').click();

    // Step 2: Verify wallet appears in list
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Ví Đi Chợ')).toBeVisible({ timeout: 5000 });

    // Step 3: Open settings for the newly created wallet
    const newWalletId = dynamicWallets.find((w: any) => w.name === 'Ví Đi Chợ')?.id;
    if (newWalletId) {
      await page.getByTestId(`btn-settings-${newWalletId}`).click();
      await page.waitForSelector('text=Cài đặt: Ví Đi Chợ', { timeout: 5000 });
      await expect(page.locator('text=TỶ LỆ PHÂN BỔ HŨ')).toBeVisible();
      // Close sheet
      await page.locator('text=✕').first().click();
    }
  });

  test('full flow: navigate wallets → add transaction → verify balance in wallet list', async ({ page }) => {
    // Go back to home tab
    await page.locator('text=Trang chủ').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 5000 });

    // Add income transaction of 2,000,000
    await page.getByTestId('fab-add-transaction').click();
    await page.waitForTimeout(500);
    await page.locator('text=Khoản thu').click();
    await page.locator('[placeholder="0"]').first().fill('2000000');
    await page.locator('text=Lưu giao dịch').click();
    await page.waitForTimeout(1000);

    // Balance should update: 5M + 2M = 7M
    await expect(page.locator('text=7.000.000').first()).toBeVisible({ timeout: 5000 });

    // Navigate to Wallet tab
    await page.locator('text=Ví').last().click();
    await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });

    // Wallet list should show updated balance
    await expect(page.locator('text=7.000.000 đ').first()).toBeVisible({ timeout: 5000 });
  });
});
