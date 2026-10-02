import {defineConfig} from 'vite';

export default defineConfig({
    // 이 예제의 정적 파일만 복사하여 아카이브의 다른 자료가 섞이지 않게 합니다.
    publicDir: 'static',
    base: './',
    build: {outDir: 'build'},
    server: {port: 5173, strictPort: true},
    preview: {port: 4173, strictPort: true}
});
