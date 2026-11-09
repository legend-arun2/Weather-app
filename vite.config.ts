import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // GitHub Pages serves from /Weather-app/. Use VITE_BASE_PATH=/ for Vercel.
    base: env.VITE_BASE_PATH || '/Weather-app/',
    plugins: [react()],
    test: { environment: 'node' },
  };
});
