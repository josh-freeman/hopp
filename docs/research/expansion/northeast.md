# Northeast route research

Checked **13 September 2026**. Seven stop-to-station approaches were investigated in Winterthur, St. Gallen, Schaffhausen, Chur and Zürich. Four have complete enough public access geometry for a narrowly scoped, desk-verified route. Three remain research records. None has been timed or inspected on foot.

The operational records are inputs to a specific trip search. A shorter modelled transfer is not evidence of an earlier arrival: the engine still needs a real train on a covered platform, enough time including the user's margin, and an arrival earlier than the original connection. These records do not establish seven general shortcuts or enable unmeasured platform groups.

| Approach | Timetable stop → railway station ID | Recorded walk budget | Result |
| --- | --- | ---: | --- |
| Winterthur, Archstrasse/HB | 8594298 → 8506000 | 420 s | Active for Gleis 3 only |
| Chur, Post I | 8571313 → 8509000 | 240 s | Active for Gleis 2, Arosa access only |
| Zürich, Sihlpost/HB | 8591367 → 8503000 | 540 s | Active for Gleis 3 only |
| Zürich Oerlikon, Bahnhof Nord | 8591062 → 8503006 | 240 s | Active for Gleis 8 only |
| Winterthur, Museumstrasse/HB | 8588552 → 8506000 | 300 s | Current construction access unresolved |
| St. Gallen, St.Leonhard | 8574223 → 8506302 | 360 s | Mainline stair rise unresolved |
| Schaffhausen, Bahnhof Nord | 8588887 → 8503424 | 180 s | Default model does not beat this budget; other apparent short paths use lifts |

## Evidence and modelling method

The SBB station plans establish platform numbering, public passages, station levels and current published works. Complete OpenStreetMap map extracts provide mapped pedestrian links and platform polygons. Timetable responses establish the actual stop IDs and walking transfer structure. These sources answer different questions; a point inside a platform polygon alone does not establish access.

Distances are sums of haversine distances along a continuous chain of mapped public pavements, pedestrian crossings, squares and footways, plus the short approach from the timetable stop point to the nearest mapped pavement. Private/customer-only links and traffic-lane shortcuts were excluded. Stairways, lift nodes, differing levels and the actual connection to the relevant platform boundary were checked separately. In particular, a geometrical overlap with a path underneath a platform was not accepted as access to that platform.

Every promoted path is rounded upward. Door-position distances are conservative model allowances, not measurements of a particular train formation. `doorOffsetM.max` is retained as an uncertainty bound; the current engine computes timing with `typ`. Platform sectors and stopping positions remain field checks. Stop coordinates come from the recorded timetable response; landing coordinates are exact OSM nodes. No stair dimensions were invented.

New records use `kind: transfer-slack`, empty `rideOn` and empty line/platform-letter mappings. No ride-past claim is inferred from an origin-to-station walk. `station.minTransferS: 0` means an independent railway minimum was not established; it is not a claim that changing trains takes zero seconds. The actual observed stop-to-station budget is in `alight.plannerWalkS`.

All four active records are `desk-verified`, have medium route confidence and expire on **12 December 2026** for a review at the timetable change. The expiry is a data review deadline, not a prediction of physical closure. Current signs and published train platforms govern actual use. There is no claim that OSM geometry is a current access guarantee.

## Promoted public access paths

| Active record | Mapped access length | Model distance | Crossings | Door allowance, typical / maximum | Platform landing |
| --- | ---: | ---: | ---: | ---: | --- |
| `winterthur.archstrasse` | 178.7 m | 200 m street | 3 | 180 / 400 m | [Node 5349403684](https://www.openstreetmap.org/node/5349403684), Gleis 3 |
| `chur.post-i` | 145.2 m | 165 m street | 1 | 200 / 350 m | [Node 14089235014](https://www.openstreetmap.org/node/14089235014), Gleis 2 |
| `zurich-hb.sihlpost` | 335.5 m | 370 m street | 5 | 180 / 400 m | [Node 356305557](https://www.openstreetmap.org/node/356305557), Gleis 3 |
| `zurich-oerlikon.bahnhof-nord` | 171.8 m | 185 m street + 5 m ramp | 2 | 140 / 300 m | [Node 9651573109](https://www.openstreetmap.org/node/9651573109), Gleis 8 |

**Winterthur Archstrasse.** The route follows public pavements and Salzhausplatz to the southern end of Gleis 3. The final footway shares node 5349403684 with the Gleis 3 platform boundary (relation 5659908, outer way 380044861). Its first 28.1 m connect the timetable stop point to the pavement; the exact alighting kerb must be checked. It avoids the controlled bicycle parking facility. The [SBB Winterthur plan, 12/2025](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-winterthur-a4.pdf) distinguishes this southern approach from the Stellwerk 2 works farther north. No island-platform underpass is included.

**Chur Post I.** Public pavements and a designated crossing reach the city-level Arosa platform. The landing lies within the mapped Gleis 2 polygon, way 244969029, and the [SBB Chur plan, 07/2026](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-chur-a4.pdf) explicitly marks the city-level Gleis 1–2 access. Only Gleis 2 is enabled: the path does not require crossing a railway track, and access across to Gleis 1 was not independently established. The long platform motivates the 200 m train-position allowance. The recorded Arosa connection actually departs Gleis 2.

**Zürich Sihlpost.** The selected route follows the public pavement north and crosses Europaplatz to the side access of Gleis 3. Its landing is a shared boundary node of train platform way 107555897 at level 0. The [SBB Zürich HB plan](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-zuerich-hb-a4.pdf) supplies the station/platform context. The 335.5 m chain includes a 15.7 m stop-point approach. Five mapped crossing links are budgeted separately. This does not cover any underground platform or other surface platform.

**Oerlikon Bahnhof Nord.** The route uses the Affolternstrasse pavements and crossings, then the short public ramp to the outer Gleis 8 platform. The landing is shared with platform relation 9310982, outer way 233263264. Ramp way 454724167 measures 3.1 m and is modelled as 5 m; the remaining street allowance is also rounded upward. A shorter route along the road centreline was rejected. The [SBB Oerlikon plan, 12/2025](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-zuerich-oerlikon-a4.pdf) identifies the northern station entrances. Apparent geometric shortcuts to other platforms do not establish access to those platforms.

At the default 3.5 m/s profile without a bag, on the fixture's weekday morning, the engine gives the following rounded-up times. Required times include its configured margin and door-close allowance. They are model outputs, not field timings or guaranteed savings.

| Route | Sprint estimate | Required, scheduled only | Required, live prediction | Recorded planner walk |
| --- | ---: | ---: | ---: | ---: |
| Archstrasse → Gleis 3 | 160 s | 255 s | 225 s | 420 s |
| Post I → Gleis 2 | 136 s | 231 s | 201 s | 240 s |
| Sihlpost → Gleis 3 | 228 s | 323 s | 293 s | 540 s |
| Bahnhof Nord → Gleis 8 | 134 s | 229 s | 199 s | 240 s |

Chur and Oerlikon have small default timing windows. A bag, slower pace, larger user margin, different platform, construction detour or stopping position may eliminate them. The engine must evaluate those inputs on each trip.

## Candidates kept out of the active catalogue

**Museumstrasse, Winterthur.** A mapped 108.9 m surface approach to Gleis 1 exists, but the current public route through the north-side works is unresolved. The SBB plan marks BahnFussweg/Stellwerk 2 construction through expected spring 2028. The [city's temporary traffic order](https://stadt.winterthur.ch/gemeinde/verwaltung/bau/tiefbauamt/oeffentliche-planauflage-und-verkehrsanordnungen/verkehrsanordnungen/baustellensignalisation-stellwerk-ii-bahnhofplatz-bahnfussweg-merkur-und-museumstrasse) and [project construction information](https://stellwerk2.ch/baustelleninformation/) identify access and traffic changes. The [city's bicycle station page](https://stadt.winterthur.ch/themen/leben-in-winterthur/verkehr-mobilitaet/velo/velo-rund-um-den-bahnhof/velostationen) describes controlled access, so that facility is not an assumed general public passage. Current alighting kerb, diversion and open entrance must be settled before promotion.

**St.Leonhard, St. Gallen.** The [SBB plan, 06/2026](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-st-gallen-a4.pdf) distinguishes mainline Gleis 1–8 from Appenzeller Bahnen 11/12 and the public underpasses. The approximately 332 m mapped mainline Gleis 1 chain includes stairs [378097959](https://www.openstreetmap.org/way/378097959) and [377429471](https://www.openstreetmap.org/way/377429471) without step counts or rise. Horizontal stair length cannot supply that missing vertical dimension. Separate surface paths to 11/12 measure about 225–228 m, but their timetable station/platform applicability is not established by the captured mainline connection. Neither omission was filled with an assumed model.

**Bahnhof Nord, Schaffhausen.** The [SBB plan, 05/2026](https://cdnsource.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-schaffhausen-a4.pdf.sbbdownload.pdf) confirms public Löwengässchen and Süd passages. A non-lift Gleis 1 chain measures 159.5 m. [Stair way 191872658](https://www.openstreetmap.org/way/191872658) supplies 27 steps and a 0.13 m riser height, giving 3.51 m rise. [Ramp way 291491757](https://www.openstreetmap.org/way/291491757) supplies a 37.2 m tagged length, longer than the coarse mapped polyline. A conservative timing probe uses 25 m street, 40 m ramp, 110 m passage, that staircase and 140 m door allowance: about 234 s scheduled / 204 s live, against the captured 180 s planner walk. There is no demonstrated useful default timing window. Apparent shorter paths to other platforms traverse lifts, including [node 3809734505](https://www.openstreetmap.org/node/3809734505) for Gleis 6; these were not modelled as flat footways. Actual stopping positions and useful journeys need investigation before activation.

## One captured earlier-arrival example

**15 September 2026, 08:04 at Winterthur, Archstrasse/HB, destination Aarau.** The [actual full-journey baseline request](https://transport.opendata.ch/v1/connections?from=8594298&to=Aarau&date=2026-09-15&time=08%3A04&limit=4) returns a seven-minute walk starting 08:26, IC5 from Winterthur Gleis 3 at 08:33, and Aarau arrival **09:28**. Capture: `data/research/raw/ne-gain-arch-aarau-baseline-0804.json`.

The [actual station candidate request at 08:06](https://transport.opendata.ch/v1/connections?from=8506000&to=Aarau&date=2026-09-15&time=08%3A06&limit=10) returns S11 from **Gleis 3 at 08:09**, arriving Zürich HB at 08:28 on Gleis 41/42; RE37 leaves Gleis 16 at 08:38 and reaches Aarau at **09:05**. That onward change is supplied by the timetable API; no additional shortcut is assumed. Capture: `data/research/raw/ne-gain-arch-aarau-candidates-0806.json`.

The default engine has 300 seconds from 08:04 to the S11 departure and requires 254.3 seconds including the scheduled-only margin. Its model therefore returns GO with a **23-minute earlier arrival** and approximately 46 seconds beyond the required allowance. The ordinary seven-minute walk would require starting by 08:02. Only the stated 08:04 query was captured; this does not claim that every start time in an inferred interval was tested. The 08:06 station query is exactly the planner's minute-rounded earliest modelled station-arrival time. Both original responses are unmodified. Route confidence remains medium and the route remains unverified on foot.

A negative probe is also retained. For [Archstrasse → Bern at 08:28](https://transport.opendata.ch/v1/connections?from=8594298&to=8507000&date=2026-09-15&time=08%3A28&limit=4), the [station candidates](https://transport.opendata.ch/v1/connections?from=8506000&to=8507000&date=2026-09-15&time=08%3A28&limit=4) include earlier arrivals on trains leaving Gleis 4. Both are rejected because the researched route covers only Gleis 3. Covered trains merely equal the baseline arrival, so there is no recommendation. Files: `ne-gain-arch-baseline-0828.json` and `ne-gain-arch-candidates-0828.json` under `data/research/raw/`.

## Reproducible captures and checks

The seven initial timetable captures below use 15 September 2026, 08:00 Swiss local time, three connections, and were fetched on 13 September. Each begins with the actual alight-stop-to-station walk. `walk.duration` is null, so the stated budget is the difference between the walking section's departure and arrival timestamps. The first captured train need not use the promoted platform; coverage is checked against each actual candidate.

| Raw file under `data/research/raw/` | Exact public API request | First baseline train platform |
| --- | --- | --- |
| `ne-conn-winter-arch.json` | [Archstrasse → Bern](https://transport.opendata.ch/v1/connections?from=8594298&to=8507000&date=2026-09-15&time=08%3A00&limit=3) | 4, outside promoted coverage |
| `ne-conn-chur-post.json` | [Post I → Arosa](https://transport.opendata.ch/v1/connections?from=8571313&to=Arosa&date=2026-09-15&time=08%3A00&limit=3) | 2 |
| `ne-conn-zh-sihlpost.json` | [Sihlpost → Bern](https://transport.opendata.ch/v1/connections?from=8591367&to=8507000&date=2026-09-15&time=08%3A00&limit=3) | 32, outside promoted coverage |
| `ne-conn-oerlikon-nord.json` | [Oerlikon Bahnhof Nord → Bern](https://transport.opendata.ch/v1/connections?from=8591062&to=8507000&date=2026-09-15&time=08%3A00&limit=3) | 3, outside promoted coverage |
| `ne-conn-winter-museum.json` | [Museumstrasse → Bern](https://transport.opendata.ch/v1/connections?from=8588552&to=8507000&date=2026-09-15&time=08%3A00&limit=3) | 4 |
| `ne-conn-sg-leonhard.json` | [St.Leonhard → Bern](https://transport.opendata.ch/v1/connections?from=8574223&to=8507000&date=2026-09-15&time=08%3A00&limit=3) | 1 |
| `ne-conn-schaff-nord.json` | [Schaffhausen Bahnhof Nord → Bern](https://transport.opendata.ch/v1/connections?from=8588887&to=8507000&date=2026-09-15&time=08%3A00&limit=3) | 3 |

OSM source extracts are `ne-osm-winterthur.json`, `ne-osm-stgallen.json`, `ne-osm-schaffhausen.json`, `ne-osm-chur.json`, `ne-osm-zurich.json` and `ne-osm-oerlikon.json`. The exact `/api/0.6/map.json?bbox=…` request URLs are retained in the research records. `ne-verified-paths.json` contains the four promoted ordered way/node chains, original tags, stop-point approach distances, platform references and mapped/model distances. The corresponding Hack JSONs additionally link every traversed OSM way.

`tests/unit/expanded-routes.test.ts` checks all four genuine initial baseline responses, plus the independently researched Nyon route's `root-nyon-centre-geneve.json`, against their expected stop IDs, station IDs and observed walk budgets. It checks that an uncovered platform remains NO and that those baseline services do not imply an earlier arrival. A clearly labelled synthetic platform-only policy probe proves that even a catchable train is not recommended when its final arrival merely equals the baseline. Separate tests use the unmodified Aarau and Bern probe responses to demonstrate the real 23-minute gain and the rejection of real earlier trains on an uncovered platform. **17 tests, 113 assertions passed** with `bun test tests/unit/expanded-routes.test.ts` on 13 September 2026. No synthetic timetable is represented as a recorded earlier-train result.
