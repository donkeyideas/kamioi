# Automated Testing Setup Guide
## Test Framework Configuration

**Date:** 2024  
**Status:** 🟡 Setup Required  
**Purpose:** Set up automated testing frameworks for functional testing

---

## Testing Frameworks Recommended

### 1. Playwright (Recommended)
**Why:** Cross-browser testing, mobile emulation, API testing, screenshots

**Installation:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration:** `playwright.config.js`
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### 2. Cypress (Alternative)
**Why:** Easy to use, great debugging, time-travel debugging

**Installation:**
```bash
npm install -D cypress
```

**Configuration:** `cypress.config.js`
```javascript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
```

---

### 3. Jest + React Testing Library (Unit Tests)
**Why:** Component testing, unit tests, integration tests

**Installation:**
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

---

## Test Structure

```
tests/
├── e2e/
│   ├── phase1-website.spec.js
│   ├── phase2-auth.spec.js
│   ├── phase3-user-dashboard.spec.js
│   ├── phase4-family-dashboard.spec.js
│   ├── phase5-business-dashboard.spec.js
│   ├── phase6-admin-dashboard.spec.js
│   └── phase7-cross-dashboard.spec.js
├── api/
│   ├── auth-api.spec.js
│   ├── transactions-api.spec.js
│   ├── investments-api.spec.js
│   └── user-management-api.spec.js
├── performance/
│   ├── page-load.spec.js
│   ├── api-performance.spec.js
│   └── load-testing.spec.js
├── security/
│   ├── authentication.spec.js
│   ├── authorization.spec.js
│   └── input-validation.spec.js
├── accessibility/
│   ├── keyboard-navigation.spec.js
│   ├── screen-reader.spec.js
│   └── wcag-compliance.spec.js
└── utils/
    ├── test-helpers.js
    ├── test-data.js
    └── test-accounts.js
```

---

## Sample Test Scripts

### Example: Homepage Test (Playwright)
```javascript
import { test, expect } from '@playwright/test';

test.describe('Phase 1: Homepage', () => {
  test('TC-001: Homepage loads < 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('TC-002: All sections render correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section
    await expect(page.locator('h1')).toBeVisible();
    
    // Check value propositions
    const valueProps = page.locator('[data-testid="value-proposition"]');
    await expect(valueProps).toHaveCount(3);
    
    // Check blog preview
    const blogSection = page.locator('[data-testid="blog-preview"]');
    await expect(blogSection).toBeVisible();
  });

  test('TC-003: Navigation menu works', async ({ page }) => {
    await page.goto('/');
    
    // Click navigation link
    await page.click('text=Blog');
    await expect(page).toHaveURL(/.*\/blog/);
  });
});
```

### Example: Login Test (Playwright)
```javascript
import { test, expect } from '@playwright/test';

test.describe('Phase 2: Authentication', () => {
  test('TC-046: Login with valid credentials works', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/.*\/dashboard/);
    
    // Verify dashboard loaded
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('TC-047: Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid');
  });
});
```

### Example: Transaction Test (Playwright)
```javascript
import { test, expect } from '@playwright/test';

test.describe('Phase 3: User Transactions', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/);
  });

  test('TC-082: Transaction list loads', async ({ page }) => {
    await page.goto('/dashboard/1/transactions');
    
    // Wait for transactions to load
    await page.waitForSelector('[data-testid="transaction-list"]');
    
    // Verify transactions display
    const transactions = page.locator('[data-testid="transaction-item"]');
    await expect(transactions.first()).toBeVisible();
  });

  test('TC-086: Filtering by status works', async ({ page }) => {
    await page.goto('/dashboard/1/transactions');
    
    // Click status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Completed');
    
    // Verify filtered results
    const transactions = page.locator('[data-testid="transaction-item"]');
    const count = await transactions.count();
    
    // All displayed transactions should be completed
    for (let i = 0; i < count; i++) {
      const status = await transactions.nth(i).locator('[data-testid="status"]').textContent();
      expect(status).toBe('Completed');
    }
  });
});
```

---

## Performance Testing Setup

### Lighthouse CI
**Installation:**
```bash
npm install -D @lhci/cli
```

**Configuration:** `lighthouserc.js`
```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4000/',
        'http://localhost:4000/blog',
        'http://localhost:4000/login',
        'http://localhost:4000/dashboard/1/',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.8}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.8}],
        'categories:seo': ['error', {minScore: 0.8}],
      },
    },
  },
};
```

---

## Security Testing Setup

### OWASP ZAP Integration
**Installation:**
```bash
npm install -D @zaproxy/zap-api
```

**Configuration:** `zap-config.js`
```javascript
module.exports = {
  target: 'http://localhost:4000',
  zapOptions: {
    apiKey: process.env.ZAP_API_KEY,
    proxy: 'http://localhost:8080',
  },
  tests: [
    'authentication',
    'authorization',
    'input-validation',
    'xss',
    'sql-injection',
  ],
};
```

---

## Accessibility Testing Setup

### axe-core Integration
**Installation:**
```bash
npm install -D @axe-core/playwright
```

**Usage:**
```javascript
import { injectAxe, checkA11y } from 'axe-playwright';

test('TC-349: Keyboard navigation works', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

---

## Test Data Management

### Test Accounts
```javascript
// tests/utils/test-accounts.js
export const testAccounts = {
  individual: {
    email: 'test-individual@example.com',
    password: 'TestPassword123!',
    userId: 1,
  },
  family: {
    email: 'test-family@example.com',
    password: 'TestPassword123!',
    userId: 2,
  },
  business: {
    email: 'test-business@example.com',
    password: 'TestPassword123!',
    userId: 3,
  },
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    userId: 999,
  },
};
```

---

## Test Execution Commands

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Phase
```bash
npm run test:e2e -- phase1-website
```

### Run with UI
```bash
npm run test:e2e:ui
```

### Run Performance Tests
```bash
npm run test:performance
```

### Run Security Tests
```bash
npm run test:security
```

### Run Accessibility Tests
```bash
npm run test:accessibility
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

---

## Test Reporting

### HTML Reports
- Playwright: `npx playwright show-report`
- Cypress: `npx cypress open`

### Coverage Reports
```bash
npm run test:coverage
```

---

## Next Steps

1. **Install Test Frameworks**
   - [ ] Install Playwright or Cypress
   - [ ] Install Jest + React Testing Library
   - [ ] Install Lighthouse CI
   - [ ] Install axe-core

2. **Create Test Structure**
   - [ ] Create test directories
   - [ ] Create test helper utilities
   - [ ] Create test data files

3. **Write Test Scripts**
   - [ ] Phase 1 tests
   - [ ] Phase 2 tests
   - [ ] Phase 3 tests
   - [ ] Continue for all phases

4. **Set Up CI/CD**
   - [ ] Configure GitHub Actions
   - [ ] Set up test reporting
   - [ ] Configure test notifications

---

**Last Updated:** 2024  
**Status:** 🟡 Setup Required

