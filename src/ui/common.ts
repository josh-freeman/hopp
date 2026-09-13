import type { Candidate, Connection, PlanResult, Journey } from '../types';
import { formatDuration, formatTime, stopTime } from '../engine';
import { esc, icon, t } from './html';
export const shortStop = (value: string) => value.replace(/^[^,]+,\s*/, '');
export const journeyLabel = (j?: Journey | null) => j?.category && j?.number ? `${j.category} ${j.number}` : j?.name || j?.category || 'Train';
export function arrivalText(result: PlanResult, now: number): string {
  const label = !result.opportunity?.feeder ? 'Start' : 'Your stop';
  return `${label} in <strong>${formatDuration(Math.max(0, (result.opportunity?.alightTs ?? now) - now))}</strong>`;
}
export const trainName = (c: Candidate) => journeyLabel(c.train.journey);
export function budget(c: Candidate): string {
  return `<p class="budget" data-testid="verdict-budget">You have <strong>${formatDuration(c.haveS)}</strong> · need <strong>${formatDuration(c.sprintS)}</strong> + <strong>${formatDuration(c.marginS)}</strong> margin</p>`;
}
export function connectionRow(c: Connection): string {
  const departure = stopTime(c.from, 'departure'), arrival = stopTime(c.to, 'arrival');
  const rides = c.sections.filter(s => s.journey);
  const duration = Math.max(0, Math.round((arrival - departure) / 60));
  const names = rides.map(s => journeyLabel(s.journey)).join(' → ');
  return `<article class="connection-row" data-testid="connection-row"><div class="connection-times"><strong>${t(formatTime(departure))}</strong><span class="journey-line"></span><strong>${t(formatTime(arrival))}</strong><span>${duration} min</span></div><p>${icon('train')} ${esc(names || 'Walk')}<span>${Math.max(0, rides.length - 1)} changes</span></p></article>`;
}
export function fallback(result: PlanResult, compact = false, alreadyOff = false): string {
  const connection = result.fallback ?? (result.fallbackAtRisk ? undefined : result.connections[0]);
  if (!connection) return '<aside class="fallback" data-testid="fallback"><div><strong>Regular connection also at risk</strong><p>Refresh connections or check the departure board.</p></div></aside>';
  const stationId = result.opportunity?.hack.station.id;
  const train = connection.sections.find(s => s.journey && s.departure.station.id === stationId) ?? connection.sections.find(s => s.journey);
  const dep = train ? stopTime(train.departure, 'departure') : stopTime(connection.from, 'departure');
  const platform = train?.departure.prognosis?.platform ?? train?.departure.platform;
  const label = journeyLabel(train?.journey);
  const stayOn = alreadyOff ? undefined : result.opportunity?.feeder?.arrival.station.name;
  const title = result.fallbackAtRisk ? 'Regular connection also at risk' : alreadyOff ? 'Missed it? Next train' : stayOn ? 'Miss it? Stay on the tram' : 'Your regular connection';
  return `<aside class="fallback ${compact ? 'compact' : ''}" data-testid="fallback"><span class="fallback-icon">${icon('train')}</span><div><strong>${title}</strong><p>${esc(label || 'Train')} · ${t(formatTime(dep))}${stayOn ? ` from ${esc(shortStop(stayOn))}` : ''}${platform ? ` · Platform ${esc(platform)}` : ''} · arrives ${t(formatTime(stopTime(connection.to, 'arrival')))}</p>${!compact ? `<p class="muted">${result.fallbackAtRisk ? 'Refresh connections before continuing.' : 'Follow the regular transfer.'}</p>` : ''}</div></aside>`;
}
export function badges(result: PlanResult, c: Candidate): string {
  return `<p class="route-status">Platform from the timetable · route drawn from maps, not yet run by Hopp${c.route?.helps === 'marginal' ? ' · saves only a few minutes' : ''}</p>`;
}
