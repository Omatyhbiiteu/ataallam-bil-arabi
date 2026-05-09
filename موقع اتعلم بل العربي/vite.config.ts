import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const previewPort = Number.parseInt(process.env.PORT ?? '', 10);
  const previewPortResolved =
    Number.isFinite(previewPort) && previewPort > 0 ? previewPort : 4173;
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
    /** معاينة الإنتاج (Railway وغيره): 0.0.0.0 + PORT من المنصة، بدون xdg-open، وعدم حظر hostname */
    preview: {
      open: false,
      host: '0.0.0.0',
      port: previewPortResolved,
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
