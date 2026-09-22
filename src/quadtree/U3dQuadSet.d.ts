// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dObject } from "../core/U3dObject.js";
import type { UDrawArg } from "../core/UDrawArg.js";

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
 *
 * @ignore
 */
declare class U3dQuadSet extends U3dObject {
    constructor(minx: any, maxx: any, miny: any, maxy: any, level: any, layers: any, drawArg: any, scene: any);
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
    _rectangle: any;
    _sphere: three.Sphere;
    _boundingbox: three.Box3;
    _prevPostion: any;
    _curPostion: three.Vector3;
    _checkTime: any;
    _frameStates: Map<any, any>;
    _visibleState: any;
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
    dispose(): void;
    add(quadtree: any): boolean;
    initialize(): boolean;
    setWireFrameRendering(drawArg: any, value: any): void;
    traverse(callback: any): void;
    updateModel(box3: any): void;
    redraw(): void;
    #private;
}

export type { U3dQuadSet };
