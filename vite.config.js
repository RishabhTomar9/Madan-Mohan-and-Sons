import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['applogo.png'],
      manifest: {
        name: 'Madhan Mohan and Sons',
        short_name: 'MMS',
        description: 'Madhan Mohan and Sons — Billing, KhataBook & E-commerce',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        icons: [
          {
            src: 'applogo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'applogo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'applogo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
