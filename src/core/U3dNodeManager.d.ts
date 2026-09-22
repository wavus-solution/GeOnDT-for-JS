// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UEventDispatcher } from "./UEventDispatcher.js";

declare class U3dNodeManager extends UEventDispatcher {
    static Event: {
        LINK_REGISTERED: string;
        BRANCH: string;
    };
    static "__#146@#instance": any;
    static get Instance(): any;
    constructor();
    get nodes(): Map<any, any>;
    addNode(anchor: any, key: any): any;
    /** 노드 직접 등록(외부에서 만든 node를 관리 하에 넣고 싶을 때) */
    registerNode(node: any): void;
    getNodes(): any[];
    getNode(nodeId: any): any;
    getLinks(): any[];
    registerLink(from: any, to: any, key: any, userData: any): any;
    /** link 해제 */
    /** link 해제 */
    unregisterLink(linkId: any): void;
    getLink(linkId: any): any;
    /** node에서 downstream(나가는) edge 목록 */
    getOutLinks(node: any): any[];
    getInputLinks(node: any): any[];
    #private;
}

export type { U3dNodeManager };
