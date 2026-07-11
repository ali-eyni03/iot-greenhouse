import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'گلخانه هوشمند',
        short_name: 'گلخانه',
        description: 'داشبورد مانیتورینگ و کنترل گلخانه هوشمند',
        theme_color: '#1C2620',
        background_color: '#1C2620',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // فقط فایل‌های build شده cache می‌شوند؛ درخواست‌های API/WebSocket
        // عمداً از cache رد می‌شوند چون داده‌ی real-time باید همیشه تازه باشد
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/api/, /^\/ws/],
      },
    }),
  ],
  server: {
    host: true, // اجازه دسترسی از شبکه محلی (برای تست روی موبایل)
    port: 5173,
  },
});
