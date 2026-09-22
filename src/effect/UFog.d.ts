// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * @ignore
 * @memberOf Object
 * @constructor
 * @classdesc 안개 클래스
 * @summary 안개 클래스
 * @param {Color} color 안개 색상
 * @param {number} [density=0.0000138] 안개 밀도
 * @param {boolean} isDynamic 카메라 고도에 따른 안개 밀도 동적 설정 여부
 */
declare class UFog extends three.FogExp2 {
    constructor(color?: any, density?: any, isDynamic?: boolean);
    _initColor: three.Color;
    _maxDensity: any;
    _isDynamic: boolean;
    _prePositionZ: any;
    _preAltitude: any;
    _densityRatio1: number;
    _densityRatio2: number;
    _colorRatio: number;
    set(color: any, density: any, isDynamic?: boolean): void;
    update(camera: any, sky: any): void;
}

export type { UFog };
