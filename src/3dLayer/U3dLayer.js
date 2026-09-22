//@ts-check
import {Box3, Object3D, Vector3} from 'three';
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {UDEF} from "@union3d/core/UDEF";
import {U3dObject} from '@U3dObject';
import {UMathEngine} from '@UMathEngine';
import {UGroup} from "@union3d/core/UGroup";
import {UScene} from '@UScene';
import {UCache} from "@union3d/core/UCache";
import {Guid} from "@util/Guid";
import {UEventDispatcher} from '@UEventDispatcher';
import {UCheckTime} from "@union3d/core/UCheckTime";
import {U3dMessage} from '@U3dMessage';
import {deferred} from "@util/deferred";
import {UBox3HelperGroup} from "@union3d/helpers/UBox3HelperGroup";
import {__GInfo__} from "@U3dMessage";
import {INTERNAL} from "@union3d/3dLayer/U3dLayer.internal";
import {normalizeOptionKeys} from "@util/normalizeOptionKeys.js";

/**
 * 작업 확인 주기
 *
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const _REFRESH_TIME = 200;

/**
 * 작업 확인 수
 *
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const _WAIT_COUNT = 3;

/**
 * `U3dLayer`가 dispatch하는 이벤트 이름 모음입니다. <br>
 * `layer.on(U3dLayerEMD.LOADED, callback)`처럼 이벤트 리스너를 등록할 때 이벤트 종류를 지정하는 값으로 사용합니다.
 * 각 이벤트가 언제 발생하는지는 {@link U3dLayerEMI}를 참고하세요.
 *
 * @type {U3dLayerEMI}
 */
export const U3dLayerEMD = {
    CREATE: 'layer-create',
    LOADED: 'layer-loaded',
    /*
    주로 레이어의 update 구문에 dispatch 시킨다
    U3dLayer에서 dispatch 할수도 있겠으나, 쓸데없는 콜만 많아질까봐
    각 레이어의 update 문에 개별적으로 dispatch를 일으키도록 하자
    */
    UPDATE: 'layer-update',
    BEFORE_DISPOSE: 'layer-before-dispose',
    DISPOSE: 'layer-dispose',
    SHOW: 'layer-show',
    HIDE: 'layer-hide'
};

/**
 * ~extends import('@U3dObject').U3dObject <br>
 *
 * `3D 레이어` 최상위 클래스입니다. <br>
 * 레이어는 지도 위에 함께 그려지는 한 묶음의 데이터(영상 타일, 지형 높이, 3D 모델 등)를 담는 단위이며,
 * `U3dApp`에 등록되면 매 프레임 `update()`가 호출되어 타일을 불러오고 자신의 Scene에 결과물을 배치합니다.
 * 이 클래스는 직접 생성해 쓰는 것보다 `U3dImageLayer`, `U3dHeightLayer`, `U3dModelLayer` 같은 하위 레이어의 공통 기능
 * (가시화 상태, 투명도, 범위 판정, 타일 상태·취소·캐시 관리, 이벤트, 해제)을 제공하는 부모 클래스로 사용됩니다.
 *
 * @group 3dLayer
 * @extends {U3dObject}
 */
class U3dLayer extends U3dObject {
    /**
     * 생성자 옵션에서 인식하는 키 목록입니다. <br>
     * `normalizeOptionKeys`가 이 목록을 기준으로 옵션 키의 대소문자 표기를 정규화하므로,
     * 하위 레이어가 새 옵션을 추가하면 이 배열을 확장해 등록해야 합니다.
     *
     * @override
     *
     * @type {Array<string>}
     */
    static OPT_KEYS = [
        ...U3dObject.OPT_KEYS, 'cache', 'classType', 'visible', 'crs',
        'ext', 'tileName', 'minLevel', 'maxLevel', 'renderOrder', 'opacity',
        'opacityDist', 'animation', 'baseUrl', 'isDeBug', 'rectangle', 'extent',
        'geoExtent', 'rectangle3d', 'groupLayer', 'useShadowUpdate', 'type',
        'debugLog', 'debugLogLimit'
    ];

    /**
     * 이 레이어 클래스가 dispatch하는 이벤트 이름 모음입니다. `U3dLayerEMD`와 같은 객체이며,
     * 하위 레이어가 이벤트를 추가하려면 이 static 멤버를 확장한 객체로 재정의합니다.
     *
     * @type {U3dLayerEMI}
     */
    static EVENT = U3dLayerEMD;

    /** @type {boolean} */
    #visible = false;

    /**
     * 작업 확인 카운트 저장
     *
     * @type {number}
     *
     * @ignore
     */
    _countloading = 0;

    /**
     * 작업확인 setTimeout id 저장
     *
     * @type {number | null}
     *
     * @ignore
     */
    _workCheckId = null;

    /**
     * 레이어의 기존 바운드 디버그 상태와 성능 로그 공통 설정을 함께 보관합니다. <br>
     * `logLimit`은 로그 구조를 강제하지 않고 하위 레이어가 자체 보관 정책에 사용할 수 있는 공통 한도 값입니다.
     * 실제 로그 데이터와 측정 상태는 각 하위 레이어가 별도로 소유해야 합니다.
     *
     * @type {{layerBound: import('@union3d/helpers/UBox3HelperGroup').UBox3HelperGroup | undefined, objectBound: import('@union3d/helpers/UBox3HelperGroup').UBox3HelperGroup | undefined, eventId: string | undefined, isWorking: boolean, log: boolean, logLimit: number}}
     */
    _debug = {
        layerBound: undefined,
        objectBound: undefined,
        eventId: undefined,
        isWorking: false,
        log: false,
        logLimit: 500
    };

    /** 레이어가 소유한 렌더링 컨테이너. `getScene()`으로 접근합니다.
     *
     * @type {import('@UScene').UScene}
     */
    _scene;
    /** 앱 등록 시 연결되는 앱 카메라. 등록 전에는 undefined입니다.
     *
     * @type {import('@UCamera').UCamera | undefined}
     */
    _camera;
    /** 앱 등록 시 연결되는 카메라 절두체(가시 영역). 등록 전에는 undefined입니다.
     *
     * @type {import('@UFrustum').UFrustum | undefined}
     */
    _frustum;
    /**
     * @type {import('@UDrawArg').UDrawArg}
     *
     * @ignore
     */
    _drawArg;
    /**
     * @type {import('@union3d/quadtree/U3dQuadSet').U3dQuadSet | undefined}
     *
     * @ignore
     */
    _quadtreeSet;
    /**
     * @type {TileProcess| undefined}
     *
     * @ignore
     */
    _tileProcess;
    /**
     * 레이어 범위(`_rectangle`)로 계산한 3D 경계 상자입니다. 월드 좌표(EPSG:3857) 기준이며,
     * 카메라 절두체 교차 판정(`intersectFrustum`)에 사용합니다. 범위가 없으면 undefined입니다.
     *
     * @type {import('three').Box3 | undefined}
     */
    _box3;
    /**
     * @type {import('three').Box3 | {minx: number, miny: number, maxx: number, maxy: number} & Partial<{minz: number, maxz: number}> | undefined}
     *
     * @ignore
     */
    _boundingBox;
    /**
     * @type {import('@union3d/env/ULight').ULight | import('three').Light | undefined}
     *
     * @ignore
     */
    _light;
    /** 타일 키로 타일 메시를 보관하는 캐시. 생성 옵션 `cache`가 false면 undefined입니다.
     *
     * @type {import('@union3d/core/UCache').UCache | undefined}
     */
    _cache;
    /** `initialize()` 완료 여부.
     *
     * @type {boolean}
     */
    _initialized;
    /** `dispose()` 완료 여부. true면 레이어를 다시 사용할 수 없습니다.
     *
     * @type {boolean}
     */
    _disposed;
    /** 타일 키별 로딩 상태(`UDEF.TILE_STATE` 코드).
     *
     * @type {Record<string, number>}
     */
    _stateTiles;
    /** 타일 키별 취소 대상 객체(`reject`/`cancel`을 가진 대기 객체, 취소 함수 또는 그 배열).
     *
     * @type {Record<string, any>}
     */
    _cancelTiles;
    /** `update()`에서 처리해야 할 대기 작업. 키는 작업 식별자이며 값은 `reject`를 가질 수 있습니다.
     *
     * @type {Record<string, any>}
     */
    _workBuffer;
    /** 편집 작업용 대기 버퍼. 하위 레이어가 형식을 정의합니다.
     *
     * @type {Record<string, any>}
     */
    _editWorkBuffer;
    /** 레이어 인스턴스 고유 식별자(GUID). 이름(`_name`)과 달리 생성 시 자동 부여됩니다.
     *
     * @type {string}
     */
    _id;
    /** 초기 로딩 진행 여부. `show(true)` 이후 첫 `LOADED` 이벤트까지 true입니다.
     *
     * @type {boolean}
     */
    _initLoading;
    /** 타일 캐시 사용 여부(생성 옵션 `cache`).
     *
     * @type {boolean}
     */
    _isCache;
    /** 레이어 종류 문자열(생성 옵션 `type`). 기본값 'none'.
     *
     * @type {string}
     */
    _type;
    /** 클래스 이름 문자열(생성 옵션 `classType`). 메시지 출력과 메타데이터에 사용합니다.
     *
     * @type {string}
     */
    _classtype;
    /** 레이어 데이터의 좌표계 코드(생성 옵션 `crs`). 기본값 'EPSG:3857'.
     *
     * @type {string}
     */
    _crs;
    /** 타일 데이터 파일 확장자(생성 옵션 `ext`). 기본값 '.png'.
     *
     * @type {string}
     */
    _ext;
    /** 타일 프로세스 종류(`UDEF.PROCESS.TYPE`의 값). 앱 등록 시 어느 프로세스에 연결할지 결정합니다.
     *
     * @type {string}
     */
    _tileName;
    /** 타일을 표시하는 최소 레벨(줌 단계).
     *
     * @type {number}
     */
    _minlevel;
    /** 타일을 표시하는 최대 레벨(줌 단계).
     *
     * @type {number}
     */
    _maxlevel;
    /** 타일 프로세스(`U3dProcess`)가 `_maxlevel`을 타일 레벨 상한으로 적용할지 여부. 이 클래스는 true로 초기화하며, 상한을 두지 않는 하위 레이어가 false로 바꿉니다.
     *
     * @type {boolean}
     */
    _useMaxLevel;
    /** 랜더링 우선순위. 클수록 나중에 그려집니다.
     *
     * @type {number}
     */
    _renderOrder;
    /** 현재 투명도(0~1).
     *
     * @type {number}
     */
    _opacity;
    /** 객체 출력 애니메이션에서 프레임마다 바뀌는 투명도 변화량.
     *
     * @type {number}
     */
    _opacityDist;
    /** 반투명 여부(`_opacity < 1`). `setOpacity()`에서 함께 갱신됩니다.
     *
     * @type {boolean}
     */
    _transparent;
    /** 객체 출력 애니메이션 사용 여부(생성 옵션 `animation`).
     *
     * @type {boolean}
     */
    _animation;
    /** 타일·데이터 요청의 기준 URL(생성 옵션 `baseUrl`).
     *
     * @type {string | undefined}
     */
    _baseUrl;
    /** 앱의 그림자 갱신 순회에 포함될지 여부.
     *
     * @type {boolean}
     */
    _useShadowUpdate;
    /**
     * @type {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer | undefined}
     *
     * @ignore
     */
    _groupLayer;
    /**
     * @type {UEventDispatcherListener | undefined}
     *
     * @ignore
     */
    _idReloaded;
    /**
     * 타일 결과물(메시)이 모이는 그룹. 레이어 Scene의 자식이며 `getGroup()`으로 접근합니다.
     *
     * @type {import('@UGroup').UGroup}
     */
    _group;
    /**
     * @type {import('@union3d/math/UGeoRect').UGeoRect | undefined}
     *
     * @ignore
     */
    _rectangle;
    /**
     * @type {import('@union3d/math/UGeoRect').UGeoRect | undefined}
     *
     * @ignore
     */
    _rectangle3d;
    /** 현재 로딩 중인 타일 수. `plusLoadingTile()`/`minusLoadingTile()`로 증감합니다.
     *
     * @type {number}
     */
    _countloadingTile;
    /** 하위 레이어용 범용 카운터. 이 클래스는 0으로 초기화만 하고 사용하지 않습니다.
     *
     * @type {number}
     */
    _count;
    /** 갱신 주기 판정용 시간 측정기(`isUpdate()`/`updateTime()`). 이 클래스는 생성만 하고 하위 레이어가 사용합니다.
     *
     * @type {import('@union3d/core/UCheckTime').UCheckTime}
     */
    _checkUpdateTime;
    /** 디버그 모드 여부(생성 옵션 `isDeBug`).
     *
     * @type {boolean}
     */
    _isDeBug;
    /** `setOpacity()` 최초 호출 전의 투명도. `resetOpacity()`가 되돌릴 값이며, 되돌린 뒤 삭제됩니다.
     *
     * @type {number | undefined}
     */
    _oriOpacity;
    /**
     * @type {unknown}
     *
     * @ignore
     */
    _idReloadEnd;

    /**
     * @type {import('@U3dApp').U3dApp}
     *
     * @ignore
     */
    _app;

    /**
     * U3dLayer 생성자입니다. <br>
     * 레이어의 범위는 `rectangle`, `extent`, `geoExtent` 순서로 먼저 지정된 옵션 하나만 사용합니다.
     * `renderOrder`를 지정하지 않으면 생성 순서에 따라 자동으로 증가하는 값이 부여됩니다.
     * 생성만으로는 화면에 표시되지 않으며, `U3dApp`에 레이어를 추가해야 초기화되고 갱신이 시작됩니다.
     *
     * @param {U3dLayerCO} [opt={}] 생성자 옵션. 각 항목의 의미와 기본값은 {@link U3dLayerCO}를 참고하세요
     */
    constructor(opt = {}) {
        opt = /** @type {U3dLayerCO} */normalizeOptionKeys(opt, new.target);
        super(opt);
        const self = this;

        self._scene = new UScene();
        self._scene.name = self._name;
        self._scene.renderOrder = self._renderOrder;
        self._camera = undefined;
        self._frustum = undefined;
        self._quadtreeSet = undefined;
        self._tileProcess = undefined;
        self._box3 = undefined;
        self._boundingBox = undefined; //Box3 객체가 아닐 수 있다.

        self._light = undefined;
        self._cache = undefined;
        self._initialized = false;
        self._disposed = false;

        self._stateTiles = {};   //+ 타일 당 자료 로딩 상태
        self._cancelTiles = {};  //+ 타일 당 캔슬 자료
        self._workBuffer = {};   //+ 처리해야할 버퍼 (update())

        self._editWorkBuffer = {};

        self._id = Guid();
        self._initLoading = true;

        self._isCache = defaultValue(opt.cache, true);
        if (self._isCache) self._cache = new UCache();
        self._type = defaultValue(opt.type, 'none');
        self._classtype = defaultValue(opt.classType, 'U3dLayer');
        self._visible = defaultValue(opt.visible, false);
        self._crs = defaultValue(opt.crs, 'EPSG:3857');
        self._ext = defaultValue(opt.ext, '.png');
        self._tileName = defaultValue(opt.tileName, UDEF.PROCESS.TYPE.IMAGE);
        self._minlevel = defaultValue(opt.minLevel, 0);
        self._maxlevel = defaultValue(opt.maxLevel, 19);
        self._useMaxLevel = true; //U3dProcess에서 쓰임
        self._renderOrder = defaultValue(opt.renderOrder, UDEF.g_countLayer++);
        self._opacity = defaultValue(opt.opacity, 1);
        self._opacityDist = defaultValue(opt.opacityDist, 0.02);
        self._transparent = (self._opacity < 1);
        self._animation = defaultValue(opt.animation, false);
        self._baseUrl = defaultValue(opt.baseUrl, undefined);
        self._useShadowUpdate = opt.useShadowUpdate ?? true;
        deferred(/** @type {Partial<DeferredObject<typeof self>>} */(/** @type {unknown} */(self)));

        self._groupLayer = defaultValue(opt.groupLayer, undefined);

        //+ image, height 마지막 이벤트 추가
        self._idReloaded = undefined;

        self._group = new UGroup({drawarg: self._drawArg});
        const group = /** @type {UGroup & {_renderOrder: number, setManualUpdate: () => void}} */ (self._group);
        group._renderOrder = self._renderOrder;
        group.setManualUpdate();

        if (defined(opt.rectangle)) {
            self._rectangle = opt.rectangle;
        } else if (defined(opt.extent)) {
            self._rectangle = self.convertRectangle(opt.extent);
        } else if (defined(opt.geoExtent)) {
            self._rectangle = self.convertGeographicToGoogleRectangle(opt.geoExtent);
        }

        self._rectangle3d = self._rectangle;
        self._countloadingTile = 0;

        self._count = 0;

        self._checkUpdateTime = new UCheckTime();

        self._isDeBug = defaultValue(opt.isDeBug, false);
        self._debug.log = defaultValue(opt.debugLog, false);
        const debugLogLimit = Number(defaultValue(opt.debugLogLimit, 500));
        // 0 이하이거나 숫자로 변환할 수 없는 값은 무제한 보관으로 오인되지 않도록 안전한 기본값으로 교정합니다.
        self._debug.logLimit = Number.isFinite(debugLogLimit) && debugLogLimit > 0
            ? Math.floor(debugLogLimit)
            : 500;
    }

    /**
     * 레이어 초기화 완료 여부입니다. `U3dApp`에 등록되어 `initialize()`가 끝나면 true가 됩니다.
     *
     * @returns {boolean} 초기화가 끝났으면 true
     */
    get initialized() {
        return this._initialized;
    }

    /**
     * 레이어 초기화 완료 여부를 직접 설정합니다. 초기화 흐름을 대신 관리하는 하위 레이어나 관리자에서만 사용합니다.
     *
     * @param {boolean} value 초기화가 끝났으면 true
     */
    set initialized(value) {
        this._initialized = value;
    }

    /**
     * 생성 옵션 `isDeBug`로 지정한 디버그 모드 여부입니다. 하위 레이어가 디버그용 추가 처리를 할지 판단하는 데 사용합니다.
     *
     * @returns {boolean} 디버그 모드이면 true
     */
    get isDeBug() {
        return this._isDeBug;
    }

    /**
     * 디버그 모드 여부를 설정합니다. 값만 저장하며, 실제 디버그 처리는 하위 레이어가 이 값을 읽어 수행합니다.
     *
     * @param {boolean} value 디버그 모드이면 true
     */
    set isDeBug(value) {
        this._isDeBug = value;
    }

    /**
     * 레이어 생성 옵션 `debugLog`의 활성화 여부를 반환합니다. <br>
     * 이 메서드는 로그의 저장 형식이나 측정 방식에는 관여하지 않으며,
     * 하위 레이어가 자체 디버그 로그 기능의 실행 여부를 판단하는 공통 진입점으로만 사용합니다.
     * 하위 레이어에서 별도의 활성화 정책이 필요하면 이 메서드를 오버라이드할 수 있습니다.
     *
     * @returns {boolean} 디버그 로그 기능 활성화 여부
     */
    isDebugLog() {
        return this._debug.log;
    }

    /**
     * 하위 레이어가 수집한 디버그 로그를 반환하기 위한 공통 API입니다. <br>
     * `U3dLayer`는 레이어마다 서로 다른 로그 구조를 가질 수 있도록 데이터 형식을 정의하거나
     * 내부 저장소를 생성하지 않습니다. 따라서 기본 구현은 `undefined`를 반환합니다.
     * 로그를 수집하는 하위 레이어는 자신의 저장 구조에 맞게 이 메서드를 오버라이드해야 합니다.
     *
     * @returns {unknown} 하위 레이어가 정의한 디버그 로그. 기본 구현은 undefined
     */
    getDebugLog() {
        return undefined;
    }

    /**
     * 하위 레이어가 자신의 로그를 JSON 문자열로 제공하기 위한 공통 API입니다. <br>
     * `U3dLayer`는 로그 객체의 구조와 직렬화 규칙을 알 수 없으므로 `JSON.stringify`를 수행하지 않으며,
     * 기본 구현은 `undefined`를 반환합니다. JSON 출력이 필요한 하위 레이어가 직접 오버라이드하여
     * 순환 참조 제거, 들여쓰기, 민감 정보 제외 등 해당 레이어에 맞는 직렬화 정책을 적용해야 합니다.
     *
     * @param {number} [space=2] 하위 구현에서 사용할 수 있는 JSON 들여쓰기 공백 수
     * @returns {string | undefined} 하위 레이어가 생성한 JSON 문자열. 기본 구현은 undefined
     */
    getDebugLogJson(space = 2) {
        return undefined;
    }

    /**
     * 하위 레이어가 보관 중인 디버그 로그를 초기화하기 위한 공통 API입니다. <br>
     * `U3dLayer`는 공통 로그 저장소를 소유하지 않으므로 기본 구현에서는 아무 데이터도 변경하지 않고
     * `false`를 반환합니다. 로그 저장소를 가진 하위 레이어가 직접 오버라이드하여 진행 중인 측정과
     * 누적 통계를 포함한 자체 상태를 안전하게 초기화해야 합니다.
     *
     * @returns {boolean} 하위 레이어에서 로그를 초기화했으면 true. 기본 구현은 false
     */
    clearDebugLog() {
        return false;
    }

    /**
     * 레이어의 가시화 상태입니다. 외부에서는 `getVisible()`을 사용하세요.
     *
     * @returns {boolean} 보이는 상태면 true
     */
    get _visible() {
        return this.#visible;
    }

    /**
     * 레이어의 가시화 상태를 바꿉니다. 상태가 실제로 바뀔 때만 `SHOW` 또는 `HIDE` 이벤트를 dispatch하며,
     * 그룹 정리나 작업 취소는 하지 않으므로 외부에서는 `show()`를 사용하세요.
     *
     * @param {boolean} value 보이게 하려면 true
     */
    set _visible(value) {
        const EVENT = (/** @type {typeof U3dLayer} */ (this.constructor)).EVENT;
        const dispatcher = /** @type {{dispatch: (event: string) => void}} */ (/** @type {unknown} */ (this));
        if (value && !this.#visible)
            dispatcher.dispatch(EVENT.SHOW);
        else if (!value && this.#visible)
            dispatcher.dispatch(EVENT.HIDE);

        this.#visible = value;
    }

    /**
     * 레이어가 소유한 Scene을 반환합니다. <br>
     * Scene은 이 레이어가 그리는 모든 3D 객체를 담는 최상위 컨테이너(three.js `Scene`을 확장한 `UScene`)이며,
     * `add()`/`remove()`로 넣은 사용자 객체와 타일 결과물을 담는 `UGroup`이 이 안에 들어 있습니다.
     * 반환값은 레이어 내부 객체 자체이므로 `dispose()` 이후에는 사용하지 않아야 합니다.
     *
     * @returns {import('@UScene').UScene} 레이어의 렌더링 컨테이너
     */
    getScene() {
        return this._scene;
    }

    /**
     * 그림자 업데이트 대상 여부를 반환합니다. <br>
     * `U3dApp`은 매 프레임 일부 레이어를 순회하며 보이는 상태이고 이 값이 true인 레이어의 `updateShadow()`를 호출해
     * 그림자 맵(빛이 가려지는 영역 계산 결과)을 갱신합니다.
     *
     * @returns {boolean} true면 앱의 그림자 갱신 순회에 포함됩니다
     */
    isUseShadowUpdate() {
        return this._useShadowUpdate;
    }

    /**
     * 그림자 업데이트 대상 여부를 설정합니다. 값만 저장하며, 다음 프레임의 그림자 갱신 순회부터 반영됩니다.
     *
     * @param {boolean} [use=true] true면 앱의 그림자 갱신 순회에 포함하고, false면 제외합니다
     */
    setUseShadowUpdate(use = true) {
        this._useShadowUpdate = use;
    }

    /**
     * 레이어 타일 상태 및 캐시를 전부 초기화합니다. <br>
     * 진행 중인 타일 작업을 모두 취소(reject)하고, 캐시된 타일 메시를 해제한 뒤 그룹을 비워 다음 갱신에서 타일을 다시 불러오게 합니다.
     * 레이어가 아직 앱에 등록되지 않아 `_drawArg`가 없으면 상태·작업 정리까지만 수행하고 캐시 해제는 건너뜁니다.
     */
    refresh() {
        this._stateTiles = {};

        const cancelKeys = Object.keys(this._cancelTiles);
        for (const key of cancelKeys) {
            this.cancelTileByKey(key);
        }
        this._cancelTiles = {};
        const works = Object.values(this._workBuffer);
        for (const work of works) {
            if (work.reject) work.reject();
        }
        this._workBuffer = {};

        const drawArg = this._drawArg;
        if(!defined(drawArg)) return;

        let cache = drawArg._cacheTiles.items();
        for (const tile of cache) {
            this.disposeTile(tile);
        }
        cache = drawArg._cacheModelTiles.items();
        for (const tile of cache) {
            this.disposeTile(tile);
        }

        const layerCacheKeys = /** @type {UCache} */ (this._cache).keys();
        for (const key of layerCacheKeys) {
            this.disposeTileByKey(key);
        }
        this._group.clear();
        this._countloadingTile = 0;
    }

    /**
     * 레이어 작업 완료 이벤트를 생성합니다.
     *
     * @ignore
     */
    createWorkingEndEvent() {
        if (this._workCheckId)
            return;

        if (!this.hasEventType((/** @type {typeof U3dLayer} */ (this.constructor)).EVENT.LOADED)) {
            return;
        }

        this.#checkWorking(this._name, true);
    }

    /**
     * 레이어를 초기화합니다.
     *
     * @ignore
     */
    initialize() {
        const self = this;
        const selfLayer = /** @type {{dispatch: function(string, ...unknown): void, addEventListener: function(string, unknown): void}} */ (/** @type {unknown} */ (self));
        self._scene.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (self._group)));
        self.#computeBox3();
        self._initialized = true;
        selfLayer.dispatch((/** @type {typeof U3dLayer} */ (self.constructor)).EVENT.CREATE);

        if (self._app) {
            const appExt = /** @type {{ dispatchEvent: function(string, object): void, constructor: { EVENT: Record<string, string> } }} */ (/** @type {unknown} */ (self._app));
            appExt.dispatchEvent(appExt.constructor.EVENT.LAYER_CREATE, self);
        }

        //+ 이벤트 추가
        if (defined(self._idReloaded)) {
            selfLayer.addEventListener((/** @type {typeof U3dLayer} */ (self.constructor)).EVENT.LOADED, self._idReloaded);
        }
    }

    /**
     * 레이어 초기화 여부를 확인합니다.
     *
     * @returns {boolean} 초기화 했다면 true, 안 했으면 false
     */
    isInitialized() {
        return this._initialized;
    }

    /**
     * @returns {boolean}
     *
     * @ignore
     */
    isMapDisposed() {
        return this._disposed;
    }

    /**
     * Layer에 Object3D 객체를 추가합니다. <br>
     * Object3D는 three.js에서 화면에 그려지는 모든 것(Mesh, Group, Light 등)의 공통 부모 타입입니다.
     * 추가한 객체는 레이어의 Scene에 직접 들어가며 타일 캐시로 관리되지 않으므로, 해제는 호출자가 책임집니다.
     * Object3D가 아닌 값을 넘기면 안내 메시지만 남기고 추가하지 않습니다.
     *
     * @param {import('three').Object3D} object 레이어와 함께 표시할 three.js 객체(월드 좌표 EPSG:3857 기준으로 배치)
     */
    add(object) {
        const self = this;
        if (!object || !(object instanceof Object3D)) {
            __GInfo__(self, '추가 대상이 올바르지 않습니다.', '2706879');
            return;
        }
        self._scene.add(object);
    }

    /**
     * Layer에서 Object3D 객체를 제거합니다. <br>
     * Scene에서 분리만 하며 geometry·material 등 자원은 해제하지 않으므로 필요하면 호출자가 dispose해야 합니다.
     * Object3D가 아닌 값을 넘기면 안내 메시지만 남기고 아무 것도 하지 않습니다.
     *
     * @param {import('three').Object3D} object `add()`로 추가했던 three.js 객체
     */
    remove(object) {
        const self = this;
        if (!object || !(object instanceof Object3D)) {
            __GInfo__(self, '제거 대상이 올바르지 않습니다.', '2707266');
            return;
        }
        self._scene.remove(object);
    }

    /**
     * 레이어 dispose 여부를 반환합니다.
     *
     * @returns {boolean} dispose 됐다면 true, 안 됐으면 false
     */
    isDisposed() {
        return this._disposed;
    }

    /**
     * @returns {boolean}
     *
     * @ignore
     */
    getInitLoading() { //TODO 사용 안하면 검토 후 제거
        return this._initLoading;
    }

    /**
     * 레이어의 생성 시작 중이라는 속성값을 설정합니다.
     *
     * @param {boolean} val 생성을 시작 했으면 true, 다 생성 후 종료 됐으면 false
     *
     * @ignore
     */
    setInitLoading(val) {
        this._initLoading = val;
    }

    /**
     * 레이어의 센터(Center) 월드 좌표(EPSG:3857)를 반환합니다. <br>
     * 레이어 범위(`rectangle`)가 있고 앱에 등록되어 있으면 범위의 중심을, 그렇지 않고 하위 레이어가 `getBoundingBox()`를 제공하면
     * 경계 상자의 중심을 반환합니다. 둘 다 없으면 null입니다.
     *
     * @returns {GooglePositionVector3 | null} 센터(Center) 월드 좌표. 새로 만든 객체이므로 자유롭게 수정할 수 있으며, 중심을 정할 수 없으면 null
     */
    getCenter() {
        const self = this;

        if (defined(self._rectangle) && defined(self._drawArg)) {
            return self._rectangle.centerMap();
        }

        if (hasBoundingBox(self)) {
            const boundingBox = /** @type {{getBoundingBox: function(): import('three').Box3}} */ (/** @type {unknown} */ (self)).getBoundingBox();
            if (boundingBox && boundingBox.min && boundingBox.max) {
                const center = new Vector3();
                center.x = (boundingBox.min.x + boundingBox.max.x) / 2;
                center.y = (boundingBox.min.y + boundingBox.max.y) / 2;
                center.z = (boundingBox.min.z + boundingBox.max.z) / 2;
                return center;
            }
        }

        return null;
    }

    /**
     * 레이어의 센터(Center) 위경도 좌표(EPSG:4326)를 반환합니다. <br>
     * `getCenter()`의 월드 좌표를 위경도로 변환합니다. 중심을 정할 수 없으면 "레이어 준비 안 됨" 오류 메시지를 남기고 null을 반환합니다.
     *
     * @returns {GeoPositionVector3 | null} 센터(Center) 위경도 좌표(x: 경도, y: 위도, z: 높이). 중심을 정할 수 없으면 null
     */
    getCenterGeographic() {
        const worldCenter = this.getCenter();
        if (!worldCenter) {
            U3dMessage.error(this._classtype, U3dMessage.CNT.CMM.NOT_READY_LAYER,'1328838');
            return null;
        }
        return UMathEngine.getGoogleToGeographic(worldCenter.x, worldCenter.y, worldCenter.z);
    }

    /**
     * @returns {boolean}
     *
     * @ignore
     */
    isUpdate() {
        if (!defined(this._workBuffer))
            return true;

        return Object.keys(this._workBuffer).length > 0;
    }

    /**
     * 입력받은 Frustum 과 레이어의 바운딩박스가 교차하는지 여부를 반환합니다. <br>
     * Frustum(절두체)은 카메라에 실제로 보이는 공간 영역이며, 이 판정으로 화면 밖 레이어의 처리를 건너뛸 수 있습니다.
     * 레이어에 범위가 지정되지 않아 바운딩박스가 없으면 항상 true(보이는 것으로 간주)를 반환합니다.
     *
     * @param {import('three').Frustum} frustum 카메라의 가시 영역(월드 좌표 EPSG:3857 기준)
     * @returns {boolean} 가시 영역과 레이어 범위가 겹치면 true. frustum이 없으면 false
     */
    intersectFrustum(frustum) {
        if (!defined(frustum))
            return false;

        const self = this;
        if (!defined(self._box3))
            return true;

        return frustum.intersectsBox(/** @type {import('three').Box3} */ (self._box3));
    }

    /**
     * 레이어의 전체 캐시 키를 반환합니다.
     *
     * @returns {Array<string>} 캐시 키 목록. 캐시를 사용하지 않는 레이어(`cache: false`)면 빈 배열
     */
    getCacheKeys() {
        if (!defined(this._cache))
            return [];

        return this._cache.getKeys();
    }

    /**
     * 레이어 캐시에 보관 중인 타일 메시 수를 반환합니다.
     *
     * @returns {number} 캐시된 항목 수. 캐시를 사용하지 않는 레이어면 0
     */
    getCacheLength() {
        const self = this;
        if (!defined(self._cache))
            return 0;

        const array = /** @type {UCache} */ (self._cache).getKeys();
        if (Array.isArray(array))
            return array.length;

        return 0;
    }

    /**
     * 타일을 입력받아 해당 타일의 취소(cancel) 작업 객체를 등록합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} value 타일 작업을 취소할 때 `reject`(또는 `cancel`)가 호출되는 대기 객체. 같은 타일에 다시 등록하면 이전 값을 덮어씁니다
     */
    setCancelByTile(tile, value) {
        const key = this.createKeyByTile(tile);
        this._cancelTiles[key] = value;
    }

    /**
     * 타일을 입력받아 등록된 취소(cancel) 작업 객체를 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @returns {DeferredObject<import('@U3dQuadTile').U3dQuadTile> | undefined} `setCancelByTile` 로 등록한 취소 작업 객체. 등록된 것이 없으면 `undefined` 입니다
     */
    getCancelByTile(tile) {
        const key = this.createKeyByTile(tile);
        return this._cancelTiles[key];
    }

    /**
     * 한 번만 수행되는 이벤트 리스너를 등록합니다. 처음 이벤트가 발생해 콜백이 실행되면 자동으로 제거됩니다.
     *
     * @override
     *
     * @param {string} event 이벤트 종류. 이 레이어가 dispatch하는 이벤트는 `U3dLayer.EVENT`(`U3dLayerEMD`)의 값이며, 하위 레이어는 이벤트를 추가할 수 있습니다
     * @param {EventCallBack} callback 이벤트가 발생했을 때 한 번 실행되는 콜백 함수
     * @param {string} [name] 리스너를 식별하는 이름. `off(event, name)`이나 `unkey(event, name)`으로 제거할 때 사용합니다
     * @returns {string} 입력한 `name`을 그대로 반환하며, 생략했으면 빈 문자열
     */
    once(event, callback, name) {
        name = name || '';
        this.on(event, callback, true, name);
        return name;
    }

    /**
     * 이벤트 리스너를 등록합니다.
     *
     * @override
     *
     * @param {string} event 이벤트 종류. 이 레이어가 dispatch하는 이벤트는 `U3dLayer.EVENT`(`U3dLayerEMD`)의 값이며, 하위 레이어는 이벤트를 추가할 수 있습니다
     * @param {EventCallBack} callback 이벤트가 발생할 때마다 실행되는 콜백 함수
     * @param {boolean} [once] true면 첫 발생 후 리스너를 자동 제거합니다
     * @param {string} [name] 리스너를 식별하는 이름. `off(event, name)`이나 `unkey(event, name)`으로 제거할 때 사용합니다
     * @returns {string} 입력한 `name`을 그대로 반환하며, 생략했으면 빈 문자열
     */
    on(event, callback, once, name) {
        name = name || '';
        UEventDispatcher.prototype.on.call(this, event, callback, once, name);
        // if (defined(this._eventHandler))
        //     this._eventHandler.on(event, callback, once);
        return name;
    }

    /**
     * 이벤트 리스너를 제거합니다. <br>
     * `event`만 넘기면 그 이벤트의 모든 리스너를, 둘 다 생략하면 이 레이어의 모든 리스너를 제거합니다.
     *
     * @override
     *
     * @param {string} [event] 이벤트 종류. 이 레이어가 dispatch하는 이벤트는 `U3dLayer.EVENT`(`U3dLayerEMD`)의 값이며, 하위 레이어는 이벤트를 추가할 수 있습니다
     * @param {Function | string} [callback] 제거할 리스너. 등록한 콜백 함수 자체 또는 등록 시 지정한 `name`
     */
    off(event, callback) {
        UEventDispatcher.prototype.off.call(this, event, /** @type {Function | undefined} */ (callback));
        // if (defined(this._eventHandler))
        //     this._eventHandler.off(event, callback);
    }

    /**
     * 키 값으로 명시한 이벤트 리스너를 제거합니다.
     *
     * @override
     *
     * @param {string} event 이벤트 종류. 이 레이어가 dispatch하는 이벤트는 `U3dLayer.EVENT`(`U3dLayerEMD`)의 값이며, 하위 레이어는 이벤트를 추가할 수 있습니다
     * @param {string} key 제거할 리스너의 이름(`on`/`once`에 넘긴 `name`)
     */
    unkey(event, key) {
        UEventDispatcher.prototype.unkey.call(this, event, key);
        // if (defined(this._eventHandler))
        //     this._eventHandler.unkey(event, key);
    }

    /**
     * 타일을 입력받아 등록된 취소(cancel) 작업 객체를 제거합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     */
    removeCancelByTile(tile) {
        const self = this;
        const key = self.createKeyByTile(tile);
        if (!defined(self.getCancelByTile(tile)))
            return;

        self._cancelTiles[key] = undefined;
        delete self._cancelTiles[key];
    }

    /**
     * 타일을 입력받아 해당 타일 Load를 취소합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile load를 취소하려는 tile
     *
     * @ignore
     */
    cancelTile(tile) {
        const self = this;
        const key = self.createKeyByTile(tile);
        self.cancelTileByKey(key);
    }

    /**
     * 타일 Key를 입력받아 레이어에 랜더링하는 작업을 취소합니다.
     *
     * @param {string} key
     *
     * @ignore
     */
    cancelTileByKey(key) {
        const self = this;
        if (defined(self._cancelTiles[key])) {
            if (Array.isArray(self._cancelTiles[key])) {
                const cancels = self._cancelTiles[key];
                //+ 건물정적로딩 //////////////////////////
                for (let i = 0; i < cancels.length; i++) {
                    if (defined(cancels[i]) && defined(cancels[i].cancel))
                        cancels[i].cancel();

                    if (defined(cancels[i]) && defined(cancels[i].reject))
                        cancels[i].reject();

                    if (defined(cancels[i]) && defined(cancels[i].resolve) && typeof cancels[i].resolve === 'function')
                        cancels[i].resolve(false);

                    if (defined(cancels[i]) && typeof cancels[i] === 'function')
                        cancels[i](key);
                }
                delete self._cancelTiles[key];
            } else {
                if (defined(self._cancelTiles[key]) && defined(self._cancelTiles[key].cancel))
                    self._cancelTiles[key].cancel();
                if (defined(self._cancelTiles[key]) && defined(self._cancelTiles[key].reject))
                    self._cancelTiles[key].reject();
                if (defined(self._cancelTiles[key]) && typeof self._cancelTiles[key] === 'function')
                    self._cancelTiles[key](key);

                delete self._cancelTiles[key];
            }
        }
    }

    /**
     * 모든 타일의 작업을 취소합니다.
     */
    cancelAllTile() {
        const self = this;
        const keys = Object.keys(self._cancelTiles);
        for (const key of keys) {
            self.cancelTileByKey(key);
        }
        self._cancelTiles = {};
    }

    /**
     * 타일의 상태를 레이어의 프로퍼티(_stateTiles)에 저장합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {number} state 타일의 상태
     *
     * @example
     * UDEF.TILE_STATE._none : 0
     * UDEF.TILE_STATE._start : 1
     * UDEF.TILE_STATE._loading : 2
     * UDEF.TILE_STATE._end : 3
     * UDEF.TILE_STATE._failed : 4
     *
     * @ignore
     */
    setStateTile(tile, state) {
        const key = this.createKeyByTile(tile);
        this._stateTiles[key] = state;
    }

    /**
     * 타일의 상태를 담고 있는 레이어의 프로퍼티(_stateTiles)의 길이(Length)를 반환합니다.
     *
     * @returns {number} length
     *
     * @ignore
     */
    getStateTileLength() {
        return Object.keys(this._stateTiles).length;
    }

    /**
     * 타일의 상태를 담고 있는 레이어의 프로퍼티(_stateTiles)를 반환합니다. <br>
     * 상태 값은 `UDEF.TILE_STATE`의 코드(0 없음, 1 시작, 2 로딩 중, 3 완료, 4 실패)입니다.
     *
     * @returns {Record<string, number>} 타일 키를 키로, 상태 코드를 값으로 갖는 객체. 내부 객체를 그대로 반환하므로 수정하면 레이어 상태가 바뀝니다
     */
    getStateTiles() {
        return this._stateTiles;
    }

    /**
     * 타일의 상태를 담고 있는 레이어의 프로퍼티(_stateTiles)의 키 값들을 반환합니다.
     *
     * @returns {Array<string>} 타일 Key 값
     */
    getStateTileKeys() {
        return Object.keys(this._stateTiles);
    }

    /**
     * 타일의 상태를 콘솔에 출력합니다.
     *
     * @param {boolean} [print=true] 콘솔 출력 여부. true면 출력합니다.
     * @returns {number} 현재 구현은 집계하지 않고 항상 0을 반환합니다. 출력한 타일 수는 `getStateTileLength()`로 확인하세요
     */
    printStateTiles(print) {
        if (!defined(print)) print = true;

        let count = 0;
        const keys = Object.keys(this._stateTiles);
        for (let i = 0; i < keys.length; i++) {
            if (print) console.info(keys[i] + ': ' + this._stateTiles[keys[i]]);
        }
        if (print) console.info('Length: ' + this.getStateTileLength());
        return count;
    }

    /**
     * 완료(end)되지 않은 타일들의 키 값과 상태를 콘솔에 출력합니다.
     *
     * @param {boolean} [print=true] 콘솔 출력 여부. true면 출력합니다.
     * @returns {number} 완료(end)되지 않은 타일들의 수
     */
    printNotCompleteStateTiles(print) {
        if (!defined(print)) print = true;

        let count = 0;
        const keys = Object.keys(this._stateTiles);
        for (let i = 0; i < keys.length; i++) {
            if (this._stateTiles[keys[i]] !== UDEF.TILE_STATE._end) {
                if (print) console.info(keys[i] + ': ' + this._stateTiles[keys[i]]);
                count++;
            }
        }
        if (print) console.info('Not Completed Length: ' + count);
        return count;
    }

    /**
     * 타일 Key 값을 입력받아 타일의 상태를 설정합니다.
     *
     * @param {string} key 타일 Key
     * @param {number} state 타일 상태
     *
     * @example
     * let tileKey = '151-22'
     * let state = UDEF.TILE_STATE._end // 3
     * layer.setStateTileByKey(tileKey, state);
     *
     * @ignore
     */
    setStateTileByKey(key, state) {
        this._stateTiles[key] = state;
    }

    /**
     * 전체 타일의 상태를 초기화합니다. <br>
     * 레이어의 _stateTiles 프로퍼티를 비웁니다.
     *
     * @ignore
     */
    resetStateTileAll() {
        //어짜피 다음 줄에서 this._stateTiles = {}; 로 재생성하므로 delete 자체 의미 거의 없음. (ts 오류만 남)
        //delete this._stateTiles;
        this._stateTiles = {};
    }

    /**
     * 타일을 입력받아 해당 타일의 상태를 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @returns {number | undefined} `UDEF.TILE_STATE` 상태 코드. 상태가 기록되지 않은 타일이면 undefined
     */
    getStateTile(tile) {
        const key = this.createKeyByTile(tile);
        return this._stateTiles[key];
    }

    /**
     * 타일 Key를 입력받아 해당 타일의 상태를 반환합니다.
     *
     * @param {string} key 타일 Key
     * @returns {number | undefined} `UDEF.TILE_STATE` 상태 코드. 상태가 기록되지 않은 타일이면 undefined
     */
    getStateTileByKey(key) {
        return this._stateTiles[key];
    }

    /**
     * 타일을 입력받아 해당 타일의 상태를 초기화합니다. <br>
     * 레이어의 _stateTiles 프로퍼티에서 해당 타일의 상태를 제거합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     *
     * @ignore
     */
    resetStateTile(tile) {
        delete this._stateTiles[this.createKeyByTile(tile)];
    }

    /**
     * 타일 Key를 입력받아 해당 타일의 상태를 초기화합니다. <br>
     * 레이어의 _stateTiles 프로퍼티에서 해당 타일의 상태를 제거합니다.
     *
     * @param {string} key
     *
     * @ignore
     */
    resetStateTileByKey(key) {
        delete this._stateTiles[key];
    }

    /**
     * 타일의 상태를 초기화하여 작업을 재시작할 수 있게 합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     */
    restartTile(tile) {
        this.resetStateTile(tile);
    }

    /**
     * 레이어의 업데이트 작업(Tile Process)이 수행되고 있는지 여부를 반환합니다. <br>
     * true면 한 개 이상의 Process가 수행 중인 상태이고, false면 수행 중인 Process가 없는 상태입니다.
     *
     * @returns {boolean} Process 수행 여부
     *
     * @ignore
     */
    getWorking() {
        const self = this;
        if (defined(self._tileProcess)) {
            if (self._tileProcess.getWorkingCount() > 0)
                return true;
        }
        return false;
    }

    /**
     * 레이어의 작업(Tile Process) 수를 반환합니다.
     *
     * @returns {number} Tile Process 수
     *
     * @ignore
     */
    getWorkingCount() {
        const self = this;
        if (defined(self._tileProcess))
            return self._tileProcess.getWorkingCount();

        return 0;
    }

    /**
     * 레이어의 타일 프로세스에서 처리 중이거나 대기열에 있는 작업 수를 반환합니다. <br>
     * "Level 2"는 처리 중인 작업 수(`getWorkingCount`)에 대기열 길이를 더한 값입니다.
     *
     * @returns {number} 처리 중 + 대기 중 작업 수. 프로세스가 연결되지 않았으면 0
     */
    getWorkingLevel2() {
        const self = this;
        if (defined(self._tileProcess))
            return self._tileProcess.getWorkingLevel2();

        return 0;
    }

    /**
     * 레이어의 타일 프로세스에서 처리 중이거나 대기열에 있는 작업 수를 반환합니다. <br>
     * 현재 구현은 `getWorkingLevel2()`와 같은 값이며, `LOADED` 이벤트 발생 시점을 판단하는 데 사용됩니다.
     *
     * @returns {number} 처리 중 + 대기 중 작업 수. 프로세스가 연결되지 않았으면 0
     */
    getWorkingLevel3() {
        const self = this;
        if (defined(self._tileProcess))
            return self._tileProcess.getWorkingLevel3();

        return 0;
    }

    /**
     * @param {object} [opt] 쿼드 타일 업데이트(working) 옵션
     * @param {number} [opt.distance=2000] 쿼드 타일 업데이트 허용 거리
     * @returns {number} 현재 남은 작업(Tile Process) 수
     *
     * @ignore
     */
    getWorkingInDistance(opt) {
        opt = opt || {distance: 2000};
        const self = this;
        if (defined(self._tileProcess))
            return self._tileProcess.getWorkingInDistance?.(opt) ?? 0;

        return 0;
    }

    /**
     * 레이어의 타일 프로세스에 타일을 추가합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 추가할 타일
     * @returns {boolean} 추가 성공 시 true, 실패 시 false
     *
     * @ignore
     */
    addProcessByTile(tile) {
        const self = this;
        if (defined(self._tileProcess)) {
            self._tileProcess.add(tile);
            return true;
        }

        return false;
    }

    /**
     * 타일을 입력받아 타일 키를 생성합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @returns {string} 성공 시 타일 키, 실패 시 undefined
     *
     * @ignore
     */
    createKeyFromTile(tile) {
        return tile.getKey();
    }

    /**
     * 입력받은 타일에 해당하는 캐시 데이터를 반환합니다. <br>
     * 캐시가 존재하면 해당 캐시를, 없으면 undefined 를 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @returns {import('@UMesh').UMesh | undefined} 성공 시 캐시, 실패 시 undefined
     */
    getCache(tile) {
        const self = this;
        if (defined(self._cache)) {
            const cache = /** @type {import('@union3d/core/UCache').UCache} */ (self._cache);
            return cache.get(self.createKeyFromTile(tile));
        }

        return undefined;
    }

    /**
     * 키 값으로 레이어의 캐시를 반환합니다.
     *
     * @param {string} key 캐시 키
     * @returns {import('@UMesh').UMesh | undefined} 레이어 캐시 값
     */
    getCacheByKey(key) {
        const self = this;
        if (defined(self._cache)) {
            return /** @type {import('@union3d/core/UCache').UCache} */ (self._cache).get(key);
        }

        return undefined;
    }

    /**
     * 이 레이어를 자식으로 포함하는 그룹 레이어를 반환합니다. <br>
     * 그룹 레이어(`U3dGroupLayer`)는 여러 레이어를 묶어 함께 표시·숨김하는 상위 레이어입니다.
     *
     * @returns {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer | undefined} 부모 그룹 레이어. 그룹에 속하지 않으면 undefined
     */
    getGroupLayer() {
        return this._groupLayer;
    }

    /**
     * 이 레이어가 그룹 레이어에 속해 있는지 여부를 반환합니다.
     *
     * @returns {boolean} 부모 그룹 레이어가 있으면 true
     */
    isGroupLayer() {
        return !!defined(this._groupLayer);
    }

    /**
     * 레이어의 그룹 레이어를 설정합니다.
     *
     * @param {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer} group 그룹 레이어
     * @returns {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer}
     *
     * @ignore
     */
    setGroupLayer(group) {
        return (this._groupLayer = group);
    }

    /**
     * 타일 결과물(메시)이 모이는 레이어의 그룹 객체를 반환합니다. <br>
     * `UGroup`은 three.js `Group`을 확장한 컨테이너로 레이어 Scene 안에 있으며, 캐시된 타일 메시가 여기에 추가·제거됩니다.
     * `show(false)`나 `refresh()`가 호출되면 비워지므로 자식 목록을 오래 보관하지 않아야 합니다.
     *
     * @returns {import('@UGroup').UGroup} 타일 메시 컨테이너(레이어 내부 객체)
     */
    getGroup() {
        return this._group;
    }

    /**
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     *
     * @ignore
     */
    getTileFromScene(tile) {}

    /**
     * 입력받은 타일을 가시화 타일들을 담는 _visibleTiles 프로퍼티에 추가합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 추가할 타일
     *
     * @ignore
     */
    addTileFromScene(tile) {}

    /**
     * 레이어의 _visibleTiles 프로퍼티에서 해당 타일을 제거합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 제거할 타일
     * @param {boolean} [skipHandoff=false] 실패한 LOD 전환 원복 시 제거 보류를 건너뛸지 여부입니다.
     *
     * @ignore
     */
    removeTileFromScene(tile, skipHandoff = false) {}

    /**
     * LOD 전환 준비가 끝나지 않은 타일의 화면 노출만 보류합니다.
     *
     * `removeTileFromScene`과 달리 타일 작업 상태와 terrain handoff를 폐기하지 않으므로,
     * 진행 중인 비동기 합성이 다음 frame에 그대로 이어집니다. 이 hook을 구현하지 않은
     * 레이어는 기존처럼 강제 제거 경로로 원복됩니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 노출을 보류할 타일입니다.
     * @returns {boolean} 준비 상태를 유지한 채 노출만 보류했으면 `true`입니다.
     *
     * @ignore
     */
    suspendTilePresentation(tile) {
        return false;
    }

    /**
     * 레이어의 가시화 상태를 반환합니다.
     *
     * @returns {boolean} 화면에 표시되는 상태면 true
     */
    getVisible() {
        return this._visible;
    }

    /**
     * 레이어 가시화 여부를 설정합니다.
     *
     * @param {boolean} visible 가시화 여부. true면 가시화하고, false면 비가시화합니다.
     *
     * @ignore
     */
    setVisible(visible) {
        this._visible = visible;
    }

    /**
     * 위경도(EPSG:4326) 값을 담은 배열을 입력받아 Google Rectangle 로 전환합니다.
     *
     * @param {Array<number>} array 위경도 좌표(EPSG:4326) 배열. ex) [126.939, 37.532 ... ]
     * @returns {import('@UGeoRect').UGeoRect | undefined} Google Rectangle
     *
     * @ignore
     */
    convertGeographicToGoogleRectangle(array){
        return INTERNAL.convertGeographicToGoogleRectangle(array);
    }

    /**
     * 좌표 배열을 입력받아 Google Rectangle 로 전환합니다.
     *
     * @param {Array<number>} array 좌표 배열. [minX, minY, maxX, maxY]
     * @returns {import('@UGeoRect').UGeoRect | undefined} Google Rectangle
     *
     * @ignore
     */
    convertRectangle(array) {
        return INTERNAL.convertRectangle(array);
    }

    /**
     * 랜더링 우선순위(Render Order)를 설정합니다. <br>
     * 값이 큰 레이어가 나중에 그려져 같은 위치에서는 위에 보입니다. 이 메서드는 레이어에 저장된 값만 바꾸며,
     * 이미 생성된 Scene·그룹·타일에는 반영하지 않으므로 생성 옵션 `renderOrder`로 지정하는 것을 권장합니다.
     *
     * @param {number} val 랜더링 우선순위. 클수록 나중에 그려집니다
     */
    setRenderOrder(val) {
        this._renderOrder = val;
    }

    /**
     * 랜더링 우선순위(Render Order)를 반환합니다.
     *
     * @returns {number} 랜더링 우선순위. 클수록 나중에 그려져 위에 보입니다
     */
    getRenderOrder() {
        return this._renderOrder;
    }

    /**
     * 타일의 랜더링 우선순위(Render Order)를 반환합니다.
     *
     * @returns {number} 랜더링 우선순위
     *
     * @ignore
     */
    getRenderOrderAtTile() {
        return this.getRenderOrder();
    }

    /**
     * 레이어의 투명도를 `setOpacity()`로 바꾸기 전 값으로 되돌립니다. `setOpacity()`를 호출한 적이 없으면 아무 것도 하지 않습니다.
     */
    resetOpacity() {
        if (defined(this._oriOpacity)) {
            this.setOpacity(this._oriOpacity);
            delete this._oriOpacity;
        }
    }

    /**
     * 레이어의 투명도를 설정합니다. <br>
     * 처음 호출할 때 이전 값을 보관해 두므로 `resetOpacity()`로 되돌릴 수 있습니다. 이 클래스는 값과 반투명 여부만 저장하며,
     * 실제 재질에 반영하는 것은 하위 레이어의 갱신 처리에서 수행합니다.
     *
     * @param {number} val 투명도. 0(완전 투명)~1(불투명) 범위로 잘라내며(clamp), undefined면 무시합니다
     */
    setOpacity(val) {
        if (!defined(val)) return;
        if (val > 1) val = 1;
        else if (val < 0) val = 0;

        const self = this;
        if (!self._oriOpacity)
            self._oriOpacity = self._opacity;

        self._opacity = val;
        self._transparent = (self._opacity < 1);
    }

    /**
     * 레이어의 투명도를 반환합니다.
     *
     * @returns {number} 투명도. 0(완전 투명)~1(불투명)
     */
    getOpacity() {
        return this._opacity;
    }

    /**
     * 로딩(Loading) 중인 타일들의 수를 반환합니다.
     *
     * @returns {number} 로딩 중인 타일들의 수
     */
    getLoadingTile() {
        return this._countloadingTile;
    }

    /**
     * 레이어에 로딩 중인 타일이 존재하는지 여부를 반환합니다. <br>
     * true면 존재, false면 존재하지 않습니다.
     *
     * @returns {boolean} 존재 여부
     */
    isLoadingTile() {
        return this._countloadingTile > 0;
    }

    /**
     * 로딩(Loading) 중인 타일들의 수를 1만큼 증가(Plus)시킵니다.
     *
     * @ignore
     */
    plusLoadingTile() {
        this._countloadingTile++;
    }

    /**
     * 로딩(Loading) 중인 타일들의 수를 1만큼 감소(Minus)시킵니다.
     *
     * @ignore
     */
    minusLoadingTile() {
        this._countloadingTile--;
    }

    /**
     * 레이어의 매 프레임 업데이트 훅 함수입니다. 자식 클래스에서 오버라이드하여 구현합니다. <br>
     * 앱이 렌더링 루프에서 보이는 레이어마다 호출하며, 기본 구현은 아무 것도 하지 않습니다.
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 현재 프레임의 렌더링 문맥(카메라, 절두체, 타일 캐시, 조명 등 공유 상태)
     */
    update(drawArg) {}

    /**
     * 레이어 변경(change) 훅 함수입니다. 자식 클래스에서 오버라이드하여 구현합니다. <br>
     * 카메라 이동 등으로 보이는 영역이 바뀌었을 때 호출되며, 기본 구현은 아무 것도 하지 않습니다.
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 현재 프레임의 렌더링 문맥(카메라, 절두체, 타일 캐시, 조명 등 공유 상태)
     */
    change(drawArg) {}

    /**
     * 입력받은 범위와 해당 layer 의 교차 여부를 반환합니다.
     *
     * @param {import('@UGeoRect').UGeoRect} rect3d WorldPosition(EPSG:3857) 값으로 지정된 범위 객체
     * @returns {boolean} 범위가 겹치면 true. 레이어에 범위가 지정되지 않았으면 항상 true
     */
    intersects3D(rect3d) {
        const self = this;

        const layerRect3d = self._rectangle3d;
        if (!defined(layerRect3d))
            return true;

        return layerRect3d.intersects(rect3d);
    }

    /**
     * 입력받은 범위와 해당 layer 의 교차 여부를 반환합니다.
     *
     * @param {import('@UGeoRect').UGeoRect} rect EPSG:3857 의 좌표 값으로 지정된 범위 객체
     * @param {number} level 범위에 해당하는 타일 레벨(줌 단계). 레이어의 `minLevel`보다 작으면 교차하지 않는 것으로 봅니다
     * @returns {boolean} 범위가 겹치면 true. 레이어에 범위가 지정되지 않았으면 레벨 조건만 통과하면 true
     */
    intersects(rect, level) {
        const self = this;
        if (level < self._minlevel)
            return false;

        const layerRect = self._rectangle;
        if (!defined(layerRect))
            return true;

        return layerRect.intersects(rect);
    }

    /**
     * x, y 위치 좌표와 레벨 값을 입력받아 해당 지점이 레이어에 포함되는지 체크합니다.
     *
     * @param {number} x 3D 월드 x좌표(EPSG:3857)
     * @param {number} y 3D 월드 y좌표(EPSG:3857)
     * @param {number} level 타일 레벨(줌 단계). 레이어의 `minLevel`~`maxLevel` 범위를 벗어나면 포함하지 않는 것으로 봅니다
     * @returns {boolean} 지점이 레이어 범위 안이면 true. 레이어에 범위가 지정되지 않았으면 레벨 조건만 통과하면 true
     */
    contain(x, y, level) {
        const self = this;
        if (level < self._minlevel || level > self._maxlevel)
            return false;

        const layerRect = self._rectangle;
        if (!defined(layerRect))
            return true;

        return layerRect.contain(x, y);
    }

    /**
     * @param {import('@UDrawArg').UDrawArg} [drawArg]
     *
     * @ignore
     */
    render(drawArg) {}

    /**
     * 레이어의 가시화(show/hide) 여부를 설정합니다. <br>
     * 상태가 바뀔 때만 동작하며 `SHOW`/`HIDE` 이벤트를 dispatch합니다. 숨길 때는 타일 그룹을 비우고 타일 상태를 초기화하며
     * 진행 중인 타일 작업을 모두 취소합니다. 보이게 하면 다음 `LOADED` 이벤트까지 초기 로딩 상태로 표시됩니다.
     *
     * @param {boolean} show true면 표시하고 false면 숨깁니다
     * @param {boolean} [refresh=true] true면 앱에 즉시 다시 그리기(`forceUpdate`)를 요청합니다
     */
    show(show, refresh = true) {
        const self = this;

        if (self._visible === show)
            return;

        self._visible = show;

        self.setInitLoading(true);

        if (self._visible === false) {
            if (self._group && self._group instanceof UGroup) {
                const app = /** @type {{isPostProcess: () => boolean, getRenderer: () => {getPass: (pass: unknown) => {instance: {selectedObjects: Array<import('three').Object3D>}}}}} */ (/** @type {unknown} */ (self._app));
                if (app.isPostProcess()) {
                    const outlinePass = app.getRenderer().getPass(UDEF.POSTPASS.OUTLINE);
                    const selected = outlinePass.instance.selectedObjects;
                    self._group.traverse(/** @param {import('three').Object3D} child */ child => {
                        if (selected.indexOf(child) > -1) {
                            selected.splice(selected.indexOf(child), 1);
                        }
                    });
                }
                self._group.clear();
            }

            self.resetStateTileAll();
            self.cancelAllTile();
        }

        if (refresh && defined(self._app))
            /** @type {{forceUpdate: () => void}} */ (/** @type {unknown} */ (self._app)).forceUpdate();

        if (show) {
            self.once((/** @type {typeof U3dLayer} */ (self.constructor)).EVENT.LOADED, function () {
                self.setInitLoading(false);
            });
        }
    }

    /**
     * 레이어를 처분(dispose)합니다. <br>
     * `BEFORE_DISPOSE` 이벤트를 dispatch한 뒤 디버그 헬퍼·타일 작업·Scene·캐시를 해제하고 `DISPOSE` 이벤트를 dispatch합니다.
     * 마지막에 이 레이어의 모든 이벤트 리스너가 제거되므로 `DISPOSE` 리스너는 그 전에 등록되어 있어야 합니다.
     * 해제 후에는 `isDisposed()`가 true가 되며 레이어를 다시 사용할 수 없습니다.
     *
     * @returns {Promise<boolean>} 해제가 끝나면 true로 완료되는 Promise
     */
    dispose() {
        /** @type {DeferredObject<boolean>} */
        const promise = deferred();
        const self = this;
        const selfLayer = /** @type {{dispatch: (function(string, ...unknown): void), removeEventListener: (function(unknown): void)} & Partial<{_eventHandler: {dispose: (function(): void)}}>} */ (/** @type {unknown} */ (self));

        selfLayer.dispatch((/** @type {typeof U3dLayer} */ (self.constructor)).EVENT.BEFORE_DISPOSE);
        self.debugBound(false);

        //+ 이벤트 해제
        if (defined(self._idReloaded))
            selfLayer.removeEventListener(self._idReloaded);

        self._idReloadEnd = undefined;

        /** @type {{ _name: string | undefined }} */ (/** @type {unknown} */ (self))._name = undefined;
        self._camera = undefined;
        self._stateTiles = {};
        self._workBuffer = {};

        if (defined(selfLayer._eventHandler)) {
            selfLayer._eventHandler.dispose();
            selfLayer._eventHandler = undefined;
        }

        self.cancelAllTile();

        if (defined(self._scene))
            self._scene.dispose();

        (/** @type {{_scene: import('@UScene').UScene | undefined}} */(/** @type {unknown} */(self)))._scene = undefined;

        if (defined(self._tileProcess))
            delete /** @type {Record<string, unknown>} */(/** @type {unknown} */(self))._tileProcess;

        self._tileProcess = undefined;

        self._visible = false;

        if (self._cache)
            /** @type {UCache} */ (self._cache).deleteAll(self, self.fncDeleteGroup);

        self._disposed = true;

        selfLayer.dispatch((/** @type {typeof U3dLayer} */ (self.constructor)).EVENT.DISPOSE);

        //+ layer 전체 이벤트 삭제
        self.off();

        promise.resolve(true);

        return promise;
    }

    /**
     * 저장하고 있는 캐시를 전부 제거합니다.
     *
     * @ignore
     */
    disposeCache() {
        const self = this;
        const keys = Object.keys(self._stateTiles);
        for (let i = 0; i < keys.length; i++) {
            self.disposeTileByKey(keys[i]);
        }
    }

    /**
     * 입력받은 타일을 처분(dispose)합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 제거할 타일
     * @param {Partial<{deletefunc: Function}>} [opt] 삭제 옵션
     *
     * @ignore
     */
    disposeTile(tile, opt) {
        if (!defined(tile)) return;

        opt = opt || {deletefunc: undefined};
        const self = this;
        const skey = self.createKeyByTile(tile);
        return self.disposeTileByKey(skey, opt);
    }

    /**
     * 타일 Key와 삭제 옵션을 입력받아 타일을 처분(dispose)합니다.
     *
     * @param {string} key 타일 Key
     * @param {Partial<{deletefunc: Function}>} [opt] 삭제 옵션
     *
     * @ignore
     */
    disposeTileByKey(key, opt = {deletefunc: undefined}) {
        const self = this;
        if (defined(self._cache)) {
            const mesh = /** @type {UCache} */ (self._cache).get(key);
            if (defined(mesh) && self._group) {
                self._group.remove(mesh);
                if (defined(opt.deletefunc))
                    /** @type {UCache} */ (self._cache).delete(self, key, opt.deletefunc);
                else
                    /** @type {UCache} */ (self._cache).delete(self, key, self.fncDeleteGroup);
            }
        }

        self.resetStateTileByKey(key);
        self.cancelTileByKey(key);
    }

    /**
     * tile 을 입력받아 key 를 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile key 를 반환받을 tile
     * @returns {string} tile 의 key
     *
     * @ignore
     */
    createKey(tile) {
        return tile.getKey();
    }

    /**
     * 입력받은 타일의 key 를 생성합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @returns {string} 타일 key
     *
     * @ignore
     */
    createKeyByTile(tile) {
        return tile.getKey();
    }

    /** @ignore */
    fncDeleteGroup() {}
    /**
     * 입력받은 타일의 텍스처를 생성하는 훅 함수입니다. 자식 클래스에서 오버라이드하여 구현합니다. <br>
     * `tileName`이 `IMAGE`인 레이어의 타일 프로세스가 타일마다 호출합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {object} [opt] 타일 프로세스가 전달하는 추가 정보. 형식은 하위 레이어가 정의합니다
     */
    createTexture(tile, opt) {}
    /**
     * 입력받은 타일의 높이(Height) 데이터를 생성하는 훅 함수입니다. 자식 클래스에서 오버라이드하여 구현합니다. <br>
     * `tileName`이 `HEIGHT`인 레이어의 타일 프로세스가 타일마다 호출합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {object} [opt] 타일 프로세스가 전달하는 추가 정보. 형식은 하위 레이어가 정의합니다
     */
    createHeight(tile, opt) {}
    /**
     * 입력받은 타일의 코멘트 데이터를 생성하는 훅 함수입니다. 자식 클래스에서 오버라이드하여 구현합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {object} [opt] 호출자가 전달하는 추가 정보. 형식은 하위 레이어가 정의합니다
     */
    createComment(tile, opt) {}
    /**
     * 입력받은 타일의 모델 데이터를 생성하는 훅 함수입니다. 자식 클래스에서 오버라이드하여 구현합니다. <br>
     * `tileName`이 `MODEL`인 레이어의 타일 프로세스가 타일마다 호출합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     */
    createModel(tile) {}

    /**
     * 레이어의 높이(Height) 갱신 훅 함수입니다. 자식 클래스에서 자체 시그니처로 오버라이드하여 구현합니다.
     *
     * @param {...any} args 자식 클래스에서 정의하는 인자들
     */
    updateHeight(...args) {}
    /**
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {object} [opt]
     *
     * @ignore
     */
    updateDetail(tile, opt) {}

    /**
     * 레이어의 메타데이터를 반환합니다.
     *
     * @override
     *
     * @returns {import('@UMeta').UMeta} 레이어 메타 정보
     *
     * @example
     * {
     *     attribute : undefined,
     *     child : Array(3),
     *     name : 'U3dLayer',
     *     value : undefined
     * }
     *
     * @ignore
     */
    getMetaData() {
        const meta = U3dObject.prototype.getMetaData.call(this);
        const self = this;
        const info = {
            name: /** @type {{_name: string}} */ (/** @type {unknown} */ (self))._name,
            type: self._type,
            classType: self._classtype,
            isCache: self._isCache,
            visible: self._visible,
            crs: self._crs,
            ext: self._ext,
            minLevel: self._minlevel,
            maxLevel: self._maxlevel,
            renderOrder: self._renderOrder,
            opacity: self._opacity,
            baseUrl: self._baseUrl,
            tileName: self._tileName,
            rectangle: self._rectangle,
            rectangle3d: self._rectangle3d
        };
        meta.addChild(info);
        return meta;
    }

    /**
     * app 에 레이어를 등록합니다.
     *
     * @param {import('@U3dApp').U3dApp} app APP
     *
     * @ignore
     */
    setApp(app) {
        const self = this;
        const _app = /** @type {{_camera: import('@UCamera').UCamera, _frustum: import('@UFrustum').UFrustum, _drawArg: import('@UDrawArg').UDrawArg, _quadtreeSet: import('@union3d/quadtree/U3dQuadSet').U3dQuadSet, _imageProcess: TileProcess, _heightProcess: TileProcess, _modelProcess: TileProcess, _userProcess: TileProcess}} */ (/** @type {unknown} */ (app));
        self._app = app;
        self._camera = _app._camera;
        self._frustum = _app._frustum;
        self._drawArg = _app._drawArg;
        self._quadtreeSet = _app._quadtreeSet;
        self._light = _app._drawArg.getLight();
        if (defined(self._group))
            self._group._drawArg = self._drawArg;
        const callback = self.getTileCallback();
        if (callback) {
            switch (this._tileName) {
                case UDEF.PROCESS.TYPE.IMAGE:
                    self._tileProcess = _app._imageProcess;
                    break;
                case UDEF.PROCESS.TYPE.HEIGHT:
                    self._tileProcess = _app._heightProcess;
                    break;
                case UDEF.PROCESS.TYPE.MODEL:
                    self._tileProcess = _app._modelProcess;
                    break;
                case UDEF.PROCESS.TYPE.USER:
                case UDEF.PROCESS.TYPE.MEASURE:
                    self._tileProcess = _app._userProcess;
                    break;
            }
            if (defined(self._tileProcess)) {
                self._tileProcess._callback.push({scope: self, fnc: callback});
            }
        }
        return self.initialize();
    }

    /**
     * 레이어의 타일 종류(IMAGE/HEIGHT/MODEL)에 따라 처리 콜백(createTexture/createHeight/createModel)을 반환합니다. <br>
     * 앱이 레이어를 등록할 때 이 콜백을 타일 프로세스에 연결하며, `USER`·`MEASURE` 등 그 외 종류는 undefined를 반환해 연결하지 않습니다.
     *
     * @returns {U3dLayerTileCallback | undefined} 타일 종류에 맞는 처리 콜백 함수(bind되지 않은 메서드이므로 호출 시 레이어를 this로 지정해야 합니다)
     */
    getTileCallback() {
        switch (this._tileName) {
            case UDEF.PROCESS.TYPE.IMAGE:
                return this.createTexture;
            case UDEF.PROCESS.TYPE.HEIGHT:
                return this.createHeight;
            case UDEF.PROCESS.TYPE.MODEL:
                return this.createModel;
        }
        return undefined;
    }

    /**
     * @param {number} [curTime]
     * @returns {number}
     *
     * @ignore
     */
    process(curTime) {
        return 0;
    }

    /**
     * 생성 옵션 `type`으로 지정한 레이어 종류 문자열을 반환합니다. <br>
     * 이 클래스는 값을 해석하지 않으며, 앱이나 하위 레이어가 레이어를 분류·검색하는 데 사용합니다.
     *
     * @returns {string} 생성 옵션 `type` 값. 지정하지 않았으면 'none'
     */
    getType() {
        return this._type;
    }

    /**
     * 레이어의 바운딩박스 디버그 헬퍼 표시 여부를 설정합니다.
     *
     * @param {boolean} isDebug 디버그 헬퍼 표시 여부
     * @param {number} [color=0xffff00] 헬퍼 색상
     * @returns {boolean} 처리 성공 여부
     */
    debugBound(isDebug, color = 0xffff00) {
        const self = /** @type {any} */ (this);
        if (!(this instanceof U3dLayer)) return false;

        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        if (isDebug) {
            if (self._debug.isWorking) return false;
            if (!self._debug.eventId)
                self._debug.eventId = self.getName() + '_debug';
            if (!self._debug.layerBound)
                self._debug.layerBound = new UBox3HelperGroup({name: self._debug.eventId});
            if (!self._debug.objectBound)
                self._debug.objectBound = new UBox3HelperGroup({name: self._debug.eventId});

            self._debug.isWorking = true;

            self.once((/** @type {typeof U3dLayer} */ (self.constructor)).EVENT.HIDE, () => {
                self.debugBound(false);
            }, self._debug.eventId);

            app.getExternalScene().add(self._debug.layerBound);
            app.getExternalScene().add(self._debug.objectBound);

            app.setRenderBefore(self._debug.eventId, () => {
                if (!self.isReady() || !self.getBoundingBox) return;
                let layerBox = self.getBoundingBox();
                if (!layerBox) return;

                const debugHelper = self._debug.layerBound.children[0];
                if (!debugHelper) {
                    layerBox = layerBox.clone();
                    layerBox.min.z = 0;
                    layerBox.max.z = 10000;
                    self._debug.layerBound.add(layerBox, 0xff0000);
                } else if (
                    debugHelper.box.min.x !== layerBox.min.x ||
                    debugHelper.box.min.y !== layerBox.min.y ||
                    debugHelper.box.max.x !== layerBox.max.x ||
                    debugHelper.box.max.y !== layerBox.max.y
                ) {
                    debugHelper.setBox(layerBox.clone());
                    debugHelper.box.min.z = 0;
                    debugHelper.box.max.z = 10000;
                }
            });
        } else {
            if (!self._debug.isWorking) return false;
            self._debug.isWorking = false;

            self.off((/** @type {typeof U3dLayer} */ (self.constructor)).EVENT.HIDE, self._debug.eventId);
            app.removeRenderBefore(self._debug.eventId);

            app.getExternalScene().remove(self._debug.layerBound);
            app.getExternalScene().remove(self._debug.objectBound);

            for (const child of self._debug.layerBound.children) {
                child.dispose();
            }
            self._debug.layerBound.clear();
            for (const child of self._debug.objectBound.children) {
                child.dispose();
            }
            self._debug.objectBound.clear();
        }
        return true;
    }

    /**
     * @returns {boolean}
     *
     * @ignore
     */
    __testCancelTile() {
        let result = true;
        if (Object.keys(this._cancelTiles).length > 0) {
            result = false;
        }
        return result;
    }

    /**
     * @returns {boolean}
     *
     * @ignore
     */
    __testStateTile() {
        const stateTileValue = Object.values(this._stateTiles);
        let result = true;
        const drawArg = this._drawArg;
        if(!defined(drawArg)) return false;

        if (drawArg._cacheTiles.keys()?.length < stateTileValue.length) {
            result = false;
        }

        for (const value of stateTileValue) {
            if (value < UDEF.TILE_STATE._end) {
                result = false;
            }
        }
        return result;
    }

    ////////// Private Methods //////////

    /**
     * @param {string} name
     * @param {boolean} [reset=false]
     *
     * @ignore
     */
    #checkWorking(name, reset = false) {
        const self = this;

        if (defined(reset) && reset === true) {
            self._countloading = _WAIT_COUNT;
        }

        if (self._workCheckId !== null && self._workCheckId !== undefined) clearTimeout(self._workCheckId);
        self._workCheckId = setTimeout(function () {
            const EVENT = (/** @type {typeof U3dLayer} */ (self.constructor)).EVENT;
            const selfCheck = /** @type {{hasEventType: (function(string): boolean), dispatchEvent: (function(string, ...unknown): void)} & Partial<{ready: (function((function(): void)): void), then: (function((function(): void)): void)}>} */ (/** @type {unknown} */ (self));
            if (!selfCheck.hasEventType(EVENT.LOADED)) {
                self._workCheckId = null;
                return;
            }

            if ((self.getWorkingLevel3?.() ?? 0) > 0) {
                self.#checkWorking(name, true);
                return;
            }

            if (self._countloading !== 0) {
                self._countloading = self._countloading - 1;
                self.#checkWorking(name);
                return;
            }

            if (defined(selfCheck.ready)) {
                selfCheck.ready(selfCheck.dispatchEvent.bind(selfCheck, EVENT.LOADED));
            } else if (defined(selfCheck.then)) {
                selfCheck.then(selfCheck.dispatchEvent.bind(selfCheck, EVENT.LOADED));
            } else {
                selfCheck.dispatchEvent(EVENT.LOADED);
            }

            self._workCheckId = null;
        }, _REFRESH_TIME);
    }

    /**
     * 레이어의 바운딩박스(Box3)를 계산합니다.
     *
     * @ignore
     */
    #computeBox3() {
        const self = this;
        if(defined(self._box3)
            && Number.isFinite(self._box3.min.x)
            && Number.isFinite(self._box3.max.x)) return;

        if (defined(self._rectangle) && defined(self._drawArg)) {
            const min = self._rectangle.ptLeftTop;
            const max = self._rectangle.ptRightBottom;
            self._box3 = new Box3(min, max);
        }
    }
}

/**
 * U3dLayer 의 자식 레이어 클래스가 getBoundingBox 함수를 가지고 있는지 검사합니다.
 *
 * @param {unknown} value U3dLayer 자식 레이어 클래스
 * @returns {boolean} getBoundingBox 함수 보유 여부
 *
 * @ignore
 */
function hasBoundingBox(value) {
    if (!value) {
        return false;
    }

    if (typeof value !== 'object') {
        return false;
    }

    if (!('getBoundingBox' in value)) {
        return false;
    }

    return typeof value.getBoundingBox === 'function';
}

export {U3dLayer};
