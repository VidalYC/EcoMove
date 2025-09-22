import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Alias para imports más limpios
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    host: true, // Para que sea accesible desde otros dispositivos en la red
    open: true, // Abrir automáticamente en el navegador
    cors: true,
    proxy: {
      // Proxy para el API del backend
      '/api': {
        target: 'http://localhost:3000', // URL del backend
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Configuración de build
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimizaciones para mejor rendimiento
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para mejor caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
    // Configuración de assets
    assetsDir: 'assets',
    // Límite de tamaño para inline assets
    assetsInlineLimit: 4096,
  },
  
  // Variables de entorno
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // Configuración de CSS
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Configuración de optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react'
    ],
  },
  
  // Configuración para preview
  preview: {
    port: 4173,
    host: true,
    cors: true,
  },
  
  // Base URL para deployment
  base: './',
});