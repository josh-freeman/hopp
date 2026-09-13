import { describe, expect, test } from 'bun:test';
import { ApiBusyError, ApiError, connectionsUrl, createClient, stationboardUrl } from '../../src/api/client';

const when = Date.parse('2026-09-13T22:59:40Z') / 1000;
const query = { from: 'Zürich, Central', to: 'Bern', when };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const fetchStub = (fn: (url: string, init?: RequestInit) => Promise<Response>) => fn as typeof fetch;

describe('transport client', () => {
  test('builds Swiss local route and board dates, without restricting onward transport', () => {
    const url = new URL(connectionsUrl({ ...query, limit: 10 }));
    expect(url.searchParams.get('date')).toBe('2026-09-14');
    expect(url.searchParams.get('time')).toBe('00:59');
    expect(url.searchParams.get('from')).toBe('Zürich, Central');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.has('transportations[]')).toBe(false);
    const board = new URL(stationboardUrl({ id: '8503000', when, mode: 'train', limit: 40 }));
    expect(board.searchParams.get('datetime')).toBe('2026-09-14 00:59');
    expect(board.searchParams.get('transportations[]')).toBe('train');
  });

  test('recognizes rate limits inside HTTP 200 and stops calls during cooldown', async () => {
    let calls = 0;
    const client = createClient({ pacingMs: 0, fetch: fetchStub(async () => {
      calls++; return response({ errors: [{ message: 'Rate limit: Too many requests this minute' }] });
    }) });
    await expect(client.connections(query)).rejects.toBeInstanceOf(ApiBusyError);
    await expect(client.locations('Bern')).rejects.toBeInstanceOf(ApiBusyError);
    expect(calls).toBe(1);
  });

  test('rejects HTTP errors, missing arrays, malformed JSON, offline and timeouts', async () => {
    for (const res of [response({}, 404), response({}, 503), response({}), new Response('bad JSON')]) {
      const client = createClient({ pacingMs: 0, fetch: fetchStub(async () => res) });
      await expect(client.connections(query)).rejects.toBeInstanceOf(ApiError);
    }
    const offline = createClient({ fetch: fetchStub(async () => { throw new TypeError('Failed to fetch'); }) });
    await expect(offline.connections(query)).rejects.toThrow('Check your connection');
    const timeout = createClient({ timeoutMs: 5, fetch: fetchStub(() => new Promise(() => {})) });
    await expect(timeout.connections(query)).rejects.toThrow('timed out');
    const streaming = response({});
    streaming.json = () => new Promise(() => {});
    const bodyTimeout = createClient({ timeoutMs: 5, fetch: fetchStub(async () => streaming) });
    await expect(bodyTimeout.connections(query)).rejects.toThrow('timed out');
  });

  test('deduplicates requests, caches for 30 seconds, and serializes plain GETs at 4 seconds', async () => {
    let time = 10_000;
    const starts: number[] = [];
    const client = createClient({ now: () => time, sleep: async ms => { time += ms; }, fetch: fetchStub(async (_url, init) => {
      expect(init?.method).toBe('GET');
      expect(init?.headers).toBeUndefined();
      starts.push(time);
      return response({ connections: [], stations: [] });
    }) });
    await Promise.all([client.connections(query), client.connections(query), client.locations('Bern')]);
    expect(starts).toEqual([10_000, 14_000]);
    await client.connections(query);
    expect(starts.length).toBe(2);
    time += 30_000;
    await client.connections(query);
    expect(starts.length).toBe(3);
  });

  test('location coordinates follow API x=latitude and y=longitude', async () => {
    let requested = '';
    const client = createClient({ fetch: fetchStub(async url => { requested = url; return response({ stations: [] }); }) });
    await client.locations({ lat: 47.37, lon: 8.54 });
    const url = new URL(requested);
    expect(url.searchParams.get('x')).toBe('47.37');
    expect(url.searchParams.get('y')).toBe('8.54');
    expect(url.searchParams.get('type')).toBe('station');
  });
});
