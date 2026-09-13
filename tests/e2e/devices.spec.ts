import { test, expect } from '@playwright/test';
import { auditLayout, expectScreen, findConnections, screenshotScreen, showScreen, startDemo, type Screen } from './helpers';

test('complete phone flow and screen layout', async ({ page }, testInfo) => {
  const audit = async (screen: Screen) => {
    await test.step(`${screen}: layout and screenshot`, async () => {
      await expectScreen(page, screen);
      await auditLayout(page, screen);
      await screenshotScreen(page, testInfo, screen);
    });
  };

  await startDemo(page);
  await audit('plan');
  await findConnections(page);
  await audit('results');
  await expect(page.getByTestId('offer-card').getByRole('heading', { level: 2 })).toContainText(/IC \d+ · \d{2}:\d{2}/);
  await expect(page.getByTestId('connection-row').first()).toBeVisible();
  const offer = await page.getByTestId('offer-card').boundingBox();
  const regular = await page.getByTestId('connection-row').first().boundingBox();
  expect(offer!.y + offer!.height, 'Sprint offer appears above regular connections').toBeLessThanOrEqual(regular!.y);
  await expect(page.locator('.integrated-route')).toBeVisible();
  await expect(page.locator('.integrated-route .route-map, .integrated-route .route-diagram')).toBeVisible();
  await expect(page.getByTestId('fallback')).toBeVisible();
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await audit('live');
  await page.getByRole('button', { name: 'Start sprint', exact: true }).click();
  await expectScreen(page, 'live');
  await page.getByRole('button', { name: 'On the platform', exact: true }).click();
  await audit('done');

  await showScreen(page, 'settings');
  await audit('settings');
});
