// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "./UDrawArg.js";

/**
 * ~extends import('three').Scene <br>
 * UScene 생성자 옵션
 */
type USceneCO_Content = {
    /**
     * 화면(scene) 이름
     */
    name?: string;
    /**
     * <hidden>
     */
    drawarg?: UDrawArg;
};

/**
 * ~extends import('three').Scene <br>
 * UScene 생성자 옵션
 */
type USceneCO = three.Scene & USceneCO_Content;

/**
 * ~extends import('three').Scene <br>
 * UScene 생성자 옵션
 *
 * @typedef {object} USceneCO_Content
 * @property {string} [name=''] 화면(scene) 이름
 * @property {import('@UDrawArg').UDrawArg} [drawarg] <hidden>
 *
 * @memberOf UScene
 * @inner
 *
 * @typedef {import('three').Scene & USceneCO_Content} USceneCO
 */
/**
 * ~extends import('three').Scene <br>
 * `화면(scene)` 관련 객체 클래스  <br>
 * UScen에 담긴 객체들이 화면에 출력됩니다.
 *
 * @gropu core
 */
declare class UScene extends three.Scene<three.Object3DEventMap> {
    /**
     * @param {Partial<USceneCO>} [opt]  UScene 생성 파라미터
     */
    constructor(opt?: Partial<USceneCO>);
    /** @type {boolean} */ _disposed: boolean;
    _drawArg: UDrawArg;
    /**
     * 씬에 담긴  3D Object 정보를 나타내는 프러퍼티(_childrenMap)에 입력받은 3D Object가 존재하는지 확인하는 함수
     * @param {import('three').Object3D} Object3D 확인할 3D Object
     * @return {boolean} 존재하면 true, 없으면 false.
     */
    isChildren(Object3D: three.Object3D): boolean;
    /**
     * 씬에 3D Object를 추가하는 함수
     * @override
     *
     * @param {import('three').Object3D} mesh 추가할 3D Object
     */
    override add(mesh: three.Object3D): this;
    /**
     * 씬에 3D Object를 삭제하는 함수
     * @override
     *
     * @param {import('three').Object3D} mesh 삭제할 3D Object
     */
    override remove(mesh: three.Object3D, ...args: any[]): this;
    #private;
}

export type { UScene, USceneCO, USceneCO_Content };
