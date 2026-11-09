import type { HourPoint, Units } from '../types';
import { tempUnit, toTemp } from '../lib/units';
import { describeCode } from '../lib/weatherCodes';

export default function HourlyChart({ hours, units }: { hours: HourPoint[]; units: Units }) {
  if (hours.length === 0) return null;
  const W = 600, H = 170, PX = 28, PT = 28, PB = 34;
  const temps = hours.map((h) => toTemp(h.temp, units));
  const min = Math.min(...temps), max = Math.max(...temps);
  const span = Math.max(max - min, 1);
  const x = (i: number) => PX + (i * (W - 2 * PX)) / Math.max(hours.length - 1, 1);
  const y = (t: number) => PT + (1 - (t - min) / span) * (H - PT - PB);
  const line = temps.map((t, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(t).toFixed(1)}`).join(' ');
  const barW = Math.max((W - 2 * PX) / hours.length - 3, 4);
  const step = hours.length > 12 ? 3 : 1;

  return (
    <div className="card chart-card">
      <div className="chart-title">Next {hours.length} hours · temperature ({tempUnit(units)}) and rain chance</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Hourly temperature and rain chance chart">
        {hours.map((h, i) => (
          <rect key={`r${i}`} x={x(i) - barW / 2} y={H - PB - (h.rainChance / 100) * 40} width={barW}
            height={(h.rainChance / 100) * 40} className="rain-bar">
            <title>{`${h.time.slice(11, 16)} · rain ${h.rainChance}%`}</title>
          </rect>
        ))}
        <path d={line} className="temp-line" fill="none" />
        {hours.map((h, i) => (
          <g key={`t${i}`}>
            <circle cx={x(i)} cy={y(temps[i])} r={3} className="temp-dot">
              <title>{`${h.time.slice(11, 16)} · ${temps[i]}${tempUnit(units)} · ${describeCode(h.code).label}`}</title>
            </circle>
            {i % step === 0 && (
              <>
                <text x={x(i)} y={y(temps[i]) - 9} className="temp-label" textAnchor="middle">{temps[i]}°</text>
                <text x={x(i)} y={H - 12} className="hour-label" textAnchor="middle">{h.time.slice(11, 13)}h</text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
