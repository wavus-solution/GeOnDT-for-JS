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
     * 생성자 옵션
     */
    type UAnalyObjectInfoCO_Content = {
        /**
         * 모드 이름
         */
        name?: string;
        /**
         * Object 정보를 출력할 Html element
         */
        container?: HTMLElement;
        /**
         * 하이라이트 색상
         */
        _highligthColor?: three.ColorRepresentation;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyObjectInfoCO = Omit<Omit<UAnalyCO, never> & UAnalyObjectInfoCO_Content, never>;

export type { UAnalyObjectInfoCO, UAnalyObjectInfoCO_Content };
