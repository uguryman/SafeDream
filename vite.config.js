import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api istekleri livecarwash.com'a yönlendir
      '/api': {
        target: 'https://livecarwash.com',
        changeOrigin: true,
        secure: false,
        // Cookie'leri yönlendir
        cookieDomainRewrite: 'localhost',
      }
    }
  }
})
