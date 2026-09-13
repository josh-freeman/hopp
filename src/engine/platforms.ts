import type { Hack, Route } from '../types';

export interface ParsedPlatform { number?: number; numbers: number[]; sector?: string }
export function parsePlatform(value?: string | number | null): ParsedPlatform {
  if (value == null) return { numbers: [] };
  const raw = String(value).trim();
  if (!/^\d+(?:\s*\/\s*\d+)*(?:\s*[A-Za-z]+(?:-[A-Za-z]+)?)?$/.test(raw)) return { numbers: [] };
  const numbers = (raw.match(/\d+/g) ?? []).map(Number);
  if (numbers.some(number => number <= 0 || !Number.isSafeInteger(number))) return { numbers: [] };
  return { number: numbers[0], numbers, sector: raw.match(/[A-Za-z]+(?:-[A-Za-z]+)?$/)?.[0] };
}
export function includesPlatform(route: Route, number: number): boolean {
  return Array.isArray(route.platforms) ? route.platforms.includes(number)
    : number >= route.platforms.from && number <= route.platforms.to;
}
export function routeFor(hack: Hack, value?: string | number | null): Route | undefined {
  const { numbers } = parsePlatform(value);
  if (numbers.length === 0) return undefined;
  const matches = hack.routes.filter(route => numbers.every(number => includesPlatform(route, number)));
  return matches.length === 1 ? matches[0] : undefined;
}
