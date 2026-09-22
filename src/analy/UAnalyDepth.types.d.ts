// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyDepth 생성자 옵션
     */
    type UAnalyDepthCO_Content = {
        /**
         * 분석모드 이름
         */
        name?: string;
        /**
         * 충돌 구체 색상 (대상 있을 때)
         */
        intersectColor1?: number;
        /**
         * 충돌 구체 색상 (대상 없을 때)
         */
        intersectColor2?: number;
        /**
         * 라벨 가시화 설정 목록
         */
        labelVisibilityList?: Array<boolean>;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyDepth 생성자 옵션
     */
    type UAnalyDepthCO = Omit<Omit<UAnalyCO, never> & UAnalyDepthCO_Content, never>;

/**
     * 측정 지점의 결과 데이터 정보
     */
    type UAnalyDepthPointData = {
        /**
         * 경도
         */
        x: number;
        /**
         * 위도
         */
        y: number;
        /**
         * 고도
         */
        z: number;
        /**
         * 지형으로부터 거리
         */
        fromTerrain: number;
        /**
         * 이전 지점으로부터 거리
         */
        fromPrePoint: number;
        /**
         * 충돌 메시
         */
        mesh?: three.Object3D | undefined;
    };

/**
     * 측정 결과 정보
     */
    type UAnalyDepthResult = {
        /**
         * 총 거리
         */
        length: number;
        /**
         * 지점 목록
         */
        points: Array<UAnalyDepthPointData>;
    };

export type { UAnalyDepthCO, UAnalyDepthCO_Content, UAnalyDepthPointData, UAnalyDepthResult };
