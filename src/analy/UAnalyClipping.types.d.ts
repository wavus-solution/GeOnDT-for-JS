// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { OLGeometry } from "../types/ol.types.js";

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyClipping 생성자 옵션
     */
    type UAnalyClippingCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 분석 타입 ('image' || 'model')
         */
        type?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyClipping 생성자 옵션
     */
    type UAnalyClippingCO = Omit<Omit<UAnalyCO, never> & UAnalyClippingCO_Content, never>;

type ClippingLayer = {
        /**
         * 레이어 이름 반환
         */
        getName: () => string;
        /**
         * 캐시 키 목록 반환
         */
        getCacheKeys: () => Array<string>;
        /**
         * 캐시 키로 Object3D 반환
         */
        getCacheByKey: (arg0: string) => three.Object3D;
        /**
         * 씬 반환
         */
        getScene: () => three.Scene;
        /**
         * 이벤트 리스너 등록
         */
        addEventListener: (arg0: string, arg1: Function) => void;
        /**
         * 이벤트 리스너 제거
         */
        removeEventListener: (arg0: string, arg1: Function) => void;
        /**
         * 타일 상태 초기화
         */
        resetStateTileByKey?: (arg0: string) => void;
        checkDivisionMeshIdle?: () => void;
    };

/**
     * addFilter 옵션
     */
    type UAnalyClippingFilterParam = {
        /**
         * 필터 아이디
         */
        id?: string;
        /**
         * 필터 타입
         */
        type: string;
        /**
         * ol 지오메트리 또는 좌표({x,y}) 목록
         */
        geometry: OLGeometry | Array<{
            x: number;
            y: number;
        }>;
        /**
         * 레이어 목록
         */
        layers?: Array<string>;
        /**
         * 필터 스타일 {color: 0x000000, opacity: 0.8}
         */
        style?: {
            color: number;
            opacity: number;
        };
        /**
         * 기준 축 ( X,Y,Z 축 | height)
         */
        axis?: string;
        /**
         * 필터 크기
         */
        size?: number;
    };

export type { ClippingLayer, UAnalyClippingCO, UAnalyClippingCO_Content, UAnalyClippingFilterParam };
