// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyGizmoModelCO } from "./UAnalyGizmoModel.types.js";
import type { UAlignControls } from "../mode/UAlignControls.js";

/**
     * ~extends import('@union3d/analy/UAnalyGizmoModel').UAnalyGizmoModelCO <br>
     * UAnalyAlignModel 생성자 옵션
     */
    type UAnalyAlignModelCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnalyGizmoModel').UAnalyGizmoModelCO <br>
     * UAnalyAlignModel 생성자 옵션
     */
    type UAnalyAlignModelCO = Omit<Omit<UAnalyGizmoModelCO, never> & UAnalyAlignModelCO_Content, never>;

/**
     * UAlignControls에 EventDispatcher / TransformControls 상속 멤버를 추가한 확장 타입 <br>
     */
    type AlignControlTC_Content = {
        addEventListener: (arg0: string, arg1: Function) => void;
        getMode: () => string;
    };

/**
     * UAlignControls에 EventDispatcher / TransformControls 상속 멤버를 추가한 확장 타입 <br>
     */
    type AlignControlTC = UAlignControls & AlignControlTC_Content;

export type { AlignControlTC, AlignControlTC_Content, UAnalyAlignModelCO, UAnalyAlignModelCO_Content };
