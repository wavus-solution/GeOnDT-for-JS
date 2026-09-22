// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class TransformControls extends Object3D<three.Object3DEventMap> {
    constructor(camera: any, domElement: any);
    _disposed: boolean;
    isTransformControls: boolean;
    domElement: any;
    _gizmo: TransformControlsGizmo;
    _plane: TransformControlsPlane;
    _offset: Vector3;
    _startNorm: Vector3;
    _endNorm: Vector3;
    _cameraScale: Vector3;
    _parentPosition: Vector3;
    _parentQuaternion: Quaternion;
    _parentQuaternionInv: Quaternion;
    _parentScale: Vector3;
    _worldScaleStart: Vector3;
    _worldQuaternionInv: Quaternion;
    _worldScale: Vector3;
    _positionStart: Vector3;
    _quaternionStart: Quaternion;
    _scaleStart: Vector3;
    _getPointer: any;
    _onPointerDown: any;
    _onPointerHover: any;
    _onPointerMove: any;
    _onPointerUp: any;
    updateMatrixWorld(force: any): void;
    pointerHover(pointer: any): void;
    axis: any;
    pointerDown(pointer: any): void;
    dragging: boolean;
    pointerMove(pointer: any): void;
    rotationAngle: any;
    pointerUp(pointer: any): void;
    attach(object: any): this;
    object: any;
    detach(): this;
    reset(): void;
    getRaycaster(): Raycaster;
    getMode(): any;
    setMode(mode: any): void;
    mode: any;
    setTranslationSnap(translationSnap: any): void;
    translationSnap: any;
    setRotationSnap(rotationSnap: any): void;
    rotationSnap: any;
    setScaleSnap(scaleSnap: any): void;
    scaleSnap: any;
    setSize(size: any): void;
    size: any;
    setSpace(space: any): void;
    space: any;
}

declare class TransformControlsGizmo extends Object3D<three.Object3DEventMap> {
    constructor();
    isTransformControlsGizmo: boolean;
    type: string;
    gizmo: {};
    picker: {};
    helper: {};
    updateMatrixWorld(force: any): void;
}

declare class TransformControlsPlane extends Mesh<BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    constructor();
    isTransformControlsPlane: boolean;
    type: string;
    updateMatrixWorld(force: any): void;
}

export type { TransformControls, TransformControlsGizmo, TransformControlsPlane };
