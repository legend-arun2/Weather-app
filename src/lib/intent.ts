import type { Intent } from '../types';

const OUTFIT = /\b(wear|outfit|dress|clothes|clothing|jacket|coat|umbrella|sweater|layers?)\b/i;
const HOURLY = /\b(hourly|24\s*-?\s*hours?|next\s+\d*\s*hours?|tonight|today'?s? forecast|hour by hour)\b/i;
const HELP = /^\s*(help|hi|hello|hey|\?)\s*[!.?]*\s*$/i;
const WEATHER = /\b(weather|forecast|temperature|temp|rain|raining|snow|sunny|hot|cold|warm|humid|wind|windy)\b/i;

// Words that look like a place after "in/at/for" but aren't.
const NOT_PLACE = /^(today|tomorrow|tonight|now|the morning|the evening|the afternoon|general|short|total|case|fact)$/i;

export function extractPlace(text: string): string | undefined {
  const m = text.match(/\b(?:in|at|for|near|around)\s+([A-Za-z][A-Za-z .'\-,]*?)(?=\s+(?:today|tomorrow|tonight|now|right now|please|this|next)\b|[?!.]*$)/i);
  let place = m?.[1]?.trim().replace(/[,.\s]+$/, '');
  if (place && NOT_PLACE.test(place)) place = undefined;
  return place || undefined;
}

export function parseIntent(text: string): Intent {
  const tomorrow = /\btomorrow\b/i.test(text);
  const place = extractPlace(text);
  if (HELP.test(text)) return { kind: 'help' };
  if (OUTFIT.test(text)) return { kind: 'outfit', place, tomorrow };
  if (HOURLY.test(text)) return { kind: 'hourly', place, tomorrow };
  if (WEATHER.test(text) || place) return { kind: 'weather', place, tomorrow };
  // A bare short message is treated as a city name, e.g. "Paris".
  const bare = text.trim();
  if (/^[A-Za-z][A-Za-z .'\-,]{1,40}$/.test(bare) && bare.split(/\s+/).length <= 3) {
    return { kind: 'weather', place: bare, tomorrow };
  }
  return { kind: 'help' };
}
