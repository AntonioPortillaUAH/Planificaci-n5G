import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base relativa para poder publicar en GitHub Pages bajo /<repositorio>/
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
});
