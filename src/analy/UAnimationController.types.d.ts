// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnimationController } from "./UAnimationController.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * UAnimationController 생성자에 전달하는 주행 애니메이션 설정입니다. <br>
     */
    type UAnimationControllerCO_Content = {
        /**
         * 컨트롤러를 구분할 이름입니다. <br>
         */
        name?: string;
        /**
         * 카메라 위치 조회와 화면 갱신 요청에 사용할 그리기 정보입니다. <br>
         * 누락하면 초기화를 중단합니다. <br>
         */
        drawArg: UDrawArg;
        /**
         * 프레임 경과 시간(밀리초)과 보간된 현재 구간 진행률(0~1)을 순서대로 받아 모델 상태를 갱신할 함수입니다. <br>
         * 누락하면 초기화를 중단합니다. <br>
         */
        animation: (arg0: number, arg1: number) => void;
        /**
         * 초기 이동 구간의 전체 거리(미터)입니다. <br>
         * 값이 커지면 같은 속도에서 도착까지 더 오래 걸립니다. <br>
         */
        distance: number;
        /**
         * 초기 이동 구간의 목표 시간(밀리초)입니다. <br>
         * `start(false)`로 시작하면 이 시간을 유지해 속도를 조절하며, 기본 `start()`는 현재 거리와 속도로 목표 시간을 다시 계산합니다. <br>
         */
        duration?: number;
        /**
         * 초기 이동 구간의 출발 월드 위치입니다. <br>
         */
        from?: WorldPositionVector3;
        /**
         * 초기 이동 구간의 도착 월드 위치입니다. <br>
         */
        to?: WorldPositionVector3;
        /**
         * 초기 주행 속도(킬로미터/시)입니다. <br>
         * 내부 이동 계산에서는 미터/초로 변환합니다. <br>
         */
        speed?: number;
        /**
         * 진행률에 적용할 보간 방식(easing) 이름입니다. <br>
         * 지원하지 않는 이름은 경고 후 선형 진행률을 사용합니다. <br>
         */
        easing?: string;
        /**
         * `true`이면 주행 중 카메라 추적(trace)을 활성화해 화면 갱신을 요청합니다. <br>
         */
        isTrace?: boolean;
        /**
         * `true`이면 카메라의 프레임 이동 거리에 따라 동적 갱신 거리(dynamic update distance)를 다시 계산합니다. <br>
         */
        dynamicUpdateDistance?: boolean;
        /**
         * 동적 거리 계산을 끈 경우 화면 갱신 거리(update distance)로 사용할 카메라 이동 기준(미터)입니다. <br>
         */
        updateDistance?: number;
        /**
         * 생성 시 라디안으로 변환해 저장하는 갱신 각도(update angle) 기준(도)입니다. <br>
         * 현재 화면 갱신 판단에는 사용하지 않습니다. <br>
         */
        updateAngle?: number;
        /**
         * 마지막 이동 구간이 끝났을 때 컨트롤러를 인수로 호출할 함수입니다. <br>
         */
        completeFunc?: null | ((arg0: UAnimationController) => void);
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * UAnimationController 생성자에 전달하는 주행 애니메이션 설정입니다. <br>
     */
    type UAnimationControllerCO = Omit<Omit<UEventDispatcherCO, never> & UAnimationControllerCO_Content, never>;

/**
     * 다음 외부 업데이트에서 적용할 구간·거리·속도 변경 명령(next frame command)입니다. <br>
     */
    type UAnimationNextFrameCommand = {
        type: "segment";
        from: WorldPositionVector3;
        to: WorldPositionVector3;
        durationMs: number | undefined;
    } | {
        type: "distance";
        distance: number;
        durationMs: number | undefined;
    } | {
        type: "speed";
        speed: number;
    };

/**
     * 애니메이션 컨트롤러의 상태 변화와 프레임 갱신을 구분하는 이벤트 이름 모음입니다. <br>
     */
    type UAnimationControllerEMI = {
        /**
         * 주행을 시작해 애니메이션 관리자에 등록한 직후 발생하며 `data`로 컨트롤러를 전달하는 이벤트 이름입니다. <br>
         */
        START: string;
        /**
         * 마지막 이동 구간이 끝나고 다음 경유지가 없을 때 발생하며 `data`는 전달하지 않는 이벤트 이름입니다. <br>
         */
        COMPLETE: string;
        /**
         * 이동 구간이나 전체 거리를 새 값으로 적용했을 때 발생하며 `data`로 컨트롤러를 전달하는 이벤트 이름입니다. <br>
         */
        CHANGE: string;
        /**
         * 현재 이동 구간의 진행 거리와 시간이 초기화될 때 발생하며 `data`로 컨트롤러를 전달하는 이벤트 이름입니다. <br>
         */
        INIT: string;
        /**
         * 일시 정지 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다. <br>
         */
        PAUSE: string;
        /**
         * 재개 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다. <br>
         */
        RESUME: string;
        /**
         * 재시작 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다. <br>
         */
        RESTART: string;
        /**
         * 정지 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다. <br>
         */
        STOP: string;
        /**
         * 해제 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다. <br>
         */
        DISPOSE: string;
        /**
         * 애니메이션 함수를 실행하기 직전에 `data`로 현재 구간 진행률 `rate`, 전체 이동 거리(미터) `dist`, 일시 정지를 제외한 전체 실행 시간(밀리초) `time`, 이동 계산에 적용하는 속도(킬로미터/시) `speed`를 전달하는 이벤트 이름입니다. <br>
         */
        BEFOREUPDATE: string;
        /**
         * 각 이동 구간의 도착점에 도달했을 때 `data`로 현재 구간 진행률 `rate`, 전체 이동 거리(미터) `dist`, 일시 정지를 제외한 전체 실행 시간(밀리초) `time`, 이동 계산에 적용하는 속도(킬로미터/시) `speed`를 전달하는 이벤트 이름입니다. <br>
         */
        ARRIVE: string;
    };

export type { UAnimationControllerCO, UAnimationControllerCO_Content, UAnimationControllerEMI, UAnimationNextFrameCommand };
