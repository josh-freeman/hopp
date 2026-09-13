import { describe, expect, test } from 'bun:test';
import bern from '../../data/hacks/bern.hirschengraben.json';
import biel from '../../data/hacks/biel.place-guisan.json';
import geneve from '../../data/hacks/geneve.lyon.json';
import neuchatel from '../../data/hacks/neuchatel.gare-nord.json';
import bernCapture from '../../data/research/raw/west-bern-hirschengraben-connections.json';
import bielCapture from '../../data/research/raw/west-biel-place-guisan-connections.json';
import geneveCapture from '../../data/research/raw/west-geneve-lyon-connections.json';
import neuchatelCapture from '../../data/research/raw/west-neuchatel-gare-nord-connections.json';
import research from '../../data/research/regions/west.json';
import { HackSchema } from '../../src/schema/hack';
import { DEFAULT_PROFILE, decide, matchOpportunities, scoreCandidates, stopTime } from '../../src/engine';
import type { Connection, Hack } from '../../src/types';

// Genuine API captures made 2026-09-13 for Monday 2026-09-14 08:00.
// Exact URLs and the distinction between captures/models are in docs/research/expansion/west.md.
const queryTs = Date.parse('2026-09-14T08:00:00+02:00') / 1000;
const cases = [
  { data: bern, capture: bernCapture, stop: '8579896', station: '8507000', budget: 540, unsupported: '1' },
  { data: biel, capture: bielCapture, stop: '8587619', station: '8504300', budget: 420, unsupported: '9' },
  { data: geneve, capture: geneveCapture, stop: '8592850', station: '8501008', budget: 420, unsupported: '2' },
  { data: neuchatel, capture: neuchatelCapture, stop: '8579625', station: '8504221', budget: 240, unsupported: '1' },
];

function railwayPart(connection: Connection, hack: Hack): Connection {
  const index = connection.sections.findIndex(section => section.journey && section.departure.station.id === hack.station.id);
  expect(index).toBeGreaterThanOrEqual(0);
  const sections = structuredClone(connection.sections.slice(index));
  return { ...connection, from: sections[0]!.departure, sections };
}

for (const item of cases) {
  const hack = HackSchema.parse(item.data);
  const connections = item.capture.connections as unknown as Connection[];
  describe(`${hack.id}: recorded western access`, () => {
    test('matches the actual stop-to-railway walk and retains its real budget', () => {
      const opportunity = matchOpportunities(connections, [hack], queryTs)[0]!;
      expect(opportunity).toBeDefined();
      expect(opportunity.kind).toBe('origin');
      expect(opportunity.alightStop!.station.id).toBe(item.stop);
      expect(opportunity.baselineTrain.departure.station.id).toBe(item.station);
      const walk = connections[0]!.sections[0]!;
      expect(walk.journey).toBeNull();
      expect(stopTime(walk.arrival, 'arrival') - stopTime(walk.departure, 'departure')).toBe(item.budget);
      expect(hack.alight.plannerWalkS).toBe(item.budget);
    });

    test('does not turn the recorded baseline into an invented earlier arrival', () => {
      const opportunity = matchOpportunities(connections, [hack], queryTs)[0]!;
      const candidate = railwayPart(opportunity.connection, hack);
      const scores = scoreCandidates(opportunity, [candidate], DEFAULT_PROFILE);
      expect(scores).toHaveLength(1);
      expect(scores[0]!.gainS).toBe(0);
      expect(decide(scores).recommended).toBeUndefined();
    });

    test('rejects an uncovered platform instead of borrowing another platform access', () => {
      const opportunity = matchOpportunities(connections, [hack], queryTs)[0]!;
      const candidate = railwayPart(opportunity.connection, hack);
      // Deliberate mutation of a real capture: platform changes outside verified coverage.
      candidate.sections[0]!.departure.platform = item.unsupported;
      candidate.sections[0]!.departure.prognosis = { platform: item.unsupported };
      const score = scoreCandidates(opportunity, [candidate], DEFAULT_PROFILE)[0]!;
      expect(score.band).toBe('NO');
      expect(score.route).toBeUndefined();
      expect(score.reason).toContain('No researched route');
    });
  });
}

test('western research retains dated provenance and keeps unresolved entrances out of active data', () => {
  expect(research).toHaveLength(9);
  expect(research.filter(record => 'activeHackId' in record).map(record => record.activeHackId).sort())
    .toEqual(cases.map(item => item.data.id).sort());
  for (const record of research) {
    expect(record.sources.length).toBeGreaterThanOrEqual(2);
    expect(record.sources.every(source => source.checkedAt === '2026-09-13' && source.url.startsWith('https://'))).toBe(true);
  }
  expect(research.find(record => record.id === 'bern.bubenberg-future')!.status).toBe('needs-check');
  expect(research.find(record => record.id === 'lausanne.georgette')!.status).toBe('needs-check');
  expect(research.find(record => record.id === 'fribourg.richemond')!.status).toBe('not-useful');
});

test('Neuchâtel excludes the announced festival period and all west data expires for review', () => {
  const hack = HackSchema.parse(neuchatel);
  const connections = neuchatelCapture.connections as unknown as Connection[];
  expect(matchOpportunities(connections, [hack], Date.parse('2026-09-26T08:00:00+02:00') / 1000)).toEqual([]);
  for (const item of cases) {
    expect(matchOpportunities(item.capture.connections as unknown as Connection[], [HackSchema.parse(item.data)],
      Date.parse('2026-12-13T08:00:00+01:00') / 1000)).toEqual([]);
  }
});
