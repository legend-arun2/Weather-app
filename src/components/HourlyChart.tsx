import { useState } from 'react';
import type { HourPoint, Units } from '../types';
import { tempUnit } from '../lib/units';
import { CHART, buildChart, chartSummary } from '../lib/chart';
import { describeCode } from '../lib/weatherCodes';

interface Props {
  hours: HourPoint[];
  units: Units;
  title: string;
  /** Mark the first hour as "now" (false for a whole other day). */
  showNow: boolean;
}

export default function HourlyChart({ hours, units, title, showNow }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const m = buildChart(hours, units, showNow);
  if (!m) return null;
  const { W, H, left, right, base, rainBase } = CHART;
  const grid = [CHART.top, (CHART.top + base) / 2];
  const last = m.points.length - 1;
  const pt = active === null ? null : m.points[Math.min(active, last)];

  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0) return;
    const xp = ((e.clientX - r.left) / r.width) * 100;
    let best = 0;
    m.points.forEach((p, i) => { if (Math.abs(p.left - xp) < Math.abs(m.points[best].left - xp)) best = i; });
    setActive(best);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setActive((a) => (a === null ? 0 : Math.min(a + 1, last)));
    else if (e.key === 'ArrowLeft') setActive((a) => (a === null ? last : Math.max(a - 1, 0)));
    else if (e.key === 'Escape') setActive(null);
    else return;
    e.preventDefault();
  };

  return (
    <section className="chart-panel" aria-label="Hourly forecast">
      <div className="chart-head">
        <h2 className="chart-title">{title}</h2>
        <div className="chart-key">TEMPERATURE {tempUnit(units)} · RAIN CHANCE %</div>
      </div>
      <div
        className={`chart-box${pt ? ' scrubbing' : ''}`}
        tabIndex={0}
        role="group"
        aria-label="Hourly chart. Use the left and right arrow keys to read each hour."
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActive(null); }}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={chartSummary(hours, units)}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="stop-top" />
              <stop offset="1" className="stop-bottom" />
            </linearGradient>
          </defs>
          {grid.map((y) => <line key={y} className="grid-line" x1={left} x2={W - right} y1={y} y2={y} />)}
          <line className="axis-line" x1={left} x2={W - right} y1={base} y2={base} />
          <path className="temp-area" d={m.area} fill="url(#areaFill)" />
          <path className="temp-line" d={m.line} pathLength={1} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
        {pt && (
          <>
            <div className="scrub-line" style={{ left: `${pt.left}%` }} />
            <div className="scrub-dot" style={{ left: `${pt.left}%`, top: `${pt.top}%` }} />
            <div className="scrub-tip" role="status" style={{ left: `${Math.min(Math.max(pt.left, 22), 78)}%` }}>
              <strong>{pt.time}</strong>
              <span>{pt.temp}{tempUnit(units)}</span>
              <span>Rain {pt.rain}%</span>
              <span>{describeCode(pt.code).label}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
