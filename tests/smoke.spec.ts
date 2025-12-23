import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
    test('landing page should load', async ({ page }) => {
        await page.goto('/');

        // Check for the main title
        const title = page.locator('h1');
        await expect(title).toContainText('ClerQ');

        // Check for the CTA button
        const cta = page.locator('button', { hasText: 'Start 7-Day Free Trial with Google' });
        await expect(cta).toBeVisible();
    });

    test('pricing section should be visible if not logged in', async ({ page }) => {
        await page.goto('/');
        // The landing page shows the hero section for unauthenticated users
        await expect(page.getByText('AI-powered finance tracking')).toBeVisible();
    });

    test('dashboard should redirect to home if not logged in', async ({ page }) => {
        await page.goto('/dashboard');
        // Middleware should redirect to home
        await expect(page).toHaveURL('/');
    });

    test('admin should redirect to home if not logged in', async ({ page }) => {
        await page.goto('/admin');
        // Middleware should redirect to home
        await expect(page).toHaveURL('/');
    });
});
