# U3dImageLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dImageLayer`는 지형 tile에 영상 texture를 연결하는 이미지 계열 레이어의 공통 기반이다. 하위 레이어가 URL이나 자체 렌더 결과를 준비하면 이 레이어가 요청 취소, scene·data cache 재사용, 부모 tile 대체, 지형 material 생성, texture 적용과 terrain uniform 교체 완료까지의 공통 수명주기를 관리한다.

### 1.2 책임 범위

- 이미지 tile의 요청 상태와 tile key별 현재 요청 소유권을 관리한다.
- scene mesh cache와 LRU texture data cache를 구분하여 재사용하고 자원을 해제한다.
- 자식 이미지를 얻지 못하거나 특정 level을 부모 영상으로 대체해야 할 때 부모 texture의 해당 영역을 공유한다.
- 지형 mesh와 image material을 만들고 밝기·대비·채도·색조·색상톤·투명도·clipping 상태를 반영한다.
- texture 준비와 terrain decal uniform 교체가 끝난 시점을 tile 작업 완료와 연결한다.
- 요청·cache·취소·fallback·소요 시간에 대한 선택적 debug log를 수집한다.
- scene에 tile을 추가·제거하고 material, geometry, texture와 mesh를 정리한다.
- tile 생애가 끝난 작업물을 즉시 cache·작업 상태에서 제외하고, 자식 handoff 동안 화면에 남길 옛 mesh는 잔여물로 manager에 맡긴 뒤 handoff가 끝나면 texture 소유권을 가려 정리한다.

책임 경계: 실제 요청 URL과 protocol별 metadata·응답 해석은 XYZ, WMS, WMTS, OpenLayers 등의 하위 레이어가 담당한다. app이 소유하는 terrain decal manager 자체는 이 레이어가 생성하거나 dispose하지 않는다.

### 1.3 주요 동작 방식

하위 레이어는 먼저 `createTexture()`로 가시성, level, 영역, tile 상태와 부모 대체 조건을 검사한다. 실제 데이터가 필요하면 URL과 deferred를 준비하여 `processTexture()`를 호출한다. 기본 cancelable 경로는 같은 tile key에 현재 요청 하나만 유지하고 이전 요청을 취소하며, scene cache와 LRU data cache를 우선 조회한 뒤 네트워크 요청을 시작한다. 성공한 texture는 mesh material에 적용하고, 실패하면 가능한 경우 부모 tile의 texture 영역을 공유한다. 마지막에는 terrain decal manager의 uniform 교체 준비까지 기다린 뒤 deferred를 완료한다. tile이 해제되면 작업물은 즉시 cache에서 빠지고, 자식 handoff 때문에 화면에 남겨야 하는 옛 mesh만 잔여물로 manager가 보관했다가 handoff 완료 또는 같은 key의 새 작업물 표시 시점에 이 레이어가 정리한다.

### 1.4 주요 사용처와 연계 대상

- `U3dImageXYZLayer`, `U3dImageWMSLayer`의 공통 tile image 처리 기반
- `U3dOpenLayer`(및 이를 상속하는 `U3dImageWMTSLayer`)의 cache·texture·부모 fallback 재사용과 protected 성능 관측 확장점 구현
- `U2dVectorShaderLayer`의 terrain tile 표시 준비 판정
- `U3dApp`의 레이어 연결, renderer 품질 설정과 terrain decal manager 공유
- 사용자 정의 이미지 레이어 예제의 색상·색조·투명도 조절 API

## 3. 정규 자연어 수도코드

```spec
U3dImageLayerCO_Content 타입 정의
    U3dImageLayerCO가 기반 U3dLayerCO에 덧붙이는 image layer 전용 생성 옵션 필드 묶음이다.
        transparent?: boolean
            material의 투명 렌더 상태에 사용할 옵션이며 true이면 이후 opacity 변경에서도 투명 상태를 강제한다.
        burnLevels?: Array<number>
            현재 pass level보다 높은 tile 중 부모 영상을 잘라 사용할 level 목록이다.
        flipY?: boolean
            적용할 texture의 UV Y축 반전값이며 생략하면 true이다.
        parseFunction?: Function | null
            loader의 사용자 parsing 함수이다. 실제 호출 계약은 단순 Function 타입보다 구체적이다. [확인 Q-008]
        useDataCache?: boolean
            texture data cache 사용 여부로 저장되지만 현재 cache 흐름에서는 읽히지 않는다. [확인 Q-001]
        brightness?: number
            지형 영상의 밝기값이다.
        contrast?: number
            지형 영상의 대비값이다.
        saturation?: number
            지형 영상의 채도값이다.
        hueRotation?: number
            지형 영상의 색조 회전값이다.
        lightColorTone?: ColorRepresentation
            밝은 영역의 색상톤이다.
        darkColorTone?: ColorRepresentation
            어두운 영역의 색상톤이다.
        lightColorToneEnabled?: boolean
            밝은 영역 색상톤 적용 여부이다.
        darkColorToneEnabled?: boolean
            어두운 영역 색상톤 적용 여부이다.
        lightColorToneExposure?: number
            밝은 영역 색상톤 적용 민감도이다.
        darkColorToneExposure?: number
            어두운 영역 색상톤 적용 민감도이다.

U3dImageLayerCO extends U3dLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        U3dImageLayerCO_Content의 모든 필드
            기반 U3dLayerCO 옵션에 위 image 옵션 필드 묶음을 합친 생성 옵션 타입이며 각 필드의 의미는 U3dImageLayerCO_Content 타입 정의에 기록한다.

MaterialWithMap extends Material 타입 정의
    map?: UTexture | UCanvasTexture
        현재 표시 texture이다.
    _oriMap?: UTexture | UCanvasTexture
        별도로 보관하는 원본 texture이다.
    transparent?: boolean
    needsUpdate?: boolean
    opacity?: number
    setTerrainBaseTransparent?(transparent: boolean) -> void
    clippingPlanes?: Array<Plane> | null
    depthWrite?: boolean

MeshWithMaterial extends Object3D 타입 정의
    material?: MaterialWithMap | Array<MaterialWithMap>
    geometry?: BufferGeometry

TerrainMaterial 외부 전역 타입 사용
    terrain decal image material의 확장 속성과 함수는 `union3d/manager/terrain/UShaderTerrainDecalUtils.types.js`의 전역 typedef `TerrainMaterial`을 그대로 참조하며, 이 단위의 타입 소스는 별칭을 따로 정의하지 않는다.

ImageTextureProcessOptions 타입 정의
    abortNetwork?: boolean
        생략하거나 true이면 요청별 취소 경로를 사용하고, false이면 특수 하위 레이어용 legacy 호환 경로를 사용한다.

ImageTextureRequestState 타입 정의
    url?: string
        debug log가 켜진 경우 요청 교체를 관찰할 URL이다.
    requestId?: number
        현재 log generation 안의 관찰 식별자이다.
    cancelled: boolean
    logicalFinished: boolean
    loadingCounted: boolean
    loadingReleased: boolean
    debugEntry?: Record<string, any>
    networkHandle: {cancel: () -> boolean, isCancelled?: () -> boolean, isSettled?: () -> boolean} | undefined
    cancel(reason?: string) -> void
        같은 요청의 Map 등록, 네트워크 중단, loading count와 deferred를 한 번만 정리한다.

U3dImageLayerClippingState 타입 정의
    _clippingPlanes: Array<Plane> | null
        레이어가 소유하는 현재 clipping plane 배열이며 material 반영 과정에서 복사하거나 해제하지 않는다.

U3dImageLayer extends U3dLayer 클래스 정의
    의존: U3dLayer — tile 상태·scene·cache·취소·loading count와 레이어 수명주기 기반; 상속: {U3dLayer}

    static OPT_KEYS: Array<string>
        의존: U3dLayer — 기반 생성 옵션 key 재사용; 속성 읽기: {OPT_KEYS}
        동작: 기반 옵션에 투명도, 부모 영상 대체, texture 방향·parsing·data cache와 영상 색상 조절 옵션을 추가한다.

    #dataCacheSize: number = 400
        LRU texture data cache가 유지할 추정 용량 한도이다.

    #dataCache?: LRUCache
        tile key별 texture와 추정 용량을 보유하는 data cache이다.

    #loader: UTextureLoader
        이미지 또는 사용자 parsing 결과를 texture로 만드는 loader이다.

    #debugLogJson?: Record<string, any>
        debug log 활성 시에만 생성되는 JSON 직렬화 가능 관측 저장소이다.

    #debugTimingState?: WeakMap<object, Record<string, number>>
        JSON에 포함하지 않는 고해상도 측정 시각을 log 항목별로 보관한다.

    _activeTextureRequests: Map<string, ImageTextureRequestState>
        tile key당 현재 cancelable 요청 하나를 보유한다. 항목 제거와 완료는 같은 상태 객체의 identity가 일치할 때만 수행한다.

    _burnLevels: Array<number> = 빈 배열
        부모 영상으로 대체할 level 목록이다.

    _flipY: boolean = true
        새 texture에 적용할 Y축 반전값이다.

    _forceTransparent: boolean = false
        생성 시 transparent가 true였으면 이후에도 투명 material 상태를 강제한다.

    _clippingPlanes: Array<Plane> | null = null
        현재 child material에 적용할 clipping plane 목록이다.

    _parseFunction: Function | null
        loader가 buffer를 texture로 바꿀 때 호출할 사용자 parsing 함수이다. 실제 callback 계약은 Q-008에서 확인한다.

    _useDataCache: boolean
        생성 옵션을 저장한 값이며 현재 cache 경로에서는 읽히지 않는다. [확인 Q-001]

    _terrainDecalManager?: UShaderTerrainDecalManager
        app이 소유하며 terrain mesh 등록, texture 준비, parent·child uniform 교체와 tile dispose barrier를 연결한다.

    영상 색상 상태
        의존:
            GBrightnessBlendingShader — 초기 밝기; 상수: {DEFAULT_BRIGHTNESS}
            GContrastBlendingShader — 초기 대비; 상수: {DEFAULT_CONTRAST}
            GSaturationBlendingShader — 초기 채도; 상수: {DEFAULT_SATURATION}
            GHueRotationBlendingShader — 초기 색조 회전; 상수: {DEFAULT_HUE_ROTATION}
            GColorToneBlendingShader — 초기 색상톤·활성·민감도; 상수: {DEFAULT_LIGHT_COLOR_TONE, DEFAULT_DARK_COLOR_TONE, DEFAULT_LIGHT_COLOR_TONE_ENABLED, DEFAULT_DARK_COLOR_TONE_ENABLED, DEFAULT_LIGHT_COLOR_TONE_EXPOSURE, DEFAULT_DARK_COLOR_TONE_EXPOSURE}
        _brightness, _contrast, _saturation, _hueRotation
            밝기, 대비, 채도와 색조 회전값이다.
        _lightColorTone, _darkColorTone
            밝은 영역과 어두운 영역에 적용할 색상이다.
        _lightColorToneEnabled, _darkColorToneEnabled
            각 색상톤의 적용 여부이다.
        _lightColorToneExposure, _darkColorToneExposure
            각 색상톤의 적용 민감도이다.

    constructor(opt: U3dImageLayerCO = {})
        인터페이스: opt는 기반 레이어 옵션과 image texture, cache 및 색상 조절 초기값을 전달한다.
        처리 기준:
            기반 생성자 실행 시점에 `_needXml`이 정의되지 않았으면 짧은 비동기 지연 뒤 생성 완료 callback을 호출한다.
            LRU 제거 대상 texture를 scene mesh cache가 같은 key로 계속 소유하거나 이 레이어의 handoff 잔여물이 쓰고 있으면 GPU·CPU 자원을 해제하지 않는다.
        의존:
            U3dLayer — 기반 레이어 상태와 cache 생성; 생성자: {new U3dLayer()}; 속성 읽기: {_cache}
            normalizeOptionKeys — 실제 파생 생성자의 지원 key로 옵션 alias 정규화; 함수: {normalizeOptionKeys()}
            defaultValue — image 옵션 기본값 적용; 함수: {defaultValue()}
            defined — 선택적 생성값과 cache 소유 상태 판정; 함수: {defined()}
            UTextureLoader — image texture loader 생성; 생성자: {new UTextureLoader()}
            LRUCache — tile texture data cache와 제거 callback 구성; 생성자: {new LRUCache()}
            UCache — LRU 제거 시 같은 key의 scene mesh 소유 여부 조회; 함수: {get()}
            UTexture/UCanvasTexture — LRU에서 단독 소유한 GPU 자원 해제와 close 함수가 있는 texture의 CPU source 해제; 함수: {dispose(), close()}
            UDEF — IMAGE layer type 지정; 상수: {LAYER_TYPE.IMAGE}
            Web API — 초기화 완료 callback 지연 예약; 함수: {setTimeout()}
            레이어 생성 완료 callback(resolve) — XML 대기가 없는 레이어의 생성 완료 통지; 콜백: {resolve()}
        동작:
            옵션을 정규화하고 기반 레이어를 초기화한 뒤 image layer type, 수명 상태와 최대 level 직접 처리 정책을 설정한다.
            부모 영상 대체 level, 투명도, texture Y축, parsing 함수, data cache 옵션과 영상 색상값을 저장한다. useDataCache 값은 이후 data cache 사용 여부에 반영되지 않는다. [확인 Q-001]
            파생 클래스가 XML 대기를 표시하지 않았으면 1ms 뒤 존재하는 resolve callback에 현재 레이어를 전달한다.
            용량 400의 LRU data cache를 만든다. 제거 callback은 scene mesh cache에 같은 key가 없고 handoff 잔여물도 그 texture를 쓰지 않을 때만 texture의 GPU 자원을 해제하고 close 함수가 있으면 CPU source 사용권도 해제한다.

    debug log 책임 그룹
        역할: 요청·cache·취소·fallback과 단계별 시간을 선택적으로 기록하되 debugLog가 꺼진 일반 실행의 할당과 함수 호출을 줄인다.

        override getDebugLog() -> Record<string, any> | undefined
            인터페이스: 반환 객체를 수정해도 내부 저장소가 바뀌지 않는 JSON 깊은 복사본을 반환하며 debugLog가 꺼져 있으면 undefined를 반환한다.
            의존: U3dLayer — 현재 loading tile count 조회; 함수: {getLoadingTile()}; 속성 읽기: {_name}
            동작:
                활성 관측 저장소를 준비하고 JSON 직렬화로 복사한다.
                현재 레이어 정보, active 요청 수와 loading count를 복사본에 넣고 누적 시간과 표본 수로 단계별 평균을 계산하여 반환한다.

        override getDebugLogJson(space: number = 2) -> string | undefined
            인터페이스: space는 JSON 들여쓰기 수이며 유한한 값이면 정수 0~10으로 제한하고, 아니면 2를 사용한다.
            동작: debug log 복사본이 있으면 지정 들여쓰기로 JSON 문자열을 만들고 없으면 undefined를 반환한다.

        override clearDebugLog() -> boolean
            인터페이스: debugLog가 활성화되어 새 generation으로 초기화했으면 true, 아니면 false를 반환한다.
            의존: U3dLayer — debugLog 활성 여부 조회; 함수: {isDebugLog()}
            동작: debugLog가 꺼져 있으면 false를 반환하고, 켜져 있으면 저장소를 초기화한 뒤 true를 반환한다.

        #ensureDebugLog() -> Record<string, any> | undefined
            의존: U3dLayer — debugLog 활성 여부 조회; 함수: {isDebugLog()}
            동작: debugLog가 꺼져 있으면 undefined를 반환하고, 켜져 있으나 #debugLogJson 저장소가 없으면 새 generation을 만든 뒤 현재 저장소를 반환한다.

        #resetDebugLog() -> void
            처리 기준: 상세 entries는 최근 debugLogLimit개만 유지하지만 summary는 현재 generation 전체를 누적할 구조로 초기화한다.
            의존: U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_name, _debug}
            동작: 이전 generation에 1을 더하고 timing WeakMap을 교체한 뒤 layer·취소 정책, 요청·cache·fallback·loading 통계, 시간 누적과 빈 entries를 가진 저장소를 만든다.

        _startDebugLogEntry(type: string, detail?: Record<string, any>) -> Record<string, any> | undefined
            처리 기준: debugLog가 꺼져 있으면 항목 객체를 만들지 않는다.
            의존: U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_debug}
            동작:
                관측 저장소가 있으면 시작·활성·peak count를 증가시키고 detail, sequence, generation, 시작 시각과 working 상태를 가진 항목을 만든다.
                고해상도 전체 시작 시각을 WeakMap에 저장하고 entries 끝에 추가한다. 한도를 넘은 앞쪽 항목은 제거하고 제거 수를 누적한다.

        _recordDebugLogDuration(entry: Record<string, any> | undefined, name: string, startTime: number) -> void
            동작: entry가 있으면 현재 시각과 startTime의 차이를 반올림하여 지정 단계 시간으로 기록한다.

        _markDebugLogTime(entry: Record<string, any> | undefined, name: string) -> void
            동작: entry의 timing 상태가 있으면 지정 이름에 현재 고해상도 시각을 저장한다.

        _recordDebugLogSince(entry: Record<string, any> | undefined, resultName: string, markName: string) -> void
            의존: defined — 지정 시작 시각 존재 여부 판정; 함수: {defined()}
            동작: entry와 지정 시작 시각이 있으면 그 시점부터 현재까지의 시간을 반올림하여 결과 이름으로 기록한다.

        _recordImageDebugSummary(name: string, amount: number = 1, entry?: Record<string, any>) -> void
            처리 기준: 저장소가 없거나 entry가 현재 generation과 다르면 새 summary를 변경하지 않는다.
            동작: 현재 generation의 지정 summary count에 amount를 더한다.

        _recordImageDebugActivePeaks(entry: Record<string, any> | undefined) -> void
            처리 기준: 저장소가 없거나 entry가 현재 generation과 다르면 기록하지 않는다.
            의존: U3dLayer — 현재 loading tile count 조회; 함수: {getLoadingTile()}
            동작: active request 현재값을 Map 크기로 갱신하고 active request와 loading tile의 최고값을 보존한다.

        _finishDebugLogEntry(entry: Record<string, any> | undefined, status: string, detail?: Record<string, any>) -> void
            처리 기준:
                없거나 이미 완료한 항목은 다시 완료하지 않는다.
                이전 generation 항목은 자기 상세 상태만 끝내고 현재 summary에는 합산하지 않는다.
            동작:
                전체 경과 시간을 계산하고 status, 완료 시각과 detail을 항목에 반영한 뒤 timing 상태를 제거한다.
                현재 generation이면 active·completed·status count와 각 단계의 누적, 표본 수와 최댓값을 갱신한다.

        _getDebugLogTime() -> number
            동작: debug 측정용 고해상도 현재 시각을 반환한다.

    override initialize() -> boolean
        의존: U3dLayer — scene·group과 공통 레이어 초기화; 함수: {initialize()}; 속성 읽기: {_initialized}
        동작: 기반 초기화를 실행하고 현재 `_initialized` 값을 반환한다.

    override setApp(app: U3dApp) -> void
        인터페이스: app은 이 레이어를 소유하고 renderer와 terrain decal manager를 제공한다.
        의존:
            U3dLayer — 기반 setApp을 현재 레이어 receiver로 직접 호출하여 app 연결; 함수: {prototype.setApp.call()}
            U3dApp — 공유 terrain decal manager 조회; 함수: {getTerrainDecalManager()}
        동작: 기반 방식으로 app을 연결하고 같은 app의 image·vector shader layer가 공유하는 terrain decal manager를 보관한다.

    영상 색상 조회 책임 그룹
        getBrightness() -> number
            동작: 현재 밝기값을 반환한다.

        getContrast() -> number
            동작: 현재 대비값을 반환한다.

        getSaturation() -> number
            동작: 현재 채도값을 반환한다.

        getHueRotation() -> number
            동작: 현재 색조 회전값을 반환한다.

        getLightColorTone() -> ColorRepresentation
            동작: 현재 밝은 영역 색상톤을 반환한다.

        getDarkColorTone() -> ColorRepresentation
            동작: 현재 어두운 영역 색상톤을 반환한다.

        getLightColorToneEnabled() -> boolean
            동작: 밝은 영역 색상톤 적용 여부를 반환한다.

        getDarkColorToneEnabled() -> boolean
            동작: 어두운 영역 색상톤 적용 여부를 반환한다.

        getLightColorToneExposure() -> number
            동작: 밝은 영역 색상톤 민감도를 반환한다.

        getDarkColorToneExposure() -> number
            동작: 어두운 영역 색상톤 민감도를 반환한다.

    영상 색상 변경 책임 그룹
        역할: layer 상태를 저장하고 각 setter가 판정한 cache·group 대상에 반영한다.

        setBrightness(val: number) -> U3dImageLayer
            의존:
                defined — cache child의 brightness 지원 여부 판정; 함수: {defined()}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                UTerrainMesh — 기존 지형 mesh의 밝기 상태 반영; 속성 읽기·쓰기: {brightness}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: 밝기값을 저장하고 cache의 brightness 속성이 정의된 child와 group에서 기존 값이 truthy인 child에 적용한 뒤 현재 레이어를 반환한다.

        setContrast(val: number) -> U3dImageLayer
            의존:
                defined — cache child의 contrast 지원 여부 판정; 함수: {defined()}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                UTerrainMesh — 기존 지형 mesh의 대비 상태 반영; 속성 읽기·쓰기: {contrast}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: 대비값을 저장하고 cache의 contrast 속성이 정의된 child와 group에서 기존 값이 truthy인 child에 적용한 뒤 현재 레이어를 반환한다.

        setSaturation(val: number) -> U3dImageLayer
            의존:
                defined — cache child의 saturation 지원 여부 판정; 함수: {defined()}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                UTerrainMesh — 기존 지형 mesh의 채도 상태 반영; 속성 읽기·쓰기: {saturation}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: 채도값을 저장하고 cache의 saturation 속성이 정의된 child와 group에서 기존 값이 truthy인 child에 적용한 뒤 현재 레이어를 반환한다.

        setHueRotation(val: number) -> U3dImageLayer
            의존:
                defined — cache child의 hueRotation 지원 여부 판정; 함수: {defined()}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                UTerrainMesh — 기존 지형 mesh의 색조 회전 상태 반영; 속성 읽기·쓰기: {hueRotation}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: 색조 회전값을 저장하고 cache의 hueRotation 속성이 정의된 child와 group에서 기존 값이 truthy인 child에 적용한 뒤 현재 레이어를 반환한다.

        setLightColorTone(val: ColorRepresentation | null) -> U3dImageLayer
            의존:
                UTerrainMesh — 색상톤을 적용할 지형 mesh 판정과 상태 반영; 생성자: {UTerrainMesh}; 속성 쓰기: {lightColorTone}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                GColorToneBlendingShader — null 입력의 밝은 색 기본값; 상수: {DEFAULT_LIGHT_COLOR_TONE}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: null이면 기본 밝은 색으로 바꾸어 저장하고 cache와 group의 모든 UTerrainMesh에 적용한 뒤 현재 레이어를 반환한다.

        setDarkColorTone(val: ColorRepresentation | null) -> U3dImageLayer
            의존:
                UTerrainMesh — 색상톤을 적용할 지형 mesh 판정과 상태 반영; 생성자: {UTerrainMesh}; 속성 쓰기: {darkColorTone}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                GColorToneBlendingShader — null 입력의 어두운 색 기본값; 상수: {DEFAULT_DARK_COLOR_TONE}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: null이면 기본 어두운 색으로 바꾸어 저장하고 cache와 group의 모든 UTerrainMesh에 적용한 뒤 현재 레이어를 반환한다.

        setLightColorToneEnabled(val: boolean | null) -> U3dImageLayer
            의존:
                UTerrainMesh — 색상톤을 적용할 지형 mesh 판정과 활성 상태 반영; 생성자: {UTerrainMesh}; 속성 쓰기: {lightColorToneEnabled}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                GColorToneBlendingShader — null 입력의 밝은 색 활성 기본값; 상수: {DEFAULT_LIGHT_COLOR_TONE_ENABLED}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: null이면 기본값으로 바꾸어 저장하고 cache와 group의 모든 UTerrainMesh에 적용한 뒤 현재 레이어를 반환한다.

        setDarkColorToneEnabled(val: boolean | null) -> U3dImageLayer
            의존:
                UTerrainMesh — 색상톤을 적용할 지형 mesh 판정과 활성 상태 반영; 생성자: {UTerrainMesh}; 속성 쓰기: {darkColorToneEnabled}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                GColorToneBlendingShader — null 입력의 어두운 색 활성 기본값; 상수: {DEFAULT_DARK_COLOR_TONE_ENABLED}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: null이면 기본값으로 바꾸어 저장하고 cache와 group의 모든 UTerrainMesh에 적용한 뒤 현재 레이어를 반환한다.

        setLightColorToneExposure(val: number | null) -> U3dImageLayer
            의존:
                UTerrainMesh — 민감도를 적용할 지형 mesh 판정과 상태 반영; 생성자: {UTerrainMesh}; 속성 쓰기: {lightColorToneExposure}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                GColorToneBlendingShader — null 입력의 밝은 색 민감도 기본값; 상수: {DEFAULT_LIGHT_COLOR_TONE_EXPOSURE}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: null이면 기본 민감도로 바꾸어 저장하고 cache와 group의 모든 UTerrainMesh에 적용한 뒤 현재 레이어를 반환한다.

        setDarkColorToneExposure(val: number | null) -> U3dImageLayer
            의존:
                UTerrainMesh — 민감도를 적용할 지형 mesh 판정과 상태 반영; 생성자: {UTerrainMesh}; 속성 쓰기: {darkColorToneExposure}
                UCache — 생성된 tile mesh 목록 조회; 함수: {items()}
                UGroup — 현재 scene child 순회; 함수: {traverse()}
                GColorToneBlendingShader — null 입력의 어두운 색 민감도 기본값; 상수: {DEFAULT_DARK_COLOR_TONE_EXPOSURE}
                U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
            동작: null이면 기본 민감도로 바꾸어 저장하고 cache와 group의 모든 UTerrainMesh에 적용한 뒤 현재 레이어를 반환한다.

    override show(visible: boolean, refresh?: boolean) -> void
        처리 기준:
            숨길 때 기반 레이어는 group 만 비우고 cache 작업물은 남기므로, 다시 보일 때 그 작업물을 바로 group 에 되돌린다.
            가시성이 실제로 바뀐 호출에서만 재부착하며, 숨기는 호출은 cache 의 UTerrainMesh 지형 표시만 끈다.
        의존:
            U3dLayer — 가시성 변경과 선택적 화면 갱신; 함수: {show()}; 속성 읽기: {_visible, _cache}
            UTerrainMesh — 지형 표시 전환; 함수: {setTerrainVisible()}
        동작: 변경 여부를 기억한 뒤 기반 레이어에 전달하고, 보이게 바뀐 경우 cache 작업물을 재부착하며 숨기는 경우 cache 의 지형 mesh 표시를 끈다.

    #reattachCachedTiles() -> void
        역할: 숨김 중 group 에서 빠진 cache 작업물을 아직 화면에 있는 tile 에 대해 다시 group 에 붙인다.
        처리 기준: 해제되지 않고 visible 인 tile 만 대상으로 하며 부착 자체는 addTileFromScene 이 맡는다.
        의존:
            U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _drawArg}
            UCache — cache 키 순회와 tile 조회; 함수: {keys(), get()}
            UDrawArg — 현재 tile 목록 조회; 속성 읽기: {_cacheTiles}
            U3dQuadTile — 해제·표시 상태 조회; 속성 읽기: {_disposed, visible}
        동작: cache 의 모든 키에 대해 drawArg 에서 tile 을 찾고 살아 있으며 visible 이면 addTileFromScene 을 호출한다.

    setClippingPlanes(...clippingPlanes: Plane[]) -> void
        인터페이스: 유효한 Plane 인수만 사용하며 인자가 없거나 모두 무효이면 clipping을 해제한다.
        의존:
            defined — Plane과 clipping 입력 존재 여부 판정; 함수: {defined()}
            Three.js — 유효한 clipping plane 판정; 생성자: {Plane}
            UGroup — child 순회와 이름 있는 child 추가·제거 event 등록·해제; 함수: {on(), off(), hasEventListener()}; 속성 읽기: {children}
            U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_group}
        동작:
            유효한 Plane이 있으면 목록을 저장하고 현재 모든 child material에 적용한다.
            이후 child가 추가되거나 제거될 때 clipping을 적용하거나 비우는 callback을 이름으로 한 번씩 등록한다.
            유효한 Plane이 없으면 목록을 null로 바꾸고 현재 모든 child material에서 제거한 뒤 두 event callback을 해제한다.

    getClippingPlanes() -> Array<Plane> | null
        동작: 현재 clipping plane 배열 또는 null을 반환한다.

    getDataCache() -> LRUCache | undefined
        동작: 현재 LRU texture data cache를 반환한다.

    override dispose() -> void
        처리 기준:
            terrain decal manager는 app 소유이므로 참조만 해제한다.
            레이어 전체 종료이므로 handoff 보류 여부와 무관하게 cache의 모든 지형 mesh를 강제로 해제한 뒤 기반 정리를 시작한다.
        의존:
            U3dLayer — 진행 요청·scene·cache와 기반 상태 정리; 함수: {dispose()}
            LRUCache — data cache 전체 제거; 함수: {clear()}
        동작:
            cache의 지형 mesh를 모두 강제 해제한다.
            기반 dispose를 호출하지만 그 deferred 완료 객체는 반환하거나 기다리지 않고, data cache를 비운 뒤 cache와 manager 참조를 제거하고 레이어를 disposed로 표시한다. [확인 Q-007]

    #forceDisposeTerrainMeshes() -> void
        역할: 레이어 전체 종료·refresh 경로에서 cache가 보유한 모든 지형 mesh의 terrain binding과 자원을 즉시 해제한다.
        처리 기준: 이미 해제된 mesh는 건너뛰며, UTerrainMesh가 아닌 작업물은 대상이 아니다.
        의존:
            U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache}
            UCache — 현재 작업물 목록 조회; 함수: {items()}
            UTerrainMesh — handoff 보류를 무시한 강제 해제; 함수: {dispose()}; 속성 읽기: {_disposed}
        동작: cache 작업물 중 해제되지 않은 UTerrainMesh마다 force 옵션으로 dispose를 호출한다.

    override disposeTile(tile: U3dQuadTile, opt: Partial<{deletefunc: Function}> = {}) -> boolean | undefined
        인터페이스: opt.deletefunc는 기반 구현에 그대로 전달하며, 반환값은 기반 구현의 삭제 완료 여부를 그대로 돌려준다.
        처리 기준: tile 유무 판정과 key 해제는 모두 기반 구현이 담당하므로 이 메서드는 반환 타입만 좁힌다.
        의존:
            U3dLayer — tile 단위 해제; 함수: {disposeTile()}
        동작: 기반 tile 해제를 실행하고 그 결과를 그대로 반환한다.

    _isEmptyTextureError(error: unknown) -> boolean
        역할: 이미지 요청 오류가 재시도할 필요 없는 정상적인 빈 tile을 뜻하는지 판정하는 하위 레이어 확장점이다.
        인터페이스: error는 loader가 전달한 원본 오류이며, 반환이 true이면 cancelable 경로가 그 tile을 빈 결과로 정상 완료한다.
        처리 기준: 공통 이미지 레이어는 오류를 임의로 빈 데이터로 해석하지 않으므로 항상 false를 반환하고, protocol 의미를 아는 하위 레이어(예: XYZ의 404)만 override하여 종료 조건을 제공한다.
        동작: false를 반환한다.

    processTexture(tile: U3dQuadTile, drawArg: UDrawArg, url: string, promise: DeferredObject<U3dQuadTile> = deferred(), options?: ImageTextureProcessOptions) -> DeferredObject<U3dQuadTile>
        인터페이스:
            tile과 drawArg는 texture를 적용할 tile과 당시 draw 상태이다.
            url은 protocol별 하위 레이어가 만든 실제 요청 주소이다.
            promise는 작업 성공·실패를 tile로 전달하는 deferred이며 생략하면 새로 만든다.
        의존: deferred — 기본 작업 완료 객체 생성; 함수: {deferred()}
        동작: abortNetwork가 false가 아니면 tile key별 요청 취소 경로를 사용하고, false이면 legacy 호환 경로를 사용하여 그 deferred를 반환한다.

    _processTextureCancelable(tile: U3dQuadTile, drawArg: UDrawArg, url: string, promise: DeferredObject<U3dQuadTile>) -> DeferredObject<U3dQuadTile>
        역할: tile key별 단일 요청 소유권, 실제 raster 네트워크 중단과 stale callback 차단을 적용한다.
        처리 기준:
            tile key에는 현재 요청 상태 하나만 존재하며 `_activeTextureRequests`와 기반 `_cancelTiles`가 같은 객체를 가리킨다.
            Map과 취소 registry는 저장된 객체 identity가 현재 상태와 같을 때만 제거한다.
            요청이 증가시킨 loading count, deferred와 debug 항목은 성공·오류·취소·교체 중 어떤 경로에서도 각각 한 번만 끝낸다.
            소유권을 잃은 callback의 texture는 GPU 자원과 CPU source 사용권을 모두 해제하고 새 요청의 tile 상태를 바꾸지 않는다.
            하위 레이어가 빈 tile로 판정한 오류(_isEmptyTextureError가 true)는 부모 fallback을 만들 수 없을 때 reject 대신 빈 결과로 정상 완료하며, 이때 texture 없는 불완전한 cache mesh는 함께 제거한다.
        의존:
            defined — 필수 입력과 선택 상태 존재 여부 판정; 함수: {defined()}
            U3dLayer — debug 활성, key·scene cache·tile 상태·loading count·기반 취소 registry 관리; 함수: {isDebugLog(), createKeyFromTile(), getCache(), setStateTile(), resetStateTile(), plusLoadingTile(), minusLoadingTile(), getLoadingTile()}; 속성 읽기·쓰기·삭제: {_cancelTiles}; 속성 읽기: {_cache, _app}
            UCache — scene mesh cache의 key 직접 조회와 빈 tile 완료 시 불완전한 mesh 제거; 함수: {get(), delete()}
            UTextureLoader — raster 요청, decoding, parsing과 callback 실행; 함수: {load()}; 콜백: {성공 callback, 오류 callback, abort callback, parse callback}
            UTextureLoader 요청 handle(networkHandle) — 현재 raster 네트워크 요청 중단; 함수: {cancel()}
            LRUCache — texture data cache 조회·재사용·저장; 함수: {has(), get(), put(), delete()}
            UShaderTerrainDecalManager — texture 이후 uniform 교체 준비 판정과 대기; 함수: {getTerrainTilePresentationState(), isTerrainTileSwapReady(), waitTerrainTileSwapReady()}
            UTexture/UCanvasTexture — cache 재할당과 소유권 없는 자원 반환; 함수: {allocate(), dispose(), close()}
            UImageUtils — image debug mode의 tile 정보 합성; 정적 함수: {drawText()}
            U3dEvent — 부모 tile load 완료를 한 번 기다림; 상수: {TILE.LOAD}
            U3dQuadTile — 부모 요청 상태 조회와 LOAD callback 한 번 등록; 함수: {getWorkStep(), once()}
            UDEF — image debug, tile·process 상태; 상수: {imageDebug, TILE_STATE, PROCESS.WORK_STATE}
            __GInfo__ — 비정상적인 scene cache 중복 호출 안내; 함수: {__GInfo__()}
            DeferredObject(promise) — tile 작업 성공·실패 완료; 함수: {resolve(), reject()}
            parseFunction — 사용자 buffer parsing 위임; 콜백: {parseFunction()}
            Web API image source — cache 용량 계산과 debug image 교체; 속성 읽기: {width, height}; 속성 쓰기: {HTMLImageElement.src}
        동작:
            필수 입력 중 하나라도 없으면 deferred를 reject하고 종료한다.
            tile key와 선택적 debug 항목을 만들고, 자원 해제·현재 요청 분리·loading count 반환·논리 완료·terrain swap 대기를 각각 멱등하게 수행하는 지역 절차를 준비한다.

            scene cache에 완료 texture가 있으면 tile을 완료 상태로 바꾸고, uniform 재평가가 아니면 중복 호출을 알린 뒤 terrain swap 준비를 기다려 cache-hit로 완료한다.
            tile을 loading 상태로 바꾸고 data cache에 같은 key가 있으면 debug mode에서는 그 항목을 버린다. 일반 모드에서는 texture를 allocate하여 tile에 적용하고 IMAGE.LOADED를 발행한 뒤 terrain swap 준비를 기다려 cache-hit로 완료한다. 이 경로는 네트워크 loading count를 증가시키지 않는다.
            같은 key의 이전 요청이 있으면 새 URL과의 동일 여부를 관찰한 뒤 이전 상태의 cancel을 호출한다.
            새 요청 상태의 cancel은 registry에서 먼저 분리하고 가능한 network handle을 중단한 뒤 loading count를 반환하고 tile 상태와 deferred를 취소 결과로 한 번만 정리한다.
            debugEntry가 있으면 새 요청 상태에 그 debugEntry를 연결한다.
            새 상태를 두 registry에 연결하고 loading count를 증가시키며 요청 상태의 loadingCounted를 true로 기록한 뒤 abortable loader 요청을 시작하고, 반환된 요청 handle을 요청 상태의 networkHandle에 보관한다. parseFunction이 있으면 현재 레이어를 this로 하고 tile을 첫 인수로 미리 결합하여 loader에 전달한다. [확인 Q-008]
            성공 callback이 최신 요청이 아니면 loading count와 받은 texture를 해제하고 stale로 끝낸다.
            최신 성공이면 registry와 loading count를 정리하고 texture 이름에 tile key를 붙인다. tile 또는 레이어가 이미 폐기되었으면 texture를 해제하고 취소 결과로 완료한다.
            일반 성공 texture는 debug 문자열을 그리거나 data cache에 width×height를 byteLength로 저장한다. render target이 없으면 GPU texture만 dispose하고 성공 처리하며, target이 있으면 texture를 적용하고 IMAGE.LOADED를 발행한 뒤 terrain swap 준비를 기다려 성공한다. [확인 Q-009]
            오류 callback이 구세대이면 자기 loading count와 log만 끝낸다. 최신 요청이면 오류가 빈 tile 판정인지 먼저 확인하고 tile을 재시도 상태로 되돌린다.
            부모가 없으면 빈 tile 판정일 때 빈 결과로 정상 완료하고, 아니면 상태·registry·count를 정리하고 실패한다.
            부모 cache가 준비되었으면 즉시, 부모가 loading 중이면 LOAD event 뒤에 요청 identity를 다시 확인하여 부모 texture를 만든다. 성공하면 terrain swap을 기다려 fallback으로 완료하고, 부모가 준비될 수 없거나 생성에 실패하면 빈 tile 판정일 때는 빈 결과로 정상 완료하고 아니면 reject한다.
            빈 결과 완료는 registry·loading count를 정리하고, texture 없는 cache mesh가 남아 있으면 삭제 callback으로 제거한 뒤 tile을 완료 상태로 바꾸고 deferred를 resolve한다.
            abort callback은 실제 abort 관찰값을 남긴다. cancel에서 이미 끝났으면 반환하고, 외부 abort이면 registry·count·tile 상태와 deferred를 직접 한 번만 정리한다.
            동기 예외가 발생하면 현재 상태와 loading count를 정리하고 tile을 재시도 가능 상태로 돌린 뒤 deferred와 debug 항목을 error로 끝낸다.

    _processTextureLegacy(tile: U3dQuadTile, drawArg: UDrawArg, url: string, promise: DeferredObject<U3dQuadTile>) -> DeferredObject<U3dQuadTile>
        역할: 자체 worker 등 별도 수명주기를 가진 하위 레이어를 위해 요청별 네트워크 취소와 stale identity 차단을 사용하지 않는 호환 경로를 제공한다.
        처리 기준: texture 적용 뒤 terrain uniform 교체가 준비되어야 deferred를 성공시키며, tile이나 layer가 폐기되었으면 swap 결과와 무관하게 완료한다.
        의존:
            defined — 필수 입력과 cache 상태 존재 여부 판정; 함수: {defined()}
            U3dLayer — key·scene cache·tile 상태·loading count와 legacy 취소 callback 관리; 함수: {createKeyFromTile(), getCache(), setStateTile(), resetStateTile(), plusLoadingTile(), minusLoadingTile(), removeCancelByTile()}; 속성 쓰기·삭제: {_cancelTiles}; 속성 읽기: {_cache}
            UCache — 부모 scene mesh cache의 key 직접 조회; 함수: {get()}
            UTextureLoader — image 요청과 callback 실행; 함수: {load()}; 콜백: {성공 callback, 오류 callback, abort callback, parse callback}
            LRUCache — texture data cache 조회·재사용·저장; 함수: {has(), get(), put(), delete()}
            UShaderTerrainDecalManager — presentation 상태와 terrain swap 준비 대기; 함수: {getTerrainTilePresentationState(), isTerrainTileSwapReady(), waitTerrainTileSwapReady()}
            UTexture/UCanvasTexture — cache texture 재할당과 GPU 해제; 함수: {allocate(), dispose()}
            UImageUtils — image debug mode의 tile 정보 합성; 정적 함수: {drawText()}
            U3dEvent — 부모 tile LOAD event 대기; 상수: {TILE.LOAD}
            U3dQuadTile — 부모 요청 상태 조회와 LOAD callback 한 번 등록; 함수: {getWorkStep(), once()}
            UDEF — tile·process 상태와 image debug 판정; 상수: {TILE_STATE, PROCESS.WORK_STATE, imageDebug}
            __GInfo__ — scene cache 중복 호출 안내; 함수: {__GInfo__()}
            DeferredObject(promise) — tile 작업 성공·실패 완료; 함수: {resolve(), reject()}
            parseFunction — 사용자 buffer parsing 위임; 콜백: {parseFunction()}
            Web API image source — cache 용량 계산과 debug image 교체; 속성 읽기: {width, height}; 속성 쓰기: {HTMLImageElement.src}
        동작:
            필수 입력 중 하나라도 없으면 deferred를 reject하고 종료한다.
            scene cache에 완료 texture가 있으면 tile을 완료 상태로 바꾸고 terrain swap 준비 뒤 성공한다. uniform 재평가가 아니면 중복 호출을 알린다.
            tile을 loading 상태로 바꾸고 loading count를 증가시킨다. data cache hit이면 texture를 allocate하여 적용하고 IMAGE.LOADED를 발행한 뒤 swap을 기다려 성공하지만 증가시킨 loading count를 반환하지 않는다. [확인 Q-004]
            cache miss이면 deferred reject callback을 기반 취소 registry에 저장하고 loader를 시작한다. parseFunction이 있으면 현재 레이어와 tile을 결합하여 전달한다. [확인 Q-008]
            성공하면 loading count와 취소 등록을 제거한다. 폐기된 tile 또는 render target이 없는 tile은 GPU texture를 dispose하고 완료하며, 정상 tile은 debug image 또는 data cache를 준비한 뒤 texture를 적용하고 event를 발행하여 swap 준비 뒤 성공한다. [확인 Q-009]
            오류 시 tile 상태를 되돌리고 부모 cache가 있으면 즉시, 부모가 loading이면 LOAD event 뒤에 부모 texture를 만든다. 부모가 없거나 준비되지 않거나 생성에 실패하면 loading count를 줄이고 reject한다.
            abort callback은 tile 상태, loading count와 deferred를 실패로 정리한다.
            terrain swap 대기 Promise가 reject되면 처리하는 catch가 없어 deferred가 완료되지 않을 수 있고, 동기 예외에서도 증가한 loading count를 반환하지 않는다. [확인 Q-004]

    override setOpacity(val: number) -> void
        처리 기준: forceTransparent가 true이면 material의 투명 상태를 계속 true로 유지한다.
        의존:
            defined — material 존재 여부 판정; 함수: {defined()}
            U3dLayer — opacity 저장, cache key·scene·cache object 조회; 함수: {setOpacity(), getCacheKeys(), getScene(), getCacheByKey()}; 속성 읽기: {_opacity, _cache}
            TerrainMaterial — terrain 투명 상태와 opacity 반영; 함수: {setTerrainBaseTransparent()}; 속성 쓰기: {transparent, needsUpdate, opacity}
            Three.js Object3D — scene·cache object의 material 순회; 함수: {traverse()}
        동작:
            기반 opacity를 적용하고 forceTransparent이면 레이어 투명 상태를 true로 고정한다.
            cache key가 없으면 scene 전체를, 있으면 각 cache object를 순회하여 단일 material의 투명 상태와 opacity를 갱신한다. material 배열은 건너뛴다. [확인 Q-006]

    deleteMaterial(mesh: Object3D) -> void
        의존:
            defined — map과 원본 map 존재 여부 판정; 함수: {defined()}
            UTexture/UCanvasTexture — map과 원본 map의 GPU 자원 해제; 함수: {dispose()}
            Three.js Material — 단일 material GPU 자원 해제; 함수: {dispose()}
        동작:
            material이 없으면 종료한다.
            material 배열이면 각 map과 _oriMap을 dispose하고 참조를 비운 뒤 mesh의 material 참조를 제거하지만 각 material 자체는 dispose하지 않는다. [확인 Q-006]
            단일 material이면 map과 _oriMap을 dispose하고 참조를 비운 뒤 material 자체와 mesh의 material 참조를 제거한다.

    deleteGeometry(mesh: Object3D) -> void
        처리 기준: 지형 mesh의 geometry는 tile과 공유하는 UPlaneBufferGeometry이므로 dispose()는 이 레이어의 공유분 반납이며 마지막 소유자일 때만 GL 자원이 해제된다.
        의존: UPlaneBufferGeometry — 공유 geometry의 공유분 반납; 함수: {dispose()}
        동작: geometry가 있으면 dispose하고 mesh의 geometry 참조를 제거한다.

    deleteMesh(mesh: Object3D | Material) -> void
        처리 기준: Mesh가 아닌 대상의 dispose가 Object3D 기본 구현과 다른 함수이면 그 함수만 실행하고 종료한다.
        의존:
            Three.js Mesh — Mesh 경로 판정; 생성자: {Mesh}
            동적 disposable(mesh) — Mesh가 아닌 입력의 사용자 자원 해제; 함수: {dispose()}
            Object3D — Three.js 기본 구현으로 해제 이벤트 전달과 child 목록 제거; 함수: {prototype.dispose.call(), clear()}
        동작:
            Mesh가 아닌 대상의 커스텀 dispose 또는 Material.dispose는 호출 후 종료한다.
            그 외 대상은 Object3D.dispose로 해제 이벤트를 전달한다. UMesh의 일괄 정리 대신 레이어가 공유 geometry를 한 번 반납한다.
            그 외 대상의 material과 geometry를 해제한다.
            mesh.children이 있으면 그 복사본을 재귀 정리한 뒤 child 목록을 비운다.

    override fncDeleteGroup(object?: Object3D | Material) -> void
        인터페이스: UCache 삭제 callback으로 사용될 때 UCache가 현재 레이어를 this로 고정하고 삭제할 object 하나만 전달한다.
        처리 기준: object가 없으면 아무 작업도 하지 않는다.
        의존:
            defined — object 존재 여부 판정; 함수: {defined()}
            UGroup — group에서 object 제거; 함수: {remove()}
            U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_group}
        동작: object를 현재 레이어 group에서 제거하고 deleteMesh로 깊은 정리를 수행한다.

    override getTileFromScene(tile: U3dQuadTile) -> UMesh | undefined
        의존:
            defined — tile·scene·cache object 존재 여부 판정; 함수: {defined()}
            U3dLayer — scene과 tile cache object 조회; 함수: {getScene(), getCache()}; 속성 읽기: {_group}
            UGroup — object가 현재 group child인지 판정; 함수: {has()}
        동작: tile, scene과 cache object가 있고 group이 해당 object를 포함하면 반환하며 그 외에는 undefined를 반환한다.

    override addTileFromScene(tile: U3dQuadTile) -> boolean
        의존:
            defined — scene·cache object와 group 존재 여부 판정; 함수: {defined()}
            U3dLayer — 기반 tile scene 상태 처리와 cache 조회; 함수: {addTileFromScene(), getScene(), getCache()}; 속성 읽기: {_group}
            UGroup — 표시 object를 group에 추가; 함수: {add()}
            UMesh — shadow 적용 시작; 함수: {applyShadow()}
            Web API — shadow 적용 시각 조회; 함수: {performance.now()}
            UShaderTerrainDecalManager — 같은 key의 handoff 잔여물 즉시 정리 요청; 함수: {releaseTerrainHandoffResidues()}
        동작: 기반 처리를 실행한 뒤 tile이 visible이고 scene·cache object·group이 있으면 object를 보이게 추가하고 shadow를 적용한 다음, 같은 key의 옛 표면이 더 필요 없으므로 manager에 이 레이어의 handoff 잔여물 정리를 요청하고 true를 반환하며, 아니면 false를 반환한다.

    override disposeTileByKey(key: string, opt: Partial<{deletefunc: Function, terrainHandoffFinalizing: boolean}> = {deletefunc: undefined}) -> boolean
        인터페이스: opt.deletefunc를 지정하면 UCache가 현재 레이어를 callback의 this로 사용하고 삭제할 object 하나만 전달한다.
        처리 기준:
            해제 보류 여부는 manager registry가 아니라 작업물 mesh 자신이 판단한다. UTerrainMesh.dispose()가 true를 반환하지 않으면 아직 해제할 수 없는 상태이므로 기반 해제를 하지 않고 false로 알린다.
            UTerrainMesh가 아닌 작업물과 해제가 끝난 작업물은 기반 key 해제를 그대로 실행한다.
        의존:
            UCache — 현재 작업물 조회; 함수: {get()}; 속성 읽기: {_cache}
            UTerrainMesh — 작업물 해제와 보류 판정; 함수: {dispose()}
            U3dLayer — key의 scene·cache 자원 정리; 함수: {disposeTileByKey()}; 속성 읽기: {_cache}
        동작:
            cache에서 key의 현재 작업물을 조회한다.
            작업물이 UTerrainMesh이고 dispose()가 true가 아니면 false를 반환한다.
            그 밖의 경우 기반 key 해제를 실행하고 true를 반환한다.

    override setRenderOrder(val: number) -> void
        역할: 레이어 렌더 순서를 바꾸고 이미 만들어진 terrain mesh binding에도 즉시 반영한다.
        처리 기준: 이전 값과 같으면 mesh 갱신을 생략한다.
        의존:
            U3dLayer — 기반 렌더 순서 조회와 설정; 함수: {getRenderOrder(), setRenderOrder()}; 속성 읽기: {_cache, _app}
            UCache — 현재 작업물 순회; 함수: {items()}
            UTerrainMesh — terrain mesh 렌더 순서 반영; 함수: {setTerrainRenderOrder()}
            U3dApp — 다시 그리기 요청; 함수: {changeUpdate()}
        동작: 이전 값을 기억하고 기반 설정을 실행한 뒤 값이 달라졌으면 cache의 UTerrainMesh마다 렌더 순서를 반영하고 앱에 갱신을 요청한다.

    override suspendTilePresentation(tile: U3dQuadTile) -> boolean
        역할: 준비가 끝나지 않은 tile의 cache object를 Group에서만 분리해 노출을 보류한다.
        처리 기준:
            tile 작업 상태와 texture 자원은 유지하므로 진행 중인 이미지 로딩이 취소되지 않고 다음 frame의 addTileFromScene 호출이 그대로 이어진다.
            이미 분리된 cache object를 다시 건드리면 frame마다 shadow 재계산이 반복되므로 표시 중일 때만 분리한다.
            cache object가 아직 없더라도 준비 중인 tile이므로 강제 제거 경로로 되돌리지 않고 true를 반환한다.
        의존:
            defined — scene·cache object와 group 존재 여부 판정; 함수: {defined()}
            U3dLayer — scene과 cache object 조회; 함수: {getScene(), getCache()}; 속성 읽기: {_group}
            UGroup — 표시 여부 확인과 분리; 함수: {has(), remove()}
            UTerrainMesh — terrain mesh 가시성 해제; 함수: {setTerrainVisible()}
            UMesh — shadow 해제; 함수: {applyShadow()}
            Web API — shadow 적용 시각 조회; 함수: {performance.now()}
        동작: scene과 cache object가 있고 표시 중이면 UTerrainMesh는 terrain 가시성을, 그 밖의 object는 visible을 끄고 group에서 제거한 뒤 shadow를 해제하며, 어느 경우에도 true를 반환한다.

    isTilePresentationParticipant(tile: U3dQuadTile) -> boolean
        역할: 이미지 작업 스케줄러와 같은 기준으로 이 레이어가 해당 tile의 표시 준비에 참여하는지 판정한다.
        처리 기준:
            tile이 없거나 해제됐으면 참여하지 않는다.
            최소 레벨보다 낮은 tile은 참여하지 않으며, 최대 레벨 사용이 켜져 있으면 최대 레벨을 넘는 tile도 참여하지 않는다.
            경계 상자가 지정된 레이어는 초기화 전이거나 tile이 경계와 교차하지 않으면 참여하지 않는다.
        의존:
            defined — 경계 상자 존재 여부 판정; 함수: {defined()}
            U3dLayer — 레벨 범위·경계 상자·초기화 상태 조회와 3D 영역 교차 판정; 함수: {isInitialized(), intersects3D()}; 속성 읽기: {_minlevel, _maxlevel, _box3}
            U3dQuadTile — 해제 여부·레벨·경계 조회; 속성 읽기: {_disposed, _rlevel, _rectangle3d, _drawArg}
            UDrawArg — 경계 교차 판정; 함수: {intersectsBox()}
        동작: 해제·레벨·경계 상자 조건을 차례로 확인하고, 레이어의 3D 영역 교차 판정이 있으면 tile의 3D 영역까지 검사하여 하나라도 어긋나면 false를, 모두 통과하면 true를 반환한다.

    isTilePresentationVisible(tile: U3dQuadTile) -> boolean
        역할: tile의 cache object가 실제로 레이어 Group에 부착되어 표시 중인지 확인한다.
        처리 기준:
            표시 준비에 참여하지 않는 tile은 판정 대상이 아니므로 true를 반환한다.
            cache object 가 아직 없는 tile 은 표시 실패가 아니라 판정 근거가 없는 상태이므로 중립으로 true 를 반환한다. 새로 추가된 레이어가 다른 레이어의 기존 Coverage 를 미부착으로 만들어 LOD 전환을 되돌리지 않게 하기 위함이며, 최신 texture 준비는 isTileRenderableReady 가 계속 엄격하게 판정한다.
        의존:
            U3dLayer — cache object 조회; 함수: {getCache()}; 속성 읽기: {_group}
            UGroup — 부착 여부 확인; 함수: {has()}
        동작: 참여 여부와 tile visible 을 확인한 뒤 cache object 가 없으면 true 를, 있으면 살아 있고 visible 이며 group 에 있을 때만 true 를 반환한다.

    isTileRetainedPresentationSafe(tile: U3dQuadTile) -> boolean
        역할: 최신 terrain 합성 중에도 현재 이미지 mesh가 직전 적용본으로 coverage를 제공할 수 있는지 판정한다.
        처리 기준:
            표시 준비에 참여하지 않는 tile은 판정 대상이 아니므로 true를 반환한다.
            cache object 가 없는 tile 은 직전 적용본도 없으므로 false 를 반환한다. isTilePresentationVisible 의 중립 판정이 여기로 이어지지 않게 하기 위함이다.
            실패 revision 판정은 Manager·다른 Layer와 같은 순수 함수를 공유한다.
            material binding이 현재 mesh를 가리키고 texture가 준비된 경우에만 안전하다고 본다.
        의존:
            U3dLayer — cache object 조회와 app 접근; 함수: {getCache()}; 속성 읽기: {_app}
            UShaderTerrainDecalManager — tile registry 조회; 속성 읽기: {TERRAIN_TILE_REGISTRY}
            hasTerrainTileFailedCurrentRevision — UShaderTerrainDecalTileStateManager 모듈의 실패 revision 판정 함수; 함수: {hasTerrainTileFailedCurrentRevision()}
            U3dApp — manager 조회; 함수: {getTerrainDecalManager()}
        동작: 참여·표시 여부를 확인하고 cache object 가 없으면 false 를, UTerrainMesh 가 아니면 true 를, UTerrainMesh이면 registry entry와 material binding을 조회해 실패 revision이 아니고 binding이 현재 mesh와 준비된 texture를 가리키면 true를 반환한다.

    disposeTerrainHandoffResidue(key: string, mesh: Object3D) -> void
        역할: handoff가 끝난 잔여물 mesh를 group에서 제거하고 texture 소유권을 가려 자원을 해제한다.
        처리 기준:
            mesh가 없거나 같은 key의 현재 cache 작업물과 같은 객체이면 아무 작업도 하지 않는다.
            잔여물 material의 map·_oriMap이 같은 key의 살아 있는 작업물 texture와 같은 객체이면 참조만 끊고 해제하지 않는다.
            data cache가 보유한 texture는 deleteMesh의 GPU dispose만 받고 CPU source는 닫지 않는다.
            어느 쪽에도 속하지 않는 잔여물 전용 texture는 GPU dispose 뒤 close 함수가 있으면 CPU source도 닫는다.
        의존:
            defined — mesh 존재 여부 판정; 함수: {defined()}
            UCache — 같은 key의 현재 작업물 조회; 함수: {get()}
            LRUCache — 최근 사용 순서를 바꾸지 않는 data cache texture 조회; 함수: {peek()}
            UGroup — 잔여물 mesh 제거; 함수: {remove()}
            UTexture/UCanvasTexture — 잔여물 전용 texture의 CPU source 해제; 함수: {close()}
            U3dLayer — 기반 레이어 상태 접근; 속성 읽기: {_cache, _group}
        동작:
            같은 key의 살아 있는 작업물 material에서 map·_oriMap을 모으고 data cache의 texture를 순서 변경 없이 조회한다.
            잔여물 material의 map·_oriMap마다 살아 있는 texture와 같으면 참조를 끊고, data cache texture가 아니면 닫을 목록에 넣는다.
            mesh를 group에서 제거하고 material·geometry·child를 정리한 뒤 닫을 목록의 texture를 close한다.

    #isTextureHeldByResidue(key: string, texture: Texture) -> boolean
        인터페이스: texture가 key의 handoff 잔여물 material에서 map 또는 _oriMap으로 쓰이고 있으면 true를 반환한다.
        의존: UShaderTerrainDecalManager — 이 레이어의 handoff 잔여물 목록 조회; 함수: {getTerrainHandoffResidues()}
        동작: key의 잔여물 mesh를 순회하여 material의 map 또는 _oriMap이 texture와 같은 것이 있으면 true, 없으면 false를 반환한다.

    override removeTileFromScene(tile: U3dQuadTile) -> boolean
        의존:
            defined — scene·cache object와 group 존재 여부 판정; 함수: {defined()}
            U3dLayer — 기반 tile scene 상태 처리와 cache 조회; 함수: {removeTileFromScene(), getScene(), getCache()}; 속성 읽기: {_group}
            UGroup — 표시 object를 group에서 제거; 함수: {remove()}
            UMesh — shadow 적용 해제; 함수: {applyShadow()}
            Web API — shadow 해제 시각 조회; 함수: {performance.now()}
        동작: 기반 처리를 실행한 뒤 tile이 보이지 않고 scene·cache object·group이 있으면 object를 숨기고 제거하며 shadow 적용을 해제하여 true를 반환하고, 아니면 false를 반환한다.

    override update(drawArg?: UDrawArg) -> void
        처리 기준: drawArg가 없으면 기반 update도 호출하지 않는다.
        의존:
            defined — drawArg 존재 여부 판정; 함수: {defined()}
            U3dLayer — 매 frame 공통 레이어 갱신; 함수: {update()}
        동작: drawArg가 있으면 기반 update에 전달한다.

    createParentTexture(tile: U3dQuadTile) -> boolean | DeferredObject<U3dQuadTile> | undefined
        역할: 부모 tile의 texture source와 누적 UV 변환을 사용하여 자식 tile 영역의 임시 texture를 만든다.
        처리 기준:
            하위 레이어는 성공을 해당 tile로 이행되는 DeferredObject로 반환할 수 있으며, 호출부는 반환값을 참·거짓으로만 판정한다.
            tile·부모·부모 mesh·부모 texture와 자식 mesh 조건을 충족하지 못하면 tile을 재시도 상태로 돌리거나 undefined를 반환한다.
            부모 fallback texture는 data cache가 아니라 자식 material이 소유하며 GPU dispose event에서 CPU source 사용권을 한 번 반환한다.
        의존:
            defined — tile·parent·mesh·material과 texture 존재 여부 판정; 함수: {defined()}
            U3dLayer — tile key·cache·상태와 재시도 관리; 함수: {getCache(), getStateTile(), setStateTile(), restartTile()}; 속성 읽기: {_cache, _visible, _app}
            UCache — 부모 tile key 생성과 mesh 직접 조회; 함수: {createKeyByTile(), get()}
            U3dQuadTile — 부모 tile 조회; 함수: {getParent()}
            UImageUtils — 부모 source 공유 또는 debug canvas 생성과 자식 UV 영역 변환; 정적 함수: {createTextureFromTile(), drawTextFromCanvas()}
            UTexture/UCanvasTexture — dispose event와 CPU source 사용권 해제; 함수: {addEventListener(), removeEventListener(), close()}
            UDEF — image debug, texture 개선과 tile 상태; 함수: {setTextureImprovement(), noResizeTexture()}; 상수: {imageDebug, IMPROVE_TEXTURE_LEVEL, TILE_STATE}
            U3dApp — texture 품질값과 renderer 제공; 함수: {getImproveValue()}; 속성 읽기: {_renderer}
            UShaderTerrainDecalManager — 부모 key를 포함한 자식 texture 준비 통지; 함수: {setTerrainTileTextureReady()}
        동작:
            사용할 수 없는 tile, 폐기된 tile 또는 숨은 레이어이면 종료한다. 부모가 없거나 부모 cache mesh가 없으면 tile을 재시도 상태로 바꾸고 종료한다.
            tile이 이미 loading 이상이면 종료하고, 아니면 loading으로 바꾼다. 자식 원본 mesh가 없으면 재시도 상태로 되돌린다.
            자식 cache mesh에 이미 texture가 있으면 tile을 완료하고 true를 반환한다. cache mesh가 없으면 새 지형 mesh를 만든다.
            부모 material의 texture가 없으면 재시도 상태로 되돌린다.
            일반 모드에서는 부모 source를 공유하고 자식 quad 영역에 맞는 UV matrix를 누적하며, image debug mode에서는 독립 canvas에 tile 정보를 그린다.
            새 fallback texture의 dispose event에는 listener 자체를 제거하고 CPU source를 close하는 callback을 등록한다.
            app 품질 설정에 따라 texture 개선 또는 resize 방지를 적용하고 자식 material에 연결한 뒤 manager에 texture 준비를 통지한다.
            IMAGE.LOADED를 발행하고 tile을 완료 상태로 바꾼 뒤 true를 반환한다.

    override createTexture(tile: U3dQuadTile, opt: Partial<{noParentTexture: boolean}> = {}) -> boolean | null | undefined
        역할: 공통 조건과 부모 영상 대체 정책을 검사하여 하위 레이어가 실제 texture 작업을 시작해도 되는지 결정한다.
        인터페이스: tile은 level·mesh·drawArg와 영역을 가진 필수 지형 tile이고, opt는 부모 texture 사용 제어값을 전달한다.
        처리 기준:
            true는 하위 레이어가 실제 요청을 계속할 수 있음을 뜻하고, null은 거부·완료·부모 대체 결과로 후속 요청을 중단함을 뜻한다.
            opt.noParentTexture는 boolean 값이 아니라 정의 여부로 max-level 부모 fallback을 비활성화한다. 사전 생성 타일셋을 그대로 요청하는 하위 레이어(WMTS)는 이 키를 정의하여 부모 fallback을 끄는 것이 결정된 정책이다.
        의존:
            defined — tile·mesh·상태·parent 존재 여부 판정; 함수: {defined()}
            U3dLayer — tile 상태·표시 영역·재시도 상태 관리; 함수: {getStateTile(), setStateTile(), resetStateTile(), intersects()}; 속성 읽기: {_visible, _minlevel, _maxlevel}
            U3dQuadTile — 전체 허용 최대 level 조회; 정적 함수: {getMaxLevel()}
            UDrawArg — 현재 pass level 조회; 함수: {getPassLevel()}
            UDEF — tile 상태 범위; 상수: {TILE_STATE}
        동작:
            tile level을 먼저 읽은 뒤 tile 유효성을 검사하므로 tile은 필수 사전 입력이다.
            폐기 tile, mesh 없음, 숨은 레이어, 최소 level 미만, 이미 시작된 상태, 표시 영역 밖 또는 전체 최대 level 초과이면 필요한 상태를 정리하고 null을 반환한다.
            허용 tile을 시작 상태로 바꾼다. 현재 pass level보다 높고 burnLevels에 포함되면 부모 texture를 시도하며 성공하면 null을 반환한다.
            noParentTexture가 정의되지 않고 layer 최대 level을 넘으면 부모 mesh가 있을 때 부모 texture를 시도하며 성공하면 null을 반환한다.
            부모 대체로 끝나지 않았으면 실제 하위 texture 처리를 허용하는 true를 반환한다.

    isTexture(tile: U3dQuadTile) -> boolean
        인터페이스: tile cache mesh의 첫 material에 완료된 image texture가 있는지를 반환한다.
        처리 기준: complete 속성은 HTMLImageElement에만 있으므로 canvas·ImageBitmap처럼 속성이 없는 image는 완료로 판정하고, 속성이 있으면 false가 아닐 때만 완료로 판정한다.
        의존:
            defined — mesh·material·map·image와 완료 상태 존재 여부 판정; 함수: {defined()}
            U3dLayer — tile cache mesh 조회; 함수: {getCache()}
            Web API HTMLImageElement — texture image의 load 완료 판정; 속성 읽기: {complete}
        동작: mesh, material, map과 object인 image가 있고 image가 complete 속성이 없거나 false가 아닌 complete 값을 가지면 true를 반환하며, 그 외에는 false를 반환한다.

    createMeshFromTile(tile: U3dQuadTile) -> UTerrainMesh
        역할: image texture와 terrain decal uniform을 받을 지형 mesh를 만들고 cache·manager에 등록한다.
        처리 기준: 기반 cache가 실제 UCache가 아니거나 tile의 원본 mesh가 없으면 정상 생성할 수 없다. [확인 Q-002]
        의존:
            defined — 타일의 원본 mesh 존재 여부 판정; 함수: {defined()}
            UDEF — image terrain material 생성, normal texture와 개선 level; 함수: {createOrSetImageLayerMaterial(), setTerrainNormalTexture()}; 상수: {IMPROVE_TEXTURE_LEVEL}
            U3dApp — 현재 texture 개선 수준 조회; 함수: {getImproveValue()}
            UTerrainMesh — tile geometry와 image material을 연결하고 layer·animation·색상 상태 반영; 생성자: {new UTerrainMesh()}; 함수: {setLayerName(), animationOpacity()}; 속성 쓰기: {brightness, contrast, saturation, hueRotation, lightColorTone, darkColorTone, lightColorToneEnabled, darkColorToneEnabled, lightColorToneExposure, darkColorToneExposure, renderOrder}
            TerrainMaterial — terrain base 표시 상태 설정; 함수: {setTerrainBaseTransparent()}; 속성 쓰기: {transparent, opacity}
            UShaderTerrainDecalManager — tile·mesh·material과 초기 texture 상태 등록; 함수: {registerTerrainMesh()}
            U3dLayer — tile render order 조회; 함수: {getRenderOrderAtTile()}; 속성 읽기: {_cache, _app, _opacity, _name, _animation}
            UCache — tile key 생성과 생성 mesh 등록; 함수: {createKeyByTile(), add()}
        동작:
            image terrain material을 만들고 개선 수준이 medium보다 높으면 tile level의 normal texture를 설정한다.
            terrain 전용 함수가 있으면 그 함수로, 아니면 material 속성으로 투명 상태를 설정하고 opacity를 적용한다.
            cache key를 만들고 tile 원본 mesh가 없으면 예외를 던진다.
            UTerrainMesh를 만들고 현재 밝기·대비·채도·색조·색상톤 값과 layer 이름, render order와 tile key를 반영한다.
            manager에 parent key, visibility, texture 미준비와 owner 정보를 등록한다. animation이 켜져 있으면 초기 opacity animation을 적용하고 mesh를 cache에 넣어 반환한다.

    setDepthWrite(tile: U3dQuadTile, val: boolean) -> void
        의존:
            defined — cache mesh와 material 존재 여부 판정; 함수: {defined()}
            U3dLayer — tile cache mesh 조회; 함수: {getCache()}
            Three.js Material — 깊이 쓰기 상태 반영; 속성 쓰기: {depthWrite}
        동작: cache mesh와 첫 material이 있으면 material의 depthWrite를 val로 설정한다.

    updateTileTexture(tile: U3dQuadTile, texture: UTexture | UCanvasTexture) -> void
        역할: tile의 지형 material에 새 image texture를 적용하고 terrain manager에 준비를 알린다.
        처리 기준: 기존 material map과 새 texture가 다르면 기존 GPU map을 먼저 dispose한다. CPU source 해제는 data cache 또는 fallback texture의 소유권 정책에 맡긴다.
        의존:
            defined — cache mesh·material과 기존 map 존재 여부 판정; 함수: {defined()}
            U3dLayer — tile cache mesh 조회; 함수: {getCache()}; 속성 읽기: {_app}
            UTexture/UCanvasTexture — 사용할 수 없는 새 texture와 기존 GPU map 해제 및 Y축 상태 반영; 함수: {dispose()}; 속성 읽기·쓰기: {flipY}
            U3dApp — texture 개선 수준과 renderer 제공; 함수: {getImproveValue()}; 속성 읽기: {_renderer}
            UDEF — texture 개선 또는 resize 방지 설정; 함수: {setTextureImprovement(), noResizeTexture()}; 상수: {IMPROVE_TEXTURE_LEVEL}
            UShaderTerrainDecalManager — 실제 child texture 준비 통지; 함수: {setTerrainTileTextureReady()}
            TerrainMaterial — 표시 texture 교체; 속성 읽기·쓰기: {map}
            __GInfo__ — 작업 배정 시점의 cache 잔존 진단 안내; 함수: {__GInfo__()}
        동작:
            tile이 폐기되었으면 새 texture를 dispose하고 종료한다.
            cache mesh가 이미 있으면 작업 배정 시점에는 cache가 비어 있어야 한다는 불변식이 깨진 것이므로 진단 안내만 남기고 그 mesh를 그대로 쓰며, 없으면 생성하고 다시 조회한다. 그래도 mesh 또는 material이 없으면 새 texture를 dispose하고 종료한다.
            기존 map이 새 texture와 다르면 기존 map을 dispose한다.
            app 품질에 따라 새 texture 개선 또는 resize 방지를 적용하고 flipY를 layer 값과 맞춘 뒤 material map에 연결한다.
            manager에 parent key와 함께 child texture 준비를 통지한다.

    override refresh() -> void
        역할: 요청·표시 상태와 texture data cache를 초기화하고 현재 quadtree cache의 tile texture를 다시 준비한다.
        의존:
            U3dLayer — 진행 요청과 scene·tile cache의 공통 refresh; 함수: {refresh()}; 속성 읽기: {_drawArg}
            LRUCache — 보유 texture 목록 조회와 cache 비우기; 함수: {length(), values(), clear()}
            UCache — quadtree tile cache 목록 조회; 함수: {items()}
            UTexture/UCanvasTexture — data cache의 GPU·CPU 자원 해제; 함수: {dispose(), close()}
            createTexture 반환 thenable — 비동기 texture 성공 callback 등록; 함수: {then()}
        동작:
            cache의 지형 mesh를 모두 강제 해제한 뒤 기반 refresh를 실행하고, data cache의 모든 texture를 dispose·close한 뒤 cache를 비운다.
            현재 _drawArg가 없으면 종료한다.
            _drawArg가 있으면 quadtree cache의 각 tile에 texture 생성을 요청한다. 결과가 thenable이면 성공 callback에서, 결과가 true이면 즉시 tile을 scene에 추가한다.

    isTileRenderableReady(tile: U3dQuadTile) -> boolean
        인터페이스: tile이 실제 parent·child 교체에 사용할 수 있는지 반환한다.
        의존:
            U3dLayer — tile cache mesh 조회; 함수: {getCache()}
            UTerrainMesh — texture와 terrain uniform swap 준비 판정; 함수: {isTerrainRenderableReady()}
        동작: 표시 준비에 참여하지 않는 tile은 true, tile key나 cache mesh가 없으면 false를 반환하고, UTerrainMesh가 아니면 true, UTerrainMesh이면 mesh 자신의 준비 판정 결과를 반환한다. [확인 Q-010]

    #dispatchImageLoaded(object: Object3D | undefined, tile: U3dQuadTile) -> void
        의존:
            defined — event 대상 object와 tile 존재 여부 판정; 함수: {defined()}
            U3dLayer — 레이어 event 발행; 함수: {dispatchEvent()}
            U3dEvent — image load 완료 event type; 상수: {IMAGE.LOADED}
            __GSError__ — 작업 객체 없는 event 발행의 시스템 오류 보고; 함수: {__GSError__()}
        동작: object와 tile이 모두 있으면 object를 data로 IMAGE.LOADED event를 발행하고, 아니면 레이어 작업 객체가 없다는 시스템 오류를 보고한다.

    #applyClippingPlanes(mesh: Object3D) -> void
        동작: 대상 객체와 현재 레이어의 clipping 상태를 전달하여 material에 평면 목록을 반영한다. 그룹 이벤트와 목록의 소유권은 레이어가 유지한다.

    #clearClippingPlanes(mesh: Object3D) -> void
        동작: 대상 객체를 전달하여 material의 평면 참조를 제거한다. material과 평면 자원은 해제하지 않는다.

imageDebugNow() -> number
    의존: Web API — 가능한 경우 고해상도 현재 시각 조회; 함수: {performance.now()}
    동작: Performance API를 사용할 수 있으면 performance.now 값을, 아니면 Date.now 값을 반환한다.

roundImageDebugTime(value: number) -> number
    동작: 밀리초 값을 소수점 셋째 자리까지 반올림하여 반환한다.

getImageRequestErrorMessage(error: unknown) -> string | undefined
    의존: defined — 오류 값 존재 여부 판정; 함수: {defined()}
    동작: 값이 없으면 undefined, 문자열이면 그대로, name과 message가 있으면 결합한 문자열, message만 있으면 그 값을 반환한다. 그 외에는 String 변환을 시도하고 변환도 실패하면 `unknown-error`를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
tile key별 cancelable 요청은 `_activeTextureRequests`와 기반 `_cancelTiles`에서 같은 상태 객체로 연결하며, identity가 일치하는 현재 소유자만 registry·loading count·deferred를 종료한다.
scene mesh cache, handoff 잔여물과 LRU data cache가 같은 texture 객체를 공유할 수 있으므로 data cache 제거만으로 scene 작업물이나 잔여물이 쓰는 texture를 dispose·close하지 않는다.
tile 생애가 끝난 작업물은 즉시 scene mesh cache와 tile 작업 상태에서 제외하며, handoff 동안 화면에 남는 옛 mesh는 작업물이 아닌 잔여물로 manager가 보관하고 이 레이어의 disposeTerrainHandoffResidue()만이 정리한다.
부모 fallback texture는 자식 material이 직접 소유하고 dispose event에서 CPU source 사용권을 반환한다.
texture를 material에 적용한 것만으로 tile 처리를 완료하지 않고, terrain decal manager가 있으면 texture와 uniform의 parent·child 교체 준비까지 기다린다.
debug log 상세 entries는 수를 제한하지만 현재 generation의 summary는 전체 작업을 누적하며, 이전 generation callback은 새 summary를 변경하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
