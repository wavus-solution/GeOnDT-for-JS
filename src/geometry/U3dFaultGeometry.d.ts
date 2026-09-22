// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UBufferGeometry } from "../core/geometry/UBufferGeometry.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends UBufferGeometry <br>
 *
 * 단층(Fault) 평면을 만드는 BufferGeometry 클래스입니다. <br>
 * 점 목록과 상·하부 점 개수를 받아 삼각형 메시로 단층면(벽면)을 구성합니다. <br>
 * 보통 `U3dFault`가 내부적으로 사용합니다. <br>
 *
 * @extends {UBufferGeometry}
 */
declare class U3dFaultGeometry extends UBufferGeometry {
    /**
     * 단층면 geometry를 생성합니다. <br>
     * 점 목록을 주면 즉시 단층면을 구성하고, 비워 둔 뒤 나중에 `initialize`로 점을 넣어도 됩니다. <br>
     *
     * @param {Array<WorldPositionVector3>} [points] 단층면을 구성하는 점 목록 (월드 좌표, EPSG:3857) <br>
     * @param {number} [topLength] 상부 점 개수 <br>
     * @param {number} [bottomLength] 하부 점 개수 <br>
     * @param {boolean} [isBasic] 기본(4점) 평면 생성 여부 <br>
     */
    constructor(points?: Array<WorldPositionVector3>, topLength?: number, bottomLength?: number, isBasic?: boolean);
    /**
     * 하부 점 개수 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _bottomLength: number;
    /**
     * 상부 점 개수 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _topLength: number;
    /**
     * 점 목록으로 단층면 geometry를 다시 구성(초기화)합니다. <br>
     * `isBasic=true`면 4개 점으로 단순 평면을, false면 상·하부 점 목록을 이어 벽면 삼각형 메시를 만듭니다. <br>
     *
     * @param {Array<WorldPositionVector3>} points 단층면을 구성하는 점 목록 (월드 좌표, EPSG:3857) <br>
     * @param {boolean} [isBasic] 기본(4점) 평면 생성 여부 <br>
     * @returns {U3dFaultGeometry} 자기 자신 <br>
     */
    initialize(points: Array<WorldPositionVector3>, isBasic?: boolean): U3dFaultGeometry;
    #private;
}

export type { U3dFaultGeometry };
