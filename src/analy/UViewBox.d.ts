// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UViewBoxCO, ViewBoxTile } from "./UViewBox.types.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { OLGeometry } from "../types/ol.types.js";

/**
 * `광원`이나 `조망권 분석` 등 시각적인 `분석 Mesh`를 그리는 클래스 <br>
 * 광원의 범위나 조망권을 나태나는 Object
 * @summary `광원`이나 `조망권 분석` 등 시각적인 `분석 Mesh` 관련 클래스
 * @group analysis
 */
declare class UViewBox {
    /**
     * @param {UViewBoxCO} options
     */
    constructor(options: UViewBoxCO);
    /** @type {import('@union3d/app/U3dApp').U3dApp} */ _app: U3dApp;
    /** @type {import('three').Vector3} */ start: three.Vector3;
    /** @type {import('three').Vector3} */ end: three.Vector3;
    /** @type {number} */ distance: number;
    /** @type {number} */ startOffset: number;
    /** @type {number} */ azimuth: number;
    /** @type {number} */ polar: number;
    /** @type {number} */ widthSegment: number;
    /** @type {number} */ height: number;
    /** @type {number} */ opacity: number;
    /** @type {boolean} */ transparent: boolean;
    /** @type {import('three').ColorRepresentation} */ color: three.ColorRepresentation;
    /** @type {import('three').Side} */ side: three.Side;
    /** @type {string} */ _type: string;
    /** @type {Array<number> | Float32Array} */ vertices: Array<number> | Float32Array;
    /** @type {Array<number>} */ indices: Array<number>;
    /** @type {number} */ vertexCnt: number;
    /** @type {import('three').Vector3} */ rightAxis: three.Vector3;
    /** @type {import('three').Vector3} */ upAxis: three.Vector3;
    /** @type {import('three').Vector3} */ direction: three.Vector3;
    /** @type {import('three').BufferGeometry} */ geometry: three.BufferGeometry;
    /** @type {OLGeometry | undefined} */ _bottomGeom: OLGeometry | undefined;
    /** @type {any} */ searchGeomP: any;
    /** @type {import('three').MeshStandardMaterial} */ material: three.MeshStandardMaterial;
    /** @type {import('three').Sphere} */ _boundingSphere: three.Sphere;
    /** @type {import('@UMesh').UMesh} */ mesh: UMesh;
    /** @type {any} */ parser: any;
    /** @type {import('three').Vector3 | undefined} */ _bottomEndPoint: three.Vector3 | undefined;
    /**
     * 분석 Mesh와 충돌하는 충돌하는 지형과 건물을 계산하여 Mesh를 갱신하는 함수
     * @param {Array<import('three').Object3D>} scenes app의 전체 화면들
     * @param {boolean} [useBVH]
     */
    detectCollision(scenes: Array<three.Object3D>, useBVH?: boolean): void;
    /**
     * @param {Array<ViewBoxTile>} tiles
     * @returns {Array<ViewBoxTile> | undefined}
     */
    getContainedTiles(tiles: Array<ViewBoxTile>): Array<ViewBoxTile> | undefined;
    #private;
}

export type { UViewBox };
