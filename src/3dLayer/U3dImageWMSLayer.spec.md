# U3dImageWMSLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

WMS 서버의 지도를 지형 타일별 이미지로 요청하기 위한 레이어다. 타일 위치와 WMS 옵션을 GetMap URL로 변환하고, 기반 이미지 레이어가 준비한 재질에 블렌딩 방식을 적용한다.

### 1.2 책임 범위

WMS 옵션의 초기화·변경, 요청 범위와 URL 조립, EPSG:3857 텍스처 생성 진입 및 완료 후 블렌딩 설정을 담당한다. 네트워크 요청·취소, 영상 cache, 부모 영상 대체와 자원 수명주기는 U3dImageLayer에 맡긴다.

### 1.3 주요 동작 방식

생성 시 옵션을 저장하고, 타일 중심에서 구한 인덱스로 요청 BBOX를 만든다. 텍스처 생성은 좌표계와 기반 레이어의 생성 허용 여부를 먼저 확인한다. URL이 있으면 기반 처리에 deferred를 전달하고, 완료 callback에서 cache 메시의 첫 재질에 블렌딩 값을 설정한다.

### 1.4 주요 사용처와 연계 대상

U3dApp.createWMSImageLayer()가 레이어를 생성·등록한다. U3dImageLayer의 이미지 처리 흐름, UMathEngine의 타일 인덱스 계산, UMercator의 타일 영역 계산 및 Three.js 재질과 연결된다.

## 3. 정규 자연어 수도코드

```spec
U3dImageWMSLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        baseUrl?: string
            WMS 서버 주소이며 생성자에서는 null·undefined를 거부한다. [확인 Q-004]
        layerName?: string
            LAYERS에 넣을 서비스 레이어 이름이다.
        ext?: string = 'png'
            FORMAT에 그대로 넣을 출력 형식이다.
        reverseX?: boolean = false
            타일 인덱스를 계산할 때 X 반전을 요청한다.
        reverseY?: boolean = false
            타일 인덱스를 계산할 때 Y 반전을 요청한다.
        crs?: string = 'EPSG:3857'
            URL의 좌표계 문자열이며 텍스처 생성은 EPSG:3857만 허용한다.
        version?: string = '1.3.0'
            VERSION과 SRS·CRS 키 선택에 사용한다.
        width?: number = 256
            요청 이미지 너비다.
        height?: number = 256
            요청 이미지 높이다.
        minLevel?: number = 0
            요청을 허용할 최소 타일 레벨이다.
        maxLevel?: number = 19
            요청을 허용할 최대 타일 레벨이다.
        cqlFilter?: string
            CQL_FILTER 문자열이며 생략하면 빈 문자열이다.
        key?: string
            인증 KEY 문자열이며 생략하면 빈 문자열이다.
        styles?: string
            STYLES 문자열이며 생략하면 빈 문자열이다.
        useProxy?: boolean
            요청 앞에 proxyUrl을 붙일지 정하며 생략하면 false다.
        proxyUrl?: string
            프록시 접두어이며 생략하면 './proxy.jsp?url='이다.
        appendQuery?: string
            URL 끝에 그대로 붙일 문자열이며 생략하면 빈 문자열이다.
        blendingType?: string = 'normal'
            BLENDING_FUNCTION의 선택 키다.

U3dImageWMSLayerCO 타입 정의
    U3dImageLayerCO와 U3dImageWMSLayerCO_Content를 합친 생성 옵션 타입이며 제외하는 기반 필드는 없다.

U3dImageWMSLayerSetParamsOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        cqlFilter?: string
            변경할 CQL 필터다.
        styles?: string
            변경할 스타일이다.
        transparent?: boolean
            변경할 투명 배경 설정이다.
        key?: string
            변경할 인증 키다.
        useproxy?: boolean
            변경할 프록시 사용 여부다. 생성자 옵션과 달리 소문자 이름을 사용한다.
        proxyurl?: string
            변경할 프록시 접두어다. 생성자 옵션과 달리 소문자 이름을 사용한다.
        appendQuery?: string
            변경할 추가 쿼리다.

U3dImageWMSLayerBlendingState 부분 타입 명세
    이 명세에서 사용하는 필드:
        _blendingType: number
            일반 레이어가 소유하는 현재 블렌딩 값이다. 비공개 함수는 메시의 재질을 선택한 뒤 이 값을 읽으며 변경하지 않는다.

BLENDING_FUNCTION: object
    의존: Three.js — 재질 블렌딩 값; 상수: {NoBlending, NormalBlending, AdditiveBlending, SubtractiveBlending, MultiplyBlending}
    noblending은 NoBlending(0), normal은 NormalBlending(1), additive는 AdditiveBlending(2), subtractive는 SubtractiveBlending(3), multiply는 MultiplyBlending(4)에 대응한다.

mercator: UMercator
    의존: UMercator — 타일 영역 변환기 생성; 생성자: {new UMercator()}
    모듈 로드 시 한 번 생성하여 모든 WMS 레이어의 URL 계산에서 함께 사용한다.

U3dImageWMSLayer extends U3dImageLayer 클래스 정의
    의존: U3dImageLayer — 이미지 레이어 기반; 상속: {U3dImageLayer}

    static OPT_KEYS: Array<string>
        의존: U3dImageLayer — 상속한 정규화 키 목록; 속성 읽기: {OPT_KEYS}
        기반 옵션 키에 layerName, reverseX, reverseY, width, height, cqlFilter, version, key, styles, useProxy, proxyUrl, appendQuery, blendingType을 추가한 정규화 키 목록이다.

    _layername: string | undefined
        WMS 서비스의 레이어 이름이다.
    _reverseX, _reverseY: boolean = false
        타일 인덱스 반전 설정이다.
    _version: string = '1.3.0'
        WMS 요청 버전이다.
    _width, _height: number = 256
        요청 이미지 크기다.
    _key, _styles, _cqlFilter, _appendQuery: string = ''
        인증 키, 스타일, 필터와 추가 쿼리다.
    _useproxy: boolean = false
        프록시 사용 여부다.
    _proxyurl: string = './proxy.jsp?url='
        프록시 접두어다.
    _blendingType: number = NormalBlending
        이미지 재질에 적용할 블렌딩 값이다.

    constructor(opt: U3dImageWMSLayerCO = {})
        인터페이스: opt는 WMS 요청 설정과 기반 이미지 레이어 옵션이다.
        의존:
            normalizeOptionKeys — 실제 생성 클래스의 옵션 키 정규화; 함수: {normalizeOptionKeys()}
            U3dImageLayer — 기반 초기화; 생성자: {super()}
            defined — baseUrl과 블렌딩 매핑 값의 존재 여부 판정; 함수: {defined()}
            defaultValue — undefined 옵션만 기본값으로 대체; 함수: {defaultValue()}
            Web API — 초기화 실패 로그; 함수: {console.info()}
        동작:
            new.target을 기준으로 옵션 키를 정규화하고 기반 생성자를 실행한다.
            기반 생성자는 opacity의 기본값 1과 opacity < 1 판정으로 _transparent를 초기화하고, transparent 옵션이 undefined가 아니면 그 값으로 덮어쓴다. 이 상태를 WMS URL의 TRANSPARENT에 사용한다.
            baseUrl이 null·undefined이면 안내를 출력하고 WMS 설정 초기화를 끝낸다. 기반 생성자는 이미 실행되었다. [확인 Q-004]
            _classtype을 'U3dImageWMSLayer'로, _baseUrl과 _layername을 전달된 값으로 저장한다.
            타입 노드의 옵션과 기본값으로 _ext, _reverseX·_reverseY, _crs, _version, _width·_height, _minlevel·_maxlevel을 저장한다. defaultValue는 null을 기본값으로 바꾸지 않는다.
            인증 키·스타일·필터·추가 쿼리는 생략 시 빈 문자열로, 프록시 사용은 false로, 접두어는 './proxy.jsp?url='로 저장한다.
            블렌딩 기본값은 normal이다. blendingType 옵션이 truthy이면 매핑 값을 조회하고, 조회 결과가 null·undefined가 아니면서 숫자일 때만 _blendingType을 바꾼다. NoBlending의 0도 적용하며, 미등록 키나 숫자가 아닌 결과는 기본값을 유지한다.

    createUrl(tile: U3dQuadTile) -> string | undefined
        인터페이스: tile의 영역 중심과 실제 레벨로 GetMap 주소를 만들며, 요청 중단 경로에서는 undefined를 반환한다.
        의존:
            U3dQuadTile(tile) — 타일 위치·레벨; 속성 읽기: {_rectangle, _rlevel}
            UGeoRect(tile._rectangle) — 타일 영역 중심 조회; 함수: {centerMap()}
            UMathEngine — 좌표와 반전 설정으로 타일 인덱스 계산; 정적 함수: {getIndexXY()}
            UMercator(mercator) — 공유 변환기의 타일 BBOX 계산; 함수: {TileBounds()}
            U3dLayer — 요청 중단 시 타일 상태와 배경 투명도; 함수: {setStateTile()}; 속성 읽기: {_transparent}
            UDEF — 타일 종료 상태; 상수: {TILE_STATE._end}
            defined — 계산된 영역 존재 여부 판정; 함수: {defined()}
            Web API — 영역 계산 실패 로그; 함수: {console.info()}
        동작:
            타일 영역의 중심을 읽고 실제 레벨 및 X·Y 반전 설정과 함께 인덱스 계산에 전달한다.
            레벨이 _minlevel 미만 또는 _maxlevel 초과이면 타일을 _end 상태로 바꾸고 undefined를 반환한다.
            공유 mercator로 인덱스의 EPSG:3857 타일 영역을 구한다. 영역이 없으면 로그를 출력하고 타일을 _end로 바꾼 뒤 undefined를 반환한다.
            STYLES 항목을 만들고 스타일이 있으면 붙인다. 인증 키가 있으면 이 항목 전체를 KEY 항목으로 교체하므로 STYLES가 사라진다. [확인 Q-002]
            필터가 있으면 CQL_FILTER를 붙인다. 버전이 정확히 '1.1.0'이면 SRS를, 그 외에는 CRS를 좌표계 키로 사용한다.
            서비스 주소 뒤에 SERVICE=WMS, VERSION, REQUEST=GetMap, FORMAT, TRANSPARENT, LAYERS, 좌표계, WIDTH·HEIGHT, BBOX(minx,miny,maxx,maxy), 스타일 또는 키, 필터와 추가 쿼리를 순서대로 연결한다. 값은 URL 인코딩하지 않으며 기존 주소의 쿼리 유무에 관계없이 '?SERVICE='로 시작한다.
            프록시 사용이 truthy이면 완성된 URL 앞에 _proxyurl을 붙이고 URL을 반환한다.

    setParams(params: U3dImageWMSLayerSetParamsOption) -> void
        인터페이스: params는 변경할 항목만 전달한다. 이 메서드 자체는 옵션 키 정규화나 타일 재요청을 실행하지 않는다.
        의존:
            defined — params와 변경할 값의 존재 여부 판정; 함수: {defined()}
            U3dLayer — 배경 투명도 변경; 속성 쓰기: {_transparent}
            Web API — params 누락 로그; 함수: {console.error()}
        동작:
            params가 null·undefined이면 오류를 출력하지만 반환하지 않는다. 이어지는 속성 접근에서 예외가 발생한다. [확인 Q-003]
            cqlFilter, styles, transparent, key, useproxy, proxyurl, appendQuery 각각이 null·undefined도 빈 문자열도 아닐 때 대응 상태를 갱신한다. boolean false는 반영하며 빈 문자열로 기존 문자열 값을 지우지는 못한다.

    override createTexture(tile: U3dQuadTile) -> Promise<U3dQuadTile> | undefined
        인터페이스: tile은 이미지를 적용할 타일이다. 반환된 Promise는 기반 이미지 처리의 완료를 전달하며, 요청을 시작하지 않으면 undefined다.
        의존:
            U3dImageLayer — 공통 생성 허용 판정과 이미지 처리; 함수: {createTexture(), processTexture()}
            U3dLayer — 타일 종료 상태와 cache 메시 조회; 함수: {setStateTile(), getCache()}
            UDEF — 타일 종료 상태; 상수: {TILE_STATE._end}
            U3dQuadTile(tile) — 당시 그리기 상태; 속성 읽기: {_drawArg}
            defined — URL 존재 여부 판정; 함수: {defined()}
            deferred — 기반 처리에 전달할 완료 객체 생성; 함수: {deferred()}
        동작:
            _crs가 'EPSG:3857'이 아니면 타일을 _end 상태로 바꾸고 undefined를 반환한다.
            기반 createTexture의 결과가 falsy이면 후속 요청을 하지 않고 undefined를 반환한다.
            tile의 drawArg를 보관하고 요청 URL을 만든다. URL이 없으면 타일을 _end 상태로 바꾸고 undefined를 반환한다.
            deferred를 만들고 타일·drawArg·URL과 함께 기반 processTexture에 전달한다. 별도 처리 옵션은 전달하지 않는다.
            기반 처리를 호출한 뒤 deferred의 성공 callback을 등록한다. 완료 타일의 cache 메시가 있으면 메시와 현재 레이어를 전달하여 재질에 블렌딩을 반영한다. 이미 완료된 deferred는 callback을 등록하는 시점에 실행할 수 있다.
            성공 callback에서 파생된 Promise가 아니라 원래 deferred를 반환한다. 블렌딩 callback의 오류를 반환 Promise에 다시 연결하거나 별도 오류 callback을 등록하지 않는다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
