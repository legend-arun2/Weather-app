import type { HourPoint, OutfitAdvice, Units } from '../types';
import { tempUnit, toTemp, toWind, windUnit } from './units';

const ICY_CODES = new Set([56, 57, 66, 67, 71, 73, 75, 77, 85, 86]); // snow and freezing rain/drizzle

// Waking hours only: overnight lows shouldn't drag down advice for the day.
function wakingHours(hours: HourPoint[]): HourPoint[] {
  const awake = hours.filter((h) => {
    const hr = Number(h.time.slice(11, 13));
    return hr >= 7 && hr <= 22;
  });
  return awake.length >= 3 ? awake : hours;
}

// Pure rules: takes forecast hours (°C, km/h) and returns advice formatted in the requested units.
export function recommendOutfit(allHours: HourPoint[], units: Units = 'metric'): OutfitAdvice {
  if (allHours.length === 0) return { summary: 'No forecast data to base advice on.', items: [] };
  const hours = wakingHours(allHours);
  const t = (c: number) => `${toTemp(c, units)}${tempUnit(units)}`;

  const feels = hours.map((h) => h.feelsLike);
  const minFeel = Math.min(...feels);
  const maxFeel = Math.max(...feels);
  const avgFeel = feels.reduce((a, b) => a + b, 0) / feels.length;
  const maxRain = Math.max(...hours.map((h) => h.rainChance));
  const maxWind = Math.max(...hours.map((h) => h.wind));
  const maxUv = Math.max(...hours.map((h) => h.uv));
  const icy = hours.some((h) => ICY_CODES.has(h.code));

  const items: OutfitAdvice['items'] = [];
  let summary: string;

  if (avgFeel < 0) {
    summary = 'Freezing out there. Bundle up.';
    items.push({ label: 'Heavy winter coat', reason: `It feels like ${t(minFeel)} at the coldest.` });
    items.push({ label: 'Thermal base layer + sweater', reason: 'Layers trap heat in freezing weather.' });
    items.push({ label: 'Hat, scarf and gloves', reason: 'Protect extremities from the cold.' });
  } else if (avgFeel < 10) {
    summary = 'Cold. Wear a warm jacket.';
    items.push({ label: 'Warm jacket or coat', reason: `Feels like ${t(avgFeel)} on average.` });
    items.push({ label: 'Sweater or fleece', reason: 'An insulating mid layer helps.' });
    items.push({ label: 'Long trousers', reason: 'Keep your legs warm.' });
  } else if (avgFeel < 18) {
    summary = 'Cool. A light jacket does the job.';
    items.push({ label: 'Light jacket or hoodie', reason: `Feels like ${t(avgFeel)} on average.` });
    items.push({ label: 'Long sleeves + long trousers', reason: 'Comfortable for mild, cool weather.' });
  } else if (avgFeel < 25) {
    summary = 'Pleasant. Light clothes work well.';
    items.push({ label: 'T-shirt or light shirt', reason: `Feels like ${t(avgFeel)} on average.` });
    items.push({ label: 'Light trousers or jeans', reason: 'Comfortable without overheating.' });
  } else {
    summary = 'Hot. Dress light and stay cool.';
    items.push({ label: 'Breathable T-shirt and shorts', reason: `Feels like ${t(avgFeel)} on average.` });
    items.push({ label: 'Light-coloured, loose clothing', reason: 'Reflects heat and lets air through.' });
    items.push({ label: 'Water bottle', reason: 'Stay hydrated in the heat.' });
  }

  if (icy) {
    items.push({ label: 'Waterproof boots with grip', reason: 'Snow or freezing rain is in the forecast.' });
  } else if (maxRain >= 40) {
    items.push({ label: 'Umbrella or rain jacket', reason: `Up to ${maxRain}% chance of rain.` });
  }
  if (maxWind >= 30) {
    items.push({ label: 'Windbreaker', reason: `Gusty: winds up to ${toWind(maxWind, units)} ${windUnit(units)}.` });
  }
  if (maxUv >= 6) {
    items.push({ label: 'Sunglasses and sunscreen', reason: `UV index reaches ${Math.round(maxUv)}.` });
  }
  const swing = Math.round(maxFeel - minFeel);
  if (swing >= 10) {
    const swingShown = units === 'metric' ? swing : Math.round(swing * 1.8);
    items.push({ label: 'Bring a removable layer', reason: `Temperature swings about ${swingShown}° during the day.` });
  }

  return { summary, items };
}
