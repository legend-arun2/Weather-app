import { describe, expect, it } from 'vitest';
import { chartSummary, sampleHours } from '../lib/chart';
import { describeCode, uvLabel } from '../lib/weatherCodes';
import type { HourPoint } from '../types';

const hrs = (n: number): HourPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    time: `2026-11-09T${String(i % 24).padStart(2, '0')}:00`, temp: 10 + (i % 5), feelsLike: 9, rainChance: i === 3 ? 70 : 10, wind: 10, uv: 1, code: 3,
  }));

describe('sampleHours', () => {
  it('keeps short series as they are', () => {
    expect(sampleHours(hrs(8))).toHaveLength(8);
  });
  it('samples 24 hours down to at most 12, keeping the first and the order', () => {
    const s = sampleHours(hrs(24));
    expect(s.length).toBeLessThanOrEqual(12);
    expect(s[0].time).toBe('2026-11-09T00:00');
    expect(s.map((h) => h.time)).toEqual([...s.map((h) => h.time)].sort());
  });
});

describe('chartSummary', () => {
  it('describes high, low and the rain peak', () => {
    expect(chartSummary(hrs(6), 'metric')).toBe('Hourly forecast: high 14°C, low 10°C. Rain chance peaks at 70% around 03:00.');
  });
  it('uses the chosen units and handles no data', () => {
    expect(chartSummary(hrs(6), 'imperial')).toContain('°F');
    expect(chartSummary([], 'metric')).toBe('No hourly data.');
  });
});

describe('weather codes', () => {
  it('uses a moon for clear nights and a sun for clear days', () => {
    expect(describeCode(0, true).icon).toBe('sun');
    expect(describeCode(0, false).icon).toBe('moon');
  });
  it('distinguishes mainly clear from partly cloudy and labels freezing rain', () => {
    expect(describeCode(1).label).toBe('Mainly clear');
    expect(describeCode(2).label).toBe('Partly cloudy');
    expect(describeCode(67).label).toBe('Freezing rain');
  });
  it('labels UV levels', () => {
    expect([0, 3, 6, 9].map(uvLabel)).toEqual(['Low', 'Moderate', 'High', 'Very high']);
  });
});
