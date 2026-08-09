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
        name: 'Madan Mohan and Sons',
        short_name: 'MMS',
        description: 'Madan Mohan and Sons — Billing, KhataBook & E-commerce',
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('framer-motion')) return 'vendor-animation';
            return 'vendor-core';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
