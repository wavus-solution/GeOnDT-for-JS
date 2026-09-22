// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { ViewPoint } from "./ViewPoint.js";
import type { UTween } from "../core/UTween.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyLandScapeCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 층간 높이값
         */
        floorHeight?: number;
        /**
         * 층간 높이 보정값
         */
        floorZOffset?: number;
        /**
         * 가시선 시작점 보정값
         */
        startOffsetDistance?: number;
        /**
         * 가시선 가로 각도
         */
        lineAzimuth?: number;
        /**
         * 가시선 세로 각도
         */
        linePolar?: number;
        /**
         * 가시선 최소 길이
         */
        lineMinDistance?: number;
        /**
         * 가시선 최대 길이
         */
        lineMaxDistance?: number;
        /**
         * 가시선 색상
         */
        lineColor?: string;
        /**
         * 가시선 투명도
         */
        lineOpacity?: number;
        /**
         * 가시선 간격
         */
        lineInterval?: number;
        /**
         * 가시영역 상자 높이
         */
        viewBoxHeight?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyLandScapeCO = Omit<Omit<UAnalyCO, never> & UAnalyLandScapeCO_Content, never>;

/**
     * ViewPoint/ViewTarget 생성 공통 옵션
     */
    type UViewPointCO = {
        /**
         * 생성 좌표
         */
        position?: U3dMouseEvent | three.Vector3 | {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 이름
         */
        name?: string;
        /**
         * POI 색상
         */
        color?: string;
        /**
         * POI 이미지 URL
         */
        image?: string;
        /**
         * 이미지 사이즈
         */
        imageSize?: number;
        /**
         * 이미지 위치 보정값
         */
        imageOffset?: {
            x: number;
            y: number;
        };
        /**
         * 라벨 텍스트
         */
        label?: string;
        /**
         * 라벨 위치 보정값
         */
        labelOffset?: {
            x: number;
            y: number;
        };
    };

/**
     * 층별 자동 생성 옵션
     */
    type UComputeFloorCO = {
        /**
         * 층간 높이
         */
        floorHeight?: number;
        /**
         * 높이 오프셋
         */
        offsetHeight?: number;
        /**
         * 이름
         */
        name?: string;
        /**
         * POI 색상
         */
        color?: string;
        /**
         * 이미지 URL
         */
        image?: string;
        /**
         * 이미지 위치 보정값
         */
        imageOffset?: {
            x: number;
            y: number;
        };
        /**
         * 이미지 크기
         */
        imageSize?: number;
        /**
         * 라벨 위치 보정값
         */
        labelOffset?: {
            x: number;
            y: number;
        };
    };

/**
     * ~extends UViewPointCO <br>
     * 방위각·거리 지정으로 조망점을 생성하는 옵션
     */
    type UViewTargetByViewPointCO_Content = {
        /**
         * 방위각
         */
        azimuth?: number;
        /**
         * 고도각
         */
        polar?: number;
        /**
         * 거리
         */
        distance?: number;
    };

/**
     * ~extends UViewPointCO <br>
     * 방위각·거리 지정으로 조망점을 생성하는 옵션
     */
    type UViewTargetByViewPointCO = Omit<Omit<UViewPointCO, never> & UViewTargetByViewPointCO_Content, never>;

/**
     * animate 옵션
     */
    type UAnalyLandScapeAnimateCO = {
        /**
         * 조망점 이동 시작 콜백
         */
        onStart?: (vp: ViewPoint, vt: ViewPoint) => void;
        /**
         * 조망점 이동 완료 콜백
         */
        onEnd?: (vp: ViewPoint, vt: ViewPoint) => void;
        /**
         * 조망점 이동 중 콜백
         */
        onUpdate?: (vp: ViewPoint, vt: ViewPoint) => void;
        /**
         * 전체 애니메이션 완료 콜백
         */
        onComplete?: (vp: ViewPoint, vt: ViewPoint) => void;
    };

/**
     * UTween 체이닝 메서드 타입 (TWEEN.Tween 상속 멤버 포함).
     * UTween.to()/start()/repeat()가 any를 반환하고 onStart/onComplete/onUpdate가
     * 타입되지 않아, 체이닝 동안 타입을 유지하기 위한 스캐폴드 타입이다.
     */
    type UTweenChain = {
        to: (arg0: object, arg1: number) => UTweenChain;
        onStart: (arg0: Function) => UTweenChain;
        onComplete: (arg0: Function) => UTweenChain;
        onUpdate: (arg0: Function) => UTweenChain;
        repeat: (arg0: number) => UTweenChain;
        start: () => UTweenChain;
        stop: () => UTween;
    };

export type { UAnalyLandScapeAnimateCO, UAnalyLandScapeCO, UAnalyLandScapeCO_Content, UComputeFloorCO, UTweenChain, UViewPointCO, UViewTargetByViewPointCO, UViewTargetByViewPointCO_Content };
