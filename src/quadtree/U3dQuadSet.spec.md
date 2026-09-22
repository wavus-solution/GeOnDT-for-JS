# U3dQuadSet 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지정한 Google 좌표 영역의 지형·모델 루트 타일을 만들고 카메라 변화에 따라 타일 업데이트 실행 여부를 결정한다.

### 1.2 책임 범위

루트 타일 목록과 루트별 작업 상태를 보관하고, 업데이트 시 사용할 레이어 목록을 수집하여 각 루트에 갱신을 요청한다.

책임 경계: 개별 타일의 분할 여부와 콘텐츠 작업 실행은 타일 및 프레임 상태 객체가 담당한다.

### 1.3 주요 동작 방식

생성 시 영역과 시작 레벨에 해당하는 지형·모델 루트를 쌍으로 만든다. 일반 업데이트는 위치·회전 차이 또는 명시적 갱신 요청을 판별한 뒤 루트에 작업을 전달하고 검색 완료 이벤트를 처리한다.

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

    constructor(minx: number, maxx: number, miny: number, maxy: number, level: number, layers, drawArg, scene)
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
            빈 _frameStates와 UVisibleState를 만든 뒤 루트 초기화를 실행한다.

    dispose() -> void
        의존:
            U3dQuadTile / U3dQuadModelTile — 하위 트리 해제; 함수: {dispose()}
            UEventDispatcher — 이벤트 구독 해제; 함수: {off()}
        동작:
            각 루트의 북서·북동·남서·남동 자식을 재귀적으로 먼저 방문한 뒤 해당 타일의 dispose(true)를 호출한다.
            _listQuadtree를 빈 배열로 교체하고 off()로 이 객체의 이벤트 구독을 해제한다.
            _frameStates와 _visibleState는 이 함수에서 비우지 않는다. [확인 Q-002]

    add(quadtree) -> false | void
        의존: defined — 타일 존재 판정; 함수: {defined()}
        동작:
            quadtree가 없으면 false를 반환한다.
            존재하면 _listQuadtree 끝에 추가하며 별도 값을 반환하지 않는다.

    initialize() -> boolean
        의존:
            UMathEngine — 시작 레벨의 타일 좌표와 경계 계산; 정적 함수: {getGoogleToIndexXY(), TileBounds()}
            U3dQuadTile — 지형 루트 생성; 정적 함수: {setStartLevel()}; 생성자: {new U3dQuadTile()}
            U3dQuadModelTile — 모델 루트 생성; 생성자: {new U3dQuadModelTile()}
            UEventDispatcher — 타일 완료 구독; 함수: {on()}
            U3dEvent — 완료 이벤트 종류; 상수: {TILE.LOADED}
            U3dApp — 완료된 타일의 자동 높이 보정; 함수: {execAutoHeightUpdate()}
        동작:
            _drawArg 또는 _drawArg._app이 없으면 false를 반환한다.
            U3dQuadTile의 시작 레벨을 _rlevel로 설정한다.
            영역 양끝의 타일 인덱스를 구하고 양끝을 포함한 Y·X 인덱스를 순회한다.
            각 타일 경계의 최솟값·최댓값으로 지형·모델 루트를 각각 생성하여 이 객체에 추가한다.
            TILE.LOADED에 앱의 execAutoHeightUpdate를 앱에 bind한 함수를 등록한다.
            _initialized를 루트 목록이 비어 있지 않은지로 설정하고 반환한다.

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
            U3dApp — 갱신 대상 레이어와 작업 실행기 조회; 함수: {getInstanceImageLayers(), getInstanceModelLayers(), getInstanceTerrainLayers(), getInstanceUserLayers()}; 속성 읽기: {_imageProcess, _heightProcess, _modelProcess}
            U3dLayer — 레이어 표시 여부; 함수: {getVisible()}
            U3dQuadTile / U3dQuadModelTile — 루트 초기화와 갱신; 함수: {isInitialized(), createMesh(), getType(), update()}
            UDEF — 루트 종류; 상수: {TILE_TYPE.TERRAIN, TILE_TYPE.MODEL}
            UFrameState — 지형 작업 상태 생성; 생성자: {new UFrameState()}
            UModelFrameState — 모델 작업 상태 생성; 생성자: {new UModelFrameState()}
        동작:
            _drawArg 또는 앱이 없으면 종료한다.
            change 또는 force가 truthy이면 판별을 생략하고, 그 밖에는 민감도에 따른 업데이트 필요 여부를 구한다.
            갱신이 필요하지 않으면 종료한다. layername, type, e는 갱신 범위 선택에 사용하지 않는다.
            _curPostion에 현재 카메라 위치를 복사한다.
            이전 위치가 없으면 위치·회전·투영 행렬 저장 객체를 만들고 현재 값을 모두 복사한다.
            이전 위치가 있으면 세 저장 객체에 현재 값을 복사한다. 회전이나 외부 change만으로 갱신해도 세 기준을 함께 저장한다.
            표시된 이미지·모델 레이어만 _imageLayers·_modelLayers에 모으고 지형·사용자 레이어 목록을 _terrainLayer·_otherLayers에 저장한다.
            각 루트가 초기화되지 않았으면 createMesh(null, _drawArg)를 호출한다.
            지형 루트는 공유 _visibleState와 이미지·높이 실행기로 UFrameState를 필요할 때 생성하여 _frameStates에 먼저 등록한다.
            모델 루트는 표시된 모델 레이어가 있을 때만 UModelFrameState를 필요할 때 생성하여 먼저 등록한다.
            해당 루트의 update에 _drawArg, 루트별 상태와 force를 전달한다.
            루트 전달을 마치면 검색 완료 처리를 실행한다.

    updateModel(box3) -> void
        의존:
            U3dQuadTile / U3dQuadModelTile — 모델 루트 판정·초기화·갱신; 함수: {getType(), isInitialized(), createMesh(), update()}
            UDEF — 모델 종류; 상수: {TILE_TYPE.MODEL}
            UModelFrameState — 모델 작업 상태 생성; 생성자: {new UModelFrameState()}
            UDrawArg — 앱 참조; 속성 읽기: {_app}
            U3dApp — 모델 실행기; 속성 읽기: {_modelProcess}
        동작:
            모델 종류가 아닌 루트를 건너뛴다.
            미초기화 모델 루트의 메시를 생성하고 루트별 UModelFrameState를 필요할 때 만들어 _frameStates에 먼저 등록한다.
            모델 루트의 update에 _drawArg, 상태, true와 box3를 전달한다.
            모델 루트 처리가 끝나면 검색 완료 처리를 실행한다.

    redraw() -> void
        동작:
            사용할 수 없는 함수라는 오류를 코드 8119830으로 __GError__에 전달한다.

raiseSearchedEvent(drawArg) -> void
    의존:
        UDrawArg — 검색 중인 타일 수 관리; 함수: {minusSearchTileCount(), getSearchTileCount(), resetSearchTileCount()}; 속성 읽기: {_app}
        U3dApp — 검색 및 작업 완료 알림; 함수: {dispatchEvent(), createWorkingEndEvent()}; 상수: {EVENT.SEARCHED}
    동작:
        drawArg가 없으면 종료한다.
        검색 타일 수를 한 번 줄이고 남은 수가 0보다 크면 종료한다.
        검색 수를 초기화한 뒤 앱이 없으면 종료한다.
        앱의 SEARCHED 이벤트를 전달하고 createWorkingEndEvent를 호출한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
