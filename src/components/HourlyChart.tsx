import type { HourPoint, Units } from '../types';
import { tempUnit } from '../lib/units';
import { CHART, buildChart, chartSummary } from '../lib/chart';

interface Props {
  hours: HourPoint[];
  units: Units;
  title: string;
  /** Mark the first hour as "now" (false for a whole other day). */
  showNow: boolean;
}

export default function HourlyChart({ hours, units, title, showNow }: Props) {
  const m = buildChart(hours, units, showNow);
  if (!m) return null;
  const { W, H, left, right, base, rainBase } = CHART;
  const grid = [CHART.top, (CHART.top + base) / 2];
  return (
    <section className="chart-panel" aria-label="Hourly forecast">
      <div className="chart-head">
        <h2 className="chart-title">{title}</h2>
        <div className="chart-key">TEMPERATURE {tempUnit(units)} · RAIN CHANCE %</div>
      </div>
      <div className="chart-box">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={chartSummary(hours, units)}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="stop-top" />
              <stop offset="1" className="stop-bottom" />
            </linearGradient>
          </defs>
          {grid.map((y) => <line key={y} className="grid-line" x1={left} x2={W - right} y1={y} y2={y} />)}
          <line className="axis-line" x1={left} x2={W - right} y1={base} y2={base} />
          <path d={m.area} fill="url(#areaFill)" />
          <path className="temp-line" d={m.line} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {m.now && <circle className="now-dot" cx={m.now.x} cy={m.now.y} r="7" strokeWidth="2" />}
          <line className="axis-line" x1={left} x2={W - right} y1={rainBase} y2={rainBase} />
          <path className="rain-bars" d={m.rain} />
        </svg>
        {m.labels.map((l) => (
          <div key={l.text + l.left} className="chart-label" style={{ left: `${l.left}%`, top: `${l.top}%` }}>{l.text}</div>
        ))}
        {m.hourLabels.map((h) => (
          <div key={h.text + h.left} className="hour-tick" style={{ left: `${h.left}%` }}>{h.text}</div>
        ))}
        <div className="rain-caption">RAIN %</div>
      </div>
    </section>
  );
}
