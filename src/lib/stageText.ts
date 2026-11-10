import type { HourPoint } from '../types';

export function rainNote(hours: HourPoint[]): string {
  if (hours.length === 0) return '';
  const first = hours.find((h) => h.rainChance >= 40);
  if (first) return `Rain likely from ${first.time.slice(11, 16)}.`;
  const max = Math.max(...hours.map((h) => h.rainChance));
  return max >= 10 ? `Small chance of rain, up to ${max}%.` : 'No rain expected.';
}

export function formatCoords(lat: number, lon: number): string {
  const a = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const o = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${a} ${o}`;
}

export function obsLabel(time: string, tz?: string): string {
  return `Obs ${time.slice(11, 16)}${tz ? ` ${tz}` : ''}`;
}
