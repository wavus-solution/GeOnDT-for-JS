// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dRoadExtension } from "../3dLayer/U3dRoadExtension.js";
import type { U3dVectorLayer } from "../3dLayer/U3dVectorLayer.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UGroup } from "../core/UGroup.js";
import type { UGizmoControls } from "../mode/UGizmoControls.js";
import type { Double_Array, GeoPosition, WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 도로 생성·선택·끝점 편집과 교차로·병합 처리를 앱에 연결하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const roadAnaly = app.getAnalysis('Road');
 * roadAnaly.active();
 * roadAnaly.addRoad(1, 10);
 */
declare class UAnalyRoad extends UAnaly {
    /**
     * 도로 생성·선택·편집 분석의 기본 상태를 구성합니다. <br>
     * 앱은 setApp()으로 연결하며 부모 생성자에는 옵션을 전달하지 않습니다. <br>
     * scale·rotation·drawStopLine은 설정값을 보관하며 이 클래스에서 도로 생성에 추가 적용하지 않습니다.
     *
     * @param {UAnalyRoadCO} [opt={}] 도로 분석 생성 옵션
     */
    constructor(opt?: UAnalyRoadCO);
    /**
     * 마우스 이동 등록 키입니다.
     *
     * @type {string | undefined}
     */
    _mouseMoveId: string | undefined;
    /**
     * 연계 벡터 레이어 원본입니다.
     *
     * @type {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined}
     */
    _layer: U3dVectorLayer | undefined;
    /**
     * 해제할 앱 입력의 종류·키 목록입니다.
     *
     * @type {Array<{type: string, id: string | null}>}
     */
    _eventKeys: Array<{
        type: string;
        id: string | null;
    }>;
    /**
     * 선택 도로·편집점 또는 병합 선택 배열 원본입니다.
     *
     * @type {import('@U3dRoadExtension').U3dRoadExtension | import('three').Mesh | Array<import('@U3dRoadExtension').U3dRoadExtension> | undefined}
     */
    _selected: U3dRoadExtension | three.Mesh | Array<U3dRoadExtension> | undefined;
    /**
     * 기즈모 편집 모드입니다.
     *
     * @type {string}
     */
    _editMode: string;
    /**
     * 이동 기준 구를 만들 때 전달하는 색상입니다.
     *
     * @type {import('three').ColorRepresentation}
     */
    color: three.ColorRepresentation;
    /**
     * 현재 도로 편집 기즈모입니다.
     *
     * @type {UGizmoControlsEx | undefined}
     */
    _control: UGizmoControlsEx | undefined;
    /**
     * 기즈모가 조작하는 숨김 기준 구입니다.
     *
     * @type {import('three').Mesh | undefined}
     */
    _controlObj: three.Mesh | undefined;
    /**
     * 기즈모 관련 앱 이벤트 해제 키입니다.
     *
     * @type {string | undefined}
     */
    _controlId: string | undefined;
    /**
     * 입력 중인 도로입니다.
     *
     * @type {import('@U3dRoadExtension').U3dRoadExtension | undefined}
     */
    _road: U3dRoadExtension | undefined;
    /**
     * 현재 도로 원본 목록입니다.
     *
     * @type {Array<import('@U3dRoadExtension').U3dRoadExtension>}
     */
    _roads: Array<U3dRoadExtension>;
    /**
     * 교차 정보 보관용 초기 배열입니다.
     *
     * @type {Array<{line: import('three').Object3D, points: Array<GeoPosition>}>}
     */
    _intersections: Array<{
        line: three.Object3D;
        points: Array<GeoPosition>;
    }>;
    /**
     * 생성 옵션의 정지선 설정을 보관하는 상태입니다.
     *
     * @type {boolean}
     */
    _isDrawStopLine: boolean;
    /**
     * 도로 메시를 연결하는 그룹입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _roadGroup: UGroup;
    /**
     * 병합 그룹 참조입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _absorptionGroup: UGroup;
    /**
     * 차선 그룹 참조입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _roadLineGroup: UGroup;
    /**
     * 생성자에서 초기화하는 도로 색상 보관값입니다.
     *
     * @type {string}
     */
    _roadColor: string;
    /**
     * 이후 생성할 도로의 차선 수입니다.
     *
     * @type {number}
     */
    _roadLine: number;
    /**
     * 이후 생성할 도로의 차선당 폭입니다.
     *
     * @type {number}
     */
    _roadWidth: number;
    /**
     * 이후 생성할 도로의 높이 설정입니다.
     *
     * @type {number}
     */
    _roadHeight: number;
    /**
     * 생성 옵션의 스케일 원본을 보관하는 상태입니다.
     *
     * @type {import('three').Vector3Like}
     */
    _scale: three.Vector3Like;
    /**
     * 생성 옵션의 회전 원본을 보관하는 상태입니다.
     *
     * @type {import('three').Vector3Like}
     */
    _rotation: three.Vector3Like;
    /**
     * 끝 POI 보관 참조입니다.
     *
     * @type {import('three').Object3D | undefined}
     */
    _endPoi: three.Object3D | undefined;
    /**
     * 시작 POI 보관 참조입니다.
     *
     * @type {import('three').Object3D | undefined}
     */
    _startPoi: three.Object3D | undefined;
    /**
     * 레이어별 상태 보관 객체입니다.
     *
     * @type {Record<string, unknown>}
     */
    _layerMap: Record<string, unknown>;
    /**
     * 선택 가능한 편집점 원본 목록입니다.
     *
     * @type {Array<import('three').Object3D>}
     */
    _editPointGroup: Array<three.Object3D>;
    /**
     * 이후 생성할 도로의 텍스처 주소입니다.
     *
     * @type {string | undefined}
     */
    _roadImageUrl: string | undefined;
    /**
     * 마지막으로 구성한 격자 메시입니다.
     *
     * @type {import('three').Mesh | undefined}
     */
    _grid: three.Mesh | undefined;
    /**
     * 기즈모에서 놓은 직후 선택 한 번을 억제하는 상태입니다.
     *
     * @type {boolean}
     *
     * @ignore
     */
    _isGizmoMouseUp: boolean;
    name: any;
    /**
     * 도로 분석에 앱과 렌더링 실행 인자를 연결합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 연결할 앱
     * @returns {this} 이 분석 객체
     */
    override setApp(app: U3dApp): this;
    /**
     * 분석을 활성화하고 POI 그룹을 주석 장면에 연결합니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    override active(): this;
    /**
     * 앱 입력과 기즈모를 해제하고 선택·편집점 표시를 정리합니다. <br>
     * 이미 비활성이면 아무 작업 없이 자신을 반환하며 진행 중 도로와 도로 목록은 유지합니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    override deactive(): this;
    /**
     * 연계할 벡터 레이어 원본을 저장합니다.
     *
     * @param {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined} layer 연계 벡터 레이어 원본
     * @returns {this} 이 분석 객체
     */
    setLayer(layer: U3dVectorLayer | undefined): this;
    /**
     * 설정한 벡터 레이어 원본을 반환합니다.
     *
     * @returns {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined} 설정된 레이어, 없으면 undefined
     */
    getLayer(): U3dVectorLayer | undefined;
    /**
     * 이후 생성할 도로의 텍스처 주소를 저장합니다. <br>
     * 기존 도로의 텍스처는 변경하지 않습니다.
     *
     * @param {string} url 이미지 주소
     * @returns {this} 이 분석 객체
     */
    setRoadImage(url: string): this;
    /**
     * 현재 선택 원본을 반환합니다. <br>
     * 모드에 따라 도로·편집점 메시·병합 선택 배열을 반환합니다.
     *
     * @returns {import('@U3dRoadExtension').U3dRoadExtension | import('three').Mesh | Array<import('@U3dRoadExtension').U3dRoadExtension> | undefined} 선택 원본, 선택 전에는 undefined
     */
    getSelected(): U3dRoadExtension | three.Mesh | Array<U3dRoadExtension> | undefined;
    /**
     * 진행 중 도로를 확정하고 클릭 선택 모드를 전환합니다. <br>
     * 이전 입력·기즈모를 먼저 해제하며 분석 자체를 활성화하지는 않습니다.
     *
     * @param {boolean} active 클릭 선택 모드를 켤지 여부
     * @returns {this} 이 분석 객체
     */
    setSelect(active: boolean): this;
    /**
     * 이전 입력·기즈모를 정리하고 클릭한 도로를 제거하는 모드를 등록합니다.
     *
     * @returns {this} 이 분석 객체
     */
    removeClickedRoad(): this;
    /**
     * 부모 정리 후 입력·기즈모·진행 도로·도로 목록·선택을 순서대로 정리합니다. <br>
     * 격자 이미지 자원의 해제까지 수행하는 API는 아닙니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    override clear(): this;
    /**
     * 현재 선택의 하이라이트를 끄고 선택을 해제합니다. <br>
     * 하이라이트 처리 중 동기 예외가 발생하면 선택 해제에 도달하지 않습니다.
     *
     * @returns {this} 이 분석 객체
     */
    clearSelect(): this;
    /**
     * 도로 메시와 같은 이름의 목록 항목을 분리합니다. <br>
     * 같은 이름의 첫 도로 항목만 제거하며 메시 자원을 직접 dispose하지 않습니다.
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road 대상 도로 원본
     * @returns {this} 이 분석 객체
     */
    removeRoad(road: U3dRoadExtension): this;
    /**
     * 저장 가능한 도로 파라미터를 목록 순서대로 모아 반환합니다. <br>
     * 각 getParam() 결과의 원본 참조를 새 배열에 담습니다.
     *
     * @returns {Array<object>} 정의된 getParam() 결과를 담은 새 배열
     *
     * @see UAnalyRoadData
     */
    saveRoad(): Array<object>;
    /**
     * 단일 도로 데이터 또는 배열에서 도로를 생성하고 교차 갱신을 시작합니다. <br>
     * positions가 없으면 입력을 무시하며 지정하지 않은 생성 설정은 현재 기본값을 사용합니다. <br>
     * 교차·정렬 완료를 기다리지 않고 자신을 반환하며 동기 예외는 호출 지점에 전달합니다.
     *
     * @param {object | Array<object>} options UAnalyRoadData 필드의 단일 객체 또는 배열
     * @returns {this} 이 분석 객체
     *
     * @see UAnalyRoadData
     */
    setRoad(options: object | Array<object>): this;
    /**
     * 도로 그리기의 격자 평면을 구성하여 주석 장면에 연결합니다. <br>
     * 반환 Promise는 이미지 로딩 완료를 기다리지 않으며 늦은 로딩 실패는 이미 완료된 결과를 바꾸지 않습니다. <br>
     * 새 격자를 설정해도 이전 격자와 자원은 해제하지 않습니다.
     *
     * @param {string} url 이미지 주소
     * @param {number} [opacity=1] 격자 불투명도
     * @returns {Promise<void>} 격자 구성 완료. 이미지 로딩 완료는 기다리지 않음
     */
    setDrawGridImage(url: string, opacity?: number): Promise<void>;
    /**
     * 이미 구성한 격자의 표시 상태를 변경합니다. <br>
     * 격자가 없으면 아무 작업도 하지 않습니다.
     *
     * @param {boolean} [isShow=true] 격자를 표시할지 여부
     * @returns {this} 이 분석 객체
     */
    gridShow(isShow?: boolean): this;
    /**
     * 선택 도로 중심에 기즈모의 이동 기준 구를 구성합니다. <br>
     * 선택이 없으면 아무 작업도 하지 않으며 기존 기준 구는 장면에서만 분리합니다.
     *
     * @returns {this} 이 분석 객체
     */
    editPosition(): this;
    /**
     * 선택과 이동 기준 구를 선택 객체의 초기 위치로 되돌립니다. <br>
     * POI가 있으면 높이 오프셋을 적용하며 기즈모가 없으면 표시 갱신 전에 반환합니다.
     *
     * @returns {this} 이 분석 객체
     */
    resetGizmo(): this;
    /**
     * 이 분석이 등록한 앱 입력과 자체 리스너를 모두 비웁니다. <br>
     * 부모 메서드와 달리 개별 이벤트를 지정하는 인수를 받지 않습니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    override removeEventListener(): this;
    /**
     * 도로 클릭 입력 모드를 등록합니다. <br>
     * 정의된 차선 수·폭만 갱신하며 비활성 상태이면 활성화합니다. <br>
     * 격자를 요청해도 그 구성 완료를 기다리지 않고 입력을 등록합니다.
     *
     * @param {number} [roadLine] 갱신할 차선 수
     * @param {number} [roadWidth] 갱신할 도로 폭
     * @param {boolean} [useDrawGrid] 격자 생성을 요청할지 여부
     * @returns {this} 이 분석 객체
     */
    addRoad(roadLine?: number, roadWidth?: number, useDrawGrid?: boolean): this;
    /**
     * 현재 격자 메시 원본을 반환합니다.
     *
     * @returns {import('three').Mesh | undefined} 현재 격자, 없으면 undefined
     */
    getGrid(): three.Mesh | undefined;
    /**
     * 도로 끝점 편집 모드를 등록합니다. <br>
     * 공개 이름 edtiRoad를 유지하며 진행 중인 도로가 있으면 이유 값 없이 거절합니다. <br>
     * 완료는 입력 등록을 뜻하며 후속 편집 작업 완료를 기다리지 않습니다.
     *
     * @returns {Promise<void>} 편집 입력 등록 완료, 진행 도로가 있으면 이유 없이 거절
     */
    edtiRoad(): Promise<void>;
    /**
     * 도로 병합 선택 모드를 등록하고 선택 배열을 새로 구성합니다. <br>
     * 진행 중인 도로가 있으면 이유 값 없이 거절합니다. <br>
     * 완료는 선택 모드 등록을 뜻하며 실제 두 도로의 병합 완료는 아닙니다.
     *
     * @returns {Promise<void>} 병합 선택 입력 등록 완료, 진행 도로가 있으면 이유 없이 거절
     */
    combineRoad(): Promise<void>;
    /**
     * 현재 입력 중인 도로가 있는지 반환합니다.
     *
     * @returns {boolean} 진행 도로가 있으면 true
     */
    isDrawRoad(): boolean;
    /**
     * 입력 중인 도로의 마지막 구간을 되돌립니다. <br>
     * 원점이 두 개이면 도로를 제거하고 그 외에는 중심선·원점과 끝 POI를 갱신합니다.
     *
     * @returns {this} 이 분석 객체
     */
    revertRoad(): this;
    /**
     * 현재 도로 배열 원본을 반환합니다. <br>
     * 반환 배열의 외부 변경은 후속 분석에 반영됩니다.
     *
     * @returns {Array<import('@U3dRoadExtension').U3dRoadExtension>} 현재 도로 배열 원본
     */
    getRoads(): Array<U3dRoadExtension>;
    /**
     * 생성 중 도로를 확정한 뒤 모든 도로의 라벨·노드·편집점을 분리합니다. <br>
     * 도로·편집점 배열을 교체하고 도로 그룹을 장면에서 분리합니다. <br>
     * 격자와 메시 자원을 직접 dispose하지 않습니다.
     *
     * @returns {this} 이 분석 객체
     */
    clearRoad(): this;
    /**
     * 현재 모든 도로의 라벨을 표시합니다.
     *
     * @returns {this} 이 분석 객체
     */
    showLabel(): this;
    /**
     * 현재 모든 도로의 라벨을 숨깁니다.
     *
     * @returns {this} 이 분석 객체
     */
    hideLabel(): this;
    /**
     * 이름이 일치하는 첫 도로 원본을 반환합니다.
     *
     * @param {string} name 조회할 도로 이름
     * @returns {import('@U3dRoadExtension').U3dRoadExtension | undefined} 첫 도로 원본, 없으면 undefined
     */
    getRoadByName(name: string): U3dRoadExtension | undefined;
    /**
     * 병합 도로를 먼저 등록하고 하위 병합 생성 완료를 기다립니다. <br>
     * 하위 생성의 거절과 동기 예외는 원래 이유로 Promise에 전달합니다. <br>
     * 새 도로 생성·등록 단계의 예외는 동기로 전달하며 실패 시 이미 등록한 도로를 되돌리지 않습니다.
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road1 첫 도로
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road2 둘째 도로
     * @param {Array<string>} type 각 도로의 start·end 조합
     * @returns {Promise<void>} 하위 병합 생성 완료 또는 원래 실패 이유
     */
    getAbsorption(road1: U3dRoadExtension, road2: U3dRoadExtension, type: Array<string>): Promise<void>;
    /**
     * 도로와 새 도로의 교차 구간을 계산하고 해당 차선에 반영합니다. <br>
     * T자 교차 보정은 교차점 원본의 마지막 위치를 변경할 수 있습니다. <br>
     * 계산은 동기로 실행하므로 예외는 Promise 반환 전에 전달되며 교차가 없으면 빈 배열로 완료합니다.
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} last 새로 추가되거나 편집한 도로
     * @param {boolean} [isTRoad] T자 교차 보정을 수행할지 여부
     * @returns {Promise<Array<{line: import('three').Object3D, points: Array<GeoPosition>}>>} 원시 교차 목록, 교차가 없으면 빈 배열
     */
    getIntersections(last: U3dRoadExtension, isTRoad?: boolean): Promise<Array<{
        line: three.Object3D;
        points: Array<GeoPosition>;
    }>>;
    #private;
}

/**
     * ~extends UAnalyCO <br>
     *
     * 도로 분석 생성 옵션입니다.
     */
    type UAnalyRoadCO_Content = {
        /**
         * 도로 분석 이름
         */
        name?: string;
        /**
         * 보관할 정지선 설정값
         */
        drawStopLine?: boolean;
        /**
         * 보관할 스케일 원본. 생략하면 각 축 1
         */
        scale?: three.Vector3Like;
        /**
         * 보관할 회전 원본. 생략하면 각 축 0
         */
        rotation?: three.Vector3Like;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 도로 분석 생성 옵션입니다.
     */
    type UAnalyRoadCO = Omit<Omit<UAnalyCO, never> & UAnalyRoadCO_Content, never>;

/**
     * ~extends import('@union3d/mode/UGizmoControls').UGizmoControls <br>
     *
     * 도로 편집이 사용하는 기즈모의 확장 계약입니다.
     */
    type UGizmoControlsEx = UGizmoControls & Omit<UAnalyRoadGizmoMembers, never>;

type IntersectionTarget = {
        name: string;
        _olGeom?: object;
        /**
         * 도로 중심선의 월드 좌표(EPSG:3857)
         */
        center?: Array<WorldPositionVector3>;
        geometry?: object;
    };

/**
     * 도로 기즈모가 사용하는 추가 멤버입니다.
     */
    type UAnalyRoadGizmoMembers = {
        /**
         * 표시 갱신
         */
        update: () => void;
        /**
         * 자원 해제
         */
        dispose: () => void;
        /**
         * 입력 등록
         */
        addEventListener: (arg0: string, arg1: Function) => void;
    };

/**
     * 저장·복원에 사용하는 도로 데이터의 필드입니다. <br>
     * setRoad()는 positions가 없는 입력을 무시하며 그 외 필드는 새 도로의 기본값으로 보완합니다.
     */
    type UAnalyRoadData = {
        /**
         * 지리 좌표 목록
         */
        positions?: Array<GeoPosition>;
        /**
         * 차선당 폭
         */
        width?: number;
        /**
         * 차선 수
         */
        line?: number;
        /**
         * 도로 생성의 높이 설정
         */
        height?: number;
        /**
         * 도로 텍스처 주소
         */
        imageUrl?: string;
    };

/**
     * 선 하나와 해당 교차 구간의 원본 점입니다.
     */
    type UAnalyRoadIntersection = {
        /**
         * 교차 선 원본
         */
        line: three.Object3D;
        /**
         * 구간의 시작·끝점
         */
        points: Array<GeoPosition>;
    };

/**
     * 계산 도중 현재 앱을 읽는 제한된 상태입니다.
     */
    type UAnalyRoadAppContext = {
        /**
         * 현재 좌표 변환 앱
         */
        _app: U3dApp | undefined;
    };

/**
     * T자 보정 도중 앱·기존 도로 폭을 읽는 제한된 상태입니다.
     */
    type UAnalyRoadIntersectionContext = {
        /**
         * 현재 좌표 변환 앱
         */
        _app: U3dApp | undefined;
        /**
         * 현재 도로 목록
         */
        _roads: Array<U3dRoadExtension>;
    };

/**
     * 교차 선과 같은 인덱스의 반영 점 목록입니다.
     */
    type UAnalyRoadGroupedIntersections = {
        /**
         * 반영할 선 목록
         */
        lineGroup: Array<three.Object3D>;
        /**
         * 선별 원본 점 목록
         */
        pointList: Double_Array<GeoPosition>;
    };

export type { IntersectionTarget, UAnalyRoad, UAnalyRoadAppContext, UAnalyRoadCO, UAnalyRoadCO_Content, UAnalyRoadData, UAnalyRoadGizmoMembers, UAnalyRoadGroupedIntersections, UAnalyRoadIntersection, UAnalyRoadIntersectionContext, UGizmoControlsEx };
