// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { ColorLike } from "../types/global.types.js";

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * UAnalySkyLine 생성자 옵션
     */
    type UAnalySkyLineCO_Content = {
        /**
         * 분석모드 명
         */
        name?: string;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * UAnalySkyLine 생성자 옵션
     */
    type UAnalySkyLineCO = Omit<Omit<UAnalyCO, never> & UAnalySkyLineCO_Content, never>;

/**
     * 스카이라인 스타일 옵션
     */
    type SkyLineStyle = {
        /**
         * 경계선 색상
         */
        lineColor?: ColorLike;
        /**
         * 경계선 두께
         */
        lineSize?: number;
        /**
         * 경계선 초과 모델 영역 색상
         */
        overColor?: ColorLike;
        /**
         * 지면 색상 적용 여부
         */
        useGroundColor?: boolean;
        /**
         * 지면 색상
         */
        groundColor?: ColorLike;
        /**
         * 하늘 색상 적용 여부
         */
        useSkyColor?: boolean;
        /**
         * 하늘 색상
         */
        skyColor?: ColorLike;
    };

export type { SkyLineStyle, UAnalySkyLineCO, UAnalySkyLineCO_Content };
