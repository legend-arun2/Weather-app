import { describe, expect, it } from 'vitest';
import { skyFor, skyForHour, skyIcon } from '../lib/sky';
import { buildChart } from '../lib/chart';
import { formatCoords, obsLabel, rainNote } from '../lib/stageText';
import { mapForecast } from '../lib/openMeteo';
import type { HourPoint, Place } from '../types';

const hr = (i: number, over: Partial<HourPoint> = {}): HourPoint => ({
  time: `2026-11-09T${String(i % 24).padStart(2, '0')}:00`, temp: 10 + (i % 5), feelsLike: 9, rainChance: 0, wind: 10, uv: 1, code: 3, ...over,
});
const series = (n: number, over: (i: number) => Partial<HourPoint> = () => ({})) => Array.from({ length: n }, (_, i) => hr(i, over(i)));

describe('skyFor', () => {
  it.each([
    [0, true, 'clear-day'], [0, false, 'clear-night'], [1, true, 'clear-day'],
    [2, true, 'overcast-day'], [3, false, 'overcast-night'],
    [45, true, 'fog'], [48, false, 'fog'],
    [61, true, 'rain-day'], [63, false, 'rain-night'], [67, true, 'rain-day'], [81, false, 'rain-night'], [95, true, 'rain-day'],
    [71, true, 'snow'], [86, false, 'snow'],
  ] as const)('code %i, day=%s -> %s', (code, day, sky) => {
    expect(skyFor(code, day)).toBe(sky);
  });
  it('follows the clock before any forecast', () => {
    expect(skyForHour(12)).toBe('clear-day');
    expect(skyForHour(3)).toBe('clear-night');
    expect(skyForHour(19)).toBe('clear-night');
  });
  it('has an icon for every sky', () => {
    expect(skyIcon('clear-day')).toBe('sun');
    expect(skyIcon('rain-night')).toBe('rain');
    expect(skyIcon('fog')).toBe('fog');
  });
});

describe('buildChart', () => {
  it('returns null for no data', () => {
    expect(buildChart([], 'metric', true)).toBeNull();
  });
  it('builds a line, area, rain bars and labels for a normal day', () => {
    const m = buildChart(series(24, (i) => ({ temp: 14 - (i % 5), rainChance: i === 6 ? 60 : 0 })), 'metric', true)!;
    expect(m.line.startsWith('M')).toBe(true);
    expect(m.area.endsWith('Z')).toBe(true);
    expect(m.rain).toContain('V');
    expect(m.now).not.toBeNull();
    expect(m.labels.map((l) => l.text)).toEqual(expect.arrayContaining([expect.stringMatching(/^NOW /), expect.stringMatching(/^LOW /)]));
    expect(m.labels.some((l) => l.text === '60%')).toBe(true);
    expect(m.hourLabels.length).toBeLessThanOrEqual(6);
  });
  it('uses HIGH and LOW (no now dot) for another day', () => {
    const m = buildChart(series(24), 'metric', false)!;
    expect(m.now).toBeNull();
    expect(m.labels.map((l) => l.text).join(' ')).toMatch(/HIGH .*LOW /);
  });
  it('handles a single hour and a flat series without NaN', () => {
    const one = buildChart([hr(0)], 'metric', true)!;
    expect(one.line).not.toContain('NaN');
    const flat = buildChart(series(6, () => ({ temp: 5 })), 'metric', true)!;
    expect(flat.line + flat.area + flat.rain).not.toContain('NaN');
  });
  it('keeps label positions inside the box and respects units', () => {
    const m = buildChart(series(12), 'imperial', true)!;
    expect(m.labels.every((l) => l.left >= 5 && l.left <= 95)).toBe(true);
    expect(m.labels[0].text).toMatch(/NOW \d+°/);
  });
});

describe('stage text', () => {
  it('describes rain', () => {
    expect(rainNote([])).toBe('');
    expect(rainNote(series(6))).toBe('No rain expected.');
    expect(rainNote(series(6, (i) => ({ rainChance: i === 2 ? 20 : 0 })))).toBe('Small chance of rain, up to 20%.');
    expect(rainNote(series(24, (i) => ({ rainChance: i >= 18 ? 70 : 0 })))).toBe('Rain likely from 18:00.');
  });
  it('formats coordinates and the observation time', () => {
    expect(formatCoords(48.8566, 2.3522)).toBe('48.86°N 2.35°E');
    expect(formatCoords(-33.87, -70.65)).toBe('33.87°S 70.65°W');
    expect(obsLabel('2026-11-09T14:15', 'CET')).toBe('Obs 14:15 CET');
    expect(obsLabel('2026-11-09T14:15')).toBe('Obs 14:15');
  });
  it('reads the timezone abbreviation from the API', () => {
    const place: Place = { name: 'Paris', latitude: 48.85, longitude: 2.35 };
    const t = Array.from({ length: 24 }, (_, i) => `2026-11-09T${String(i).padStart(2, '0')}:00`);
    const f = (v: number) => t.map(() => v);
    const raw = {
      timezone_abbreviation: 'CET',
      current: { time: '2026-11-09T14:15', temperature_2m: 10, apparent_temperature: 8, relative_humidity_2m: 50, wind_speed_10m: 12, weather_code: 3, is_day: 1 },
      hourly: { time: t, temperature_2m: f(10), apparent_temperature: f(8), precipitation_probability: f(0), wind_speed_10m: f(12), uv_index: f(1), weather_code: f(3) },
    };
    expect(mapForecast(place, raw).tzAbbr).toBe('CET');
    expect(mapForecast(place, { ...raw, timezone_abbreviation: undefined }).tzAbbr).toBeUndefined();
  });
});
