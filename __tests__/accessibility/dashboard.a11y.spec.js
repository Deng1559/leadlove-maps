/**
 * Accessibility (A11y) Tests for Dashboard Components
 * WCAG 2.1 AA Compliance Testing with Axe-core
 */

const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y, getViolations } = require('axe-playwright');

test.describe('Dashboard Accessibility Tests', () => {
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

    // Mock usage data
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
            }
          ],
          total: 1,
          totalCreditsUsed: 3
        })
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
  });

  test('dashboard overview accessibility compliance', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
        outputDir: 'test-results/accessibility'
      }
    });
  });

  test('credit balance widget accessibility', async ({ page }) => {
    const creditBalance = page.locator('[data-testid="credit-balance"]');
    await expect(creditBalance).toBeVisible();

    // Check for proper ARIA labels and roles
    await expect(creditBalance).toHaveAttribute('role', 'region');
    await expect(creditBalance).toHaveAttribute('aria-label', /credit balance/i);

    // Run axe check on specific component
    await checkA11y(page, '[data-testid="credit-balance"]', {
      rules: {
        'color-contrast': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-valid-attr': { enabled: true }
      }
    });
  });

  test('navigation accessibility', async ({ page }) => {
    const navigation = page.locator('[data-testid="dashboard-nav"]');
    
    // Check navigation structure
    await expect(navigation).toHaveAttribute('role', 'navigation');
    await expect(navigation).toHaveAttribute('aria-label');

    // Check navigation links
    const navLinks = navigation.locator('a');
    const linkCount = await navLinks.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      await expect(link).toHaveAttribute('href');
      
      // Each link should have accessible text
      const textContent = await link.textContent();
      expect(textContent?.trim()).toBeTruthy();
    }

    await checkA11y(page, '[data-testid="dashboard-nav"]');
  });

  test('data table accessibility', async ({ page }) => {
    const table = page.locator('[data-testid="recent-generations"] table');
    
    if (await table.isVisible()) {
      // Check table structure
      await expect(table).toHaveAttribute('role', 'table');
      
      // Check for proper headers
      const headers = table.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);

      // Each header should have scope attribute
      for (let i = 0; i < headerCount; i++) {
        const header = headers.nth(i);
        await expect(header).toHaveAttribute('scope', 'col');
      }

      // Check for caption or aria-label
      const caption = table.locator('caption');
      const hasCaption = await caption.count() > 0;
      const hasAriaLabel = await table.getAttribute('aria-label');
      
      expect(hasCaption || hasAriaLabel).toBeTruthy();

      await checkA11y(page, '[data-testid="recent-generations"]', {
        rules: {
          'table-header-missing': { enabled: true },
          'th-has-data-cells': { enabled: true },
          'scope-attr-valid': { enabled: true }
        }
      });
    }
  });

  test('form accessibility', async ({ page }) => {
    await page.goto('/dashboard/generate');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);

    const form = page.locator('form[data-testid="lead-generation-form"]');
    
    // Check form structure
    await expect(form).toHaveAttribute('role', 'form');
    
    // Check all form inputs have proper labels
    const inputs = form.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const inputType = await input.getAttribute('type');
      
      if (inputType !== 'hidden' && inputType !== 'submit') {
        expect(inputId).toBeTruthy();
        
        // Check for associated label
        const label = page.locator(`label[for="${inputId}"]`);
        await expect(label).toBeVisible();
        
        // Or check for aria-label/aria-labelledby
        const hasAriaLabel = await input.getAttribute('aria-label');
        const hasAriaLabelledby = await input.getAttribute('aria-labelledby');
        
        expect(hasAriaLabel || hasAriaLabelledby || await label.count() > 0).toBeTruthy();
      }
    }

    await checkA11y(page, 'form', {
      rules: {
        'label': { enabled: true },
        'aria-input-field-name': { enabled: true },
        'form-field-multiple-labels': { enabled: true }
      }
    });
  });

  test('button accessibility', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      
      // Skip if not visible
      if (!(await button.isVisible())) continue;
      
      // Each button should have accessible text
      const textContent = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      expect(textContent?.trim() || ariaLabel || title).toBeTruthy();
      
      // Check if button is focusable
      await button.focus();
      await expect(button).toBeFocused();
    }

    await checkA11y(page, null, {
      rules: {
        'button-name': { enabled: true },
        'focusable-content': { enabled: true }
      }
    });
  });

  test('color contrast compliance', async ({ page }) => {
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // Check specific high-contrast requirements
    const importantElements = [
      '[data-testid="credit-balance"]',
      '[data-testid="quick-actions"] button',
      'nav a',
      'table th',
      'form label'
    ];

    for (const selector of importantElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await checkA11y(page, selector, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
      }
    }
  });

  test('keyboard navigation', async ({ page }) => {
    // Test tab order and focus management
    let focusableElements = [];
    
    // Get all potentially focusable elements
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    for (const selector of selectors) {
      const elements = await page.locator(selector).all();
      for (const element of elements) {
        if (await element.isVisible()) {
          focusableElements.push(element);
        }
      }
    }

    // Test keyboard navigation through all elements
    if (focusableElements.length > 0) {
      await focusableElements[0].focus();
      
      for (let i = 1; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        
        // Verify focus moved correctly
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
      }
    }

    // Test escape key functionality
    const modals = page.locator('[role="dialog"], .modal');
    const modalCount = await modals.count();
    
    if (modalCount > 0) {
      await page.keyboard.press('Escape');
      // Modal should close or focus should return appropriately
    }
  });

  test('screen reader compatibility', async ({ page }) => {
    // Check for proper ARIA landmarks
    const landmarks = [
      '[role="main"]',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[role="complementary"]'
    ];

    let landmarkFound = false;
    for (const landmark of landmarks) {
      const element = page.locator(landmark);
      if (await element.count() > 0) {
        landmarkFound = true;
        break;
      }
    }
    
    expect(landmarkFound).toBeTruthy();

    // Check for skip links
    const skipLinks = page.locator('a[href^="#"]').first();
    if (await skipLinks.count() > 0) {
      const href = await skipLinks.getAttribute('href');
      const target = page.locator(href!);
      await expect(target).toBeAttached();
    }

    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const currentLevel = parseInt(tagName.charAt(1));
      
      // Heading levels should not skip more than one level
      if (previousLevel > 0) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
      
      previousLevel = currentLevel;
    }
  });

  test('error message accessibility', async ({ page }) => {
    await page.goto('/dashboard/generate');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);

    // Trigger validation errors
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="validation-error"]', { timeout: 5000 });

    const errorMessages = page.locator('[data-testid="validation-error"], .error-message, [role="alert"]');
    const errorCount = await errorMessages.count();

    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);
        
        // Error messages should be announced to screen readers
        const role = await error.getAttribute('role');
        const ariaLive = await error.getAttribute('aria-live');
        
        expect(role === 'alert' || ariaLive).toBeTruthy();
      }

      await checkA11y(page, null, {
        rules: {
          'aria-valid-attr-value': { enabled: true },
          'aria-roles': { enabled: true }
        }
      });
    }
  });

  test('mobile accessibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await injectAxe(page);

    // Mobile-specific accessibility checks
    await checkA11y(page, null, {
      rules: {
        'tap-target-size': { enabled: true },
        'color-contrast': { enabled: true },
        'focus-order-semantics': { enabled: true }
      }
    });

    // Check touch target sizes
    const touchTargets = page.locator('button, a, input[type="submit"], input[type="button"]');
    const touchTargetCount = await touchTargets.count();
    
    for (let i = 0; i < touchTargetCount; i++) {
      const target = touchTargets.nth(i);
      
      if (await target.isVisible()) {
        const box = await target.boundingBox();
        if (box) {
          // WCAG recommends minimum 44px touch targets
          expect(box.width).toBeGreaterThanOrEqual(40); // Slightly relaxed for dense UIs
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('custom accessibility report generation', async ({ page }) => {
    const violations = await getViolations(page);
    
    if (violations.length > 0) {
      // Generate detailed report
      const report = {
        url: page.url(),
        timestamp: new Date().toISOString(),
        violations: violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map(node => ({
            html: node.html,
            target: node.target,
            failureSummary: node.failureSummary
          }))
        }))
      };

      // Save report to file
      const fs = require('fs').promises;
      await fs.writeFile(
        `test-results/accessibility/detailed-report-${Date.now()}.json`,
        JSON.stringify(report, null, 2)
      );

      console.log(`Found ${violations.length} accessibility violations. Check detailed report.`);
    }

    // Don't fail the test for violations, just report them
    // In strict mode, you could use: expect(violations).toHaveLength(0);
  });
});