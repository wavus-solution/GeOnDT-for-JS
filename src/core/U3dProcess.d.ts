// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dObject } from "./U3dObject.js";

declare class U3dProcess extends U3dObject {
    constructor(opt?: {});
    _classtype: string;
    _layer: any;
    _maxProcess: any;
    _callback: any;
    _parameter: any;
    _drawArg: any;
    _type: any;
    _useMultiBuffer: any;
    _distanceRange: {
        distance: number;
        index: number;
    }[];
    _queueBuffer: any;
    _remainProcess: number;
    _dispose: boolean;
    dispose(): void;
    getMaxProcess(): any;
    setMaxProcess(maxProcess?: any): void;
    getLayer(): any;
    add(item: any, force: any, isOnly: any, scope: any): number;
    enqueueWork(work: any, tile: any): void;
    getWork(item: any, force: any, isOnly: any, scope: any): any[];
    getWorking(): boolean;
    getWorkingCount(): number;
    getWorkingLevel2(): any;
    getWorkingLevel3(): any;
    getType(): any;
    update(): void;
}

export type { U3dProcess };
