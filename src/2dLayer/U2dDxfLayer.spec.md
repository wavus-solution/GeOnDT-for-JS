# U2dDxfLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U2dDxfLayer`는 DXF 엔티티의 평면 좌표를 GeOnDT 월드 좌표로 변환하고, OpenLayers 벡터 레이어 생성 callback을 등록하여 3D 지형 타일에 DXF 형상을 표시하는 레이어다.

### 1.2 책임 범위

- DXF 원본 좌표계와 표시 레벨·스타일 설정을 보관한다.
- `UDXFLoader`로 DXF 엔티티를 읽고 각 정점을 월드 좌표로 변환한다.
- 엔티티별 OpenLayers polygon, feature, style과 vector layer를 생성하는 callback을 등록한다.
- 변환한 정점을 누적하여 현재 DXF 데이터의 3D 바운딩 박스를 제공한다.
- 책임 경계: 타일별 OpenLayers map 생성, callback 실행과 공유 source 수명주기는 기반 `U3dOpenLayer`가 담당한다.

### 1.3 주요 동작 방식

DXF 데이터가 추가되면 엔티티별 정점을 원본 좌표계에서 경위도로 변환한 뒤 GeOnDT 월드 좌표로 바꾸고, 타일 렌더링 때 실행될 OpenLayers layer callback을 등록한다. callback은 기반 레이어가 전달한 공유 source가 있으면 이를 재사용하고, 없으면 polygon feature와 현재 스타일을 적용한 새 vector source를 만든다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT`는 `U2dDxfLayer` 생성자를 공개 API로 노출한다.
- `U3dOpenLayer`는 등록된 callback을 타일 렌더링 과정에서 실행하고 생성된 OpenLayers source를 공유한다.
- `UDXFLoader`는 입력 DXF 데이터에서 엔티티와 정점 정보를 생성한다.

## 2. 요구사항과 품질 기준

```spec
공개 메서드의 시그니처, 상태 변화, callback 등록 순서와 반환 결과는 기존 API 동작을 보존해야 한다.
DXF 엔티티별 callback과 바운딩 박스용 정점은 addDxfInfo() 호출 간 누적되어야 한다.
공유 OpenLayers source가 전달되면 geometry, feature와 style을 다시 만들지 않아야 한다.
```

## 3. 정규 자연어 수도코드

```spec
U2dDxfLayer extends U3dOpenLayer 클래스 정의
    _classtype: string = "U2dDxfLayer"
        런타임 클래스 식별자
    _name: string
        callback 등록에 사용하는 레이어 이름
    _drawLine: boolean = false
        선 그리기 설정
    _crs: string = "EPSG:3857"
        대상 좌표계
    _sourceCRS: string = "EPSG:5179"
        DXF 원본 좌표계
    _minlevel: number = 0
        최소 표시 레벨
    _maxlevel: number = 19
        최대 표시 레벨
    _properties: Array<unknown> = 빈 배열
        레이어 속성 저장소
    _url: string | undefined
        입력 DXF URL
    _type: string = UDEF.LAYER_TYPE.IMAGE
        레이어 종류
    _dxfInfo: object | undefined
        마지막으로 전달된 DXF 데이터
    _vertexPoints: Array<Vector3> = 빈 배열
        바운딩 박스 계산에 사용하는 누적 월드 정점
    _style: object
        기본 OpenLayers stroke와 label 스타일 설정
    _styleFunction: function | undefined
        feature와 DXF 엔티티 타입으로 스타일을 결정하는 선택 callback

    constructor(opt: object = {})
        인터페이스: opt는 레이어 이름·좌표계·레벨·URL·종류·스타일과 스타일 callback의 초기 설정이다.

        의존:
            U3dOpenLayer — 기반 OpenLayers 레이어 초기화; 생성자: {new U3dOpenLayer()}
            defaultValue — 생성 옵션의 기본값 선택; 함수: {defaultValue()}
            Guid — 이름이 없을 때 식별자 생성; 함수: {Guid()}
            UDEF — 이미지 레이어 종류 설정; 상수: {LAYER_TYPE.IMAGE}

        동작:
            기반 레이어를 초기화하고 이름·좌표계·표시 레벨·URL·종류와 누적 상태를 설정한다.
            전달된 style 객체를 그대로 보관하고 fill, width, label, font와 labelStroke의 falsy 값을 기본값으로 대체하며 labelFill은 항상 undefined로 설정한다. [확인 Q-002]
            선택 styleFunction을 저장한다.

    getParam() -> object
        인터페이스: 반환: 현재 이름·표시 레벨·투명도·URL·style 객체와 원본 좌표계

        의존: U3dOpenLayer — 상속된 투명도 상태 조회; 속성 읽기: {_transparent}

        동작: 현재 설정을 새 객체에 담되 style은 현재 _style 참조를 그대로 사용하여 반환한다.

    getSourceCRS() -> string
        인터페이스: 반환: 현재 DXF 원본 좌표계
        동작: _sourceCRS를 반환한다.

    setSourceCRS(sourceCRS: string) -> void
        인터페이스: sourceCRS는 이후 DXF 정점 변환에 사용할 원본 좌표계다.
        동작: _sourceCRS를 입력값으로 교체한다.

    addDxfInfo(data: object, sourceCRS?: string) -> void
        인터페이스:
            data: UDXFLoader가 엔티티로 해석할 DXF 데이터
            sourceCRS: 생략하면 현재 _sourceCRS를 사용하는 입력 좌표계

        의존:
            UDXFLoader — DXF 엔티티와 정점 해석; 생성자: {new UDXFLoader()}; 함수: {loadEntities()}
            defaultValue — 입력 좌표계 선택; 함수: {defaultValue()}
            OpenLayers projection — DXF 좌표를 경위도로 변환; 함수: {proj.transform()}
            U3dOpenLayer — 상속된 좌표 변환 상태 조회; 속성 읽기: {_drawArg}
            UDrawArg(_drawArg) — 경위도를 GeOnDT 월드 좌표로 변환; 함수: {getGeographicToWorld()}
            Vector3 — 누적 월드 정점 생성; 생성자: {new Vector3()}

        동작:
            data를 엔티티 모델로 해석하고 선택한 sourceCRS를 현재 원본 좌표계로 저장하며 data를 _dxfInfo에 보관한다.
            각 엔티티의 모든 XY 정점을 현재 원본 좌표계에서 EPSG:4326으로 변환한 뒤 Z가 0인 월드 정점으로 만든다.
            엔티티별 월드 정점과 child._type으로 OpenLayers layer 생성 callback을 등록한다.
            변환한 정점을 _vertexPoints에 호출 간 누적한다.

    setStyle(style: object) -> void
        인터페이스: style은 현재 style 객체에 병합할 속성이다.

        의존: U3dOpenLayer — 변경된 스타일로 타일 source를 다시 생성; 함수: {refresh()}

        동작: style의 열거 가능한 속성을 현재 _style 객체에 병합하고 refresh()를 호출한다.

    setStyleFunction(styleFunction: function | undefined) -> void
        인터페이스: styleFunction은 feature와 DXF 엔티티 타입을 받아 OpenLayers style을 반환하는 선택 callback이다.

        의존: U3dOpenLayer — 변경된 스타일 callback으로 타일 source를 다시 생성; 함수: {refresh()}

        동작: _styleFunction을 입력값으로 교체하고 refresh()를 호출한다.

    getStyle() -> object
        인터페이스: 반환: 현재 _style 객체의 동일한 참조
        동작: _style을 반환한다.

    getStyleFunction() -> function | undefined
        인터페이스: 반환: 현재 feature별 스타일 callback
        동작: _styleFunction을 반환한다.

    parseDxfFromUrl(url: string) -> void
        인터페이스: url은 공개 매개변수지만 현재 로드 입력으로 사용되지 않는다. [확인 Q-001]

        의존:
            UDXFLoader — URL의 DXF 객체 로드; 생성자: {new UDXFLoader()}; 함수: {load()}
            U3dOpenLayer — 상속된 장면 상태 조회; 속성 읽기: {_scene}
            UScene(_scene) — 로드한 DXF 객체를 장면에 등록; 함수: {add()}

        동작:
            메서드 범위에 선언되지 않은 opt.url로 비동기 로드를 요청한다. [확인 Q-001]
            로드 callback은 객체의 local·world matrix를 갱신한 뒤 상속된 _scene에 추가한다.

    override show(bShow: boolean) -> void
        인터페이스: bShow는 레이어 가시성 여부다.

        의존: U3dOpenLayer — 기반 가시성 변경; 함수: {show()}

        동작: 입력값을 기반 show()에 그대로 전달한다.

    override getBoundingBox() -> Box3
        인터페이스: 반환: 현재까지 누적한 DXF 월드 정점을 포함하는 바운딩 박스

        의존: Box3 — 빈 바운딩 박스 생성과 점 확장; 생성자: {new Box3()}; 함수: {expandByPoint()}

        동작: 새 Box3를 만들고 _vertexPoints의 모든 정점으로 확장하여 반환한다.

```

## 4. 공통 처리 기준과 제약

```spec
스타일 객체와 getParam() 반환값의 style, getStyle() 반환값은 복사본이 아니라 동일한 _style 객체를 공유한다.
addDxfInfo()를 여러 번 호출하면 등록 layer callback과 _vertexPoints가 호출 간 누적된다.
setSourceCRS()는 이후 addDxfInfo() 변환에 사용할 값만 바꾸며 기존 등록 결과를 다시 투영하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
