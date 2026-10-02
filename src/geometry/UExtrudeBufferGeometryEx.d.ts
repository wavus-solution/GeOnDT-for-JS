// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

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

/**
     * UVGeneratorExType UV 생성기 타입 <br>
     */
    type UVGeneratorExType = {
        generateTopUV: (arg0: UExtrudeBufferGeometryEx, arg1: Array<number>, arg2: number, arg3: number, arg4: number) => Array<three.Vector2>;
        generateSideWallUV: (arg0: UExtrudeBufferGeometryEx, arg1: Array<number>, arg2: number, arg3: number, arg4: number, arg5: number, arg6: Array<number>) => Array<three.Vector2>;
    };

/**
     * UExtrudeBufferGeometryEx 생성 옵션 <br>
     */
    type UExtrudeBufferGeometryExCO = {
        /**
         * 커브 세그먼트 수 <br>
         */
        curveSegments?: number;
        /**
         * 압출 스텝 수 <br>
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
         * 베벨 크기 (기본값: bevelThickness - 2) <br>
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
        UVGenerator?: UVGeneratorExType;
        /**
         * (deprecated) depth 사용 권장 <br>
         */
        amount?: number;
    };

export type { UExtrudeBufferGeometryEx, UExtrudeBufferGeometryExCO, UVGeneratorExType };
