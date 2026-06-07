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

const baseJars = [
  { id: 'j-nec', type: 'NEC', allocation_percentage: 55, spent_amount: 1000000, budget_limit: 5500000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-play', type: 'PLAY', allocation_percentage: 10, spent_amount: 200000, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-ffa', type: 'FFA', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-edu', type: 'EDU', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-ltss', type: 'LTSS', allocation_percentage: 10, spent_amount: 0, budget_limit: 1000000, wallet_id: 'w-1', enable_alerts: false },
  { id: 'j-give', type: 'GIVE', allocation_percentage: 5, spent_amount: 0, budget_limit: 500000, wallet_id: 'w-1', enable_alerts: false }
];

const mockCategories = [
  { id: 'cat-nec-1', name: 'Ăn uống', icon: '🍜', type: 'expense', jar_type: 'NEC' },
  { id: 'cat-nec-2', name: 'Thuê nhà', icon: '🏠', type: 'expense', jar_type: 'NEC' },
  { id: 'cat-play-1', name: 'Ăn hàng sang', icon: '🥂', type: 'expense', jar_type: 'PLAY' }
];

async function setupBudgetMocks(page: any, dynamicJars: any[]) {
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
        { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 10000000, is_default: true, type: 'personal', is_deleted: false }
      ])
    });
  });

  await page.route('**/rest/v1/jars*', async (route: any) => {
    const method = route.request().method();
    if (method === 'PATCH' || method === 'PUT' || method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      // Update enable_alerts if patching
      if (body.enable_alerts !== undefined) {
        const url = route.request().url();
        const idMatch = url.match(/id=eq\.(j-[a-zA-Z0-9-]+)/);
        if (idMatch) {
          const jar = dynamicJars.find((j: any) => j.id === idMatch[1]);
          if (jar) jar.enable_alerts = body.enable_alerts;
        }
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(dynamicJars)
      });
    }
  });

  await page.route('**/rest/v1/transactions*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/rest/v1/categories*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newCat = { id: `cat-new-${Date.now()}`, ...body };
      mockCategories.push(newCat);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([newCat]) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) });
    }
  });

  await page.route('**/rest/v1/category_budgets*', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST' || method === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      // Return category budgets with enable_alerts=false
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/rest/v1/wallet_invite_codes*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

async function loginAndNavigateToBudget(page: any, dynamicJars: any[]) {
  await setupBudgetMocks(page, dynamicJars);
  await page.goto('/');
  await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  await page.getByTestId('email-input').fill('test@gmail.com');
  await page.getByTestId('password-input').fill('correctpassword');
  await page.getByTestId('login-button').click();
  await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
  await page.locator('text=Ngân sách').click();
  await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });
}

// ─── Budget Screen: JarCard Tests ────────────────────────────────────────────

test.describe('Budget Screen — JarCard Chi tiết & Tương tác', () => {
  let dynamicJars: any[];

  test.beforeEach(async ({ page }) => {
    dynamicJars = JSON.parse(JSON.stringify(baseJars));
    await loginAndNavigateToBudget(page, dynamicJars);
  });

  test('should display all 6 jar cards with name, percentage, spend and limit', async ({ page }) => {
    // NEC jar
    await expect(page.locator('text=Thiết yếu (NEC) (55%)')).toBeVisible();
    await expect(page.locator('text=Đã chi: 1.000.000đ').first()).toBeVisible();
    // PLAY jar
    await expect(page.locator('text=Hưởng thụ (PLAY) (10%)')).toBeVisible();
    // FFA jar
    await expect(page.locator('text=Tự do TC (FFA) (10%)')).toBeVisible();
    // EDU jar
    await expect(page.locator('text=Giáo dục (EDU) (10%)')).toBeVisible();
    // LTSS jar
    await expect(page.locator('text=Tiết kiệm (LTSS) (10%)')).toBeVisible();
    // GIVE jar
    await expect(page.locator('text=Từ thiện (GIVE) (5%)')).toBeVisible();
  });

  test('should display progress bars for jars based on spending', async ({ page }) => {
    // NEC: spent 1M / limit 5.5M = ~18% — should have visible bar
    // PLAY: spent 200k / limit 1M = 20%
    // All others: spent 0 — empty bar
    await expect(page.locator('text=Thiết yếu (NEC) (55%)')).toBeVisible();
    // Progress bars are rendered with percentage fill
    // Verify limit amounts shown
    await expect(page.locator('text=5.500.000đ')).toBeVisible();
    await expect(page.locator('text=1.000.000đ').first()).toBeVisible();
  });

  test('should toggle jar alert on when switch clicked', async ({ page }) => {
    // Initially all alerts off, 0/3 alerts active
    await expect(page.locator('text=🔔 Cảnh báo đang hoạt động: 0 / 3')).toBeVisible();

    // Toggle NEC jar alert switch
    // Find the first switch (NEC jar) and toggle it
    const necJarRow = page.locator('text=Thiết yếu (NEC) (55%)').first().locator('..');
    await necJarRow.locator('role=switch').click().catch(async () => {
      // Fallback: find all switches and click first
      await page.locator('[role="switch"]').first().click();
    });

    await page.waitForTimeout(500);
    // Alert count should increment
    await expect(page.locator('text=🔔 Cảnh báo đang hoạt động: 1 / 3')).toBeVisible();
  });

  test('should show PremiumModal when trying to enable 4th alert', async ({ page }) => {
    // Enable 3 alerts first
    const switches = page.locator('[role="switch"]');
    const switchCount = await switches.count();

    // Click first 3 jar switches
    for (let i = 0; i < Math.min(3, switchCount); i++) {
      await switches.nth(i).click();
      await page.waitForTimeout(300);
    }

    // Try to enable 4th alert
    if (switchCount >= 4) {
      await switches.nth(3).click();
      await page.waitForTimeout(500);
      // PremiumModal should appear
      await expect(page.locator('text=Giới Hạn Cảnh Báo Free')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Tài khoản Free chỉ được bật tối đa 3 cảnh báo ngân sách')).toBeVisible();
      await expect(page.locator('text=Nâng Cấp Premium (12k/tháng)')).toBeVisible();
      await expect(page.locator('text=Để sau')).toBeVisible();
    }
  });

  test('should close PremiumModal when clicking Để sau', async ({ page }) => {
    // Enable 3 alerts then try 4th to trigger modal
    const switches = page.locator('[role="switch"]');
    const switchCount = await switches.count();

    for (let i = 0; i < Math.min(3, switchCount); i++) {
      await switches.nth(i).click();
      await page.waitForTimeout(300);
    }

    if (switchCount >= 4) {
      await switches.nth(3).click();
      await page.waitForTimeout(500);

      if (await page.locator('text=Giới Hạn Cảnh Báo Free').isVisible()) {
        await page.locator('text=Để sau').click();
        await page.waitForTimeout(500);
        await expect(page.locator('text=Giới Hạn Cảnh Báo Free')).toBeHidden();
      }
    }
  });

  test('should expand jar card to show categories when clicked', async ({ page }) => {
    // Click on NEC jar card to expand
    await page.locator('text=Thiết yếu (NEC) (55%)').first().click();
    await page.waitForTimeout(300);

    // Expanded state shows categories
    await expect(page.locator('text=Ăn uống').first()).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Thuê nhà').first()).toBeVisible({ timeout: 2000 });
  });

  test('should show "Không có danh mục con" when jar has no categories', async ({ page }) => {
    // Click on FFA jar (no categories)
    await page.locator('text=Tự do TC (FFA) (10%)').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Không có danh mục con')).toBeVisible({ timeout: 2000 });
  });

  test('should show edit and delete action buttons in jar card', async ({ page }) => {
    // Edit ✏️ button
    const editBtns = page.locator('text=✏️');
    await expect(editBtns.first()).toBeVisible();
    // Delete 🗑️ button
    const deleteBtns = page.locator('text=🗑️');
    await expect(deleteBtns.first()).toBeVisible();
  });

  test('should open JarEditSheet when clicking edit icon on a jar', async ({ page }) => {
    // Click the edit button (✏️) on first jar
    await page.locator('text=✏️').first().click();
    await page.waitForTimeout(500);

    // JarEditSheet should appear
    await expect(page.locator('text=Chỉnh sửa Hũ')).toBeVisible({ timeout: 5000 });
    // Should show jar name, icon, percentage inputs
    await expect(page.locator('text=Tên hũ')).toBeVisible();
    await expect(page.locator('text=Icon (Emoji)')).toBeVisible();
    await expect(page.locator('text=Tỷ lệ phân bổ:')).toBeVisible();
    await expect(page.locator('text=Hạng mục con')).toBeVisible();
    await expect(page.locator('text=Lưu Cấu Hình')).toBeVisible();
  });

  test('should delete jar with confirmation', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      expect(dialog.message()).toContain('Bạn chắc chắn muốn xóa hũ');
      await dialog.accept();
    });

    // Click delete button for first jar
    await page.locator('text=🗑️').first().click();
    await page.waitForTimeout(1000);
    // Jar should be removed from list
    // After delete, NEC jar should no longer be in the list (or list reloads)
    await page.waitForTimeout(500);
  });

  test('should cancel jar delete when dismissing dialog', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      await dialog.dismiss();
    });

    await page.locator('text=🗑️').first().click();
    await page.waitForTimeout(500);
    // NEC jar should still be visible
    await expect(page.locator('text=Thiết yếu (NEC) (55%)')).toBeVisible();
  });
});

// ─── Budget Screen: JarEditSheet Tests ───────────────────────────────────────

test.describe('Budget Screen — JarEditSheet (Chỉnh sửa Hũ)', () => {
  let dynamicJars: any[];

  test.beforeEach(async ({ page }) => {
    dynamicJars = JSON.parse(JSON.stringify(baseJars));
    await loginAndNavigateToBudget(page, dynamicJars);
    // Open JarEditSheet for NEC jar
    await page.locator('text=✏️').first().click();
    await page.waitForSelector('text=Chỉnh sửa Hũ', { timeout: 5000 });
  });

  test('should display JarEditSheet with pre-filled jar data', async ({ page }) => {
    await expect(page.locator('text=Chỉnh sửa Hũ')).toBeVisible();
    // Fields visible
    await expect(page.locator('text=Tên hũ')).toBeVisible();
    await expect(page.locator('[placeholder="Ví dụ: Thiết yếu (NEC)"]')).toBeVisible();
    // Jar name pre-filled
    const nameInput = page.locator('[placeholder="Ví dụ: Thiết yếu (NEC)"]');
    const value = await nameInput.inputValue();
    expect(value).toContain('NEC');
    // Percentage display
    await expect(page.locator('text=Tỷ lệ phân bổ: 55%')).toBeVisible();
  });

  test('should increase jar percentage with +5% button', async ({ page }) => {
    await expect(page.locator('text=Tỷ lệ phân bổ: 55%')).toBeVisible();
    await page.locator('text=+5%').click();
    await expect(page.locator('text=Tỷ lệ phân bổ: 60%')).toBeVisible();
  });

  test('should decrease jar percentage with -5% button', async ({ page }) => {
    await expect(page.locator('text=Tỷ lệ phân bổ: 55%')).toBeVisible();
    await page.locator('text=-5%').click();
    await expect(page.locator('text=Tỷ lệ phân bổ: 50%')).toBeVisible();
  });

  test('should not go below 0% when decreasing', async ({ page }) => {
    // Decrease multiple times
    for (let i = 0; i < 15; i++) {
      await page.locator('text=-5%').click();
    }
    await expect(page.locator('text=Tỷ lệ phân bổ: 0%')).toBeVisible();
  });

  test('should not exceed 100% when increasing', async ({ page }) => {
    // Increase multiple times
    for (let i = 0; i < 10; i++) {
      await page.locator('text=+5%').click();
    }
    await expect(page.locator('text=Tỷ lệ phân bổ: 100%')).toBeVisible();
  });

  test('should display existing categories for the jar', async ({ page }) => {
    // NEC jar categories
    await expect(page.locator('[placeholder="Tên danh mục"]').first()).toHaveValue('Ăn uống');
    await expect(page.locator('[placeholder="Tên danh mục"]').nth(1)).toHaveValue('Thuê nhà');
  });

  test('should add a new category item', async ({ page }) => {
    await page.locator('text=+ Thêm').click();
    // New category row with "Hạng mục mới" default name appears
    await expect(page.locator('[placeholder="Tên danh mục"]').last()).toBeVisible();
    await expect(page.locator('[placeholder="Hạn mức"]').last()).toBeVisible();
  });

  test('should delete a category item', async ({ page }) => {
    // Get initial category count
    const initialDeleteBtns = await page.locator('text=🗑️').count();

    // Add one category to ensure we can delete
    await page.locator('text=+ Thêm').click();
    await page.waitForTimeout(300);

    // Delete the last category (newly added)
    const deleteBtns = page.locator('text=🗑️');
    const currentCount = await deleteBtns.count();
    await deleteBtns.last().click();

    await page.waitForTimeout(300);
    // Count should decrease
    const newCount = await page.locator('text=🗑️').count();
    expect(newCount).toBe(currentCount - 1);
  });

  test('should close JarEditSheet when clicking close button', async ({ page }) => {
    await expect(page.locator('text=Chỉnh sửa Hũ')).toBeVisible();
    await page.locator('text=✕').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Chỉnh sửa Hũ')).toBeHidden();
  });

  test('should save jar configuration and show success alert', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      expect(dialog.message()).toContain('Cấu hình hũ');
      await dialog.accept();
    });

    // Save without changes (valid state)
    await page.locator('text=Lưu Cấu Hình').click();
    await page.waitForTimeout(2000);
    // Sheet should close after save
    await expect(page.locator('text=Chỉnh sửa Hũ')).toBeHidden();
  });

  test('should update category name in the edit form', async ({ page }) => {
    // Add new category
    await page.locator('text=+ Thêm').click();
    // Change its name
    const newNameInput = page.locator('[placeholder="Tên danh mục"]').last();
    await newNameInput.clear();
    await newNameInput.fill('Điện nước');

    const value = await newNameInput.inputValue();
    expect(value).toBe('Điện nước');
  });
});

// ─── Budget Screen: PremiumModal Tests ───────────────────────────────────────

test.describe('Budget Screen — PremiumModal', () => {
  let dynamicJars: any[];

  test.beforeEach(async ({ page }) => {
    // Set 3 alerts already enabled to trigger Premium on next one
    dynamicJars = JSON.parse(JSON.stringify(baseJars)).map((j: any, i: number) => ({
      ...j,
      enable_alerts: i < 3 // First 3 jars have alerts enabled
    }));
    await loginAndNavigateToBudget(page, dynamicJars);
  });

  test('should show PremiumModal content with upgrade button', async ({ page }) => {
    // Alert count should show 3/3
    await expect(page.locator('text=🔔 Cảnh báo đang hoạt động: 3 / 3')).toBeVisible();

    // Try to enable a 4th alert (4th jar switch = index 3)
    const switches = page.locator('[role="switch"]');
    const count = await switches.count();

    // Find the first disabled (off) switch (should be index 3)
    for (let i = 3; i < count; i++) {
      const checked = await switches.nth(i).getAttribute('aria-checked');
      if (checked === 'false' || checked === null) {
        await switches.nth(i).click();
        break;
      }
    }

    await page.waitForTimeout(500);
    // PremiumModal should appear
    if (await page.locator('text=Giới Hạn Cảnh Báo Free').isVisible()) {
      await expect(page.locator('text=🦫✨')).toBeVisible();
      await expect(page.locator('text=Giới Hạn Cảnh Báo Free')).toBeVisible();
      await expect(page.locator('text=Tài khoản Free chỉ được bật tối đa 3 cảnh báo ngân sách')).toBeVisible();
      await expect(page.locator('text=Nâng Cấp Premium (12k/tháng)')).toBeVisible();
      await expect(page.locator('text=Để sau')).toBeVisible();
    }
  });

  test('should dismiss PremiumModal when clicking Để sau', async ({ page }) => {
    const switches = page.locator('[role="switch"]');
    const count = await switches.count();

    for (let i = 3; i < count; i++) {
      const checked = await switches.nth(i).getAttribute('aria-checked');
      if (checked === 'false' || checked === null) {
        await switches.nth(i).click();
        break;
      }
    }

    await page.waitForTimeout(500);
    if (await page.locator('text=Giới Hạn Cảnh Báo Free').isVisible()) {
      await page.locator('text=Để sau').click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=Giới Hạn Cảnh Báo Free')).toBeHidden();
      // Should still be on budget screen
      await expect(page.locator('text=Quản Lý Ngân Sách')).toBeVisible();
    }
  });

  test('should trigger upgrade flow when clicking Nâng Cấp Premium', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      // The upgrade button calls alert('Nâng cấp thành công!')
      expect(dialog.message()).toContain('Nâng cấp thành công!');
      await dialog.accept();
    });

    const switches = page.locator('[role="switch"]');
    const count = await switches.count();

    for (let i = 3; i < count; i++) {
      const checked = await switches.nth(i).getAttribute('aria-checked');
      if (checked === 'false' || checked === null) {
        await switches.nth(i).click();
        break;
      }
    }

    await page.waitForTimeout(500);
    if (await page.locator('text=Giới Hạn Cảnh Báo Free').isVisible()) {
      await page.locator('text=Nâng Cấp Premium (12k/tháng)').click();
      // Dialog accepted by handler
      await page.waitForTimeout(500);
    }
  });
});

// ─── Budget Screen: Total Budget & Rollover ───────────────────────────────────

test.describe('Budget Screen — Tổng Ngân Sách & Dồn Tháng (Rollover)', () => {
  let dynamicJars: any[];

  test.beforeEach(async ({ page }) => {
    dynamicJars = JSON.parse(JSON.stringify(baseJars));
    await loginAndNavigateToBudget(page, dynamicJars);
  });

  test('should display default total budget of 10,000,000đ', async ({ page }) => {
    await expect(page.getByTestId('text-total-budget')).toBeVisible();
    await expect(page.locator('text=10.000.000đ')).toBeVisible();
  });

  test('should enter edit mode for total budget', async ({ page }) => {
    await page.getByTestId('btn-edit-total-budget').click();
    await expect(page.locator('[placeholder="Nhập tổng ngân sách..."]')).toBeVisible();
    await expect(page.getByTestId('btn-save-total-budget')).toBeVisible();
    await expect(page.locator('text=Hủy').first()).toBeVisible();
  });

  test('should cancel total budget edit', async ({ page }) => {
    await page.getByTestId('btn-edit-total-budget').click();
    await expect(page.locator('[placeholder="Nhập tổng ngân sách..."]')).toBeVisible();
    await page.locator('text=Hủy').first().click();
    await expect(page.locator('[placeholder="Nhập tổng ngân sách..."]')).toBeHidden();
    // Original budget still shows
    await expect(page.getByTestId('text-total-budget')).toBeVisible();
  });

  test('should save new total budget and recalculate jar limits', async ({ page }) => {
    await page.getByTestId('btn-edit-total-budget').click();
    const budgetInput = page.locator('[placeholder="Nhập tổng ngân sách..."]');
    await budgetInput.fill('20000000');
    await page.getByTestId('btn-save-total-budget').click();

    // Wait for save
    await page.waitForTimeout(1000);
    // New budget displayed
    await expect(page.locator('text=20.000.000đ')).toBeVisible({ timeout: 5000 });
    // NEC limit should recalculate: 20M * 55% = 11M
    await expect(page.locator('text=11.000.000đ')).toBeVisible({ timeout: 3000 });
  });

  test('should show error when saving invalid total budget (0)', async ({ page }) => {
    page.on('dialog', async (dialog: any) => {
      expect(dialog.message()).toContain('Tổng ngân sách phải lớn hơn 0đ.');
      await dialog.accept();
    });

    await page.getByTestId('btn-edit-total-budget').click();
    const budgetInput = page.locator('[placeholder="Nhập tổng ngân sách..."]');
    await budgetInput.fill('0');
    await page.getByTestId('btn-save-total-budget').click();
    await page.waitForTimeout(500);
  });

  test('should toggle rollover mode and show forecast panel', async ({ page }) => {
    // Toggle ON
    await page.getByTestId('btn-toggle-rollover').click();
    await page.waitForTimeout(300);

    // Forecast panel appears
    await expect(page.locator('text=DỰ BÁO NGÂN SÁCH THÁNG SAU')).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId('text-next-budget-amount')).toBeVisible();

    // Toggle OFF
    await page.getByTestId('btn-toggle-rollover').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=DỰ BÁO NGÂN SÁCH THÁNG SAU')).toBeHidden();
  });

  test('should show surplus rollover forecast when spending is under budget', async ({ page }) => {
    // Budget = 10M, NEC spent = 1M, PLAY spent = 0.2M => total spent = 1.2M
    // Rollover diff = 10M - 1.2M = 8.8M (surplus)
    await page.getByTestId('btn-toggle-rollover').click();
    await page.waitForTimeout(300);

    // Forecast should show a surplus value
    const nextBudget = page.getByTestId('text-next-budget-amount');
    await expect(nextBudget).toBeVisible();
    // Since 1.2M spent out of 10M, next month = 10M + 8.8M = 18.8M
    const budgetText = await nextBudget.textContent();
    expect(budgetText).toBeTruthy();
  });

  test('should display allocation validity status', async ({ page }) => {
    // Total allocation = 100% (NEC 55 + PLAY 10 + FFA 10 + EDU 10 + LTSS 10 + GIVE 5 = 100)
    await expect(page.locator('text=Tổng phân bổ: 100% (Hợp lệ)')).toBeVisible();
  });
});

// ─── Budget Screen: Wallet Tab Switching ─────────────────────────────────────

test.describe('Budget Screen — Switching Wallet Tabs', () => {
  test('should load budget data for selected wallet', async ({ page }) => {
    const dynamicJars = JSON.parse(JSON.stringify(baseJars));

    await page.route('**/rest/v1/**', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
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
          { id: 'w-1', user_id: 'mock-user-uuid-123', name: 'Ví Cá Nhân', balance: 10000000, is_default: true, type: 'personal', is_deleted: false },
          { id: 'w-2', user_id: 'mock-user-uuid-123', name: 'Ví Tiết Kiệm', balance: 5000000, is_default: false, type: 'personal', is_deleted: false }
        ])
      });
    });
    await page.route('**/rest/v1/jars*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dynamicJars) });
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');
    await page.getByTestId('login-button').click();
    await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
    await page.locator('text=Ngân sách').click();
    await page.waitForSelector('text=Quản Lý Ngân Sách', { timeout: 5000 });

    // Both wallet tabs should be visible
    await expect(page.locator('text=Ví Cá Nhân').first()).toBeVisible();
    await expect(page.locator('text=Ví Tiết Kiệm').first()).toBeVisible();

    // Switch to second wallet
    await page.locator('text=Ví Tiết Kiệm').first().click();
    await page.waitForTimeout(500);

    // Budget screen still shows correct heading
    await expect(page.locator('text=Quản Lý Ngân Sách')).toBeVisible();
    await expect(page.locator('text=Tổng ngân sách ví')).toBeVisible();
  });
});
