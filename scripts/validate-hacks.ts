import stations from '../data/stations.json';
import { hacks, routeFor, sprintSeconds, DEFAULT_PROFILE } from '../src/engine';
import type { Hack } from '../src/schema/hack';

function distance(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const hav = Math.sin((b.lat - a.lat) * rad / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
}
const catalogue: Record<string, { name: string; minTransferS: number; observedPlatforms: string[] }> = stations;
const errors: string[] = [];
const warnings: string[] = [];
function validate(hack: Hack): void {
  for (const stop of [hack.station, hack.alight, ...hack.rideOn]) {
    if (!catalogue[stop.id]) errors.push(`${hack.id}: station id ${stop.id} missing from catalogue`);
  }
  const uncovered = (catalogue[hack.station.id]?.observedPlatforms ?? []).filter(platform => !routeFor(hack, platform));
  if (uncovered.length) warnings.push(`${hack.id}: deliberately unsupported platforms ${uncovered.join(', ')}; no recommendations for these`);
  for (const route of hack.routes) {
    const label = `${hack.id}/${route.key}`;
    if (route.helps !== 'never' && sprintSeconds(route, DEFAULT_PROFILE, Date.parse('2026-09-13T12:00:00+02:00') / 1000) >= hack.alight.plannerWalkS) {
      errors.push(`${label}: sprint cannot beat planner's walking budget`);
    }
    if (!route.landing) { warnings.push(`${label}: landing not surveyed; map cannot mark a verified endpoint`); continue; }
    const directM = distance(hack.alight, route.landing);
    const pathM = route.path.reduce((sum, step) => sum + ('m' in step ? step.m : 0), 0);
    if (distance(hack.station, route.landing) > 600) errors.push(`${label}: landing farther than 600 m from station`);
    if (pathM < directM * 0.7 || pathM > directM * 2) {
      warnings.push(`${label}: path ${Math.round(pathM)} m vs direct ${Math.round(directM)} m; review geometry (entrance landings and indoor detours can explain this)`);
    }
  }
}
const ids = hacks.map(hack => hack.id);
if (new Set(ids).size !== ids.length) errors.push('Duplicate hack id');
hacks.forEach(validate);
warnings.forEach(warning => console.warn(`Warning: ${warning}`));
errors.forEach(error => console.error(`Error: ${error}`));
console.log(`Validated ${hacks.length} hacks, ${hacks.reduce((sum, hack) => sum + hack.routes.length, 0)} platform groups; ${errors.length} errors, ${warnings.length} review notes.`);
if (errors.length) process.exitCode = 1;
