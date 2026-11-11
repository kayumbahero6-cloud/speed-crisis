// Tiny zero-dependency static server so the game runs as a Render *Web Service* (`yarn start` / `npm start`).
// Serves ./dist if it exists (after `npm run render`), otherwise the project root (js/game.js is already built).
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = fs.existsSync(path.join(__dirname, 'dist', 'index.html')) ? path.join(__dirname, 'dist') : __dirname;
const PORT = process.env.PORT || 10000;
const BLOCK = /^\/(node_modules|tools|src|\.git|package(-lock)?\.json|server\.js|render\.yaml|yarn\.lock)(\/|$)/i;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2',
};
const COMPRESS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt', '.md']);

function send(req, res, file, status) {
  const ext = path.extname(file).toLowerCase();
  const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
  const base = path.basename(file);
  headers['Cache-Control'] = (base === 'sw.js' || ext === '.html' || base === 'manifest.json') ? 'no-cache' : 'public, max-age=3600';
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    if (COMPRESS.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip'; headers['Vary'] = 'Accept-Encoding';
      res.writeHead(status || 200, headers);
      return req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
    }
    headers['Content-Length'] = st.size;
    res.writeHead(status || 200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  });
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (BLOCK.test(p)) { res.writeHead(404); return res.end('Not found'); }
  let file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (p.endsWith('/')) file = path.join(file, 'index.html');
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, 'index.html');
    if (err && !path.extname(p)) file = path.join(ROOT, 'index.html'); // fallback for extension-less routes
    send(req, res, file);
  });
}).listen(PORT, '0.0.0.0', () => console.log(`UMUHANDA game running on port ${PORT} (serving ${path.relative(__dirname, ROOT) || '.'})`));
