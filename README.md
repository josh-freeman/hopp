# Hopp

**the art of being on time**

Train shortcuts for runners. Hopp shows researched Swiss station shortcuts alongside the regular connection, with the map, estimated sprint duration, margin and fallback together.

[Open Hopp](https://joshfreeman.me/hopp/) · [Watch the demo](https://joshfreeman.me/hopp/demo.html) · [Try a practice trip](https://joshfreeman.me/hopp/?mock=1)

The planner includes **11 enabled route records**, including nine additions from the expanded Swiss research. Coverage includes Zürich HB, Basel SBB, Winterthur, Chur, Oerlikon, Nyon, Bern, Biel, Genève and Neuchâtel, with specific supported platforms. The research covers **40 stations**, including 25 detailed approaches and 38 broader timetable observations. Routes are desk researched, **not yet timed or verified on foot**. Unresolved approaches and the Lausanne draft cannot generate offers.

Read the [route research and sources](docs/research/2026-09-13-route-expansion.md), including a captured Winterthur → Aarau example with a modelled 23-minute earlier arrival. The app reveals route notes only within a relevant trip; there is no browse-all route screen.

## Run

Requires Bun 1.3 and Node 20 or newer (Node 22 in CI).

```sh
bun install
bun run dev
```

Open `http://localhost:5173/hopp/` for real timetable searches. Open `http://localhost:5173/hopp/?mock=1` for a clearly labelled practice trip that makes no external timetable requests. The dev server listens on the local network so a phone on the same Wi-Fi can open `http://<your-Mac-IP>:5173/hopp/`. Location and wake lock need HTTPS or localhost; ordinary planning works on the LAN URL.

## What works

- Swiss origin/destination search, nearby stops, departure time in Europe/Zurich, and recent destinations.
- Regular connections plus a sprint offer only when a curated route leaves the full margin and improves arrival.
- Search → results with the route map, timing, directions and fallback together → one tap on **Guide me there**. Route sources expand in place.
- Live countdown, a separate **Start sprint** action, and platform self-confirmation.
- One configurable sprint pace (3.5 m/s default), luggage adjustment, minimum margin and offer toggle; local preferences work without an account.
- Isolated demo profiles with practice, daily-check points, cumulative milestones and six selectable profile styles. Account controls stay outside the trip flow.
- Implemented Google/website account support for synced preferences, private profiles and trip notes; real accounts await the separate API deployment described below.
- Live stationboards matched to the chosen trip's scheduled identity; delay/platform rescoring and fallback checks; stale countdowns stop after 120 seconds.
- Install manifest, local icons, safe-area spacing, feature-detected wake lock, dark mode and reduced-motion support.

The map appears in the search result before the longer directions. Bundled area maps use the researched station and platform context; they do not provide indoor positioning or verify that an entrance is open. The six app screens are Plan, Results, Live, Settings, On the platform and Profile. For an early-alighting offer, **GET OFF EARLY AT** identifies the stop before the usual station stop; origin-start routes use their own appropriate instruction.

The timetable API needs no key. See [API behavior](docs/API.md) and [model audit](docs/qa/model-review.md) for limits. Onward services need a fresh whole-journey check; a stationboard cannot verify an entire connecting itinerary. SBB remains the place for tickets and official departure information.

## Verify

```sh
bun run validate
bun run test
bun run build
bunx playwright install chromium webkit
bun run test:e2e
```

`bun run test:devices` runs the phone matrix; `bun run test:ux` runs the scenario/accessibility checks. Tests use both recovered, unmodified API recordings and explicitly synthetic scenarios. Browser tests never spend the timetable quota. Screenshots and human test instructions are in [docs/qa](docs/qa/README.md); `http://localhost:5173/hopp/phone.html` is an interactive phone frame.

Demo variants: `?mock=nohack`, `late`, `passed`, `unknown`, `ratelimit`, `offline` and `missing`. `?mock=late&poll=1000` accelerates practice polling. Live API polling remains paced independently.

## Accounts and progress

**Production account deployment is pending.** The account API passed its checks, but both Fly builders rejected deployment because of overdue invoices; production Hopp endpoints still return 404. The frontend keeps sign-in failures inside Hopp with an unavailable message. Demo profiles and rewards work locally. Resolving Fly billing and deploying the API are required before real sign-in, sync and server awards can be used.

Sign-in is optional. Hopp validates an existing website session or uses Google to create a dedicated Hopp session; it does not grant website membership or administrator access. Sign-out affects Hopp only. Deleting Hopp data removes its profile, progress and saved trips while preserving the website account and access. See [account integration](docs/ACCOUNTS.md).

Each first correct answer to the three practice questions earns **25 points**. The first successful signed-in connection check each **Europe/Zurich calendar day** earns **5 points**; repeated checks that day add zero. Prepared marks all three completed questions. Active-day milestones at **7, 30 and 100 cumulative days** never reset after a break.

| Profile style | Points required |
| --- | ---: |
| Signal | 0 |
| Forest | 25 |
| Night | 75 |
| Track | 150 |
| Alpine | 300 |
| Dusk | 600 |

Points unlock the profile card styles without spending the balance. Platform confirmation can save a private **unverified** trip record and earns **zero points**. No GPS tracking, boarding verification, speed reward or public leaderboard is implemented. The implemented account API includes aggregate DAU/WAU/MAU/YAU, activation, DAU/MAU stickiness and exact-day D7/D30 retention from authenticated connection checks, without receiving search text or location trails; these production metrics await API deployment.

`?mock=1` uses an isolated demo profile and local progress. It never reads real account tokens or calls the account API.

## Deploy and next phases

`.github/workflows/pages.yml` builds, validates, runs the full WebKit/Chromium suite, preserves QA evidence, then publishes to GitHub Pages from `main`. Set the repository's Pages source to **GitHub Actions**. Vite's base is `/hopp/`.

The frontend remains on GitHub Pages; accounts use the existing API at `https://api.joshfreeman.me/hopp`. The Pages workflow does not deploy that separate backend. Current automated evidence is recorded in [Phone QA](docs/qa/README.md); a complete human Google consent round trip has not been claimed.

Offline service-worker support, automatic route promotion and actual journey verification remain future work. Strava is deferred: its June 2026 API Policy does not clear the proposed pace calibration and derived rewards. See the [Strava assessment](docs/research/2026-09-13-strava-integration.md) and [rewards research](docs/research/2026-09-13-rewards-design.md).

- [Approved design](docs/superpowers/specs/2026-09-13-hopp-design.md)
- [Implementation handoff](docs/superpowers/plans/2026-09-13-hopp-mvp.md)
- [Verified research brief](docs/research/2026-09-13-research-brief.md)
- [Original phone mockups](docs/design/phone-flow/)

## Maintain route evidence

Each route is a validated JSON record under `data/hacks/`. `bun run validate` rebuilds the bundled catalogue automatically, so new files become planner inputs without hard-coded imports. Platform coverage may be partial; unsupported platforms never produce offers.

`bun run research:scan` repeats the bounded, cached timetable screen. `bun run research:report` rebuilds the research report and source inventory from regional decisions. Screened distances are discovery leads only and never become enabled route timing automatically.

## Visual design

The user-selected lead is “the art of being on time”, with “Train shortcuts for runners.” as the description. Interface symbols are SVGs rather than emoji, including the runner, account, route and reward graphics. Instrument Sans provides labels and station names; IBM Plex Mono provides timetable numbers. Fonts are hosted with the app, with their OFL licenses in `public/fonts/`. The search form connects its stop markers, the combined result places the map above directions, and Live uses a station-sign treatment for the platform.

All 26 supported map variants are offline SVGs built from the committed OSM extracts. They show geographic context and access markers, with no invented walking line. Regenerate them with `python3 scripts/build-route-maps.py`.

## Demo video

The [MP4 demo](public/demo.mp4) shows the actual phone UI: search, Get off early, map, timing and directions, live countdown, then the isolated demo profile, a correct practice answer worth 25 points and selecting Forest. It runs **40.04 seconds**, uses synthetic timetable/account data and has no audio. The 780 × 1688 H.264 file is approximately 2.50 MB. It ends on the Forest profile without starting an actual sprint or using a real account.

To record and export it again, install Chromium with Playwright and have `ffmpeg`/`ffprobe` on PATH:

```sh
bun scripts/record-demo.ts
python3 scripts/export-demo.py
```

The intermediate recording and timing notes stay in ignored `out/demo/`. The published player is `public/demo.html`.
