// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class SelectionBox {
    constructor(camera: any, scene: any, deep?: number);
    camera: any;
    scene: any;
    startPoint: Vector3;
    endPoint: Vector3;
    collection: any[];
    instances: {};
    deep: number;
    select(startPoint: any, endPoint: any): any[];
    /**
     * 화면 선택 상자를 카메라의 절두체 평면으로 변환합니다.
     *
     * @param {import('three').Vector3} [startPoint] 선택 시작점의 정규화 좌표입니다.
     * @param {import('three').Vector3} [endPoint] 선택 끝점의 정규화 좌표입니다.
     * @returns {void} 계산한 평면을 내부 선택 절두체에 반영합니다.
     */
    updateFrustum(startPoint?: three.Vector3, endPoint?: three.Vector3): void;
    searchChildInFrustum(frustum: any, object: any): void;
}

export type { SelectionBox };
