import type { Intent } from '../types';

/** Longest message we parse; also the input's maxLength. Keeps regex work bounded. */
export const MAX_INPUT = 200;

const OUTFIT = /\b(wear|outfit|dress|clothes|clothing|jacket|coat|umbrella|sweater|layers?)\b/i;
const HOURLY = /\b(hourly|24\s?-?\s?hours?|next\s\d{1,2}\s?hours?|tonight|today'?s? forecast|hour by hour)\b/i;
const HELP = /^\s*(help|hi|hello|hey|\?)\s?[!.?]*\s*$/i;
const WEATHER = /\b(weather|forecast|temperature|temp|rain|raining|snow|sunny|hot|cold|warm|humid|wind|windy)\b/i;
const UNSUPPORTED = /\b(next week|this week|weekend|next month|this month|\d{1,2}[- ]day|on (?:mon|tues|wednes|thurs|fri|satur|sun)day)\b/i;

// Letters from any script (São Paulo, Zürich, 東京), marks, space and a few name punctuation chars.
const NAME = String.raw`[\p{L}][\p{L}\p{M} .'’\-,]*?`;
const AFTER = String.raw`(?=\s(?:today|tomorrow|tonight|now|right now|please|this|next|on|at|for|by|and)\b|[?!.]*$)`;
const PREP_PLACE = new RegExp(String.raw`\b(?:in|at|for|near|around)\s(${NAME})${AFTER}`, 'iu');
// "Tokyo weather", "what's the Paris forecast"
const PLACE_FIRST = new RegExp(
  String.raw`^\s?(?:(?:what'?s|what is|how'?s|show me)\s(?:the\s)?)?(${NAME})\s(?:weather|forecast)\b`,
  'iu',
);

// Words that look like a place but aren't. Matches the first word.
const NOT_PLACE =
  /^(what|what's|whats|how|how's|hows|is|will|the|it|show|tell|current|today|tomorrow|tonight|now|local|my|general|any|some|a|the morning|the evening|the afternoon|short|total|case|fact)\b/i;
// Greetings and chatter that must never be geocoded.
const CHATTER =
  /^(hi|hello|hey|ok|okay|k|thanks|thank you|thx|yes|no|yep|nope|sure|cool|nice|great|bye|goodbye|good\s(?:morning|evening|afternoon|night)|who|why|when|where|please|sorry|lol|test|what|how|help)\b/i;
const FOLLOW_UP_PREFIX = /^(?:how about|what about|and)\s+/i;

function cleanPlace(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const p = raw.trim().replace(/[,\s]+$/, '').replace(/\.$/, '');
  if (!p || NOT_PLACE.test(p)) return undefined;
  return p;
}

export function extractPlace(text: string): string | undefined {
  const t = text.slice(0, MAX_INPUT);
  return cleanPlace(t.match(PREP_PLACE)?.[1]) ?? cleanPlace(t.match(PLACE_FIRST)?.[1]);
}

export function parseIntent(raw: string): Intent {
  const text = raw.slice(0, MAX_INPUT);
  const tomorrow = /\btomorrow\b/i.test(text);
  const unsupported = text.match(UNSUPPORTED)?.[0];
  const hoursMatch = text.match(/\bnext\s(\d{1,2})\s?hours?\b/i);
  const hours = hoursMatch ? Math.min(Math.max(Number(hoursMatch[1]), 1), 24) : undefined;
  const place = extractPlace(text);
  const extra = { tomorrow, hours, unsupported };

  if (HELP.test(text)) return { kind: 'help' };
  if (OUTFIT.test(text)) return { kind: 'outfit', place, ...extra };
  if (HOURLY.test(text)) return { kind: 'hourly', place, ...extra };
  if (WEATHER.test(text) || place) return { kind: 'weather', place, ...extra };

  // A bare short message is treated as a city name, e.g. "Paris" or "how about Madrid".
  const bare = text.trim().replace(FOLLOW_UP_PREFIX, '').replace(/[!?]+$/, '');
  const unicodeName = /^\p{L}[\p{L}\p{M} .'’\-,]{1,40}$/u;
  if (unicodeName.test(bare) && bare.split(/\s+/).length <= 3 && !CHATTER.test(bare) && !NOT_PLACE.test(bare)) {
    return { kind: 'weather', place: bare, ...extra };
  }
  return { kind: 'help' };
}
