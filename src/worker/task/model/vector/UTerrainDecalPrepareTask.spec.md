# UTerrainDecalPrepareTask 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

terrain tile 하나에 속한 feature 목록을 Worker에서 tile-local 좌표의 packed buffer(path·area·circle별 Float32 texture 배열과 bucket 메타)로 변환한다. main thread는 이 결과로 DataTexture를 만들어 direct shader 경로 또는 offscreen 합성에 사용하므로, 이 단위의 출력 레이아웃은 shader의 texel 조회 규칙과 합성기의 batch 범위 계산 규칙과 같은 계약이다.

### 1.2 책임 범위

- Worker별 feature base cache 등록·복원과 versioned Terrain Payload(full·delta)의 tile 상태 재사용, 복구 가능한 cache miss 결과 반환.
- feature를 tile-local 좌표로 정규화하고 clip·단순화한 뒤 종류별로 packing한다. path는 segment 선형 레이아웃, area는 header와 점 목록의 선형 레이아웃, circle은 행 선형 레이아웃이다.
- 전송할 typed array의 buffer를 transferable 목록으로 모아 결과에 붙인다.

책임 경계: payload의 생성, tile revision 관리, DataTexture 생성과 GPU 업로드, 합성 순서 결정은 main thread의 관리자와 유틸리티가 담당한다. 이 단위는 입력 배열의 형식만 검증하고 feature의 의미(가시성·순서 값)는 그대로 전달한다.

### 1.3 주요 동작 방식

payload 수신 → feature base 등록·참조 해석(또는 versioned tile 상태 갱신) → feature별 entry 정규화(entry cache 재사용) → 종류별 bucket 정렬·packing → transferable 수집과 결과 조립. 실패 중 복구 가능한 종류(feature base cache miss, payload 상태 miss)는 예외 대신 `recoverableErrorCode`를 가진 결과로 돌려 main thread가 전체 상태를 한 번 다시 보내게 한다.

### 1.4 주요 사용처와 연계 대상

- 호출자: terrain Worker 진입점이 `prepareTileBuffers`와 `registerFeatureBases`를 작업 종류별로 호출한다. 요청은 `UTerrainWorkerScheduler`가 dispatch한다.
- 소비자: `UShaderTerrainDecalUtils.createTerrainMaterialStateFromWorkerResult`가 결과의 path·area·circle 상태로 DataTexture와 uniform을 만들고, `GDecalTerrainShader`가 texel을 조회하며, `UTerrainDecalCompositeComposer`가 area header와 style 배열에서 batch 범위를 읽는다.
- 같은 계약의 다른 구현: main-thread 즉시 경로 `UShaderTerrainDecalUtils.createTerrainImmediate*State`는 bucket 정렬 없이 같은 레이아웃을 만들며, 두 구현은 shader가 구분하지 않는다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
area packed texture는 texel [0, count)에 행 header vec4(pointCount, shaderLayerRenderOrder, compositionBatchIndex, pointStart)를 두고, 그 뒤에 entry별 점 목록을 한 번씩 이어 쓴다. 같은 entry가 여러 bucket 행에 나타나면 header만 반복하고 pointStart는 같은 위치를 가리킨다.
path packed texture는 segment 하나가 texel 하나(vec4(x1, y1, x2, y2))이며, segment 메타 texel과 style texel은 shader가 같은 순번으로 참조할 수 있어야 한다.
circle packed texture는 행 하나가 texel 하나(vec4(centerX, centerY, radius, shaderLayerRenderOrder))이며 style은 행당 3 texel이다.
모든 선형 texture의 크기는 createLinearTextureLayout이 정한 한 변이 짧은 2차원 배치를 따라야 하며, main-thread 즉시 경로와 같은 함수를 공유하지 않으므로 같은 계산식을 유지해야 한다.
versioned Payload의 delta는 이전 tile 상태의 featureSetRevision·geometryRevision이 header와 일치할 때만 적용하고, 그렇지 않으면 복구 가능한 상태 miss 결과를 돌려야 한다.
feature base cache miss는 versioned Payload에서는 항상, 이전 형식에서는 복구 허용 표시가 있을 때만 복구 가능한 결과로 돌려야 한다.
결과의 typed array buffer는 transferable 목록에 모두 포함되어 복사 없이 main thread로 넘어가야 한다.
hole area는 fillOpacity를 -1로 표시하여 shader가 채우기 대신 지우기로 해석할 수 있어야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: Worker 안에서 tile 요청마다 동기로 실행되며 결과에 처리 시간과 feature 수를 성능 정보로 붙인다.
우선순위: 정규화한 entry는 feature cache key·revision·tile origin으로 재사용하여 같은 feature의 반복 요청에서 좌표 변환과 clip을 다시 하지 않는다.
제한 조건: entry cache는 항목 1024개와 추정 32MB, feature base cache는 4096개와 추정 64MB, tile 상태 cache는 4096개와 추정 32MB 안으로 유지하며 초과 시 가장 오래된 항목부터 버린다.
제한 조건: path segment가 256개 이하이면 bucket을 만들지 않고 shader가 segment 목록을 직접 순회하게 한다. bucket 배열 생성·전송 비용이 이득보다 클 수 있기 때문이다.
제한 조건: area 점 목록은 bucket 중복과 행 padding 없이 한 번만 저장한다. 이전의 행×최장 점 수 격자 레이아웃이 만들던 업로드량을 줄이기 위한 것이다.
검증 기준: 선형 레이아웃 decode와 즉시 경로 동등성은 `unit-tests/terrain-decal-area-layout.test.mjs`(`npm run 테스트:단위실행하기`, `node --test`)가 확인한다. Playwright 가 기본 `testMatch` 로 잡지 않도록 `tests/` 밖에 둔다.
```

## 3. 정규 자연어 수도코드

```spec
TERRAIN_FEATURE_BASE_CACHE_MISS_CODE: string = 'TERRAIN_FEATURE_BASE_CACHE_MISS'
    참조한 feature base가 Worker cache에 없을 때 결과와 예외에 붙이는 복구 코드

TERRAIN_FEATURE_ENTRY_CACHE_BYTE_LIMIT: number = 32 × 1024 × 1024
    정규화 entry cache의 추정 byte 한도

TERRAIN_FEATURE_BASE_CACHE_BYTE_LIMIT: number = 64 × 1024 × 1024
    feature base cache의 추정 byte 한도. main thread가 요청마다 feature base 전체를 다시 보내므로 이 한도는 Worker 안의 축출 순서만 정한다.

TERRAIN_PAYLOAD_STATE_MISS_CODE: string = 'TERRAIN_PAYLOAD_STATE_MISS'
    delta payload를 적용할 이전 tile 상태가 없거나 revision이 어긋날 때의 복구 코드

TERRAIN_DECAL_PATH_STYLE_TEXELS: number = 2
    path style 하나가 차지하는 texel 수. main-thread 즉시 생성과 같은 배치를 유지한다.

TERRAIN_PAYLOAD_FORMAT_VERSION: number = 3
    이 단위가 해석하는 versioned Terrain Payload 형식 번호

TERRAIN_PAYLOAD_TILE_STATE_LIMIT: number = 4096
    tile 상태 cache의 항목 수 한도

TERRAIN_PAYLOAD_TILE_STATE_BYTE_LIMIT: number = 32 × 1024 × 1024
    tile 상태 cache의 추정 byte 한도

TERRAIN_PAYLOAD_HEADER_LENGTH: number = 9
    versioned Payload header(Uint32Array)의 최소 길이

TERRAIN_PAYLOAD_ADDED_META_STRIDE: number = 4
    added feature 하나의 metadata 성분 수(keyIndex, featureIndex, coordinateOffset, coordinateCount)

TERRAIN_PAYLOAD_UPDATED_META_STRIDE: number = 2
    updated feature 하나의 metadata 성분 수(keyIndex, featureIndex)

TERRAIN_PAYLOAD_GEOMETRY_OPTION_STRIDE: number = 6
    feature 하나의 geometry option 성분 수(radius, clipBounds 4개, pathSimplifyTolerance)

TERRAIN_PAYLOAD_PROPERTY_STRIDE: number = 13
    feature 하나의 property 성분 수(strokeColor 3, strokeOpacity, strokeWidth, fillColor 3, fillOpacity, renderOrder, revision, shaderLayerRenderOrder, compositionBatchIndex)

TERRAIN_FEATURE_TYPE_AREA: number = 2
    wire feature type 값 중 area

TERRAIN_FEATURE_TYPE_CIRCLE: number = 3
    wire feature type 값 중 circle. 그 밖의 값은 path로 해석한다.

TERRAIN_FEATURE_FLAG_VISIBLE: number = 1
    feature flag 비트: feature 가시성

TERRAIN_FEATURE_FLAG_STYLE_VISIBLE: number = 2
    feature flag 비트: style 가시성

TERRAIN_FEATURE_FLAG_HIGHLIGHT: number = 4
    feature flag 비트: 강조 표시

TERRAIN_FEATURE_FLAG_HOLE: number = 8
    feature flag 비트: hole area

TERRAIN_FEATURE_FLAG_RADIUS: number = 16
    feature flag 비트: geometry option에 radius가 있음

TERRAIN_FEATURE_FLAG_CLIP_BOUNDS: number = 32
    feature flag 비트: geometry option에 clipBounds 4개가 있음

TERRAIN_PAYLOAD_TILE_STATE_CACHE: WorkerLRUCache = 항목 4096개·추정 32MB 한도의 cache
    tile key별 versioned payload 적용 결과(featureSetRevision, geometryRevision, features Map)를 보관하여 다음 delta의 기준으로 쓴다.

TerrainFeature 부분 타입 명세
    이 명세에서 사용하는 필드:
        featureId: string
            feature 식별자이며 비어 있으면 entry를 만들지 않는다.
        featureCacheKey?: string
            geometry·style 조합을 식별하는 cache key. 없으면 featureId를 대신 쓴다.
        type: 'path' | 'area' | 'circle'
            도형 종류
        vectors: Array<{x: number, y: number} | Array<number>>
            world 좌표 점 목록. 배열 형식의 점은 첫 두 성분을 x, y로 읽는다.
        style?: object
            strokeColor·strokeOpacity·strokeWidth·fillColor·fillOpacity·visible과 이전 이름 color·opacity를 가질 수 있는 style 입력
        highlight?: boolean
            강조 표시 여부. 외곽선 두께와 불투명도를 키운다.
        visible?: boolean
            feature 가시성. false가 아니면 보이는 것으로 본다.
        renderOrder?: number
            같은 layer 안의 그리기 순서
        revision?: number
            feature 변경 버전이며 entry cache key에 포함된다.
        shaderLayerRenderOrder?: number
            shader layer 순서. 없으면 3.0e38로 두어 어떤 render order 창에도 들지 않게 한다.
        compositionBatchIndex?: number
            합성 batch 순번. 없으면 0이다.
        radius?: number
            circle 반지름. 없으면 첫 점과 마지막 점의 거리로 정한다.
        clipBounds?: Array<number>
            world 좌표 자르기 범위 `[minX, minY, maxX, maxY]`
        pathSimplifyTolerance?: number
            path 단순화 허용 거리
        isHole?: boolean
            hole area 여부
        threshold?: number
            이전 형식 payload에서 tile threshold를 정하는 첫 feature의 값
        opacity?: number
            이전 형식 payload에서 tile opacity를 정하는 첫 feature의 값

TerrainBucketState 부분 타입 명세
    이 명세에서 사용하는 필드:
        count: number
            packed 행 또는 segment 수
        dataWidth, dataHeight: number
            데이터 texture 크기
        dataArray: Float32Array
            데이터 texel 배열(RGBA)
        pointTexelCount?: number
            area 데이터 texture에서 header 뒤에 놓인 점 texel 수
        segmentMetaWidth, segmentMetaHeight: number
            path segment 메타 texture 크기
        segmentMetaArray?: Float32Array
            path segment 메타 texel 배열
        styleWidth, styleHeight: number
            style texture 크기
        styleArray: Float32Array
            style texel 배열
        boundsWidth, boundsHeight: number
            area 행 범위 texture 크기
        boundsArray?: Float32Array
            area 행 범위 배열(행당 4개)
        useBuckets?: number
            path가 bucket index texture를 사용하면 1, 아니면 0
        bucketIndexWidth, bucketIndexHeight: number
            path bucket index texture 크기
        bucketIndexArray?: Float32Array
            bucket 메타 texel과 segment 순번 4개씩 묶은 texel을 이어 담은 배열
        fullBounds: Array<number>
            packed 도형 전체의 tile-local 범위
        bucketMeta?: Array<Array<number>>
            area·circle의 bucket별 `[start, count, 0, 0]`
        bucketGrid: Array<number>
            가로·세로 bucket 수

WorkerLRUCache 클래스 정의

    limit: number
        최대 항목 수이며 1 이상으로 보정한다.
    byteLimit: number
        최대 추정 byte 크기이며 1 이상으로 보정한다.
    byteLength: number = 0
        현재 보관 항목의 추정 byte 합. set 에서 더하고 delete 에서 빼며, prune 의 반복 조건 `this.cache.size > this.limit || this.byteLength > this.byteLimit` 을 통제한다.
    cache: Map<string, object>
        삽입 순서가 최근 사용 순서인 항목 저장소
    byteLengths: Map<string, number>
        항목별 추정 byte 크기

    constructor(limit: number = 512, byteLimit: number = Number.POSITIVE_INFINITY)
        역할: 항목 수와 추정 byte 크기 한도를 가진 빈 cache를 만든다.

        동작:
            두 한도를 1 이상으로 보정하여 limit 과 byteLimit 에 저장한다.
            byteLength 를 0 으로 두고 빈 cache 와 byteLengths Map 을 만든다.

    get(key: string) -> object | undefined
        역할: 항목을 조회하고 최근 사용으로 옮긴다.

        동작:
            key 가 없으면 undefined 를 반환한다.
            값을 꺼내 삭제한 뒤 다시 넣어 삽입 순서를 최근으로 옮기고 값을 반환한다.

    peek(key: string) -> object | undefined
        역할: 최근 사용 순서를 바꾸지 않고 항목을 조회한다.

        동작:
            cache 에서 key 의 값을 그대로 반환한다.

    set(key: string, value: object, byteLength: number = 0, deferPrune: boolean = false) -> object
        역할: 항목을 저장하고 한도를 넘으면 오래된 항목을 정리한다.

        인터페이스:
            deferPrune: true 이면 현재 요청 해석이 끝날 때까지 한도 정리를 미룬다.
            반환: 전달받은 값

        처리 기준:
            추정 byte 크기가 byteLimit 보다 크면 항목을 저장하지 않고 값만 반환한다. 이때 기존 같은 key 항목은 이미 지워진 상태다.
            음수·비수치 byte 크기는 0 으로 본다.

        동작:
            같은 key 의 기존 항목을 지운다.
            byte 크기를 0 이상 숫자로 보정하고 byteLimit 초과이면 값을 반환한다.
            항목과 byte 크기를 저장하고 byteLength 에 더한다.
            deferPrune 이 true 가 아니면 한도 정리를 수행하고 값을 반환한다.

    prune() -> void
        역할: cache를 항목 수와 byte 한도 안으로 줄인다.

        동작:
            항목 수가 limit 을 넘거나 byteLength 가 byteLimit 을 넘는 동안 가장 오래된 key 를 지운다.
            더 지울 key 가 없으면 멈춘다.

    delete(key: string) -> boolean
        역할: 항목 하나를 제거하고 byte 합을 줄인다.

        동작:
            key 가 없으면 false 를 반환한다.
            그 항목의 추정 byte 크기를 byteLength 에서 빼고 byteLengths 와 cache 에서 지운 결과를 반환한다.

UTerrainDecalPrepareTask 클래스 정의

    static BasicBucketGrid: Array<number> = [16, 16]
        요청이 bucketGrid 를 주지 않을 때 쓰는 가로·세로 bucket 수. shader 의 bucket 메타 uniform 길이 256 과 맞아야 한다.
    static FeatureEntryCache: WorkerLRUCache = 항목 1024개·추정 32MB 한도의 cache
        tile origin 별로 정규화한 feature entry 를 재사용하는 cache
    static FeatureBaseCache: WorkerLRUCache = 항목 4096개·추정 64MB 한도의 cache
        main thread 가 등록한 불변 feature base 를 featureCacheKey 로 보관하는 cache
    static USE_PATH_BUCKET_THRESHOLD: number = 256
        path segment 수가 이 값을 넘을 때만 bucket index texture 를 만든다.

    static prepareTileBuffers(data: object = {}) -> object
        역할: tile 요청 하나를 feature 해석부터 packed buffer 결과까지 처리하는 대표 진입점이다.

        인터페이스:
            data.tileKey, data.revision, data.featureSignature: 결과에 그대로 되돌리는 요청 식별 값
            data.formatVersion: 3 이면 versioned Payload 경로, 그 밖이면 feature base 목록·참조 경로로 해석한다.
            data.bucketGrid: 배열이면 그대로 쓰고 아니면 BasicBucketGrid 를 쓴다.
            반환: `{tileKey, revision, featureSignature, featureCount, threshold, opacity, path, area, circle, _transferables, _performance}` 또는 복구 가능한 실패 `{tileKey, revision, featureSignature, recoverableErrorCode, missingFeatureCacheKey?}`

        처리 기준:
            versioned 경로에서 feature base cache miss 와 payload 상태 miss 는 모두 복구 가능한 결과로 돌리고, 좌표는 main thread 가 이미 tile-local 로 바꿨으므로 원점을 0 으로 둔다. threshold·opacity 는 유한 숫자일 때만 요청 값을 쓰고 아니면 1 이다.
            이전 형식 경로에서 feature base cache miss 는 data.allowFeatureBaseCacheMissRecovery 가 true 일 때만 복구 가능한 결과로 돌리고 아니면 예외를 그대로 전달한다. 원점은 data.tileOrigin 또는 0 이고 threshold·opacity 는 feature 목록에서 정한다.
            cache miss 코드가 아닌 예외는 두 경로 모두 그대로 전달한다.
            정규화할 수 없는 feature 는 건너뛰고, type 이 path·area·circle 이 아닌 entry 는 어느 목록에도 넣지 않는다.

        의존:
            performance — 처리 시간 측정; 함수: {now()}

        동작:
            시작 시각을 기록하고 요청 식별 값을 읽는다.
            versioned 경로이면 feature base 를 등록·해석하고 cache miss 이면 복구 결과를 반환한 뒤, payload 상태를 갱신하여 현재 feature 목록을 얻고 상태 miss 이면 복구 결과를 반환한다.
            이전 형식 경로이면 feature base 를 해석하고 허용된 cache miss 만 복구 결과로 바꾼 뒤 threshold 와 opacity 를 feature 목록에서 정한다.
            feature 마다 entry 를 정규화하여 path·area·circle 목록으로 나눈다.
            세 목록을 각각 packing 한다.
            세 결과의 typed array buffer 를 transferable 목록에 모은다.
            featureCount 를 세 count 의 합으로 두고 처리 시간을 _performance 에 붙여 결과를 반환한다.

    static resolveTerrainPayloadState(data: object) -> object
        역할: versioned delta를 tile 상태에 원자적으로 적용하고 현재 feature 목록을 돌려준다.

        인터페이스:
            data.header: Uint32Array. [0] 형식 번호, [1] full 여부(1), [2] 기준 featureSetRevision, [3] 기준 geometryRevision, [4] 결과 featureSetRevision, [5] 결과 geometryRevision
            data.featureKeys: key 문자열 테이블
            data.removed, data.added, data.updated: 각 변경 payload
            반환: `{features}`(featureIndex 오름차순) 또는 `{recoverableErrorCode}`

        처리 기준:
            header 가 Uint32Array 가 아니거나 길이가 9 미만이거나 형식 번호가 3 이 아니면 Error 로 실패한다.
            full 이 아닌데 이전 상태가 없거나 기준 revision 두 값이 어긋나면 상태 miss 결과를 돌린다.
            updated 대상 feature 가 현재 상태에 없으면 상태 miss 결과를 돌린다. 이때까지 적용한 removed·added 는 새 Map 에만 반영되어 cache 의 이전 상태는 바뀌지 않는다.
            성공하면 결과 상태를 tile key 로 cache 에 저장하며 추정 byte 크기를 함께 준다.

        동작:
            header 형식을 검증하고 tile key 와 full 여부를 읽은 뒤 이전 상태를 cache 에서 조회한다.
            delta 인데 기준이 맞지 않으면 상태 miss 결과를 반환한다.
            full 이면 빈 Map, delta 이면 이전 features 의 복사 Map 을 만들어 removed 제거, added 추가, updated 갱신을 차례로 적용한다.
            갱신 대상이 없어 실패하면 상태 miss 결과를 반환한다.
            결과 revision 과 features 로 상태를 만들어 cache 에 저장하고 featureIndex 순으로 정렬한 feature 배열을 반환한다.

    static removeTerrainPayloadFeatures(features: Map<string, object>, featureKeys: Array<string>, removed: object) -> void
        역할: removed key 목록을 tile 상태에서 제거한다.

        처리 기준:
            removed.keyIndexes 가 Uint32Array 가 아니거나 길이가 count 보다 짧으면 Error 로 실패한다. count 는 0 이상 숫자로 보정한다.
            key 테이블에 없는 index 는 건너뛴다.

        동작:
            count 개의 key index 를 key 문자열로 바꿔 features 에서 삭제한다.

    static addTerrainPayloadFeatures(features: Map<string, object>, featureKeys: Array<string>, added: object, geometryRevision: number) -> void
        역할: added feature의 전체 상태를 decode해 tile 상태에 추가한다.

        인터페이스:
            added.metadata: Uint32Array(feature 당 4), added.types: Uint16Array, added.flags: Uint16Array, added.propertyHashes: Uint32Array, added.coordinates: Float32Array(점당 2), added.geometryOptions: Float32Array(feature 당 6), added.properties: Float32Array(feature 당 13)

        처리 기준:
            배열 종류나 최소 길이가 하나라도 어긋나면 Error 로 실패한다.
            key 가 테이블에 없거나 좌표 범위가 coordinates 길이를 넘으면 Error 로 실패한다.
            featureCacheKey 는 `key:geometryRevision:propertyHash` 형식이며, radius 와 clipBounds 는 flag 비트가 켜졌을 때만 geometry option 에서 읽는다.

        동작:
            배열 형식을 검증한다.
            feature 마다 key·featureIndex·좌표 범위를 읽어 z 가 0 인 점 목록을 만들고 type 문자열과 property 를 복원한다.
            radius, clipBounds, pathSimplifyTolerance, isHole 을 붙인 feature 를 key 로 features 에 저장한다.

    static updateTerrainPayloadFeatures(features: Map<string, object>, featureKeys: Array<string>, updated: object, geometryRevision: number) -> boolean
        역할: property만 바뀐 feature를 기존 geometry에 적용한다.

        인터페이스:
            updated.metadata: Uint32Array(feature 당 2), updated.flags, updated.propertyHashes, updated.properties
            반환: 모든 대상 feature 가 현재 상태에 있으면 true

        처리 기준:
            배열 종류나 최소 길이가 어긋나면 Error 로 실패한다.
            대상 key 가 없으면 즉시 false 를 반환하고 이후 항목은 적용하지 않는다.

        동작:
            배열 형식을 검증한다.
            feature 마다 기존 feature 를 찾아 없으면 false 를 반환하고, 있으면 featureCacheKey·featureIndex 와 property 를 새 값으로 바꾼 복사본을 저장한다.
            모두 적용하면 true 를 반환한다.

    static decodeTerrainPayloadProperty(properties: Float32Array, offset: number, flags: number) -> object
        역할: 고정 stride property를 Worker feature property로 복원한다.

        인터페이스:
            반환: `{style: {strokeColor, strokeOpacity, strokeWidth, fillColor, fillOpacity, visible}, highlight, visible, renderOrder, revision, shaderLayerRenderOrder, compositionBatchIndex, isHole}`

        동작:
            offset 부터 13 개 성분을 순서대로 strokeColor 3, strokeOpacity, strokeWidth, fillColor 3, fillOpacity, renderOrder, revision, shaderLayerRenderOrder, compositionBatchIndex 로 읽는다.
            style.visible, highlight, visible, isHole 은 flags 의 해당 비트로 정한다.

    static resolveTerrainPayloadFeatureType(type: number) -> string
        역할: wire feature type을 Worker type 문자열로 복원한다.

        동작:
            2 이면 'area', 3 이면 'circle', 그 밖이면 'path' 를 반환한다.

    static estimateTerrainPayloadStateByteLength(features: Map<string, object>) -> number
        역할: tile 상태 cache 한도에 쓸 추정 byte 크기를 계산한다.

        동작:
            feature 마다 512 와 점 수 × 24 를 더한 합을 반환한다.

    static registerFeatureBases(data: object = {}) -> boolean
        역할: main thread가 보낸 변경 feature base만 Worker cache에 등록한다.

        인터페이스:
            data.featureBases: 등록할 feature base 배열
            data.deferCachePrune: true 이면 한도 정리를 호출자에게 미룬다.
            반환: 항상 true

        처리 기준:
            scopedFeatureKey 나 featureCacheKey 가 없는 항목은 건너뛴다.
            항목별 byteLength 는 숫자로 바꾸고 아니면 0 이다.

        동작:
            유효한 feature base 를 featureCacheKey 로 cache 에 정리 유예 상태로 저장한다.
            deferCachePrune 이 아니면 한도 정리를 수행하고 true 를 반환한다.

    static resolveFeatureBases(data: object = {}) -> Array<object>
        역할: tile 요청이 참조한 불변 feature base를 cache에서 복원한다.

        인터페이스:
            data.featureBases: 이번 요청에 함께 온 feature base 배열
            data.featureRefs: `{featureCacheKey, featureEntryCacheKey?, clipBounds?, pathSimplifyTolerance?}` 참조 배열
            반환: featureRefs 순서의 feature base 배열. featureRefs 가 없으면 featureBases 를 그대로 반환한다.

        처리 기준:
            함께 온 featureBases 는 먼저 요청 안 Map 에 담고 cache 에 정리 유예로 등록한다. 현재 요청이 참조할 base 가 등록 직후 축출되지 않게 하기 위한 것이다.
            참조가 cache 와 요청 Map 어디에도 없으면 code 가 TERRAIN_FEATURE_BASE_CACHE_MISS_CODE 이고 featureCacheKey 를 가진 Error 로 실패한다.
            featureEntryCacheKey 가 있는 참조는 base 를 복사하여 featureCacheKey 를 그 값으로 바꾸고 clipBounds 와 pathSimplifyTolerance 를 덧붙인다. tile 별 clip 이 다른 같은 feature 를 구분하기 위한 것이다.
            해석이 실패해도 마지막에 cache 한도 정리를 수행하여 main thread 가 계산한 등록 이력과 같은 시점에 한도를 적용한다.

        동작:
            함께 온 feature base 가 있으면 요청 Map 을 만들고 정리 유예로 등록한다.
            참조가 없으면 한도 정리 뒤 featureBases 를 반환한다.
            참조마다 cache 를 순서를 바꾸지 않고 조회하고 없으면 요청 Map 에서 찾아 없으면 cache miss 예외를 던진다.
            entry cache key 가 있는 참조는 clip 정보를 덧붙인 복사본을, 아니면 base 를 그대로 결과에 넣는다.
            성공·실패와 무관하게 한도 정리를 수행하고 결과를 반환한다.

    static normalizeFeature(feature: TerrainFeature, tileOrigin: object) -> object | undefined
        역할: feature를 tile-local 좌표와 shader style을 가진 entry로 정규화하고 cache에 보관한다.

        인터페이스:
            반환: `{featureId, type, points | center·radius, style, visible, renderOrder, revision, shaderLayerRenderOrder, compositionBatchIndex, bounds, clipBounds?, pathSimplifyTolerance?}` 또는 사용할 수 없으면 undefined

        처리 기준:
            featureId 가 없으면 undefined 다.
            cache 에 같은 key 의 entry 가 있으면 합성 순서 값만 최신으로 바꿔 그 entry 를 반환한다. geometry 와 style 이 같아도 shader layer 순서와 batch 순번은 바뀔 수 있기 때문이다.
            visible 은 feature.visible 과 style.visible 이 모두 false 가 아닐 때 true 다.
            circle 은 점이 2 개 미만이거나 반지름이 0 이하이면 undefined 이고, bounds 는 중심 ± (반지름 + 외곽선 두께) 다.
            area 는 clip 뒤 점이 3 개 미만이면 undefined 이고, hole 이면 fillOpacity 를 -1 로 바꾼다. bounds 는 점 범위를 외곽선 두께만큼 넓힌 것이다.
            path 는 점이 2 개 미만이면 undefined 이고, pathSimplifyTolerance 는 0 이상으로 보정한다.
            shaderLayerRenderOrder 가 없으면 3.0e38, compositionBatchIndex·renderOrder·revision 이 없으면 0 이다.

        동작:
            cache key 를 만들어 entry cache 를 조회하고 있으면 합성 순서를 갱신하여 반환한다.
            점 목록과 clip 범위를 tile-local 로 바꾸고 style 을 정규화한다.
            circle 이면 중심·반지름·bounds 를 가진 entry 를 만든다.
            area 이면 clip 한 점 목록과 bounds·clipBounds 를 가진 entry 를 만든다.
            그 밖이면 path entry 를 만든다.
            만든 entry 를 추정 byte 크기와 함께 cache 에 저장하고 반환한다.

    static toLocalPoints(vectors: Array<object> = [], origin: object = {x: 0, y: 0}) -> Array<object>
        역할: world 점 목록을 tile-local 2차원 점 목록으로 바꾼다.

        처리 기준:
            비어 있는 점은 건너뛰고, 객체 x·y 또는 배열 [0]·[1] 을 읽으며 숫자가 아니면 0 이다.

        동작:
            점마다 origin 을 뺀 x, y 를 가진 객체를 만들어 배열로 반환한다.

    static toLocalBounds(bounds: Array<number> | undefined, origin: object = {x: 0, y: 0}) -> Array<number> | undefined
        역할: world 범위를 tile-local 범위로 바꾼다.

        동작:
            배열이 아니거나 길이가 4 미만이면 undefined 를 반환한다.
            네 성분을 숫자로 바꾸고 x 성분에서 origin.x, y 성분에서 origin.y 를 뺀 배열을 반환한다.

    static clipAreaPoints(points: Array<object>, bounds: Array<number> | undefined) -> Array<object>
        역할: polygon을 사각형 범위로 잘라 tile 밖 edge가 shader 반복에 포함되지 않게 한다.

        처리 기준:
            점이 3 개 미만이면 빈 배열, bounds 가 없거나 4 성분 미만이면 원본을 반환한다.
            네 경계(x 최소, x 최대, y 최소, y 최대)를 차례로 적용하는 Sutherland–Hodgman 방식이며, 경계마다 결과가 비면 멈춘다.
            연속 중복 점과 첫 점·마지막 점의 중복은 제거한다.

        동작:
            경계마다 이전 점과 현재 점의 안팎이 바뀌면 교점을 넣고, 현재 점이 안이면 현재 점을 넣는다.
            경계 처리 뒤 마지막 점이 첫 점과 같으면 제거한다.
            최종 점 목록을 반환한다.

    static doesAreaCoverClipBounds(points: Array<object>, bounds: Array<number> | undefined) -> boolean
        역할: clip 결과가 제한 사각형 전체를 덮는지 판정한다.

        처리 기준:
            점이 정확히 4 개이고 bounds 가 유효하며 너비·높이가 0 보다 클 때만 판정한다.
            좌표 크기에 비례한 허용 오차 안에서 네 꼭짓점이 모두 점 목록에 있고, 부호 있는 넓이의 두 배가 사각형 넓이의 두 배와 허용 오차 안에서 같아야 true 다.

        동작:
            입력 형식과 사각형 크기를 확인하고 어긋나면 false 를 반환한다.
            네 꼭짓점 존재 여부를 확인하고 하나라도 없으면 false 를 반환한다.
            shoelace 합으로 넓이를 구해 사각형 넓이와 비교한 결과를 반환한다.

    static normalizeStyle(style: object = {}, highlighted: boolean = false) -> object
        역할: 입력 style을 shader가 읽는 고정 형식으로 정규화한다.

        인터페이스:
            반환: `{strokeColor, strokeOpacity, strokeWidth, fillColor, fillOpacity, visible}`

        처리 기준:
            strokeColor 는 style.strokeColor 를 우선하고 없으면 style.color 로 대체하며 둘 다 없으면 0x3399cc 다. fillColor 는 style.fillColor 를 우선하고 없으면 0xffffff 다.
            strokeWidth 는 style.strokeWidth 를 우선하고 없으면 1.0 이며, 최소 0.0001 로 보정하고 강조 시 1.35 배다.
            strokeOpacity 는 style.strokeOpacity 를 우선하고 없으면 style.opacity 로 대체하며 둘 다 없으면 1.0 이다. 0~1 로 자르고 강조 시 1.15 배 뒤 1 이하로 자른다.
            fillOpacity 는 style.fillOpacity 를 우선하고 없으면 style.opacity 로 대체하며 둘 다 없으면 1.0 이다. 음수이면 -1 (hole 표시), 아니면 0~1 로 자른다.

        동작:
            색을 배열로 바꾸고 두께·불투명도를 위 기준으로 계산한다.
            visible 은 style.visible 이 false 가 아닐 때 true 로 두어 반환한다.

    static getFeatureEntryCacheKey(feature: TerrainFeature, tileOrigin: object = {x: 0, y: 0, z: 0}) -> string
        역할: 정규화 entry cache key를 만든다.

        처리 기준:
            첫 구성 요소는 feature.featureCacheKey 를 우선하고 없으면 feature.featureId 로 대체한다. revision 과 tile origin 의 x·y·z 는 숫자로 바꾸고 없으면 0 이다.

        동작:
            첫 구성 요소, revision, tile origin 의 x·y·z 를 `|` 로 이어 반환한다.

    static refreshFeatureEntryCompositionState(entry: object, feature: TerrainFeature) -> object
        역할: cache된 entry에 최신 합성 순서 값을 반영한다.

        동작:
            entry 의 shaderLayerRenderOrder(기본 3.0e38)와 compositionBatchIndex(기본 0)를 feature 값으로 바꾸고 같은 entry 를 반환한다.

    static estimateFeatureEntryByteLength(entry: object) -> number
        역할: entry cache 한도에 쓸 추정 byte 크기를 계산한다.

        동작:
            점 수(points 가 없으면 1) × 16 + 512 를 반환한다.

    static packPolylineEntries(entries: Array<object>, bucketGrid: Array<number>) -> TerrainBucketState
        역할: path entry 목록을 segment 기반 packed 상태로 만든다.

        처리 기준:
            polyline 행 기반의 이전 packing 은 주석으로만 남아 있으며 실행되지 않는다.

        동작:
            segment 선형 packing 결과를 그대로 반환한다.

    static packAreaEntries(entries: Array<object>, bucketGrid: Array<number>) -> TerrainBucketState
        역할: area entry를 shader가 읽는 선형 레이아웃 texture와 bucket 정보로 packing한다.

        처리 기준:
            entry 가 없으면 bounds texture 를 포함한 빈 상태를 반환한다.
            행은 bucket 정렬 순서이며 같은 entry 가 여러 bucket 에 걸치면 header 행이 반복된다.
            header 는 vec4(pointCount, shaderLayerRenderOrder, compositionBatchIndex, pointStart) 이고 pointStart 는 header 수 뒤에 entry 별로 처음 등장한 순서대로 배정한다.
            style 은 행당 3 texel: fill(rgb, fillOpacity), stroke(rgb, strokeOpacity), option(strokeWidth, visible, renderOrder, coverAll). coverAll 은 polygon 이 clip 사각형 전체를 덮으면 1 이며 shader 의 전체 덮음 fast-path 표시다.
            bounds 는 행당 4 성분이다.
            style texture 는 `rowCount * 3` texel, bounds texture 는 `rowCount` texel 을 `createLinearTextureLayout()` 의 선형 2차원 배치로 두고 배열은 각 capacity 의 4배 길이로 0 패딩한다(2026-09-22). 즉시 경로 `createTerrainImmediateAreaState()` 와 같은 계약이며, 행 오프셋(`row * 12`, `row * 4`)은 바뀌지 않는다. 이전의 "폭 3 × 행 수" 배치는 폴리곤 수가 GPU `maxTextureSize` 를 넘는 타일에서 업로드가 실패했다.

        동작:
            entry 가 없으면 bounds texture 를 포함한 빈 상태를 반환한다.
            entry 를 bucket 순서로 정렬한다.
            entry 별 pointStart 를 배정하며 점 texel 총수를 구하고 header 수와 합쳐 데이터 texture 크기를 정한다.
            행마다 header 를 쓰고, 처음 만나는 entry 의 점 목록을 pointStart 위치부터 vec4(x, y, 0, 0) 으로 한 번 쓴다.
            행마다 style 3 texel 과 bounds 를 쓴다.
            count, 데이터 texture 크기, pointTexelCount, style·bounds 크기와 배열, fullBounds, bucketMeta, bucketGrid 를 담은 상태를 반환한다.

    static createLinearTextureLayout(texelCount: number) -> object
        역할: 선형 texel 목록을 한 변이 짧은 2차원 texture 크기로 배치한다.

        인터페이스:
            반환: `{width, height, capacity}`

        처리 기준:
            texelCount 는 올림한 정수이며 1 미만이나 없는 값은 1 로 본다.
            width 는 ceil(sqrt(count)), height 는 ceil(count / width) 이며 둘 다 1 이상이다. capacity 는 width × height 로 count 이상이다.

        동작:
            count 를 보정하고 width·height·capacity 를 계산하여 반환한다.

    static packPolylineSegments(entries: Array<object>, bucketGrid: Array<number>) -> TerrainBucketState
        역할: path를 선형 segment 목록으로 평탄화하여 데이터·메타·style·bucket texture로 packing한다.

        처리 기준:
            entry 가 없거나 평탄화 결과 segment 가 없으면 bounds texture 와 bucket 메타 배열이 없는 빈 상태를 반환한다.
            데이터 texel 은 vec4(x1, y1, x2, y2), 메타 texel 은 vec4(styleIndex, strokeWidth, visible, shaderLayerRenderOrder) 이며 두 texture 의 크기는 같다.
            style 은 path 당 2 texel: vec4(strokeColor rgb, strokeOpacity), vec4(compositionBatchIndex, 0, 0, 0) 이며 style 이 하나도 없어도 texel 2 개짜리 배열을 만든다.
            segment 수가 256 을 넘을 때만 bucket 을 만들고 useBuckets 를 1 로 둔다. 아니면 bucket index texture 는 자리표시자 texel 하나 `[-1, -1, -1, -1]` 이다.
            bucket 을 쓰면 bucket index 배열 앞부분에 bucket 메타 texel(bucket 수만큼 `[startTexel, texelCount, 0, 0]`)을 두고 그 뒤에 segment 순번 4 개씩 묶은 texel 을 이어 붙인다.

        동작:
            entry 가 없으면 빈 상태를 반환하고, 평탄화 뒤 segment 가 없으면 같은 빈 상태를 반환한다.
            entry 를 segment 와 style 목록으로 평탄화한다.
            segment 수로 데이터·메타 texture 크기를, style 수 × 2 로 style texture 크기를 정한다.
            style 마다 색·불투명도·batch 순번을 쓰고, segment 마다 좌표와 메타(style 순번, 그 style 의 두께, 가시성, shader layer 순서)를 쓴다.
            segment 수가 상한을 넘으면 bucket 정렬로 메타와 순번 배열을 만들고, 아니면 자리표시자를 쓴다.
            bucket 메타와 순번 배열을 하나의 선형 texture 배열로 합치고 그 크기를 정한다.
            count, 데이터·메타·style·bucket index texture 크기와 배열, useBuckets, fullBounds, bucketGrid 를 담은 상태를 반환한다.

    static simplifyPathPoints(points: Array<object>, tolerance: number) -> Array<object>
        역할: 허용 거리 안의 중간점을 제거한다.

        처리 기준:
            tolerance 가 0 이하이거나 점이 2 개 이하이면 원본을 반환한다.
            첫 점과 마지막 점은 항상 남기고, 직전에 남긴 점과의 거리 제곱이 허용 거리 제곱 미만인 중간점을 버린다.

        동작:
            첫 점을 남기고 중간점을 순회하며 기준을 넘는 점만 추가한 뒤 마지막 점을 붙여 반환한다.

    static clipPathSegment(start: object, end: object, bounds: Array<number> | undefined) -> Array<number> | undefined
        역할: 선분을 사각형 경계 안으로 제한한다.

        처리 기준:
            bounds 가 없거나 4 성분 미만이면 좌표를 숫자로 바꾼 `[x1, y1, x2, y2]` 를 그대로 반환한다.
            Liang–Barsky 방식으로 네 경계의 진입·이탈 비율을 구하고, 어느 경계에서든 선분이 완전히 밖이면 undefined 다.

        동작:
            네 경계에 대한 p·q 값을 계산하고 비율 범위를 좁힌다.
            범위가 뒤집히거나 평행 경계 밖이면 undefined 를 반환한다.
            좁힌 비율로 잘린 양 끝점 좌표를 반환한다.

    static flattenPathSegments(entries: Array<object> = []) -> object
        역할: polyline 목록을 clip·단순화한 segment 목록과 path style 목록으로 평탄화한다.

        인터페이스:
            반환: `{items: segment 배열, styles: style 배열, fullBounds}`. segment 는 `{featureId, type: 'path', x1, y1, x2, y2, bounds, pathStyleIndex}` 다.

        처리 기준:
            entry 마다 pathSimplifyTolerance 로 점을 단순화하고, 점이 2 개 미만이면 entry 를 건너뛴다.
            segment bounds 는 외곽선 두께만큼 넓히며, clip 으로 사라졌거나 길이가 0 인 segment 는 넣지 않는다.
            style 은 entry 마다 하나씩 만들며 segment 는 그 순번을 참조한다.
            segment 가 하나도 없으면 items·styles 가 비고 fullBounds 는 `[0, 0, 1, 1]` 이다.

        동작:
            entry 마다 점을 단순화하고 style 항목을 추가한다.
            인접 점 쌍마다 clip 하여 유효한 segment 와 두께를 포함한 bounds 를 만들고 전체 범위를 넓힌다.
            전체 범위가 유한하지 않으면 빈 결과를, 아니면 segment·style·fullBounds 를 반환한다.

    static sortPathBySegmentBuckets(segments: Array<object>, fullBounds: Array<number>, bucketGrid: Array<number>) -> object
        역할: segment를 bucket별 순번 목록으로 정렬하고 bucket 메타를 만든다.

        인터페이스:
            반환: `{bucketMeta: [startTexel, texelCount, 0, 0] 배열, bucketIndexHeight, bucketIndexArray}`

        처리 기준:
            bucket 수는 grid 가로 × 세로(각 1 이상, 기본 8)다.
            bucket 별 순번 목록은 4 개씩 texel 로 묶으며 남는 자리는 -1 (무효 순번) 로 채운다.
            순번이 하나도 없으면 `[-1, -1, -1, -1]` texel 하나를 둔다.
            중복 검사는 Set 대신 bucket 배열과 Int32Array 표시로 수행하여 비용을 줄인다.

        동작:
            빈 bucket 배열과 -1 로 채운 표시 배열을 만든다.
            segment 마다 닿는 bucket 에 순번을 등록한다.
            bucket 순서로 메타와 4 개 단위로 정렬·패딩한 순번 배열을 만들어 반환한다.

    static addPathSegmentToBuckets(segment: object, segmentIndex: number, fullBounds: Array<number>, gridX: number, gridY: number, buckets: Array<Array<number>>, checkedMark: Int32Array) -> void
        역할: 선분 중심이 통과하는 grid cell과 외곽선이 닿을 수 있는 주변 cell에만 후보를 등록한다.

        처리 기준:
            cell 크기는 fullBounds 를 grid 로 나눈 값이며 너비·높이는 1e-6 이상으로 보정한다.
            시작·끝 cell 은 grid 범위 안으로 자르고, 외곽선 padding 은 segment bounds 와 선분 길이의 차이의 절반으로 계산하여 cell 수로 바꾼다.
            DDA 방식으로 x·y 경계 도달 비율을 비교하며 cell 을 전진하고, 두 비율이 허용 오차 안에서 같으면(선분이 모서리를 정확히 통과) 맞닿은 두 cell 도 후보에 넣는다.
            방문 횟수는 bucket 수 + 1 을 넘지 않는다.

        동작:
            cell 크기·시작·끝 cell·padding cell 수·첫 경계 비율을 계산한다.
            현재 cell 과 padding 범위를 등록하고 끝 cell 이면 멈춘다.
            더 이른 경계 방향으로 cell 을 전진하며, 모서리 통과이면 두 이웃 cell 을 함께 등록한 뒤 대각선으로 전진한다.

    static addPathBucketCell(cellX: number, cellY: number, paddingCellsX: number, paddingCellsY: number, segmentIndex: number, gridX: number, gridY: number, buckets: Array<Array<number>>, checkedMark: Int32Array, segment: object, padding: number, dx: number, dy: number, lengthSq: number, gridMinX: number, gridMinY: number, cellWidth: number, cellHeight: number) -> void
        역할: 중심 cell과 padding 범위의 cell에 선분 후보를 중복 없이 기록한다.

        처리 기준:
            중심 cell 이 grid 밖이면 아무것도 하지 않는다.
            같은 segment 가 같은 bucket 을 이미 검사했으면(표시 배열 값이 segment 순번) 건너뛴다. 실패한 교차 검사도 표시하여 인접 중심 cell 에서 같은 capsule 검사를 반복하지 않는다.
            capsule 과 cell 이 실제로 교차할 때만 후보에 넣는다.

        동작:
            padding 범위를 grid 안으로 자른다.
            범위의 bucket 마다 표시를 확인·갱신하고 capsule 교차 판정이 참이면 segment 순번을 넣는다.

    static doesPathCapsuleIntersectCell(segment: object, padding: number, dx: number, dy: number, lengthSq: number, minX: number, minY: number, maxX: number, maxY: number) -> boolean
        역할: 선분과 외곽선 반경으로 만든 capsule이 bucket 사각형에 닿는지 판정한다.

        처리 기준:
            양 끝점 중 하나가 사각형 안이거나 선분이 사각형을 통과하면 true 다.
            반경이 0 이하이면 그 밖은 false 다.
            끝점과 사각형의 거리 또는 사각형 네 꼭짓점과 선분의 거리 중 하나가 반경 이하이면 true 다.

        동작:
            끝점 포함과 선분 통과를 확인한다.
            반경이 있으면 끝점–사각형 거리와 꼭짓점–선분 거리를 반경 제곱과 비교한 결과를 반환한다.

    static doesPathSegmentIntersectBounds(x1: number, y1: number, dx: number, dy: number, minX: number, minY: number, maxX: number, maxY: number) -> boolean
        역할: 선분이 사각형 내부를 통과하는지 중간 객체 없이 판정한다.

        처리 기준:
            x 방향 길이가 0 이면 x1 이 범위 안이어야 하고, y 방향 길이가 0 이면 y1 이 범위 안이면 true 다.
            slab 방식으로 x·y 진입·이탈 비율 범위를 좁혀 비어 있지 않으면 true 다.

        동작:
            x 경계로 비율 범위를 좁히고 뒤집히면 false 를 반환한다.
            y 경계로 같은 처리를 하고 범위가 남아 있는지 반환한다.

    static pointToCellDistanceSq(x: number, y: number, minX: number, minY: number, maxX: number, maxY: number) -> number
        역할: 점과 사각형 사이의 최소 거리 제곱을 계산한다.

        동작:
            각 축에서 범위 밖 거리를 구해 제곱 합을 반환한다. 범위 안이면 0 이다.

    static pointToSegmentDistanceSq(x: number, y: number, x1: number, y1: number, dx: number, dy: number, lengthSq: number) -> number
        역할: 점과 선분 사이의 최소 거리 제곱을 계산한다.

        동작:
            선분 길이 제곱이 0 보다 크면 투영 비율을 0~1 로 자르고, 아니면 0 으로 두어 가장 가까운 점을 구한다.
            그 점과의 거리 제곱을 반환한다.

    static packCircleEntries(entries: Array<object>, bucketGrid: Array<number>) -> TerrainBucketState
        역할: circle entry를 논리 순서를 유지하는 선형 2차원 texture 상태로 packing한다.

        처리 기준:
            entry 가 없으면 bounds texture 없는 빈 상태를 반환한다.
            데이터 texel 은 vec4(centerX, centerY, radius, shaderLayerRenderOrder), style 은 행당 3 texel: fill(rgb, fillOpacity), stroke(rgb, strokeOpacity), option(strokeWidth, visible, renderOrder, compositionBatchIndex) 이다.

        동작:
            entry 가 없으면 bounds texture 없는 빈 상태를 반환한다.
            entry 를 bucket 순서로 정렬한다.
            행 수와 행 수 × 3 으로 데이터·style texture 크기를 정한다.
            행마다 데이터와 style 을 쓰고 count·크기·배열·fullBounds·bucketMeta·bucketGrid 를 담아 반환한다.

    static sortPathBySegmentBucketsLegacy(entries: Array<object>, bucketGrid: Array<number>) -> object
        역할: polyline 행 기반의 이전 bucket 정렬이며 현재 호출자가 없다.

        처리 기준:
            entry 의 인접 점 쌍 bounds(두께 padding 포함)로 bucket 범위를 구해 path 순번을 Set 에 넣고, bucket 순서로 이어 붙인다.

        동작:
            전체 범위를 구하고 bucket 별 Set 에 path 순번을 등록한다.
            bucket 메타와 순번 배열을 만들어 원본 entry 목록과 함께 반환한다.

    static sortByBuckets(entries: Array<object>, bucketGrid: Array<number>) -> object
        역할: entry를 bounds가 겹치는 bucket 순서로 정렬하고 bucket별 행 범위를 만든다.

        인터페이스:
            반환: `{items, bucketMeta: [start, count, 0, 0] 배열, fullBounds}`

        처리 기준:
            entry 는 bounds 가 걸치는 모든 bucket 목록에 들어가므로 여러 bucket 에 걸친 entry 는 items 에 반복된다.
            모든 bucket 의 후보 목록이 같으면 하나의 행 범위를 공유하여 모든 bucketMeta 가 `[0, 길이, 0, 0]` 이 되고 items 는 그 목록 한 벌이다.

        동작:
            전체 범위를 구하고 entry 마다 bucket 범위의 모든 bucket 목록에 넣는다.
            모든 bucket 목록이 첫 bucket 과 같으면 공유 범위 결과를 반환한다.
            아니면 bucket 순서로 items 를 이어 붙이고 시작·개수 메타를 만들어 반환한다.

    static computeBounds(points: Array<object>, padding: number = 0) -> Array<number>
        역할: 점 목록의 범위를 padding만큼 넓혀 계산한다.

        동작:
            점의 최소·최대 x·y 를 구하고 padding 을 빼거나 더한 `[minX, minY, maxX, maxY]` 를 반환한다.

    static computeFullBounds(entries: Array<object>) -> Array<number>
        역할: entry bounds 전체를 감싸는 범위를 계산한다.

        동작:
            entry bounds 의 최소·최대를 모아 `[minX, minY, maxX, maxY]` 를 반환한다.

    static getBucketRange(bounds: Array<number>, fullBounds: Array<number>, bucketGrid: Array<number>) -> object
        역할: bounds가 걸치는 bucket index 범위를 계산한다.

        인터페이스:
            반환: `{minX, minY, maxX, maxY}` bucket index

        처리 기준:
            fullBounds 의 너비·높이는 1e-6 이상으로 보정하고, 정규화 좌표는 0 이상 0.999999 이하로 잘라 마지막 bucket 을 넘지 않게 한다.

        동작:
            bounds 네 성분을 정규화하고 grid 수를 곱해 내림한 뒤 grid 범위 안으로 자른 index 를 반환한다.

    static createEmptyBucketState(includeBoundsTexture: boolean, includeBucketMeta: boolean = true) -> TerrainBucketState
        역할: 도형 종류별 빈 texture 상태를 만든다.

        처리 기준:
            데이터·메타·style texture 는 1×1 texel 하나, bucket index texture 는 `[-1, -1, -1, -1]` 하나, fullBounds 는 `[0, 0, 1, 1]`, bucketGrid 는 BasicBucketGrid 다.
            includeBucketMeta 이면 bucket 수만큼 `[0, 0, 0, 0]` 메타를, includeBoundsTexture 이면 1×1 bounds texture 를 포함한다.

        동작:
            count 가 0 인 기본 상태를 만들고 옵션에 따라 bucketMeta 와 bounds texture 를 붙여 반환한다.

    static collectTransferables(state: TerrainBucketState, transferables: Array<ArrayBuffer>) -> void
        역할: 상태의 typed array buffer를 transferable 목록에 모은다.

        동작:
            dataArray, segmentMetaArray, styleArray, boundsArray, bucketIndexArray 중 ArrayBuffer 를 가진 것의 buffer 를 목록에 넣는다.

    static toColorArray(value: unknown) -> Array<number>
        역할: 여러 형식의 색 입력을 rgb 배열로 바꾼다.

        처리 기준:
            배열이면 앞 세 성분(없으면 1), r 속성이 유한한 객체면 r·g·b, 그 밖이면 16진수 정수(없으면 0xffffff) 를 0~1 로 나눈 값이다.

        동작:
            입력 종류에 따라 세 성분 배열을 만들어 반환한다.

    static clamp01(value: unknown) -> number
        역할: 값을 0~1로 자른다.

        동작:
            숫자로 바꾼 값(없으면 1)을 0 이상 1 이하로 잘라 반환한다.

    static resolveThreshold(features: Array<object>) -> number
        역할: 이전 형식 payload에서 tile threshold를 정한다.

        동작:
            threshold 가 유한한 첫 feature 의 값을 반환하고 없으면 1 을 반환한다.

    static resolveOpacity(features: Array<object>) -> number
        역할: 이전 형식 payload에서 tile opacity를 정한다.

        동작:
            opacity 가 유한한 첫 feature 의 값을 반환하고 없으면 1 을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
세 cache(entry·feature base·tile 상태)는 Worker마다 독립적이며 main thread 상태와 동기화하지 않는다.
area 선형 레이아웃과 path segment·circle 레이아웃은 main-thread 즉시 경로, GDecalTerrainShader의 texel 조회, UTerrainDecalCompositeComposer의 batch 범위 조회와 같은 계약을 공유하며 한쪽만 바꾸지 않는다.
복구 가능한 실패(feature base cache miss, payload 상태 miss)는 예외 대신 recoverableErrorCode를 가진 결과로 돌리고, 그 밖의 형식 오류는 Error로 전달한다.
결과의 typed array는 transferable로 넘기므로 반환 뒤 Worker 쪽에서 다시 읽지 않는다.
shaderLayerRenderOrder가 없는 feature는 3.0e38로 두어 어떤 render order 창에도 들지 않게 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
