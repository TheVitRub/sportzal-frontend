import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/0_app'),
      '@pages': path.resolve(__dirname, './src/1_pages'),
      '@widgets': path.resolve(__dirname, './src/2_widgets'),
      '@features': path.resolve(__dirname, './src/3_features'),
      '@entities': path.resolve(__dirname, './src/4_entities'),
      '@shared': path.resolve(__dirname, './src/5_shared')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true
  }
});
