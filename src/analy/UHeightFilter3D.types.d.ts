// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UHeightFilterCO } from "./UHeightFilter.types.js";
import type { OLGeometry } from "../types/ol.types.js";

/**
     * ~extends import('three').ExtrudeGeometryOptions <br>
     * depth를 필수로 갖는 extrude 옵션
     */
    type HeightFilterExtrudeOption_Content = {
        depth: number;
    };

/**
     * ~extends import('three').ExtrudeGeometryOptions <br>
     * depth를 필수로 갖는 extrude 옵션
     */
    type HeightFilterExtrudeOption = three.ExtrudeGeometryOptions & HeightFilterExtrudeOption_Content;

/**
     * 세점으로 만들어진 평면방정식(ax + by + cz + d = 0)의 계수
     */
    type PlaneEquation = {
        aValue: number;
        bValue: number;
        cValue: number;
        dValue: number;
    };

/**
     * extrude 메쉬 생성 옵션
     */
    type HeightFilter3DMeshOptions = {
        geometry: OLGeometry;
        height: number;
        endheight: number;
        style?: {
            color: number;
            opacity: number;
        };
        type: string;
        theta?: number;
    };

/**
     * ~extends import('@union3d/analy/UHeightFilter').UHeightFilterCO <br>
     * UHeightFilter3D 생성자 옵션 내용 타입
     */
    type UHeightFilter3DCO_Content = {
        /**
         * ol geometry 원본
         */
        _olgeometry?: OLGeometry;
        /**
         * 끝 고도
         */
        endheight?: number;
        /**
         * 세그먼트 수
         */
        segments?: number;
        /**
         * 스타일 옵션
         */
        style?: {
            color: number;
            opacity: number;
        };
        /**
         * 중첩 매칭 여부
         */
        nestingMatch?: boolean;
        /**
         * 이전 타입
         */
        prevType?: string;
        /**
         * 필터링 타입
         */
        type?: string;
        /**
         * 사이각 (ANALY_THETA 전용)
         */
        theta?: number;
    };

/**
     * ~extends import('@union3d/analy/UHeightFilter').UHeightFilterCO <br>
     * UHeightFilter3D 생성자 옵션 내용 타입
     */
    type UHeightFilter3DCO = Omit<Omit<UHeightFilterCO, never> & UHeightFilter3DCO_Content, never>;

export type { HeightFilter3DMeshOptions, HeightFilterExtrudeOption, HeightFilterExtrudeOption_Content, PlaneEquation, UHeightFilter3DCO, UHeightFilter3DCO_Content };
