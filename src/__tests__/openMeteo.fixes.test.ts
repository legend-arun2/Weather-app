import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchForecast, geocode, hoursFor, mapForecast } from '../lib/openMeteo';
import type { Place } from '../types';

const place: Place = { name: 'Testville', latitude: 48.85661, longitude: 2.35222 };
const times = (start: string, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(start + ':00Z');
    d.setUTCHours(d.getUTCHours() + i);
    return d.toISOString().slice(0, 16);
  });
const payload = (over: any = {}, start = '2026-11-09T00:00', n = 72) => {
  const t = times(start, n);
  const fill = (v: any) => t.map(() => v);
  return {
    current: { time: '2026-11-09T14:15', temperature_2m: 10, apparent_temperature: 8, relative_humidity_2m: 50, wind_speed_10m: 12, weather_code: 3, is_day: 1 },
    hourly: { time: t, temperature_2m: fill(10), apparent_temperature: fill(8), precipitation_probability: fill(20), wind_speed_10m: fill(12), uv_index: fill(2), weather_code: fill(3) },
    ...over,
  };
};

afterEach(() => vi.unstubAllGlobals());

describe('mapForecast validation (M5)', () => {
  it('rejects payloads without current or hourly', () => {
    expect(() => mapForecast(place, {})).toThrow(/incomplete/);
    expect(() => mapForecast(place, { current: payload().current })).toThrow(/incomplete/);
  });
  it('treats null rain/UV as 0 and skips hours with null temperature', () => {
    const p = payload();
    p.hourly.precipitation_probability[20] = null as any;
    p.hourly.uv_index[20] = null as any;
    p.hourly.temperature_2m[21] = null as any;
    const f = mapForecast(place, p);
    expect(f.allHours.find((h) => h.time === '2026-11-09T20:00')).toMatchObject({ rainChance: 0, uv: 0 });
    expect(f.allHours.some((h) => h.time === '2026-11-09T21:00')).toBe(false);
    expect(f.allHours.every((h) => Number.isFinite(h.temp))).toBe(true);
  });
});

describe('hoursFor (H1)', () => {
  it("returns tomorrow's calendar day", () => {
    const f = mapForecast(place, payload());
    const hrs = hoursFor(f, true);
    expect(hrs).toHaveLength(24);
    expect(hrs[0].time).toBe('2026-11-10T00:00');
  });
  it('rolls over month and year', () => {
    const p = payload({}, '2026-12-31T00:00', 72);
    p.current.time = '2026-12-31T22:30';
    expect(hoursFor(mapForecast(place, p), true)[0].time).toBe('2027-01-01T00:00');
  });
  it('returns [] instead of silently falling back when tomorrow is missing', () => {
    const p = payload({}, '2026-11-09T00:00', 24);
    expect(hoursFor(mapForecast(place, p), true)).toEqual([]);
  });
});

describe('network calls', () => {
  it('rounds coordinates and sends a timeout signal (F3, F5)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload() });
    vi.stubGlobal('fetch', fetchMock);
    await fetchForecast(place);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('latitude=48.86');
    expect(url).toContain('longitude=2.35');
    expect(url).toContain('timezone=auto');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
  it('surfaces the API reason on HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: true, reason: 'Latitude must be in range' }) }));
    await expect(fetchForecast(place)).rejects.toThrow(/Latitude must be in range/);
  });
  it('returns null when geocoding finds nothing and encodes the query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await geocode('a&b#c')).toBeNull();
    expect(fetchMock.mock.calls[0][0]).toContain('name=a%26b%23c');
  });
});
