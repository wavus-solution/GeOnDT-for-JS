// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UBufferGeometry } from "../core/geometry/UBufferGeometry.js";
import type { UExtrudeBufferGeometryCO } from "./UExtrudeBufferGeometry.types.js";

/**
 * ~extends import('@union3d/core/geometry/UBufferGeometry') <br>
 *
 * Shape(2D 외곽선)를 지정한 깊이만큼 압출(extrude)해 3D 입체 지오메트리를 만드는 Buffer Geometry 클래스입니다. <br>
 *
 * @extends {UBufferGeometry}
 */
declare class UExtrudeBufferGeometry extends UBufferGeometry {
    /**
     * Shape를 압출(extrude)해 3D 지오메트리를 생성합니다. <br>
     *
     * @param {import("three").Shape | Array<import("three").Shape>} shapes 압출할 Shape 또는 Shape 배열 <br>
     * @param {UExtrudeBufferGeometryCO} options 압출 옵션 (깊이·베벨·스텝 등) <br>
     */
    constructor(shapes: three.Shape | Array<three.Shape>, options: UExtrudeBufferGeometryCO);
    /**
     * @type {{ shapes: import("three").Shape | Array<import("three").Shape>, options: UExtrudeBufferGeometryCO }}
     *
     * @ignore
     */
    parameters: {
        shapes: three.Shape | Array<three.Shape>;
        options: UExtrudeBufferGeometryCO;
    };
    /**
     * @type {number}
     *
     * @ignore
     */
    _topDrawCount: number;
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

export type { UExtrudeBufferGeometry };
