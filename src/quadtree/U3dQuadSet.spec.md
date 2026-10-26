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
            유한하고 양의 면적인 경계와 0 이상 최대 레벨 이하의 정수 시작 레벨인지 확인한다.

    static createQuadTreeSet(rectangle: UGeoRect, level: number, drawArg: UDrawArg, scene: UScene, tree?: U3dQuadSet, type?: string) -> U3dQuadSet | null
        동작:
            기존 컨테이너가 전달되면 해당 인스턴스의 createQuadTreeSet(rectangle, level, type)에 위임한다. 신규 생성은 입력 검사 후 생성자를 호출한다.
            입력이 유효하지 않으면 null을 반환한다. 반대쪽 루트가 있으면 같은 영역·시작 레벨이어야 하며 다르면 RangeError를 전달한다.
            기존 컨테이너에 누락된 종류만 추가한다. 기존 컨테이너가 없으면 지정한 종류 또는 두 종류의 새 컨테이너를 생성한다.
            초기 생성 실패의 준비된 루트 회수는 생성자·initialize 경로에서 처리한다.

    createQuadTreeSet(rectangle: UGeoRect, level: number, type?: string) -> U3dQuadSet | null
        동작:
            현재 컨테이너의 그리기 인자·장면을 사용하여 누락된 종류만 보충한다. 이미 대상 종류가 있으면 현재 객체를 반환한다.
            입력이 유효하지 않거나 해제된 객체이면 null을 반환한다. 기존 영역·시작 레벨과 다르면 RangeError를 전달한다.

    restartQuadTree(rectangle: UGeoRect, level: number, type?: string) -> U3dQuadSet | null
        동작:
            입력과 종류를 검사하고 부분 재시작의 영역·시작 레벨이 기존과 다르면 해제 전에 거절한다. disposeQuadTree(type)로 대상만 해제하고 앱이 종료되었으면 null을 반환한다. 검증한 내부 생성은 정적 생성기를 다시 거치지 않는다.
            반대쪽 루트가 남아 있으면 기존 컨테이너에 대상 종류를 다시 추가한다.
            전체 또는 마지막 종류 교체는 새 컨테이너를 반환하여 해제된 컨테이너를 재사용하지 않는다.
            생성·해제 오류는 호출자에게 전달하며 앱의 연결·완료 대기·화면 갱신은 앱이 담당한다.

    disposeQuadTree(type?: string) -> void
        동작:
            지정한 종류의 해제 메서드를 호출하며 종류 생략 시 dispose()로 두 종류를 해제한다.
            전체·개별 해제는 같은 종류별 루트·프레임 정리 경로를 사용한다.

    isDisposed() -> boolean
        동작:
            컨테이너의 _disposed 상태를 반환한다. 한 종류의 루트가 남은 부분 해제 상태는 false이며 마지막 종류 해제 후 true가 된다.

    dispose() -> void
        동작:
            disposeTerrainQuadTree(),disposeModelQuadTree()를 모두 시도하며 한 종류의 오류가 다른 종류 정리를 막지 않는다.
            쿼드셋은 루트의 dispose만 호출하고 하위 재귀는 타일이 소유한다. 각 타일은 자식부터 재귀 해제하며 단일 실패는 원래 오류를, 복수 실패는 호출 순서대로 담은 errors 배열을 가진 Error로 전달한다. 하위에서 묶어 전달한 오류는 해당 객체로 보존한다.
            마지막 루트 해제 시 _frameStates, LOD 임시 문맥과 이벤트 구독을 비우고 해제 상태로 표시한다.

    getQuadTree(type: string) -> U3dQuadTile | U3dQuadModelTile | undefined
        동작:
            지정한 종류의 첫 루트를 반환한다. 해당 종류가 없거나 컨테이너가 해제되었으면 undefined를 반환한다.

    getQuadTrees(type?: string) -> Array<U3dQuadTile | U3dQuadModelTile>
        동작:
            지정한 종류의 루트 목록을 반환하며 종류 생략 시 전체 목록을 반환한다.
            반환 배열은 복사본이며 루트 객체의 참조는 유지한다. 해당 종류가 없거나 해제되었으면 빈 배열을 반환한다.

    hasQuadTree(type: string) -> boolean
        동작:
            해제되지 않았고 해당 종류의 루트가 통합 목록에 있는지 반환한다.

    createTerrainQuadTreeSet() -> void
        동작:
            저장한 영역·시작 레벨로 지형 루트만 준비한 뒤 통합 목록에 추가한다. 동일 종류가 이미 있거나 컨테이너가 해제되었으면 종료한다.
            생성 실패 시 준비한 루트를 모두 정리하여 반대쪽 루트를 보존한다. 정리가 성공하면 생성 오류를 그대로 전달하며, 정리도 실패하면 생성 오류와 정리 오류를 순서대로 errors 배열을 가진 Error로 전달한다.
            루트 변경 세대를 증가시키고 이전 위치를 무효화하여 다음 갱신을 실행한다.

    createModelQuadTreeSet() -> void
        동작:
            지형 개별 생성과 같은 기준으로 모델 루트만 준비하고 추가한다.

    disposeTerrainQuadTree() -> void
        동작:
            지형 루트와 해당 프레임 참조를 해제 알림 전에 목록에서 분리하고 가시 상태를 초기화한다.
            모델 루트·프레임·캐시는 유지한다. 대상이 없으면 종료한다.
            루트 변경 세대를 증가시키며 마지막 종류를 해제하면 컨테이너도 해제 상태가 된다.
            모든 대상 루트를 처리한 뒤 단일 실패는 원래 오류를, 복수 실패는 errors 배열을 가진 Error로 전달한다.

    disposeModelQuadTree() -> void
        동작:
            모델 루트와 해당 프레임만 분리·해제하며 지형 가시 상태를 유지한다.
            나머지 해제 기준과 오류 전달은 지형 개별 해제와 같다.

    add(quadtree) -> false | void
        의존: defined — 타일 존재 판정; 함수: {defined()}
        동작:
            quadtree가 없으면 false를 반환한다.
            존재하면 _listQuadtree 끝에 추가하며 별도 값을 반환하지 않는다.

    initialize(type?: string) -> boolean
        의존:
            UMathEngine — 시작 레벨의 타일 좌표와 경계 계산
            U3dQuadTile / U3dQuadModelTile — 종류별 루트 생성
        동작:
            앱이 없으면 false를 반환한다. 지정한 type이 지형·모델이 아니면 TypeError를 전달한다.
            type을 생략하면 두 종류를 생성하고 지정하면 해당 종류만 생성한다. 루트 생성에 _rlevel을 직접 전달한다.
            두 번째 종류 생성이 실패하면 먼저 생성한 종류도 정리한다.
            TILE.LOADED에 쿼드셋 자신의 updateAutoHeight를 연결하고 초기화 여부를 반환한다. 앱의 이벤트 전달 메서드는 사용하지 않는다.

    updateAutoHeight(tile: U3dQuadTile | undefined) -> void
        의존:
            U3dApp / UIndexManager — 앱 상태와 위치별 등록 항목 조회; 함수: {isDisposed(), getIndexManager(), search()}
            U3dQuadTile — 소속·종류·높이 준비·경계·고도 조회
        동작:
            앱·쿼드셋이 해제되었거나 트리 교체·영역 적용 중이면 반환한다.
            소속 지형 타일이 아니거나 해제된 타일·자식이 있는 타일·고도 미준비 타일이면 반환한다.
            지형 루트 이름과 타일 레벨로 등록 항목의 중복 반영을 판정하며 새로운 지형에서는 같은 레벨도 다시 적용한다.
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
            UDrawArg — 카메라 조회; 함수: {getCameraPosition(), getCamera()}; 속성 읽기: {_app}
            THREE.Camera — 투영 종류와 방향 조회; 속성 읽기: {projectionMatrix, quaternion}
            THREE.Matrix4 — 투영 변화 판정; 함수: {equals()}
            THREE.Vector3 — 누적 이동 거리 판정; 함수: {distanceToSquared()}
            THREE.Quaternion — 회전각 판정; 함수: {equals(), angleTo()}
        동작:
            drawArg 또는 drawArg._app이 없으면 false를 반환한다.
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
            U3dApp — 갱신 대상 레이어와 작업 실행기 조회; 함수: {getInstanceImageLayers(), getInstanceHeightLayers(), getInstanceModelLayers(), getInstanceTerrainLayers(), getInstanceUserLayers()}; 속성 읽기: {_imageProcess, _heightProcess, _modelProcess}
            U3dLayer — 레이어 표시 여부; 함수: {getVisible()}
            U3dQuadTile / U3dQuadModelTile — 루트 초기화와 갱신; 함수: {isInitialized(), createMesh(), getType(), update()}
            UDEF — 루트 종류; 상수: {TILE_TYPE.TERRAIN, TILE_TYPE.MODEL}
            UFrameState — 지형 작업 상태 생성; 생성자: {new UFrameState()}
            UModelFrameState — 모델 작업 상태 생성; 생성자: {new UModelFrameState()}
        동작:
            _drawArg 또는 앱이 없으면 종료한다.
            change 또는 force가 truthy이면 판별을 생략하고, 그 밖에는 민감도에 따른 업데이트 필요 여부를 구한다.
            갱신이 필요하지 않으면 종료한다. layername, type, e는 갱신 범위 선택에 사용하지 않는다.
            기존 _lodUpdateContext를 보관한다. 카메라 기준·레이어 목록 준비부터 정상 종료와 예외 모두 복원·무효화 처리를 보장한다.
            _curPostion에 현재 카메라 위치를 복사한다.
            이전 위치가 없으면 위치·회전·투영 행렬 저장 객체를 만들고 현재 값을 모두 복사한다.
            이전 위치가 있으면 세 저장 객체에 현재 값을 복사한다. 회전이나 외부 change만으로 갱신해도 세 기준을 함께 저장한다.
            표시된 이미지·모델 레이어만 _imageLayers·_modelLayers에 모으고 지형·사용자 레이어 목록을 _terrainLayer·_otherLayers에 저장한다.
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

    updateModel(box3) -> void
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
        동작:
            사용할 수 없는 함수라는 오류를 코드 8119830으로 __GError__에 전달한다.

raiseSearchedEvent(drawArg, modelRoots?: Array<U3dQuadModelTile>) -> void
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
        SEARCHED 콜백 이후 일반 순회는 공통 루트 변경 세대를 확인한다. 모델 순회는 보관한 모델 루트의 수명만 확인하므로 지형 교체 후에도 createWorkingEndEvent로 모델 완료를 예약한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
