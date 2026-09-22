// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "./UDrawArg.js";
import type { UFrustumCO, UFrustumCamera, UFrustumCameraInfo, UFrustumChangeListener, UFrustumTarget } from "./UFrustum.types.js";

/**
 * ~extends import('three').Frustum <br>
 * 카메라나 센서가 "볼 수 있는 공간"을 표현하는 프러스텀(절두체) 클래스입니다. <br>
 * 프러스텀은 위·아래·왼쪽·오른쪽·near(가까운)·far(먼) 여섯 개 평면으로 둘러싸인 잘린 피라미드 모양의 공간이며,
 * 어떤 객체(박스·점)가 이 공간 안에 있는지 판정(컬링·가시성 검사)하는 데 사용합니다. <br>
 * Three.js `Frustum`을 확장하여 두 가지 사용 방식을 제공합니다.
 * - 카메라 추적: `update(camera)`로 현재 카메라가 보는 공간을 매 프레임 갱신합니다. 렌더러의 타일·객체 컬링에 사용합니다.
 * - 대상 사물에 장착: `setTarget()`으로 대상 사물(드론·차량 등)에 붙이고 `updateTarget()`으로 위치·자세를 따라가게 합니다.
 * 자세·행렬이 바뀔 때마다 `addChangeListener()`로 등록한 이벤트 리스너가 호출됩니다.
 *
 * @group core
 * @extends {THREE.Frustum}
 */
declare class UFrustum extends three.Frustum {
    /**
     * 프러스텀 종류. 생성 옵션 `type`과 `type` 프로퍼티에 사용하는 값입니다.
     * - `BASIC`(`'frustum'`): 원근 카메라용. `update()`가 카메라 높이에 비례한 far 거리로 평면을 다시 계산하고, 내부 프러스텀(`frustumInner_`)은 `minFar` 이상의 far로 별도 계산합니다.
     * - `ORTHO`(`'orthofrustum'`): 직교(평행 투영) 카메라용. `intersectsBox()`가 카메라 far까지 확장한 내부 프러스텀으로 판정합니다.
     * - `SPHERE`(`'sphere'`): 예약된 값이며 현재는 `update()`에서 카메라 행렬을 그대로 사용합니다.
     *
     * @readonly
     *
     * @type {{BASIC: 'frustum', SPHERE: 'sphere', ORTHO: 'orthofrustum'}}
     */
    static readonly FrustumType: {
        BASIC: "frustum";
        SPHERE: "sphere";
        ORTHO: "orthofrustum";
    };
    /**
     * 프러스텀을 생성합니다. <br>
     * 평면 인자 `p0`~`p5`를 생략하면 Three.js 기본값(원점을 지나는 기본 평면)으로 시작하며,
     * 실제 공간은 이후 `update(camera)`, `setCameraInfo()` 또는 `setFromMatrix()`로 채워집니다.
     * `p0`~`p5`는 Three.js `Frustum`과 같은 순서로 각각 오른쪽·왼쪽·아래·위·far·near 평면입니다.
     *
     * @param {Partial<UFrustumCO>} [opt={}] 생성 옵션. 종류(`type`), 내부 프러스텀 최소 far(`minfar`), 카메라 target을 읽을 `drawArg`, 컴포넌트 장착용 `rotation`·`pitchYawRoll`·`axis`·`targetForward`·`targetUp`
     * @param {import('three').Plane} [p0] 오른쪽 평면. 생략하면 기본 평면
     * @param {import('three').Plane} [p1] 왼쪽 평면. 생략하면 기본 평면
     * @param {import('three').Plane} [p2] 아래 평면. 생략하면 기본 평면
     * @param {import('three').Plane} [p3] 위 평면. 생략하면 기본 평면
     * @param {import('three').Plane} [p4] far(먼 쪽) 평면. 생략하면 기본 평면
     * @param {import('three').Plane} [p5] near(가까운 쪽) 평면. 생략하면 기본 평면
     */
    constructor(opt?: Partial<UFrustumCO>, p0?: three.Plane, p1?: three.Plane, p2?: three.Plane, p3?: three.Plane, p4?: three.Plane, p5?: three.Plane);
    /**
     * 프러스텀 종류. `UFrustum.FrustumType`의 값 중 하나이며 생성 후 바꾸지 않습니다. 종류에 따라 `update()`와 `intersectsBox()`의 계산 방식이 달라집니다.
     * @type {'frustum' | 'sphere' | 'orthofrustum'}
     */
    type: "frustum" | "sphere" | "orthofrustum";
    /**
     * `BASIC` 타입에서 내부 프러스텀(`frustumInner_`)의 far 거리 하한(월드 단위). 카메라에서 지도 조작 중심점(`_mapControl.target`)까지의 거리가 이 값보다 작아도 far는 이 값 이상으로 유지됩니다.
     * @type {number}
     */
    minFar: number;
    /**
     * 메인 프러스텀과 별도로 관리하는 내부 프러스텀. `setFromMatrix(m, camera)`가 `drawArg`가 있을 때만 갱신하며,
     * `BASIC`은 `minFar` 이상의 far로, `ORTHO`는 카메라 far 전체로 계산합니다. `ORTHO` 타입의 `intersectsBox()`는 이 프러스텀으로 판정합니다.
     * @type {import('three').Frustum}
     */
    frustumInner_: three.Frustum;
    /**
     * 내부 프러스텀 계산에 필요한 앱·지도 조작 정보를 제공하는 렌더 인자. null이면 `setFromMatrix()`가 내부 프러스텀을 갱신하지 않습니다.
     * @type {import('@UDrawArg').UDrawArg | null}
     */
    drawArg: UDrawArg | null;
    /**
     * 거리 값 보관용 프로퍼티. 이 클래스는 값을 쓰거나 읽지 않으며 0으로 시작합니다. 외부 호출자가 임의 거리 기록에 사용할 수 있습니다.
     * @type {number}
     */
    dist: number;
    /**
     * `SPHERE` 타입용으로 예약된 경계 구. 현재 이 클래스는 값을 설정하지 않으므로 undefined로 유지됩니다.
     * @type {import('three').Sphere | undefined}
     */
    sphere: three.Sphere | undefined;
    /**
     * 마지막 `update(camera)` 호출 시점의 카메라 월드 위치 복사본. 어느 카메라 위치에서 계산된 프러스텀인지 확인하는 용도이며 매 `update()`마다 덮어씁니다.
     * @type {import('three').Vector3}
     */
    updatePosition: three.Vector3;
    /**
     * 컴포넌트 장착 시 target 월드 위치에 더하는 위치 offset(월드 단위). Three.js `Object3D.position`과 이름은 같지만 절대 위치가 아닌 상대 이동량입니다. `updateTarget()`이 읽습니다.
     * @type {import('three').Vector3}
     */
    position: three.Vector3;
    /**
     * 컴포넌트 장착 시 target 자세 계산이 끝난 뒤 추가로 합성하는 로컬 회전 offset(radian Euler). 생성 옵션 `rotation`에서 변환되며, 항공 자세(`setPitchYawRoll`)와는 별개로 적용됩니다.
     * @type {import('three').Euler}
     */
    rotation: three.Euler;
    _pitchYawRoll: three.Euler;
    /**
     * `rotation`을 quaternion으로 변환한 값. `updateTarget()`이 매 호출마다 `rotation`에서 다시 계산하므로 직접 수정한 값은 유지되지 않습니다.
     * @type {import('three').Quaternion}
     */
    quaternion: three.Quaternion;
    /**
     * 컴포넌트 장착 시 월드 행렬에 합성하는 크기 배율. 기본 (1, 1, 1)이며 프러스텀 표시 크기를 조정할 때 사용합니다.
     * @type {import('three').Vector3}
     */
    scale: three.Vector3;
    /**
     * `updateTarget()`이 계산한 프러스텀의 월드 변환 행렬(target 위치 + `position` offset, target 자세 + 항공 자세 + `rotation`, `scale`). 표시용 helper가 이 행렬을 읽어 프러스텀을 그립니다.
     * @type {import('three').Matrix4}
     */
    matrix: three.Matrix4;
    /**
     * 항상 false. `matrix`는 Three.js의 자동 갱신이 아니라 `updateTarget()`이 직접 계산함을 나타냅니다.
     * @type {boolean}
     */
    matrixAutoUpdate: boolean;
    /**
     * `setTarget()`으로 등록한 추적 대상. undefined이면 `updateTarget()`은 아무 것도 하지 않습니다.
     * @type {UFrustumTarget | undefined}
     */
    targetObject: UFrustumTarget | undefined;
    /** @type {Set<UFrustumChangeListener>} */
    _changeListeners: Set<UFrustumChangeListener>;
    _previousOrientationDirection: three.Vector3;
    _previousOrientationUp: three.Vector3;
    _hasPreviousOrientation: boolean;
    /**
     * target 로컬 좌표계에서 "전방"으로 볼 축(정규화된 단위 벡터). target에 `lookAt` 좌표가 없을 때 target quaternion으로 이 축을 회전시켜 진행 방향을 구합니다. 기본 (0, 1, 0) = +Y.
     * @type {import('three').Vector3}
     */
    targetForward: three.Vector3;
    /**
     * target 로컬 좌표계에서 "위쪽"으로 볼 축(정규화된 단위 벡터). 프러스텀 화면의 위쪽 방향을 정할 때 기준이 됩니다. 기본 (0, 0, 1) = +Z.
     * @type {import('three').Vector3}
     */
    targetUp: three.Vector3;
    /**
     * target 로컬 기준 장착 방향(정규화된 단위 벡터). 월드 고정축이 아니라 target에 붙은 좌표계(+X 오른쪽, +Y 전방, +Z 위쪽)에서 프러스텀이 향하는 축이며 기본 (0, 1, 0)은 기수/정북 방향입니다. 변경은 `setAxis()`로 합니다.
     * @type {import('three').Vector3}
     */
    axis: three.Vector3;
    /**
     * projection * matrixWorldInverse 행렬로 메인 프러스텀 평면을 설정하고, 카메라가 주어지면 frustumInner_도 갱신합니다.
     *
     * "projection * matrixWorldInverse"는 카메라의 투영 행렬과 월드 역행렬을 곱한 것으로, 월드 좌표를 카메라가 보는 화면 공간으로 옮기는 행렬입니다.
     * 내부 프러스텀(`frustumInner_`)은 `camera`와 `drawArg`(그리고 그 `_app`)가 모두 있을 때만 갱신되며, 없으면 메인 평면만 설정하고 변경 리스너를 호출합니다.
     *
     * @param {import('three').Matrix4} m 카메라의 projection * matrixWorldInverse 행렬. 이 행렬에서 6개 평면을 추출합니다
     * @param {UFrustumCamera} [camera] 내부 프러스텀 계산에 사용할 카메라. 생략하면 내부 프러스텀을 갱신하지 않습니다
     * @returns {this} 체이닝을 위한 자기 자신
     */
    setFromMatrix(m: three.Matrix4, camera?: UFrustumCamera): this;
    /**
     * 프러스텀의 평면이나 행렬이 바뀔 때 호출될 리스너를 등록합니다. 같은 함수를 여러 번 등록해도 한 번만 보관됩니다.
     * 함수가 아닌 값은 무시됩니다.
     * @param {UFrustumChangeListener} listener 변경 시 호출할 함수. 변경된 프러스텀을 인자로 받습니다
     * @returns {this} 체이닝을 위한 자기 자신
     */
    addChangeListener(listener: UFrustumChangeListener): this;
    /**
     * 등록된 변경 리스너를 제거합니다. 등록되지 않은 함수를 넘겨도 아무 일이 일어나지 않습니다.
     * @param {UFrustumChangeListener} listener `addChangeListener()`에 넘긴 것과 같은 함수 참조
     * @returns {this} 체이닝을 위한 자기 자신
     */
    removeChangeListener(listener: UFrustumChangeListener): this;
    /**
     * target 로컬 기준 장착 방향을 설정합니다.
     * +X는 오른쪽, +Y는 전방, +Z는 위쪽이며 기본값은 기수/정북 방향인 (0, 1, 0)입니다.
     * 입력 벡터는 내부에서 정규화되고, 길이가 0이거나 유한하지 않은 성분이 있으면 기본 장착축을 사용합니다.
     * target이 등록되어 있으면 즉시 `updateTarget()`으로 행렬을 다시 계산하고, 없으면 변경 리스너만 호출합니다.
     *
     * @param {import('three').Vector3 | import('three').Vector3Like | Array<number> | number} axis 장착 방향 벡터(`{x,y,z}` 객체·`[x,y,z]` 배열) 또는 x 성분 숫자. 숫자면 `y`, `z`와 함께 벡터를 구성합니다
     * @param {number} [y] `axis`가 숫자일 때의 y 성분. 생략·비유한수는 0
     * @param {number} [z] `axis`가 숫자일 때의 z 성분. 생략·비유한수는 0
     * @returns {UFrustum} 체이닝을 위한 자기 자신
     */
    setAxis(axis: three.Vector3 | three.Vector3Like | Array<number> | number, y?: number, z?: number): UFrustum;
    /**
     * 현재 target 로컬 장착 방향을 반환합니다.
     * 내부 Vector3가 외부에서 직접 변경되지 않도록 결과를 target에 복사합니다.
     *
     * @param {import('three').Vector3} [target] 결과를 담을 벡터. 생략하면 새 Vector3를 만듭니다
     * @returns {import('three').Vector3} target 로컬 좌표계의 정규화된 장착 방향(`target` 인자와 같은 객체)
     */
    getAxis(target?: three.Vector3): three.Vector3;
    /**
     * rotation과 독립된 항공 자세 offset을 설정합니다.
     * pitch와 yaw는 장착 자세 기준 시선 방향을 만들고, roll만 최종 시선축을 회전시킵니다.
     * 내부 자세는 quaternion으로 계산하므로 pitch가 ±90도를 지나도 면이 갑자기 반전되지 않습니다.
     * 모든 입력 단위는 degree이며 내부 계산 시 radian으로 변환합니다. NaN·Infinity 등 유한하지 않은 값은 0으로 처리됩니다.
     * target이 등록되어 있으면 즉시 `updateTarget()`으로 행렬을 다시 계산하고, 없으면 변경 리스너만 호출합니다.
     *
     * @param {number} [pitchDeg=0] 장착 방향 기준 위(+)/아래(−) 각도 (degree)
     * @param {number} [yawDeg=0] 장착 방향 기준 오른쪽(+)/왼쪽(−) 각도 (degree)
     * @param {number} [rollDeg=0] 시선축을 중심으로 기울이는 각도 (degree). 시선 방향은 바꾸지 않습니다
     * @returns {UFrustum} 체이닝을 위한 자기 자신
     */
    setPitchYawRoll(pitchDeg?: number, yawDeg?: number, rollDeg?: number): UFrustum;
    /**
     * 현재 독립 pitch/yaw/roll 값을 degree 단위 Vector3로 반환합니다.
     * x=pitch, y=yaw, z=roll입니다.
     *
     * @param {import('three').Vector3} [target] 결과를 담을 벡터. 생략하면 새 Vector3를 만듭니다
     * @returns {import('three').Vector3} degree 단위 (pitch, yaw, roll) 값(`target` 인자와 같은 객체)
     */
    getPitchYawRoll(target?: three.Vector3): three.Vector3;
    /**
     * 실제 카메라 객체 없이 시야각·화면 비율·near/far 같은 카메라 수치만으로 프러스텀 평면을 만듭니다. <br>
     * 결과는 프러스텀 로컬 좌표(원점에서 -Z 방향을 바라보고 +Y가 위쪽) 기준이며, 컴포넌트에 장착해 `updateTarget()`으로 월드에 배치하는 용도입니다.
     * `type`이 `ORTHO`면 `left`/`right`/`top`/`bottom`/`zoom`으로 직육면체 형태를, 그 외에는 `fov`·`fovX`·`fovY`·`aspect`로 원근 형태를 만듭니다.
     * 원근 형태에서 `fovX`만 주면 가로 시야각 기준으로 세로를 계산하고, `fovY`가 있으면 `fovY`를, 둘 다 없으면 `fov`를 세로 시야각으로 사용합니다.
     * `near`는 최소 0.000001, `far`는 `near`보다 크게 보정되며 유한하지 않은 값은 각 기본값으로 대체됩니다.
     *
     * @param {UFrustumCameraInfo} [cameraInfo] 카메라 수치 옵션. 생략하거나 객체가 아니면 모두 기본값을 사용합니다
     * @returns {this} 체이닝을 위한 자기 자신
     */
    setCameraInfo(cameraInfo?: UFrustumCameraInfo): this;
    /**
     * 컴포넌트의 위치/쿼터니언을 프러스텀 target으로 등록합니다.
     *
     * setTarget은 target만 저장하고 즉시 행렬을 갱신하지 않습니다.
     * 애니메이션 프레임 등 원하는 시점에 `updateTarget()`을 호출해 실제 갱신 시점을 제어합니다. (`update(camera)`는 카메라 기준 갱신으로 별개입니다.)
     * 이전과 다른 target을 등록하면 자세 연속성 계산에 쓰던 직전 자세 기록이 초기화됩니다. null·undefined는 무시됩니다.
     *
     * @param {UFrustumTarget} target 추적할 컴포넌트 또는 Object3D 유사 객체. 위치(`getVectorPosition()` 또는 `position`)와 자세(`lookAt` 좌표 또는 `quaternion`)를 제공해야 합니다
     * @returns {this} 체이닝을 위한 자기 자신
     */
    setTarget(target: UFrustumTarget): this;
    /**
     * 등록된 target의 현재 위치·자세로 프러스텀의 월드 행렬(`matrix`)을 다시 계산합니다. <br>
     * 위치는 target 월드 위치에 `position` offset을 더한 값이고, 자세는 target 진행 방향과 `axis`·항공 자세(pitch/yaw/roll)로 만든 quaternion 뒤에 `rotation`을 합성한 값입니다.
     * target이 없거나 target에서 위치를 얻을 수 없으면 아무 것도 바꾸지 않고 반환합니다.
     * @param {Partial<{emitChange: boolean}>} [options={}] `emitChange`가 false이면 행렬만 갱신하고 변경 리스너를 호출하지 않습니다. 기본 true
     * @returns {this} 체이닝을 위한 자기 자신
     */
    updateTarget(options?: Partial<{
        emitChange: boolean;
    }>): this;
    /**
     * 카메라 상태로 프러스텀을 갱신합니다.
     * BASIC 타입은 카메라 높이(z)에 비례한 far 값으로 projection 행렬을 재계산해 메인 평면을 설정하고, 그 외 타입은 카메라 행렬을 그대로 `setFromMatrix()`에 넘겨 갱신합니다.
     * 호출 시점의 카메라 위치는 `updatePosition`에 복사되며, 갱신 후 변경 리스너가 호출됩니다.
     *
     * @param {UFrustumCamera} camera 현재 렌더에 사용 중인 카메라. `projectionMatrix`, `matrixWorldInverse`, `position`, `near`가 최신 상태여야 합니다
     */
    update(camera: UFrustumCamera): void;
    /**
     * Three.js 기본 setFromProjectionMatrix로 평면을 직접 갱신하는 경우에도 변경 리스너(프러스텀을 화면에 그리는 표시용 helper 등)가 갱신을 감지할 수 있도록 감싼 메서드입니다.
     *
     * @override
     *
     * @param {import('three').Matrix4} m 카메라의 projection * matrixWorldInverse 행렬
     * @param {import('three').WebGLCoordinateSystem|import('three').WebGPUCoordinateSystem} [coordinateSystem] 투영 좌표계. 생략하면 Three.js 기본(WebGL)
     * @param {boolean} [reversedDepth] 깊이 값이 반전된 투영이면 true. 생략하면 false
     * @returns {this} 체이닝을 위한 자기 자신
     */
    override setFromProjectionMatrix(m: three.Matrix4, coordinateSystem?: 2000 | 2001, reversedDepth?: boolean): this;
    #private;
}

export type { UFrustum };
