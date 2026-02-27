import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [reactRouter(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    },
    includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.svg'],
    manifest: false, // Using our own manifest.json
    devOptions: {
      enabled: true,
      type: 'module'
    }
  })],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './app'),
      '@server': path.resolve(__dirname, './server'),
      '@db': path.resolve(__dirname, './db'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    target: 'esnext',
  },
});
