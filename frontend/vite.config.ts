import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get backend URL from environment or use localhost
const backendUrl = process.env.VITE_API_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Listen on all network interfaces for local network access
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
});
