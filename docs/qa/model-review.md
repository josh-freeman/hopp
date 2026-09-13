# Hopp model review — 2026-09-13

The implementation follows the approved product decisions in §0 of `docs/superpowers/specs/2026-09-13-hopp-design.md`. Those decisions supersede the older pace tiers and worked numbers elsewhere in the proposal. The model estimates a transfer budget; none of the seed routes has been field-timed or field-verified.

## Formula and new golden values

The profile has one sprint speed, default **3.5 m/s**, with an optional luggage multiplier of **0.87**. Walking at **1.35 m/s** is a comparison, not a selectable routing mode. A manually supplied VMA gives `0.75 × VMA / 3.6`; a 5 km time in seconds gives `0.75 × 5000 / (seconds × 0.92)`.

Sprint seconds are:

```
12 seconds alighting + 3 seconds reacting
+ sum(distance / capped speed for each street, ramp, hall or platform step)
+ sum(vertical metres × stair/escalator rate + 3 seconds per level step)
+ 10 seconds per listed crossing
+ typical distance from landing to train door / (0.9 × open speed)
```

Move factors are street 1.0, ramp 0.9, hall 0.8, platform 0.9. Ramp, hall and platform speeds cap at 4.0, 3.5 and 4.0 m/s. On weekdays from 07:00–09:00 and 16:30–18:30 in Europe/Zurich, halls and platforms receive another factor of 0.8. Peak end times are exclusive. Stair/escalator rates and other constants live in `data/pace-tables.json`.

Required margin is `max(profile.minMarginS, sprint × 0.15) + 20 seconds door-close lead + 30 seconds without live prognosis in the connection`. The configured minimum defaults to 45 seconds. GO requires `available ≥ sprint + margin`; RISKY requires `available ≥ sprint`. The model retains fractional seconds and the UI rounds durations for display.

Off-peak means Sunday 2026-09-13 at 12:00 Zurich time. Peak means Monday 2026-09-14 at 08:00. Values use the default profile, luggage off, and include fixed movement/crossing/door approach times but exclude margin:

| Route | Sprint off-peak (s) | Sprint peak (s) | Walking off-peak (s) |
| --- | ---: | ---: | ---: |
| Zürich surface 3–18 | 183.595 | 199.220 | 404.321 |
| Zürich Museumstrasse 41–44 | 234.360 | 250.521 | 522.450 |
| Zürich Löwenstrasse 31–34 | 235.013 | 250.460 | 511.802 |
| Basel Gleis 20 | 94.143 | 94.143 | 204.259 |
| Basel Gleis 19 | 129.063 | 129.063 | 294.794 |
| Basel Gleis 16–18 | 117.867 | 119.454 | 253.121 |
| Basel Gleis 14–15 | 119.175 | 119.175 | 255.638 |
| Basel Gleis 5–12 | 192.689 | 201.617 | 424.682 |

The older Zürich 192 s / Basel 98 s examples used 3.3 m/s and are not the new default-speed expectations. Luggage raises Basel Gleis 20 to 104.475 s. Stair rates do not independently change when luggage is toggled.

## Decision checks

- Match a feeder passing the early alight stop or ending there, followed by a continuous walking transfer into the correct station and a train. Also handle a query beginning at the alight stop with a leading walk. A journey number alone is not sufficient evidence of the transfer.
- Resolve prognosis timestamps before scheduled timestamps plus delay, using epoch seconds consistently. Swiss date/time formatting and peak windows are independent of the device timezone.
- Only supported railway categories can start a sprint candidate. An onward bus/boat remains permitted. A known delayed train that can no longer make a later journey, including its walking transfer, is NO.
- Platform strings must map to one known group. `41/42` resolves to the shared Zürich group; a slash spanning different routes, such as Basel `19/20`, is not guessed. Missing/unparseable platform data uses the slowest active helping route and caps the result at RISKY.
- Disabled, draft, and expired hacks cannot match or recommend; expired routes and `helps: never` cannot become GO. Only a GO candidate arriving earlier than the actual complete SBB baseline journey can headline. Ties in final arrival use earlier departure.
- The pure engine rejects feeder stops older than the query by more than 60 seconds. The planner additionally owns the feeder-only wall-clock guard before/after network requests and on live refresh; historic timetable fixtures intentionally use their original query epoch.

Two actual HTTP response bodies were recovered from Claude's research scratchpad and copied without alteration into `tests/unit/fixtures/`; their request parameters and checksums are recorded there. They verify Margarethen → IWB at 08:24 → IC 3 at 08:33 on Gleis 11 → Zürich HB at 09:26. The correct outcome is **no earlier train**, despite a shorter transfer. Interactive demo scenarios remain explicitly synthetic.

## Geometry and evidence limits

All route coordinates and path lengths were copied from the design's embedded seed JSON. No missing landing was invented. Routes with question-marked notes were reduced from high confidence to medium where necessary. Zürich and Basel are **desk-verified**; Lausanne is a **draft**, excluded from recommendations.

`bun run validate` checks schemas, dates, IDs, disjoint platform groups, observed platform coverage, path distance/rise constraints, uncertainty labels, source presence, and whether the model can improve the planner's walking budget. Geometry notes remain explicit:

1. Zürich SZU has no surveyed landing; the route is marked `helps: never`.
2. Basel Gleis 5–12 has 350 m of movement but its documented landing is the passerelle entrance, only about 146 m from IWB. The strict 2× straight-line check would falsely reject the known indoor detour/entrance endpoint. This is a warning requiring a platform endpoint survey.
3. Basel SNCF Gleis 30–35 has no surveyed landing and low confidence.
4. Basel Gleis 1–4 has no surveyed landing; it is marked `helps: never`.

Field work is still needed for Zürich construction sidewalk access, indoor path lengths and signal waits, Basel ramp opening conditions, split platform levels, and actual train stopping positions. The model uses typical door offsets and expected crossing waits, not their maximum possible costs. The 20-second door-close lead remains an unverified assumption. No successful automated test turns any of these estimates into a guaranteed connection.

## Expanded catalogue and final integration checks

The build loads every schema-valid file in `data/hacks/` into a generated catalogue: 11 enabled route records and one draft. Real captured responses cover all nine additions, including partial-platform rejection and preservation of the actual baseline. The Winterthur Archstrasse → Aarau recordings establish a modelled 23-minute gain for a specific 15 September departure; the negative Bern probe correctly rejects earlier services on uncovered platform 4.

Origin starts have no departed feeder, so their eligibility follows remaining sprint time rather than a one-minute passed-stop guard. Before the user starts, an origin fallback needs its full planner walk from the current time. Confirmation preserves the train selected on the live screen. GO cards on non-live screens expire automatically when the available margin runs out or the timetable becomes stale.

The final unit suite contains **85 tests and 438 assertions**, including these regressions. Expanded routes remain desk researched, with explicit rise/door-position assumptions and current access limitations documented in the research report.
