// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayer, U3dImageLayerCO } from "./U3dImageLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UTerrainMesh } from "../core/mesh/UTerrainMesh.js";
import type { UCanvasTexture } from "../core/texture/UCanvasTexture.js";
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
    /**
     * 현재 데칼 설정으로 해당 레벨의 패턴 캔버스를 생성합니다.
     * opacity는 캔버스 자체가 아니라 타일 영역 합성 시 적용합니다.
     *
     * @param {any} tileLevel 기존의 숫자 강제 변환 입력을 제한하지 않기 위한 레벨값
     * @returns {HTMLCanvasElement} 새 패턴 캔버스
     */
    createDecalCanvas(tileLevel: any): HTMLCanvasElement;
    dispose(): void;
    /**
     * 입력 영역의 변환 좌표를 두 배열에 누적하고 경계를 확장합니다.
     * 기존 배열·경계를 초기화하지 않으므로 재호출하면 결과가 누적됩니다.
     * 버전 증가와 로컬 좌표 캐시 초기화는 수행하지 않습니다.
     * 직접 생성자로 단일 점 영역을 전달한 상태에서는 TypeError가 발생할 수 있습니다.
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

/**
     * 데칼 영역 및 데칼 표현 설정 인터페이스
     */
    type DecalOption = {
        /**
         * 데칼 이름
         */
        name?: string;
        /**
         * 데칼 영역 (위경도 좌표)
         */
        decalArea: Array<three.Vector2Like>;
        /**
         * 데칼 투명도
         */
        opacity?: number;
        /**
         * 데칼 텍스쳐 url
         */
        textureUrl?: string | null | undefined;
        /**
         * 데칼 알파 텍스쳐 url
         */
        alphaTextureUrl?: string | null | undefined;
        /**
         * 데칼 텍스쳐 그래이 스케일 투명도 값으로 변환 여부
         */
        isConvertGrayScale?: boolean;
        /**
         * 데칼 패턴 강도, 값이 커질 수록, 패턴이 작고 많아짐
         */
        patternStrength?: number;
        /**
         * 데칼 텍스쳐를 패턴으로 출력할때, 패턴 표현의 최소 픽셀
         */
        minPatternPixel?: number;
        /**
         * 데칼 텍스처를 불러오는 textureUrl 이 있을경우, 데칼 텍스쳐를 사용 할 건지 여부
         */
        useTexture?: boolean;
        /**
         * 알파 텍스처를 불러오는 alphaTextureUrl 이 있을경우, 알파 텍스쳐를 사용 할 건지 여부
         */
        useAlphaTexture?: boolean;
        /**
         * 데칼 컬러
         */
        color?: string | number | null | undefined;
        /**
         * 출력 최소 타일 레벨
         */
        minLevel?: number;
        /**
         * 출력 최대 타일 레벨
         */
        maxLevel?: number;
    };

/**
     * ~extends import('@U3dImageLayer').U3dImageLayerCO <br>
     * 생성자 옵션
     */
    type U3dPatternXYZLayerCO_Content = {
        /**
         * 패턴 텍스쳐, 'default' 입력시, 내부 기본 패턴 텍스쳐 사용
         */
        baseurl?: string;
        /**
         * <hidden>
         */
        baseUrl?: string;
        /**
         * 패턴 알파 텍스쳐
         */
        alphaBaseUrl?: string;
        /**
         * <hidden>
         */
        alphabaseurl?: string;
        /**
         * 텍스쳐 그래이 스케일 투명도 값으로 변환 여부
         */
        isConvertGrayScale?: boolean;
        /**
         * <hidden>
         */
        isconvertgrayscale?: boolean;
        /**
         * 패턴 텍스처를 불러오는 baseurl 이 있을경우, 패턴 텍스쳐를 사용 할 건지 여부
         */
        usebasetexture?: boolean;
        /**
         * <hidden>
         */
        useBaseTexture?: boolean;
        /**
         * 알파 텍스처를 불러오는 alphabaseurl 이 있을경우, 알파 텍스쳐를 사용 할 건지 여부
         */
        usealphatexture?: boolean;
        /**
         * <hidden>
         */
        useAlphaTexture?: boolean;
        /**
         * 패턴 컬러
         */
        color?: string | number;
        /**
         * 데칼 설정 정보
         */
        decalinfos?: Array<DecalOption>;
        /**
         * <hidden>
         */
        decalInfos?: Array<DecalOption>;
    };

/**
     * ~extends import('@U3dImageLayer').U3dImageLayerCO <br>
     * 생성자 옵션
     */
    type U3dPatternXYZLayerCO = Omit<Omit<U3dImageLayerCO, never> & U3dPatternXYZLayerCO_Content, never>;

/**
     * 내부 작업용 데칼 영역 및 데칼 표현 설정 인터페이스
     */
    type UPatternDecalCO = {
        /**
         * 데칼 이름
         */
        name?: string;
        /**
         * 데칼 영역 (위경도)
         */
        area: Array<three.Vector3Like>;
        /**
         * =1.0  데칼 투명도
         */
        opacity: number;
        /**
         * =null 데칼 텍스쳐 url
         */
        textureUrl: string | null;
        /**
         * =null 데칼 알파 텍스쳐 url
         */
        alphaTextureUrl: string | null;
        /**
         * 데칼 텍스쳐 그래이 스케일 투명도 값으로 변환 여부
         */
        isConvertGrayScale?: boolean;
        /**
         * 데칼 패턴 강도
         */
        patternStrength?: number;
        /**
         * 데칼 텍스처를 불러오는 textureUrl 이 있을경우, 데칼 텍스쳐를 사용 할 건지 여부
         */
        useTexture?: boolean;
        /**
         * 알파 텍스처를 불러오는 alphaTextureUrl 이 있을경우, 알파 텍스쳐를 사용 할 건지 여부
         */
        useAlphaTexture?: boolean;
        /**
         * 데칼 텍스쳐를 패턴으로 출력할때, 패턴 표현의 최소 픽셀
         */
        minPatternPixel?: number;
        /**
         * 데칼 컬러
         */
        color: three.Color;
        /**
         * 출력 최소 타일 레벨
         */
        minLevel?: number;
        /**
         * 출력 최대 타일 레벨
         */
        maxLevel?: number | null | undefined;
        app: U3dApp;
        layer: U3dPatternXYZLayer;
    };

/**
     * 타일 대상 데칼 선택에 필요한 등록 목록 조회 경계입니다.
     */
    type U3dPatternDecalSelectionState = {
        /**
         * 현재 등록 데칼
         */
        decalInfos: Array<UPatternDecal> | null;
    };

/**
     * 기본 캔버스 합성에서 읽는 레이어 출력 설정입니다.
     */
    type U3dPatternLayerCanvasState = {
        /**
         * 레이어 투명도
         */
        _opacity: number;
        /**
         * 기본 색상
         */
        color: three.Color;
        /**
         * 기본 이미지 사용 여부
         */
        useBaseTexture: boolean;
        /**
         * 알파 이미지 사용 여부
         */
        useAlphaTexture: boolean;
    };

/**
     * 데칼 캔버스 합성에서 읽는 공개 설정과 이미지 조회 경계입니다.
     */
    type UPatternDecalCanvasState = {
        /**
         * 데칼 색상
         */
        color: three.Color;
        /**
         * 기본 이미지 사용 여부
         */
        useTexture: boolean;
        /**
         * 알파 이미지 사용 여부
         */
        useAlphaTexture: boolean;
        /**
         * 기본 이미지 주소
         */
        textureUrl: string | null;
        /**
         * 알파 이미지 주소
         */
        alphaTextureUrl: string | null;
        /**
         * 이미지 조회 API
         */
        layer: Pick<U3dPatternXYZLayer, "getDecalTexture" | "getDecalAlphaTexture">;
    };

/**
     * 데칼 패턴 크기를 계산할 때 읽는 설정입니다.
     */
    type UPatternDecalSizeState = {
        /**
         * 패턴 강도
         */
        patternStrength: number;
        /**
         * 최소 패턴 크기
         */
        minPatternPixel: number;
        /**
         * 최대 레벨 제공 경계
         */
        app: {
            _maxlevel: number;
        };
    };

/**
     * 합성 시점 데칼의 식별자와 변경 버전입니다.
     */
    type U3dPatternWorkLog = {
        /**
         * 데칼 식별자
         */
        uuid: string;
        /**
         * 데칼 변경 버전
         */
        version: number;
    };

/**
     * 데칼 영역 변환에서 읽는 입력과 확장하는 결과 저장소입니다.
     * 원본 area와 앱은 조회만 하며 결과 배열·boundingBox는 기존 객체를 확장합니다.
     */
    type UPatternDecalAreaState = {
        /**
         * 원본 위경도 영역
         */
        area: Array<three.Vector3Like>;
        /**
         * 좌표 변환 API
         */
        app: Pick<U3dApp, "getGeographicToWorld" | "getGeographicToGoogle">;
        /**
         * 누적 월드 좌표(EPSG:3857)
         */
        _decalWorldArea: Array<three.Vector3Like>;
        /**
         * 누적 월드 좌표(EPSG:3857)
         */
        _decalGoogleArea: Array<three.Vector3Like>;
        /**
         * 누적 경계
         */
        boundingBox: three.Box3;
    };

/**
     * 타일별 기존 합성 결과와 기본 텍스처 참조입니다.
     * 해제 경로에서 텍스처 필드는 null로 바뀔 수 있습니다.
     */
    type U3dPatternResourceInfo = {
        /**
         * 합성 순서의 이력
         */
        workHistory: Array<U3dPatternWorkLog>;
        /**
         * 합성 결과
         */
        decalTexture: UCanvasTexture | null;
        /**
         * 합성에 사용한 기본 텍스처
         */
        layerTexture: UCanvasTexture | null;
    };

/**
     * 다음 타일 합성의 재사용 범위입니다.
     */
    type U3dPatternBakeResult = {
        /**
         * all은 전체 합성, append는 추가 합성, none은 기존 결과 사용
         */
        type: string;
        /**
         * 합성 바탕 또는 기존 결과
         */
        texture: UCanvasTexture | null;
        /**
         * 추가 합성을 시작할 데칼 인덱스
         */
        startIndex: number;
    };

export type { DecalOption, U3dPatternBakeResult, U3dPatternDecalSelectionState, U3dPatternLayerCanvasState, U3dPatternResourceInfo, U3dPatternWorkLog, U3dPatternXYZLayer, U3dPatternXYZLayerCO, U3dPatternXYZLayerCO_Content, UPatternDecal, UPatternDecalAreaState, UPatternDecalCO, UPatternDecalCanvasState, UPatternDecalSizeState };
