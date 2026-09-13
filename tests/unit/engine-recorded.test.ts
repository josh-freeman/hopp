import { describe, expect, test } from 'bun:test';
import recordedBaseline from './fixtures/engine-margarethen-zurich-2026-09-14.json';
import recordedCandidates from './fixtures/engine-basel-zurich-candidates-2026-09-14.json';
import { DEFAULT_PROFILE, decide, formatTime, hacks, matchOpportunities, scoreCandidates } from '../../src/engine';
import type { Connection } from '../../src/types';

// Verbatim API captures recovered from Claude's 2026-09-13 research; see fixtures/README.md.
const baseline = recordedBaseline.connections as unknown as Connection[];
const candidates = recordedCandidates.connections as unknown as Connection[];
const queryTs = Date.parse('2026-09-14T08:15:00+02:00') / 1000;

describe('recorded transport.opendata.ch responses', () => {
  test('real Margarethen connection detects the IWB stop before the station transfer', () => {
    const opportunity = matchOpportunities(baseline, hacks, queryTs)[0]!;
    expect(opportunity).toBeDefined();
    expect(opportunity.hack.id).toBe('basel-sbb.iwb');
    expect(opportunity.kind).toBe('ride-past');
    expect(formatTime(opportunity.alightTs)).toBe('08:24');
    expect(opportunity.alightStop!.station.id).toBe('8500160');
    expect(opportunity.baselineTrain.journey!.category).toBe('IC');
    expect(opportunity.baselineTrain.departure.platform).toBe('11');
  });
  test('earliest genuinely catchable train is the baseline; no invented gain is offered', () => {
    const opportunity = matchOpportunities(baseline, hacks, queryTs)[0]!;
    const scores = scoreCandidates(opportunity, candidates, DEFAULT_PROFILE);
    expect(scores).toHaveLength(4);
    expect(formatTime(scores[0]!.departureTs)).toBe('08:33');
    expect(scores[0]!.band).toBe('GO');
    expect(scores[0]!.gainS).toBe(0);
    expect(decide(scores).recommended).toBeUndefined();
    expect(decide(scores).reason).toBe('no-earlier-train');
  });
});
