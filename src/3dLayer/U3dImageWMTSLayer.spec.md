# U3dImageWMTSLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dImageWMTSLayer`는 WMTS GetCapabilities 문서를 읽어 OpenLayers WMTS source를 자동 구성하고 그 결과를 Union3D 지형 타일의 이미지 텍스처로 제공한다.

### 1.2 책임 범위

Capabilities 요청·검증·파싱, Layer와 TileMatrixSet 선택, source 옵션 재정의, 표출 레벨·지리 영역·TileMatrixSetLimits 반영 및 비동기 준비 완료를 담당한다. 준비 뒤에는 Dimension(TIME·ELEVATION 등)·Style·Layer를 런타임에 바꾸고 타일을 다시 요청하는 전환 API를 제공한다. 자동 구성 source의 타일 로드 실패를 `TILE_ERROR` 이벤트로 발행하고 연속 실패를 `SERVICE_ERROR`로 집계한다.

책임 경계: OpenLayers renderer 풀, 공유 source의 참조 수와 해제, 렌더 완료·취소 및 타일 캐시는 `U3dOpenLayer`가 담당한다. `xmlUrl`과 `capabilities` 없이 `layers[].callback`을 사용하는 수동 구성도 부모의 등록·렌더 경로로 처리한다. 자동 callback은 호출마다 새 OL layer를 반환하고 부모가 전달한 sharedSources의 source를 재사용한다.

### 1.3 주요 동작 방식

`xmlUrl`과 `layer`를 지정하면 초기화 시 Capabilities를 요청한다. 대신 `capabilities` 옵션에 이미 파싱된 문서(또는 그것을 resolve하는 Promise)를 주면 요청 없이 그 문서를 사용하며, 정적 `fetchCapabilities()`로 한 번 받은 문서를 같은 서비스의 여러 레이어가 공유할 수 있다. 명시한 TileMatrixSet이 있으면 해당 격자를 선택하고, 없으면 OpenLayers가 레이어 CRS와 호환되는 링크를 우선하며 일치하는 링크가 없으면 첫 링크를 선택한다. 선택 결과에서 source 옵션, 레벨 범위와 WGS84 영역을 만들고 타일별 OL layer callback을 등록한 뒤 `ready()`를 완료한다.

유효 레벨과 연결되는 TileMatrixSetLimits가 있으면 해당 Matrix만 레벨 계산에 사용한다. 행·열 제한은 격자 정의와 연결되는 제한 목록이 있을 때 적용한다. 생성한 WMTS source는 등록 슬롯에서 공유하며 타일마다 새 OL Tile layer만 만든다.

생성 옵션과 Capabilities 메타데이터가 겹치는 속성(`minLevel`, `maxLevel`, 데이터 범위)은 "명시한 값은 사용자 책임, 생략한 값은 Capabilities가 채운다"는 한 가지 정책을 따른다. 사용자가 `geoExtent`·`extent`·`rectangle` 중 하나를 지정하면 그 값이 기반 `U3dLayer`의 `_rectangle`이 되어 타일 교차 판정에 그대로 쓰이고 Capabilities의 `WGS84BoundingBox`를 레이어 영역에 적용하지 않는다. 두 범위를 교차하지도 않는다. `minLevel`·`maxLevel`도 지정한 값은 유지하고 생략한 값만 TileMatrixSet에서 산출하며, 결합 결과가 역전되면 사용자 값을 고치지 않고 RangeError로 알린다.

### 1.4 주요 사용처와 연계 대상

`U3dApp`의 WMTS 이미지 레이어 생성 경로와 `tutorial-official/examples/WMTSImageLayer` 예제가 사용한다. 내장 OpenLayers 4.6.5의 `WMTSCapabilities`, `source.WMTS`와 `layer.Tile`에 연결된다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
Capabilities 자동 구성은 호출자가 명시한 Layer와 TileMatrixSet을 우선하며 존재하지 않거나 연결되지 않은 식별자를 다른 항목으로 대체해서는 안 된다.
선택한 격자와 식별자가 일치하는 TileMatrixSetLimits가 하나 이상 있으면 그 제한 목록을 적용하여 허용된 Matrix와 각 Matrix의 최소·최대 행·열 밖에서 타일 URL을 만들지 않는다.
사용자가 minLevel 또는 maxLevel을 지정하지 않은 경우 선택한 TileMatrixSet의 유효 레벨 범위를 레이어 속성에 반영해야 한다.
사용자가 명시한 minLevel, maxLevel과 지리 영역(geoExtent·extent·rectangle)은 Capabilities 메타데이터로 덮어쓰거나 교차·축소하지 않아야 하며, 생략한 속성만 Capabilities 값으로 채워야 한다.
사용자 지정값과 Capabilities 산출값을 결합한 level 범위가 역전되면 사용자 값을 임의로 조정하지 않고 오류로 알려야 한다.
런타임 전환(setDimension·setDimensions·setStyle·setLayer)은 Capabilities 준비가 끝난 뒤에만 허용하고, 앱에 등록된 경우 refresh로 기존 타일 작업을 취소·정리한 뒤 새 옵션으로 다시 요청한다.
setLayer의 구성 도중 예외가 발생하면 level 범위와 데이터 범위를 복구하고 원래 예외를 전달한다. 조회용 참조 저장 이후의 예외까지 모든 상태를 복구하는 트랜잭션은 아니다.
자동 구성 source의 타일 로드 실패는 매 건 TILE_ERROR로 발행하고, tileErrorThreshold회 연속 실패 시 SERVICE_ERROR와 경고를 한 번만 발생시키며 성공 로드가 있으면 집계를 초기화해야 한다.
타일 오류 관측은 자동 구성 source에만 적용하고 수동 layers[].callback이 만든 source는 관측하지 않는다.
Capabilities 준비 전에는 타일 상태를 변경하거나 WMTS 타일 요청을 시작하지 않아야 한다.
`capabilities` 옵션으로 전달된 문서는 xmlUrl 요청 결과와 같은 구조 검증을 거쳐야 하며, 문서는 복사하지 않고 옵션 변환기에 전달하며 내장 OpenLayers의 격자 정렬이 원본 TileMatrix 배열에 반영될 수 있다.
```

## 3. 정규 자연어 수도코드

```spec
OLWMTSCapabilities 부분 타입 명세
    이 명세에서 사용하는 필드:
        version: string
            문서 버전
        Contents: {Layer: Array<OLWMTSLayer>, TileMatrixSet: Array<OLWMTSTileMatrixSet>}
            서비스 레이어와 격자 정의

OLWMTSLayer 부분 타입 명세
    이 명세에서 사용하는 필드:
        Identifier: string
            선택에 사용하는 레이어 식별자
        Style: Array<OLWMTSStyle>
            런타임 스타일 검증에 사용하는 목록
        TileMatrixSetLink: Array<OLWMTSTileMatrixSetLink>
            레이어가 제공하는 격자와 제한 목록
        WGS84BoundingBox?: Array<number>
            위경도 좌표계(EPSG:4326)의 [minLon, minLat, maxLon, maxLat] 범위

OLWMTSStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        Identifier: string
            요청에 저장할 스타일 식별자
        Title?: string
            setStyle에서 식별자와 함께 검색하는 표시 이름

OLWMTSTileMatrixSet 부분 타입 명세
    이 명세에서 사용하는 필드:
        Identifier: string
            격자 식별자
        SupportedCRS: string
            좌표계 경고와 OL 격자 선택에 쓰는 식별자
        TileMatrix: Array<OLWMTSTileMatrix>
            축척별 격자 목록이며 내장 OL 변환기가 제자리 정렬할 수 있다.

OLWMTSTileMatrix 부분 타입 명세
    이 명세에서 사용하는 필드:
        Identifier: string
            레벨 및 행·열 제한을 연결할 Matrix 식별자
        ScaleDenominator: number
            자동 레벨 환산에 사용하는 축척 분모

OLWMTSTileMatrixSetLink 부분 타입 명세
    이 명세에서 사용하는 필드:
        TileMatrixSet: string
            연결할 격자 식별자
        TileMatrixSetLimits?: Array<OLWMTSTileMatrixLimit>
            연결된 Matrix의 행·열 제한

OLWMTSTileMatrixLimit 부분 타입 명세
    이 명세에서 사용하는 필드:
        TileMatrix: string
            제한을 적용할 Matrix 식별자
        MinTileRow, MaxTileRow, MinTileCol, MaxTileCol: number
            포함되는 최소·최대 행과 열

OLWMTSSourceOptions 부분 타입 명세
    이 명세에서 사용하는 필드:
        matrixSet: string
            선택된 격자 식별자
        style: string
            요청 스타일
        dimensions: Record<string, string | number>
            요청 차원 값
        urls: Array<string>
            요청 주소 목록
        requestEncoding: 'KVP' | 'REST'
            요청 인코딩

U3dImageWMTSTileUrlFunction 함수 타입 정의
    (tileCoord: Array<number> | null, pixelRatio: number, projection: unknown) -> string | undefined
    인터페이스: 타일 좌표·픽셀 비율·좌표계로 URL을 만들며 범위 밖이면 undefined를 반환한다. 기존 함수는 source를 this로 호출한다.

U3dImageWMTSLayerLimitedSource extends OLTileSource 부분 타입 명세
    이 명세에서 사용하는 필드:
        getTileGrid: () -> {getMatrixId: (z: number) -> string}
            좌표의 Z 인덱스를 Matrix 식별자로 바꿀 격자
        getTileUrlFunction: () -> U3dImageWMTSTileUrlFunction
            기존 URL 생성 함수
        setTileUrlFunction: (fn: U3dImageWMTSTileUrlFunction) -> void
            URL 생성 함수 교체

U3dImageWMTSLayerEMD: U3dImageWMTSLayerEMI
    의존: U3dOpenLayer — 기반 이벤트 복사; 속성 읽기: {EVENT}
    기반 이벤트 값을 얕게 복사한 뒤 WMTS 이벤트를 더하며 정적 EVENT와 같은 객체다.

U3dImageWMTSLayerEMD.TILE_ERROR: string = 'wmts-tile-error'
    개별 타일 실패 이벤트 이름이며 객체 필드 값을 바꾸면 이후 발행 이름도 바뀐다.

U3dImageWMTSLayerEMD.SERVICE_ERROR: string = 'wmts-service-error'
    연속 실패 임계값 도달 이벤트 이름이며 객체 필드 값을 바꾸면 이후 발행 이름도 바뀐다.

U3dImageWMTSLayerServiceOptions 부분 타입 명세
    이 명세에서 사용하는 필드:
        layer: string
            WMTS Layer Identifier
        matrixSet?: string
            우선 선택할 TileMatrixSet Identifier
        style?: string
            요청할 Style Identifier
        format?: string
            타일 이미지 MIME 형식
        requestEncoding?: 'KVP' | 'REST'
            요청 인코딩
        urls?: Array<string>
            Capabilities의 요청 URL을 대체할 URL 목록
        crossOrigin: string | null
            타일 이미지의 crossOrigin이며 null이면 OL 옵션 변환기의 config에 전달하지 않는다.
        dimensions?: Record<string, string | number>
            Capabilities의 Dimension 기본값을 덮어쓸 값
        fetchTimeout: number
            Capabilities 응답 제한 시간(ms)

U3dImageWMTSLayerEMI extends U3dLayerEMI 부분 타입 명세
    이 명세에서 사용하는 필드:
        TILE_ERROR: string = 'wmts-tile-error'
            자동 구성 source의 타일 이미지 요청이 실패할 때마다 발행하며 data는 U3dImageWMTSLayerTileError다.
        SERVICE_ERROR: string = 'wmts-service-error'
            타일 요청이 tileErrorThreshold회 연속 실패했을 때 한 번 발행하며 data는 {consecutiveErrors, totalErrors, lastTile}이다.

U3dImageWMTSLayerTileError 부분 타입 명세
    이 명세에서 사용하는 필드:
        layer?: string
            WMTS Layer Identifier
        style?: string
            요청 Style
        matrixSet?: string
            TileMatrixSet Identifier
        matrix?: string
            실패한 TileMatrix Identifier
        row?: number
            WMTS TileRow(OL 내부 Y의 -Y-1)
        col?: number
            WMTS TileCol
        url?: string
            요청 URL이며 확인할 수 없으면 undefined
        tile: any
            실패한 OL ImageTile 원본

U3dImageWMTSLayerCO extends U3dOpenLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        xmlUrl?: string
            WMTS GetCapabilities URL이며 지정하면 layer가 필수다.
        capabilities?: OLWMTSCapabilities | Promise<OLWMTSCapabilities>
            이미 파싱된 Capabilities 객체 또는 그것을 resolve하는 Promise이며 지정하면 xmlUrl 요청을 생략한다. layer가 필수다.
        layer?: string
            Capabilities Contents.Layer의 Identifier
        matrixSet?: string
            사용할 TileMatrixSet Identifier이며 생략하면 OpenLayers가 crs와 호환되는 링크를 우선 선택하고 없으면 첫 링크를 사용한다.
        style?: string
            Style Identifier이며 생략하면 Capabilities 기본 스타일을 사용한다.
        format?: string
            타일 이미지 MIME 형식이며 생략하면 Capabilities 첫 형식을 사용한다.
        requestEncoding?: 'KVP' | 'REST'
            요청 인코딩이며 생략하면 Capabilities에서 선택한다.
        urls?: Array<string>
            Capabilities의 요청 URL을 대체한다.
        crossOrigin?: string | null = 'anonymous'
            null이면 OL 옵션 변환기의 config에 전달하지 않는다.
        dimensions?: Record<string, string | number>
            Capabilities Dimension 기본값에 병합하며 같은 키는 입력값이 우선한다.
        fetchTimeout?: number = 15000
            유한한 양수만 사용하며 나머지는 기본값으로 바꾼다.
        tileErrorThreshold?: number = 8
            연속 타일 오류를 SERVICE_ERROR로 보고하는 임계값이며 0이면 보고하지 않는다. 0 이상 정수가 아니면 기본값을 쓴다.
        geoExtent?: Array<number>
            데이터 위경도 범위 [minLon, minLat, maxLon, maxLat]이며 지정하면 Capabilities 영역을 적용하지 않는다.
        layerName?: string
            deprecated 옵션이며 런타임에서 읽지 않는다.
        needXml?: boolean
            deprecated 옵션이며 런타임에서 읽지 않는다.

U3dImageWMTSLayer extends U3dOpenLayer 클래스 정의
    의존: U3dOpenLayer — OL 렌더링과 이미지 레이어 상태; 상속: {U3dOpenLayer}; 속성 읽기: {OPT_KEYS}

    static EVENT: U3dImageWMTSLayerEMI = U3dImageWMTSLayerEMD
        부모 이벤트에 TILE_ERROR, SERVICE_ERROR를 더한 이벤트 이름 모음이며 모듈에서 U3dImageWMTSLayerEMD로도 export한다.

    static OPT_KEYS: Array<string>
        부모 옵션과 xmlUrl, capabilities, layer, matrixSet, style, format, requestEncoding, urls, crossOrigin, dimensions, fetchTimeout, tileErrorThreshold를 옵션 정규화 대상으로 선언한다.

    _needXml: boolean = false
        xmlUrl 또는 capabilities 지정 시 true로 바뀌어 부모의 자동 ready 완료를 보류한다.
    _xmlUrl?: string
        문자열로 정규화한 Capabilities 요청 URL이며 capabilities 옵션만 준 경우 undefined다.
    #capabilitiesInput?: OLWMTSCapabilities | Promise<OLWMTSCapabilities>
        capabilities 옵션으로 받은 파싱 문서 또는 Promise
    #tileErrorThreshold: number = 8
        연속 타일 오류 보고 임계값
    #tileErrorCount: number = 0
        마지막 refresh 이후 자동 구성 source의 타일 오류 누계
    #tileErrorStreak: number = 0
        마지막 성공 로드 이후 연속 타일 오류 수
    #serviceErrorReported: boolean = false
        현재 연속 구간에서 SERVICE_ERROR를 이미 보고했는지 여부
    #service?: U3dImageWMTSLayerServiceOptions
        Capabilities 자동 구성에 사용할 입력 사본이며 #applyCapabilities에서 범위 반영 뒤 callback 교체 전에 새 참조를 저장한다.
    #userSpecified: {geoExtent: boolean, minLevel: boolean, maxLevel: boolean}
        사용자가 직접 지정하여 메타데이터로 덮어쓰지 않을 속성을 표시한다.
    #ready: boolean = true
        false이면 타일 텍스처 생성을 보류한다.
    #loading: boolean = false
        같은 인스턴스의 Capabilities 중복 요청을 막는다.
    #abortController?: AbortController
        진행 중인 Capabilities 요청의 취소 제어기
    #capabilities?: OLWMTSCapabilities
        OpenLayers가 파싱한 Capabilities 문서
    #layerMetadata?: OLWMTSLayer
        선택한 Contents.Layer 항목
    #sourceOptions?: OLWMTSSourceOptions
        `ol.source.WMTS` 생성에 사용하는 최종 옵션

    constructor(opt: U3dImageWMTSLayerCO = {})
        처리 기준:
            geoExtent는 길이 4의 유한수 배열이고 각 축의 최솟값이 최댓값 이하여야 하며 위반하면 RangeError를 던진다.
            xmlUrl을 지정하면 공백이 아닌 문자열이어야 하고, capabilities를 지정하면 null이 아닌 객체(Promise 포함)여야 하며, 둘 중 하나라도 지정했으면 layer가 공백이 아닌 문자열이어야 한다. 어느 하나라도 위반하면 TypeError를 던진다.
        의존:
            normalizeOptionKeys — 생성 옵션 키 정규화; 함수: {normalizeOptionKeys()}
            U3dOpenLayer — 부모 상태 생성; 생성자: {super()}
        동작:
            옵션 키를 정규화한 뒤 geoExtent·xmlUrl·capabilities·layer를 검증하고 부모를 생성한다.
            클래스 종류를 U3dImageWMTSLayer로 설정한다.
            geoExtent·extent·rectangle과 minLevel·maxLevel의 사용자 지정 여부를 각각 저장한다.
            xmlUrl과 capabilities가 모두 없으면 Capabilities 상태를 만들지 않고 부모의 수동 callback 구성을 유지한다.
            둘 중 하나가 있으면 URL을 문자열로(없으면 undefined) 저장하고 capabilities 입력을 보관하며 ready를 보류하고 서비스 선택·요청 옵션을 복사한다.
            urls가 배열일 때 각 값을 문자열로 바꾸고 배열이 아니면 undefined로 둔다. dimensions가 truthy이면 얕게 복사하며 crossOrigin이 undefined일 때만 anonymous를 사용한다.
            fetchTimeout을 숫자로 바꾸고 유한한 양수가 아니면 15000을 사용한다.
            tileErrorThreshold를 숫자로 바꾸고 0 이상 정수가 아니면 8을 사용한다.

    override initialize() -> boolean
        의존:
            U3dOpenLayer — 부모 초기화; 함수: {initialize()}
            U3dLayer — 초기화 결과 상태; 속성 읽기: {_initialized}
        동작:
            부모를 초기화한다.
            _needXml이 true이고 아직 준비 완료나 로딩 중이 아니면 Capabilities 로드를 시작한다. 실패 후 같은 조건에서 initialize를 다시 호출하면 재시작할 수 있다.
            부모의 초기화 여부를 반환한다.

    override createTexture(tile: U3dQuadTile, opt: Partial<{noParentTexture: boolean}> = {}) -> Promise<U3dQuadTile> | undefined
        처리 기준: Capabilities 준비 전에는 타일 상태를 변경하지 않는다.
        의존: U3dOpenLayer — 타일 상태 판정과 OL 렌더링; 함수: {createTexture()}
        동작:
            준비되지 않았으면 undefined를 반환한다.
            준비됐으면 noParentTexture를 true로 덮어 부모의 텍스처 생성 결과를 반환한다.

    override dispose() -> void
        의존:
            Web API — 진행 중 요청 취소; 함수: {AbortController.abort()}
            U3dOpenLayer — 부모 자원 해제; 함수: {dispose()}
        동작:
            Capabilities 요청 제어기가 있으면 취소하고 참조를 제거한다.
            부모의 OL renderer와 source 자원을 해제한다.

    override refresh() -> void
        의존: U3dOpenLayer — 공유 source 폐기 전환과 타일 재생성; 함수: {refresh()}
        동작: 타일 오류 통계를 초기화한 뒤 부모 refresh를 수행한다.

    getTileErrorStats() -> {total: number, consecutive: number, serviceErrorReported: boolean}
        동작: 마지막 refresh 이후 누계, 마지막 성공 이후 연속 오류 수, 현재 구간의 서비스 장애 보고 여부를 반환한다.

    getCapabilities() -> OLWMTSCapabilities | undefined
        동작: 파싱된 Capabilities 객체 참조를 반환하며 구성 참조가 저장되기 전과 수동 구성에서는 undefined를 반환한다.

    getLayerMetadata() -> OLWMTSLayer | undefined
        동작: 선택한 Contents.Layer 항목 참조를 반환하며 구성 참조가 저장되기 전에는 undefined를 반환한다.

    getSourceOptions() -> OLWMTSSourceOptions | undefined
        동작: 최종 WMTS source 옵션 참조를 반환하며 구성 참조가 저장되기 전에는 undefined를 반환한다.

    isCapabilitiesReady() -> boolean
        동작: 자동 구성의 준비 상태인 #ready를 반환하며 수동 구성에서는 true다. 해제 여부 등 부모의 타일 생성 조건을 대신 판정하지 않는다.

    getLayer() -> string | undefined
        동작: 현재 서비스 옵션의 Layer Identifier를 반환하며 수동 구성에서는 undefined를 반환한다.

    getStyle() -> string | undefined
        동작: 현재 source 옵션의 Style 값을 반환하며 source 옵션 참조가 저장되기 전에는 undefined를 반환한다.

    getDimensions() -> Record<string, string | number>
        동작: 현재 source 옵션의 Dimension 값을 얕게 복사해 반환하며 source 옵션 또는 dimensions가 없으면 빈 객체를 반환한다.

    setDimension(name: string, value: string | number | null) -> void
        동작: 한 항목만 담은 객체로 setDimensions를 호출한다.

    setDimensions(dimensions: Record<string, string | number | null>) -> void
        처리 기준:
            Capabilities 준비가 끝나지 않았거나 수동 구성이면 Error를 던진다.
            dimensions가 null이거나 객체가 아니면 TypeError를 던진다.
        동작:
            준비 상태와 자동 구성 참조를 확인하고 현재 서비스 옵션을 얻는다.
            현재 source 옵션의 dimensions에 입력을 병합하며 값이 null 또는 undefined인 키는 제거한다.
            병합 결과를 source 옵션에 저장하고 서비스 옵션에는 별도의 얕은 복사본을 저장한 뒤 타일을 다시 요청한다.

    setStyle(style: string) -> void
        처리 기준:
            Capabilities 준비가 끝나지 않았거나 수동 구성이면 Error를 던진다.
            style이 공백이 아닌 문자열이 아니면 TypeError를 던진다.
            현재 Layer 메타데이터의 Style 목록에서 Identifier 또는 Title이 일치하는 항목이 없으면 제공 스타일 목록을 포함한 Error를 던진다.
        동작:
            준비 상태와 자동 구성 참조를 확인하고 현재 서비스 옵션을 얻는다.
            일치한 Style의 Identifier가 현재 값과 같아도 source 옵션과 서비스 옵션의 style을 Identifier로 갱신한다.
            앱에 추가된 레이어는 공유 source와 전체 타일 상태를 갱신하여 타일을 다시 요청하고, 추가 전이면 첫 렌더에서 반영한다.

    setLayer(layer: string, overrides: Partial<Pick<U3dImageWMTSLayerServiceOptions, 'matrixSet' | 'style' | 'format' | 'requestEncoding' | 'urls' | 'dimensions'>> = {}) -> void
        처리 기준:
            Capabilities 준비가 끝나지 않았거나 수동 구성이면 Error를 던진다.
            layer가 공백이 아닌 문자열이 아니면 TypeError를 던진다.
            구성 도중 예외가 나면 level 범위와 데이터 범위만 호출 전 값으로 되돌리고 같은 예외를 다시 던진다. 조회용 참조·서비스 옵션과 callback은 복구하지 않는다. [확인 Q-001]
        의존: U3dLayer — 표출 범위 되돌리기; 속성 읽기·쓰기: {_minlevel, _maxlevel, _rectangle, _rectangle3d}
        동작:
            준비 상태와 자동 구성 참조를 확인하고 현재 서비스 옵션을 얻는다.
            현재 서비스 옵션을 복사해 layer를 바꾸고 overrides에 정의된 항목만 덮어쓴 새 서비스 옵션을 만든다.
            현재 level 범위와 데이터 범위를 보관한다.
            보관한 Capabilities 문서와 새 서비스 옵션으로 source 옵션·범위·자동 callback을 다시 구성한다.
            성공하면 타일을 다시 요청한다.

    #observeTileErrors(source: OLTileSource) -> void
        의존: OpenLayers tile source — 타일 로드 이벤트; 함수: {on()}
        동작: 새 source의 tileloaderror를 #onTileLoadError에, tileloadend를 #onTileLoadEnd에 연결한다. 리스너는 source 수명에 묶여 부모가 source를 dispose하면 함께 해제된다.

    #onTileLoadError(source: OLTileSource, tile: any) -> void
        처리 기준:
            레이어가 해제됐으면 무시한다.
            임계값이 0이거나 이미 보고했거나 연속 수가 임계값 미만이면 SERVICE_ERROR를 발행하지 않는다.
        의존:
            U3dLayer — 해제 상태; 속성 읽기: {_disposed}
            U3dObject — 레이어 이름; 함수: {getName()}
            UEventDispatcher — 이벤트 발행; 함수: {dispatchEvent()}
            __GWarn__ — 연속 실패 경고; 함수: {__GWarn__()}
        동작:
            _disposed가 false이면 다음 오류 관측을 진행한다.
                누계와 연속 오류 수를 1씩 늘리고 타일 정보를 만들어 TILE_ERROR를 발행한다.
                TILE_ERROR 발행이 돌아온 뒤의 상태에서 임계값이 양수이고 미보고이며 연속 오류 수가 임계값 이상이면 보고 플래그를 세운다. 이벤트 처리 중 refresh나 성공 로드가 집계를 초기화했다면 초기화된 값으로 판정한다.
                보고 조건을 통과하면 마지막 URL을 포함한 경고를 기록한 뒤 현재 누계·연속 수와 앞서 만든 타일 정보로 SERVICE_ERROR를 발행한다.

    #onTileLoadEnd() -> void
        동작: 연속 오류 수와 서비스 장애 보고 플래그를 초기화하여 다음 연속 실패를 다시 보고할 수 있게 한다.

    #resetTileErrorStats() -> void
        동작: 누계·연속 오류 수·보고 플래그를 모두 초기화한다.

    #describeTile(source: OLTileSource, tile: any) -> U3dImageWMTSLayerTileError
        의존: OpenLayers ImageTile·tile grid — 타일 좌표·URL·Matrix 조회; 함수: {getTileCoord(), getImage(), getKey(), getTileGrid(), getMatrixId()}
        동작:
            타일 좌표의 Z를 tile grid의 Matrix Identifier로 바꾸고 OL 내부 Y를 -Y-1로 변환해 WMTS TileRow를 만든다.
            getKey 함수가 있으면 그 반환값만 사용하고, 함수가 없을 때만 이미지 src를 사용한다. 선택한 결과가 문자열이 아니면 undefined로 둔다.
            현재 서비스 옵션의 layer, source 옵션의 style·matrixSet과 함께 원본 타일 참조를 포함해 반환한다.

    #requireCapabilitiesConfigured(method: string) -> U3dImageWMTSLayerServiceOptions
        처리 기준: #ready가 false이거나 서비스 옵션·source 옵션·Capabilities·Layer 메타데이터 중 하나라도 없으면 호출 메서드 이름을 포함한 Error를 던진다.
        동작: 현재 서비스 옵션을 반환한다.

    #reloadTiles() -> void
        의존: U3dLayer — 앱 등록 상태 확인; 속성 읽기: {_drawArg}
        동작:
            drawArg가 있으면 refresh하여 오류 통계와 부모 타일 상태를 초기화한다. 이후 자동 callback은 갱신된 source 옵션으로 새 source를 만든다.
            drawArg가 없으면(앱에 추가되기 전) 옵션만 갱신된 상태로 두어 첫 렌더에서 반영되게 한다.

    static async fetchCapabilities(url: string, opt: Partial<{fetchTimeout: number, signal: AbortSignal}> = {}) -> Promise<OLWMTSCapabilities>
        처리 기준:
            url이 공백이 아닌 문자열이 아니면 TypeError를 던진다.
            fetchTimeout이 유한한 양수 number가 아니면 15000을 사용하며 생성자와 달리 문자열을 숫자로 변환하지 않는다.
            타이머 만료로 취소된 경우 제한 시간을 포함한 Error로, 외부 signal 취소나 그 외 실패는 원래 오류로 reject한다.
            성공·실패 모두 타이머와 외부 signal 리스너를 정리한다.
        의존:
            Web API — HTTP 요청·응답, 제한 시간과 외부 취소 연동; 생성자: {AbortController}; 함수: {fetch(), setTimeout(), clearTimeout(), AbortController.abort(), AbortSignal.addEventListener(), AbortSignal.removeEventListener(), Response.text()}
        동작:
            내부 AbortController를 만들고 제한 시간 타이머를 등록하며 외부 signal이 있으면 그 취소를 내부 취소로 전달한다.
            URL을 요청하고 성공 상태일 때만 본문 수신을 기다린다.
            요청·본문 수신 실패를 잡았을 때 타이머가 만료됐으면 제한 시간 오류로 바꾸고 아니면 원래 오류를 전달한다.
            finally에서 타이머와 외부 취소 리스너를 정리한 뒤 본문이 undefined이면 HTTP 상태 코드 오류를 던진다.
            응답 본문을 검증·파싱한 Capabilities 객체를 반환한다.

    async #loadCapabilities() -> Promise<void>
        처리 기준: 요청 try 블록을 벗어날 때 제어기가 현재 요청과 같으면 참조를 비우며 #loading을 false로 되돌린다.
        의존:
            Web API — 취소 제어기 생성과 요청 취소 여부 확인; 생성자: {AbortController}; 속성 읽기: {AbortSignal.aborted}
            U3dLayer — 해제·그리기 상태와 부모 생성자에서 주입한 준비 완료 함수; 함수: {resolve(), reject()}; 속성 읽기: {_disposed, _drawArg}
            U3dObject — 실패 로그의 레이어 이름; 함수: {getName()}
            __GError__ — 구성 정보 누락과 Capabilities 실패 기록; 함수: {__GError__()}
        동작:
            서비스 옵션이 없거나 URL과 capabilities 입력이 모두 없으면 구성 정보 누락 오류를 기록하고 `ready()`를 그 오류로 reject한 뒤 종료한다. 이 경로에서는 조용히 끝내지 않아 `ready()`가 미완료로 남지 않는다.
            로딩 상태와 새 AbortController를 저장한다.
            capabilities 입력이 있으면 그 값(Promise면 결과)을 문서로 사용하고, 없으면 fetchTimeout과 취소 신호를 전달해 URL을 요청한다.
            문서를 얻은 뒤 레이어가 해제됐거나 요청이 취소됐으면 메타데이터를 적용하지 않고 종료한다.
            capabilities 입력으로 받은 문서는 xmlUrl 결과와 같은 구조 검증을 거친다.
            문서로 source와 레이어 속성을 구성한다.
            구성에 성공하면 #ready를 true로 바꾸고 ready를 자신으로 완료한다.
            drawArg가 있으면 오류 통계와 타일 상태를 초기화한다.
            실패 시 레이어가 해제됐으면 종료하고, 그 외에는 출처(URL 또는 capabilities 옵션)와 오류 메시지를 로그에 기록한 뒤 `ready()`를 원래 오류로 reject한다.
            finally에서 현재 요청과 일치하는 제어기 참조를 비우고 #loading을 false로 바꾼다.

    #applyCapabilities(capabilities: OLWMTSCapabilities, service: U3dImageWMTSLayerServiceOptions) -> void
        처리 기준:
            요청한 Layer가 없으면 Error를 던진다.
            명시한 matrixSet이 Layer에 연결되지 않았거나 Contents에 정의되지 않았으면 Error를 던진다.
            선택 결과로 OL source 옵션을 만들 수 없으면 Error를 던진다.
        의존:
            ol — WMTS 옵션·source·layer 생성; 정적 함수: {source.WMTS.optionsFromCapabilities()}; 생성자: {source.WMTS, layer.Tile}
            U3dOpenLayer — OL callback 등록; 함수: {removeLayer(), addLayer()}
            U3dLayer — 자동 격자 선택과 경고의 좌표계; 속성 읽기: {_crs}
            U3dObject — 경고의 레이어 이름; 함수: {getName()}
            __GWarn__ — 비 Mercator 격자 경고; 함수: {__GWarn__()}
        동작:
            요청한 Identifier와 일치하는 Contents.Layer를 선택한다.
            matrixSet을 명시했으면 해당 링크가 있는지 확인한다.
            명시한 격자가 유효하면 해당 식별자를 OL 구성에 전달하고 projection을 전달하지 않아 내장 OL이 격자 선택을 바꾸지 못하게 한다.
            matrixSet을 생략했으면 현재 레이어 CRS를 projection으로 전달하여 OpenLayers가 호환되는 링크를 우선 선택하고 일치하는 링크가 없으면 첫 링크를 사용하게 한다.
            requestEncoding·format·style은 각각 truthy일 때만, crossOrigin은 null이 아닐 때만 OL 옵션 변환기에 전달한다.
            원본 문서의 링크 제한도 OL 격자 생성기에 전달되며, 이후 URL 제한 계산에서 무시한 목록이라도 이미 생성한 OL 격자를 다시 만들지는 않는다. [확인 Q-002]
            변환 결과에 truthy인 urls·requestEncoding·style을 덮어쓰고 dimensions가 truthy이면 기본값과 병합한다.
            옵션 변환기에 원본 문서를 전달하므로 내장 OL의 TileMatrix 정렬은 공유 문서에도 반영된다.
            격자가 있고 SupportedCRS가 3857·900913·3785·102100·102113 중 어느 문자열도 포함하지 않으면 성능·화질 경고를 기록한다.
            선택 격자의 레벨 범위를 먼저 반영한다.
            Layer 영역을 반영하고 성공하면 파싱 문서·Layer·최종 source 옵션·서비스 옵션을 저장한다. 이 저장은 제한 계산과 callback 제거·등록보다 먼저 일어난다.
            이전에 등록한 자동 callback(고정 내부 이름)을 제거한 뒤 OL layer 생성 callback을 같은 이름으로 부모에 등록한다. 제거는 setLayer 재구성 시 이전 Layer의 공유 source를 폐기 대상으로 전환한다.
            자동 callback은 source를 만들 때 현재 저장된 source 옵션을 읽으므로, 이후 setDimensions·setStyle이 옵션을 바꾸면 새 source에 반영된다.
            callback은 전달받은 sharedSources의 첫 항목이 truthy이면 재사용하며 없을 때만 저장된 옵션으로 새 WMTS source를 만든다.
            callback은 새 source를 만든 경우에만 타일 오류 관측을 구독한다.
            callback은 선택한 source를 연결한 새 OL Tile layer를 매번 반환한다.

    #applyLevelRange(matrixSet: OLWMTSTileMatrixSet | undefined, layerMetadata: OLWMTSLayer, matrixSetId: string) -> void
        처리 기준:
            TileMatrix가 없거나 Web Mercator 표준 level로 환산할 수 있는 Matrix가 없으면 기존 레벨 속성을 유지한다.
            사용자 지정 하한과 상한 또는 자동 서비스 범위를 결합한 결과가 역전되면 RangeError를 던지고 사용자 값을 임의로 바꾸지 않는다.
        의존: U3dLayer — 레이어 표출 범위; 속성 읽기·쓰기: {_minlevel, _maxlevel}
        동작:
            사용자가 지정한 minLevel 또는 maxLevel은 각각 유지하고 생략한 값은 서비스 범위로 설정한다.
            최종 하한이 상한보다 큰지 검사하고 그 오류 조건을 통과하면 _minlevel과 _maxlevel에 반영한다.

    #applyGeoExtent(layerMetadata: OLWMTSLayer) -> void
        처리 기준: 사용자가 geoExtent·extent·rectangle 중 하나를 지정했으면 Capabilities 영역으로 덮어쓰지 않는다. 이때 사용자 범위는 기반 `U3dLayer` 생성자가 이미 `_rectangle`에 반영했으므로 이 함수는 아무것도 하지 않고 종료한다.
        의존: U3dLayer — 지리 좌표 변환과 표출 영역; 함수: {convertGeographicToGoogleRectangle()}; 속성 쓰기: {_rectangle, _rectangle3d}
        동작:
            this.#userSpecified.geoExtent가 false이면 다음 자동 영역 적용을 진행한다.
                이전 Layer(setLayer 전환)의 범위가 남지 않도록 _rectangle과 _rectangle3d를 먼저 비운다.
                범위를 월드 좌표(EPSG:3857) rectangle로 변환하며 변환 결과가 없으면 종료한다.
                변환 결과를 _rectangle과 _rectangle3d에 같은 참조로 저장한다.

parseCapabilities(text: string) -> OLWMTSCapabilities
    처리 기준:
        루트 요소가 Capabilities가 아니거나 version 속성이 없으면 응답 요약을 포함한 Error를 던진다.
    의존:
        Web API — XML 루트 검증; 생성자: {DOMParser}; 함수: {DOMParser.parseFromString()}
        ol — Capabilities 해석; 생성자: {format.WMTSCapabilities}; 함수: {format.WMTSCapabilities.read()}
    동작:
        입력을 XML로 파싱하여 루트 이름과 version을 검사한다.
        문서가 아니면 태그 제거·공백 정규화 후 앞 200자인 응답 요약으로 인증키·프록시·도메인 확인 오류를 만든다.
        유효한 XML을 OpenLayers WMTSCapabilities로 파싱하고 구조를 검증한 뒤 결과를 반환한다.

validateCapabilities(capabilities: any) -> void
    처리 기준: 객체가 아니거나 Contents.Layer가 배열이 아니면 Error를 던진다.
    동작: xmlUrl 응답과 capabilities 옵션 입력에 같은 최소 구조 검사를 적용한다.

```

## 4. 공통 처리 기준과 제약

```spec
Capabilities가 필요한 인스턴스의 준비 완료는 생성이나 initialize 반환 시점이 아니라 문서 파싱, source 옵션 구성과 OL callback 등록이 끝난 시점이다.
자동 구성 callback과 수동 `layers[].callback`은 모두 `U3dOpenLayer`의 callback 계약을 따라야 하며, 계약 위반 시 타일 정리와 로그는 부모 명세(`U3dOpenLayer.spec.md`)의 처리에 따른다.
getCapabilities·getLayerMetadata·getSourceOptions는 저장된 원본 참조를 반환한다. 최초 구성의 참조 저장 전 실패와 setLayer 전환 실패의 상태를 같은 것으로 취급하지 않는다.
TileMatrixSetLimits의 Matrix 목록은 OL tile grid의 Matrix 필터와 레이어 level 범위를 함께 제한하고, 행·열 값은 URL 생성 직전에 추가로 제한한다.
옵션 우선순위: 사용자가 생성 옵션으로 명시한 minLevel, maxLevel, geoExtent(extent·rectangle)는 항상 Capabilities 메타데이터보다 우선하며, 메타데이터는 사용자가 생략한 속성만 채운다. 지리 영역은 교차하지 않으며 level의 상·하한은 지정 여부에 따라 각각 사용자 값 또는 산출값을 택한다.
자동 level 환산은 OGC 표준 화소 크기와 Web Mercator 256px level 0 축척을 기준으로 하므로 다른 축척 체계는 레이어 level 속성에 자동 반영하지 않는다.
비 Mercator TileMatrixSet은 OpenLayers 재투영으로 렌더할 수 있지만 성능과 화질 경고를 남긴다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
