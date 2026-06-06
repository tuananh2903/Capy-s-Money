import { test, expect } from '@playwright/test';

test.describe('Login Screen E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root URL where the Expo Web app is running
    await page.goto('/');
    // Wait for the app loading screen to disappear
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  });

  test('should display the login screen with correct elements', async ({ page }) => {
    // Verify brand title is shown
    await expect(page.locator('text=CAPY\'S MONEY')).toBeVisible();

    // Verify input fields and button exist
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();
    
    // Verify Mascot is loaded
    await expect(page.locator('text=Chào mừng bạn đến với không gian tài chính chill nhất')).toBeVisible();
  });

  test('should show client-side validation error for invalid email', async ({ page }) => {
    // Fill in invalid email and dummy password
    await page.getByTestId('email-input').fill('invalidemail');
    await page.getByTestId('password-input').fill('123456');

    // Click login button
    await page.getByTestId('login-button').click();

    // Check for validation error message
    const errorText = page.locator('text=Email không hợp lệ, vui lòng kiểm tra và nhập lại email.');
    await expect(errorText).toBeVisible();
  });

  test('should show error message on wrong password', async ({ page }) => {
    // Intercept Supabase Auth token request and mock 400 Bad Request response
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
          message: 'Invalid login credentials'
        })
      });
    });

    // Fill credentials
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('wrongpassword');

    // Click login button
    await page.getByTestId('login-button').click();

    // Check for password mismatch error message from authService
    const expectedErrorMsg = 'Sai mật khẩu. Vui lòng thử lại. Lưu ý: Nhập sai mật khẩu quá 5 lần sẽ bị khóa đăng nhập trong vòng 1 tiếng.';
    await expect(page.locator(`text=${expectedErrorMsg}`)).toBeVisible();
  });

  test('should log in successfully and redirect to dashboard', async ({ page }) => {
    // Intercept Supabase Auth token request and mock success session response
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token-12345',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token-12345',
          user: {
            id: 'mock-user-uuid-123',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@gmail.com',
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            identities: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
      });
    });

    // Intercept profile query to return onboarding completed true
    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-uuid-123',
          onboarding_completed: true,
          full_name: 'Test Capy User'
        })
      });
    });

    // Fill valid credentials
    await page.getByTestId('email-input').fill('test@gmail.com');
    await page.getByTestId('password-input').fill('correctpassword');

    // Click login button
    await page.getByTestId('login-button').click();

    // Verify redirection to Dashboard (e.g. Dashboard screen or signOut button is visible)
    // Looking for testID/text in DashboardScreen (usually containing Sign Out or wallet components)
    // Wait for the login screen to be hidden
    await expect(page.getByTestId('login-screen')).toBeHidden();
  });

  test('should log in successfully with Google OAuth', async ({ page }) => {
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

    // Click Google Login button
    await page.locator('text=Tiếp tục với Google').click();

    // Verify that the login screen is eventually hidden (successful redirect and session restoration)
    await expect(page.getByTestId('login-screen')).toBeHidden({ timeout: 15000 });
  });
});

