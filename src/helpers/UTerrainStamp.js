import {
    ClampToEdgeWrapping,
    CanvasTexture,
    Color,
    DataTexture,
    FloatType,
    LinearFilter,
    NearestFilter,
    RGBAFormat,
    SRGBColorSpace,
    Vector2,
    Vector3,
    Vector4
} from 'three';
import {
    TERRAIN_OVERLAY_SHADER
} from '@union3d/shader/GTerrainOverlayShader.js';
import {defaultValue} from "@util/defaultValue.js";
import {defined} from '@union3d/util/defined';
import {__GError__, __GWarn__} from "@U3dMessage";
import {INTERNAL} from '@union3d/helpers/UTerrainStamp.internal';

const DEFAULT_COLOR = '#00ffff';
const DEFAULT_MAX_STAMPS_PER_TILE = TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS;
const TERRAIN_STAMP_TEXTURE_FIT_STRETCH = 'stretch';
const TERRAIN_STAMP_TEXTURE_FIT_CONTAIN = 'contain';
const TERRAIN_STAMP_GRADIENT_DIRECTION_VERTICAL = 'vertical';
const TERRAIN_STAMP_GRADIENT_DIRECTION_HORIZONTAL = 'horizontal';
const TERRAIN_STAMP_MODE_FILL = TERRAIN_OVERLAY_SHADER.MODE_FILL;
const TERRAIN_STAMP_MODE_MASK = TERRAIN_OVERLAY_SHADER.MODE_MASK;
const TERRAIN_STAMP_MODE_MASK_OCCLUDE = TERRAIN_OVERLAY_SHADER.MODE_MASK_OCCLUDE;
const TERRAIN_STAMP_LINE_WIDTH_UNITS_METERS = 'meters';
const TERRAIN_STAMP_LINE_WIDTH_UNITS_PIXELS = 'pixels';
const TERRAIN_STAMP_MODE_NAMES = new Map([
    ['fill', TERRAIN_STAMP_MODE_FILL],
    ['mask', TERRAIN_STAMP_MODE_MASK],
]);
const TERRAIN_STAMP_TEXTURE_FITS = new Set([
    TERRAIN_STAMP_TEXTURE_FIT_STRETCH,
    TERRAIN_STAMP_TEXTURE_FIT_CONTAIN
]);
const TERRAIN_STAMP_GRADIENT_DIRECTIONS = new Set([
    TERRAIN_STAMP_GRADIENT_DIRECTION_VERTICAL,
    TERRAIN_STAMP_GRADIENT_DIRECTION_HORIZONTAL
]);

/**
 * 도장(stamp) 도형의 점 하나를 나타내는 좌표 값입니다.
 *
 * three.js Vector3 대신 숫자 프로퍼티만 가진 객체로 점을 넘길 때 사용합니다.
 *
 * @typedef {Object} UTerrainStampPointLike
 * @property {number} x 월드 좌표(EPSG:3857)의 동서 방향 위치이며 단위는 미터입니다.
 * @property {number} y 월드 좌표(EPSG:3857)의 남북 방향 위치이며 단위는 미터입니다.
 * @property {number} [z] 해발 높이이며 단위는 미터입니다.<br>
 * 생략하면 0으로 사용합니다.
 */

/**
 * 원형 도장의 중심점과 반지름을 함께 담은 도형 값입니다.
 *
 * getCircle()이 현재 원형 도형을 복사해 돌려줄 때 쓰는 형식입니다.
 *
 * @typedef {Object} UTerrainStampCircleValue
 * @property {import('three').Vector3|UTerrainStampPointLike} center 원의 중심이며 월드 좌표(EPSG:3857)입니다.
 * @property {number} radius 원의 반지름이며 단위는 미터입니다.
 */

/**
 * 지형 머티리얼이 셰이더(shader)로 넘기는 도장 표시용 값 묶음입니다.
 *
 * 각 프로퍼티는 three.js 규약에 따라 실제 값을 value 필드에 담습니다.<br>
 * 한 레이어에 대해서는 같은 객체가 계속 재사용되므로 참조를 보관해 두고 값만 읽어도 됩니다.
 *
 * @typedef {Object} UTerrainStampRenderUniforms
 * @property {{value: number}} count 지금 그리는 지형 타일과 겹쳐 이번 렌더 호출에서 검사할 도장 개수입니다.
 * @property {{value: boolean}} compositeEnabled 현재 타일 전체에 동일한 합성색을 적용할 수 있는지 여부입니다.
 * @property {{value: import('three').Vector4}} compositeColor 현재 타일의 premultiplied RGB와 누적 alpha입니다.
 * @property {{value: number}} plainRowLimit 단색 전용 program의 후보 상한입니다. 4/8/16은 고정 호출, 128은 동적 반복이며 0이면 범용 경로입니다.
 * @property {{value: Float32Array}} rowCoverage 현재 타일의 후보별 정밀 판정(0)·내부(1)·외부(2)입니다. 128 경로는 CSS 픽셀 외곽선까지의 월드 거리 하한에 3을 더한 값도 사용합니다.
 * @property {{value: Float32Array}} rowFill 4/8/16 후보 경로의 색상과 유효 알파입니다. 128 경로는 공유 metadata texture를 직접 읽습니다.
 * @property {{value: import('three').Vector3}} objectRelative 지금 그리는 지형 타일의 원점과, 도장 좌표를 기록할 때 쓴 공통 기준점 사이의 차이이며 단위는 미터입니다.<br>
 * 큰 좌표를 그대로 다룰 때 생기는 어긋남을 줄이기 위해 사용합니다.
 * @property {{value: number}} pixelRatio 화면 배율이며 CSS 픽셀 단위 선 두께를 실제 화면 픽셀로 환산할 때 사용합니다.
 * @property {{value: import('three').DataTexture}} stampDataTexture 도장의 도형·색·이미지 매핑 정보를 숫자로 담은 데이터입니다.
 * @property {{value: import('three').Vector2}} stampDataTextureSize stampDataTexture의 가로·세로 크기입니다.
 * @property {{value: import('three').CanvasTexture|import('three').DataTexture}} textureAtlas 도장 이미지들을 한 장에 모아 둔 이미지입니다.
 */

/**
 * 한 영상 레이어에 등록된 도장의 표시 상태입니다.
 *
 * getRenderState()가 돌려주며, 같은 레이어에 대해서는 항상 같은 객체가 반환됩니다.
 *
 * @typedef {Object} UTerrainStampRenderState
 * @property {number} activeCount 해당 레이어에 등록되어 있는 도장 개수입니다.
 * @property {UTerrainStampRenderUniforms} uniforms 지형 머티리얼이 셰이더로 넘기는 도장 표시용 값 묶음입니다.
 */

/**
 * getParam()이 점 하나를 JSON으로 저장할 수 있게 담는 형식입니다.
 *
 * @typedef {Object} UTerrainStampPointParam
 * @property {number} x 월드 좌표(EPSG:3857)의 동서 방향 위치이며 단위는 미터입니다.
 * @property {number} y 월드 좌표(EPSG:3857)의 남북 방향 위치이며 단위는 미터입니다.
 * @property {number} z 해발 높이이며 단위는 미터입니다. 넣을 때 생략했으면 0으로 저장됩니다.
 */

/**
 * 도장 하나의 도형·표현·표시 상태를 JSON으로 저장할 수 있게 담은 값입니다.
 *
 * getParam()이 돌려주고 setParam()이 받는 형식이며, JSON.stringify()로 그대로 문자열이 됩니다.<br>
 * app과의 연결은 담지 않으므로 복원할 때는 setApp()으로 따로 지정합니다.
 *
 * @typedef {Object} UTerrainStampParam
 * @property {'polygon'|'circle'|'polyline'} [type] 도형 종류이며, 도형이 정해지지 않은 도장에서는 없습니다.
 * @property {Array<UTerrainStampPointParam>} [points] 다각형의 꼭짓점 또는 선의 경유점 목록이며 원 도형에서는 없습니다.
 * @property {UTerrainStampPointParam} [center] 원의 중심이며 원 도형에서만 있습니다.
 * @property {number} [radius] 원의 반지름이며 단위는 미터이고 원 도형에서만 있습니다.
 * @property {string} [color] 채울 색이며 항상 '#rrggbb' 형식으로 저장됩니다.
 * @property {number} [opacity] 색으로 채울 때의 불투명도입니다.
 * @property {string} [gradientColor] 그러데이션(gradient) 끝 색이며 '#rrggbb' 형식입니다. 그러데이션을 쓰지 않으면 없습니다.
 * @property {'vertical'|'horizontal'} [gradientDirection] 그러데이션이 이어지는 방향입니다.
 * @property {string} [texture] 도장 영역에 입힌 이미지 주소이며 이미지를 쓰지 않으면 없습니다.
 * @property {number} [textureOpacity] 이미지로 채울 때의 불투명도이며 정한 적이 없으면 없습니다.
 * @property {boolean} [textureUseAlpha] 이미지 자체의 투명한 부분을 반영할지 여부이며 정한 적이 없으면 없습니다.
 * @property {number} [textureScale] 이미지를 배치할 사각 영역의 배율이며 정한 적이 없으면 없습니다.
 * @property {'stretch'|'contain'} [textureFit] 이미지를 도장 영역에 맞추는 방식입니다.
 * @property {Array<UTerrainStampPointParam>} [mappingFrame] 이미지와 그러데이션이 기준으로 삼는 사각 영역이며 지정하지 않았으면 없습니다.
 * @property {boolean} [expectTexture] 합성 대상 채움의 알파를 1로 취급할지 여부입니다. 이미지 준비 전의 투명 대기에는 영향을 주지 않습니다.
 * @property {number} [lineWidth] 선 도형의 두께입니다.
 * @property {'meters'|'pixels'} [lineWidthUnits] 선 두께를 지상 거리로 볼지 화면 픽셀로 볼지 정하는 단위입니다.
 * @property {'fill'|'mask'} [mode] 채울지 가릴지 명시한 값이며, 명시하지 않아 targetLayer 유무로 자동 결정되는 도장에서는 없습니다.
 * @property {string} [targetLayer] 가림 대상 영상 레이어의 이름이며, 지정하지 않았거나 이름이 없는 레이어이면 없습니다.
 * @property {boolean} [visible] 지형에 표시할 대상인지 여부입니다.
 * @property {number} [maxStampsPerTile] 지형 타일 하나가 검사할 도장 개수의 상한입니다. 정밀 출력과 단색 내부 합성에 같은 상한을 적용합니다.
 * @property {number} [renderOrder] 다른 도장과 겹칠 때 그리는 순서이며 값이 클수록 위에 그려집니다.
 */

/**
 * setParam()과 UTerrainStamp.fromParam()이 받는 값입니다.
 *
 * getParam() 형식과 같지만 targetLayer를 레이어 이름 문자열 대신 레이어 객체로 넘기거나 null로 해제할 수도 있습니다.
 *
 * @typedef {Omit<UTerrainStampParam, 'targetLayer'> & {targetLayer?: string|import('@U3dLayer').U3dLayer|null}} UTerrainStampParamInput
 */

/**
 * setParam()이 targetLayer 이름을 레이어 객체로 되돌릴 때 쓰는 옵션입니다.
 *
 * @typedef {Object} UTerrainStampSetParamOption
 * @property {import('@U3dApp').U3dApp} [app] 레이어 이름을 찾을 app이며, 생략하면 setApp()으로 지정한 app을 사용합니다.
 * @property {(name: string) => import('@U3dLayer').U3dLayer|undefined} [layerResolver] 레이어 이름으로 레이어를 찾는 함수이며, 지정하면 app 조회보다 먼저 사용합니다.
 */

// texture atlas는 여러 stamp 이미지 URL을 한 장의 canvas texture에 모아 shader sampler 하나로 전달하기 위한 공간입니다.
// WebGL1/Three.js material shader에서는 동적으로 sampler 배열을 늘리는 방식이 번거롭기 때문에,
// URL별 이미지를 atlas cell에 배치하고 stamp DataTexture에는 해당 cell의 UV rect만 기록합니다.
// texture atlas는 1024x1024 캔버스를 256x256 cell로 나눠 사용하므로 기본 최대 texture URL 수는 16개입니다.
// 더 많은 서로 다른 texture URL을 쓰려면 stamp 생성 전에 UTerrainStamp.setTextureAtlasMaxImages(count)를 호출합니다.
// 예: UTerrainStamp.setTextureAtlasMaxImages(64) => 2048x2048 atlas, 256x256 cell 기준 최대 64개.
const TERRAIN_STAMP_ATLAS_DEFAULT_SIZE = 1024;
const TERRAIN_STAMP_ATLAS_CELL_SIZE = 256;
const TERRAIN_STAMP_ATLAS_DEFAULT_MAX_IMAGES = 16;
const TERRAIN_STAMP_TILE_BOUNDS_MARGIN = 32;
// 조합별 GPU 자원은 레이어가 소유한다. 프레임 정보 없는 수동 호출의 전체 보관 상한이다.
// 실제 렌더에서는 활성 작업 집합을 보호하고 비활성 조합만 이 개수까지 남긴다.
const TERRAIN_STAMP_MAX_SHARED_TEXTURES = 256;
// bounds를 알 수 없는 draw는 모든 row를 정밀 판정한다. 이 공용 배열은 수정하지 않는다.
// 단색 전용 경로만 사용할 공용 영점 배열입니다. 실제 채움 배열은 후보 상한 크기로 만듭니다.
const TERRAIN_STAMP_EMPTY_ROW_COVERAGE = new Float32Array(16);
const TERRAIN_STAMP_EMPTY_ROW_FILL = new Float32Array(64);

// 매 frame/compile마다 새 Vector3를 만들면 terrain tile 수에 비례해 GC가 늘어납니다.
// 아래 scratch 객체들은 한 번의 동기 계산 안에서만 사용하고, frame 사이에 보존해야 하는 목록과 origin은 layer state가 소유합니다.
const _scratchOrigin = new Vector3(); // 현재 draw call에서 shader 좌표계의 기준이 되는 overlay origin입니다.
const _scratchObjectOrigin = new Vector3(); // 현재 렌더링 중인 terrain tile mesh의 world translation입니다.
const _scratchBoundsMin = new Vector3(); // overlay bounds 최소점을 origin 상대 좌표로 변환할 때 재사용합니다.
const _scratchBoundsMax = new Vector3(); // overlay bounds 최대점을 origin 상대 좌표로 변환할 때 재사용합니다.
const _scratchUvOrigin = new Vector3(); // texture local UV basis의 원점입니다.
const _scratchUvU = new Vector3(); // texture local UV의 U 방향 벡터입니다.
const _scratchUvV = new Vector3(); // texture local UV의 V 방향 벡터입니다.
const _scratchUvPointA = new Vector3(); // U 방향을 만들기 위한 두 번째 기준점입니다.
const _scratchUvPointB = new Vector3(); // V 방향을 만들기 위한 세 번째 기준점입니다.
const _scratchUvPointC = new Vector3(); // 4점 texture quad의 대각선 반대 기준점입니다.
const _scratchUvCenter = new Vector3(); // textureScale 적용 시 기준이 되는 중심점입니다.

const _terrainStampStateByLayer = new WeakMap();
// layer state는 마지막 stamp 제거 시 GPU 자원과 함께 해제되지만, 이미 컴파일된 terrain material은
// uniform 객체 참조를 계속 보유할 수 있습니다. layer별 binding을 별도 WeakMap에 남겨 두면 state가
// 다시 만들어져도 같은 uniform 참조를 재사용할 수 있고, layer 자체가 회수되면 binding도 함께 회수됩니다.
const _terrainStampRenderBindingByLayer = new WeakMap();
const _terrainStampStates = new Set();
// 도장 생성 순번입니다. renderOrder가 같은 도장끼리는 이 순번으로 그리는 순서를 고정해, 값이 갱신되어도 겹침 순서가 바뀌지 않게 합니다.
let _terrainStampCreationSequence = 0;
const _terrainStampAppStates = new WeakMap();
const TERRAIN_STAMP_RENDER_BEFORE_KEY = 'UTerrainStamp';

class UTerrainStampAtlas {
    constructor() {
        // texture URL은 atlas canvas의 256x256 cell 하나에 배치합니다.
        // shader에는 전체 이미지 객체를 여러 장 넘길 수 없으므로, URL별 atlas rect만 stamp data texture에 기록합니다.
        this.atlasSize = TERRAIN_STAMP_ATLAS_DEFAULT_SIZE; // atlas canvas 한 변의 pixel 크기입니다.
        this.cellSize = TERRAIN_STAMP_ATLAS_CELL_SIZE; // texture URL 하나가 차지하는 cell 한 변의 pixel 크기입니다.
        this.cellsPerRow = this.atlasSize / this.cellSize; // atlas 한 줄에 배치할 수 있는 cell 개수입니다.
        this.maxImages = TERRAIN_STAMP_ATLAS_DEFAULT_MAX_IMAGES; // atlas에 등록 가능한 서로 다른 texture URL 최대 개수입니다.
        this.entries = new Map(); // key: texture URL, value: atlas cell 위치/로드 상태/이미지 객체입니다.
        this.nextIndex = 0; // 아직 할당하지 않은 cell의 시작 index입니다.
        this.freeIndices = []; // 해제한 cell을 재사용하므로 반복 저장·삭제로 atlas가 고갈되지 않습니다.
        this.canvas = undefined; // 브라우저 환경에서 atlas 이미지를 그리는 offscreen canvas입니다.
        this.context = undefined; // canvas 2D context입니다. 이미지가 load되면 cell 영역에 drawImage합니다.
        this.texture = undefined; // shader uniform으로 연결되는 CanvasTexture 또는 fallback DataTexture입니다.
    }

    setMaxImages(value) {
        // atlas canvas/texture는 한 번 만들어지면 크기를 바꾸기 어렵습니다.
        // 따라서 최초 texture 요청 또는 URL entry 등록 전에만 최대 이미지 수 설정을 허용합니다.
        if (this.texture || this.entries.size > 0) {
            console.warn?.('UTerrainStamp texture atlas max image count must be set before using stamp textures.');
            return false;
        }

        const maxImages = Math.floor(Number(value));
        if (!Number.isFinite(maxImages) || maxImages <= 0) {
            console.warn?.(`Invalid UTerrainStamp texture atlas max image count: ${value}`);
            return false;
        }

        const cellsPerRow = Math.ceil(Math.sqrt(maxImages));
        this.atlasSize = nextPowerOfTwo(cellsPerRow * this.cellSize);
        this.cellsPerRow = Math.floor(this.atlasSize / this.cellSize);
        this.maxImages = maxImages;
        return true;
    }

    getMaxImages() {
        return this.maxImages;
    }

    getTexture() {
        // atlas texture는 texture를 쓰는 overlay가 없어도 uniform으로 항상 연결됩니다.
        // 그래야 shader variant를 texture 사용 여부에 따라 나누지 않고, count/metadata만으로 on/off할 수 있습니다.
        if (this.texture) {
            return this.texture;
        }

        // SSR/worker/test처럼 document가 없는 환경에서는 1x1 흰색 DataTexture를 사용합니다.
        // 이 경우 이미지 load는 건너뛰지만 shader uniform 구조는 유지됩니다.
        if (typeof document === 'undefined') {
            const data = new Float32Array([1, 1, 1, 1]);
            const texture = new DataTexture(data, 1, 1, RGBAFormat, FloatType);
            texture.needsUpdate = true;
            this.texture = texture;
            return texture;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.atlasSize;
        this.canvas.height = this.atlasSize;
        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            const data = new Float32Array([1, 1, 1, 1]);
            const texture = new DataTexture(data, 1, 1, RGBAFormat, FloatType);
            texture.needsUpdate = true;
            this.texture = texture;
            return texture;
        }
        this.context.clearRect(0, 0, this.atlasSize, this.atlasSize);

        this.texture = new CanvasTexture(this.canvas);
        // Canvas 2D의 이미지 RGB는 sRGB입니다. GPU에서 선형 색상으로 읽어야 출력 변환 때 다시 밝아지지 않습니다.
        // 색 공간은 RGB에만 적용되므로 PNG alpha와 stamp의 불투명도 계산은 그대로 유지됩니다.
        this.texture.colorSpace = SRGBColorSpace;
        this.texture.minFilter = LinearFilter;
        this.texture.magFilter = LinearFilter;
        this.texture.wrapS = ClampToEdgeWrapping;
        this.texture.wrapT = ClampToEdgeWrapping;
        this.texture.generateMipmaps = false;
        this.texture.flipY = false;
        this.texture.needsUpdate = true;
        return this.texture;
    }

    getEntry(url) {
        // 같은 URL은 같은 atlas cell을 재사용합니다.
        // 처음 요청되는 URL만 새 cell을 할당하고 비동기 이미지 load를 시작합니다.
        const textureUrl = String(url ?? '');
        if (!textureUrl) {
            return undefined;
        }

        let entry = this.entries.get(textureUrl);
        if (entry) {
            return entry;
        }

        if (this.freeIndices.length === 0 && this.nextIndex >= this.maxImages) {
            // atlas가 꽉 차면 이미지를 사용할 수 없으므로 채움은 투명하게 유지합니다.
            // 호출부는 undefined entry를 받아 기본 atlas rect와 hasTexture=0을 기록합니다.
            console.warn?.(
                `UTerrainStamp texture atlas is full. `
                + `Max unique texture URLs: ${this.maxImages}. `
                + `Texture fill remains transparent: ${textureUrl}`
            );
            return undefined;
        }

        // entries.size는 중간 cell을 지운 뒤 기존 cell과 충돌하므로 할당 번호로 사용할 수 없습니다.
        const index = this.freeIndices.length > 0 ? this.freeIndices.pop() : this.nextIndex++;
        const column = index % this.cellsPerRow;
        const row = Math.floor(index / this.cellsPerRow);
        const x = column * this.cellSize;
        const y = row * this.cellSize;

        entry = {
            url: textureUrl,
            index,
            loaded: false,
            rect: {
                minU: x / this.atlasSize,
                minV: y / this.atlasSize,
                maxU: (x + this.cellSize) / this.atlasSize,
                maxV: (y + this.cellSize) / this.atlasSize,
            },
        };
        this.entries.set(textureUrl, entry);
        this.loadEntry(entry, x, y);
        return entry;
    }

    /**
     * 사용하지 않는 URL의 cell을 비우고 다음 이미지가 재사용할 수 있게 합니다.
     *
     * @param {string} url 해제할 이미지 주소입니다.
     * @returns {boolean} 등록된 이미지 cell을 해제했으면 true, 등록되지 않았으면 false입니다.
     */
    releaseEntry(url) {
        const entry = this.entries.get(url);
        if (!entry) return false;

        // 먼저 소유권을 끊어 이미 큐에 들어간 이전 load callback도 새 cell에 쓸 수 없게 합니다.
        this.entries.delete(url);
        this.freeIndices.push(entry.index);
        if (entry.image) {
            entry.image.onload = null;
            entry.image.onerror = null;
            entry.image.removeAttribute('src');
            entry.image = undefined;
        }
        const x = (entry.index % this.cellsPerRow) * this.cellSize;
        const y = Math.floor(entry.index / this.cellsPerRow) * this.cellSize;
        this.context?.clearRect(x, y, this.cellSize, this.cellSize);
        if (this.texture) this.texture.needsUpdate = true;
        markAllTerrainStampStatesDirty();
        return true;
    }

    loadEntry(entry, x, y) {
        // atlas canvas가 없는 환경이면 load를 시도하지 않습니다.
        // entry.loaded=false 상태로 남아 이미지가 지정된 채움은 투명하게 유지됩니다.
        this.getTexture();
        if (!this.context || typeof Image === 'undefined') {
            return;
        }

        const urls = getTerrainOverlayTextureUrlCandidates(entry.url);
        let urlIndex = 0;

        // 절대 경로 이미지가 환경에 따라 baseURI 기준 상대 경로로만 열리는 경우가 있어 후보를 순차 시도합니다.
        const loadNext = () => {
            if (this.entries.get(entry.url) !== entry) return;
            if (urlIndex >= urls.length) {
                entry.loaded = false;
                console.warn?.(`UTerrainStamp texture load failed: ${entry.url}`);
                return;
            }

            this.loadImage(entry, x, y, urls[urlIndex++], loadNext);
        };

        loadNext();
    }

    loadImage(entry, x, y, url, onError) {
        // Image 객체는 entry에 보관합니다.
        // load가 끝나기 전에 GC되거나 외부 참조가 사라지는 일을 피하고, 디버깅 시 현재 로드 상태를 확인하기 위함입니다.
        const image = new Image();
        entry.image = image;
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            if (this.entries.get(entry.url) !== entry) return;
            this.context.clearRect(x, y, this.cellSize, this.cellSize);
            this.context.drawImage(image, x, y, this.cellSize, this.cellSize);
            entry.loaded = true;
            // atlas 이미지가 갱신되면 texture uniform 자체는 같지만 GPU upload가 다시 필요합니다.
            // 또한 overlay metadata의 hasTexture 값이 0에서 1로 바뀌어야 하므로 overlay texture도 dirty 처리합니다.
            this.texture.needsUpdate = true;
            markAllTerrainStampStatesDirty();
        };
        image.onerror = () => {
            if (this.entries.get(entry.url) !== entry) return;
            onError?.();
        };
        image.src = url;
    }
}

const _textureAtlas = new UTerrainStampAtlas();

/**
 * 지형 표면에 색이나 이미지를 입히는 도장(stamp)입니다.
 *
 * 다각형(polygon), 원(circle), 선(polyline) 중 한 가지 도형을 정해 색이나 이미지로 채웁니다.<br>
 * 가림(mask) 도장으로 지정하면 채우는 대신 대상 영상 레이어를 그 영역에서 보이지 않게 합니다.<br>
 * 인스턴스 메서드는 도형·표현·표시 여부를 바꾸고, 정적 메서드는 지형을 그리는 쪽에서 표시 상태를 조회합니다.
 * 지면 경계·외곽선·이미지는 화면 해상도에서 정밀하게 판정합니다.<br>
 * 타일 전체가 동일한 단색일 때만 합성색을 재사용합니다. 경계가 있는 단색 후보도 지원 범위에서는 전용 셰이더로 그립니다.<br>
 * 도형이 변경된 범위의 타일 후보를 갱신하며, 같은 후보·이미지 atlas 상태의 메타데이터는 재업로드하지 않습니다.<br>
 * 확정된 타일 내부/외부만 재사용하고 경계·화면 픽셀 선폭은 원래 정밀도로 판정합니다. 반투명 순서와 타일별 도장 상한은 유지합니다.
 */
class UTerrainStamp {
    /**
     * 지형 재질에 상수색·단색 후보·범용 후보 중 현재 타일에 맞는 정밀 합성 경로를 연결합니다.
     *
     * @param {import('three').WebGLProgramParametersWithUniforms} shader 컴파일할 셰이더입니다.
     * @param {object} uniforms 레이어가 소유하는 uniform binding입니다.
     *
     * @ignore
     */
    static _addCompositeShader(shader, uniforms) {
        // 공개 재질은 shader 연결만 요청하고 후보별 최적화 구현은 비공개 모듈에 둡니다.
        INTERNAL.addCompositeShader(shader, uniforms);
    }
    /**
     * 모든 도장이 함께 쓰는 이미지 보관소에 등록할 수 있는 이미지 주소의 최대 개수를 바꿉니다.
     *
     * 이미지 주소를 지정한 도장이 하나라도 만들어지기 전에만 바꿀 수 있고, 그 뒤의 호출은 경고만 남기고 무시됩니다.<br>
     * 기본값인 16개보다 많은 서로 다른 이미지를 쓰려면 첫 도장을 만들기 전에 호출하십시오.
     *
     * @param {number} value 서로 다른 이미지 주소를 몇 개까지 등록할지 정하는 1 이상의 값입니다.
     * @returns {boolean} 최대 개수가 실제로 바뀌었으면 true, 바꿀 수 있는 시점이 지났거나 값이 올바르지 않아 무시되었으면 false입니다.
     */
    static setTextureAtlasMaxImages(value) {
        return _textureAtlas.setMaxImages(value);
    }

    /**
     * 모든 도장이 함께 쓰는 이미지 보관소에 등록할 수 있는 이미지 주소의 현재 최대 개수를 반환합니다.
     *
     * @returns {number} 현재 설정된 최대 개수이며 기본값은 16입니다.
     */
    static getTextureAtlasMaxImages() {
        return _textureAtlas.getMaxImages();
    }

    /**
     * 표시 중인 도장이 사용하지 않는 이미지 주소를 공용 이미지 보관소에서 해제합니다.
     *
     * 해당 이미지를 쓰는 도장을 모두 정리한 뒤 호출하면 보관 공간을 다른 이미지가 재사용합니다.<br>
     * 숨겨진 도장이 같은 주소로 다시 표시되면 이미지를 다시 읽으므로 주소를 유효하게 유지해야 합니다.<br>
     * Blob URL 자체는 해제하지 않습니다. URL을 소유한 호출자가 모든 사용자를 정리한 뒤 revokeObjectURL을 호출하십시오.
     *
     * @param {string} url 보관소에서 해제할 이미지 주소입니다.
     * @returns {boolean} 해제했으면 true, 표시 중인 도장이 사용하거나 등록되지 않은 주소이면 false입니다.
     * @throws {TypeError} url이 문자열이 아니면 발생합니다.
     */
    static releaseTexture(url) {
        if (typeof url !== 'string') throw new TypeError('UTerrainStamp.releaseTexture: url must be a string.');
        // atlas는 모든 앱과 레이어가 공유하므로 다른 앱의 활성 도장도 함께 확인합니다.
        for (const state of _terrainStampStates) {
            for (const cache of state.cacheByStamp.values()) {
                if (cache.texture === url) return false;
            }
        }
        return _textureAtlas.releaseEntry(url);
    }

    /**
     * 지형을 그리는 쪽이 참조할 영상 레이어별 도장 표시 상태를 반환합니다.
     *
     * 같은 레이어에 대해서는 항상 같은 객체를 돌려주므로 호출한 쪽에서 참조를 보관해 두고 사용할 수 있습니다.<br>
     * 등록된 도장이 모두 사라진 뒤에도 개수 0인 상태 객체가 계속 반환됩니다.
     *
     * @param {import('@U3dLayer').U3dLayer} layer 표시 상태를 조회할 영상 레이어입니다.
     * @returns {UTerrainStampRenderState|undefined} 해당 레이어의 표시 상태이며, 이 레이어에 도장이 한 번도 등록된 적이 없으면 undefined입니다.
     */
    static getRenderState(layer) {
        // 한 번이라도 stamp가 사용된 layer는 빈 binding(count=0)을 계속 반환합니다.
        // Three.js가 이전 shader program을 cache에서 재사용하면 onBeforeCompile을 다시 호출하지 않을 수 있으므로,
        // binding 존재 여부는 유지하고 합성/row variant만 따로 선택해야 이전 program을
        // 다시 사용할 때도 현재 layer와 같은 uniform 참조를 유지합니다.
        return getTerrainStampRenderBinding(layer, false);
    }

    /**
     * 지형 타일 하나를 그리기 직전에 해당 영상 레이어의 표시 상태 값을 현재 타일 기준으로 갱신합니다.
     *
     * 도장이 한 번도 등록된 적 없는 레이어이면 아무 것도 하지 않습니다.
     * 단색 내부 타일이면 합성색을 재사용하고, 경계·이미지·선이 있는 타일이면 정밀 도형 판정을 사용합니다.
     *
     * @param {import('@U3dLayer').U3dLayer} layer 갱신할 영상 레이어입니다.
     * @param {Partial<{object: import('three').Object3D, renderer: import('three').WebGLRenderer}> & Record<string, any>} [renderContext] 지금 그리는 대상에 대한 정보이며 아래 두 값만 사용합니다.<br>
     * object는 지금 그리는 지형 타일이며, 이 타일과 겹치는 도장만 남깁니다.<br>
     * renderer는 화면 배율과 렌더 프레임 번호를 제공합니다. 없으면 배율 1과 최대 256개 조합 보관을 사용합니다.<br>
     * 프레임 번호가 있으면 현재·직전 프레임의 후보 조합을 보호하여 256개를 넘는 활성 화면도 재사용합니다.<br>
     * object를 넘기지 않으면 전역 후보를 사용하며, 대상 영상이 지정된 mask는 덮임을 확인할 수 없어 보류합니다.
     */
    static updateRenderUniforms(layer, renderContext = {}) {
        const state = getTerrainStampState(layer, false);
        if (!state) {
            return;
        }

        updateTerrainOverlayUniforms(state, renderContext);
    }

    /**
     * app의 영상 레이어 구성이 바뀐 뒤, 그 app에 연결된 모든 도장의 적용 대상 레이어를 다시 계산합니다.
     *
     * @param {import('@U3dApp').U3dApp} app 도장이 연결되어 있는 app입니다.
     * @returns {boolean} 적용 대상 레이어가 바뀐 도장이 하나라도 있으면 true, 바뀐 도장이 없거나 연결된 도장이 없으면 false입니다.
     */
    static refreshAppLayerStates(app) {
        const appState = getTerrainStampAppState(app, false);
        if (!appState || appState.stamps.size <= 0) {
            return false;
        }

        // 정렬 자료는 이번 동기 호출에만 공유합니다. 다음 호출과 setter는 레이어 목록과
        // renderOrder를 다시 읽으므로 외부의 제자리 변경을 놓치는 영속 cache가 생기지 않습니다.
        const sortedLayers = getSearchLayers(app);
        let refreshed = false;
        for (const stamp of appState.stamps) {
            refreshed = stamp.#refreshSearchLayers(stamp.#app === app ? sortedLayers : undefined) || refreshed;
        }
        return refreshed;
    }

    /**
     * Helper가 소유한 도장만 한 동기 작업으로 묶어 마지막 상태를 registry에 반영합니다.
     *
     * callback 중 새 도장은 include로 먼저 포함해야 합니다. 포함하지 않은 일반 도장은
     * 평소처럼 즉시 동작합니다. callback 안에서는 await나 중간 렌더를 실행하지 않습니다.
     * 도장별 마지막 변경 순서를 지켜 공유 상한을 반영하며, 예외가 나도 이미 바뀐 상태를
     * 정리하고 배치 문맥을 복구합니다. 이 메서드는 호출 결과를 되돌리는 transaction은 아닙니다.
     * retire는 독점 소유 texture만 전달받습니다. 정상 반환한 뒤에는 호출자가 정확히 한 번
     * dispose해야 하며, 받을 수 없으면 소유권을 저장하기 전에 예외를 던져야 합니다.
     * onStampError는 도장별 commit 실패의 소유자를 관찰하는 용도이며 도장을 변경하지 않습니다.
     * 통지는 기존 오류 전파를 대신하지 않습니다. 통지 함수의 오류도 수집하여 나머지 commit을 마칩니다.
     *
     * @template T
     * @param {Iterable<import('@union3d/helpers/UTerrainStamp').UTerrainStamp>} stamps 함께 처리할 Helper 소유 도장입니다.
     * @param {function(function(import('@union3d/helpers/UTerrainStamp').UTerrainStamp): import('@union3d/helpers/UTerrainStamp').UTerrainStamp): T} callback 도장 변경을 수행하는 동기 함수입니다.
     * @param {function(import('three').DataTexture): void} [retire] 마지막 사용이 끝난 texture의 정리 소유권을 받을 함수이며, 생략하면 즉시 해제합니다.
     * @param {function(import('@union3d/helpers/UTerrainStamp').UTerrainStamp, unknown): void} [onStampError] 검색·등록에 실패한 도장과 원래 오류를 관찰할 내부 함수입니다.
     * @returns {T} callback의 반환값입니다.
     *
     * @ignore
     */
    static _withHelperBatch(stamps, callback, retire = undefined, onStampError = undefined) {
        if (typeof callback !== 'function' || (retire !== undefined && typeof retire !== 'function')
            || (onStampError !== undefined && typeof onStampError !== 'function')) {
            throw new TypeError('UTerrainStamp._withHelperBatch: callbacks must be functions.');
        }
        const batch = {members: new Map(), registeredLayers: new Map(), pending: new Set(), states: new Set(), layers: new Map(),
            resources: [], committing: false, closed: false};
        const errors = [];
        const include = stamp => {
            if (batch.closed) throw new Error('UTerrainStamp helper batch is already closed.');
            if (!(stamp instanceof UTerrainStamp)) throw new TypeError('Helper batch requires UTerrainStamp instances.');
            if (!batch.members.has(stamp)) {
                batch.members.set(stamp, stamp.#helperBatch);
                // dispose는 공개 수명을 즉시 끝내며 인스턴스 snapshot을 비웁니다.
                // 최종 commit이 옛 registry를 제거할 수 있도록 원래 layer 목록만 보관합니다.
                batch.registeredLayers.set(stamp, stamp.#registeredSearchLayers
                    ?? stamp.#helperBatch?.registeredLayers.get(stamp));
                stamp.#helperBatch = batch;
            }
            return stamp;
        };
        let result;
        try {
            for (const stamp of stamps) include(stamp);
            result = callback(include);
            if (result && typeof result.then === 'function') {
                throw new TypeError('UTerrainStamp helper batch callback must be synchronous.');
            }
        } catch (error) {
            errors.push(error);
        } finally {
            batch.closed = true;
            batch.committing = true;
            try {
                for (const stamp of batch.pending) {
                    const parent = batch.members.get(stamp);
                    if (parent) {
                        // 같은 도장을 포함한 중첩 배치는 바깥 commit에 합칩니다.
                        // 마지막 변경 순서를 갱신해야 공유 maxStampsPerTile의 우선순서도 같습니다.
                        parent.pending.delete(stamp);
                        parent.pending.add(stamp);
                        continue;
                    }
                    try {
                        if (stamp.#disposed || !stamp.visible) {
                            stamp.#unregisterTerrainOverlay(true);
                        } else {
                            const app = stamp.#app;
                            if (!batch.layers.has(app)) batch.layers.set(app, getSearchLayers(app));
                            stamp.#searchLayers = getSearchLayers(app, getTerrainStampSearchTargetLayer(stamp), batch.layers.get(app));
                            stamp.#registerTerrainOverlay();
                        }
                    } catch (error) {
                        errors.push(error);
                        // layer 검색 자체가 실패하면 register의 오류 정리를 거치지 않습니다.
                        // 옛 app의 등록을 남기지 않고, 다른 도장의 commit은 계속합니다.
                        try { stamp.#unregisterTerrainOverlay(true); } catch (cleanupError) { errors.push(cleanupError); }
                        if (onStampError) {
                            try { onStampError(stamp, error); } catch (notificationError) { errors.push(notificationError); }
                        }
                    }
                }
                // 일반 Stamp의 동기 재진입이 같은 레이어를 해제·재생성할 수 있습니다.
                // 지금도 소유 중인 동일 state만 비웠는지 확인하고 자원을 분리합니다.
                for (const state of batch.states) {
                    if (_terrainStampStates.has(state)) {
                        releaseTerrainStampState(state, texture => batch.resources.push(texture));
                    }
                }
            } finally {
                for (const [stamp, parent] of batch.members) {
                    if (stamp.#helperBatch === batch) stamp.#helperBatch = parent;
                }
            }
            // registry, binding과 옛 tile record를 모두 끊은 뒤 외부 정리 함수를 호출합니다.
            // 이 시점에는 같은 레이어에 새 state가 만들어져도 옛 자원이 간섭하지 않습니다.
            for (const texture of batch.resources) {
                if (retire) {
                    try { retire(texture); continue; } catch (error) { errors.push(error); }
                }
                try { texture.dispose(); } catch (error) { errors.push(error); }
            }
            // include를 실수로 보관하더라도 종료된 작업이 도장·app·texture를 붙잡지 않습니다.
            batch.members.clear();
            batch.registeredLayers.clear();
            batch.pending.clear();
            batch.states.clear();
            batch.layers.clear();
            batch.resources.length = 0;
        }
        if (errors.length === 1) throw errors[0];
        if (errors.length > 1) throw new AggregateError(errors, 'UTerrainStamp helper batch failed.');
        return result;
    }

    /**
     * getParam()이 돌려준 값으로 새 도장을 만듭니다.
     *
     * app을 넘기면 먼저 setApp()으로 연결한 뒤 값을 반영하므로 param의 targetLayer 이름을 그 app에서 찾습니다.<br>
     * param에 visible이 없으면 생성자 기본값대로 표시하지 않는 상태로 만들어집니다.<br>
     * 도형 값이 올바르지 않아 반영에 실패하면 만든 도장을 정리하고 undefined를 반환합니다.
     *
     * @param {UTerrainStampParamInput} param getParam()이 돌려준 형식의 값이며 targetLayer는 레이어 객체로 넘겨도 됩니다.
     * @param {import('@U3dApp').U3dApp} [app] 새 도장을 연결할 app입니다.
     * @returns {UTerrainStamp|undefined} 만들어진 도장이며, 값이 올바르지 않으면 undefined입니다.
     */
    static fromParam(param, app) {
        const stamp = new UTerrainStamp();
        if (defined(app)) {
            stamp.setApp(app);
        }
        if (!stamp.setParam(param, {app})) {
            stamp.dispose();
            return undefined;
        }
        return stamp;
    }

    #disposed = false;
    #app = undefined;
    #searchLayers = [];
    #creationId = 0;
    // 비교값은 registry와 같은 독립 복사본으로 보관해 호출자가 바꾸는 객체를 그대로 참조하지 않는다.
    #registeredCache;
    #registeredSearchLayers;
    #helperBatch;

    /**
     * UTerrainStamp 클래스 생성자입니다.
     *
     * 도형 정보를 하나도 넘기지 않으면 빈 도장을 만들고, 이후 setPoints()나 setCircle()로 도형을 정합니다.<br>
     * 도형 정보를 넘겼는데 올바르지 않으면 오류 메시지만 남기고 도형이 없는 상태로 남습니다.<br>
     * 지형에 실제로 그려지려면 visible이 true이고 setApp()으로 지정한 app에서 적용 대상 영상 레이어가 하나 이상 찾아져야 하므로, 생성만으로는 화면에 나타나지 않습니다.
     *
     * @param {object} [opt] 도형과 표현을 한 번에 지정하는 생성 옵션입니다.
     * @param {boolean} [opt.visible=false] 표시 대상으로 삼을지 여부입니다.
     * @param {'polygon'|'circle'|'polyline'} [opt.type='polygon'] 도형 종류이며 다각형, 원, 선 중 하나입니다.
     * @param {Array<import('three').Vector3|import('@union3d/helpers/UTerrainStamp').UTerrainStampPointLike>} [opt.points] 다각형의 꼭짓점 또는 선의 경유점 목록이며 월드 좌표(EPSG:3857)입니다.<br>
     * 다각형은 3개 이상, 선은 2개 이상이 필요하고 앞에서부터 16개까지만 사용합니다.
     * @param {import('three').Vector3|import('@union3d/helpers/UTerrainStamp').UTerrainStampPointLike} [opt.center] 원의 중심이며 월드 좌표(EPSG:3857)입니다.
     * @param {number} [opt.radius] 원의 반지름이며 단위는 미터이고 0보다 커야 합니다.
     * @param {number} [opt.lineWidth=1] 선 도형의 두께이며 0보다 커야 합니다.
     * @param {'meters'|'pixels'} [opt.lineWidthUnits='meters'] 선 두께를 지상 거리(미터)로 볼지 화면 픽셀로 볼지 정합니다.<br>
     * meters이면 확대·축소해도 지상에서 같은 폭을 덮고, pixels이면 화면에서 같은 굵기로 보입니다.
     * @param {string|number|import('three').Color} [opt.color='#00ffff'] 이미지가 지정되지 않은 도장을 채울 색입니다.
     * @param {number} [opt.opacity=1] 색으로 채울 때의 불투명도이며 0이면 완전히 투명하고 1이면 불투명합니다.
     * @param {string|number|import('three').Color} [opt.gradientColor] 지정하면 color에서 이 색으로 이어지는 그러데이션(gradient)으로 채웁니다.
     * @param {'vertical'|'horizontal'} [opt.gradientDirection='vertical'] 그러데이션이 이어지는 방향이며, 허용하지 않는 값은 vertical로 바뀝니다.
     * @param {string} [opt.texture] 도장 영역에 입힐 이미지 주소이며, 준비될 때까지 투명하게 기다리고 지정하지 않으면 색으로 채웁니다.
     * @param {number} [opt.textureOpacity=1] 이미지로 채울 때의 불투명도이며 0 이상 1 이하로 제한됩니다.
     * @param {boolean} [opt.textureUseAlpha=true] 이미지 자체의 투명한 부분을 그대로 비칠지 여부이며, false이면 이미지 전체를 textureOpacity로 균일하게 덮습니다.
     * @param {number} [opt.textureScale=1] 이미지를 배치할 사각 영역을 중심 기준으로 넓히거나 좁히는 배율입니다.<br>
     * 1보다 크면 같은 이미지가 더 넓은 영역에 걸쳐 크게 보이고, 0 이하이거나 숫자가 아니면 1을 사용합니다.
     * @param {'stretch'|'contain'} [opt.textureFit='stretch'] 이미지를 도장 영역에 맞추는 방식이며, 허용하지 않는 값은 stretch로 바뀝니다.<br>
     * stretch는 도형을 감싸는 사각 영역에 이미지를 늘려 채우고 도형 밖으로 나간 부분은 보이지 않습니다.<br>
     * contain은 이미지를 꼭짓점 네 개에 맞춰 기울여 넣으며, 이미지를 쓰는 꼭짓점 4개짜리 다각형에서만 적용되고 그 밖에는 stretch처럼 동작합니다.
     * @param {Array<import('three').Vector3|import('@union3d/helpers/UTerrainStamp').UTerrainStampPointLike>|null} [opt.mappingFrame] 이미지와 그러데이션이 기준으로 삼을 별도의 사각 영역이며 월드 좌표(EPSG:3857) 3~4개를 넣습니다.<br>
     * 지정하면 도형과 무관하게 이 영역을 기준으로 이미지가 배치되므로, 움직이는 도장에서도 무늬가 흔들리지 않습니다.
     * @param {boolean} [opt.expectTexture=false] 합성 대상 채움의 알파를 1로 취급할지 여부이며, 이미지 준비 전에는 값과 관계없이 투명하게 기다립니다.
     * @param {import('@U3dLayer').U3dLayer} [opt.targetLayer] 가림 대상으로 삼을 영상 레이어이며, 지정하면 이 레이어보다 위에 그려지는 레이어에만 도장이 적용됩니다.
     * @param {string|number} [opt.mode] 채울지 가릴지 정하며 fill 또는 mask를 넣습니다.<br>
     * 생략하거나 그 밖의 값을 넣으면 targetLayer가 있을 때 가림, 없을 때 채움으로 동작합니다.
     * @param {number} [opt.maxStampsPerTile=128] 지형 타일 하나가 검사할 도장 개수의 상한이며 1 이상 128 이하로 제한됩니다. 정밀 출력과 단색 내부 합성에 동일하게 적용합니다.<br>
     * 같은 영상 레이어에 등록된 도장들이 이 값을 공유하므로 마지막으로 반영된 값이 그 레이어에 적용됩니다.
     * @param {number} [opt.renderOrder=0] 다른 도장과 겹칠 때 그리는 순서이며 값이 클수록 위에 그려집니다.<br>
     * 값이 같으면 먼저 만든 도장이 아래에 그려지고, 숫자가 아니면 0을 사용합니다.
     */
    constructor(opt = {}) {
        // visible은 registry 등록 여부를 제어합니다.
        // false이면 인스턴스 상태는 보존하지만 shader texture 후보에서는 제외됩니다.
        this.visible = defaultValue(opt.visible, false);

        // color/opacity는 texture가 지정되지 않은 overlay의 색상 fill에만 사용합니다.
        this.color = defaultValue(opt.color, DEFAULT_COLOR);
        this.opacity = defaultValue(opt.opacity, 1);
        this.gradientColor = defaultValue(opt.gradientColor, undefined);
        this.gradientDirection = resolveTerrainStampGradientDirection(opt.gradientDirection);

        // texture 관련 값은 이미지 URL과 alpha 계산 방식을 정의합니다.
        // texture는 문자열 URL만 유효한 이미지 overlay로 처리합니다.
        this.texture = defaultValue(opt.texture, undefined);
        this.textureOpacity = defaultValue(opt.textureOpacity, 1);
        this.textureUseAlpha = defaultValue(opt.textureUseAlpha, true);
        this.textureScale = defaultValue(opt.textureScale, 1);
        this.textureFit = resolveTerrainStampTextureFit(opt.textureFit);
        this.mappingFrame = normalizeTerrainStampMappingFrame(opt.mappingFrame);
        this.expectTexture = opt.expectTexture === true;
        this.targetLayer = defaultValue(opt.targetLayer, undefined);
        this.mode = resolveTerrainStampMode(opt.mode);
        this.lineWidth = getPositiveTerrainStampNumber(opt.lineWidth, 1);
        this.lineWidthUnits = resolveTerrainStampLineWidthUnits(opt.lineWidthUnits);

        // 전역 제한값이지만 인스턴스 option으로 들어오면 registry 동기화 시 전역 제한을 갱신합니다.
        this.maxStampsPerTile = defaultValue(opt.maxStampsPerTile, DEFAULT_MAX_STAMPS_PER_TILE);

        // 겹치는 도장끼리의 그리는 순서입니다. shader는 texture row 순서대로 덮어 그리므로 registry에서 이 값으로 정렬합니다.
        this.renderOrder = resolveTerrainStampRenderOrder(opt.renderOrder);
        this.#creationId = ++_terrainStampCreationSequence;

        const hasShapeOption = opt.type !== undefined
            || opt.points !== undefined
            || opt.center !== undefined
            || opt.radius !== undefined;

        if (!hasShapeOption) {
            return;
        }

        if (!this.#setShape(opt)) {
            __GError__(this, '지원하지 않는 overlay 타입이거나 도형 정보가 올바르지 않습니다.', '2736436');
            return;
        }
        this.#syncRegistry();
    }

    /**
     * 이 도장을 적용할 app을 지정합니다.
     *
     * app을 지정해야 그 app의 영상 레이어 중 적용 대상이 정해지고 지형에 그려질 수 있습니다.<br>
     * undefined를 넘기면 기존 app과의 연결이 끊어져 지형에서 사라지며, 도형과 표현 값은 그대로 남습니다.
     *
     * @param {import('@U3dApp').U3dApp|undefined} app 이 도장을 적용할 app이며, undefined이면 연결을 끊습니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setApp(app) {
        this.#unregisterTerrainOverlay(true);
        unregisterTerrainStampApp(this.#app, this);
        this.#app = app;
        registerTerrainStampApp(app, this);
        if (!this.#helperBatch) this.#searchLayers = getSearchLayers(app, getTerrainStampSearchTargetLayer(this));
        this.#syncRegistry();
        return this;
    }

    /**
     * 이 도장에 지정되어 있는 app을 반환합니다.
     *
     * @returns {import('@U3dApp').U3dApp|undefined} setApp()으로 지정한 app이며, 지정한 적이 없으면 undefined입니다.
     */
    getApp() {
        return this.#app;
    }

    /**
     * 가림 대상으로 삼을 영상 레이어를 바꿉니다.
     *
     * 지정하면 그 레이어보다 렌더 순서가 뒤여서 위에 그려지는 영상 레이어에만 구멍이 나고, 지정한 레이어 자신에는 구멍이 나지 않습니다.<br>
     * 다만 가림 도장은 지정한 레이어와 그 아래 레이어에서도 자기보다 그리는 순서(renderOrder)가 낮은 도장을 그 영역 안에서 숨기므로, 구멍으로 드러나는 아래 레이어에 낮은 순서의 채움이 비치지 않습니다.<br>
     * 채울지 가릴지를 따로 정하지 않은 도장은 대상 레이어가 지정되는 순간 가림 도장으로 동작합니다.<br>
     * 채움으로 지정해 둔 도장이면 대상 레이어를 지정해도 채움으로 남고, 적용 범위만 그 위 레이어로 좁혀집니다.<br>
     * 현재 값과 같은 레이어를 넘기면 아무 것도 바뀌지 않습니다.
     *
     * @param {import('@U3dLayer').U3dLayer|undefined} layer 가림 대상 영상 레이어이며, undefined이면 대상 지정을 해제합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTargetLayer(layer) {
        if (this.targetLayer === layer) {
            return this;
        }

        this.#unregisterTerrainOverlay(true);
        this.targetLayer = layer;
        if (!this.#helperBatch) this.#searchLayers = getSearchLayers(this.#app, getTerrainStampSearchTargetLayer(this));
        this.#syncRegistry();
        return this;
    }

    /**
     * 가림 대상으로 지정되어 있는 영상 레이어를 반환합니다.
     *
     * @returns {import('@U3dLayer').U3dLayer|undefined} setTargetLayer()로 지정한 레이어이며, 지정한 적이 없으면 undefined입니다.
     */
    getTargetLayer() {
        return this.targetLayer;
    }

        // 새로은 레이어 검색 구간이 등록
    /**
     * 다각형의 꼭짓점 또는 선의 경유점 목록을 바꿉니다.
     *
     * 현재 도형이 선이면 경유점으로, 그 밖에는 다각형 꼭짓점으로 사용합니다.<br>
     * 원이던 도장에 점 목록을 넣으면 다각형으로 바뀌면서 중심과 반지름 값이 지워집니다.<br>
     * 색·불투명도·이미지 같은 표현 값은 그대로 두며, 이 값들은 setColor()나 setStyle() 계열로 바꿉니다.<br>
     * 점이 모자라는 등 올바르지 않은 입력이면 오류 메시지를 남기고 기존 도형을 그대로 유지합니다.
     *
     * @param {Array<import('three').Vector3|UTerrainStampPointLike>} points 월드 좌표(EPSG:3857) 점 목록이며, 다각형은 3개 이상, 선은 2개 이상이 필요합니다.<br>
     * 앞에서부터 16개까지만 사용하고 나머지는 버립니다.
     * @returns {UTerrainStamp|undefined} 바뀌었으면 이 도장 자신을, 입력이 올바르지 않아 아무 것도 바뀌지 않았으면 undefined를 반환합니다.
     */
    setPoints(points) {
        const isPolyline = this.type === 'polyline';
        const updated = isPolyline
            ? this.#setPolylinePoints(points, this.lineWidth)
            : this.#setPolygonPoints(points);
        if (!updated) {
            __GError__(this, isPolyline
                ? 'polyline overlay는 최소 2개의 point가 필요합니다.'
                : 'polygon overlay는 최소 3개의 point가 필요합니다.', '2739754');
            return undefined;
        }

        this.#syncRegistry();
        return this;
    }

    /**
     * 현재 다각형 꼭짓점 또는 선 경유점 목록을 복사해 반환합니다.
     *
     * 반환된 배열과 각 점을 바꿔도 이 도장에는 반영되지 않으므로, 바꾼 목록은 setPoints()로 다시 넘겨야 합니다.<br>
     * 각 점은 넣을 때 쓴 형태 그대로 복사되므로, three.js Vector3로 넣었으면 Vector3로 돌아옵니다.
     *
     * @returns {Array<import('three').Vector3|UTerrainStampPointLike>|undefined} 월드 좌표(EPSG:3857) 점 목록의 복사본이며, 점 목록을 가진 도형이 아니면 undefined입니다.
     */
    getPoints() {
        return Array.isArray(this.points)
            ? this.points.map((point) => cloneTerrainStampValue(point))
            : undefined;
    }

    /**
     * 도형의 현재 중심을 지정한 월드 좌표로 옮깁니다.
     *
     * 다각형과 선은 화면에 사용되는 점(앞에서부터 최대 16개)의 산술 평균을 현재 중심으로 삼고,
     * 새 중심까지의 이동량을 모든 꼭짓점 또는 경유점에 더하므로 기존 모양과 크기가 유지됩니다.<br>
     * 원은 반지름을 유지한 채 중심 좌표만 바뀝니다.<br>
     * 별도로 지정한 mappingFrame은 움직이지 않으므로 함께 옮겨야 하면 update()로 새 mappingFrame을 지정하십시오.<br>
     * 올바르지 않은 좌표이거나 아직 도형이 없는 도장이면 오류 메시지를 남기고 기존 도형을 그대로 유지합니다.
     *
     * @param {import('three').Vector3|UTerrainStampPointLike} center 옮겨 갈 도형 중심의 월드 좌표(EPSG:3857)입니다.
     * @returns {UTerrainStamp|undefined} 이동했으면 이 도장 자신을, 입력 또는 현재 도형이 올바르지 않으면 undefined를 반환합니다.
     */
    setCenter(center) {
        if (!isValidTerrainStampPoint(center)) {
            __GError__(this, 'overlay 중심은 올바른 월드 좌표여야 합니다.', '2741143');
            return undefined;
        }

        if (this.type === 'circle') {
            if (!this.#setCircleShape(center, this.radius)) {
                __GError__(this, 'circle overlay는 중심을 이동하려면 양수 radius가 필요합니다.', '3741382');
                return undefined;
            }
            this.#syncRegistry();
            return this;
        }

        const minimumPointCount = this.type === 'polyline' ? 2 : 3;
        if (!Array.isArray(this.points) || this.points.length < minimumPointCount) {
            __GError__(this, 'overlay 중심을 이동하려면 먼저 올바른 도형을 지정해야 합니다.', '3741745');
            return undefined;
        }

        const sourcePoints = this.points.slice(0, TERRAIN_OVERLAY_SHADER.MAX_POINTS);
        if (!sourcePoints.every(isValidTerrainStampPoint)) {
            __GError__(this, 'overlay point에 올바르지 않은 월드 좌표가 있습니다.', '3742019');
            return undefined;
        }

        const currentCenter = sourcePoints.reduce(function (result, point) {
            result.x += point.x;
            result.y += point.y;
            result.z += point.z ?? 0;
            return result;
        }, new Vector3()).multiplyScalar(1 / sourcePoints.length);
        const offset = new Vector3(
            center.x - currentCenter.x,
            center.y - currentCenter.y,
            (center.z ?? 0) - currentCenter.z
        );

        this.points = this.points.map(function (point) {
            const movedPoint = cloneTerrainStampValue(point);
            movedPoint.x = point.x + offset.x;
            movedPoint.y = point.y + offset.y;
            movedPoint.z = (point.z ?? 0) + offset.z;
            return movedPoint;
        });
        this.#syncRegistry();
        return this;
    }

    /**
     * 현재 도형의 중심을 복사해 반환합니다.
     *
     * 원은 설정된 중심을 반환하고, 다각형과 선은 화면에 사용되는 점(앞에서부터 최대 16개)의 산술 평균을 반환합니다.<br>
     * 반환된 값을 바꿔도 이 도장에는 반영되지 않습니다.
     *
     * @returns {import('three').Vector3|undefined} 현재 도형 중심의 복사본이며, 유효한 도형이 없으면 undefined입니다.
     */
    getCenter() {
        if (this.type === 'circle') {
            return isValidTerrainStampPoint(this.center)
                ? new Vector3(this.center.x, this.center.y, this.center.z ?? 0)
                : undefined;
        }

        const minimumPointCount = this.type === 'polyline' ? 2 : 3;
        if (!Array.isArray(this.points) || this.points.length < minimumPointCount) {
            return undefined;
        }

        const sourcePoints = this.points.slice(0, TERRAIN_OVERLAY_SHADER.MAX_POINTS);
        if (!sourcePoints.every(isValidTerrainStampPoint)) {
            return undefined;
        }

        return sourcePoints.reduce(function (result, point) {
            result.x += point.x;
            result.y += point.y;
            result.z += point.z ?? 0;
            return result;
        }, new Vector3()).multiplyScalar(1 / sourcePoints.length);
    }

    /**
     * 원의 중심과 반지름을 바꿉니다.
     *
     * 다각형이나 선이던 도장에 호출하면 원으로 바뀌면서 점 목록이 지워집니다.<br>
     * 색·불투명도·이미지 같은 표현 값은 그대로 둡니다.<br>
     * 올바르지 않은 입력이면 오류 메시지를 남기고 기존 도형을 그대로 유지합니다.
     *
     * @param {import('three').Vector3|UTerrainStampPointLike} center 원의 중심이며 월드 좌표(EPSG:3857)입니다.
     * @param {number} radius 원의 반지름이며 단위는 미터이고 0보다 커야 합니다.
     * @returns {UTerrainStamp|undefined} 바뀌었으면 이 도장 자신을, 입력이 올바르지 않아 아무 것도 바뀌지 않았으면 undefined를 반환합니다.
     */
    setCircle(center, radius) {
        if (!this.#setCircleShape(center, radius)) {
            __GError__(this, 'circle overlay는 center와 양수 radius가 필요합니다.', '3744728');
            return undefined;
        }

        this.#syncRegistry();
        return this;
    }

    /**
     * 현재 원 도형의 중심과 반지름을 복사해 반환합니다.
     *
     * 반환된 값을 바꿔도 이 도장에는 반영되지 않습니다.
     *
     * @returns {UTerrainStampCircleValue|undefined} 원 도형 값의 복사본이며, 원이 아니거나 중심·반지름이 정해지지 않았으면 undefined입니다.
     */
    getCircle() {
        if (this.type !== 'circle' || !defined(this.center) || !defined(this.radius)) {
            return undefined;
        }

        return {
            center: cloneTerrainStampValue(this.center),
            radius: this.radius,
        };
    }

    /**
     * 도형과 표현을 한 번에 바꿉니다.
     *
     * setPoints()와 setStyle()을 잇달아 호출하면 화면 갱신 준비가 그만큼 여러 번 일어나므로, 매 프레임 움직이는 도장에서는 이 메서드로 한 번에 바꾸십시오.<br>
     * 전달한 키만 바뀌고 나머지 값은 그대로 유지됩니다.<br>
     * 도형 변경이 실패하면 오류 메시지를 남기고 표현 값도 반영하지 않은 채 끝납니다.
     *
     * @param {object} [opt] 바꿀 값만 담은 옵션입니다.
     * @param {'polygon'|'circle'|'polyline'} [opt.type] points를 다각형 꼭짓점으로 볼지 선 경유점으로 볼지 정하며, 생략하면 현재 도형 종류를 따릅니다.<br>
     * points와 함께 넘겨야 반영되고, 혼자 넘기면 아무 것도 바뀌지 않습니다.
     * @param {Array<import('three').Vector3|import('@union3d/helpers/UTerrainStamp').UTerrainStampPointLike>} [opt.points] 다각형의 꼭짓점 또는 선의 경유점 목록이며 월드 좌표(EPSG:3857)입니다.
     * @param {import('three').Vector3|import('@union3d/helpers/UTerrainStamp').UTerrainStampPointLike} [opt.center] 원의 중심이며 월드 좌표(EPSG:3857)입니다.
     * @param {number} [opt.radius] 원의 반지름이며 단위는 미터입니다.
     * @param {string|number|import('three').Color} [opt.color] 도장을 채울 색입니다.
     * @param {number} [opt.opacity] 색으로 채울 때의 불투명도입니다.
     * @param {string|number|import('three').Color} [opt.gradientColor] 그러데이션(gradient)의 끝 색입니다.
     * @param {'vertical'|'horizontal'} [opt.gradientDirection] 그러데이션이 이어지는 방향입니다.
     * @param {string} [opt.texture] 도장 영역에 입힐 이미지 주소입니다.
     * @param {number} [opt.textureOpacity] 이미지로 채울 때의 불투명도입니다.
     * @param {boolean} [opt.textureUseAlpha] 이미지 자체의 투명한 부분을 그대로 비칠지 여부입니다.
     * @param {number} [opt.textureScale] 이미지를 배치할 사각 영역의 배율입니다.
     * @param {'stretch'|'contain'} [opt.textureFit] 이미지를 도장 영역에 맞추는 방식입니다.
     * @param {Array<import('three').Vector3|import('@union3d/helpers/UTerrainStamp').UTerrainStampPointLike>|null} [opt.mappingFrame] 이미지와 그러데이션이 기준으로 삼을 별도의 사각 영역이며, null이나 점이 3개 미만이면 기준 영역을 해제합니다.
     * @param {boolean} [opt.expectTexture] 합성 대상 채움의 알파를 1로 취급할지 여부이며, 이미지 준비 전의 투명 대기에는 영향을 주지 않습니다.
     * @param {number} [opt.lineWidth] 선 도형의 두께입니다.
     * @param {'meters'|'pixels'} [opt.lineWidthUnits] 선 두께를 지상 거리로 볼지 화면 픽셀로 볼지 정합니다.
     * @param {import('@U3dLayer').U3dLayer} [opt.targetLayer] 가림 대상으로 삼을 영상 레이어입니다.
     * @param {string|number} [opt.mode] 채울지 가릴지 정하며 fill 또는 mask를 넣고, 그 밖의 값은 생략한 것과 같이 처리됩니다.
     * @param {number} [opt.renderOrder] 다른 도장과 겹칠 때 그리는 순서이며 값이 클수록 위에 그려집니다.
     * @returns {this|undefined} 바뀌었으면 이 도장 자신을, 도형 입력이 올바르지 않으면 undefined를 반환합니다.
     */
    update(opt = {}) {
        if (opt.points !== undefined) {
            const isPolyline = opt.type === 'polyline' || (opt.type === undefined && this.type === 'polyline');
            const shapeUpdated = isPolyline
                ? this.#setPolylinePoints(opt.points, opt.lineWidth ?? this.lineWidth)
                : this.#setPolygonPoints(opt.points);
            if (!shapeUpdated) {
                __GError__(this, isPolyline
                    ? 'polyline overlay는 최소 2개의 point와 양수 lineWidth가 필요합니다.'
                    : 'polygon overlay는 최소 3개의 point가 필요합니다.', '3748124');
                return undefined;
            }
        }

        if ((opt.center !== undefined || opt.radius !== undefined) && !this.#setCircleShape(opt.center, opt.radius)) {
            __GError__(this, 'circle overlay는 center와 양수 radius가 필요합니다.', '3748394');
            return undefined;
        }

        this.#applyStyle(opt);
        this.#syncRegistry();
        return this;
    }

    /**
     * 도형은 그대로 두고 표현 값만 한 번에 바꿉니다.
     *
     * 전달한 키만 바뀌며, 점 목록이나 중심·반지름 같은 도형 값은 여기서 받지 않습니다.<br>
     * 표현 값을 여러 개 바꿔야 하면 setColor()나 setTexture()를 잇달아 부르는 대신 이 메서드를 사용하십시오.
     *
     * @param {object} [style] 바꿀 표현 값만 담은 객체이며, 받는 키는 update()의 표현 관련 키와 같습니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setStyle(style = {}) {
        this.#applyStyle(style);
        this.#syncRegistry();
        return this;
    }

    /**
     * 현재 표현 값을 한데 모은 새 객체로 반환합니다.
     *
     * 색과 기준 사각 영역은 복사되므로 반환값을 바꿔도 이 도장에는 반영되지 않습니다.<br>
     * 그대로 setStyle()에 넘겨 다른 도장에 같은 표현을 적용할 수 있습니다.
     *
     * @returns {{color: string|number|import('three').Color, opacity: number, gradientColor: string|number|import('three').Color|undefined, gradientDirection: 'vertical'|'horizontal', texture: string|undefined, textureOpacity: number|undefined, textureUseAlpha: boolean|undefined, textureScale: number|undefined, textureFit: 'stretch'|'contain', mappingFrame: Array<import('three').Vector3>|undefined, expectTexture: boolean, lineWidth: number, lineWidthUnits: 'meters'|'pixels', renderOrder: number}} 현재 표현 값을 담은 새 객체입니다.
     */
    getStyle() {
        return {
            color: cloneTerrainStampValue(this.color),
            opacity: this.opacity,
            gradientColor: cloneTerrainStampValue(this.gradientColor),
            gradientDirection: this.gradientDirection,
            texture: this.texture,
            textureOpacity: this.textureOpacity,
            textureUseAlpha: this.textureUseAlpha,
            textureScale: this.textureScale,
            textureFit: this.textureFit,
            mappingFrame: cloneTerrainStampMappingFrame(this.mappingFrame),
            expectTexture: this.expectTexture,
            lineWidth: this.lineWidth,
            lineWidthUnits: this.lineWidthUnits,
            renderOrder: this.renderOrder,
        };
    }

    /**
     * 현재 도형·표현·표시 상태를 JSON으로 저장할 수 있는 새 객체로 반환합니다.
     *
     * 점은 {x, y, z} 일반 객체로, 색은 '#rrggbb' 문자열로, 가림 대상 레이어는 레이어 이름으로 바꿔 담으므로 JSON.stringify()로 그대로 문자열이 됩니다.<br>
     * 값이 정해지지 않은 항목(도형이 없는 도장의 type, 쓰지 않는 그러데이션·이미지·mappingFrame, 자동 결정 상태의 mode, 지정하지 않은 targetLayer)은 키를 넣지 않습니다.<br>
     * app과의 연결은 담지 않으며, 반환값을 바꿔도 이 도장에는 반영되지 않습니다.<br>
     * 반환값은 setParam()이나 UTerrainStamp.fromParam()에 그대로 넘겨 같은 도장을 되살릴 수 있습니다.
     *
     * @returns {UTerrainStampParam} 현재 상태를 담은 새 객체입니다.
     */
    getParam() {
        /** @type {UTerrainStampParam} */
        const param = {};

        if (defined(this.type)) {
            param.type = this.type;
        }
        if (Array.isArray(this.points)) {
            param.points = this.points.map(serializeTerrainStampPoint);
        }
        if (this.type === 'circle' && defined(this.center)) {
            param.center = serializeTerrainStampPoint(this.center);
        }
        if (this.type === 'circle' && defined(this.radius)) {
            param.radius = this.radius;
        }

        param.color = serializeTerrainStampColor(this.color ?? DEFAULT_COLOR);
        param.opacity = this.opacity;
        if (defined(this.gradientColor)) {
            param.gradientColor = serializeTerrainStampColor(this.gradientColor);
        }
        param.gradientDirection = this.gradientDirection;
        if (typeof this.texture === 'string' && this.texture) {
            param.texture = this.texture;
        }
        if (defined(this.textureOpacity)) {
            param.textureOpacity = this.textureOpacity;
        }
        if (defined(this.textureUseAlpha)) {
            param.textureUseAlpha = this.textureUseAlpha;
        }
        if (defined(this.textureScale)) {
            param.textureScale = this.textureScale;
        }
        param.textureFit = this.textureFit;
        if (Array.isArray(this.mappingFrame)) {
            param.mappingFrame = this.mappingFrame.map(serializeTerrainStampPoint);
        }
        param.expectTexture = this.expectTexture === true;
        param.lineWidth = this.lineWidth;
        param.lineWidthUnits = this.lineWidthUnits;

        const modeName = getTerrainStampModeName(this.mode);
        if (defined(modeName)) {
            param.mode = modeName;
        }
        const targetLayerName = getTerrainStampLayerName(this.targetLayer);
        if (defined(targetLayerName)) {
            param.targetLayer = targetLayerName;
        }

        param.visible = this.visible === true;
        param.maxStampsPerTile = this.maxStampsPerTile;
        param.renderOrder = this.renderOrder;
        return param;
    }

    /**
     * getParam()이 돌려준 형식의 값을 한 번에 반영합니다.
     *
     * 전달한 키만 바뀌고 나머지 값은 그대로 유지되며, 도형·표현·표시 여부를 모두 바꿔도 화면 갱신 준비는 한 번만 일어납니다.<br>
     * targetLayer는 레이어 이름 문자열 또는 레이어 객체로 받으며, 이름이면 options.layerResolver, options.app, setApp()으로 지정한 app 순서로 찾습니다.<br>
     * 이름에 해당하는 레이어를 찾지 못하면 경고를 남기고 그 항목만 건너뛰며, null을 넘기면 대상 지정을 해제합니다.<br>
     * 도형 값이 올바르지 않으면 오류 메시지를 남기고 아무 것도 바꾸지 않은 채 undefined를 반환합니다.<br>
     * 객체가 아닌 값(JSON 문자열 포함)은 받지 않으므로 문자열은 JSON.parse()로 먼저 객체로 바꿔 넘기십시오.
     *
     * @param {UTerrainStampParamInput} param 반영할 값이며 getParam()의 반환 형식과 같습니다.
     * @param {UTerrainStampSetParamOption} [options] 레이어 이름을 찾을 때 쓰는 옵션입니다.
     * @returns {UTerrainStamp|undefined} 반영되었으면 이 도장 자신을, 입력이 올바르지 않아 아무 것도 바뀌지 않았으면 undefined를 반환합니다.
     */
    setParam(param, options = {}) {
        if (!param || typeof param !== 'object' || Array.isArray(param)) {
            __GError__(this, 'setParam은 getParam()이 돌려준 형식의 객체가 필요합니다.', '3754145');
            return undefined;
        }

        const {targetLayer, visible, maxStampsPerTile, ...updateOption} = param;
        const previousVisible = this.visible;
        const previousMaxStampsPerTile = this.maxStampsPerTile;
        const previousTargetLayer = this.targetLayer;

        // targetLayer는 이름 문자열로 저장되므로 레이어 객체로 되돌려 update()에 넘깁니다.
        // update()의 #applyStyle은 undefined를 "전달 안 함"으로 보므로 해제(null)는 프로퍼티를 직접 지웁니다.
        if (targetLayer === null) {
            this.targetLayer = undefined;
        } else if (targetLayer !== undefined) {
            const layer = resolveTerrainStampParamLayer(targetLayer, options.app ?? this.#app, options.layerResolver);
            if (defined(layer)) {
                updateOption.targetLayer = layer;
            } else {
                __GWarn__(this, `targetLayer '${String(targetLayer)}'에 해당하는 레이어를 찾지 못해 대상 레이어는 바꾸지 않습니다.`, '3755070');
            }
        }

        // visible/maxStampsPerTile은 setter를 거치지 않고 프로퍼티만 바꿔 update()의 registry 동기화 한 번에 함께 반영합니다.
        if (visible !== undefined) {
            this.visible = visible === true;
        }
        if (maxStampsPerTile !== undefined) {
            this.maxStampsPerTile = maxStampsPerTile;
        }

        if (!this.update(updateOption)) {
            // 도형 반영이 실패하면 update()와 같은 계약으로 아무 것도 바뀌지 않은 상태를 유지합니다.
            this.visible = previousVisible;
            this.maxStampsPerTile = previousMaxStampsPerTile;
            this.targetLayer = previousTargetLayer;
            return undefined;
        }
        return this;
    }

    /**
     * JSON.stringify()가 이 도장을 문자열로 바꿀 때 쓰는 값을 반환합니다.
     *
     * getParam()과 같은 값을 돌려주므로 JSON.stringify(stamp) 또는 도장 배열을 그대로 문자열로 저장할 수 있습니다.
     *
     * @returns {UTerrainStampParam} getParam()이 돌려주는 현재 상태 객체입니다.
     */
    toJSON() {
        return this.getParam();
    }

    /**
     * 도장을 채울 색을 바꿉니다.
     *
     * 이미지가 지정되지 않은 도장에서 사용하는 색이며, 이미지 로딩 중에는 이 색이 표시되지 않습니다.
     *
     * @param {string|number|import('three').Color} color 채울 색이며 CSS 색 문자열, 24비트 정수 또는 three.js Color로 지정합니다.
     * @returns {this} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setColor(color) {
        this.color = color;
        this.#syncRegistry();
        return this;
    }

    /**
     * 현재 채울 색을 복사해 반환합니다.
     *
     * @returns {string|number|import('three').Color} 설정된 색이며, three.js Color로 설정했으면 복사본을 반환합니다.
     */
    getColor() {
        return cloneTerrainStampValue(this.color);
    }

    /**
     * 색으로 채울 때의 불투명도를 바꿉니다.
     *
     * 이미지를 쓰는 도장에서는 setTextureOpacity()로 정한 값이 대신 적용되므로 이 값은 보이지 않습니다.
     *
     * @param {number} opacity 불투명도이며 0이면 완전히 투명하고 1이면 불투명합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setOpacity(opacity) {
        this.opacity = opacity;
        this.#syncRegistry();
        return this;
    }

    /**
     * 색으로 채울 때의 현재 불투명도를 반환합니다.
     *
     * @returns {number} 설정된 불투명도이며 기본값은 1입니다.
     */
    getOpacity() {
        return this.opacity;
    }

    /**
     * 끝 색을 지정해 도장을 그러데이션(gradient)으로 채웁니다.
     *
     * setColor()로 정한 색에서 여기 지정한 색으로 이어지게 채웁니다.<br>
     * 그러데이션을 없애려면 clearGradient()를 사용하십시오.
     *
     * @param {string|number|import('three').Color} color 그러데이션의 끝 색입니다.
     * @param {'vertical'|'horizontal'} [direction] 그러데이션이 이어지는 방향이며, 생략하면 현재 방향을 그대로 쓰고 허용하지 않는 값은 vertical로 바뀝니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setGradient(color, direction = this.gradientDirection) {
        this.gradientColor = color;
        this.gradientDirection = resolveTerrainStampGradientDirection(direction);
        this.#syncRegistry();
        return this;
    }

    /**
     * 그러데이션(gradient)의 끝 색을 복사해 반환합니다.
     *
     * @returns {string|number|import('three').Color|undefined} 설정된 끝 색이며, 그러데이션을 쓰지 않으면 undefined입니다.
     */
    getGradientColor() {
        return cloneTerrainStampValue(this.gradientColor);
    }

    /**
     * 그러데이션(gradient)이 이어지는 방향을 바꿉니다.
     *
     * @param {'vertical'|'horizontal'} direction 이어지는 방향이며, 허용하지 않는 값은 vertical로 바뀝니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setGradientDirection(direction) {
        this.gradientDirection = resolveTerrainStampGradientDirection(direction);
        this.#syncRegistry();
        return this;
    }

    /**
     * 그러데이션(gradient)이 이어지는 현재 방향을 반환합니다.
     *
     * @returns {'vertical'|'horizontal'} 설정된 방향이며 기본값은 vertical입니다.
     */
    getGradientDirection() {
        return this.gradientDirection;
    }

    /**
     * 그러데이션(gradient)을 없애고 단일 색으로 채우도록 되돌립니다.
     *
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    clearGradient() {
        this.gradientColor = undefined;
        this.#syncRegistry();
        return this;
    }

    /**
     * 도장 영역에 입힐 이미지 주소를 바꿉니다.
     *
     * 이미지는 준비가 끝난 뒤에 화면에 나타나며, 그때까지는 opacity와 관계없이 투명하게 기다립니다.<br>
     * 이미지를 가져오지 못했거나 서로 다른 이미지 주소가 보관소의 최대 개수를 넘으면 경고를 남기고 투명한 상태를 유지합니다.<br>
     * undefined를 넘기면 이미지만 떼어 내고 불투명도·투명 반영·배율·맞춤 방식은 이전 값이 남으므로, 이 값들까지 초기값으로 되돌리려면 clearTexture()를 사용하십시오.
     *
     * @param {string|undefined} texture 입힐 이미지 주소이며, undefined이면 이미지를 쓰지 않고 색으로 채웁니다.
     * @param {object} [options] 이미지 표현을 함께 바꿀 때 쓰는 값이며, 전달한 키만 반영됩니다.
     * @param {number} [options.textureOpacity] 이미지로 채울 때의 불투명도입니다.
     * @param {boolean} [options.textureUseAlpha] 이미지 자체의 투명한 부분을 그대로 비칠지 여부입니다.
     * @param {number} [options.textureScale] 이미지를 배치할 사각 영역을 중심 기준으로 넓히거나 좁히는 배율입니다.
     * @param {'stretch'|'contain'} [options.textureFit] 이미지를 도장 영역에 맞추는 방식이며, 허용하지 않는 값은 stretch로 바뀝니다.
     * @returns {this} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTexture(texture, options = {}) {
        this.texture = texture;
        if (options.textureOpacity !== undefined) {
            this.textureOpacity = options.textureOpacity;
        }
        if (options.textureUseAlpha !== undefined) {
            this.textureUseAlpha = options.textureUseAlpha;
        }
        if (options.textureScale !== undefined) {
            this.textureScale = options.textureScale;
        }
        if (options.textureFit !== undefined) {
            this.textureFit = resolveTerrainStampTextureFit(options.textureFit);
        }
        this.#syncRegistry();
        return this;
    }

    /**
     * 현재 입혀 둔 이미지 주소를 반환합니다.
     *
     * @returns {string|undefined} 설정된 이미지 주소이며, 이미지를 쓰지 않으면 undefined입니다.
     */
    getTexture() {
        return this.texture;
    }

    /**
     * 이미지 설정을 모두 지우고 색으로 채우도록 되돌립니다.
     *
     * 이미지 주소와 함께 불투명도·투명 반영·배율 설정도 지워지고, 맞춤 방식은 stretch로 돌아갑니다.<br>
     * 같은 이미지를 다시 지정하면 이미 내려받아 둔 이미지를 그대로 쓰므로 기다리지 않고 나타납니다.
     *
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    clearTexture() {
        this.texture = undefined;
        this.textureOpacity = undefined;
        this.textureUseAlpha = undefined;
        this.textureScale = undefined;
        this.textureFit = TERRAIN_STAMP_TEXTURE_FIT_STRETCH;
        this.#syncRegistry();
        return this;
    }

    /**
     * 이미지로 채울 때의 불투명도를 바꿉니다.
     *
     * 이미지 자체의 투명한 부분을 비추도록 설정되어 있으면 여기서 정한 값과 이미지의 투명도가 함께 반영됩니다.
     *
     * @param {number} opacity 불투명도이며, 화면에 반영될 때 0 이상 1 이하로 제한되고 숫자가 아니면 색 불투명도를 대신 사용합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTextureOpacity(opacity) {
        this.textureOpacity = opacity;
        this.#syncRegistry();
        return this;
    }

    /**
     * 이미지로 채울 때의 현재 불투명도를 반환합니다.
     *
     * @returns {number|undefined} 설정된 불투명도이며, 정한 적이 없거나 clearTexture()로 지웠으면 undefined입니다.
     */
    getTextureOpacity() {
        return this.textureOpacity;
    }

    /**
     * 이미지 자체의 투명한 부분을 그대로 비칠지 여부를 바꿉니다.
     *
     * true이면 PNG처럼 이미지에 들어 있는 투명한 영역이 지형을 그대로 드러냅니다.<br>
     * false이면 이미지의 투명도를 무시하고 도장 영역 전체를 균일한 불투명도로 덮습니다.
     *
     * @param {boolean} useAlpha 이미지의 투명한 부분을 반영할지 여부이며, false가 아닌 값은 모두 반영하는 것으로 처리됩니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTextureUseAlpha(useAlpha) {
        this.textureUseAlpha = useAlpha;
        this.#syncRegistry();
        return this;
    }

    /**
     * 이미지 자체의 투명한 부분을 그대로 비치도록 설정되어 있는지 반환합니다.
     *
     * @returns {boolean|undefined} 설정된 값이며, 정한 적이 없거나 clearTexture()로 지웠으면 undefined입니다.
     */
    getTextureUseAlpha() {
        return this.textureUseAlpha;
    }

    /**
     * 이미지를 배치할 사각 영역을 중심 기준으로 넓히거나 좁힙니다.
     *
     * 1이면 도형을 감싸는 사각 영역을 그대로 쓰고, 1보다 크면 같은 이미지가 더 넓은 영역에 걸쳐 크게 보입니다.<br>
     * 이미지가 도장 영역 밖으로 나간 부분은 보이지 않으므로, 값을 키우면 이미지의 가운데 부분만 남습니다.
     *
     * @param {number} scale 사각 영역의 배율이며, 0 이하이거나 숫자가 아니면 1을 사용합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTextureScale(scale) {
        this.textureScale = scale;
        this.#syncRegistry();
        return this;
    }

    /**
     * 이미지를 배치할 사각 영역의 현재 배율을 반환합니다.
     *
     * @returns {number|undefined} 설정된 배율이며, 정한 적이 없거나 clearTexture()로 지웠으면 undefined입니다.
     */
    getTextureScale() {
        return this.textureScale;
    }

    /**
     * 이미지를 도장 영역에 맞추는 방식을 바꿉니다.
     *
     * stretch는 도형을 감싸는 사각 영역에 이미지를 늘려 채우므로, 도형이 사각형이 아니면 이미지의 바깥쪽이 도형 밖으로 나가 보이지 않습니다.<br>
     * contain은 이미지 네 귀퉁이를 도형의 꼭짓점에 맞춰 기울여 넣으므로 이미지 전체가 도형 안에 들어갑니다.<br>
     * contain은 이미지를 쓰는 꼭짓점 4개짜리 다각형에서만 적용되고, 그 밖의 도형에서는 stretch처럼 동작합니다.
     *
     * @param {'stretch'|'contain'} fit 맞추는 방식이며, 허용하지 않는 값은 stretch로 바뀝니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTextureFit(fit) {
        this.textureFit = resolveTerrainStampTextureFit(fit);
        this.#syncRegistry();
        return this;
    }

    /**
     * 이미지를 도장 영역에 맞추는 현재 방식을 반환합니다.
     *
     * @returns {'stretch'|'contain'} 설정된 방식이며 기본값은 stretch입니다.
     */
    getTextureFit() {
        return this.textureFit;
    }

    /**
     * 지형 타일 하나가 검사할 도장 개수의 상한을 바꿉니다.
     *
     * 이 값은 도장 하나가 아니라 이 도장이 적용된 영상 레이어 전체에 적용되므로, 같은 레이어의 도장이 서로 다른 값을 넣으면 마지막으로 반영된 값이 남습니다.<br>
     * 한 타일에 겹치는 도장이 상한을 넘으면 타일 중심에서 가까운 도장부터 남기고 나머지는 그 타일에서 그려지지 않습니다.
     * 단색 내부 합성도 정밀 출력과 동일한 타일 후보 및 상한을 적용합니다.
     *
     * @param {number} value 타일 하나가 검사할 도장 개수의 상한이며 소수점 아래는 버립니다.<br>
     * 128을 넘으면 128로 줄이고, 0 이하이거나 숫자가 아니면 기본값인 128을 사용합니다.
     * @returns {this} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setMaxStampsPerTile(value) {
        this.maxStampsPerTile = value;
        this.#syncRegistry();
        return this;
    }

    /**
     * 지형 타일 하나가 한 번에 검사할 도장 개수의 상한으로 이 도장이 지정한 값을 반환합니다.
     *
     * @returns {number} 이 도장에 설정된 값이며 기본값은 128입니다.
     */
    getMaxStampsPerTile() {
        return this.maxStampsPerTile;
    }

    /**
     * 다른 도장과 겹칠 때 그리는 순서를 바꿉니다.
     *
     * 값이 클수록 나중에 그려져 위에 보이고, 값이 같으면 먼저 만든 도장이 아래에 그려집니다.<br>
     * 위에 있는 도장이 불투명하면 그 아래 도장은 가려지며, 가림(mask) 도장도 그 위의 불투명한 도장 뒤에 놓이면 적용되지 않으므로 필요하면 가림 도장에 큰 값을 주십시오.<br>
     * 가림 도장은 targetLayer가 있어도 그 레이어와 아래 레이어에서 자기보다 낮은 순서의 도장을 영역 안에서 숨기므로, 순서가 높은 가림 도장은 다른 레이어의 채움 위에도 "위"로 보입니다.<br>
     * 같은 영상 레이어에 등록된 도장끼리만 순서를 비교하며, 도장의 값을 갱신해도 순서는 바뀌지 않습니다.
     *
     * @param {number} value 그리는 순서이며 숫자가 아니면 0을 사용합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setRenderOrder(value) {
        this.renderOrder = resolveTerrainStampRenderOrder(value);
        this.#syncRegistry();
        return this;
    }

    /**
     * 다른 도장과 겹칠 때 그리는 현재 순서를 반환합니다.
     *
     * @returns {number} 설정된 순서이며 기본값은 0입니다.
     */
    getRenderOrder() {
        return this.renderOrder;
    }

    /**
     * 이 도장을 지형에 표시할지 여부를 바꿉니다.
     *
     * false이면 지형에서 사라지고, true로 되돌리면 지금까지의 도형과 표현 값 그대로 다시 나타납니다.<br>
     * true로 바꾸더라도 유효한 도형이 없거나 setApp()으로 지정한 app에서 적용 대상 영상 레이어를 찾지 못하면 화면에 나타나지 않습니다.
     *
     * @param {boolean} visible 표시할지 여부이며, true가 아닌 값은 모두 표시하지 않는 것으로 처리됩니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setVisible(visible) {
        this.visible = visible === true;
        this.#syncRegistry();
        return this;
    }

    /**
     * 이 도장을 지형에 표시하도록 설정되어 있는지 반환합니다.
     *
     * @returns {boolean} 표시 대상이면 true이며 기본값은 false입니다.
     */
    getVisible() {
        return this.visible;
    }

    /**
     * 이 도장을 지형에서 숨깁니다.
     *
     * 도형과 표현 값은 그대로 남으므로 setVisible(true)로 다시 표시할 수 있습니다.<br>
     * setVisible(false)와 결과가 같으며, 다시 쓰지 않을 도장은 dispose()로 정리하십시오.
     *
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    clear() {
        this.visible = false;
        this.#unregisterTerrainOverlay(true);
        return this;
    }

    /**
     * 이 도장을 지형에서 제거하고 다시 쓸 수 없는 상태로 만듭니다.
     *
     * app과의 연결도 함께 끊어집니다.<br>
     * 이후 값을 바꾸는 메서드를 호출해도 오류 없이 무시되며 지형에 다시 나타나지 않으므로, 같은 도형을 다시 쓰려면 새 인스턴스를 만드십시오.<br>
     * 여러 도장이 함께 쓰는 이미지는 해제되지 않고 남습니다.
     */
    dispose() {
        this.clear();
        unregisterTerrainStampApp(this.#app, this);
        this.#app = undefined;
        this.#registeredCache = undefined;
        this.#registeredSearchLayers = undefined;
        this.#disposed = true;
    }

    /**
     * public setter들이 호출될 때마다 내부 registry 상태를 동기화합니다.
     * 도형 정보가 불완전하면 #registerTerrainOverlay가 registry에 넣지 않습니다.
     */
    #syncRegistry() {
        if (this.#helperBatch && !this.#helperBatch.committing) {
            this.#helperBatch.pending.delete(this);
            this.#helperBatch.pending.add(this);
            return;
        }
        if (this.#disposed) {
            return;
        }

        if (!this.visible) {
            this.#unregisterTerrainOverlay(true);
            return;
        }

        this.#registerTerrainOverlay();
    }

    #refreshSearchLayers(sortedLayers = undefined) {
        const searchLayers = getSearchLayers(this.#app, getTerrainStampSearchTargetLayer(this), sortedLayers);
        if (isSameTerrainStampLayerList(this.#searchLayers, searchLayers)) {
            return false;
        }

        this.#unregisterTerrainOverlay(true);
        this.#searchLayers = searchLayers;
        this.#syncRegistry();
        return true;
    }

    #applyStyle(style = {}) {
        if (style.color !== undefined) {
            this.color = style.color;
        }
        if (style.opacity !== undefined) {
            this.opacity = style.opacity;
        }
        if (style.gradientColor !== undefined) {
            this.gradientColor = style.gradientColor;
        }
        if (style.gradientDirection !== undefined) {
            this.gradientDirection = resolveTerrainStampGradientDirection(style.gradientDirection);
        }
        if (style.texture !== undefined) {
            this.texture = style.texture;
        }
        if (style.textureOpacity !== undefined) {
            this.textureOpacity = style.textureOpacity;
        }
        if (style.textureUseAlpha !== undefined) {
            this.textureUseAlpha = style.textureUseAlpha;
        }
        if (style.textureScale !== undefined) {
            this.textureScale = style.textureScale;
        }
        if (style.textureFit !== undefined) {
            this.textureFit = resolveTerrainStampTextureFit(style.textureFit);
        }
        if (style.mappingFrame !== undefined) {
            this.mappingFrame = normalizeTerrainStampMappingFrame(style.mappingFrame);
        }
        if (style.expectTexture !== undefined) {
            this.expectTexture = style.expectTexture === true;
        }
        if (style.targetLayer !== undefined) {
            this.targetLayer = style.targetLayer;
        }
        if (style.mode !== undefined) {
            this.mode = resolveTerrainStampMode(style.mode);
        }
        if (style.lineWidth !== undefined) {
            this.lineWidth = getPositiveTerrainStampNumber(style.lineWidth, this.lineWidth ?? 1);
        }
        if (style.lineWidthUnits !== undefined) {
            this.lineWidthUnits = resolveTerrainStampLineWidthUnits(style.lineWidthUnits);
        }
        if (style.renderOrder !== undefined) {
            this.renderOrder = resolveTerrainStampRenderOrder(style.renderOrder);
        }
        if (!this.#helperBatch) this.#searchLayers = getSearchLayers(this.#app, getTerrainStampSearchTargetLayer(this));
    }

    /**
     * 현재 인스턴스 상태를 shader texture에 쓰기 쉬운 normalized overlay 데이터로 바꿔 registry에 저장합니다.
     * registry에는 public 인스턴스를 그대로 넣지 않고, point/color/texture 값을 복사/정규화한 객체를 넣습니다.
     * 이렇게 해야 호출부가 전달한 Vector3나 Color를 나중에 변경하더라도 이미 등록된 overlay row가 예기치 않게 흔들리지 않습니다.
     * 정규화 결과와 검색 layer가 같으면 기존 등록을 유지하고, layer별 mode/order 변경만 다시 반영합니다.
     * 내용이 같은 update는 metadata를 dirty 처리하지 않지만 공유 maxStampsPerTile의 마지막 지정값은 계속 반영합니다.
     */
    #registerTerrainOverlay() {
        try {
            // 외부 입력을 바로 registry에 넣지 않고, shader texture에 쓰기 쉬운 내부 구조로 정규화합니다.
            // 유효하지 않은 polygon/circle이면 stamp cache 생성이 실패하므로 기존 registry 상태를 유지하지 않습니다.
            const stampCache = this.type === 'circle'
                ? this.#createCircleStampCache()
                : this.type === 'polyline'
                    ? this.#createPolylineStampCache()
                    : this.#createPolygonStampCache();
            if (!defined(stampCache)) {
                this.#unregisterTerrainOverlay(true);
                return;
            }

            const unchanged = this.#registeredSearchLayers?.length === this.#searchLayers.length
                && this.#searchLayers.every((layer, i) => layer === this.#registeredSearchLayers[i])
                && INTERNAL.areStampCachesEqual(this.#registeredCache, stampCache);
            if (!unchanged) this.#unregisterTerrainOverlay();
            this.#registeredCache = unchanged ? this.#registeredCache : stampCache;
            this.#registeredSearchLayers = this.#searchLayers;

            for (const layer of this.#searchLayers) {
                // 가림 도장은 target 레이어와 그 아래에도 가림 전용(occlude) 모드로 등록되므로 여기서 target 레이어를 건너뛰지 않습니다.
                const mode = getTerrainStampLayerMode(this, layer);
                if (!defined(mode)) {
                    // 대상 레이어의 순서만 바뀌어도 적용 자격은 달라질 수 있다.
                    const state = getTerrainStampState(layer, false);
                    if (state?.cacheByStamp.delete(this)) {
                        this.#helperBatch?.states.add(state);
                        state.textureDirty = true;
                        updateTerrainStampRenderBindingCount(state);
                    }
                    continue;
                }

                // 실제로 stamp를 출력할 layer만 state를 만듭니다.
                // 제외 layer까지 만들었다가 즉시 해제하면 이동 update마다 불필요한 texture 생성·해제가 생깁니다.
                const state = getTerrainStampState(layer, true);
                if (!state) {
                    continue;
                }
                this.#helperBatch?.states.add(state);

                const previous = state.cacheByStamp.get(this);
                if (!unchanged || !previous || previous.mode !== mode
                    || previous.targetLayer !== this.targetLayer || previous.renderOrder !== this.renderOrder) {
                    state.cacheByStamp.set(this, {
                        ...this.#registeredCache,
                        mode,
                        owner: this,
                        targetLayer: this.targetLayer,
                        renderOrder: this.renderOrder,
                        creationId: this.#creationId,
                    });
                    updateTerrainStampRenderBindingCount(state);
                    state.textureDirty = true;
                }
                // 상한은 stamp별 값이 아니라 레이어 공유 값이다. 동일 도형의 호출도 마지막 지정값을 반영한다.
                if (this.maxStampsPerTile !== undefined) {
                    setTerrainStampMaxStampsPerTile(state, this.maxStampsPerTile);
                }
            }
        } catch (error) {
            // 일부 새 레이어만 등록된 뒤 실패할 수도 있으므로 현재 등록 목록을
            // unregister가 읽기 전에 지우지 않습니다. 배치의 선택적 해제에도 필요합니다.
            this.#unregisterTerrainOverlay();
            throw error;
        } finally {
            // update({targetLayer, mode})로 검색 레이어가 바뀐 경우에도 이전 빈 state를 남기지 않습니다.
            if (!this.#helperBatch) releaseEmptyTerrainStampStates();
        }
    }

    /**
     * 현재 인스턴스를 registry에서 제거합니다.
     * clear(), dispose(), setVisible(false)에서 사용합니다.
     * 실제 삭제가 발생한 경우에만 dirty를 세워 다음 render에서 overlay texture를 다시 작성하게 합니다.
     */
    #unregisterTerrainOverlay(cleanupEmptyStates = false) {
        const batch = this.#helperBatch;
        if (batch && !batch.committing) {
            batch.pending.delete(this);
            batch.pending.add(this);
            return;
        }
        const registeredLayers = this.#registeredSearchLayers ?? batch?.registeredLayers.get(this);
        this.#registeredCache = undefined;
        this.#registeredSearchLayers = undefined;
        if (batch) {
            // Helper 소유 도장은 직전 등록 목록을 알고 있으므로 다른 앱의 전체 state를
            // 훑지 않습니다. 비어진 state의 마지막 자원 정리는 배치 끝에서 한 번 합니다.
            if (registeredLayers) {
                for (const layer of registeredLayers) {
                    const state = getTerrainStampState(layer, false);
                    if (state?.cacheByStamp.delete(this)) {
                        state.textureDirty = true;
                        updateTerrainStampRenderBindingCount(state);
                        batch.states.add(state);
                    }
                }
            }
            return;
        }
        const emptyStates = cleanupEmptyStates ? [] : undefined;
        for (const state of _terrainStampStates) {
            if (state.cacheByStamp.delete(this)) {
                state.textureDirty = true;
                updateTerrainStampRenderBindingCount(state);
            }
            if (cleanupEmptyStates && state.cacheByStamp.size === 0) {
                emptyStates.push(state);
            }
        }

        if (emptyStates) {
            for (const state of emptyStates) releaseTerrainStampState(state);
        }
    }

    /**
     * 생성자 옵션에서 도형 타입을 판별하고 해당 도형 프로퍼티를 초기화합니다.
     * 생성자는 모든 스타일 프로퍼티를 먼저 채운 뒤 이 메서드로 도형만 설정합니다.
     * true를 반환해야 registry 동기화를 진행합니다.
     */
    #setShape(opt = {}) {
        const type = defaultValue(opt.type, 'polygon');

        if (type === 'polygon') {
            return this.#setPolygonPoints(opt.points);
        }

        if (type === 'circle') {
            return this.#setCircleShape(opt.center, opt.radius);
        }

        if (type === 'polyline') {
            return this.#setPolylinePoints(opt.points, opt.lineWidth ?? this.lineWidth);
        }

        return false;
    }

    /**
     * polygon 도형 프로퍼티만 검증/설정합니다.
     * registry 동기화는 호출하지 않습니다.
     * 생성자와 public setPoints()가 같은 검증 로직을 공유하기 위한 내부 메서드입니다.
     */
    #setPolygonPoints(points) {
        if (!Array.isArray(points) || points.length < 3 || !points.every(isValidTerrainStampPoint)) {
            return false;
        }

        this.type = 'polygon';
        this.points = points;
        this.center = undefined;
        this.radius = undefined;
        return true;
    }

    #setPolylinePoints(points, lineWidth) {
        const numericLineWidth = getPositiveTerrainStampNumber(lineWidth, 0);
        if (!Array.isArray(points) || points.length < 2
            || !points.every(isValidTerrainStampPoint) || numericLineWidth <= 0) {
            return false;
        }

        this.type = 'polyline';
        this.points = points;
        this.lineWidth = numericLineWidth;
        this.center = undefined;
        this.radius = undefined;
        return true;
    }

    /**
     * circle 도형 프로퍼티만 검증/설정합니다.
     * radius는 Number로 변환해 보관합니다.
     * registry 동기화는 호출하지 않으므로 생성자와 public setCircle()에서 공통으로 사용할 수 있습니다.
     */
    #setCircleShape(center, radius) {
        const numericRadius = Number(radius);

        if (!isValidTerrainStampPoint(center) || !Number.isFinite(numericRadius) || numericRadius <= 0) {
            return false;
        }

        this.type = 'circle';
        this.center = center;
        this.radius = numericRadius;
        this.points = undefined;
        return true;
    }

    /**
     * 현재 polygon 인스턴스 상태를 shader DataTexture row에 쓰기 위한 plain object로 변환합니다.
     * 반환 객체의 points/color는 복사본입니다.
     * pointCount는 shader loop에서 사용할 실제 점 개수이며, MAX_POINTS를 넘는 입력은 여기서 잘립니다.
     */
    #createPolygonStampCache() {
        // polygon은 최소 3점이 필요합니다.
        // shader loop 상한이 고정되어 있어 TERRAIN_OVERLAY_SHADER.MAX_POINTS를 넘는 점은 잘라냅니다.
        if (!defined(this.points) || this.points.length < 3) {
            return undefined;
        }

        const sourcePoints = this.points.slice(0, TERRAIN_OVERLAY_SHADER.MAX_POINTS);
        if (!sourcePoints.every(isValidTerrainStampPoint)) {
            return undefined;
        }
        const points = sourcePoints.map((point) => new Vector3(point.x, point.y, point.z ?? 0));

        if (points.length < 3) return undefined;

        const texture = typeof this.texture === 'string' && defined(this.texture) ? this.texture : undefined;
        const opacity = this.opacity;

        // Color/Vector3는 외부 객체가 나중에 변경되어도 registry 데이터가 흔들리지 않도록 생성 시점에 복사합니다.
        return {
            type: TERRAIN_OVERLAY_SHADER.TYPE_POLYGON,
            pointCount: points.length,
            points,
            color: new Color(this.color ?? DEFAULT_COLOR),
            gradientColor: this.gradientColor !== undefined ? new Color(this.gradientColor) : undefined,
            gradientDirection: this.gradientDirection,
            opacity, // texture가 없을 때 color fill alpha로 사용됩니다.
            texture, // atlas에 등록할 이미지 URL입니다. undefined이면 color fill입니다.
            textureOpacity: this.#resolveTextureOpacity(opacity), // texture fill alpha 계산에 쓰는 기본 불투명도입니다.
            textureUseAlpha: this.textureUseAlpha !== false, // true이면 이미지 alpha 채널을 함께 반영합니다.
            textureScale: this.#resolveTextureScale(), // texture 프레임을 중심 기준으로 확대/축소하는 배율입니다.
            textureFit: this.#resolveTextureFit(), // atlas cell 안에 texture를 배치하는 방식입니다.
            mappingFrame: cloneTerrainStampMappingFrame(this.mappingFrame),
            expectTexture: this.expectTexture === true
        };
    }

    #createPolylineStampCache() {
        if (!defined(this.points) || this.points.length < 2) {
            return undefined;
        }

        const sourcePoints = this.points.slice(0, TERRAIN_OVERLAY_SHADER.MAX_POINTS);
        if (!sourcePoints.every(isValidTerrainStampPoint)) {
            return undefined;
        }
        const points = sourcePoints.map((point) => new Vector3(point.x, point.y, point.z ?? 0));
        const lineWidth = getPositiveTerrainStampNumber(this.lineWidth, 0);
        if (points.length < 2 || lineWidth <= 0) {
            return undefined;
        }

        return {
            type: TERRAIN_OVERLAY_SHADER.TYPE_POLYLINE,
            pointCount: points.length,
            points,
            lineWidth,
            lineWidthUnits: resolveTerrainStampLineWidthUnits(this.lineWidthUnits),
            color: new Color(this.color ?? DEFAULT_COLOR),
            opacity: Math.max(0, Math.min(1, Number(this.opacity) || 0)),
            texture: undefined,
            textureOpacity: 0,
            textureUseAlpha: false,
            textureScale: 1,
            textureFit: TERRAIN_STAMP_TEXTURE_FIT_STRETCH,
            expectTexture: false
        };
    }

    /**
     * 현재 circle 인스턴스 상태를 shader DataTexture row에 쓰기 위한 plain object로 변환합니다.
     * circle은 center/radius만 있으면 fragment 포함 판정을 할 수 있으므로 pointCount는 0입니다.
     */
    #createCircleStampCache() {
        // circle은 center와 양수 radius가 모두 있어야 합니다.
        if (!defined(this.center)) {
            return undefined;
        }

        const center = this.center?.clone
            ? this.center.clone()
            : new Vector3(this.center?.x, this.center?.y, this.center?.z ?? 0);
        const radius = Number(this.radius);

        if (!Number.isFinite(center.x) || !Number.isFinite(center.y) || !Number.isFinite(radius) || radius <= 0) {
            return undefined;
        }

        const texture = typeof this.texture === 'string' && defined(this.texture) ? this.texture : undefined;
        const opacity = this.opacity;

        // radius는 world 단위입니다.
        // shader에는 radius^2도 기록하므로 내부 데이터에는 원본 radius만 보관합니다.
        return {
            type: TERRAIN_OVERLAY_SHADER.TYPE_CIRCLE,
            pointCount: 0,
            center,
            radius, // world 단위 반지름입니다. writeOverlayToTexture에서 radius^2도 같이 기록합니다.
            color: new Color(this.color ?? DEFAULT_COLOR),
            gradientColor: this.gradientColor !== undefined ? new Color(this.gradientColor) : undefined,
            gradientDirection: this.gradientDirection,
            opacity, // texture가 없을 때 color fill alpha로 사용됩니다.
            texture, // atlas에 등록할 이미지 URL입니다. undefined이면 color fill입니다.
            textureOpacity: this.#resolveTextureOpacity(opacity), // texture fill alpha 계산에 쓰는 기본 불투명도입니다.
            textureUseAlpha: this.textureUseAlpha !== false, // true이면 이미지 alpha 채널을 함께 반영합니다.
            textureScale: this.#resolveTextureScale(), // texture 프레임을 중심 기준으로 확대/축소하는 배율입니다.
            textureFit: this.#resolveTextureFit(), // atlas cell 안에 texture를 배치하는 방식입니다.
            expectTexture: this.expectTexture === true
        };
    }

    /**
     * texture overlay에서 사용할 불투명도를 결정합니다.
     * textureOpacity가 유효한 숫자이면 0~1로 clamp해서 사용합니다.
     * texture가 있는데 textureOpacity가 없으면 1을 사용하고,
     * texture가 없으면 color overlay의 opacity를 fallback으로 사용합니다.
     */
    #resolveTextureOpacity(defaultOpacity) {
        // texture는 기본적으로 textureOpacity를 1로 둡니다.
        // texture가 없으면 일반 color opacity를 그대로 alpha로 사용합니다.
        const textureOpacity = Number(this.textureOpacity);
        if (Number.isFinite(textureOpacity)) {
            return Math.max(0, Math.min(1, textureOpacity));
        }

        return typeof this.texture === 'string' && defined(this.texture)
            ? 1
            : Math.max(0, Math.min(1, defaultOpacity));
    }

    #resolveTextureScale() {
        const textureScale = Number(this.textureScale);
        return Number.isFinite(textureScale) && textureScale > 0 ? textureScale : 1;
    }

    #resolveTextureFit() {
        return resolveTerrainStampTextureFit(this.textureFit);
    }

}

function setTerrainStampMaxStampsPerTile(state, value) {
    const limit = Number(value);
    const nextLimit = Number.isFinite(limit) && limit > 0
        ? Math.min(TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS, Math.floor(limit))
        : DEFAULT_MAX_STAMPS_PER_TILE;

    if (!state || state.maxStampsPerTile === nextLimit) {
        return;
    }

    state.maxStampsPerTile = nextLimit;
    state.textureDirty = true;
}

function getTerrainStampLayerMode(stamp, layer) {
    if (!isTerrainStampMaskMode(stamp)) {
        return stamp?.mode ?? TERRAIN_STAMP_MODE_FILL;
    }

    if (!defined(stamp?.targetLayer)) {
        return TERRAIN_STAMP_MODE_MASK;
    }

    // target보다 위 레이어에는 구멍(mask)을 내고, target 자신과 그 아래 레이어에는 가림 전용(occlude)으로 등록합니다.
    // occlude는 구멍으로 드러나는 아래 레이어에서 이 도장보다 renderOrder가 낮은 도장을 숨겨, 가림 도장이 실제로 "위"에 있는 것처럼 보이게 합니다.
    return isLayerAboveTerrainStampTargetLayer(layer, stamp.targetLayer)
        ? TERRAIN_STAMP_MODE_MASK
        : TERRAIN_STAMP_MODE_MASK_OCCLUDE;
}

function resolveTerrainStampMode(mode) {
    if (!defined(mode)) {
        return undefined;
    }

    if (typeof mode === 'string') {
        return TERRAIN_STAMP_MODE_NAMES.get(mode.toLowerCase());
    }

    const numericMode = Number(mode);
    return numericMode === TERRAIN_STAMP_MODE_FILL || numericMode === TERRAIN_STAMP_MODE_MASK
        ? numericMode
        : undefined;
}

function resolveTerrainStampLineWidthUnits(units) {
    return units === TERRAIN_STAMP_LINE_WIDTH_UNITS_PIXELS
        ? TERRAIN_STAMP_LINE_WIDTH_UNITS_PIXELS
        : TERRAIN_STAMP_LINE_WIDTH_UNITS_METERS;
}

function isTerrainStampMaskMode(stamp) {
    // mode를 명시하지 않은 도장은 targetLayer가 있으면 가림으로 동작합니다. 채움으로 명시한 도장은 targetLayer가 있어도 채움입니다.
    return stamp?.mode === TERRAIN_STAMP_MODE_MASK
        || (!defined(stamp?.mode) && defined(stamp?.targetLayer));
}

function getTerrainStampSearchTargetLayer(stamp) {
    // 검색 대상 레이어를 좁힐 기준 레이어입니다.
    // 가림 도장은 target 레이어와 그 아래 레이어에도 가림 전용(occlude)으로 등록해야 하므로 모든 영상 레이어를 검색하고,
    // 채움 도장에 targetLayer가 있으면 그보다 위 레이어로만 적용 범위를 좁힙니다.
    if (!defined(stamp?.targetLayer)) {
        return undefined;
    }
    return isTerrainStampMaskMode(stamp) ? undefined : stamp.targetLayer;
}

function isLayerAboveTerrainStampTargetLayer(layer, targetLayer) {
    // getSearchLayers()의 필터와 같은 기준입니다. target 자신은 위가 아닙니다.
    if (!defined(layer) || !defined(targetLayer) || isSameTerrainStampLayer(layer, targetLayer)) {
        return false;
    }
    return (layer.getRenderOrder?.() ?? 0) > (targetLayer.getRenderOrder?.() ?? 0);
}

/**
 * UTerrainMesh의 material.onBeforeRender에서 매 tile render 직전에 호출됩니다.
 *
 * 처리 순서:
 * 1. registry가 바뀌었으면 overlay 후보와 변경 범위를 다시 수집합니다.
 * 2. 현재 object(tile mesh)의 bounds가 있으면 해당 tile과 겹치는 overlay만 담은 texture를 선택합니다.
 * 3. shader vertex에서 world 좌표를 안정적으로 복원할 수 있도록 object origin과 overlay origin의 차이를 uniform에 넣습니다.
 */
function updateTerrainOverlayUniforms(stampState, renderContext = {}) {
    // 합성 경로는 레이어 전체가 아니라 현재 타일의 형상으로 결정합니다.
    // bounds를 얻지 못하는 경우에도 이전 타일의 선택이 남지 않게 먼저 초기화합니다.
    stampState.uniforms.compositeEnabled.value = false;
    stampState.uniforms.rowCoverage.value = TERRAIN_STAMP_EMPTY_ROW_COVERAGE;
    stampState.uniforms.rowFill.value = TERRAIN_STAMP_EMPTY_ROW_FILL;
    stampState.uniforms.plainRowLimit.value = 0;
    // 직전 화면의 후보 조합을 보존하고 사용하지 않는 texture만 회수합니다.
    INTERNAL.beginTextureFrame(stampState, renderContext.renderer);
    // 이 함수는 UTerrainMesh render 직전에 tile mesh draw 단위로 호출됩니다.
    // shader program은 이미 컴파일되어 있고, 여기서는 uniform.value와 DataTexture 내용만 바꿉니다.
    if (stampState.textureDirty) {
        updateTerrainOverlayTexture(stampState);
    }

    applyObjectOverlayTexture(stampState, renderContext.object);
    // 조합별 texture의 높이는 실제 후보 수에 맞춘다. 전역 fallback과 빈 texture로 전환할 때도 갱신한다.
    stampState.uniforms.stampDataTextureSize.value.y = stampState.uniforms.stampDataTexture.value.image.height;
    resolveObjectWorldOrigin(_scratchObjectOrigin, renderContext.object);
    setSplitDifferenceVector(stampState.uniforms.objectRelative.value, _scratchObjectOrigin, _scratchOrigin);
    const pixelRatio = Number(renderContext.renderer?.getPixelRatio?.());
    stampState.uniforms.pixelRatio.value = Number.isFinite(pixelRatio) && pixelRatio > 0
        ? pixelRatio
        : 1;
}

/**
 * registry에 등록된 모든 overlay를 현재 layer state의 entries에 모읍니다.
 *
 * 여기서는 일부러 TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS로 자르지 않습니다.
 * overlay 전체 개수는 제한하지 않고, 실제 shader texture에 쓰는 순간에만 "현재 tile mesh와 겹치는 후보"를 먼저 고른 뒤
 * tile 하나당 최대 row 수만 적용해야 멀리 떨어진 overlay들이 서로를 밀어내지 않습니다.
 *
 * 전역 texture는 tile bounds를 알 수 없는 object용 fallback입니다.
 * 정상적인 terrain tile mesh render에서는 buildTileOverlayTexture가 tile별 후보를 다시 골라 texture를 씁니다.
 */
function updateTerrainOverlayTexture(stampState) {
    // registry 전체를 순회해 이번 revision에서 살아 있는 overlay만 현재 layer state에 모읍니다.
    // 여기서 MAX_OVERLAYS로 먼저 자르면 멀리 떨어진 overlay가 서로 밀어낼 수 있으므로 전체 목록은 유지합니다.
    const entries = stampState.entries;
    entries.length = 0;
    // 멀리 떨어진 빈 타일은 개별 stamp를 순회하기 전에 한 번의 bounds 비교로 제외한다.
    const bounds = stampState.entriesBounds;
    bounds.minX = bounds.minY = Infinity;
    bounds.maxX = bounds.maxY = -Infinity;

    for (const [owner, stampCache] of stampState.cacheByStamp) {
        if (owner?.visible !== false) {
            if (isTargetMaskOverlayForState(stampState, stampCache)) {
                continue;
            }
            // bounds는 tile과 교차 여부를 빠르게 판단하고, shader에서도 fragment early reject에 사용합니다.
            // 등록 자료는 외부 points/center의 복사본이며 값이 바뀌면 새 객체로 교체됩니다.
            // 다른 stamp만 변경된 세대에서는 이 도형의 bounds도 그대로 사용할 수 있습니다.
            stampCache.worldBounds ??= getOverlayBoundsXY(stampCache);
            bounds.minX = Math.min(bounds.minX, stampCache.worldBounds.minX);
            bounds.minY = Math.min(bounds.minY, stampCache.worldBounds.minY);
            bounds.maxX = Math.max(bounds.maxX, stampCache.worldBounds.maxX);
            bounds.maxY = Math.max(bounds.maxY, stampCache.worldBounds.maxY);
            entries.push(stampCache);
        }
    }

    // shader는 row 순서대로 덮어 그리므로 renderOrder(같으면 생성 순서)로 정렬해 겹침 순서를 고정합니다.
    // registry Map은 갱신된 stamp를 뒤로 옮기기 때문에 삽입 순서를 그대로 쓰면 갱신할 때마다 순서가 바뀝니다.
    entries.sort(compareTerrainStampRenderOrder);
    // 원래 도형과 새 도형이 모두 영향을 주지 않는 타일의 후보·분류 결과를 재사용합니다.
    INTERNAL.updateEntryChanges(stampState);
    // 비정상 bounds가 섞이면 넓은 범위 제외를 포기하고 기존 개별 교차 판정에 맡긴다.
    stampState.hasEntriesBounds = Number.isFinite(bounds.minX) && Number.isFinite(bounds.minY)
        && Number.isFinite(bounds.maxX) && Number.isFinite(bounds.maxY);
    // 도형이 많은 레이어의 검색 자료를 갱신하되 최종 후보 판정과 표시 순서는 유지합니다.
    INTERNAL.updateCandidateIndex(stampState);

    const fallbackCount = Math.min(entries.length, TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS);
    // 전역 metadata는 bounds 없는 draw에서만 필요합니다. 다만 이미지 atlas의
    // cell 선점과 비동기 load 시작 순서는 기존 전역 row 순서대로 유지해야 합니다.
    // 숫자 row 작성만 지연하여 타일 전용 장면의 중복 좌표 변환과 업로드를 없앱니다.
    for (let i = 0; i < fallbackCount; i++) {
        if (entries[i].texture) getTerrainOverlayTextureAtlasEntry(entries[i].texture);
    }
    stampState.textureDirty = false;
    stampState.textureRevision++;
}

function copyOverlayCornerToRelative(target, worldCorner, origin) {
    // world 좌표를 origin 기준 상대 좌표로 바꾸되, 큰 수끼리의 단순 뺄셈보다 정밀도를 보존하는 splitDifference를 사용합니다.
    setSplitDifferenceVector(target, worldCorner, origin);
    return target;
}

function resolveOverlayRelativeOrigin(target, overlays, count) {
    // overlay가 하나도 없으면 origin은 의미가 없으므로 0으로 둡니다.
    if (count <= 0) {
        target.set(0, 0, 0);
        return target;
    }

    // 첫 overlay의 대표점을 origin으로 삼습니다.
    // 모든 overlay point와 tile object origin을 이 기준의 상대 좌표로 맞춰 shader float 정밀도 손실을 줄입니다.
    const firstPoint = getOverlayReferencePoint(overlays[0]);
    if (!firstPoint) {
        target.set(0, 0, 0);
        return target;
    }

    target.copy(firstPoint);
    return target;
}

function resolveObjectWorldOrigin(target, object) {
    // 현재 terrain tile mesh의 matrixWorld translation을 가져옵니다.
    // shader에서는 modelMatrix * local vertex로 tile local world delta를 만들고,
    // 여기에 objectRelative를 더해 overlay origin 기준 world XY를 얻습니다.
    if (!object?.matrixWorld?.elements) {
        target.set(0, 0, 0);
        return target;
    }

    const elements = object.matrixWorld.elements;
    target.set(
        Number(elements[12] ?? 0),
        Number(elements[13] ?? 0),
        Number(elements[14] ?? 0)
    );
    return target;
}

/**
 * 타일별 도장 후보와 대상 영상의 현재 표시 상태를 렌더 직전에 반영합니다.
 *
 * @param {object} stampState 레이어별 도장 상태입니다.
 * @param {import('three').Object3D | undefined} object 현재 지형 메시입니다.
 * @returns {void} 반환값이 없습니다.
 */
function applyObjectOverlayTexture(stampState, object) {
    // tile bounds를 알 수 있으면 현재 tile과 겹치지 않는 overlay를 texture에서 제외합니다.
    // 범위를 알 수 없으면 전역 후보에서 대상 영상이 필요한 가림만 보류합니다.
    const tileBounds = getObjectTileBoundsXY(object, stampState.tileBoundsScratch);
    if (!tileBounds || stampState.entries.length <= 0) {
        // 타일을 특정할 수 없으면 대상 영상의 덮임을 증명할 수 없어 해당 가림만 보류합니다.
        const fallbackEntries = stampState.entries.filter(overlay =>
            overlay.mode !== TERRAIN_STAMP_MODE_MASK || !defined(overlay.targetLayer));
        const fallbackCount = Math.min(fallbackEntries.length, TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS);
        // 타일 draw만 반복되는 동안 미뤄 둔 전역 row는 실제 fallback 요청에서 한 번만
        // 갱신합니다. 여러 세대를 건너뛰어도 최신 registry와 atlas를 함께 반영합니다.
        if (stampState.globalTextureRevision !== stampState.textureRevision) {
            resolveOverlayRelativeOrigin(stampState.globalOrigin, fallbackEntries, fallbackCount);
            _scratchOrigin.copy(stampState.globalOrigin);
            for (let i = 0; i < fallbackCount; i++) {
                writeOverlayToTexture(stampState.globalStampDataTexture, i, fallbackEntries[i]);
            }
            stampState.globalStampDataTexture.needsUpdate = true;
            stampState.globalTextureRevision = stampState.textureRevision;
        }
        stampState.uniforms.stampDataTexture.value = stampState.globalStampDataTexture;
        stampState.uniforms.count.value = fallbackCount;
        _scratchOrigin.copy(stampState.globalOrigin);
        return;
    }

    let cache = stampState.tileStampDataTextureCache.get(object);
    const sameBounds = cache && areBoundsXYEqual(cache, tileBounds);
    const tile = object?.getTile?.() ?? object?._tile;

    if (cache?.revision === stampState.textureRevision - 1 && stampState.canReuseUnchangedTiles
        && sameBounds && cache.data.texture
        && !intersectsBoundsXY(tileBounds, stampState.changedBounds, TERRAIN_STAMP_TILE_BOUNDS_MARGIN)) {
        cache.revision = stampState.textureRevision;
    }

    // 타일 cache는 후보 선택 결과만 빌린다. 공유 항목이 퇴출되었으면 같은 revision이라도 다시 선택한다.
    if (!cache || cache.revision !== stampState.textureRevision || !sameBounds
        || !cache.data.texture || haveTerrainMaskTargetsChanged(cache.maskTargets, tile)) {
        cache = buildTileOverlayTexture(stampState, tileBounds, cache, tile);
        stampState.tileStampDataTextureCache.set(object, cache);
    }

    cache.data.lastUsedFrame = stampState.textureFrame;
    stampState.uniforms.compositeEnabled.value = cache.compositeEnabled;
    stampState.uniforms.rowCoverage.value = cache.rowCoverage;
    stampState.uniforms.rowFill.value = cache.data.rowFill ?? TERRAIN_STAMP_EMPTY_ROW_FILL;
    stampState.uniforms.plainRowLimit.value = cache.data.plainRowLimit ?? 0;
    if (cache.compositeEnabled) stampState.uniforms.compositeColor.value.copy(cache.compositeColor);
    stampState.uniforms.stampDataTexture.value = cache.data.texture;
    stampState.uniforms.count.value = cache.data.count;
    _scratchOrigin.copy(cache.data.origin);
}

/**
 * 현재 타일에 영향을 주며 대상 영상으로 덮이는 도장만 공유 후보 자료에 기록합니다.
 *
 * @param {object} stampState 레이어별 도장 상태입니다.
 * @param {object} tileBounds 현재 타일의 평면 범위입니다.
 * @param {object | undefined} cache 재사용할 타일 후보 캐시입니다.
 * @param {import('@U3dQuadTile').U3dQuadTile | undefined} tile 현재 논리 타일입니다.
 * @returns {object} 갱신된 타일 후보 캐시입니다.
 */
function buildTileOverlayTexture(stampState, tileBounds, cache, tile) {
    // 현재 tile mesh에 실제로 영향을 줄 수 있는 overlay만 DataTexture에 기록합니다.
    // 따라서 전체 overlay가 128개를 넘어도, tile 하나에 겹치는 후보가 128개 이하면 모두 정상 처리됩니다.
    // fragment shader는 texture row 개수만큼 loop를 돌기 때문에 tile별 후보 수를 줄이는 것이 중요합니다.
    // 먼저 bounds 교차로 후보를 줄이고, 그래도 많으면 tile 중심에 가까운 overlay를 우선합니다.
    const limit = Math.min(stampState.maxStampsPerTile, TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS);
    const tileStampCandidates = stampState.tileStampCandidates;
    tileStampCandidates.length = 0;
    const previousMaskTargets = cache?.maskTargets;
    previousMaskTargets?.clear();
    let maskTargets;

    const outsideEntries = stampState.hasEntriesBounds
        && !intersectsBoundsXY(tileBounds, stampState.entriesBounds, TERRAIN_STAMP_TILE_BOUNDS_MARGIN);
    // 현재 타일 주변만 검색할 수 있으면 내부 색인을 사용하고, 나머지는 전체 목록을 사용합니다.
    const searchEntries = outsideEntries ? stampState.entries
        : INTERNAL.queryCandidateIndex(stampState, tileBounds, TERRAIN_STAMP_TILE_BOUNDS_MARGIN);
    for (let index = 0; !outsideEntries && index < searchEntries.length; index++) {
        const overlay = searchEntries[index];
        if (isTargetMaskOverlayForState(stampState, overlay)) {
            continue;
        }

        if (!intersectsBoundsXY(tileBounds, overlay.worldBounds, TERRAIN_STAMP_TILE_BOUNDS_MARGIN)) {
            continue;
        }

        if (overlay.mode === TERRAIN_STAMP_MODE_MASK && defined(overlay.targetLayer)) {
            maskTargets ??= previousMaskTargets ?? new Map();
            if (!maskTargets.has(overlay.targetLayer)) {
                maskTargets.set(overlay.targetLayer, isTerrainMaskTargetReady(overlay.targetLayer, tile));
            }
            if (!maskTargets.get(overlay.targetLayer)) continue;
        }
        tileStampCandidates.push(overlay);
    }

    const count = Math.min(tileStampCandidates.length, limit);
    if (tileStampCandidates.length > limit) {
        // 상한을 넘으면 tile 중심에 가까운 overlay만 남깁니다. 거리 정렬은 "무엇을 남길지"에만 쓰고,
        // 남긴 후보는 다시 renderOrder 순으로 되돌려 tile마다 겹침 순서가 달라지지 않게 합니다.
        const tileCenter = getBoundsCenterXY(tileBounds);
        tileStampCandidates.sort((a, b) => (
            getPointBoundsDistanceSq(tileCenter, a.worldBounds)
            - getPointBoundsDistanceSq(tileCenter, b.worldBounds)
        ));
        tileStampCandidates.length = count;
        tileStampCandidates.sort(compareTerrainStampRenderOrder);
    }

    // 첫 stamp가 상대 좌표 원점도 정하므로, 순서가 같은 후보 조합은 타일 위치와 무관하게 동일하다.
    // 생성 ID는 갱신·숨김/재표시에도 유지된다. 순서까지 키에 포함하여 renderOrder 변경을 구분한다.
    let key = '';
    for (let i = 0; i < count; i++) key += `${tileStampCandidates[i].creationId},`;
    const sharedTextures = stampState.sharedTileStampDataTextures;
    let data = count === 0 ? stampState.emptyTileStampData : sharedTextures.get(key);
    if (!data) {
        // 공용 Map만 texture를 소유한다. tile WeakMap은 퇴출된 항목을 참조할 수 있으므로
        // dispose 후 texture를 비워 다음 draw에서 반드시 다시 선택하도록 한다.
        if (!stampState.tracksTextureFrames && sharedTextures.size >= TERRAIN_STAMP_MAX_SHARED_TEXTURES) {
            const oldestKey = sharedTextures.keys().next().value;
            const oldest = sharedTextures.get(oldestKey);
            sharedTextures.delete(oldestKey);
            // 후보 참조를 무효화한 뒤 소유 자원을 반환합니다. 프레임 정보가 없는
            // 호출에서는 GPU 재사용 시점을 증명할 수 없어 기존 즉시 해제를 유지합니다.
            INTERNAL.retireTextureData(stampState, oldest);
        }
        const rowCapacity = nextPowerOfTwo(count);
        // 표시 형상과 metadata 배치는 유지하면서 사용이 끝난 같은 규격의 저장소를
        // 빌립니다. 이전 tile cache가 붙잡은 record 대신 새 조합 record를 만듭니다.
        const texture = INTERNAL.takePooledTexture(stampState, rowCapacity) ?? createOverlayTexture(rowCapacity);
        data = {texture, count, origin: new Vector3(), revision: -1};
    }
    if (count > 0) {
        // 같은 후보 조합은 실제 입력이나 atlas가 달라졌을 때만 작성·업로드한다.
        if (data.revision !== stampState.textureRevision) {
            // 다른 Stamp의 변경만으로 동일 후보 데이터를 다시 GPU에 올리지 않습니다.
            if (INTERNAL.updateSharedEntries(data, tileStampCandidates, count, stampState.atlasRevision)) {
                resolveOverlayRelativeOrigin(data.origin, tileStampCandidates, count);
                _scratchOrigin.copy(data.origin);
                for (let i = 0; i < count; i++) writeOverlayToTexture(data.texture, i, tileStampCandidates[i]);
                // 확정된 내부 채움은 경계 texture 조회 없이 같은 색과 알파를 사용합니다.
                data.plainRowLimit = INTERNAL.resolvePlainRowLimit(data.texture, count);
                INTERNAL.updatePlainRowFill(data);
                data.texture.needsUpdate = true;
            }
            data.revision = stampState.textureRevision;
        }
        sharedTextures.delete(key);
        sharedTextures.set(key, data);
    }
    // 다른 Stamp가 바뀌어 layer 세대만 증가했더라도, 이 타일이 고른 실제 metadata와
    // bounds가 같으면 기하 판정은 같습니다. 이전 결과를 재사용하여 겹친 후보의
    // 광범위한 변경 사각형 때문에 같은 분류를 다시 실행하지 않도록 합니다.
    cache ??= {compositeColor: new Vector4()};
    cache.maskTargets = maskTargets;
    if (cache.data === data && cache.coverageVersion === data.texture.version
        && cache.minX === tileBounds.minX && cache.minY === tileBounds.minY
        && cache.maxX === tileBounds.maxX && cache.maxY === tileBounds.maxY) {
        cache.revision = stampState.textureRevision;
        return cache;
    }
    // 실제 선택·직렬화한 row를 사용해야 후보 상한과 float 좌표가 정밀 shader와 같습니다.
    // 같은 후보 조합이어도 타일의 경계 교차 여부는 다르므로 이 결과는 tile cache에 둡니다.
    // cache는 object별 WeakMap이 소유하므로 다른 타일의 coverage를 덮어쓰지 않습니다.
    // 움직이는 stamp 때문에 매 세대 계산해도 타일의 결과 객체·색·배열은 재사용합니다.
    // 많은 단색 후보는 후보별 판정 한 숫자만 보관합니다. 선의 world 거리 하한을
    // 현재 pixel 폭과 비교하는 일은 GPU가 담당하므로 카메라 이동에도 같은 값을 씁니다.
    // 색·정점 자료는 기존 공유 texture를 그대로 사용하며 추가 texture는 만들지 않습니다.
    const classifyRows = data.plainRowLimit > 0;
    const denseRows = data.plainRowLimit === 128;
    const rowCoverage = denseRows
        ? (cache.denseCoverageStorage ??= new Float32Array(128))
        : classifyRows ? (cache.coverageStorage ??= new Float32Array(16))
        : TERRAIN_STAMP_EMPTY_ROW_COVERAGE;
    // resolveTileComposite는 alpha 조기 종료 뒤 행을 쓰지 않을 수 있어, 직전 판정이
    // 남지 않도록 단색 경로를 계산할 때만 소유 배열을 초기화합니다.
    if (classifyRows) rowCoverage.fill(0);
    cache.compositeEnabled = denseRows
        ? INTERNAL.resolveDenseRowCoverage(data.texture, count, data.origin, tileBounds, cache.compositeColor, rowCoverage)
        : INTERNAL.resolveTileComposite(data.texture, count, data.origin, tileBounds, cache.compositeColor,
            classifyRows ? rowCoverage : undefined);
    // scratch 객체 자체를 보관하면 다음 타일의 draw가 이 타일의 비교 기준을 덮어씁니다.
    // 숫자 snapshot만 복사하여 매 draw의 bounds 객체·문자열 생성을 없앱니다.
    cache.minX = tileBounds.minX;
    cache.minY = tileBounds.minY;
    cache.maxX = tileBounds.maxX;
    cache.maxY = tileBounds.maxY;
    cache.revision = stampState.textureRevision;
    cache.coverageVersion = data.texture.version;
    cache.data = data;
    cache.rowCoverage = rowCoverage;
    return cache;
}

/**
 * 도형 변경과 무관한 영상 로딩·부착·숨김 변화도 타일 후보에 반영합니다.
 *
 * @param {Map<import('@U3dImageLayer').U3dImageLayer, boolean> | undefined} targets 직전 대상별 표시 판정입니다.
 * @param {import('@U3dQuadTile').U3dQuadTile | undefined} tile 현재 논리 타일입니다.
 * @returns {boolean} 판정이 달라져 후보를 다시 골라야 하면 true입니다.
 */
function haveTerrainMaskTargetsChanged(targets, tile) {
    if (!targets) return false;
    for (const [target, ready] of targets) {
        if (ready !== isTerrainMaskTargetReady(target, tile)) return true;
    }
    return false;
}

/**
 * 대상 영상의 현재 타일이나 표시 중인 부모가 배경을 대신 덮을 수 있는지 확인합니다.
 *
 * @param {import('@U3dImageLayer').U3dImageLayer} layer 마스크 아래 표시할 영상 레이어입니다.
 * @param {import('@U3dQuadTile').U3dQuadTile | undefined} tile 배경을 가릴 논리 타일입니다.
 * @returns {boolean} 텍스처·지형 전환·장면 부착이 모두 준비되었으면 true입니다.
 */
function isTerrainMaskTargetReady(layer, tile) {
    if (layer._disposed === true || layer.getVisible?.() !== true) return false;
    for (let current = tile; current; current = current._parent) {
        if (current._disposed === true) continue;
        if (layer.isTilePresentationParticipant?.(current) !== true) continue;
        if (layer.isTexture?.(current) !== true) continue;
        if (layer.isTileRenderableReady?.(current) !== true) continue;
        if (layer.isTilePresentationVisible?.(current) !== true) continue;
        return true;
    }
    return false;
}

function isTargetMaskOverlayForState(stampState, overlay) {
    if ((overlay?.mode ?? TERRAIN_STAMP_MODE_FILL) !== TERRAIN_STAMP_MODE_MASK) {
        return false;
    }

    const stamp = overlay?.owner ?? overlay;
    if (!defined(stamp?.targetLayer)) {
        return false;
    }

    return isStampTargetLayer(stamp, stampState?.layer);
}

function isStampTargetLayer(stamp, layer) {
    const targetLayer = stamp?.targetLayer ?? stamp?.owner?.targetLayer;
    return defined(targetLayer)
        && defined(layer)
        && isSameTerrainStampLayer(layer, targetLayer);
}

function writeOverlayToTexture(texture, row, overlay) {
    // normalized overlay 객체 하나를 DataTexture의 한 row에 직렬화합니다.
    // GLSL은 readTerrainOverlayTexel(overlayIndex, column)으로 아래 column 배치를 그대로 읽습니다.
    // 모든 좌표는 _scratchOrigin 기준 상대 좌표로 기록합니다.
    // shader에서 같은 origin 기준으로 vertex 위치를 계산하므로 큰 좌표계에서도 안정적으로 포함 판정을 할 수 있습니다.
    const bounds = overlay.worldBounds ?? getOverlayBoundsXY(overlay);
    const relativeMin = copyOverlayCornerToRelative(_scratchBoundsMin, _scratchBoundsMin.set(bounds.minX, bounds.minY, 0), _scratchOrigin);
    const minX = relativeMin.x;
    const minY = relativeMin.y;
    const relativeMax = copyOverlayCornerToRelative(_scratchBoundsMax, _scratchBoundsMax.set(bounds.maxX, bounds.maxY, 0), _scratchOrigin);
    const maxX = relativeMax.x;
    const maxY = relativeMax.y;

    const atlasEntry = overlay.texture ? getTerrainOverlayTextureAtlasEntry(overlay.texture) : undefined;
    const hasTexture = atlasEntry?.loaded ? 1 : 0;

    // column 0: overlay type, polygon point count, texture 사용 여부, texture opacity.
    writeOverlayTexel(texture, row, 0, overlay.type, overlay.pointCount, hasTexture, overlay.textureOpacity);

    if (overlay.type === TERRAIN_OVERLAY_SHADER.TYPE_CIRCLE) {
        // circle은 center와 radius/radius^2만 있으면 포함 판정을 할 수 있습니다.
        const relativeCenter = copyOverlayCornerToRelative(_scratchObjectOrigin, overlay.center, _scratchOrigin);
        writeOverlayTexel(texture, row, 1, relativeCenter.x, relativeCenter.y, overlay.radius, overlay.radius * overlay.radius);
    } else {
        // polygon 꼭짓점 좌표를 DataTexture에 순서대로 저장합니다.
        // stamp 하나가 texture의 row 하나를 쓰고, column 1부터 point[0], point[1], point[2]...가 들어갑니다.
        // shader는 이 좌표들을 다시 읽어서 현재 terrain 픽셀이 polygon 내부인지 검사합니다.
        for (let j = 0; j < overlay.points.length; j++) {
            const relativePoint = copyOverlayCornerToRelative(_scratchObjectOrigin, overlay.points[j], _scratchOrigin);
            writeOverlayTexel(texture, row, j + 1, relativePoint.x, relativePoint.y, relativePoint.z, 0);
        }
    }

    // 이미지가 지정됐으면 atlas 준비 전 기본색이 보이지 않도록 alpha를 0으로 유지합니다.
    // texture의 실제 opacity는 column 0의 textureOpacity(metadata.w)와 조합됩니다.
    writeOverlayTexel(
        texture,
        row,
        TERRAIN_OVERLAY_SHADER.FILL_STYLE_COLUMN,
        overlay.color.r,
        overlay.color.g,
        overlay.color.b,
        hasTexture
            ? (overlay.textureUseAlpha ? 1 : 0)
            : (overlay.texture
                ? 0
                : Math.max(0, Math.min(1, overlay.opacity)))
    );

    // atlas rect column: atlas에서 이 overlay가 사용할 texture cell의 UV 범위입니다.
    // texture가 없거나 아직 load되지 않았어도 기본 rect를 넣어 shader 분기를 단순하게 유지합니다.
    if (atlasEntry) {
        writeOverlayTexel(
            texture,
            row,
            TERRAIN_OVERLAY_SHADER.ATLAS_RECT_COLUMN,
            atlasEntry.rect.minU,
            atlasEntry.rect.minV,
            atlasEntry.rect.maxU,
            atlasEntry.rect.maxV
        );
    } else {
        writeOverlayTexel(texture, row, TERRAIN_OVERLAY_SHADER.ATLAS_RECT_COLUMN, 0, 0, 1, 1);
    }
    writeOverlayTexel(
        texture,
        row,
        TERRAIN_OVERLAY_SHADER.MODE_COLUMN,
        overlay.mode ?? TERRAIN_STAMP_MODE_FILL,
        overlay.expectTexture === true ? 1 : 0,
        overlay.type === TERRAIN_OVERLAY_SHADER.TYPE_POLYLINE ? overlay.lineWidth : 0,
        overlay.type === TERRAIN_OVERLAY_SHADER.TYPE_POLYLINE
            && overlay.lineWidthUnits === TERRAIN_STAMP_LINE_WIDTH_UNITS_PIXELS ? 1 : 0
    );
    // bounds column: fragment가 polygon/circle 포함 계산 전에 빠르게 제외할 bounds입니다.
    writeOverlayTexel(
        texture,
        row,
        TERRAIN_OVERLAY_SHADER.GRADIENT_COLUMN,
        overlay.texture ? 0 : overlay.gradientColor?.r ?? 0,
        overlay.texture ? 0 : overlay.gradientColor?.g ?? 0,
        overlay.texture ? 0 : overlay.gradientColor?.b ?? 0,
        !overlay.texture && overlay.gradientColor ? getTerrainStampGradientDirectionCode(overlay.gradientDirection) + 1 : 0
    );
    writeOverlayTexel(texture, row, TERRAIN_OVERLAY_SHADER.BOUNDS_COLUMN, minX, minY, maxX, maxY);
    writeOverlayTextureBasisToTexture(texture, row, overlay);
}

function writeOverlayTextureBasisToTexture(texture, row, overlay) {
    // texture를 overlay 내부에 맞춰 매핑하기 위한 2D affine basis를 기록합니다.
    // texture basis 0 column: origin.xy, uAxis.xy
    // texture basis 1 column: vAxis.xy, warp.xy
    // 기본 모드는 warp를 0으로 기록합니다. 이때 texture는 기준 프레임에 매핑되고 polygon 밖은 잘립니다.
    // textureFit이 contain이면 4점 polygon에 한해 warp를 기록해서 이미지가 네 꼭짓점에 맞춰 찌그러지게 합니다.
    if (!overlay.texture && !overlay.gradientColor) {
        // 단색·선은 shader에서 UV basis를 읽지 않습니다. 이전 이미지/gradient의 값은
        // 확실히 지우되 좌표 변환은 생략합니다. 로딩 대기 중인 texture는 기존 계산을 유지합니다.
        writeOverlayTexel(texture, row, TERRAIN_OVERLAY_SHADER.TEXTURE_BASIS_0_COLUMN, 0, 0, 0, 0);
        writeOverlayTexel(texture, row, TERRAIN_OVERLAY_SHADER.TEXTURE_BASIS_1_COLUMN, 0, 0, 0, 0);
        return;
    }
    let quadPoint;
    let textureFramePrepared = false;

    if (overlay.type === TERRAIN_OVERLAY_SHADER.TYPE_CIRCLE) {
        _scratchUvOrigin.set(overlay.center.x - overlay.radius, overlay.center.y - overlay.radius, overlay.center.z ?? 0);
        _scratchUvPointA.set(overlay.center.x + overlay.radius, overlay.center.y - overlay.radius, overlay.center.z ?? 0);
        _scratchUvPointB.set(overlay.center.x - overlay.radius, overlay.center.y + overlay.radius, overlay.center.z ?? 0);
    } else if (overlay.mappingFrame?.length >= 3) {
        // polygon은 여러 stamp로 나뉘어도 이 공통 frame으로 같은 UV/gradient 좌표계를 사용한다.
        // 포함 판정과 bounds는 계속 overlay.points를 사용하므로 실제 교차 영역 밖으로 fill이 번지지 않는다.
        _scratchUvOrigin.copy(overlay.mappingFrame[0]);
        _scratchUvPointA.copy(overlay.mappingFrame[1]);
        _scratchUvPointB.copy(overlay.mappingFrame[3] ?? overlay.mappingFrame[2]);
    } else if (shouldFitTextureToPolygonPoints(overlay)) {
        const firstPoint = overlay.points[0];
        const secondPoint = overlay.points[1];
        const lastPoint = overlay.points[3];
        quadPoint = overlay.points[2];
        _scratchUvOrigin.copy(firstPoint);
        _scratchUvPointA.copy(secondPoint);
        _scratchUvPointB.copy(lastPoint);
        _scratchUvPointC.copy(quadPoint);
    } else if (overlay.texture && preparePolygonTextureFrame(overlay)) {
        // texture가 있는 polygon은 점들을 덮는 회전 사각 프레임을 만들어 texture를 안정적으로 샘플링합니다.
        // polygon 밖으로 나가는 부분은 shader의 polygon 포함 판정에서 잘립니다.
        textureFramePrepared = true;
    } else {
        const firstPoint = overlay.points[0];
        const secondPoint = overlay.points[1] ?? firstPoint;
        const lastPoint = overlay.points[overlay.points.length - 1] ?? firstPoint;
        _scratchUvOrigin.copy(firstPoint);
        _scratchUvPointA.copy(secondPoint);
        _scratchUvPointB.copy(lastPoint);
    }

    if (!textureFramePrepared) {
        applyOverlayTextureScaleToBasis(overlay, quadPoint);
    }

    const relativeOrigin = copyOverlayCornerToRelative(_scratchUvOrigin, _scratchUvOrigin, _scratchOrigin);
    const relativePointA = copyOverlayCornerToRelative(_scratchUvPointA, _scratchUvPointA, _scratchOrigin);
    const relativePointB = copyOverlayCornerToRelative(_scratchUvPointB, _scratchUvPointB, _scratchOrigin);
    _scratchUvU.subVectors(relativePointA, relativeOrigin);
    _scratchUvV.subVectors(relativePointB, relativeOrigin);
    _scratchUvPointA.set(0, 0, 0);

    if (quadPoint) {
        const relativeQuadPoint = copyOverlayCornerToRelative(_scratchUvPointA, _scratchUvPointC, _scratchOrigin);
        _scratchUvPointA
            .subVectors(relativeQuadPoint, relativeOrigin)
            .sub(_scratchUvU)
            .sub(_scratchUvV);
    }

    // texture basis 두 column은 GLSL의 terrainOverlayTextureLocalUv에서 inverse 계산에 사용됩니다.
    writeOverlayTexel(
        texture,
        row,
        TERRAIN_OVERLAY_SHADER.TEXTURE_BASIS_0_COLUMN,
        relativeOrigin.x,
        relativeOrigin.y,
        _scratchUvU.x,
        _scratchUvU.y
    );
    writeOverlayTexel(
        texture,
        row,
        TERRAIN_OVERLAY_SHADER.TEXTURE_BASIS_1_COLUMN,
        _scratchUvV.x,
        _scratchUvV.y,
        _scratchUvPointA.x,
        _scratchUvPointA.y
    );
}

function shouldFitTextureToPolygonPoints(overlay) {
    // contain은 texture를 polygon 꼭짓점에 맞춰 넣는 모드입니다.
    // 현재 shader 데이터 구조에서는 4점 polygon만 bilinear warp로 정확히 표현할 수 있습니다.
    return overlay.texture
        && overlay.textureFit === TERRAIN_STAMP_TEXTURE_FIT_CONTAIN
        && overlay.points?.length === 4;
}

function preparePolygonTextureFrame(overlay) {
    if (!overlay.points?.length) {
        return false;
    }

    const firstPoint = overlay.points[0];
    const secondPoint = overlay.points[1] ?? firstPoint;
    _scratchUvU.subVectors(secondPoint, firstPoint);

    if (_scratchUvU.lengthSq() < 1e-6) {
        const bounds = getOverlayBoundsXY(overlay);
        _scratchUvOrigin.set(bounds.minX, bounds.minY, 0);
        _scratchUvPointA.set(bounds.maxX, bounds.minY, 0);
        _scratchUvPointB.set(bounds.minX, bounds.maxY, 0);
        return true;
    }

    _scratchUvU.normalize();
    _scratchUvV.set(-_scratchUvU.y, _scratchUvU.x, 0);
    getOverlayPointsCenter(_scratchUvCenter, overlay.points);

    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;

    for (const point of overlay.points) {
        _scratchUvPointC.subVectors(point, _scratchUvCenter);
        const projectedU = _scratchUvPointC.dot(_scratchUvU);
        const projectedV = _scratchUvPointC.dot(_scratchUvV);
        minU = Math.min(minU, projectedU);
        maxU = Math.max(maxU, projectedU);
        minV = Math.min(minV, projectedV);
        maxV = Math.max(maxV, projectedV);
    }

    const scale = Number.isFinite(Number(overlay.textureScale)) && Number(overlay.textureScale) > 0
        ? Number(overlay.textureScale)
        : 1;
    const halfSide = Math.max(maxU - minU, maxV - minV, 1e-6) * 0.5 * scale;
    const centerU = (minU + maxU) * 0.5;
    const centerV = (minV + maxV) * 0.5;

    _scratchUvCenter
        .addScaledVector(_scratchUvU, centerU)
        .addScaledVector(_scratchUvV, centerV);

    _scratchUvOrigin.copy(_scratchUvCenter)
        .addScaledVector(_scratchUvU, -halfSide)
        .addScaledVector(_scratchUvV, -halfSide);
    _scratchUvPointA.copy(_scratchUvCenter)
        .addScaledVector(_scratchUvU, halfSide)
        .addScaledVector(_scratchUvV, -halfSide);
    _scratchUvPointB.copy(_scratchUvCenter)
        .addScaledVector(_scratchUvU, -halfSide)
        .addScaledVector(_scratchUvV, halfSide);
    return true;
}

function applyOverlayTextureScaleToBasis(overlay, quadPoint) {
    const scale = Number(overlay.textureScale);
    if (!Number.isFinite(scale) || scale <= 0 || scale === 1) {
        return;
    }

    if (overlay.type === TERRAIN_OVERLAY_SHADER.TYPE_CIRCLE) {
        _scratchUvCenter.copy(overlay.center);
    } else if (quadPoint) {
        _scratchUvCenter
            .copy(_scratchUvOrigin)
            .add(_scratchUvPointA)
            .add(_scratchUvPointC)
            .add(_scratchUvPointB)
            .multiplyScalar(0.25);
    } else {
        _scratchUvCenter
            .copy(_scratchUvOrigin)
            .add(_scratchUvPointA)
            .add(_scratchUvPointB)
            .multiplyScalar(1 / 3);
    }

    scaleTextureBasisPoint(_scratchUvOrigin, _scratchUvCenter, scale);
    scaleTextureBasisPoint(_scratchUvPointA, _scratchUvCenter, scale);
    scaleTextureBasisPoint(_scratchUvPointB, _scratchUvCenter, scale);
    if (quadPoint) {
        scaleTextureBasisPoint(_scratchUvPointC, _scratchUvCenter, scale);
    }
}

function scaleTextureBasisPoint(point, center, scale) {
    point.sub(center).multiplyScalar(scale).add(center);
    return point;
}

function getOverlayPointsCenter(target, points) {
    target.set(0, 0, 0);

    for (const point of points) {
        target.add(point);
    }

    return target.multiplyScalar(1 / points.length);
}

function createOverlayTexture(rowCapacity = TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS) {
    // overlay 데이터는 float DataTexture 한 장에 row 단위로 저장합니다.
    // shader는 uniform의 실제 높이로 row를 읽으므로 타일 후보가 적을 때 빈 128개 row를 업로드할 필요가 없습니다.
    const textureData = new Float32Array(TERRAIN_OVERLAY_SHADER.TEXTURE_WIDTH * rowCapacity * 4);
    const texture = new DataTexture(
        textureData,
        TERRAIN_OVERLAY_SHADER.TEXTURE_WIDTH,
        rowCapacity,
        RGBAFormat,
        FloatType
    );
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
}

let _emptyTerrainStampDataTexture;

/**
 * 활성 stamp가 없는 동안에도 기존 terrain material이 안전하게 참조할 수 있는 빈 메타데이터 texture를 반환합니다.
 * layer별 binding은 state보다 오래 유지될 수 있으므로, state가 소유하고 dispose하는 texture를 대신 연결하면 안 됩니다.
 * 이 texture는 모듈 전체에서 한 장만 만들고 작은 고정 크기 자원으로 유지합니다.
 */
function getEmptyTerrainStampDataTexture() {
    if (!defined(_emptyTerrainStampDataTexture)) {
        _emptyTerrainStampDataTexture = createOverlayTexture(1);
    }
    return _emptyTerrainStampDataTexture;
}

function getTerrainOverlayTextureAtlas() {
    // shader uniform에 연결할 atlas texture 객체를 반환합니다.
    // 실제 canvas/texture 생성은 UTerrainStampAtlas.getTexture()에서 lazy 처리됩니다.
    return _textureAtlas.getTexture();
}

function getTerrainOverlayTextureAtlasEntry(url) {
    // texture URL에 대응하는 atlas cell 정보를 반환합니다.
    // textureFit은 shader basis 계산에서만 쓰이고 atlas 이미지 자체는 URL별로 공유합니다.
    return _textureAtlas.getEntry(url);
}

function resolveTerrainStampTextureFit(fit) {
    const value = typeof fit === 'string' ? fit.toLowerCase() : TERRAIN_STAMP_TEXTURE_FIT_STRETCH;
    return TERRAIN_STAMP_TEXTURE_FITS.has(value)
        ? value
        : TERRAIN_STAMP_TEXTURE_FIT_STRETCH;
}

function resolveTerrainStampGradientDirection(direction) {
    const value = typeof direction === 'string'
        ? direction.toLowerCase()
        : TERRAIN_STAMP_GRADIENT_DIRECTION_VERTICAL;
    return TERRAIN_STAMP_GRADIENT_DIRECTIONS.has(value)
        ? value
        : TERRAIN_STAMP_GRADIENT_DIRECTION_VERTICAL;
}

function getTerrainStampGradientDirectionCode(direction) {
    return resolveTerrainStampGradientDirection(direction) === TERRAIN_STAMP_GRADIENT_DIRECTION_HORIZONTAL ? 1 : 0;
}

function cloneTerrainStampValue(value) {
    if (!defined(value)) {
        return value;
    }

    if (typeof value.clone === 'function') {
        return value.clone();
    }

    if (typeof value === 'object') {
        return {...value};
    }

    return value;
}

function isValidTerrainStampPoint(point) {
    return defined(point)
        && Number.isFinite(point.x)
        && Number.isFinite(point.y)
        && (point.z === undefined || Number.isFinite(point.z));
}

function getPositiveTerrainStampNumber(value, fallback) {
    try {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : fallback;
    } catch (error) {
        return fallback;
    }
}

function normalizeTerrainStampMappingFrame(frame) {
    if (!Array.isArray(frame) || frame.length < 3) {
        return undefined;
    }

    const points = [];
    for (let i = 0; i < Math.min(4, frame.length); i++) {
        const point = frame[i];
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            return undefined;
        }
        points.push(point.clone ? point.clone() : new Vector3(point.x, point.y, point.z ?? 0));
    }
    return points.length >= 3 ? points : undefined;
}

function cloneTerrainStampMappingFrame(frame) {
    return Array.isArray(frame)
        ? frame.map((point) => point.clone ? point.clone() : new Vector3(point.x, point.y, point.z ?? 0))
        : undefined;
}

function resolveTerrainStampRenderOrder(value) {
    const renderOrder = Number(value);
    return Number.isFinite(renderOrder) ? renderOrder : 0;
}

function compareTerrainStampRenderOrder(a, b) {
    return (a.renderOrder ?? 0) - (b.renderOrder ?? 0) || (a.creationId ?? 0) - (b.creationId ?? 0);
}

function serializeTerrainStampPoint(point) {
    return {x: Number(point.x), y: Number(point.y), z: Number(point.z ?? 0)};
}

function serializeTerrainStampColor(color) {
    // 숫자·CSS 문자열·Color 어떤 형태로 넣었든 저장 형식을 '#rrggbb'로 통일해 재로드와 파일 비교가 안정적이게 합니다.
    return `#${new Color(color).getHexString()}`;
}

function getTerrainStampModeName(mode) {
    if (!defined(mode)) {
        return undefined;
    }
    for (const [name, value] of TERRAIN_STAMP_MODE_NAMES) {
        if (value === mode) {
            return name;
        }
    }
    return undefined;
}

function getTerrainStampLayerName(layer) {
    if (!defined(layer)) {
        return undefined;
    }
    const name = typeof layer.getName === 'function' ? layer.getName() : layer.name;
    return typeof name === 'string' && name ? name : undefined;
}

function resolveTerrainStampParamLayer(value, app, layerResolver) {
    if (!defined(value)) {
        return undefined;
    }
    if (typeof value !== 'string') {
        // 레이어 객체는 그대로 사용합니다.
        return value;
    }
    if (typeof layerResolver === 'function') {
        const resolved = layerResolver(value);
        if (defined(resolved)) {
            return resolved;
        }
    }
    return app?.getLayerByName?.(value) ?? undefined;
}

function nextPowerOfTwo(value) {
    // WebGL1 호환성과 sampler 동작을 안정적으로 유지하기 위해 atlas 크기는 2의 거듭제곱으로 맞춥니다.
    let result = 1;
    while (result < value) {
        result *= 2;
    }
    return result;
}

function getTerrainOverlayTextureUrlCandidates(url) {
    // 사용자가 '/image/foo.png'처럼 root-relative 경로를 넘겼을 때,
    // 빌드/튜토리얼 실행 위치에 따라 실제 baseURI 기준 './image/foo.png'가 필요한 경우가 있어 두 후보를 모두 시도합니다.
    const urls = [url];
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
        return urls;
    }

    if (url.startsWith('/')) {
        const relativeToPage = new URL(`.${url}`, document.baseURI).href;
        if (!urls.includes(relativeToPage)) {
            urls.push(relativeToPage);
        }
    }

    return urls;
}


function getOverlayReferencePoint(overlay) {
    // 상대 좌표 origin을 정할 때 사용할 대표점입니다.
    // circle은 center, polygon은 첫 점을 기준으로 삼습니다.
    if (!overlay) {
        return undefined;
    }

    return overlay.type === TERRAIN_OVERLAY_SHADER.TYPE_CIRCLE
        ? overlay.center
        : overlay.points?.[0];
}

function getOverlayBoundsXY(overlay) {
    // overlay는 지형 위 2D 영역으로 판정하므로 bounds도 XY만 사용합니다.
    if (overlay.type === TERRAIN_OVERLAY_SHADER.TYPE_CIRCLE) {
        return {
            minX: overlay.center.x - overlay.radius,
            minY: overlay.center.y - overlay.radius,
            maxX: overlay.center.x + overlay.radius,
            maxY: overlay.center.y + overlay.radius,
        };
    }

    const bounds = getPointBoundsXY(overlay.points);
    if (overlay.type === TERRAIN_OVERLAY_SHADER.TYPE_POLYLINE) {
        const margin = getPositiveTerrainStampNumber(overlay.lineWidth, 0) * 0.5;
        bounds.minX -= margin;
        bounds.minY -= margin;
        bounds.maxX += margin;
        bounds.maxY += margin;
    }
    return bounds;
}

function getObjectTileBoundsXY(object, target) {
    // terrain tile 구현마다 bounds 필드명이 조금씩 달라서 여기서 흡수합니다.
    // bounds를 얻으면 tile별 overlay texture를 만들 수 있고, 없으면 전역 texture를 그대로 사용합니다.
    const tile = object?.getTile?.() ?? object?._tile;
    const bounds = tile?.getBoundingbox?.() ?? tile?._boundingbox ?? tile?._boundingBox ?? object?._boundingBox;
    const normalizedBounds = normalizeBoundsXY(bounds, target);

    if (normalizedBounds) {
        return normalizedBounds;
    }

    return normalizeBoundsXY(tile?._rectangle3d, target);
}

function normalizeBoundsXY(bounds, target) {
    // 여러 bounds 표현을 {minX, minY, maxX, maxY} 형태로 정규화합니다.
    // 지원 형태:
    // - {minx, miny, maxx, maxy}
    // - {min: {x, y}, max: {x, y}}
    // - {ptLeftBottom: {x, y}, ptRightTop: {x, y}}
    if (!bounds) {
        return undefined;
    }

    let minX, minY, maxX, maxY;
    if (Number.isFinite(bounds.minx) && Number.isFinite(bounds.miny)
        && Number.isFinite(bounds.maxx) && Number.isFinite(bounds.maxy)) {
        minX = Math.min(bounds.minx, bounds.maxx);
        minY = Math.min(bounds.miny, bounds.maxy);
        maxX = Math.max(bounds.minx, bounds.maxx);
        maxY = Math.max(bounds.miny, bounds.maxy);
    } else if (bounds.min && bounds.max
        && Number.isFinite(bounds.min.x) && Number.isFinite(bounds.min.y)
        && Number.isFinite(bounds.max.x) && Number.isFinite(bounds.max.y)) {
        minX = Math.min(bounds.min.x, bounds.max.x);
        minY = Math.min(bounds.min.y, bounds.max.y);
        maxX = Math.max(bounds.min.x, bounds.max.x);
        maxY = Math.max(bounds.min.y, bounds.max.y);
    } else if (bounds.ptLeftBottom && bounds.ptRightTop) {
        minX = Math.min(bounds.ptLeftBottom.x, bounds.ptRightTop.x);
        minY = Math.min(bounds.ptLeftBottom.y, bounds.ptRightTop.y);
        maxX = Math.max(bounds.ptLeftBottom.x, bounds.ptRightTop.x);
        maxY = Math.max(bounds.ptLeftBottom.y, bounds.ptRightTop.y);
    } else {
        return undefined;
    }

    // 외부 getter의 동기 재진입이 끝난 뒤 한 번에 채웁니다. 타일 cache에는 이 참조를
    // 넘기지 않고 숫자만 복사하므로 다른 타일·레이어의 다음 계산과 수명이 섞이지 않습니다.
    target.minX = minX;
    target.minY = minY;
    target.maxX = maxX;
    target.maxY = maxY;
    return target;
}

function getPointBoundsXY(points) {
    // polygon point 목록에서 XY bounds를 계산합니다.
    const bounds = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
    };

    for (const point of points) {
        bounds.minX = Math.min(bounds.minX, Number(point?.x ?? 0));
        bounds.minY = Math.min(bounds.minY, Number(point?.y ?? 0));
        bounds.maxX = Math.max(bounds.maxX, Number(point?.x ?? 0));
        bounds.maxY = Math.max(bounds.maxY, Number(point?.y ?? 0));
    }

    return bounds;
}

function intersectsBoundsXY(a, b, margin = 0) {
    // bounds 정보가 하나라도 없으면 안전하게 true를 반환합니다.
    // 후보를 잘못 제거하면 overlay가 사라지는 문제가 생기므로, 모르는 경우에는 shader에 넘기는 쪽을 택합니다.
    if (!a || !b) {
        return true;
    }

    return a.minX <= b.maxX + margin
        && a.maxX >= b.minX - margin
        && a.minY <= b.maxY + margin
        && a.maxY >= b.minY - margin;
}

function getBoundsCenterXY(bounds) {
    // tile 후보가 너무 많을 때 가까운 overlay를 우선하기 위한 중심점입니다.
    return {
        x: (bounds.minX + bounds.maxX) * 0.5,
        y: (bounds.minY + bounds.maxY) * 0.5,
    };
}

function getPointBoundsDistanceSq(point, bounds) {
    // point가 bounds 안에 있으면 거리 0입니다.
    // 밖에 있으면 bounds까지의 최단 거리 제곱을 반환해 sort 비용에서 sqrt를 피합니다.
    const dx = point.x < bounds.minX
        ? bounds.minX - point.x
        : point.x > bounds.maxX
            ? point.x - bounds.maxX
            : 0;
    const dy = point.y < bounds.minY
        ? bounds.minY - point.y
        : point.y > bounds.maxY
            ? point.y - bounds.maxY
            : 0;
    return dx * dx + dy * dy;
}

function areBoundsXYEqual(a, b) {
    // 기존 숫자 문자열 key처럼 -0/+0과 NaN/NaN을 각각 같은 값으로 취급합니다.
    // 일부 rectangle 입력은 NaN을 허용했으므로 여기서 별도 유효성 정책을 추가하지 않습니다.
    return (a.minX === b.minX || Object.is(a.minX, b.minX))
        && (a.minY === b.minY || Object.is(a.minY, b.minY))
        && (a.maxX === b.maxX || Object.is(a.maxX, b.maxX))
        && (a.maxY === b.maxY || Object.is(a.maxY, b.maxY));
}

function setSplitDifferenceVector(target, value, origin) {
    // 큰 world 좌표끼리 직접 빼면 float precision 손실이 커질 수 있습니다.
    // high/low로 나눠 뺀 값을 합산하면 GPU float에 넘기기 전 JS 단계에서 상대값 정밀도를 조금 더 보존할 수 있습니다.
    target.set(
        splitDifference(Number(value?.x ?? 0), Number(origin?.x ?? 0)),
        splitDifference(Number(value?.y ?? 0), Number(origin?.y ?? 0)),
        splitDifference(Number(value?.z ?? 0), Number(origin?.z ?? 0))
    );
    return target;
}

function splitDifference(value, origin) {
    // Math.fround로 high part를 float32에 맞춰 분리하고, 나머지를 low part로 계산합니다.
    // Cesium의 high/low split과 같은 목적의 간단한 정밀도 보정입니다.
    const valueHigh = Math.fround(value);
    const originHigh = Math.fround(origin);
    const valueLow = value - valueHigh;
    const originLow = origin - originHigh;
    return (valueHigh - originHigh) + (valueLow - originLow);
}

function writeOverlayTexel(texture, row, column, r, g, b, a) {
    // DataTexture는 RGBA float 배열이므로 row/column을 1차원 offset으로 변환해 직접 씁니다.
    const offset = ((row * TERRAIN_OVERLAY_SHADER.TEXTURE_WIDTH) + column) * 4;
    const data = texture.image.data;

    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = a;
}

/**
 * terrain material이 직접 참조하는 layer별 render binding을 만듭니다.
 * binding은 layer를 역참조하지 않으므로 WeakMap key인 layer가 사라지면 함께 회수될 수 있습니다.
 */
function createTerrainStampRenderBinding() {
    const uniforms = {
        compositeEnabled: {value: false},
        compositeColor: {value: new Vector4(0, 0, 0, 0)},
        plainRowLimit: {value: 0},
        rowCoverage: {value: TERRAIN_STAMP_EMPTY_ROW_COVERAGE},
        rowFill: {value: TERRAIN_STAMP_EMPTY_ROW_FILL},
        // 현재 draw call에서 shader가 검사할 stamp 개수입니다.
        // tile별 필터링 결과(tileStampDataTextureCache + maxStampsPerTile)에 따라 render 직전에 값이 바뀝니다.
        count: {value: 0},
        // terrain tile의 world 원점과 stamp data texture의 기준 원점 차이입니다.
        // 큰 world 좌표를 shader float에서 직접 다루면 정밀도 손실이 생기므로 상대 좌표로 맞춰서 계산합니다.
        objectRelative: {value: new Vector3()},
        // shader derivative는 framebuffer pixel 기준이므로 CSS pixel 두께와 맞추기 위한 renderer 배율입니다.
        pixelRatio: {value: 1},
        // stamp 도형/색상/texture 매핑 정보를 숫자로 저장한 DataTexture입니다.
        // 실제 PNG 이미지가 아니라, point/radius/color/atlas UV 같은 메타데이터가 row 단위로 들어갑니다.
        stampDataTexture: {value: getEmptyTerrainStampDataTexture()},
        // stampDataTexture의 크기입니다.
        // x는 stamp 하나의 column 수, y는 현재 연결된 texture의 실제 row 수입니다.
        stampDataTextureSize: {value: new Vector2(TERRAIN_OVERLAY_SHADER.TEXTURE_WIDTH, 1)},
        // stamp texture URL들을 한 장으로 모아둔 실제 이미지 atlas입니다.
        // stampDataTexture에는 이 atlas 안에서 사용할 UV 범위만 저장되고, 픽셀 샘플링은 shader가 이 textureAtlas에서 수행합니다.
        textureAtlas: {value: getTerrainOverlayTextureAtlas()},
    };

    return {
        activeCount: 0,
        uniforms,
    };
}

function getTerrainStampRenderBinding(layer, create = false) {
    if (!defined(layer) || (typeof layer !== 'object' && typeof layer !== 'function')) {
        return undefined;
    }

    let binding = _terrainStampRenderBindingByLayer.get(layer);
    if (!binding && create) {
        binding = createTerrainStampRenderBinding();
        _terrainStampRenderBindingByLayer.set(layer, binding);
    }
    return binding;
}

function createTerrainStampState(layer) {
    const renderBinding = getTerrainStampRenderBinding(layer, true);
    const uniforms = renderBinding.uniforms;
    const globalStampDataTexture = createOverlayTexture();

    // 같은 layer에서 state가 다시 만들어져도 기존 material이 가진 uniform 객체 참조는 바꾸지 않습니다.
    // 각 uniform의 value만 새 활성 state가 소유한 자원과 초기값으로 교체합니다.
    renderBinding.activeCount = 0;
    uniforms.count.value = 0;
    uniforms.compositeEnabled.value = false;
    uniforms.compositeColor.value.set(0, 0, 0, 0);
    uniforms.plainRowLimit.value = 0;
    uniforms.rowCoverage.value = TERRAIN_STAMP_EMPTY_ROW_COVERAGE;
    uniforms.rowFill.value = TERRAIN_STAMP_EMPTY_ROW_FILL;
    uniforms.objectRelative.value.set(0, 0, 0);
    uniforms.pixelRatio.value = 1;
    uniforms.stampDataTexture.value = globalStampDataTexture;
    uniforms.stampDataTextureSize.value.set(TERRAIN_OVERLAY_SHADER.TEXTURE_WIDTH, TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS);
    uniforms.textureAtlas.value = getTerrainOverlayTextureAtlas();

    return {
        renderBinding,
        cacheByStamp: new Map(),
        // entries/globalOrigin은 textureDirty가 false인 다음 tile draw에서도 그대로 필요합니다.
        // module 전역 scratch로 두면 다른 image layer가 갱신한 목록과 origin을 잘못 재사용할 수 있으므로 state별로 소유합니다.
        entries: [],
        entriesBounds: {minX: 0, minY: 0, maxX: 0, maxY: 0},
        hasEntriesBounds: false,
        tileStampCandidates: [],
        globalOrigin: new Vector3(),
        uniforms,
        globalStampDataTexture,                           // 전체 stamp 메타데이터
        globalTextureRevision: -1,                       // bounds 없는 draw가 마지막으로 직렬화한 세대
        tileStampDataTextureCache: new WeakMap(),          // tile별 후보 조합 참조. texture 소유권은 아래 Map에만 있다.
        tileBoundsScratch: {minX: 0, minY: 0, maxX: 0, maxY: 0}, // 동기 draw의 정규화 결과이며 cache에 참조를 보관하지 않는다.
        sharedTileStampDataTextures: new Map(),            // 활성 작업 집합을 보호하고 비활성 조합은 분할 회수한다.
        // 후보 조합 수명이 끝난 GPU 저장소는 layer 안에서만 빌려 쓰고 최종 해제한다.
        texturePool: INTERNAL.createTexturePool(),
        emptyTileStampData: {texture: getEmptyTerrainStampDataTexture(), count: 0, origin: new Vector3()},
        textureDirty: true,
        textureRevision: 0,
        atlasRevision: 0,
        textureFrame: 0,
        tracksTextureFrames: false,
        rendererFrame: undefined,
        textureRenderer: undefined,
        maxStampsPerTile: DEFAULT_MAX_STAMPS_PER_TILE,
    };
}

function getTerrainStampState(layer, create = false) {
    if (!defined(layer) || (typeof layer !== 'object' && typeof layer !== 'function')) {
        return undefined;
    }

    let state = _terrainStampStateByLayer.get(layer);
    if (!state && create) {
        state = createTerrainStampState(layer);
        state.layer = layer;
        _terrainStampStateByLayer.set(layer, state);
        _terrainStampStates.add(state);
    }
    if (state && !defined(state.layer)) {
        state.layer = layer;
    }
    return state;
}

function updateTerrainStampRenderBindingCount(state) {
    if (state?.renderBinding) {
        state.renderBinding.activeCount = state.cacheByStamp?.size ?? 0;
    }
}

/**
 * 더 이상 stamp를 갖지 않는 layer state와 해당 GPU texture를 해제합니다.
 * WeakMap만으로는 state를 순회할 수 없어 _terrainStampStates가 소유권을 가지며,
 * 마지막 stamp 제거 시 이 함수에서 그 강한 참조를 끊습니다.
 *
 * @param {object} state 비었는지 확인할 layer 상태입니다.
 * @param {function(import('three').DataTexture): void} [retire] texture 소유권을 모을 내부 함수이며 외부 callback은 참조 제거 뒤 실행합니다.
 */
function releaseTerrainStampState(state, retire = undefined) {
    if (!state || state.cacheByStamp?.size > 0) {
        return;
    }

    const layer = state.layer;
    const renderBinding = state.renderBinding;

    // 이미 컴파일된 terrain material은 이 binding을 계속 참조할 수 있습니다.
    // state 소유 texture를 dispose하기 전에 빈 texture로 먼저 바꿔 stale GPU 자원을 보지 않게 합니다.
    if (renderBinding) {
        renderBinding.activeCount = 0;
        renderBinding.uniforms.count.value = 0;
        renderBinding.uniforms.compositeEnabled.value = false;
        renderBinding.uniforms.compositeColor.value.set(0, 0, 0, 0);
        renderBinding.uniforms.plainRowLimit.value = 0;
        renderBinding.uniforms.rowCoverage.value = TERRAIN_STAMP_EMPTY_ROW_COVERAGE;
        renderBinding.uniforms.rowFill.value = TERRAIN_STAMP_EMPTY_ROW_FILL;
        renderBinding.uniforms.objectRelative.value.set(0, 0, 0);
        renderBinding.uniforms.pixelRatio.value = 1;
        renderBinding.uniforms.stampDataTexture.value = getEmptyTerrainStampDataTexture();
        renderBinding.uniforms.stampDataTextureSize.value.y = 1;
    }
    if (retire) {
        const texture = state.globalStampDataTexture;
        state.globalStampDataTexture = undefined;
        retire(texture);
    } else state.globalStampDataTexture?.dispose?.();
    // 활성 후보와 재사용 대기 저장소를 함께 반환하여 layer 종료 뒤 GPU 자원이 남지 않게 합니다.
    INTERNAL.releaseTexturePool(state, retire);
    state.textureRenderer = undefined;
    state.tileStampDataTextureCache = new WeakMap();
    state.cacheByStamp?.clear?.();
    state.entries?.splice?.(0);
    state.previousEntries?.splice?.(0);
    state.candidateIndex = undefined;
    state.tileStampCandidates?.splice?.(0);
    state.globalOrigin?.set?.(0, 0, 0);

    if (defined(layer)) {
        _terrainStampStateByLayer.delete(layer);
    }
    state.layer = undefined;
    state.renderBinding = undefined;
    _terrainStampStates.delete(state);
}

function releaseEmptyTerrainStampStates() {
    let emptyStates;
    for (const state of _terrainStampStates) {
        if (state.cacheByStamp.size === 0) {
            (emptyStates ??= []).push(state);
        }
    }
    if (emptyStates) {
        for (const state of emptyStates) releaseTerrainStampState(state);
    }
}

function markAllTerrainStampStatesDirty() {
    for (const state of _terrainStampStates) {
        state.textureDirty = true;
        state.atlasRevision++;
    }
}

function getTerrainStampAppState(app, create = false) {
    if (!defined(app) || (typeof app !== 'object' && typeof app !== 'function')) {
        return undefined;
    }

    let state = _terrainStampAppStates.get(app);
    if (!state && create) {
        state = {
            stamps: new Set(),
        };
        _terrainStampAppStates.set(app, state);
    }
    return state;
}

function registerTerrainStampApp(app, stamp) {
    const appState = getTerrainStampAppState(app, true);
    if (!appState) {
        return;
    }

    appState.stamps.add(stamp);

    if (typeof app?.setRenderBefore === 'function'
        && typeof app?.hasRenderBefore === 'function'
        && !app.hasRenderBefore(TERRAIN_STAMP_RENDER_BEFORE_KEY)) {
        app.setRenderBefore(TERRAIN_STAMP_RENDER_BEFORE_KEY, () => {
            UTerrainStamp.refreshAppLayerStates(app);
        });
    }
}

function unregisterTerrainStampApp(app, stamp) {
    const appState = getTerrainStampAppState(app, false);
    if (!appState) {
        return;
    }

    appState.stamps.delete(stamp);
    if (appState.stamps.size > 0) {
        return;
    }

    if (typeof app?.removeRenderBefore === 'function') {
        app.removeRenderBefore(TERRAIN_STAMP_RENDER_BEFORE_KEY);
    }
    _terrainStampAppStates.delete(app);
}

function isSameTerrainStampLayerList(a, b) {
    if (a === b) {
        return true;
    }

    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (!isSameTerrainStampLayer(a[i], b[i])) {
            return false;
        }
    }
    return true;
}

function getSearchLayers(app, targetLayer = undefined, sortedLayers = undefined) {
    let sortLayers = sortedLayers;
    if (!sortLayers) {
        const layers = app?.getImageLayers?.();
        if (!Array.isArray(layers) || layers.length === 0) {
            return [];
        }
        sortLayers = layers
            .map(layer => ({ layer, renderOrder: layer.getRenderOrder?.() ?? 0 }))
            .sort((a, b) => b.renderOrder - a.renderOrder)
            .map(({layer}) => layer);
    }
    if (sortLayers.length === 0) return sortLayers;

    if (defined(targetLayer)) {
        const resolvedTargetLayer = sortLayers.find(layer => isSameTerrainStampLayer(layer, targetLayer)) ?? targetLayer;
        const targetRenderOrder = resolvedTargetLayer.getRenderOrder?.() ?? targetLayer.getRenderOrder?.() ?? 0;
        sortLayers = sortLayers.filter(layer => (
            !isSameTerrainStampLayer(layer, resolvedTargetLayer)
            && (layer.getRenderOrder?.() ?? 0) > targetRenderOrder
        ));
    }
    
    // 공유 입력은 이 호출의 전체 정렬 단계에서 이미 중복을 제거했습니다.
    // target 필터는 배열을 수정하지 않으므로 target 없는 도장끼리 그대로 빌려 쓸 수 있습니다.
    return sortedLayers ? sortLayers : Array.from(new Set(sortLayers));
}

function isSameTerrainStampLayer(layer, targetLayer) {
    if (!defined(layer) || !defined(targetLayer)) {
        return false;
    }

    if (layer === targetLayer) {
        return true;
    }

    const layerId = layer._id;
    const targetId = targetLayer._id;
    if (defined(layerId) && defined(targetId) && layerId === targetId) {
        return true;
    }

    const layerName = layer.getName?.() ?? layer._name;
    const targetName = targetLayer.getName?.() ?? targetLayer._name;
    return defined(layerName) && defined(targetName) && layerName === targetName;
}

export {UTerrainStamp};
