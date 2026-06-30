import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa' // <-- 1. Импортируем плагин PWA

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({ // <-- 2. Добавляем настройки PWA в массив плагинов
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Instagram Clone',
        short_name: 'Insta',
        description: 'Потрясающий клон Instagram с поддержкой PWA',
        theme_color: '#ffffff', 
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://adetal-ff-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://adetal-ff-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})