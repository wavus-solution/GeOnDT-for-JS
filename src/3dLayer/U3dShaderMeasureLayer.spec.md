# U3dShaderMeasureLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dShaderMeasureLayer`는 사용자가 지도 위에 그린 거리·면적·반경 측정 도형을 화면에 표시하는 레이어다. 측정 좌표를 받아 `UMeasureFeature`로 만들고, 그 feature를 두 가지 렌더 경로 중 하나로 그린다. `basic` 경로는 도형을 terrain decal payload로 바꿔 지형 tile 재질에 합성하고, `simple` 경로는 three.js mesh를 직접 만들어 scene group에 넣는다. `auto`는 `basic`을 가리키는 옛 입력값이다.

### 1.2 책임 범위

- 위경도 좌표 입력을 받아 측정 feature의 three.js geometry와 OpenLayers geometry를 함께 만들고 갱신한다.
- feature가 덮는 tile 범위를 level별로 계산해 tile binding을 만들고, 형상이 바뀌면 binding을 다시 만든다.
- feature를 terrain decal manager가 소비할 payload로 변환해 tile source에 반영하고, 제거·교체·표시 전환 시 source를 정리한다.
- 같은 JavaScript task에서 일어난 여러 feature 변경을 한 번의 terrain payload 갱신으로 병합하고, 실패하면 한 번만 자동 재시도한다.
- terrain tile의 표시 판정(자식 LOD 전환 가능 여부, 화면 coverage 제공 여부, 부모 제거 보류 여부)에 이 레이어의 관여 상태를 제공한다.
- `simple` 경로에서는 선·면·원 측정 도형의 mesh와 외곽선을 전면용·가림용 두 벌로 만들어 직접 관리한다.
- 측정 결과값(길이, 면적, 반경)을 계산해 반환한다.
- 책임 경계: tile 재질 합성, decal 적용 시점과 tile 생명주기 확정은 `UShaderTerrainDecalManager`가 담당한다. 측정 feature의 좌표·revision·스타일 보관은 `UMeasureFeature`가 담당한다. tile 요청·취소와 scene group 관리의 공통 처리는 기반 클래스 `U3dLayer`가 담당한다.

### 1.3 주요 동작 방식

측정 입력은 `setMeasurePoints()`·`addMeasurePoint()`·`updateLastPosition()`으로 들어와 `#updateFeature()`를 거쳐 편집 중 feature 하나(`_measureFeature`)를 만들거나 갱신한다. 외부에서 완성된 feature는 `_features.addFeature()`(`#sourceAddFeature()`)로 등록된다.

feature가 바뀌면 `#scheduleFeatureUpdate()`가 대기 집합에 넣고 microtask 한 번으로 묶어 `createUserTexture()`를 호출한다. `createUserTexture()`는 feature마다 현재 렌더 방식을 보고, `simple`이면 직접 mesh를 만들고 `basic`이면 tile 범위 signature를 계산해 binding을 만든 뒤 `syncMeasureTerrainFeaturePayload()`로 manager에 증분 반영한다. 마지막에 영향받은 tile들을 한 번에 `flushTileUpdates()`로 밀어 넣는다.

tile이 scene에 들어오면 `addTileFromScene()`이 `syncMeasureTerrainTileMaterial()`로 그 tile 전체를 full sync 하고, 나가면 `removeTileFromScene()`이 로컬 추적만 정리한다. LOD 전환 판정은 `isTileRenderableReady()`·`isTilePresentationVisible()`·`isTilePresentationAttached()`·`isTileRetainedPresentationSafe()`·`isTileSceneRemovalDeferred()`가 manager 상태를 조회해 답한다.

관찰된 실행 특성: 마우스 이동처럼 연속 갱신이 들어오면 앞선 revision의 build가 취소되어 tile이 갱신을 멈춘 것처럼 보이므로, `createUserTexture()`는 flush 뒤에 tile마다 `ensureTileProgress()`를 호출해 진행을 보장한다.

### 1.4 주요 사용처와 연계 대상

- `U3dLayer`는 기반 클래스이며 `initialize()`, `show()`, `cancelAllTile()`, `dispose()`, `disposeTile()`, `setRenderOrder()`, `update()`, `getTileFromScene()`, `addTileFromScene()`, `removeTileFromScene()`, `suspendTilePresentation()`을 재정의한다.
- `UShaderTerrainDecalManager`(`_terrainDecalManager`)는 tile 재질에 measure payload를 합성하고 tile 표시 상태를 확정한다.
- `UMeasureFeature`는 측정 feature의 좌표·타입·스타일·revision을 소유한다.
- `UShaderMaterialManager`는 이 레이어가 생성·소유하며 material·template 캐시를 공유한다.
- `UTerrainDecalCompositionOrderRegistry`(`_compositionOrderRegistry`)는 feature의 최초 등록 순서 힌트를 만든다.
- `UShaderTerrainDecalUtils`의 `hashTerrainSignatureValue()`·`buildTerrainImmutableFeatureHash()`와 `UShaderTerrainDecalTileStateManager`의 `hasTerrainTileFailedCurrentRevision()`을 payload 해시와 실패 판정에 사용한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
측정 입력으로 만든 feature는 `basic`·`simple` 두 렌더 경로 중 현재 방식 한쪽에만 남아야 하며, 방식을 바꾸면 이전 경로가 만든 객체와 payload가 화면에서 사라져야 한다.
같은 JavaScript task에서 일어난 여러 스타일·형상 변경은 한 번의 terrain payload 갱신으로 합쳐져야 한다.
terrain payload 갱신이 실패하면 한 번만 자동으로 다시 시도하고, 두 번째 실패는 다음 변경이나 명시적 commit까지 대기 목록에 보존해야 한다.
feature의 경계 상자가 같아도 형상이 바뀌어 덮는 tile이 달라지면 tile binding을 다시 만들어야 한다.
feature를 제거해도 같은 tile에 남은 다른 feature의 표시가 꺼지면 안 된다.
부모 tile과 자식 tile이 교대하는 동안에는 이전 소유자의 payload를 남겨 화면 공백이 생기지 않아야 한다.
레이어를 숨기면 이 레이어가 등록한 tile source payload만 비우고 같은 tile의 다른 레이어 표시에는 영향을 주지 않아야 한다.
레이어를 숨기는 동안에는 진행 중인 tile 요청을 취소하지 않아 다시 표시할 때 곧바로 그릴 수 있어야 한다.
tile 하나의 measure source 내용이 바뀌지 않으면 revision이 올라가지 않아야 하며, 바뀔 때마다 1씩 단조 증가해야 한다.
자식 네 tile의 measure 표시가 모두 준비되기 전에는 부모 tile을 scene에서 제거하지 않아야 한다.
레이어를 정리하면 등록한 terrain source, 캐시 mesh, material, geometry와 shader material manager가 모두 해제되어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
모듈 상수

    DEFAULT_RADIUS: number = 0.5
        OpenLayers Point를 측정 feature로 받을 때 만드는 원 geometry의 반경이다.
    DEFAULT_MAX_LEVEL: number = 19
        tile bound에 parentKey를 넣을지 가르는 기준 최대 level이다. `_maxlevel`이 이 값이면 parentKey를 넣지 않는다.
    SIMPLE_HIDDEN_DASH_SIZE: number = 1
    SIMPLE_HIDDEN_DASH_GAP: number = 1
        simple 가림면 외곽선의 점선 길이와 간격이다.
    SIMPLE_HIDDEN_MAX_OPACITY: number = 0.35
    SIMPLE_HIDDEN_MIN_OPACITY: number = 0.08
    SIMPLE_HIDDEN_OPACITY_FACTOR: number = 0.35
        가림면 불투명도를 원본에 곱한 뒤 묶어 두는 상·하한과 계수다.
    MEASURE_TILE_STROKE_PADDING_SCALE: number = 1.1
        외곽선 굵기를 tile 교차 여유로 환산할 때 곱하는 계수다.
    MEASURE_HIGHLIGHT_STROKE_SCALE: number = 1.35
        강조 상태 feature의 외곽선 굵기 배수다.
    MEASURE_SOURCE_FEATURE_NAMESPACE_VERSION: number = 1
    MEASURE_SOURCE_PROPERTY_SCHEMA_VERSION: number = 1
    MEASURE_SOURCE_GEOMETRY_ENCODING_VERSION: number = 1
    MEASURE_SOURCE_COLLECTION_EPOCH: number = 0
        manager에 넘기는 source identity의 고정 버전 값이다. 이 값이 달라지면 manager가 source를 다른 것으로 본다.

U3dShaderMeasureLayer extends U3dLayer 클래스 정의
    의존: UTerrainDecalCompositionOrderRegistry — 합성 순서 힌트 저장소 생성; 생성자: {new UTerrainDecalCompositionOrderRegistry()}

    static OPT_KEYS: Array<string>
        생성자 옵션 키를 카멜 표기로 정규화할 때 참조하는 키 목록이다. 부모 목록에 이 클래스 고유 키를 더한 값이며 공개 API가 아니다.

    _features: MeasureFeatureCollection = []
        이 레이어가 보관하는 측정 feature 전체다. 배열 자체에 `addFeature`·`getFeatureById` 도우미가 붙는다.
    _olFeatures: Record<string, OLFeature> = {}
        측정 feature ID로 원본 OpenLayers feature를 찾는 표다.
    _featurePoints: Record<string, Array<Vector3>> = {}
        feature UID별 측정 좌표 스냅샷이다. 라이브 배열이 아니라 feature가 확정한 사본을 보관해 payload와 같은 좌표를 보게 한다.
    _featureMap: Map<string, UMeasureFeature> = 빈 Map
        feature ID로 측정 feature를 찾는 표다.

    _measureFeature: (UMeasureFeature & {id: string | number}) | undefined = undefined
        현재 편집 중인 측정 feature 하나다. `commitFeature()`로 확정하면 undefined가 된다.
    _measurePoints: Array<Vector3> = []
        편집 중 측정 좌표를 위경도 좌표계(EPSG:4326)로 보관한다.
    _measureVectors: Array<Vector3> = []
        같은 좌표를 월드 좌표(EPSG:3857)로 변환해 보관한다. 두 배열은 같은 인덱스로 대응한다.

    _drawTiles: Map<string, Map<string, string>> = 빈 Map
        feature UID별로 `tile key → 측정 타입` 점유 목록을 보관한다.
    _drawTileKeys: Record<string, Array<U3dShaderMeasureTileBound>> = {}
        tile key별로 그 tile에 걸친 feature의 tile bound 레코드 목록을 보관한다.
    _drawFeatureIds: Record<string, Record<string, boolean>> = {}
        tile key별로 그 tile에 포함된 feature UID 집합을 보관한다. 바깥 키가 tile, 안쪽 키가 feature다.
    _featureTileRangeSignature: Record<string, string> = {}
        feature UID별로 직전에 계산한 tile 범위 signature다. 같으면 binding을 다시 만들지 않는다.
    _featureActiveTileKeys: Record<string, Set<string>> = {}
        feature UID별로 현재 화면에 떠 있는 tile key 집합이다.
    _featureTileBindingRevision: Record<string, number> = {}
        feature UID별로 binding을 만든 시점의 feature revision이다.
    _visibleTileKeys: Set<string> = 빈 Set
        이 레이어가 표시 대상으로 추적 중인 tile key 집합이다.
    _simpleFeatureKeys: Set<string> = 빈 Set
        simple 경로로 그린 feature UID 집합이다.
    _drawList: Set<string> | undefined = undefined
    _tileKeys: Array<string>
        직전 갱신에서 그릴 대상으로 정한 tile key 목록이다. 이번 갱신에서 빠진 key는 clear 대상이 된다.

    _pendingFeatureUpdates: Set<UMeasureFeature> = 빈 Set
        다음 flush에서 terrain payload에 반영할 feature 대기 집합이다.
    _isFeatureUpdateScheduled: boolean = false
        flush가 이미 예약되었는지 나타낸다. 이 값이 true로 남으면 이후 예약이 모두 조기 반환되어 갱신이 멈춘다.
    _featureUpdateEpoch: number = 0
        갱신 세대 번호다. 예약 시점과 실행 시점의 값이 다르면 그 flush는 무효로 버린다.
    _featureUpdateRetryCount: number = 0
        자동 재시도 횟수다. 1 이상이면 더 재시도하지 않는다.

    _terrainPresentationRevision: number = 0
        flush마다 증가시켜 manager의 presentation batch를 구분하는 번호다.
    _sourceRevisionStates: Map<string, U3dShaderMeasureSourceRevisionState> = 빈 Map
        tile key별 `{signature, revision}` 상태다. signature가 같으면 revision을 올리지 않는다.
    _drawSequenceCounter: number = 0
        feature draw 순서로 발급할 다음 단조 증가 값이다.

    _measureGeometryMode: U3dShaderMeasureGeometryMode
        현재 렌더링 방식이다. 생성자에서 `measureGeometryMode` 옵션이 있으면 그 값으로, 없으면 `useSimpleMeasure`가 true일 때 `'auto'`, false일 때 `'basic'`으로 정한다.
    _useSimpleMeasure: boolean = true
        예전 방식 옵션 값이다. `measureGeometryMode`를 함께 주면 그쪽이 우선한다.
    _measureType: string = UDEF.MEASURE_TYPE.LINESTRING
        다음에 만들 측정 feature의 geometry 종류다.
    _srs: string = 'EPSG:3857'
        측정 feature에 기록하는 좌표계 이름이다. `#getExtent()`의 분기 조건으로도 쓰인다.
    _tension: number = 0
        LineString 측정에 쓰는 Catmull-Rom 곡선 장력이다.
    _minlevel: number = 12
    _maxlevel: number = 19
        tile binding을 만들 level 범위의 기본값이다.
    _maxReadyLevel: number = 17
    _version: string = '2.0'
    _preserveTileRequestsOnHide: boolean = false
        숨김 전환 구간에만 true가 되어 `cancelAllTile()`이 요청 취소를 건너뛰게 한다.
    _initialized: boolean
    _disposed: boolean

    _style: U3dShaderMeasureLayerRenderStyle
        레이어 기준 렌더 스타일이다. 생성자에서 기본 색·굵기·불투명도로 채운다.
    _defaultFillColor: Color
    _defaultStrokeColor: Color
    _defaultStrokeWidth: number = 1
    _defaultOpacity: number = 1.0
        `resetStyle()`이 되돌릴 기준값이자 스타일 해석의 최종 fallback이다.
    _guideFillColor: number = 0x550066
    _guideStrokeColor: number = 0xffffff
    _guideStrokeWidth: number = 0.5

    _simpleGeometryLengthThreshold: number = 5000
    _simpleGeometryLineMaxPoints: number = 512
    _simpleGeometryCircleSegments: number = 64
        simple 경로의 정점 수·분할 수 상한이다.

    _terrainDebugEnabled: boolean = false
    _terrainDebugTileFilter: string | Array<string> | Set<string> | U3dShaderMeasureTerrainDebugFilter | undefined
        디버그 로그 사용 여부와 대상 tile 조건이다.

    _materialCache: UCache
        `측정타입:tile키` 키로 tile 재질을 보관한다.
    _shaderTemplateCache: Map<string, Material>
    _shaderMaterialManager: UShaderMaterialManager | undefined
        `initialize()`에서 없을 때만 생성하며 두 캐시를 공유한다.
    _terrainDecalManager: UShaderTerrainDecalManager | undefined
        앱이 공유하는 decal manager다. `initialize()`에서 앱에서 받아 온다.
    _compositionOrderRegistry: UTerrainDecalCompositionOrderRegistry
        feature의 최초 등록 순서 힌트를 만드는 레이어 소유 저장소다.

    constructor(opt: U3dShaderMeasureLayerCO = {})
        역할: 측정 상태, tile binding 표, 스타일 기준값과 렌더링 방식을 초기화한다.
        인터페이스: opt는 소문자 별칭도 허용하며 생성자 안에서 카멜 표기로 정규화한다.
        처리 기준:
            부모 생성자와 이 생성자가 같은 정규화 결과를 보아야 하므로 정규화를 super 호출보다 먼저 수행한다.
            `renderOrder`를 주지 않으면 소문자 별칭 `renderorder`를, 그것도 없으면 `UDEF.RENDER_ORDER.MEASURE`를 적용한다.
        의존:
            UDEF — 기본 렌더 순서·레이어 종류·측정 종류 상수; 상수: {RENDER_ORDER.MEASURE, LAYER_TYPE.MEASURE, MEASURE_TYPE.LINESTRING, PROCESS.TYPE.MEASURE}
            normalizeOptionKeys — 옵션 키 표기 정규화; 함수: {normalizeOptionKeys()}
            defaultValue — 옵션 기본값 적용; 함수: {defaultValue()}
            three — 기본 색상 객체 생성; 생성자: {new Color()}
            UMercator — tile 좌표 변환기 생성; 생성자: {new UMercator()}
            UCache — 재질 캐시 생성; 생성자: {new UCache()}
            UCheckTime — 시간 측정기 생성; 생성자: {new UCheckTime()}
            UTerrainDecalCompositionOrderRegistry — UTerrainDecalCompositionOrderRegistry 사용; 생성자: {new UTerrainDecalCompositionOrderRegistry()}
            THREE — THREE 사용; 생성자: {new Color()}
        동작:
            옵션 키를 카멜 표기로 정규화하고 렌더 순서 기본값을 채운 사본으로 부모 생성자를 호출한다.
            레이어 종류·확장자·축 반전·갱신 큐 크기와 좌표계 이름을 옵션에서 읽어 저장한다.
            feature 목록과 원본 feature 표를 비우고 feature 목록에 source 도우미를 연결한다.
            편집 좌표 두 벌과 tile binding 표, 표시 추적 집합을 빈 값으로 만든다.
            채움·외곽선 색을 Color 객체로 바꿔 기본값으로 두고 그 값으로 레이어 스타일을 구성한다.
            `measureGeometryMode` 옵션이 있으면 정규화해 쓰고, 없을 때만 `useSimpleMeasure`가 true이면 `'auto'`, false이면 `'basic'`으로 정한다.
            simple 경로의 정점 수 상한들과 갱신 대기 상태, revision 상태를 초기값으로 둔다.

    스타일과 렌더 순서 책임 그룹
        역할: 레이어 단위 또는 feature 단위 스타일을 바꾸고 그 결과를 terrain payload 갱신 대기에 올린다.

        override setOpacity(val: number) -> void
            역할: 레이어 전체 불투명도를 바꾼다.
            처리 기준: 채움·외곽선 불투명도를 같은 값으로 함께 덮어쓴다. feature 상태는 즉시 바뀌고 terrain 반영은 다음 flush로 미뤄진다.
            동작:
                입력 값을 레이어 스타일의 전체·채움·외곽선 불투명도에 모두 저장한다.
                같은 세 값을 override로 모든 feature에 합성해 적용한다.
                전체 feature를 갱신 대기에 올린다.

        override setRenderOrder(val: number) -> void
            역할: 렌더 순서를 simple 객체와 terrain source 양쪽에 반영한다.
            처리 기준: 값이 바뀌지 않았으면 부모 처리만 하고 아무것도 더 하지 않는다.
            의존:
                U3dLayer — 이전 값 조회와 기본 반영; 함수: {getRenderOrder(), setRenderOrder()}; 속성 읽기: {_cache, _app}
                UShaderTerrainDecalManager — source 렌더 순서 반영; 함수: {setTerrainSourceRenderOrder()}
                UCache — simple 객체 조회; 함수: {get()}
                three — 하위 객체까지 순서 전파; 함수: {traverse()}
                U3dApp — 화면 갱신 요청; 함수: {changeUpdate()}
            동작:
                이전 렌더 순서를 먼저 읽고 부모 구현으로 값을 반영한 뒤, 값이 그대로면 종료한다.
                simple 경로 feature마다 캐시 객체를 찾아 자신과 모든 하위 객체의 렌더 순서를 새 값으로 바꾼다.
                기본 source 키에 새 렌더 순서를 알린다.
                화면 갱신을 요청한다.

        setStyle(opt: U3dShaderMeasureLayerStyle) -> void
            역할: 레이어 기준 스타일을 바꾸고 모든 feature에 합성한다.
            처리 기준: 옵션이 없거나 이미 정리된 레이어이면 아무 상태도 바꾸지 않는다.
            의존:
                U3dLayer — 기반 클래스가 소유한 폐기 표시 확인; 속성 읽기: {_disposed}
            동작:
                입력을 override 형태로 정규화한다.
                feature 없이 override만으로 레이어 스타일을 다시 계산해 기존 스타일에 덮어쓴다.
                같은 override를 모든 feature에 합성해 적용한다.
                전체 feature를 갱신 대기에 올린다.

        setFeatureStyle(featureOrFeatures: U3dShaderMeasureFeatureStyleTarget, style: U3dShaderMeasureLayerStyle) -> void
            역할: 지정한 feature에만 부분 스타일을 적용한다.
            처리 기준:
                대상이나 스타일이 없거나 이미 정리된 레이어이면 아무 상태도 바꾸지 않는다.
                대상 중 `UMeasureFeature`가 아닌 항목은 조용히 걸러 내고, 남은 것이 없으면 아무 일도 하지 않는다.
            의존:
                U3dLayer — 정리 여부 확인; 속성 읽기: {_disposed}
            동작:
                대상을 배열로 맞추고 `UMeasureFeature`만 남긴다.
                입력 스타일을 override 형태로 정규화한다.
                feature마다 최종 스타일을 계산해 적용하고 스타일 revision을 올린다.
                대상이 둘 이상이면 즉시 반영을 요청하고, 하나면 갱신 대기에 올린다.

        resetStyle() -> void
            역할: 레이어 스타일을 생성자 기본값으로 되돌린다.
            의존:
                THREE — THREE 사용; 생성자: {new Color()}
            동작:
                기본 채움·외곽선 색을 새 Color 객체로 만들어 레이어 스타일에 넣고 굵기와 세 불투명도를 기본값으로 되돌린다.
                되돌린 레이어 스타일을 그대로 override로 삼아 모든 feature에 합성한다.
                전체 feature를 갱신 대기에 올린다.

    feature 갱신 배치 책임 그룹
        역할: 같은 task에서 일어난 여러 feature 변경을 한 번의 terrain payload 갱신으로 합치고 실패를 한 번만 재시도한다.
        관련 상태: _pendingFeatureUpdates, _isFeatureUpdateScheduled, _featureUpdateEpoch, _featureUpdateRetryCount

        commitFeatureUpdate(featureOrFeatures?: U3dShaderMeasureFeatureStyleTarget) -> Promise<boolean>
            역할: 대기 중인 변경과 전달한 feature를 즉시 반영하고 성공 여부를 알린다.
            인터페이스: 반환 Promise는 terrain payload 동기화까지 마친 결과다. 이미 정리되었거나 숨겨진 레이어에서는 false로 이행한다.
            처리 기준: 세대 번호를 올려 앞서 예약된 flush를 무효로 만들고 재시도 횟수를 0으로 되돌린다.
            의존:
                U3dLayer — 정리 여부 확인; 속성 읽기: {_disposed}
            동작:
                정리·숨김 상태이면 false로 이행하는 Promise를 돌려준다.
                전달한 대상 중 `UMeasureFeature`만 대기 집합에 넣는다.
                세대 번호를 올리고 예약 플래그와 재시도 횟수를 초기화한다.
                대기 집합을 즉시 반영한 결과를 돌려준다.

        #scheduleFeatureUpdate(features: Array<UMeasureFeature> = [], isRetry: boolean = false) -> void
            역할: 변경 대상을 대기 집합에 모으고 flush를 한 번만 예약한다.
            처리 기준:
                재시도 호출이 아니면 재시도 횟수를 0으로 되돌린다.
                대기 집합이 비었거나 이미 예약되어 있으면 새로 예약하지 않는다.
            의존:
                Web API — flush 예약; 함수: {queueMicrotask(), requestAnimationFrame()}
                U3dLayer — 정리 여부 확인; 속성 읽기: {_disposed}
            동작:
                `_disposed`가 참이면 아무것도 하지 않는다.
                `_disposed`가 거짓이면 아래를 수행한다.
                    전달한 대상 중 `UMeasureFeature`만 대기 집합에 넣는다.
                    예약 플래그를 세우고 현재 세대 번호를 포착한다.
                    `queueMicrotask`를 쓸 수 있으면 그것으로, 없으면 `requestAnimationFrame`으로, 그마저 없으면 Promise microtask로 flush를 예약한다.

        #flushPendingFeatureUpdates(updateEpoch: number) -> void
            역할: 예약된 시점에 대기 feature를 실제로 반영하고 실패하면 재시도로 넘긴다.
            처리 기준:
                세대가 바뀌어 이 flush가 무효가 되어도 예약 플래그는 반드시 먼저 되돌린다. 남기면 이후 예약이 모두 조기 반환되어 갱신이 영구히 멈춘다.
                정리·숨김 상태이면 대기 집합을 버리고 끝낸다.
            의존:
                U3dLayer — 정리 여부 확인; 속성 읽기: {_disposed, _app}
            동작:
                예약 플래그를 먼저 내리고, 세대가 바뀌었으면 그대로 끝낸다.
                대기 집합을 꺼내 비우고, 대상이 없으면 끝낸다.
                대상 전체로 렌더 갱신을 수행한다.
                이어서 보이는 tile의 payload를 맞추고 화면 갱신을 요청해 성공 여부를 만든다. 세대가 바뀌었거나 예외가 나면 실패로 본다.
                성공이면 재시도 횟수를 0으로 되돌리고, 실패이면 재시도 경로로 넘긴다.

        #commitPendingFeatureUpdates() -> Promise<boolean>
            역할: 대기 feature를 예약 없이 그 자리에서 반영한다.
            처리 기준: 정리·숨김 상태이면 false, 대기 대상이 없으면 true로 이행한다.
            의존:
                U3dLayer — 정리 여부 확인; 속성 읽기: {_disposed, _app}
            동작:
                대기 집합을 꺼내 비운다.
                대상 전체로 렌더 갱신을 수행하고 이어서 보이는 tile payload를 맞춘 뒤 화면 갱신을 요청한다.
                어느 단계에서든 예외가 나면 false로 이행한다.

        #retryPendingFeatureUpdates(features: Array<UMeasureFeature>, updateEpoch: number) -> void
            역할: 실패한 대상과 그 사이 새로 들어온 대상을 함께 보존하고 한 번만 다시 예약한다.
            처리 기준: 재시도는 한 번만 한다. 두 번째 실패부터는 대기 집합에 남겨 두고 다음 변경이나 명시적 commit을 기다린다.
            의존:
                U3dLayer — 정리 여부 확인; 속성 읽기: {_disposed}
            동작:
                정리·숨김 상태이거나 세대가 바뀌었으면 아무것도 하지 않는다.
                기존 대기 집합을 따로 잡아 두고 새 집합을 만들어 실패 대상을 먼저 넣은 뒤 그 사이 들어온 대상을 이어 넣는다.
                재시도 횟수가 이미 1 이상이면 다시 예약하지 않고 끝낸다.
                재시도 횟수를 올리고 재시도 표시와 함께 flush를 예약한다.

        createUserTexture(features?: Array<UMeasureFeature>, startLevel: number = this._minlevel, endLevel: number = this._maxlevel) -> undefined
            역할: feature마다 렌더 경로를 정해 simple 객체나 tile binding을 다시 배치하고 영향받은 tile을 한 번에 반영한다.
            인터페이스: features를 생략하면 레이어의 전체 feature를 대상으로 한다. 반환값은 항상 undefined다.
            처리 기준:
                앱이나 draw 인자가 없거나 대상 feature가 하나도 없으면 아무 상태도 바꾸지 않는다.
                tile 범위 signature가 같고 binding이 남아 있으면 binding을 다시 만들지 않는다.
                경계 상자가 같아도 형상 revision이 다르면 signature가 달라져 binding을 다시 만든다.
            의존:
                three — feature 중심 좌표 계산; 생성자: {new Vector3()}
                UMeasureFeature — 범위·revision 조회; 함수: {getExtent(), getRevision(), getGeometryRevision(), getType()}
                UShaderTerrainDecalManager — 변경 tile 일괄 반영과 진행 보장; 함수: {flushTileUpdates(), ensureTileProgress()}
                UCache — 빠진 tile의 캐시 항목 제거; 함수: {delete()}
                U3dLayer — 앱 갱신 요청과 공유 manager 조회; 속성 읽기: {_app, _drawArg, _cache}
                defined — defined 사용; 함수: {defined()}
            동작:
                대상 feature를 정하고 tile binding 표들이 비어 있으면 빈 값으로 만든다.
            현재 렌더링 방식을 확정해 feature 순회 전체에 같은 값을 적용한다.
                직전 그리기 목록을 사본으로 잡아 두고 이번에 flush·clear할 tile key 집합을 준비한다.
                feature마다 OpenLayers feature이면 레이어가 관리하는 측정 feature로 바꾸고, 측정 feature가 아니면 건너뛴다.
                현재 방식이 아닌 이전 경로의 소유물을 먼저 정리하고 그 과정에서 바뀐 tile을 flush 대상에 모은다.
                simple 경로로 처리되면 그 feature는 여기서 끝낸다.
                feature 범위의 중심으로 외곽선 여유값을 구하고, 그 여유를 반영한 level별 tile 범위와 형상 revision을 합쳐 signature를 만든다.
                signature가 직전과 같고 binding이 남아 있으면 점유 tile의 재질을 변경 표시하고, 화면에 떠 있는 tile을 활성 목록에 다시 넣은 뒤 증분 동기화만 수행하고 다음 feature로 넘어간다.
                signature가 달라졌으면 직전 점유 tile 중 표시 중이던 것을 기억한 뒤 payload를 교체 사유로 제거하고 binding을 지운다.
                새 signature와 revision을 기록하고 level 범위를 돌며 binding을 다시 만든 다음, 기억해 둔 tile을 표시 목록에 되돌린다.
                새 binding 기준으로 payload를 추가 또는 교체로 동기화하고 바뀐 tile을 모은다.
                binding이 하나라도 바뀌었으면 tile key 목록과 그리기 목록을 새로 만든다.
                직전 그리기 목록에만 있던 tile은 manager에 남은 feature가 있으면 건너뛰고, 없으면 clear 대상에 넣고 표시 목록과 캐시에서 지운다.

                binding이 바뀌었으면 그리기 목록의 tile 재질을 모두 변경 표시한다.
                clear 대상을 먼저 정리한다.
                flush 대상과 clear 대상을 합쳐 하나라도 있으면 presentation batch revision을 올려 한 번에 반영하고, tile마다 진행을 보장한다.

        #transitionFeatureRenderOwnership(feature: UMeasureFeature, nextMode: U3dShaderMeasureGeometryMode) -> {isTileBindingsChange: boolean, changedTileKeys: Array<string>}
            역할: 렌더 방식이 바뀔 때 이전 경로가 남긴 객체와 payload를 먼저 걷어 낸다.
            인터페이스: 반환값은 tile binding이 바뀌었는지와 그 과정에서 영향받은 tile key 목록이다.
            처리 기준: feature나 UID가 없으면 변경 없음으로 답한다. tile 소유를 떠날 때는 manager payload를 먼저 지워야 전환 중 잔상이 남지 않는다.
            동작:
                다음 방식이 simple이 아닌데 simple 객체가 남아 있으면 그 객체를 지우고 목록에서 뺀다.
                다음 방식이 basic이 아닌데 tile binding이 있으면 점유 tile을 모아 payload를 방식 전환 사유로 제거하고 binding을 지운다.
                다음 방식이 basic이 아니면 signature·활성 tile·binding revision 기록도 함께 지운다.

        #renderFeatureNonTilePath(feature: UMeasureFeature, activeMode: U3dShaderMeasureGeometryMode) -> boolean
            역할: simple 방식일 때 tile을 거치지 않고 바로 mesh를 만든다.
            인터페이스: simple 경로에서 처리했으면 true, 아니면 false를 돌려준다.
            동작:
                feature나 방식이 없으면 false를 돌려준다.
                방식이 simple이면 mesh를 만들어 scene에 올리고 simple 목록에 UID를 넣은 뒤 true를 돌려준다.
                그 밖에는 false를 돌려준다.

        override update(drawArg: UDrawArg) -> void
            역할: 프레임마다 feature가 하나도 없는 상태를 감지해 남은 scene 객체를 비운다.
            처리 기준: 숨김 상태이거나 draw 인자가 없으면 아무것도 하지 않는다. feature가 있으면 이 함수는 아무 일도 하지 않는다.
            의존:
                UCache — 남은 캐시 전체 삭제; 함수: {deleteAll()}
                UGroup — scene 그룹 비우기; 함수: {clear()}
                U3dLayer — scene 그룹 구성 변경; 속성 읽기: {_group, _cache}
                defined — defined 사용; 함수: {defined()}
            동작:
                `_visible`이 참이고 draw 인자가 있을 때, feature 목록이 비었는데 scene 그룹에 자식이 남아 있으면 캐시를 모두 지우고 그룹을 비운다.

    측정 입력과 편집 책임 그룹
        역할: 위경도 좌표 입력을 받아 편집 중 측정 feature 하나를 만들고 갱신한다.
        관련 상태: _measureFeature, _measurePoints, _measureVectors, _measureType

        setMeasurePoints(points: Array<Vector3Like>, isUpdate: boolean = true) -> (UMeasureFeature & {id: string | number}) | undefined
            역할: 편집 좌표 전체를 새 목록으로 교체한다.
            인터페이스: points는 위경도 좌표계(EPSG:4326) 목록이다. isUpdate가 false이면 feature만 갱신하고 렌더 갱신 예약은 하지 않는다.
            처리 기준: 배열이 아닌 입력은 빈 목록으로 취급한다. 월드 좌표 배열은 입력마다 새로 만들어 두 배열의 인덱스를 맞춘다.
            의존:
                UDrawArg — 위경도를 월드 좌표로 변환; 함수: {getGeographicToWorld()}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
            동작:
                입력을 복사해 위경도 좌표 목록으로 두고 월드 좌표 목록을 비운다.
                좌표마다 월드 좌표로 변환해 월드 목록에 넣는다.
                편집 feature를 만들거나 갱신한 결과를 돌려준다.

        addMeasurePoint(geo: Vector3Like | GeoPosition) -> (UMeasureFeature & {id: string | number}) | undefined
            역할: 편집 중 측정에 지점 하나를 덧붙인다.
            인터페이스: geo는 위경도 좌표계(EPSG:4326) 지점이다.
            의존:
                three — 입력 좌표 보관용 벡터 생성; 생성자: {new Vector3()}
                UDrawArg — 위경도를 월드 좌표로 변환; 함수: {getGeographicToWorld()}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
                THREE — THREE 사용; 생성자: {new Vector3()}
            동작:
                두 좌표 목록이 없으면 빈 배열로 만든다.
                입력 좌표를 위경도 목록에, 변환한 월드 좌표를 월드 목록에 각각 덧붙인다.
                편집 feature를 갱신한 결과를 돌려준다.

        updateLastPosition(position: Vector3) -> UMeasureFeature | undefined
            역할: 편집 중 측정의 마지막 지점을 월드 좌표(EPSG:3857)로 옮긴다.
            인터페이스: 위경도 좌표로 옮기려면 `updateLastPoint()`를 쓴다.
            의존:
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
            동작:
                두 좌표 목록이 없으면 빈 배열로 만들고 각 목록의 마지막 자리를 정한다.
                월드 좌표 목록의 마지막 자리를 입력 좌표로 바꾸고, 대응하는 위경도 좌표도 함께 맞춘다.
                편집 feature를 갱신한 결과를 돌려준다.

        updateLastPoint(geo: GeoPosition) -> UMeasureFeature | undefined
            역할: 편집 중 측정의 마지막 지점을 위경도 좌표로 옮긴다.
            의존:
                UDrawArg — 위경도를 월드 좌표로 변환; 함수: {getGeographicToWorld()}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
            동작: 입력 위경도를 월드 좌표로 바꿔 월드 좌표 경로에 그대로 넘긴다.

        #updateFeature(isUpdate: boolean = true) -> (UMeasureFeature & {id: string | number}) | undefined
            역할: 현재 편집 좌표로 측정 feature를 새로 만들거나 기존 feature의 geometry 상태를 갱신한다.
            처리 기준: 좌표로 geometry를 만들 수 없으면 아무 상태도 바꾸지 않는다. 좌표 스냅샷은 라이브 배열이 아니라 feature가 확정한 값을 보관한다.
            의존: UMeasureFeature — 기존 feature의 typed geometry 갱신; 함수: {applyTypedMeasureData(), getExtent(), getGeometry(), getMeasureVectors(), getType(), getId()}
            동작:
                현재 좌표로 feature 후보를 만들고, 만들지 못하면 끝낸다.
                편집 중 feature가 없으면 후보에 id를 붙여 편집 feature로 삼고 feature 목록에 넣는다.
                이미 있으면 후보의 범위·geometry·좌표·타입만 기존 편집 feature에 적용한다.
                합성 순서와 draw sequence를 확정한다.
                feature가 확정한 좌표를 UID별 스냅샷으로 보관한다.
                isUpdate가 true이면 이 feature를 갱신 대기에 올린다.

        #createGeom() -> UMeasureFeature | undefined
            역할: 현재 측정 타입에 맞는 three.js geometry와 OpenLayers geometry를 함께 만들어 측정 feature로 포장한다.
            처리 기준:
                월드 좌표 목록은 얕은 사본으로 떠서 넘긴다. 라이브 배열을 그대로 넘기면 terrain payload가 나중에 직렬화할 때 다른 형상이 섞인다.
                LineString은 좌표가 3개를 넘으면 catmullrom, 그 이하면 chordal 곡선을 쓴다.
                PointBuffer 반경이 1 미만이면 0.00001로 바꾼다.
                지원하지 않는 측정 타입이면 아무것도 만들지 않는다.
            의존:
                three — 곡선·도형·원 geometry 생성; 생성자: {new CatmullRomCurve3(), new Shape(), new Vector2(), new CircleGeometry()}; 함수: {distanceTo()}
                OpenLayers — 평면 geometry 생성과 좌표계 변환; 생성자: {new ol.geom.LineString(), new ol.geom.Polygon(), new ol.geom.Circle()}; 함수: {transform()}
                UDEF — 측정 종류 상수; 상수: {MEASURE_TYPE.{LINESTRING, POLYGON, POINTBUFFER}}
                UMeasureFeature — 결과 feature 생성; 생성자: {new UMeasureFeature()}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
                THREE — THREE 사용; 생성자: {new CatmullRomCurve3(), new CircleGeometry(), new Shape()}
            동작:
                월드 좌표 목록의 사본과 위경도 좌표의 2차원 배열을 만든다.
                LineString이면 Catmull-Rom 곡선과 OpenLayers LineString을, Polygon이면 Shape와 Polygon을, PointBuffer이면 첫 점과 끝 점 거리로 원 geometry와 OpenLayers Circle을 만든다.
                three.js geometry가 만들어지지 않았으면 끝낸다.
                그 geometry로 평면 범위를 계산하고 OpenLayers geometry를 위경도에서 월드 좌표로 변환한다.
                변환한 geometry로 OpenLayers feature를 만들고, 식별자가 있고 아직 등록되지 않았으면 원본 feature 표에 넣는다.
                좌표 사본·범위·타입·좌표계를 담은 측정 feature를 만들어 돌려준다.

        #getExtent(geom: object) -> Box3 | undefined
            역할: 현재 측정 좌표를 감싸는 월드 좌표(EPSG:3857) 평면 범위를 만든다.
            처리 기준:
                좌표가 하나도 없으면 범위를 만들지 않는다.
                PointBuffer는 원 geometry의 정점 범위에 중심 좌표를 더해 월드 좌표로 바꾼다.
                그 밖의 타입은 `_srs`가 `'EPSG:3857'`일 때만 좌표를 변환해 범위를 넓힌다. 다른 값이면 범위가 갱신되지 않아 무한대 경계가 그대로 반환된다. [확인 Q-002]
            의존:
                three — 범위 상자 구성; 생성자: {new Box3(), new Vector3()}; 함수: {setFromBufferAttribute(), set()}
                UMathEngine — 위경도를 월드 좌표로 변환; 정적 함수: {getGeographicToGoogle()}
                UDrawArg — 월드 좌표를 지도 좌표로 변환; 함수: {getWorldToGoogle()}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
                THREE — THREE 사용; 생성자: {new Box3(), new Vector3()}
            동작:
                PointBuffer이면 원 geometry의 정점에서 범위를 잡고 중심 좌표를 더한 뒤 최소·최대점을 각각 변환해 돌려준다.
                그 밖에는 좌표계가 맞을 때만 좌표를 변환하며 최소·최대를 갱신하고 그 값으로 상자를 만들어 돌려준다.

        commitFeature() -> UMeasureFeature | undefined
            역할: 편집 중 측정을 확정하고 편집 상태를 비운다.
            인터페이스: 확정한 feature를 돌려준다. 확정해도 feature 목록에서 빠지지는 않는다.
            동작: 편집 feature를 꺼내 두고 편집 feature와 두 좌표 목록을 비운 뒤 꺼낸 feature를 돌려준다.

        clearDrawFeature() -> void
            역할: 편집 중 측정을 레이어에서 지우고 편집 좌표도 비운다.
            처리 기준: 편집 중 feature가 없으면 아무 일도 하지 않는다.
            의존:
                defined — defined 사용; 함수: {defined()}
            동작: 편집 feature를 레이어에서 제거하고 편집 feature와 두 좌표 목록을 비운다.

        getMeasureFeature() -> UMeasureFeature | undefined
            인터페이스: 반환은 현재 편집 중인 측정 feature다.
            동작: 편집 중 feature 속성을 그대로 돌려준다.

        getMeasureVectors() -> Array<Vector3>
            인터페이스: 반환은 편집 중 측정의 월드 좌표(EPSG:3857) 목록이다.
            동작: 월드 좌표 목록 속성을 그대로 돌려준다.

        setMeasureType(type: string) -> void
            역할: 다음에 만들 측정 feature의 geometry 종류를 정한다.
            동작: 입력 종류를 측정 타입 속성에 저장한다.

        setFeaturePoints(uid: string, vectors: Array<Vector3>) -> void
            역할: UID로 찾은 feature의 좌표를 통째로 교체한다.
            처리 기준: feature가 없거나 그 UID의 좌표 스냅샷이 없으면 아무 상태도 바꾸지 않는다.
            의존: UMeasureFeature — 좌표·revision 갱신; 함수: {getRevision(), getGeometry(), getMeasureVectors(), setMeasureVectors()}
            동작:
                UID로 feature를 찾고 좌표 스냅샷이 없으면 끝낸다.
                교체 전 revision을 기억하고, geometry가 좌표 설정을 지원하면 먼저 좌표를 넣는다.
                geometry setter가 좌표와 revision을 이미 함께 갱신했는지 확인해, 반영되지 않았을 때만 feature에 좌표를 직접 설정한다.
                UID별 좌표 스냅샷을 새 좌표로 바꾼다.

    feature 등록과 제거 책임 그룹
        역할: 외부에서 들어온 OpenLayers·측정 feature를 레이어 목록에 편입하고, 제거할 때 렌더 자원과 terrain payload를 함께 정리한다.

        #initSourceFeature() -> void
            역할: feature 배열에 source 호환 도우미를 붙인다.
            처리 기준: 이 도우미는 생성자와 정리 경로에서 붙이므로, 붙기 전에는 배열로만 쓸 수 있다.
            동작:
                `_features`가 없으면 끝낸다.
                `_features`가 있으면 아래를 수행한다.
                    배열에 추가 함수를 붙이고, 그 함수는 등록 결과가 없으면 예외를 던진다.
                    배열에 ID 조회 함수를 레이어에 바인딩해 붙인다.

        #sourceAddFeature(feature: OLFeature | UMeasureFeature) -> OLFeature | UMeasureFeature | undefined
            역할: 입력 feature를 레이어가 관리하는 측정 feature로 만들거나 기존 feature에 합쳐 목록에 편입한다.
            인터페이스: 반환은 입력 feature 그대로다. 실제 등록 결과가 아니다. [확인 Q-003]
            처리 기준:
                같은 식별자의 feature가 이미 있으면 새로 만들지 않고 기존 feature에 typed 데이터를 적용한다.
                UID가 이미 목록에 있으면 다시 넣지 않는다.
            의존:
                OpenLayers — 입력 종류 판별과 geometry 조회; 함수: {ol.Feature, ol.geom.{Polygon, LineString, Point}, getGeometry(), getExtent()}
                three — 측정 geometry 생성; 생성자: {new Shape(), new Vector2(), new Vector3(), new Box3(), new CatmullRomCurve3(), new CircleGeometry()}
                UDrawArg — 지도 좌표를 월드 좌표로 변환; 함수: {getGoogleToWorld()}
                UMeasureFeature — 측정 feature 생성·갱신; 생성자: {new UMeasureFeature()}; 함수: {applyTypedMeasureData(), applyRuntimeState(), getUid(), getExtent(), getWorldExtent(), getGeometry(), getType(), getMeasureVectors(), getId(), getOLFeature(), getProperties(), getStyle(), getNonChanged(), getExcludeSearch(), getStyleRevision(), getDrawSequence()}
                UDEF — 측정 종류 상수; 상수: {MEASURE_TYPE.{POLYGON, LINESTRING, POINTBUFFER}}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
                defined — defined 사용; 함수: {defined()}
                THREE — THREE 사용; 생성자: {new Box3(), new CatmullRomCurve3(), new CircleGeometry(), new Shape(), new Vector3()}
            동작:
                `feature`가 있으면 아래를 수행한다.
                    OpenLayers feature이면 식별자로 기존 측정 feature를 찾고, geometry의 지리 정점을 월드 좌표로 바꿔 좌표 목록을 만든다.
                    Polygon·LineString·Point 각각에 맞는 three.js geometry와 측정 타입을 정한다. Polygon은 OpenLayers 범위가 유효하면 그 값으로, 아니면 직접 계산한 범위를 쓴다.
                    기존 항목이 있으면 typed 데이터를 적용하고, 없으면 새 측정 feature를 만든다.
                    원본 feature의 스타일·변경 제외·검색 제외·순서 상태를 측정 feature에 옮긴다.
                    합성 순서와 draw sequence를 확정하고 좌표 스냅샷을 보관한 뒤, 목록에 없으면 추가하고 원본 feature 표에 등록한다.
                    측정 feature이면 같은 식별자의 기존 feature가 다른 객체일 때만 typed 데이터와 런타임 상태를 그 기존 feature에 옮겨 대상으로 삼고, 아니면 입력을 그대로 대상으로 쓴다.
                    대상의 draw sequence를 확정하고 목록에 없으면 추가한 뒤 좌표 스냅샷을 보관한다.

        #applySourceFeatureRuntimeState(feature: UMeasureFeature, sourceFeature: object) -> UMeasureFeature
            역할: 원본 feature가 들고 있던 스타일·표시 관련 런타임 상태를 측정 feature로 옮긴다.
            처리 기준: draw sequence는 원본 값이 유한수일 때만 쓰고, 아니면 대상 feature의 현재 값을 유지한다.
            의존: UMeasureFeature — 런타임 상태 일괄 적용; 함수: {applyRuntimeState(), getDrawSequence()}
            동작:
                둘 중 하나라도 없으면 대상을 그대로 돌려준다.
                원본에서 스타일·변경 제외·검색 제외·스타일 revision·draw sequence·내부 구멍 여부를 읽는다.
                대상이 측정 feature이고 일괄 적용을 지원하면 그 함수로 한 번에 넣고, 아니면 각 필드에 직접 대입한다.

        #checkOLFeature(feature: object) -> UMeasureFeature | OLFeature | undefined
            역할: OpenLayers feature를 레이어가 관리하는 측정 feature로 바꿔 준다.
            인터페이스: 대응하는 측정 feature를 찾지 못하면 입력 OpenLayers feature를 그대로 돌려준다. 둘 다 아니면 undefined다.
            의존: OpenLayers — 입력 종류 판별; 함수: {ol.Feature}
            동작:
                OpenLayers feature이면 식별자로 측정 feature를 찾아 돌려주고, 없으면 입력을 그대로 돌려준다.
                측정 feature이면 그대로, 그 밖에는 undefined를 돌려준다.

        addFeature(opt: U3dShaderMeasureLayerAddFeatureCO) -> boolean
            역할: 전달한 좌표로 만든 다각형과 편집 중 다각형을 레이어에 추가하고 두 영역이 겹치는지 확인한다.
            인터페이스: opt의 좌표는 위경도 좌표계(EPSG:4326)다. 반환은 두 다각형의 교차 여부다.
            처리 기준: 편집 중 좌표가 3개보다 적으면 다각형을 만들 수 없으므로 아무것도 추가하지 않고 false를 돌려준다.
            의존:
                OpenLayers — 벡터 소스와 다각형 구성; 생성자: {new ol.source.Vector(), new ol.geom.Polygon()}; 함수: {addFeature(), setGeometry(), changed(), getFeatures(), getGeometry(), transform()}
                JSTS(`__GEONDT__.jsts`) — 다각형 교차 판정; 생성자: {new OL3Parser(), new GeometryFactory()}; 함수: {read(), intersects()}
            동작:
                입력 좌표와 편집 중 좌표를 각각 2차원 배열로 바꿔 다각형을 만들고 위경도에서 월드 좌표로 변환한다.
                편집 중 좌표가 3개보다 적으면 false를 돌려준다.
                두 다각형을 모두 레이어에 등록한다.
                편집 중 다각형을 기준으로 입력 다각형들과 교차를 검사해 하나라도 겹치면 true, 없으면 false를 돌려준다.

        removeFeature(feature: UMeasureFeature) -> void
            역할: 측정 feature를 레이어에서 완전히 제거한다.
            처리 기준:
                feature가 없으면 아무 일도 하지 않는다.
                feature 목록이 이미 비어 있으면 simple 객체와 UID 추적만 정리하고 terrain payload 제거와 목록 정리는 하지 않는다. [확인 Q-004]
                보통은 이 메서드를 쓰고, 목록만 정리해야 할 때 `removeFeatureTarget()`을 쓴다.
            의존:
                U3dApp — 화면 갱신 요청; 함수: {changeUpdate()}
                U3dLayer — 앱 갱신 요청과 공유 manager 조회; 속성 읽기: {_app}
                defined — defined 사용; 함수: {defined()}
            동작:
                갱신 대기 집합에서 이 feature를 뺀다.
                UID별 tile 범위 signature·활성 tile·binding revision 기록을 지운다.
                simple 객체를 캐시와 scene에서 지우고 simple 목록에서도 뺀다.
                tile binding이 있으면 terrain payload를 제거 사유로 즉시 반영하고 binding을 지운다.
                feature 목록과 좌표·원본 feature 표에서도 지우고 화면 갱신을 요청한다.

        removeFeatureTarget(feature: UMeasureFeature) -> void
            역할: feature 목록과 좌표·원본 feature 표에서만 지운다.
            처리 기준: 화면에 올라간 terrain 표시 자료와 simple 객체는 그대로 남는다.
            의존: UMeasureFeature — geometry 해제; 함수: {getGeometry(), getUid(), getId()}
            동작:
                feature 목록이 비어 있으면 끝낸다.
                UID가 같은 항목을 찾아, 있으면 좌표 스냅샷과 원본 feature 표의 항목을 지우고 geometry를 해제한 뒤 목록에서 뺀다.

        clearMeasure() -> void
            역할: 모든 측정 feature와 연결된 terrain payload·캐시·scene 객체를 한 번에 비운다.
            처리 기준: `dispose()`와 달리 shader material manager와 decal manager 연결은 유지해 레이어를 계속 쓸 수 있다.
            의존:
                UShaderTerrainDecalManager — 누적 clear 즉시 반영; 함수: {flushTileUpdates()}
                UDrawArg — tile mesh의 geometry·원점 조회; 함수: {_cacheTiles.get()}
                UCache — 캐시 전체 삭제; 함수: {deleteAll()}
                UGroup — scene 그룹 비우기; 함수: {clear()}
                U3dApp — 전체 갱신 요청; 함수: {update()}
                UMeasureFeature — geometry 해제; 함수: {getGeometry()}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg, _cache, _group, _app}
            동작:
                binding 표·표시 목록·점유 목록에서 정리 대상 tile key를 모은다.
                manager와 대상 tile이 있으면 feature마다 payload를 clear 사유로 제거하고, tile마다 mesh의 geometry·원점을 넘겨 source payload를 비운 뒤, 한 번에 즉시 반영한다.
                feature의 geometry를 모두 해제한다.
                feature 목록과 원본 feature 표를 비우고 source 도우미를 다시 붙인다.
                캐시를 모두 지우고 scene 그룹을 비운다.
                편집 상태·tile binding 표·표시 목록·갱신 대기 상태를 초기값으로 되돌리고 세대 번호를 올린 뒤 전체 갱신을 요청한다.

        getFeatures() -> Array<UMeasureFeature>
            인터페이스: 반환은 레이어가 보관 중인 측정 feature 목록 자체다. 사본이 아니다.
            동작: feature 목록 속성을 그대로 돌려준다.

        getFeatureById(id: unknown) -> UMeasureFeature | undefined
            역할: feature에 부여된 ID로 측정 feature를 찾는다.
            인터페이스: feature가 스스로 갖는 내부 고유값으로 찾으려면 `getFeatureByUid()`를 쓴다. 값이 없으면 undefined를 돌려준다.
            의존:
                UMeasureFeature — ID 비교; 함수: {getId()}
                defined — defined 사용; 함수: {defined()}
            동작: 목록이 비었거나 ID가 없으면 끝내고, ID가 일치하는 첫 feature를 돌려준다.

        getFeatureByUid(uid: string | number) -> UMeasureFeature | undefined
            역할: feature 내부 고유값으로 측정 feature를 찾는다.
            동작: 목록이 비었으면 끝내고, 내부 고유값이 일치하는 첫 feature를 돌려준다.

        setOLFeatureById(fid: unknown, olFeature: OLFeature) -> void
            역할: 측정 feature에 원본 OpenLayers feature를 연결한다.
            처리 기준: 대상 feature를 찾지 못하거나 원본이 없으면 아무 상태도 바꾸지 않는다. 연결과 동시에 측정 feature의 ID를 원본 ID로 바꾼다.
            의존:
                UMeasureFeature — 측정 feature의 ID 교체와 원본 연결; 함수: {getId(), setId(), setOLFeature()}
                OpenLayers — 원본 feature의 ID 조회; 함수: {getId()}
                defined — defined 사용; 함수: {defined()}
            동작: ID가 일치하는 feature를 찾아 원본의 ID로 바꾸고 원본 feature를 연결한다.

        getOLFeatureById(fid: unknown) -> OLFeature | undefined
            역할: 측정 feature에 연결된 원본 OpenLayers feature를 돌려준다.
            의존:
                UMeasureFeature — 원본 조회; 함수: {getId(), getOLFeature()}
                defined — defined 사용; 함수: {defined()}
            동작: ID가 일치하는 feature를 찾아 연결된 원본을 돌려주고, 없으면 undefined를 돌려준다.

        convertPoints3DTo2D(points: Array<Vector3Like>) -> Array<Array<number>>
            역할: 3차원 좌표 목록에서 x, y만 뽑아 2차원 배열로 만든다.
            동작: 좌표마다 x, y 두 값을 배열로 만들어 차례로 담아 돌려준다.

    측정값 계산 책임 그룹
        역할: 측정 feature나 편집 중 좌표에서 길이·면적·반경을 계산한다.
        처리 기준: 이 그룹에는 단위가 다른 두 계열이 있다. `getFeature*` 계열은 월드 좌표(EPSG:3857) 평면 값이고, `getMeasure*` 계열은 지표 거리 기준 미터 값이다.

        getFeatureMeasureVectors(feature: UMeasureFeature) -> Array<Vector3>
            인터페이스: 반환은 그 feature의 월드 좌표(EPSG:3857) 측정 좌표다. 좌표를 얻을 수 없으면 빈 배열이다.
            의존: UMeasureFeature — 좌표 조회; 함수: {getMeasureVectors()}
            동작: feature가 좌표 조회를 지원하면 그 값을, 아니면 UID별 좌표 스냅샷을 쓰고 배열이 아니면 빈 배열을 돌려준다.

        getFeatureLineLength(feature: UMeasureFeature) -> number
            역할: feature 좌표를 차례로 이어 선 길이를 더한다.
            인터페이스: 반환은 월드 좌표(EPSG:3857) 평면 기준 길이이며 실제 지표 거리가 아니다. 좌표가 2개보다 적으면 0이다.
            처리 기준: 면 유형이면 마지막 점에서 첫 점으로 돌아오는 구간까지 더해 둘레가 된다.
            의존: UDEF — 면 유형 판별; 상수: {MEASURE_TYPE.{POLYGON, MULTIPOLYGON}}
            동작:
                좌표를 얻어 2개보다 적으면 0을 돌려준다.
                이웃한 좌표 쌍마다 평면 거리를 더한다.
                면 유형이고 좌표가 2개를 넘으면 닫는 구간의 거리도 더해 돌려준다.

        getFeaturePolygonArea(feature: UMeasureFeature) -> number
            역할: feature 좌표를 다각형으로 보고 면적을 계산한다.
            인터페이스: 반환은 월드 좌표(EPSG:3857) 평면 기준 면적이며 실제 지표 면적이 아니다. 좌표가 3개보다 적으면 0이다.
            동작: 좌표를 얻어 3개보다 적으면 0을 돌려주고, 아니면 좌표를 차례로 도는 신발끈 계산으로 넓이를 구해 절반의 절댓값을 돌려준다.

        getFeaturePointBufferRadius(feature: UMeasureFeature) -> number
            역할: 점과 반경점 두 좌표로 표현하는 원형 측정의 반경을 구한다.
            인터페이스: 반환은 월드 좌표(EPSG:3857) 평면 기준 반경이며 좌표가 2개보다 적으면 0이다.
            동작: 좌표를 얻어 2개보다 적으면 0을 돌려주고, 아니면 첫 좌표와 마지막 좌표의 평면 거리를 돌려준다.

        #calculateDistance(a: Vector3, b: Vector3) -> number
            역할: 두 월드 좌표 사이의 평면 직선거리를 구한다.
            처리 기준: z 값은 쓰지 않고 x, y만으로 계산한다. 어느 한쪽이 없으면 0이다.
            동작: 두 좌표의 x, y 차이로 직각삼각형 빗변 길이를 구해 돌려준다.

        getMeasureLength() -> number
            역할: 편집 중 측정 좌표를 이어 누적 길이를 구한다.
            인터페이스: 반환은 지표 거리 기준 미터 길이다. 편집 중 feature가 없거나 점이 2개보다 적으면 0이다.
            의존:
                UMathEngine — 지도 좌표 두 점의 지표 거리; 정적 함수: {getMeterDistanceByGooglePoints()}
                defined — defined 사용; 함수: {defined()}
            동작: 편집 feature가 없으면 0을 돌려주고, geometry의 점이 2개를 넘으면 이웃 점마다 지표 거리를 더해 돌려준다.

        getMeasureArea() -> number | undefined
            역할: 편집 중 측정의 면적을 구한다.
            인터페이스: 반환은 제곱미터 단위 면적이다. 편집 feature가 없거나 측정 타입이 LineString이면 계산하지 않는다.
            의존:
                defined — defined 사용; 함수: {defined()}
            동작: 편집 feature와 타입을 확인하고 편집 중 위경도 좌표로 면적을 계산해 돌려준다.

        getMeasureAreaByPositions(positions: Array<Vector3Like>) -> number
            역할: 주어진 위경도 좌표 목록만으로 면적을 계산한다.
            인터페이스: 반환은 제곱미터 단위 면적이며 좌표가 3개보다 적으면 0이다.
            의존: UMathEngine — 좌표 변환과 지표 면적; 정적 함수: {getGeographicToGoogle(), getMeterAreaByGooglePoints()}
            동작: 좌표가 3개보다 적으면 0을 돌려주고, 위경도를 지도 좌표로 바꾼 뒤 지표 면적을 구해 돌려준다.

        getSelectedArea() -> number | undefined
            역할: 편집 중 측정 geometry를 구면으로 보고 면적을 구한다.
            인터페이스: 대상은 `getMeasureArea()`와 같은 편집 중 feature이지만 계산 방식이 달라 값이 완전히 같지는 않다. 편집 feature가 없으면 undefined다.
            의존:
                OpenLayers — 구면 면적 계산; 정적 함수: {ol.Sphere.getArea()}
                defined — defined 사용; 함수: {defined()}
            동작: 편집 feature가 없으면 끝내고, 그 geometry의 구면 면적을 돌려준다.

        getTextPositionToMeasureArea() -> Vector3 | undefined
            역할: 면적 측정 결과 문구를 표시할 위경도 좌표를 정한다.
            처리 기준: Polygon은 곡선이 없으면 현재 점을, 곡선과 좌표가 모두 있으면 좌표 전체의 중심을 쓴다. PointBuffer는 첫 좌표를 쓴다. 그 밖의 타입에는 위치를 주지 않는다.
            의존:
                three — 중심 계산; 생성자: {new Vector3(), new Box3()}; 함수: {setFromPoints(), getCenter()}
                U3dApp — 월드 좌표를 위경도로 변환; 함수: {vector3ToGeoGraphic()}
                UDEF — 측정 종류 상수; 상수: {MEASURE_TYPE.{POLYGON, POINTBUFFER}}
                U3dLayer — 앱 갱신 요청과 공유 manager 조회; 속성 읽기: {_app}
                defined — defined 사용; 함수: {defined()}
                THREE — THREE 사용; 생성자: {new Box3(), new Vector3()}
            동작:
                편집 feature가 없으면 끝낸다.
                Polygon이고 곡선이 없으면 geometry의 현재 점을 위경도로 바꿔 돌려준다.
                Polygon이고 곡선과 월드 좌표가 있으면 좌표 전체를 감싸는 상자의 중심을 위경도로 바꿔 돌려준다.
                PointBuffer이면 첫 좌표를 위경도로 바꿔 돌려준다.

        getMeasureExtents() -> Array<UFeatureIDExtent> | undefined
            역할: 모든 측정 feature의 범위를 ID와 함께 모은다.
            인터페이스: 범위를 가진 feature가 하나도 없으면 undefined다.
            의존:
                UMeasureFeature — 범위 조회; 함수: {getExtent()}
                defined — defined 사용; 함수: {defined()}
            동작: feature마다 범위를 읽어 있는 것만 UID와 짝지어 담고, 하나도 없으면 undefined를 돌려준다.

        getMeasureExtent() -> undefined
            역할: 이전 버전과의 호환을 위해 이름만 남겨 둔 측정 영역 조회 메서드다.
            인터페이스: 본문이 모두 주석 처리되어 있어 어떤 경우에도 undefined만 돌아온다. 영역이 필요하면 `getMeasureExtents()`를 쓴다.
            동작: 아무 계산도 하지 않고 undefined를 돌려준다.

        getExtent() -> undefined
            역할: 이전 버전과의 호환을 위해 이름만 남겨 둔 전체 영역 조회 메서드다.
            인터페이스: 본문이 모두 주석 처리되어 있어 어떤 경우에도 undefined만 돌아온다.
            동작: 아무 계산도 하지 않고 undefined를 돌려준다.

    simple 렌더링 책임 그룹
        역할: tile을 거치지 않고 측정 도형을 three.js mesh로 직접 만들어 scene 그룹에 넣는다.
        관련 상태: _simpleFeatureKeys, _cache, _group

        #drawSimpleFeature(feature: UMeasureFeature) -> void
            역할: 측정 타입에 맞는 simple 객체를 만들어 캐시와 scene 그룹에 등록한다.
            처리 기준:
                같은 UID의 기존 객체를 먼저 지워 중복 등록을 막는다. 이 제거는 좌표가 없어 중단되는 경우에도 이미 수행된 뒤다.
                좌표가 하나도 없거나 지원하지 않는 타입이면 새 객체를 만들지 않는다.
            의존:
                UMeasureFeature — 타입·좌표 조회; 함수: {getType(), getMeasureVectors()}
                UDEF — 측정 종류 상수; 상수: {MEASURE_TYPE.{LINESTRING, POLYGON, POINTBUFFER}}
                three — 하위 객체 순회; 함수: {traverse()}
                UGroup — scene 그룹 등록; 함수: {add()}
                UCache — 객체 보관; 함수: {add()}
                U3dLayer — 레이어 캐시 항목 조회와 삭제; 속성 읽기: {_cache, _group, _name, _renderOrder}
                defined — defined 사용; 함수: {defined()}
            동작:
                UID가 없으면 끝내고, 기존 simple 객체를 먼저 지운다.
                타입과 좌표를 읽어 좌표가 없으면 끝낸다.
                LineString·Polygon·PointBuffer 각각에 맞는 생성 함수로 객체를 만들고, 만들지 못하면 끝낸다.
                객체에 캐시 키 이름·소속 레이어 이름·렌더 순서·측정 mesh 표시·표시 상태를 설정하고 하위 객체까지 같은 렌더 순서를 전파한다.
                scene 그룹에 넣고 같은 이름으로 캐시에 등록한다.

        #removeSimpleFeatureObjectByUid(uid: string) -> void
            역할: UID에 대응하는 simple 객체를 캐시와 scene 그룹에서 지운다.
            의존:
                UCache — 삭제 콜백과 함께 항목 제거; 함수: {delete()}
                U3dLayer — 레이어 캐시 항목 조회와 삭제; 속성 읽기: {_cache}
                defined — defined 사용; 함수: {defined()}
            동작:
                `uid`나 캐시가 없으면 끝낸다.
                `uid`와 캐시가 있으면 아래를 수행한다.
                    캐시 키를 만든다.
                    삭제 콜백과 함께 캐시 항목을 지운다.

        #createSimpleLineMesh(vectors: Array<Vector3>, feature: UMeasureFeature) -> Group | undefined
            역할: 선 좌표를 실린더와 구의 조합으로 바꿔 굵은 선처럼 보이는 전면·가림 mesh 그룹을 만든다.
            인터페이스: vectors는 월드 좌표(EPSG:3857) 구성점이다. 정점이 2개보다 적거나 병합에 실패하면 만들지 않는다.
            처리 기준:
                정점 수를 `_simpleGeometryLineMaxPoints` 이하로 줄여 실린더·구 개수를 제한한다.
                반경은 외곽선 굵기의 절반이며 최소 0.00001로 눌러 0 크기를 막는다.
                길이가 0이거나 유한하지 않은 구간은 건너뛴다.
                geometry는 첫 점을 원점으로 한 로컬 좌표로 만들고 월드 위치는 그룹 위치가 담당한다.
            의존:
                three — 실린더·구 생성과 행렬 변환; 생성자: {new CylinderGeometry(), new SphereGeometry(), new Vector3(), new Quaternion(), new Matrix4()}; 함수: {setFromUnitVectors(), compose(), applyMatrix4(), dispose(), computeBoundingBox(), computeBoundingSphere()}
                BufferGeometryUtils — 부분 geometry 병합; 함수: {mergeGeometries()}
                mergeGeometries — mergeGeometries 사용; 함수: {mergeGeometries()}
                THREE — THREE 사용; 생성자: {new CylinderGeometry(), new Matrix4(), new Quaternion(), new SphereGeometry(), new Vector3()}
            동작:
                스타일을 해석해 외곽선 색·불투명도·굵기를 정한다.
                정점을 상한에 맞게 솎아 내고 첫 점을 원점으로 삼아 로컬 좌표로 옮긴다.
                구간마다 방향과 길이에 맞춰 실린더 사본을 배치하고, 정점마다 구 사본을 배치한다.
                부분 geometry를 하나로 병합하고 원본과 기준 geometry를 해제한 뒤 경계 상자와 경계 구를 계산한다.
                전면·가림 두 mesh를 담은 그룹으로 만들어 돌려준다.

        #createSimplePolygonGroup(vectors: Array<Vector3>, feature: UMeasureFeature) -> Group | undefined
            역할: 다각형 좌표로 채움과 외곽선을 각각 전면·가림 두 벌로 만든 그룹을 만든다.
            인터페이스: 정점이 2개보다 적으면 만들지 않고, 정확히 2개이면 선 그룹으로 대신한다.
            처리 기준: 그룹 원점은 정점 전체를 감싸는 상자의 중심이며 geometry는 그 원점 기준 로컬 좌표다. 전면 외곽선과 가림 외곽선은 서로 다른 종류의 geometry를 쓴다.
            의존:
                three — 범위·그룹·버퍼 geometry; 생성자: {new Box3(), new Vector3(), new Group(), new BufferGeometry()}; 함수: {expandByPoint(), getCenter(), setFromPoints(), add()}
                LineSegmentsGeometry — 두꺼운 외곽선 geometry; 생성자: {new LineSegmentsGeometry()}; 함수: {setPositions(), computeVertexNormals()}
                THREE — THREE 사용; 생성자: {new Box3(), new BufferGeometry(), new Group(), new Vector3()}
            동작:
                정점이 2개보다 적으면 끝내고, 2개이면 선 그룹 생성으로 넘긴다.
                스타일을 해석해 채움·외곽선 색과 각 불투명도를 정한다.
                정점 전체를 감싸는 상자의 중심을 원점으로 잡고 로컬 좌표를 만든 뒤 채움 geometry를 만든다.
                같은 채움 geometry를 공유하는 전면·가림 mesh 두 개를 만든다.
                이웃 정점 쌍으로 외곽선 구간을 만들고 마지막 정점에서 첫 정점으로 닫는 구간을 덧붙인다.
                전면 외곽선은 두꺼운 선 geometry로, 가림 외곽선은 일반 버퍼 geometry로 만들어 각각 선 객체를 만든다.
                그룹 위치를 원점으로 두고 채움·가림채움·외곽선·가림외곽선 순으로 담아 돌려준다.

        #createSimpleCircleGroup(vectors: Array<Vector3>, feature: UMeasureFeature) -> Group | undefined
            역할: 첫 점을 중심, 마지막 점을 반경 끝으로 삼아 원형 채움과 외곽선을 전면·가림 두 벌로 만든다.
            인터페이스: 정점이 2개보다 적으면 만들지 않는다.
            처리 기준: 분할 수는 `_simpleGeometryCircleSegments`를 쓰고 외곽선은 최소 8분할을 보장한다.
            의존:
                three — 원 geometry와 타원 곡선; 생성자: {new CircleGeometry(), new EllipseCurve(), new BufferGeometry(), new Vector3(), new Group()}; 함수: {getPoints(), setFromPoints(), distanceTo(), add()}
                THREE — THREE 사용; 생성자: {new BufferGeometry(), new CircleGeometry(), new EllipseCurve(), new Group()}
            동작:
                정점이 2개보다 적으면 끝내고, 스타일을 해석한다.
                첫 점을 중심으로, 마지막 점까지의 거리를 반경으로 정해 원 geometry를 만든다.
                같은 채움 geometry를 공유하는 전면·가림 mesh 두 개를 만든다.
                타원 곡선에서 외곽 점을 얻어 하나의 geometry로 만들고 전면·가림 선 객체가 공유하게 한다.
                그룹 위치를 중심으로 두고 채움·가림채움·외곽선·가림외곽선 순으로 담아 돌려준다.

    tile binding과 교차 판정 책임 그룹
        역할: feature가 덮는 tile을 level별로 찾아 binding을 만들고, 제거할 때 그 흔적을 되돌린다.
        관련 상태: _drawTiles, _drawTileKeys, _drawFeatureIds, _featureTileRangeSignature

        #getTileRangeSignature(extent: U3dShaderMeasureExtent | Box3 | undefined, startLevel: number, endLevel: number, offset: number) -> string
            역할: 범위가 덮는 level별 tile 인덱스 범위를 하나의 비교용 문자열로 만든다.
            인터페이스: 범위가 없으면 빈 문자열이다. offset은 월드 좌표 기준 외곽선 여유값이다.
            동작: level마다 여유를 반영한 최소·최대 지점을 tile 인덱스로 바꿔 level과 네 인덱스를 이어 붙여 돌려준다.

        #setDrawTiles(feature: UMeasureFeature, startLevel: number, endLevel: number, offset: number) -> void
            역할: feature 범위를 level 범위 전체에 대해 tile binding으로 펼친다.
            처리 기준: geometry나 범위가 없거나 이 feature의 점유 목록이 아직 만들어지지 않았으면 아무것도 하지 않는다.
            의존:
                UMeasureFeature — geometry·범위 조회; 함수: {getGeometry(), getExtent()}
                defined — defined 사용; 함수: {defined()}
            동작: 시작 level부터 끝 level까지 한 level씩 tile 등록을 반복한다.

        #setDrawTile(ma: UMercator, i: number, extent: object, drawTile: Map<string, string>, feature: UMeasureFeature, offset: number) -> void
            역할: 한 level에서 범위가 걸치는 tile 인덱스 구간을 구해 각 tile을 등록 시도한다.
            의존: UMercator — 미터 좌표를 tile 인덱스로 변환; 함수: {MetersToTile()}
            동작: 여유를 더한 최소·최대 지점을 tile 인덱스로 바꾸고 x, y 두 방향으로 돌며 tile마다 등록을 시도한다.

        #setDrawTileXY(ma: UMercator, tx: number, ty: number, i: number, drawTile: Map<string, string>, feature: UMeasureFeature, offset: number) -> void
            역할: 실제로 교차하는 tile만 골라 bound 레코드와 feature 매핑을 등록한다.
            처리 기준:
                범위가 걸치기만 하고 실제로 교차하지 않으면 등록하지 않는다.
                같은 feature가 이미 등록된 tile에는 bound 레코드를 다시 넣지 않는다. 이때 새로 만든 레코드는 버려지므로 parentKey 갱신도 반영되지 않는다. [확인 Q-005]
                새로 등록한 경우에만 그 tile의 재질을 변경 표시해, 이미 그려진 tile을 공유하는 새 feature가 셰이더 캐시에서 누락되는 것을 막는다.
            의존: UMercator — tile 경계 계산; 함수: {TileBounds()}
            동작:
                tile 경계를 구해 실제 교차 여부를 확인하고 아니면 끝낸다.
                tile 키와 bound 레코드를 만들고 feature 점유 목록에 타입을 기록한다.
                같은 feature가 없을 때만 tile별 bound 목록에 넣고 그 tile 재질을 변경 표시한다.
                tile별 feature 포함 표에 이 feature를 표시한다.
                최대 level이 기본값과 다를 때만 부모 tile 인덱스를 계산해 레코드에 넣는다.

        #getFeatureIds(tileKey: string, type: string) -> Array<string>
            역할: 한 tile에 등록된 bound 중 같은 측정 타입인 것의 feature ID만 모은다.
            처리 기준: 타입을 주지 않으면 현재 측정 타입을 쓴다. tile 키가 없으면 빈 목록이다.
            동작: tile의 bound 목록을 돌며 ID가 있고 타입이 같은 것만 담아 돌려준다.

        #hasFeatureTileBindings(feature: UMeasureFeature) -> boolean
            역할: feature가 tile 점유 목록을 갖고 있는지 확인한다.
            인터페이스: true이면 제거할 때 terrain payload 정리가 필요하다는 뜻이다.
            동작: UID가 있고 점유 목록이 비어 있지 않으면 true를 돌려준다.

        #removeFeatureTileBindings(feature: UMeasureFeature) -> void
            역할: feature가 점유하던 tile 기록과 그로 인해 비게 된 tile의 payload·캐시를 함께 정리한다.
            처리 기준:
                tile에 남은 다른 feature가 있으면 그 tile을 표시 목록에서 빼지 않는다. 무조건 빼면 같은 tile의 다른 feature까지 비표시로 떨어진다.
                tile이 아직 로딩 중이거나 manager에 남은 feature가 있으면 payload를 지우지 않는다.
                부모·자식 교대 중인 tile은 이전 소유자의 payload를 남겨 화면 공백을 막는다.
            의존:
                UCache — 남은 bound가 없는 tile의 캐시 항목 제거; 함수: {get(), delete()}
                UDrawArg — tile mesh와 로딩 상태 조회; 함수: {_cacheTiles.get()}
                UDEF — tile 로딩 상태 상수; 상수: {PROCESS.WORK_STATE.LOADING}
                U3dLayer — 레이어 캐시 항목 조회와 삭제; 속성 읽기: {_cache, _drawArg}
                defined — defined 사용; 함수: {defined()}
            동작:
                점유 목록이 없으면 끝낸다.
                점유하던 tile마다 tile별 feature 표와 bound 목록에서 이 feature를 빼고, 비면 그 항목 자체를 지운다.
                캐시가 있는 tile에서 남은 bound가 없으면 캐시 항목을 지우고, 남아 있으면 그 tile 재질만 변경 표시한다.
                남은 bound가 없고 로딩 중도 아니며 manager에도 feature가 없으면, 교대 중이 아닐 때만 source payload를 비운다.
                남은 bound가 없고 교대 중도 아니면 그 tile을 표시 목록에서 뺀다.
                마지막에 이 feature의 점유 목록·활성 tile·binding revision 기록을 지운다.

    terrain 상태 판정 책임 그룹
        역할: tile별로 이 레이어가 관여하는지, payload를 요구하는지, 비어 있음으로 정착했는지 판단한다.

        #shouldHoldTerrainPayloadDuringSwap(tileKey: string) -> boolean
            역할: 부모·자식 tile 교대 중에는 기존 decal 제거를 보류시킨다.
            처리 기준: 단순 숨김 제거와 교대 제거를 구분하기 위한 판정이다. manager가 없으면 보류하지 않는다.
            의존: UShaderTerrainDecalManager — 전환 상태 조회; 함수: {getTerrainTilePresentationState(), shouldDeferTerrainSceneRemoval(), isTerrainTileSwapReady()}
            동작: 제거 보류 중이거나, 교대 관계가 있으면서 아직 교대 준비가 끝나지 않았으면 true를 돌려준다.

    terrain payload 반영 책임 그룹
        역할: 만들어진 payload를 manager의 tile source에 넣고 빼며, 그 결과로 tile 표시 추적을 맞춘다.

        #redrawTilePayloadByKey(key: string, object: Mesh) -> boolean
            역할: 보이는 tile이 전체 동기화가 필요한지 판단해 요청한다.
            인터페이스: 동기화를 요청했거나 이미 최신이면 true, 그릴 대상이 없거나 동기화가 실패하면 false를 돌려준다.
            동작:
                tile의 feature 목록을 보고 비었으면 manager feature가 있을 때만 전체 동기화 결과를 돌려준다.
                feature가 있으면 동기화 필요 여부를 먼저 보고, 필요하지 않으면 최신으로 보아 true를 돌려준다.

        #flushTerrainTilePayloadChanges(syncTileKeys: Set<string> = new Set(), clearTileKeys: Set<string> = new Set(), opt: MeasureTerrainClearOption = {}) -> void
            역할: 제거 대상 tile의 source를 비우고 보이는 tile의 payload를 다시 맞춘다.
            처리 기준:
                로딩 중인 tile은 건드리지 않는다.
                교대 중인 tile은 비우지 않고 표시 목록에 되돌린다.
                manager에 feature가 남은 tile도 비우지 않는다.
                두 대상에 모두 든 tile은 제거를 우선한다.
            의존:
                UShaderTerrainDecalManager — 재질 존재 확인; 함수: {getTerrainMaterial()}
                UDrawArg — tile과 mesh 조회; 함수: {_cacheTiles.get()}
                UDEF — tile 로딩 상태 상수; 상수: {PROCESS.WORK_STATE.LOADING}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
            동작:
                `_terrainDecalManager`가 있으면 아래를 수행한다.
                    제거 대상마다 위 기준을 확인하고 통과하면 mesh의 geometry·원점을 넘겨 source를 비운 뒤 표시 목록에서 뺀다.
                    동기화 대상마다 보이는 tile만 골라 다시 그리기를 시도하고, 성공하면 표시 목록에 넣는다.
                    실패했는데 재질이 남아 있으면 교대 중일 때는 표시 목록에 넣고, manager feature가 남았으면 전체 동기화를 한 번 더 시도하며, 둘 다 아니면 비우고 표시 목록에서 뺀다.

        #syncVisibleTerrainTilePayloads() -> void
            역할: 현재 보이는 모든 tile의 payload를 manager 상태와 즉시 맞춘다.
            처리 기준: 보이지 않거나 mesh가 없는 tile과, 로컬 binding도 manager feature도 없는 tile은 건너뛴다. 건너뛰지 않은 tile은 동기화 여부와 무관하게 표시 목록에 넣는다.
            의존:
                UDrawArg — 캐시된 tile 전체 순회; 함수: {_cacheTiles.forEach()}
                U3dLayer — 현재 프레임 그리기 정보와 캐시된 tile 조회; 속성 읽기: {_drawArg}
            동작: tile마다 위 기준을 확인하고 필요할 때만 전체 동기화를 수행한 뒤 표시 목록에 넣는다.

    합성 순서 책임 그룹
        역할: feature의 그리기 순서와 앱 단위 합성 순서를 확정한다.
        관련 상태: _drawSequenceCounter, _compositionOrderRegistry

        getTerrainCompositionGroupKey() -> string
            인터페이스: 반환은 이 레이어 수명주기를 식별하는 합성 group 키다. 이름이 없으면 ID를, 그것도 없으면 `measure`를 쓴다.
            처리 기준: `dispose()`는 부모 정리로 이름이 지워진 뒤 이 값을 쓰므로 등록 시 키와 달라질 수 있다.
            의존:
                U3dLayer — 레이어 이름 확인; 속성 읽기: {_name, _id}
            동작: 이름·ID·기본값 순으로 첫 값을 문자열로 돌려준다.

        #allocateDrawSequence() -> number
            역할: 그리기 순서로 쓸 다음 번호를 발급한다.
            인터페이스: 반환은 증가 전 값이며 0부터 시작한다.
            동작: 현재 값을 읽어 1 올려 저장하고 올리기 전 값을 돌려준다.

        #ensureFeatureDrawSequence(feature: UMeasureFeature) -> number
            역할: feature의 합성 순서를 확정하고 그리기 순서는 없을 때만 새로 발급한다.
            처리 기준: 이미 그리기 순서가 있으면 보존한다. manager가 최종 순서를 주지 않으면 레이어가 만든 힌트를 쓴다.
            의존:
                UTerrainDecalCompositionOrderRegistry — 레이어 측 최초 순서 힌트; 함수: {ensureFeatureOrdinal()}
                UShaderTerrainDecalManager — 앱 단위 최종 순서 확정; 함수: {ensureTerrainCompositionFeatureOrdinal()}
                UMeasureFeature — 순서 조회·확정; 함수: {getDrawSequence(), ensureDrawSequence()}
            동작:
                `feature`가 있으면 아래를 수행한다.
                    식별자와 group 키로 합성 identity를 만들고 레이어 힌트를 얻는다.
                    manager로 최종 순서를 확정해 feature에 기록한다.
                    그리기 순서가 이미 있으면 그 값을 돌려주고, 없으면 새로 발급해 feature에 확정한 값을 돌려준다.

    tile 표시 상태 판정 책임 그룹
        역할: terrain tile의 LOD 전환·표시·제거 판정에 이 레이어의 관여 상태를 제공한다.
        처리 기준: 레이어가 숨김이거나 이 tile에 관여하지 않으면 다른 레이어의 판정을 막지 않도록 중립으로 통과시킨다. 판정 함수는 어느 것도 상태를 바꾸지 않는다.

        override getTileFromScene(tile: U3dQuadTile) -> Object3D | undefined
            역할: 그 tile의 캐시 객체가 실제로 scene 그룹에 들어 있을 때만 돌려준다.
            의존:
                U3dLayer — scene과 캐시 객체 조회; 함수: {getScene(), getCache()}; 속성 읽기: {_group}
                UGroup — scene 그룹 포함 여부 확인; 함수: {has()}
                defined — defined 사용; 함수: {defined()}
            동작: scene이 있고 캐시 객체가 있으며 그 객체가 그룹에 들어 있을 때만 그 객체를 돌려주고, 아니면 undefined를 돌려준다.

        isTilePresentationParticipant(tile: U3dQuadTile) -> boolean
            인터페이스: true이면 이 tile 판정에 measure가 관여하므로 아래 판정들을 적용해야 한다는 뜻이다.
            처리 기준: feature가 없어도 manager 생명주기가 남아 있으면 관여로 본다.
            동작: tile 키가 없거나 폐기되었거나 레이어가 숨김이면 false를 돌려주고, 아니면 관여 여부를 그대로 돌려준다.

        isTileRenderableReady(tile: U3dQuadTile) -> boolean
            역할: measure source가 재질에 적용 완료되어 자식 LOD로 전환해도 되는지 알린다.
            인터페이스: true이면 measure가 전환을 막지 않는다는 뜻이며 숨김·비관여 중립도 포함한다. false이면 전환을 보류해야 한다.
            의존: UShaderTerrainDecalManager — 교대 준비 여부 조회; 함수: {isTerrainTileSwapReady()}
            동작:
                키가 없거나 폐기면 false를, 숨김이거나 비관여면 중립으로 true를 돌려준다.
                `tile._mesh`가 있으면 manager에 교대 준비 여부를 물어 정확히 true일 때만 true를 돌려주고, 없으면 false를 돌려준다.

        isTilePresentationVisible(tile: U3dQuadTile) -> boolean
            역할: 이 source가 그 tile의 화면 coverage를 실제로 제공하는지 알린다.
            처리 기준: `hasActivePresentation`은 재질 단위 상태라 다른 decal로도 참이 될 수 있으므로, source feature 존재와 적용 revision 최신까지 함께 확인해야 한다.
            의존: UShaderTerrainDecalManager — presentation 상태 조회; 함수: {getTerrainTilePresentationState()}
            동작: 키 없음·폐기면 false, 숨김·비관여·비어 있음 정착이면 중립으로 true, tile이나 mesh가 보이지 않거나 표시 목록에 없으면 false를 돌려준다. 그 밖에는 payload 요구 조건으로 presentation을 물어 세 조건이 모두 참일 때만 true를 돌려준다.

        isTilePresentationAttached(tile: U3dQuadTile) -> boolean
            역할: 최신 revision 준비와 무관하게 기존 presentation이 재질에 붙어 있는지 알린다.
            처리 기준: 앞의 표시 판정과 가드는 같지만 payload 요구 여부를 계산해 넘기고 부착 여부 하나만 확인한다. feature 존재와 revision 최신 여부는 보지 않는다.
            의존: UShaderTerrainDecalManager — presentation 상태 조회; 함수: {getTerrainTilePresentationState()}
            동작: 같은 가드를 지난 뒤 계산한 요구 조건으로 presentation을 물어 부착 여부를 돌려준다.

        isTileRetainedPresentationSafe(tile: U3dQuadTile) -> boolean
            역할: 새 합성이 진행 중일 때 직전 적용본으로 자식 coverage를 대신해도 되는지 알린다.
            처리 기준: 실패·취소·폐기 상태인 source가 있으면 안전하지 않다. 렌더 feature가 없는 source는 비어 있음으로 확정되었거나 상태 자체가 없어야 안전하다.
            의존:
                UShaderTerrainDecalManager — tile 등록 정보 조회; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                UShaderTerrainDecalTileStateManager — 현재 revision 실패 판정; 함수: {hasTerrainTileFailedCurrentRevision()}
                hasTerrainTileFailedCurrentRevision — hasTerrainTileFailedCurrentRevision 사용; 함수: {hasTerrainTileFailedCurrentRevision()}

            동작: 부착 여부를 먼저 확인하고, manager 등록 정보가 없거나 현재 revision이 실패했으면 false를 돌려준다. source마다 위 기준을 확인해 모두 통과할 때만 true를 돌려준다.

        isTileSceneRemovalDeferred(tile: U3dQuadTile) -> boolean
            역할: 자식들의 measure coverage가 준비되기 전까지 부모 tile의 scene 제거를 보류시킨다.
            처리 기준: 자식 네 개를 고정으로 본다. 자식이 네 개보다 적으면 그 자리는 준비되지 않은 것으로 본다.
            동작:
                키 없음·폐기·숨김·비관여이거나 자식이 없으면 false를 돌려준다.
                자식 네 개가 모두 표시 가능하면 보류하지 않고, 하나라도 빠지면 부모 자신이 실제로 보이고 표시 목록에 있을 때만 보류한다.

        override addTileFromScene(tile: U3dQuadTile) -> boolean
            역할: measure feature가 실제로 참여하는 tile만 source 동기화 대상으로 등록한다.
            인터페이스: true는 이 tile에 대한 처리를 끝냈다는 뜻이며 등록 대상이 아니어서 아무것도 하지 않은 경우도 포함하므로 등록 여부 판정에는 쓸 수 없다. false는 mesh가 없거나 동기화 중 예외가 나 대기 상태로 남겼다는 뜻이다.
            처리 기준:
                feature도 manager feature도 없는 tile은 교대 대기 대상에 넣지 않고 표시 목록에서 뺀다.
                mesh가 없으면 tile 원점을 알 수 없으므로 source를 대기로 남겨 부모 coverage가 먼저 풀리지 않게 한다.
            동작:
                키가 없거나 숨김이면 그대로 끝낸다.
                로컬 binding과 manager feature가 모두 없으면 표시 목록에서 빼고 끝낸다.
                mesh가 없으면 대기로 표시하고 false를 돌려준다.
                표시 추적을 먼저 복원하고 기록을 남긴 뒤 전체 동기화를 수행한다. 예외가 나면 실패 사유와 함께 대기를 내리고 false를 돌려준다.

        override removeTileFromScene(tile: U3dQuadTile) -> boolean
            역할: 이 레이어의 로컬 tile 추적만 정리하고 terrain mesh 소유권은 다른 레이어에 남긴다.
            인터페이스: 항상 true를 돌려주며 키가 없어 할 일이 없던 경우도 포함한다.
            처리 기준: measure는 terrain mesh 표시 소유자가 아니므로 전역 표시 상태와 교대 관계를 바꾸지 않는다.
            의존:
                U3dLayer — 기본 제거와 tile 상태 초기화; 함수: {removeTileFromScene(), resetStateTileByKey(), U3dLayer.prototype.removeTileFromScene.call}
            동작: 부모 구현을 먼저 호출하고, `tile._key`가 있으면 기록을 남긴 뒤 tile 상태를 초기화하고 표시 목록에서 뺀다.

        override suspendTilePresentation(tile: U3dQuadTile) -> boolean
            역할: 준비가 끝나지 않은 tile의 화면 추적만 풀고 measure 준비 상태는 유지한다.
            인터페이스: true는 준비를 유지한 채 노출만 보류했다는 뜻이고, false는 tile 키가 없어 보류하지 못했다는 뜻이다.
            처리 기준: 제거와 달리 tile 상태 초기화와 manager source·교대 관계를 건드리지 않아 진행 중이던 작업이 다음 프레임으로 이어진다.
            동작: 키가 없으면 false를 돌려주고, 있으면 표시 목록에서만 빼고 true를 돌려준다.

    생명주기 책임 그룹
        역할: 레이어 초기화, 표시 전환, tile 해제와 전체 정리에서 manager 등록과 렌더 자원을 함께 관리한다.

        override initialize() -> void
            역할: 앱이 공유하는 decal manager를 확보해 합성 group을 등록하고 shader material manager를 준비한다.
            처리 기준: 합성 group 순서는 tile 동기화 시점이 아니라 레이어 등록 시점에 확정한다. shader material manager는 없을 때만 새로 만든다.
            의존:
                U3dLayer — 기본 초기화와 렌더 순서; 함수: {initialize(), getRenderOrder(), U3dLayer.prototype.initialize.call}; 속성 읽기: {_initialized, _app}
                U3dApp — 공유 manager 조회; 함수: {getTerrainDecalManager()}
                UShaderTerrainDecalManager — 합성 group 등록; 함수: {registerTerrainCompositionGroup()}
                UShaderMaterialManager — 재질 관리자 생성; 생성자: {new UShaderMaterialManager()}; 함수: {getTemplateCache()}
            동작:
                부모 초기화를 수행하고 `_initialized`를 true로 표시한다.
                `_terrainDecalManager`가 없으면 앱에서 받아 와 그 자리에 채운다.
                합성 group 키와 현재 렌더 순서로 group을 등록한다.
                `_shaderMaterialManager`가 없으면 재질·템플릿 캐시를 넘겨 새로 만들고 템플릿 캐시를 그 관리자 것으로 바꾼다.

        override show(show: boolean, refresh: boolean = true) -> void
            역할: 표시 전환에 맞춰 tile source payload를 비우거나 다시 만든다.
            처리 기준:
                상태가 바뀌지 않았고 다시 그리기 요청도 없으면 아무것도 하지 않는다.
                숨김 구간에서만 요청 보존 플래그를 세우고, 부모 처리가 끝나면 어떤 경로로 끝나든 반드시 되돌린다.
                숨길 때는 이 레이어가 등록한 source만 비우므로 같은 tile의 다른 레이어 표시에는 영향을 주지 않는다.
            의존:
                U3dLayer — 기본 표시 전환; 함수: {show(), U3dLayer.prototype.show.call}; 속성 읽기: {_preserveTileRequestsOnHide}
                UShaderTerrainDecalManager — 모아 둔 변경 일괄 반영; 함수: {flushTileUpdates()}
            동작:
                전환 여부를 부모 호출 전에 계산하고 요청 보존 플래그를 세운 상태로 부모 처리를 수행한 뒤 플래그를 되돌린다.
                숨김이면 표시 목록과 binding 표의 tile을 모아 source를 표시 전환 사유로 비우고 한 번에 반영한 뒤 표시 목록을 새로 만든다.
                표시이면 전체 feature로 렌더 갱신을 수행하고 보이는 tile의 payload를 다시 맞춘다.

        override cancelAllTile() -> void
            역할: 진행 중인 tile 요청 취소를 수행하되 숨김 전환 중에는 건너뛴다.
            처리 기준: 숨김으로 호출된 경우에는 다시 표시할 때 곧바로 그릴 수 있도록 아무것도 취소하지 않는다.
            의존:
                U3dLayer — 실제 취소 수행; 함수: {cancelAllTile(), U3dLayer.prototype.cancelAllTile.call}; 속성 읽기: {_preserveTileRequestsOnHide}
            동작: 요청 보존 플래그가 서 있으면 그대로 끝내고, 아니면 부모 구현에 위임한다.

        override dispose() -> DeferredObject<boolean>
            역할: manager에 등록한 measure source를 tile 단위로 풀고 feature·캐시·scene·shader 관리자를 모두 정리한다.
            인터페이스: 반환 객체는 이미 true로 이행된 상태로 돌아온다.
            처리 기준:
                정리 후에는 이 레이어를 다시 쓸 수 없다.
                합성 group 등록 해제는 부모 정리로 레이어 이름이 지워진 뒤에 수행되므로 등록 시 키와 달라질 수 있다. [확인 Q-006]
            의존:
                UShaderTerrainDecalManager — source 해제·최종 폐기·group 등록 해제; 함수: {getTerrainSourceLifecycleTileKeys(), getTerrainSourceTileKeys(), releaseTerrainTileSources(), tryFinalizeUnownedTerrainTileDispose(), unregisterTerrainCompositionGroup()}
                U3dLayer — 기본 정리; 함수: {dispose(), U3dLayer.prototype.dispose.call}; 속성 읽기: {_name, _cache, _group, _disposed}
                UCache — 캐시 전체 삭제; 함수: {deleteAll()}
                UGroup — scene 그룹 비우기; 함수: {clear()}
                UShaderMaterialManager — 재질 관리자 해제; 함수: {dispose()}
                UMeasureFeature — geometry 해제; 속성 읽기: {_geometry}
                deferred — 결과 객체 생성; 함수: {deferred()}
            동작:
                binding 표·표시 목록·점유 목록과 manager가 알려 준 생명주기 tile 키를 모두 모은다.
                tile마다 이 레이어 소유 source를 해제하고 주인이 없어진 tile의 최종 폐기를 시도한다.
                부모 정리를 수행한다.
                feature가 들고 있던 geometry를 모두 해제한다.
                feature 목록·원본 표를 비우고 source 도우미를 다시 붙인 뒤 캐시와 scene 그룹을 비운다.
                tile·feature 추적 상태를 초기값으로 되돌리고 세대 번호를 올린다.
                shader material manager를 해제하고 합성 group 등록을 풀고 manager 연결을 끊은 뒤 정리 완료를 표시한다.
                true로 이행한 결과 객체를 돌려준다.

        override disposeTile(tile: U3dQuadTile, opt?: object) -> void
            역할: tile 하나에 붙은 measure source 등록과 캐시 mesh를 해제한다.
            처리 기준:
                manager가 없으면 revision 상태만 지우고 끝내므로 캐시 mesh 정리와 표시 목록 정리가 일어나지 않는다. [확인 Q-008]
                최대 level이 기본값과 다르고 그 level의 tile이면 mesh를 남겨 둔다.
                opt는 선언만 있고 사용하지 않는다.
            의존:
                UShaderTerrainDecalManager — source 해제와 최종 폐기; 함수: {releaseTerrainTileSources(), tryFinalizeUnownedTerrainTileDispose()}
                UCache — mesh 조회·삭제; 함수: {get(), delete()}
                UGroup — scene에서 제거; 함수: {remove()}
                U3dLayer — 레이어 이름 확인; 속성 읽기: {_name, _cache, _group}
                defined — defined 사용; 함수: {defined()}
            동작:
                revision 상태에서 이 tile 항목을 지운다.
                `_terrainDecalManager`가 없으면 여기서 끝낸다.
                `_terrainDecalManager`가 있으면 아래를 수행한다.
                    manager에 이 레이어 소유 source 해제와 최종 폐기를 요청한다.
                    보존 대상이 아니면 캐시 mesh를 감추고 자원을 해제한 뒤, 그 tile의 표시를 다시 그릴 대상으로 되돌리고 scene과 캐시에서 지운다.
                    마지막에 표시 목록에서 뺀다.

        deleteMesh(mesh: Object3D) -> void
            역할: mesh와 자식 객체의 재질·geometry를 재귀적으로 해제한다.
            처리 기준: geometry 해제가 재질 존재 블록 안에 있어, 재질이 없는 mesh는 geometry가 해제되지 않는다. [확인 Q-009]
            의존:
                three — geometry 해제; 함수: {dispose()}
                defined — defined 사용; 함수: {defined()}
            동작: 재질이 있으면 재질을 해제하고 이어서 geometry를 해제해 참조를 끊은 뒤, 자식이 있으면 각 자식에 같은 처리를 재귀 적용한다.

        #deleteMaterial(materials: Material | Array<Material> | undefined) -> void
            역할: 측정 렌더링에 쓴 재질과 그 텍스처를 해제하고 재질 캐시에서 뺀다.
            처리 기준: 해제 순서는 맵 텍스처, 셰이더 uniform 텍스처, 재질 본체, 캐시 등록 해제다.
            의존:
                three — 재질 종류 판별과 해제; 상수: {ShaderMaterial}; 함수: {dispose()}
                UCache — 캐시 항목 제거; 함수: {remove()}
                defined — defined 사용; 함수: {defined()}
            동작: 배열이면 원소마다 같은 처리를 반복하고, 단일이면 맵 텍스처와 셰이더 텍스처 세 종을 해제한 뒤 재질을 해제하고 이름으로 캐시에서 뺀다.

        #fncDeleteGroup(object: Object3D) -> void
            역할: 캐시 삭제 콜백으로 받은 객체를 scene 그룹에서 떼고 자원을 해제한다.
            처리 기준: 이 메서드는 캐시가 레이어를 수신 객체로 삼아 호출한다. 그룹·mesh 어느 쪽도 아니면 오류를 기록만 한다.
            의존:
                three — 종류 판별; 상수: {Group, Mesh}
                UMesh — 종류 판별; 상수: {UMesh}
                UGroup — scene에서 제거; 함수: {remove()}
                Web API — 오류 기록; 함수: {console.info()}
                U3dLayer — scene 그룹 구성 변경; 속성 읽기: {_group}
                defined — defined 사용; 함수: {defined()}
            동작: 그룹이면 scene에서 떼고 자식마다 자원을 해제한 뒤 비우고, mesh이면 떼고 자원을 해제하며, 둘 다 아니면 오류를 기록한다.

    설정 접근자 책임 그룹
        역할: 렌더링 방식, simple 경로 상한과 디버그 조건을 읽고 바꾼다.

        setMeasureGeometryMode(mode: U3dShaderMeasureGeometryMode, refresh: boolean = true) -> U3dShaderMeasureLayer
            역할: 측정 도형을 그리는 방식을 바꾼다.
            인터페이스: 반환은 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신이다.
            처리 기준: 현재 방식과 같으면 아무것도 하지 않는다. 정규화할 수 없는 값이면 경고만 남기고 바꾸지 않는다.
            의존:
                U3dApp — 화면 갱신 요청; 함수: {changeUpdate()}
                Web API — 잘못된 입력 경고 기록; 함수: {console.warn()}
                U3dLayer — 앱 갱신 요청과 공유 manager 조회; 속성 읽기: {_app}
            동작:
                입력을 정규화해 현재 값과 같으면 자신을 그대로 돌려주고, 정규화할 수 없으면 경고만 남긴다.
                정규화 결과에 맞춰 예전 방식 옵션도 함께 맞춘 뒤 새 방식을 저장한다.
                `refresh`가 참이면 전체 feature로 렌더 갱신과 화면 갱신을 수행한다.

        getMeasureGeometryMode() -> U3dShaderMeasureGeometryMode
            인터페이스: 반환은 정규화한 현재 방식이며 `basic` 또는 `simple`이다.
            동작: 현재 방식을 정규화해 돌려주고 값이 없으면 `basic`을 돌려준다.

        getUseSimpleMeasure() -> boolean
            인터페이스: 반환은 예전 방식 옵션으로 저장된 값이다.
            동작: 예전 방식 옵션 속성을 그대로 돌려준다.

        setUseSimpleMeasure(value: boolean) -> void
            처리 기준: 이 값은 생성자에서 초기 방식을 정할 때만 쓰이므로, 이후에 바꿔도 현재 렌더링 방식은 달라지지 않는다. [확인 Q-010]
            동작: 입력 값을 예전 방식 옵션 속성에 그대로 저장한다.

        getVersion() -> string
            동작: 측정 데이터 버전 문자열 속성을 그대로 돌려준다.

        setVersion(version: string) -> void
            동작: 입력 문자열을 측정 데이터 버전 속성에 그대로 저장한다.

        setTerrainDebugEnabled(value: boolean) -> U3dShaderMeasureLayer
            인터페이스: 반환은 이어 호출할 수 있도록 돌려주는 이 레이어 자신이다.
            동작: 입력이 정확히 true일 때만 디버그를 켜고 자신을 돌려준다.

        setTerrainDebugTileFilter(value: undefined | string | Array<string> | Set<string> | U3dShaderMeasureTerrainDebugFilter) -> U3dShaderMeasureLayer
            인터페이스: 반환은 이어 호출할 수 있도록 돌려주는 이 레이어 자신이다. 값을 주지 않으면 조건이 사라져 모든 tile이 대상이 된다.
            동작: 입력을 그대로 저장하고 자신을 돌려준다.

        getSimpleGeometryLengthThreshold() -> number
            동작: simple geometry 길이 기준 속성을 그대로 돌려준다.

        setSimpleGeometryLengthThreshold(value: number) -> void
            처리 기준: 이 값을 읽어 분기하는 곳이 이 단위에 없어 바꾸어도 동작이 달라지지 않는다. [확인 Q-001]
            동작: 입력 값을 simple geometry 길이 기준 속성에 그대로 저장한다.

        getSimpleGeometryLineMaxPoints() -> number
            동작: simple 선의 최대 점 수 속성을 그대로 돌려준다.

        setSimpleGeometryLineMaxPoints(value: number) -> void
            처리 기준: 다음 simple 객체를 만들 때 적용되며 이미 만들어진 객체는 다시 만들기 전까지 그대로다.
            동작: 입력 값을 simple 선의 최대 점 수 속성에 그대로 저장한다.

        getSimpleGeometryCircleSegments() -> number
            동작: simple 원의 분할 수 속성을 그대로 돌려준다.

        setSimpleGeometryCircleSegments(value: number) -> void
            처리 기준: 다음 simple 객체를 만들 때 적용되며 이미 만들어진 객체는 다시 만들기 전까지 그대로다.
            동작: 입력 값을 simple 원의 분할 수 속성에 그대로 저장한다.

terrain source 식별 책임 그룹
역할: manager에 넘길 source 키와 identity, 렌더 순서 옵션을 만든다.

getMeasureTerrainTileSourceKey() -> string
    인터페이스: 반환은 tile binding용 source 키다. 레이어 이름이 없으면 `measure`를 접두사로 쓴다.
    동작: 레이어 이름에 tile source 접미사를 붙여 돌려준다.

getMeasureTerrainRuntimeSourceKey() -> string
    인터페이스: 반환은 runtime feature용 source 키다.
    동작: 레이어 이름에 runtime source 접미사를 붙여 돌려준다.

getMeasureTerrainSourceKeys() -> Array<string>
    인터페이스: 반환은 이 레이어가 소유한 source 키 두 개이며 tile, runtime 순서가 고정이다.
    동작: 두 source 키를 순서대로 담아 돌려준다.

getMeasureTerrainPrimarySourceKey() -> string
    인터페이스: 반환은 측정 feature를 기록하는 기본 source 키이며 runtime source 키로 고정이다. tile source 키는 기본이 아니다.
    동작: runtime source 키를 그대로 돌려준다.

getMeasureTerrainTileSourceLifecycleKeys(tileKey: string) -> Array<string>
    역할: 그 tile에서 manager가 생명주기를 들고 있는 이 레이어의 source 키만 고른다.
    처리 기준: feature가 없어도 상태·revision·대기 목록 중 어디든 등록되어 있으면 포함한다.
    의존: UShaderTerrainDecalManager — tile 등록과 source 상태 조회; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_TILE_FEATURE_MAP}
    동작:
        `tileKey`가 없으면 빈 목록을 돌려준다.
        `tileKey`가 있으면 두 source 키 각각을 구해 tile의 source 집합·상태·revision·대기 목록 중 하나에라도 있는 것만 남겨 돌려준다.

getMeasureTerrainSourceIdentity(sourceRevision: number) -> TerrainSourceIdentity
    역할: manager가 source를 같은 것으로 볼지 판단하는 identity를 만든다.
    처리 기준: namespace·schema·geometry 버전과 epoch은 모듈 상수를 그대로 싣는다. revision이 유한수가 아니면 0으로 본다.
    동작: 기본 source 키와 레이어 이름, 고정 버전 상수, 정규화한 revision을 담은 객체를 돌려준다.

getMeasureTerrainRenderOrderOption(tileKey: string) -> {ownerLayer: U3dShaderMeasureLayer, requestedTargetRenderOrder: number, targetRenderOrder: number}
    역할: 요청 렌더 순서와 manager가 조정한 실효 순서를 함께 담는다.
    처리 기준: manager가 실효 순서를 주지 않으면 요청 값을 그대로 쓴다.
    의존:
        U3dLayer — 현재 렌더 순서; 함수: {getRenderOrder()}
        UShaderTerrainDecalManager — 실효 렌더 순서 계산; 함수: {resolveTerrainEffectiveTargetRenderOrder()}
    동작: 현재 렌더 순서를 요청 값으로 삼고 manager에 실효 순서를 물어, 값이 없으면 요청 값을 쓴 옵션 객체를 돌려준다.

terrain 상태 판정 책임 그룹
역할: tile별로 이 레이어가 관여하는지, payload를 요구하는지, 비어 있음으로 정착했는지 판단한다.

hasMeasureTerrainTileManagerFeatures(tileKey: string) -> boolean
    역할: 두 source 중 하나라도 그 tile에 feature를 갖고 있는지 확인한다.
    의존: UShaderTerrainDecalManager — source feature 유무 조회; 함수: {getTerrainTilePresentationState()}
    동작: source 키를 차례로 물어 하나라도 feature가 있으면 true, 끝까지 없으면 false를 돌려준다.

hasMeasureTerrainTileParticipation(tileKey: string) -> boolean
    역할: 이 레이어가 그 tile 표시 결과에 조금이라도 관여하는지 판정한다.
    처리 기준: 로컬 binding, manager feature, source 생명주기 중 하나라도 있으면 관여로 본다.
    동작:
        `tileKey`가 없으면 false를 돌려준다.
        `tileKey`가 있으면 세 조건을 차례로 확인해 하나라도 성립하면 true를 돌려준다.

expectsMeasureTerrainTilePayload(tileKey: string) -> boolean
    역할: 그 tile이 실제 활성 payload를 요구하는 상태인지 판정한다.
    처리 기준: 관여 판정과 달리 source 생명주기만 남은 경우는 요구로 보지 않는다.
    동작: 로컬 binding이 있거나 manager feature가 있으면 true를 돌려준다.

isMeasureTerrainTileConfirmedEmptySettled(tileKey: string) -> boolean
    역할: 등록된 모든 source가 feature 0개 상태로 정착했는지 판정한다.
    처리 기준:
        생명주기 source가 하나도 없으면 false다.
        상태가 `confirmed-empty`이면 payload를 요구하지 않는 조건으로 다시 물어 feature 없음과 정착을 함께 확인한다.
        상태가 `available`이 아니거나 대기 중이거나 렌더 feature 수가 0이 아니면 false다.
    의존: UShaderTerrainDecalManager — tile 상태·presentation 조회; 함수: {getTerrainTilePresentationState()}; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_TILE_FEATURE_MAP}
    동작: 생명주기 source마다 위 기준을 확인하고, 마지막으로 tile이 더럽지 않고 적용 revision이 현재 revision 이상이거나 이 source의 적용 이력이 있으면 true로 본다.

shouldSyncMeasureTerrainTilePayload(tileKey: string) -> boolean
    역할: manager가 보고한 presentation이 정착 상태가 아니면 다시 동기화가 필요하다고 판정한다.
    처리 기준: revision 후보만 계산하고 확정하지 않으므로 이 판정은 상태를 바꾸지 않는다. manager가 없으면 동기화 필요로 본다.
    의존: UShaderTerrainDecalManager — presentation 상태 조회; 함수: {getTerrainTilePresentationState()}
    동작: 기본 source 키, revision 후보, identity와 payload 요구 여부를 만들어 presentation 상태를 묻고 정착이 아니면 true를 돌려준다.

terrain revision 책임 그룹
역할: tile별 measure source 내용을 해시로 요약해 내용이 바뀔 때만 revision을 올린다.
관련 상태: _sourceRevisionStates

calculateMeasureTerrainTileSourceSignature(tileKey: string, featureRefs: Array<object> = []) -> number
    역할: tile의 measure source 내용 전체를 32비트 해시 하나로 압축한다.
    처리 기준: 좌표는 전부 넣지 않고 첫 점과 마지막 점만 반영한다. 좌표가 하나뿐이면 같은 점이 두 번 섞인다.
    의존: UMeasureFeature — 타입·revision·순서·좌표 조회; 함수: {getType(), getRevision(), getDrawSequence(), getMeasureVectors()}
    동작: 레이어 이름·source 키·tile 키·참조 개수를 섞은 뒤, 참조마다 UID·타입·revision·순서·내부 구멍 여부·스타일 해시·좌표 개수와 양 끝 좌표를 차례로 섞어 돌려준다.

getMeasureTerrainTileSourceRevisionCandidate(tileKey: string, featureRefs: Array<object> = []) -> U3dShaderMeasureSourceRevisionState
    역할: 현재 내용에 대응하는 다음 revision을 부작용 없이 계산한다.
    처리 기준: 저장된 signature와 같으면 기존 상태 객체를 그대로 돌려주므로 revision이 오르지 않는다. 저장된 상태가 없으면 1부터 시작한다.
    동작: signature를 계산해 저장값과 비교하고, 같으면 기존 객체를, 다르면 revision을 1 올린 새 객체를 돌려준다.

resolveMeasureTerrainTileSourceRevision(tileKey: string, featureRefs: Array<object> = []) -> number
    역할: 후보 상태를 레이어 맵에 확정하고 revision 값만 돌려준다.
    동작: 후보를 계산해 tile 키에 저장하고 그 revision을 돌려준다.

hashMeasureTerrainStyle(hash: number, style: object = {}) -> number
    역할: 렌더 스타일 필드를 순서대로 해시에 누적한다.
    처리 기준: 불투명도·굵기는 값이 없을 때 0으로, 표시 여부는 명시적으로 false일 때만 0으로, 강조는 명시적으로 true일 때만 1로 정규화한다.
    동작: 채움·외곽선 색과 세 수치, 강조·표시 여부를 차례로 섞어 돌려준다.

hashMeasureTerrainColor(hash: number, color: unknown) -> number
    역할: 색상 표현 형태별로 성분을 분해해 해시에 반영한다.
    처리 기준: Color 객체·배열·r/g/b 객체는 성분으로, 문자열·숫자는 값 그대로 섞는다. 누락 성분은 0으로 본다.
    동작: 입력 형태를 판별해 해당 성분들을 차례로 섞어 돌려준다.

hashMeasureTerrainPoint(hash: number, point: object) -> number
    역할: 좌표 세 성분을 해시에 반영한다.
    처리 기준: 좌표 자체가 없어도 0, 0, 0으로 섞는다.
    동작: x, y, z를 차례로 섞어 돌려준다.

hashMeasureTerrainValue(hash: number, value: unknown) -> number
    역할: 임의 값을 문자열로 바꿔 해시에 누적한다.
    처리 기준: 값이 없으면 빈 문자열이 되어 해시가 바뀌지 않는다.
    동작: 문자열로 바꾼 뒤 문자마다 섞어 부호 없는 32비트 값으로 돌려준다.

terrain payload 구성 책임 그룹
역할: 측정 feature를 manager가 소비할 payload로 바꾸고 tile 단위 목록을 만든다.

getMeasureTerrainFeaturePayloadId(feature: object, fallback: unknown = undefined) -> string | number | undefined
    역할: payload에 쓸 식별자를 우선순위대로 뽑는다.
    처리 기준: 내부 고유값, `_uid`, ID, 대체값 순으로 먼저 값이 있는 것을 쓴다.
    의존: UMeasureFeature — 식별자 조회; 함수: {getUid(), getId()}
    동작: 네 후보를 순서대로 평가해 첫 값을 돌려준다.

getMeasureTerrainFeatureBoundTileKeys(feature: UMeasureFeature) -> Array<string>
    역할: feature가 점유 중인 tile 키 목록을 만든다.
    동작: UID가 없거나 점유 목록이 없으면 빈 목록을, 있으면 그 키 배열을 돌려준다.

toMeasureTerrainPayloadColor(colorValue: unknown, fallback: unknown, opacityValue: number = 1.0) -> Array<number>
    역할: 다양한 색상 입력을 셰이더용 네 성분 배열로 정규화한다.
    처리 기준: 대체값도 없으면 흰색을 쓴다. 불투명도가 유한수가 아니면 1을 쓰며 0은 그대로 쓴다.
    의존:
        three — 색상 변환; 생성자: {new Color()}
        defined — defined 사용; 함수: {defined()}
        THREE — THREE 사용; 생성자: {new Color()}
    동작: 입력이나 대체값으로 Color를 만들어 세 성분을 뽑고 불투명도를 더해 돌려준다.

buildMeasureTerrainFeaturePayload(feature: UMeasureFeature, tileOrigin: Vector3Like = {x: 0, y: 0, z: 0}) -> object | undefined
    역할: 측정 feature 하나를 manager가 소비할 정규화 payload로 바꾼다.
    처리 기준:
        면 유형은 `area`, 원 유형은 `circle`, 그 밖은 `path`로 정규화한다.
        path는 좌표 2개, area는 3개, circle은 2개보다 적으면 payload를 만들지 않는다.
        식별자를 얻을 수 없으면 만들지 않는다.
        렌더 순서는 feature의 draw sequence가 유한수이면 그 값을, 아니면 레이어 렌더 순서를 쓴다.
        property revision이 유한수일 때만 표시·강조·불투명도·굵기·색 성분을 순서대로 섞어 revision 해시를 만든다.
        스타일 revision은 `feature.getRevision?.()`를 먼저 보고, 없으면 `feature._revision`, 그다음 `feature.getStyleRevision?.()`, 마지막으로 `feature._styleRevision` 순으로 대체하며 모두 없으면 0을 쓴다.
    의존:
        UMeasureFeature — 타입·revision·순서·구멍 여부 조회; 함수: {getType(), getDrawSequence(), getGeometryRevision(), getPropertyRevision(), getRevision(), getStyleRevision()}
        UDEF — 측정 종류 상수; 상수: {MEASURE_TYPE.{POLYGON, MULTIPOLYGON, POINTBUFFER}}
        UShaderTerrainDecalUtils — revision 해시와 불변 해시; 함수: {hashTerrainSignatureValue(), buildTerrainImmutableFeatureHash()}
        buildTerrainImmutableFeatureHash — buildTerrainImmutableFeatureHash 사용; 함수: {buildTerrainImmutableFeatureHash()}
        defined — defined 사용; 함수: {defined()}
        hashTerrainSignatureValue — hashTerrainSignatureValue 사용; 함수: {hashTerrainSignatureValue()}
    동작:
        `feature`가 있으면 아래를 수행한다.
            좌표와 식별자를 확보하고 타입별 최소 정점 수를 만족하지 못하면 끝낸다.
            스타일을 해석해 채움·외곽선 색과 불투명도를 payload 색 배열로 바꾼다.
            원 유형이면 동적 반경이 있으면 그 값을, 없으면 좌표로 계산한 반경을 넣는다.
            tile 원점·좌표·revision들과 렌더 순서·합성 순서를 담은 payload를 만든다.
            만들어진 payload로 불변 해시를 계산해 그 자리에서 payload에 기록하고 돌려준다.

buildMeasureTerrainTileFeaturePayloads(tileKey: string, tileObject: Mesh, sourceKey: string) -> Array<object>
    역할: tile 하나에 올릴 payload 목록을 만든다.
    처리 기준: manager에 이미 등록된 source feature가 있으면 그 목록을 기준으로 삼고 로컬 binding은 보지 않는다. 대응 feature를 찾지 못하면 기존 정규화 데이터에 tile 원점만 덮어쓴다.
    의존: UShaderTerrainDecalManager — 기존 source feature 조회; 함수: {getTerrainSourceFeatures()}
    동작:
        tile 원점을 정하고 `sourceKey`가 없으면 기본 키로 채운다.
        manager에 source feature가 있으면 식별자마다 레이어 feature를 찾아 payload를 다시 만든다.
        없으면 tile의 bound 목록을 돌며 UID 중복을 걸러 내고 각 feature의 payload를 만든다.
        어느 경로든 payload를 만들지 못한 항목은 목록에 담지 않는다.

terrain payload 반영 책임 그룹
역할: 만들어진 payload를 manager의 tile source에 넣고 빼며, 그 결과로 tile 표시 추적을 맞춘다.

syncMeasureTerrainFeaturePayload(feature: UMeasureFeature, opt: MeasureTerrainSyncOption = {}) -> {changedTileKeys: Array<string>}
    역할: feature 하나를 점유 tile들의 source에 증분 반영한다.
    처리 기준:
        tile mesh가 없거나 폐기되었으면 원점을 알 수 없으므로 그 tile은 건너뛰고 사유를 기록한다.
        payload를 만들지 못한 tile도 건너뛴다.
        `deferFlush`가 참이 아니고 바뀐 tile이 있을 때만 즉시 반영을 요청한다.
    의존:
        UShaderTerrainDecalManager — feature 반영과 일괄 반영; 함수: {upsertFeature(), flushTileUpdates()}
        UDrawArg — tile mesh 원점 조회; 함수: {_cacheTiles.get()}
    동작:
        source 키와 대상 tile 목록을 정하고 대상이 없으면 끝낸다.
        tile마다 mesh 원점을 확보하고 payload를 만든 뒤 revision을 확정해 manager에 넣는다.
        manager가 변경을 알린 tile만 모아 돌려주고, 필요하면 한 번에 반영한다.

removeMeasureTerrainFeaturePayload(feature: UMeasureFeature, opt: MeasureTerrainSyncOption = {}) -> {changedTileKeys: Array<string>}
    역할: feature 하나를 점유 tile들의 source에서 빼고 필요하면 비어 있음을 확정한다.
    처리 기준:
        변경 종류가 `clear`·`replace`가 아니고 대상이 기본 source일 때만 revision을 새로 매긴다. 그 밖에는 revision과 identity를 넘기지 않는다.
        제거 후 남는 참조가 하나도 없으면 그 source를 비어 있음으로 확정한다.
    의존: UShaderTerrainDecalManager — feature 제거·대기 확정·일괄 반영; 함수: {removeFeature(), setTerrainTileSourcePending(), flushTileUpdates()}
    동작:
        식별자와 대상 tile 목록을 정하고 없으면 끝낸다.
        버전을 매길 기준이 되는 기본 source 키를 확인한다.
        tile마다 버전을 매길지 판단해, 매긴다면 제거 후 남을 참조로 revision을 확정한다.
        manager에서 feature를 빼고 변경이 있었던 tile만 모은다. 남은 참조가 없으면 비어 있음으로 확정한다.
        바뀐 tile마다 기록을 남기고 필요하면 한 번에 반영한다.

getMeasureTerrainFeatureRefsAfterRemoval(tileKey: string, sourceKey: string, featureId: string | number) -> Array<object>
    역할: 특정 feature를 뺐을 때 source에 남을 참조 목록을 미리 만든다.
    처리 기준: manager가 목록을 주면 그것을, 배열이 아니면 로컬 bound 목록을 기준으로 삼는다. 식별자 비교는 문자열로 맞춰 수행한다.
    의존: UShaderTerrainDecalManager — 현재 source feature 목록 조회; 함수: {getTerrainSourceFeatures()}
    동작: 기준 목록에서 대상 식별자를 뺀 참조들만 남겨 돌려준다.

clearMeasureTerrainMaterialPayloadSources(tileKey: string, opt: MeasureTerrainClearOption = {}) -> boolean
    역할: 이 레이어가 소유한 source에 한해 manager의 payload를 비운다.
    인터페이스: 한 번이라도 비우기를 요청했으면 true를 돌려준다.
    처리 기준:
        옵션에 source 키 목록이 있으면 그 대상만, 없으면 이 레이어의 두 source를 대상으로 한다.
        기본 source일 때만 revision과 identity를 함께 넘긴다.
        변경 종류가 `visibility`이면 기존 bound 목록으로 revision 후보만 쓰고 상태를 확정하지 않는다.
    의존: UShaderTerrainDecalManager — payload 제거; 함수: {clearTerrainMaterialPayload()}
    동작:
        대상 source 목록과 렌더 순서 옵션을 정한다.
        source마다 기본 source이면 revision과 identity를 계산해 덧붙이고 manager에 제거를 요청한다.

syncMeasureTerrainTileMaterial(tileKey: string, tileObject: Mesh) -> boolean
    역할: tile 하나의 binding 전체를 현재 원점 기준 payload로 다시 맞추거나 재질 재생을 요청한다.
    인터페이스: payload가 바뀌었거나 재생을 요청했으면 true를 돌려준다.
    처리 기준:
        숨김 상태이면 즉시 끝낸다. 늦게 도착한 콜백이 source를 다시 등록하지 못하게 막는다.
        이미 정착한 tile은 다시 맞추지 않는다.
        payload가 하나도 없으면 비어 있음으로 확정하고 제거를, 하나라도 있으면 전체 동기화를 수행한다.
        동기화 뒤에도 정착하지 않으면 재질 재생을 강제한다.
    의존:
        UShaderTerrainDecalManager — presentation 조회·대기 전이·payload 적용·재생 요청; 함수: {getTerrainTilePresentationState(), setTerrainTileSourcePending(), clearTerrainMaterialPayload(), syncTerrainTileFeatures(), requestTileRebuild()}
        UDrawArg — 부모 tile 키 조회; 함수: {_cacheTiles.get()}
    동작:
        기본 source 키를 확인하고 revision·identity·렌더 순서와 payload 목록을 준비한다.
        payload 요구 여부를 계산해 presentation을 묻고, 정착이 아니면 부모 tile 키와 함께 대기를 먼저 건다.
        payload가 없으면 비어 있음으로 내리고 제거를, 있으면 전체 동기화를 수행한 뒤 사용 가능으로 내린다.
        다시 물어 여전히 정착이 아니면 재질 재생을 강제하고 요청 사실을 돌려준다.

setMeasureTerrainTileSourcePending(tile: U3dQuadTile, pending: boolean, opt: object = {}) -> boolean
    역할: tile 객체를 받아 runtime source의 대기 상태를 manager에 전달한다.
    처리 기준: 옵션에 revision이 유한수로 들어오면 그 값을 쓰고, 아니면 현재 bound 목록으로 다시 계산한다. 뒤에 놓인 값이 옵션의 같은 이름 항목을 덮는다.
    의존: UShaderTerrainDecalManager — 대기 상태 반영; 함수: {setTerrainTileSourcePending()}
    동작: revision과 렌더 순서 옵션을 정하고 부모 tile 키·source 키·identity를 덧붙여 manager에 넘긴다.

스타일 해석 책임 그룹
역할: 레이어 기준 스타일과 feature 스타일, 호출자 override를 하나의 렌더 스타일로 합성한다.

resolveMeasureFeatureRenderStyle(feature: UMeasureFeature | undefined, overrides: object = {}) -> U3dShaderMeasureLayerRenderStyle
    역할: override, feature 스타일, 레이어 스타일, 레이어 기본값 순으로 최종 스타일을 만든다.
    처리 기준:
        수치는 유한수만 통과시키므로 문자열로 준 값은 무시된다.
        전체 불투명도를 override로 주면 채움·외곽선 불투명도를 개별로 주지 않는 한 그 값으로 맞춘다.
        표시 여부는 기본 true, 강조는 기본 false다.
    의존:
        UMeasureFeature — feature 스타일 조회; 함수: {getStyle()}
        defined — defined 사용; 함수: {defined()}
    동작:
        채움색은 `overrides.fillColor`, `featureStyle.fillColor`, `layerStyle.fillColor`, `defaultFillColor` 순으로 먼저 있는 값을 쓴다.
        외곽선색은 `overrides.strokeColor`, `featureStyle.strokeColor`, `layerStyle.strokeColor`, `defaultStrokeColor` 순으로 대체한다.
        표시 여부는 `overrides.visible`, `featureStyle.visible`, `layerStyle.visible` 순으로 찾고 모두 없으면 true를 쓴다.
        강조는 `overrides.highlight`, `featureStyle.highlight`, `layerStyle.highlight` 순으로 찾고 모두 없으면 false를 쓴다.
        굵기와 세 불투명도도 같은 우선순위로 정하고, 이 값들을 담은 객체를 돌려준다.

resolveMeasureFeatureStrokeWorldPadding(feature: UMeasureFeature, center: Vector3) -> number
    역할: 외곽선 굵기를 tile 교차 판정에 쓸 월드 좌표 여유값으로 환산한다.
    처리 기준: 굵기가 음수이거나 숫자가 아니면 0으로 본다. 강조 상태이면 굵기에 배수를 적용한다. 축척은 0으로 나누지 않도록 최소값으로 눌러 둔다.
    의존: UMathEngine — 중심 기준 실제 축척; 정적 함수: {getRealScaleAtGoogle()}
    동작: 최종 스타일의 굵기에 강조 배수와 여유 계수를 곱하고 축척으로 나눠 돌려준다.

normalizeMeasureStyleOverrides(style: U3dShaderMeasureLayerStyle = {}) -> object
    역할: OpenLayers 스타일 객체와 평면 스타일 입력을 부분 갱신용 평면 객체로 통일한다.
    처리 기준: 값이 있는 항목만 결과에 담으므로 지정하지 않은 키는 결과에 없다. 표시 여부 false나 불투명도 0도 값으로 보고 보존한다.
    의존:
        OpenLayers 스타일 객체 — 색·굵기 추출; 함수: {getFill(), getStroke(), getColor(), getWidth()}
        defined — defined 사용; 함수: {defined()}
    동작:
        채움은 `style.getFill?.()`를 먼저 보고, 없으면 `style.fill_`, 그다음 `style.fill` 순으로 대체한다.
        외곽선은 `style.getStroke?.()`를 먼저 보고, 없으면 `style.stroke_`, 그다음 `style.stroke` 순으로 대체한다.
        세 불투명도와 표시·강조 여부를 각각 값이 있을 때만 담아 돌려준다.

applyMeasureFeatureRenderStyle(feature: UMeasureFeature, style: U3dShaderMeasureLayerRenderStyle) -> void
    역할: feature의 스타일과 스타일 revision을 함께 갱신한다.
    처리 기준: revision을 스타일 적용보다 먼저 계산하므로 적용 과정에서 revision이 바뀌어도 반영되지 않는다. [확인 Q-007]
    의존: UMeasureFeature — 스타일·revision 갱신; 함수: {getRevision(), setStyle(), setStyleRevision()}
    동작: 현재 revision에 1을 더한 값을 미리 구하고 스타일을 넣은 뒤 그 값을 스타일 revision으로 설정한다.

applyMeasureLayerStyleToFeatures(overrides: object = {}) -> void
    역할: 주어진 override를 모든 feature에 합성해 적용한다.
    동작: feature 목록을 돌며 각 feature의 최종 스타일을 만들어 적용한다.

디버그 기록 책임 그룹
역할: 조건에 맞는 tile에 한해 measure·manager 상태를 콘솔로 남긴다.

shouldLogMeasureTerrainDebug(tileKey: string) -> boolean
    역할: 디버그 플래그와 tile 필터로 로그 출력 여부를 판정한다.
    처리 기준: 필터가 없으면 전체를 통과시킨다. 배열은 포함 여부, 집합은 보유 여부, 함수는 반환값이 정확히 true인지로 보고 함수가 예외를 던지면 출력하지 않는다. 그 밖에는 문자열 부분 일치로 본다.
    동작: 플래그가 켜져 있을 때만 필터 종류에 맞는 판정 결과를 돌려준다.

getMeasureTerrainDebugSnapshot(tileKey: string) -> object
    역할: 캐시 tile, manager 재질과 등록 정보, presentation 상태를 한 객체로 모은다.
    처리 기준: 활성 재질은 manager 재질을 우선하고 없으면 캐시 재질을 쓴다. 등록 정보가 없으면 그 항목은 비운다.
    의존:
        UShaderTerrainDecalManager — 재질·등록·presentation 조회; 함수: {getTerrainMaterial(), getTerrainTilePresentationState()}; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_TILE_FEATURE_MAP}
        UDrawArg — 캐시 tile과 mesh 재질 조회; 함수: {_cacheTiles.get()}
    동작: 캐시 tile과 manager 재질·등록 정보를 모으고 표시 여부, binding 개수, source 키와 revision, 재질 일치 여부, 텍스처 존재 여부를 담아 돌려준다.

logMeasureTerrainDebug(tileKey: string, stage: string, extra: object = undefined) -> void
    역할: 조건을 통과한 tile의 상태를 단계 이름과 함께 출력한다.
    처리 기준: 조건을 통과할 때만 상태를 수집한다. 추가 정보가 주어지면 함께 출력한다.
    의존: Web API — 콘솔 출력; 함수: {console.info()}
    동작: 출력 조건을 확인하고 통과하면 상태를 모아 단계 이름과 함께 출력한다.

getFeatureIdentityKey(feature: object) -> string | number | undefined
    역할: 측정 feature와 OpenLayers feature 모두에서 같은 규칙으로 식별자를 뽑는다.
    인터페이스: 후보가 하나도 없으면 undefined다.
    처리 기준: 측정 feature이면 `getId()`, `_fid`, `getUid()`, `_uid` 순으로, 그 밖에는 `getId()`, `id`, `ol_uid`, `_uid` 순으로 먼저 값이 있는 것을 쓴다.
    의존: UMeasureFeature — 종류 판별과 식별자 조회; 함수: {getId(), getUid()}; 속성 읽기: {_fid, _uid}
    동작:
        입력이 없으면 undefined를 돌려준다.
        측정 feature이면 측정 feature용 순서로, 아니면 일반 순서로 첫 유효 후보를 돌려준다.

createFeature(geom: object) -> OLFeature
    역할: OpenLayers geometry를 feature로 감싼다.
    의존: OpenLayers — feature 생성; 생성자: {new ol.Feature()}
    동작: 입력 geometry를 담은 OpenLayers feature를 만들어 돌려준다.

getSimpleFeatureObjectKey(uid: string) -> string
    역할: simple 객체의 캐시 키와 객체 이름을 만든다.
    동작: 고정 접두사에 UID를 붙인 문자열을 돌려준다.

_toColor(value: unknown, fallback: unknown) -> Color
    역할: 색상 입력을 항상 three.js Color로 맞춘다.
    처리 기준: 이미 Color이면 복제하지 않고 그 참조를 그대로 돌려주므로 호출자가 수정하면 원본이 함께 바뀐다.
    의존:
        three — 색상 생성; 생성자: {new Color()}
        defined — defined 사용; 함수: {defined()}
        THREE — THREE 사용; 생성자: {new Color()}
    동작: 입력이 Color이면 그대로, 값이 있으면 새 Color로 감싸고, 없으면 대체값을 같은 규칙으로 처리해 돌려준다.

_decimateVectors(vectors: Array<Vector3>, maxPoints: number) -> Array<Vector3>
    역할: 좌표 개수를 상한 이하로 균등 간격 샘플링한다.
    처리 기준: 상한 이하이면 원본 배열을 그대로 돌려준다. 샘플에서 빠진 마지막 원본 좌표는 참조 비교로 확인해 반드시 덧붙인다.
    동작: 개수가 상한 이하이면 원본을 돌려주고, 아니면 일정 간격으로 골라 담은 뒤 마지막 좌표가 빠졌으면 덧붙여 돌려준다.

getSimplePolygonLocalPoints(vectors: Array<Vector3>, origin: Vector3) -> Array<Vector3>
    역할: 다각형 정점을 원점 기준 로컬 좌표로 옮기고 닫힌 도형의 중복 끝점을 없앤다.
    처리 기준: 정점이 3개를 넘고 첫 점과 끝 점의 제곱거리가 정확히 0일 때만 끝점을 뺀다.
    의존: three — 좌표 생성과 거리 비교; 생성자: {new Vector3()}; 함수: {distanceToSquared()}
    동작: 정점마다 원점을 뺀 새 좌표를 만들고, 조건을 만족하면 마지막 좌표를 뺀 목록을 돌려준다.

createSimplePolygonFillGeometry(points: Array<Vector3>) -> BufferGeometry
    역할: 로컬 정점을 2차원으로 삼각분할해 z 높이를 유지한 채움 geometry를 만든다.
    처리 기준: 삼각분할은 x, y만 쓰지만 정점 위치는 원본 3차원 좌표를 그대로 써서 높이가 보존된다.
    의존:
        three — 삼각분할과 버퍼 geometry; 생성자: {new Vector2(), new BufferGeometry()}; 정적 함수: {ShapeUtils.triangulateShape()}; 함수: {setFromPoints(), setIndex(), computeVertexNormals()}
        THREE — THREE 사용; 생성자: {new BufferGeometry()}; 함수: {ShapeUtils.triangulateShape()}
    동작: x, y 윤곽선으로 삼각형 인덱스를 얻고, 원본 좌표로 정점을 채운 뒤 인덱스와 법선을 설정해 돌려준다.

createSimpleOcclusionMeshGroup(geometry: BufferGeometry, position: Vector3, color: Color, opacity: number, name: string) -> Group
    역할: 같은 geometry로 전면용과 가림용 mesh 두 개를 만들어 한 그룹에 담는다.
    처리 기준: 두 mesh가 geometry를 공유하므로 해제는 그룹 단위로 한 번만 해야 한다.
    의존:
        three — 그룹 생성; 생성자: {new Group()}; 함수: {position.copy(), add()}
        THREE — THREE 사용; 생성자: {new Group()}
    동작: 그룹에 이름과 위치를 설정하고 전면·가림 mesh를 차례로 담아 돌려준다.

createSimpleMesh(geometry: BufferGeometry, color: Color, opacity: number, name: string, hidden: boolean) -> Mesh
    역할: 전면인지 가림인지에 맞는 깊이 설정을 가진 mesh 하나를 만든다.
    처리 기준: 가림용은 깊이 비교를 뒤집고 불투명도를 낮추며 표면 겹침 보정을 끈다.
    의존:
        three — mesh와 깊이 상수; 생성자: {new Mesh()}; 상수: {GreaterDepth, LessEqualDepth}
        THREE — THREE 사용; 생성자: {new Mesh()}
    동작: 표시 불투명도를 구하고 깊이 비교 함수와 겹침 보정 여부를 정해 재질을 만든 뒤 mesh에 이름을 붙여 돌려준다.

createSimpleMeshMaterial(color: Color, opacity: number, depthFunc: number, polygonOffset: boolean) -> MeshBasicMaterial
    역할: simple 측정 면에 쓰는 기본 재질을 만든다.
    처리 기준: 불투명도가 1 미만일 때만 투명 처리를 켜고, 깊이 쓰기는 항상 끈다.
    의존:
        three — 기본 재질; 생성자: {new MeshBasicMaterial()}; 상수: {DoubleSide}
        THREE — THREE 사용; 생성자: {new MeshBasicMaterial()}
    동작: 색·불투명도·깊이 비교·겹침 보정 값을 담은 양면 재질을 만들어 돌려준다.

createSimpleLineLoop(geometry: object, color: Color, opacity: number, name: string, hidden: boolean) -> LineSegments | LineSegments2
    역할: 전면은 두꺼운 선으로, 가림면은 점선으로 외곽선 객체를 만든다.
    처리 기준: 전면과 가림면이 요구하는 geometry 종류가 다르므로 호출자가 맞춰 넘겨야 한다. 가림면은 점선 표시를 위해 선 거리 계산을 수행한다.
    의존:
        three — 선 객체와 점선 재질; 생성자: {new LineSegments(), new LineDashedMaterial()}; 상수: {GreaterDepth, LessEqualDepth}; 함수: {computeLineDistances()}
        LineMaterial — 두꺼운 선 재질; 생성자: {new LineMaterial()}
        LineSegments2 — 두꺼운 선 객체; 생성자: {new LineSegments2()}
        THREE — THREE 사용; 생성자: {new LineDashedMaterial(), new LineSegments()}
    동작: 표시 불투명도와 깊이 비교를 정하고, 가림면이면 점선 재질과 일반 선 객체를, 전면이면 두꺼운 선 재질과 객체를 만든 뒤 이름을 붙여 돌려준다.

getSimpleRenderOpacity(opacity: number, hidden: boolean) -> number
    역할: 가림면 불투명도를 줄이고 상·하한으로 묶는다.
    처리 기준: 전면이면 입력값을 그대로 쓴다. 0 이하이면 완전 투명을 유지한다.
    의존:
        defaultValue — defaultValue 사용; 함수: {defaultValue()}
    동작: 전면이면 입력을 돌려주고, 0 이하이면 0을, 아니면 계수를 곱한 뒤 하한과 상한 사이로 눌러 돌려준다.

shouldIncludeMeasureFeatureInTileBounds(feature: UMeasureFeature, bound: Array<number>, padding: number = 0) -> boolean
    역할: feature가 여유를 더한 tile 범위와 실제로 교차하는지 타입별로 판정한다.
    처리 기준:
        범위를 해석할 수 없거나 좌표를 얻을 수 없으면 누락보다 과포함을 택해 true를 돌려준다.
        geometry가 범위 교차 판정을 제공하고 그 결과가 정확히 false일 때만 즉시 제외한다.
        여유값이 음수이거나 숫자가 아니면 0으로 본다.
        면·선 외의 타입은 모두 포함으로 본다.
    의존:
        UMeasureFeature — geometry·타입·좌표 조회; 함수: {getGeometry(), getType(), getGoogleCoordinates(), getMeasureVectors(), intersectsExtent()}
        UDEF — 측정 종류 상수; 상수: {MEASURE_TYPE.{POLYGON, MULTIPOLYGON, LINESTRING, MULTILINESTRING}}
    동작:
        tile 경계를 숫자 범위로 바꾸고, 바꿀 수 없으면 포함으로 본다.
        여유값만큼 네 방향으로 넓힌 범위와 그 네 꼭짓점으로 만든 사각형을 준비한다.
        면 유형이면 다각형 교차를, 선 유형이면 선 교차를 판정해 돌려준다.

measureTileBoundsToExtent(bound: Array<number>) -> Array<number> | undefined
    역할: tile 경계 배열을 유한값 검증을 거친 숫자 범위로 정규화한다.
    처리 기준: 네 값 중 하나라도 유한수가 아니면 범위를 만들지 않는다. 최소·최대 대소 관계는 검사하지 않는다.
    동작: 네 값을 꺼내 모두 유한수일 때만 새 숫자 배열로 만들어 돌려준다.

doesMeasurePolygonIntersectTile(points: Array<Vector3Like>, tilePolygon: Array<object>) -> boolean
    역할: 측정 다각형과 tile 사각형이 포함 또는 변 교차 관계인지 판정한다.
    처리 기준: 정점이 3개보다 적으면 다각형으로 보지 않는다. 두 도형 모두 닫힌 것으로 보고 마지막 변까지 검사한다.
    동작: 측정 정점이 tile 안에 있는지, tile 꼭짓점이 측정 다각형 안에 있는지, 두 도형의 변이 교차하는지 차례로 보고 하나라도 성립하면 true를 돌려준다.

doesMeasureLineIntersectTile(points: Array<Vector3Like>, tilePolygon: Array<object>) -> boolean
    역할: 측정 선이 tile 안에 있거나 tile 변과 교차하는지 판정한다.
    처리 기준: 정점이 2개보다 적으면 선으로 보지 않는다. 선은 닫지 않으므로 마지막 점에서 첫 점으로 돌아오는 구간은 검사하지 않는다.
    동작: 선의 점이 tile 안에 있는지 보고, 각 구간을 tile 네 변과 교차 검사해 하나라도 성립하면 true를 돌려준다.

isMeasurePointInPolygon(point: object, polygon: Array<object>) -> boolean
    역할: 수평 반직선 교차 횟수로 점이 다각형 내부인지 판정한다.
    처리 기준: 분모에 아주 작은 값을 더해 수평 변에서 0으로 나누는 것을 막는다. 경계에 정확히 걸친 점은 내부로 세지 않는다.
    동작:
        점이 없거나 polygon이 배열이 아니거나 정점이 하나도 없으면 곧바로 false를 돌려준다.
        마지막 정점부터 변을 닫아 돌며 y 구간을 가로지르는 변에서 교차 x를 구하고, 점보다 오른쪽이면 교차 수를 올린다.
        최종 판정은 `intersections % 2 === 1`이며 교차 수가 홀수이면 true, 짝수이면 false를 돌려준다.

doMeasureSegmentsIntersect(p1: object, p2: object, q1: object, q2: object) -> boolean
    역할: 두 선분의 일반 교차와 공선 접촉을 모두 판정한다.
    동작: 네 방향값을 구해 일반 교차 조건을 먼저 보고, 공선인 경우마다 해당 점이 상대 선분의 범위 안에 있는지 확인한다.

getMeasureOrientation(a: object, b: object, c: object) -> number
    역할: 세 점의 회전 방향을 외적 부호로 분류한다.
    인터페이스: 공선이면 0, 한쪽 방향이면 1, 반대 방향이면 2를 돌려준다.
    처리 기준: 외적 절댓값이 아주 작은 임계 미만이면 공선으로 본다.
    동작: 두 벡터의 외적을 구해 임계와 비교한 뒤 세 값 중 하나로 분류해 돌려준다.

isMeasurePointOnSegment(a: object, b: object, c: object) -> boolean
    역할: 이미 공선으로 판정된 점이 선분의 경계 상자 안에 있는지 확인한다.
    처리 기준: 네 비교 모두 아주 작은 허용 오차를 더해 경계 접촉을 포함으로 본다. 공선 여부는 호출자가 먼저 보장해야 한다.
    동작: 점의 x, y가 선분 양 끝의 최소·최대 범위 안에 있는지 네 조건을 모두 확인해 돌려준다.

normalizeMeasureGeometryMode(mode: unknown) -> U3dShaderMeasureGeometryMode
    역할: 임의 입력을 렌더링 방식 문자열로 정규화한다.
    처리 기준: 값이 없거나 `simple`이 아닌 모든 입력은 `basic`이 된다. `auto`도 `basic`으로 바뀐다. 대소문자는 구분하지 않는다.
    의존:
        defined — defined 사용; 함수: {defined()}
    동작: 입력을 소문자 문자열로 바꿔 `simple`이면 그대로, 아니면 `basic`을 돌려준다.

U3dShaderMeasureGeometryMode 타입 정의
    'basic' | 'simple' | 'auto'
    측정 도형을 그리는 방식이다. `basic`은 지형 표면 합성, `simple`은 직접 만든 3D 객체이며 `auto`는 `basic`으로 정규화되는 예전 입력값이다.

MeasureFeatureCollection extends Array<UMeasureFeature> 부분 타입 명세
    이 명세에서 사용하는 필드:
        addFeature?: function(unknown): unknown
            측정 feature를 레이어에 추가하고 입력을 그대로 돌려준다. 추가에 실패하면 예외를 던진다.
        getFeatureById?: function(unknown): (undefined | UMeasureFeature)
            ID로 측정 feature를 찾는다.
    두 도우미는 레이어가 source를 초기화한 뒤에만 존재하므로 그 전에는 배열로만 쓸 수 있다.

U3dShaderMeasureLayerCO 타입 정의
    U3dLayerCO & U3dShaderMeasureLayerCO_Content
    기반 레이어 옵션에 이 레이어 고유 옵션을 합친 생성자 옵션이다.

U3dShaderMeasureLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        ext?: string = '.png'
        reverseX?: boolean = false
        reverseY?: boolean = false
        maxUpdateQueue?: number = 200
        lineTension?: number = 0
        version?: string = '2.0'
        minLevel?: number = 12
        maxLevel?: number = 19
            tile binding을 만들 level 범위다.
        fillColor?: ColorLike = 'rgb(0,170,0)'
        strokeColor?: ColorLike = 'rgb(255,255,0)'
        strokeWidth?: number = 1
        opacity?: number = 1
            레이어 기준 스타일이자 스타일 해석의 최종 기본값이다.
        terrainDebugEnabled?: boolean = false
        terrainDebugTileFilter?: string | Array<string> | Set<string> | U3dShaderMeasureTerrainDebugFilter
        useSimpleMeasure?: boolean = true
            초기 렌더링 방식을 정할 때만 쓰이며 `measureGeometryMode`가 있으면 그쪽이 우선한다.
        measureGeometryMode?: U3dShaderMeasureGeometryMode
        simpleGeometryLengthThreshold?: number = 5000
        simpleGeometryLineMaxPoints?: number = 512
        simpleGeometryCircleSegments?: number = 64
    소문자 별칭 `maxupdatequeue`, `minlevel`, `maxlevel`, `measuregeometrymode`, `renderorder`도 받으며 생성자가 카멜 표기로 정규화한다.

U3dShaderMeasureTerrainDebugFilter 함수 타입 정의
    (tileKey: string) -> boolean
    인터페이스: 그 tile의 디버그 기록을 허용하면 true를 돌려준다. 예외를 던지면 기록하지 않는다.

U3dShaderMeasureFeatureStyleTarget 타입 정의
    UMeasureFeature | Array<UMeasureFeature>
    스타일을 바꿀 대상 하나 또는 여러 개다.

U3dShaderMeasureFillStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        color?: ColorLike
        color_?: ColorLike
        getColor?: function(): ColorLike
    세 가지를 함께 주면 `getColor()`, `color_`, `color` 순으로 먼저 값이 있는 것을 쓴다.

U3dShaderMeasureStrokeStyle extends U3dShaderMeasureFillStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        width?: number
        width_?: number
        getWidth?: function(): number
    두께는 `getWidth()`, `width_`, `width` 순으로 먼저 값이 있는 것을 쓴다.

U3dShaderMeasureLayerStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        fill?: U3dShaderMeasureFillStyle
        stroke?: U3dShaderMeasureStrokeStyle
        fill_?: U3dShaderMeasureFillStyle
        stroke_?: U3dShaderMeasureStrokeStyle
        getFill?: function(): (U3dShaderMeasureFillStyle | null)
        getStroke?: function(): (U3dShaderMeasureStrokeStyle | null)
        fillColor?: ColorLike
        strokeColor?: ColorLike
        strokeWidth?: number
        opacity?: number
        fillOpacity?: number
        strokeOpacity?: number
        visible?: boolean
        highlight?: boolean
    같은 값을 여러 방식으로 주면 조회 함수, 내부 필드, 하위 객체, 평면 필드 순으로 읽는다.

U3dShaderMeasureLayerRenderStyle 타입 정의
    fillColor: ColorLike, strokeColor: ColorLike, strokeWidth: number, opacity: number
    fillOpacity?: number, strokeOpacity?: number, visible?: boolean, highlight?: boolean
    여러 입력을 하나로 정리한 실제 그리기용 스타일이다. 개별 불투명도가 있으면 그 부분에는 전체 불투명도 대신 개별 값이 쓰이며 두 값을 곱하지 않는다.

U3dShaderMeasureTileBound 타입 정의
    key: string, level: number, featureId: string, extent: Array<number>, type: string
    parentKey?: string
    feature와 tile의 교차 결과를 담는 레코드다. `extent`는 월드 좌표(EPSG:3857) 기준 `[minX, minY, maxX, maxY]` 순서이며, `parentKey`는 최대 level이 기본값과 다를 때만 채워진다.

U3dShaderMeasureExtent 타입 정의
    UMeasureFeatureExtent
    측정 feature나 tile의 평면 범위를 나타내는 최소 표면 타입이며 정의는 `UMeasureFeature`가 소유한다.

UFeatureIDExtent 타입 정의
    featureId: string, extent: UMeasureFeatureExtent
    측정 feature 하나의 식별자와 그 범위를 묶은 항목이다.

U3dShaderMeasureLayerAddFeatureCO 타입 정의
    geoList: Array<Vector3>
    `addFeature()`에 넘기는 옵션이며 좌표는 위경도 좌표계(EPSG:4326)다. 이 좌표로 만든 다각형을 레이어에 추가하고 편집 중 다각형과 겹치는지 비교하는 데만 쓴다.

U3dShaderMeasureOLFeature 부분 타입 명세
    이 명세에서 사용하는 필드:
        getId?: function(): (string | number)
        setId?: function(string | number): void
        getGeometry?: function(): object
        setGeometry?: function(object): void
        getGeoVertex?: function(): Array<Vector3Like>
        _style?: U3dShaderMeasureLayerStyle
        _nonChanged?: boolean
        _excludeSearch?: boolean
        _styleRevision?: number
        _drawSequence?: number
        _isInner?: boolean
        id?: string | number
        ol_uid?: string | number
        _uid?: string | number
    이 레이어가 실제로 읽고 쓰는 OpenLayers feature 표면만 모은 타입이다. 식별자는 `getId()`, `id`, `ol_uid`, `_uid` 순으로 먼저 값이 있는 것을 쓴다.

MeasureTerrainSyncOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        sourceKey?: string
        changeType?: string = 'feature'
            `feature`, `add`, `remove`, `replace`, `clear`, `dispose`, `modeTransition`, `visibility` 중 하나다.
        deferFlush?: boolean = false
            참이면 이 호출에서 일괄 반영을 하지 않고 호출자가 모아 한 번에 반영한다.
        tileKeys?: Array<string>
        sourceRevision?: number
        sourceIdentity?: TerrainSourceIdentity
            호출자가 이미 확정한 값을 넘겨 재계산을 건너뛴다.

MeasureTerrainClearOption extends MeasureTerrainSyncOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        sourceKeys?: Array<string>
            비울 대상을 이 목록으로 한정한다. 없으면 이 레이어의 두 source를 모두 비운다.
        origin?: Vector3Like
        geometry?: BufferGeometry
            비울 tile의 mesh 원점과 geometry를 manager에 함께 넘긴다.
        immediateFlush?: boolean
            참이면 미루지 않고 그 자리에서 tile을 다시 만들게 한다.

MeasureTerrainFeaturePayload 타입 정의
    TerrainFeature
    terrain decal manager에 넘기는 측정 feature payload이며 구조는 manager 쪽 타입이 소유한다.

U3dShaderMeasureFeatureRef 타입 정의
    featureId: string | number
    feature 전체 대신 식별자만 담아 넘기는 가벼운 참조다.

U3dShaderMeasureSourceRevisionState 타입 정의
    signature: number, revision: number
    tile 하나의 measure source 내용 해시와 그 내용에 대응하는 단조 증가 revision이다.

terminalSourceState 부분 타입 명세
    이 명세에서 사용하는 필드:
        sourceRevision?: number
        sourceIdentity?: TerrainSourceIdentity
        sourceStatus?: string
            `available`, `confirmed-empty`, `failed` 중 하나다.
        sourceErrorReason?: string
```

## 4. 공통 처리 기준과 제약

```spec
이 레이어의 공개 판정 메서드(`isTile*`)는 어느 것도 레이어 상태를 바꾸지 않는다. 상태를 바꾸는 것은 `addTileFromScene()`, `removeTileFromScene()`, `suspendTilePresentation()`과 payload 반영 경로뿐이다.
레이어가 숨김이거나 이 tile에 관여하지 않으면 표시 판정은 중립으로 통과시켜 다른 레이어의 LOD 전환을 막지 않는다. 단, `isTileRenderableReady()`와 `isTilePresentationVisible()`은 tile 키가 없거나 폐기된 경우에만 false를 돌려준다.
manager나 그 메서드가 없으면 판정은 보수적으로 동작한다. 동기화 필요 여부는 필요함으로, feature 존재 여부는 없음으로 답한다.
`_measurePoints`는 위경도 좌표계(EPSG:4326), `_measureVectors`는 월드 좌표(EPSG:3857)이며 두 배열은 같은 인덱스로 대응한다. 입력 메서드는 두 배열을 항상 함께 갱신한다.
좌표를 다루는 메서드는 이름으로 계열을 구분한다. `getFeature*` 계열의 길이·면적·반경은 월드 좌표 평면 값이고, `getMeasure*` 계열은 지표 거리 기준 미터 값이다.
terrain payload를 반영하는 함수는 `deferFlush`가 참이면 일괄 반영을 하지 않는다. 호출자가 여러 feature·tile의 변경을 모아 한 번만 반영해야 중간 상태가 화면에 보이지 않는다.
tile source revision은 내용 해시가 달라질 때만 1씩 오른다. 같은 내용으로 다시 반영해도 revision은 유지된다.
simple 경로의 전면·가림 객체 쌍은 같은 geometry를 공유한다. 해제는 그룹 단위로 한 번만 수행해야 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
