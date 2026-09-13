# Western Switzerland access research

Checked **13 September 2026**. Nine approaches across Bern, Biel/Bienne, Genève, Lausanne, Fribourg and Neuchâtel were investigated. Four have enough evidence for narrowly scoped **desk-verified** planner records, covering twelve platform groups. Five remain research only. None has been inspected or timed on foot.

These records feed the user's actual trip search. A shorter transfer model does not prove an earlier arrival: the planner must still find a real train on a supported platform, apply the pace and margin, and compare its final arrival with the original connection. The captured baselines do not establish a positive arrival gain.

| Approach | Timetable stop → railway station | Observed walk budget | Result |
| --- | --- | ---: | --- |
| Bern, Hirschengraben → existing Welle | 8579896 → 8507000 | 540 s | Enabled for 3/4, 5/6, 7/8, 9/10, 12/13 |
| Hirschengraben → future Bubenberg passage | 8579896 → 8507000 | Not measured | Not yet commissioned; excluded |
| Biel/Bienne, Place Guisan → central underpass | 8587619 → 8504300 | 420 s | Enabled for 2/3, 4/5, 6/7 |
| Genève, Lyon → Montbrillant | 8592850 → 8501008 | 420 s | Enabled for 4/5 only |
| Genève, Lyon → main hall, platforms 1–3 | 8592850 → 8501008 | 420 s | Complete vertical geometry unresolved |
| Lausanne, Georgette → eastern entrance | 8592051 → 8501120 | Direct walk not established | Current construction routing unresolved |
| Lausanne, gare (m2) → railway passages | Existing seed 8592050 → 8501120 | Not revalidated | Existing draft remains unchanged |
| Fribourg/Freiburg, Richemond/gare → western underpass | 8511792 → 8504100 | 180 s | Real public access, weak timing benefit; excluded |
| Neuchâtel, gare nord → railway underpass | 8579625 → 8504221 | 240 s | Enabled for 2/3, 4/5, 6/7; small timing windows |

## Evidence and modelling

SBB station plans establish public entrances, platform numbering and station levels. Operator plans establish stop layouts and service context. OpenStreetMap supplies connected pedestrian geometry, stair direction and explicit `step_count`; the captured timetable responses supply real stop IDs and walking-transfer durations. These are distinct evidence layers. A path merely passing underneath a platform is not accepted as access to it.

Distances use haversine lengths along connected public mapped footways, pavements, pedestrian areas, underpasses and ramps. Private/restricted ways, construction links, area-boundary shortcuts, lifts and stairs without an explicit count were excluded. Bern's apparently shorter indoor building shortcut was also excluded. Genève uses a consistent public approach via Rue des Grottes, Rue Cité-de-la-Corderie and Rue des Amis; its longer, connected geometry is used instead of an inferred straight line to the station.

Each active model uses the **longest measured approach from the mapped boarding quays**, rather than treating the nearest edge as universal. Bern includes mapped A–F stop edges; Biel includes A–C; Genève includes both Lyon platform polygons; Neuchâtel includes A–C. A short connector from a mapped boarding point to its adjacent mapped pavement is retained where needed. Crossing counts use the maximum across these variants. Split crossing links remain separate, deliberately allowing more delay. Actual signal waits can exceed the model's ten seconds per link.

Movement segments are rounded upward to five metres, with another ten metres for boarding-position/pavement uncertainty. Stair plan-view distance is removed from movement metres and replaced with the vertical timing model. **Stair counts are sourced; rise is explicitly modelled at 0.18 metres per riser.** That assumption is conservative but is not a surveyed height. Every route has medium confidence and a field check for actual rise. Door approach is also a model allowance: Bern and Genève use 120/350 m typical/maximum, Biel and Neuchâtel 100/300 m. The engine currently uses `typ`; `max` records uncertainty and is not silently included in the displayed time.

`station.minTransferS: 0` means no independent railway minimum was established. It is not a zero-second change claim. The observed stop-to-station budget is in `alight.plannerWalkS`. Bern and Biel have explicit `rideOn` entries supported by captured bus/tram sections; matching still requires the actual feeder's stop list and times. Genève and Neuchâtel have no inferred ride-past mapping.

All four records expire for review on **12 December 2026**. This is a data-review deadline, not a claim that the public route closes then. Neuchâtel also excludes **25–27 September 2026**, when transN explicitly warns of Fête des Vendanges crowding and disruption. Current station signs and published train platforms govern use; neither OSM nor the connection API guarantees that a passage remains open.

## Promoted paths and platform evidence

| Active record / platform group | Longest measured chain | Model movement metres | Counted stairs | Crossing links | Platform landing node |
| --- | ---: | ---: | --- | ---: | --- |
| Bern 3/4 | 442.2 m | 455 m | 40 down | 8 | 821429459 |
| Bern 5/6 | 457.5 m | 470 m | 40 down | 8 | 821429518 |
| Bern 7/8 | 472.7 m | 485 m | 40 down | 8 | 821429626 |
| Bern 9/10 | 486.5 m | 495 m | 41 down | 8 | 821429550 |
| Bern 12/13 | 505.5 m | 515 m | 42 down | 8 | 821429544 |
| Biel 2/3 | 320.6 m | 335 m | 26 up | 2 | 6046656239 |
| Biel 4/5 | 336.5 m | 350 m | 26 up | 2 | 6046656241 |
| Biel 6/7 | 352.3 m | 360 m | 26 up | 2 | 6046656243 |
| Genève 4/5 | 587.7 m | 585 m | 7 down, 31 up | 3 | 3054937562 |
| Neuchâtel 6/7 | 191.7 m | 200 m | 26 up | 1 | 5553124036 |
| Neuchâtel 4/5 | 206.8 m | 215 m | 26 up | 1 | 5553124024 |
| Neuchâtel 2/3 | 222.5 m | 230 m | 27 up | 1 | 5553122309 |

Measured chains include stair plan-view distance. Model movement metres exclude that distance because stairs have a separate rise/time component; therefore the two columns are not directly comparable. Full ordered way chains, coordinates, direction flags and source tags are retained in `data/research/raw/west-{bern,biel,geneve,neuchatel}-measurements.json`. The condensed audit is `west-promotion-measurements.json`; these files are derived analysis, not untouched API responses.

**Bern.** The [SBB public-access description](https://www.sbb.ch/de/reiseinformationen/bahnhoefe/bahnhof-finden/bahnhof-bern/bahnhofsbeschrieb.html) identifies Welle as a public passerelle connecting Hirschengraben/Schanzenstrasse with the platforms, and warns about narrow, busy approaches. The [August 2026 SBB plan](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-bern-a4.pdf) confirms the stair banks and announces the forthcoming platform 1/2 work. The enabled descending stair ways are [68172860](https://www.openstreetmap.org/way/68172860), [68172826](https://www.openstreetmap.org/way/68172826), [68172871](https://www.openstreetmap.org/way/68172871), [68172904](https://www.openstreetmap.org/way/68172904) and [68172866](https://www.openstreetmap.org/way/68172866). Their lower endpoints are in the corresponding platform relations 10228959, 10228960, 10228961, 14666888 and 10228957. Platforms 1/2, 49/50 and RBS platforms are unsupported. The large all-quay bound is intentional: the distant bus boarding edge adds substantially more walking than tram quay A.

The [BERNMOBIL stop page](https://www.bernmobil.ch/de/fahrplan-netz/fahrplan-nach-haltestellen/hirschengraben) and [published station-area works](https://www.bernmobil.ch/de/verkehrsinformationen/baustellen/unterhalsarbeiten-raum-bahnhof) were checked. The cited 2026 summer disruption windows had ended by the research date; they do not prove that there will be no new closure. The [SBB project update](https://news.sbb.ch/de/019d7b77-8b55-7146-873b-297632bf5fea/zukunft-bahnhof-bern-ausbau-laeuft-in-vielen-bereichen-gut-komplexitaet-fuehrt-jedoch-zu-verzoegerungen) distinguishes the future Bubenberg/Hirschengraben underground access, now expected in 2031, from the building's opening. That future passage contributes no active geometry.

**Biel/Bienne.** The [June 2026 SBB plan](https://www.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-biel-bienne-a4.pdf.sbbdownload.pdf) shows the public central underpass and platforms above it. Counted stair ways [642224337](https://www.openstreetmap.org/way/642224337), [642224339](https://www.openstreetmap.org/way/642224339) and [642224341](https://www.openstreetmap.org/way/642224341) connect the underpass to the upper endpoints in platform relations 10216211, 10216212 and 10216208. The apparent route to 9/10 could not be completed through the approved pedestrian graph; 1 and 9/10 are omitted. The [official line 5 timetable](https://widgets.oev-info.ch/publikation/jahresfpl/22.005.pdf) corroborates Place Guisan immediately before Bahnhof/Gare; the captured line 9 takes two minutes and then receives a five-minute station walk. The [operator's current disruption page](https://vb-tpb.ch/de/netzinfo) is dynamic; its text-only response did not expose a complete live alert list, so no blanket absence-of-works claim is made.

**Genève.** The [July 2026 SBB plan](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-geneve-a4.pdf) identifies the public Montbrillant entrance. The [TPG connection plan currently linked from its plans page](https://www.tpg.ch/sites/default/files/arrets_plan_de_connexion/CVIN_Gen%C3%A8ve%20gare%20Cornavin_Totem.pdf) is valid from 15 December 2024 and corroborates Lyon and the surrounding public pedestrian network; it is not a 2026 field survey. The mapped route descends [seven entrance steps](https://www.openstreetmap.org/way/1218743806), enters the level-1 public passage, and ascends [31 steps](https://www.openstreetmap.org/way/301439282) to node 3054937562 within [platform relation 4013259](https://www.openstreetmap.org/relation/4013259). Only tracks 4/5 are enabled. The relation's additional track 10 designation is not adopted, and no French-sector access or shortcut to 1–3 is inferred. [SBB's current project calendar](https://company.sbb.ch/fr/developpement-ferroviaire/projets/suisse-romande-valais/leman-2030/nos-projets/geneve-cornavin.html) places the underground station in a future permitting/construction programme; future mezzanines and platforms are excluded.

**Neuchâtel.** The [SBB station plan](https://cdnsource.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-neuchatel-a4.pdf.sbbdownload.pdf) and [transN north-side connection plan](https://www.transn.ch/fileadmin/transn/pdf/Plans/Plan-de-connexion_GareNord_2024.pdf) establish public access from quays A–C. The route descends the [mapped 53.7 m ramp](https://www.openstreetmap.org/way/1222102214), follows the railway underpass and ascends counted stairs [579951165](https://www.openstreetmap.org/way/579951165), [579951167](https://www.openstreetmap.org/way/579951167) or [579951163](https://www.openstreetmap.org/way/579951163). Their upper endpoints are in platform relations 8209994, 8209995 and 8209993. Voie 1 was not promoted. The [current transN disruptions page](https://www.transn.ch/voyageurs/voyager/info-voyageurs/info-trafic/) and [2026 timetable's festival notice](https://www.transn.ch/fileadmin/transn/horaire_2026/109/transN-NE-109-2.pdf) were checked. The four-minute planner budget makes these marginal opportunities, not a general large saving.

## Approaches kept out of the planner

**Lausanne Georgette and m2.** The [2026 TL Georgette plan](https://www.t-l.ch/app/uploads/2026/01/Lausanne-Georgette.pdf) establishes the stop; the captured connection uses a five-minute bus ride followed by a five-minute station walk. That final walk must not be mislabelled as Georgette's direct walking budget. The [CFF update of July 2026](https://news.sbb.ch/fr/019d7b77-2ee6-7440-82c6-0148ce2dc460/des-nouvelles-des-chantiers-de-la-gare-de-lausanne) says the forecourt worksite moved from the south to the north on 27 July and pedestrian routes changed. The [January 2026 station plan](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-lausanne-a4.pdf) also directs passengers to current signs. A current continuous entrance-to-platform survey is required. The earlier m2 draft and its unverified dimensions were not changed or promoted.

**Fribourg Richemond.** The [city's completed Richemond project](https://www.ville-fribourg.ch/transformations/richemond) and [CFF's access-completion update](https://news.sbb.ch/fr/019d7b77-5154-7b10-8db3-d1206a8fd300/derniers-acces-modernises-a-la-gare-de-fribourg) establish real public improvements. The [current station plan](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-fribourg-a4.pdf) distinguishes western access from the eastern underpass works. Measured public approaches to the western ramps range from approximately 178–219 m depending on stop side and platform. Yet the real Richemond walk is already only **08:00–08:03**. The Boulevard de Pérolles/gare comparison also receives 180 seconds. No six- or eight-minute penalty is invented to make this look useful. The complete ramp geometry and a real beneficial departure window remain research tasks.

## Captures, reproducibility and validation

The following are untouched JSON responses saved on 13 September 2026. Requests use the shared `scripts/research-fetch.py` lock and 8.5-second global pacing. API responses and OSM extracts are real captures; distance summaries and timing models are derived research. No synthetic response is presented as recorded evidence.

| Raw file under `data/research/raw/` | Exact request |
| --- | --- |
| `west-bern-hirschengraben-connections.json` | [Bern → Zürich, 14 September 08:00](https://transport.opendata.ch/v1/connections?from=8579896&to=8503000&date=2026-09-14&time=08%3A00&limit=3) |
| `west-biel-place-guisan-connections.json` | [Biel → Zürich, 14 September 08:00](https://transport.opendata.ch/v1/connections?from=8587619&to=8503000&date=2026-09-14&time=08%3A00&limit=3) |
| `west-geneve-lyon-connections.json` | [Lyon → Lausanne, 14 September 08:00](https://transport.opendata.ch/v1/connections?from=8592850&to=8501120&date=2026-09-14&time=08%3A00&limit=3) |
| `west-neuchatel-gare-nord-connections.json` | [Gare nord → Lausanne, 14 September 08:00](https://transport.opendata.ch/v1/connections?from=8579625&to=8501120&date=2026-09-14&time=08%3A00&limit=3) |
| `west-lausanne-georgette-connections.json` | [Georgette → Genève, 14 September 08:00](https://transport.opendata.ch/v1/connections?from=8592051&to=8501008&date=2026-09-14&time=08%3A00&limit=3) |
| `west-fribourg-richemond-connections.json` | [Richemond → Bern, 14 September 08:00](https://transport.opendata.ch/v1/connections?from=8511792&to=8507000&date=2026-09-14&time=08%3A00&limit=3) |
| `west-fribourg-bd-perolles-connections.json` | [Bd Pérolles → Bern, 14 September 08:00](https://transport.opendata.ch/v1/connections?from=8510983&to=8507000&date=2026-09-14&time=08%3A00&limit=3) |
| `west-bern-welle-map.json` | [Full OSM Welle map extract](https://api.openstreetmap.org/api/0.6/map.json?bbox=7.4358,46.9478,7.4372,46.9490) |
| `west-bern-platform-9-10.json` | [Complete OSM 9/10 platform relation](https://api.openstreetmap.org/api/0.6/relation/14666888/full.json) |
| `west-biel-station-map.json` | [Full OSM Biel station extract](https://api.openstreetmap.org/api/0.6/map.json?bbox=7.2405,47.1305,7.2445,47.1330) |

The six `west-*-osm.json` extracts retain OSM source elements for all investigated cities. The measurement JSON contains the exact used way/node IDs, ordered geometry, direction and source tags; each element is directly inspectable at `https://www.openstreetmap.org/way/{id}` or `/node/{id}`. Multipolygon membership was checked using complete outer rings; an incomplete outer-way fragment was not treated as a closed platform.

At the default 3.5 m/s profile, without a bag, on the weekday-morning fixture, rounded-up model times are:

| Group | Sprint estimate | Required with scheduled-only data | Required with a live feeder prediction | Recorded walk |
| --- | ---: | ---: | ---: | ---: |
| Bern 3/4 → 12/13 | 289–316 s | 384–413 s | 354–383 s | 540 s |
| Biel 2/3 → 6/7 | 185–196 s | 280–291 s | 250–261 s | 420 s |
| Genève 4/5 | 277 s | 372 s | 342 s | 420 s |
| Neuchâtel 6/7 | 133 s | 228 s | 198 s | 240 s |
| Neuchâtel 4/5 | 139 s | 234 s | 204 s | 240 s |
| Neuchâtel 2/3 | 146 s | 241 s | 211 s | 240 s |

These are model outputs, not field timings. Neuchâtel 2/3 does not beat the nominal four-minute budget with the full scheduled-only margin at this profile. Other Neuchâtel groups have very little scheduled-only slack. Slower pace, luggage, a larger margin or a distant stopping position can remove the opportunity entirely.

`tests/unit/west-routes.test.ts` exercises all four real baseline captures, actual stop IDs and budgets, rejects platform changes outside measured coverage, proves that reusing a baseline train does not invent a positive gain, and checks festival/review expiry plus dated research provenance. **14 tests / 88 assertions passed; TypeScript checking passed.**
