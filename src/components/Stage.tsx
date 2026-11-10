import type { Forecast, HourPoint, SunTimes, Units } from '../types';
import { describeCode, uvLabel } from '../lib/weatherCodes';
import { tempUnit, toTemp, toWind, windUnit } from '../lib/units';
import { summarize } from '../lib/summary';
import { formatCoords, obsLabel, rainNote } from '../lib/stageText';
import { dayLength, dayProgress } from '../lib/sun';
import HourlyChart from './HourlyChart';

export interface StageData {
  forecast: Forecast;
  hours: HourPoint[];
  tomorrow: boolean;
  chartTitle: string;
}

/** A small arc of the day with the sun placed where it is now (no sun when it is down or for another day). */
function Daylight({ sun, now }: { sun: SunTimes; now?: string }) {
  const p = now ? dayProgress(now, sun.sunrise, sun.sunset) : null;
  const rise = sun.sunrise.slice(11, 16);
  const set = sun.sunset.slice(11, 16);
  return (
    <div className="stat daylight">
      <dt>Daylight</dt>
      <dd>
        <svg viewBox="0 0 200 66" role="img" aria-label={`Sunrise ${rise}, sunset ${set}${p !== null ? ', the sun is up' : ''}`}>
          <path className="sun-path" d="M10,58 A90,46 0 0 1 190,58" fill="none" />
          <line className="sun-horizon" x1="0" x2="200" y1="58" y2="58" />
          {p !== null && <circle className="sun-dot" cx={100 - 90 * Math.cos(Math.PI * p)} cy={58 - 46 * Math.sin(Math.PI * p)} r="6" />}
        </svg>
        <span className="sun-text">
          <span className="sun-times">{rise} – {set}</span>
          <span className="sun-length">{dayLength(sun.sunrise, sun.sunset)}</span>
        </span>
      </dd>
    </div>
  );
}

export default function Stage({ data, units }: { data: StageData | null; units: Units }) {
  if (!data) {
    return (
      <section className="stage stage-empty" aria-label="Weather">
        <div className="caption"><span>Ask about any city</span></div>
        <div className="empty-title">What is the sky doing?</div>
        <p className="empty-text">Ask for the weather, the next 24 hours, or what to wear. The whole screen will take on the weather.</p>
      </section>
    );
  }
  const { forecast, hours, tomorrow, chartTitle } = data;
  const { place, current: c } = forecast;
  const s = summarize(hours);
  const where = [place.name, place.country].filter(Boolean).join(' · ');
  const u = tempUnit(units);
  const big = tomorrow && s ? toTemp(s.max, units) : toTemp(c.temp, units);
  const label = describeCode(tomorrow && s ? s.code : c.code, tomorrow ? true : c.isDay).label;
  const note = tomorrow && s
    ? `Low ${toTemp(s.min, units)}°. ${rainNote(hours)}`
    : `Feels like ${toTemp(c.feelsLike, units)}°. ${rainNote(hours)}`;
  const sun = forecast.sun?.[tomorrow ? 1 : 0];
  const uv = Math.round(forecast.hours[0]?.uv ?? 0);
  const stats = tomorrow && s
    ? [
        { k: 'High', v: `${toTemp(s.max, units)}${u}` },
        { k: 'Low', v: `${toTemp(s.min, units)}${u}` },
        { k: 'Rain chance', v: `${s.maxRain}%` },
      ]
    : [
        { k: 'Humidity', v: `${c.humidity}%` },
        { k: 'Wind', v: `${toWind(c.wind, units)} ${windUnit(units)}` },
        { k: 'UV index', v: `${uv} · ${uvLabel(uv)}` },
      ];

  return (
    <section className="stage" aria-label={`Weather in ${place.name}`}>
      <div className="caption">
        <span>{tomorrow ? `Tomorrow · ${where}` : where}</span>
        <span>{formatCoords(place.latitude, place.longitude)}{tomorrow ? '' : ` · ${obsLabel(c.time, forecast.tzAbbr)}`}</span>
      </div>
      <div className="hero">
        <div className="big-temp" aria-label={`${big} degrees`}>{big}°</div>
        <div className="hero-text">
          <div className="condition">{label}</div>
          <div className="note">{note}</div>
          {!tomorrow && s && <div className="range">H {toTemp(s.max, units)}° · L {toTemp(s.min, units)}° next {hours.length}h</div>}
        </div>
      </div>
      <dl className="stats">
        {stats.map((st) => (
          <div key={st.k} className="stat"><dt>{st.k}</dt><dd>{st.v}</dd></div>
        ))}
        {sun && <Daylight sun={sun} now={tomorrow ? undefined : c.time} />}
      </dl>
      <HourlyChart hours={hours} units={units} title={chartTitle} showNow={!tomorrow} />
    </section>
  );
}
