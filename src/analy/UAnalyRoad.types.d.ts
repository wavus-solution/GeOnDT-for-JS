// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { UGizmoControls } from "../mode/UGizmoControls.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * UAnalyRoad 생성자 옵션
     */
    type UAnalyRoadCO_Content = {
        /**
         * 도로 분석 이름
         */
        name?: string;
        /**
         * 정지선 표시 여부
         */
        drawStopLine?: boolean;
        /**
         * 스케일
         */
        scale?: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 회전
         */
        rotation?: {
            x: number;
            y: number;
            z: number;
        };
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * UAnalyRoad 생성자 옵션
     */
    type UAnalyRoadCO = Omit<Omit<UAnalyCO, never> & UAnalyRoadCO_Content, never>;

/**
     * ~extends UGizmoControls <br>
     * update·dispose·addEventListener 멤버를 포함한 UGizmoControls 확장 타입
     */
    type UGizmoControlsEx = UGizmoControls & {
        update(): void;
        dispose(): void;
        addEventListener(type: string, listener: Function): void;
    };

type IntersectionTarget = {
        name: string;
        _olGeom?: object;
        /**
         * 도로 중심선 (월드 좌표, EPSG:3857)
         */
        center?: Array<WorldPositionVector3>;
        geometry?: object;
    };

export type { IntersectionTarget, UAnalyRoadCO, UAnalyRoadCO_Content, UGizmoControlsEx };
