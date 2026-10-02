// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dCumulativePathFadeFunc } from "../geometry/U3dCumulativePath.types.js";

/**
     * 렌더 노드에 보관하는 경로 기록 정보입니다.
     */
    type USimpleTailPointMetadata = {
        /**
         * 입력 누적 시간(ms)
         */
        time: number;
        /**
         * 기록 epoch 시각(ms)
         */
        recordedAt?: number;
    };

/**
     * fade 계산에 전달하는 지점의 월드 좌표(EPSG:3857)와 거리·시간 정보입니다.
     */
    type USimpleTailFadeNode = {
        /**
         * 월드 x
         */
        x: number;
        /**
         * 월드 y
         */
        y: number;
        /**
         * 월드 z
         */
        z: number;
        /**
         * 실제 중심점 사이에서 누적한 경로 거리(m)
         */
        pathDistance: number;
        /**
         * 입력 누적 시간
         */
        time?: number;
        /**
         * 기록 epoch 시각
         */
        recordedAt?: number;
    };

/**
     * U3dCumulativePath가 사용자 콜백을 감싸 tail에 전달하는 내부 함수입니다.
     */
    type USimpleTailFadeEvaluator = (node: USimpleTailFadeNode, newest: USimpleTailFadeNode, now: number) => number | Partial<{
        width: number;
        alpha: number;
    }>;

/**
     * ~extends SimplifyPolicy_Option <br>
     *
     * U3dCumulativePath에서 사용할 단순화·표시 정책입니다.
     */
    type USimpleTail_Policy_Content = {
        /**
         * 처음 확보할 지점 수이며 U3dCumulativePath가 적용합니다.
         */
        initLength?: number;
        /**
         * 용량 확장 배율이며 현재 지점 용량에 곱해 확장 단위를 정합니다.
         */
        precision?: number;
        /**
         * U3dCumulativePath의 실시간 지점 기록 최소 간격(ms)이며 0이면 제한하지 않습니다.
         */
        recordIntervalMs?: number;
        /**
         * 자체 누적 거리 1km당 자동 단순화 목표 지점 수
         */
        perMaxNode?: number;
        /**
         * 최신 위치부터 출력할 최대 경로 거리(m). 범위 밖은 렌더링에서 제외하고 버퍼 부족 시 오래된 범위 밖 노드를 재사용합니다. Infinity이면 거리 제한과 fade를 모두 해제하고 fade 배율을 1로 유지합니다. 유한한 값일 때 fadeFunc를 적용하며 fade가 0인 것만으로 노드를 제거하지 않습니다.
         */
        maxDistance?: number;
        /**
         * 이전 거리 fade의 호환 저장값이며 현재 화면에는 적용하지 않습니다.
         */
        widthFade?: number;
        /**
         * 이전 거리 fade의 호환 저장값이며 현재 화면에는 적용하지 않습니다.
         */
        alphaFade?: number;
        /**
         * U3dCumulativePath에서 지점별 폭·불투명도를 계산할 함수이며 null이면 fade를 해제합니다.
         */
        fadeFunc?: U3dCumulativePathFadeFunc | null;
        /**
         * 거리 제한 경계가 앞으로 이동할 때 경계 정보로 호출할 함수
         */
        onFadeOut?: (arg0: object) => void;
        /**
         * 호환 입력값으로 보관하며 현재 궤적 재질에는 반영하지 않습니다.
         */
        nearWidthFadeStart?: number;
        /**
         * 호환 입력값으로 보관하며 현재 궤적 재질에는 반영하지 않습니다.
         */
        nearWidthFadeEnd?: number;
        /**
         * 카메라 깊이에 따라 화면 너비를 보정할지 여부
         */
        depthWidthScale?: boolean;
    };

/**
     * ~extends SimplifyPolicy_Option <br>
     *
     * U3dCumulativePath에서 사용할 단순화·표시 정책입니다.
     */
    type USimpleTail_Policy = SimplifyPolicy_Option & USimpleTail_Policy_Content;

/**
     * 오래된 궤적 지점을 줄이고 최근 지점과 꺾임을 보호하는 정책입니다.
     */
    type SimplifyPolicy_Option = {
        /**
         * 자동 단순화 사용 여부이며 false이면 자동으로 지점을 줄이지 않습니다.
         */
        simplify?: boolean;
        /**
         * 자동 단순화에 허용할 거리의 기준값이며 클수록 더 많은 지점을 생략합니다.
         */
        simplifyEpsilon?: number;
        /**
         * 단순화에서 보호할 최신 지점 수
         */
        protectedTailNodes?: number;
        /**
         * 급격하게 꺾이는 지점 주변을 단순화에서 보호할지 여부
         */
        protectCorners?: boolean;
        /**
         * 보호할 방향 변화 각도의 기준(도)이며 0 초과 180 미만
         */
        cornerAngle?: number;
        /**
         * 보호할 꺾임의 앞뒤에 함께 남길 지점 수
         */
        cornerProtectNodes?: number;
    };

/**
     * ~extends USimpleTailFadeNode <br>
     *
     * 색 농도를 포함해 보관하는 궤적 중심점입니다.
     */
    type USimpleTailNode = USimpleTailFadeNode & Partial<{
        colorFactor: number;
    }>;

/**
     * ~extends Omit<USimpleTail_Policy, 'fadeFunc'> <br>
     *
     * USimpleTail에 직접 전달할 정책이며 fadeFunc는 렌더 지점 평가 함수를 받습니다.
     */
    type USimpleTailRuntimePolicy_Content = {
        /**
         * 지점·최신 지점·현재 시각을 받아 남길 폭과 불투명도를 반환하는 함수
         */
        fadeFunc?: USimpleTailFadeEvaluator | null;
        /**
         * 카메라 근접 너비 fade의 시작 거리
         */
        fadeStart?: number;
        /**
         * 카메라 근접 너비 fade의 종료 거리
         */
        fadeEnd?: number;
    };

/**
     * ~extends Omit<USimpleTail_Policy, 'fadeFunc'> <br>
     *
     * USimpleTail에 직접 전달할 정책이며 fadeFunc는 렌더 지점 평가 함수를 받습니다.
     */
    type USimpleTailRuntimePolicy = Omit<USimpleTail_Policy, "fadeFunc"> & USimpleTailRuntimePolicy_Content;

/**
     * ~extends SimplifyPolicy_Option <br>
     *
     * USimpleTail 생성 옵션이며 실제 그리기 자원은 initialize에서 준비합니다.
     */
    type USimpleTailCO_Content = {
        /**
         * 궤적 메시를 제거할 때 사용할 장면
         */
        scene?: three.Scene | null;
        /**
         * 궤적의 대상 이름
         */
        name?: string;
        /**
         * initialize에서 재사용할 기존 geometry
         */
        geometry?: three.BufferGeometry | null;
        /**
         * initialize에서 장면에서 분리할 기존 메시
         */
        mesh?: three.Mesh | null;
        /**
         * 초기 중심점 목록이며 initialize 시 비웁니다.
         */
        nodeCenters?: Array<USimpleTailNode> | null;
        /**
         * 이전 중심점 참조
         */
        lastNodeCenter?: three.Vector3Like | null;
        /**
         * 최신 중심점 참조
         */
        currentNodeCenter?: three.Vector3Like | null;
        /**
         * 초기 지점 ID 배열이며 initialize에서 새로 준비합니다.
         */
        nodeIDs?: Array<number> | null;
        /**
         * 초기 지점 ID
         */
        currentNodeID?: number;
        /**
         * 초기 사용 지점 수이며 initialize 시 0으로 초기화합니다.
         */
        currentLength?: number;
        /**
         * 초기 마지막 지점 인덱스이며 initialize 시 -1로 초기화합니다.
         */
        currentEnd?: number;
        /**
         * 지점 추가에 재사용할 변환 행렬
         */
        tempMatrix4?: three.Matrix4;
        /**
         * 용량 확장 배율
         */
        precision?: number;
        /**
         * 최신 위치부터 출력할 최대 경로 거리(m)
         */
        maxDistance?: number;
        /**
         * 카메라 근접 너비 fade의 시작 거리
         */
        fadeStart?: number;
        /**
         * 카메라 근접 너비 fade의 종료 거리
         */
        fadeEnd?: number;
        /**
         * 카메라 깊이에 따라 너비를 보정할지 여부
         */
        depthWidthScale?: boolean;
        /**
         * 이전 거리 fade의 호환 저장값이며 화면에 적용하지 않습니다.
         */
        widthFade?: number;
        /**
         * 이전 거리 fade의 호환 저장값이며 화면에 적용하지 않습니다.
         */
        alphaFade?: number;
    };

/**
     * ~extends SimplifyPolicy_Option <br>
     *
     * USimpleTail 생성 옵션이며 실제 그리기 자원은 initialize에서 준비합니다.
     */
    type USimpleTailCO = Omit<Omit<SimplifyPolicy_Option, never> & USimpleTailCO_Content, never>;

export type { SimplifyPolicy_Option, USimpleTailCO, USimpleTailCO_Content, USimpleTailFadeEvaluator, USimpleTailFadeNode, USimpleTailNode, USimpleTailPointMetadata, USimpleTailRuntimePolicy, USimpleTailRuntimePolicy_Content, USimpleTail_Policy, USimpleTail_Policy_Content };
