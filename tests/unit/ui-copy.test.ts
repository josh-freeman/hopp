import { describe, expect, test } from 'bun:test';
import { arrivalText, journeyLabel } from '../../src/ui/common';
import { doneScreen, resultsScreen } from '../../src/ui/journey';
import { liveScreen } from '../../src/ui/live';
import { createMockClient } from '../../src/api/mock';
import { planTrip } from '../../src/planner';
import { DEFAULT_PROFILE } from '../../src/engine';

const durationSeconds = (value: string) => {
  const [minutes, seconds] = value.split(':').map(Number);
  return minutes * 60 + seconds;
};

describe('travel copy reflects the actual service and budget', () => {
  test('API internal service names do not replace public line numbers', () => {
    // category/number/name copied from the recovered IWB API response.
    expect(journeyLabel({ category: 'IC', number: '3', name: '000563' })).toBe('IC 3');
    expect(journeyLabel({ category: 'T', number: '2', name: '002059' })).toBe('T 2');
  });
  test('the integrated offer displays its full budget and subtracts sprint plus margin from spare', async () => {
    const client = createMockClient('happy');
    const result = await planTrip(client, { from: 'Zürich, Bellevue', to: 'Bern', when: Date.now() / 1000 }, DEFAULT_PROFILE);
    const c = result.recommended!;
    const html = resultsScreen(result, false);
    const budget = html.match(/data-testid="verdict-budget">([\s\S]*?)<\/p>/)?.[1] ?? '';
    const displayed = [...budget.matchAll(/<strong>(\d+:\d{2})<\/strong>/g)].map(match => durationSeconds(match[1]));
    expect(displayed).toHaveLength(3);
    [c.haveS, c.sprintS, c.marginS].forEach((seconds, index) => {
      expect(Math.abs(displayed[index] - seconds)).toBeLessThanOrEqual(0.5);
    });
    const spareText = html.match(/class="offer-spare">[\s\S]*?<strong>(\d+:\d{2})<\/strong>/)?.[1];
    expect(spareText).toBeDefined();
    expect(Math.abs(durationSeconds(spareText!) - (displayed[0] - displayed[1] - displayed[2]))).toBeLessThanOrEqual(2);
    expect(html).toContain('to spare');
  });
  test('the matching route is visible before a single Go live action', async () => {
    const result = await planTrip(createMockClient('happy'), { from: 'Zürich, Bellevue', to: 'Bern', when: Date.now() / 1000 }, DEFAULT_PROFILE);
    const html = resultsScreen(result, false);
    const routeIndex = html.indexOf('class="integrated-route"');
    const mapIndex = html.indexOf('class="route-map"', routeIndex);
    const liveIndex = html.indexOf('data-action="live"');
    expect(routeIndex).toBeGreaterThan(-1);
    expect(mapIndex).toBeGreaterThan(routeIndex);
    expect(liveIndex).toBeGreaterThan(mapIndex);
    expect(html).toContain('Directions');
    expect(html).toContain('Bahnhofbrücke');
    expect(html).toContain('Route notes and sources');
    expect(html.match(/data-testid="primary-action"/g)).toHaveLength(1);
    expect(html).toContain('Go live');
    expect(html).not.toMatch(/data-action="(?:try|detail|route)"/);
  });
  test('early alighting is explicit only when the regular plan rides past the shortcut stop', async () => {
    const now = Math.floor(Date.now() / 1000);
    const result = await planTrip(createMockClient('happy', now), { from: 'Zürich, Bellevue', to: 'Bern', when: now }, DEFAULT_PROFILE);
    expect(result.opportunity!.kind).toBe('ride-past');
    const html = resultsScreen(result, false);
    const heading = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1].replace(/<[^>]+>/g, '');
    expect(heading).toBe('Get off early at Central');
    expect(html).toContain('Before Bahnhofplatz/HB');
    expect(liveScreen(result, result.recommended!, now, false)).toContain('GET OFF EARLY AT');

    // A walking transfer begins at the feeder's actual arrival stop; the user
    // changes the station approach, not the stop at which they leave the tram.
    result.opportunity!.kind = 'walk';
    result.opportunity!.feeder!.arrival = structuredClone(result.opportunity!.alightStop!);
    const walkHtml = resultsScreen(result, false);
    const walkHeading = walkHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1].replace(/<[^>]+>/g, '');
    expect(walkHeading).toBe('Get off at Central');
    expect(walkHtml).not.toContain('offer-regular-stop');
    const walkLive = liveScreen(result, result.recommended!, now, false);
    expect(walkLive).toContain('GET OFF AT');
    expect(walkLive).not.toContain('GET OFF EARLY AT');
  });
});

test('bus and origin shortcuts use the correct arrival instruction', async () => {
  const now = Date.now() / 1000;
  const result = await planTrip(createMockClient('happy'), { from: 'Zürich, Bellevue', to: 'Bern', when: now }, DEFAULT_PROFILE);
  result.opportunity!.feeder!.journey!.category = 'BUS';
  expect(arrivalText(result, now)).toStartWith('Your stop in');
  expect(liveScreen(result, result.recommended!, now, false)).not.toContain('Tram arrives');
  delete result.opportunity!.feeder;
  result.opportunity!.kind = 'origin';
  expect(arrivalText(result, now)).toStartWith('Start in');
  expect(liveScreen(result, result.recommended!, now, false)).toContain('START AT');
  const html = resultsScreen(result, false);
  const heading = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1].replace(/<[^>]+>/g, '');
  expect(heading).toBe('Start at Central');
  expect(html).not.toContain('offer-regular-stop');
  expect(html).not.toContain('Get off');
});

test('platform confirmation preserves the selected train after its recommendation changes', async () => {
  const now = Date.now() / 1000;
  const result = await planTrip(createMockClient('happy'), { from: 'Zürich, Bellevue', to: 'Bern', when: now }, DEFAULT_PROFILE);
  const selected = structuredClone(result.recommended!);
  selected.train.journey!.number = '799';
  result.recommended = undefined;
  const html = doneScreen(result, selected);
  expect(html).toContain('IC 799');
  expect(html).not.toContain('IC 701');
  const origin = { ...result, opportunity: { ...result.opportunity!, feeder: undefined, alightTs: now - 61 } };
  expect(liveScreen(origin, selected, now, false)).not.toContain('STAY ON');
  expect(liveScreen(origin, selected, now, false)).not.toContain('Stop has passed');
});
