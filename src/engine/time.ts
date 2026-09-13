import type { Stop } from '../types';

export function parseTimestamp(value?: string | number | null): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NaN;
  if (!value) return Number.NaN;
  const milliseconds = Date.parse(value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return milliseconds / 1000;
}

export function stopTime(stop: Stop, event: 'arrival' | 'departure'): number {
  const predicted = parseTimestamp(stop.prognosis?.[event]);
  if (Number.isFinite(predicted)) return predicted;
  const numeric = parseTimestamp(stop[`${event}Timestamp`]);
  const scheduled = Number.isFinite(numeric) ? numeric : parseTimestamp(stop[event]);
  return scheduled + (Number.isFinite(stop.delay) ? stop.delay! * 60 : 0);
}

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
export function swissDateTime(ts: number): { date: string; time: string } {
  if (!Number.isFinite(ts)) return { date: '', time: '' };
  const parts = Object.fromEntries(partsFormatter.formatToParts(new Date(ts * 1000)).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
export function formatTime(ts: number): string { return swissDateTime(ts).time || '—'; }
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  const value = Math.ceil(Math.abs(seconds));
  return `${seconds < 0 ? '−' : ''}${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
