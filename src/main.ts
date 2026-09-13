import './style.css';
import './design.css';
import type { Candidate, PlanResult, TripQuery } from './types';
import { createClient } from './api/client';
import { createMockClient } from './api/mock';
import { planTrip, refreshPlan, journeyKey } from './planner';
import { formatDuration, swissDateTime } from './engine';
import { readProfile, saveProfile, rememberDestination } from './storage/prefs';
import { keepAwake } from './pwa/wakelock';
import { esc, icon, button, t } from './ui/html';
import { planScreen, settingsScreen } from './ui/plan';
import { resultsScreen, doneScreen } from './ui/journey';
import { liveScreen } from './ui/live';
import { arrivalText, shortStop, trainName } from './ui/common';
import { createAccountIntegration } from './account/integration';

const app = document.querySelector<HTMLDivElement>('#app')!;
const params = new URLSearchParams(location.search);
const mock = params.has('mock');
const client = mock ? createMockClient(params.get('mock') === '1' ? 'happy' : params.get('mock') ?? 'happy') : createClient();
let profile = readProfile();
let result: PlanResult | undefined;
let selected: Candidate | undefined;
let from = mock ? 'Zürich, Bellevue' : '', to = mock ? 'Bern' : '';
let loading = false, error = '', dismissed = false, running = false, refreshing = false;
let screen = '', searchSerial = 0, pollBusy = false, liveSignature = '';
let attemptId: string | undefined, runStartedAt: number | undefined;
let pollTimer: ReturnType<typeof setInterval> | undefined;
const now = () => Date.now() / 1000;
const account = createAccountIntegration({
  mock, getScreen: () => screen, render: () => render(), navigate: next => navigate(next), flash,
  onPreferences: saved => { if (!result) { profile = saved; saveProfile(saved); } },
});
const protectedScreens = ['live', 'done'];
function navigate(next: string): void { if (location.hash === `#${next}`) render(); else location.hash = next; }
function header(): string {
  const mark = `<span class="brand-mark">${icon('hop')}</span>`;
  return `<header class="app-header">${screen === 'plan' ? `<a href="#plan" class="wordmark" aria-label="Hopp home">hopp${mark}</a>` : button(icon('back'), 'back', 'icon-button', 'aria-label="Go back"')}<span class="header-label">${screen === 'plan' ? '' : `hopp${mark}`}</span>${button(icon('user'), 'account', `icon-button account-button ${account.signedIn ? 'has-account' : ''}`, 'aria-label="Your profile"')}${button(icon('settings'), 'settings', 'icon-button', 'aria-label="Settings"')}</header>`;
}
function render(): void {
  const previous = screen;
  screen = location.hash.slice(1) || 'plan';
  if (['try', 'route', 'detail', 'shortcut'].includes(screen)) {
    screen = 'results';
    history.replaceState(null, '', `${location.pathname}${location.search}#results`);
  }
  if (loading && !refreshing && screen !== 'plan') { ++searchSerial; loading = false; }
  if (!['plan', 'results', 'live', 'done', 'settings', 'account'].includes(screen)) screen = 'plan';
  if (result && result.recommended && now() - result.updatedAt > 120 && screen !== 'live' && screen !== 'done') {
    result = { ...result, recommended: undefined, risky: undefined, reason: 'stale', error: 'Timetable updates are over two minutes old. Refresh to check a sprint route.' };
  }
  if ((screen === 'results' || protectedScreens.includes(screen)) && !result) {
    if (mock && !loading && !error) { void search({ from, to, when: now() }, screen); return; }
    screen = 'plan';
  }
  if (protectedScreens.includes(screen) && !result?.recommended && screen !== 'live' && screen !== 'done') screen = 'results';
  if ((screen === 'live' || screen === 'done') && !selected && !result?.recommended) screen = 'results';
  if (screen === 'live' && previous !== 'live') {
    selected = result?.recommended ?? selected; running = false; liveSignature = ''; startPolling(); void keepAwake(true);
  } else if (screen !== 'live' && previous === 'live') { clearInterval(pollTimer); void keepAwake(false); }
  let content: string;
  if (screen === 'account') content = account.html();
  else if (screen === 'settings') content = settingsScreen(account.preferences() ?? profile);
  else if (screen === 'results') content = resultsScreen(result!, dismissed, refreshing);
  else if (screen === 'live') content = liveScreen(result!, selected!, now(), running);
  else if (screen === 'done') content = doneScreen(result!, selected);
  else content = planScreen(profile, from, to);
  app.innerHTML = `${header()}${mock ? '<div class="demo-banner">Demo · example times</div>' : ''}<main id="main" tabindex="-1">${content}</main><div class="toast" role="status" id="toast"></div><div id="announce" class="sr-only" aria-live="assertive"></div>`;
  app.classList.toggle('is-live', screen === 'live');
  app.toggleAttribute('data-enter', previous !== screen);
  if (previous !== screen) setTimeout(() => app.removeAttribute('data-enter'), 500);
  document.querySelectorAll<HTMLImageElement>('.route-map img').forEach(img => img.complete ? img.classList.add('is-loaded') : img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true }));
  if (error && screen === 'plan') showSearchError();
  if (loading && !refreshing) showLoading();
  if (previous !== screen) { window.scrollTo(0, 0); document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true }); }
}
function showLoading(): void {
  const node = document.querySelector('#plan-message');
  if (node) node.innerHTML = '<p data-testid="loading">Checking SBB connections and sprint routes…</p>';
  const submit = document.querySelector<HTMLButtonElement>('#trip-form button[type="submit"]');
  if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); submit.innerHTML = '<span class="spinner"></span> Finding sprint routes…'; }
}
function showSearchError(): void {
  const node = document.querySelector('#plan-message');
  if (node) node.innerHTML = `<p role="alert" data-testid="error">${esc(error)}</p>`;
}
async function search(query: TripQuery, target = 'results'): Promise<void> {
  const serial = ++searchSerial;
  profile = account.preferences() ?? profile;
  loading = true; error = ''; dismissed = false; running = false;
  attemptId = undefined; runStartedAt = undefined;
  from = query.from; to = query.to;
  if (!result || target !== 'results') {
    history.replaceState(null, '', `${location.pathname}${location.search}#plan`);
    render();
    showLoading();
  } else { refreshing = true; render(); }
  try {
    const next = await planTrip(client, query, profile);
    if (serial !== searchSerial) return;
    result = next; selected = next.recommended;
    rememberDestination(query.to);
    loading = false; refreshing = false; navigate(target); if (screen === target) render();
    if (next.connections.length) void account.recordConnectionChecked();
  } catch (reason) {
    refreshing = false;
    if (serial !== searchSerial) return;
    error = reason instanceof Error ? reason.message : 'Could not load connections. Please try again.';
    loading = false;
    if (result) { result = { ...result, error, recommended: undefined }; navigate('results'); render(); }
    else { navigate('plan'); render(); }
  }
}
function flash(message: string): void { const t = document.querySelector('#toast'); if (t) { t.textContent = message; setTimeout(() => { t.textContent = ''; }, 5000); } }
function updateLive(): void {
  if (screen !== 'live') {
    if (result?.recommended && screen === 'results') {
      const seconds = now(), candidate = result.recommended;
      const stale = seconds - result.updatedAt > 120;
      const passed = !!result.opportunity?.feeder && seconds > result.opportunity.alightTs + 60;
      const available = candidate.departureTs - Math.max(seconds, result.opportunity?.alightTs ?? seconds);
      if (stale || passed || available < candidate.sprintS + candidate.marginS) {
        result = { ...result, recommended: undefined, risky: undefined,
          reason: stale ? 'stale' : passed ? 'passed-stop' : 'missed-by',
          error: 'Refresh connections to check another departure.' };
        render();
      }
    }
    return;
  }
  if (!result || !selected) return;
  const seconds = now();
  const stale = seconds - result.updatedAt > 120;
  const passed = !running && !!result.opportunity?.feeder && seconds > result.opportunity.alightTs + 60;
  const available = Math.min(selected.haveS, selected.departureTs - Math.max(seconds, result.opportunity?.alightTs ?? seconds));
  const go = !!result.recommended && selected.band === 'GO' && available >= selected.sprintS + selected.marginS && !stale && !passed;
  const active = running ? selected.departureTs - 20 > seconds && !stale && selected.band === 'GO' : go;
  const sig = `${active}/${stale}/${passed}/${running}/${selected.platform}/${selected.departureTs}/${result.updatedAt}`;
  if (sig !== liveSignature) {
    if (liveSignature.startsWith('true') && !active && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    const focused = (document.activeElement as HTMLElement | null)?.dataset.action;
    const wasActive = liveSignature.startsWith('true');
    document.querySelector('#main')!.innerHTML = liveScreen(result, selected, seconds, running);
    if (liveSignature && wasActive !== active) {
      document.querySelector('.live-instruction')?.setAttribute('data-flip', '');
      const announce = document.querySelector('#announce');
      if (announce) announce.textContent = active ? `Go. Get off at ${shortStop(result.opportunity?.hack.alight.name ?? '')}.` : 'Stay on. The tram is late.';
    }
    liveSignature = sig;
    if (focused) document.querySelector<HTMLElement>(`[data-action="${focused}"]`)?.focus({ preventScroll: true });
  } else if (active) {
    const countdown = document.querySelector('[data-testid="countdown"]');
    if (countdown) { countdown.innerHTML = t(formatDuration(Math.max(0, selected.departureTs - 20 - seconds))); countdown.classList.toggle('is-urgent', selected.departureTs - 20 - seconds < 30); }
    const arrival = document.querySelector('.live-instruction > p:last-child');
    if (arrival && !running) arrival.innerHTML = arrivalText(result, seconds);
    if (!running) {
      const have = document.querySelector('[data-testid="verdict-budget"] strong');
      if (have) have.textContent = formatDuration(available);
      const spare = document.querySelector('.live-spare strong');
      if (spare) spare.textContent = formatDuration(Math.max(0, available - selected.sprintS - selected.marginS));
    }
  }
}
function startPolling(): void {
  clearInterval(pollTimer);
  const period = mock && params.get('poll') ? Math.max(500, Number(params.get('poll')) || 45000) : 45000;
  pollTimer = setInterval(() => { void poll(); }, period);
}
async function poll(): Promise<void> {
  if (!result || screen !== 'live' || pollBusy) return;
  pollBusy = true;
  try {
    const old = result;
    const fresh = await refreshPlan(client, old, profile, { running, selectedJourney: selected && journeyKey(selected.train) });
    if (result !== old || screen !== 'live') return;
    result = fresh;
    selected = fresh.candidates.find(c => journeyKey(c.train) === (selected && journeyKey(selected.train))) ?? selected;
    updateLive();
  } catch (reason) { if (result) result.error = reason instanceof Error ? reason.message : 'Updates unavailable.'; updateLive(); }
  finally { pollBusy = false; }
}
// datetime-local is entered in Swiss time, independently of the browser's timezone.
function swissInputEpoch(value: string): number {
  const reference = Date.parse(`${value}Z`) / 1000;
  if (!Number.isFinite(reference)) throw new Error('Choose a valid departure time.');
  let candidate = reference;
  for (let i = 0; i < 3; i++) { const local = swissDateTime(candidate); candidate += reference - Date.parse(`${local.date}T${local.time}:00Z`) / 1000; }
  const local = swissDateTime(candidate);
  if (`${local.date}T${local.time}` !== value) throw new Error('That Swiss time does not exist because the clocks change. Choose another time.');
  return candidate;
}
app.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  if (account.handleSubmit(form)) return;
  const data = new FormData(form);
  if (form.id === 'trip-form') {
    try {
      const when = data.get('when') === 'later' ? swissInputEpoch(String(data.get('date-time'))) : now();
      void search({ from: String(data.get('from')).trim(), to: String(data.get('to')).trim(), when });
    } catch (reason) { error = (reason as Error).message; showSearchError(); }
  } else if (form.id === 'settings-form') {
    ++searchSerial; loading = false; error = '';
    const next = { sprintMps: Number(data.get('pace')), minMarginS: Number(data.get('margin')), bag: data.get('bag') === 'on', offerSprintRoutes: data.get('offer') === 'on' };
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.disabled = true;
    void account.savePreferences(next).then(saved => {
      if (!saved) return;
      profile = next; saveProfile(profile); result = undefined; selected = undefined; navigate('plan');
    }).finally(() => { if (submit?.isConnected) submit.disabled = false; });
  }
});
app.addEventListener('change', event => {
  const target = event.target as HTMLInputElement;
  if (target.id === 'when') {
    const row = document.querySelector<HTMLElement>('#date-row')!; row.hidden = target.value !== 'later';
    const input = document.querySelector<HTMLInputElement>('#date-time')!; input.required = !row.hidden;
    if (!input.value) { const t = swissDateTime(now() + 300); input.value = `${t.date}T${t.time}`; }
  }
});
app.addEventListener('click', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action!;
  if (account.handleAction(action, target)) return;
  if (action === 'back') { navigate(({ plan: 'plan', results: 'plan', live: 'results', done: 'results', settings: 'plan', account: 'plan' } as Record<string, string>)[screen]); return; }
  if (action === 'dismiss') { dismissed = true; render(); return; }
  if (action === 'restore') { dismissed = false; render(); return; }
  if (action === 'start-run') {
    const available = selected ? selected.departureTs - Math.max(now(), result?.opportunity?.alightTs ?? now()) : 0;
    if (!result?.recommended || !selected || now() - result.updatedAt > 120 || available < selected.sprintS + selected.marginS) { updateLive(); return; }
    if (!running) { attemptId = crypto.randomUUID(); runStartedAt = now(); }
    running = true; updateLive(); return;
  }
  if (action === 'done') {
    if (!running || !result || !selected || !attemptId || runStartedAt === undefined) return;
    const record = { client_id: attemptId, route_id: result.opportunity?.hack.id, platform: selected.platform,
      train: trainName(selected), departure_at: new Date(selected.departureTs * 1000).toISOString(), duration_s: Math.max(0, Math.round(now() - runStartedAt)) };
    navigate('done'); void account.recordAttempt(record); return;
  }
  if (action === 'refresh') { if (result) void search({ ...result.query, when: Math.max(now(), result.query.when) }); return; }
  if (action === 'swap') {
    const f = document.querySelector<HTMLInputElement>('#from')!, t = document.querySelector<HTMLInputElement>('#to')!;
    [f.value, t.value] = [t.value, f.value]; return;
  }
  if (action === 'destination') { document.querySelector<HTMLInputElement>('#to')!.value = target.dataset.value!; return; }
  if (action === 'pick-station') {
    const input = document.getElementById(target.dataset.field!) as HTMLInputElement;
    input.value = target.dataset.name!; input.setAttribute('aria-expanded', 'false'); document.getElementById(`${input.id}-suggestions`)!.hidden = true; input.focus(); return;
  }
  if (action === 'nearest') { void nearestStop(); return; }
  navigate(action);
});
let autocompleteTimer: ReturnType<typeof setTimeout>;
let autocompleteSerial = 0;
app.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (input.id === 'pace') {
    const v = Number(input.value), preview = document.querySelector('#pace-preview');
    if (v > 0 && preview) preview.textContent = `${(v * 3.6).toFixed(1)} km/h · 400 m in ${formatDuration(Math.ceil(400 / v))}`;
  }
  if (!['from', 'to'].includes(input.id)) return;
  clearTimeout(autocompleteTimer);
  const serial = ++autocompleteSerial, value = input.value.trim();
  const list = document.getElementById(`${input.id}-suggestions`)!;
  list.hidden = true; input.setAttribute('aria-expanded', 'false');
  if (value.length < 2) return;
  autocompleteTimer = setTimeout(async () => {
    try {
      const locations = await client.locations(value);
      if (serial !== autocompleteSerial || !input.isConnected || document.activeElement !== input) return;
      list.innerHTML = locations.filter(x => x.id).slice(0, 5).map(x => `<li role="option" aria-selected="false">${button(esc(x.name), 'pick-station', 'suggestion', `data-field="${input.id}" data-name="${esc(x.name)}"`)}</li>`).join('');
      list.hidden = !list.children.length; input.setAttribute('aria-expanded', String(!list.hidden));
    } catch { /* Free-text stations remain searchable when autocomplete is unavailable. */ }
  }, 400);
});
app.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;
  if (event.key === 'Escape') { document.querySelectorAll<HTMLElement>('.suggestions').forEach(x => { x.hidden = true; }); document.querySelectorAll('[role="combobox"]').forEach(x => x.setAttribute('aria-expanded', 'false')); }
  if (event.key === 'ArrowDown' && target.matches('[role="combobox"]')) { event.preventDefault(); document.querySelector<HTMLButtonElement>(`#${target.id}-suggestions button`)?.focus(); }
});
async function nearestStop(): Promise<void> {
  if (!navigator.geolocation) { flash('Location is unavailable. Enter your stop above.'); return; }
  flash('Finding your nearest stop…');
  navigator.geolocation.getCurrentPosition(async position => {
    try {
      const stops = await client.locations({ lat: position.coords.latitude, lon: position.coords.longitude });
      const input = document.querySelector<HTMLInputElement>('#from');
      if (input && stops[0]) { input.value = stops[0].name; flash('Nearest stop selected.'); } else flash('No nearby stop found. Enter one above.');
    } catch { flash('Could not find nearby stops. Enter your stop above.'); }
  }, () => flash('Location wasn’t available. Enter your stop above.'), { timeout: 10000, maximumAge: 60000 });
}
window.addEventListener('hashchange', render);
window.addEventListener('pagehide', () => { clearInterval(pollTimer); void keepAwake(false); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { updateLive(); if (screen === 'live') void poll(); } });
setInterval(updateLive, 1000);
render();
void account.initialize();
