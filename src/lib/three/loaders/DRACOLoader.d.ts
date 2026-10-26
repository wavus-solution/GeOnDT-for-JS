// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class DRACOLoader extends Loader<any, string> {
    constructor(manager: any);
    decoderPath: string;
    decoderConfig: {};
    decoderBinary: any;
    decoderPending: Promise<void>;
    workerLimit: number;
    workerPool: any[];
    workerNextTaskID: number;
    workerSourceURL: string;
    defaultAttributeIDs: {
        position: string;
        normal: string;
        color: string;
        uv: string;
    };
    defaultAttributeTypes: {
        position: string;
        normal: string;
        color: string;
        uv: string;
    };
    setDecoderPath(path: any): this;
    setDecoderConfig(config: any): this;
    setWorkerLimit(workerLimit: any): this;
    load(url: any, onLoad: any, onProgress: any, onError: any): void;
    parse(buffer: any, onLoad: any, onError?: () => void): void;
    decodeDracoFile(buffer: any, callback: any, attributeIDs: any, attributeTypes: any, vertexColorSpace?: "srgb-linear", onError?: () => void): any;
    decodeGeometry(buffer: any, taskConfig: any): any;
    _createGeometry(geometryData: any): BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>;
    _assignVertexColorSpace(attribute: any, inputColorSpace: any): void;
    _loadLibrary(url: any, responseType: any): Promise<any>;
    preload(): this;
    _initDecoder(): Promise<void>;
    _getWorker(taskID: any, taskCost: any): Promise<any>;
    _releaseTask(worker: any, taskID: any): void;
    debug(): void;
    dispose(): this;
}

export type { DRACOLoader };
