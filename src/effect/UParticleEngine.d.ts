// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dVectorShaderLayer } from "../2dLayer/U2dVectorShaderLayer.js";
import type { UScene } from "../core/UScene.js";
import type { UParticle } from "./UParticle.js";
import type { UParticleEngineParam } from "./UParticleEngine.types.js";

/**
 * @classdesc
 * GeOnDT `ParticleEngine` 객체 클래스
 * @summary `확산, 바람길, 오염, 눈, 비` 객체 클래스
 * @memberOf GeOnDT.effect
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/spreadOfObject.html}
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulation.html}
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulationKorea.html}
 * @constructor
 * @param {GeOnDT.U3dApp} app 형상화 주체 U3dApp 객체
 * @see GeonDT.analysis.UAnalyParticle
 * @example
 * let engine = new UParticleEngine(app);
 *
 * @property {number} [positionStyle=1] 생성 Type, 생성시 Type 으로 설정 된 값 (초기값 : TYPE.CUBE = 1) `{"CUBE": 1, "SPHERE": 2, "WIND": 3, "GRID": 4}`
 * @property {WorldPosition} positionBase 위치 값
 * @property {Vector3} positionSpread 위치 범위 값
 * @property {number} positionRadius `positionStyle: TYPE.SPERE = 2`으로 생성 시의 위치 범위 값
 * @property {number} velocityStyle 속도 및 방향 Type `{"CUBE": 1, "SPHERE": 2, "WIND": 3, "GRID": 4}`
 * @property {Vector3} velocityBase 초기 속도 및 방향
 * @property {Vector3} velocitySpread 초기 속도 및 방향 범위
 * @property {number} speedBase `velocityStyle: TYPE.SPERE = 2`으로 생성 시 초기 속도
 * @property {number} speedSpread `velocityStyle: TYPE.SPERE = 2`으로 생성 시 초기 속도 범위
 * @property {Vector3} accelerationBase 초기 가속도
 * @property {Vector3} accelerationSpread 초기 가속도 범위
 * @property {number} angleBase 초기 회전 값
 * @property {number} angleSpread 초기 회전 범위 값
 * @property {number} angleVelocityBase 초당 회전 값
 * @property {number} angleVelocitySpread 초당 회전 범위 값
 * @property {number} angleAccelerationBase 초당 회전 가속도 값
 * @property {number} angleAccelerationSpread 초당 회전 가속도 범위 값
 *
 * @property {number} sizeBase 초기 크기
 * @property {number} sizeSpread 초기 크기 범위
 * @property {Object.XTween} sizeTween 시간대별 크기의 값의 정보를 담고 있는 객체 `설정시 sizeBase, sizeSpread 무시`
 *
 * @property {Vector3} colorBase 초기 색상 값 (HSL format)
 * @property {Vector3} colorSpread 초기 색상 범위 (HSL format)
 * @property {Object.XTween} colorTween 시간대별 색상의 값의 정보를 담고 있는 객체 `설정시 colorBase, colorSpread 무시`
 *
 * @property {number} opacityBase 초기 투명도
 * @property {number} opacitySpread 초기 투명도 범위
 * @property {Object.XTween} opacityTween 시간대별 투명도의 값의 정보를 담고 있는 객체 `설정시 opacityBase, opacitySpread 무시`
 *
 * @property {number} blendStyle blending style
 * @property {array[]} particleArray UParticle 객체를 담고 있는 배열
 * @property {number} particlesPerSecond 초당 UParticle 객체 생성 수량
 * @property {number} particleDeathAge UParticle 객체 생명주기 (재생성 주기)
 * @property {number} emitterAge 순환주기 수치
 * @property {boolean} emitterAlive 순환주기 실행 여부
 * @property {number} emitterDeathAge 순환주기 종료 시간
 * @property {number} particleCount 전체 UParticle 객체 수량 (particlesPerSecond * Math.min(particleDeathAge,emitterDeathAge))

 * @property {boolean} isStop 업데이트 정지 여부
 * @property {boolean} setDynamic 카메라 위치 기반 생성 여부 ( 동적 생성 )
 * @property {number} speed 속도
 * @property {number} height 높이
 */
declare class UParticleEngine {
    constructor(app: any);
    _app: any;
    _scene: any;
    positionStyle: 1;
    positionBase: three.Vector3;
    positionSpread: three.Vector3;
    positionRadius: number;
    velocityStyle: 1;
    velocityBase: three.Vector3;
    velocitySpread: three.Vector3;
    speedBase: number;
    speedSpread: number;
    accelerationBase: three.Vector3;
    accelerationSpread: three.Vector3;
    angleBase: number;
    angleSpread: number;
    angleVelocityBase: number;
    angleVelocitySpread: number;
    angleAccelerationBase: number;
    angleAccelerationSpread: number;
    sizeBase: number;
    sizeSpread: number;
    sizeTween: any;
    colorBase: three.Vector3;
    colorSpread: three.Vector3;
    colorTween: any;
    opacityBase: number;
    opacitySpread: number;
    opacityTween: any;
    blendStyle: 1;
    particleArray: any[];
    particlesPerSecond: number;
    particleDeathAge: number;
    _recycleIndices: any[];
    emitterAge: number;
    emitterAlive: boolean;
    emitterDeathAge: number;
    particleCount: number;
    _windData: any;
    _shpExtentsLayer: U2dVectorShaderLayer;
    _extents: number[][];
    _setExtent: boolean;
    _segments: number;
    _zAxis: three.Vector3;
    _yAxis: three.Vector3;
    _point: any;
    _tempBbox: three.Box3;
    _cacheMask: {};
    _raycast: any;
    _isUpdated: boolean;
    isStop: boolean;
    _requestList: any[];
    _timerList: any[];
    _timerEtcList: any[];
    setDynamic: boolean;
    setEffect: boolean;
    speed: number;
    height: number;
    particleGeometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>;
    particleTexture: any;
    particleMaterial: three.ShaderMaterial;
    _particlePositionOrigin: three.Vector3;
    particleMesh: three.Points<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap>;
    particle: UParticle;
    _extentBox: any;
    setExtentBox(box: any): void;
    getExtentBox(): any;
    /**
     * particle을 입력한 속성 값으로 설정 하는 함수
     *
     * @param {UParticleEngineParam} parameters 속성값을 담은 객체
     */
    setValues(parameters: UParticleEngineParam): void;
    /**
     * 바람길 객체의 particle을 입력한 속성 값으로 설정 하는 함수
     *
     * @param {UParticleEngineParam} parameters 파티클 옵션. `position`은 초기 위치이며, 설정한 영역을 벗어난 파티클은 이 위치를 기준으로 다시 무작위 배치됩니다
     * @param {object} windData 바람 데이터
     * @param {object} extents 영역 좌표
     */
    setWindValues(parameters: UParticleEngineParam, windData: object, extents: object): void;
    _oriWindData: any;
    _extentsBbox: three.Box3;
    /**
     * 기준값에서 범위 값 내의 무작위 값을 반환
     * @param {number} base 기준값
     * @param {number} spread 범위값
     * @return {number} 기준값에서 범위 값 내의 무작위 값
     */
    randomValue(base: number, spread: number): number;
    /**
     * 기준 Vector3 값에서 범위 값내의 무작위 값을 반환
     * @param {import('three').Vector3} base 기준 Vector3 값
     * @param {import('three').Vector3} spread 범위 Vector3 값
     * @return {import('three').Vector3} 기분 Vector3 값에서 범위 값내의 무작위 값 반환
     */
    randomVector3(base: three.Vector3, spread: three.Vector3): three.Vector3;
    /**
     * particle 객체를 생성하는 함수
     * UParticleEngine.setValues(parameters) 를 통해서 설정된 값으로 생성
     * @return {import('@UParticle').UParticle} 기본 UParitcle 객체
     */
    createParticle(): UParticle;
    /**
     * 바람길 particle 객체를 생성하는 함수
     * UParticleEngine.setWindValues(parameters) 를 통해서 설정된 값으로 생성
     * @return {import('@UParticle').UParticle} 바람길 UParitcle 객체
     */
    createWindParticle(pos: any, vel: any, data: any): UParticle;
    /**
     * particleMesh를 만들기 위한 작업을 하는 함수 <br>
     * 내부적으로 createParticle() 호출
     */
    initialize(): UParticleEngine;
    /**
     * particleMesh를 만들기 위한 작업을 하는 함수
     * 내부적으로 createWindParticle() 호출
     * @param  {number | undefined} segments 데이터 세분화 정도. 기본값 1
     * @param  {number} height 데이터 높이 설정
     * @return {import('@UParticleEngine').UParticleEngine} 초기 설정된 UParticleEngine 객체
     */
    initializeWind(segments: number | undefined, height: number): UParticleEngine;
    customVisible: Float32Array<ArrayBuffer>;
    customColor: Float32Array<ArrayBuffer>;
    customOpacity: Float32Array<ArrayBuffer>;
    customSize: Float32Array<ArrayBuffer>;
    customAngle: Float32Array<ArrayBuffer>;
    _zoomLevel: any;
    _prePosition: any;
    /**
     * particle의 update 동작을 실행하는 함수
     */
    setStart(): void;
    /**
     * particle의 update를 정지하는 함수
     */
    setStop(): void;
    /**
     * particle update 함수
     * @param  {number} dt clock의 delta 값
     */
    update(dt: number): void;
    /**
     * 바람길 particle update 함수
     * @param  {number} dt clock의 delta 값
     */
    updateWind(dt: number): void;
    /**
     * particle mesh visible 여부 반환 함수
     * @return {boolean} particle 객체 가시화 여부
     * */
    isShow(): boolean;
    /**
     * particle mesh visible 여부 설정 함수
     * @param {boolean} show - 가시화 여부 설정 값
     * */
    show(show: boolean): void;
    /**
     * particle 형상 제거 함수
     *
     * @param {import('@UScene').UScene} [scene] 형상을 제거할 scene. 생략하면 생성 시 설정된 scene
     */
    destroy(scene?: UScene): void;
    /**
     * 입력 받은 shapeLayer를 통해 2d vector 영역으로 wind Particle의 생성 범위값 설정
     * @param {import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayer} shpLayer 영역 생성시 사용한 2D vector shader 레이어 객체
     */
    setShpExtents(shpLayer: U2dVectorShaderLayer): void;
    /**
     * 입력 받은 particle 객체에 mask 객체를 저장하는 함수
     * this._caacheMask에 설정한 mask 저장
     * @param {import('@UParticle').UParticle} particle mask를 설정한 particle 객체
     * @param {object} mask particle에 전달할 mask 객체
     */
    setMask(particle: UParticle, mask: object): void;
    /**
     * MaskSearchType를 반환하는 함수
     * @return {number} (1 : base, 2 : raycast)
     */
    getMaskSearchType(): number;
    /**
     * MaskSearchType를 설정하는 함수
     * @param {string|number} val MaskSearchType을 설정하는 함수 ( base : 'base' || 1, raycast : 'raycase' || 2 )
     */
    setMaskSearchType(val: string | number): string | number;
    maskSearchType: string | number;
    /**
     * 범례 색상 지정 함수
     * @param {function} func 범례 지성 함수
     */
    setLegend(func: Function): void;
    /**
     * 바람길 타입으로 생성시 카메라 위치에 동적으로 생성 설정값 (setDynamic - true 일 경우 동작)
     * @param {object} options 동적 생성시 설정값
     * @param {number} options.segments 초기 세분화 정도
     * @param {number} options.speed 초기 속도 임계값
     * @param {number} options.height 초기 높이
     * @param {number} options.sizeBase 초기 크기
     */
    setDynamicParameter(options: {
        segments: number;
        speed: number;
        height: number;
        sizeBase: number;
    }): void;
    /**
     * 바람길 타입으로 생성시 카메라 위치 기반 영역을 반영하여 갱신 하는 함수 (zoomlevel과 관련)
     */
    getExtentsBoxByPosition(): void;
    setOriginExtentBox(): void;
    _oriExtentsBox: three.Box3;
    /**
     * uniform 속성으로 설정될 값을 초기 선언해주는 함수
     * @ignore
     */
    initBuffer(): void;
    setBufferAttribute(attributes: any): void;
    setRepeatActivate(dt: any): void;
    setParticleUpdate(geometry: any, dt: any): void;
    /**
     * UParticle 객체를 생성 후 반환하는 함수
     * @return {import('@UParticle').UParticle} 개별적인 particle 속성을 담고 있는 객체
     */
    createParticleObject(): UParticle;
    createXTween(timeArray: any, valueArray: any): any;
    createArrowHelper(dir: any, center: any, length: any, color: any, headLength: any, headWidth: any): any;
}

export type { UParticleEngine };
