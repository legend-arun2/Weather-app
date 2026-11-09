import type { Forecast, HourPoint, Units } from '../types';
import { describeCode, uvLabel } from '../lib/weatherCodes';
import { tempUnit, toTemp, toWind, windUnit } from '../lib/units';
import { summarize } from '../lib/summary';
import { formatCoords, obsLabel, rainNote } from '../lib/stageText';
import HourlyChart from './HourlyChart';

export interface StageData {
  forecast: Forecast;
  hours: HourPoint[];
  tomorrow: boolean;
  chartTitle: string;
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
        </div>
      </div>
      <dl className="stats">
        {stats.map((st) => (
          <div key={st.k} className="stat"><dt>{st.k}</dt><dd>{st.v}</dd></div>
        ))}
      </dl>
      <HourlyChart hours={hours} units={units} title={chartTitle} showNow={!tomorrow} />
    </section>
  );
}
