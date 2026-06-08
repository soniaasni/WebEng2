import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  // Im Produktions-Build auf /WebEng2/ setzen (GitHub Pages), lokal bleibt /
  base: process.env.VITE_BASE_URL || '/',
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
