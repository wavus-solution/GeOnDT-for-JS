// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { GeoPosition, WorldPosition } from "../types/global.types.js";

type MeasureLayer = {
        clearDrawFeature: () => void;
        _measureFeature: {
            id: string | number;
        } | undefined;
        _measurePoints: Array<object>;
        addMeasurePoint: (arg0: object) => {
            id: string | number;
        };
        commitFeature: () => unknown;
        removeFeature: (arg0: object) => void;
        setMeasureType: (arg0: string) => void;
    };

/**
     * 도로 생성 옵션
     */
    type U3dRoadOption = {
        /**
         * 도로 좌표 배열
         */
        positions: Array<GeoPosition>;
        /**
         * 도로 이름
         */
        name?: string;
        /**
         * 도로 너비
         */
        width?: number;
        /**
         * 도로 높이
         */
        height?: number;
        /**
         * 도로 이미지 URL
         */
        imageUrl?: string;
        /**
         * 도로 가시화 여부
         */
        visible?: boolean;
        /**
         * 라벨 가시화 여부
         */
        labelVisible?: boolean;
        /**
         * 라벨 중심 좌표
         */
        labelcenter?: WorldPosition;
    };

/**
     * 생성자 옵션
     * ~extends import('@UAnaly').UAnalyCO <br>
     */
    type UAnalyMultipleComponentCO_Content = {
        /**
         * 분析모드 이름
         */
        name?: string;
        /**
         * 컴포넌트 크기
         */
        scale?: WorldPosition;
        /**
         * 컴포넌트 회전값
         */
        rotation?: WorldPosition;
        /**
         * 구간 추가 시 가이드 라인 가시화 여부
         */
        lineVisible?: boolean;
    };

/**
     * 생성자 옵션
     * ~extends import('@UAnaly').UAnalyCO <br>
     */
    type UAnalyMultipleComponentCO = Omit<Omit<UAnalyCO, never> & UAnalyMultipleComponentCO_Content, never>;

export type { MeasureLayer, U3dRoadOption, UAnalyMultipleComponentCO, UAnalyMultipleComponentCO_Content };
