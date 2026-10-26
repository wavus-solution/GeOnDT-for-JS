// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dSelectRingOption, USelect } from "./U3dSelect.js";

/**
 * 선택 대상별 회전 링과 렌더 콜백을 관리합니다. 대상의 재질은 변경하지 않습니다.
 *
 * @ignore
 */
declare class U3dSelectionRing {
    /**
     * @param {import('@U3dApp').U3dApp} app 링을 표시할 앱
     * @param {string} key 선택기별 고유 렌더 콜백 키
     */
    constructor(app: U3dApp, key: string);
    app: U3dApp;
    key: string;
    /**
     * 같은 선택 키는 대상 참조와 스타일을 갱신하여 재로딩 시 중복 링을 방지합니다.
     *
     * @param {string} key 선택 키
     * @param {USelect} target 선택 대상
     * @param {import('three').ColorRepresentation} color 강조 색
     * @param {number} opacity 투명도
     * @param {U3dSelectRingOption} options 링 옵션
     */
    set(key: string, target: USelect, color: three.ColorRepresentation, opacity: number, options: U3dSelectRingOption): void;
    /**
     * 경계 계산 없이 현재 위치·높이 오프셋·가시성과 회전 위상을 갱신합니다.
     * @param {string} [key] 새로 추가한 링만 즉시 갱신할 때 지정합니다.
     */
    update(key?: string): void;
    /**
     * 링 재질을 해제하고 마지막 링이면 렌더 콜백과 그룹도 제거합니다.
     * @param {string} key 선택 키
     */
    remove(key: string): void;
    /** 모든 링과 공유 지오메트리, 렌더 콜백을 해제합니다. */
    dispose(): void;
    #private;
}

export type { U3dSelectionRing };
