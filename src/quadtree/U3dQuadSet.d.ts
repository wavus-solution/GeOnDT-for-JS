// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dObject } from "../core/U3dObject.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UScene } from "../core/UScene.js";
import type { UVisibleState } from "../core/UVisibleState.js";
import type { UGeoRect } from "../math/UGeoRect.js";
import type { U3dQuadModelTile } from "./U3dQuadModelTile.js";
import type { U3dQuadTile, U3dQuadTileLodContext } from "./U3dQuadTile.js";

/**
 * ~extends import('@U3dObject').U3dObject
 * 타일 Quad Set 객체
 * @param {number} minx 구글좌표
 * @param {number} maxx 구글좌표
 * @param {number} miny 구글좌표
 * @param {number} maxy 구글좌표
 * @param {number} level
 * @param layers
 * @param drawArg
 * @param scene
 * @param {string} [type] 최초 생성할 트리 종류. 생략하면 지형·모델을 함께 생성합니다.
 *
 * @ignore
 */
declare class U3dQuadSet extends U3dObject {
    /**
     * 생성 전에 영역과 레벨의 유효성을 확인합니다.
     *
     * @param {import('@UGeoRect').UGeoRect | undefined} rectangle 생성 영역
     * @param {number | undefined} level 시작 레벨
     * @param {number} maxLevel 최대 레벨
     * @returns {boolean} 생성 가능한 입력인지 여부
     */
    static isValidRegion(rectangle: UGeoRect | undefined, level: number | undefined, maxLevel: number): boolean;
    /**
     * 새 컨테이너를 생성합니다. 기존 컨테이너 인수는 호환을 위해 해당 객체의 보충 생성에 위임합니다.
     *
     * @param {import('@UGeoRect').UGeoRect} rectangle 생성 영역
     * @param {number} level 시작 레벨
     * @param {import('@UDrawArg').UDrawArg} drawArg 소유 앱의 그리기 인자
     * @param {import('@union3d/core/UScene').UScene} scene 대상 장면
     * @param {U3dQuadSet} [tree] 유지할 컨테이너
     * @param {string} [type] 대상 종류. 생략하면 두 종류
     * @returns {U3dQuadSet | null} 생성된 컨테이너 또는 잘못된 입력
     * @throws {Error} 기존 범위와 다르거나 루트 생성에 실패한 경우
     */
    static createQuadTreeSet(rectangle: UGeoRect, level: number, drawArg: UDrawArg, scene: UScene, tree?: U3dQuadSet, type?: string): U3dQuadSet | null;
    constructor(minx: any, maxx: any, miny: any, maxy: any, level: any, layers: any, drawArg: any, scene: any, type: any);
    /**
     * 해제 후 지연 갱신과 중첩 해제를 차단합니다.
     *
     * @type {boolean}
     * @ignore
     */
    _disposed: boolean;
    /**
     * 루트 교체 중 구 순회의 완료 알림을 막습니다.
     *
     * @type {number}
     * @ignore
     */
    _rootRevision: number;
    /**
     * 현재 동기 순회에 한정된 공통 분화 판단 값입니다.
     * 비동기 작업과 다음 갱신으로 전달하지 않으며 중첩 갱신 뒤에는 이전 범위를 복원합니다.
     *
     * @type {U3dQuadTileLodContext | undefined}
     *
     * @ignore
     */
    _lodUpdateContext: U3dQuadTileLodContext | undefined;
    _scene: any;
    _layers: any;
    _drawArg: any;
    _initialized: boolean;
    _listQuadtree: any[];
    _minx: any;
    _maxx: any;
    _miny: any;
    _maxy: any;
    _level: any;
    _rlevel: any;
    _centerX: number;
    _centerY: number;
    _centerZ: number;
    _rectangle: UGeoRect;
    _sphere: three.Sphere;
    _boundingbox: three.Box3;
    _prevPostion: any;
    _curPostion: three.Vector3;
    _checkTime: UCheckTime;
    _frameStates: Map<any, any>;
    _visibleState: UVisibleState;
    /**
     * 기존 영역을 유지하며 누락된 종류의 루트만 보충합니다.
     *
     * @param {import('@UGeoRect').UGeoRect} rectangle 생성 영역
     * @param {number} level 시작 레벨
     * @param {string} [type] 대상 종류. 생략하면 두 종류
     * @returns {U3dQuadSet | null} 현재 컨테이너 또는 잘못된 입력
     * @throws {Error} 기존 영역과 다르거나 루트 생성에 실패한 경우
     */
    createQuadTreeSet(rectangle: UGeoRect, level: number, type?: string): U3dQuadSet | null;
    /**
     * 대상 종류의 루트를 교체하고 활성 컨테이너를 반환합니다.
     * 전체 교체와 마지막 종류 교체는 새 컨테이너를 만들며 반대쪽이 있으면 유지합니다.
     *
     * @param {import('@UGeoRect').UGeoRect} rectangle 생성 영역
     * @param {number} level 시작 레벨
     * @param {string} [type] 대상 종류. 생략하면 두 종류
     * @returns {U3dQuadSet | null} 교체 후 컨테이너 또는 앱 해제
     * @throws {Error} 루트 해제 또는 생성에 실패한 경우
     */
    restartQuadTree(rectangle: UGeoRect, level: number, type?: string): U3dQuadSet | null;
    /**
     * 전체·개별 해제에 같은 종류별 정리 경로를 적용합니다.
     *
     * @param {string} [type] 대상 종류. 생략하면 두 종류
     * @returns {void}
     * @throws {Error} 자원 정리에 실패한 경우
     */
    disposeQuadTree(type?: string): void;
    /**
     * 타일 업데이트 민감도 배율을 반환합니다.
     * 기본값은 1이며, 값이 클수록 작은 카메라 변화에도 업데이트합니다.
     *
     * @returns {number} 0보다 큰 유한한 민감도 배율
     */
    getUpdateSensitivity(): number;
    /**
     * 다음 타일 업데이트 틱부터 사용할 민감도 배율을 설정합니다.
     * 기본값 1에서는 타깃 거리에서의 시야 폭·높이 중 작은 값의 약 2% 이동을 기준으로 삼습니다.
     * 2는 이동·회전 임계값을 약 절반으로, 0.5는 약 두 배로 조정합니다.
     * 생략된 움직임은 마지막 타일 업데이트 위치·회전을 기준으로 누적 비교합니다.
     * 숫자가 아니거나 유한하지 않은 값, 0 이하의 값은 적용하지 않습니다.
     * 잘못된 입력은 __GError__로 원인을 기록하고 기존 값을 유지한 채 현재 쿼드셋을 반환합니다.
     *
     * @param {number} sensitivity 0보다 큰 유한한 배율
     * @returns {U3dQuadSet} 현재 쿼드셋
     *
     * @example
     * quadSet.setUpdateSensitivity(2);
     * const sensitivity = quadSet.getUpdateSensitivity();
     */
    setUpdateSensitivity(sensitivity: number): U3dQuadSet;
    /**
     * 이동 임계 거리를 반환합니다. 기존 호출 호환을 위해 메서드 이름과 인수를 유지합니다.
     * 현재 임계값은 모드별 상수나 카메라의 절대 z 대신 시야 크기와 민감도로 계산합니다.
     *
     * @param {import('@U3dApp').U3dApp} app 기존 호출 형식의 앱 인수
     * @param {number} [distance=120] 시야 크기를 계산할 수 없을 때 사용할 기본 거리
     * @returns {number} 민감도를 반영한 이동 임계 거리
     */
    getDistanceByMode(app: U3dApp, distance?: number): number;
    /**
     * 마지막 타일 업데이트 이후의 누적 카메라 변화가 민감도 기준에 도달했는지 판별합니다.
     * 조회만으로 비교 기준을 저장하지 않으며, 최초 업데이트 전에는 true를 반환합니다.
     * 투영 행렬 변경은 이동·회전 임계값과 관계없이 업데이트 대상으로 처리합니다.
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg 현재 카메라와 앱을 가진 그리기 인수
     * @param {number} [distance] 이동 임계 거리 직접 지정값. 생략 시 민감도로 계산
     * @returns {boolean} 현재 틱에서 타일 업데이트가 필요한지 여부
     */
    isUpdate(drawArg: UDrawArg, distance?: number): boolean;
    /**
     * 명시적 요청 또는 민감도 기준에 따라 현재 카메라 상태로 타일을 업데이트합니다.
     * 실행하는 경우 위치·회전·투영 행렬을 함께 저장하여 다음 틱의 비교 기준으로 삼습니다.
     *
     * @param {unknown} [layername] 기존 호출 형식의 레이어 지정값. 현재는 사용하지 않음
     * @param {unknown} [type] 기존 호출 형식의 업데이트 종류. 현재는 사용하지 않음
     * @param {unknown} [force] truthy이면 임계 판별을 생략하며 루트에 그대로 전달할 강제 갱신 입력
     * @param {unknown} [e] 기존 호출 형식의 이벤트
     * @param {boolean} [change=false] 임계 판별을 생략할 명시적 갱신 여부
     */
    update(layername?: unknown, type?: unknown, force?: unknown, e?: unknown, change?: boolean): void;
    /**
     * 쿼드셋의 해제 상태를 반환합니다.
     *
     * @returns {boolean} 컨테이너가 해제되었으면 true
     */
    isDisposed(): boolean;
    /**
     * 두 트리의 자원을 모두 회수하며 한쪽 실패가 다른 쪽 정리를 막지 않습니다.
     * @returns {void}
     * @throws {Error} 단일 실패는 원래 오류를, 복수 실패는 errors 배열을 가진 오류를 전달합니다.
     */
    dispose(): void;
    add(quadtree: any): boolean;
    /**
     * 지정한 종류의 루트를 생성하고 지형 고도 이벤트를 연결합니다.
     * @param {string} [type] 생략하면 두 트리를 생성합니다.
     * @returns {boolean} 루트 생성 여부
     * @throws {Error} 초기화 실패 또는 초기화·정리 오류를 담은 errors 배열을 가진 오류
     */
    initialize(type?: string): boolean;
    /**
     * 소속 지형의 고도를 등록 객체에 적용하고 같은 지형·레벨의 중복 반영을 생략합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile | undefined} tile 고도가 로드된 타일
     * @returns {void}
     * @throws {Error} 고도 조회 또는 등록 콜백 실행에 실패한 경우
     */
    updateAutoHeight(tile: U3dQuadTile | undefined): void;
    setWireFrameRendering(drawArg: any, value: any): void;
    traverse(callback: any): void;
    /**
     * 지정 범위의 모델 루트를 갱신하며 교체된 루트의 탐색은 완료 집계에서 제외합니다.
     * @param {import('three').Box3} box3 모델 탐색 범위
     */
    updateModel(box3: three.Box3): void;
    redraw(): void;
    /**
     * 지정한 종류의 첫 번째 루트를 반환합니다.
     *
     * @param {string} type 트리 종류
     * @returns {import('@U3dQuadTile').U3dQuadTile | import('@U3dQuadModelTile').U3dQuadModelTile | undefined} 첫 번째 루트. 대상이 없거나 컨테이너가 해제되면 undefined
     */
    getQuadTree(type: string): U3dQuadTile | U3dQuadModelTile | undefined;
    /**
     * 현재 루트 목록의 복사본을 반환하며 루트 객체는 그대로 참조합니다.
     *
     * @param {string} [type] 조회할 트리 종류. 생략하면 전체 루트
     * @returns {Array<import('@U3dQuadTile').U3dQuadTile | import('@U3dQuadModelTile').U3dQuadModelTile>} 루트 목록. 대상이 없거나 컨테이너가 해제되면 빈 배열
     */
    getQuadTrees(type?: string): Array<U3dQuadTile | U3dQuadModelTile>;
    /**
     * 지정한 종류의 루트가 살아 있는지 확인합니다.
     *
     * @param {string} type 트리 종류
     * @returns {boolean} 존재 여부
     */
    hasQuadTree(type: string): boolean;
    /**
     * 지형·영상 루트만 생성합니다.
     *
     * @returns {void}
     * @throws {Error} 루트 생성 실패
     */
    createTerrainQuadTreeSet(): void;
    /**
     * 모델 루트만 생성합니다.
     *
     * @returns {void}
     * @throws {Error} 루트 생성 실패
     */
    createModelQuadTreeSet(): void;
    /**
     * 지형·영상 루트만 해제합니다.
     *
     * @returns {void}
     * @throws {Error} 단일 오류 또는 errors 배열을 가진 복수 오류
     */
    disposeTerrainQuadTree(): void;
    /**
     * 모델 루트만 해제합니다.
     *
     * @returns {void}
     * @throws {Error} 단일 오류 또는 errors 배열을 가진 복수 오류
     */
    disposeModelQuadTree(): void;
    #private;
}

export type { U3dQuadSet };
