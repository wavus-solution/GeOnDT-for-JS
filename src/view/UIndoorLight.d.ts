// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { WorldPosition } from "../types/global.js";

/**
 * @summary `실내 조명` 클래스. 광원(DirectionLight)를 생성
 * @classdesc
 * `실내 조명` 클래스. 광원(SpotLight)를 생성, 삭제하고 편집하는 기능을 제공합니다.
 * @memberOf GeOnDT.view
 * @constructor
 * @param opt
 * @param {number} [opt.intensity=5] 광원 강도
 * @param {Color} [opt.color=0xffffff] 광원 색상
 * @param {number} [opt.shadowSize = 256] 광원 크기
 * @param {number} [opt.shadownear = 0.5] 광원 근접 카메라 거리
 * @param {number} [opt.shadowfar = 500] 광원 최대 카메라 거리
 * @param {number} [opt.shadowbias = 0.0001] 그림자 기준면 높이 오프셋
 * @param {number} [opt.normalbias = 5] 객체 법선을 따라 얼마나 오프셋되는지 정의
 * @param {number} [opt.shadowRadius = 0.4] 그림자 반경 (클수록 그림자 흐릿해짐)
 * @param {number} [opt.shadowIntensity = 1] 그림자 강도 (클수록 어두운 색상)
 *
 * @param {WorldPosition} [opt.position] 광원 위치
 * @param {WorldPosition} [opt.target] 바라볼 방향 위치
 * @param {boolean} [opt.visibleHelper] 조명 helper 생성 여부
 * @constructor
 * @tutorial {@link http://3d.geon.kr:14144/doc/tutorial-official/indoorExtension.html}
 * @example
 *  const light = new Union3D.view.UIndoorLight({
 *       position : {x : 134.42681455508875, y: 53.93362446805896, z: 25}, // 위치
 *       target : {x : 134.42681455508875, y: 53.93362446805896, z: 0}, // 바라볼 방향 위치
 *       shadowSize : 128, // 크기
 *       shadownear : 0.5, // 조명 근접 거리
 *       shadowfar : 30, // 조명 최대 거리
 *       shadowbias : 0.0001, // 표면 그림자에 정규화된 깊이에서 offset 수치.
 *       normalbias : 1.5, // 객체 법선을 따라 얼마나 오프셋되는지 정의
 *       shadowRadius : 0.8, // 그림자 반경 (클수록 그림자 흐릿해짐)
 *       shadowIntensity : 1 // 그림자 강도 (클수록 어두운 색상)
 *  })
 */
declare class UIndoorLight extends three.DirectionalLight {
    constructor(option: any);
    _camSize: number;
    /**
     * 조명의 위치를 설정하는 함수
     * @param {WorldPosition} position 조명의 위치 값
     */
    setPosition(position: WorldPosition): void;
    /**
     * 조명이 바라볼 위치를 설정하는 함수
     * @param {WorldPosition} position 조명의 바라볼 위치 값
     */
    setTargetPosition(position: WorldPosition): void;
}

export type { UIndoorLight };
