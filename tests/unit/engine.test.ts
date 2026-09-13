import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_PROFILE, decide, formatDuration, formatTime, hacks, isActive, isPeak, marginSeconds,
  matchOpportunities, parsePlatform, routeFor, scoreCandidates, sprintFrom5k, sprintFromVma,
  sprintSeconds, stopTime, swissDateTime, walkSeconds,
} from '../../src/engine';
import { HackSchema, type Hack } from '../../src/schema/hack';
import type { Connection, Opportunity, Section, Stop } from '../../src/types';

const offPeak = Date.parse('2026-09-13T12:00:00+02:00') / 1000;
const mondayPeak = Date.parse('2026-09-14T08:00:00+02:00') / 1000;
const zurich = hacks.find(hack => hack.id === 'zurich-hb.central')!;
const basel = hacks.find(hack => hack.id === 'basel-sbb.iwb')!;
const stop = (id: string, ts: number, platform: string | null = null): Stop => ({
  station: { id, name: id }, arrivalTimestamp: ts, departureTimestamp: ts, platform,
});
function train(departure: number, arrival: number, platform: string | null = '20'): Connection {
  const section: Section = { departure: stop(basel.station.id, departure, platform),
    arrival: stop('8503000', arrival), journey: { number: '700', category: 'IC', to: 'Zürich HB' } };
  return { from: section.departure, to: section.arrival, sections: [section] };
}
function baseline(kind: 'ride-past' | 'walk' | 'origin' = 'ride-past'): Connection {
  const alight = stop(basel.alight.id, offPeak + 120);
  const rideOn = stop(basel.rideOn[0]!.id, offPeak + 300);
  const feeder: Section = { departure: stop('origin', offPeak + 60), arrival: kind === 'walk' ? alight : rideOn,
    journey: { number: '2', category: 'T', passList: [stop('origin', offPeak + 60), alight, rideOn] } };
  const walk: Section = { departure: kind === 'origin' ? stop(basel.alight.id, offPeak) : feeder.arrival,
    arrival: stop(basel.station.id, offPeak + 660), walk: { duration: 360 } };
  const onward = train(offPeak + 700, offPeak + 4300, '11').sections[0]!;
  const sections = kind === 'origin' ? [walk, onward] : [feeder, walk, onward];
  return { from: sections[0]!.departure, to: onward.arrival, sections };
}
function opportunity(): Opportunity {
  return matchOpportunities([baseline()], [basel], offPeak)[0]!;
}

describe('time and validity', () => {
  test('prognosis overrides scheduled delay; ISO offsets and unix seconds agree', () => {
    const sample = stop('a', offPeak);
    sample.delay = 2;
    expect(stopTime(sample, 'arrival')).toBe(offPeak + 120);
    sample.prognosis = { arrival: '2026-09-13T12:03:00+0200' };
    expect(stopTime(sample, 'arrival')).toBe(offPeak + 180);
    sample.prognosis.arrival = 'broken';
    expect(stopTime(sample, 'arrival')).toBe(offPeak + 120);
    expect(stopTime({ station: sample.station, departure: '2026-09-13T12:00:00+0200' }, 'departure')).toBe(offPeak);
    expect(stopTime({ station: sample.station, departureTimestamp: NaN, departure: '2026-09-13T12:00:00+0200' }, 'departure')).toBe(offPeak);
  });
  test('Swiss time handles summer/winter offsets and midnight', () => {
    expect(swissDateTime(offPeak)).toEqual({ date: '2026-09-13', time: '12:00' });
    expect(formatTime(Date.parse('2026-01-13T11:00:00Z') / 1000)).toBe('12:00');
    expect(swissDateTime(Date.parse('2026-09-13T22:00:00Z') / 1000)).toEqual({ date: '2026-09-14', time: '00:00' });
    expect(formatDuration(183.1)).toBe('3:04');
    expect(formatDuration(Infinity)).toBe('—');
  });
  test('validity dates are inclusive in Swiss local time', () => {
    expect(isActive(zurich.validity, offPeak)).toBe(true);
    expect(isActive(zurich.validity, Date.parse('2026-12-12T23:00:00Z') / 1000)).toBe(false);
    expect(isActive(zurich.rideOn[2]!.validity, offPeak)).toBe(false);
    expect(isActive(zurich.rideOn[2]!.validity, Date.parse('2026-12-13T12:00:00Z') / 1000)).toBe(true);
  });
});

describe('sprint and margin model', () => {
  test('single default sprint speed has updated golden times; walking remains comparison', () => {
    expect(DEFAULT_PROFILE.sprintMps).toBe(3.5);
    expect(sprintSeconds(routeFor(zurich, 11)!, DEFAULT_PROFILE, offPeak)).toBeCloseTo(183.595238, 5);
    expect(walkSeconds(routeFor(zurich, 11)!, offPeak)).toBeCloseTo(404.320988, 5);
    expect(sprintSeconds(routeFor(basel, 20)!, DEFAULT_PROFILE, offPeak)).toBeCloseTo(94.142857, 5);
  });
  test('peaks affect halls/platforms on weekdays, not street/ramp or weekends', () => {
    expect(isPeak(mondayPeak)).toBe(true);
    expect(isPeak(Date.parse('2026-09-14T09:00:00+02:00') / 1000)).toBe(false);
    expect(isPeak(Date.parse('2026-09-13T08:00:00+02:00') / 1000)).toBe(false);
    expect(sprintSeconds(routeFor(basel, 20)!, DEFAULT_PROFILE, mondayPeak))
      .toBe(sprintSeconds(routeFor(basel, 20)!, DEFAULT_PROFILE, offPeak));
    expect(sprintSeconds(routeFor(zurich, 11)!, DEFAULT_PROFILE, mondayPeak)).toBeCloseTo(199.220238, 5);
  });
  test('bag slows sprint and VMA/5k derive one speed', () => {
    expect(sprintSeconds(routeFor(basel, 20)!, { ...DEFAULT_PROFILE, bag: true }, offPeak)).toBeCloseTo(104.474548, 5);
    expect(sprintFromVma(16)).toBeCloseTo(3.333333, 5);
    expect(sprintFrom5k(22 * 60)).toBeCloseTo(3.087945, 5);
  });
  test('margin honours user minimum and scheduled-only buffer', () => {
    expect(marginSeconds(100, DEFAULT_PROFILE, true)).toBe(65);
    expect(marginSeconds(100, DEFAULT_PROFILE, false)).toBe(95);
    expect(marginSeconds(100, { ...DEFAULT_PROFILE, minMarginS: 90 }, true)).toBe(110);
    expect(marginSeconds(400, DEFAULT_PROFILE, true)).toBe(80);
  });
});

describe('platform parsing and schema', () => {
  test('sectors and slash platforms resolve only to one known group', () => {
    expect(parsePlatform('16A-C')).toEqual({ number: 16, numbers: [16], sector: 'A-C' });
    expect(routeFor(zurich, '41/42')?.key).toBe('museumstrasse');
    expect(routeFor(basel, '7CD')?.key).toBe('g5-12');
    expect(routeFor(basel, '19/20')).toBeUndefined();
    expect(routeFor(zurich, '11/31')).toBeUndefined();
    expect(routeFor(basel, '13')).toBeUndefined();
    expect(parsePlatform(null).number).toBeUndefined();
    expect(parsePlatform('platform?').number).toBeUndefined();
  });
  test('schema rejects uncertain high confidence, overlapping groups, impossible dates', () => {
    const uncertain = structuredClone(basel);
    uncertain.routes[0]!.confidence = 'high';
    expect(HackSchema.safeParse(uncertain).success).toBe(false);
    const overlapping = structuredClone(basel);
    overlapping.routes[1]!.platforms = [20];
    expect(HackSchema.safeParse(overlapping).success).toBe(false);
    const invalid = structuredClone(basel);
    invalid.validity[0]!.to = '2026-02-31';
    expect(HackSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('matching opportunities', () => {
  test.each(['ride-past', 'walk', 'origin'] as const)('matches %s and preserves real SBB baseline', kind => {
    const connection = baseline(kind);
    const matches = matchOpportunities([connection], [basel], offPeak);
    expect(matches).toHaveLength(1);
    expect(matches[0]!.kind).toBe(kind);
    expect(matches[0]!.alightTs).toBe(kind === 'origin' ? offPeak : offPeak + 120);
    expect(matches[0]!.connection).toBe(connection);
    expect(matches[0]!.baselineTrain.departure.platform).toBe('11');
  });
  test('uses alight prognosis without depending on line number', () => {
    const connection = baseline();
    const feeder = connection.sections[0]!;
    feeder.journey!.number = 'T2-variant';
    feeder.journey!.passList![1]!.prognosis = { arrival: new Date((offPeak + 180) * 1000).toISOString() };
    const result = matchOpportunities([connection], [basel], offPeak)[0]!;
    expect(result.alightTs).toBe(offPeak + 180);
    expect(result.live).toBe(true);
  });
  test('station departures by bus or unknown mode never match a sprint-to-train opportunity', () => {
    for (const category of ['B', 'T', 'BAT', 'FUN', undefined]) {
      const connection = baseline();
      connection.sections[2]!.journey!.category = category;
      expect(matchOpportunities([connection], [basel], offPeak)).toHaveLength(0);
    }
  });
  test('rejects unrelated transfers, earlier passed stops, disabled/expired/draft data', () => {
    const disconnected = baseline();
    disconnected.sections[1]!.departure.station.id = 'elsewhere';
    expect(matchOpportunities([disconnected], [basel], offPeak)).toHaveLength(0);
    const intervening = baseline();
    intervening.sections[1]!.journey = { number: '99' };
    expect(matchOpportunities([intervening], [basel], offPeak)).toHaveLength(0);
    expect(matchOpportunities([baseline()], [basel], offPeak + 300)).toHaveLength(0);
    for (const status of ['disabled', 'draft'] as const) {
      expect(matchOpportunities([baseline()], [{ ...basel, status }], offPeak)).toHaveLength(0);
    }
    const expired: Hack = { ...basel, validity: [{ from: null, to: '2026-09-12', note: 'Closed' }] };
    expect(matchOpportunities([baseline()], [expired], offPeak)).toHaveLength(0);
  });
});

describe('candidate scoring and honest decisions', () => {
  test('GO must beat actual final arrival; earlier departure alone never qualifies', () => {
    const opp = opportunity();
    const candidates = scoreCandidates(opp, [train(offPeak + 400, offPeak + 4500), train(offPeak + 500, offPeak + 3500)], DEFAULT_PROFILE);
    expect(decide(candidates).recommended?.departureTs).toBe(offPeak + 500);
    expect(decide(scoreCandidates(opp, [train(offPeak + 400, offPeak + 4300)], DEFAULT_PROFILE)).recommended).toBeUndefined();
  });
  test('margin boundaries give GO, RISKY, NO and only GO headlines', () => {
    const opp = { ...opportunity(), live: true };
    const sprint = sprintSeconds(routeFor(basel, 20)!, DEFAULT_PROFILE, opp.alightTs);
    const score = (have: number) => scoreCandidates(opp, [train(opp.alightTs + have, offPeak + 3500)], DEFAULT_PROFILE)[0]!;
    expect(score(sprint + 65 + 0.001).band).toBe('GO');
    expect(score(sprint + 0.001).band).toBe('RISKY');
    expect(score(sprint - 0.001).band).toBe('NO');
    expect(decide([score(sprint + 1)]).recommended).toBeUndefined();
    expect(decide([score(sprint + 1)]).risky).toBeDefined();
    expect(scoreCandidates(opp, [train(opp.alightTs + sprint + 70, offPeak + 3500)], { ...DEFAULT_PROFILE, minMarginS: 90 })[0]!.band).toBe('RISKY');
  });
  test('unknown platform capped at RISKY; missing group and never routes stay NO', () => {
    const opp = opportunity();
    const score = (platform: string | null) => scoreCandidates(opp, [train(offPeak + 1000, offPeak + 3500, platform)], DEFAULT_PROFILE)[0]!;
    expect(score(null).band).toBe('RISKY');
    expect(score('13').band).toBe('NO');
    expect(score('2').band).toBe('NO');
    expect(score('19/20').band).toBe('NO');
    expect(score('20').band).toBe('GO');
  });
  test('expired routes and switched-off offers cannot recommend', () => {
    const opp = structuredClone(opportunity());
    opp.hack.routes.find(route => route.key === 'g20')!.validity = [{ from: null, to: '2026-09-12', note: 'Ramp closed' }];
    expect(scoreCandidates(opp, [train(offPeak + 500, offPeak + 3500)], DEFAULT_PROFILE)[0]!.band).toBe('NO');
    expect(scoreCandidates(opportunity(), [train(offPeak + 500, offPeak + 3500)], { ...DEFAULT_PROFILE, offerSprintRoutes: false })[0]!.band).toBe('NO');
  });
  test('keeps onward connections but rejects different destinations and leading walks', () => {
    const opp = opportunity();
    const onward = train(offPeak + 500, offPeak + 3500);
    onward.sections.push({ departure: onward.to, arrival: stop('destination', offPeak + 4000), journey: { category: 'B' } });
    onward.to = onward.sections[1]!.arrival;
    expect(scoreCandidates(opp, [onward], DEFAULT_PROFILE)).toHaveLength(0);
    opp.connection.to = stop('destination', offPeak + 5000);
    expect(scoreCandidates(opp, [onward], DEFAULT_PROFILE)[0]!.gainS).toBe(1000);
    onward.sections.unshift({ departure: stop('nearby', offPeak), arrival: onward.from, walk: {} });
    expect(scoreCandidates(opp, [onward], DEFAULT_PROFILE)).toHaveLength(0);
  });
  test('candidate first leg must be rail, while onward bus connections remain eligible', () => {
    const opp = opportunity();
    for (const category of ['B', 'T', 'BAT', undefined]) {
      const candidate = train(offPeak + 500, offPeak + 3500);
      candidate.sections[0]!.journey!.category = category;
      expect(scoreCandidates(opp, [candidate], DEFAULT_PROFILE)).toHaveLength(0);
    }
  });
  test('a delayed train cannot recommend a missed onward connection', () => {
    const opp = opportunity();
    opp.connection.to = stop('destination', offPeak + 5000);
    const candidate = train(offPeak + 500, offPeak + 3500);
    const transfer: Section = { departure: candidate.to, arrival: stop('bus-stop', offPeak + 3560), walk: {} };
    const bus: Section = { departure: stop('bus-stop', offPeak + 3620), arrival: stop('destination', offPeak + 4000), journey: { category: 'B' } };
    candidate.sections.push(transfer, bus);
    candidate.to = bus.arrival;
    expect(scoreCandidates(opp, [candidate], DEFAULT_PROFILE)[0]!.band).toBe('GO');
    // The timetable's walk is still 60 s; a 90 s train delay leaves too little transfer time.
    candidate.sections[0]!.arrival = { ...candidate.sections[0]!.arrival, prognosis: { arrival: new Date((offPeak + 3590) * 1000).toISOString() } };
    expect(scoreCandidates(opp, [candidate], DEFAULT_PROFILE)[0]!.band).toBe('NO');
  });
});
