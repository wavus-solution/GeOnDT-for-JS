// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 생성자 옵션
 */
type URaycasterCO = {
    usevisible?: boolean;
    useFaster?: boolean;
    params?: three.RaycasterParameters;
};

type UIntersectOption = {
    /**
     * 실행 전 검색 점
     */
    searchPosition?: three.Vector3;
    /**
     * 실행 전 검색 반경
     */
    searchRadius?: number;
    /**
     * 실행 전 검색 방향
     */
    directionVector?: three.Vector3;
    /**
     * 실행 전 검색 방향에서의 각도 범위
     */
    directionAngle?: number;
    /**
     * 실행 전 검색 가속화 여부
     */
    isFaster?: boolean;
    noLine?: boolean;
    noPoint?: boolean;
    searchFrustum?: three.Frustum;
};

/**
 * 생성자 옵션
 * @memberof URaycaster
 * @inner
 *
 * @typedef {object} URaycasterCO
 * @property {boolean} [usevisible]
 * @property {boolean} [useFaster]
 * @property {import("three").RaycasterParameters} [params]
 */
/**
 * @memberof URaycaster
 * @inner
 *
 * @typedef {object} UIntersectOption
 * @property {import('three').Vector3} [searchPosition] 실행 전 검색 점
 * @property {number} [searchRadius] 실행 전 검색 반경
 * @property {import('three').Vector3} [directionVector] 실행 전 검색 방향
 * @property {number} [directionAngle] 실행 전 검색 방향에서의 각도 범위
 * @property {boolean} [isFaster] 실행 전 검색 가속화 여부
 * @property {boolean} [noLine]
 * @property {boolean} [noPoint]
 * @property {import('three').Frustum} [searchFrustum]
 */
/**
 * ~extends import('three').Vector3
 *
 * @typedef {object} UIntersectPoint_Content
 * @property {boolean} meshed_
 * @property {boolean} grounded_

 * @memberof URaycaster
 * @inner
 *
 * @typedef {import('three').Vector3 & UIntersectPoint_Content} UIntersectPoint
 */
/**
 * ~extends import('three').Raycaster <br>
 * 레이케스터 래퍼. 고도화 기능 추가
 *
 * @group core
 *
 * @extends Raycaster
 */
declare class URaycaster extends Raycaster {
    /**
     * @param {URaycasterCO} [opt={}]
     * @param {import("three").Vector3} [origin]
     * @param {import("three").Vector3} [direction]
     * @param {number} [near]
     * @param {number} [far]
     */
    constructor(opt?: URaycasterCO, origin?: three.Vector3, direction?: three.Vector3, near?: number, far?: number);
    /** @type {boolean} */ _useFaster: boolean;
    /** @type {boolean} */ _useVisible: boolean;
    /**
     * @param {URaycasterCO} [options={}]
     * @return {this}
     */
    setParams(options?: URaycasterCO): this;
    /**
     * @override
     *
     * @param {import("three").Vector3} origin
     * @param {import("three").Vector3} direction
     * @return {this}
     */
    override set(origin: three.Vector3, direction: three.Vector3): this;
    /**
     * @override
     *
     * @param {import("three").Vector2} coords
     * @param {import("three").Camera} camera
     * @return {this}
     */
    override setFromCamera(coords: three.Vector2, camera: three.Camera): this;
    /**
     * @override
     *
     * @template {import('three').Object3D} TIntersected
     * @param {import("three").Object3D} object
     * @param {boolean} [recursive=true]
     * @param {Array<import("three").Intersection<TIntersected>>} [result=[]]
     * @param {UIntersectOption} [option={}]
     * @return {Array<import("three").Intersection<TIntersected>>}
     */
    override intersectObject<TIntersected extends three.Object3D>(object: three.Object3D, recursive?: boolean, result?: Array<three.Intersection<TIntersected>>, option?: UIntersectOption): Array<three.Intersection<TIntersected>>;
    /**
     * @override
     *
     * @template {import('three').Object3D} TIntersected
     * @param {Array<import("three").Object3D>} objects
     * @param {boolean} recursive
     * @param {Array<import("three").Intersection<TIntersected>>} [result=[]]
     * @param {object} [option]
     * @return Array<import("three").Intersection<TIntersected>>
     */
    override intersectObjects<TIntersected extends three.Object3D>(objects: Array<three.Object3D>, recursive: boolean, result?: Array<three.Intersection<TIntersected>>, option?: object): three.Intersection<TIntersected>[];
    #private;
}

export type { UIntersectOption, URaycaster, URaycasterCO };
