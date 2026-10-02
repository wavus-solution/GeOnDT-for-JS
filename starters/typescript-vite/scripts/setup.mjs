import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

/**
 * 경로를 생략하면 공개 아카이브의 기본 배치를 사용합니다.
 *
 * @param {string} name 옵션 이름
 * @param {string} fallback 기본 경로
 * @returns {string} 절대 경로
 */
function option(name, fallback) {
    const index = args.indexOf(name);
    if (index < 0) return fallback;
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${name} 뒤에 경로를 지정하십시오.`);
    return path.resolve(args[index + 1]);
}

try {
    for (let i = 0; i < args.length; i += 2) {
        if (!['--sdk', '--license'].includes(args[i])) throw new Error(`지원하지 않는 옵션입니다: ${args[i]}`);
    }
    const sdk = await fs.realpath(option('--sdk', path.resolve(project, '../../dist')));
    const license = option('--license', path.resolve(project, '../license.js'));
    // 빈 선택 폴더(예: wasm)는 아카이브에 없을 수 있으므로 필수 진입 파일과 타입만 검사합니다.
    for (const name of ['GeOnDT.modules.js', 'GeOnDT.modules.d.ts', 'GeOnDT.internal.js', 'GeOnDT.config.js', 'types']) {
        await fs.access(path.join(sdk, name));
    }
    const staticRoot = path.join(project, 'static');
    const destination = path.join(staticRoot, 'geondt');
    // 기존 고객 설정과 다른 버전의 파일을 섞지 않도록 준비된 제품은 덮어쓰지 않습니다.
    if (await fs.lstat(destination).catch(error => { if (error.code !== 'ENOENT') throw error; })) {
        throw new Error('static/geondt가 이미 있습니다. 설정을 백업하고 해당 폴더를 직접 제거한 뒤 다시 준비하십시오.');
    }
    const staticInfo = await fs.lstat(staticRoot).catch(error => { if (error.code !== 'ENOENT') throw error; });
    if (staticInfo?.isSymbolicLink()) throw new Error('static 폴더는 심볼릭 링크일 수 없습니다.');
    const localLicense = path.join(staticRoot, 'license.js');
    const existingLicense = await fs.lstat(localLicense).catch(error => { if (error.code !== 'ENOENT') throw error; });
    if (existingLicense?.isSymbolicLink()) throw new Error('static/license.js는 심볼릭 링크일 수 없습니다.');
    if (!existingLicense) await fs.access(license);
    await fs.mkdir(staticRoot, {recursive: true});
    await fs.cp(sdk, destination, {recursive: true, filter: async source => {
        if ((await fs.lstat(source)).isSymbolicLink()) throw new Error(`제품 배포본에 심볼릭 링크가 있습니다: ${source}`);
        return true;
    }});
    // 복사본에만 예제용 경로 설정을 적용합니다. 입력 dist는 수정하지 않습니다.
    await fs.copyFile(new URL('./runtime-config.js', import.meta.url), path.join(destination, 'GeOnDT.config.js'));
    if (!existingLicense) await fs.copyFile(license, localLicense);
    console.log('제품 준비 완료: static/geondt');
    console.log(existingLicense ? '기존 static/license.js를 유지했습니다.' : '라이선스 준비 완료: static/license.js');
    console.log('localhost에서 실행하십시오. 다른 도메인에는 해당 도메인용 라이선스가 필요합니다.');
} catch (error) {
    console.error(`시작 예제 준비 실패: ${error.message}`);
    console.error('제품 경로: npm run setup -- --sdk <dist 경로> [--license <라이선스 경로>]');
    process.exitCode = 1;
}
