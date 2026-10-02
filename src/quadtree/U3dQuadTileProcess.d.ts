// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dProcess } from "../core/U3dProcess.js";
import type { U3dQuadTile } from "./U3dQuadTile.js";
import type { U3dQuadTileTask } from "./U3dQuadTileTask.js";

declare class U3dQuadTileProcess extends U3dProcess {
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
     * 실행하지 않을 대기 작업에 실패를 통지하고 진행 계수를 반영합니다.
     * 부모 타일의 대기 등록 해제는 종결 수신자가 담당하므로 슬롯 회수와 구분합니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTileTask').U3dQuadTileTask} work 제외할 작업
     *
     * @ignore
     */
    _discard(work: U3dQuadTileTask): void;
    _refineCount: number;
    _index: number;
    _checkTime: any;
    /**
     * 타일 작업을 등록하며 등록 예외나 폐기 상태에서도 실패 통지를 시도합니다.
     *
     * @override
     *
     * @param {import('@union3d/quadtree/U3dQuadTileTask').U3dQuadTileTask} work 등록할 작업
     * @param {import('@union3d/quadtree/U3dQuadTile').U3dQuadTile} tile 거리별 큐를 선택할 기준 타일
     */
    override enqueueWork(work: U3dQuadTileTask, tile: U3dQuadTile): void;
    getWorkingInDistance(opt: any): any;
    checkQueue(work: any): boolean;
    /**
     * 다음 작업의 비동기 시작을 요청하고 현재 사용 중인 슬롯 수를 반환합니다.
     * 현재 점유 수를 반환하며 이번 호출의 동기 실행 개수와 구분합니다.
     *
     * @param {number} [curTime] 호출 시각. 실행 한도 계산에는 사용하지 않는 값
     * @returns {number} 현재 실행 중인 작업 수
     */
    process(curTime?: number): number;
    /**
     * 현재 한도 안에서 큐 항목 하나를 꺼내 유효한 타일 작업을 실행합니다.
     * 제외한 항목 뒤의 작업은 다음 예약에서 검사하여 긴 동기 순회를 피합니다.
     *
     * @returns {boolean} 유효한 작업을 실행 경로에 전달했는지 여부
     */
    dequeueBuffer(): boolean;
    /**
     * 슬롯을 점유하고 작업을 실행한 뒤 종결 시 슬롯과 진행 상태를 반영합니다.
     * 다음 작업의 시작은 완료 콜백에서 비동기 예약으로 요청합니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTileTask').U3dQuadTileTask} obj 실행할 작업
     * @param {import('@union3d/quadtree/U3dQuadTile').U3dQuadTile} tile 작업 대상 타일
     */
    execute(obj: U3dQuadTileTask, tile: U3dQuadTile): void;
    update(): number;
    #private;
}

export type { U3dQuadTileProcess };
