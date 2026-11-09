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
}

export type IntentKind = 'weather' | 'hourly' | 'outfit' | 'help';

export interface Intent {
  kind: IntentKind;
  place?: string;
  tomorrow?: boolean;
}

export interface OutfitAdvice {
  summary: string;
  items: { label: string; reason: string }[];
}
