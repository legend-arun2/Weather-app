import type { Current, Forecast, HourPoint, Place } from '../types';

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10_000;

async function getJson(url: string, what: string): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new Error('The weather service took too long to respond. Please try again.');
    }
    throw e;
  }
  if (!res.ok) {
    let reason = '';
    try {
      const body = await res.json();
      if (typeof body?.reason === 'string') reason = body.reason.slice(0, 200);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(reason ? `${what}: ${reason}` : `${what} (HTTP ${res.status}).`);
  }
  return res.json();
}

export async function geocode(query: string): Promise<Place | null> {
  const data = await getJson(
    `${GEO}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
    'Could not look up that place',
  );
  const r = data?.results?.[0];
  if (!r) return null;
  return { name: r.name, country: r.country, admin1: r.admin1, latitude: r.latitude, longitude: r.longitude };
}

// Open-Meteo's grid is ~1-11 km, so ~1 km precision loses nothing and shares less location.
const round2 = (n: number) => String(Math.round(n * 100) / 100);

export async function fetchForecast(place: Place): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: round2(place.latitude),
    longitude: round2(place.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,uv_index,weather_code',
    forecast_days: '3',
    timezone: 'auto',
  });
  return mapForecast(place, await getJson(`${FORECAST}?${params}`, 'Could not load the forecast'));
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const orZero = (v: unknown) => (finite(v) ? v : 0);

// Exported for tests: validates the raw Open-Meteo payload and converts it to our shape.
export function mapForecast(place: Place, d: any): Forecast {
  const c = d?.current;
  const h = d?.hourly;
  if (!c || !finite(c.temperature_2m) || !Array.isArray(h?.time) || !Array.isArray(h?.temperature_2m)) {
    throw new Error('The forecast response was incomplete. Please try again.');
  }
  const current: Current = {
    temp: c.temperature_2m,
    feelsLike: finite(c.apparent_temperature) ? c.apparent_temperature : c.temperature_2m,
    humidity: orZero(c.relative_humidity_2m),
    wind: orZero(c.wind_speed_10m),
    code: orZero(c.weather_code),
    isDay: c.is_day === 1,
    time: String(c.time),
  };
  const all: HourPoint[] = [];
  h.time.forEach((time: string, i: number) => {
    const temp = h.temperature_2m[i];
    if (!finite(temp)) return; // skip hours with no temperature rather than show NaN
    all.push({
      time,
      temp,
      feelsLike: finite(h.apparent_temperature?.[i]) ? h.apparent_temperature[i] : temp,
      rainChance: orZero(h.precipitation_probability?.[i]),
      wind: orZero(h.wind_speed_10m?.[i]),
      uv: orZero(h.uv_index?.[i]),
      code: orZero(h.weather_code?.[i]),
    });
  });
  if (all.length === 0) throw new Error('The forecast response had no hourly data.');
  // Next 24 hours starting from the current local hour.
  const nowHour = current.time.slice(0, 13);
  let start = all.findIndex((p) => p.time.slice(0, 13) >= nowHour);
  if (start < 0) start = 0;
  return { place, current, hours: all.slice(start, start + 24), allHours: all };
}

// Hours for "today/now" (next 24h) or "tomorrow" (tomorrow's calendar day; [] if not in the data).
export function hoursFor(f: Forecast, tomorrow?: boolean): HourPoint[] {
  if (!tomorrow) return f.hours;
  const t = new Date(f.current.time.slice(0, 10) + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + 1);
  const day = t.toISOString().slice(0, 10);
  return f.allHours.filter((h) => h.time.startsWith(day));
}
