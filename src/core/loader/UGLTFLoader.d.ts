// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UGLTFLoader {
    static dracoLoader: any;
    static ktx2Loader: any;
    static g_useWebWorker: boolean;
    static g_taskProcessor: any;
    /**
     * GLTF 로더를 생성합니다.
     * @param {import('three').LoadingManager} [manager] 로딩 관리자. 생략하면 기본 관리자를 사용합니다.
     */
    constructor(manager?: three.LoadingManager);
    _classtype: string;
    dracoLoader: any;
    ktx2Loader: any;
    meshoptDecoder: any;
    load(url: any, onLoad: any, onProgress: any, onError: any): any;
    /**
     * @param {string|ArrayBuffer|object} data glTF/GLB 원본 데이터. b3dm 내부 GLB는 원본 b3dm 버퍼가 그대로 들어올 수 있다.
     * @param {string} path 외부 리소스 기준 경로
     * @param {Function} onLoad 파싱 완료 콜백
     * @param {Function} onError 파싱 실패 콜백
     * @param {object | null} layer 기존 호출 호환용 레이어 인자. 레이어 없이 파싱하면 null을 전달합니다.
     * @param {number} [byteOffset=0] data가 ArrayBuffer일 때 GLB/glTF가 시작되는 위치
     * @param {number} [byteLength] data 안에서 파싱할 GLB/glTF 길이
     * @param {{skipAnimations?: boolean, skipCameras?: boolean}} [parseOptions] 3D Tiles처럼 animation/camera 결과를 쓰지 않는 경로의 선택 최적화 옵션
     */
    parse(data: string | ArrayBuffer | object, path: string, onLoad: Function, onError: Function, layer: object | null, byteOffset?: number, byteLength?: number, parseOptions?: {
        skipAnimations?: boolean;
        skipCameras?: boolean;
    }): Promise<void>;
    setDracoDecodePath(path: any): void;
    setWorkerLimit(limit: any): void;
    dispose(): void;
}

export type { UGLTFLoader };
