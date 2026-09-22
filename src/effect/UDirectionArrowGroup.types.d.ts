// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ColorLike, DegreeEulerLike } from "../types/global.types.js";

/**
     * 방향 화살표 하나의 내부 상태입니다.
     */
    type UDirectionArrow_State = {
        /**
         * 화살표가 현재 사용 중인지 여부
         */
        active: boolean;
        /**
         * 위치/방향을 추적하는 대상 객체
         */
        target?: unknown;
        /**
         * 화살표 표시 여부
         */
        visible: boolean;
        /**
         * offset을 target 방향 기준 로컬 좌표로 적용할지 여부
         */
        localOffset: boolean;
        /**
         * target의 위치/회전 프레임을 사용할지 여부
         */
        useTargetFrame: boolean;
        /**
         * 화살표 꼬리 길이
         */
        lineLength: number;
        /**
         * 화살표 꼬리 두께
         */
        lineThickness: number;
        /**
         * 화살촉 반지름
         */
        headRadius: number;
        /**
         * 화살촉 길이
         */
        headLength: number;
        /**
         * 내부 렌더링용 화살촉 비율
         */
        headRatio: number;
        /**
         * 화살표 꼬리 스타일('실선' | '점선')
         */
        shaftStyle: "solid" | "dashed";
        /**
         * 점선 dash 길이
         */
        dashLength: number;
        /**
         * 점선 gap 길이
         */
        gapLength: number;
        /**
         * 원통/원뿔 방사형 분할 수
         */
        radialSegments: number;
        /**
         * depth test 사용 여부
         */
        depthTest: boolean;
        /**
         * 색상 또는 색상 함수
         */
        color: UDirectionArrowColor;
        /**
         * 투명도 또는 투명도 함수
         */
        opacity: UDirectionArrowOpacity;
        /**
         * 화살표 기준 월드 위치
         */
        position: three.Vector3;
        /**
         * 화살표 방향 벡터
         */
        direction: three.Vector3;
        /**
         * 위치 오프셋
         */
        offset: three.Vector3;
        /**
         * 방향 정렬 이후 추가 적용할 회전 오프셋(degree)
         */
        rotationOffset: three.Vector3;
    };

/**
     * 방향 화살표 스타일 함수에 전달되는 컨텍스트입니다.
     */
    type UDirectionArrowStyleContext = {
        /**
         * 화살표 id
         */
        id: number;
        /**
         * 화살표 내부 상태
         */
        state: UDirectionArrow_State;
        /**
         * offset 적용 후 계산된 실제 렌더 월드 위치(state 값 복사가 아님)
         */
        position: three.Vector3;
        /**
         * 내부 버퍼에서 읽은 현재 렌더 방향 벡터
         */
        direction: three.Vector3;
        /**
         * 최소값 보정(clamp)된 꼬리 길이
         */
        lineLength: number;
        /**
         * 최소값 보정(clamp)된 꼬리 두께
         */
        lineThickness: number;
        /**
         * 화살촉 길이(state.headLength와 동일)
         */
        headLength: number;
    };

/**
     * 화살표 색상 콜백 함수
     */
    type InputColorCallback = (arrowStyle: UDirectionArrowStyleContext) => ColorLike;

/**
     * 화살표 투명도 콜백 함수
     */
    type InputOpacityCallback = (arrowStyle: UDirectionArrowStyleContext) => number;

/**
     * 방향 화살표 색상 입력값입니다.
     */
    type UDirectionArrowColor = ColorLike | InputColorCallback;

/**
     * 방향 화살표 투명도 입력값입니다.
     */
    type UDirectionArrowOpacity = number | InputOpacityCallback;

/**
     * 방향 화살표 그룹 생성 및 개별 화살표 생성 옵션입니다.
     */
    type UDirectionArrowGroupCO = {
        /**
         * 그룹 이름
         */
        name?: string;
        /**
         * 전체 화살표 최대 개수
         */
        capacity?: number;
        /**
         * bucket별 초기 InstancedMesh capacity
         */
        bucketInitialCapacity?: number;
        /**
         * matrixWorld 갱신 시 target 위치/방향을 자동 동기화할지 여부
         */
        autoSync?: boolean;
        /**
         * bucket mesh의 Three.js frustum culling 사용 여부
         */
        frustumCulled?: boolean;
        /**
         * bucket mesh renderOrder
         */
        renderOrder?: number;
        /**
         * update 시 카메라 기준 거리/화면 영역 컬링을 사용할지 여부
         */
        cullByCamera?: boolean;
        /**
         * 카메라와 이 거리보다 멀면 숨깁니다.
         */
        maxDistance?: number;
        /**
         * 화면 밖 컬링 여유값
         */
        screenCullMargin?: number;
        /**
         * depth test 사용 여부
         */
        depthTest?: boolean;
        /**
         * target의 기준 forward 방향
         */
        targetForward?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 위치/방향을 따라갈 대상
         */
        target?: unknown;
        /**
         * 화살표 표시 여부
         */
        visible?: boolean;
        /**
         * offset을 target 방향 기준 로컬 좌표로 적용할지 여부
         */
        localOffset?: boolean;
        /**
         * target이 없을 때 사용할 월드 위치
         */
        position?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 화살표 방향 벡터
         */
        direction?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 바라볼 월드 위치
         */
        lookAt?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 위치 오프셋
         */
        offset?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 방향 정렬 이후 추가 적용할 회전 오프셋(degree)
         */
        rotationOffset?: three.Vector3 | three.Euler | DegreeEulerLike | Array<number>;
        /**
         * 화살표 꼬리 길이
         */
        lineLength?: number;
        /**
         * 화살표 꼬리 두께
         */
        lineThickness?: number;
        /**
         * 화살촉 반지름
         */
        headRadius?: number;
        /**
         * 화살촉 길이
         */
        headLength?: number;
        /**
         * 꼬리 스타일
         */
        shaftStyle?: "solid" | "dashed";
        /**
         * 점선 dash 길이
         */
        dashLength?: number;
        /**
         * 점선 gap 길이
         */
        gapLength?: number;
        /**
         * 원통/원뿔 방사형 분할 수
         */
        radialSegments?: number;
        /**
         * 색상 또는 색상 함수
         */
        color?: UDirectionArrowColor;
        /**
         * 투명도 또는 투명도 함수
         */
        opacity?: UDirectionArrowOpacity;
    };

/**
     * 화살표 길이/두께/헤드 비율 계산에 필요한 최소 형상 값입니다.
     * headRatio는 setter 경유 시 syncShapeRatio가 계산해 채웁니다.
     */
    type UDirectionArrowShape = Pick<UDirectionArrow_State, "lineLength" | "lineThickness" | "headLength"> & Partial<Pick<UDirectionArrow_State, "headRatio">>;

/**
     * 그룹 생성 시 결정되는 기본 형상 옵션입니다.
     * 속성 정의와 설명은 UDirectionArrow_State에서 파생합니다(중복 선언 방지).
     * headRatio는 setter 경유 시 syncShapeRatio가 계산해 채웁니다.
     */
    type UDirectionArrowGeometryDefaults = Pick<UDirectionArrow_State, "radialSegments" | "depthTest" | "lineLength" | "lineThickness" | "headRadius" | "headLength" | "shaftStyle" | "dashLength" | "gapLength"> & Partial<Pick<UDirectionArrow_State, "headRatio">>;

/**
     * 그룹 생성 시 결정되는 기본 스타일 옵션입니다.
     */
    type UDirectionArrowStyleDefaults = {
        /**
         * 기본 색상 또는 색상 함수
         */
        color: UDirectionArrowColor;
        /**
         * 기본 투명도 또는 투명도 함수
         */
        opacity: UDirectionArrowOpacity;
    };

/**
     * 동일 topology(radialSegments/depthTest) 화살표들을 담는 InstancedMesh bucket입니다.
     */
    type UDirectionArrowBucket = {
        /**
         * bucket key(topology를 담은 JSON 문자열)
         */
        key: string;
        /**
         * instancing용 mesh
         */
        mesh: three.InstancedMesh<three.BufferGeometry, three.ShaderMaterial>;
        /**
         * instance attribute가 포함된 geometry
         */
        geometry: three.BufferGeometry;
        /**
         * 화살표 material
         */
        material: three.ShaderMaterial;
        /**
         * 현재 InstancedMesh capacity
         */
        capacity: number;
        /**
         * 사용 중인 instance 개수
         */
        count: number;
        /**
         * bucket 내부 index 순서의 화살표 id 목록
         */
        ids: Array<number>;
    };

/**
     * 화살표 id가 어느 bucket의 몇 번째 instance인지 기록하는 레코드입니다.
     */
    type UDirectionArrowRecord = {
        /**
         * 소속 bucket
         */
        bucket: UDirectionArrowBucket;
        /**
         * bucket 내부 instance index
         */
        index: number;
    };

/**
     * 화살표가 추적하는 target 객체가 가질 수 있는 멤버(duck-typing) 형태입니다.
     */
    type UDirectionArrowTarget = {
        /**
         * 위치를 반환하는 함수
         */
        getVectorPosition?: () => three.Vector3;
        /**
         * 위치
         */
        position?: three.Vector3 | three.Vector3Like;
        /**
         * 내부 위치
         */
        _position?: three.Vector3;
        /**
         * 해제 여부
         */
        _disposed?: boolean;
        /**
         * 자원을 보존한 모델의 휴면 여부
         */
        _sleeping?: boolean;
        /**
         * 해제 여부 또는 이를 반환하는 함수
         */
        isDisposed?: boolean | (() => boolean);
        /**
         * 바라볼 지점 또는 바라보게 하는 함수
         */
        lookAt?: three.Vector3 | ((...args: any[]) => any);
        /**
         * 회전
         */
        quaternion?: three.Quaternion;
        /**
         * 내부 회전
         */
        _quaternion?: three.Quaternion;
        /**
         * 월드 회전을 반환하는 함수
         */
        getWorldQuaternion?: (arg0: three.Quaternion) => three.Quaternion;
    };

export type { InputColorCallback, InputOpacityCallback, UDirectionArrowBucket, UDirectionArrowColor, UDirectionArrowGeometryDefaults, UDirectionArrowGroupCO, UDirectionArrowOpacity, UDirectionArrowRecord, UDirectionArrowShape, UDirectionArrowStyleContext, UDirectionArrowStyleDefaults, UDirectionArrowTarget, UDirectionArrow_State };
