import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { ResearchRoute } from '../src/research-types';
import { HackSchema } from '../src/schema/hack';
import { DEFAULT_PROFILE, marginSeconds, sprintSeconds } from '../src/engine/pace';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const regions = readdirSync('data/research/regions').filter(name => name.endsWith('.json')).sort();
const rows: ResearchRoute[] = regions.flatMap(name => read(`data/research/regions/${name}`));
const catalogue = readdirSync('data/hacks').filter(name => name.endsWith('.json')).sort().map(name => HackSchema.parse(read(`data/hacks/${name}`)));
const active = catalogue.filter(h => h.status === 'desk-verified' || h.status === 'field-verified');
const scan = read('data/research/discovery-scan.json');
const leads = scan.leads as {station: string; from?: string; plannerAccessS?: number; directDistanceM?: number; walkingOnly?: boolean; sources: string[]; status: string}[];
const detailedStations = new Set(rows.map(r => r.station));
const screenedStations = new Set(leads.map(r => r.station));
const allStations = new Set([...detailedStations, ...screenedStations, 'Basel SBB']);
const sources: {title: string; url: string; checkedAt: string}[] = [];
function cite(source: {title: string; url: string; checkedAt: string}): string {
  let index = sources.findIndex(s => s.url === source.url);
  if (index < 0) index = sources.push(source) - 1;
  return `[^${index + 1}]`;
}
const cell = (s: unknown) => String(s ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
const checked = '2026-09-13';
const out = [`# Swiss station shortcut research

Hopp now has **${active.length} enabled stop-to-station route records**, compared with the original two. The expansion examines **${rows.length} approaches at ${detailedStations.size} stations in detail**, alongside a broader timetable screen covering **${screenedStations.size} stations and ${leads.length} nearby-stop observations**. Across those sets and the original Basel route, **${allStations.size} distinct railway stations** are represented. These counts describe different levels of evidence: the broad screen is a source of leads, while enabled routes have specific mapped platform access.

The strongest new coverage comes from public side entrances, underpasses and terminal-platform approaches. The research combines SBB station plans, municipal and operator construction notices, mapped pedestrian infrastructure, and actual timetable responses. Checked dates are **13 September 2026**; timetable samples concern travel on **14 or 15 September 2026**. None of the newly enabled routes has been timed on foot.

The route records are used only in a relevant journey search. A recommendation still requires a real departure on a supported platform, the full personal margin, and an earlier final arrival than the regular connection. A short mapped path alone cannot establish that a train is catchable.

## Enabled coverage and modelled time

The following table describes the expansion records, not a timetable promise. “Required” includes the modelled movement, reaction and door approach, plus the default scheduled-only margin. Values use the default 3.5 m/s pace without luggage, with weekday peak crowding where the path contains halls or platforms. The real journey may have a larger or smaller window than the observed planner allowance.

| Starting stop → station | Supported platforms | Recorded planner allowance | Modelled sprint | Required with scheduled margin | Evidence |
| --- | --- | ---: | ---: | ---: | --- |`];
const when = Date.parse('2026-09-15T08:00:00+02:00') / 1000;
for (const row of rows.filter(r => r.activeHackId)) {
  const h = active.find(h => h.id === row.activeHackId);
  if (!h) throw new Error(`Research route ${row.id} claims missing active hack ${row.activeHackId}`);
  const helping = h.routes.filter(r => r.helps !== 'never');
  const values = helping.map(route => sprintSeconds(route, DEFAULT_PROFILE, when));
  const range = (xs: number[]) => Math.min(...xs.map(Math.ceil)) === Math.max(...xs.map(Math.ceil)) ? `${Math.ceil(xs[0]!)} s` : `${Math.ceil(Math.min(...xs))}–${Math.ceil(Math.max(...xs))} s`;
  const evidence = row.sources.filter(s => /connections|bahnhofplaene|station-plan|openstreetmap/.test(s.url)).slice(0, 3).map(cite).join('');
  out.push(`| ${cell(row.from)} → ${cell(row.station)} | ${cell(row.platforms.join(', '))} | ${row.plannerBudgetS ?? h.alight.plannerWalkS} s | ${range(values)} | ${range(values.map(s => s + marginSeconds(s, DEFAULT_PROFILE, false)))} | ${evidence} |`);
}
out.push(`
The original **Zürich Central → HB** and **Basel IWB → SBB** records remain in the catalogue with their platform groups and existing limitations. Lausanne gare/m2 remains a draft. Broader coverage at a station does not imply coverage of every platform: missing, ambiguous or unpublished platforms cannot produce a GO. A new record with only one platform is deliberately narrow.

## Recorded earlier-arrival example

For **Winterthur Archstrasse/HB → Aarau on 15 September 2026 at 08:04**, the captured regular plan begins its seven-minute walk at 08:26, boards the 08:33 IC5, and arrives at **09:28**. The separately captured Winterthur candidates include the **08:09 S11 on platform 3**, reaching Zürich HB at 08:28, then the **08:38 RE37 from platform 16**, arriving in Aarau at **09:05**. The default route model needs approximately 254 seconds including the scheduled margin against a 300-second available window, giving a conditional **23-minute earlier arrival**. ${cite({title:'Swiss Transport API: Archstrasse/HB → Aarau, 15 September 2026 at 08:04',url:'https://transport.opendata.ch/v1/connections?from=8594298&to=Aarau&date=2026-09-15&time=08%3A04&limit=4',checkedAt:checked})}${cite({title:'Swiss Transport API: Winterthur → Aarau, 15 September 2026 at 08:06',url:'https://transport.opendata.ch/v1/connections?from=8506000&to=Aarau&date=2026-09-15&time=08%3A06&limit=10',checkedAt:checked})}

This is an actual timetable comparison, with no altered train times or platform numbers. It remains a modelled catch, not a completed run. The Zürich transfer and both departures must still operate as expected. A separate Winterthur → Bern probe at 08:28 correctly found no supported gain: its earlier services departed from uncovered platform 4. The distinction shows why valid stop matching cannot substitute for platform-specific evidence.

## Detailed route findings

Evidence is retained for unresolved approaches as well as promoted ones. “Needs check” can mean an unknown stair rise, uncertain access during works, or a model that does not leave enough margin. It does not mean that a usable shortcut has been established.
`);
for (const row of rows) {
  out.push(`### ${row.title}

**${row.activeHackId ? 'Enabled with limited platform coverage' : row.status === 'not-useful' ? 'No useful shortcut established' : 'Research record; not enabled'}.** ${row.summary}

${row.findings.join(' ')} ${row.sources.map(cite).join('')}

Remaining checks: ${row.fieldChecks.join(' ')}
`);
}
out.push(`## Interpretation of transfer budgets

A planner allowance must come from a connection that continues on a train. A walking-only query to a station coordinate measures something different: it can end at the station reference point instead of representing the transfer to a train. Leading walking sections can have a null duration field, so the recorded departure and arrival timestamps establish their actual allowance. For bus-fed approaches, bus travel and the subsequent transfer must be distinguished from a continuous walk. ${cite({title:'Swiss Transport API documentation: locations, connections and stationboards',url:'https://transport.opendata.ch/docs.html',checkedAt:checked})}

The enabled data contain both distinctive side-access routes and tighter ordinary transfer opportunities. Several of the new records have only a small timing window after the scheduled margin. The catalogue therefore does not claim that every listed approach meets the stricter discovery target of gaining two minutes and requiring a sprint. That classification requires the complete pedestrian path and a particular timetable window. The runtime comparison remains conditional on the searched trip.

The sprint estimates include more than path length divided by running speed. They contain alighting and reaction time, movement-type speed factors, crossing waits, stairs where supported, a platform-to-door allowance, and a minimum margin. Platform stopping positions and crowds can dominate the estimate. A mapped stair count supports an estimate of vertical movement only when its assumed riser height is stated; it is not a measured height. The western reports preserve that distinction.

The default required time adds 45 seconds of personal margin, 20 seconds for door closure and 30 seconds when timing is scheduled only, or a larger proportional margin if applicable. Live information can remove the scheduled-only component, but a stationboard update does not verify the pedestrian route or onward connecting services. No guaranteed success rate is established by this research.

## Wider timetable screen

These observations extend the search beyond the detailed regional routes. Distances below are **straight-line screening distances**, not walking paths. They must not be inserted into the sprint model. “Access” is the sum of the observed leading travel sections, and can include a bus; a missing value means the captured query did not establish a suitable transfer through that station.

| Railway station | Nearby stop | Direct distance | Observed access | Access type | Source |
| --- | --- | ---: | ---: | --- | --- |`);
for (const lead of leads) {
  const url = lead.sources.at(-1)!;
  out.push(`| ${cell(lead.station)} | ${cell(lead.from)} | ${lead.directDistanceM == null ? '—' : `${lead.directDistanceM} m`} | ${lead.plannerAccessS == null ? 'Not established' : `${lead.plannerAccessS} s`} | ${lead.plannerAccessS == null ? '—' : lead.walkingOnly ? 'Walking transfer' : 'Includes vehicle travel'} | ${cite({title:`Swiss Transport API: ${lead.from ?? lead.station} discovery sample`,url,checkedAt:checked})} |`);
}
out.push(`
The screen is deliberately bounded to the two closest qualifying stops returned for each station. Consequently, an absent stop or city is not evidence that it has no shortcuts. The next useful expansion is to trace the public platform access of leads with a substantial planner allowance, then inspect current construction and actual train platforms. Repeating distance-only scans cannot resolve those questions.

## Detailed evidence files

The regional reports provide the full path chains, rejected alternatives, source editions, and modelling assumptions:

- [Northeast: Winterthur, St. Gallen, Schaffhausen, Chur and Zürich](expansion/northeast.md).
- [West: Bern, Biel, Genève, Neuchâtel, Fribourg and Lausanne](expansion/west.md).
- [Central and south: Luzern, Zug, Thun, Aarau, Olten, Bellinzona, Locarno and Lugano](expansion/central-south.md).
- [Nyon](expansion/lake-geneva.md).

The [source inventory](sources.csv) contains the exact URLs and checked dates for all regional records and broad-screen observations. Captured timetable responses and map extracts are retained under data/research/raw/; regional decisions are under data/research/regions/. These are research records, separate from the app’s trip flow.

## Sources
`);
for (let i = 0; i < sources.length; i++) {
  const s = sources[i]!;
  out.push(`[^${i + 1}]: ${s.title}. [Original source](${s.url}). Checked ${s.checkedAt}.`);
}
writeFileSync('docs/research/2026-09-13-route-expansion.md', out.join('\n') + '\n');
const inventory = rows.flatMap(r => r.sources.map(s => ({route:r.id,...s}))).concat(leads.flatMap(r => r.sources.map(url => ({route:`discovery:${r.station}:${r.from ?? ''}`,title:'Timetable discovery sample',url,checkedAt:checked}))));
const csv = (s: string) => `"${s.replaceAll('"','""')}"`;
writeFileSync('docs/research/sources.csv', ['route,title,url,checkedAt', ...inventory.map(r => [r.route,r.title,r.url,r.checkedAt].map(csv).join(','))].join('\n')+'\n');
writeFileSync('data/research/summary.json',JSON.stringify({checkedAt:checked,enabledRouteRecords:active.length,detailedApproaches:rows.length,detailedStations:detailedStations.size,screenedStations:screenedStations.size,screenedObservations:leads.length,totalDistinctStations:allStations.size,uniqueSourceUrls:new Set(inventory.map(s=>s.url)).size},null,2)+'\n');
console.log(`Research report: ${rows.length} detailed approaches, ${leads.length} screened observations, ${active.length} enabled records, ${allStations.size} stations.`);
