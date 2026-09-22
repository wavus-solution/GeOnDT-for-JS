// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UGizmoControls } from "./UGizmoControls.js";

/**
 * @classdesc
 * 여러 객체를 기준 객체에 맞춰 정렬하는 기즈모 컨트롤 클래스
 * @memberOf GeOnDT.mode
 * @summary `정렬` 편집 분석 클래스
 * @extends UGizmoControls
 */
declare class UAlignControls extends UGizmoControls {
    constructor(opt?: {});
    type: string;
    _scene: any;
    _sceneComment: any;
    _onPointerHoverEvent: any;
    _reference: any;
    _targetList: any[];
    /**
     * control의 기준이 되는 원본 객체 반환
     */
    getReference(): any;
    /**
     * control의 기준이 되는 객체 설정
     * @param {Object} reference 기준 대상
     */
    setReference(reference: any): void;
    /**
     * 정렬 대상 원본 목록
     * @return {Object[]}
     */
    getTargetList(): any[];
    /**
     * 정렬 대상 목록 설정 함수
     * @param {Object[]} list 정렬 대상 목록
     */
    setTargetList(list: any[]): void;
    /**
     * 정렬 간격 설정 함수 / 미리보기 객체 생성 및 업데이트 갱신
     * @param {number} value 정렬 간격
     */
    setSpacing(value: number): void;
    /**
     * 정렬 간격 반환 함수
     * @return {number} 정렬 간격
     */
    getSpacing(): number;
    /**
     * 가이드 헬퍼 크기를 카메라의 줌 레벨의 맞춰서 설정하는 함수
     */
    updateHandle(): void;
    /**
     * label 및 scene의 가시화 제어 함수
     * @param val
     */
    setVisible(val: any): void;
    onPointerHover(): void;
    /**
     * 정렬할 객체들을 설정합니다.
     *
     * @param {import('three').Object3D} referenceObject - 정렬의 기준이 될 객체
     * @param {Array<import('three').Object3D>} objectsToAlign - 정렬할 객체의 배열
     */
    setObjects(referenceObject: three.Object3D, objectsToAlign: Array<three.Object3D>): void;
    pointerDown(pointer: any): void;
    _arrowHelper: three.ArrowHelper;
    pointerUp(pointer: any): void;
    setMode(mode: any): void;
    /**
     * 디버깅용 평면 헬퍼를 제거합니다.
     */
    removeArrowHelper(): void;
    #private;
}

export type { UAlignControls };
