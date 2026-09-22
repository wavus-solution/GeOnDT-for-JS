// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { GeoPosition } from "../types/global.types.js";

/**
     * UAnalyViewCone 생성자 옵션 내용 타입
     */
    type UAnalyViewConeCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 세그먼트 수
         */
        segments?: number;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyViewConeCO = Omit<Omit<UAnalyCO, never> & UAnalyViewConeCO_Content, never>;

/**
     * 뷰콘 분석 필터 추가 옵션
     */
    type ViewConeFilterOption = {
        /**
         * 필터 아이디
         */
        id?: string;
        /**
         * 분석 feature의 geometry 정보
         */
        geometry?: any;
        /**
         * 필터 첫 높이
         */
        height?: number;
        /**
         * 필터 끝 높이
         */
        endheight?: number;
        /**
         * 필터 세타 각 : theta 분석 시 사용
         */
        theta?: number;
        /**
         * 필터 타입
         */
        type?: string;
        /**
         * 중첩분석 여부
         */
        nestingMatch?: boolean;
        /**
         * 대상 레이어 목록
         */
        layers?: Array<string>;
        /**
         * 필터 스타일
         */
        style?: {
            color: number;
            opacity: number;
        };
    };

/**
     * 교차 영역 정보 타입
     */
    type IntersectViewConeAreaInfo = {
        id: string;
        coordinates: Array<GeoPosition>;
        /**
         * - ol.geom.Polygon
         */
        geometry: object;
        minZ?: number;
        maxZ?: number;
    };

export type { IntersectViewConeAreaInfo, UAnalyViewConeCO, UAnalyViewConeCO_Content, ViewConeFilterOption };
