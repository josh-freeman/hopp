import { chromium } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

// Captures the actual app UI with synthetic timetable data; no API quota is used.
const destination = 'out/demo';
mkdirSync(destination, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, colorScheme: 'light',
  recordVideo: { dir: destination, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
const began = Date.now();
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(process.env.HOPP_DEMO_URL ?? 'https://joshfreeman.me/hopp/?mock=1#plan', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Find connections', exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
const trimStartS = (Date.now() - began) / 1000;
const chapters: { atS: number; label: string }[] = [];
const hold = (ms: number) => page.waitForTimeout(ms);
const mark = (label: string) => chapters.push({ atS: +(Date.now() / 1000 - began / 1000 - trimStartS).toFixed(2), label });
async function tap(target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error('Demo control is not visible');
  await page.evaluate(({ x, y }) => {
    const ring = document.createElement('span');
    ring.style.cssText = `position:fixed;left:${x - 16}px;top:${y - 16}px;width:32px;height:32px;border:2px solid #bb3227;border-radius:50%;background:#bb32272b;pointer-events:none;z-index:100000;`;
    document.body.append(ring);
    ring.animate([{ transform: 'scale(.65)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 550, easing: 'ease-out' });
    setTimeout(() => ring.remove(), 550);
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await hold(180);
  await target.tap();
  await hold(400);
}
mark('Search a trip');
await hold(3000);
await tap(page.getByRole('button', { name: 'Find connections', exact: true }));
await page.getByTestId('offer-card').waitFor();
await page.locator('.integrated-route .route-map img').evaluate(async (img: HTMLImageElement) => { if (!img.complete) await new Promise(resolve => img.addEventListener('load', resolve, { once: true })); });
mark('Check the map and timing');
await hold(6500);
await page.evaluate(() => {
  const heading = document.querySelector('.route-directions')!;
  window.scrollTo({ top: heading.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
});
mark('Read directions and the fallback');
await hold(5500);
await tap(page.getByRole('button', { name: 'Go live', exact: true }));
await page.getByTestId('live-status').waitFor();
mark('Follow the live countdown');
const initialCountdown = await page.getByTestId('countdown').innerText();
await page.screenshot({ path: `${destination}/poster.png` });
await hold(6700);
const finalCountdown = await page.getByTestId('countdown').innerText();
if (initialCountdown === finalCountdown) throw new Error('Live countdown did not advance');
await tap(page.getByRole('button', { name: 'Your profile', exact: true }));
await page.getByRole('button', { name: 'Open demo profile', exact: true }).waitFor();
mark('Open a free profile');
await hold(2200);
await tap(page.getByRole('button', { name: 'Open demo profile', exact: true }));
await page.getByTestId('profile-pass').waitFor();
await hold(2400);
await tap(page.locator('[data-scenario="budget"].practice-toggle'));
mark('Try a practice check');
await hold(3200);
await tap(page.locator('[data-answer="51-seconds"]'));
await page.getByTestId('practice-points').filter({ hasText: '25' }).waitFor();
await hold(2000);
await tap(page.getByRole('button', { name: 'Use Forest', exact: true }));
await page.locator('.profile-pass.theme-forest').waitFor();
mark('Keep an unlocked profile style');
await hold(4000);
const contentDurationS = +(Date.now() / 1000 - began / 1000 - trimStartS).toFixed(2);
const video = page.video()!;
await context.close();
const rawVideo = await video.path();
const report = { url: process.env.HOPP_DEMO_URL ?? 'https://joshfreeman.me/hopp/?mock=1#plan', rawVideo, trimStartS, contentDurationS, chapters, initialCountdown, finalCountdown, errors };
writeFileSync(`${destination}/recording.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
await browser.close();
if (errors.length) process.exitCode = 1;
