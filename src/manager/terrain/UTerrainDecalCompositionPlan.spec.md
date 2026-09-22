# UTerrainDecalCompositionPlan 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

한 terrain tile과 host 구간에 그릴 Feature 목록을 받아 Layer group과 Feature의 총순서를 확정하고, 그 순서를 기존 direct 합성으로 그대로 재현할 수 있는지 판정한 불변 계획을 만든다. 계획은 순수 계산이며 GPU 자원이나 tile 상태를 만들지 않는다.

### 1.2 책임 범위

Feature 식별자 정규화, 같은 식별자의 합성 metadata 일관성 검증, Layer group과 Feature의 총순서 확정, 같은 group과 raster 유형의 최대 연속 batch 구간 계산, 기존 direct 합성과의 순서 동등성 판정, canonical 순서 서명 생성을 이 단위가 소유한다. 실제 raster 실행, RenderTarget, packed buffer, tile 상태와 표시 시점은 소유하지 않는다. 어떤 Feature를 계획에 넣을지도 호출부가 결정한다.

### 1.3 주요 동작 방식

입력을 한 번 순회하며 group과 atomic Feature를 모으고, 같은 `compositionFeatureKey`의 여러 part는 하나의 Feature로 합치면서 tile-local 범위도 합친다. group은 `compositionRenderOrder`와 `compositionGroupOrder`로, group 안의 Feature는 `featureCompositionOrdinal`과 `renderOrder`로, Feature 안의 part는 hole 여부와 `featureId`로 정렬한다. 확정된 stream에서 raster 유형 순서가 `path`, `area`, `circle`를 지키는지, 앞선 area를 지울 수 있는 polygon hole이 있는지 보고, 어긋나는 쌍이 tile-local 범위에서 실제로 겹칠 때만 direct 합성을 포기한다. 모든 Feature가 `static`이나 `dynamic`으로 분류된 입력은 두 집합의 범위가 합성 번짐 여유를 포함해도 겹치지 않고 dynamic 부분집합만으로 direct 계약을 지킬 때 `hybrid`로 계획하고, 증명할 수 없는 조합은 전체를 `precomposed`로 되돌린다. 결과는 중첩 구조까지 얼려 반환한다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalTileStateManager`의 `buildTerrainTileCompositionInputs`가 tile별 Feature를 정규화해 이 함수를 호출하고, 반환한 계획으로 batch 순번 표와 tile 상태의 `compositionMode`·`modeReason`·`orderSignature`를 채운다. `UShaderTerrainDecalManager`는 `compositionMode`가 `precomposed`인 계획만 합성 예약으로 보내고, `UTerrainDecalCompositeComposer`는 `precomposed`가 아닌 계획을 입력으로 받으면 거절한다. `isExactTerrainCompositionBatchIndex`는 batch 순번을 packed 채널로 보내는 경로에서 왕복 정확성을 확인한다. `buildTerrainCompositionTargetKey`는 합성 대상 목록의 식별자를 만드는 공개 함수이며, 소비자가 tile 상태 모듈을 가져오지 않고도 같은 규약으로 조회 key 를 만들 수 있게 한다.

## 2. 요구사항과 품질 기준

```spec
같은 입력 집합은 배열 도착 순서와 무관하게 같은 총순서와 같은 순서 서명을 만들어야 한다.
stable Feature 식별자가 없는 입력은 배열 index 를 식별자로 대체하지 않고 거절해야 한다.
같은 compositionFeatureKey 의 합성 metadata 가 서로 다르면 조용히 하나를 채택하지 않고 거절해야 한다.
같은 compositionRenderOrder 안에서 compositionGroupOrder 가 겹치거나 같은 group 안에서 renderOrder 와 featureCompositionOrdinal 이 모두 겹치면 거절해야 한다.
polygon outer 와 hole 은 하나의 atomic Feature 로 계획해야 하며 서로 다른 batch 로 나뉘지 않아야 한다.
direct 합성 동등성은 raster 유형 순서와 hole erase 위험이 tile-local 범위에서 실제로 겹칠 때만 부정해야 한다.
tile-local 범위를 알 수 없으면 겹친다고 보수적으로 판정해야 한다.
반환한 계획과 그 안의 group·Feature·part·batch 는 모두 얼려 반환해야 하며 입력 배열과 입력 객체는 바꾸지 않아야 한다.
batch 순번으로 쓸 Feature 수가 packed Float32 채널로 왕복할 수 있는 범위를 넘으면 거절해야 한다.
안정성이 하나도 분류되지 않은 입력은 안정성 도입 전과 같은 mode, 같은 direct 동등성, 같은 선택 이유, 같은 batch 와 같은 순서 서명을 만들어야 한다.
안정성이 일부만 분류된 입력은 안전한 분리를 증명할 수 없으므로 전체를 precompose 해야 한다.
같은 atomic Feature 의 part 사이 안정성이 다르면 outer 와 hole 을 분리하지 않고 거절해야 한다.
static 과 dynamic 을 함께 실행하는 계획은 두 집합의 모든 범위가 겹치지 않고 dynamic 부분집합이 direct 계약을 지킬 때만 선택해야 한다.
static 과 dynamic 의 비교차 판정은 합성 결과가 자기 범위 밖으로 번지는 폭을 포함해야 한다. 그 폭을 계산할 수 없으면 수치상 비교차여도 전체를 precompose 해야 한다.
번짐 여유는 두 집합 사이 판정에만 써야 하며 전체 stream 의 direct 동등성이나 dynamic 부분집합 내부 판정을 바꾸어서는 안 된다.
두 합성 대상 목록은 전체 stream 순서를 그대로 투영해야 하며 같은 Feature 가 두 목록에 함께 있거나 어느 목록에도 없어서는 안 된다.
합성 대상 식별자는 group 과 Feature key 를 함께 보존해야 한다. 서로 다른 group 의 같은 Feature key 는 대상 목록에서도 구분돼야 하며 구분자 문자가 든 식별자도 충돌해서는 안 된다.
precomposed 대상이 하나도 없는 batch 는 합성 실행 목록에 넣지 않아야 한다. 합성기가 빈 draw 를 발행하지 않게 하기 위해서다.
static 서명은 dynamic 집합의 변화 때문에, dynamic 서명은 static 집합의 변화 때문에 바뀌지 않아야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
교차 판정의 bounds 비교 횟수가 TERRAIN_COMPOSITION_INTERSECTION_CHECK_LIMIT 를 넘으면 더 비교하지 않고 겹친다고 판정해 최악 입력에서도 비용을 제한한다.
계획 생성은 GPU 자원과 tile 상태를 만들지 않는 순수 계산이어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
TERRAIN_COMPOSITION_INTERSECTION_CHECK_LIMIT: number = 4096
    교차 판정에서 허용하는 bounds 비교 횟수 상한. 넘으면 더 비교하지 않고 겹친다고 판정한다.

TERRAIN_COMPOSITION_MAX_BATCH_INDEX: number = 0xFFFFFF
    packed Float32 채널로 오차 없이 왕복할 수 있는 최대 batch 순번. 2^24 부터는 인접 정수가 같은 값으로 반올림되어 batch 구분이 깨진다.

TERRAIN_COMPOSITION_DIRECT_BATCH_INDEX: number = -1
    hybrid 계획에서 direct 대상 Feature 를 표시하는 batch 순번. 합성기는 0 이상인 순번만 실행하므로 이 값을 가진 Feature 는 정적 합성에서 구조적으로 제외되고, material 의 hybrid 경로는 반대로 이 값만 direct 로 평가한다. shader 의 floor(value + 0.5) 복원 규칙에서 정확히 왕복한다.

TERRAIN_COMPOSITION_TYPE_ORDER: Record<TerrainDecalRasterType, number> = {path: 0, area: 1, circle: 2}
    기존 direct 합성이 raster 를 그리는 geometry 종류 순서. 전체 stream 과 dynamic 부분집합 판정이 같은 순서를 쓴다.

TerrainDecalCompositionFeatureInput 타입 정의
    featureId?: string | number
        원본 Feature 식별자
    id?: string | number
        구버전 Feature 식별자
    uid?: string | number
        구버전 고유 식별자
    compositionFeatureKey?: string
        원자적 합성 Feature 식별자
    compositionGroupKey?: string
        합성 Layer group 식별자이며 없으면 default 를 쓴다.
    compositionRenderOrder?: number
        공개 Layer renderOrder 에서 파생한 내부 합성 순서
    compositionGroupOrder?: number
        Layer 가 terrain composition 에 최초 등록된 순번
    renderOrder?: number
        group 내부 Feature 표시 순서
    featureCompositionOrdinal?: number
        Feature 최초 등록 순번
    type?: string
        terrain raster 유형이며 없으면 path 를 쓴다.
    sourceKey?: string
        원본 source 식별자이며 계획에서는 part 정보로만 보관한다.
    isHole?: boolean
        polygon hole 여부
    bounds?: Array<number>
        stroke 를 포함한 tile-local [minX, minY, maxX, maxY] 범위이며 없으면 겹친다고 보수적으로 판정한다.
    compositionStability?: TerrainDecalCompositionStability
        호출부가 정규화한 Feature 변경 안정성이며 값이 없으면 미분류다.

TerrainDecalCompositionStability 타입 정의
    'static' | 'dynamic'
        Feature 변경 안정성이며 sourceKey prefix 해석은 이 단위가 하지 않고 호출부가 정규화해 전달한다.

TerrainDecalCompositionPlanOption 타입 정의
    stabilitySeparationMargin?: number
        static 과 dynamic 집합을 떼어 놓아야 하는 tile-local 여유 거리다. 합성 결과가 자기 범위 밖으로 번지는 폭을 호출부가 합성 target texel 크기에서 계산해 넘긴다. 생략하면 번짐이 없는 순수 판정이며, 유한한 0 이상이 아닌 값이면 보장 불가로 본다.

TerrainDecalRasterType 타입 정의
    'path' | 'area' | 'circle'
        terrain raster 유형이며 direct 합성의 pass 순서와 같은 순서다.

TerrainDecalCompositionPartState 타입 정의
    featureId: string
        원본 Feature 식별자
    sourceKey: string | undefined
        원본 source 식별자
    isHole: boolean
        polygon hole 여부

TerrainDecalCompositionPart 타입 정의
    Readonly<TerrainDecalCompositionPartState>
        part 상태의 읽기 전용 별칭이며 런타임 의미를 더하지 않는다.

TerrainDecalCompositionFeatureState 타입 정의
    compositionFeatureKey: string
        원자적 합성 Feature 식별자
    compositionGroupKey: string
        합성 Layer group 식별자
    compositionRenderOrder: number
        group 이 확정한 내부 합성 순서
    compositionGroupOrder: number
        group 이 확정한 최초 등록 순번
    renderOrder: number
        group 내부 Feature 표시 순서
    featureCompositionOrdinal: number
        Feature 최초 등록 순번
    type: TerrainDecalRasterType
        terrain raster 유형
    featureId: string
        atomic Feature 식별자이며 compositionFeatureKey 와 같은 값이다.
    parts: ReadonlyArray<TerrainDecalCompositionPart>
        atomic Feature 를 구성하는 geometry part 목록
    compositionStability: TerrainDecalCompositionStability | undefined
        Feature 변경 안정성이며 미분류면 undefined 다.

TerrainDecalCompositionFeature 타입 정의
    Readonly<TerrainDecalCompositionFeatureState>
        Feature 상태의 읽기 전용 별칭이며 런타임 의미를 더하지 않는다.

TerrainDecalCompositionGroupState 타입 정의
    compositionGroupKey: string
        합성 Layer group 식별자
    compositionRenderOrder: number
        공개 Layer renderOrder 에서 파생한 내부 합성 순서
    compositionGroupOrder: number
        Layer 가 terrain composition 에 최초 등록된 순번
    features: ReadonlyArray<TerrainDecalCompositionFeature>
        총정렬된 atomic Feature 목록

TerrainDecalCompositionGroup 타입 정의
    Readonly<TerrainDecalCompositionGroupState>
        group 상태의 읽기 전용 별칭이며 런타임 의미를 더하지 않는다.

TerrainDecalCompositionBatchState 타입 정의
    compositionGroupKey: string
        합성 Layer group 식별자
    type: TerrainDecalRasterType
        terrain raster 유형
    featureStart: number
        전체 Feature stream 에서 시작할 index
    featureCount: number
        batch 에 포함된 atomic Feature 개수
    compositionFeatureKeys: ReadonlyArray<string>
        batch 에 포함된 atomic Feature 식별자
    splitReason?: 'required-raster-contract-transition' | undefined
        같은 group 과 type 의 최대 연속 구간을 필수 raster contract 전이로 나눈 이유

TerrainDecalCompositionBatch 타입 정의
    Readonly<TerrainDecalCompositionBatchState>
        batch 상태의 읽기 전용 별칭이며 런타임 의미를 더하지 않는다.

TerrainDecalCompositionPlanState 타입 정의
    groups: ReadonlyArray<TerrainDecalCompositionGroup>
        총정렬된 Layer group 목록
    orderedFeatures: ReadonlyArray<TerrainDecalCompositionFeature>
        전체 atomic Feature stream
    batches: Array<TerrainDecalCompositionBatchState>
        최대 연속 합성 batch 목록
    directCompatible: boolean
        전체 Feature stream 을 기존 path, area, circle 직접 합성으로 그대로 재현할 수 있는지 여부이며 안정성 정책과 무관한 stream 속성이다.
    compositionMode: 'direct' | 'precomposed' | 'hybrid'
        합성 실행 방식
    modeReason: 'type-stream-compatible' | 'type-stream-requires-precompose' | 'polygon-local-hole-requires-precompose' | 'order-inversion-disjoint-geometry' | 'stability-metadata-incomplete' | 'stability-static-only-precomposed' | 'stability-hybrid-disjoint' | 'stability-cross-intersects-precomposed' | 'stability-separation-unverifiable-precomposed' | 'stability-dynamic-subset-requires-precompose'
        합성 방식 선택 이유
    orderSignature: string
        source 경계를 제외한 canonical 합성 순서 식별자
    stabilityClassified: boolean
        모든 Feature 가 명시적으로 static 또는 dynamic 으로 분류됐는지 여부
    precomposedTargetKeys: ReadonlyArray<string>
        precomposed 대상으로 계획한 합성 대상 식별자이며 전체 stream 순서를 그대로 투영한다. 각 값은 buildTerrainCompositionTargetKey 가 만든 group 범위 식별자다.
    directTargetKeys: ReadonlyArray<string>
        direct 대상으로 계획한 합성 대상 식별자이며 전체 stream 순서를 그대로 투영한다. 각 값은 buildTerrainCompositionTargetKey 가 만든 group 범위 식별자다.
    precomposedBatchIndices: ReadonlyArray<number>
        precomposed 대상 Feature 가 하나 이상 있는 batches 순번 목록이며 오름차순이다. 합성기가 이 순번만 실행해 정적 대상이 없는 batch 에 빈 draw 를 발행하지 않게 한다. direct 에서는 비어 있다.
    staticSignature: string
        static 으로 분류된 Feature 집합의 계획 단계 membership 과 순서 식별자이며 geometry·style revision 을 담지 않으므로 최종 cache key 가 아니다.
    dynamicSignature: string
        dynamic 으로 분류된 Feature 집합의 계획 단계 membership 과 순서 식별자이며 geometry·style revision 을 담지 않으므로 최종 cache key 가 아니다.

TerrainDecalCompositionPlan 타입 정의
    Readonly<TerrainDecalCompositionPlanState>
        계획 상태의 읽기 전용 별칭이며 런타임 의미를 더하지 않는다.

MutableTerrainDecalCompositionFeature 타입 정의
    Omit<TerrainDecalCompositionFeature, 'parts'> & {parts: Array<TerrainDecalCompositionPart>}
        계획 생성 중 part 를 추가할 수 있는 Feature 이며 반환 직전에 얼린다.

MutableTerrainDecalCompositionGroup 타입 정의
    Omit<TerrainDecalCompositionGroup, 'features'> & {features: Array<MutableTerrainDecalCompositionFeature>}
        계획 생성 중 Feature 를 추가할 수 있는 group 이며 반환 직전에 얼린다.

MutableTerrainDecalCompositionBatch 타입 정의
    Omit<TerrainDecalCompositionBatchState, 'compositionFeatureKeys'> & {compositionFeatureKeys: Array<string>}
        계획 생성 중 Feature 범위를 넓힐 수 있는 batch 이며 반환 직전에 얼린다.

normalizeOrder(value) -> number
    역할: 정렬에 쓸 숫자를 유한한 값으로 정규화한다.

    인터페이스:
        value: 정규화할 값
        반환: 유한한 수이며 유한하지 않으면 0 이다.

    처리 기준:
        유한하지 않은 값을 0 으로 바꿔 정렬 비교가 NaN 으로 무너지지 않게 한다.

    동작:
        유한한 값이면 수로 바꿔 반환하고 아니면 0 을 반환한다.

normalizeKey(value, fallback) -> string
    역할: 문자열 식별자를 비교 가능한 값으로 정규화한다.

    인터페이스:
        value: 정규화할 식별자
        fallback: 값이 없을 때 사용할 식별자
        반환: 정규화된 식별자 문자열

    처리 기준:
        undefined, null, 빈 문자열을 모두 없는 값으로 보고 fallback 을 쓴다.

    동작:
        없는 값이면 fallback 을 반환하고 아니면 문자열로 바꿔 반환한다.

normalizeCompositionStability(value, compositionFeatureKey) -> TerrainDecalCompositionStability | undefined
    역할: Feature 변경 안정성 입력을 정규화한다.

    인터페이스:
        value: 정규화할 안정성 값
        compositionFeatureKey: 오류 문구에 사용할 Feature 식별자
        반환: 분류된 값이며 미분류면 undefined 다.
        예외: static 과 dynamic 이 아닌 값이면 TypeError 다.

    처리 기준:
        undefined, null, 빈 문자열만 미분류로 본다.
        그 밖의 값은 거절한다. 오타를 미분류로 흘리면 tile 전체가 조용히 precomposed 로 떨어져 원인을 찾기 어렵기 때문이다.

    동작:
        없는 값이면 undefined 를 반환하고 두 값 중 하나면 그 값을 반환하며 나머지는 거절한다.

compareKey(left, right) -> number
    역할: 문자열 두 개를 실행 환경의 locale 설정과 무관하게 비교한다.

    인터페이스:
        left: 왼쪽 값
        right: 오른쪽 값
        반환: 같으면 0, left 가 앞이면 -1, 아니면 1 이다.

    처리 기준:
        localeCompare 를 쓰지 않는다. 같은 입력이 실행 환경에 따라 다른 순서를 만들면 순서 서명이 달라지기 때문이다.

    동작:
        같으면 0 을 반환하고 아니면 코드 포인트 크기 비교 결과를 반환한다.

selectCompositionIdentity(values) -> unknown | undefined
    역할: 우선순위 순서의 식별자 후보에서 값이 있는 첫 번째를 고른다.

    인터페이스:
        values: 우선순위 순서의 식별자 후보 배열
        반환: 선택한 식별자이며 모든 후보가 없으면 undefined 다.

    처리 기준:
        undefined 와 null 만 없는 값으로 보고 0 과 빈 문자열은 후보로 남긴다.

    동작:
        앞에서부터 훑어 값이 있는 첫 후보를 반환하고 없으면 undefined 를 반환한다.

isExactTerrainCompositionBatchIndex(batchIndex) -> boolean
    역할: batch 순번이 packed Float32 채널에서 오차 없이 복원되는 범위인지 확인한다.

    인터페이스:
        batchIndex: 확인할 batch 순번
        반환: 정확히 왕복할 수 있으면 true 다.

    처리 기준:
        정수가 아니거나 0 미만 또는 TERRAIN_COMPOSITION_MAX_BATCH_INDEX 초과면 false 다.
        Math.fround 로 Float32 왕복을 재현한 뒤 shader 의 floor(value + 0.5) 복원 규칙과 같은 값이 나오는지 함께 확인한다.

    동작:
        정수·범위를 확인하고 Float32 로 내린 값에 shader 복원 규칙을 적용해 원래 값과 같은지 반환한다.

buildTerrainCompositionTargetKey(compositionGroupKey, compositionFeatureKey) -> string
    역할: group 범위를 보존하는 합성 대상 식별자를 만든다.

    인터페이스:
        compositionGroupKey: 합성 Layer group 식별자
        compositionFeatureKey: 원자적 합성 Feature 식별자
        반환: group 범위를 포함한 합성 대상 식별자

    처리 기준:
        계획의 원자 identity 가 group key 와 feature key 의 쌍이므로 두 값을 함께 담는다. 서로 다른 group 이 같은 feature key 를 쓸 수 있어 feature key 만으로는 대상을 구분할 수 없다.
        구분자 문자가 식별자 안에 들어갈 수 있어 길이가 명확한 JSON 배열로 직렬화한다. 단순 구분자 결합은 group 과 key 의 경계가 달라도 같은 문자열을 만들 수 있다.
        tile 상태 모듈의 batch key 와 같은 직렬화 규약을 쓰지만 순환 의존을 만들지 않도록 그 모듈을 가져오지 않는다.

    동작:
        두 값을 문자열로 바꿔 두 원소 JSON 배열로 직렬화해 반환한다.

normalizeCompositionBounds(bounds) -> Array<number> | undefined
    역할: 입력 범위를 교차 판정에 쓸 수 있는 형태로 정규화한다.

    인터페이스:
        bounds: 정규화할 [minX, minY, maxX, maxY] 범위
        반환: 유효한 네 값 배열이며 판정할 수 없으면 undefined 다.

    처리 기준:
        배열이 아니거나 길이가 4 보다 작으면 판정할 수 없다.
        네 값이 모두 유한해야 하고 max 가 min 보다 작으면 뒤집힌 범위이므로 판정할 수 없다.

    동작:
        앞 네 값을 수로 바꿔 유한성과 min·max 관계를 확인하고 통과하면 그 배열을 반환한다.

normalizeStabilitySeparationMargin(value) -> {margin: number, verifiable: boolean}
    역할: static 과 dynamic 집합을 떼어 놓아야 하는 여유 거리를 정규화한다.

    인터페이스:
        value: 호출부가 넘긴 여유 거리
        반환: 적용할 여유와 보장 가능 여부

    처리 기준:
        값을 넘기지 않으면 번짐이 없는 순수 판정으로 보고 여유 0 을 보장 가능으로 돌려준다.
        유한한 0 이상이면 그 값을 쓴다.
        음수·NaN·Infinity 같은 그 밖의 값은 여유를 계산하지 못한 상태이므로 0 으로 낙관하지 않고 보장 불가로 돌려준다.
        합성 결과는 자기 범위 밖으로 번진다. 합성 raster 가 얇은 외곽선을 texel 절반까지 넓히고 결과 texture 를 LinearFilter 로 sampling 하기 때문이며, 그 폭은 합성 target 의 texel 크기에 달려 있어 계획이 스스로 알 수 없다.

    동작:
        없는 값이면 여유 0 과 보장 가능을, 유한한 0 이상이면 그 값과 보장 가능을, 나머지는 여유 0 과 보장 불가를 반환한다.

inflateCompositionBounds(bounds, margin) -> Array<number> | undefined
    역할: 범위를 모든 방향으로 같은 거리만큼 넓힌다.

    인터페이스:
        bounds: 넓힐 [minX, minY, maxX, maxY] 범위
        margin: 넓힐 거리
        반환: 넓힌 범위이며 원본을 알 수 없으면 undefined 다.

    처리 기준:
        범위를 알 수 없으면 넓히지 않고 알 수 없는 상태를 유지한다.
        여유가 0 이하면 원본을 그대로 돌려준다.

    동작:
        최소값에서 여유를 빼고 최대값에 여유를 더한 새 배열을 반환한다.

mergeCompositionBounds(left, right) -> Array<number> | undefined
    역할: 같은 atomic Feature 를 구성하는 part 범위를 하나로 합친다.

    인터페이스:
        left: 기존 범위
        right: 추가할 범위
        반환: 합친 범위이며 하나라도 알 수 없으면 undefined 다.

    처리 기준:
        한쪽이라도 알 수 없으면 합친 결과도 알 수 없다. 일부 part 만으로 좁은 범위를 만들면 교차 판정이 실제보다 낙관적으로 바뀌기 때문이다.

    동작:
        두 범위의 최소·최대를 각각 골라 새 배열로 반환한다.

doTerrainCompositionBoundsIntersect(left, right) -> boolean
    역할: 두 tile-local 범위가 실제로 겹치는지 확인한다.

    인터페이스:
        left: 왼쪽 [minX, minY, maxX, maxY] 범위
        right: 오른쪽 [minX, minY, maxX, maxY] 범위
        반환: 범위를 알 수 없거나 실제로 겹치면 true 다.

    처리 기준:
        배열이 아니거나 길이가 부족하거나 유한하지 않은 값이 있으면 보수적으로 겹친다고 판정해 잘못된 direct 합성을 만들지 않는다.
        경계가 맞닿는 경우도 겹친다고 본다.

    동작:
        판정할 수 없으면 true 를 반환하고 아니면 두 축의 구간 겹침 여부를 함께 반환한다.

hasIntersectingTerrainOrderInversion(orderedFeatures, featureBoundsList, typeOrder) -> boolean
    역할: raster 유형 순서가 뒤집힌 Feature 쌍이 실제로 겹치는지 확인한다.

    인터페이스:
        orderedFeatures: 총정렬된 Feature 목록
        featureBoundsList: Feature index 별 tile-local 범위
        typeOrder: 기존 direct 합성의 raster 유형 순서
        반환: 겹치는 역전 쌍이 있거나 판정할 수 없으면 true 다.

    처리 기준:
        유형 순서를 알 수 없는 Feature 가 있으면 판정을 포기하고 true 를 반환한다.
        앞선 Feature 의 유형 순서가 더 클 때만 역전 쌍이므로 그때만 범위를 비교한다.
        비교 횟수가 TERRAIN_COMPOSITION_INTERSECTION_CHECK_LIMIT 를 넘으면 더 비교하지 않고 true 를 반환한다.

    동작:
        각 Feature 를 앞선 모든 Feature 와 견주어 역전 쌍의 범위 겹침을 확인한다.
        겹치는 쌍을 찾으면 즉시 true 를 반환하고 끝까지 없으면 false 를 반환한다.

hasIntersectingTerrainHoleErase(orderedFeatures, featureBoundsList, holeAreaFeatures) -> boolean
    역할: polygon hole 이 앞선 area 를 지울 수 있는지 확인한다.

    인터페이스:
        orderedFeatures: 총정렬된 Feature 목록
        featureBoundsList: Feature index 별 tile-local 범위
        holeAreaFeatures: hole 을 가진 area Feature 위치 목록
        반환: 지워질 수 있는 앞선 area 가 있거나 판정할 수 없으면 true 다.

    처리 기준:
        같은 area pass 안에서만 지워지므로 앞선 area 유형 Feature 만 비교한다.
        비교 횟수가 TERRAIN_COMPOSITION_INTERSECTION_CHECK_LIMIT 를 넘으면 더 비교하지 않고 true 를 반환한다.

    동작:
        hole 을 가진 각 area 를 앞선 area 들과 견주어 범위 겹침을 확인한다.
        겹치는 앞선 area 를 찾으면 즉시 true 를 반환하고 끝까지 없으면 false 를 반환한다.

hasIntersectingTerrainStabilityCross(staticBoundsList, dynamicBoundsList, separationMargin = 0) -> boolean
    역할: static 집합과 dynamic 집합에 서로 겹치는 쌍이 있는지 확인한다.

    인터페이스:
        staticBoundsList: static Feature 의 tile-local 범위 목록
        dynamicBoundsList: dynamic Feature 의 tile-local 범위 목록
        separationMargin: 합성 번짐을 감싸기 위해 static 범위를 넓힐 거리이며 기본값은 0 이다.
        반환: 겹치는 쌍이 있거나 판정할 수 없으면 true 다.

    처리 기준:
        번짐은 합성 결과 쪽에서만 생기므로 static 범위만 넓혀 비교한다. dynamic 의 direct 그리기는 자기 범위를 넘지 않는다.
        넓힌 범위는 쌍마다 다시 만들지 않고 미리 한 번 만든다.
        비교 횟수가 TERRAIN_COMPOSITION_INTERSECTION_CHECK_LIMIT 를 넘으면 더 비교하지 않고 true 를 반환한다.
        범위를 알 수 없는 Feature 는 겹친다고 판정되므로 이 경우도 true 가 된다.

    동작:
        여유가 있으면 static 범위 목록을 미리 넓힌다.
        두 집합의 모든 쌍을 견주어 겹침을 확인하고 하나라도 겹치면 즉시 true 를 반환한다.

evaluateTerrainDirectCompatibility(orderedFeatures, featureBoundsList) -> {directCompatible: boolean, modeReason: 'type-stream-compatible' | 'type-stream-requires-precompose' | 'polygon-local-hole-requires-precompose' | 'order-inversion-disjoint-geometry'}
    역할: Feature stream 하나가 기존 direct 합성과 순서가 동등한지 판정한다.

    인터페이스:
        orderedFeatures: 총정렬된 Feature 목록
        featureBoundsList: Feature index 별 tile-local 범위
        반환: 동등성 판정과 그 이유

    처리 기준:
        전체 stream 과 dynamic 부분집합에 같은 규칙을 적용하기 위해 분리한 함수이며 두 호출 모두 같은 유형 순서를 쓴다.
        유형 순서가 어긋나거나 hole erase 위험이 있어도 관련 쌍이 실제로 겹치지 않으면 동등하다고 본다.
        첫 area 뒤에 오는 hole 을 가진 area 만 hole erase 위험으로 본다.

    동작:
        유형 순서가 path, area, circle 순서를 지키는지 확인한다.
        hole 을 가진 area 가 앞선 area 뒤에 있는지 모아 둔다.
        어긋난 유형 쌍과 hole erase 쌍이 실제로 겹치는지 확인한다.
        동등성과 선택 이유를 함께 반환한다.

buildTerrainCompositionOrderSignature(features) -> string
    역할: Feature 목록을 실행 환경과 무관한 membership·순서 서명으로 만든다.

    인터페이스:
        features: 서명을 만들 Feature 목록
        반환: canonical 순서 서명

    처리 기준:
        group 식별자·순서, Feature 식별자·순서, 유형, part 구성만 담는다. source 경계와 tile-local 좌표를 담지 않으므로 같은 최종 순서는 항상 같은 서명이 된다.
        전체 stream, static 부분집합, dynamic 부분집합이 모두 이 함수를 쓴다. 전체 index 를 담지 않으므로 다른 집합의 변화가 서명을 흔들지 않는다.

    동작:
        각 Feature 의 순서 metadata 와 part 목록을 배열로 만들어 JSON 문자열로 반환한다.

buildTerrainDecalCompositionPlan(features: Array<TerrainDecalCompositionFeatureInput> = [], opt: TerrainDecalCompositionPlanOption = {}) -> TerrainDecalCompositionPlan
    역할: 한 terrain tile 과 host 구간에 사용할 Feature 합성 계획을 만든다.

    인터페이스:
        features: 합성할 Feature 입력 목록이며 생략하면 빈 배열이다.
        opt.stabilitySeparationMargin: static 과 dynamic 을 떼어 놓아야 하는 tile-local 여유 거리이며 생략할 수 있다.
        반환: Layer 와 Feature 총순서가 적용된 불변 합성 계획
        예외: stable Feature 식별자가 없거나 같은 식별자의 합성 metadata 가 불일치하거나 순서 metadata 가 겹치거나 batch 순번 범위를 넘으면 TypeError 다.

    처리 기준:
        배열이 아닌 입력과 비어 있는 원소는 건너뛴다.
        Feature 식별자는 compositionFeatureKey, featureId, id, uid 순서로 고르고 하나도 없으면 거절한다. 배열 도착 순서를 식별자로 대체하면 같은 집합이 순서에 따라 다른 계획을 만들기 때문이다.
        같은 group 과 compositionFeatureKey 로 다시 들어온 입력의 순서 metadata 와 유형이 처음과 다르면 거절한다.
        같은 compositionRenderOrder 안에서 compositionGroupOrder 를 다른 group 이 이미 쓰고 있으면 거절한다.
        같은 group 안에서 renderOrder 와 featureCompositionOrdinal 조합을 다른 Feature 가 이미 쓰고 있으면 거절한다.
        같은 compositionFeatureKey 의 추가 입력은 새 Feature 를 만들지 않고 part 로 붙이며 범위도 합친다.
        group 순서는 compositionRenderOrder, compositionGroupOrder 순이고 group 안 Feature 순서는 featureCompositionOrdinal, renderOrder 순이다. 최초 등록 순서를 1차 기준으로 고정해 renderOrder 동률에서 순서가 흔들리지 않게 한다.
        part 순서는 outer 를 먼저 두고 hole 을 뒤에 두며 같은 종류 안에서는 featureId 로 정렬한다.
        Feature 수가 TERRAIN_COMPOSITION_MAX_BATCH_INDEX + 1 을 넘으면 거절한다. batch 순번을 packed Float32 채널로 전달하기 때문이다.
        batch 는 같은 group 과 유형의 최대 연속 구간으로 묶되 hole 을 가진 area Feature 는 raster contract 를 보존해야 하므로 그 경계에서 나누고 사유를 남긴다.
        raster 유형 순서와 hole erase 위험 판정은 전체 stream 과 dynamic 부분집합에 같은 함수를 쓴다.
        directCompatible 은 전체 stream 을 direct 로 재현할 수 있는지만 뜻하며 안정성 정책과 분리한다. 안정성 도입 전과 같은 값이 나오도록 계산을 바꾸지 않는다.
        안정성이 하나도 분류되지 않은 입력은 mode, 선택 이유, batch, 순서 서명이 안정성 도입 전과 같다.
        안정성이 일부만 분류된 입력은 전체를 precompose 하고 사유를 stability-metadata-incomplete 로 남긴다.
        모두 분류됐고 static 만 있으면 전체를 precompose 한다.
        모두 분류됐고 dynamic 만 있으면 dynamic 부분집합이 전체 stream 과 같으므로 기존 판정과 사유를 그대로 쓴다.
        모두 분류됐고 두 집합이 함께 있으면 먼저 번짐 여유를 확인한다. 여유를 보장할 수 없으면 수치상 비교차여도 전체를 precompose 하고 사유를 stability-separation-unverifiable-precomposed 로 남긴다.
        다음으로 여유를 포함한 두 집합의 범위 교차를 보고, 겹치면 전체를 precompose 한다. 교차 집합의 재귀적 부분 승격은 실행 파이프라인까지 검증하기 전이라 이 단계에서 하지 않는다.
        번짐 여유는 두 집합 사이 판정에만 쓴다. 전체 stream 의 direct 동등성과 dynamic 부분집합 내부 판정은 여유 없이 그대로 본다.
        두 집합이 겹치지 않아도 dynamic 부분집합 자체가 direct 계약을 지키지 못하면 전체를 precompose 한다.
        두 조건을 모두 만족할 때만 hybrid 로 계획하고 static 은 precomposed 대상, dynamic 은 direct 대상으로 나눈다.
        두 대상 목록은 전체 stream 을 한 번 순회해 만들므로 같은 Feature 가 두 목록에 함께 들어가지 않는다. 같은 atomic Feature 의 part 는 하나의 Feature 이므로 outer 와 hole 도 함께 움직인다.
        대상 목록의 각 값은 group key 와 feature key 를 함께 담은 식별자다. 같은 생성 함수를 내부 정의 key 에도 써서 한 모듈 안에 직렬화 규약을 하나만 둔다.
        precomposed 대상이 하나 이상 있는 batch 순번만 실행 목록으로 투영한다. batch 는 같은 group 과 유형의 연속 구간이라 hybrid 에서는 정적·동적 대상이 한 batch 에 함께 있을 수 있으므로, 실행 목록만으로 대상을 가르지 않고 packed batch 순번의 direct sentinel 이 함께 작용한다.
        batch 는 이번 단계에서 전체 stream 의 기존 의미를 유지한다. hybrid 실행용 대상별 batch 분리는 다음 단계에서 설계한다.
        반환 직전에 part, Feature, group, batch, 계획 객체를 모두 얼려 소비자가 계획을 바꾸지 못하게 한다.
        입력 배열과 입력 객체는 바꾸지 않고 새 객체만 만든다.

    동작:
        입력을 순회하며 group 과 atomic Feature 를 모으고 식별자·안정성·순서 metadata 를 검증한다.
        group 을 합성 순서로 정렬하고 group 안 Feature 와 Feature 안 part 를 정렬해 전체 stream 을 만든다.
        Feature index 별 범위 목록을 만들고 batch 순번 한계를 확인한다.
        같은 group 과 유형의 최대 연속 batch 를 만들되 필수 raster contract 전이에서 나눈다.
        전체 stream 의 direct 동등성을 판정한다.
        안정성별 Feature 와 범위를 나누고 전체가 분류됐는지 센다.
        분류 상태와 번짐 여유, 두 집합의 교차, dynamic 부분집합 동등성으로 합성 방식과 선택 이유를 정한다.
        전체 stream 순서를 그대로 투영해 precomposed 대상과 direct 대상 목록을 만든다.
        precomposed 대상을 가진 batch 순번을 모아 합성 실행 목록을 만든다.
        전체·static·dynamic 순서 서명을 만든다.
        중첩 구조와 두 대상 목록을 모두 얼려 계획을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
이 단위는 순수 계산만 하며 GPU 자원, packed buffer, tile 상태, 표시 시점을 만들거나 바꾸지 않는다.
tile-local 범위는 호출부가 stroke·radius·gutter 를 이미 반영해 전달한 값으로 취급하고 계획에서 다시 확장하지 않는다.
sourceKey 는 part 정보로만 보관하며 순서 판정과 순서 서명에는 넣지 않는다. 같은 최종 순서가 source 구성에 따라 다른 서명을 만들지 않게 하기 위해서다.
판정할 수 없는 입력은 direct 합성을 포기하는 방향으로만 처리한다.
안정성 값의 의미 판정은 이 단위가 하지 않는다. sourceKey 의 tile 이나 feature prefix 를 해석하지 않고 호출부가 정규화해 넘긴 값만 쓴다.
안정성 정책은 mode 와 두 대상 목록만 바꾸며 총순서, batch, 순서 서명, 불변성 계약은 바꾸지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
