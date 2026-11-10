import type { OutfitAdvice } from '../types';
import Icon from './Icon';

export default function OutfitCard({ advice }: { advice: OutfitAdvice }) {
  return (
    <ul className="outfit-list" aria-label="What to wear">
      {advice.items.map((it) => (
        <li key={it.label}>
          <span className="outfit-icon"><Icon name={it.icon} size={24} /></span>
          <div>
            <div className="outfit-title">{it.label}</div>
            <div className="outfit-reason">{it.reason}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
