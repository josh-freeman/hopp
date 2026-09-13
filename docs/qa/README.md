# Phone QA

Hopp's automated phone checks exercise the flow in design spec §0: Plan → Results with map, timing, directions and fallback → **Go live** → **Start sprint** → **On the platform**. Settings and Profile are optional. Profile adds practice, daily-use progress and saved private trip notes without adding a step to the trip flow. Route notes and sources expand within Results. Start sprint records when the passenger leaves the feeder so passing the alight stop does not incorrectly cancel a run already in progress. Demo scenarios run without transport API access or real account setup; **Open demo profile** uses isolated local data.

Current validation, 2026-09-13: **110 frontend unit tests passed with 564 assertions; 68 backend tests passed** (32 Hopp checks plus 36 website/member/Stripe regressions). The full **56 browser checks passed in 21.3 seconds** after the account and map integration fixes. The current matrix covers 16 viewport classes and six screens, producing 96 screenshots. Five isolated backend response fixtures also passed the frontend Zod schemas. See [the UX review](ux-review.md) for changes and checks that still require physical devices or participants.

## Run

```sh
bun install
bunx playwright install chromium webkit
bun run build
bun run test:devices
bun run test:ux
```

Playwright starts the built Vite preview at `http://127.0.0.1:4173/hopp/`. Build again after changing app code. Run `bun run test:e2e` to run both suites together. To investigate one viewport, use `bunx playwright test --project=iphone-390x844` or `--project=samsung-412x915`. Open `playwright-report/index.html` with `bunx playwright show-report` for steps and failure traces.

The browser preview at `/hopp/phone.html` has viewport, screen, and scenario selectors. It uses the browser in which it is opened; selecting an iPhone size does not switch the browser engine. Screens beyond Plan open deterministic trip data automatically in mock mode. The Profile selector opens the optional account screen; **Open demo profile** then enables isolated practice and customization. It never reads real website/Hopp tokens or calls the account backend.

## Coverage

| Engine | Project / CSS viewport |
| --- | --- |
| WebKit | iphone-375x667, iphone-375x812, iphone-390x844, iphone-393x852, iphone-402x874 |
| WebKit | iphone-414x896, iphone-428x926, iphone-430x932, iphone-440x956 |
| Chromium | samsung-344x882, samsung-360x740, samsung-360x800, samsung-384x824, samsung-412x915, samsung-674x841 |
| WebKit | minimum-320x568 |

Each viewport project runs one complete flow, audits Plan, Results, Live, Settings, On the platform and Profile, and writes screenshots to `docs/qa/<project>/<screen>.png`. Each image captures the visible phone viewport at one image pixel per CSS pixel, preserving the specified device dimensions. Scrollable content below the screenshot is also checked by the DOM layout audit and can be reviewed in the interactive preview. The suite checks:

- No horizontal overflow; visible text at least 12 px; text inputs at least 16 px; interactive hit areas at least 44 × 44 px. A labeled checkbox or radio may use its associated label as its hit area.
- Primary actions in the lower quarter of the viewport and above its bottom edge, including the Results **Go live** action.
- Live countdown, alight stop, platform, and fallback fully visible before scrolling, including at 320 × 568.
- A sprint offer shows its public train number and departure time above normal connections, with the matching route included in the same screen.
- Across all sixteen viewport classes, the entire Results map image is visible above the fixed **Go live** action, is at least 180 px high and uses `object-fit: contain`; both endpoints remain in view, including at 320 × 568.

The behavior and accessibility suite runs on one representative WebKit phone (390 × 844) and one Chromium phone (412 × 915), avoiding duplicated scenario runs on every size. It checks:

- Fresh storage requires no account, pace setup, or location permission. Results → **Go live** takes one action tap after search.
- The budget says “You have”, “need”, and “margin”; walking remains a comparison; fallback stays visible through commitment and live mode.
- The route map loads within Results, begins in the upper half of the representative phone viewports, and has at least 140 px of visible map height. Directions and sources can be read before starting the sprint.
- Legacy `#try`, `#route`, `#detail` and `#shortcut` links resolve to the combined `#results` screen.
- Not now dismisses the offer while retaining regular connections and the fallback.
- `?mock=nohack`, `passed`, and `unknown` show normal connections without a sprint offer.
- `?mock=offline` and `ratelimit` finish loading, explain the error, and allow retry.
- `?mock=late&poll=1000` updates the live verdict to STAY ON while retaining the fallback.
- An offer older than two minutes cannot be revived through navigation, and `?mock=missing` cannot use unmatched live trips to refresh an expired countdown.
- All six screens are checked for serious or critical axe violations under WCAG 2 A/AA and WCAG 2.1 A/AA rules. The full run passed these checks; this automated scan remains a partial accessibility check.
- Optional demo sign-in stays separate from real website/Hopp storage. Practice awards 25 once per correct question and zero for wrong or repeated answers; unlocked profile-card styles persist and tampered theme selections are rejected.
- Daily-check progress awards 5 once per Swiss calendar day, remains distinct from zero-point platform notes, and does not change the trip decision. The profile shows cumulative milestones and an unlock action with reduced-motion support.
- Profile sign-out/deletion preserves unrelated website storage, and the signed-in screen is checked for narrow layout and accessibility.

Screenshots are generated evidence, not visual snapshot comparisons with an approved baseline. Test assertions and the Playwright report determine automated pass/fail. Only the six current screen names contribute to the 96-image matrix; older local screenshots may remain as ignored artifacts. The older mockups in `docs/design/phone-flow/` record the original proposal; the simplified flow in spec §0 is the current reference.

## Account validation boundaries

**Production accounts are pending deployment.** Backend source is implemented and pushed, but both Fly builders rejected deployment for overdue invoices. Production Hopp endpoints still return 404. The frontend preflight retains users in Hopp with an unavailable message; demo accounts work independently. Resolve billing, deploy the API and record production checks before describing real sign-in or sync as live.

The frontend account unit suite tests remote JSON validation, stable failures, one-time callback consumption, session races, website-session validation, Hopp-only storage/deletion behavior, private zero-point attempts and mock isolation. The separate backend suite tests OAuth state/code browser binding, expiry/replay, authoritative identity linking, privilege separation, server grading, duplicate awards, Swiss midnight/DST, theme locks, session revocation, website account deletion with foreign-key constraints and administrator metric cohorts.

The metrics checks cover authenticated DAU/WAU/MAU/YAU, activation, DAU/MAU stickiness and exact-day D7/D30 retention, including empty denominators and incomplete Swiss follow-up days. They validate the implementation, not actual user retention or travel behavior. [The account guide](../ACCOUNTS.md) defines each measure.

Passing these suites does not establish a human Google consent round trip. Frontend Pages publication and the account API deployment are separate; a successful anonymous planner request does not prove authenticated production mutations work. No production account is created or deleted by the mock browser suite.

## Published release checks

GitHub [run 34775535766](https://github.com/josh-freeman/hopp/actions/runs/34775535766) passed all 56 browser tests on Linux and deployed frontend revision `d87b17c` on 2026-09-13. A direct browser check on the public site then confirmed the SVG headline, early-exit result, isolated demo signup, a 25-point practice award and the Forest style surviving reload, with no uncaught errors or external demo requests. The public video played successfully: HTTP 200, 40.04 seconds, 780 × 1688, with no horizontal overflow.

The real sign-in availability check received HTTP 404 from the undeployed account endpoint and displayed the unavailable message inside Hopp. This confirms the fallback behavior, not live Google authentication. Backend revision `f924884` is ready to deploy after Fly billing is resolved.

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
| Human Google consent: sign-in, callback, reuse, sign-out and deletion | Not yet recorded; automated OAuth tests use a fake provider |
| Practice/daily-point comprehension, theme selection and cumulative milestones | Think-aloud task prepared; participant evidence not yet recorded |

The demo's deterministic response is a UX fixture. It is not a measurement of current Swiss transport service or field verification of a sprint route.

The [demo player](https://joshfreeman.me/hopp/demo.html) records search → early-alighting result/map → budget/directions → live countdown → isolated demo profile → a correct practice answer worth 25 points → selecting Forest. The 40.04-second, 780 × 1688 H.264 export is approximately 2.50 MB and has no audio. It uses synthetic timetable/account data and ends on the Forest profile without starting an actual sprint. The player and downloadable MP4 are generated from the browser recording, separately from the screenshot matrix.

## Live timetable smoke check

`scripts/live-smoke.ts` is an explicit manual check, separate from the automated suite. On 2026-09-13 the browser loaded six real Basel IWB → Zürich HB connections with no API messages or uncaught JavaScript errors. The three requests (two route searches and one autocomplete) and capture time are in `live-api-smoke.json`; the phone screenshot is `live-api-smoke.png`. This validates API integration at that moment, not the physical shortcut.
