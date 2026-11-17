# U2dPoint 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

Point·MultiPoint 원본과 별도 원형 마커 반경을 공통 도형 API로 편집한다.

### 1.2 책임 범위

점 좌표·반경·원형 이미지 스타일과 점별 동적 반경 모드를 관리한다. 지도 거리와 화면 픽셀 사이의 표시 환산은 레이어가 담당한다.

### 1.3 주요 동작 방식

원본 좌표는 OL Point 또는 MultiPoint로 유지한다. 원형 이미지가 바뀌면 편의 스타일을 동기화하고 다른 점과 공유한 Style에는 개별 반경 모드를 쓰지 않는다.

### 1.4 주요 사용처와 연계 대상

U2dVectorShaderLayer.addGeometry와 완전 WFS 원본 연결에 사용한다. U2dGeometry를 상속한다.

## 3. 정규 자연어 수도코드

```spec
U2dPoint extends U2dGeometry 클래스 정의

    radius: number
        원본 마커 반경이며 0을 보존한다.

    circle: OlCircleStyle | undefined
        현재 원형 이미지 스타일 참조다.

    type: string
        도형의 대표 종류이며 실제 native geometry의 복합 타입과 다를 수 있다.

    style: OLStyle | undefined
        도형이 보관한 현재 또는 복원용 단일 스타일이다.

    fill: OLFill | undefined
        현재 채움 스타일 참조다.

    stroke: OLStroke | undefined
        현재 외곽선 스타일 참조다.

    fillColor: string
        채움의 편의 색상이며 스타일 동기화 때 원본 값으로 바뀔 수 있다.

    strokeColor: string
        외곽선의 편의 색상이다.

    strokeWidth: number
        편의 선 두께다.

    geom: OLGeometry | undefined
        현재 원본 형상 참조이며 공개 조회에서 원본 교체를 확인한다.

    coordinates: U2dCoordinate
        순차 입력의 확정 좌표이며 미리보기 점과 구분한다.

    constructor(opt: U2dPointCO = {})
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Circle()}
            assertBoolean — 입력·형상·스타일 처리; 함수: {assertBoolean()}
            defaultValue — 입력·형상·스타일 처리; 함수: {defaultValue()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
            U2dGeometry — 공통 원본·스타일 생성; 함수: {constructor(), _setStyleValue()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {_setStyleValue()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {feature}
        동작:
            공통 도형 생성 뒤 radius를 opt.radius 또는 5로 지정하고 type을 Point로 보관한다.
            opt.isDynamicRadius의 boolean 형식을 검증한다.
            opt.isDynamicRadius가 nullish가 아니면
                style이 truthy이면
                    style을 #getOwnDynamicRadiusStyle로 선택한 독립 또는 동일 객체로 바꾸고 원본에 연결한다.
                지연 값에도 opt.isDynamicRadius를 보관한다.
            sourceFeature가 있으면 현재 이미지가 ol.style.Circle일 때 그 반경·채움·외곽선을 채택하고 반환한다. 이미지가 없다는 이유로 원형 캔버스를 생성하지 않는다.
            일반 생성은 현재 채움·외곽선·반경으로 Circle 스타일을 만들어 circle에 보관하고 도형 Style에 연결한다. opt.fillColor·strokeColor가 truthy일 때만 생성된 스타일 내부 색상에도 다시 기록한다.

    override setPosition(position: Array<number> | Double_Array<number>, srs: string = 'EPSG:4326') -> void
        의존:
            U2dGeometry — 좌표 변환과 원본 조회·단일점 적용; 함수: {transformPoint(), getGeometry(), setPosition()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {transformPoint(), getGeometry()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {geom, feature, coordinates}
        동작:
            position[0]이 배열이면 각 점을 srs에서 EPSG:3857로 변환한다. 기존 MultiPoint는 좌표를 교체하고 다른 형상은 MultiPoint로 교체하여 원본에 연결한다.
            단일 점 입력이고 현재 원본이 MultiPoint이면 변환 점 하나를 가진 MultiPoint를 유지한다.
            그 밖의 단일 점은 변환 뒤 기반 setPosition으로 반영한다. 반환 전에 공통 생성·편집 잠금 검사를 새로 추가하지 않는다.

    override createGeometry() -> void
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.geom.Point()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
            U2dGeometry — 원본 Feature 연결; 함수: {createGeometry()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {geom}
        동작:
            geom이 정의되어 있으면 반환한다. [0,0]의 OL Point를 만든 뒤 기반 createGeometry로 Feature와 스타일을 연결한다.

    override buildCoordinates() -> Array<number> | Double_Array<number>
        의존:
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {coordinates}
        동작:
            인자를 사용하지 않고 현재 this.coordinates 참조를 그대로 반환한다.

    setRadius(radius: number) -> void
        의존:
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {feature}
        동작:
            도형 또는 원본 스타일이 있으면 현재 원형 이미지부터 동기화한다. 현재 반경과 입력이 같으면 반환한다.
            radius와 준비된 Circle의 반경을 바꾸고 원본 changed를 호출한다. 직접 호출에는 잠금·비음수 검사를 추가하지 않으며 0도 보존한다.

    getRadius() -> number
        의존:
            U2dGeometry — 현재 편집 대상 원형 스타일 조회; 함수: {_getSourceStyle()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {_getSourceStyle()}
        동작:
            편집 대상 원형 이미지의 getRadius가 있으면 그 값, 없으면 도형 radius를 반환한다.

    override getParam() -> U2dPointParam
        의존:
            U2dGeometry — 공통 파라미터와 원본 스타일 조회; 함수: {getParam(), _getSourceStyle()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {_getSourceStyle()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {feature}
        동작:
            기반 파라미터에 현재 반경을 더한다. 개별 isDynamicRadius는 편집 원본 스타일, 도형 style, 원본 _style 순서로 첫 nullish 아닌 값을 사용한다.

    override setParam(param: U2dPointParam = {}) -> void
        의존:
            assertBoolean — 입력·형상·스타일 처리; 함수: {assertBoolean()}
            assertNonNegative — 입력·형상·스타일 처리; 함수: {assertNonNegative()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
            U2dGeometry — 공통 파라미터 검증과 편집·현재 잠금·스타일; 함수: {getNonChanged(), setParam(), _getSourceStyle(), _setStyleValue()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {getNonChanged(), _getSourceStyle(), _setStyleValue()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {_disposed, feature}
        동작:
            radius의 비음수·isDynamicRadius의 boolean을 먼저 검증한다. 현재 잠금이 해제되어 있거나 nonChanged:false이면 점별 항목을 편집할 수 있다.
            기반 setParam으로 공통 항목을 검증·적용한 뒤 해제됐거나 이번 점 편집이 잠겨 있으면 반환한다.
            isDynamicRadius가 명시됐으면 명시 스타일 표식을 갱신하고 필요한 경우 독립 Style을 만든다. 현재 원본 스타일 또는 백업이 같은 객체를 가리키던 경로에 새 Style을 연결한다.
            지연 모드 값을 기록하고 원본 changed를 호출한다. 명시 radius가 있으면 마지막에 setRadius로 적용한다.

    override setFeature(feature: OLFeature, ownsFeature: boolean = false) -> void
        의존:
            U2dGeometry — 원본 교체와 소유권 처리; 함수: {setFeature()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {feature}
        동작:
            기반 setFeature에 원본과 ownsFeature를 전달한다. 도형 또는 원본 스타일이 있으면 현재 원형 이미지·편의 값을 동기화한다.

    override getStyle() -> OLStyle
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Circle()}
            U2dGeometry — 현재 Style과 반경 모드 조회; 함수: {_getSourceStyle(), getStyle()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {_getSourceStyle()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {feature}
        동작:
            현재 편집 스타일·도형 Style·원본 백업 순으로 개별 반경 모드를 읽은 뒤 기반 getStyle로 현재 Style을 얻는다.
            sourceStyle.isDynamicRadius를 먼저 사용하고 nullish이면 isDynamicRadius로 대체한다. 모드가 달라 독립 Style을 만들었으면 같은 원본 또는 백업 참조를 새 객체로 바꾼다.
            이미지가 없고 원본에 명시 Style도 없으면 기존 Circle 또는 새 Circle을 연결한다.
            호출 전에 읽은 이미지가 Circle이면 이미지 채움·외곽선을 본체보다 우선한다. 없는 이미지 항목을 본체에서 보충해야 할 때만 내부 참조를 연결하고 같은 반경을 설정하여 이미지를 갱신한다.
            Circle 참조·반경·색·두께를 동기화하고 Style을 반환한다.

    #getOwnDynamicRadiusStyle(style: OLStyle, isDynamicRadius: boolean | undefined) -> OLStyle
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            isDynamicRadius가 nullish이거나 현재 Style 모드와 같으면 같은 Style을 반환한다. 다르면 clone한 뒤 기존 확장 속성과 채움·외곽선 등 내부 참조를 Object.assign으로 유지하고 모드만 바꾼 사본을 반환한다. 공유 원본 Style의 모드는 수정하지 않는다.

    override setFillColor(color: string) -> void
        의존:
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {nonChanged, feature}
            U2dGeometry — 기반 스타일 편집; 함수: {setFillColor()}
        동작:
            nonChanged가 truthy이면 반환한다.
            nonChanged가 falsy이면
                기존 Style이 있으면 원형 이미지를 동기화하고 기반 색 변경을 수행한다. Circle이 있으며 색 또는 Fill 참조가 바뀐 경우에만 Fill을 연결하고 현재 반경을 다시 설정하여 이미지를 갱신한다. 원본 변경을 통지한다.

    override setStrokeColor(color: string) -> void
        의존:
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {nonChanged, feature}
            U2dGeometry — 기반 스타일 편집; 함수: {setStrokeColor()}
        동작:
            nonChanged가 truthy이면 반환한다.
            nonChanged가 falsy이면
                기존 Style이 있으면 원형 이미지를 동기화하고 기반 외곽선 색 변경을 수행한다. Circle이 있으며 색 또는 Stroke 참조가 바뀐 경우에만 Stroke를 연결하고 현재 반경을 다시 설정하여 이미지를 갱신한다. 원본 변경을 통지한다.

    override setStrokeWidth(width: number) -> void
        의존:
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {nonChanged, feature}
            U2dGeometry — 기반 스타일 편집; 함수: {setStrokeWidth()}
        동작:
            nonChanged가 truthy이면 반환한다.
            nonChanged가 falsy이면
                기존 Style이 있으면 원형 이미지를 동기화하고 기반 두께 변경을 수행한다. Circle이 있으며 두께 또는 Stroke 참조가 바뀐 경우에만 Stroke를 연결하고 현재 반경을 다시 설정하여 이미지를 갱신한다. 원본 변경을 통지한다.

    override setStyle(style: OLStyle) -> void
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Circle()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {_getSourceStyle()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {nonChanged, feature}
            U2dGeometry — 기반 스타일 편집; 함수: {setStyle()}
        동작:
            nonChanged가 truthy이면 반환한다.
            nonChanged가 falsy이면
                입력 Style에 명시 모드가 있으면 우선하고 없으면 현재 편집·도형·원본 백업의 모드를 보존한 Style을 선택한다.
                기반 setStyle로 적용한 뒤 현재 Circle을 동기화하고 없으면 만든다.
                이전 Circle과 같은 객체이며 채움·외곽선 참조 또는 색·두께가 달라졌을 때만 해당 참조와 반경을 다시 적용한다.
                현재 도형 Style에 Circle을 연결하고 원본 변경을 통지한다.

U2dPointCO_Content 타입 정의
    radius?: number = 5
    isDynamicRadius?: boolean
    name?: string
    fillColor?: string = 'rgba(255,255,255,0.4)'
    strokeColor?: string = '#3399CC'
    strokeWidth?: number = 1.25
    excludeSearch?: boolean = false
    nonChanged?: boolean = false

U2dPointCO 타입 정의
    Omit<U2dGeometryCO, never> & U2dPointCO_Content

OlCircleStyle 타입 정의
    setRadius: (radius: number) => void
    getRadius: function(): number
    getFill: function(): (OLFill | null)
    getStroke: function(): (OLStroke | null)
    fill_: OLFill
    stroke_: OLStroke

U2dPointParam 타입 정의
    U2dGeometryParam & Partial<{radius: number, isDynamicRadius: boolean}>

```

## 4. 공통 처리 기준과 제약

```spec
isDynamicRadius가 true이면 radius와 테두리를 화면 픽셀로 표시하고 false이면 지도 반경으로 표시한다. 미지정이면 레이어 설정을 상속한다.
이 단위는 입력 반경과 모드를 보관하며 카메라 거리 환산과 타일 연결은 U2dVectorShaderLayer가 수행한다.
MultiPoint 전체는 하나의 반경·스타일·동적 모드를 공유한다. 좌표 scale은 마커 반경을 확대하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
