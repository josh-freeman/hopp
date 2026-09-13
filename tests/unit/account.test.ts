import { describe, expect, test } from 'bun:test';
import { createAccountClient, ACCOUNT_TOKEN_KEY, WEBSITE_REUSE_SUPPRESSED_KEY } from '../../src/account/client';
import { demoAccount, DEMO_ACCOUNT_KEY } from '../../src/account/mock';
import { AccountDataSchema, type AccountStorage, type PracticeScenario } from '../../src/account/types';

class MemoryStorage implements AccountStorage {
  values = new Map<string, string>();
  reads: string[] = []; writes: string[] = [];
  getItem(key: string) { this.reads.push(key); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.writes.push(key); this.values.set(key, value); }
  removeItem(key: string) { this.writes.push(key); this.values.delete(key); }
}
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const scenarios: PracticeScenario[] = [{ id: 'budget', title: 'Check time', prompt: 'How much time remains?', completed: false, choices: [{ id: '51-seconds', label: '51 seconds' }, { id: '116-seconds', label: '116 seconds' }] }];
type Intercept = (url: string, init: RequestInit) => Response | Promise<Response> | undefined;
function server(intercept?: Intercept) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetcher = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input); calls.push({ url, init });
    const overridden = intercept?.(url, init); if (overridden) return overridden;
    const path = new URL(url).pathname;
    if (path === '/hopp/me') return json(demoAccount());
    if (path === '/hopp/practice') return json({ scenarios });
    if (path === '/hopp/attempts') return json({ attempts: [] });
    throw new Error(`Unexpected request ${path}`);
  }) as typeof fetch;
  return { calls, fetcher };
}
const authorized = () => { const storage = new MemoryStorage(); storage.values.set(ACCOUNT_TOKEN_KEY, 'hopp-test-token'); return storage; };
const deferred = <T>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; };

describe('account authentication boundary', () => {
  test('website token is read and server-validated without trusting or writing website user data', async () => {
    const storage = new MemoryStorage(); storage.values.set('comment_token', 'website-token'); storage.values.set('comment_user', '{"name":"untrusted"}');
    const remote = server(); const client = createAccountClient({ mock: false, storage, fetch: remote.fetcher });
    expect(client.state.account).toBeUndefined(); await client.load();
    expect(client.state.status).toBe('signed-in'); expect(client.state.account?.user.name).toBe('Demo traveller');
    expect(new Headers(remote.calls[0].init.headers).get('Authorization')).toBe('Bearer website-token');
    expect(storage.reads).not.toContain('comment_user'); expect(storage.writes).not.toContain('comment_token'); expect(storage.writes).not.toContain('comment_user');
  });
  test('own token takes precedence and logout suppresses website auto-reuse after reload', async () => {
    const storage = authorized(); storage.values.set('comment_token', 'website-token'); storage.values.set('comment_user', 'website-user');
    const remote = server(); const client = createAccountClient({ mock: false, storage, fetch: remote.fetcher }); await client.load();
    expect(new Headers(remote.calls[0].init.headers).get('Authorization')).toBe('Bearer hopp-test-token');
    client.signOut(); expect(client.state.status).toBe('guest');
    expect(storage.values.get('comment_token')).toBe('website-token'); expect(storage.values.get('comment_user')).toBe('website-user');
    expect(storage.values.has(ACCOUNT_TOKEN_KEY)).toBe(false); expect(storage.values.get(WEBSITE_REUSE_SUPPRESSED_KEY)).toBe('1');
    const after = server(); await createAccountClient({ mock: false, storage, fetch: after.fetcher }).load(); expect(after.calls).toHaveLength(0);
  });
  test('invalid website token never creates an account and is not deleted from website storage', async () => {
    const storage = new MemoryStorage(); storage.values.set('comment_token', 'bad-token');
    const remote = server(() => json({ detail: 'server details are not shown' }, 401));
    const client = createAccountClient({ mock: false, storage, fetch: remote.fetcher }); await client.load();
    expect(client.state.status).toBe('guest'); expect(client.state.account).toBeUndefined(); expect(client.state.error).toContain('session has expired');
    expect(storage.values.get('comment_token')).toBe('bad-token'); expect(remote.calls).toHaveLength(1);
  });
  test('callback code is removed immediately and exchanged once even when load is called twice', async () => {
    const storage = new MemoryStorage(); storage.values.set('comment_token', 'website-token'); storage.values.set(WEBSITE_REUSE_SUPPRESSED_KEY, '1');
    let href = `https://joshfreeman.me/hopp/?demo=no&hopp_auth_code=${'a'.repeat(40)}#account`;
    const remote = server(url => url.endsWith('/hopp/auth/exchange') ? json({ ...demoAccount(), token: 'new-hopp-token' }) : undefined);
    const client = createAccountClient({ mock: false, storage, fetch: remote.fetcher, location: { get href() { return href; }, assign() {} }, replaceUrl(url) { href = url; } });
    expect(href).not.toContain('hopp_auth_code'); expect(href).toContain('demo=no'); expect(href).toEndWith('#account');
    const first = client.load(); expect(client.load()).toBe(first); await first;
    const exchanges = remote.calls.filter(call => call.url.endsWith('/hopp/auth/exchange')); expect(exchanges).toHaveLength(1);
    expect(exchanges[0].init.credentials).toBe('include'); expect(new Headers(exchanges[0].init.headers).has('Authorization')).toBe(false);
    expect(JSON.parse(String(exchanges[0].init.body))).toEqual({ code: 'a'.repeat(40) });
    expect(storage.values.get(ACCOUNT_TOKEN_KEY)).toBe('new-hopp-token'); expect(storage.values.get('comment_token')).toBe('website-token');
    expect(storage.values.has(WEBSITE_REUSE_SUPPRESSED_KEY)).toBe(false);
    await client.load(); expect(remote.calls.filter(call => call.url.endsWith('/hopp/auth/exchange'))).toHaveLength(1);
  });
  test('malformed exchange account cannot persist its token', async () => {
    const storage = new MemoryStorage(); const remote = server(() => json({ token: 'not-yet-trusted' }));
    const client = createAccountClient({ mock: false, storage, fetch: remote.fetcher, location: { href: `https://joshfreeman.me/hopp/?hopp_auth_code=${'b'.repeat(40)}`, assign() {} }, replaceUrl() {} });
    await client.load(); expect(client.state.status).toBe('error'); expect(storage.values.has(ACCOUNT_TOKEN_KEY)).toBe(false);
  });
  test('late callback exchange cannot sign a user back in after logout', async () => {
    const reply = deferred<Response>(); const remote = server(() => reply.promise); const storage = new MemoryStorage();
    const client = createAccountClient({ mock: false, storage, fetch: remote.fetcher, location: { href: `https://joshfreeman.me/hopp/?hopp_auth_code=${'c'.repeat(40)}`, assign() {} }, replaceUrl() {} });
    const loading = client.load(); await Promise.resolve(); client.signOut();
    reply.resolve(json({ ...demoAccount(), token: 'late-token' })); await loading;
    expect(client.state.status).toBe('guest'); expect(storage.values.has(ACCOUNT_TOKEN_KEY)).toBe(false);
  });
  test('repeated sign-in clicks cause one top-level redirect with a fixed return path', async () => {
    const navigation: string[] = []; const remote = server(() => json({ detail: 'Not authenticated' }, 401));
    const client = createAccountClient({ mock: false, storage: null, fetch: remote.fetcher, location: { href: 'https://joshfreeman.me/hopp/', assign(url) { navigation.push(url); } } });
    await client.signIn(); await client.signIn();
    expect(navigation).toEqual(['https://api.joshfreeman.me/hopp/auth/google?return_to=%2Fhopp%2F']); expect(remote.calls).toHaveLength(1);
    expect(new Headers(remote.calls[0].init.headers).has('Authorization')).toBe(false);
  });
  test('unavailable sign-in stays in Hopp and can be retried after the service recovers', async () => {
    let available = false; const navigation: string[] = [];
    const remote = server(() => json({}, available ? 401 : 404));
    const client = createAccountClient({ mock: false, storage: null, fetch: remote.fetcher, location: { href: 'https://joshfreeman.me/hopp/', assign(url) { navigation.push(url); } } });
    await client.signIn();
    expect(navigation).toHaveLength(0); expect(client.state.error).toContain('service is unavailable');
    available = true; await client.signIn(); expect(navigation).toHaveLength(1);
  });
  test('sign-out cancels a pending sign-in redirect', async () => {
    const pending = deferred<Response>(); const navigation: string[] = [];
    const remote = server(() => pending.promise);
    const client = createAccountClient({ mock: false, storage: null, fetch: remote.fetcher, location: { href: 'https://joshfreeman.me/hopp/', assign(url) { navigation.push(url); } } });
    const signingIn = client.signIn(); client.signOut(); pending.resolve(json({}, 401)); await signingIn;
    expect(navigation).toHaveLength(0); expect(client.state.status).toBe('guest');
  });
  test('OAuth error query is stripped and cannot start an automatic callback loop', async () => {
    let href = 'https://joshfreeman.me/hopp/?hopp_auth_error=oauth_secret_detail'; const remote = server();
    const client = createAccountClient({ mock: false, storage: null, fetch: remote.fetcher, location: { get href() { return href; }, assign() { throw new Error('Unexpected redirect'); } }, replaceUrl(url) { href = url; } });
    await client.load(); expect(href).not.toContain('hopp_auth_error'); expect(client.state.error).not.toContain('secret_detail'); expect(remote.calls).toHaveLength(0);
  });
});

describe('account transport and authoritative responses', () => {
  test('invalid remote point values fail closed at the JSON boundary', async () => {
    const invalid = demoAccount(); invalid.stats.points = -50; const remote = server(() => json(invalid));
    const client = createAccountClient({ mock: false, storage: authorized(), fetch: remote.fetcher }); await client.load();
    expect(client.state.status).toBe('error'); expect(client.state.account).toBeUndefined(); expect(client.state.error).toContain('invalid response');
  });
  test('timeout includes a response body that never completes', async () => {
    const remote = server(() => ({ ok: true, json: () => new Promise(() => {}) }) as unknown as Response);
    const client = createAccountClient({ mock: false, storage: authorized(), fetch: remote.fetcher, timeoutMs: 10 }); await client.load();
    expect(client.state.status).toBe('error'); expect(client.state.error).toContain('timed out');
  });
  test('practice errors retain the signed-in account and expose no server internals', async () => {
    const remote = server((_url, init) => init.method === 'POST' ? json({ detail: 'private database detail' }, 500) : undefined);
    const client = createAccountClient({ mock: false, storage: authorized(), fetch: remote.fetcher }); await client.load();
    expect(await client.practice('budget', '51-seconds')).toBeUndefined(); expect(client.state.status).toBe('signed-in'); expect(client.state.account).toBeDefined(); expect(client.state.error).not.toContain('database');
  });
  test('mutations after logout cannot restore a profile', async () => {
    const reply = deferred<Response>(); const remote = server((_url, init) => init.method === 'PUT' ? reply.promise : undefined);
    const client = createAccountClient({ mock: false, storage: authorized(), fetch: remote.fetcher }); await client.load();
    const saving = client.saveProfile({ nickname: 'Late nickname' }); await Promise.resolve(); client.signOut(); reply.resolve(json(demoAccount()));
    expect(await saving).toBeUndefined(); expect(client.state.status).toBe('guest'); expect(client.state.account).toBeUndefined();
  });
  test('client refuses attempt points/verification claims and accepts only zero-point server receipts', async () => {
    const remote = server((_url, init) => init.method === 'POST' ? json({ attempt: { id: '00000000-0000-4000-8000-000000000002', verification: 'verified', points: 50 }, account: demoAccount() }) : undefined);
    const client = createAccountClient({ mock: false, storage: authorized(), fetch: remote.fetcher }); await client.load();
    const before = remote.calls.length; expect(await client.recordAttempt({ points: 50 } as never)).toBeUndefined(); expect(remote.calls).toHaveLength(before);
    expect(await client.recordAttempt({ client_id: 'attempt-1', route_id: 'zurich-hb.central' })).toBeUndefined(); expect(client.state.account?.stats.points).toBe(0);
  });
  test('daily activity submits only the approved event kind and uses returned points', async () => {
    const account = demoAccount(); account.stats.points = 5; account.stats.active_days = 1;
    const remote = server(url => url.endsWith('/hopp/activity') ? json({ awarded_points: 5, recorded: true, account }) : undefined);
    const client = createAccountClient({ mock: false, storage: authorized(), fetch: remote.fetcher }); await client.load();
    const result = await client.recordActivity('connection_checked'); expect(result?.awarded_points).toBe(5); expect(client.state.account?.stats.points).toBe(5);
    expect(JSON.parse(String(remote.calls.at(-1)!.init.body))).toEqual({ kind: 'connection_checked' });
    expect(await client.recordActivity('train_caught' as never)).toBeUndefined();
  });
  test('Hopp deletion requires explicit website-preserved confirmation and never deletes website keys', async () => {
    const storage = authorized(); storage.values.set('comment_token', 'keep'); storage.values.set('comment_user', 'keep-user');
    const remote = server((_url, init) => init.method === 'DELETE' ? json({ deleted: true, website_account_preserved: true }) : undefined);
    const client = createAccountClient({ mock: false, storage, fetch: remote.fetcher }); await client.load(); expect(await client.deleteAccount()).toBe(true);
    expect(client.state.status).toBe('guest'); expect(storage.values.get('comment_token')).toBe('keep'); expect(storage.values.get('comment_user')).toBe('keep-user');
  });
  test('new engagement statistics default safely against an older additive API deployment', () => {
    const account = demoAccount(); const { active_days: _a, current_month_days: _m, last_active_date: _d, next_reward: _n, ...stats } = account.stats;
    const parsed = AccountDataSchema.parse({ ...account, stats }); expect(parsed.stats.active_days).toBe(0); expect(parsed.stats.next_reward).toBeNull();
  });
});

describe('isolated account demo', () => {
  test('mock never reads real tokens, consumes callback codes, redirects or calls the account server', async () => {
    const storage = authorized(); storage.values.set('comment_token', 'website-token'); storage.values.set('comment_user', 'website-user');
    const unexpected = () => { throw new Error('Production boundary used by mock'); };
    const client = createAccountClient({ mock: true, storage, fetch: unexpected as unknown as typeof fetch, location: { get href(): string { return unexpected(); }, assign: unexpected }, replaceUrl: unexpected });
    await client.load(); expect(client.state.status).toBe('guest'); await client.signIn();
    expect(client.state.status).toBe('signed-in'); expect(storage.reads).toEqual([DEMO_ACCOUNT_KEY]); expect(storage.writes).toEqual([DEMO_ACCOUNT_KEY]);
    await client.deleteAccount(); expect(storage.values.get(ACCOUNT_TOKEN_KEY)).toBe('hopp-test-token'); expect(storage.values.get('comment_token')).toBe('website-token');
  });
  test('wrong and repeated answers award zero; correct first answers unlock themes once', async () => {
    const client = createAccountClient({ mock: true, storage: new MemoryStorage() }); await client.signIn();
    expect((await client.practice('budget', '116-seconds'))?.awarded_points).toBe(0);
    expect(await client.saveProfile({ selected_theme: 'night' })).toBeUndefined();
    expect((await client.practice('budget', '51-seconds'))?.awarded_points).toBe(25);
    expect((await client.practice('budget', '51-seconds'))?.awarded_points).toBe(0);
    expect((await client.saveProfile({ selected_theme: 'forest' }))?.profile.selected_theme).toBe('forest');
    await client.practice('fallback', 'regular-connection'); await client.practice('platform', 'wait-for-platform');
    expect(client.state.account?.stats.points).toBe(75); expect(client.state.account?.badges).toContain('prepared');
  });
  test('daily points are idempotent across reload and follow the Swiss date, not UTC', async () => {
    const storage = new MemoryStorage(); let instant = new Date('2026-09-13T21:59:00Z');
    let client = createAccountClient({ mock: true, storage, now: () => instant }); await client.signIn();
    expect((await client.recordActivity('connection_checked'))?.awarded_points).toBe(5);
    expect((await client.recordActivity('connection_checked'))?.awarded_points).toBe(0);
    client = createAccountClient({ mock: true, storage, now: () => instant }); await client.load();
    expect((await client.recordActivity('connection_checked'))?.awarded_points).toBe(0);
    instant = new Date('2026-09-13T22:01:00Z'); expect((await client.recordActivity('connection_checked'))?.awarded_points).toBe(5);
    expect(client.state.account?.stats.last_active_date).toBe('2026-09-14'); expect(client.state.account?.stats.active_days).toBe(2);
    instant = new Date('2026-10-19T12:00:00Z'); await client.recordActivity('connection_checked');
    expect(client.state.account?.stats.points).toBe(15); expect(client.state.account?.stats.active_days).toBe(3); expect(client.state.account?.stats.current_month_days).toBe(1);
  });
  test('attempts persist as unverified with no reward, and repeat client IDs are idempotent', async () => {
    const storage = new MemoryStorage(); let client = createAccountClient({ mock: true, storage }); await client.signIn();
    const first = await client.recordAttempt({ client_id: 'one', route_id: 'zurich-hb.central' }); const second = await client.recordAttempt({ client_id: 'one', route_id: 'zurich-hb.central' });
    expect(first?.attempt.points).toBe(0); expect(first?.attempt.verification).toBe('unverified'); expect(second?.attempt.id).toBe(first?.attempt.id);
    client = createAccountClient({ mock: true, storage }); await client.load();
    expect(client.state.account?.stats.attempts).toBe(1); expect(client.state.account?.stats.points).toBe(0); expect(client.state.attempts).toHaveLength(1);
  });
  test('stored totals and locked theme selections do not bypass demo progress rules', async () => {
    const storage = new MemoryStorage(); const saved = demoAccount(); saved.stats.points = 999; saved.profile.selected_theme = 'dusk';
    storage.values.set(DEMO_ACCOUNT_KEY, JSON.stringify({ account: saved, completed: [], attempts: [], active_days: [] }));
    const client = createAccountClient({ mock: true, storage }); await client.load();
    expect(client.state.account?.stats.points).toBe(0); expect(client.state.account?.profile.selected_theme).toBe('signal');
  });
});
