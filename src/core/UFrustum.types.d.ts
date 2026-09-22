// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCamera } from "./UCamera.js";
import type { UDrawArg } from "./UDrawArg.js";
import type { UFrustum } from "./UFrustum.js";
import type { UOrthographicCamera } from "./UOrthographicCamera.js";

/**
     * `UFrustum.setCameraInfo()`에 넘기는 카메라 수치 옵션입니다. 실제 카메라 객체 없이 가상의 시야 형태만으로 프러스텀을 만들 때 사용합니다. <br>
     * 원근 형태(`type`이 `frustum`·`sphere`)에서는 `fov`/`fovX`/`fovY`·`aspect`·`near`·`far`를, 직교 형태(`orthofrustum`)에서는 `left`/`right`/`top`/`bottom`·`zoom`·`near`·`far`를 사용하며 나머지는 무시됩니다.
     * 각도는 모두 degree, 거리는 프러스텀 로컬 단위(장착 후 월드 단위와 같음)입니다.
     */
    type UFrustumCameraInfo = {
        /**
         * 세로 시야각 (degree, 0 초과 180 미만). `fovY`가 없을 때 사용합니다
         */
        fov?: number;
        /**
         * 화면 가로/세로 비율. 원근 형태에서 가로 폭을 계산합니다
         */
        aspect?: number;
        /**
         * 가까운 절단면까지의 거리. 0.000001 미만은 0.000001로 보정됩니다
         */
        near?: number;
        /**
         * 먼 절단면까지의 거리. `near` 이하이면 `near`보다 조금 크게 보정됩니다
         */
        far?: number;
        /**
         * 가로 시야각 (degree). 0보다 크고 `fovY`가 0 이하이면 가로 기준으로 세로를 `aspect`로 나눠 계산합니다
         */
        fovX?: number;
        /**
         * 세로 시야각 (degree). 0보다 크면 `fov`보다 우선합니다
         */
        fovY?: number;
        /**
         * 직교 형태의 왼쪽 경계. `zoom`으로 나눈 값이 near·far 면에 그대로 투영됩니다
         */
        left?: number;
        /**
         * 직교 형태의 오른쪽 경계. `left`와 같으면 아주 작은 폭으로 보정됩니다
         */
        right?: number;
        /**
         * 직교 형태의 위쪽 경계
         */
        top?: number;
        /**
         * 직교 형태의 아래쪽 경계. `top`과 같으면 아주 작은 높이로 보정됩니다
         */
        bottom?: number;
        /**
         * 직교 형태 확대 배율. 경계 값을 이 값으로 나누므로 클수록 좁은 영역을 봅니다. 0 이하는 0.000001로 보정됩니다
         */
        zoom?: number;
    };

/**
     * UFrustum 생성자 옵션입니다.
     */
    type UFrustumCO = {
        /**
         * 프러스텀 종류. `UFrustum.FrustumType` 값을 사용한다. `frustum`은 원근 카메라 추적, `orthofrustum`은 직교 카메라 추적, `sphere`는 예약 값이다.
         */
        type?: "frustum" | "sphere" | "orthofrustum";
        /**
         * BASIC 타입에서 frustumInner_ 계산에 사용할 최소 far 거리.
         */
        minfar?: number;
        /**
         * frustumInner_ 계산 시 카메라 target을 읽을 UDrawArg.
         */
        drawArg?: UDrawArg | null;
        /**
         * target 기준 로컬 회전 offset. 값이 2π보다 크면 degree로 해석한다.
         */
        rotation?: UFrustumEulerLike;
        /**
         * degree 단위 항공 자세 offset. x=pitch, y=yaw, z=roll.
         */
        pitchYawRoll?: three.Vector3Like;
        /**
         * target 로컬 기준 전방축.
         */
        targetForward?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * target 로컬 기준 위쪽축.
         */
        targetUp?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * target 로컬 기준 장착 방향.
         */
        axis?: three.Vector3 | three.Vector3Like | Array<number>;
    };

/**
     * Euler와 호환되는 회전 옵션입니다. import('three').Euler 인스턴스와 `{x, y, z, order}` 형태의 일반 객체를 모두 받습니다.
     *
     * 일반 객체로 줄 때 x·y·z의 절댓값이 2π(약 6.283)보다 크면 degree로 보고 radian으로 변환하고, 그 이하이면 radian으로 그대로 사용합니다. 유한하지 않은 값은 0이 됩니다.
     */
    type UFrustumEulerLike = {
        /**
         * X축 회전각. radian 또는 degree(절댓값이 2π 초과일 때)
         */
        x?: number;
        /**
         * Y축 회전각. radian 또는 degree(절댓값이 2π 초과일 때)
         */
        y?: number;
        /**
         * Z축 회전각. radian 또는 degree(절댓값이 2π 초과일 때)
         */
        z?: number;
        /**
         * Euler 회전 순서. 알 수 없는 값이면 `XYZ`를 사용한다.
         */
        order?: string;
        /**
         * 일부 레거시 객체가 보관하는 회전 순서 필드.
         */
        _order?: string;
        /**
         * true이면 값을 radian으로 보고 degree 변환을 하지 않는다.
         */
        isEuler?: boolean;
    };

/**
     * UFrustum이 위치·자세를 추적할 target 객체의 최소 계약입니다.
     * U3dComponentPosition처럼 lookAt 좌표를 가진 컴포넌트와 import('three').Object3D 유사 객체를 모두 받습니다.
     * lookAt이 함수가 아닌 좌표값이면 quaternion보다 우선해 시선 방향으로 사용합니다.
     */
    type UFrustumTarget = {
        /**
         * 월드 위치를 반환하는 함수. 있으면 position보다 우선한다.
         */
        getVectorPosition?: () => three.Vector3;
        /**
         * 월드 위치.
         */
        position?: three.Vector3;
        /**
         * 회전 quaternion.
         */
        quaternion?: three.Quaternion;
        /**
         * quaternion 대신 사용할 내부 회전 quaternion.
         */
        _quaternion?: three.Quaternion;
        /**
         * 회전 Euler. 현재 UFrustum은 자세 계산에 이 값을 사용하지 않으며(`quaternion`·`lookAt`만 사용) 타입 호환을 위해 허용합니다.
         */
        rotation?: three.Euler;
        /**
         * 바라보는 월드 좌표. Object3D의 lookAt 메서드는 좌표값으로 취급하지 않는다.
         */
        lookAt?: three.Vector3 | three.Vector3Like | Array<number> | ((arg0: three.Vector3 | number, arg1: number | undefined, arg2: number | undefined) => void);
    };

/**
     * UFrustum이 갱신에 사용하는 카메라입니다. 원근 카메라는 BASIC, 직교 카메라는 ORTHO 타입 프러스텀과 함께 사용합니다.
     */
    type UFrustumCamera = UCamera | UOrthographicCamera;

/**
     * UFrustum 변경 이벤트 리스너입니다. 변경된 프러스텀을 인자로 받습니다.
     */
    type UFrustumChangeListener = (arg0: UFrustum) => void;

/**
     * setFromMatrix()가 frustumInner_ 계산에 재사용하는 카메라 복제본과 행렬 캐시입니다.
     */
    type UFrustumInnerCache = {
        /**
         * ORTHO 타입에서 사용할 직교 카메라 복제본.
         */
        ortho: UOrthographicCamera | null;
        /**
         * ortho의 projection * matrixWorldInverse 행렬.
         */
        orthoMat: three.Matrix4 | null;
        /**
         * BASIC 타입에서 far만 조정해 사용할 원근 카메라 복제본.
         */
        pers: UCamera | null;
        /**
         * pers의 projection * matrixWorldInverse 행렬.
         */
        persMat: three.Matrix4 | null;
        /**
         * SPHERE 타입용 예약 필드.
         */
        sphere: three.Sphere | null;
    };

export type { UFrustumCO, UFrustumCamera, UFrustumCameraInfo, UFrustumChangeListener, UFrustumEulerLike, UFrustumInnerCache, UFrustumTarget };
