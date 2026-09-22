// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayer } from "./U3dImageLayer.js";
import type { DecalOption, U3dPatternXYZLayerCO, UPatternDecalCO } from "./U3dPatternXYZLayer.types.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UTerrainMesh } from "../core/mesh/UTerrainMesh.js";
import type { UGPoint } from "../math/UGPoint.js";
import type { UGeoRect } from "../math/UGeoRect.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { LRUCache } from "../util/LRUCache.js";

/**
 * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer
 * @extends U3dImageLayer
 */
declare class U3dPatternXYZLayer extends U3dImageLayer {
    /**
     * @param {U3dPatternXYZLayerCO} [opt = {}]
     */
    constructor(opt?: U3dPatternXYZLayerCO);
    /**
     * update 매서드에서 mesh을 업데이트 할건지 여부를 판별할때 사용
     * @type {number}
     *
     * @ignore
     */
    _lastUpdateVersion: number;
    /**
     * update 매서드에서 mesh을 업데이트 할건지 여부를 판별할때 사용
     * @type {number}
     *
     * @ignore
     */
    _updateVersion: number;
    /**
     * 사용자가 입력한 생성자 옵션 및 레이어 옵션
     * @type {U3dPatternXYZLayerCO | null}
     */
    userOption: U3dPatternXYZLayerCO | null;
    /**
     * 데칼로 표현할 좌표 영역 리스트
     * @type {Array<UPatternDecal>}
     */
    decalInfos: Array<UPatternDecal>;
    /**
     * 텍스쳐 그래이 스케일 투명도 값으로 변환 여부
     * @type {boolean}
     */
    isConvertGrayScale: boolean;
    /**
     * 알파 텍스쳐 Url
     * @type {string | null}
     */
    _alphaBaseUrl: string | null;
    /** @type {import('three').Color} */ color: three.Color;
    /** @type {boolean} */ useBaseTexture: boolean;
    /** @type {boolean} */ useAlphaTexture: boolean;
    update(): void;
    /**
     * 레이어 투명도를 번경합니다. <br>
     * commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {number} opacity
     * @return {this}
     */
    setOpacity(opacity: number): this;
    /**
     * 레이어 색상을 번경합니다. <br>
     * commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {string|number} color
     * @return {this}
     */
    setColor(color: string | number): this;
    /**
     * 레이어 색상을 반환합니다.
     * @return {number} rgb 헥사 코드
     */
    getColor(): number;
    /**
     * 레이어의 기본 텍스처의 사용 여부를 설정합니다. <br>
     * commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {boolean} [use=true] 기본 텍스처를 사용할지 여부를 나타내는 불리언 값입니다. 기본값은 true입니다.
     * @return {this}
     */
    setUseBaseTexture(use?: boolean): this;
    /**
     * 레이어의 알파 텍스처 사용 여부를 설정합니다. <br>
     * commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {boolean} [use=true] 알파 텍스처를 사용할지 여부를 지정합니다. true면 사용하고, false면 사용하지 않습니다.
     * @return {this}
     */
    setUseAlphaTexture(use?: boolean): this;
    /**
     * 레이어의 출력 설정 값들을 출력에 반영합니다.
     * @return {this}
     */
    commit(): this;
    /**
     * 패턴 텍스처를 입힌 타일 메시를 만들어 캐시에 넣고, 작업이 끝나면 타일로 완료되는 Promise를 반환합니다. <br>
     * 타일이 없거나 처분되었거나 레벨 범위 밖이면 undefined를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 메시를 만들 타일
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 작업이 끝나면 타일로 완료되는 Promise. 시작하지 못하면 undefined
     */
    override createTexture(tile: U3dQuadTile): Promise<U3dQuadTile> | undefined;
    createMesh(tile: any): UTerrainMesh;
    /**
     * 타일이 쓰던 mesh 와 머티리얼·geometry 를 해제하고 캐시에서 뺍니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 해제할 타일
     * @returns {boolean | undefined} 해제할 mesh 가 없으면 `undefined` 입니다.
     */
    override disposeTile(tile: U3dQuadTile): boolean | undefined;
    /**
     * @override
     */
    override dispose(): void;
    removeTileFromScene(tile: any): boolean;
    /**
     * 데칼을 추가 합니다.
     * @param {Array<DecalOption>| Array<UPatternDecal>} decalInfos 추가할 데칼 정보
     * @return {Promise<Array<UPatternDecal>>}
     */
    addDecal(decalInfos: Array<DecalOption> | Array<UPatternDecal>): Promise<Array<UPatternDecal>>;
    /**
     * 입력한 이름의 데칼을 리턴
     * @param {string} name
     * @return {UPatternDecal|null}
     */
    getDecal(name: string): UPatternDecal | null;
    /**
     * 레이어에 등록된 데칼을 리턴
     * @return {Array<UPatternDecal>}
     */
    getDecals(): Array<UPatternDecal>;
    /**
     * 레이어에 등록된 데칼을 등록해체하는 함수
     * @param {UPatternDecal} patternDecal
     * @return {boolean}
     */
    removeDecal(patternDecal: UPatternDecal): boolean;
    /**
     * 레이어에 등록된 데칼을 전부 등록해체하는 함수
     * @param {boolean} [doDispose = false] 데칼을 레이어에 remove 할때, 데칼을 dispose 할껀지의 여부
     * @return {boolean} 실행결과
     */
    removeAllDecal(doDispose?: boolean): boolean;
    getDecalTexture(textureUrl: any): three.Texture<any, three.TextureEventMap>;
    getDecalAlphaTexture(textureUrl: any): three.Texture<any, three.TextureEventMap>;
    #private;
}

/**
 * 데칼 출력 제어 객체
 */
declare class UPatternDecal {
    /**
     * @param {UPatternDecalCO} options
     */
    constructor(options: UPatternDecalCO);
    /** @type {import('@U3dApp').U3dApp} */ app: U3dApp;
    /** @type {import('@union3d/3dLayer/U3dPatternXYZLayer').U3dPatternXYZLayer} */ layer: U3dPatternXYZLayer;
    /** @type {string} */ name: string;
    /** @type {string} */ uuid: string;
    /** @type {Array<import('three').Vector3Like>} */ area: Array<three.Vector3Like>;
    /**
     * 데칼 영역 (3857 구글 좌표)
     * @type {Array<import('three').Vector3Like>}
     */
    _decalGoogleArea: Array<three.Vector3Like>;
    /**
     * 데칼 영역 (월드 좌표)
     * @type {Array<import('three').Vector3Like>}
     */
    _decalWorldArea: Array<three.Vector3Like>;
    /**
     * 타일별 영역 캔버스 좌표 캐쉬
     * @type {import('@union3d/util/LRUCache').LRUCache}
     */
    _localPoints: LRUCache;
    /** @type {number} */ opacity: number;
    /** @type {string|null} */ textureUrl: string | null;
    /** @type {string|null} */ alphaTextureUrl: string | null;
    /** @type {import('three').Color} */ color: three.Color;
    /** @type {import('three').Box3} */ boundingBox: three.Box3;
    /** @type {number} */ minLevel: number;
    /** @type {number|null|undefined} */ maxLevel: number | null | undefined;
    /** @type {number} */ version: number;
    /** @type {boolean} */ disposed: boolean;
    /** @type {boolean} */ isConvertGrayScale: boolean;
    /** @type {Map<number,HTMLCanvasElement>} */ decalCanvasCache: Map<number, HTMLCanvasElement>;
    /** @type {number} */ patternStrength: number;
    /** @type {boolean} */ useTexture: boolean;
    /** @type {boolean} */ useAlphaTexture: boolean;
    /** @type {number} */ minPatternPixel: number;
    /**
     * @readonly
     *
     * @type {boolean}
     */
    readonly isUPatternDecal: boolean;
    /**
     * 데칼의 색상을 번경합니다. <br>
     * UPatternDecal.commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {string|number} color
     * @return {this}
     */
    setColor(color: string | number): this;
    /**
     * 데칼의 색상을 반환합니다.
     * @return {number} rgb 헥사 코드
     */
    getColor(): number;
    /**
     * 데칼의 투명도를 번경합니다. <br>
     * UPatternDecal.commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {number} opacity
     * @return {this}
     */
    setOpacity(opacity: number): this;
    /**
     * 데칼의 투명도를 반환 합니다.
     * @return {number}
     */
    getOpacity(): number;
    /**
     * 데칼 텍스처의 사용 여부를 설정합니다. <br>
     * UPatternDecal.commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {boolean} [use=true] 기본 텍스처를 사용할지 여부를 나타내는 불리언 값입니다. 기본값은 true입니다.
     * @return {this}
     */
    setUseTexture(use?: boolean): this;
    /**
     * 데칼 텍스쳐 사용 여부를 반환합니다.
     * @return {boolean}
     */
    getUseTexture(): boolean;
    /**
     * 데칼 알파 텍스처의 사용 여부를 설정합니다. <br>
     * UPatternDecal.commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {boolean} [use=true] 기본 텍스처를 사용할지 여부를 나타내는 불리언 값입니다. 기본값은 true입니다.
     * @return {this}
     */
    setUseAlphaTexture(use?: boolean): this;
    /**
     * 데칼 알파 텍스쳐 사용 여부를 반환합니다.
     * @return {boolean}
     */
    getUseAlphaTexture(): boolean;
    setPatternStrength(patternStrength?: number): this;
    getPatternStrength(): number;
    setMinPatternPixel(minPatternPixel?: number): this;
    getMinPatternPixel(): number;
    /**
     * 데칼의 출력 설정 값들을 출력에 반영합니다.
     * @return {UPatternDecal}
     */
    commit(): UPatternDecal;
    bakingDecalCanvas(): void;
    getDecalCanvas(tileLevel: any): HTMLCanvasElement;
    createDecalCanvas(tileLevel: any): HTMLCanvasElement;
    dispose(): void;
    /**
     * CO로 입력받은 위경도 영역 좌표를 시스템 좌표로 변환하고, 바운딩 박스를 만든다.
     */
    transArea(): void;
    /**
     * 타일렉으로 데칼 영역의 이미지 로컬 좌표 변환 후 리턴
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UGeoRect').UGeoRect} tileRectangle
     * @return {Array<import('@UGPoint').UGPoint>}
     *
     * @ignore
     */
    getLocalPoints(tile: U3dQuadTile, tileRectangle: UGeoRect): Array<UGPoint>;
    #private;
}

export type { U3dPatternXYZLayer, UPatternDecal };
