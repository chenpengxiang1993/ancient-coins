import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { generatePublicData } from './scripts/generate-public-data.mjs'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    {
      name: 'generate-public-data',
      configResolved() {
        // dev 启动与 build 开始时生成 public/data/
        generatePublicData()
      },
      handleHotUpdate(ctx) {
        // dev 中 data/dynasties/*.json 变更时即时重新生成
        const segs = ctx.file.split(/[/\\]/)
        if (segs.includes('dynasties') && ctx.file.endsWith('.json')) {
          generatePublicData()
        }
      },
    },
  ],
  server: {
    port: 3601,
    strictPort: true,
    open: true,
    hmr: true,
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 100,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  },
})
