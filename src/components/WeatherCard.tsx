import type { Forecast, Units } from '../types';
import { describeCode } from '../lib/weatherCodes';
import { tempUnit, toTemp, toWind, windUnit } from '../lib/units';

export default function WeatherCard({ forecast, units }: { forecast: Forecast; units: Units }) {
  const { current: c, place } = forecast;
  const d = describeCode(c.code);
  const where = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
  return (
    <div className="card weather-card">
      <div className="where">{where}</div>
      <div className="now">
        <span className="big-icon" aria-hidden>{d.icon}</span>
        <span className="big-temp">{toTemp(c.temp, units)}{tempUnit(units)}</span>
      </div>
      <div className="desc">{d.label} · feels like {toTemp(c.feelsLike, units)}{tempUnit(units)}</div>
      <div className="stats">
        <span>💧 {c.humidity}%</span>
        <span>💨 {toWind(c.wind, units)} {windUnit(units)}</span>
      </div>
    </div>
  );
}
