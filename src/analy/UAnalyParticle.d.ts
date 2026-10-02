// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dMaskLayer } from "../3dLayer/U3dMaskLayer.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UClock } from "../core/UClock.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UParticleEngine } from "../effect/UParticleEngine.js";
import type { Double_Array } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `파티클 분석` 클래스
 * @group analysis
 * @extends UAnaly
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulation.html}
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulationKorea.html}
 */
declare class UAnalyParticle extends UAnaly {
    /**
     * @param {UAnalyParticleCO} [opt={}]
     */
    constructor(opt?: UAnalyParticleCO);
    /** @type {string} */ name: string;
    /** @type {string} */ BASE_TYPE: string;
    /** @type {string} */ WIND_TYPE: string;
    /** @type {string} */ GRID_TYPE: string;
    /**
     * @type {import('@union3d/core/UClock').UClock}
     *
     * @ignore
     */
    _clock: UClock;
    /**
     * @type {Array<UAnalyParticleCO>}
     *
     * @ignore
     */
    _options: Array<UAnalyParticleCO>;
    /**
     * @type {Array<import('@union3d/effect/UParticleEngine').UParticleEngine>}
     *
     * @ignore
     */
    _particles: Array<UParticleEngine>;
    /**
     * @type {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer | undefined}
     *
     * @ignore
     */
    _maskLayer: U3dMaskLayer | undefined;
    /**
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _extentBox: three.Box3 | undefined;
    /**
     * @type {import('three').Group | undefined}
     *
     * @ignore
     */
    _helperGroup: three.Group | undefined;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId: string | undefined;
    /** @type {Array<unknown>} */ grid: Array<unknown>;
    /** @type {Array<unknown>} */ resultGrid: Array<unknown>;
    /** @type {import('three').Vector3 | undefined} */ position: three.Vector3 | undefined;
    /**
     * 범위 박스를 설정하는 함수
     * @param {import('three').Box3} box 설정할 Box3 범위 객체
     */
    setExtentBox(box: three.Box3): void;
    /**
     * 범위 박스를 반환하는 함수
     * @return {import('three').Box3 | undefined}
     */
    getExtentBox(): three.Box3 | undefined;
    /**
     * particle 초기 생성 함수
     * @param {UAnalyParticleCO} opt particle의 속성값
     * @return {import('@union3d/effect/UParticleEngine').UParticleEngine | undefined}
     *
     * @example
     *
     * opt = {
     *   name: name, // 확산객체 여러개일 경우 검색시에 필요
     *   position: {x:0, y: 0,z: 0}, // type - 'grid' 일 경우  data의 originX, originY 기준으로 생성 / 불필요
     *   positionSpread: {x:0, y: 0,z: 0},
     *   velocityBase: {x:0, y: 0,z: 0},
     *   velocitySpread: {x:0, y: 0,z: 0},
     *   acceleration: {x:0, y: 0,z: 0},
     *   angleBase: 0,
     *   angleSpread: 180,
     *   angleVelocityBase: 0,
     *   angleVelocitySpread: 15,
     *   particleImage: dataUrl + 'cloud1.png',
     *   opacityTween: [[0, 5, 20], [0.1, 0.5, 0.0]],
     *   colorTween: [[0, 20], [0xd73027, 0xffffbf]],
     *   sizeTween: [[0, 5, 20], [10, 80, 250]],
     *   particlesPerSecond: 500,
     *   particleDeathAge: 20.0,
     *   emitterDeathAge: 1000000,
     *   type : 'grid',
     *   gridMode: 'spread',
     *   gridBoxMaxHeight: 1000,
     *   arrowLength: 10
     * }
     */
    initialize(opt: UAnalyParticleCO): UParticleEngine | undefined;
    /**
     * name 값을 입력 받아 particle 반환하는 함수
     * @param {string} name particle 객체 이름
     * @return {import('@union3d/effect/UParticleEngine').UParticleEngine | undefined} particle 객체
     */
    getParticleByName(name: string): UParticleEngine | undefined;
    /**
     * name 값을 입력 받아 particle 제거하는 함수
     * @param {string} name particle 객체 이름
     * @param {boolean} [_suppress] 내부 호출용 (미사용)
     */
    removeParticleByName(name: string, _suppress?: boolean): void;
    /**
     * particle 전체 제거 함수
     */
    removeAllParticle(): void;
    /**
     * opt 속성값을 참조하여 maskLayer를 통해 mask를 생성하는 함수
     * @param {UAnalyParticleMaskOption} opt mask 생성에 필요한 속성값 object
     * @return {Promise<void>}
     *
     * @example
     * opt = {
     *   level: 17,        // 생성 level
     *   name: "MaskLayer", // layer 이름
     *   height: 20,       // mask value 최소 높이
     *   useForceLoad: true,
     *   forceLoadVisible: true,
     *   modelExtents: modelExtents,
     *   infoLayer: window.modelLayer
     * }
     */
    createMask(opt: UAnalyParticleMaskOption): Promise<void>;
    /**
     * maskLayer를 직접 설정하는 함수
     * @param {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer} layer 설정할 U3dMaskLayer 객체
     */
    setMaskLayer(layer: U3dMaskLayer): void;
    /**
     * 파티클 분석모드에서 mask Layer 반환 하는 함수
     * @return {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer | undefined} U3dMaskLayer
     */
    getMaskLayer(): U3dMaskLayer | undefined;
    /**
     * particle 객체 update 시작 대상 이름 또는 index
     * @param {string} name 대상 이름
     * @param {number} idx 대상 번호
     */
    setStart(name: string, idx: number): void;
    /**
     * particle 객체 update 정지 대상 이름 또는 index
     * @param {string} name 대상 이름
     * @param {number} idx 대상 번호
     */
    setStop(name: string, idx: number): void;
    #private;
}

/**
     * 확장 메서드를 포함하는 문자열 타입
     */
    type ExtString = string & {
        equalIgnoreCase: (str: string) => boolean;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 파티클 생성 옵션
     */
    type UAnalyParticleCO_Content = {
        /**
         * 타입 ('base' | 'wind' | 'grid')
         */
        type?: string;
        /**
         * 확산객체 이름
         */
        name?: string;
        /**
         * 파티클 생성 위치
         */
        position?: three.Vector3;
        /**
         * 생성 위치 무작위 범위
         */
        positionSpread?: three.Vector3;
        /**
         * 초기 속도 및 방향
         */
        velocityBase?: three.Vector3;
        /**
         * 초기 속도 범위
         */
        velocitySpread?: three.Vector3;
        /**
         * 가속도 및 방향
         */
        acceleration?: three.Vector3;
        /**
         * 초기 색상
         */
        colorBase?: three.Vector3;
        /**
         * 색상 범위
         */
        colorSpread?: three.Vector3;
        /**
         * 회전 초기값
         */
        angleBase?: number;
        /**
         * 회전각도 범위
         */
        angleSpread?: number;
        /**
         * 초기 회전 속도
         */
        angleVelocityBase?: number;
        /**
         * 초기 회전 속도 범위
         */
        angleVelocitySpread?: number;
        /**
         * 텍스쳐 이미지 경로
         */
        particleImage?: string;
        /**
         * 초당 생성 갯수
         */
        particlesPerSecond?: number;
        /**
         * 생명 주기 (초)
         */
        particleDeathAge?: number;
        /**
         * 생성 유지 시간 (초)
         */
        emitterDeathAge?: number;
        /**
         * 초기 투명도
         */
        opacityBase?: number;
        /**
         * 투명도 범위
         */
        opacitySpread?: number;
        /**
         * 투명도 설정 [[timeArray],[valueArray]]
         */
        opacityTween?: [Array<number>, Array<number>];
        /**
         * 색상 설정 [[timeArray],[colorHexArray]]
         */
        colorTween?: [Array<number>, Array<number>];
        /**
         * 초기 크기
         */
        sizeBase?: number;
        /**
         * 크기 범위
         */
        sizeSpread?: number;
        /**
         * 크기 설정 [[timeArray],[sizeArray]]
         */
        sizeTween?: [Array<number>, Array<number>];
        /**
         * 범례 설정 함수
         */
        legend?: () => void;
        /**
         * 바람 데이터 (type:'wind' 필수)
         */
        windData?: object;
        /**
         * 데이터 세분화 정도 (type:'wind')
         */
        segments?: number;
        /**
         * 범위 [[minX,minY],[maxX,maxY]] (type:'wind')
         */
        extents?: Double_Array<number>;
        /**
         * 파티클 기본 최저 높이 (type:'wind')
         */
        height?: number;
        /**
         * 오염도 정보 목록 (type:'grid' 필수)
         */
        data?: Array<object>;
        /**
         * 확산 모드 ('spread'|'grid', type:'grid')
         */
        gridMode?: string;
        /**
         * 격자 Box 최대 높이 (type:'grid')
         */
        gridBoxMaxHeight?: number;
        /**
         * arrow Helper 길이 (type:'grid')
         */
        arrowLength?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 파티클 생성 옵션
     */
    type UAnalyParticleCO = Omit<Omit<UAnalyCO, never> & UAnalyParticleCO_Content, never>;

/**
     * createMask 옵션
     */
    type UAnalyParticleMaskOption = {
        /**
         * 생성 레벨
         */
        level?: number;
        /**
         * 레이어 이름
         */
        name?: string;
        /**
         * mask value 최소 높이
         */
        height?: number;
        /**
         * forceLoadModel 사용 여부
         */
        useForceLoad?: boolean;
        /**
         * forceLoadModel 타일 가시화 여부
         */
        forceLoadVisible?: boolean;
        /**
         * forceLoadModel 범위
         */
        modelExtents?: {
            minx: number;
            miny: number;
            maxx: number;
            maxy: number;
        };
        /**
         * Load Model Layer 및 mask Value 참조 Layer
         */
        infoLayer?: object;
        /**
         * 범위 [minX, minY, maxX, maxY]
         */
        extent?: Array<number>;
        /**
         * drawArg
         */
        drawarg?: UDrawArg;
        /**
         * 가시화 여부
         */
        visible?: boolean;
    };

/**
     * ~extends UParticleEngine <br>
     * name·addon 메서드를 포함한 UParticleEngine 확장 타입
     */
    type UParticleEngineEx_Content = {
        /**
         * 파티클 이름
         */
        name?: string | undefined;
        /**
         * 카메라 추적 여부
         */
        useTraceCamera?: boolean;
        /**
         * 동적 파티클 여부
         */
        setDynamic?: boolean;
        /**
         * 동적 파라미터 설정
         */
        setDynamicParameter?: (arg0: UAnalyParticleCO) => void;
        /**
         * 원본 범위 박스 설정
         */
        setOriginExtentBox?: () => void;
        /**
         * 위치 기반 범위 박스 반환
         */
        getExtentsBoxByPosition?: () => void;
        /**
         * 마스크 설정
         */
        setMask?: (arg0: object, arg1: object) => void;
    };

/**
     * ~extends UParticleEngine <br>
     * name·addon 메서드를 포함한 UParticleEngine 확장 타입
     */
    type UParticleEngineEx = UParticleEngine & UParticleEngineEx_Content;

type QuadtreeItem = {
        /**
         * 타일 타입 반환
         */
        getType: () => string;
        /**
         * 최대 레벨 반환
         */
        getMaxLevel: () => number;
        /**
         * 최대 레벨 설정
         */
        setMaxLevel: (arg0: number) => void;
    };

export type { ExtString, QuadtreeItem, UAnalyParticle, UAnalyParticleCO, UAnalyParticleCO_Content, UAnalyParticleMaskOption, UParticleEngineEx, UParticleEngineEx_Content };
