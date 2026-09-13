import type { Candidate, PlanResult } from '../types';
import { formatDuration, formatTime } from '../engine';
import { esc, primary, t } from './html';
import { arrivalText, budget, fallback, shortStop, trainName } from './common';
export function liveScreen(result: PlanResult, selected: Candidate, now: number, running: boolean): string {
  const stale = now - result.updatedAt > 120;
  const passed = !running && !!result.opportunity?.feeder && now > result.opportunity.alightTs + 60;
  const available = Math.min(selected.haveS, selected.departureTs - Math.max(now, result.opportunity?.alightTs ?? now));
  const go = !!result.recommended && selected.band === 'GO' && available >= selected.sprintS + selected.marginS && !stale && !passed;
  const runningTime = selected.departureTs - 20 - now;
  const safeRunning = running && runningTime > 0 && !stale && selected.band === 'GO';
  const active = running ? safeRunning : go;
  const directive = result.opportunity?.kind === 'ride-past' ? 'GET OFF EARLY AT' : result.opportunity?.kind === 'walk' ? 'GET OFF AT' : 'START AT';
  const title = stale ? 'Updates paused' : passed ? 'Stop has passed' : !active ? (running || !result.opportunity?.feeder ? 'Train at risk' : 'STAY ON') : running ? 'Head to the platform' : directive;
  const stop = result.opportunity?.hack.alight.name ?? '';
  return `<section class="screen live-screen ${active ? '' : 'live-paused'}" data-screen="live" data-testid="screen"><div class="live-train"><span>${esc(trainName(selected))} · ${t(formatTime(selected.departureTs))}</span><span class="live-indicator">${stale ? 'PAUSED' : selected.live ? 'LIVE' : 'TIMETABLE'}</span></div>
    <div class="live-instruction"><p class="eyebrow" data-testid="live-status" role="status">${title}</p><h1 data-testid="alight">${active ? (running ? 'Keep to the route' : esc(shortStop(stop))) : stale ? 'Check the board' : passed ? 'Keep your connection' : running ? 'Check the board' : result.opportunity?.feeder ? 'Stay aboard' : 'Keep your connection'}</h1>${active && !running ? `<p>${arrivalText(result, now)}</p>` : '<p>Your regular connection stays below.</p>'}</div>
    <div class="live-numbers"><div><span class="eyebrow">Platform</span><strong data-testid="platform">${esc(selected.platform || '—')}</strong></div><div><span class="eyebrow">Until doors close</span><strong data-testid="countdown" ${active ? '' : 'aria-label="Countdown paused"'}>${active ? t(formatDuration(Math.max(0, runningTime))) : t('—:—')}</strong></div></div>
    <div class="live-budget">${active && !running ? `<p class="live-spare"><strong>${t(formatDuration(Math.max(0, available - selected.sprintS - selected.marginS)))}</strong> to spare</p>` : ''}${budget({ ...selected, haveS: running ? selected.haveS : available })}${active && !running ? '' : `<p>${running ? 'Budget at alighting · follow the crossings and signals' : stale ? 'No fresh update for over 2 minutes. Countdown paused.' : passed ? 'You have passed the stop. Search for a new connection.' : 'The sprint no longer leaves the planned margin.'}</p>`}</div>
    <p class="live-caveat">Platform from the timetable · route not yet run by Hopp</p><div class="live-bottom">${fallback(result, true, running)}${primary(active ? running ? 'On the platform' : 'Start sprint' : 'Back to connections', active ? running ? 'done' : 'start-run' : 'results')}</div></section>`;
}
