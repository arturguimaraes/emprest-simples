import { test, expect } from '@playwright/test';

test.describe('Loans list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for auth mock to resolve and app to render
    await page.waitForSelector('h1', { timeout: 5000 });
  });

  test('shows the page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Emprest Simples' })).toBeVisible();
  });

  test('shows empty state when no loans exist', async ({ page }) => {
    await expect(page.getByText('Nenhum empréstimo ainda')).toBeVisible();
  });

  test('shows "Novo empréstimo" button', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Novo empréstimo/i })).toBeVisible();
  });

  test('navigates to new loan form on button click', async ({ page }) => {
    await page.getByRole('link', { name: /Novo empréstimo/i }).click();
    await expect(page).toHaveURL(/#\/novo/);
    await expect(page.getByRole('heading', { name: 'Novo empréstimo' })).toBeVisible();
  });
});
