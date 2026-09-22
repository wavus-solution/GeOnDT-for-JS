// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UParticleEngine } from "../effect/UParticleEngine.js";
import type { Double_Array } from "../types/global.types.js";

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

export type { ExtString, QuadtreeItem, UAnalyParticleCO, UAnalyParticleCO_Content, UAnalyParticleMaskOption, UParticleEngineEx, UParticleEngineEx_Content };
