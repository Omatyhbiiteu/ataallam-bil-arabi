import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const backendPublicStorageRoot = path.resolve(__dirname, '../backend/storage/app/public');

const mediaMimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
};

function backendStorageDevFallbackPlugin() {
  return {
    name: 'serve-backend-storage-local-first',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/storage/')) return next();

        let pathname = '';
        try {
          pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
        } catch {
          return next();
        }

        const relativePath = pathname.replace(/^\/storage\/?/, '');
        const filePath = path.resolve(backendPublicStorageRoot, relativePath);
        const isInsideStorage =
          filePath === backendPublicStorageRoot ||
          filePath.startsWith(`${backendPublicStorageRoot}${path.sep}`);

        // Local-first storage fallback: serve local Laravel storage when available,
        // otherwise let Vite proxy /storage to the backend below.
        if (!isInsideStorage || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          return next();
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeType = mediaMimeTypes[ext] || 'application/octet-stream';
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;

        // ✅ دعم HTTP Range Requests — يتيح seek في الصوت والفيديو
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'no-cache');

        if (req.method === 'HEAD') {
          res.setHeader('Content-Length', fileSize);
          res.statusCode = 200;
          res.end();
          return;
        }

        const rangeHeader = req.headers['range'] as string | undefined;

        if (rangeHeader) {
          // ── طلب جزئي: Range: bytes=start-end ──
          const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
          if (!match) {
            res.statusCode = 416; // Range Not Satisfiable
            res.setHeader('Content-Range', `bytes */${fileSize}`);
            res.end();
            return;
          }

          const start = match[1] ? parseInt(match[1], 10) : 0;
          const end   = match[2] ? parseInt(match[2], 10) : fileSize - 1;

          if (start > end || start >= fileSize || end >= fileSize) {
            res.statusCode = 416;
            res.setHeader('Content-Range', `bytes */${fileSize}`);
            res.end();
            return;
          }

          const chunkSize = end - start + 1;
          res.statusCode = 206; // Partial Content
          res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
          res.setHeader('Content-Length', chunkSize);
          fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
          // ── طلب كامل ──
          res.statusCode = 200;
          res.setHeader('Content-Length', fileSize);
          fs.createReadStream(filePath).pipe(res);
        }
      });
    },
  };
}

function uniqueBackendTargets(configured?: string) {
  const candidates = [
    configured,
    'http://127.0.0.1:5000',
    'http://127.0.0.1:8000',
    'http://localhost:5000',
    'http://localhost:8000',
  ];

  const seen = new Set<string>();
  return candidates
    .map((raw) => {
      if (!raw?.trim()) return null;
      try {
        return new URL(raw.trim()).origin;
      } catch {
        return raw.trim().replace(/\/$/, '');
      }
    })
    .filter((target): target is string => {
      if (!target || seen.has(target)) return false;
      seen.add(target);
      return true;
    });
}

function backendDevProxyFallbackPlugin(targets: string[]) {
  return {
    name: 'backend-dev-proxy-fallback',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const requestUrl = req.url || '';
        if (!requestUrl.startsWith('/api') && !requestUrl.startsWith('/storage')) {
          return next();
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        req.on('end', () => {
          const body = Buffer.concat(chunks);
          const tryTarget = (index: number) => {
            const target = targets[index];
            if (!target) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                message: 'Laravel backend is not reachable. Start it on 127.0.0.1:5000 or 127.0.0.1:8000.',
                tried: targets,
              }));
              return;
            }

            const upstreamUrl = new URL(requestUrl, target);
            const client = upstreamUrl.protocol === 'https:' ? https : http;
            const proxyReq = client.request(
              {
                protocol: upstreamUrl.protocol,
                hostname: upstreamUrl.hostname,
                port: upstreamUrl.port,
                method: req.method,
                path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
                headers: {
                  ...req.headers,
                  host: upstreamUrl.host,
                },
              },
              (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
                proxyRes.pipe(res);
              },
            );

            proxyReq.setTimeout(30000, () => {
              proxyReq.destroy(new Error(`Backend proxy timeout: ${target}`));
            });

            proxyReq.on('error', () => {
              if (!res.headersSent) tryTarget(index + 1);
            });

            if (body.length) proxyReq.write(body);
            proxyReq.end();
          };

          tryTarget(0);
        });
        req.on('error', next);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  const backendTargets = uniqueBackendTargets(env.VITE_BACKEND_PROXY_URL);
  const adminDevUrl = env.VITE_ADMIN_PROXY_URL || 'http://127.0.0.1:3001';
  const previewPort = Number.parseInt(process.env.PORT ?? '', 10);
  const previewPortResolved =
    Number.isFinite(previewPort) && previewPort > 0 ? previewPort : 4173;
  return {
    server: {
      open: true,
      port: 3000,
      proxy: {
        '/admin': {
          target: adminDevUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path === '/admin' ? '/admin/' : path,
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
    build: {
      modulePreload: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('remotion') || id.includes('@remotion')) return 'vendor-remotion';
            return 'vendor';
          },
        },
      },
    },
    plugins: [tailwindcss(), backendStorageDevFallbackPlugin(), backendDevProxyFallbackPlugin(backendTargets), react()],
    define: {
      'process.env.API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
