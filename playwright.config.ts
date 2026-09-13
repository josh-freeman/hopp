import { defineConfig, devices, type Project } from '@playwright/test';

// These are CSS viewport classes, not claims of physical-device testing.
const iphones = [
  [375, 667], [375, 812], [390, 844], [393, 852], [402, 874],
  [414, 896], [428, 926], [430, 932], [440, 956],
] as const;
const samsungs = [[344, 882], [360, 740], [360, 800], [384, 824], [412, 915], [674, 841]] as const;

function phone(browser: 'webkit' | 'chromium', width: number, height: number, minimal = false): Project {
  const name = `${minimal ? 'minimum' : browser === 'webkit' ? 'iphone' : 'samsung'}-${width}x${height}`;
  const representative = (browser === 'webkit' && width === 390) || (browser === 'chromium' && width === 412);
  return {
    name,
    testMatch: representative ? /(?:devices|ux)\.spec\.ts/ : /devices\.spec\.ts/,
    use: {
      ...devices[browser === 'webkit' ? 'iPhone 13' : 'Galaxy S9+'],
      browserName: browser,
      viewport: { width, height },
      screen: { width, height },
      deviceScaleFactor: 1, // CSS layout evidence at a manageable artifact size.
      isMobile: true,
      hasTouch: true,
    },
  };
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173/hopp/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    ...iphones.map(([width, height]) => phone('webkit', width, height)),
    ...samsungs.map(([width, height]) => phone('chromium', width, height)),
    phone('webkit', 320, 568, true),
  ],
  webServer: {
    command: 'bun run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/hopp/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
