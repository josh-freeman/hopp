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
  await expect(page.getByTestId('offer-card')).toContainText(/You can still make the/);
  await expect(page.getByTestId('connection-row').first()).toBeVisible();
  const offer = await page.getByTestId('offer-card').boundingBox();
  const regular = await page.getByTestId('connection-row').first().boundingBox();
  expect(offer!.y + offer!.height, 'Sprint offer appears above regular connections').toBeLessThanOrEqual(regular!.y);
  await page.getByRole('button', { name: 'Try it', exact: true }).click();
  await audit('try');
  await page.getByRole('button', { name: 'Sprint it', exact: true }).click();
  await audit('detail');
  await expect(page.getByTestId('fallback')).toBeVisible();
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await audit('live');
  await page.getByRole('button', { name: 'Start sprint', exact: true }).click();
  await expectScreen(page, 'live');
  await page.getByRole('button', { name: 'On the platform', exact: true }).click();
  await audit('done');

  for (const screen of ['route', 'shortcut', 'settings'] as const) {
    await showScreen(page, screen);
    await audit(screen);
  }
});
