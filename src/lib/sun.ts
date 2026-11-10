const mins = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));

/** How far through daylight `now` is, 0 at sunrise to 1 at sunset; null when the sun is down. */
export function dayProgress(now: string, sunrise: string, sunset: string): number | null {
  const n = mins(now), a = mins(sunrise), b = mins(sunset);
  if (!(b > a) || n < a || n > b) return null;
  return (n - a) / (b - a);
}

export function dayLength(sunrise: string, sunset: string): string {
  const d = Math.max(mins(sunset) - mins(sunrise), 0);
  return `${Math.floor(d / 60)}h ${d % 60}m`;
}
