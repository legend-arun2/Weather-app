import { useCallback, useRef, useState } from 'react';
import ChatPanel from './components/ChatPanel';
import type { ChatMessage } from './components/ChatPanel';
import WeatherCard from './components/WeatherCard';
import HourlyChart from './components/HourlyChart';
import OutfitCard from './components/OutfitCard';
import { fetchForecast, geocode, hoursFor } from './lib/openMeteo';
import { parseIntent } from './lib/intent';
import { recommendOutfit } from './lib/outfit';
import { describeCode } from './lib/weatherCodes';
import { tempUnit, toTemp } from './lib/units';
import type { Forecast, Place, Units } from './types';

const HELP_TEXT =
  'Hi! Ask me things like "weather in Paris", "next 24 hours in Tokyo" or "what should I wear today in Oslo?". ' +
  'You can also tap "Use my location".';

function loadUnits(): Units {
  try {
    return localStorage.getItem('units') === 'imperial' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

export default function App() {
  const [units, setUnits] = useState<Units>(loadUnits);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'bot', text: 'Hello! Which place do you want the weather for? ' + HELP_TEXT },
  ]);
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const lastPlace = useRef<Place | null>(null);

  const push = useCallback((m: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...m, id: nextId.current++ }]);
  }, []);

  const toggleUnits = () => {
    const next: Units = units === 'metric' ? 'imperial' : 'metric';
    setUnits(next);
    try { localStorage.setItem('units', next); } catch { /* storage unavailable */ }
  };

  const answer = useCallback(async (text: string, preset?: Place) => {
    const intent = parseIntent(text);
    if (intent.kind === 'help' && !preset) {
      push({ role: 'bot', text: HELP_TEXT });
      return;
    }
    let place: Place | null | undefined = preset;
    if (!place) {
      if (intent.place) {
        place = await geocode(intent.place);
        if (!place) {
          push({ role: 'bot', text: `I couldn't find a place called "${intent.place}". Try a nearby big city or check the spelling.` });
          return;
        }
      } else if (lastPlace.current) {
        place = lastPlace.current;
      } else {
        push({ role: 'bot', text: 'Which city? Tell me a place (e.g. "in Paris") or tap "Use my location".' });
        return;
      }
    }
    lastPlace.current = place;
    const forecast: Forecast = await fetchForecast(place);
    const kind = intent.kind === 'help' ? 'weather' : intent.kind;
    const hours = hoursFor(forecast, intent.tomorrow);
    const day = intent.tomorrow ? 'tomorrow' : 'today';
    const c = forecast.current;
    const summary = `${describeCode(c.code).label}, ${toTemp(c.temp, units)}${tempUnit(units)} in ${place.name} right now.`;

    if (kind === 'outfit') {
      const advice = recommendOutfit(hours);
      push({ role: 'bot', text: `Here's what to wear in ${place.name} ${day}:`,
        extra: <><WeatherCard forecast={forecast} units={units} /><OutfitCard advice={advice} /></> });
    } else if (kind === 'hourly') {
      push({ role: 'bot', text: `Hourly forecast for ${place.name} (${intent.tomorrow ? 'tomorrow' : 'next 24 hours'}):`,
        extra: <HourlyChart hours={hours} units={units} /> });
    } else {
      push({ role: 'bot', text: summary,
        extra: <><WeatherCard forecast={forecast} units={units} /><HourlyChart hours={forecast.hours} units={units} /></> });
    }
  }, [push, units]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      push({ role: 'bot', text: offline ? "You seem to be offline. Check your connection and try again."
        : `Sorry, something went wrong: ${e instanceof Error ? e.message : 'unknown error'}` });
    } finally {
      setBusy(false);
    }
  }, [push]);

  const onSend = (text: string) => {
    push({ role: 'user', text });
    void run(() => answer(text));
  };

  const onLocate = () => {
    if (!navigator.geolocation) {
      push({ role: 'bot', text: "Your browser doesn't support location. Type a city instead." });
      return;
    }
    push({ role: 'user', text: '📍 Use my location' });
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const place: Place = { name: 'Your location', latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        void run(() => answer('weather', place));
      },
      () => {
        setBusy(false);
        push({ role: 'bot', text: "I couldn't get your location. Allow location access or type a city instead." });
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="app">
      <header>
        <h1>🌤️ Weather Chat</h1>
        <button type="button" className="unit-toggle" onClick={toggleUnits} aria-label="Toggle units">
          {units === 'metric' ? '°C' : '°F'}
        </button>
      </header>
      <ChatPanel messages={messages} busy={busy} onSend={onSend} onLocate={onLocate} />
      <footer>Data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></footer>
    </div>
  );
}
