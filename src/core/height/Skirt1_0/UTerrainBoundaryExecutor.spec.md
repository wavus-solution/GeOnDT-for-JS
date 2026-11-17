# UTerrainBoundaryExecutor 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

실제 표면 경계의 높이 차이와 이웃 타일의 법선 불연속을 줄이고, 보정 전 상태로 복원한다.

### 1.2 책임 범위

현재 지형 그룹에서 표시 중인 준비된 표준 격자의 경계만 변경한다. 원시 고도 파일의 재생성·다운로드·고도 레이어 우선순위는 결정하지 않는다.

### 1.3 주요 동작 방식

prepare가 원본을 보관·복원하고 정렬된 타일 순서를 넘긴다. execute가 캐시·조상 스커트와 실제 표면·법선의 준비·쓰기 순서를 소유한다. 같은 실행에서 영역·격자·이웃 표본·편집 보호를 공유하며 표면 연결로 확정할 바깥 정점의 중복 보간·쓰기를 생략한다. 노멀 품질을 사용하면 같은 원본을 참조하는 가상 타일 경계에 내부와 같은 원본 법선을 보간한다. 그 밖의 경계는 표면 삼각형 기여를 공통 좌표 기준으로 합쳐 공유하고 낮은 LOD의 법선을 보간한 뒤 자기 스커트에 복사한다. 낮은 LOD, X, Y 순으로 기준을 정하여 연결 순서의 교환·누적을 방지한다.

### 1.4 주요 사용처와 연계 대상

`UHeightSkirt1_0`의 앱별 실행기로 사용하며 `U3dApp`의 모드 전환·종료에서 원본을 복원한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
같은 LOD, 서로 다른 LOD, T자 경계와 여러 타일의 모서리를 일정한 기준으로 연결한다.
표시 제외·고도 재적용·속성 교체·모드 종료 시 최신 원본만 복원한다.
유효한 0 높이를 유지하고 NoData를 유효 높이로 보간하거나 채우지 않는다.
```

### 2.2 성능 및 품질 요구사항

```spec
구성이 같으면 정점·노멀 쓰기를 생략한다. 전체의 공통 높이 배율 변경만으로 재계산하지 않는다.
배치가 같으면 이웃 목록을 재사용하고 원본 변경 타일과 접한 이웃부터 다시 계산한다. 확정 표면이 달라질 때만 우선순위 뒤의 이웃으로 전파한다.
타일 배치·객체가 바뀌면 추가·제외 타일의 이전/현재 이웃만 갱신한다. 영향 범위 밖 타일의 보관 정보 객체·원본 배열·이웃 배열과 속성을 유지한다.
높이는 바깥 두 줄, 노멀은 바깥 세 줄만 보관하고 정점·노멀·경계 객체의 동일성을 유지한다.
실행 내 자료에서 타일 영역·격자·편집 가능 여부를 한 번 준비하고 같은 정점의 기여 이웃·보간 표본·보호 결과를 표면·스커트·법선에 공유한다. 바뀌는 높이·법선은 현재 배열에서 읽고 실행 사이에 점별 자료를 보관하지 않는다.
표면 연결은 원본 고도 적용 번호를 올리지 않는다.
경계 법선 연결은 위치·UV·인덱스·내부 법선·속성 객체를 유지한다. 같은 원본을 참조하는 가상 경계는 내부와 동일한 원본 법선을 사용한다. 원본이 다르거나 적용할 원본이 없으면 같은 LOD와 모서리는 표면 방향을 공유하고 혼합 LOD는 낮은 LOD의 경계 방향을 정규화 보간한다.
자기 편집 정점의 법선은 유지한다. 이웃 편집 또는 보간 끝점 보호로 연결을 생략할 때 자기 현재 표면 법선으로 복귀하여 이전 공유 결과를 남기지 않는다.
법선 조회 캐시와 타일별 원본 조회 결과는 execute 지역 자료에 보관하고 다음 실행에 재사용하지 않는다. 실행별 격자·점 자료를 영속 멤버나 원본 보관 정보에 추가하지 않는다.
```

## 3. 정규 자연어 수도코드

```spec
UTerrainBoundaryState 타입 정의
    tileKey: string
        타일 키
    heightRevision: number
        보관 시점의 고도 적용 변경 번호
    positionAttributeId: number
        보관 시점의 position 속성 ID
    originalBoundaryHeights: Float32Array
        보정 전 경계 높이의 독립 복사본
    originalBoundaryNormals: Float32Array
        보정 전 경계 노멀의 독립 복사본
    normalReady: boolean
        전체 표면 법선 준비 여부
    neighborSignature: string
        이웃 구성의 비교 문자열
    configurationScaleZ: number
        경계 준비 시점의 Z 배율

UTerrainSkirtContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        terrains: Array<UTileMesh>
            현재 지형 그룹
        terrainLayer: U3dTerrainLayer
            캐시 이웃을 조회할 레이어
        frustum: Frustum
            방향별 스커트를 갱신할 표시 범위

UTerrainBoundaryDiagnostics 부분 타입 명세
    이 명세에서 사용하는 필드:
        configurationUnit: number
            공통 Z 배율 비교 기준
        topologySignature: string
            현재 배치 식별값
        tileStates: Map<string, UTerrainBoundaryState>
            타일 키로 식별하는 보관 상태의 독립 복사본
        neighbors: Map<string, Array<string>>
            타일 키별 이웃 키의 독립 목록
        neighborPositionAttributeIds: Map<string, Array<number>>
            같은 키로 교체된 이웃을 구분할 위치 속성 ID
        pendingTiles, skirtTiles: Set<string>
            예약된 표면·스커트의 키 목록
        previousBoundaries: Map<string, Float32Array>
            전파 비교 경계의 독립 복사본

UTerrainBoundaryExecutor 클래스 정의
    #tileStates: Map<U3dQuadTile, UTerrainBoundaryState> = 빈 Map
        복원할 원본 경계와 법선 준비 상태
    #neighbors: Map<U3dQuadTile, Array<U3dQuadTile>> = 빈 Map
        표시 표면의 접한 이웃
    #pendingTiles, #skirtTiles: Set<U3dQuadTile> = 빈 Set
        표면·스커트 갱신 예약
    #previousBoundaries: Map<U3dQuadTile, Float32Array> = 빈 Map
        전파 여부를 비교할 완료 높이
    #topologySignature: string = ''
        현재 배치 비교값
    #configurationUnit: number = 1
        공통 Z 배율 비교 기준
    #orderedTiles: Array<U3dQuadTile> = 빈 배열
        마지막 준비의 낮은 LOD·X·Y 순서
    _getDiagnostics() -> UTerrainBoundaryDiagnostics
        의존: U3dQuadTile — 진단 식별 키와 위치 속성; 함수: {getKey(), getMesh()}
        동작:
            현재 기준 배율과 배치 문자열을 값으로 반환한다.
            보관 상태는 키를 기준으로 새 Map에 담고 원본 높이·법선 배열도 각각 독립 복사한다.
            이웃은 키와 위치 속성 ID의 새 배열로, 예약 목록은 키의 새 Set으로, 이전 경계는 배열까지 복사한 Map으로 반환한다. 실제 타일 객체와 내부 가변 목록은 노출하지 않는다.
    static _computeSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo, direction: string) -> boolean
        동작: 방향별 호환 API의 계산에 위임하여 수행 여부를 반환한다.
    static _findNearGeometry(tile: U3dQuadTile, terrainLayer: U3dTerrainLayer) -> USkirtInfo
        동작: 독립된 조회 Map으로 캐시·조상 이웃을 찾아 반환한다.
    prepare(terrains: Array<UTileMesh>, recomputeNormals: boolean) -> boolean
        의존:
            U3dQuadTile — 메시·키·원본 변경 번호·완료 스커트; 함수: {getMesh(), getKey(), clearSkirtInfo()}; 속성 읽기: {heightRevision}
            TERRAIN_NORMAL_UPDATER — 경계 보관 전 전체 법선 준비; 함수: {_ensure()}
        동작:
            이 prepare 호출만의 빈 indexCache Map을 만든다. 하위 예약·원복·경계 보관에 같은 목록을 전달하고 반환·오류 뒤에는 보관하지 않는다.
            eligible인 메시의 타일을 수집하고 compareTiles로 정렬하여 #orderedTiles에 저장한다.
            유지 타일의 과거·현재 Z 배율로 비교 기준을 승계한다.
            배치 비교값이 다르거나 타일 객체·키 구성이 다르면 부분 연결을 갱신하고 #topologySignature를 이번 값으로 저장한다. 반환된 영향 타일을 예약한다.
            각 타일의 요청 비교값이 보관값에서 그대로 같으면 정보 객체와 원본 배열을 유지하고 현재 Z 배율 스냅샷만 갱신한다.
            자기 또는 부모 원본 비교값이 다른 타일은 복원 전 높이를 보관하고 재계산 대상으로 예약한 뒤 해당 이전 경계 비교값을 삭제하여 전체 법선 fallback과 보수적 전파를 선택한다. 법선 품질을 사용하면 전체 표면 법선을 준비한 뒤 키·적용 번호·정점 속성 ID와 바깥 두 줄 높이·세 줄 노멀 및 비교값을 새 정보 객체에 저장한다. 편집·원본 부재는 보간 함수의 기존 제외 조건을 따른다. 법선 품질을 사용하면 TERRAIN_NORMAL_UPDATER._ensure로 내부까지 준비하고 normalReady를 true로 기록한다. 완료 스커트를 비운다.
            원본이 바뀐 타일마다 접한 이웃도 예약하고 #configurationUnit에 이번 Z 비교 기준을 저장한다. 재계산 대상이 하나 이상이면 true를 반환한다. 제외 타일 복원만 있고 남은 예약이 없으면 false이다.
    execute(recomputeNormals: boolean, skirts: UTerrainSkirtContext | undefined = undefined) -> void
        동작:
            이번 실행의 경계 인덱스 Map과 공통 자료를 준비하고 마지막 prepare의 정렬 순서를 재사용한다. 공통 자료는 반환·오류 뒤에 보관하지 않는다.
            skirts가 있으면 캐시·조상 스커트를 처리한다. 표면·스커트 예약이 모두 없으면 종료한다.
            예약 타일의 표면을 낮은 LOD·X·Y 순서로 연결하고 실제 변경 타일을 기억한다. 이전 확정 표면과 달라지면 후순위 이웃으로 전파한다.
            모든 표면이 확정된 뒤 예약 스커트를 자기 표면 높이로 복사한다. 표면 또는 스커트가 달라졌으면 GPU·경계 객체를 갱신한다.
            법선은 품질이 켜져 있고 표면이 변경됐을 때 갱신한다. 기존 normalReady와 현재 비교값이 일치하면 부분 갱신을 허용하며 계산 뒤 상태를 기록한다.
            표면·스커트가 그대로인 편집 타일은 공간 경계만 갱신한다. 법선 품질이 켜져 있으면 예약 타일과 접한 이웃의 법선을 연결한다.
            표면 예약·이전 경계·스커트 예약을 비운다. 복원 상태와 이웃 목록은 유지한다.
    #connectCachedSkirts(skirts: UTerrainSkirtContext, context: object) -> void
        의존:
            U3dQuadTile — 로드·방향별 완료 상태; 함수: {isHeightLoaded(), getSkirtInfo(), setSkirtInfo()}
            USkirtInfo — 완료 비교와 참조 해제; 함수: {equalsNode(), clear()}
            Frustum — 표시 범위; 함수: {intersectsObject()}
        동작:
            고도·geometry가 준비됐고 프러스텀에 들어오는 메시만 캐시·조상 이웃을 찾는다. 같은 키의 조회 결과는 이번 호출 Map에서 공유한다.
            네 방향 모두 완료 정보가 같으면 새 이웃 참조를 해제하고 건너뛴다.
            방향별 공통 계산을 수행한다. 표시 표면으로 연결할 수 있고 대응하는 자기 표면 높이가 유효한 바깥 정점은 이웃 표본 읽기와 중간 쓰기를 생략한다. 그 밖의 정점은 기존 캐시·조상 높이를 계산하여 실제 차이만 기록한다.
            방향별 계산을 수행한 타일은 스커트 예약에 추가한다. 실제 배열 변경이 있으면 position.needsUpdate를 켜고 이웃 참조를 해제한 완료 정보를 저장한다.
    invalidateSkirt(tile: U3dQuadTile) -> void
        동작: #tileStates에 보관된 타일이면 스커트 대상에 추가한다. 보관되지 않은 타일은 무시한다.
    restore() -> void
        동작: 이 restore 호출만의 빈 indexCache Map을 만들어 모든 원본 복원에 전달한다. 보관한 모든 타일의 원본을 검사하여 복원한다. 원본·이웃·표면 예약·이전 완료 높이·스커트 예약 목록과 배치 비교값을 비우고 정렬된 타일 목록을 비우고 Z 비교 기준을 1로 초기화한다.
    #resolveConfigurationUnit(tiles: Array<U3dQuadTile>) -> number
        의존: U3dQuadTile — 유지 타일 키와 현재 배율; 함수: {getKey(), getMesh()}
        동작:
            현재 정렬 순서에서 보관 정보 객체의 키와 현재 키가 같은 첫 타일을 찾는다.
            유지 타일이 있으면 직전 비교 기준에 현재 Z 배율 / 보관된 configurationScaleZ를 곱해 반환한다.
            유지 타일이 없으면 첫 타일의 Z 배율을 반환하고 빈 목록이면 1을 반환한다.
    #updateTopology(tiles: Array<U3dQuadTile>, indexCache: Map<string, Array<number>> | undefined) -> Set<U3dQuadTile>
        의존: U3dQuadTile — 같은 객체의 키 변경 확인; 함수: {getKey()}
        동작:
            현재 객체 집합과 보관 목록을 비교하여 제외·추가 타일을 구한다. 같은 키의 다른 객체와 같은 객체의 키 변경은 제외와 추가로 처리한다.
            제외 타일의 이전 이웃 중 현재 남아 있고 제외 대상이 아닌 타일을 영향 집합에 넣는다.
            제외 타일을 복원·해제한 뒤 생존 이웃 목록에서 제외 참조만 제거한다. 무관한 타일의 이웃 배열을 교체하지 않는다.
            추가 타일의 현재 연결을 갱신하고 영향 집합을 반환한다. 기존 생존 타일의 실행 예약은 비우지 않는다.
    #removeTile(tile: U3dQuadTile, indexCache: Map<string, Array<number>> | undefined) -> void
        동작: 유효한 원본만 복원하고 해당 타일을 원본·이웃·표면 예약·이전 완료 높이·스커트 예약 목록에서 모두 제거한다. 타일 자원을 dispose하지 않는다.
    #updateNeighbors(added: Array<U3dQuadTile>, tiles: Array<U3dQuadTile>, affected: Set<U3dQuadTile>) -> void
        동작:
            추가 타일만 현재 전체 후보에서 이웃을 검색하여 캐시하고 영향 집합에 추가한다.
            이웃의 기존 목록이 있으면 추가 타일의 역방향 참조를 중복 없이 추가하고 이웃도 영향 집합에 넣는다.
            영향 집합의 이웃 배열만 LOD·X·Y 순으로 정렬한다.
    #schedule(tile: U3dQuadTile, indexCache: Map<string, Array<number>> | undefined) -> void
        의존: U3dQuadTile — 이전 경계 추출용 메시; 함수: {getMesh()}
        동작:
            이미 표면 대상으로 예약된 타일이면 종료한다.
            아직 예약되지 않았으면 현재 바깥 두 줄 높이를 독립 보관한다. 원본 경계 정보가 있으면 최신 여부를 검사하여 복원한다.
            표면 대상과 스커트 대상에 타일을 추가한다.
    #scheduleNeighbors(tile: U3dQuadTile, indexCache: Map<string, Array<number>> | undefined) -> void
        동작: 캐시된 접한 이웃마다 표면 계산을 예약한다. 목록이 없으면 처리하지 않는다.
    #propagate(tile: U3dQuadTile, indexCache: Map<string, Array<number>> | undefined) -> void
        동작: 캐시된 이웃 중 compareTiles(tile, neighbor) 결과가 0보다 작은 우선순위 뒤의 이웃만 예약한다.

eligible(mesh: UTileMesh) -> boolean
    의존:
        U3dQuadTile — 고도·종료 상태; 함수: {isHeightLoaded(), isDisposed()}
        UPlaneBufferGeometry — 표준 격자 판정; 함수: {getSkirtIndex(), getRatio()}
    동작: 메시가 숨겨져 있지 않고 고도 준비가 끝났으며 종료되지 않았고, 스커트 인덱스와 ratio가 1이고 가로·세로 정점 수가 4보다 크고 Z 배율이 양의 유한수이면 true를 반환한다.
compareTiles(a: U3dQuadTile, b: U3dQuadTile) -> number
    동작: 실제 LOD 차이, X 차이, Y 차이 순으로 첫 0이 아닌 비교값을 반환한다.
configurationSignature(tile: U3dQuadTile, normals: boolean, unit: number) -> string
    의존:
        U3dQuadTile — 자기·부모 원본의 메시·키·변경 번호; 함수: {getMesh(), getKey()}; 속성 읽기: {heightRevision}
        TERRAIN_NORMAL_UPDATER — 상속 가능한 부모 원본 선택; 함수: {_getSharedParentNormalSource()}
    동작:
        노멀 사용 여부와 해당 타일의 키·지오메트리 ID·position/normal ID·고도 적용 번호·격자 크기·XY 배율·unit 대비 Z 배율과 Z 위치를 문자열로 연결한다.
        노멀 품질을 사용하면 상속 가능한 부모 원본의 키·고도 적용 번호·geometry 및 position/normal 속성 ID와 normal 버전도 포함한다. 원본을 선택할 수 없으면 해당 부분은 빈 값으로 연결하여 편집 보호 해제·원본 로드·교체에 따른 상속 가능 여부 변경도 감지한다. 부모 법선 버전이 다르면 내부도 전체 상속한다.
topologySignature(tiles: Array<U3dQuadTile>) -> string
    동작: 정렬된 타일의 실제 LOD·X·Y를 콜론과 세로줄로 연결한다.
sameTiles(tiles: Array<U3dQuadTile>, states: Map<U3dQuadTile, UTerrainBoundaryState>) -> boolean
    의존: U3dQuadTile — 현재 타일 키; 함수: {getKey()}
    동작: 현재 개수와 보관 개수가 다르면 false를 반환한다. 모든 현재 타일 객체의 보관 정보 객체 키와 현재 getKey()가 같으면 true를, 하나라도 다르면 false를 반환한다.
surfaceDiffers(tile: U3dQuadTile, previous: Float32Array | undefined, indexCache: Map<string, Array<number>> | undefined) -> boolean
    의존: U3dQuadTile — 확정 표면 메시; 함수: {getMesh()}
    동작:
        previous가 없으면 true로 보수적으로 전파한다.
        previous가 있을 때만 바깥 두 줄의 행 우선 인덱스를 구한다.
        바깥 스커트 행·열을 건너뛰고 실제 표면 높이만 이전 완료값과 Object.is로 비교한다. 하나라도 다르면 true를 반환하고 모두 같으면 false를 반환한다.
ringIndices(geometry: UPlaneBufferGeometry, depth: number, indexCache: Map<string, Array<number>> | undefined) -> Array<number>
    동작: 가로·세로 정점 수와 depth를 구분자로 연결한 키를 만든다. indexCache에 배열이 있으면 같은 참조를 즉시 반환한다. 없으면 행 우선으로 바깥 depth개 줄에 포함되는 0 기반 정점 인덱스를 수집하고 indexCache가 있을 때 저장한 뒤 반환한다. 위·아래 띠는 전체 열을, 중간 행은 좌·우 띠만 순회하여 내부 정점의 전체 탐색을 생략한다. 좌우 범위가 겹쳐도 중복 인덱스를 만들지 않는다.
readRing(geometry: UPlaneBufferGeometry, depth: number, normals: boolean, indexCache: Map<string, Array<number>> | undefined) -> Float32Array
    동작:
        지정 속성 배열이 없으면 빈 배열을 반환한다.
        geometry.attributes[normals ? 'normal' : 'position'].array가 존재하면 경계 인덱스를 구한다.
        경계 인덱스 순서대로 높이는 Z, 노멀은 XYZ를 독립된 Float32Array로 복사한다.
writeRing(geometry: UPlaneBufferGeometry, values: Float32Array, depth: number, normals: boolean, indexCache: Map<string, Array<number>> | undefined) -> boolean
    동작: 속성이나 보관값이 없으면 false를 반환한다. 같은 행 우선 순서로 Object.is 비교 후 다른 성분만 쓰고, 변경했으면 해당 속성의 needsUpdate를 설정한다. 변경 여부를 반환한다.
restoreTile(tile: U3dQuadTile, state: UTerrainBoundaryState, indexCache: Map<string, Array<number>> | undefined) -> void
    의존:
        U3dQuadTile — 최신 원본·수명·공간 경계·완료 정보; 함수: {getMesh(), isDisposed(), _refreshSurfaceBounds(), clearSkirtInfo()}; 속성 읽기: {heightRevision}
        TERRAIN_NORMAL_UPDATER — 경계 전용 변경 수락; 함수: {_acceptBoundaryChange()}
    동작: 타일이 종료됐거나 적용 번호 또는 정점 속성 ID가 다르면 복원하지 않는다. 같으면 높이·노멀 띠를 복원하고 높이가 바뀌었으면 공간 경계를 갱신한다. 완료 스커트를 비운다.
rectangle(tile: U3dQuadTile) -> object
    동작: 크기를 2의 음의 실제 LOD 제곱으로 구하고 X·Y 인덱스로 left·right·bottom·top·size를 반환한다.
findNeighbors(tile: U3dQuadTile, tiles: Array<U3dQuadTile>) -> Array<U3dQuadTile>
    동작: 자신을 제외하고 X·Y 겹침 길이가 모두 0 이상이고 적어도 하나가 0인 후보만 원래 우선순위로 반환한다. 양의 면적으로 겹치는 부모·자식은 제외한다.
createBoundaryContext(neighbors: Map<U3dQuadTile, Array<U3dQuadTile>>, unit: number) -> object
    역할: 한 번의 실행에서 표면·스커트·법선이 사용하는 격자 자료와 점별 판정을 공유한다.
    의존: U3dQuadTile — 현재 메시와 격자; 함수: {getMesh()}
    동작:
        비어 있는 타일별 자료 Map과 unit 및 get 함수를 가진 객체를 반환한다.
        get은 처음 사용한 타일의 메시·geometry·position 배열·격자 크기·정규화 영역·Z 배율과 위치를 읽는다.
        처음 타일을 조회할 때만 격자 크기별 공유 Map을 만든다. 같은 가로·세로 크기는 스커트를 뺀 행·열의 정규화 비율을 Float64Array로 공유하고 표면 네 변의 고유 정점 수를 보관한다.
        선택 마스크에 1이 있으면 편집 가능으로 기록한다. 마스크가 없거나 비어 있으면 isIncludeCustomBox 함수의 존재로 이전 사각 범위 보호를 유지한다.
        자기와 이웃 후보를 낮은 LOD·X·Y 순으로 정렬하고 표면 경계점 배열·공유 법선·부모 원본의 실행 내 보관 목록을 만든다. 표면 경계 밖의 점 Map과 다른 타일 기준의 설명 WeakMap은 필요할 때만 만든다. 같은 타일의 후속 get은 같은 자료를 반환한다.
        높이·법선의 수치 결과는 현재 배열에서 읽으며 이 객체를 실행기의 영속 멤버에 보관하지 않는다.
boundaryPoint(record: object, index: number, context: object) -> object
    동작:
        정점의 행·열이 실제 표면 네 변에 속하면 위·아래 변과 모서리를 제외한 좌·우 변의 순서로 겹치지 않는 배열 슬롯을 선택한다. 스커트·내부 정점은 별도 Map을 필요할 때 만들어 인덱스로 보관한다.
        선택한 배열 슬롯 또는 Map에 자료가 있으면 같은 객체를 반환한다.
        없으면 공유한 행·열 비율로 정규화 XY를 구하고 해당 타일 기준의 점 설명을 준비한다. 선택한 위치에 저장한 뒤 반환한다.
describeBoundaryPoint(record: object, point: object, context: object) -> object
    동작:
        점 설명의 소속이 현재 타일 자료이면 같은 객체를 즉시 반환한다.
        다른 타일의 점이면 설명 WeakMap을 필요할 때 만들고 이미 같은 점을 해석했으면 그 결과를 반환한다.
        없으면 현재 타일 기준으로 점 설명을 준비하여 WeakMap에 저장한 뒤 반환한다.
createPointDescription(record: object, x: number, y: number, index: number, context: object) -> object
    역할: 표면·스커트·법선이 공유할 한 점의 기여 이웃·표본·보호 판정을 준비한다.
    동작:
        정렬한 자기·이웃 중 점이 경계에 접하는 후보만 남긴다. 편집 가능한 후보를 보호 판정할 때만 보간 인덱스와 가중치를 먼저 준비한다.
        기여하는 선택 정점이 하나라도 있으면 보호 대상으로 기록하며 그 뒤 후보의 추가 보호 표본은 생략한다. 보호되지 않고 자기 외의 접한 이웃이 있으면 connected를 참으로 기록한다. 좌표·인덱스·소속 타일 자료와 이웃·표본·보호 결과를 반환한다.
boundarySample(point: object, candidate: object) -> object
    동작: 접한 후보 순서에 대응하는 배열에 표본이 있으면 반환한다. 없으면 해당 후보의 보간 인덱스·가중치만 준비하여 저장하고 반환한다.
onBoundary(r: object, point: object) -> boolean
    동작: 크기의 1e-9 허용 오차 안에서 점이 영역 안에 있고 적어도 한 변에 접하면 true를 반환한다.
validHeight(height: number) -> boolean
    의존: UDEF — NoData 예약값; 상수: {TERRAIN_NO_DATA}
    동작: 유한수이고 NoData 원값 및 Float32 반올림값이 아니면 true를 반환한다. 0은 유효하다.
boundarySamples(record: object, point: object) -> object
    동작:
        저장한 영역과 격자 크기로 정규화 점을 내부 격자 좌표로 환산하고 범위로 제한한다.
        좌우 경계이면 Y, 나머지는 X를 보간 축으로 선택한다. 정수와의 차이가 1e-7 미만이면 정수에 맞춘다.
        첫 표본 인덱스·두 번째 표본 인덱스·가중치를 반환한다. 가중치가 0이면 두 인덱스는 같다.
sampleBoundary(record: object, samples: object) -> number | undefined
    동작:
        현재 position 배열에서 첫 높이를 읽는다. 유효하지 않으면 undefined를 반환한다.
        fraction이 1e-7 미만이면 두 번째 표본을 읽지 않고 첫 높이를 월드 높이로 환산한다.
        그 밖에는 유효한 두 번째 높이까지 선형 보간하여 저장한 Z 배율·위치로 환산한다. 유효하지 않은 두 번째 높이는 undefined를 반환한다.
editedBoundaryPoint(geometry: UPlaneBufferGeometry, samples: object) -> boolean
    의존: UPlaneBufferGeometry — 정밀 편집 선택과 이전 사각 범위; 속성 읽기: {editedVertexMask}; 함수: {isIncludeCustomBox()}
    동작:
        정밀 표시 배열 길이가 truthy이면 첫 정점의 표시 또는 fraction이 0보다 큰 두 번째 정점의 표시 여부를 반환한다.
        마스크가 없거나 비어 있으면 같은 인덱스의 행·열에 기존 사각 범위 보호를 적용한다. fraction이 0이면 두 번째 정점은 확인하지 않는다.
hasEditedVertices(tile: U3dQuadTile) -> boolean
    의존: U3dQuadTile — 실제 선택 표시; 함수: {getMesh()}
    동작: 메시 지오메트리의 editedVertexMask에 1이 있으면 true, 배열이 없거나 선택이 없으면 false를 반환한다.
chooseHeight(record: object, point: object) -> number | undefined
    동작:
        점이 보호 대상이면 undefined를 반환한다. 뒤 후보의 보호도 이미 반영되어 먼저 찾은 유효 높이를 적용하지 않는다.
        접한 후보 순서대로 필요한 표본과 현재 경계 높이를 읽어 처음 유효한 월드 높이를 자기 로컬 Z로 환산한다. 유효한 후보가 없으면 undefined를 반환한다.
stitchSurface(record: object, context: object, indexCache: Map) -> boolean
    동작:
        바깥 두 줄의 인덱스 중 스커트와 유효하지 않은 표면 높이를 제외한다.
        같은 정점의 준비 자료로 기준 높이를 선택한다. 정의된 결과의 Float32 값이 다를 때만 표면 Z를 쓰고 실제 변경 여부를 반환한다.
collapseSkirt(record: object, context: object, indexCache: Map) -> boolean
    동작:
        이웃이 없으면 false를 반환한다. 바깥 스커트 인덱스를 대응하는 자기 표면 정점으로 제한한다.
        준비 자료가 연결 가능하고 현재 표면 높이가 유효할 때만 다른 스커트 Z를 복사한다. 실제 변경 여부를 반환한다.
connectBoundaryNormals(tiles: Array<U3dQuadTile>, pending: Set<U3dQuadTile>, context: object, indexCache: Map) -> void
    의존: TERRAIN_NORMAL_UPDATER — 경계 전용 변경 수락; 함수: {_acceptBoundaryChange()}
    동작:
        pending이 비면 종료한다. 예약 타일과 그 이웃을 대상 Set으로 합친다.
        정렬된 타일 중 대상이고 normal 속성이 있는 격자의 경계를 연결한다. 실제 성분이 바뀌면 normal.needsUpdate를 켜고 법선 서비스에 경계 전용 변경을 알린다.
parentNormalSource(record: object) -> U3dQuadTile | undefined
    의존: TERRAIN_NORMAL_UPDATER — 공유할 원본 선택; 함수: {_getSharedParentNormalSource()}
    동작: 해당 실행에서 처음 조회할 때만 원본을 선택하고 적용 불가 undefined도 보관한다. 그 뒤에는 같은 결과를 반환한다.
connectTileNormals(record: object, context: object, pending: Set<U3dQuadTile>, indexCache: Map) -> boolean
    의존:
        TERRAIN_NORMAL_UPDATER — 부모 법선 기록 함수 준비; 함수: {_createParentNormalWriter()}
        normalizedNormal — 기여 법선 정규화; 함수: {normalizedNormal()}
    동작:
        부모 원본과 정점 기록 함수를 준비한다.
        실제 표면 경계만 순회하고 비예약 타일에서는 예약 이웃과 접하는 점만 처리한다.
        유효하지 않은 높이와 자기 편집 정점을 제외한다. 같은 원본을 참조하는 경계이면 부모 법선을 먼저 기록한다.
        부모 기록에 성공하지 않았으면 연결 가능한 점의 공유 법선을 읽는다. 없으면 자기 표면 삼각형 기여로 돌아간다.
        공통 법선을 로컬로 환산해 실제 변경 성분만 쓴다. 확정한 표면 법선을 자기 스커트에 복사하고 변경 여부를 반환한다.
sharesParentNormalSource(record: object, source: U3dQuadTile, point: object) -> boolean
    동작: 접한 후보 중 자기와 원본 타일을 제외한 이웃의 원본이 source와 다르면 false, 모두 같으면 true를 반환한다.
sampleSharedNormal(record: object, point: object, context: object) -> Array<number> | undefined
    의존: normalizedNormal — 보간 결과 정규화; 함수: {normalizedNormal()}
    동작:
        접한 후보 중 선순위 타일을 기준으로 점을 해석하고 편집 보호 대상이면 undefined를 반환한다.
        기준 타일의 표본을 준비하여 첫 표본의 공유 법선을 읽고 가중치가 0이면 그대로 반환한다. 그 밖에는 두 번째 표본도 유효할 때만 선형 보간·정규화한다.
sharedVertexNormal(record: object, index: number, context: object) -> Array<number> | undefined
    동작:
        해당 정점의 보관값이 있으면 적용 불가 undefined를 포함해 반환한다.
        점이 보호되지 않았으면 자기 우선순위에서 삼각형 기여를 합치거나 선순위 이웃의 공유 법선을 보간한다. 결과를 이번 실행 자료에만 보관하고 반환한다.
sumVertexNormals(record: object, point: object, context: object) -> Array<number> | undefined
    의존: normalizedNormal — 기여 법선 정규화; 함수: {normalizedNormal()}
    동작: 접한 후보 중 같은 LOD이고 가중치가 0인 정확한 표본의 표면 삼각형 기여만 합쳐 정규화한다.

accumulateIncidentNormals(tile: U3dQuadTile, index: number, unit: number, sum: number[]) -> void
    동작: 실제 표면 정점에 접한 최대 네 셀만 순회한다. 각 셀의 A·B·D와 B·C·D 삼각형 중 index를 포함하는 삼각형만 누적한다. 스커트 셀은 제외한다.
accumulateTriangleNormal(tile: U3dQuadTile, a: number, b: number, c: number, unit: number, sum: number[]) -> void
    동작: 세 로컬 Z 높이가 유효하지 않으면 누적하지 않는다. 삼각형 변의 XY는 메시 배율로, Z는 메시 Z 배율을 공통 unit으로 나누어 비교 좌표로 변환한다. 두 변의 외적을 정규화 전에 sum에 누적한다. 높이 위치 절편은 변의 차에서 상쇄한다.
writeSharedNormal(mesh: UTileMesh, index: number, normal: number[], unit: number) -> boolean
    의존: normalizedNormal — 법선 정규화와 퇴화 방향 제외; 함수: {normalizedNormal()}
    동작: 공통 방향에 타일 XYZ 배율을 곱하되 Z에는 unit을 상쇄하여 로컬 법선으로 변환하고 정규화한다. 무효 방향은 기록하지 않는다. 각 성분을 Math.fround로 변환한 값이 다를 때만 공유 normal 배열을 수정한다. 실제 변경 여부를 반환한다.
copyConnectedSkirtNormals(geometry: UPlaneBufferGeometry, indexCache: Map<string, Array<number>> | undefined) -> boolean
    동작: 바깥 한 줄의 스커트 인덱스를 순회한다. 각 인덱스의 행·열을 실제 표면 범위로 제한한 위치의 XYZ 법선을 복사한다. 같은 성분은 쓰지 않고 실제 변경 여부를 반환한다.
commit(tile: U3dQuadTile, normals: boolean, boundaryOnly: boolean, indexCache: Map<string, Array<number>> | undefined) -> void
    의존: TERRAIN_NORMAL_UPDATER — 법선 갱신과 경계 입력 변경 기록; 함수: {_updateBoundary(), _acceptBoundaryChange()}
    동작:
        position.needsUpdate를 설정한다.
        법선 갱신이면 TERRAIN_NORMAL_UPDATER._updateBoundary에 경계 세 줄 인덱스와 내부 준비 여부를 전달한다.
        그 밖에는 TERRAIN_NORMAL_UPDATER._acceptBoundaryChange로 경계 전용 위치 변경을 기록한다.
        타일의 표면 바운딩을 갱신한다.

findNearGeometry(tile: U3dQuadTile, terrainLayer: U3dTerrainLayer, cache: Map) -> USkirtInfo
    의존:
        U3dQuadTile — 키와 현재 높이 배율; 함수: {getKey(), getMesh()}
        USkirtInfo — 방향별 정보 생성·등록; 생성자: {new USkirtInfo()}; 함수: {set()}; 상수: {DIRECTION}
        USkirtNode — 찾은 이웃의 완료 상태; 생성자: {new USkirtNode()}; 함수: {setTile(), setGeometry()}
        U3dTerrainLayer — 캐시 메시 조회; 함수: {getCacheByKey()}
    동작:
        자기 배율과 네 방향 좌표를 준비한다. 각 방향은 최대 5회 x_y_level 키를 조회하며 같은 실행의 키 조회 결과를 cache에서 공유한다.
        메시가 없으면 자기와 이웃 좌표를 함께 부모로 올리고 같은 좌표가 되면 종료한다. 검색 중에는 수치 좌표만 사용한다.
        실제 이웃이 있을 때만 완료 비교 노드를 만들고 타일·geometry·상대 Z 배율을 연결하여 방향별 정보로 반환한다.
computeSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, info: USkirtInfo, direction: string, write: Function | undefined = undefined, skip: Function | undefined = undefined) -> boolean
    의존:
        U3dQuadTile — 완료 비교와 배율; 함수: {getSkirtInfo(), getScale()}
        USkirtInfo — 방향별 작업과 이웃; 함수: {equalsNode(), getWorkType(), get()}; 상수: {DIRECTION}
        USkirtNode — 이웃 배율의 타일; 함수: {getTile()}
        UPlaneBufferGeometry — 격자 간격·기본 높이·편집 보호; 함수: {getRatio(), getSkirtIndex(), getDefaultHeight(), isIncludeCustomBox()}; 속성 읽기: {editedVertexMask}
    동작:
        해당 방향의 완료 정보가 같으면 false를 반환한다. 작업 종류·이웃·자기와 이웃 배율·기본 높이를 방향당 한 번 준비한다.
        방향에 맞는 바깥 정점과 자기 안쪽 정점을 같은 ratio 간격으로 순회한다. 실제 편집된 바깥 정점과 skip이 참인 정점은 높이 계산 전에 제외한다.
        나머지 정점의 높이를 계산하여 write가 있으면 정점 인덱스와 높이를 전달하고, 없으면 대상 Z에 직접 기록한다. 방향별 계산을 수행했으면 true를 반환한다.

getSkirtHeight(worldX: number, worldY: number, targetGeometry: UPlaneBufferGeometry, scale: object, direction: string = 'x') -> number
    의존: UPlaneBufferGeometry — 이웃 내부 격자 높이; 함수: {getSkirtIndex(), getPointAtIndex()}
    동작: 이웃의 격자 간격·오프셋·배율로 월드 XY를 내부 격자 좌표로 바꾼다. 정수와의 차이가 0.001 미만이면 올림, 아니면 내림한다. direction이 x이면 다음 열, 아니면 다음 행을 선택한다. 두 정점을 배율로 환산하여 지정 방향의 거리 비율로 선형 보간한다. 다음 인덱스가 내부 표본 수와 같으면 시작 높이를 반환한다.

computeSkirtValue(workType: string, vertices: ArrayLike<number>, offsetX: number, offsetY: number, tileScale: object, defaultHeight: number, targetIndex: number, selfIndex: number, skirtNode: USkirtNode | undefined, targetScale: object | undefined, direction: string = 'x') -> number
    인터페이스: tileScale과 targetScale은 x·y·z 배율 성분을 가진 객체이며 getScale()의 반환값을 사용한다.
    의존:
        USkirtNode — 이웃 자료; 함수: {getGeometry()}
        UPlaneBufferGeometry — 이웃 정점 보간; 함수: {getSkirtIndex(), getPointAtIndex()}
        isWrong — 유효하지 않은 수치 판정; 함수: {isWrong()}
        UDEF — 오류 대체 높이; 상수: {TERRAIN_NO_DATA}
        __GInfo__ — 계산 오류 알림; 함수: {__GInfo__()}
    동작:
        SET_DEFAULT이면 기본 높이를 사용한다.
        SET_SELF이면 자기 안쪽 정점 높이를 사용한다.
        SET_VALUE이면 경계의 월드 XY를 이웃 격자 인덱스로 환산한다. 정수와의 차이가 0.001 미만이면 올림, 아니면 내림을 사용한다.
        이웃의 내부 정점 두 개를 배율로 환산하여 지정 방향 거리 비율로 보간한다. 다음 인덱스가 내부 폭 또는 높이와 같으면 시작 높이를 그대로 사용한다.
        SET_VALUE의 보간 결과는 이웃 표시 높이이므로 자기 Z 배율로 나누어 로컬 높이로 환산한다.
        기본 높이 경로가 아니고 결과가 falsy이면서 0이 아니면 기존 경계 높이로 대체한다. 정상 0은 그대로 사용한다.
        isWrong 결과가 참이면 알림을 남기고 TERRAIN_NO_DATA로 대체한다.
        계산한 높이를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
indexCache는 prepare·execute·restore의 호출마다 독립된 지역 Map이며 영속 멤버나 정보 객체에 저장하지 않는다. 하위 호출에 같은 Map을 전달하고 같은 가로·세로 정점 수·깊이에만 인덱스 배열을 공유한다. 공유 인덱스는 수정하지 않고 높이·법선 보관 배열은 기존처럼 독립 복사한다. indexCache가 undefined인 내부 직접 호출은 새 인덱스를 생성한다.
prepare → 기존 스커트 → execute 순서로 사용한다. prepare가 true이거나 기존 방향별 스커트가 바뀌면 execute를 호출한다.
좌표는 타일 인덱스의 dyadic 영역을 사용한다. 비표준 ratio·스커트 없는 지오메트리·0 이하 배율은 기존 스커트 경로에 맡긴다.
NoData 구간은 표면 연결 성공 범위에서 제외하며 원래 경계를 유지한다. 인접 표면 노멀의 완전한 일치는 보장하지 않는다.
편집 경계에서는 편집되지 않은 이웃으로 높이를 전파하지 않는다. 서로 다른 편집 높이의 연속성을 강제하지 않으며 기존 스커트 처리를 유지한다.
편집 변경·삭제는 원본 고도와 남은 편집을 재적용하고 changeHeight·changeGeometry로 고도 적용 번호를 갱신해야 한다. 표시 배열만 직접 수정하는 것은 완료 알림이 아니다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
