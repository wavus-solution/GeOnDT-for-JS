// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { OutlinePass } from "../lib/three/postprocessing/OutlinePass.js";
import type { UOutlineStyleOption } from "../select/U3dObjectBarrier.js";

/**
 * A pass for rendering outlines around selected objects.
 *
 * ```js
 * const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
 * const outlinePass = new OutlinePass( resolution, scene, camera );
 * composer.addPass( outlinePass );
 * ```
 *
 * @extends {OutlinePass}
 * @three_import import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
 */
declare class UOutlinePass extends OutlinePass {
    /**
     * 간략 외곽 옵션을 검증·복사하며 잘못된 타입·수치는 TypeError·RangeError로 전달합니다.
     *
     * @param {import('@union3d/select/U3dObjectBarrier').UOutlineStyleOption} style 입력 스타일
     * @returns {import('@union3d/select/U3dObjectBarrier').UOutlineStyleOption} 간략 외곽 옵션을 복사한 스타일
     */
    static _normalizeStyle(style: UOutlineStyleOption): UOutlineStyleOption;
    /**
     * Constructs a new outline pass.
     *
     * @param {import('three').Vector2 | undefined} resolution - The effect's resolution.
     * @param {import('three').Scene} scene - The scene to render.
     * @param {import('three').Camera} camera - The camera.
     * @param {Array<import('three').Object3D> | undefined} selectedObjects - The selected 3D objects that should receive an outline.
     * @param {import('@U3dApp').U3dApp} app U3dApp 객체
     *
     */
    constructor(resolution: three.Vector2 | undefined, scene: three.Scene, camera: three.Camera, selectedObjects: Array<three.Object3D> | undefined, app: U3dApp);
    _styleIdByObject: WeakMap<object, any>;
    _styleIdByInstancedMesh: WeakMap<object, any>;
    _instanceStyleTexByInstancedMesh: WeakMap<object, any>;
    _freeStyleIds: any[];
    _nextStyleId: number;
    _styleCapacity: number;
    _styleTexture: DataTexture;
    _setStyleFlag: boolean;
    _tmpStyleVis: Color;
    _tmpStyleHid: Color;
    _tmpStyleDash: Color;
    _styleMap: Map<any, any>;
    lineWidth: number;
    _app: U3dApp;
    _layerVisibleMap: Map<any, any>;
    _maskRenderObjects: any[];
    _maskRenderStyleIds: any[];
    prepareMaskMaterialInstanced: three.ShaderMaterial;
    _renderOrderCache: {
        hasRenderOrder: boolean;
        dirty: boolean;
    };
    _instancedOrderCache: Map<any, any>;
    /**
     * 현재 렌더 카메라와 두 마스크의 깊이 변환 방식을 동기화합니다.
     * 선택·스타일·활성 상태는 유지하며 투영 종류가 바뀔 때만 셰이더를 갱신합니다.
     * @param {import('three').Camera} camera 이번 프레임의 카메라
     * @returns {void}
     */
    updateState(camera: three.Camera): void;
    /**
     * 공통 외곽 셰이더를 화면 출력 없이 미리 준비하며 실제 선택·장면은 변경하지 않습니다.
     * 독자 인스턴싱·스킨·모프 셰이더 변형은 해당 형상의 실제 렌더에서 준비합니다.
     * @param {import('three').WebGLRenderer} renderer 패스를 소유한 렌더러
     * @returns {Promise<boolean>} 준비 성공 여부. 미지원·해제·실패 시 기존 렌더 경로를 유지합니다.
     * @ignore
     */
    _prewarm(renderer: three.WebGLRenderer): Promise<boolean>;
    setSize(width: any, height: any): void;
    /**
     * 전체 선 두께를 변경하며 활성 farPoint에는 양수 값을 CSS 픽셀로 적용합니다.
     *
     * @param {number} width 선 두께. 유한수가 아니면 기존 값을 유지합니다.
     */
    setLineWidth(width: number): void;
    setMode(mode: any): void;
    mode: any;
    getMode(): any;
    addSelectedObject(object: any): void;
    removeSelectedObject(object: any): void;
    getEdgeColor(): Color;
    /** 전체 등록을 비우고 간략 윤곽 전용 참조·자원과 객체 스타일을 정리합니다. */
    clearSelectedObjects(): void;
    getSelectedObjects(): three.Object3D<three.Object3DEventMap>[];
    getSelectedBlending(): three.Blending;
    setSelectedBlending(blending: any): void;
    /**
     * 대상의 style 지정하는 함수.
     * - visible/hidden/dash 색상을 모두 동일하게 쓰고 싶을 때 `{ color }`만 전달하면 됩니다.
     *
     * @param {import('three').Object3D} object outline 스타일을 적용할 대상
     * @param {object} [style] 기존 외곽선 옵션과 {@link UOutlineFarPointOption} 형태의 farPoint. 생략하면 직접 스타일을 대체합니다.
     * @returns {number} styleId
     */
    setOutlineStyleForObject(object: three.Object3D, style?: object): number;
    getOutlineStyleForObject(object: any, effective?: boolean): any;
    /**
     * 오브젝트(outline 대상)마다 개별 색상을 간단히 지정하는 compact helper 입니다.
     * - visible/hidden/dash 색상을 모두 동일하게 쓰고 싶을 때 `{ color }`만 전달하면 됩니다.
     *
     * @param {import('three').Object3D} object outline 스타일을 적용할 대상
     * @param {import('three').ColorRepresentation} color 적용할 색상
     * @param {object} [style] pulse/dash 옵션 등 추가 스타일(기본: color만 적용)
     * @return {number} styleId
     */
    setOutlineColorForObject(object: three.Object3D, color: three.ColorRepresentation, style?: object): number;
    /**
     * 인스턴스별 외곽선 스타일을 지정합니다. 간략 윤곽 옵션의 잘못된 타입·수치는 TypeError·RangeError입니다.
     *
     * @param {import('three').InstancedMesh} instancedMesh 공유 메시
     * @param {number} instanceIndex 실제 인덱스
     * @param {object} [style] 기존 외곽선 옵션과 {@link UOutlineFarPointOption} 형태의 farPoint
     * @returns {number} 스타일 ID. 대상·인덱스가 유효하지 않으면 0
     */
    setOutlineStyleForInstance(instancedMesh: three.InstancedMesh, instanceIndex: number, style?: object): number;
    getOutlineStyleForInstance(instancedMesh: any, instanceIndex: any, effective?: boolean): any;
    /**
     * InstancedMesh의 특정 instanceIndex에 대해 개별 색상을 간단히 지정하는 compact helper 입니다.
     *
     * @param {import('three').InstancedMesh} instancedMesh instanced mesh
     * @param {number} instanceIndex instance index
     * @param {import('three').ColorRepresentation} color 적용할 색상
     * @param {object} [style] pulse/dash 옵션 등 추가 스타일(기본: color만 적용)
     * @return {number} styleId
     */
    setOutlineColorForInstance(instancedMesh: three.InstancedMesh, instanceIndex: number, color: three.ColorRepresentation, style?: object): number;
    clearOutlineStyleForInstance(instancedMesh: any, instanceIndex: any): void;
    clearOutlineStyleForObject(object: any): void;
    /** 후처리 비활성화 시 간략 윤곽 전용 자원만 해제합니다. 등록·스타일은 보존합니다. */
    _clearFarPoints(): void;
    #private;
}

/**
     * 일반 패스와 간략 외곽 구현 사이의 수명·출력 연결 계약입니다.
     */
    type UOutlineFarPointRenderer = {
        /**
         * 프레임 참조 해제
         */
        _clear: () => void;
        /**
         * 대상 전환 이력 해제
         */
        _invalidate: (object: three.Object3D, instanceIndex: number | undefined) => void;
        /**
         * 현재 프레임과 CSS 두께 구성
         */
        _prepare: (members: Array<UOutlineFarPointMember>, styles: Map<number, UOutlineStyleOption>, texture: three.DataTexture, mode: number, camera: three.Camera, renderer: three.WebGLRenderer, lineWidth: number) => UOutlineFarPointFrame;
        /**
         * 기존 우선순위와 시간에 따라 합성
         */
        _render: (renderer: three.WebGLRenderer, buffer: three.WebGLRenderTarget, camera: three.Camera, depth: three.Texture, order: number, forceVisible: boolean, strength: number, maskActive: boolean, blending: three.Blending, time: number) => void;
        /**
         * 원본 마스크에서 일정한 기본 두께와 모드 효과로 상세 외곽 합성
         */
        _renderDetailed: (renderer: three.WebGLRenderer, buffer: three.WebGLRenderTarget, camera: three.Camera, mask: three.WebGLRenderTarget, styles: three.DataTexture, strength: number, maskActive: boolean, blending: three.Blending, time: number) => void;
        /**
         * 상세 일정 두께 대상을 기존 블러 입력에서 제외
         */
        _filterLegacyMask: (renderer: three.WebGLRenderer, camera: three.Camera, target: three.WebGLRenderTarget, mask: three.Texture, styles: three.DataTexture) => void;
        /**
         * 소유 GPU 자원·참조 해제
         */
        _dispose: () => void;
        /**
         * 렌더 타깃 없이 사전 컴파일할 공통 재질 조회
         */
        _getPrewarmMaterials: () => Array<three.ShaderMaterial>;
    };

/**
     * 간략 외곽 출력에 필요한 공유 메시의 내부 조회 계약입니다.
     */
    type UOutlineFarPointMesh = three.Mesh & Partial<{
        getBarrierInstances: () => Array<number>;
        getActiveAndVisibilityAt: (index: number) => boolean;
        getMatrixAt: (index: number, matrix: three.Matrix4) => void;
        _pickMaterials: Array<number>;
        _disposed: boolean;
        _sleeping: boolean;
        _parentLOD: UOutlineFarPointMesh;
        LODinfo: {
            objects: Array<UOutlineFarPointMesh>;
        };
    }>;

/**
     * 등록을 변경하지 않고 구성한 개별 출력 대상입니다.
     */
    type UOutlineFarPointMember = {
        /**
         * 실제 메시
         */
        object: UOutlineFarPointMesh;
        /**
         * 등록 루트
         */
        root: three.Object3D;
        /**
         * 실제 적용 스타일 ID
         */
        styleId: number;
        /**
         * 기존 패스가 정규화한 합성 우선순위
         */
        order: number;
        /**
         * 공유 메시의 실제 인덱스
         */
        instanceIndex?: number;
    };

/**
     * 닫힌 윤곽을 구성하는 투영 정점입니다.
     */
    type UOutlineFarPointVertex = {
        /**
         * 가로 NDC 좌표
         */
        x: number;
        /**
         * 세로 NDC 좌표
         */
        y: number;
        /**
         * 양수 카메라 공간 깊이
         */
        depth: number;
    };

/**
     * 독립 간략 외곽 출력에 사용하는 투영 결과입니다.
     */
    type UOutlineFarPointDraw = {
        /**
         * 중심 NDC 가로 좌표
         */
        x: number;
        /**
         * 중심 NDC 세로 좌표
         */
        y: number;
        /**
         * 양수 카메라 공간 깊이
         */
        depth: number;
        /**
         * 연결 순서의 윤곽 정점. 마지막과 처음도 연결
         */
        vertices: Array<UOutlineFarPointVertex>;
        /**
         * 합성 우선순위
         */
        order: number;
        /**
         * 기본 선의 CSS 픽셀 두께
         */
        lineWidth: number;
        /**
         * 모드·속도·광채·점선 밀도·비율·시간 오프셋·점선 RGB
         */
        effect: Array<number>;
        /**
         * 비가림 선형 RGB
         */
        visibleColor: Array<number>;
        /**
         * 가림 선형 RGB
         */
        hiddenColor: Array<number>;
    };

/**
     * 한 프레임의 표현 목록으로 등록·소유권·깊이 캐시와 별개입니다.
     */
    type UOutlineFarPointFrame = {
        /**
         * 마스크 출력에서 제외할 일반 메시
         */
        objects: Set<UOutlineFarPointMesh>;
        /**
         * 마스크 출력에서 제외할 인덱스
         */
        instances: Map<UOutlineFarPointMesh, Set<number>>;
        /**
         * 기존 연결 이름을 유지한 독립 닫힌 윤곽 목록
         */
        points: Array<UOutlineFarPointDraw>;
    };

export type { UOutlineFarPointDraw, UOutlineFarPointFrame, UOutlineFarPointMember, UOutlineFarPointMesh, UOutlineFarPointRenderer, UOutlineFarPointVertex, UOutlinePass };
