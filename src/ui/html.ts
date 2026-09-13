export const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const paths: Record<string, string> = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>', back: '<path d="m14 6-6 6 6 6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  flag: '<path d="M5 21V4h13l-3 4 3 4H5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  run: '<circle cx="15" cy="4" r="2"/><path d="m13 9-4 3-3 8m7-11 3 4 5 1M13 9 9 8l-4 3m6 3 4 3-1 5"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  train: '<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14m-11 8-2 3m10-3 2 3"/><path d="M9 14h.01M15 14h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>', map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
  swap: '<path d="M7 4v16m-4-4 4 4 4-4M17 20V4m-4 4 4-4 4 4"/>',
};
export const icon = (name: string) => `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.arrow}</svg>`;
export const button = (text: string, action: string, className = 'primary', extra = '') => `<button type="button" class="${className}" data-action="${action}" ${extra}>${text}</button>`;
export const primary = (text: string, action: string) => button(`${text}${icon('arrow')}`, action, 'primary', 'data-testid="primary-action"');
export const safety = '<p class="safety">Use crossings and signals. Never cross tracks. Hopp shows a budget, not a promise.</p>';
