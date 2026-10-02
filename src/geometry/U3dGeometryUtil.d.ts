// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { OLGeometry } from "../types/ol.js";

/**
 * 3D 지오메트리 유틸리티 클래스 <br>
 *
 * @group util
 */
declare class U3dGeometryUtil {
    /**
     * 두 메쉬의 geometry를 하나로 병합해 새 메쉬를 반환합니다. <br>
     * 여러 도형을 draw call 하나로 합쳐 렌더링 성능을 높입니다. <br>
     *
     * @param {import('three').Mesh} dst 대상 메쉬 <br>
     * @param {import('three').Mesh} src 원본 메쉬 <br>
     * @param {import('three').Material} [material] 병합 메쉬에 적용할 재질 <br>
     * @returns {import('@union3d/core/mesh/UMesh').UMesh} 병합된 메쉬 <br>
     */
    mergeByMesh(dst: three.Mesh, src: three.Mesh, material?: three.Material): UMesh;
    /**
     * 3D 지오메트리를 OL Polygon Geometry로 변환하는 함수입니다. <br>
     *
     * @param {{type: string, vertices: Array<import('three').Vector3>}} geometry 변환할 지오메트리 객체 <br>
     * @param {number} [offsetX=0] X 오프셋 <br>
     * @param {number} [offsetY=0] Y 오프셋 <br>
     * @param {import('@UDrawArg').UDrawArg} [drawarg] DrawArg 객체 <br>
     * @param {string} [srs='epsg:4326'] 좌표계 <br>
     * @returns {OLGeometry | undefined} OL Polygon Geometry <br>
     */
    geometry3dToFeature(geometry: {
        type: string;
        vertices: Array<three.Vector3>;
    }, offsetX?: number, offsetY?: number, drawarg?: UDrawArg, srs?: string): OLGeometry | undefined;
    /**
     * 중복 꼭짓점을 병합하는 함수입니다. <br>
     *
     * @param {import('three').BufferGeometry} geometry 대상 geometry <br>
     * @param {number} [tolerance=1e-4] 병합 허용 오차 <br>
     * @returns {import('three').BufferGeometry} 병합된 geometry <br>
     */
    mergeVertices(geometry: three.BufferGeometry, tolerance?: number): three.BufferGeometry;
}

export type { U3dGeometryUtil };
