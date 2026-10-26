# U3dLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

영상·고도·모델·사용자 레이어가 공유하는 장면과 상태, 타일 관리 및 완료 통지의 기반이다.

### 1.2 책임 범위

가시성·투명도·공간 범위·타일 상태·취소·캐시·이벤트·앱 연결과 해제를 담당한다. 레이어 자체의 거부값만 Error로 정규화한다.

### 1.3 주요 동작 방식

생성자가 완료 인터페이스와 공통 자원을 준비하고 setApp이 문맥과 처리기를 연결하여 실제 하위 initialize를 호출한다. _initialized 표시와 레이어 완료 통지 시점은 별개다.

### 1.4 주요 사용처와 연계 대상

U3dApp의 레이어 등록과 영상·고도·모델·그룹·측정 레이어의 상속 기반으로 사용한다.

## 3. 정규 자연어 수도코드

```spec
U3dLayerEMD: U3dLayerEMI
    레이어 공통 이벤트 이름을 보관한다.

U3dLayerEMD.CREATE: string = 'layer-create'
    공통 초기화 이벤트 종류다.
U3dLayerEMD.LOADED: string = 'layer-loaded'
    준비 및 작업 완료 이벤트 종류다.
U3dLayerEMD.UPDATE: string = 'layer-update'
    하위 레이어 갱신 이벤트 종류다.
U3dLayerEMD.BEFORE_DISPOSE: string = 'layer-before-dispose'
    해제 전 이벤트 종류다.
U3dLayerEMD.DISPOSE: string = 'layer-dispose'
    해제 이벤트 종류다.
U3dLayerEMD.SHOW: string = 'layer-show'
    표시 이벤트 종류다.
U3dLayerEMD.HIDE: string = 'layer-hide'
    숨김 이벤트 종류다.

U3dLayerTileCallback 함수 타입 정의
    (tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
    인터페이스: 타일 처리 콜백이며 호출 수신 객체는 레이어다.

U3dLayer extends U3dObject 클래스 정의

    getBoundingBox: function | undefined
        하위 레이어가 제공할 수 있는 경계 조회 기능이며 기반 클래스는 직접 구현하지 않는다.
    static EVENT: U3dLayerEMI = U3dLayerEMD
        레이어 공통 이벤트 이름이다.
    static OPT_KEYS: Array<string>
        부모 옵션 키와 레이어 생성 옵션의 카멜 표기 정본 목록이다.
    _initialized: boolean = false
        공통 초기화 상태이며 대기 중인 레이어의 실패 통지 전에 false로 반영한다.
    _disposed: boolean = false
        실제 해제 완료 표시다.
    _readyState: 'pending' | 'fulfilled' | 'rejected' = 'pending'
        현재 초기화 회차의 종결 상태이며 중복 통지와 반복 구독을 막는다.
    _readyPromise: Promise<this>
        현재 초기화 회차의 네이티브 Promise다.
    _readyResolve: () -> void
        현재 레이어를 성공값으로 전달하는 Promise 완료 함수다.
    _readyReject: (reason: Error) -> void
        현재 회차의 Promise 실패 통지 함수다.

    get ready() -> Promise<this>
        동작: 현재 회차의 _readyPromise를 반환한다. 레이어 본체에는 then을 설치하지 않는다.

    _resetReady() -> this
        동작: protected 내부 API이다. 완료 상태를 pending으로 설정하고 새 네이티브 Promise와 성공·실패 통지 함수를 저장한다. 이전 Promise의 결과와 구독은 바꾸지 않고 현재 레이어를 반환한다. 실제 로딩은 시작하지 않는다.

    isReady() -> boolean
        동작: 현재 회차가 pending이 아니면 true를 반환한다.

    _resolveReady() -> this
        동작: 이미 종결되었으면 현재 레이어를 반환한다. 대기 중이면 상태를 fulfilled로 바꾸고 _readyResolve를 호출하여 자신을 성공값으로 전달한 뒤 현재 레이어를 반환한다. 구독은 마이크로태스크에서 실행한다.

    _rejectReady(reason: unknown) -> this
        동작:
            이미 종결되었으면 현재 레이어를 반환한다.
            대기 중이면 상태를 rejected로 바꾸고 _initialized를 false로 설정한다.
            Error이면 원래 객체를 실패값으로 사용한다. 그 밖은 비어 있지 않은 문자열 또는 클래스 종류를 포함한 기본 메시지로 Error를 만들고 원래 값을 cause에 보관한다.
            Error가 아닌 DOMException이면 name과 비어 있지 않은 message도 보존한다.
            _readyReject로 실패값을 전달하고 현재 레이어를 반환한다. 구독은 마이크로태스크에서 실행한다.

    _useTaskProcessor(processor: import('@union3d/core/UTaskProcessor').UTaskProcessor) -> import('@union3d/core/UTaskProcessor').UTaskProcessor
        동작: 해제 진행·레이어 해제·앱 해제 시 Error를 던진다. 처음 사용하는 풀에만 _retain을 호출하여 Set에 등록하고 같은 풀을 반환한다.

    _releaseTaskProcessors() -> void
        동작: 새 풀 사용을 차단하고 각 등록 풀의 _release를 호출한 뒤 Set을 비운다.

    constructor(opt: U3dLayerCO = {})
        동작: 정규화한 옵션으로 부모·장면·그룹·캐시·타일 상태·취소·작업 버퍼를 준비한다. 초기화·해제 상태는 false이다. rectangle, extent, geoExtent 순서로 먼저 지정한 범위를 사용한다. _resetReady로 초기화 완료 Promise를 만든다. 표시·좌표계·확장자·레벨·렌더 순서·투명도·URL·그림자·디버그 옵션을 저장한다. debugLogLimit은 유한한 양수이면 내림하고 아니면 500을 사용한다.

    get initialized() -> boolean
        동작: this._initialized를 반환한다.

    set initialized(value: boolean) -> void
        동작: this._initialized = value를 수행한다.

    get isDeBug() -> boolean
        동작: this._isDeBug를 반환한다.

    set isDeBug(value: boolean) -> void
        동작: this._isDeBug = value를 수행한다.

    isDebugLog() -> boolean
        동작: this._debug.log를 반환한다.

    getDebugLog() -> undefined
        동작: 현재 구현은 undefined를 반환한다.

    getDebugLogJson(space: number = 2) -> undefined
        동작: 현재 구현은 undefined를 반환한다.

    clearDebugLog() -> boolean
        동작: 현재 구현은 false를 반환한다.

    get _visible() -> boolean
        동작: this.#visible를 반환한다.

    set _visible(value: boolean) -> void
        동작: 레이어의 가시화 상태를 바꿉니다. 상태가 실제로 바뀔 때만 `SHOW` 또는 `HIDE` 이벤트를 dispatch하며, 그룹 정리나 작업 취소는 하지 않으므로 외부에서는 `show()`를 사용하세요.

    getScene() -> import('@UScene').UScene
        동작: this._scene를 반환한다.

    isUseShadowUpdate() -> boolean
        동작: this._useShadowUpdate를 반환한다.

    setUseShadowUpdate(use: boolean = true) -> void
        동작: this._useShadowUpdate = use를 수행한다.

    refresh() -> void
        동작: 타일 상태를 비우고 등록된 타일 취소와 작업 버퍼의 reject를 실행한다. drawArg가 없으면 종료한다. 두 타일 캐시와 레이어 캐시의 타일을 disposeTile·disposeTileByKey로 정리하고 그룹과 로딩 수를 초기화한다.

    createWorkingEndEvent() -> void
        동작: 해제·앱 해제·지도 전환·영역 변경·기존 예약 중이면 종료한다. LOADED 구독자가 있을 때만 #checkWorking을 초기 회차로 호출한다.

    _resetWorkingEndEvent() -> void
        동작: 세대를 올려 이전 예약을 무효화하고 타이머를 해제한 뒤 식별자를 null로, 대기 횟수를 3으로 되돌린다.

    initialize() -> void
        동작: 그룹을 장면에 추가하고 #computeBox3로 경계를 준비한 뒤 _initialized를 true로 설정한다. 레이어 CREATE와 앱 LAYER_CREATE를 통지하고 저장된 LOADED 리스너를 연결한다. 기반 initialize 자체는 resolve를 호출하지 않는다.

    isInitialized() -> boolean
        동작: this._initialized를 반환한다.

    isMapDisposed() -> boolean
        동작: this._disposed를 반환한다.

    add(object: import('three').Object3D) -> void
        동작: Layer에 Object3D 객체를 추가합니다. Object3D는 three.js에서 화면에 그려지는 모든 것(Mesh, Group, Light 등)의 공통 부모 타입입니다. 추가한 객체는 레이어의 Scene에 직접 들어가며 타일 캐시로 관리되지 않으므로, 해제는 호출자가 책임집니다. Object3D가 아닌 값을 넘기면 안내 메시지만 남기고 추가하지 않습니다.

    remove(object: import('three').Object3D) -> void
        동작: Layer에서 Object3D 객체를 제거합니다. Scene에서 분리만 하며 geometry·material 등 자원은 해제하지 않으므로 필요하면 호출자가 dispose해야 합니다. Object3D가 아닌 값을 넘기면 안내 메시지만 남기고 아무 것도 하지 않습니다.

    isDisposed() -> boolean
        동작: this._disposed를 반환한다.

    getInitLoading() -> boolean
        동작: this._initLoading를 반환한다.

    setInitLoading(val: boolean) -> void
        동작: this._initLoading = val를 수행한다.

    getCenter() -> GooglePositionVector3 | null
        동작: 범위와 drawArg가 있으면 범위 중심을 반환한다. 아니면 hasBoundingBox로 경계 조회 기능을 확인하여 min·max의 중점 Vector3를 만든다. 해당 경로가 없으면 null을 반환한다.

    getCenterGeographic() -> GeoPositionVector3 | null
        동작: getCenter 결과가 없으면 1328838 오류 후 null을 반환하고, 있으면 UMathEngine으로 월드 좌표를 위경도로 변환한다.

    isUpdate() -> boolean
        동작: 작업 버퍼가 없으면 true를, 있으면 열거 가능한 키가 하나 이상인지 반환한다.

    intersectFrustum(frustum: import('three').Frustum) -> boolean
        동작: 프러스텀이 없으면 false, 경계 상자가 없으면 true, 나머지는 상자 교차 결과를 반환한다.

    getCacheKeys() -> Array<string>
        동작: 레이어의 전체 캐시 키를 반환합니다.

    getCacheLength() -> number
        동작: 레이어 캐시에 보관 중인 타일 메시 수를 반환합니다.

    setCancelByTile(tile: import('@U3dQuadTile').U3dQuadTile, value: DeferredObject<import('@U3dQuadTile').U3dQuadTile>) -> void
        동작: 타일을 입력받아 해당 타일의 취소(cancel) 작업 객체를 등록합니다.

    getCancelByTile(tile: import('@U3dQuadTile').U3dQuadTile) -> DeferredObject<import('@U3dQuadTile').U3dQuadTile> | undefined
        동작: 타일을 입력받아 등록된 취소(cancel) 작업 객체를 반환합니다.

    override once(event: string, callback: EventCallBack, name?: string) -> string
        동작: 한 번만 수행되는 이벤트 리스너를 등록합니다. 처음 이벤트가 발생해 콜백이 실행되면 자동으로 제거됩니다.

    override on(event: string, callback: EventCallBack, once?: boolean, name?: string) -> string
        동작: 이벤트 리스너를 등록합니다.

    override off(event?: string, callback?: Function | string) -> void
        동작: UEventDispatcher.prototype.off.call(this, event, /** @type {Function | undefined} */ (callback))를 수행한다.

    override unkey(event: string, key: string) -> void
        동작: UEventDispatcher.prototype.unkey.call(this, event, key)를 수행한다.

    removeCancelByTile(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 타일을 입력받아 등록된 취소(cancel) 작업 객체를 제거합니다.

    cancelTile(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 타일을 입력받아 해당 타일 Load를 취소합니다.

    cancelTileByKey(key: string) -> void
        동작: 배열이면 각 항목의 cancel, reject, 함수인 resolve(false), 함수 항목 자체를 순서대로 호출한다. 단일 항목은 cancel·reject·함수 호출을 수행한다. 해당 등록 키를 삭제한다.

    cancelAllTile() -> void
        동작: 모든 타일의 작업을 취소합니다.

    setStateTile(tile: import('@U3dQuadTile').U3dQuadTile, state: number) -> void
        동작: 타일의 상태를 레이어의 프로퍼티(_stateTiles)에 저장합니다.

    getStateTileLength() -> number
        동작: Object.keys(this._stateTiles).length를 반환한다.

    getStateTiles() -> Record<string, number>
        동작: this._stateTiles를 반환한다.

    getStateTileKeys() -> Array<string>
        동작: Object.keys(this._stateTiles)를 반환한다.

    printStateTiles(print?: boolean) -> number
        동작: 상태와 전체 수를 선택적으로 출력한다. count를 증가시키지 않아 0을 반환한다.

    printNotCompleteStateTiles(print?: boolean) -> number
        동작: _end가 아닌 상태만 세어 선택적으로 출력하고 그 개수를 반환한다.

    setStateTileByKey(key: string, state: number) -> void
        동작: this._stateTiles[key] = state를 수행한다.

    resetStateTileAll() -> void
        동작: this._stateTiles = {}를 수행한다.

    getStateTile(tile: import('@U3dQuadTile').U3dQuadTile) -> number | undefined
        동작: 타일을 입력받아 해당 타일의 상태를 반환합니다.

    getStateTileByKey(key: string) -> number | undefined
        동작: this._stateTiles[key]를 반환한다.

    resetStateTile(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: delete this._stateTiles[this.createKeyByTile(tile)]를 수행한다.

    resetStateTileByKey(key: string) -> void
        동작: delete this._stateTiles[key]를 수행한다.

    restartTile(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: this.resetStateTile(tile)를 수행한다.

    getWorking() -> boolean
        동작: 레이어의 업데이트 작업(Tile Process)이 수행되고 있는지 여부를 반환합니다. true면 한 개 이상의 Process가 수행 중인 상태이고, false면 수행 중인 Process가 없는 상태입니다.

    getWorkingCount() -> number
        동작: 레이어의 작업(Tile Process) 수를 반환합니다.

    getWorkingLevel2() -> number
        동작: 레이어의 타일 프로세스에서 처리 중이거나 대기열에 있는 작업 수를 반환합니다. "Level 2"는 처리 중인 작업 수(`getWorkingCount`)에 대기열 길이를 더한 값입니다.

    getWorkingLevel3() -> number
        동작: 레이어의 타일 프로세스에서 처리 중이거나 대기열에 있는 작업 수를 반환합니다. 현재 구현은 `getWorkingLevel2()`와 같은 값이며, `LOADED` 이벤트 발생 시점을 판단하는 데 사용됩니다.

    getWorkingInDistance(opt?: Partial<{distance: number}>) -> number
        동작: opt가 falsy이면 distance=2000 옵션을 사용한다. 처리기의 선택적 거리 조회 결과를 반환하며 처리기 또는 결과가 없으면 0을 반환한다.

    addProcessByTile(tile: import('@U3dQuadTile').U3dQuadTile) -> boolean
        동작: 레이어의 타일 프로세스에 타일을 추가합니다.

    createKeyFromTile(tile: import('@U3dQuadTile').U3dQuadTile) -> string
        동작: tile.getKey()를 반환한다.

    getCache(tile: import('@U3dQuadTile').U3dQuadTile) -> import('@UMesh').UMesh | undefined
        동작: 입력받은 타일에 해당하는 캐시 데이터를 반환합니다. 캐시가 존재하면 해당 캐시를, 없으면 undefined 를 반환합니다.

    getCacheByKey(key: string) -> import('@UMesh').UMesh | undefined
        동작: 키 값으로 레이어의 캐시를 반환합니다.

    getGroupLayer() -> import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer | undefined
        동작: this._groupLayer를 반환한다.

    isGroupLayer() -> boolean
        동작: !!defined(this._groupLayer)를 반환한다.

    setGroupLayer(group: import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer) -> import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer
        동작: (this._groupLayer = group)를 반환한다.

    getGroup() -> import('@UGroup').UGroup
        동작: this._group를 반환한다.

    getTileFromScene(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    addTileFromScene(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    removeTileFromScene(tile: import('@U3dQuadTile').U3dQuadTile, skipHandoff: boolean = false) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    suspendTilePresentation(tile: import('@U3dQuadTile').U3dQuadTile) -> boolean
        동작: false를 반환한다.

    getVisible() -> boolean
        동작: this._visible를 반환한다.

    setVisible(visible: boolean) -> void
        동작: this._visible = visible를 수행한다.

    convertGeographicToGoogleRectangle(array: Array<number>) -> import('@UGeoRect').UGeoRect | undefined
    convertRectangle(array: Array<number>) -> import('@UGeoRect').UGeoRect | undefined
    setRenderOrder(val: number) -> void
        동작: this._renderOrder = val를 수행한다.

    getRenderOrder() -> number
        동작: this._renderOrder를 반환한다.

    getRenderOrderAtTile() -> number
        동작: this.getRenderOrder()를 반환한다.

    resetOpacity() -> void
        동작: 레이어의 투명도를 `setOpacity()`로 바꾸기 전 값으로 되돌립니다. `setOpacity()`를 호출한 적이 없으면 아무 것도 하지 않습니다.

    setOpacity(val: number) -> void
        동작: 정의되지 않은 값은 무시한다. 1 초과는 1, 0 미만은 0으로 제한한다. _oriOpacity가 falsy일 때 원래 투명도를 저장하고 새 투명도와 _transparent를 반영한다.

    getOpacity() -> number
        동작: this._opacity를 반환한다.

    getLoadingTile() -> number
        동작: this._countloadingTile를 반환한다.

    isLoadingTile() -> boolean
        동작: this._countloadingTile > 0를 반환한다.

    plusLoadingTile() -> void
        동작: this._countloadingTile++를 수행한다.

    minusLoadingTile() -> void
        동작: this._countloadingTile--를 수행한다.

    update(drawArg?: import('@UDrawArg').UDrawArg) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    change(drawArg?: import('@UDrawArg').UDrawArg) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    intersects3D(rect3d: import('@UGeoRect').UGeoRect) -> boolean
        동작: 입력받은 범위와 해당 layer 의 교차 여부를 반환합니다.

    intersects(rect: import('@UGeoRect').UGeoRect, level: number) -> boolean
        동작: 최소 레벨 미만이면 false, 범위가 없으면 true, 나머지는 범위 교차 여부를 반환한다. 최대 레벨은 검사하지 않는다.

    contain(x: number, y: number, level: number) -> boolean
        동작: 최소 미만 또는 최대 초과 레벨이면 false, 범위가 없으면 true, 나머지는 범위 포함 여부를 반환한다.

    render(drawArg?: import('@UDrawArg').UDrawArg) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    show(show: boolean, refresh: boolean = true) -> void
        동작: 표시값이 같으면 종료한다. 표시값과 초기 로딩 표시를 바꾼다. 숨길 때 윤곽선 선택 목록·그룹·타일 상태·취소 대상을 정리한다. refresh와 앱이 있으면 강제 갱신한다. 표시할 때 LOADED 일회 구독으로 초기 로딩 표시를 해제한다.

    dispose() -> Promise<boolean>
        동작: 완료 예약을 취소하고 BEFORE_DISPOSE를 통지한다. 디버그 경계·이벤트 처리기·취소·장면·캐시를 정리하고 이름·카메라·표시·해제 상태를 반영한다. DISPOSE 통지 후 모든 이벤트를 해제한다. 별도 Deferred를 true로 완료하여 반환하고 finally에서 파서 풀을 해제한다.

    disposeCache() -> void
        동작: 저장하고 있는 캐시를 전부 제거합니다.

    disposeTile(tile: import('@U3dQuadTile').U3dQuadTile, opt?: Partial<{deletefunc: Function}>) -> void
        동작: 입력받은 타일을 처분(dispose)합니다.

    disposeTileByKey(key: string, opt: Partial<{deletefunc: Function}> = {deletefunc: undefined}) -> void
        동작: 타일 Key와 삭제 옵션을 입력받아 타일을 처분(dispose)합니다.

    createKey(tile: import('@U3dQuadTile').U3dQuadTile) -> string
        동작: tile.getKey()를 반환한다.

    createKeyByTile(tile: import('@U3dQuadTile').U3dQuadTile) -> string
        동작: tile.getKey()를 반환한다.

    fncDeleteGroup() -> void
        동작: 기반 구현은 처리 없이 종료한다.

    createTexture(tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    createHeight(tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    createComment(tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    createModel(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    updateHeight(...args: any) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    updateDetail(tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    override getMetaData() -> import('@UMeta').UMeta
        동작: 레이어의 메타데이터를 반환합니다.

    setApp(app: import('@U3dApp').U3dApp) -> void
        동작: 앱·카메라·프러스텀·그리기 문맥·사분 트리·조명과 그룹 문맥을 연결한다. 작업 종류에 맞는 처리기에 getTileCallback 결과를 등록한다. initialize 반환값을 전달한다. 그 호출의 동기 예외는 아직 대기 중이면 레이어 _rejectReady에 전달한 뒤 undefined를 반환하고, 이미 완료하였으면 원래 예외를 호출자에게 다시 전달한다.

    getTileCallback() -> U3dLayerTileCallback | undefined
        동작: 레이어의 타일 종류(IMAGE/HEIGHT/MODEL)에 따라 처리 콜백(createTexture/createHeight/createModel)을 반환합니다. 앱이 레이어를 등록할 때 이 콜백을 타일 프로세스에 연결하며, `USER`·`MEASURE` 등 그 외 종류는 undefined를 반환해 연결하지 않습니다.

    process(curTime?: number) -> number
        동작: 0를 반환한다.

    getType() -> string
        동작: this._type를 반환한다.

    debugBound(isDebug: boolean, color: number = 0xffff00) -> boolean
        동작: 레이어가 아니거나 목표 동작 상태와 같으면 false를 반환한다. 활성화하면 헬퍼·숨김 구독·외부 장면·렌더 전 콜백을 등록하고 준비된 경계를 복사하여 높이 0부터 10000으로 표시한다. 비활성화하면 구독·장면·콜백·헬퍼를 정리한다. 정상 변경은 true를 반환한다.

    __testCancelTile() -> boolean
        동작: 취소 사전이 비어 있으면 true를, 아니면 false를 반환한다.

    __testStateTile() -> boolean
        동작: drawArg가 없으면 false를 반환한다. 상태 수가 캐시 키 수보다 많거나 _end 미만 상태가 있으면 false를, 나머지는 true를 반환한다.

    #checkWorking(name: string, reset: boolean = false) -> void
        동작: 세대·수명·지도 상태가 유효할 때만 200ms 타이머를 예약한다. reset이면 대기 횟수를 3으로 저장한다. LOADED 구독자가 없으면 종료한다. level3 작업이 있으면 대기를 다시 시작하고, 없으면 횟수를 감소시키며 재검사한다. 대기 종료 후 ready.then에 LOADED 통지를 연결한다. 초기화 실패 시 LOADED를 발생시키지 않으며 이벤트 처리 콜백의 예외는 로그로 남긴다.

    #computeBox3() -> void
        동작: 기존 경계의 min.x와 max.x가 유한하면 유지한다. 아니면 범위와 drawArg가 있을 때 좌상단·우하단으로 Box3를 만든다.

hasBoundingBox(value: unknown) -> boolean
    동작: 입력이 객체이고 getBoundingBox 프로퍼티가 함수인지 판정한다.

```

## 4. 공통 처리 기준과 제약

```spec
범용 deferred와 별도 타일·취소·해제 작업의 완료 계약은 각각의 소유 작업이 유지한다.
레이어는 첫 완료 이후의 통지를 무시한다. 먼저 성공한 레이어를 이후 오류로 실패 상태로 되돌리지 않는다. _resetReady는 새 Promise로 별도 회차를 시작한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
