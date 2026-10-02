// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TempPalette } from "./U3dHeatGeometry.types.js";
import type { U3dSphere } from "./U3dSphere.js";

/**
 * 열원(Heat)의 셰이더·텍스처·색상 팔레트를 관리하는 매니저 클래스입니다. <br>
 * 대상 Object3D별로 열원 데이터를 모아 재질(material)에 열 오버레이 셰이더를 주입합니다. <br>
 * 보통 `U3dHeatGeometry`가 내부적으로 사용합니다. <br>
 */
declare class U3dHeatManager {
    /**
     * 임시 Vector3 (행렬 분해용) <br>
     *
     * @type {THREE.Vector3}
     *
     * @ignore
     */
    static "__#149@#_TMP": three.Vector3;
    /**
     * 임시 Quaternion (행렬 분해용) <br>
     *
     * @type {THREE.Quaternion}
     *
     * @ignore
     */
    static "__#149@#_TMP_Q": three.Quaternion;
    /**
     * 임시 Vector3 (스케일 추출용) <br>
     *
     * @type {THREE.Vector3}
     *
     * @ignore
     */
    static "__#149@#_TMP_S": three.Vector3;
    /**
     * 온도 기반 팔레트를 설정하는 함수 <br>
     *
     * @param {Array<TempPalette>} palette 온도와 온도에 따른 색상을 담은 배열 <br>
     *
     * @ignore
     */
    setHeatPaletteByTemp(palette: Array<TempPalette>): void;
    /**
     * 색상 배열로 열원 색상 팔레트를 균등 간격으로 설정합니다. <br>
     * 배열의 색상들이 낮은 온도부터 높은 온도까지 균등하게 배치되어 보간됩니다. <br>
     * (최소 2개의 색상이 필요합니다.) <br>
     *
     * @param {Array<import('three').ColorRepresentation>} colors 색상 배열 (최소 2개) <br>
     */
    setHeatPalette(colors: Array<three.ColorRepresentation>): void;
    /**
     * 특정 대상(target)에 열원을 등록합니다. <br>
     * 등록된 대상의 재질에 열 오버레이가 반영되어, 열원의 온도·범위 영향을 받게 됩니다. <br>
     *
     * @param {import('@U3dSphere').U3dSphere} heat 열원 객체 <br>
     * @param {import('three').Object3D} target 대상 Object3D <br>
     */
    registerHeat(heat: U3dSphere, target: three.Object3D): void;
    /**
     * 특정 대상(target)에서 열원 등록을 해제합니다. <br>
     * 해당 대상에 남은 열원이 없으면 재질을 원래대로 복원하고, 남아 있으면 텍스처만 다시 구성합니다. <br>
     *
     * @param {import('@U3dSphere').U3dSphere} heat 열원 객체 <br>
     * @param {import('three').Object3D} target 대상 Object3D <br>
     */
    unregisterHeatTarget(heat: U3dSphere, target: three.Object3D): void;
    /**
     * 열원의 변경사항(온도·범위 등)을 그 열원에 등록된 모든 대상에 다시 반영합니다. <br>
     *
     * @param {import('@U3dSphere').U3dSphere} heat 열원 객체 <br>
     */
    update(heat: U3dSphere): void;
    #private;
}

export type { U3dHeatManager };
