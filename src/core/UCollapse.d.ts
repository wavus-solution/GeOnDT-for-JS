// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dObject } from "./U3dObject.js";
import type { URaycaster } from "./URaycaster.js";

declare class UCollapse extends U3dObject {
    constructor(opt?: {});
    _initialized: boolean;
    _classTpye: string;
    _mesh: any;
    _camera: any;
    _drawArg: any;
    _app: any;
    _simplePick: any;
    raycaster: URaycaster;
    raycasterNotVisible: URaycaster;
    showMesh(visible: any): void;
    dispose(): void;
    /**
     * 선택용 평면을 현재 지도 영역에 맞추고 기존 선택 객체와 재질을 유지합니다.
     * @returns {void}
     * @ignore
     */
    updateRegion(): void;
    createMesh(): boolean;
    getPosition2DFromTouchPosition(event: any): {
        x: number;
        y: number;
    };
    /**
     * 화면 NDC를 구한다. 마우스 이벤트를 받거나 스크린 좌표 x,y를 받는다.
     * @param {MouseEvent | number} eventOrX
     * @param {number} y
     * @return {{x, y}|null}
     *
     * @ignore
     */
    getPosition2DFromScreenPosition(eventOrX: MouseEvent | number, y: number): {
        x: any;
        y: any;
    } | null;
    getCollapsePosition(vec3d: any, scenes: any): any;
    getCollapseTouchPositionEx(event: any, scenes: any): any;
    getCollapseMousePositionSimpleEx(event: any): three.Vector3;
    getCollapseMousePositionEx(event: any, isPlane: any, minRange?: number): any;
    setMeshPositionZ(z: any): void;
    getCollapseMousePosition(vec2d: any, scenes: any): any;
}

export type { UCollapse };
