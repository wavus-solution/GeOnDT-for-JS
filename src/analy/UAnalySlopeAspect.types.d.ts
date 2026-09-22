// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { U3dApp } from "../app/U3dApp.js";

/**
     * 표면 높이 샘플링 방식
     */
    type SlopeAspectSamplingMode = "terrain" | "raycast";

/**
     * Raycast 표면 대상
     */
    type SlopeAspectTarget = {
        /**
         * 교차 객체
         */
        object: three.Object3D;
        /**
         * 인스턴스 식별자
         */
        instanceId?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalySlopeAspect 생성자 옵션
     */
    type UAnalySlopeAspectCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 분석 영역의 가로 크기(m). 내부에서 분석 중심 위도의 3857 길이로 변환되어 적용됩니다.
         */
        width?: number;
        /**
         * 분석 영역의 세로 크기(m). 내부에서 분석 중심 위도의 3857 길이로 변환되어 적용됩니다.
         */
        height?: number;
        /**
         * 가로 방향 표면 샘플 수
         */
        nx?: number;
        /**
         * 세로 방향 표면 샘플 수
         */
        ny?: number;
        /**
         * 화살표가 다른 객체에 가려지도록 깊이 버퍼를 사용할지 여부
         */
        depthTest?: boolean;
        /**
         * 경사향, 경사도 또는 조합 범례 적용 모드
         */
        mode?: "aspect" | "slope" | "slope-aspect";
        /**
         * `'terrain'` 또는 위에서 아래로 표면을 탐색하는 `'raycast'` 샘플링 방식
         */
        samplingMode?: SlopeAspectSamplingMode;
        /**
         * Raycast 시 terrain과 표시 중인 이미지 레이어 외에 추가할 현재 표시 중인 레이어 이름 목록. 존재하지 않는 이름이 포함되면 분석이 오류로 종료됩니다.
         */
        targetLayers?: Array<string>;
        /**
         * 경사도 범례
         */
        slopeLegend?: {
            color: Array<string>;
            min: number;
            max: number;
        };
        /**
         * 앱 인스턴스
         */
        app?: U3dApp;
        /**
         * 셀별 화살표 스타일 콜백. Raycast로 표면을 찾은 셀은 `cel.target`을 포함합니다.
         */
        arrowStyleFunction?: (cel: SlopeAspectCell, index?: number) => SlopeAspectArrowStryle;
        /**
         * 화살표 머리(원뿔) 반지름. 월드 단위이며 0보다 커야 합니다.
         */
        arrowHeadSize?: number;
        /**
         * 화살표 머리(원뿔) 길이. 월드 단위이며 0보다 커야 합니다.
         */
        arrowHeadLength?: number;
        /**
         * 화살표 꼬리(원기둥) 길이. 월드 단위이며 0보다 커야 합니다.
         */
        arrowTailLength?: number;
        /**
         * 화살표 꼬리(원기둥) 반지름. 월드 단위이며 0보다 커야 합니다.
         */
        arrowTailWidth?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalySlopeAspect 생성자 옵션
     */
    type UAnalySlopeAspectCO = Omit<Omit<UAnalyCO, never> & UAnalySlopeAspectCO_Content, never>;

/**
     * 경사향 분석 셀 결과
     */
    type SlopeAspectCell = {
        /**
         * 동서 방향 변화율
         */
        dEW: number;
        /**
         * 남북 방향 변화율
         */
        dNS: number;
        /**
         * 경사도
         */
        slope: number;
        /**
         * 경사향
         */
        aspect: number;
        /**
         * 방향 벡터
         */
        direction: three.Vector3;
        /**
         * 위치
         */
        position: three.Vector3;
        /**
         * 그리드 x 인덱스
         */
        x: number;
        /**
         * 그리드 y 인덱스
         */
        y: number;
        /**
         * 중심 격자점의 Raycast 표면 대상
         */
        target?: SlopeAspectTarget;
    };

/**
     * 경사향 화살표 스타일 옵션
     */
    type SlopeAspectArrowStryle = {
        /**
         * 화살표 가시화 여부. false면 화살표를 그리지 않는다
         */
        visible: boolean;
        /**
         * 화살표 크기(배율)
         */
        scale: number;
        /**
         * 화살표 높이(z축)
         */
        height: number;
        /**
         * 화살표 색상
         */
        color: three.ColorRepresentation;
        /**
         * 화살표 투명도(0~1)
         */
        opacity: number;
    };

/**
     * 경사향 분석 옵션
     */
    type SlopeAspectOption = {
        /**
         * 경사향 격자 가로 셀 갯수
         */
        nx: number;
        /**
         * 경사향 격자 세로 셀 갯수
         */
        ny: number;
        /**
         * 경사향 격자 너비(m)
         */
        width: number;
        /**
         * 경사향 격자 높이(m)
         */
        height: number;
        /**
         * 경사향 격자 depth 사용 여부
         */
        depthTest: boolean;
        /**
         * 표면 높이 샘플링 방식
         */
        samplingMode: SlopeAspectSamplingMode;
        /**
         * Raycast 시 기본 표면에 추가할 레이어 이름 목록
         */
        targetLayers: Array<string>;
        /**
         * 화살표 머리(원뿔) 반지름
         */
        arrowHeadSize: number;
        /**
         * 화살표 머리(원뿔) 길이
         */
        arrowHeadLength: number;
        /**
         * 화살표 꼬리(원기둥) 길이
         */
        arrowTailLength: number;
        /**
         * 화살표 꼬리(원기둥) 반지름
         */
        arrowTailWidth: number;
        /**
         * 경사향 격자 화살표 스타일 콜백함수
         */
        arrowStyleFunction?: (cel: SlopeAspectCell, index?: number) => SlopeAspectArrowStryle;
    };

export type { SlopeAspectArrowStryle, SlopeAspectCell, SlopeAspectOption, SlopeAspectSamplingMode, SlopeAspectTarget, UAnalySlopeAspectCO, UAnalySlopeAspectCO_Content };
