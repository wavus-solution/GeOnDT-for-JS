// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UProcessManager {
    constructor(app: any, maxProcess: any);
    _app: any;
    _drawArg: any;
    _maxProcess: any;
    _userProcess: any;
    _imageProcess: any;
    _heightProcess: any;
    _modelProcess: any;
    _modelWorkProcesses: any[];
    _customProcess: any;
    _workingProcessLog: Map<any, any>;
    getWorkingCount(): any;
    getWorkingLevel2(): any;
    getWorkingLevel3(): any;
    logProcess(task: any): void;
    deleteLog(task: any): void;
    getLog(): Map<any, any>;
    initUserProcess(): any;
    initImageProcess(): any;
    initHeightProcess(): any;
    initModelProcess(): any;
    initModelWorkProcess(): any[];
    getWorkLimitList(maxProcess?: any): any[];
    applyMaxProcess(maxProcess?: any): void;
    getUserProcess(): any;
    getImageProcess(): any;
    getHeightProcess(): any;
    getModelProcess(): any;
    getModelWorkProcesses(): any[];
    getCustomProcess(): any;
}

export type { UProcessManager };
