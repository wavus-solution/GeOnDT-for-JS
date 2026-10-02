// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UInfoBasicModel } from "../info/UInfoBasicModel.js";
import type { UInfoWFSModel } from "../info/UInfoWFSModel.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * Object `정보를 출력`하는 분석 클래스<br>
 * 사용자가 선택한 Object의 정보를 화면에 오버레이 형태로 출력하는 기능을 제공합니다.
 * @group analysis
 * @extends {UAnaly}
 *
 * @property {Array<import('@UInfoBasicModel').UInfoBasicModel | import('@UInfoWFSModel').UInfoWFSModel> | undefined} _infoList Object 정보를 담은 목록
 * @property {string | undefined} _clickId 클릭 이벤트 리스너 ID
 * @property {number | undefined} _clientX 클릭한 화면 X좌표
 * @property {number | undefined} _clientY 클릭한 화면 Y좌표
 * @property {import('three').Vector3 | undefined} _interPos 클릭 지점과 모델의 교차점(Intersect)
 *
 * @example
 * let analy = app.activeAnalysis('ObjectInfo');
 * @tutorial {@link http://geon.kr:14144/doc/tutorial-official/selectModel.html}
 */
declare class UAnalyObjectInfo extends UAnaly {
    /**
     * @param {UAnalyObjectInfoCO} [opt]
     */
    constructor(opt?: UAnalyObjectInfoCO);
    name: string;
    /** @type {import('three').ColorRepresentation} */
    _highligthColor: three.ColorRepresentation;
    /** @type {Array<import('@union3d/info/UInfoBasicModel').UInfoBasicModel | import('@union3d/info/UInfoWFSModel').UInfoWFSModel> | undefined} */
    _infoList: Array<UInfoBasicModel | UInfoWFSModel> | undefined;
    /** @type {string | undefined} */
    _clickId: string | undefined;
    /** @type {string | undefined} */
    _dblClickId: string | undefined;
    /** @type {import('three').Vector3 | undefined} */
    _interPos: three.Vector3 | undefined;
    /** @type {DOMRect | undefined} */
    _rect: DOMRect | undefined;
    /** @type {number | undefined} */
    _clientX: number | undefined;
    /** @type {number | undefined} */
    _clientY: number | undefined;
    /** @type {number | undefined} */
    _x: number | undefined;
    /** @type {number | undefined} */
    _y: number | undefined;
    /**
     * 컨테이너를 숨기는 함수
     *
     * @ignore
     */
    hide(): void;
    /**
     * 컨테이너를 표시하는 함수
     *
     * @ignore
     */
    show(): void;
    /**
     * 선택 상태를 제거하는 함수
     */
    removeSelect(): any;
    /**
     * 선택한 모델 정보를 반환하는 함수
     * @return {Array<object>} 선택한 모델 정보
     */
    getSelectedObject(): Array<object>;
    #private;
}

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyObjectInfoCO_Content = {
        /**
         * 모드 이름
         */
        name?: string;
        /**
         * Object 정보를 출력할 Html element
         */
        container?: HTMLElement;
        /**
         * 하이라이트 색상
         */
        _highligthColor?: three.ColorRepresentation;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyObjectInfoCO = Omit<Omit<UAnalyCO, never> & UAnalyObjectInfoCO_Content, never>;

export type { UAnalyObjectInfo, UAnalyObjectInfoCO, UAnalyObjectInfoCO_Content };
