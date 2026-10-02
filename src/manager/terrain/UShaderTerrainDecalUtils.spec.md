# UShaderTerrainDecalUtils 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

terrain decal 기능이 여러 객체에 흩어져 반복 구현하기 쉬운 계산을 한 모듈로 모아 둔 함수 모음이다. source identity 비교, LOD feature 선별, feature 정규화와 hash, tile-local 좌표 변환과 clipping, GPU texture로 올릴 packed 상태 생성, 그리고 그 상태를 material uniform과 define으로 옮기는 변환을 담당한다. 상태를 소유하는 객체가 아니라 입력을 받아 결과를 만드는 모듈 함수 집합이므로, 같은 계산을 manager, tile 상태 관리, Worker 준비 task, shader가 동일한 규칙으로 재현할 수 있게 하는 것이 존재 이유다.

### 1.2 책임 범위

이 단위는 자체 상태를 보관하지 않고 인수로 받은 값과 매개변수 객체만 다룬다. terrain tile의 등록·표시·해제 시점, Worker 실행 여부, 합성 계획 수립은 담당하지 않는다. 즉시 경로(immediate build)에서 Worker 없이 packed 상태를 만드는 계산과, Worker가 만든 결과를 material 상태로 바꾸는 계산만 담당한다.

책임 경계: `TerrainTileEntry`와 `TerrainManagerOption`은 `UShaderTerrainDecalManager`가 소유하는 상태·옵션이고 이 단위는 필요한 필드만 읽는다. 다만 `resolveTerrainTileMesh()`와 `createTerrainPreparedFeatureBaseImmediate()`, `normalizeTerrainFeatureRequest()`는 호출자가 넘긴 객체에 값을 되써 cache로 활용하므로 그 쓰기 범위는 이 단위가 규정한다.

### 1.3 주요 동작 방식

feature 입력은 `normalizeTerrainFeatureRequest()`로 유형·좌표·스타일·revision이 확정된 정규 feature가 되고, 여기서 계산된 immutable hash와 tile별 hash가 이후 cache key와 signature의 기준이 된다. tile 단위 처리는 정규 feature에서 Worker와 공유할 `buildTerrainFeatureBase()` 결과를 만들고, feature 수와 좌표 수가 한도 안이면 `shouldUseImmediateTerrainBuild()`가 즉시 경로를 허용한다. 즉시 경로에서는 feature마다 `prepareTerrainFeatureEntryImmediate()`가 tile-local 좌표와 평면 범위를 확정하고, 유형별로 path·area·circle packed 상태를 만들어 `buildImmediateTerrainWorkerResult()`가 Worker 결과와 같은 모양으로 묶는다. 마지막으로 `createTerrainMaterialStateFromWorkerResult()`가 packed 배열을 float data texture와 uniform으로 옮기고 어떤 도형 define을 켜야 하는지 결정한다.

관찰된 실행 특성: path는 polyline이 아니라 선분 하나를 texture 한 texel로 펼친 선형 레이아웃을 사용하고, 선분 수가 `TERRAIN_DECAL_PATH_BUCKET_THRESHOLD`를 넘을 때만 bucket index를 만든다. area는 행 header texel 뒤에 점 목록을 한 번만 기록하는 선형 레이아웃을 사용한다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalManager`는 작업 우선순위, source identity 판정, 즉시 경로 build, material 상태 생성, bucket 상수를 가져다 쓴다. `UShaderTerrainDecalTileStateManager`는 feature base 생성과 cache key, tile signature, cache 복제, byte 추정, uniform texture 해제를 가져다 쓴다. `UTerrainDecalComposeScheduler`는 `resolveTerrainTileMesh()`만 사용한다. `U2dVectorShaderLayer`는 LOD 선별과 hash, 작업 우선순위를 사용하고, `U3dShaderMeasureLayer`는 hash 계산 두 개를 사용한다. `union3d/worker/task/model/vector/UTerrainDecalPrepareTask.js`의 `packAreaEntries()`는 이 단위의 area 선형 레이아웃과 같은 계약을 Worker 쪽에서 구현한다.

`test/terrain-decal-area-layout.test.mjs`, `test/terrain-decal-composition-contract.test.mjs`, `test/terrain-decal-manager.test.mjs`, `test/terrain-decal-lod.test.mjs`, `test/terrain-payload-performance.test.mjs`가 이 단위의 export를 직접 불러 사용한다. 테스트의 존재만 확인했고 실행 결과는 확인하지 않았다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
source identity 비교는 Base Feature namespace 호환성과 collection 변경 상태를 구분해야 하며, collection revision은 호환성 판정과 Base Cache 범위 key에서 제외해야 한다.
LOD 선별은 outer와 hole처럼 함께 표시해야 하는 feature를 같은 lodGroupKey 그룹으로 묶어 분리하지 않아야 하고, 강조·선택·runtime feature는 budget과 filter와 무관하게 표시해야 한다.
feature hash는 tile 위치와 clipping에 의존하지 않는 immutable 부분과 tile별 부분을 분리해, 같은 feature를 여러 tile에서 재사용할 수 있어야 한다.
즉시 경로와 Worker 경로는 같은 packed 레이아웃 계약을 만들어야 하며, shader와 합성기가 두 경로를 구분하지 않고 읽을 수 있어야 한다.
area packed 상태의 데이터 texture는 앞쪽 rowCount texel을 행 header vec4(pointCount, shaderLayerRenderOrder, compositionBatchIndex, pointStart)로 두고 그 뒤에 entry별 점 목록을 한 번만 기록해야 한다.
path packed 상태는 선분 하나를 한 texel로 두어 shader가 polyline 내부 반복 없이 선분 하나의 거리 판정만 수행할 수 있어야 한다.
packed 상태에서 만든 float data texture는 필터링·mipmap·좌표 반복 없이 원본 값을 그대로 읽을 수 있어야 한다.
적용할 항목이 하나도 없는 도형은 define을 켜지 않고 항목 수 0을 반환해야 한다.
cache에서 복제한 상태는 호출자가 tile key와 revision을 바꿔도 원본 packed 배열의 참조 관계를 깨지 않아야 한다.
```

## 3. 정규 자연어 수도코드

```spec
TerrainPoint 타입 정의
    x, y: number
        평면 좌표
    z?: number
        높이 좌표

TerrainColorChannels 타입 정의
    r?, g?, b?: number
        0에서 1 범위의 색상 채널

TerrainColor 타입 정의
    Color | Array<number> | TerrainColorChannels | ColorRepresentation
        terrain decal이 허용하는 색상 표현이며 배열은 RGBA 순서다.

TerrainStyle 타입 정의
    fillColor?, strokeColor?, color?: TerrainColor
        면 색상, 선 색상과 둘의 기본값으로 쓰는 색상
    fillOpacity?, strokeOpacity?, opacity?: number
        면 투명도, 선 투명도와 둘의 기본값으로 쓰는 투명도
    strokeWidth?: number
        선 두께
    visible?: boolean
        표시 여부이며 false 만 숨김으로 본다.
    highlight?: boolean
        강조 여부

TerrainPreparedStyle 타입 정의
    fillColor, strokeColor: Array<number>
        RGBA 4개 성분으로 확정된 색상
    fillOpacity: number
        면 투명도이며 음수는 hole 표식이다.
    strokeOpacity: number
        0에서 1로 보정된 선 투명도
    strokeWidth: number
        0.0001 이상으로 보정된 선 두께
    visible: boolean
        표시 여부

TerrainBounds 타입 정의
    minX, minY, maxX, maxY: number
        bucket 격자 index 범위

TerrainDecalLodBand 타입 정의
    minLevel?, maxLevel?: number
        구간을 적용할 tile level 범위
    minPriority?: number
        표시할 최소 feature 우선순위
    maxFeatures?: number
        표시할 최대 feature 수

TerrainLodFilter 함수 타입 정의
    (feature: TerrainFeature, tileLevel: number) -> boolean
    인터페이스: 표시를 허용할 때만 true 를 반환하며, true 가 아닌 모든 값은 제외로 해석된다.

TerrainDecalLodProfile 타입 정의
    id?: string
        profile 식별자
    version?: number
        profile 변경 버전
    bands?: Array<TerrainDecalLodBand>
        tile level별 선별 구간이며 앞에서부터 처음 일치한 구간만 적용한다.
    filter?: TerrainLodFilter
        구간 판정 뒤에 적용하는 추가 선별 함수

TerrainDecalLodSelection 타입 정의
    features: Array<TerrainFeature>
        실제 렌더링할 feature 목록
    sourceFeatureCount: number
        선별 전 feature 수
    renderFeatureCount: number
        선별 후 feature 수
    profileId: string
        적용된 profile 식별자
    profileVersion: number
        적용된 profile 버전

TerrainDecalUvTransform 타입 정의
    scale: Array<number>
        부모 texture를 자식 범위로 줄이는 UV 축척
    offset: Array<number>
        자식 사분면의 UV 시작 위치

TerrainSourceIdentity 타입 정의
    sourceId: string
        source collection 식별자
    sourceLayerId: string
        source를 제공하는 layer 식별자
    featureNamespaceVersion: number
        feature ID namespace 버전
    propertySchemaVersion: number
        property schema 버전
    geometryEncodingVersion: number
        geometry encoding 버전
    sourceCollectionEpoch: number
        source collection 전체 교체 시에만 증가하는 epoch
    sourceCollectionRevision: number
        source collection의 권위 있는 변경 revision

TerrainSourceSyncSnapshot 타입 정의
    sourceIdentity: TerrainSourceIdentity
        정규화된 source identity
    sourceRevision: number
        manager source revision
    origin: TerrainPoint
        tile local 좌표 기준점
    lodProfileId: string
        LOD profile 식별자
    lodProfileVersion: number
        LOD profile 버전
    sourceFeatureCount: number
        LOD 선별 전 feature 수
    renderFeatureCount: number
        실제 렌더링할 feature 수
    requestedTargetRenderOrder?: number
        레이어가 요청한 원래 image layer 순서
    targetRenderOrder?: number
        source 를 적용할 image layer 순서 상한

TerrainPayloadFullReason 타입 정의
    'full:no-snapshot' | 'full:source-identity-changed' | 'full:source-collection-epoch-changed' | 'full:delta-cost' | 'full:worker-state-miss'
        Worker Payload 를 full 로 보낸 명시적 사유이며 이 다섯 값만 허용한다.

TerrainSourceStatus 타입 정의
    'unknown' | 'pending' | 'available' | 'confirmed-empty' | 'failed' | 'cancelled' | 'disposed'
        terrain source 요청의 현재 상태이며 이 일곱 값만 허용한다.

TerrainSourceState 타입 정의
    requestToken?: string
        최신 요청 식별자
    revision?: number
        최신 source revision
    status: TerrainSourceStatus
        요청 상태
    errorReason?: string
        실패 또는 취소 사유
    sourceIdentity?: TerrainSourceIdentity
        최신 권위 source identity
    syncSnapshot?: TerrainSourceSyncSnapshot
        마지막으로 승인한 tile-local source snapshot
    ownerLayer?: U3dLayer
        source 가 직접 소유한 image binding 을 찾기 위한 레이어
    requestedTargetRenderOrder?: number
        레이어가 요청한 원래 image layer 순서
    targetRenderOrder?: number
        source 를 적용할 image layer 순서 상한
    compositionGroupKey?: string
        source 가 속한 terrain composition group key
    compositionRenderOrder?: number
        Layer 공개 renderOrder 에서 파생한 group 사이 합성 순서
    compositionGroupOrder?: number
        Layer group 의 최초 등록 순번
    visible?: boolean = true
        source payload 보존 여부와 독립적인 worker 합성 참여 상태

TerrainVisibilityHandoff 타입 정의
    ownerKey: string
        레이어 고유 이름
    ownerLayer?: U3dLayer
        표시 준비 상태를 확인할 레이어
    sourceKeys: Array<string>
        해당 레이어가 소유한 source key

TerrainFeature 부분 타입 명세
    이 명세에서 사용하는 필드:
        featureId: string | number
            feature 식별자
        uid?, id?: string | number
            구버전 식별자이며 featureId 가 없을 때만 사용한다.
        featureCacheKey?: string
            feature base cache key
        scopedFeatureKey?: string
            source 범위가 포함된 feature key
        sourceKey?: string
            feature source key
        sourceIdentityKey?: string
            source identity와 collection epoch를 결합한 Base Cache 범위
        type?: string
            정규화된 도형 유형이며 `path`, `area`, `circle` 중 하나다.
        sourceType?: string
            정규화 전 원본 도형 유형
        style?: TerrainStyle
            원본 스타일
        origin?: TerrainPoint
            좌표 기준점
        vectors?: Array<TerrainPoint | Array<number>>
            좌표 목록
        clipBounds?: Array<number>
            path와 area를 제한할 평면 범위
        pathSimplifyTolerance?: number
            path 단순화 허용 거리
        highlight?: boolean
            강조 여부
        visible?: boolean
            표시 여부이며 false 만 숨김으로 본다.
        renderOrder?: number
            표시 순서
        compositionGroupKey?: string
            feature가 속한 terrain composition group key
        compositionFeatureKey?: string
            polygon outer와 hole을 하나로 묶는 합성 feature key
        featureCompositionOrdinal?: number
            같은 표시 순서에서 사용할 Layer-local 등록 순번
        compositionBatchIndex?: number
            합성 계획이 부여한 batch 순번
        shaderLayerRenderOrder?: number
            feature를 적용할 shader layer 순서
        revision?: number
            변경 버전
        geometryRevision?: number
            geometry 변경 버전이며 유한하면 좌표 순회를 생략할 근거로 쓴다.
        propertyRevision?: number
            표시 property 변경 버전
        threshold?: number
            임계값
        opacity?: number
            투명도
        radius?: number
            원 반경
        isHole?: boolean
            구멍 여부
        minTerrainLevel?: number
            표시를 시작할 최소 terrain tile level
        lodPriority?: number
            LOD 선별 우선순위
        lodGroupKey?: string
            함께 선별할 feature 그룹 key
        runtime?, selected?: boolean
            실행 중 추가 여부와 선택 상태이며 강제 표시 판정에 쓴다.
        _ishighLight?: boolean
            기존 측정 feature의 강조 상태
        featureHash?: number
            tile별 feature hash
        immutableFeatureHash?: number
            tile 위치와 clipping을 제외한 재사용 가능 hash
        byteLength?: number
            추정 바이트 크기
        __terrainPrepared?: boolean
            호출자가 이미 정규화한 payload 표식
        __preparedImmediateBase?: TerrainPreparedEntry
            즉시 경로 준비 결과 cache

TerrainPreparedEntryBase 타입 정의
    featureId?: string | number
        feature 식별자
    scopedFeatureKey?: string
        source 범위 feature key
    clipBounds?: Array<number>
        path와 area를 제한할 범위이며 준비 후에는 tile-local 좌표다.
    pathSimplifyTolerance?: number
        path 단순화 허용 거리
    style: TerrainPreparedStyle
        정규화된 스타일
    visible: boolean
        표시 여부
    renderOrder: number
        표시 순서
    shaderLayerRenderOrder: number
        feature를 적용할 shader layer 순서
    revision: number
        변경 버전
    bounds?: Array<number>
        평면 범위
    x1?, y1?, x2?, y2?: number
        선분으로 평탄화한 뒤의 시작·종료 좌표
    pathStyleIndex?: number
        path 스타일 순번
    compositionBatchIndex?: number
        합성 batch 순번

TerrainPreparedPathEntry 타입 정의
    TerrainPreparedEntryBase & {type: 'path', points: Array<TerrainPoint>}
        선 도형으로 확정된 준비 항목

TerrainPreparedAreaEntry 타입 정의
    TerrainPreparedEntryBase & {type: 'area', points: Array<TerrainPoint>}
        면 도형으로 확정된 준비 항목

TerrainPreparedCircleEntry 타입 정의
    TerrainPreparedEntryBase & {type: 'circle', center: TerrainPoint, radius: number}
        원 도형으로 확정된 준비 항목

TerrainPreparedEntry 타입 정의
    TerrainPreparedPathEntry | TerrainPreparedAreaEntry | TerrainPreparedCircleEntry
        도형별 필수 좌표 계약을 보존한 준비 항목

TerrainPreparedLocalEntry 타입 정의
    TerrainPreparedEntry & {bounds: Array<number>}
        tile-local 좌표와 평면 범위까지 확정된 준비 항목

TerrainPreparedLocalPathEntry 타입 정의
    TerrainPreparedPathEntry & {bounds: Array<number>}
        대표 소스가 path packed 상태 생성 입력으로 쓰는 local 준비 항목

TerrainPreparedLocalAreaEntry 타입 정의
    TerrainPreparedAreaEntry & {bounds: Array<number>}
        대표 소스가 area packed 상태 생성 입력으로 쓰는 local 준비 항목

TerrainPreparedLocalCircleEntry 타입 정의
    TerrainPreparedCircleEntry & {bounds: Array<number>}
        대표 소스가 circle packed 상태 생성 입력으로 쓰는 local 준비 항목

TerrainPreparedStyleEntry 타입 정의
    style: TerrainPreparedStyle
        선분들이 공유하는 정규화된 스타일
    visible: boolean
        표시 여부
    renderOrder: number
        표시 순서
    shaderLayerRenderOrder: number
        shader layer 순서
    revision: number
        변경 버전
    compositionBatchIndex?: number
        합성 batch 순번

TerrainFeatureRef 타입 정의
    featureCacheKey: string
        worker 의 불변 feature base key
    featureEntryCacheKey: string
        tile 별 정규화 결과 cache key
    scopedFeatureKey?: string
        source 범위가 포함된 feature key
    clipBounds?: Array<number>
        tile clipping 범위
    pathSimplifyTolerance?: number
        path 단순화 허용 거리
    shaderLayerRenderOrder?: number
        feature 를 적용할 shader layer 순서
    compositionBatchIndex?: number
        합성 계획이 부여한 batch 순번

TerrainPathSegment 타입 정의
    type: 'path'
        선분 유형 표식
    x1, y1, x2, y2: number
        선분의 시작과 종료 좌표
    bounds: Array<number>
        선 두께 여백을 포함한 선분 평면 범위
    pathStyleIndex: number
        선분이 참조할 path 스타일 순번

TerrainFlattenedPathState 타입 정의
    items: Array<TerrainPathSegment>
        평탄화된 선분 목록
    styles: Array<TerrainPreparedStyleEntry>
        선분이 참조하는 path 스타일 목록
    fullBounds: Array<number>
        모든 선분을 포함하는 평면 범위

TerrainBucketIndexState 타입 정의
    bucketMeta: Array<Array<number>>
        bucket별 `[start, count, 0, 0]` 메타 정보
    bucketIndexArray: Float32Array
        bucket 순서대로 이어 붙인 index 배열
    bucketIndexHeight?: number
        index texture 높이

TerrainBucketState 타입 정의
    count: number
        packed 항목 수이며 path에서는 선분 수다.
    dataWidth, dataHeight: number
        데이터 texture 크기
    dataArray: Float32Array
        데이터 배열이며 area는 texel `[0, count)`가 행 header vec4(pointCount, shaderLayerRenderOrder, compositionBatchIndex, pointStart)이고 그 뒤에 entry별 점 목록이 한 번씩 이어진다.
    pointTexelCount?: number
        area 상태에서 header 뒤에 이어지는 점 texel 수
    styleWidth, styleHeight: number
        스타일 texture 크기
    styleArray: Float32Array
        스타일 배열
    fullBounds: Array<number>
        전체 평면 범위
    bucketMeta?: Array<Array<number> | Partial<{x: number, y: number, z: number, w: number}>>
        uniform 배열로 올릴 bucket 메타 정보
    bucketGrid: Array<number>
        가로·세로 bucket 개수
    bucketIndexWidth?, bucketIndexHeight?: number
        bucket index texture 크기
    bucketIndexArray?: Float32Array
        path에서는 bucket meta texel 뒤에 선분 index가 이어지는 배열
    segmentMetaWidth?, segmentMetaHeight?: number
        선분 메타 texture 크기
    segmentMetaArray?: Float32Array
        선분 메타 배열
    boundsWidth?, boundsHeight?: number
        범위 texture 크기
    boundsArray?: Float32Array
        범위 배열
    useBuckets?: number
        bucket index 사용 여부이며 1 보다 작으면 선분 전체를 훑는다.

TerrainWorkerResult 타입 정의
    tileKey: string
        tile key
    revision: number
        변경 버전
    featureSignature: string
        feature 구성 서명
    featureCount: number
        packed 항목 수의 합
    threshold: number
        임계값
    opacity: number
        투명도
    path?, area?, circle?: TerrainBucketState
        도형별 packed 상태
    immediatePrepared?: boolean
        즉시 경로에서 만든 결과 표식
    byteLength?: number
        결과의 바이트 크기

TerrainBufferState 부분 타입 명세
    이 명세에서 사용하는 필드:
        defines?: Record<string, number>
            켜야 하는 shader define
        uniforms?: Record<string, IUniform>
            적용할 shader uniform
        hasTranslucentDecal?: boolean
            알파 1 미만 decal 포함 여부
        forceMaterialUpdate?: boolean
            material 강제 갱신 요청 여부
        revision?: number
            변경 버전
        packedStates?: Partial<{path: TerrainBucketState, area: TerrainBucketState, circle: TerrainBucketState}>
            합성기가 batch 범위를 계산할 때 참조할 packed 원본

TerrainMaterialContent 타입 정의
    clearTerrainDecalState?: () => void
        decal 상태 정리 함수
    setTerrainBaseTransparent?: (transparent: boolean) => void
        이미지 레이어 기준 투명 상태 설정 함수
    applyTerrainDecalState?: (state: Partial<{defines: Record<string, number>, uniforms: Record<string, IUniform>, hasTranslucentDecal: boolean, forceMaterialUpdate: boolean}>) => void
        decal 상태 적용 함수
    map?: Texture
        terrain texture
    normalMap?: Texture | null
        terrain normal texture
    normalMapType?: NormalMapTypes
        terrain normal texture 유형
    defines?: Record<string, number>
        shader 정의
    _terrainBaseTransparent?: boolean
        이미지 레이어 기준 투명 상태
    _terrainDecalHasTranslucentFeature?: boolean
        반투명 decal 적용 상태
    _terrainDecalState?: Partial<{defines: Record<string, number>, uniforms: Record<string, IUniform>, hasTranslucentDecal: boolean}>
        적용된 terrain decal 상태

TerrainMaterial 타입 정의
    Material & TerrainMaterialContent
        terrain decal 확장 기능을 결합한 material 타입

TerrainCompositeVariant 타입 정의
    materialRenderOrder: number
        host image material 의 렌더 순서
    nextRenderOrder: number
        다음 준비된 image material 의 렌더 순서
    hostKey?: string
        담당 host 구간을 식별하는 key
    textureReadyRevision?: number
        texture 준비 구성이 바뀔 때 증가하는 revision
    renderTarget?: {texture: Texture, dispose: () => void}
        합성 결과를 담은 offscreen RenderTarget

TerrainCompositeInput 타입 정의
    tileKey: string
        합성 대상 terrain tile key
    generation: number
        합성 요청이 속한 tile 세대
    revision: number
        합성 요청이 속한 tile revision
    tileOrigin?: TerrainPoint
        tile-local 좌표 기준점
    tileLocalBounds?: Array<number>
        tile mesh 가 실제로 덮는 tile-local 범위이며 minX, minY, maxX, maxY 순서다.
    sourceState: TerrainBufferState
        기존 packed DataTexture 를 담은 direct buffer 상태
    compositionPlan?: TerrainDecalCompositionPlan
        batch 범위를 담은 합성 계획
    variants: Array<TerrainCompositeVariant>
        합성할 host 구간 목록
    renderer?: WebGLRenderer
        합성을 실행할 현재 frame renderer
    signal?: AbortSignal
        취소와 dispose 시 중단을 알리는 신호

TerrainCompositeJobHandle 타입 정의
    *
        custom incremental composer 가 내부에서 정의하는 불투명 job handle 이며 생성·전달·폐기 외에는 내부 필드에 접근하지 않는다.

TerrainCompositeStepResult 타입 정의
    done?: boolean
        전체 합성 완료 여부
    drawCalls?: number
        이번 frame 에 사용한 draw call 수
    progressed?: boolean
        이번 frame 에 합성이 진행되었는지 여부
    weightedMpUsed?: number
        이번 frame 에 소비한 가중 픽셀(메가픽셀)이며 지원하지 않는 합성기는 생략할 수 있고 그때는 픽셀 예산이 차감되지 않는다.
    stopReason?: TerrainCompositeStepStopReason
        더 진행하지 못한 사유이며 생략하면 호출자는 기존 진행 처리와 같게 다룬다.
    state?: TerrainBufferState
        완료된 합성 결과

TerrainDecalComposer 타입 정의
    compose?: (input: TerrainCompositeInput) => TerrainBufferState | Promise<TerrainBufferState>
        한 번에 전체 batch 를 합성하는 함수
    createJob?: (input: TerrainCompositeInput) => TerrainCompositeJobHandle
        frame 단위로 진행할 합성 job 을 생성하는 함수
    step?: (job: TerrainCompositeJobHandle, renderer: WebGLRenderer, opt?: Partial<{maxDrawCalls: number, deadlineMs: number, remainingWeightedMp: number, frameAdmitted: boolean}>) => TerrainCompositeStepResult | undefined
        한 frame 예산만큼 합성을 진행하는 함수
    disposeJob?: (job: TerrainCompositeJobHandle) => void
        미완료 합성 job 의 자원을 정리하는 함수
    dispose?: () => void
        composer 가 소유한 GPU 자원을 정리하는 함수

TerrainGpuCacheEntry 타입 정의
    {state: TerrainBufferState} & Partial<{byteLength: number, appliedRevision: number, tileKey: string}>
        GPU cache 에 보관하는 packed buffer 상태 항목이며 크기와 적용 버전, tile key 는 선택 항목이다.

TerrainCacheValue 타입 정의
    TerrainWorkerResult | TerrainGpuCacheEntry
        tile cache 가 보관하는 worker 결과 또는 GPU cache 항목

TerrainTileEntry 부분 타입 명세
    이 명세에서 사용하는 필드:
        mesh?: Mesh
            terrain mesh이며 이 단위가 조회 결과를 되쓴다.
        tile?: Partial<{_mesh: Mesh}>
            tile 객체이며 mesh 가 비었을 때만 참조한다.
        quadrant?: 'northWest' | 'northEast' | 'southWest' | 'southEast'
            부모 기준 사분면
        decalTexture?: Texture
            부모가 독립적으로 만든 decal texture
        renderEquivalenceSignature?: string
            tile 위치와 무관한 렌더 동등성 서명
        quadrantRenderEquivalenceSignatures?: Partial<Record<'northWest' | 'northEast' | 'southWest' | 'southEast', string>>
            부모 texture의 사분면별 렌더 동등성 서명
        lodProfileId?: string
            적용 중인 LOD profile 식별자
        lodProfileVersion?: number
            적용 중인 LOD profile 버전

TerrainManagerOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        origin?: TerrainPoint
            feature 에 origin 이 없을 때 사용할 기준 좌표
        sourceKey?: string
            feature source key이며 feature 값보다 우선한다.
        sourceIdentityKey?: string
            Base Cache 범위 key이며 feature 값보다 우선한다.
        compositionGroupKey?: string
            합성 group key이며 feature 값이 있으면 feature 값을 먼저 쓴다.
        consumePreparedFeatures?: boolean
            이미 준비된 feature 객체를 복사하지 않고 그대로 바꿔 쓸지 여부
        threshold?: number
            임계값 uniform 을 덮어쓸 값
        depthOffset?: number
            깊이 보정 uniform 을 덮어쓸 값

TerrainMaterialBinding 타입 정의
    material: TerrainMaterial
        terrain material
    mesh?: Mesh
        terrain mesh
    tile?: Partial<{_mesh: Mesh}>
        tile 객체
    ownerLayer?: U3dLayer
        소유 레이어
    layerName?: string
        레이어 이름
    renderOrder?: number
        image layer 렌더 순서
    visible?: boolean
        논리적 가시 상태
    visibilityCommitted?: boolean
        LOD 가 가시 상태를 명시적으로 commit 하였는지 여부
    textureReady?: boolean
        texture 준비 여부
    disposeRequested?: boolean
        mesh dispose 보류 여부

TerrainPresentationBatch 타입 정의
    ownerKey: string
        표시 요청 소유자 식별자
    revision?: number
        표시 요청 버전
    tileKeys?: Iterable<string>
        한 프레임에 함께 교체할 tile key 이며 생략하면 flush 대상 전체가 표시 그룹에 들어간다.

TerrainPresentationGroupMembership 타입 정의
    id: string
        표시 그룹 식별자
    ownerKey: string
        표시 그룹 소유자 식별자
    ownerRevision: number
        소유자 표시 버전
    generation: number
        tile 세대
    revision: number
        tile revision
    explicit?: boolean
        최신 flush 가 직접 지정한 표시 대상이면 true, 이전 그룹에서 넘어온 멤버면 false 다.

TerrainLegacyElement 타입 정의
    points?: Array<TerrainPoint | Array<number>>
        좌표 목록
    center?: TerrainPoint
        원의 중심
    radius?: number
        원의 반경
    fillColor?, strokeColor?: TerrainColor
        면 색상과 선 색상
    strokeWidth?: number
        선 두께
    opacity?: number
        투명도
    visible?: boolean
        표시 여부
    highlight?: boolean
        강조 여부
    renderOrder?: number
        표시 순서
    isHole?: boolean
        구멍 여부

TerrainLegacyPayload 타입 정의
    lineSegments?, multiLines?: Array<TerrainLegacyElement>
        선과 복합 선 목록
    polygons?, multiPolygons?: Array<TerrainLegacyElement>
        면과 복합 면 목록
    circles?: Array<TerrainLegacyElement>
        원 목록
    threshold?: number
        payload 전체에 적용할 임계값
    opacity?: number
        payload 전체에 적용할 투명도

TERRAIN_DECAL_BUCKET_COUNT: number = 256
    uniform 배열로 올리는 bucket 메타의 고정 길이

TERRAIN_DECAL_BUCKET_GRID_X: number = 16
    bucket 격자의 기본 가로 개수

TERRAIN_DECAL_BUCKET_GRID_Y: number = 16
    bucket 격자의 기본 세로 개수

TERRAIN_DECAL_PATH_BUCKET_THRESHOLD: number = 256
    선분 수가 이 값을 넘을 때만 path bucket index를 만드는 기준

TERRAIN_DECAL_PATH_STYLE_TEXELS: number = 2
    path 스타일 하나가 사용하는 packed texture texel 수

TERRAIN_DECAL_IMMEDIATE_MAX_FEATURES: number = 16
    즉시 경로를 허용하는 최대 feature 수

TERRAIN_DECAL_IMMEDIATE_MAX_POINTS: number = 192
    즉시 경로를 허용하는 최대 좌표 총수

TERRAIN_DECAL_BASE_UNIFORMS: Readonly<{threshold: number, depthOffset: number}> = 동결된 기본 uniform 값
    호출자와 worker 결과가 값을 주지 않을 때 사용할 기본 uniform 값이며 Object.freeze 로 동결되어 있다.

TERRAIN_DECAL_BASE_UNIFORMS.threshold: number = 1.0
    기본 임계값

TERRAIN_DECAL_BASE_UNIFORMS.depthOffset: number = 0.0001
    기본 깊이 보정값

resolveTerrainTaskPriority(opt: Partial<{visibleResourceMissing: boolean, parentFallbackRequired: boolean, lodTransitionTarget: boolean, visibleDirty: boolean, invisibleDirty: boolean, prefetch: boolean, detailPriority: number}> = {}) -> number
    역할: terrain 작업의 표시 영향도를 하나의 Queue 우선순위 숫자로 환산한다.

    인터페이스:
        opt: 작업 준비 상태 표식이며 생략하면 모든 표식을 끈 것으로 본다.
        opt.detailPriority: 같은 영향도 안에서 순서를 가르는 세부 우선순위다.
        반환: 값이 클수록 먼저 처리해야 하는 우선순위다.

    처리 기준:
        영향도 표식은 boolean true 만 인정하며, 위에서 아래로 처음 일치한 하나만 적용한다.
        영향도 순위는 표시 자원 없음 6, 부모 대체 필요 5, LOD 전환 대상 4, 표시 중 변경 3, 비표시 변경 2, 선행 적재 1이고 어느 것도 아니면 0이다.
        세부 우선순위는 0 이상 999 이하로 자르며, 숫자로 바꿀 수 없거나 0 이면 0 을 사용한다.

    동작:
        영향도 표식을 위 순서로 검사하여 그룹 번호를 정한다.
        그룹 번호에 1000 을 곱한 값에 보정한 세부 우선순위를 더해 반환한다.

source identity 판정 책임 그룹
    역할: 같은 source에서 온 Base Feature를 재사용해도 되는지, feature loop 자체를 건너뛰어도 되는지, Base Cache를 어느 범위로 나눌지 판정한다.

    normalizeTerrainSourceIdentity(sourceIdentity: TerrainSourceIdentity | undefined) -> TerrainSourceIdentity | undefined
        역할: 호출자가 준 source identity를 비교 가능한 값으로 확정하거나 버전 없는 source로 판정한다.

        인터페이스: 반환: 일곱 필드가 모두 유효할 때만 정규화된 identity이며, 하나라도 빠지면 버전 없는 source를 뜻하는 undefined 다.

        처리 기준:
            객체가 아니면 정규화하지 않는다.
            sourceId 와 sourceLayerId 는 문자열로 바꾸며 undefined 는 빈 문자열이 되어 실패로 판정된다.
            다섯 버전 값은 숫자로 바꾸어 유한해야 하며, NaN 과 Infinity 는 실패로 판정된다.

        동작:
            입력이 객체가 아니면 undefined 를 반환한다.
            식별자 두 개를 문자열로, 버전 다섯 개를 숫자로 바꾼다.
            빈 식별자나 유한하지 않은 버전이 하나라도 있으면 undefined 를 반환한다.
            일곱 필드를 담은 새 객체를 반환한다.

    isTerrainSourceIdentityCompatible(previous: TerrainSourceIdentity | undefined, current: TerrainSourceIdentity | undefined) -> boolean
        역할: 두 source가 같은 Base Feature namespace와 encoding을 쓰는지 판정해 Base Feature 재사용 가능 여부를 알린다.

        처리 기준:
            collection epoch 와 revision 은 데이터 변경 상태이므로 호환성 판정에서 제외한다.
            어느 한쪽이라도 정규화에 실패하면 호환되지 않는다고 본다.

        동작:
            양쪽을 정규화하고 하나라도 실패하면 false 를 반환한다.
            sourceId, sourceLayerId 와 namespace·schema·encoding 버전이 모두 같은지 비교해 반환한다.

    isSameTerrainSourceIdentitySnapshot(previous: TerrainSourceIdentity | undefined, current: TerrainSourceIdentity | undefined) -> boolean
        역할: feature loop를 건너뛸 수 있도록 권위 identity와 collection 상태까지 완전히 같은지 판정한다.

        처리 기준: 호환성 판정을 통과한 뒤에만 collection epoch 와 revision 을 비교한다.

        동작:
            호환성 판정이 실패하면 false 를 반환한다.
            양쪽을 다시 정규화하여 collection epoch 와 revision 이 모두 같은지 비교해 반환한다.

    buildTerrainSourceIdentityCacheKey(sourceIdentity: TerrainSourceIdentity | undefined) -> string | undefined
        역할: 기존 Base Feature Registry key에 결합할 안정적인 source 범위 문자열을 만든다.

        인터페이스: 반환: Base Cache 범위 문자열이며 버전 없는 source면 undefined 다.

        처리 기준: collection revision 은 feature별 revision 재사용을 막지 않도록 범위 key 에서 제외하고 epoch 까지만 포함한다.

        동작:
            정규화에 실패하면 undefined 를 반환한다.
            식별자 두 개, 버전 세 개와 collection epoch 를 순서대로 담은 JSON 배열 문자열을 반환한다.

selectTerrainDecalLodFeatures(features: Array<TerrainFeature> = [], tileLevel: number = 0, profile: TerrainDecalLodProfile = {}) -> TerrainDecalLodSelection
    역할: 현재 tile level에서 실제로 그릴 feature만 남기고 선별 전후 개수와 적용 profile을 함께 알린다.

    인터페이스:
        features: 선별 대상 feature 목록이며 배열이 아니면 빈 목록으로 본다.
        tileLevel: 현재 terrain tile level이며 유한하지 않으면 0 으로 본다.
        profile: 적용할 LOD 설정이며 생략하면 제약 없는 빈 설정이다.
        반환: 선별 결과와 계측용 개수·profile 정보다.

    처리 기준:
        구간 제약, profile filter, feature별 최소 level 제약이 모두 없으면 입력 배열을 그대로 결과 features 로 사용하여 새 배열을 만들지 않는다.
        같은 lodGroupKey 를 가진 feature 는 하나의 그룹으로 묶어 분리하지 않는다. lodGroupKey 가 없거나 빈 문자열이면 그 feature 만의 index 기반 단독 그룹을 만든다.
        그룹은 구성원 중 하나라도 강제 표시이거나 표시 조건을 만족하면 후보가 된다.
        후보 정렬은 강제 표시 우선, 그다음 그룹 우선순위 내림차순, 마지막으로 원본 등장 순서다.
        maxFeatures 예산은 그룹 단위로만 적용한다. 강제 표시 그룹은 예산을 넘어도 항상 넣고, 예산이 0 이 아니면 첫 그룹은 예산보다 커도 보존한다.
        maxFeatures 가 유한하지 않거나 음수이면 예산 제한이 없다고 보므로, 음수 maxFeatures 는 구간 제약으로만 인정되고 개수 제한 효과는 없다.
        결과 features 는 선별된 index 를 원본 순서대로 다시 걸러 만들므로 입력 순서를 유지한다.

    동작:
        현재 tile level 에 맞는 구간을 찾고 minPriority 나 maxFeatures 중 하나라도 유한한지로 구간 제약 유무를 정한다.
        feature 목록에서 현재 level 보다 큰 minTerrainLevel 을 가진 feature 가 있는지 조사하여 feature 제약 유무를 정한다.

        구간 제약, filter, feature 제약이 모두 없으면 입력 목록과 개수, profile 식별자·버전을 담아 그대로 반환한다.
        feature 를 순회하여 lodGroupKey 별 그룹을 만들고 그룹마다 강제 표시 여부, 후보 여부, 최대 우선순위와 최초 등장 index 를 누적한다.

        후보 그룹만 남겨 강제 표시, 우선순위, 등장 순서로 정렬한다.
        정렬 순서대로 그룹을 넣으며 예산을 넘는 비강제 그룹은 건너뛰고 선택된 index 집합을 만든다.
        선택된 index 의 feature 만 원본 순서로 모아 개수와 profile 정보와 함께 반환한다.

buildTerrainDecalLodSourceRevision(sourceRevision: number, lodSelection: TerrainDecalLodSelection) -> number
    역할: 렌더 feature가 같아도 선별 전 개수와 profile 변경이 source revision에 반영되게 한다.

    인터페이스: 반환: 32비트 부호 없는 정수로 접은 revision 값이다.

    처리 기준: 선별 전 feature 수, profile 식별자, profile 버전만 결합하고 선별 후 개수는 결합하지 않는다.

    동작:
        FNV-1a 초기값 2166136261 에 source revision, 선별 전 feature 수, profile 식별자, profile 버전을 차례로 섞는다.

        결과를 32비트 부호 없는 정수로 바꾸어 반환한다.

shouldRenderTerrainDecalLodFeature(feature: TerrainFeature, tileLevel: number, band: TerrainDecalLodBand | undefined, profile: TerrainDecalLodProfile) -> boolean
    역할: feature 하나가 현재 LOD 구간과 filter의 표시 조건을 만족하는지 판정한다.

    처리 기준:
        minTerrainLevel 이 유한하고 현재 level 이 그보다 작으면 표시하지 않는다.
        구간 minPriority 가 유한하면 feature 우선순위와 비교하며, feature 우선순위가 유한하지 않으면 0 으로 본다.
        profile.filter 가 함수이면 반환값이 정확히 true 일 때만 통과시킨다.
        구간이 없거나 세 조건에 걸리지 않으면 표시한다.

    동작:
        feature 의 minTerrainLevel 을 읽어 현재 level 과 비교하고 미달이면 false 를 반환한다.

        구간 minPriority 와 feature 우선순위를 비교하여 미달이면 false 를 반환한다.
        filter 함수가 있으면 호출하여 true 가 아니면 false 를 반환한다.
        모든 조건을 통과하면 true 를 반환한다.

resolveTerrainDecalLodBand(profile: TerrainDecalLodProfile, tileLevel: number) -> TerrainDecalLodBand | undefined
    역할: 현재 tile level에 적용할 LOD 구간 하나를 고른다.

    처리 기준:
        bands 가 배열이 아니면 적용할 구간이 없다.
        minLevel 이 유한하지 않으면 하한 없음, maxLevel 이 유한하지 않으면 상한 없음으로 본다.
        구간 경계는 양쪽 모두 포함하며, 앞에서부터 처음 일치한 구간을 반환하고 나머지는 검사하지 않는다.

    동작:
        구간 목록을 앞에서부터 순회하여 현재 level 이 하한과 상한 사이에 들면 그 구간을 반환한다.
        일치하는 구간이 없으면 undefined 를 반환한다.

isTerrainDecalLodForcedFeature(feature: TerrainFeature) -> boolean
    역할: LOD filter와 예산에 상관없이 반드시 표시해야 하는 feature인지 판정한다.

    처리 기준: highlight, selected, runtime 속성이 정확히 true 이거나 기존 측정 feature의 `_ishighLight` 가 true 이면 강제 표시로 본다.

    동작:
        highlight, selected, runtime 속성을 차례로 읽어 하나라도 true 이면 true 를 반환한다.

        모두 아니면 feature 의 `_ishighLight` 속성이 true 인지로 반환한다.

resolveTerrainDecalLodFeatureValue(feature: TerrainFeature, propertyName: string) -> unknown
    역할: 일반 객체, OpenLayers feature, 측정 feature가 섞여도 같은 이름으로 LOD 속성을 읽는다.

    인터페이스: 반환: 처음 찾은 속성 값이며 어디에서도 찾지 못하면 undefined 다.

    처리 기준:
        조회 순서는 직접 속성, `get(name)` 결과, `getProperties()` 결과이며 undefined 가 아닌 첫 값을 채택한다.
        그다음 properties, style, `_style`, `_sourceFeature`, sourceFeature, `getFeature()` 결과를 이 순서로 보며, 각 후보에서 직접 속성을 먼저 보고 없으면 후보의 properties 를 본다.
        값이 null 이나 false 여도 undefined 가 아니면 그대로 채택한다.

    동작:
        feature 가 없으면 undefined 를 반환한다.
        직접 속성, `get(name)`, `getProperties()[name]` 을 차례로 확인하여 undefined 가 아닌 값을 반환한다.
        중첩 후보 목록을 순서대로 순회하며 후보의 직접 속성과 properties 에서 값을 찾아 반환한다.
        끝까지 찾지 못하면 undefined 를 반환한다.

resolveTerrainDecalParentUvTransform(quadrant: string) -> TerrainDecalUvTransform | undefined
    역할: quadtree 사분면 이름을 부모 decal texture를 자식 범위로 잘라 쓰는 UV 변환으로 바꾼다.

    인터페이스:
        quadrant: `U3dQuadTile._quadname` 값이다.
        반환: 사분면 UV 변환이며 알 수 없는 이름이면 undefined 다.

    처리 기준: 네 사분면 모두 축척은 0.5 이고 offset 은 northWest `[0, 0.5]`, northEast `[0.5, 0.5]`, southWest `[0, 0]`, southEast `[0.5, 0]` 이다.

    동작:
        사분면 이름에 따라 축척과 offset 을 담은 변환을 반환한다.
        네 이름 중 어느 것도 아니면 undefined 를 반환한다.

isTerrainDecalTextureInheritanceEligible(parentEntry: Partial<TerrainTileEntry>, childEntry: Partial<TerrainTileEntry>) -> boolean
    역할: 자식 tile이 부모 decal texture를 그대로 상속해도 렌더 결과가 같은지 판정한다.

    처리 기준:
        부모에 decalTexture 가 없으면 상속할 수 없다.
        자식 사분면 이름이 UV 변환을 만들 수 없는 값이면 상속할 수 없다.
        부모가 기록한 해당 사분면의 렌더 동등성 서명이 없거나 자식의 서명과 다르면 상속할 수 없다.
        LOD profile 식별자와 버전이 같아야 하며, 없으면 각각 `default` 와 0 으로 보고 비교한다.

    동작:
        부모 decalTexture 유무와 사분면 UV 변환 가능 여부를 확인하여 하나라도 실패하면 false 를 반환한다.

        부모의 사분면별 렌더 동등성 서명을 자식 서명과 비교하여 다르면 false 를 반환한다.
        LOD profile 식별자와 버전이 모두 같은지로 반환한다.

buildTerrainFeatureBase(feature: TerrainFeature, scopedFeatureKey: string) -> TerrainFeature
    역할: 정규 feature에서 Worker와 즉시 경로가 공유할 최소 기본 정보만 뽑아 새 feature 객체를 만든다.

    인터페이스:
        scopedFeatureKey: source 범위가 포함된 feature key이며 cache key 계산과 결과 필드에 함께 쓰인다.
        반환: cache key와 byte 추정까지 채운 새 feature 기본 정보다.

    처리 기준:
        좌표 목록은 복제하지 않고 원본 배열 참조를 그대로 넘긴다.
        highlight 와 isHole 은 정확히 true 일 때만 true 이고, visible 은 false 만 숨김으로 본다.
        renderOrder, revision, threshold, opacity, radius 는 값이 없으면 0 으로 확정한다. [확인 Q-003]
        geometryRevision 과 propertyRevision 만 유한하지 않을 때 undefined 로 남긴다.
        clipBounds, pathSimplifyTolerance, shaderLayerRenderOrder, compositionBatchIndex 는 포함하지 않으므로 즉시 경로 호출자가 따로 덧붙인다.

    동작:
        scopedFeatureKey 와 feature 로 feature base cache key 를 만든다.
        스타일은 색상까지 분리한 복제본으로 만든다.
        좌표 수로 추정 byte 크기를 계산한다.
        식별자, 유형, 스타일, 표시 상태, 숫자 필드를 위 기준으로 확정한 새 객체를 반환한다.

cloneTerrainPreparedStyle(style: TerrainStyle = {}) -> TerrainStyle
    역할: 스타일을 얕게 복제하면서 두 색상만 원본과 공유하지 않게 분리한다.

    처리 기준: fillColor 와 strokeColor 를 제외한 나머지 필드는 얕은 복사로 원본 참조를 공유한다.

    동작:
        입력 스타일을 펼쳐 복사하고 두 색상만 색상 복제 결과로 덮어써 반환한다.

cloneTerrainPreparedColor(color: TerrainColor | undefined) -> TerrainColor | undefined
    역할: 표현 방식이 다른 색상 값을 각 표현에 맞게 복제한다.

    처리 기준:
        Color 는 clone, 배열은 slice, 그 밖의 객체는 얕은 복사로 복제한다.
        숫자·문자열 같은 원시 표현과 undefined 는 그대로 반환한다.

    의존: THREE — 색상 표현 판정과 복제; 속성 읽기: {Color}; 함수: {clone()}

    동작:
        색상 표현 종류를 판정하여 해당 방식으로 복제한 값을 반환한다.
        복제할 필요가 없는 원시 표현은 입력 값을 그대로 반환한다.

cloneTerrainPreparedVectors(vectors: Array<TerrainPoint> = []) -> Array<TerrainPoint>
    역할: 좌표 목록을 x, y, z 세 성분만 가진 새 점 객체 배열로 복제한다.

    처리 기준: 각 성분이 없으면 0 으로 확정하므로 원본의 추가 속성은 결과에 남지 않는다.

    동작:
        각 점의 x, y, z 를 숫자로 바꾼 새 객체 배열을 만들어 반환한다.

buildTerrainFeatureBaseCacheKey(feature: TerrainFeature, scopedFeatureKey: string) -> string
    역할: feature base를 Registry에 보관할 때 쓰는 `scopedFeatureKey:hash` 형식 key를 만든다.

    처리 기준:
        feature 에 유한한 immutableFeatureHash 가 있으면 그 값을 시작 hash 로 쓰고, 없으면 immutable hash 를 새로 계산한다.
        sourceIdentityKey 가 없으면 `unversioned` 문자열을 섞어 버전 없는 source 를 구분한다.

    동작:
        시작 hash 를 확정한다.
        scopedFeatureKey 와 sourceIdentityKey 를 차례로 섞는다.
        `scopedFeatureKey` 와 32비트 부호 없는 hash 를 콜론으로 이어 반환한다.

estimateTerrainFeatureBaseByteLength(feature: TerrainFeature) -> number
    역할: feature base가 cache 용량 계산에서 차지할 크기를 좌표 수로 추정한다. [확인 Q-001]

    인터페이스: 반환: 좌표 하나를 24바이트로 보고 768바이트를 더한 값이며 최소 1024 바이트다.

    처리 기준: 좌표 목록이 배열이 아니면 좌표 수를 0 으로 본다.

    동작:
        좌표 수에 24 를 곱하고 768 을 더한 값과 1024 중 큰 값을 반환한다.

buildTerrainScopedFeatureKey(sourceKey: string = 'default', featureId: string | number = '') -> string | undefined
    역할: source 범위를 포함한 feature key를 만들어 서로 다른 source의 같은 식별자를 구분한다.

    처리 기준: featureId 가 빈 문자열, 0, false 처럼 거짓으로 판정되는 값이면 key 를 만들지 않고 undefined 를 반환한다.

    동작:
        featureId 가 거짓으로 판정되면 undefined 를 반환한다.
        sourceKey 와 featureId 를 콜론으로 이어 반환한다.

buildTerrainTileFeatureSignature(tileKey: string, features: Array<TerrainFeature> = []) -> string
    역할: tile에 적용된 feature 구성이 바뀌었는지 한 문자열로 비교할 수 있게 서명을 만든다.

    인터페이스: 반환: `terrain:` 접두어와 32비트 부호 없는 hash 를 이은 문자열이다.

    처리 기준:
        feature 식별은 feature.scopedFeatureKey 를 먼저 쓰고 없으면 feature.featureId, 그다음 순번 i 를 대체로 쓴다.
        feature 내용은 featureHash 만 반영하고 없으면 0 으로 본다.
        비어 있는 요소는 건너뛰지만 목록 길이는 이미 반영되어 있다.

    동작:
        초기 hash 에 tile key 와 feature 수를 섞는다.
        feature 를 순회하며 식별자와 featureHash 를 차례로 섞는다.
        `terrain:` 접두어를 붙인 문자열을 반환한다.

buildTerrainDecalRenderEquivalenceSignature(features: Array<TerrainFeature> = [], profileId: string = 'default', profileVersion: number = 0) -> string
    역할: 부모 사분면과 자식 tile의 렌더 결과가 같은지 비교할 tile 위치 독립 서명을 만든다.

    인터페이스:
        features: 렌더 순서대로 정렬된 feature 목록이다.
        반환: `terrain-render:` 접두어와 32비트 부호 없는 hash 를 이은 문자열이다.

    처리 기준:
        tile origin 과 clipBounds 는 결합하지 않으므로 tile 위치가 달라도 같은 서명이 나온다.
        feature 식별은 feature.scopedFeatureKey 를 먼저 쓰고 없으면 feature.featureId, 그다음 순번 i 를 대체로 쓴다.
        feature 내용은 feature.immutableFeatureHash 를 먼저 쓰고 없으면 feature.featureHash, 그다음 feature.revision 을 대체로 쓰며 모두 없으면 0 으로 본다.
        표시 여부는 false 만 0, 구멍 여부는 true 만 1 로 접어 결합한다.

    동작:
        초기 hash 에 profile 식별자, profile 버전, feature 수를 섞는다.
        feature 를 순회하며 식별자, 내용 hash, renderOrder, 표시 여부, 구멍 여부, path 단순화 허용 거리를 차례로 섞는다.
        `terrain-render:` 접두어를 붙인 문자열을 반환한다.

resolveTerrainTileOrigin(tileEntry: TerrainTileEntry, features: Array<TerrainFeature> = [], opt: Partial<{origin: TerrainPoint}> = {}) -> TerrainPoint
    역할: tile-local 좌표 계산의 기준점을 하나로 정한다.

    인터페이스:
        opt.origin: 호출자가 기준점을 직접 지정할 때 사용하며 가장 높은 우선순위다.
        반환: x, y, z 가 모두 숫자로 확정된 기준점이다.

    처리 기준:
        우선순위는 opt.origin, terrain mesh 위치, 첫 feature 의 origin 순서다.
        어느 것도 없으면 세 성분이 0 인 기준점을 반환한다.

    동작:
        opt.origin 이 있으면 세 성분을 숫자로 확정해 반환한다.
        terrain mesh 를 조회하여 위치가 있으면 그 위치를 기준점으로 반환한다.
        남은 경우 첫 feature 의 origin 성분을 숫자로 확정해 반환한다.

resolveTerrainTileMesh(tileEntry: TerrainTileEntry | undefined) -> Mesh | undefined
    역할: layer cache, tile 내부 mesh, registry mesh가 섞여 있어도 같은 우선순위로 terrain mesh를 찾는다.

    처리 기준:
        tileEntry.mesh 가 있으면 그대로 사용하고 tile 내부를 보지 않는다.
        tileEntry.mesh 가 비어 있고 tile 내부 mesh 가 있으면 호출자가 넘긴 tileEntry.mesh 에 그 mesh 를 되쓴다.
        어느 쪽에도 mesh 가 없으면 undefined 를 반환하며 tileEntry 를 바꾸지 않는다.

    동작:
        tileEntry 가 없으면 undefined 를 반환한다.
        tileEntry.mesh 가 있으면 그 mesh 를 반환한다.
        tile 내부 mesh 가 있으면 tileEntry.mesh 에 저장한 뒤 그 mesh 를 반환하고, 없으면 undefined 를 반환한다.

cloneTerrainOrigin(origin: TerrainPoint | undefined) -> TerrainPoint | undefined
    역할: tile-local 기준점의 값 사본을 만든다.

    처리 기준:
        입력이 없으면 undefined 를 반환한다.
        세 성분을 숫자로 확정한 새 객체를 만들며 입력 객체를 참조로 남기지 않는다. packed 결과와 GPU 상태는 자신을 만든 기준점을 값으로 들고 다녀야 하며, mesh 위치나 tile 의 준비 기준점 같은 가변 객체를 참조하면 다음 빌드가 그 값을 바꾼 뒤 이전 결과의 기준점까지 바뀐 것처럼 보이기 때문이다.

    동작:
        입력이 없으면 undefined 를 반환한다.
        x, y, z 를 숫자로 확정한 새 객체를 반환한다.

FNV-1a hash 결합 책임 그룹
    역할: cache key와 서명에 쓰는 32비트 FNV-1a hash를 값 종류별로 같은 규칙으로 결합한다. 호출자가 누적 hash를 넘기고 갱신된 hash를 받는 방식이므로 결합 순서가 결과를 바꾼다.

    hashTerrainSignatureValue(hash: number, value: unknown) -> number
        역할: 값의 자료형을 판정하여 종류별 hash 결합 방식으로 위임한다.

        인터페이스:
            hash: 지금까지 누적된 hash 값이다.
            반환: 값이 결합된 32비트 부호 없는 hash 다.

        처리 기준:
            숫자는 숫자 결합, boolean 은 1 과 0 의 정수 결합, undefined 와 null 은 정수 0 결합, 문자열은 문자열 결합을 사용한다.
            bigint 는 하위 32비트와 상위 32비트를 두 번 정수 결합한다.
            그 밖의 값은 문자열로 바꾼 뒤 문자열 결합을 사용하므로 객체는 자료형 표기로만 구분된다.

        동작:
            값의 자료형을 판정하여 숫자, 정수, 문자열 결합 중 하나로 위임한다.
            bigint 는 하위와 상위 32비트를 순서대로 정수 결합해 반환한다.
            null 은 정수 0 으로, 나머지 값은 문자열 변환 결과로 결합해 반환한다.

    hashInteger(hash: number, value: number) -> number
        역할: 32비트 정수 하나를 FNV-1a 한 단계로 결합한다.

        동작:
            누적 hash 와 값을 배타적 논리합한 뒤 FNV-1a 소수를 곱해 32비트 부호 없는 정수로 반환한다.

    hashNumber(hash: number, value: number) -> number
        역할: 정수와 실수를 구분해 숫자 하나를 결합한다.

        처리 기준:
            32비트 부호 있는 정수 범위의 정수는 값 자체를 한 단계로 결합한다.
            그 밖의 숫자는 배정밀도 부동소수 비트로 바꾼 뒤 하위와 상위 32비트를 두 단계로 결합하므로 소수와 큰 정수도 비트 단위로 구분된다.
            비트 변환에는 모듈 수준에서 한 번만 만든 8바이트 버퍼와 그 DataView 를 공유하므로 호출마다 임시 객체를 만들지 않으며, 같은 버퍼를 쓰는 다른 호출과 겹쳐 실행되지 않아야 한다.

        동작:
            값이 32비트 정수 범위의 정수이면 한 단계로 결합해 반환한다.
            그 밖의 숫자는 공용 DataView 에 리틀엔디언 배정밀도로 기록하고 하위·상위 32비트를 차례로 결합해 반환한다.

    hashString(hash: number, value: string) -> number
        역할: 문자열의 각 문자 코드를 순서대로 결합한다.

        처리 기준: 빈 문자열은 누적 hash 를 32비트 부호 없는 정수로만 바꾸어 반환한다.

        동작:
            누적 hash 를 32비트 정수로 두고 문자 코드마다 배타적 논리합과 FNV-1a 소수 곱을 반복해 32비트 부호 없는 정수로 반환한다.

    hashTerrainPreparedStyle(hash: number, style: TerrainStyle = {}) -> number
        역할: 스타일 하나를 서명에 결합한다.

        처리 기준:
            면 색상과 선 색상을 먼저 결합하고 투명도 두 개와 선 두께를 없으면 0 으로 보고 결합한다.
            표시 여부는 false 만 0, 강조 여부는 true 만 1 로 접어 결합한다.

        동작:
            면 색상과 선 색상을 차례로 결합한다.
            면 투명도, 선 투명도, 선 두께, 표시 여부, 강조 여부를 차례로 결합해 32비트 부호 없는 정수로 반환한다.

    hashTerrainPreparedColor(hash: number, color: TerrainColor | undefined) -> number
        역할: 색상 표현이 달라도 같은 RGB 값이면 같은 hash가 나오게 결합한다.

        처리 기준:
            Color 는 r, g, b 속성, 배열은 앞 세 성분, 그 밖의 객체는 r, g, b 속성을 각각 결합하고 없으면 0 으로 본다.
            알파 성분은 결합하지 않는다.
            객체가 아닌 색상 표현은 값 자체를 결합하고 값이 없으면 빈 문자열을 결합한다.

        의존: THREE — 색상 표현 판정; 속성 읽기: {Color}

        동작:
            색상 표현 종류를 판정하여 세 채널을 차례로 결합하고 32비트 부호 없는 정수로 반환한다.
            객체가 아닌 표현은 값 하나만 결합해 반환한다.

    hashTerrainPreparedPoint(hash: number, point: TerrainPoint | Array<number> | undefined) -> number
        역할: 점 하나를 배열과 객체 표현 모두에서 같은 규칙으로 결합한다.

        처리 기준: 배열은 앞 세 성분, 객체는 x, y, z 를 결합하고 없으면 0 으로 본다.

        동작:
            표현 종류를 판정하여 세 성분을 차례로 결합하고 32비트 부호 없는 정수로 반환한다.

extractTerrainFeatureId(scopedFeatureId: string = '') -> string
    역할: source 범위가 붙은 feature key에서 원본 feature 식별자만 잘라낸다.

    처리 기준:
        첫 콜론 위치를 기준으로 뒤쪽만 남기며 값 안에 콜론이 여러 개면 첫 콜론만 구분자로 본다.
        콜론이 없으면 입력값을 변환하지 않고 그대로 반환하므로 문자열이 아닌 입력에서는 입력 자료형이 그대로 나온다. JSDoc 선언이 없어 매개변수와 반환 타입은 기본값과 실제 분기로만 확인했다.

    동작:
        입력을 문자열로 바꿔 첫 콜론 위치를 찾는다.
        콜론이 없으면 입력값을 그대로 반환하고, 있으면 콜론 다음부터 끝까지를 반환한다.

feature와 스타일 동일성 판정 책임 그룹
    역할: 같은 feature와 스타일이 다시 들어왔을 때 재계산을 건너뛸 수 있도록 값 기준 동일성을 판정한다.

    isSameTerrainNormalizedFeature(left: TerrainFeature | undefined, right: TerrainFeature | undefined) -> boolean
        역할: 정규화된 feature 두 개가 같은 대상의 같은 상태인지 판정한다.

        처리 기준:
            한쪽이라도 없으면 같지 않다고 본다.
            scopedFeatureKey, revision, featureHash 만 비교하며 revision 과 featureHash 는 없으면 0 으로 본다.

        동작:
            양쪽이 모두 있는지 확인한 뒤 세 값이 모두 같은지로 반환한다.

    isSameTerrainOrigin(prev: TerrainPoint | undefined, next: TerrainPoint | undefined) -> boolean
        역할: tile 기준점이 바뀌었는지 판정한다.

        처리 기준: 세 성분을 숫자로 바꿔 비교하며 없는 성분은 0 으로 보므로 undefined 와 좌표 0 은 같다고 본다.

        동작:
            x, y, z 를 각각 숫자로 바꿔 모두 같은지로 반환한다.

    isSameTerrainStyle(left: TerrainStyle | undefined, right: TerrainStyle | undefined) -> boolean
        역할: 스타일 두 개가 렌더 결과에 같은 영향을 주는지 판정한다.

        처리 기준:
            둘 다 없으면 같다고 보고, 한쪽만 없으면 같지 않다고 본다.
            비교 대상은 두 색상, 투명도 두 개, 선 두께, 표시 여부, 강조 여부이며 그 밖의 필드는 비교하지 않는다.
            표시 여부는 false 만 숨김, 강조 여부는 true 만 강조로 접어 비교한다.

        동작:
            양쪽 존재 여부를 먼저 판정한다.
            면 색상과 선 색상을 비교한다.
            투명도, 선 두께, 표시 여부, 강조 여부가 모두 같은지로 반환한다.

    isSameTerrainColor(left: TerrainColor | undefined, right: TerrainColor | undefined) -> boolean
        역할: 표현 방식이 달라도 같은 RGB 색인지 판정한다.

        처리 기준:
            같은 참조이면 즉시 같다고 본다.
            한쪽이라도 거짓으로 판정되는 값이면 같지 않다고 보므로 색상 0 과 undefined 는 같지 않다고 판정된다.
            알파 성분은 비교하지 않는다.

        동작:
            참조 동일성과 존재 여부를 먼저 판정한다.
            r, g, b 채널 값을 각각 읽어 모두 같은지로 반환한다.

    resolveTerrainColorChannel(color: TerrainColor, channel: 'r' | 'g' | 'b') -> number
        역할: 색상 표현별로 지정한 채널 값을 숫자로 읽는다.

        처리 기준:
            Color 는 같은 이름의 속성, 배열은 r, g, b 를 각각 0, 1, 2 번 성분으로 읽는다.
            그 밖의 값은 같은 이름의 속성을 읽고 없으면 0 을 반환한다.

        의존: THREE — 색상 표현 판정; 속성 읽기: {Color}

        동작:
            색상 표현 종류를 판정하여 해당 채널 값을 숫자로 바꿔 반환한다.

cloneTerrainPreparedEntry(entry: TerrainPreparedEntry) -> TerrainPreparedEntry
    역할: 준비 항목을 복제하되 이후 좌표 변환과 packing에서 원본과 공유하면 안 되는 부분만 분리한다.

    처리 기준:
        입력이 거짓으로 판정되면 입력값을 그대로 반환한다.
        스타일은 얕게 복사하고 두 색상은 배열일 때만 새 배열로 분리한다.
        bounds 와 clipBounds 는 배열일 때만 새 배열로 분리한다.
        원 항목은 center 를 새 객체로 분리하고, path 와 area 항목의 points 는 분리하지 않고 원본 배열 참조를 유지한다.

    동작:
        스타일, bounds, clipBounds 복제본을 만든다.
        원 항목이면 center 까지 새 객체로 바꾼 복제본을 반환한다.
        그 밖의 항목이면 points 참조를 유지한 복제본을 반환한다.

toTerrainImmediateLocalPoints(vectors: Array<TerrainPoint | Array<number>> = [], origin: TerrainPoint = {x: 0, y: 0}) -> Array<TerrainPoint>
    역할: world 좌표 목록을 tile 기준점을 뺀 평면 local 좌표로 바꾼다.

    처리 기준:
        각 점은 객체 속성 x, y 를 먼저 보고 없으면 배열 0, 1 번 성분을 보며 둘 다 없으면 0 으로 본다.
        거짓으로 판정되는 점은 결과에서 제외하므로 입력과 결과의 길이가 달라질 수 있다.
        z 성분은 버리고 x, y 만 남긴다.

    동작:
        좌표를 순회하며 비어 있는 점을 건너뛴다.
        각 점의 x, y 에서 기준점 x, y 를 빼 새 점 객체를 만들어 모아 반환한다.

toTerrainImmediateLocalBounds(bounds: Array<number> | undefined, origin: TerrainPoint = {x: 0, y: 0}) -> Array<number> | undefined
    역할: world 좌표 평면 범위를 tile local 좌표 범위로 바꾼다.

    처리 기준:
        배열이 아니거나 성분이 4개보다 적으면 제한 범위가 없다고 보고 undefined 를 반환한다.
        기준점 성분과 범위 성분은 숫자로 바꿀 수 없으면 0 으로 본다.

    동작:
        입력 범위의 유효성을 확인하고 실패하면 undefined 를 반환한다.
        최소·최대 X 에서 기준점 X 를, 최소·최대 Y 에서 기준점 Y 를 뺀 새 배열을 반환한다.

clipTerrainAreaPoints(points: Array<TerrainPoint>, bounds: Array<number> | undefined) -> Array<TerrainPoint>
    역할: 면 도형을 tile 제한 사각형 안으로 잘라 tile 밖 변이 shader 반복에 들어가지 않게 한다.

    처리 기준:
        점이 3개보다 적으면 면을 만들 수 없으므로 빈 목록을 반환한다.
        제한 범위가 배열이 아니거나 성분이 4개보다 적으면 자르지 않고 입력 목록을 그대로 반환한다.
        네 경계를 최소 X, 최대 X, 최소 Y, 최대 Y 순서로 차례로 적용하며 경계 위의 점은 안쪽으로 본다.
        경계마다 결과가 비면 남은 경계를 적용하지 않고 중단한다.
        같은 좌표가 연속으로 들어가지 않게 마지막 점과 비교해 중복을 건너뛰고, 잘린 뒤 첫 점과 마지막 점이 같으면 마지막 점을 제거해 닫힌 중복점을 남기지 않는다.

    동작:
        입력 점 수와 제한 범위 유효성을 판정하여 각각 빈 목록 또는 입력 목록을 반환한다.
        경계마다 이전 점과 현재 점의 안쪽 여부를 비교하며, 안팎이 바뀌는 변에서는 경계와의 교점을 비율로 계산해 넣는다.
        현재 점이 안쪽이면 그 점도 넣고, 경계 적용이 끝나면 닫힘 중복점을 제거한다.
        네 경계를 모두 적용한 결과 점 목록을 반환한다.

doesTerrainAreaCoverClipBounds(points: Array<TerrainPoint>, bounds: Array<number> | undefined) -> boolean
    역할: 잘린 면이 제한 사각형 전체를 덮는지 판정해 shader가 tile 전체 채움 빠른 경로를 쓸 수 있게 한다.

    처리 기준:
        점이 정확히 4개이고 제한 범위 성분이 4개 이상일 때만 판정하며 그 밖에는 덮지 않는다고 본다.
        제한 사각형의 너비나 높이가 0 이하이면 덮지 않는다고 본다.
        허용 오차는 좌표 크기에 비례한 machine epsilon 의 64배이며, 좌표계가 커도 부동소수 오차 때문에 덮음 판정이 뒤집히지 않게 한다.
        네 모서리마다 허용 오차 안에 있는 점이 하나라도 있어야 하고, 부호 있는 면적의 두 배가 사각형 면적의 두 배와 허용 오차 안에서 같아야 한다.

    동작:
        점 수와 제한 범위, 사각형 크기를 판정하여 조건에 맞지 않으면 false 를 반환한다.
        좌표 크기에 비례한 허용 오차를 계산하고 네 모서리가 모두 점 하나와 일치하는지 확인한다.
        점 목록의 부호 있는 면적을 구해 사각형 면적과 허용 오차 안에서 같은지로 반환한다.

normalizeTerrainImmediateStyle(style: TerrainStyle = {}, highlighted: boolean = false) -> TerrainPreparedStyle
    역할: 원본 스타일을 shader가 그대로 쓸 수 있는 RGBA 배열과 확정된 숫자 값으로 바꾼다.

    인터페이스:
        highlighted: 강조 스타일 적용 여부이며 선 두께와 선 투명도를 키운다.
        반환: 색상, 투명도, 선 두께, 표시 여부가 모두 확정된 스타일이다.

    처리 기준:
        선 두께는 0.0001 이상으로 올린 뒤 강조 시 1.35 배로 키우므로 두께 0 이 들어와도 선이 사라지지 않는다.
        선 투명도는 strokeOpacity, opacity, 1.0 순서로 고르고 0 에서 1 로 자르며, 강조 시 1.15 배로 키운 뒤 1.0 을 넘지 않게 자른다.
        면 투명도는 fillOpacity, opacity, 1.0 순서로 고르고, 음수이면 hole 표식인 -1.0 으로 확정하고 그 밖에는 0 에서 1 로 자른다.
        선 색상은 strokeColor, color, 기본 색 `[0.2, 0.6, 0.9, 1.0]` 순서로 고른다.
        면 색상은 fillColor 만 보고 없으면 흰색 `[1.0, 1.0, 1.0, 1.0]` 을 쓰며 color 를 대체값으로 쓰지 않는다.
        표시 여부는 false 만 숨김으로 본다.

    동작:
        선 두께를 하한 보정과 강조 배율로 확정한다.
        선 투명도와 면 투명도를 각각 위 우선순위로 고르고 자른다.
        선 색상과 면 색상을 각각 RGBA 배열로 바꾼다.
        면 투명도가 음수이면 hole 표식 -1.0 으로 확정한 뒤 확정된 스타일을 반환한다.

clampTerrainOpacity(value: unknown) -> number
    역할: 투명도 값을 0 에서 1 사이의 유한한 숫자로 확정한다.

    처리 기준:
        값이 없으면 1.0 으로 보고, 숫자로 바꿀 수 없거나 유한하지 않으면 1.0 을 반환한다.
        유한한 숫자는 0 과 1 사이로 자른다.

    동작:
        값을 숫자로 바꿔 유한성을 확인하고 실패하면 1.0 을 반환한다.
        0 과 1 사이로 자른 값을 반환한다.

normalizeTerrainColorArray(value: TerrainColor | undefined) -> Array<number>
    역할: 색상 표현을 shader가 읽을 RGBA 4성분 배열로 바꾼다.

    처리 기준:
        배열 입력은 네 성분을 그대로 숫자로 바꾸며 없는 성분은 1.0 으로 본다.
        Color 입력은 r, g, b 를 쓰고 알파는 1.0 으로 고정한다.
        그 밖의 표현은 Color 로 변환해 읽으며 값이 없으면 흰색으로 본다. 이 경로에서는 알파가 항상 1.0 이므로 색상 문자열이나 숫자로 준 알파는 반영되지 않는다.

    의존: THREE — 색상 표현 판정과 변환; 생성자: {new THREE.Color()}; 속성 읽기: {Color, r, g, b}

    동작:
        배열이면 네 성분을 숫자로 확정해 반환한다.
        Color 이면 세 채널과 알파 1.0 을 반환한다.
        그 밖의 표현은 Color 로 만든 뒤 세 채널과 알파 1.0 을 반환한다.

computeTerrainImmediateBounds(points: Array<TerrainPoint> = [], padding: number = 0) -> Array<number>
    역할: 점 목록을 감싸는 평면 범위를 선 두께 여백까지 포함해 계산한다.

    인터페이스:
        padding: 범위 네 변에 더할 여백이며 보통 선 두께를 넘긴다.
        반환: `[minX, minY, maxX, maxY]` 이며 점이 없으면 네 값이 모두 0 이다.

    처리 기준: 배열이 아니거나 비어 있으면 여백을 적용하지 않고 `[0, 0, 0, 0]` 을 반환한다.

    동작:
        점을 순회하며 최소·최대 X 와 Y 를 누적한다.
        누적한 범위에 여백을 적용한 네 값을 반환한다.

createTerrainPreparedFeatureBaseImmediate(featureBase: TerrainFeature) -> TerrainPreparedEntry | undefined
    역할: feature base를 도형 유형별 준비 항목으로 바꾸고 그 결과를 feature base에 cache한다.

    인터페이스: 반환: 도형별 준비 항목이며 식별자가 없거나 좌표가 부족하면 undefined 다.

    처리 기준:
        featureId 가 undefined 또는 null 이면 준비하지 않는다.
        cache 는 feature base 의 `__preparedImmediateBase` 에 보관하며 revision, shaderLayerRenderOrder, compositionBatchIndex 가 모두 같을 때만 재사용한다. 합성 batch 순번은 feature 내용이 같아도 합성 계획이 바뀌면 달라지므로 재사용 조건에 포함한다.
        shaderLayerRenderOrder 가 없으면 3.0e38 을 사용하여 가장 뒤 shader layer 로 본다.
        표시 여부는 feature base 와 정규화된 스타일이 모두 숨김이 아닐 때만 true 다.
        원 항목은 좌표가 2개 이상이어야 하고 반경은 feature 의 radius 를 우선 쓰고 없으면 첫 점과 마지막 점 거리로 계산하며, 반경이 0 이하이면 준비하지 않는다.
        면 항목은 좌표가 3개 이상이어야 하고 구멍이면 면 투명도를 hole 표식 -1.0 으로 덮어쓴다.
        선 항목은 좌표가 2개 이상이어야 하고 단순화 허용 거리는 0 이상으로 보정한다.
        유형이 원과 면이 아니면 모두 선 항목으로 본다.
        좌표 목록은 복제하지 않고 feature base 의 배열 참조를 그대로 사용한다.
        cache 에 저장할 값은 복제본이며 반환하는 항목은 복제하지 않은 원본이므로, 호출자가 반환 항목을 바꾸어도 cache 는 오염되지 않는다.

    동작:
        featureId 유무를 판정하고 revision, shader layer 순서, 합성 batch 순번을 확정한다.
        cache 가 세 값과 모두 일치하면 cache 복제본을 반환한다.
        스타일을 정규화하고 표시 여부를 확정한다.
        유형에 따라 원, 면, 선 준비 항목을 만들며 각 유형의 최소 좌표 수와 반경 조건에 걸리면 undefined 를 반환한다.
        만든 항목의 복제본과 확정한 revision 을 feature base 의 cache 에 저장하고 원본 항목을 반환한다.

prepareTerrainFeatureEntryImmediate(featureBase: TerrainFeature, tileOrigin: TerrainPoint) -> TerrainPreparedLocalEntry | undefined
    역할: 준비 항목을 tile-local 좌표와 평면 범위까지 확정해 packing 입력으로 만든다.

    인터페이스:
        tileOrigin: 좌표에서 뺄 tile 기준점이며 성분이 없으면 0 으로 본다.
        반환: local 좌표와 bounds 가 확정된 항목이며 좌표가 부족하면 undefined 다.

    처리 기준:
        원 항목의 bounds 는 중심에서 반경과 선 두께를 더한 정사각형이다.
        선과 면 항목의 bounds 는 local 좌표에 선 두께를 여백으로 준 범위다.
        면 항목만 제한 범위로 자르며, 자른 뒤 점이 3개보다 적으면 항목을 버린다.
        선 항목은 이 단계에서 자르지 않고 local clipBounds 를 결과에 보존하여 평탄화 단계에서 선분별로 자른다.
        선 항목의 local 점이 2개보다 적으면 항목을 버린다.

    동작:
        준비 항목을 얻고 없으면 undefined 를 반환한다.
        원 항목이면 복제한 뒤 중심을 tile 기준점만큼 옮기고 반경과 선 두께로 bounds 를 만들어 반환한다.

        제한 범위와 좌표를 tile local 좌표로 옮긴다.
        면 항목이면 local 제한 범위로 좌표를 자른다.
        유형별 최소 좌표 수에 미달하면 undefined 를 반환한다.
        복제한 항목에 local 좌표와 제한 범위, 선 두께 여백을 적용한 bounds 를 담아 반환한다.

createTerrainImmediateBucketMeta(count: number) -> Array<Array<number>>
    역할: bucket 정렬을 하지 않는 packed 상태에서 모든 bucket이 전체 항목을 후보로 보게 하는 메타 배열을 만든다.

    인터페이스: 반환: 길이가 TERRAIN_DECAL_BUCKET_COUNT 인 `[0, count, 0, 0]` 배열 목록이다.

    처리 기준: 항목 수가 음수이거나 숫자가 아니면 0 으로 보정하며, bucket 개수는 실제 격자 크기와 무관하게 항상 고정 길이다.

    동작:
        항목 수를 0 이상으로 보정하고 고정 길이만큼 `[0, 보정된 수, 0, 0]` 을 채운 배열을 반환한다.

computeTerrainImmediateFullBounds(entries: Array<TerrainPreparedEntry> = []) -> Array<number>
    역할: 준비 항목들의 bounds를 합쳐 bucket 격자와 shader가 쓸 전체 범위를 만든다.

    인터페이스: 반환: `[minX, minY, maxX, maxY]` 이며 계산할 수 없으면 `[0, 0, 1, 1]` 이다.

    처리 기준:
        배열이 아니거나 비어 있으면 `[0, 0, 1, 1]` 을 반환한다.
        bounds 가 배열이 아니거나 성분이 4개보다 적은 항목은 건너뛴다.
        유효한 bounds 가 하나도 없어 누적값이 유한하지 않으면 `[0, 0, 1, 1]` 을 반환하므로 이후 나눗셈에서 0 너비가 생기지 않는다.

    동작:
        항목의 bounds 를 순회하며 최소·최대 X 와 Y 를 누적한다.
        누적값이 모두 유한하면 그 범위를, 아니면 기본 범위를 반환한다.

createTerrainLinearTextureLayout(texelCount: number) -> {width: number, height: number, capacity: number}
    역할: 선형 RGBA texel 목록을 GPU 한 변 제한을 넘지 않는 2차원 texture 크기로 배치한다.

    인터페이스: 반환: texture 너비와 높이, 그리고 두 값을 곱한 전체 texel 용량이다.

    처리 기준:
        texel 수는 1 이상으로 올리고 소수는 올림하며, null 과 undefined 는 0 으로 본 뒤 1 로 보정한다.
        너비는 texel 수의 제곱근을 올린 값, 높이는 texel 수를 너비로 나눈 값을 올린 값이다.
        용량은 요청한 texel 수보다 클 수 있으므로 호출자가 남는 texel 을 0 으로 두고 배열을 할당한다.

    동작:
        texel 수를 1 이상 정수로 보정한다.
        제곱근 기준으로 너비와 높이를 정하고 두 값과 용량을 반환한다.

createTerrainImmediatePathState(entries: Array<TerrainPreparedLocalPathEntry> = []) -> TerrainBucketState | undefined
    역할: 선 도형 packed 상태 생성의 진입점을 하나로 유지한다.

    처리 기준: 선 도형은 polyline 행이 아니라 선분 행 기반으로 packing 하므로 선분 상태 생성으로 전부 위임한다. 위임 대상이 항상 상태 객체를 반환하므로 현재 구현에서 undefined 는 나오지 않는다.

    동작:
        선분 기반 packed 상태 생성 결과를 그대로 반환한다.

createTerrainImmediatePathSegmentState(entries: Array<TerrainPreparedLocalPathEntry> = []) -> TerrainBucketState
    역할: polyline 목록을 선분 단위 선형 texture 배치로 바꿔 shader가 선분 하나의 거리 판정만 하도록 만든다.

    인터페이스: 반환: 선분 데이터, 선분 메타, path 스타일, bucket index를 모두 담은 packed 상태이며 count 는 선분 수다.

    처리 기준:
        항목이 없거나 평탄화 결과 선분이 없으면 빈 상태를 복제해 반환하며, 선 도형은 별도 bounds texture 를 만들지 않으므로 bounds 와 bucket 메타 배열을 포함하지 않는다.
        선분 데이터 texel 은 vec4(x1, y1, x2, y2) 이고 선분 메타 texel 은 vec4(pathStyleIndex, strokeWidth, visible, shaderLayerRenderOrder) 다. 두 texture 는 같은 배치 크기를 쓴다.
        path 스타일 하나는 TERRAIN_DECAL_PATH_STYLE_TEXELS 개 texel 을 쓰며 첫 texel 은 vec4(strokeColor.rgb, strokeOpacity), 둘째 texel 의 첫 성분은 합성 batch 순번이다.
        스타일이 없어도 스타일 texture 는 최소 한 스타일 분량을 확보한다.
        선분 메타의 표시 여부는 스타일 항목이 숨김일 때만 0 이며, 스타일 순번이 가리키는 항목이 없으면 두께 0, 표시 1, shader layer 순서 3.0e38 으로 채운다.
        bucket index 는 선분 수가 TERRAIN_DECAL_PATH_BUCKET_THRESHOLD 를 넘을 때만 만들며, 그렇지 않으면 무효 index `[-1, -1, -1, -1]` 만 담고 useBuckets 를 0 으로 둔다.
        bucket index texture 는 앞쪽에 bucket 메타 texel 을 그대로 싣고 그 뒤에 선분 index 를 이어 붙이므로, shader 가 메타와 index 를 한 texture 에서 읽는다.

    동작:
        항목이 없으면 bounds 와 bucket 메타 없는 빈 상태 복제본을 반환한다.

        polyline 을 선분과 스타일 목록으로 평탄화하고 선분이 없으면 같은 빈 상태를 반환한다.

        선분 수와 스타일 texel 수로 각각 선형 texture 배치를 정하고 데이터·메타·스타일 배열을 할당한다.

        스타일마다 선 색상, 선 투명도, 합성 batch 순번을 기록한다.
        선분마다 양 끝 좌표를 데이터 배열에, 스타일 순번과 두께·표시 여부·shader layer 순서를 메타 배열에 기록한다.
        선분 수가 임계값을 넘으면 bucket index 상태를 만들고, 아니면 무효 index 만 둔다.

        bucket 메타 texel 과 선분 index 를 한 배열에 이어 담아 bucket index texture 배치를 확정한다.
        선분 수, 세 texture 배치와 배열, 전체 범위, bucket 격자, bucket 사용 여부를 담은 상태를 반환한다.

simplifyTerrainPathPoints(points: Array<TerrainPoint>, tolerance: number) -> Array<TerrainPoint>
    역할: 화면 축척에 따른 허용 거리보다 가까운 중간점을 제거해 선분 수를 줄인다.

    처리 기준:
        허용 거리가 0 이하이거나 점이 2개 이하이면 입력 목록을 그대로 반환한다.
        비교는 직전에 남긴 점과의 거리 제곱으로 하며 허용 거리 제곱보다 작은 점만 버린다.
        시작점과 종료점은 항상 보존하므로 결과는 최소 2개다.

    동작:
        허용 거리와 점 수를 판정하여 단순화가 필요 없으면 입력을 반환한다.
        시작점을 넣고 중간점을 순회하며 직전 보존점과의 거리 제곱이 허용값 이상인 점만 남긴다.
        마지막 점을 넣어 반환한다.

clipTerrainPathSegment(start: TerrainPoint, end: TerrainPoint, bounds: Array<number> | undefined) -> Array<number> | undefined
    역할: 선분 하나를 제한 사각형 안으로 잘라 tile 밖 구간이 packing에 들어가지 않게 한다.

    인터페이스: 반환: 잘린 `[x1, y1, x2, y2]` 이며 사각형 밖에 완전히 있으면 undefined 다.

    처리 기준:
        제한 범위가 배열이 아니거나 성분이 4개보다 적으면 자르지 않고 원래 좌표를 반환한다.
        네 경계를 매개변수 비율 구간으로 좁히며, 축에 평행한 선분은 해당 축의 위치가 범위 밖이면 곧바로 undefined 를 반환한다.
        허용 비율 구간이 뒤집히면 즉시 undefined 를 반환한다.

    동작:
        양 끝 좌표를 숫자로 확정하고 제한 범위 유효성을 판정한다.
        네 경계마다 방향 성분과 여유값으로 비율을 구해 허용 구간을 좁히고, 구간이 뒤집히면 undefined 를 반환한다.
        확정된 최소·최대 비율로 잘린 양 끝 좌표를 반환한다.

flattenTerrainImmediatePathSegments(entries: Array<TerrainPreparedLocalPathEntry> = []) -> TerrainFlattenedPathState
    역할: polyline 항목을 선분 목록과 스타일 목록으로 나누고 선분 전체를 감싸는 범위를 계산한다.

    인터페이스: 반환: 선분 목록, 항목별 스타일 목록, 선 두께 여백을 포함한 전체 범위다.

    처리 기준:
        점이 2개보다 적은 항목은 스타일도 만들지 않고 건너뛴다.
        스타일 순번은 실제로 선분을 만들 수 있는 항목 순서대로 0 부터 부여하므로 입력 index 와 다를 수 있다.
        선분 bounds 는 bucket 판정 정확도를 위해 항목의 선 두께만큼 여백을 포함한다.
        제한 범위로 잘려 사라진 선분과 양 끝이 같아진 선분은 버리므로, 스타일 항목이 만들어졌어도 선분이 하나도 없을 수 있다.
        유효한 선분이 하나도 없으면 빈 목록과 기본 범위 `[0, 0, 1, 1]` 을 반환한다.

    동작:
        항목마다 허용 거리로 점을 단순화하고 점이 부족하면 건너뛴다.
        항목의 스타일, 표시 여부, 표시 순서, revision, shader layer 순서, 합성 batch 순번을 스타일 목록에 넣고 그 순번을 이후 선분에 부여한다.
        인접한 두 점마다 제한 범위로 자르고 남은 선분만 만든다.
        선분 bounds 로 전체 범위를 누적하고 선분을 목록에 넣는다.
        누적 범위가 유한하지 않으면 빈 결과를, 아니면 선분·스타일·전체 범위를 반환한다.

createTerrainImmediatePathSegmentBucketIndexState(segments: Array<TerrainPathSegment> = [], fullBounds: Array<number>, bucketGrid: Array<number>) -> TerrainBucketIndexState
    역할: 선분 index를 bucket별로 모아 shader가 화면 위치에서 후보 선분만 읽게 한다.

    인터페이스:
        fullBounds: bucket 격자가 덮는 전체 범위다.
        bucketGrid: 가로·세로 bucket 개수이며 없으면 기본 격자 크기를 쓴다.
        반환: bucket별 `[startTexel, texelCount, 0, 0]` 메타와 4개 단위로 채운 index 배열, index texture 높이다.

    처리 기준:
        격자 크기는 1 이상으로 보정한다.
        중복 검사에는 Set 대신 bucket 개수 길이의 표시 배열을 쓰며 -1 로 초기화한다.
        index 배열은 RGBA texel 하나가 index 4개를 담으므로 bucket 마지막에 4의 배수가 되도록 무효 index -1 로 채운다.
        메타의 시작값과 개수는 texel 단위이며 index 개수가 아니다.
        선분이 하나도 담기지 않으면 무효 index 네 개를 넣어 최소 한 texel 을 확보한다.

    동작:
        격자 크기를 보정하고 bucket별 빈 목록과 중복 표시 배열을 만든다.
        선분을 순서대로 bucket 후보로 등록한다.
        bucket 을 순회하며 texel 수를 계산해 메타에 넣고 index 를 이어 붙인 뒤 4의 배수 정렬 여백을 채운다.
        index 가 비면 무효 index 를 넣고, 메타와 index 배열, 높이를 반환한다.

addTerrainPathSegmentToBuckets(segment: TerrainPathSegment, segmentIndex: number, fullBounds: Array<number>, gridX: number, gridY: number, buckets: Array<Array<number>>, checkedMark: Int32Array) -> void
    역할: 선분 중심이 실제로 지나는 cell과 선 두께가 닿을 수 있는 주변 cell에만 후보를 등록한다.

    인터페이스:
        buckets: bucket별 선분 index 목록이며 이 함수가 직접 채운다.
        checkedMark: 같은 선분과 bucket 조합의 교차 검사를 반복하지 않도록 쓰는 표시 배열이다.

    처리 기준:
        전체 범위의 너비와 높이는 1e-6 이상으로 보정해 0 으로 나누지 않는다.
        시작·종료 cell 좌표는 격자 범위 안으로 자른다.
        선 두께 여백은 선분 bounds와 선분 길이의 차이의 절반에 긴 cell 변 하나를 더해 계산하며, 가로·세로 여백 중 큰 값을 capsule 반경으로 쓴다. Worker와 같은 추가 여유로 AA와 raster 두께 보정을 포함한다.
        격자 순회는 방향별 다음 경계까지의 비율을 비교하는 방식이며 최대 격자 칸 수만큼만 반복해 무한 순회를 막는다.
        두 방향 비율이 허용 오차 안에서 같으면 선분이 격자 모서리를 지나는 경우이므로 맞닿은 두 cell 도 후보에 넣어 경계 픽셀이 빠지지 않게 한다.

    동작:
        cell 크기, 방향 성분, 길이 제곱, 시작·종료 cell 과 여백 cell 수를 계산한다.
        현재 cell 과 여백 범위에 선분 후보를 등록한다.
        종료 cell 에 도달하면 순회를 끝낸다.
        다음 경계까지의 비율이 작은 축으로 cell 을 한 칸 옮기고 그 축의 비율을 갱신한다.
        두 비율이 허용 오차 안에서 같으면 가로·세로로 맞닿은 두 cell 도 등록한 뒤 대각선으로 옮기고 두 비율을 함께 갱신한다.

addTerrainPathBucketCell(cellX: number, cellY: number, paddingCellsX: number, paddingCellsY: number, segmentIndex: number, gridX: number, gridY: number, buckets: Array<Array<number>>, checkedMark: Int32Array, segment: TerrainPathSegment, padding: number, dx: number, dy: number, lengthSq: number, gridMinX: number, gridMinY: number, cellWidth: number, cellHeight: number) -> void
    역할: 중심 cell과 여백 범위의 각 bucket에 대해 capsule 교차를 한 번만 검사하고 통과한 bucket에 선분 index를 넣는다.

    처리 기준:
        중심 cell 이 격자 밖이면 아무 것도 하지 않는다.
        여백 범위는 격자 경계로 자른다.
        표시 배열에 이미 같은 선분 번호가 있으면 검사를 건너뛴다. 검사 실패한 bucket 도 표시하므로 인접한 중심 cell 에서 같은 capsule 검사를 반복하지 않는다.
        교차 검사를 통과한 bucket 에만 선분 index 를 넣으므로 여백 cell 이 후보를 과도하게 늘리지 않는다.

    동작:
        중심 cell 의 격자 범위를 판정하고 여백을 적용한 bucket 범위를 계산한다.
        범위 안의 bucket 마다 표시 배열로 중복을 걸러 내고 표시를 남긴다.
        bucket 의 실제 사각형 좌표를 구해 capsule 교차를 검사한다.
        교차하면 그 bucket 목록에 선분 index 를 넣는다.

doesTerrainPathCapsuleIntersectCell(segment: TerrainPathSegment, padding: number, dx: number, dy: number, lengthSq: number, minX: number, minY: number, maxX: number, maxY: number) -> boolean
    역할: 선분과 선 두께 반경으로 만든 capsule이 bucket 사각형에 닿는지 판정한다.

    처리 기준:
        양 끝점 중 하나가 사각형 안에 있거나 선분이 사각형을 지나면 곧바로 닿는다고 본다.
        반경이 0 이하이면 선분 자체 판정 결과만 사용한다.
        반경이 있으면 양 끝점과 사각형의 최소 거리, 그리고 사각형 네 모서리와 선분의 최소 거리를 반경 제곱과 비교한다.

    동작:
        양 끝점의 사각형 포함 여부와 선분의 사각형 통과 여부를 확인해 하나라도 참이면 true 를 반환한다.

        반경이 0 이하이면 false 를 반환한다.
        양 끝점과 사각형의 최소 거리 제곱을 구해 반경 제곱 안이면 true 를 반환한다.
        사각형 네 모서리와 선분의 최소 거리 제곱을 차례로 구해 반경 제곱 안인 모서리가 있으면 true 를 반환한다.

doesTerrainPathSegmentIntersectBounds(x1: number, y1: number, dx: number, dy: number, minX: number, minY: number, maxX: number, maxY: number) -> boolean
    역할: 선분이 사각형 내부를 지나는지 임시 객체 없이 판정한다.

    처리 기준:
        X 방향 성분이 0 이면 시작 X 가 범위 밖일 때만 지나지 않는다고 본다.
        Y 방향 성분이 0 이면 시작 Y 의 범위 포함 여부로 결정한다.
        두 축 모두 방향이 있으면 축별 비율 구간을 교차시켜 남는 구간이 있는지로 판정한다.

    동작:
        X 축 방향 여부에 따라 비율 구간을 좁히고 구간이 뒤집히면 false 를 반환한다.
        Y 축 방향이 없으면 시작 Y 의 범위 포함 여부를 반환한다.
        Y 축 비율 구간까지 좁힌 뒤 남는 구간이 있는지로 반환한다.

terrainPointToCellDistanceSq(x: number, y: number, minX: number, minY: number, maxX: number, maxY: number) -> number
    역할: 점과 사각형 사이의 최소 거리 제곱을 계산한다.

    처리 기준: 점이 축 방향으로 사각형 범위 안에 있으면 그 축 거리를 0 으로 보므로 사각형 내부 점은 0 을 반환한다.

    동작:
        축마다 사각형 범위를 벗어난 거리만 구해 제곱합을 반환한다.

terrainPointToSegmentDistanceSq(x: number, y: number, x1: number, y1: number, dx: number, dy: number, lengthSq: number) -> number
    역할: 점과 선분 사이의 최소 거리 제곱을 계산한다.

    처리 기준: 선분 길이 제곱이 0 이하이면 시작점까지의 거리로 보며, 그 밖에는 투영 비율을 0 에서 1 로 잘라 선분 밖으로 나가지 않게 한다.

    동작:
        점을 선분에 투영한 비율을 구해 0 과 1 사이로 자른다.
        그 비율의 선분 위 점과 입력 점의 거리 제곱을 반환한다.

getTerrainImmediateBucketRange(bounds: Array<number>, fullBounds: Array<number>, bucketGrid: Array<number>) -> TerrainBounds
    역할: 대상 평면 범위가 걸치는 bucket 격자 index 범위를 구한다.

    처리 기준:
        격자 크기는 1 이상으로 보정한다.
        전체 범위의 너비와 높이는 1e-6 이상으로 보정해 0 으로 나누지 않는다.
        정규화한 위치는 0 과 0.999999 사이로 자르므로 최대 경계에 딱 붙은 값도 마지막 bucket 안에 들어간다.
        최종 index 는 격자 범위 안으로 다시 자른다.

    동작:
        격자 크기와 전체 범위 크기를 보정한다.
        대상 범위의 네 좌표를 정규화해 격자 index 로 바꾼 최소·최대 범위를 반환한다.

createTerrainImmediatePathBucketIndexState(entries: Array<TerrainPreparedLocalPathEntry> = [], fullBounds: Array<number>, bucketGrid: Array<number>) -> TerrainBucketIndexState
    역할: polyline 항목 index를 항목이 지나는 bucket마다 모아 둔다. [확인 Q-002]

    인터페이스: 반환: bucket별 `[start, count, 0, 0]` 메타와 항목 index 를 이어 붙인 배열이며 index texture 높이는 담지 않는다.

    처리 기준:
        격자 크기는 1 이상으로 보정한다.
        선분 단위가 아니라 항목 단위 index 를 담으므로 같은 항목의 여러 선분이 같은 bucket 에 들어가도 index 는 한 번만 남는다.
        후보 등록은 선분 bounds 가 걸치는 bucket 사각형 범위 전체를 대상으로 하며 capsule 교차 검사를 하지 않는다.
        메타의 시작값과 개수는 index 개수 단위이며 texel 단위가 아니다.
        index 가 비면 0 하나를 담아 최소 길이를 확보한다.

    동작:
        격자 크기를 보정하고 bucket별 index 집합을 만든다.
        항목마다 선 두께를 여백으로 준 선분 bounds 를 구하고 그 범위의 bucket 에 항목 index 를 넣는다.

        bucket 을 순회하며 시작 위치와 개수를 메타에 넣고 index 를 이어 붙인다.
        메타와 index 배열을 반환한다.

createTerrainImmediateAreaState(entries: Array<TerrainPreparedLocalAreaEntry> = []) -> TerrainBucketState
    역할: 면 항목을 Worker와 같은 선형 레이아웃의 packed 상태로 만든다.

    인터페이스: 반환: 행 header와 점 목록을 담은 데이터 배열, 항목별 스타일과 bounds 배열을 담은 packed 상태다.

    처리 기준:
        항목이 없으면 bounds 를 포함한 빈 상태를 복제해 반환한다.
        데이터 texture 는 Worker 의 `packAreaEntries()` 와 같은 선형 레이아웃이며, 앞쪽 rowCount texel 은 행 header vec4(pointCount, shaderLayerRenderOrder, compositionBatchIndex, pointStart) 이고 그 뒤에 항목별 점 목록이 이어진다.
        같은 항목 객체가 여러 행에 나타나면 점 시작 위치를 공유하고 점 목록은 한 번만 기록한다. 즉시 경로는 bucket 정렬을 하지 않아 행마다 항목이 하나씩이지만 같은 계약을 유지해 shader 와 합성기가 두 경로를 구분하지 않고 읽는다.
        점 texel 에는 x, y 만 기록하고 남은 두 성분은 0 으로 둔다.
        스타일 texture 는 항목마다 3 texel 을 쓰며 순서는 면 색상과 면 투명도, 선 색상과 선 투명도, 그리고 선 두께·표시 여부·표시 순서·전체 덮음 표식이다.
        스타일·bounds texture 도 데이터 texture 와 같은 선형 2차원 배치(`createTerrainLinearTextureLayout(rowCount * 3)`, `createTerrainLinearTextureLayout(rowCount)`)를 쓴다(2026-09-22). 이전의 "폭 3 × 행 수"·"폭 1 × 행 수" 배치는 폴리곤 수가 `maxTextureSize` 를 넘는 타일에서 높이가 GPU 한계를 넘어 업로드가 실패하고 면이 그려지지 않았다(건물 z11 타일 20,873행 실측). 배열의 행 오프셋(`row * 12`, `row * 4`)은 바뀌지 않으며 배열 길이만 texture capacity 만큼 0 으로 패딩된다. shader 는 `readLinearTexel(areaStyleTexture, size, row * 3 + col)`, `readLinearTexel(areaBoundsTexture, size, row)` 로 읽는다.
        전체 덮음 표식은 잘린 면이 제한 사각형을 정확히 덮을 때만 1 이며 shader 의 빠른 채움 경로 조건이다.
        bounds texture 는 항목마다 1 texel 이고 bucket 메타는 모든 bucket 이 전체 항목을 후보로 보는 형태다.

    동작:
        항목이 없으면 bounds 를 포함한 빈 상태 복제본을 반환한다.

        항목별 점 시작 위치를 정하고 전체 점 texel 수를 누적한다.
        행 header 와 점 목록을 합친 texel 수로 선형 texture 배치를 정하고 데이터·스타일·bounds 배열을 할당한다.

        행마다 header 네 성분을 기록하고, 아직 기록하지 않은 항목이면 점 좌표를 점 구간에 기록한다.
        행마다 두 색상과 투명도, 선 두께, 표시 여부, 표시 순서를 스타일 배열에 기록한다.
        제한 사각형 전체 덮음 여부를 판정해 스타일 마지막 성분에 기록한다.
        항목 bounds 를 bounds 배열에 기록한다.
        항목 수, texture 배치와 배열, 점 texel 수, 전체 범위, bucket 메타와 격자를 담은 상태를 반환한다.

createTerrainImmediateCircleState(entries: Array<TerrainPreparedLocalCircleEntry> = []) -> TerrainBucketState
    역할: 원 항목을 GPU 한 변 제한을 피하는 2차원 texture 배치의 packed 상태로 만든다.

    인터페이스: 반환: 중심·반경 데이터 배열과 항목별 스타일 배열을 담은 packed 상태다.

    처리 기준:
        항목이 없으면 bounds 없는 빈 상태를 복제해 반환한다.
        데이터 texel 은 vec4(centerX, centerY, radius, shaderLayerRenderOrder) 로 항목마다 하나다.
        스타일은 항목마다 3 texel 을 쓰며 순서는 면 색상과 면 투명도, 선 색상과 선 투명도, 그리고 선 두께·표시 여부·표시 순서·합성 batch 순번이다.
        원은 별도 bounds texture 를 만들지 않고 bucket 메타는 모든 bucket 이 전체 항목을 후보로 보는 형태다.

    동작:
        항목이 없으면 bounds 없는 빈 상태 복제본을 반환한다.

        항목 수와 항목 수의 3배로 각각 데이터와 스타일 선형 texture 배치를 정하고 배열을 할당한다.

        항목마다 중심, 반경, shader layer 순서를 데이터 배열에 기록한다.
        항목마다 두 색상과 투명도, 선 두께, 표시 여부, 표시 순서, 합성 batch 순번을 스타일 배열에 기록한다.
        항목 수, texture 배치와 배열, 전체 범위, bucket 메타와 격자를 담은 상태를 반환한다.

createEmptyImmediateTerrainBucketState(withBounds: boolean = true, withBucketMeta: boolean = true) -> TerrainBucketState
    역할: 적용할 항목이 없을 때도 shader가 uniform 구조를 유지할 수 있는 최소 packed 상태를 만든다.

    인터페이스:
        withBounds: bounds texture 세 필드를 포함할지 여부다.
        withBucketMeta: 별도 bucket 메타 배열을 포함할지 여부다.
        반환: 항목 수 0 과 1x1 texture 를 가진 빈 상태다.

    처리 기준:
        항목 수는 0, 데이터·스타일·선분 메타 배열은 texel 하나 크기이며 전체 범위는 `[0, 0, 1, 1]` 이다.
        bucket index 배열은 선 도형 전용이지만 빈 상태에서는 공통으로 무효 index 네 개를 둔다.
        bucket 메타를 포함하면 고정 길이만큼 `[0, 0, 0, 0]` 을 채우므로 어떤 bucket 에서도 후보가 없다.

    동작:
        항목 수 0 과 1x1 데이터·스타일·선분 메타 배열, 기본 전체 범위, 기본 격자, 무효 bucket index 를 담은 상태를 만든다.
        요청에 따라 bucket 메타 배열과 bounds 세 필드를 덧붙여 반환한다.

즉시 경로 집계 책임 그룹
    역할: 여러 feature base에서 즉시 경로가 사용할 대표 uniform 값과 규모를 뽑는다.

    resolveTerrainImmediateThreshold(featureBases: Array<TerrainFeature> = []) -> number
        역할: tile 전체에 적용할 임계값 하나를 고른다. [확인 Q-003]

        처리 기준: 앞에서부터 threshold 가 유한한 첫 feature 의 값을 쓰고 없으면 1.0 을 반환한다.

        동작:
            feature 를 순회하여 유한한 threshold 를 찾으면 그 값을 반환하고, 없으면 1.0 을 반환한다.

    resolveTerrainImmediateOpacity(featureBases: Array<TerrainFeature> = []) -> number
        역할: tile 전체에 적용할 투명도 하나를 고른다. [확인 Q-003]

        처리 기준: 앞에서부터 opacity 가 유한한 첫 feature 의 값을 쓰고 없으면 1.0 을 반환한다.

        동작:
            feature 를 순회하여 유한한 opacity 를 찾으면 그 값을 반환하고, 없으면 1.0 을 반환한다.

    estimateTerrainImmediatePointCount(featureBases: Array<TerrainFeature> = []) -> number
        역할: 즉시 경로 허용 여부를 판단할 좌표 총수를 센다.

        처리 기준: 좌표 목록이 배열이 아닌 feature 는 0 으로 센다.

        동작:
            feature 의 좌표 수를 모두 더해 반환한다.

shouldUseImmediateTerrainBuild(featureBases: Array<TerrainFeature> = [], opt: Partial<{forceWorkerBuild: boolean, forceImmediateBuild: boolean}> = {}) -> boolean
    역할: Worker를 쓰지 않고 즉시 경로로 packed 상태를 만들어도 되는지 판정한다.

    처리 기준:
        Worker 강제 옵션이 정확히 true 이면 즉시 경로를 쓰지 않으며, 즉시 강제 옵션보다 먼저 판정한다.
        즉시 강제 옵션이 정확히 true 이면 feature 수와 좌표 수를 검사하지 않는다.
        강제 옵션이 없으면 feature 목록이 배열이고 비어 있지 않아야 하며, feature 수가 TERRAIN_DECAL_IMMEDIATE_MAX_FEATURES 이하이고 좌표 총수가 TERRAIN_DECAL_IMMEDIATE_MAX_POINTS 이하일 때만 허용한다.

    동작:
        Worker 강제와 즉시 강제 옵션을 이 순서로 판정하여 각각 false 와 true 를 반환한다.
        feature 목록이 비어 있거나 feature 수 한도를 넘으면 false 를 반환한다.
        좌표 총수를 세어 한도 이하인지로 반환한다.

buildImmediateTerrainWorkerResult(tileKey: string, revision: number, featureSignature: string, tileOrigin: TerrainPoint, featureBases: Array<TerrainFeature> = []) -> TerrainWorkerResult
    역할: Worker 없이 만든 packed 상태를 Worker 결과와 같은 모양으로 묶는다.

    인터페이스: 반환: 즉시 생성 표식이 붙은 worker 결과 형태의 값이다.

    처리 기준:
        준비에 실패한 feature 는 건너뛰므로 결과 항목 수가 입력 feature 수보다 적을 수 있다.
        유형 분류는 path, area, circle 만 인정하고 그 밖의 유형은 어느 목록에도 넣지 않는다.
        featureCount 는 세 packed 상태의 count 합이며, 선 도형은 항목 수가 아니라 선분 수가 더해진다.

    동작:
        feature 마다 tile-local 준비 항목을 만들어 유형별 목록에 분류한다.
        선, 면, 원 packed 상태를 각각 만든다.

        임계값과 투명도를 feature 목록에서 고른다.
        packing 에 쓴 기준점의 값 사본을 만든다.
        tile key, revision, 서명, 기준점 사본, 항목 수 합, 임계값, 투명도, 세 packed 상태와 즉시 생성 표식을 담아 반환한다.

cloneCachedTerrainWorkerResult(cached: TerrainWorkerResult, tileKey: string, revision: number) -> TerrainWorkerResult | undefined
    역할: cache에 보관한 worker 결과를 다른 tile key와 revision으로 재사용할 수 있게 다시 묶는다.

    처리 기준:
        cache 값이 거짓으로 판정되면 undefined 를 반환한다.
        tile key 와 revision 은 인수 값으로 바꾸고 서명, 항목 수, 임계값, 투명도는 cache 값을 그대로 쓴다.
        cache 값이 packing 된 기준점은 값 사본으로 옮겨, 재생 결과가 어느 기준점의 좌표계인지 잃지 않게 한다. cache 값에 기준점이 없으면 결과에도 없다.
        immediatePrepared 표식과 byteLength 는 결과에 옮기지 않으므로 재사용한 결과는 즉시 생성 여부를 잃는다.
        선 도형과 원 도형은 bounds texture 를 만들지 않는 형태로, 면 도형은 bounds 를 포함한 형태로 복제한다.

    동작:
        cache 값이 없으면 undefined 를 반환한다.
        cache 값의 기준점을 값 사본으로 만든다.
        세 packed 상태를 각각 bounds 포함 여부를 달리해 복제한다.
        새 tile key 와 revision, 기준점 사본을 담은 결과 객체를 반환한다.

cloneCachedTerrainBucketState(state: TerrainBucketState | undefined, withBounds: boolean) -> TerrainBucketState | undefined
    역할: packed 상태를 다른 tile에 다시 붙일 수 있도록 얕게 복제하고 빠진 크기 값을 보충한다.

    인터페이스:
        withBounds: bounds 배열을 복제 대상에 포함할지 여부다.
        반환: 복제된 상태이며 입력이 없으면 undefined 다.

    처리 기준:
        전체 범위와 bucket 격자는 배열일 때만 새 배열로 분리한다.
        데이터·스타일·선분 메타·bounds·bucket index 배열이 이미 Float32Array 이면 새로 만들지 않고 원본 참조를 그대로 공유하므로, 복제 결과를 통해 배열을 바꾸면 원본 cache 값도 함께 바뀐다.
        Float32Array 가 아닌 배열은 Float32Array 로 변환하여 담는다.
        bucket 메타는 항목이 배열이면 새 배열로 분리하고, 객체이면 x, y, z, w 를 뽑아 네 성분 배열로 바꾼다.
        선분 메타가 있으면 너비는 없을 때 1 로 보고, 높이는 없을 때 배열 길이를 4 로 나눈 값을 1 이상으로 올려 보충한다.
        bucket index 가 있으면 너비는 없을 때 1 로 보고, 높이는 없을 때 길이가 4의 배수면 texel 기준으로, 아니면 index 하나가 한 행인 옛 형식 기준으로 추정한다.
        withBounds 가 참이지만 원본에 bounds 배열이 없으면 길이 0 의 Float32Array 가 되고 bounds texture 크기 필드는 보충하지 않는다.

    동작:
        입력이 없으면 undefined 를 반환한다.
        상태를 펼쳐 복사하고 전체 범위, bucket 격자, 데이터·스타일 배열을 위 기준으로 확정한다.
        bucket 메타가 배열이면 항목별로 네 성분 배열로 정규화한다.
        선분 메타가 있으면 배열과 너비·높이를 보충한다.
        bounds 포함 요청이면 bounds 배열을 확정한다.
        bucket index 가 있으면 배열과 너비를 확정하고 높이를 추정해 보충한 뒤 복제 결과를 반환한다.

byte 크기 추정 책임 그룹
    역할: cache 용량 관리에 쓸 대략적인 byte 크기를 packed 배열과 uniform texture에서 추정한다. 실제 GPU 사용량이 아니라 cache 예산 계산용 근사값이다.

    estimateTerrainWorkerResultByteLength(workerResult: TerrainWorkerResult) -> number
        역할: worker 결과 하나가 차지할 크기를 추정한다.

        처리 기준: 세 packed 상태의 추정값을 더하고 결과 객체 자체의 몫으로 1024 바이트를 더한다.

        동작:
            선, 면, 원 packed 상태의 추정값을 모두 더하고 1024 를 더해 반환한다.

    estimateTerrainBufferStateByteLength(state: TerrainBufferState | undefined) -> number
        역할: material 상태가 들고 있는 uniform texture 데이터 크기를 추정한다.

        처리 기준:
            uniforms 가 없으면 1024 바이트로 본다.
            uniform 값의 `image.data.byteLength` 가 있는 항목만 더하므로 texture 가 아닌 uniform 은 세지 않는다.

        동작:
            uniforms 가 없으면 1024 를 반환한다.
            uniform 을 순회하며 texture 데이터 byte 길이를 1024 에 누적해 반환한다.

    estimateTerrainBucketByteLength(state: TerrainBucketState | undefined) -> number
        역할: packed 상태 하나가 차지할 크기를 추정한다.

        처리 기준:
            상태가 없으면 0 을 반환하므로 없는 도형은 예산을 차지하지 않는다.
            데이터, 선분 메타, 스타일, bounds, bucket index 배열의 byte 길이를 더하고 상태 객체 몫으로 256 바이트를 더한다.

        동작:
            다섯 배열의 byte 길이를 모두 더하고 256 을 더해 반환한다.

takeLruCacheValue(lruCache: LRUCache, key: string) -> TerrainCacheValue | undefined
    역할: LRU cache에서 값을 꺼내면서 항목을 제거하고 잔여 용량을 되돌린다.

    인터페이스: 반환: cache 에서 제거한 값이며 없으면 undefined 다.

    처리 기준:
        cache 나 `has` 를 쓸 수 없으면 아무 것도 바꾸지 않고 undefined 를 반환한다.
        값을 꺼낸 뒤 반드시 cache 에서 제거하므로 호출자가 소유권을 가져간다.
        잔여 용량에는 값의 byteLength 를 더하며 값이 크기를 모르면 0 을 더한다.

    의존: LRUCache — cache 항목 회수와 잔여 용량 복원; 속성 읽기: {cache}; 속성 읽기·쓰기: {remainsCapacity}

    동작:
        cache 에 key 가 있는지 확인하고 없으면 undefined 를 반환한다.
        값을 꺼내 cache 에서 제거한다.
        값의 byteLength 를 잔여 용량에 더하고 값을 반환한다.

disposeTerrainUniformTextures(uniforms: Record<string, IUniform> = {}) -> void
    역할: uniform map이 들고 있던 GPU texture를 해제한다.

    처리 기준:
        값이 Texture 인 uniform 만 해제하고 나머지는 건드리지 않는다.
        uniform map 에서 항목을 제거하지 않으므로 해제된 texture 참조는 그대로 남는다.

    의존: THREE — texture 판정과 GPU 자원 해제; 속성 읽기: {Texture}; 함수: {dispose()}

    동작:
        uniform 을 순회하며 값이 Texture 이면 해제한다.

normalizeTerrainFeatureRequest(feature: TerrainFeature, opt: TerrainManagerOption = {}) -> TerrainFeature | undefined
    역할: 호출자가 준 다양한 형태의 feature를 이후 모든 계산이 전제할 수 있는 정규 feature로 확정하고 두 hash를 채운다.

    인터페이스:
        opt: source 범위와 기준 좌표, 준비된 feature 재사용 여부를 담은 옵션이다.
        반환: 정규화된 feature이며 식별자를 만들 수 없으면 undefined 다.

    처리 기준:
        식별자는 feature.featureId 를 먼저 쓰고 없으면 feature.uid, 그다음 feature.id 를 대체로 쓰며 거짓으로 판정되면 정규화하지 않는다. 따라서 식별자 0 과 빈 문자열은 거부된다.
        유형은 소문자로 바꾼 뒤 `circle` 과 `pointbuffer` 는 원, `area`·`polygon`·`multipolygon` 은 면, 그 밖의 모든 값은 선으로 확정한다.
        원본 유형은 feature.sourceType 을 먼저 쓰고 없으면 feature.type, 그다음 정규화된 유형 normalizedType 을 대체로 쓰므로 원본 유형 정보가 없어도 정규화된 유형이 남는다.
        sourceKey 는 opt.sourceKey 를 먼저 쓰고 없으면 feature.sourceKey, 둘 다 없으면 `default` 를 대체로 쓴다.
        sourceIdentityKey 도 opt.sourceIdentityKey 를 먼저 쓰고 없으면 feature.sourceIdentityKey 를 쓴다.
        compositionGroupKey 는 반대로 feature.compositionGroupKey 를 먼저 쓰고 없을 때만 opt.compositionGroupKey 를 대체로 쓴다. 합성 group identity 는 Layer 수명주기가 소유하므로 옵션 값을 대체값으로만 쓴다.
        scopedFeatureKey 는 feature 값이 있으면 그대로 쓰고 없을 때만 source key 와 식별자로 만든다.
        기준 좌표는 feature.origin 을 먼저 쓰고 없으면 opt.origin, 둘 다 없으면 세 성분 0 을 대체로 쓴다.
        `__terrainPrepared` 가 정확히 true 인 feature 는 이미 정규화된 payload 로 보고 스타일·좌표·기준 좌표·제한 범위를 복사하지 않고 원본 참조를 그대로 쓴다. 그 밖에는 스타일을 얕게 복사하고 좌표를 x, y, z 객체로 다시 만들며 제한 범위는 앞 4개 성분만 숫자로 확정해 새 배열로 만든다.
        준비된 payload 이면서 opt.consumePreparedFeatures 가 정확히 true 이면 새 객체를 만들지 않고 입력 feature 자체의 필드를 덮어써 반환하므로 호출자의 객체가 그 자리에서 바뀐다. 그 밖에는 항상 새 객체를 만든다.
        강조 여부는 feature 와 스타일 중 하나라도 true 이면 true 이고, 표시 여부는 둘 다 숨김이 아닐 때만 true 다.
        renderOrder, revision, featureCompositionOrdinal 은 유한하지 않으면 0 으로 확정한다.
        threshold, opacity, radius, geometryRevision, propertyRevision 은 유한하지 않으면 undefined 로 남기므로 값 없음과 0 이 구분된다.
        path 단순화 허용 거리는 0 이상으로 보정하며 숫자로 바꿀 수 없으면 0 이다.
        합성 feature key 는 feature 값이 없으면 식별자를 문자열로 바꿔 쓴다. Layer 가 WFS 와 실행 중 추가 feature 의 충돌을 구분한 identity 를 주지 않는 경우를 위한 대체값이다.
        immutableFeatureHash 는 유한한 입력값이 있으면 재계산하지 않고, 없을 때만 새로 계산한다. featureHash 는 항상 다시 계산한다.

    동작:
        feature 유무와 식별자를 판정하여 만들 수 없으면 undefined 를 반환한다.
        유형, 좌표, 기준 좌표, 스타일, source 범위 값과 scopedFeatureKey 를 위 우선순위로 확정한다.

        준비된 payload 여부에 따라 스타일·좌표·기준 좌표·제한 범위를 원본 참조로 쓰거나 새 값으로 만든다.
        합성 group key, 합성 feature key, 합성 순번과 immutableFeatureHash 입력값을 확정한다.
        준비된 payload 를 소비하는 요청이면 입력 feature 의 필드를 직접 덮어쓰고, 아니면 같은 필드를 담은 새 객체를 만든다.
        immutableFeatureHash 가 없으면 계산해 채운다.
        tile별 featureHash 를 계산해 채운 뒤 정규 feature 를 반환한다.

normalizeTerrainFeatureBatch(features: Array<TerrainFeature> = [], opt: TerrainManagerOption = {}) -> Array<TerrainFeature>
    역할: feature 목록을 정규화하면서 같은 식별자가 두 번 들어오지 않게 한다.

    처리 기준:
        정규화에 실패한 feature 는 결과에서 제외한다.
        중복 판정 기준은 정규화된 featureId 이며 scopedFeatureKey 가 아니므로, source 가 달라도 같은 식별자면 뒤에 온 feature 가 버려진다.
        먼저 나온 feature 를 남기고 입력 순서를 유지한다.

    동작:
        feature 를 순회하며 정규화한다.
        정규화에 실패했거나 이미 본 식별자면 건너뛰고, 아니면 식별자를 기록하고 결과에 넣는다.
        결과 목록을 반환한다.

buildTerrainImmutableFeatureHash(feature: TerrainFeature) -> number
    역할: tile 위치와 clipping 조건을 제외하여 여러 tile에서 재사용할 수 있는 feature hash를 만든다.

    처리 기준:
        결합 순서는 source 범위 key, 유형, 원본 유형, 강조, 표시, renderOrder, geometry revision, property revision, 임계값, 투명도, 반경, 구멍 여부, 스타일이며 순서가 바뀌면 값이 달라진다.
        source 범위 key 가 없으면 `unversioned` 를 결합한다.
        값이 없는 숫자 필드는 0 으로, 강조와 구멍은 true 만 1, 표시는 false 만 0 으로 접어 결합한다.
        geometryRevision 이 유한하면 좌표를 순회하지 않고 좌표 수만 결합한다. 신뢰할 revision 이 있을 때 좌표 전체 순회를 생략하기 위한 조건이다.
        geometryRevision 이 유한하지 않으면 좌표를 모두 결합한 뒤 좌표 수도 결합한다.

    동작:
        초기 hash 에 source 범위 key, 유형 두 개, 표시 상태와 숫자 필드를 순서대로 결합한다.
        스타일을 결합한다.
        geometryRevision 이 유한하지 않으면 좌표를 순서대로 결합한다.
        좌표 수를 결합하고 32비트 부호 없는 정수로 반환한다.

buildTerrainNormalizedFeatureHash(feature: TerrainFeature) -> number
    역할: tile별 위치와 clipping 조건을 immutable hash에 결합해 tile 단위 비교용 hash를 만든다.

    처리 기준:
        scopedFeatureKey 가 없으면 빈 문자열을 결합한다.
        immutableFeatureHash 가 유한하면 그 값을 쓰고, 없으면 즉시 계산해 결합한다.
        제한 범위는 있는 성분만 순서대로 결합하므로 성분 수가 달라지면 hash 도 달라진다.
        기준 좌표는 세 성분 모두 결합하므로 tile 위치가 다르면 hash 가 달라진다.

    동작:
        초기 hash 에 scopedFeatureKey 를 결합한다.
        immutableFeatureHash 를 확정해 결합한다.
        path 단순화 허용 거리와 제한 범위 성분을 차례로 결합한다.
        기준 좌표를 결합하고 32비트 부호 없는 정수로 반환한다.

convertLegacyTerrainPayloadToFeatures(payload: TerrainLegacyPayload = {}, opt: TerrainManagerOption = {}) -> Array<TerrainFeature>
    역할: 구버전 도형 묶음 payload를 현재 feature 목록으로 바꿔 같은 처리 경로에 올린다.

    인터페이스: 반환: 선, 면, 원 순서로 만들어진 feature 목록이며 정규화는 하지 않는다.

    처리 기준:
        기준 좌표는 opt.origin 이 없으면 세 성분 0 을 쓰고 모든 feature 가 같은 객체를 공유한다.
        feature 식별자는 `유형_현재까지 만든 개수` 형식이므로 payload 안 순서에만 의존하고 원본 식별자를 보존하지 않는다.
        모든 feature 의 revision 은 0 이고 임계값과 투명도는 payload 전체 값을 그대로 쓴다.
        좌표는 원본 배열을 그대로 넘기며 점 객체로 변환하지 않는다.
        변환 순서는 선 목록, 복합 선 목록, 면 목록과 복합 면 목록을 이은 목록, 원 목록이다.
        선은 원본 유형을 `lineString` 과 `multiLineString` 으로 구분하고 선 투명도는 색상 배열의 알파를 먼저 보고 없으면 도형의 opacity 를 쓴다.
        면은 원본 유형을 `polygon` 으로 두고 면 투명도는 색상 알파를 먼저 보고 없으면 payload 의 opacity 를 쓰며, 그 값이 음수이면 구멍으로 판정한다.
        원은 중심이 없으면 원점을 쓰고 반경만큼 X 방향으로 떨어진 점을 두 번째 좌표로 만들어 반경을 좌표로도 표현한다.
        표시 여부, 강조 여부, 표시 순서는 각 도형 항목에서 읽으며 표시 여부는 false 만 숨김으로 본다.

    의존: THREE — 원 중심 기본값 생성; 생성자: {new THREE.Vector3()}

    동작:
        기준 좌표를 확정한다.
        선 목록과 복합 선 목록을 순회하며 선 색상과 투명도, 두께를 스타일로 만든 선 feature 를 넣는다.

        면 목록과 복합 면 목록을 이어 순회하며 면 투명도로 구멍 여부까지 판정한 면 feature 를 넣는다.
        원 목록을 순회하며 중심과 반경으로 두 좌표를 만든 원 feature 를 넣는다.
        만들어진 feature 목록을 반환한다.

decodeLegacyTerrainColor(colorValue: unknown) -> Color
    역할: 구버전 색상 표현을 Color 객체로 확정한다.

    처리 기준:
        배열이면 앞 세 성분을 채널로 쓰고 없는 성분은 1 로 본다.
        Color 이면 복제하여 원본 공유를 막는다.
        그 밖의 값은 Color 로 변환하며 값이 없으면 흰색을 쓴다.

    의존: THREE — 색상 변환과 복제; 생성자: {new THREE.Color()}; 속성 읽기: {Color}; 함수: {clone()}

    동작:
        색상 표현 종류를 판정하여 배열·복제·변환 중 하나로 Color 를 만들어 반환한다.

decodeLegacyTerrainOpacity(colorValue: unknown, fallback: number = 1.0) -> number
    역할: 구버전 색상 배열의 알파를 투명도로 읽고 없으면 대체값을 쓴다.

    처리 기준:
        배열이고 네 번째 성분이 유한할 때만 그 값을 쓴다.
        그 밖에는 대체값을 쓰며 대체값이 유한하지 않으면 1.0 을 반환한다.
        음수 알파도 그대로 반환하므로 호출자가 구멍 판정에 쓸 수 있다.

    동작:
        색상 배열의 알파가 유한하면 그 값을 반환한다.
        아니면 대체값의 유한성을 확인해 대체값 또는 1.0 을 반환한다.

createTerrainMaterialStateFromWorkerResult(tileEntry: TerrainTileEntry, workerResult: TerrainWorkerResult, opt: TerrainManagerOption = {}) -> TerrainBufferState
    역할: packed worker 결과를 material에 바로 붙일 수 있는 define과 uniform 묶음으로 바꾼다.

    인터페이스: 반환: define, uniform, 반투명 여부, 강제 갱신 요청과 revision 을 담은 buffer 상태다.

    처리 기준:
        worker 결과의 featureCount 가 0 보다 크면 terrain decal 전체 define 을 켠다.
        적용된 항목 수는 선, 면, 원 적용 결과의 합이며 선 도형은 선분 수가 더해진다.
        적용된 항목이 하나도 없으면 define 을 모두 버린 빈 define 과 base uniform 만 담아 반환하므로, worker 결과의 featureCount 만 0 보다 컸던 경우 terrain decal define 도 함께 사라진다.
        어느 경로든 적용된 항목 수를 `featureCount` 로 상태에 남긴다. 빈 상태의 0 은 "decal define 없이 적용이 끝난 정상 상태" 의 근거가 되어 presentation 조회(`getTerrainTilePresentationState`)가 material 상태 없음으로 오판하지 않게 한다.
        적용된 항목이 있으면 합성기가 batch 범위를 다시 계산할 때 packed 원본을 재생성하지 않도록 세 packed 상태 참조를 그대로 보관한다.
        어느 경로든 material 강제 갱신을 요청하고 revision 은 worker 결과 값이며 없으면 0 이다.
        어느 경로든 worker 결과가 packing 된 기준점을 값 사본으로 buffer 상태에 남긴다. packed 좌표와 이후 합성 bounds 는 이 기준점에 묶여 있으므로, GPU 상태 재사용 판정이 현재 tile 기준점과 대조할 근거가 된다. worker 결과에 기준점이 없으면 상태에도 없다.

    동작:
        base uniform 을 만든다.
        worker 결과 항목 수가 0 보다 크면 terrain decal define 을 켠다.
        선과 면 packed 상태를 uniform 과 define 에 적용하고 적용 수를 누적한다.
        원 packed 상태를 적용하고 적용 수를 누적한다.
        worker 결과의 기준점을 값 사본으로 만든다.
        적용 수가 0 이하이면 빈 define 과 uniform, 반투명 없음, 강제 갱신, revision, 기준점 사본, featureCount 0 을 담아 반환한다.
        반투명 decal 포함 여부를 판정한다.
        define, uniform, 반투명 여부, 강제 갱신, revision, 기준점 사본, featureCount 와 packed 원본 참조를 담아 반환한다.

hasTranslucentTerrainDecal(workerResult: TerrainWorkerResult | undefined) -> boolean
    역할: 화면에 적용되는 도형 중 알파가 1 미만인 항목이 있는지 판정해 반투명 렌더 경로 선택 근거를 만든다.

    처리 기준: 원 도형도 면 도형과 같은 스타일 배치 규칙으로 판정한다.

    동작:
        선 도형 스타일을 판정한다.
        면 도형과 원 도형 스타일을 차례로 판정하여 하나라도 반투명이면 true 를 반환한다.

hasTranslucentTerrainPathStyle(state: TerrainBucketState | undefined) -> boolean
    역할: 선 도형이 참조하는 스타일 중 반투명 항목이 있는지 판정한다. [확인 Q-004]

    처리 기준:
        스타일 배열이 없거나 texel 하나보다 작으면 반투명이 없다고 본다.
        선분 메타가 있으면 선분마다 표시 여부가 0.5 보다 큰 것만 보고 그 선분이 가리키는 스타일 순번의 알파를 검사한다.
        선분 메타가 없으면 스타일 texture 높이만큼 행을 훑으며 알파를 검사하고, 높이가 없으면 배열 길이와 너비로 추정한다.
        알파 판정 조건은 0 이상이면서 1 미만이므로 hole 표식인 음수 알파는 반투명으로 보지 않는다.
        스타일 알파 위치는 행 시작에서 네 번째 성분이며 행 간격을 스타일 texture 너비로 계산한다.

    동작:
        스타일 배열 유효성을 확인하고 없으면 false 를 반환한다.
        선분 메타가 있으면 표시되는 선분마다 스타일 순번을 구해 그 알파가 0 이상 1 미만인지 확인하고, 하나라도 맞으면 true 를 반환한다.
        선분 메타가 없으면 스타일 행을 훑어 같은 조건을 확인해 반환한다.

hasTranslucentTerrainAreaStyle(state: TerrainBucketState | undefined) -> boolean
    역할: 면 또는 원 도형 스타일 중 반투명 항목이 있는지 판정한다. [확인 Q-005]

    처리 기준:
        스타일 배열이 없거나 두 texel 보다 작으면 반투명이 없다고 본다.
        행 간격은 스타일 texture 너비로 계산하고 너비가 없으면 3 을 대체로 쓴다. 행 수는 state.styleHeight 를 먼저 쓰고 없으면 state.count, 둘 다 없으면 0 을 대체로 쓴다.
        스타일 너비가 3 이상일 때만 표시 여부 성분을 읽고, 그보다 작으면 항상 표시로 본다.
        표시 여부가 0.5 이하인 행은 건너뛴다.
        면 알파와 선 알파를 각각 검사하며 0 이상 1 미만일 때만 반투명으로 보므로 hole 표식인 음수 알파는 제외된다.

    동작:
        스타일 배열 유효성을 확인하고 없으면 false 를 반환한다.
        행마다 표시 여부를 확인해 숨김이면 건너뛴다.
        면 알파와 선 알파가 0 이상 1 미만인지 확인해 하나라도 맞으면 true 를 반환하고, 끝까지 없으면 false 를 반환한다.

createTerrainBaseUniforms(tileEntry: TerrainTileEntry, workerResult: TerrainWorkerResult, opt: TerrainManagerOption = {}) -> Record<string, IUniform>
    역할: 도형 종류와 무관하게 항상 필요한 uniform 세 개를 만든다. [확인 Q-003]

    인터페이스: 반환: 임계값, 깊이 보정값, tile 축척 uniform 을 담은 map 이다.

    처리 기준:
        임계값은 opt.threshold 를 먼저 쓰고 없으면 workerResult.threshold, 그다음 TERRAIN_DECAL_BASE_UNIFORMS.threshold 를 대체로 쓴다.
        깊이 보정값은 opt.depthOffset 을 먼저 쓰고 없으면 TERRAIN_DECAL_BASE_UNIFORMS.depthOffset 을 대체로 쓰며 worker 결과는 보지 않는다.
        tile 축척은 terrain mesh 의 x, y 축척이며 mesh 나 축척이 없으면 1 을 쓴다.

    의존: THREE — tile 축척 uniform 생성; 생성자: {new THREE.Vector2()}

    동작:
        terrain mesh 를 조회해 축척 벡터를 만든다.
        임계값과 깊이 보정값을 위 우선순위로 확정한 uniform map 을 반환한다.

applyTerrainBucketState(uniforms: Record<string, IUniform>, defines: Record<string, number>, prefix: string, state: TerrainBucketState | undefined) -> number
    역할: 선 또는 면 packed 상태를 float data texture와 uniform으로 옮기고 해당 도형 define을 켠다.

    인터페이스:
        uniforms: 호출자가 소유한 uniform map 이며 이 함수가 항목을 추가한다.
        defines: 호출자가 소유한 define map 이며 이 함수가 항목을 추가한다.
        prefix: uniform 이름 접두어이며 `path` 일 때만 선분 전용 uniform 을 만든다.
        반환: 적용된 항목 수이며 상태가 없거나 항목 수가 0 이하면 0 이다.

    처리 기준:
        상태가 없거나 항목 수가 0 이하이면 uniform 과 define 을 하나도 바꾸지 않고 0 을 반환한다.
        define 이름은 접두어를 대문자로 바꾼 `USE_<접두어>_DECAL` 이다.
        선 도형은 선분 기반이므로 접두어를 이름에 넣지 않는 고정 uniform 이름을 쓰고, 선분 데이터·선분 메타·path 스타일 texture 와 각 크기, 전체 범위, 선분 수, bucket 사용 여부, bucket 격자, bucket index texture 와 크기를 만든 뒤 곧바로 반환한다.
        선분 메타가 없으면 texel 하나 크기의 빈 배열을 쓰고, 메타 높이가 없으면 배열 길이를 4 로 나눈 값을 1 이상으로 올려 쓴다.
        bucket 을 쓰지 않으면 bucket index texture 를 무효 index 네 개의 1x1 texture 로 만들어 shader 가 언제나 같은 sampler 를 바인딩할 수 있게 한다.
        bucket index 높이가 없으면 배열 길이를 너비와 4 로 나눈 값을 올려 추정한다.
        선 도형이 아니면 접두어를 붙인 데이터·스타일·bounds texture 와 각 크기, 전체 범위, 항목 수, bucket 메타 uniform 배열, bucket 격자를 만든다.
        bucket 메타 uniform 배열은 길이가 TERRAIN_DECAL_BUCKET_COUNT 로 고정되므로 상태의 bucket 메타가 짧아도 나머지는 0 벡터로 채워진다.
        bucket 격자가 없으면 기본 격자 크기를 쓴다.

    의존: THREE — uniform 벡터 생성; 생성자: {new THREE.Vector2(), new THREE.Vector4()}

    동작:
        상태와 항목 수를 판정하여 적용할 것이 없으면 0 을 반환한다.
        해당 도형 define 을 켠다.
        선 도형이면 선분 데이터·선분 메타·path 스타일 texture 와 크기 uniform 을 만든다.
        선 도형이면 전체 범위와 선분 수, bucket 사용 여부와 격자를 uniform 에 넣는다.
        선 도형이면 bucket 사용 여부에 따라 실제 index 또는 무효 index 로 bucket index texture 와 크기를 만들고 선분 수를 반환한다.
        선 도형이 아니면 접두어를 붙인 데이터·스타일·bounds texture 와 크기, 전체 범위, 항목 수를 uniform 에 넣는다.
        bucket 메타를 고정 길이 벡터 배열로 바꾸고 bucket 격자를 uniform 에 넣은 뒤 항목 수를 반환한다.

applyTerrainCircleState(uniforms: Record<string, IUniform>, defines: Record<string, number>, state: TerrainBucketState | undefined) -> number
    역할: 원 packed 상태를 uniform으로 옮기고 원 도형 define을 켠다.

    인터페이스: 반환: 적용된 원 항목 수이며 상태가 없거나 항목 수가 0 이하면 0 이다.

    처리 기준:
        상태가 없거나 항목 수가 0 이하이면 uniform 과 define 을 바꾸지 않고 0 을 반환한다.
        원 도형은 bounds texture 를 쓰지 않으므로 데이터와 스타일 texture, 전체 범위, 항목 수, bucket 메타와 격자만 만든다.
        bucket 격자가 없으면 기본 격자 크기를 쓴다.

    의존: THREE — uniform 벡터 생성; 생성자: {new THREE.Vector2(), new THREE.Vector4()}

    동작:
        상태와 항목 수를 판정하여 적용할 것이 없으면 0 을 반환한다.
        원 도형 define 을 켜고 데이터·스타일 texture 와 크기 uniform 을 만든다.
        전체 범위와 항목 수를 uniform 에 넣는다.
        bucket 메타를 고정 길이 벡터 배열로 바꾸고 격자를 uniform 에 넣은 뒤 항목 수를 반환한다.

toVector4Array(source: Array<unknown> = [], count: number = 0) -> Array<Vector4>
    역할: bucket 메타를 shader uniform 배열이 요구하는 고정 길이 벡터 목록으로 바꾼다.

    인터페이스:
        count: 만들 벡터 개수이며 원본이 짧아도 이 길이를 채운다.
        반환: 요청한 개수만큼의 벡터 목록이다.

    처리 기준:
        먼저 요청 개수만큼 0 벡터를 만들고 원본과 요청 개수 중 작은 수만큼만 값을 채우므로 남는 항목은 0 벡터로 남는다.
        각 항목은 배열 성분 0 부터 3 을 먼저 보고 없으면 x, y, z, w 속성을 보며 둘 다 없으면 0 으로 본다.

    의존: THREE — uniform 벡터 생성; 생성자: {new THREE.Vector4()}; 함수: {set()}

    동작:
        요청 개수만큼 0 벡터 목록을 만든다.
        원본 항목 수와 요청 개수 중 작은 수만큼 네 성분을 읽어 벡터에 설정한다.
        벡터 목록을 반환한다.

createFloatDataTexture(arrayLike: ArrayLike<number>, width: number, height: number) -> DataTexture
    역할: packed 배열을 값 그대로 읽히는 float data texture로 만든다.

    처리 기준:
        입력이 Float32Array 이면 새로 만들지 않고 그대로 texture 데이터로 사용하므로 texture 와 packed 배열이 같은 buffer 를 공유한다.
        Float32Array 가 아니면 Float32Array 로 변환하며 값이 없으면 빈 배열로 본다.
        너비와 높이는 1 이상으로 보정하고 값이 없으면 1 을 쓴다.
        형식은 RGBA float 이며 확대·축소 filter 를 최근접으로, mipmap 생성을 끄고, 세로 뒤집기를 끄고, 두 축 좌표 반복을 경계 고정으로 설정해 packed 값이 보간이나 반복으로 변형되지 않게 한다.
        갱신 표식을 켜 다음 렌더에서 GPU 로 올라가게 한다.

    의존: THREE — float data texture 생성과 sampling 설정; 생성자: {new THREE.DataTexture()}; 속성 쓰기: {needsUpdate, magFilter, minFilter, generateMipmaps, flipY, wrapS, wrapT, type}; 상수: {RGBAFormat, FloatType, NearestFilter, ClampToEdgeWrapping}

    동작:
        입력 배열을 Float32Array 로 확정하고 크기를 1 이상으로 보정한다.
        RGBA float texture 를 만들고 갱신 표식과 sampling 설정을 적용해 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
이 단위는 모듈 상태를 보관하지 않으며, hashNumber 가 쓰는 공용 8바이트 버퍼만 모듈 수준에서 재사용한다.
표시 여부는 어디에서나 false 만 숨김으로 보고, 강조·구멍·강제 옵션 같은 표식은 정확히 true 일 때만 참으로 본다.
숫자 필드는 유한성을 확인한 뒤 사용하며, 값 없음을 0 으로 확정하는 함수와 undefined 로 남기는 함수가 다르므로 함수별 처리 기준을 따른다.
FNV-1a hash 결합은 항상 초기값 2166136261 에서 시작하고 결합 순서가 결과를 정하므로, 결합 항목의 추가·삭제·순서 변경은 기존 cache key 와 서명을 모두 무효화한다.
packed 상태의 texture 크기는 선형 texel 수를 제곱근 기준 2차원 배치로 바꾼 값이며, 용량이 실제 texel 수보다 클 수 있으므로 남는 texel 은 0 으로 남는다.
packed 상태 생성과 cache 복제는 Float32Array 를 새로 만들지 않고 공유하므로, 호출자는 복제 결과의 배열을 제자리에서 바꾸지 않아야 한다.
uniform 과 define map 은 호출자가 소유하며 applyTerrainBucketState 와 applyTerrainCircleState 는 항목을 추가하기만 하고 제거하지 않는다.
float data texture 는 이 단위가 만들고 소유권은 호출자에게 넘어가므로, 해제는 호출자가 disposeTerrainUniformTextures 로 수행한다.
호출자가 넘긴 객체를 바꾸는 경로는 다음과 같다. resolveTerrainTileMesh 는 tile entry 의 mesh 를 cache 로 되쓰고, createTerrainPreparedFeatureBaseImmediate 는 feature base 에 준비 결과를 cache 하며, normalizeTerrainFeatureRequest 는 준비된 payload 소비 요청에서 입력 feature 의 필드를 직접 덮어쓴다.
그 밖에 applyTerrainBucketState 와 applyTerrainCircleState 는 uniform 과 define map 을, addTerrainPathSegmentToBuckets 와 addTerrainPathBucketCell 은 bucket 목록과 중복 표시 배열을 채우고, takeLruCacheValue 는 LRU cache 항목과 잔여 용량을, disposeTerrainUniformTextures 는 uniform 이 참조하는 texture 를 해제 상태로 바꾼다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
