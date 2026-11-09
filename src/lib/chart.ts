import type { HourPoint, Units } from '../types';
import { tempUnit, toTemp } from './units';

/** Evenly sample up to `max` hours (always keeping the first) so the chart stays readable. */
export function sampleHours(hours: HourPoint[], max = 12): HourPoint[] {
  if (hours.length <= max) return hours;
  const step = Math.ceil(hours.length / max);
  return hours.filter((_, i) => i % step === 0);
}

/** Text alternative for the chart, for screen readers. */
export function chartSummary(hours: HourPoint[], units: Units): string {
  if (hours.length === 0) return 'No hourly data.';
  const temps = hours.map((h) => toTemp(h.temp, units));
  const peak = hours.reduce((a, b) => (b.rainChance > a.rainChance ? b : a));
  const u = tempUnit(units);
  const rain = peak.rainChance > 0 ? `Rain chance peaks at ${peak.rainChance}% around ${peak.time.slice(11, 16)}.` : 'No rain expected.';
  return `Hourly forecast: high ${Math.max(...temps)}${u}, low ${Math.min(...temps)}${u}. ${rain}`;
}
