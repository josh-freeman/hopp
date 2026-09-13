import { z } from 'zod';
import { createMockAccountClient } from './mock';
import {
  AccountDataSchema, ActivityResultSchema, AttemptInputSchema, AttemptListSchema, AttemptResultSchema, DeleteResultSchema,
  ExchangeResultSchema, PracticeListSchema, PracticeResultSchema, ProfileUpdateSchema,
  type AccountClient, type AccountState, type AccountStorage,
} from './types';

export const ACCOUNT_API_BASE = 'https://api.joshfreeman.me';
export const ACCOUNT_TOKEN_KEY = 'hopp.auth.token';
export const WEBSITE_REUSE_SUPPRESSED_KEY = 'hopp.auth.website-suppressed';
const WEBSITE_TOKEN_KEY = 'comment_token';
interface ClientOptions {
  mock: boolean;
  /** Injectable browser boundaries for deterministic tests; production uses the defaults. */
  storage?: AccountStorage | null;
  fetch?: typeof globalThis.fetch;
  location?: { readonly href: string; assign(url: string): void };
  replaceUrl?: (url: string) => void;
  apiBase?: string;
  timeoutMs?: number;
  now?: () => Date;
}
class AccountRequestError extends Error {
  constructor(message: string, readonly status = 0) { super(message); }
}
function browserStorage(): AccountStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
function safeRead(storage: AccountStorage | null, key: string): string | null {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}
function safeWrite(storage: AccountStorage | null, key: string, value: string | null): void {
  try { if (value === null) storage?.removeItem(key); else storage?.setItem(key, value); } catch { /* Keep the current session usable in memory. */ }
}
function validToken(value: string | null): string | null {
  return value && value.length <= 8192 && !/[\s\u0000-\u001f]/.test(value) ? value : null;
}
export function createAccountClient(options: ClientOptions): AccountClient {
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  if (options.mock) return createMockAccountClient(storage, options.now);

  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  const location = options.location ?? (typeof window === 'undefined' ? undefined : window.location);
  const replaceUrl = options.replaceUrl ?? (url => { if (typeof window !== 'undefined') window.history.replaceState(window.history.state, '', url); });
  const base = (options.apiBase ?? ACCOUNT_API_BASE).replace(/\/$/, '');
  const listeners = new Set<(state: AccountState) => void>();
  const controllers = new Set<AbortController>();
  let state: AccountState = { status: 'guest', scenarios: [], attempts: [] };
  let token: string | null = null;
  let epoch = 0;
  let navigating = false;
  let suppressed = safeRead(storage, WEBSITE_REUSE_SUPPRESSED_KEY) === '1';
  let pendingCode: string | undefined;
  let callbackError: string | undefined;
  let loaded: Promise<AccountState> | undefined;
  let queue: Promise<unknown> = Promise.resolve();

  // Remove the one-use credential before any network operation or screen render.
  // It is retained only in this closure and never copied to browser storage.
  if (location) {
    const url = new URL(location.href);
    if (url.searchParams.has('hopp_auth_code') || url.searchParams.has('hopp_auth_error')) {
      const code = url.searchParams.get('hopp_auth_code');
      const error = url.searchParams.get('hopp_auth_error');
      url.searchParams.delete('hopp_auth_code'); url.searchParams.delete('hopp_auth_error');
      replaceUrl(url.toString());
      if (error) callbackError = error === 'account_link_required'
        ? 'Sign in to your existing account at joshfreeman.me first, then return to Hopp.'
        : error === 'cancelled' ? 'Google sign-in was cancelled. You can keep using Hopp without an account.'
        : 'Sign-in could not be completed. Please try again.';
      else if (code && /^[A-Za-z0-9_-]{32,128}$/.test(code)) pendingCode = code;
      else callbackError = 'That sign-in link is invalid or expired. Please sign in again.';
    }
  }
  const publish = (next: AccountState) => { state = next; for (const listener of listeners) listener(state); };
  const clearSession = (hideWebsite: boolean) => {
    token = null; pendingCode = undefined; callbackError = undefined;
    safeWrite(storage, ACCOUNT_TOKEN_KEY, null);
    if (hideWebsite) { suppressed = true; safeWrite(storage, WEBSITE_REUSE_SUPPRESSED_KEY, '1'); }
  };
  const fail = (error: unknown, version: number) => {
    if (version !== epoch) return;
    if (error instanceof AccountRequestError && error.status === 401) {
      clearSession(true);
      publish({ status: 'guest', scenarios: [], attempts: [], error: 'Your session has expired. Please sign in again.' });
      return;
    }
    const message = error instanceof AccountRequestError ? error.message : 'Could not reach your account. Try again.';
    publish({ ...state, status: state.account ? 'signed-in' : 'error', error: message });
  };
  const enqueue = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = queue.then(operation, operation); queue = next.catch(() => undefined); return next;
  };
  async function request<T>(path: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, method = 'GET', body?: unknown): Promise<T> {
    const controller = new AbortController(); controllers.add(controller);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const work = (async () => {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token && path !== '/hopp/auth/exchange') headers.Authorization = `Bearer ${token}`;
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        const response = await fetcher(`${base}${path}`, { method, headers, credentials: 'include', signal: controller.signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
        if (!response.ok) {
          const message = response.status === 403 ? 'This account action is not available yet.'
            : response.status === 429 ? 'Too many account requests. Please try again later.'
              : response.status === 422 ? 'Check the information you entered and try again.'
                : response.status === 503 || response.status === 404 ? 'The account service is unavailable. Please try again later.'
                  : 'Could not update your account. Please try again.';
          throw new AccountRequestError(message, response.status);
        }
        let json: unknown;
        try { json = await response.json(); } catch { throw new AccountRequestError('The account service returned an invalid response. Please try again.'); }
        const parsed = schema.safeParse(json);
        if (!parsed.success) throw new AccountRequestError('The account service returned an invalid response. Please try again.');
        return parsed.data;
      })();
      return await Promise.race([work, new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new AccountRequestError('The account request timed out. Please try again.')); }, options.timeoutMs ?? 12000);
      })]);
    } catch (error) {
      if (error instanceof AccountRequestError) throw error;
      throw new AccountRequestError('Could not reach your account. Check your connection and try again.');
    } finally { if (timer) clearTimeout(timer); controllers.delete(controller); }
  }
  async function mutate<T>(operation: () => Promise<T>, apply: (value: T) => void): Promise<T | undefined> {
    const version = epoch;
    return enqueue(async () => {
      if (version !== epoch) return;
      if (!state.account || !token) { publish({ ...state, status: 'guest', error: 'Sign in to save your changes.' }); return; }
      try {
        const value = await operation();
        if (version !== epoch) return;
        apply(value); return value;
      } catch (error) { fail(error, version); return; }
    });
  }
  return {
    get state() { return state; },
    subscribe(listener) { listeners.add(listener); listener(state); return () => { listeners.delete(listener); }; },
    load() {
      if (loaded) return loaded;
      const version = epoch;
      const pending = enqueue(async () => {
        if (version !== epoch) return state;
        if (callbackError) { const error = callbackError; callbackError = undefined; publish({ status: 'error', scenarios: [], attempts: [], error }); return state; }
        token = token ?? validToken(safeRead(storage, ACCOUNT_TOKEN_KEY)) ?? (!suppressed ? validToken(safeRead(storage, WEBSITE_TOKEN_KEY)) : null);
        if (!token && !pendingCode) { publish({ status: 'guest', scenarios: [], attempts: [] }); return state; }
        publish({ ...state, status: 'loading', error: undefined });
        try {
          let account;
          if (pendingCode) {
            const code = pendingCode; pendingCode = undefined;
            const result = await request('/hopp/auth/exchange', ExchangeResultSchema, 'POST', { code });
            if (version !== epoch) return state;
            token = validToken(result.token);
            if (!token) throw new AccountRequestError('The account service returned an invalid response. Please try again.');
            safeWrite(storage, ACCOUNT_TOKEN_KEY, token); suppressed = false; safeWrite(storage, WEBSITE_REUSE_SUPPRESSED_KEY, null);
            account = AccountDataSchema.parse(result);
          } else account = await request('/hopp/me', AccountDataSchema);
          if (version !== epoch) return state;
          publish({ ...state, status: 'signed-in', account, error: undefined });
          const [practice, attempts] = await Promise.allSettled([request('/hopp/practice', PracticeListSchema), request('/hopp/attempts?limit=20', AttemptListSchema)]);
          if (version !== epoch) return state;
          publish({ ...state, scenarios: practice.status === 'fulfilled' ? practice.value.scenarios : state.scenarios, attempts: attempts.status === 'fulfilled' ? attempts.value.attempts : state.attempts });
          if (practice.status === 'rejected') fail(practice.reason, version);
          if (attempts.status === 'rejected') fail(attempts.reason, version);
        } catch (error) { fail(error, version); }
        return state;
      });
      loaded = pending;
      void pending.finally(() => { if (loaded === pending) loaded = undefined; });
      return pending;
    },
    async signIn() {
      if (navigating) return;
      if (!location) { publish({ ...state, status: 'error', error: 'Open Hopp in a browser to sign in.' }); return; }
      const version = epoch;
      navigating = true; publish({ ...state, status: 'loading', error: undefined });
      // A missing or unavailable account service must not strand the traveller
      // on an API error page. An unauthenticated 401 confirms the endpoint exists.
      try { await request('/hopp/me', AccountDataSchema); }
      catch (error) {
        if (!(error instanceof AccountRequestError && error.status === 401)) {
          navigating = false; fail(error, version); return;
        }
      }
      if (version !== epoch) return;
      location.assign(`${base}/hopp/auth/google?return_to=%2Fhopp%2F`);
    },
    signOut() {
      epoch += 1; navigating = false; loaded = undefined;
      for (const controller of controllers) controller.abort();
      clearSession(true); publish({ status: 'guest', scenarios: [], attempts: [] });
    },
    saveProfile(input) {
      const parsed = ProfileUpdateSchema.safeParse(input);
      if (!parsed.success) { publish({ ...state, error: 'Check your profile settings and try again.' }); return Promise.resolve(undefined); }
      return mutate(() => request('/hopp/profile', AccountDataSchema, 'PUT', parsed.data), account => publish({ ...state, status: 'signed-in', account, error: undefined }));
    },
    practice(scenarioId, answerId) {
      const scenario = state.scenarios.find(item => item.id === scenarioId);
      if (!scenario || !scenario.choices.some(choice => choice.id === answerId)) { publish({ ...state, error: 'Choose an answer from this question.' }); return Promise.resolve(undefined); }
      return mutate(() => request('/hopp/practice', PracticeResultSchema, 'POST', { scenario_id: scenarioId, answer_id: answerId }), result => {
        publish({ ...state, status: 'signed-in', account: result.account, scenarios: state.scenarios.map(item => item.id === scenarioId && result.correct ? { ...item, completed: true } : item), error: undefined });
      });
    },
    recordActivity(kind) {
      if (kind !== 'connection_checked') { publish({ ...state, error: 'This activity could not be saved.' }); return Promise.resolve(undefined); }
      return mutate(() => request('/hopp/activity', ActivityResultSchema, 'POST', { kind }), result => publish({ ...state, status: 'signed-in', account: result.account, error: undefined }));
    },
    recordAttempt(input) {
      const parsed = AttemptInputSchema.safeParse(input);
      if (!parsed.success) { publish({ ...state, error: 'This trip could not be saved.' }); return Promise.resolve(undefined); }
      return mutate(() => request('/hopp/attempts', AttemptResultSchema, 'POST', parsed.data), result => {
        publish({ ...state, status: 'signed-in', account: result.account, attempts: [result.attempt, ...state.attempts.filter(attempt => attempt.id !== result.attempt.id)].slice(0, 20), error: undefined });
      });
    },
    async deleteAccount() {
      const deleted = await mutate(() => request('/hopp/me', DeleteResultSchema, 'DELETE'), () => undefined);
      if (!deleted) return false;
      this.signOut(); return true;
    },
  };
}
