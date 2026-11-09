import type { OutfitAdvice } from '../types';

export default function OutfitCard({ advice }: { advice: OutfitAdvice }) {
  return (
    <div className="card outfit-card">
      <div className="outfit-summary">👕 {advice.summary}</div>
      <ul>
        {advice.items.map((it) => (
          <li key={it.label}>
            <strong>{it.label}</strong>
            <span>{it.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
