// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCustomLand } from "../analy/UAnalyCustomLand.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UCache } from "./UCache.js";
import type { UCamera } from "./UCamera.js";
import type { UCollapse } from "./UCollapse.js";
import type { UFrustum } from "./UFrustum.js";
import type { URenderer } from "./URenderer.js";
import type { UScene } from "./UScene.js";
import type { ULight } from "../env/ULight.js";
import type { UGPoint } from "../math/UGPoint.js";
import type { UGeoRect } from "../math/UGeoRect.js";
import type { UMapControls } from "../mode/UMapControls.js";
import type { U3dQuadModelTile } from "../quadtree/U3dQuadModelTile.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

type UDrawArgQuantizedHeightCacheItem = {
    /**
     * 구글 스케일이 적용된 height z 값.
     */
    z: number;
    /**
     * height를 추출한 tile level.
     */
    level: number;
    /**
     * height를 추출한 terrain tile cache key.
     */
    tileKey: string | undefined;
};

/**
 * @typedef {object} UDrawArgRenderHeightQuery
 * @property {{level: number, tile: import('@U3dQuadTile').U3dQuadTile}|undefined} [tileCursor] 직전에 찾은 tile 캐시. 다음 좌표도 같은 tile 안에 있으면 다시 찾지 않고 이 tile을 재사용한다.
 * @property {number|undefined} [lastSuccessfulLevel] 마지막으로 유효한 height를 얻은 level (성공 레벨)
 * @property {number} cacheWriteCount 현재 batch에서 height cache에 저장한 횟수.
 */
/**
 * @typedef {object} UDrawArgQuantizedHeightCacheItem
 * @property {number} z 구글 스케일이 적용된 height z 값.
 * @property {number} level height를 추출한 tile level.
 * @property {string|undefined} tileKey height를 추출한 terrain tile cache key.
 */
/**
 * 3D 화면(scene)에 Object를 표출(그리기)하는데 사용되는 클래스 <br>
 * 좌표계 변환이나 타일이나 레이어를 관리 하기 위한 속성 및 함수로 구성
 * 주 사용처: U3dApp에서 화면 갱신과 타일/레이어 조회에 필요한 draw context로 생성하며, terrain tile, image layer, model layer, control 계열에서 렌더링 보조 정보에 접근할 때 사용한다.
 * 사용처 점검: U3dApp.createDrawArg는 gr3dRect 인자를 추가로 넘기지만 현재 constructor는 해당 값을 받거나 저장하지 않는 기존 흐름을 유지한다.
 * @summary 3D 화면에 Object를 표출(그리기)하는데 사용되는 클래스
 *
 * @ignore
 *
 */
declare class UDrawArg {
    /**
     * @param {import('@U3dApp').U3dApp} app 앱 인스턴스.
     * @param {import('@UScene').UScene} scene 렌더링 대상 메인 scene.
     * @param {import('@UScene').UScene} sceneComment comment 표시용 메인 scene.
     * @param {import('@UCamera').UCamera} camera 렌더링에 사용할 메인 camera.
     * @param {import('@UFrustum').UFrustum} frustum 가시 영역 판정에 사용할 frustum.
     * @param {import('@UGeoRect').UGeoRect} grRect 렌더링 기준 Google rectangle.
     *
     * @ignore
     */
    constructor(app: U3dApp, scene: UScene, sceneComment: UScene, camera: UCamera, frustum: UFrustum, grRect: UGeoRect);
    /**
     * 앱 인스턴스.
     * @type {import('@U3dApp').U3dApp | any | undefined}
     */
    _app: U3dApp | any | undefined;
    /**
     * 렌더러 인스턴스.
     * @type {import('@URenderer').URenderer | undefined}
     */
    _renderer: URenderer | undefined;
    /**
     * 렌더링에 사용할 camera.
     * @type {import('@UCamera').UCamera | undefined}
     */
    _camera: UCamera | undefined;
    /**
     * 렌더링 대상 scene.
     * @type {import('@UScene').UScene | undefined}
     */
    _scene: UScene | undefined;
    /**
     * comment 표시용 scene.
     * @type {import('@UScene').UScene | undefined}
     */
    _sceneComment: UScene | undefined;
    /**
     * 가시 영역 판정에 사용할 frustum.
     * @type {import('@UFrustum').UFrustum | undefined}
     */
    _frustum: UFrustum | undefined;
    /**
     * 렌더링 기준 Google rectangle.
     * @type {import('@UGeoRect').UGeoRect | undefined}
     */
    _grRectangle: UGeoRect | undefined;
    /**
     * 업데이트되어 작업이 완료된 QuadTile이 저장되는 Cache
     * @type {import('@union3d/core/UCache').UCache}
     */
    _cacheTiles: UCache;
    /**
     * 근접한 좌표의 render height를 빠르게 재사용하기 위한 양자화 캐시.
     * @type {Map<number, UDrawArgQuantizedHeightCacheItem>}
     */
    _quantizedHeightCache: Map<number, UDrawArgQuantizedHeightCacheItem>;
    /**
     * 마지막 render height 성능 테스트 결과.
     * @type {object | undefined}
     */
    _lastRenderHeightPerformanceTest: object | undefined;
    /**
     * 업데이트되어 작업이 완료된 QuadModelTile이 저장되는 Cache
     * @type {import('@union3d/core/UCache').UCache}
     */
    _cacheModelTiles: UCache;
    /**
     * 검색 중인 tile 수.
     * @type {number}
     */
    _searchTileCount: number;
    /**
     * 검색 기준 위치.
     * @type {import('three').Vector3 | undefined}
     */
    _searchPosition: three.Vector3 | undefined;
    /**
     * terrain shadow 적용 기준 level.
     * @type {number}
     */
    _terrainShadowLevel: number;
    /**
     * UDrawArg가 보관한 app, scene, camera, frustum, cache 참조를 해제한다.
     * 주 사용처: U3dApp.dispose에서 앱 종료 시 _drawArg를 정리할 때 호출한다.
     * 사용처 점검: constructor가 app 또는 scene 누락으로 조기 return한 경우 cache가 없을 수 있으나, 현재 정상 생성된 UDrawArg를 dispose하는 흐름이 유지된다.
     * @returns {void}
     *
     * @ignore
     */
    dispose(): void;
    /**
     * terrain shadow를 적용할 최소 terrain tile level을 반환한다.
     * 주 사용처: U3dApp.getTerrainShadowLevel 공개 래퍼와 UTileMesh 생성 시 tile._rlevel 기준 shadow 적용 여부 판단에 사용한다.
     * 사용처 점검: UTileMesh는 tile._drawArg가 정상 UDrawArg라고 가정하고 호출하므로 drawArg가 비정상 객체로 대체되면 shadow level 조회가 실패할 수 있다.
     * @returns {number} terrain shadow 적용 기준 level.
     *
     * @ignore
     */
    getTerrainShadowLevel(): number;
    /**
     * terrain shadow를 적용할 최소 terrain tile level을 설정한다.
     * 주 사용처: U3dApp.setTerrainShadowLevel 공개 래퍼에서 사용자 설정 값을 UDrawArg에 저장할 때 사용한다.
     * @param {number} [terrainShadowLevel=13] terrain shadow 적용 기준 level.
     * @returns {void}
     *
     * @ignore
     */
    setTerrainShadowLevel(terrainShadowLevel?: number): void;
    /**
     * 검색 기준 위치(searchPosition)를 반환한다.
     * 주 사용처: U3dApp.getSearchPosition 공개 래퍼에서 사용한다.
     * 사용처 점검: 검색 위치가 설정되지 않은 초기 상태나 clearSearchPosition 호출 후에는 undefined를 반환하는 현재 흐름을 유지한다.
     * @returns {import('three').Vector3 | undefined} 검색 기준 위치.
     *
     * @ignore
     */
    getSearchPosition(): three.Vector3 | undefined;
    /**
     * 검색 기준 위치를 설정한다.
     * 주 사용처: U3dApp.setSearchPosition에서 worldX, worldY를 Vector3로 변환해 drawArg 검색 기준점으로 저장할 때 사용한다.
     * @param {import('three').Vector3} position 검색 기준 위치.
     * @returns {void}
     *
     * @ignore
     */
    setSearchPosition(position: three.Vector3): void;
    /**
     * 검색 기준 위치를 초기화한다.
     * 주 사용처: U3dApp.clearSearchPosition 공개 래퍼에서 사용한다.
     * @returns {void}
     *
     * @ignore
     */
    clearSearchPosition(): void;
    /**
     * 검색 기준 위치와 camera 위치 차이를 반영한 box를 반환한다.
     * 주 사용처: UDrawArg.intersectsBox에서 frustum과 box 교차 판정 전에 검색 기준 위치 보정을 적용할 때 사용한다.
     * 사용처 점검: searchPosition이 없으면 원본 box를 반환하고, box 또는 cameraPosition이 유효하지 않으면 undefined를 반환하는 현재 흐름을 유지한다.
     * @param {import('three').Box3} box 보정할 box.
     * @returns {import('three').Box3 | undefined} 보정된 box 또는 원본 box.
     *
     * @ignore
     */
    getSearchBox(box: three.Box3): three.Box3 | undefined;
    /**
     * 검색 기준 위치와 camera 위치 차이를 반영한 sphere center를 반환한다.
     * 주 사용처: UDrawArg.intersectsSphere에서 frustum plane과 sphere 중심점 거리 판정 전에 검색 기준 위치 보정을 적용할 때 사용한다.
     * 사용처 점검: searchPosition이 없으면 원본 sphere.center를 반환하고, sphere 또는 cameraPosition이 유효하지 않으면 undefined를 반환하는 현재 흐름을 유지한다.
     * @param {import('three').Sphere} sphere 중심점을 보정할 sphere.
     * @returns {import('three').Vector3 | undefined} 보정된 sphere center 또는 원본 sphere center.
     *
     * @ignore
     */
    getSearchSphereCenter(sphere: three.Sphere): three.Vector3 | undefined;
    /**
     * 검색 중인 tile 수를 반환한다.
     * 주 사용처: U3dQuadSet.raiseSearchedEvent에서 남은 검색 tile 수를 확인해 SEARCHED 이벤트 발생 시점을 판단한다.
     * 사용처 점검: plusSearchTileCount와 minusSearchTileCount의 호출 균형에 의존하므로 카운트가 음수가 되면 SEARCHED 이벤트가 예상보다 빨리 발생할 수 있다.
     * @returns {number} 검색 중인 tile 수.
     *
     * @ignore
     */
    getSearchTileCount(): number;
    /**
     * 검색 중인 tile 수를 1 감소시킨다.
     * 주 사용처: U3dQuadTile.update, U3dQuadModelTile.update, U3dQuadSet.raiseSearchedEvent에서 tile 검색 또는 이벤트 처리 완료 후 카운트를 줄일 때 사용한다.
     * 사용처 점검: plusSearchTileCount와 짝을 맞춰 호출되는 것을 전제로 한다.
     * @returns {void}
     *
     * @ignore
     */
    minusSearchTileCount(): void;
    /**
     * 검색 중인 tile 수를 1 증가시킨다.
     * 주 사용처: U3dQuadTile.update와 U3dQuadModelTile.update에서 하위 tile 검색을 시작하기 전에 카운트를 늘릴 때 사용한다.
     * 사용처 점검: 증가한 카운트는 이후 minusSearchTileCount 호출로 정리되어야 하며, 정리되지 않으면 SEARCHED 이벤트 발생이 지연될 수 있다.
     * @returns {void}
     *
     * @ignore
     */
    plusSearchTileCount(): void;
    /**
     * 검색 중인 tile 수를 0으로 초기화한다.
     * 주 사용처: U3dQuadSet.raiseSearchedEvent에서 남은 검색 tile 수가 없을 때 SEARCHED 이벤트를 발생시키기 직전에 카운트를 초기화한다.
     * 사용처 점검: 검색 진행 중 외부에서 호출되면 SEARCHED 이벤트 발생 시점에 영향을 줄 수 있으므로 현재 사용처처럼 완료 시점에서 호출되는 흐름을 전제로 한다.
     * @returns {void}
     *
     * @ignore
     */
    resetSearchTileCount(): void;
    /**
     * comment 표시용 scene을 반환한다.
     * 주 사용처: U3dModelDxfLayer에서 DXF label을 comment scene에 추가하거나 제거할 때 사용한다.
     * 사용처 점검: _app이 없으면 undefined를 반환하며, U3dModelDxfLayer는 반환값이 없을 때 오류 로그 후 작업을 중단한다.
     * @returns {import('@UScene').UScene | undefined} comment 표시용 scene.
     *
     * @ignore
     */
    getSceneComment(): UScene | undefined;
    /**
     * tile type에 따라 terrain 또는 model tile cache에 tile을 추가한다.
     * 주 사용처: UFrameState.finishWork, UModelFrameState.doWork, UModelFrameState.finishWork에서 작업 대상 child tile을 drawArg cache에 등록할 때 사용한다.
     * 사용처 점검: tile.getType() 값이 terrain/model이 아니면 저장되지 않으며, 현재 사용처는 U3dQuadTile과 U3dQuadModelTile 흐름에서 호출된다.
     * @param {string} key tile cache key.
     * @param {import('@U3dQuadTile').U3dQuadTile | import('@U3dQuadModelTile').U3dQuadModelTile} tile 저장할 tile.
     * @returns {void}
     *
     * @ignore
     */
    addTile(key: string, tile: U3dQuadTile | U3dQuadModelTile): void;
    /**
     * tile type에 맞는 cache에서 tile을 제거한다.
     * 주 사용처: U3dQuadTile.dispose와 U3dQuadModelTile.dispose에서 tile 폐기 시 terrain/model cache 항목을 제거할 때 사용한다.
     * 사용처 점검: type 기본값이 terrain이므로 model tile 제거 시 현재 사용처처럼 UDEF.TILE_TYPE.MODEL을 명시해야 한다.
     * @param {string} key 제거할 tile cache key.
     * @param {string} [type='terrain'] tile cache type.
     * @returns {void}
     *
     * @ignore
     */
    removeTile(key: string, type?: string): void;
    /**
     * tile type에 맞는 cache에서 tile을 조회한다.
     * 주 사용처: U3dApp.getTile 공개 래퍼, 여러 3dLayer의 terrain/model tile 조회, U3dQuadModelTile.searchTileHeight의 terrain tile 높이 참조에 사용한다.
     * 사용처 점검: type 기본값이 terrain이므로 model tile 조회 시 현재 사용처처럼 UDEF.TILE_TYPE.MODEL을 명시해야 하며, 일부 사용처는 반환값이 없을 수 있음을 검사한다.
     * @param {string} key 조회할 tile cache key.
     * @param {string} [type='terrain'] tile cache type.
     * @returns {import('@U3dQuadTile').U3dQuadTile | import('@U3dQuadModelTile').U3dQuadModelTile | undefined} 조회된 tile.
     *
     * @ignore
     */
    getTile(key: string, type?: string): U3dQuadTile | U3dQuadModelTile | undefined;
    /**
     * base image layer 이름을 반환한다.
     * 주 사용처: U3dApp.getInstanceBaseLayer에서 기준 image layer를 찾을 때 U3dApp.getNameBaseLayer 래퍼 흐름으로 사용된다.
     * 사용처 점검: _app이 없으면 undefined를 반환하므로 호출 측은 base layer 이름이 없을 수 있음을 고려해야 한다.
     * @returns {string | undefined} base image layer 이름.
     *
     * @ignore
     */
    getNameBaseLayer(): string | undefined;
    /**
     * base image layer 이름을 설정한다.
     * 주 사용처: U3dApp.setNameBaseLayer 래퍼 흐름에서 기준 image layer 이름을 변경할 때 사용된다.
     * 사용처 점검: _app이 없으면 설정하지 않고 종료하므로 UDrawArg가 정상 생성된 이후 호출되는 흐름을 전제로 한다.
     * @param {string} name base image layer 이름.
     * @returns {void}
     *
     * @ignore
     */
    setNameBaseLayer(name: string): void;
    /**
     * world 좌표와 level에 해당하는 terrain tile을 조회한다.
     * 주 사용처: getMaxLevelTileFromWorld와 getLevelTileFromWorld에서 level별 terrain tile cache 조회에 사용된다.
     * 사용처 점검: world 좌표와 level이 유효해야 UMathEngine.MetersToTile 결과로 만든 key가 실제 cache key와 일치한다.
     * @param {number} worldInX world x 좌표.
     * @param {number} worldInY world y 좌표.
     * @param {number} level 조회할 tile level.
     * @returns {import('@U3dQuadTile').U3dQuadTile | undefined} 조회된 terrain tile.
     *
     * @ignore
     */
    getTileFromWorld(worldInX: number, worldInY: number, level: number): U3dQuadTile | undefined;
    /**
     * app의 최대 level부터 지정된 최소 level까지 내려가며 world 좌표에 해당하는 terrain tile을 조회한다.
     * 주 사용처: getRenderHeightAtPoint, U3dLodComponentLayer, U3dVectorLayer에서 위치에 맞는 terrain tile을 찾아 높이 또는 tile index 기준으로 사용한다.
     * 사용처 점검: 반환값이 없을 수 있으므로 외부 사용처는 U3dLodComponentLayer와 U3dVectorLayer처럼 undefined 여부를 확인해야 한다.
     * @param {number} worldInX world x 좌표.
     * @param {number} worldInY world y 좌표.
     * @param {number} [limitLevel=5] 탐색을 멈출 최소 level.
     * @returns {import('@U3dQuadTile').U3dQuadTile | undefined} 조회된 terrain tile.
     *
     * @ignore
     */
    getMaxLevelTileFromWorld(worldInX: number, worldInY: number, limitLevel?: number): U3dQuadTile | undefined;
    /**
     * 지정된 level부터 기본 최소 level까지 내려가며 world 좌표에 해당하는 terrain tile을 조회한다.
     * 주 사용처: getRenderHeightAtPoint에서 높이 조회 실패 시 한 단계 낮은 tile을 찾고, U3dModelLayer.setTileFromEditedModel에서 편집 모델 위치의 tile을 재탐색할 때 사용한다.
     * 사용처 점검: level이 유효하지 않으면 cache key가 실제 tile과 맞지 않을 수 있으며, 반환값이 없을 수 있으므로 호출 측 확인이 필요하다.
     * @param {number} worldInX world x 좌표.
     * @param {number} worldIny world y 좌표.
     * @param {number} level 탐색을 시작할 tile level.
     * @returns {import('@U3dQuadTile').U3dQuadTile | undefined} 조회된 terrain tile.
     *
     * @ignore
     */
    getLevelTileFromWorld(worldInX: number, worldIny: number, level: number): U3dQuadTile | undefined;
    /**
     * x,y(google 좌표)에 해당하는 타일을 검색하고, 검색된 타일의 z 값을 추출하는 함수 (미터 스케일이 적용된 z 값)
     * @param {number} x google 좌표 X
     * @param {number} y google 좌표 Y
     * @param {{ useCache?: boolean, readCache?: boolean, writeCache?: boolean, maxCacheWritesPerBatch?: number }} [options={}] height 조회 옵션.
     * @return {number} 미터 스케일이 적용된 z (m)
     */
    getHeightAtPoint(x: number, y: number, options?: {
        useCache?: boolean;
        readCache?: boolean;
        writeCache?: boolean;
        maxCacheWritesPerBatch?: number;
    }): number;
    /**
     * @overload
     * @param {number} x google 좌표 X
     * @param {number} y google 좌표 Y
     * @param {{ useCache?: boolean, readCache?: boolean, writeCache?: boolean, maxCacheWritesPerBatch?: number }} [options={}] 근접 좌표 height cache 사용 여부
     * @returns {number} 구글 스케일이 적용된 z
     */
    getRenderHeightAtPoint(x: number, y: number, options?: {
        useCache?: boolean;
        readCache?: boolean;
        writeCache?: boolean;
        maxCacheWritesPerBatch?: number;
    }): number;
    /**
     * @overload
     * @param {Array<{x:number, y:number}> | Array<import('three').Vector2>} x google 좌표 배열
     * @param {undefined} [y]
     * @param {{ useCache?: boolean, readCache?: boolean, writeCache?: boolean, maxCacheWritesPerBatch?: number }} [options={}] 근접 좌표 height cache 사용 여부
     * @returns {Array<number>} 구글 스케일이 적용된 z 배열
     */
    getRenderHeightAtPoint(x: Array<{
        x: number;
        y: number;
    }> | Array<three.Vector2>, y?: undefined, options?: {
        useCache?: boolean;
        readCache?: boolean;
        writeCache?: boolean;
        maxCacheWritesPerBatch?: number;
    }): Array<number>;
    /**
     * render height 조회 성능을 비교하기 위한 테스트 함수.
     * UTestManager 규칙에 맞춰 boolean을 반환하고, 상세 결과는 _lastRenderHeightPerformanceTest와 console에 남긴다.
     *
     * 측정 방식에 대한 참고:
     * - 내부 타일은 한 번 접근하면 (useCache 옵션과 무관하게) 상주 캐시로 남기 때문에,
     *   측정 순서를 고정하면 먼저 실행되는 항목이 콜드 로딩 비용을 떠안고 뒤에 실행되는 항목이
     *   부당하게 유리해진다. 이를 줄이기 위해 (1) 측정 전에 모든 후보 함수로 동일하게 warmup하고,
     *   (2) 반복(repeat)마다 측정 순서를 순환(round-robin)시켜 잔여 편향을 분산시킨다.
     * - 모든 조회가 TERRAIN_NO_DATA로만 나오면(중심 좌표가 타일 범위 밖 등) 측정 자체가 무의미하므로
     *   최종적으로 validCount가 0인 경우 실패(false)로 취급한다.
     *
     * @param {boolean} [showLog=false] 테스트 결과 로그 출력 여부.
     * @param {import('@U3dApp').U3dApp | undefined} [app=this._app] 테스트에 사용할 app.
     * @param {{
     *     count?: number,
     *     spacing?: number,
     *     repeat?: number,
     *     warmup?: number,
     *     useCache?: boolean,
     *     includeRaycaster?: boolean,
     *     center?: {x:number, y:number}
     * }} [options={}] 테스트 옵션.
     * @returns {boolean} 테스트 실행 성공 여부(측정 도중 예외가 발생했거나, 모든 결과가 NO_DATA면 false).
     *
     * @ignore
     */
    __testRenderHeightAtPointPerformance(showLog?: boolean, app?: U3dApp | undefined, options?: {
        count?: number;
        spacing?: number;
        repeat?: number;
        warmup?: number;
        useCache?: boolean;
        includeRaycaster?: boolean;
        center?: {
            x: number;
            y: number;
        };
    }): boolean;
    /**
     * 전역 debug 모드 값을 설정한다.
     * 주 사용처: UDrawArg 직접 호출 사용처는 확인되지 않았고, 같은 UDEF.debug 값은 U3dApp.setDebug와 여러 분석/레이어의 debug 로그 조건에서 사용된다.
     * 사용처 점검: UDEF.debug는 전역 상태이므로 true로 설정하면 분석, 선택, LOD 모델 레이어 등의 debug 로그와 보조 표시 흐름에 함께 영향을 준다.
     * @param {boolean} val debug 모드 사용 여부.
     * @returns {void}
     *
     * @ignore
     */
    setDebug(val: boolean): void;
    /**
     * 전역 debug 모드 값을 반환한다.
     * 주 사용처: UDrawArg 직접 호출 사용처는 확인되지 않았고, U3dApp.isDebug와 여러 모듈의 UDEF.debug 조건문이 같은 값을 참조한다.
     * 사용처 점검: 반환값은 현재 UDEF.debug 값 그대로이므로 외부에서 UDEF.debug를 직접 변경한 경우에도 그 값이 반영된다.
     * @returns {boolean} debug 모드 사용 여부.
     *
     * @ignore
     */
    isDebug(): boolean;
    /**
     * Web Mercator meter 좌표를 지정 zoom의 pixel 좌표로 변환한다.
     * 주 사용처: U3dApp.MetersToPixels 래퍼에서 UDrawArg로 위임하는 구조로 사용된다.
     * 사용처 점검: px와 py 배열의 0번 값에 결과를 기록하는 in-place 변환이며, U3dApp.MetersToPixels 래퍼는 현재 _drawArg가 있으면 false를 반환하는 조건문이 있어 실제 위임 흐름을 확인할 필요가 있다.
     * @param {number} mx meter x 좌표.
     * @param {number} my meter y 좌표.
     * @param {number} zoom zoom level.
     * @param {Array<number>} px pixel x 결과를 받을 배열.
     * @param {Array<number>} py pixel y 결과를 받을 배열.
     * @returns {void}
     *
     * @ignore
     */
    MetersToPixels(mx: number, my: number, zoom: number, px: Array<number>, py: Array<number>): void;
    /**
     * touch event 위치를 renderer container 기준 NDC 2D 좌표로 변환한다.
     * 주 사용처: UDrawArg 직접 호출 사용처는 확인되지 않았고, UCollapse는 동일 목적의 자체 touch 좌표 변환 메서드를 사용한다.
     * 사용처 점검: event.touches[0], clientX/clientY, offsetX/offsetY와 _app._container 크기에 의존하므로 touch 정보나 container가 없으면 정상 좌표를 계산할 수 없다.
     * @param {TouchEvent & {clientX: number, clientY: number, offsetX: number, offsetY: number}} event touch 입력 event.
     * @returns {{x: number, y: number} | undefined} NDC 2D 좌표.
     *
     * @ignore
     */
    getPosition2DFromTouchPosition(event: TouchEvent & {
        clientX: number;
        clientY: number;
        offsetX: number;
        offsetY: number;
    }): {
        x: number;
        y: number;
    } | undefined;
    /**
     * screen event 위치를 renderer container 기준 NDC 2D 좌표로 변환한다.
     * 주 사용처: UDrawArg 직접 호출 사용처는 확인되지 않았고, UCollapse는 collapse picking에서 자체 screen 좌표 변환 메서드를 사용한다.
     * 사용처 점검: MouseEvent의 client/page/offset 좌표와 _app._container 크기에 의존하므로 container 크기가 0이거나 event 좌표가 비정상이면 결과도 비정상일 수 있다.
     * @param {MouseEvent} event screen 입력 event.
     * @returns {{x: number, y: number} | undefined} NDC 2D 좌표.
     *
     * @ignore
     */
    getPosition2DFromScreenPosition(event: MouseEvent): {
        x: number;
        y: number;
    } | undefined;
    /**
     * 현재 drawArg가 참조하는 camera를 반환한다.
     * 주 사용처: 분석 모듈, component position, quadtree에서 camera 위치와 quaternion을 읽어 picking, 추적, tile 갱신 판단에 사용한다.
     * 사용처 점검: 일부 사용처는 반환값을 바로 사용하므로 U3dApp.createCamera 또는 setCameraType 이후 정상 설정된 흐름을 전제로 한다.
     * @returns {import('@UCamera').UCamera | import('@UOrthographicCamera').UOrthographicCamera | undefined} 현재 camera.
     *
     * @ignore
     */
    getCamera(): UCamera | any | undefined;
    /**
     * drawArg가 참조하는 camera를 설정하고 설정된 camera를 반환한다.
     * 주 사용처: U3dApp.createCamera와 U3dApp.setCameraType에서 새 camera를 생성하거나 전환한 뒤 drawArg 참조를 갱신할 때 사용한다.
     * 사용처 점검: camera만 교체하므로 collapse나 control의 camera 참조는 U3dApp.setCameraType처럼 별도로 맞춰야 한다.
     * @param {import('@UCamera').UCamera | import('@UOrthographicCamera').UOrthographicCamera} camera 설정할 camera.
     * @returns {import('@UCamera').UCamera | import('@UOrthographicCamera').UOrthographicCamera} 설정된 camera.
     *
     * @ignore
     */
    setCamera(camera: UCamera | any): UCamera | any;
    /**
     * app의 map control을 반환한다.
     * 주 사용처: UAnalyLandScape와 U3dComponentPosition에서 camera 추적 또는 회전 상태 제어를 위해 control target과 모드를 참조할 때 사용한다.
     * 사용처 점검: _app 또는 _mapControl이 없으면 undefined가 반환될 수 있어, 일부 사용처처럼 camera/control 존재 여부 확인이 필요하다.
     * @returns {import('@union3d/mode/UMapControls').UMapControls | undefined} map control.
     *
     * @ignore
     */
    getCameraControl(): UMapControls | undefined;
    /**
     * app의 collapse 객체를 반환한다.
     * 주 사용처: UMapControlBase 생성자에서 picking과 지형 충돌 계산에 사용할 collapse 참조를 저장할 때 사용한다.
     * 사용처 점검: U3dApp.createCamera에서 collapse가 생성된 뒤 호출되는 흐름을 전제로 하며, _app 또는 collapse가 없으면 undefined가 반환될 수 있다.
     * @returns {import('@union3d/core/UCollapse').UCollapse | undefined} collapse 객체.
     *
     * @ignore
     */
    getCollapse(): UCollapse | undefined;
    /**
     * model tile 처리 정지 여부를 반환한다.
     * 주 사용처: U3dLayerList, U3dProcess, U3dQuadTileProcess, U3dModelLayer에서 model tile 삭제와 작업 실행 여부를 판단할 때 사용한다.
     * 사용처 점검: _app이 없으면 false를 반환하므로 app 없이 생성된 drawArg는 model 처리 정지 상태로 보지 않는 기존 흐름을 유지한다.
     * @returns {boolean} model tile 처리 정지 여부.
     *
     * @ignore
     */
    getStopModel(): boolean;
    /**
     * model tile 처리 정지 여부를 설정한다.
     * 주 사용처: U3dApp.applyAppFromParameter와 keepModelByDistance 계열 흐름에서 정적 model 유지 또는 해제를 전환할 때 사용한다.
     * 사용처 점검: _app이 없으면 false를 반환하며, app 구현은 undefined 입력을 true로 보정하므로 명시적인 boolean 전달이 안전하다.
     * @param {boolean} val model tile 처리 정지 여부.
     * @returns {void}
     *
     * @ignore
     */
    setStopModel(val: boolean): void;
    /**
     * 정적 model 유지 시 거리 기준 값을 설정한다.
     * 주 사용처: U3dApp.keepModelByDistance와 U3dModelLayer.update에서 model tile을 거리 기준으로 유지하거나 제거할 때 참조된다.
     * 사용처 점검: app 구현은 값 변경 시 update를 호출하므로 잦은 변경은 render/update 흐름을 추가로 발생시킬 수 있다.
     * @param {number} val model tile 유지 최대 거리.
     * @returns {void}
     * @ignore
     */
    setMaxDistanceModel(val: number): void;
    /**
     * 정적 model 유지 시 거리 기준 값을 반환한다.
     * 주 사용처: U3dModelLayer.update에서 getStopModel이 true일 때 disposeTileFromDistance 기준 거리로 사용한다.
     * 사용처 점검: _app이 없으면 undefined를 반환하므로 호출 측은 기존 사용처처럼 defined 확인 후 거리 기준으로 사용해야 한다.
     * @returns {number | undefined} model tile 유지 최대 거리.
     *
     * @ignore
     */
    getMaxDistanceModel(): number | undefined;
    /**
     * app update 정지 여부를 반환한다.
     * 주 사용처: U3dApp.update와 forceLoadModel 흐름에서 quadtree update 실행 여부를 판단할 때 사용된다.
     * 사용처 점검: _app 존재 확인 없이 위임하므로 drawArg가 정상 app을 가진 상태에서만 호출되는 기존 흐름을 전제로 한다.
     * @returns {boolean} app update 정지 여부.
     *
     * @ignore
     */
    isStopUpdate(): boolean;
    /**
     * app update 정지 여부를 설정한다.
     * 주 사용처: U3dApp.forceLoadModel에서 강제 model load 중 일반 update를 멈추고 완료 또는 오류 시 다시 해제할 때 사용된다.
     * @param {boolean} val app update 정지 여부.
     * @returns {void}
     *
     * @ignore
     */
    setStopUpdate(val: boolean): void;
    /**
     * terrain tile 크기 비율을 반환한다.
     * 주 사용처: U3dQuadTile.getTileSize에서 terrain tile update 가능 거리 계산에 사용할 tile 크기 비율로 참조한다.
     * 사용처 점검: _app이 없으면 1을 반환하므로 app 설정값이 없는 경우 기본 비율로 tile size를 계산하는 기존 흐름을 유지한다.
     * @returns {number} terrain tile 크기 비율.
     *
     * @ignore
     */
    getRatioTileSize(): number;
    /**
     * model tile 크기 비율을 반환한다.
     * 주 사용처: U3dQuadModelTile.getModelTileSize에서 model tile update 가능 거리 계산에 사용할 tile 크기 비율로 참조한다.
     * 사용처 점검: _app이 없으면 1을 반환하므로 app 설정값이 없는 경우 기본 비율로 model tile size를 계산하는 기존 흐름을 유지한다.
     * @returns {number} model tile 크기 비율.
     *
     * @ignore
     */
    getRatioModelTileSize(): number;
    /**
     * app의 height 처리 방식을 반환한다.
     * 주 사용처: UDrawArg 직접 호출 사용처는 확인되지 않았고, U3dApp에서 methodheight 옵션과 setMethodHeight 흐름으로 관리되는 값을 조회하는 위임 메서드이다.
     * 사용처 점검: _app이 없으면 undefined를 반환하므로 height 방식 값이 필요한 호출부는 반환값 확인이 필요하다.
     * @returns {string | undefined} height 처리 방식.
     *
     * @ignore
     */
    getMethodHeight(): string | undefined;
    /**
     * box가 현재 frustum 가시 영역과 교차하는지 확인한다.
     * 주요 사용처: U3dQuadTile, U3dQuadModelTile의 updatePossible에서 tile 갱신 가능 여부를 판단하고 U3dModelTilesLayer, U3dModelU3FLayer, U3dVectorTileLayer, U3dProcess에서 모델/벡터/작업 대상의 가시성 및 갱신 조건을 판단할 때 사용한다.
     * 사용처 점검: _frustum이 없거나 getSearchBox 결과가 없으면 false를 반환한다. searchPosition 보정은 getSearchBox를 통해 적용되며, 유효하지 않은 box가 들어오면 가시성 판정이 false로 떨어질 수 있다.
     * @param {import('three').Box3} box 교차 여부를 확인할 box.
     * @returns {boolean} frustum과 box가 교차하면 true.
     *
     * @ignore
     */
    intersectsBox(box: three.Box3): boolean;
    /**
     * sphere가 현재 frustum 가시 영역과 교차하는지 확인한다.
     * 주요 사용처: U3dModelI3FLayer의 root sphere 가시성 판단과 U3dModelU3FLayer, U3dVectorTileLayer의 sphere 기반 culling 조건에서 사용한다.
     * 사용처 점검: _frustum이 없거나 getSearchSphereCenter 결과가 없으면 false를 반환한다. FrustumOffset을 더한 수동 plane/radius 검사이므로 유효하지 않은 sphere center 또는 radius가 들어오면 교차 결과가 의도와 달라질 수 있다.
     * @param {import('three').Sphere} sphere 교차 여부를 확인할 sphere.
     * @returns {boolean} frustum과 sphere가 교차하면 true.
     *
     * @ignore
     */
    intersectsSphere(sphere: three.Sphere): boolean;
    /**
     * app의 height 처리 방식을 설정한다.
     * 주요 사용처: U3dApp 초기화에서 methodheight 옵션 기본값을 설정하고, app의 setMethodHeight가 DynamicSkirt1_0 renderBefore 등록/해제를 함께 관리한다.
     * 사용처 점검: _app이 있을 때만 app으로 위임하고 성공 여부를 boolean으로 반환한다. app 쪽에서 UDEF.HEIGHT_METHOD.NOW 전역 값과 renderBefore hook을 바꾸므로 유효하지 않은 값이 들어오면 height 방식 상태가 일관되지 않을 수 있다.
     * @param {string} val UDEF.HEIGHT_METHOD 값.
     * @returns {boolean} app에 설정을 위임했으면 true.
     *
     * @ignore
     */
    setMethodHeight(val: string): boolean;
    /**
     * 모델 이미지 갱신 거리 기준값을 반환한다.
     * 주요 사용처: U3dModelU3FLayer에서 texture/model image update 거리 임계값을 계산할 때 사용한다.
     * 사용처 점검: _app이 없으면 undefined를 반환한다. 호출부는 self._textureDistance fallback과 함께 사용하지만 두 값이 모두 없으면 거리 비교 결과가 의도와 달라질 수 있다.
     * @returns {number | undefined} 모델 이미지 갱신 거리 기준값.
     *
     * @ignore
     */
    getModelImageDistance(): number | undefined;
    /**
     * 모델 이미지 기본 level 값을 반환한다.
     * 주요 사용처: U3dModelU3FLayer에서 texture update 기본 이미지 level을 결정할 때 사용한다.
     * 사용처 점검: _app이 없으면 undefined를 반환하므로 호출부는 기본 level이 필요한 흐름에서 반환값 존재 여부를 고려해야 한다.
     * @returns {number | undefined} 모델 이미지 기본 level.
     *
     * @ignore
     */
    getModelImageDefaultLevel(): number | undefined;
    /**
     * 모델 이미지 갱신 거리 기준값을 app에 설정한다.
     * 주요 사용처: union3d 내부에서 UDrawArg.setModelImageDistance를 직접 호출하는 곳은 확인되지 않았고, U3dApp.setModelImageDistance의 drawArg 위임 메서드로 유지된다.
     * 사용처 점검: _app이 없으면 아무 값도 설정하지 않고 undefined를 반환한다. app 구현은 입력값 검증 없이 _modelImageDistance에 저장하므로 number가 아닌 값이 들어오면 모델 이미지 갱신 거리 비교가 의도와 달라질 수 있다.
     * @param {number} val 모델 이미지 갱신 거리 기준값.
     * @returns {void}
     *
     * @ignore
     */
    setModelImageDistance(val: number): void;
    /**
     * app의 light 객체를 반환한다.
     * 주요 사용처: U3dLayer와 U3dModelBasicLayer의 setApp에서 layer 내부 light 참조를 설정할 때 사용한다.
     * 사용처 점검: _app이 없으면 undefined를 반환한다. 일부 사용처는 optional chaining 없이 반환값을 저장하므로 이후 light 멤버 접근 전 존재 여부 확인이 필요하다.
     * @returns {import('@union3d/env/ULight').ULight | undefined} app의 light 객체.
     *
     * @ignore
     */
    getLight(): ULight | undefined;
    /**
     * app 데이터 갱신을 요청한다.
     * 주요 사용처: UTween의 start/update/complete/stop 흐름에서 camera 이동에 따른 갱신을 요청하고, app 내부의 여러 편집/로드 흐름에서 setUpdateDate를 간접 호출할 때 사용한다.
     * 사용처 점검: _app이 없으면 아무 작업도 하지 않는다. 현재 U3dApp.updateData는 전달 인자를 사용하지 않고 setUpdateDate만 호출하므로 event를 넘겨도 app 쪽에는 반영되지 않는다.
     * @param {unknown} [event] 갱신 요청과 함께 전달되는 부가 값.
     * @returns {void}
     *
     * @ignore
     */
    updateData(event?: unknown): void;
    /**
     * app의 update date를 갱신한다.
     * 주요 사용처: layer, model, road, 분석, 선택, view, controls 등 union3d 전반에서 렌더링 또는 데이터 재갱신이 필요할 때 호출한다.
     * 사용처 점검: _app이 없으면 아무 작업도 하지 않는다. U3dApp.setUpdateDate는 초기화 전 호출을 무시하므로 초기화 이전 호출은 갱신 신호로 반영되지 않는다.
     * @param {unknown} [date] 기존 이름을 유지한 update date 또는 event 값.
     * @returns {void}
     *
     * @ignore
     */
    setUpdateDate(date?: unknown): void;
    /**
     * 높이 편집 박스 목록을 반환한다.
     * 주요 사용처: U3dHeightLayer.updateGeometryWidthBoxList에서 custom land 편집 영역을 지형 geometry에 반영할지 판단할 때 사용한다.
     * 사용처 점검: optional chaining으로 _app이 없으면 undefined를 반환한다. U3dHeightLayer 사용처는 반환값의 size에 바로 접근하므로 app이 정상 설정된 drawArg를 전제로 한다.
     * @returns {Map<string, Set<import('@union3d/analy/UAnalyCustomLand').UAnalyCustomLand>> | undefined} 높이 편집 박스 목록.
     *
     * @ignore
     */
    getEditHeightBoxList(): Map<string, Set<UAnalyCustomLand>> | undefined;
    /**
     * terrain skirt 사용 여부를 반환한다.
     * 주요 사용처: U3dHeightXYZLayer.setApp에서 app의 skirt 설정을 height layer 내부 값으로 가져올 때 사용한다.
     * 사용처 점검: _app이 없으면 undefined를 반환한다. 반환값은 boolean 설정값이므로 호출부가 기본값을 별도로 보정하지 않으면 undefined가 skirt 비활성처럼 해석될 수 있다.
     * @returns {boolean | undefined} terrain skirt 사용 여부.
     *
     * @ignore
     */
    getSkirt(): boolean | undefined;
    /**
     * terrain skirt 사용 여부를 app에 설정한다.
     * 주요 사용처: union3d 내부에서 UDrawArg.setSkirt를 직접 호출하는 곳은 확인되지 않았고, app의 _skirt 설정을 drawArg에서 위임 변경할 수 있는 메서드로 유지된다.
     * 사용처 점검: _app이 없으면 아무 작업도 하지 않는다. 입력값 검증 없이 _app._skirt에 저장하므로 boolean이 아닌 값이 들어오면 높이 layer의 skirt 처리 조건이 의도와 달라질 수 있다.
     * @param {boolean} skirt terrain skirt 사용 여부.
     * @returns {void}
     *
     * @ignore
     */
    setSkirt(skirt: boolean): void;
    /**
     * app의 데이터 level을 반환한다.
     * 주요 사용처: union3d 내부에서 UDrawArg.getDataLevel을 직접 호출하는 곳은 확인되지 않았고, app의 region option에서 설정된 _datalevel을 조회하는 위임 메서드로 유지된다.
     * 사용처 점검: _app이 없으면 0을 반환한다. _app이 있어도 region option에 datalevel이 없으면 undefined가 반환될 수 있으므로 level 계산에 바로 쓰는 호출부는 기본값 처리가 필요하다.
     * @returns {number | undefined} 데이터 level.
     *
     * @ignore
     */
    getDataLevel(): number | undefined;
    /**
     * app의 terrain vertex level을 반환한다.
     * 주요 사용처: union3d 내부에서 UDrawArg.getVertexLevel을 직접 호출하는 곳은 확인되지 않았고, U3dApp.getVertexLevel을 위임해 terrain segment 기준 값을 조회할 수 있는 메서드로 유지된다.
     * 사용처 점검: _app이 없으면 undefined를 반환한다. app 초기화 시 vertex level에 따라 segVertex가 결정되므로 이 값이 필요한 흐름은 app 초기화 이후 호출되어야 한다.
     * @returns {number | undefined} terrain vertex level.
     *
     * @ignore
     */
    getVertexLevel(): number | undefined;
    /**
     * app의 pass level을 반환한다.
     * 주요 사용처: U3dApp.updateHeightLayers의 기본 minlevel, UFrameState와 UModelFrameState의 child tile 작업 조건, U3dQuadTile과 image/height layer의 tile level 통과 조건에서 사용한다.
     * 사용처 점검: _app이 없으면 0을 반환한다. _app._passlevel이 undefined이면 비교식에서 false처럼 동작할 수 있어 tile load/update 조건이 기대와 달라질 수 있다.
     * @returns {number | undefined} pass level.
     *
     * @ignore
     */
    getPassLevel(): number | undefined;
    getSegVertex(): any;
    getTerrainLayer(): any;
    getTerrainScene(): any;
    addTerrainFromTile(tile: any): void;
    traverseTiles(callback: any): boolean;
    removeTerrainFromTile(tile: any): void;
    getInstanceClassifiedLayers(opt: any): any;
    getInstanceLoadingLayers(): any;
    getInstanceTypeLayers(array: any): any;
    getInstanceBaseLayer(): any;
    getInstanceBaseHeightLayer(): any;
    getInstanceUserLayers(): any;
    getInstanceSceneUserLayers(): any;
    getInstanceImageAndUserLayers(): any;
    getInstanceImageLayers(): any;
    getInstanceHeightLayers(): any;
    getInstanceScenesFromModelLayers(): any;
    getInstanceScenesFromAll(): any;
    getInstanceScenesFromVisibleImageLayer(): any;
    getInstanceScenesFromVisibleImageLayers(): any;
    getInstanceScenesFromTerrainLayers(): any;
    getInstanceScenesFromModelAndTerrainLayers(): any;
    getInstanceTerrainLayers(): any;
    getInstanceModelAndTerrainLayers(): any;
    getInstanceModelLayers(): any;
    getInstanceModelAndGroupLayers(): any;
    getBox(): any;
    getImageLayerLength(): any;
    getHeightLayerLength(): any;
    getModelLayerLength(): any;
    getUserLayerLength(): any;
    setMode(mode: any): boolean;
    getMode(): any;
    clearMeasure(): boolean;
    addMeasurePoint(geo: any): any;
    getLayers(): any;
    getMeasureLayer(): any;
    getMeasureExtent(): any;
    getMeasureArea(): any;
    getTextPositionToMeasureArea(): any;
    getMeasureLength(): any;
    updateLayer(): void;
    setCameraGeographicPosition(geoX: any, geoY: any, Z: any, leftRotate: any, downRotate: any, targetZ: any): any;
    getRectangle(): UGeoRect;
    setWireFrameRendering(value: any): boolean;
    getWireFrameRendering(): any;
    getFrustumNearCenter(): three.Vector3;
    getCameraPosition(vector3?: three.Vector3, forward?: number): three.Vector3;
    getCameraTargetPosition(): any;
    getGoogleToWorld(x: any, y: any): UGPoint;
    getWorldToGoogle(worldX: any, worldY: any): UGPoint;
    updateHeight(tile: any, opt: any): boolean;
    getWorldToGeographic(worldX: any, worldY: any, worldZ?: number): UGPoint;
    getGeographicToWorld(geoX: any, geoY: any, height?: number): UGPoint;
    getGeographicToGoogle(geoX: any, geoY: any, height?: number): UGPoint;
    getGoogleToGeographic(googlex: any, googley: any, height?: number): UGPoint;
    loadingBar(): boolean;
    endloadingBar(time: any, func: any, param: any): boolean;
    draw(): boolean;
    update(): boolean;
    forceUpdate(list: any, event: any): boolean;
    getImproveValue(): any;
    #private;
}

export type { UDrawArg, UDrawArgQuantizedHeightCacheItem };
