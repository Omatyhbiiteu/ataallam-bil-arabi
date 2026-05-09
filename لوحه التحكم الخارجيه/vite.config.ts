import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const backendProxyTarget = env.VITE_BACKEND_PROXY_URL || 'http://127.0.0.1:5000';
  const previewPort = Number.parseInt(process.env.PORT ?? '', 10);
  const previewPortResolved =
    Number.isFinite(previewPort) && previewPort > 0 ? previewPort : 4173;
  return {
    base: '/admin/',
    server: {
      open: false,
      port: 3001,
      host: true,
      /** نفس المنشأ: المتصفح يطلب `/api` من منفذ Vite، والـ proxy يمرّرها إلى Laravel — يُزيل مشاكل CORS بين localhost و127.0.0.1 */
      proxy: {
        '/api': {
          target: backendProxyTarget,
          changeOrigin: true,
        },
      },
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
