// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometry, U3dGeometryCO, U3dGeometryEMI, U3dGeometryStyleParam } from "./U3dGeometry.js";
import type { KeyValue } from "../types/global.js";

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 여러 좌표를 곡선으로 연결한 원형 단면의 관(파이프) 3D 도형입니다. <br>
 * 경로 좌표를 Catmull-Rom 곡선으로 보간한 후 곡선을 따라 튜브 형상을 생성하며, 반지름·곡선 장력·분할 수·닫힘 여부를 지정할 수 있습니다. <br>
 * Catmull-Rom 곡선은 지정한 모든 좌표를 통과하면서 좌표 사이를 부드럽게 연결하는 곡선입니다. <br>
 *
 * 경로 좌표는 2개 이상 필요하며, 그보다 적으면 형상을 만들지 않고 조용히 넘어갑니다. <br>
 * `setVertex`로 월드 좌표(EPSG:3857)를 지정하면 즉시 형상을 생성하고, <br>
 * `setPositions`로 위경도 좌표계(EPSG:4326)를 지정하면 파이프가 속한 레이어가 월드 좌표(EPSG:3857)로 변환해 반영합니다. <br>
 *
 * 반지름·분할 수·장력 같은 형상 필드에 직접 대입한 값은 곧바로 화면에 반영되지 않습니다. <br>
 * 다음 `setParam` 호출이나 좌표 갱신으로 형상을 다시 만들 때 사용되므로, 값을 바꿀 때는 `setParam`을 사용하십시오. <br>
 *
 * @group geometry
 *
 * @extends {U3dGeometry}
 */
declare class U3dPipe extends U3dGeometry {
    /**
     * 파이프 도형을 생성합니다. <br>
     * 생성 옵션 `vertices`에 월드 좌표(EPSG:3857)가 2개 이상 있으면 생성 시 형상을 생성하며, 그렇지 않으면 좌표를 지정할 때 형상을 생성합니다. <br>
     *
     * @param {U3dPipeCO} [opt={}] 색상·투명도, 반지름·분할 수·곡선 장력·닫힘 여부와 좌표를 지정하는 생성 옵션 <br>
     * @param {boolean} [isInit=true] 생성 시 재질과 형상의 즉시 생성 여부. 상속 클래스가 초기화를 직접 수행하는 경우에만 `false` <br>
     */
    constructor(opt?: U3dPipeCO, isInit?: boolean);
    /**
     * 경로 방향 분할 수입니다. <br>
     * 기본값은 64입니다. <br>
     * 경로 곡선을 이 수만큼 분할해 튜브를 생성하므로, 값이 클수록 곡선이 매끄러워지고 정점 수가 증가합니다. <br>
     * 생성 옵션과 `setParam`에서는 `pathsegments` 이름을 사용합니다. <br>
     *
     * @type {number}
     */
    pathSegments: number;
    /**
     * 파이프 반지름입니다. <br>
     * 단위는 미터이며 기본값은 2입니다. <br>
     * 위경도 좌표가 있으면 첫 좌표의 위도에 따라 월드 좌표(EPSG:3857) 길이로 환산해 형상에 적용하며, 월드 좌표(EPSG:3857)만 지정한 경우 환산하지 않습니다. <br>
     * 생성 옵션과 `setParam`에서는 `piperadius` 이름을 사용합니다. <br>
     *
     * @type {number}
     */
    tubeRadius: number;
    /**
     * 단면(원둘레) 분할 수입니다. <br>
     * 기본값은 16입니다. <br>
     * 값이 클수록 단면이 원에 가까워지고 정점 수가 증가합니다. <br>
     * 생성 옵션과 `setParam`에서는 `radiussegments` 또는 `radiusSegments` 이름을 사용하며, 둘 다 지정하면 `radiusSegments`를 사용합니다. <br>
     *
     * @type {number}
     */
    radiusSegments: number;
    /**
     * 경로의 끝점과 시작점을 연결해 고리 형태로 닫을지 여부입니다. <br>
     * 기본값은 `false`입니다. <br>
     *
     * @type {boolean}
     */
    closed: boolean;
    /**
     * 곡선 장력입니다. <br>
     * 기본값은 0.5입니다. <br>
     * 좌표 사이 곡선의 휘어짐 정도를 결정하며, 0이면 좌표 사이를 직선으로 연결하고 값이 클수록 휘어짐이 커집니다. <br>
     * 값의 범위를 검사하지 않고 곡선에 그대로 전달합니다. <br>
     *
     * @type {number}
     */
    tension: number;
    /**
     * 월드 좌표(EPSG:3857) 보정 스케일 (1 / cos(lat)). 반지름을 미터에서 월드 좌표(EPSG:3857) 단위로 환산할 때 사용합니다. <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * 레이어가 도형을 갱신할 때 `setMaterial`을 다시 호출할지 여부 <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    _needMaterial: boolean;
    /**
     * 재질과 초기 형상을 구성하는 초기화 함수 <br>
     *
     * @ignore
     */
    _init(): void;
    /**
     * 재질 초기화 함수 <br>
     *
     * @override
     *
     * @ignore
     */
    override setMaterial(): void;
    /**
     * 라인 너비 조회 함수 <br>
     *
     * @returns {number} 라인 너비 <br>
     *
     * @ignore
     */
    getLineWidth(): number;
    /**
     * 라인 너비 설정 함수 <br>
     *
     * @param {number} size 라인 너비 <br>
     *
     * @ignore
     */
    setLineWidth(size: number): void;
    linewidth: number;
    /**
     * 도형 공통 속성과 파이프 고유 속성을 일괄 변경하고 형상을 다시 생성합니다. <br>
     * 지정하지 않은 항목은 현재 값을 유지합니다. <br>
     * 인자를 생략하고 호출하면 값은 그대로 두고 형상만 다시 만듭니다. <br>
     *
     * @override
     *
     * @param {U3dPipeCO} [param] 변경할 속성. 도형 공통 속성과 `piperadius`·`pathsegments`·`radiussegments`(또는 `radiusSegments`)·`closed`·`tension` <br>
     */
    override setParam(param?: U3dPipeCO): void;
    /**
     * 현재 도형 공통 속성과 파이프 고유 속성을 반환합니다. <br>
     * 반환값을 `setParam`에 전달하면 같은 설정을 적용할 수 있습니다. <br>
     * 다만 경로 좌표는 반환값에 담기지 않으므로, 형상까지 그대로 옮기려면 좌표를 따로 지정하십시오. <br>
     *
     * @override
     *
     * @returns {U3dPipeParam} 현재 속성. 호출할 때마다 새 객체를 반환 <br>
     */
    override getParam(): U3dPipeParam;
}

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPipe` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 파이프 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dPipeCO_Content = {
        /**
         * 파이프 표면 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color` <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 경로 방향 분할 수. 값이 클수록 곡선이 매끄러워지고 정점 수가 증가합니다 <br>
         */
        pathsegments?: number;
        /**
         * 파이프 반지름 (미터). 위경도 좌표가 있으면 첫 좌표의 위도에 따라 월드 좌표(EPSG:3857) 길이로 환산됩니다 <br>
         */
        piperadius?: number;
        /**
         * 단면(원둘레) 분할 수. 값이 클수록 단면이 원에 가까워지고 정점 수가 증가합니다 <br>
         */
        radiussegments?: number;
        /**
         * `radiussegments`의 별칭. 둘 다 지정하면 이 값을 사용합니다 <br>
         */
        radiusSegments?: number;
        /**
         * 경로의 끝점과 시작점을 연결해 고리 형태로 닫을지 여부 <br>
         */
        closed?: boolean;
        /**
         * 곡선 장력. 0이면 좌표 사이를 직선으로 연결하며, 값이 클수록 곡선의 휘어짐이 커집니다 <br>
         */
        tension?: number;
        /**
         * 도형 이름. 레이어에서 도형을 조회할 때 사용합니다 <br>
         */
        name?: string;
        /**
         * 불투명도 (0~1). 1 미만이면 투명 처리가 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 도형 종류 식별자. 파이프의 형상과 재질에는 영향을 주지 않습니다 <br>
         */
        type?: string;
        /**
         * 와이어프레임 표시 여부. 면을 채우지 않고 삼각형 모서리만 표시합니다 <br>
         */
        wireframe?: boolean;
        /**
         * 도형에 연결된 라벨의 표시 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 파이프 경로의 월드 좌표(EPSG:3857). 2개 이상 필요합니다 <br>
         */
        vertices?: Array<three.Vector3>;
        /**
         * 파이프 경로의 위경도 좌표계(EPSG:4326) <br>
         */
        coordinates?: Array<three.Vector3>;
        /**
         * 도형과 함께 보관하는 사용자 정의 속성. 렌더링에는 사용되지 않습니다 <br>
         */
        properties?: KeyValue;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPipe` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 파이프 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dPipeCO = Omit<Omit<U3dGeometryCO, never> & U3dPipeCO_Content, never>;

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPipe.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 파이프 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPipeParam_Content = {
        /**
         * 파이프 반지름 (미터, 위도 환산 전 값) <br>
         */
        piperadius: number;
        /**
         * 경로 방향 분할 수 <br>
         */
        pathsegments: number;
        /**
         * 단면(원둘레) 분할 수 <br>
         */
        radiussegments: number;
        /**
         * 경로의 끝점과 시작점 연결 여부 <br>
         */
        closed: boolean;
        /**
         * 곡선 장력 <br>
         */
        tension: number;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPipe.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 파이프 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPipeParam = U3dPipeParam_Content & U3dGeometryStyleParam;

/**
     * ~extends import('@U3dGeometry').U3dGeometryEMI <br>
     *
     * `U3dPipe`의 이벤트 인터페이스입니다. <br>
     * 도형 공통 이벤트(`U3dGeometryEMI`)와 같으며 추가 이벤트는 없습니다. <br>
     */
    type U3dPipeEMI = U3dGeometryEMI;

export type { U3dPipe, U3dPipeCO, U3dPipeCO_Content, U3dPipeEMI, U3dPipeParam, U3dPipeParam_Content };
