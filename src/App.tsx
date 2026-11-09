import { useCallback, useMemo, useRef, useState } from 'react';
import ChatPanel from './components/ChatPanel';
import type { ChatMessage } from './components/ChatPanel';
import Stage from './components/Stage';
import type { StageData } from './components/Stage';
import SkyBackdrop from './components/SkyBackdrop';
import OutfitCard from './components/OutfitCard';
import Icon from './components/Icon';
import { fetchForecast, geocode, hoursFor } from './lib/openMeteo';
import { parseIntent } from './lib/intent';
import { recommendOutfit } from './lib/outfit';
import { skyFor, skyForHour, skyIcon } from './lib/sky';
import { summarize } from './lib/summary';
import { describeCode } from './lib/weatherCodes';
import { rainNote } from './lib/stageText';
import { tempUnit, toTemp } from './lib/units';
import type { Place, Units } from './types';

const HELP_TEXT =
  'Ask me things like "weather in Paris", "next 24 hours in Tokyo" or "what should I wear today in Oslo?". ' +
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
  const [stage, setStage] = useState<StageData | null>(null);
  const [startHour] = useState(() => new Date().getHours());
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const lastPlace = useRef<Place | null>(null);

  // The whole screen is painted as the current weather; before any forecast it follows the clock.
  const sky = useMemo(() => {
    if (!stage) return skyForHour(startHour);
    const s = summarize(stage.hours);
    return stage.tomorrow && s ? skyFor(s.code, true) : skyFor(stage.forecast.current.code, stage.forecast.current.isDay);
  }, [stage, startHour]);

  const push = useCallback((m: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...m, id: nextId.current++ }]);
  }, []);
  const say = useCallback((text: string) => push({ role: 'bot', text }), [push]);

  const setUnitsPref = (next: Units) => {
    setUnits(next);
    try { localStorage.setItem('units', next); } catch { /* storage unavailable */ }
  };

  const answer = useCallback(async (text: string, preset?: Place) => {
    const intent = parseIntent(text);
    if (intent.kind === 'help' && !preset) return say(HELP_TEXT);
    if (intent.unsupported && !preset) {
      return say(`I can only do today and tomorrow, not "${intent.unsupported}". Try "weather in Paris tomorrow".`);
    }

    let place: Place | null | undefined = preset;
    if (!place) {
      if (intent.place) {
        place = await geocode(intent.place);
        if (!place) return say(`I couldn't find a place called "${intent.place}". Try a nearby big city or check the spelling.`);
      } else if (lastPlace.current) {
        place = lastPlace.current;
      } else {
        return say('Which city? Tell me a place (e.g. "in Paris") or tap "Use my location".');
      }
    }
    const forecast = await fetchForecast(place);
    lastPlace.current = place; // only remember a place once its forecast has loaded

    const kind = intent.kind === 'help' ? 'weather' : intent.kind;
    const tomorrow = !!intent.tomorrow;
    let hours = hoursFor(forecast, tomorrow);
    if (tomorrow && hours.length === 0) return say(`I don't have tomorrow's forecast for ${place.name} yet.`);
    if (intent.hours && !tomorrow) hours = hours.slice(0, intent.hours);
    const day = tomorrow ? 'tomorrow' : 'today';
    const chartTitle = tomorrow ? 'Tomorrow' : `Next ${hours.length} hours`;
    const name = place.name;
    setStage({ forecast, hours, tomorrow, chartTitle });
    // When the layout is stacked (phones), bring the new weather back into view; outfit advice is in the chat below it.
    if (kind !== 'outfit' && window.matchMedia('(max-width: 900px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }

    if (kind === 'outfit') {
      push({
        role: 'bot',
        text: (u) => `${recommendOutfit(hours, u).summary} Here's what to wear in ${name} ${day}:`,
        body: (u) => <OutfitCard advice={recommendOutfit(hours, u)} />,
      });
    } else if (kind === 'hourly') {
      push({ role: 'bot', text: `Hourly forecast for ${name} (${chartTitle.toLowerCase()}) is on the left.` });
    } else {
      const s = summarize(hours)!;
      push({
        role: 'bot',
        text: (u) => {
          const label = describeCode(tomorrow ? s.code : forecast.current.code, forecast.current.isDay).label;
          return tomorrow
            ? `Tomorrow in ${name}: ${label}, ${toTemp(s.min, u)}–${toTemp(s.max, u)}${tempUnit(u)}. ${rainNote(hours)}`
            : `${label}, ${toTemp(forecast.current.temp, u)}${tempUnit(u)} in ${name} right now. ${rainNote(hours)}`;
        },
      });
    }
  }, [push, say]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      if (offline) say('You seem to be offline. Check your connection and try again.');
      else if (e instanceof TypeError) say('Could not reach the weather service. Check your connection and try again.');
      else say(`Sorry, something went wrong: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  }, [say]);

  const onSend = (text: string) => {
    push({ role: 'user', text });
    void run(() => answer(text));
  };

  const onLocate = () => {
    if (!navigator.geolocation) return say("Your browser doesn't support location. Type a city instead.");
    push({ role: 'user', text: 'Use my location' });
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const place: Place = { name: 'Your location', latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        void run(() => answer('weather', place));
      },
      () => {
        setBusy(false);
        say("I couldn't get your location. Allow location access or type a city instead.");
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="sky" data-sky={sky}>
      <SkyBackdrop />
      <div className="shell">
        <header>
          <div className="brand">
            <span className="logo"><Icon name={skyIcon(sky)} size={30} strokeWidth={1.8} /></span>
            <h1>Weather Chat</h1>
          </div>
          <div className="unit-toggle" role="group" aria-label="Temperature units">
            <button type="button" className="unit-btn" aria-pressed={units === 'metric'} onClick={() => setUnitsPref('metric')}>°C</button>
            <button type="button" className="unit-btn" aria-pressed={units === 'imperial'} onClick={() => setUnitsPref('imperial')}>°F</button>
          </div>
        </header>
        <main className="layout">
          <Stage data={stage} units={units} />
          <ChatPanel messages={messages} units={units} busy={busy} onSend={onSend} onLocate={onLocate} />
        </main>
        <footer>
          <span>Data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span>
          <span>Places you type, and approximate coordinates if you use your location, are sent to Open-Meteo. Only your unit choice is saved on this device.</span>
        </footer>
      </div>
    </div>
  );
}
