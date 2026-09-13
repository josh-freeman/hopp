import type { BoardEntry, BoardQuery, Connection, ConnectionQuery, Location, TransitClient } from '../types';
import { swissDateTime } from '../engine';

const ENDPOINT = 'https://transport.opendata.ch/v1';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiBusyError extends ApiError {
  constructor(public readonly retryAfterS = 60, status?: number) {
    super(`SBB timetable busy — retry in ${Math.ceil(retryAfterS)} s`, status);
    this.name = 'ApiBusyError';
  }
}

export function connectionsUrl(query: ConnectionQuery): string {
  const { date, time } = swissDateTime(query.when);
  const params = new URLSearchParams({ from: query.from, to: query.to, date, time, limit: String(query.limit ?? 6) });
  return `${ENDPOINT}/connections?${params}`;
}

export function stationboardUrl(query: BoardQuery): string {
  const params = new URLSearchParams({ id: query.id, limit: String(query.limit ?? 12) });
  if (query.when !== undefined) {
    const { date, time } = swissDateTime(query.when);
    params.set('datetime', `${date} ${time}`);
  }
  if (query.mode) params.append('transportations[]', query.mode);
  return `${ENDPOINT}/stationboard?${params}`;
}

export interface ClientOptions {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  pacingMs?: number;
  cacheMs?: number;
  timeoutMs?: number;
}

/** All requests share one queue and quota cooldown; there are no hidden retries. */
export function createClient(options: ClientOptions = {}): TransitClient {
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const pacingMs = options.pacingMs ?? 4_000;
  const cacheMs = options.cacheMs ?? 30_000;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const cache = new Map<string, { at: number; value: unknown[] }>();
  const inFlight = new Map<string, Promise<unknown[]>>();
  let queue: Promise<unknown> = Promise.resolve();
  let lastStart = -Infinity;
  let blockedUntil = 0;
  let failures = 0;

  function request<T>(url: string, key: string): Promise<T[]> {
    const hit = cache.get(url);
    if (hit && now() - hit.at < cacheMs) return Promise.resolve(structuredClone(hit.value) as T[]);
    const pending = inFlight.get(url);
    if (pending) return pending.then(value => structuredClone(value) as T[]);

    const task = queue.then(async () => {
      if (blockedUntil > now()) throw new ApiBusyError((blockedUntil - now()) / 1000);
      const pause = lastStart + pacingMs - now();
      if (pause > 0) await sleep(pause);
      lastStart = now();
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const { response, body } = await Promise.race([
          (async () => {
            const response = await fetcher(url, { method: 'GET', signal: controller.signal });
            let body: Record<string, unknown> = {};
            try { body = await response.json() as Record<string, unknown>; }
            catch { if (response.ok) throw new ApiError('The timetable returned an unreadable response.'); }
            return { response, body };
          })(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new ApiError('Timetable request timed out. Please retry.'));
            }, timeoutMs);
          }),
        ]);
        const errors = Array.isArray(body?.errors) ? body.errors : [];
        if (response.status === 429 || response.status >= 500 || errors.length > 0) {
          const rateLimited = response.status === 429 || /rate.?limit|too many|quota/i.test(JSON.stringify(errors));
          const backoff = [5, 20, 75][Math.min(failures++, 2)];
          const retryHeader = Number(response.headers.get('retry-after'));
          const retryAfterS = Math.min(300, Math.max(rateLimited ? 60 : backoff, Number.isFinite(retryHeader) ? retryHeader : 0));
          blockedUntil = now() + retryAfterS * 1000;
          throw new ApiBusyError(retryAfterS, response.status);
        }
        if (!response.ok) throw new ApiError(`Timetable request failed (${response.status}).`, response.status);
        if (!body || !Array.isArray(body[key])) throw new ApiError('The timetable response is missing journey data.');
        failures = 0;
        blockedUntil = 0;
        const value = body[key] as unknown[];
        for (const [key, entry] of cache) if (now() - entry.at >= cacheMs) cache.delete(key);
        cache.set(url, { at: now(), value: structuredClone(value) });
        return value;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Unable to reach the timetable. Check your connection and retry.');
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    });
    queue = task.catch(() => undefined);
    inFlight.set(url, task);
    void task.finally(() => { inFlight.delete(url); }).catch(() => undefined);
    return task.then(value => structuredClone(value) as T[]);
  }

  return {
    connections: query => request<Connection>(connectionsUrl(query), 'connections'),
    stationboard: query => request<BoardEntry>(stationboardUrl(query), 'stationboard'),
    locations(query) {
      const params = new URLSearchParams({ type: 'station' });
      if (typeof query === 'string') params.set('query', query);
      else { params.set('x', String(query.lat)); params.set('y', String(query.lon)); }
      return request<Location>(`${ENDPOINT}/locations?${params}`, 'stations');
    },
  };
}
