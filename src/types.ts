export type Units = 'metric' | 'imperial';

export interface Place {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface HourPoint {
  time: string; // local ISO e.g. 2026-11-09T14:00
  temp: number; // always °C
  feelsLike: number; // °C
  rainChance: number; // %
  wind: number; // km/h
  uv: number;
  code: number;
}

export interface Current {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  code: number;
  isDay: boolean;
  time: string;
}

export interface Forecast {
  place: Place;
  current: Current;
  hours: HourPoint[]; // next 24 hours
  allHours: HourPoint[]; // full multi-day hourly series
  tzAbbr?: string; // e.g. CET, from the API
  sun?: SunTimes[]; // per day, today first
}

export interface SunTimes {
  sunrise: string; // local ISO
  sunset: string;
}

export type IntentKind = 'weather' | 'hourly' | 'outfit' | 'help';

export interface Intent {
  kind: IntentKind;
  place?: string;
  tomorrow?: boolean;
  /** Number of hours asked for ("next 3 hours"), 1-24. */
  hours?: number;
  /** Set when the user asked for a range we don't support (e.g. "next week"). */
  unsupported?: string;
}

export type IconName =
  | 'sun' | 'moon' | 'partly' | 'partly-night' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'
  | 'drop' | 'wind' | 'umbrella' | 'layers' | 'swap' | 'boots' | 'thermo' | 'pin' | 'send';

export interface OutfitAdvice {
  summary: string;
  items: { label: string; reason: string; icon: IconName }[];
}
