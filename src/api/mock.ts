import type { BoardEntry, Connection, ConnectionQuery, Location, Section, Stop, TransitClient } from '../types';
import { ApiBusyError, ApiError } from './client';
import fixtures from '../../data/fixtures/scenarios.json';

export const MOCK_PROVENANCE = fixtures.provenance;
export type MockScenario = keyof typeof fixtures.scenarios;
const iso = (ts: number) => new Date(ts * 1000).toISOString();
const clone = <T>(value: T): T => structuredClone(value);
const locations: Location[] = [
  { id: '8588078', name: 'Zürich, Central', coordinate: { x: 47.376833, y: 8.543937 } },
  { id: '8587340', name: 'Zürich, Bellevue', coordinate: { x: 47.366857, y: 8.545792 } },
  { id: '8503000', name: 'Zürich HB', coordinate: { x: 47.377847, y: 8.540502 } },
  { id: '8500160', name: 'Basel, IWB', coordinate: { x: 47.546673, y: 7.584368 } },
  { id: '8589340', name: 'Basel, Margarethen', coordinate: { x: 47.543325, y: 7.589516 } },
  { id: '8500010', name: 'Basel SBB', coordinate: { x: 47.547403, y: 7.589564 } },
  { id: '8507000', name: 'Bern', coordinate: { x: 46.948825, y: 7.439122 } },
  { id: '8505000', name: 'Luzern', coordinate: { x: 47.0502, y: 8.3103 } },
];
const normal = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function location(value: string): Location {
  return locations.find(station => station.id === value || normal(station.name) === normal(value)) ?? { id: value, name: value };
}
function stop(station: Location, arrival: number, departure = arrival, platform: string | null = null): Stop {
  return { station, arrival: iso(arrival), departure: iso(departure), arrivalTimestamp: arrival, departureTimestamp: departure,
    delay: 0, platform, prognosis: { arrival: iso(arrival), departure: iso(departure), platform: null } };
}
function train(from: Location, to: Location, departure: number, arrival: number, number: string, platform: string | null): Connection {
  const first = stop(from, departure, departure, platform);
  const last = stop(to, arrival, arrival, '4');
  const section: Section = { departure: first, arrival: last,
    journey: { name: `IC ${number}`, category: 'IC', number, to: to.name, passList: [first, last] } };
  return { from: first, to: last, sections: [section], products: [`IC ${number}`] };
}

/** Synthetic demo data only. No method performs a network request. */
export function createMockClient(scenario: string = 'happy', now = Math.floor(Date.now() / 1000)): TransitClient {
  const mode: MockScenario = scenario in fixtures.scenarios ? scenario as MockScenario : 'happy';
  let alightTs = now + 60;
  let basel = false;
  let feederSection: Section | undefined;
  let baselineConnections: Connection[] = [];
  let candidateConnections: Connection[] = [];
  let livePolls = 0;

  function checkError() {
    if (mode === 'ratelimit') throw new ApiBusyError(60, 200);
    if (mode === 'offline') throw new ApiError('Unable to reach the timetable. Check your connection and retry.');
  }

  function prepare(query: ConnectionQuery) {
    basel = /basel|iwb|margarethen/.test(normal(query.from)) || ['8500160', '8589340'].includes(query.from);
    const station = location(basel ? '8500010' : '8503000');
    const alight = location(basel ? '8500160' : '8588078');
    const origin = location(query.from);
    const destination = location(query.to);
    const isOrigin = origin.id === alight.id;
    alightTs = mode === 'passed' ? now - 120 : Math.max(query.when, now) + (isOrigin ? 0 : 60);
    const haveS = basel ? 185 : 300;
    const platform = mode === 'unknown' ? null : basel ? '20' : '11';
    const quick = train(station, destination, alightTs + haveS, alightTs + 3600, '701', platform);
    const regular = train(station, destination, alightTs + 660, alightTs + 4200, '703', basel ? '11' : '12');
    const next = train(station, destination, alightTs + 1260, alightTs + 4800, '705', basel ? '11' : '12');
    candidateConnections = [quick, clone(regular), clone(next)];
    const rideOn = { id: basel ? '8578143' : '8587348', name: basel ? 'Basel, Bahnhof SBB' : 'Zürich, Bahnhofplatz/HB' };
    const rideS = basel ? 180 : 120;
    const walkS = basel ? 360 : 420;
    const alightStop = stop(alight, alightTs, alightTs + 10, basel ? 'A' : 'H');
    feederSection = isOrigin ? undefined : {
      departure: stop(origin, alightTs - 60), arrival: stop(rideOn, alightTs + rideS),
      journey: { category: 'T', name: basel ? 'T 2' : 'T 10', number: basel ? '2' : '10',
        to: basel ? 'Basel, Eglisee' : 'Zürich Flughafen, Fracht',
        passList: [stop(origin, alightTs - 60), alightStop, stop(rideOn, alightTs + rideS)] },
    };
    const access: Section[] = isOrigin
      ? [{ departure: stop(alight, alightTs), arrival: stop(station, alightTs + (basel ? 480 : 540)), walk: {} }]
      : [feederSection!, { departure: stop(rideOn, alightTs + rideS), arrival: stop(station, alightTs + rideS + walkS), walk: { duration: walkS } }];
    baselineConnections = [regular, next].map(connection => ({
      ...connection, from: access[0].departure, sections: [...clone(access), ...connection.sections], products: [basel ? 'T 2' : 'T 10', ...connection.products!],
    }));
    if (mode === 'nohack') baselineConnections = [train(origin, destination, now + 300, now + 3900, '703', '5')];
  }

  return {
    async connections(query) {
      checkError();
      if (candidateConnections.length && query.from === (basel ? '8500010' : '8503000')) return clone(candidateConnections);
      prepare(query);
      return clone(baselineConnections);
    },
    async locations(query) {
      checkError();
      if (typeof query === 'string') return clone(locations.filter(station => normal(station.name).includes(normal(query)) || station.id === query));
      return clone(locations.map(station => ({ ...station,
        distance: Math.hypot((station.coordinate!.x - query.lat) * 111_000, (station.coordinate!.y - query.lon) * 75_000),
      })).sort((a, b) => a.distance - b.distance));
    },
    async stationboard(query) {
      checkError();
      if (mode === 'missing') return [];
      if (!candidateConnections.length) {
        prepare({ from: query.id === '8500160' ? 'Basel, Margarethen' : 'Zürich, Bellevue', to: query.id === '8500160' ? 'Bern' : 'Basel SBB', when: now });
      }
      if (query.id === (basel ? '8500160' : '8588078')) {
        livePolls++;
        if (!feederSection?.journey) return [];
        const alight = clone(feederSection.journey.passList![1]);
        if (mode === 'late' && livePolls > 0) {
          alight.delay = 5;
          alight.prognosis = { arrival: iso(alightTs + 300), departure: iso(alightTs + 310), platform: null };
        }
        return [{ ...clone(feederSection.journey), stop: alight }];
      }
      return clone(candidateConnections.map(connection => ({ ...connection.sections[0].journey!, stop: connection.sections[0].departure })));
    },
  };
}
