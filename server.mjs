import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recognizeBird } from './birds/photo-ai-bridge.js';

const PORT = Number(process.env.PORT || 4175);
const root = fileURLToPath(new URL('.', import.meta.url));
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json; charset=utf-8' };

function json(res, status, body) { res.writeHead(status, { 'Content-Type': mime['.json'] }); res.end(JSON.stringify(body)); }

async function predict(req, res) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 15_000_000) return json(res, 413, { error: '图片过大，请压缩到 10MB 以内' }); }
  try {
    const { image } = JSON.parse(raw);
    if (!image) return json(res, 400, { error: '请求体缺少 image 字段' });
    json(res, 200, await recognizeBird(image));
  } catch (error) { json(res, 500, { error: error.message || '识别服务异常' }); }
}

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/recognize-bird') return predict(req, res);
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = normalize(join(root, urlPath === '/' ? 'birds/index.html' : urlPath.replace(/^[/\\]+/, '')));
    if (!file.startsWith(normalize(root))) return json(res, 403, { error:'禁止访问' });
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'Content-Type':mime[extname(file)] || 'application/octet-stream' }); res.end(await readFile(file));
  } catch { json(res, 404, { error:'文件不存在' }); }
}).listen(PORT, '127.0.0.1', () => console.log(`羽迹服务已启动：http://127.0.0.1:${PORT}/birds/`));
