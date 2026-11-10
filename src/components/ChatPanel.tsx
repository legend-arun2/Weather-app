import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Units } from '../types';
import { MAX_INPUT } from '../lib/intent';
import Icon from './Icon';

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
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll only the message list; scrollIntoView would also scroll the page and hide the weather above.
    const el = listRef.current;
    if (!el) return;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo?.({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
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
     <div className="chat-inner">
      <div className="messages" aria-live="polite" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.role === 'bot' && <div className="bot-label">Weather Chat</div>}
            <div className="bubble">{typeof m.text === 'function' ? m.text(units) : m.text}</div>
            {m.body?.(units)}
          </div>
        ))}
        {busy && <div className="msg bot"><div className="bot-label">Weather Chat</div><div className="bubble typing">Checking the sky…</div></div>}
      </div>
      <div className="chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => onSend(s)}>{s}</button>
        ))}
        <button type="button" disabled={busy} onClick={onLocate}><Icon name="pin" size={16} />Use my location</button>
      </div>
      <form className="composer" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about the weather…"
          aria-label="Message" maxLength={MAX_INPUT} />
        <button type="submit" className="send" aria-label="Send" disabled={busy || !text.trim()}><Icon name="send" size={22} strokeWidth={2.2} /></button>
      </form>
     </div>
    </div>
  );
}
