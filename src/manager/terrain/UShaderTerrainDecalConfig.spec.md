# UShaderTerrainDecalConfig 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

Terrain decal 파이프라인에서 한 프레임에 얼마나 일할지, 무엇을 얼마나 캐시할지를 정하는 조정 가능한 값을 한 곳에 모으고, 사용자 override를 안전하게 병합해 확정 설정을 만든다.

### 1.2 책임 범위

조정 가능한 값의 기본값, 0보다 커야 하는 값의 목록, override 병합 규칙, manager가 없을 때의 안전한 조회를 이 단위가 소유한다. worker 개수처럼 자료구조 크기를 정하는 구조 상수와 render order 상한 같은 프로토콜 상수는 각 모듈에 남기고 여기서 다루지 않는다. 값을 실제로 쓰는 시점과 방법도 각 모듈이 소유한다.

### 1.3 주요 동작 방식

override가 없으면 기본 설정 객체를 그대로 돌려준다. override가 있으면 기본값의 key만 훑어 수로 바꿀 수 있고 유한한 값만 반영하며, 0보다 커야 하는 key는 0 이하를 무시한다. 하나라도 바뀌면 clear 예약 상한을 프레임당 명령 수 안으로 맞춘 뒤 얼려 돌려주고, 바뀐 값이 없으면 기본 설정을 그대로 돌려준다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalManager`가 생성 시 `createTerrainDecalConfig()`로 확정 설정을 만들어 `TERRAIN_CONFIG`에 보관하고, payload cache 상한과 프레임 예산 시작값으로 사용한다. `UShaderTerrainDecalTileStateManager`와 `UTerrainDecalComposeScheduler`는 manager 인스턴스만 인자로 받으므로 `getTerrainDecalConfig()`로 읽는다. 테스트가 만든 최소 manager 대역에도 안전해야 하므로 조회는 항상 유효한 설정을 돌려준다.

## 2. 요구사항과 품질 기준

```spec
알 수 없는 key 와 유효하지 않은 값은 조용히 무시하고 기본값을 유지해야 한다. 설정 하나가 잘못되어 파이프라인 전체가 멈추는 편보다 기본값으로 동작하고 나머지 override 를 살리는 편이 안전하다.
0 보다 커야 하는 값은 0 이나 음수로 덮어쓸 수 없어야 한다.
확정 설정은 얼려 돌려주어 실행 중에 조용히 바뀌지 않아야 한다.
manager 나 설정이 없어도 조회는 항상 유효한 설정을 돌려주어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
TerrainDecalConfig 타입 정의
    progressScanLimit: number
        한 프레임에 progress 복구를 검사할 최대 tile 수
    progressScanBudgetMs: number
        progress 복구 검사에 쓸 프레임당 시간 예산(ms)
    presentMaxCommandsPerFrame: number
        한 프레임에 처리할 최대 presentation 명령 수
    presentMixedClearReservation: number
        apply 와 clear 가 함께 대기할 때 clear 에 확보할 명령 수
    presentFrameBudgetMs: number
        presentation 처리에 쓸 프레임당 시간 예산(ms)
    compositeMaxDrawCallsPerFrame: number
        한 프레임에 실행할 최대 composite draw call 수
    compositeFrameBudgetMs: number
        composite 합성에 쓸 프레임당 시간 예산(ms)
    compositeMaxWeightedPixelsPerFrame: number
        한 프레임에 합성이 덮을 최대 가중 픽셀 수(메가픽셀)이며 Infinity 이면 픽셀 예산을 쓰지 않고 draw call 상한과 시간 예산만으로 제한한다.
    swapReadyTimeoutMs: number
        swap 준비 대기의 기본 timeout(ms)
    workerResultCacheSize: number
        worker 결과 LRU 캐시 크기
    gpuStateCacheSize: number
        GPU buffer 상태 LRU 캐시 크기
    workerResultFrameBudgetMs: number
        worker 결과 처리에 쓸 프레임당 시간 예산(ms)
    workerResultMaxTasksPerSlice: number
        worker 결과 처리 slice 당 최대 작업 수
    foregroundFlushFrameBudgetMs: number
        전경 tile flush 에 쓸 프레임당 시간 예산(ms)
    backgroundFlushFrameBudgetMs: number
        배경 tile flush 에 쓸 프레임당 시간 예산(ms)
    foregroundPriorityMin: number
        이 값 이상의 priority 를 전경 작업으로 계산한다.
    debugLogLimit: number
        tile 상태 디버그 로그의 최대 보관 수
    payloadCacheMaxEntries: number
        Worker delta 기준선인 tile payload snapshot 을 보관할 최대 tile 수
    payloadFeatureCacheMaxEntries: number
        직렬화한 feature payload 를 보관할 최대 항목 수이며 key 는 tile origin 별이다.
    payloadFeatureCacheMaxBytes: number
        직렬화한 feature payload cache 의 최대 바이트
    payloadSnapshotCacheMaxBytes: number
        tile payload snapshot cache 의 최대 바이트
    hybridCompositionEnabled: number
        0 이 아니면 hybrid 합성 실행 경로를 켠다. Source 안정성 분류를 전달해 정적 Feature 는 offscreen 합성 texture 로, 비교차 동적 Feature 는 direct 로 같은 terrain material 에서 함께 표시한다.

TERRAIN_DECAL_DEFAULT_CONFIG: Readonly<TerrainDecalConfig>
    조정 가능한 값의 기본값이며 각 값은 기존 구현이 쓰던 값을 그대로 옮긴 것이다.

TERRAIN_DECAL_DEFAULT_CONFIG.progressScanLimit: number = 16
    한 프레임 progress 복구 검사 tile 수 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.progressScanBudgetMs: number = 0.5
    progress 복구 검사 시간 예산 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.presentMaxCommandsPerFrame: number = 8
    프레임당 presentation 명령 수 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.presentMixedClearReservation: number = 4
    clear 확보 명령 수 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.presentFrameBudgetMs: number = 2
    presentation 시간 예산 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.compositeMaxDrawCallsPerFrame: number = 8
    프레임당 composite draw call 상한 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.compositeFrameBudgetMs: number = 2
    composite 시간 예산 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.compositeMaxWeightedPixelsPerFrame: number = Number.POSITIVE_INFINITY
    픽셀 예산 기본값이며 비교 측정으로 값을 정하기 전까지 끈 상태로 두어 기존 draw call 상한 동작을 그대로 유지한다.

TERRAIN_DECAL_DEFAULT_CONFIG.swapReadyTimeoutMs: number = 30_000
    swap 준비 대기 timeout 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.workerResultCacheSize: number = 1000
    worker 결과 캐시 크기 기본값(LRUCache 단위 100KB, 약 100MB). 2026-09-16 실측에서 폴리곤 타일의 worker 결과 1건이 약 1.15MB(Polygon 456개)라 이전 값 128(12.8MB)은 10장만 담았고, 이미지 host 추가로 가시 타일 약 90장의 host 구간이 한 번에 무효화되면 대부분이 cache 재생 대신 worker 재팩으로 되돌아갔다. 한 화면분의 폴리곤 타일을 담는 값이며 GPU 아닌 main-memory typed array 예산이다.

TERRAIN_DECAL_DEFAULT_CONFIG.gpuStateCacheSize: number = 64
    GPU 상태 캐시 크기 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.workerResultFrameBudgetMs: number = 2
    worker 결과 처리 시간 예산 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.workerResultMaxTasksPerSlice: number = 8
    worker 결과 처리 slice 당 작업 수 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.foregroundFlushFrameBudgetMs: number = 4
    전경 flush 시간 예산 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.backgroundFlushFrameBudgetMs: number = 1.5
    배경 flush 시간 예산 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.foregroundPriorityMin: number = 3000
    전경 판정 priority 하한 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.debugLogLimit: number = 5000
    디버그 로그 보관 수 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.payloadCacheMaxEntries: number = 512
    payload snapshot 보관 tile 수 기본값이며 UTerrainPayload 모듈 상수에서 옮기며 상향한 값이다.

TERRAIN_DECAL_DEFAULT_CONFIG.payloadFeatureCacheMaxEntries: number = 131_072
    feature payload 항목 수 기본값이며 tile origin 별 key 라 같은 feature 가 parent·child origin 마다 별 항목이 된다.

TERRAIN_DECAL_DEFAULT_CONFIG.payloadFeatureCacheMaxBytes: number = 128 * 1024 * 1024
    feature payload cache 바이트 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.payloadSnapshotCacheMaxBytes: number = 64 * 1024 * 1024
    snapshot cache 바이트 기본값

TERRAIN_DECAL_DEFAULT_CONFIG.hybridCompositionEnabled: number = 0
    hybrid 실행 경로 기본값이며 검증 단계이므로 꺼진 상태다. 0 이 아닌 값으로 덮어써야 분류를 전달한다.

POSITIVE_CONFIG_KEYS: ReadonlyArray<keyof TerrainDecalConfig>
    0 보다 커야 하는 설정 key 목록. 0 이나 음수가 들어오면 파이프라인이 아무 일도 하지 못하는 값만 담는다. compositeMaxWeightedPixelsPerFrame 은 유한한 값으로만 덮어쓸 수 있고 예산을 다시 끄려면 manager 의 실행 중 접근자로 Infinity 를 넣는다.

createTerrainDecalConfig(overrides?: Partial<TerrainDecalConfig>) -> Readonly<TerrainDecalConfig>
    역할: 기본 설정에 사용자 override 를 병합해 확정된 설정을 만든다.

    인터페이스:
        overrides: 덮어쓸 값이며 객체가 아니면 무시한다.
        반환: 확정된 설정

    처리 기준:
        override 가 없거나 객체가 아니면 기본 설정을 그대로 돌려준다.
        기본 설정의 key 만 훑으므로 알 수 없는 key 는 반영하지 않는다.
        수로 바꿀 수 없거나 유한하지 않은 값은 건너뛰어 기본값을 유지한다.
        0 보다 커야 하는 key 는 0 이하 값을 건너뛴다.
        기본값과 같은 값은 변경으로 세지 않는다.
        하나도 바뀌지 않았으면 새 객체를 만들지 않고 기본 설정을 돌려준다.
        clear 예약은 0 이상이며 프레임당 명령 수를 넘을 수 없다.
        확정 설정은 얼려 돌려준다.

    동작:
        override 가 없으면 기본 설정을 반환한다.
        기본 설정을 복제하고 key 를 순서대로 훑어 유효한 값만 반영하며 변경 여부를 기록한다.
        변경이 없으면 기본 설정을 반환한다.
        clear 예약을 0 과 프레임당 명령 수 사이로 맞춘 뒤 얼려 반환한다.

getTerrainDecalConfig(manager?: Partial<{TERRAIN_CONFIG: Readonly<TerrainDecalConfig>}>) -> Readonly<TerrainDecalConfig>
    역할: manager 에 확정된 설정이 없을 때도 항상 유효한 설정을 반환한다.

    인터페이스:
        manager: 설정을 소유한 manager
        반환: 확정된 설정이며 없으면 기본 설정이다.

    처리 기준:
        tile 상태와 scheduler 함수들은 manager 인스턴스만 인자로 받으므로 테스트가 만든 최소 대역에도 안전해야 한다.

    동작:
        manager 의 확정 설정이 있으면 그것을, 없으면 기본 설정을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
이 단위는 값을 정하고 병합하기만 하며 값을 실제로 쓰는 시점과 방법은 각 모듈이 소유한다.
조정 가능한 값만 모으고 자료구조 크기를 정하는 구조 상수와 프로토콜 상수는 각 모듈에 남긴다.
override 병합은 수치 값만 다루므로 켜고 끄는 손잡이도 0 과 0 이 아닌 수로 표현한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
