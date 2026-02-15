import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'assets/icon/icon.png', 'assets/shapes.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000 // Increase to 5MB
      },
      manifest: {
        name: 'Scholar Research Dashboard',
        short_name: 'Scholar',
        description: 'Modern Academic Research and Library Dashboard',
        theme_color: '#3880ff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'assets/icon/icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/icon/icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'assets/icon/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
