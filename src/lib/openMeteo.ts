import type { Current, Forecast, HourPoint, Place } from '../types';

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';

export async function geocode(query: string): Promise<Place | null> {
  const url = `${GEO}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not look up that place.');
  const data = await res.json();
  const r = data.results?.[0];
  if (!r) return null;
  return { name: r.name, country: r.country, admin1: r.admin1, latitude: r.latitude, longitude: r.longitude };
}

export async function fetchForecast(place: Place): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,uv_index,weather_code',
    forecast_days: '3',
    timezone: 'auto',
  });
  const res = await fetch(`${FORECAST}?${params}`);
  if (!res.ok) throw new Error('Could not load the forecast.');
  return mapForecast(place, await res.json());
}

// Exported for tests: converts the raw Open-Meteo payload into our shape.
export function mapForecast(place: Place, d: any): Forecast {
  const c = d.current;
  const current: Current = {
    temp: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    wind: c.wind_speed_10m,
    code: c.weather_code,
    isDay: c.is_day === 1,
    time: c.time,
  };
  const h = d.hourly;
  const all: HourPoint[] = h.time.map((time: string, i: number) => ({
    time,
    temp: h.temperature_2m[i],
    feelsLike: h.apparent_temperature[i],
    rainChance: h.precipitation_probability[i] ?? 0,
    wind: h.wind_speed_10m[i],
    uv: h.uv_index[i] ?? 0,
    code: h.weather_code[i],
  }));
  // Next 24 hours starting from the current local hour.
  const nowHour = current.time.slice(0, 13);
  let start = all.findIndex((p) => p.time.slice(0, 13) >= nowHour);
  if (start < 0) start = 0;
  return { place, current, hours: all.slice(start, start + 24), allHours: all };
}

// Hours to show for "today/now" (next 24h) or "tomorrow" (tomorrow's calendar day).
export function hoursFor(f: Forecast, tomorrow?: boolean): HourPoint[] {
  if (!tomorrow) return f.hours;
  const t = new Date(f.current.time.slice(0, 10) + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + 1);
  const day = t.toISOString().slice(0, 10);
  const hrs = f.allHours.filter((h) => h.time.startsWith(day));
  return hrs.length ? hrs : f.hours;
}
