# UTerrainNormalUpdater 명세

> 상태: 구현과 회귀 검증 반영

## 1. 개요

높이 적용과 경계 연결이 같은 법선 갱신 정책을 사용하게 한다. 부모 표면 법선으로 전체를 채울 수 있으면 중복된 기하 법선 계산을 생략한다. 편집·병합·NoData·품질 변경의 대체 계산과 GPU 갱신 표시도 이 객체가 관리한다.

## 2. 요구사항과 품질 기준

```spec
부모 고도 보간과 실제 위치·높이·인덱스는 변경하지 않는다.
원본 최대 레벨을 넘는 편집되지 않은 타일에 검증된 원본 법선을 보간한다.
부모 보간이 전체 또는 요청 부분을 덮지 못하면 기하 법선을 계산한 뒤 적용 가능한 부모 법선만 덮어쓴다.
병합 고도는 레이어가 지정한 상속 제외를 이후 경계 갱신에서도 유지한다.
버전·속성·원본·좌표·격자 또는 고도 변경 번호가 달라지면 이전 준비 상태를 재사용하지 않는다.
타일별 준비 상태는 약한 참조로 보관하며 조상 타일·앱의 수명을 별도로 연장하지 않는다.
```

## 3. 정규 자연어 수도코드

```spec
TERRAIN_NORMAL_UPDATER: UTerrainNormalUpdater = 새 UTerrainNormalUpdater
    고도 레이어·경계 실행기·UHeightUtil 호환 진입점이 공유하는 법선 서비스

UTerrainNormalUpdateOptions 부분 타입 명세
    이 명세에서 사용하는 필드:
        maxLevel?: number
            원본 고도의 최대 레벨
        allowParent?: boolean = true
            병합하지 않은 부모 법선의 상속 허용 여부
        recomputeNormals?: boolean = true
            현재 품질의 법선 준비 여부

UTerrainNormalUpdater 클래스 정의
    _update(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, options: UTerrainNormalUpdateOptions = {}) -> void
        동작: 이름 있는 정책에서 최대 레벨·부모 상속·현재 품질을 읽는다. 계산 품질이면 전체를 준비하고 낮은 품질이면 최신 상속 정책과 미준비 상태를 기록한다.
    #states: WeakMap<U3dQuadTile, UTerrainNormalState> = 빈 WeakMap
    _updateSurface(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, maxLevel: number | undefined = undefined, allowParent: boolean = true) -> boolean
        동작:
            원본을 선택한다.
            원본이 low 품질에서 미준비로 기록되었으면 화면 표시 여부와 무관하게 원본 법선을 먼저 준비한다. 기존에 준비한 부모나 외부에서 제공한 원본을 무조건 재계산하지 않는다.
            준비를 마친 원본과 현재 타일 입력을 보관 상태와 비교한다. ready가 참이고 모든 입력이 같으면 재계산하지 않는다.
            부모 보간을 먼저 시도하고 전체를 채우지 못하면 전체 기하 법선을 계산한 뒤 유효한 부모 값만 다시 적용한다.
            변경된 법선을 GPU에 알리고 현재 준비 상태를 기록한다.
    _ensure(tile: U3dQuadTile, geometry: UPlaneBufferGeometry) -> boolean
        동작: 병합 상속 정책을 유지하여 현재 법선의 준비 여부를 확인하고 필요한 경우 갱신한다.
    _defer(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, allowParent: boolean) -> void
        동작: 현재 입력과 상속 정책을 ready=false로 기록한다. 법선과 GPU 변경 번호는 쓰지 않으며 품질을 높이면 전체를 준비한다.
    _updateBoundary(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, indices: ReadonlyArray<number>, boundaryOnly: boolean) -> void
        처리 기준: boundaryOnly는 호출자가 비경계 내부의 유효성을 확인한 경우에만 참이다.
        동작:
            내부가 미확정이거나 부모 원본이 바뀌면 전체를 갱신한다.
            그 밖에는 지원되는 경계 부분 계산과 부모 부분 보간을 조합한다.
            부모 보간으로 요청 전체를 채우면 중복된 기하 계산을 생략한다.
    _attach(tile: U3dQuadTile, geometry: UPlaneBufferGeometry) -> void
        동작: 레이어가 준비한 같은 속성의 연결 완료를 확인하고 타일의 최신 고도 변경 번호를 기록한다.
    _acceptBoundaryChange(tile: U3dQuadTile, geometry: UPlaneBufferGeometry) -> void
        처리 기준: 경계만 바꾼 엔진 경로에서 호출하며 고도 번호·속성이 달라진 상태는 수락하지 않는다.
        동작: 현재 position·normal 버전을 기록하되 보간에 사용한 부모 버전은 변경하지 않는다.
    _applyParentNormals(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, maxLevel: number | undefined = undefined, indices: ReadonlyArray<number> | undefined = undefined) -> boolean
        동작: 기존 공개 UHeightUtil.applyParentNormals의 원본 선택·기록·성공 판정 계약을 수행한다.
    _getParentNormalSource(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, maxLevel: number | undefined = undefined) -> U3dQuadTile | undefined
        동작: 고도 레이어의 실제 상한, 부모 체인, 격자·법선·편집 상태와 유효한 영역을 확인하여 원본을 선택한다.
    _getSharedParentNormalSource(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, maxLevel: number | undefined = undefined) -> U3dQuadTile | undefined
        동작: 병합 제외 정책을 먼저 확인하고 허용된 타일만 원본을 선택한다. 경계 연결의 원본 조회도 이 정책을 따른다.
    _createParentNormalWriter(source: U3dQuadTile, tile: U3dQuadTile, geometry: UPlaneBufferGeometry) -> ((index: number) -> boolean)
        의존:
            UMathEngine — 부모·대상 중심 Y의 실제 높이 축척; 정적 함수: {getRealScaleAtGoogle()}
        동작: 고정 보간 계수를 준비하고 한 정점을 기록하는 지역 함수를 반환한다.
    #calculate(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, source: U3dQuadTile | undefined, indices: ReadonlyArray<number> | undefined = undefined) -> void
        동작:
            부모 보간 성공 정점 수와 요청 정점 수가 같으면 기하 계산을 생략한다.
            그 밖에는 요청 범위의 기하 법선을 계산하고 성공했던 부모 값이 있으면 다시 보간한다.
            normal.needsUpdate를 설정한다.
    #inherit(source: U3dQuadTile, tile: U3dQuadTile, geometry: UPlaneBufferGeometry, indices: ReadonlyArray<number> | undefined = undefined) -> number
        의존:
            UMathEngine — 부모·대상 중심 Y의 실제 높이 축척; 정적 함수: {getRealScaleAtGoogle()}
        동작:
            인덱스가 있으면 준비한 정점 기록 함수를 반복하고 성공 수를 센다.
            전체 상속에서는 행별 Y와 축척을 재사용하여 표면·스커트 정점에 부모 법선을 보간한다.
            위치와 인덱스는 변경하지 않는다.
    #allowParent(tile: U3dQuadTile, geometry: UPlaneBufferGeometry) -> boolean
        동작: 같은 배열이면 마지막 병합 제외 정책을 반환하고 교체된 격자는 상속을 허용한다.
    #remember(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, source: U3dQuadTile | undefined, allowParent: boolean) -> void
        동작: 대상과 부모의 입력 스냅샷 및 상속 정책을 약한 타일 키에 기록한다.

sameArrays(value: UTerrainNormalStamp, geometry: UPlaneBufferGeometry) -> boolean
    동작: 위치·법선 배열의 동일성을 비교한다.
sameSurface(value: UTerrainNormalStamp, tile: U3dQuadTile, geometry: UPlaneBufferGeometry) -> boolean
    동작: 배열·높이 번호·격자 크기·스커트·좌표·중심 Y를 비교한다.
matchesStamp(value: UTerrainNormalStamp, tile: U3dQuadTile, geometry: UPlaneBufferGeometry) -> boolean
    동작: 같은 표면인지 확인하고 위치·법선의 속성 변경 번호도 비교한다.
matchesSource(value: UTerrainNormalStamp | undefined, source: U3dQuadTile | undefined) -> boolean
    동작: 부모 유무가 같고 존재하는 부모 입력도 같은지 판정한다.
stamp(tile: U3dQuadTile, geometry: UPlaneBufferGeometry) -> UTerrainNormalStamp
    동작: 비교할 배열·변경 번호·격자·좌표 수치만 새 일반 객체로 만든다.
terrainGeometry(tile: U3dQuadTile) -> UPlaneBufferGeometry | undefined
    동작: 메시의 지형 격자를 반환하며 다른 지오메트리는 제외한다.
hasEdits(geometry: UPlaneBufferGeometry) -> boolean
    동작: 인수 없는 getCustomBox가 반환하는 목록의 크기로 편집 존재 여부를 판정한다.
attributeVersion(attribute: BufferAttribute | InterleavedBufferAttribute) -> number
    동작: 일반 속성은 version을 사용하고 교차 배열 속성은 data.version을 사용한다.
createParentNormalSampler(parent: UPlaneBufferGeometry, geometry: UPlaneBufferGeometry, heightRatio: number) -> ((x: number, y: number, index: number) -> boolean)
    동작:
        배열·격자 크기·축척을 보관한 지역 함수를 반환한다. 정점마다 부모 객체에서 같은 속성을 다시 조회하지 않는다.
    지역 함수 copyParentNormal(x: number, y: number, index: number) -> boolean
        동작:
            부모의 같은 삼각형에서 세 꼭짓점 법선을 보간하고 XY 높이 축척을 보정하여 정규화한다.
            대상 또는 기여 부모 정점이 NoData이거나 방향이 비유한·퇴화이면 false로 유지한다.
normalLength(x: number, y: number, z: number) -> number
    동작: 제곱합이 유한한 정규수이면 sqrt를 사용하며 그 밖에는 hypot로 범위와 극소 수치를 보존한다.

normalizedNormal(x: number, y: number, z: number) -> Array<number> | undefined
    동작: 유효한 방향을 정규화한다. 빠른 제곱합이 범위를 벗어나면 안정적인 길이 계산으로 대체하고 퇴화·비유한 방향은 제외한다.

UTerrainNormalStamp 타입 정의
    positions: TypedArray
    normals: TypedArray
    positionVersion: number
    normalVersion: number
    heightRevision: number
    width: number | undefined
    height: number | undefined
    skirt: number
    minX: number
    maxX: number
    minY: number
    maxY: number
    centerY: number

UTerrainNormalState 타입 정의
    surface: UTerrainNormalStamp
    source: UTerrainNormalStamp | undefined
    allowParent: boolean
    ready: boolean
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
