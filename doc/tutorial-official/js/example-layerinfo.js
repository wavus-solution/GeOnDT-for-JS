/**
 * 공통 배경지도와 지형 레이어의 기본 속성입니다.
 *
 * Common Runtime이 Manifest의 `runtime.layers`·`runtime.baseLayers`·`runtime.terrain` 선언을 읽어
 * 이 값 위에 예제별 재정의를 병합해 레이어를 만듭니다. 주소나 레벨처럼 바뀌는 값만 이 파일에서 관리하고
 * 생성 순서와 가시화 판단은 `example-runtime.js`가 담당합니다.
 */

/**
 * 이름으로 선택할 수 있는 배경지도 목록입니다.
 * @type {Readonly<Record<string, Readonly<Record<string, unknown>>>>}
 */
export const BASE_LAYER_PRESETS = Object.freeze({
    satellite: {name: 'satellite', baseurl: 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{-y}.jpeg', reverseY: true},
    base: {name: 'base', baseurl: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{-y}.png', reverseY: true},
    hybrid: {name: 'hybrid', baseurl: 'https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{-y}.png', reverseY: true, transparent: true},
    osm: {name: 'osm', baseurl: 'https://tile.openstreetmap.org/{z}/{x}/{-y}.png', reverseY: true, transparent: true},
    google: {name: 'google', baseurl: 'https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={-y}&z={z}', reverseY: true, transparent: true}
});

/**
 * 한반도 고도(지형) 레이어의 기본 속성입니다.
 * @type {Readonly<Record<string, unknown>>}
 */
export const TERRAIN_LAYER_PRESET = Object.freeze({
    name: 'Korea Terrain',
    baseurl: 'https://3d-dev.geon.kr/data/height/Float4/DEM/Korean_peninsula/',
    ext: '.umf',
    reverseY: true,
    minlevel: 9,
    maxlevel: 15,
    useproxy: false,
    interpolationheight: true
});

/**
 * localhost에서 접속했을 때 고도 레이어가 대신 사용할 baseurl입니다.
 *
 * 값을 채우면 localhost에서만 이 주소를 쓰고, 그 밖의 환경에서는 항상
 * `TERRAIN_LAYER_PRESET.baseurl`을 그대로 사용합니다. 빈 문자열이면 어디서나 기본 주소를 씁니다.
 * 배경지도에는 적용하지 않습니다.
 *
 * @type {string}
 */
export const TERRAIN_LOCALHOST_BASEURL = '';

/** 공통 모델 그룹 프리셋. 개별 모델의 생성·표시는 Runtime이 담당합니다. */
export const MODEL_LAYER_PRESETS = Object.freeze({
    seoul_u3f: Object.freeze({
        name: 'seoul_u3f',
        baseurl: 'https://3d-dev.geon.kr/data/model-2.2-webp/seoul/',
        models: Object.freeze([
            'dobonggu', 'dongdaemungu', 'dongjakgu', 'eunpyeonggu', 'gangbukgu', 'gangdonggu',
            'gangnamgu', 'gangseogu', 'geumcheongu', 'gurogu', 'gwanakgu', 'gwangjingu',
            'jungnanggu', 'mapogu', 'nowongu', 'seochogu', 'seodaemungu', 'seongbukgu',
            'seongdonggu', 'songpagu', 'yangcheongu', 'yeongdeungpogu', 'yeouido'
        ]),
        options: Object.freeze({
            minlevel: 17,
            maxlevel: 17,
            useproxy: false,
            compressmodel: true,
            isShareMaterial: false,
            makeU3FPackage: 1
        })
    })
});

/**
 * localhost 요청에 CORS를 허용하지 않는 공통 데이터 서버입니다.
 *
 * 배포 도메인에서만 접근을 허용하므로 로컬 동작 검증에서는 예제 기능과 무관하게 요청이 실패합니다.
 * 예제 고유 정보가 아니라 데이터 서버 주소이므로 Manifest마다 반복 선언하지 않고 여기에서 관리하며,
 * 동작 검증은 이 목록의 요청 실패만 예외로 처리합니다. 예제 하나만 사용하는 데이터 경로는
 * 그 예제의 `verification.network.allowedRequestFailures`에 선언합니다.
 *
 * @type {ReadonlyArray<string>}
 */
export const LOCALHOST_BLOCKED_DATA_SERVERS = Object.freeze([
    'https://dt-data.mappick.co.kr/ServiceData/dem/DEM_4/Korean_peninsula/',
    'https://dt-data.mappick.co.kr/ServiceData/model-2.2-webp/',
    'https://dt-data.mappick.co.kr/ServiceData/component/',
    'https://3d-dev.geon.kr/data/component/',
    // U3F 모델 목록 API는 selectModel과 analysisHeightLegend가 함께 사용하는 공통 조회 주소입니다.
    'https://3d.geon.kr/v1/'
]);
