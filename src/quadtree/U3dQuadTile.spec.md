# U3dQuadTile 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dQuadTile`은 quadtree의 한 지형 영역과 네 자식을 나타낸다. 공간 경계·타일 메시·작업 상태를 보관하고, 카메라와 자료 레벨에 따라 분화를 요청하며 부모·자식 화면 교체에 필요한 레이어 표시 상태를 제공한다.

### 1.2 책임 범위

타일 생성과 자식 재사용, 동기 순회의 LOD 공통 값, 메시 배율과 경계 갱신, 표시 준비·부착 검사, 작업 취소와 자원 해제, 격자 높이 조회를 담당한다.

책임 경계: 부모·자식의 실제 순회·분화/병합 실행은 tile process가, 개별 레이어의 요청 실패·렌더 준비와 lease 소유권은 해당 레이어 및 terrain decal manager가 결정한다. 이 객체는 그 계약의 결과로 표시를 허용하거나 보류한다. 좌표에 맞는 타일 탐색과 높이 LOD fallback은 `UDrawArg`가 담당한다.

### 1.3 주요 동작 방식

경계와 시작 레벨로 타일을 초기화하고 갱신 시 투영 오차로 분화를 판정한다. 분화에 필요한 네 자식의 메시를 모두 준비하여 순회 작업에 전달한다. 표시 전환은 레이어의 준비·부착·기존 적용본 안전성과 제거 보류를 각각 확인한다. 해제는 자식부터 처리하고 자신의 lease를 레이어 폐기 전에 반납한다.

### 1.4 주요 사용처와 연계 대상

`U3dQuadTileProcess`와 `U3dQuadTileWorkProcess`는 자식·표시·작업 상태를 사용한다. `UDrawArg.getRenderHeightAtPoint`는 `getHeightAtPoint`의 보간 높이를 조회한다. 영상·terrain·벡터 레이어는 타일 표시 hook과 연결되며 `UShaderTerrainDecalManager`는 전환 중 유지되는 화면의 lease를 관리한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
높이 데이터가 로드되지 않았으면 높이 조회는 UDEF.TERRAIN_NO_DATA를 반환한다.
getHeightAtPoint는 position 배열 부재·유한하지 않은 행 너비·사각형 부재·유한하지 않은 역폭/역높이를 결측값으로 처리한다.
높이 조회는 Google 좌표를 타일 격자 좌표로 변환하여 네 정점의 높이를 이중 선형 보간하고 메시의 Z 배율을 적용한다.
높이 격자 인덱스는 0 이상 width - 1 이하, 보간 비율은 0 이상 1 이하로 제한한다.
부모가 담당하는 네 분면의 자식 메시 준비는 화면 밖이라는 이유로 생략하지 않는다.
타일 표시 준비와 원격 벡터 데이터 수신 완료는 별도 계약이다. 데이터 대기·실패를 지형 전환의 차단자로 볼지는 해당 레이어의 표시 hook 결과를 따른다.
```

### 2.2 성능 및 품질 요구사항

```spec
LOD의 화면 높이는 canvas 크기·DPR과 무관한 QHD 1440을 기준으로 한다.
한 동기 순회에서 카메라·투영·자료 최대 레벨의 공통 계산을 지연 생성하여 공유한다. 타일별 거리·경계·레벨·분화 이력은 각각 계산한다.
일반 표시 집계는 상세 레이어 상태 배열을 만들지 않고, 차단 목록도 요청 시에만 생성한다.
getHeightAtPoint는 geometry·position 배열·행 너비·사각형을 지역 참조로 읽고 helper mix 호출 없이 inline 선형 보간한다.
```

## 3. 정규 자연어 수도코드

```spec
campos: Vector3
    의존: THREE — 카메라 위치를 받는 모듈 공용 임시 값; 생성자: {new Vector3()}

LOD_COARSEN_HYSTERESIS_RATIO: number = 0.95
LOD_REFERENCE_HEIGHT: number = UDEF.PIXEL_RESOLUTION.QHD[1]
    의존: UDEF — 고정 화면 높이; 상수: {PIXEL_RESOLUTION.QHD}
LOD_CELL_PIXEL_LIMIT: number = 15
DEM_SIZE_X: number = 64
DEM_SIZE_Y: number = 64
TILE_PRESENTATION_SNAPSHOT
    getPresentationSnapshot의 원래 prototype 함수 참조이며 상세 재정의 호환 경로를 선택한다.
TILE_DISTANCE_TO_CAMERA_POSITION
    distanceToCameraPosition의 원래 prototype 함수 참조이며 가시 경계 거리 보정 적용 여부를 비교한다.

U3dQuadTileLodParameters 타입 정의
    camera: Camera — 현재 카메라 참조
    cameraPosition: Vector3 — 특수 모드 Z 보정을 적용한 카메라 위치 사본
    tileSizeRatio: number — 동기 순회의 타일 품질 비율
    useLegacyMetric: boolean — 특수 모드 또는 검색 위치가 있는 기존 판정 경로
    projectionScale: number — 고정 1440 기준 세로 투영 배율
    refinementMaxLevel: number — 자료 최대 레벨; 제한 없음은 Infinity, 모두 숨김은 -Infinity

U3dQuadTileLodContext 타입 정의
    drawArg: UDrawArg — 같은 순회에서 공유할 그리기 인수
    parameters?: U3dQuadTileLodParameters — 최초 가시 표준 타일에서 지연 계산한 공통 값

U3dQuadTilePresentationLayerState 타입 정의
    layer: U3dLayer — 상태를 검사한 레이어
    participant: boolean — 표시 준비 계약 참여 여부
    renderReady: boolean — 렌더링 준비 완료 여부
    attached: boolean — 화면 부착 완료 여부
    retainedPresentationSafe: boolean — 기존 적용본의 표시 안전성
    confirmedEmpty: boolean — 빈 결과가 확정됐는지 여부

U3dQuadTilePresentationSummary 타입 정의
    renderReady: boolean — 렌더링 준비 완료 여부
    attached: boolean — 화면 부착 완료 여부
    retainedPresentationSafe: boolean — 기존 적용본의 표시 안전성
    handoffReady: boolean — 전체 준비와 부착이 모두 완료됐는지 여부

U3dQuadTile extends U3dObject 클래스 정의
    의존: U3dObject — 타일의 기반 이벤트 객체; 상속: {U3dObject}
    isU3dQuadTile: boolean = true
    distance_: number = 0
    visible: boolean
        읽기는 _visible, 쓰기는 _visible 직접 저장이며 레이어 표시 갱신은 setVisible을 통해 수행한다.
    static g_minLevel: number = 0
    static g_maxLevel: number = 19
    static g_startLevel: number = 0
    static g_ratioTileMap: object = {6: 1.5, 7: 1.7, 8: 2, 16: 0.8, 17: 0.6, 18: 0.4}
    #workedNearTileSkirt
    #resolution: number
    #refineRequested: boolean = false
    _lodPresentPending: boolean = false
    _scene
    _quadset
    _drawArg
    _parent
    _type
    _level: number
    _startlevel: number
    _rlevel: number
    _key: string
    _rectangle
    _rectangle3d
    _boundingbox: Box3
    _sphere: Sphere
    _center: Vector3
    _mesh: UTileMesh | null | undefined
    _childTiles?: Array<U3dQuadTile>
    _northWestChild: U3dQuadTile | null | undefined
    _northEastChild: U3dQuadTile | null | undefined
    _southWestChild: U3dQuadTile | null | undefined
    _southEastChild: U3dQuadTile | null | undefined
    _initialized: boolean = false
    _disposed: boolean = false
    heightLoaded_
    _spaceError: number
    _waitWork: Map
    _endWork: Map
    _processed
    _worked
    _workState

    constructor(minx, maxx, miny, maxy, level, scene, drawArg, type, parent, startlevel, quadname, quadset)
        의존:
            U3dObject — 기반 이벤트 객체 초기화; 상속: {U3dObject}; 생성자: {new U3dObject()}
            UDrawArg — 앱별 시작 레벨; 함수: {getDataLevel()}; 속성 읽기: {_app._minlevel, _app._maxlevel}
            UDEF — 좌표·타입·처리 단계; 상수: {GOOGLE, TILE_TYPE.TERRAIN, PROCESS.WORK_STATE.NONE}
            defined — null·undefined 판정; 함수: {defined()}
            U3dMessage — 진단 출력; 함수: {error()}
            THREE — 공간 값과 메시 객체; 생성자: {new Vector3(), new Box3(), new Sphere()}
            UMathEngine — Google 사각형과 타일 인덱스; 함수: {createUGeoRect(), getGoogleToIndexXY()}
            UDEF — 타일 키 생성; 함수: {createKey()}
            smoothStep — 레벨별 해상도 보간; 함수: {smoothStep()}
        동작:
            기반 생성자를 호출하고 _classtype을 설정한다. scene이나 drawArg가 defined가 아니면 해당 오류를 기록하고 나머지 초기화 없이 반환한다.
            장면·quadset·XY 경계와 level을 저장한다. startlevel이 defined면 그대로 쓰고, 아니면 drawArg.getDataLevel의 nullish fallback으로 정적 시작 레벨을 사용한다. 실제 레벨은 level + startlevel이며 type이 falsy면 TERRAIN이다.
            중심·좌표 범위·Google 사각형을 생성한다. _rectangle3d는 _rectangle과 같은 참조다. 중심의 실제 레벨별 타일 인덱스로 key와 메시 이름을 정한다.
            대각선 길이의 내림값을 실제 크기로 저장한다. 앱 _maxlevel이 nullish일 때만 getMaxLevel을, _minlevel이 nullish일 때만 getMinLevel을 호출하여 smoothStep의 최대·최소 레벨을 정한다. 실제 레벨의 smoothStep 결과에 256을 곱해 #resolution을 정한다. 초기 높이 반경은 짧은 XY 변의 1/4이고 이 범위의 Box3와 Sphere를 만든다.
            메시와 네 자식은 null, 초기화·폐기·표시는 false, 처리·작업 단계는 NONE으로 설정한다. skirt 정보를 비우고 대기·완료 Map을 생성한다.
            인스턴스의 visible 접근자는 _visible을 그대로 읽고 쓰도록 정의한다. 접근자에 enumerable·configurable 옵션은 지정하지 않는다.

    static setMaxLevel(level: number) -> void
        동작:
            전역 g_maxLevel에 level을 검증·보정 없이 저장한다.

    static getMaxLevel() -> number
        동작:
            전역 g_maxLevel 값을 반환한다.

    static setMinLevel(level: number) -> void
        동작:
            전역 g_minLevel에 level을 검증·보정 없이 저장한다.

    static getMinLevel() -> number
        동작:
            전역 g_minLevel 값을 반환한다.

    static setStartLevel(level: number) -> void
        동작:
            전역 g_startLevel에 level을 검증·보정 없이 저장한다.

    static getStartLevel() -> number
        동작:
            전역 g_startLevel 값을 반환한다.

    getScale() -> {x: number, y: number, z: number}
        동작:
            매번 새 {x: 1, y: 1, z: 1} 객체를 만들고 메시가 있으면 메시의 각 scale 값으로 바꾸어 반환한다.

    setSkirtInfo(skirtInfo) -> void
        동작:
            #workedNearTileSkirt에 skirtInfo 참조를 저장한다.

    getSkirtInfo()
        동작:
            저장한 #workedNearTileSkirt를 그대로 반환한다.

    clearSkirtInfo() -> void
        동작:
            #workedNearTileSkirt를 undefined로 비운다.

    getHeightByXY(x: number, y: number) -> number
        동작:
            메시 geometry의 position 배열에서 ((y + 1) * geometry._uwidth + (x + 1)) * 3 + 2 위치의 원래 Z 값을 반환한다. 로드 여부·입력 범위를 검사하거나 메시의 scale을 적용하지 않는다.

    _heightRevision: number = 0
        이 타일에 고도 지오메트리를 적용한 횟수이며, 이웃 스커트의 완료 상태 비교에 사용한다.
    get heightRevision() -> number
        동작: _heightRevision을 반환한다.
    set heightRevision(value: number) -> void
        입력: 0 이상의 정수인 고도 적용 변경 번호
        동작: _heightRevision에 입력을 저장한다.

    _setHeightScale(scale: number) -> void
        의존:
            UTileMesh — 배율 변경 후 수동 갱신; 함수: {setManualUpdate()}; 속성 쓰기: {scale.z}
        동작:
            메시가 없거나 현재 scale.z가 scale과 같으면 반환한다. 메시 scale.z를 바꾸고 수동 갱신을 요청한다.
            높이가 로드됐을 때만 경계 높이·중심·구를 갱신한다.

    #updateHeightBounds() -> void
        의존:
            UDEF — 높이 결측값; 상수: {TERRAIN_NO_DATA}
            THREE.Box3 — 새 높이 경계에서 구 갱신; 함수: {getBoundingSphere()}
        동작:
            geometry.boundingBox의 최소·최대 Z와 각 값의 Math.fround 결과를 함께 비교해 보수적인 높이 경계를 구한다. 정점을 재순회하지 않는다.
            각 높이에 mesh.scale.z를 곱하고 mesh.position.z를 더해 _boundingbox의 높이 범위를 갱신하고 _sphere를 다시 구한다. 생성 시의 _minz·_maxz 값은 여기서 바꾸지 않는다.
            로컬 최소·최대가 모두 TERRAIN_NO_DATA이면 중심 Z도 그 값이다. 그 밖에는 변환한 두 높이의 중간값으로 _centerZ와 _center.z를 갱신한다.

    _refreshSurfaceBounds() -> void
        역할: 표면 보정·복원 후 원본 적용 번호를 유지하면서 공간 경계를 갱신한다.
        의존:
            UPlaneBufferGeometry — 공유 로컬 경계와 가속 피킹; 함수: {computeBoundingBox(), computeBoundingSphere(), boundsTree.refit()}
            UTileMesh — 공유 로컬 경계구 갱신; 함수: {computeBoundingSphere()}
        동작: 메시 지오메트리가 없거나 타일이 종료됐으면 끝낸다. 기존 지오메트리 상자·구를 다시 계산하고 존재하는 boundsTree를 refit한다. 월드 경계와 공유 메시 경계구를 갱신한다.

    changeGeometry(geometry: UPlaneBufferGeometry) -> void
        의존:
            UTileMesh — 메시 지오메트리 교체와 구 경계 갱신; 함수: {changeGeometry(), computeBoundingSphere()}
            __GError__ — 실패 진단; 함수: {__GError__()}
        동작:
            geometry나 메시가 없으면 오류를 기록하고 반환한다.
            메시의 changeGeometry로 기존 지오메트리에 새 자료를 반영한 뒤 높이 경계와 구를 갱신하고 메시의 computeBoundingSphere에 현재 타일을 전달한다. 메시의 공유 경계구 객체를 교체하지 않고 월드 경계를 메시 로컬 좌표로 환산한다.
            _heightRevision을 1 증가시키고 자기 완료 스커트 정보를 비운다.
            같은 지오메트리·속성을 다시 적용해도 변경 번호를 올린다. 이웃 USkirtNode는 이 번호의 스냅샷으로 새 고도 적용을 감지한다.
            스커트 계산의 position.needsUpdate 설정은 이 메서드를 호출하지 않으므로 변경 번호를 올리지 않는다.

    _getPresentationSummary() -> U3dQuadTilePresentationSummary
        동작:
            getPresentationSnapshot 함수 참조를 한 번 읽는다. 모듈 초기화 때 보존한 원형과 다르면 읽은 함수를 현재 타일을 this로, 인수 없이 호출해 결과를 반환한다.
            원래 함수이면 전환 레이어를 수집하고 상세 layerStates 배열을 만들지 않는 집계 결과를 반환한다.

    updatePossible() -> boolean
        의존:
            UDrawArg — 카메라·frustum·검색 위치; 함수: {intersectsBox(), getCameraPosition(), getSearchPosition()}; 속성 읽기: {_app._minlevel, _app._maxlevel, _camera, _frustum}
            UDEF — 검색 방식과 기준 화면; 상수: {SEARCH_TYPE, PIXEL_RESOLUTION.QHD}
            카메라 — 기존 거리/직교 분모; 함수: {getDenominator()}; 속성 읽기: {isOrthographicCamera, isPerspectiveCamera, projectionMatrix.elements}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            drawArg·경계가 없거나 실제 레벨이 앱 우선 최소 레벨 미만 또는 최대 레벨 이상이면 #refineRequested를 false로 하고 false다. 현재 frustum과 경계가 교차하지 않아도 같은 결과다.
            공유 LOD 매개변수를 조회한다. common.tileSizeRatio가 nullish이면 getTileSize를 호출하고 그 밖에는 공통 비율을 사용한다. 레벨별 g_ratioTileMap 값 또는 1에 이 비율과 검색 방식별 구 반경 또는 실제 크기를 곱해 tilesize를 구한다.
            공통 값이 있으면 그 cameraPosition을 공유 campos로 복사하여 사용자 거리 함수가 공통 사본을 바꾸지 않게 한다. 없으면 카메라 위치를 얻고 특수 모드에서 Z를 0으로 둔다. 특수 모드이거나 검색 위치가 null이 아니면 기존 판정 경로다. 타일 경계까지의 거리를 distance_에 저장한다.
            표준 경로에서 common.refinementMaxLevel이 nullish인 경우에만 자료 최대 상세 레벨을 별도 계산하고 그 밖에는 공통 값을 사용한다. 실제 레벨이 그 이상이면 분화를 해제한다. 공통 projectionScale이 nullish일 때만 1440 * abs(projectionMatrix.elements[5]) / 2를 계산한다. 직교 카메라는 이 값을, 원근 카메라는 max(distance_, 1)로 나눈 값을 사용한다.
            유한한 표준 배율을 얻으면 직전 분화 요청이 있을 때만 임계값에 0.95를 곱한다. 직교는 최대 XY 변 / DEM_SIZE_X * 타일 품질 비율의 화면 셀 크기가 15 임계값보다 큰지를 판정한다.
            원근은 tilesize의 화면 크기가 #resolution 임계값 이상인지 판정한다. 최초 오차가 임계값 이상이고 실제 원근 카메라이며 거리 함수가 원형일 때만 화면 내 경계 거리 하한으로 오차를 다시 계산한다. helper의 refineDistance는 projectionScale * tilesize / (#resolution * hysteresis)이며 원래 distance_와 tilesize는 유지한다.
            기존 경로 또는 표준 배율이 유한하지 않으면 QHD 높이와 camera.getDenominator를 사용한다. 직교 오차는 최대 XY 변 / DEM_SIZE_X * 1440 / denominator이고 원근은 tilesize * 1440 / (max(distance_, 1) * denominator)다. 직전 분화 시 임계값에 0.95를 적용하며 직교는 > 15 임계값, 원근은 >= #resolution 임계값을 사용한다.
            사용한 오차를 _spaceError에 기록하고 판정값을 #refineRequested에 저장해 반환한다.

    #getLodParameters() -> U3dQuadTileLodParameters | undefined
        의존:
            UDrawArg — 동기 공유용 카메라 및 검색 상태; 함수: {getCameraPosition(), getSearchPosition()}; 속성 읽기: {_camera}
            THREE — 공간 값과 메시 객체; 생성자: {new Vector3()}
        동작:
            quadset의 동기 LOD context가 없거나 drawArg가 다르면 undefined다. getTileSize 또는 checkMode가 현재 U3dQuadTile.prototype의 해당 함수와 달라도 공통화를 적용하지 않는다.
            context 검사를 모두 통과해도 context.parameters가 truthy이면 같은 객체를 즉시 반환한다. 검사를 통과했고 parameters가 falsy인 경우에만 카메라 위치 사본과 특수 모드의 Z 보정, 타일 품질 비율, 검색 위치 사용 여부, 투영 배율을 한 번 계산한다.
            기존 판정 경로이면 refinementMaxLevel을 Infinity로 두고 표준 경로이면 자료 최대 레벨을 구한다. 객체를 context.parameters에 저장하고 반환한다.

    #getRefinementMaxLevel() -> number
        의존:
            UDrawArg — 높이 편집 여부; 함수: {getEditHeightBoxList()}
            U3dQuadSet — 레이어별 상세 범위; 속성 읽기: {_imageLayers, _heightLayers, _otherLayers, _terrainLayer}
            U3dLayer — 가시성과 자료 최대 레벨; 함수: {getVisible()}; 속성 읽기: {_maxlevel}
        동작:
            높이 편집 상자가 있거나 quadset·영상/높이 레이어 배열이 없으면 Infinity다. 기타 또는 terrain 레이어 중 visible이 false가 아닌 레이어가 있어도 Infinity다.
            영상·높이 레이어의 visible이 false인 항목은 건너뛰고 각 maxlevel을 확인한다. 유한하지 않은 최대 레벨이 하나라도 있으면 Infinity다.
            두 배열이 모두 비었으면 Infinity다. 그 밖에는 가시 레이어의 최대 maxlevel이며 모두 숨겨져 있으면 -Infinity를 반환한다.

    _isLodRefinementRequested() -> boolean
        동작:
            이번 순회에서 기록한 내부 분화 의도만 반환한다. 진단 객체나 작업 이름 배열을 생성하지 않고 표시·분화 상태를 바꾸지 않는다.

    getMesh() -> UTileMesh | null | undefined
        동작:
            현재 _mesh 참조를 반환한다.

    getWaitWork(workName)
        동작:
            _waitWork.get(workName) 결과를 반환한다.

    setWaitWork(work) -> void
        동작:
            work.name을 키로 work 참조를 _waitWork에 저장한다.

    isWait() -> boolean
        동작:
            _waitWork.size가 0보다 큰지 반환한다.

    isWaitWork(workName) -> boolean
        동작:
            _waitWork.has(workName) 결과를 반환한다.

    deleteWaitWork(workName) -> boolean
        동작:
            대기 Map에 workName이 있으면 삭제하고 true다. 없으면 false다.

    clearWaitWork(workName) -> void
        의존:
            대기 work — 작업 취소와 해제; 함수: {ready.reject(), dispose()}
        동작:
            workName은 사용하지 않는다. 대기 작업이 있으면 모든 값에 ready.reject와 dispose를 차례로 호출한 뒤 Map을 비운다.
            개별 작업 호출의 예외를 이 함수에서 보호하지 않으므로 예외가 나면 나머지 순회와 Map.clear는 실행되지 않는다.

    getEndWork(workName)
        동작:
            _endWork.get(workName) 결과를 반환한다.

    setEndWork(work) -> void
        동작:
            work.name을 키로 work 참조를 _endWork에 저장한다.

    hasEndWork(workName) -> boolean
        동작:
            _endWork.has(workName) 결과를 반환한다.

    deleteEndWork(workName) -> boolean
        동작:
            완료 Map에서 얻은 work가 truthy이면 키를 삭제하고 true다. 그 밖에는 false다.

    clearEndWork(workName) -> void
        의존:
            완료 work — 작업 취소와 해제; 함수: {ready.reject(), dispose()}
        동작:
            workName은 사용하지 않는다. isWait가 true일 때만 완료 Map 값들의 ready.reject·dispose를 호출한 뒤 _endWork를 비운다.
            대기 Map이 비어 있으면 완료 작업의 ready.reject·dispose를 호출하지 않고 완료 Map만 비운다. 개별 작업 호출이 던지면 이후 순회와 clear도 중단된다.

    getKey() -> string
        동작:
            현재 _key를 반환한다.

    toString() -> string
        동작:
            타일의 _x·_y·_rlevel을 x:<x> y:<y> level:<rlevel> 형식의 문자열로 반환한다.

    setHeightLoaded(val) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            val이 defined가 아니면 true를, 그 밖에는 val 자체를 heightLoaded_에 저장한다.

    isHeightLoaded() -> boolean
        동작:
            heightLoaded_를 !!로 변환한 boolean을 반환한다.

    getRealLevel() -> number
        동작:
            level과 시작 레벨을 합한 _rlevel을 반환한다.

    getRealSize() -> number
        동작:
            생성 시 계산한 XY 대각선 길이 내림값 _rsize를 반환한다.

    getBoundingbox() -> Box3
        동작:
            현재 _boundingbox 참조를 반환한다.

    resetOpacity(val) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            val은 사용하지 않는다. 메시와 material이 defined이면 material.opacity를 0.3으로 설정한다.

    setOpacity(val) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            메시와 material이 defined이면 material.opacity에 val을 저장한다.

    isInitialized()
        동작:
            _initialized 값을 그대로 반환한다.

    setInitialized(initialized) -> void
        동작:
            _initialized에 initialized를 변환 없이 저장한다.

    info()
        동작:
            x·y·실제 level·key와 _rectangle.clone(), _rectangle3d.clone() 결과를 담은 새 객체를 반환한다. 두 사각형 필드는 각각 복제한다.

    intersect(vecx: number, vecy: number, vecz: number) -> boolean
        의존:
            THREE.Sphere — 구의 점 포함 검사; 함수: {containsPoint()}
            THREE.Box3 — 경계의 점 포함 검사; 함수: {containsPoint()}
            defined — null·undefined 판정; 함수: {defined()}
            THREE — 공간 값과 메시 객체; 생성자: {new Vector3()}
        동작:
            구가 defined이면 입력 좌표로 새 Vector3를 만들어 구의 containsPoint 결과를 반환한다.
            구가 없고 경계 상자가 defined이면 새 Vector3로 상자의 containsPoint를 검사한다. 둘 다 없으면 벡터 생성 없이 false다.

    computeChild(minX, maxX, minY, maxY, level, scene, drawArg, type, parent, startlevel, quadindex, quadset) -> U3dQuadTile
        동작:
            전달받은 경계·레벨·장면·drawArg·타입·부모·시작 레벨·분면·quadset으로 self.constructor를 new 호출한다. 서브클래스 생성자를 유지한다.
            생성한 자식의 _renderOrder를 0으로 설정하고 자식을 반환한다.

    computeChildren(drawArg: UDrawArg, type: string) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            인수 drawArg 대신 현재 _drawArg를 사용한다. _childTiles가 없으면 배열을 만들고 있으면 길이를 0으로 비운다.
            현재 경계를 중심으로 북서·북동·남서·남동 순서의 네 분면을 계산한다. 각 이름의 자식이 없거나 폐기됐다면 같은 타입의 다음 level 자식을 생성한다.
            부모는 현재 타일, 시작 레벨과 quadset은 현재 값을 전달한다. 네 자식을 정해진 순서로 _childTiles에 넣는다.

    getType()
        동작:
            현재 _type을 반환한다.

    getChildTiles() -> Array<U3dQuadTile> | undefined
        동작:
            현재 _childTiles 참조를 반환한다. 아직 자식을 계산하지 않았거나 해제한 뒤에는 undefined일 수 있다.

    getParent() -> U3dQuadTile | undefined
        동작:
            현재 _parent 참조를 반환한다.

    setTerrainVisible(visible: boolean, skipHandoff: boolean = false)
        의존:
            terrain 레이어 — 타일 표시 부착/제거; 함수: {addTileFromScene(), removeTileFromScene()}
        동작:
            quadset._terrainLayer가 없으면 반환한다. 각 레이어에 visible이 truthy이면 addTileFromScene, 그 밖에는 removeTileFromScene을 현재 타일과 skipHandoff로 호출한다.
            이 함수에서는 각 terrain 레이어의 getVisible 값을 별도로 검사하지 않는다.

    hasCompletePresentationCoverage() -> boolean
        동작:
            폐기됐거나 visible이 정확히 true가 아니거나 메시의 visible이 정확히 true가 아니면 false다.
            그 밖에는 현재 표시 집계의 attached를 반환한다. 이 함수 자체는 renderReady 또는 handoffReady를 요구하지 않는다.

    getPresentationSnapshot() -> {layerStates: Array<U3dQuadTilePresentationLayerState>, renderReady: boolean, attached: boolean, retainedPresentationSafe: boolean, handoffReady: boolean}
        동작:
            전환 레이어를 수집한 뒤 각 레이어의 상세 상태와 준비·부착·기존 표시 안전성·handoff 집계를 반환한다.

    setVisible(visible: boolean, skipHandoff: boolean = false, allowRetainedPresentation: boolean = false, requireRetainedPresentationSafety: boolean = false) -> boolean
        의존:
            UDrawArg — 무표시 통과 레벨; 함수: {getPassLevel()}
            U3dLayer — 가시 전환과 보류; 함수: {getVisible(), isTilePresentationParticipant(), isTileSceneRemovalDeferred(), addTileFromScene(), removeTileFromScene()}
            타일 확장 hook — 런타임 준비 검사; 함수: {isRenderable()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            실제 레벨이 pass level 미만이면 표시나 레이어 상태를 바꾸지 않고 true다. 전환 레이어를 먼저 모으고 현재 타일과 메시가 이미 정확히 true인지 기억한다.
            숨기기 요청이고 skipHandoff가 정확히 true가 아니며 어느 레이어라도 제거 보류 hook에서 정확히 true를 반환하면 변경 없이 false다.
            visible 값을 타일 접근자와 메시 visible에 저장한다. 영상 레이어는 최소 레벨 도달 또는 명시적 표시 참여가 있고 getVisible이 truthy일 때 부착·제거한다. 기타 레이어는 getVisible이 truthy일 때 선택 hook을 호출하고 terrain 레이어도 반영한다.
            숨긴 뒤에도 skipHandoff가 정확히 true가 아닌 경우에만 제거 보류를 재검사한다. 이 검사에서 보류가 확인되면 타일·메시 visible을 true로 되돌리고 전환 레이어를 다시 부착한 뒤 false다. 성공한 숨김은 표시 대기를 해제하고 true다.
            표시 요청에서는 상세 배열 없이 집계하고, 현재 타일의 isRenderable hook이 있는데 결과가 true가 아니면 실행 차단으로 취급한다.
            allowRetainedPresentation이 정확히 true이고 attached일 때, requireRetainedPresentationSafety가 정확히 true가 아니거나 retainedPresentationSafe가 true인 경우에만 기존 적용본 표시를 허용한다.
            실행 차단 또는 handoff 미완료이고 기존 표시도 허용되지 않으면 표시 대기를 기록한다. 이미 보이던 타일과 메시라면 기존 화면을 유지하며 false다. 새 표시라면 타일의 표시 부착을 중단하고 false다.
            허용한 표시이면 표시 대기를 비우고 true다.

    suspendPresentation(transitionLayers: Array<U3dLayer>) -> boolean
        동작:
            전환 레이어 목록을 전달해 타일 표시를 중단한 결과를 반환한다.

    intersectFrustum(frustum) -> boolean
        의존:
            THREE.Frustum — 타일 구의 시야 교차; 함수: {intersectsSphere()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            인수 frustum이 defined가 아니면 drawArg의 frustum 또는 앱 frustum을 사용한다. 없으면 false이며 있으면 현재 _sphere와 intersectsSphere한 결과를 반환한다.

    distanceToCamera() -> number
        의존:
            UDEF — 거리 검색 방식; 상수: {SEARCH_TYPE}
        동작:
            검색 방식이 sphere인지와 함께 distanceToCameraPosition을 호출해 거리를 반환한다.

    distanceToCameraPosition(useSphere: boolean = false, position: Vector3) -> number
        의존:
            UDrawArg — 생략한 카메라 위치 조회; 함수: {getCameraPosition()}
            THREE.Sphere — 구까지의 거리; 함수: {distanceToPoint()}
            THREE.Box3 — 상자까지의 거리; 함수: {distanceToPoint()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            position이 defined가 아니면 공유 campos에 카메라 위치를 요청한다. 그래도 undefined이면 0이다.
            useSphere가 truthy이고 구가 있으면 구의 distanceToPoint 결과를, 그 밖에는 경계 상자의 distanceToPoint 결과를 반환한다.

    setWireFrameRendering(drawArg, value) -> void
        의존:
            THREE.Mesh — 그룹 내 메시 선택; 상속: {THREE.Mesh}
            그룹 — 하위 객체 순회; 함수: {traverse()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            drawArg 또는 value가 defined가 아니면 반환한다. 현재 메시의 material.wireframe을 value로 설정한다.
            그룹을 순회하며 THREE.Mesh인 객체들의 material에도 적용한다. 현재 존재하는 네 자식에 저장된 drawArg와 value를 전달해 재귀 반영한다.

    getWeight(level) -> number
        동작:
            level 인수와 무관하게 1을 반환한다.

    getTileSize() -> number
        의존:
            UDrawArg — 타일 품질 비율; 함수: {getRatioTileSize()}
        동작:
            drawArg가 없으면 1이며 있으면 getRatioTileSize 결과를 반환한다.

    traverse(callback) -> void
        의존:
            callback — 타일별 순회 실행; 콜백: {callback()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            callback이 defined가 아니면 반환한다. 현재 타일을 this와 첫 인수로 callback.call을 실행한다.
            북서·북동·남서·남동 자식이 있으면 같은 callback으로 재귀 순회한다. callback의 반환값은 사용하지 않는다.

    update(drawArg: UDrawArg = this._drawArg, frameState, force: boolean = false) -> false | void
        의존:
            UDrawArg — 검색 계수 균형; 함수: {plusSearchTileCount(), minusSearchTileCount()}
            frameState — 타일 분화/해제 예약; 함수: {addUpdate(), addDispose()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            drawArg가 defined가 아니거나 타일이 해제되었으면 false다. 이 검사는 하위 갱신 호출부와 공유하며 검색 계수·LOD context·프레임 작업을 변경하지 않는다. 살아 있는 타일만 검색 타일 계수를 증가시킨다.
            quadset에 같은 drawArg의 LOD context가 없으면 이전 값을 저장하고 이번 동기 호출 범위의 context를 설치한다.
            분화 가능하면 이전 coarsen 방향의 handoff lease를 먼저 해제하고 네 자식을 계산한다. 화면 밖 자식도 초기화되지 않았으면 메시를 생성한 뒤 frameState.addUpdate에 현재 타일과 force를 전달한다.
            분화 불가이면 frameState.addDispose에 현재 타일을 전달한다. 정상 경로에는 명시 반환값이 없다.
            finally에서 자신이 만든 context만 이전 값으로 복원하고 검색 타일 계수를 감소시킨다. 내부 오류는 정리 후 전파한다.

    getProcessStep()
        동작:
            현재 _processed를 반환한다.

    getWorkStep()
        동작:
            현재 _worked를 반환한다.

    disposeDetail() -> void
        의존:
            UPlaneBufferGeometry — 공유 지오메트리 소유분 반납; 함수: {dispose()}
            defined — 메시·재질·지오메트리·children의 null·undefined 판정; 함수: {defined()}
        동작:
            메시가 없으면 반환한다. 메시와 그 children에 대해 material 참조만 비우고 geometry.dispose로 공유 지오메트리의 소유분을 반납한 뒤 geometry 참조를 비운다.
            material.dispose를 호출하거나 children 배열에서 객체를 제거하지 않는다. 재귀 처리를 마친 뒤 _mesh를 undefined로 비운다.

    _notifyDispose() -> void
        의존:
            U3dEvent — 해제 이벤트; 상수: {TILE.DISPOSE}
            UEventDispatcher — 등록된 리스너 조회와 일회성 등록 해제; 함수: {removeEventListener()}; 속성 읽기: {_listeners}
            listener — 타일 해제 알림; 콜백: {listener()}
            defined — null·undefined 판정; 함수: {defined()}
            __GError__ — 실패 진단; 함수: {__GError__()}
        동작:
            _listeners[TILE.DISPOSE] 목록 사본을 역순으로 순회하되 현재 목록에서도 제거되지 않은 listener만 실행한다.
            listener._once가 defined이면 실행 전에 등록을 해제한다. listener를 현재 타일을 this로, {type, data: undefined, target: this}를 인수로 호출한다.
            개별 listener의 실패는 오류 로그로 남기고 다음 listener를 계속 처리한다.

    _disposeChildren(callback: undefined | boolean | function(U3dQuadTile): void, errors: Array<unknown>) -> void
        동작:
            북서·북동·남서·남동 이름의 각 자식을 callback과 함께 dispose한다. 자식별 실패는 errors에 추가하고 다음 자식을 계속 처리한다.
            각 필드는 성공·실패에 관계없이 undefined로 비우고 마지막에 _childTiles도 undefined로 비운다.

    dispose(callback?: boolean | function(U3dQuadTile): void) -> void
        의존:
            UDrawArg — 타일 캐시 등록 제거; 함수: {removeTile()}
            UEventDispatcher — 이벤트 등록 해제; 함수: {removeEventListenerAll()}
            ULayerList — 타일의 비모델 레이어 자원 해제; 함수: {disposeTileNoModel()}
            UDEF — 작업 상태 초기화; 상수: {PROCESS.WORK_STATE.NONE}
            callback — 타일별 완료 알림; 콜백: {callback()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            이미 _disposed이면 반환한다. 먼저 _disposed를 true로 설정하여 재진입 해제를 막는다. 자식을 먼저 해제하며 실패를 수집한다.
            해제 알림을 보내고 전체 이벤트 등록을 비운 뒤 높이 로드를 false로 설정한다. 타일 등록 제거, 대기 작업 정리, 완료 작업 정리를 각각 보호하여 실패를 수집한다.
            _workState를 삭제하고 _postLoadSkirt가 defined인 경우에만 해당 참조를 undefined로 비운다. 자신의 handoff lease를 레이어 자원 폐기보다 먼저 해제하고 표시 대기를 해제한다.
            앱의 레이어 자원을 폐기한 뒤 처리·작업 단계를 NONE으로, 부모를 undefined로 바꾼다. 강제 숨김과 메시 상세 해제를 각각 시도하고 초기화를 false로 설정한다.
            callback이 truthy인 Function이면 현재 타일을 전달하며 이 실패도 수집한다. 오류 하나는 원래 값을 던지고 여러 개이면 errors 배열을 붙인 Error를 던진다.
            개별 보호가 적용된 정리만 오류를 누적한다. 보호 밖의 알림 후 등록 해제나 상태 접근까지 무조건 완주한다고 보장하지 않는다.

    createMesh(material, drawArg: UDrawArg = this._drawArg) -> boolean
        의존:
            UDrawArg — 무메시 통과 레벨; 함수: {getPassLevel()}
            defined — null·undefined 판정; 함수: {defined()}
            UTileMesh — 타일 메시 생성; 생성자: {new UTileMesh()}
        동작:
            material 인수는 사용하지 않는다. 실제 레벨이 pass level 미만이면 초기화만 true로 하고 true다. 메시가 이미 defined이면 false다.
            현재 타일을 전달해 UTileMesh를 생성한다. 그룹이 있으면 그룹 이름을 메시 이름으로 바꾸고 basemesh에 메시를 저장한다.
            메시가 defined이면 초기화를 true로 설정한다. 생성 경로는 true를 반환한다.

    getGroup()
        동작:
            현재 _group 참조를 반환한다.

    getPositionByXY(x: number, y: number) -> Vector3 | undefined
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dMessage — 진단 출력; 함수: {info()}
            THREE — 공간 값과 메시 객체; 생성자: {new Vector3()}
        동작:
            x·y를 0 이상으로 제한하고 상한은 x > DEM_SIZE_X이면 DEM_SIZE_X, y > DEM_SIZE_X이면 DEM_SIZE_Y로 제한한다. 현재 두 상수는 모두 64다.
            _mesh.geometry를 읽는다. geometry가 없으면 정보 로그를 남기고 undefined다. 메시 자체가 없는 상태는 이 검사 전에 예외가 날 수 있다.
            skirt를 건너뛰는 (y + 1) * geometry._uwidth + (x + 1) 인덱스의 position을 읽고 getScale의 각 축 배율을 곱한 새 Vector3를 만든다.
            geometry.getOffset 함수와 그 결과가 truthy이면 offset을 더하고 벡터를 반환한다.

    intersectByMesh(mesh) -> boolean
        의존:
            THREE.BufferGeometry — 입력 메시 경계 계산; 함수: {computeBoundingBox()}
            THREE.Box3 — 경계 교차; 함수: {intersectsBox()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            높이가 로드되지 않았으면 false다. 전달된 메시의 geometry.boundingBox가 defined가 아니면 computeBoundingBox를 호출한다.
            현재 타일 _boundingbox와 전달된 geometry.boundingBox의 intersectsBox 결과를 반환한다. 상대 메시의 별도 world transform은 여기서 적용하지 않는다.

    checkHeightLoaded() -> boolean
        동작:
            isHeightLoaded 결과를 반환한다.

    getHeightAtPoint(x: number, y: number) -> number
        의존:
            UDEF — 높이 결측값; 상수: {TERRAIN_NO_DATA}
        동작:
            높이가 로드되지 않았으면 TERRAIN_NO_DATA다. geometry·position 배열·rowWidth·_rectangle3d를 한 번 읽고 배열이 없거나 rowWidth가 유한하지 않거나 사각형이 없으면 같은 값을 반환한다.
            64 × 64 지형 격자를 기준으로 minx=rectangle.ptLeftBottom.x, miny=rectangle.ptRightTop.y, maxx=rectangle.ptRightTop.x, maxy=rectangle.ptLeftBottom.y를 읽고 사각형의 역폭·역높이를 구한다. 역값이 유한하지 않으면 TERRAIN_NO_DATA다.
            indexX=(x - minx) * invWidth * width, indexY=(maxy - y) * invHeight * width로 바꾸고 내림값을 구한다. 네 이웃 인덱스는 0부터 width - 1로, X·Y 보간 비율은 0부터 1로 제한한다.
            각 인덱스에 skirt 여백 1을 더해 (((y + 1) * rowWidth) + (x + 1)) * 3 + 2의 Z 위치를 읽는다. 위쪽 B(minX,minY)→C(maxX,minY), 아래쪽 A(minX,maxY)→D(maxX,maxY)를 X축 보간하고 위쪽에서 아래쪽으로 Y축 inline 선형 보간한다.
            보간 결과가 TERRAIN_NO_DATA와 같으면 그대로 반환하고 그 밖에는 메시의 scale.z를 곱해 반환한다. 개별 정점의 NO_DATA를 따로 걸러내지는 않는다.

    isDisposed() -> boolean
        동작:
            현재 _disposed를 반환한다.

    checkMode() -> boolean
        의존:
            UDrawArg — 특수 모드 조회; 함수: {getMode()}
            UDEF — 거리 계산 보정 대상 모드; 상수: {APP_MODE._LANDSCAPE, APP_MODE._VISIBILITY, APP_MODE._GIZMO, APP_MODE._WALK, APP_MODE._ROUTE}
        동작:
            drawArg의 모드가 LANDSCAPE·VISIBILITY·GIZMO·WALK·ROUTE 중 하나인지 반환한다.

getVisibleBoxDistance(box: Box3, position: Vector3, frustum: Frustum | undefined, distance: number, refineDistance: number = 0) -> number
    동작:
        frustum 평면이 여섯 개가 아니거나 distance가 유한하지 않거나 1 이하이면 기존 distance다. 상자 범위가 비정상이거나 가장 먼 모서리까지 refineDistance 이내여도 기존 값을 유지한다.
        카메라 상대 좌표로 상자를 읽고 최대 변 / DEM_SIZE_X 및 좌표 크기의 부동소수 오차 여유를 구한다. near 평면의 최소 여유가 충분하지 않으면 기존 거리다.
        상자의 최근접점이 네 측면 평면 안에 있으면 기존 거리다. 그 밖에는 각 반공간과 교차할 수 있는 보수적 좌표 범위를 네 평면에 대해 두 차례 좁힌다.
        유효하지 않은 평면·분모·역전 범위 등 불확실한 조건에서는 기존 거리로 돌아간다. 범위가 원래 상자와 가시 교집합을 포함하도록 여유를 유지한다.
        좁힌 상자의 최근접 거리 증가량과 여유 기반 보간을 기존 거리에 반영하고 기존 distance 이상인 결과를 반환한다. 원래 상자·카메라를 바꾸거나 임시 벡터·상자·배열을 생성하지 않는다.

getTileTransitionLayers(tile: U3dQuadTile) -> Array<U3dLayer>
    의존:
        U3dLayer — 전환 대상의 최소 레벨·참여·가시성; 함수: {isTilePresentationParticipant(), getVisible()}; 속성 읽기: {_minlevel}
    동작:
        getVisible이 정확히 true인 영상 레이어 중 최소 레벨에 도달했거나 isTilePresentationParticipant가 정확히 true인 항목을 넣는다.
        기타 레이어는 getVisible이 정확히 true인 항목을 넣고 terrain 레이어는 truthy인 항목을 넣는다. Set으로 중복을 제거하여 처음 만난 순서의 새 배열을 반환한다.

createTilePresentationSnapshot(tile: U3dQuadTile, transitionLayers: Array<U3dLayer>) -> {layerStates: Array<U3dQuadTilePresentationLayerState>, renderReady: boolean, attached: boolean, retainedPresentationSafe: boolean, handoffReady: boolean}
    동작:
        전환 레이어 수 길이의 상세 layerStates 배열을 미리 만들고 createTilePresentationSummary에 전달하여 같은 집계 결과 객체를 반환한다.

createTilePresentationSummary(tile: U3dQuadTile, transitionLayers: Array<U3dLayer>, layerStates?: Array<U3dQuadTilePresentationLayerState>) -> U3dQuadTilePresentationSummary & Partial<{layerStates: Array<U3dQuadTilePresentationLayerState>}>
    의존:
        U3dLayer — 표시 참여·준비·부착·기존 적용본 안전성; 함수: {isTileSceneProvider(), isTilePresentationParticipant(), isTilePresentationConfirmedEmpty(), isTileRenderableReady(), isTilePresentationVisible(), isTilePresentationAttached(), isTileRetainedPresentationSafe()}
    동작:
        전환 레이어를 모두 순회한다. isTileSceneProvider 또는 isTilePresentationParticipant 결과가 undefined가 아니면 명시 계약으로 보고 어느 하나가 정확히 true일 때 참여한다.
        두 명시 결과가 모두 undefined이면 준비·가시·부착 hook 중 하나라도 있는 레이어를 기존 참여자로 본다. 확정 빈 결과는 해당 hook의 반환값이 정확히 true일 때다.
        renderReady는 비참여·확정 빈 결과·준비 hook 부재이면 true이며 그 밖에는 준비 hook의 정확한 true를 요구한다.
        attached는 기본 true다. 참여하고 비어 있지 않을 때 부착 hook이 있으면 그것을, 없으면 가시 hook 결과를 정확한 true와 비교한다.
        기존 표시 안전성은 비참여·확정 빈 결과·준비 완료이면 true다. 그 밖에는 attached이고 기존 표시 안전 hook이 정확히 true여야 한다.
        layerStates가 주어졌을 때만 레이어별 상세 객체를 추가한다. 전체 renderReady·attached·retainedPresentationSafe를 누적한다.
        handoffReady는 전체 renderReady && attached다. 상세 배열이 있으면 layerStates와 네 집계 값을, 없으면 네 집계 값만 반환한다.

releaseTileHandoffLease(tile: U3dQuadTile, drawArg: object = tile?._drawArg, expectedDirection?: 'refine'|'coarsen') -> boolean
    의존:
        U3dApp — terrain manager 조회; 함수: {getTerrainDecalManager()}
        UShaderTerrainDecalManager — 동일 세대·방향의 lease 해제; 함수: {releaseTerrainTileHandoffLease()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
    동작:
        drawArg의 앱에서 terrain decal manager를 얻고 tile key를 읽는다. manager 또는 key가 없으면 false다.
        현재 tile entry의 generation을 읽는다. expectedDirection이 truthy이고 lease의 방향이 다르면 false다.
        tile·generation·expectedDirection을 조건으로 manager의 lease 해제를 요청하고 결과가 정확히 true인지 반환한다.

suspendTilePresentation(tile: U3dQuadTile, transitionLayers: Array<U3dLayer>) -> boolean
    의존:
        UDrawArg — 무표시 통과 레벨; 함수: {getPassLevel()}
        U3dLayer — 표시 중단 hook과 강제 제거; 함수: {suspendTilePresentation(), removeTileFromScene()}
    동작:
        tile._drawArg가 있고 실제 레벨이 pass level 미만이면 변경 없이 true다. 이 조기 반환을 하지 않은 경우에만 타일·메시 visible을 false로 설정하고 표시 대기를 true로 설정한다.
        전달 목록 또는 새로 모은 전환 레이어에서 suspendTilePresentation hook이 정확히 true를 반환하면 해당 레이어는 더 처리하지 않는다.
        그 밖에는 removeTileFromScene에 현재 타일과 강제 제거 true를 전달한다. 마지막에 true를 반환한다.

```

## 4. 공통 처리 기준과 제약

```spec
타일별 시작 레벨과 앱별 최소·최대 레벨을 전역 정적 값보다 우선한다. 정적 setter는 이미 생성한 타일의 실제 레벨이나 해상도를 재계산하지 않는다.
네 자식의 순서는 북서·북동·남서·남동이며 부모 전체의 표시 범위를 대신하므로 전환 준비에서 네 분면을 유지한다.
표시 준비·화면 부착·기존 적용본 안전성은 서로 다른 값이다. 기존 적용본 허용은 호출자가 지정한 경우에만 적용하며 coverage는 실제 표시와 부착을 검사한다.
원격 요청의 데이터 준비와 타일 표시 준비의 분리는 레이어가 제공하는 hook의 책임이다. 이 타일 자체는 WFS 완료·오류를 직접 대기하거나 검사하지 않는다.
높이 격자의 실제 영역은 64 × 64이고 geometry._uwidth는 skirt를 포함한 position 행 너비다. 높이를 읽을 때 x·y에 여백 1을 더한다.
getHeightAtPoint는 입력 좌표의 유한성이나 각 정점의 결측값, 양수 정수 행 너비와 position 길이를 별도 검증하지 않는다. getHeightByXY와 getPositionByXY도 높이 로드 검사를 대신하지 않는다.
getHeightAtPoint의 반환 높이는 메시의 Z 배율을 적용하며 메시 position.z는 더하지 않는다. 경계 갱신은 메시 position.z까지 반영한다.
특수 모드의 카메라 Z=0 보정과 검색 위치가 있는 기존 거리 기준을 유지한다. 직교의 셀 크기는 DEM의 실제 기하 오차 측정값이 아니다.
해제 때 geometry.dispose는 공유 소유분의 반납이다. 타일 자체의 material 참조 제거는 그 material의 dispose 호출을 뜻하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
