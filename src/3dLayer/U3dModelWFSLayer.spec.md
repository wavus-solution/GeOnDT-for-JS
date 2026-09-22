# U3dModelWFSLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dModelWFSLayer`는 WFS 서비스의 GetFeature 응답(GeoJSON)을 지형 타일 단위로 요청하여, 각 feature의 point·line·polygon 좌표를 구·파이프·돌출 건물 mesh로 만들고 스타일과 POI 라벨을 붙여 장면에 배치하는 모델 레이어다.

### 1.2 책임 범위

- 타일 영역과 레이어 설정으로 WFS GetFeature 요청 URL을 만들고 GeoJSON 응답을 내려받는다.
- 응답 feature를 4개 단위 작업으로 나누어 타일 작업 큐에 등록하고, 작업 안에서 기하 종류별 mesh를 만든다.
- 속성 필드와 사용자 콜백에서 모델의 높이, 층 수, 한 층당 높이, 파이프 반지름과 밑면 높이를 결정한다.
- SLD 규칙 또는 사용자 스타일 콜백으로 색상·투명도·가시성·텍스처 스타일을 계산하여 재질과 기하에 반영한다.
- 사용자 라벨 콜백과 스타일 라벨 정보로 mesh별 POI를 만들고 라벨 그룹의 가시성을 관리한다.
- 지형 사용 설정에 따라 mesh 밑면을 렌더 높이에 맞추고 자동 높이 갱신 대상으로 등록한다.
- 타일별·레이어 전체 모델 식별자 집합과 텍스처·POI 자원을 소유하고 타일·레이어 처분 경로에서 정리한다. 현재 레이어 처분 뒤에도 라벨 맵 참조는 비우지 않는다. [확인 Q-043]
- 책임 경계: 타일 탐색, 작업 큐 실행, 편집 이벤트 판정, 타일 캐시 그룹 생성과 로딩 카운터는 `U3dModelLayer`와 `U3dLayer`가 담당한다. WFS 좌표는 이미 렌더 좌표계(google)로 들어온다고 보고 재투영하지 않는다.

### 1.3 주요 동작 방식

생성자는 WFS 요청 구성값과 속성 필드명을 저장하고, 최대 레벨을 최소 레벨과 같게 만들어 모델 생성 레벨을 하나로 고정하며, SLD URL이 있으면 로드가 끝날 때까지 모델 생성을 보류한다. 기반 레이어가 타일마다 `createModel()`을 호출하면 타일 영역으로 BBOX 요청 URL을 만들어 GeoJSON을 내려받고, 응답을 4개 feature씩 묶은 작업으로 큐에 등록한 뒤 타일 상태를 종료로 확정한다. 각 작업은 feature 기하 종류에 따라 point는 구, line은 파이프, polygon은 돌출 mesh를 만들고 스타일·라벨·외곽선을 적용한 뒤 타일 캐시 그룹에 넣는다. 지형 사용 설정이 켜져 있고 사용자 높이 콜백이 없으면 mesh 밑면을 현재 렌더 높이에 맞추고 자동 높이 갱신 콜백을 등록한다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp.createWFSModelLayer()`가 이 레이어를 생성하여 레이어 목록에 추가한다.
- `GeOnDT.model.U3dModelWFSLayer`로 사용자가 직접 생성하는 WFS 건물·시설물 예제
- `U3dApp`의 그림자 갱신 프레임이 `updateShadow()`를 호출한다.
- `U3dModelLayer`의 편집 완료 처리가 `_classtype`을 보고 `createModel()`을 직접 호출한다.
- `U3dCustomModel`이 이 모듈의 `lerpVector()`를 가져다 정점 보간에 사용한다.
- `U3dQuadTileWork`와 `U3dQuadTileWorkProcess`가 feature 파싱 작업의 필터 판정과 실행을 담당한다.

## 3. 정규 자연어 수도코드

```spec
U3dModelWFSLayerCO extends U3dModelLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            레이어 이름이며 생략하면 새 Guid를 사용하고 생성한 mesh의 소속 레이어 이름이 된다.
        baseurl?: string
            WFS 서비스 기본 URL이며 없으면 파생 초기화를 중단한다.
        layername?: string
            GetFeature 요청의 TYPENAME 값이다.
        ext?: string = 'application/json'
            GetFeature 요청의 outputformat 값이다.
        version?: string = '1.1.0'
            요청 URL의 WFS 서비스 버전이다.
        crs?: string = 'EPSG:3857'
            SRSNAME 값이며 BBOX 뒤에도 같은 값을 덧붙인다.
        cql?: string
            요청에 붙일 cql 조건이며 생략하면 조건 문자열을 붙이지 않는다.
        key?: string
            요청에 붙일 apikey 값이며 생략하면 붙이지 않는다.
        minlevel?: number = 17
            모델을 생성할 유일한 타일 레벨이다.
        useproxy?: boolean = false
            요청 URL과 SLD URL 앞에 프록시 URL을 붙일지 지정한다.
        proxyurl?: string = './proxy.jsp?url='
            프록시 접두 URL이며 useproxy가 false이면 빈 문자열로 대체한다.
        sldurl?: string
            SLD 스타일 파일 URL이며 지정하면 로드가 끝날 때까지 모델 생성을 보류한다.
        drawline?: boolean = false
            생성한 mesh에 외곽선 LineSegments를 추가할지 지정한다.
        usetexture?: boolean = false
            텍스처 스타일 판정에서 스타일 이미지 대신 기본 텍스처를 선택할지 지정한다. 현재 판정은 스타일 이미지 표시 여부·이미지 URL·기본 텍스처 URL이 모두 정의된 경우에만 이 값을 사용한다. [확인 Q-035]
        textureurl?: string | Array<string>
            기본 텍스처 이미지 URL 또는 URL 목록이다. 런타임은 두 형태를 처리하지만 타입 정의는 string만 선언한다. [확인 Q-018]
        materialtype?: string = 'standard'
            'toon'이면 Toon, 'standard'이면 Standard, 그 외에는 Phong 재질을 만든다. 타입 정의에는 선언되어 있지 않고 생성자만 읽는다. [확인 Q-020]
        color?: number | string = 0xeeeeee
            스타일이 색을 정하지 않을 때 사용하는 기본 색상이다. 타입 정의는 number와 기본값 0xB2CBD9만 선언하지만 공식 예제와 런타임은 문자열 색상도 사용한다. [확인 Q-009] [확인 Q-019]
        piperadius?: number = 0.5
            LineString 파이프 모델의 기본 반지름이다.
        featuretype?: string = '3d'
            JSDoc은 출력 형태를 정하는 값으로 설명하지만 현재 구현은 저장한 값을 파싱 경로에 전달만 한다. [확인 Q-007]
        useterrain?: boolean = true
            mesh 밑면을 지형 렌더 높이에 맞출지 지정한다. 소문자 옵션에 false만 주면 `||` 선택에서 사라져 기본값 true가 적용된다. [확인 Q-011]
        usebox?: boolean = false
            생성한 mesh에 BoxHelper를 추가할지 지정한다. 타입 정의에는 선언되어 있지 않고 생성자만 읽는다. [확인 Q-021]
        floorheight?: number = 3
            층 수로 높이를 계산할 때 사용하는 한 층 높이(m)이다.
        defaultheight?: number = 20
            높이와 층 수를 모두 얻지 못했을 때 사용하는 기본 높이(m)이다.
        defaultZoffset?: number = 0
            모든 모델 밑면에 더하는 높이 보정값(m)이다.
        fieldpk?: string = 'gid'
            모델 식별자로 사용할 속성 필드명이다.
        fieldheight?: string
            건물 높이를 담은 속성 필드명이다.
        fieldfloor?: string
            건물 층 수를 담은 속성 필드명이다.
        fieldheightfloor?: string
            한 층당 높이를 담은 속성 필드명이다.
        fieldlabel?: string
            라벨 문자열로 사용할 목적으로 저장하는 속성 필드명이다. 초기 라벨 생성 경로는 이 값을 읽지 않으며, `setLabelField()`를 명시적으로 호출한 뒤에만 이미 만들어진 라벨 문자열 갱신에 사용한다. [확인 Q-046]
        fieldkind?: string
            건물 종류를 담은 속성 필드명이며 현재 구현은 저장만 한다. [확인 Q-008]
        buildsn?: string | number
            외부에서 조회할 건물 일련번호이며 생성자는 buildsn과 buildSn을 읽지만 타입 정의에는 선언되어 있지 않다. [확인 Q-022]
        styleFunction?: U3dModelWFSLayerFeatureStyleFn
            feature별 스타일을 반환하는 사용자 콜백이며 지정하면 SLD 규칙보다 우선한다.
        heightFunction?: U3dModelWFSLayerSetterFn
            feature별 모델 밑면 높이(m)를 반환하는 사용자 콜백이며 지정하면 지형 높이 적용을 대체한다.
        depthFunction?: U3dModelWFSLayerSetterFn
            polygon에서는 돌출 높이(m), LineString에서는 파이프 반지름을 반환하는 사용자 콜백이다.
        labelFunction?: U3dModelWFSLayerLabelFn
            feature별 POI 라벨 옵션을 반환하는 사용자 콜백이다.

U3dModelWFSLayerFeature 타입 정의
    Record<string, any>
        GeoJSON feature 하나이며 이 명세는 id, geometry.type, geometry.coordinates와 properties만 사용한다.

U3dModelWFSLayerFeatureStyle 타입 정의
    Record<string, any>
        모델 스타일 정보이며 이 명세는 color, opacity, visible, size, widthSegments, heightSegments, imgurl, imgvisible, imgsize와 label만 사용한다.

U3dModelWFSLayerServiceJson 타입 정의
    features: Array<U3dModelWFSLayerFeature>
        GetFeature 응답의 feature 목록이다.

U3dModelWFSLayerMesh 타입 정의
    UWfsMesh | UWfsPointMesh
        이 레이어가 생성하는 mesh 종류이며 _tile, _ufeature, _uproperties, _ulayername과 _uvecBottom을 덧붙여 사용한다.

U3dModelWFSLayerFeatureFilterFn 함수 타입 정의
    (feature: U3dModelWFSLayerFeature) -> boolean
    인터페이스: boolean 결과를 반환하도록 선언되어 있으나 현재 구현은 이 콜백을 호출하지 않으므로 true·false의 의미, `this`와 호출 시점 계약이 확정되지 않는다. [확인 Q-001]

U3dModelWFSLayerFeatureStyleFn 함수 타입 정의
    (feature: U3dModelWFSLayerFeature) -> U3dModelWFSLayerFeatureStyle
    인터페이스: feature에 적용할 스타일 객체를 반환한다. 레이어의 `styleFunction` 멤버로 호출하므로 일반 함수의 `this`는 해당 레이어이며 화살표 함수는 자신의 어휘적 `this`를 유지한다.

U3dModelWFSLayerSetterFn 함수 타입 정의
    (feature: U3dModelWFSLayerFeature) -> number
    인터페이스: feature별 숫자 설정값을 반환하며 레이어 인스턴스를 수신 객체로 지정하여 호출하므로 `this`는 해당 레이어다. heightFunction 결과와 polygon의 depthFunction 결과는 미터 값으로 환산하지만 LineString의 depthFunction 결과는 TubeGeometry 반지름으로 직접 사용한다.

U3dModelWFSLayerLabelFn 함수 타입 정의
    (feature: U3dModelWFSLayerFeature) -> Record<string, any>
    인터페이스: POI 라벨 옵션 객체를 반환한다. 레이어의 `labelFunction` 멤버로 호출하므로 일반 함수의 `this`는 해당 레이어이며 화살표 함수는 자신의 어휘적 `this`를 유지한다.

U3dModelWFSLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 모델 레이어 공통 상태, 타일 수명주기와 작업 큐 제공; 상속: {U3dModelLayer}

    filter: U3dModelWFSLayerFeatureFilterFn | undefined
        setFilterFunction()으로 저장하는 사용자 feature 필터이며 어떤 경로에서도 읽지 않는다. [확인 Q-001]

    styleFunction: U3dModelWFSLayerFeatureStyleFn | undefined
        feature별 스타일을 계산하는 사용자 콜백이다.

    heightFunction: U3dModelWFSLayerSetterFn | undefined
        feature별 모델 밑면 높이를 계산하는 사용자 콜백이다.

    depthFunction: U3dModelWFSLayerSetterFn | undefined
        feature별 돌출 높이 또는 파이프 반지름을 계산하는 사용자 콜백이다.

    labelFunction: U3dModelWFSLayerLabelFn | undefined
        feature별 POI 라벨 옵션을 계산하는 사용자 콜백이다.

    _labelMap: Map<string | number, U3dPOI> = 빈 Map
        POI 이름별 라벨 객체 저장소이며 mesh 없이 식별자만으로 라벨을 제거할 때 사용한다.

    _textures: Record<string, THREE.Texture> = 빈 객체
        텍스처 URL별 로드 결과이며 여러 mesh 재질이 같은 Texture 참조를 공유할 수 있다. 저장소 교체와 재질 참조 해제의 수명주기가 일치하지 않는다. [확인 Q-023]

    _textureMaterials: Record<string, any> = 빈 객체
        생성자가 빈 객체로만 초기화하고 이 단위 어디에서도 읽거나 쓰지 않는 상태이다.

    _sld: {rules?: Array<Record<string, any>>}
        SLD 파일에서 파싱한 스타일 규칙 목록이며 각 규칙에는 필요 시 CQL 파서를 붙인다.

    _sldcolor: Record<string, any> = 빈 객체
        규칙 이름별 색상 캐시로 선언되어 있으나 이를 채우던 구현이 주석 처리되어 현재는 읽거나 쓰지 않는다.

    _sldLoaded: boolean = false
        모델 생성을 시작해도 되는지 나타내는 SLD 준비 상태이며 SLD URL이 없으면 즉시 true이다.

    _tileModelMap: Record<string, Record<string, boolean>> = 빈 객체
        타일 키별로 생성한 모델 식별자 집합이며 타일 처분에서 라벨과 전역 식별자를 되돌리는 기준이다.

    _modelIds: Record<string, boolean | undefined> = 빈 객체
        레이어 전체에서 이미 생성한 모델 식별자 집합이며 중복 생성을 막는다.

    _buildingSn: string | number | undefined
        외부에서 지정하는 건물 일련번호이며 저장과 조회만 한다.

    _defaultHeight: number = 20
        높이와 층 수를 얻지 못했을 때 사용하는 기본 높이(m)이다.

    _floorHeight: number = 3
        층 수로 높이를 계산할 때 사용하는 한 층 높이(m)이다.

    _pipeRadius: number = 0.5
        LineString 파이프 모델의 기본 반지름이다.

    _brightness: number = DEFAULT_BRIGHTNESS
        생성하는 mesh에 적용할 밝기 값이다.

    _contrast: number = DEFAULT_CONTRAST
        생성하는 mesh에 적용할 대비 값이다.

    _baseUrl: string
        GetFeature 요청의 기본 URL이다.

    _layername: string | undefined
        GetFeature 요청의 TYPENAME 값이다.

    _ext: string = 'application/json'
        GetFeature 요청의 outputformat 값이다.

    _version: string = '1.1.0'
        GetFeature 요청의 서비스 버전이다.

    _crs: string = 'EPSG:3857'
        SRSNAME 값이자 BBOX 뒤에 덧붙이는 좌표계 이름이다.

    _cql: string | undefined
        요청에 붙일 cql 조건이며 없으면 조건 문자열을 만들지 않는다.

    _key: string | undefined
        요청에 붙일 apikey 값이며 없으면 붙이지 않는다.

    _useproxy: boolean = false
        요청 URL에 프록시 접두를 붙일지 나타내는 상태이다.

    _proxyurl: string = './proxy.jsp?url='
        프록시 접두 URL이며 프록시를 쓰지 않으면 빈 문자열로 바뀐다.

    _sldUrl: string | undefined
        프록시 접두를 붙인 SLD 파일 URL이다.

    _minlevel: number = 17
        모델을 생성할 타일 레벨이다.

    _maxlevel: number = 17
        기반 레이어의 최대 레벨이며 생성자가 최소 레벨과 같은 값으로 만든다.

    _textureUrl: string | Array<string> | undefined
        기본 텍스처 이미지 URL 또는 URL 목록이다.

    _usetexture: boolean = false
        텍스처 스타일 판정에서 기본 텍스처 사용을 허용하는 상태이다. 스타일 이미지 정보가 없으면 현재 판정은 이 상태를 확인하기 전에 false를 반환한다. [확인 Q-035]

    _materialType: string = 'standard'
        생성할 재질 종류이다.

    _color: number | string = 0xeeeeee
        스타일이 색을 정하지 않을 때 사용하는 기본 색상이다. [확인 Q-009]

    _drawLine: boolean = false
        생성한 mesh에 외곽선을 추가할지 나타내는 상태이다.

    _useBox: boolean = false
        생성한 mesh에 BoxHelper를 추가할지 나타내는 상태이다.

    _useTerrain: boolean = true
        mesh 밑면을 지형 렌더 높이에 맞출지 나타내는 상태이다.

    _defaultZoffset: number = 0
        모든 모델 밑면에 더하는 높이 보정값(m)이다.

    _featureType: string = '3d'
        파싱 경로에 전달하지만 어느 경로에서도 읽지 않는 출력 형태 상태이다. [확인 Q-007]

    _fieldPk: string = 'gid'
        모델 식별자로 사용할 속성 필드명이다.

    _fieldHeight, _fieldFloor, _fieldFloorHeight: string | undefined
        높이, 층 수와 한 층당 높이를 담은 속성 필드명이다.

    _fieldLabel: string | undefined
        라벨 문자열로 사용할 목적으로 저장한 속성 필드명이다. 초기 라벨 생성에서는 읽지 않고 `setLabelField()`의 기존 라벨 갱신에서만 사용한다. [확인 Q-046]

    _fieldKind: string | undefined
        종류 필드명으로 저장하지만 이 단위 어디에서도 읽지 않는다. [확인 Q-008]

    _checkTime: UCheckTime
        기반 타일 갱신 실행 주기를 판정하는 검사기이다.

    _loader: UFileLoader
        json 응답 형식으로 고정한 공용 GetFeature 로더이다.

    _updateItem: number = 20
        생성자가 저장하지만 이 단위와 기반 레이어 어디에서도 읽지 않는 상태이다.

    _width, _height: number = 256
        생성자가 저장하지만 이 단위와 기반 레이어 어디에서도 읽지 않는 요청 크기 상태이다.

    constructor(opt: U3dModelWFSLayerCO = {})
        역할: WFS 요청 구성값, 속성 필드 매핑, 사용자 콜백과 모델·텍스처·라벨 상태 저장소를 초기화한다.

        인터페이스: opt는 기반 모델 레이어 옵션과 WFS 요청·스타일·필드 매핑 옵션을 함께 전달한다.

        처리 기준:
            baseurl이 없으면 예외를 던지거나 실패 상태를 남기지 않고 안내 로그만 출력한 뒤 파생 초기화를 중단한다. 이때 `_textures`를 포함한 파생 상태가 준비되지 않은 객체가 남아 이후 `dispose()`가 텍스처 저장소를 열거하면 예외가 발생한다. [확인 Q-049]
            모델 생성 레벨을 하나로 고정하기 위해 최대 레벨을 최소 레벨과 같은 값으로 만든다.
            useproxy가 정확히 false일 때만 프록시 접두를 빈 문자열로 바꾸며, 이 판정은 SLD URL에 접두를 붙인 뒤가 아니라 붙이기 전에 수행한다.
            SLD URL이 있으면 로드가 끝나기 전까지 모델 생성을 보류하고, 없으면 즉시 준비 완료로 표시한다.
            소문자와 camelCase 별칭이 함께 있는 옵션은 `||`로 먼저 참인 값을 고르므로 소문자 쪽에 `false`, `0` 또는 빈 문자열을 넘기면 camelCase 값이나 기본값이 대신 쓰인다. `useterrain: false`도 이 경로에서 true로 바뀐다. [확인 Q-011]

        의존:
            U3dModelLayer — 기반 모델 레이어 상태 초기화; 생성자: {new U3dModelLayer()}
            defined — 선택 옵션과 생성 promise 존재 여부 판정; 함수: {defined()}
            defaultValue — 옵션 기본값 적용; 함수: {defaultValue()}
            Guid — 이름을 생략했을 때 식별 이름 생성; 함수: {Guid()}
            UCheckTime — 갱신 주기 검사기 생성; 생성자: {new UCheckTime()}
            UFileLoader — GetFeature 응답 로더 생성과 json 응답 형식 지정; 생성자: {new UFileLoader()}; 함수: {setResponseType()}
            Console API — baseurl 누락 안내; 함수: {console.info()}

        동작:
            기반 모델 레이어를 초기화한다.
            baseurl이 없으면 안내 로그를 출력하고 나머지 초기화를 수행하지 않는다.
            class type, 이름, 레이어명, 프록시 설정, apikey, 외곽선·경계 상자 표시, 지형 사용, 텍스처 URL, 기본 높이와 높이 보정값을 저장하고 갱신 주기 검사기를 만든다. [확인 Q-021]
            텍스처·재질 상태 저장소를 비우고 재질 종류, 기본 텍스처 사용 여부와 기본 색상을 저장한다. [확인 Q-009] [확인 Q-020]
            텍스처 URL이 있으면 텍스처를 미리 로드한다.
            프록시를 사용하지 않으면 프록시 접두를 빈 문자열로 바꾼다.
            기본 URL, 출력 형식, 좌표계, 서비스 버전, 요청 크기와 표시 레벨을 저장하고 최대 레벨을 최소 레벨과 같게 만든다.
            cql, 층 높이, 파이프 반지름과 속성 필드명을 저장한다. `fieldlabel`도 저장하지만 초기 라벨 생성 경로에서는 사용하지 않는다. [확인 Q-008] [확인 Q-046]
            건물 일련번호와 feature 출력 형태를 저장한다. [확인 Q-007] [확인 Q-022]
            SLD URL에 프록시 접두를 붙이고 SLD 준비 상태와 규칙·색상 저장소를 초기화한다.
            타일 콜백에서 사용할 수 있도록 createModel을 현재 객체에 묶는다.
            SLD URL이 있으면 SLD를 로드하고, 없으면 준비 완료로 표시하여 모델 생성을 바로 허용한다.
            사용자 필터·스타일·높이·깊이·라벨 콜백을 저장한다.
            타일별 모델 맵, 모델 식별자 집합, 응답 로더와 라벨 맵을 준비한다.
            생성 promise가 연결되어 있으면 자기 자신으로 완료한다.

    밝기와 대비 책임 그룹
        역할: 생성한 mesh의 밝기·대비 표현 값을 조회하고 현재 렌더 그룹 전체에 반영한다.

        getBrightness() -> number
            인터페이스: 반환: 현재 밝기 값
            동작: 현재 밝기 값을 반환한다.

        getContrast() -> number
            인터페이스: 반환: 현재 대비 값
            동작: 현재 대비 값을 반환한다.

        setBrightness(val: number) -> U3dModelWFSLayer
            인터페이스: 반환: 연쇄 호출을 위한 자기 자신
            처리 기준: 하위 객체의 현재 brightness가 truthy일 때만 새 값을 반영하므로 brightness가 0이거나 속성이 없으면 건너뛴다. [확인 Q-012]
            의존:
                U3dLayer — 레이어 렌더 그룹 조회; 속성 읽기: {_group}
                THREE — 렌더 그룹 하위 객체 순회; 함수: {Object3D.traverse()}
                UWfsMesh — mesh 밝기 uniform 갱신; 속성 읽기·쓰기: {brightness}
            동작:
                입력 밝기 값을 저장한다.
                렌더 그룹의 하위 객체 중 현재 brightness가 truthy인 mesh에만 새 값을 반영하고 자기 자신을 반환한다. [확인 Q-012]

        setContrast(val: number) -> U3dModelWFSLayer
            인터페이스: 반환: 연쇄 호출을 위한 자기 자신
            처리 기준: 하위 객체의 현재 contrast가 truthy일 때만 새 값을 반영하므로 contrast가 0이거나 속성이 없으면 건너뛴다. [확인 Q-013]
            의존:
                U3dLayer — 레이어 렌더 그룹 조회; 속성 읽기: {_group}
                THREE — 렌더 그룹 하위 객체 순회; 함수: {Object3D.traverse()}
                UWfsMesh — mesh 대비 uniform 갱신; 속성 읽기·쓰기: {contrast}
            동작:
                입력 대비 값을 저장한다.
                렌더 그룹의 하위 객체 중 현재 contrast가 truthy인 mesh에만 새 값을 반영하고 자기 자신을 반환한다. [확인 Q-013]

    override deleteMesh(mesh: U3dModelWFSLayerMesh) -> void
        역할: mesh를 제거하기 전에 이 레이어가 붙인 편집 기즈모 연결과 자동 높이 갱신 등록을 먼저 해제한다.

        처리 기준: Mesh가 아니면 기즈모와 자동 높이 갱신 해제를 건너뛰고 기반 제거만 수행한다.

        의존:
            THREE — mesh 종류 판정과 위치 조회; 생성자: {Mesh}; 속성 읽기: {Object3D.position}
            defined — 기즈모 연결 여부 판정; 함수: {defined()}
            U3dLayer — 자동 높이 갱신 해제에 사용할 app 참조; 속성 읽기: {_app}
            U3dApp — 자동 높이 갱신 등록 해제; 함수: {removeAutoHeightUpdate()}
            mesh.hasGizmo — 연결된 편집 기즈모 분리; 함수: {detach()}
            U3dModelLayer — 기반 mesh 제거와 렌더 자원 해제; 함수: {deleteMesh()}

        동작:
            Mesh이면 연결된 편집 기즈모를 분리하고 mesh 위치로 등록한 자동 높이 갱신을 해제한다.
            기반 레이어의 mesh 제거를 수행한다.

    updateShadow(updateTime: number) -> void
        역할: 한 프레임에 정해진 수만큼만 mesh를 골라 그림자 적용 상태를 갱신한다.

        인터페이스: updateTime은 그림자 갱신 시각 판정과 기록에 사용하는 프레임 경과 시간이다.

        처리 기준:
            렌더 그룹에 자식이 없으면 아무 것도 하지 않는다.
            idle 렌더 중이면 한 번에 70개, 아니면 2개까지만 처리한다.
            타일 그룹이나 mesh가 없거나 그림자 갱신 시각에 도달하지 않은 대상은 건너뛴다.

        의존:
            U3dLayer — 레이어 렌더 그룹과 app 참조 조회; 속성 읽기: {_group, _app}
            U3dApp — idle 렌더 여부 판정과 현재 프러스텀 조회; 함수: {isIdleDraw()}; 속성 읽기: {_frustum}
            THREE — mesh가 현재 프러스텀에 들어오는지 판정; 함수: {Frustum.intersectsObject()}
            UGroup — 타일 그룹과 mesh를 순환 위치에서 하나씩 선택; 함수: {next()}
            UMesh — 그림자 갱신 시각 판정과 그림자 적용; 함수: {hasReachedShadowTime(), applyShadow()}; 속성 읽기: {visible}

        동작:
            렌더 그룹이 비어 있으면 종료한다.
            idle 여부로 이번 프레임의 처리 개수를 정한다.
            정해진 개수만큼 타일 그룹과 그 안의 mesh를 순환 위치에서 하나씩 꺼낸다.
            갱신 시각에 도달한 mesh에만 현재 가시성과 프러스텀 교차 결과를 그림자 적용 여부로 전달한다.

    override dispose() -> Promise<boolean>
        역할: 레이어를 처분하면서 이 레이어가 소유한 텍스처 자원도 함께 해제한다.

        인터페이스: 반환: 기반 레이어 처분 결과이며 텍스처 해제 완료를 따로 알리지 않는다.

        처리 기준:
            기반 처분은 mesh에 연결된 라벨을 해제하지만 이 레이어의 `_labelMap` 항목은 비우지 않는다. [확인 Q-043]
            baseurl 누락으로 `_textures`가 초기화되지 않은 객체에서는 기반 처분 뒤 텍스처 저장소를 열거할 때 예외가 발생하여 처분 결과를 반환하지 못한다. [확인 Q-049]

        의존: U3dModelLayer — 기반 레이어 처분; 함수: {dispose()}

        동작:
            기반 레이어를 처분한다.
            보관 중인 텍스처를 모두 해제한다.
            라벨 맵은 비우지 않은 채 기반 처분 결과를 반환한다. [확인 Q-043]

    override disposeTileByKey(key: string) -> void
        역할: 타일 키에 속한 모델 식별자, 라벨과 작업 버퍼를 정리한 뒤 기반 타일 처분을 수행한다.

        처리 기준:
            키가 없으면 아무 것도 하지 않는다.
            편집 이벤트 중 뒤 타일이 없는 항목과 뒤 타일 키가 이 타일과 같은 항목은 추가 상태를 해제한다.
            타일별 모델 맵의 식별자는 지정한 `_fieldPk` 값 또는 feature id이지만 라벨 맵의 키는 feature id 또는 mesh uuid이므로 두 키가 다르면 식별자 경로에서 라벨 맵 항목을 제거하지 못한다. 이후 기반 타일 처분은 mesh에 연결된 화면 라벨을 별도로 해제한다. [확인 Q-025]
            숫자 모델 식별자는 일반 객체의 속성 키로 기록되면서 문자열로 바뀌지만 라벨 맵은 숫자 feature id를 그대로 키로 유지할 수 있어, 값이 같아도 이 경로의 문자열 키로 라벨을 찾지 못할 수 있다. [확인 Q-055]

        의존:
            defined — 키와 편집 이벤트의 뒤 타일 존재 여부 판정; 함수: {defined()}
            U3dModelLayer — 편집 이벤트 목록과 항목 조회, 기반 타일 처분; 속성 읽기: {editedList}; 함수: {getEditedEventById(), disposeTileByKey()}
            U3dLayer — 타일 작업 버퍼 정리; 속성 읽기·쓰기·삭제: {_workBuffer}

        동작:
            키가 없으면 종료한다.
            편집 이벤트를 순회하여 뒤 타일이 없거나 뒤 타일 키가 이 타일과 같은 항목의 추가 상태를 해제한다.
            이 타일이 만든 모델 식별자마다 같은 키의 라벨을 찾아 제거하고 전역 모델 식별자 집합에서 지운다.
            타일별 모델 맵과 작업 버퍼에서 이 키를 제거한다.
            기반 레이어의 타일 처분을 수행한다.

    override disposeTile(tile: U3dQuadTile) -> void
        역할: 타일 객체를 타일 키로 바꾸어 키 기준 처분에 위임한다.

        처리 기준: 타일이 없으면 아무 것도 하지 않는다.

        의존:
            defined — 타일 존재 여부 판정; 함수: {defined()}
            U3dLayer — 타일 키 조회; 함수: {createKeyFromTile()}

        동작:
            타일이 없으면 종료한다.
            타일 키를 구해 키 기준 타일 처분을 수행한다.

    override show(show: boolean) -> void
        역할: 레이어 가시성과 라벨 가시성을 함께 전환한다.

        인터페이스: 기반 `U3dModelLayer.show()`의 두 번째 인수 refresh는 노출하지 않으므로 기반 기본값이 적용된다.

        처리 기준:
            draw argument가 없으면 app을 확인하는 첫 접근에서 예외가 발생할 수 있다. [확인 Q-041]
            draw argument는 있지만 app이 연결되어 있지 않으면 라벨 상태와 기반 가시성을 모두 바꾸지 않고 종료한다.

        의존:
            U3dLayer — app 연결 확인에 사용하는 draw argument; 속성 읽기: {_drawArg}
            UDrawArg — 연결된 app 조회; 속성 읽기: {_app}
            defined — app 존재 여부 판정; 함수: {defined()}
            U3dModelLayer — 상속한 라벨 가시성 저장과 기반 가시성 전환; 함수: {show()}; 속성 쓰기: {_labelVisible}

        동작:
            draw argument에서 app을 읽는다. draw argument 자체가 없으면 이 단계에서 예외가 발생할 수 있다. [확인 Q-041]
            app이 없으면 종료한다.
            입력 가시성 값을 라벨 가시성 상태에 그대로 저장한다.
            라벨 그룹과 각 라벨의 표시를 현재 상태에 맞춘다.
            기반 레이어의 가시성 전환을 수행한다.

    setFilterFunction(fnc: U3dModelWFSLayerFeatureFilterFn) -> void
        역할: 사용자 feature 필터 콜백을 저장한다.

        처리 기준: 입력이 함수가 아니면 저장하지 않는다.

        동작: 입력이 함수이면 필터 속성에 저장한다. 저장한 콜백은 파싱·가시성 경로 어디에서도 호출하지 않는다. [확인 Q-001]

    setUseTerrain(val: boolean) -> void
        동작: 지형 적용 여부 상태에 입력값을 저장한다.

    getUseTerrain() -> boolean
        인터페이스: 반환: 현재 지형 적용 여부
        동작: 현재 지형 적용 여부를 반환한다.

    showLabel(visible: boolean) -> void
        역할: 레이어 가시성과 무관하게 라벨 가시성만 전환한다.

        의존: U3dModelLayer — 상속한 라벨 가시성 저장; 속성 쓰기: {_labelVisible}

        동작:
            입력 가시성 값을 라벨 가시성 상태에 저장한다.
            라벨 그룹과 각 라벨의 표시를 현재 상태에 맞춘다.

    setLabelField(labelField: string) -> boolean
        역할: 라벨 문자열로 사용할 속성 필드를 바꾸고 이미 만들어진 라벨 문자열을 다시 계산한다.

        인터페이스: 반환: 필드명이 있으면 true, 없으면 false

        처리 기준:
            필드명이 없으면 상태를 바꾸지 않고 false를 반환한다.
            라벨이 붙어 있지 않은 mesh는 건너뛴다.
            이 메서드는 새 라벨을 만들지 않고 이미 만들어진 라벨의 문자열만 바꾸므로, 생성 옵션의 fieldlabel을 저장한 것만으로 초기 라벨이 만들어지지는 않는다. [확인 Q-046]

        의존:
            defined — 필드명 존재 여부 판정; 함수: {defined()}
            U3dLayer — 레이어 렌더 그룹 조회; 속성 읽기: {_group}
            THREE — 렌더 그룹 하위 객체 순회와 mesh 종류 판정; 함수: {Object3D.traverse()}; 생성자: {Mesh}; 속성 읽기: {Object3D.userData}
            U3dPOI — 라벨 문자열 교체; 함수: {setLabel()}

        동작:
            필드명이 없으면 false를 반환한다.
            새 라벨 필드명을 저장한다.
            렌더 그룹의 Mesh 중 라벨을 가진 대상마다 새 필드의 feature 속성값을 라벨 문자열로 다시 설정하고 true를 반환한다.

    override update(drawArg: UDrawArg) -> void
        역할: 갱신 주기를 통과한 경우에만 기반 레이어의 타일 갱신을 실행한다.

        처리 기준:
            draw argument가 없으면 아무 것도 하지 않는다.
            갱신 주기를 통과하지 못하면 기반 갱신을 건너뛴다.
            검사기는 보관한 기준 시각에서 20ms 이상 지난 호출에서 다음 `isUpdate()`가 통과하도록 내부 시각을 갱신한다.

        의존:
            defined — draw argument 존재 여부 판정; 함수: {defined()}
            UCheckTime — 갱신 주기 판정과 다음 검사 시각 갱신; 함수: {isUpdate(), updateTime()}
            U3dModelLayer — 기반 타일 갱신; 함수: {update()}

        동작:
            draw argument가 없으면 종료한다.
            갱신 주기를 통과했으면 기반 레이어의 타일 갱신을 실행한다.
            기준 시각에서 20ms가 지났으면 다음 호출이 갱신 주기를 통과하도록 검사기 시각을 갱신한다.

    removeAllResource() -> void
        역할: 보관 중인 텍스처를 모두 해제하고 저장소를 비운다.

        처리 기준:
            텍스처 저장소가 초기화되지 않았으면 키 열거에서 예외가 발생한다. [확인 Q-049]
            기존 mesh 재질의 map 참조는 분리하지 않으므로 재질이 계속 사용 중인 공유 Texture도 해제될 수 있다. [확인 Q-023]

        의존: THREE — 텍스처 GPU 자원 해제; 함수: {Texture.dispose()}

        동작:
            보관 중인 텍스처를 하나씩 해제한다.
            텍스처 저장소를 빈 객체로 교체한다.

    setTexture(url: string | Array<string>) -> void
        역할: 텍스처 이미지를 로드하여 URL별로 보관하고 이후 스타일 적용에서 재사용할 수 있게 한다.

        인터페이스: url은 이미지 하나 또는 이미지 목록이며 각 URL이 저장 키가 된다. 타입 정의의 생성 옵션은 목록 형태를 포함하지 않는다. [확인 Q-018]

        처리 기준:
            새 텍스처를 로드하기 전에 기존 텍스처를 모두 해제하지만, 기존 mesh 재질에서 해당 Texture 참조를 분리하지 않는다. [확인 Q-023]
            URL 목록은 각 원소를 별도 키로 저장하지만 텍스처 스타일 판정은 목록 전체를 하나의 객체 키로 조회한다. [확인 Q-036]
            입력 URL을 `_textureUrl`에 반영하지 않으므로 공개 메서드로 기본 텍스처를 교체해도 기본 선택 기준은 생성 때의 URL 또는 undefined에 남는다. [확인 Q-052]
            `TextureLoader.load()` 호출이 동기적으로 예외를 던지면 기록하고 해당 URL을 건너뛰지만, 비동기 네트워크·디코드 실패를 받을 오류 callback은 등록하지 않는다. [확인 Q-057]
            보관하는 텍스처는 크기를 재조정하지 않고 세로 뒤집기를 끈 상태로 사용한다.
            텍스처 로드는 비동기이므로 반환 시점에는 이미지 데이터가 아직 도착하지 않았을 수 있다.

        의존:
            THREE — 텍스처 로더 생성과 로드, 갱신·뒤집기 설정; 생성자: {new TextureLoader()}; 함수: {TextureLoader.load()}; 속성 쓰기: {Texture.needsUpdate, Texture.flipY}
            UDEF — 텍스처 크기 재조정 방지 설정; 정적 함수: {noResizeTexture()}
            Console API — 텍스처 부재와 로드 오류 기록; 함수: {console.log()}

        동작:
            기존 텍스처를 모두 해제한다.
            입력이 목록이면 각 URL을, 아니면 단일 URL을 로드한다.
            로더 반환값이 없으면 안내를 기록하고 해당 URL을 건너뛴다.
            로드한 텍스처에 크기 재조정 방지, 갱신 표시와 세로 뒤집기 해제를 적용하여 URL 키로 보관한다.

    override createModel(tile: U3dQuadTile) -> boolean | Promise<boolean> | undefined
        역할: 타일 영역으로 WFS GetFeature 요청을 만들어 GeoJSON을 내려받고 파싱 작업 등록으로 넘긴다.

        인터페이스:
            반환: 요청을 시작했으면 완료 여부를 담은 promise, 시작하지 않았으면 undefined
            반환 promise의 true는 파싱 작업을 큐에 등록했다는 뜻이며 mesh 생성 완료를 뜻하지 않는다.

        처리 기준:
            기반 사전 조건을 통과하지 못하거나 SLD 준비가 끝나지 않았거나 타일 또는 장면이 없으면 타일 상태를 초기화하고 요청하지 않는다. SLD 전송 실패와 200·404 외 응답은 준비 미완료 상태를 유지해 이후 요청도 이 경로에서 종료된다. [확인 Q-045]
            타일 mesh가 이미 처분되었으면 타일 상태를 종료로 바꾸고 요청하지 않는다.
            draw argument가 없으면 오류를 던진다.
            레이어가 보이지 않거나 타일 상태가 이미 로딩 이상이거나 타일 레벨이 최소 레벨과 다르면 타일 상태를 종료로 바꾸고 요청하지 않는다.
            타일 캐시 그룹이 이미 있으면 false로 완료한 promise를 반환하고, 없으면 캐시 그룹을 만든다.
            좌표계가 정의되어 있으면 BBOX 뒤에 좌표계 이름을 덧붙이며, 기본값이 있으므로 좌표계가 없는 경로는 실행되지 않는다.
            응답이 도착했을 때 타일이 이미 처분되었으면 로딩 수를 줄이고 false로 완료한다.
            요청 실패에서는 로딩 수를 줄이고 false로 완료하지만 타일 상태를 로딩에서 복구하지 않는다. [확인 Q-017]

        의존:
            U3dModelLayer — 기반 모델 생성 사전 판정, 타일 처분 여부 확인과 캐시 그룹 생성; 함수: {createModel(), isTileMeshDisposed(), isTileDisposed(), createGroup()}
            U3dLayer — 타일 상태·캐시 조회와 변경, 장면·가시성·작업 버퍼 조회와 로딩 수 관리; 함수: {resetStateTile(), setStateTile(), getStateTile(), getCache(), plusLoadingTile(), minusLoadingTile()}; 속성 읽기: {_scene, _visible, _workBuffer}
            defined — 타일, 장면, draw argument, cql과 작업 버퍼 존재 여부 판정; 함수: {defined()}
            U3dQuadTile — 타일 영역, 레벨과 draw argument 조회; 속성 읽기: {_rectangle, _rlevel, _drawArg}; 함수: {URectangle.centerMap()}
            UMathEngine — 타일 중심을 최소 레벨의 타일 인덱스로 환산; 정적 함수: {getGoogleToIndexXY()}
            UDEF — 타일 상태 상수 사용; 상수: {TILE_STATE.{_loading, _end}}
            deferred — 요청 완료를 알릴 promise 생성; 함수: {deferred()}
            UFileLoader — GetFeature 요청 전송과 응답·오류 콜백 연결; 함수: {load()}
            __GError__ — 요청 실패 보고; 함수: {__GError__()}

        동작:
            기반 사전 조건, SLD 준비 상태, 타일과 장면을 검사하고 통과하지 못하면 타일 상태를 초기화한 뒤 종료한다.
            타일 mesh가 이미 처분되었으면 타일 상태를 종료로 바꾸고 종료한다.
            draw argument가 없으면 오류를 던진다.
            타일 중심을 최소 레벨의 인덱스로 바꾸어 타일 키를 만든다.
            가시성, 타일 상태와 레벨 조건을 확인하고 하나라도 어긋나면 타일 상태를 종료로 바꾸고 종료한다.
            타일 캐시 그룹이 있으면 false로 완료한 promise를 반환하고, 없으면 캐시 그룹을 만든 뒤 타일 상태를 로딩으로 바꾼다.
            타일 사각형의 최소·최대 좌표로 BBOX를 만들고 서비스 버전, 출력 형식, 레이어명, 좌표계, apikey와 cql을 붙여 요청 URL을 완성한다.
            로딩 수를 늘린다.
            같은 타일 키의 작업 버퍼가 이미 있으면 값의 종류를 구분하지 않고 로딩 수를 줄이거나 타일 상태를 되돌리지 않은 채 promise 없이 종료한다. [확인 Q-002] [확인 Q-005] [확인 Q-050]
            요청을 보내고, 응답이 오면 타일 처분 여부를 확인한 뒤 파싱 작업 등록으로 넘긴다.
            요청이 실패하면 오류를 보고하고 로딩 수를 줄인 뒤 false로 완료하지만 타일 상태는 로딩으로 남긴다. [확인 Q-017]
            작업 등록 결과를 알릴 promise를 반환한다.

    addEditModel(mesh: U3dModelWFSLayerMesh, tile: U3dQuadTile) -> Promise<boolean>
        역할: 편집한 mesh가 속한 타일의 feature를 다시 요청하여 편집 대기 버퍼와 작업 버퍼를 갱신한다.

        인터페이스: 반환: 편집 버퍼 갱신 결과를 담은 promise이며 mesh 재생성 완료를 뜻하지 않는다.

        처리 기준:
            draw argument가 없으면 오류를 던진다.
            타일 캐시 그룹이 없을 때만 캐시 그룹을 만든다.
            요청 실패와 중단에는 콜백을 연결하지 않으므로 실패해도 로딩 수와 promise 상태가 바뀌지 않는다. [확인 Q-004]

        의존:
            U3dQuadTile — 타일 영역, 레벨과 draw argument 조회; 속성 읽기: {_rectangle, _rlevel, _drawArg}; 함수: {URectangle.centerMap()}
            UMathEngine — 타일 중심을 최소 레벨의 타일 인덱스로 환산; 정적 함수: {getGoogleToIndexXY()}
            defined — draw argument와 cql 존재 여부 판정; 함수: {defined()}
            deferred — 처리 완료를 알릴 promise 생성; 함수: {deferred()}
            U3dLayer — 타일 상태 변경, 캐시 조회와 로딩 수 증가; 함수: {setStateTile(), getCache(), plusLoadingTile()}
            U3dModelLayer — 타일 캐시 그룹 생성; 함수: {createGroup()}
            UDEF — 타일 상태 상수 사용; 상수: {TILE_STATE._loading}
            UFileLoader — GetFeature 요청 전송; 함수: {load()}

        동작:
            draw argument가 없으면 오류를 던진다.
            타일 중심으로 타일 키와 레벨을 계산하지만 이후 요청과 상태 판정에는 사용하지 않는다.
            타일 상태를 로딩으로 바꾸고 타일 사각형으로 BBOX 요청 URL을 만든다.
            타일 캐시 그룹이 없으면 만들고 로딩 수를 늘린다.
            요청을 보내고 응답이 오면 편집 버퍼 갱신으로 넘긴다.
            편집 버퍼 갱신 결과를 알릴 promise를 반환한다.

    getSLD(baseurl: string) -> void
        역할: SLD 스타일 파일을 읽어 규칙 목록과 규칙별 CQL 파서를 준비하고 이미 만든 모델의 스타일을 다시 적용한다.

        인터페이스:
            baseurl은 프록시 접두가 이미 붙은 SLD 파일 URL이다.
            반환 시점에는 요청만 시작한 상태이며 규칙 준비 완료는 응답 콜백에서 확정한다.

        처리 기준:
            응답 코드가 200이면 규칙을 저장하고 준비 완료로 표시하며, 404이면 규칙 없이 준비 완료로만 표시한다.
            그 밖의 응답 코드와 전송 실패에는 준비 상태를 바꾸지 않으므로 모델 생성이 계속 보류된다. [확인 Q-045]
            규칙의 filter 문자열이 정의되어 있고 빈 문자열이 아닐 때만 CQL 파서를 만들어 규칙에 붙인다.

        의존:
            Web API — SLD XML 요청과 응답 문서 조회; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send()}; 속성 읽기: {status, responseXML}; 콜백: {onload}
            SLDParser — SLD XML을 규칙 목록으로 변환; 정적 함수: {parse()}
            CQLParser — 규칙 filter 문자열 파싱; 생성자: {new CQLParser()}; 함수: {parse()}

        동작:
            XML 응답 형식으로 요청을 준비하고 전송한다.
            응답이 200이면 SLD 문서를 규칙 목록으로 파싱하여 저장하고 준비 완료로 표시한다.
            filter가 있는 규칙마다 CQL 파서를 만들어 규칙에 붙인다.
            저장한 규칙으로 이미 만들어진 모델의 스타일을 다시 적용한다.

            응답이 404이면 규칙 없이 준비 완료로만 표시한다.
            200·404가 아닌 응답이나 전송 실패에는 별도 처리가 없어 준비 미완료 상태가 유지된다. [확인 Q-045]

    setFloorHeight(floorHeight: number) -> void
        역할: 한 층 높이를 바꾸고 이 값으로 계산한 모델 높이를 다시 만들도록 레이어를 갱신한다.

        의존: U3dLayer — 레이어 모델 재생성; 함수: {refresh()}

        동작:
            새 한 층 높이를 저장한다.
            층 수 기반 높이 계산 결과가 달라지므로 레이어를 갱신하여 모델을 다시 만들게 한다.

    setHighlight() -> void
        역할: 이후 생성할 모델의 기본 색상을 강조 색으로 바꾼다.

        동작: 기본 색상 상태에 0xfff0000을 저장한다. 이후 Three.js 재질 색상으로 변환할 때 하위 24bit인 0xff0000으로 해석된다.

    setBuildingSn(name: string | number) -> void
        동작: 건물 일련번호 상태에 입력값을 저장한다.

    getBuildingSn() -> string | number | void
        인터페이스: 반환: 저장된 건물 일련번호이며 저장값이 없으면 undefined
        의존: defined — 저장값 존재 여부 판정; 함수: {defined()}
        동작: 저장값이 있으면 건물 일련번호를 반환한다.

    updateStyle(styleFunction?: U3dModelWFSLayerFeatureStyleFn) -> void
        역할: 사용자 스타일 콜백을 교체하고 이미 만들어진 모든 WFS mesh의 스타일을 다시 계산한다.

        인터페이스: styleFunction을 넘기면 저장한 사용자 스타일 콜백을 교체하고, 생략하면 현재 콜백을 그대로 사용한다.

        처리 기준: 순회 대상은 WFS mesh로 한정하므로 구 형태 point mesh를 제외한 점 mesh는 스타일 갱신 대상이 아니다.

        의존:
            defined — 입력 스타일 콜백 존재 여부 판정; 함수: {defined()}
            U3dLayer — 레이어 렌더 그룹 조회; 속성 읽기: {_group}
            THREE — 렌더 그룹 하위 객체 순회; 함수: {Object3D.traverse()}
            UWfsMesh — 스타일 적용 대상 mesh 판정; 생성자: {UWfsMesh}

        동작:
            입력 스타일 콜백이 있으면 저장한다.
            렌더 그룹의 WFS mesh마다 스타일을 다시 계산하여 적용한다.

    updateLabel(labelFunction?: U3dModelWFSLayerLabelFn) -> void
        역할: 사용자 라벨 콜백을 교체하고 이미 만들어진 WFS mesh마다 라벨 적용을 다시 시도한 뒤 기존 라벨 위치를 갱신한다.

        인터페이스: labelFunction을 넘기면 저장한 사용자 라벨 콜백을 교체하고, 생략하면 현재 콜백을 그대로 사용한다.

        의존:
            defined — 입력 라벨 콜백 존재 여부 판정; 함수: {defined()}
            U3dLayer — 레이어 렌더 그룹과 app 참조 조회; 속성 읽기: {_group, _app}
            THREE — 렌더 그룹 하위 객체 순회; 함수: {Object3D.traverse()}
            UWfsMesh — 라벨 적용 대상 mesh 판정; 생성자: {UWfsMesh}
            U3dApp — 라벨 위치 갱신 인자로 넘길 카메라와 카메라 상대 높이 조회; 속성 읽기: {_camera}; 함수: {getCameraRelativeHeight()}

        동작:
            입력 라벨 콜백이 있으면 저장한다.
            렌더 그룹의 WFS mesh마다 현재 라벨 옵션을 적용하고, 그 뒤 mesh에 남아 있는 라벨 위치를 현재 경계 상자 중심으로 옮긴다. 라벨 옵션의 visible이 false이면 기존 라벨을 제거하거나 숨기지 않고, 새 옵션에 zOffset이 없으면 이전 보정값이 위치 갱신에 다시 쓰일 수 있다. [확인 Q-027] [확인 Q-044]

makeTileName(x: number, y: number, level: number) -> string
    역할: 타일 인덱스와 레벨을 타일 키 문자열로 만든다.
    인터페이스: 반환: 밑줄로 연결한 `x_y_level` 형식의 키
    동작: x, y와 level을 밑줄로 연결하여 반환한다.

onAfterWork(self: U3dModelWFSLayer, mesh: U3dModelWFSLayerMesh) -> void
    역할: 생성한 mesh의 밑면을 지형 높이에 맞추고 이후 지형 변화에 따라 자동으로 갱신되도록 등록한 뒤 이 단계의 완료를 mesh 로드 이벤트로 알린다.

    인터페이스: self는 대상 레이어이며 module 함수를 레이어를 수신 객체로 지정해 호출하지만 본문은 `this`를 사용하지 않는다.

    처리 기준:
        mesh 또는 draw argument가 없으면 아무 것도 하지 않는다.
        지형을 사용하지 않거나 사용자 높이 콜백이 있으면 지형 높이와 자동 갱신 등록을 적용하지 않고 로드 이벤트만 알린다.
        지형 높이를 구할 수 없거나 무효값·데이터 없음 값이면 0을 사용한다.
        높이 보정값은 mesh 밑면 위도에서 구한 렌더 좌표 배율로 한 번만 환산하여 mesh에 보관하고 이후 자동 갱신에서 재사용한다.
        자동 높이 갱신 콜백은 mesh보다 오래 유지되므로 mesh 제거 시 `deleteMesh()`에서 등록을 해제해야 한다.
        `MESH.LOADED`는 이 함수의 높이 처리가 끝난 시점에 발생하며 호출 파싱 함수에 남은 후속 처리와 타일 캐시 그룹 연결 완료보다 앞설 수 있다. [확인 Q-040]

    의존:
        U3dLayer — draw argument와 app 참조 조회; 속성 읽기: {_drawArg, _app}
        UDrawArg — 지점의 렌더 높이 조회; 함수: {getRenderHeightAtPoint()}
        defined — 지형 높이 유효성 판정; 함수: {defined()}
        UDEF — 무효 높이와 지형 데이터 없음 값 비교; 상수: {INVALID, TERRAIN_NO_DATA}
        UMathEngine — 미터 값을 렌더 좌표 배율로 환산; 정적 함수: {getRealScaleAtGoogle()}
        THREE — mesh 위치와 mesh·geometry 사용자 데이터 갱신; 속성 읽기·쓰기: {Object3D.position, Object3D.userData, BufferGeometry.userData}
        U3dApp — 지형 변화 시 높이를 다시 반영할 콜백 등록; 함수: {addAutoHeightUpdate()}
        UEventDispatcher — mesh 로드 이벤트 알림; 함수: {dispatchEvent()}
        U3dEvent — mesh 로드 이벤트 종류; 상수: {MESH.LOADED}

    동작:
        mesh 또는 draw argument가 없으면 종료한다.
        지형을 사용하고 사용자 높이 콜백이 없는 경우에만 mesh 밑면 지점의 렌더 높이를 구하고, 값을 얻지 못하면 0으로 대체하여 mesh 높이에 넣는다.
        높이 보정값이 있으면 렌더 좌표 배율로 환산한 값을 mesh에 보관하고 높이에 더한다.
        바뀐 높이에 맞추어 라벨 위치를 옮긴다.
        지형 높이가 바뀔 때 mesh 높이는 항상 다시 맞추지만 geometry 중심 높이는 기존 center.z가 truthy일 때만 바꾸고, 라벨 위치를 갱신하는 콜백을 자동 높이 갱신에 등록한다. center.z가 0이면 새 높이가 geometry 중심에 반영되지 않는다. [확인 Q-051]

        높이 처리와 자동 갱신 등록 뒤 mesh 로드 이벤트를 알린다.

createMesh(self: U3dModelWFSLayer, geometry: ModelBufferGeometry, material: ModelMaterial | Array<ModelMaterial>, centroid?: THREE.Vector3, feature?: U3dModelWFSLayerFeature, tile?: U3dQuadTile, type?: string) -> U3dModelWFSLayerMesh
    역할: 기하와 재질로 WFS mesh를 만들고 표현 값, 충돌 가속 구조와 feature 속성을 붙인다.

    인터페이스:
        type이 'point'이면 점 mesh를, 그 외에는 일반 WFS mesh를 만들고 centroid가 있으면 mesh 위치로 복사한다.
        반환: 생성한 mesh이며 소유권은 호출자가 타일 캐시 그룹에 넣어 가져간다.

    처리 기준: 경계 판정 방식이 트리이고 아직 구조가 없을 때만 기하의 충돌 가속 구조를 계산한다.

    의존:
        UWfsPointMesh — 점 mesh 생성; 생성자: {new UWfsPointMesh()}
        UWfsMesh — 일반 WFS mesh 생성과 표현 값 설정; 생성자: {new UWfsMesh()}; 속성 쓰기: {brightness, contrast}
        defined — 종류와 중심 좌표 존재 여부 판정; 함수: {defined()}
        THREE — mesh 위치 복사, 충돌 가속 구조 계산과 경계 상자 헬퍼 생성·추가; 함수: {Object3D.position.copy(), BufferGeometry.computeBoundsTree(), Object3D.add()}; 생성자: {new BoxHelper()}; 속성 읽기: {BufferGeometry.boundsTree}; 속성 쓰기: {Object3D.visible}
        UDEF — 경계 판정 방식 비교; 상수: {BOUNDING_METHOD, BOUNDING_TYPE.TREE}

    동작:
        종류가 'point'이면 점 mesh를, 아니면 일반 WFS mesh를 만들고 중심 좌표가 있으면 위치로 복사한다.
        현재 레이어의 밝기와 대비를 mesh에 적용한다.
        경계 판정 방식이 트리이고 아직 구조가 없으면 충돌 가속 구조를 계산한다.
        feature와 타일 정보를 mesh 속성으로 붙인다.
        경계 상자 헬퍼 사용 설정이면 헬퍼를 만들어 mesh에 추가하고 mesh를 반환한다.

setPropertyByMesh(self: U3dModelWFSLayer, mesh: U3dModelWFSLayerMesh, feature: U3dModelWFSLayerFeature, tile: U3dQuadTile, type?: string) -> void
    역할: 이후 파싱·스타일·라벨·선택 경로가 사용하는 타일, 밑면 좌표와 feature 속성을 mesh에 연결한다.

    처리 기준:
        종류가 'point'이고 position attribute가 있으면 첫 정점 좌표를 새 벡터로 만들어 밑면 좌표로 삼고, 그 외에는 mesh 위치 객체를 그대로 밑면 좌표로 참조한다.
        레이어 애니메이션 설정이 켜져 있으면 mesh 투명도 애니메이션을 0.3에서 0.8 범위로 시작한다.

    의존:
        defined — 종류 존재 여부 판정; 함수: {defined()}
        THREE — 첫 정점 좌표로 밑면 벡터 생성과 mesh 사용자 데이터 기록; 생성자: {new Vector3()}; 속성 읽기: {BufferGeometry.attributes}; 속성 쓰기: {Object3D.userData}
        U3dLayer — 레이어 애니메이션 설정 조회; 속성 읽기: {_animation}
        UMesh — mesh 투명도 애니메이션 시작; 함수: {animationOpacity()}

    동작:
        mesh에 소속 타일을 연결한다.
        종류가 'point'이면 기하 첫 정점을, 아니면 mesh 위치를 밑면 좌표로 저장한다.
        `_fieldPk`로 선택한 모델 식별자와 별개로 feature의 gid를 사용자 데이터 식별자로 넣고 feature, 속성과 레이어 이름을 mesh에 연결한다. [확인 Q-038]
        애니메이션 설정이면 투명도 애니메이션을 시작한다.

parseFeature(option: {self: U3dModelWFSLayer, key: string, buffer: Record<string, any>, tile: U3dQuadTile, features: U3dModelWFSLayerFeature | Array<U3dModelWFSLayerFeature>}) -> Promise<unknown> | undefined
    역할: 타일 작업 하나가 맡은 feature 묶음을 기하 종류별 파싱으로 나누어 실행하고 남은 처리 수를 줄인다.

    인터페이스:
        option은 레이어, 타일 키, 남은 처리 수 버퍼, 타일과 이번 작업이 맡은 feature 묶음을 전달한다.
        작업 큐가 등록 시 지정한 레이어를 수신 객체로 지정해 호출하므로 `this`는 해당 레이어이지만 본문은 `this`를 사용하지 않는다.
        반환: 묶음 전체 처리 종결을 알리는 promise이며 버퍼가 이미 정리되었으면 undefined

    처리 기준:
        버퍼 또는 이 타일 키의 항목이 없으면 배열 정규화와 feature 처리를 시작하지 않는다.
        타일 캐시 그룹이 없으면 해당 feature를 실패로 끝낸다.
        식별자는 지정한 id 필드값이 참일 때 그 값을, 아니면 feature id를 사용한다. 값이 0 또는 빈 문자열이면 feature id로 대체된다. [확인 Q-038]
        이미 생성한 식별자는 편집 대기 항목으로 확인되지 않는 한 다시 만들지 않는다.
        feature 하나의 처리 실패는 오류만 기록하고 나머지 처리를 계속한다.
        반환 promise는 묶음의 모든 feature 처리가 종결된 시점을 알리며 그 안에서 만든 mesh의 렌더 반영까지 보장하지 않는다.

    의존:
        defined — 버퍼, 캐시 그룹, 속성, 편집 버퍼와 이미 생성한 식별자 존재 여부 판정; 함수: {defined()}
        UDEF — feature별 비동기 처리 promise 생성; 정적 함수: {createPromise()}
        U3dLayer — 타일 키의 캐시 그룹과 편집 작업 버퍼 조회; 함수: {getCacheByKey()}; 속성 읽기: {_editWorkBuffer}
        U3dModelLayer — 편집 이벤트 목록 조회; 속성 읽기: {editedEvent}
        Console API — feature 처리 오류 기록; 함수: {console.error()}

    동작:
        버퍼나 이 타일 키의 항목이 없으면 종료한다.
        feature가 배열이 아니면 option의 목록만 배열로 바꾸고 실제 순회에 쓰는 지역 값은 바꾸지 않는다. parseModel 경로에서는 앞서 기록한 버퍼 값도 undefined이므로 이 단계 전에 종료한다. [확인 Q-003]
        각 feature마다 타일 캐시 그룹을 확인하고 없으면 그 feature를 실패로 끝낸다.
        속성에서 식별자를 정하고 편집 대기 항목이 아니면서 이미 생성한 식별자이면 건너뛴다.
        레이어의 출력 형태 상태를 좌표 종류 인수로 만들어 각 파싱 경로에 넘기지만 어느 경로도 이 값을 읽지 않는다. [확인 Q-007]
        기하 종류가 Point·PointZ이면 점 파싱, LineString·MultiLineString이면 선 파싱, Polygon·MultiPolygon이면 면 파싱으로 넘긴다.

        MultiPolygonZM이면 해당 feature를 실패로 끝내지만, 그 밖의 미지원 geometry는 파서를 호출하지 않은 채 성공으로 끝낸다. [확인 Q-048]
        feature 하나가 끝날 때마다 남은 처리 수를 하나 줄이고, 묶음을 모두 끝내면 종결을 알린다.
        남은 처리 수가 0 이하이면 이 타일 키의 버퍼 항목을 지운다.

createEdgeLine(mesh: U3dModelWFSLayerMesh, opt?: Record<string, any>) -> void
    역할: mesh 기하의 외곽선을 선 객체로 만들어 자식으로 붙인다.

    인터페이스: opt의 color는 생략하면 0x323232, linewidth는 생략하면 1을 사용한다.

    처리 기준: 만든 선 객체는 mesh의 자식이 되므로 mesh와 함께 처분된다.

    의존:
        defaultValue — 외곽선 색과 굵기 기본값 적용; 함수: {defaultValue()}
        THREE — 외곽선 기하와 선 재질·선 객체 생성 후 mesh에 추가; 생성자: {new EdgesGeometry(), new LineSegments(), new LineBasicMaterial()}; 함수: {Object3D.add()}

    동작:
        mesh 기하에서 외곽선 기하를 만든다.
        지정한 색과 굵기의 선 재질로 선 객체를 만들어 mesh의 자식으로 추가한다.

createMaterial(self: U3dModelWFSLayer, opt?: Record<string, any>) -> ModelMaterial
    역할: 레이어 재질 종류와 스타일 입력으로 모델 재질 하나를 만든다.

    인터페이스:
        opt의 side, transparent, opacity와 color는 생략하면 레이어 현재 값을 사용한다. color는 Three.js 색상 생성자가 처리하는 문자열도 받을 수 있지만 공개 생성 옵션 타입은 number만 선언한다. [확인 Q-019]
        opt의 map을 넘기면 텍스처를 재질에 연결하고 premultipliedAlpha를 넘기면 그대로 반영한다.
        반환: 생성한 재질이며 해제 책임은 호출자에게 있다.

    처리 기준:
        재질 종류가 'toon'이면 Toon, 'standard'이면 Standard, 그 외에는 Phong 재질을 만든다.
        Standard 재질은 금속성을 0으로 고정한다.
        재질 생성자에는 면 방향만 넘기고 나머지 표현 값은 생성 뒤에 덮어쓴다.

    의존:
        defaultValue — 면 방향, 투명도, 불투명도와 색상 기본값 적용; 함수: {defaultValue()}
        defined — 선택 입력 존재 여부 판정; 함수: {defined()}
        THREE — 재질과 색상 생성 및 표현 속성 설정; 생성자: {new MeshToonMaterial(), new MeshStandardMaterial(), new MeshPhongMaterial(), new Color()}; 속성 쓰기: {Material.premultipliedAlpha, Material.transparent, Material.opacity, Material.color, Material.map, MeshStandardMaterial.metalness}; 상수: {FrontSide}
        U3dLayer — 레이어 투명도와 불투명도 기본값 조회; 속성 읽기: {_transparent, _opacity}
        U3dModelLayer — 모델 레이어 공통 재질 설정 적용; 함수: {settingModelLayerMaterial()}

    동작:
        면 방향, 투명도, 불투명도와 색상의 기본값을 레이어 현재 값으로 채운다.
        재질 종류에 맞는 재질을 만들고 모델 레이어 공통 설정을 적용하며 Standard 재질이면 금속성을 0으로 만든다.
        premultipliedAlpha, 색상, 투명도, 불투명도와 텍스처 입력을 재질에 반영하고 재질을 반환한다.

getFieldHeight(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature) -> number | undefined
    역할: 높이 필드가 지정된 경우에만 feature 속성에서 건물 높이를 읽어 유효한 값으로 보정한다.

    인터페이스: 반환: 보정한 높이(m)이며 높이 필드를 지정하지 않았거나 속성값이 참이 아니면 undefined

    처리 기준:
        속성값이 `0`, 빈 문자열이나 없음이면 기본 높이로 대체하지 않고 undefined를 반환한다.
        숫자로 바꾼 값이 0 이하이거나 숫자가 아니면 기본 높이를 사용한다.

    의존: defined — 높이 필드 지정 여부 판정; 함수: {defined()}

    동작:
        높이 필드를 지정하지 않았으면 undefined를 반환한다.
        대소문자를 무시하고 속성값을 찾고 참이 아니면 undefined를 반환한다.
        속성값을 숫자로 바꾸고 0 이하이면 기본 높이로 대체하여 반환한다.

getFieldFloor(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature) -> number | undefined
    역할: 층 수 필드가 지정된 경우에만 feature 속성에서 층 수를 읽어 1 이상으로 보정한다.

    인터페이스: 반환: 보정한 층 수이며 층 수 필드를 지정하지 않았거나 속성값이 참이 아니면 undefined

    처리 기준: 속성값이 `0`, 빈 문자열이나 없음이면 1로 보정하지 않고 undefined를 반환한다.

    의존: defined — 층 수 필드 지정 여부 판정; 함수: {defined()}

    동작:
        층 수 필드를 지정하지 않았으면 undefined를 반환한다.
        대소문자를 무시하고 속성값을 찾고 참이 아니면 undefined를 반환한다.
        문자열로 바꾼 뒤 정수로 해석하고 1보다 작거나 숫자가 아니면 1로 보정하여 반환한다.

getHeightPerFloor(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature) -> number
    역할: 한 층당 높이를 레이어 설정과 feature 속성에서 정한다.

    인터페이스: 반환: 1 이상으로 보정한 한 층당 높이(m)

    처리 기준:
        레이어 층 높이가 참이고 0보다 크면 그 값을, 아니면 3을 기준값으로 쓴다.
        한 층당 높이 필드명이 참이면 속성값의 정수 변환 결과로 기준값을 무조건 대체하므로 속성이 없으면 뒤이어 1로 보정된다.

    동작:
        레이어 층 높이가 유효하면 그 값을, 아니면 3을 기준값으로 정한다.
        한 층당 높이 필드명이 있으면 대소문자를 무시하고 속성값을 찾아 정수로 바꾼 값으로 기준값을 대체한다.
        기준값이 1보다 작거나 숫자가 아니면 1로 보정하여 반환한다.

createPolygonGeometry(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature, coodinates: Array<THREE.Vector3>, center: THREE.Vector3, googleScale: number, coordType: string, setTextureStyle: boolean = false) -> THREE.BufferGeometry | void
    역할: 폴리곤 좌표를 중심 기준 shape로 만들고 결정한 높이만큼 돌출한 건물 기하를 만든다.

    인터페이스:
        coodinates는 중심을 빼서 지역 좌표로 바꿀 월드 좌표 목록이고 googleScale은 미터 값을 렌더 좌표로 바꾸는 배율이다.
        coordType이 '2d'이면 평면 shape와 평면 돌출을, 그 외에는 3D shape와 3D 돌출을 사용한다.
        setTextureStyle이 true이면 텍스처 반복을 위해 외곽선을 8 단위로 보간하고 층 수만큼 돌출 단계를 나누며 재질 그룹을 남긴다.
        반환: 생성한 기하이며 shape를 만들지 못했거나 정점이 부족하면 undefined

    처리 기준:
        돌출 높이는 사용자 깊이 콜백이 있으면 그 결과를, 없으면 높이 필드값을 쓴다.
        높이가 참이 아니면 층 수가 있을 때 한 층당 높이와 층 수의 곱을, 없으면 기본 높이를 사용한다.
        정점이 1개 이하로 만들어지면 기하를 해제하고 반환하지 않는다.
        텍스처 스타일이 아니면 재질 그룹을 비워 단일 재질로 그린다.

    의존:
        defined — shape와 사용자 깊이 콜백 존재 여부 판정; 함수: {defined()}
        UExtrudeGeometry — 평면 shape 돌출 기하 생성; 생성자: {new UExtrudeGeometry()}
        UExtrudeGeometryEx — 3D shape 돌출 기하 생성; 생성자: {new UExtrudeGeometryEx()}
        THREE — 정점 수 확인, 기하 해제와 경계 상자 계산; 함수: {BufferGeometry.dispose(), BufferGeometry.computeBoundingBox()}; 속성 읽기: {BufferGeometry.attributes}; 속성 쓰기: {BufferGeometry.groups}

    동작:
        텍스처 스타일 여부로 외곽선 보간 간격을 정하고 좌표 종류에 맞는 shape를 만든다.
        층 수 필드값을 구한다.
        사용자 깊이 콜백이 있으면 레이어를 수신 객체로 지정해 호출한 결과를, 없으면 높이 필드값을 돌출 높이로 정한다.
        높이가 참이 아니면 층 수가 있을 때 한 층당 높이와 층 수의 곱을, 없으면 기본 높이를 사용한다.
        shape가 있으면 돌출 높이를 렌더 좌표 배율로 환산하고 텍스처 스타일과 층 수에 따라 돌출 단계를 정해 기하를 만든다.
        정점이 1개 이하이면 기하를 해제하고 반환하지 않는다.
        경계 상자를 계산하고 텍스처 스타일이 아니면 재질 그룹을 비운 뒤 기하를 반환한다.

updateLabel(mesh: U3dModelWFSLayerMesh, camera?: THREE.Camera, height?: number) -> void
    역할: mesh에 붙은 POI 라벨을 현재 경계 상자 중심으로 옮긴다.

    인터페이스: camera와 height는 선언되어 있으나 현재 구현에서 사용하지 않는다.

    처리 기준: Mesh가 아니거나 라벨이 없으면 아무 것도 하지 않는다.

    의존:
        defined — 라벨과 라벨 높이 보정값 존재 여부 판정; 함수: {defined()}
        THREE — mesh 종류 판정과 중심 벡터 생성; 생성자: {Mesh, new Vector3()}; 속성 읽기: {Object3D.userData}
        UMesh — mesh 경계 상자 조회; 함수: {getBBox()}
        U3dPOI — 라벨 위치 설정; 함수: {setPosition()}

    동작:
        Mesh가 아니거나 라벨이 없으면 종료한다.
        mesh 경계 상자 중심을 구하고 라벨 높이 보정값이 있으면 더한다. 새 라벨 생성에서 보정값이 생략되어도 이전 저장값이 남아 있으면 다시 적용된다. [확인 Q-044]
        계산한 위치를 라벨 위치로 설정한다.

parseModel(self: U3dModelWFSLayer, json: U3dModelWFSLayerServiceJson, tile: U3dQuadTile, drawArg: UDrawArg, promise: DeferredObject<boolean>) -> Promise<boolean> | void
    역할: GetFeature 응답을 4개 단위 작업으로 나누어 타일 작업 큐에 등록하고 타일 상태를 종료로 확정한다.

    인터페이스:
        drawArg는 선언되어 있으나 현재 구현에서 사용하지 않는다.
        promise는 createModel의 호출자에게 작업 등록 성공 여부를 알리는 완료 대상이며 mesh 생성 완료를 알리지 않는다.

    처리 기준:
        응답, 타일 캐시 그룹 또는 타일 mesh 상태가 유효하지 않으면 타일 상태를 종료로 바꾸고 false로 완료한다.
        응답에 features가 없으면 타일 상태를 종료로 바꾸고 false로 완료한다.
        작업 버퍼에는 `features.length`를 기록하므로 배열이면 남은 feature 수(number), 비배열이면 undefined, 빈 배열이면 0이 저장된다. 편집 응답 경로는 같은 버퍼에 feature 배열을 저장한다. [확인 Q-003] [확인 Q-005] [확인 Q-028]
        등록한 작업은 실행 직전 필터에서 타일 처분 여부를 다시 확인하여 처분된 타일의 작업을 건너뛴다.
        타일 상태 종료와 promise 완료는 작업 등록 직후에 확정하므로 이후 mesh 생성은 이 완료 밖에서 진행된다.
        빈 배열에는 파싱 작업을 만들지 않아 값 0인 작업 버퍼 항목이 남는다. [확인 Q-028]

    의존:
        U3dLayer — 로딩 수 감소, 캐시·타일 키 조회, 타일 상태 변경과 작업 버퍼 기록; 함수: {minusLoadingTile(), getCache(), createKeyByTile(), setStateTile()}; 속성 쓰기: {_workBuffer}
        U3dModelLayer — 타일 처분 여부 판정과 작업 등록; 함수: {isTileMeshDisposed(), isTileDisposed(), addWork()}
        defined — 응답과 캐시 그룹 존재 여부 판정; 함수: {defined()}
        UDEF — 타일 상태와 작업 메시지 상수 사용; 상수: {TILE_STATE._end, _MSG_WORK._UPDATE_MESH_BUILDING}
        U3dQuadTileWork — feature 묶음 파싱 작업 생성; 생성자: {new U3dQuadTileWork()}

    동작:
        로딩 수를 줄이고 응답, 캐시 그룹과 타일 mesh 상태를 검사하여 유효하지 않으면 타일 상태를 종료로 바꾸고 false로 완료한다.
        타일 키를 만들고 `features.length`를 작업 버퍼에 기록한다.
        features가 배열이면 4개씩 묶어 파싱 작업을 만들고 마지막 묶음까지 큐에 등록한다.
        features가 배열이 아니면 작업 버퍼에 undefined를 남기고 하나의 파싱 작업을 등록한다. 등록된 작업은 버퍼 항목이 없다고 판정해 즉시 종료한다. [확인 Q-003]

        features가 빈 배열이면 파싱 작업을 등록하지 않고 값 0인 작업 버퍼 항목을 남긴다. [확인 Q-028]
        타일 상태를 종료로 바꾸고 작업 등록 성공을 true로 완료한다.

parseEditModel(self: U3dModelWFSLayer, json: U3dModelWFSLayerServiceJson, tile: U3dQuadTile, mesh: U3dModelWFSLayerMesh, drawArg: UDrawArg, promise: DeferredObject<boolean>) -> Promise<boolean> | void
    역할: 편집한 mesh의 feature가 서버 응답에 남아 있는지에 따라 편집 대기 버퍼와 작업 버퍼를 갱신한다.

    인터페이스:
        drawArg는 선언되어 있으나 현재 구현에서 사용하지 않는다.
        promise는 addEditModel의 호출자에게 편집 버퍼 갱신 성공 여부를 알리는 완료 대상이다.

        처리 기준:
            응답에 features가 없으면 타일 상태를 종료로 바꾸고 false로 완료한다.
            모든 타일 키의 편집 대기 버퍼에서 이 mesh의 feature와 같은 항목을 지우고 비게 된 항목은 버퍼에서 제거한다.
            응답 feature가 있으면 작업 버퍼에 배열을 저장하지만 이를 처리할 새 작업은 등록하지 않는다. 이후 같은 타일의 `createModel()`은 작업 버퍼가 존재한다는 이유로 새 요청을 시작하지 않고 로딩 수와 타일 상태를 복구하지 않은 채 종료한다. [확인 Q-005] [확인 Q-050]

    의존:
        U3dLayer — 로딩 수 감소, 타일 키 조회, 타일 상태 변경과 작업·편집 버퍼 갱신; 함수: {minusLoadingTile(), createKeyByTile(), setStateTile()}; 속성 읽기·쓰기·삭제: {_workBuffer, _editWorkBuffer}
        defined — 응답과 편집 feature 존재 여부 판정; 함수: {defined()}
        UDEF — 타일 상태 상수 사용; 상수: {TILE_STATE._end}

    동작:
        로딩 수를 줄이고 응답에 features가 없으면 타일 상태를 종료로 바꾼 뒤 false로 완료한다.
        모든 편집 대기 버퍼에서 이 mesh의 feature와 같은 항목을 제거하고 비게 된 버퍼 항목을 지운다.
        응답 feature가 있으면 이 타일 키의 작업 버퍼에 응답 배열만 넣고 파싱 작업은 등록하지 않는다. [확인 Q-050]
        응답 feature가 없으면 편집 mesh의 feature 복사본을 이 타일 키의 편집 대기 버퍼에 추가한다.
        타일 상태를 종료로 바꾸고 true로 완료한다.

lerpVector(array: Array<THREE.Vector3>, vec1: THREE.Vector3, vec2: THREE.Vector3, maxDist: number = 8) -> void
    역할: 두 점 사이를 `거리 / maxDist`의 반올림 구간 수로 나눈 보간 점들을 결과 배열에 덧붙인다.

    인터페이스:
        array는 보간 결과를 누적할 배열이고 maxDist는 구간 수 계산에 사용하는 기준 간격이다.
        vec1에 거리 계산 함수가 없으면 좌표만 읽어 새 벡터로 다시 만든다.

    처리 기준:
        두 점 거리가 maxDist 이하이면 끝점만 추가한다.
        시작점은 추가하지 않으므로 호출자가 첫 점을 따로 넣어야 한다.
        거리가 maxDist보다 크면 반올림한 구간 수를 사용하므로 실제 간격이 maxDist를 초과할 수 있다. [확인 Q-014]
        maxDist가 0 이하인 입력을 방어하지 않는다. [확인 Q-015]

    의존: THREE — 거리 계산과 보간 점 생성; 생성자: {new Vector3()}; 함수: {Vector3.distanceTo(), Vector3.lerpVectors()}

    동작:
        시작점에 거리 계산 함수가 없으면 좌표로 새 벡터를 만든다.
        두 점 거리가 maxDist 이하이면 끝점만 추가하고 종료한다.
        그 밖에는 `거리 / maxDist`를 반올림한 수만큼 구간을 나누어 각 보간 점을 순서대로 추가하며 실제 간격이 maxDist를 초과할 수 있다. [확인 Q-014]
        maxDist가 0이면 무한대 구간 수로 반복이 끝나지 않을 수 있고, 음수이면 보간점과 끝점을 추가하지 않는다. [확인 Q-015]

buildShape(aryOrigin: Array<THREE.Vector3>, center: THREE.Vector3, maxSegment: number = 8) -> THREE.Shape | undefined
    역할: 월드 좌표 목록을 중심 기준 지역 좌표의 평면 shape로 만든다.

    인터페이스:
        maxSegment가 0이면 원본 좌표를 그대로 쓰고, 0보다 크면 연속한 두 점 사이를 그 간격으로 보간한다.
        반환: 만든 평면 shape이며 점이 1개 이하이면 undefined

    처리 기준: 보간 경로는 첫 점을 결과에 넣지 않으므로 원본 첫 점이 shape 시작점에서 빠진다.

    의존: THREE — 평면 shape 생성과 경로 구성; 생성자: {new Shape()}; 함수: {Shape.moveTo(), Shape.lineTo()}

    동작:
        보간 간격이 0이면 원본 좌표를 사용하고, 아니면 연속한 두 점 사이를 보간하여 좌표 목록을 만든다.
        점이 1개 이하이면 undefined를 반환한다.
        첫 점에서 시작해 나머지 점을 중심 기준 지역 좌표로 이어 shape를 만들고 반환한다.

buildShape3D(aryOrigin: Array<THREE.Vector3>, center: THREE.Vector3) -> UShape3D | undefined
    역할: 월드 좌표 목록을 중심 기준 지역 좌표의 3D shape로 만든다.

    인터페이스: 반환: 만든 3D shape이며 점이 1개 이하이면 undefined

    의존: UShape3D — 3D shape 생성과 경로 구성; 생성자: {new UShape3D()}; 함수: {moveTo(), lineTo()}

    동작:
        점이 1개 이하이면 undefined를 반환한다.
        첫 점에서 시작해 나머지 점을 중심 기준 지역 좌표로 이어 z까지 포함한 shape를 만들고 반환한다.

parsePoint(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature, coordType: string, tile: U3dQuadTile, id: string | number, key: string, groupWFS: UGroup) -> void
    역할: Point 계열 feature를 구 mesh로 만들어 스타일·라벨·지형 높이를 적용하고 타일 그룹에 넣는다.

    인터페이스:
        coordType은 전달받지만 현재 구현에서 사용하지 않는다. [확인 Q-007]
        groupWFS는 타일 캐시에 생성한 UGroup이지만 source JSDoc은 U3dModelWFSLayerMesh로 선언한다. [확인 Q-016]

    처리 기준:
        구 사용 여부가 코드에 true로 고정되어 있어 항상 반지름 1, 가로 4·세로 2 분할의 구 기하와 기본 재질을 사용하며 점 mesh 경로는 실행되지 않는다.
        z 좌표가 없으면 0으로 본다.
        사용자 높이 콜백이 있으면 레이어를 수신 객체로 지정해 호출하고 그 값을 렌더 좌표 배율로 환산하여 밑면 높이로 사용한다.
        높이 보정값이 참이면 환산 값을 mesh에 보관하고 높이에 더한다.
        모델 중복 판정과 타일별 기록에는 `_fieldPk`로 선택한 식별자를 사용하지만 삭제 필터에는 feature의 gid를 사용한다. 두 값이 다르거나 `_fieldPk` 값이 0·빈 문자열이면 식별자 기준이 일치하지 않는다. [확인 Q-038]

    의존:
        UGPoint — 좌표를 렌더 좌표 벡터로 표현; 생성자: {new UGPoint()}
        THREE — 구 기하와 기본 재질 생성, mesh 위치·렌더 순서·가시성 설정과 높이 보정값 보관; 생성자: {new SphereGeometry(), new MeshBasicMaterial()}; 속성 쓰기: {Object3D.renderOrder, Object3D.visible, Object3D.position}; 속성 읽기·쓰기: {Object3D.userData}
        U3dLayer — 레이어 렌더 순서 조회; 속성 읽기: {_renderOrder}
        U3dModelLayer — 삭제 필터 판정; 함수: {removeFilter()}
        UMathEngine — 미터 값을 렌더 좌표 배율로 환산; 정적 함수: {getRealScaleAtGoogle()}
        defined — 높이와 라벨 존재 여부 판정; 함수: {defined()}
        UGroup — 완성한 mesh를 타일 캐시 그룹으로 소유권 이전; 함수: {add()}

    동작:
        사용자 높이 콜백이 있으면 feature 높이를 먼저 계산한다.
        좌표로 위치 벡터를 만들고 구 기하와 레이어 기본 색상의 기본 재질을 준비한다.
        mesh를 만들고 레이어 렌더 순서를 적용한다.
        사용자 높이가 있으면 렌더 좌표 배율로 환산해 밑면 높이로 넣고 높이 보정값이 참이면 더한다.
        지형 높이와 자동 갱신 등록을 적용한다. 이 호출 안의 로드 이벤트 뒤에도 스타일·라벨·외곽선·그룹 연결을 계속한다. [확인 Q-040]
        스타일을 적용한다.
        라벨을 만든다.
        외곽선 설정이면 외곽선을 추가한다.
        타일별 모델 맵과 전역 모델 식별자 집합에 이 식별자를 기록한다.
        feature의 gid가 삭제 필터에 걸리면 mesh와 라벨을 숨긴 뒤 mesh를 타일 캐시 그룹에 추가한다. 이 판정은 타일별 기록에 쓴 식별자와 다를 수 있다. [확인 Q-038]

parseString(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature, coordType: string, tile: U3dQuadTile, id: string | number, key: string, groupWFS: UGroup) -> void
    역할: LineString 계열 feature를 곡선 경로의 파이프 mesh로 만들어 스타일·라벨·지형 높이를 적용하고 타일 그룹에 넣는다.

    인터페이스:
        coordType은 전달받지만 현재 구현에서 사용하지 않는다. [확인 Q-007]
        groupWFS는 타일 캐시에 생성한 UGroup이지만 source JSDoc은 U3dModelWFSLayerMesh로 선언한다. [확인 Q-016]

    처리 기준:
        LineString은 좌표 전체를 하나의 경로로, MultiLineString은 각 선분 묶음을 이어 붙인 경로로 만들고 그 밖의 종류는 처리하지 않는다.
        z 좌표가 없으면 0으로 본다.
        경로 좌표는 평균 중심을 뺀 지역 좌표로 바꾼 뒤 곡선을 만든다.
        파이프 반지름은 사용자 깊이 콜백이 있으면 레이어를 수신 객체로 지정해 호출한 결과를, 없으면 레이어 기본 반지름을 사용하며 렌더 좌표 배율로 환산하지 않는다.
        경로 분할 수는 96, 원주 분할 수는 8이며 파이프 양 끝은 닫지 않는다.
        모델 중복 판정과 타일별 기록에는 `_fieldPk`로 선택한 식별자를 사용하지만 삭제 필터에는 feature의 gid를 사용한다. [확인 Q-038]
        MultiLineString이 여러 mesh를 만들고 각각 라벨을 생성하면 같은 feature id가 라벨 맵 키로 반복 사용되어 마지막 라벨만 맵에 남는다. [확인 Q-042]

    의존:
        UGPoint — 좌표를 렌더 좌표 벡터로 표현; 생성자: {new UGPoint()}
        THREE — 중심 계산, 곡선과 파이프 기하 생성, 경계 상자 계산과 mesh 위치·가시성 설정, 높이 보정값 보관; 생성자: {new Vector3(), new CatmullRomCurve3(), new TubeGeometry()}; 함수: {Vector3.set(), Vector3.sub(), BufferGeometry.computeBoundingBox()}; 속성 쓰기: {Object3D.position, Object3D.visible}; 속성 읽기·쓰기: {Object3D.userData}
        U3dModelLayer — 삭제 필터 판정; 함수: {removeFilter()}
        UMathEngine — 미터 값을 렌더 좌표 배율로 환산; 정적 함수: {getRealScaleAtGoogle()}
        defined — 사용자 깊이 콜백, 높이와 라벨 존재 여부 판정; 함수: {defined()}
        UGroup — 완성한 mesh를 타일 캐시 그룹으로 소유권 이전; 함수: {add()}

    동작:
        사용자 높이 콜백이 있으면 feature 높이를 먼저 계산한다.
        기하 종류에 따라 좌표를 하나 또는 여러 경로로 나누고 지원하지 않는 종류이면 종료한다.
        경로마다 좌표 평균을 중심으로 잡고 좌표를 중심 기준 지역 좌표로 바꾼다.
        지역 좌표로 곡선을 만들고 반지름을 정해 파이프 기하를 만든 뒤 경계 상자를 계산한다.
        재질을 만든다.
        mesh를 만든다.
        사용자 높이가 있으면 렌더 좌표 배율로 환산해 밑면 높이로 넣고 높이 보정값이 참이면 더한다.
        스타일을 적용한다.
        지형 높이와 자동 갱신 등록을 적용한다. 이 호출 안의 로드 이벤트 뒤에도 라벨·외곽선·그룹 연결을 계속한다. [확인 Q-040]
        라벨을 만든다.
        외곽선 설정이면 외곽선을 추가한다.
        mesh를 타일 캐시 그룹에 넣고 타일별 모델 맵과 전역 모델 식별자 집합에 `_fieldPk`로 선택한 식별자를 기록한다.
        feature의 gid가 삭제 필터에 걸리면 mesh와 라벨을 숨긴다. 이 판정은 앞에서 기록한 식별자와 다를 수 있다. [확인 Q-038]
        MultiLineString의 각 mesh에 라벨을 만들면 같은 feature id 키가 재사용되어 라벨 맵에는 마지막 라벨만 남을 수 있다. [확인 Q-042]

transWorldPosition(origins: Array<Array<number>>) -> {type: string, positions: Array<UGPoint>, center: THREE.Vector3} | null
    역할: 폴리곤 고리 하나의 좌표 배열을 렌더 좌표 목록과 평균 중심으로 바꾸고 z 유무로 좌표 종류를 판정한다.

    인터페이스: 반환: 좌표 종류, 렌더 좌표 목록과 평균 중심이며 점이 3개 미만이면 null

    처리 기준:
        좌표 중 하나라도 `0`이 아닌 z를 가지면 '3d', 모든 z가 없거나 `0`이면 '2d'로 판정한다.
        z 좌표가 없으면 0으로 본다.

    의존:
        UGPoint — 좌표를 렌더 좌표 벡터로 표현; 생성자: {new UGPoint()}
        THREE — 평균 중심 벡터 생성과 설정; 생성자: {new Vector3()}; 함수: {Vector3.set()}

    동작:
        좌표가 없거나 3개 미만이면 null을 반환한다.
        각 좌표를 렌더 좌표 벡터로 만들면서 좌표 합을 누적하고 참인 z가 처음 나오면 좌표 종류를 '3d'로 정한다.
        좌표 평균을 중심으로 설정하고 좌표 종류가 정해지지 않았으면 '2d'로 확정하여 결과를 반환한다.

parsePolygon(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature, coordType: string, tile: U3dQuadTile, id: string | number, key: string, groupWFS: UGroup) -> void
    역할: Polygon 계열 feature의 각 좌표 고리를 독립된 돌출 건물 mesh로 만들어 스타일·라벨·지형 높이와 편집 상태를 적용하고 타일 그룹에 넣는다.

    인터페이스:
        coordType은 전달받지만 사용하지 않으며 고리별 좌표 종류는 좌표 변환 결과로 다시 판정한다. [확인 Q-007]
        groupWFS는 타일 캐시에 생성한 UGroup이지만 source JSDoc은 U3dModelWFSLayerMesh로 선언한다. [확인 Q-016]

    처리 기준:
        스타일이 없거나 보이지 않으면 mesh를 만들지 않는다.
        재질을 만들지 못하면 mesh를 만들지 않는다.
        고리마다 자신의 평균 중심과 그 중심 위도의 렌더 좌표 배율을 사용한다.
        기하를 만들지 못한 고리는 건너뛴다.
        재질은 고리 반복 전에 한 번 만들고 모든 고리 mesh에 같은 객체 또는 배열을 연결하므로 한 mesh의 스타일 교체·삭제가 다른 고리가 참조하는 재질까지 해제할 수 있다. [확인 Q-024]
        초기 생성에서는 `setStyle()`을 호출하지 않으므로 style.label을 만들지 않는다. [확인 Q-032]
        스타일 투명도는 실제 재질에 반영하지 않는다. [확인 Q-031]
        텍스처 재질에는 스타일 색상을 반영하지 않는다. [확인 Q-034]
        각 mesh의 삭제·편집 필터는 `createMesh()`가 먼저 넣은 feature gid 또는 oid를 사용하지만, 모델 중복 판정과 타일별 기록은 `_fieldPk`로 선택한 식별자를 사용한다. 반복이 끝난 뒤에는 feature gid로 삭제 필터를 다시 판정한다. [확인 Q-038]
        유효한 고리나 생성 가능한 기하가 하나도 없어 mesh를 만들지 못해도 모델 식별자를 기록한다. 이때 미리 만든 재질은 소유권을 넘기거나 해제하지 않으며, feature gid가 삭제 필터에 걸리면 생성되지 않은 마지막 mesh를 참조해 오류가 발생한다. [확인 Q-037]
        여러 고리가 각각 라벨을 만들면 같은 feature id가 라벨 맵 키로 반복 사용되어 마지막 라벨만 맵에 남는다. [확인 Q-042]

    의존:
        U3dLayer — 레이어 렌더 순서 조회; 속성 읽기: {_renderOrder}
        U3dModelLayer — 삭제·편집 필터 판정과 편집 이벤트 등록; 함수: {removeFilter(), editFilter(), setEditEvent()}
        defined — 스타일, 높이와 라벨 존재 여부 판정; 함수: {defined()}
        UMathEngine — 고리 중심 위도의 렌더 좌표 배율 환산; 정적 함수: {getRealScaleAtGoogle()}
        THREE — mesh 위치·렌더 순서·가시성 설정과 좌표·스타일 정보 보관; 속성 쓰기: {Object3D.position, Object3D.renderOrder, Object3D.visible}; 속성 읽기·쓰기: {Object3D.userData}
        UGroup — 완성한 mesh를 타일 캐시 그룹으로 소유권 이전; 함수: {add()}

    동작:
        사용자 높이 콜백이 있으면 feature 높이를 먼저 계산한다.
        Polygon과 MultiPolygon의 외곽·내부 고리를 구분하지 않고 각각 렌더 좌표 목록과 중심으로 바꾼다. 내부 고리도 hole로 연결하지 않아 이후 독립된 채움 solid mesh가 된다. [확인 Q-047]
        feature 스타일을 계산하고 없거나 보이지 않으면 종료한다.
        텍스처 스타일 적용 여부를 판정한다.
        스타일에 맞는 재질과 이미지 URL, 스타일 정보를 고리 반복 전에 한 번 만들고 재질이 없으면 종료한다.
        고리마다 중심 위도의 렌더 좌표 배율로 돌출 기하를 만들고 만들지 못하면 건너뛴다.
        고리마다 기하와 앞에서 만든 같은 재질로 mesh를 만들고 렌더 순서, 식별자, 텍스처 스타일 여부, 중심·좌표·좌표 종류·배율과 이미지·스타일 정보를 사용자 데이터에 기록한다.
        사용자 높이가 있으면 렌더 좌표 배율로 환산해 밑면 높이로 넣고 높이 보정값이 참이면 더한다.
        지형 높이와 자동 갱신 등록을 적용한다. 이 호출 안의 로드 이벤트 뒤에도 라벨·외곽선·그룹 연결을 계속한다. [확인 Q-040]
        사용자 라벨 콜백 결과로 라벨 생성을 시도한다.
        외곽선 설정이면 외곽선을 추가한다.
        삭제 필터에 걸리면 숨기고 편집 필터에 걸리면 편집 이벤트 대상으로 등록한 뒤 mesh를 타일 캐시 그룹에 추가한다.
        반복을 마치면 생성된 mesh 수와 관계없이 타일별 모델 맵과 전역 모델 식별자 집합에 `_fieldPk`로 선택한 식별자를 기록한다.
        feature gid가 삭제 필터에 걸리면 마지막으로 만든 mesh와 그 라벨만 숨긴다. 여러 고리를 만들었으면 앞선 mesh와 라벨은 그대로 남는다. [확인 Q-038] [확인 Q-054]

_createPOI(self: U3dModelWFSLayer, mesh: U3dModelWFSLayerMesh, opt: Record<string, any>) -> void
    역할: mesh 경계 상자 중심에 POI 라벨을 만들어 mesh, 라벨 맵과 라벨 그룹에 함께 연결한다.

    인터페이스: opt의 zOffset, textLabel, imgLabel, imgSize와 color가 라벨 위치와 표현을 정한다.

    처리 기준:
        같은 mesh에 이미 라벨이 있으면 먼저 제거한다.
        zOffset이 정의되어 있으면 mesh에 보관하고 라벨 위치 z에 더한다.
        zOffset이 생략되면 이전에 mesh에 저장한 labelZoffset을 지우지 않으므로 이후 라벨 위치 갱신은 이전 보정값을 다시 사용한다. [확인 Q-044]
        textLabel이 참이 아니면 imgLabel이 있어도 라벨을 만들지 않으므로 zOffset만 mesh에 남는다. 이 함수는 `_fieldLabel`도 읽지 않는다. [확인 Q-046] [확인 Q-053]
        라벨 이름과 라벨 맵 키는 feature id를 우선 사용하고 없으면 mesh uuid를 사용하며, feature 파싱에서 `_fieldPk`로 정한 모델 식별자와 다를 수 있다. [확인 Q-025]
        feature id가 숫자이면 라벨 맵은 숫자 키를 보존하지만 타일별 일반 객체에 기록한 같은 ID는 문자열 키가 되어 식별자 기반 제거에서 일치하지 않을 수 있다. [확인 Q-055]
        같은 feature에서 여러 mesh를 만들면 각 라벨이 같은 이름과 맵 키를 사용한다. 맵 항목은 마지막 라벨로 덮어쓰지만 앞선 라벨도 라벨 그룹에는 남는다. [확인 Q-042]
        만든 라벨 참조는 mesh 사용자 데이터, 라벨 맵과 라벨 그룹에 함께 저장되지만 mesh 경로 제거에서는 라벨 맵과 mesh 사용자 데이터 참조를 지우지 않는다. [확인 Q-033]

    의존:
        defined — 높이 보정값과 라벨 그룹 존재 여부 판정; 함수: {defined()}
        defaultValue — 라벨 이름과 표현 옵션 기본값 적용; 함수: {defaultValue()}
        THREE — 라벨 위치 벡터 생성과 mesh 사용자 데이터 기록; 생성자: {new Vector3()}; 속성 쓰기: {Object3D.userData}; 속성 읽기: {Object3D.uuid}
        UMesh — mesh 경계 상자 조회; 함수: {getBBox()}
        U3dPOI — POI 라벨 생성; 생성자: {new U3dPOI()}; 속성 읽기: {name}
        UGroup — 라벨 그룹에 라벨 추가; 함수: {add()}
        U3dModelLayer — 라벨 그룹 조회; 속성 읽기: {_labelGroup}

    동작:
        기존 mesh 라벨을 해제하고 라벨 그룹에서 제거한다.
        mesh 경계 상자 중심을 구하고 높이 보정값이 있으면 mesh에 보관한 뒤 위치에 더한다.
        라벨 문자열이 참일 때만 POI를 만들어 mesh 사용자 데이터, 라벨 맵과 라벨 그룹에 연결한다.

_removePOI(self: U3dModelWFSLayer, item: U3dModelWFSLayerMesh | string | number) -> void
    역할: mesh 또는 라벨 식별자로 찾은 POI 라벨을 해제하고 선택한 경로에 따라 라벨 그룹 또는 라벨 맵에서 제거한다.

    인터페이스: item이 WFS mesh 또는 Mesh이면 mesh 사용자 데이터의 라벨을, 그 외에는 라벨 맵의 식별자를 대상으로 삼는다.

    처리 기준:
        mesh 경로는 라벨을 해제하고 그룹에서만 제거하며 라벨 맵과 mesh.userData.label에는 해제된 참조를 남긴다. [확인 Q-033]
        식별자 경로는 그 값이 feature id 또는 mesh uuid로 만든 라벨 맵 키와 일치할 때만 라벨을 찾는다. [확인 Q-025]

    의존:
        UWfsMesh — mesh 종류 판정; 생성자: {UWfsMesh}
        THREE — mesh 종류 판정과 사용자 데이터 조회; 생성자: {Mesh}; 속성 읽기: {Object3D.userData}
        UDEF — 라벨 객체의 렌더 자원 해제; 정적 함수: {disposeObject3D()}
        UGroup — 라벨 그룹에서 라벨 제거; 함수: {remove()}
        U3dModelLayer — 라벨 그룹 조회; 속성 읽기: {_labelGroup}

    동작:
        mesh이면 사용자 데이터의 라벨을 해제하고 라벨 그룹에서 제거하되 라벨 맵과 mesh 사용자 데이터 참조는 지우지 않는다. [확인 Q-033]
        식별자이면 라벨 맵에서 라벨을 찾아 해제하고 라벨 그룹과 라벨 맵에서 함께 제거한다.

createStyle(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature) -> U3dModelWFSLayerFeatureStyle
    역할: 사용자 스타일 콜백 또는 SLD 규칙으로 feature 스타일을 만들고 색·투명도·가시성 기본값을 채운다.

    인터페이스: 반환: 색상, 투명도와 가시성이 항상 채워진 스타일 객체

    처리 기준:
        사용자 스타일 콜백이 함수이면 레이어의 멤버로 호출하여 그 결과를 쓰고, 없고 SLD 규칙이 있으면 SLD 스타일을 쓴다.
        색상과 투명도를 정하지 못하면 레이어 기본 색상과 투명도를 사용한다.
        가시성을 정하지 못하면 레이어 가시성을 쓰며 투명도가 정확히 0이면 항상 보이지 않는 것으로 확정한다.

    의존:
        defined — feature와 SLD 규칙 존재 여부 판정; 함수: {defined()}
        defaultValue — 색상, 투명도와 가시성 기본값 적용; 함수: {defaultValue()}
        U3dLayer — 레이어 기본 투명도와 가시성 조회; 속성 읽기: {_opacity, _visible}

    동작:
        사용자 스타일 콜백이 있으면 레이어의 멤버로 호출하여 그 결과를 스타일로 삼는다.
        사용자 스타일 콜백이 없고 SLD 규칙이 있으면 규칙에서 스타일을 계산한다.
        색상과 투명도를 레이어 기본값으로 채운다.
        가시성을 레이어 값으로 채우고 투명도가 0이면 보이지 않음으로 확정하여 스타일을 반환한다.

setStyle(self: U3dModelWFSLayer, mesh: U3dModelWFSLayerMesh) -> void
    역할: 이미 만들어진 mesh에 현재 스타일의 색상·투명도·가시성·텍스처와 라벨을 다시 적용한다.

    처리 기준:
        feature 속성이나 기하가 없으면 아무 것도 하지 않는다.
        가시성이 false이면 가시성 블록 안의 라벨 생성과 텍스처·재질·폴리곤 기하 전환을 건너뛴다. 다만 구 기하 재생성과 단일 재질의 색상·투명도·스타일 정보 갱신은 가시성과 관계없이 수행한다.
        구 기하의 텍스처 이미지 경로는 기존 POI가 있으면 이미지를 바꾸지만, POI가 없으면 textLabel 없는 이미지 옵션으로 `_createPOI()`를 호출하므로 새 이미지 라벨을 만들지 못한다. [확인 Q-053]
        단일 재질일 때만 색상·투명도를 적용한다. 원본 색상은 속성 존재 여부로 갱신하지만 원본 투명도는 `_oriOpacity`가 truthy일 때만 갱신하므로 값 0이면 실제 opacity만 바뀌고 원본 값은 남는다. [확인 Q-056]
        재질이 배열이면 스타일 정보 기록을 건너뛴다.
        폴리곤 고리들이 재질을 공유한 경우 한 mesh에서 기존 재질을 해제하면 다른 고리 mesh도 같은 해제된 재질을 계속 참조할 수 있다. [확인 Q-024]
        style.label이 있으면 라벨을 먼저 만들지만 생성 경로가 뒤이어 `setLabel()`을 호출하면 사용자 라벨 옵션으로 교체되거나 옵션이 비어 있을 때 제거될 수 있다. [확인 Q-026]
        텍스처 재질을 새로 적용할 때는 스타일 색상과 투명도를 실제 배열 재질에 반영하지 않는다. [확인 Q-031] [확인 Q-034]

    의존:
        defined — 속성, 기하, 재질과 이미지 스타일 존재 여부 판정; 함수: {defined()}
        defaultValue — 구 기하 크기와 분할 수 기본값 적용; 함수: {defaultValue()}
        THREE — 구 기하 재생성, 기존 기하·재질 해제와 색상·투명도 적용; 생성자: {SphereGeometry, new SphereGeometry()}; 함수: {BufferGeometry.dispose(), Material.dispose(), Color.set()}; 속성 읽기: {SphereGeometry.parameters, Object3D.userData}; 속성 쓰기: {Object3D.visible, Object3D.userData, Material.opacity, Material.transparent}
        U3dPOI — 라벨 이미지 교체; 생성자: {U3dPOI}; 함수: {setImage()}; 속성 쓰기: {image, imageSize}
        UDEF — 재질 배열 생성 결과 검증; 정적 함수: {assert()}

    동작:
        feature 속성이나 기하가 없으면 종료한다.
        현재 스타일을 계산한다.
        구 기하이면 기존 기하를 해제하고 스타일 크기와 분할 수로 다시 만든다.
        보이는 스타일이고 style.label이 있으면 라벨을 다시 만든다.
        보이는 스타일일 때만 텍스처 스타일 적용 여부를 판정한다.
        텍스처 스타일이면 아직 텍스처용 기하가 아닐 때 기하를 교체하고 스타일 이미지 또는 기본 텍스처를 고른다.

        구 기하이면 기존 POI에 고른 이미지를 반영하고 POI가 없으면 이미지 옵션으로 생성을 시도한다. 그 밖의 기하이면 옆면·윗면 재질을 새로 만들어 기존 재질을 해제한 뒤 교체한다.

        텍스처 스타일이 아니면 기존 재질을 해제하고 단일 재질을 만들며, 이전에 텍스처 기하였으면 단일 재질용 기하로 되돌린다.
        가시성과 관계없이 단일 재질이면 색상과 투명도를 적용하고 투명 여부와 스타일 정보를 사용자 데이터에 기록한다.
        계산한 가시성을 mesh에 반영한다.

setMaterial(self: U3dModelWFSLayer, feature: U3dModelWFSLayerFeature, style: U3dModelWFSLayerFeatureStyle, setStyle: boolean = false) -> {material?: ModelMaterial | Array<ModelMaterial>, imgUrl?: string, styleInfo: Record<string, any>} | undefined
    역할: 폴리곤 mesh 생성에 사용할 재질과 참조 이미지 URL, 스타일 정보를 만든다.

    인터페이스:
        setStyle이 true이면 텍스처를 적용한 옆면·윗면 두 재질을, 아니면 색상만 적용한 단일 재질을 만든다.
        반환: 재질, 참조 이미지 URL과 스타일 정보이며 feature 속성이 없으면 undefined

    처리 기준:
        스타일이 보이지 않으면 재질을 만들지 않고 스타일 정보만 반환하므로 호출자가 mesh 생성을 중단한다.
        스타일 이미지가 있고 이미지 표시가 참이면 그 이미지를, 아니면 기본 텍스처 URL을 사용하며 목록이면 첫 원소를 쓴다.
        단일 재질에서는 원본 색상 속성이 있으면 그쪽에, 없으면 재질 색상에 스타일 색을 반영한다.
        단일 재질과 텍스처 재질 모두 스타일 opacity를 실제 재질에 반영하지 않고 스타일 정보에만 기록한다. [확인 Q-031]
        텍스처 재질에는 스타일 color를 반영하지 않는다. [확인 Q-034]
        스타일 정보의 투명 여부는 투명도가 1보다 작은지로 정한다.

    의존:
        defined — feature 속성과 스타일 이미지 존재 여부 판정; 함수: {defined()}
        THREE — 재질 색상 반영; 함수: {Color.set()}; 상수: {FrontSide}

    동작:
        feature 속성이 없으면 종료한다.
        스타일이 보이고 텍스처 적용이면 스타일 이미지 또는 기본 텍스처로 옆면·윗면 재질을 만든다.
        스타일이 보이고 텍스처 적용이 아니면 단일 재질을 만들고 스타일 색상만 반영한다.

        색상, 투명도, 가시성과 투명 여부를 담은 스타일 정보를 재질·이미지 URL과 함께 반환한다.

setLabel(self: U3dModelWFSLayer, mesh: U3dModelWFSLayerMesh) -> void
    역할: 사용자 라벨 콜백 결과와 레이어 라벨 가시성으로 mesh의 POI 라벨 생성 여부를 정한다.

    처리 기준:
        feature 속성이 없으면 아무 것도 하지 않는다.
        사용자 라벨 콜백이 함수이면 레이어의 `labelFunction` 멤버로 호출한다.
        라벨 옵션에 가시성이 없으면 상속한 레이어 라벨 가시성을 사용한다.
        계산한 가시성이 false이면 기존 라벨을 제거하거나 숨기지 않고 그대로 둔다. [확인 Q-027]

    의존:
        defined — feature와 속성 존재 여부 판정; 함수: {defined()}
        defaultValue — 라벨 가시성 기본값 적용; 함수: {defaultValue()}
        U3dModelLayer — 상속한 라벨 가시성 기본값 조회; 속성 읽기: {_labelVisible}

    동작:
        feature 속성이 없으면 종료한다.
        사용자 라벨 콜백이 있으면 레이어의 멤버로 호출하여 라벨 옵션을 얻는다.
        라벨 가시성이 참이면 기존 라벨을 제거한 뒤 옵션의 textLabel이 참일 때 새 POI를 만든다. [확인 Q-026]
        라벨 가시성이 false이면 기존 라벨 상태를 바꾸지 않고 종료한다. [확인 Q-027]

getSLDStyle(rules: Array<Record<string, any>>, feature: U3dModelWFSLayerFeature) -> {color?: string, opacity?: number}
    역할: SLD 규칙 목록에서 feature 속성 조건에 맞는 채우기 색상과 투명도를 고른다.

    인터페이스: 반환: 선택한 색상과 투명도이며 맞는 규칙이 없으면 두 값이 없는 결과

    의존: Host global eval — 모듈 별칭을 통한 간접 eval로 feature 속성 비교식 실행; 함수: {eval()}

    동작:
        각 규칙의 채우기 정의를 확인하고 없으면 건너뛴다.
        CQL 조건이 없거나 조건 필드가 'geom'이면 색상과 투명도를 기록하고 다음 규칙으로 넘어간다. 명시된 투명도 0은 1로 기록한다. [확인 Q-039]
        조건 필드, 관계 뒤에 `=`, 값을 이어 feature 속성 비교식 문자열을 만든다. `<`와 `>`는 `<=`와 `>=`로 의미가 바뀌고, `<>`, `>=`, `<=`는 각각 `<>=`, `>==`, `<==`가 되어 구문 오류를 만들며, `=`는 유효한 `==`가 된다. [확인 Q-030]
        만든 문자열을 모듈 별칭의 간접 eval로 실행한다. 이 실행은 지역 feature를 볼 수 없고 규칙 내용을 코드로 평가한다. [확인 Q-006] [확인 Q-029]
        비교식이 참이면 색상과 투명도를 기록하고 탐색을 끝낸다.
        선택한 색상과 투명도를 반환한다.

updateLabelVisible(self: U3dModelWFSLayer) -> void
    역할: 라벨 가시성 상태에 맞추어 라벨 그룹을 주석 장면에 붙이고 각 라벨의 표시를 전환한다.

    처리 기준: 라벨 가시성이 참일 때만 라벨 그룹을 주석 장면에 추가하며, 거짓일 때는 장면에서 제거하지 않고 각 라벨만 숨긴다.

    의존:
        U3dLayer — app 참조 조회; 속성 읽기: {_app}
        U3dApp — 라벨 그룹을 붙일 주석 장면 조회; 속성 읽기: {_sceneComment}
        UScene — 라벨 그룹 추가; 함수: {add()}
        U3dModelLayer — 상속한 라벨 가시성과 라벨 그룹 조회; 속성 읽기: {_labelVisible, _labelGroup}
        UGroup — 라벨 목록 조회; 속성 읽기: {children}
        U3dPOI — 라벨 표시 전환; 함수: {show(), hide()}

    동작:
        라벨 가시성이 참이면 라벨 그룹을 주석 장면에 추가한다.
        라벨 그룹의 각 라벨을 현재 가시성에 따라 표시하거나 숨긴다.

getPropIgnoreCase(obj: Record<string, any>, key: string) -> unknown
    역할: 속성 키의 대소문자 차이를 무시하고 값을 찾는다.

    인터페이스: 반환: 찾은 속성값이며 대상이나 키가 없거나 일치하는 키가 없으면 undefined

    의존: defined — 대상, 키와 일치 키 존재 여부 판정; 함수: {defined()}

    동작:
        대상 또는 키가 없으면 undefined를 반환한다.
        소문자로 맞춘 이름이 같은 첫 키를 찾아 그 값을 반환한다.

parseNumber(v: unknown) -> number
    역할: 값을 숫자로 바꾸고 변환할 수 없으면 0으로 대체한다.
    인터페이스: 반환: 변환한 숫자이며 NaN이면 0
    동작: 값을 숫자로 바꾸고 NaN이면 0을 반환한다.

isSetStyle(self: U3dModelWFSLayer, style: U3dModelWFSLayerFeatureStyle) -> boolean
    역할: 이 스타일에 텍스처 재질을 적용해야 하는지 판정한다.

    인터페이스: 반환: 텍스처 재질을 적용해야 하면 true

    의존: defined — 이미지 표시 여부, 이미지 URL과 기본 텍스처 URL 존재 여부 판정; 함수: {defined()}

    동작:
        이미지 표시 여부, 이미지 URL 또는 기본 텍스처 URL 중 하나라도 정의되지 않았으면 false를 반환한다. 이 조건은 기본 텍스처 경로뿐 아니라 이미 로드된 스타일 전용 텍스처 경로도 막는다. [확인 Q-035]
        이미지 표시가 참이고 그 이미지가 보관되어 있으면 true를 반환한다.
        기본 텍스처 사용 설정이 참이면 기본 텍스처 URL 값을 그대로 객체 키로 사용해 보관 텍스처를 찾는다. 이 값은 `setTexture()` 호출로 갱신되지 않으며, URL 목록은 원소별 저장 키와 일치하지 않을 수 있다. [확인 Q-036] [확인 Q-052]
        텍스처를 찾으면 true를, 아니면 false를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
생성 옵션은 소문자 이름과 camelCase 이름을 함께 허용하며 `||`로 먼저 참인 값을 고르므로 앞쪽 이름에 `false`, `0` 또는 빈 문자열을 넘기면 뒤쪽 이름이나 기본값이 대신 적용된다.
타일 키는 `x_y_level` 형식이며 요청 경로에서는 타일 중심을 최소 레벨 인덱스로 환산한 값을, 응답 처리 경로에서는 타일 자신의 키를 사용한다.
사용자 높이와 polygon 돌출 높이는 대상 지점 위도의 렌더 좌표 배율을 곱해 적용하지만 LineString의 파이프 반지름은 별도 환산 없이 TubeGeometry에 전달한다.
모델은 최소 레벨과 같은 레벨의 타일에서만 생성하며 생성자가 최대 레벨을 최소 레벨과 같게 만들어 이 조건을 유지한다.
같은 모델 식별자는 레이어 전체에서 한 번만 생성하며 편집 대기 항목만 예외로 다시 생성한다.
사용자 높이 콜백을 지정하면 지형 렌더 높이 적용과 자동 높이 갱신 등록을 수행하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
