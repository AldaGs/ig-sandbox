import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // The HEIC decoder (libheif WASM, ~3 MB) is code-split and only loaded
        // on demand when someone uploads a HEIC file. Keep it out of the
        // precache manifest so it doesn't bloat the service-worker cache for
        // everyone; it's fetched from the network the rare time it's needed.
        globIgnores: ['**/heic-to-*.js'],
      },
      manifest: {
        name: 'IG Sandbox',
        short_name: 'Sandbox',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});