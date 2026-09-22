// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * Color tone adjustment uniform.
     */
    type colorToneUniforms = {
        /**
         * 밝은 영역 색상 uniform
         */
        light: {
            value: three.Color;
        };
        /**
         * 어두운 영역 색상 uniform
         */
        dark: {
            value: three.Color;
        };
        /**
         * 밝은 색 적용 여부 uniform
         */
        lightEnabled: {
            value: boolean;
        };
        /**
         * 어두운 색 적용 여부 uniform
         */
        darkEnabled: {
            value: boolean;
        };
        /**
         * 밝은 색 적용 민감도 uniform
         */
        lightExposure: {
            value: number;
        };
        /**
         * 어두운 색 적용 민감도 uniform
         */
        darkExposure: {
            value: number;
        };
    };

export type { colorToneUniforms };
