// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class U3dOverviewMap {
    constructor(opt?: {});
    _initialized: boolean;
    _state: any;
    _app: any;
    _drawArg: any;
    _idOverview: any;
    _crs: any;
    _extent: any;
    _center: any;
    _olmap: any;
    _layer: any;
    _mode: any;
    getId(): any;
    /**
     * 오버뷰 지도와 뷰를 해제하고 앱 및 렌더링 자원 참조를 정리합니다.
     * 이미 해제한 오버뷰에 다시 호출해도 안전합니다.
     */
    dispose(): void;
    /**
     * OL 지도를 생성하고 사용 가능한 앱의 카메라 위치와 중심을 동기화합니다.
     * @returns {boolean} 오버뷰 초기화 성공 여부
     */
    initialize(): boolean;
    offmouseend(): void;
    onmouseend(): void;
    isInitialized(): boolean;
    setRotation(rad: any): boolean;
    setGeoCenter(googleX: any, googleY: any): boolean;
    getViewRegion(drawArg: any): void;
    removeLayer(): void;
    setVworld(): void;
    setEmap(opt: any): void;
}

export type { U3dOverviewMap };
