# Hopp — Research brief

Date: 2026-09-13. Sources: transport.opendata.ch v1 (61 + 55 live requests, 2026-09-13/14/15), OpenStreetMap via Overpass and the OSM API (snapshot 2026-09-13), SBB Trafimage station plans (Zürich HB 12/2025, Basel SBB 02/2026), city/operator notices (VBZ, SZU, bz Basel, news.sbb.ch), Wikipedia (de/fr), Strava developer docs, pedestrian-dynamics literature. Two independent verification passes (geometry, operations) were run on the Zürich and Basel briefs; where a verification refuted a brief, the corrected value is used here.

Conventions: distances in metres, times in seconds unless stated; "?" marks a number that is inferred or unverified; confidence is given per row. Every coordinate quoted comes from an API/OSM response.

---

## 1. What SBB assumes

### 1.1 Walk budgets inside a connection (tram stop → station)

The planner budgets a fixed walk from a stop to the station node. It is a per-stop constant, independent of the departure platform (checked against surface, Löwenstrasse and Museumstrasse platforms at Zürich; 2–20 and 31–35 at Basel). It appears as a leading `walk` section (`walk.duration` = null; derive from timestamps) or an intermediate one (`walk.duration` in seconds).

| Stop (id) | Station | Budget | Notes | Conf. |
|---|---|---|---|---|
| Zürich, Central (8588078) | Zürich HB | 9 min (540 s) | straight line 282 m → implied 0.52 m/s | high |
| Zürich, Bahnhofquai/HB (8587349) | Zürich HB | 7 min (420 s) | 99 m straight line → 0.24 m/s; stop closed for trams until 12 Dec 2026 | high |
| Zürich, Bahnhofplatz/HB (8587348) | Zürich HB | 7 min | | high |
| Zürich, Bahnhofstrasse/HB (8591067) | Zürich HB | 7 min | | high |
| Zürich, Sihlquai/HB (8591368) | Zürich HB | 7 min | | high |
| Zürich, Sihlpost/HB (8591367) | Zürich HB | 9 min | | high |
| Basel, IWB (8500160) | Basel SBB | 8 min (480 s) | straight line 398 m → 0.83 m/s | high |
| Basel, Margarethen (8589340) | Basel SBB | 11 min | alternative offered: T2 4–5 min + 6 min | high |
| Basel, Markthalle (8500193) | Basel SBB | 8 min | | high |
| Basel, Bahnhof SBB tram stop (8578143) | Basel SBB | 6 min (360 s) | | high |
| Basel, Peter Merian (8588071) | Basel SBB | never walked; T10/11 1–2 min + 360 s | | high |
| Lausanne, gare m2/bus (8592050) | Lausanne | 5 min (300 s) | transfer, not a walk section | high |
| Lausanne, Grancy (8592052) | Lausanne | 9 min | | high |
| Lausanne-Flon (8501181) | Lausanne | 13 min | | high |

Warning reproduced by both the brief and its verifier: a walk-only query (`from=Central&to=Zürich HB`) returns 4 min. That is a walk to the station centroid, not the transfer budget. The number the app must beat is the budget that appears in a connection with a train leg: 540 s from Central, 420 s from every HB-adjacent stop.

### 1.2 Minimum platform-to-platform transfer inside the hub

Transfers are implicit; the API never emits an in-station walk section.

| Hub | Minimum accepted | Rejected | Evidence | Conf. |
|---|---|---|---|---|
| Zürich HB | 5 min (all pair types: surface↔surface, 31–34↔41–44, surface↔41–44) | 4 min rejected twice even when the rejected train arrives earlier | 49 transfers examined | high |
| Basel SBB | 6 min (2→19, 15→31, 20→12, 11→8/6/4) | 5 min rejected once (8→31, French sector); 4 min rejected for adjacent 19/20 | 43 transfers; no Swiss-only 5-min pair existed to test → Swiss minimum bounded 5–6 min | medium |

### 1.3 What the API exposes for real time

`delay` (integer minutes) and `prognosis.departure/arrival` are populated for today's trips (13/51 delayed on a live Zürich HB board); for future dates all prognosis fields are null. `prognosis.platform` was null in every sample — live platform changes may be invisible. Platform strings: `'11'`, `'41/42'`, `'43/44'`, `'16A-C'`, `'3AB'`, `'7CD'`; null for French stops. Tram platforms are letters (Central A–I, IWB A–D, Bahnhof SBB E/F/H).

---

## 2. Zürich HB hack — verified geometry

### 2.1 Current state (validity window)

- Platform groups (corrected from the project brief): **3–18** surface terminus, level 0, 420 m usable, Querhalle 108 × 24 m at the east head; **21–22** SZU Tiefbahnhof (125 m, 11.6 m deep, under the south façade); **31–34** Löwenstrasse (through, 420 m, 15.4 m deep, OSM level −4); **41–44** Museumstrasse (through, 360 m, 13.6 m deep, level −3; renumbered from 21–24 in May 2012).
- **Bahnhofquai/HB tram stop closed 14 Dec 2025 – 12 Dec 2026** (VBZ track rebuild; OSM nodes carry `construction:railway=tram_stop`; live board shows only bus 46). Its ShopVille accesses are closed too.
- **SZU station 21/22 closed 29 Apr – 18 Oct 2026, reopening postponed to December 2026** (szu.ch); S4/S10 end at Selnau; no S4/S10 on the HB board.
- Nordtrakt rebuild: provisional until autumn 2026 (whether it affects the Nordtrakt passage is unknown ?).
- Trams from Central to HB today (live board 2026-09-13): **3** (platform B → Bahnhofplatz/HB, 2–3 min), **6, 10** (H → Bahnhofplatz/HB, 2 min, terminate there), **7** (H → Bahnhofstrasse/HB, 3 min), **4, 11** (F → Bahnhofstrasse/HB, 2 min), bus **31** (I → Bahnhofplatz/HB, 1–2 min). **Tram 15 does not continue to HB** (departs G toward Tiefenbrunnen; VBZ 2026 says it becomes line 11 at Central ?). All run non-stop over the Bahnhofbrücke.
- Consequence for the premise: SBB already budgets Central → train at 540 s, and ride-on (120 s) + 420 s = 540 s. The commuter's "earlier train than the tram route" is really "SBB's 9-minute budget minus my actual run"; the app must say so.

### 2.2 Distance table (OSM node chains; outdoor legs follow footways, hall legs are straight lines because the Haupthalle interior is not routable in OSM)

Start = Central tram platform F (node 94583344, 47.3767194, 8.5435274); H is −7 m, B +3 m; Polybahn arrivals +55 m. Route: bridge north sidewalk (the mapped pedestrian side) → Bahnhofquai → east portal "Ausgang Bahnhofquai" (node 267348654, 47.377759, 8.541364; reached at 217–233 m) → Haupthalle → Querhalle.

| From | To | Distance | Level changes | Signalised crossings | Conf. |
|---|---|---|---|---|---|
| Central F | head of Gleis 3 | 402–418 m | 0 | 3 (nodes 364713591, 356299462, 29033250) | high/medium (hall leg straight line, +5–10 % ?) |
| Central F | head of Gleis 8/9 | 385–401 m | 0 | 3 | high/medium |
| Central F | head of Gleis 10/11 | 382–398 m | 0 | 3 | high/medium |
| Central F | head of Gleis 18 | 390–406 m | 0 | 3 | high/medium |
| Central F | Gleis 41–44 (Museumstrasse) | 424–440 m | 2 escalators down (0→−2, 7.3 m, 19 m long; −2→−3, 6.3 m ?, 7 m long) | 3 | medium; lands roughly mid-platform (OSM outline 40–50 m longer than the real 360 m) |
| Central F | Gleis 41–44 via NE-corner Landesmuseum stairs | 438–454 m | 3 short flights (30 steps, 14 steps, escalator) | 5 | medium; lands ~72 m from the east end |
| Central F | Gleis 31–34 (Löwenstrasse) | 423–439 m | escalator 0→−2 (7.3 m, 15 m long) + stairs −2→−4 (50 steps, 8.1 m, escalator alongside) | 3 | medium; lands in the eastern third |
| Central F | Gleis 21–22 (SZU) | ~423 m ? | 2 down | 3 | low; station closed, access being rebuilt |
| Bahnhofquai/HB stop (post-reopening) | heads 3 / 10–11 / 18 | 214 / 195 / 203 m | 0 | 1 | high/medium |
| Bahnhofquai/HB stop | 41–44 / 31–34 / 21–22 | 237–251 / 235 / ~236 m | 2–3 down | 1 | medium / low |
| Bahnhofplatz/HB tram platform | head of Gleis 3 | 44–115 m (verifier correction: footway route from the east end is 115 m, not 83 m) | 0 | 0–1 | high |
| Bahnhofplatz/HB | head of 10/11 / 18 | ~115–185 / 178–249 m | 0 | 0–1 | high |
| Bahnhofplatz/HB | 31–34 / 41–44 / 21–22 | 199 / 244 / 64 m | 2 down | 0 | medium / low |
| Sihlquai/HB | 41–44 west end / 31–34 / Gleis 10–11 sector C / head of 18 | 100 / 205 / 114 / 233–237 m | 2 / 2 / 1+1 / 0 | 0 | medium |
| extra, Gleis 3–18 | to a train door | 10–30 m if the rear car is in sector A (terminus practice, inference ?); up to 400 m to a chosen car; 100–320 m if a short train stands up-platform ? | 0 | | medium/low — needs SBB formation data |
| extra, 41–44 / 31–34 | to a train door | 0–100 / 0–150 m | 0 | | low-medium |

Gradient is negligible (bridge and station at ~408 m a.s.l.).

### 2.3 Which platform groups the hack helps, and by how much

Athlete estimates use the pace model of §7 (run tier 3.3 m/s, off-peak; alight 12 s, react 3 s, 10 s per crossing, hall factor 0.8, door offset at 0.9·v). "Need" = sprint + margin (max(45 s, 15 %) + 20 s door lead). Planner budget = 540 s in every case (direct walk from Central, or 120 s ride + 420 s).

| Group | Sprint (run) | Need incl. margin | Window gained vs 540 s | Walk-tier need | Conf. |
|---|---|---|---|---|---|
| Gleis 3–18 | 192 s | 257 s | **4.7 min** | 485 s (0.9 min) | medium |
| Gleis 41–44 | 244 s | 309 s | **3.9 min** | — | medium |
| Gleis 31–34 | 245 s | 310 s | **3.8 min** | — | medium |
| Gleis 21–22 | — | — | disabled until SZU reopens (~Dec 2026) | | — |

Jog tier (2.5 m/s) for 3–18: 239 s sprint, 304 s need → 3.9 min; brisk (1.75 m/s): 322 s, 390 s → 2.5 min. The window is the time span during which additional trains become catchable; the realised gain depends on what departs in it (e.g. Basel example in §5 shows a case with zero gain).

The commuter's memory ("pays off mostly on the top-floor platforms") is consistent: 3–18 has zero level changes and the largest window; 31–34/41–44 lose ~50 s to escalators/stairs and are "marginal".

### 2.4 Validity and field checks

- Valid 2025-12-14 → 2026-12-12 as encoded (Bahnhofquai/HB closure). After 13 Dec 2026 the ride-on to Bahnhofquai/HB (1 min) leaves 195–214 m of surface run inside a 420 s budget — the hack must be re-surveyed and re-versioned.
- SZU group disabled until reopening; the new access (spring 2026 per the SBB plan, then slipped) is not mapped.
- **Unverified and decisive:** whether the surface sidewalk along Bahnhofquai from the bridge to "Ausgang Bahnhofquai" (≈120 m) is fenced by the tram-stop works. The SBB plan marks the works zone directly east of the façade ("Wegleitung vor Ort"); the city's only pedestrian advice is "use the ShopVille underpasses". If fenced, the fallback is the NE "Eingang Shopville" stairs (30 steps down, 14 down, escalators up) — +2 flights, ≈ +25–40 s.

---

## 3. Basel SBB hack — verified geometry

### 3.1 Resolved interpretation of the commuter's words

| Phrase | Resolution | Evidence | Conf. |
|---|---|---|---|
| "IWB" | tram stop "Basel, IWB" (8500160), Margarethenstrasse, on the south-west (Gundeldingen) side at the SW abutment of the Margarethenbrücke; tram 2 city-bound stops at Kante B (47.5465349, 7.5840273) on the station-side sidewalk (no track crossing) | OSM platform 377466170; stationboard | high |
| "the bridge" | Margarethenbrücke (road + tram bridge, OSM layer 2) crossing the whole west end of the track field ~300 m west of the RailCity Passerelle | OSM ways; tram 2 IWB→Markthalle 1 min | high |
| "the passage" | the **ramp** from the bridge's SE sidewalk (top 47.5473402, 7.5848733) 59 m down onto the west tip of platform 19/20 (foot 47.5471411, 7.5856005; OSM way 1273058927, `incline=up`, `level=0;1`, `bicycle=yes`, no access restriction; bz Basel 2024-04-10: "Eine Rampe schafft den Zugang von der Margarethenbrücke auf die Gleise 19/20"). Possibly also the provisional west passerelle | OSM + press | high |
| "gate 20" | **Gleis 20**: southernmost track, new island platform 19/20 opened 2024-04-15; Gleis 20 is a terminating Wendegleis that "reaches until just before the Margarethenbrücke", so trains on 20 stand at the west (ramp) end — hence "saves the most if your platform is close to 20" | company.sbb.ch, bz Basel, OSM rel 17916175 | high |
| "run through the station" | east along platform 19/20 and, for other platforms, up the provisional west passerelle (opened 2025-12-06 ?, 147 × 10 m, stairs + lifts to 5/6 … 19/20) or the RailCity Passerelle | SBB project page, OSM | medium-high |
| "instead of riding two stops" | IWB → Markthalle → Bahnhof SBB (Centralbahnplatz) | passList | high |

Alternative reading not excluded: the commuter may describe the **reverse** direction (arrive by train on 19/20, exit via the ramp, catch tram 2 towards Binningen at Kante A instead of riding two stops from Centralbahlplatz). The ramp is bidirectional; both directions can be modelled.

### 3.2 Tram 2 stop sequence (direction Binningen → city)

… Zoo Dorenbach → **Margarethen** (8589340, 47.54414, 7.581731) → **IWB** (8500160, platform B; dep :15) → over the Margarethenbrücke → **Markthalle** (8500193, platform S; :16, dwell 0–1 min) → **Bahnhof SBB** (8578143, platform F, Centralbahnplatz; :18) → Kirschgarten → Bankverein → … → Badischer Bahnhof. IWB → Bahnhof SBB 3 min scheduled, headway ~10 min per direction in the sample (combined 4–8 min in the morning). Margarethen → Bahnhof SBB 4–5 min.

Tram 16 also serves IWB (Kante C city-bound, D outbound): city-bound it crosses the bridge to Markthalle (platform N) and continues to Schifflände **without serving Bahnhof SBB**; its planner baseline is "Markthalle + 8 min walk". Outbound it goes via "Bhfeingang Gundeldingen" (8500146, south end of the RailCity Passerelle). Tram 12 was not observed.

### 3.3 Platform layout

Platforms numbered north (Centralbahnplatz: 1/2 east bay, 3/4, 5/6, 7/8, 9/10) to south (Gundeldingen: 11/12, 14/15, 16/18, 19/20). All level 0. SNCF platforms 30–35 at the west end on the north side (Elsässerbahnhof); track 4 continues into track 30. Cross-platform links: RailCity Passerelle (level 1, 185 × 30 m, from the Schalterhalle to Meret Oppenheim-Platz) and the provisional west passerelle (S entrance Meret Oppenheim-Strasse 47.5467534, 7.5863042; N landing on platform 5/6 west end = Perron 30/31). No public underpass from Gundeldingen (the historic underpass is one-way, platform-gated, peak-hour, from platforms 5–12 outbound only — never route inbound runners through it). Platform 16/18 has two half-platforms at different heights since 2024 (Gleis 18 lower) joined by stairs/ramps; which half the bridge stair lands on is unknown ?. Platform 19/20 is ~460 m long: ramp foot → RailCity stair 213 m, → east end ~410 m.

### 3.4 Distance table (haversine chains over OSM nodes; +18 m sidewalk correction applied to IWB rows; ±10 %)

| From | To | Route | Distance | Level changes | Conf. |
|---|---|---|---|---|---|
| IWB (B) | Gleis 19/20, west tip (sector H) | Margarethenstrasse → bridge SE sidewalk → **ramp** | 173 (chain) / ~191 (sidewalk) m | 0 stairs (ramp ~5 m down ?, ~8–9 %) | high |
| IWB (B) | Gleis 16/18 | bridge SE sidewalk → 27-step stair (opened 2013-04-13, ticket validator at the foot) | 150 / ~168 m | 1 down (~4.5 m ?) + possible half-level on the platform | high (stairs), medium (levels) |
| IWB (B) | Gleis 14/15 | bridge → 30-step stair (2013) | 173 / ~191 m | 1 down (~5 m ?) | high |
| IWB (B) | Gleis 11/12 | Meret Oppenheim-Strasse → provisional passerelle (13 steps + flight ?) → stair down | 336 / ~354 m | 2 (up, down) | high |
| IWB (B) | Gleis 9/10 / 7/8 / 5/6 | same | 392 / 364 / 384 m (+18) | 2 | high |
| IWB (B) | Gleis 30–35 (SNCF) | same → N landing → Elsässerbahnhof | 411 m (+18) | 2 | medium |
| IWB (B) | Gleis 3/4 | RailCity Passerelle only | 690 m | 2 | high — no gain |
| IWB (B) | Gleis 1/2 | Passerelle → hall → east | 820 m | 2 | medium — no gain |
| Bahnhof SBB tram stop (F) | Gleis 3/4 … 19/20 | hall escalator → RailCity Passerelle → stair | 161 / 166 / 184 / 202 / 219 / 241 / 258 / 286 m | 2 | high |
| Bahnhof SBB (F) | Gleis 1/2 | hall level 0 | 212 m | 0 | medium |
| Markthalle (S) | Gleis 30–35 / 5/6 | Centralbahnstrasse → Elsässerbahnhof steps | 195 m | 1 short | medium |
| Margarethen | Gleis 19/20 | 380 m to the IWB junction → ramp | 457 m | 0 | high |

### 3.5 Which platform groups the hack helps, and by how much

Planner reference = 180 s ride + 360 s walk = 540 s after the tram passes IWB (or 480 s direct-walk budget when the journey starts at IWB). Run tier, off-peak, door offset per row.

| Group | Sprint (run) | Need incl. margin | Window gained vs 540 s | Conf. |
|---|---|---|---|---|
| Gleis 20 (train stands at the ramp end, door offset 40 m) | 98 s | 163 s | **6.3 min** (commuter: "up to 5") | high |
| Gleis 19 (through track, door offset 150 m ?) | 135 s | 200 s | 5.7 min | medium |
| Gleis 16/18 (bridge stairs, door 100 m ?) | 123 s | 188 s | 5.9 min | medium |
| Gleis 14/15 (bridge stairs) | 124 s | 189 s | 5.8 min | medium-high |
| Gleis 5–12 (provisional passerelle) | ~201 s | ~266 s | 4.6 min | medium |
| Gleis 30–35 (SNCF) | ~205 s | ~270 s | 4.5 min | low |
| Gleis 1–4 | 250–300 s + | > 540 s equivalent | none — stay on | high |

Observed usage (stationboard 2026-09-15): Gleis 20 = IR56/IC51 (Delémont/Biel/Lausanne via Laufen) and S31; 19 = S3 Olten; 31/33/35 = TER; TGV = 7CD/9.

### 3.6 Validity and field checks

- Valid from 2025-12-06 (provisional passerelle); the permanent "Perronzugang Margarethen" footbridge (15–16.5 m wide, all platforms, construction earliest 2031, commissioning ~2037) and the bridge rebuild will change every row.
- Unknown: opening hours/night closure of the ramp and the two bridge stairs (public entrances with ticket validators, so probably always open ?); winter/ice; which half of 16/18 the stair serves; where trains stop on 19; ramp gradient.

---

## 4. Lausanne (third seed) — unverified

Verdict: **no "get off one stop early and run" shortcut exists.** The m2 stop "Lausanne, gare" (8592050) is already at underpass level (−1) under Place de la Gare with a 51 m step-free corridor into the passage sous-voies est; every platform is 155–205 m + one 28-step flight away (runner ≈ 1:40–1:55 ?). The exploitable slack is the planner's flat **300 s** m2 → train transfer, i.e. ≈ 3 min for a runner — a "transfer-slack" case, not an alight-early hack.

| Origin | To voie 7/8 | 3/4 | 1 | Level changes | Planner | Runner est. ? | Beats staying on the m2? |
|---|---|---|---|---|---|---|---|
| m2 Lausanne-Gare platform | 205 m | 165 m | 155 m | 28 steps up | 300 s transfer | 1:55 / 1:42 / 1:38 | (reference) |
| m2 Grancy E entrance (46.514930, 6.628963), 20 m below the platforms | 205 m | 240 m | 275 m | +12 m street, 54 steps up | 9 min direct | 2:29 / 2:40 / 2:52 | only ≈ 1 min, only for voie 7/8 (Genève-bound IR90/IR95/RE33) ? |
| m2 Flon entrance (476 m a.s.l.) | 750 m | 720 m | 690 m | 27 m descent, ~100 steps down | 13 min | 5:37 / 5:27 / 5:17 | no — slower than the m2 |
| tl bus stop B (Av. de la Gare) | 168 m | 131 m | 90 m | 1 down + 28 up | 300 s | 1:42 / 1:30 / 1:16 | (reference) |

Layout: voies 1, 3–8 and bay 70 in service; voie 9 out of service (site of the future quai 5) ?; no voie 2. Léman 2030 works: Place de la Gare basement phase 2 May 2026 – summer 2027, parking du Simplon demolition summer 2026 (may move the temporary Simplon passerelle), platform/underpass works from end 2026 or 2027 (sources disagree), completion 2034–2037. All Lausanne numbers are model outputs with OSM gaps (east-passage stairs to 3/4 and 5/6 not node-connected; Closelet link missing) and must be treated as "?".

---

## 5. API findings and the chosen computation strategy

### 5.1 API comparison

| API | Key | Browser | Quota | Walk/transfer control | Verdict |
|---|---|---|---|---|---|
| transport.opendata.ch v1 | none | `access-control-allow-origin: *` on GET (OPTIONS 405 → no custom headers) | search.ch: 1000 route searches + 10 080 stationboards per day (per IP or proxy-wide: unknown); undocumented per-minute limit (~15 route calls in 2 min → HTTP 200 with `errors[0].message = "Rate limit error from timetable.search.ch: Too many requests this minute"`; also HTTP 429 seen after ~25 calls in 40 s) | none | **primary** |
| OJP 2.0 (api.opentransportdata.swiss/ojp20) | free Bearer key | CORS OK but key exposed → needs a proxy | 50/min, 20 000/day per key | `WalkSpeed` not available in CH; `Speed %` only on access/egress and still follows OSM | optional quota upgrade |
| SBB Journey-Service / B2P | OAuth2 + SBB approval; B2P commercial | unknown | plan-based | unknown | mention only |

No API can express a curated shortcut; `via` cannot force alighting (a pass-through satisfies it); `direct=1` is ignored; `isArrivalTime=1`, `transportations[]`, `fields[]`, `limit ≤ 16`, `via[]` work; `passList` contains intermediate tram stops with times (e.g. tram 2: Margarethen 08:23, IWB 08:24, Markthalle 08:26, Bahnhof SBB 08:27) — exactly what alight detection needs.

### 5.2 Chosen strategy: stitch

1. Baseline: `GET /v1/connections?from&to&limit=6` (+date/time) — SBB's real proposal.
2. Detect: a tram/bus section whose `passList` contains the hack's alight stop and whose itinerary continues into the hack station (rides on to a rideOn stop, or SBB itself walks from the alight stop). `tAlight` from `prognosis.arrival` or scheduled + delay.
3. Sprint: per platform group from the hack data and the user's pace.
4. Candidates: `GET /v1/connections?from=<station>&to=<dest>&date&time=floor(tAlight + min sprint)&limit=10` (no `transportations[]` filter so onward bus/boat legs survive); per candidate read the planned platform, map to a route, compute have/need, band.
5. Live loop: `GET /v1/stationboard?id=<station>&datetime=…&limit=40&transportations[]=train` every 45–60 s and the alight-stop board every 30–45 s (10 080/day pool); route calls only at plan time or ≥ 3 min.

Worked live example (2026-09-14): Margarethen 08:23 T2 → IWB 08:24 → Bahnhof SBB 08:27, walk 360 s, IC 3 08:33 Gleis 11 → Zürich HB 09:26. Alighting at IWB with a run-tier sprint to Gleis 11 (≈ 201 s + 65 s → ready 08:28:30) still yields IC 3 08:33 as the earliest Zürich train → "STAY ON, no gain for this tram". The window (540 s − ~165–270 s ≈ 4.5–6 min) matches the commuter's "up to 5 minutes"; whether a train sits in it is timetable luck.

---

## 6. Strava feasibility verdict

- Strava supports only the OAuth 2.0 authorization-code flow (no PKCE, implicit or device flow); the token exchange needs `client_secret`, which "should never be shared". **A static site cannot connect to Strava alone; a tiny backend (one Cloudflare Worker, ~150 lines, secrets in Worker secrets, refresh tokens in KV) is required.**
- Signals: `GET /athletes/{id}/stats` → `recent_run_totals` (4-week easy pace, Everyone-visibility only); `GET /athlete/activities` → per-run `average_speed`, `workout_type` (race = 1); `GET /activities/{id}` → `best_efforts[]` (400m, 1k, 1 mile, 5k; runs only). Scope `activity:read` (+ `activity:read_all` for "Only Me" runs).
- Derived scalar: VMA_est = weighted median of {v1k/1.03, v5k/0.92, race_avg/0.92, recent_avg/0.70}, best efforts weighted 2×.
- Constraints: new apps are "single-player mode" (1 athlete); 10 athletes on request; more needs a 7–10-day review; since 2024-11-11 an athlete's data may be shown only to that athlete, no AI training, "Connect with Strava" button and "Powered by Strava" attribution. Rate limits (100 reads/15 min) are irrelevant at this scale. Access tokens last 6 h; refresh tokens rotate.
- Verdict: **stretch goal, two-commuter feature**; manual VMA/5k input covers the MVP. Never expose Strava-derived values on a leaderboard.

---

## 7. Pace model, tiers and margin policy

sprint = t_alight + t_react + Σ_moves m_i / v_i + Σ_levels (riseM · s_kind,dir,tierClass + 3 s) + crossings · 10 s + doorOffsetM / (0.9 · v_open)

| Item | Value | Basis | Conf. |
|---|---|---|---|
| Tier v_open | walk 1.35 · brisk 1.75 · jog 2.5 · run 3.3 · sprint 4.2 m/s | Weidmann 1.34; Bohannon 1.27–1.46 comfortable, 1.75–2.53 max; Fujiyama fast walk 1.71–1.84; 60–65 % / 75–80 % / 95–100 % of a 15–16 km/h VMA | high / medium for jog–sprint |
| VMA input | v_open = 0.75 · VMA / 3.6 | 300 m at 100–110 % VMA is feasible; environment brings the effective factor to 0.6–0.75 | medium |
| 5k input | VMA = (5000 / t5k) · 3.6 / 0.92 | 5 km at 90–95 % VMA | medium |
| Move factors | street 1.0 · ramp 0.9 · hall 0.8 · platform 0.9; weekday peak (07:00–09:00, 16:30–18:30) ×0.8 in halls/platforms; caps ramp 4.0, hall 3.5, platform 4.0 m/s | Weidmann fundamental diagram 0.97/0.79/0.45 at 0.5/1/2 P/m² | medium |
| Stairs, s per vertical metre (walk-class \| run-class) | down 2.4 \| 1.6; up 3.2 \| 2.2 | Fujiyama & Tyler 2004 (0.63–1.08 m/s horizontal on 30.5° stairs) + transitions | medium |
| Escalator, s per vertical metre | standing 3.6 (EN 115, 0.5–0.65 m/s belt); walking down 1.5, up 1.8 | | medium |
| t_alight / t_react / per crossing | 12 s / 3 s / 10 s expected signal wait (variance → margin) | Lin & Wilson dwell constants; TCQSM 3 s start-up; signal cycles 0–30 s | medium |
| Luggage (phase 2 toggle) | ×0.93 backpack, ×0.87 bag, ×0.75 suitcase | ~1 % speed per 1 % body mass (PMID 29216289) | medium |

Margin policy: margin = max(45 s, 0.15 · sprint) + 20 s door-close lead (? unverified SBB practice) + 30 s when no live tram data. Bands: **GO** if have ≥ sprint + margin; **RISKY** if sprint ≤ have < sprint + margin; **NO** otherwise. Only GO is ever recommended; RISKY is shown as a labelled secondary line; the SBB fallback is always visible. Calibration (phase 2): per (hack, route, tier class) blend t̂ = (n · p80 + 10 · formula) / (n + 10).

Sanity: SBB's budgets imply 0.24–1.05 m/s straight-line, i.e. a walk-tier commuter also fits inside them (Zürich 3–18: 485 s need vs 540 s), which is why the app must frame the gain as "budget minus your run".

---

## 8. Open uncertainties needing a real-world check

Ask the user and his train-buddy to time these with a phone stopwatch (start = doors open, stop = standing at the platform head; note tier, crowd, and whether a signal stopped them):

1. **Zürich: Bahnhofquai sidewalk passability** from the bridge to "Ausgang Bahnhofquai" during the tram-stop works (fenced → +2 flights via "Eingang Shopville"). Decisive; not determinable online.
2. **Zürich: actual Central → Querhalle time** at their tier (model 192 s run / 322 s brisk); the hall leg is a straight-line estimate (+5–10 % ?), and the three signalised crossings cost 0–90 s.
3. **Zürich: where trains stand on 3–18** (rear car in sector A within 10–30 m of the head?) — 100–320 m of extra run if a short train is parked up-platform ?.
4. **Basel: IWB → Gleis 20 time** via the ramp (model 98 s run) and whether the ramp/stairs are ever closed (night, ice).
5. **Basel: direction** — do they use tram → train, train → tram, or both?
6. **Basel: Gleis 16/18 half-level** — which half the bridge stair lands on; extra stairs/ramp when the train is on the other track ?.
7. **Basel: where trains stop on Gleis 19 and 20** (sector; 19/20 is ~460 m long, ramp foot at the west tip).
8. **Door-close lead**: how many seconds before the scheduled departure do doors close on IC/IR/S-Bahn at these stations (assumed 20 s ?).
9. **Live platform changes**: whether `prognosis.platform` ever populates on transport.opendata.ch (null in all samples).
10. **Quota**: whether the 1000 route searches/day is per client IP or shared by everyone using transport.opendata.ch (a peak-hour lockout risk).
11. **Zürich tram 15/13/14 and the post-13-Dec-2026 network** (Bahnhofquai/HB reopening, SZU new access).
12. **Lausanne**: everything (m2 platform level, Saugettes entrance hours, runner times) — only if a Lausanne commuter volunteers.