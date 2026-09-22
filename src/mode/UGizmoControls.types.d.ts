// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";

/**
     * UGizmoControls 생성자 옵션
     */
    type UGizmoControlsCO = {
        /**
         * 기즈모 투영에 사용할 카메라
         */
        camera?: three.Camera;
        /**
         * 포인터 이벤트를 수신할 DOM 요소
         */
        domelement?: HTMLElement;
        /**
         * 소속 앱. 드래그 중 현재 카메라 컨트롤을 비활성화하고 변경 시 렌더링을 요청한다. 없으면 오류 메시지를 남긴다.
         */
        app?: U3dApp;
        /**
         * 기즈모 헬퍼 UI 크기
         */
        size?: number;
    };

/**
     * TransformControls가 포인터 이벤트에서 추출해 전달하는 포인터 정보
     */
    type UGizmoControlsPointer = {
        /**
         * NDC x 좌표 (-1 ~ 1)
         */
        x: number;
        /**
         * NDC y 좌표 (-1 ~ 1)
         */
        y: number;
        /**
         * 눌린 포인터 버튼
         */
        button: number;
    };

export type { UGizmoControlsCO, UGizmoControlsPointer };
