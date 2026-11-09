import type { HourPoint, OutfitAdvice } from '../types';

// Pure rules: takes the hours to dress for (°C, km/h) and returns advice.
export function recommendOutfit(hours: HourPoint[]): OutfitAdvice {
  if (hours.length === 0) return { summary: 'No forecast data to base advice on.', items: [] };

  const feels = hours.map((h) => h.feelsLike);
  const minFeel = Math.min(...feels);
  const maxFeel = Math.max(...feels);
  const avgFeel = feels.reduce((a, b) => a + b, 0) / feels.length;
  const maxRain = Math.max(...hours.map((h) => h.rainChance));
  const maxWind = Math.max(...hours.map((h) => h.wind));
  const maxUv = Math.max(...hours.map((h) => h.uv));
  const snowy = hours.some((h) => (h.code >= 71 && h.code <= 77) || h.code === 85 || h.code === 86);

  const items: OutfitAdvice['items'] = [];
  let summary: string;

  if (avgFeel < 0) {
    summary = 'Freezing out there. Bundle up.';
    items.push({ label: 'Heavy winter coat', reason: `It feels like ${Math.round(minFeel)}°C at the coldest.` });
    items.push({ label: 'Thermal base layer + sweater', reason: 'Layers trap heat in freezing weather.' });
    items.push({ label: 'Hat, scarf and gloves', reason: 'Protect extremities from the cold.' });
  } else if (avgFeel < 10) {
    summary = 'Cold. Wear a warm jacket.';
    items.push({ label: 'Warm jacket or coat', reason: `Feels like ${Math.round(avgFeel)}°C on average.` });
    items.push({ label: 'Sweater or fleece', reason: 'An insulating mid layer helps.' });
    items.push({ label: 'Long trousers', reason: 'Keep your legs warm.' });
  } else if (avgFeel < 18) {
    summary = 'Cool. A light jacket does the job.';
    items.push({ label: 'Light jacket or hoodie', reason: `Feels like ${Math.round(avgFeel)}°C on average.` });
    items.push({ label: 'Long sleeves + long trousers', reason: 'Comfortable for mild, cool weather.' });
  } else if (avgFeel < 25) {
    summary = 'Pleasant. Light clothes work well.';
    items.push({ label: 'T-shirt or light shirt', reason: `Feels like ${Math.round(avgFeel)}°C on average.` });
    items.push({ label: 'Light trousers or jeans', reason: 'Comfortable without overheating.' });
  } else {
    summary = 'Hot. Dress light and stay cool.';
    items.push({ label: 'Breathable T-shirt and shorts', reason: `Feels like ${Math.round(avgFeel)}°C on average.` });
    items.push({ label: 'Light-coloured, loose clothing', reason: 'Reflects heat and lets air through.' });
    items.push({ label: 'Water bottle', reason: 'Stay hydrated in the heat.' });
  }

  if (snowy) {
    items.push({ label: 'Waterproof boots', reason: 'Snow is in the forecast.' });
  } else if (maxRain >= 40) {
    items.push({ label: 'Umbrella or rain jacket', reason: `Up to ${maxRain}% chance of rain.` });
  }
  if (maxWind >= 30) {
    items.push({ label: 'Windbreaker', reason: `Gusty: winds up to ${Math.round(maxWind)} km/h.` });
  }
  if (maxUv >= 6) {
    items.push({ label: 'Sunglasses and sunscreen', reason: `UV index reaches ${Math.round(maxUv)}.` });
  }
  if (maxFeel - minFeel >= 10) {
    items.push({
      label: 'Bring a removable layer',
      reason: `Temperature swings about ${Math.round(maxFeel - minFeel)}° during the day.`,
    });
  }

  return { summary, items };
}
