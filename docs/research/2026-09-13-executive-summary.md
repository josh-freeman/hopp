**Name: Hopp** (Swiss German "go!"). All three candidate designs and both judges converged on it: one syllable, no umlaut, it is literally the label of the app's single big button, and it does not sound like an SBB product.

**Recommended approach.** Build the MVP-angle design as the core: a static Vite + vanilla TypeScript app on GitHub Pages that calls transport.opendata.ch v1 from the browser, takes SBB's real connection, detects when the tram passes a curated "get off here" stop, re-queries the train leg from the hack station at (alight time + your sprint), and scores each train by planned platform → route → sprint time + margin → GO / RISKY / NO, with SBB's own plan always visible. Graft the data-angle design's zod schema, one-JSON-file-per-hack, validator rules and pace-tables.json (so a third commuter adds a station without touching code), and the user-angle design's Live screen (GPS picks the nearest hack, tap "I'm on the T2 08:24", countdown, vibrate on band flip, stationboard polling instead of route calls). Two MVP bugs the judges found are fixed in the spec: the hack validator must measure against the route landing, not the station centroid, and the candidate query starts at alight + minimum sprint with limit 10.

**Zürich (Central → HB, Bahnhofquai/HB closed until 12 Dec 2026).** SBB budgets 540 s from Central (or 120 s ride + 420 s from Bahnhofplatz/Bahnhofstrasse — identical). Athlete estimate, run tier (3.3 m/s), including 65 s margin: Gleis 3–18 (surface, 402–418 m, 0 level changes, 3 signalised crossings) 257 s → up to 4.7 min saved; Gleis 41–44 (424–440 m, 2 escalators down) 309 s → 3.9 min; Gleis 31–34 (423–439 m, escalator + 50 stairs) 310 s → 3.8 min; Gleis 21–22 SZU: closed (29 Apr → ~Dec 2026), disabled. Walk tier still fits inside SBB's budget (485 s), so the app must say "SBB budget minus your run", not "beat the tram".

**Basel (IWB → Basel SBB via the Margarethenbrücke ramp).** SBB budgets 180 s ride + 360 s walk = 540 s (or 480 s direct walk from IWB). Athlete estimate, run tier, with margin: Gleis 20 (173–191 m, ramp, no stairs, terminating track so trains stand at the ramp) 163 s → up to 6.3 min; Gleis 19 200 s → 5.7 min; Gleis 16/18 and 14/15 (public bridge stairs since 2013) 188–189 s → 5.8 min; Gleis 5–12 via the provisional west passerelle 266 s → 4.6 min; Gleis 1–4: no gain, stay on. "Gate 20" = Gleis 20; "the passage" = the ramp (OSM way 1273058927, bz Basel 2024).

**Lausanne:** no alight-early shortcut exists; the only slack is the planner's 300 s m2→train transfer (runner ≈ 100–115 s ?) — a "transfer-slack" draft entry, all numbers unverified.

**Phases.** MVP (≈ 24 h): static app, two seed hacks, stitch, verdict + fallback, manifest. Miner (week 2–3): offline bun CLI ranking stops near the top-40 stations, run at night at ≥ 8 s pacing. PWA (week 2): service worker, wake lock, install prompt. Collaborative timing (phase 2): Cloudflare Worker + D1, attempts, percentiles, leaderboard, shrinkage calibration k = 10. Strava (stretch): Worker for the token exchange; single-athlete cap makes it a two-person feature.

**Biggest open uncertainty:** whether the Bahnhofquai sidewalk from the bridge to "Ausgang Bahnhofquai" is passable during the tram-stop works (if fenced: +2 flights via the Landesmuseum stairs); nobody has walked either hack with a stopwatch.

**Open questions:**
1. Basel: tram→train only, or also the reverse (train on 19/20 → ramp → tram 2 towards Binningen)?
2. Which lines/directions do the two commuters actually ride (tram 16 riders have a different baseline)?
3. Hosting: GitHub Pages under /hopp/ or a Cloudflare Pages custom domain (affects base path, SW scope, phase-2 same-origin API)?
4. Will each commuter time the run once per tier (two numbers each) before launch?
5. Set up the OJP proxy Worker now as quota insurance, or wait until the shared 1000 route-searches/day limit bites?
6. English-only UI for the MVP?