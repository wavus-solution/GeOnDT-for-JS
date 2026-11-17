# U3dVectorPBFLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dVectorPBFLayer`는 PBF(Protocol Buffers) 타일을 캔버스 이미지가 아닌 벡터 피처로 가시화하는 레이어다. 타일 다운로드와 MVT 디코드는 `U3dImagePBFLayer`가 소유한 워커(`UPbfParserTask`)를 공유하고, 디코드 결과를 EPSG:3857 좌표의 GeoJSON 형태 피처로 변환해 기반 클래스 `U2dVectorShaderLayer`의 스타일 적용·타일 캐시·terrain decal payload 생성 흐름에 그대로 넘긴다.

### 1.2 책임 범위

- 타일에 대응하는 PBF 소스 타일(x, y, level)을 결정하고 URL을 만든다. `realMaxLevel`을 넘는 타일은 그 레벨의 부모 타일을 소스로 사용한다.
- 워커 요청을 소스 타일 단위로 공유하고, 대기 타일이 모두 취소되면 워커의 다운로드를 중단한다.
- 레이어 이름·점 필터와 월드 타일 경계를 Worker에 전달해 형상·좌표 전처리를 수행한다. 메인 스레드는 사용자 피처 필터·우선순위와 외곽/홀 그룹을 적용하고 평탄 좌표를 소스 타일 단위로 캐시한다. 이전 로컬 좌표 응답도 기존 변환으로 처리한다.
- 내부 일괄 버퍼 전송을 요청하고 속성 필터·우선순위를 처리한 뒤 소비할 피처만 기존 좌표·파트·외곽선 뷰로 복원한다. 제외한 레이어도 전역 피처 순번을 이동하여 위치 표의 대응을 유지한다. 배치 좌표계와 레이어의 월드 표식이 다르면 오류로 처리한다. 기존 피처별 응답과 JS 대체 응답도 계속 처리한다.
- 타일 자르기로 생긴 ring 변을 외곽선에서 제외한다. MVT는 타일마다 폴리곤을 잘라 넣으므로 자른 자리의 변이 ring에 남는데, 그 변까지 외곽선으로 그리면 화면에 타일 격자가 선으로 보인다. 자르기 변이 있는 coverage는 면의 외곽선을 끄고, 남은 실제 경계 구간만 별도 LineString 피처로 내보낸다.
- 피처마다 LOD 우선순위(`lodPriority`)를 붙여 기반 클래스가 타일당 피처 상한을 적용할 때 남길 순서를 정할 수 있게 한다.
- ol 규격의 스타일 함수 결과를 기반 클래스가 읽는 스타일 상태 객체로 정규화한다. Point 는 image(Circle)·text 의 fill/stroke 를 원 색으로 사용한다.
- 책임 경계: 피처의 material·terrain decal 생성, 타일 상태 전이, 표시·숨김과 dispose의 공통 처리는 기반 클래스 `U2dVectorShaderLayer`가 담당한다. MVT 바이너리 디코드는 워커 `UPbfParserTask.loadPbfFeatures()`가 담당한다.

### 1.3 주요 동작 방식

기반 클래스의 `createTexture()`가 타일마다 `createTileSourceRequest()`를 호출해 소스 요청의 실행·취소 함수를 받고, 그 요청을 자신의 terrain WFS 요청 큐에 등록한다. 이 레이어는 소스 타일을 결정한 뒤 소스 피처 캐시를 먼저 조회하고, 없으면 같은 소스 타일의 진행 중 요청에 합류하거나 워커에 `loadPbfFeatures`를 요청한다. 응답을 3857 좌표의 소스 피처로 변환·필터링해 캐시하고, 대상 타일 영역과 교차하는 피처에 타일 키를 붙인 id와 미리 계산한 스타일을 담아 `{features}` 로 반환한다. 서버가 404로 응답한 타일은 빈 피처 목록으로 확정하고, 그 밖의 실패는 오류로 올려 기반 클래스가 재시도를 예약하게 한다. 이후 기반 클래스가 ring 분할·스타일 적용을 수행하고 `_drawCache`에 저장한 뒤 terrain decal payload를 만든다. 요청 큐 등록, 취소 핸들, source pending 부기와 재시도 판정은 모두 기반 클래스가 담당한다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.image.U3dVectorPBFLayer`로 등록되어 예제 `tutorial-official/imagePbfLayers.html`의 `User Vector PBF` 레이어가 이 클래스를 생성한다.
- `U2dVectorShaderLayer`는 `createTileSourceRequest()`를 호출하는 기반 클래스이며 반환된 피처를 `expandFetchedTileFeatures()`, 스타일 적용, `processMaterial()`로 처리한다.
- `U3dImagePBFLayer.g_TaskProcessor`는 워커 `UPbfParserTask`를 실행하는 공유 `UTaskProcessor`다.
- `UPbfParserTask.loadPbfFeatures()`와 `UPbfParserTask.abort()`는 워커에서 PBF 다운로드·디코드와 중단을 수행한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
예제 imagePbfLayers.html 의 PBF 타일 소스와 ol 규격 스타일 함수(createMapboxStreetsV6Style)로 Polygon·LineString 피처가 벡터로 가시화되어야 한다.
Polygon 의 홀(내부 ring)은 기반 클래스의 ring 분할을 거친 뒤 대응 외곽 ring 과 같은 합성 그룹으로 묶여, 그 외곽이 채운 영역을 지우는 홀로 그려져야 한다.
Point·MultiPoint 피처는 drawPoints 가 켜져 있으면 원으로 그리며, 반경은 스타일의 Circle 이미지 반경(px × 소스 레벨 해상도)이 있으면 그 값을, 없으면 pointRadius 옵션(3857 단위)을 사용한다.
텍스트 라벨과 아이콘 이미지는 그리지 않는다. 면·선에 텍스트 전용 스타일, 점에 아이콘 전용 스타일만 있으면 그 피처는 그리지 않는다.
포함·제외 MVT 레이어 이름 목록과 피처 단위 필터로 그릴 피처를 제한할 수 있어야 하며, 필터 변경은 표시 중인 타일에도 다시 적용되어야 한다.
한 타일의 작업이 취소되어도 같은 소스 타일을 기다리는 다른 타일이 있으면 워커 다운로드를 유지하고, 마지막 대기 타일이 취소되면 워커 다운로드를 중단해야 한다.
같은 원본 피처가 인접 타일에 잘린 조각으로 반복 등장하므로 타일마다 고유한 피처 id 를 부여해 기반 클래스가 다른 타일의 조각을 재사용하지 않아야 한다.
스타일 함수가 빈 배열이나 fill·stroke 없는 스타일만 반환한 피처는 그리지 않는다.
서버가 404 로 응답한 소스 타일은 데이터 없음으로 확정해 빈 피처 목록으로 완료하고 캐시하며, 그 밖의 네트워크·HTTP·디코드 실패는 오류로 올려 기존 화면을 지우지 않고 재시도하게 한다.
타일 경계를 따라 달리는 ring 변은 타일 자르기 흔적이므로 외곽선으로 그리지 않아야 하며, 화면에 타일 격자가 선으로 보이면 안 된다.
자르기 변을 뺀 나머지 실제 경계 구간은 끊기지 않고 그대로 그려져야 한다. 구간의 끝점이 타일 경계에 닿는 것은 정상이다.
자르기 변이 있는 면과 그 외곽선 선 피처는 같은 LOD 선별 묶음(`lodGroupKey`)을 가져 한쪽만 남지 않아야 한다.
그 둘은 합성 순서 identity(`compositionFeatureId`)를 공유하지 않아야 한다. 공유하면 서로 다른 payload 가 같은 합성 순서를 갖게 되어 tile 이 `revision-not-applied` 에서 정착하지 못한다.
외곽선만 있고 채움이 없는 면은 자르기 변을 뺀 뒤 그릴 것이 없으므로 면 피처를 만들지 않는다.
featurePriority 가 주어지면 기반 클래스의 타일당 피처 상한(terrainLodProfile.maxFeatures)에서 값이 큰 피처부터 남아야 한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dVectorPBFLayer extends U2dVectorShaderLayer 클래스 정의
    의존:
        U2dVectorShaderLayer — 타일 기반 벡터 피처 처리 흐름 제공; 상속: {U2dVectorShaderLayer}

    static OPT_KEYS: Array<string> = U2dVectorShaderLayer.OPT_KEYS + ['realMaxLevel', 'featureCacheSize', 'includeLayers', 'excludeLayers', 'featureFilter', 'featurePriority', 'drawPoints', 'pointRadius', 'needJson']
        normalizeOptionKeys 가 대소문자 무관 옵션 키를 정규화할 때 사용하는 키 목록
        의존: U2dVectorShaderLayer — 기반 생성 옵션 key 재사용; 속성 읽기: {OPT_KEYS}

    #sourceFeatureCache: LRUCache
        소스 타일 키별 변환·필터링이 끝난 피처(U3dVectorPBFSourceFeature 목록)와 근사 byteLength 를 보관하는 캐시

    #pendingSourceRequests: Map<string, U3dVectorPBFSourceRequest> = 빈 Map
        소스 타일 키별 진행 중 워커 요청. 응답 또는 실패로 종료되면 제거된다.

    _needJson: boolean = true
        metadata.json으로 레벨·영역을 보완할지 여부이며 needJson 옵션이 false일 때만 끈다.
    #pbfMetadataReady: boolean = true
        생성자에서 !needJson으로 확정하고, 메타데이터 성공 또는 실패가 확정되면 true로 바꾼다.
    #pbfMetadataRequested: boolean = false
        초기화를 반복하더라도 메타데이터 요청은 한 번만 시작하기 위한 기록이다.
    #pbfMetadataRequest: ReturnType<typeof requestPbfMetadata> | undefined
        해제할 때 취소할 진행 중 메타데이터 요청이다.
    #explicitOptions: PbfMetadataExplicitOptions = {realMaxLevel: false, extent: false}
        부모가 기본값을 채우기 전에 보관한 realMaxLevel·영역 옵션의 명시 여부이다.
    #pendingPresentation: Map<string, {tile: U3dQuadTile, controller: AbortController}> = 빈 Map
        타일 키별 합성 완료 후 표시 재시도 대기이며 같은 키의 새 타일은 이전 대기를 취소한다.
    #visibleTilePreparation: AbortController | undefined
        이미 보이는 타일의 누락 소스를 순차 준비하는 작업의 취소 제어기이다.

    #userStyleFunction: U3dVectorPBFStyleFunction | undefined
        생성 옵션으로 받은 ol 규격 스타일 함수

    #includeLayers, #excludeLayers: Set<string> | undefined
        포함·제외할 MVT 레이어 이름 집합이며 undefined 는 제한 없음을 뜻한다.

    #featureFilter: U3dVectorPBFFeatureFilter | undefined
        피처 단위 필터 함수

    #featurePriority: U3dVectorPBFFeaturePriority | undefined
        피처별 LOD 우선순위 함수이며 없으면 모든 피처가 기본 우선순위(0)다.

    #drawPoints: boolean = true
        Point·MultiPoint 피처를 원으로 그릴지 여부

    #pointRadius: number = 10
        스타일에 Circle 반경이 없을 때 Point 원의 반경 (EPSG:3857 단위)

    _realMaxlevel: number = 0
        서버가 실제 제공하는 최대 타일 레벨. 생성자에서 옵션 또는 _maxlevel 로 확정한다.

    _classtype: string = 'U3dVectorPBFLayer'
        레이어 종류 식별 문자열이며 생성자가 기록한다.

    _styleFunction: ((feature: U3dVectorPBFTileFeature) -> U3dVectorPBFStyleState | undefined) | undefined
        기반 클래스가 피처마다 호출하는 스타일 조회 함수다. 사용자 스타일 함수가 있으면 타일 피처에 미리 계산해 둔 `_pbfStyle` 을 돌려주고, 없으면 undefined 로 두어 기반 레이어 기본 스타일을 쓴다.

    constructor(opt: U3dVectorPBFLayerCO)
        역할: 옵션을 검증·정규화하고 기반 레이어를 초기화한 뒤 PBF 전용 상태와 스타일 함수 연결을 준비한다.

        인터페이스:
            opt.baseUrl: `{z}`, `{x}`, `{y}`, `{-x}`, `{-y}` 토큰을 가진 PBF 타일 URL 템플릿이며 필수다.
            opt.realMaxLevel: 실제 제공 최대 레벨이며 생략하면 기반 레이어의 _maxlevel 을 사용한다.
            opt.featureCacheSize: 소스 피처 캐시 크기(타일 개수 단위)이며 생략하면 200 을 사용한다.
            opt.includeLayers, opt.excludeLayers: 포함·제외 MVT 레이어 이름 배열이며 빈 배열은 제한 없음과 같다.
            opt.featureFilter: (layerName, properties, mvtType) -> boolean 피처 필터
            opt.featurePriority: (layerName, properties, mvtType) -> number LOD 우선순위 함수
            opt.styleFunction: (feature, resolution) -> ol.style.Style | Array<ol.style.Style> | 스타일 상태 객체
            opt.drawPoints: Point 피처를 원으로 그릴지 여부이며 false 가 아니면 true 다.
            opt.pointRadius: Point 원의 기본 반경(3857 단위)이며 생략하면 10 을 사용한다.
            opt.needJson: metadata.json으로 레벨·영역을 보완할지 여부이며 false일 때만 생략한다.

        처리 기준:
            baseUrl 이 비어 있지 않은 문자열이 아니면 기반 생성자 호출 전에 TypeError 를 던진다.
            includeLayers·excludeLayers 가 문자열 배열이 아니거나 featureFilter·featurePriority 가 함수가 아니면 기반 생성자 호출 전에 TypeError 를 던진다.
            pointRadius 가 정의되어 있고 0 보다 큰 유한수가 아니면 기반 생성자 호출 전에 RangeError 를 던진다.
            기반 클래스는 _styleFunction에 피처와 타일 문맥을 전달한다. 이 레이어는 그중 피처의 미리 계산한 `_pbfStyle`만 돌려주는 함수로 교체한다. 사용자 스타일 함수가 없으면 _styleFunction을 undefined로 두어 기반 레이어 기본 스타일을 사용한다.

        의존:
            normalizeOptionKeys — 옵션 키 정규화; 함수: {normalizeOptionKeys()}
            defaultValue — 선택 옵션 기본값 적용; 함수: {defaultValue()}
            defined — pointRadius·스타일 함수 존재 여부 판정; 함수: {defined()}
            U2dVectorShaderLayer — 기반 레이어 초기화와 최대 레벨 사용; 생성자: {new U2dVectorShaderLayer()}; 속성 읽기: {_maxlevel}
            LRUCache — 소스 피처 캐시 생성; 생성자: {new LRUCache()}

        동작:
            옵션 키를 정규화하고 baseUrl 과 필터·우선순위 옵션을 검증한 뒤 pointRadius 범위를 검사한다.
            realMaxLevel 및 rectangle·extent·geoExtent의 명시 여부를 보관한 뒤 기반 생성자를 호출하고 _classtype 을 'U3dVectorPBFLayer' 로 기록한다.
            #explicitOptions에 명시 여부를 저장하고, _needJson과 그 반대 값인 #pbfMetadataReady를 확정한다.
            _realMaxlevel 과 #sourceFeatureCache 를 옵션 또는 기본값으로 만든다.
            포함·제외 레이어 이름 배열을 Set 으로 바꿔 저장하고 featureFilter, featurePriority, drawPoints, pointRadius 와 styleFunction 을 보관한다.
            사용자 스타일 함수 유무에 따라 _styleFunction 을 `_pbfStyle` 반환 함수 또는 undefined 로 설정한다.

    override initialize() -> boolean
        의존:
            U2dVectorShaderLayer — 부모 초기화; 함수: {initialize()}
        동작:
            부모 초기화 결과를 보관한다.
            _needJson이 참이고 아직 준비되지 않았으며 요청한 적도 없으면 요청 시작을 기록하고 메타데이터 로드를 시작하되 기다리지 않는다.
            부모 초기화 결과를 반환한다.

    async #loadPbfMetadata() -> Promise<void>
        의존:
            requestPbfMetadata — UPbfMetadata 모듈의 URL 기반 메타데이터 요청; 함수: {requestPbfMetadata()}
            U2dVectorShaderLayer — 요청 주소·수명·이름·연결 문맥; 속성 읽기: {_baseUrl, _disposed, _name, _drawArg, _app}
            UDrawArg — 다음 프레임 갱신 요청; 함수: {setUpdateDate()}
            U3dApp — 화면 재평가 요청; 함수: {forceUpdate()}
        동작:
            _baseUrl의 메타데이터 요청을 만들고 해제 시 취소할 수 있게 저장한다.
            응답을 기다린 뒤 _disposed가 false이면 메타데이터를 반영한다. 해제되었으면 반영하지 않는다.
            요청·반영 중 오류가 나고 레이어가 살아 있으면 옵션 값으로 계속 진행한다는 정보를 출력한다.
            성공·실패와 무관하게 요청 참조를 비운다. _disposed가 false이면 #pbfMetadataReady를 true로 확정하고 선택적인 drawArg·app 갱신을 요청한 뒤 가시 타일 준비를 시작한다.

    #applyPbfMetadata(metadata: PbfMetadata) -> void
        의존:
            resolvePbfMetadataLevels — UPbfMetadata 모듈의 명시 옵션 보존 레벨 해석; 함수: {resolvePbfMetadataLevels()}
            shouldApplyPbfMetadataBounds — UPbfMetadata 모듈의 영역 반영 판단; 함수: {shouldApplyPbfMetadataBounds()}
            U2dVectorShaderLayer — 위경도 영역 변환 및 레벨·영역 저장; 함수: {convertGeographicToGoogleRectangle()}; 속성 읽기·쓰기: {_minlevel, _rectangle, _rectangle3d, _box3}
            defined — 변환 결과 존재 확인; 함수: {defined()}
            Box3 — three 패키지의 변환 영역 상자 작성; 생성자: {new Box3()}
        동작:
            현재 레벨, metadata, 명시 옵션을 전달해 _minlevel·_realMaxlevel을 갱신한다. minzoom은 하한을 올릴 때만, maxzoom은 realMaxLevel을 명시하지 않았을 때만 반영한다.
            영역을 명시하지 않았고 유효한 metadata.bounds가 있으면 위경도 영역을 변환한다. 좌상·우하점의 x·y가 모두 유한수일 때만 _rectangle·_rectangle3d·_box3를 함께 교체한다.

    override async createTexture(tile: U3dQuadTile) -> Promise<U3dQuadTile>
        의존:
            U2dVectorShaderLayer — 범위 판정·타일 상태 설정·소스 생성; 함수: {intersects(), setStateTile(), createTexture()}; 속성 읽기: {_visibleTileKeys}
            UDEF — 범위 밖 타일의 완료 상태; 속성 읽기: {TILE_STATE._end}
        동작:
            메타데이터 준비 전이면 상태를 바꾸지 않고 tile로 완료한다. 준비된 뒤 범위 밖이면 _end로 기록하고 tile로 완료한다.
            #pbfMetadataReady가 true이면 부모 텍스처 생성을 기다린다. 이 준비 조건 안에서 현재 캐시의 살아 있는 가시 타일인지 확인하고 표시 키에 없으면 표시를 다시 시도한다.
            부모 결과를 반환하며 부모 실패는 거부로 전달한다.

    override addTileFromScene(tile: U3dQuadTile) -> boolean
        의존:
            U2dVectorShaderLayer — 영역 판정과 기존 표시 경로; 함수: {intersects(), addTileFromScene()}
        동작:
            메타데이터 준비 전이거나 영역 밖이면 true를 반환해 다른 레이어의 준비를 막지 않는다.
            부모 표시 결과가 false이고 현재 가시 타일이면 합성 완료 후 표시 재시도를 시작한다. 부모 표시 결과를 반환한다.

    #isLiveVisibleTile(tile: U3dQuadTile) -> boolean
        의존:
            U2dVectorShaderLayer — 레이어 수명·가시성과 타일 캐시 연결; 속성 읽기: {_disposed, _visible, _drawArg}
            UDrawArg — 현재 캐시 객체와의 동일성 확인; 함수: {_cacheTiles.get()}
            U3dQuadTile(tile) — 가시성·해제 여부·키 조회; 속성 읽기: {visible, _disposed, _key}
        동작: 레이어가 해제되지 않고 _visible이 false가 아니며, tile.visible이 true이고 타일이 해제되지 않았으며 현재 키의 캐시 객체가 tile과 같을 때만 true를 반환한다.

    async #recommitTileVisibilityWhenSwapReady(tile: U3dQuadTile) -> Promise<void>
        의존:
            UShaderTerrainDecalManager — 타일·피처 소스 상태와 합성 대기; 함수: {waitTerrainTileSwapReady()}; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_TILE_FEATURE_MAP, TERRAIN_PENDING_COMPOSITE_JOBS, TERRAIN_PENDING_WORKER_JOBS, TERRAIN_PRESENT_QUEUE, TERRAIN_PRESENT_CLEAR_QUEUE}
            hasTerrainTileFailedCurrentRevision — UShaderTerrainDecalTileStateManager 모듈의 현재 revision 실패 확인; 함수: {hasTerrainTileFailedCurrentRevision()}
            U2dVectorShaderLayer — 준비 완료 후 기존 표시 판단과 소스 연결; 함수: {addTileFromScene()}; 속성 읽기: {_terrainDecalManager, _name, _drawFeatureIds}
        동작:
            _terrainDecalManager가 없거나 같은 키·같은 타일의 대기가 이미 있으면 종료한다. 같은 키의 다른 대기는 취소하고 새 요청을 기록한다.
            _terrainDecalManager가 있으면 타일 유효성을 확인한다. 계속 유효하고 취소되지 않은 동안 tile 소스를 기다리며, 피처 등록·소스 상태·drawFeatureIds 중 하나라도 있으면 feature 소스도 함께 기다린다.
            대기 후 타일 유효성과 취소를 다시 확인한다. 준비되었으면 부모 표시를 한 번 실행하고 종료한다.
            준비되지 않았으면 등록 소실, 소스의 failed·cancelled·disposed, 현재 revision 실패에서 종료한다. 실제 dirty·build·source·worker·composite·present 작업이 남아 있을 때만 다시 기다린다.
            종료 시 현재 등록이 이 요청일 때만 대기 목록에서 지워 새 요청을 훼손하지 않는다.

    #cancelPendingPresentation() -> void
        동작: 가시 타일 준비 제어기를 취소·제거하고 모든 표시 대기의 제어기를 취소한 뒤 표시 대기 목록을 비운다.

    override hide(refresh?: boolean) -> void
        의존:
            U2dVectorShaderLayer — 기존 숨김 처리; 함수: {hide()}
        동작: 부모 숨김을 실행한 뒤 이 레이어의 표시 대기를 취소한다.

    override show(show: boolean = true, refresh?: boolean) -> void
        의존:
            U2dVectorShaderLayer — 기존 표시 처리; 함수: {show()}; 속성 읽기: {_visible}
        동작: 이전 가시성과 전달값의 차이를 보관하고 부모 표시를 실행한다. show가 참이며 가시성이 바뀌었거나 refresh가 참이면 가시 타일 준비를 시작한다.

    async #prepareVisibleTiles() -> Promise<void>
        의존:
            UDrawArg — 현재 캐시 타일 수집; 함수: {_cacheTiles.items()}
            U2dVectorShaderLayer — 영역 판정·기존 소스 준비 및 수명·레벨·타일 연결; 함수: {intersects(), createTexture()}; 속성 읽기: {_terrainTextureBuildInFlight, _terrainDecalManager, _disposed, _visible, _drawArg, _name, _minlevel, _maxlevel}
            UShaderTerrainDecalManager — 이 레이어의 소스 상태 및 합성 완료 대기; 함수: {waitTerrainTileSwapReady()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
        동작:
            메타데이터 미준비, 레이어 해제·숨김, manager·drawArg 부재이면 종료한다. 이전 준비를 취소하고 새 제어기를 저장한다.
            캐시에서 현재 가시 타일이며 mesh가 있는 타일을 골라 높은 레벨부터 정렬한다.
            후보를 순서대로 처리한다. 취소되면 종료하며, 더 이상 유효하지 않거나 mesh·레벨·영역 조건을 벗어나거나 이미 소스 생성 중 또는 소스 상태가 있으면 건너뛴다.
            부모 소스 생성을 기다린 뒤 취소·현재 타일을 재확인한다. 소스가 available 또는 confirmed-empty이면 이 소스의 합성 준비를 기다린다. controller.signal.aborted가 false이고 준비된 현재 가시 타일이면 표시한다.
            오류는 취소·해제 중이 아닐 때 경고한다. 종료 시 이 제어기가 여전히 현재 준비일 때만 참조를 비운다.

    override isTilePresentationParticipant(tile: U3dQuadTile) -> boolean
        의존:
            U2dVectorShaderLayer — 영역 및 표시 참여 판단; 함수: {intersects(), isTilePresentationParticipant()}
        동작: 타일 부재, 메타데이터 미준비, 영역 밖이면 false를 반환한다. 그 외에는 부모 참여 판단을 반환한다.

    override dispose() -> Promise<boolean>
        역할: 진행 중인 워커 요청을 중단하고 소스 피처 캐시를 비운 뒤 기반 레이어를 처분한다.

        의존:
            U2dVectorShaderLayer — 레이어 공통 자원 처분과 소유 워커 반환; 함수: {dispose(), _releaseTaskProcessors()}; 속성 쓰기: {_taskProcessorDisposing}
            LRUCache — 캐시 정리; 함수: {clear()}

        동작:
            _taskProcessorDisposing을 true로 설정하고 메타데이터 요청과 표시 대기를 취소한다.
            진행 중인 모든 소스 요청에 중단을 보낸다.
            진행 중 요청 목록과 소스 피처 캐시를 비운다.
            기반 dispose() 결과를 반환한다. 정리 중 예외가 발생하거나 부모 결과가 아직 미완료여도 finally에서 소유 워커를 반환한다.

    setFeatureFilter(filter: Partial<{includeLayers: Array<string>, excludeLayers: Array<string>, featureFilter: U3dVectorPBFFeatureFilter}> = {}) -> void
        역할: 포함·제외 레이어와 피처 필터를 바꾸고 현재 표시 중인 타일에 새 필터를 다시 적용한다.

        인터페이스: filter 에서 생략한 항목은 기존 값을 유지한다.

        처리 기준:
            필터 옵션 타입이 잘못되면 상태를 바꾸기 전에 TypeError 를 던진다.
            필터 변경 시 진행 중인 소스 요청을 모두 중단하고 공유 요청 목록을 비운다. 비동기 변환 중 이전 필터와 새 필터의 결과가 섞여 캐시되면 안 된다.
            필터는 소스 피처 캐시와 기반 클래스의 타일 피처 캐시(_drawCache)에 이미 반영되어 있으므로 두 캐시를 모두 무효화해야 다음 타일 생성에서 다시 계산된다.

        의존:
            defined — 항목별 생략 여부 판정; 함수: {defined()}
            LRUCache — 소스 피처 캐시 정리; 함수: {clear()}
            U2dVectorShaderLayer — 타일 피처 캐시·decal payload 정리; 함수: {clear()}; 속성 읽기: {_visible}

        동작:
            필터 옵션을 검증한다.
            filter.includeLayers 또는 filter.excludeLayers가 defined이면 해당 목록을 Set으로 바꿔 저장한다. filter.featureFilter가 defined이면 함수 참조를 교체한다.
            진행 중인 소스 요청을 중단하고 목록을 비운다.
            소스 피처 캐시를 비우고 기반 clear() 로 타일 피처 캐시와 decal payload 를 비운다. [확인 Q-001]
            레이어가 표시 중이면 show(false) 후 show(true) 를 호출해 현재 타일을 새 필터로 다시 생성하게 한다.

    getFeatureFilter() -> {includeLayers: Array<string> | undefined, excludeLayers: Array<string> | undefined, featureFilter: U3dVectorPBFFeatureFilter | undefined}
        역할: 현재 필터 설정을 조회한다.
        인터페이스: 반환: 레이어 이름 집합을 새 배열로 바꾼 현재 필터 설정
        동작: 포함·제외 집합을 배열로 변환하고 피처 필터와 함께 반환한다.

    override createTileSourceRequest(tile: U3dQuadTile, extent: Array<number>, requestId: string) -> {run: () => Promise<{features: Array<U3dVectorPBFTileFeature>}>, cancel: () => void}
        역할: 기반 클래스 createTexture() 가 요청 큐에 등록할 PBF 소스 요청의 실행·취소 함수를 만든다.

        인터페이스:
            tile: 피처를 만들 대상 타일
            extent: 기반 클래스가 계산한 [minX, minY, maxX, maxY] 질의 영역. 외곽선 여유가 이미 포함되어 있다
            requestId: 기반 클래스가 만든 요청 식별자. 이 레이어는 소스 타일 단위로 중단하므로 사용하지 않는다
            반환: run은 3857 좌표의 타일 피처를 담은 {features}로 이행되거나 오류로 거부되는 함수이며, cancel은 이 타일의 소스 요청 대기를 취소하는 함수다. 요청 객체 구성 중 발생하는 동기 오류는 호출자에게 전달된다.

        처리 기준:
            소스 피처 캐시에 있으면 워커 요청 없이 즉시 타일 피처를 만든다. 이때도 요청 형태를 유지해 기반 클래스의 pending·retry 부기가 한 경로로만 흐르게 한다.
            같은 소스 타일을 기다리는 타일 수(waiters)를 세어 마지막 대기 타일까지 취소되면 워커 다운로드를 실제로 중단한다.
            취소는 기반 클래스가 요청 큐를 통해 cancel 을 호출하며, 취소·중단·AbortError 로 실패한 요청은 name 이 'AbortError' 인 오류로 올려 기반 클래스가 재시도 지연을 걸지 않게 한다.
            그 밖의 요청 실패는 빈 결과로 바꾸지 않고 오류를 그대로 올린다. 빈 결과로 돌려주면 기반 클래스가 confirmed-empty 로 확정해 기존 화면을 지우므로, failed 로 표시하고 재시도를 예약하게 한다.
            응답을 기다리는 동안 이 타일이 취소되었거나 타일·레이어가 처분되었으면 피처를 만들지 않고 AbortError 로 종결한다.

        의존:
            defined — 캐시 존재 여부 판정; 함수: {defined()}
            U2dVectorShaderLayer — 영역 판정과 레이어 처분 상태 확인; 함수: {intersects()}; 속성 읽기: {_disposed}
            U3dQuadTile(tile) — 타일 처분 여부; 속성 읽기: {_disposed}
            LRUCache — 소스 피처 캐시 조회; 함수: {get()}

        동작:
            레이어 범위 밖 타일이면 빈 features로 완료하는 run과 빈 cancel을 반환한다.
            소스 타일을 결정한다.
            소스 피처 캐시에 있으면 그 피처로 타일 피처를 만드는 run 과 빈 cancel 을 반환한다.
            공유 요청을 얻어 대기 수를 늘리고, 한 번만 동작하는 대기 수 감소 함수(release)와 취소 표시 뒤 release 를 호출하는 cancel 을 준비한다.
            run 은 요청 promise 를 기다린다. 실패하면 release 가 이미 호출됐거나 요청이 중단됐거나 오류 name 이 'AbortError' 이면 AbortError 를 만들어 던지고, 그 외 오류는 그대로 던지며, 어느 경우에도 release 를 호출한다.
            응답 뒤 취소·타일 처분·레이어 처분이면 AbortError 를 던지고, 그 외에는 응답 피처로 만든 타일 피처를 {features} 로 반환한다.

    override getTerrainPathSimplifyTile(tile: U3dQuadTile) -> {level: number, bounds: Array<number>}
        역할: 선 단순화 허용 거리를 계산할 기준 타일을 같은 소스를 쓰는 표시 레벨 중 가장 확대된 레벨로 바꾼다.

        인터페이스:
            tile: 대상 표시 타일
            반환: 기준 레벨과 그 레벨 대표 타일(0, 0)의 [minX, minY, maxX, maxY] world 범위

        처리 기준:
            realMaxLevel 을 넘는 표시 타일은 같은 소스 타일의 좌표 배열을 그대로 공유하므로 기준이 표시 타일이면 안 된다.
            기준을 표시 타일로 두면 같은 배열을 레벨마다 다른 허용 거리로 솎아내어 타일 경계에서 같은 선이 옆으로 밀려 보인다.
            기준을 소스 레벨로 잡으면 확대 구간이 오히려 더 거칠어지므로, 소스 레벨이 realMaxLevel 이상이고 레이어 _maxlevel 이 소스 레벨보다 크면 _maxlevel 을 기준으로 쓴다.
            소스 레벨이 realMaxLevel 보다 낮으면 그 소스를 쓰는 표시 레벨은 자기 자신뿐이므로 소스 레벨을 그대로 쓴다.
            허용 거리는 기준 타일의 한 변 길이로만 정해지므로 타일마다 인덱스를 다시 구하지 않고 그 레벨의 대표 타일 경계를 쓴다. 인덱스를 다시 구하면 같은 레벨인데도 부동소수 오차로 허용 거리가 미세하게 달라진다.

        의존:
            U2dVectorShaderLayer — 메르카토르 계산기와 레벨 범위 사용; 속성 읽기: {_mercator, _maxlevel}
            UMercator — 기준 레벨의 대표 타일 경계 계산; 함수: {TileBounds()}

        동작:
            소스 타일을 결정한다.
            소스가 더 확대된 표시 레벨과 공유되면 _maxlevel 을, 아니면 소스 레벨을 기준 레벨로 정한다.
            기준 레벨의 대표 타일 경계를 함께 반환한다.

    #resolveSourceTile(tile: U3dQuadTile) -> {x: number, y: number, level: number, key: string}
        역할: 실제로 요청할 소스 타일 인덱스를 정한다.

        처리 기준:
            소스 레벨은 타일 레벨과 _realMaxlevel 중 작은 값이다.
            인덱스는 타일 중심 좌표를 UMercator 로 다시 계산해 URL 과 타일 경계 계산이 같은 인덱스 규약을 쓰게 한다.

        의존:
            U2dVectorShaderLayer — 메르카토르 계산기 사용; 속성 읽기: {_mercator}
            UMercator — 좌표에서 타일 인덱스 계산; 함수: {MetersToTile()}
            U3dQuadTile — 타일 레벨과 중심 좌표; 속성 읽기: {_rlevel, _centerX, _centerY}
            UDEF — 소스 타일 키 생성; 정적 함수: {createKey()}

        동작:
            소스 레벨을 정하고 타일 중심으로 그 레벨의 타일 인덱스를 구해 키와 함께 반환한다.

    #acquireSourceRequest(source: {x: number, y: number, level: number, key: string}) -> U3dVectorPBFSourceRequest
        역할: 소스 타일의 공유 요청을 얻고 대기 타일 수를 1 늘린다.

        의존:
            defined — 진행 중 요청 존재 여부 판정; 함수: {defined()}

        동작:
            진행 중 요청이 없거나 그 요청이 이미 aborted이면 새 요청을 시작해 #pendingSourceRequests에 등록한다.
            요청의 waiters 를 1 늘려 반환한다.

    #releaseSourceRequest(request: U3dVectorPBFSourceRequest) -> void
        역할: 대기 타일 수를 1 줄이고, 응답 전인데 대기 타일이 없으면 워커 요청을 중단한다.

        동작:
            waiters 를 0 미만이 되지 않게 1 줄인다.
            waiters 가 0 이고 요청이 아직 종료되지 않았으면 중단을 보낸다.

    #abortSourceRequest(request: U3dVectorPBFSourceRequest) -> void
        역할: 워커에 요청 식별자를 보내 해당 소비자만 취소한다. 같은 URL의 이미지·벡터 요청은 유지한다.

        처리 기준:
            이미 종료되었거나 중단을 보낸 요청에는 다시 보내지 않는다.
            워커의 abort() 는 UTaskProcessor 메시지(type 'UPbfParserTask', subType 'abort', data 는 requestId)로 동적 호출하며, 어느 워커가 다운로드 중인지 알 수 없어 모든 워커에 보낸다.
            워커가 중단 실패 플래그로 응답하거나, 응답 후 진행 중인 변환이 중단 표시를 확인하면 요청 promise는 AbortError로 reject된다.

        의존:
            U3dImagePBFLayer.g_TaskProcessor — 두 PBF 레이어가 공유하는 워커 처리기(UTaskProcessor)로 모든 워커에 메시지 전송; 함수: {allExecTask()}
            UWorkerParameter — 워커 메시지 생성; 생성자: {new UWorkerParameter()}
            UPbfParserTask(워커) — 요청별 취소; 정적 함수: {abort()}

        동작:
            settled 또는 aborted이면 종료한다. 그 외에는 aborted를 기록하고 requestId를 데이터로 하는 abort 메시지를 모든 워커에 보낸다. 반환된 Promise가 있으면 거부를 관찰하여 무시한다.

    #startSourceRequest(source: {x: number, y: number, level: number, key: string}) -> U3dVectorPBFSourceRequest
        역할: 소스 타일의 워커 다운로드·디코드 요청을 시작하고 응답을 소스 피처 캐시에 반영한다.

        처리 기준:
            워커 응답의 failed 가 참이고 status 가 404 가 아니면 오류를 만들어 던져 promise 를 reject 한다. 취소된 요청은 AbortError, 그 밖에는 URL·status·reason·message 를 담은 Error 다.
            status 가 404 인 실패는 서버가 확정한 데이터 없음이므로 빈 피처 목록으로 종결하고 캐시한다.
            요청이 중단·교체됐거나 레이어가 처분됐으면 변환 전에 AbortError로 끝낸다. 비동기 변환 뒤에도 같은 조건을 확인해 오래된 결과를 반환하거나 캐시에 넣지 않는다.
            캐시 byteLength는 피처 좌표 개수 × 16과 평탄 뷰가 실제로 보유하는 공유 버퍼 바이트 합 중 큰 값이다. 표시 단계에서 좌표를 복원하면 평탄 참조를 비운다.
            요청이 종료되면 성공·실패와 무관하게 settled를 기록하고, #pendingSourceRequests에 이 요청이 여전히 등록되어 있을 때만 제거한다.
            대기 타일이 모두 취소되어 run() 이 호출되지 않으면 소비자 없는 rejection 이 되므로 no-op catch 를 붙인다. run() 의 await 는 별도 분기라 영향을 받지 않는다.
            워커의 loadPbfFeatures()는 UTaskProcessor 메시지(type 'UPbfParserTask', subType 'loadPbfFeatures', data는 {url, requestId, wasmPath, includeLayers, excludeLayers, drawPoints, worldBounds, packedGeometry: true}이며 wasmPath는 UDEF.PBF_WASM_PATH를 메인 문서 기준 절대 파일 주소로 확정한 값)로 동적 호출한다.

        의존:
            U2dVectorShaderLayer — URL·처분 상태·월드 타일 경계 계산과 소유 워커 확보; 함수: {_useTaskProcessor()}; 속성 읽기: {_baseUrl, _disposed, _mercator}
            UDEF — 워커 소비자별 요청 식별자 생성; 함수: {createUUID()}
            U3dImagePBFLayer.g_TaskProcessor — 두 PBF 레이어가 공유하는 워커 처리기(UTaskProcessor)로 워커 하나에 작업 예약; 함수: {scheduleTask()}
            UWorkerParameter — 워커 메시지 생성; 생성자: {new UWorkerParameter()}
            UPbfParserTask(워커) — PBF 다운로드와 MVT 디코드; 정적 함수: {loadPbfFeatures()}
            LRUCache — 변환 결과 저장; 함수: {put()}

        동작:
            소스 인덱스로 요청 URL 을 만든다.
            고유 requestId, waiters 0, settled·aborted false 인 요청 객체를 만들고 워커에 loadPbfFeatures 를 예약한다.
            응답 처리 진입과 변환 완료 뒤 중단·처분·공유 요청 교체를 확인하고 해당되면 AbortError를 만들어 던진다.
            응답이 404 가 아닌 실패 플래그면 오류를 만들어 던진다.
            404 실패면 빈 목록을, 그 외에는 3857 소스 피처로 변환한 전체 목록의 완료를 기다린다. 중단·처분·공유 요청 교체 여부를 다시 확인한다.
            _disposed가 아니면 결과의 좌표 개수와 평탄 배열이 붙잡은 중복 없는 전체 버퍼의 바이트를 센다. 좌표 개수 기반 추정과 실제 보유 바이트 중 큰 값을 byteLength로 캐시에 넣고, 어느 경우에도 결과를 반환한다.
            종료 시 settled를 기록하고 진행 중 목록이 이 요청을 가리킬 때만 제거한다. promise에 no-op catch를 붙인 뒤 요청 객체를 반환한다.

    async #convertToGoogleFeatures(result: U3dVectorPBFDecodeResult, source: {x: number, y: number, level: number, key: string}, request: U3dVectorPBFSourceRequest) -> Promise<Array<U3dVectorPBFSourceFeature>>
        역할: 워커 디코드 결과의 타일 로컬 좌표를 EPSG:3857 소스 피처로 변환하고 지원 범위·필터·LOD 우선순위·자르기 변 제거를 적용한다.

        처리 기준:
            result 가 없거나 layers 가 배열이 아니면 빈 목록을 반환한다.
            좌표 변환은 소스 타일 경계 [minX, minY, maxX, maxY] 와 레이어 extent 로 `gx = minX + fx × (타일 폭 / extent)`, `gy = maxY − fy × (타일 폭 / extent)` 를 사용한다. MVT 는 y 축이 아래 방향이므로 타일 상단에서 빼야 지도 좌표와 방향이 맞는다.
            Point·MultiPoint 는 #drawPoints 가 false 면 제외하고, 켜져 있으면 점마다 `Point` 타입과 `[x, y]` 좌표, 점 자체를 bbox 로 하는 피처 하나를 만든다.
            피처 필터가 있으면 현재 레이어를 this로 하여 (레이어명, 속성, MVT 타입 'Point'|'Polygon'|'LineString')으로 호출하고 false이면 건너뛴다. 우선순위 함수도 현재 레이어를 this로 사용한다.
            #featurePriority 가 있으면 같은 인수로 호출한 값을 Number 로 바꿔 유한수일 때만 lodPriority 로 기록한다. 유한수가 아니면 기록하지 않아 기본 우선순위(0)가 되게 한다.
            Polygon 은 ring 별 부호 있는 면적이 양수인 ring 을 외곽으로 보고, 양수가 아닌 ring 은 직전 외곽 ring 의 홀로 본다. 앞선 외곽 ring 이 없는 홀은 대응 폴리곤을 알 수 없어 제외한다. 양수 ring 이 하나도 없는 피처는 규약 미준수 데이터로 보고 모든 ring 을 외곽으로 취급한다.
            Polygon 은 `외곽 ring + 소속 홀 ring` 을 coverage 하나로 묶고 coverage 마다 소스 피처를 하나씩 만든다. 하나의 MVT 피처에 외곽 Polygon 이 여러 개 들어 있을 때 이를 한 피처로 합치면 통합 bbox 로 overzoom 교차를 판정하게 되어 자식 타일과 무관한 Polygon 까지 전부 넘어가고, 기반 클래스가 모든 ring 에 같은 `lodGroupKey` 를 부여해 수백 개 ring 이 하나의 atomic 합성 그룹이 된다.
            ring 단위 분할과 홀 표식(`_isInner`), 외곽·홀의 합성 그룹(`lodGroupKey`) 부여는 기반 클래스의 WFS 폴리곤 경로(`splitPolygonFeatureByRing()`)가 담당한다. 이 레이어가 coverage 안의 ring 까지 직접 분할하면 외곽과 홀이 서로 다른 LOD 그룹·합성 순서를 갖게 되어 홀이 지워지지 않는다.
            폴리곤 정점마다 타일 경계 bit mask 를 구하고 ring 에서 자르기 변을 뺀 실제 경계 구간(strokeRuns)을 골라낸다. 자르기 변이 하나라도 있는 coverage 는 strokeSuppressed 를 true 로 두고 lodGroupKey 를 자기 id 로 정하며, 실제 경계 구간마다 같은 lodGroupKey 를 가진 LineString 피처(id `coverageId_o{순번}`)를 추가한다. 자르기 변이 없는 coverage 는 strokeSuppressed 없이 lodGroupKey 를 두지 않는다.
            외곽선 선 피처는 lodGroupKey 만 공유하고 합성 순서 identity 는 공유하지 않는다. 공유하면 서로 다른 payload 가 같은 합성 순서를 갖게 되어 tile 이 `revision-not-applied` 로 정착하지 못한다.
            LineString·MultiLineString 은 ends 로 나눈 파트마다 피처 하나를 만들어 overzoom 교차 판정을 파트 단위로 한다.
            폴리곤 3점, 라인 2점 미만인 파트는 기반 레이어가 그리지 않으므로 제외한다.
            소스 피처 id 는 `MVT레이어명:raw ID` 이며, raw ID 가 없으면 `MVT레이어명:i{레이어 안 인덱스}` 를 쓴다. 라인 파트나 점이 둘 이상이면 `_파트인덱스`, 폴리곤 coverage 가 둘 이상이면 `_p{coverage인덱스}` 를 붙인다.
            MVT raw ID 는 layer 마다 독립이므로 레이어명을 반드시 포함한다. 포함하지 않으면 서로 다른 layer 의 같은 raw ID 가 한 타일에서 같은 payload featureId 를 갖게 되어 manager 의 tile source feature Map 에서 마지막 하나만 남는다.
            Polygon 은 `MultiPolygon` 타입과 coverage 하나만 담은 `[[외곽, 홀...]]` 좌표, 라인은 `MultiLineString` 타입과 `[line]` 좌표로 만들어 기반 클래스 processMaterial() 이 그대로 처리할 수 있게 한다.
            폴리곤 bbox 는 그 coverage 의 ring bbox 를 합친 값이다. 정상 데이터의 홀은 외곽 안에 있어 bbox 를 넓히지 않지만 규약 미준수 데이터도 놓치지 않게 함께 합친다.

        의존:
            forceYield — Yield 모듈의 화면 갱신 뒤 Task 양보를 부르는 지역 이름; 함수: {yieldForRendering()}
            readPbfGeometry — 일괄 전송 표의 형상 검증과 좌표·파트 뷰 복원; 함수: {readPbfGeometry()}
            defined — id·필터·우선순위 함수 존재 여부 판정; 함수: {defined()}
            U2dVectorShaderLayer — 메르카토르 계산기 및 해제 여부 사용; 속성 읽기: {_mercator, _disposed}
            UMercator — 소스 타일의 3857 경계 계산; 함수: {TileBounds()}
            UDEF — 기반 클래스가 처리하는 지오메트리 타입 이름; 상수: {MEASURE_TYPE.{MULTIPOLYGON, MULTILINESTRING, POINT}}
            U3dVectorPBFFeatureFilter(#featureFilter) — 피처 단위 통과 여부 판정; 콜백: {featureFilter()}
            U3dVectorPBFFeaturePriority(#featurePriority) — 피처 LOD 우선순위 계산; 콜백: {featurePriority()}

        동작:
            result가 없거나 layers가 배열이 아니면 빈 목록으로 완료한다. 그 외에는 소스 타일 경계와 타일 폭을 구한다.
            worldCoordinates와 partInfo가 있으면 이미 전처리된 Float64 좌표·경계를 사용한다. createPreparedSourceFeatures가 파트·외곽·홀·실제 외곽선을 소스 피처로 묶으며 정점별 좌표 복원은 하지 않는다. 익명 ID는 _sourceIndex가 있으면 그 순번을 사용한다.
            변환 예산 종료 시각을 현재 시각에서 1.75ms 뒤로 잡는다. raw 피처를 처리하기 전에 예산이 지났으면 forceYield를 기다려 화면 갱신 뒤 Task에서 재개하고 예산을 다시 잡는다. 병행 변환은 같은 갱신을 공유하며 숨겨진 문서와 중단된 갱신에는 Yield 모듈의 대체 경로를 사용한다. [확인 Q-002]
            각 피처 시작에서 중단·처분·공유 요청 교체를 확인하고 오래된 요청이면 AbortError로 끝낸다. 부분 결과는 캐시하거나 반환하지 않는다.
            레이어마다 포함·제외 목록을 판정해 통과하지 않으면 건너뛴다.
            피처마다 Point 계열이면 #drawPoints로 제외 여부를 정하고, 피처 필터가 있으면 호출해 false이면 건너뛴다. #featurePriority가 defined이면 반환값을 Number로 변환해 유한수일 때만 lodPriority로 기록한다.
            제외된 레이어도 전체 형상 순번을 이동한다. 속성 필터·우선순위 뒤 일괄 형상이 있으면 해당 피처의 뷰만 복원하며, 형상의 worldCoordinates와 레이어 표식이 다르면 Error로 실패한다.
            월드 좌표가 준비된 피처는 평탄 배열에서 소스 피처를 만들고 다음 피처로 넘어간다.
            이전 로컬 응답의 Point 계열이면 점마다 3857로 변환한 Point 소스 피처를 추가하고 다음 피처로 넘어간다.
            Polygon 이면 ring 면적 부호로 외곽 ring 존재 여부를 먼저 판정한다.
            ends 로 나눈 각 파트를 순회하며 외곽·홀 여부를 정하고(앞선 외곽 없는 홀은 건너뜀) 좌표를 3857 로 변환하면서 파트 bbox 와 폴리곤 정점별 경계 mask 를 계산한다.
            라인이면 최소 점 수를 만족하는 파트마다 id·타입·좌표·속성·lodPriority·파트 bbox 를 가진 소스 피처를 목록에 추가한다.
            폴리곤이면 ring 의 자르기 변을 뺀 실제 경계 구간을 구하고, 외곽 ring 마다 coverage 를 새로 열고 홀 ring 은 직전 coverage 에 넣으면서 구간·자르기 변 여부·bbox 를 합친다.
            coverage마다 id·타입·`[[외곽, 홀...]]` 좌표·속성·lodPriority·coverage bbox·strokeSuppressed·lodGroupKey를 가진 소스 피처를 추가한다. coverage.hasClipEdge가 true이면 실제 경계 구간마다 terrainPolygonOutline=true인 LineString 소스 피처를 추가한다.
            점·선·면·외곽선 모두 원본 raw.id가 정의되어 있으면 stableFeatureId에 보존하고, 없으면 undefined로 둔다. sourceLayer에는 원본 레이어 이름을 기록한다. 표시용 조각 ID와 원본 식별자를 구분하며 properties와 좌표는 생성한 조각 간에 필요한 참조를 공유한다.
            변환된 소스 피처 목록을 반환한다.

    #passesLayerFilter(layerName: string) -> boolean
        역할: 포함·제외 레이어 이름 집합으로 MVT 레이어를 그릴지 판단한다.

        의존:
            defined — 집합 존재 여부 판정; 함수: {defined()}

        동작:
            포함 집합이 있고 이름이 없으면 false, 제외 집합에 이름이 있으면 false, 그 외에는 true 를 반환한다.

    #buildTileFeatures(tile: U3dQuadTile, source: {x: number, y: number, level: number, key: string}, extent: Array<number>, sourceFeatures: Array<U3dVectorPBFSourceFeature>) -> Array<U3dVectorPBFTileFeature>
        역할: 소스 피처를 대상 타일용 피처로 만들고 스타일 함수를 미리 적용한다.

        처리 기준:
            소스 레벨과 타일 레벨이 다르면(overzoom) 기반 클래스가 넘긴 extent 와 bbox 가 교차하는 소스 피처만 사용한다. bbox 는 폴리곤 coverage·라인 파트·점 단위이므로 자식 타일과 무관한 Polygon 은 타일 피처와 payload 를 만들기 전에 걸러진다.
            소스 레벨과 타일 레벨이 같으면 소스 타일과 대상 타일이 같은 영역이므로 교차 판정을 하지 않는다.
            타일 피처 id 는 `타일키:소스피처id` 로 타일마다 고유하다.
            사용자 스타일 함수가 있으면 현재 레이어를 this로 하여 (타일 피처, 타일 레벨 해상도)로 호출해 정규화한 스타일을 `_pbfStyle`에 저장하고, 정규화 결과가 없으면 제외한다.
            같은 MVT 피처에서 나온 coverage·파트는 properties 객체를 공유하므로 스타일 결과가 같다. properties 객체가 직전 피처와 바뀔 때만 스타일 함수를 호출해 coverage 분리로 호출 횟수가 늘어나지 않게 한다. 정규화 결과는 기반 클래스가 복제해 쓰므로 여러 피처가 같은 객체를 참조해도 안전하다.
            strokeSuppressed 인 면은 외곽선을 따로 만든 선 피처가 그리므로 외곽선을 끈 스타일 사본을 쓰고, 채움 색이 없어 사본이 없으면 그 면은 제외한다. 끄지 않으면 타일을 자른 자리가 선으로 보인다.
            Point 피처의 정규화 스타일에 Circle 반경(pointRadiusPx, 0 보다 큰 유한수)이 있으면 `px × 소스 레벨 해상도(m/px)` 를 geometry.radius(3857 단위)로 기록한다. 화면 해상도가 아닌 타일 레벨 해상도이므로 카메라 거리에 따라 화면 크기는 달라진다.
            반경 환산에 타일 레벨이 아닌 소스 레벨(`source.level`) 해상도를 쓴다. overzoom 자식은 같은 소스 데이터를 재사용하므로 같은 점의 물리 반경도 같아야 한다. 타일 레벨 해상도를 쓰면 레벨이 1 오를 때마다 반경이 절반이 되어 줌 인 할수록 점이 작아지다 사라진다. non-overzoom 타일은 소스 레벨과 타일 레벨이 같으므로 동작이 바뀌지 않는다.

        의존:
            defined — 경계·스타일·반경 존재 여부 판정; 함수: {defined()}
            U2dVectorShaderLayer — 메르카토르 계산기 사용; 속성 읽기: {_mercator}
            UMercator — 레벨 해상도 계산; 함수: {Resolution()}
            U3dQuadTile — 타일 레벨과 키; 속성 읽기: {_rlevel, _key}
            U3dVectorPBFStyleFunction(#userStyleFunction) — 피처 스타일 계산; 콜백: {styleFunction()}

        동작:
            타일 레벨 해상도와 반경 환산용 소스 레벨 해상도를 구하고, overzoom 이면 extent 를 교차 판정 경계로 삼는다.
            소스 피처마다 overzoom 경계와 교차하지 않으면 건너뛴다.
            타일 키와 기본 점 반경을 붙인 타일 피처를 만든다.
            #userStyleFunction이 defined이면 properties 객체가 직전과 다를 때만 호출 결과를 Point 여부와 함께 정규화해 보관하고, 같으면 보관한 값을 그대로 쓴다.
            #userStyleFunction이 defined이면 strokeSuppressed 피처는 외곽선을 끈 스타일 사본으로 바꾸고, 스타일이 없으면 제외한다. Point의 pointRadiusPx가 정의된 양의 유한수일 때만 소스 해상도를 곱한 geometry.radius를 기록하고 `_pbfStyle`에 스타일을 저장한다.
            만든 타일 피처 목록을 반환한다. 이 메서드의 스타일 계산은 동기 순회이며 피처 사이에 실행을 양보하지 않는다. [확인 Q-002]

validateFilterOption(opt: Partial<{includeLayers: unknown, excludeLayers: unknown, featureFilter: unknown, featurePriority: unknown}>) -> void
    역할: 생성자와 setFeatureFilter() 의 필터·우선순위 옵션 타입을 검사한다.

    처리 기준:
        includeLayers·excludeLayers 가 정의되어 있으면 문자열 배열이어야 하고, featureFilter·featurePriority 가 정의되어 있으면 함수여야 한다. 위반하면 옵션 이름을 담은 TypeError 를 던진다.

    의존:
        defined — 옵션 정의 여부 판정; 함수: {defined()}

    동작:
        두 레이어 목록 옵션, featureFilter, featurePriority 를 순서대로 검사하고 위반 시 TypeError 를 던진다.

replaceUrl(url: string, x: number, y: number, z: number) -> string
    역할: URL 템플릿 토큰을 타일 인덱스로 치환한다.

    처리 기준:
        `{x}`, `{y}`, `{z}` 는 인덱스 그대로, `{-x}`, `{-y}` 는 `2^z − 인덱스 − 1` 로 치환해 U3dImageXYZLayer 와 같은 규칙을 따른다.

    동작:
        다섯 토큰을 정규식으로 모두 치환한 URL 을 반환한다.

createPreparedSourceFeatures(raw: U3dVectorPBFDecodedFeature, options: {baseId: string, sourceLayer: string, mvtType: string, lodPriority?: number}) -> Array<U3dVectorPBFSourceFeature>
    역할: Worker의 월드 좌표·파트 메타를 소스 피처의 평탄 뷰로 나눈다.
    처리 기준:
        flatCoordinates가 Float64Array가 아니거나 ends가 배열이 아니면 Error다. 비점 도형에 partInfo가 없으면 빈 목록이다.
        소스 피처의 coordinates는 빈 배열로 두고 실제 좌표는 원본 전송 버퍼의 subarray인 _flatCoordinates로 보존한다.
    동작:
        options에서 baseId·sourceLayer·mvtType·lodPriority를 읽고 원본 속성·ID와 함께 사용할 공통 메타를 만든다.
        Point는 점마다 뷰와 점 경계의 피처를 만들며 여러 점이면 순번 접미어를 붙여 반환한다.
        선은 2점, 면은 3점 미만인 파트를 제외한다. 선은 파트별 뷰·경계와 유효 파트 순번으로 피처를 만든다.
        면은 파트 메타의 부호 있는 면적이 양수인 외곽이 있으면 나머지를 홀로 취급한다. 앞선 외곽 없는 홀은 버리고, 외곽이 전혀 없으면 각 파트를 외곽으로 취급한다.
        외곽마다 coverage를 만들고 홀·경계·자르기 표식·같은 파트의 외곽선을 합친다. coverage별 면을 만들고 잘린 coverage만 실제 외곽선을 별도 선으로 추가하여 같은 lodGroupKey로 묶는다.
        원본 속성·ID·레이어·LOD 우선순위와 독립 조각 ID를 가진 전체 소스 피처를 반환한다.

countCoordinates(feature: U3dVectorPBFSourceFeature) -> number
    평탄 파트가 남아 있으면 각 길이 / 2를 합하고, 없으면 기존 GeoJSON 좌표를 센다.
    역할: 소스 피처의 좌표 개수를 세어 LRU 캐시 byteLength 근사값 계산에 쓴다.

    처리 기준:
        Point 는 1 이다. MultiPolygon 은 `[[외곽, 홀...], ...]` 구조라 ring 까지 한 단계 더 내려가 좌표 개수를 합치고, 그 외(선)는 파트 길이를 합친다.

    동작:
        타입에 따라 좌표 개수를 합산해 반환한다.

createSourceRequestError(result: U3dVectorPBFDecodeResult, url: string) -> Error
    역할: 워커가 알린 실패 정보를 기반 클래스가 판정할 수 있는 오류로 만든다.

    처리 기준:
        result.aborted 가 참이면 재시도 지연 없이 취소로 처리되도록 AbortError 를 만든다.
        그 외에는 status·reason·워커 예외 message 와 URL 을 메시지에 담은 Error 를 만들고 error.status 에 응답 코드를 붙여 기반 클래스가 failed 로 표시하고 재시도를 예약하게 한다.

    의존:
        defined — status·reason·message 존재 여부 판정; 함수: {defined()}

    동작:
        result.aborted 가 참이면 AbortError 를 만들어 반환한다.
        아니면 상세 메시지와 status 를 가진 Error 를 반환한다.

createAbortError(reason: string) -> Error
    역할: 브라우저와 Node.js 에서 동일하게 동작하는 요청 취소 오류를 만든다.

    처리 기준:
        기반 클래스가 name === 'AbortError' 로 취소를 판별해 재시도 지연을 걸지 않으므로 name 을 반드시 'AbortError' 로 맞춘다.

    의존:
        Web API — DOMException 사용 가능 여부 판정과 생성; 생성자: {new DOMException()}

    동작:
        DOMException 을 쓸 수 있으면 'AbortError' 이름의 DOMException 을, 아니면 name 을 'AbortError' 로 바꾼 Error 를 반환한다.

toLayerNameSet(names: Array<string> | undefined) -> Set<string> | undefined
    역할: 레이어 이름 배열을 Set 으로 바꾼다.
    처리 기준: 배열이 아니거나 비어 있으면 필터 없음을 뜻하는 undefined 를 반환한다.
    동작: 비어 있지 않은 배열이면 새 Set 을, 아니면 undefined 를 반환한다.

signedArea(flatCoordinates: Float64Array, start: number, end: number) -> number
    역할: flat 좌표 배열의 [start, end) 구간(ring)의 부호 있는 면적을 구한다.

    인터페이스: 반환: shoelace 공식의 2배 면적 값이며 타일 로컬 좌표 기준으로 양수면 MVT 규약의 외곽 ring 이다.

    동작:
        구간의 각 점과 다음 점(마지막은 첫 점)으로 외적 합을 누적해 반환한다.

intersectsBound(a: Array<number>, b: Array<number>) -> boolean
    역할: 두 `[minx, miny, maxx, maxy]` 영역의 교차 여부를 판정한다.
    동작: 경계를 포함한 축 정렬 교차 조건을 계산해 반환한다.

suppressStrokeStyleState(style: U3dVectorPBFStyleState | undefined) -> U3dVectorPBFStyleState | undefined
    역할: 면의 외곽선을 끈 스타일 상태 사본을 만든다.

    처리 기준:
        원본은 여러 coverage 가 공유하므로 바꾸지 않고 복제한다.
        style 이 없으면 그대로 undefined 를 반환한다.
        fillColor 가 없는(선만 있던) 면은 외곽선을 끄면 그릴 것이 없으므로 undefined 를 반환해 면 피처를 만들지 않게 한다.

    의존:
        defined — style·fillColor 존재 여부 판정; 함수: {defined()}

    동작:
        채움이 있으면 strokeColor 를 undefined, strokeOpacity·strokeWidth 를 0 으로 바꾼 사본을 반환한다.

resolveTileEdgeMask(localX: number, localY: number, extent: number) -> number
    역할: 정점이 타일의 어느 경계 위 또는 바깥에 있는지 bit mask 로 돌려준다.

    처리 기준:
        LEFT=1, RIGHT=2, TOP=4, BOTTOM=8 의 bit 를 쓰며 허용 오차는 0.5 다. MVT 좌표는 정수라 1 미만이면 충분하다.
        버퍼가 있는 타일은 자르는 선이 0·extent 가 아니라 그 바깥이므로, 경계 값 자체가 아니라 경계이거나 그 바깥인지로 판정해 두 경우를 모두 잡는다.

    동작:
        x 가 0.5 이하면 LEFT, extent−0.5 이상이면 RIGHT, y 가 0.5 이하면 TOP, extent−0.5 이상이면 BOTTOM bit 를 더해 반환하며 타일 안쪽이면 0 이다.

splitRingByTileEdge(ring: Double_Array<number>, edgeMasks: Array<number> | undefined) -> {runs: Array<Double_Array<number>>, hasClipEdge: boolean}
    역할: ring 에서 타일 자르기로 생긴 변을 빼고 남는 실제 경계 구간만 골라낸다.

    처리 기준:
        edgeMasks 가 없거나 정점이 3개 미만이면 빈 구간과 hasClipEdge false 를 반환한다.
        변 i 는 정점 i 에서 i+1 로 가며 마지막 변은 마지막 정점에서 첫 정점으로 돌아온다. 양 끝 정점의 mask 에 공통 bit 가 있는 변(같은 타일 경계 위)은 자르기 흔적으로 보고 버린다. 한쪽 끝만 경계에 닿은 변은 경계를 가로지르는 실제 선이므로 남긴다.
        자르기 변이 하나도 없으면 빈 구간과 hasClipEdge false 를 반환해 호출자가 원래 ring 의 외곽선을 그대로 그리게 한다.
        시작 지점을 버린 변 바로 뒤로 잡아 ring 을 한 바퀴 도는 동안 구간이 중간에 쪼개지지 않게 한다. 정점 2개 이상인 연속 구간만 결과에 넣는다.

    동작:
        변마다 남길지 판정해 자르기 변 존재 여부를 정한다.
        자르기 변이 있으면 첫 자르기 변 다음부터 한 바퀴 돌며 남긴 변을 이어 붙여 구간 목록을 만들고, 자르기 변 존재 여부와 함께 반환한다.

createTileFeature(sourceFeature: U3dVectorPBFSourceFeature, tileKey: string, pointRadius: number) -> U3dVectorPBFTileFeature
    역할: 소스 피처를 기반 클래스 처리 흐름과 ol 스타일 함수가 모두 읽을 수 있는 타일 피처로 만든다.

    처리 기준:
        기반 클래스 processMaterial() 은 `id`, `geometry.type`, `geometry.coordinates`, `properties` 와 `getId()` 를 읽고, 예제 스타일 함수는 ol.Feature 규격의 `get(key)`, `getProperties()`, `getGeometry().getType()` 을 읽으므로 두 규격을 모두 제공한다.
        `getGeometry().getType()` 은 MVT 타입(`Polygon` | `LineString` | `Point`)을 반환한다.
        Point 피처의 geometry 에는 기반 클래스 #processPoint() 가 Point의 표시 반경으로 읽는 `radius` 를 pointRadius 로 넣는다.
        홀 표식 `_isInner` 는 기반 클래스가 ring 을 분할할 때 부여하므로 여기서 넣지 않는다.
        `getId()`, `get(key)`, `getProperties()` 는 클로저에 값을 가두지 않고 반드시 `this` 의 `id`·`properties` 를 읽는다. 기반 클래스의 `splitPolygonFeatureByRing()` 이 `{...feature, id: 링별ID}` 로 얕은 복사 후 `id` 만 덮어쓰는데, 값을 가둔 접근자는 원본 id 를 계속 돌려준다. 기반 클래스와 terrain manager 는 모두 `getId()` 를 우선 사용하므로 그 경우 한 MVT 피처에서 나온 링 전체가 같은 ID 를 갖게 되고, manager 의 tile source feature Map 에서 마지막 하나만 남아 화면에서 사라진다.
        합성 순서 identity 는 타일 키를 뺀 소스 피처 id 를 `compositionFeatureId` 로 따로 실어 보낸다. 타일 피처 id 에는 타일 키가 들어 있어 그대로 쓰면 같은 원본 피처가 타일 수만큼 합성 순서 registry(`UTerrainDecalCompositionOrderRegistry`)에 쌓인다. 이 registry 는 피처 단위 회수가 없고 layer dispose 시 group 통째 해제만 하므로 팬·줌 중 계속 증가한다. 타일 키를 빼면 registry 크기가 소스 피처 수로 묶이고, 같은 피처가 타일 경계를 넘어도 같은 렌더 순서를 유지한다.
        소스 피처의 lodPriority와 lodGroupKey를 그대로 복사한다. stableFeatureId·sourceLayer는 _vectorSourceId·_vectorSourceLayer로 전달하고 terrainPolygonOutline도 보존한다.

    의존: UMeasureFeature — 좌표 매개체 생성과 지연 복원; 정적 함수: {_createCoordinateFeature()}

    동작:
        bbox 선별 후 UMeasureFeature._createCoordinateFeature에 원본 좌표·메타데이터와 측정용/스타일용 종류를 전달한다. 지연 복원·교체·파트 선택은 공통 매개체 구현이 소유하며 이 레이어는 평탄 배열 접근자나 해제 상태를 따로 만들지 않는다. 이 단계에서 완성된 측정 피처를 생성하지 않는다.
        `타일키:소스피처id`를 id로, 소스 피처 id를 compositionFeatureId로 사용한다. 원본 식별자·레이어·외곽선 표식·LOD 정보와 새 geometry 객체를 구성하되 좌표 배열과 properties는 소스 피처의 참조를 그대로 사용한다.
        Point에는 기본 radius를 설정한다. 현재 this의 id·properties를 읽는 접근자와 원본 MVT 타입을 반환하는 geometry 접근자를 붙여 반환한다.

normalizeOlColor(color: unknown) -> string | undefined
    역할: ol 색상 표현을 기반 클래스의 validateStyle 이 해석할 수 있는 문자열로 바꾼다.
    처리 기준: 값이 없거나 빈 문자열이면 undefined, `[r, g, b, a]` 배열이면 `rgba(r,g,b,a)`(alpha 가 없으면 1), 그 외에는 String 변환 결과다.
    의존: defined — 색 존재 여부 판정; 함수: {defined()}
    동작: 입력 형태에 따라 정규화한 색 문자열 또는 undefined 를 반환한다.

readOlColor(element: any) -> string | undefined
    역할: ol Fill/Stroke 유사 객체의 색을 문자열로 읽는다.
    처리 기준: `getColor()` 가 없는 최소 구현은 `color_` 필드를 읽는다.
    의존: defined — 요소 존재 여부 판정; 함수: {defined()}
    동작: element가 defined이면 getter 또는 color_를 읽어 정규화한 문자열을 반환한다. element가 없으면 undefined를 반환한다.

readOlWidth(stroke: any) -> number | undefined
    역할: ol Stroke 유사 객체의 두께를 읽는다.
    의존: defined — 요소 존재 여부 판정; 함수: {defined()}
    동작: `getWidth()` 또는 `width_` 를 반환하고 stroke 가 없으면 undefined 를 반환한다.

resolveStyleState(styleResult: unknown, isPoint: boolean = false) -> U3dVectorPBFStyleState | undefined
    역할: 스타일 함수 반환값을 기반 클래스 extractStyleState() 가 읽는 `{fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWidth}` 형태로 정규화한다.

    인터페이스:
        styleResult: ol.style.Style, 그 배열, 또는 fillColor·strokeColor 를 가진 스타일 상태 객체
        isPoint: Point 피처 여부. 참이면 image·text 요소에서 색을 찾는다.
        반환: 정규화된 스타일. Point 에 Circle 이미지 반경이 있으면 pointRadiusPx(px) 를 포함한다. 그릴 수 있는 스타일이 없으면 undefined

    처리 기준:
        배열이면 앞에서부터 fill 또는 stroke 를 가진 첫 스타일을 사용한다.
        fillColor 또는 strokeColor 속성이 있는 객체는 기반 클래스 규격으로 보고 그대로 반환한다.
        면·선은 스타일의 `getFill()`/`fill_`, `getStroke()`/`stroke_` 를 읽는다.
        isPoint가 true이면 getFill 함수가 있는 image를 먼저, 없으면 같은 함수를 가진 text를 색 출처로 고른다. 선택되면 getFill·getStroke로 앞서 읽은 색 출처를 덮어쓰고 image의 getRadius가 함수이면 반경도 읽는다. 둘 다 선택되지 않으면 원래 style의 fill·stroke를 유지한다.
        fill 이 없으면 fillOpacity 0, stroke 가 없으면 strokeOpacity 0 과 strokeWidth 0 으로 두어 해당 요소를 그리지 않게 한다.
        ol 스타일 함수는 fill·stroke 객체를 재사용하며 색을 바꾸므로 값은 호출 직후 즉시 복사한다.

    의존:
        defined — 스타일·색 존재 여부 판정; 함수: {defined()}

    동작:
        반환값을 배열로 정규화해 순회하며 기반 클래스 규격 객체는 즉시 반환한다.
        style의 fill·stroke를 읽는다. isPoint가 true이면 image 또는 text를 위 우선순위로 선택해 색 출처를 덮어쓰며 선택할 수 없으면 원래 값을 유지한다.
        색을 문자열로 정규화하고 둘 다 없으면 다음 스타일로 넘어간다.
        색이 있는 첫 스타일로 없는 요소의 opacity·두께를 0 으로 채운 스타일 상태 객체(점은 pointRadiusPx 포함)를 반환하고, 끝까지 없으면 undefined 를 반환한다.

U3dVectorPBFLayerCO_Content 타입 정의
    U3dVectorPBFLayerCO가 기반 U2dVectorShaderLayerCO에 덧붙이는 PBF 전용 생성 옵션 필드 묶음이다.
        baseUrl?: string
            PBF 타일 URL 템플릿이며 기반 옵션이지만 이 레이어에서는 필수다.
        realMaxLevel?: number
            서버가 실제 제공하는 최대 레벨이며 생략하면 metadata의 maxzoom으로 보완하고, 유효한 값이 없으면 maxLevel을 사용한다.
        featureCacheSize?: number = 200
            소스 피처 LRU 캐시 크기(타일 개수)
        styleFunction?: U3dVectorPBFStyleFunction
            ol 규격 스타일 함수
        includeLayers?: Array<string>
            그릴 MVT 레이어 이름 목록
        excludeLayers?: Array<string>
            제외할 MVT 레이어 이름 목록
        featureFilter?: U3dVectorPBFFeatureFilter
            피처 단위 필터
        featurePriority?: U3dVectorPBFFeaturePriority
            타일당 피처 상한이 걸릴 때 남길 순서를 정하는 LOD 우선순위 함수
        drawPoints?: boolean = true
            Point 피처를 원으로 그릴지 여부
        pointRadius?: number = 10
            Point 원의 기본 반경(3857 단위)
        needJson?: boolean = true
            metadata.json으로 레벨·영역을 보완한다. minzoom은 하한을 높일 때만, maxzoom은 realMaxLevel 미지정 시, bounds는 영역 미지정 시 반영한다. 읽는 동안 타일 요청을 보류하고 실패하면 생성자 옵션으로 계속한다.

U3dVectorPBFLayerCO extends U2dVectorShaderLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        U3dVectorPBFLayerCO_Content의 모든 필드
            기반 U2dVectorShaderLayerCO 옵션에 위 PBF 옵션 필드 묶음을 합친 생성 옵션 타입이며 각 필드의 의미는 U3dVectorPBFLayerCO_Content 타입 정의에 기록한다.

U3dVectorPBFStyleFunction 함수 타입 정의
    (feature: U3dVectorPBFTileFeature, resolution: number) -> unknown
    인터페이스: 타일 피처 하나와 타일 레벨 해상도(m/px)를 받아 ol.style.Style, 그 배열 또는 U3dVectorPBFStyleState 와 같은 키를 가진 객체를 반환한다. 빈 배열이나 채움·선 색이 없는 스타일만 반환하면 그 피처는 그리지 않는다.

U3dVectorPBFFeatureFilter 함수 타입 정의
    (layerName: string, properties: KeyValue, mvtType: string) -> boolean
    인터페이스: MVT 레이어 이름, 속성, 지오메트리 종류(`Polygon` | `LineString` | `Point`)를 받아 그릴 피처면 true 를 반환한다. 타일 해석 직후 스타일 적용 전에 호출되며 false 를 돌려준 피처는 캐시에도 남지 않는다.

U3dVectorPBFFeaturePriority 함수 타입 정의
    (layerName: string, properties: KeyValue, mvtType: string) -> number
    인터페이스: 같은 인수를 받아 LOD 우선순위를 반환하며 값이 클수록 타일당 피처 상한에서 먼저 남는다. 유한수가 아닌 반환값은 기본 순위 0 으로 취급한다.

U3dVectorPBFSourceRequest 타입 정의
    url: string
        실제 다운로드 URL이다.
    requestId: string
        워커 요청마다 생성하는 고유 취소 식별자이다.
    waiters: number
        이 요청을 기다리는 타일 수. 0 이 되면 워커 요청을 중단한다.
    settled: boolean
        응답 또는 실패로 종료되었는지 여부
    aborted: boolean
        abort 를 보냈는지 여부
    promise: Promise<Array<U3dVectorPBFSourceFeature>>
        변환·필터링된 소스 피처 목록으로 이행되거나 실패 오류로 거부되는 promise

U3dVectorPBFDecodedLayer 타입 정의
    name: string
        MVT 레이어 이름
    extent: number
        타일 내부 좌표계의 한 변 길이(대부분 4096)
    features: Array<{id: number | undefined, type: string, properties: KeyValue, flatCoordinates: Float64Array, ends: Array<number>}>
        타일 로컬 좌표(y 축 아래 방향)의 원본 피처 목록. type 은 Point | MultiPoint | LineString | MultiLineString | Polygon 이다.

U3dVectorPBFDecodeResult 타입 정의
    layers: Array<U3dVectorPBFDecodedLayer>
        레이어 목록이며 실패 시 빈 배열이다.
    failed?: boolean
        워커가 다운로드 실패·디코드 실패 또는 abort 를 알리는 플래그
    status?: number
        HTTP 응답 코드. 404 는 서버가 확정한 데이터 없음이라 빈 결과로 종결한다.
    aborted?: boolean
        요청 취소 여부. 취소는 재시도 지연 대상이 아니다.
    reason?: string
        실패 종류 (`http` | `network` | `decode` | `aborted`)
    message?: string
        워커가 담은 실패 메시지
    url?: string
        요청 URL

U3dVectorPBFSourceFeature 타입 정의
    stableFeatureId?: string | number
        조각 분할 전 원본 ID이며 원본 ID가 없는 피처에는 순번을 대신 넣지 않는다.
    sourceLayer?: string
        원본 MVT 레이어 이름이다.
    id: string
        소스 타일 안에서 고유한 id. `MVT레이어명:원본ID` 또는 `MVT레이어명:i순번` 에 조각 접미어가 붙는다.
    mvtType: string
        `Polygon` | `LineString` | `Point`
    measureType: string
        기반 클래스가 처리하는 타입 `MultiPolygon` | `MultiLineString` | `Point`
    coordinates: Array<number> | Triple_Array<number> | Array<Triple_Array<number>>
        GeoJSON 형태 3857 좌표 (`[x, y]`, `[[외곽, 홀...]]` 또는 `[line]`)
    _flatCoordinates?: Array<Float64Array>
        Worker의 공유 버퍼를 유지하는 월드 좌표 파트·ring 뷰다. 있는 경우 표시 피처의 좌표 복원에 우선 사용한다.
    properties: KeyValue
        MVT 속성이며 `layer` 키에 레이어 이름이 있다. 같은 MVT 피처에서 나뉜 조각들이 공유한다.
    lodPriority?: number
        타일당 피처 상한이 걸릴 때 남길 순서이며 클수록 먼저 남는다.
    bbox: Array<number>
        `[minx, miny, maxx, maxy]` 3857 경계. 점은 점 자체, 폴리곤은 coverage 의 ring 을 합친 값, 라인은 파트 단위다.
    strokeSuppressed?: boolean
        자르기 변이 섞여 외곽선을 별도 선 피처가 대신 그리는 면이면 true
    terrainPolygonOutline?: boolean
        폴리곤에서 분리된 외곽선으로 원본 좌표 유지에 사용하는 표식이다.
    lodGroupKey?: string
        LOD 선별에서 함께 남거나 함께 빠져야 하는 묶음 이름. 자르기 변이 있는 면과 그 외곽선 선 피처가 같은 값을 갖는다.

U3dVectorPBFTileFeature 타입 정의
    _vectorSourceId?: string | number
        타일 키·표시 조각과 독립된 원본 ID이다.
    _vectorSourceLayer?: string
        원본 MVT 레이어 이름이다.
    terrainPolygonOutline?: boolean
        폴리곤에서 분리된 외곽선이라는 표식이다.
    id: string
        `타일키:소스피처id`
    compositionFeatureId: string
        타일 키를 뺀 소스 피처 단위 합성 순서 identity
    lodPriority?: number
        LOD 상한이 걸릴 때 남길 우선순위
    lodGroupKey?: string
        면과 외곽선 선 피처를 묶는 LOD 선별 그룹 키
    geometry: {type: string, coordinates: Array<number> | Triple_Array<number> | Array<Triple_Array<number>>, radius?: number}
        GeoJSON 지오메트리. Point 는 원 반경 radius(3857 단위)를 가진다.
    properties: KeyValue
        MVT 속성
    getId: () => string
    get: (key: string) => unknown
    getProperties: () => KeyValue
    getGeometry: () => {getType: () => string}
        ol.Feature 호환 메서드. getId·get·getProperties 는 this 의 id·properties 를 읽는다.
    _pbfStyle?: U3dVectorPBFStyleState
        미리 계산한 스타일 상태

U3dVectorPBFStyleState 타입 정의
    fillColor?, strokeColor?: ColorLike
        채움·선 색
    fillOpacity?, strokeOpacity?, strokeWidth?: number
        채움·선 불투명도와 선 두께(px). 없는 요소는 0 으로 두어 그리지 않는다.
    pointRadiusPx?: number
        Point 스타일의 Circle 이미지 반경(px)
```

## 4. 공통 처리 기준과 제약

- MVT 원본 ID와 원본 레이어 이름을 표시용 타일 ID·분할 ID와 별도로 보존하여 기반 벡터 레이어에 전달한다. 점·선·면·외곽선으로 나누어도 같은 MVT 원본의 안정 식별자는 유지한다.
- 원본 ID 없는 피처에 사용하는 타일 내부 순번은 표시 구분에만 사용하며 지속 편집의 식별자로 사용하지 않는다. 합성 순서와 표시용 ID의 기존 규칙은 유지한다.

```spec
이 레이어가 기반 클래스에 넘기는 피처 좌표는 모두 EPSG:3857 이며 타일 로컬 좌표를 밖으로 노출하지 않는다.
워커 요청은 소스 타일 키 단위로 공유하며, 같은 소스 타일에 대해 동시에 둘 이상의 워커 다운로드를 시작하지 않는다.
필터(포함·제외 레이어, 피처 필터)와 LOD 우선순위는 소스 피처 캐시 저장 전에 적용되므로 필터를 바꾸면 소스 피처 캐시를 무효화해야 한다.
선 단순화 허용 거리의 기준 타일은 표시 타일이 아니라 같은 소스 타일을 공유하는 표시 레벨 중 가장 확대된 레벨의 대표 타일이다. 같은 소스 타일을 공유하는 표시 타일들은 같은 좌표 배열을 쓰므로 허용 거리도 같아야 하며, 그렇지 않으면 같은 선이 타일 경계에서 어긋난다.
타일 피처의 `getId()` 는 언제나 자기 자신의 `id` 필드와 같은 값을 반환한다. 기반 클래스가 ring 분할로 얕은 복사 후 `id` 를 덮어써도 이 등식이 유지되어야 하며, 그렇지 않으면 한 MVT 피처에서 나온 링들이 같은 payload featureId 를 갖게 되어 manager 의 tile source feature Map 에서 마지막 하나만 남는다.
소스 피처 하나가 담는 폴리곤 coverage 는 항상 하나(`외곽 ring + 소속 홀 ring`)다. bbox 는 그 coverage 의 범위이며, 여러 coverage 를 한 소스 피처로 합치지 않는다.
소스 피처 id 는 MVT 레이어명을 포함해 한 소스 타일 안에서 유일하다. MVT raw ID 공간은 layer 마다 독립이므로 레이어명 없이는 유일성이 보장되지 않는다.
같은 MVT 피처에서 나온 coverage·파트·외곽선 선 피처는 소스 피처 목록에서 연속으로 놓이며 properties 객체를 공유한다. 이 순서와 공유는 스타일 계산을 묶는 기준이므로 geometry type 별 재정렬로 깨뜨리지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
