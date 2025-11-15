import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig(({ mode }) => {
  // Load env file based on the current `mode`
  const env = loadEnv(mode, process.cwd(), '')

  // Access the variable
  const server_url = env.VITE_SERVER_URL

  return {
    plugins: [react(), nodePolyfills()],
    server: {
      port: 5173,
      proxy: {
        '/socket.io': {
          target: server_url,
          ws: true,
          changeOrigin: true
        }
      }
    }
  }
})
