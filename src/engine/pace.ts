import pace from '../../data/pace-tables.json';
import type { Profile, Route } from '../types';
import { swissDateTime } from './time';

export const DEFAULT_PROFILE: Profile = {
  sprintMps: pace.defaultSprintMps, bag: false, minMarginS: pace.minMarginS, offerSprintRoutes: true,
};
export function sprintFromVma(vmaKmh: number): number { return vmaKmh * 0.75 / 3.6; }
export function sprintFrom5k(seconds: number): number { return 0.75 * 5000 / (seconds * 0.92); }
export function isPeak(when: number): boolean {
  const { date, time } = swissDateTime(when);
  if (!date) return false;
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const minute = hours * 60 + minutes;
  return day > 0 && day < 6 && pace.peakWindows.some(([start, end]) => minute >= start! && minute < end!);
}
function duration(route: Route, openMps: number, mode: 'run' | 'walk', when: number): number {
  if (!Number.isFinite(openMps) || openMps <= 0) return Number.POSITIVE_INFINITY;
  const peak = isPeak(when);
  let seconds = pace.alightS + pace.reactS;
  for (const step of route.path) {
    if ('m' in step) {
      const factor = peak && (step.kind === 'hall' || step.kind === 'platform') ? pace.peakFactor : 1;
      const speed = Math.min(openMps * pace.moveFactors[step.kind] * factor, pace.moveCaps[step.kind]);
      seconds += step.m / speed + (step.crossings ?? 0) * pace.crossingS;
    } else {
      seconds += step.riseM * pace.levelSecondsPerMetre[mode][step.kind][step.dir] + pace.levelTransitionS;
    }
  }
  return seconds + route.doorOffsetM.typ / (pace.doorApproachFactor * openMps);
}
export function sprintSeconds(route: Route, profile: Profile, when: number): number {
  return duration(route, profile.sprintMps * (profile.bag ? pace.bagFactor : 1), 'run', when);
}
export function walkSeconds(route: Route, when: number): number { return duration(route, pace.walkMps, 'walk', when); }
export function marginSeconds(sprint: number, profile: Profile, live: boolean): number {
  const minimum = Number.isFinite(profile.minMarginS) && profile.minMarginS >= 0 ? profile.minMarginS : pace.minMarginS;
  return Math.max(minimum, sprint * pace.marginFraction) + pace.doorCloseS + (live ? 0 : pace.scheduledOnlyMarginS);
}
export const DOOR_CLOSE_S = pace.doorCloseS;
