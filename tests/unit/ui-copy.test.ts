import { describe, expect, test } from 'bun:test';
import { arrivalText, journeyLabel } from '../../src/ui/common';
import { doneScreen, resultsScreen, tryScreen } from '../../src/ui/journey';
import { liveScreen } from '../../src/ui/live';
import { createMockClient } from '../../src/api/mock';
import { planTrip } from '../../src/planner';
import { DEFAULT_PROFILE, formatDuration } from '../../src/engine';

describe('travel copy reflects the actual service and budget', () => {
  test('API internal service names do not replace public line numbers', () => {
    // category/number/name copied from the recovered IWB API response.
    expect(journeyLabel({ category: 'IC', number: '3', name: '000563' })).toBe('IC 3');
    expect(journeyLabel({ category: 'T', number: '2', name: '002059' })).toBe('T 2');
  });
  test('spare after margin subtracts both sprint and margin on both offer screens', async () => {
    const client = createMockClient('happy');
    const result = await planTrip(client, { from: 'Zürich, Bellevue', to: 'Bern', when: Date.now() / 1000 }, DEFAULT_PROFILE);
    const c = result.recommended!;
    const spare = formatDuration(c.haveS - c.sprintS - c.marginS);
    expect(resultsScreen(result, false)).toContain(`<strong>${spare}</strong> spare after margin`);
    expect(tryScreen(result)).toContain(`<strong class="green">${spare}</strong>`);
  });
});

test('bus and origin shortcuts use the correct arrival instruction', async () => {
  const now = Date.now() / 1000;
  const result = await planTrip(createMockClient('happy'), { from: 'Zürich, Bellevue', to: 'Bern', when: now }, DEFAULT_PROFILE);
  result.opportunity!.feeder!.journey!.category = 'BUS';
  expect(arrivalText(result, now)).toStartWith('Bus arrives in');
  expect(liveScreen(result, result.recommended!, now, false)).not.toContain('Tram arrives');
  delete result.opportunity!.feeder;
  expect(arrivalText(result, now)).toStartWith('Start in');
  expect(liveScreen(result, result.recommended!, now, false)).toContain('START AT');
  expect(resultsScreen(result, false)).toContain('Start at <strong>');
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
