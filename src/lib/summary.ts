import type { HourPoint } from '../types';

export interface DaySummary {
  min: number; // °C
  max: number; // °C
  maxRain: number; // %
  code: number; // most common weather code
}

export function summarize(hours: HourPoint[]): DaySummary | null {
  if (hours.length === 0) return null;
  const temps = hours.map((h) => h.temp);
  const counts = new Map<number, number>();
  for (const h of hours) counts.set(h.code, (counts.get(h.code) ?? 0) + 1);
  const code = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { min: Math.min(...temps), max: Math.max(...temps), maxRain: Math.max(...hours.map((h) => h.rainChance)), code };
}
