/**
 * Visual Regression Tests for Dashboard Components
 * Captures screenshots and compares against baseline images
 */

const { test, expect } = require('@playwright/test');

test.describe('Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-1',
            email: 'test@example.com',
            credits: 150
          }
        })
      });
    });

    // Mock API responses for consistent visual testing
    await page.route('**/api/usage/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          usage: [
            {
              id: '1',
              tool_name: 'leadlove_maps',
              credits_used: 3,
              created_at: '2024-01-15T10:00:00Z',
              status: 'completed'
            },
            {
              id: '2',
              tool_name: 'leadlove_maps',
              credits_used: 5,
              created_at: '2024-01-14T15:30:00Z',
              status: 'completed'
            }
          ],
          total: 2,
          totalCreditsUsed: 8
        })
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('dashboard overview layout', async ({ page }) => {
    // Wait for dynamic content to load
    await page.waitForSelector('[data-testid="credit-balance"]');
    await page.waitForSelector('[data-testid="quick-actions"]');
    
    // Hide dynamic timestamps for consistent screenshots
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"], 
        .timestamp,
        .relative-time {
          visibility: hidden !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('dashboard-overview.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2
    });
  });

  test('credit balance widget states', async ({ page }) => {
    // Test sufficient credits state
    await page.waitForSelector('[data-testid="credit-balance"]');
    await expect(page.locator('[data-testid="credit-balance"]')).toHaveScreenshot('credit-balance-sufficient.png');

    // Test low credits state by mocking different response
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-1',
            email: 'test@example.com',
            credits: 5 // Low balance
          }
        })
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="credit-balance"]')).toHaveScreenshot('credit-balance-low.png');

    // Test zero credits state
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-1',
            email: 'test@example.com',
            credits: 0 // No credits
          }
        })
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="credit-balance"]')).toHaveScreenshot('credit-balance-zero.png');
  });

  test('quick actions component', async ({ page }) => {
    await page.waitForSelector('[data-testid="quick-actions"]');
    await expect(page.locator('[data-testid="quick-actions"]')).toHaveScreenshot('quick-actions.png');
  });

  test('recent generations table', async ({ page }) => {
    await page.waitForSelector('[data-testid="recent-generations"]');
    
    // Hide dynamic elements for consistent screenshots
    await page.addStyleTag({
      content: `
        .timestamp,
        .relative-time,
        [data-testid="generation-time"] {
          opacity: 0 !important;
        }
      `
    });

    await expect(page.locator('[data-testid="recent-generations"]')).toHaveScreenshot('recent-generations.png');
  });

  test('mobile responsive dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 12 size
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Hide timestamps on mobile too
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"], 
        .timestamp,
        .relative-time {
          visibility: hidden !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('tablet responsive dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.addStyleTag({
      content: `
        [data-testid="timestamp"], 
        .timestamp,
        .relative-time {
          visibility: hidden !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('dark mode visual consistency', async ({ page }) => {
    // Enable dark mode if supported
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.addStyleTag({
      content: `
        [data-testid="timestamp"], 
        .timestamp,
        .relative-time {
          visibility: hidden !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('loading states', async ({ page }) => {
    // Intercept API calls to simulate loading
    await page.route('**/api/usage/**', route => {
      // Delay response to capture loading state
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ usage: [], total: 0, totalCreditsUsed: 0 })
        });
      }, 5000);
    });

    await page.goto('/dashboard');
    
    // Capture loading state quickly
    await page.waitForSelector('[data-testid="loading-state"]', { timeout: 2000 });
    await expect(page.locator('[data-testid="recent-generations"]')).toHaveScreenshot('loading-state.png');
  });

  test('error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/usage/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('[data-testid="error-state"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="recent-generations"]')).toHaveScreenshot('error-state.png');
  });
});

test.describe('Lead Generation Form Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-1',
            email: 'test@example.com',
            credits: 150
          }
        })
      });
    });

    await page.goto('/dashboard/generate');
    await page.waitForLoadState('networkidle');
  });

  test('lead generation form default state', async ({ page }) => {
    await page.waitForSelector('form[data-testid="lead-generation-form"]');
    await expect(page.locator('form[data-testid="lead-generation-form"]')).toHaveScreenshot('form-default.png');
  });

  test('form with validation errors', async ({ page }) => {
    // Trigger validation errors
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="validation-error"]');
    
    await expect(page.locator('form[data-testid="lead-generation-form"]')).toHaveScreenshot('form-validation-errors.png');
  });

  test('form filled with valid data', async ({ page }) => {
    await page.fill('input[name="businessType"]', 'restaurants');
    await page.fill('input[name="location"]', 'Miami Beach');
    await page.fill('textarea[name="serviceOffering"]', 'digital marketing');
    await page.fill('input[name="maxResults"]', '10');

    await expect(page.locator('form[data-testid="lead-generation-form"]')).toHaveScreenshot('form-filled.png');
  });

  test('insufficient credits warning', async ({ page }) => {
    // Mock low credits
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-1',
            email: 'test@example.com',
            credits: 2 // Insufficient for generation
          }
        })
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="businessType"]', 'restaurants');
    await page.fill('input[name="location"]', 'Miami Beach');
    await page.fill('input[name="maxResults"]', '20'); // This would cost more than 2 credits

    await expect(page.locator('[data-testid="insufficient-credits-warning"]')).toHaveScreenshot('insufficient-credits-warning.png');
  });
});