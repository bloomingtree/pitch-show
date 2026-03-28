import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://api-dev.pitch.shiyin.cyou',
        // target: 'http://127.0.0.1:8787',
        changeOrigin: true
      },
      '/static': {
        // target: 'https://api-dev.pitch.shiyin.cyou',
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/static/, '')
      },
      '/shiyin_downloads': {
        target: 'https://cdn.notalabs.cn',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    },
    assetsInlineLimit: 0, // 确保worker文件不被内联
    copyPublicDir: true
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  }
})
