import type { Candidate, Hack } from '../types';
import { esc, icon } from './html';
import { shortStop } from './common';
import mapManifest from '../../data/map-manifest.json';
export function routeVisualization(h: Hack, c: Candidate): string {
  const osm = `https://www.openstreetmap.org/?mlat=${h.alight.lat}&mlon=${h.alight.lon}#map=17/${h.alight.lat}/${h.alight.lon}`;
  const mapFile = `${h.id}.${c.route?.key}.svg`;
  const areaMap = mapManifest.includes(mapFile);
  const visual = areaMap ? `<figure class="route-map"><img src="${import.meta.env.BASE_URL}maps/${esc(mapFile)}" alt="Area map of ${esc(h.station.name)}: ${esc(h.alight.name)} and ${c.route?.landing ? `Platform ${esc(c.platform)} access` : 'station centre'}"/><figcaption>A ${esc(shortStop(h.alight.name))} → B ${c.route?.landing ? `Platform ${esc(c.platform)} entrance` : 'station centre · platform access not mapped'} · © OpenStreetMap contributors · <a class="route-map-link" href="${osm}" target="_blank" rel="noopener">Open map ${icon('arrow')}</a></figcaption></figure>`
    : `<div class="route-diagram" role="img" aria-label="Route overview from ${esc(h.alight.name)} via ${esc(h.station.name)} to Platform ${esc(c.platform)}"><span>${icon('pin')} ${esc(shortStop(h.alight.name))}</span><i></i><span>${esc(h.station.name)}</span><i></i><span>${icon('train')} Platform ${esc(c.platform)}</span><small>Route overview · not to scale</small></div>`;
  return visual;
}

export function integratedRoute(h: Hack, c: Candidate, timing = ''): string {
  return `<section class="integrated-route" aria-labelledby="integrated-route-heading"><h3 id="integrated-route-heading">On foot, A to B</h3>${routeVisualization(h, c)}${timing}<div class="route-directions"><h3>Directions</h3><p>${esc(h.instructions)}</p></div></section>`;
}

export function routeNotes(h: Hack, c: Candidate): string {
  return `<details class="route-notes"><summary>Route notes and sources</summary>${c.route ? `<p><strong>${esc(c.route.label)}</strong></p><p>${esc(c.route.note)}</p>` : ''}<p>${h.validity.map(v => esc(v.note)).join(' ')}</p>${h.fieldCheckNeeded.length ? `<h3>Checks still needed</h3><ul>${h.fieldCheckNeeded.map(check => `<li>${esc(check)}</li>`).join('')}</ul>` : ''}<h3>Sources</h3><ul class="route-sources">${h.sources.map(source => `<li>${sourceLink(source)}</li>`).join('')}</ul></details>`;
}

function sourceLink(source: string): string {
  if (!/^https?:\/\//.test(source)) return esc(source);
  try {
    const url = new URL(source);
    return `<a href="${esc(url.href)}" target="_blank" rel="noopener">${esc(url.hostname + url.pathname)}${url.search ? ' · research query' : ''}</a>`;
  } catch { return esc(source); }
}
