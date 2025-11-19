import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          primevue: [
            'primevue/config',
            'primevue/card',
            'primevue/button',
            'primevue/badge',
            'primevue/datatable',
            'primevue/column',
            'primevue/select',
            'primevue/checkbox',
            'primevue/inputtext',
            'primevue/iconfield',
            'primevue/inputicon',
            '@primeuix/themes/aura',
          ],
          chart: ['primevue/chart', 'chart.js'],
          vendor: ['vue', 'pinia'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    cssCodeSplit: false,
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['vue', 'pinia', 'chart.js', '@primeuix/themes/aura'],
  },
})
