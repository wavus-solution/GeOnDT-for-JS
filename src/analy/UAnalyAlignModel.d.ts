// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyGizmoModel, UAnalyGizmoModelCO } from "./UAnalyGizmoModel.js";
import type { UAlignControls } from "../mode/UAlignControls.js";

/**
 * ~extends import('@union3d/analy/UAnalyGizmoModel').UAnalyGizmoModel <br>
 *
 * 정렬(Align) 컨트롤을 분석 API에 연결하는 모델 편집 클래스입니다. <br>
 * 앱을 연결하고 분석을 활성화한 뒤 기준 모델·대상 목록과 정렬 모드·간격을 지정합니다.
 *
 * @group analysis
 * @extends {UAnalyGizmoModel}
 *
 * @example
 * const analy = app.activeAnalysis('AlignModel');
 * @tutorial {@link http://geon.kr:14144/doc/tutorial-official/componentControlAtIndoor.html}
 */
declare class UAnalyAlignModel extends UAnalyGizmoModel {
    /**
     * 컨트롤에서 조회한 정렬 대상 목록의 원본 참조입니다.
     *
     * @type {Array<import('three').Object3D>}
     */
    _targetList: Array<three.Object3D>;
    /**
     * 컨트롤에서 조회한 정렬 기준 대상의 원본 참조입니다.
     *
     * @type {import('three').Object3D | undefined}
     */
    _reference: three.Object3D | undefined;
    /**
     * 활성 분석의 정렬 기준 모델과 대상 목록을 컨트롤에 등록합니다. <br>
     * 비활성 상태 또는 컨트롤 미연결 상태이면 등록하지 않습니다.
     * 등록 후에는 입력 대신 컨트롤이 보고하는 기준·목록 참조를 저장합니다.
     *
     * @param {import('three').Object3D} reference 기준 대상
     * @param {Array<import('three').Object3D>} targets 정렬 대상 목록
     */
    setObjects(reference: three.Object3D, targets: Array<three.Object3D>): void;
    /**
     * 연결된 컨트롤에 정렬 간격을 전달하고 분석 화면·핸들을 갱신합니다. <br>
     * 컨트롤이 없으면 생성하지 않고 종료하며 활성 여부나 간격 범위를 별도로 검사하지 않습니다.
     *
     * @param {number} spacing 컨트롤에 그대로 전달할 정렬 간격
     */
    setSpacing(spacing: number): void;
    /**
     * 컨트롤의 현재 정렬 간격을 반환하며 새 컨트롤을 생성하지 않습니다.
     *
     * @returns {number | undefined} 현재 정렬 간격 또는 컨트롤 미연결 상태의 undefined
     */
    getSpacing(): number | undefined;
}

/**
     * ~extends UAnalyGizmoModelCO <br>
     *
     * 모델 정렬 분석의 생성 옵션입니다. <br>
     * 현재 생성자는 name만 사용하며 상속 옵션 객체를 부모에게 전달하지 않습니다.
     */
    type UAnalyAlignModelCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
    };

/**
     * ~extends UAnalyGizmoModelCO <br>
     *
     * 모델 정렬 분석의 생성 옵션입니다. <br>
     * 현재 생성자는 name만 사용하며 상속 옵션 객체를 부모에게 전달하지 않습니다.
     */
    type UAnalyAlignModelCO = Omit<Omit<UAnalyGizmoModelCO, never> & UAnalyAlignModelCO_Content, never>;

/**
     * ~extends import('@union3d/mode/UAlignControls').UAlignControls <br>
     *
     * 이벤트·모드 연결에 사용하는 컨트롤의 국소 타입 단언입니다. <br>
     * 구현 내 단언용이며 getControl의 공개 반환 타입을 대체하지 않으므로 문서에서는 제외합니다.
     */
    type AlignControlTC_Content = {
        /**
         * 이벤트 이름과 실행 함수를 연결하는 함수
         */
        addEventListener: (arg0: string, arg1: Function) => void;
        /**
         * 컨트롤의 실제 모드 문자열을 반환하는 함수
         */
        getMode: () => string;
    };

/**
     * ~extends import('@union3d/mode/UAlignControls').UAlignControls <br>
     *
     * 이벤트·모드 연결에 사용하는 컨트롤의 국소 타입 단언입니다. <br>
     * 구현 내 단언용이며 getControl의 공개 반환 타입을 대체하지 않으므로 문서에서는 제외합니다.
     */
    type AlignControlTC = UAlignControls & AlignControlTC_Content;

export type { AlignControlTC, AlignControlTC_Content, UAnalyAlignModel, UAnalyAlignModelCO, UAnalyAlignModelCO_Content };
