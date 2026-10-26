// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * metadata 2.0 좌표 정의 보관을 담당합니다.<br>
 * 생성 시 옵션 키를 정규화하고 필수 키를 확인하며 값 검증은 사용하는 모듈이 담당합니다.<br>
 * 객체·배열·Geometry는 복사하지 않고 참조로 보관하며 자원 해제나 파일 요청은 수행하지 않습니다.
 *
 * @group A3F
 * @summary metadata 2.0 좌표 정의 보관
 */
declare class UA3FCoordinateVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FCoordinateVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 값을 보관하며 필드 값의 유효성은 검증하지 않습니다.
     *
     * @param {UA3FCoordinateVoCO} opt 모든 키가 필수이며 null·생략 불가, 객체·배열은 참조로 보관하고 원본 옵션은 변경하지 않음
     */
    constructor(opt: UA3FCoordinateVoCO);
    /** @type {string} */
    _sourceCrs: string;
    /**
     * 출력 수평 좌표계를 보관합니다.
     *
     * @type {'EPSG:3857'} 월드 좌표(EPSG:3857)의 출력 CRS
     */
    _targetCrs: "EPSG:3857";
    /** @type {'projected' | 'world'} */
    _coordinateType: "projected" | "world";
    /** @type {string | null} */
    _worldProfile: string | null;
    /** @type {'local' | 'absolute'} */
    _positionSpace: "local" | "absolute";
    /** @type {[number, number, number]} */
    _origin: [number, number, number];
    /** @type {'meters' | 'mercator-world'} */
    _heightEncoding: "meters" | "mercator-world";
    /** @type {'none' | 'per-node-latitude' | 'reference-y'} */
    _heightScaleMode: "none" | "per-node-latitude" | "reference-y";
    /** @type {string | null} */
    _heightScaleFieldId: string | null;
    /** @type {number | null} */
    _heightScaleReferenceY: number | null;
    /** @type {number | null} */
    _heightScaleValue: number | null;
    /** @type {[number, number, number, number]} */
    _projectedBounds: [number, number, number, number];
    /** @type {[number, number, number]} */
    _baseRenderBoundsMin: [number, number, number];
    /** @type {[number, number, number]} */
    _baseRenderBoundsMax: [number, number, number];
    /**
     * sourceCrs 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string} value 원본 좌표계 식별자이며 현재 자료는 EPSG:5187
     */
    set sourceCrs(value: string);
    /**
     * sourceCrs 값을 반환합니다.
     *
     * @returns {string} 원본 좌표계 식별자이며 현재 자료는 EPSG:5187
     */
    get sourceCrs(): string;
    /**
     * targetCrs 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'EPSG:3857'} value 월드 좌표(EPSG:3857)의 출력 CRS
     */
    set targetCrs(value: "EPSG:3857");
    /**
     * targetCrs 값을 반환합니다.
     *
     * @returns {'EPSG:3857'} 월드 좌표(EPSG:3857)의 출력 CRS
     */
    get targetCrs(): "EPSG:3857";
    /**
     * coordinateType 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'projected' | 'world'} value projected는 XY 투영 좌표·미터 Z, world는 엔진 월드 Z
     */
    set coordinateType(value: "projected" | "world");
    /**
     * coordinateType 값을 반환합니다.
     *
     * @returns {'projected' | 'world'} projected는 XY 투영 좌표·미터 Z, world는 엔진 월드 Z
     */
    get coordinateType(): "projected" | "world";
    /**
     * worldProfile 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string | null} value world의 높이 배율 프로파일, projected는 null
     */
    set worldProfile(value: string | null);
    /**
     * worldProfile 값을 반환합니다.
     *
     * @returns {string | null} world의 높이 배율 프로파일, projected는 null
     */
    get worldProfile(): string | null;
    /**
     * positionSpace 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'local' | 'absolute'} value local은 origin을 뺀 배열, absolute는 origin [0,0,0]
     */
    set positionSpace(value: "local" | "absolute");
    /**
     * positionSpace 값을 반환합니다.
     *
     * @returns {'local' | 'absolute'} local은 origin을 뺀 배열, absolute는 origin [0,0,0]
     */
    get positionSpace(): "local" | "absolute";
    /**
     * origin 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[number, number, number]} value 저장한 position과 같은 공간의 고정 XYZ 기준점, 복사 없이 참조로 보관
     */
    set origin(value: [number, number, number]);
    /**
     * origin 값을 반환합니다.
     *
     * @returns {[number, number, number]} 저장한 position과 같은 공간의 고정 XYZ 기준점, 보관한 참조
     */
    get origin(): [number, number, number];
    /**
     * heightEncoding 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'meters' | 'mercator-world'} value position Z의 표현 단위
     */
    set heightEncoding(value: "meters" | "mercator-world");
    /**
     * heightEncoding 값을 반환합니다.
     *
     * @returns {'meters' | 'mercator-world'} position Z의 표현 단위
     */
    get heightEncoding(): "meters" | "mercator-world";
    /**
     * heightScaleMode 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'none' | 'per-node-latitude' | 'reference-y'} value 실제 metadata 2.0 이름 유지
     */
    set heightScaleMode(value: "none" | "per-node-latitude" | "reference-y");
    /**
     * heightScaleMode 값을 반환합니다.
     *
     * @returns {'none' | 'per-node-latitude' | 'reference-y'} 실제 metadata 2.0 이름 유지
     */
    get heightScaleMode(): "none" | "per-node-latitude" | "reference-y";
    /**
     * heightScaleFieldId 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string | null} value 정점별 배율 필드 식별자
     */
    set heightScaleFieldId(value: string | null);
    /**
     * heightScaleFieldId 값을 반환합니다.
     *
     * @returns {string | null} 정점별 배율 필드 식별자
     */
    get heightScaleFieldId(): string | null;
    /**
     * heightScaleReferenceY 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {number | null} value reference-y의 기준 월드 Y
     */
    set heightScaleReferenceY(value: number | null);
    /**
     * heightScaleReferenceY 값을 반환합니다.
     *
     * @returns {number | null} reference-y의 기준 월드 Y
     */
    get heightScaleReferenceY(): number | null;
    /**
     * heightScaleValue 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {number | null} value 미터 높이에 곱하는 공통 월드 배율
     */
    set heightScaleValue(value: number | null);
    /**
     * heightScaleValue 값을 반환합니다.
     *
     * @returns {number | null} 미터 높이에 곱하는 공통 월드 배율
     */
    get heightScaleValue(): number | null;
    /**
     * projectedBounds 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[number, number, number, number]} value 월드 좌표(EPSG:3857)의 minX,minY,maxX,maxY, 복사 없이 참조로 보관
     */
    set projectedBounds(value: [number, number, number, number]);
    /**
     * projectedBounds 값을 반환합니다.
     *
     * @returns {[number, number, number, number]} 월드 좌표(EPSG:3857)의 minX,minY,maxX,maxY, 보관한 참조
     */
    get projectedBounds(): [number, number, number, number];
    /**
     * baseRenderBoundsMin 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[number, number, number]} value 저장된 바탕 position 공간의 최솟값, 복사 없이 참조로 보관
     */
    set baseRenderBoundsMin(value: [number, number, number]);
    /**
     * baseRenderBoundsMin 값을 반환합니다.
     *
     * @returns {[number, number, number]} 저장된 바탕 position 공간의 최솟값, 보관한 참조
     */
    get baseRenderBoundsMin(): [number, number, number];
    /**
     * baseRenderBoundsMax 값을 저장합니다.<br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[number, number, number]} value 저장된 바탕 position 공간의 최댓값, 복사 없이 참조로 보관
     */
    set baseRenderBoundsMax(value: [number, number, number]);
    /**
     * baseRenderBoundsMax 값을 반환합니다.
     *
     * @returns {[number, number, number]} 저장된 바탕 position 공간의 최댓값, 보관한 참조
     */
    get baseRenderBoundsMax(): [number, number, number];
}

/**
     * UA3FCoordinateVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FCoordinateVoCO_Content = {
        /**
         * 원본 좌표계 식별자이며 현재 자료는 EPSG:5187
         */
        sourceCrs: string;
        /**
         * 월드 좌표(EPSG:3857)의 출력 CRS
         */
        targetCrs: "EPSG:3857";
        /**
         * projected는 XY 투영 좌표·미터 Z, world는 엔진 월드 Z
         */
        coordinateType: "projected" | "world";
        /**
         * world의 높이 배율 프로파일, projected는 null
         */
        worldProfile: string | null;
        /**
         * local은 origin을 뺀 배열, absolute는 origin [0,0,0]
         */
        positionSpace: "local" | "absolute";
        /**
         * 저장한 position과 같은 공간의 고정 XYZ 기준점
         */
        origin: [number, number, number];
        /**
         * position Z의 표현 단위
         */
        heightEncoding: "meters" | "mercator-world";
        /**
         * 실제 metadata 2.0 이름 유지
         */
        heightScaleMode: "none" | "per-node-latitude" | "reference-y";
        /**
         * 정점별 배율 필드 식별자
         */
        heightScaleFieldId: string | null;
        /**
         * reference-y의 기준 월드 Y
         */
        heightScaleReferenceY: number | null;
        /**
         * 미터 높이에 곱하는 공통 월드 배율
         */
        heightScaleValue: number | null;
        /**
         * 월드 좌표(EPSG:3857)의 minX,minY,maxX,maxY
         */
        projectedBounds: [number, number, number, number];
        /**
         * 저장된 바탕 position 공간의 최솟값
         */
        baseRenderBoundsMin: [number, number, number];
        /**
         * 저장된 바탕 position 공간의 최댓값
         */
        baseRenderBoundsMax: [number, number, number];
    };

/**
     * UA3FCoordinateVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FCoordinateVoCO = UA3FCoordinateVoCO_Content;

export type { UA3FCoordinateVo, UA3FCoordinateVoCO, UA3FCoordinateVoCO_Content };
