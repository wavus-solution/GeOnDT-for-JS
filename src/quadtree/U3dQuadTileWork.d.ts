// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class U3dQuadTileWork {
    constructor(opt?: {});
    _message: any;
    _force3: any;
    _selector: any;
    _callback: any;
    _parameter: any;
    _tile: any;
    _drawArg: any;
    _object: any;
    _filter: any;
    _end: any;
    _name: any;
    _uuid: string;
    _active: boolean;
    _cancel: any;
    getField(name: any): any;
    Filter(): any;
    End(): any;
    Cancel(): any;
    distanceToCameraPosition(): any;
    distanceToCamera(): any;
    getName(): any;
    getObject(): any;
    getTile(): any;
    getSelector(): any;
    getCallback(): any;
    getParameter(): any;
    getMessage(): any;
    getUid(): string;
    isActive(): boolean;
    setActive(active: any): void;
}

export type { U3dQuadTileWork };
