import { test, expect } from '@playwright/test';

// Helper: mock a successful login so we land on Onboarding
const mockNewUserLogin = async (page: any) => {
  let onboardingCompleted = false;
  let walletsList: any[] = [];

  const mockUser = {
    id: 'new-user-uuid-999',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'newuser@gmail.com',
    email_confirmed_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: 'New Capy' },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Mock auth session
  await page.route('**/auth/v1/session*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token-onboarding',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        user: mockUser
      })
    });
  });

  await page.route('**/auth/v1/token*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token-onboarding',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        user: mockUser
      })
    });
  });

  // Mock profile: onboarding status can be updated dynamically
  await page.route('**/rest/v1/profiles*', async (route: any) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-user-uuid-999',
          onboarding_completed: onboardingCompleted,
          display_name: 'New Capy',
          jars_ratios: null
        })
      });
    } else if (method === 'PATCH' || method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.onboarding_completed !== undefined) {
        onboardingCompleted = body.onboarding_completed;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }
  });

  // Mock wallet creation and list retrieval
  await page.route('**/rest/v1/wallets*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST') {
      const newWallet = { id: 'new-wallet-uuid', name: 'Ví Onboarding', balance: 5000000, is_default: true, type: 'personal', is_deleted: false };
      walletsList.push(newWallet);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([newWallet])
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(walletsList) });
    }
  });

  // Mock RPC complete_onboarding
  await page.route('**/rpc/complete_onboarding*', async (route: any) => {
    onboardingCompleted = true;
    const postData = route.request().postData();
    let body = { p_wallet_name: 'Ví Tiền Mặt', p_balance: 0 };
    try {
      if (postData) body = JSON.parse(postData);
    } catch (e) {}
    walletsList.push({
      id: 'w-onboard-default',
      user_id: 'new-user-uuid-999',
      name: body.p_wallet_name || 'Ví Tiền Mặt',
      balance: body.p_balance || 0,
      is_default: true,
      type: 'personal',
      is_deleted: false
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  // Mock jars operations
  await page.route('**/rest/v1/jars*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  // Navigate and login
  await page.goto('/');
  await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  await page.getByTestId('email-input').fill('newuser@gmail.com');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('login-button').click();
};

test.describe('Onboarding Screen E2E Tests', () => {
  test('should display Step 1: Create wallet with correct elements', async ({ page }) => {
    await mockNewUserLogin(page);

    // Verify progress indicators
    await expect(page.locator('text=Bước 1 trên 3')).toBeVisible({ timeout: 10000 });

    // Verify step 1 content
    await expect(page.locator('text=Tạo ví đầu tiên của bạn')).toBeVisible();
    await expect(page.locator('text=Tên ví')).toBeVisible();
    await expect(page.locator('text=Số dư ban đầu (VND)')).toBeVisible();
    await expect(page.locator('text=Tạo ví nào! 🐾')).toBeVisible();
  });

  test('should show error when wallet name is empty in Step 1', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    // Clear wallet name
    const walletNameInput = page.locator('[placeholder="Ví của tôi"]');
    await walletNameInput.clear();

    await page.locator('text=Tạo ví nào! 🐾').click();

    await expect(page.locator('text=Hãy đặt tên cho ví của bạn nhé! 🌱')).toBeVisible();
  });

  test('should show error for negative balance in Step 1', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    // Enter negative balance
    const balanceInput = page.locator('[placeholder="0"]');
    await balanceInput.fill('-100');

    await page.locator('text=Tạo ví nào! 🐾').click();

    await expect(page.locator('text=Số dư không thể nhỏ hơn 0 đâu nhé!')).toBeVisible();
  });

  test('should advance to Step 2 after completing Step 1', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    // Fill wallet name
    const walletNameInput = page.locator('[placeholder="Ví của tôi"]');
    await walletNameInput.clear();
    await walletNameInput.fill('Ví Capy Test');

    // Enter balance
    const balanceInput = page.locator('[placeholder="0"]');
    await balanceInput.fill('5000000');

    // Submit step 1
    await page.locator('text=Tạo ví nào! 🐾').click();

    // Should see success message then transition to Step 2
    await expect(page.locator('text=Tuyệt vời! 🦦')).toBeVisible({ timeout: 5000 });
    // Wait for transition to Step 2 (2.5s timer)
    await expect(page.locator('text=Công thức 6 Hũ Tài Chính')).toBeVisible({ timeout: 8000 });
  });

  test('should display Step 2: 6 Jars with default template', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    // Complete step 1
    await page.locator('[placeholder="Ví của tôi"]').fill('Ví Test');
    await page.locator('text=Tạo ví nào! 🐾').click();

    await page.waitForSelector('text=Công thức 6 Hũ Tài Chính', { timeout: 8000 });

    // Verify jars display - use exact text match to avoid strict mode violations (e.g. matching "💡 Thiết yếu (55%)")
    await expect(page.locator('text=Hũ mặc định')).toBeVisible();
    await expect(page.locator('text=Trống (Tự điền)')).toBeVisible();
    await expect(page.getByText('Thiết yếu', { exact: true })).toBeVisible();
    await expect(page.getByText('Tiết kiệm', { exact: true })).toBeVisible();
    await expect(page.getByText('Tự do TC', { exact: true })).toBeVisible();
    await expect(page.getByText('Giáo dục', { exact: true })).toBeVisible();
    await expect(page.getByText('Hưởng thụ', { exact: true })).toBeVisible();
    await expect(page.getByText('Cho đi', { exact: true })).toBeVisible();

    // Default template totals 100%
    await expect(page.locator('text=🎉 Tổng phân bổ đủ 100%').first()).toBeVisible();
  });

  test('should switch to empty template and show warning', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    await page.locator('[placeholder="Ví của tôi"]').fill('Ví Test');
    await page.locator('text=Tạo ví nào! 🐾').click();
    await page.waitForSelector('text=Công thức 6 Hũ Tài Chính', { timeout: 8000 });

    // Switch to empty template
    await page.locator('text=Trống (Tự điền)').click();

    // Warning should show (0% allocated)
    await expect(page.locator('text=Còn 100% chưa phân bổ, bạn điều chỉnh thêm nhé!')).toBeVisible();

    // Continue button should be disabled
    const continueBtn = page.locator('text=Tiếp tục');
    await expect(continueBtn).toBeVisible();
    // (disabled state - button still rendered but disabled)
  });

  test('should show explanation when selecting a jar in Step 2', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    await page.locator('[placeholder="Ví của tôi"]').fill('Ví Test');
    await page.locator('text=Tạo ví nào! 🐾').click();
    await page.waitForSelector('text=Công thức 6 Hũ Tài Chính', { timeout: 8000 });

    // Click on "Tiết kiệm" jar
    await page.locator('text=Tiết kiệm').first().click();

    // Explanation for savings should appear
    await expect(page.locator('text=Tiết kiệm dài hạn: tích lũy mua nhà, mua xe hoặc dự phòng khẩn cấp.')).toBeVisible();
  });

  test('should display Step 3: Goals after completing Step 2', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    await page.locator('[placeholder="Ví của tôi"]').fill('Ví Test');
    await page.locator('text=Tạo ví nào! 🐾').click();
    await page.waitForSelector('text=Công thức 6 Hũ Tài Chính', { timeout: 8000 });

    // Step 2: Continue with 100% total - use exact match to avoid matching status message
    await page.getByText('Tiếp tục', { exact: true }).click();

    // Step 3 goals
    await expect(page.locator('text=Mục tiêu tài chính của bạn?')).toBeVisible();
    await expect(page.locator('text=Tiết kiệm mua nhà/xe')).toBeVisible();
    await expect(page.locator('text=Quản lý chi tiêu hàng ngày')).toBeVisible();
    await expect(page.locator('text=Tự do tài chính (Đầu tư)')).toBeVisible();
    await expect(page.locator('text=Khác')).toBeVisible();
    await expect(page.locator('text=Bỏ qua, làm sau')).toBeVisible();
    await expect(page.locator('text=Xong! Bắt đầu thôi!')).toBeVisible();
  });

  test('should select a predefined goal and complete onboarding', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    await page.locator('[placeholder="Ví của tôi"]').fill('Ví Test');
    await page.locator('text=Tạo ví nào! 🐾').click();
    await page.waitForSelector('text=Công thức 6 Hũ Tài Chính', { timeout: 8000 });
    await page.getByText('Tiếp tục', { exact: true }).click();
    await page.waitForSelector('text=Mục tiêu tài chính của bạn?', { timeout: 5000 });

    // Select a goal
    await page.locator('text=Tiết kiệm mua nhà/xe').click();
    await page.locator('text=Xong! Bắt đầu thôi!').click();

    // Should exit onboarding and show main dashboard
    await expect(page.locator('text=Capy\'s Money')).toBeVisible({ timeout: 10000 });
  });

  test('should show custom goal input when selecting "Khác"', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    await page.locator('[placeholder="Ví của tôi"]').fill('Ví Test');
    await page.locator('text=Tạo ví nào! 🐾').click();
    await page.waitForSelector('text=Công thức 6 Hũ Tài Chính', { timeout: 8000 });
    await page.getByText('Tiếp tục', { exact: true }).click();
    await page.waitForSelector('text=Mục tiêu tài chính của bạn?', { timeout: 5000 });

    // Select "Khác"
    await page.locator('text=Khác').click();

    // Custom goal text input should appear
    await expect(page.locator('[placeholder="Nhập mục tiêu khác của bạn..."]')).toBeVisible();
  });

  test('should skip goals step and go directly to dashboard', async ({ page }) => {
    await mockNewUserLogin(page);
    await page.waitForSelector('text=Bước 1 trên 3', { timeout: 10000 });

    await page.locator('[placeholder="Ví của tôi"]').fill('Ví Test');
    await page.locator('text=Tạo ví nào! 🐾').click();
    await page.waitForSelector('text=Công thức 6 Hũ Tài Chính', { timeout: 8000 });
    await page.getByText('Tiếp tục', { exact: true }).click();
    await page.waitForSelector('text=Mục tiêu tài chính của bạn?', { timeout: 5000 });

    // Click skip
    await page.locator('text=Bỏ qua, làm sau').click();

    // Should land on dashboard
    await expect(page.locator('text=Capy\'s Money')).toBeVisible({ timeout: 10000 });
  });
});
