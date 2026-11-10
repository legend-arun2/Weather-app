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

// Geometry in viewBox units (600 x 262): temperature curve on top, rain strip below, hour labels under it.
export const CHART = { W: 600, H: 262, left: 24, right: 24, top: 40, base: 148, rainBase: 224, rainMax: 44, barW: 16 } as const;

export interface ChartLabel { text: string; left: number; top: number } // left/top in % of the chart box
export interface ChartModel {
  line: string;
  area: string;
  rain: string;
  now: { x: number; y: number } | null;
  labels: ChartLabel[];
  hourLabels: { text: string; left: number }[];
  /** One entry per plotted hour, for the hover/keyboard scrubber. left/top in % of the chart box. */
  points: { left: number; top: number; time: string; temp: number; rain: number; code: number }[];
}

const f = (n: number) => n.toFixed(1);
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Smooth temperature line (Catmull-Rom to Bezier), area under it, and one path of rounded rain bars. */
export function buildChart(hours: HourPoint[], units: Units, showNow: boolean): ChartModel | null {
  const cols = sampleHours(hours, 12);
  const n = cols.length;
  if (n === 0) return null;
  const { W, H, left, right, top, base, rainBase, rainMax, barW } = CHART;
  const temps = cols.map((h) => toTemp(h.temp, units));
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(max - min, 1);
  const x = (i: number) => (n === 1 ? W / 2 : left + (i * (W - left - right)) / (n - 1));
  const y = (t: number) => (max === min ? (top + base) / 2 : top + (1 - (t - min) / span) * (base - top - 6));
  const pts = temps.map((t, i) => [x(i), y(t)] as const);

  let line = `M${f(pts[0][0])},${f(pts[0][1])}`;
  if (n === 1) line += ` L${f(pts[0][0] + 0.01)},${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    line += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  const area = `${line} L${f(pts[n - 1][0])},${base} L${f(pts[0][0])},${base} Z`;

  const r = 3;
  let rain = '';
  cols.forEach((h, i) => {
    const bh = Math.max((h.rainChance / 100) * rainMax, 2);
    const bx = x(i) - barW / 2;
    const by = rainBase - bh;
    const rr = Math.min(r, bh / 2);
    rain += `M${f(bx)},${rainBase} V${f(by + rr)} Q${f(bx)},${f(by)} ${f(bx + rr)},${f(by)} H${f(bx + barW - rr)} Q${f(bx + barW)},${f(by)} ${f(bx + barW)},${f(by + rr)} V${rainBase} Z `;
  });

  const pct = (v: number, total: number) => Number(((v / total) * 100).toFixed(2));
  const lowI = temps.indexOf(min);
  const highI = temps.indexOf(max);
  const maxRain = Math.max(...cols.map((h) => h.rainChance));
  const peakI = cols.findIndex((h) => h.rainChance === maxRain);
  const labels: ChartLabel[] = [];
  const temp = (i: number, text: string, dx = 0) =>
    labels.push({ text, left: clamp(pct(x(i) + dx, W), 7, 93), top: pct(pts[i][1] - 14, H) });
  if (showNow) temp(0, `NOW ${temps[0]}°`, 30);
  else if (highI !== lowI) temp(highI, `HIGH ${max}°`);
  if (lowI !== 0 || !showNow) temp(lowI, `LOW ${min}°`);
  if (maxRain >= 10) {
    labels.push({ text: `${maxRain}%`, left: clamp(pct(x(peakI), W), 5, 95), top: pct(rainBase - (maxRain / 100) * rainMax - 4, H) });
  }
  const hourLabels = cols
    .map((h, i) => ({ text: `${h.time.slice(11, 13)}h`, left: pct(x(i), W), i }))
    .filter((h) => n <= 6 || h.i % 2 === 0)
    .map(({ text, left }) => ({ text, left }));

  const points = cols.map((h, i) => ({
    left: pct(pts[i][0], W), top: pct(pts[i][1], H), time: h.time.slice(11, 16), temp: temps[i], rain: h.rainChance, code: h.code,
  }));

  return { line, area, rain, now: showNow ? { x: pts[0][0], y: pts[0][1] } : null, labels, hourLabels, points };
}
