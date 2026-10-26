//@ts-check
import * as THREE from 'three';
import {defined} from '@union3d/util/defined';
import {defaultValue} from '@union3d/util/defaultValue';
import {UDEF} from '@union3d/core/UDEF';
import {UMesh} from '@union3d/core/mesh/UMesh';
import {USharedMesh} from '@union3d/core/mesh/USharedMesh';
import {UEventDispatcher} from '@union3d/core/UEventDispatcher';
import {UGroup} from '@union3d/core/UGroup';
import {U3dBilboard} from '@union3d/geometry/U3dBilboard';
import {U3DTilesMesh} from '@union3d/core/mesh/U3DTilesMesh';
import {U3dEvent} from '@union3d/event/U3dEvent';
import {__GInfo__, U3dMessage} from '@union3d/message/U3dMessage';
import {U3dGeometry} from '@union3d/geometry/U3dGeometry';
import {deferred} from "@union3d/util/deferred";
import {URaycaster} from "@union3d/core/URaycaster";
import {U3dComponentPosition} from "@union3d/3dLayer/U3dComponentPosition";
import {U3dSelectionBox} from "@union3d/select/U3dSelectionBox";
import {U3dSelectionRing} from "@union3d/select/U3dSelectionRing";
import {U3dObjectBarrier} from "@union3d/select/U3dObjectBarrier";
import {planeShader, verticalShader} from "@union3d/shader/GVerticalObjectShader";
import {UTileMesh} from "@union3d/core/mesh/UTileMesh";
import {U3dAppEventHandler} from "@union3d/event/U3dAppEventHandler";
import {U3dModelU3FLayer} from "@union3d/3dLayer/U3dModelU3FLayer.js";
import {U3dComponentInstancedPosition} from "@union3d/3dLayer/U3dComponentInstancedPosition.js";
import {pickScreenCircle, applyHoverColor} from "@union3d/select/U3dSelect.internal.js";

const invisibleRay = new URaycaster({usevisible: false});
const TEMP_BOX = new THREE.Box3();

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 *
 * 지도 위 3D 객체를 사용자가 고르는 기능(선택)을 담당하는 클래스입니다. <br>
 * 클릭(POINT), 영역·선·원 그리기(AREA/LINE/CIRCLE), 드래그 사각형(BOX) 모드로 객체를 찾아 내부 선택 목록에 넣고, 외곽선 또는 색상으로 강조 표시하며, 진행 상황을 `U3dSelect.EVENT`(`start`/`change`/`end`) 이벤트로 알립니다. <br>
 * 생성 후 `setApp(app)`으로 앱을 연결하고 `active()`를 호출해야 사용자 입력을 받기 시작하며, 다 쓰면 `remove()`로 해제합니다.
 *
 * @group select
 */
/// <summary>지도 입력으로 대상을 찾아 선택 목록과 강조 표시를 관리합니다. 시퀀스 편집기는 GUID에 연결된 메시를 이 선택기에 전달합니다. 앱 종료 후에는 레이어 조회·그리기 갱신을 차단하면서 선택 참조와 자체 효과를 정리합니다.</summary>
class U3dSelect extends UEventDispatcher {
    /**
     * 이 선택기 인스턴스의 고유 식별자(GUID)입니다. <br>
     * BOX 모드 리스너 이름의 접두어로 씁니다.
     *
     * @type {string}
     */
    uuid;
    /**
     * 색상 강조 시 재질에 적용할 스타일(생성 옵션 `style`). `remove()` 후 undefined.
     *
     * @type {KeyValue|undefined}
     */
    style;
    /**
     * 현재 선택 모드(`UDEF.SELECT_MODE`의 값: point/area/line/circle/box)입니다. <br>
     * `setMode()`로 바꿉니다.
     *
     * @type {string}
     */
    mode;
    /**
     * 강조 표시 중 모델 텍스처를 감출지 여부(생성 옵션 `exceptTexture`).
     *
     * @type {boolean}
     */
    exceptTexture;
    /**
     * true면 선택 목록 관리와 하이라이트를 이 클래스가 자동 수행하고, false면 이벤트로 선택 객체만 전달한다(생성 옵션 `auto`).
     *
     * @type {boolean}
     */
    _auto;
    /**
     * `_auto`가 false일 때 이벤트 `data`로 전달하기 위해 모아 두는 선택 객체 목록입니다. <br>
     * `clearSelect()`에서 비워집니다.
     *
     * @type {Array<any>}
     */
    _manualSelects;
    /**
     * 현재 선택된 객체 맵. 키는 `layerName^id` 형식의 선택 키, 값은 선택 객체.
     *
     * @type {KeyValue}
     */
    _selected;
    /**
     * 병합 메시 분할 후 원복이 필요한 항목을 선택 키별로 표시하는 플래그 맵.
     *
     * @type {Record<string, boolean>}
     */
    _reset;
    /**
     * 모델 로드 완료 후 선택을 다시 적용하기 위해 레이어에 등록한 로드 콜백입니다. <br>
     * 선택 키별로 보관해 해제 시 제거합니다.
     *
     * @type {Record<string, EventCallBack | undefined>}
     */
    _loadedListeners;
    /**
     * 앱에 등록한 `click` 리스너 식별자. 비활성 상태면 undefined.
     *
     * @type {string | undefined}
     */
    _clickId;
    /**
     * 앱에 등록한 `dblclick` 리스너 식별자(AREA/LINE/CIRCLE 모드). 비활성 상태면 undefined.
     *
     * @type {string | undefined}
     */
    _dblClickId;
    /**
     * 영역 선택 도형을 그리는 측정 레이어입니다. <br>
     * `setApp()`에서 앱의 측정 레이어로 연결됩니다.
     *
     * @type {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer | undefined}
     */
    _selectLayer;
    /**
     * 영역 선택 중 클릭 지점에 표시하는 안내 빌보드(`center`, `click`)를 담는 그룹.
     *
     * @type {import('@UGroup').UGroup}
     */
    _poiGroup;
    /**
     * 영역 선택이 확정된 뒤 보관하는 측정 도형 feature. `getSelectWork()`의 점 목록 원본.
     *
     * @type {import('@UMeasureFeature').UMeasureFeature | undefined}
     */
    _measureFeature;
    /**
     * `active()`로 사용자 입력을 받는 상태인지 여부.
     *
     * @type {boolean}
     */
    _isActive;
    /**
     * POINT 모드에서 선택된 지점의 위경도 좌표 누적 목록입니다. <br>
     * `getSelectWork()`가 반환하며 반환 후 비워집니다.
     *
     * @type {Array<GeoPosition>}
     */
    _posList;
    /**
     * 선택 해제 시 재질에 되돌릴 기본 색.
     *
     * @type {import('three').ColorRepresentation}
     */
    _defaultColor;
    /**
     * 선택 해제 시 재질에 되돌릴 기본 투명도(0~1).
     *
     * @type {number}
     */
    _defaultOpacity;
    /**
     * 생성 시의 강조 색. `resetSelectedColor()`가 되돌리는 값.
     *
     * @type {import('three').ColorRepresentation}
     */
    _oriSelectColor;
    /**
     * 생성 시의 강조 투명도(0~1).
     *
     * @type {number}
     */
    _oriSelectOpacity;
    /**
     * 현재 강조 색입니다. <br>
     * `setSelectedColor()`로 바뀝니다.
     *
     * @type {import('three').ColorRepresentation}
     */
    _selectColor;
    /**
     * 현재 강조 투명도(0~1).
     *
     * @type {number}
     */
    _selectOpacity;
    /**
     * 마지막으로 dispatch한 선택 이벤트 종류(`start`/`change`/`end`)입니다. <br>
     * `deactive()`가 정리 여부를 판단하는 데 씁니다.
     *
     * @type {string}
     */
    _workEvent;
    /**
     * BOX 모드의 선택 박스와 리스너 식별자 묶음. 형태는 `SelectBoxEvent` 참조.
     *
     * @type {SelectBoxEvent}
     */
    selectBoxEvent;
    /**
     * `addRayOption()`으로 쌓은 레이캐스트 옵션입니다. <br>
     * 앱의 intersect 호출에 그대로 전달됩니다.
     *
     * @type {KeyValue}
     */
    _rayOption;
    /**
     * 강조 방식(`UDEF.SELECT_TYPE`의 값: outline/color/ring).
     *
     * @type {string}
     */
    _selectType;
    /**
     * 강조 방식의 추가 옵션입니다. 외곽선은 기본 간략 윤곽 설정을 보완해 저장합니다.
     *
     * @type {KeyValue|undefined}
     */
    _selectTypeOption;
    /**
     * outline 강조에 외곽선 애니메이션을 적용할지 여부.
     *
     * @type {boolean}
     */
    _selectedPulse;
    /**
     * 선택 시 지표면까지 내려오는 수직 보조 객체를 만들지 여부.
     *
     * @type {boolean}
     */
    _setVerticalObject;
    /**
     * 선택 키별 수직 보조 객체(`UGroup`)입니다. <br>
     * `_setVerticalObject`가 true일 때만 생성됩니다.
     *
     * @type {Record<string, import('@UGroup').UGroup | undefined>}
     */
    _verticalObjects;
    /**
     * `setApp()`으로 연결된 앱입니다. <br>
     * 연결 전에는 대부분의 메서드가 동작하지 않습니다.
     *
     * @type {import('@U3dApp').U3dApp}
     */
    _app;
    /**
     * outline 강조를 실제로 그리는 배리어 객체입니다. <br>
     * 첫 outline 적용 시 생성됩니다.
     *
     * @type {import('@union3d/select/U3dObjectBarrier').U3dObjectBarrier}
     */
    _effector;
    /**
     * 선택 키별 회전 링을 관리하며, 링을 처음 적용할 때 생성합니다.
     * @type {import('@union3d/select/U3dSelectionRing').U3dSelectionRing | undefined}
     */
    _ringEffector;
    /**
     * 이 클래스가 dispatch하는 선택 이벤트 이름입니다. <br>
     * `on(U3dSelect.EVENT.END, callback)`처럼 사용합니다. <br>
     * START: 사용자가 선택 동작을 시작했을 때 발생하며 payload `data`는 null입니다. <br>
     * CHANGE: 선택 목록이 바뀌는 중(드래그·다각형 점 추가 등)에 발생합니다. <br>
     * END: 선택 동작이 끝났을 때 발생합니다. <br>
     * CHANGE/END의 payload는 `{type, data, work}`이며 `data`는 선택 객체 배열, `work`는 `getSelectWork()`와 같은 형태의 작업 정보입니다. <br>
     * BOX 모드는 추가로 `pointerdown`/`pointermove`/`pointerup`을 dispatch합니다.
     *
     * HOVER_CHANGE: hover 대상 변경 시 `{previous, current, intersection}`을 전달합니다. 이탈 시 current는 null입니다.
     *
     * @type {{START: string, CHANGE: string, END: string, HOVER_CHANGE: string}}
     */
    static EVENT = {
        START: 'start',
        CHANGE: 'change',
        END: 'end',
        HOVER_CHANGE: 'hoverchange'
    }
    /**
     * 강조 표시 방식 이름입니다. <br>
     * `setSelectType()`과 생성 옵션 `selectType`에 사용합니다. <br>
     * COLOR: 선택 객체의 재질 색을 바꿔 강조합니다. <br>
     * OUTLINE: 객체 외곽선을 그려 강조합니다(기본값). <br>
     * RING: 지정한 크기의 회전 링으로 강조합니다.
     *
     * @type {{COLOR: string, OUTLINE: string, RING: string}}
     */
    static TYPE = {
        COLOR: 'color',
        OUTLINE: 'outline',
        RING: 'ring'
    }
    // 객체 검색 후 중복 제거를 위해서, 검색할때 검색된것들 잠깐 넣어두는 속성
    // 검색끝나고 항상 잘 비워두어야한다.
    // 지금은 checkGeom에서 checkInstanceObject에서 사용된다.
    /** @type {Map<any, any>} */
    #searchLog = new Map(); //key는 검색된 객체, value는 intersect 객체 자체
    /** @type {Array<string>|undefined} */
    #targetLayer = undefined; //객체 검색할때, 입력한 레이어만 검색을 하는 속성 = > 검색을 빠르게 할때 레이어 지정 입력
    /** @type {number} POINT 모드의 원형 화면 검색 반경(CSS 픽셀). 0이면 기존 레이 검색을 사용합니다. */
    #pickBufferPx;
    /** @type {boolean} 점 선택의 화면 검색 범위를 표시할지 여부입니다. */
    #pickBufferVisible;
    /** @type {HTMLDivElement | undefined} 선택기가 소유하는 화면 검색 범위 원입니다. */
    #bufferCircle;
    /** @type {Window | null | undefined} 범위 표시의 화면 크기 변경을 구독한 창입니다. */
    #bufferWindow;
    /** 화면 크기 변경 시에도 마지막 NDC와 실제 검색 반경으로 범위를 표시합니다. */
    #bufferResize = () => this.#renderBufferCircle();
    /** @type {boolean} hover 사용 여부. 기본값은 false입니다. */
    #hoverEnabled;
    /** @type {boolean} 자동 색상 강조 여부. 끄면 hoverchange에서 표시를 결정합니다. */
    #hoverAutoHighlight;
    /** @type {import('three').Color} 원본 재질과 독립적인 임시 강조 색상입니다. */
    #hoverColor;
    /** @type {SelectPointerEvent | undefined} DOM 이벤트를 보관하지 않는 마지막 마우스 NDC 위치입니다. */
    #hoverPointer;
    /** @type {U3dSelectHoverTarget | null} 클릭 선택 목록과 독립적으로 관리하는 hover 대상입니다. */
    #hoverTarget = null;
    /** @type {(() => void) | undefined} 임시 강조의 복원·자원 해제 함수입니다. */
    #hoverRestore;
    /** @type {(() => void) | undefined} 색상 적용 여부와 독립적인 hover 대상 삭제·geometry 해제 구독입니다. */
    #hoverCleanup;
    /** @type {Array<{type: string, key: string}>} hover가 등록한 앱 이벤트 식별자입니다. */
    #hoverListeners = [];
    /** @type {boolean} 버튼을 누른 동안에는 hover 검색을 중지합니다. */
    #hoverDragging = false;
    /** @type {boolean} 해제 이벤트에서 런타임 설정을 바꿔도 종료 중인 구독을 다시 등록하지 않습니다. */
    #hoverStopping = false;
    /**
     * U3dSelect 클래스 생성자입니다. <br>
     * 생성만으로는 동작하지 않습니다. <br>
     * `setApp(app)`으로 앱을 연결한 뒤 `active()`를 호출해야 클릭·드래그 입력을 받습니다.
     *
     * @param {U3dSelectCO} [opt={}] 생성 옵션. 항목별 의미와 기본값은 {@link U3dSelectCO} 참조
     * @throws {RangeError} pickBufferPx가 유한한 0 이상의 숫자가 아닌 경우
     * @throws {TypeError} 외곽선의 farPoint가 옵션 객체 또는 null이 아니거나 hover.autoHighlight가 불리언이 아닌 경우
     */
    constructor(opt = {}) {
        super();
        const pickBufferPx = opt.pickBufferPx ?? 100;
        if (!Number.isFinite(pickBufferPx) || pickBufferPx < 0) {
            throw new RangeError('pickBufferPx는 유한한 0 이상의 숫자여야 합니다.');
        }
        this.#pickBufferPx = pickBufferPx;
        this.#pickBufferVisible = opt.pickBufferVisible ?? !false;
        if (opt.hover?.autoHighlight !== undefined && typeof opt.hover.autoHighlight !== 'boolean') {
            throw new TypeError('hover.autoHighlight는 불리언이어야 합니다.');
        }
        this.#hoverEnabled = opt.hover?.enabled ?? !false;
        this.#hoverAutoHighlight = opt.hover?.autoHighlight ?? true;
        this.#hoverColor = new THREE.Color(opt.hover?.color ?? 0x00ff00);
        let self = this;
        self.uuid = UDEF.createUUID();
        self.style = defaultValue(opt.style, {
            color: 0x7f0000,
            side: THREE.FrontSide,
            metalness: 0,
            roughness: 1,
            transparent: false
        });
        self.mode = defaultValue(opt.mode, UDEF.SELECT_MODE.POINT); // 'point', 'area'
        if(opt.targetLayer){
            this.#targetLayer = [];
            if(opt.targetLayer instanceof Array)
                this.#targetLayer.push(...opt.targetLayer);
            else
                this.#targetLayer.push(opt.targetLayer);
        }

        self.exceptTexture = defaultValue(opt.exceptTexture, false);
        self._auto = defaultValue(opt.auto, true);
        self._manualSelects = [];
        self._selected = {};
        self._reset = {};
        self._loadedListeners = {};
        self._clickId = undefined;
        self._dblClickId = undefined;
        self._selectLayer = undefined;
        self._poiGroup = new UGroup();
        // self._dispatcher  = new UEventDispatcher();
        self._measureFeature = undefined; //측정 피쳐
        self._isActive = false;
        self._posList = [];

        self._defaultColor = 0xffffff;
        self._defaultOpacity = 1;

        self._oriSelectColor = 0xff0000;
        self._oriSelectOpacity = 1;

        self._selectColor = self._oriSelectColor;
        self._selectOpacity = self._oriSelectOpacity;

        self._workEvent = "";
        self.selectBoxEvent = {
            selectBox : undefined,
            pointerDownId : undefined,
            pointerMoveId : undefined,
            pointerUpId : undefined
        }
        self._rayOption = {};

        // 선택 타입: 색상, 외곽선, 회전 링
        self._selectType = opt.selectType || UDEF.SELECT_TYPE.OUTLINE;
        self._selectTypeOption = self.#normalizeSelectTypeOption(self._selectType, opt.selectTypeOption);
        self._selectedPulse = opt.selectedPulse ?? true;
        self._setVerticalObject = opt.setVerticalObject ?? false;
        if(self._setVerticalObject){
            self._verticalObjects = {}; // 지표면에 맞닿는 수직선 객체를 담는 속성 값
        }
    }

    /**
     * 선택 대상 레이어를 추가하는 함수 <br>
     * `targetLayer`를 지정하면 picking(선택) 시 해당 레이어들의 scene 위주로 검사하여 성능을 개선할 수 있습니다.
     *
     * @param {string} layerName 레이어 이름
     */
    addTargetLayer(layerName){
        if(!this.#targetLayer)
            this.#targetLayer = [];
        if(!this.#targetLayer.includes(layerName))
            this.#targetLayer.push(layerName);
    }

    /**
     * 선택 대상 레이어를 제거하는 함수
     *
     * @param {string} layerName 레이어 이름
     */
    removeTargetLayer(layerName){
        if(!this.#targetLayer)
            return;
        const index = this.#targetLayer.indexOf(layerName);
        if(index >= 0)
            this.#targetLayer.splice(index,1);
    }

    /**
     * Raycaster(교차 검사) 옵션을 추가/갱신하는 함수 <br>
     * 지정된 옵션은 내부 intersect 호출(`intersectAtPixel`, `intersectFromScene`)에 전달됩니다.
     *
     * @param {string} key 레이캐스터 옵션 이름(예: `usevisible`, 교차 대상 필터 등 앱 intersect 함수가 받는 옵션)
     * @param {any} value 그 옵션에 넣을 값. 같은 키를 다시 지정하면 덮어쓴다
     *
     */
    addRayOption (key, value) {
        this._rayOption[key] = value;
    }

    /**
     * BOX 선택 모드에서 사용되는 선택 박스 객체를 반환하는 함수
     *
     * @returns {import('@union3d/select/U3dSelectionBox').U3dSelectionBox | undefined} 드래그 사각형을 그리는 선택 박스. BOX 모드로 활성화된 적이 없으면 undefined
     */
    getSelectBox(){
        return this.selectBoxEvent.selectBox;
    }

    /**
     * 외곽선의 초기 옵션을 보완하고 최소 크기를 단일 속성으로 저장합니다.
     *
     * @param {string} type 선택 강조 방식
     * @param {KeyValue} [option] 사용자 지정 옵션
     * @returns {KeyValue | undefined} 복사한 외곽선 옵션 또는 다른 방식의 기존 옵션
     * @throws {TypeError} farPoint가 옵션 객체 또는 null이 아닌 경우
     */
    #normalizeSelectTypeOption(type, option) {
        if (type !== UDEF.SELECT_TYPE.OUTLINE) return option;
        const input = option?.farPoint;
        if (input === null) return {...option, farPoint: null};
        if (input !== undefined && (typeof input !== 'object' || Array.isArray(input))) {
            throw new TypeError('farPoint는 옵션 객체 또는 null이어야 합니다.');
        }
        /** @type {UOutlineFarPointOption} */
        const farPoint = {enabled: true, thresholdSizePx: 24, minSizePx: 5, simplifyTolerancePx: 0.1, ...input};
        if (input?.thresholdSizePx === undefined && (input?.enterSizePx !== undefined || input?.exitSizePx !== undefined)) {
            delete farPoint.thresholdSizePx;
        }
        if (input?.minSizePx === undefined && input?.pointSizePx !== undefined) farPoint.minSizePx = input.pointSizePx;
        delete farPoint.pointSizePx;
        return {...option, farPoint};
    }

    /**
     * 선택 하이라이트 타입을 설정하는 함수 <br>
     * - `UDEF.SELECT_TYPE.OUTLINE`||['outline'] : 외곽선 강조 <br>
     * - `UDEF.SELECT_TYPE.COLOR`||['color'] : 색상 강조 <br>
     * - `UDEF.SELECT_TYPE.RING`||['ring'] : 지정한 크기의 회전 링 <br>
     * 링으로 전환하거나 링에서 다른 타입으로 전환하면 기존 선택을 해제합니다.
     * 외곽선은 초기값과 지정한 farPoint 필드를 보완하여 저장합니다. farPoint가 null이면 간략 윤곽을 해제합니다.
     *
     * @param {string} val 선택 타입
     * @param {KeyValue | U3dSelectRingOption} [typeOption] 외곽선 옵션 또는 회전 링 옵션
     * @throws {TypeError} 외곽선의 farPoint가 옵션 객체 또는 null이 아닌 경우
     */
    setSelectType(val, typeOption){
        const option = this.#normalizeSelectTypeOption(val, typeOption);
        if (val !== this._selectType && (val === UDEF.SELECT_TYPE.RING || this._selectType === UDEF.SELECT_TYPE.RING)) {
            if (this._app) this.clearSelect();
            this._ringEffector?.dispose();
            this._ringEffector = undefined;
        }
        this._selectType = val;
        this._selectTypeOption = option;
        if (val === UDEF.SELECT_TYPE.RING) {
            for (const selected of this.getSelected()) this.setRing(selected);
        }
    }

    /**
     * 현재 선택 하이라이트 타입을 반환하는 함수
     *
     * @returns {string} 선택 타입
     */
    getSelectType(){
        return this._selectType
    }

    /**
     * 현재 선택 하이라이트 타입의 옵션을 반환하는 함수
     *
     * @returns {KeyValue} 현재 강조 옵션. outline은 기본값과 보완한 farPoint를 포함하며, 다른 방식의 옵션이 없으면 빈 객체입니다.
     */
    getSelectTypeOption(){
        return this._selectTypeOption || {}
    }

    /**
     * 점 선택과 hover에 사용할 원형 검색 반경을 변경합니다.
     * 마우스가 정지해 있어도 다음 렌더에서 새 반경으로 hover를 갱신합니다.
     *
     * @param {number} radius 원형 검색 반경(CSS 픽셀). 0이면 기존 레이 검색을 사용합니다.
     * @returns {this} 현재 선택기
     * @throws {RangeError} 반경이 유한한 0 이상의 숫자가 아닌 경우
     */
    setPickBufferPx(radius) {
        if (!Number.isFinite(radius) || radius < 0) {
            throw new RangeError('pickBufferPx는 유한한 0 이상의 숫자여야 합니다.');
        }
        if (this.#pickBufferPx === radius) return this;
        this.#pickBufferPx = radius;
        this.#renderBufferCircle();
        this._app?.updateData();
        return this;
    }

    /**
     * 현재 점 선택과 hover의 원형 검색 반경을 반환합니다.
     *
     * @returns {number} 원형 검색 반경(CSS 픽셀)
     */
    getPickBufferPx() {
        return this.#pickBufferPx;
    }

    /**
     * 점 선택의 검색 범위 원을 표시하거나 숨깁니다. 검색과 hover 설정은 유지합니다.
     *
     * @param {boolean} visible 범위 표시 여부
     * @returns {this} 현재 선택기
     * @throws {TypeError} 표시 여부가 불리언이 아닌 경우
     */
    setPickBufferVisible(visible) {
        if (typeof visible !== 'boolean') throw new TypeError('pickBufferVisible은 불리언이어야 합니다.');
        this.#pickBufferVisible = visible;
        if (!visible) { this.#bufferCircle?.remove(); this.#bufferCircle = undefined; }
        if (this.#hoverEnabled || visible) this.#startHover();
        else this.#stopHover();
        this.#renderBufferCircle();
        this._app?.updateData();
        return this;
    }

    /**
     * 검색 범위 원의 표시 설정을 반환합니다. 비활성화·다른 모드에서는 설정과 관계없이 숨깁니다.
     * @returns {boolean} 범위 표시 설정
     */
    getPickBufferVisible() {
        return this.#pickBufferVisible;
    }

    /**
     * 실행 중 hover 검색·자동 강조·색상을 변경합니다. 생략한 항목과 클릭 선택은 유지합니다.
     *
     * @param {U3dSelectHoverOption} [options={}] 변경할 hover 설정
     * @returns {this} 현재 선택기
     * @throws {TypeError} 설정이 객체가 아니거나 enabled·autoHighlight가 불리언이 아닌 경우
     */
    setHover(options = {}) {
        if (!options || typeof options !== 'object' || Array.isArray(options)
            || (options.enabled !== undefined && typeof options.enabled !== 'boolean')
            || (options.autoHighlight !== undefined && typeof options.autoHighlight !== 'boolean')) {
            throw new TypeError('hover 설정은 객체이고 enabled·autoHighlight는 불리언이어야 합니다.');
        }
        const color = options.color === undefined ? this.#hoverColor : new THREE.Color(options.color);
        const colorChanged = !this.#hoverColor.equals(color);
        const autoHighlightChanged = options.autoHighlight !== undefined && options.autoHighlight !== this.#hoverAutoHighlight;
        this.#hoverAutoHighlight = options.autoHighlight ?? this.#hoverAutoHighlight;
        this.#hoverEnabled = options.enabled ?? this.#hoverEnabled;
        this.#hoverColor.copy(color);
        try {
            if (!this.#hoverEnabled || autoHighlightChanged) this.clearHover();
            else if (colorChanged && this.#hoverAutoHighlight && this.#hoverTarget) this.#setHover(this.#hoverTarget);
        } finally {
            if (this.#hoverEnabled || this.#pickBufferVisible) this.#startHover();
            else this.#stopHover();
            this._app?.updateData();
        }
        return this;
    }

    /**
     * 원본 설정을 변경할 수 없는 값 복사본으로 현재 hover 설정을 반환합니다.
     * @returns {{enabled: boolean, autoHighlight: boolean, color: number}} 검색·자동 강조 설정과 색상 숫자
     */
    getHover() {
        return {enabled: this.#hoverEnabled, autoHighlight: this.#hoverAutoHighlight, color: this.#hoverColor.getHex()};
    }

    #addEventListener() {
        const type = this.mode;
        if (type === UDEF.SELECT_MODE.POINT) {
            const singleClickID = this._app.on('click', this.#singleClick.bind(this));
            if(defined(singleClickID)) this._clickId = singleClickID;
            this.#startHover();
        } else if (type === UDEF.SELECT_MODE.AREA || type === UDEF.SELECT_MODE.LINE || type === UDEF.SELECT_MODE.CIRCLE) {
            const polygonClickID = this._app.on('click', this.#polygonClick.bind(this));
            if(defined(polygonClickID)) this._clickId = polygonClickID;

            const polygonDblclickID = this._app.on('dblclick', this.#polygonDblclick.bind(this));
            if(defined(polygonDblclickID)) this._dblClickId = polygonDblclickID;
        } else if (type === UDEF.SELECT_MODE.BOX){
            __GInfo__(this, '박스 선택 모드시에는 지도조작의 제어가 제한 됩니다.','4735344')
            this.#setSelectBoxMode();
        }
    }

    #removeEventListener() {
        if (defined(this._clickId)) {
            this._app.unkey('click', this._clickId);
            this._clickId = undefined;
        }
        if (defined(this._dblClickId)) {
            this._app.unkey('dblclick', this._dblClickId);
            this._dblClickId = undefined;
        }
        if(defined(this.getSelectBox())){ //select box event dispose
            this.#removeSelectBoxEventListener();
        }
        this.#stopHover();
    }
    /// <summary>박스 입력 구독과 자체 도구를 해제하고 살아 있는 앱의 카메라 제어만 복원합니다.</summary>
    #removeSelectBoxEventListener(){
        const self = this;
        const selectBoxEvent = self.selectBoxEvent;
        const pointerDownId = selectBoxEvent.pointerDownId;
        const pointerMoveId = selectBoxEvent.pointerMoveId;
        const pointerUpId = selectBoxEvent.pointerUpId;

        if(self._app){
            self._app.off(U3dAppEventHandler.EVENT.MOUSEDOWN, pointerDownId);
            self._app.off(U3dAppEventHandler.EVENT.MOUSEMOVE, pointerMoveId);
            self._app.off(U3dAppEventHandler.EVENT.MOUSEUP, pointerUpId);
        }

        const selectBox = self.getSelectBox();
        selectBox?.dispose();

        self.selectBoxEvent.selectBox = undefined;
        self.selectBoxEvent.pointerDownId = undefined;
        self.selectBoxEvent.pointerMoveId = undefined;
        self.selectBoxEvent.pointerUpId = undefined;

        if (isSelectAppAvailable(self)) self._app.disableCameraMove(false); // 살아 있는 맵 컨트롤만 재활성화
    }

    /**
     * @param {OLGeometry} geom
     * @param {THREE.Box3} box3
     * @returns {boolean}
     */
    #intersectsGeomBox(geom, box3){
        if(!box3 || !box3.min || !box3.max) return false;
        const lb = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg).getWorldToGoogle(box3.min.x, box3.min.y);
        const rt = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg).getWorldToGoogle(box3.max.x, box3.max.y);

        if (geom.intersectsExtent([lb.x, lb.y, rt.x, rt.y]))
            return true;

        return false;
    }
    /**
     * @param {any} intersect
     * @returns {boolean}
     */
    #checkSharedObject(intersect){
        //return false 이면 다음 계속진행, return true 이면 멈추고 진행안함
        const object = intersect.object;
        if(object instanceof USharedMesh){
            return true;
        }
        return false;
    }

    /**
     * @param {any} intersect
     * @returns {boolean}
     */
    #checkTilesObject(intersect){
        //return false 이면 다음 계속진행, return true 이면 멈추고 진행안함
        const object = intersect.object;
        if(defined(object.isBIM) && !object.isBIM())
            return true;
        return false;
    }

    /**
     * @param {any} intersect
     * @param {Array<any>} result
     * @param {any} event
     * @returns {boolean}
     */
    #checkMergeGroupsObject(intersect,result,event){
        //return false 이면 다음 계속진행, return true 이면 멈추고 진행안함
        const self = this;
        const object = intersect.object;
        if (!object.isMerged || !object.isMerged()) return false;
        if (!object.getLayerName) return false;
        const layer = self._app.getLayerByName(object.getLayerName());
        if (!layer) return false;

        if (!Array.isArray(object.material) || object.geometry.groups.length === 0) return false;
        const modelLayer = /**@type{import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer}*/(layer);
        if(!modelLayer.mergedMeshDivision) return false;
        if(object.children.length > 0) return false;


        /** @param {any} target */
        const afterFunction = function(target){
            if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE || self.getSelectType() === UDEF.SELECT_TYPE.RING){
                const id_ = target.getUid();
                const editInfo = modelLayer.getEditedEventById(id_)
                if(editInfo && editInfo.color){
                    if (self.getSelectType() === UDEF.SELECT_TYPE.RING) self.setRing(target);
                    else self.setOutline(target);
                    self.#setSelected([{object:target}], false, false);
                }
            }
        }

        if(defined(intersect.faceIndex)){
            const result_ = modelLayer.mergedMeshDivision(object, intersect.faceIndex);
            if(!result_)
                return true;
            const value = modelLayer.getMaterialIndexByFace(object, intersect.faceIndex);
            if(!value || !defined(value.materialIndex)) return true;
            if (defined(value) && !object._pickMaterials.includes(value.materialIndex))
                object._pickMaterials.push(value.materialIndex);
            result.push(intersect);
            return true;
        }else if(event.intersectsExtent){
            const groupList =/**@type{import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer}*/ (modelLayer).getBoundingBoxInfo(object);
            if (!groupList) return true
            /** @type {Record<string, any>} */
            const removeList = {};
            for(let group of groupList){
                const info = /**@type{any}*/(group.info);
                if(!info || !defined(info.min) || !defined(info.max) || !defined(info.start) || !defined(info.count)) continue;

                const bbox = TEMP_BOX.set(info.min, info.max);
                const faceIndex = Math.floor(info.start + (info.count / 2))
                const faceIndex_ = Math.floor(faceIndex / 3);

                if(self.#intersectsGeomBox(event, bbox)){
                    if(removeList[faceIndex_])
                        delete removeList[faceIndex_];
                    let color = self._selectColor;
                    let opacity = self._selectOpacity;
                    if(!self._auto){
                        color = object.getColor();
                        opacity = object.getOpacity();
                    }
                    const isSetColor = self.getSelectType() === UDEF.SELECT_TYPE.COLOR;
                    /**@type{import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer}*/(modelLayer).setPickMaterialByComposedInfo(object, info, color, opacity, isSetColor);

                    const key=  makeObjectKey(object);
                    if(self._selected[key] && self._auto){ //하나의 key로 들어가게 되면서 선택도 하나만 됨으로 이후에 선택 된 객체들 갱신
                        if (self.getSelectType() === UDEF.SELECT_TYPE.RING) {
                            self.setRing(object);
                        } else if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE){
                            self.setOutline(object);
                        }
                    }else{
                        addSelected_.call(self, object, {faceIndex: faceIndex_}, self._auto );
                    }


                    const u3flayer = /**@type{import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer}*/(layer);
                    const groupInfo = u3flayer.getMaterialIndexByFace(object, faceIndex_);
                    if (groupInfo) {

                        const id = groupInfo.childId;
                        const editInfo = u3flayer.getEditedEventById(id)
                        if (!u3flayer.editFilter(id)) {
                            u3flayer.editedList.push(id);
                            u3flayer.editedEvent[id] = /**@type{any}*/ ({
                                isSetColor: isSetColor,
                                color: color,
                                opacity: opacity,
                            });
                        }
                        if (editInfo) {
                            editInfo.isSetColor = isSetColor;
                            editInfo.color = color;
                            editInfo.opacity = opacity;
                        }

                        if(!isSetColor){ // 17 레벨 스왑시 해당 function 실행하여 선택 객체 추가
                            u3flayer.editedEvent[id].afterFunction = afterFunction
                        }
                    }
                }else{
                    removeList[faceIndex_] = group;
                }
            }
            const removeKeys = Object.keys(removeList)
            if( removeKeys.length > 0){
                for (let i = 0; i < removeKeys.length; i++) {
                    const faceIndex = Number(removeKeys[i]);
                    const group = removeList[faceIndex]

                    delete group.info.color
                    delete group.info.opacity
                    const u3fLayer = /**@type{import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer}*/(layer);
                    const groupInfo = u3fLayer.getMaterialIndexByFace(object, faceIndex);
                    if (groupInfo) {
                        const materialIndex = groupInfo.materialIndex;
                        u3fLayer.removeMaterialIndex(object, materialIndex);
                    }
                }
            }
            return true;
        }

        return true;
    }

    /**
     * @param {any} intersect
     * @param {Array<any>} result
     * @param {any} event
     * @returns {boolean}
     */
    #checkMergeObject(intersect, result, event){
        //return false 이면 다음 계속진행, return true 이면 멈추고 진행안함
        if(!event) return false;
        const self = this;
        const object = intersect.object;
        if (!object.isMerged || !object.isMerged()) return false;
        if (!object.getLayerName) return false;
        const layer = self._app.getLayerByName(object.getLayerName());
        if (!layer) return false;
        const modelLayer = /**@type{import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer}*/(layer);
        if(!modelLayer.mergedMeshDivision) return false;

        /**
         * @param {any} target
         * @param {any} drawArg
         * @param {any} id
         */
        const afterFunction = function(target, drawArg, id){ //load texture 비동기 작업으로 인한 분리된 객체 확인
            const geom = event;
            if(!target.getBBox) return;
            const bbox = target.getBBox();
            if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE || self.getSelectType() === UDEF.SELECT_TYPE.RING){

                const id_ = id? id: target.getUid();
                const editInfo = modelLayer.getEditedEventById(id_)

                if(editInfo?.color){
                    if (self.getSelectType() === UDEF.SELECT_TYPE.RING) self.setRing(target);
                    else self.setOutline(target);
                    self.#setSelected([{object:target}], false, false);
                }
            }else{
                if(!bbox.min || !bbox.max) return;
                const lb = drawArg.getWorldToGoogle(bbox.min.x, bbox.min.y);
                const rt = drawArg.getWorldToGoogle(bbox.max.x, bbox.max.y);

                if (geom.intersectsExtent && geom.intersectsExtent([lb.x, lb.y, rt.x, rt.y])){
                    self.#setSelected([{object:target}], false, false);
                }
            }

        }

        const resultMesh = /**@type{import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer}*/(layer).mergedMeshDivision(object, undefined, afterFunction);
        if (!defined(resultMesh))
            return false;

        let resultList = [];

        const app =/** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app)
        const camera = app._camera;
        if(!camera) return false;
        if(defined(event.normalizedX) && defined(event.normalizedY)){ // 단일 클릭에는 검색 지점의 NDC 좌표를 전달합니다.
            invisibleRay.setFromCamera(new THREE.Vector2(event.normalizedX, event.normalizedY), camera);
            resultList = invisibleRay.intersectObjects(resultMesh, false);
        }else if(event.x && event.y){ //사용자 입력 지점이 들어올때
            let scenes = null;
            if(self.#targetLayer && self.#targetLayer.length > 0){
                scenes = [];
                for(let layerName of self.#targetLayer){
                    const layer = self._app.getLayerByName(layerName);
                    if(layer){
                        scenes.push(layer.getScene());
                    }
                }
            }
            resultList = /** @type {Array<import('three').Intersection>} */(self._app.intersectModelAtGeographicPoint(event, 3, false, scenes));
        }else if(event.intersectsExtent){ //영역 검색으로 geom 이 들어올때
            for (let splitMesh of resultMesh) {
                const bbox = /**@type{@import('@UMesh').UMesh}*/splitMesh.getBBox();
                if(self.#intersectsGeomBox(event, bbox)){
                    resultList.push({object:splitMesh});
                }
            }
        }

        if (!resultList || resultList.length === 0)
            return true;

        resultList.forEach(/** @param {any} child */ child => {
            const obj = child.object;
            if (obj.isMerged && !(obj.isMerged())) {
                result.push(child);
            }
        });
        return true;
    }

    /**
     * @param {any} intersect
     * @param {Array<any>} result
     * @returns {boolean}
     */
    #checkHelperObject(intersect,result){
        const object = intersect.object;
        if(!object._isHelper || object.isBarrierMesh){
            return false;
        }
        const target = object.getOriginTarget?.();
        if(defined(target))   {
            intersect.object = target;
            result.push(intersect);
        }
        return true;
    }

    /**
     * @param {any} intersect
     * @param {Array<any>} result
     * @returns {boolean}
     */
    #checkRootObject(intersect,result) {
        //return false 이면 다음 계속진행, return true 이면 멈추고 진행안함
        const object = intersect.object;
        if (defined(object?._rootObject)) {
            intersect.object = object._rootObject;
            result.push(intersect);
            return true;
        }

        return false;
    }


    /**
     * @param {any} intersect
     * @param {Array<any>} result
     * @returns {boolean}
     */
    #checkComponent(intersect,result) {
        //return false 이면 다음 계속진행, return true 이면 멈추고 진행안함
        const object = intersect.object;
        if (!object || !isValidComponentModelType(object)) {
            return false;
        }

        if (!defined(object.geometry.boundingBox))
            object.geometry.computeBoundingBox();

        const layer = this._app.getLayerByName(searchLayerName(object));
        if (layer?._classtype === "U3dMultipleComponentLayer") {
            const componentLayer = /**@type{import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer}*/(layer)
            const picked = componentLayer.getComponentByIntersect?.(intersect);
            if (defined(picked)) {
                if (object.userData?.type === 'trailMesh') intersect.renderObject = object;
                intersect.object = picked;
            }
            //중복체크
            const searchLog = this.#searchLog.get(intersect.object);
            if(searchLog
                && searchLog.instanceId === intersect.instanceId
                &&searchLog.geom === intersect.geom){
                return true;
            }

            result.push(intersect);
            this.#searchLog.set(intersect.object , intersect);
        }else {
            if (typeof intersect.screenDistance === 'number') return false;
        }

        return true;
    }

    /**
     * 싱글 클릭용(포인트 타입)=> 인터섹트 되서 들어온 대상들을 검사한다.
     *
     * @param {Array<any>} intersects
     * @param {any} event
     * @returns {Array<any>}
     */
    #checkIntersects(intersects,event){
        const self = this;

        self.#searchLog.clear();

        const tempIntersects = [];
        for(let intersect of intersects){
            const object = intersect.object;
            if (object._disposed || object._sleeping) continue;
            if (object instanceof THREE.Mesh || object instanceof U3dGeometry
                || (typeof intersect.screenDistance === 'number' && (object.isLine || object.isPoints))) {
                if(self.#checkSharedObject(intersect)) continue;
                if(self.#checkMergeGroupsObject(intersect,tempIntersects,event)) continue;
                if(self.#checkMergeObject(intersect,tempIntersects,event)) continue;
                // if(self.#checkRootObject(intersect,tempIntersects)) continue;
                if(self.#checkComponent(intersect,tempIntersects)) continue;
                // if(self.#checkInstanceObject(intersect,tempIntersects)) continue;
                if(self.#checkHelperObject(intersect,tempIntersects)) continue;

                tempIntersects.push(intersect);
            }
        }

        return  tempIntersects.sort(function (a, b) { return a.distance - b.distance;});
    }


    /**
     * 지오메트리(드로잉/측정 결과)와 교차하는 객체 목록을 반환하는 함수 <br>
     * 주로 `AREA/LINE/CIRCLE/BOX` 선택 모드에서 선택 결과를 계산할 때 사용합니다.
     *
     * @param {import('three').Object3D| import('three').Group| import('three').Scene|  import('@UMesh').UMesh} scene 검사할 scene(또는 group)
     * @param {OLGeometry} geom `intersectsExtent(extent)`를 제공하는 geometry
     * @returns {Array<{object: any, geom: OLGeometry} & Partial<{instanceId: number}>>} 교차한 객체 목록 <br>
     * 인스턴스 메시는 인스턴스별로 `instanceId`가 붙습니다. <br>
     * 3D Tiles 메시는 검사에서 제외되며 안내 메시지만 남깁니다.
     */
    checkGeom(scene, geom){
        const self = this;

        if(!scene) return [];

        let isTiles = false;
        /** @type {Array<any>} */
        const intersects = [];
        scene.traverse(function (/** @type {any} */ mesh) {
            if(!mesh.visible) return;

            if( mesh instanceof THREE.Scene
                || mesh instanceof THREE.Group
            ) return;

            if( self.#checkTilesObject({object:mesh})){
                isTiles = true;
                return;
            }

            if(isValidComponentModelType(mesh)){
                if (mesh.geometry && !defined(mesh.geometry.boundingBox))
                    mesh.geometry.computeBoundingBox();
                if(mesh.isInstancedMesh){
                    for (let i = 0; i <  mesh.capacity; i++) {
                        if(!mesh.getVisibilityAt(i)) continue;
                        const pos = mesh.getPositionAt(i);
                        TEMP_BOX.copy(mesh.geometry.boundingBox);
                        TEMP_BOX.min.add(pos);
                        TEMP_BOX.max.add(pos);

                        if(self.#intersectsGeomBox(geom, TEMP_BOX)){
                            intersects.push({object:mesh,instanceId:i, geom:geom});
                        }
                    }
                }else{
                    const bbox = mesh.getBBox? mesh.getBBox() : new THREE.Box3().setFromObject(mesh);
                    if(self.#intersectsGeomBox(geom, bbox)){
                        intersects.push({object:mesh, geom:geom});
                    }
                }

            }else{
                const bbox = mesh.getBBox? mesh.getBBox() : new THREE.Box3().setFromObject(mesh);

                if(self.#intersectsGeomBox(geom, bbox)){
                    intersects.push({object:mesh, geom:geom});
                }
            }
        });

        if (isTiles) {
            U3dMessage.info('U3dSelect', '3DTiles models do not support multiple selection.');
        }

        return self.#checkIntersects(intersects,geom);
    }

    /**
     * 선택 상태를 바꾸지 않고 마우스 주변 원형 범위의 실제 화면 거리를 검색합니다.
     *
     * @param {SelectPointerEvent} e 마우스 NDC 위치
     * @param {boolean} [hover=false] hover의 가까운 유효 대상 하나만 검색할지 여부
     * @returns {Array<import('three').Intersection & {screenDistance?: number}>} 화면 거리순 원본 교차 결과
     */
    #searchAtScreen(e, hover = false) {
        const app = this._app;
        const camera = app.getCamera();
        if (!camera) return [];
        const canvas = app.getRenderer().domElement;
        /** @type {Array<import('@union3d/3dLayer/U3dLayer').U3dLayer>} */
        const layers = this.#targetLayer?.length
            ? this.#targetLayer.map(name => app.getLayerByName(name)).filter(layer => !!layer)
            : app._drawArg.getInstanceModelLayers();
        const scenes = this.#targetLayer?.length
            ? layers.map(layer => layer.getScene()).filter(scene => !!scene)
            : app.getInstanceScenesFromModelLayers();
        if (this.#pickBufferPx === 0) {
            return this.#targetLayer?.length
                ? app.intersectFromScene(e, scenes, undefined, this._rayOption)
                : app.intersectAtPixel(e, undefined, undefined, undefined, this._rayOption);
        }
        return pickScreenCircle(scenes, camera, e, this.#pickBufferPx,
            {width: canvas.clientWidth, height: canvas.clientHeight}, object => {
                if (object.userData.type !== 'trailMesh') return undefined;
                if (object.getDrawSegments) return object.getDrawSegments();
                for (const layer of layers) {
                    if (layer._classtype !== 'U3dMultipleComponentLayer') continue;
                    const component = /** @type {import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer} */(layer)
                        .getComponentByName(object.userData.componentName);
                    const tail = component?.cumulativePath?.getTail();
                    if (tail?.getMesh() === object) return tail.getDrawSegments();
                }
                return undefined;
            }, hover ? {...this._rayOption, nearestOnly: true,
                acceptObject: object => this.#isHoverCandidate(object),
                acceptHit: hit => !!this.#resolveHoverTarget(hit)} : this._rayOption);
    }

    /**
     * 원형 검색 후보를 클릭 선택에 필요한 병합·컴포넌트 정보로 변환합니다.
     * @param {SelectPointerEvent} e 마우스 NDC 위치
     * @returns {Array<any>} 화면 거리순 클릭 선택 결과
     */
    #pickAtScreen(e) {
        const hits = this.#searchAtScreen(e);
        const camera = this._app.getCamera();
        if (!camera) return [];
        const result = [];
        const selectedObjects = new Set();
        for (const hit of hits) {
            const point = hit.point.clone().project(camera);
            const normalized = this.#checkIntersects([hit], {...e, normalizedX: point.x, normalizedY: point.y});
            for (const intersect of normalized) {
                if (selectedObjects.has(intersect.object)) continue;
                selectedObjects.add(intersect.object);
                result.push({...intersect, point: intersect.point ?? hit.point,
                    distance: intersect.distance ?? hit.distance, screenDistance: hit.screenDistance});
            }
            if (this._auto && result.length) break;
        }
        return result;
    }

    /**
     * POINT 모드에서 범위 표시와 hover에 필요한 입력을 모아 렌더 직전에 갱신합니다.
     * 정지한 마우스 아래에서 객체나 카메라가 이동해도 다음 렌더에서 재검색합니다.
     */
    #startHover() {
        if ((!this.#hoverEnabled && !this.#pickBufferVisible) || !this._isActive
            || this.#hoverStopping || this.mode !== UDEF.SELECT_MODE.POINT || this.#hoverListeners.length || !this._app) return;
        const app = this._app;
        const handlers = {
            mousemove: (/** @type {SelectPointerEvent} */ e) => {
                if (this.#hoverDragging || e.origin?.buttons) { this.#hoverPointer = undefined; this.#renderBufferCircle(); this.clearHover(); return; }
                this.#hoverPointer = {normalizedX: e.normalizedX, normalizedY: e.normalizedY};
                this.#renderBufferCircle();
                app.updateData();
            },
            mousedown: () => { this.#hoverDragging = true; this.#hoverPointer = undefined; this.#renderBufferCircle(); this.clearHover(); },
            mouseup: (/** @type {SelectPointerEvent} */ e) => {
                this.#hoverDragging = false;
                this.#hoverPointer = {normalizedX: e.normalizedX, normalizedY: e.normalizedY};
                this.#renderBufferCircle();
                app.updateData();
            },
            mouseout: () => { this.#hoverDragging = false; this.#hoverPointer = undefined; this.#renderBufferCircle(); this.clearHover(); }
        };
        for (const [type, handler] of Object.entries(handlers)) {
            const key = this.uuid + '_hover_' + type;
            app.on(type, handler, false, key);
            this.#hoverListeners.push({type, key});
        }
        app.setRenderBefore(this.uuid + '_hover', () => this.#updateHover());
        this.#bufferWindow = app.getRenderer().domElement.ownerDocument?.defaultView;
        this.#bufferWindow?.addEventListener('resize', this.#bufferResize);
    }

    /** 범위 표시와 hover의 입력·렌더·창 구독을 해제하고 DOM과 임시 강조를 정리합니다. */
    #stopHover() {
        const wasStopping = this.#hoverStopping;
        this.#hoverStopping = true;
        try {
            const listeners = this.#hoverListeners;
            this.#hoverListeners = [];
            this.#hoverPointer = undefined;
            this.#hoverDragging = false;
            this.#bufferWindow?.removeEventListener('resize', this.#bufferResize);
            this.#bufferWindow = undefined;
            this.#bufferCircle?.remove();
            this.#bufferCircle = undefined;
            if (listeners.length && this._app) {
                for (const listener of listeners) this._app.off(listener.type, listener.key);
                this._app.removeRenderBefore(this.uuid + '_hover');
            }
            this.clearHover();
        } finally {
            this.#hoverStopping = wasStopping;
        }
    }

    /** 선택기 내부에서 실제 검색 반경과 NDC 위치에 맞춰 범위 원을 표시합니다. */
    #renderBufferCircle() {
        const pointer = this.#hoverPointer;
        const canvas = this._app?.getRenderer().domElement;
        if (!this.#pickBufferVisible || !this._isActive || this.mode !== UDEF.SELECT_MODE.POINT
            || !pointer || this.#hoverDragging || this.#pickBufferPx === 0 || !canvas?.clientWidth || !canvas.clientHeight
            || typeof pointer.normalizedX !== 'number' || typeof pointer.normalizedY !== 'number'
            || !Number.isFinite(pointer.normalizedX) || !Number.isFinite(pointer.normalizedY)) {
            if (this.#bufferCircle) this.#bufferCircle.hidden = true;
            return;
        }
        if (!this.#bufferCircle) {
            const document = canvas.ownerDocument;
            if (!document?.body) return;
            const circle = document.createElement('div');
            circle.className = 'u3d-select-pick-buffer';
            circle.dataset.selectUuid = this.uuid;
            circle.setAttribute('aria-hidden', 'true');
            Object.assign(circle.style, {position: 'fixed', zIndex: '4', boxSizing: 'border-box',
                border: '1px solid #ffff00', borderRadius: '50%', background: 'rgb(255 255 0 / 0.08)',
                transform: 'translate(-50%, -50%)', pointerEvents: 'none'});
            document.body.appendChild(circle);
            this.#bufferCircle = circle;
        }
        const rect = canvas.getBoundingClientRect(), circle = this.#bufferCircle;
        circle.hidden = rect.width === 0 || rect.height === 0;
        circle.style.left = rect.left + (pointer.normalizedX + 1) * rect.width / 2 + 'px';
        circle.style.top = rect.top + (1 - pointer.normalizedY) * rect.height / 2 + 'px';
        circle.style.width = this.#pickBufferPx * 2 * rect.width / canvas.clientWidth + 'px';
        circle.style.height = this.#pickBufferPx * 2 * rect.height / canvas.clientHeight + 'px';
    }

    /**
     * 정밀 검색 전에 hover에서 제외할 원본 메시를 판정합니다.
     * @param {import('three').Object3D} object 원본 객체
     * @returns {boolean} 논리 대상 조회가 가능한 후보 여부
     */
    #isHoverCandidate(object) {
        const mesh = /** @type {import('three').Object3D & Partial<{_disposed: boolean, _sleeping: boolean, isBarrierMesh: boolean}>} */(object);
        return !(mesh._disposed || mesh._sleeping || mesh instanceof USharedMesh || mesh instanceof UTileMesh || mesh.isBarrierMesh);
    }

    /**
     * 조회 단계에서 병합 모델을 분할하거나 클릭 선택 목록을 바꾸지 않습니다.
     * @param {import('three').Intersection & {screenDistance?: number}} intersect 원본 검색 결과
     * @returns {U3dSelectHoverTarget | null} 논리 hover 대상. 검색 제외 객체이거나 병합 건물 범위를 확정하지 못하면 null
     */
    #resolveHoverTarget(intersect) {
        const mesh = /** @type {import('three').Mesh & Partial<{_disposed: boolean, _sleeping: boolean, _ulayername: string, _isHelper: boolean, isBarrierMesh: boolean, isMerged: () => boolean}>} */(intersect.object);
        if (!this.#isHoverCandidate(mesh)) return null;
        let target = /** @type {USelect} */(mesh);
        if (mesh._isHelper && 'getOriginTarget' in mesh && typeof mesh.getOriginTarget === 'function') target = mesh.getOriginTarget();
        if (!target) return null;
        const layer = this._app.getLayerByName(mesh._ulayername ?? searchLayerName(mesh));
        if (layer?._classtype === 'U3dMultipleComponentLayer') {
            const componentLayer = /** @type {import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer} */(layer);
            target = componentLayer.getComponentByIntersect(intersect) ?? target;
        }
        let part;
        if (mesh.isMerged?.()) {
            const faceIndex = intersect.faceIndex;
            if (typeof faceIndex !== 'number' || !Number.isSafeInteger(faceIndex) || faceIndex < 0) return null;
            const position = faceIndex * 3;
            const geometry = mesh.geometry;
            const group = /** @type {(import('three').GeometryGroup & {gid?: string}) | undefined} */
                (geometry.groups.find(item => position >= item.start && position < item.start + item.count));
            /** @type {{start: number, count: number} | undefined} */
            let info;
            // 아직 분할되지 않은 재질 인덱스 0의 건물도 원본 합성 범위로 식별합니다.
            if (layer instanceof U3dModelU3FLayer && group && typeof group.gid === 'string') {
                const ranges = /** @type {Array<{start: number, count: number}> | undefined} */(layer._composedCache?.[group.gid]);
                info = ranges?.find(item => position >= item.start && position < item.start + item.count);
            }
            if (!info && layer && 'getBoundingBoxInfo' in layer && typeof layer.getBoundingBoxInfo === 'function') {
                const groups = /** @type {Array<{info?: {start: number, count: number}}> | undefined} */(layer.getBoundingBoxInfo(mesh));
                info = groups?.find(item => item.info && position >= item.info.start && position < item.info.start + item.info.count)?.info;
            }
            const indexCount = geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0;
            // 재질 그룹은 여러 건물을 포함할 수 있어 개별 범위가 없으면 전체 강조로 대체하지 않습니다.
            if (!info || !Number.isSafeInteger(info.start) || !Number.isSafeInteger(info.count)
                || info.start < 0 || info.count <= 0 || info.start % 3 !== 0 || info.count % 3 !== 0
                || info.start + info.count > indexCount) return null;
            part = {start: info.start, count: info.count};
        }
        const identity = target instanceof U3dComponentPosition ? target.name : 'uuid' in target ? target.uuid : makeObjectKey(target);
        const key = identity + '^' + (target === mesh ? intersect.instanceId ?? '' : '') + '^' + (part?.start ?? '');
        return {object: target, intersect, key, part};
    }

    /** 범위 표시를 갱신하고 hover가 켜져 있을 때만 대상 검색과 강조를 수행합니다. */
    #updateHover() {
        this.#renderBufferCircle();
        if (!this.#hoverEnabled) return;
        if (!this._isActive || this.mode !== UDEF.SELECT_MODE.POINT || !this.#hoverPointer || this.#hoverDragging) return;
        let next = null;
        for (const hit of this.#searchAtScreen(this.#hoverPointer, true)) {
            next = this.#resolveHoverTarget(hit);
            if (next) break;
        }
        if (next?.key === this.#hoverTarget?.key && next?.object === this.#hoverTarget?.object
            && next?.intersect.object === this.#hoverTarget?.intersect.object) return;
        this.#setHover(next);
    }

    /**
     * 이전 표시와 구독을 정리하고 새 대상의 변경 이벤트를 전달합니다.
     * @param {U3dSelectHoverTarget | null} next 다음 대상. null이면 이탈
     */
    /// <summary>이전 hover 구독과 재질을 복원한 뒤 살아 있는 앱에서만 새 강조와 변경 이벤트를 적용합니다.</summary>
    /// <param name="next">호출자가 소유한 U3dSelectHoverTarget 또는 null이며 null은 해제를 뜻합니다. 입력의 소유권은 이전하지 않습니다.</param>
    #setHover(next) {
        const previous = this.#hoverTarget;
        const restore = this.#hoverRestore, cleanup = this.#hoverCleanup;
        this.#hoverTarget = next;
        this.#hoverRestore = undefined;
        this.#hoverCleanup = undefined;
        cleanup?.();
        restore?.();
        if (this.#hoverTarget !== next) return;
        if (!isSelectAppAvailable(this)) { this.#hoverTarget = null; return; }
        if (next) {
            const object = next.intersect.object;
            const geometry = 'geometry' in object && object.geometry instanceof THREE.BufferGeometry ? object.geometry : undefined;
            /// <summary>현재 hover 대상의 장면 해제나 지오메트리 해제에서 임시 강조를 정리합니다.</summary>
            const removed = () => { if (this.#hoverTarget === next) this.clearHover(); };
            object.addEventListener('removed', removed);
            geometry?.addEventListener('dispose', removed);
            /// <summary>선택기가 등록한 대상·지오메트리 수신 함수만 제거합니다.</summary>
            this.#hoverCleanup = () => {
                object.removeEventListener('removed', removed);
                geometry?.removeEventListener('dispose', removed);
            };
            if (this.#hoverAutoHighlight) this.#applyHoverColor(next, this.#hoverColor);
        }
        if (!previous && !next) return;
        this._app?.updateData();
        if (previous?.key === next?.key && previous?.object === next?.object
            && previous?.intersect.object === next?.intersect.object) return;
        /** @type {U3dSelectHoverEvent} */
        const event = {type: U3dSelect.EVENT.HOVER_CHANGE, previous: previous?.object ?? null,
            current: next?.object ?? null, intersection: next?.intersect ?? null,
            /// <summary>현재 hover 대상이 유지되는 동안 지정 색상을 적용합니다.</summary>
            /// <param name="color">THREE.ColorRepresentation 입력이며 기본값은 선택기의 hover 색상입니다. 호출자 입력을 변경하지 않습니다.</param>
            applyColor: (color = this.#hoverColor) => { if (next) this.#applyHoverColor(next, color); }};
        this.dispatchEvent(event);
    }

    /**
     * 이벤트가 가리키는 현재 대상에만 색상을 적용하고 다음 전환에서 사용할 복원 함수를 보관합니다.
     * @param {U3dSelectHoverTarget} hit 표시할 hover 대상
     * @param {import('three').ColorRepresentation} color 강조 색상
     */
    #applyHoverColor(hit, color) {
        // 지난 이벤트를 다시 사용하거나 클릭 선택한 대상에는 hover 색상을 덮어쓰지 않습니다.
        if (this.#hoverTarget !== hit || Object.values(this._selected).some(selected => {
            if (!this.#containsHoverTarget(selected, hit)) return false;
            const intersect = '_intersect' in selected && typeof selected._intersect === 'object' ? selected._intersect : undefined;
            if ('isInstancedMesh' in selected && selected.isInstancedMesh && intersect
                && 'instanceId' in intersect && typeof intersect.instanceId === 'number') {
                return intersect.instanceId === hit.intersect.instanceId;
            }
            return true;
        })) return;
        const tint = new THREE.Color(color);
        const restore = this.#hoverRestore;
        this.#hoverRestore = undefined;
        restore?.();
        if (this.#hoverTarget !== hit) return;
        const release = applyHoverColor(hit, tint, () => { if (this.#hoverTarget === hit) this.clearHover(); });
        if (this.#hoverTarget === hit) this.#hoverRestore = release;
        else release();
        this._app?.updateData();
    }

    /**
     * 논리 대상이나 그 상위 그룹이 현재 hover 범위를 포함하는지 검사합니다.
     * 인스턴스 컴포넌트는 공유 렌더 그룹 전체를 소유하지 않으므로 논리 대상만 비교합니다.
     * @param {USelect} object 선택 대상
     * @param {U3dSelectHoverTarget} hit hover 대상
     * @returns {boolean} 같은 대상 또는 상위 그룹이면 true
     */
    #containsHoverTarget(object, hit) {
        if (object === hit.object) return true;
        if (object instanceof U3dComponentPosition && object.getInstanced()) return false;
        const root = 'getObject' in object && typeof object.getObject === 'function' ? object.getObject() : object;
        /** @type {import('three').Object3D | null} */
        let child = hit.intersect.object;
        for (; child; child = child.parent) {
            if (child === root) return true;
        }
        return false;
    }

    /**
     * 클릭 선택을 유지하며 hover 표시만 해제합니다.
     * 마우스 위치는 유지되어 다음 입력이나 렌더에서 다시 검색할 수 있습니다.
     * @param {USelect | Array<USelect>} [object] 지정하면 해당 대상이나 상위 그룹의 hover만 해제합니다. 생략하면 모두 해제합니다.
     */
    clearHover(object) {
        const hit = this.#hoverTarget;
        if (object && hit) {
            const objects = Array.isArray(object) ? object : [object];
            if (!objects.some(target => this.#containsHoverTarget(target, hit))) return;
        }
        this.#setHover(null);
    }

    /**
     * 마우스 지점의 객체를 선택하고 선택 작업과 이벤트를 갱신합니다.
     * @param {SelectPointerEvent} e
     * @returns {boolean|void}
     */
    #singleClick(e) {
        const self = this;
        const app = this._app;
        if (!app) return;
        this.clearHover();

        if (self._measureFeature !== undefined) {
            self.clear();
        }
        if (!e.origin?.shiftKey) {
            self.clearSelect();
        }
        self.dispatchEvent({type: U3dSelect.EVENT.START, data: null});

        let intersects;
        if (this.#pickBufferPx > 0) {
            intersects = this.#pickAtScreen(e);
        } else if(self.#targetLayer && self.#targetLayer.length > 0){ //targetLayer 가 있을때는 targetLayer의 scene으로만 검사한다.
            const sceneList  = [];
            for(let layerName of self.#targetLayer){
                const layer = app.getLayerByName(layerName);
                if(layer){
                    sceneList.push(layer.getScene());
                }
            }
            intersects = app.intersectFromScene(e, sceneList, undefined, this._rayOption);
        }else{
            intersects = app.intersectAtPixel(e, undefined, undefined, undefined, this._rayOption);
        }
        if (this.#pickBufferPx === 0) intersects = self.#checkIntersects(intersects,e);

        if (intersects.length === 0) {
            self.clearSelect();
            self.#raiseEvent(U3dSelect.EVENT.END);
            return false;
        }

        self.#setSelected(intersects, true, true);
        const work = self.#setWork(intersects);
        self.#raiseEvent(U3dSelect.EVENT.CHANGE, work);
        self.#raiseEvent(U3dSelect.EVENT.END, work);
    }

    /**
     * @param {SelectPointerEvent} e
     * @returns {boolean|void}
     */
    #polygonClick(e) {
        let self = this;
        let app = this._app;
        if(!defined(app)) return;

        let drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        let selectLayer = this._selectLayer;
        if(!defined(selectLayer)) return;

        if (self._measureFeature !== undefined) {
            self.clear();
        }

        self.dispatchEvent({type: U3dSelect.EVENT.START, data: null});

        let point3d = undefined;
        let intersects = app.intersectAtPixel(e, true);

        if (intersects.length > 0) {
            let intersect = intersects[0];
            if (isNaN(intersect.point.z) || intersect.point.z < 0)
                intersect.point.z = 0;

            point3d = intersect.point;
        }

        if (!defined(point3d) || point3d === null) {
            if (UDEF.debug) console.info('picking is null');
            return;
        }
        if (self.mode === UDEF.SELECT_MODE.LINE) {
            if (selectLayer._measurePoints.length === 0)
                self.clearSelect();
        } else {
            self.clearSelect();
        }

        let geo = drawArg.getWorldToGeographic(point3d.x, point3d.y, point3d.z);
        let feature = selectLayer.addMeasurePoint(geo);

        if (self.mode === UDEF.SELECT_MODE.CIRCLE && selectLayer._measurePoints.length > 1) {
            UDEF.disposeObject3D(self._poiGroup)
            self._poiGroup.clear();
            self._poiGroup.visible = true;
            let firstPoint = app.geographicToVector3(selectLayer._measurePoints[0]);
            let poi = U3dBilboard.makeBilboard({
                position: firstPoint,
                text: 'center'
            });
            self._poiGroup.add(poi);
        }
        let poi = U3dBilboard.makeBilboard({
            position: point3d,
            text: 'click'
        });
        self._poiGroup.add(poi);

        if (!defined(app._sceneComment.getObjectById(self._poiGroup.id))) {
            app._sceneComment.add(self._poiGroup);
        }
        let scenes;
        if(self.#targetLayer && self.#targetLayer.length > 0){
            scenes = [];
            for(let layerName of self.#targetLayer){
                const layer = app.getLayerByName(layerName);
                if(layer) scenes.push(layer.getScene());
            }
        }else{
            scenes = drawArg.getInstanceScenesFromModelLayers();
        }
        const geom = feature?.getGeometry?.();
        self._measureGeom = geom;

        for(let scene of scenes){
            const intersects = self.checkGeom(scene,geom);
            self.#setSelected(intersects, false, false);
        }

        self.#raiseEvent(U3dSelect.EVENT.CHANGE, self.#setWork());
        return true;
    }

    #polygonDblclick() {
        const self = this;

        pointDispose(self._poiGroup);
        self._poiGroup.clear();
        self._app._sceneComment.remove(self._poiGroup);

        self.#raiseEvent(U3dSelect.EVENT.END, self.#setWork());

        commitFeature.call(self);
        if(self._measureFeature)
            self._measureGeom = self._measureFeature.getGeometry();
    }

    /**
     * @param {Array<any>} intersects
     * @param {boolean} [isSingle=true]
     * @param {boolean} [togglable=true]
     *
     */
    #setSelected(intersects, isSingle = true, togglable = true) {
        const self = this;

        if(self._auto){
            if(intersects.length === 0) return;
            for(let intersect of intersects){
                const object = intersect.object;
                if(togglable){
                    if(isSelected.call(self, object)){
                        self.removeSelected(object);
                    }else{
                        self.addSelected(object, intersect);
                    }
                }else{
                    if(!isSelected.call(self, object)){
                        self.addSelected(object, intersect);
                    }
                }

                if(isSingle)
                    return;
            }
        }else{
            intersects.forEach((/** @type {any} */ intersect) => {
                self._manualSelects.push(intersect.object);
            });
        }
    }

    /**
     * @param {Array<any>} [intersects=[]]
     * @returns {{type:string, points:Array<GeoPosition|NormalizedPosition>, worlds:Array<WorldPosition>}}
     */
    #setWork(intersects = []){
        const self = this;
        const type = self.getMode();

        /** @type {Array<GeoPosition|NormalizedPosition>} */
        let points =[];
        /** @type {Array<WorldPosition>} */
        let worlds =[];
        if(type === UDEF.SELECT_MODE.POINT){
            points = self._posList;
            if(self._auto){
                points.push(self._app.vector3ToGeoGraphic(intersects[0].point));
                worlds.push(intersects[0].point);
            }else{
                intersects.forEach((/** @type {any} */ intersect) => {
                    points.push(self._app.vector3ToGeoGraphic(intersect.point));
                    worlds.push(intersect.point);
                });
            }
        } else if(type === UDEF.SELECT_MODE.BOX){
            const selectBox = self.getSelectBox();
            if(selectBox){
                const startPoint = /**@type{NormalizedPosition} */ (selectBox.getStartPointNormalized());
                const endPoint = /**@type{NormalizedPosition} */ (selectBox.getEndPointNormalized());
                points = [startPoint, endPoint];
            }
            //카메라 정보 추가 저장 필요 -> drawWork 작업 하기
        } else{
            const measurePoints = self.getMeasurePointList();
            if(measurePoints && measurePoints.length > 0){
                if (type === UDEF.SELECT_MODE.CIRCLE) {
                    points = [measurePoints[0], measurePoints[measurePoints.length - 1]];
                }else{
                    points = measurePoints;
                }
            }
        }

        return {type, points, worlds}
    }

    /**
     * @param {string} type
     * @param {any} [work]
     *
     */
    #raiseEvent(type, work) {
        const self = this;
        self._workEvent = type;
        /** @type {any} */
        const eventPayload = this._auto
            ? {type: self._workEvent, data: Object.values(this._selected), work: work}
            : {type: self._workEvent, data: self._manualSelects, work: work};
        if(this._auto){
            self.dispatchEvent(eventPayload);
        }else{
            self.dispatchEvent(eventPayload);
        }
    }
    /**
     * 박스 선택의 검색 대상과 입력을 연결하고 각 입력에 현재 앱 카메라를 반영합니다.
     *
     * @returns {void} 검색 대상과 입력 리스너를 갱신합니다.
     */
    #setSelectBoxMode(){
        const self = this;
        const layerList = [];
        const app = self._app;
        const drawArg = app._drawArg;
        const camera = self._app._camera;
        let layers = [] //검색 대상의 scene이 필요해서 targetLayer 지정시에만 가능
        const targetSceneGroup = new UGroup();
        /** @type {Array<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} */
        const componentList = [];

        if(self.#targetLayer && self.#targetLayer.length > 0){
            for(let layerName of self.#targetLayer){
                const layer = self._app.getLayerByName(layerName);
                if(layer) layers.push(layer);
            }

            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];
                if(!layer) continue;
                const scene = layer.getScene();
                layerList.push(layer);
                if(scene)
                    targetSceneGroup.children.push(scene);
            }
        }else{
            // 컴포넌트 목록은 모델 레이어에서만 나오므로 레이어 목록은 그대로 둔다.
            layers = drawArg.getInstanceModelLayers();
            for (let i = 0; i < layers.length; i++) {
                if(layers[i]) layerList.push(layers[i]);
            }

            // 검색 대상 scene은 영역(다각형) 선택과 같은 범위로 맞춘다.
            // 모델 레이어만 담던 때에는 vector 같은 user 레이어가 박스에 전혀 잡히지 않았다.
            // 점 선택은 지형까지 보지만 여러 개를 한번에 고르는 모드는 지형을 뺀다.
            // 범위 안에 드는 지형 타일은 항상 딸려 나와 정작 고르려던 것을 덮어버리기 때문이다.
            // 같은 함수를 나눠 써야 한쪽만 범위가 바뀌는 일이 생기지 않는다.
            const scenes = self._app.getInstanceScenesFromModelLayers();
            for (let i = 0; i < scenes.length; i++) {
                if(scenes[i]) targetSceneGroup.children.push(scenes[i]);
            }
        }

        for (let j = 0; j < layerList.length; j++) {
            const layer = layerList[j];
            if(!layer.getComponentList) continue;
            const list = layer.getComponentList();
            componentList.push(...list);
        }

        // map control stop
        self._app.disableCameraMove(true);

        if(!self.getSelectBox()){
            const boxEvent = self.selectBoxEvent;
            boxEvent.selectBox  = new U3dSelectionBox( camera, targetSceneGroup );
            if(!defined(boxEvent.selectBox)) return

            const renderer = self._app.getRenderer();

            boxEvent.selectBox.setHelper(renderer);
            ///////////////////////////////////////////////////////////////////////////
            boxEvent.pointerDownId = self.uuid + '_pointerDown';
            app.on(U3dAppEventHandler.EVENT.MOUSEDOWN,(/** @type {any} */ event)=>{
                self.clearSelect();

                boxEvent.selectBox?.setCamera(app._camera);
                boxEvent.selectBox?.pointerDown(event);
                self.dispatchEvent({type: 'pointerdown', data: [] });

                ///////////////////////////////////////////////////////////////////////////
                if(!boxEvent.pointerMoveId){
                    boxEvent.pointerMoveId = self.uuid + '_pointerMove';
                    app.on(U3dAppEventHandler.EVENT.MOUSEMOVE,(/** @type {any} */ event)=>{
                        boxEvent.selectBox?.setCamera(app._camera);
                        const result = boxEvent.selectBox?.pointerMove(event);
                        if(!result) return;

                        const intersects = self.#getSelectBoxChangeEvent(result, componentList);
                        const work = self.#setWork(intersects);
                        self.#raiseEvent(U3dSelect.EVENT.CHANGE, work);
                        self.dispatchEvent({type: 'pointermove',  data: result});
                    },false, boxEvent.pointerMoveId);
                }
            },false, boxEvent.pointerDownId);
            ///////////////////////////////////////////////////////////////////////////
            boxEvent.pointerUpId = self.uuid + '_pointerUp';
            app.on(U3dAppEventHandler.EVENT.MOUSEUP,(/** @type {MouseEvent} */ event)=>{
                boxEvent.selectBox?.setCamera(app._camera);
                const result = boxEvent.selectBox?.pointerUp(event);
                if(!result) return;

                const intersects = self.#addSelectBoxEvent(result, componentList);
                const work = self.#setWork(intersects);
                self.#raiseEvent(U3dSelect.EVENT.END, work);
                self.dispatchEvent({type: 'pointerup', data: result});

                if(boxEvent.pointerMoveId){
                    app.off(U3dAppEventHandler.EVENT.MOUSEMOVE,boxEvent.pointerMoveId);
                    boxEvent.pointerMoveId = undefined;
                }
            },false, boxEvent.pointerUpId);
        }else{
            const boxEvent = self.selectBoxEvent;
            boxEvent.selectBox?.setCamera(camera);
            boxEvent.selectBox?.setScene(targetSceneGroup);
        }
    }

    /**
     * @param {Record<string, Array<any>>} instances
     * @param {Array<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} componentList
     * @returns {Array<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>}
     */
    #getInstancesToComponent(instances, componentList){
        const instancesList = Object.keys(instances);
        let targetInstances = [];
        for (let i = 0; i < instancesList.length; i++) {
            const uuid = instancesList[i];
            if(instances[uuid].length > 0){

                for (let j = 0; j < componentList.length; j++) {
                    const component = componentList[j];
                    let group;
                    if( component instanceof  U3dComponentInstancedPosition){
                        group = component.instancedGroup;
                    }else{
                        group = component._object;
                    }
                    if(!group) continue;
                    let find = false;
                    group.traverse(function(/** @type {any} */ child){
                        if(child.uuid === uuid){
                            if(component.getInstanced() && instances[uuid].includes(component.instanceId)){
                                find = true;
                            }else if(!component.getInstanced()){
                                find = true;
                            }
                        }
                    })
                    if(find){
                        targetInstances.push(component);
                    }

                }
            }
        }
        return targetInstances;

    }
    /**
     * @param {any} selectResults
     * @param {Array<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} componentList
     * @returns {Array<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>}
     */
    #getSelectBoxChangeEvent(selectResults, componentList){
        const self =this;
        const instances = selectResults.instances;
        const objects = selectResults.objects;

        self.clearSelect();

        //instanced position 객체
        let targetInstances = self.#getInstancesToComponent(instances, componentList);

        // 일반 mesh 객체
        const tempIntersects = [];
        for ( let i = 0; i < objects.length; i ++ ) {
            const object = objects[i];
            tempIntersects.push({object:object})
        }
        const result = self.#checkIntersects(tempIntersects,[]);

        result.push(...targetInstances);
        return result;
    }
    /**
     * @param {any} selectResults
     * @param {Array<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} componentList
     * @returns {Array<any>}
     */
    #addSelectBoxEvent(selectResults, componentList){
        const self =this;
        const instances = selectResults.instances;
        const objects = selectResults.objects;

        self.clearSelect();

        //instanced position 객체
        let targetInstances = self.#getInstancesToComponent(instances, componentList);
        for (let i = 0; i < targetInstances.length; i++) {
            const instanceObject = targetInstances[i];
            if(self._auto){
                self.addSelected(instanceObject);
            } else {
                self._manualSelects.push(instanceObject);
            }
        }
        // 일반 mesh 객체
        const tempIntersects = [];
        for ( let i = 0; i < objects.length; i ++ ) {
            const object = objects[i];
            tempIntersects.push({object:object})
        }
        const result = self.#checkIntersects(tempIntersects,[]);

        for (let i = 0; i <result.length; i++) {
            const intersect = result[i].object;
            if(self._auto){
                self.addSelected(intersect);
            } else {
                self._manualSelects.push(intersect);
            }
        }

        result.push(...targetInstances);
        return result;
    }

    /**
     * @param {string} mode
     * @returns {boolean}
     */
     #validateMode(mode){
        if (mode === UDEF.SELECT_MODE.POINT) return true;
        if (mode === UDEF.SELECT_MODE.AREA) return true;
        if (mode === UDEF.SELECT_MODE.LINE) return true;
        if (mode === UDEF.SELECT_MODE.CIRCLE) return true;
        if (mode === UDEF.SELECT_MODE.BOX) return true;
        return false;
    }


    /**
     * 선택 객체에 Outline(외곽선) 하이라이트를 적용하는 함수 <br>
     * `selectType === UDEF.SELECT_TYPE.OUTLINE`|| 'outline' 에서 사용되며, 외부에서 직접 호출할 수도 있습니다.
     * 생성 옵션 또는 setSelectType()에 저장한 mode·renderOrder·lineWidth·width·farPoint를 배리어에 전달합니다.
     *
     * @param {USelect} selected 선택 객체(모델/메시)
     *
     */
    setOutline(selected){
        const self = this;
        const app = self._app;

        if(!self._effector){
            const setPulse = self._selectedPulse;
            self._effector = new U3dObjectBarrier(app);
        }

        const typeOption = self.getSelectTypeOption();
        /** @type {import('@union3d/select/U3dObjectBarrier').UOutlineStyleOption} */
        const style = {
            color: self._selectColor,
            opacity: self._selectOpacity,
            mode: typeOption.mode ?? U3dObjectBarrier.MODE.BASIC,
            renderOrder: typeOption.renderOrder ?? U3dObjectBarrier.RENDER_ORDER.PASS1,
            farPoint: typeOption.farPoint,
            lineWidth: typeOption.lineWidth,
            width: typeOption.width,
        };
        self._effector.setBarrier(/** @type {any} */ (selected), style, false);

    }
    /**
     * 지정한 크기의 회전 링을 적용하거나 기존 링의 대상과 스타일을 갱신합니다.
     * 지형 타일 및 광선 검사에서 grounded_로 분류하는 지형 평면에는 표시하지 않습니다.
     * @param {USelect} selected 선택 대상
     */
    setRing(selected) {
        if (!this._app || !selected || typeof selected !== 'object' || selected instanceof THREE.BufferGeometry) return;
        // 외곽선의 타일 제외와 광선 검사의 grounded_ 판정을 동일하게 적용합니다.
        if (selected instanceof UTileMesh || (selected instanceof THREE.Mesh // UTileMesh 대상은 제외 합니다.
            && 'classtype' in selected.geometry && selected.geometry.classtype === 'UPlaneBufferGeometry')) return;
        if (!this._ringEffector) this._ringEffector = new U3dSelectionRing(this._app, this.uuid + '_selectionRing');
        // 이동으로 경계 중심이 달라져도 선택 시 저장한 키를 유지합니다.
        const entry = Object.entries(this._selected).find(([, object]) => object === selected);
        const key = entry ? entry[0] : makeObjectKey(selected);
        this._ringEffector.set(key, selected, this._selectColor, this._selectOpacity, this.getSelectTypeOption());
    }
    /**
     * 선택 모드를 설정하는 함수 <br>
     * 앱이 연결된 상태면 측정 레이어의 도형 종류를 모드에 맞게 바꾸고, 입력 리스너를 다시 등록한 뒤 `clear()`를 호출하므로 **현재 선택과 그려진 도형이 모두 해제**됩니다.
     *
     * @param {string} mode 선택 모드 <br>
     * - `UDEF.SELECT_MODE.POINT ['point'] | AREA ['area'] | LINE ['line'] | CIRCLE ['circle'] | BOX ['box']`
     * @throws {Error} 지원하지 않는 모드가 입력된 경우
     */
    setMode(mode) {
        if (!this.#validateMode(mode)) {
            throw new Error('\'' + mode + '\' is not surpported. surpport mode: [\'point\' \'area\' \'line\' \'circle\' \'box\']');
        }
        this.#stopHover();
        this.mode = mode;
        if(!defined(this._selectLayer)) return;

        if (this.mode === UDEF.SELECT_MODE.AREA) {
            this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.POLYGON);
        } else if (this.mode === UDEF.SELECT_MODE.LINE) {
            this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.LINESTRING);
        } else if (this.mode === UDEF.SELECT_MODE.CIRCLE) {
            this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.POINTBUFFER);
        } else if( this.mode === UDEF.SELECT_MODE.BOX){
            this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.NONE)
        }

        this.#removeEventListener();
        this.#addEventListener();
        this.clear();
    };

    /**
     * 선택기능 활성화 함수 <br>
     * 현재 모드에 맞는 클릭/드래그 리스너를 앱에 등록합니다. <br>
     * `setApp()`이 먼저 호출되어 있어야 하며, 이미 활성 상태면 아무 것도 하지 않습니다. <br>
     * BOX 모드에서는 드래그 동안 지도 카메라 조작이 막힙니다.
     */
    active() {
        if (this._isActive)
            return;

        let self = this;
        if (self._clickId !== undefined || self._dblClickId !== undefined) {
            self.deactive();
        }
        self._isActive = true;
        self.#addEventListener();
    };

    /**
     * 선택기능 비활성화 함수 <br>
     * 입력 리스너를 해제하고 그리던 영역 도형을 확정합니다. <br>
     * 마지막 이벤트가 `end`가 아니면(선택 동작 도중이면) `clear()`로 선택도 해제합니다.
     */
    /// <summary>입력 구독을 해제합니다. 앱이 종료된 경우 측정 확정과 장면 정리는 건너뛰고 활성 상태를 초기화합니다.</summary>
    deactive() {
        try {
            this.#removeEventListener();
            if (!isSelectAppAvailable(this)) return;
            commitFeature.call(this);
            if (defined(this._workEvent) && this._workEvent !== 'end') this.clear();
        } finally {
            this._isActive = false;
        }
    };

    /**
     * U3dSelect 제거(dispose) 함수 <br>
     * 선택 해제·비활성화 후 **이 객체에 등록된 모든 이벤트 리스너(`on`으로 등록한 사용자 리스너 포함)를 제거**하고 내부 자원을 해제합니다. <br>
     * 호출 후에는 다시 사용할 수 없습니다.
     */
    remove() {
        try {
            this.deactive();
        } finally {
            try { this.clear(); }
            finally { this.removeEventListenerAll(); dispose.call(this); }
        }
    };


    /**
     * `getSelectWork()` 형태의 작업 정보를 이용해 선택을 재현하는 함수 <br>
     * - 드로잉(측정 레이어) 재생성 <br>
     * - 교차 객체 탐색 후 선택/하이라이트 반영
     *
     * @param {{type:string, points:Array<GeoPosition>}} work 선택 작업 정보. `type`은 선택 모드, `points`는 위경도 좌표계(EPSG:4326) 좌표 목록으로 `getSelectWork()`의 반환값을 그대로 넘긴다
     * @returns {boolean|undefined} 재현 성공 시 true. 입력이 유효하지 않거나 앱·측정 레이어가 없으면 반환 없음(POINT 모드는 재현 후에도 반환 없음)
     */
    drawByWork(work) {
        const self = this;
        if (!defined(work) || !defined(work.type) || !defined(work.points)) {
            return;
        }
        const type = work.type;
        const points = work.points;
        const app = this._app;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);

        if(!defined(this._selectLayer)) return;

        if (type === UDEF.SELECT_MODE.AREA) {
            this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.POLYGON);
        } else if (type === UDEF.SELECT_MODE.LINE) {
            this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.LINESTRING);
        } else if (type === UDEF.SELECT_MODE.CIRCLE) {
            this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.POINTBUFFER);
        } else if (type === UDEF.SELECT_MODE.POINT) {
            let scenes = null;
            if(self.#targetLayer && self.#targetLayer.length > 0){
                scenes = [];
                for(let layerName of self.#targetLayer){
                    const layer = self._app.getLayerByName(layerName);
                    if(layer){
                        scenes.push(layer.getScene());
                    }
                }
            }
            const selectedModels = /** @type {Array<GeoPosition>} */(Object.values(points));
            for (let i = 0; i < selectedModels.length; i++) {
                let selected = /** @type {Array<import('three').Intersection>} */(app.intersectModelAtGeographicPoint(selectedModels[i], 3, false, scenes));
                selected = self.#checkIntersects(selected,selectedModels[i]);

                self.#setSelected(selected, false, false);
            }
            self.#raiseEvent(U3dSelect.EVENT.END, work);
            return;
        }

        let selectLayer = self._selectLayer;
        if(!defined(selectLayer)) return;
        let feature

        if (type === UDEF.SELECT_MODE.CIRCLE && points.length > 1) {
            this._poiGroup.clear();
            let firstPoint = app.geographicToVector3(points[0]);
            let geo = points[0];
            feature = selectLayer.addMeasurePoint(geo);
            let poi = U3dBilboard.makeBilboard({
                position: firstPoint,
                text: 'center'
            });
            self._poiGroup.add(poi);
            let afterPoint = app.geographicToVector3(points[points.length - 1]);
            let geo_ = points[points.length - 1];
            feature = selectLayer.addMeasurePoint(geo_);
            let poi_ = U3dBilboard.makeBilboard({
                position: afterPoint,
                text: 'click'
            });
            self._poiGroup.add(poi_);
        } else if (type === UDEF.SELECT_MODE.AREA || type === UDEF.SELECT_MODE.LINE) {
            for (let i = 0; i < points.length; i++) {
                let afterPoint = app.geographicToVector3(points[i]);
                let poi_ = U3dBilboard.makeBilboard({
                    position: afterPoint,
                    text: 'click'
                });
                self._poiGroup.add(poi_);
                let geo = points[i];
                feature = selectLayer.addMeasurePoint(geo);
            }
        }
        if (!defined(self._app._sceneComment.getObjectById(self._poiGroup.id))) {
            self._app._sceneComment.add(self._poiGroup);
        }
        if (!defined(feature))
            return;
        let geom = feature.getGeometry();
        let scenes = drawArg.getInstanceScenesFromModelLayers();
        for(let scene of scenes){
            const intersects = self.checkGeom(scene,geom);
            self.#setSelected(intersects, false, false);
        }

        pointDispose(self._poiGroup);
        self._poiGroup.clear();
        self._app._sceneComment.remove(self._poiGroup);
        commitFeature.call(self);
        if(self._measureFeature)
            self._measureGeom = self._measureFeature.getGeometry();

        self.#raiseEvent(U3dSelect.EVENT.END, work);

        if(defined(self._selectLayer))
            self._selectLayer.setMeasureType( self._selectLayer._measureType );
        return true;

    }

    /**
     * 선택 객체에 대해 지표면 기준 수직 보조 객체(빔 + 지면 하이라이트)를 생성하는 함수 <br>
     * `opt.setVerticalObject === true`일 때 선택 시 자동 생성되며, 필요 시 외부에서 직접 호출할 수 있습니다.
     *
     * @param {USelect} result 타일 mesh를 제외한 선택 객체. 월드 위치(`position`)와 지오메트리 또는 `getBoundingBox()`가 있어야 하며, 없으면 만들지 않는다
     * @returns {import('@UGroup').UGroup|undefined} 앱 Scene에 추가된 수직 보조 그룹(빔 `userData.verticalMesh`, 지면 하이라이트 `userData.planeMesh`) <br>
     * 같은 객체에 이미 만든 것이 있으면 해제 후 교체합니다. <br>
     * 만들 수 없으면 undefined를 반환합니다.
     */
    createVerticalObject(/** @type {any} */ result){
        if(!result || result instanceof UTileMesh) return undefined;
        if(!result.geometry && !result.getBoundingBox) return undefined;
        const self = this;

        const color = self._selectColor;
        const position = result.position.clone();

        let groundHeight = self._app._drawArg.getRenderHeightAtPoint(position.x, position.y); //확인됨
        if(!defined(groundHeight) || groundHeight === UDEF.INVALID || groundHeight === UDEF.TERRAIN_NO_DATA)
            groundHeight = 0;

        const size = new THREE.Vector3();
        if(result.geometry){
            if(!result.geometry.boundingBox){
                result.geometry.computeBoundingBox();
            }
            const bbox = result.geometry.boundingBox;
            if(bbox){
                const min = new THREE.Vector3().copy(bbox.min);
                const max = new THREE.Vector3().copy(bbox.max);
                const bboxClone = new THREE.Box3(min, max);
                bboxClone.applyMatrix4(result.matrixWorld);
                bboxClone.getSize(size);
                position.z = bboxClone.min.z;
            }
        }else if (result.getBoundingBox){
            const bbox = result.getBoundingBox();
            bbox.getSize(size);
        }
        const length = size.length() > 0 ? size.length() : 1;
        const beamRadius = Math.min (length , 100) / 4 ;
        const markerParams = {
            beamColor: new THREE.Color(color),
            beamMaxRadius: beamRadius,      // 빔 두께 반지름
            beamOpacity: 0.75,
            position:position,
            groundHeight:groundHeight,

            highlightColor: new THREE.Color(color),
            highlightRadius: beamRadius + 1,   // 지표면 강조 반경
            highlightSoftness: 0.6   // 0..1 (0=hard edge, 1=very soft)
        };

        const beam = self.#createBeam(markerParams, result);
        const groundPlane = self.#createGroundHighLight(markerParams, result);
        const verticalGroup = new UGroup({name:'verticalGroup'});
        verticalGroup.userData.verticalMesh = beam
        verticalGroup.userData.planeMesh = groundPlane
        verticalGroup.add(beam);
        verticalGroup.add(groundPlane);
        const scene = /**@type{any}*/(self._app.getScene());
        scene?.add(verticalGroup);
        result.userData = result.userData || {};
        result.userData.verticalObjects = result.userData.verticalObjects || new Map();
        if(result.userData && result.userData.verticalObjects){
            const preVerticalGroupList = result.userData.verticalObjects;
            if(!(preVerticalGroupList.has(self))){
                preVerticalGroupList.set(self, verticalGroup);
            }else{
                const preVerticalGroup = preVerticalGroupList.get(self);
                UDEF.disposeObject3D(preVerticalGroup);
                if(preVerticalGroup.parent)
                    preVerticalGroup.parent.remove(preVerticalGroup);
                preVerticalGroupList.set(self, verticalGroup);
            }
        }

        return verticalGroup;
    }

    /**
     * @param {any} markerParams
     * @param {any} object
     * @returns {THREE.Mesh}
     */
    #createBeam(markerParams, object) {
        const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);

        const beamMat = new THREE.ShaderMaterial({
            vertexShader: verticalShader.vertexShader,
            fragmentShader: verticalShader.fragmentShader,
            transparent: true,
            depthTest: false,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            uniforms: {
                uColor: { value: markerParams.beamColor },
                uOpacity: { value: markerParams.beamOpacity },
                uRadius: { value: markerParams.beamMaxRadius },
                uHeight: { value: 0.0 },
                uGroundZ: { value: 0.0 },
                uBottomZ: { value: 0.0 },
                uTopZ: { value: 0.0 },
                uMaxDepth: { value: 0.0 }
            }
        });

        const position = markerParams.position;
        const groundHeight = markerParams.groundHeight;
        const topZ = position.z;
        const bottomZ = groundHeight;
        const height = Math.max(0.001, Math.abs(topZ - bottomZ));

        const beamMesh = new THREE.Mesh(cylGeo, beamMat);
        beamMesh.rotation.x = Math.PI / 2; // align cylinder axis to Z (since default is Y)
        beamMesh.scale.set(markerParams.beamMaxRadius,  height, markerParams.beamMaxRadius);
        beamMesh.userData.exceptAO = true;
        beamMesh.renderOrder = 1;

        // position at midpoint
        const mid = new THREE.Vector3(position.x, position.y, (topZ + bottomZ)/2 );
        beamMesh.position.copy(mid);

        //set uniforms value
        beamMat.uniforms.uHeight.value = height;
        beamMat.uniforms.uGroundZ.value = groundHeight;              // 지표면 z
        beamMat.uniforms.uBottomZ.value = Math.min(position.z, groundHeight);         // 빔 바닥 Z
        beamMat.uniforms.uTopZ.value = Math.max(position.z, groundHeight);  // 빔 끝 Z
        beamMat.uniforms.uMaxDepth.value = Math.abs(groundHeight - position.z);         // 지표면에서 300m 이상 떨어지면 희미해짐

        const visibleOffset = 5;
        if(height < visibleOffset) // 지면 높이와 차이가 크지 않을 경우 가시화 끄기
            beamMesh.visible = false;

        return beamMesh;
    }

    /**
     * @param {any} markerParams
     * @param {any} object
     * @returns {THREE.Mesh}
     */
    #createGroundHighLight (markerParams, object){

        const planeGeo = new THREE.PlaneGeometry(5, 5);
        const highlightMat = new THREE.ShaderMaterial({
            vertexShader: planeShader.vertexShader,
            fragmentShader: planeShader.fragmentShader,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            uniforms: {
                uColor: { value:markerParams.highlightColor },
                uRadius: { value: markerParams.highlightRadius },
                uSoftness: { value: markerParams.highlightSoftness },
                uOpacity: { value: 0.45 }
            }
        });
        const highlightMesh = new THREE.Mesh(planeGeo, highlightMat);
        highlightMesh.userData.exceptAO = true;
        const radius = markerParams.highlightRadius;
        highlightMesh.scale.set(radius * 2, radius * 2, 1);
        const position = markerParams.position;
        const groundHeight = markerParams.groundHeight;
        highlightMesh.position.set(position.x, position.y, groundHeight + 0.01); // slight offset for z-fight

        highlightMesh.visible = true;
        return highlightMesh;

    }
    /**
     * 선택 해제 시 수직 보조 객체를 제거하는 함수
     *
     * @param {string} key 내부 선택 키(`layerName + '^' + id`)
     * @param {USelect} selected 선택 객체
     *
     */
    removeVerticalObject(key, selected){
        const self = this;

        if(self._verticalObjects[key]){
            const verticalObject = self._verticalObjects[key];
            delete self._verticalObjects[key]
            UDEF.disposeObject3D(verticalObject);
            if(verticalObject.parent)
                verticalObject.parent.remove(verticalObject);
        }

        if(selected.userData && selected.userData.verticalObjects){
            const verticalObject = selected.userData.verticalObjects.get(self);
            if(verticalObject){
                selected.userData.verticalObjects.delete(self);
                UDEF.disposeObject3D(verticalObject);
                if(verticalObject.parent)
                    verticalObject.parent.remove(verticalObject);
            }
            if(selected.userData.verticalObjects.size === 0 ){
                delete selected.userData.verticalObjects
            }
        }

    }
}

/**
 * 현재 선택된 모드를 반환하는 함수
 *
 * @returns {string} 선택 모드(단일: 'point', 영역: 'area', 선: 'line', 반경: 'circle', 드래그 사각형: 'box') <br>
 * 모드가 설정되지 않았으면 빈 문자열
 */
U3dSelect.prototype.getMode = function () {
    if (this.mode)
        return this.mode;
    return '';
}

/**
 * 선택 하이라이트 시 모델의 텍스처를 제외할지 설정하는 메서드. <br>
 * `true`이면 하이라이트가 적용될 때 텍스처를 표시하지 않습니다.
 *
 * @param {boolean} exceptTexture 선택 모델의 텍스처 제외 여부
 */
U3dSelect.prototype.setExceptTexture = function (exceptTexture) {
    if (defined(exceptTexture))
        this.exceptTexture = exceptTexture;

    let self = this;
    let models = Object.values(self._selected);
    for (let model of models) {
        if (model.isMerged) {
            setSelectedStyle.call(self, model, self._selectColor, self._selectOpacity, 'texture');
        }
        self.setTexture(model, self.exceptTexture);
    }

    self._app.updateData();
}

/**
 * 현재 선택 모델 텍스쳐 제외 여부를 반환하는 함수
 *
 * @returns {boolean|undefined} 텍스처 제외 설정이 켜져 있으면 true <br>
 * 꺼져 있으면 false가 아니라 undefined입니다.
 */
U3dSelect.prototype.isExceptTexture = function () {
    if (this.exceptTexture)
        return this.exceptTexture;
    return undefined
}


/**
 * 선택기능 활성화 여부를 반환하는 함수
 *
 * @returns {boolean} 선택 기능 활성화 여부
 */
U3dSelect.prototype.isActive = function () {
    return this._isActive;
};

/**
 * 선택기능 초기화 함수 <br>
 * 선택/드로잉 상태를 초기화하고 측정 레이어의 draw feature를 정리합니다.
 */
/// <summary>선택과 자체 드로잉을 정리합니다. 종료된 앱의 측정·장면 자원에는 접근하지 않습니다.</summary>
U3dSelect.prototype.clear = function () {
    this.clearSelect(true);
    pointDispose(this._poiGroup);
    this._poiGroup?.clear();
    if (isSelectAppAvailable(this)) {
        this._app._sceneComment?.remove(this._poiGroup);
        this._app._measureLayer?.clearMeasure();
    }
    this._measureFeature = undefined;
};

/**
 * 작동할 U3dApp을 설정하는 함수, (U3dSelect 객체를 작동하기 위하여 필수적으로 사용하여야 하는 함수)
 *
 * @param {import('@U3dApp').U3dApp} app U3dSelect가 작동할 App
 */
U3dSelect.prototype.setApp = function (app) {
    if (this._app && this._app !== app && this._isActive) this.deactive();
    this.clearHover();
     this._ringEffector?.dispose();
    this._ringEffector = undefined;
    this._app = app;
    this._drawArg = app._drawArg;

    this._selectLayer = this._app._measureLayer;
    if(!defined(this._selectLayer)) return;

    if (this.mode === UDEF.SELECT_MODE.AREA) {
        this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.POLYGON);
    } else if (this.mode === UDEF.SELECT_MODE.LINE) {
        this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.LINESTRING);
    } else if (this.mode === UDEF.SELECT_MODE.CIRCLE) {
        this._selectLayer.setMeasureType(UDEF.MEASURE_TYPE.POINTBUFFER);
    }

    this._selectLayer.show(true);
    this.clear();
};

/**
 * 현재 선택된 모델의 개수를 반환하는 함수
 *
 * @returns {number} 선택된 모델 개수
 */
U3dSelect.prototype.getSelectCount = function () {
    var self = this;
    return Object.keys(self._selected).length;
};

/**
 * 현재 측정/드로잉 중인 점 목록을 반환하는 함수 <br>
 * `AREA/LINE/CIRCLE` 모드에서 드로잉 중일 때 유효합니다.
 *
 * @returns {undefined | Array<GeoPosition>} 그리는 중인 도형의 꼭짓점 위경도 좌표계(EPSG:4326) 목록. 측정 레이어가 없거나 점이 없으면 undefined
 */
U3dSelect.prototype.getMeasurePointList = function () {
    let self = this;
    if (!defined(self._selectLayer) || !defined(self._selectLayer._measurePoints)) {
        return undefined;
    }

    if (self._selectLayer._measurePoints.length > 0)
        return self._selectLayer._measurePoints;

    return undefined;
}

/**
 * 현재 선택 작업(work) 정보를 반환하는 함수<br>
 * 반환값은 이벤트(`change/end`)의 `e.work`와 동일한 형태를 의도하며, `drawByWork()`에 넘겨 같은 선택을 재현할 수 있습니다. <br>
 * POINT 모드에서는 반환과 함께 내부 지점 목록을 비우므로 **연속 호출 시 두 번째부터는 빈 목록**이 됩니다.
 *
 * @returns {{type:string, points:Array<GeoPosition>}|void} 선택 모드와 위경도 좌표계(EPSG:4326) 좌표 목록. 모드가 없거나 영역 도형이 확정되지 않았으면 반환 없음
 */
U3dSelect.prototype.getSelectWork = function () {
    let self = this;
    let work;
    let type = self.getMode();
    if (!type) {
        return;
    }

    if (type === UDEF.SELECT_MODE.POINT) {
        // let posList= self.getSelected();
        work = {
            type: type,
            points: self._posList
        }
        self._posList = [];
        return work;
    }

    let measureFeature = self._measureFeature;
    if (!defined(measureFeature)) {
        return;
    }
    //let coords = geom.transform('EPSG:3857', 'EPSG:4326');
    let vectors = measureFeature.getMeasureVectors();
    let points = [];
    for (let i = 0; i < vectors.length; i ++) {
        let vector = vectors[i];
        let pos = {
            x: vector.x,
            y: vector.y,
            z: vector.z
        }
        const geo = self._app.vector3ToGeoGraphic(pos);
        points.push(geo);
    }
    work = {
        type: type,
        points: points
    }
    if (defined(work))
        return work;

}

/**
 * 드로잉으로 그려진 선택 영역(측정 도형)만 제거하는 함수<br>
 * 선택 목록(`_selected`)은 해제하고, 측정 레이어의 draw feature도 정리합니다.
 *
 */
U3dSelect.prototype.clearDrawnSelect = function () {
    let self = this;
    self.clearSelect(true);
    if (defined(self._measureFeature)) {
        // self._selectLayer.removeFeature(self._measureFeature);
        self._app.removeMeasureFeature(this._measureFeature);
        self._measureFeature = undefined;
    }

    this._poiGroup.clear();
    this._app._sceneComment.remove(this._poiGroup);
    this._app._measureLayer.clearDrawFeature();
}

/**
 * 선택 취소하는 함수
 *
 * @param {boolean} [isCheckIdle=false] 분할(mesh division(*u3f model 한정)) 상태 점검/정리 호출 여부
 *
 */
/// <summary>선택 강조와 보관 참조를 비우고 앱이 살아 있을 때만 그리기 갱신을 요청합니다.</summary>
/// <param name="isCheckIdle">boolean 입력이며 기본값 false입니다. true이면 살아 있는 U3F 레이어의 분할 메시 정리도 요청합니다.</param>
U3dSelect.prototype.clearSelect = function (isCheckIdle = false) {
    this.clearHover();
    for (var key in this._selected) {
        removeSelectedByKey.call(this, key, isCheckIdle);
    }
    this._selected = {};
    this._ringEffector?.dispose();
    this._ringEffector = undefined;
    this._manualSelects = [];
    this._posList = [];
    if (isSelectAppAvailable(this)) this._drawArg?.setUpdateDate();
};

/**
 * 선택된 객체를 반환하는 함수
 *
 * @returns {Array<USelect>} 선택된 Mesh 객체 리스트
 */
U3dSelect.prototype.getSelected = function () {
    return Object.values(this._selected);
};

/**
 * 선택된 객체 키 목록을 반환하는 함수
 *
 * @returns {Array<string>} 선택 키 배열. 키는 `레이어이름^객체id` 형식이며 `getSelectedAsKey()`에 넘겨 객체를 얻을 수 있다
 */
U3dSelect.prototype.getSelectedKey = function () {
    return Object.keys(this._selected);
};

/**
 * 키로 선택 객체를 조회하는 함수
 *
 * @param {string} key 선택 키(`레이어이름^객체id`, `getSelectedKey()`나 `getObjectKey()`로 얻는 값)
 * @returns {USelect|undefined} 그 키로 선택된 객체. 선택되어 있지 않으면 undefined
 */
U3dSelect.prototype.getSelectedAsKey = function (key) {
    return this._selected[key]
};

/**
 * 키로 선택 객체를 직접 설정하는 함수 <br>
 * 일반적으로는 `addSelected`/`removeSelected` 사용을 권장합니다.
 *
 * @param {string} key 선택 키(`레이어이름^객체id`). 기존 키면 값을 덮어쓴다
 * @param {USelect} select 그 키로 등록할 객체. 하이라이트나 이벤트는 발생시키지 않고 목록에만 넣는다
 *
 */
U3dSelect.prototype.setSelectedAsKey = function (key, select) {
    this._selected[key] = select;
};

/**
 * 객체로부터 내부 선택 키를 생성하여 반환하는 함수
 *
 * @param {USelect} object 대상 객체
 * @returns {string|void} 선택 키(생성 실패 시 반환 없음)
 */
U3dSelect.prototype.getObjectKey = function (object) {
    let key = makeObjectKey(object);
    if (defined(key)) {
        return key;
    }
}

/**
 * 선택영역 형상 스타일 변경 함수 <br>
 * AREA/LINE/CIRCLE 모드에서 그려지는 도형의 외곽선·채움 스타일을 바꿉니다. <br>
 * 앱이 연결되기 전이거나 `opt`가 없으면 아무 것도 하지 않습니다.
 *
 * @param {SelectorColorOption} [opt] 바꿀 스타일. 생략한 항목은 측정 레이어 기본값을 유지한다
 */
U3dSelect.prototype.setSelectorColor = function (opt) {
    let self = this;
    if (!defined(self._selectLayer) || !defined(opt)) {
        return;
    }
    const selectorOpt = /** @type {SelectorColorOption|undefined} */ (opt);
    let option = {
        fill: {
            color: (defined(selectorOpt?.fill) && defined(selectorOpt.fill.color)) ? selectorOpt.fill.color : self._selectLayer._defaultFillColor
        },
        stroke: {
            color: (defined(selectorOpt?.stroke) && defined(selectorOpt.stroke.color)) ? selectorOpt.stroke.color : self._selectLayer._defaultStrokeColor,
            width: (defined(selectorOpt?.stroke) && defined(selectorOpt.stroke.width)) ? selectorOpt.stroke.width : self._selectLayer._defaultStrokeWidth
        }
    };
    self._selectLayer.setStyle(option);
};

/**
 * 선택 영역 형상 스타일 초기화 함수 <br>
 * `setSelectorColor()`로 바꾼 영역 선택 도형의 외곽선·채움 스타일을 측정 레이어 기본값으로 되돌립니다. <br>
 * `setApp()`으로 앱이 연결되기 전에는 아무 것도 하지 않습니다.
 */
U3dSelect.prototype.resetSelectorColor = function () {
    let self = this;
    if (!defined(self._selectLayer)) {
        return;
    }
    self._selectLayer.resetStyle();
}

/**
 * 선택 객체 출력 색 변경 함수 <br>
 * 현재 선택된 객체 전체와 수직 보조 객체에 즉시 적용되고, 이후 선택되는 객체에도 같은 색이 쓰입니다. <br>
 * 링은 색상 0(검정)과 투명도 0을 지원합니다. 기존 타입은 falsy 값이면 이전 값을 유지합니다.
 *
 * @param {import('three').ColorRepresentation} color 변경색(three.js가 받는 색 표현: 16진수 숫자, CSS 문자열, `Color` 객체)
 * @param {number} opacity 투명도 (0 ~1, 1이 불투명)
 */
U3dSelect.prototype.setSelectedColor = function (color, opacity) {
    let self = this;
    if (!defined(self._selected) ) return;

    const isRing = self.getSelectType() === UDEF.SELECT_TYPE.RING;
    self._selectColor = (isRing ? defined(color) : color) ? color : self._selectColor;
    self._selectOpacity = (isRing ? defined(opacity) : opacity) ? opacity : self._selectOpacity;
    self._selectOpacity = Number(self._selectOpacity);
    let models = Object.values(self._selected);
    for (let model of models) {
        if (model.isMerged) {
            setSelectedStyle.call(self, model, self._selectColor, self._selectOpacity, 'color');
        }
        if (self.getSelectType() === UDEF.SELECT_TYPE.RING) {
            self.setRing(model);
        } else if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE){
            self.setOutline(model);
        }else if(self.getSelectType() === UDEF.SELECT_TYPE.COLOR){
            self.setColor(model, self._selectColor, self._selectOpacity, model._intersect);
        }
        if(model.userData && model.userData.verticalObjects){
            const verticalObject = model.userData.verticalObjects.get(self);
            if(verticalObject){
                const verticalMesh = verticalObject.userData.verticalMesh;
                const planeMesh = verticalObject.userData.planeMesh;
                if(verticalMesh && verticalMesh.material){
                    verticalMesh.material.uniforms?.uColor?.value.set(color)
                }
                if(planeMesh && planeMesh.material){
                    planeMesh.material.uniforms?.uColor?.value.set(color)
                }
            }
        }

    }
    self._app?.updateData();
}

/**
 * 선택 객체 출력 색 초기화 함수
 */
U3dSelect.prototype.resetSelectedColor = function () {
    let self = this;
    if (self.getSelectType() === UDEF.SELECT_TYPE.RING) {
        self.setSelectedColor(self._oriSelectColor, self._oriSelectOpacity);
        return;
    }
    self._selectColor = self._oriSelectColor;
    let models = Object.values(self._selected);
    for (let model of models) {
        if (getColorTarget(model, model._intersect).userData?.type === 'trailMesh') {
            self.setColor(model, self._oriSelectColor, self._oriSelectOpacity, model._intersect);
            continue;
        }
        if (Array.isArray(model.material)) {
            for (let material of model.material) {
                material.color.set(self._oriSelectColor);
                material.opacity = self._oriSelectOpacity;
                material.needsUpdate = true;
            }
        } else {
            model.material.color.set(self._oriSelectColor);
            model.material.opacity = self._oriSelectOpacity;
            model.material.needsUpdate = true;
        }
    }
    self._app.updateData();
}

/**
 * 선택 객체 전체의 하이라이트를 제거하는 함수 <br>
 * 강조 방식에 따라 외곽선·링을 없애거나 재질을 원래 색·텍스처로 되돌립니다. <br>
 * 선택 목록은 그대로 두므로 `getSelected()`는 같은 객체를 계속 반환합니다.
 */
U3dSelect.prototype.clearHighlights = function () {
    let self = this;
    if (self.getSelectType() === UDEF.SELECT_TYPE.RING) {
        self._ringEffector?.dispose();
        self._ringEffector = undefined;
        self._app.updateData();
        return;
    }
    let models = Object.values(self._selected);
    models.forEach((/** @type {any} */ model) => {
        if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE) {
            if (self._effector) {
                self._effector.removeBarrier(model, false);
            }
            self.setTexture(model, false);
        }else{
            const colorTarget = getColorTarget(model, model._intersect);
            if ('restoreMaterial' in colorTarget && typeof colorTarget.restoreMaterial === 'function')
                colorTarget.restoreMaterial();
            else if (hasTraverse(colorTarget)) {
                /** @type {any} */(colorTarget).traverse(function (/** @type {any} */ mesh) {
                    if (mesh instanceof THREE.Mesh || mesh instanceof U3dGeometry)
                        restoreMaterial(mesh);
                });
            }
        }
    })

    self._app.updateData();
}

/**
 * 이벤트리스너 등록함수
 *
 * @override
 *
 * @param {string} type 이벤트 종류. 이 클래스가 dispatch하는 `U3dSelect.EVENT`의 값(`start`/`change`/`end`)과 BOX 모드의 `pointerdown`/`pointermove`/`pointerup`
 * @param {EventCallBack} listener 이벤트 발생 시 `{type, data, work}` payload를 받는 콜백
 * @returns {string | null} 등록된 리스너 식별자. `off(type, id)`로 제거할 때 사용하며, 등록에 실패하면 null
 */
U3dSelect.prototype.on = function (type, listener) {
    // this.on(type, listener)
    return UEventDispatcher.prototype.on.call(this, type, listener);
};

/**
 * 이벤트리스너 제거 함수
 *
 * @override
 *
 * @param {string} [type] 이벤트 종류. 이 클래스가 dispatch하는 `U3dSelect.EVENT`의 값(`start`/`change`/`end`)과 BOX 모드의 `pointerdown`/`pointermove`/`pointerup` <br>
 * 생략하면 이 객체에 등록된 모든 종류의 리스너를 제거합니다.
 * @param {function | string} [listener] 제거할 콜백 함수(`on`에 넘긴 함수 자체) 또는 `on()`이 반환한 리스너 식별자 <br>
 * 생략하면 그 종류에 등록된 리스너를 모두 제거합니다.
 */
U3dSelect.prototype.off = function (type, listener) {
    // this.off.removeEventListener(type, listener)
    UEventDispatcher.prototype.off.call(this, type, listener);
};

/**
 * 해당 모델의 선택을 취소하는 기능
 * 링은 이동 전 저장한 선택 키를 객체 참조로 찾아 해제합니다.
 *
 * @param {USelect} object 모델객체
 */
/// <summary>한 대상의 선택과 자체 강조를 해제하고 살아 있는 앱의 그리기만 갱신합니다.</summary>
/// <param name="object">호출자가 소유한 USelect 참조입니다. 선택만 해제하며 형상·재질의 소유권을 이전하지 않습니다.</param>
U3dSelect.prototype.removeSelected = function (object) {
    this.clearHover(object);
    const ringEntry = this.getSelectType() === UDEF.SELECT_TYPE.RING
        ? Object.entries(this._selected).find(
            /// <summary>링 선택에 보관한 원본 대상 참조를 비교합니다.</summary>
            /// <param name="entry">[string, USelect] 입력이며 선택 키와 대상 참조의 쌍입니다. 읽기 전용입니다.</param>
            entry => entry[1] === object) : undefined;
    if (ringEntry) {
        removeSelectedByKey.call(this, ringEntry[0]);
    } else if (isSelected.call(this, object)) {
        var key = makeObjectKey(object);
        removeSelectedByKey.call(this, key);
    }
    if (isSelectAppAvailable(this)) this._drawArg?.setUpdateDate();
};

/**
 * 내부 click 이벤트 등록 키를 반환하는 함수
 *
 * @returns {string|undefined} click listener key
 */
U3dSelect.prototype.getClickId = function () {
    return this._clickId;
}

/**
 * 내부 dblclick 이벤트 등록 키를 반환하는 함수
 *
 * @returns {string|undefined} dblclick listener key
 */
U3dSelect.prototype.getDbClickId = function () {
    return this._dblClickId;
}

/**
 * 해당 모델을 선택하는 기능 <br>
 * 선택 목록에 넣고 현재 강조 방식(outline/color)으로 표시하며, 배열을 넘기면 각 원소를 차례로 선택합니다. <br>
 * `USelect`가 아닌 값과 공유 메시(`USharedMesh`)는 조용히 무시됩니다. <br>
 * 이벤트는 발생시키지 않습니다.
 *
 * @param {USelect | Array<USelect>} object 선택할 객체 또는 객체 배열
 * @param {U3dIntersectLike} [intersect] picking 결과. 병합 메시의 부분(`faceIndex`)이나 인스턴스(`instanceId`)만 강조할 때 전달
 * @returns {Promise<void>} 선택 처리가 끝나면 이행되는 Promise. 내부 선택 목록이 없는 비정상 상태에서만 거부된다
 */
/// <summary>살아 있는 앱에서만 대상을 강조합니다. 종료된 앱의 지연 요청은 자원을 조회하지 않고 정상 종결합니다.</summary>
/// <param name="object">호출자가 소유한 USelect 또는 USelect 배열 입력이며 형상·재질의 소유권은 이전하지 않습니다.</param>
/// <param name="intersect">선택 부분을 지정하는 U3dIntersectLike 입력입니다. 생략 가능하며 입력을 변경하지 않습니다.</param>
U3dSelect.prototype.addSelected = function (object, intersect) {
    if (!isSelectAppAvailable(this)) return Promise.resolve();
    this.clearHover(object);
    /** @type {DeferredObject<void>} */
    let promise = deferred();
    if ((object instanceof UGroup || object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points || object instanceof U3dGeometry || object instanceof U3dComponentPosition || object instanceof U3DTilesMesh) && !(object instanceof USharedMesh)) {
        addSelected_.call(this, /** @type {USelect} */ (object), intersect, true);
    } else if (Array.isArray(object)) {
        for (let i = 0; i < object.length; i++) {
            const data = object[i];
            this.addSelected(data, intersect);
        }
    }
    if (defined(this._selected))
        promise.resolve();
    else
        promise.reject();

    /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg).setUpdateDate();
    return promise;
};

/**
 * @param {any} mesh
 * @returns {boolean}
 */
function isValidComponentModelType(mesh) {
    return !!(mesh instanceof THREE.InstancedMesh || mesh instanceof THREE.BatchedMesh || mesh.isInstancedMesh || mesh.type === 'component'
        || mesh.userData?.type === 'trailMesh');
}

/**
 * @param {any} poiGroup
 */
function pointDispose(poiGroup) {
    if (!defined(poiGroup))
        return;

    if (!(poiGroup instanceof UGroup))
        return;

    if (poiGroup.children.length === 0)
        return;

    if (poiGroup.children.length > 0) {
        poiGroup.children.forEach(function (/** @type {any} */ child) {
            if (child.children.length > 0) {
                child.children.forEach(function (/** @type {any} */ obj) {
                    if (defined(obj.geometry) && defined(obj.geometry.dispose))
                        obj.geometry.dispose();
                    if (defined(obj.material) && defined(obj.material.dispose)) {
                        if (defined(obj.material.map))
                            obj.material.map.dispose();
                        obj.material.dispose();
                    }
                    if (defined(obj.dispose))
                        obj.dispose();
                })
            }
            if (defined(child.geometry) && defined(child.geometry.dispose))
                child.geometry.dispose();
            if (defined(child.material) && defined(child.material.dispose)) {
                if (defined(child.material.map))
                    child.material.map.dispose();
                child.material.dispose();
            }
            if (defined(child.dispose))
                child.dispose();
        })
    }
}

/**
 * @this {U3dSelect}
 */
function dispose() {
    var self = this;
    self.style = undefined;
    self._selected = {};
    self._reset = {};
    self._measureGeom = undefined;
    if(self._effector) self._effector.dispose();
    self._ringEffector?.dispose();
    self._ringEffector = undefined;
}

/**
 * @this {U3dSelect}
 */
function clearMeasureFeature() {
    var self = this;
    commitFeature.call(this);
    if (defined(self._measureFeature)) {
        // self._selectLayer.removeFeature(self._measureFeature);
        self._app.removeMeasureFeature(this._measureFeature);
        self._measureFeature = undefined;
    }
}

/**
 * @this {U3dSelect}
 */
function commitFeature() {
    // this._poi = undefined;
    var feature = this._app.commitMeasurePoint();
    if (defined(feature)) {
        this._measureFeature = feature;
    }
}

/**
 * 대상을 등록하고 강조합니다. 이동한 링 대상은 기존 선택을 재사용합니다.
 * @this {U3dSelect}
 * @param {USelect} object
 * @param {U3dIntersectLike} [intersect]
 * @param {boolean} [isChangeStyle=true]
 *
 * @ignore
 */
function addSelected_(object, intersect, isChangeStyle = true) {
    const self = this;
    if(!defined(object)) return;
    if (self.getSelectType() === UDEF.SELECT_TYPE.RING && Object.values(self._selected).includes(object)) {
        if (isChangeStyle) self.setRing(object);
        return;
    }

    const layerName = searchLayerName(object);
    const id = makeId(object);

    let result;
    if (self._app.getLayer(layerName)) {
        result = addSelectedOnLayer.call(this, object, layerName, id, intersect);
    } else {
        result = addSelectedNotLayer_.call(this, object, id);
    }

    if (defined(result)) {
        if(isChangeStyle) {
            if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE){
                self.setOutline(result);
            }else if(self.getSelectType() === UDEF.SELECT_TYPE.COLOR){
                self.setColor(result, this._selectColor, this._selectOpacity, intersect);
            }else if (self.getSelectType() === UDEF.SELECT_TYPE.RING) {
                self.setRing(result);
            }
            self.setTexture(result, this.exceptTexture);

            if(self._setVerticalObject){
                self._verticalObjects = self._verticalObjects || {};
                const key = layerName + '^' + id;
                self._verticalObjects[key] = self.createVerticalObject(result);
            }
        }

        result._intersect = intersect;
    }
}


/**
 * @this {U3dSelect}
 * @param {any} object
 * @param {string} layerName
 * @param {string} id
 * @param {any} intersect
 * @returns {any}
 */
function addSelectedOnLayer(object, layerName, id, intersect) {
    const self = this;
    const layer = /**@type{import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer}*/ (self._app.getLayer(layerName));

    if (!defined(layer)) {
        throw new Error('[' + layerName + '] 레이어가 없습니다.');
    }

    const key = layerName + '^' + id;
    if (defined(object)) {
        if (!defined(self._selected[key])) {
            self._selected[key] = object;

            if (defined(object.getBBox) && defined(object.getBBox())) {
                let eventName = object.getUid ? object.getUid() : object.id;

                let color = self._selectColor;
                let opacity = self._selectOpacity;
                if(!self._auto){
                    color = object.getColor();
                    opacity = object.getOpacity();
                }

                // 객체가 병합된 상태인지 확인
                if (object.isMerged && !object.isMerged()) {
                    eventName = handleMergedObject.call(self, object, layer, color, opacity, eventName);
                } else if (object.isMerged && object.isMerged() && Array.isArray(object.material)) {
                    handleMaterialSplit.call(self, object, layer, color, opacity, intersect);
                }

                // 객체 로드 이벤트 처리
                handleLoadEvent.call(self, object, layer, key, eventName, intersect);
            }
            return object;
        }
    } else {
        self._selected[key] = true;
    }
}

/**
 * @this {U3dSelect}
 * @param {any} object
 * @param {import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer} layer
 * @param {import('three').ColorRepresentation} color
 * @param {number} opacity
 * @param {string} eventName
 * @returns {string} eventName
 */
function handleMergedObject( object, layer, color, opacity, eventName) {
    const self = this;
    const meshId = object.getUid();
    const editInfo = getEditedEventInfo(layer, meshId);

    if (defined(editInfo) && editInfo.editData) {
        const mergedId = editInfo.editData['split'];
        if (defined(mergedId) && layer instanceof U3dModelU3FLayer) {
            eventName = mergedId;
            if (!Array.isArray(object.material) || object.children.length > 0) {
                const key = object._tile._key;
                const pickColor = color instanceof THREE.Color ? color.getHex() : color;
                const meshList = layer.setPickMaterial(key, pickColor, opacity, meshId, self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE || self.getSelectType() === UDEF.SELECT_TYPE.RING);
                if(meshList && meshList.length > 0){
                    for (let i = 0; i < meshList.length; i++) {
                        const mesh = meshList[i];
                        getPickMaterial.call(self, layer, mesh);
                        if(self._auto) {
                            if (self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE)
                                self.setOutline(/** @type {USelect} */ (mesh));
                        }
                    }
                }
            }
            editInfo.isSetColor = self.getSelectType() === UDEF.SELECT_TYPE.COLOR;
            editInfo.color = color;
            editInfo.opacity = opacity;
            editInfo.exceptTexture = self.exceptTexture;
            return eventName;
        }
    }
    return eventName;
}
/**
 * @this {U3dSelect}
 * @param {any} object
 * @param {any} layer
 * @param {import('three').ColorRepresentation} color
 * @param {number} opacity
 * @param {any} intersect
 *
 */
function handleMaterialSplit(object, layer, color, opacity, intersect) {
    const self = this;
    const materialSplitInfo = layer.getMaterialIndexByFace(object, intersect.faceIndex);
    if (materialSplitInfo) {
        const id = materialSplitInfo.childId;
        const editInfo = getEditedEventInfo(layer, id);
        if (!layer.editFilter(id)) {
            layer.editedList.push(id);
        }
        if (editInfo) {
            editInfo.isSetColor = self.getSelectType() === UDEF.SELECT_TYPE.COLOR;
            editInfo.color = color;
            editInfo.opacity = opacity;
        } else {
            layer.editedEvent[id] = {
                isSetColor: self.getSelectType() === UDEF.SELECT_TYPE.COLOR,
                color: color,
                opacity: opacity,
                exceptTexture:self.exceptTexture
            };
        }
    }
}
/**
 * @this {U3dSelect}
 * @param {any} object
 * @param {any} layer
 * @param {string} key
 * @param {string} eventName
 * @param {any} intersect
 *
 */
function handleLoadEvent(object, layer, key, eventName, intersect) {
    const self = this;
    /** @type {any} */
    let loadCallback = function (/** @type {any} */ event) {
        let loadObject = event.data;
        let isParent = false;
        let isSet = true;
        // 병합된 객체의 하위객체들 정보 업데이트
        if (loadObject.isMerged && loadObject.isMerged()) {
            isSet = checkMergeAndSetColor.call(self, loadObject, layer, eventName, key, isParent);
            if(intersect)
                delete intersect.faceIndex
        }

        if (!defined(loadObject) || !isSet) {
            return;
        }

        let loadKey = makeObjectKey(loadObject);
        if (self._selected[loadKey] || isParent) {
            const modelId = loadObject.getUid();
            if (isSelected.call(self, loadObject) || isParent) {
                if (!defined(self._reset[loadKey]) || !self._reset[loadKey]) {
                    if (!loadObject.material) {
                        loadObject = layer.getModelById(modelId);
                        getPickMaterial(layer, loadObject);
                    }
                    if(self._auto){
                        if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE)
                            self.setOutline(loadObject);
                        else if (self.getSelectType() === UDEF.SELECT_TYPE.COLOR) {
                            self.setColor(loadObject, self._selectColor, self._selectOpacity, intersect);
                        }else if (self.getSelectType() === UDEF.SELECT_TYPE.RING) {
                            self.setRing(loadObject);
                        }
                        self.setTexture(loadObject, self.exceptTexture);
                    }
                }
                if (!isParent) {
                    self._selected[loadKey] = loadObject;
                    loadCallback._isDivided = false;
                    delete loadCallback._isDivided;
                }
            } else {
                layer.off(U3dEvent.MESH.LOADED, loadCallback);
            }
        }
    }

    // 이미 이벤트 리스너가 등록된 경우 재사용
    let funcIdx = findEventListenerIndex(layer, eventName);
    if (funcIdx === -1) {
        layer.addEventListener(U3dEvent.MESH.LOADED, loadCallback, false, eventName);
        self._loadedListeners[key] = loadCallback;
    } else {
        self._loadedListeners[key] = layer._listeners[U3dEvent.MESH.LOADED][funcIdx];
    }
}

/**
 * @this {U3dSelect}
 * @param {any} loadObject
 * @param {any} layer
 * @param {string} eventName
 * @param {string} key
 * @param {any} isParent
 * @returns {any}
 */
function checkMergeAndSetColor( loadObject, layer, eventName, key, isParent) {
    const self = this;
    if (!layer._listeners || !layer._listeners[U3dEvent.MESH.LOADED]) {
        return;
    }

    const modelID = loadObject.getUid();
    let childIdList = [];

    // 병합된 객체에 대한 처리
    const editInfo = getEditedEventInfo(layer, modelID);
    if (editInfo) {
        childIdList = getChildIdList(layer, editInfo);
        isParent = isParentObject(editInfo, modelID, isParent);
    }

    // 병합된 객체가 부모 객체인지 확인하고 관련 이벤트 처리
    const loadEvents = layer._listeners[U3dEvent.MESH.LOADED];
    const loadFunc = findLoadEvent(loadEvents, modelID, childIdList, isParent);

    // 관련 이벤트가 있거나 이벤트 대상의 부모객체 일 경우 병합된 객체의 색상 설정 및 편집 정보 업데이트
    if (isMergeAndSetColorRequired(loadFunc, layer, isParent)) {
        return processMergedMesh.call(self, loadObject, layer, loadFunc, eventName, key);
    }
    return true;
}

/**
 * @param {any} layer
 * @param {string} modelID
 * @returns {any}
 */
function getEditedEventInfo(layer, modelID) {
    if (layer.getEditedEventById) {
        return layer.getEditedEventById(modelID);
    }
    return null;
}


/**
 * @param {any} layer
 * @param {any} editInfo
 * @returns {Array<any>}
 */
function getChildIdList(layer, editInfo) {
    /** @type {Array<any>} */
    const childIdList = [];
    const data = editInfo.editData;
    const materialSplit = data['materialSplit'];

    if (materialSplit) {
        materialSplit.forEach((/** @type {any} */ value) => {
            let childId = value.childId;
            const childEditInfo = getEditedEventInfo(layer, childId);
            if (defined(childEditInfo) && childEditInfo.editData) {
                if (childEditInfo.editData['split']) {
                    childId = childEditInfo.editData['split'];
                }
            }
            childIdList.push(childId);
        });
    }
    return childIdList;
}

/**
 * @param {any} editInfo
 * @param {any} modelID
 * @param {any} isParent
 * @returns {any}
 */
function isParentObject(editInfo, modelID, isParent) {
    const data = editInfo.editData;
    const materialColor = data['materialColor'];

    if (materialColor && (materialColor.id === modelID)) {
        isParent = true;
    }

    return isParent;
}
/**
 * @param {any} loadFunc
 * @param {any} layer
 * @param {any} isParent
 * @returns {boolean}
 */
function isMergeAndSetColorRequired(loadFunc, layer, isParent) {
    return (loadFunc > -1 && defined(layer.mergedMeshDivision)) || isParent;
}

/**
 * @this {U3dSelect}
 * @param {any} loadObject
 * @param {any} layer
 * @param {any} loadFunc
 * @param {string} eventName
 * @param {string} key
 * @returns {any}
 */
function processMergedMesh(loadObject, layer, loadFunc, eventName, key) {
    const self = this;
    const loadEvents = layer._listeners[U3dEvent.MESH.LOADED];

    if (loadEvents[loadFunc] && (!defined(loadEvents[loadFunc]._isDivided) || !loadEvents[loadFunc]._isDivided)) {
        if (Array.isArray(loadObject.material) && loadObject.material.length > 0) {
            const isSet = getPickMaterial(layer, loadObject);
            if (!isSet) return isSet;
        } else {
            loadEvents[loadFunc]._isDivided = true;
            const resultMesh = layer.mergedMeshDivision(loadObject);
            if (defined(resultMesh) && resultMesh.length > 0) {
                const resultIndex = resultMesh.findIndex((/** @type {any} */ mesh) => mesh.getUid() === eventName);
                if (defined(resultIndex) && resultMesh[resultIndex]) {
                    loadObject = resultMesh[resultIndex];

                    const event = getEditedEventInfo(layer, loadObject.getUid());
                    if (event) {
                        let color = self._selectColor;
                        let opacity = self._selectOpacity;
                        if(!self._auto){
                            color = loadObject.material.color;
                            opacity = loadObject.material.opacity;
                        }
                        event.isSetColor = self.getSelectType() === UDEF.SELECT_TYPE.COLOR;
                        event.color = color;
                        event.opacity = opacity;
                        event.exceptTexture = self.exceptTexture;
                    }

                    // 이전 선택된 객체를 숨기고 메모리에서 해제
                    if (defined(self._selected[key]) && key === makeObjectKey(loadObject)) {
                        self._selected[key].visible = false;
                        self._selected[key].dispose();
                    }
                }
            }
        }
    }
    return true;
}


/**
 * @param {Array<any>} loadEvents
 * @param {string} modelID
 * @param {Array<any>} childIdList
 * @param {boolean} isParent
 * @returns {number}
 */
function findLoadEvent(loadEvents, modelID, childIdList, isParent) {
    return loadEvents.findIndex((/** @type {any} */ func) => {
        if (childIdList.includes(func._name)) {
            isParent = true;
            return true;
        }
        return func._name === modelID;
    });
}

/**
 * @param {any} layer
 * @param {string} eventName
 * @returns {number}
 */
function findEventListenerIndex(layer, eventName) {
    // 이벤트를 한 번도 등록하지 않은 레이어는 _listeners 자체가 없으므로 먼저 확인한다.
    // (UEventDispatcher는 첫 addEventListener 시점에 _listeners를 만든다.)
    const loadEvents = layer._listeners?.[U3dEvent.MESH.LOADED];
    if (loadEvents && loadEvents.length > 0) {
        return loadEvents.findIndex(function (/** @type {any} */ event) {
            return event._name === eventName;
        });
    }
    return -1;
}

/**
 * @this {U3dSelect}
 * @param {any} object
 * @param {string} id
 * @returns {any}
 */
function addSelectedNotLayer_(object, id) {
    var key = object._ulayername + '^' + id;
    if (defined(object)) {
        if (!defined(this._selected[key])) {
            this._selected[key] = object;
            return object;
        }
    } else {
        this._selected[key] = true;
    }
}

/**
 * @param {any} mesh
 *
 */
function restoreMaterial(mesh) {
    if (!mesh) return;
    setObjectPolygonOffset(mesh, false);
    if (defined(mesh.material)) {
        if (!Array.isArray(mesh.material)) {
            if (mesh.material.isShaderMaterial) {
                let uniforms = mesh.material.uniforms;
                restoreHighlightUniforms(uniforms);
                if (uniforms && defined(uniforms._oriColor)) {
                    let color = uniforms._oriColor;
                    if (mesh.setColor)
                        mesh.setColor(color);
                    else {
                        uniforms.color.value = color
                    }
                    uniforms._oriColor = undefined;
                    delete uniforms._oriColor;
                }

                if (uniforms && defined(uniforms._oriOpacity)) {
                    let opacity = uniforms._oriOpacity;
                    if (mesh.setOpacity)
                        mesh.setOpacity(opacity);
                    else {
                        uniforms.opacity.value = opacity
                    }
                    uniforms._oriOpacity = undefined;
                    delete uniforms._oriOpacity;
                }


                if (uniforms && defined(uniforms._oriColorGradation)) {
                    let colorGradation = uniforms._oriColorGradation;

                    if(uniforms.colorGradation) {
                        uniforms.colorGradation.value = colorGradation;
                    }
                     uniforms._oriColorGradation = undefined;
                    delete uniforms._oriColorGradation;
                }
            } else {
                if (defined(mesh.material._oriColor)) {
                    mesh.material.color = new THREE.Color(mesh.material._oriColor);
                    mesh.material._oriColor = undefined;
                    delete mesh.material._oriColor;
                }

                if (defined(mesh.material._oriOpacity)) {
                    mesh.material.opacity = mesh.material._oriOpacity;
                    mesh.material.transparent = mesh.material.opacity < 1;
                    mesh.material._oriOpacity = undefined;
                    delete mesh.material._oriOpacity;
                }
            }

            if (defined(mesh.material._oriMap)) {
                mesh.material.map = mesh.material._oriMap;
                mesh.material._oriMap = undefined;
                delete mesh.material._oriMap;
                mesh.material.needsUpdate = true;
            }
            if (defined(mesh.material._oriNormalMap)) {
                mesh.material.normalMap = mesh.material._oriNormalMap;
                mesh.material._oriNormalMap = undefined;
                delete mesh.material._oriNormalMap;
                mesh.material.needsUpdate = true;
            }

            mesh.material.needsUpdate = true;
        } else {
            for (let i = 0; i < mesh.material.length; i++) {
                let material = mesh.material[i];

                if (material.isShaderMaterial) {
                    let uniforms = material.uniforms;
                    restoreHighlightUniforms(uniforms);
                    if (uniforms && defined(uniforms._oriColor)) {
                        let color = uniforms._oriColor;
                        if (mesh.setColor)
                            mesh.setColor(color);
                        else {
                            uniforms.color.value = color
                        }
                        uniforms._oriColor = undefined;
                        delete uniforms._oriColor;
                    }

                    if (uniforms && defined(uniforms._oriOpacity)) {
                        let opacity = uniforms._oriOpacity;
                        if (mesh.setOpacity)
                            mesh.setOpacity(opacity);
                        else {
                            uniforms.opacity.value = opacity
                        }
                        uniforms._oriOpacity = undefined;
                        delete uniforms._oriOpacity;
                    }
                } else {
                    if (defined(material._oriColor)) {
                        material.color = new THREE.Color(material._oriColor);
                        material._oriColor = undefined;
                        delete material._oriColor
                    }

                    if (defined(material._oriOpacity)) {
                        material.opacity = material._oriOpacity;
                        material.transparent = material.opacity < 1;
                        material._oriOpacity = undefined;
                        delete material._oriOpacity;
                    }
                }
                if (defined(material._oriMap)) {
                    material.map = material._oriMap;
                    material._oriMap = undefined;
                    delete material._oriMap;
                    material.needsUpdate = true;
                }
                if (defined(material._oriNormalMap)) {
                    material.normalMap = material._oriNormalMap;
                    material._oriNormalMap = undefined;
                    delete material._oriNormalMap;
                    material.needsUpdate = true;
                }
                material.needsUpdate = true;
            }
        }
    }
}

/**
 * @this {U3dSelect}
 * @param {string} key
 * @param {boolean} [isCheckIdle=false]
 */
/// <summary>대상의 강조·선택 참조를 정리합니다. 앱 종료 후에는 레이어를 다시 찾지 않으며 남은 이벤트 참조를 제거합니다.</summary>
/// <param name="key">레이어명과 객체 ID로 구성한 string 선택 키이며 입력을 변경하지 않습니다.</param>
/// <param name="isCheckIdle">boolean 입력이며 기본값 false입니다. true일 때 살아 있는 레이어의 분할 메시 정리를 요청합니다.</param>
function removeSelectedByKey(key, isCheckIdle = false) {
    let self = this;
    self._ringEffector?.remove(key);
    let selected = self._selected[key];
    if (!defined(selected)) {
        return;
    }
    const colorTarget = getColorTarget(selected, selected._intersect);

    if (defined(selected._intersect)) {
        delete selected._intersect;
    }

    if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE){
        // u3f 분할 재질 인덱스가 정리되기 전에 원본 텍스처를 복원한다.
        self.setTexture(selected, false);
    }

    if (isSelectAppAvailable(self)) selected = releaseSelectedLayer.call(self, key, selected, isCheckIdle);

    // 레이어가 이미 제거됐어도 선택기가 보관한 콜백 참조는 남기지 않습니다.
    delete self._loadedListeners[key];

    if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE){
        if(self._effector){
            self._effector.removeBarrier(selected, false);
        }
    }else if(self.getSelectType() === UDEF.SELECT_TYPE.COLOR){
        if ('restoreMaterial' in colorTarget && typeof colorTarget.restoreMaterial === 'function')
            colorTarget.restoreMaterial();
        else if (hasTraverse(colorTarget)) {
            /** @type {any} */(colorTarget).traverse(
                /// <summary>선택기에 빌려준 메시의 임시 재질 설정을 복원합니다.</summary>
                /// <param name="mesh">호출자 소유 Object3D 입력이며 자원 자체를 해제하지 않습니다.</param>
                function (/** @type {any} */ mesh) {
                if (mesh instanceof THREE.Mesh || mesh instanceof THREE.Line || mesh instanceof THREE.Points || mesh instanceof U3dGeometry) {
                    restoreMaterial(mesh);
                }
            });
        }
    }

    if(self._setVerticalObject){
        self.removeVerticalObject(key, selected);
    }

    self._selected[key] = undefined;
    delete self._selected[key];
}

/**
 * 선택 표시에서 텍스쳐를 제외/복원하는 함수
 *
 * @param {USelect} model 대상 모델(UMesh/THREE.Mesh 등)
 * @param {boolean} exceptTexture true면 텍스쳐를 제외, false면 복원
 */
U3dSelect.prototype.setTexture = function (model, exceptTexture) {
    const self = this;
    if (!defined(model)) {
        return;
    }

    if (hasExceptTexture(model)) {
        /** @type {any} */ (model).exceptTexture(exceptTexture);
       return;
    }

    if (!hasTraverse(model)) return;
    /** @type {any} */ (model).traverse(function (/** @type {any} */ mesh) {
        if (mesh instanceof THREE.Mesh || mesh instanceof U3dGeometry) {
            const pickableMesh = /** @type {any} */ (mesh);
            if (exceptTexture) {
                if (defined(mesh.material)) {
                    if (mesh instanceof U3DTilesMesh && !mesh.isBIM()) {
                        U3dMessage.info('U3dSelect', '3DTiles models do not support texture exception.');
                        return;
                    }
                    if (Array.isArray(mesh.material)) {
                        for (let i = 0; i < mesh.material.length; i++) {
                            if (defined(pickableMesh._pickMaterials) && !pickableMesh._pickMaterials.includes(i)) continue;
                            if (defined(mesh.material[i].map)) {
                                if (!defined(mesh.material[i]._oriMap))
                                    mesh.material[i]._oriMap = mesh.material[i].map;
                                mesh.material[i].map = undefined;

                            }
                            if (defined(mesh.material[i].normalMap)) {
                                if (!defined(mesh.material[i]._oriNormalMap))
                                    mesh.material[i]._oriNormalMap = mesh.material[i].normalMap;
                                mesh.material[i].normalMap = undefined;
                            }
                            mesh.material[i].needsUpdate = true;
                            mesh.material[i]._exceptTexture = exceptTexture;
                        }
                    } else {
                        if (defined(mesh.material.normalMap)) {
                            if (!defined(mesh.material._oriNormalMap))
                                mesh.material._oriNormalMap = mesh.material.normalMap;
                            mesh.material.normalMap = undefined;
                            mesh.material.needsUpdate = true;
                        }
                        if (defined(mesh.material.map)) {
                            if (!defined(mesh.material._oriMap))
                                mesh.material._oriMap = mesh.material.map;
                            mesh.material.map = undefined;
                            mesh.material.needsUpdate = true;
                        }
                        mesh.material._exceptTexture = exceptTexture;
                    }
                }
            } else {
                if (defined(mesh.material)) {
                    if (Array.isArray(mesh.material)) {
                        for (let i = 0; i < mesh.material.length; i++) {
                            const material = mesh.material[i];
                            if (defined(pickableMesh._pickMaterials) && !pickableMesh._pickMaterials.includes(i)) continue;
                            if (defined(material._oriMap)) {
                                material.map = material._oriMap;
                                material._oriMap = undefined;
                                delete material._oriMap;
                                material.needsUpdate = true;
                            }
                            if (defined(material._oriNormalMap)) {
                                material.normalMap = material._oriNormalMap;
                                material._oriNormalMap = undefined;
                                delete material._oriNormalMap;
                                material.needsUpdate = true;
                            }
                           delete material._exceptTexture;
                        }
                    } else {
                        if (defined(mesh.material._oriMap)) {
                            mesh.material.map = mesh.material._oriMap;
                            mesh.material._oriMap = undefined;
                            delete mesh.material._oriMap;
                            mesh.material.needsUpdate = true;
                        }
                        if (defined(mesh.material._oriNormalMap)) {
                            mesh.material.normalMap = mesh.material._oriNormalMap;
                            mesh.material._oriNormalMap = undefined;
                            delete mesh.material._oriNormalMap;
                            mesh.material.needsUpdate = true;
                        }
                        delete mesh.material._exceptTexture;
                    }
                }
            }
        }
    })
}

/**
 * @this {U3dSelect}
 * @param {any} mesh
 * @param {import('three').ColorRepresentation} color
 * @param {number} opacity
 * @param {U3dIntersectLike} [intersect]
 */
function setMaterial(mesh, color, opacity, intersect) {
    if (!mesh || !mesh.material || !color || !opacity) return;
    let self = this;
    if (Array.isArray(mesh.material)) {
        if(intersect && defined(intersect.faceIndex) && mesh.isMerged){
            const layerName = mesh.getLayerName();
            const layer = self._app.getLayerByName(layerName);
            const info = /**@type{import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer}*/(layer).getMaterialIndexByFace(mesh, intersect.faceIndex);
            if(info && defined(info.materialIndex)){
                const idx = info.materialIndex;
                setMaterialColor(mesh, mesh.material[idx], color, opacity);
                return;
            }
        }
        for (let i = 0; i < mesh.material.length; i++) {
            if (defined(mesh._pickMaterials) && !mesh._pickMaterials.includes(i)) continue;
            setMaterialColor(mesh, mesh.material[i], color, opacity);

        }
    } else {
        setMaterialColor(mesh, mesh.material, color, opacity);
    }
}

/**
 * 선택 객체에 색상 하이라이트를 적용하는 함수 <br>
 * `selectType === UDEF.SELECT_TYPE.COLOR`|| ['color'] 에서 사용되며 외부에서 직접 호출할 수도 있습니다.
 *
 * @param {USelect} selected 대상 모델
 * @param {import('three').ColorRepresentation} color 변경 색상
 * @param {number} opacity 투명도(0~1)
 * @param {U3dIntersectLike} [intersect] picking 정보(faceIndex 등)
 *
 */
U3dSelect.prototype.setColor = function (selected, color, opacity, intersect) {
    let self = this;
    selected = getColorTarget(selected, intersect);
    if (hasPickMaterial(selected) && (!(/** @type {any} */ (selected)).isBIM || !(/** @type {any} */ (selected)).isBIM())) {
        /**@type{import('@union3d/core/mesh/U3DTilesMesh').U3DTilesMesh} */(selected).pickMaterial(intersect, color, opacity);
        return;
    }

    if (!hasTraverse(selected)) return;
    /** @type {any} */ (selected).traverse(function (/** @type {any} */ mesh) {
        if (mesh instanceof THREE.Mesh || mesh instanceof THREE.Line || mesh instanceof THREE.Points || mesh instanceof U3dGeometry)
            setMaterial.call(self, mesh, color, opacity, intersect);
    });
}

/**
 * 선택 결과의 컴포넌트와 별도로 클릭한 궤적의 렌더 메시를 반환합니다.
 * @param {USelect} selected 선택 결과
 * @param {U3dIntersectLike} [intersect] 원래 렌더 대상을 포함한 교차 정보
 * @returns {USelect} 색상을 적용·복원할 대상
 */
function getColorTarget(selected, intersect) {
    const raw = intersect?.renderObject ?? intersect?.object;
    return raw instanceof THREE.Mesh && raw.userData.type === 'trailMesh' ? raw : selected;
}

/**
 * @param {Record<string, any> | undefined} uniforms 경로 재질의 uniform
 */
function restoreHighlightUniforms(uniforms) {
    if (!uniforms) return;
    if (defined(uniforms._oriHighlightColor)) {
        if (uniforms.highlightColor) uniforms.highlightColor.value = uniforms._oriHighlightColor;
        delete uniforms._oriHighlightColor;
    }
    if (defined(uniforms._oriHighlightEnabled)) {
        if (uniforms.highlightEnabled) uniforms.highlightEnabled.value = uniforms._oriHighlightEnabled;
        delete uniforms._oriHighlightEnabled;
    }
}

/**
 * @this {U3dSelect}
 * @param {any} object
 * @returns {boolean}
 */
function isSelected(object) {
    var key = makeObjectKey(object);
    return defined(this._selected[key]);
}

/**
 * @param {any} object
 * @returns {string}
 */
function makeObjectKey(object) {
    return searchLayerName(object) + '^' + makeId(object);
}

/**
 * @param {USelect} target
 * @returns {boolean} traverse 함수 보유 여부
 */
function hasTraverse(target) {
    return !!target && typeof target === 'object' && 'traverse' in target && typeof target.traverse === 'function';
}

/**
 * @param {USelect} target
 * @returns {boolean} pickMaterial 함수 보유 여부
 */
function hasPickMaterial(target) {
    return !!target && typeof target === 'object' && 'pickMaterial' in target && typeof target.pickMaterial === 'function';
}

/**
 * @param {USelect} target
 * @returns {boolean} exceptTexture 함수 보유 여부
 */
function hasExceptTexture(target) {
    return !!target && typeof target === 'object' && 'exceptTexture' in target && typeof target.exceptTexture === 'function';
}

/**
 * @param {any} object
 * @returns {string} layerName
 */
function searchLayerName(object) {
    if(!defined(object)) return '';

    let layerName;

    if (object.getLayerName)
        layerName = object.getLayerName();
    if (!defined(layerName))
        layerName = object._ulayername;
    if (!defined(layerName))
        layerName = object.layerName;

    return layerName;
}

/**
 * @param {any} object
 * @returns {string} ID
 */
function makeId(object) {
    let id;
    if (object.isMerged) {
        if (object._isMerged)
            id = object.getUid();
        else if (!object._isMerged)
            id = object.getUid() + UDEF.U3F_DETACHED_TOKEN;
        return id;
    }

    if (defined(object.getBBox)) {
        let bbox = object.getBBox();
        if (defined(bbox)) {
            let center = new THREE.Vector3();
            bbox.getCenter(center);
            if (defined(center) && defined(center.x) && defined(center.y) && defined(center.z)) {
                id = center.x.toFixed(4) + '_' + center.y.toFixed(4) + '_' + center.z.toFixed(4);
            }
        }
    }

    if (object instanceof U3dComponentPosition) {
        id = object.name;
    }

    if (!defined(id) && object.getUid)
        id = object.getUid();
    if (!defined(id))
        id = object.uuid;

    return id;
}

//+ polygonOffset 설정 및 해제
/**
 * @param {any} object
 * @param {boolean} value
 *
 */
function setObjectPolygonOffset(object, value) {
    if (!defined(object)) {
        return;
    }
    if (!defined(object.material)) {
        return;
    }
    if (!defined(value)) {
        value = true;
    }
    if (value) {
        if (!object.material.polygonOffset) {
            object.material.polygonOffset = true;
            object.material.polygonOffsetUnit = 1;
            object.material.polygonOffsetFactor = -10;
        }

    } else {
        if (object.material.polygonOffset) {
            object.material.polygonOffset = false;
            object.material.polygonOffsetUnit = 0;
            object.material.polygonOffsetFactor = 0;
        }
    }
}

//+ boundingBox를 구한 후 객체의 위치 정보 얻기
/**
 * @param {any} object
 * @returns {import('three').Vector3}
 */
function getObjectPosition(object) {
    let result = new THREE.Vector3();
    if (!defined(object))
        return result;

    if (!defined(object.geometry.boundingBox))
        object.geometry.computeBoundingBox();

    result.subVectors(object.geometry.boundingBox.max, object.geometry.boundingBox.min);
    result.multiplyScalar(0.5);
    result.add(object.geometry.boundingBox.min);
    result.applyMatrix4(object.matrixWorld);
    return result;
}

/**
 * @param {import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer} layer
 * @param {any} object
 * @returns {boolean}
 */
function getPickMaterial(layer, object) {
    const editEvent = getEditedEventInfo(layer, object.getUid());
    if (!defined(editEvent)) return false;
    const data = editEvent.editData;
    const materialSplit = data.materialSplit;
    if (materialSplit) {
        object._pickMaterials = object._pickMaterials || [];
        materialSplit.forEach((/** @type {any} */ value, /** @type {any} */ key_) => {
            object = layer.mergedMeshDivision(object, key_);
            const value_ = layer.getMaterialIndexByFace(object, key_);
            if (defined(value_) && 'materialIndex' in value_ && !object._pickMaterials.includes(value_.materialIndex))
                object._pickMaterials.push(value_.materialIndex);
        })
        return true;
    }
    return false;
}

/**
 * @this {U3dSelect}
 * @param {any} mesh
 * @param {import('three').ColorRepresentation} color
 * @param {number} opacity
 * @param {string} type
 *
 */
function setSelectedStyle(mesh, color, opacity, type) {
    const self = this;
    if (!mesh || !mesh.isMerged) return;
    const layerName = mesh.getLayerName();
    const layer = self._app.getLayerByName(layerName);
    if (!layer) return;
    const modelId = mesh.getUid();
    const editInfo = getEditedEventInfo(layer, modelId);
    if (!editInfo) return;
    editInfo.color = color;
    editInfo.opacity = opacity;
    if (editInfo.editData) {
        const data = editInfo.editData;
        if (data['materialColor']) {
            const parentId = data['materialColor'].id;
            const editInfo_ = getEditedEventInfo(layer, parentId);
            if (editInfo_) {
                editInfo_.color = color;
                editInfo_.opacity = opacity;

                const parentModel = /**@type{import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer}*/(layer).getModelById(parentId)
                if (parentModel && defined(data['materialColor'].materialIndex)) {
                    parentModel._pickMaterials = parentModel._pickMaterials || [];
                    const idx = data['materialColor'].materialIndex;
                    const selectedModel =/**@type{any}*/(parentModel);
                    if(!parentModel._pickMaterials.includes(idx))
                        parentModel._pickMaterials.push(idx);
                    if (type === 'color'){
                        if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE){
                            self.setOutline(selectedModel);
                        } else if(self.getSelectType() === UDEF.SELECT_TYPE.COLOR){
                            self.setColor(selectedModel, self._selectColor, self._selectOpacity);
                        }
                    }
                    else if (type === 'texture')
                        self.setTexture(selectedModel, self.exceptTexture);

                }

            }
        } else if (data['materialSplit']) {
            const childInfos = data['materialSplit'];
            childInfos.forEach(function (/** @type {any} */ value) {
                const childId = value.childId;
                const editInfo_ = getEditedEventInfo(layer, childId);
                if (editInfo_) {
                    editInfo_.color = color;
                    editInfo_.opacity = opacity;
                    const childModel = /**@type{import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer}*/(layer).getModelById(childId)
                    if (childModel) {
                        const selectedModel = /**@type{any}*/(childModel);
                        if (type === 'color'){
                            if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE){
                                self.setOutline(selectedModel);
                            } else if(self.getSelectType() === UDEF.SELECT_TYPE.COLOR){
                                self.setColor(selectedModel, self._selectColor, self._selectOpacity);
                            }
                        }
                        else if (type === 'texture')
                            self.setTexture(selectedModel, self.exceptTexture);
                    }
                }
            })
            if (type === 'color'){
                if(self.getSelectType() === UDEF.SELECT_TYPE.OUTLINE){
                    self.setOutline(mesh);
                } else if(self.getSelectType() === UDEF.SELECT_TYPE.COLOR) {
                    self.setColor(mesh, self._selectColor, self._selectOpacity);
                }
            }
            else if (type === 'texture')
                self.setTexture(mesh, self.exceptTexture);
        }
    }
}

/**
 * @param {import('@union3d/core/mesh/UMesh').UMesh} mesh
 * @param {import('three').Material} material
 * @param {import('three').ColorRepresentation} color
 * @param {number} opacity
 */
function setMaterialColor(mesh, material, color, opacity){
    const newColor = new THREE.Color(color);

    const shaderM = /**@type{import('three').ShaderMaterial}*/ (material)
    if (shaderM.isShaderMaterial) {
        let uniforms = shaderM.uniforms;

        const isTrailHighlight = mesh.userData?.type === 'trailMesh' && uniforms?.highlightColor && uniforms?.highlightEnabled;
        if (isTrailHighlight) {
            // 노드 색상·농도와 별도로 강조하여 실시간 경로 스타일을 덮어쓰지 않습니다.
            uniforms._oriHighlightColor ??= uniforms.highlightColor.value.clone();
            uniforms._oriHighlightEnabled ??= uniforms.highlightEnabled.value;
            uniforms.highlightColor.value = newColor;
            uniforms.highlightEnabled.value = true;
            return;
        } else if (mesh.setColor) {
            mesh.setColor(color);
        } else if (uniforms?.color) {
            // if (!defined(uniforms._oriColor))
            //     uniforms._oriColor = uniforms.color.value;
            // // uniforms._oriColor ??= uniforms.color.value.clone();
            // uniforms.color.value = new THREE.Color(color);
            uniforms._oriColor ??= uniforms.color.value.clone();
            uniforms.color.value = newColor;
        }

        if (mesh.setOpacity) {
            mesh.setOpacity(opacity);
        } else if (uniforms?.opacity) {
            uniforms._oriOpacity ??= uniforms.opacity.value;
            uniforms.opacity.value = opacity;
        }

        if (uniforms?.colorGradation) {
            uniforms._oriColorGradation ??= uniforms.colorGradation.value;
            uniforms.colorGradation.value = false;
        }
    }else{
        const colorMaterial = /** @type {any} */ (material);
        colorMaterial._oriColor ??= colorMaterial.color.clone();
        colorMaterial._oriOpacity ??= colorMaterial.opacity;

        colorMaterial.color = newColor;
        colorMaterial.opacity = opacity;
    }

    if (!material?.userData?._keepTransparent) { // 원본 데이터 transparent 유지
        material.transparent = opacity < 1;
    }

    material.needsUpdate = true;
}

export {U3dSelect};

/**
 * 연결된 앱의 생존 여부를 읽습니다. 선택기와 앱의 소유권을 가져오지 않습니다.
 * @param {U3dSelect} selector 검사할 선택기이며 null을 허용하지 않고 입력을 변경하지 않습니다.
 * @returns {boolean} 앱이 연결되어 있고 종료되지 않았으면 true입니다.
 */
/// <summary>선택기가 빌린 앱의 생존 여부를 판정합니다. 앱이 없거나 종료됐으면 레이어·카메라·그리기 자원에 접근하지 않습니다.</summary>
/// <param name="selector">검사할 U3dSelect 입력이며 선택기와 앱을 변경하거나 소유하지 않습니다.</param>
/// <returns>앱이 연결되어 있고 종료되지 않았으면 boolean true입니다.</returns>
function isSelectAppAvailable(selector) {
    return defined(selector._app) && selector._app.isDisposed?.() !== true;
}

/**
 * 선택기의 살아 있는 앱에서 선택 대상의 레이어 자원과 완료 수신을 정리합니다.
 * @this {U3dSelect}
 * @param {string} key 레이어명과 객체 ID로 구성한 선택 키이며 입력을 변경하지 않습니다.
 * @param {ModelMesh} selected 호출자가 소유하는 레이어 모델 메시이며 null을 허용하지 않고 형상·재질을 해제하지 않습니다.
 * @param {boolean} isCheckIdle true이면 U3F 분할 메시의 유휴 정리를 요청합니다. 필수 입력이며 단위는 없습니다.
 * @returns {ModelMesh} 원본 또는 레이어에서 찾은 모델 메시이며 소유권을 이전하지 않습니다.
 */
/// <summary>살아 있는 앱의 선택 레이어 구독·분할 재질·편집 기록을 해제하고 최종 선택 참조를 반환합니다.</summary>
/// <param name="key">string 선택 키 입력이며 호출자가 보관한 로드 콜백의 조회에 사용합니다.</param>
/// <param name="selected">호출자 소유 ModelMesh 입력이며 null을 허용하지 않고 형상·재질 자체를 해제하지 않습니다.</param>
/// <param name="isCheckIdle">boolean 입력이며 true일 때 U3F 분할 메시 정리도 요청합니다.</param>
/// <returns>원본 또는 레이어에서 찾은 ModelMesh 참조입니다. 소유권을 이전하지 않습니다.</returns>
function releaseSelectedLayer(key, selected, isCheckIdle) {
    const layer = /** @type {import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer} */ (this._app.getLayer(searchLayerName(selected)));
    const callback = this._loadedListeners[key];
    if (!defined(layer) || !defined(callback)) return selected;
    layer.off(U3dEvent.MESH.LOADED, callback);
    delete this._loadedListeners[key];
    if (defined(selected._pickMaterials) && selected._pickMaterials.length > 0) {
        for (const materialIndex of [...selected._pickMaterials]) layer.removeMaterialIndex(selected, materialIndex);
    }
    const editInfo = getEditedEventInfo(layer, selected.getUid());
    if (editInfo && editInfo.color) {
        if (!selected.material) {
            const model = layer.getModelById(selected.getUid(), selected._isMerged);
            if (model) selected = model;
        }
        delete editInfo.isSetColor;
        delete editInfo.color;
        delete editInfo.opacity;
        delete editInfo.exceptTexture;
    }
    if (layer.checkDivisionMeshIdle && isCheckIdle) layer.checkDivisionMeshIdle();
    return selected;
}
