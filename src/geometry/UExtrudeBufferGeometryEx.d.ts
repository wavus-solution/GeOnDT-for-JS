// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UExtrudeBufferGeometryExCO } from "./UExtrudeBufferGeometryEx.types.js";

/**
 * ~extends import('three').extrudeGeometry <br>
 *
 * Shape(2D 외곽선)를 압출(extrude)해 3D 입체 지오메트리를 만드는 확장 Buffer Geometry 클래스입니다(poly2tri / earcut / delaunay 삼각분할 지원). <br>
 *
 * @extends {THREE.ExtrudeGeometry}
 */
declare class UExtrudeBufferGeometryEx extends three.ExtrudeGeometry {
    /**
     * Shape를 압출(extrude)해 3D 지오메트리를 생성합니다. <br>
     *
     * @param {import("three").Shape | Array<import("three").Shape>} shapes 압출할 Shape 또는 Shape 배열 <br>
     * @param {UExtrudeBufferGeometryExCO} options 압출 옵션 <br>
     */
    constructor(shapes: three.Shape | Array<three.Shape>, options: UExtrudeBufferGeometryExCO);
    type: string;
    /**
     * 저장된 shapes·options로 동일한 지오메트리를 새로 만들어 반환합니다. <br>
     *
     * @override
     *
     * @returns {this} 복제된 지오메트리 <br>
     */
    override clone(): this;
}

export type { UExtrudeBufferGeometryEx };
