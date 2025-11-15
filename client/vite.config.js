import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(),
    nodePolyfills(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: ['https://etherchat1.onrender.com',
          'http://localhost:3001'
        ],
        ws: true,
        changeOrigin: true
      }
    }
  }
})