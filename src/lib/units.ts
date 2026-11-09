import type { Units } from '../types';

export const toTemp = (c: number, u: Units) => Math.round(u === 'metric' ? c : c * 9 / 5 + 32);
export const tempUnit = (u: Units) => (u === 'metric' ? '°C' : '°F');
export const toWind = (kmh: number, u: Units) => Math.round(u === 'metric' ? kmh : kmh * 0.621371);
export const windUnit = (u: Units) => (u === 'metric' ? 'km/h' : 'mph');
