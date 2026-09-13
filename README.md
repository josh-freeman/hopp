# Hopp ↗

Swiss public transport connections with estimated sprint transfers. Hopp shows relevant shortcuts alongside the regular connection, including the sprint duration, margin and fallback.

[Open Hopp](https://joshfreeman.me/hopp/) · [Try a practice trip](https://joshfreeman.me/hopp/?mock=1)

A static MVP with **11 enabled route records**, including nine additions from the expanded Swiss research. Coverage includes Zürich HB, Basel SBB, Winterthur, Chur, Oerlikon, Nyon, Bern, Biel, Genève and Neuchâtel, with specific supported platforms. The research covers **40 stations**, including 25 detailed approaches and 38 broader timetable observations. Routes are desk researched, **not yet timed or verified on foot**. Unresolved approaches and the Lausanne draft cannot generate offers.

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
- Try sheet, route preview, detailed timing, live countdown, regular fallback, and platform self-confirmation.
- One configurable sprint pace (3.5 m/s default), luggage adjustment, minimum margin and offer toggle, saved locally.
- Live stationboards matched to the chosen trip's scheduled identity; delay/platform rescoring and fallback checks; stale countdowns stop after 120 seconds.
- Install manifest, local icons, safe-area spacing, feature-detected wake lock, dark mode and reduced-motion support.

The API needs no key. See [API behavior](docs/API.md) and [model audit](docs/qa/model-review.md) for limits. Onward services need a fresh whole-journey check; a stationboard cannot verify an entire connecting itinerary. SBB remains the place for tickets and official departure information.

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

## Deploy and next phases

`.github/workflows/pages.yml` builds, validates, runs the full WebKit/Chromium suite, preserves QA evidence, then publishes to GitHub Pages from `main`. Set the repository's Pages source to **GitHub Actions**. Vite's base is `/hopp/`.

Profiles, points, verified runs, train-movement verification, leaderboard, celebration, offline service worker and automatic route mining remain documented future phases. The current platform confirmation does not award points or verify boarding.

- [Approved design](docs/superpowers/specs/2026-09-13-hopp-design.md)
- [Implementation handoff](docs/superpowers/plans/2026-09-13-hopp-mvp.md)
- [Verified research brief](docs/research/2026-09-13-research-brief.md)
- [Original phone mockups](docs/design/phone-flow/)

## Maintain route evidence

Each route is a validated JSON record under `data/hacks/`. `bun run validate` rebuilds the bundled catalogue automatically, so new files become planner inputs without hard-coded imports. Platform coverage may be partial; unsupported platforms never produce offers.

`bun run research:scan` repeats the bounded, cached timetable screen. `bun run research:report` rebuilds the research report and source inventory from regional decisions. Screened distances are discovery leads only and never become enabled route timing automatically.
