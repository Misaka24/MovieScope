import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        homeOne: resolve(__dirname, 'home-1.html'),
        homeTwo: resolve(__dirname, 'home-2.html'),
      },
    },
  },
})
