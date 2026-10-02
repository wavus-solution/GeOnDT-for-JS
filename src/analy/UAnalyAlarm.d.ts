// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { DispatchInputEvent } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { UMeasureFeature } from "../ol/UMeasureFeature.js";
import type { U3dSelect } from "../select/U3dSelect.js";
import type { EventCallBack, KeyValue } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `Alarm 기능` 추가 클래스 <br>
 * poi 알람, model 알람, 생성된 알람 편집/설정 등의 기능을 제공합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/analysisAlarm.html}
 */
declare class UAnalyAlarm extends UAnaly {
    /** @param {UAnalyAlarmCO} [opt={}] */
    constructor(opt?: UAnalyAlarmCO);
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId: string | undefined;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _dblClickId: string | undefined;
    /**
     * @type {Array<import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh>}
     *
     * @ignore
     */
    _modelGroup: Array<UGroup | UMesh>;
    /**
     * @type {Record<string, import('@union3d/core/mesh/UMesh').UMesh | true>}
     *
     * @ignore
     */
    _selected: Record<string, UMesh | true>;
    /**
     * @type {import('@UGroup').UGroup & Partial<{_idList: Array<string>}>}
     *
     * @ignore
     */
    _selectedGroup: UGroup & Partial<{
        _idList: Array<string>;
    }>;
    /**
     * @type {import('@union3d/core/UGroup').UGroup}
     *
     * @ignore
     */ _multiModelGroup: UGroup;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */ _activeAnimaition: number | undefined;
    /**
     * @type {object | undefined}
     *
     * @ignore
     */ _infoList: object | undefined;
    /**
     * @type {number}
     *
     * @ignore
     */ _highlightColor: number;
    /**
     * @type {Array<string | number>}
     *
     * @ignore
     */ _detailList: Array<string | number>;
    /**
     * @type {Record<string, Alarm_DetailOpt | undefined>}
     *
     * @ignore
     */ _detailOpt: Record<string, Alarm_DetailOpt | undefined>;
    /**
     * @type {Record<string, {layerName: string, tile: string}>}
     *
     * @ignore
     */ _modelObject: Record<string, {
        layerName: string;
        tile: string;
    }>;
    /**
     * @type {Record<string, number | undefined>}
     *
     * @ignore
     */ _infoActiveAlarm: Record<string, number | undefined>;
    /**
     * @type {Record<string, {count: number, speed: number, color: string | number | undefined} | undefined>}
     *
     * @ignore
     */ _disposedAlarmInfo: Record<string, {
        count: number;
        speed: number;
        color: string | number | undefined;
    } | undefined>;
    /**
     * @type {Array<object>}
     *
     * @ignore
     */ _pickList: Array<object>;
    /**
     * @type {Record<string, Function | undefined>}
     *
     * @ignore
     */ _loadedListeners: Record<string, Function | undefined>;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _auto: boolean;
    /**
     * @type {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     *
     * @ignore
     */ _selector: U3dSelect | undefined;
    /**
     * @type {Record<string, unknown>}
     *
     * @ignore
     */ _editedEvent: Record<string, unknown>;
    /**
     * @type {Record<string, unknown>}
     *
     * @ignore
     */ _editedList: Record<string, unknown>;
    /**
     * @type {Record<string, unknown>}
     *
     * @ignore
     */ _removedList: Record<string, unknown>;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */ _imageUrl: string | undefined;
    /**
     * @type {import('@UMeasureFeature').UMeasureFeature | undefined}
     *
     * @ignore
     */ _measureFeature: UMeasureFeature | undefined;
    name: any;
    /**
     * @return {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     */
    getSelecter(): U3dSelect | undefined;
    /**
     * 여러개 알람을 동시에 수행할 수 있는 MultiMode를 켜는 함수
     */
    onMultiMode(): void;
    /**
     * 여러개 알람을 동시에 수행할 수 있는 MultiMode를 끄는 함수
     */
    offMultiMode(): void;
    /**
     * cursor 타입 알람시 세부 정보 id를 추가하는 함수
     * @param {string | number} id 세부 정보 추가 POI ID
     */
    addDetailList(id: string | number): void;
    /**
     * 알람을 설정 할 POI 객체를 추가하는 함수
     * @param {import('@UGroup').UGroup} poi 알람을 추가하려는 POI 객체
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * let poi = U3dBilboard.makeBilboard({ position: position, text: text });
     * analy.addPOI(poi);
     */
    addPOI(poi: UGroup): void;
    /**
     * 알람을 설정 할 model 객체를 추가하는 함수
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model 알람을 추가하려는 model 객체
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * analy.addModel(mesh);
     */
    addModel(model: UMesh): void;
    /**
     * poiGroup의 Children을 반환하는 함수
     * @return {Array<import('@UCssBilboard').UCssBilboard>} addPOI 로 추가된 객체들을 반환합니다.
     */
    getPOIGroupChildren(): Array<UCssBilboard>;
    /**
     * modelGroup의 Children을 반환하는 함수
     * @return {Array<import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh>} addModel 로 추가된 model 객체들을 반환합니다.
     */
    getModelGroupChildren(): Array<UGroup | UMesh>;
    /**
     * cursor 세부 정보를 설정한 DetailList를 반환하는 함수
     * @return {Array<string | number>} cursorMode 시 세부정보를 설정 하려는 POI의 ID들의 배열을 반환합니다.
     */
    getDetailList(): Array<string | number>;
    /**
     * id를 입력 받아 해당 객체의 타입을 반환하는 함수 `POI` `model`
     * @param {string | number} id 현재 편집목록에 추가된 객체 중 타입 정보를 알고 싶은 객체의 ID
     * @return {string | undefined} `POI` / `model` / `group`
     */
    getInstanceType(id: string | number): string | undefined;
    /**
     * id를 입력 받아 해당 POI의 cursor 세부정보를 설정하는 함수
     * @param {string} id cursor 알람시 설정하고 싶은 객체의 ID
     * @param {number} [xsize=40] 설정한 이미지의 x사이즈 크기
     * @param {number} [ysize=40] 설정한 이미지의 y사이즈 크기
     * @param {number} [height=50] 설정한 이미지와 POI의 높이 차
     * @param {string} [image] 설정하려고 하는 이미지의 파일 경로
     */
    addDetailOpt(id: string, xsize?: number, ysize?: number, height?: number, image?: string): void;
    /**
     * id를 입력 받아 해당 POI의 cursor 세부정보를 삭제하는 함수
     * @param {string} id cursorMode 알람 시 세부정보를 삭제하고 싶은 객체의 ID
     */
    removeDetailList(id: string): void;
    /**
     * POI 객체 id 또는 POI 객체 id가 담긴 List를 입력 받아 해당 POI를 반환하는 함수
     * @param {Array<string | number>} idList 찾으려는 POI 객체의 ID 또는 ID 배열
     * @return {Array<import('@union3d/core/UGroup').UGroup> | import('@union3d/core/UGroup').UGroup | undefined} 찾은 POI List 반환
     */
    findPOI(idList: Array<string | number>): Array<UGroup> | UGroup | undefined;
    /**
     * model 객체 id 또는 model 객체 id가 담긴 List를 입력 받아 해당 model을 반환하는 함수
     * @param {Array<string | number> | string | number} idList 찾으려는 model 객체의 ID 또는 ID 배열
     * @return {import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh | undefined} 찾은 model List 반환
     */
    findModel(idList: Array<string | number> | string | number): UGroup | UMesh | undefined;
    /**
     * 알람을 추가하려는 POI의 설정 값을 받아 알람 유형 별로 동작하는 함수
     * @param {string} id 알람을 추가하려는 POI 객체의 ID
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     * @param {string} [type] 알람 유형(타입)
     * @param {number | string} [color] Model 알람 추가시 색상 선택
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * analy.alarmSetData(target, alarmCount, alarmSpeed, type);
     */
    alarmSetData(id: string, count: number, speed: number, type?: string, color?: number | string): void;
    /**
     * Model 객체 알람 실행 중 dispose 됐을 경우 이후에 Model 객체가 create 될때 이전 알람을 이어서 실행하는 함수.
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model 알람 도중 dispose된 Model 객체
     */
    disposedStopModelAlarm(model: UMesh): void;
    /**
     * model 객체 알람 추가 시 필요한 정보를 입력 받아 설정하는 함수
     * @param {import('@union3d/core/mesh/UMesh').UMesh | Array<import('@union3d/core/mesh/UMesh').UMesh>} model 알람을 설정하려는 model 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     * @param {number | string} [color] 알람 색상
     */
    modelFlickerMode(model: UMesh | Array<UMesh>, count: number, speed: number, color?: number | string): void;
    /**
     * Model 객체 알람 추가 시 필요한 정보를 입력 받아 알람을 시작하는 함수.
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model 알람 대상 Model 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     * @param {number | string} [color='#00ff00'] 알람 색상
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * analy.modelFlickerMode(model, count, speed, color);
     */
    modelFlickerModeInit(model: UMesh, count: number, speed: number, color?: number | string): void;
    /**
     * POI 객체 알람 추가 시 필요한 정보를 입력 받아 설정하는 함수
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    flickerMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number): void;
    /**
     * 전달 받은 값으로 POI flickerMode Animation 실행
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    flickerModeAnimation(poi: UCssBilboard, count: number, speed: number): void;
    /**
     * POI 객체 알람 추가 시 필요한 정보를 입력 받아 설정하는 함수.
     * sizeMode : 객체 크기 확대 / 축소 모드
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    sizeMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number): void;
    /**
     * 전달 받은 값으로 POI sizeMode Animation 실행
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} speed 알람 속도
     * @param {number} count 알람 횟수
     * @param {number} [oriSize=8] 알람시작 전 원래 POI의 사이즈
     */
    sizeModeAnimaition(poi: UCssBilboard, speed: number, count: number, oriSize?: number): void;
    /**
     * 전달 받은 값으로 POI cursor 타입 알람 실행시 횟수와 속도를 입력받아 실행하는 함수
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람 대상 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    cursorMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number): void;
    /**
     * 전달 받은 값으로 POI cursorMode Animation 실행
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} speed 알람 속도
     * @param {number} count 알람 횟수
     */
    cursorModeAnimation(poi: UCssBilboard, speed: number, count: number): void;
    /**
     * model의 알람 동작 중 Dispose 되어 사라진 model의 정지 된 알람을 다시 동작 시키기 위한 함수
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model dispose 되어 정지된 알람의 대상 객체
     */
    isDisposedStopModel(model: UMesh): void;
    /**
     * 알람 목록에서 찾고 싶은 Model의 id를 입력 받아 해당 id의 좌표값을 담고 있는 modelObject의 정보를 참고하여 해당 지점의 Model을 반환합니다.
     * @param {string} id 찾고 싶은 model의 id
     * @return {import('@union3d/core/mesh/UMesh').UMesh | undefined} selectedObject 결과 Model 반환
     */
    getIntersectModel(id: string): UMesh | undefined;
    /**
     * 알람이 추가된 목록을 전부 중지 하고 삭제 합니다.
     * @return {object}
     */
    removeAllAlarm(): object;
    /**
     * cursor Mode 시 필요한 세부정보의 목록을 전부 삭제 합니다.
     */
    removeAllDetailOpt(): void;
    /**
     * 삭제하려는 목록의 ID를 받아 해당 알람을 삭제합니다
     * @param {string | number} id 삭제 대상 ID
     */
    removeAlarm(id: string | number): void;
    /**
     * 중지하려는 알람 목록의 ID를 받아 해당 알람을 중지합니다.
     * @param {string | number} id 삭제 대상 ID
     */
    stopAlarmById(id: string | number): void;
    /**
     * 전체 알람을 일시 중지하며, 각 객체들의 상태를 초기화합니다.
     */
    stopAllAlarm(): void;
    /**
     * 실행중인 알람의 객체 ID를 전달 받아 알람을 중지합니다.
     * @param {string | number} id 삭제 대상 ID
     */
    stopActiveAlarm(id: string | number): void;
    /**
     * 다중 선택 하여 그린 POLYGON 내 영역 안의 해당하는 model 객체를 추가하는 함수
     * @param {import('@union3d/core/mesh/UMesh').UMesh | Array<import('@union3d/core/mesh/UMesh').UMesh>} object 영역 안에 해당하여 추가하려는 객체
     */
    addSelected(object: UMesh | Array<UMesh>): void;
    /**
     * 다중 객체 선택하여, 영역 그리기 시 나타난 polygon 삭제, 선택된 model 비우기를 실행하는 함수.
     * @param {boolean} [isChecked=false] mesh-loaded event 삭제 여부
     */
    clearSelect(isChecked?: boolean): void;
    /**
     * 원하는 클릭이벤트를 전달 받아 해당 분석 기능에서 사용하기 위한 함수.
     * @param {EventCallBack} func Click 이벤트 함수
     * @param {string} [event] 이벤트 타입
     */
    passToClickEvent(func: EventCallBack, event?: string): void;
    /**
     * addSelected로 추가된 객체 삭제
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object 삭제하려는 객체
     */
    removeSelected(object: UMesh): void;
    /**
     * cursor 타입시에 생성될 이미지 url
     * @param {string} url 이미지 파일 경로
     */
    setCursorImage(url: string): void;
    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    _click(e: U3dMouseEvent): void;
    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     * @return {boolean | undefined}
     *
     * @ignore
     */
    _polygonClick(e: U3dMouseEvent): boolean | undefined;
    /**
     * @param {string} key
     * @param {boolean} [isChecked=false]
     *
     * @ignore
     */
    _removeSelectedByKey(key: string, isChecked?: boolean): void;
    /**
     * @param {string} layerName
     * @param {string | number} id
     *
     * @ignore
     */
    _addSelected_(layerName: string, id: string | number): void;
    /**
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object
     *
     * @ignore
     */
    _addSelectedNotLayer_(object: UMesh): void;
    /**
     * @param {string} layerName
     * @param {string | number} id
     * @return {import('@union3d/core/mesh/UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _findModelSelect(layerName: string, id: string | number): UMesh | undefined;
    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    _polygonDblclick(e: U3dMouseEvent): void;
    /** @ignore */
    _getSelectLayer(): any;
    /**
     * @param {ModelLayerLike} layer
     *
     * @ignore
     */
    _addLoadedListener(layer: ModelLayerLike): any;
    /** @ignore */
    _removeAllLoadedListener(): void;
    /**
     * @param {import('@UEventDispatcher').DispatchInputEvent} e
     *
     * @ignore
     */
    _loadedListener(e: DispatchInputEvent): void;
    /**
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object
     * @return {boolean}
     *
     * @ignore
     */
    _isSelected(object: UMesh): boolean;
    /** @ignore */
    _clearMeasureFeature(): void;
    /** @ignore */
    _commitFeature(): void;
    /**
     * @param {string} type
     *
     * @ignore
     */
    _addSelectMode(type: string): void;
    /**
     * @param {import('@UEventDispatcher').DispatchInputEvent} e
     *
     * @ignore
     */
    _selectEvent(e: DispatchInputEvent): void;
    /**
     * @param {import('@UCssBilboard').UCssBilboard} poi
     *
     * @ignore
     */
    _removeCursor(poi: UCssBilboard): void;
}

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyAlarm 생성자 옵션
     */
    type UAnalyAlarmCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 하이라이트 색상
         */
        _highlightColor?: number;
        /**
         * 알람 타입
         */
        _type?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyAlarm 생성자 옵션
     */
    type UAnalyAlarmCO = Omit<Omit<UAnalyCO, never> & UAnalyAlarmCO_Content, never>;

/**
     * 레이어에서 편집으로 생성/변경된 Model 정보
     */
    type ModelEditInfo = {
        /**
         * 편집으로 생성된 mesh
         */
        mesh?: UMesh;
        /**
         * 편집 데이터 (예: split 병합 정보)
         */
        editData: KeyValue;
    };

type ModelLayerLike = {
        getName?: () => string;
        getModelById: (arg0: string | number, arg1: boolean | undefined) => (UMesh | undefined);
        editedList?: Array<string | number>;
        editedEvent?: Record<string, ModelEditInfo>;
        off?: (arg0: string, arg1: Function) => void;
        addEventListener?: (arg0: string, arg1: Function, arg2: boolean | undefined, arg3: string | undefined) => void;
        removeEventListener?: (arg0: string, arg1: Function) => void;
        getEditedEventById?: (arg0: string) => (ModelEditInfo | undefined);
    };

/**
     * POI cursor 알람 세부 옵션
     */
    type Alarm_DetailOpt = {
        xsize?: number;
        ysize?: number;
        height?: number;
        image?: string;
    };

export type { Alarm_DetailOpt, ModelEditInfo, ModelLayerLike, UAnalyAlarm, UAnalyAlarmCO, UAnalyAlarmCO_Content };
