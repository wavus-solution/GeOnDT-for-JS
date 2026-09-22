// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { UGPoint } from "../math/UGPoint.js";
import type { UMeasureFeature } from "../ol/UMeasureFeature.js";

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyArea 생성자 옵션
 */
type UAnalyAreaCO_Content = {
    /**
     * 분석 클래스 이름
     */
    name?: string;
};

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyArea 생성자 옵션
 */
type UAnalyAreaCO = Omit<Omit<UAnalyCO, never> & UAnalyAreaCO_Content, never>;

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyArea 생성자 옵션
 * @memberof UAnalyArea
 * @inner
 *
 * @typedef {object} UAnalyAreaCO_Content
 * @property {string} [name='Area'] 분석 클래스 이름
 *
 * @typedef {Omit<UAnalyCO, never> & UAnalyAreaCO_Content} UAnalyAreaCO
 */
/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `면적`(Area)를 측정하는 클래스
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('Area');
 * analy.active();
 * @see https://3d.geon.kr/doc/tutorial-official/measure.html
 */
declare class UAnalyArea extends UAnaly {
    /** @param {UAnalyAreaCO} [opt={}] */
    constructor(opt?: UAnalyAreaCO);
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
     * @type {Array<import('@UMeasureFeature').UMeasureFeature>}
     *
     * @ignore
     */ _features: Array<UMeasureFeature>;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _setMouseMove: boolean;
    /**
     * @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined}
     *
     * @ignore
     */ _poi: UCssBilboard | undefined;
    /**
     * @type {(e: MouseEvent) => void}
     *
     * @ignore
     */ _boundMouseMove: (e: MouseEvent) => void;
    name: any;
    /**
     * 좌표 면적을 그리고 해당 면적(m²)을 측정하는 함수
     * @param {Array<import('@UGPoint').UGPoint>} coordList 좌표 리스트
     */
    drawArea(coordList: Array<UGPoint>): void;
    /**
     * 클릭 이벤트 핸들러
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 사용자 클릭 이벤트
     *
     * @ignore
     */
    onClick(e: U3dMouseEvent): void;
    /**
     * 마우스 이동 이벤트 핸들러
     * @param {MouseEvent} e 마우스 이벤트
     *
     * @ignore
     */
    _onMouseMove(e: MouseEvent): void;
    /**
     * 더블클릭 이벤트 핸들러
     *
     * @ignore
     */
    onDblClick(): void;
    /**
     * 면적 측정 결과 텍스트 라벨을 그리는 함수
     *
     * @ignore
     */
    drawTextLabel(): void;
    /**
     * 측정 피처를 모두 제거하는 함수
     *
     * @ignore
     */
    _clearMeasureFeature(): void;
    /**
     * 현재 측정 포인트를 피처로 확정하는 함수
     *
     * @ignore
     */
    _commitFeature(): void;
}

export type { UAnalyArea, UAnalyAreaCO, UAnalyAreaCO_Content };
