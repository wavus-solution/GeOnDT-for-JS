# UAnalySlope 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

두 점 사이의 렌더 지형 높이를 일정한 간격으로 조회하고 각 표본의 월드 좌표(EPSG:3857)와 미터 단위 높이를 반환한다.

### 1.2 책임 범위

분석 활성 상태, 측정점과 측정 도형, 끝점 표식과 별도의 관심 지점(POI), 높이 표본 조회를 관리한다.

### 1.3 주요 동작 방식

`setPoints()`로 좌표만 지정하거나 `setStart()`와 `setEnd()`로 앱의 측정 표시도 구성할 수 있다. `getSlope()`는 두 좌표가 있을 때 지형을 조회한다.

### 1.4 주요 사용처와 연계 대상

`GeOnDT.analysis.UAnalySlope`로 공개되고 `U3dApp`의 Slope 분석으로 등록된다. 지형과 측정 도형은 연결된 앱이 제공한다.

## 3. 정규 자연어 수도코드

```spec
UAnalySlope extends UAnaly 클래스 정의
    의존: UAnaly — 공통 분석 상태와 이벤트; 상속: {UAnaly}
    name: string
        생성 시 지정한 분석 이름이다.
    #slope: number = 0
        초기화 및 정리에서만 0으로 설정되는 내부 값이다.
    #prevExtent: any = undefined
        초기화 및 정리에서만 undefined로 설정되는 내부 값이다.
    _divide: number
        높이 표본 분할 수다.
    _measureLength: number
        끝점 확정 시 읽은 앱의 측정 길이다.
    _clickId: string | number | undefined
        활성화 시 이벤트 정리 여부를 판단하는 등록 ID다.
    _start: Vector3 | undefined
    _end: Vector3 | undefined
    override _poiGroup: UGroup
        시작점과 끝점의 화면 표식을 담는다.
    _lineFeature: any
        끝점 확정 시 앱이 반환한 측정 도형을 보관한다.
    _indicator: U3dPOI
        별도 관심 지점 참조다. 생성 시 초기화하지 않는다. [확인 Q-004]

    constructor(opt: UAnalySlopeCO = {})
        의존:
            UAnaly — 공통 상태 초기화; 생성자: {constructor()}
            defaultValue — undefined일 때 기본값 적용; 함수: {defaultValue()}
            UGroup — 끝점 표식 그룹 생성; 생성자: {new UGroup()}
        동작:
            부모 생성자를 인수 없이 호출한다. 부모 옵션은 타입에 포함되어 있으나 이 생성 동작에는 적용하지 않는다. [확인 Q-001]
            opt.name과 opt.divide를 읽고 각각 undefined일 때 'Slope'와 60을 사용한다. null은 기본값으로 바꾸지 않는다.
            _measureLength를 0으로 설정한다. _clickId·_start·_end를 undefined로 설정하고 새 UGroup을 _poiGroup에 저장한 뒤 _lineFeature를 undefined로 설정한다.

    override active() -> this
        의존:
            UAnaly — 분석 활성화와 이벤트 해제; 함수: {active(), off()}; 속성 읽기: {_app}
            UDEF — 측정 모드 식별; 상수: {APP_MODE._DISTANCE}
            U3dApp — 선 측정 도구 선택; 함수: {setLineStringMeasureType()}; 속성 쓰기: {_mode}
        동작:
            부모 active를 실행한 뒤 _app 참조를 가져온다.
            _clickId 또는 동적으로 읽는 _dblClickId가 undefined가 아니면 인수 없이 this.off()를 호출한다. [확인 Q-002]
            앱의 _mode를 _DISTANCE로 설정하고 선 측정 도구를 선택한 뒤 _measureLength를 0으로 바꾼다.
            자신을 반환한다.

    override deactive() -> this
        의존: UAnaly — 활성 상태 확인과 종료; 함수: {deactive()}; 속성 읽기: {_isActive}
        동작:
            _isActive가 falsy이면 바로 자신을 반환한다.
            _isActive가 truthy이면:
                부모 deactive를 실행한다.
                _measureLength가 0이면 분석 결과를 정리한다.
                자신을 반환한다.

    override clear() -> this
        의존:
            UAnaly — 앱 참조 및 표식 그룹 정리; 함수: {clear()}; 속성 읽기: {_app}
            defined — 측정 도형 존재 판정; 함수: {defined()}
            U3dApp — 측정 도형 제거와 화면 갱신; 함수: {removeMeasureFeature(), setUpdateDate()}; 속성 읽기: {_measureLayer}
            U3dShaderMeasureLayer — 그리는 중인 도형 정리; 함수: {clearDrawFeature()}
        동작:
            앱 참조를 가져온다. #slope·_measureLength를 0으로, #prevExtent·_start·_end를 undefined로 바꾼다.
            별도 관심 지점 제거를 요청한다.
            부모 clear를 실행한다.
            _lineFeature가 defined이면 앱에서 해당 도형을 제거한 뒤 _lineFeature를 undefined로 바꾼다.
            앱의 측정 레이어에서 그리는 중인 도형을 지우고 앱 갱신 시각을 갱신한다. 앱 연결 없이 호출하면 정리 도중 동기 예외가 발생할 수 있다. [확인 Q-003]
            자신을 반환한다.

    getStart() -> Vector3 | undefined
        동작: 저장한 시작점 참조를 그대로 반환한다.

    setStart(point: WorldPositionVector3) -> this
        의존:
            UAnaly — 앱과 좌표 변환 도구 조회; 속성 읽기: {_app, _drawArg}
            U3dApp — 주석 장면 조회; 속성 읽기: {_sceneComment}
            UScene — 주석 장면에 그룹 등록; 함수: {add()}
            U3dBilboard — 시작점 표식 생성; 함수: {makeBilboard()}
            UGroup — 그룹에 표식 등록; 함수: {add()}
            UDrawArg — 좌표 변환과 측정점 등록; 함수: {getWorldToGeographic(), addMeasurePoint()}
        동작:
            앱과 좌표 변환 도구를 먼저 가져오고 이전 측정을 정리한다.
            앱의 주석 장면에 _poiGroup을 등록하고 point 참조를 _start에 저장한다.
            point와 'start' 텍스트로 표식을 만들어 _poiGroup에 추가한다.
            point의 x·y와 z를 위경도 좌표계(EPSG:4326)로 변환한다. z가 null 또는 undefined이면 0을 사용한다.
            변환 결과를 UDrawArg의 측정점으로 추가하고 자신을 반환한다.

    getEnd() -> Vector3 | undefined
        동작: 저장한 끝점 참조를 그대로 반환한다.

    setEnd(point: WorldPositionVector3) -> this
        의존:
            UAnaly — 앱과 좌표 변환 도구 조회; 속성 읽기: {_app, _drawArg}
            U3dBilboard — 끝점 표식 생성; 함수: {makeBilboard()}
            UGroup — 그룹에 표식 등록; 함수: {add()}
            UDrawArg — 좌표 변환; 함수: {getWorldToGeographic()}
            U3dApp — 끝점 등록과 측정 확정; 함수: {addMeasurePoint(), getMeasureLength(), commitMeasurePoint()}
        동작:
            앱과 좌표 변환 도구를 가져오고 point 참조를 _end에 저장한다.
            point와 'end' 텍스트로 표식을 만들어 _poiGroup에 추가한다.
            point의 x·y와 z를 위경도 좌표계(EPSG:4326)로 변환한다. z가 null 또는 undefined이면 0을 사용한다.
            변환 결과를 앱의 측정점으로 추가하고 앱의 측정 길이를 _measureLength에 저장한다.
            앱의 측정을 확정하여 반환받은 도형을 _lineFeature에 저장하고 자신을 반환한다.

    getMeasureLength() -> number
        동작: _measureLength에 보관한 값을 반환한다.

    setPoints(start: WorldPositionVector3, end: WorldPositionVector3) -> this | undefined
        의존: defined — 좌표 존재 판정; 함수: {defined()}
        동작:
            start 또는 end가 null이나 undefined이면 좌표를 갱신하지 않고 undefined를 반환한다.
            두 좌표 참조를 _start와 _end에 저장하고 자신을 반환한다. 측정 도형, 표식과 측정 길이는 변경하지 않는다.

    getSlope(divide?: number) -> Array<{position: Vector3, height: number}> | undefined
        의존:
            defined — 분할 수와 좌표 존재 판정; 함수: {defined()}
            UAnaly — 앱 참조 조회; 속성 읽기: {_app}
        동작:
            divide가 defined이면 저장한 분할 수를 갱신한다.
            시작점이나 끝점이 null 또는 undefined이면 undefined를 반환한다.
            앱·시작점·끝점 참조와 현재 분할 수를 읽을 수 있는 이 객체를 전달하고 표본 배열을 반환한다.
            호출 도중 분할 수가 바뀌지 않는 양의 정수 분할에서는 시작점이 포함되고 끝점은 제외된다. 유한한 0 이하의 분할 수에서는 빈 배열을 반환한다.

    override update(drawArg?: UDrawArg) -> this
        동작: drawArg를 사용하거나 상태를 변경하지 않고 자신을 반환한다.

    addVertex(geox: number, geoy: number) -> this
        동작: 인수를 사용하거나 정점을 추가하지 않고 자신을 반환한다.

    getDivide() -> number
        동작: 저장한 분할 수를 반환한다.

    setDivide(divide: number) -> this
        동작: 추가 검증 없이 divide를 _divide에 저장하고 자신을 반환한다.

    addIndicator(poi: U3dPOI) -> this
        의존:
            UAnaly — 앱 참조 조회; 속성 읽기: {_app}
            defined — 앱 존재 판정; 함수: {defined()}
            U3dApp — 관심 지점 등록; 함수: {addPOI()}
        동작:
            앱이 null 또는 undefined이면 바로 자신을 반환한다.
            poi 참조를 _indicator에 저장하고 앱에 등록한 뒤 자신을 반환한다. 기존 참조의 관심 지점은 별도로 제거하지 않는다.

    removeIndicator() -> this
        의존:
            UAnaly — 앱 참조 조회; 속성 읽기: {_app}
            defined — 앱과 관심 지점 존재 판정; 함수: {defined()}
            U3dApp — 관심 지점 제거; 함수: {removePOI()}
        동작:
            앱과 _indicator가 모두 null 또는 undefined이면 바로 자신을 반환한다.
            앱에 _indicator 제거를 요청하고 자신을 반환한다. _indicator 참조는 유지한다. [확인 Q-004]

    getIndicator() -> U3dPOI
        동작: 저장한 _indicator 참조를 반환한다. 등록 전 런타임 반환값은 undefined이다. [확인 Q-004]

UAnalySlopeCO_Content 타입 정의
    name?: string = 'Slope'
        분석 이름이다.
    divide?: number = 60
        높이 표본 분할 수다.

UAnalySlopeCO extends UAnalyCO 부분 타입 명세
    Omit<UAnalyCO, never>와 UAnalySlopeCO_Content를 합성한다.
    type?: string = 'analy'
        상속 옵션이며 자식 생성자는 부모에게 전달하지 않는다. [확인 Q-001]
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
