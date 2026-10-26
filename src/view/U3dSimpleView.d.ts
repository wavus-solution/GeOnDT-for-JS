// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { URenderer } from "../core/URenderer.js";
import type { UScene } from "../core/UScene.js";

declare class U3dSimpleView {
    constructor(opt?: {});
    element: any;
    _classtype: string;
    id: any;
    name: any;
    position: any;
    _scene: UScene;
    left: any;
    up: any;
    fov: any;
    aspect: any;
    near: any;
    far: any;
    visibleHelper: any;
    camera: three.PerspectiveCamera;
    cameraHelper: three.CameraHelper;
    _useContext: any;
    renderer: URenderer;
    width: any;
    height: any;
    domRect: any;
    setApp(app: any): void;
    _app: any;
    drawArg: any;
    _initPosition: three.Vector3;
    _initRotation: three.Euler;
    getRenderer(): URenderer;
    getCamera(): three.PerspectiveCamera;
    getScene(): UScene;
    setViewSize(width: any, height: any): void;
    showHelper(visible: any): void;
    dispose(): void;
    remove(): void;
    setRotationLeft(degLeft: any): void;
    setRotationUp(degUp: any): void;
    update(): void;
    moveViewPosition(position: any): void;
}

export type { U3dSimpleView };
