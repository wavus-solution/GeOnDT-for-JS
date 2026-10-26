// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FSpatialCamera } from "../UA3FSpatialSelectionExecutor.js";

/**
 * 한 번의 공간 선택에 사용할 카메라·화면·콘텐츠 기준을 전달합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
     *
 * @group A3F
 * @summary 한 번의 공간 선택에 사용할 카메라·화면·콘텐츠 기준을 전달합니다.
 */
declare class UA3FSpatialViewVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FSpatialViewVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FSpatialViewVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FSpatialViewVoCO);
    /** @type {UA3FSpatialCamera} */
    _camera: UA3FSpatialCamera;
    /** @type {number} */
    _viewportHeight: number;
    /** @type {[number, number, number, number] | null} */
    _viewBoundsXY: [number, number, number, number] | null;
    /** @type {string} */
    _contentKey: string;
    /**
     * 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {UA3FSpatialCamera} value 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지
     */
    set camera(value: UA3FSpatialCamera);
    /**
     * 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지 값을 반환합니다.
     *
     * @returns {UA3FSpatialCamera} 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지
     */
    get camera(): UA3FSpatialCamera;
    /**
     * 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음
     */
    set viewportHeight(value: number);
    /**
     * 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음 값을 반환합니다.
     *
     * @returns {number} 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음
     */
    get viewportHeight(): number;
    /**
     * 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {[number, number, number, number] | null} value 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null
     */
    set viewBoundsXY(value: [number, number, number, number] | null);
    /**
     * 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null 값을 반환합니다.
     *
     * @returns {[number, number, number, number] | null} 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null
     */
    get viewBoundsXY(): [number, number, number, number] | null;
    /**
     * 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키
     */
    set contentKey(value: string);
    /**
     * 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키 값을 반환합니다.
     *
     * @returns {string} 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키
     */
    get contentKey(): string;
}

/**
     * UA3FSpatialViewVo 생성자 옵션입니다.
     */
    type UA3FSpatialViewVoCO_Content = {
        /**
         * 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지
         */
        camera: UA3FSpatialCamera;
        /**
         * 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음
         */
        viewportHeight: number;
        /**
         * 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null
         */
        viewBoundsXY: [number, number, number, number] | null;
        /**
         * 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키
         */
        contentKey: string;
    };

/**
     * UA3FSpatialViewVo 생성자 옵션입니다.
     */
    type UA3FSpatialViewVoCO = UA3FSpatialViewVoCO_Content;

export type { UA3FSpatialViewVo, UA3FSpatialViewVoCO, UA3FSpatialViewVoCO_Content };
