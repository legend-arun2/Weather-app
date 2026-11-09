import type { IconName } from '../types';

const CLOUD = 'M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 11.2 3.5 3.5 0 0 0 7 18z';
const CLOUD_UP = 'M7 15h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 8.2 3.5 3.5 0 0 0 7 15z';

function paths(name: IconName) {
  switch (name) {
    case 'sun':
      return <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>;
    case 'moon':
      return <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;
    case 'partly':
      return <><circle cx="8" cy="8" r="3" /><path d="M8 1.5V3M2.5 8H1M3.9 3.9l1 1M12.1 3.9l-1 1" /><path d="M9 20h8a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 8 14.5 3 3 0 0 0 9 20z" /></>;
    case 'partly-night':
      return <><path d="M10 3.5A4.5 4.5 0 1 0 14.5 8 3.5 3.5 0 0 1 10 3.5z" /><path d="M9 20h8a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 8 14.5 3 3 0 0 0 9 20z" /></>;
    case 'cloud':
      return <path d={CLOUD} />;
    case 'fog':
      return <path d="M4 8h16M6 12h12M4 16h16M8 20h8" />;
    case 'drizzle':
      return <><path d={CLOUD_UP} /><path d="M9 18v1.5M13 18v1.5M17 18v1.5" /></>;
    case 'rain':
      return <><path d={CLOUD_UP} /><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" /></>;
    case 'snow':
      return <><path d={CLOUD_UP} /><path d="M8 19h.01M12 19h.01M16 19h.01M10 22h.01M14 22h.01" strokeWidth="2.6" /></>;
    case 'storm':
      return <><path d={CLOUD_UP} /><path d="M12 14l-2 4h3l-2 4" /></>;
    case 'drop':
      return <path d="M12 3c3 4 5 6.5 5 9.5a5 5 0 0 1-10 0C7 9.5 9 7 12 3z" />;
    case 'wind':
      return <path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7" />;
    case 'umbrella':
      return <path d="M3 12a9 9 0 0 1 18 0zM12 12v6a2 2 0 0 0 4 0" />;
    case 'layers':
      return <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />;
    case 'swap':
      return <path d="M12 3v14M7 8l5-5 5 5M5 21h14" />;
    case 'boots':
      return <path d="M8 3h5v8l5 3v5H5v-4l3-2V3z" />;
    case 'thermo':
      return <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z" />;
    case 'pin':
      return <><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>;
    case 'send':
      return <path d="M12 19V5M5 12l7-7 7 7" />;
  }
}

export default function Icon({ name, size = 24, strokeWidth = 2 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="icon">
      {paths(name)}
    </svg>
  );
}
