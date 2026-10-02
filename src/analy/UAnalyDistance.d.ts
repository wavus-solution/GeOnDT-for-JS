// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { UGPoint } from "../math/UGPoint.js";

/**
 * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
 * UAnalyDistance 생성자 옵션
 */
type UAnalyDistanceCO_Content = {
    /**
     * 분석 클래스 이름
     */
    name?: string;
};

/**
 * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
 * UAnalyDistance 생성자 옵션
 */
type UAnalyDistanceCO = Omit<Omit<UAnalyCO, never> & UAnalyDistanceCO_Content, never>;

/**
 * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
 * UAnalyDistance 생성자 옵션
 * @memberof UAnalyDistance
 * @inner
 *
 * @typedef {object} UAnalyDistanceCO_Content
 * @property {string} [name='Distance'] 분석 클래스 이름
 *
 * @typedef {Omit<UAnalyCO, never> & UAnalyDistanceCO_Content} UAnalyDistanceCO
 */
/**
 * ~extends import('@UAnaly') <br>
 * `좌표 거리`를 측정하는 분석 클래스 <br>
 * 사용자가 생성한 좌표 사이의 거리를 측정하고 화면에 나타내는 기능을 제공합니다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('Distance');
 * analy.active();
 * @see https://3d.geon.kr/doc/tutorial-official/measure.html
 */
declare class UAnalyDistance extends UAnaly {
    /** @param {UAnalyDistanceCO} [opt={}] */
    constructor(opt?: UAnalyDistanceCO);
    /**
     * @type {string | null | undefined}
     *
     * @ignore
     */ _clickId: string | null | undefined;
    /**
     * @type {string | null | undefined}
     *
     * @ignore
     */ _dblClickId: string | null | undefined;
    /**
     * @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined}
     *
     * @ignore
     */ helperPoi: UCssBilboard | undefined;
    name: any;
    /**
     * 서로 다른 두 좌표를 입력 받아 거리를 반환하는 함수
     * @param {object} point1 위경도 좌표 (경도, 위도, 높이)
     * @param {number} point1.x 경도
     * @param {number} point1.y 위도
     * @param {number} point1.z 높이
     * @param {object} point2 위경도 좌표 (경도, 위도, 높이)
     * @param {number} point2.x 경도
     * @param {number} point2.y 위도
     * @param {number} point2.z 높이
     * @return {number | undefined} 두 점 사이 거리
     */
    getDistanceFromCoordinate(point1: {
        x: number;
        y: number;
        z: number;
    }, point2: {
        x: number;
        y: number;
        z: number;
    }): number | undefined;
    /**
     * 좌표 거리(m)를 측정하고 화면에 나타내는 함수
     * @param {Array<import('@UGPoint').UGPoint>} coordList 좌표 리스트
     */
    drawDistance(coordList: Array<UGPoint>): void;
    /**
     * 클릭 이벤트 핸들러
     * @param {import('@union3d/event/U3dMouseEvent').U3dMouseEvent} e 사용자 클릭 이벤트
     *
     * @ignore
     */
    onClick(e: U3dMouseEvent): void;
    /**
     * 더블클릭 이벤트 핸들러
     *
     * @ignore
     */
    onDblClick(): void;
    /**
     * 거리 측정 결과 텍스트 라벨을 그리는 함수
     * @param {import('three').Vector3} point3d 라벨 표출 위치
     * @param {boolean} [isHelper=false] 헬퍼(가이드) POI 여부
     *
     * @ignore
     */
    drawTextLabel(point3d: three.Vector3, isHelper?: boolean): void;
    #private;
}

export type { UAnalyDistance, UAnalyDistanceCO, UAnalyDistanceCO_Content };
