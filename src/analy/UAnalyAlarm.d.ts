// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
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
 *
 * `Alarm 기능` 추가 클래스 <br>
 * poi 알람, model 알람, 생성된 알람 편집/설정 등의 기능을 제공합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/analysisAlarm.html}
 */
declare class UAnalyAlarm extends UAnaly {
    /**
     * 알람 목록과 선택·프레임 상태를 초기화합니다. 앱은 setApp()으로 별도 연결합니다.
     *
     * @param {UAnalyAlarmCO} [opt={}]
     */
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
     * 현재 알람에 연결된 선택기를 반환합니다.
     *
     * @returns {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     */
    getSelecter(): U3dSelect | undefined;
    /**
     * 여러 객체를 그룹으로 등록하는 다각형 입력 모드를 켭니다.
     */
    onMultiMode(): void;
    /**
     * 다중 입력 이벤트와 등록된 모델 로딩 리스너를 해제합니다.
     */
    offMultiMode(): void;
    /**
     * 커서 세부 설정 대상 ID를 등록하고 click 이벤트를 발생시킵니다.
     *
     * @param {string | number} id 세부 정보 추가 POI ID
     */
    addDetailList(id: string | number): void;
    /**
     * 자식이 있는 UGroup을 알람 POI 목록에 추가합니다.
     *
     * @param {import('@UGroup').UGroup} poi 알람을 추가하려는 POI 객체
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * let poi = U3dBilboard.makeBilboard({ position: position, text: text });
     * analy.addPOI(poi);
     */
    addPOI(poi: UGroup): void;
    /**
     * UMesh를 소유 레이어가 있는 모델 알람 목록에 추가합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model 알람을 추가하려는 model 객체
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * analy.addModel(mesh);
     */
    addModel(model: UMesh): void;
    /**
     * 등록한 POI 그룹의 원본 children 배열을 반환합니다.
     *
     * @returns {Array<import('@UCssBilboard').UCssBilboard>} addPOI 로 추가된 객체들을 반환합니다.
     */
    getPOIGroupChildren(): Array<UCssBilboard>;
    /**
     * 등록한 모델·그룹의 원본 배열을 반환합니다.
     *
     * @returns {Array<import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh>} addModel 로 추가된 model 객체들을 반환합니다.
     */
    getModelGroupChildren(): Array<UGroup | UMesh>;
    /**
     * 커서 세부 설정 대상 ID의 원본 배열을 반환합니다.
     *
     * @returns {Array<string | number>} cursorMode 시 세부정보를 설정 하려는 POI의 ID들의 배열을 반환합니다.
     */
    getDetailList(): Array<string | number>;
    /**
     * 등록한 ID가 POI·model·group 중 어느 타입인지 조회합니다.
     *
     * @param {string | number} id 현재 편집목록에 추가된 객체 중 타입 정보를 알고 싶은 객체의 ID
     * @returns {string | undefined} `POI` / `model` / `group`
     */
    getInstanceType(id: string | number): string | undefined;
    /**
     * POI ID의 커서 이미지·크기·높이 차를 설정합니다.
     *
     * @param {string} id cursor 알람시 설정하고 싶은 객체의 ID
     * @param {number} [xsize=40] 설정한 이미지의 x사이즈 크기
     * @param {number} [ysize=40] 설정한 이미지의 y사이즈 크기
     * @param {number} [height=50] 설정한 이미지와 POI의 높이 차
     * @param {string} [image] 설정하려고 하는 이미지의 파일 경로
     */
    addDetailOpt(id: string, xsize?: number, ysize?: number, height?: number, image?: string): void;
    /**
     * 일치하는 세부 설정 ID와 해당 옵션을 제거합니다.
     *
     * @param {string} id cursorMode 알람 시 세부정보를 삭제하고 싶은 객체의 ID
     */
    removeDetailList(id: string): void;
    /**
     * 등록한 POI를 조회합니다. 배열 입력은 각 ID를 객체 또는 undefined로 덮어쓰며 같은 배열을 반환합니다.
     *
     * @param {Array<string | number>} idList 찾으려는 POI 객체의 ID 또는 ID 배열
     * @returns {Array<import('@union3d/core/UGroup').UGroup> | import('@union3d/core/UGroup').UGroup | undefined} 찾은 POI List 반환
     */
    findPOI(idList: Array<string | number>): Array<UGroup> | UGroup | undefined;
    /**
     * 등록 모델 또는 그룹을 조회하고 현재 교차 모델로 복원합니다. 단일 그룹은 원본 그룹의 children을 교체합니다.
     *
     * @param {Array<string | number> | string | number} idList 찾으려는 model 객체의 ID 또는 ID 배열
     * @returns {import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh | undefined} 찾은 model List 반환
     */
    findModel(idList: Array<string | number> | string | number): UGroup | UMesh | undefined;
    /**
     * 등록 ID의 기존 알람을 중지한 뒤 지정한 POI 모드 또는 모델 깜박임을 실행합니다.
     *
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
     * 모델 해제 시 저장한 남은 알람 설정을 조회하여 다시 실행합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model 알람 도중 dispose된 Model 객체
     */
    disposedStopModelAlarm(model: UMesh): void;
    /**
     * 단일 모델 또는 배열의 모델 깜박임을 시작합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh | Array<import('@union3d/core/mesh/UMesh').UMesh>} model 알람을 설정하려는 model 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     * @param {number | string} [color] 알람 색상
     */
    modelFlickerMode(model: UMesh | Array<UMesh>, count: number, speed: number, color?: number | string): void;
    /**
     * 모델의 기존 예약과 선택 색상 상태를 정리한 뒤 깜박임을 예약합니다.
     * 정상 반복 종료에는 복원 색상을 적용하고 해당 ID의 예약 기록을 제거합니다.
     *
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
     * 단일 POI 또는 배열의 표시·숨김 알람을 시작합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    flickerMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number): void;
    /**
     * POI의 기존 예약을 취소한 뒤 표시·숨김 알람을 예약합니다.
     * 정상 반복 종료에는 visible을 true로 복원하고 해당 ID의 예약 기록을 제거합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    flickerModeAnimation(poi: UCssBilboard, count: number, speed: number): void;
    /**
     * POI 크기 알람을 시작합니다. 단일 입력은 기본 크기로 복원하지만 배열 입력은 현재 크기를 유지합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    sizeMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number): void;
    /**
     * POI 크기 알람을 예약합니다. 종료는 반복 기준과 원래 크기의 일치를 함께 따르며 종료 뒤 예약 기록은 남습니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} speed 알람 속도
     * @param {number} count 알람 횟수
     * @param {number} [oriSize=8] 알람시작 전 원래 POI의 사이즈
     */
    sizeModeAnimaition(poi: UCssBilboard, speed: number, count: number, oriSize?: number): void;
    /**
     * 단일 POI 또는 배열의 커서 이동 알람을 시작합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람 대상 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    cursorMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number): void;
    /**
     * 기존 커서와 예약을 정리하고 이미지 커서의 이동을 예약합니다. 텍스처 완료를 기다리지 않으며 정상 종료 뒤 커서 객체는 남습니다.
     * 세부 옵션에 image가 없으면 진단을 출력하고 새 커서를 만들지 않습니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} speed 알람 속도
     * @param {number} count 알람 횟수
     */
    cursorModeAnimation(poi: UCssBilboard, speed: number, count: number): void;
    /**
     * 원래 모델 타일이 사용 가능하면 해제 시 보관한 알람의 재개를 검사합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model dispose 되어 정지된 알람의 대상 객체
     */
    isDisposedStopModel(model: UMesh): void;
    /**
     * 등록 주소의 현재 모델을 조회하고 모델이 없으면 조건에 맞는 편집 모델을 조회합니다.
     *
     * @param {string} id 찾고 싶은 model의 id
     * @returns {import('@union3d/core/mesh/UMesh').UMesh | undefined} selectedObject 결과 Model 반환
     */
    getIntersectModel(id: string): UMesh | undefined;
    /**
     * 모든 모델 알람을 제거하고 정리 결과를 반환합니다.
     *
     * @returns {object}
     */
    removeAllAlarm(): object;
    /**
     * 세부 설정 대상과 옵션을 모두 비우고 click 이벤트를 발생시킵니다.
     */
    removeAllDetailOpt(): void;
    /**
     * 등록 ID의 POI 또는 모델 알람을 제거하고 전체 선택을 해제합니다.
     *
     * @param {string | number} id 삭제 대상 ID
     */
    removeAlarm(id: string | number): void;
    /**
     * ID의 예약을 취소하고 POI 또는 모델의 표시 상태를 복원합니다.
     *
     * @param {string | number} id 삭제 대상 ID
     */
    stopAlarmById(id: string | number): void;
    /**
     * 등록한 POI·모델의 알람을 중지하고 기본 표시 상태를 적용합니다.
     */
    stopAllAlarm(): void;
    /**
     * ID별 프레임 예약을 취소합니다. 객체의 가시성·색상·크기·커서 자원은 변경하지 않습니다.
     *
     * @param {string | number} id 삭제 대상 ID
     */
    stopActiveAlarm(id: string | number): void;
    /**
     * 모델 또는 배열을 다중 선택에 추가하고 화면 갱신을 요청합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh | Array<import('@union3d/core/mesh/UMesh').UMesh>} object 영역 안에 해당하여 추가하려는 객체
     */
    addSelected(object: UMesh | Array<UMesh>): void;
    /**
     * 선택 색상을 복원하고 선택 저장소와 다중 표출 연결을 정리합니다.
     *
     * @param {boolean} [isChecked=false] mesh-loaded event 삭제 여부
     */
    clearSelect(isChecked?: boolean): void;
    /**
     * 분석 이벤트에 사용자 함수를 등록합니다. 이벤트 함수의 this는 이 분석 객체입니다.
     *
     * @param {EventCallBack} func Click 이벤트 함수
     * @param {string} [event] 이벤트 타입
     */
    passToClickEvent(func: EventCallBack, event?: string): void;
    /**
     * 선택된 모델의 선택 색상을 복원하고 화면 갱신을 요청합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object 삭제하려는 객체
     */
    removeSelected(object: UMesh): void;
    /**
     * 이후 생성할 커서 이미지 URL을 저장합니다.
     *
     * @param {string} url 이미지 파일 경로
     */
    setCursorImage(url: string): void;
    /**
     * 클릭 위치에 POI를 추가하고 목록 변경·화면 갱신을 전달합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    _click(e: U3dMouseEvent): void;
    /**
     * 다각형 입력점을 등록하고 모델 경계와 다중 선택 지원 여부를 검사합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     * @returns {boolean | undefined}
     *
     * @ignore
     */
    _polygonClick(e: U3dMouseEvent): boolean | undefined;
    /**
     * 선택 키의 색상을 복원하고 조건에 따라 모델 로딩 리스너를 해제합니다.
     *
     * @param {string} key
     * @param {boolean} [isChecked=false]
     *
     * @ignore
     */
    _removeSelectedByKey(key: string, isChecked?: boolean): void;
    /**
     * 소유 레이어의 모델 선택과 로딩 재연결 정보를 등록합니다.
     *
     * @param {string} layerName
     * @param {string | number} id
     *
     * @ignore
     */
    _addSelected_(layerName: string, id: string | number): void;
    /**
     * 소유 레이어가 없는 모델의 선택 색상과 선택 기록을 적용합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object
     *
     * @ignore
     */
    _addSelectedNotLayer_(object: UMesh): void;
    /**
     * 지정 레이어에서 ID의 현재 모델을 조회합니다.
     *
     * @param {string} layerName
     * @param {string | number} id
     * @returns {import('@union3d/core/mesh/UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _findModelSelect(layerName: string, id: string | number): UMesh | undefined;
    /**
     * 입력한 그룹명으로 선택 그룹을 등록하고 측정 결과를 정리합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    _polygonDblclick(e: U3dMouseEvent): void;
    /**
     * 앱의 측정 레이어 참조를 반환합니다.
     *
     * @ignore
     */
    _getSelectLayer(): any;
    /**
     * 레이어 이름별로 모델 재로딩 리스너를 등록합니다.
     *
     * @param {ModelLayerLike} layer
     *
     * @ignore
     */
    _addLoadedListener(layer: ModelLayerLike): any;
    /**
     * 저장한 로딩 리스너를 레이어에서 해제합니다. 저장소의 키는 유지합니다.
     *
     * @ignore
     */
    _removeAllLoadedListener(): void;
    /**
     * 재로딩된 선택 모델에 선택 색상을 적용하고 선택 참조를 교체합니다.
     *
     * @param {import('@UEventDispatcher').DispatchInputEvent} e
     *
     * @ignore
     */
    _loadedListener(e: DispatchInputEvent): void;
    /**
     * 객체의 선택 키가 저장돼 있는지 반환합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object
     * @returns {boolean}
     *
     * @ignore
     */
    _isSelected(object: UMesh): boolean;
    /**
     * 측정점을 확정하고 선택기의 측정 피처가 있으면 앱에서 제거합니다.
     *
     * @ignore
     */
    _clearMeasureFeature(): void;
    /**
     * 현재 측정점의 확정 결과가 있으면 분석의 피처 참조로 보관합니다.
     *
     * @ignore
     */
    _commitFeature(): void;
    /**
     * 선택 모드와 이벤트 중계를 연결하고 선택기를 활성화합니다.
     *
     * @param {string} type
     *
     * @ignore
     */
    _addSelectMode(type: string): void;
    /**
     * 선택기의 모델·리스너 정보를 알람 목록과 다음 선택 그룹에 반영합니다.
     *
     * @param {import('@UEventDispatcher').DispatchInputEvent} e
     *
     * @ignore
     */
    _selectEvent(e: DispatchInputEvent): void;
    /**
     * POI에 연결한 커서 자원을 해제하고 부모에서 분리합니다. Sprite의 공용 geometry와 userData 참조는 유지합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard} poi
     *
     * @ignore
     */
    _removeCursor(poi: UCssBilboard): void;
}

/**
     * ~extends UAnalyCO <br>
     *
     * UAnalyAlarm의 분석 이름·등록 타입·하이라이트 저장 색상을 지정하는 생성 옵션입니다.
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
     * ~extends UAnalyCO <br>
     *
     * UAnalyAlarm의 분석 이름·등록 타입·하이라이트 저장 색상을 지정하는 생성 옵션입니다.
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
        /**
         * ID 모델 조회
         */
        getModelById: UAnalyAlarmModelLookup;
        editedList?: Array<string | number>;
        editedEvent?: Record<string, ModelEditInfo>;
        off?: (arg0: string, arg1: Function) => void;
        addEventListener?: (arg0: string, arg1: Function, arg2: boolean | undefined, arg3: string | undefined) => void;
        removeEventListener?: (arg0: string, arg1: Function) => void;
        /**
         * ID 편집 정보 조회
         */
        getEditedEventById?: UAnalyAlarmEditedLookup;
    };

/**
     * 모델 레이어의 ID 조회 함수입니다. 미발견 결과는 undefined입니다.
     */
    type UAnalyAlarmModelLookup = (id: string | number, create?: boolean) => UMesh | undefined;

/**
     * 모델 레이어의 편집 이벤트 조회 함수입니다. 미발견 결과는 undefined입니다.
     */
    type UAnalyAlarmEditedLookup = (id: string) => ModelEditInfo | undefined;

/**
     * POI cursor 알람 세부 옵션
     */
    type Alarm_DetailOpt = {
        xsize?: number;
        ysize?: number;
        height?: number;
        image?: string;
    };

/**
     * 알람 예약 구현에 전달하는 프레임 상태와 취소·재개 기능입니다.
     * 공개 메서드를 대체하지 않고 원래 인스턴스의 상태와 호출 결과를 그대로 사용합니다.
     */
    type UAnalyAlarmAnimationOwner = Pick<UAnalyAlarm, "_activeAnimaition" | "_infoActiveAlarm" | "_disposedAlarmInfo" | "stopActiveAlarm" | "isDisposedStopModel">;

/**
     * 모델 그룹 복원·경계 검사에서 사용하는 선택 상태와 조회 기능입니다.
     */
    type UAnalyAlarmSelectionOwner = Pick<UAnalyAlarm, "_selected" | "getIntersectModel" | "_isSelected">;

/**
     * 커서 조립 결과와 애니메이션 복원 기준의 위치 참조입니다.
     */
    type UAnalyAlarmCursorResult = {
        /**
         * POI에 연결한 새 커서 스프라이트
         */
        sprite: three.Sprite;
        /**
         * POI position의 원본 참조이며 이동 후 복원에도 현재 값을 사용
         */
        poiPosition: three.Vector3;
    };

export type { Alarm_DetailOpt, ModelEditInfo, ModelLayerLike, UAnalyAlarm, UAnalyAlarmAnimationOwner, UAnalyAlarmCO, UAnalyAlarmCO_Content, UAnalyAlarmCursorResult, UAnalyAlarmEditedLookup, UAnalyAlarmModelLookup, UAnalyAlarmSelectionOwner };
