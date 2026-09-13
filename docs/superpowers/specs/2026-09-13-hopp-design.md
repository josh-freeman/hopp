# Hopp — Design proposal

## 0. Product decisions (user, 2026-09-13) — these override anything below

1. **The use case is "you'd miss your train; sprint and you still make it."** The recommended candidate is the earliest catchable train that beats SBB's baseline arrival (Step 6 below); the copy for it is *"You can still make the HH:MM"* (never "arrive N min earlier" as the headline). The app is not a re-optimiser of whole trips; it answers, per departure, "is this train catchable if I sprint?".
2. **No pace tiers.** The profile holds one number, `sprintMps` (default **3.5 m/s** ≈ 12.6 km/h, "fit adult with a bag, full effort"), a `bag` toggle (×0.87) and `minMarginS` (default 45 s). Optional VMA (km/h) or recent-5k inputs only *derive* `sprintMps` (`0.75·VMA/3.6`; 5k time `t` → `VMA = 3.6·(5000/t)/0.92`). Phase-2 timed runs and Strava calibrate the same single number. The walking-pace formula (1.35 m/s) is computed only to print *"walking: no"* / *"walking would also make it"* — it is never a user choice. Wherever the text below says "tier", "tierClass" or "run tier", read: the single sprint pace (`tierClass` is always `'run'`; the walk-class stair/escalator rates are used only for that walking comparison).
3. **The discovery miner scores at sprint pace only.** A stop is a candidate iff `sprint(3.5 m/s) + margin ≤ plannerBudget − 120 s` **and** `walk(1.35 m/s) + margin > plannerBudget − 60 s` — impossible walking, possible sprinting — ranked by `plannerBudget − sprint`. Stops that a brisk walk already beats are not shortcuts, they are planner slack, and are listed separately.
4. **User-facing term: "Sprint route"** (works unchanged in DE/FR/IT). App name: **Hopp**. The feature must be able to live inside a transit app: the offer is a card above the normal connection list, not a mode switch.
5. **Canonical phone flow** (mockups in `docs/design/phone-flow/`, artifact "Athlete Mode Phone Flow"): Plan → Results list with the *"You can still make the 17:32"* card (Try it / Not now) → Try-it sheet (full sprint X:XX · spare Y:YY · walking: no; "Sprint it" / "Show me the route first") → Route map of the run (OSM tiles + route, read *before* the run, never during) → Sprint route detail (timeline, spare time, SBB fallback card) → Go live (countdown, GET OFF AT, Gleis, need/spare, fallback pinned, "On the platform") → Shortcut page → Settings (single sprint pace, luggage, min margin, "Offer sprint routes" toggle). §7 below is amended accordingly; where §7 and this list differ, this list wins.
6. **Hosting:** GitHub Pages under `/hopp/` (Cloudflare Pages identical); English-only UI for the MVP.

Status: for approval. Date: 2026-09-13. Built on the research brief and its verifications; decisions first, options second.

---

## 1. Name

**Hopp.** Swiss German "go!" — one syllable, no umlaut, it is the label of the app's single big button, and it does not read like an official SBB product. (All three candidate designs and both judges picked it independently. Check domain/handle availability before printing icons.)

## 2. Goal and non-goals

Goal: on a moving tram, one hand, ≤ 3 s of reading: **get off here? which Gleis? how many seconds do I have?** — computed against SBB's real connection, with the sprint budget, a risk band and SBB's own plan always visible. Switzerland-wide journey planning; a national, declarative hack table; an offline miner to find new hacks; later, crowd-timed calibration and an installable PWA.

Non-goals: native apps; replacing the SBB app for ticketing or non-hack journeys; routing through anything not in the hack table; promising a train ("Hopp shows a budget, not a promise"); any backend in the MVP.

## 3. Approaches considered

**A — MVP-first (winner for the core).** Vite + vanilla TS, one page, two plain-GET route calls per query: SBB baseline → passList detection (cases a/b/c) → one candidate re-query from the hack station → per-platform route → sprint + margin → earliest GO with gain, RISKY never headlined, fallback re-validated when the tram is late. ≈ 20 h. Judges: only design whose catchability decision and fallback card are both sound against the verified API; two concrete bugs (validator haversine against the station centroid rejects the Basel seed; candidate query at floor(tAlight) with limit 8 can be saturated by uncatchable trains). Manifest-only PWA, manual refresh.

**B — Data-model-first.** zod schema as single source, one JSON per hack via `import.meta.glob`, `pace-tables.json`, the strongest validator ("sprint at run tier must beat the planner budget", "every observed platform maps to exactly one group"), stationboard-based 60 s refresh, `?mock=1` fixture mode, hack browse page, best phase-2 calibration math. ≈ 46 h. Judges: a TIGHT train can become the headline and the displayed buffer goes negative; `transportations[]=train` on the candidate query drops onward bus/boat legs; seeds mislabelled "verified"; a 10-min stale API cache could feed a countdown.

**C — Moment-of-use-first.** GPS picks the nearest hack, tap "I'm on the T2 08:24" from the alight-stop board, Live screen with countdown, vibrate on band flip, wake lock, session state machine, IndexedDB attempt queue. ≈ 44 h. Judges: its core replaces SBB's plan with a reconstructed "earliest departure with destination in passList" baseline (wrong fallback, direct trains only, cannot serve journeys needing a change); several geofence coordinates are invented.

**Decision (both judges concur):** build A's stitch and honesty rules as the core; graft B's schema/validator/pace tables/stationboard refresh/mock mode and C's Live screen and zero-typing entry; fix A's two bugs before coding; keep phase 2 and Strava additive and out of the MVP.

## 4. Architecture

```
┌────────────────────────── browser: static app (GitHub Pages / Cloudflare Pages) ──────────────────────────┐
│  ui/   plan · verdict · live (the one-hand screen) · profile · hacks-browse                                 │
│          │ renders one Verdict object                                                                        │
│  engine/ match → sprint → margin → rescore → verdict      ◄── data/hacks/*.json (zod-validated at build)     │
│          ▲                                                ◄── data/pace-tables.json, data/stations.json     │
│  api/    client.ts: plain GET, errors[] check, 4 s pacing, 30 s URL cache, 429/backoff                      │
│  pwa/    sw.ts (shell + data precache), wakelock.ts, geo.ts     storage/ prefs (localStorage), attempts queue│
└──────────┬─────────────────────────────────────────────────────────────────────┬────────────────────────────┘
           │ GET /v1/connections · /v1/stationboard · /v1/locations              │ phase 2 (same origin /api)
           ▼                                                                     ▼
  transport.opendata.ch v1  (→ timetable.search.ch quotas)            Cloudflare Worker + D1 (+ KV for Strava)
                                                                                 ▲
  offline, night, never in the browser:                                          │ humans promote drafts
  scripts/miner (bun/node) ── /locations x,y → /connections walk budget → Overpass Dijkstra → rank → out/candidates.json
```

Components: **static app** (MVP), **miner CLI** (week 2–3, repo script), **Worker + D1** (phase 2: attempts, stats, leaderboard; stretch: Strava token exchange). Data flow: hack JSON is validated and bundled at build; the app fetches SBB data live; phase-2 stats are fetched at app start and also snapshotted into the built hack bundle so the static app keeps working when the Worker is down.

## 5. Data model

Schema (zod in `src/schema/hack.ts`; `z.infer` types shared by app, validator and miner). One file per hack in `data/hacks/`.

```ts
Hack {
  id: string                      // "<station-slug>.<alight-slug>", stable; phase-2 stats key
  version: number                 // bump when numbers change; stats are keyed by version
  kind: "alight-early" | "transfer-slack"
  status: "draft" | "desk-verified" | "field-verified" | "disabled"   // only field-verified hides the "unverified on foot" badge
  name: string
  station: { id, name, lat, lon, minTransferS }
  alight: { id, name, lat, lon, lines: string[], platformLetters: Record<line, letter>,
            plannerWalkS: number,            // budget when SBB walks from the alight stop INSIDE a connection
            geofence: { lat, lon, r },       // phase-2 timer start; must be an OSM/API node
            note?: string }
  rideOn: { id, name, lines: string[], rideS: number, plannerWalkS: number, validity?: Validity[], note?: string }[]
  validity: Validity[]            // { from: date|null, to: date|null, note }
  fieldCheckNeeded: string[]
  instructions: string            // one paragraph on the verdict card
  routes: Route[]
  sources: string[]
}
Route {
  key: string                     // stable; stats keyed (hack.id, route.key, tierClass)
  label: string
  platforms: { from: number, to: number } | number[]   // matched on parsePlatform(api string).number
  helps: "strong" | "marginal" | "never"               // never => "STAY ON: <note>"
  confidence: "high" | "medium" | "low"                // "?" in notes forces confidence != high
  validity?: Validity[]
  landing?: { lat, lon, r }                           // where the run ends; phase-2 timer stop
  path: PathStep[]                                     // ordered, reads like directions
  doorOffsetM: { typ: number, max: number }            // extra metres from landing to the nearest door
  note: string
}
PathStep = { kind: "street"|"hall"|"platform"|"ramp", m: number, crossings?: number, note?: string }
         | { kind: "stairs"|"escalator", dir: "up"|"down", riseM: number, steps?: number, note?: string }
```

Validity semantics: a hack/rideOn/route is active when any window contains today. Outside every window the hack is still computed but ribboned "stale since <date>"; a `helps: "never"` route or a route with an expired window yields an explicit STAY ON reason.

### 5.1 Seed 1 — `data/hacks/zurich-hb.central.json`

```json
{
  "id": "zurich-hb.central", "version": 1, "kind": "alight-early", "status": "desk-verified",
  "name": "Zürich Central → HB over the Bahnhofbrücke",
  "station": { "id": "8503000", "name": "Zürich HB", "lat": 47.377847, "lon": 8.540502, "minTransferS": 300 },
  "alight": {
    "id": "8588078", "name": "Zürich, Central", "lat": 47.376833, "lon": 8.543937,
    "lines": ["3", "4", "6", "7", "10", "11"],
    "platformLetters": { "3": "B", "4": "F", "11": "F", "6": "H", "7": "H", "10": "H" },
    "plannerWalkS": 540,
    "geofence": { "lat": 47.3767194, "lon": 8.5435274, "r": 40 },
    "note": "Tram 15 does NOT continue to HB (board 2026-09-13: departs G toward Tiefenbrunnen; VBZ 2026: becomes line 11 at Central ?). Bus 31 (platform I) also runs Central → Bahnhofplatz/HB. Polybahn arrivals: +55 m street."
  },
  "rideOn": [
    { "id": "8587348", "name": "Zürich, Bahnhofplatz/HB", "lines": ["3", "6", "10"], "rideS": 120, "plannerWalkS": 420 },
    { "id": "8591067", "name": "Zürich, Bahnhofstrasse/HB", "lines": ["4", "7", "11"], "rideS": 150, "plannerWalkS": 420 },
    { "id": "8587349", "name": "Zürich, Bahnhofquai/HB", "lines": [], "rideS": 60, "plannerWalkS": 420,
      "validity": [{ "from": "2026-12-13", "to": null, "note": "tram stop closed 2025-12-14 → 2026-12-12 (VBZ); lines after reopening unknown ?" }] }
  ],
  "validity": [{ "from": "2025-12-14", "to": "2026-12-12", "note": "Bahnhofquai/HB closure. On reopening trams stop 187 m closer (195–214 m surface run) — re-survey and bump version." }],
  "fieldCheckNeeded": [
    "Bahnhofquai surface sidewalk from the bridge to 'Ausgang Bahnhofquai' may be fenced by the tram-stop works (city advice: use ShopVille underpasses); if so add route variant via NE 'Eingang Shopville' stairs (+2 flights, ≈ +30 s)",
    "Terminus stopping position on 3–18 (rear car in sector A?)",
    "Real hall path length (interior unmapped; straight-line +5–10 % ?)"
  ],
  "instructions": "Exit onto the Bahnhofbrücke NORTH sidewalk (Landesmuseum side), cross Bahnhofquai at the lights, enter the Haupthalle through 'Ausgang Bahnhofquai' and run straight through to the Querhalle: Gleis 3 is on your left, 18 on your right. For 41–44 take the north escalators, for 31–34 the central escalators then Passage Löwenstrasse.",
  "routes": [
    { "key": "surface", "label": "Gleis 3–18 (surface, level 0)", "platforms": { "from": 3, "to": 18 }, "helps": "strong", "confidence": "medium",
      "landing": { "lat": 47.378186, "lon": 8.539264, "r": 70 },
      "path": [
        { "kind": "street", "m": 233, "crossings": 3, "note": "Central F → bridge N sidewalk → Bahnhofquai → east portal (verifier chain 233 m; brief 217 m)" },
        { "kind": "hall", "m": 175, "note": "? straight line 165 m (pl 10/11) – 184 m (pl 3); Haupthalle interior unmapped in OSM" }
      ],
      "doorOffsetM": { "typ": 30, "max": 400 },
      "note": "? terminus: rear car assumed in sector A, 10–30 m from the head (unverified)" },
    { "key": "museumstrasse", "label": "Gleis 41–44 Museumstrasse (level −3)", "platforms": { "from": 41, "to": 44 }, "helps": "marginal", "confidence": "medium",
      "landing": { "lat": 47.378742, "lon": 8.538995, "r": 60 },
      "path": [
        { "kind": "street", "m": 233, "crossings": 3 },
        { "kind": "hall", "m": 145, "note": "portal → Haupthalle north escalators" },
        { "kind": "escalator", "dir": "down", "riseM": 7.3, "note": "0 → −2 (Halle Landesmuseum), 19 m long" },
        { "kind": "hall", "m": 36 },
        { "kind": "escalator", "dir": "down", "riseM": 6.3, "note": "? −2 → −3 (13.6 − 7.3 m), 7 m long" }
      ],
      "doorOffsetM": { "typ": 100, "max": 150 },
      "note": "? lands roughly mid-platform (OSM outline 412 m vs 360 m real)" },
    { "key": "loewenstrasse", "label": "Gleis 31–34 Löwenstrasse (level −4)", "platforms": { "from": 31, "to": 34 }, "helps": "marginal", "confidence": "medium",
      "landing": { "lat": 47.378026, "lon": 8.538718, "r": 60 },
      "path": [
        { "kind": "street", "m": 233, "crossings": 3 },
        { "kind": "hall", "m": 103, "note": "portal → Haupthalle central escalators" },
        { "kind": "escalator", "dir": "down", "riseM": 7.3, "note": "0 → −2, 15 m long (OSM level '0;-1;-2')" },
        { "kind": "hall", "m": 70, "note": "Passage Löwenstrasse west" },
        { "kind": "stairs", "dir": "down", "riseM": 8.1, "steps": 50, "note": "−2 → −4, escalator alongside" }
      ],
      "doorOffsetM": { "typ": 100, "max": 150 },
      "note": "? lands in the eastern third (outline 507 m vs 420 m real)" },
    { "key": "szu", "label": "Gleis 21–22 SZU", "platforms": { "from": 21, "to": 22 }, "helps": "never", "confidence": "low",
      "validity": [{ "from": null, "to": "2026-12-31", "note": "SZU station closed 2026-04-29, reopening slipped to ~Dec 2026 ?; S4/S10 end at Selnau" }],
      "path": [ { "kind": "street", "m": 233, "crossings": 3 }, { "kind": "hall", "m": 103 }, { "kind": "escalator", "dir": "down", "riseM": 4.7 }, { "kind": "hall", "m": 80 }, { "kind": "escalator", "dir": "down", "riseM": 6.9 } ],
      "doorOffsetM": { "typ": 30, "max": 125 },
      "note": "STAY ON: SZU closed; new access must be re-measured after reopening" }
  ],
  "sources": [
    "OSM via Overpass/API 2026-09-13 (nodes 94583344, 2264870172, 267348654, 338493236; ways 445003247, 492505567, 383737821, 389727032; stop position 41 47.378742,8.538995)",
    "SBB Innenplan Zürich HB 12/2025", "de.wikipedia Zürich Hauptbahnhof (depths 7.3/13.6/15.4 m)",
    "transport.opendata.ch connections 2026-09-14/15 (walk budgets 540 s Central, 420 s HB-adjacent stops; Central stationboard 2026-09-13)",
    "stadt-zuerich.ch VBZ Bahnhofquai/HB 14.12.2025–12.12.2026", "szu.ch closure notice"
  ]
}
```

### 5.2 Seed 2 — `data/hacks/basel-sbb.iwb.json`

```json
{
  "id": "basel-sbb.iwb", "version": 1, "kind": "alight-early", "status": "desk-verified",
  "name": "Basel IWB → Basel SBB via the Margarethenbrücke ramp",
  "station": { "id": "8500010", "name": "Basel SBB", "lat": 47.547403, "lon": 7.589564, "minTransferS": 360 },
  "alight": {
    "id": "8500160", "name": "Basel, IWB", "lat": 47.546673, "lon": 7.584368,
    "lines": ["2"], "platformLetters": { "2": "B" },
    "plannerWalkS": 480,
    "geofence": { "lat": 47.5465349, "lon": 7.5840273, "r": 40 },
    "note": "Tram 2 city-bound stops at Kante B on the station-side sidewalk — no track crossing. Tram 16 city-bound (Kante C) crosses the bridge to Markthalle but never serves Bahnhof SBB (baseline = Markthalle + 480 s) — separate entry later."
  },
  "rideOn": [
    { "id": "8578143", "name": "Basel, Bahnhof SBB", "lines": ["2"], "rideS": 180, "plannerWalkS": 360, "note": "IWB → Markthalle → Bahnhof SBB Kante F, 3 min scheduled" },
    { "id": "8500193", "name": "Basel, Markthalle", "lines": ["2", "16"], "rideS": 60, "plannerWalkS": 480 }
  ],
  "validity": [{ "from": "2025-12-06", "to": "2030-12-31", "note": "Ramp since 2024-04-15; provisional west passerelle since 2025-12-06 (day-level date from OSM ?); permanent Perronzugang Margarethen and bridge rebuild from ~2031 change every row." }],
  "fieldCheckNeeded": [
    "Opening hours / night or ice closure of the ramp and the two bridge stairs",
    "Which half of the split-level 16/18 platform the bridge stair lands on",
    "Where trains stop on Gleis 19 (through) and 20 (terminating, assumed at the ramp end)",
    "Direction: does the commuter also use the reverse (train on 19/20 → ramp → tram 2 Kante A)?"
  ],
  "instructions": "Get off at IWB (Kante B), run up Margarethenstrasse onto the bridge's right-hand (south-east) sidewalk. The first descent is the RAMP onto the west tip of Gleis 19/20; the stairs to 16/18 and 14/15 follow along the sidewalk. For Gleis 5–12 continue on Meret Oppenheim-Strasse to the provisional passerelle. Never cross tracks; never use the underpass (one-way, gated).",
  "routes": [
    { "key": "g20", "label": "Gleis 20 (terminating track — train stands at the ramp end)", "platforms": [20], "helps": "strong", "confidence": "high",
      "landing": { "lat": 47.5471411, "lon": 7.5856005, "r": 50 },
      "path": [
        { "kind": "street", "m": 132, "crossings": 1, "note": "114 m node chain + 18 m mapped-sidewalk correction; crossings ? (Margarethenstrasse side street)" },
        { "kind": "ramp", "m": 59, "note": "OSM way 1273058927, ~5 m down ?, concrete, shared with bicycles" }
      ],
      "doorOffsetM": { "typ": 40, "max": 410 },
      "note": "Wendegleis ending just before the bridge; ramp foot 46 m east of the west tip" },
    { "key": "g19", "label": "Gleis 19 (through track)", "platforms": [19], "helps": "strong", "confidence": "medium",
      "landing": { "lat": 47.5471411, "lon": 7.5856005, "r": 50 },
      "path": [ { "kind": "street", "m": 132, "crossings": 1 }, { "kind": "ramp", "m": 59 } ],
      "doorOffsetM": { "typ": 150, "max": 410 },
      "note": "? stopping position unknown; RailCity stair is 213 m from the ramp foot on a ~460 m platform" },
    { "key": "g16-18", "label": "Gleis 16/18 (bridge stairs)", "platforms": [16, 17, 18], "helps": "strong", "confidence": "medium",
      "landing": { "lat": 47.5474729, "lon": 7.5851521, "r": 50 },
      "path": [
        { "kind": "street", "m": 132, "crossings": 1 },
        { "kind": "street", "m": 24, "note": "bridge SE sidewalk to the stair head" },
        { "kind": "stairs", "dir": "down", "riseM": 4.5, "steps": 27, "note": "riseM ? (27 × 0.165 m); public since 2013-04-13, ticket validator at the foot" },
        { "kind": "platform", "m": 20, "note": "? split-level halves (Gleis 18 lower) joined by stairs/ramps" }
      ],
      "doorOffsetM": { "typ": 100, "max": 350 },
      "note": "? sector unknown; add a half-level when the train is on the other half" },
    { "key": "g14-15", "label": "Gleis 14/15 (bridge stairs)", "platforms": [14, 15], "helps": "strong", "confidence": "high",
      "landing": { "lat": 47.547676, "lon": 7.5852895, "r": 50 },
      "path": [ { "kind": "street", "m": 132, "crossings": 1 }, { "kind": "street", "m": 48 }, { "kind": "stairs", "dir": "down", "riseM": 5.0, "steps": 30, "note": "riseM ?; public since 2013" } ],
      "doorOffsetM": { "typ": 100, "max": 350 },
      "note": "? sector unknown" },
    { "key": "g5-12", "label": "Gleis 5–12 via the provisional passerelle", "platforms": { "from": 5, "to": 12 }, "helps": "marginal", "confidence": "medium",
      "landing": { "lat": 47.5467534, "lon": 7.5863042, "r": 60 },
      "path": [
        { "kind": "street", "m": 250, "crossings": 1, "note": "IWB → Meret Oppenheim-Strasse → passerelle south entrance (232 m chain + 18 m)" },
        { "kind": "stairs", "dir": "up", "riseM": 6.0, "note": "? 13 steps + a flight to deck level 1 (lift exists)" },
        { "kind": "hall", "m": 100, "note": "? covered deck: ~70 m to the 11/12 stair … ~125 m to 9/10" },
        { "kind": "stairs", "dir": "down", "riseM": 6.0, "note": "?" }
      ],
      "doorOffsetM": { "typ": 100, "max": 300 },
      "note": "landing = passerelle south entrance (per-platform stair coordinates not verified); passerelle lands west-middle of ~400 m platforms" },
    { "key": "g30-35", "label": "Gleis 30–35 SNCF via passerelle north landing", "platforms": { "from": 30, "to": 35 }, "helps": "marginal", "confidence": "low",
      "path": [ { "kind": "street", "m": 250, "crossings": 1 }, { "kind": "stairs", "dir": "up", "riseM": 6.0 }, { "kind": "hall", "m": 145 }, { "kind": "stairs", "dir": "down", "riseM": 6.0 } ],
      "doorOffsetM": { "typ": 60, "max": 200 },
      "note": "? link from Perron 30/31 to 33/35 unmapped; French platform strings may be null" },
    { "key": "g1-4", "label": "Gleis 1–4", "platforms": { "from": 1, "to": 4 }, "helps": "never", "confidence": "high",
      "path": [ { "kind": "street", "m": 443 }, { "kind": "stairs", "dir": "up", "riseM": 6.5, "steps": 19 }, { "kind": "hall", "m": 185 }, { "kind": "stairs", "dir": "down", "riseM": 6.5 } ],
      "doorOffsetM": { "typ": 60, "max": 200 },
      "note": "STAY ON: only reachable via the RailCity Passerelle (690–820 m, 2 level changes) — no gain over riding to Centralbahnplatz" }
  ],
  "sources": [
    "OSM via Overpass/API 2026-09-13 (way 1273058927; steps 217965086/217965087; way 1306147440; relation 17916175; platform 377466170)",
    "bz Basel 2024-04-10 (ramp) and 2013-04-17 (stairs)", "company.sbb.ch Ausbau Bahnhof Basel SBB (Wendegleis 20, 16/18 split level)",
    "SBB Bahnhofplan Basel SBB 02/2026",
    "transport.opendata.ch stationboard 8500160 and connections 2026-09-13/15 (walk budgets 480 s IWB, 360 s Bahnhof SBB; tram 2 IWB → Bahnhof SBB 3 min)"
  ]
}
```

### 5.3 Draft — `data/hacks/lausanne.gare-m2.json` (status `draft`, hidden unless `?dev=1`, every number unverified)

```json
{
  "id": "lausanne.gare-m2", "version": 0, "kind": "transfer-slack", "status": "draft",
  "name": "Lausanne: m2 'gare' → platforms (planner slack only)",
  "station": { "id": "8501120", "name": "Lausanne", "lat": 46.516795, "lon": 6.629087, "minTransferS": 300 },
  "alight": { "id": "8592050", "name": "Lausanne, gare (m2)", "lat": 46.5176, "lon": 6.629648, "lines": ["m2"], "platformLetters": {},
              "plannerWalkS": 300, "geofence": { "lat": 46.517528, "lon": 6.629633, "r": 40 },
              "note": "? m2 platform at level −1 with a 51 m step-free corridor into the passage sous-voies est; no alight-early hack exists (Grancy saves ≈ 1 min for voie 7/8 only ?, Flon is slower)" },
  "rideOn": [],
  "validity": [{ "from": null, "to": "2026-12-31", "note": "Léman 2030 works: platform/underpass works from end 2026 or 2027 ?; passage est guaranteed open" }],
  "fieldCheckNeeded": ["everything: m2 platform level, stair counts, runner times, Saugettes entrance hours"],
  "instructions": "From the m2, take the corridor into the east underpass; 28 steps up to your platform.",
  "routes": [
    { "key": "v7-8", "label": "voie 7/8", "platforms": [7, 8], "helps": "marginal", "confidence": "low",
      "landing": { "lat": 46.516468, "lon": 6.629108, "r": 40 },
      "path": [ { "kind": "hall", "m": 205 }, { "kind": "stairs", "dir": "up", "riseM": 4.6, "steps": 28 } ], "doorOffsetM": { "typ": 50, "max": 200 }, "note": "? 1:55 runner model" },
    { "key": "v5-6", "label": "voie 5/6", "platforms": [5, 6], "helps": "marginal", "confidence": "low", "landing": { "lat": 46.516605, "lon": 6.629152, "r": 40 },
      "path": [ { "kind": "hall", "m": 185 }, { "kind": "stairs", "dir": "up", "riseM": 4.6, "steps": 28 } ], "doorOffsetM": { "typ": 50, "max": 200 }, "note": "?" },
    { "key": "v3-4", "label": "voie 3/4", "platforms": [3, 4], "helps": "marginal", "confidence": "low", "landing": { "lat": 46.516735, "lon": 6.629193, "r": 40 },
      "path": [ { "kind": "hall", "m": 165 }, { "kind": "stairs", "dir": "up", "riseM": 4.6, "steps": 28 } ], "doorOffsetM": { "typ": 50, "max": 200 }, "note": "?" },
    { "key": "v1-70", "label": "voie 1 / 70", "platforms": [1, 70], "helps": "marginal", "confidence": "low", "landing": { "lat": 46.516811, "lon": 6.629218, "r": 40 },
      "path": [ { "kind": "hall", "m": 155 }, { "kind": "stairs", "dir": "up", "riseM": 4.0, "steps": 24 } ], "doorOffsetM": { "typ": 50, "max": 260 }, "note": "? voie 70 = +56 m along platform 1" }
  ],
  "sources": ["research lausanne-geo 2026-09-13 (transport.opendata.ch, Overpass, swisstopo heights) — unverified"]
}
```

For a `transfer-slack` hack the engine treats `alight` as the arrival stop of the feeder leg and compares `plannerWalkS` (the 300 s transfer) with the sprint; no rideOn exists.

### 5.4 Supporting data

- `data/stations.json`: `{ id: { name, minTransferS, observedPlatforms: string[] } }` — observed strings from fixtures (Zürich: `3`…`18`, `31`–`34`, `41/42`, `43/44`; Basel: `1`…`12`, `14`, `15`, `16`, `16A-C`, `19`, `20`, `31`, `33`, `35`, `7CD`).
- `data/pace-tables.json`: tier speeds, move factors and caps, peak windows, stair/escalator rates, fixed times, margin constants — every constant the engine uses, so tuning after the first field timings is a data change.

## 6. Computation

Inputs: `fromId`, `toId`, `when` (now | date+time, Europe/Zurich), `Profile { sprintMps: number (default 3.5), bag?: boolean, minMarginS?: number }` (VMA / 5k inputs only derive `sprintMps`, see §0), active hacks.

**Step 1 — Baseline (SBB's plan).** `GET https://transport.opendata.ch/v1/connections?from={fromId}&to={toId}&limit=6[&date=YYYY-MM-DD&time=HH:MM]`. Reject if HTTP ≥ 400 or `body.errors?.length` (the per-minute limit arrives as HTTP 200 with `errors[]`). Use `*Timestamp` fields (unix s); normalise ISO `+0200` → `+02:00` before `Date.parse`.

**Step 2 — Detect (pure, `engine/match.ts`).** For each connection `c` and active hack `h`:
- case a (SBB rides past): a journey section `s` whose `passList` contains `h.alight.id` at index `p`, with `s.arrival.station.id ∈ h.rideOn` and a later journey section `t` departing from `h.station.id`;
- case b (SBB alights and walks): same but `s.arrival.station.id == h.alight.id`, followed by a walk into `h.station.id` and train `t`;
- case c (origin is the alight stop): `c.sections[0].walk != null` and `c.from.station.id == h.alight.id`; `t` = first journey section from the station; `tAlight` = query time.
- `tAlightTs = parse(passList[p].prognosis?.arrival) ?? passList[p].arrivalTimestamp + 60·(delay ?? 0)`; `live` = any non-null prognosis in `c`.
- Do not require `journey.number ∈ h.alight.lines` (brittle; passList containment suffices); lines are used only for the Home-screen tram pick.
- Keep the earliest opportunity by `tAlightTs`. Baseline = `{ train t, depTs (prognosis ?? scheduled), platform, arrTs = last section arrival, rideOnArrTs }`. None → plain SBB list, "no shortcut on this route yet", stop after one call.

**Step 3 — Sprint (`engine/sprint.ts`, constants from pace-tables).**
`sprint = T_ALIGHT(12) + T_REACT(3) + Σ_moves m_i / v_i + Σ_levels (riseM · s[kind][dir][tierClass] + 3) + crossings · 10 + doorOffsetM.typ / (0.9 · v_open)`
- `v_open = profile.sprintMps` (default 3.5 m/s; §0). Derivations when the user enters them instead: VMA → `0.75·VMA/3.6`; 5k time `t` → `VMA = 3.6·(5000/t)/0.92` then ×0.75; bag toggle ×0.87. Strava later just supplies VMA. The walking comparison uses `v_open = 1.35` with the walk-class stair rates and is display-only.
- `v_i = min(v_open · f_kind · f_peak, cap_kind)`: f street 1.0, ramp 0.9, hall 0.8, platform 0.9; `f_peak` = 0.8 for hall/platform Mon–Fri 07:00–09:00 and 16:30–18:30 (Europe/Zurich); caps ramp 4.0, hall 3.5, platform 4.0 m/s.
- `s` (s per vertical metre; tierClass walk = {walk, brisk}, run = {jog, run, sprint}): stairs down 2.4 | 1.6, up 3.2 | 2.2; escalator down 3.6 (standing) | 1.5, up 3.6 | 1.8.
- Optional `calibration { p80, n }` per (hack, route, tierClass): `total = (n · p80 + 10 · formula) / (n + 10)`; MVP passes null.
- Worked (run, off-peak): Zürich surface 192 s; 41–44 244 s; 31–34 245 s; Basel g20 98 s; g19 135 s; g16-18 123 s; g14-15 124 s; g5-12 ≈ 201 s. Walk tier Zürich surface 404 s.

**Step 4 — Margin (`engine/margin.ts`).** `margin = max(45 s, 0.15 · sprint) + 20 s door-close lead (? unverified) + 30 s if !live`. Bands: GO if `have ≥ sprint + margin`; RISKY if `sprint ≤ have < sprint + margin`; NO otherwise. Printed verbatim: "you have 4:52 · need 3:12 + 1:05 margin".

**Step 5 — Candidates.** `minSprint` = min sprint over `helps ≠ never` active routes. `GET https://transport.opendata.ch/v1/connections?from={h.station.id}&to={toId}&date={D}&time={HH:MM floor of tAlightTs + minSprint}&limit=10` — no `transportations[]` filter (onward bus/boat legs stay valid). Keep `k` whose first section is a journey departing `h.station.id`. Per candidate: `platformStr = departure.prognosis?.platform ?? departure.platform`; `parsePlatform`: `'11'→11`, `'41/42'→41`, `'16A-C'→16 sector A-C`, `'7CD'→7`, `''|null→unknown`. `route = routeFor(h, number)`: helps never → NO with the note; unknown → slowest helping route, band capped at RISKY, badge "Gleis not yet published"; no route at all → "no route data for Gleis X — stay on"; expired route validity → treated as never with the note. `depTs = prognosis ?? scheduled`; `haveS = depTs − tAlightTs`; band; `gainS = baseline.arrTs − k.arrTs`.

**Step 6 — Decision.** Recommended = the earliest-arriving candidate with band GO and `gainS > 0` (tie → earliest departure). A RISKY candidate with gain is shown as a labelled secondary line ("risky, your call") and never as the headline. If the earliest GO is SBB's own train or no candidate has gain → headline **STAY ON** with a reason: `no-earlier-train`, `platform-not-helped`, `hack-inactive`, or `missed-by` ("needs 38 s faster"), still printing have/need for the baseline's platform. `helps: marginal` routes get "small gain" copy.

**Step 7 — Tram late / live loop.** On the Live screen: alight-stop board `GET /v1/stationboard?id={alight}&limit=12&transportations[]=tram` every 30–45 s (match the user's tram on number + destination + scheduled departure) and station board `GET /v1/stationboard?id={station}&datetime=YYYY-MM-DD%20HH:MM&limit=40&transportations[]=train` every 45–60 s (datetime = tAlight − 2 min) to refresh the chosen train's prognosis and planned platform; recompute locally; re-run Step 1 only every ≥ 3 min or on tap. If the band drops below GO the screen flips to STAY ON with `navigator.vibrate([200,100,200])`. Fallback re-validation: SBB's baseline is still valid iff `baseline.depTs ≥ rideOnArrTs + rideOn.plannerWalkS` (case a) or `≥ tAlightTs + alight.plannerWalkS` (b, c); otherwise "SBB's own connection is at risk (tram late)" and the next baseline connection becomes the fallback. If `tAlightTs < now − 60 s` → "you have passed the stop"; the hack card is dropped, plain connections remain. Countdown counts locally to `depTs − 20 s`; stale data (> 120 s without a successful poll) greys the band and stops the countdown — never a countdown from stale prognosis.

**No-improvement example (live data 2026-09-14):** Margarethen 08:23 T2 → IWB 08:24; run tier ready 08:28:30 for Gleis 11 via the passerelle; earliest Zürich train IC 3 08:33 Gleis 11 = the baseline → "STAY ON — SBB's plan is already the earliest catchable train (no gain for this tram)".

## 7. UI flow

> Amended by §0.5: the canonical screen flow is the mockup flow (offer card on the results list → try-it sheet → route map → detail → live). The items below describe the same screens; "Verdict" = the offer card + sprint route detail, "Live" = Go live. The headline copy is *"You can still make the HH:MM"* when the recommended train is earlier than SBB's baseline train, and *"Stay on the tram"* otherwise.

Single page, hash router, four sections; everything thumb-sized (primary button 64–72 px pinned in the bottom 25 %, targets ≥ 48 px, band by colour AND word, dark mode via `prefers-color-scheme`, no gestures, no horizontal scroll at 320 px).

1. **Settings** (via gear; sensible defaults so first launch needs no setup): "Offer sprint routes" toggle, single sprint pace (default 3.5 m/s, shown as m/s and km/h with "460 m in about 3:00" preview), luggage toggle, minimum spare time (45 s), optional VMA / recent-5k fields that derive the pace, "Your runs" list (phase 2). Saved to localStorage.
2. **Home / Plan**: two entry paths. (a) Zero typing: GPS picks the nearest hack (< 2.5 km, haversine, no API call; else a 2-item list) and one alight-stop stationboard lists the next 3 hack-line trams with live delay — tap "I'm on the T2 · 08:24" and a destination chip → Live. (b) General planner: From (autocomplete `GET /v1/locations?query=…&type=station`, 400 ms debounce; "Nearest stop" via `?x=&y=&type=station`), To (last 5 destinations as chips), optional time, big HOPP button → Verdict. Plan-screen hint (deferred): "tram HH:MM → gain X min" for the next 3 trams.
3. **Verdict** (after HOPP): card 1 = headline "GET OFF AT CENTRAL" / "STAY ON THE TRAM"; "IC 3 → Bern · Gleis 11 · 08:33"; "you have 4:52 · need 3:12 + 1:05 margin" tinted GO green / RISKY amber / NO grey with the word; "arrive 08:56 — 30 min earlier than SBB"; the hack's instructions; badges desk-verified / unverified on foot / stale since / no live data / planned platform. Card 2 = SBB fallback, always visible even on GO ("SBB: T2 → Bahnhof SBB 08:27 · walk 6 min · IC 3 08:33 Gleis 11 → Zürich HB 09:26"). Optional card 3 = the RISKY alternative. Below: other SBB connections as compact rows (the app is a usable planner without a hack). Buttons: "Live", "Refresh".
4. **Live** (the 3-second screen): line 1 "GET OFF AT IWB in 1:42" (or "STAY ON"); line 2 platform in 96 px ("Gl 20"); line 3 the big number = seconds from doors-open to departure, band-coloured, with "sprint ≈ 1:38 · margin 1:05" beneath; line 4 tram chip ("tram +1 min live" / "scheduled only"); footer = SBB fallback line, pinned; one 72 px bottom button (phase 2: GO → ON PLATFORM). Wake lock held; screen never scrolls.
5. **Hacks browse** (footer link): every hack with confidence, validity note, field checks and instructions — the page a commuter sends to a friend; `?mock=1` renders the fixtures without spending quota.

Safety copy on every hack card: "Use crossings and signals; never cross tracks; Hopp shows a budget, not a promise."

## 8. PWA plan

- MVP: `public/manifest.webmanifest` (name/short_name "Hopp", `display: standalone`, `orientation: portrait`, `start_url ./`, theme/background colours, icons 192/512 any + maskable), `apple-touch-icon` and `apple-mobile-web-app-capable` so iOS "Add to Home Screen" works without a service worker; hacks are bundled JS.
- Week 2: hand-written `src/pwa/sw.ts` (~80 lines, no Workbox): install → precache shell (Vite manifest injected by a post-build script), hacks bundle, pace-tables, stations, icons under a build-hash cache; activate → drop old caches; fetch → cache-first for same-origin, **network-only for transport.opendata.ch** (never serve API JSON from the SW; the app's 30 s memory cache and a 10-min "stale result" in localStorage handle offline, and stale never feeds a countdown). `beforeinstallprompt` → "Install" chip; iOS hint text; `registerType: prompt`-style "update available" toast.
- Wake lock: `navigator.wakeLock.request('screen')` on entering Live, re-acquired on `visibilitychange`, released on leave (iOS ≥ 16.4 standalone); feature-detected.
- Geolocation: `getCurrentPosition` for nearest hack/stop; `watchPosition({enableHighAccuracy:true})` only during phase-2 timing; never sent anywhere in the MVP.
- Offline: profile, hack table, last verdict usable; planning says "offline". Native apps out of scope.

## 9. Discovery miner CLI (`scripts/miner`, bun or node 20, never in the browser)

`bun scripts/miner/index.ts --stations data/miner/top40.json --radius 600 --date <next Tuesday> --time 08:00 --out out/candidates.json`

Inputs: `top40.json` = `{ id, name, lat, lon, farDestinationId }` (a distant station forcing a train leg: Zürich HB → Bern, Bern → Zürich HB, Lausanne → Zürich HB, …).

Per station S: (1) `GET /v1/locations?x={lat}&y={lon}&type=station` → stops with `distance ≤ 600 m`, id ≠ S (1 call). (2) Per stop T: `GET /v1/stationboard?id={T}&limit=20` → lines and modes (cheap pool). (3) Per stop: `GET /v1/connections?from={T}&to={far}&date&time=08:00&limit=4` → `plannerBudgetS` from the leading WALK section timestamps (or the intermediate `walk.duration` when SBB rides first; record the ride-on stop and `rideS + walkS`). (4) One Overpass POST per station (`[out:json]`, bbox ±0.006° ≈ 700 m; `highway=footway|steps|path|pedestrian|corridor|residential|tertiary`, `railway=platform`, `public_transport=platform`; build a node graph; Dijkstra from each stop's platform node to the nearest node of each platform outline, or the station node when outlines are missing; `step_count`/`level` → level steps at 0.165 m per step, `conveying=*` → escalators). (5) `athleteS = sprintSeconds(route, run tier, off-peak)` importing `src/engine/sprint.ts` unchanged; `score = min(plannerBudgetS, rideOnS) − athleteS − 65 s`; rank per station and globally; rows unreachable in OSM are flagged, not dropped.

Request budget vs limits: 40 locations + ~400 stationboards + ~400 route calls; **run at night at ≥ 8–10 s pacing** (≈ 60–70 min) so it neither trips the per-minute limit nor eats the shared 1000/day route pool during commuting; 75 s sleep on the `errors[]` rate-limit body; 40 Overpass queries 10 s apart; on-disk cache keyed by URL (`miner/cache/<sha1>.json`) makes reruns free and resumable.

Scoring (§0.3): a stop is a **shortcut candidate** iff `athleteS(3.5 m/s) + margin ≤ plannerBudgetS − 120` and `walkS(1.35 m/s) + margin > plannerBudgetS − 60`; rank by `plannerBudgetS − athleteS`. Stops that a walk already beats go to a separate `planner-slack.csv` (useful, but not sprint routes).

Output: `out/candidates.csv` (station, stop, stopId, lines, plannerBudgetS, rideOnStop, osmM, stepsDown, stepsUp, athleteS, score, rank) and `out/candidates.json` with draft `Hack` objects in the exact schema (`status: "draft"`, one route per platform group found, `doorOffsetM {typ 100, max 300}`, `confidence: "low"`, note "MINED: verify on site"). Promotion: a human walks the top rows, fixes metres/levels/door offsets/validity/instructions, sets `status: "desk-verified"`, moves the file into `data/hacks/`, and `bun run validate` must pass. Regression cases: Zürich Central (540 s vs ~192 s) and Basel IWB (480/540 s vs ~98 s) must top their lists; Lausanne "Lausanne, gare" (300 s vs ~110 s) must rank high as a transfer-slack candidate.

## 10. Phase 2 — collaborative timing and leaderboard

Timing UX: on a GO/RISKY Live screen the bottom button reads **GO**; start = tap or GPS leaving `alight.geofence` (> 40 m, accuracy < 30 m); stop = tap **ON PLATFORM** (primary — indoor GPS is unreliable) or GPS entering `route.landing` (r); the user confirms the platform group. Attempt written to an IndexedDB queue first, synced when online; result screen "your time 2:41 · crowd p50 2:55 (n = 17) · model 3:12", optional alias once.

Backend: one Cloudflare Worker + D1 (same account as Pages, served under `/api` on the app origin; CORS restricted to it). Identity = random device UUID in localStorage sent as `X-Device`; optional Strava athlete id linked later, never displayed.

Tables:
```sql
devices(id TEXT PK, secret_hash TEXT, alias TEXT NULL, created_at TEXT, banned INTEGER DEFAULT 0);
attempts(id TEXT PK, device_id TEXT REFERENCES devices, hack_id TEXT, hack_version INTEGER, route_key TEXT,
         platform TEXT, seconds REAL, method TEXT CHECK(method IN ('tap','gps')), tier_class TEXT CHECK(tier_class IN ('walk','run')),
         vma_kmh REAL NULL, bag INTEGER, gps_start_m REAL NULL, gps_end_m REAL NULL, started_at TEXT, app_version TEXT,
         created_at TEXT, flagged INTEGER DEFAULT 0);
route_stats(hack_id TEXT, hack_version INTEGER, route_key TEXT, tier_class TEXT, n INTEGER, p50 REAL, p80 REAL, updated_at TEXT,
            PRIMARY KEY(hack_id, hack_version, route_key, tier_class));  -- recomputed on accepted insert
```
Endpoints: `POST /api/devices` → `{ id, token }`; `POST /api/attempts` (Bearer) → `{ accepted, flagged, percentile, p50, p80, n }`; `GET /api/hacks/{id}/stats` → all route_stats rows (cached 1 h in localStorage; also snapshotted into the built hack bundle at each deploy); `GET /api/me/attempts`; `GET /api/hacks/{id}/leaderboard?route=` → top 20 GPS-verified unflagged `{ alias, seconds, tier_class, date }`.

Anti-cheat: reject `seconds < pathMetres / 6.5` or `> 3 × walk-tier formula` or `> 1800`; GPS attempts need `gps_start_m ≤ 60`, `gps_end_m ≤ 40`, monotonic timestamps, implied speed ≤ 7 m/s; tap attempts count in percentiles with weight 0.5 and never on the leaderboard; ≤ 5 attempts per device per hour; server timestamps only; `hack_version` mismatch → stored, excluded from stats; no raw traces stored, only the two anchor distances.

Calibration math (in `engine/sprint.ts`, data optional): for (hack, version, route, tier_class) with n attempts, `t̂ = w · p80 + (1 − w) · F`, `w = n / (n + 10)` (formula-only at n = 0, half weight at n = 10, 75 % crowd at n = 30); p50 shown as "typical". When n ≥ 10, `margin = max(30 s, p80 − p50) + 20 s (+ 30 s without live data)`. A tier class with n < 3 borrows the other class's attempts scaled by `v_tier / v_other`. Personal layer: with `n_p ≥ 3` own attempts, `t_final = w_p · p80_personal + (1 − w_p) · t̂`, `w_p = n_p / (n_p + 3)`. The card labels the source ("model" / "n = 23 runners"). The MVP ships with calibration = null and works without the Worker.

### 10.x Gamification (user, 2026-09-13; phase 2, same backend)

Profiles and points, scored on how far you beat the odds the classic SBB planner gives you — never on how close you cut it.

- **Profile**: anonymous device id + nickname (phase-2 `POST /api/devices`); optional Strava identity later. Personal page: total points, runs, best time per shortcut, badges.
- **Points per accepted attempt** (`engine/points.ts`, pure, unit-tested):
  `beatS = plannerBudgetS − actualS` (seconds you beat SBB's transfer assumption by; the "odds" are SBB's budget vs your run)
  `points = round(clamp(beatS, 0, 600) / 6)` → 0–100 base, **+ 50 "made it" bonus** when the attempt ended before the target train's real departure and the official plan had that train as missed (the app already knows both), **× 1.25 first-timer multiplier** the first time a device runs a given shortcut, **× 1.5 explorer multiplier** for the first accepted attempt ever on a `draft` hack (rewards validating mined candidates).
  No bonus for small spare time: an attempt that arrived with < the planned margin gets the base points only and a "cut it close — no bonus" note. Safety is a product requirement for the SBB pitch: the scoring must never reward risk.
- **Anti-farming**: only GPS-verified attempts count for leaderboards (tap-only attempts count for personal stats at half points); diminishing returns per (device, shortcut, day): 1st run ×1, 2nd ×0.5, 3rd+ ×0; attempts already rejected by the anti-cheat bounds in §10 score nothing.
- **Leaderboards** (`GET /api/leaderboard?scope=shortcut|city|all&period=week|all`): top 20 by points; ties by best time. Per-shortcut boards double as the crowd timing table used for calibration.
- **Badges** (data, not code: `data/badges.json`): first accepted run on a shortcut ("First blood: Gleis 20"), 10 runs on one shortcut ("Regular"), validated a draft hack ("Scout"), beat SBB's budget by ≥ 5 min ("Odds-breaker").
- **Verification is GPS, never a self-report** (user, 2026-09-13). "On the platform" is only a stopwatch tap; no points come from it. An attempt is *accepted* only when all three hold: (1) **start** — the phone leaves the alight stop's geofence (`alight.geofence`, r 40 m, outdoors, reliable) within 90 s of the tram's real-time departure from that stop (stationboard prognosis), which becomes `t0`; (2) **finish** — the phone is inside the route's `landing` geofence *or* GPS is unavailable there (underground platforms 31–34 / 41–44 and the halls block GPS, so absence is not a failure); (3) **on the train** — between 2 and 6 min after the target train's real departure, ≥ 3 GPS fixes show the phone moving ≥ 50 km/h along the line's first inter-station segment (bearing and position within 300 m of the OSM railway way toward the next stop, stored per hack as `station.departureCorridor`: a polyline plus the next stop id), consistent with the train's prognosis. `actualS = t_platform − t0` where `t_platform` is the tap if it exists and the geofence entry otherwise; the "made it" bonus needs (3). Web apps cannot read GPS in the background, so the Go-live screen simply stays open after departure and shows "verifying you're on the IC 1…" until (3) passes (typically 2–4 min after the doors close) — then the result sheet. Attempts without (1) or (3) are stored as `unverified` (personal stats, half points, never on a leaderboard). Server checks the same rules again (`workers/api/src/verify.ts`); the client only pre-screens.
- **Fun**: the payout moment is the one place Hopp is playful (`ui/celebrate.ts` + `styles-motion.css`, all CSS/SVG, no animation library, `prefers-reduced-motion` respected): a **race bar** — SBB's budget bar with a tram icon vs. your bar with the runner overtaking it, drawn in over ~1.2 s; **points counting up** with a tick; a short **confetti burst** (canvas, 60 particles, 1.5 s) only when the "made it" bonus fires; **badge card flip** when a badge unlocks; on the Go-live screen the runner icon's legs animate while the band is GO and freeze on STAY ON; the band flip uses a 200 ms colour transition plus the vibrate (Android). Everything else in the app stays still — a moving tram is not the place for motion.
- **Where it appears in the flow**: Go-live → "On the platform" (stopwatch tap) → "verifying you're on the train…" (GPS, 2–4 min) → result sheet: your time vs SBB's budget (race bar), points earned, rank on this shortcut, badge; the Shortcut page shows the board. Nothing in the MVP flow changes; the MVP ships `calibration = null`, no points and no GPS verification (the geofence/corridor fields exist in the schema as optional so phase 2 is a data + backend change).

## 11. Error handling

- API busy (`errors[]` in a 200 body, HTTP 429, 5xx): `ApiBusyError` → "SBB timetable busy — retry in 60 s" with a counting-down Retry; exponential backoff 5/20/75 s on the live loop; never auto-retry in a tight loop; 30 s URL cache absorbs double taps; live loop pauses with a banner "live data paused Ns".
- Offline: shell and hacks from the SW; a result younger than 10 min for the same query is shown with a "stale" badge; countdown disabled after 120 s without a poll.
- Missing/malformed fields: durations always from timestamps (`walk.duration` null on leading walks); platform `''`/null → unknown route, RISKY at best, "Gleis not yet published"; passList without prognosis → scheduled + delay; `prognosis.platform` null in all samples → every verdict says "planned platform".
- No hack matched → plain SBB list. Platform with no route → "no route data for Gleis X — stay on". Expired validity → ribbon; `helps: never` → "STAY ON: <note>".
- Tram late / passed stop: §6 step 7. Unknown station: `/locations` returns nothing → "no station found". Geolocation denied/unavailable: the GPS entry path hides; text input remains. Wake lock unsupported: silent degrade. localStorage throwing (private mode): every access wrapped; defaults. Clock skew > 60 s vs the HTTP `Date` header → warning. Zod failure of a hack file → build fails; a malformed calibration snapshot is ignored at runtime.

## 12. Testing

- **Unit** (`bun test`, pure modules, fixtures = real API JSON captured 2026-09-13/14/15: `conn-margarethen-zhb-0815.json`, `conn-central-basel-0805.json`, `conn-basel-zhb-0828.json`, `sb-basel-0828.json`, `sb-zhb-0840.json`, `sb-central-live.json`, `ratelimit-error.json`): `platforms.test` (table over `'3','18','31','41/42','43/44','16A-C','3AB','7CD','19','20','',null`; range/array/never/unknown paths); `pace.test` (tiers, VMA 16 km/h → 3.33 m/s, 5k 22:00 → 14.8 km/h); `sprint.test` golden numbers (Zürich surface run 192 ± 1 s, walk 404 ± 1 s, 41–44 244 ± 2, 31–34 245 ± 2; Basel g20 98 ± 1, g5-12 201 ± 2; peak factor affects hall/platform only; calibration blend half-weight at n = 10); `margin.test` (boundaries at have == need and have == sprint; +30 s when !live); `validity.test` (2026-09-14: Bahnhofquai rideOn inactive, SZU never; 2026-12-13 flips); `match.test` (Margarethen fixture → case a, tAlight 08:24 at 8500160, baseline IC 3 08:33 Gleis 11; Central→Basel fixture → case c with the 540 s leading walk; a Zürich T6 + 420 s fixture → case a; no-hack connection → null; prognosis-bearing passList used); `rescore.test` (Basel 08:28 candidates → earliest GO is the baseline → STAY ON `no-earlier-train`; synthetic 08:30 Gleis 20 → GO with gain; 08:28 → RISKY never headlined; Gleis 2 → never with note; tram delay +2/+5 min degrades GO→RISKY→NO and shifts the fallback); `client.test` (rate-limit body → `ApiBusyError`, backoff, cache); `session.test` (idle→armed→live→done with fake clock and fake fetch).
- **Data validation** (`bun run validate`, CI + prebuild, exit 1): zod schema; ids resolve in `stations.json`; every `observedPlatforms` string maps to exactly one route (gaps and overlaps fail); platform specs disjoint; every path has a move step with m > 0, riseM ≤ 25 per level; **sum of move metres within 0.7–2.0 × haversine(alight, route.landing)** (not the station centroid — the MVP's rule as written rejected the Basel seed); landing within 600 m of the station; validity dates parse, from ≤ to; `sprint at run tier < plannerWalkS` for every `helps ≠ never` route else "hack cannot help"; `helps: never` routes carry a note; a "?" in a note forces confidence ≠ high; sources non-empty; `--online` resolves every id via `/v1/locations`; unmatched platform strings seen at runtime are logged to localStorage as a gap report.
- **Browser smoke** (phone, before each deploy; `gstack browse` for the desktop pass): `?mock=1` renders all screens; Margarethen → Zürich HB next weekday 08:15 shows the IWB verdict with fallback IC 3; Zürich, Kunsthaus → Bern shows the Central verdict and the 7-min ride-on fallback; Zürich HB → Bern (no hack) shows the plain list; forced rate limit → busy screen; airplane mode → offline message and stale result; Add to Home Screen opens standalone; Live digits readable at arm's length; wake lock holds 5 min; 320 px width no horizontal scroll; Lighthouse PWA installable (week 2).

## 13. Stack and file layout

Vite 6 + vanilla TypeScript (strict, `noUncheckedIndexedAccess`), zod, no UI/CSS/state framework (four screens, ~50 interactive nodes; a 40-line `h()` helper beats a runtime on a tram with 3G; the engine is pure so a later switch to Preact/Svelte for phase-2 screens is cheap). bun 1.3 for install/scripts/`bun test`; node 20 as CI fallback and for the Worker. GitHub Pages via `actions/deploy-pages` (no secrets), `base` from `BASE_PATH` (default `/hopp/`, Cloudflare Pages identical). All files < 400 lines.

```
hopp/
├─ package.json, tsconfig.json, vite.config.ts (base, import.meta.glob of data/hacks)
├─ public/manifest.webmanifest, public/icons/
├─ data/hacks/{zurich-hb.central,basel-sbb.iwb,lausanne.gare-m2}.json
├─ data/stations.json, data/pace-tables.json, data/miner/top40.json
├─ data/fixtures/*.json                      recorded API responses
├─ src/main.ts (≤80)                         boot, prefs, hash router, SW registration
├─ src/schema/{hack,station,index}.ts (≤180) zod + inferred types
├─ src/engine/{pace,sprint,margin,platforms,validity,match,rescore,verdict,time,calibration}.ts (60–160 each)
├─ src/api/{client,types,mock,urls}.ts       plain GET, errors[] check, pacing, cache; fixture-backed mock
├─ src/hacks/index.ts                        glob-load + validate
├─ src/ui/{app,screen-plan,screen-verdict,screen-live,screen-profile,screen-hacks,components,h}.ts (≤250 each), styles.css
├─ src/live/{session,geo,wakelock}.ts        state machine, polling loop, geofences
├─ src/storage/{prefs,attempts}.ts           localStorage; IndexedDB queue (phase 2)
├─ src/pwa/sw.ts (week 2)
├─ scripts/{validate-hacks,record-fixture,build-sw-manifest}.ts
├─ scripts/miner/{index,nearby,budget,osm,rank,cache}.ts
├─ workers/api/ (phase 2: wrangler.toml, src/{index,attempts,stats,strava}.ts, schema.sql)
├─ tests/**/*.test.ts
└─ .github/workflows/pages.yml               bun install → typecheck → validate → test → build → deploy
```

## 14. Strava (stretch)

Backend needed: yes — Strava has authorization-code OAuth only, and the token exchange needs `client_secret`. Minimal design: routes in the phase-2 Worker (or a standalone ~150-line Worker if phase 2 has not shipped): `GET /auth/login` → redirect to `strava.com/oauth/authorize?scope=activity:read` (+`activity:read_all` on opt-in), `state` = device id; `GET /auth/callback` → `POST https://www.strava.com/oauth/token`, refresh token in KV keyed by device id, redirect with a one-time token; `GET /api/pace` → refresh if needed, `GET /athletes/{id}/stats`, `GET /athlete/activities?per_page=50`, `GET /activities/{id}` for ≤ 5 recent runs (best_efforts); `VMA_est = median{ v1k/1.03, v5k/0.92, race_avg/0.92, recent_avg/0.70 }` with best efforts weighted 2×; respond `{ vmaKmh, confidence, basis }`, cached 24 h; `POST /api/disconnect` → deauthorize + delete. The app stores only `profile.vmaKmh` with source "strava". "Connect with Strava" button, "Powered by Strava" attribution, data shown only to that athlete, never on leaderboards. Single-athlete cap → two-commuter feature until Strava review; manual VMA/5k remains the default.

## 15. MVP scope vs deferred

**MVP (≈ 24 h; ship first):** static app on GitHub Pages; zod schema + validator; two seed hacks with validity windows and helps/never; settings (single sprint pace, optional VMA/5k derivation, bag, min margin); planner for any Swiss origin/destination (`/locations` autocomplete, nearest stop); the stitch (cases a/b/c, candidate re-query at tAlight + min sprint, per-platform route → sprint → margin → band, earliest GO with gain, RISKY secondary, fallback always visible and re-validated); Verdict + Live screens with stationboard polling, band-flip vibrate, passed-stop guard; error handling for rate limit/offline/unknown platform/expired validity; fixtures + unit tests + validation in CI; manifest + icons; `?mock=1`.

Ordered phases after that:
1. **Week 2 — PWA + entry path:** service worker (shell offline), wake lock, install prompt, GPS nearest-hack + "I'm on the T2 08:24" pick, hacks browse page, share/permalink (hash-encoded hack/destination/tram + Web Share button).
2. **Week 2–3 — Miner CLI:** locations → budgets → Overpass Dijkstra → ranked drafts; night runs; Lausanne as regression case.
3. **Phase 2 — Collaborative timing:** Worker + D1, attempts, stats, leaderboard, calibration blend, IndexedDB queue, snapshot into the build.
4. **Stretch — Strava** VMA import.
5. **Data follow-ups:** tram-16 Basel variant (baseline Markthalle + 480 s); Basel reverse direction (train → ramp → tram 2 Kante A) as a new hack kind; Zürich post-13-Dec-2026 variant and SZU after reopening; sector-letter → metres once formation data exists; "earlier tram would unlock a gain" hint; OJP 2.0 proxy Worker if the shared quota bites; German/French strings.

## 16. Risks

1. **Zürich construction zone:** the surface sidewalk to "Ausgang Bahnhofquai" may be fenced; shipping "zero level changes" without a walk-through could send a runner into a fence (+2 flights, ≈ +30 s). Mitigation: field check before enabling; route variant ready.
2. **Shared, undocumented quota:** 1000 route searches/day (per IP or proxy-wide?), per-minute limit after ~15 calls, HTTP 200 error bodies. Mitigation: 2 route calls per plan, live loop on stationboards, 30 s cache, busy screen, miner at night, OJP proxy as upgrade.
3. **Platform data:** `prognosis.platform` always null; French strings unnumbered; sector positions unknown → "planned platform" caveat, unknown-platform path capped at RISKY, wide `doorOffsetM.max`.
4. **Geometry error:** hall legs straight-line (+5–10 %), OSM underground outlines 40–90 m too long, signal waits 0–90 s across three crossings, terminus stopping practice inferred, Basel 16/18 half-level and Gleis 19/20 stop positions unknown. The margin covers typical, not worst, cases; first field timings calibrate.
5. **Door-close lead 20 s** unverified; GO near the boundary can fail → RISKY never recommended.
6. **Validity churn** (Bahnhofquai/HB 13 Dec 2026, SZU, Basel 2031, Lausanne works): stale data is actively wrong; validity windows and ribbons are mandatory, but a human must maintain them.
7. **Premise honesty:** SBB already budgets Central → HB at 9 min either way; the copy must say "SBB's budget minus your run", not "beat the tram".
8. **Safety/liability:** the app encourages running in stations; copy insists on crossings/signals, budgets not promises; never routes through the Basel underpass.
9. **Strava:** single-athlete cap and the 2024 agreement limit it to the two commuters and forbid exposing their data.
10. **API drift:** no SLA; the api layer is the only module touching raw JSON, fixtures pin today's format.

## 17. Open questions for the user (only those that change the build)

1. **Basel direction:** tram → train only (as specified), or also the reverse (arrive on Gleis 19/20, ramp, tram 2 Kante A towards Binningen)? The reverse is a different hack kind and changes the schema and detection.
2. **Which lines/directions do you two actually ride** into IWB and Central (tram 2 vs 16 at Basel; 3/6/10 vs 4/7/11 at Zürich; Polybahn)? Determines which baselines and platform letters the seeds must cover first.
3. **Hosting:** GitHub Pages under `/hopp/` or a custom domain on Cloudflare Pages? Affects `base`, service-worker scope, and whether the phase-2 Worker can be same-origin.
4. **Field timings before launch:** will you each time Central → Querhalle and IWB → Gleis 20 once at your normal effort (two numbers each, plus whether a signal stopped you)? These calibrate the tier constants in `pace-tables.json` and decide whether the Zürich hack ships enabled.
5. **Quota insurance:** set up the OJP 2.0 proxy Worker now (free key, 20 000/day) or wait until the shared transport.opendata.ch quota is actually hit? Changes the api layer's second backend.
6. **UI language:** English-only for the MVP (station names native), with German/French strings deferred?