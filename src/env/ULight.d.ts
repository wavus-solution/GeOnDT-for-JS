// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class ULight {
    constructor(opt: any);
    isDisposed: boolean;
    initialized: boolean;
    _sunPosition: three.Vector3;
    _envLight: any;
    _sunLight: any;
    _scene: any;
    _drawArg: any;
    _shadow: boolean;
    set visible(visible: boolean);
    get visible(): boolean;
    dispose(): void;
    update(sunPosition: any, sunDate: any, drawArg: any): void;
    setIntensityEnviLight(length?: number): void;
    setIntensitySuniLight(length?: number): void;
    setShadow(enable: any): boolean;
    isShadowEnable(): boolean;
    isInitialized(): boolean;
    computeSunPosition(date: any, geo: any, world: any, dist?: number): three.Vector3;
    isShadowAtTime(date: any, position: any, intersects: any, targets: any, dist?: number): boolean;
    getParam(): void;
    analySunAmount(start: any, end: any, position: any, step: any, dist: number, intersects: any, rtargets: any): false | {
        start: Date;
        end: Date;
        amount: number;
    }[];
    _sunAmountStep: number;
    #private;
}

export type { ULight };
