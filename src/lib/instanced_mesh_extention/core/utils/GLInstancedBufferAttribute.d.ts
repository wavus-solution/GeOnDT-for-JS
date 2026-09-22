// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * onBeforeRender 시점에 인스턴스 index VBO(Vertex Buffer Object, 꼭짓점 버퍼 객체)를 직접 갱신하는 GLBufferAttribute입니다.
 * CPU 배열과 마지막 GPU 업로드 내용을 비교해 동일 데이터 전송을 생략하고,
 * 변경 시 기존 저장소를 orphan하여 저사양 GPU의 bufferSubData 동기 대기를 줄입니다.
 */
declare class GLInstancedBufferAttribute extends GLBufferAttribute {
    /**
     * 인스턴스 index용 GPU buffer와 CPU 원본 배열을 초기화합니다.
     * @param {WebGL2RenderingContext} gl - buffer를 생성할 WebGL2 context
     * @param {number} type - attribute의 WebGL 데이터 타입
     * @param {number} itemSize - 인스턴스 하나가 사용하는 배열 요소 수
     * @param {number} elementSize - 배열 요소 하나의 byte 크기
     * @param {import('three').TypedArray} array - attribute 값을 보관하는 CPU typed array
     * @param {number} meshPerAttribute - 같은 attribute 값을 공유할 mesh 개수
     * @returns {GLInstancedBufferAttribute} 생성된 인스턴스 attribute
     */
    constructor(gl: WebGL2RenderingContext, type: number, itemSize: number, elementSize: number, array: three.TypedArray, meshPerAttribute?: number);
    isGLInstancedBufferAttribute: boolean;
    /** @internal */
    _needsUpdate: boolean;
    /** @internal */
    isInstancedBufferAttribute: boolean;
    meshPerAttribute: number;
    array: three.TypedArray;
    _bufferMap: WeakMap<object, any>;
    _gpuBytesMap: WeakMap<object, any>;
    _gpuMirrorMap: WeakMap<object, any>;
    /**
     * true이면 변경된 buffer를 업로드하기 전에 같은 VBO handle의 저장소를 새로 할당합니다.
     * attribute 바인딩은 유지하면서 이전 프레임 GPU 작업과의 쓰기 충돌을 피합니다.
     * @default true
     */
    orphanBeforeUpdate: boolean;
    /**
     * 변경된 범위가 현재 draw 범위에서 이 비율 이상일 때만 orphan을 수행합니다.
     * 작은 변경까지 매번 전체 prefix를 다시 올리면 CPU 복사와 GPU 전송량이 커질 수 있습니다.
     * @default 0.5
     */
    orphanUpdateRatio: number;
    /**
     * 너무 작은 buffer 갱신은 orphan보다 부분 bufferSubData가 가벼운 경우가 많아 byte 기준 하한을 둡니다.
     * @default 65536
     */
    orphanMinBytes: number;
    _lastUploadStats: {
        calls: number;
        elements: number;
        bytes: number;
        rangeStart: number;
        rangeEnd: number;
        requiredElements: number;
        changedRatio: number;
        orphaned: boolean;
        skipped: boolean;
    };
    /**
     * 현재 draw에 필요한 index 배열을 GPU buffer에 갱신합니다.
     */
    update(renderer: any, count: any): void;
    /** @internal */
    clone(): this;
    #private;
}

export type { GLInstancedBufferAttribute };
