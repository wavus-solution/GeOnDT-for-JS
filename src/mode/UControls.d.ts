// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dObject } from "../core/U3dObject.js";
import type { URaycaster } from "../core/URaycaster.js";
import type { UScene } from "../core/UScene.js";

/**
 * @classdesc Control 관련 최상위 함수
 * @memberOf GeOnDT.control
 * @summary Control 관련 최상위 함수
 * @param {object} opt 생성자 옵션
 * @constructor
 * @property {array} _controlList control 리스트
 */
declare class UControls extends U3dObject {
    constructor(opt: any);
    isUControl: boolean;
    _drawArg: any;
    _controlCam: any;
    _controlList: any[];
    dispose(): void;
    update(): void;
    /**
     * UControls의 controlList 프로퍼티에 이력받은 control를 추가하는 함수
     * @param {UControls} control
     */
    addControl(control: UControls): void;
    bind(scope: any, fn: any): (...args: any[]) => void;
    /**
     * 레이캐스팅(Raycasting)을 통해 화면(Scene)과 교차(Intersection)하는 지점을 반환하는 함수
     * @param {import('@URaycaster').URaycaster} raycaster 레이캐스터(raycaster)
     * @param scenes {import('@UScene').UScene}화면
     * @return {array} 교차된 지점 리스트
     */
    getIntersectsFromScenes(raycaster: URaycaster, scenes: UScene): any[];
}

export type { UControls };
