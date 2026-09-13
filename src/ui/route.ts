import type { Hack, PlanResult } from '../types';
import { esc, icon, primary, button, safety } from './html';
import { shortStop } from './common';
export function routeScreen(result: PlanResult): string {
  const h = result.opportunity!.hack, c = result.recommended!, isZurich = h.id === 'zurich-hb.central';
  const osm = `https://www.openstreetmap.org/?mlat=${h.alight.lat}&mlon=${h.alight.lon}#map=17/${h.alight.lat}/${h.alight.lon}`;
  return `<section class="screen route-screen" data-screen="route" data-testid="screen"><p class="eyebrow">Route preview</p><h1>${esc(shortStop(h.alight.name))}<span class="red"> →</span><br>Platform ${esc(c.platform)}</h1>
    ${isZurich ? `<figure class="route-map"><img src="${import.meta.env.BASE_URL}zurich-central-run.jpg" alt="OpenStreetMap overview: Central via the north sidewalk of Bahnhofbrücke and Bahnhofquai to the east entrance of Zürich HB"/><figcaption>Surface approach only · final platform access varies<br>© OpenStreetMap contributors</figcaption></figure>` : `<div class="route-diagram" role="img" aria-label="Route overview from ${esc(h.alight.name)} to ${esc(c.route?.label)}"><span>${icon('pin')} ${esc(shortStop(h.alight.name))}</span><i></i><span>${esc(h.station.name)}</span><i></i><span>${icon('train')} ${esc(c.route?.label)}</span><small>Route overview · not to scale</small></div>`}
    <a class="text-link" href="${osm}" target="_blank" rel="noopener">Open the area in OpenStreetMap ${icon('arrow')}</a><div class="route-directions"><h2>Directions</h2><p>${esc(h.instructions)}</p></div><p class="notice">Not yet checked on foot. If a crossing or entrance is closed, use your regular connection.</p>${button('Route notes and sources', 'shortcut', 'text-button')}${safety}<div class="bottom-actions">${primary('View sprint details', 'detail')}</div></section>`;
}
export function shortcutScreen(result: PlanResult): string {
  const h = result.opportunity!.hack;
  return `<section class="screen" data-screen="shortcut" data-testid="screen"><h1>Route notes</h1><p class="lead">${esc(h.alight.name)} → ${esc(h.station.name)}</p>${hackCard(h)}${safety}<div class="bottom-actions">${primary('Back to sprint details', 'detail')}</div></section>`;
}
function hackCard(h: Hack): string {
  return `<article class="panel hack-card"><div class="offer-label">${icon('run')} ${esc(h.station.name)}</div><h2>${esc(shortStop(h.alight.name))} → the station</h2><span class="tag">Desk researched · not timed on foot</span><p>${esc(h.instructions)}</p><details><summary>Platform access and checks</summary><ul>${h.routes.map(r => `<li><strong>${esc(r.label)}</strong><p>${esc(r.note)}</p></li>`).join('')}</ul><h3>Before relying on this route</h3><ul>${h.fieldCheckNeeded.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p>${h.validity.map(v => esc(v.note)).join(' ')}</p><h3>Sources</h3><ul class="route-sources">${h.sources.map(source => `<li>${sourceLink(source)}</li>`).join('')}</ul></details></article>`;
}

function sourceLink(source: string): string {
  if (!/^https?:\/\//.test(source)) return esc(source);
  try {
    const url = new URL(source);
    return `<a href="${esc(url.href)}" target="_blank" rel="noopener">${esc(url.hostname + url.pathname)}${url.search ? ' · research query' : ''}</a>`;
  } catch { return esc(source); }
}
