import type { Hack, Route } from './schema/hack';
export type { Hack, Route } from './schema/hack';
export interface Profile { sprintMps: number; bag: boolean; minMarginS: number; offerSprintRoutes: boolean }
export interface Location { id: string | null; name: string; coordinate?: { x: number; y: number }; distance?: number | null }
export interface Prognosis { arrival?: string | null; departure?: string | null; platform?: string | null }
export interface Stop { station: Location; arrival?: string | null; departure?: string | null; arrivalTimestamp?: number | null; departureTimestamp?: number | null; delay?: number | null; platform?: string | null; prognosis?: Prognosis | null }
export interface Journey { name?: string; category?: string; number?: string; to?: string; passList?: Stop[] }
export interface Section { departure: Stop; arrival: Stop; journey?: Journey | null; walk?: { duration?: number | string } | null }
export interface Connection { from: Stop; to: Stop; sections: Section[]; duration?: string; products?: string[] }
export interface BoardEntry extends Journey { stop: Stop }
export interface TripQuery { from: string; to: string; when: number }
export interface ConnectionQuery extends TripQuery { limit?: number }
export interface BoardQuery { id: string; when?: number; mode?: 'tram' | 'train' | 'bus'; limit?: number }
export interface TransitClient { connections(query: ConnectionQuery): Promise<Connection[]>; locations(query: string | { lat: number; lon: number }): Promise<Location[]>; stationboard(query: BoardQuery): Promise<BoardEntry[]> }
export type Band = 'GO' | 'RISKY' | 'NO';
export interface Opportunity { hack: Hack; kind: 'ride-past' | 'walk' | 'origin'; connection: Connection; baselineTrain: Section; alightTs: number; rideOnArrivalTs: number; live: boolean; feeder?: Section; alightStop?: Stop }
export interface Candidate { connection: Connection; train: Section; route?: Route; platform: string; departureTs: number; arrivalTs: number; haveS: number; sprintS: number; walkS: number; marginS: number; spareS: number; gainS: number; band: Band; live: boolean; reason?: string }
export interface Decision { candidates: Candidate[]; recommended?: Candidate; risky?: Candidate; reason: string }
export interface PlanResult extends Decision { query: TripQuery; connections: Connection[]; opportunity?: Opportunity; updatedAt: number; fallback?: Connection; fallbackAtRisk: boolean; error?: string }
