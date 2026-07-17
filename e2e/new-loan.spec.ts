import { test, expect } from '@playwright/test';

test.describe('New loan form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    await page.getByRole('link', { name: /Novo empréstimo/i }).click();
    await page.waitForURL(/#\/novo/);
  });

  test('shows all required form fields', async ({ page }) => {
    await expect(page.getByLabel(/Nome/)).toBeVisible();
    await expect(page.getByLabel(/1º vencimento/)).toBeVisible();
    await expect(page.getByLabel(/Valor emprestado/)).toBeVisible();
    await expect(page.getByLabel(/Entrada/)).toBeVisible();
    await expect(page.getByLabel(/Quantidade de parcelas/)).toBeVisible();
    await expect(page.getByLabel(/Valor por parcela/)).toBeVisible();
    await expect(page.getByLabel(/Juros/)).toBeVisible();
  });

  test('submit button is disabled when name is empty', async ({ page }) => {
    await page.getByLabel(/Nome/).fill('');
    await expect(page.getByRole('button', { name: /Criar empréstimo/i })).toBeDisabled();
  });

  test('submit button is disabled when principal amount is zero', async ({ page }) => {
    // Name has a default, but principal is 0 by default so submit should be disabled
    await expect(page.getByRole('button', { name: /Criar empréstimo/i })).toBeDisabled();
  });

  test('auto-computes interest rate from installment amount', async ({ page }) => {
    await page.getByLabel(/Valor emprestado/).fill('10000');
    await page.getByLabel(/Entrada/).fill('0');
    await page.getByLabel(/Quantidade de parcelas/).fill('12');
    await page.getByLabel(/Valor por parcela/).fill('900');
    // Interest rate field should be computed and non-empty
    const interestField = page.getByLabel(/Juros/);
    await expect(interestField).not.toHaveValue('');
    await expect(interestField).not.toHaveValue('0');
  });

  test('auto-computes installment amount from interest rate', async ({ page }) => {
    await page.getByLabel(/Valor emprestado/).fill('10000');
    await page.getByLabel(/Entrada/).fill('0');
    await page.getByLabel(/Quantidade de parcelas/).fill('12');
    await page.getByLabel(/Juros/).fill('1.5');
    // Installment field should be computed and non-empty
    const installmentField = page.getByLabel(/Valor por parcela/);
    await expect(installmentField).not.toHaveValue('');
    await expect(installmentField).not.toHaveValue('0');
  });

  test('computes total to pay correctly', async ({ page }) => {
    await page.getByLabel(/Valor emprestado/).fill('12000');
    await page.getByLabel(/Entrada/).fill('0');
    await page.getByLabel(/Quantidade de parcelas/).fill('12');
    await page.getByLabel(/Valor por parcela/).fill('1000');
    // Total a pagar = downPayment + installments * installmentAmount = 0 + 12 * 1000 = 12000
    const totalField = page.getByLabel(/Total a pagar/);
    await expect(totalField).toHaveValue('12000.00');
  });

  test('creates a loan and navigates to loan details page', async ({ page }) => {
    await page.getByLabel(/Nome/).fill('Empréstimo Playwright');
    await page.getByLabel(/Valor emprestado/).fill('12000');
    await page.getByLabel(/Entrada/).fill('0');
    await page.getByLabel(/Quantidade de parcelas/).fill('12');
    await page.getByLabel(/Valor por parcela/).fill('1000');

    await page.getByRole('button', { name: /Criar empréstimo/i }).click();

    await expect(page).toHaveURL(/#\/loan\//);
    await expect(page.getByRole('heading', { name: 'Empréstimo Playwright' })).toBeVisible();
  });

  test('back button returns to loans list', async ({ page }) => {
    await page.getByRole('button', { name: /Voltar/i }).first().click();
    await expect(page).toHaveURL(/\//);
    await expect(page.getByRole('heading', { name: 'Emprest Simples' })).toBeVisible();
  });
});
