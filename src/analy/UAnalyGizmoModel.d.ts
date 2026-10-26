// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dAdaptedGeometry } from "../geometry/U3dAdaptedGeometry.js";
import type { UGizmoControls } from "../mode/UGizmoControls.js";
import type { U3dOverlay } from "../overlay/U3dOverlay.js";
import type { WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('@union3d/analy/UAnaly').UAnaly <br>
 *
 * 기즈모(Gizmo)로 선택한 모델의 위치·회전·크기를 편집하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const gizmo = app.activeAnalysis('GizmoModel');
 */
declare class UAnalyGizmoModel extends UAnaly {
    /**
     * 편집 대상에 전달하는 변경 이벤트 이름입니다.
     *
     * @type {{CHANGE: string}}
     */
    static EVENT: {
        CHANGE: string;
    };
    /**
     * UAnalyGizmoModel 클래스 생성자입니다. <br>
     * 앱 연결 후 활성화하고 setObject로 편집할 모델을 선택합니다.
     *
     * @param {UAnalyGizmoModelCO} [opt={}] 분석 이름 옵션
     */
    constructor(opt?: UAnalyGizmoModelCO);
    /**
     *
     * @type {string | null | undefined}
     *
     * @ignore
     */ _clickId: string | null | undefined;
    /**
     *
     * @type {import('@UGizmoControls').UGizmoControls | undefined}
     *
     * @ignore
     */ _control: UGizmoControls | undefined;
    /**
     *
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */ _targetScenes: Array<three.Object3D>;
    name: any;
    /**
     * 컨트롤이 마지막으로 알린 드래그 상태를 반환합니다.
     *
     * @returns {boolean} 드래그 중이면 true
     */
    get isDrag(): boolean;
    /**
     * 편집 중 보조 레이저(laser)를 사용할지 설정합니다. <br>
     * 이미 표시된 레이저의 가시성은 즉시 바꾸지 않습니다.
     *
     * @param {boolean} use 레이저 사용 여부
     */
    setUseLaser(use: boolean): void;
    /**
     * 생성된 보조 레이저(laser)의 색·불투명도·두께를 바꿉니다. <br>
     * 생성 전에는 저장하지 않으며 이후 새로 만드는 레이저에는 적용되지 않습니다.
     *
     * @param {UAnalyGizmoModelLaserStyle} style 변경할 속성만 지정하는 필수 객체
     * @throws {TypeError} style을 생략하거나 null을 전달한 경우
     */
    setLaserStyle({ color, opacity, radius }: UAnalyGizmoModelLaserStyle): void;
    /**
     * 컨트롤의 mouseUp 때 호출할 편집 종료 콜백을 등록합니다.
     *
     * @param {UAnalyGizmoModelCallback} func 종료 시 실행할 함수
     */
    setEndFunc(func: UAnalyGizmoModelCallback): void;
    /**
     * 대상 변환과 보조 레이저 갱신 뒤 호출할 콜백을 등록합니다.
     *
     * @param {UAnalyGizmoModelCallback} func 갱신 시 실행할 함수
     */
    setUpdateFunc(func: UAnalyGizmoModelCallback): void;
    /**
     * 편집 제어(control) 객체의 월드 위치를 반환합니다. <br>
     * 제어 객체를 제거한 뒤에는 getControlObj 또는 setObject로 다시 준비해야 합니다.
     *
     * @returns {WorldPositionVector3} 월드 좌표(EPSG:3857)의 공유 벡터이며 이후 호출·편집에서 값이 덮어써질 수 있습니다.
     */
    getControlPosition(): WorldPositionVector3;
    /**
     * 중복과 선택된 자손을 제외한 편집 대상 목록을 반환합니다.
     *
     * @returns {Array<import('three').Object3D>} 복사하지 않은 선택 루트 배열
     */
    get target(): Array<three.Object3D>;
    /**
     * 편집 제어(control) 객체를 반환하고 없으면 생성하여 컨트롤에 연결합니다.
     *
     * @returns {GizmoControlObject} 분석이 소유하는 제어 객체의 원본 참조
     */
    getControlObj(): GizmoControlObject;
    /**
     * 편집 범위와 어댑터(adapter) 형상의 교차 정보를 조회합니다. <br>
     * 해제된 형상과 선택 대상의 자손은 제외합니다.
     *
     * @param {import('@union3d/geometry/U3dAdaptedGeometry').U3dAdaptedGeometry} adapter 검사할 형상
     * @returns {UAnalyGizmoModelIntersection | undefined} 형상에서 반환한 교차 정보이며 제외되거나 교차하지 않으면 undefined
     */
    intersectAdapter(adapter: U3dAdaptedGeometry): UAnalyGizmoModelIntersection | undefined;
    /**
     * 여러 어댑터(adapter)의 교차 정보를 거리 오름차순으로 반환합니다.
     *
     * @param {Array<import('@union3d/geometry/U3dAdaptedGeometry').U3dAdaptedGeometry>} adapters 검사할 형상 목록
     * @returns {Array<UAnalyGizmoModelIntersection>} 교차한 항목의 새 배열이며 비유한 거리는 뒤로 배치됩니다.
     */
    intersectAdapters(adapters: Array<U3dAdaptedGeometry>): Array<UAnalyGizmoModelIntersection>;
    /**
     * 편집 제어 객체를 지정한 위치로 이동합니다. <br>
     * 제어 객체를 먼저 준비해야 하며 모델 자체의 변환은 다음 update에서 적용합니다.
     *
     * @param {WorldPositionVector3} position 이동할 월드 좌표(EPSG:3857)
     */
    setManualUpdate(position: WorldPositionVector3): void;
    /**
     * 편집 컨트롤(control)의 원본 참조를 생성 없이 반환합니다.
     *
     * @returns {import('@UGizmoControls').UGizmoControls | undefined} 연결한 컨트롤이며 미생성 또는 제거 후에는 undefined
     */
    getControl(): UGizmoControls | undefined;
    /**
     * 기존 편집 상태를 제거하고 앱의 카메라·입력 요소에 기즈모(Gizmo) 컨트롤을 만듭니다. <br>
     * 앱 연결이 필요하며 새 컨트롤에는 setObject 또는 getControlObj로 제어 객체를 다시 연결합니다.
     */
    createGizmo(): void;
    /**
     * 기즈모(Gizmo) 컨트롤·제어 객체·레이저를 해제하고 선택과 원본 변환 저장값을 비웁니다. <br>
     * 등록한 사용자 콜백은 유지하며 오버레이는 참조만 분리합니다.
     */
    removeGizmo(): void;
    /**
     * 활성 상태에서 편집할 모델을 선택하고 되돌리기에 사용할 원본 변환을 저장합니다. <br>
     * 중복과 선택된 자손은 편집 대상에서 제외하되 제어 중심은 전달한 원래 목록으로 구합니다.
     *
     * @param {Array<import('three').Object3D> | import('three').Object3D} object 편집할 모델 또는 모델 목록
     */
    setObject(object: Array<three.Object3D> | three.Object3D): void;
    /**
     * 선택 대상의 연결 객체와 분석 구독자에게 onChange 이벤트를 전달합니다.
     */
    objectChange(): void;
    /**
     * 저장된 원본 위치·회전·크기로 모델을 되돌리고(reset) 제어 기준을 초기화합니다.
     *
     * @param {Array<import('three').Object3D> | import('three').Object3D} [object] 복구할 모델이며 생략하면 현재 선택 대상
     */
    reset(object?: Array<three.Object3D> | three.Object3D): void;
    /**
     * 편집 위치를 표시할 오버레이(overlay)를 등록합니다.
     *
     * @param {import('@union3d/overlay/U3dOverlay').U3dOverlay} overlay 위치 갱신과 변경 알림을 받을 오버레이
     */
    setOverlay(overlay: U3dOverlay): void;
    /**
     * 등록한 위치 표시 오버레이(overlay)를 반환합니다.
     *
     * @returns {import('@union3d/overlay/U3dOverlay').U3dOverlay | undefined} 등록 객체의 원본 참조이며 미등록이면 undefined
     */
    getOverlay(): U3dOverlay | undefined;
    /**
     * 기즈모(Gizmo)의 위치·회전·크기 편집 모드를 설정합니다.
     *
     * @param {string | number} mode translate 또는 0은 위치, rotate 또는 1은 회전, scale 또는 2는 크기이며 문자열 대소문자는 구분하지 않습니다.
     */
    setMode(mode: string | number): void;
    /**
     * 기즈모(Gizmo)의 편집 모드를 반환하고 컨트롤이 없으면 생성을 시도합니다.
     *
     * @returns {string} translate는 위치, rotate는 회전, scale은 크기 편집이며 조회값이 nullish이면 translate
     */
    getMode(): string;
    /**
     * 보조 레이저(laser)를 장면에서 분리하고 자원을 해제합니다.
     */
    removeLasers(): void;
    /**
     * 편집 위치와 축을 확인할 보조 레이저(laser)를 생성하여 표시합니다.
     */
    showLaser(): void;
    /**
     * 보조 레이저(laser)를 숨기며 객체와 스타일은 유지합니다.
     */
    hideLaser(): void;
    /**
     * 선택한 각 모델의 편집 정보를 앱에 알리고 분석 end 이벤트를 전달합니다.
     */
    onEnd(): void;
    /**
     * 편집 대상 장면(scene) 목록에 장면을 추가하거나 목록을 비웁니다.
     *
     * @param {import('three').Object3D} [scene] 추가할 장면이며 생략하면 목록 초기화
     */
    setTargetScene(scene?: three.Object3D): void;
    /**
     * 편집 대상의 메타데이터를 XML 문서로 반환합니다. <br>
     * 현재 선택 목록을 단일 객체로 읽는 제한이 있어 일반적인 setObject 선택 상태에서는 사용할 수 없습니다.
     *
     * @returns {Document | undefined} XML 문서이며 앱·컨트롤·좌표 변환 문맥이 없으면 undefined
     * @throws {TypeError} 선택 목록에 단일 객체의 변환 속성이 없는 경우
     */
    getMetaXML(): Document | undefined;
    #private;
}

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     *
     * 기즈모 편집 분석의 생성 옵션입니다.
     */
    type UAnalyGizmoModelCO_Content = {
        /**
         * 분석 이름
         */
        name?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     *
     * 기즈모 편집 분석의 생성 옵션입니다.
     */
    type UAnalyGizmoModelCO = Omit<Omit<UAnalyCO, never> & UAnalyGizmoModelCO_Content, never>;

/**
     * ~extends import('three').Object3D <br>
     *
     * 편집 제어(control) 객체가 보관하는 직전 적용 변환입니다.
     */
    type GizmoControlObject_Content = {
        /**
         * 기준 위치
         */
        _basePos: three.Vector3;
        /**
         * 기준 회전
         */
        _baseQuat: three.Quaternion;
        /**
         * 기준 크기
         */
        _baseScl: three.Vector3;
    };

/**
     * ~extends import('three').Object3D <br>
     *
     * 편집 제어(control) 객체가 보관하는 직전 적용 변환입니다.
     */
    type GizmoControlObject = Omit<Omit<three.Object3D, never> & GizmoControlObject_Content, never>;

/**
     * 컨트롤의 상속 멤버를 내부 호출에서 확인하는 구조입니다.
     */
    type UGizmoControlsTC = {
        /**
         * 이벤트 등록
         */
        addEventListener: (arg0: string, arg1: Function) => void;
        /**
         * 이벤트 해제
         */
        removeEventListener: (arg0: string, arg1: Function) => void;
        /**
         * 자원 해제
         */
        dispose: () => void;
        /**
         * 연결한 제어 객체
         */
        object: three.Object3D | undefined;
        /**
         * 편집 모드 조회
         */
        getMode: () => string;
        /**
         * 편집 모드 변경
         */
        setMode: (arg0: string) => void;
        /**
         * 편집 모드
         */
        mode: string;
        /**
         * 선택 축
         */
        axis: string | null;
        /**
         * 편집 이동량
         */
        _offset: three.Vector3;
        /**
         * 이벤트별 리스너 목록
         */
        _listeners: Record<string, Array<Function>>;
        /**
         * 제어 객체 연결
         */
        attach: (arg0: three.Object3D) => UGizmoControls;
        /**
         * 제어 객체 분리
         */
        detach: () => UGizmoControls;
    };

/**
     * 모델 메타데이터의 XML 직렬화 입력입니다.
     */
    type GizmoXmlOption = {
        /**
         * 모델 이름
         */
        name: string;
        /**
         * 모델 제목
         */
        title: string | undefined;
        /**
         * 위치
         */
        location: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 회전
         */
        rotation: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 크기
         */
        scale: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 경계 박스
         */
        box: {
            min: {
                x: number;
                y: number;
                z: number;
            };
            max: {
                x: number;
                y: number;
                z: number;
            };
        };
    };

/**
     * 보조 레이저(laser)에 적용할 스타일입니다.
     */
    type UAnalyGizmoModelLaserStyle = {
        /**
         * 표시 색상
         */
        color?: three.Color | string | number;
        /**
         * 0~1로 제한하여 적용할 불투명도
         */
        opacity?: number;
        /**
         * 두께 배율이며 0·NaN은 1, 음수는 0.001로 대체됩니다.
         */
        radius?: number;
    };

/**
     * 편집 대상과 어댑터(adapter)의 교차 정보입니다.
     */
    type UAnalyGizmoModelIntersection = {
        /**
         * 어댑터가 계산한 교차 거리
         */
        distance: number;
        /**
         * 교차한 형상
         */
        object: U3dAdaptedGeometry;
    };

/**
     * 편집 갱신 또는 종료 시 실행하는 사용자 콜백입니다. <br>
     * this와 self는 분석 인스턴스이며 target은 선택 루트 배열입니다. <br>
     * controlObj는 편집 제어 객체로 제거 후에는 undefined이며 controlBound는 현재 편집 경계입니다. <br>
     * 예외는 호출자에게 전파되며 전달한 객체와 목록은 복사하지 않습니다.
     */
    type UAnalyGizmoModelCallback = (this: UAnalyGizmoModel, self: UAnalyGizmoModel, target: Array<three.Object3D>, controlObj: undefined | GizmoControlObject, controlBound: three.Box3) => void;

/**
     * 선택 경계 계산에서 읽는 대상의 추가 기능입니다.
     */
    type UAnalyGizmoModelBoundTarget = Omit<Omit<three.Object3D, never> & Partial<{
        isAdapter: boolean;
        getBoundingBox: () => three.Box3;
        getBBox: () => three.Box3;
        geometry: three.BufferGeometry;
    }>, never>;

/**
     * 보조 레이저의 표시 객체와 방향입니다.
     */
    type UAnalyGizmoModelLaser = {
        /**
         * 축 표시 메시
         */
        mesh: UMesh;
        /**
         * 축 방향
         */
        axis: three.Vector3;
    };

export type { GizmoControlObject, GizmoControlObject_Content, GizmoXmlOption, UAnalyGizmoModel, UAnalyGizmoModelBoundTarget, UAnalyGizmoModelCO, UAnalyGizmoModelCO_Content, UAnalyGizmoModelCallback, UAnalyGizmoModelIntersection, UAnalyGizmoModelLaser, UAnalyGizmoModelLaserStyle, UGizmoControlsTC };
