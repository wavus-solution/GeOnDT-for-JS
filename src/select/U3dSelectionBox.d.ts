// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * This is a class to check whether objects are in a selection area in 3D space
 */
declare class U3dSelectionBox {
    constructor(camera: any, scene: any, deep?: number, helperDomName?: string);
    helperDomName: string;
    mouseEvent: {
        startPoint: {
            normalizedX: any;
            normalizedY: any;
        };
        endPoint: {
            normalizedX: any;
            normalizedY: any;
        };
    };
    pointerDown(event: any): void;
    pointerMove(event: any): {
        instances: any;
        objects: any;
    };
    pointerUp(event: any): {
        instances: any;
        objects: any;
    };
    getStartPoint(): any;
    getEndPoint(): any;
    getStartPointNormalized(): {
        normalizedX: any;
        normalizedY: any;
    };
    getEndPointNormalized(): {
        normalizedX: any;
        normalizedY: any;
    };
    setScene(scene: any): void;
    scene: any;
    setCamera(camera: any): void;
    camera: any;
    setHelper(renderer: any): void;
    helper: USelectionHelper;
    dispose(): void;
    searchChildInFrustum(frustum: any, object: any): void;
}

declare class USelectionHelper {
    constructor(renderer: any, cssClassName?: string);
    onSelectOver(): void;
}

export type { U3dSelectionBox, USelectionHelper };
