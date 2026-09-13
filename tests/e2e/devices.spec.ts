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
  await expect(page.getByTestId('offer-card').getByRole('heading', { level: 2 })).toHaveText('Get off early at Central');
  await expect(page.locator('.offer-service')).toContainText(/IC \d+ · \d{2}:\d{2} · Platform 11/);
  await expect(page.locator('.offer-regular-stop')).toHaveText('One stop before Bahnhofplatz/HB, your usual stop');
  await expect(page.getByTestId('connection-row').first()).toBeVisible();
  const offer = await page.getByTestId('offer-card').boundingBox();
  const regular = await page.getByTestId('connection-row').first().boundingBox();
  expect(offer!.y + offer!.height, 'Sprint offer appears above regular connections').toBeLessThanOrEqual(regular!.y);
  await expect(page.locator('.integrated-route')).toBeVisible();
  await expect(page.locator('.integrated-route .route-map, .integrated-route .route-diagram')).toBeVisible();
  const mapImage = page.locator('.integrated-route .route-map img');
  await expect.poll(() => mapImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(mapImage).toHaveCSS('object-fit', 'cover');
  const map = await mapImage.boundingBox();
  const fixedActions = await page.locator('.results-actions').boundingBox();
  expect(map!.y, 'The complete map starts in the visible result').toBeGreaterThanOrEqual(0);
  expect(map!.height, 'The map remains large enough to read on the smallest phone').toBeGreaterThanOrEqual(180);
  expect(map!.y + map!.height, 'Both map endpoints fit above Guide me there, including at 320×568').toBeLessThanOrEqual(fixedActions!.y + 1);
  await expect(page.getByTestId('fallback')).toBeVisible();
  await page.getByRole('button', { name: 'Guide me there', exact: true }).click();
  await audit('live');
  await expect(page.getByTestId('live-status')).toHaveText('GET OFF EARLY AT');
  await page.getByRole('button', { name: 'Start sprint', exact: true }).click();
  await expectScreen(page, 'live');
  await page.getByRole('button', { name: 'On the platform', exact: true }).click();
  await audit('done');

  await showScreen(page, 'settings');
  await audit('settings');
  await page.getByRole('button', { name: 'Your profile', exact: true }).click();
  await audit('account');
  await expect(page.getByRole('button', { name: 'Open demo profile', exact: true })).toBeVisible();
});
