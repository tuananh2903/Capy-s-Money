import { test, expect } from '@playwright/test';

test.describe('Register Screen E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root URL where the Expo Web app is running
    await page.goto('/');
    // Wait for the app loading screen to disappear and Login screen to load
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
    // Switch to Register Screen
    await page.getByTestId('register-link').click();
    // Wait for Register Screen header title
    await expect(page.locator('text=Tạo tài khoản mới')).toBeVisible();
  });

  test('should display the register screen with correct elements', async ({ page }) => {
    // Verify brand title is shown
    await expect(page.locator('text=CAPY\'S MONEY')).toBeVisible();

    // Verify input fields and button exist
    await expect(page.getByPlaceholder('Họ và tên', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Email', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Mật khẩu', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Xác nhận mật khẩu', { exact: true })).toBeVisible();
    
    // Verify Register buttons
    await expect(page.locator('text="Đăng ký"')).toBeVisible();
    await expect(page.locator('text=Tiếp tục với Google')).toBeVisible();
  });

  test('should show validation error when full name is empty', async ({ page }) => {
    // Fill other fields except name
    await page.getByPlaceholder('Email', { exact: true }).fill('test@gmail.com');
    await page.getByPlaceholder('Mật khẩu', { exact: true }).fill('password123');
    await page.getByPlaceholder('Xác nhận mật khẩu', { exact: true }).fill('password123');

    // Click register button
    await page.locator('text="Đăng ký"').click();

    // Check for validation error message
    const errorText = page.locator('text=Vui lòng nhập họ và tên.');
    await expect(errorText).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByPlaceholder('Họ và tên', { exact: true }).fill('Nguyen Van A');
    await page.getByPlaceholder('Email', { exact: true }).fill('invalidemail');
    await page.getByPlaceholder('Mật khẩu', { exact: true }).fill('password123');
    await page.getByPlaceholder('Xác nhận mật khẩu', { exact: true }).fill('password123');

    await page.locator('text="Đăng ký"').click();

    const errorText = page.locator('text=Email không hợp lệ, vui lòng kiểm tra và nhập lại email.');
    await expect(errorText).toBeVisible();
  });

  test('should show validation error when password length is less than 6 characters', async ({ page }) => {
    await page.getByPlaceholder('Họ và tên', { exact: true }).fill('Nguyen Van A');
    await page.getByPlaceholder('Email', { exact: true }).fill('test@gmail.com');
    await page.getByPlaceholder('Mật khẩu', { exact: true }).fill('123');
    await page.getByPlaceholder('Xác nhận mật khẩu', { exact: true }).fill('123');

    await page.locator('text="Đăng ký"').click();

    const errorText = page.locator('text=Mật khẩu phải có ít nhất 6 ký tự.');
    await expect(errorText).toBeVisible();
  });

  test('should show validation error when passwords mismatch', async ({ page }) => {
    await page.getByPlaceholder('Họ và tên', { exact: true }).fill('Nguyen Van A');
    await page.getByPlaceholder('Email', { exact: true }).fill('test@gmail.com');
    await page.getByPlaceholder('Mật khẩu', { exact: true }).fill('password123');
    await page.getByPlaceholder('Xác nhận mật khẩu', { exact: true }).fill('password321');

    await page.locator('text="Đăng ký"').click();

    const errorText = page.locator('text=Mật khẩu xác nhận không khớp.');
    await expect(errorText).toBeVisible();
  });

  test('should register successfully', async ({ page }) => {
    // Intercept Supabase Auth signup request
    await page.route('**/auth/v1/signup*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-uuid-123',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@gmail.com',
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { full_name: 'Nguyen Van A' },
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });
    });

    // Fill valid info
    await page.getByPlaceholder('Họ và tên', { exact: true }).fill('Nguyen Van A');
    await page.getByPlaceholder('Email', { exact: true }).fill('test@gmail.com');
    await page.getByPlaceholder('Mật khẩu', { exact: true }).fill('password123');
    await page.getByPlaceholder('Xác nhận mật khẩu', { exact: true }).fill('password123');

    await page.locator('text="Đăng ký"').click();

    // Verify there are no error messages displayed (sign up call finishes successfully)
    await expect(page.locator('text=Vui lòng nhập họ và tên.')).toBeHidden();
    await expect(page.locator('text=Email không hợp lệ')).toBeHidden();
    await expect(page.locator('text=Mật khẩu phải có ít nhất 6 ký tự.')).toBeHidden();
    await expect(page.locator('text=Mật khẩu xác nhận không khớp.')).toBeHidden();
  });

  test('should register/log in successfully with Google OAuth', async ({ page }) => {
    // Intercept Google OAuth authorization request and redirect back with access token
    await page.route('**/auth/v1/authorize*', async (route) => {
      const url = new URL(route.request().url());
      expect(url.searchParams.get('provider')).toBe('google');

      // Fulfill with a 302 redirection back to our app with a mock session hash
      await route.fulfill({
        status: 302,
        headers: {
          location: '/#access_token=mock-google-access-token&refresh_token=mock-google-refresh-token&expires_in=3600&token_type=bearer'
        }
      });
    });

    // Intercept profile fetch to return onboarding completed true
    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-google-user-uuid',
          onboarding_completed: true,
          full_name: 'Google User'
        })
      });
    });

    // Intercept token request if any refresh/validation happens
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-google-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-google-refresh-token',
          user: {
            id: 'mock-google-user-uuid',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'google-user@gmail.com',
            email_confirmed_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: { provider: 'google', providers: ['google'] },
            user_metadata: { full_name: 'Google User' },
            identities: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
      });
    });

    // Click Google Login button on Register Screen
    await page.locator('text=Tiếp tục với Google').click();

    // Verify that the login screen is eventually hidden (successful redirect and session restoration)
    await expect(page.getByTestId('login-screen')).toBeHidden({ timeout: 15000 });
  });
});

