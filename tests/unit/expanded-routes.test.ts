import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { HackSchema } from '../../src/schema/hack';
import { matchOpportunities } from '../../src/engine/match';
import { DEFAULT_PROFILE, sprintSeconds } from '../../src/engine/pace';
import { decide, scoreCandidates } from '../../src/engine/score';
import { formatTime, stopTime } from '../../src/engine/time';
import type { Connection } from '../../src/types';

// Verbatim public API responses captured 2026-09-13 for travel on 2026-09-14/15.
// Source URLs and path evidence: docs/research/expansion/northeast.md.
const cases = [
  { id: 'nyon.centre-ville', fixture: 'root-nyon-centre-geneve', stop: '8593874', station: '8501030', covered: '1', uncovered: '2', walkS: 300 },
  { id: 'winterthur.archstrasse', fixture: 'ne-conn-winter-arch', stop: '8594298', station: '8506000', covered: '3', uncovered: '4', walkS: 420 },
  { id: 'chur.post-i', fixture: 'ne-conn-chur-post', stop: '8571313', station: '8509000', covered: '2', uncovered: '1', walkS: 240 },
  { id: 'zurich-hb.sihlpost', fixture: 'ne-conn-zh-sihlpost', stop: '8591367', station: '8503000', covered: '3', uncovered: '32', walkS: 540 },
  { id: 'zurich-oerlikon.bahnhof-nord', fixture: 'ne-conn-oerlikon-nord', stop: '8591062', station: '8503006', covered: '8', uncovered: '3', walkS: 240 },
];

for (const row of cases) {
  const hack = HackSchema.parse(JSON.parse(readFileSync(new URL(`../../data/hacks/${row.id}.json`, import.meta.url), 'utf8')));
  const capture = JSON.parse(readFileSync(new URL(`../../data/research/raw/${row.fixture}.json`, import.meta.url), 'utf8'));
  const connections = capture.connections as Connection[];
  const baseline = connections[0]!;
  const when = stopTime(baseline.sections[0]!.departure, 'departure');
  const opportunity = () => matchOpportunities(connections, [hack], when)[0]!;
  // Preserve real onward legs and timestamps, removing only the initial walking transfer.
  const stationConnections = connections.map(connection => ({
    ...connection,
    from: connection.sections[1]!.departure,
    sections: connection.sections.slice(1),
  }));
  const withPlatform = (platform: string): Connection => {
    const connection = structuredClone(stationConnections[0]!);
    const departure = connection.sections[0]!.departure;
    departure.platform = platform;
    if (departure.prognosis) departure.prognosis.platform = null;
    return connection;
  };

  describe(`expanded route ${row.id}`, () => {
    test('matches the actual stop and railway station with the captured walking budget', () => {
      expect(baseline.from.station.id).toBe(row.stop);
      expect(baseline.sections[0]!.departure.station.id).toBe(row.stop);
      expect(baseline.sections[0]!.arrival.station.id).toBe(row.station);
      expect(baseline.sections[1]!.departure.station.id).toBe(row.station);
      expect(stopTime(baseline.sections[0]!.arrival, 'arrival') - when).toBe(row.walkS);
      expect(hack.alight.plannerWalkS).toBe(row.walkS);
      const matches = matchOpportunities(connections, [hack], when);
      expect(matches).toHaveLength(1);
      expect(matches[0]!.kind).toBe('origin');
      expect(matches[0]!.baselineTrain.departure.station.id).toBe(row.station);
    });

    test('a real station match never supplies an unresearched platform route', () => {
      const candidate = scoreCandidates(opportunity(), [withPlatform(row.uncovered)], DEFAULT_PROFILE)[0]!;
      expect(candidate.route).toBeUndefined();
      expect(candidate.band).toBe('NO');
      expect(decide([candidate]).recommended).toBeUndefined();
    });

    test('captured onward services do not imply an earlier arrival', () => {
      const actualScores = scoreCandidates(opportunity(), stationConnections, DEFAULT_PROFILE);
      expect(actualScores).toHaveLength(stationConnections.length);
      expect(actualScores.every(candidate => candidate.gainS <= 0)).toBe(true);
      expect(decide(actualScores).recommended).toBeUndefined();
      // Deliberately vary only the platform to exercise timing independently of
      // incomplete coverage. This is a policy probe, not another API capture.
      const sameArrival = scoreCandidates(opportunity(), [withPlatform(row.covered)], DEFAULT_PROFILE)[0]!;
      expect(sameArrival.band).toBe('GO');
      expect(sameArrival.gainS).toBe(0);
      expect(decide([sameArrival]).recommended).toBeUndefined();
      expect(decide([sameArrival]).reason).toBe('no-earlier-train');
    });
  });
}

describe('recorded earlier-connection probes', () => {
  const hack = HackSchema.parse(JSON.parse(readFileSync(new URL('../../data/hacks/winterthur.archstrasse.json', import.meta.url), 'utf8')));
  const capture = (name: string): Connection[] => JSON.parse(readFileSync(new URL(`../../data/research/raw/${name}.json`, import.meta.url), 'utf8')).connections;

  test('Archstrasse at 08:04 can reach Aarau 23 minutes earlier on actual captured services', () => {
    const when = Date.parse('2026-09-15T08:04:00+02:00') / 1000;
    const baseline = capture('ne-gain-arch-aarau-baseline-0804');
    const trains = capture('ne-gain-arch-aarau-candidates-0806');
    const opportunity = matchOpportunities(baseline, [hack], when)[0]!;
    expect(formatTime(stopTime(opportunity.connection.to, 'arrival'))).toBe('09:28');
    // This is the same earliest-arrival rounding used by planTrip, and the
    // candidate capture's actual request time. Neither response is modified.
    const queryAt = Math.floor((when + sprintSeconds(hack.routes[0]!, DEFAULT_PROFILE, when)) / 60) * 60;
    expect(formatTime(queryAt)).toBe('08:06');
    const decision = decide(scoreCandidates(opportunity, trains, DEFAULT_PROFILE));
    const recommended = decision.recommended!;
    expect(recommended).toBeDefined();
    expect(recommended.band).toBe('GO');
    expect(recommended.platform).toBe('3');
    expect(recommended.train.journey!.category).toBe('S');
    expect(recommended.train.journey!.number).toBe('11');
    expect(formatTime(recommended.departureTs)).toBe('08:09');
    expect(formatTime(recommended.arrivalTs)).toBe('09:05');
    expect(recommended.connection.to.station.id).toBe('8502113');
    expect(recommended.gainS).toBe(23 * 60);
    expect(recommended.haveS).toBe(300);
    expect(Math.ceil(recommended.sprintS + recommended.marginS)).toBe(255);
    expect(recommended.connection.sections[1]!.journey!.number).toBe('37');
    expect(recommended.connection.sections[1]!.departure.platform).toBe('16');
  });

  test('an actual earlier Bern train on uncovered Gleis 4 remains unavailable', () => {
    const when = Date.parse('2026-09-15T08:28:00+02:00') / 1000;
    const baseline = capture('ne-gain-arch-baseline-0828');
    const trains = capture('ne-gain-arch-candidates-0828');
    const opportunity = matchOpportunities(baseline, [hack], when)[0]!;
    const scores = scoreCandidates(opportunity, trains, DEFAULT_PROFILE);
    const earlier = scores.filter(candidate => candidate.gainS > 0);
    expect(earlier).toHaveLength(2);
    expect(earlier.every(candidate => candidate.platform === '4' && candidate.band === 'NO')).toBe(true);
    expect(decide(scores).recommended).toBeUndefined();
  });
});
