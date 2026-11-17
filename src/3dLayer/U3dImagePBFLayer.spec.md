# U3dImagePBFLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

PBF 벡터 타일을 해석하여 캔버스 이미지로 그린 뒤 지형 이미지 타일에 적용하는 레이어다.

### 1.2 책임 범위

메타데이터에 따른 소스 레벨·경계 보완, 워커 또는 메인 스레드의 PBF 처리, 피처·텍스처 캐시와 조상 데이터를 확대해 그리는 경로를 담당한다. XYZ URL 치환과 일반 이미지 레이어의 상태·메시·작업 수명주기를 재사용한다.

### 1.3 주요 동작 방식

metadata.json 처리가 끝날 때까지 타일 표시 참여와 생성 요청을 보류한다. 워커 경로는 OffscreenCanvas를 전달하고 결과 비트맵을 텍스처로 적용한다. 메인 경로는 파싱 결과를 캐시하며 실제 최대 레벨을 넘는 타일에서 조상 피처의 해당 영역을 다시 그린다.

### 1.4 주요 사용처와 연계 대상

PBF/MVT 지도 타일 서비스의 영상 표현에 사용한다. U3dImageXYZLayer·U3dImageLayer, UPbfMetadata, UVectorRenderer와 공유 UTaskProcessor가 직접 협력 대상이다.

## 3. 정규 자연어 수도코드

```spec
U3dImagePBFLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        needJson?: boolean = true
            초기화 시 metadata.json을 읽어 범위·레벨을 보완한다.
        styleSldUrl?: string
            직접 readSLD를 호출할 때 읽을 주소
        realMaxLevel?: number
            실제 타일 데이터의 마지막 레벨
        useTestWorker?: boolean = true
            PBF 해석과 그리기를 워커에서 실행한다.
        styleFunction?: PBFStyleFunction
            피처별 그리기 스타일 함수
        transparent?: boolean = true
            타일 재질 알파 합성 여부

U3dImagePBFLayerCO 타입 정의
    U3dImageXYZLayerCO와 U3dImagePBFLayerCO_Content의 교집합이다. 현재 Content의 transparent 기본 true가 부모 이미지 옵션의 기본 false를 대체한다.

PBFStyleFunction 함수 타입 정의
    (feature: unknown, resolution: number) -> Array<unknown>
    인터페이스: feature는 MVT 피처, resolution은 타일의 월드 거리/픽셀 해상도다. 첫 스타일만 사용하며 빈 배열이면 피처를 그리지 않는다. 워커에서는 원문으로 재구성하므로 외부 지역 변수를 참조할 수 없다.

ParsedPBFResult 타입 정의
    [Array<number>, Array<unknown>]
    첫 항목은 타일 내부 좌표 경계이고 두 번째 항목은 해석된 피처 목록이다.

U3dImagePBFLayer extends U3dImageXYZLayer 클래스 정의
    의존:
        U3dImageXYZLayer — 이미지 타일 요청·상태 기반; 상속: {U3dImageXYZLayer}
        UMercator — 타일 좌표·해상도; 생성자: {new UMercator()}
        UTaskProcessor — 공유 PBF 워커 실행기; 생성자: {new UTaskProcessor()}

    static OPT_KEYS: Array<string>
        기반 OPT_KEYS에 needJson·styleSldUrl·realMaxLevel·useTestWorker·styleFunction·transparent를 추가한다.
    static IMAGE_SIZE: number = 256
        타일 캔버스 크기
    static g_TaskProcessor: UTaskProcessor
        task/model/pbf/UPbfParserTask.js를 동시 작업 수 5로 실행하는 공유 처리기
    #featureLURCacheSize: number = 300
        피처 LRU 용량
    #featureLRUCache: LRUCache | undefined
        실제 최대 레벨 피처를 유지하는 LRU
    #featureCache: UCache | undefined
        타일별 파싱 결과
    _needJson: boolean = true
        메타데이터 사용 여부
    #pbfMetadataReady: boolean = true
        최신 메타데이터 요청의 준비 완료 여부
    #pbfMetadataRequested: boolean = false
        initialize의 중복 초기 요청 방지
    #pbfMetadataRequest: {promise: Promise<PbfMetadata>, cancel: () -> void} | undefined
        최신 메타데이터 promise와 cancel
    #explicitOptions: PbfMetadataExplicitOptions
        realMaxLevel과 영역을 생성자에서 직접 지정했는지 보관한다.
    _styleSldUrl: string = ''
        SLD 주소
    _realMaxlevel: number = 0
        서버의 실제 최대 소스 레벨
    _useTestWorker: boolean = true
        워커 처리 여부
    _styleFunction: PBFStyleFunction | undefined
        타일 피처 스타일
    _mercator: UMercator
        타일 좌표 변환기
    _workerRequestIds: Record<string, string>
        타일 key별 현재 워커 요청 ID

    constructor(opt: U3dImagePBFLayerCO)
        의존:
            normalizeOptionKeys — 옵션명 정규화; 함수: {normalizeOptionKeys()}
            defined — 직접 지정 옵션·주소 판정; 함수: {defined()}
            U3dImageXYZLayer — 기반 레이어 초기화; 생성자: {super()}
            U3dLayer — 기본 소스 최대 레벨 조회; 속성 읽기: {_maxlevel}
            defaultValue — 투명도·스타일·레벨·실행 옵션 기본값; 함수: {defaultValue()}
            UMercator — 좌표 변환기; 생성자: {new UMercator()}
            UCache — 피처 캐시; 생성자: {new UCache()}
            LRUCache — 최대 레벨 피처 유지; 생성자: {new LRUCache()}
            Web API — 주소 부재 안내; 함수: {console.info()}
        동작:
            원본 opt.useDataCache를 true로 바꾼 뒤 new.target 기준으로 옵션 키를 정규화한다.
            realMaxLevel과 rectangle·extent·geoExtent의 직접 지정 여부를 저장할 값으로 계산한 뒤 기반 생성자를 호출한다.
            baseUrl이 정의되지 않았으면 안내 후 PBF 전용 상태 초기화를 중단한다.
            needJson은 false와 정확히 같을 때만 끄고 준비 상태는 그 반대로 설정한다.
            transparent 기본 true, SLD 주소 기본 제품 서버 poi.sld, realMaxLevel 기본 기반 _maxlevel, 워커 사용 기본 true와 스타일 함수를 저장한다.
            _parseFunction에 PBF 파서 메서드를 연결한다.
            좌표 변환기·빈 피처 캐시·요청 ID 대응표·용량 300 LRU를 생성한다.

    override dispose() -> void
        의존:
            U3dImageXYZLayer — 기반 해제; 함수: {dispose()}
            U3dLayer — 작업 처리기 해제와 신규 작업 억제; 함수: {_releaseTaskProcessors()}; 속성 쓰기: {_taskProcessorDisposing}
            UPbfMetadata — 진행 중 메타데이터 취소; 함수: {cancel()}
            UCache — 피처 비우기; 함수: {clear()}
            LRUCache — 유지 피처 비우기; 함수: {clear()}
        동작:
            _taskProcessorDisposing을 true로 설정하고 진행 중 메타데이터 요청을 취소한다.
            기반 dispose 후 존재하는 피처 캐시·LRU를 비우고 LRU 참조를 undefined로 지운다.
            예외 발생 여부와 관계없이 finally에서 작업 처리기 사용권을 해제한다.

    #disposeFeatureCacheByKey(key: string) -> void
        의존: UCache — 타일 피처 제거; 함수: {remove()}
        동작: 피처 캐시가 있으면 key 항목을 제거한다.

    override disposeTileByKey(key: string, opt?: Partial<{deletefunc: function(Object3D | Material) -> void}>) -> boolean
        의존: U3dImageXYZLayer — 타일 해제; 함수: {prototype.disposeTileByKey.call()}
        동작:
            현재 객체를 this로 기반 disposeTileByKey에 key·opt를 전달한다.
            결과가 false이면 부가 상태를 건드리지 않고 false를 반환한다.
            _useTestWorker가 true이면 key의 작업을 중단한다.
            _useTestWorker가 false이면 key의 피처 캐시를 제거한다.
            부가 정리가 끝나면 true를 반환한다.

    #abortWorkerTask(key: string) -> void
        의존:
            UTaskProcessor — 모든 워커에 취소 전파; 함수: {allExecTask()}
            UWorkerParameter — 취소 요청 구성; 생성자: {new UWorkerParameter()}
        동작:
            key의 요청 ID가 falsy이면 종료한다.
            대응표의 요청 ID를 삭제하고 UPbfParserTask의 abort 요청을 모든 워커로 전송한다.
            반환된 promise가 거부되어도 추가 오류를 전달하지 않는다.

    getFeatureLRUCache() -> LRUCache | undefined
        동작: #featureLRUCache 참조를 반환한다.

    hasFeatureByKey(key: string) -> boolean
        의존: UCache — 피처 존재 확인; 함수: {has()}
        동작: #featureCache.has(key)를 반환하며 캐시 참조 부재를 별도로 검사하지 않는다.

    getFeatureByKey(key: string) -> ParsedPBFResult | undefined
        의존: UCache — 피처 조회; 함수: {get()}
        동작: 캐시가 있으면 key 값을 반환하고 아니면 undefined를 반환한다.

    addFeatureByKey(key: string, value: ParsedPBFResult) -> void
        의존: UCache — 피처 추가; 함수: {add()}
        동작:
            key의 기존 항목 존재 여부를 판정한다.
            기존 항목이 있으면 제거한 뒤 캐시가 있을 때 value를 추가한다.

    getFeatureKeys() -> Array<string> | undefined
        의존: UCache — 키 목록 조회; 함수: {keys()}
        동작: 캐시가 있으면 keys 결과를 반환하고 아니면 undefined를 반환한다.

    createUrlEx(tx: Array<number>, ty: Array<number>, level: number) -> string
        의존:
            INTERNAL(U3dImageXYZLayer) — XYZ URL 치환; 함수: {replaceUrl()}
            U3dImageXYZLayer — 현재 URL 템플릿·순환 인덱스 조회; 속성 읽기: {_urls, _urlIndex}
            U3dLayer — 기본 타일 URL 조회; 속성 읽기: {_baseUrl}
        동작: _urls가 비어 있지 않은 배열이면 _urlIndex를 길이로 나눈 나머지 위치의 템플릿을, 아니면 _baseUrl을 택하여 tx[0]·ty[0]·level을 치환한 URL을 반환한다.

    getParentTileByKey(tile: U3dQuadTile, orderLevel: number) -> U3dQuadTile | undefined
        의존: defined — 조상 타일 존재 판정; 함수: {defined()}
        동작: 입력 타일의 부모부터 계속 올라가며 _rlevel이 orderLevel과 느슨한 비교로 같으면 반환하고 뿌리를 넘으면 undefined를 반환한다.

    override initialize() -> any
        의존: U3dImageXYZLayer — 기반 초기화; 함수: {prototype.initialize.call()}
        동작: 기반 initialize를 호출하고 needJson이 켜져 있으며 최초 요청 전이면 요청 표식을 켜고 readJson을 시작한다. 반환값은 전달하지 않는다.

    async readSLD() -> Promise<void>
        의존:
            defined — SLD 주소 존재 여부; 함수: {defined()}
            Web API — 인증된 SLD 다운로드와 XML 파싱; 함수: {btoa(), fetch(), Response.text(), DOMParser.parseFromString()}; 생성자: {new DOMParser()}
        동작: _styleSldUrl이 정의되지 않았으면 오류를 던진다. 소스에 고정된 Basic 인증 헤더로 GET 요청하고 응답을 XML로 해석하지만 결과를 보관하거나 스타일에 적용하지 않는다.

    async readJson() -> Promise<void>
        의존:
            requestPbfMetadata — 메타데이터 요청; 함수: {requestPbfMetadata()}
            resolvePbfMetadataLevels — 최소·실제 최대 레벨 채택; 함수: {resolvePbfMetadataLevels()}
            shouldApplyPbfMetadataBounds — 명시한 범위 우선 판정; 함수: {shouldApplyPbfMetadataBounds()}
            UPbfMetadata 요청 객체 — 이전 요청 취소; 함수: {cancel()}
            U3dLayer — 수명·주소·이름·레벨과 표시 영역·갱신 대상; 함수: {convertGeographicToGoogleRectangle()}; 속성 읽기: {_disposed, _baseUrl, _name, _drawArg, _app}; 속성 읽기·쓰기: {_minlevel}; 속성 쓰기: {_rectangle, _rectangle3d, _box3, _boundingBox}
            THREE.Box3 — 적용할 월드 경계; 생성자: {new Box3()}
            UDrawArg — 갱신 시각 요청; 함수: {setUpdateDate()}
            U3dApp — 새 프레임 요청; 함수: {forceUpdate()}
            Web API — 메타데이터 실패 안내; 함수: {console.info()}
        동작:
            _disposed가 true이면 종료한다. 살아 있으면 이전 요청을 취소한 뒤 #pbfMetadataReady를 false로 바꾸어 새 request를 #pbfMetadataRequest에 저장한다.
            응답 후 해제되었거나 현재 요청이 바뀌었으면 결과를 적용하지 않는다.
            metadata의 minzoom이 현재 _minlevel보다 크면 최소 레벨을 올린다. realMaxLevel을 직접 지정하지 않았고 maxzoom이 있으면 _realMaxlevel에 채택하며 그 외에는 기존 값을 유지한다.
            경계 채택 정책이 허용하고 bounds가 있으면 월드 사각형으로 변환한다. 양 끝점과 네 XY가 유한하면 사각형·Box3·위경도 boundingBox를 함께 갱신한다.
            실패했을 때도 해제 또는 대체된 요청이면 조용히 종료하고 현재 요청이면 생성자 옵션으로 진행한다는 안내를 출력한다.
            finally에서 _disposed가 false이고 #pbfMetadataRequest가 request와 같은 경우에만 #pbfMetadataRequest를 undefined로 지우고 #pbfMetadataReady를 true로 바꾼 뒤 갱신 시각·강제 프레임을 요청한다.

    override isTilePresentationParticipant(tile: U3dQuadTile) -> boolean
        의존: U3dImageXYZLayer — 표시 참여·범위 판정; 함수: {isTilePresentationParticipant(), intersects()}
        동작: tile이 truthy이고 메타데이터가 준비되고 타일 범위·레벨이 교차하며 기반 표시 참여도 true인 경우에만 true를 반환한다.

    isTileWorkComplete(tile: U3dQuadTile) -> boolean
        의존:
            U3dImageLayer — 타일 상태 조회; 함수: {getStateTile()}
            UDEF — 완료 상태; 상수: {TILE_STATE._end}
        동작: 메타데이터가 준비되고 타일 상태가 _end와 정확히 같으면 true를 반환한다.

    override createTexture(tile: U3dQuadTile) -> Promise<U3dQuadTile> | undefined
        의존:
            U3dImageLayer — 생성 승인·메인 처리·상태·로딩 수·캐시·텍스처 반영; 함수: {prototype.createTexture.call(), prototype.processTexture.call(), intersects(), setStateTile(), plusLoadingTile(), minusLoadingTile(), getDataCache(), updateTileTexture(), getCache(), setCancelByTile(), getCancelByTile(), removeCancelByTile()}
            U3dImageXYZLayer — 타일 URL; 함수: {createUrl()}
            U3dLayer — 공유 처리기 사용 등록; 함수: {_useTaskProcessor()}
            defined — 요청 URL·워커 결과·타일 자원 존재 여부; 함수: {defined()}
            UDEF — 디버그·작업 ID·완료 상태; 정적 함수: {createUUID()}; 상수: {TILE_STATE._end}; 속성 읽기: {imageDebug}
            LRUCache — 텍스처 캐시; 함수: {has(), get(), delete(), put()}
            UCanvasTexture — 비트맵 텍스처·재사용 참조; 생성자: {new UCanvasTexture()}; 함수: {allocate()}
            UMercator — 타일 해상도·요청 타일 좌표; 함수: {Resolution(), MetersToTile()}
            deferredPromise — 요청 종결 객체; 함수: {deferredPromise()}
            UWorkerParameter — 전송 가능한 작업 자료; 생성자: {new UWorkerParameter()}
            UTaskProcessor — PBF 워커 작업; 함수: {scheduleTask()}
            U3dEvent — 로딩 이벤트; 상수: {IMAGE.LOADED}
            Web API — 캔버스·비트맵·오류 안내; 함수: {document.createElement(), HTMLCanvasElement.transferControlToOffscreen(), ImageBitmap.close(), console.info()}
        동작:
            #pbfMetadataReady가 false이면 undefined를 반환하고 범위 밖이면 _end로 표시하여 undefined를 반환한다.
            #pbfMetadataReady가 true인 범위 내 타일에서 피처 캐시를 조회하고 이미 있으면 _end로 표시하여 undefined를 반환한다.
            기반 이미지 생성 승인이 false이면 종료하고 URL이 정의되지 않았으면 _end로 표시한 뒤 종료한다.
            워커 모드이면 로딩 수를 올리고 텍스처 캐시를 검사한다.
                디버그면 캐시를 제거한다. 아니면 기존 텍스처를 allocate·반영하고 LOADED를 알린 뒤 로딩 수를 내리고 _end로 끝내며 undefined를 반환한다.
                요청 ID를 key에 등록하고 256 크기 OffscreenCanvas를 만든다.
                실제 최대 레벨보다 깊으면 중심으로 최대 레벨의 요청 좌표·URL을 다시 계산한다.
                취소 토큰을 등록하고 워커에 현재·요청 타일, URL·realUrl, ID·해상도·캔버스·styleFunction 원문을 전달한다. styleFunction이 없으면 toString 접근에서 동기 예외가 나며 아래 비동기 거부 처리에는 도달하지 않는다. [확인 Q-001]
                취소는 한 번만 처리하여 워커 중단을 요청하고 실패로 종결한다.
                종결은 한 번만 수행하며 현재 토큰·요청 ID만 해제하고 로딩 수를 내린 뒤 성공이면 tile로 resolve, 실패이면 tile로 reject한다.
                워커 결과가 취소 뒤 도착하면 비트맵을 닫는다.
                결과가 없거나 타일 메시·drawArg가 사라졌으면 필요 시 비트맵을 닫고 _end로 설정하여 성공 종결한다.
                유효 비트맵이면 UCanvasTexture로 만들어 반영·캐시하고 LOADED 후 _end와 성공 종결을 수행한다.
                워커 거부는 취소 후이면 무시하고 나머지는 로그 후 실패 종결한다. 생성한 promise를 반환한다.
            메인 모드이면 deferredPromise를 만들고 기반 processTexture가 시작을 승인한 때만 promise를 반환한다. 나머지는 undefined를 반환한다.

    override createParentTexture(tile: U3dQuadTile) -> Promise<U3dQuadTile> | boolean | undefined
        의존:
            defined — 타일·피처·부모·메시 존재 판정; 함수: {defined()}
            U3dImageLayer — 부모 fallback·상태·캐시·메시 준비; 함수: {prototype.createParentTexture.call(), intersects(), setStateTile(), restartTile(), getStateTile(), getDataCache(), updateTileTexture(), getCache(), createMeshFromTile()}
            U3dLayer — 표시 여부와 타일 캐시 조회; 속성 읽기: {_visible, _cache}
            UCache — 부모 타일 메시 조회; 함수: {createKeyByTile(), get()}
            U3dQuadTile — 부모 접근; 함수: {getParent()}
            UMercator — 타일 범위·해상도; 함수: {Resolution(), MetersToTile(), TileBounds()}
            UDEF — 키·상태·텍스처 크기; 정적 함수: {createKey(), noResizeTexture()}; 상수: {TILE_STATE._loading, TILE_STATE._end}; 속성 읽기: {imageDebug}
            LRUCache — 피처·텍스처 재사용; 함수: {get(), has(), delete(), put()}
            deferredPromise — 캐시 즉시 완료 결과; 함수: {deferredPromise()}
            UCanvasTexture — 캔버스 텍스처; 생성자: {new UCanvasTexture()}; 함수: {allocate()}
            UVectorRenderer — 조상 피처의 부분 영역 그리기; 함수: {drawFeatureByPBF()}
            Yield — 전달한 조건 callback의 양보; 함수: {Yield()}
            UImageUtils — 디버그 타일 글자; 정적 함수: {drawTextFromCanvas()}
            U3dEvent — 로딩 이벤트; 상수: {IMAGE.LOADED}
            Web API — 캔버스 생성; 함수: {document.createElementNS()}
        동작:
            메타데이터 미준비·타일 부재·타일 해제·_visible이 정확히 false이면 undefined를 반환하고 범위 밖이면 _end로 표시하여 반환한다.
            중심의 실제 최대 레벨 키를 만들고 피처 캐시를 먼저, nullish이면 LRU의 data를 조회한다.
            피처가 없으면 기반 createParentTexture 결과를 그대로 반환한다.
            부모 또는 부모 캐시 메시가 없으면 restartTile 후 종료한다. 상태가 _loading 이상이면 종료한다.
            상태를 _loading으로 바꾸고 현재 mesh 또는 부모 재질 map이 없으면 restartTile 후 종료한다.
            재사용 텍스처가 있으면 디버그에서는 삭제하고 아니면 allocate·반영·LOADED·_end 후 tile로 resolve한 promise를 반환한다.
            원본 타일 폭을 현재 타일 폭으로 나눈 비율을 반올림하여 분할 수를 구한다. 피처 경계의 세 번째 값 extentWidth를 분할 수로 나누어 자식 하나의 피처 내부 폭을 구한다.
            현재 타일의 원본 대비 X·Y 오프셋을 현재 폭으로 나눈 뒤 각각 반올림해 자식 인덱스로 사용한다. Y를 분할 수 - Y 인덱스 - 1로 뒤집고 자식 범위를 256 캔버스에 맞추는 확대·평행이동 행렬을 만든다.
            drawFeatureByPBF에 피처·스타일·해상도와 Yield 후 타일 해제 여부를 반환하는 async 조건 callback을 전달하여 동기 그리기를 요청한다. 실제 renderer는 callback의 Promise를 기다리지 않으므로 이 callback이 그리기를 중단시키지는 않는다. [확인 Q-002]
            캔버스 텍스처에 크기 보존 설정과 선택적 디버그 글자를 적용하고 타일 메시가 없으면 만든 뒤 material.map을 지정한다.
            텍스처를 캐시하고 LOADED·_end를 반영한다. 새로 그린 이 경로는 생성했던 promise를 반환하지 않고 undefined로 종료한다.

    #dispatchEvent_(event: string, object: unknown, tile: U3dQuadTile) -> void
        의존:
            defined — 이벤트 자료 존재 판정; 함수: {defined()}
            UEventDispatcher — 이벤트 발행; 함수: {dispatchEvent()}
            Web API — 잘못된 자료 안내; 함수: {console.info()}
        동작: object와 tile이 모두 정의되어 있으면 data=object인 event를 발행하고 아니면 이벤트 오류 로그를 출력한다.

    async #parsePBF(tile: U3dQuadTile, buffer: ArrayBuffer) -> Promise<HTMLCanvasElement | undefined>
        의존:
            defined — 입력 존재 판정; 함수: {defined()}
            UMercator — 타일 해상도; 함수: {Resolution()}
            UVectorRenderer — PBF 파싱과 그리기; 함수: {parse(), drawFeatureByPBF()}
            LRUCache — 최대 레벨 피처 보관; 함수: {put()}
            Yield — 전달한 조건 callback의 양보; 함수: {Yield()}
            Web API — 캔버스·중복 안내; 함수: {document.createElementNS(), console.info()}
        동작:
            tile 또는 buffer가 없거나 tile.constructor.name이 U3dQuadTile이 아니면 오류를 던진다.
            buffer 길이가 0이면 undefined를 반환한다.
            is3857=false로 PBF를 해석하고 타일 key가 캐시에 없으면 추가하며 이미 있으면 중복 로그를 출력한다.
            타일 레벨이 실제 최대 레벨과 느슨한 비교로 같으면 파싱 결과와 byteLength를 LRU에 보관한다.
            256 캔버스에 transform을 지정하지 않고 피처·스타일·해상도를 전달하여 동기 그리기를 요청한다. async 조건 callback은 Yield 후 해제 타일이면 false를 반환하지만 renderer는 Promise 결과를 기다리지 않는다. [확인 Q-002]
            캔버스를 반환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
