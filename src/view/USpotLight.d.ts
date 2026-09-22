// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UScene } from "../core/UScene.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { Degree, WorldPosition } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";
import type { U3dView } from "./U3dView.js";

type LightAnalyOption = {
    /**
     * 분석 Mesh 색상
     */
    color?: three.ColorRepresentation;
    /**
     * 분석 Mesh 투명도
     */
    opacity?: number;
    /**
     * 분석 타입 `Cone` : 3차원 콘 `viewCone` : 2차원 뷰콘
     */
    type?: string;
    /**
     * 분석 Mesh 최대 거리
     */
    distance?: number;
    /**
     * 너비 세그먼트 ( 클수록 촘촘한 분석 Mesh가 생성되지만 분석 시간이 많이 소요됨)
     */
    widthSegment?: number;
    /**
     * 방위각
     */
    azimuth?: number;
    /**
     * start 지점에서 생성할 Mesh 까지의 offset 값
     */
    startOffset?: number;
    /**
     * 분석 시작 지점
     */
    start?: three.Vector3;
    /**
     * 분석 종료 지점
     */
    end?: three.Vector3;
    /**
     * 대상 컴포넌트
     */
    componenet?: U3dComponentPosition;
};

/**
 * @typedef {object} LightAnalyOption
 * @property {import('three').ColorRepresentation} [color="#f25f5c"] 분석 Mesh 색상
 * @property {number} [opacity=1]  분석 Mesh 투명도
 * @property {string} [type="Cone"] 분석 타입 `Cone` : 3차원 콘 `viewCone` : 2차원 뷰콘
 * @property {number} [distance] 분석 Mesh 최대 거리
 * @property {number} [widthSegment=100] 너비 세그먼트 ( 클수록 촘촘한 분석 Mesh가 생성되지만 분석 시간이 많이 소요됨)
 * @property {number} [azimuth=45] 방위각
 * @property {number} [startOffset=0] start 지점에서 생성할 Mesh 까지의 offset 값
 * @property {import('three').Vector3} [start] 분석 시작 지점
 * @property {import('three').Vector3} [end] 분석 종료 지점
 * @property {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} [componenet] 대상 컴포넌트
 */
/**
 * `광원` 클래스. 광원(SpotLight)를 생성, 삭제하고 편집하는 기능을 제공합니다.
 * @example
 *  const light = new Union3D.view.USpotLight({
 *      name     : name,
 *      drawarg  : app._drawArg,
 *      position : lonlat,
 *      color    :  0xffffff,
 *      grounGap : grounGap,
 *      visibleLabel : false,
 *      useHelperObj : true,
 *      visibleHelperObj : true,
 *      objRadius : 2
 *  })
 */
declare class USpotLight extends three.SpotLight {
    constructor(opt: any);
    _drawArg: any;
    _scene: any;
    _id: any;
    grounGap: any;
    view: U3dView;
    left: any;
    _intensityValue: number;
    _intensity: any;
    _initPosition: three.Vector3;
    _changingPosition: three.Vector3;
    _initRotation: three.Euler;
    _changingRotation: three.Euler;
    visibleLabel: any;
    useHelperObj: any;
    visibleHelperObj: any;
    objRadius: any;
    lightHelper: three.SpotLightHelper;
    _viewBox: any;
    _useBHV: any;
    /**
     * @returns {import('three').Vector3}
     */
    getChangingPos(): three.Vector3;
    /**
     * 광원을 app에 세팅하는 함수
     * @param {import('@U3dApp').U3dApp} app app
     */
    setApp(app: U3dApp): void;
    _app: U3dApp;
    _lightGroup: any;
    poi: any;
    /**
     * 광원 분석을 종료하고 분석 Mesh를 제거하는 함수
     */
    removeMesh(): void;
    raycast(): void;
    /**
     * 광원에 카메라 뷰를 설정하는 함수
     * @param {import('@U3dView').U3dView} view 카메라 뷰
     */
    setView(view: U3dView): void;
    /**
     * 광원의 카메라뷰를 반환하는 함수
     * @return {import('@U3dView').U3dView} 카메라 뷰
     */
    getView(): U3dView;
    /**
     * 광원에 이미 카메라뷰가 존재하는지 검사하는 함수
     * @return {boolean} 카메라뷰 존재 여부
     */
    isDefinedView(): boolean;
    isDefindeView(): void;
    /**
     * 광원의 위치를 반환하는 함수
     * @return {import('three').Vector3} 광원의 위치 Vector 좌표
     */
    getPosition(): three.Vector3;
    /**
     * 광원 Control Object에 하이라이트 효과를 주거나 제거하는 함수
     * @param {boolean} isHighlight 하이라이트 효과 여부
     */
    highlight(isHighlight: boolean): void;
    /**
     * 광원의 Control Object를 제거하는 함수
     */
    disposeControlObj(): void;
    _controlObj: UMesh;
    /**
     * 광원에 이름 라벨을 설정하는 함수
     * @param {object} opt 라벨 POI 생성 옵션
     * @param {WorldPosition} [opt.position=USpotLight.position] 라벨 POI 위치
     * @param {string} [opt.label=USpotLight.name] 라벨 POI 텍스트
     * @param {object} [opt.image] 라벨 POI 이미지
     * @example
     * light.setLabel({
     *      position : {x: -212131.5349518119, y: 103306.8311699233, z: 2},
     *      label : 'light_1'
     * });
     */
    setLabel(opt: {
        position?: WorldPosition;
        label?: string;
        image?: object;
    }): void;
    /**
     * 광원 라벨을 갱신하는 함수
     * @param {object} [opt={}] 라벨 POI 생성 옵션
     * @param {WorldPosition} [opt.position=USpotLight.position] 라벨 POI 위치
     * @param {string} [opt.label=USpotLight.name] 라벨 POI 텍스트
     * @param {object} [opt.image] 라벨 POI 이미지
     * @example
     * light.updateLabel({
     *      position : {x: -212131.5349518119, y: 103306.8311699233, z: 2},
     *      label : 'new_light_1'
     * });
     */
    updateLabel(opt?: {
        position?: WorldPosition;
        label?: string;
        image?: object;
    }): void;
    /**
     * 광원 라벨을 가시화(show)하는 함수
     */
    showLabel(): void;
    /**
     * 광원 라벨을 비가시화(hide)하는 함수
     */
    hideLabel(): void;
    /**
     * 광원 색상을 설정하는 함수
     * @param {import('three').Color} color 색상
     */
    setColor(color: three.Color): void;
    /**
     * 광원의 세기(Intensity)를 지정하는 함수
     * @param {number} intensity 광원 세기값
     */
    setIntensity(intensity: number): void;
    /**
     * 광원의 위치를 설정하는 함수
     * @param {WorldPosition} position 광원의 위치 Vector 좌표
     */
    setPosition(position: WorldPosition): void;
    /**
     * 광원의 위치를 초기 생성 위치로 초기화 하는 함수
     */
    resetPosition(): void;
    /**
     * 광원의 사이각(angle)을 지정하는 함수
     * @param {Degree} angle 광원 사이각
     */
    setAngle(angle: Degree): void;
    /**
     * 광원의 최대 거리(distance)를 지정하는 함수
     * @param {number} distance 광원 최대거리
     */
    setDistance(distance: number): void;
    /**
     * 광원 가시선 가시화/비가시화 함수
     * @param {boolean} visible 광원 가시화 여부
     */
    showHelper(visible: boolean): void;
    /**
     * 광원의 상하 회전각을 반환하는 함수
     * @return {Degree} 광원의 상하 회전각 (degree)
     */
    getRotationUp(): Degree;
    /**
     * 광원 상하 각을 회전시키는 함수
     * @param {Degree} degUp 상하 각
     */
    setRotationUp(degUp: Degree): void;
    /**
     * 광원의 좌우 회전각을 반환하는 함수
     * @return {Number} 광원의 좌우 회전각 (degree)
     */
    getRotationLeft(): number;
    /**
     * 광원 좌우 각을 회전시키는 함수
     * @param {Degree} degLeft 좌우 각
     */
    setRotationLeft(degLeft: Degree): void;
    /**
     * 광원의 타겟 정보를 갱신하는 함수
     *
     * 이 메서드는 아래 USpotLight.prototype.updateLightTarget 대입으로 덮여 실제로는
     * 호출되지 않는다. 같은 이름이 문서에 두 번 나오지 않도록 문서에서 뺀다.
     * 두 정의를 하나로 합치는 정리는 동작에 영향이 있어 여기서 하지 않는다.
     * @ignore
     */
    updateLightTarget(light: any): void;
    /**
     * 광원이 닿는 범위를 분석하여 Mesh로 가시화 하는 함수
     * @param {LightAnalyOption} options
     * @example
     * light.analysisLight({
     *      color: "#f25f5c",
     *      opacity: 0.5,
     *      type: "Cone",
     *      widthSegment: 100
     * })
     */
    analysisLight(options?: LightAnalyOption): DeferredObject<unknown>;
    setShadow(enabled?: boolean): void;
    /**
     * 광원의 생성 파라미터(Parameter)를 반환하는 함수
     * @return {object}
     * @example
     * return {
     *             position: {x: 126.93786956148061, y: 37.518937873241825, z: 5.684341886080802e-14},
     *             grounGap : 2,
     *             up: 90,
     *             left: 0,
     *             angle: 0.39269908169872414,
     *             penumbra: 0.1,
     *             decay: 2,
     *             distance: 250,
     *             color: "#ff0202",
     *             visibleLabel : false,
     *             useHelperObj: true,
     *             objRadius : 5
     *         }
     */
    getParam(): object;
    /**
     * 광원의 Control Object를 설정하는 함수
     * @param {Number} radius Control Object 반지름
     */
    setControlObj(radius: number): void;
    /**
     * 광원의 ControlObj를 가시화(show)하는 함수
     */
    showControlObj(): void;
    /**
     * 광원의 ControlObj를 비가시화(hide)하는 함수
     */
    hideControlObj(): void;
    /**
     * 광원의 회전을 초기화하는 함수
     * @param {number} [left] 좌우 각
     * @param {number} [up] 상하 각
     */
    resetRotation(left?: number, up?: number): void;
    /**
     * 광원의 이름(name)을 반환하는 함수
     * @return {String} 광원 이름
     */
    getName(): string;
    /**
     * 광원의 화면(scene)을 반환하는 함수
     * @return {import('@UScene').UScene} 광원 Scene
     */
    getScene(): UScene;
    /**
     * Gizmo UI를 제거하는 함수
     */
    removeGizmoUI(): void;
    /**
     * 광원을 초기화하는 함수
     */
    reset(): void;
    /**
     * 광원에 Gizmo 모드를 설정하는 함수
     * @param {Boolean} state Gizmo 작업 상태
     * @param {String} mode Gizmo 모드 `translate` `rotate`
     */
    edit(state: boolean, mode: string): void;
    #private;
}

export type { LightAnalyOption, USpotLight };
