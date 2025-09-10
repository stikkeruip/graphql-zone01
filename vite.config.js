import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/graphql-zone01/',
  server: {
    proxy: {
      '/api': {
        target: 'https://platform.zone01.gr',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
