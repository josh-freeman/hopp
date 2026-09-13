/** Explicit, manual test. Never imported by the quota-free automated suite. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const requests: string[] = [], errors: string[] = [];
page.on('request', request => { if (request.url().startsWith('https://transport.opendata.ch/')) requests.push(request.url()); });
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(process.env.HOPP_SMOKE_URL ?? 'http://127.0.0.1:4173/hopp/');
  await page.getByLabel('From', { exact: true }).fill('Basel, IWB');
  await page.getByLabel('To', { exact: true }).fill('Zürich HB');
  await page.getByRole('button', { name: 'Find connections', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-screen="results"]') || document.querySelector('[data-testid="error"]'), undefined, { timeout: 45000 });
  const connections = await page.getByTestId('connection-row').count();
  const outcome = connections ? 'Connections rendered' : 'API error rendered';
  const message = await page.getByTestId('error').allTextContents();
  await mkdir('docs/qa', { recursive: true });
  await page.screenshot({ path: 'docs/qa/live-api-smoke.png' });
  const report = { checkedAt: new Date().toISOString(), outcome, connections, apiRequests: requests, apiMessages: message, uncaughtErrors: errors };
  await writeFile('docs/qa/live-api-smoke.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) process.exitCode = 1;
} catch (error) {
  await mkdir('docs/qa', { recursive: true });
  await page.screenshot({ path: 'docs/qa/live-api-smoke.png' });
  console.log(JSON.stringify({ error: String(error), requests, uncaughtErrors: errors, visibleText: await page.locator('body').innerText() }, null, 2));
  process.exitCode = 1;
} finally { await browser.close(); }
