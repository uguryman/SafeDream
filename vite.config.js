import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /safe istekleri livecarwash.com'a yönlendir
      '/safe': {
        target: 'https://appmobile.golaks.com',
        changeOrigin: true,
        secure: false,
        // Cookie'leri yönlendir
        cookieDomainRewrite: 'localhost',
      }
    }
  }
})
