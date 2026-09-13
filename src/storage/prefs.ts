import type { Profile } from '../types';
import { DEFAULT_PROFILE } from '../engine';
export function readProfile(): Profile {
  try {
    const data = JSON.parse(localStorage.getItem('hopp.profile') ?? '{}');
    return {
      sprintMps: typeof data.sprintMps === 'number' && data.sprintMps >= 1.5 && data.sprintMps <= 6.5 ? data.sprintMps : DEFAULT_PROFILE.sprintMps,
      minMarginS: typeof data.minMarginS === 'number' && data.minMarginS >= 45 && data.minMarginS <= 300 ? data.minMarginS : 45,
      bag: data.bag === true, offerSprintRoutes: data.offerSprintRoutes !== false,
    };
  } catch { return { ...DEFAULT_PROFILE }; }
}
export function saveProfile(profile: Profile): void { try { localStorage.setItem('hopp.profile', JSON.stringify(profile)); } catch { /* Private mode may not allow persistence. */ } }
export function recentDestinations(): string[] {
  try { const v = JSON.parse(localStorage.getItem('hopp.recent') ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, 5) : []; } catch { return []; }
}
export function rememberDestination(value: string): void {
  try { localStorage.setItem('hopp.recent', JSON.stringify([value, ...recentDestinations().filter(x => x !== value)].slice(0, 5))); } catch { /* In-memory planning remains available. */ }
}
