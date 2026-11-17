# U2dPolygon 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

전체 면 형상과 외곽선·구멍·복합 면을 객체 API로 편집한다.

### 1.2 책임 범위

좌표 구조 구분·좌표계 변환·링 닫힘·순차 입력 외곽선 보존과 평면 면적을 담당한다. 공통 스타일·원본 수명은 기반 도형을 따른다.

### 1.3 주요 동작 방식

입력을 전체 폴리곤 목록으로 변환한 뒤 기존 Polygon 또는 MultiPolygon에 적용한다. 순차 입력만 첫 면의 외곽선을 바꾸며 내부 구멍과 나머지 면을 보존한다.

### 1.4 주요 사용처와 연계 대상

U2dVectorShaderLayer의 사용자 면·완전 WFS 원본과 U2dGeometry 기반 편집 흐름에 사용한다.

## 3. 정규 자연어 수도코드

```spec
U2dPolygon extends U2dGeometry 클래스 정의

    type: string
        도형의 대표 종류이며 실제 native geometry의 복합 타입과 다를 수 있다.

    _center: Array<number> | undefined
        마지막으로 계산한 면 경계 중심이다.

    lastCoordinate: Array<number> | undefined
        미리보기 마지막 좌표이며 setPosition에서 undefined로 초기화한다. U2dPolygon._syncCoordinates는 이 값의 존재를 읽어 확정점 분리 조건을 판정한다.

    geom: OLGeometry | undefined
        현재 원본 형상 참조이며 공개 조회에서 원본 교체를 확인한다.

    coordinates: U2dCoordinate
        순차 입력의 확정 좌표이며 미리보기 점과 구분한다.

    constructor(opt: U2dPolygonCO = {})
        동작:
            기반 생성 뒤 type을 Polygon으로 지정한다. 실제 원본 geometry는 Polygon 또는 MultiPolygon일 수 있다.

    override setPosition(ary: Double_Array<number> | Triple_Array<number> | Quad_Array<number>, srs: string = 'EPSG:4326') -> void
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
            U2dGeometry — 입력 좌표 변환과 원본 조회; 함수: {transformPoint(), getGeometry()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {transformPoint(), getGeometry()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {lastCoordinate, geom, feature}
        동작:
            ary[0]이 nullish이면 반환한다.
            ary[0]이 nullish가 아니면
                단일 링·링 목록·폴리곤 목록을 구분하여 전체 폴리곤·구멍을 보존한다.
                모든 점을 srs에서 EPSG:3857로 변환한다. 링의 첫점·끝점 x·y가 다르면 첫점의 복사본을 덧붙여 닫는다.
                미리보기를 종료한다. 기존 Polygon이고 면이 하나면 같은 geometry에 링 목록을 적용하며, 기존 MultiPolygon이면 전체 목록을 적용한다.
                그 밖에는 새 MultiPolygon을 원본 Feature에 연결한다. 마지막으로 확정 외곽선 좌표를 맞춘다.

    override getPosition() -> Double_Array<number> | Triple_Array<number> | Quad_Array<number>
        의존:
            U2dGeometry — 최신 원본 조회; 함수: {getGeometry()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {getGeometry()}
        동작:
            현재 원본 좌표를 읽는다. 단일 외곽선은 링, 구멍이 있는 단일 면은 링 목록, 여러 면은 폴리곤 목록으로 반환하고 지원 구조가 아니면 빈 배열이다. 조회만으로 확정 좌표는 변경하지 않는다.

    override _syncCoordinates() -> void
        의존:
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {coordinates, lastCoordinate}
        동작:
            현재 좌표에서 첫 폴리곤 외곽선을 선택하여 coordinates에 보관한다. x·y가 같은 마지막 닫힘점은 제외한다. lastCoordinate가 있고 coordinates가 단일 링이며 좌표 수가 이전 확정점보다 하나 늘었으면 마지막 점을 lastCoordinate로 옮기고 coordinates에서는 뺀다.

    override createGeometry() -> void
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.geom.MultiPolygon()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
            U2dGeometry — 원본 Feature 연결; 함수: {createGeometry()}
            U2dGeometry — 상속한 원본·편의 상태; 속성 읽기·쓰기: {geom}
        동작:
            geom이 정의되어 있으면 반환한다. 초기 MultiPolygon을 만든 뒤 기반 createGeometry로 Feature와 스타일을 연결한다.

    override getCenter() -> Array<number>
        의존:
            ol — 입력·형상·스타일 처리; 함수: {ol.extent.getCenter()}
            U2dGeometry — 최신 원본 조회; 함수: {getGeometry()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {getGeometry()}
        동작:
            현재 geometry가 없으면 빈 배열을 반환한다. 있으면 최신 extent의 ol.extent.getCenter 결과를 _center에 저장하여 반환한다.

    override buildCoordinates(coords: Double_Array<number>) -> Triple_Array<number> | Quad_Array<number>
        의존:
            U2dGeometry — 현재 Polygon·MultiPolygon 조회; 함수: {getGeometry()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {getGeometry()}
        동작:
            coords의 점 참조를 새 외곽선 배열에 순서대로 넣고 첫점을 덧붙여 닫는다. 기존 Polygon이면 내부 링들을, MultiPolygon 경로이면 첫 면의 내부 링과 나머지 면들을 보존하여 반환한다.

    getArea() -> number
        의존:
            U2dGeometry — 최신 원본 조회; 함수: {getGeometry()}
            U2dGeometry — 상속한 편집·조회 경로; 함수: {getGeometry()}
        동작:
            현재 geometry가 없으면 0을 반환하고 있으면 geometry.getArea 결과를 반환한다. 지도 좌표의 면적이며 지구 곡률 보정을 추가하지 않는다.

isPolygonRing(coords: U2dCoordinate) -> coords is Double_Array<number>
    동작:
        coords[0]이 배열이고 그 첫 성분이 number인 경우 true를 반환한다.

isPolygonRingList(coords: U2dCoordinate) -> coords is Triple_Array<number>
    동작:
        coords[0]과 그 첫 항목이 배열이고 그 첫 좌표 성분이 number인 경우 true를 반환한다.

isPolygonList(coords: U2dCoordinate) -> coords is Quad_Array<number>
    동작:
        첫 세 단계 항목이 배열인 경우 true를 반환한다. 전체 입력의 모든 점을 검증하는 판정은 아니다.

U2dPolygonCO_Content 타입 정의
    name?: string
    fillColor?: string = 'rgba(255,255,255,0.4)'
    strokeColor?: string = '#3399CC'
    strokeWidth?: number = 1.25
    excludeSearch?: boolean = false
    nonChanged?: boolean = false

U2dPolygonCO 타입 정의
    Omit<U2dGeometryCO, never> & U2dPolygonCO_Content

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
