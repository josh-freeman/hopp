import type { Profile } from '../types';
import { esc, icon, button } from './html';
import { recentDestinations } from '../storage/prefs';
export function planScreen(profile: Profile, from: string, to: string): string {
  const recent = recentDestinations();
  return `<section class="screen plan-screen" data-screen="plan" data-testid="screen">
    <div class="intro"><h1>Connections</h1></div>
    <form id="trip-form" class="trip-form">
      <div class="journey-fields panel">
        <div class="station-field"><span class="field-icon">${icon('pin')}</span><div class="field-content"><label for="from">From</label><input id="from" name="from" value="${esc(from)}" placeholder="Stop or station" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="from-suggestions" required/><ul id="from-suggestions" class="suggestions" role="listbox" hidden></ul></div>${button(icon('pin'), 'nearest', 'icon-button', 'aria-label="Use nearest stop"')}</div>
        <div class="station-field"><span class="field-icon">${icon('flag')}</span><div class="field-content"><label for="to">To</label><input id="to" name="to" value="${esc(to)}" placeholder="Stop or station" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="to-suggestions" required/><ul id="to-suggestions" class="suggestions" role="listbox" hidden></ul></div>${button(icon('swap'), 'swap', 'icon-button', 'aria-label="Swap origin and destination"')}</div>
        <div class="time-field">${icon('clock')}<label for="when">Departure</label><select id="when" name="when"><option value="now">Leave now</option><option value="later">Choose a time</option></select></div>
        <div id="date-row" class="date-row" hidden><label for="date-time">Swiss time</label><input id="date-time" type="datetime-local" name="date-time" /></div>
      </div>
      <div id="plan-message" class="inline-message" role="status"></div>
      ${recent.length ? `<div class="recent"><p class="eyebrow">Recent destinations</p><div class="chips">${recent.map(x => button(esc(x), 'destination', 'chip', `data-value="${esc(x)}"`)).join('')}</div></div>` : ''}
      <div class="local-note">${icon('run')}<div><strong>Sprint routes ${profile.offerSprintRoutes ? 'on' : 'off'}</strong><p>Included in connection searches.</p></div>${button(icon('settings'), 'settings', 'icon-button', 'aria-label="Sprint route settings"')}</div>
      <div class="bottom-actions"><button type="submit" class="primary" data-testid="primary-action">Find connections ${icon('arrow')}</button><a class="text-link demo-link" href="?mock=1#plan">Try the demo ${icon('run')}</a></div>
    </form>
  </section>`;
}
export function settingsScreen(profile: Profile): string {
  return `<section class="screen" data-screen="settings" data-testid="screen"><h1>Settings</h1>
    <form id="settings-form"><div class="panel settings-panel">
      <label class="setting-switch"><span><strong>Offer sprint routes</strong><small>Alongside your regular connections</small></span><input name="offer" type="checkbox" ${profile.offerSprintRoutes ? 'checked' : ''}/></label>
      <div class="setting"><label for="pace">Your full-effort pace</label><div class="unit-input"><input id="pace" name="pace" type="number" min="1.5" max="6.5" step="0.1" value="${profile.sprintMps}" required/><span>m/s</span></div><p class="muted" id="pace-preview">${(profile.sprintMps * 3.6).toFixed(1)} km/h · 400 m of open street in about ${Math.ceil(400 / profile.sprintMps)} seconds</p></div>
      <label class="setting-switch"><span><strong>Carrying luggage</strong><small>Use a slower pace with luggage</small></span><input name="bag" type="checkbox" ${profile.bag ? 'checked' : ''}/></label>
      <div class="setting"><label for="margin">Minimum spare time</label><div class="unit-input"><input id="margin" name="margin" type="number" min="45" max="300" step="5" value="${profile.minMarginS}" required/><span>seconds</span></div><p class="muted">The estimate also includes time for closing doors and timetable uncertainty.</p></div></div>
      <p class="muted privacy-note">Saved on this device. No account needed.</p><div class="bottom-actions"><button type="submit" class="primary" data-testid="primary-action">Save settings ${icon('check')}</button></div></form></section>`;
}
