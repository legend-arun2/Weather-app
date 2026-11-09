import type { OutfitAdvice } from '../types';
import Icon from './Icon';

export default function OutfitCard({ advice }: { advice: OutfitAdvice }) {
  return (
    <section className="card outfit-card" aria-label="What to wear">
      <div className="outfit-summary">{advice.summary}</div>
      <ul>
        {advice.items.map((it) => (
          <li key={it.label}>
            <span className="tile-icon"><Icon name={it.icon} size={24} /></span>
            <div>
              <div className="tile-title">{it.label}</div>
              <div className="tile-reason">{it.reason}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
