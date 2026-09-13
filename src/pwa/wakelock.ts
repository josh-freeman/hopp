let sentinel: WakeLockSentinel | null = null;
let pending = false;
let wanted = false;
export async function keepAwake(active: boolean): Promise<void> {
  wanted = active;
  if (!active) { await sentinel?.release().catch(() => {}); sentinel = null; return; }
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible' || sentinel || pending) return;
  pending = true;
  try {
    const acquired = await navigator.wakeLock.request('screen');
    if (!wanted || document.visibilityState !== 'visible') { await acquired.release(); return; }
    sentinel = acquired;
    acquired.addEventListener('release', () => { if (sentinel === acquired) sentinel = null; });
  } catch { /* Unsupported or battery saving: app still works. */ }
  finally { pending = false; }
}
document.addEventListener('visibilitychange', () => { if (wanted) void keepAwake(true); });
