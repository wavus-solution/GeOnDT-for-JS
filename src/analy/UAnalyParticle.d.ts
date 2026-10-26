// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
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
 *
 * 파티클의 생성·프레임 갱신과 모델 마스크를 관리하는 분석 클래스입니다. <br>
 * 앱에 연결한 뒤 initialize()로 엔진을 만들고 active()로 갱신을 활성화합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulation.html}
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulationKorea.html}
 */
declare class UAnalyParticle extends UAnaly {
    /**
     * UAnalyParticle 클래스 생성자입니다. <br>
     * 정본 키로 전달한 옵션의 type이 undefined이면 원본에 기본값을 보완하며 앱 연결은 별도로 수행합니다.
     *
     * @param {UAnalyParticleCO} [opt={}] 분석 이름과 기본 타입을 지정하는 생성 옵션
     */
    constructor(opt?: UAnalyParticleCO);
    /**
     * 분석 객체의 이름입니다.
     *
     * @type {string}
     */
    name: string;
    /**
     * 기본 확산 모드를 구분하는 문자열입니다.
     *
     * @type {string}
     */
    BASE_TYPE: string;
    /**
     * 바람 파티클 모드를 구분하는 문자열입니다.
     *
     * @type {string}
     */
    WIND_TYPE: string;
    /**
     * 격자 확산 모드를 구분하는 문자열입니다.
     *
     * @type {string}
     */
    GRID_TYPE: string;
    /**
     * 파티클 프레임 사이의 시간차를 측정합니다.
     *
     * @type {import('@union3d/core/UClock').UClock}
     *
     * @ignore
     */
    _clock: UClock;
    /**
     * 초기화에 전달한 옵션 원본을 등록 순서대로 보관합니다.
     *
     * @type {Array<UAnalyParticleCO>}
     *
     * @ignore
     */
    _options: Array<UAnalyParticleCO>;
    /**
     * 앱 연결 시점의 파티클 배열 참조입니다. <br>
     * 앱이 배열을 교체해도 이 별칭은 자동으로 교체되지 않습니다.
     *
     * @type {Array<import('@union3d/effect/UParticleEngine').UParticleEngine>}
     *
     * @ignore
     */
    _particles: Array<UParticleEngine>;
    /**
     * 입자 위치의 모델 마스크를 제공하는 레이어입니다.
     *
     * @type {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer | undefined}
     *
     * @ignore
     */
    _maskLayer: U3dMaskLayer | undefined;
    /**
     * 바람 파티클에 전달하는 공간 범위의 원본 참조입니다.
     *
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _extentBox: three.Box3 | undefined;
    /**
     * 격자 확산 확장에서 생성한 표시 헬퍼 그룹입니다.
     *
     * @type {import('three').Group | undefined}
     *
     * @ignore
     */
    _helperGroup: three.Group | undefined;
    /**
     * 비활성화 시 해제할 클릭 이벤트 등록 키입니다.
     *
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId: string | undefined;
    /**
     * 격자 확산 확장에서 사용하는 격자 목록입니다.
     *
     * @type {Array<unknown>}
     */
    grid: Array<unknown>;
    /**
     * 격자 확산 확장에서 사용하는 결과 목록입니다.
     *
     * @type {Array<unknown>}
     */
    resultGrid: Array<unknown>;
    /**
     * 격자 확산 확장에서 사용하는 기준 위치입니다.
     *
     * @type {import('three').Vector3 | undefined}
     */
    position: three.Vector3 | undefined;
    /**
     * 바람 파티클 생성에 사용할 공간 범위를 보관합니다. <br>
     * 전달한 박스는 복사하지 않습니다.
     *
     * @param {import('three').Box3} box 장면의 공간 범위
     */
    setExtentBox(box: three.Box3): void;
    /**
     * 현재 공간 범위의 원본 참조를 반환합니다.
     *
     * @returns {import('three').Box3 | undefined} 설정한 범위 또는 미설정 시 undefined
     */
    getExtentBox(): three.Box3 | undefined;
    /**
     * 생성 모드에 맞는 파티클 엔진을 만들고 앱 목록에 등록합니다. <br>
     * 바람 모드에는 windData가 필요하며 격자 모드에는 data와 setGESpreadObject 확장이 필요합니다. <br>
     * 생성 옵션은 모드 검증 전에 원본 참조로 보관합니다.
     *
     * @param {UAnalyParticleCO} opt 생성 모드와 엔진 속성
     * @returns {import('@union3d/effect/UParticleEngine').UParticleEngine | undefined} 생성한 엔진 또는 입력·앱·확장 부재나 미지원 모드일 때 undefined
     *
     * @example
     *
     * const analysis = app.getAnalysis('Particle');
     * analysis.initialize({
     *     type: 'base',
     *     name: '기본 확산',
     *     position: app.getCameraPosition(),
     *     particlesPerSecond: 100,
     *     particleDeathAge: 10,
     *     emitterDeathAge: 60,
     *     sizeBase: 10
     * });
     * analysis.active();
     */
    initialize(opt: UAnalyParticleCO): UParticleEngine | undefined;
    /**
     * 이름을 대소문자 구분 없이 비교하여 첫 파티클 엔진을 반환합니다.
     *
     * @param {string | undefined} [name] 조회할 이름이며 빈 문자열·미지정은 조회하지 않음
     * @returns {import('@union3d/effect/UParticleEngine').UParticleEngine | undefined} 원본 엔진 또는 찾지 못한 경우 undefined
     */
    getParticleByName(name?: string | undefined): UParticleEngine | undefined;
    /**
     * 이름에 해당하는 첫 파티클 엔진을 파괴하고 앱 목록에서 제거합니다.
     *
     * @param {string} name 제거할 엔진 이름
     * @param {boolean} [_suppress] 호출 호환용 인수이며 현재 동작에는 사용하지 않음
     */
    removeParticleByName(name: string, _suppress?: boolean): void;
    /**
     * 모든 엔진과 헬퍼를 해제하고 앱 파티클 목록을 새 빈 배열로 교체합니다. <br>
     * 생성 옵션·마스크·범위와 격자 결과는 유지하며 갱신 시각은 변경하지 않습니다.
     */
    removeAllParticle(): void;
    /**
     * 모델 강제 로딩 범위의 마스크를 생성하고 값 생성 완료를 통지합니다. <br>
     * useForceLoad가 false이면 레이어 준비 후 즉시 완료합니다. <br>
     * 잘못된 레벨·트리 교체·로딩 실패는 설정과 이벤트를 복원한 뒤 거절합니다. <br>
     * opt 원본에 기본값을 보완하며 opt 누락은 동기 예외, 앱 미연결은 미완료 반환으로 남습니다.
     *
     * @param {UAnalyParticleMaskOption} opt 마스크 레이어와 모델 로딩 범위 설정
     * @returns {Promise<void>} 마스크 값 생성 완료 또는 실패·취소를 통지하는 완료 객체
     *
     * @example
     * opt = {
     *   level: 17,        // 생성 level
     *   name: 'MaskLayer', // layer 이름
     *   height: 20,       // mask value 최소 높이
     *   useForceLoad: true,
     *   forceLoadVisible: true,
     *   modelExtents: modelExtents,
     *   infoLayer: window.modelLayer
     * }
     */
    createMask(opt: UAnalyParticleMaskOption): Promise<void>;
    /**
     * 개별 입자에 적용할 마스크 레이어의 원본 참조를 보관합니다.
     *
     * @param {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer} layer 마스크 조회 레이어
     */
    setMaskLayer(layer: U3dMaskLayer): void;
    /**
     * 현재 마스크 레이어의 원본 참조를 반환합니다.
     *
     * @returns {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer | undefined} 설정한 레이어 또는 undefined
     */
    getMaskLayer(): U3dMaskLayer | undefined;
    /**
     * 이름으로 찾은 엔진의 갱신을 시작하고 이름 조회 실패 시 인덱스로 대체합니다.
     *
     * @param {string | undefined} [name] 대상 이름이며 인덱스만 사용할 때 undefined
     * @param {number} [idx] 이름 조회 실패 시 사용할 앱 목록 인덱스
     */
    setStart(name?: string | undefined, idx?: number): void;
    /**
     * 이름으로 찾은 엔진의 갱신을 정지하고 이름 조회 실패 시 인덱스로 대체합니다.
     *
     * @param {string | undefined} [name] 대상 이름이며 인덱스만 사용할 때 undefined
     * @param {number} [idx] 이름 조회 실패 시 사용할 앱 목록 인덱스
     */
    setStop(name?: string | undefined, idx?: number): void;
    #private;
}

/**
     * 대소문자 무시 비교 확장을 포함하는 문자열 타입입니다.
     */
    type UAnalyParticleString = string & {
        equalIgnoreCase: (str: string) => boolean;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 분석 생성과 파티클 엔진 초기화에 사용하는 옵션입니다.
     */
    type UAnalyParticleCO_Content = {
        /**
         * 생성 모드이며 생성자는 'base', initialize()는 현재 BASE_TYPE을 기본값으로 사용
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
        /**
         * 엔진에 전달할 갱신 속도 배율
         */
        speed?: number;
        /**
         * 기본 확산 엔진의 카메라 추적 여부
         */
        useTraceCamera?: boolean;
        /**
         * 엔진의 부가 효과 사용 여부
         */
        setEffect?: boolean;
        /**
         * 바람 엔진의 카메라 위치 기반 동적 생성 여부
         */
        setDynamic?: boolean;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 분석 생성과 파티클 엔진 초기화에 사용하는 옵션입니다.
     */
    type UAnalyParticleCO = Omit<Omit<UAnalyCO, never> & UAnalyParticleCO_Content, never>;

/**
     * 모델 기반 마스크의 생성과 강제 로딩 설정입니다.
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
         * 강제 로딩 사용 시 필요한 모델 좌표 범위
         */
        modelExtents?: UAnalyParticleModelExtents;
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
     * ~extends import('@union3d/effect/UParticleEngine').UParticleEngine <br>
     *
     * 이름과 확장 기능을 함께 취급하는 파티클 엔진 타입입니다.
     */
    type UAnalyParticleEngine_Content = {
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
     * ~extends import('@union3d/effect/UParticleEngine').UParticleEngine <br>
     *
     * 이름과 확장 기능을 함께 취급하는 파티클 엔진 타입입니다.
     */
    type UAnalyParticleEngine = UParticleEngine & UAnalyParticleEngine_Content;

/**
     * 모델 강제 로딩의 공간 범위입니다.
     */
    type UAnalyParticleModelExtents = {
        /**
         * 첫 번째 X 경계
         */
        minx: number;
        /**
         * 첫 번째 Y 경계
         */
        miny: number;
        /**
         * 두 번째 X 경계
         */
        maxx: number;
        /**
         * 두 번째 Y 경계
         */
        maxy: number;
    };

/**
     * 정렬된 모델 로딩 좌표와 마스크 판정 박스입니다.
     */
    type UAnalyParticleMaskBounds = {
        /**
         * 작은 X 경계
         */
        minx: number;
        /**
         * 작은 Y 경계
         */
        miny: number;
        /**
         * 큰 X 경계
         */
        maxx: number;
        /**
         * 큰 Y 경계
         */
        maxy: number;
        /**
         * 판정용 박스
         */
        box: three.Box3;
    };

/**
     * 마스크 연결에서 직접 읽고 변경하는 개별 입자 상태입니다.
     */
    type UAnalyParticleTarget = {
        /**
         * 현재 입자 위치
         */
        position: three.Vector3 | undefined;
        /**
         * 마스크 설정 여부
         */
        _setMask?: boolean;
    };

export type { UAnalyParticle, UAnalyParticleCO, UAnalyParticleCO_Content, UAnalyParticleEngine, UAnalyParticleEngine_Content, UAnalyParticleMaskBounds, UAnalyParticleMaskOption, UAnalyParticleModelExtents, UAnalyParticleString, UAnalyParticleTarget };
