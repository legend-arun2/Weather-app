import type { HourPoint, Units } from '../types';
import { tempUnit, toTemp } from '../lib/units';
import { chartSummary, sampleHours } from '../lib/chart';

const MIN_BAR = 20; // px
const BAR_RANGE = 64; // px

export default function HourlyChart({ hours, units, title }: { hours: HourPoint[]; units: Units; title?: string }) {
  if (hours.length === 0) return null;
  const cols = sampleHours(hours, 12);
  const temps = cols.map((h) => toTemp(h.temp, units));
  const min = Math.min(...temps);
  const span = Math.max(Math.max(...temps) - min, 1);

  return (
    <section className="card chart-card" aria-label="Hourly forecast">
      <div className="chart-head">
        <div className="chart-title">{title ?? `Next ${hours.length} hours`}</div>
        <div className="legend">
          <span><i className="swatch temp" />Temperature {tempUnit(units)}</span>
          <span><i className="swatch rain" />Rain chance</span>
        </div>
      </div>
      <div className="hour-grid" role="img" aria-label={chartSummary(hours, units)}>
        {cols.map((h, i) => (
          <div key={h.time} className={`hour-col${i === 0 ? ' first' : ''}`}>
            <div className="hour-temp">{temps[i]}°</div>
            <div className="hour-bar" style={{ height: MIN_BAR + Math.round(((temps[i] - min) / span) * BAR_RANGE) }} />
            <div className="rain-track"><div className="rain-fill" style={{ width: `${h.rainChance}%` }} /></div>
            <div className="hour-rain">{h.rainChance}%</div>
            <div className="hour-label">{h.time.slice(11, 13)}h</div>
          </div>
        ))}
      </div>
    </section>
  );
}
