// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { U3FParsedObj, U3dModelU3FLayerCO, U3dModelU3FLayerComposedInfo } from "./U3dModelU3FLayer.types.js";
import type { U3dQueue } from "../core/U3dQueue.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UTaskProcessor } from "../core/UTaskProcessor.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { UTextureLoader } from "../core/loader/UTextureLoader.js";
import type { ModelMaterial } from "../core/mesh/UModelMesh.types.js";
import type { TileInfo, U3fPackagedInfo } from "../meta/U3fPackagedInfo.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { Common_Material, KeyValue, ModelMesh } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * `U3F 모델` 레이어 클래스
 *
 * @group 3dLayer
 * @extends U3dModelLayer
 *
 * @example
 *  let Layer = app.create3DFModelLayer({
 *      name: "chuncheon",
 *      basename: "chuncheon",
 *      baseurl: 'https://3d.geon.kr/data/model/gangwondo/chuncheon',
 *      minlevel: 17,
 *      maxlevel: 17,
 *      ext: '.u3f',
 *      useproxy: true
 *  });
 */
declare class U3dModelU3FLayer extends U3dModelLayer {
    static TEXTURE_LEVEL: {
        HIGH: string;
        LOW: string;
    };
    static g_TaskProcessor: UTaskProcessor;
    /** @type {ModelMaterial | undefined} */ static nonDrawMaterial: ModelMaterial | undefined;
    /**
     * @param {U3dModelU3FLayerCO} [opt={}]
     */
    constructor(opt?: U3dModelU3FLayerCO);
    /** @type {number} */ _srcminlevel: number;
    /** @type {number} */ _srcmaxlevel: number;
    /** @type {Record<string, Array<string>>} */ _u3fTiles: Record<string, Array<string>>;
    /** @type {Array<string>} */ _keysPreserved: Array<string>;
    /** @type {KeyValue | undefined} */ _info: KeyValue | undefined;
    /** @type {number} */ _wrapping: number;
    /** @type {boolean} */ _useModelAndTexture: boolean;
    /** @type {boolean} */ _useMinMaxModel: boolean;
    /** @type {string} */ _compressExt: string;
    /** @type {boolean} */ _reverseY: boolean;
    /** @type {boolean} */ _reverseX: boolean;
    /** @type {boolean} */ _forceUpdate: boolean;
    /** @type {number} */ _minusMaxlevel: number;
    /** @type {boolean} */ _useBaseMaterial: boolean;
    /** @type {boolean} */ _useSplitModel: boolean;
    /** @type {number} */ _zeroLevelHeight: number;
    /** @type {string} */ _format: string;
    /** @type {number} */ _startImageLevel: number;
    /** @type {import('@union3d/core/U3dQueue').U3dQueue} */ _tileBuffer: U3dQueue;
    /** @type {Record<string, import('@U3dQuadTile').U3dQuadTile>} */ _tileBufferMap: Record<string, U3dQuadTile>;
    /** @type {boolean} */ _needXml: boolean;
    /** @type {string} */ _proxyurl: string;
    /** @type {boolean} */ _useproxy: boolean;
    /** @type {string} */ _basename: string;
    /** @type {KeyValue} */ _tileModelMap: KeyValue;
    /** @type {KeyValue} */ _modelIds: KeyValue;
    /** @type {boolean} */ _useBoxHelper: boolean;
    /** @type {boolean} */ _immediateUpdateImage: boolean;
    /** @type {import('three').Vector3 | undefined} */ _prevPostion: three.Vector3 | undefined;
    /** @type {import('three').Vector3 | undefined} */ _curPostion: three.Vector3 | undefined;
    /** @type {number} */ _updateCount: number;
    /** @type {string | undefined} */ _meshColor: string | undefined;
    /** @type {import('@union3d/core/loader/UFileLoader').UFileLoader} */ _loader: UFileLoader;
    /** @type {import('@UTextureLoader').UTextureLoader} */ _textureLoader: UTextureLoader;
    /** @type {number | undefined} */ _makeU3FPackage: number | undefined;
    /** @type {number} */ _packageIndex: number;
    /** @type {string} */ _packageName: string;
    /** @type {boolean} */ _isShareMaterial: boolean;
    /** @type {boolean} */ _useWorker: boolean;
    /** @type {string | undefined} */ _jsonname: string | undefined;
    /** @type {import('@union3d/meta/U3fPackagedInfo').U3fPackagedInfo} */ _packagedInfo: U3fPackagedInfo;
    /** @type {boolean} */ _isTextureUpdate: boolean;
    /** @type {number | undefined} */ _textureDistance: number | undefined;
    /** @type {string | undefined} */ _style: string | undefined;
    /** @type {import('@union3d/core/UCheckTime').UCheckTime} */ _checkUpdateImage: UCheckTime;
    /** @type {number | boolean} */ _makeJson: number | boolean;
    /** @type {KeyValue} */ _refineCache: KeyValue;
    /** @type {KeyValue} */ _composedCache: KeyValue;
    /** @type {Record<string, Array<string>>} */ _modelUrlMap: Record<string, Array<string>>;
    /** @type {string | undefined} */ _textureLevel: string | undefined;
    /** @type {Common_Material | undefined} */ _sharedMaterial: Common_Material | undefined;
    /** @type {number | undefined} */ _preUpdateCount: number | undefined;
    /** @type {string | undefined} */ _preUpdateLastTile: string | undefined;
    /**
     * 그림자 업데이트를 수행하는 함수
     * @param {number} updateTime 업데이트 시간
     * @return {void}
     */
    updateShadow(updateTime: number): void;
    /**
     * 건물 모델 데이터의 텍스쳐 해상도의 최대 품질을 설정하는 함수
     * @param {string} textureLevel 텍스쳐 해상도의 최대 품질 [l]
     */
    setTextureLevel(textureLevel: string): void;
    /**
     * 건물 모델 데이터의 텍스쳐 해상도의 최대 품질 설정값 초기화하는 함수
     */
    clearTextureLevel(): void;
    /**
     * 메쉬 정점/지오메트리 수를 집계하고 테스트 머터리얼을 적용하는 함수
     * @return {void}
     *
     * @ignore
     */
    testMesh(): void;
    /**
     * 레이어를 초기화하는 함수
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] draw 인자
     * @return {Promise<unknown> | undefined}
     */
    override initialize(drawArg?: UDrawArg): Promise<unknown> | undefined;
    /**
     * 레이어의 바운딩박스(Box3)를 반환하는 함수
     * @return {import('three').Box3} 바운딩박스(Box3)
     */
    getBoundingBox(): three.Box3;
    /**
     * U3F URL을 생성하고 이를 반환하는 함수
     * @return {string} 생성한 URL
     */
    createU3GURL(): string;
    /**
     * 레이어 정보를 담고 있는 info 오브젝트를 반환하는 함수
     * @return {KeyValue | undefined} info 오브젝트
     */
    getInfo(): KeyValue | undefined;
    /**
     * 레이어 요청 URL을 입력받아 레이어를 Load하고 해당 레이어의 정보가 담긴 Object를 반환하는 함수
     * @param {string} [url] 레이어 요청 URL
     * @param {import('@UDrawArg').UDrawArg} [drawArg] draw 인자 <hidden>
     * @return {Promise<object>} 레이어 정보가 담긴 Object를 Promise에 담아 반환한다.
     */
    getLayerInfo(url?: string, drawArg?: UDrawArg): Promise<object>;
    /**
     * 레이어 JSON 정보를 로드하는 함수
     * @param {string} url JSON 요청 URL
     * @return {Promise<object>} JSON 정보 Promise
     *
     * @ignore
     */
    getLayerJson(url: string): Promise<object>;
    /**
     * 타일 정보를 로드/파싱하는 함수
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} indexX 타일 X 인덱스
     * @param {number} indexY 타일 Y 인덱스
     * @param {number} level 타일 레벨
     * @param {string} url 타일 정보 요청 URL
     * @return {Promise<import('@union3d/meta/U3fPackagedInfo').TileInfo>} 타일 정보 Promise
     *
     * @ignore
     */
    getTileInfo(tile: U3dQuadTile, indexX: number, indexY: number, level: number, url: string): Promise<TileInfo>;
    /**
     * 모델 정보를 로드/파싱하여 mesh로 변환하는 함수
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} index 모델 인덱스
     * @param {string} url 모델 요청 URL
     * @param {string} baseurl 모델 기본 URL
     * @param {import('@UDrawArg').UDrawArg} drawArg draw 인자
     * @param {import('@union3d/meta/U3fPackagedInfo').TileInfo} tileInfo 타일 정보
     * @return {Promise<unknown> | undefined} 모델 정보 Promise
     *
     * @ignore
     */
    getModelInfo(tile: U3dQuadTile, index: number, url: string, baseurl: string, drawArg: UDrawArg, tileInfo: TileInfo): Promise<unknown> | undefined;
    /**
     * ForceUpdate 여부를 설정하는 함수 <br>
     * ForceUpdate true 시 강제로 업데이트(redraw)를 수행한다.
     * @param {Boolean} force
     * @ignore
     */
    setForceUpdate(force: boolean): void;
    /**
     * ForceUpdate 여부를 반환하는 함수 <br>
     * ForceUpdate true 시 강제로 업데이트(redraw)를 수행한다.
     * @return {boolean} ForceUpdate 여부
     * @ignore
     */
    getForceUpdate(): boolean;
    /**
     * 보존하고 있던 타일 Key들을 전체 삭제하는 함수
     */
    deletekeys(): void;
    /**
     * 레이어를 처분(dispose)하는 함수
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] draw 인자
     * @return {Promise<boolean>} promise 함수.
     */
    override dispose(drawArg?: UDrawArg): Promise<boolean>;
    /**
     * 텍스처를 로드하는 함수
     * @param {U3dModelU3FLayer} self 레이어 인스턴스
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {string} url 텍스처 URL
     * @return {Promise<import('three').Texture>} 텍스처 promise
     *
     * @ignore
     */
    getTexture(self: U3dModelU3FLayer, tile: U3dQuadTile, url: string): Promise<three.Texture>;
    /**
     * 메모리/캐시를 정리하는 함수
     * @return {void}
     *
     * @ignore
     */
    cleanMemory(): void;
    /**
     * 레이어 업데이트 함수
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg draw 인자
     * @param {number} [curTime] 현재 시간
     * @return {void}
     *
     * @ignore
     */
    override update(drawArg: UDrawArg, curTime?: number): void;
    /**
     * 절두체 기준 타일 상세 업데이트 함수
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} [opt]
     * @param {boolean | number} [curTime] 현재 시간 또는 force 플래그
     * @param {any} [resolve] resolve 콜백 (.call() 동적 호출 패턴)
     * @return {any}
     *
     * @ignore
     */
    override updateDetailByFrustum(tile: U3dQuadTile, opt?: UDrawArg, curTime?: boolean | number, resolve?: any): any;
    /**
     * 입력받은 타일에 속한 모델을 레이어 위에 생성하는 함수
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {boolean | Promise<unknown> | undefined}
     *
     * @ignore
     */
    override createModel(tile: U3dQuadTile): boolean | Promise<unknown> | undefined;
    /**
     * 타일을 씬에 추가하는 함수
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {void}
     *
     * @ignore
     */
    override addTileFromScene(tile: U3dQuadTile): void;
    /**
     * 타일을 씬에서 제거하는 함수
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {void}
     *
     * @ignore
     */
    override removeTileFromScene(tile: U3dQuadTile): void;
    /**
     * 절두체 기준 모델 생성 함수
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @param {boolean} [force]
     * @return {any}
     *
     * @ignore
     */
    override createModelByFrustum(tile: U3dQuadTile, drawArg: UDrawArg, force?: boolean): any;
    /**
     * 블록 단위로 모델을 로드하는 함수
     *
     * @param {U3dModelU3FLayer} self
     * @param {string} baseurl
     * @param {number} startindex
     * @param {number} endindex
     * @param {number} blocksize
     * @param {number} max
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @param {DeferredObject<boolean>} endPromise
     * @return {void}
     *
     * @ignore
     */
    loadBlockModel(self: U3dModelU3FLayer, baseurl: string, startindex: number, endindex: number, blocksize: number, max: number, tile: U3dQuadTile, drawArg: UDrawArg, endPromise: DeferredObject<boolean>): void;
    /**
     * 메쉬 색상을 설정하는 함수
     *
     * @param {string | number} color
     * @return {void}
     *
     * @ignore
     */
    setMeshColor(color: string | number): void;
    /**
     * 면 단위로 메쉬를 분할하여 병합하는 함수
     * @override
     *
     * @param {ModelMesh} mesh
     * @param {number | function(import('three').Object3D, import('@UDrawArg').UDrawArg): void} [faceIndex] faceIndex 또는 afterFunction
     * @param {function(import('three').Object3D, import('@UDrawArg').UDrawArg, string): void} [onAfterFunction]
     * @return {any}
     *
     * @ignore
     */
    override mergedMeshDivision(mesh: ModelMesh, faceIndex?: number | ((arg0: three.Object3D, arg1: UDrawArg) => void), onAfterFunction?: (arg0: three.Object3D, arg1: UDrawArg, arg2: string) => void): any;
    /**
     * 키에 해당하는 모델에 픽 재질을 설정하는 함수
     *
     * @param {string} key
     * @param {string | number} color
     * @param {number} opacity
     * @param {string} meshId
     * @param {boolean} [isSetOutline=false]
     * @return {Array<ModelMesh> | void}
     *
     * @ignore
     */
    setPickMaterial(key: string, color: string | number, opacity: number, meshId: string, isSetOutline?: boolean): Array<ModelMesh> | void;
    /**
     * 재질 인덱스를 제거하는 함수
     * @override
     *
     * @param {ModelMesh} object
     * @param {number} materialIndex
     * @return {any}
     *
     * @ignore
     */
    override removeMaterialIndex(object: ModelMesh, materialIndex: number): any;
    /**
     * 메쉬의 바운딩 박스 정보를 구하는 함수
     *
     * @param {ModelMesh} mesh
     * @return {Array<{id: string, info: object}> | void}
     *
     * @ignore
     */
    getBoundingBoxInfo(mesh: ModelMesh): Array<{
        id: string;
        info: object;
    }> | void;
    /**
     * U3F 2.4 버전 이상 Load 시에 병합된 건물들의 정보를 반환 하는 함수
     * @param {string} gid 병합된 건물의 해당하는 gruop의 id
     * @param {string} childId 병합된 건물들 중 대상 자식 id
     * @return {object | undefined} {
     *                 start : 병합된 mesh에서 position 시작 index 번호,
     *                 count : 병합된 mesh에서 position 시작 index 번호로부터 갯수,
     *                 uid: 건물의 uid,
     *                 id: 건물의 oid,
     *                 color : 설정된 색상 (default - undefined),
     *                 opacity : 설정된 투명도 (default - undefined),
     *                 min: {WorldPosition} boundingBox min 위치값,
     *                 max: {WorldPosition} boundingBox max 위치값 } 해당 childId 건물에 대한 정보
     */
    getComposedInfo(gid: string, childId: string): object | undefined;
    /**
     * 레이어의 영역(Rectangle)과 Box3 를 계산하는 함수
     * @return {void}
     *
     * @ignore
     */
    computeRectangle(): void;
    /**
     * 편집된 텍스처를 타일에 적용하는 함수
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} level 모델 레벨
     * @return {void}
     *
     * @ignore
     */
    applyEditedTextures(tile: U3dQuadTile, level: number): void;
    /**
     * 썸네일 raw 이미지로부터 텍스처를 생성하는 함수
     * @param {string | ArrayBuffer} thumbimage 썸네일 이미지 데이터
     * @param {any} promise 완료 promise 객체
     * @return {void}
     *
     * @ignore
     */
    createTextureFromImageRaw(thumbimage: string | ArrayBuffer, promise: any): void;
    /**
     * 머터리얼에 기본 색상/텍스처/스타일을 설정하는 함수
     * @param {ModelMaterial} material 머터리얼
     * @param {import('three').Texture} [texture] 적용할 텍스처
     * @return {void}
     *
     * @ignore
     */
    setMaterial(material: ModelMaterial, texture?: three.Texture): void;
    /**
     * 파싱된 objs 로부터 모델 mesh 를 생성하는 함수
     * @param {Array<U3FParsedObj>} objs 파싱된 모델 객체 배열
     * @param {import('three').Texture | undefined} texture 적용할 텍스처
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg draw 인자
     * @param {import('@union3d/meta/U3fPackagedInfo').TileInfo} tileInfo 타일 정보
     * @return {ModelMesh | boolean | void} 생성 성공 여부 또는 생성된 mesh
     *
     * @ignore
     */
    createModelMesh(objs: Array<U3FParsedObj>, texture: three.Texture | undefined, tile: U3dQuadTile, drawArg: UDrawArg, tileInfo: TileInfo): ModelMesh | boolean | void;
    /**
     * 모델 mesh 들을 병합하는 함수
     * @param {Array<U3FParsedObj>} objs 병합 정보 배열
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg draw 인자
     * @return {Promise<unknown>}
     *
     * @ignore
     */
    mergeModelMesh(objs: Array<U3FParsedObj>, tile: U3dQuadTile, drawArg: UDrawArg): Promise<unknown>;
    /**
     * face 인덱스 기준으로 mesh 를 분할하는 함수
     * @param {ModelMesh} mesh 대상 mesh
     * @param {number} faceIndex face 인덱스
     * @return {{materialIndex: number, composedInfo: U3dModelU3FLayerComposedInfo, tileMaxKey: string} | void} 분할 정보
     *
     * @ignore
     */
    divisionMeshFromFace(mesh: ModelMesh, faceIndex: number): {
        materialIndex: number;
        composedInfo: U3dModelU3FLayerComposedInfo;
        tileMaxKey: string;
    } | void;
    /**
     * geometry group 분할 정보를 갱신하는 함수
     * @param {ModelMesh} mesh 대상 mesh
     * @param {number} index group 인덱스
     * @param {U3dModelU3FLayerComposedInfo} composedInfo 합성 메시 정보
     * @param {number} targetIndex 대상 머터리얼 인덱스
     * @return {any} group 인덱스 정보 (number | undefined — 사용처 narrow 호환 위해)
     *
     * @ignore
     */
    setGroupsDivisionRefine(mesh: ModelMesh, index: number, composedInfo: U3dModelU3FLayerComposedInfo, targetIndex: number): any;
    /**
     * 합성 메시 정보 기준으로 pick 머터리얼을 적용하는 함수
     * @param {ModelMesh} mesh 대상 mesh
     * @param {import('three').Object3D} group group 객체
     * @param {Array<U3dModelU3FLayerComposedInfo>} composedInfo 합성 메시 정보
     * @param {boolean} [isSetOutline=false] 외곽선 설정 여부
     * @return {void}
     *
     * @ignore
     */
    applyPickMaterial(mesh: ModelMesh, group: three.Object3D, composedInfo: Array<U3dModelU3FLayerComposedInfo>, isSetOutline?: boolean): void;
    /**
     * 합성 메시 정보 기준으로 pick 머터리얼을 설정하는 함수
     *
     * @param {ModelMesh} mesh
     * @param {U3dModelU3FLayerComposedInfo} composedInfo 합성 메시 정보
     * @param {string | number | import('three').ColorRepresentation} color
     * @param {number} opacity
     * @param {boolean} [isSetColor=true]
     * @return {void}
     *
     * @ignore
     */
    setPickMaterialByComposedInfo(mesh: ModelMesh, composedInfo: U3dModelU3FLayerComposedInfo, color: string | number | three.ColorRepresentation, opacity: number, isSetColor?: boolean): void;
    /**
     * refine 캐시를 조회하는 함수
     * @param {string} type refine 타입
     * @param {string} key 타일 키
     * @return {Array<KeyValue> | void} refine 캐시
     *
     * @ignore
     */
    getRefineCache(type: string, key: string): Array<KeyValue> | void;
    /**
     * meshInfo 의 유효성을 검증하는 함수
     * @param {Array<{id: string | number, oid: string | number}>} meshInfo mesh 정보 배열
     * @param {Array<string>} list 검증 대상 리스트
     * @param {ModelMesh} mesh 대상 mesh
     * @return {void}
     *
     * @ignore
     */
    validationMeshInfo(meshInfo: Array<{
        id: string | number;
        oid: string | number;
    }>, list: Array<string>, mesh: ModelMesh): void;
}

export type { U3dModelU3FLayer };
