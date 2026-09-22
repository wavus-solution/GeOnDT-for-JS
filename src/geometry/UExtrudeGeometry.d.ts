// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UExtrudeBufferGeometry } from "./UExtrudeBufferGeometry.js";
import type { UVGeneratorType } from "./UExtrudeBufferGeometry.types.js";

/**
 * UExtrudeGeometry 생성 옵션 <br>
 */
type UExtrudeGeometryOptions = {
    /**
     * 커브 세그먼트 수 <br>
     */
    curveSegments?: number;
    /**
     * 압출 방향 세그먼트 수 <br>
     */
    steps?: number;
    /**
     * 압출 깊이 <br>
     */
    depth?: number;
    /**
     * 베벨 활성화 여부 <br>
     */
    bevelEnabled?: boolean;
    /**
     * 베벨 두께 <br>
     */
    bevelThickness?: number;
    /**
     * 베벨 크기 <br>
     */
    bevelSize?: number;
    /**
     * 베벨 세그먼트 수 <br>
     */
    bevelSegments?: number;
    /**
     * 압출 경로 커브 <br>
     */
    extrudePath?: three.Curve<three.Vector3>;
    /**
     * UV 생성기 <br>
     */
    UVGenerator?: UVGeneratorType;
};

/**
 * UExtrudeGeometry 생성 옵션 <br>
 *
 * @memberof UExtrudeGeometry
 * @inner
 *
 * @typedef {object} UExtrudeGeometryOptions
 * @property {number} [curveSegments=12] 커브 세그먼트 수 <br>
 * @property {number} [steps=1] 압출 방향 세그먼트 수 <br>
 * @property {number} [depth=100] 압출 깊이 <br>
 * @property {boolean} [bevelEnabled=true] 베벨 활성화 여부 <br>
 * @property {number} [bevelThickness=6] 베벨 두께 <br>
 * @property {number} [bevelSize] 베벨 크기 <br>
 * @property {number} [bevelSegments=3] 베벨 세그먼트 수 <br>
 * @property {import('three').Curve<import('three').Vector3>} [extrudePath] 압출 경로 커브 <br>
 * @property {UVGeneratorType} [UVGenerator] UV 생성기 <br>
 */
/**
 * ~extends import('@UExtrudeBufferGeometry') <br>
 *
 * 2D 형상(Shape)을 지정한 깊이만큼 밀어 올려 입체로 만드는 `압출(Extrude) 지오메트리` 클래스입니다. <br>
 * three.js의 `ExtrudeGeometry`와 유사하게, 형상과 압출 옵션(깊이·베벨·경로 등)을 받아 3D 지오메트리를 생성합니다. <br>
 *
 * @extends {UExtrudeBufferGeometry}
 */
declare class UExtrudeGeometry extends UExtrudeBufferGeometry {
    /**
     * 형상(Shape)을 압출해 3D 지오메트리를 생성합니다. <br>
     * 단일 형상 또는 형상 배열을 받으며, `options.depth`만큼 밀어 올려 입체를 만듭니다. <br>
     *
     * @param {import('three').Shape | Array<import('three').Shape>} shapes 압출할 2D 형상 (또는 형상 배열) <br>
     * @param {UExtrudeGeometryOptions} options 압출 옵션 (깊이·베벨·세그먼트·경로 등) <br>
     */
    constructor(shapes: three.Shape | Array<three.Shape>, options: UExtrudeGeometryOptions);
}

export type { UExtrudeGeometry, UExtrudeGeometryOptions };
