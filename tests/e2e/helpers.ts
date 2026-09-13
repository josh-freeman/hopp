import { expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export type Screen = 'plan' | 'results' | 'live' | 'settings' | 'done';
export const allScreens: Screen[] = ['plan', 'results', 'live', 'settings', 'done'];

export async function expectScreen(page: Page, screen: Screen) {
  await expect(page.getByTestId('screen')).toHaveAttribute('data-screen', screen);
  await expect(page.getByTestId('loading')).toBeHidden();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.evaluate(() => window.scrollY), { message: `${screen}: navigation starts at the top` }).toBe(0);
}

export async function startDemo(page: Page, scenario = '1', extra = '') {
  await page.goto(`?mock=${scenario}${extra}#plan`);
  await expectScreen(page, 'plan');
}

export async function findConnections(page: Page) {
  const from = page.getByLabel('From', { exact: true });
  const to = page.getByLabel('To', { exact: true });
  if (!(await from.inputValue())) await from.fill('Zürich, Bellevue');
  if (!(await to.inputValue())) await to.fill('Bern');
  await page.getByRole('button', { name: 'Find connections', exact: true }).click();
}

export async function showScreen(page: Page, screen: Screen) {
  await page.evaluate((name) => { window.location.hash = name; }, screen);
  await expectScreen(page, screen);
}

export async function screenshotScreen(page: Page, testInfo: TestInfo, screen: Screen) {
  const directory = resolve('docs', 'qa', testInfo.project.name);
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `${screen}.png`);
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  await testInfo.attach(`${screen} (${testInfo.project.name})`, { path, contentType: 'image/png' });
}

export async function auditLayout(page: Page, screen: Screen) {
  const audit = await page.evaluate(() => {
    const problems: string[] = [];
    const width = window.innerWidth;
    const describe = (element: Element) => `${element.tagName.toLowerCase()} ${element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 70) || element.getAttribute('name') || ''}`;
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
    };
    if (Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > width + 1) {
      problems.push(`Horizontal overflow: content ${Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)}px, viewport ${width}px`);
    }
    for (const element of document.querySelectorAll('button, a[href], summary, input:not([type="hidden"]), select, textarea, [role="button"], [role="switch"]')) {
      if (!visible(element)) continue;
      let rect = element.getBoundingClientRect();
      if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) {
        for (const label of Array.from(element.labels ?? [])) {
          const labelRect = label.getBoundingClientRect();
          if (labelRect.width >= rect.width && labelRect.height >= rect.height) rect = labelRect;
        }
      }
      if (rect.width < 43.5 || rect.height < 43.5) problems.push(`Tap target ${rect.width.toFixed(1)}×${rect.height.toFixed(1)}: ${describe(element)}`);
      if ((element instanceof HTMLInputElement && !['checkbox', 'radio', 'range', 'hidden'].includes(element.type)) || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
        const size = Number.parseFloat(window.getComputedStyle(element).fontSize);
        if (size < 16) problems.push(`Input font ${size}px: ${describe(element)}`);
      }
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const checked = new Set<Element>();
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (!walker.currentNode.textContent?.trim() || !parent || checked.has(parent) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName) || !visible(parent)) continue;
      checked.add(parent);
      const size = Number.parseFloat(window.getComputedStyle(parent).fontSize);
      if (size < 12) problems.push(`Text font ${size}px: ${describe(parent)}`);
    }
    return problems;
  });
  expect(audit, `${screen}: phone layout and readable controls`).toEqual([]);

  const actions = page.getByTestId('primary-action');
  for (let index = 0; index < await actions.count(); index++) {
    const action = actions.nth(index);
    if (!(await action.isVisible())) continue;
    const rect = await action.boundingBox();
    const viewport = page.viewportSize()!;
    expect(rect, `${screen}: primary action has a visible hit area`).not.toBeNull();
    expect(rect!.y + rect!.height / 2, `${screen}: primary action in lower quarter`).toBeGreaterThanOrEqual(viewport.height * 0.75);
    expect(rect!.y + rect!.height, `${screen}: primary action above bottom edge`).toBeLessThanOrEqual(viewport.height + 1);
  }
  if (screen === 'live') {
    await expect(page.locator('.app-header')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.demo-banner')).toBeInViewport({ ratio: 1 });
    for (const id of ['countdown', 'platform', 'alight', 'fallback']) {
      const element = page.getByTestId(id);
      await expect(element).toBeVisible();
      const rect = await element.boundingBox();
      expect(rect!.y, `${id}: above viewport top`).toBeGreaterThanOrEqual(-1);
      expect(rect!.y + rect!.height, `${id}: fully above fold`).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    }
  }
}
