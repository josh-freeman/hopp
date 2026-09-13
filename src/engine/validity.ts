import type { Validity } from '../schema/hack';
import { swissDateTime } from './time';

export function isActive(validity: Validity[] | undefined, when: number = Date.now() / 1000): boolean {
  if (!validity) return true;
  const { date } = swissDateTime(when);
  return Boolean(date) && validity.some(window => (!window.from || date >= window.from) && (!window.to || date <= window.to));
}
