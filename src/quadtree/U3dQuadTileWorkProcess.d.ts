// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dProcess } from "../core/U3dProcess.js";
import type { U3dQuadTileWork } from "./U3dQuadTileWork.js";

declare class U3dQuadTileWorkProcess extends U3dProcess {
    /**
     * @type {Set<() => void>}
     *
     * @ignore
     */
    _runningTasks: Set<() => void>;
    /**
     * 작업 상태의 측정만 관리자에 전달합니다.
     * 측정 실패가 큐 등록·실행·슬롯 반납과 완료 알림을 중단하지 않도록 격리합니다.
     *
     * @param {object} task 측정할 작업
     * @param {'queued' | 'started' | 'succeeded' | 'failed' | 'cancelled' | 'timeout' | 'discarded'} phase 작업 상태
     * @param {boolean} [immediate=false] 실행 호출이 반환되기 전에 완료되었는지 여부
     *
     * @ignore
     */
    _notifyTaskTiming(task: object, phase: "queued" | "started" | "succeeded" | "failed" | "cancelled" | "timeout" | "discarded", immediate?: boolean): void;
    /**
     * 빈 슬롯에 들어갈 다음 작업의 시작을 예약합니다.
     * 기존 prototype 메서드에서도 호출하므로 시스템 내부 메서드로 제공합니다.
     *
     * @ignore
     */
    _schedule(): void;
    /**
     * 대기 큐와 예약된 시작 요청을 초기화합니다.
     * 진행 중인 작업은 실제 완료될 때 슬롯을 반납하므로 실행 수를 유지합니다.
     */
    clearBuffer(): void;
    /**
     * 실행에서 제외한 작업을 취소하고 종료 콜백과 진행 계수를 반영합니다.
     * 취소 콜백의 예외가 종료 콜백이나 다음 큐 작업을 막지 않도록 각각 처리합니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work 제외할 작업
     *
     * @ignore
     */
    _discard(work: U3dQuadTileWork): void;
    _checkTime: any;
    _refineCount: number;
    _index: number;
    /**
     * 준비된 작업 하나를 큐에 넣습니다. 부모 U3dProcess.add가 타일에서 작업 목록을 만들어 넣는 것과 달리 만들어진 work를 직접 받습니다.
     * customIndex가 있으면 그 결과를 큐 인덱스로 쓰고, 없으면 타일과 카메라 거리로 인덱스를 정합니다.
     *
     * @override
     *
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work 큐에 넣을 작업
     * @param {function(number): (number | void)} [customIndex] 큐 인덱스 길이를 받아 사용할 인덱스를 돌려주는 함수. 값을 돌려주지 않으면 0번 인덱스를 씁니다.
     * @returns {number} 큐에 넣은 작업 수. dispose 된 프로세스면 0
     */
    override add(work: U3dQuadTileWork, customIndex?: (arg0: number) => (number | void)): number;
    /**
     * 후속 작업의 비동기 시작을 요청하고 현재 점유 슬롯 수를 반환합니다.
     *
     * @param {number} [curTime] 호출 시각. 실행 한도 계산에는 사용하지 않는 값
     * @returns {number} 현재 실행 중인 작업 수
     */
    process(curTime?: number): number;
    /**
     * 현재 한도 안에서 큐 항목 하나를 검사하고 실행합니다.
     * 무효 항목이나 필터 예외 이후의 항목은 별도 태스크에서 처리합니다.
     *
     * @returns {boolean} 작업을 실행 경로에 전달했는지 여부
     */
    dequeueBuffer(): boolean;
    /**
     * 후속 작업을 실행하고 성공·실패·취소 중 하나로 종결합니다.
     * 30초 무응답과 늦은 완료 응답에서도 슬롯과 종료 알림을 한 번만 반영합니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work 실행할 작업
     * @param {object} tile 작업 대상 타일
     */
    execute(work: U3dQuadTileWork, tile: object): void;
    update(): number;
    #private;
}

export type { U3dQuadTileWorkProcess };
