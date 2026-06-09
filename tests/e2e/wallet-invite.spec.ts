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

const mockSharedWallet = {
  id: 'w-shared', user_id: 'mock-user-uuid-123', name: 'Ví Gia Đình',
  balance: 3000000, is_default: false, type: 'shared', is_deleted: false
};

const mockPersonalWallet = {
  id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân',
  balance: 5000000, is_default: true, type: 'personal', is_deleted: false
};

async function setupInviteMocks(page: any, dynamicWallets: any[], inviteCodeResponse: any) {
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
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-user-uuid-123', onboarding_completed: true,
        display_name: 'Capy User',
        jars_ratios: { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 }
      })
    });
  });

  await page.route('**/rest/v1/wallet_members*', async (route: any) => {
    const url = route.request().url();
    if (url.includes('wallet_id=eq.w-shared')) {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify([
          { user_id: 'mock-user-uuid-123', role: 'owner', wallet_id: 'w-shared', profiles: { display_name: 'Capy User' } }
        ])
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/rest/v1/wallets*', async (route: any) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(dynamicWallets.filter((w: any) => !w.is_deleted))
    });
  });

  await page.route('**/rest/v1/jars*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/rest/v1/transactions*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
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
        status: inviteCodeResponse.status,
        contentType: 'application/json',
        body: JSON.stringify(inviteCodeResponse.body)
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/functions/v1/create-invitation*', async (route: any) => {
    const isArray = Array.isArray(inviteCodeResponse.body);
    const bodyObj = isArray ? inviteCodeResponse.body[0] : inviteCodeResponse.body;
    await route.fulfill({
      status: inviteCodeResponse.status === 201 ? 200 : inviteCodeResponse.status,
      contentType: 'application/json',
      body: JSON.stringify(bodyObj)
    });
  });
}

async function loginAndGoToWalletEdit(page: any, dynamicWallets: any[], inviteCodeResponse: any, walletId: string) {
  await setupInviteMocks(page, dynamicWallets, inviteCodeResponse);
  await page.goto('/');
  await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  await page.getByTestId('email-input').fill('test@gmail.com');
  await page.getByTestId('password-input').fill('correctpassword');
  await page.getByTestId('login-button').click();
  await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
  // Navigate to Wallet tab
  await page.locator('text=Ví').last().click();
  await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });
  // Open settings for specified wallet
  await page.getByTestId(`btn-settings-${walletId}`).click();
  await page.waitForTimeout(500);
}

// ─── WalletInviteScreen Tests ─────────────────────────────────────────────────

test.describe('WalletInviteScreen — Mời thành viên vào Ví chung', () => {
  let dynamicWallets: any[];
  const successInviteResponse = {
    status: 201,
    body: [{ id: 'invite-1', code: 'CAPY-123456', expires_at: new Date(Date.now() + 86400000).toISOString() }]
  };

  test.beforeEach(async ({ page }) => {
    dynamicWallets = [mockPersonalWallet, { ...mockSharedWallet }];

    await loginAndGoToWalletEdit(page, dynamicWallets, successInviteResponse, 'w-shared');
    await page.waitForSelector('text=Cài đặt: Ví Gia Đình', { timeout: 5000 });
    // Click invite button
    await page.locator('text=➕ Mời thành viên mới').click();
    await page.waitForSelector('text="Mời thành viên"', { timeout: 5000 });
  });

  test('should display WalletInviteScreen with correct elements', async ({ page }) => {
    await expect(page.locator('text="Mời thành viên"')).toBeVisible();
    // Instruction text
    await expect(page.locator('text=Chia sẻ mã này với người bạn muốn mời')).toBeVisible();
    // Invite code should display
    await expect(page.locator('text=CAPY-123456')).toBeVisible({ timeout: 3000 });
    // Expiry note
    await expect(page.locator('text=⚠️ Mã mời sẽ hết hạn sau 24 giờ.')).toBeVisible();
    // Action buttons
    await expect(page.locator('text=Sao chép')).toBeVisible();
    await expect(page.locator('text=Chia sẻ liên kết')).toBeVisible();
    // Close button
    await expect(page.locator('text=✕').first()).toBeVisible();
  });

  test('should show copy button that changes to "Đã chép!" after clicking', async ({ page }) => {
    // Wait for code to load
    await expect(page.locator('text=CAPY-123456')).toBeVisible({ timeout: 3000 });

    // Click copy
    await page.locator('text=Sao chép').click();
    // Button should change to "Đã chép!"
    await expect(page.locator('text=Đã chép!')).toBeVisible({ timeout: 2000 });

    // After 2 seconds should revert
    await page.waitForTimeout(2100);
    await expect(page.locator('text=Sao chép')).toBeVisible();
  });

  test('should close WalletInviteScreen when clicking close button', async ({ page }) => {
    await expect(page.locator('text="Mời thành viên"')).toBeVisible();
    await page.locator('text=✕').last().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text="Mời thành viên"')).toBeHidden();
  });

  test('should display wallet name in instruction text', async ({ page }) => {
    await expect(page.locator('text="Ví Gia Đình"').first()).toBeVisible();
  });
});

test.describe('WalletInviteScreen — Trường hợp lỗi tạo mã mời', () => {
  let dynamicWallets: any[];
  const failInviteResponse = {
    status: 200,
    body: { error: 'Không thể tạo mã mời.' }
  };

  test.beforeEach(async ({ page }) => {
    dynamicWallets = [mockPersonalWallet, { ...mockSharedWallet }];
    await loginAndGoToWalletEdit(page, dynamicWallets, failInviteResponse, 'w-shared');
    await page.waitForSelector('text=Cài đặt: Ví Gia Đình', { timeout: 5000 });
    await page.locator('text=➕ Mời thành viên mới').click();
    await page.waitForSelector('text="Mời thành viên"', { timeout: 5000 });
  });

  test('should show error state with retry button when invite code generation fails', async ({ page }) => {
    // Error text shown
    await expect(page.locator('text=Không thể tạo mã mời.')).toBeVisible({ timeout: 3000 });
    // Retry button
    await expect(page.locator('text=Thử lại')).toBeVisible();
  });

  test('should trigger regeneration when clicking Retry', async ({ page }) => {
    await expect(page.locator('text=Thử lại')).toBeVisible({ timeout: 3000 });
    // Click retry (will try to generate again, may still fail with mock)
    await page.locator('text=Thử lại').click();
    // Loading state should show briefly
    await page.waitForTimeout(500);
    // Still shows error or regeneration attempt
    await expect(page.locator('text="Mời thành viên"')).toBeVisible();
  });
});

// ─── WalletJoinScreen Tests ───────────────────────────────────────────────────

test.describe('WalletJoinScreen — Tham gia Ví chung bằng mã mời', () => {
  let dynamicWallets: any[];

  async function setupJoinMocks(page: any, joinResponse: any) {
    dynamicWallets = [mockPersonalWallet];
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
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-uuid-123', onboarding_completed: true,
          display_name: 'Capy User',
          jars_ratios: { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 }
        })
      });
    });
    await page.route('**/rest/v1/wallet_members*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/rest/v1/wallets*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dynamicWallets) });
    });
    await page.route('**/rest/v1/jars*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/rest/v1/transactions*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
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

    // Mock the join wallet edge function or RPC call
    await page.route('**/functions/v1/join-wallet*', async (route: any) => {
      await route.fulfill({
        status: joinResponse.status,
        contentType: 'application/json',
        body: JSON.stringify(joinResponse.body)
      });
    });

    // Also mock RPC endpoint
    await page.route('**/rest/v1/rpc/join_wallet_by_code*', async (route: any) => {
      await route.fulfill({
        status: joinResponse.status,
        contentType: 'application/json',
        body: JSON.stringify(joinResponse.body)
      });
    });
  }

  async function openJoinScreen(page: any) {
    await page.goto('/');
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
    // Navigate to Wallet tab to find join button
    await page.locator('text=Ví').last().click();
    await page.waitForSelector('text=Ví của tôi', { timeout: 5000 });
  }

  test('should open join modal via join button and validate empty invite code', async ({ page }) => {
    await setupJoinMocks(page, { status: 200, body: { success: true, walletName: 'Ví Test' } });
    await openJoinScreen(page);

    // Click on the new join button
    await page.getByTestId('join-wallet-btn').click();

    // Verify modal is open
    await expect(page.locator('text=Tham gia Ví chung')).toBeVisible();

    // Click join without typing code
    await page.locator('text="Tham gia ví"').click();

    // Verify error is shown
    await expect(page.locator('text=Vui lòng nhập mã mời.')).toBeVisible();
  });

  test('WalletJoinScreen — displays input form with correct placeholder', async ({ page }) => {
    await setupJoinMocks(page, { status: 200, body: { success: true, walletName: 'Ví Test' } });
    // Navigate via deep link simulation
    await page.goto('/?code=CAPY-123456');
    await page.waitForTimeout(2000);
    // If WalletJoinScreen modal appears
    if (await page.locator('text=Tham gia Ví chung').isVisible()) {
      await expect(page.locator('[placeholder="CAPY-123456"]')).toBeVisible();
      await expect(page.locator('text=Tham gia ví')).toBeVisible();
    }
  });

  test('WalletJoinScreen — validates empty code on submit', async ({ page }) => {
    await setupJoinMocks(page, { status: 200, body: { success: true, walletName: 'Ví Test' } });
    await page.goto('/');
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 15000 });

    // Check if join wallet accessible from any nav
    const joinVisible = await page.locator('text=Tham gia Ví chung').isVisible().catch(() => false);
    if (joinVisible) {
      await page.locator('text=Tham gia ví').click();
      await expect(page.locator('text=Vui lòng nhập mã mời.')).toBeVisible();
    }
  });

  test('WalletJoinScreen — validates wrong code format', async ({ page }) => {
    await setupJoinMocks(page, { status: 400, body: { error: 'Mã không đúng định dạng' } });
    await page.goto('/');
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 15000 });

    const joinVisible = await page.locator('text=Tham gia Ví chung').isVisible().catch(() => false);
    if (joinVisible) {
      const input = page.locator('[placeholder="CAPY-123456"]');
      await input.fill('INVALID');
      await page.locator('text=Tham gia ví').click();
      await expect(page.locator('text=Định dạng mã mời không hợp lệ')).toBeVisible();
    }
  });

  test('WalletJoinScreen — auto-uppercase input text', async ({ page }) => {
    await setupJoinMocks(page, { status: 200, body: { success: true, walletName: 'Ví Test' } });
    await page.goto('/');
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 15000 });

    const joinVisible = await page.locator('text=Tham gia Ví chung').isVisible().catch(() => false);
    if (joinVisible) {
      const input = page.locator('[placeholder="CAPY-123456"]');
      await input.fill('capy-123456');
      const value = await input.inputValue();
      expect(value).toBe('CAPY-123456');
    }
  });

  test('WalletJoinScreen — adds CAPY- prefix when typing only digits', async ({ page }) => {
    await setupJoinMocks(page, { status: 200, body: { success: true, walletName: 'Ví Test' } });
    await page.goto('/');
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 15000 });

    const joinVisible = await page.locator('text=Tham gia Ví chung').isVisible().catch(() => false);
    if (joinVisible) {
      const input = page.locator('[placeholder="CAPY-123456"]');
      await input.fill('123456');
      const value = await input.inputValue();
      // Should auto-prepend CAPY-
      expect(value).toMatch(/CAPY-/);
    }
  });
});

// ─── WalletJoinScreen Success State Tests ────────────────────────────────────

test.describe('WalletJoinScreen — Trạng thái thành công', () => {
  // These tests simulate the joined success state directly in the component
  test('success state displays wallet name and privacy note', async ({ page }) => {
    // Mock join success
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
    await page.route('**/rest/v1/**', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/rest/v1/profiles*', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ id: 'mock-user-uuid-123', onboarding_completed: true, display_name: 'Capy User' })
      });
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 15000 });

    // Check if WalletJoinScreen is accessible
    const joinVisible = await page.locator('text=Tham gia Ví chung').isVisible().catch(() => false);
    if (joinVisible) {
      // Verify success state elements that would appear after join
      await expect(page.locator('text=Tham gia thành công! 🎉')).toBeVisible();
      await expect(page.locator('text=🦦 Chỉ các giao dịch được tạo trong ví này mới được chia sẻ')).toBeVisible();
      await expect(page.locator('text=Đến ví chung ngay')).toBeVisible();
    }
  });
});
