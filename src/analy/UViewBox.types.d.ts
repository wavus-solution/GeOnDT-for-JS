// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";

type ViewBoxTile = {
        _minx: number;
        _miny: number;
        _maxx: number;
        _maxy: number;
    };

/**
     * 생성자 옵션
     */
    type UViewBoxCO = {
        /**
         * 앱 인스턴스
         */
        app: U3dApp;
        /**
         * 시작 좌표
         */
        start: three.Vector3;
        /**
         * 끝 좌표
         */
        end: three.Vector3;
        /**
         * 분석 거리 (기본값: start.distanceTo(end))
         */
        distance?: number;
        /**
         * ViewBox Start Offset
         */
        startOffset?: number;
        /**
         * ViewBox의 방위각(좌우각)
         */
        azimuth?: number;
        /**
         * ViewBox의 고도각(상하각)
         */
        polar?: number;
        /**
         * ViewBox의 너비 Segment
         */
        widthSegment?: number;
        /**
         * ViewBox 높이
         */
        height?: number;
        /**
         * ViewBox 투명도
         */
        opacity?: number;
        /**
         * ViewBox 투명도 적용 여부
         */
        transparent?: boolean;
        /**
         * ViewBox 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 랜더링할 면
         */
        side?: three.Side;
        /**
         * 분석 타입
         */
        type?: string;
    };

export type { UViewBoxCO, ViewBoxTile };
