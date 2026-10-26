// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dObject } from "./U3dObject.js";
import type { U3dQueue } from "./U3dQueue.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { U3dQuadTileTask } from "../quadtree/U3dQuadTileTask.js";

declare class U3dProcess extends U3dObject {
    constructor(opt?: {});
    _classtype: string;
    _layer: any;
    _maxProcess: any;
    _callback: any;
    _parameter: any;
    _drawArg: any;
    _type: any;
    _useMultiBuffer: any;
    _distanceRange: {
        distance: number;
        index: number;
    }[];
    _queueBuffer: U3dQueue;
    _remainProcess: number;
    _dispose: boolean;
    /**
     * 지면 작업이 없을 때 호출자가 제공한 빈 배열을 반환합니다.
     *
     * 표준 getWork만 빈 결과 배열을 공유합니다. 인스턴스·prototype에서 getWork를 재정의했다면
     * 기존 다섯 인수와 receiver로 호출하고 반환 배열을 그대로 사용합니다. 결과 배열은
     * 처리기에 저장하지 않으므로 레이어 훅이 같은 처리기로 재진입해도 서로 섞이지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} item 작업 대상 타일
     * @param {unknown} force 작업에 전달할 강제 갱신 입력
     * @param {import('@U3dQuadTile').U3dQuadTile} completedWorkTile 완료 기록을 소유한 부모 타일
     * @param {Array<import('@union3d/quadtree/U3dQuadTileTask').U3dQuadTileTask>} emptyResult 작업이 없을 때만 반환할 빈 배열
     * @returns {Array<import('@union3d/quadtree/U3dQuadTileTask').U3dQuadTileTask> | undefined} 수집 배열 또는 잘못된 타일 입력의 undefined
     *
     * @ignore
     */
    _getTerrainWork(item: U3dQuadTile, force: unknown, completedWorkTile: U3dQuadTile, emptyResult: Array<U3dQuadTileTask>): Array<U3dQuadTileTask> | undefined;
    dispose(): void;
    getMaxProcess(): any;
    setMaxProcess(maxProcess?: number): void;
    getLayer(): any;
    add(item: any, force: any, isOnly: any, scope: any): number;
    enqueueWork(work: any, tile: any): void;
    /**
     * 레이어 조건을 만족하고 진행 중인 동일 작업이 없는 타일 작업을 수집합니다.
     * 완료 기록을 전달한 영상·고도 수집에서는 기존 캐시 확인을 생성 전에 수행하여,
     * 곧바로 제외할 작업의 콜백 배열과 UUID를 만들지 않습니다. 생략 시 기존 수집을 유지합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} item 작업 대상 타일
     * @param {unknown} [force] 생성할 작업에 그대로 전달할 강제 갱신 입력
     * @param {unknown} [isOnly] 지정 레이어로 수집을 제한할 참 값
     * @param {Partial<{getName: () => string}>} [scope] 이름을 비교할 레이어
     * @param {import('@U3dQuadTile').U3dQuadTile} [completedWorkTile] 완료 작업 기록을 소유한 부모 타일
     * @returns {Array<import('@union3d/quadtree/U3dQuadTileTask').U3dQuadTileTask> | undefined} 작업 후보 배열 또는 잘못된 타일 입력의 undefined
     *
     * @this {import('@union3d/core/U3dProcess').U3dProcess}
     */
    getWork(this: U3dProcess, item: U3dQuadTile, force?: unknown, isOnly?: unknown, scope?: Partial<{
        getName: () => string;
    }>, completedWorkTile?: U3dQuadTile): Array<U3dQuadTileTask> | undefined;
    getWorking(): boolean;
    getWorkingCount(): number;
    getWorkingLevel2(): number;
    getWorkingLevel3(): number;
    getType(): any;
    update(): void;
}

export type { U3dProcess };
