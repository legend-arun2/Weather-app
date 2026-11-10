import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Units } from '../types';
import { MAX_INPUT } from '../lib/intent';
import Icon from './Icon';

/** Messages hold data and render functions, never pre-rendered units, so toggling °C/°F updates old ones. */
export interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  text: string | ((units: Units) => string);
  body?: (units: Units) => ReactNode;
  /** The answer is mainly the weather stage, so stacked layouts should show the stage rather than this message. */
  showStage?: boolean;
}

interface Props {
  messages: ChatMessage[];
  units: Units;
  busy: boolean;
  suggestions: string[];
  onSend: (text: string) => void;
  onLocate: () => void;
}

const matches = (q: string) => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;

export default function ChatPanel({ messages, units, busy, suggestions, onSend, onLocate }: Props) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const last = messages[messages.length - 1];

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; } // don't scroll on first paint
    const el = listRef.current;
    if (!el) return;
    const behavior: ScrollBehavior = matches('(prefers-reduced-motion: reduce)') ? 'auto' : 'smooth';
    if (matches('(max-width: 900px)')) {
      // Stacked layout: messages are part of the page. Show the weather for weather answers, else the new message.
      if (last?.showStage) window.scrollTo({ top: 0, behavior });
      else el.lastElementChild?.scrollIntoView({ block: 'end', behavior });
    } else {
      // Side-by-side: scroll only the list, never the page.
      el.scrollTo?.({ top: el.scrollHeight, behavior });
    }
  }, [messages.length, busy, last?.showStage]);

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
          {busy && (
            <div className="msg bot">
              <div className="bot-label">Weather Chat</div>
              <div className="bubble typing">Checking the sky<span className="dots" aria-hidden="true"><i /><i /><i /></span></div>
            </div>
          )}
        </div>
        <div className="dock">
          <div className="chips">
            {suggestions.map((s) => (
              <button key={s} type="button" disabled={busy} onClick={() => onSend(s)}>{s}</button>
            ))}
            <button type="button" disabled={busy} onClick={onLocate}><Icon name="pin" size={16} />Use my location</button>
          </div>
          <form className="composer" onSubmit={submit}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about the weather…"
              aria-label="Message" maxLength={MAX_INPUT} enterKeyHint="send" />
            <button type="submit" className="send" aria-label="Send" disabled={busy || !text.trim()}><Icon name="send" size={22} strokeWidth={2.2} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}
