// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * 선 재질의 요청 상태와 색상 커버리지 패스의 유효 상태를 구분합니다.
     */
    type ULineCoverageState = {
        /**
         * 색상 커버리지 패스 사용 여부
         */
        enabled: boolean;
        /**
         * 호출자가 요청한 transparent 값
         */
        requestedTransparent: boolean;
        /**
         * 호출자가 요청한 블렌딩 모드
         */
        requestedBlending: three.Blending;
        /**
         * 호출자가 요청한 MSAA 커버리지 값
         */
        requestedAlphaToCoverage: boolean;
        /**
         * 실제 GL 뷰포트를 읽는 재사용 객체
         */
        viewport: three.Vector4;
        /**
         * CPU 선 선택이 사용할 주 화면의 논리 픽셀 크기
         */
        mainResolution: three.Vector2;
        /**
         * 사용자 콜백과 내부 뷰포트 갱신을 연결하는 콜백
         */
        renderHook?: three.Material["onBeforeRender"];
    };

/**
     * renderer별 선 AA 연결과 원래 함수를 보관합니다.
     * 연결 해제 후 외부 래퍼가 남아 있어도 비활성 상태로 원래 호출을 통과시킵니다.
     */
    type ULineRendererBinding = {
        /**
         * 연결 사용 여부
         */
        active: boolean;
        /**
         * 연결 전 그리기 함수
         */
        originalRenderBufferDirect: three.WebGLRenderer["renderBufferDirect"];
        /**
         * 연결 전 해제 함수
         */
        originalDispose: three.WebGLRenderer["dispose"];
        /**
         * 연결이 소유한 그리기 함수
         */
        renderBufferDirect: three.WebGLRenderer["renderBufferDirect"];
        /**
         * 연결이 소유한 해제 함수
         */
        dispose: three.WebGLRenderer["dispose"];
    };

export type { ULineCoverageState, ULineRendererBinding };
