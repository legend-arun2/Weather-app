import { loadEnv } from 'vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Only the two Open-Meteo origins may be contacted; no inline scripts or styles are used.
// Applied to production builds only (the dev server needs inline scripts for hot reload).
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src https://api.open-meteo.com https://geocoding-api.open-meteo.com",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function securityMeta(): Plugin {
  return {
    name: 'security-meta',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
      { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    // GitHub Pages serves from /Weather-app/. Vercel (which sets VERCEL=1) serves from the root.
    base: env.VITE_BASE_PATH || (process.env.VERCEL ? '/' : '/Weather-app/'),
    plugins: [react(), securityMeta()],
    test: { environment: 'node' },
  };
});
