import { test, expect } from '@playwright/test';

test.describe('Dashboard Screen E2E Tests', () => {
  let dynamicTransactions: any[] = [];
  let dynamicWallets: any[] = [];

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
    { type: 'NEC', allocation_percentage: 55, spent_amount: 1000000, budget_limit: 2750000, wallet_id: 'w-1' },
    { type: 'PLAY', allocation_percentage: 10, spent_amount: 450000, budget_limit: 500000, wallet_id: 'w-1' },
    { type: 'FFA', allocation_percentage: 10, spent_amount: 600000, budget_limit: 500000, wallet_id: 'w-1' }, // Over limit!
    { type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1' },
    { type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1' },
    { type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 250000, wallet_id: 'w-1' }
  ];

  const mockJarsW2 = [
    { type: 'NEC', allocation_percentage: 55, spent_amount: 0, budget_limit: 6600000, wallet_id: 'w-2' },
    { type: 'PLAY', allocation_percentage: 10, spent_amount: 0, budget_limit: 1200000, wallet_id: 'w-2' },
    { type: 'FFA', allocation_percentage: 10, spent_amount: 0, budget_limit: 1200000, wallet_id: 'w-2' },
    { type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 1200000, wallet_id: 'w-2' },
    { type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 1200000, wallet_id: 'w-2' },
    { type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 600000, wallet_id: 'w-2' }
  ];

  test.beforeEach(async ({ page }) => {
    // Reset dynamic data for each test run
    dynamicTransactions = [
      { id: 'tx-1', wallet_id: 'w-1', amount: 2500000, type: 'income', is_deleted: false, jar_type: 'NEC', occurred_at: new Date().toISOString(), created_by: 'mock-user-uuid-123', categories: { name: 'Thưởng lương' } }
    ];
    dynamicWallets = JSON.parse(JSON.stringify(mockWallets));

    // Intercept Supabase Auth session retrieve
    await page.route('**/auth/v1/session*', async (route) => {
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

    // Intercept token request
    await page.route('**/auth/v1/token*', async (route) => {
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

    // Intercept profile query
    await page.route('**/rest/v1/profiles*', async (route) => {
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
    });

    // Intercept wallet_members check
    await page.route('**/rest/v1/wallet_members*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Intercept wallets fetch
    await page.route('**/rest/v1/wallets*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dynamicWallets)
      });
    });

    // Intercept jars fetch
    await page.route('**/rest/v1/jars*', async (route) => {
      const url = route.request().url();
      if (url.includes('wallet_id=eq.w-2')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockJarsW2)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockJarsW1)
        });
      }
    });

    // Intercept transactions fetch with dynamic support
    await page.route('**/rest/v1/transactions*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (method === 'GET') {
        const activeTxs = dynamicTransactions.filter(tx => !tx.is_deleted);
        const wId = url.includes('wallet_id=eq.w-2') ? 'w-2' : 'w-1';
        
        if (url.includes('type=eq.income')) {
          const incomeTxs = activeTxs.filter(tx => tx.type === 'income' && tx.wallet_id === wId);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(incomeTxs)
          });
        } else {
          const filteredTxs = activeTxs.filter(tx => tx.wallet_id === wId);
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

        // Update mock wallet balance
        const wallet = dynamicWallets.find(w => w.id === body.wallet_id);
        if (wallet) {
          if (body.type === 'income') {
            wallet.balance += body.amount;
          } else {
            wallet.balance -= body.amount;
          }
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([newTx])
        });
      } else if (method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        const match = url.match(/id=eq\.(tx-[a-zA-Z0-9-]+)/);
        if (match) {
          const txId = match[1];
          const tx = dynamicTransactions.find(t => t.id === txId);
          if (tx) {
            Object.assign(tx, body);
            if (body.is_deleted) {
              const wallet = dynamicWallets.find(w => w.id === tx.wallet_id);
              if (wallet) {
                if (tx.type === 'income') {
                  wallet.balance -= tx.amount;
                } else {
                  wallet.balance += tx.amount;
                }
              }
            }
          }
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    // Go to the app
    await page.goto('/');
    // Wait for the login screen to be visible
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    
    // Fill credentials and trigger mock login
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();

    // Wait for the app loading screen to disappear and Dashboard to render
    await page.waitForSelector('text=Capy\'s Money', { timeout: 15000 });
  });

  test('should display dashboard layout, elements and metrics correctly', async ({ page }) => {
    // 1. Check Top Bar elements
    await expect(page.locator('text=Capy\'s Money')).toBeVisible();
    await expect(page.locator('text=Tài chính thảnh thơi')).toBeVisible();
    await expect(page.getByTestId('avatar-button')).toBeVisible();
    await expect(page.getByTestId('bell-button')).toBeVisible();

    // 2. Check Total Balance Card
    await expect(page.locator('text=Tổng số dư')).toBeVisible();
    // Total balance: 5M + 12M = 17M. Formatted to vi-VN: 17.000.000
    await expect(page.locator('text=17.000.000')).toBeVisible();

    // 3. Check Wallet Switcher (Ví Cá Nhân is active)
    await expect(page.locator('text=Ví Cá Nhân')).toBeVisible();
    await expect(page.locator('text=Ví Tiết Kiệm')).toBeVisible();

    // 4. Check Balance Hero Card for active wallet (Ví Cá Nhân)
    await expect(page.locator('text=Số dư ví này')).toBeVisible();
    await expect(page.locator('text=5.000.000')).toBeVisible();

    // 5. Check Income and Expense
    await expect(page.locator('text=Thu nhập')).toBeVisible();
    await expect(page.locator('text=+2.500.000 đ')).toBeVisible();
    await expect(page.locator('text=Đã chi tiêu')).toBeVisible();
    // Spent: 1,000,000 (NEC) + 450,000 (PLAY) + 600,000 (FFA) = 2,050,000
    await expect(page.locator('text=-2.050.000 đ')).toBeVisible();

    // 6. Check Mascot quote & status chip
    // FFA is over budget (spent 600k, limit 500k), so status chip should be OVER BUDGET warning
    await expect(page.locator('text=CÓ HŨ VƯỢT NGÂN SÁCH')).toBeVisible();
    // Mascot quote is wrapped in literal double quotes in the component, so we use substring matching here
    await expect(page.locator('text=Ôi bạn ơi! Có hũ bị vượt ngân sách kìa, hãy kiểm soát chi tiêu lại nhé!')).toBeVisible();

    // 7. Check 6 Jars representation
    await expect(page.locator('text=Phân phối 6 Hũ')).toBeVisible();
    await expect(page.locator('text=Thiết yếu')).toBeVisible();
    await expect(page.locator('text=55%')).toBeVisible();
    await expect(page.locator('text=Hưởng thụ')).toBeVisible();
    await expect(page.locator('text=10%').first()).toBeVisible();
    await expect(page.locator('text=Đầu tư')).toBeVisible();
    await expect(page.locator('text=VỰT HẠN MỨC!')).toBeVisible(); // FFA over budget warning text
  });

  test('should toggle total balance visibility when clicking the eye button', async ({ page }) => {
    // Initially balance is visible
    await expect(page.locator('text=17.000.000')).toBeVisible();

    // Click eye button to hide
    await page.getByTestId('total-balance-eye-toggle').click();

    // Verify balance is hidden and shows bullets
    await expect(page.locator('text=17.000.000')).toBeHidden();
    await expect(page.locator('text=••••••••')).toBeVisible();

    // Click eye button again to show
    await page.getByTestId('total-balance-eye-toggle').click();
    await expect(page.locator('text=17.000.000')).toBeVisible();
  });

  test('should switch active wallet and reload correct metrics', async ({ page }) => {
    // Verify initial active wallet balance is 5,000,000
    await expect(page.locator('text=Số dư ví này')).toBeVisible();
    await expect(page.locator('text=5.000.000')).toBeVisible();

    // Click inactive wallet "Ví Tiết Kiệm" in the switcher
    await page.locator('text=Ví Tiết Kiệm').click();

    // Verify balance updates to 12,000,000
    await expect(page.locator('text=12.000.000')).toBeVisible();
    await expect(page.locator('text=5.000.000')).toBeHidden();
    
    // Verify spent for Ví Tiết Kiệm is 0
    await expect(page.locator('text=-0 đ')).toBeVisible();
  });

  test('should toggle profile dropdown menu and log out', async ({ page }) => {
    // Intercept signout call
    let signoutCalled = false;
    await page.route('**/auth/v1/logout*', async (route) => {
      signoutCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    // Dismiss or accept the confirmation alert (window.confirm in React Native Web)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Xác nhận đăng xuất');
      await dialog.accept();
    });

    // Dropdown should not be visible initially
    await expect(page.getByTestId('dropdown-profile-info')).toBeHidden();

    // Click Avatar to open dropdown
    await page.getByTestId('avatar-button').click();

    // Verify dropdown items
    await expect(page.getByTestId('dropdown-profile-info')).toBeVisible();
    await expect(page.getByTestId('dropdown-settings')).toBeVisible();
    await expect(page.getByTestId('dropdown-logout')).toBeVisible();

    // Click Logout
    await page.getByTestId('dropdown-logout').click();

    // Verify log out request was sent
    await expect.poll(() => signoutCalled).toBe(true);

    // Verify redirect to Login Screen
    await expect(page.getByTestId('login-screen')).toBeVisible();
  });

  test('should create a new transaction and then delete it, verifying wallet balance and income updates on dashboard', async ({ page }) => {
    // 1. Verify initial active wallet balance is 5,000,000 and income is 2,500,000
    await expect(page.locator('text=Số dư ví này')).toBeVisible();
    await expect(page.locator('text=5.000.000')).toBeVisible();
    await expect(page.locator('text=Thu nhập')).toBeVisible();
    await expect(page.locator('text=+2.500.000')).toBeVisible();

    // 2. Click Quick Add Button to open the QuickAddBottomSheet
    await page.getByTestId('fab-add-transaction').click();

    // 3. Select "Khoản thu" (Income type)
    await page.locator('text=Khoản thu').click();

    // 4. Fill amount and note
    await page.locator('[placeholder="0"]').first().fill('1000000');
    await page.locator('[placeholder="Nhập ghi chú..."]').fill('Thưởng Capy');

    // 5. Save transaction
    await page.locator('text=Lưu giao dịch').click();

    // 6. Verify Dashboard updates: balance goes to 6,000,000 and income to +3,500,000
    await expect(page.locator('text=6.000.000')).toBeVisible();
    await expect(page.locator('text=+3.500.000')).toBeVisible();

    // 7. Go to Sổ Giao Dịch (LedgerScreen)
    await page.locator('text=Sổ GD').click();

    // 8. Wait for LedgerScreen daily tab and click on the new transaction "Thưởng Capy"
    await page.locator('text=Thưởng Capy').first().click();

    // 9. Register dialog listener to accept deletion confirmation
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Xác nhận xóa');
      await dialog.accept();
    });

    // 10. Click Delete inside the TransactionDetailSheet
    await page.locator('text=Xóa').click();

    // 11. Go back to Trang chủ (Dashboard)
    await page.locator('text=Trang chủ').click();

    // 12. Verify metrics are reverted: balance back to 5,000,000 and income back to +2,500,000
    await expect(page.locator('text=5.000.000')).toBeVisible();
    await expect(page.locator('text=+2.500.000')).toBeVisible();
  });
});
