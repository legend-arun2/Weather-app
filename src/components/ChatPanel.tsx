import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Units } from '../types';
import { MAX_INPUT } from '../lib/intent';

/** Messages hold data and render functions, never pre-rendered units, so toggling °C/°F updates old cards. */
export interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  text: string | ((units: Units) => string);
  body?: (units: Units) => ReactNode;
}

interface Props {
  messages: ChatMessage[];
  units: Units;
  busy: boolean;
  onSend: (text: string) => void;
  onLocate: () => void;
}

const SUGGESTIONS = ["What's the weather in London?", 'What should I wear today in Oslo?', 'Next 24 hours in Tokyo'];

export default function ChatPanel({ messages, units, busy, onSend, onLocate }: Props) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setText('');
    onSend(t);
  };

  return (
    <div className="chat">
      <div className="messages" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            <div className="bubble">{typeof m.text === 'function' ? m.text(units) : m.text}</div>
            {m.body?.(units)}
          </div>
        ))}
        {busy && <div className="msg bot"><div className="bubble typing">Checking the sky…</div></div>}
        <div ref={endRef} />
      </div>
      <div className="chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => onSend(s)}>{s}</button>
        ))}
        <button type="button" disabled={busy} onClick={onLocate}>📍 Use my location</button>
      </div>
      <form className="composer" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about the weather…"
          aria-label="Message" maxLength={MAX_INPUT} />
        <button type="submit" disabled={busy || !text.trim()}>Send</button>
      </form>
    </div>
  );
}
