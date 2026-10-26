# U3dQuadTile 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dQuadTile`은 terrain quadtree의 개별 tile을 표현하며, tile geometry에 로드된 height grid에서 Google 좌표에 해당하는 render height를 조회한다.

이 문서는 height sampling, 표시 배율과 공간 경계 갱신, 지형 LOD 판단·자식 콘텐츠 준비·표시 준비 검사 및 타일 해제의 오류 처리 동작을 기록한다. 나머지 생명주기의 전체 명세화는 포함하지 않는다.

### 1.2 책임 범위

`U3dQuadTile`은 자신의 geometry position buffer, row width, tile rectangle을 사용해 좌표를 tile 내부 grid 좌표로 변환하고 bilinear interpolation으로 z 값을 계산한다.

책임 경계: world 좌표에 해당하는 tile을 cache에서 찾고 여러 LOD fallback을 수행하는 책임은 `UDrawArg`에 있다.

### 1.3 주요 동작 방식

현재 height 조회의 실제 경로는 `getHeightAtPoint`이다. 이 함수는 height data와 geometry 정보를 확인한 뒤 64x64 height grid에서 주변 네 정점의 z 값을 읽고, X축 보간과 Y축 보간을 차례로 수행한다.

`getHeightAtPointPrev`는 이전 sampling 방식을 보존한 비교용 함수로 남아 있으며 현재 `getHeightAtPoint`가 호출하지 않는다.

### 1.4 주요 사용처와 연계 대상

`UDrawArg.getRenderHeightAtPoint`는 조회한 terrain tile의 `getHeightAtPoint`를 호출해 render height를 얻는다.

`UDrawArg`의 height fallback 경로는 `U3dQuadTile.getRealLevel`, `U3dQuadTile.isDisposed`, `U3dQuadTile._rectangle3d`와 함께 동작한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
height data가 로드되지 않았으면 height 조회는 `UDEF.TERRAIN_NO_DATA`를 반환해야 한다.
geometry position buffer, row width 또는 tile rectangle이 유효하지 않으면 `getHeightAtPoint`는 `UDEF.TERRAIN_NO_DATA`를 반환해야 한다.
`getHeightAtPoint`는 Google 좌표를 tile rectangle 기준의 grid 좌표로 변환한 뒤 네 grid point의 z 값을 bilinear interpolation으로 섞어야 한다.
grid index는 height grid 범위인 `0` 이상 `width - 1` 이하로 제한되어야 한다.
보간 비율은 `0` 이상 `1` 이하로 제한되어야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: `getHeightAtPoint`는 terrain height 조회 경로에서 반복 호출된다.
우선순위: geometry, position buffer, row width와 rectangle 참조를 지역 변수로 읽어 반복 property lookup을 줄인다.
제한 조건: `getHeightAtPoint`는 helper 함수 `mix()`를 호출하지 않고 inline lerp 식으로 보간한다.
```

## 3. 정규 자연어 수도코드

```spec
LOD_REFERENCE_HEIGHT: number = UDEF.PIXEL_RESOLUTION.QHD[1]
    서비스별 화면 크기·DPR에 관계없이 사용하는 고정 1440 기준 높이다.

LOD_CELL_PIXEL_LIMIT: number = 15
    직교 카메라의 기존 셀 크기 판정 기준이다.

U3dQuadTileLodParameters 타입 정의
    camera: THREE.Camera — 현재 카메라 참조
    cameraPosition: THREE.Vector3 — 특수 모드 보정을 적용한 위치 사본
    tileSizeRatio: number — 공통 타일 품질 비율
    useLegacyMetric: boolean — 특수 모드 또는 검색 위치 경로 여부
    projectionScale: number — 고정 1440 기준의 세로 투영 배율
    refinementMaxLevel: number — 자료 최대 레벨, 제한하지 않으면 Infinity, 모두 숨김이면 -Infinity

U3dQuadTileLodContext 타입 정의
    drawArg: UDrawArg — 값을 공유하는 그리기 인수
    parameters?: U3dQuadTileLodParameters — 최초 가시 표준 타일이 채우는 공통 값

U3dQuadTilePresentationLayerState 타입 정의
    layer: U3dLayer — 검사한 레이어
    participant: boolean — 표시 준비 판정 참여 여부
    renderReady: boolean — 렌더링 준비 완료 여부
    attached: boolean — 현재 표시 부착 완료 여부
    retainedPresentationSafe: boolean — 기존 적용본의 표시 안전성
    confirmedEmpty: boolean — 빈 결과 확인 여부

U3dQuadTilePresentationSummary 타입 정의
    renderReady: boolean — 전체 준비 완료 여부
    attached: boolean — 전체 부착 완료 여부
    retainedPresentationSafe: boolean — 전체 기존 표시 안전성
    handoffReady: boolean — 준비와 부착이 모두 완료되었는지 여부
    blockingLayers?: Array<U3dLayer> — 수집을 요청했고 차단이 있을 때만 생성하는 목록

U3dQuadTile extends U3dObject 클래스 정의

    _setHeightScale(scale: number) -> void
        역할: 고도 레이어가 선택한 표시 배율과 타일의 공간 경계를 동기화한다.
        의존:
            UTileMesh — 실제 배율과 수동 행렬 갱신; 속성 읽기·쓰기: {scale.z}; 함수: {setManualUpdate()}
        동작:
            메시가 없거나 실제 메시의 Z 배율이 scale과 같으면 종료한다.
            메시 Z 배율을 설정하고 수동 행렬을 갱신한다.
            고도 로드가 완료되었으면 월드 높이 경계를 갱신한다.
            고도가 아직 연결되지 않았으면 생성 시의 추정 경계를 유지한다.

    #updateHeightBounds() -> void
        역할: 원본 정점을 순회하지 않고 표시 배율을 반영한 LOD 경계를 만든다.
        의존:
            UTileMesh — 로컬 표면 경계와 변환; 속성 읽기: {geometry.boundingBox, scale.z, position.z}
            UDEF — 고도 자료 없음 예약값; 상수: {TERRAIN_NO_DATA}
        동작:
            지오메트리의 최소·최대 Z와 각 Float32 반올림값을 모두 포함하는 높이 범위를 구한다.
            메시의 Z 배율과 위치로 환산하여 타일 월드 상자의 최소·최대 Z에 대입한다.
            월드 상자로 기존 _sphere를 갱신한다.
            원본 로컬 최소·최대 Z가 모두 TERRAIN_NO_DATA이면 _centerZ에 예약값을 유지한다.
            그 외에는 월드 높이 범위 중간값으로 _centerZ를 갱신한다.
            _center.z에 _centerZ를 반영한다.

    changeGeometry(geometry: UPlaneBufferGeometry) -> void
        의존:
            UTileMesh — 공유 지오메트리와 로컬 경계구 갱신; 함수: {changeGeometry(), computeBoundingSphere()}
            __GError__ — 입력·메시 누락 알림; 함수: {__GError__()}
        동작:
            geometry가 없거나 메시가 없으면 해당 오류를 알리고 종료한다.
            기존 메시 지오메트리에 새 자료를 반영하고 현재 표시 배율의 월드 경계를 갱신한다.
            메시의 공유 경계구 객체를 유지하면서 새 높이 범위를 로컬 좌표로 반영한다.

    _getPresentationSummary() -> U3dQuadTilePresentationSummary
        처리 기준: FrameState가 사용하는 내부 집계이며 호출 사이에 결과를 공유하지 않는다.
        동작:
            현재 getPresentationSnapshot 함수 참조를 한 번 읽는다.
            모듈 초기화 때 보존한 표준 함수와 다르면 읽어 둔 함수에 현재 타일을 receiver로 전달하여 인수 없이 즉시 실행하고 그 결과를 반환한다.
            표준 함수이면 전환 대상 레이어를 모으고 상세 배열 없는 집계를 반환한다.

    getPresentationSnapshot() -> object
        동작:
            전환 대상 레이어를 모으고 레이어별 상태 배열과 전체 준비·부착·기존 표시 안전성·전환 가능 여부를 가진 새 객체를 반환한다.

    hasCompletePresentationCoverage() -> boolean
        동작:
            폐기되었거나 타일 또는 메시의 visible이 엄격한 true가 아니면 false를 반환한다.
            전환 대상 레이어의 상세 배열 없는 집계에서 attached를 반환한다.
            prototype.call로 빌려 쓰는 호출에서도 인스턴스의 집계 메서드를 요구하지 않는다.

    setVisible(visible: boolean, skipHandoff: boolean = false, allowRetainedPresentation: boolean = false, requireRetainedPresentationSafety: boolean = false) -> boolean
        동작:
            passLevel 미만이면 true를 반환한다.
            전환 대상 레이어를 모으고 요청 전의 메시 표시 상태를 보존한다.
            숨김 요청에서 skipHandoff가 false이고 제거를 보류하는 레이어가 있으면 false를 반환한다.
            타일·메시와 영상·기타·terrain 레이어의 기존 표시 호출을 수행한다.
            숨김 도중 제거 보류가 생기면 타일·메시와 대상 레이어를 복구하고 false를 반환한다. 보류가 없으면 pending을 해제하고 true를 반환한다.
            표시 요청은 부착 호출 뒤 차단 레이어 수집을 켜고 준비 상태를 집계한다.
            집계 뒤 isRenderable이 있으면 엄격한 true인지 검사한다.
            기존 표시 허용 여부와 attached를 확인하고, 안전성 요구가 켜져 있으면 retainedPresentationSafe도 확인한다.
            runtime 또는 레이어가 전환을 막고 기존 표시도 허용되지 않으면 차단 이름·runtime 차단·pending을 기록한다.
                이름은 실패 분기에서만 조회하며 레이어 차단 없이 runtime만 막으면 빈 이름 배열을 기록한다.
                요청 전 표시 중이었으면 기존 표시를 유지한다. 그 밖에는 준비 상태를 보존한 채 노출을 보류한다. false를 반환한다.
            성공하면 pending·차단 이름·runtime 차단을 초기화하고 true를 반환한다.

    updatePossible() -> boolean
        의존:
            UDrawArg — 카메라·모드·가시성 조회; 함수: {intersectsBox(), getCameraPosition(), getSearchPosition()}; 속성 읽기: {_camera, _frustum}
            THREE.Camera — 투영 배율 조회; 속성 읽기: {projectionMatrix}; 함수: {getDenominator()}
        동작:
            drawArg나 경계 상자가 없거나 실제 레벨이 설정 최소 레벨 미만·최대 레벨 이상이면 분화 요청을 false로 두고 false를 반환한다. 최소·최대 레벨은 앱 설정을 우선하고 미지정 시 공용 기본값을 사용하며 런타임 변경을 즉시 반영한다. world·custom의 시작 레벨이 최소 설정보다 낮아도 예외를 두거나 강제 분화하지 않고 탐색을 중단한다.
            경계 상자가 가시 범위와 교차하지 않으면 같은 방식으로 false를 반환한다.
            현재 동기 순회에서 사용할 수 있는 공통 값을 조회한다.
            레벨별 배율, 공통 타일 크기 비율 또는 개별 비율과 기존 구·상자 크기로 tilesize를 구한다.
            공통 값이 있으면 카메라 위치 사본을 거리 계산용 벡터로 복사한다.
            공통 값이 없으면 카메라 위치를 읽고 특수 모드이면 기존 정책대로 z를 0으로 바꾼다.
            기존 거리 계산을 실행해 distance_에 저장한다.
            특수 모드 또는 검색 위치 보정이 있으면 기존 거리식을 사용한다.
                직교는 span / 64 × 1440 / denominator와 15를 비교한다.
                원근은 tilesize × 1440 / (max(distance_, 1) × denominator)와 기존 resolution을 비교한다.
                직전 분화 요청이 true이면 비교 기준에 0.95를 곱한다.
            일반 모드이면 공통 최대 자료 레벨 또는 개별 계산 결과 이상인 타일의 분화를 멈춘다.
            공통 투영 배율이 없으면 투영 행렬의 세로 배율로 1440 × abs(projection[5]) / 2를 구한다.
                원근이면 max(distance_, 1)로 나누며 직교이면 그대로 쓴다.
                값이 유한하지 않으면 앞의 기존 거리식으로 판정한다.
            직교는 배율 × span / 64 × ratioTileSize를 _spaceError에 저장하고 15 × hysteresis보다 큰지 판정한다.
            원근은 배율 × tilesize를 _spaceError에 저장하고 resolution × hysteresis 이상인지 판정한다.
                일반 원근 카메라에서 기존 값이 분화 기준 이상이고 표준 distanceToCameraPosition을 사용하면 가시 영역 거리 하한으로 보정한다.
                보정에 쓰는 분화 기준 거리는 투영 배율 × tilesize / (resolution × hysteresis)이다.
                구·상자 검색 모두 적용하며, 원래 distance_와 tilesize는 바꾸지 않고 보정 거리로 _spaceError만 다시 계산한다.
                특수 모드·검색 위치 보정·직교·사용자 거리 재정의는 가시 영역 거리 보정을 적용하지 않는다.
            실제 DEM 기하 오차가 없으므로 화면 면적·기울기만으로 품질 기준을 낮추지 않으며, 전체 높이 범위를 포함한 경계를 사용한다.
            결과를 분화 요청 상태에 저장하고 반환한다. hysteresis는 직전 요청이 true이면 0.95, 아니면 1이다.

    #getLodParameters() -> U3dQuadTileLodParameters | undefined
        동작:
            quadset에 동기 범위가 없거나 범위의 drawArg가 현재 타일과 다르면 undefined를 반환한다.
            getTileSize 또는 checkMode를 개별 재정의했으면 undefined를 반환하여 타일별 계산을 유지한다.
            현재 범위에 parameters가 있으면 그대로 반환한다.
            없으면 카메라 참조·위치 사본·품질 비율·특수 모드 또는 검색 위치 경로 여부·고정 1440 투영 배율을 저장한다.
            특수·검색 위치 경로는 최대 자료 레벨을 Infinity로 두고 자료를 검사하지 않는다.
            일반 경로는 최대 자료 레벨을 계산한다.
            완성한 parameters를 현재 범위에 저장하고 반환한다.

    #getRefinementMaxLevel() -> number
        동작:
            drawArg의 지형 편집 영역 목록이 비어 있지 않으면 Infinity를 반환한다.
            quadset 또는 영상·고도 레이어 배열이 없으면 Infinity를 반환한다.
            숨김이 명시되지 않은 사용자·terrain 레이어가 있으면 Infinity를 반환한다.
            표시 대상 영상·고도의 maxlevel 중 유한하지 않은 값이 하나라도 있으면 Infinity를 반환한다.
            그 밖에는 표시 대상 자료의 maxlevel 중 최댓값을 반환한다. 모두 숨김이면 -Infinity다.
            영상·고도 목록이 모두 비어 있으면 초기화·와이어프레임 동작을 위해 Infinity를 반환한다.

    update(drawArg = this._drawArg, frameState, force = false) -> false | void
        의존: UFrameState — 자식 작업·병합 실행; 함수: {addUpdate(), addDispose()}
        동작:
            drawArg가 없으면 false를 반환한다. 기존 검색 카운트 증가·감소를 유지한다.
            quadset의 동기 범위가 없거나 drawArg가 다르면 이전 범위를 보관하고 새 범위를 소유한다. 같은 drawArg의 동기 재귀는 기존 범위를 공유한다.
            분화가 필요하면 기존 병합 lease를 해제하고 네 자식 메타데이터를 유지·생성한다.
            네 자식 중 미초기화 자식은 화면 안팎과 관계없이 메시를 만든다.
            addUpdate에 부모와 force를 전달한다. 부모 전체를 숨길 수 있으려면 네 자식의 준비·표시를 모두 확인해야 한다.
            분화가 필요하지 않으면 기존 addDispose 경로로 병합한다.
            정상 반환·예외 모두 자신이 만든 범위를 이전 값으로 복원하고 검색 카운트를 감소시킨다. 비동기 완료 뒤의 새 호출에는 이전 공통 값이 남지 않는다.

    getLodTransitionDebugState() -> object
        동작:
            기존 분화·작업·표시 전환 진단 상태를 반환한다.

    getTileSize() -> number
        동작:
            drawArg가 없으면 1을 반환하고 있으면 drawArg.getRatioTileSize()를 반환한다.

    getRealSize() -> number
        동작:
            생성 시 구한 타일 대각선 길이 _rsize를 반환한다.

    checkMode() -> boolean
        동작:
            drawArg의 모드가 LANDSCAPE·VISIBILITY·GIZMO·WALK·ROUTE 중 하나인지 반환한다.

    distanceToCameraPosition(useSphere: boolean = false, position?: Vector3) -> number
        동작:
            position이 없으면 drawArg에서 카메라 위치를 읽고 그래도 없으면 0을 반환한다.
            useSphere이고 구 경계가 있으면 구까지 거리, 그 밖에는 상자까지 거리를 반환한다.

    computeChildren(drawArg, type) -> void
        동작:
            _childTiles를 빈 배열로 만들거나 기존 배열 길이를 0으로 초기화한다.
            네 분면의 자식 필드가 없으면 현재 생성자에 절반 영역·다음 레벨·부모·장면·drawArg·종류·시작 레벨·분면·quadset을 전달해 만들고 renderOrder를 0으로 둔다.
            기존 또는 새 자식을 북서·북동·남서·남동 순서로 _childTiles에 넣는다.

    dispose(callback?: boolean | ((tile: U3dQuadTile) -> void)) -> void
        인터페이스:
            자신과 하위 타일의 작업·자원을 한 번만 정리한다. 이미 해제된 타일은 아무 작업도 하지 않는다.
            하나의 실패는 원래 오류를, 여러 실패는 호출 순서대로 담은 errors 배열을 가진 Error를 전달한다.
        동작:
            해제 상태를 먼저 기록하여 재진입을 막고 _disposeChildren으로 자식부터 정리한 뒤 자신의 알림·자원 정리를 수행한다.
            격자·캐시 제거가 실패해도 대기·완료 작업 정리와 handoff lease 반납을 시도한다.
            lease는 레이어 정리보다 먼저 반납한다. 레이어·표시 해제·메시·완료 콜백의 실패도 수집하며 다음 단계를 계속한다.
            부모·자식 목록 참조와 초기화 상태를 정리한다. 자식 하나가 실패해도 나머지 자식을 처리하고 각 방향 참조를 제거한다.
            모든 정리 시도를 마친 뒤 수집한 오류를 전달한다.

    createMesh(material, drawArg = this._drawArg) -> boolean
        동작:
            실제 레벨이 passLevel 미만이면 초기화 상태만 true로 두고 true를 반환한다.
            이미 메시가 있으면 false를 반환한다. 그 밖에는 UTileMesh(this)를 만든다.
            그룹이 있으면 그룹의 name·basemesh를 설정하고 메시가 있으면 초기화 상태를 true로 둔다.
            true를 반환하며 material 인수는 사용하지 않는다.

    checkHeightLoaded() -> boolean
        인터페이스:
            tile height data 로드 여부를 반환한다.

        동작:
            `isHeightLoaded()` 결과를 반환한다.

    getHeightAtPointPrev(x: number, y: number) -> number
        인터페이스:
            이전 방식으로 tile geometry에서 Google 좌표에 해당하는 z 값을 계산한다.
            반환: 구글 스케일이 적용된 z 값 또는 `UDEF.TERRAIN_NO_DATA`

        동작:
            `isHeightLoaded()`가 false이면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            height grid width를 64로 둔다.
            `_rectangle3d.ptLeftBottom`과 `_rectangle3d.ptRightTop`에서 minx, miny, maxx, maxy를 읽는다.
            Google 좌표를 tile 내부 grid 절대 좌표인 indexX와 indexY로 변환한다.
            `Math.floor`와 `Math.ceil` 결과를 `THREE.MathUtils.clamp`로 grid 범위에 제한한다.
            `getHeightByXY`로 A, B, C, D 네 grid point의 z 값을 읽는다.
            `mix(B, C, indexX)`로 위쪽 행을 보간한다.
            `mix(A, D, indexX)`로 아래쪽 행을 보간한다.
            `mix(bottomMixValue, topMixValue, indexY)` 결과를 반환한다.

    getHeightAtPoint(x: number, y: number) -> number
        인터페이스:
            tile geometry의 position buffer에서 Google 좌표에 해당하는 render height z 값을 bilinear interpolation으로 계산한다.
            반환: 구글 스케일이 적용된 z 값 또는 `UDEF.TERRAIN_NO_DATA`

        동작:
            `isHeightLoaded()`가 false이면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            `_mesh.geometry`, `geometry.attributes.position.array`, `geometry._uwidth`, `_rectangle3d`를 지역 변수로 읽는다.
            position buffer, row width 또는 rectangle이 없으면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            height grid width를 64로 둔다.
            rectangle에서 minx, miny, maxx, maxy를 읽는다.
            rectangle 너비와 높이의 역수를 계산한다.
            너비 또는 높이 역수가 유한하지 않으면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            Google 좌표를 tile 내부 grid 절대 좌표로 변환한다.
                indexX는 `(x - minx) * invWidth * width`이다.
                indexY는 `(maxy - y) * invHeight * width`이다.
            indexX와 indexY의 정수부를 `Math.floor`로 구한다.
            정수부와 정수부 + 1을 각각 `clampHeightGridIndex`로 grid 범위에 제한해 네 grid index를 만든다.
            indexX와 indexY의 소수부를 `clampHeightMix`로 보간 비율에 제한한다.
            `getHeightByGrid(positionArray, rowWidth, minIndexX, maxIndexY)`로 A 값을 읽는다.
            `getHeightByGrid(positionArray, rowWidth, minIndexX, minIndexY)`로 B 값을 읽는다.
            `getHeightByGrid(positionArray, rowWidth, maxIndexX, minIndexY)`로 C 값을 읽는다.
            `getHeightByGrid(positionArray, rowWidth, maxIndexX, maxIndexY)`로 D 값을 읽는다.
            B에서 C로 X축 보간해 위쪽 행 값을 계산한다.
            A에서 D로 X축 보간해 아래쪽 행 값을 계산한다.
            위쪽 행 값에서 아래쪽 행 값으로 Y축 보간한 값을 반환한다.

    isDisposed() -> boolean
        인터페이스:
            tile disposed 상태를 반환한다.

        동작:
            `_disposed` 값을 반환한다.

getVisibleBoxDistance(box: THREE.Box3, position: THREE.Vector3, frustum: THREE.Frustum | undefined, distance: number, refineDistance: number = 0) -> number
    의미:
        화면 밖 가까운 경계 때문에 생기는 과도한 분화를 줄이기 위한 가시 영역 거리 하한이다.
        가시 영역의 실제 어떤 점까지 거리보다도 크지 않으며, 기존 거리보다 작아지지 않는다. 입력 상자·위치·시야는 수정하지 않는다.
    동작:
        여섯 시야 평면이 없거나 기존 거리가 유한하지 않거나 1 이하이면 기존 거리를 반환한다.
        상자를 카메라 상대 좌표의 축별 범위로 읽는다. 범위가 뒤집혔거나 크기가 유한하지 않으면 기존 거리를 반환한다.
        가장 먼 꼭짓점도 refineDistance 이내이면 분화 결과가 바뀔 수 없으므로 기존 거리를 반환한다.
        경계 여유는 가장 긴 축 길이 / 64와 월드 좌표 크기에 비례한 부동소수점 여유의 합이다.
        near 평면까지 상자 전체가 여유보다 멀지 않으면 기존 거리를 반환한다.
        상자의 최근접점이 여유를 포함한 네 측면 평면 안이면 기존 거리를 반환한다.
        네 측면 반공간의 조건을 두 번 순회하며 다른 축의 최대 기여를 사용해 각 축의 필요 범위를 좁힌다.
            좁힌 상자는 실제 교집합을 계속 포함한다. 계산이 유한하지 않거나 교집합 부재·뒤집힌 범위가 나오면 기존 거리를 반환한다.
        좁힌 상자의 최근접 거리가 유한하지 않으면 기존 거리를 반환한다.
        상자 거리의 증가분과 기존 구·상자 거리 차이를 구한다. 거리 차이는 증가분 / 경계 여유를 1로 제한한 비율로 반영한다.
            구 거리 보정이 시작되는 경계에서 갑자기 상자 거리로 전환되지 않게 한다. 여유가 0이면 비율은 1이다.
            반환값은 기존 거리 이상이며 좁힌 상자의 거리 하한을 넘지 않는다.
        호출마다 임시 벡터·상자·배열을 만들지 않는다. 함수는 표준 반공간·거리 계산을 사용하며 외부 상태를 변경하지 않는다.

getTileTransitionLayers(tile: U3dQuadTile) -> Array<U3dLayer>
    동작:
        최소 레벨 또는 명시적인 참여 선언을 만족하고 visible이 엄격한 true인 영상, visible이 엄격한 true인 기타 레이어, 존재하는 terrain 레이어 순서로 모은다.
        Set으로 같은 레이어 참조를 제거하고 첫 등장 순서의 배열을 반환한다.

createTilePresentationSnapshot(tile: U3dQuadTile, transitionLayers: Array<U3dLayer>) -> object
    동작:
        전환 대상 수와 같은 길이의 layerStates 배열을 만든다.
        차단 수집은 끄고 상세 배열을 전달하여 상태를 집계한다.
        중간 집계 객체를 만들거나 복사하지 않고 집계 함수가 만든 상세 결과 객체를 그대로 반환한다.

createTilePresentationSummary(tile: U3dQuadTile, transitionLayers: Array<U3dLayer>, collectBlockingLayers: boolean = false, layerStates?: Array<U3dQuadTilePresentationLayerState>) -> U3dQuadTilePresentationSummary & Partial<{layerStates: Array<U3dQuadTilePresentationLayerState>}>
    의존:
        U3dLayer — 레이어별 표시 계약 조회; 함수: {isTileSceneProvider(), isTilePresentationParticipant(), isTilePresentationConfirmedEmpty(), isTileRenderableReady(), isTilePresentationAttached(), isTilePresentationVisible(), isTileRetainedPresentationSafe()}
    동작:
        전환 대상 레이어를 순서대로 모두 검사한다. 앞선 레이어의 실패 때문에 뒤 레이어의 훅을 생략하지 않는다.
        sceneProvider와 presentationParticipant를 먼저 조회한다.
            둘 중 하나라도 정의되어 있으면 엄격한 true인 참여 선언으로 판정한다.
            둘 다 undefined이면 준비·표시·부착 조회 함수 중 하나라도 있는 레이어를 기존 참여자로 판정한다.
        빈 결과 확인을 조회한다. 비참여·확인된 빈 결과·준비 훅 부재이면 준비 완료이고 그 밖에는 준비 훅의 엄격한 true를 사용한다.
        참여 중이며 빈 결과가 아니면 부착 훅을 우선 조회하고, 없으면 표시 훅을 사용한다. 훅의 엄격한 true를 부착 완료로 사용한다.
        비참여·확인된 빈 결과·준비 완료이면 기존 표시가 안전하다. 그 밖에는 부착 완료와 안전성 훅의 엄격한 true가 모두 필요하다.
        layerStates가 있는 상세 조회에서만 배열의 다음 인덱스에 layer·participant·renderReady·attached·retainedPresentationSafe·confirmedEmpty를 가진 상태 객체를 기록한다.
        준비·부착·기존 표시 안전성을 같은 반복문에서 지역 변수에 누적한다.
        차단 수집이 요청되었고 준비 또는 부착이 실패한 경우에만 첫 차단에서 배열을 만들고 레이어 참조를 추가한다.
        모든 검사 뒤 layerStates가 있으면 layerStates·renderReady·attached·retainedPresentationSafe·handoffReady 순서의 최종 객체를 한 번만 만들어 반환한다. 상세 경로는 차단 수집을 요청하지 않는다.
        layerStates가 없으면 전체 준비·부착·기존 표시 안전성, 준비와 부착이 모두 true인지 나타내는 handoffReady, 차단 목록을 가진 새 집계 객체를 반환한다.

getHeightByGrid(positionArray, rowWidth, x: number, y: number) -> number
    인터페이스:
        평평한 position buffer에서 grid 좌표에 해당하는 정점의 z 값을 반환한다.
        positionArray: `[x0, y0, z0, x1, y1, z1, ...]` 형태의 geometry position buffer
        rowWidth: 한 행의 정점 개수
        x: grid column index
        y: grid row index

    동작:
        `(((y + 1) * rowWidth) + (x + 1)) * 3`으로 정점 buffer index를 계산한다.
        position buffer의 z component인 `positionArray[idx + 2]`를 반환한다.

clampHeightGridIndex(value: number, width: number) -> number
    인터페이스:
        height grid index를 유효 범위로 제한한다.

    동작:
        value를 0 이상으로 제한한다.
        결과를 `width - 1` 이하로 제한해 반환한다.

clampHeightMix(value: number) -> number
    인터페이스:
        보간 비율을 0 이상 1 이하로 제한한다.

    동작:
        value를 0 이상으로 제한한다.
        결과를 1 이하로 제한해 반환한다.
```

## 4. 공통 계약과 제약

```spec
`getHeightAtPoint`의 `width`는 height grid 해상도이고 현재 구현에서 64로 고정되어 있다.
`geometry._uwidth`는 position buffer의 행 너비이며 skirt를 포함할 수 있다.
`getHeightByGrid`는 skirt를 제외한 terrain grid 영역을 참조하기 위해 x와 y에 각각 1을 더해 position buffer index를 계산한다.
LOD의 화면 높이 기준은 정책상 1440으로 고정하며 canvas 크기·DPR을 사용하지 않는다.
특수 모드의 z=0 거리 계산과 검색 위치 보정 경로는 기존 정책을 유지한다.
부모는 네 분면 전체를 담당하므로 네 자식의 메시·레이어 준비를 화면 밖이라는 이유로 생략하거나 부모 제거 조건에서 제외하지 않는다.
직교의 셀 크기 기준은 DEM의 실제 기하 오차를 측정한 값이 아니다. 원근의 고도 상세화는 기존 거리 기반 기준을 유지한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
