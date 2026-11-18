const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
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
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});
let port = 8766;
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && port < 8866) {
    port += 1;
    server.listen(port);
  } else {
    console.error('启动服务器失败：', error.message);
    process.exitCode = 1;
  }
});
server.listen(port, () => {
  console.log('网页目录:', ROOT);
  console.log('服务器已启动: http://localhost:' + port);
  console.log('请在浏览器中打开上面的地址，关闭此窗口会停止服务。');
});
