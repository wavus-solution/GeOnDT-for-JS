// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UHeightFilter } from "./UHeightFilter.js";
import type { HeightFilter3DMeshOptions, UHeightFilter3DCO } from "./UHeightFilter3D.types.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { OLGeometry } from "../types/ol.types.js";

/**
 * ~extends import('@union3d/analy/UHeightFilter').UHeightFilter <br>
 * 고도 제한 필터 클래스 <br>
 * 지정된 geometry 영역 내에서 고도 제한 조건에 맞는 메쉬를 탐색하는 기능을 제공한다.
 * @group analysis
 * @extends UHeightFilter
 */
declare class UHeightFilter3D extends UHeightFilter {
    /**
     * @param {UHeightFilter3DCO} [options={}]
     */
    constructor(options?: UHeightFilter3DCO);
    /** @type {OLGeometry} */ _olgeometry: OLGeometry;
    /** @type {number | undefined} */ endheight: number | undefined;
    /** @type {number} */ segments: number;
    /** @type {{color: number, opacity: number}} */ defaultStyle: {
        color: number;
        opacity: number;
    };
    /** @type {{color: number, opacity: number}} */ style: {
        color: number;
        opacity: number;
    };
    /** @type {boolean} */ nestingMatch: boolean;
    /** @type {Array<unknown>} */ _poiList: Array<unknown>;
    /** @type {string | undefined} */ prevType: string | undefined;
    /** @type {string} */ type: string;
    /** @type {number | undefined} */ theta: number | undefined;
    /** @type {number} */ betweenAngle: number;
    /** @type {number} */ updownAngle: number;
    /** @type {number | undefined} */ _length: number | undefined;
    /** @type {number | undefined} */ _inclination: number | undefined;
    /** @type {import('three').Mesh | undefined} */ _oriMesh: three.Mesh | undefined;
    getPoiList(): unknown[];
    /**
     * @param {number} endheight
     */
    setEndHeight(endheight: number): void;
    makeMesh(): void;
    /**
     * @param {{color: number, opacity: number}} style
     */
    setStyle(style: {
        color: number;
        opacity: number;
    }): void;
    /**
     * @param {boolean} nestingMatch
     */
    setNestingMatch(nestingMatch: boolean): void;
    /**
     * @return {{color: number, opacity: number}}
     */
    getStyle(): {
        color: number;
        opacity: number;
    };
    /**
     * @param {string} type
     */
    setType(type: string): void;
    /**
     * @return {string}
     */
    getType(): string;
    /**
     * @return {number}
     */
    getBetweenAngle(): number;
    /**
     * @param {number} angle
     */
    setBetweenAngle(angle: number): void;
    /**
     * @return {number}
     */
    getUpDownAngle(): number;
    /**
     * @param {number} angle
     */
    setUpDownAngle(angle: number): void;
    /**
     * @param {number} theta
     */
    setTheta(theta: number): void;
    /**
     * @param {import('@UMesh').UMesh} mesh
     * @param {import('three').Vector3 | undefined} maxVector
     * @param {boolean | undefined} convertAngle
     * @return {number | undefined}
     */
    makeUpDownAngle(mesh: UMesh, maxVector: three.Vector3 | undefined, convertAngle: boolean | undefined): number | undefined;
    /**
     * @param {HeightFilter3DMeshOptions} options
     * @return {import('@UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _createExtruedeMesh(options: HeightFilter3DMeshOptions): UMesh | undefined;
    /**
     * @param {HeightFilter3DMeshOptions} options
     * @return {import('@UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _creteMeshByTheta(options: HeightFilter3DMeshOptions): UMesh | undefined;
    _googleScale: number;
    /**
     * @param {HeightFilter3DMeshOptions} options
     * @return {import('@UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _createMeshByCircle(options: HeightFilter3DMeshOptions): UMesh | undefined;
    /**
     * @param {HeightFilter3DMeshOptions} options
     * @return {import('@UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _createMeshByPolygon(options: HeightFilter3DMeshOptions): UMesh | undefined;
}

export type { UHeightFilter3D };
