// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnimationControllerCO, UAnimationControllerEMI } from "./UAnimationController.types.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 *
 * 모델의 위치를 거리와 속도에 맞춰 갱신하는 주행 애니메이션을 제어합니다. <br>
 * 시작·일시 정지·재개·정지와 이동 구간 변경을 제어하고 진행 상태를 조회할 수 있습니다. <br>
 *
 * @extends {UEventDispatcher}
 *
 * @ignore
 */
declare class UAnimationController extends UEventDispatcher {
    /**
     * 컨트롤러에서 사용하는 이벤트 이름 모음입니다. <br>
     *
     * @type {UAnimationControllerEMI}
     */
    static EVENT: UAnimationControllerEMI;
    /**
     * UAnimationController 클래스 생성자입니다. <br>
     *
     * @param {Partial<UAnimationControllerCO>} [opt={}] 이동 함수와 거리, 속도 및 카메라 추적 방식을 설정하는 생성 옵션입니다. <br>
     * `drawArg`, `animation`, `distance` 중 하나라도 없으면 오류를 기록하고 초기화를 중단합니다. <br>
     */
    constructor(opt?: Partial<UAnimationControllerCO>);
    /**
     * 현재 이동 구간의 출발 위치를 반환합니다. <br>
     * 반환된 객체를 변경하면 내부 출발 위치도 바뀌지만 구간 거리와 진행 상태는 다시 계산되지 않습니다. <br>
     *
     * @returns {WorldPositionVector3} 현재 구간의 출발 월드 위치 객체입니다. <br>
     */
    get from(): WorldPositionVector3;
    /**
     * 현재 이동 구간의 도착 위치를 반환합니다. <br>
     * 반환된 객체를 변경하면 내부 도착 위치도 바뀌지만 구간 거리와 진행 상태는 다시 계산되지 않습니다. <br>
     *
     * @returns {WorldPositionVector3} 현재 구간의 도착 월드 위치 객체입니다. <br>
     */
    get to(): WorldPositionVector3;
    /**
     * 현재 이동 구간 뒤에 대기 중인 경유지(waypoint) 수를 반환합니다. <br>
     *
     * @returns {number} 아직 처리하지 않은 경유지 개수입니다. <br>
     */
    get waypointQueueSize(): number;
    /**
     * 컨트롤러가 주행 중인지 반환합니다. <br>
     *
     * @returns {boolean} 시작되어 정지·완료되지 않은 상태이면 `true`입니다. <br>
     */
    get isRunning(): boolean;
    /**
     * 주행이 일시 정지되었는지 반환합니다. <br>
     *
     * @returns {boolean} 일시 정지 상태이면 `true`입니다. <br>
     */
    get isPaused(): boolean;
    /**
     * 도착 오차 디버그(debug) 출력을 켜거나 끕니다. <br>
     *
     * @param {boolean} val `true`이면 도착 시 오차 정보를 콘솔에 출력하고, `false`이면 출력하지 않습니다. <br>
     */
    set isDebug(val: boolean);
    /**
     * 도착 오차 디버그(debug) 출력의 활성화 여부를 반환합니다. <br>
     *
     * @returns {boolean} 도착 시 시간·거리 오차를 콘솔에 출력하면 `true`입니다. <br>
     */
    get isDebug(): boolean;
    /**
     * 현재 구간의 보간이 적용된 진행률(rate)을 반환합니다. <br>
     *
     * @deprecated {@link UAnimationController#updateRate}를 사용하십시오. <br>
     *
     * @returns {number} 일반 주행에서는 시작을 `0`, 도착을 `1`로 나타내며, `updateRate`에 직접 저장한 값은 이 범위를 벗어날 수 있습니다. <br>
     */
    get rate(): number;
    /**
     * 현재 구간의 진행률(update rate)을 검증이나 범위 제한 없이 직접 저장합니다. <br>
     * 누적 거리·시간과 애니메이션 위치는 함께 바뀌지 않습니다. <br>
     *
     * @param {number} rate `rate`와 `updateRate`가 반환할 새 진행률입니다. <br>
     * 다음 애니메이션 갱신에서 다시 계산될 수 있습니다. <br>
     */
    set updateRate(rate: number);
    /**
     * 현재 구간의 보간이 적용된 진행률(update rate)을 반환합니다. <br>
     *
     * @returns {number} 애니메이션 함수에 전달하는 현재 진행률입니다. <br>
     */
    get updateRate(): number;
    /**
     * 컨트롤러가 해제된 상태(disposed)인지 반환합니다. <br>
     *
     * @returns {boolean} `dispose()`가 호출되어 외부 참조와 콜백을 정리했으면 `true`입니다. <br>
     */
    get disposed(): boolean;
    /**
     * 현재 이동 구간의 누적 실행 시간(accumulated time)을 반환합니다. <br>
     *
     * @returns {number} 일시 정지 시간을 제외하고 현재 구간에서 누적한 시간(밀리초)입니다. <br>
     */
    get accumulatedTime(): number;
    /**
     * 현재 이동 구간의 누적 이동 거리(accumulated distance)를 검증이나 범위 제한 없이 직접 저장합니다. <br>
     * 진행률·누적 시간·전체 이동 기록·애니메이션 위치는 함께 바뀌지 않습니다. <br>
     *
     * @param {number} dist `accumulatedDistance`가 반환할 새 누적 거리(미터)입니다. <br>
     */
    set accumulatedDistance(dist: number);
    /**
     * 현재 이동 구간의 누적 이동 거리(accumulated distance)를 반환합니다. <br>
     *
     * @returns {number} 현재 구간의 출발점부터 이동한 거리(미터)입니다. <br>
     */
    get accumulatedDistance(): number;
    /**
     * 현재 이동 구간과 이전에 완료한 이동 구간에서 기록한 이동 거리(log distance)의 합계를 반환합니다. <br>
     * `start(true)`, `clear()`, `complete()`, 실행 중의 `stop()`으로 초기화됩니다. <br>
     *
     * @returns {number} 초기화 이후 기록한 이동 거리(미터)입니다. <br>
     * 생성 직후에는 값이 준비되지 않았으므로 `start(true)` 등으로 초기화한 뒤 조회하십시오. <br>
     */
    get logDistance(): number;
    /**
     * 현재 이동 구간과 이전에 완료한 이동 구간에서 실제로 갱신된 실행 시간(log time)의 합계를 반환합니다. <br>
     * 일시 정지 시간은 포함하지 않으며 `start(true)`, `clear()`, `complete()`, 실행 중의 `stop()`으로 초기화됩니다. <br>
     *
     * @returns {number} 초기화 이후 기록한 실행 시간(밀리초)입니다. <br>
     * 생성 직후에는 값이 준비되지 않았으므로 `start(true)` 등으로 초기화한 뒤 조회하십시오. <br>
     */
    get logTime(): number;
    /**
     * 현재 이동 구간의 전체 거리를 반환합니다. <br>
     *
     * @returns {number} 진행률과 도착 여부 계산에 사용하는 구간 거리(미터)입니다. <br>
     */
    get distance(): number;
    /**
     * 현재 이동 구간의 목표 또는 예상 소요 시간(duration)을 반환합니다. <br>
     * 목표 시간을 지정한 구간에서는 도착 속도 조절의 기준이고, 고정 속도 구간에서는 거리와 속도로 계산한 예상 시간입니다. <br>
     *
     * @returns {number} 현재 구간의 소요 시간(밀리초)입니다. <br>
     * 생성 옵션에 목표 시간이 없으면 `start(true)`로 예상 시간을 계산한 뒤 조회하십시오. <br>
     */
    get duration(): number;
    /**
     * 이동 계산에 적용하는 주행 속도를 미터/초 단위로 반환합니다. <br>
     * 목표 시간에 맞춰 속도를 조절하는 구간에서는 주행 중 값이 바뀌며, 일시 정지하거나 정지해도 자동으로 `0`이 되지는 않습니다. <br>
     *
     * @returns {number} 초당 이동 거리(미터/초)입니다. <br>
     */
    get speedMs(): number;
    /**
     * 이동 계산에 적용하는 주행 속도를 킬로미터/시 단위로 반환합니다. <br>
     * 목표 시간에 맞춰 속도를 조절하는 구간에서는 주행 중 값이 바뀌며, 일시 정지하거나 정지해도 자동으로 `0`이 되지는 않습니다. <br>
     *
     * @returns {number} 시간당 이동 거리(킬로미터/시)입니다. <br>
     */
    get speed(): number;
    /**
     * 현재 구간이 고정 속도(fixed speed)로 주행하는지 반환합니다. <br>
     *
     * @returns {boolean | undefined} 설정 속도를 유지하면 `true`, 목표 시간에 맞춰 속도를 조절하면 `false`이며, 생성자 초기화가 중단되었으면 `undefined`입니다. <br>
     */
    get fixedSpeed(): boolean | undefined;
    /**
     * 애니메이션 완료 시 실행할 사용자 콜백을 등록합니다. <br>
     *
     * @param {function} func 마지막 이동 구간이 끝났을 때 호출할 함수입니다. <br>
     *
     * @ignore
     */
    onComplete(func: Function): void;
    /**
     * 도착 오차 디버그 출력을 켜거나 끕니다. <br>
     *
     * @param {boolean} val 디버그 출력 활성화 여부입니다. <br>
     *
     * @ignore
     */
    setDebug(val: boolean): void;
    /**
     * 입력한 주행 거리를 기준으로 애니메이션을 다시 설정합니다. <br>
     *
     * @param {number} distance 새로 적용할 주행 거리입니다. <br>
     *
     * @ignore
     */
    /**
     * 주행 경로에 새로운 경유지(waypoint)를 추가합니다. <br>
     * 현재 경로가 끝나면 경유지를 등록한 순서대로 다음 이동 구간을 시작합니다. <br>
     *
     * @param {WorldPositionVector3} point 추가할 월드 좌표입니다. <br>
     * 호출 시 좌표를 복사하므로 이후 원본 객체를 바꿔도 경유지는 달라지지 않습니다. <br>
     * @param {number} [durationMs] `0` 이상의 유한한 기준 목표 시간(밀리초)입니다. <br>
     * 현재 추가한 경유지로 이동을 시작할 때 그 뒤에 남은 경유지가 0개, 1개, 2개, 3개 이상이면 각각 `durationMs / 1`, `durationMs / 2`, `durationMs / 3`, `durationMs / 4`를 적용하고 최솟값은 1밀리초입니다. <br>
     * 생략하면 해당 경유지로 이동을 시작하는 시점의 속도를 유지합니다. <br>
     * @returns {boolean} 세 좌표가 모두 유한하고 목표 시간이 유효해 경유지를 추가했으면 `true`, 그렇지 않으면 `false`입니다. <br>
     */
    appendWaypoint(point: WorldPositionVector3, durationMs?: number): boolean;
    /**
     * 직선 이동 구간(segment) 변경 명령을 예약합니다. <br>
     * 명령은 등록 순서대로 대기하며 외부 애니메이션 갱신마다 하나씩 적용됩니다. <br>
     * 적용되면 현재 구간 진행량은 초기화하고 전체 주행 누적값은 유지합니다. <br>
     *
     * @param {WorldPositionVector3} from 새 구간의 출발 월드 좌표입니다. <br>
     * 호출 시 좌표를 복사하므로 이후 원본 객체를 바꿔도 예약된 출발점은 달라지지 않습니다. <br>
     * @param {WorldPositionVector3} to 새 구간의 도착 월드 좌표입니다. <br>
     * 호출 시 좌표를 복사하므로 이후 원본 객체를 바꿔도 예약된 도착점은 달라지지 않습니다. <br>
     * @param {number} [durationMs] `0` 이상의 유한한 목표 시간(밀리초)입니다. <br>
     * 지정하면 목표 시간에 맞춰 속도를 조절하고, 생략하면 현재 속도를 유지합니다. <br>
     * @returns {boolean} 두 좌표의 각 성분과 목표 시간이 유효해 변경 명령을 추가했으면 `true`, 그렇지 않으면 `false`입니다. <br>
     */
    setSegment(from: WorldPositionVector3, to: WorldPositionVector3, durationMs?: number): boolean;
    /**
     * 현재 이동 구간의 전체 거리(distance) 변경 명령을 예약합니다. <br>
     * 명령은 등록 순서대로 대기하며 외부 애니메이션 갱신마다 하나씩 적용됩니다. <br>
     * 적용되면 현재 구간 진행량은 초기화하고 전체 주행 누적값은 유지합니다. <br>
     *
     * @param {number} distance `0`보다 큰 유한한 새 구간 거리(미터)입니다. <br>
     * 값이 커지면 같은 속도에서 도착까지 더 오래 걸립니다. <br>
     * @param {number} [durationMs] `0`보다 큰 유한한 목표 시간(밀리초)입니다. <br>
     * 지정하면 목표 시간에 맞춰 속도를 조절하고, 생략하면 현재 속도를 유지합니다. <br>
     * @returns {boolean} 거리와 목표 시간이 유효해 변경 명령을 추가했으면 `true`, 그렇지 않으면 `false`입니다. <br>
     */
    setDistance(distance: number, durationMs?: number): boolean;
    /**
     * 다음 외부 업데이트에서 주행 속도를 변경하도록 예약합니다. <br>
     *
     * @param {number} newSpeed 새 주행 속도(킬로미터/시)입니다. <br>
     * `0`이면 일시 정지하고 양수로 바꾸면 주행을 재개합니다. <br>
     *
     * @ignore
     */
    setSpeed(newSpeed: number): void;
    /**
     * 주행 중 카메라 이동에 따른 화면 갱신 여부를 설정합니다. <br>
     *
     * @param {boolean} isTrace `true`이면 카메라 이동 거리를 확인해 화면 갱신을 요청합니다. <br>
     *
     * @ignore
     */
    setCameraTrace(isTrace: boolean): void;
    /**
     * 주행과 일시 정지를 해제하고 대기 중인 구간·거리·속도 변경 명령과 경유지(waypoint)를 모두 지웁니다. <br>
     * 출발·도착 위치와 구간 전체 거리는 유지한 채 현재 구간에서 이동한 거리·시간·진행률과 전체 주행 기록을 `0`으로 초기화하고 `INIT` 이벤트를 발생시킵니다. <br>
     */
    clear(): void;
    /**
     * 주행을 시작하여 설정한 애니메이션 함수가 갱신마다 실행되도록 합니다. <br>
     *
     * @param {boolean} [isInit=true] `true`이면 진행 기록을 초기화하고 현재 속도로 목표 시간을 다시 계산하며, `false`이면 기존 진행 기록을 유지합니다. <br>
     */
    start(isInit?: boolean): void;
    /**
     * 주행을 완료 상태로 바꾸고 현재 구간에서 이동한 거리·시간·진행률과 전체 주행 기록을 초기화합니다. <br>
     * 출발·도착 위치, 구간 전체 거리, 대기 중인 변경 명령과 경유지는 유지하며 `INIT` 이벤트만 발생시키고 `COMPLETE` 이벤트와 완료 콜백은 실행하지 않습니다. <br>
     */
    complete(): void;
    /**
     * 현재 주행의 진행 시간과 위치를 유지한 채 일시 정지합니다. <br>
     * 이미 정지했거나 실행 중이 아니면 상태를 바꾸지 않습니다. <br>
     */
    pause(): void;
    /**
     * 일시 정지한 위치와 진행 기록을 유지한 채 주행을 재개합니다. <br>
     * 일시 정지 상태가 아니면 상태를 바꾸지 않습니다. <br>
     */
    resume(): void;
    /**
     * 현재 주행을 정지한 뒤 현재 구간을 처음부터 다시 시작합니다. <br>
     * 진행 기록은 초기화하지만 대기 중인 변경 명령과 경유지(waypoint)는 유지하며 `INIT` 이벤트와 `START` 이벤트를 발생시킵니다. <br>
     */
    restart(): void;
    /**
     * 현재 주행을 정지하고 현재 구간에서 이동한 거리·시간·진행률과 전체 주행 기록을 초기화합니다. <br>
     * 출발·도착 위치, 구간 전체 거리, 대기 중인 변경 명령과 경유지(waypoint)는 유지하고 `INIT` 이벤트만 발생시키며, 이미 정지된 상태이면 아무 값이나 이벤트도 바꾸지 않습니다. <br>
     */
    stop(): void;
    /**
     * 컨트롤러를 정지하고 관리자·이벤트·콜백·외부 객체 참조를 정리합니다. <br>
     *
     * @ignore
     */
    dispose(): void;
    /**
     * 현재 구간 진행 위치를 지정한 거리만큼 앞으로 옮깁니다. <br>
     *
     * @param {number} distance 앞으로 옮길 거리(미터)입니다. <br>
     *
     * @ignore
     */
    jumpByDistance(distance: number): void;
    /**
     * 현재 구간 진행 위치를 지정한 거리만큼 뒤로 옮깁니다. <br>
     *
     * @param {number} distance 뒤로 옮길 거리(미터)입니다. <br>
     *
     * @ignore
     */
    rewindByDistance(distance: number): void;
    /**
     * 애니메이션 업데이트 함수. <br>
     * 실제 이동 거리를 기준으로 진행률을 계산하고 애니메이션 함수와 도착 이벤트를 실행합니다. <br>
     *
     * @param {number} [nowMs=performance.now()] 현재 프레임 시각(밀리초)입니다. <br>
     * 값을 바꾸면 직전 업데이트와의 경과 시간 계산이 달라집니다. <br>
     *
     * @ignore
     */
    updateExternally(nowMs?: number): void;
    #private;
}

export type { UAnimationController };
