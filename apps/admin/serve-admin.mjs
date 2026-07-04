// Minimal static file server for the built admin SPA (apps/admin/dist) with:
//  - SPA fallback (unknown routes -> index.html for client-side routing)
//  - same-origin reverse proxy for /api and /media -> the API (no CORS, works via any host)
// No dependencies; used for preview/tunnel exposure.
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(dir, 'dist');
const PORT = Number(process.env.PORT ?? 3002);
const API_TARGET = process.env.API_TARGET ?? 'http://localhost:3001';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function proxy(req, res) {
  const target = new URL(req.url, API_TARGET);
  const upstream = http.request(
    target,
    { method: req.method, headers: { ...req.headers, host: target.host } },
    (pr) => {
      res.writeHead(pr.statusCode || 502, pr.headers);
      pr.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502);
    res.end('Bad gateway');
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url.startsWith('/api/') || url.startsWith('/media/')) return proxy(req, res);

  const path = decodeURIComponent(url.split('?')[0]);
  const file = normalize(join(DIST, path));
  if (!file.startsWith(DIST)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    return createReadStream(file).pipe(res);
  }
  // SPA fallback
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  createReadStream(join(DIST, 'index.html')).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`ALTAN admin server on http://0.0.0.0:${PORT} (api -> ${API_TARGET})`);
});
