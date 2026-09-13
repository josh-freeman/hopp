import type { Connection, Journey } from '../types';
import { stopTime } from './time';

// Explicit rail categories keep bus/tram/boat departures at a station out of sprint offers.
// Unknown categories remain in the ordinary planner list until their route data is supported.
const railCategories = new Set(['IC', 'IR', 'RE', 'R', 'S', 'SN', 'ICE', 'EC', 'EN', 'RJ', 'RJX',
  'TGV', 'TER', 'NJ', 'PE', 'EXT', 'D', 'RB', 'REX', 'IRE', 'REG', 'REGIO', 'TRAIN']);
export function isTrainJourney(journey?: Journey | null): boolean {
  return Boolean(journey?.category && railCategories.has(journey.category.trim().toUpperCase()));
}

/** Realtime delays can break an onward transfer even when the first train is catchable. */
export function isConnectionFeasible(connection: Connection): boolean {
  let readyAt = -Infinity;
  let station: string | null | undefined;
  for (const section of connection.sections) {
    if (station && section.departure.station.id !== station) return false;
    const departure = stopTime(section.departure, 'departure');
    const arrival = stopTime(section.arrival, 'arrival');
    if (!Number.isFinite(departure) || !Number.isFinite(arrival) || arrival < departure) return false;
    if (section.journey) {
      if (departure < readyAt) return false;
      readyAt = arrival;
    } else if (section.walk != null) {
      readyAt = Math.max(readyAt, departure) + arrival - departure;
    } else return false;
    station = section.arrival.station.id;
  }
  return true;
}
