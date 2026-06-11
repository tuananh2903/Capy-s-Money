import { test, expect } from '@playwright/test';

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

const baseJars = [
  { id: 'j-nec', type: 'NEC', allocation_percentage: 50, spent_amount: 1000000, budget_limit: 7500000, user_id: 'mock-user-uuid-123', enable_alerts: false },
  { id: 'j-play', type: 'PLAY', allocation_percentage: 50, spent_amount: 500000, budget_limit: 7500000, user_id: 'mock-user-uuid-123', enable_alerts: false }
];

test.describe('Account-wide Budget Jars E2E', () => {
  let profileUpdatePayload: any = null;
  let jarUpdates: any[] = [];
  let fetchedProfileCount = 0;

  test.beforeEach(async ({ page }) => {
    profileUpdatePayload = null;
    jarUpdates = [];
    fetchedProfileCount = 0;

    // Mock Auth
    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token-12345', token_type: 'bearer',
          expires_in: 3600, refresh_token: 'mock-refresh-token', user: mockUser
        })
      });
    });

    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
    });

    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token-12345', token_type: 'bearer',
          expires_in: 3600, refresh_token: 'mock-refresh-token', user: mockUser
        })
      });
    });

    // Mock profiles table
    await page.route('**/rest/v1/profiles*', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH' || method === 'PUT') {
        profileUpdatePayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      } else {
        fetchedProfileCount++;
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-user-uuid-123',
            onboarding_completed: true,
            display_name: 'Capy User',
            total_budget: 15000000 // 15M custom total budget synced in DB
          })
        });
      }
    });

    // Mock wallets
    await page.route('**/rest/v1/wallets*', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify([
          { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 10000000, is_default: true, type: 'personal', is_deleted: false }
        ])
      });
    });

    // Mock jars
    await page.route('**/rest/v1/jars*', async (route) => {
      const method = route.request().method();
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        jarUpdates.push(body);
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(baseJars)
        });
      }
    });

    // Mock empty lists
    await page.route('**/rest/v1/wallet_members*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/rest/v1/transactions*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/rest/v1/categories*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/rest/v1/budgets*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
  });

  test('should load profile total budget from database and sync changes back to DB profiles', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    page.on('response', response => {
      if (response.status() === 401) {
        console.log('401 RESPONSE:', response.url());
      }
    });
    // 1. Go to login, submit and navigate to budget screen
    await page.goto('/');
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
    await page.locator('text=Ngân sách').click();
    await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });

    // 2. Total budget from profiles table is 15M, should display "15.000.000đ"
    await expect(page.locator('text=15.000.000đ')).toBeVisible();

    // 3. Edit total budget to 25M
    await page.getByTestId('btn-edit-total-budget').click();
    const budgetInput = page.locator('[placeholder="Nhập tổng ngân sách..."]');
    await budgetInput.fill('25000000');
    await page.getByTestId('btn-save-total-budget').click();

    // 4. Verify profile update call was sent with new total budget
    await expect.poll(() => profileUpdatePayload).toEqual({ total_budget: 25000000 });

    // 5. Verify jar allocations were updated with limits matching 25M (50% each = 12.5M)
    await expect.poll(() => jarUpdates.length).toBeGreaterThanOrEqual(2);
    const necJarUpdate = jarUpdates.find(j => j.type === 'NEC');
    const playJarUpdate = jarUpdates.find(j => j.type === 'PLAY');
    expect(necJarUpdate.budget_limit).toBe(12500000);
    expect(playJarUpdate.budget_limit).toBe(12500000);
  });
});
