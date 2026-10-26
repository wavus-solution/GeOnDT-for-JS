// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * @ignore
 * @classdesc
 * (시간, 값)의 매핑 형태 객체
 * @summary `(시간, 값)`의 매핑 형태 객체, 배열의 순서대로 다음 시간의 값까지의 수치를 등비로 계산하여 결과를 반환
 * @memberOf Object
 * @param {number[]} timeArray 시간값의 배열
 * @param {number[]} valueArray 수치값의 배열
 * @see GeOnDT.effect.UParticleEngine
 * @see GeOnDT.effect.UParticle
 * @see GeOnDT.analysis.UAnalyParticle
 */
declare class XTween {
    constructor(timeArray: any, valueArray: any);
    times: any;
    values: any;
    add(time: any, value: any): void;
    lerp(t: any): any;
}

export type { XTween };
