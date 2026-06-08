# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-features.spec.ts >> Ledger Screen (Sổ Giao Dịch) E2E Tests >> should display Ledger screen header with correct elements
- Location: tests\e2e\app-features.spec.ts:300:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:8081/", waiting until "load"

```

# Test source

```ts
  153 |     const url = route.request().url();
  154 |     const method = route.request().method();
  155 | 
  156 |     if (method === 'GET') {
  157 |       const activeTxs = dynamicTransactions.filter(tx => !tx.is_deleted);
  158 |       const wId = url.includes('wallet_id=eq.w-2') ? 'w-2' : 'w-1';
  159 |       let filteredTxs = activeTxs.filter(tx => tx.wallet_id === wId);
  160 | 
  161 |       const gteMatch = url.match(/occurred_at=gte\.([^&]+)/);
  162 |       const lteMatch = url.match(/occurred_at=lte\.([^&]+)/);
  163 |       if (gteMatch) {
  164 |         const gteVal = decodeURIComponent(gteMatch[1]);
  165 |         filteredTxs = filteredTxs.filter(tx => tx.occurred_at >= gteVal);
  166 |       }
  167 |       if (lteMatch) {
  168 |         const lteVal = decodeURIComponent(lteMatch[1]);
  169 |         filteredTxs = filteredTxs.filter(tx => tx.occurred_at <= lteVal);
  170 |       }
  171 | 
  172 |       if (url.includes('type=eq.income')) {
  173 |         const incomeTxs = filteredTxs.filter(tx => tx.type === 'income');
  174 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(incomeTxs) });
  175 |       } else {
  176 |         await route.fulfill({
  177 |           status: 200,
  178 |           contentType: 'application/json',
  179 |           body: JSON.stringify(filteredTxs)
  180 |         });
  181 |       }
  182 |     } else if (method === 'POST') {
  183 |       const body = JSON.parse(route.request().postData() || '{}');
  184 |       const newTx = {
  185 |         id: `tx-${Date.now()}`,
  186 |         is_deleted: false,
  187 |         occurred_at: new Date().toISOString(),
  188 |         created_by: 'mock-user-uuid-123',
  189 |         categories: { name: body.note || body.jar_type },
  190 |         ...body
  191 |       };
  192 |       dynamicTransactions.push(newTx);
  193 | 
  194 |       const wallet = dynamicWallets.find((w: any) => w.id === body.wallet_id);
  195 |       if (wallet) {
  196 |         wallet.balance = body.type === 'income' ? wallet.balance + body.amount : wallet.balance - body.amount;
  197 |       }
  198 | 
  199 |       await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([newTx]) });
  200 |     } else if (method === 'PATCH') {
  201 |       const body = JSON.parse(route.request().postData() || '{}');
  202 |       const match = url.match(/id=eq\.(tx-[a-zA-Z0-9-]+)/);
  203 |       if (match) {
  204 |         const tx = dynamicTransactions.find((t: any) => t.id === match[1]);
  205 |         if (tx) {
  206 |           Object.assign(tx, body);
  207 |           if (body.is_deleted) {
  208 |             const wallet = dynamicWallets.find((w: any) => w.id === tx.wallet_id);
  209 |             if (wallet) {
  210 |               wallet.balance = tx.type === 'income' ? wallet.balance - tx.amount : wallet.balance + tx.amount;
  211 |             }
  212 |           }
  213 |         }
  214 |       }
  215 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  216 |     }
  217 |   });
  218 | 
  219 |   await page.route('**/rest/v1/categories*', async (route: any) => {
  220 |     const method = route.request().method();
  221 |     if (method === 'POST') {
  222 |       await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([]) });
  223 |     } else {
  224 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) });
  225 |     }
  226 |   });
  227 | 
  228 |   await page.route('**/rest/v1/category_budgets*', async (route: any) => {
  229 |     const method = route.request().method();
  230 |     if (method === 'POST' || method === 'PATCH') {
  231 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  232 |     } else {
  233 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  234 |     }
  235 |   });
  236 | 
  237 |   await page.route('**/rest/v1/wallet_invite_codes*', async (route: any) => {
  238 |     const method = route.request().method();
  239 |     if (method === 'POST') {
  240 |       await route.fulfill({
  241 |         status: 201,
  242 |         contentType: 'application/json',
  243 |         body: JSON.stringify([{ id: 'invite-1', code: 'ABC123', expires_at: new Date(Date.now() + 86400000).toISOString() }])
  244 |       });
  245 |     } else {
  246 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  247 |     }
  248 |   });
  249 | }
  250 | 
  251 | async function loginAndNavigateToDashboard(page: any, dynamicTransactions: any[], dynamicWallets: any[]) {
  252 |   await setupDashboardMocks(page, dynamicTransactions, dynamicWallets);
> 253 |   await page.goto('/');
      |              ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  254 |   await page.waitForSelector('[data-testid="login-screen"]', { timeout: 15000 });
  255 |   await page.getByTestId('email-input').fill('test@gmail.com');
  256 |   await page.getByTestId('password-input').fill('correctpassword');
  257 |   await page.getByTestId('login-button').click();
  258 |   await page.waitForSelector("text=Capy's Money", { timeout: 15000 });
  259 | }
  260 | 
  261 | // ─── LedgerScreen Tests ───────────────────────────────────────────────────────
  262 | 
  263 | test.describe('Ledger Screen (Sổ Giao Dịch) E2E Tests', () => {
  264 |   let dynamicTransactions: any[];
  265 |   let dynamicWallets: any[];
  266 | 
  267 |   test.beforeEach(async ({ page }) => {
  268 |     dynamicWallets = JSON.parse(JSON.stringify(mockWallets));
  269 |     dynamicTransactions = [
  270 |       {
  271 |         id: 'tx-1',
  272 |         wallet_id: 'w-1',
  273 |         amount: 2500000,
  274 |         type: 'income',
  275 |         is_deleted: false,
  276 |         jar_type: 'NEC',
  277 |         occurred_at: new Date().toISOString(),
  278 |         created_by: 'mock-user-uuid-123',
  279 |         categories: { name: 'Lương' }
  280 |       },
  281 |       {
  282 |         id: 'tx-2',
  283 |         wallet_id: 'w-1',
  284 |         amount: 150000,
  285 |         type: 'expense',
  286 |         is_deleted: false,
  287 |         jar_type: 'NEC',
  288 |         occurred_at: new Date().toISOString(),
  289 |         created_by: 'mock-user-uuid-123',
  290 |         categories: { name: 'Ăn uống' }
  291 |       }
  292 |     ];
  293 | 
  294 |     await loginAndNavigateToDashboard(page, dynamicTransactions, dynamicWallets);
  295 |     // Navigate to Ledger tab
  296 |     await page.locator('text=Sổ GD').click();
  297 |     await page.waitForSelector('text=Sổ Giao Dịch', { timeout: 5000 });
  298 |   });
  299 | 
  300 |   test('should display Ledger screen header with correct elements', async ({ page }) => {
  301 |     await expect(page.locator('text=Sổ Giao Dịch')).toBeVisible();
  302 |     // Current month display
  303 |     const now = new Date();
  304 |     await expect(page.locator(`text=Tháng ${now.getMonth() + 1} / ${now.getFullYear()}`)).toBeVisible();
  305 |     // Tab buttons
  306 |     await expect(page.locator('text=Hàng ngày')).toBeVisible();
  307 |     await expect(page.locator('text=Hàng tháng')).toBeVisible();
  308 |     await expect(page.locator('text=Lịch biểu')).toBeVisible();
  309 |   });
  310 | 
  311 |   test('should show transactions in Daily tab by default', async ({ page }) => {
  312 |     // Transactions should be visible
  313 |     await expect(page.locator('text=Lương')).toBeVisible();
  314 |     await expect(page.locator('text=Ăn uống')).toBeVisible();
  315 |     // Income shows green, expense shows red
  316 |     await expect(page.locator('text=+2.500.000đ')).toBeVisible();
  317 |     await expect(page.locator('text=-150.000đ')).toBeVisible();
  318 |   });
  319 | 
  320 |   test('should switch to Monthly tab and show summary', async ({ page }) => {
  321 |     await page.locator('text=Hàng tháng').click();
  322 |     await expect(page.locator('text=Phân Tích Chi Tiêu')).toBeVisible();
  323 |     await expect(page.locator('text=Nhận Xét Từ Capy')).toBeVisible();
  324 |     await expect(page.locator('text=Tổng chi tiêu:')).toBeVisible();
  325 |   });
  326 | 
  327 |   test('should switch to Calendar tab and show calendar view', async ({ page }) => {
  328 |     await page.locator('text="Lịch biểu"').click();
  329 |     // Should show calendar-like content
  330 |     await page.waitForTimeout(500);
  331 |     // Calendar tab component is rendered
  332 |     const now = new Date();
  333 |     const month = now.getMonth() + 1;
  334 |     // Month is still displayed in header
  335 |     await expect(page.locator(`text="Tháng ${month} / ${now.getFullYear()}"`).first()).toBeVisible();
  336 |   });
  337 | 
  338 |   test('should navigate to previous month when clicking left arrow', async ({ page }) => {
  339 |     const now = new Date();
  340 |     const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  341 |     const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  342 | 
  343 |     await page.locator('text=‹').click();
  344 |     await expect(page.locator(`text="Tháng ${prevMonth} / ${prevYear}"`)).toBeVisible();
  345 |   });
  346 | 
  347 |   test('should navigate to next month when clicking right arrow', async ({ page }) => {
  348 |     const now = new Date();
  349 |     const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
  350 |     const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  351 | 
  352 |     await page.locator('text=›').click();
  353 |     await expect(page.locator(`text="Tháng ${nextMonth} / ${nextYear}"`)).toBeVisible();
```