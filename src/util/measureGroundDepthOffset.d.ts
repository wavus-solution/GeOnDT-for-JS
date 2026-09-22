// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

type measureGroundDepthOffsetParam = {
    /**
     * 지형 높이 조회 객체
     */
    drawArg: UDrawArg;
    /**
     * 그려지는 객체
     */
    object: three.Object3D;
    /**
     * 카메라 월드 좌표
     */
    camPos: WorldPositionVector3;
    /**
     * 도형 크기 (경계 상자 최장변의 절반, 월드 단위)
     */
    size: number;
    /**
     * 카메라에서 도형 중심까지의 거리 (월드 단위)
     */
    cameraDistance: number;
};

/**
 * 도형별 실측 상태입니다. 도형이 사라지면 함께 정리되도록 WeakMap에 담습니다.
 *
 * @typedef {object} GroundProbeState
 * @property {Array<{x: number, y: number}>} points 표본 좌표 버퍼 (재사용)
 * @property {import('three').Vector3} lastPos 마지막으로 잰 시점의 도형 월드 좌표
 * @property {import('three').Vector3} lastCamPos 마지막으로 잰 시점의 카메라 월드 좌표
 * @property {boolean} done 한 번이라도 재는 데 성공했는지
 * @property {number} offset 마지막으로 구한 당길 거리 (월드 단위)
 *
 * @ignore
 */
/**
 * @typedef measureGroundDepthOffsetParam
 * @property {import('@UDrawArg').UDrawArg} drawArg 지형 높이 조회 객체
 * @property {import('three').Object3D} object 그려지는 객체
 * @property {WorldPositionVector3} camPos 카메라 월드 좌표
 * @property {number} size 도형 크기 (경계 상자 최장변의 절반, 월드 단위)
 * @property {number} cameraDistance 카메라에서 도형 중심까지의 거리 (월드 단위)
 */
/**
 * 도형이 지형에 얼마나 가려지는지 재서, 넘겨야 할 당길 거리를 돌려줍니다. <br>
 * 표본은 두 갈래입니다. 도형 발밑 격자만 재면 비스듬히 볼 때 카메라와 도형 사이를 막는 능선을 놓치고,
 * 시선 선분만 재면 수직으로 내려다볼 때 표본이 한 점으로 축퇴합니다. 그래서 둘을 함께 씁니다.
 *
 * @param {measureGroundDepthOffsetParam} offsetParam 지형 높이 조회 객체
 * @return {number | undefined} depthOffset
 */
declare function measureGroundDepthOffset(offsetParam: measureGroundDepthOffsetParam): number | undefined;

export type { measureGroundDepthOffset, measureGroundDepthOffsetParam };
