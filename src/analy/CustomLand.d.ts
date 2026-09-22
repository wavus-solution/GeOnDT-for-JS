// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dHeightTilePayload } from "../3dLayer/U3dHeightXYZLayer.types.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { CustomLandCO, DemMask, DemTile } from "./CustomLand.types.js";
import type { UBox3 } from "../core/UBox3.js";
import type { UTextureLoader } from "../core/loader/UTextureLoader.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { UPlaneBufferGeometry } from "../geometry/UPlaneBufferGeometry.js";
import type { GeoPosition, GeoPositionVector3, WorldPositionVector3 } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
 * `편집지형`(CustomLand) 관련 클래스 <br>
 * 사용자가 편집한 지형을 나타내는 Object입니다.
 * @group analysis
 *
 * @example
 * let newLand = new CustomLand({
 *     id : '1',
 *     height : 50,
 *     inclineEdit : true,
 *     inclineRate : 10,
 *     geoVertex : [
 *         {x: 126.93775278049368, y: 37.51998524183169, z: 15},
 *         {x: 126.93794142670335, y: 37.51872412274371, z: 15.728418477226512},
 *         {x: 126.94001653500996, y: 37.51982849372652, z: 15}
 *     ]
 * });
 * @see UAnalyCustomLand
 */
declare class CustomLand {
    static textureDefaultUrl: string;
    static textureCache: Map<any, any>;
    /** @param {CustomLandCO} options */
    constructor(options: CustomLandCO);
    /** @type {number} */ beforeVolume: number;
    /** @type {number} */ volume: number;
    /** @type {number} */ cutVolume: number;
    /** @type {number} */ fillVolume: number;
    /** @type {number} */ inclineBeforeVolume: number;
    /** @type {number} */ inclineVolume: number;
    /** @type {import('three').Mesh | undefined} */ _inclineMesh: three.Mesh | undefined;
    /** @type {Array<GeoPosition>} */ _drawGeoVertex: Array<GeoPosition>;
    /** @type {Array<DemTile>} */ tiles: Array<DemTile>;
    /** @type {{contains: (point: object) => boolean, setSRID: (srid: number) => void} | undefined} */ geometry: {
        contains: (point: object) => boolean;
        setSRID: (srid: number) => void;
    } | undefined;
    /** @type {{contains: (point: object) => boolean, setSRID: (srid: number) => void} | undefined} */ inclineGeometry: {
        contains: (point: object) => boolean;
        setSRID: (srid: number) => void;
    } | undefined;
    uuid: string;
    id: any;
    name: any;
    drawArg: any;
    height: any;
    vertex: any;
    geoVertex: any;
    textureGeoVertex: any;
    oriVertex: any;
    box: any;
    center: any;
    geoCenter: any;
    url: any;
    heightScale: any;
    heightOffset: any;
    unitHeight: any;
    dataLevel: any;
    dataLayer: any;
    fixedResolution: any;
    tileMap: Map<any, any>;
    containShellCount: number;
    averageHeight: number;
    minHeight: number;
    maxHeight: number;
    insideError: boolean;
    inclineShellCount: number;
    test: number;
    state: string;
    _classtype: string;
    _inclineRate: any;
    _inclineEdit: any;
    _inclineVertex: any;
    _inclineGeoVertex: any;
    _inclineBox: any;
    _insideIncline: any;
    _insidePrecision: any;
    _inclineBevelThickness: any;
    _inclineBevelSize: any;
    _useTexture: any;
    _textureUrl: any;
    /** @type {import('@union3d/core/loader/UTextureLoader').UTextureLoader | undefined} */
    _textureLoader: UTextureLoader | undefined;
    /** @type {import('three').Texture | undefined} */
    _texture: three.Texture | undefined;
    /** @type {DeferredObject<void> | undefined} */
    _textureReady: DeferredObject<void> | undefined;
    _disposed: boolean;
    /**
     * 편집지형 경사면의 Z값(Incline ZValue)을 반환하는 함수
     * @param {number} x x값
     * @param {number} y y값
     * @param {number} z z값
     * @return {number} 경사면의 Z값 (미터 단위)
     */
    getInclineZValue(x: number, y: number, z: number): number;
    getResolutionMask(): Map<any, any>;
    /**
     * CustomLand의 도형과 그리드의 정점을 비교하여
     * 포함되는 정점만 계산하기 위해 Mask 생성
     * @param {DemTile} tile
     * @return {DemMask} mask
     *
     * @ignore
     */
    getTileMask(tile: DemTile): DemMask;
    /**
     * @param {Function | undefined} end
     * @param {Function | undefined} progressFunc
     */
    onLoadManager(end: Function | undefined, progressFunc: Function | undefined): void;
    /** @return {boolean} */
    isDisposed(): boolean;
    /** @return {boolean} */
    isUseTexture(): boolean;
    /**
     * 편집지형을 제거하는 함수
     */
    dispose(): void;
    /**
     * 편집된 지형의 id를 반환하는 함수
     * @return {string} 편집 지형 ID
     */
    getId(): string;
    /**
     * 편집된 지형의 고유 id를 반환하는 함수
     * @return {string} 편집 지형 고유 ID
     */
    getUid(): string;
    /**
     * 편집된 지형의 중심점을 반환하는 함수
     * @return {WorldPositionVector3} 편집 지형 중심점
     */
    getCenter(): WorldPositionVector3;
    /**
     * 편집된 지형의 이름을 반환하는 함수
     * @return {string} 편집 지형 이름
     */
    getName(): string;
    /**
     * 편집된 지형의 높이를 반환하는 함수
     * @return {number} 편집 지형 높이
     */
    getHeight(): number;
    /**
     * 편집된 지형의 기울기(Incline Rate)를 반환하는 함수
     * @return {number} 편집 지형 기울기
     */
    getInclineRate(): number;
    /**
     * 편집된 지형의 경사면 영역(Incline Box)을 반환하는 함수
     * @return {import('three').Box3 | undefined} Incline Box
     */
    getInclineBox(): three.Box3 | undefined;
    /**
     * 편집된 지형의 경사면 분석 여부를 반환하는 함수
     * @return {boolean} 경사면 분석 여부
     */
    getInclineEdit(): boolean;
    /**
     * 편집된 지형의 내부 경사면 분석 여부를 반환하는 함수
     * @return {boolean} 경사면 분석 여부
     */
    isInsideIncline(): boolean;
    /**
     * 편집된 지형의 바운딩박스 정보 반환
     * @return {import('@union3d/core/UBox3').UBox3 | undefined} 바운딩박스 정보
     *
     * @example
     * {
     *     max: {x: number, y: number, z: number},
     *     min: {x: number, y: number, z: number},
     *     _center: {x: number, y: number, z: number, isVector3: Boolean}
     *     geoVertex: [
     *         {x: number, y: number, z: number},
     *         {x: number, y: number, z: number},
     *         ...
     *     ]
     * }
     */
    getBox(): UBox3 | undefined;
    clone(): void;
    /**
     * 편집 지형의 파라미터를 반환하는 함수
     * @return {CustomLandCO} 편집 지형 Parameter
     *
     * @example
     * {
     *     name: string,
     *     height: number,
     *     inclineEdit: boolean,
     *     inclineRate : number,
     *     geoVertex: array,
     *     insideIncline: boolean,
     *     insidePrecision: number,
     *     useTexture: boolean,
     *     textureUrl: string
     * }
     */
    getParameter(): CustomLandCO;
    /** @return {Array<GeoPositionVector3>} */
    getVertex(): Array<GeoPositionVector3>;
    /**
     * @param {CustomLandCO} parameter
     *
     * @example
     * {
     *     id : string,
     *     name : string,
     *     height : number,
     *     vertex : array,
     *     geoVertex: array,
     *     insideIncline: boolean,
     *     insidePrecision: number,
     *     useTexture: boolean,
     *     textureUrl: string
     * }
     *
     * @ignore
     */
    setParameter(parameter: CustomLandCO): void;
    /**
     * 편집된 지형의 높이를 수정하는 함수
     * @param {number} height 수정할 높이
     */
    setLandHeight(height: number): void;
    /**
     * 편집 지형의 현재 부피를 반환하는 함수
     * @param {Function} [progressFunc]
     * @return {Promise<CustomLand>}
     */
    getVolume(progressFunc?: Function): Promise<CustomLand>;
    /**
     * 편집지형의 부피 차이를 반환 하는 함수 (토공량) <br/>
     * 원본 부피 - 편집 부피
     * @return {number}
     */
    getDifference(): number;
    /**
     * 편집지형의 경사면 부피 차이를 반환 하는 함수 (토공량) <br/>
     * 원본 부피 - 편집 부피
     * @return {number}
     */
    getInclineDifference(): number;
    /**
     * @param {import('three').Mesh | import('@union3d/core/mesh/UMesh').UMesh} object
     */
    changeTexture(object: three.Mesh | UMesh): void;
    /**
     * @param {import('three').Mesh | import('@union3d/core/mesh/UMesh').UMesh} object
     * @param {import('@U3dLayer').U3dLayer} layer
     */
    removeTexture(object: three.Mesh | UMesh, layer: U3dLayer): void;
    /**
     * @param {import('@union3d/geometry/UPlaneBufferGeometry.js').UPlaneBufferGeometry} geometry
     * @return {boolean}
     */
    isInclude(geometry: UPlaneBufferGeometry): boolean;
    /**
     * @param {import('three').Mesh} mesh
     */
    _changeImage(mesh: three.Mesh): void;
    /**
     * @param {string} baseUrl
     * @param {Function | undefined} start
     * @param {Function | undefined} end
     * @param {Function | undefined} progress
     * @param {Function | undefined} progressFunc
     */
    _loadDem(baseUrl: string, start: Function | undefined, end: Function | undefined, progress: Function | undefined, progressFunc: Function | undefined): void;
    /**
     * @param {Function | undefined} start
     * @param {string} url
     * @param {number} loaded
     * @param {number} total
     */
    _onStartManager(start: Function | undefined, url: string, loaded: number, total: number): void;
    /**
     * @param {Function | undefined} progress
     * @param {string} url
     * @param {number} loaded
     * @param {number} total
     */
    _onProgressManager(progress: Function | undefined, url: string, loaded: number, total: number): void;
    /**
     * @param {string} url
     */
    _onErrorManager(url: string): void;
    /**
     * @param {DemTile} tile
     * @param {U3dHeightTilePayload} payload
     */
    _onLoad(tile: DemTile, payload: U3dHeightTilePayload): void;
    /**
     * @param {ProgressEvent} e
     */
    _onProgress(e: ProgressEvent): void;
    /**
     * @param {ErrorEvent | string} e
     */
    _onError(e: ErrorEvent | string): void;
    /**
     * @param {ProgressEvent | string} e
     */
    _onAbort(e: ProgressEvent | string): void;
    /**
     * CustomLand에 포함되는 타일정보 리턴
     * @return {Array<DemTile>} tiles
     *
     * @ignore
     */
    _getTiles(): Array<DemTile>;
    #private;
}

export type { CustomLand };
