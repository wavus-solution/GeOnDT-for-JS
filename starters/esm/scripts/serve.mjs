import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 5173);
const mime = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};

// 일반 ES 모듈 예제에는 번들러가 필요하지 않습니다. 서비스에 필요한 경로만 제공합니다.
const server = createServer(async (request, response) => {
    try {
        if (!['GET', 'HEAD'].includes(request.method)) {
            response.writeHead(405).end();
            return;
        }
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
        const isStatic = relative === 'license.js' || relative.startsWith('geondt/');
        if (!isStatic && !['index.html', 'style.css'].includes(relative) && !relative.startsWith('src/')) {
            response.writeHead(404).end('파일을 찾을 수 없습니다.');
            return;
        }
        const root = isStatic ? path.join(project, 'static') : project;
        const file = path.resolve(root, relative);
        const within = path.relative(root, file);
        if (within.startsWith('..') || path.isAbsolute(within)) {
            response.writeHead(403).end();
            return;
        }
        const info = await fs.stat(file);
        if (!info.isFile()) throw new Error('파일이 아닙니다.');
        response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache'});
        if (request.method === 'HEAD') response.end();
        else createReadStream(file).on('error', () => response.destroy()).pipe(response);
    } catch {
        response.writeHead(404).end('파일을 찾을 수 없습니다.');
    }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, 'localhost', () => console.log(`GeOnDT ES 모듈 예제: http://localhost:${port}/`));
