// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dSphere } from "./U3dSphere.js";

/**
     * 팔레트 보간 정보 (정규화된 t, 색상, 투명도) <br>
     */
    type PaletteStop = {
        /**
         * 정규화된 위치 (0~1) <br>
         */
        t: number;
        /**
         * 색상 <br>
         */
        color: three.Color;
        /**
         * 투명도 <br>
         */
        opacity?: number;
    };

/**
     * 열원 셰이더 uniforms 객체 <br>
     */
    type HeatUniforms = {
        /**
         * 센서 데이터 텍스처 <br>
         */
        uSensorTex: {
            value: three.DataTexture | null;
        };
        /**
         * 센서 개수 <br>
         */
        uSensorCount: {
            value: number;
        };
        /**
         * 텍스처 width <br>
         */
        uSensorTexSize: {
            value: number;
        };
        /**
         * 최소 온도 <br>
         */
        uTempMin: {
            value: number;
        };
        /**
         * 최대 온도 <br>
         */
        uTempMax: {
            value: number;
        };
        /**
         * 100% 영향 반경 <br>
         */
        uInnerRadius: {
            value: number;
        };
        /**
         * 감쇠 구간 반경 <br>
         */
        uOuterRadius: {
            value: number;
        };
        /**
         * 전체 알파 <br>
         */
        uOpacity: {
            value: number;
        };
        /**
         * 타겟 월드 역행렬 <br>
         */
        uTargetWorldInv: {
            value: three.Matrix4;
        };
        /**
         * 타겟 월드 스케일 <br>
         */
        uTargetScale: {
            value: three.Vector3;
        };
        /**
         * 팔레트 텍스처 <br>
         */
        uPaletteTex: {
            value: three.DataTexture;
        };
    };

/**
     * HeatGroup 엔트리. 타겟별 열원 정보를 관리한다. <br>
     */
    type HeatGroupEntry = {
        /**
         * 등록된 열원 Set <br>
         */
        heats: Set<U3dSphere>;
        /**
         * shader uniform 객체 <br>
         */
        uniforms: HeatUniforms | null;
        /**
         * 센서 데이터 텍스처 <br>
         */
        texture: three.DataTexture | null;
        /**
         * 센서 데이터 버퍼 <br>
         */
        buffer: Float32Array | null;
        /**
         * 원본 머터리얼 백업 <br>
         */
        originM: Map<three.Mesh, three.Material>;
        /**
         * 머터리얼 패치 여부 <br>
         */
        materialPatched: boolean;
    };

export type { HeatGroupEntry, HeatUniforms, PaletteStop };
