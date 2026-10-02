// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer, U3dLayerCO } from "./U3dLayer.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { UTerrainMesh } from "../core/mesh/UTerrainMesh.js";
import type { UCanvasTexture } from "../core/texture/UCanvasTexture.js";
import type { UTexture } from "../core/texture/UTexture.js";
import type { UShaderTerrainDecalManager } from "../manager/terrain/UShaderTerrainDecalManager.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { LRUCache } from "../util/LRUCache.js";
import type { DeferredObject } from "../util/deferred.js";

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 * 영상 데이터를 가시화 시키는 이미지 레이어 클래스
 *
 * @group 3dLayer
 *
 * @extends {U3dLayer}
 */
declare class U3dImageLayer extends U3dLayer {
    /**
     * U3dImageLayer 생성자입니다.
     *
     * @param {U3dImageLayerCO} [opt={}] 생성자 옵션
     */
    constructor(opt?: U3dImageLayerCO);
    /**
     * 타일 키별로 현재 유효한 이미지 요청 하나만 보관합니다. <br>
     * `#` private 필드로 선언하지 않는 이유는 WMS, XYZ, PBF 등 하위 이미지 레이어가 자신의 프로토콜 특성에
     * 맞춰 현재 요청을 검사하거나 요청 상태에 관측 정보를 덧붙일 수 있어야 하기 때문입니다. 하위 레이어가
     * 이 Map을 확장할 때도 항목을 임의로 삭제하지 말고 반드시 상태 객체의 `cancel()` 또는 공통 완료 경로를
     * 사용해야 로딩 카운터, 네트워크 요청, deferred가 함께 정리됩니다.
     *
     * @type {Map<string, ImageTextureRequestState>}
     *
     * @ignore
     */
    _activeTextureRequests: Map<string, ImageTextureRequestState>;
    /** @type {Array<number>} */ _burnLevels: Array<number>;
    /** @type {boolean} */ _flipY: boolean;
    /** @type {boolean} */ _forceTransparent: boolean;
    /** @type {Array<import('three').Plane> | null} */ _clippingPlanes: Array<three.Plane> | null;
    /** @type {number} */ _brightness: number;
    /** @type {number} */ _contrast: number;
    /** @type {number} */ _saturation: number;
    /** @type {number} */ _hueRotation: number;
    /** @type {import('three').ColorRepresentation} */ _lightColorTone: three.ColorRepresentation;
    /** @type {import('three').ColorRepresentation} */ _darkColorTone: three.ColorRepresentation;
    /** @type {boolean} */ _lightColorToneEnabled: boolean;
    /** @type {boolean} */ _darkColorToneEnabled: boolean;
    /** @type {number} */ _lightColorToneExposure: number;
    /** @type {number} */ _darkColorToneExposure: number;
    /** @type {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager | undefined} */ _terrainDecalManager: UShaderTerrainDecalManager | undefined;
    _parseFunction: any;
    _useDataCache: any;
    /**
     * 이미지 레이어가 수집한 타일 요청 로그의 깊은 복사본을 반환합니다. <br>
     * 호출자가 반환 객체를 수정해도 실제 순환 버퍼와 누적 통계가 바뀌지 않도록 JSON 직렬화 방식으로
     * 복사합니다. 평균값과 현재 요청 수처럼 매 작업마다 계산할 필요가 없는 값은 조회 시점에만 만들어
     * `debugLog=false`인 일반 실행뿐 아니라 장시간 측정 중인 실행의 기록 비용도 줄입니다.
     *
     * @override
     * @return {Record<string, any> | undefined} 이미지 타일 성능 관측 로그 복사본
     */
    override getDebugLog(): Record<string, any> | undefined;
    /**
     * 타일 텍스처 작업 하나에 대응하는 상세 측정 항목을 생성합니다.
     * debugLog가 꺼져 있으면 객체를 만들지 않고 즉시 반환하여 일반 실행 경로의 할당 비용을 없앱니다.
     *
     * @param {string} type 측정 작업 유형
     * @param {Record<string, any>} [detail] 타일, URL, 취소 설정 등 시작 시점의 정보
     * @return {Record<string, any> | undefined} 생성된 로그 항목
     */
    _startDebugLogEntry(type: string, detail?: Record<string, any>): Record<string, any> | undefined;
    /**
     * 동기 처리 구간의 경과 시간을 상세 항목에 기록합니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 항목
     * @param {string} name 측정 단계 이름
     * @param {number} startTime `imageDebugNow()`로 얻은 시작 시각
     */
    _recordDebugLogDuration(entry: Record<string, any> | undefined, name: string, startTime: number): void;
    /**
     * 네트워크, 부모 fallback, terrain swap처럼 비동기로 이어지는 구간의 시작 시각을 보관합니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 항목
     * @param {string} name 측정 지점 이름
     */
    _markDebugLogTime(entry: Record<string, any> | undefined, name: string): void;
    /**
     * 이전에 표시한 비동기 측정 지점부터 현재까지의 경과 시간을 기록합니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 항목
     * @param {string} resultName 결과 필드 이름
     * @param {string} markName 시작 지점 이름
     */
    _recordDebugLogSince(entry: Record<string, any> | undefined, resultName: string, markName: string): void;
    /**
     * summary의 단순 누적 카운터를 현재 로그 generation에만 반영합니다.
     *
     * @param {string} name summary 필드 이름
     * @param {number} [amount=1] 증가량
     * @param {Record<string, any> | undefined} [entry] generation 확인에 사용할 작업 항목
     */
    _recordImageDebugSummary(name: string, amount?: number, entry?: Record<string, any> | undefined): void;
    /**
     * 현재 진행 요청 수와 로딩 카운터의 peak를 summary에 반영합니다.
     *
     * @param {Record<string, any> | undefined} entry generation 확인에 사용할 작업 항목
     */
    _recordImageDebugActivePeaks(entry: Record<string, any> | undefined): void;
    /**
     * 측정 항목을 한 번만 완료하고 상태별 개수와 단계별 누적/최대 시간을 갱신합니다.
     *
     * @param {Record<string, any> | undefined} entry 완료할 측정 항목
     * @param {string} status success, cache-hit, fallback, error, cancelled, stale 중 결과
     * @param {Record<string, any>} [detail] 완료 원인과 마지막 상태
     */
    _finishDebugLogEntry(entry: Record<string, any> | undefined, status: string, detail?: Record<string, any>): void;
    /**
     * debugLog가 활성화된 코드에서만 고해상도 현재 시각을 조회합니다.
     *
     * @return {number} 밀리초 단위 현재 시각
     */
    _getDebugLogTime(): number;
    /**
     * @override
     *
     * @return {boolean}
     *
     * @ignore
     */
    override initialize(): boolean;
    /**
     * 레이어가 출력하는 객체의 밝기 값을 반환합니다.
     * @return {number} 밝기값
     */
    getBrightness(): number;
    /**
     * 레이어가 출력하는 객체의 대비 값을 반환합니다.
     * @return {number} 대비값
     */
    getContrast(): number;
    /**
     * 레이어가 출력하는 객체의 채도 값을 반환합니다.
     * @return {number} 채도값
     */
    getSaturation(): number;
    /**
     * 레이어가 출력하는 객체의 색조 회전각을 도 단위로 반환합니다.
     * @return {number} 색조 회전각(도)
     */
    getHueRotation(): number;
    /**
     * 레이어가 출력하는 객체의 밝은 영역 색상톤 값을 반환합니다.
     * @return {import('three').ColorRepresentation} 밝은 영역 색상톤 값
     */
    getLightColorTone(): three.ColorRepresentation;
    /**
     * 레이어가 출력하는 객체의 어두운 영역 색상톤 값을 반환합니다.
     * @return {import('three').ColorRepresentation} 어두운 영역 색상톤 값
     */
    getDarkColorTone(): three.ColorRepresentation;
    /**
     * 밝은 색상톤 적용 여부를 반환합니다.
     * @return {boolean} 밝은 색상톤 적용 여부
     */
    getLightColorToneEnabled(): boolean;
    /**
     * 어두운 색상톤 적용 여부를 반환합니다.
     * @return {boolean} 어두운 색상톤 적용 여부
     */
    getDarkColorToneEnabled(): boolean;
    /**
     * 레이어가 출력하는 객체의 밝은 색 적용 민감도를 반환합니다.
     * @return {number} 밝은 색 적용 민감도
     */
    getLightColorToneExposure(): number;
    /**
     * 레이어가 출력하는 객체의 어두운 색 적용 민감도를 반환합니다.
     * @return {number} 어두운 색 적용 민감도
     */
    getDarkColorToneExposure(): number;
    /**
     * 레이어가 출력하는 객체의 밝기 값을 설정합니다.
     * @param {number} val 밝기값
     * @return {this}
     */
    setBrightness(val: number): this;
    /**
     * 레이어가 출력하는 객체의 대비 값을 설정합니다.
     * @param {number} val 대비값
     * @return {this}
     */
    setContrast(val: number): this;
    /**
     * 레이어가 출력하는 객체의 채도 값을 설정합니다.
     * @param {number} val 채도값
     * @return {this}
     */
    setSaturation(val: number): this;
    /**
     * 레이어가 출력하는 객체의 색조각도 값을 설정합니다.
     * @param {number} val 색조각도 값
     * @return {this}
     */
    setHueRotation(val: number): this;
    /**
     * 레이어가 출력하는 객체의 밝은 영역 색상톤 값을 설정합니다.
     * @param {import('three').ColorRepresentation | null} val 색상톤 값, `null` 입력 시 흰색으로 초기화
     * @return {this}
     */
    setLightColorTone(val: three.ColorRepresentation | null): this;
    /**
     * 레이어가 출력하는 객체의 어두운 영역 색상톤 값을 설정합니다.
     * @param {import('three').ColorRepresentation | null} val 색상톤 값, `null` 입력 시 검은색으로 초기화
     * @return {this}
     */
    setDarkColorTone(val: three.ColorRepresentation | null): this;
    /**
     * 밝은 색상톤 적용 여부를 설정합니다.
     * @param {boolean | null} val 적용 여부, `null` 입력 시 기본값으로 초기화
     * @return {this}
     */
    setLightColorToneEnabled(val: boolean | null): this;
    /**
     * 어두운 색상톤 적용 여부를 설정합니다.
     * @param {boolean | null} val 적용 여부, `null` 입력 시 기본값으로 초기화
     * @return {this}
     */
    setDarkColorToneEnabled(val: boolean | null): this;
    /**
     * 밝은 색 적용 민감도를 설정합니다.
     * @param {number | null} val 밝은 색 적용 민감도, `null` 입력 시 기본값으로 초기화
     * @return {this}
     */
    setLightColorToneExposure(val: number | null): this;
    /**
     * 어두운 색 적용 민감도를 설정합니다.
     * @param {number | null} val 어두운 색 적용 민감도, `null` 입력 시 기본값으로 초기화
     * @return {this}
     */
    setDarkColorToneExposure(val: number | null): this;
    /**
     * 레이어에 클리핑 평면을 설정합니다. <br>
     * 인자가 비어 있으면 기존에 설정된 클리핑 평면을 제거합니다.
     *
     * @param {...import('three').Plane} clippingPlanes 클리핑 평면 리스트
     */
    setClippingPlanes(...clippingPlanes: three.Plane[]): void;
    /**
     * 현재 설정된 클리핑 평면 목록을 반환합니다.
     *
     * @return {Array<import('three').Plane> | null} 설정된 클리핑 평면 배열.
     */
    getClippingPlanes(): Array<three.Plane> | null;
    /**
     * 레이어의 데이터 캐시(LRU 캐시)를 반환합니다.
     *
     * @return {import('@util/LRUCache').LRUCache | undefined} 데이터 캐시 객체.
     */
    getDataCache(): LRUCache | undefined;
    /**
     * 데이터 캐시를 비우고 내부 자원을 정리합니다.
     *
     * @override
     *
     * @return {any}
     */
    override dispose(): any;
    /**
     * 입력 받은 타일을 해제합니다. <br>
     * 데이터 캐시에 동일 키가 있으면 얕은(shallow) 정리 콜백을 함께 전달합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 해제할 타일
     * @param {Partial<{deletefunc: (function(import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer, (import('three').Object3D | import('three').Material)): void)}>} [opt={}] 타일 해제 옵션. deletefunc는 현재 레이어를 this로 사용하며 삭제 항목 하나를 전달받습니다.
     * @returns {boolean | undefined} 삭제 완료 시 `true`, 보류되면 `false`입니다.
     */
    override disposeTile(tile: U3dQuadTile, opt?: Partial<{
        deletefunc: ((arg0: U3dImageLayer, arg1: (three.Object3D | three.Material)) => void);
    }>): boolean | undefined;
    /**
     * 이미지 요청 오류가 재시도할 필요가 없는 정상적인 빈 타일을 의미하는지 반환합니다. <br>
     * 공통 이미지 레이어는 오류를 임의로 빈 데이터로 해석하지 않으며, 프로토콜 의미를 아는 하위 레이어만
     * 이 메서드를 오버라이드하여 명시적인 종료 조건을 제공합니다.
     *
     * @param {unknown} error 로더가 전달한 원본 오류
     * @returns {boolean} 빈 타일로 완료할 수 있으면 `true`
     *
     * @ignore
     */
    _isEmptyTextureError(error: unknown): boolean;
    /**
     * 입력한 타일의 텍스처를 URL 에서 로드하여 적용합니다. <br>
     * 데이터 캐시에 동일 키가 존재하면 캐시 텍스처를 재사용합니다. <br>
     * 로드 실패 시 준비된 부모 텍스처로 즉시 대체하고, 부모가 준비되지 않았으면 작업을 종료하여 quadtree 재시도를 허용합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg DrawArg
     * @param {string} url 텍스처 URL
     * @param {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} [promise=deferred()] 작업 진행 상황을 전달할 deferred. 생략 시 내부에서 생성합니다.
     * @param {ImageTextureProcessOptions} [options] 하위 이미지 레이어가 선택하는 요청 처리 옵션
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile>} 작업 완료 시 resolve 되는 deferred 객체
     */
    processTexture(tile: U3dQuadTile, drawArg: UDrawArg, url: string, promise?: DeferredObject<U3dQuadTile>, options?: ImageTextureProcessOptions): Promise<U3dQuadTile>;
    /**
     * 요청별 논리 취소와 구세대 callback 차단을 적용한 이미지 타일 처리 경로입니다. <br>
     * 일반 래스터 이미지는 `UTextureLoader`의 전용 AbortController로 네트워크 요청까지 중단합니다. PBF/MVT
     * 파일 로더는 아직 요청 전용 handle을 반환하지 않으므로 논리 취소 후 늦게 도착한 callback만 차단합니다.
     * 이 메서드는 하위 이미지 레이어가 프로토콜별 전처리/후처리를 추가할 수 있도록 protected 성격의 `_`
     * 메서드로 제공합니다. 하위 구현은 `_activeTextureRequests`의 단일 소유자 규칙과 상태 객체의 `cancel()`
     * 종료 규칙을 유지해야 합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg DrawArg
     * @param {string} url 텍스처 URL
     * @param {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} promise 작업 deferred
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile>} 작업 deferred
     *
     * @ignore
     */
    _processTextureCancelable(tile: U3dQuadTile, drawArg: UDrawArg, url: string, promise: DeferredObject<U3dQuadTile>): Promise<U3dQuadTile>;
    /**
     * 요청별 실제 네트워크 취소를 사용하지 않는 기존 이미지 로딩 구현입니다. <br>
     * `processTexture(..., {abortNetwork:false})`를 명시한 특수 하위 레이어가 기존 로더와 callback 수명 규칙을
     * 그대로 사용할 수 있도록 호환 경로로 유지합니다. 일반 WMS/XYZ 요청은 이 메서드로 들어오지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg DrawArg
     * @param {string} url 텍스처 URL
     * @param {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} promise 작업 deferred
     * @return {Promise<import('@U3dQuadTile').U3dQuadTile>} 작업 deferred
     *
     * @ignore
     */
    _processTextureLegacy(tile: U3dQuadTile, drawArg: UDrawArg, url: string, promise: DeferredObject<U3dQuadTile>): Promise<U3dQuadTile>;
    /**
     * 매쉬의 머터리얼과 텍스처 맵을 해제합니다. <br>
     *
     * @param {import('three').Object3D} mesh 머터리얼을 해제할 매쉬
     */
    deleteMaterial(mesh: three.Object3D): void;
    /**
     * 매쉬의 지오메트리를 해제합니다.
     *
     * @param {import('three').Object3D} mesh 지오메트리를 해제할 매쉬
     */
    deleteGeometry(mesh: three.Object3D): void;
    /**
     * 매쉬 및 자식 매쉬를 재귀적으로 해제합니다. <br>
     * 매쉬의 머터리얼, 지오메트리, 자식들을 모두 해제하고 자체 dispose 메서드가 있다면 호출합니다.
     *
     * @param {import('three').Object3D | import('three').Material} mesh 해제할 매쉬 또는 머터리얼
     */
    deleteMesh(mesh: three.Object3D | three.Material): void;
    /**
     * 레이어 그룹에서 객체를 제거하고 깊은(deep) 방식으로 정리하는 콜백 함수입니다. <br>
     * 머터리얼·텍스처·지오메트리를 모두 해제하여 메모리에서 완전히 제거합니다.
     *
     * @override
     *
     * @param {import('three').Object3D | import('three').Material} [object] 그룹에서 제거할 객체
     */
    override fncDeleteGroup(object?: three.Object3D | three.Material): void;
    /**
     * 입력 받은 타일이 현재 화면(scene)에 추가되어 있는지 확인하고, 추가되어 있으면 해당 객체를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 조회할 타일
     * @return {import('@UMesh').UMesh | undefined} 화면에 추가된 매쉬. 없으면 `undefined` 입니다.
     */
    override getTileFromScene(tile: U3dQuadTile): UMesh | undefined;
    /**
     * 입력받은 타일을 화면에(scene)에 추가하는 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @return {boolean} 작업 성공 여부. 성공하면 true, 실패면 false.
     *
     * @ignore
     */
    override addTileFromScene(tile: U3dQuadTile): boolean;
    /**
     * tile key에 해당하는 scene/cache 자원을 해제합니다.
     * terrain handoff가 진행 중이면 부모·자식 전환이 끝날 때까지 실제 해제를 보류합니다.
     *
     * @override
     *
     * @param {string} key 해제할 tile key입니다.
     * @param {Partial<{deletefunc: Function, terrainHandoffFinalizing: boolean}>} [opt] 삭제 옵션
     * @returns {boolean} 삭제 완료 시 `true`, terrain handoff로 보류되면 `false`입니다.
     *
     * @ignore
     */
    override disposeTileByKey(key: string, opt?: Partial<{
        deletefunc: Function;
        terrainHandoffFinalizing: boolean;
    }>): boolean;
    /**
     * handoff가 끝난 잔여물 메시를 씬 그룹에서 제거하고 자원을 해제합니다.
     * 잔여물은 dispose 시점에 이미 캐시에서 제외되었으므로, 같은 키로 새로 만들어진 작업물은 건드리지 않습니다.
     *
     * @param {string} key 잔여물이 속했던 tile key입니다.
     * @param {import('three').Object3D} mesh 정리할 잔여물 메시입니다.
     */
    disposeTerrainHandoffResidue(key: string, mesh: three.Object3D): void;
    /**
     * 화면(scene)에서 입력받은 타일을 제거하는 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @return {boolean} 작업 성공 여부. 성공하면 true, 실패면 false.
     *
     * @ignore
     */
    override removeTileFromScene(tile: U3dQuadTile): boolean;
    /**
     * 부모 타일의 텍스처를 잘라내어 자식 타일의 텍스처로 사용합니다. <br>
     * 자식 타일의 텍스처 로드에 실패했거나, burnLevels 에 지정된 레벨일 때 사용됩니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 생성할 자식 타일
     * @returns {boolean | DeferredObject<import('@U3dQuadTile').U3dQuadTile> | undefined} 생성 성공 시 `true`, 실패 시 `undefined` 를 반환합니다. <br>
     * 하위 레이어는 성공을 그 타일로 이행되는 Promise 호환 객체(`DeferredObject`)로 알릴 수 있으며, 호출부는 반환값을 참·거짓으로만 판정합니다.
     */
    createParentTexture(tile: U3dQuadTile): boolean | DeferredObject<U3dQuadTile> | undefined;
    /**
     * 입력 받은 타일에 텍스처를 생성/적용할지 여부를 판단하여 작업을 시작합니다. <br>
     * 가시화 여부, 레벨, BoundingBox 교차, burnLevels 등을 검사하여 텍스처 생성 흐름을 분기합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @param {Partial<{noParentTexture: boolean}>} [opt={}] 텍스처 생성 옵션
     * @return {boolean | Promise<import('@U3dQuadTile').U3dQuadTile>  | undefined | null}
     */
    override createTexture(tile: U3dQuadTile, opt?: Partial<{
        noParentTexture: boolean;
    }>): boolean | Promise<U3dQuadTile> | undefined | null;
    /**
     * 입력 받은 타일에 텍스처가 적용되어 있는지 확인합니다. <br>
     * 매쉬, 머터리얼, 텍스처 맵, 이미지의 로드 완료 여부를 모두 검사합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 타일
     * @return {boolean} 텍스처가 있으면 `true`, 없으면 `false` 를 반환합니다.
     */
    isTexture(tile: U3dQuadTile): boolean;
    /**
     * 입력 받은 타일로부터 지형(Terrain) 매쉬를 생성하고 캐시에 등록합니다. <br>
     * 머터리얼은 레이어의 투명도/렌더 순서/노멀 텍스처 설정을 반영합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 매쉬를 생성할 타일
     * @returns {import('@union3d/core/mesh/UTerrainMesh').UTerrainMesh} 생성된 지형 매쉬
     */
    createMeshFromTile(tile: U3dQuadTile): UTerrainMesh;
    /**
     * 입력 받은 타일의 머터리얼 `depthWrite` 값을 설정합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {boolean} val depthWrite 값
     */
    setDepthWrite(tile: U3dQuadTile, val: boolean): void;
    /**
     * 입력 받은 타일의 이미지 텍스쳐를 변경하는 함수
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 변경할 타일
     * @param {import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture} texture 새 이미지 텍스처
     *
     * @ignore
     */
    updateTileTexture(tile: U3dQuadTile, texture: UTexture | UCanvasTexture): void;
    /**
     * 이미지 작업 스케줄러와 동일한 기준으로 현재 타일의 표시 참여 여부를 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 타일입니다.
     * @returns {boolean} 현재 레이어가 타일 표시 준비에 참여하면 `true`입니다.
     *
     * @ignore
     */
    isTilePresentationParticipant(tile: U3dQuadTile): boolean;
    /**
     * 타일이 실제로 표시 가능한 상태인지(텍스처 + terrain uniform handoff 완료) 확인합니다.
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 표시 준비 상태를 확인할 tile입니다.
     * @returns {boolean} texture와 terrain uniform 전환이 완료되었으면 `true`입니다.
     *
     * @ignore
     */
    isTileRenderableReady(tile: U3dQuadTile): boolean;
    /**
     * 이미지 타일의 cache 객체가 실제 레이어 Group에 표시되어 있는지 확인합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 표시 상태를 확인할 타일입니다.
     * @returns {boolean} 자원이 살아 있고 Group에 부착되어 표시 중이면 `true`입니다.
     *
    * @ignore
    */
    isTilePresentationVisible(tile: U3dQuadTile): boolean;
    /**
     * 최신 terrain 합성 중에도 현재 이미지 Mesh가 직전 적용본으로 Coverage를 제공할 수 있는지 반환합니다.
     *
     * 최초 로드처럼 active material 이력이 없는 타일은 허용하지 않습니다. 이미 화면에 적용된
     * material과 살아 있는 binding이 함께 남은 경우에만 Quadtree가 자식 타일을 먼저 부착합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 기존 적용본을 확인할 타일입니다.
     * @returns {boolean} 직전 적용본으로 안전하게 화면 Coverage를 제공할 수 있으면 `true`입니다.
     *
     * @ignore
     */
    isTileRetainedPresentationSafe(tile: U3dQuadTile): boolean;
    #private;
}

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     * 생성자 옵션
     */
    type U3dImageLayerCO_Content = {
        /**
         * 레이어 투명 여부 `false`일 경우 `투명도`가 적용되지 않습니다.
         */
        transparent?: boolean;
        /**
         * 설정된 레벨의 타일 이미지는 부모 타일의 이미지를 내부적으로 렌더링하여 표출합니다.
         */
        burnLevels?: Array<number>;
        /**
         * 텍스쳐 UV Y축 반전 여부
         */
        flipY?: boolean;
        /**
         * 텍스처 파싱 커스텀 함수
         */
        parseFunction?: Function | null;
        /**
         * 데이터 캐시 사용 여부
         */
        useDataCache?: boolean;
        /**
         * 레이어가 출력하는 객체의 밝기 값
         */
        brightness?: number;
        /**
         * 레이어가 출력하는 객체의 대비 값
         */
        contrast?: number;
        /**
         * 레이어가 출력하는 객체의 채도 값
         */
        saturation?: number;
        /**
         * 레이어가 출력하는 객체의 색조각도 값
         */
        hueRotation?: number;
        /**
         * 레이어가 출력하는 객체의 색상톤 값
         */
        lightColorTone?: three.ColorRepresentation;
        /**
         * 어두운 영역에 적용할 색상톤 값
         */
        darkColorTone?: three.ColorRepresentation;
        /**
         * 밝은 색상톤 적용 여부
         */
        lightColorToneEnabled?: boolean;
        /**
         * 어두운 색상톤 적용 여부
         */
        darkColorToneEnabled?: boolean;
        /**
         * 밝은 색 적용 민감도
         */
        lightColorToneExposure?: number;
        /**
         * 어두운 색 적용 민감도
         */
        darkColorToneExposure?: number;
    };

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     * 생성자 옵션
     */
    type U3dImageLayerCO = Omit<Omit<U3dLayerCO, never> & U3dImageLayerCO_Content, never>;

/**
     * 텍스쳐 맵을 가진 머터리얼 확장 타입
     */
    type MaterialWithMap_Content = {
        map?: UTexture | UCanvasTexture | undefined;
        _oriMap?: UTexture | UCanvasTexture | undefined;
        transparent?: boolean;
        needsUpdate?: boolean;
        opacity?: number;
        /**
         * 이미지 레이어 기준 투명 상태 설정 함수
         */
        setTerrainBaseTransparent?: (transparent: boolean) => void;
        clippingPlanes?: Array<three.Plane> | null;
        depthWrite?: boolean;
    };

/**
     * 텍스쳐 맵을 가진 머터리얼 확장 타입
     */
    type MaterialWithMap = three.Material & MaterialWithMap_Content;

/**
     * 매쉬/머터리얼 통합 입력 타입
     */
    type MeshWithMaterial_Content = {
        material?: MaterialWithMap | Array<MaterialWithMap> | undefined;
        geometry?: three.BufferGeometry | undefined;
    };

/**
     * 매쉬/머터리얼 통합 입력 타입
     */
    type MeshWithMaterial = three.Object3D & MeshWithMaterial_Content;

/**
     * 이미지 타일 URL 작업의 선택 동작입니다. <br>
     * 이미지 타일은 화면에서 제외된 뒤 응답이 도착해도 더 이상 사용할 수 없으므로 요청별 취소를 기본으로
     * 사용합니다. 자체 worker나 외부 렌더러가 요청 수명을 관리하는 특수 하위 레이어만 `abortNetwork:false`를
     * 명시하여 기존 호환 경로를 선택합니다. 현재 실제 네트워크 AbortController는 일반 래스터 이미지 요청에
     * 적용되며, PBF/MVT처럼 별도 파일 로더를 사용하는 경로는 논리 작업만 취소되고 네트워크 중단은 후속 개선
     * 대상입니다.
     */
    type ImageTextureProcessOptions = {
        /**
         * 요청별 취소 경로를 사용할지 여부. 일반 래스터 이미지는 네트워크도 중단
         */
        abortNetwork?: boolean;
    };

/**
     * 하나의 타일 키에 대응하는 현재 이미지 요청 상태입니다. <br>
     * `_activeTextureRequests`에 저장되는 객체 형식을 문서화하여 하위 이미지 레이어가 요청 상태를 검사하거나
     * 전용 관측값을 추가할 때 기존 종료 규칙을 훼손하지 않도록 합니다.
     */
    type ImageTextureRequestState = {
        /**
         * 동일/상이 URL 교체 통계에 사용하는 관측용 요청 URL
         */
        url?: string;
        /**
         * 현재 로그 generation 안에서 요청을 구분하는 관측용 식별자
         */
        requestId?: number;
        /**
         * 취소가 요청되었는지 여부
         */
        cancelled: boolean;
        /**
         * deferred와 디버그 로그가 최종 종료되었는지 여부
         */
        logicalFinished: boolean;
        /**
         * `_countloadingTile` 증가분을 이 요청이 소유하는지 여부
         */
        loadingCounted: boolean;
        /**
         * 증가분을 이미 반환했는지 여부
         */
        loadingReleased: boolean;
        /**
         * 이 요청에 연결된 성능 관측 항목
         */
        debugEntry?: Record<string, any>;
        /**
         * 요청 전용 네트워크 제어 객체
         */
        networkHandle: undefined | ({
            cancel: () => boolean;
        } & Partial<{
            isCancelled: () => boolean;
            isSettled: () => boolean;
        }>);
        /**
         * 현재 요청을 멱등하게 취소하는 함수
         */
        cancel: (reason?: string) => void;
    };

/**
     * 머터리얼에 클리핑을 반영할 때 조회하는 최소 상태입니다.
     * 평면 배열은 레이어가 소유하며 반영 과정에서는 복사하거나 해제하지 않습니다.
     */
    type U3dImageLayerClippingState = {
        /**
         * 현재 클리핑 평면 목록입니다.
         */
        _clippingPlanes: Array<three.Plane> | null;
    };

export type { ImageTextureProcessOptions, ImageTextureRequestState, MaterialWithMap, MaterialWithMap_Content, MeshWithMaterial, MeshWithMaterial_Content, U3dImageLayer, U3dImageLayerCO, U3dImageLayerCO_Content, U3dImageLayerClippingState };
