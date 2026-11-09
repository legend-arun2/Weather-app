import { describe, expect, it } from 'vitest';
import { mapForecast } from '../lib/openMeteo';

const place = { name: 'Testville', latitude: 0, longitude: 0 };
const times = Array.from({ length: 72 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 10, 9 + Math.floor(i / 24), i % 24));
  return d.toISOString().slice(0, 16);
});
const fill = (v: number) => times.map(() => v);

describe('mapForecast', () => {
  it('returns 24 hours starting at the current hour', () => {
    const f = mapForecast(place, {
      current: { temperature_2m: 10, apparent_temperature: 8, relative_humidity_2m: 50, wind_speed_10m: 12, weather_code: 3, is_day: 1, time: '2026-11-09T14:15' },
      hourly: { time: times, temperature_2m: fill(10), apparent_temperature: fill(8), precipitation_probability: fill(20), wind_speed_10m: fill(12), uv_index: fill(2), weather_code: fill(3) },
    });
    expect(f.hours).toHaveLength(24);
    expect(f.hours[0].time).toBe('2026-11-09T14:00');
    expect(f.current.isDay).toBe(true);
  });
});
