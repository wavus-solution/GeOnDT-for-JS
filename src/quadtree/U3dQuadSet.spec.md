# U3dQuadSet 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지정한 Google 좌표 영역의 지형·모델 루트 타일을 만들고 카메라 변화에 따라 타일 업데이트 실행 여부를 결정한다.

### 1.2 책임 범위

루트 타일 목록과 루트별 작업 상태를 보관하고, 업데이트 시 사용할 레이어 목록을 수집하여 각 루트에 갱신을 요청한다.

책임 경계: 개별 타일의 분할 여부와 콘텐츠 작업 실행은 타일 및 프레임 상태 객체가 담당한다.

### 1.3 주요 동작 방식

생성 시 지정한 종류 또는 두 종류의 루트를 만들며 같은 컨테이너에서 지형·모델 루트를 독립적으로 추가·해제한다. 일반 업데이트는 위치·회전 차이 또는 명시적 갱신 요청을 판별한 뒤 루트에 작업을 전달하고 검색 완료 이벤트를 처리한다.

### 1.4 주요 사용처와 연계 대상

`U3dApp`이 객체를 생성하고 업데이트 틱, resize 및 명시적 갱신에서 호출한다. `UFrameState`와 `UModelFrameState`는 각 루트의 후속 작업을 관리한다.

## 3. 정규 자연어 수도코드

```spec
TILE_UPDATE_VIEW_RATIO: number = 0.01
    이동·회전 임계값 계산에 공통으로 적용할 기준 시야 비율이다.

TILE_UPDATE_SENSITIVITY_SCALE: number = 0.5
    공개 민감도를 임계 계산 배율로 환산한다. 공개 민감도 1은 시야 크기의 약 2% 이동에 대응한다.

U3dQuadSet extends U3dObject 클래스 정의
    의존: U3dObject — 이벤트 및 객체 기반 기능; 상속: {U3dObject}

    #updateSensitivity: number = 1
        이동·회전 임계값을 나눌 민감도 배율이다.

    _disposed: boolean = false
        마지막 루트를 해제한 컨테이너의 종료 상태다.

    _rootRevision: number = 0
        루트 집합을 게시하거나 제거할 때 증가하며 이전 순회의 계속 실행과 완료 통지를 막는다.

    _lodUpdateContext: {drawArg: UDrawArg, parameters?: unknown} | undefined
        현재 동기 갱신에 참여하는 타일들의 공통 LOD 자료 저장소다. 중첩 갱신 뒤 이전 문맥을 복원한다.

    #prevProjectionMatrix: Matrix4 | undefined
        마지막 타일 업데이트의 투영 행렬이며 갱신 전에는 undefined이다.

    _initialized: boolean = false
        초기 루트 목록 생성 성공 여부이다.

    _listQuadtree: Array<U3dQuadTile | U3dQuadModelTile> = 빈 배열
        순회와 갱신을 요청할 루트 목록이다.

    _prevPostion: Vector3 | undefined = undefined
        마지막 타일 업데이트의 위치이며 생략된 틱에서는 유지한다.

    _prevQuaternion: Quaternion | undefined
        마지막 타일 업데이트의 방향이며 위치와 같은 시점에 저장한다.

    _frameStates: Map = 빈 Map
        루트 객체를 키로 지형·모델 작업 상태를 보관한다.

    constructor(minx: number, maxx: number, miny: number, maxy: number, level: number, layers, drawArg, scene, type?: string)
        의존:
            U3dObject — 기반 객체 초기화; 생성자: {new U3dObject()}
            defined — 입력 존재 판정; 함수: {defined()}
            UMathEngine — 영역 생성; 정적 함수: {createUGeoRect()}
            UDEF — 좌표계 선택; 상수: {GOOGLE}
            THREE — 공간 값 생성; 생성자: {new Vector3(), new Sphere(), new Box3()}
            UCheckTime — 시간 확인 객체 생성; 생성자: {new UCheckTime()}
            UVisibleState — 공유 가시 상태 생성; 생성자: {new UVisibleState()}
            __GError__ — 필수 생성 입력 누락 보고; 함수: {__GError__()}
        동작:
            기반 생성자를 실행하고 scene 또는 drawArg가 없으면 __GError__를 호출한 뒤 초기화를 중단한다.
            scene, layers, drawArg, 영역 경계와 level을 저장하고 _rlevel을 level과 같게 둔다.
            중심의 X·Y 성분, 높이 0, 빈 루트 목록과 현재 위치 벡터를 준비하고 이전 위치는 undefined로 둔다.
            시간 확인 객체와 Google 영역을 만든다.
            X방향 영역 폭을 두 번 제곱한 합의 제곱근에 0.5를 곱하여 반지름을 구한다.
            이 단위에서 초기화하지 않은 _center를 Sphere의 중심 인수로 전달하고 영역의 z=0부터 반지름까지 Box3를 만든다. [확인 Q-001]
            빈 _frameStates와 UVisibleState를 만든 뒤 type에 맞는 루트 초기화를 실행한다.

    static isValidRegion(rectangle: UGeoRect | undefined, level: number | undefined, maxLevel: number) -> boolean
        동작:
            rectangle이 falsy이면 false를 반환한다. 그렇지 않으면 두 경계점의 X·Y가 모두 유한하며 좌상단 X·Y가 각각 우하단 X·Y보다 작은지 확인한다.
            위 조건과 level이 정수이고 0 이상 maxLevel 이하인지를 모두 만족해야 true를 반환한다. 경계점 자체의 부재는 별도로 검사하지 않는다.

    static createQuadTreeSet(rectangle: UGeoRect, level: number, drawArg: UDrawArg, scene: UScene, tree?: U3dQuadSet, type?: string) -> U3dQuadSet | null
        의존: UDrawArg / U3dApp — 새 컨테이너의 최대 레벨 조회; 속성 읽기: {_app._maxlevel}
        동작:
            tree가 truthy이면 해당 인스턴스의 생성 함수에 rectangle·level·type을 전달하고 반환값을 그대로 반환한다. 이 경로에서는 전달된 drawArg와 scene을 사용하지 않는다.
            tree가 없으면 drawArg._app._maxlevel로 영역·시작 레벨을 검사하고 실패하면 null을 반환한다. drawArg와 앱의 존재를 이 함수에서 별도 검사하지 않는다.
            검사에 성공하면 영역 네 값과 level, layers=null, drawArg·scene·type으로 새 컨테이너를 만들어 반환한다. 초기 루트 생성과 오류 정리는 생성자의 initialize 경로가 담당한다.

    createQuadTreeSet(rectangle: UGeoRect, level: number, type?: string) -> U3dQuadSet | null
        의존: UDEF — 허용한 트리 종류; 상수: {TILE_TYPE.TERRAIN, TILE_TYPE.MODEL}
        동작:
            type이 undefined·TERRAIN·MODEL 중 하나가 아니면 TypeError를 던진다.
            지정한 종류가 이미 있거나 종류 생략 시 두 종류가 모두 있으면 영역·레벨을 검사하지 않고 현재 객체를 반환한다.
            대상 종류가 부족할 때 해제된 객체이거나 입력 영역·레벨이 유효하지 않으면 null을 반환한다. 기존 네 경계값·시작 레벨 중 하나라도 다르면 RangeError를 던진다.
            type이 MODEL이 아니면 지형 루트를, TERRAIN이 아니면 모델 루트를 생성하고 현재 객체를 반환한다.

    restartQuadTree(rectangle: UGeoRect, level: number, type?: string) -> U3dQuadSet | null
        의존:
            UDEF — 부분 교체할 트리 종류; 상수: {TILE_TYPE.TERRAIN, TILE_TYPE.MODEL}
            U3dApp — 교체 후 앱 수명 판정과 최대 레벨; 함수: {isDisposed()}; 속성 읽기: {_maxlevel}
        동작:
            입력과 종류를 검사하고 부분 재시작의 영역·시작 레벨이 기존과 다르면 해제 전에 거절한다. disposeQuadTree(type)로 대상만 해제하고 앱이 종료되었으면 null을 반환한다. 검증한 내부 생성은 정적 생성기를 다시 거치지 않는다.
            반대쪽 루트가 남아 있으면 기존 컨테이너에 대상 종류를 다시 추가한다.
            전체 또는 마지막 종류 교체는 새 컨테이너를 반환하여 해제된 컨테이너를 재사용하지 않는다.
            생성·해제 오류는 호출자에게 전달하며 앱의 연결·완료 대기·화면 갱신은 앱이 담당한다.

    disposeQuadTree(type?: string) -> void
        의존: UDEF — 해제할 트리 종류; 상수: {TILE_TYPE.TERRAIN, TILE_TYPE.MODEL}
        동작:
            type이 TERRAIN이면 지형, MODEL이면 모델을 해제하고 나머지 입력은 dispose()로 두 종류를 해제한다.
            전체·개별 해제는 같은 종류별 루트·프레임 정리 경로를 사용한다.

    isDisposed() -> boolean
        동작:
            컨테이너의 _disposed 상태를 반환한다. 한 종류의 루트가 남은 부분 해제 상태는 false이며 마지막 종류 해제 후 true가 된다.

    dispose() -> void
        동작:
            해제된 컨테이너이면 종료한다. disposeTerrainQuadTree(), disposeModelQuadTree()를 모두 시도하며 한 종류의 오류가 다른 종류 정리를 막지 않는다.
            쿼드셋은 루트의 dispose만 호출하고 하위 재귀는 타일이 소유한다. 각 타일은 자식부터 재귀 해제하며 단일 실패는 원래 오류를, 복수 실패는 호출 순서대로 담은 errors 배열을 가진 Error로 전달한다. 하위에서 묶어 전달한 오류는 해당 객체로 보존한다.
            마지막 루트 해제 시 _frameStates, LOD 임시 문맥과 이벤트 구독을 비우고 해제 상태로 표시한다.

    getQuadTree(type: string) -> U3dQuadTile | U3dQuadModelTile | undefined
        의존: U3dQuadTile / U3dQuadModelTile — 루트 종류 판정; 함수: {getType()}
        동작:
            지정한 종류의 첫 루트를 반환한다. 해당 종류가 없거나 컨테이너가 해제되었으면 undefined를 반환한다.

    getQuadTrees(type?: string) -> Array<U3dQuadTile | U3dQuadModelTile>
        의존: U3dQuadTile / U3dQuadModelTile — 선택한 루트 종류 판정; 함수: {getType()}
        동작:
            지정한 종류의 루트 목록을 반환하며 종류 생략 시 전체 목록을 반환한다.
            반환 배열은 복사본이며 루트 객체의 참조는 유지한다. 해당 종류가 없거나 해제되었으면 빈 배열을 반환한다.

    hasQuadTree(type: string) -> boolean
        의존: U3dQuadTile / U3dQuadModelTile — 존재 여부를 판단할 종류 조회; 함수: {getType()}
        동작:
            해제되지 않았고 해당 종류의 루트가 통합 목록에 있는지 반환한다.

    createTerrainQuadTreeSet() -> void
        의존: UDEF — 지형 종류; 상수: {TILE_TYPE.TERRAIN}
        동작: 현재 컨테이너와 TERRAIN 종류를 공통 생성 함수에 전달한다.

    createModelQuadTreeSet() -> void
        의존: UDEF — 모델 종류; 상수: {TILE_TYPE.MODEL}
        동작: 현재 컨테이너와 MODEL 종류를 공통 생성 함수에 전달한다.

    disposeTerrainQuadTree() -> void
        의존: UDEF — 지형 해제 종류; 상수: {TILE_TYPE.TERRAIN}
        동작: 현재 컨테이너와 TERRAIN 종류를 공통 해제 함수에 전달한다.

    disposeModelQuadTree() -> void
        의존: UDEF — 모델 해제 종류; 상수: {TILE_TYPE.MODEL}
        동작: 현재 컨테이너와 MODEL 종류를 공통 해제 함수에 전달한다.

    add(quadtree) -> false | void
        의존: defined — 타일 존재 판정; 함수: {defined()}
        동작:
            quadtree가 없으면 false를 반환한다.
            존재하면 _listQuadtree 끝에 추가하며 별도 값을 반환하지 않는다.

    initialize(type?: string) -> boolean
        의존:
            UDEF — 생성할 트리 종류 판정; 상수: {TILE_TYPE.TERRAIN, TILE_TYPE.MODEL}
            UEventDispatcher — 소속 타일 완료 이벤트 연결; 함수: {on()}
            U3dEvent — 고도 적용을 시작할 이벤트 종류; 상수: {TILE.LOADED}
        동작:
            쿼드셋이 해제되었거나 앱이 없으면 false를 반환한다. 지정한 type이 지형·모델이 아니면 TypeError를 전달한다.
            type을 생략하면 지형·모델 순서로 두 종류를 생성하고 지정하면 해당 종류만 생성한다. 각 생성 wrapper가 저장 _rlevel을 사용한다.
            어느 생성에서든 실패하면 dispose로 이미 만들어진 루트도 정리한다. 정리 성공이면 원래 오류를, 정리도 실패하면 두 오류를 errors에 담은 새 Error를 던진다.
            TILE.LOADED에 쿼드셋 자신의 updateAutoHeight를 연결하고 초기화 여부를 반환한다. 앱의 이벤트 전달 메서드는 사용하지 않는다.

    updateAutoHeight(tile: U3dQuadTile | undefined) -> void
        인터페이스: 등록 항목의 value(key, tile, height)를 항목 자신의 메서드로 호출하므로 callback의 this는 등록 항목이다.
        의존:
            U3dApp / UIndexManager — 앱 상태와 위치별 등록 항목 조회; 함수: {isDisposed(), getIndexManager(), search()}
            U3dQuadTile(tile) — 소속·종류·높이 준비·경계·고도 조회; 함수: {getType(), isHeightLoaded(), getBoundingbox(), getHeightAtPoint()}; 속성 읽기: {_disposed, _quadset, _childTiles, _rlevel}
            U3dQuadTile(terrainRoot) — 적용 시작 시 선택한 지형 루트의 이름과 생존 여부; 함수: {getName()}; 속성 읽기: {_disposed}
            UDEF / U3dEvent — 지형과 고도 갱신 색인 종류; 상수: {TILE_TYPE.TERRAIN, MESH.UPDATE_HEIGHT_MESH}
            등록 항목(item) — 적용 이력과 결과 callback; 속성 읽기·쓰기: {level, terrainRootName}; 콜백: {value(key, tile, height)}
        동작:
            앱·쿼드셋이 해제되었거나 트리 교체·영역 적용 중이면 반환한다.
            소속 지형 타일이 아니거나 해제된 타일·자식이 있는 타일·고도 미준비 타일이면 반환한다.
            지형 루트가 없으면 종료한다. 타일 경계로 고도 갱신 색인을 검색하고, 항목의 level과 terrainRootName이 모두 현재 값과 같을 때만 건너뛴다.
            처리할 항목의 level과 terrainRootName을 callback 호출 전에 갱신한다. callback이 예외를 던져도 이미 기록한 이력은 되돌리지 않는다.
            등록 좌표 minX+0.5,minY+0.5의 고도를 콜백에 전달하고 고도 0도 유효하게 반영한다.
            지형 루트는 적용 시작 시 한 번만 조회한다. 콜백 중 앱·타일·저장한 지형 루트의 해제 상태를 확인하여 이전 타일의 나머지 반영을 중단한다. 모델만 교체되면 지형 반영을 계속한다.
            고도 조회·등록 콜백의 오류는 원래 오류로 전달하며 추가 상태나 별도 목록은 만들지 않는다.

    setWireFrameRendering(drawArg, value) -> void
        의존: U3dQuadTile / U3dQuadModelTile — 와이어프레임 전파; 함수: {setWireFrameRendering()}
        동작:
            각 루트에 저장된 _drawArg와 value를 전달하며 입력 drawArg는 사용하지 않는다.

    getUpdateSensitivity() -> number
        동작:
            #updateSensitivity를 반환한다.

    setUpdateSensitivity(sensitivity: number) -> U3dQuadSet
        의존: __GError__ — 잘못된 타입·범위 보고; 함수: {__GError__()}
        동작:
            sensitivity가 number 타입이 아니면 입력 타입과 숫자 요구를 __GError__로 기록하고 기존 값을 유지한 채 현재 인스턴스를 반환한다.
            숫자가 유한하지 않거나 0 이하이면 입력값과 허용 범위를 __GError__로 기록하고 기존 값을 유지한 채 현재 인스턴스를 반환한다.
            #updateSensitivity에 입력을 저장하고 현재 인스턴스를 반환한다.
            다음 틱의 이동·회전 판별부터 적용하며 이전 갱신 기준이나 갱신 예약은 변경하지 않는다.

    #getProjectionScale(camera: Camera) -> number
        의존: THREE.Camera — 실제 투영 배율 조회; 속성 읽기: {projectionMatrix.elements}
        동작:
            투영 행렬의 0·5번 성분 절댓값 중 최댓값을 반환한다.

    #getUpdateDistance(drawArg: UDrawArg, fallbackDistance: number) -> number
        의존:
            UDrawArg — 카메라와 타깃 조회; 함수: {getCamera(), getCameraTargetPosition()}
            THREE.Camera — 투영 종류와 위치 조회; 속성 읽기: {projectionMatrix.elements, position}
            THREE.Vector3 — 타깃까지 거리 계산; 함수: {distanceTo()}
        동작:
            카메라의 투영 배율을 구한다.
            sensitivity를 #updateSensitivity × TILE_UPDATE_SENSITIVITY_SCALE로 구한다.
            배율이 유한하지 않거나 0 이하이면 fallbackDistance를 sensitivity로 나누어 반환한다.
            depth를 1로 시작한다. 투영 행렬 15번 성분이 0이면 원근 투영으로 처리한다.
            원근 투영에서 타깃이 없거나 카메라와 타깃의 거리가 유한하지 않으면 동일한 대체 임계값을 반환한다.
            유효한 원근 투영에서는 depth를 타깃까지의 거리와 1 중 최댓값으로 설정한다. 직교 투영은 depth=1을 유지한다.
            2 × depth ÷ 투영 배율로 시야 폭·높이 중 작은 값을 구하고 TILE_UPDATE_VIEW_RATIO ÷ sensitivity를 곱하여 반환한다.

    getDistanceByMode(app: U3dApp, distance: number = 120) -> number
        동작:
            저장된 _drawArg와 대체 거리 distance로 이동 임계값을 계산하여 반환한다.
            기존 이름과 app 인수는 호출 호환을 위해 유지하며 모드나 절대 z는 계산에 사용하지 않는다.

    isUpdate(drawArg: UDrawArg, distance?: number) -> boolean
        의존:
            defined — 카메라 연결 여부 확인; 함수: {defined()}
            UDrawArg — 카메라 조회; 함수: {getCameraPosition(), getCamera()}; 속성 읽기: {_app}
            THREE.Camera — 투영 종류와 방향 조회; 속성 읽기: {projectionMatrix, quaternion}
            THREE.Matrix4 — 투영 변화 판정; 함수: {equals()}
            THREE.Vector3 — 누적 이동 거리 판정; 함수: {distanceToSquared()}
            THREE.Quaternion — 회전각 판정; 함수: {equals(), angleTo()}
        동작:
            쿼드셋이 해제되었거나 drawArg·drawArg._app이 없으면 false를 반환한다. 현재 카메라가 null·undefined여도 false를 반환하며 이전 위치·회전·투영 기준을 변경하지 않는다.
            이전 위치·회전·투영 행렬 중 하나라도 없으면 true를 반환한다. 조회만으로 이전 기준을 저장하지 않는다.
            이전 투영 행렬과 현재 행렬이 다르면 true를 반환한다.
            투영 배율을 구하고 원근 투영이면서 배율이 0보다 크면 각도 계산에 사용한다. 그 밖에는 각도 계산 배율을 1로 둔다.
            sensitivity를 #updateSensitivity × TILE_UPDATE_SENSITIVITY_SCALE로 구한다.
            회전 임계값을 atan(2 × TILE_UPDATE_VIEW_RATIO ÷ sensitivity ÷ 각도 계산 배율)로 구한다.
            이전·현재 Quaternion 성분이 다르고 angleTo 결과가 회전 임계값 이상이면 true를 반환한다.
            _curPostion에 현재 위치를 복사하고 이전 위치와의 제곱 거리가 0이면 false를 반환한다.
            distance가 null 또는 undefined이면 대체 거리 120으로 이동 임계값을 계산한다. 그 밖에는 지정한 distance를 사용한다.
            누적 이동의 제곱 거리가 임계 거리의 제곱 이상인지 반환한다.

    traverse(callback) -> void
        의존: U3dQuadTile / U3dQuadModelTile — 타일 순회; 함수: {traverse()}
        동작:
            각 루트의 traverse에 callback을 전달한다.

    update(layername?: unknown, type?: unknown, force?: unknown, e?: unknown, change: boolean = false) -> void
        의존:
            defined — 실행 환경과 초기 상태 확인; 함수: {defined()}
            UDrawArg — 카메라 조회; 함수: {getCameraPosition(), getCamera()}; 속성 읽기: {_app}
            THREE — 갱신 기준 생성; 생성자: {new Vector3(), new Quaternion(), new Matrix4()}
            THREE.Vector3 / THREE.Quaternion / THREE.Matrix4 — 갱신 기준 저장; 함수: {copy()}
            U3dApp — 갱신 대상 레이어·작업 실행기와 전환 수명 조회; 함수: {getInstanceImageLayers(), getInstanceHeightLayers(), getInstanceModelLayers(), getInstanceTerrainLayers(), getInstanceUserLayers(), getInstanceMeasureLayers(), isDisposed()}; 속성 읽기: {_imageProcess, _heightProcess, _modelProcess, _quadTreeChanging, _mapRegionApplying}
            U3dLayer — 레이어 표시 여부; 함수: {getVisible()}
            U3dQuadTile / U3dQuadModelTile — 루트 초기화와 갱신; 함수: {isInitialized(), createMesh(), getType(), update()}
            UDEF — 루트 종류; 상수: {TILE_TYPE.TERRAIN, TILE_TYPE.MODEL}
            UFrameState — 지형 작업 상태 생성; 생성자: {new UFrameState()}
            UModelFrameState — 모델 작업 상태 생성; 생성자: {new UModelFrameState()}
        동작:
            쿼드셋이 해제되었거나 _drawArg·앱이 없거나 앱이 해제되었거나 트리 교체·영역 적용 중이면 종료한다.
            카메라가 null·undefined이면 force나 change 여부와 관계없이 종료한다. 이전 카메라 기준·루트·프레임 상태를 보존하므로 카메라가 연결된 뒤의 첫 정상 갱신을 생략하지 않는다.
            change 또는 force가 truthy이면 판별을 생략하고, 그 밖에는 민감도에 따른 업데이트 필요 여부를 구한다.
            갱신이 필요하지 않으면 종료한다. layername, type, e는 갱신 범위 선택에 사용하지 않는다.
            기존 _lodUpdateContext를 보관한다. 카메라 기준·레이어 목록 준비부터 정상 종료와 예외 모두 복원·무효화 처리를 보장한다.
            _curPostion에 현재 카메라 위치를 복사한다.
            이전 위치가 없으면 위치·회전·투영 행렬 저장 객체를 만들고 현재 값을 모두 복사한다.
            이전 위치가 있으면 세 저장 객체에 현재 값을 복사한다. 회전이나 외부 change만으로 갱신해도 세 기준을 함께 저장한다.
            표시된 이미지·모델 레이어만 _imageLayers·_modelLayers에 모으고 지형 레이어 목록을 _terrainLayer에 저장한다. 사용자 레이어와 선택적으로 조회한 측정 레이어를 이어 붙여 _otherLayers를 만든다. 각 목록이 nullish이면 빈 배열로 대신한다.
            고도 레이어 목록을 _heightLayers에 저장하여 타일이 영상과 고도의 원자료 상세화 요구를 별도로 판단하게 한다.
            자료 목록을 준비한 뒤 현재 drawArg의 빈 공통 값 저장소로 교체한다. 중첩 갱신도 독립된 저장소를 만든다.
            각 루트가 초기화되지 않았으면 createMesh(null, _drawArg)를 호출한다.
            지형 루트는 공유 _visibleState와 이미지·높이 실행기로 UFrameState를 필요할 때 생성하여 _frameStates에 먼저 등록한다.
            모델 루트는 표시된 모델 레이어가 있을 때만 UModelFrameState를 필요할 때 생성하여 먼저 등록한다.
            해당 루트의 update에 _drawArg, 루트별 상태와 force를 전달한다.
            카메라 기준·자료 준비 또는 루트 순회의 정상 반환과 예외 모두 이전 저장소가 있으면 parameters를 undefined로 무효화하고 _lodUpdateContext를 이전 저장소로 복원한다.
            복귀한 바깥 순회의 다음 가시 표준 타일은 최신 상태로 공통 값을 다시 계산하고 이후 타일들이 재사용한다. 타일별 변경 검사나 추가 갱신 예약은 하지 않는다.
            실행을 생략한 갱신은 기존 저장소를 무효화하지 않는다. 공통 값은 비동기 작업 완료 시점까지 유지하지 않는다.
            루트 목록을 복사하여 순회하고 도중 루트 변경 또는 앱 해제가 발생하면 오래된 순회와 완료 통지를 중단한다. 루트 전달을 정상으로 마치면 검색 완료 처리를 실행한다.

    updateModel(box3: Box3) -> void
        의존:
            U3dQuadTile / U3dQuadModelTile — 모델 루트 판정·초기화·갱신; 함수: {getType(), isInitialized(), createMesh(), update()}
            UDEF — 모델 종류; 상수: {TILE_TYPE.MODEL}
            UModelFrameState — 모델 작업 상태 생성; 생성자: {new UModelFrameState()}
            UDrawArg — 앱 참조; 속성 읽기: {_app}
            U3dApp — 모델 실행기; 속성 읽기: {_modelProcess}
        동작:
            현재 모델 루트 목록을 복사하고 해당 종류가 없으면 종료한다. 순회 중 현재 모델 루트가 해제되면 중단한다.
            미초기화 모델 루트의 메시를 생성하고 루트별 UModelFrameState를 필요할 때 만들어 _frameStates에 먼저 등록한다.
            모델 루트의 update에 _drawArg, 상태, true와 box3를 전달한다.
            모델 루트의 해제 상태를 메시 초기화·순회 뒤에 확인한다. 모델 루트가 교체되면 이전 프레임 등록과 완료 알림을 중단하고 지형만 교체되면 모델 처리를 계속한다.

    redraw() -> void
        의존: __GError__ — 지원하지 않는 호출 보고; 함수: {__GError__()}
        동작:
            사용할 수 없는 함수라는 오류를 코드 8119830으로 __GError__에 전달한다.

disposeQuadTree(quadtree: U3dQuadTile | U3dQuadModelTile, errors: Array<unknown>) -> void
    의존:
        U3dQuadTile / U3dQuadModelTile — 루트 및 자식 해제 위임; 함수: {dispose()}
    동작: quadtree.dispose(true)를 실행하고 실패하면 원래 오류를 errors에 추가한다. 여기서 재던지지 않아 다음 루트를 정리할 수 있게 한다.

createQuadTreeGroup(set: U3dQuadSet, type: string) -> void
    의존:
        UMathEngine — 저장된 영역·실제 시작 레벨의 타일 인덱스와 경계 계산; 함수: {getGoogleToIndexXY(), TileBounds()}
        U3dQuadTile / U3dQuadModelTile — 종류별 루트 작성; 생성자: {new U3dQuadTile(), new U3dQuadModelTile()}
        U3dApp — 생성 중 해제 감지; 함수: {isDisposed()}
    동작:
        set이 해제되었거나 해당 종류가 있으면 종료한다.
        영역의 최소·최대 타일 인덱스를 구하고 양 끝을 포함한 x·y를 순회하며 해당 종류의 루트를 임시 목록에 만든다. 각 생성 후 컨테이너 또는 앱 해제이면 오류를 낸다.
        생성 실패 시 준비한 모든 루트를 회수한다. 정리 성공이면 생성 오류를 그대로, 정리도 실패하면 생성 오류부터 담은 errors 배열을 가진 Error를 전달한다.
        모두 성공하면 통합 목록에 루트를 게시하고 _rootRevision을 증가시키며 _initialized를 목록 길이로 확정한다. _prevPostion을 비워 다음 갱신이 실행되게 한다.

disposeQuadTreeGroup(set: U3dQuadSet, type: string) -> void
    의존:
        U3dQuadTile / U3dQuadModelTile — 대상 종류 분류; 함수: {getType()}
        UVisibleState — 지형 가시 상태 재생성; 생성자: {new UVisibleState()}
        U3dObject — 마지막 루트 해제 시 이벤트 구독 제거; 함수: {off()}
    동작:
        set이 해제되었거나 해당 종류의 루트가 없으면 종료한다.
        대상 루트를 통합 목록과 _frameStates에서 해제 알림 전에 분리하고 _rootRevision을 증가시킨다. 지형 해제일 때만 _visibleState를 새로 만든다.
        남은 루트로 _initialized를 확정한다. 마지막 종류이면 _disposed를 true로 바꾸고 모든 프레임·LOD 문맥·이벤트 구독을 비운다.
        모든 대상 루트의 해제를 시도한다. 단일 실패는 원래 오류, 복수 실패는 호출 순서의 errors 배열을 가진 Error로 전달한다.

raiseSearchedEvent(drawArg: UDrawArg, modelRoots?: Array<U3dQuadModelTile>) -> void
    인터페이스:
        현재 쿼드셋을 this로 받아 앱의 검색 완료와 작업 완료 알림을 연결한다.
    의존:
        UDrawArg — 검색 중인 타일 수 관리; 함수: {minusSearchTileCount(), getSearchTileCount(), resetSearchTileCount()}; 속성 읽기: {_app}
        U3dApp — 수명·전환 상태 및 검색·작업 완료 알림; 함수: {isDisposed(), dispatchEvent(), createWorkingEndEvent()}; 속성 읽기: {_quadTreeChanging, _mapRegionApplying}; 상수: {EVENT.SEARCHED}
    동작:
        drawArg의 현재 앱을 보관하며 쿼드셋이 해제되었거나 앱이 없거나 해제·트리 전환·지도 영역 전환 중이면 종료한다.
        검색 타일 수를 한 번 줄이고 남은 수가 0보다 크면 종료한다.
        검색 수를 초기화한 뒤 보관한 앱의 SEARCHED 이벤트를 전달한다.
        이벤트 처리 뒤 쿼드셋이 해제되었거나 drawArg의 앱이 바뀌었거나 보관한 앱이 해제되었으면 종료한다.
        SEARCHED 콜백 이후 일반 순회는 공통 루트 변경 세대를 확인한다. 모델 순회는 보관한 모델 루트의 수명을 확인하고, 모델 루트가 유지된 채 루트 변경 세대만 바뀌었으면 createWorkingEndEvent의 내부 modelOnly 인수로 모델·거리별 이벤트와 모델 레이어 완료만 예약한다. 교체된 지형의 전체·영상·고도 완료는 새 검색에서 예약하며 이미 시작한 새 검색의 타이머는 취소하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
