// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { CONTROL_TYPE } from "./UMapControlBase.js";

/**
     * 지도 입력 감도와 관성 설정이다. getFactor()가 반환한 객체의 속성을 직접 변경한다.
     * 관성 숫자 설정의 누락·비유한 값·음수는 계산 시 해당 기본값으로 대체하며 저장된 원본 값은 유지한다. 각 속성에 명시한 범위를 함께 따른다.
     * 감속·최소 속도·최대 속도·표본 시간의 0도 기본값으로 대체한다. 최대 속도가 최소 속도 이하이면 관성을 시작하지 않는다.
     * 직접 대입 시 검증 예외를 던지지 않으므로 여러 속성을 함께 바꿀 때는 호출 측에서 모두 검증한 후 반영한다.
     * 250ms를 초과한 프레임 공백이나 충돌·각도 제한으로 더 움직일 수 없는 경우 관성이 중단될 수 있다.
     * 세기·최대 속도·평활 시간은 다음 관성 시작에, 감속·최소 속도·끄기 설정은 진행 중인 관성에도 반영한다.
     */
    type FactorOption = {
        /**
         * pan 이동 타입, 기본값=1 (앵커사용 =1, 기본 =2, 일인칭 =3)
         */
        moveType: CONTROL_TYPE;
        /**
         * rotation 회전 타입, 기본값=1 (앵커사용 =1, 기본 =2, 일인칭 =3)
         */
        rotationType: CONTROL_TYPE;
        /**
         * zoom 이동 타입, 기본값=1 (앵커사용 =1, 기본 =2, 일인칭 =3)
         */
        zoomType: CONTROL_TYPE;
        /**
         * 일인칭 이동 시, 이동 속도, 기본값=50
         */
        interMoveSpeed: number;
        /**
         * 일인칭 회전 시, 회전 속도, 기본값=3
         */
        interRotationSpeed: number;
        /**
         * 일인칭 줌 이동 시, 줌 이동 속도, 기본값=10
         */
        interZoomSpeed: number;
        /**
         * 지면 충돌 사용시, 지면 고도와 이값이 더해져, 카메라 고도와 충돌 판정이 이루어 진다, 기본값=6
         */
        collisionFactor: number;
        /**
         * 지면 고도 정보를 가져올때, 더해지는 오프셋 값, 기본값=0
         */
        collisionOffset: number;
        /**
         * 일인칭 모드로 전환활 키보드 키 입력값, 해당 키코드의 키가 down 시, 일인칭 모드로 전환, 기본값=SHIFT(16)
         */
        firstPersonModeKey: number;
        /**
         * 줌 인 이동시, 타겟(앵커)와 카메라 사이의 최소 간격, 이값 이상으로 타겟(앵커)에 카메라가 가까워 지지 않는다, 기본값=-1
         */
        minDistance: number;
        /**
         * 줌 아웃 이동시, 타겟(앵커)와 카메라 사이의 최대 간격, 이값 이상으로 타겟(앵커)와 카메라가 멀어 지지 않는다, 기본값=306824
         */
        maxDistance: number;
        /**
         * 키보드 이동시, 키 입력 한번당, 카메라의 이동 속도, 기본값=11
         */
        keyPanSpeed: number;
        /**
         * 마우스 pan 이동시, pan 이동 속도(민감도), 기본값=1.0
         */
        panSpeed: number;
        /**
         * 마우스 pan 종료 후 관성 사용 여부. false이면 놓는 즉시 멈춘다.
         */
        panInertiaEnabled?: boolean;
        /**
         * 놓을 때의 관성 속도 배율. 유한한 0 이상이며 0이면 관성을 끈다. 커질수록 더 멀리 이동한다.
         */
        panInertiaFactor?: number;
        /**
         * 실제 앵커 팬의 관성 시작 속도에 추가로 곱하는 배율(0~1). 기존 세기·속도 상한 적용 후 곱한다. 0은 앵커 팬 관성 끄기, 1은 기존 세기이며 1 초과는 1로 제한한다. 누락·비유한 값·음수는 0.5를 사용한다. 일반 팬 대체·1인칭 이동에는 적용하지 않으며, 진행 중인 앵커 팬 관성도 0으로 설정하면 다음 프레임에서 취소한다.
         */
        panAnchorInertiaFactor?: number;
        /**
         * 초당 지수 감쇠 계수(1/s). 유한한 양수이며 클수록 빠르게 멈춘다. 4는 여유롭게, 12는 짧게 감속한다.
         */
        panInertiaDamping?: number;
        /**
         * 관성 시작·정지 문턱값(CSS px/s). 유한한 양수이며 이 속도 이하는 움직이지 않는다.
         */
        panInertiaMinSpeed?: number;
        /**
         * 관성 시작 속도 상한(CSS px/s). 유한한 양수이며 빠른 드래그의 과도한 이동을 제한한다. 최소 속도 이하이면 관성을 시작하지 않는다.
         */
        panInertiaMaxSpeed?: number;
        /**
         * 속도 추정의 평활 시간과 마지막 이동의 유효 시간(ms). 유한한 양수이며, 이 시간보다 오래 멈췄다 놓으면 관성이 생기지 않는다. 커질수록 여러 입력의 속도를 완만하게 반영한다.
         */
        panInertiaSampleTime?: number;
        /**
         * 마우스 회전 종료 후 관성 사용 여부. false이면 놓는 즉시 회전을 멈춘다. 팬 관성과 독립적으로 설정한다.
         */
        rotateInertiaEnabled?: boolean;
        /**
         * 놓을 때의 회전 입력 속도 배율. 유한한 0 이상이며 0이면 회전 관성을 끈다.
         */
        rotateInertiaFactor?: number;
        /**
         * 회전 관성의 초당 지수 감쇠 계수(1/s). 유한한 양수이며 클수록 빠르게 멈춘다.
         */
        rotateInertiaDamping?: number;
        /**
         * 회전 관성 시작·정지 문턱값(CSS px/s). 각속도가 아닌 화면 입력 속도이며 유한한 양수다.
         */
        rotateInertiaMinSpeed?: number;
        /**
         * 회전 관성 시작 입력 속도 상한(CSS px/s). 유한한 양수이며 최소 속도 이하이면 관성을 시작하지 않는다.
         */
        rotateInertiaMaxSpeed?: number;
        /**
         * 회전 속도 평활 시간과 마지막 이동의 유효 시간(ms). 유한한 양수이며 이 시간보다 오래 멈췄다 놓으면 관성을 시작하지 않는다.
         */
        rotateInertiaSampleTime?: number;
        /**
         * 마우스 회전시, 회전 속도(민감도), 기본값=1.0
         */
        rotateSpeed: number;
        /**
         * 기존 수평 입력 회전량에 곱하는 배율. 마우스·터치·회전 관성에 적용하며 0이면 해당 축 입력을 막는다. 유한한 0 이상이며 잘못된 값은 1로 대체한다. 각도 지정·자동 회전에는 적용하지 않는다.
         */
        rotateHorizontalSpeed?: number;
        /**
         * 기존 수직 입력 회전량에 곱하는 배율. 마우스·터치·회전 관성에 적용하며 0이면 해당 축 입력을 막는다. 유한한 0 이상이며 잘못된 값은 1로 대체한다. 각도 지정·자동 회전에는 적용하지 않는다.
         */
        rotateVerticalSpeed?: number;
        /**
         * 마우스 줌 이동시, 줌 이동 속도(민감도), 줌이동은 카메라가 지면과 가까워질 수록 줌 이동량이 감소한다(로그 스케일 적용), 기본값=1.0
         */
        zoomSpeed: number;
        /**
         * 마우스 줌 인 이동시, 줌 최소 이동량, 줌 이동량은 이값 이하로 감소하지 않는다, 기본값=0.1
         */
        zoomInMinScale: number;
        /**
         * 마우스 줌 아웃 이동시, 줌 최소 이동량, 줌 이동량은 이값 이하로 감소하지 않는다, 기본값=0.1
         */
        zoomOutMinScale: number;
        /**
         * 카메라 자동 회전 기능 사용시, 회전 속도, 기본값=2.0
         */
        autoRotateSpeed: number;
        /**
         * 앵커 팬 무브 이동량 제한, 이동량이 제한값을 넘으면 기본 팬무브로 작동한다. 기본값=1
         */
        panMoveAmountLimit: number;
        /**
         * 팬 무브 시, '앵커가 생성 생성될 수 있는 범위'는 지면에서 부터의 카메라 높이 * panAnchorRange값으로 카메라 높이에따라 변한다. 카메라 기준에서 이범위 밖의 앵커가 인식되면 기본 팬무브로 전환된다. 기본값=8
         */
        panAnchorRange: number;
        /**
         * '앵커가 생성 생성될 수 있는 범위'의 최소값, 카메라 높이에 따라 변하는 '앵커가 생성 생성될 수 있는 범위'는 이값 이하로는 작아지지 않는다. 기본값=200
         */
        panAnchorMinDistance: number;
        /**
         * '앵커가 생성 생성될 수 있는 범위'의 최대값, 카메라 높이에 따라 변하는 '앵커가 생성 생성될 수 있는 범위'는 이값 이상으로는 커지지 않는다. 기본값=2200
         */
        panAnchorMaxDistance: number;
        /**
         * 회전 시, '입력된 앵커로 회전을 실행하는 여부 범위'는 지면에서 부터의 카메라 높이 * rotateAnchorRange값으로 카메라 높이에따라 변한다. 카메라 기준에서 이범위 밖의 앵커가 인식되면 앵커가 화면 중심점으로 변경된다. 기본값=15
         */
        rotateAnchorRange: number;
        /**
         * '입력된 앵커로 회전을 실행하는 여부 범위'의 최소값, 카메라 높이에 따라 변하는 '입력된 앵커로 회전을 실행하는 여부 범위'는 이값 이하로는 작아지지 않는다. 기본값=200
         */
        rotateAnchorMinDistance: number;
        /**
         * 앵커 회전 시, 카메라 polarAngle의 최소 각도, 카메가 지면 수직으로 바라볼때 polarAngle은 0이 되고, 지면과 수평으로 붙어 지평선을 바라볼때는 polarAngle은 90도가 된다. 기본값=degToRad(5)
         */
        rotateAnchorMinPolarAngle: number;
        /**
         * 줌 이동시, 앵커를 생성할때, 앵커 좌표를 계산하기위한 객체 검색 제외 반경, 카메라 기준 이값 이내의 객체들을 앵커를 생성하기 위한 검색에 제외된다. 기준값=2
         */
        nearExceptionRange: number;
    };

export type { FactorOption };
