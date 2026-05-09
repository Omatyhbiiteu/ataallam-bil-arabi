import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      open: true,
      port: 3000,
      proxy: {
        '^/admin/?.*': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path === '/admin' ? '/admin/' : path
        }
      }
    },
    /** معاينة الإنتاج (Railway وغيره): منفذ PORT، كل الواجهات، بدون فتح متصفح على السيرفر، وعدم حظر hostname المنصة */
    preview: {
      open: false,
      host: true,
      port: Number(process.env.PORT) || 4173,
      strictPort: true,
      allowedHosts: true,
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
