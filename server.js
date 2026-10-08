// Servidor estático mínimo para usar FORJA en la PC (la app no necesita
// backend: los datos se guardan en el navegador). En internet se publica
// directamente la carpeta docs/ (por ejemplo con GitHub Pages).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'docs');
const PORT = +process.env.PORT || 4000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    let file = path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    fs.stat(file, (err, st) => {
      if (!err && st.isDirectory()) file = path.join(file, 'index.html');
      else if (err) file = path.join(ROOT, 'index.html');
      fs.readFile(file, (e, data) => {
        if (e) return res.writeHead(404).end('No encontrado');
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(data);
      });
    });
  })
  .listen(PORT, () => console.log(`\n  🔥 FORJA lista en http://localhost:${PORT}\n`));
