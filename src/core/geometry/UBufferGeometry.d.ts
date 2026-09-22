// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * ~extends import('three').BufferGeometry <br>
 * Union3D 내부에서 사용하는 BufferGeometry 래퍼 클래스 <br>
 * name 설정, dispose 플래그 관리 등 유틸 기능을 추가
 *
 * @summary BufferGeometry 래퍼 클래스
 * @extends BufferGeometry
 */
declare class UBufferGeometry extends BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap> {
    constructor();
    /**
     * dispose 여부 플래그
     * @type {boolean}
     *
     * @ignore
     */
    _disposed: boolean;
    /**
     * 클래스 타입 식별자
     * @type {string}
     *
     * @ignore
     */
    _classtype: string;
    /**
     * geometry 이름을 설정
     * @param {string} name 설정할 이름
     * @return {this}
     */
    setName(name: string): this;
    /**
     * geometry를 복제
     * @override
     */
    override clone(): this;
}

export type { UBufferGeometry };
