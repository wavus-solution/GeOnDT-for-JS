import {settings} from './settings.js';
import type {U3dImageXYZLayerCO} from '../static/geondt/GeOnDT.modules.js';

type ProductModule = typeof import('../static/geondt/GeOnDT.modules.js');
type MapApp = InstanceType<ProductModule['GeOnDT']['U3dAPP']>;

const status = document.querySelector<HTMLParagraphElement>('#status')!;
const createButton = document.querySelector<HTMLButtonElement>('#create')!;
const disposeButton = document.querySelector<HTMLButtonElement>('#dispose')!;
let app: MapApp | undefined;
let observer: ResizeObserver | undefined;
let productPromise: Promise<ProductModule> | undefined;
let busy = false;
let generation = 0;

/**
 * 라이선스의 실행이 끝난 뒤에만 제품을 import합니다. 파일 로드와 인증 성공은 다릅니다.
 *
 * @returns 초기화가 완료된 제품 모듈
 */
async function loadProduct(): Promise<ProductModule> {
    status.textContent = '라이선스 파일을 불러옵니다.';
    await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL(settings.licenseUrl, document.baseURI).href;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`라이선스 파일을 불러오지 못했습니다: ${script.src}`));
        document.head.append(script);
    });
    status.textContent = '제품 모듈을 불러옵니다.';
    const moduleUrl = new URL(settings.moduleUrl, document.baseURI).href;
    // 런타임은 복사한 배포본 URL을 사용합니다. 타입도 위 import type의 동일 배포본에서 읽습니다.
    const product: ProductModule = await import(/* @vite-ignore */ moduleUrl);
    status.textContent = '라이선스 인증과 제품 리소스 준비를 기다립니다.';
    await new Promise<void>((resolve, reject) => {
        product.GeOnDT.ready(resolve);
        product.GeOnDT.fail(reject);
    });
    return product;
}

/** 지도를 해제하고 진행 중인 초기화 결과가 다시 화면을 변경하지 못하게 합니다. */
function disposeMap(): void {
    generation++;
    observer?.disconnect();
    observer = undefined;
    const previous = app;
    app = undefined;
    try {
        previous?.dispose();
    } finally {
        // 이 예제 전용 컨테이너에 남는 보조 캔버스도 제거하여 재생성 시 DOM이 쌓이지 않게 합니다.
        document.getElementById('map')?.replaceChildren();
        disposeButton.disabled = true;
    }
}

/**
 * 오류 원문을 보존해 표시합니다. 상세 원인을 임의로 라이선스 오류로 분류하지 않습니다.
 *
 * @param error 발생한 오류
 */
function showError(error: unknown): void {
    document.body.dataset.state = 'error';
    status.textContent = `실행 실패: ${error instanceof Error ? error.message : String(error)}\nConsole과 Network에서 라이선스·설정·리소스 요청을 확인하십시오. 수정 후 페이지를 새로고침하십시오.`;
    console.error('GeOnDT 시작 예제', error);
}

/** 제품 준비 후 지도를 생성하며, 실패 시 이 예제가 획득한 자원을 정리합니다. */
async function createMap(): Promise<void> {
    if (busy || app) return;
    busy = true;
    createButton.disabled = true;
    const current = ++generation;
    document.body.dataset.state = 'loading';
    try {
        productPromise ??= loadProduct();
        const {GeOnDT} = await productPromise;
        if (current !== generation) return;
        const instance = new GeOnDT.U3dAPP({containername: 'map'});
        app = instance;
        observer = new ResizeObserver(() => instance.resize());
        observer.observe(document.getElementById('map')!);
        const {longitude, latitude, height, azimuth, elevation} = settings.home;
        await instance.setHomePosition(longitude, latitude, height, azimuth, elevation);
        if (current !== generation) return;
        await instance.updateHomePosition(0);
        if (current !== generation) return;
        const options: U3dImageXYZLayerCO = {name: 'starter-imagery', baseUrl: settings.imageryUrl};
        const layer = new GeOnDT.image.U3dImageXYZLayer(options);
        instance.addLayer(layer);
        instance.setNameBaseLayer(layer.getName());
        status.textContent = '지도를 생성했습니다. 배경지도 레이어를 준비합니다.';
        await instance.showLayer(layer.getName(), true);
        if (current !== generation) return;
        // 레이어 준비만으로 모든 타일의 실제 화면 표시가 검증된 것은 아닙니다.
        status.textContent = `지도 준비 완료 · GeOnDT ${GeOnDT.version} · 드래그와 휠로 조작하십시오.`;
        document.body.dataset.state = 'ready';
        disposeButton.disabled = false;
    } catch (error) {
        if (current === generation) {
            try { disposeMap(); }
            catch (cleanupError) { console.error('지도 해제 중 오류', cleanupError); }
            showError(error);
        }
    } finally {
        busy = false;
        createButton.disabled = !!app;
    }
}

createButton.addEventListener('click', () => { void createMap(); });
disposeButton.addEventListener('click', () => {
    try {
        disposeMap();
        status.textContent = '지도를 해제했습니다. 지도 생성 버튼으로 다시 시작할 수 있습니다.';
        document.body.dataset.state = 'disposed';
    } catch (error) {
        showError(error);
    } finally {
        createButton.disabled = false;
    }
});
window.addEventListener('pagehide', event => {
    // 뒤로 가기 캐시에 보관되는 페이지는 복귀할 수 있으므로 지도를 유지합니다.
    if (!event.persisted) disposeMap();
});

// Vite가 코드를 교체할 때 기존 지도와 크기 감시가 남지 않게 합니다.
if (import.meta.hot) import.meta.hot.dispose(disposeMap);

void createMap();
