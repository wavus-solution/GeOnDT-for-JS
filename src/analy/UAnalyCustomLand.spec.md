# UAnalyCustomLand 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UAnalyCustomLand`는 사용자가 그리거나 전달한 외곽선과 목표 높이로 `CustomLand`를 생성·편집·제거하는 분석 진입점이다. 편집 영역을 완전히 포함하는 가시 `U3dHeightXYZLayer`를 선택하고, 원본 UMF 분석에 필요한 레이어와 UMF 1.x fallback 정보를 `CustomLand`에 전달한다.

### 1.2 책임 범위

- 마우스 입력으로 Polygon 또는 Box 편집 외곽선과 면적 안내 객체를 관리한다.
- 입력 지리 좌표를 월드 좌표, 편집 박스와 선택적 경사 영역으로 변환한다.
- 편집 영역을 포함하고 원본 타일 페이로드를 제공할 수 있는 고도 레이어를 선택한다.
- `CustomLand`를 앱 편집 목록과 공간 인덱스에 등록하고 지형 재적용을 요청한다.
- 생성된 편집 지형의 조회, 수정, 제거와 토공량 분석 진입점을 제공한다.
- 책임 경계: UMF 요청·파싱·캐시는 `U3dHeightXYZLayer`가, 체적 계산은 `CustomLand`가 담당한다.

### 1.3 주요 동작 방식

입력 외곽선은 먼저 월드 좌표와 바운딩 박스로 변환되고, 필요하면 경사면 외곽선과 경사 박스가 추가된다. 이후 해당 전체 영역을 포함하는 가시 고도 레이어 중 가장 작은 범위의 XYZ 레이어를 선택한다. 선택 레이어 자체와 데이터 레벨, 그리고 UMF 1.x용 전역 복원값을 옵션에 기록해 `CustomLand`를 만든 뒤 앱의 편집 목록과 인덱스에 등록한다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp.activeAnalysis('CustomLand')`가 이 분석 객체를 활성화한다.
- 사용자 코드가 `addCustomLand()`, `editCustomLand()`, `removeCustomLandById()`와 `getVolume()`을 호출한다.
- `CustomLand`가 선택된 `U3dHeightXYZLayer`에서 원본 타일 데이터와 UMF 2.0 헤더를 함께 조회한다.
- `U3dApp.updateHeightLayers()`가 등록·수정·제거된 영역과 교차하는 현재 지형을 갱신한다.

## 2. 요구사항과 품질 기준

```spec
- 편집 영역의 원본 분석 레이어는 영역을 완전히 포함하고 가시 상태이며 U3dHeightXYZLayer 타일 페이로드 계약을 제공해야 한다.
- UMF 2.0 복원값은 레이어 전역 값으로 덮지 않고 CustomLand가 받은 타일 헤더를 사용해야 한다.
- UMF 1.x에는 파일별 헤더가 없으므로 선택 레이어의 전역 scale과 offset을 fallback으로 전달해야 한다.
- 기존 지표면 표시 갱신 경로와 입력 이벤트 흐름은 UMF 버전 분기로 추가 작업을 수행하지 않는다.
```

## 3. 정규 자연어 수도코드

```spec
UAnalyCustomLand extends UAnaly 클래스 정의
    의존: UAnaly — 분석 공통 상태와 앱 연결 제공; 상속: {UAnaly}

    constructor(opt: UAnalyCustomLandCO)
        역할: 지표면 편집 분석의 입력, 스타일, 목록과 이벤트 상태를 초기화한다.
        의존:
            UAnaly — 상위 분석 상태 초기화; 함수: {constructor()}
            UGroup — 면적·점 안내 객체 그룹 생성; 생성자: {new UGroup()}
        동작: 기본 이름·최대 영역·높이·스타일·선택 방식과 비어 있는 편집 객체 및 피처 목록을 설정한다.

    override setApp(app: U3dApp) -> void
        동작: 앱 연결을 상위 분석 객체에 위임하고 현재 객체의 앱 참조를 사용한다.

    override active() -> void
        동작: 상위 분석 활성화를 수행하고 입력 이벤트를 등록한다.

    override deactive() -> void
        동작: 그리기를 중단하고 상위 분석 비활성화를 수행한다.

    override addDefaultEvent() -> void
        처리 기준: 앱 또는 이벤트 핸들러가 없으면 등록하지 않는다.
        동작: 기존 이벤트를 정리한 뒤 클릭과 더블클릭 callback을 등록한다.

    stopDraw() -> void
        동작: 등록된 클릭·더블클릭 이벤트를 제거하고 이벤트 ID를 비운다.

    setCustomLandToApp(customLand: CustomLand) -> void
        역할: 편집 지형을 앱의 높이 편집 목록과 공간 인덱스에 등록한다.
        의존:
            U3dApp — 편집 목록과 공간 인덱스 접근; 함수: {getIndexManager()}
            UIndexManager — XY 범위 항목 등록; 함수: {insert()}
        동작: 분석 이름별 편집 Set에 객체를 추가하고 원본 또는 경사 박스 범위를 공간 인덱스에 등록한다.

    areaPoiClear() -> void
        동작: 면적 안내 객체들을 처분·제거하고 목록을 비운다.

    setInclineEdit(inclineEdit: boolean) -> void
        동작: 이후 생성할 편집 지형의 경사면 편집 기본값을 설정한다.

    setStyle(style: CustomLandStyleCO) -> void
        동작: 누락값에 기본 스타일을 적용하고 현재 OpenLayers 스타일과 draw 객체에 반영한다.

    setDrawStyle(style: OLStyle) -> void
        동작: 그리기 스타일을 저장하고 draw 객체가 있으면 즉시 반영한다.

    override clear(useRemoveEditLandAll: boolean = true) -> void
        동작:
            요청된 경우 모든 편집 지형을 제거한다.
            상위 분석 상태, 입력 상태와 내부 피처를 정리한다.

    getGeoVertex() -> Array<{x: number, y: number}>
        동작: 현재 입력 중인 지리 좌표 목록을 반환한다.

    checkHeightByLayer(box: UBox3) -> boolean
        동작: 가시 고도 레이어 중 하나라도 입력 박스의 XY 범위와 교차하면 true를 반환한다.

    getParam() -> Array<CustomLandCO>
        동작: 등록된 각 편집 지형의 재생성 파라미터를 배열로 반환한다.

    setParam(param: Array<CustomLandCO>) -> void
        역할: 저장된 설정 배열로 편집 지형들을 복원한다.
        동작: 각 설정으로 CustomLand를 만들고 목록·앱에 등록한 뒤 해당 범위의 지형 갱신을 요청한다.

    setSelectType(type: string) -> void
        처리 기준: Polygon 또는 Box만 허용한다.
        동작: 유효한 입력이면 이후 그리기 선택 방식을 교체한다.

    getFeatures() -> Array<OLFeature>
        동작: 현재 측정 피처 목록을 반환한다.

    addEditLand(options: DataOPT_Input) -> DeferredObject<void>
        동작: 폐기 예정 경고를 출력하고 addCustomLand() 결과를 반환한다.

    getEditLand() -> Array<CustomLand>
        동작: 폐기 예정 경고를 출력하고 현재 편집 지형 목록을 반환한다.

    addCustomLand(options: DataOPT_Input | Array<DataOPT_Input>) -> DeferredObject<void>
        역할: 하나 이상의 입력 옵션을 순서대로 검증·변환하여 편집 지형으로 추가한다.
        처리 기준:
            draw 객체가 없고 앱이 있으면 먼저 생성한다.
            배열 입력은 앞 항목 완료 후 다음 항목을 처리한다.
            객체도 배열도 아니거나 하위 생성이 실패하면 deferred를 거절한다.
        동작: 입력 단위별 비공개 추가 흐름을 실행하고 전체 성공 여부로 deferred를 완료한다.

    editCustomLand(id: string, option: DataOPT_Input) -> DeferredObject<void>
        역할: 기존 편집 지형을 제거하고 같은 ID의 새 설정으로 교체한다.
        동작: 대상과 기존 파라미터를 확인하고 앱·목록에서 제거한 뒤 병합된 옵션을 다시 추가한다.

    getCustomLandList() -> Array<CustomLand>
        동작: 등록된 편집 지형 목록을 반환한다.

    getCustomLand(id: string) -> CustomLand | undefined
        동작: ID가 같은 첫 편집 지형을 반환한다.

    removeEditLandById(id: string) -> void
        동작: ID에 해당하는 편집 지형을 앱과 목록에서 제거하고 객체 자원을 처분한다.

    removeCustomLandById(id: string) -> void
        동작: removeEditLandById()에 직접 위임한다.

    removeEditLandAll() -> void
        동작: 모든 편집 지형을 앱·인덱스에서 제거하고 처분한 뒤 관련 피처와 상태를 정리한다.

    removeCustomLandAll() -> void
        동작: removeEditLandAll()에 직접 위임한다.

    getVolume(id: string, progressFunc?: Function) -> Promise<CustomLand> | undefined
        역할: 지정 편집 지형의 원본 DEM 토공량 분석을 시작하거나 기존 결과를 반환한다.
        동작: ID로 객체를 찾고 있으면 해당 CustomLand의 getVolume() 결과를 반환한다.

    cancelDrawFeature() -> void
        동작: 마지막 면적 안내 객체와 마지막 측정 피처를 제거하여 현재 그리기 입력을 한 단계 취소한다.

    #click(e: U3dMouseEvent) -> void
        역할: 한 번의 지도 클릭을 Polygon 또는 Box 입력점과 면적 안내 상태에 반영한다.
        의존:
            U3dApp — 화면 교차점과 지형 높이 조회; 함수: {intersectAtPixel(), getRenderHeightAtPoint()}
            U3dBilboard — 입력점·면적 안내 객체 생성; 정적 함수: {makeBilboard()}
            UDEF — 유효하지 않은 지형 높이 판정과 안내 객체 처분; 상수: {INVALID, TERRAIN_NO_DATA}; 함수: {disposeObject3D()}
        동작:
            화면 교차점을 지리 좌표로 변환하여 선택 방식에 맞게 입력 목록과 측정 피처에 반영한다.
            현재 면적과 위치가 있으면 면적 안내 객체를 교체하고 장면 갱신을 요청한다.

    #dblClick() -> void
        동작: 현재 측정점을 피처로 확정하고 유효하지 않은 짧은 피처를 제거한 뒤 입력 안내와 종료 상태를 정리한다.

    #clearGuidPoi() -> void
        동작: 입력점 안내 객체를 모두 처분·제거하고 목록을 비운다.

    #removeAppEditListById(findIndex: CustomLand) -> void
        역할: 한 편집 지형의 앱 등록과 화면 피처를 제거하고 교차 지형 갱신을 요청한다.
        동작: 분석별 편집 Set과 공간 인덱스에서 객체를 제거하고 top feature를 삭제한 뒤 해당 박스로 고도 레이어 갱신을 요청한다.

    #setDataOption(opt: DataOPT, layers?: Array<U3dHeightXYZLayer>) -> DataOPT | false
        역할: 편집 영역의 원본 UMF 분석에 사용할 고도 레이어와 fallback 설정을 선택한다.
        처리 기준:
            후보는 가시 상태이고 원본·경사 편집 박스를 완전히 포함하며 _getHeightTilePayload()를 제공해야 한다.
            복수 후보이면 바운딩 박스 크기가 가장 작은 레이어를 선택한다.
            heightScale과 heightOffset은 UMF 1.x fallback이며 UMF 2.0에서는 타일 헤더가 우선한다.
        의존:
            U3dHeightXYZLayer — 원본 타일 페이로드 계약과 레이어 전역 설정; 함수: {_getHeightTilePayload()}; 속성 읽기: {_baseUrl, _unitHeight, _maxlevel, _dataScale, _dataOffset}
        동작: 조건을 만족하는 레이어를 정렬·선택하고 URL, 표본 크기, 데이터 레벨, 레이어 참조와 UMF 1.x 복원값을 옵션에 기록하여 반환한다.

    #setLandOption(options?: DataOPT) -> DataOPT | undefined
        역할: 입력 지리 외곽선을 편집 도형, 월드 좌표와 전체 편집 박스로 변환한다.
        처리 기준:
            입력 높이와 좌표를 숫자로 정규화하고 유효하지 않은 지형 높이는 0으로 사용한다.
            계산한 XY 면적이 최대 허용 크기를 넘으면 오류 이벤트를 전달하고 종료한다.
        의존:
            UDraw — 원본·버퍼 다각형 피처 생성; 함수: {makeRawFeature(), removeFeature()}
            UMathEngine — EPSG:3857 실제 스케일 계산; 정적 함수: {getRealScaleAtGoogle()}
            U3dRecoveredGeometry — 월드 좌표 바운딩 박스 계산; 생성자: {new U3dRecoveredGeometry()}; 함수: {computeBoundingBox()}
            UBox3 — 편집 영역 생성; 생성자: {new UBox3()}
        동작: 외곽선을 닫고 화면 피처와 중심을 만든 뒤 좌표·높이·내부 경사 설정을 계산한다.
            비경사 편집이면 텍스처용 버퍼 외곽선을 만들고 공통 옵션 상태를 기록하여 반환한다.

    #setInclineLandOption(opts: DataOPT) -> DataOPT | undefined
        역할: 경사 편집에 필요한 외곽선, 깊이, 시각화 범위와 경사 박스를 계산한다.
        처리 기준: 내부 경사 생성 실패, draw 부재 또는 처리 예외이면 undefined를 반환한다.
        의존:
            UMathEngine — 좌표 실제 스케일 계산; 정적 함수: {getRealScaleAtGoogle()}
            UDraw — 경사 버퍼 피처 생성; 함수: {makeRawFeature(), removeFeature()}
            U3dRecoveredGeometry — 경사 외곽 바운딩 박스 계산; 생성자: {new U3dRecoveredGeometry()}; 함수: {computeBoundingBox()}
        동작: 원본 지형과 목표 높이 차이로 경사 버퍼 크기를 계산하고 경사 외곽 좌표·박스와 시각화용 외곽선을 옵션에 기록하여 반환한다.

    #createCustomLand(options: DataOPT) -> CustomLand | undefined
        역할: 완성된 옵션으로 편집 지형을 만들고 앱에 등록한다.
        의존: CustomLand — 편집 지형 생성; 생성자: {new CustomLand()}
        동작: 객체를 생성해 목록과 앱에 등록하고 교차 지형 갱신을 요청하여 반환한다.

    #addCustomLand_(options: DataOPT) -> DeferredObject<void>
        역할: 한 입력 옵션을 좌표·경사·데이터 단계 순서로 완성하여 편집 지형으로 추가한다.
        처리 기준:
            고도 레이어, 각 변환 결과 또는 대상 데이터 레이어가 없으면 deferred를 거절한다.
            모든 단계가 성공하면 편집 지형을 등록하고 입력 상태를 정리한다.
        동작:
            기본 편집 도형을 만들고 필요한 경우 경사 정보를 추가한다.
            완성된 편집 영역으로 원본 UMF 레이어를 선택하고 CustomLand를 생성한다.
            생성 성공 시 현재 입력 상태를 정리하고 deferred를 완료한다.

    #clearDrawFeature() -> void
        동작: 측정 레이어의 현재 draw feature와 보관 피처들을 제거하고 목록을 비운다.

    #clearInDrawFeature() -> void
        동작: 내부 top feature를 제거하고 draw 레이어와 draw 객체를 정리한다.

    #clearState() -> void
        동작: 입력 종료·좌표 상태를 초기화하고 측정 피처를 제거한 뒤 앱 갱신 시각을 변경한다.
```

## 4. 공통 처리 기준과 제약

```spec
- 편집 지형 생성은 좌표·박스 생성, 선택적 경사 정보 생성, 원본 데이터 레이어 선택, 객체 등록 순서를 유지한다.
- 고도 레이어 선택 결과에는 실제 레이어 객체를 보존하여 CustomLand가 URL을 자체 구성하거나 UMF 바이트를 중복 파싱하지 않게 한다.
- 레이어 전역 heightScale과 heightOffset은 UMF 1.x 호환 경로에서만 복원값이며 UMF 2.0 파일별 메타데이터를 대체하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
