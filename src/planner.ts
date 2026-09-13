import { decide, hacks, isConnectionFeasible, matchOpportunities, scoreCandidates, sprintSeconds, stopTime, swissDateTime } from './engine';
import type { BoardEntry, Connection, Opportunity, PlanResult, Profile, Section, Stop, TransitClient, TripQuery } from './types';

const nowSeconds = () => Math.floor(Date.now() / 1000);
export function feederMode(section?: Section): 'tram' | 'bus' | 'train' | undefined {
  const category = section?.journey?.category?.toUpperCase();
  if (category === 'T' || category === 'TRAM') return 'tram';
  if (category === 'B' || category === 'BUS' || category === 'NFB') return 'bus';
  if (category && ['IC', 'ICN', 'IR', 'IRE', 'RE', 'R', 'S', 'EC', 'EN', 'ICE', 'TGV', 'RJ', 'RJX'].includes(category)) return 'train';
  return undefined;
}
const message = (error: unknown) => error instanceof Error ? error.message : 'Timetable unavailable. Please retry.';

function activeToday(windows: { from: string | null; to: string | null }[] | undefined, when: number): boolean {
  const { date } = swissDateTime(when);
  return !windows?.length || windows.some(window => (!window.from || window.from <= date) && (!window.to || window.to >= date));
}

/** Two route searches at most: SBB's full journey, then one search from the shortcut station. */
export async function planTrip(client: TransitClient, query: TripQuery, profile: Profile): Promise<PlanResult> {
  const connections = await client.connections({ ...query, limit: 6 });
  const baseline: PlanResult = {
    query, connections, candidates: [], reason: connections.length ? 'no-shortcut' : 'no-connections',
    updatedAt: nowSeconds(), fallback: connections[0], fallbackAtRisk: false,
  };
  if (!profile.offerSprintRoutes || !connections.length) return baseline;
  const opportunity = matchOpportunities(connections, hacks, query.when).sort((a, b) => a.alightTs - b.alightTs)[0];
  if (!opportunity) return baseline;
  if (opportunity.feeder && opportunity.alightTs < nowSeconds() - 60) return { ...baseline, reason: 'passed-stop' };
  baseline.opportunity = opportunity;
  baseline.fallback = opportunity.connection;
  const routes = opportunity.hack.routes.filter(route => route.helps !== 'never' && activeToday(route.validity, opportunity.alightTs));
  if (!routes.length) return { ...baseline, reason: 'hack-inactive' };
  const minSprint = Math.min(...routes.map(route => sprintSeconds(route, profile, opportunity.alightTs)));
  try {
    const candidates = await client.connections({
      from: opportunity.hack.station.id, to: query.to,
      when: Math.floor((opportunity.alightTs + minSprint) / 60) * 60, limit: 10,
    });
    if (opportunity.feeder && opportunity.alightTs < nowSeconds() - 60) return { ...baseline, opportunity: undefined, reason: 'passed-stop' };
    const scoringOpportunity = { ...opportunity, alightTs: Math.max(nowSeconds(), opportunity.alightTs) };
    return { ...baseline, ...decide(scoreCandidates(scoringOpportunity, candidates, profile)), updatedAt: nowSeconds() };
  } catch (error) {
    return { ...baseline, reason: 'candidate-lookup-failed', error: message(error) };
  }
}

function scheduledDeparture(stop: Stop): number {
  if (typeof stop.departureTimestamp === 'number') return stop.departureTimestamp;
  if (!stop.departure) return NaN;
  return Date.parse(stop.departure.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')) / 1000;
}

/** Stable across delays and platform changes. Never use predicted departure as trip identity. */
export function journeyKey(section: Section): string | undefined {
  const { journey, departure } = section;
  const scheduled = scheduledDeparture(departure);
  if (!journey?.number || !journey.to || !departure.station.id || !Number.isFinite(scheduled)) return undefined;
  return JSON.stringify([departure.station.id, journey.number, journey.to, scheduled]);
}

export interface RefreshOptions { running?: boolean; selectedJourney?: string }

/** A line number alone can match the next tram; its scheduled time and destination must also agree. */
export function matchBoardEntry(section: Section, stop: Stop, board: BoardEntry[]): BoardEntry | undefined {
  const journey = section.journey;
  const scheduled = scheduledDeparture(stop);
  if (!journey?.number || !journey.to || !Number.isFinite(scheduled)) return undefined;
  return board.find(entry => entry.number === journey.number && entry.to === journey.to && scheduledDeparture(entry.stop) === scheduled);
}

function applyBoardStop(stop: Stop, entry: BoardEntry): void {
  const update = entry.stop;
  const scheduled = scheduledDeparture(update);
  const delayS = stopTime(update, 'departure') - scheduled;
  const scheduledArrival = stop.arrivalTimestamp ?? (stop.arrival ? Date.parse(stop.arrival.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')) / 1000 : NaN);
  stop.delay = update.delay;
  if ('platform' in update) stop.platform = update.platform;
  stop.prognosis = {
    ...update.prognosis,
    departure: update.prognosis?.departure ?? null,
    arrival: update.prognosis?.arrival ?? (update.prognosis?.departure && Number.isFinite(scheduledArrival + delayS) ? new Date((scheduledArrival + delayS) * 1000).toISOString() : null),
  };
}

function updateTrain(connection: Connection, train: Section, entry: BoardEntry): void {
  applyBoardStop(train.departure, entry);
  if (connection.from.station.id === train.departure.station.id) applyBoardStop(connection.from, entry);
  // A board's pass list can refresh this train's arrival; it cannot predict an onward service.
  const destination = entry.passList?.find(stop => stop.station.id === train.arrival.station.id && Number.isFinite(stopTime(stop, 'arrival')));
  if (destination) {
    train.arrival = { ...train.arrival, ...destination };
    if (connection.sections.at(-1) === train) connection.to = train.arrival;
  }
}

function updateFallback(result: PlanResult, stationboard: BoardEntry[], running = false): void {
  const opportunity = result.opportunity;
  if (!opportunity) return;
  const { hack } = opportunity;
  const rideOn = hack.rideOn.find(stop => stop.id === opportunity.feeder?.arrival.station.id);
  const walkingStart = opportunity.kind === 'origin' && !running ? Math.max(nowSeconds(), opportunity.alightTs) : opportunity.alightTs;
  const readyAt = opportunity.kind === 'ride-past'
    ? opportunity.rideOnArrivalTs + (rideOn?.plannerWalkS ?? hack.alight.plannerWalkS)
    : walkingStart + hack.alight.plannerWalkS;
  const eligible = result.connections.filter(connection => {
    const train = connection.sections.find(section => section.journey && section.departure.station.id === hack.station.id);
    if (!train) return false;
    const entry = matchBoardEntry(train, train.departure, stationboard);
    if (entry) updateTrain(connection, train, entry);
    return stopTime(train.departure, 'departure') >= readyAt
      && isConnectionFeasible({ ...connection, sections: connection.sections.slice(connection.sections.indexOf(train)) });
  });
  result.fallbackAtRisk = stopTime(opportunity.baselineTrain.departure, 'departure') < readyAt
    || !isConnectionFeasible({ ...opportunity.connection,
      sections: opportunity.connection.sections.slice(opportunity.connection.sections.indexOf(opportunity.baselineTrain)),
    });
  const fallback = eligible[0];
  if (fallback && fallback !== opportunity.connection) {
    const access = opportunity.connection.sections.slice(0, opportunity.connection.sections.indexOf(opportunity.baselineTrain));
    const trainIndex = fallback.sections.findIndex(section => section.journey && section.departure.station.id === hack.station.id);
    result.fallback = { ...fallback, from: opportunity.connection.from, sections: [...structuredClone(access), ...fallback.sections.slice(trainIndex)] };
  } else result.fallback = fallback;
}

/** Refresh known trips from stationboards. No extra whole-journey search is hidden in the live loop. */
export async function refreshPlan(client: TransitClient, previous: PlanResult, profile: Profile, options: RefreshOptions = {}): Promise<PlanResult> {
  if (!previous.opportunity) return previous;
  const result = structuredClone(previous);
  const opportunity = result.opportunity!;
  const { hack } = opportunity;
  if (!options.running && opportunity.feeder && opportunity.alightTs < nowSeconds() - 60) {
    return { ...result, opportunity: undefined, candidates: [], recommended: undefined, risky: undefined, reason: 'passed-stop', error: undefined };
  }
  const selected = options.selectedJourney
    ? result.candidates.find(candidate => journeyKey(candidate.train) === options.selectedJourney)
    : result.recommended ?? result.risky ?? result.candidates[0];
  try {
    const [tramBoard, trainBoard] = await Promise.all([
      !options.running && opportunity.feeder && opportunity.alightStop
        ? client.stationboard({ id: hack.alight.id, limit: 12, mode: feederMode(opportunity.feeder) })
        : Promise.resolve([]),
      client.stationboard({ id: hack.station.id, when: opportunity.alightTs - 120, limit: 40, mode: 'train' }),
    ]);
    let complete = Boolean(selected);
    let feederLive = Boolean(opportunity.alightStop?.prognosis?.arrival || opportunity.alightStop?.prognosis?.departure);
    if (!options.running && opportunity.feeder && opportunity.alightStop) {
      const feeder = matchBoardEntry(opportunity.feeder, opportunity.alightStop, tramBoard);
      if (feeder) {
        const before = opportunity.alightTs;
        applyBoardStop(opportunity.alightStop, feeder);
        opportunity.alightTs = stopTime(opportunity.alightStop, 'arrival');
        if (!Number.isFinite(opportunity.alightTs)) opportunity.alightTs = stopTime(opportunity.alightStop, 'departure');
        const delta = opportunity.alightTs - before;
        opportunity.rideOnArrivalTs += delta;
        opportunity.feeder.arrival.prognosis = {
          ...opportunity.feeder.arrival.prognosis,
          arrival: new Date(opportunity.rideOnArrivalTs * 1000).toISOString(),
        };
        const shifted = new Set<Stop>([opportunity.feeder.arrival, opportunity.alightStop]);
        for (const section of opportunity.connection.sections) {
          if (section === opportunity.baselineTrain) break;
          if (section.walk == null) continue;
          for (const stop of [section.departure, section.arrival]) {
            if (shifted.has(stop)) continue;
            shifted.add(stop);
            const arrival = stopTime(stop, 'arrival');
            const departure = stopTime(stop, 'departure');
            stop.prognosis = { ...stop.prognosis,
              arrival: Number.isFinite(arrival) ? new Date((arrival + delta) * 1000).toISOString() : null,
              departure: Number.isFinite(departure) ? new Date((departure + delta) * 1000).toISOString() : null,
            };
          }
        }
        feederLive = Boolean(feeder.stop.prognosis?.arrival || feeder.stop.prognosis?.departure);
      } else complete = false;
    }
    for (const candidate of result.candidates) {
      const entry = matchBoardEntry(candidate.train, candidate.train.departure, trainBoard);
      if (entry) updateTrain(candidate.connection, candidate.train, entry);
      else if (candidate === selected) complete = false;
    }
    const selectedEntry = selected && matchBoardEntry(selected.train, selected.train.departure, trainBoard);
    opportunity.live = feederLive || Boolean(selectedEntry?.stop.prognosis?.arrival || selectedEntry?.stop.prognosis?.departure);
    // This stationboard cannot establish whether a later train/bus still connects.
    const onwardUnrefreshed = Boolean(selected?.connection.sections.slice(1).some(section => section.journey));
    if (onwardUnrefreshed) complete = false;
    // The baseline is not necessarily among the candidate results (limit 10).
    const baselineEntry = matchBoardEntry(opportunity.baselineTrain, opportunity.baselineTrain.departure, trainBoard);
    if (baselineEntry) updateTrain(opportunity.connection, opportunity.baselineTrain, baselineEntry);
    updateFallback(result, trainBoard, options.running);
    if (!options.running && opportunity.feeder && opportunity.alightTs < nowSeconds() - 60) {
      return { ...result, opportunity: undefined, candidates: [], recommended: undefined, risky: undefined, reason: 'passed-stop', error: undefined };
    }
    const scoringOpportunity = options.running ? opportunity : { ...opportunity, alightTs: Math.max(nowSeconds(), opportunity.alightTs) };
    const candidates = scoreCandidates(scoringOpportunity, result.candidates.map(candidate => candidate.connection), profile);
    const decision = options.selectedJourney
      ? { ...decide(candidates.filter(candidate => journeyKey(candidate.train) === options.selectedJourney)), candidates }
      : decide(candidates);
    return {
      ...result, ...decision,
      updatedAt: complete && selected ? nowSeconds() : previous.updatedAt,
      error: complete && selected ? undefined : onwardUnrefreshed
        ? 'The first train was checked; onward connections have not been refreshed. Refresh the full journey.'
        : 'Live trip could not be matched. Last confirmed times are shown.',
    };
  } catch (error) {
    return { ...result, updatedAt: previous.updatedAt, error: message(error) };
  }
}
