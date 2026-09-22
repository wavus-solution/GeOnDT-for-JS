// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UMetaData {
    constructor(opt?: {});
    metaIdKey: any;
    metaParentKey: any;
    metaNameKey: any;
    fileNameKey: any;
    rootNameKey: any;
    objectTypeKey: any;
    typeKey: any;
    tagKey: any;
    propertiesKey: any;
    id: any;
    name: any;
    parentId: any;
    fileName: any;
    rootName: any;
    objectType: any;
    type: any;
    tag: any;
    properties: any;
    children: any[];
    text: any;
    export(): {};
    getId(): any;
    getName(): any;
    getFileName(): any;
    getRootName(): any;
    getProperties(): any;
    getParentId(): any;
    getIdKey(): any;
    getParentKey(): any;
    getChildren(): any[];
    setRootName(rootName: any): void;
}

export type { UMetaData };
