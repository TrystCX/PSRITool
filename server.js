const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/干员盟约数据库.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    const ext = path.extname(fp).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.json': 'application/json; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
});
server.listen(8766, () => console.log('服务器已启动: http://localhost:8766'));
