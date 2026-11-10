import type { HourPoint } from '../types';

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

/** One line on precipitation for the hours shown; says snow when the forecast code is snow. */
export function rainNote(hours: HourPoint[]): string {
  if (hours.length === 0) return '';
  const first = hours.find((h) => h.rainChance >= 40);
  if (first) return `${SNOW_CODES.has(first.code) ? 'Snow' : 'Rain'} likely from ${first.time.slice(11, 16)}.`;
  const max = Math.max(...hours.map((h) => h.rainChance));
  if (max < 10) return 'No rain expected.';
  const snowy = hours.some((h) => h.rainChance >= 10 && SNOW_CODES.has(h.code));
  return `Small chance of ${snowy ? 'snow' : 'rain'}, up to ${max}%.`;
}

export function formatCoords(lat: number, lon: number): string {
  const a = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const o = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${a} ${o}`;
}

export function obsLabel(time: string, tz?: string): string {
  return `Obs ${time.slice(11, 16)}${tz ? ` ${tz}` : ''}`;
}
