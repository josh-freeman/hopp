# Phone QA

Hopp's automated phone checks exercise the approved flow in design spec §0: Plan → Results → Try it → Sprint detail → Live → Start sprint → On the platform, plus the optional route map, Shortcut, and Settings screens. Start sprint records when the passenger leaves the tram so passing the alight stop does not incorrectly cancel a run already in progress. Demo scenarios run without transport API access or account setup.

Latest run, 2026-09-13: **40 browser checks passed**, covering 16 viewport classes and producing 144 screenshots. See [the UX review](ux-review.md) for observed issues, fixes, and checks that still require physical devices or participants.

## Run

```sh
bun install
bunx playwright install chromium webkit
bun run build
bun run test:devices
bun run test:ux
```

Playwright starts the built Vite preview at `http://127.0.0.1:4173/hopp/`. Build again after changing app code. Run `bun run test:e2e` to run both suites together. To investigate one viewport, use `bunx playwright test --project=iphone-390x844` or `--project=samsung-412x915`. Open `playwright-report/index.html` with `bunx playwright show-report` for steps and failure traces.

The browser preview at `/hopp/phone.html` has viewport, screen, and scenario selectors. It uses the browser in which it is opened; selecting an iPhone size does not switch the browser engine. Screens beyond Plan open deterministic demo data automatically in mock mode.

## Coverage

| Engine | Project / CSS viewport |
| --- | --- |
| WebKit | iphone-375x667, iphone-375x812, iphone-390x844, iphone-393x852, iphone-402x874 |
| WebKit | iphone-414x896, iphone-428x926, iphone-430x932, iphone-440x956 |
| Chromium | samsung-344x882, samsung-360x740, samsung-360x800, samsung-384x824, samsung-412x915, samsung-674x841 |
| WebKit | minimum-320x568 |

Each of the 16 viewport projects runs one complete flow, audits all nine screens, and writes screenshots to `docs/qa/<project>/<screen>.png`. Each image captures the visible phone viewport at one image pixel per CSS pixel, preserving the specified device dimensions. Scrollable content below the screenshot is also checked by the DOM layout audit and can be reviewed in the interactive preview. The suite checks:

- No horizontal overflow; visible text at least 12 px; text inputs at least 16 px; interactive hit areas at least 44 × 44 px. A labeled checkbox or radio may use its associated label as its hit area.
- Primary actions in the lower quarter of the viewport and above its bottom edge. Results is exempt from the positioning rule because its approved Try it action belongs inside the offer card above normal connections.
- Live countdown, alight stop, platform, and fallback fully visible before scrolling, including at 320 × 568.
- Try it's sprint/spare panel and complete have/need/margin budget above its fixed actions on every viewport.
- A sprint offer appears above normal connections, with the approved “You can still make the…” headline.

The behavior and accessibility suite runs on one representative WebKit phone (390 × 844) and one Chromium phone (412 × 915), avoiding duplicated scenario runs on every size. It checks:

- Fresh storage requires no account, pace setup, or location permission. Search → Try it → Sprint it → Go live takes three action taps after search.
- The budget says “You have”, “need”, and “margin”; walking remains a comparison; fallback stays visible through commitment and live mode.
- The route can be opened before committing to the sprint.
- Not now dismisses the offer while retaining regular connections and the fallback.
- `?mock=nohack`, `passed`, and `unknown` show normal connections without a sprint offer.
- `?mock=offline` and `ratelimit` finish loading, explain the error, and allow retry.
- `?mock=late&poll=1000` updates the live verdict to STAY ON while retaining the fallback.
- A route preview older than two minutes cannot revive a sprint offer, and `?mock=missing` cannot use unmatched live trips to refresh an expired countdown.
- All nine screens have no serious or critical axe violations under WCAG 2 A/AA and WCAG 2.1 A/AA rules. This automated scan is a partial accessibility check.

Screenshots are generated evidence, not visual snapshot comparisons with an approved baseline. Test assertions and the Playwright report determine automated pass/fail; human review compares screenshot composition with `docs/design/phone-flow/`.

## Physical-device and human checks

These projects emulate viewport dimensions, mobile input, and browser engines. They do **not** establish that a physical iPhone or Samsung device was tested. Device names identify viewport classes, not certified model coverage. The one-pixel screenshot scale also does not simulate native pixel density. Browser chrome, notches and safe-area values, software keyboard behavior, OS text scaling, thermal/network conditions, vibration, and wake lock need checks on real hardware.

Use [the think-aloud script](think-aloud-script.md) for comprehension and one-handed tasks. Record the device model, OS/browser versions, zoom/text settings, network state, task completion, mistaken decisions, and quotes. Do not mark this manual work complete from automated evidence.

| Manual check | Evidence / result |
| --- | --- |
| Physical iPhone Safari: keyboard, safe areas, collapsed/expanded browser bars | Not yet recorded |
| Physical Samsung Chrome: keyboard, system font scaling, browser bars | Not yet recorded |
| VoiceOver and TalkBack: labels, reading order, live updates | Not yet recorded |
| Think-aloud users: 3-second decision and fallback understanding | Not yet recorded |
| Real tram timing and station route field verification | Not yet recorded; seed routes retain their verification status |

The demo's deterministic response is a UX fixture. It is not a measurement of current Swiss transport service or field verification of a sprint route.

## Live timetable smoke check

`scripts/live-smoke.ts` is an explicit manual check, separate from the automated suite. On 2026-09-13 the browser loaded six real Basel IWB → Zürich HB connections with no API messages or uncaught JavaScript errors. The three requests (two route searches and one autocomplete) and capture time are in `live-api-smoke.json`; the phone screenshot is `live-api-smoke.png`. This validates API integration at that moment, not the physical shortcut.
