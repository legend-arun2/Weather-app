import { describe, expect, it } from 'vitest';
import { recommendOutfit } from '../lib/outfit';
import type { HourPoint } from '../types';

const hour = (o: Partial<HourPoint> = {}): HourPoint => ({
  time: '2026-11-09T12:00', temp: 20, feelsLike: 20, rainChance: 0, wind: 5, uv: 1, code: 0, ...o,
});
const labels = (h: HourPoint[]) => recommendOutfit(h).items.map((i) => i.label).join('|');

describe('recommendOutfit', () => {
  it('handles empty data', () => {
    expect(recommendOutfit([]).items).toHaveLength(0);
  });
  it('recommends a winter coat when freezing', () => {
    expect(labels([hour({ feelsLike: -5 })])).toMatch(/winter coat/i);
  });
  it('recommends light clothes when pleasant', () => {
    expect(labels([hour({ feelsLike: 22 })])).toMatch(/T-shirt/i);
  });
  it('recommends shorts when hot', () => {
    expect(labels([hour({ feelsLike: 32 })])).toMatch(/shorts/i);
  });
  it('adds rain gear, wind, and UV items', () => {
    const l = labels([hour({ rainChance: 70, wind: 40, uv: 8 })]);
    expect(l).toMatch(/umbrella/i);
    expect(l).toMatch(/windbreaker/i);
    expect(l).toMatch(/sunscreen/i);
  });
  it('suggests a removable layer for big swings', () => {
    expect(labels([hour({ feelsLike: 8 }), hour({ feelsLike: 22 })])).toMatch(/removable layer/i);
  });
});

describe('recommendOutfit: units, hours and icy codes', () => {
  it('formats reasons in imperial units', () => {
    const advice = recommendOutfit([hour({ feelsLike: 5, wind: 40 }), hour({ feelsLike: 5, wind: 40 }), hour({ feelsLike: 5, wind: 40 })], 'imperial');
    const text = advice.items.map((i) => i.reason).join(' ');
    expect(text).toContain('41\u00b0F');
    expect(text).toContain('25 mph');
    expect(text).not.toContain('km/h');
  });
  it('ignores overnight hours when judging the day', () => {
    const day = Array.from({ length: 24 }, (_, h) =>
      hour({ time: `2026-11-09T${String(h).padStart(2, '0')}:00`, feelsLike: h >= 7 && h <= 22 ? 20 : 2 }));
    expect(labels(day)).toMatch(/T-shirt/i);
  });
  it('treats freezing rain like snow', () => {
    expect(labels([hour({ code: 67, feelsLike: 1 }), hour({ code: 67, feelsLike: 1 }), hour({ code: 67, feelsLike: 1 })])).toMatch(/grip/i);
  });
});
