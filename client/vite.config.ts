import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import mkcert from 'vite-plugin-mkcert';

// https://vite.dev/config/
export default defineConfig({
  build:{
    outDir: '../API/wwwroot',
    chunkSizeWarningLimit:1500,
    emptyOutDir:true
  },
  server: {
    port: 3000,
    proxy: {
      '/images/photos': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    mkcert()
  ],
})
