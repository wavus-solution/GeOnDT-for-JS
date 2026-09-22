// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyGizmoModel } from "./UAnalyGizmoModel.js";

/**
 * ~extends import('@union3d/analy/UAnalyGizmoModel').UAnalyGizmoModel <br>
 * `정렬(Align)` 편집 분석 클래스 <br/>
 * 정렬(Align) 기능을 이용한 3d 모델 왼쪽, 오른쪽, 가운데 정렬 및 기준 정렬 편집기능을 제공한다.
 * @group analysis
 * @extends {UAnalyGizmoModel}
 *
 * @example
 * let analy = app.activeAnalysis('GizmoModel');
 * @tutorial {@link http://geon.kr:14144/doc/tutorial-official/componentControlAtIndoor.html}
 */
declare class UAnalyAlignModel extends UAnalyGizmoModel {
    /** @type {Array<import('three').Object3D>} */
    _targetList: Array<three.Object3D>;
    /** @type {import('three').Object3D | undefined} */
    _reference: three.Object3D | undefined;
    /**
     * 기준 대상과 정렬 대상 목록들을 지정하는 함수
     *
     * @param {import('three').Object3D} reference 기준 대상
     * @param {Array<import('three').Object3D>} targets 정렬 대상 목록
     */
    setObjects(reference: three.Object3D, targets: Array<three.Object3D>): void;
    /**
     * 정렬 간격을 설정하는 함수
     *
     * @param {number} spacing 정렬 간격
     */
    setSpacing(spacing: number): void;
    /**
     * 현재의 정렬 간격을 반환하는 함수
     *
     * @return {number | undefined} 정렬 간격
     */
    getSpacing(): number | undefined;
}

export type { UAnalyAlignModel };
