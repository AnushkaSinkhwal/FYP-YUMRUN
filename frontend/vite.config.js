import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using the import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },
  },
  optimizeDeps: {
    include: [
      'react-slick', 
      'slick-carousel',
      'react-is',
      'prop-types',
      '@emotion/react',
      '@emotion/styled'
    ],
    exclude: []
  },
  resolve: {
    alias: {
      'react-slick': 'react-slick',
      '@mui/utils/node_modules/react-is': path.resolve(__dirname, './src/utils/mui-resolver.js'),
      '@mui/utils/node_modules/prop-types': path.resolve(__dirname, './src/utils/prop-types-resolver.js'),
      'react-is': 'react-is',
      'prop-types': 'prop-types',
      '@emotion/react': '@emotion/react',
      '@emotion/styled': '@emotion/styled'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-is', 'prop-types'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-tabs'],
          slider: ['react-slick', 'slick-carousel'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled']
        }
      }
    }
  }
});
