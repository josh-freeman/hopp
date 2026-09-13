import type { Band, Candidate, Connection, Decision, Opportunity, Profile } from '../types';
import { marginSeconds, sprintSeconds, walkSeconds } from './pace';
import { parsePlatform, routeFor } from './platforms';
import { stopTime } from './time';
import { isActive } from './validity';
import { isConnectionFeasible, isTrainJourney } from './journeys';

export function scoreCandidates(opportunity: Opportunity, connections: Connection[], profile: Profile): Candidate[] {
  const { hack, alightTs } = opportunity;
  const baselineArrival = stopTime(opportunity.connection.to, 'arrival');
  if (!Number.isFinite(baselineArrival) || !Number.isFinite(alightTs)) return [];
  return connections.flatMap((connection): Candidate[] => {
    const train = connection.sections[0];
    if (!train || !isTrainJourney(train.journey) || train.departure.station.id !== hack.station.id
      || connection.to.station.id !== opportunity.connection.to.station.id) return [];
    const departureTs = stopTime(train.departure, 'departure');
    const arrivalTs = stopTime(connection.to, 'arrival');
    if (!Number.isFinite(departureTs) || !Number.isFinite(arrivalTs) || arrivalTs < departureTs) return [];
    const platform = train.departure.prognosis?.platform?.trim() || train.departure.platform?.trim() || '';
    const parsed = parsePlatform(platform);
    const unknown = parsed.numbers.length === 0;
    let route = routeFor(hack, platform);
    if (unknown) route = hack.routes.filter(item => item.helps !== 'never' && isActive(item.validity, alightTs))
      .sort((a, b) => sprintSeconds(b, profile, alightTs) - sprintSeconds(a, profile, alightTs))[0];
    const sprintS = route ? sprintSeconds(route, profile, alightTs) : Infinity;
    const walkS = route ? walkSeconds(route, alightTs) : Infinity;
    const live = opportunity.live;
    const marginS = marginSeconds(sprintS, profile, live);
    const haveS = departureTs - alightTs;
    const spareS = haveS - sprintS;
    let band: Band = haveS >= sprintS + marginS ? 'GO' : haveS >= sprintS ? 'RISKY' : 'NO';
    let reason: string | undefined;
    if (unknown) { if (band === 'GO') band = 'RISKY'; reason = 'Platform not yet published'; }
    if (!route) { band = 'NO'; reason = platform ? `No researched route for platform ${platform}` : 'No active route data'; }
    else if (route.helps === 'never') { band = 'NO'; reason = route.note; }
    else if (!isActive(route.validity, alightTs)) { band = 'NO'; reason = `Route inactive: ${route.validity?.map(window => window.note).join(' ')}`; }
    if (hack.status === 'draft' || hack.status === 'disabled' || !isActive(hack.validity, alightTs)) {
      band = 'NO'; reason = 'hack-inactive';
    }
    if (!profile.offerSprintRoutes) { band = 'NO'; reason = 'Sprint routes are switched off'; }
    if (!isConnectionFeasible(connection)) { band = 'NO'; reason = 'An onward connection is at risk — use the SBB fallback'; }
    return [{ connection, train, route, platform, departureTs, arrivalTs, haveS, sprintS, walkS, marginS,
      spareS, gainS: baselineArrival - arrivalTs, band, live, reason }];
  }).sort((a, b) => a.arrivalTs - b.arrivalTs || a.departureTs - b.departureTs);
}

export function decide(candidates: Candidate[]): Decision {
  const ordered = [...candidates].sort((a, b) => a.arrivalTs - b.arrivalTs || a.departureTs - b.departureTs);
  const recommended = ordered.find(candidate => candidate.band === 'GO' && candidate.gainS > 0);
  const risky = ordered.find(candidate => candidate.band === 'RISKY' && candidate.gainS > 0);
  const reason = recommended ? 'earlier-train' : ordered.some(candidate => candidate.reason === 'hack-inactive')
    ? 'hack-inactive' : ordered.some(candidate => candidate.band === 'GO') ? 'no-earlier-train'
      : ordered.find(candidate => candidate.reason)?.reason ?? (ordered.length ? 'missed-by' : 'no-earlier-train');
  return { candidates: ordered, recommended, risky, reason };
}
