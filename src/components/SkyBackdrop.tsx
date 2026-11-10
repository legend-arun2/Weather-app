// Purely decorative layers: stars, celestial glow and disc, drifting cloud, falling rain or snow,
// lightning and film grain. Which layers show, and their colours, come from [data-sky] in styles.css.
export default function SkyBackdrop() {
  return (
    <div className="sky-layers" aria-hidden="true">
      <div className="sky-stars" />
      <div className="sky-glow" />
      <div className="sky-disc" />
      <div className="sky-cloud c1" />
      <div className="sky-cloud c2" />
      <div className="sky-cloud c3" />
      <div className="sky-streaks s1" />
      <div className="sky-streaks s2" />
      <div className="sky-snow n1" />
      <div className="sky-snow n2" />
      <div className="sky-flash" />
      <svg className="sky-grain" width="100%" height="100%" focusable="false">
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
