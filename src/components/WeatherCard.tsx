import type { Forecast, Units } from '../types';
import { describeCode, uvLabel } from '../lib/weatherCodes';
import { tempUnit, toTemp, toWind, windUnit } from '../lib/units';
import Icon from './Icon';

export default function WeatherCard({ forecast, units }: { forecast: Forecast; units: Units }) {
  const { current: c, place } = forecast;
  const d = describeCode(c.code, c.isDay);
  const where = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
  const uv = Math.round(forecast.hours[0]?.uv ?? 0);
  return (
    <section className="card weather-card" aria-label={`Current weather in ${place.name}`}>
      <div className="now-block">
        <span className="big-icon"><Icon name={d.icon} size={64} strokeWidth={1.5} /></span>
        <div>
          <div className="where">{where}</div>
          <div className="big-temp">{toTemp(c.temp, units)}°<span className="big-unit">{tempUnit(units).slice(1)}</span></div>
          <div className="desc">{d.label} · feels like {toTemp(c.feelsLike, units)}°</div>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><div className="stat-label"><Icon name="drop" size={16} />Humidity</div><div className="stat-value">{c.humidity}%</div></div>
        <div className="stat"><div className="stat-label"><Icon name="wind" size={16} />Wind</div><div className="stat-value">{toWind(c.wind, units)} {windUnit(units)}</div></div>
        <div className="stat"><div className="stat-label"><Icon name="sun" size={16} />UV</div><div className="stat-value">{uv} {uvLabel(uv)}</div></div>
      </div>
    </section>
  );
}
