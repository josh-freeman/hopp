# Nyon station access

Nyon centre ville has a continuous mapped public surface route to **Voie 1**. The timetable assigns a five-minute walk from that stop to the railway station. This supports a narrowly scoped transfer model, with an earlier train offered only when the actual departure and final arrival satisfy Hopp’s normal decision rules. The record was checked on 13 September 2026; it has not been timed on foot.[^1][^2]

## Platform and timetable evidence

Four captured connections for 14 September 2026 leave centre ville at 08:00, 08:15, 08:22 and 08:30, walk for five minutes, and board on Voie 1 at 08:05, 08:20, 08:27 and 08:35. The services arrive in Genève at 08:21, 08:35, 08:43 and 08:51 respectively. These observations establish the stop identity, platform and planner allowance. They do not establish that sprinting always catches a different train.[^1]

The timetable stop is `8593874`, the rail station `8501030`. The physical bus platform is mapped at node `1837005634`. The selected public path reaches node `5149171869`, shared with the Voie 1 platform polygon `210675017`; the coverage does not extend to the island platforms or the NStCM terminus.[^2][^3][^4][^5]

## Public path and timing assumptions

The selected path follows Rue de la Gare and the station forecourt. It measures **201.6 m** including a 3.2 m offset from the mapped bus platform to the pedestrian graph. It uses public footways, pedestrian areas and a living street mapped with sidewalks on both sides. A shorter 154.8 m alternative contains stairs whose rise could not be established, so that alternative was excluded.[^2]

The model rounds the selected distance upward to **225 m** to allow for pavement alignment and approach uncertainty. It adds two ten-second crossing-delay allowances and a **150 m** platform-to-door allowance. The latter is a conservative model parameter, not a measured train stopping position. At the default 3.5 m/s pace, this produces approximately **147 seconds** of movement and reaction time, plus **95 seconds** of scheduled-only margin: approximately **242 seconds total**. The timing window against the observed 300-second walk is consequently only about 58 seconds. A minute-resolution departure search can easily find no usable gain; the route is classified marginal.

The platform allowance matters: reducing it to an optimistic value could manufacture an apparent shortcut. The remaining checks are the actual alighting kerb, the public pavement alignment, pedestrian delays, signage and the train’s stopping position. No railway track crossing forms part of this route.

## Current works and exclusions

Nyon’s current station project page describes a future new underpass extending Avenue Viollier, with further planning and studies before construction. That proposed access is not part of the current route. The active record follows existing surface paths and expires for review at the December 2026 timetable change; that date is a review deadline, not a stated access closure.[^6]

The other screened Nyon stop, Route de Saint-Cergue/Canal, has a six-minute planner access allowance. It remains an unverified discovery lead because an attractive straight-line distance does not prove a usable path to the correct platform. The wider discovery table retains it separately from the enabled platform-1 route.

## Sources

[^1]: Swiss Transport API, [Nyon centre ville → Genève, 14 September 2026, 08:00, four connections](https://transport.opendata.ch/v1/connections?from=8593874&to=8501008&date=2026-09-14&time=08%3A00&limit=4), captured 13 September 2026. Unmodified response: `data/research/raw/root-nyon-centre-geneve.json`.
[^2]: OpenStreetMap contributors, [Nyon station-area map data](https://api.openstreetmap.org/api/0.6/map.json?bbox=6.2305,46.3815,6.2395,46.3880), captured 13 September 2026. Snapshot and selected trace: `root-nyon-osm.json` and `root-nyon-centre-stepfree-paths.jsonl` in `data/research/raw/`.
[^3]: OpenStreetMap contributors, [centre ville bus platform, node 1837005634](https://www.openstreetmap.org/node/1837005634), checked 13 September 2026.
[^4]: OpenStreetMap contributors, [Voie 1 platform, way 210675017](https://www.openstreetmap.org/way/210675017), checked 13 September 2026.
[^5]: OpenStreetMap contributors, [public-path landing, node 5149171869](https://www.openstreetmap.org/node/5149171869), checked 13 September 2026.
[^6]: Ville de Nyon, [Gare de Nyon](https://www.nyon.ch/nyon-officiel/grands-projets/gare-de-nyon/), last updated 2 September 2026, checked 13 September 2026.
