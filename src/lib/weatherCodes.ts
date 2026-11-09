import type { IconName } from '../types';

// WMO weather interpretation codes used by Open-Meteo.
export function describeCode(code: number, isDay = true): { label: string; icon: IconName } {
  if (code === 0) return { label: 'Clear sky', icon: isDay ? 'sun' : 'moon' };
  if (code === 1) return { label: 'Mainly clear', icon: isDay ? 'sun' : 'moon' };
  if (code === 2) return { label: 'Partly cloudy', icon: isDay ? 'partly' : 'partly-night' };
  if (code === 3) return { label: 'Overcast', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'fog' };
  if (code === 56 || code === 57) return { label: 'Freezing drizzle', icon: 'drizzle' };
  if (code >= 51 && code <= 55) return { label: 'Drizzle', icon: 'drizzle' };
  if (code === 66 || code === 67) return { label: 'Freezing rain', icon: 'rain' };
  if (code >= 61 && code <= 65) return { label: 'Rain', icon: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Rain showers', icon: 'rain' };
  if (code === 85 || code === 86) return { label: 'Snow showers', icon: 'snow' };
  if (code >= 95) return { label: 'Thunderstorm', icon: 'storm' };
  return { label: 'Unknown', icon: 'cloud' };
}

export function uvLabel(uv: number): string {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  return 'Very high';
}
