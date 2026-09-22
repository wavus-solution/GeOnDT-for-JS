// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ColorLike, WorldPositionVector3 } from "../types/global.types.js";

/**
     * 시뮬레이션 내부 상태 객체
     */
    type UPhysicalFlowSimulation = {
        /**
         * 활성화 여부
         */
        active: boolean;
        /**
         * 시작 시간
         */
        startTime: number;
        /**
         * 프레임 업데이트 함수
         */
        fnc: (delta?: number) => void;
        /**
         * 프레임당 생성 입자 수
         */
        amount?: number;
        /**
         * 시뮬레이션 유지 시간 (ms)
         */
        initTime?: number;
        /**
         * 입자 반지름
         */
        radius?: number;
        /**
         * 입자 질량
         */
        mass?: number;
        /**
         * 입자 생성 해상도
         */
        resolution?: number;
        /**
         * 속도별 색상 단계 (max: 최대 속도, color: 색상, opacity: 투명도)
         */
        steps?: Array<{
            color: ColorLike;
            opacity: number;
        } & Partial<{
            max: number;
        }>>;
        /**
         * 입자 생성 비율
         */
        generateRatio?: number;
        /**
         * 추가 입자 생성 한계
         */
        generateAmount?: number;
        /**
         * 생성 위치 목록
         */
        positions?: Array<{
            x: number;
            y: number;
            z: number;
        }>;
        /**
         * 영역 가로 크기 (rain)
         */
        width?: number;
        /**
         * 영역 세로 크기 (rain)
         */
        height?: number;
        /**
         * 영역 중심 좌표 (월드 좌표계, rain)
         */
        center?: WorldPositionVector3;
        /**
         * 초기 생성 높이 (rain)
         */
        initHeight?: number;
        /**
         * 입자 색상 (rain)
         */
        color?: ColorLike;
        /**
         * 입자 불투명도 (rain)
         */
        opacity?: number;
    };

export type { UPhysicalFlowSimulation };
