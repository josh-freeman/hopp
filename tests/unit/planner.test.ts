import { describe, expect, spyOn, test } from 'bun:test';
import { createMockClient } from '../../src/api/mock';
import { DEFAULT_PROFILE, sprintSeconds } from '../../src/engine';
import { journeyKey, matchBoardEntry, planTrip, refreshPlan } from '../../src/planner';
import { liveScreen } from '../../src/ui/live';
import type { ConnectionQuery, TransitClient } from '../../src/types';

const now = Math.floor(Date.now() / 1000);
const query = { from: 'Zürich, Bellevue', to: 'Basel SBB', when: now };

describe('planner and live refresh', () => {
  test('queries at floor(alight + minimum sprint), retains baseline and recommends a sprint-only gain', async () => {
    const calls: ConnectionQuery[] = [];
    const mock = createMockClient('happy', now);
    const result = await planTrip({ ...mock, connections: q => { calls.push(q); return mock.connections(q); } }, query, DEFAULT_PROFILE);
    expect(calls.length).toBe(2);
    expect(calls[0].limit).toBe(6);
    expect(calls[1].limit).toBe(10);
    const minimum = Math.min(...result.opportunity!.hack.routes.filter(route => route.helps !== 'never').map(route => sprintSeconds(route, DEFAULT_PROFILE, result.opportunity!.alightTs)));
    expect(calls[1].when).toBe(Math.floor((result.opportunity!.alightTs + minimum) / 60) * 60);
    expect(result.recommended?.band).toBe('GO');
    expect(result.recommended!.gainS).toBeGreaterThanOrEqual(300);
    expect(result.recommended!.walkS).toBeGreaterThan(result.recommended!.haveS);
    expect(result.connections.length).toBeGreaterThan(0);
    expect(result.fallback).toBeDefined();
  });

  test('Basel origin fixture also needs a sprint and offers an earlier train', async () => {
    const result = await planTrip(createMockClient('happy', now), { from: 'Basel, IWB', to: 'Bern', when: now }, DEFAULT_PROFILE);
    expect(result.opportunity?.kind).toBe('origin');
    expect(result.recommended?.band).toBe('GO');
    expect(result.recommended!.walkS).toBeGreaterThan(result.recommended!.haveS);
  });

  test('candidate failure keeps valid SBB connections and fallback', async () => {
    const mock = createMockClient('happy', now);
    let count = 0;
    const client: TransitClient = { ...mock, connections: q => ++count === 1 ? mock.connections(q) : Promise.reject(new Error('Busy')) };
    const result = await planTrip(client, query, DEFAULT_PROFILE);
    expect(result.connections.length).toBeGreaterThan(0);
    expect(result.fallback).toBeDefined();
    expect(result.error).toBe('Busy');
    expect(result.recommended).toBeUndefined();
  });

  test('no supported hack or user opt-out uses only the baseline lookup', async () => {
    for (const [scenario, profile] of [['nohack', DEFAULT_PROFILE], ['happy', { ...DEFAULT_PROFILE, offerSprintRoutes: false }]] as const) {
      let calls = 0;
      const mock = createMockClient(scenario, now);
      const result = await planTrip({ ...mock, connections: q => { calls++; return mock.connections(q); } }, query, profile);
      expect(calls).toBe(1);
      expect(result.recommended).toBeUndefined();
      expect(result.connections.length).toBeGreaterThan(0);
    }
  });

  test('late tram removes GO and selects a later SBB fallback', async () => {
    const mock = createMockClient('late', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    expect(first.recommended?.band).toBe('GO');
    const refreshed = await refreshPlan(mock, first, DEFAULT_PROFILE);
    expect(refreshed.recommended).toBeUndefined();
    expect(refreshed.fallbackAtRisk).toBe(true);
    expect(refreshed.fallback).toBeDefined();
    expect(refreshed.fallback!.to.arrivalTimestamp).toBeGreaterThan(first.fallback!.to.arrivalTimestamp!);
    expect(first.opportunity!.alightTs).toBe(now + 60);
  });

  test('platform changes re-score the route and clear an unsupported recommendation', async () => {
    const mock = createMockClient('happy', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    const client: TransitClient = { ...mock, stationboard: async q => {
      const board = await mock.stationboard(q);
      if (q.mode === 'train') board[0].stop.prognosis!.platform = '99';
      return board;
    } };
    const next = await refreshPlan(client, first, DEFAULT_PROFILE);
    expect(next.candidates[0].platform).toBe('99');
    expect(next.candidates[0].band).toBe('NO');
    expect(next.recommended).toBeUndefined();
  });

  test('missing chosen train and same-line wrong departure cannot stamp live data fresh', async () => {
    const mock = createMockClient('happy', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    first.updatedAt = now - 90;
    const client: TransitClient = { ...mock, stationboard: async q => {
      const board = await mock.stationboard(q);
      if (q.mode === 'train') board[0].stop.departureTimestamp! += 600;
      return board;
    } };
    const next = await refreshPlan(client, first, DEFAULT_PROFILE);
    expect(next.updatedAt).toBe(first.updatedAt);
    expect(next.error).toContain('could not be matched');
    const blank = await refreshPlan({ ...mock, stationboard: async () => [] }, first, DEFAULT_PROFILE);
    expect(blank.updatedAt).toBe(first.updatedAt);
    expect(blank.fallback).toBeDefined();
  });

  test('passed-stop guard removes the offer and preserves the connection list', async () => {
    const mock = createMockClient('happy', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    first.opportunity!.alightTs = now - 61;
    const next = await refreshPlan(mock, first, DEFAULT_PROFILE);
    expect(next.opportunity).toBeUndefined();
    expect(next.recommended).toBeUndefined();
    expect(next.reason).toBe('passed-stop');
    expect(next.connections.length).toBe(first.connections.length);
  });

  test('a past departure search cannot initially offer a sprint at a stop already passed', async () => {
    const past = now - 600;
    const mock = createMockClient('happy', past);
    let count = 0;
    const result = await planTrip({ ...mock, connections: q => { count++; return mock.connections(q); } }, { ...query, when: past }, DEFAULT_PROFILE);
    expect(result.recommended).toBeUndefined();
    expect(result.opportunity).toBeUndefined();
    expect(result.reason).toBe('passed-stop');
    expect(count).toBe(1);
  });

  test('running keeps the route after passing the stop and only refreshes the train', async () => {
    const mock = createMockClient('happy', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    first.opportunity!.alightTs = now - 61;
    const boards: string[] = [];
    const next = await refreshPlan({ ...mock, stationboard: q => { boards.push(q.id); return mock.stationboard(q); } }, first, DEFAULT_PROFILE, { running: true });
    expect(next.opportunity).toBeDefined();
    expect(next.reason).not.toBe('passed-stop');
    expect(boards).toEqual(['8503000']);
  });

  test('unpublished platforms never become a GO recommendation', async () => {
    const result = await planTrip(createMockClient('unknown', now), query, DEFAULT_PROFILE);
    expect(result.recommended).toBeUndefined();
    expect(result.candidates[0].band).not.toBe('GO');
  });

  test('trip identity also requires the exact destination', async () => {
    const mock = createMockClient('happy', now);
    const result = await planTrip(mock, query, DEFAULT_PROFILE);
    const board = await mock.stationboard({ id: '8503000', mode: 'train' });
    const train = result.recommended!.train;
    expect(matchBoardEntry(train, train.departure, board)).toBeDefined();
    board[0].to = 'Different terminus';
    expect(matchBoardEntry(train, train.departure, board)).toBeUndefined();
  });

  test('live selection stays on the original train when a different GO remains available', async () => {
    const mock = createMockClient('happy', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    const original = first.recommended!;
    const selectedJourney = journeyKey(original.train)!;
    const alternate = structuredClone(original);
    alternate.train.journey!.number = '702';
    alternate.train.journey!.name = 'IC 702';
    alternate.train.departure.departureTimestamp! += 30;
    alternate.train.departure.departure = new Date(alternate.train.departure.departureTimestamp! * 1000).toISOString();
    alternate.train.departure.prognosis!.departure = alternate.train.departure.departure;
    first.candidates.push(alternate);
    const client: TransitClient = { ...mock, stationboard: async q => {
      const board = await mock.stationboard(q);
      if (q.mode === 'train') {
        board[0].stop.prognosis!.platform = '99';
        board.push({ ...structuredClone(alternate.train.journey!), stop: structuredClone(alternate.train.departure) });
      }
      return board;
    } };
    const next = await refreshPlan(client, first, DEFAULT_PROFILE, { selectedJourney });
    expect(next.candidates.find(candidate => candidate.train.journey?.number === '702')?.band).toBe('GO');
    expect(next.recommended).toBeUndefined();
    expect(next.candidates.find(candidate => journeyKey(candidate.train) === selectedJourney)?.platform).toBe('99');
    const again = await refreshPlan(client, next, DEFAULT_PROFILE, { selectedJourney });
    expect(again.recommended).toBeUndefined();
  });

  test('journey keys survive delay/platform changes and distinguish destinations and scheduled times', async () => {
    const result = await planTrip(createMockClient('happy', now), query, DEFAULT_PROFILE);
    const train = structuredClone(result.recommended!.train);
    const key = journeyKey(train);
    train.departure.prognosis = { departure: new Date((now + 900) * 1000).toISOString(), platform: '99' };
    expect(journeyKey(train)).toBe(key);
    train.journey!.to = 'Different destination';
    expect(journeyKey(train)).not.toBe(key);
    train.journey!.to = result.recommended!.train.journey!.to;
    train.departure.departureTimestamp! += 60;
    expect(journeyKey(train)).not.toBe(key);
  });

  test('empty live boards cannot revive a stale countdown, including while running', async () => {
    const mock = createMockClient('missing', now);
    const first = await planTrip(mock, { ...query, when: now + 600 }, DEFAULT_PROFILE);
    const original = first.recommended!;
    first.updatedAt = now - 121;
    for (const running of [false, true]) {
      const next = await refreshPlan(mock, first, DEFAULT_PROFILE, { running, selectedJourney: journeyKey(original.train) });
      expect(next.updatedAt).toBe(first.updatedAt);
      expect(next.error).toContain('could not be matched');
      const selected = next.candidates.find(candidate => journeyKey(candidate.train) === journeyKey(original.train))!;
      const html = liveScreen(next, selected, now, running);
      expect(html).toContain('Updates paused');
      expect(html).toContain('aria-label="Countdown paused"');
      expect(html).not.toContain('data-action="start-run"');
      expect(html).not.toContain('data-action="done"');
    }
  });

  test('scheduled-only boards retain the extra uncertainty margin even if unrelated trains have predictions', async () => {
    const mock = createMockClient('happy', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    const client: TransitClient = { ...mock, stationboard: async q => {
      const board = await mock.stationboard(q);
      if (q.mode === 'tram') board[0].stop.prognosis = null;
      else board[0].stop.prognosis = null;
      return board;
    } };
    const next = await refreshPlan(client, first, DEFAULT_PROFILE, { selectedJourney: journeyKey(first.recommended!.train) });
    expect(next.opportunity!.live).toBe(false);
    expect(next.candidates[0].live).toBe(false);
    expect(next.candidates[0].marginS).toBe(first.candidates[0].marginS + 30);
  });

  test('refreshing the first train cannot stamp an unrefreshed onward connection fresh', async () => {
    const mock = createMockClient('happy', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    first.updatedAt = now - 90;
    const selected = first.recommended!;
    const oldDestination = structuredClone(selected.train.arrival);
    selected.train.arrival = { ...structuredClone(oldDestination), station: { id: '8507000', name: 'Bern' } };
    const onwardDeparture = { ...structuredClone(selected.train.arrival), departureTimestamp: oldDestination.arrivalTimestamp! + 120,
      prognosis: { departure: new Date((oldDestination.arrivalTimestamp! + 120) * 1000).toISOString() } };
    const onwardArrival = { ...oldDestination, arrivalTimestamp: oldDestination.arrivalTimestamp! + 300,
      prognosis: { arrival: new Date((oldDestination.arrivalTimestamp! + 300) * 1000).toISOString() } };
    selected.connection.sections.push({ departure: onwardDeparture, arrival: onwardArrival, journey: { number: '44', category: 'B', to: oldDestination.station.name } });
    selected.connection.to = onwardArrival;
    const next = await refreshPlan(mock, first, DEFAULT_PROFILE, { selectedJourney: journeyKey(selected.train) });
    expect(next.updatedAt).toBe(first.updatedAt);
    expect(next.error).toContain('onward connections have not been refreshed');
  });

  test('a fallback with a known missed onward service is replaced by the next usable train', async () => {
    const mock = createMockClient('happy', now);
    const first = await planTrip(mock, query, DEFAULT_PROFILE);
    const baseline = first.opportunity!.connection;
    const train = first.opportunity!.baselineTrain;
    const before = train.arrival.arrivalTimestamp!;
    train.arrival = { ...train.arrival, station: { id: '8507000', name: 'Bern' } };
    const departure = { ...structuredClone(train.arrival), departureTimestamp: before + 60,
      prognosis: { departure: new Date((before + 60) * 1000).toISOString() } };
    const arrival = { ...structuredClone(baseline.to), arrivalTimestamp: before + 900,
      prognosis: { arrival: new Date((before + 900) * 1000).toISOString() } };
    baseline.sections.push({ departure, arrival, journey: { number: '44', category: 'B', to: arrival.station.name } });
    baseline.to = arrival;
    const client: TransitClient = { ...mock, stationboard: async q => {
      const board = await mock.stationboard(q);
      if (q.mode === 'train') {
        const entry = board.find(item => item.number === train.journey!.number)!;
        entry.passList = [entry.stop, { ...structuredClone(train.arrival),
          prognosis: { arrival: new Date((before + 300) * 1000).toISOString() } }];
      }
      return board;
    } };
    const next = await refreshPlan(client, first, DEFAULT_PROFILE);
    expect(next.fallbackAtRisk).toBe(true);
    expect(next.fallback?.sections.find(section => section.journey?.category === 'IC')?.journey?.number).toBe('705');
  });
});


test('bus and rail feeders do not use a tram-only live stationboard', async () => {
  const { feederMode } = await import('../../src/planner');
  const section = (category: string) => ({ journey: { category }, departure: { station: { id: '1', name: 'A' } }, arrival: { station: { id: '2', name: 'B' } } });
  expect(feederMode(section('BUS'))).toBe('bus');
  expect(feederMode(section('T'))).toBe('tram');
  expect(feederMode(section('TGV'))).toBe('train');
  expect(feederMode(section('FUN'))).toBeUndefined();
});

test('origin starts remain eligible after a minute when current time still leaves the full margin', async () => {
  const now = Math.floor(Date.now() / 1000);
  const mock = createMockClient('happy', now);
  const first = await planTrip(mock, { from: 'Basel, IWB', to: 'Zürich HB', when: now }, DEFAULT_PROFILE);
  expect(first.opportunity!.kind).toBe('origin');
  first.opportunity!.alightTs = now - 61;
  const next = await refreshPlan(mock, first, DEFAULT_PROFILE);
  expect(next.opportunity).toBeDefined();
  expect(next.reason).not.toBe('passed-stop');
  expect(next.recommended).toBeDefined();
  expect(next.recommended!.haveS).toBeLessThanOrEqual(next.recommended!.departureTs - now);
});

test('an origin fallback needs the full walk from the current time before starting', async () => {
  const now = Math.floor(Date.now() / 1000);
  const mock = createMockClient('happy', now);
  const first = await planTrip(mock, { from: 'Basel, IWB', to: 'Zürich HB', when: now }, DEFAULT_PROFILE);
  const clock = spyOn(Date, 'now').mockReturnValue((now + 240) * 1000);
  try {
    const next = await refreshPlan(mock, first, DEFAULT_PROFILE);
    expect(next.fallbackAtRisk).toBe(true);
    expect(next.fallback?.sections.find(section => section.journey)?.journey?.number).toBe('705');
    const running = await refreshPlan(mock, first, DEFAULT_PROFILE, { running: true });
    expect(running.fallbackAtRisk).toBe(false);
    expect(running.fallback?.sections.find(section => section.journey)?.journey?.number).toBe('703');
  } finally { clock.mockRestore(); }
});
