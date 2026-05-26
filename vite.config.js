import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 本地 dev 用根路径，GitHub Pages 部署时由 workflow 注入 /repo-name/
export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE || '/',
  server: {
    port: 5173,
    open: true
  }
})
