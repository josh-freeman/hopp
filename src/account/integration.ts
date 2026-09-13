import { createAccountClient } from './client';
import type { AccountData, AccountTheme, AttemptInput } from './types';
import type { Profile } from '../types';
import { accountScreen } from '../ui/account';

interface Hooks {
  mock: boolean;
  getScreen(): string;
  render(): void;
  navigate(screen: string): void;
  flash(message: string): void;
  onPreferences(profile: Profile): void;
}

export function createAccountIntegration(hooks: Hooks) {
  const callback = new URL(location.href).searchParams.has('hopp_auth_code')
    || new URL(location.href).searchParams.has('hopp_auth_error');
  const client = createAccountClient({ mock: hooks.mock });
  let busy = false;
  let activeScenarioId: string | undefined;
  let feedback: { correct: boolean; awarded_points: number; feedback: string } | undefined;
  let confirmDelete = false, settingsOpen = false;
  let lastPreferences = '';
  let unlockedReward: { id: string; name: string; points: number } | undefined;
  const checkUnlock = (before: Set<string>, account: AccountData, points: number) => {
    const reward = account.rewards.find(item => item.unlocked && !before.has(item.id));
    if (reward && points > 0) unlockedReward = { id: reward.id, name: reward.name, points };
  };
  const unlockedIds = () => new Set(client.state.account?.rewards.filter(item => item.unlocked).map(item => item.id));

  const preferences = (): Profile | undefined => {
    const data = client.state.account?.profile.preferences;
    return data && { sprintMps: data.sprint_mps, minMarginS: data.min_margin_s, bag: data.bag, offerSprintRoutes: data.offer_sprint_routes };
  };
  const refresh = () => { if (hooks.getScreen() === 'account') hooks.render(); };
  const run = (task: () => Promise<unknown>) => {
    if (busy) return;
    busy = true; refresh();
    void task().catch(() => hooks.flash('Could not update your account. Please try again.'))
      .finally(() => { busy = false; refresh(); });
  };
  client.subscribe(state => {
    const current = preferences();
    if (current && JSON.stringify(current) !== lastPreferences) {
      lastPreferences = JSON.stringify(current);
      hooks.onPreferences(current);
    }
    document.querySelector('[data-action="account"]')?.classList.toggle('has-account', !!state.account);
    refresh();
  });

  return {
    get signedIn() { return !!client.state.account; },
    preferences,
    html() { return accountScreen(client.state, { mock: hooks.mock, busy, activeScenarioId, feedback, confirmDelete, settingsOpen, unlockedReward }); },
    async initialize() {
      await client.load();
      if (callback) hooks.navigate('account');
    },
    handleAction(action: string, target: HTMLElement): boolean {
      if (!['account-signin', 'account-signout', 'account-reload', 'practice-open', 'practice-answer', 'account-theme', 'reward-use', 'account-delete-start', 'account-delete-cancel', 'account-delete-confirm'].includes(action)) return false;
      if (action === 'account-signin') run(() => client.signIn());
      if (action === 'account-signout') { unlockedReward = undefined; client.signOut(); activeScenarioId = undefined; feedback = undefined; confirmDelete = false; settingsOpen = false; refresh(); }
      if (action === 'account-reload') run(() => client.load());
      if (action === 'practice-open') { activeScenarioId = activeScenarioId === target.dataset.scenario ? undefined : target.dataset.scenario; feedback = undefined; refresh(); }
      if (action === 'practice-answer') run(async () => {
        const before = unlockedIds();
        feedback = await client.practice(target.dataset.scenario ?? '', target.dataset.answer ?? '');
        if (feedback && client.state.account) checkUnlock(before, client.state.account, feedback.awarded_points);
      });
      if (action === 'account-theme' || action === 'reward-use') run(async () => {
        if (await client.saveProfile({ selected_theme: (target.dataset.theme ?? target.dataset.rewardId) as AccountTheme })) {
          unlockedReward = undefined;
          if (hooks.getScreen() === 'account') window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
      });
      if (action === 'account-delete-start') { confirmDelete = true; settingsOpen = true; refresh(); }
      if (action === 'account-delete-cancel') { confirmDelete = false; settingsOpen = true; refresh(); }
      if (action === 'account-delete-confirm') run(async () => {
        if (await client.deleteAccount()) { unlockedReward = undefined; activeScenarioId = undefined; feedback = undefined; confirmDelete = false; settingsOpen = false; }
      });
      return true;
    },
    handleSubmit(form: HTMLFormElement): boolean {
      if (form.id !== 'account-profile-form') return false;
      const nickname = String(new FormData(form).get('nickname') ?? '').trim();
      settingsOpen = true;
      run(async () => { if (await client.saveProfile({ nickname })) hooks.flash('Name saved.'); });
      return true;
    },
    async savePreferences(profile: Profile): Promise<boolean> {
      if (!client.state.account) return true;
      const saved = await client.saveProfile({ preferences: {
        sprint_mps: profile.sprintMps, min_margin_s: profile.minMarginS, bag: profile.bag, offer_sprint_routes: profile.offerSprintRoutes,
      } });
      if (!saved) hooks.flash(client.state.error ?? 'Could not sync settings. Please try again.');
      return !!saved;
    },
    async recordAttempt(input: AttemptInput) {
      if (!client.state.account) return;
      const saved = await client.recordAttempt(input);
      if (saved) hooks.flash('Trip saved to your profile · unverified.');
      else hooks.flash('Trip could not be saved. Your connection is unchanged.');
    },
    async recordConnectionChecked() {
      if (client.state.account) {
        const before = unlockedIds();
        const result = await client.recordActivity('connection_checked');
        if (result) checkUnlock(before, result.account, result.awarded_points);
        refresh();
      }
    },
  };
}
