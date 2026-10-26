# U2dLine 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지도 좌표의 점들을 순서대로 연결한 선을 객체 API로 다룬다.

### 1.2 책임 범위

선의 원본 형상 생성, 평면 길이 계산과 입력 좌표 전달을 담당한다. 좌표 편집·스타일·원본 연결·수명 관리는 기반 도형의 계약을 따른다.

### 1.3 주요 동작 방식

기반 생성자가 선의 `createGeometry()`를 호출하여 OpenLayers LineString과 Feature를 준비한다. 현재 원본 형상에서 길이를 계산한다.

### 1.4 주요 사용처와 연계 대상

`U2dVectorShaderLayer.addGeometry()`에 전달하는 사용자 선과 파일 입력 선에 사용한다. `U2dGeometry`를 상속하고 OpenLayers LineString을 사용한다.

## 3. 정규 자연어 수도코드

```spec
U2dLine extends U2dGeometry 클래스 정의

    type: 'LineString'
        선 도형의 종류
    geom: OLGeometry | undefined
        기반 도형에서 상속한 원본 형상 참조. 현재 원본의 조회·연결은 U2dGeometry 계약을 따른다.

    constructor(opt: U2dLineCO = {})
        역할:
            원본 선과 공통 도형 상태를 준비한다.
        의존:
            U2dGeometry — 공통 생성; 함수: {constructor()}
        동작:
            super(opt)를 호출한 뒤 type을 'LineString'으로 지정한다.

    override createGeometry() -> void
        역할:
            최초 원본 LineString과 Feature를 만든다.
        처리 기준:
            geom이 이미 정의되어 있으면 변경하지 않는다.
        의존:
            ol — 원본 선 생성; 생성자: {new ol.geom.LineString()}
            defined — 값의 정의 여부 판정; 함수: {defined()}
            U2dGeometry — 원본 참조와 Feature 생성; 속성 읽기·쓰기: {geom}; 함수: {createGeometry()}
        동작:
            geom이 정의되어 있으면 반환한다.
            [[0,0]] 좌표의 LineString을 geom에 저장한다.
            super.createGeometry()로 원본 Feature와 스타일을 연결한다.

    getLength() -> number
        역할:
            현재 원본의 평면 선분 길이 합을 반환한다.
        처리 기준:
            원본 형상이 없으면 0을 반환한다.
            EPSG:3857 좌표 단위로 계산하며 지구 곡률이나 위도 보정을 적용하지 않는다.
        의존:
            U2dGeometry — 현재 원본 조회; 함수: {getGeometry()}
            OpenLayers geometry — 길이 계산; 함수: {getLength()}
        동작:
            getGeometry()로 현재 원본 형상을 조회한다.
            원본 형상이 없으면 0을 반환하고, 있으면 원본 getLength() 결과를 반환한다.

    override buildCoordinates(coords: Double_Array<number>) -> Double_Array<number>
        역할:
            선 입력 좌표를 포장 없이 전달한다.
        동작:
            받은 coords 배열의 참조를 그대로 반환한다.

U2dLineCO_Content 타입 정의
    name?: string
        이름. 생략하거나 빈 문자열이면 기반 생성자에서 GUID를 사용한다.
    fillColor?: string = 'rgba(255,255,255,0.4)'
        채움 색. 선에는 내부 영역이 없다.
    strokeColor?: string = '#3399CC'
        선 색
    strokeWidth?: number = 1.25
        선 두께
    excludeSearch?: boolean = false
        검색 제외 여부
    nonChanged?: boolean = false
        스타일 편집 잠금 여부

U2dLineCO 타입 정의
    U2dGeometryCO와 U2dLineCO_Content를 합성한 생성 옵션이다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
