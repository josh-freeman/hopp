import type { AccountState, PracticeScenario } from '../account/types';
import { esc, icon, button } from './html';
import { hacks } from '../engine';

interface AccountView {
  mock: boolean;
  busy: boolean;
  activeScenarioId?: string;
  feedback?: { correct: boolean; awarded_points: number; feedback: string };
  confirmDelete?: boolean;
  settingsOpen?: boolean;
  unlockedReward?: { id: string; name: string; points: number };
}
const themes = ['signal', 'forest', 'night', 'track', 'alpine', 'dusk'];
function routeLabel(id?: string | null): string {
  const route = hacks.find(hack => hack.id === id);
  return route ? `${route.alight.name} → ${route.station.name}` : 'Saved train connection';
}

const profileGraphic = `<svg class="profile-graphic" aria-hidden="true" viewBox="0 0 320 94" fill="none"><path d="M-8 72H82C102 72 103 22 127 22H219C239 22 238 64 258 64H330" stroke="currentColor" stroke-width="2"/><path d="M-8 82H88C113 82 112 32 133 32H213C230 32 235 74 256 74H330" stroke="currentColor" stroke-width="1" opacity=".4"/><circle cx="46" cy="72" r="6" fill="var(--profile-bg)" stroke="currentColor" stroke-width="2"/><circle cx="167" cy="22" r="6" fill="var(--profile-bg)" stroke="currentColor" stroke-width="2"/><path d="m274 60 5 4-5 4" stroke="currentColor" stroke-width="2"/></svg>`;

function practiceCard(scenario: PracticeScenario, view: AccountView): string {
  const open = view.activeScenarioId === scenario.id;
  return `<article class="practice-card ${scenario.completed ? 'is-complete' : ''}">
    ${button(`<span class="practice-marker">${icon(scenario.completed ? 'check' : scenario.id === 'budget' ? 'clock' : scenario.id === 'platform' ? 'train' : 'map')}</span><span><strong>${esc(scenario.title)}</strong><small>${scenario.completed ? 'Completed' : '25 practice points'}</small></span>${icon(open ? 'minus' : 'plus')}`, 'practice-open', 'practice-toggle', `data-scenario="${esc(scenario.id)}" aria-expanded="${open}" aria-controls="practice-${esc(scenario.id)}"`)}
    <div id="practice-${esc(scenario.id)}" class="practice-content" ${open ? '' : 'hidden'}>
      <p>${esc(scenario.prompt)}</p>
      ${scenario.completed ? `<p class="practice-completed">${icon('check')} 25 points earned</p>` : `<div class="practice-choices">${scenario.choices.map(choice => button(esc(choice.label), 'practice-answer', 'secondary', `data-scenario="${esc(scenario.id)}" data-answer="${esc(choice.id)}" ${view.busy ? 'disabled' : ''}`)).join('')}</div>`}
      ${open && view.feedback ? `<p class="practice-feedback ${view.feedback.correct ? 'correct' : ''}" role="status">${view.feedback.awarded_points > 0 ? `<strong>+${view.feedback.awarded_points} points.</strong> ` : ''}${esc(view.feedback.feedback)}</p>` : ''}
      ${open && view.feedback?.correct && view.unlockedReward ? button(`Use ${esc(view.unlockedReward.name)} ${icon('arrow')}`, 'reward-use', 'secondary reward-use', `data-reward-id="${esc(view.unlockedReward.id)}" ${view.busy ? 'disabled' : ''}`) : ''}
    </div>
  </article>`;
}

export function accountScreen(state: AccountState, view: AccountView): string {
  const account = state.account;
  const message = state.error ? `<p class="notice" role="alert">${esc(state.error)} ${button('Try again', 'account-reload', 'text-button')}</p>` : '';
  if (!account) {
    return `<section class="screen account-screen" data-screen="account" data-testid="screen"><div><p class="eyebrow">Free account</p><h1>Your Hopp profile</h1></div>
      ${message}${state.status === 'loading' ? '<p class="muted" role="status">Loading your profile…</p>' : ''}
      <div class="profile-pass theme-signal"><span class="eyebrow">Hopp</span><h2>Your points.<br>Your colours.</h2>${profileGraphic}</div>
      <ul class="account-benefits"><li>${icon('settings')} Pace and settings across devices</li><li>${icon('award')} Points, milestones and profile rewards</li><li>${icon('train')} Your saved trips, kept private</li></ul>
      <p class="muted">Use the same Google account as joshfreeman.me. Planning and live guidance work without an account.</p>
      <div class="bottom-actions account-signin-actions">${view.mock ? button(`Open demo profile ${icon('arrow')}`, 'account-signin', 'primary', 'data-testid="primary-action"') : `<button type="button" class="google-signin" data-action="account-signin" aria-label="Sign in with Google" ${view.busy || state.status === 'loading' ? 'disabled' : ''}><img src="${import.meta.env.BASE_URL}brand/google-sign-in.svg" alt="" width="216" height="48"/></button>`}${button('Back to your trip', 'plan', 'text-button')}</div>
    </section>`;
  }
  const { stats, profile, rewards } = account;
  const name = profile.nickname || account.user.name || 'Your profile';
  const theme = themes.includes(profile.selected_theme) ? profile.selected_theme : 'signal';
  const completed = Math.min(stats.practice_completed, stats.practice_total);
  const nextReward = rewards.filter(reward => !reward.unlocked).sort((a, b) => a.points_required - b.points_required)[0];
  const badgeNames: Record<string, string> = { prepared: 'Prepared', regular: '7 active days', commuter: '30 active days', yearbook: '100 active days' };
  const activeDays = stats.active_days ?? 0;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const checkedToday = stats.last_active_date === today;
  return `<section class="screen account-screen" data-screen="account" data-testid="screen"><div class="account-heading"><div><p class="eyebrow">Private profile</p><h1>${esc(name)}</h1></div></div>
    ${message}
    ${view.unlockedReward ? `<div class="reward-unlocked" role="status"><span class="unlock-emblem">${icon('award')}</span><div><span class="eyebrow">+${view.unlockedReward.points} points</span><strong>${esc(view.unlockedReward.name)} unlocked</strong></div>${button('Use style', 'reward-use', 'text-button', `data-reward-id="${esc(view.unlockedReward.id)}" ${view.busy ? 'disabled' : ''}`)}</div>` : ''}
    <div class="profile-pass theme-${theme}" data-testid="profile-pass"><div class="pass-top"><span class="eyebrow">Hopp ${view.mock ? '· Demo profile' : ''}</span>${icon('run')}</div><div class="pass-score"><strong data-testid="practice-points">${stats.points}</strong><span>Hopp points</span></div>${profileGraphic}<div class="pass-bottom"><span>${stats.active_days ?? 0} active days</span>${completed === stats.practice_total ? `<span class="prepared-badge">${icon('award')} Prepared</span>` : `<span>${completed} / ${stats.practice_total} checks</span>`}</div></div>
    ${nextReward ? `<div class="next-reward"><div><span class="muted">Next unlock</span><strong>${esc(nextReward.name)} profile</strong></div><span class="points-to-go">${Math.max(0, nextReward.points_required - stats.points)} points to go</span><progress value="${Math.min(stats.points, nextReward.points_required)}" max="${nextReward.points_required}" aria-label="Progress toward ${esc(nextReward.name)}"></progress></div>` : '<p class="all-rewards">All profile styles unlocked.</p>'}
    <p class="points-rule">25 points per practice check. 5 points for your first connection check each day. Progress never resets when you take a break.</p>
    ${account.badges.length ? `<div class="milestone-list">${account.badges.map(badge => `<span>${icon('award')}${esc(badgeNames[badge] ?? badge)}</span>`).join('')}</div>` : ''}
    <section class="account-section" aria-labelledby="practice-heading"><div class="section-heading"><h2 id="practice-heading">Know your connection</h2><span class="muted">${completed} / ${stats.practice_total}</span></div><p class="muted">Three short checks. Earn points once per check and unlock profile styles.</p><div class="practice-progress" aria-hidden="true">${Array.from({ length: stats.practice_total }, (_, i) => `<span class="${i < completed ? 'complete' : ''}"></span>`).join('')}</div>
      <div class="practice-list">${state.scenarios.map(scenario => practiceCard(scenario, view)).join('')}</div>
    </section>
    <section class="account-section" aria-labelledby="activity-heading"><div class="section-heading"><h2 id="activity-heading">Keep going</h2><span class="muted">${stats.current_month_days ?? 0} days this month</span></div><div class="daily-check ${checkedToday ? 'is-complete' : ''}"><span class="practice-marker">${icon(checkedToday ? 'check' : 'train')}</span><div><strong>${checkedToday ? 'Today’s 5 points earned' : 'Your next connection · +5 points'}</strong><p>${checkedToday ? 'Your next daily reward is tomorrow.' : 'Check a connection when you need one.'}</p></div></div><ol class="milestone-track" aria-label="Lifetime active-day milestones">${[7, 30, 100].map(days => `<li class="${activeDays >= days ? 'reached' : ''}"><span>${activeDays >= days ? icon('award') : icon('lock')}</span><strong>${days} days</strong><small>${activeDays >= days ? 'Earned' : `${days - activeDays} to go`}</small></li>`).join('')}</ol><p class="muted">Every active day counts. No consecutive-day streak to lose.</p></section>
    <section class="account-section" aria-labelledby="rewards-heading"><div class="section-heading"><h2 id="rewards-heading">Your rewards</h2>${icon('award')}</div><p class="muted">Unlocked styles change your profile card.</p><div class="reward-grid">${rewards.map(reward => `<button type="button" class="reward-option ${profile.selected_theme === reward.id ? 'selected' : ''}" data-action="account-theme" data-theme="${esc(reward.id)}" aria-pressed="${profile.selected_theme === reward.id}" ${!reward.unlocked || view.busy ? 'disabled' : ''}><span class="reward-swatch theme-${themes.includes(reward.id) ? reward.id : 'signal'}">${icon(reward.unlocked ? 'run' : 'lock')}</span><strong>${esc(reward.name)}</strong><small>${profile.selected_theme === reward.id ? 'Selected' : reward.unlocked ? 'Use style' : `${reward.points_required} points`}</small></button>`).join('')}</div></section>
    <section class="account-section" aria-labelledby="history-heading"><div class="section-heading"><h2 id="history-heading">Saved trips</h2><span class="muted">${stats.attempts}</span></div><p class="muted">Saved from your platform confirmation. These records are unverified and earn no travel points.</p>${state.attempts.length ? `<ol class="account-history">${state.attempts.map(attempt => `<li><span class="history-icon">${icon('train')}</span><div><strong>${esc(attempt.train || 'Train connection')}${attempt.platform ? ` · Platform ${esc(attempt.platform)}` : ''}</strong><p>${esc(routeLabel(attempt.route_id))}</p><small>Unverified · 0 points</small></div></li>`).join('')}</ol>` : '<div class="history-empty">Your completed trip records will appear here.</div>'}</section>
    <details class="account-settings" ${view.settingsOpen || view.confirmDelete ? 'open' : ''}><summary>Account settings ${icon('settings')}</summary><form id="account-profile-form"><label for="nickname">Display name</label><input id="nickname" name="nickname" value="${esc(profile.nickname)}" placeholder="${esc(account.user.name)}" maxlength="40" autocomplete="nickname"/><button type="submit" class="secondary" ${view.busy ? 'disabled' : ''}>Save name</button></form>${button(`Pace and margin ${icon('arrow')}`, 'settings', 'secondary')}<p class="muted">${esc(account.user.email)}${view.mock ? ' · example account' : ' · shared website account'}</p>${button('Sign out of Hopp', 'account-signout', 'secondary')}
    ${view.confirmDelete ? `<div class="delete-confirm"><p>Delete your Hopp points, rewards and saved trips? Your website account and its access stay unchanged.</p>${button('Delete my Hopp data', 'account-delete-confirm', 'secondary destructive', view.busy ? 'disabled' : '')}${button('Keep my data', 'account-delete-cancel', 'text-button')}</div>` : button('Delete Hopp data', 'account-delete-start', 'text-button destructive')}
    </details><p class="account-privacy">Your profile stores settings, practice progress, active dates and trips you choose to save. Location trails are not collected for rewards or usage metrics.</p><p class="account-attribution">Independent app · not affiliated with SBB.</p>
  </section>`;
}
