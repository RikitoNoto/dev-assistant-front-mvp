/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/projects': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/documents': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // you might want to disable it, if you don't have tests that rely on CSS
    // since parsing CSS is slow
    css: true,
  },
});
