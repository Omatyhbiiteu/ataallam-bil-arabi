import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const indexFile = path.join(distDir, 'index.html');
const host = process.env.HOST || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '4173', 10);

const mimeTypes = {
  '.aac': 'audio/aac',
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'video/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

if (!existsSync(indexFile)) {
  console.error('[static-server] dist/index.html is missing. Run npm run build before npm run start.');
  process.exit(1);
}

function sendText(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function resolveRequestPath(url) {
  const { pathname } = new URL(url || '/', 'http://localhost');
  const decodedPath = decodeURIComponent(pathname);
  const normalized = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const requestedPath = path.join(distDir, normalized);
  const isInsideDist = requestedPath === distDir || requestedPath.startsWith(`${distDir}${path.sep}`);
  if (!isInsideDist) return null;

  if (existsSync(requestedPath) && statSync(requestedPath).isFile()) {
    return requestedPath;
  }

  if (path.extname(requestedPath)) {
    return undefined;
  }

  return indexFile;
}

function streamFile(req, res, filePath) {
  const stat = statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const isHtml = ext === '.html';
  const range = req.headers.range;

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', isHtml ? 'no-cache' : 'public, max-age=31536000, immutable');
  res.setHeader('Accept-Ranges', 'bytes');

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1] ? Number.parseInt(match[1], 10) : 0;
    const end = match?.[2] ? Number.parseInt(match[2], 10) : stat.size - 1;

    if (!match || start > end || start >= stat.size || end >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      res.end();
      return;
    }

    res.writeHead(206, {
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, { 'Content-Length': stat.size });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  try {
    if (req.url === '/healthz') {
      sendText(res, 200, 'ok');
      return;
    }

    const filePath = resolveRequestPath(req.url);
    if (filePath === null) {
      sendText(res, 403, 'Forbidden');
      return;
    }
    if (filePath === undefined) {
      sendText(res, 404, 'Not found');
      return;
    }

    streamFile(req, res, filePath);
  } catch (error) {
    console.error('[static-server]', error);
    if (!res.headersSent) sendText(res, 500, 'Internal server error');
  }
});

server.listen(port, host, () => {
  console.log(`[static-server] Serving ${distDir}`);
  console.log(`[static-server] Listening on http://${host}:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
