import { describe, expect, it } from 'vitest';
import { parseIntent } from '../lib/intent';

describe('parseIntent', () => {
  it('parses weather in a city', () => {
    expect(parseIntent("What's the weather in Paris?")).toMatchObject({ kind: 'weather', place: 'Paris' });
  });
  it('parses multi-word cities', () => {
    expect(parseIntent('weather in New York today')).toMatchObject({ kind: 'weather', place: 'New York' });
  });
  it('parses outfit questions with and without place', () => {
    expect(parseIntent('What should I wear today in Oslo?')).toMatchObject({ kind: 'outfit', place: 'Oslo' });
    expect(parseIntent('what should I wear today?')).toMatchObject({ kind: 'outfit', place: undefined });
  });
  it('parses hourly questions', () => {
    expect(parseIntent('next 24 hours in Tokyo')).toMatchObject({ kind: 'hourly', place: 'Tokyo' });
  });
  it('detects tomorrow', () => {
    expect(parseIntent('weather in London tomorrow').tomorrow).toBe(true);
  });
  it('treats a bare city as weather', () => {
    expect(parseIntent('Berlin')).toMatchObject({ kind: 'weather', place: 'Berlin' });
  });
  it('shows help for greetings', () => {
    expect(parseIntent('hello').kind).toBe('help');
  });
});
