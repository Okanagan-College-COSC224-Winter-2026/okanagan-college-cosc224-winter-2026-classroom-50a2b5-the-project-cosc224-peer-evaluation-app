import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
  },
  server: {
		watch: {
			usePolling: true,
		},
    strictPort: true,
    port: 3000,
    host: '0.0.0.0',
  }
})
