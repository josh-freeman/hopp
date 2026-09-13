# Swiss station shortcut research

Hopp now has **11 enabled stop-to-station route records**, compared with the original two. The expansion examines **25 approaches at 21 stations in detail**, alongside a broader timetable screen covering **19 stations and 38 nearby-stop observations**. Across those sets and the original Basel route, **40 distinct railway stations** are represented. These counts describe different levels of evidence: the broad screen is a source of leads, while enabled routes have specific mapped platform access.

The strongest new coverage comes from public side entrances, underpasses and terminal-platform approaches. The research combines SBB station plans, municipal and operator construction notices, mapped pedestrian infrastructure, and actual timetable responses. Checked dates are **13 September 2026**; timetable samples concern travel on **14 or 15 September 2026**. None of the newly enabled routes has been timed on foot.

The route records are used only in a relevant journey search. A recommendation still requires a real departure on a supported platform, the full personal margin, and an earlier final arrival than the regular connection. A short mapped path alone cannot establish that a train is catchable.

## Enabled coverage and modelled time

The following table describes the expansion records, not a timetable promise. “Required” includes the modelled movement, reaction and door approach, plus the default scheduled-only margin. Values use the default 3.5 m/s pace without luggage, with weekday peak crowding where the path contains halls or platforms. The real journey may have a larger or smaller window than the observed planner allowance.

| Starting stop → station | Supported platforms | Recorded planner allowance | Modelled sprint | Required with scheduled margin | Evidence |
| --- | --- | ---: | ---: | ---: | --- |
| Nyon, centre ville → Nyon | 1 | 300 s | 147 s | 242 s | [^1][^2][^3] |
| Winterthur, Archstrasse/HB → Winterthur | 3 | 420 s | 160 s | 255 s | [^4][^5][^6] |
| Chur, Post I → Chur | 2 | 240 s | 136 s | 231 s | [^7][^8][^9] |
| Zürich, Sihlpost/HB → Zürich HB | 3 | 540 s | 228 s | 323 s | [^10][^11][^12] |
| Zürich Oerlikon, Bahnhof Nord → Zürich Oerlikon | 8 | 240 s | 134 s | 229 s | [^13][^14][^15] |
| Bern, Hirschengraben → Bern | 3/4, 5/6, 7/8, 9/10, 12/13 | 540 s | 289–316 s | 384–413 s | [^16][^17][^18] |
| Biel/Bienne, Place Guisan → Biel/Bienne | 2/3, 4/5, 6/7 | 420 s | 185–196 s | 280–291 s | [^19][^20][^21] |
| Genève, Lyon → Genève | 4/5 | 420 s | 277 s | 372 s | [^22][^23][^24] |
| Neuchâtel, gare nord → Neuchâtel | 6/7, 4/5, 2/3 | 240 s | 133–146 s | 228–241 s | [^25][^26][^27] |

The original **Zürich Central → HB** and **Basel IWB → SBB** records remain in the catalogue with their platform groups and existing limitations. Lausanne gare/m2 remains a draft. Broader coverage at a station does not imply coverage of every platform: missing, ambiguous or unpublished platforms cannot produce a GO. A new record with only one platform is deliberately narrow.

## Recorded earlier-arrival example

For **Winterthur Archstrasse/HB → Aarau on 15 September 2026 at 08:04**, the captured regular plan begins its seven-minute walk at 08:26, boards the 08:33 IC5, and arrives at **09:28**. The separately captured Winterthur candidates include the **08:09 S11 on platform 3**, reaching Zürich HB at 08:28, then the **08:38 RE37 from platform 16**, arriving in Aarau at **09:05**. The default route model needs approximately 254 seconds including the scheduled margin against a 300-second available window, giving a conditional **23-minute earlier arrival**. [^28][^29]

This is an actual timetable comparison, with no altered train times or platform numbers. It remains a modelled catch, not a completed run. The Zürich transfer and both departures must still operate as expected. A separate Winterthur → Bern probe at 08:28 correctly found no supported gain: its earlier services departed from uncovered platform 4. The distinction shows why valid stop matching cannot substitute for platform-specific evidence.

## Detailed route findings

Evidence is retained for unresolved approaches as well as promoted ones. “Needs check” can mean an unknown stair rise, uncertain access during works, or a model that does not leave enough margin. It does not mean that a usable shortcut has been established.

### Pilatusplatz to the level terminus concourse

**Research record; not enabled.** The terminus has a level approach, but current Pilatusstrasse pavement works prevent enabling the direct sprint yet.

Public stop 8573022; railway station 8505000; onward bus stop Luzern, Bahnhof 8508450. Recorded line 14 ride: 120 seconds; subsequent station transfer: 300 seconds. The 420-second total is a ride-on baseline, not a measured direct walk. VBL reports road and pavement barriers on Pilatusstrasse from 24 June until at latest mid-September 2026. On the research date, reopening cannot be assumed. OSM platform relations 5634803 (2/3) through 5634854 (14/15) corroborate surface level 0. This establishes platform level, not an open route through current works. [^30][^31][^32][^33]

Remaining checks: Verify the current signed public diversion around the Pilatusstrasse and Bahnhofplatz works. Measure each supported platform approach and nearest-door allowance after confirming pedestrian access.

### Metalli entrance to raised railway platforms

**Research record; not enabled.** The direct Metalli entrance is documented; vertical access and the actual sprint-only advantage still need measurement.

Public stop 8502781; railway station 8502204. The planner gives a 300-second direct walking transfer, measured from section timestamps because walk.duration is null. The SBB plan distinguishes town level from platform level. A street-distance estimate alone would omit the ascent. OSM relations 5655356 (1/2), 5655782 (3/4) and 5655278 (5/6) are tagged level 1. Nearby stair way 31818627 has 24 steps but no measured riser height; its count is not a complete route model. [^34][^35][^36][^37]

Remaining checks: Measure the level change and exact public approach for each platform island. Verify directional bus alight positions and whether ordinary walking already satisfies the proposed connection window.

### Klosestrasse towards Thun south access

**Research record; not enabled.** The southern approach is geographically relevant, but the usable platform access and vertical timing are not yet complete.

Public stop 8591913; railway station 8507100. The planner gives 360 seconds for the direct walking transfer; the duration is obtained from departure/arrival timestamps. Thun has separate approaches to surface track 1, island platforms 2–3 and 4–5, and terminal tracks 16/18. These cannot share an invented stair allowance. OSM relations 7078740 (1), 7078739 (2/3) and 16203972 (4/5) distinguish platform groups. Stair way 36936620 has 21 steps but supplies no rise; the full chosen access chain is not established. [^38][^39][^40][^41]

Remaining checks: Resolve the actual south entrance from each Klosestrasse bus direction and confirm pedestrian crossings. Measure ramps/stairs and identify which platform groups the southern route really helps.

### Kunsthaus along Bahnhofstrasse to Aarau

**Research record; not enabled.** A direct street approach is documented; island-platform access and whether this is merely planner slack need checking.

Public stop 8578642; railway station 8502113. The direct planner walking transfer is 420 seconds, measured from timestamps. The SBB plan separates surface track 1 from island platforms 2–3 and 4–5; southern tracks 11–13 belong to a different rail access and are not included. A short surface route may already be fast enough on foot. No sprint-only benefit is claimed without a window-specific comparison. OSM relations 5693368 (0/1), 5693370 (2/3), 5693371 (4/5) and way 33789949 (6) corroborate separate platforms. The 0 label is not enabled as a railway destination. [^42][^43][^44][^45]

Remaining checks: Measure the exact public platform-1 entrance and compare ordinary walking before promoting it. Survey stairs and passage lengths for tracks 2–6; do not reuse surface timing for these islands.

### Schützenmatt across the Aare to Olten station

**Research record; not enabled.** The bus detour is substantial; the complete pedestrian bridge and platform access could yield a useful route but need verification.

Public stop 8590432; railway station 8500218; bus arrival stop Olten, Bahnhof 8572352. One observed journey walks directly in 900 seconds. Another rides line 509 for 480 seconds and then budgets 300 seconds to the train: 780 seconds total. The official BOGG timetable also shows the detour via Solothurnerstrasse, Museen and Baslerstrasse before Bahnhof. Underpass entries and island-platform access are explicit in the SBB plan; this is not a single level crossing across all tracks. OSM relation 5686254 maps platform 1; 5686258 maps the unusual 4/7 island. Public stair way 382231401 connects levels -1 and 0 with 28 steps, without a measured riser height. [^46][^47][^48][^49]

Remaining checks: Verify the optimal public Aare crossing and platform-1 access without entering tracks or private ground. Measure vertical access and passage distances separately for both underpasses and all proposed platform groups.

### Piazza Mesolcina to the northern station access

**Research record; not enabled.** The bus goes beyond a potentially useful northern approach; public access and the platform-1 level change must be resolved.

Public stop 8575178; railway station 8505213; bus arrival stop Bellinzona, Stazione 8579936. Line 3 takes 180 seconds to Stazione, followed by a 240-second transfer to the train: 420 seconds total. The station plan shows both footbridges and an underpass. A generic distance to the station centroid would miss these choices. OSM bus stop node 984707982 is tagged elevation 226 m, while station bus platform way 1074960304 is tagged 238 m. These independently mapped values suggest a material climb; their difference is not a measured stair rise. Binario 1 is mapped by way 217518077 at station level 0; island relations 10286411 and 10286412 cover 2/3 and 4/6. Station-relative level 0 does not establish level access from the lower street. A future alight-early record must match the actual feeder passList and bus arrival stop 8579936 before the continuous station walk. The captured 420 seconds cannot be substituted for an unobserved direct planner walk. [^50][^51][^52]

Remaining checks: Confirm whether the northern approach to Binario 1 is continuously public and level, and map any ramp or stairs. Measure island-platform vertical access; do not invent a stair height from the plan drawing.

### Piazza Castello to the surface terminus platforms

**Research record; not enabled.** The surface-platform endpoint is mapped, but the complete pedestrian chain from Piazza Castello is not verified.

Public stop 8578883; railway station 8505400; bus arrival stop Locarno, Stazione 8578881. Observed line 4 rides for 300 seconds, then budgets 180 seconds for the station transfer: 480 seconds total. The official June 2026 plan distinguishes the surface terminus from the underground FART tracks; only surface tracks 1–3 are under consideration. Public footway 359235347 shares node 6048976108 (46.1725453, 8.8010842) with surface platform 2/3 way 238368698. The approach crosses Via Stazione on mapped zebra footway 1214515049. This verifies the endpoint, not the full approach from Piazza Castello. A no-stairs graph probe through Via Trevani and Via alla Ramogna measures 856.8 m between mapped nodes, excluding the alight-point approach and train-door allowance. It includes road centrelines and a Via Trevani segment without sidewalk tags, so it is not accepted as a complete public-pavement route. The shorter town-centre route through Piazza Grande has unresolved pedestrian-area connections. No guessed 700 m route or crossing count is activated. Underground FART platform way 279457136 (level -2, tracks 11/21) is excluded. The observed baseline requires feeder passList matching and rideOn stop 8578881. Starting the search at Piazza Castello alone does not establish a continuous leading walk or an active matcher case. [^53][^54][^55][^56]

Remaining checks: Trace the public route from the correct Piazza Castello bus-side stop through Piazza Grande to Via alla Ramogna, resolving pedestrian-area connectivity and any stairs. Count actual pavement crossings and measure the full approach; the road-centreline graph is only a topology probe. Confirm conservative train-door distance for each surface platform and establish an actual catchable earlier train; exclude underground tracks.

### Piazza Besso to Lugano station access

**Research record; not enabled.** The Besso-side connection is directly relevant, but levels and CoBe construction prevent a generic sprint estimate.

Public stop 8575286; railway station 8505300. The direct planner walking transfer budgets 420 seconds, measured from section timestamps. The station plan marks multiple underground levels, separate FLP access, and the CoBe construction area. These are material route constraints. OSM maps surface platform 4 as way 368958158, platform 1 as way 619424793 and island 2/3 as relation 8590259. Stair way 619436183 has 43 steps between levels -1 and 0 but no riser measurement. [^57][^58][^59][^60]

Remaining checks: Verify current CoBe barriers and the open signed route from the bus stop. Measure the actual Besso entrance level and platform-specific stairs, escalators or ramps; establish whether track 4 has a valid direct access.

### Nyon, centre ville → Nyon, Voie 1 via Rue de la Gare

**Enabled with limited platform coverage.** A verified public surface path to Voie 1 can fit inside the observed five-minute planner walk for some departure windows. Earlier arrival must still be established from the actual timetable.

All four real Geneva-bound connections use Voie 1 after a 300-second leading walk. Selected step-free graph trace is 201.6 m; the model rounds to 225 m and adds two crossing delays plus a 150 m door allowance. The graph contains public footways, a pedestrian street and Rue de la Gare living street with both sidewalks; no railway crossing or private gate is used. A shorter 154.8 m graph route used stairs without measured rise and was excluded. The City describes a future Viollier underpass as a planning project; it is not included. [^1][^2][^3][^61][^62][^63]

Remaining checks: Time the public pavement route, including the marked crossings, on foot. Confirm the alighting kerb and current signage at Rue de la Gare. Check train stopping positions: the 150 m door approach is a modelling allowance, not a measured train formation.

### North entrance from Museumstrasse/HB

**Research record; not enabled.** Stellwerk 2 construction affects this approach; the paid bicycle station is not an unrestricted public shortcut.

Public timetable stop ID 8588552; railway station ID 8506000. The recorded leading walk budgets 300 seconds, measured from timestamps because walk.duration is null. The SBB plan dated 12/2025 marks BahnFussweg/Stellwerk 2 construction through expected spring 2028. Current project information also identifies temporary traffic changes at Museumstrasse, Merkurstrasse and Bahnhofplatz. The mapped surface chain reaches Gleis 1 in 108.9 m, but this is not treated as current verified public access through the works. Mapped routes to island platforms descend 34 steps on way 59087119 and ascend 34 or 37 steps. The construction access must be settled before modelling these routes. The city describes controlled access to its bicycle parking facilities; a bicycle-station passage is not assumed to be a free public shortcut. [^4][^64][^6][^65][^66][^67]

Remaining checks: Confirm the exact current Museumstrasse/HB alighting kerb and a continuous public route outside the Stellwerk 2 work zone. Check whether the mapped Gleis 1 entrance is open and where trains stop; photograph current diversion signs. For any island-platform extension, measure stair rise and passage lengths and confirm that no controlled bicycle-parking access is used.

### Southern entrance from Archstrasse/HB

**Enabled with limited platform coverage.** Mapped public access to Gleis 3; only this platform is enabled, with conservative distance and door-position allowances.

Public timetable stop ID 8594298; railway station ID 8506000. The recorded leading walk budgets 420 seconds, measured from timestamps because walk.duration is null. Mapped footpath chain: 178.7 m; model path: 200 m; landing node 5349403684. Only Gleis 3 is promoted. Other groups lack a complete verified route in this record. One unmodified captured case produces a modelled 23-minute gain: 2026-09-15 at 08:04 from Archstrasse to Aarau, S11 08:09 Gleis 3 and RE37 from Zürich 08:38 arrive 09:05, against the full planner baseline arrival 09:28. Default scheduled requirement is 254.3 s with 300 s available. This is a specific timetable/model result, not field verification. [^4][^5][^6][^28][^29]

Remaining checks: Confirm the exact alighting kerb and the 28 m approach from the timetable stop point to the mapped pavement. Time the full route on foot, including pedestrian crossings, before treating the estimate as calibrated. Verify current temporary access signs and the published train platform.

### Station approach from St.Leonhard

**Research record; not enabled.** The SBB plan distinguishes city-level access from the west/east underpasses; stair geometry has not yet been verified.

Public timetable stop ID 8574223; railway station ID 8506302. The recorded leading walk budgets 360 seconds, measured from timestamps because walk.duration is null. The SBB plan dated 06/2026 distinguishes mainline platforms 1–8, Appenzeller Bahnen platforms 11/12, and the west/east public underpasses. The mapped mainline Gleis 1 chain is approximately 332 m and contains stairs on ways 378097959 and 377429471. Neither stair way supplies a step count or rise; horizontal map length is not a substitute for vertical rise. Mapped surface approaches to Appenzeller Bahnen platforms 11/12 are approximately 225–228 m. Their timetable station/platform applicability has not been established by the captured Bern-bound mainline connection, so they are not promoted. [^68][^69][^70][^71][^72]

Remaining checks: Measure the two level changes on the selected mainline approach and verify the current public entrance. Confirm exact Appenzeller Bahnen timetable station IDs and platform numbers before treating the separate surface platforms as an alternative. Time the transfer with luggage and check train stopping positions.

### Northern access from Bahnhof Nord

**Research record; not enabled.** The mapped stair route to Gleis 1 exceeds the recorded three-minute transfer budget under the default model; shorter apparent routes use lifts.

Public timetable stop ID 8588887; railway station ID 8503424. The recorded leading walk budgets 180 seconds, measured from timestamps because walk.duration is null. The SBB plan dated 05/2026 identifies the public Löwengässchen and Süd underpasses and northern Mühlental/Breite access. A public non-lift path to Gleis 1 measures 159.5 m on the map. Way 191872658 records 27 steps at 0.13 m per step (3.51 m rise). Ramp way 291491757 records a 37.2 m length, longer than its coarse mapped polyline; the longer tagged length must govern a model. A conservative probe with 25 m street, 40 m ramp, 110 m passage, the mapped 3.51 m ascent and 140 m door allowance requires about 234 s scheduled or 204 s live at the default profile. Both exceed the observed 180 s walk budget; this is not a proven earlier-train opportunity. The apparently shorter 116 m Gleis 6 route changes levels through lift node 3809734505. Similar shortest graph routes to 2/3 and 4/5 also contain lifts. These were rejected rather than modelled as flat footways. [^73][^74][^75][^76][^77][^78]

Remaining checks: Check actual train stopping positions and whether a complete, timed Gleis 1 transfer can usefully beat the planner for an actual journey. Verify any alternative stair access to island platforms; do not substitute lift travel for an unmeasured stair route. Check current ramp access and signs at the northern entrance.

### Post I to the street-level Arosa platforms

**Enabled with limited platform coverage.** Mapped public access to Gleis 2; only this platform is enabled, with conservative distance and door-position allowances.

Public timetable stop ID 8571313; railway station ID 8509000. The recorded leading walk budgets 240 seconds, measured from timestamps because walk.duration is null. Mapped footpath chain: 145.2 m; model path: 165 m; landing node 14089235014. Only Gleis 2 is promoted. Other groups lack a complete verified route in this record. [^7][^8][^9]

Remaining checks: Check where Arosa trains stop on the long Gleis 2 platform; the model reserves 200 m beyond the mapped access point. Time the full route on foot, including pedestrian crossings, before treating the estimate as calibrated. Verify current temporary access signs and the published train platform.

### Sihlpost approach to Zürich HB

**Enabled with limited platform coverage.** Mapped public access to Gleis 3; only this platform is enabled, with conservative distance and door-position allowances.

Public timetable stop ID 8591367; railway station ID 8503000. The recorded leading walk budgets 540 seconds, measured from timestamps because walk.duration is null. Mapped footpath chain: 335.5 m; model path: 370 m; landing node 356305557. Only Gleis 3 is promoted. Other groups lack a complete verified route in this record. [^10][^11][^12]

Remaining checks: Check the exact stopping position on Gleis 3 and access through Europaplatz during any temporary works. Time the full route on foot, including pedestrian crossings, before treating the estimate as calibrated. Verify current temporary access signs and the published train platform.

### Max-Frisch-Platz entrance from Bahnhof Nord

**Enabled with limited platform coverage.** Mapped public access to Gleis 8; only this platform is enabled, with conservative distance and door-position allowances.

Public timetable stop ID 8591062; railway station ID 8503006. The recorded leading walk budgets 240 seconds, measured from timestamps because walk.duration is null. Mapped footpath chain: 171.8 m; model path: 190 m; landing node 9651573109. Only Gleis 8 is promoted. Other groups lack a complete verified route in this record. [^13][^14][^15]

Remaining checks: Check bus stopping kerbs and the precise train stopping position on Gleis 8. Time the full route on foot, including pedestrian crossings, before treating the estimate as calibrated. Verify current temporary access signs and the published train platform.

### Bern: Hirschengraben → Welle

**Enabled with limited platform coverage.** Public mapped access can fit within the observed 9-minute transfer budget for some trips. Only the listed platform groups are enabled; an earlier arrival still requires a real candidate train.

Real stop 8579896 → railway station 8507000; raw response west-bern-hirschengraben-connections.json. Continuous public footway geometry, mapped stair counts/directions and the final platform landing were checked separately. No train gain is inferred from the transfer budget alone. Unsupported platforms remain unavailable to the planner. Distances cover the longest mapped boarding-quay approach. Stair rise and door location are explicit model assumptions with medium confidence. [^16][^79][^17][^80][^18][^81][^82][^83][^84][^85][^86]

Remaining checks: Walk each supported boarding-quay approach and confirm current signs, crossings and public entrance availability. Measure actual stair rise; step counts are mapped, while 0.18 m per riser is an explicit conservative timing assumption. Measure door approach by train length and stopping sector; current typical/maximum 120/350 m values are model allowances. Time a representative peak-period transfer; short-notice closures and pedestrian queues are not available from the connection API. Recheck Welle crowding and construction signs; tracks 1/2 and the future Bubenberg passage are deliberately unsupported.

### Biel/Bienne: Place Guisan → station underpass

**Enabled with limited platform coverage.** Public mapped access can fit within the observed 7-minute transfer budget for some trips. Only the listed platform groups are enabled; an earlier arrival still requires a real candidate train.

Real stop 8587619 → railway station 8504300; raw response west-biel-place-guisan-connections.json. Continuous public footway geometry, mapped stair counts/directions and the final platform landing were checked separately. No train gain is inferred from the transfer budget alone. Unsupported platforms remain unavailable to the planner. Distances cover the longest mapped boarding-quay approach. Stair rise and door location are explicit model assumptions with medium confidence. [^19][^87][^20][^88][^21][^89][^90]

Remaining checks: Walk each supported boarding-quay approach and confirm current signs, crossings and public entrance availability. Measure actual stair rise; step counts are mapped, while 0.18 m per riser is an explicit conservative timing assumption. Measure door approach by train length and stopping sector; current typical/maximum 100/300 m values are model allowances. Time a representative peak-period transfer; short-notice closures and pedestrian queues are not available from the connection API.

### Genève: Lyon → Montbrillant

**Enabled with limited platform coverage.** Public mapped access can fit within the observed 7-minute transfer budget for some trips. Only the listed platform groups are enabled; an earlier arrival still requires a real candidate train.

Real stop 8592850 → railway station 8501008; raw response west-geneve-lyon-connections.json. Continuous public footway geometry, mapped stair counts/directions and the final platform landing were checked separately. No train gain is inferred from the transfer budget alone. Unsupported platforms remain unavailable to the planner. Distances cover the longest mapped boarding-quay approach. Stair rise and door location are explicit model assumptions with medium confidence. [^22][^91][^23][^92][^24]

Remaining checks: Walk each supported boarding-quay approach and confirm current signs, crossings and public entrance availability. Measure actual stair rise; step counts are mapped, while 0.18 m per riser is an explicit conservative timing assumption. Measure door approach by train length and stopping sector; current typical/maximum 120/350 m values are model allowances. Time a representative peak-period transfer; short-notice closures and pedestrian queues are not available from the connection API. Only domestic tracks 4/5 are covered. No route to the French sector, tracks 1–3, or future underground platforms is inferred.

### Neuchâtel: gare nord → station underpass

**Enabled with limited platform coverage.** Public mapped access can fit within the observed 4-minute transfer budget for some trips. Only the listed platform groups are enabled; an earlier arrival still requires a real candidate train.

Real stop 8579625 → railway station 8504221; raw response west-neuchatel-gare-nord-connections.json. Continuous public footway geometry, mapped stair counts/directions and the final platform landing were checked separately. No train gain is inferred from the transfer budget alone. Unsupported platforms remain unavailable to the planner. Distances cover the longest mapped boarding-quay approach. Stair rise and door location are explicit model assumptions with medium confidence. This is a small timing window, especially with scheduled-only information; a bag, slower pace or larger margin can remove every offer. Fête des Vendanges dates 25–27 September 2026 are excluded. [^25][^93][^26][^94][^27][^95][^96][^97]

Remaining checks: Walk each supported boarding-quay approach and confirm current signs, crossings and public entrance availability. Measure actual stair rise; step counts are mapped, while 0.18 m per riser is an explicit conservative timing assumption. Measure door approach by train length and stopping sector; current typical/maximum 100/300 m values are model allowances. Time a representative peak-period transfer; short-notice closures and pedestrian queues are not available from the connection API.

### Hirschengraben → planned Bubenberg station access

**Research record; not enabled.** The future passage would be relevant to this stop, but it is not a current public shortcut. It is excluded from the planner.

SBB distinguishes the Bubenberg building from the new underground station access. The project update moves the new public passage/access opening to 2031; a building or retail opening does not establish a through route. [^86][^16]

Remaining checks: Confirm commissioned opening, complete public geometry, platform mapping and walking budget after construction.

### Lyon → Cornavin main hall and platforms 1–3

**Research record; not enabled.** Lyon is a real nearby stop and public station entrances are documented, but the complete vertical route to platforms 1–3 has not been measured. These platforms are excluded.

The captured 08:08 RE33 uses Voie 2 and the 08:24 IR95 uses Voie 4, demonstrating why a station-level blanket route is insufficient. OSM maps several stairways to platforms 1–3 without usable step counts; no rise or shortcut through another platform is invented. [^22][^91][^23]

Remaining checks: Measure each complete public stair/ramp chain to Voies 1–3, including entrance hours and door approach.

### Georgette → east-side station access

**Research record; not enabled.** Georgette is close enough to investigate, but the station forecourt construction changed pedestrian routes in July 2026. No measured route is enabled.

Real stop ID 8592051. The captured baseline rides a bus five minutes to Lausanne gare, then has a 300-second station walk. CFF says the forecourt worksite moved from south to north on 27 July 2026 and pedestrian routes were adapted. A pre-work map cannot establish the current path. [^98][^99][^100]

Remaining checks: Walk the current signed entrance route, record temporary fences, count stairs, and identify the public platform landing. Obtain a direct walking transfer budget separately; 300 seconds is the post-bus walk, not a Georgette walking measurement.

### m2 gare → current railway passage access

**Research record; not enabled.** The existing draft m2 record needs current access verification during station works; this research does not promote or alter that seed.

The existing seed uses stop ID 8592050 and remains draft; its quoted stair dimensions are not validated by this investigation. Updated railway forecourt works make old assumptions about a direct passage insufficient. This is a field-check task, not extra active coverage. [^99][^101]

Remaining checks: Capture the current m2 connection geometry and stop-level coordinates, verify each passage stays open, and independently measure each platform access.

### Richemond → western railway underpass

**No useful shortcut established.** The public access is real and the station works are documented, but the API already budgets only three minutes. The measured 178–219 m approach and platform access leave too little default margin for a useful sprint offer.

Real stop ID 8511792; railway station 8504100. The first recorded walk is 08:00–08:03 on 14 September 2026. Mapped ramps to platforms 4/5 use ways 1285977430 and 1230667687; platforms 2/3 use 1230667693. The approach varies by boarding side. The Boulevard de Pérolles/gare comparison (8510983) also receives a 180-second walk. No larger planner penalty is assumed. [^102][^103][^104][^105][^106]

Remaining checks: Measure complete ramp slopes and boarding-side paths before revisiting usefulness. Test a real time window that improves final arrival with the full margin; proximity alone is insufficient.

## Interpretation of transfer budgets

A planner allowance must come from a connection that continues on a train. A walking-only query to a station coordinate measures something different: it can end at the station reference point instead of representing the transfer to a train. Leading walking sections can have a null duration field, so the recorded departure and arrival timestamps establish their actual allowance. For bus-fed approaches, bus travel and the subsequent transfer must be distinguished from a continuous walk. [^107]

The enabled data contain both distinctive side-access routes and tighter ordinary transfer opportunities. Several of the new records have only a small timing window after the scheduled margin. The catalogue therefore does not claim that every listed approach meets the stricter discovery target of gaining two minutes and requiring a sprint. That classification requires the complete pedestrian path and a particular timetable window. The runtime comparison remains conditional on the searched trip.

The sprint estimates include more than path length divided by running speed. They contain alighting and reaction time, movement-type speed factors, crossing waits, stairs where supported, a platform-to-door allowance, and a minimum margin. Platform stopping positions and crowds can dominate the estimate. A mapped stair count supports an estimate of vertical movement only when its assumed riser height is stated; it is not a measured height. The western reports preserve that distinction.

The default required time adds 45 seconds of personal margin, 20 seconds for door closure and 30 seconds when timing is scheduled only, or a larger proportional margin if applicable. Live information can remove the scheduled-only component, but a stationboard update does not verify the pedestrian route or onward connecting services. No guaranteed success rate is established by this research.

## Wider timetable screen

These observations extend the search beyond the detailed regional routes. Distances below are **straight-line screening distances**, not walking paths. They must not be inserted into the sprint model. “Access” is the sum of the observed leading travel sections, and can include a bus; a missing value means the captured query did not establish a suitable transfer through that station.

| Railway station | Nearby stop | Direct distance | Observed access | Access type | Source |
| --- | --- | ---: | ---: | --- | --- |
| Nyon | Nyon, centre ville | 150 m | 300 s | Walking transfer | [^108] |
| Nyon | Nyon, Rte St-Cergue - Canal | 231 m | 360 s | Walking transfer | [^109] |
| Morges | Morges, gare | 88 m | Not established | — | [^110] |
| Morges | Morges, Charpentiers | 244 m | 300 s | Includes vehicle travel | [^111] |
| Renens VD | Renens VD, gare | 71 m | Not established | — | [^112] |
| Renens VD | Renens VD, gare/Epenex | 90 m | 240 s | Walking transfer | [^113] |
| Baden | Baden, Bahnhof West | 79 m | 240 s | Walking transfer | [^114] |
| Baden | Baden, Postautostation | 134 m | 300 s | Walking transfer | [^115] |
| Brugg AG | Brugg AG, Bahnhof/Campus | 76 m | 240 s | Walking transfer | [^116] |
| Brugg AG | Brugg AG, Bahnhof/Zentrum | 87 m | 240 s | Walking transfer | [^117] |
| Rapperswil SG | Rapperswil SG, Bahnhof Süd | 111 m | 240 s | Walking transfer | [^118] |
| Rapperswil SG | Rapperswil SG (See) | 257 m | 600 s | Walking transfer | [^119] |
| Wil SG | Wil SG, Bahnhof | 52 m | Not established | — | [^120] |
| Wil SG | Wil SG, Bahnhof Süd | 132 m | 180 s | Walking transfer | [^121] |
| Solothurn | Solothurn, Hauptbahnhof | 48 m | 240 s | Walking transfer | [^122] |
| Solothurn | Solothurn, Zuchwilerstr./Bahnhof | 117 m | 240 s | Walking transfer | [^123] |
| Sion | Sion, poste/gare | 62 m | 240 s | Walking transfer | [^124] |
| Sion | Sion, Gare Bus Sédunois | 79 m | 240 s | Walking transfer | [^125] |
| Yverdon-les-Bains | Yverdon-les-Bains, gare | 67 m | Not established | — | [^126] |
| Yverdon-les-Bains | Yverdon, Théâtre Benno Besson | 281 m | 420 s | Includes vehicle travel | [^127] |
| Uster | Uster, Bahnhof | 100 m | Not established | — | [^128] |
| Uster | Uster, Stadthaus | 277 m | 360 s | Includes vehicle travel | [^129] |
| Wetzikon ZH | Wetzikon ZH, Bahnhof | 76 m | Not established | — | [^130] |
| Wetzikon ZH | Wetzikon ZH, Bahnhof Süd | 92 m | 240 s | Walking transfer | [^131] |
| Bulle | Bulle, gare routière | 96 m | 180 s | Walking transfer | [^132] |
| Bulle | Bulle, Place de la Gare | 107 m | 180 s | Walking transfer | [^133] |
| Burgdorf | Burgdorf, Bahnhof | 86 m | Not established | — | [^134] |
| Burgdorf | Burgdorf, Poststrasse | 110 m | 240 s | Walking transfer | [^135] |
| Visp | Visp, Bahnhof Süd | 50 m | 240 s | Walking transfer | [^136] |
| Visp | Visp, Bahnhof Nord | 105 m | 240 s | Walking transfer | [^137] |
| Brig | Brig Bahnhofplatz | 140 m | 420 s | Walking transfer | [^138] |
| Brig | Brig, Viktoriastrasse | 147 m | 420 s | Walking transfer | [^139] |
| Basel Bad Bf | Basel, Badischer Bahnhof | 75 m | Not established | — | [^140] |
| Basel Bad Bf | Basel, Surinam | 290 m | 480 s | Includes vehicle travel | [^141] |
| Zürich Altstetten | Zürich Altstetten, Bahnhof | 60 m | Not established | — | [^142] |
| Zürich Altstetten | Zürich Altstetten, Bahnhof Nord | 96 m | 180 s | Walking transfer | [^143] |
| Zürich Stadelhofen | Zürich, Opernhaus | 146 m | 180 s | Walking transfer | [^144] |
| Zürich Stadelhofen | Zürich, Bellevue | 259 m | 420 s | Walking transfer | [^145] |

The screen is deliberately bounded to the two closest qualifying stops returned for each station. Consequently, an absent stop or city is not evidence that it has no shortcuts. The next useful expansion is to trace the public platform access of leads with a substantial planner allowance, then inspect current construction and actual train platforms. Repeating distance-only scans cannot resolve those questions.

## Detailed evidence files

The regional reports provide the full path chains, rejected alternatives, source editions, and modelling assumptions:

- [Northeast: Winterthur, St. Gallen, Schaffhausen, Chur and Zürich](expansion/northeast.md).
- [West: Bern, Biel, Genève, Neuchâtel, Fribourg and Lausanne](expansion/west.md).
- [Central and south: Luzern, Zug, Thun, Aarau, Olten, Bellinzona, Locarno and Lugano](expansion/central-south.md).
- [Nyon](expansion/lake-geneva.md).

The [source inventory](sources.csv) contains the exact URLs and checked dates for all regional records and broad-screen observations. Captured timetable responses and map extracts are retained under data/research/raw/; regional decisions are under data/research/regions/. These are research records, separate from the app’s trip flow.

## Sources

[^1]: Actual Geneva-bound connections. [Original source](https://transport.opendata.ch/v1/connections?from=8593874&to=8501008&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^2]: OSM full station extract. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=6.2305,46.3815,6.2395,46.3880). Checked 2026-09-13.
[^3]: Mapped centre ville bus platform. [Original source](https://www.openstreetmap.org/node/1837005634). Checked 2026-09-13.
[^4]: SBB station and area plan. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-winterthur-a4.pdf). Checked 2026-09-13.
[^5]: Recorded planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8594298&to=8507000&date=2026-09-15&time=08%3A00&limit=3). Checked 2026-09-13.
[^6]: OpenStreetMap station geometry extract. [Original source](https://www.openstreetmap.org/api/0.6/map.json?bbox=8.720,47.497,8.727,47.503). Checked 2026-09-13.
[^7]: SBB station and area plan. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-chur-a4.pdf). Checked 2026-09-13.
[^8]: Recorded planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8571313&to=Arosa&date=2026-09-15&time=08%3A00&limit=3). Checked 2026-09-13.
[^9]: OpenStreetMap station geometry extract. [Original source](https://www.openstreetmap.org/api/0.6/map.json?bbox=9.526,46.851,9.532,46.855). Checked 2026-09-13.
[^10]: SBB station and area plan. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-zuerich-hb-a4.pdf). Checked 2026-09-13.
[^11]: Recorded planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8591367&to=8507000&date=2026-09-15&time=08%3A00&limit=3). Checked 2026-09-13.
[^12]: OpenStreetMap station geometry extract. [Original source](https://www.openstreetmap.org/api/0.6/map.json?bbox=8.533,47.3755,8.542,47.380). Checked 2026-09-13.
[^13]: SBB station and area plan. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-zuerich-oerlikon-a4.pdf). Checked 2026-09-13.
[^14]: Recorded planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8591062&to=8507000&date=2026-09-15&time=08%3A00&limit=3). Checked 2026-09-13.
[^15]: OpenStreetMap station geometry extract. [Original source](https://www.openstreetmap.org/api/0.6/map.json?bbox=8.541,47.409,8.547,47.414). Checked 2026-09-13.
[^16]: SBB station plan. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-bern-a4.pdf). Checked 2026-09-13.
[^17]: Recorded planner response. [Original source](https://transport.opendata.ch/v1/connections?from=8579896&to=8503000&date=2026-09-14&time=08%3A00&limit=3). Checked 2026-09-13.
[^18]: Gleis 3/4 platform polygon. [Original source](https://www.openstreetmap.org/relation/10228959). Checked 2026-09-13.
[^19]: SBB station plan. [Original source](https://www.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-biel-bienne-a4.pdf.sbbdownload.pdf). Checked 2026-09-13.
[^20]: Recorded planner response. [Original source](https://transport.opendata.ch/v1/connections?from=8587619&to=8503000&date=2026-09-14&time=08%3A00&limit=3). Checked 2026-09-13.
[^21]: Gleis 2/3 platform polygon. [Original source](https://www.openstreetmap.org/relation/10216211). Checked 2026-09-13.
[^22]: SBB station plan. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-geneve-a4.pdf). Checked 2026-09-13.
[^23]: Recorded planner response. [Original source](https://transport.opendata.ch/v1/connections?from=8592850&to=8501120&date=2026-09-14&time=08%3A00&limit=3). Checked 2026-09-13.
[^24]: Voies 4/5 platform polygon. [Original source](https://www.openstreetmap.org/relation/4013259). Checked 2026-09-13.
[^25]: SBB station plan. [Original source](https://cdnsource.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-neuchatel-a4.pdf.sbbdownload.pdf). Checked 2026-09-13.
[^26]: Recorded planner response. [Original source](https://transport.opendata.ch/v1/connections?from=8579625&to=8501120&date=2026-09-14&time=08%3A00&limit=3). Checked 2026-09-13.
[^27]: Voies 6/7 platform polygon. [Original source](https://www.openstreetmap.org/relation/8209994). Checked 2026-09-13.
[^28]: Swiss Transport API: Archstrasse/HB → Aarau, 15 September 2026 at 08:04. [Original source](https://transport.opendata.ch/v1/connections?from=8594298&to=Aarau&date=2026-09-15&time=08%3A04&limit=4). Checked 2026-09-13.
[^29]: Swiss Transport API: Winterthur → Aarau, 15 September 2026 at 08:06. [Original source](https://transport.opendata.ch/v1/connections?from=8506000&to=Aarau&date=2026-09-15&time=08%3A06&limit=10). Checked 2026-09-13.
[^30]: SBB official station plan, edition 05/2026. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-luzern-a4.pdf). Checked 2026-09-13.
[^31]: Recorded 14 September 2026 journey and planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8573022&to=Z%C3%BCrich%20HB&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^32]: OpenStreetMap public street and station geometry snapshot. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=8.3030,47.0470,8.3110,47.0510). Checked 2026-09-13.
[^33]: VBL construction notice, including Pilatusstrasse pavement closure. [Original source](https://www.vbl.ch/ueber-vbl/aktuelles/detail/bau-der-neuen-durchmesserperrons-am-bahnhof-luzern/). Checked 2026-09-13.
[^34]: SBB official station plan, edition 03/2026. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-zug-a4.pdf). Checked 2026-09-13.
[^35]: Recorded 14 September 2026 journey and planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8502781&to=Z%C3%BCrich%20HB&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^36]: OpenStreetMap public street and station geometry snapshot. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=8.5140,47.1723,8.5175,47.1750). Checked 2026-09-13.
[^37]: ZVB official Metalli/Bahnhof departure page. [Original source](https://www.zvb.ch/fahrplan-nach-haltestelle/ab-2781/?cHash=430eae186ecf2ed2716a09668a33e133). Checked 2026-09-13.
[^38]: SBB official station plan, edition 12/2025. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-thun-a4.pdf). Checked 2026-09-13.
[^39]: Recorded 14 September 2026 journey and planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8591913&to=Z%C3%BCrich%20HB&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^40]: OpenStreetMap public street and station geometry snapshot. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=7.6270,46.7528,7.6305,46.7564). Checked 2026-09-13.
[^41]: STI official network and station access plans. [Original source](https://www.stibus.ch/fahrplaene/busnetz-und-situationsplan.php). Checked 2026-09-13.
[^42]: SBB official station plan, edition 01/2025. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-aarau-a4.pdf). Checked 2026-09-13.
[^43]: Recorded 14 September 2026 journey and planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8578642&to=Z%C3%BCrich%20HB&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^44]: OpenStreetMap public street and station geometry snapshot. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=8.0460,47.3900,8.0520,47.3924). Checked 2026-09-13.
[^45]: Bus Aarau official line 5 stop timetable. [Original source](https://www.busaarau.ch/fileadmin/user_upload/Fahrplaene/Linie_5/5_Aarau_Bahnhof_-_C_Hin.pdf). Checked 2026-09-13.
[^46]: SBB official station plan, edition 02/2026. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-olten-a4.pdf). Checked 2026-09-13.
[^47]: Recorded 14 September 2026 journey and planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8590432&to=Z%C3%BCrich%20HB&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^48]: OpenStreetMap public street and station geometry snapshot. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=7.9008,47.3475,7.9085,47.3526). Checked 2026-09-13.
[^49]: BOGG line 509 Schützenmatt timetable, valid from 14 December 2025. [Original source](https://www.bogg.ch/cust/files/488/5.0%20509_520OLSC3_1_Hin.pdf). Checked 2026-09-13.
[^50]: SBB official station plan, edition 02/2026. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-bellinzona-a4.pdf). Checked 2026-09-13.
[^51]: Recorded 14 September 2026 journey and planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8575178&to=Z%C3%BCrich%20HB&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^52]: OpenStreetMap public street and station geometry snapshot. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=9.0248,46.1945,9.0305,46.1988). Checked 2026-09-13.
[^53]: SBB official station plan, edition 06/2026. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-locarno-a4.pdf). Checked 2026-09-13.
[^54]: Recorded 14 September 2026 journey and planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8578883&to=Z%C3%BCrich%20HB&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^55]: OpenStreetMap public street and station geometry snapshot. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=8.7935,46.1670,8.8030,46.1740). Checked 2026-09-13.
[^56]: FART official line-network overview. [Original source](https://fartiamo.ch/de/home-2/). Checked 2026-09-13.
[^57]: SBB official station plan, edition 12/2025. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-lugano-a4.pdf). Checked 2026-09-13.
[^58]: Recorded 14 September 2026 journey and planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8575286&to=Z%C3%BCrich%20HB&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^59]: OpenStreetMap public street and station geometry snapshot. [Original source](https://api.openstreetmap.org/api/0.6/map.json?bbox=8.9440,46.0048,8.9478,46.0068). Checked 2026-09-13.
[^60]: TPL line 3 Stazione Piazza Besso timetable, valid from 14 December 2025. [Original source](https://www.tplsa.ch/repository/pdf-2026/403_A_LUGPB2.pdf). Checked 2026-09-13.
[^61]: Voie 1 platform polygon. [Original source](https://www.openstreetmap.org/way/210675017). Checked 2026-09-13.
[^62]: Connected public path landing. [Original source](https://www.openstreetmap.org/node/5149171869). Checked 2026-09-13.
[^63]: City station project and future works. [Original source](https://www.nyon.ch/nyon-officiel/grands-projets/gare-de-nyon/). Checked 2026-09-13.
[^64]: Recorded planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8588552&to=8507000&date=2026-09-15&time=08%3A00&limit=3). Checked 2026-09-13.
[^65]: City temporary traffic order for Stellwerk II. [Original source](https://stadt.winterthur.ch/gemeinde/verwaltung/bau/tiefbauamt/oeffentliche-planauflage-und-verkehrsanordnungen/verkehrsanordnungen/baustellensignalisation-stellwerk-ii-bahnhofplatz-bahnfussweg-merkur-und-museumstrasse). Checked 2026-09-13.
[^66]: Stellwerk 2 current construction information. [Original source](https://stellwerk2.ch/baustelleninformation/). Checked 2026-09-13.
[^67]: City bicycle station access information. [Original source](https://stadt.winterthur.ch/themen/leben-in-winterthur/verkehr-mobilitaet/velo/velo-rund-um-den-bahnhof/velostationen). Checked 2026-09-13.
[^68]: SBB station and area plan. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-st-gallen-a4.pdf). Checked 2026-09-13.
[^69]: Recorded planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8574223&to=8507000&date=2026-09-15&time=08%3A00&limit=3). Checked 2026-09-13.
[^70]: OpenStreetMap station geometry extract. [Original source](https://www.openstreetmap.org/api/0.6/map.json?bbox=9.366,47.420,9.373,47.425). Checked 2026-09-13.
[^71]: Mapped access stairs without height data. [Original source](https://www.openstreetmap.org/way/378097959). Checked 2026-09-13.
[^72]: Mapped Gleis 1 stairs without height data. [Original source](https://www.openstreetmap.org/way/377429471). Checked 2026-09-13.
[^73]: SBB station and area plan. [Original source](https://cdnsource.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-schaffhausen-a4.pdf.sbbdownload.pdf). Checked 2026-09-13.
[^74]: Recorded planner transfer budget. [Original source](https://transport.opendata.ch/v1/connections?from=8588887&to=8507000&date=2026-09-15&time=08%3A00&limit=3). Checked 2026-09-13.
[^75]: OpenStreetMap station geometry extract. [Original source](https://www.openstreetmap.org/api/0.6/map.json?bbox=8.629,47.696,8.635,47.701). Checked 2026-09-13.
[^76]: Gleis 1 stairs with mapped count and riser height. [Original source](https://www.openstreetmap.org/way/191872658). Checked 2026-09-13.
[^77]: Northern ramp with surveyed length tag. [Original source](https://www.openstreetmap.org/way/291491757). Checked 2026-09-13.
[^78]: Lift on rejected shortest Gleis 6 path. [Original source](https://www.openstreetmap.org/node/3809734505). Checked 2026-09-13.
[^79]: Operator stop/access plan. [Original source](https://www.bernmobil.ch/de/fahrplan-netz/fahrplan-nach-haltestellen/hirschengraben). Checked 2026-09-13.
[^80]: Published works information. [Original source](https://www.bernmobil.ch/de/verkehrsinformationen/baustellen/unterhalsarbeiten-raum-bahnhof). Checked 2026-09-13.
[^81]: Gleis 5/6 platform polygon. [Original source](https://www.openstreetmap.org/relation/10228960). Checked 2026-09-13.
[^82]: Gleis 7/8 platform polygon. [Original source](https://www.openstreetmap.org/relation/10228961). Checked 2026-09-13.
[^83]: Gleis 9/10 platform polygon. [Original source](https://www.openstreetmap.org/relation/14666888). Checked 2026-09-13.
[^84]: Gleis 12/13 platform polygon. [Original source](https://www.openstreetmap.org/relation/10228957). Checked 2026-09-13.
[^85]: Public Welle access description. [Original source](https://www.sbb.ch/de/reiseinformationen/bahnhoefe/bahnhof-finden/bahnhof-bern/bahnhofsbeschrieb.html). Checked 2026-09-13.
[^86]: Future Bubenberg access is not yet open. [Original source](https://news.sbb.ch/de/019d7b77-8b55-7146-873b-297632bf5fea/zukunft-bahnhof-bern-ausbau-laeuft-in-vielen-bereichen-gut-komplexitaet-fuehrt-jedoch-zu-verzoegerungen). Checked 2026-09-13.
[^87]: Operator stop/access plan. [Original source](https://widgets.oev-info.ch/publikation/jahresfpl/22.005.pdf). Checked 2026-09-13.
[^88]: Published works information. [Original source](https://vb-tpb.ch/de/netzinfo). Checked 2026-09-13.
[^89]: Gleis 4/5 platform polygon. [Original source](https://www.openstreetmap.org/relation/10216212). Checked 2026-09-13.
[^90]: Gleis 6/7 platform polygon. [Original source](https://www.openstreetmap.org/relation/10216208). Checked 2026-09-13.
[^91]: Operator stop/access plan. [Original source](https://www.tpg.ch/sites/default/files/arrets_plan_de_connexion/CVIN_Gen%C3%A8ve%20gare%20Cornavin_Totem.pdf). Checked 2026-09-13.
[^92]: Published works information. [Original source](https://company.sbb.ch/fr/developpement-ferroviaire/projets/suisse-romande-valais/leman-2030/nos-projets/geneve-cornavin.html). Checked 2026-09-13.
[^93]: Operator stop/access plan. [Original source](https://www.transn.ch/fileadmin/transn/pdf/Plans/Plan-de-connexion_GareNord_2024.pdf). Checked 2026-09-13.
[^94]: Published works information. [Original source](https://www.transn.ch/voyageurs/voyager/info-voyageurs/info-trafic/). Checked 2026-09-13.
[^95]: Voies 4/5 platform polygon. [Original source](https://www.openstreetmap.org/relation/8209995). Checked 2026-09-13.
[^96]: Voies 2/3 platform polygon. [Original source](https://www.openstreetmap.org/relation/8209993). Checked 2026-09-13.
[^97]: 2026 timetable and festival notice. [Original source](https://www.transn.ch/fileadmin/transn/horaire_2026/109/transN-NE-109-2.pdf). Checked 2026-09-13.
[^98]: TL Georgette stop plan, 2026. [Original source](https://www.t-l.ch/app/uploads/2026/01/Lausanne-Georgette.pdf). Checked 2026-09-13.
[^99]: CFF construction update, July 2026. [Original source](https://news.sbb.ch/fr/019d7b77-2ee6-7440-82c6-0148ce2dc460/des-nouvelles-des-chantiers-de-la-gare-de-lausanne). Checked 2026-09-13.
[^100]: Recorded Georgette connections. [Original source](https://transport.opendata.ch/v1/connections?from=8592051&to=8501008&date=2026-09-14&time=08%3A00&limit=3). Checked 2026-09-13.
[^101]: SBB Lausanne station plan, January 2026. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-lausanne-a4.pdf). Checked 2026-09-13.
[^102]: Current SBB station plan. [Original source](https://company.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-fribourg-a4.pdf). Checked 2026-09-13.
[^103]: CFF access works completion. [Original source](https://news.sbb.ch/fr/019d7b77-5154-7b10-8db3-d1206a8fd300/derniers-acces-modernises-a-la-gare-de-fribourg). Checked 2026-09-13.
[^104]: City Richemond project completion. [Original source](https://www.ville-fribourg.ch/transformations/richemond). Checked 2026-09-13.
[^105]: Recorded Richemond connections. [Original source](https://transport.opendata.ch/v1/connections?from=8511792&to=8507000&date=2026-09-14&time=08%3A00&limit=3). Checked 2026-09-13.
[^106]: Mapped western underpass. [Original source](https://www.openstreetmap.org/way/1231437119). Checked 2026-09-13.
[^107]: Swiss Transport API documentation: locations, connections and stationboards. [Original source](https://transport.opendata.ch/docs.html). Checked 2026-09-13.
[^108]: Swiss Transport API: Nyon, centre ville discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8593874&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^109]: Swiss Transport API: Nyon, Rte St-Cergue - Canal discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8512665&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^110]: Swiss Transport API: Morges, gare discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8570084&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^111]: Swiss Transport API: Morges, Charpentiers discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8592262&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^112]: Swiss Transport API: Renens VD, gare discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8530749&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^113]: Swiss Transport API: Renens VD, gare/Epenex discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8511875&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^114]: Swiss Transport API: Baden, Bahnhof West discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8578914&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^115]: Swiss Transport API: Baden, Postautostation discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8572550&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^116]: Swiss Transport API: Brugg AG, Bahnhof/Campus discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8581749&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^117]: Swiss Transport API: Brugg AG, Bahnhof/Zentrum discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8572464&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^118]: Swiss Transport API: Rapperswil SG, Bahnhof Süd discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8591746&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^119]: Swiss Transport API: Rapperswil SG (See) discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8503667&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^120]: Swiss Transport API: Wil SG, Bahnhof discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8573602&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^121]: Swiss Transport API: Wil SG, Bahnhof Süd discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8578826&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^122]: Swiss Transport API: Solothurn, Hauptbahnhof discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8572373&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^123]: Swiss Transport API: Solothurn, Zuchwilerstr./Bahnhof discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8510916&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^124]: Swiss Transport API: Sion, poste/gare discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8501994&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^125]: Swiss Transport API: Sion, Gare Bus Sédunois discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8583270&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^126]: Swiss Transport API: Yverdon-les-Bains, gare discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8504774&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^127]: Swiss Transport API: Yverdon, Théâtre Benno Besson discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8594031&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^128]: Swiss Transport API: Uster, Bahnhof discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8573504&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^129]: Swiss Transport API: Uster, Stadthaus discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8580879&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^130]: Swiss Transport API: Wetzikon ZH, Bahnhof discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8576105&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^131]: Swiss Transport API: Wetzikon ZH, Bahnhof Süd discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8594731&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^132]: Swiss Transport API: Bulle, gare routière discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8577725&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^133]: Swiss Transport API: Bulle, Place de la Gare discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8593280&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^134]: Swiss Transport API: Burgdorf, Bahnhof discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8576504&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^135]: Swiss Transport API: Burgdorf, Poststrasse discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8593265&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^136]: Swiss Transport API: Visp, Bahnhof Süd discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8571075&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^137]: Swiss Transport API: Visp, Bahnhof Nord discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8581852&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^138]: Swiss Transport API: Brig Bahnhofplatz discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8515296&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^139]: Swiss Transport API: Brig, Viktoriastrasse discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8578544&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^140]: Swiss Transport API: Basel, Badischer Bahnhof discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8592321&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^141]: Swiss Transport API: Basel, Surinam discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8589368&to=8503000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^142]: Swiss Transport API: Zürich Altstetten, Bahnhof discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8591056&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^143]: Swiss Transport API: Zürich Altstetten, Bahnhof Nord discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8591057&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^144]: Swiss Transport API: Zürich, Opernhaus discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8576195&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
[^145]: Swiss Transport API: Zürich, Bellevue discovery sample. [Original source](https://transport.opendata.ch/v1/connections?from=8576193&to=8507000&date=2026-09-14&time=08%3A00&limit=4). Checked 2026-09-13.
