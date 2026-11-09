import { describe, expect, it } from 'vitest';
import { MAX_INPUT, parseIntent } from '../lib/intent';

describe('parseIntent: unicode places (H3)', () => {
  it.each([
    ['weather in São Paulo', 'São Paulo'],
    ['weather in Zürich', 'Zürich'],
    ['what to wear in Kraków', 'Kraków'],
    ['weather in 東京', '東京'],
  ])('%s', (q, place) => {
    expect(parseIntent(q).place).toBe(place);
  });
  it('accepts place-first phrasing', () => {
    expect(parseIntent('Tokyo weather')).toMatchObject({ kind: 'weather', place: 'Tokyo' });
    expect(parseIntent('New York weather tomorrow')).toMatchObject({ place: 'New York', tomorrow: true });
  });
  it('stops the place at date words', () => {
    expect(parseIntent('weather in Paris on Friday').place).toBe('Paris');
    expect(parseIntent('weather in Oslo at 5pm').place).toBe('Oslo');
  });
  it('does not mistake "what is the weather" for a place', () => {
    expect(parseIntent("what's the weather").place).toBeUndefined();
  });
});

describe('parseIntent: chatter is never a place (H4)', () => {
  it.each(['ok', 'thanks', 'hello there', 'who are you', 'good morning', 'tomorrow', 'hi there'])('%s', (q) => {
    expect(parseIntent(q).kind).toBe('help');
  });
  it('treats a bare city and "how about" follow-ups as places', () => {
    expect(parseIntent('São Paulo')).toMatchObject({ kind: 'weather', place: 'São Paulo' });
    expect(parseIntent('how about Madrid?')).toMatchObject({ kind: 'weather', place: 'Madrid' });
  });
});

describe('parseIntent: ranges and limits', () => {
  it('flags unsupported ranges', () => {
    expect(parseIntent('weather in Paris next week').unsupported).toBe('next week');
    expect(parseIntent('forecast this weekend in Rome').unsupported).toBe('weekend');
  });
  it('parses "next N hours"', () => {
    expect(parseIntent('next 3 hours in Paris')).toMatchObject({ kind: 'hourly', hours: 3, place: 'Paris' });
  });
  it('handles adversarial long input quickly (F1)', () => {
    const start = performance.now();
    parseIntent('in '.repeat(30000) + '1');
    parseIntent('in a' + ' '.repeat(50000) + '!x');
    parseIntent('24' + ' '.repeat(50000) + 'x');
    expect(performance.now() - start).toBeLessThan(200);
    expect(MAX_INPUT).toBe(200);
  });
});
