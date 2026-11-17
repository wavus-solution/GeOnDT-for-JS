# UHeightSkirt1_0 명세

> 상태: 구현 관찰 초안

## 1. 개요

`U3dApp.setMethodHeight()`가 1_0 모드에서 렌더 직전에 실행한다. 앱별 경계 실행기에 원본 준비·캐시 스커트·표면·법선 연결을 맡긴다. 완료된 구성과 이웃 관계가 같으면 정점 쓰기를 생략한다. 고도 자료의 다운로드·소유권·레이어 우선순위는 이 단위가 결정하지 않는다.

## 3. 정규 자연어 수도코드

```spec
boundaryExecutors: WeakMap<U3dApp, UTerrainBoundaryExecutor> = 빈 WeakMap
    앱별 경계 실행기를 보관하며 앱의 수명을 연장하지 않는다.

UHeightSkirt1_0 클래스 정의
    static computeDynamicSkirt(app: U3dApp) -> void
        의존:
            U3dApp — 지형·고도 레이어와 품질; 함수: {getTerrainLayer(), getInstanceHeightLayers(), getImproveValue()}; 속성 읽기: {_frustum}
            U3dTerrainLayer — 현재 지형 그룹; 함수: {getGroup()}
            UDEF — 법선 품질 기준; 상수: {IMPROVE_TEXTURE_LEVEL.low}
            UTerrainBoundaryExecutor — 스커트·표면·법선 연결; 생성자: {new UTerrainBoundaryExecutor()}; 함수: {prepare(), execute()}
        동작:
            지형 레이어·고도 레이어·지형 메시가 없으면 해당 앱의 원본 경계를 복원하고 종료한다.
            앱의 실행기가 없으면 만들어 WeakMap에 보관한다. 앱 품질이 low보다 높으면 법선을 사용하고 품질 조회나 low 기준이 없으면 각각 0으로 판단한다.
            전체 지형 그룹으로 경계를 준비하고, 같은 실행기에 지형 레이어·목록·프러스텀을 전달하여 캐시 스커트와 실제 경계를 연결한다. 이 진입점에서는 정점 배열을 직접 쓰지 않는다.
    static restoreSurface(app: U3dApp) -> void
        의존: UTerrainBoundaryExecutor — 원본 경계 복원; 함수: {restore()}
        동작: 앱의 실행기가 있으면 복원한 뒤 WeakMap 항목을 제거한다. 없으면 아무것도 하지 않는다.

    static computeUpSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo) -> boolean
        의존:
            UTerrainBoundaryExecutor — 방향별 호환 계산; 정적 함수: {_computeSkirt()}
            USkirtInfo — 방향 상수; 상수: {DIRECTION.UP}
        동작: 기존 방향 상수로 경계 실행기의 계산에 위임하고 계산 수행 여부를 반환한다.

    static computeDownSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo) -> boolean
        의존:
            UTerrainBoundaryExecutor — 방향별 호환 계산; 정적 함수: {_computeSkirt()}
            USkirtInfo — 방향 상수; 상수: {DIRECTION.DOWN}
        동작: 기존 방향 상수로 경계 실행기의 계산에 위임하고 계산 수행 여부를 반환한다.

    static computeLeftSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo) -> boolean
        의존:
            UTerrainBoundaryExecutor — 방향별 호환 계산; 정적 함수: {_computeSkirt()}
            USkirtInfo — 방향 상수; 상수: {DIRECTION.LEFT}
        동작: 기존 방향 상수로 경계 실행기의 계산에 위임하고 계산 수행 여부를 반환한다.

    static computeRightSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo) -> boolean
        의존:
            UTerrainBoundaryExecutor — 방향별 호환 계산; 정적 함수: {_computeSkirt()}
            USkirtInfo — 방향 상수; 상수: {DIRECTION.RIGHT}
        동작: 기존 방향 상수로 경계 실행기의 계산에 위임하고 계산 수행 여부를 반환한다.

    static findNearGeometry(tile: U3dQuadTile, terrainLayer: U3dTerrainLayer) -> USkirtInfo
        의존: UTerrainBoundaryExecutor — 캐시·조상 이웃 조회; 정적 함수: {_findNearGeometry()}
        동작: 경계 실행기의 조회에 위임하고 방향별 이웃 정보를 반환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
