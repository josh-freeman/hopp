import type { Connection, Hack, Opportunity, Section, Stop } from '../types';
import { stopTime } from './time';
import { isActive } from './validity';
import { isTrainJourney } from './journeys';

function hasLive(stop: Stop): boolean {
  return Boolean(stop.prognosis?.arrival || stop.prognosis?.departure);
}
function connectionLive(connection: Connection): boolean {
  return connection.sections.some(section => hasLive(section.departure) || hasLive(section.arrival)
    || section.journey?.passList?.some(hasLive));
}

/** Only allow a continuous walking transfer between the feeder and station train. */
function nextTrain(sections: Section[], fromIndex: number, fromId: string, stationId: string): Section | undefined {
  let position = fromId;
  for (let index = fromIndex; index < sections.length; index++) {
    const section = sections[index]!;
    if (section.departure.station.id !== position) return undefined;
    if (section.journey) return position === stationId && isTrainJourney(section.journey) ? section : undefined;
    if (section.walk == null) return undefined;
    position = section.arrival.station.id ?? '';
  }
  return undefined;
}

export function matchOpportunities(connections: Connection[], hacks: Hack[], queryTs: number): Opportunity[] {
  const results: Opportunity[] = [];
  if (!Number.isFinite(queryTs)) return results;
  for (const connection of connections) {
    if (!Number.isFinite(stopTime(connection.to, 'arrival'))) continue;
    for (const hack of hacks) {
      if (hack.status === 'disabled' || hack.status === 'draft' || !isActive(hack.validity, queryTs)) continue;
      const first = connection.sections[0];
      if (first?.walk != null && !first.journey && connection.from.station.id === hack.alight.id) {
        const train = nextTrain(connection.sections, 0, hack.alight.id, hack.station.id);
        if (train) results.push({ hack, kind: 'origin', connection, baselineTrain: train,
          alightTs: queryTs, rideOnArrivalTs: queryTs, live: connectionLive(connection), alightStop: first.departure });
        continue;
      }
      for (let index = 0; index < connection.sections.length; index++) {
        const feeder = connection.sections[index]!;
        if (!feeder.journey) continue;
        const arrivalId = feeder.arrival.station.id;
        const rideOn = hack.rideOn.find(stop => stop.id === arrivalId && isActive(stop.validity, queryTs));
        const walkingFromAlight = arrivalId === hack.alight.id;
        if ((!rideOn && !walkingFromAlight) || !arrivalId) continue;
        const train = nextTrain(connection.sections, index + 1, arrivalId, hack.station.id);
        if (!train) continue;
        const passList = feeder.journey.passList ?? [];
        const pass = walkingFromAlight ? feeder.arrival : passList.find(stop => stop.station.id === hack.alight.id
          && stopTime(stop, 'arrival') >= stopTime(feeder.departure, 'departure')
          && stopTime(stop, 'arrival') <= stopTime(feeder.arrival, 'arrival'));
        if (!pass) continue;
        const alightTs = stopTime(pass, 'arrival');
        const rideOnArrivalTs = stopTime(feeder.arrival, 'arrival');
        if (!Number.isFinite(alightTs) || !Number.isFinite(rideOnArrivalTs)
          || alightTs < queryTs - 60 || !isActive(hack.validity, alightTs)) continue;
        results.push({ hack, kind: walkingFromAlight ? 'walk' : 'ride-past', connection, baselineTrain: train,
          alightTs, rideOnArrivalTs, live: connectionLive(connection), feeder, alightStop: pass });
      }
    }
  }
  const unique = new Map<string, Opportunity>();
  for (const opportunity of results.sort((a, b) => a.alightTs - b.alightTs
    || stopTime(a.connection.to, 'arrival') - stopTime(b.connection.to, 'arrival'))) {
    const key = `${opportunity.hack.id}:${opportunity.alightTs}`;
    if (!unique.has(key)) unique.set(key, opportunity);
  }
  return [...unique.values()];
}
