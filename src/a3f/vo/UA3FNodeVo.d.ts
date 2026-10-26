// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 공간 노드의 식별·계층·경계와 상세화 정의를 보관합니다.<br>
 * 공간 탐색기가 전달한 정의를 레이어의 노드 등록과 조회에 사용합니다.<br>
 * 필수 옵션 키를 확인한 뒤 값을 보관하며 값의 타입·범위와 필드 간 일관성은 사용하는 모듈이 검증합니다.<br>
 * 객체와 배열은 복사하지 않고 참조로 보관합니다.<br>
 * 부모 식별자는 공간 관계를 나타내며 레이어는 등록 시 정의 사본을 생성합니다.
 *
 * @group A3F
 * @summary A3F 공간 노드 정의
 */
declare class UA3FNodeVo {
    /**
     * 필수 생성 옵션의 정본 키입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FNodeVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.<br>
     * 옵션이 객체가 아니거나 필수 키가 없으면 TypeError를 발생시키며 값 검증은 수행하지 않습니다.
     *
     * @param {UA3FNodeVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FNodeVoCO);
    /** @type {string} */
    _nodeId: string;
    /** @type {string | null} */
    _parentNodeId: string | null;
    /** @type {string | null} */
    _geometryId: string | null;
    /** @type {UA3FNodeBoundingBoxData} */
    _boundingBox: UA3FNodeBoundingBoxData;
    /** @type {number} */
    _geometricError: number;
    /** @type {'ADD' | 'REPLACE'} */
    _refine: "ADD" | "REPLACE";
    /**
     * 노드 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 레이어 안에서 유일한 노드 식별자이며 호출자가 검증한 값
     */
    set nodeId(value: string);
    /**
     * 노드 식별자를 반환합니다.
     *
     * @returns {string} 레이어 안에서 유일한 노드 식별자
     */
    get nodeId(): string;
    /**
     * 부모 노드 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string | null} value 부모 노드 식별자이며 루트 노드는 null, 호출자가 검증한 값
     */
    set parentNodeId(value: string | null);
    /**
     * 부모 노드 식별자를 반환합니다.
     *
     * @returns {string | null} 부모 노드 식별자이며 루트 노드는 null
     */
    get parentNodeId(): string | null;
    /**
     * 공용 형상 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string | null} value 공용 형상 식별자이며 공간 컨테이너는 null, 호출자가 검증한 값
     */
    set geometryId(value: string | null);
    /**
     * 공용 형상 식별자를 반환합니다.
     *
     * @returns {string | null} 공용 형상 식별자이며 공간 컨테이너는 null
     */
    get geometryId(): string | null;
    /**
     * 공간 경계를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {UA3FNodeBoundingBoxData} value 월드 좌표(EPSG:3857)의 XY 경계와 원본 미터 높이 범위이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set boundingBox(value: UA3FNodeBoundingBoxData);
    /**
     * 공간 경계를 반환합니다.
     *
     * @returns {UA3FNodeBoundingBoxData} 월드 좌표(EPSG:3857)의 XY 경계와 원본 미터 높이 범위, 복사하지 않은 참조
     */
    get boundingBox(): UA3FNodeBoundingBoxData;
    /**
     * 공간 오차를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 유한한 0 이상의 공간 상세화 오차이며 호출자가 검증한 값
     */
    set geometricError(value: number);
    /**
     * 공간 오차를 반환합니다.
     *
     * @returns {number} 유한한 0 이상의 공간 상세화 오차
     */
    get geometricError(): number;
    /**
     * 공간 상세화 방식을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {'ADD' | 'REPLACE'} value ADD는 부모와 자식의 병합, REPLACE는 자식으로 교체하는 방식이며 호출자가 검증한 값
     */
    set refine(value: "ADD" | "REPLACE");
    /**
     * 공간 상세화 방식을 반환합니다.
     *
     * @returns {'ADD' | 'REPLACE'} ADD는 부모와 자식의 병합, REPLACE는 자식으로 교체하는 방식
     */
    get refine(): "ADD" | "REPLACE";
}

/**
     * metadata 2.0의 공간 경계입니다.<br>
     * 수평 경계는 월드 좌표(EPSG:3857)이며 zRange는 월드 Z로 환산하지 않은 원본 미터 높이 범위입니다.
     */
    type UA3FNodeBoundingBoxData = {
        /**
         * 수평 경계의 월드 좌표(EPSG:3857)
         */
        crs: "EPSG:3857";
        /**
         * 유한한 minX·minY·maxX·maxY이며 각 min은 max 이하
         */
        xy: [number, number, number, number];
        /**
         * 유한한 미터 높이 min·max 또는 높이 범위 없음
         */
        zRange: [number, number] | null;
        /**
         * zRange가 있으면 m, 없으면 null
         */
        zUnit: "m" | null;
        /**
         * zRange가 있으면 비어 있지 않은 기준 이름, 없으면 null이며 unknown을 보존
         */
        verticalReference: string | null;
    };

/**
     * 공간 노드를 보관하는 UA3FNodeVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 공간 경계는 참조로 보관합니다.<br>
     * 노드 연결과 경계 검증 및 등록 시 사본 생성은 U3dModelA3FLayer가 담당합니다.
     */
    type UA3FNodeVoCO_Content = {
        /**
         * 레이어 안에서 유일한 노드 키
         */
        nodeId: string;
        /**
         * 부모 노드 키이며 루트는 null
         */
        parentNodeId: string | null;
        /**
         * 공용 형상 식별자이며 공간 컨테이너는 null
         */
        geometryId: string | null;
        /**
         * 월드 좌표(EPSG:3857)의 XY와 원본 높이 범위
         */
        boundingBox: UA3FNodeBoundingBoxData;
        /**
         * 유한한 0 이상의 공간 오차
         */
        geometricError: number;
        /**
         * 공간 상세화 방식
         */
        refine: "ADD" | "REPLACE";
    };

/**
     * 공간 노드를 보관하는 UA3FNodeVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 공간 경계는 참조로 보관합니다.<br>
     * 노드 연결과 경계 검증 및 등록 시 사본 생성은 U3dModelA3FLayer가 담당합니다.
     */
    type UA3FNodeVoCO = UA3FNodeVoCO_Content;

export type { UA3FNodeBoundingBoxData, UA3FNodeVo, UA3FNodeVoCO, UA3FNodeVoCO_Content };
