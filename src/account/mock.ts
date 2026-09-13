import { z } from 'zod';
import {
  AccountDataSchema, AttemptInputSchema, AttemptSchema, ProfileUpdateSchema,
  type AccountClient, type AccountData, type AccountState, type AccountStorage, type PracticeScenario,
} from './types';

// The demo has no auth token and never reads production account or website keys.
export const DEMO_ACCOUNT_KEY = 'hopp.demo.account.v1';
const questions: Array<PracticeScenario & { answer: string; feedback: string }> = [
  {
    "id": "budget",
    "title": "Time and margin",
    "prompt": "You have 5:00. The route takes 3:04 and the margin is 1:05. How much spare time remains?",
    "choices": [
      {
        "id": "51-seconds",
        "label": "51 seconds"
      },
      {
        "id": "116-seconds",
        "label": "1 minute 56 seconds"
      },
      {
        "id": "65-seconds",
        "label": "1 minute 5 seconds"
      }
    ],
    "answer": "51-seconds",
    "feedback": "300 − 184 − 65 = 51 seconds. Spare time is what remains after both the route and its margin.",
    "completed": false
  },
  {
    "id": "fallback",
    "title": "A late connection",
    "prompt": "Your arriving service is late. The sprint no longer leaves the full margin. What should you choose?",
    "choices": [
      {
        "id": "regular-connection",
        "label": "Use the regular connection"
      },
      {
        "id": "sprint-anyway",
        "label": "Attempt the sprint anyway"
      },
      {
        "id": "ignore-margin",
        "label": "Ignore the margin"
      }
    ],
    "answer": "regular-connection",
    "feedback": "Use the regular connection when the sprint no longer leaves the full margin. Its details stay on the screen.",
    "completed": false
  },
  {
    "id": "platform",
    "title": "An unknown platform",
    "prompt": "The departure platform has not been published. Can Hopp offer a reliable sprint route yet?",
    "choices": [
      {
        "id": "wait-for-platform",
        "label": "Wait for the platform and check the route"
      },
      {
        "id": "guess-platform",
        "label": "Choose the nearest platform"
      },
      {
        "id": "previous-platform",
        "label": "Use the platform from a previous trip"
      }
    ],
    "answer": "wait-for-platform",
    "feedback": "Wait for the platform and check the route. Access and timing differ between platforms.",
    "completed": false
  }
];

export function demoAccount(): AccountData {
  return {
    user: { id: '00000000-0000-4000-8000-000000000001', name: 'Demo traveller', email: 'demo@example.test', profile_picture_url: null },
    profile: { nickname: 'Demo traveller', selected_theme: 'signal', preferences: { sprint_mps: 3.5, bag: false, min_margin_s: 45, offer_sprint_routes: true } },
    stats: { points: 0, practice_completed: 0, practice_total: 3, attempts: 0, verified_attempts: 0, active_days: 0, current_month_days: 0, last_active_date: null, next_reward: { id: 'forest', name: 'Forest', points_required: 25, points_remaining: 25 } }, badges: [],
    rewards: [{ id: 'signal', name: 'Signal', points_required: 0, unlocked: true }, { id: 'forest', name: 'Forest', points_required: 25, unlocked: false }, { id: 'night', name: 'Night', points_required: 75, unlocked: false }, { id: 'track', name: 'Track', points_required: 150, unlocked: false }, { id: 'alpine', name: 'Alpine', points_required: 300, unlocked: false }, { id: 'dusk', name: 'Dusk', points_required: 600, unlocked: false }],
  };
}
const SavedDemoSchema = z.object({ account: AccountDataSchema, completed: z.array(z.enum(['budget', 'fallback', 'platform'])), attempts: z.array(AttemptSchema).max(1000), active_days: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]) });
export function createMockAccountClient(storage: AccountStorage | null, now: () => Date = () => new Date()): AccountClient {
  let state: AccountState = { status: 'guest', scenarios: [], attempts: [] };
  const listeners = new Set<(state: AccountState) => void>();
  let completed = new Set<string>();
  let activeDays = new Set<string>();
  const dateKey = () => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now());
    const part = (name: string) => parts.find(item => item.type === name)!.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  };
  const refresh = (source: AccountData): AccountData => {
    const account = structuredClone(source);
    const points = completed.size * 25 + activeDays.size * 5;
    const days = [...activeDays].sort();
    account.user = demoAccount().user;
    account.rewards = demoAccount().rewards.map(reward => ({ ...reward, unlocked: points >= reward.points_required }));
    const next = account.rewards.find(reward => !reward.unlocked);
    account.stats = { ...account.stats, points, practice_completed: completed.size, practice_total: 3, verified_attempts: 0, active_days: days.length, current_month_days: days.filter(day => day.startsWith(dateKey().slice(0, 7))).length, last_active_date: days.at(-1) ?? null, next_reward: next ? { id: next.id, name: next.name, points_required: next.points_required, points_remaining: next.points_required - points } : null };
    account.badges = [...(completed.size === 3 ? ['prepared'] : []), ...(days.length >= 7 ? ['regular'] : []), ...(days.length >= 30 ? ['commuter'] : []), ...(days.length >= 100 ? ['yearbook'] : [])];
    if (!account.rewards.some(reward => reward.id === account.profile.selected_theme && reward.unlocked)) account.profile.selected_theme = 'signal';
    return account;
  };
  let deleted = false;
  const publish = (next: AccountState) => { state = next; for (const listener of listeners) listener(state); };
  const scenarios = () => questions.map(({ answer: _answer, feedback: _feedback, ...question }) => ({ ...question, completed: completed.has(question.id) }));
  const persist = () => { try { if (state.account) storage?.setItem(DEMO_ACCOUNT_KEY, JSON.stringify({ account: state.account, completed: [...completed], attempts: state.attempts, active_days: [...activeDays] })); } catch { /* Demo still works without storage. */ } };
  const clear = () => { try { storage?.removeItem(DEMO_ACCOUNT_KEY); } catch { /* No real account storage is touched. */ } };
  const fail = (error: string) => publish({ ...state, status: state.account ? 'signed-in' : 'guest', error });
  const update = (account: AccountData) => { const revised = refresh(account); publish({ ...state, status: 'signed-in', account: revised, scenarios: scenarios(), error: undefined }); persist(); return revised; };
  return {
    get state() { return state; },
    subscribe(listener) { listeners.add(listener); listener(state); return () => { listeners.delete(listener); }; },
    async load() {
      if (!state.account && !deleted) {
        try {
          const raw = storage?.getItem(DEMO_ACCOUNT_KEY);
          if (raw) {
            const saved = SavedDemoSchema.parse(JSON.parse(raw)); completed = new Set(saved.completed); activeDays = new Set(saved.active_days);
            saved.account.stats.attempts = saved.attempts.length;
            publish({ status: 'signed-in', account: refresh(saved.account), scenarios: scenarios(), attempts: saved.attempts });
          }
        } catch { clear(); }
      }
      return state;
    },
    async signIn() { deleted = false; if (!state.account) update(demoAccount()); },
    signOut() { deleted = true; completed.clear(); activeDays.clear(); clear(); publish({ status: 'guest', scenarios: [], attempts: [] }); },
    async saveProfile(input) {
      if (!state.account) { fail('Sign in to save your settings.'); return; }
      const parsed = ProfileUpdateSchema.safeParse(input);
      if (!parsed.success) { fail('Check your profile settings and try again.'); return; }
      const { selected_theme, preferences, ...rest } = parsed.data;
      if (selected_theme && !state.account.rewards.some(reward => reward.id === selected_theme && reward.unlocked)) { fail('That theme is not unlocked yet.'); return; }
      const account = structuredClone(state.account);
      account.profile = { ...account.profile, ...rest, selected_theme: selected_theme ?? account.profile.selected_theme, preferences: { ...account.profile.preferences, ...preferences } };
      return update(account);
    },
    async practice(scenarioId, answerId) {
      if (!state.account) { fail('Sign in to try the practice questions.'); return; }
      const question = questions.find(item => item.id === scenarioId);
      if (!question || !question.choices.some(choice => choice.id === answerId)) { fail('Choose an answer from this question.'); return; }
      const correct = question.answer === answerId;
      const awarded_points = correct && !completed.has(scenarioId) ? 25 : 0;
      if (correct) completed.add(scenarioId);
      const account = structuredClone(state.account);
      account.stats.points += awarded_points; account.stats.practice_completed = completed.size;
      account.rewards = account.rewards.map(reward => ({ ...reward, unlocked: account.stats.points >= reward.points_required }));
      account.badges = completed.size === 3 ? ['prepared'] : [];
      const revised = update(account);
      return { correct, awarded_points, feedback: question.feedback, account: revised };
    },
    async recordActivity(kind) {
      if (!state.account) { fail('Sign in to save your activity.'); return; }
      if (kind !== 'connection_checked') { fail('This activity could not be saved.'); return; }
      const day = dateKey(); const recorded = !activeDays.has(day); activeDays.add(day);
      const account = update(state.account);
      return { recorded, awarded_points: recorded ? 5 : 0, account };
    },
    async recordAttempt(input) {
      if (!state.account) { fail('Sign in to save a trip.'); return; }
      const parsed = AttemptInputSchema.safeParse(input);
      if (!parsed.success) { fail('This trip could not be saved.'); return; }
      const previous = input.client_id && state.attempts.find(attempt => attempt.client_id === input.client_id);
      if (previous) return { attempt: previous, account: state.account };
      const account = structuredClone(state.account);
      const index = account.stats.attempts + 1;
      const attempt = AttemptSchema.parse({ ...parsed.data, id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, verification: 'unverified', points: 0, created_at: '2026-09-13T12:00:00Z' });
      account.stats.attempts = index;
      publish({ ...state, attempts: [attempt, ...state.attempts].slice(0, 1000) });
      return { attempt, account: update(account) };
    },
    async deleteAccount() { this.signOut(); return true; },
  };
}
