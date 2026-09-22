// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UByteBuffer } from "./UByteBuffer.js";
import type { SimpleRect } from "../types/global.types.js";
import type { DeferredRejectFunc, DeferredResolveFunc } from "../util/deferred.types.js";

/**
 * 공통 정의 변수 및 함수
 *
 * @ignore
 */
declare class UDEF {
    static version: any;
    static copyright: any;
    static INVALID: number;
    /**
     * GeOnDT 스크립트 경로, webworker 나 리소스를 불러오기 위해 사용
     * @type {string}
     */
    static path: string;
    static TERRAIN_NO_DATA: number;
    static HEIGHT_METHOD: {
        NOW: string;
        _RAW: string;
        _BASE: string;
        _1_0: string;
    };
    static SEARCH_TYPE: string;
    static EARTH_RADIUS: number;
    static HALF_WORLD: number;
    static DEG_TO_RAD: number;
    static RAD_TO_DEG: number;
    static GoogleCoordWidth: number;
    static Prj: {
        'EPSG:5179': string;
        'EPSG:4326': string;
        'EPSG:3857': string;
        'EPSG:5186': string;
        'EPSG:5187': string;
        'EPSG:2097': string;
        'EPSG:5173': string;
        'EPSG:5174': string;
        'EPSG:5175': string;
        'EPSG:5176': string;
        'EPSG:5177': string;
        'EPSG:5181': string;
    };
    static GEOGRAPHIC: string;
    static GOOGLE: string;
    static WORLD: string;
    static POINT_TYPE: {
        WORLD: string;
        GEOGRAPHIC: string;
    };
    static TILE_SEG: number;
    static TILE_SEG_L2: number;
    static g_countLayer: number;
    static OVERVIEW_STATE: {
        _NONE: number;
        _MOVING: number;
        _END: number;
    };
    static FrontSide: 0;
    static BackSide: 1;
    static DoubleSide: 2;
    static resourceManager: any;
    static DEFAULT_TERRAIN_SHADOW_LEVEL: number;
    static TILES_STATE: {
        _NONE: number;
        _DOWNLOADING: number;
        _PARSING: number;
        _FAIL: number;
        _END: number;
        _CACHED: number;
        _SKIP: number;
    };
    static TILES_DISPOSE_TYPE: {
        DISPOSE: number;
        PARENTCULLED: number;
    };
    static CUSTOM_MODEL: {
        TYPE: {
            EXTRUDE: string;
            GEOMETRY: string;
            GROUP: string;
        };
        DRAW: {
            GROUND: string;
            OBJECT: string;
        };
    };
    static PACKAGED_MODEL: number;
    static NON_PACKAGED_MODEL: number;
    static U3F_DETACHED_TOKEN: string;
    static U3F_WRITER_KEY: string;
    static U3F_PACKAGE_WRITER_KEY: string;
    static U3F_DATA_CHUNK_KEY: string;
    static UMESH_EXTENSION: string;
    static UMESH_MAGIC_KEY: string;
    static UMESH_INSTANCE_MAGIC_KEY: string;
    static UMESH_MESH_MAGIC_KEY: string;
    static RBUSH: any;
    static BOUNDING_TYPE: {
        BOX: string;
        TREE: string;
    };
    static BOUNDING_METHOD: string;
    static CAMERA_TYPE: {
        PERSPECTIVE: string;
        ORTHOGRAPHIC: string;
    };
    static isImmediateUpdateImageModel: boolean;
    static useSunFlare: boolean;
    static APP_MODE: {
        _PAN: number;
        _SLOPE: number;
        _LANDSCAPE: number;
        _DISTANCE: number;
        _AREA: number;
        _HEIGHT: number;
        _SUNSHINE: number;
        _VISIBILITY: number;
        _PICK: number;
        _GIZMO: number;
        _FLY: number;
        _WALK: number;
        _POI: number;
        _CUSTOMMODEL: number;
        _PICKSTORE: number;
        _TRACKBALL: number;
        _COMPONENT: number;
        _ORBIT: number;
        _AVERAGEHEIGHT: number;
        _ROUTE: number;
        _USER: number;
        _UNDERGROUND: number;
        _DEPTH: number;
        _ALARM: number;
        _SECTION: number;
    };
    static PROCESS: {
        TYPE: {
            IMAGE: string;
            HEIGHT: string;
            MODEL: string;
            USER: string;
            GROUP: string;
            TERRAIN: string;
            MEASURE: string;
        };
        NAME: {
            IMAGE: string;
            HEIGHT: string;
            MODEL: string;
            USER: string;
            TERRAIN: string;
        };
        WORK_STATE: {
            NONE: string;
            SEARCH: string;
            LOADING: string;
            CACHE: string;
            END: string;
        };
        WORK_NUM: number;
    };
    static APP_PROP: {
        IMAGE: {
            USE_OPACITY: string;
            OPACITY: string;
        };
        MODEL: {
            USE_OPACITY: string;
            OPACITY: string;
        };
        CLIP: {
            USE_CLIP: string;
            AXIS: string;
            CLIP_X: string;
            CLIP_Y: string;
            CLIP_Z: string;
        };
    };
    static LAYER_NAME: {
        TERRAIN: string;
        MEASURE: string;
        SELECT: string;
    };
    static LAYER_TYPE: {
        IMAGE: string;
        HEIGHT: string;
        MODEL: string;
        GROUP: string;
        WORK1: string;
        WORK2: string;
        WORK3: string;
        USER: string;
        MEASURE: string;
        TERRAIN: string;
        SELECT: string;
        VECTORTILE: string;
    };
    static VIEW_NAME: {
        SCENE: string;
    };
    static TILE_STATE: {
        _none: number;
        _start: number;
        _loading: number;
        _end: number;
        _failed: number;
    };
    static TILE_TYPE: {
        TERRAIN: string;
        MODEL: string;
    };
    static TILE_REFINE: {
        ADD: string;
        REPLACE: string;
    };
    static TILE_QUADNAME: {
        NORTHWEST: string;
        NORTHEAST: string;
        SOUTHWEST: string;
        SOUTHEAST: string;
    };
    static PAN_MODE: {
        _default: number;
        _object3d: number;
    };
    static UMESH_TYPE: {
        _default: number;
        _tile: number;
        _user: number;
        _building: number;
        _complexBuilding: number;
        _component: number;
    };
    static OVERVIEW_MODE: {
        _map: number;
        _object: number;
    };
    static CLIP_AXIS_TYPE: {
        X: string;
        Y: string;
        HEIGHT: string;
        CUSTOM: string;
    };
    static _EMAP_KIND: {
        _BASE: number;
        _SAT: number;
    };
    static _MSG_WORK: {
        _WORK: number;
        _UPDATE_IMAGE_BUILDING: number;
        _UPDATE_MESH_BUILDING: number;
        _UPDATE_HEIGHT_BUILDING: number;
        _DELETE_MESH_BUILDING: number;
    };
    static _MSG: {
        _FAIL: string;
        _SUCCESS: string;
    };
    static DEPTH_PREVLINE_TYPE: {
        BASE: string;
        EXTENSIONS: string;
    };
    static MAJORFOLDER: {
        ROW: string;
        COLUM: string;
    };
    static PIXEL_RESOLUTION: {
        SD: number[];
        HD: number[];
        FHD: number[];
        QHD: number[];
        UHD: number[];
    };
    static DEFAULT_MAX_PROCESS: number;
    static DEFAULT_PIXEL_RATIO: number;
    static DEFAULT_RATIO_TILE_SIZE: number;
    static DEFAULT_RATIO_MODEL_TILE_SIZE: number;
    static FRAME_STATE: {
        IDLE: string;
        WORK: string;
    };
    static SELECT_MODE: {
        POINT: string;
        LINE: string;
        AREA: string;
        CIRCLE: string;
        BOX: string;
    };
    static SELECT_TYPE: {
        COLOR: string;
        OUTLINE: string;
    };
    static SUN_AMOUNT_MODE: {
        POINT: string;
        AREA: string;
    };
    static MEASURE_TYPE: {
        NONE: string;
        LINESTRING: string;
        MULTILINESTRING: string;
        POLYGON: string;
        MULTIPOLYGON: string;
        POINTBUFFER: string;
        POINT: string;
    };
    static RENDER_ORDER: {
        UNDER_PLANE: number;
        UNDER_GRID: number;
        SPEED_MODEL_FILTER: number;
        MEASURE: number;
        MODEL: number;
        ROAD: number;
        WATER: number;
        USER: number;
    };
    static POST_MATERIAL: {
        NORMAL: string;
        WORLD_POSITION: string;
    };
    static COMPONENT_ANIMATION: {
        ROUTE: string;
        HOVER_UP: string;
        HOVER_DOWN: string;
        MOVE_POINT: string;
        MOVE_SMOOTHLY: string;
        CROWD: string;
    };
    static TONEMAPPING: 4;
    static TONEMAPPING_EXPOSURE: number;
    static DRACO_DECODER_PATH: any;
    static TRANS_CODER_PATH: any;
    static MAX_HEIGHT: number;
    static g_TextureEncoding: "srgb";
    static g_ShadowMapType: 3;
    static debug: boolean;
    static imageDebug: boolean;
    static GLOBAL: {
        _APP: string;
        _GLOBAL: string;
    };
    static MaterialOpt: {
        image: {
            color: number;
            shininess: number;
            metalness: number;
            roughness: number;
            transparent: boolean;
            side: 2;
        };
        model: {
            color: number;
            shininess: number;
            metalness: number;
            roughness: number;
            transparent: boolean;
            opacity: number;
        };
    };
    static POSTLOADSKIRT: {
        UP: number;
        DOWN: number;
        LEFT: number;
        RIGHT: number;
    };
    static DEFAULT_MODEL_EMISSIVE_COLOR: {
        r: number;
        g: number;
        b: number;
    };
    static DEFAULT_IMAGE_EMISSIVE_COLOR: {
        r: number;
        g: number;
        b: number;
    };
    static cloudImgUrl: any;
    static fogColor: number;
    static fogValue: number;
    static APP_COMMAND_TPYE: {
        MAIN: string;
        SUB: string;
        ENV: string;
    };
    static RESOURCE: {
        TERRAIN_NORMAL: {
            NAME: string;
            URL: any;
            TEXTURE: any;
        };
        BLUE_NOSIE: {
            NAME: string;
            URL: any;
            TEXTURE: any;
        };
        ANCHOR_POINT: {
            NAME: string;
            URL: any;
            TEXTURE: any;
        };
    };
    static IMPROVE_TEXTURE_LEVEL: {
        none: number;
        low: number;
        medium: number;
        high: number;
        ultra: number;
    };
    static POSTPASS_TYPE: {
        DEFAULT_GRAPHIC: number;
        OPTIONAL_GRAPHIC: number;
        MAIN: number;
        ANALYSIS: number;
        UTIL: number;
    };
    static POSTPASS: {
        RENDER: any;
        POST: any;
        GTAO: any;
        OUT: any;
        BLOOM: any;
        SKYLINE: any;
        SUNAMOUNT: any;
        HEIGHT: any;
        DRAW_OVERLAY: any;
        FXAA: any;
        DITHER: any;
        UNKNOWN: any;
        BLITL: any;
        OUTLINE: any;
    };
    static RENDER_TYPE: {
        SCENE: string;
        GROUP: string;
        MODEL: string;
        TERRAIN: string;
        ANALY: string;
        CUSTOM: string;
        USER: string;
    };
    static DRAW_TYPE: {
        DEFAULT: number;
        BASE: number;
        SWIPE: number;
    };
    static IDLE_DRAW_SPEED: {
        FAST: number;
        DEFAULT: number;
        SLOW: number;
    };
    static U3DVIEW_CAMERA_NAME: string;
    static LABEL_DOM_CLASSNAME: string;
    static MODEL_IMAGE_UPDATE_DISTANCE: number;
    /**
     * 라벨 DOM 클래스 이름을 반환한다.
     * 주 사용처: UCssBilboard에서 라벨 root div의 className 설정에 사용한다.
     * @returns {string} 라벨 DOM 클래스 이름.
     *
     * @ignore
     */
    static getLabelDomClassName(): string;
    /**
     * 라벨 DOM 클래스 이름을 설정한다.
     * @param {string} name 설정할 라벨 DOM 클래스 이름.
     * @returns {void}
     *
     * @ignore
     */
    static setLabelDomClassName(name: string): void;
    /**
     * URL에서 query와 hash를 제외한 파일 확장자를 반환한다.
     * 주 사용처: UTextureLoader에서 텍스처 URL 확장자 판별에 사용한다.
     * @param {string} url 확장자를 확인할 URL.
     * @returns {string} 소문자 파일 확장자. 확장자가 없으면 빈 문자열.
     *
     * @ignore
     */
    static getUrlExtension(url: string): string;
    /**
     * Union3D Web 버전을 반환하는 함수
     * 주 사용처: U3dApp.getVersion과 GeOnDT.version 초기화에 사용한다.
     * @returns {string}
     *
     * @ignore
     */
    static getVersion(): string;
    /**
     * Union3D Web 저작권 문구를 반환한다.
     * 주 사용처: GeOnDT.copyright 초기화에 사용한다.
     * @returns {string} 저작권 문구.
     *
     * @ignore
     */
    static getCopyright(): string;
    /**
     * x, y, level과 선택 title을 조합해 타일/데이터 캐시 키를 생성한다.
     * 주 사용처: U3dQuadTile, U3dVectorLayer, U3dImagePBFLayer, U3dModelShapeLayer에서 타일 키 생성에 사용한다.
     * @param {number | string} x 키에 포함할 x 값.
     * @param {number | string} y 키에 포함할 y 값.
     * @param {number | string} level 키에 포함할 level 값.
     * @param {string} [title] 키에 추가할 선택 title 값.
     * @returns {string} 조합된 키 문자열.
     *
     * @ignore
     */
    static createKey(x: number | string, y: number | string, level: number | string, title?: string): string;
    static "__#2@#uuidStorage": any[];
    /**
     * UUID 캐시에서 UUID를 꺼내거나 캐시가 비어 있으면 새 UUID를 생성한다.
     * 주 사용처: U3dObject, U3DTileset, UFileLoader, geometry, select, quadtree 계열 객체의 식별자 생성에 사용한다.
     * @returns {string} UUID 문자열.
     *
     * @ignore
     */
    static createUUID(): string;
    /**
     * 내부 UUID 캐시가 부족할 때 새 UUID를 미리 저장한다.
     * 주 사용처: U3dApp의 업데이트 흐름에서 UUID 캐시 보충에 사용한다.
     * @returns {void}
     *
     * @ignore
     */
    static saveUUID(): void;
    /**
     * U3F bbox와 index를 조합해 U3F 객체 식별자 문자열을 생성한다.
     * 주 사용처: UI3FParser와 U3FParser2_2, U3FParser2_3에서 oid/id 생성에 사용한다.
     * @param {Array<number>} bbox 식별자에 사용할 bounding box 값 배열.
     * @param {number | string} index 식별자에 추가할 index 값.
     * @returns {string} U3F 객체 식별자 문자열.
     *
     * @ignore
     */
    static createIDU3F(bbox: Array<number>, index: number | string): string;
    /**
     * 값의 문자열 길이가 지정 폭보다 짧으면 앞쪽을 0으로 채운다.
     * 주 사용처: UDEF.createGoogleKey에서 좌표 기반 Google key 생성 보조에 사용한다.
     * @param {number | string} n 0으로 채울 값.
     * @param {number} width 목표 문자열 길이.
     * @returns {string} 지정 폭에 맞춘 문자열.
     *
     * @ignore
     */
    static numberPad(n: number | string, width: number): string;
    /**
     * deferred와 Yield 가 합쳐진, 작업을 비동기로 실행하는 함수입니다.
     *
     * @template [T=any]
     * @param {(resolve: DeferredResolveFunc<T>, reject: DeferredRejectFunc<T>) => unknown} callback 비동기로 실행할 작업
     * @param {boolean} [isYield=false] true이면 강제 Yield를 실행하고, false이면 scheduler가 Yield 여부를 판단합니다.
     * @returns {Promise<T>} 작업 완료를 알리는 Promise
     *
     * @ignore
     */
    static createPromise<T = any>(callback: (resolve: DeferredResolveFunc<T>, reject: DeferredRejectFunc<T>) => unknown, isYield?: boolean): Promise<T>;
    /**
     * Draco decoder 경로를 설정한다.
     * 주 사용처: GeOnDT.setDracoDecoderPath에서 Draco decoder 경로 설정을 위임할 때 사용한다.
     * @param {string} path 설정할 Draco decoder 경로.
     * @returns {void}
     *
     * @ignore
     */
    static setDracoDecoderPath(path: string): void;
    /**
     * Draco decoder 경로를 반환한다.
     * 주 사용처: GeOnDT.getDracoDecoderPath에서 현재 Draco decoder 경로 조회를 위임할 때 사용한다.
     * @returns {string} Draco decoder 경로.
     *
     * @ignore
     */
    static getDracoDecoderPath(): string;
    /**
     * transcoder 경로를 설정한다.
     * 주 사용처: GeOnDT.setTransCoderPath에서 transcoder 경로 설정을 위임할 때 사용한다.
     * @param {string} path 설정할 transcoder 경로.
     * @returns {void}
     *
     * @ignore
     */
    static setTransCoderPath(path: string): void;
    /**
     * transcoder 경로를 반환한다.
     * 주 사용처: GeOnDT.getTransCoderPath에서 현재 transcoder 경로 조회를 위임할 때 사용한다.
     * @returns {string} transcoder 경로.
     *
     * @ignore
     */
    static getTransCoderPath(): string;
    /**
     * 버전 1.3 I3F vertex 좌표를 변환해 U3F 객체 식별자 문자열을 생성한다.
     * 주 사용처: UI3FParser에서 구버전 I3F 데이터의 id 생성에 사용한다.
     * @param {Array<number>} vertex 기준 vertex 좌표 배열.
     * @param {number} offsetX x 좌표에 더할 offset 값.
     * @param {number} offsetY y 좌표에 더할 offset 값.
     * @param {SimpleRect} grRect 원본 좌표가 속한 rect.
     * @param {SimpleRect} grDataRect 변환 대상 rect.
     * @returns {string | undefined} 변환된 U3F 객체 식별자 문자열. vertex가 없으면 undefined.
     *
     * @ignore
     */
    static createIDU3F_To_Version1_3(vertex: Array<number>, offsetX: number, offsetY: number, grRect: SimpleRect, grDataRect: SimpleRect): string | undefined;
    /**
     * Google 좌표 x, y를 고정 폭 문자열로 변환해 key를 생성한다.
     * 주 사용처: U3dModelDxfLayer와 U3dModelShapeLayer에서 모델 userData id 생성에 사용한다.
     * @param {number | null | undefined} x Google x 좌표.
     * @param {number | null | undefined} y Google y 좌표.
     * @returns {string} 좌표 기반 key 문자열. 좌표가 없으면 undefined.
     *
     * @ignore
     */
    static createGoogleKey(x: number | null | undefined, y: number | null | undefined): string;
    /**
     * readString은 parser 계열에서 매우 자주 호출되므로 TextDecoder 인스턴스를 재사용한다.
     * 기존 readString은 호출마다 같은 기본 UTF-8 설정의 TextDecoder를 생성했다.
     * decode 호출에 stream 옵션을 사용하지 않으면 호출마다 독립적으로 디코딩이 끝나므로,
     * 동일 설정의 decoder를 공유해도 기존 실행 결과는 유지하면서 반복 객체 생성을 줄일 수 있다.
     * @type {TextDecoder}
     *
     * @ignore
     */
    static "__#2@#textDecoder": TextDecoder;
    /**
     * UByteBuffer에서 지정 길이만큼 byte array를 읽어 문자열로 변환한다.
     * 주 사용처: UI3FParser, U3FParser, U3FPackageParser, U3FParser2 계열에서 바이너리 헤더와 문자열 필드 파싱에 사용한다.
     * 사용처 점검: parser 계열에서 length 값을 파일 데이터에서 읽어 전달하므로 잘못된 길이는 UByteBuffer 범위 검사에 의해 예외가 발생할 수 있다.
     * @param {import('@union3d/core/UByteBuffer').UByteBuffer} buffer 문자열을 읽을 byte buffer.
     * @param {number} length 읽을 byte 길이.
     * @returns {string} 디코딩된 문자열.
     *
     * @ignore
     */
    static readString(buffer: UByteBuffer, length: number): string;
    /**
     * 현재 texture color space 설정을 반환한다.
     * 주 사용처: UDEF 내부 texture 설정, UParticle 색상 설정, UTDSLoader texture colorSpace 설정에 사용한다.
     * @returns {import('three').ColorSpace} texture color space 값.
     *
     * @ignore
     */
    static getShadowEncoding(): three.ColorSpace;
    /**
     * 현재 shadow map type 설정을 반환한다.
     * 주 사용처: U3dApp.setShadow, USpotLight.setShadow, CharacterControls에서 renderer shadowMap.type 설정에 사용한다.
     * @returns {import('three').ShadowMapType} shadow map type 값.
     *
     * @ignore
     */
    static getShadowMapType(): three.ShadowMapType;
    /**
     * shadow map type 설정을 변경한다.
     * 주 사용처: 쓰이지 않음.
     * @param {import('three').ShadowMapType} type 설정할 shadow map type 값.
     * @returns {void}
     *
     * @ignore
     */
    static setShadowMapType(type: three.ShadowMapType): void;
    /**
     * texture 크기 변경 없이 wrapping, filter, colorSpace 기본값을 설정한다.
     * 주 사용처: annotation, model, image layer와 parser 계열에서 로드된 texture 기본 설정에 사용한다.
     * 사용처 점검: 대부분 texture 생성 직후 호출되며, wrapping을 생략하면 ClampToEdgeWrapping이 적용된다.
     * @param {import('three').Texture} texture 설정할 texture.
     * @param {import('three').Wrapping} [wrapping] texture wrapS, wrapT에 적용할 wrapping 값.
     * @returns {void}
     *
     * @ignore
     */
    static noResizeTexture(texture: three.Texture, wrapping?: three.Wrapping): void;
    /**
     * texture 품질 개선을 위해 wrapping, filter, colorSpace, anisotropy를 설정한다.
     * 주 사용처: UClipImageFilter, U3dImageLayer, U3dModelTilesLayer, U3dModelU3FLayer, U3dPatternXYZLayer에서 texture 품질 개선 단계에 사용한다.
     * @param {import('three').Texture} texture 개선 설정을 적용할 texture.
     * @param {import('three').WebGLRenderer | null | undefined} renderer anisotropy 한계값을 조회할 renderer.
     * @returns {void}
     *
     * @ignore
     */
    static setTextureImprovement(texture: three.Texture, renderer: three.WebGLRenderer | null | undefined): void;
    static TERRAIN_MAX_NORMAL_SIZE: number;
    static TERRAIN_MIN_NORMAL_SIZE: number;
    static NORMAL_REFER_LEVEL: number;
    static FAR_NORMAL_DECREASE_RATIO: number;
    static NEAR_NORMAL_DECREASE_RATIO: number;
    /**
     * 지형 material에 terrain normal texture와 tile level 기반 normalScale을 설정한다.
     * 주 사용처: U3dImageLayer에서 지형 mesh material의 normal texture 설정에 사용한다.
     * @param {import('three').Material & {normalScale?: import('three').Vector2, normalMap?: import('three').Texture | null, normalMapType?: import('three').NormalMapTypes}} material normal texture를 설정할 material.
     * @param {number} [tileLevel] normalScale 계산에 사용할 tile level.
     * @returns {void}
     *
     * @ignore
     */
    static setTerrainNormalTexture(material: three.Material & {
        normalScale?: three.Vector2;
        normalMap?: three.Texture | null;
        normalMapType?: three.NormalMapTypes;
    }, tileLevel?: number): void;
    /**
     * degree 값을 radian 값으로 변환한다.
     * 주 사용처: UAnalyLandScape, U3dComponentPosition, U3dLodComponentLayer, U3dMultipleComponentLayer, PointerLockDriveControls에서 회전 각도 변환에 사용한다.
     * @param {number} degrees 변환할 degree 값.
     * @returns {number} 변환된 radian 값.
     *
     * @ignore
     */
    static DegreesToRadians(degrees: number): number;
    /**
     * radian 값을 degree 값으로 변환한다.
     * 주 사용처: UAlignControls와 createVectorTilePoints에서 label, tile 좌표 각도 변환에 사용한다.
     * @param {number} radians 변환할 radian 값.
     * @returns {number} 변환된 degree 값.
     *
     * @ignore
     */
    static RadiansToDegrees(radians: number): number;
    /**
     * degree 값을 radian 값으로 변환한다.
     * 주 사용처: U3dView, U3dViewLight, USpotLight, U3dSimpleView와 geometry 계열에서 카메라/조명/모델 회전값 변환에 사용한다.
     * @param {number} degrees 변환할 degree 값.
     * @returns {number} 변환된 radian 값.
     *
     * @ignore
     */
    static DegToRad(degrees: number): number;
    /**
     * radian 값을 degree 값으로 변환한다.
     * 주 사용처: U3dView, U3dViewLight, USpotLight, UAnalyGizmoModel에서 카메라/조명/모델 회전값 표시와 저장에 사용한다.
     * @param {number} radians 변환할 radian 값.
     * @returns {number} 변환된 degree 값.
     *
     * @ignore
     */
    static RadToDeg(radians: number): number;
    /**
     * degree 값을 radian 값으로 변환하는 공통 래퍼이다.
     * 주 사용처: env, analy, mode, view, controls, parser 계열에서 회전과 방위각 계산에 폭넓게 사용한다.
     * 사용처 점검: PointerLockDriveControls에 bitwise 연산 결과를 전달하는 호출이 있어 의도한 각도 계산인지 별도 확인 여지가 있다.
     * @param {number} e 변환할 degree 값.
     * @returns {number} 변환된 radian 값.
     *
     * @ignore
     */
    static radians(e: number): number;
    /**
     * radian 값을 degree 값으로 변환하는 공통 래퍼이다.
     * 주 사용처: analy, mode, view 계열에서 회전값 표시, 저장, 계산에 폭넓게 사용한다.
     * @param {number} e 변환할 radian 값.
     * @returns {number} 변환된 degree 값.
     *
     * @ignore
     */
    static degrees(e: number): number;
    /**
     * 현재 브라우저가 Internet Explorer 계열인지 확인한다.
     * 주 사용처: U3dApp 초기화에서 Internet Explorer 환경 여부를 판별할 때 사용한다.
     * @returns {boolean} Internet Explorer 계열이면 true, 아니면 false.
     *
     * @ignore
     */
    static checkInternetExplorer(): boolean;
    /**
     * 전체 경로에서 파일명을 제외한 상위 경로 문자열을 반환한다.
     * 주 사용처: U3dModelI3FLayer에서 I3F 이미지 URL의 상위 경로를 구성할 때 사용한다.
     * @param {string} fullPath 파일명을 포함한 전체 경로.
     * @returns {string} 파일명을 제외하고 마지막 slash까지 포함한 경로.
     *
     * @ignore
     */
    static getPath(fullPath: string): string;
    /**
     * 경로 문자열에서 마지막 파일명 부분을 반환한다.
     * 주 사용처: U3dModelBasicLayer와 U3dModelTdsLayer에서 파일명과 모델 이름을 구성할 때 사용한다.
     * @param {string} path 파일명을 포함한 경로.
     * @returns {string} 경로의 마지막 파일명 부분.
     *
     * @ignore
     */
    static getFilename(path: string): string;
    /**
     * 파일명에서 마지막 확장자를 제거한 문자열을 반환한다.
     * 주 사용처: U3dModelBasicLayer와 U3dModelTdsLayer에서 모델 이름 생성 및 확장자 교체에 사용한다.
     * 사용처 점검: 파일명에 dot이 없으면 빈 문자열을 반환한다.
     * @param {string} fileName 확장자를 제거할 파일명.
     * @returns {string} 마지막 확장자를 제외한 파일명.
     *
     * @ignore
     */
    static removeExt(fileName: string): string;
    /**
     * 조건이 false 계열 값이면 오류를 출력하고 예외를 발생시킨다.
     * 주 사용처: U3dApp, layer, analy, i3f, mesh, view 계열에서 필수 인자와 내부 상태 검증에 사용한다.
     * @param {unknown} condition 검증할 조건 값.
     * @param {string} [message] 실패 시 출력하고 Error에 포함할 메시지.
     * @returns {void}
     *
     * @ignore
     */
    static assert(condition: unknown, message?: string): void;
    static ASSERT: typeof UDEF.assert;
    /**
     * image layer용 material을 생성하거나 전달받은 material에 image layer 기본 속성을 설정한다.
     * 주 사용처: U3dImageLayer와 U3dPatternXYZLayer에서 image layer material 생성 및 초기 설정에 사용한다.
     * @param {import('three').Material | undefined} [material] 설정할 material. 없으면 새 MeshPhongMaterial을 생성한다.
     * @returns {import('three').Material} 설정된 image layer material.
     *
     * @ignore
     */
    static createOrSetImageLayerMaterial(material?: three.Material | undefined): three.Material;
    /**
     * image layer material 공통 속성을 설정한다.
     * 주 사용처: UDEF.createOrSetImageLayerMaterial 내부에서 image layer material 속성 보정에 사용한다.
     * @param {import('three').Material} material 설정할 image layer material.
     * @returns {import('three').Material} 설정된 image layer material.
     *
     * @ignore
     */
    static settingImageLayerMaterial(material: three.Material): three.Material;
    /**
     * model layer material 공통 속성과 material 타입별 렌더링 속성을 설정한다.
     * 주 사용처: UTDSLoader, U3dModelLayer, USharedMaterial, U3dCustomModelMesh에서 model material 기본값 보정에 사용한다.
     * @param {import('three').Material} material 설정할 model layer material.
     * @returns {import('three').Material} 설정된 model layer material.
     *
     * @ignore
     */
    static settingModelLayerMaterial(material: three.Material): three.Material;
    /**
     * sun flare 사용 여부를 설정한다.
     * 주 사용처: U3dApp 초기화와 sun flare 표시 옵션 변경 시 전역 sun flare 사용 여부를 동기화하는 데 사용한다.
     * @param {boolean} val 설정할 sun flare 사용 여부.
     * @returns {void}
     *
     * @ignore
     */
    static setUseSunFlare(val: boolean): void;
    /**
     * sun flare 사용 여부를 반환한다.
     * 주 사용처: U3dModelTilesLayer에서 sun flare 활성 상태에 따라 material metalness와 roughness 보정 여부를 판단할 때 사용한다.
     * @returns {boolean} sun flare 사용 여부.
     *
     * @ignore
     */
    static getUseSunFlare(): boolean;
    /**
     * 기본 fog 설정 정보를 반환한다.
     * 사용처 점검: 새 객체를 반환하므로 반환 객체를 수정해도 UDEF.fogColor, UDEF.fogValue 자체는 변경되지 않는다.
     * @returns {{color: number, value: number}} 기본 fog color와 fog value.
     *
     * @ignore
     */
    static getDefaultFogInfo(): {
        color: number;
        value: number;
    };
    /**
     * cloud image URL 경로를 설정한다.
     * 주 사용처: 쓰이지 않음.
     * 사용처 점검: 입력값을 검증하지 않고 저장하므로 getCloudImgUrl 반환 경로는 UDEF.path와 저장된 값의 단순 결합 결과가 된다.
     * @param {string} val 설정할 cloud image URL 경로.
     * @returns {void}
     *
     * @ignore
     */
    static setCloudImgUrl(val: string): void;
    /**
     * GeOnDT 기본 경로와 cloud image URL 경로를 결합해 반환한다.
     * 주 사용처: U3dCloud와 UParticleEngine에서 rain cloud와 particle 기본 이미지 경로를 가져올 때 사용한다.
     * 사용처 점검: UDEF.path 또는 UDEF.cloudImgUrl의 slash 포함 여부에 따라 결합 문자열이 달라질 수 있는 현재 동작이 유지된다.
     * @returns {string} cloud image 전체 URL 경로.
     *
     * @ignore
     */
    static getCloudImgUrl(): string;
    /**
     * 객체의 dispose를 실행하고 소유권에 맞게 자식과 렌더 자원을 정리합니다.
     * Three.js 기본 Object3D/InstancedMesh에는 공통 자원 정리를 보충합니다.
     * 커스텀 dispose는 자식까지 포함한 소유 자원 정리를 담당하며, 공통 함수는 이를 반복하지 않습니다.
     * callback은 공통 자원 정리 경로에 전달되며, 커스텀 dispose 자체에는 전달되지 않습니다.
     *
     * @param {Record<string, any>} obj 해제할 단일 Object3D 또는 리소스 객체입니다. 배열은 받지 않습니다.
     * @param {function} [callback] 공통 자원 정리 후 실행할 콜백입니다.
     *
     * @ignore
     */
    static disposeObject3D(obj: Record<string, any>, callback?: Function): void;
    /**
     * 단독 소유한 material, geometry, skeleton texture와 자식을 정리한 뒤 리스너를 해제합니다.
     * material 배열, map과 _oriMap, UMesh의 _opt에 중복된 재질과 텍스처는 같은 호출 안에서 한 번만 해제합니다.
     * 객체의 dispose 알림은 호출자가 먼저 실행해야 하며, 공유 자원의 반납은 해당 소유자가 별도로 처리해야 합니다.
     *
     * @param {Record<string, any>} obj 단독 소유 자원을 정리할 객체입니다.
     * @param {function} [callback] 본체 자원 정리 후, 자식과 리스너 정리 전에 실행할 콜백입니다.
     *
     * @ignore
     */
    static disposeResource(obj: Record<string, any>, callback?: Function): void;
    /**
     * Date 인스턴스에 format 함수를 추가하고 숫자/문자열 zero-fill helper를 준비한다.
     * 주 사용처: U3dApp.setTimeSun, U3dApp.getTimeSunset, U3dApp.getTimeSunrise에서 현재 시간과 일출/일몰 시간을 표시 형식으로 변환할 수 있게 보정한다.
     * 사용처 점검: String.prototype과 Number.prototype을 확장하는 전역 영향이 있으나, 중복 정의를 피하는 guard 후 추가하는 현재 동작을 유지한다.
     * @param {Date & Record<string, any>} date format 함수를 추가할 Date 객체.
     * @returns {Date & Record<string, any>} format 함수가 준비된 Date 객체.
     *
     * @ignore
     */
    static setDateFormat(date: Date & Record<string, any>): Date & Record<string, any>;
    /**
     * 0~1 범위의 RGB 값을 three Color.setHSL에서 사용할 HSL 배열로 변환한다.
     * 주 사용처: UParticle.update에서 Vector3 또는 THREE.Color로 보간된 particle 색상을 HSL로 변환해 TEMP_COLOR.setHSL에 전달한다.
     * 사용처 점검: 호출부는 Vector3.x/y/z 또는 Color.r/g/b의 number 값을 넘기며, 배열이 아니라 배열 안의 number를 개별 인자로 전달한다.
     * @param {number} r red 채널 값.
     * @param {number} g green 채널 값.
     * @param {number} b blue 채널 값.
     * @returns {Array<number>} h, s, l 순서의 HSL 값 배열.
     *
     * @ignore
     */
    static rgbToHsl(r: number, g: number, b: number): Array<number>;
    /**
     * terrain 충돌 검사에 사용할 RBush 인덱스를 생성하거나 제거한다.
     * 주 사용처: UPointLockFlyControls의 terrain 교차 검사에서 UDEF.RBUSH가 없을 때 지연 초기화하는 데 사용한다.
     * 사용처 점검: 호출부는 true만 전달해 생성 흐름만 사용하며, false 전달 시 전역 UDEF.RBUSH를 제거하는 현재 동작을 유지한다.
     * @param {boolean} val true이면 RBush 인스턴스를 생성하고 false이면 제거한다.
     * @returns {void}
     *
     * @ignore
     */
    static setRBush(val: boolean): void;
    /**
     * three Color 또는 rgb 문자열을 CSS hex color 문자열로 변환한다.
     * 주 사용처: U3dComponentPosition, U3dAdaptedGeometry, U3dHeatGeometry의 저장 데이터 생성 시 style.color 값을 직렬화하는 데 사용한다.
     * 사용처 점검: 호출부는 three Color 계열 값을 전달하며, 변환 실패 시 U3dComponentPosition은 기본값으로 보정하지만 다른 geometry 저장 흐름은 null이 그대로 저장될 수 있다.
     * @param {import('three').ColorRepresentation} rgb 변환할 three Color 또는 rgb 문자열.
     * @returns {string | null} 변환된 hex color 문자열. 변환할 수 없으면 null.
     *
     * @ignore
     */
    static rgbStringToHex(rgb: three.ColorRepresentation): string | null;
    /**
     * geometry position 값이 지정 임계값보다 큰 월드 좌표계 값인지 판별한다.
     * 주 사용처: UTDSLoader에서 3DS geometry가 월드 좌표로 들어온 경우 중심점을 빼서 모델 좌표로 보정할지 판단할 때 사용한다.
     * 사용처 점검: 앞쪽 position 값 최대 30개만 샘플링하므로 큰 좌표가 뒤쪽에만 있는 geometry는 월드 좌표로 판별되지 않을 수 있는 현재 동작을 유지한다.
     * @param {import('three').BufferGeometry} geometry 검사할 geometry 객체.
     * @param {number} [threshold=10000] 월드 좌표 여부를 판단할 절대값 임계값.
     * @returns {boolean} position 값이 임계값보다 크면 true.
     *
     * @ignore
     */
    static isWorldCoordinate(geometry: three.BufferGeometry, threshold?: number): boolean;
    /**
     * 입력 값을 THREE.Vector3 형식으로 변환하는 함수입니다.
     * @param {import('three').Vector3| import('three').Vector3Like | Array<number>} value 입력 값
     * @returns {import('three').Vector3} 변환된 벡터
     */
    static toVector3(value: three.Vector3 | three.Vector3Like | Array<number>): three.Vector3;
}

export type { UDEF };
