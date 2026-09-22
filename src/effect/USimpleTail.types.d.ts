// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

type USimpleTail_Policy_Content = {
        /**
         * tail 초기 버퍼 노드 개수
         */
        initLength?: number;
        /**
         * tail 확장 단위 배율. initLength * precision 노드 단위로 cache를 확장한다.
         */
        precision?: number;
        /**
         * 단순화 전 1km당 유지할 최대 노드 개수
         */
        perMaxNode?: number;
        /**
         * 최신 위치부터 출력할 최대 경로 거리(m). Infinity면 전체 cache를 그린다.
         */
        maxDistance?: number;
        /**
         * maxDistance 중 오래된 앞쪽 경로에 폭 fade out을 적용할 비율. 0이면 폭 fade 비활성화
         */
        widthFade?: number;
        /**
         * maxDistance 중 오래된 앞쪽 경로에 투명도 fade out을 적용할 비율. 0이면 투명도 fade 비활성화
         */
        alphaFade?: number;
        /**
         * maxDistance 경계가 앞으로 이동해 경로 앞부분이 완전히 투명해질 때 호출되는 콜백.
         * 콜백 payload: { target, boundaryDistance, virtualPoint, previousNode, nextNode, newestNode, maxDistance, t }
         */
        onFadeOut?: (arg0: object) => void;
        /**
         * 카메라 근접 구간 ribbon 폭 fade 시작 거리
         */
        nearWidthFadeStart?: number;
        /**
         * 카메라 근접 구간 ribbon 폭 fade 종료 거리
         */
        nearWidthFadeEnd?: number;
        /**
         * 정점별 카메라 깊이에 따른 폭 보정 사용 여부
         */
        depthWidthScale?: boolean;
    };

type USimpleTail_Policy = SimplifyPolicy_Option & USimpleTail_Policy_Content;

type SimplifyPolicy_Option = {
        /**
         * 단순화 여부. false면 단순화 없이 tail을 유지한다.
         */
        simplify?: boolean;
        /**
         * 단순화 정도. 값이 클수록 더 크게 단순화한다.
         */
        simplifyEpsilon?: number;
        /**
         * 끝부분(tail)에서 단순화로부터 보호할 노드 개수 (기본값 64)
         */
        protectedTailNodes?: number;
        /**
         * 코너(꺾이는 지점) 노드 보호 여부
         */
        protectCorners?: boolean;
        /**
         * 코너로 판단할 각도 기준 (기본값 45)
         */
        cornerAngle?: number;
        /**
         * 코너 보호 시 함께 보호할 인접 노드 개수 (기본값 2)
         */
        cornerProtectNodes?: number;
    };

export type { SimplifyPolicy_Option, USimpleTail_Policy, USimpleTail_Policy_Content };
