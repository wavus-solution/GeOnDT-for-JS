// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGridTileLayerCO } from "./U3dGridTileLayer.types.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { UCache } from "../core/UCache.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * 타일 경계에 격자 상자를 표시하고 설정·캐시·자원 수명주기를 관리하는 레이어다.
 * 직접 속성 대입과 set 계열 메서드의 변환·재생성 차이를 구분하여 사용한다.
 *
 * @group 3dLayer
 * @summary 격자 타일 레이어
 */
declare class U3dGridTileLayer extends U3dModelLayer {
    /**
     * 기반 레이어를 초기화하고 격자 설정의 초기 기록과 전용 캐시를 준비한다.
     * 옵션 기본값은 undefined에만 적용하며 null·0·false를 일괄 대체하지 않는다.
     *
     * @param {U3dGridTileLayerCO} [opt={}] 기반 레이어 및 격자 표시 설정.
     */
    constructor(opt?: U3dGridTileLayerCO);
    _meshGeometry: any;
    _meshMaterial: three.MeshBasicMaterial;
    _boxMaterial: any;
    _showGridTile: any;
    _height: any;
    _size: any;
    _minlevel: any;
    _gridColor: any;
    _gridOpacity: any;
    _GridConfig: {
        _showGridTile: any;
        _height: any;
        _size: any;
        _minlevel: any;
        _gridColor: any;
        _gridOpacity: any;
    };
    _gridCache: UCache;
    _checkTime: UCheckTime;
    /**
     * 격자 생성 허용 상태 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set showGridTile(value: unknown);
    /**
     * 격자 생성 허용 상태 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get showGridTile(): any;
    /**
     * 높이 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set height(value: unknown);
    /**
     * 높이 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get height(): any;
    /**
     * 격자 간격 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set size(value: unknown);
    /**
     * 격자 간격 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get size(): any;
    /**
     * 격자 색상 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     * 보관 중인 최초 재질이 있으면 표시 속성도 즉시 변경한다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set gridColor(value: unknown);
    /**
     * 격자 색상 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get gridColor(): any;
    /**
     * 최소 레벨 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set minlevel(value: unknown);
    /**
     * 최소 레벨 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get minlevel(): any;
    /**
     * 불투명도 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     * 보관 중인 최초 재질이 있으면 표시 속성도 즉시 변경한다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set gridOpacity(value: unknown);
    /**
     * 불투명도 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get gridOpacity(): any;
    /**
     * 높이를 Number로 변환해 저장하고 요청 시 캐시에 있는 격자를 다시 만든다.
     * null·undefined는 무시하며 NaN·범위 검증이나 설정 기록 객체 갱신은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     * @param {boolean} [refresh=true] 저장 후 기존 격자를 재생성할지 여부.
     */
    setHeight(value: unknown, refresh?: boolean): void;
    /**
     * 현재 높이를 숫자로 변환해 조회한다. 존재 단언은 하지 않는다.
     *
     * @returns {number} Number 변환 결과. 변환할 수 없는 값은 NaN일 수 있다.
     */
    getHeight(): number;
    /**
     * 격자 간격을 Number로 변환해 저장하고 요청 시 기존 격자를 다시 만든다.
     * null·undefined는 무시하며 0·음수·비유한 값에 대한 보정은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     * @param {boolean} [refresh=true] 저장 후 기존 격자를 재생성할지 여부.
     */
    setSize(value: unknown, refresh?: boolean): void;
    /**
     * 현재 격자 간격을 숫자로 변환해 조회한다. 존재 단언은 하지 않는다.
     *
     * @returns {number} Number 변환 결과. 변환할 수 없는 값은 NaN일 수 있다.
     */
    getSize(): number;
    /**
     * null·undefined가 아닌 입력만 격자 생성 허용 상태에 저장한다.
     * 이미 생성된 격자를 숨기거나 제거하지 않고 기반 표시 상태도 바꾸지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    setShowGridTile(value: unknown): void;
    /**
     * 현재 격자 생성 허용 값을 검사·변환 없이 조회한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getShowGridTile(): any;
    /**
     * null·undefined가 아닌 입력만 최소 레벨에 저장한다.
     * 숫자 변환·레벨 범위 검사·기존 격자 재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    setMinLevel(value: unknown): void;
    /**
     * 현재 최소 레벨 값을 검사·변환 없이 조회한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getMinLevel(): any;
    /**
     * null·undefined가 아닌 색상을 저장하고 보관 중인 최초 재질에 반영한다.
     * 재질은 다른 helper와 공유될 수 있으며 모든 상자를 순회하거나 다시 만들지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    setGridColor(value: unknown): void;
    /**
     * 현재 격자 색상 값을 검사·변환 없이 조회한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getGridColor(): any;
    /**
     * null·undefined가 아닌 불투명도를 저장하고 보관 재질에 반영한다.
     * opacity 대입 후 1 미만 여부로 transparent를 변경하며 입력 범위를 보정하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    setGridOpacity(value: unknown): void;
    /**
     * 현재 격자 불투명도 값을 검사·변환 없이 조회한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getGridOpacity(): any;
    /**
     * 기반 표시 처리를 먼저 수행하고 격자 생성 허용 상태를 변경한다.
     * falsy 입력은 hide()로 이어져 기반 숨김을 다시 호출하며 기반 반환값은 전달하지 않는다.
     *
     * @override
     *
     * @param {boolean} show 레이어 표시 여부.
     */
    override show(show: boolean): void;
    /**
     * 기반 레이어를 숨긴 뒤 새 격자 생성을 금지한다.
     * 격자 캐시를 직접 비우지 않으므로 다시 표시할 때 캐시와 장면 연결이 다를 수 있다.
     */
    hide(): void;
    /**
     * 격자 표시 및 다섯 설정을 순서대로 적용한 뒤 기존 격자를 재생성한다.
     * isShow가 falsy이면 전체 격자를 제거하고 나머지 입력은 적용하지 않는다.
     * 생략·null 입력은 해당 getter로 대체하며 대체값도 없으면 그 자리에서 종료한다.
     * 뒤의 입력 처리에 실패하더라도 앞서 저장한 설정은 되돌리지 않는다.
     *
     * @param {unknown} isShow 격자 생성 허용 값. 기반 레이어 표시 상태와는 별개다.
     * @param {unknown} [height] 높이. 생략하면 getHeight() 결과를 사용한다.
     * @param {unknown} [size] 간격. 생략하면 getSize() 결과를 사용한다.
     * @param {unknown} [minlevel] 최소 레벨. 생략하면 getMinLevel() 결과를 사용한다.
     * @param {unknown} [gridColor] 색상. 생략하면 getGridColor() 결과를 사용한다.
     * @param {unknown} [gridOpacity] 불투명도. 생략하면 getGridOpacity() 결과를 사용한다.
     */
    setGridTile(isShow: unknown, height?: unknown, size?: unknown, minlevel?: unknown, gridColor?: unknown, gridOpacity?: unknown): void;
    /**
     * 생성 시 보관한 설정 기록을 조회한다. 이후 setter와 자동 동기화하지 않는다.
     * 객체를 복제하지 않으며 외부에서 교체한 저장값도 종류 검사 없이 반환한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getGridTile(): any;
    /**
     * 한 타일의 격자를 제거하거나 레이어 그룹과 격자 캐시 전체를 해제한다.
     * 전체 제거는 그룹 해제·비우기 후 캐시 항목도 해제하며, 단일 제거는 캐시·장면 분리 후 해제한다.
     * 보관 재질 참조는 초기화하지 않으며 해제 중 예외가 발생하면 나머지 처리를 중단한다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} [tile] 제거할 타일. 전체 제거가 아니고 타일도 없으면 무동작이다.
     * @param {boolean} [all] truthy이면 타일 인수와 관계없이 전체 제거한다.
     */
    disposeGridTile(tile?: U3dQuadTile, all?: boolean): void;
    /**
     * 기반 타일 처리를 먼저 호출한 뒤 현재 설정으로 격자 그룹을 구성·등록한다.
     * 기반 반환값은 생성 허용 조건으로 사용하지 않는다. 타일 상태·표시·최소 레벨·중복 캐시를 별도로 확인한다.
     * 생성 중 실패하면 예외를 전달하며 앞서 만든 자원을 되돌리거나 부분 결과를 등록하지 않는다.
     * 크기·높이·생성량을 보정하지 않고 완료 결과도 반환하지 않는다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 경계·키·레벨을 읽을 타일.
     * @returns {undefined} 생성 결과 없음. 기반 계약의 boolean·Promise 대신 항상 `undefined`
     */
    override createModel(tile: U3dQuadTile): undefined;
}

export type { U3dGridTileLayer };
