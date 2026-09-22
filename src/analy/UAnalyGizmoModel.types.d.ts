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

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyGizmoModel 생성자 옵션
     */
    type UAnalyGizmoModelCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyGizmoModel 생성자 옵션
     */
    type UAnalyGizmoModelCO = Omit<Omit<UAnalyCO, never> & UAnalyGizmoModelCO_Content, never>;

/**
     * ~extends import('three').Object3D <br>
     * 기즈모 제어 객체 확장 프로퍼티
     */
    type GizmoControlObject_Content = {
        /**
         * 기준 위치
         */
        _basePos: three.Vector3;
        /**
         * 기준 회전
         */
        _baseQuat: three.Quaternion;
        /**
         * 기준 크기
         */
        _baseScl: three.Vector3;
    };

/**
     * ~extends import('three').Object3D <br>
     * 기즈모 제어 객체 확장 프로퍼티
     */
    type GizmoControlObject = three.Object3D & GizmoControlObject_Content;

/**
     * UGizmoControls에 TransformControls 상속 멤버를 추가한 확장 타입. <br>
     */
    type UGizmoControlsTC = {
        addEventListener: (arg0: string, arg1: Function) => void;
        removeEventListener: (arg0: string, arg1: Function) => void;
        dispose: () => void;
        object: three.Object3D | undefined;
        getMode: () => string;
        setMode: (arg0: string) => void;
        mode: string;
        axis: string | null;
        _offset: three.Vector3;
        _listeners: {
            [x: string]: Function[];
        };
        attach: (arg0: three.Object3D) => UGizmoControls;
        detach: () => UGizmoControls;
    };

type GizmoXmlOption = {
        /**
         * 모델 이름
         */
        name: string;
        /**
         * 모델 제목
         */
        title: string | undefined;
        /**
         * 위치
         */
        location: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 회전
         */
        rotation: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 크기
         */
        scale: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 경계 박스
         */
        box: {
            min: {
                x: number;
                y: number;
                z: number;
            };
            max: {
                x: number;
                y: number;
                z: number;
            };
        };
    };

export type { GizmoControlObject, GizmoControlObject_Content, GizmoXmlOption, UAnalyGizmoModelCO, UAnalyGizmoModelCO_Content, UGizmoControlsTC };
