import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// ALTAN admin SPA. Runs on 3002 to match the API's ADMIN_ORIGIN (CORS allow-list).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 3002 },
  preview: { port: 3002 },
  // @altan/shared is emitted as CommonJS (its index.js mixes `export *` with named
  // enum exports). Rollup needs mixed-module transform to detect those named exports.
  build: {
    commonjsOptions: { transformMixedEsModules: true, include: [/shared/, /node_modules/] },
  },
  optimizeDeps: { include: ['@altan/shared'] },
});
