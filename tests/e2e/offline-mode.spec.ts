import { test, expect } from '@playwright/test';

test.describe('Health Coach PWA - Offline Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load onboarding page offline', async ({ page, context }) => {
    await page.waitForLoadState('networkidle');
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('إنشاء ملفك الصحي الشخصي')).toBeVisible();
  });

  test('should cache profile data offline', async ({ page, context }) => {
    await context.setOffline(false);
    await page.getByLabel('الوزن (كجم)').fill('70');
    await page.getByLabel('الطول (سم)').fill('170');
    await page.getByLabel('العمر (سنة)').fill('25');
    await page.getByLabel('الجنس').selectOption('male');
    await page.getByLabel('مستوى النشاط اليومي').selectOption('moderate');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'احسب احتياجاتي اليومية' }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
