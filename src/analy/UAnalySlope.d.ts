// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 경사도(Slope) 분석에 필요한 두 지점 사이의 지형 높이 표본을 제공합니다. <br>
 * 측정선을 표시하려면 setStart()와 setEnd()를 사용하고, 좌표만 지정하려면 setPoints()를 사용합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const slope = app.getAnalysis('Slope');
 * slope.setPoints(startVec3, endVec3);
 * const samples = slope.getSlope(60);
 */
declare class UAnalySlope extends UAnaly {
    /**
     * UAnalySlope 클래스 생성자입니다.
     *
     * @param {UAnalySlopeCO} [opt={}] 분석 이름과 기본 표본 분할 수를 지정하는 옵션
     */
    constructor(opt?: UAnalySlopeCO);
    /** @type {number} */ _divide: number;
    /** @type {number} */ _measureLength: number;
    /** @type {string | number | undefined} */ _clickId: string | number | undefined;
    /** @type {import('three').Vector3 | undefined} */ _start: three.Vector3 | undefined;
    /** @type {import('three').Vector3 | undefined} */ _end: three.Vector3 | undefined;
    /** @type {any} */ _lineFeature: any;
    /** @type {import('@union3d/geometry/U3dPOI').U3dPOI} */ _indicator: U3dPOI;
    name: any;
    /**
     * 연결한 앱에서 선 측정 모드를 시작하고 저장한 측정 길이를 0으로 초기화합니다. <br>
     * 클릭 등록 ID가 있으면 분석 객체에 등록한 이벤트를 모두 해제합니다.
     *
     * @override
     *
     * @returns {this} 활성화한 분석 객체
     */
    override active(): this;
    /**
     * 분석을 비활성화하고 분석 객체에 등록한 이벤트를 해제합니다. <br>
     * 활성 상태에서 종료할 때 저장한 측정 길이가 0이면 측정 표시와 좌표도 정리합니다.
     *
     * @override
     *
     * @returns {this} 분석 객체
     */
    override deactive(): this;
    /**
     * 연결한 앱에서 분석 좌표, 끝점 표식과 측정 도형을 정리합니다. <br>
     * 앱의 측정 레이어에서 그리는 중인 도형도 지우고 화면 갱신을 요청합니다.
     *
     * @override
     *
     * @returns {this} 정리한 분석 객체
     */
    override clear(): this;
    /**
     * 지형 높이 표본 조회에 사용할 시작점을 반환합니다.
     *
     * @returns {import('three').Vector3 | undefined} 저장한 시작점 참조이며, 설정 전에는 undefined
     */
    getStart(): three.Vector3 | undefined;
    /**
     * 연결한 앱의 이전 측정을 지우고 새 시작점을 등록합니다. <br>
     * 입력 좌표의 참조를 저장하고 화면에 시작 표식을 추가합니다.
     *
     * @param {WorldPositionVector3} point 새 측정의 시작점인 월드 좌표(EPSG:3857)
     * @returns {this} 시작점을 등록한 분석 객체
     */
    setStart(point: WorldPositionVector3): this;
    /**
     * 지형 높이 표본 조회에 사용할 끝점을 반환합니다.
     *
     * @returns {import('three').Vector3 | undefined} 저장한 끝점 참조이며, 설정 전에는 undefined
     */
    getEnd(): three.Vector3 | undefined;
    /**
     * 연결한 앱에 끝점 표식을 추가하고 진행 중인 측정을 확정합니다. <br>
     * 입력 좌표의 참조와 확정 직전에 조회한 측정 길이를 보관합니다.
     *
     * @param {WorldPositionVector3} point 측정을 끝낼 위치의 월드 좌표(EPSG:3857)
     * @returns {this} 끝점을 등록한 분석 객체
     */
    setEnd(point: WorldPositionVector3): this;
    /**
     * 끝점을 등록할 때 앱에서 읽은 지표 거리 기준 측정 길이를 반환합니다.
     *
     * @returns {number} 미터 단위 측정 길이이며, 초기화 직후에는 0
     */
    getMeasureLength(): number;
    /**
     * 측정 표시나 측정 길이를 갱신하지 않고 높이 표본 조회에 사용할 두 좌표 참조를 저장합니다.
     *
     * @param {WorldPositionVector3} start 표본을 배치하기 시작할 월드 좌표(EPSG:3857)
     * @param {WorldPositionVector3} end 표본을 배치할 방향과 범위를 정하는 월드 좌표(EPSG:3857)
     * @returns {this | undefined} 좌표를 저장한 분석 객체이며, 어느 한 좌표가 null 또는 undefined이면 undefined
     */
    setPoints(start: WorldPositionVector3, end: WorldPositionVector3): this | undefined;
    /**
     * 연결한 앱의 렌더 지형에서 시작점부터 끝점 방향으로 높이 표본을 조회합니다. <br>
     * 조회 중 분할 수가 바뀌지 않으면, 양의 정수 분할에서 시작점이 포함되고 끝점은 제외됩니다. <br>
     * 지형을 찾지 못하면 표본 위치의 z에 앱의 지형 없음 값을 넣고, 그 값을 환산한 값을 높이로 반환합니다.
     *
     * @param {number} [divide] 표본 분할 수이며, 지정하면 좌표 검사 전에 이후 조회의 분할 수도 갱신
     * @returns {Array<{position: import('three').Vector3, height: number}> | undefined} 월드 좌표(EPSG:3857)의 표본 위치와 미터 단위 높이 배열이며, 좌표가 없으면 undefined
     */
    getSlope(divide?: number): Array<{
        position: three.Vector3;
        height: number;
    }> | undefined;
    /**
     * 분석 상태를 변경하지 않고 현재 분석 객체를 반환합니다.
     *
     * @override
     *
     * @param {import('@union3d/core/UDrawArg').UDrawArg} [drawArg] 공통 분석 호출에서 전달하는 그리기 도구이며 이 분석에서는 사용하지 않습니다.
     * @returns {this} 분석 객체
     */
    override update(drawArg?: UDrawArg): this;
    /**
     * 측정점이나 분석 상태를 갱신하지 않고 현재 분석 객체를 반환합니다.
     *
     * @param {number} geox 측정점 추가 호출에서 전달하는 첫 좌표 성분이며 이 분석에서는 사용하지 않습니다.
     * @param {number} geoy 측정점 추가 호출에서 전달하는 두 번째 좌표 성분이며 이 분석에서는 사용하지 않습니다.
     * @returns {this} 분석 객체
     */
    addVertex(geox: number, geoy: number): this;
    /**
     * 다음 지형 높이 조회에 사용할 분할 수를 반환합니다.
     *
     * @returns {number} 저장한 표본 분할 수
     */
    getDivide(): number;
    /**
     * 다음 지형 높이 조회에서 사용할 분할 수를 저장합니다.
     *
     * @param {number} divide 구간을 나눌 수이며, 일반적인 조회에는 양의 정수를 지정합니다.
     * @returns {this} 분할 수를 저장한 분석 객체
     */
    setDivide(divide: number): this;
    /**
     * 관심 지점(POI)을 연결한 앱에 추가하고 제거 요청에 사용할 참조로 저장합니다. <br>
     * 앱을 연결하기 전에는 등록과 참조 저장을 수행하지 않습니다.
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi 앱에 표시할 관심 지점
     * @returns {this} 분석 객체
     */
    addIndicator(poi: U3dPOI): this;
    /**
     * 저장한 관심 지점(POI)을 앱에서 제거하도록 요청합니다. <br>
     * 제거를 요청한 뒤에도 분석 객체에는 그 관심 지점의 참조가 남습니다.
     *
     * @returns {this} 분석 객체
     */
    removeIndicator(): this;
    /**
     * 마지막으로 저장한 관심 지점(POI) 참조를 조회합니다.
     *
     * @returns {import('@union3d/geometry/U3dPOI').U3dPOI} 저장한 관심 지점 참조이며, 첫 등록 전 실제 반환값은 undefined
     */
    getIndicator(): U3dPOI;
    #private;
}

/**
     * ~extends UAnalyCO <br>
     *
     * 경사도(Slope) 분석의 이름과 기본 표본 분할 수를 지정하는 옵션입니다. <br>
     * 상속한 옵션은 타입에 포함되지만 이 생성자에서 적용하지 않습니다.
     */
    type UAnalySlopeCO_Content = {
        /**
         * 앱에서 분석을 구분할 이름
         */
        name?: string;
        /**
         * 지형 높이 표본을 조회할 때 사용할 분할 수
         */
        divide?: number;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 경사도(Slope) 분석의 이름과 기본 표본 분할 수를 지정하는 옵션입니다. <br>
     * 상속한 옵션은 타입에 포함되지만 이 생성자에서 적용하지 않습니다.
     */
    type UAnalySlopeCO = Omit<Omit<UAnalyCO, never> & UAnalySlopeCO_Content, never>;

export type { UAnalySlope, UAnalySlopeCO, UAnalySlopeCO_Content };
