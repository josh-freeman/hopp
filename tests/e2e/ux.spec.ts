import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { allScreens, expectScreen, findConnections, showScreen, startDemo } from './helpers';

test('fresh profile reaches live in one tap after search, with honest budget and fallback', async ({ page }) => {
  await startDemo(page);
  // Each test has a fresh browser context: no profile, account, location grant, or prior trip.
  await findConnections(page);
  await expectScreen(page, 'results');
  await expect(page.getByTestId('offer-card').getByRole('heading', { level: 2 })).toContainText(/IC \d+ · \d{2}:\d{2}/);
  await expect(page.locator('.integrated-route')).toBeVisible();
  await expect(page.getByTestId('verdict-budget')).toContainText(/you have/i);
  await expect(page.getByTestId('verdict-budget')).toContainText(/need/i);
  await expect(page.getByTestId('verdict-budget')).toContainText(/margin/i);
  const seconds = (value: string) => {
    const [minutes, remainder] = value.trim().split(':').map(Number);
    return minutes * 60 + remainder;
  };
  const [have, need, margin] = (await page.getByTestId('verdict-budget').locator('strong').allTextContents()).map(seconds);
  const displayedSpare = seconds(await page.getByText('Spare after margin', { exact: true }).locator('..').locator('strong').innerText());
  expect(Math.abs(displayedSpare - (have - need - margin)), 'Displayed spare deducts both sprint and margin (allowing rounded seconds)').toBeLessThanOrEqual(2);
  await expect(page.getByTestId('screen')).toContainText(/walking/i);
  const fallback = (await page.getByTestId('fallback').innerText()).trim();
  expect(fallback.length).toBeGreaterThan(15);
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await expectScreen(page, 'live');
  await expect(page.getByTestId('fallback')).toHaveText(fallback, { useInnerText: true });
  await expect(page.getByTestId('fallback')).toContainText(/SBB|stay on|fallback/i);
  await expect(page.getByTestId('countdown')).toContainText(/\d+:\d{2}/);
  const initialCountdown = await page.getByTestId('countdown').innerText();
  await expect.poll(() => page.getByTestId('countdown').innerText(), { message: 'Live countdown advances', timeout: 5000 }).not.toBe(initialCountdown);
  await expect(page.getByTestId('platform')).toContainText(/\d/);
  await expect(page.getByTestId('alight')).toContainText(/Central/);
});

test('the map and directions are part of the result before committing to the sprint', async ({ page }) => {
  await startDemo(page);
  await findConnections(page);
  await expectScreen(page, 'results');
  const map = page.locator('.integrated-route .route-map');
  await expect(map).toBeVisible();
  await expect.poll(() => map.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { message: 'The route map asset loads' }).toBe(true);
  const rect = await map.boundingBox();
  const viewport = page.viewportSize()!;
  expect(rect!.y, 'Map is visible immediately after search').toBeGreaterThanOrEqual(0);
  expect(rect!.y, 'Map starts in the upper half of the result viewport').toBeLessThan(viewport.height * 0.5);
  const visibleHeight = Math.min(rect!.y + rect!.height, viewport.height) - Math.max(rect!.y, 0);
  expect(visibleHeight, 'Map has enough visible area to read without opening another screen').toBeGreaterThanOrEqual(140);
  await expect(page.locator('.integrated-route .route-directions')).toContainText(/Central|Bahnhofbrücke/);
  await expect(page.getByRole('button', { name: 'Go live', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Try it|Sprint it|Show me the route first|View sprint details/ })).toHaveCount(0);
});

test('legacy route steps return to the combined result', async ({ page }) => {
  await startDemo(page);
  await findConnections(page);
  for (const screen of ['try', 'route', 'detail', 'shortcut']) {
    await page.evaluate((name) => { window.location.hash = name; }, screen);
    await expect(page).toHaveURL(/#results$/);
    await expectScreen(page, 'results');
    await expect(page.locator('.integrated-route')).toBeVisible();
  }
});

test('Not now dismisses the sprint and keeps regular connections', async ({ page }) => {
  await startDemo(page);
  await findConnections(page);
  await expectScreen(page, 'results');
  const count = await page.getByTestId('connection-row').count();
  expect(count).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await expectScreen(page, 'results');
  await expect(page.getByTestId('offer-card')).toHaveCount(0);
  await expect(page.locator('.integrated-route')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Go live', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('connection-row')).toHaveCount(count);
  await expect(page.getByTestId('fallback')).toBeVisible();
});

for (const scenario of ['nohack', 'passed', 'unknown']) {
  test(`${scenario}: no sprint offer, normal connections remain available`, async ({ page }) => {
    await startDemo(page, scenario);
    await findConnections(page);
    await expectScreen(page, 'results');
    await expect(page.getByTestId('offer-card')).toHaveCount(0);
    await expect(page.getByTestId('connection-row').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go live', exact: true })).toHaveCount(0);
    await expect(page.locator('.integrated-route')).toHaveCount(0);
  });
}

for (const scenario of ['offline', 'ratelimit']) {
  test(`${scenario}: explain the failed search and finish loading`, async ({ page }) => {
    await startDemo(page, scenario);
    await findConnections(page);
    await expect(page.getByTestId('error')).toBeVisible();
    await expect(page.getByTestId('error')).toContainText(scenario === 'offline' ? /offline|connection|network/i : /too many|rate|wait|busy|try again/i);
    await expect(page.getByTestId('loading')).toBeHidden();
    await expect(page.getByTestId('offer-card')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /try again|find connections/i }).first()).toBeEnabled();
  });
}

test('a late tram refresh degrades the live decision to STAY ON and retains fallback', async ({ page }) => {
  await startDemo(page, 'late', '&poll=1000');
  await findConnections(page);
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await expectScreen(page, 'live');
  await expect(page.getByTestId('screen')).toContainText(/STAY ON/, { timeout: 15_000 });
  await expect(page.getByTestId('fallback')).toBeVisible();
  await expect(page.getByTestId('loading')).toBeHidden();
});

test('every screen has no serious or critical accessibility violations', async ({ page }) => {
  test.setTimeout(120_000);
  await startDemo(page);
  const audit = async (screen: string) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const significant = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
    expect(significant.map(({ id, impact, nodes }) => ({ id, impact, elements: nodes.map(({ target }) => target) })), `${screen}: axe serious/critical violations`).toEqual([]);
  };
  await audit('plan');
  await findConnections(page);
  await expectScreen(page, 'results');
  for (const screen of allScreens.filter((name) => name !== 'plan')) {
    await showScreen(page, screen);
    await test.step(`${screen}: axe`, () => audit(screen));
    if (screen === 'results') {
      await page.locator('details.route-notes > summary').click();
      await test.step('results with route sources expanded: axe', () => audit('results with route sources expanded'));
    }
  }
});

test('the combined result removes the sprint when its timetable becomes stale', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await startDemo(page);
  // Keep alighting in the future to test freshness independently of the passed-stop guard.
  await page.getByLabel('Departure', { exact: true }).selectOption('later');
  await findConnections(page);
  await expectScreen(page, 'results');
  await expect(page.locator('.integrated-route')).toBeVisible();
  await page.clock.fastForward(121_000);
  // Expiry removes the visible offer without requiring another click.
  await expectScreen(page, 'results');
  await expect(page.getByTestId('offer-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Go live', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start sprint', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('connection-row').first()).toBeVisible();
});

test('missing live trips cannot reset freshness or restart a stale countdown', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await startDemo(page, 'missing', '&poll=500');
  await page.getByLabel('Departure', { exact: true }).selectOption('later');
  await findConnections(page);
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await expectScreen(page, 'live');
  await expect(page.getByTestId('countdown')).toContainText(/\d+:\d{2}/);
  await page.clock.fastForward(121_000);
  await expect(page.getByTestId('live-status')).toHaveText('Updates paused');
  await expect(page.getByTestId('countdown')).toHaveText('—:—');
  await expect(page.getByRole('button', { name: 'Start sprint', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('fallback')).toBeVisible();
});

test('recorded Winterthur shortcut reaches the right platform with trip-specific sources', async ({ page }, testInfo) => {
  // Unmodified real timetable captures. Freeze the clock at the original query;
  // all API traffic is fulfilled locally, including autocomplete.
  await page.clock.install({ time: new Date('2026-09-15T08:04:00+02:00') });
  await page.route('https://transport.opendata.ch/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/connections')) {
      const name = url.searchParams.get('from') === '8506000'
        ? 'ne-gain-arch-aarau-candidates-0806.json' : 'ne-gain-arch-aarau-baseline-0804.json';
      await route.fulfill({ path: `data/research/raw/${name}`, contentType: 'application/json' });
    } else await route.fulfill({ json: { stations: [], stationboard: [] } });
  });
  await page.goto('#plan');
  await expect(page.locator('[data-action="shortcut"]')).toHaveCount(0);
  await page.getByLabel('From', { exact: true }).fill('8594298');
  await page.getByLabel('To', { exact: true }).fill('8502113');
  await findConnections(page);
  await expect(page.getByTestId('offer-card')).toContainText('08:09', { timeout: 25_000 });
  await expect(page.getByTestId('offer-card')).toContainText('Archstrasse/HB');
  await expect(page.getByTestId('offer-card')).toContainText('Platform 3');
  await expect(page.getByTestId('fallback')).toContainText('09:28');
  await expect(page.locator('.integrated-route .route-map img')).toHaveAttribute('alt', /Winterthur/);
  await expect(page.getByTestId('screen')).not.toContainText('Central');
  await page.locator('details.route-notes > summary').click();
  await expect(page.locator('.route-sources a').first()).toBeVisible();
  await expect(page.getByTestId('screen')).not.toContainText('Basel');
  await expect(page.locator('.offer-arrival')).toContainText('23 min earlier');
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await expect(page.getByTestId('alight')).toHaveText('Archstrasse/HB');
  await expect(page.getByTestId('platform')).toHaveText('3');
  await expect(page.getByTestId('live-status')).toHaveText('START AT');
  await expect(page.getByTestId('fallback')).toContainText('09:28');
  const shot = await page.screenshot();
  await testInfo.attach('Recorded Winterthur route', { body: shot, contentType: 'image/png' });
});

test('an origin offer disappears when its sprint window closes before data becomes stale', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await startDemo(page);
  await page.getByLabel('From', { exact: true }).fill('Basel, IWB');
  await page.getByLabel('To', { exact: true }).fill('Zürich HB');
  await findConnections(page);
  await expect(page.getByTestId('offer-card')).toBeVisible();
  await page.clock.fastForward(30_000);
  await expect(page.getByTestId('offer-card')).toHaveCount(0);
  await expect(page.getByTestId('screen')).toContainText('full margin');
  await expect(page.getByTestId('screen')).not.toContainText('passed the');
  await expect(page.getByTestId('connection-row').first()).toBeVisible();
});
