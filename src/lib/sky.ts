import type { IconName } from '../types';

/** The sky the whole screen is painted as. Each value has a palette in styles.css. */
export type Sky = 'clear-day' | 'clear-night' | 'overcast-day' | 'overcast-night' | 'rain-day' | 'rain-night' | 'snow' | 'fog' | 'storm';

const SNOW = new Set([71, 73, 75, 77, 85, 86]);

export function skyFor(code: number, isDay: boolean): Sky {
  if (SNOW.has(code)) return 'snow';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 95) return 'storm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return isDay ? 'rain-day' : 'rain-night';
  if (code === 2 || code === 3) return isDay ? 'overcast-day' : 'overcast-night';
  return isDay ? 'clear-day' : 'clear-night';
}

/** Before any forecast is loaded the sky follows the viewer's clock. */
export function skyForHour(hour: number): Sky {
  return hour >= 7 && hour < 19 ? 'clear-day' : 'clear-night';
}

export function skyIcon(sky: Sky): IconName {
  switch (sky) {
    case 'clear-day': return 'sun';
    case 'clear-night': return 'moon';
    case 'overcast-day':
    case 'overcast-night': return 'cloud';
    case 'rain-day':
    case 'rain-night': return 'rain';
    case 'snow': return 'snow';
    case 'fog': return 'fog';
    case 'storm': return 'storm';
  }
}
