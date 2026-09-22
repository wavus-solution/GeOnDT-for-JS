// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class LRUCache {
    constructor(capacity: any, deleteCallback: any);
    cache: Map<any, any>;
    unitByteLength: number;
    capacity: number;
    remainsCapacity: number;
    deleteCallback: any;
    has(key: any): boolean;
    keys(): MapIterator<any>;
    values(): MapIterator<any>;
    length(): number;
    clear(): void;
    peek(key: any): any;
    get(key: any): any;
    /**
     * 값을 cache에 저장하고 byte 용량을 넘으면 오래된 항목부터 제거합니다.
     *
     * @param {unknown} key cache key입니다.
     * @param {Record<string, unknown> & Partial<{byteLength: number}>} value 저장할 값입니다.
     * @returns {boolean} 값을 cache에 저장했으면 `true`입니다.
     */
    put(key: unknown, value: Record<string, unknown> & Partial<{
        byteLength: number;
    }>): boolean;
    delete(key: any): void;
    getLeastRecent(): [any, any];
    getMostRecent(): [any, any];
}

export type { LRUCache };
