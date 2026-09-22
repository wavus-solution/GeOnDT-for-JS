# U3dModelTilesLayer 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`U3dModelTilesLayer`는 3D Tiles 계층을 카메라와 화면 공간 오차 기준으로 탐색하고, 타일 콘텐츠를 비동기로 내려받아 형식별 모델로 변환한 뒤 장면에 배치·교체·회수하는 모델 레이어다. 기본 `3dtiles`와 BIM 타일을 처리하며 벡터 타일 레이어가 확장할 수 있는 공통 작업 경로를 제공한다.

### 1.2 책임 범위

- 루트 tileset JSON을 읽어 타일 계층, 지리 범위와 초기 바운딩 볼륨을 구성한다.
- 카메라 위치, 프러스텀과 screen-space error로 표시하거나 세분화할 타일을 선택한다.
- JSON, B3DM, I3DM, CMPT, PNTS, VCTR, GLB와 glTF 콘텐츠의 다운로드·파싱 작업을 예약한다.
- ADD와 REPLACE refine 방식에 맞춰 부모·자식 타일의 표시 상태와 그룹 연결을 전환한다.
- 로드된 메시를 LRU 캐시에 보관하고 취소·숨김·초기화·처분 시 작업과 렌더 자원을 정리한다.
- 회전, 높이, 평면 오프셋, 투명도, 자동 지형 높이와 디버그 바운딩 박스를 레이어에 적용한다.
- 배치 메타데이터와 BIM 레벨 그룹 조회·구성을 제공한다.
- 책임 경계: VCTR 본문 해석은 기본 구현에서 수행하지 않으며 `U3dVectorTileLayer`가 파서 작업을 교체한다. 하위 VCTR 파서의 updateId 기반 결과 판정은 후속 범위다. [확인 Q-011]

### 1.3 주요 동작 방식

초기화는 루트 JSON을 `U3DTileset` 계층으로 만들고 지리 범위와 각 타일의 월드 바운딩 정보를 구성한다. 갱신은 카메라·프러스텀·SSE 문맥을 한 탐색 주기 동안 공유하고, 세분화가 필요한 타일에 다운로드 작업을 예약한다. 다운로드 결과는 콘텐츠 magic에 따라 파서 작업으로 전달되며, 형식별 후처리가 위치·회전·스케일과 메시 목록을 타일에 반영한다. 완료된 타일은 refine 방식에 따라 장면 그룹에 연결되고 캐시에 등록되며, 취소되거나 범위를 벗어난 타일은 작업·그룹·메시 참조가 정리된다.

### 1.4 주요 사용처와 연계 대상

- `U3dVectorTileLayer`가 이 클래스를 상속하고 `addParserQueue()`를 재정의하여 VCTR 파싱을 연결한다.
- `TDTilesModelLayer`와 `TDTilesBIMLayer`가 모델·BIM 3D Tiles 레이어를 생성한다.
- `U3dApp`이 모델 타일 레이어를 식별하고 애플리케이션 장면 및 draw argument와 연결한다.
- `U3dQuadTileWork`와 `WorkProcess`가 다운로드·파싱 작업의 필터, 취소와 우선순위를 관리한다.
- `U3DTileset`과 `U3DTilesMesh`가 타일 계층 상태와 로드된 모델 객체를 보유한다.

## 3. 정규 자연어 수도코드

```spec
U3dModelTilesLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 모델 레이어 공통 상태와 수명주기 제공; 상속: {U3dModelLayer}

    #stopUpdate: boolean = false
        update()의 타일 탐색 실행을 중지하는 상태

    #scaledHeightOffset: number = 0
        렌더 좌표 스케일로 환산하여 타일 위치와 바운딩 볼륨에 반영하는 높이 오프셋

    maximumScreenSpaceError: number = 32
        타일 세분화 여부를 결정하는 화면 공간 오차 한도

    _rootTileSet: U3DTileset | undefined
        초기화한 루트 3D Tiles 계층

    _initializedJson: boolean = false
        루트 JSON과 바운딩 정보 구성이 완료되었는지 나타내는 상태

    _updateId: string | number
        탐색·다운로드·파싱 결과의 유효성을 판정하는 식별자

    _cacheTiles: LRUCache
        콘텐츠 URL별 로드 메시와 바이트 크기를 보관하는 제한 캐시

    _activeTileContentRequests: Map<string, ModelTileContentRequestState>
        타일 ID별 현재 다운로드·파싱 파이프라인을 보관하며 하위 레이어가 확장할 수 있는 요청 상태 Map

    _rotation: DegreeEulerLike
        X, Y, Z축별 현재 회전 각도

    _heightOffset: number = 0
        외부에서 설정한 meter 단위 높이 오프셋 원값

    _viewSizeOffset: number | viewSizeOffsetFunction = 1
        screen-space error 계산에 곱하는 값 또는 타일별 계산 함수

    _batchGroupPath: string | undefined
        BIM 배치 그룹 정의를 읽을 경로

    _batchGroup: object | undefined
        batchGroup JSON 요청이 완료되면 저장하는 BIM 배치 그룹 데이터

    _metaDataJson: object | undefined
        loadMetaData()가 읽어 보관하는 배치 메타데이터 JSON

    _BIMLevelLengthList: object | Array | undefined
        BIM 레벨별 그룹 이름 길이 기준

    constructor(opt: U3dModelTilesLayerCO)
        역할: 모델 타일 탐색·로딩·파싱·캐시 상태와 좌표 변환 전제조건을 초기화한다.

        처리 기준:
            cacheSize는 생략하면 500, updateCycleTime은 생략하면 200, maximumScreenSpaceError는 생략하면 32을 사용한다.
            makeLevel을 생략하면 BIM 레벨 기준 수에서 1을 뺀 값을 사용하며 명시한 0도 getMakeLevel()에서 같은 자동 계산 경로로 처리한다. [확인 Q-005]
            BIMLevelLengthList를 생략하면 숫자 키 객체를 사용하고 입력에는 배열과 객체를 모두 허용한다. [확인 Q-009]
            전역 proj4가 없거나 geocent 투영을 지원하지 않으면 오류를 기록하고, EPSG:4978 정의가 없으면 등록한다.

        의존:
            U3dModelLayer — 기반 모델 레이어 초기화; 함수: {constructor()}
            defaultValue — 선택 옵션과 기본값 결합; 함수: {defaultValue()}
            defined — 옵션과 좌표계 정의 존재 여부 판정; 함수: {defined()}
            UGroup — 바운딩 도우미 그룹 생성; 생성자: {new UGroup()}
            THREE — 박스·구와 위치 벡터 생성; 생성자: {new Box3(), new Sphere(), new Vector3()}
            UCheckTime — 갱신 주기 검사기 생성; 생성자: {new UCheckTime()}
            Guid — 최초 작업 식별자 생성; 함수: {Guid()}
            LRUCache — 콘텐츠 캐시 생성; 생성자: {new LRUCache()}
            UFileLoader — arraybuffer 로더 생성과 응답 형식 설정; 생성자: {new UFileLoader()}; 함수: {setResponseType()}; 속성 쓰기: {crossOrigin}
            U3dMessage — proj4와 geocent 지원 오류 기록; 정적 함수: {error()}; 상수: {CNT.TILES.NON_PROJ4_PROJECTION_GEOCENT, CNT.TILES.NON_PROJ4}
            Web API — UTF-8 디코더 생성; 생성자: {new TextDecoder()}
            Host global __GEONDT__ — proj4 투영과 EPSG:4978 정의 조회·등록; 속성 읽기: {proj4.Proj.projections}; 함수: {proj4.defs()}

        동작:
            기반 레이어를 초기화하고 URL, 프록시, 바운딩 도우미, 자동 높이와 BIM 옵션을 저장한다.
            BIM 레벨 목록으로 기본 makeLevel을 계산하고 viewSizeOffset 입력을 정규화한다.
            카메라 이전·현재 위치, 회전, 높이, 작업 식별자와 파서 지연 생성 상태를 준비한다.
            제한 캐시와 공용 arraybuffer 로더를 생성한다.
            proj4의 geocent 투영과 EPSG:4978 정의를 확인한다.

    투명도와 갱신 상태 책임 그룹
        역할: 로드된 모델의 표현과 타일 탐색 실행 여부를 제어한다.

        override setOpacity(val: number) -> void
            처리 기준:
                루트 tileset이 없으면 캐시 메시에도 투명도를 적용하지 않고 종료한다.
                다중 재질 분기는 배열 원소 대신 material 배열의 length를 재질로 사용한다. [확인 Q-001]

            의존:
                U3dLayer — 레이어 공통 투명도 저장; 함수: {setOpacity()}
                defined — 메시 재질 존재 여부 판정; 함수: {defined()}
                THREE — 로드 메시 하위 객체 순회; 함수: {Object3D.traverse()}
                LRUCache — 캐시 값 목록 조회; 함수: {values()}

            동작:
                상위 레이어에 투명도를 저장한다.
                루트 계층과 캐시의 각 메시 재질에 transparent, opacity와 needsUpdate를 반영한다.

        setStopUpdate(stop: boolean = false) -> void
            동작: #stopUpdate에 입력값을 저장한다.

        isStopUpdate() -> boolean
            동작: #stopUpdate를 반환한다.

        isStateChange(curPosition: THREE.Vector3 = this._drawArg.getCameraPosition(), force?: boolean) -> boolean
            처리 기준:
                최초 검사는 변경으로 판정한다.
                이전 위치와 다르고 마지막 updateId 시각 뒤 1초가 지났거나 이동 거리가 5보다 크면 변경으로 판정한다.
                force 입력은 이전 위치를 원점으로 바꾼 뒤 같은 위치·시간·거리 기준으로 판정한다.

            의존:
                U3dModelLayer — 현재 카메라 위치 조회에 사용하는 draw argument; 속성 읽기: {_drawArg}
                UDrawArg — 카메라 위치 조회; 함수: {getCameraPosition()}
                THREE — 위치 복제·비교·복사와 거리 계산; 함수: {Vector3.clone(), set(), equals(), copy(), distanceTo()}
                Web API — updateId 이후 경과 시간 조회; 함수: {performance.now()}

            동작:
                현재 위치를 저장하고 이전 위치가 없으면 복제해 true를 반환한다.
                force이면 이전 위치를 원점으로 바꾸고 현재 위치가 이전 위치와 같으면 false를 반환한다.
                현재 updateId 이후 1초가 지났거나 이동 거리가 5보다 크면 이전 위치를 갱신하고 true를 반환한다.
                그 외에는 false를 반환한다.

        override update(drawArg: UDrawArg, curTime?: number, force: boolean = false) -> void
            인터페이스: drawArg과 curTime은 현재 구현에서 사용하지 않고 연결된 _drawArg를 조회한다.

            처리 기준:
                갱신 중지, 미초기화, 루트 JSON 미완료, draw argument 누락 또는 바운딩 박스 누락 상태에서는 실행하지 않는다.
                갱신 주기를 통과하지 못하면 실행하지 않는다.
                레이어 박스가 프러스텀 밖이거나 카메라와 레이어 구의 거리가 geometricError × viewSizeOffset × 2를 넘으면 표시 타일을 제거한다.

            의존:
                U3dModelLayer — 초기화와 draw argument 상태 사용; 함수: {isInitialized()}; 속성 읽기: {_drawArg}
                defined — draw argument 존재 여부 판정; 함수: {defined()}
                UDrawArg — 카메라 위치와 레이어 박스 교차 여부 조회; 함수: {getCameraPosition(), intersectsBox()}
                UCheckTime — 갱신 주기 판정과 다음 검사 시각 갱신; 함수: {isUpdate(), updateTime()}
                THREE — 레이어 구와 카메라 사이 거리 계산; 함수: {Sphere.distanceToPoint()}
                LRUCache — 표시 타일 존재 여부에 사용할 캐시 길이 조회; 함수: {length()}

            동작:
                갱신 중지와 초기화 선행조건을 검사한다.
                동적 viewSizeOffset을 계산하고 레이어 공간 범위를 벗어나면 타일을 제거한다.
                카메라 상태가 바뀌지 않았으면 다음 갱신 시각만 갱신하고 종료한다.
                이전 탐색 callback을 논리적으로 무효화할 새 updateId와 공유 검사 문맥을 만든다. 진행 중인 타일 콘텐츠 작업은 타일별 승계·dispose 정책으로 별도 관리한다.
                각 루트 자식의 로드 목록을 초기화하고 하위 타일 탐색을 시작한다.
                다음 갱신 시각을 갱신한다.

    바운딩 볼륨 책임 그룹
        역할: 타일의 지리 바운딩 데이터를 렌더 좌표의 선택 박스와 구로 변환한다.

        createViewBox(tile: U3DTileset) -> void
            처리 기준: 이미 viewBox가 있거나 boundingVolume이 없으면 아무 작업도 하지 않는다.

            의존:
                defined — 기존 박스와 boundingVolume 존재 여부 판정; 함수: {defined()}
                UBox3 — worldBox 복제와 바운딩 구 계산; 함수: {clone(), getBoundingSphere()}
                THREE — 타일 worldSphere 생성; 생성자: {new Sphere()}

            동작: worldBox가 없으면 먼저 구성하고, 이를 복제한 viewBox와 높이 오프셋을 반영한 worldSphere를 저장한다.

        createWorldBox(tile: U3DTileset) -> void
            처리 기준: 이미 worldBox가 있으면 아무 작업도 하지 않고, 지원하는 boundingVolume이 없으면 오류를 던진다.
            의존:
                defined — 기존 박스와 boundingVolume 종류 존재 여부 판정; 함수: {defined()}
            동작: region, sphere 또는 box의 geographicBox를 렌더 좌표 worldBox로 변환해 저장한다.

    초기화와 레이어 구성 책임 그룹
        역할: 애플리케이션 연결, 루트 타일 구성과 레이어별 표시 보정을 관리한다.

        override setApp(app: U3dApp) -> void
            의존: U3dModelLayer — 애플리케이션과 모델 작업 프로세스 연결; 함수: {setApp()}
            동작: app을 U3dModelLayer.setApp()에 전달한다.

        override getTileCallback() -> void
            동작: 이 레이어는 쿼드트리 타일 콜백 경로를 사용하지 않으므로 아무 값도 반환하지 않는다.

        override dispose() -> void
            처리 기준: U3dModelLayer.dispose()가 반환하는 Promise를 호출자에게 반환하지 않는다. [확인 Q-002]
            의존:
                U3dModelLayer — 기반 레이어 자원 처분; 함수: {dispose()}
                defined — 루트 tileset 존재 여부 판정; 함수: {defined()}
            동작:
                이전 탐색을 무효화하고 모든 활성 타일 콘텐츠 요청을 취소한 뒤 캐시와 루트 타일 계층을 정리하고 루트 참조를 제거한다.
                U3dModelLayer.dispose()를 호출하고 반환값을 사용하지 않는다.

        isInitializedJson() -> boolean
            동작: _initializedJson을 반환한다.

        updateCancel() -> void
            의존: Web API — 새 작업 식별 시각 조회; 함수: {performance.now()}
            동작: performance.now() 결과가 falsy이면 Date.now()를 사용하여 _updateId를 교체한다.

        isCancel(updateId: string | number) -> boolean
            동작: 입력 updateId와 현재 _updateId가 다르면 true를 반환한다.

        getUpdateId() -> string | number
            동작: 현재 _updateId를 반환한다.

        isUseBox() -> boolean
            동작: _useBox를 반환한다.

        setUseBox(val: boolean) -> void
            동작: _useBox에 입력값을 저장한다.

        getBatchGroupPath() -> string | undefined
            의존: defined — 배치 그룹 경로 존재 여부 판정; 함수: {defined()}
            동작: _batchGroupPath가 정의되어 있으면 반환하고, 아니면 undefined를 반환한다.

        getRegisteredType() -> string | undefined
            의존: defined — 등록 형식 존재 여부 판정; 함수: {defined()}
            동작: _registeredType이 정의되어 있으면 반환하고, 아니면 undefined를 반환한다.

        override initialize(opt?: object) -> Promise<U3DTileset> | false | undefined
            인터페이스: opt은 현재 구현에서 사용하지 않는다.

            처리 기준:
                baseurl이 없으면 undefined를, draw argument가 없으면 false를 동기 반환한다.
                루트 자식의 boundingVolume에 region, sphere 또는 box가 없으면 초기화 Promise와 레이어 생성 결과를 거부한다.
                배치 그룹 요청은 루트 JSON 초기화와 병렬로 시작하며 완료를 기다리지 않는다.

            의존:
                U3dModelLayer — 공통 초기화, draw argument와 레이어 완료 처리; 함수: {initialize(), resolve(), reject()}; 속성 읽기: {_drawArg}
                defined — 필수 설정·응답·바운딩 데이터 존재 여부 판정; 함수: {defined()}
                UFileLoader — 루트 JSON 요청; 생성자: {new UFileLoader()}; 함수: {setResponseType(), load()}; 속성 쓰기: {crossOrigin}
                deferred — 초기화 결과 Promise 생성; 함수: {deferred()}
                U3DTileset — 루트 타일 계층 생성; 생성자: {new U3DTileset()}
                THREE — 지리 중심과 바운딩 구 계산; 생성자: {new Vector3()}; 함수: {Box3.getCenter(), getBoundingSphere()}
                UMathEngine — 높이의 렌더 좌표 스케일 환산; 정적 함수: {getRealScaleAtGeographic(), getRealScaleAtGoogle()}
                U3dMessage — 응답·draw argument·바운딩 오류 기록; 정적 함수: {error()}; 상수: {CNT.CMM.NON_SERVER_DATA_1, CNT.CMM.NON_DRAWARG_1, CNT.TILES.NOT_SUPPORTED_BOUND}

            동작:
                기반 레이어를 초기화하고 배치 그룹 경로가 있으면 그룹 JSON 요청을 시작한다.
                루트 JSON을 요청하고, 응답 callback에서 복제한 JSON으로 U3DTileset을 생성한다.

                응답 callback은 루트 지리 범위, geometricError, 자식별 높이 범위·바운딩 박스·구와 높이 오프셋을 구성한다.
                초기화 완료 상태를 설정하고 강제 갱신한 뒤 루트 타일과 레이어 생성 결과를 resolve한다.
                요청 오류와 중단은 초기화 Promise와 레이어 생성 결과를 reject한다.

        getTile(uri: string, object?: U3DTileset) -> U3DTileset | undefined
            의존: U3DTileset — 콘텐츠 URI·첫 메시 UUID와 자식 계층 조회; 속성 읽기: {content.uri, userData.meshes, children}
            동작: 입력 객체 또는 루트에서 URI나 첫 메시 UUID가 일치하는 타일을 깊이 우선으로 찾아 반환한다.

        override createModel() -> void
            동작: 모델 생성은 콘텐츠 파서 경로에서 수행하므로 아무 작업도 하지 않는다.

        setOffset(offsetX: number, offsetY: number, offsetZ: number) -> void
            의존: U3dModelLayer — 레이어 그룹 위치 사용; 속성 읽기·쓰기: {_group.position}
            동작: 현재 그룹 위치에 각 축 오프셋을 더하고 마지막 입력값을 자체 상태 _offset에 저장한다.

        viewSizeOffset(offset?: number | viewSizeOffsetFunction) -> void
            처리 기준: 함수 또는 0보다 큰 값만 저장하고 그 외 입력은 1로 복원한다.
            동작: 입력 종류와 범위를 검사하여 _viewSizeOffset을 함수, 양수 또는 1로 설정한다.

        setHeightOffset(offset: number) -> void
            처리 기준:
                JSON 초기화 전에는 오류를 출력하고 아무 작업도 하지 않는다.
                Number(offset)가 falsy이면 아무 작업도 하지 않으므로 0으로 초기화할 수 없다. [확인 Q-003]
            의존:
                UMathEngine — 높이를 렌더 좌표 스케일로 환산; 정적 함수: {getRealScaleAtGoogle()}
                THREE — 바운딩 박스 중심과 구 재계산; 생성자: {new Vector3()}; 함수: {Box3.getCenter(), getBoundingSphere()}
                Host global __GError__ — 미초기화 호출 오류 출력; 함수: {__GError__()}
            동작: 초기화 여부를 검사하고 유효한 입력을 환산해 기존 오프셋과의 차이를 레이어 박스·구에 반영한다.

        setRotation(rotationX: number, rotationY: number, rotationZ: number) -> void
            의존: THREE — degree 회전값의 quaternion 생성; 생성자: {new Euler(), new Quaternion()}; 함수: {Quaternion.setFromEuler()}
            동작: 입력 각도를 저장하고 라디안 quaternion으로 변환하여 루트 자식 전체에 반영한다.

        showViewBoxHelper() -> void
            의존:
                defined — 도우미 레이어 식별자 존재 여부 판정; 함수: {defined()}
                THREE — 장면 자식의 박스 도우미 종류 판정; 생성자: {Box3Helper}
                UDrawArg — 애플리케이션 장면 자식 조회; 속성 읽기: {_app._scene.children}
            동작: 현재 레이어의 Box3Helper를 찾아 visible을 true로 설정한다.

        hideViewBoxHelper() -> void
            의존:
                defined — 도우미 레이어 식별자 존재 여부 판정; 함수: {defined()}
                THREE — 장면 자식의 박스 도우미 종류 판정; 생성자: {Box3Helper}
                UDrawArg — 애플리케이션 장면 자식 조회; 속성 읽기: {_app._scene.children}
            동작: 현재 레이어의 Box3Helper를 찾아 visible을 false로 설정한다.

        clearViewBoxHelper() -> void
            의존:
                defined — 도우미 레이어 식별자 존재 여부 판정; 함수: {defined()}
                THREE — 장면 자식의 박스 도우미 종류 판정; 생성자: {Box3Helper}
                UDrawArg — 애플리케이션 장면 자식 배열 조회·변경; 속성 읽기·쓰기: {_app._scene.children}
            동작: 앱 장면 children 배열에서 현재 레이어의 Box3Helper를 모두 제거한다.

        setAutoHeight(autoHeight: boolean) -> void
            처리 기준:
                활성화하면 레이어 바운딩 박스 중심 한 점의 지형 높이를 전체 그룹 높이에 사용한다. [확인 Q-008]
                높이 조회가 무효이면 0을 사용하고 비활성화하면 그룹 Z 위치를 0으로 복원한다.
            의존:
                defined — 지형 높이 조회 결과 존재 여부 판정; 함수: {defined()}
                UDEF — 무효 지형 높이 식별; 상수: {INVALID, TERRAIN_NO_DATA}
                UDrawArg — 렌더 좌표의 지형 높이 조회; 함수: {getRenderHeightAtPoint()}
                THREE — 레이어 박스 중심 벡터 생성; 생성자: {new Vector3()}; 함수: {Box3.getCenter()}
                U3dModelLayer — 레이어 그룹 사용; 속성 읽기·쓰기: {_group.position.z}
            동작: 자동 높이 상태를 저장하고 활성화하면 중심점 높이에서 box3.min.z를 뺀 값을 그룹 Z 위치에 적용한다.

        getAutoHeight() -> boolean
            동작: _autoHeight를 반환한다.

        getBoundingBox() -> THREE.Box3 | undefined
            처리 기준: JSON 초기화 전에는 오류를 기록하고 undefined를 반환한다.
            의존: U3dMessage — 미초기화 접근 오류 기록; 정적 함수: {error()}; 상수: {CNT.CMM.NOT_READY_LAYER}
            동작: JSON 초기화 상태를 검사하고 완료되었으면 _box3를 반환한다.

        removeAllTiles() -> void
            의존: U3DTileset — 루트 자식 계층 조회; 속성 읽기: {children}
            동작: 이전 탐색을 무효화하고 모든 활성 콘텐츠 요청과 캐시를 정리한 뒤 루트 자식 타일을 재귀 정리한다.

        override clear() -> Promise<void>
            의존:
                defined — 그룹과 루트 tileset 존재 여부 판정; 함수: {defined()}
                U3dModelLayer — 레이어 그룹과 모델 캐시 사용; 속성 읽기·쓰기: {_group.children, _cacheModelInTile, _cacheModeles}
                deferred — 비동기 정리 결과 생성; 함수: {deferred()}
            동작:
                이전 탐색을 무효화하고 모든 활성 콘텐츠 요청, 그룹 자식, 콘텐츠 캐시, 루트 계층과 모델 캐시를 정리한다.
                성공하면 resolve하고 동기 예외는 reject한다.

        clearCache() -> void
            의존: LRUCache — 캐시 값 목록 조회와 제거; 함수: {values(), clear()}
            동작: 캐시의 각 메시를 완전히 삭제한 뒤 모든 항목을 제거한다.

        refresh() -> void
            동작:
                usebox가 켜져 있으면 도우미를 제거한다.
                clear() 완료 callback에서 initialize()를 다시 시작한다.
                동기 예외는 refresh 실패 오류로 다시 던진다.

    타일 선택과 작업 예약
        searchTiles(tile: U3DTileset, parent: U3DTileset, updateId: string | number, isFirst: boolean = true, checkContext: TileCheckContext = this.#createCheckContext(undefined, updateId)) -> Promise<U3DTileset> | undefined
            처리 기준:
                취소된 갱신이면 탐색을 중단한다.
                ADD 계열은 완료된 타일부터 즉시 표시하고, REPLACE 계열은 같은 부모의 대상 타일이 모두 끝난 뒤 교체한다.
            의존:
                defined — viewBox와 자식 존재 여부 판정; 함수: {defined()}
                UDEF — refine와 타일 완료·캐시 상태 판정; 상수: {TILE_REFINE.ADD, TILES_STATE._END, TILES_STATE._CACHED}
                TILES_TYPE — 부모 경계 타일 판정; 상수: {BOUND}
                U3DTileset — 타일 계층·작업·표시 상태 변경; 속성 읽기·쓰기: {type, refine, children, parent, promise, loadCount, loadList, complete, work, failMsg}
                U3dQuadTileWork — 실패한 형제 작업 취소; 함수: {getName(), setActive()}
            동작:
                checkContext를 생략하면 updateId를 포함한 기본 판정 문맥을 만들고, 최초 타일의 월드 구가 프러스텀 밖이면 타일을 정리하고 부모 완료 수만 증가시킨다.
                타일 Promise 완료 callback에서 하위 깊이를 판정하고 재귀 탐색·표시·정리를 수행한다.
                REPLACE 형제 Promise 실패 callback에서는 남은 작업을 중단하고 부모 타일을 다시 표시한다.
                예약된 tile.promise를 반환한다.

        setPromise(tile: U3DTileset, updateId: string | number) -> void
            의존:
                UDEF — 완료와 캐시 상태 구분; 상수: {TILES_STATE._END, TILES_STATE._CACHED}
                U3DTileset — 작업 Promise와 실패·완료 상태 변경; 속성 읽기·쓰기: {promise, failMsg, complete}
            동작:
                다운로드 요청 Promise를 타일에 저장한다.
                성공 callback은 실패 메시지와 완료 상태를 갱신하고 실패 callback은 해당 타일을 정리한다.

        checkTile(tile: U3DTileset, campos?: THREE.Vector3, checkContext?: TileCheckContext) -> boolean
            의존:
                defined — 타일·카메라·바운딩 정보 존재 여부 판정; 함수: {defined()}
                U3DTileset — 뷰 박스와 갱신별 판정 캐시 사용; 속성 읽기·쓰기: {viewBox, _checkUpdateId, _checkResult}
            동작: 공유 문맥이 없으면 만들고 viewBox를 준비한 뒤 갱신별 캐시 또는 상세 SSE 판정 결과를 반환한다.

        checkTileDepth(tile: U3DTileset, depth: number = 2, results: Array<U3DTileset> = [], checkContext: TileCheckContext | undefined) -> boolean
            의존: U3DTileset — 자식과 refine 계층 조회; 속성 읽기: {children, refine}
            동작: 현재 타일이 세분화 대상이면 지정 깊이까지 REPLACE 자식을 펼쳐 results에 추가하고 true를 반환한다.

        _createTileContentRequestUrl(sourceUrl: string) -> string
            동작: 원본 콘텐츠 URL에 현재 프록시 URL과 API 키를 결합하여 UFileLoader 요청·취소에 공통으로 사용할 최종 URL을 반환한다.

        _isTileContentRequestCancelled(item: ModelTileParserQueueItem | ModelTileContentQueueInfo | undefined) -> boolean
            처리 기준:
                requestState가 있으면 updateId 변경만으로 취소하지 않는다.
                requestState가 없는 기존 호환 경로에서는 타일 dispose 또는 오래된 updateId를 취소로 판정한다.
            동작: 명시적 취소, 공유 Promise 완료, 타일 dispose 또는 Map의 현재 상태 identity 불일치를 검사한다.

        _adoptTileContentRequest(state: ModelTileContentRequestState, updateId: string | number) -> Promise<U3DTileset>
            처리 기준: 기존 Promise·work·다운로드·파서를 새로 만들지 않는다.
            동작: 상태와 다운로드·파서 파라미터의 updateId를 최신 세대로 갱신하고 기존 공유 Promise를 반환한다.

        _finishTileContentRequest(state: ModelTileContentRequestState, settle: "resolve" | "reject", tile: U3DTileset) -> void
            처리 기준: Map과 tile.work는 현재 상태·work의 객체 identity가 일치할 때만 제거한다.
            동작: 공유 Promise를 한 번 완료하고 요청 상태 소유권을 제거한다.

        _cancelTileContentRequest(tile: U3DTileset) -> boolean
            처리 기준:
                카메라 updateId 변경만으로는 호출하지 않는다.
                다운로드가 시작되었고 아직 완료되지 않았으며 최종 요청 URL이 로딩 중일 때만 실제 abort를 호출한다.
                UFileLoader의 URL 공유 AbortController 때문에 같은 URL의 다른 소비자도 함께 중단될 수 있다. [확인 Q-010]
                실행 중인 파서는 즉시 중단하지 못하므로 상태를 취소하고 완료 결과 적용을 차단한다.
            의존:
                UFileLoader — 최종 요청 URL의 로딩 조회와 실제 네트워크 중단; 함수: {_loader.isLoading(), abort()}
                U3dQuadTileWork — 큐 작업 비활성화; 함수: {setActive()}
            동작: 타일별 상태를 취소하고 큐 work를 비활성화하며 필요한 경우 저장된 requestUrl을 abort한 뒤 공유 Promise를 실패 완료한다.

        _cancelAllTileContentRequests() -> void
            동작: 활성 상태 목록을 복사한 뒤 각 타일 요청을 멱등하게 취소한다.

        addRequestQueue(tile: U3DTileset, updateId: string | number) -> Promise<U3DTileset>
            처리 기준:
                호출 세대가 이미 오래되었거나 URL이 없으면 Promise를 실패 처리한다.
                같은 타일 ID와 sourceUrl의 활성 상태가 있으면 기존 작업의 updateId를 최신 세대로 바꾸고 같은 Promise를 반환한다.
                같은 타일 ID의 sourceUrl이 바뀌면 이전 콘텐츠 상태를 폐기하고 새 파이프라인을 만든다.
                캐시가 있으면 메시 참조를 타일로 되돌리고 다운로드 없이 완료한다.
                JSON 타일이 실제 콘텐츠 타일로 교체되면 새 타일에 대해 다운로드 경로를 다시 예약한다.
            의존:
                deferred — 외부에 반환할 작업 Promise와 슬롯 반납 Deferred 생성; 함수: {deferred()}
                defined — 타일 필드 존재 여부 판정; 함수: {defined()}
                UDEF — 작업 메시지와 타일 상태 판정·변경; 상수: {_MSG_WORK._UPDATE_MESH_BUILDING, TILES_STATE._END, TILES_STATE._DOWNLOADING, TILES_STATE._PARSING}
                U3DTileset — 콘텐츠 URL, 메시, 작업과 상태 변경; 속성 읽기·쓰기: {content, baseURL, type, userData, complete, disposed, work, failMsg}
                U3dQuadTileWork — 다운로드 작업 생성과 큐 대기 작업 비활성화; 생성자: {new U3dQuadTileWork()}; 함수: {setActive()}
                WorkProcess — 우선순위 callback과 함께 다운로드 작업 등록; 함수: {_workProcess.add()}
                LRUCache — URL별 메시 캐시 조회·등록; 함수: {_cacheTiles.has(), get(), put()}
                U3dEvent — 단위 메시 로드 이벤트 종류; 상수: {MESH.LOADED}
                U3dLayer — 메시 로드 이벤트 발행; 함수: {dispatchEvent()}
                U3dMessage — 취소 파라미터 오류 기록; 정적 함수: {error()}; 상수: {CNT.TILES.NOT_CANCEL_WORK}
                TILES_TYPE — 경계·JSON 타일 종류 판정; 상수: {BOUND, JSON}
            동작:
                요청 시점에 취소 여부·완료 상태·URL·활성 상태·메시 캐시 순으로 검사한다.
                캐시 적중이면 보관된 메시와 단위 메시를 타일에 되돌리고 texture 재할당을 표시한 뒤 다운로드 없이 완료한다.
                새 요청이면 최종 requestUrl과 공유 Promise를 가진 ModelTileContentRequestState를 Map에 등록하고, 성공 callback에는 메시 캐시 등록과 로드 이벤트 발행을 한 번만 예약한다.
                WorkProcess가 실행하는 callback은 다운로드·형식 분기를 시작하고 네트워크 완료 시점에 settle되는 슬롯 반납 Deferred를 WorkProcess에 반환하며, JSON 교체 타일은 재귀 요청한다. 타일 파이프라인의 성공·실패는 공유 Promise를 정확히 한 번 완료하는 경로로 전달한다.
                작업 filter callback은 아직 큐에 있는 상태의 최신 세대·dispose·타일 상태를 검사하고, 우선순위 callback은 카메라 거리를 계산한다.
                타일 완료 여부를 결정하는 Promise를 반환한다.

        distanceToCameraPosition(tile: U3DTileset, useSphere?: boolean, position?: THREE.Vector3) -> number
            의존:
                defined — 위치와 바운딩 볼륨 존재 여부 판정; 함수: {defined()}
                UDrawArg — 기본 카메라 위치 조회; 함수: {_drawArg.getCameraPosition()}
                THREE — 점과 구·박스 사이 거리 계산; 함수: {Sphere.distanceToPoint(), Box3.distanceToPoint()}
            동작: 명시 위치 또는 현재 카메라와 타일 월드 박스 사이 거리를 반환하고 useSphere가 true이면 월드 구를 우선 사용한다.

        addParserQueue(fnc: (item: ModelTileParserQueueItem) -> Promise<U3DTileset>, item: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준:
                파서나 항목이 없으면 undefined 대신 실패 완료한 Promise를 반환하여 호출 인터페이스를 유지한다.
                파서의 동기 예외 또는 then/catch가 없는 반환값은 외부 Promise가 대기 상태로 남지 않도록 실패 처리한다.
                dispose 이후 늦게 완료된 파서 결과는 성공으로 적용하지 않는다.
            의존:
                deferred — 파서 완료 Promise 생성; 함수: {deferred()}
                UDEF — 파싱 작업 메시지와 상태 판정; 상수: {_MSG_WORK._UPDATE_MESH_BUILDING, TILES_STATE._PARSING}
                U3dQuadTileWork — 파서 작업과 취소 callback 구성; 생성자: {new U3dQuadTileWork()}
                WorkProcess — 파서 작업 등록; 함수: {_workProcess2.add()}
            동작:
                WorkProcess callback이 입력으로 전달된 파서를 현재 레이어 문맥으로 안전하게 실행하도록 위임한다.
                다운로드 단계의 requestState를 parser-queued·parsing 단계로 갱신하고 현재 parser 항목과 work를 같은 상태에 연결한다.
                filter callback은 아직 큐에 있는 상태의 최신 세대·명시적 취소·Map identity·타일 처분·파싱 상태를 검사한다.
                파서 완료 시 dispose 이후 늦게 끝난 결과인지 재검사한 뒤 파서 결과를 타일 단위 Promise로 변환해 반환한다.

        override show(show: boolean, refresh?: boolean) -> void
            의존:
                U3dModelLayer — 공통 표시 상태 변경; 함수: {show()}
                LRUCache — 캐시 항목 수 조회; 함수: {_cacheTiles.length()}
            동작: 기반 표시 처리를 실행하고 숨김 시 캐시 또는 활성 콘텐츠 요청이 있으면 모든 타일을 정리한 뒤 이전 카메라 위치를 초기화한다.

        disposeTile(tile: U3DTileset, updateId?: string | number) -> void
            의존:
                defined — 도우미·메시·자식 존재 여부 판정; 함수: {defined()}
                UFileLoader — 상태가 없는 호환 경로에서 최종 요청 URL 조회·중단; 함수: {_loader.isLoading(), abort()}
                LRUCache — 캐시 소유 메시 여부 판정; 함수: {_cacheTiles.has()}
                UGroup — 레이어·도우미 그룹에서 객체 제거; 함수: {_groupComment.remove(), _group.remove()}
                THREE — 앱 장면에서 박스 도우미 제거; 함수: {Scene.remove()}
                U3dQuadTileWork — 타일 작업 비활성화; 함수: {setActive()}
                UDEF — 초기 타일 상태 복원; 상수: {TILES_STATE._NONE}
                U3DTileset — 원본 JSON 타일과 자식 계층·자원 상태 변경; 속성 읽기·쓰기: {originalTile, parent, children, userData, complete, disposed, promise, work, boundInfo}
            동작:
                유효한 갱신의 타일만 대상으로 먼저 disposed 상태를 공개하고 타일별 활성 요청을 취소한다. 저장 상태가 없으면 원본 URL로 최종 요청 URL을 재구성해 호환 취소를 시도한다.
                장면 그룹, 메시와 작업을 정리한다. deferred 실패 callback의 동기 재진입은 선행 disposed 상태로 차단한다.
                JSON 교체 타일은 부모 children에서 원본 타일로 복원하고 자식 타일을 재귀 정리한다.

    계층·메타데이터와 BIM 설정
        getParent(object: U3DTileset) -> U3DTileset | undefined
            동작: object의 parent를 반환한다.

        getChildren(object: U3DTileset) -> Array<U3DTileset> | undefined
            의존: defined — 객체와 children 존재 여부 판정; 함수: {defined()}
            동작: 자식이 하나 이상 있으면 children 배열을 반환한다.

        loadMetaData(url?: string) -> Promise<object> | undefined
            처리 기준:
                이미 메타데이터가 있으면 즉시 해당 JSON으로 완료한다.
                URL이 없고 batchGroupPath도 없으면 undefined를 반환한다.
                JSDoc은 Promise<boolean>으로 표기하지만 구현은 JSON 객체로 완료한다. [확인 Q-004]
            의존:
                deferred — 로드 결과 Promise 생성; 함수: {deferred()}
                defined — URL·경로·JSON 존재 여부 판정; 함수: {defined()}
                UFileLoader — JSON 요청과 성공·오류·중단 callback 등록; 생성자: {new UFileLoader()}; 함수: {setResponseType(), load()}
                Console API — 실패·오류·중단 기록; 함수: {console.error()}
            동작: 명시 URL 또는 batchGroup 파일 인접 batch.json을 로드해 _metaDataJson에 저장하고 JSON으로 완료한다.

        getBatchMetaData() -> object | undefined
            의존: defined — 메타데이터 존재 여부 판정; 함수: {defined()}
            동작: 로드된 _metaDataJson을 반환한다.

        getMetaDataByName(name: string) -> UMetaData | undefined
            의존:
                defined — 이름·메타데이터·일치 항목 존재 여부 판정; 함수: {defined()}
                UMetaData — 일치 JSON을 메타데이터 객체로 변환; 생성자: {new UMetaData()}
            동작: 완전 일치 이름을 우선하고, 없으면 등록 키 길이만큼의 접두사가 일치하는 첫 항목을 UMetaData로 반환한다.

        getBatchGroupProperty(groupName: string) -> object | Array<object> | undefined
            의존:
                defined — 배치 그룹과 직접 일치 항목 존재 여부 판정; 함수: {defined()}
                Console API — 배치 그룹 미초기화 오류 기록; 함수: {console.error()}
            동작: 정확한 그룹의 Properties를 반환하거나 groupName 접두사와 일치하는 하위 그룹의 이름·Properties 목록을 반환한다.

        getBatchGroup() -> object | undefined
            의존: defined — 배치 그룹 경로와 데이터 존재 여부 판정; 함수: {defined()}
            동작: batchGroupPath와 _batchGroup이 모두 있으면 배치 그룹 객체를 반환한다.

        setMakeLevel(level: number) -> void
            의존:
                defined — 레벨과 배치 그룹 존재 여부 판정; 함수: {defined()}
                THREE — 장면 메시 판정과 순회; 생성자: {Mesh}; 함수: {Scene.traverse()}
            동작: 레벨을 저장하고 배치 그룹이 준비된 장면의 모든 THREE.Mesh에 같은 make level을 적용한다.

        getMakeLevel() -> number | undefined
            의존: defined — 명시 레벨과 BIM 레벨 기준 존재 여부 판정; 함수: {defined()}
            동작: 0이 아닌 명시 레벨을 반환하고, 그렇지 않으면 BIM 레벨 기준 수에서 1을 뺀 값을 저장·반환한다.

        setBIMLevelLengthList(list: object | Array) -> void
            처리 기준: 타입 소스는 array와 기본 상수를 설명하지만 구현은 숫자 키 객체도 허용하며 생성자 기본값도 객체다. [확인 Q-009]
            의존: defined — 입력 존재 여부 판정; 함수: {defined()}
            동작: 하나 이상의 키를 가진 레벨별 이름 길이 기준을 저장한다.

        getBIMLevelLengthList() -> object | Array
            처리 기준: 타입 기본 makeLevel은 0이지만 생성자에서 생략한 makeLevel은 레벨 기준 개수에서 1을 뺀 값으로 정한다. [확인 Q-005]
            의존: defined — 사용자 설정 목록 존재 여부 판정; 함수: {defined()}
            동작: 설정한 목록을 반환하고 없으면 레벨 0~4의 기본 이름 길이 객체를 반환한다.

    장면 자원과 그룹 관리
        allocateMesh(mesh: THREE.Object3D) -> void
            의존:
                defined — 재질과 자식 존재 여부 판정; 함수: {defined()}
                UTexture — 캐시 재사용 메시 texture의 GPU 재할당 표시; 함수: {allocate()}
            동작: 재질 배열 또는 단일 재질의 map이 allocate를 제공하면 재할당을 표시하고 자식 메시를 재귀 처리한다.

        deallocateMesh(mesh: THREE.Object3D) -> void
            의존:
                defined — 재질·지오메트리·자식 존재 여부 판정; 함수: {defined()}
                THREE — texture, material, geometry 자원 해제와 제거 이벤트 발행; 함수: {Texture.dispose(), Material.dispose(), BufferGeometry.dispose(), Object3D.dispatchEvent()}
            동작: 재질 배열 또는 단일 재질의 map·재질과 geometry를 해제하고 tileset 참조를 끊은 뒤 자식을 재귀 해제한다.

        deleteMesh(mesh: THREE.Object3D) -> void
            처리 기준: 비동기 재질 해제를 기다리지 않고 나머지 삭제를 계속한다. [확인 Q-007]
            의존:
                defined — 메시 자원·라벨·자식·사용자 dispose 존재 여부 판정; 함수: {defined()}
                THREE — geometry 해제, 자식 제거와 제거 이벤트 발행; 함수: {BufferGeometry.dispose(), Object3D.clear(), dispose(), dispatchEvent()}
                UGroup — 라벨 그룹에서 라벨 제거; 함수: {_labelGroup.remove()}
            동작: tileset 참조, 재질, geometry, 라벨과 자식을 정리하고 사용자 dispose 및 removed 이벤트를 실행한다.

        addGroup(tile: U3DTileset) -> void
            의존:
                UGroup — 타일 메시를 레이어 그룹에 추가; 함수: {_group.add()}
                U3DTileset — 표시 상태와 메시 목록 변경; 속성 읽기·쓰기: {visible, userData.meshes}
            동작: 아직 표시되지 않은 타일을 visible로 바꾸고 보유 메시를 레이어 그룹에 추가한다.

        removeGroup(tile: U3DTileset) -> void
            의존:
                UGroup — 타일 메시를 레이어 그룹에서 제거; 함수: {_group.remove()}
                U3DTileset — 표시 상태와 메시 목록 변경; 속성 읽기·쓰기: {visible, userData.meshes}
            동작: 표시 중인 타일을 숨김 상태로 바꾸고 보유 메시를 레이어 그룹에서 제거한다.

        removeGroupUpTree(tile: U3DTileset, target: U3DTileset, setType: number = UDEF.TILES_STATE._CACHED) -> void
            의존:
                UDEF — 완료·캐시 상태 변경; 상수: {TILES_STATE._END, TILES_STATE._CACHED}
                U3DTileset — 부모 계층과 완료 상태 변경; 속성 읽기·쓰기: {parent, id, complete}
            동작: tile의 부모부터 target 직전까지 표시를 제거하고 완료 타일의 상태를 setType으로 바꾼다.

        cesiumFromRadians(longitude: number, latitude: number, height: number) -> THREE.Vector3
            의존:
                THREE — 타원체 법선과 지심 좌표 계산; 생성자: {new Vector3()}; 함수: {normalize(), multiplyVectors(), copy(), dot(), divideScalar(), multiplyScalar(), add()}
            동작: 경위도 라디안과 높이를 WGS84 타원체 기준 지심 직교 좌표로 변환한다.

    내부 공간 판정과 계층 구성
        #changeRotation(tile: U3DTileset, rotationQuaternion: THREE.Quaternion) -> void
            의존:
                defined — 타일·자식·메시 존재 여부 판정; 함수: {defined()}
                THREE — 원본 quaternion과 레이어 회전 결합, 루트 메시 보정과 행렬 갱신; 함수: {Quaternion.multiplyQuaternions(), Object3D.updateMatrixWorld()}
                U3DTileset — 메시와 자식 계층 조회; 속성 읽기: {userData.meshes, children}
            동작: 타일 메시를 순회해 저장된 원본 quaternion과 레이어 회전을 결합하고, 콘텐츠 루트 X축을 직각으로 보정한 뒤 모든 자식 타일에 재귀 적용한다.

        #intersectsSphere(frustum: THREE.Frustum, sphere: THREE.Sphere, geometricError: number) -> boolean
            의존:
                THREE — 프러스텀 평면과 구 중심 사이 거리 계산; 속성 읽기: {Frustum.planes, Sphere.center, Sphere.radius}; 함수: {Plane.distanceToPoint()}
            동작: 프러스텀이나 구가 없으면 false를 반환하고, 여섯 평면 중 하나라도 구를 완전히 배제하면 false, 아니면 true를 반환한다. geometricError 입력은 현재 구현에서 사용하지 않는다.

        #createCheckContext(campos: THREE.Vector3 = this._drawArg.getCameraPosition(), updateId: string | number = this.getUpdateId()) -> TileCheckContext
            의존:
                UDrawArg — 카메라 위치·프러스텀과 카메라 SSE 분모 조회; 함수: {_drawArg.getCameraPosition(), _camera.getDenominator()}; 속성 읽기: {_drawArg._frustum}
                U3dApp — renderer draw buffer 높이 조회; 함수: {_app.getDrawBufferHeight()}
            동작: 한 탐색 주기에서 공유할 카메라 위치, 프러스텀, SSE 분모와 갱신 ID를 만든다.

        #checkTileDetail(tile: U3DTileset, checkContext: TileCheckContext) -> boolean
            처리 기준: viewSizeOffset이 함수이면 타일을 인자로 호출하고, 숫자이면 그대로 SSE에 곱한다.
            의존:
                defined — 타일의 월드 구·geometricError 존재 여부 판정; 함수: {defined()}
                THREE — 카메라와 월드 구 사이 거리 계산; 함수: {Sphere.distanceToPoint()}
                U3DTileset — 월드 구·geometricError와 이전 SSE 판정값 사용; 속성 읽기·쓰기: {worldSphere, geometricError, spaceError}
            동작: 프러스텀 밖이면 false를 반환하고 geometricError, draw buffer 높이, 거리와 카메라 분모로 SSE를 계산한다. 이전 프레임에서 선택된 타일은 한도의 1/3 범위 안에서 계속 선택하는 완화 기준을 적용한다.

        #createBox(bondingbox: UGeoBox) -> UBox3
            의존:
                UDrawArg — geographic 최소·최대점을 Google 렌더 좌표로 변환; 함수: {_drawArg.getGeographicToGoogle()}
                THREE — 변환 결과의 최소·최대 벡터 생성; 생성자: {new Vector3()}
                UBox3 — 렌더 좌표 바운딩 박스 생성; 생성자: {new UBox3()}
            동작: geographic box의 최소·최대점을 렌더 좌표로 바꾸고 축별 순서를 정규화하여 UBox3를 반환한다.

        #searchChildren(tile: U3DTileset, drawArg: UDrawArg, color?: number) -> void
            인터페이스: drawArg은 현재 구현에서 사용하지 않고, color를 생략하면 본문에서 0x00ffff로 보정한다.
            의존:
                defined — 콘텐츠·레벨·부모·바운딩 정보와 자식 존재 여부 판정; 함수: {defined()}
                THREE — 선택적 박스 도우미 생성; 생성자: {new Box3Helper()}
                TILES_TYPE — URI 확장자 기반 타일 종류 설정; 상수: {B3DM, JSON, I3DM, CMPT, PNTS, GLB, BOUND}
                U3DTileset — 콘텐츠 URI, 레벨, 바운딩 정보와 자식 계층 변경; 속성 읽기·쓰기: {content.uri, type, level, parent, boundingVolume, children}
            동작:
                콘텐츠 URI로 타일 종류를 추정하고 부모 레벨 다음 값으로 누락 레벨을 채우며 콘텐츠가 없으면 BOUND로 설정한다.
                region, sphere 또는 box의 geographicBox를 렌더 박스로 바꾸고 선택적으로 도우미를 만들어 타일에 연결한다.
                같은 분류와 박스 구성을 모든 자식에 재귀 적용한다.

        #addUserBox(tile: U3DTileset, box: UBox3, boxHelper?: THREE.Box3Helper) -> void
            의존:
                defined — 도우미와 geometry 존재 여부 판정; 함수: {defined()}
                THREE — 월드 구 생성·계산, 장면 등록과 미사용 geometry 해제; 생성자: {new Sphere()}; 함수: {Box3.getBoundingSphere(), Scene.add(), BufferGeometry.dispose()}
                U3DTileset — 사용자 박스·도우미와 월드 바운딩 저장; 속성 쓰기: {userData.box, userData.boxHelper, worldBox, worldSphere}
            동작: 박스를 타일의 사용자·월드 박스로 저장하고 월드 구를 계산한다. usebox가 켜져 있으면 도우미를 앱 장면에 등록하고, 꺼져 있으면 전달된 도우미 geometry를 해제한다.

        async #disposeMaterial(material: THREE.Material | Array<THREE.Material>) -> Promise<void>
            처리 기준: Yield()가 실제 다음 렌더 프레임으로 실행을 넘긴다는 보장은 없으며 호출자인 deleteMesh()는 이 Promise를 기다리지 않는다. [확인 Q-007]
            의존:
                defined — material.map 존재 여부 판정; 함수: {defined()}
                Yield — texture 해제 전 실행 양보; 함수: {Yield()}
                Web API — ImageBitmap 종류 판정과 CPU 이미지 닫기; 생성자: {ImageBitmap}; 함수: {ImageBitmap.close()}
                THREE — texture와 material GPU 자원 해제; 함수: {Texture.dispose(), Material.dispose()}
            동작: 재질 배열은 재귀 순회하고, 단일 재질은 한 번 실행을 양보한 뒤 map의 ImageBitmap과 texture를 해제하고 map 참조를 지운 다음 재질을 해제한다.

        #computeRectangle() -> void
            의존:
                defined — 레이어 geographic bounding box 존재 여부 판정; 함수: {defined()}
                Console API — bounding box 누락 오류 기록; 함수: {console.error()}
                UDrawArg — geographic 최소·최대점을 Google 렌더 좌표로 변환; 함수: {_drawArg.getGeographicToGoogle()}
                UMathEngine — geographic rectangle 생성; 정적 함수: {createUGeoRect()}
                UDEF — rectangle 좌표계 식별; 상수: {GOOGLE}
                THREE — 렌더 바운딩 박스 최소·최대점 설정; 생성자: {new Vector3()}; 함수: {Box3.set()}
            동작: _boundingBox의 각 축 최소·최대 순서를 정규화하고 geographic rectangle과 같은 참조의 rectangle3d를 만든 뒤 렌더 좌표 _box3를 갱신한다.

    내부 다운로드와 형식 분기
        #processQueue(info: ModelTileContentQueueInfo, slotDone: DeferredObject<U3DTileset>) -> Promise<U3DTileset>
            인터페이스: slotDone은 다운로드 WorkProcess의 슬롯 반납 시점을 알리는 Deferred이며 반환 Promise보다 먼저 완료될 수 있다.
            처리 기준:
                JSON과 알려진 binary magic만 처리하며 인식하지 못한 magic은 즉시 실패시킨다.
                JSON 해석·tileset 확장·형식 판별 중 예외는 현재 타일 실패로 변환해 Promise를 완료한다.
                slotDone은 파서 완료를 기다리지 않는다. 네트워크 완료·실패와 사전 폐기 경로에서는 반환 Promise와 같은 방식으로 settle하고, 파서 경로에서는 파서 작업 등록 직후 resolve한다.
            의존:
                deferred — 다운로드·파싱 연결 Promise 생성; 함수: {deferred()}
                UFileLoader — 저장된 최종 requestUrl의 ArrayBuffer 요청; 함수: {_loader.load()}
                Web API — UTF-8 magic·JSON 텍스트 해석; 생성자: {new TextDecoder()}
                U3DTileset — 외부 tileset JSON을 현재 계층에 확장; 함수: {_rootTileSet.extendTileset()}; 속성 읽기·쓰기: {complete, failMsg}
                UDEF — 다운로드·파싱·초기 상태 변경; 상수: {TILES_STATE._NONE, TILES_STATE._DOWNLOADING, TILES_STATE._PARSING}
                TILES_TYPE — 콘텐츠 magic 분기; 상수: {B3DM, I3DM, CMPT, PNTS, VCTR, GLB, GLTF}
            동작:
                요청 전에 타일별 상태의 명시적 취소·완료·dispose·Map identity를 검사하고 통과하지 못하면 반환 Promise와 slotDone을 함께 실패시킨다. 통과하면 phase와 다운로드 시작 상태를 갱신한다.
                로드 callback에서 타일별 상태 유효성·빈 응답·타일 상태를 재검사하고 JSON은 계층으로 확장하며, 이 경로들과 네트워크 오류 callback은 반환 Promise와 slotDone을 같은 방식으로 완료한다.
                바이너리는 PARSING 상태로 바꾸고 magic별 파서를 파서 작업 큐에 전달한 직후 slotDone만 resolve하여 다운로드 슬롯을 반납한다. 반환 Promise는 파서 완료를 따라 완료된다.
                카메라 updateId 변경만으로 네트워크 abort 또는 callback 제거를 수행하지 않는다.

        #redefineMesh(mesh: THREE.Mesh, result: B3DMParseResult) -> THREE.Mesh
            처리 기준: 다중 재질 분기에서 배열 원소 대신 material.length 숫자를 material로 사용한다. [확인 Q-001]
            의존:
                defined — 메시·배치 테이블·geometry·재질 속성 존재 여부 판정; 함수: {defined()}
                UDEF — 전제조건 검증과 texture 품질·태양광 재질 조정; 함수: {assert(), setTextureImprovement(), noResizeTexture(), getUseSunFlare()}; 상수: {IMPROVE_TEXTURE_LEVEL.none}
                U3dApp — 후처리·개선 수준·renderer 조회; 함수: {_app.isPostProcess(), getImproveValue()}; 속성 읽기: {_app._renderer}
                THREE — 노멀 생성과 재질 색·투명도 변경; 함수: {BufferGeometry.getAttribute(), computeVertexNormals(), Color.setRGB()}
                U3dLayer — 레이어 이름과 투명도 사용; 함수: {getName()}; 속성 읽기: {_opacity}
            동작: 배치 테이블과 레이어 이름을 메시로 연결하고 필요하면 노멀·texture 품질·광원 재질·투명도를 조정한 뒤 메시를 반환한다.

        #defineBatchGroup() -> Promise<object> | undefined
            의존:
                defined — 배치 그룹 경로 존재 여부 판정; 함수: {defined()}
                deferred — JSON 로드 결과 Promise 생성; 함수: {deferred()}
                UFileLoader — batchGroup JSON 로드; 생성자: {new UFileLoader()}; 함수: {setResponseType(), load()}
            동작: batchGroupPath가 없으면 undefined를 반환한다. 경로에 http 또는 https가 포함되면 그대로 사용하고, 아니면 base URL·proxy URL에 결합하여 JSON을 비동기로 읽는 Promise를 반환한다.

    내부 좌표 변환과 배치 후처리
        #calcPosition(object: THREE.Object3D, tile: U3DTileset, info: ParserInfo, callback?: function) -> Promise<void>
            처리 기준: rtcCenter, 타일 transform 또는 worldBox 중심 중 어느 경로로도 중심을 얻지 못하면 실패한다.
            의존:
                deferred — 좌표 반영 완료 Promise 생성; 함수: {deferred()}
                defined — 중심·변환·월드 박스·도우미 존재 여부 판정; 함수: {defined()}
                Coordinates — EPSG:4326·4978 좌표 변환; 정적 함수: {transformPoint()}
                UDrawArg — 월드·지리·Google 좌표 변환; 함수: {_drawArg.getWorldToGeographic(), getGeographicToGoogle()}
                THREE — 중심·로컬 박스·레이어 회전 생성; 생성자: {new Vector3(), new Box3(), new Quaternion(), new Euler()}; 함수: {Box3.getCenter(), Quaternion.setFromEuler()}
                UGroup — 디버그 박스 도우미 등록; 함수: {_groupComment.add()}
                TILES_TYPE — 형식별 위치 보정 분기; 상수: {B3DM, I3DM, CMPT, PNTS, GLB}
            동작:
                rtcCenter가 없으면 타일 계층의 transform 보유 여부를 판정하고, 있으면 결합 행렬의 translation 성분을 중심으로 사용한다. transform도 없으면 worldBox 중심을 EPSG:4978로 변환한다.
                콘텐츠 중심을 지리·Google·EPSG:4978 좌표로 저장하고 메시 계층의 로컬 박스와 회전을 계산한다.
                콘텐츠 종류에 맞는 위치 보정을 수행하고 완료 Promise를 반환한다.

        #computeTransform(info: ParserInfo) -> THREE.Matrix4
            의존:
                defined — 타일과 원본 타일의 transform 존재 여부 판정; 함수: {defined()}
                THREE — transform 복사와 조상 행렬 선행 결합; 생성자: {new Matrix4()}; 함수: {Matrix4.copy(), multiply()}
            동작: 현재 타일 또는 원본 타일의 transform을 시작 행렬로 삼고 없으면 단위행렬을 사용한다. 조상 타일을 재귀 순회하며 각 조상의 transform을 부모 우선 순서로 앞곱한 최종 행렬을 반환한다.

        #calcTraverse(object: THREE.Object3D, result: CalcPositionInfo, quaternion: THREE.Quaternion) -> void
            의존:
                Coordinates — 노드 translation을 EPSG:4326으로 변환; 정적 함수: {transformPoint()}
                UDrawArg — 지리 좌표를 Google 렌더 좌표로 변환; 함수: {_drawArg.getGeographicToGoogle()}
                THREE — 메시 판정, 위치·박스·quaternion 누적; 생성자: {Mesh}; 함수: {Box3.expandByPoint(), Quaternion.clone(), multiply(), set(), copy()}
            동작:
                노드 translation과 rotation 존재 여부를 반영하고 메시에는 원본·레이어 quaternion을 저장한다.
                calcPosition이 전달한 callback을 각 방문 객체에서 실행하고 그룹 자식을 quaternion 누적값으로 재귀 순회한다.

        #calcScale(object: THREE.Object3D, tile: U3DTileset, center: THREE.Vector3, geoCenter: THREE.Vector3) -> void
            의존:
                UMathEngine — 위도별 기본 스케일과 Google 점 간 meter 거리 계산; 정적 함수: {getRealScaleAtGeographic(), getMeterDistanceByGooglePoints()}
                U3DTileset — 타일별 바운딩 정보 캐시 사용; 속성 읽기·쓰기: {boundInfo}
            동작: boundInfo가 없으면 자신 또는 가까운 BOUND 조상 기준의 바운딩 정보를 만들어 캐시한다. 지리 위도 기본 스케일과 해당 바운딩 중심의 축별 meter 비율로 object scale을 보정한다.

        #getAddBoundCenter(tile: U3DTileset) -> object | false
            인터페이스: 반환 객체는 기준 타일의 월드 구 중심(center), 지리 중심(gCenter), 반지름(radius)과 기준 타일(parent)을 담는다.
            의존:
                U3DTileset — 루트 경계 판정과 기준 타일의 바운딩 정보 조회; 생성자: {U3DTileset}; 속성 읽기: {type, parent, worldBox, worldSphere, boundingVolume}
            동작:
                자신이 bound 종류이면 자신을, 아니면 부모를 따라 올라가 첫 bound 종류 조상 또는 루트 직전 조상을 기준 타일로 정한다.
                기준 타일의 월드 박스가 없거나 boundingVolume에 box·region이 모두 없으면 false를 반환한다.
                box는 저장된 지리 중심을, region은 EPSG:4978 중심을 지리 좌표로 변환한 값을 gCenter로 사용해 바운딩 정보를 구성한다.

        #calcQuaternion(object: THREE.Object3D, calcInfo: CalcPositionInfo, parentQuaternion: THREE.Quaternion) -> void
            의존:
                THREE — 상향축·지리 위치·부모 회전을 합친 quaternion 생성; 생성자: {new Euler(), new Quaternion()}; 함수: {Quaternion.setFromEuler(), multiply(), copy()}
            동작: 중심 편집 여부와 glTF up-axis에 따라 회전 Euler를 구성하고 부모 quaternion과 결합해 메시 quaternion에 복사한다.

        #changeB3DMPosition(object: THREE.Object3D, info: ParserInfo) -> void
            의존:
                defined — 자동 지형 높이 결과 존재 여부 판정; 함수: {defined()}
                THREE — translation 사용 시 로컬 중심과 자식 위치 계산, 최종 위치 복제; 생성자: {new Vector3()}; 함수: {Box3.getCenter(), Object3D.traverse(), Vector3.subVectors(), clone()}
                UDrawArg — 콘텐츠 중심점의 렌더 지형 높이 조회; 함수: {_drawArg.getRenderHeightAtPoint()}
                UDEF — 무효 지형 높이 식별; 상수: {INVALID, TERRAIN_NO_DATA}
            동작: B3DM 스케일을 보정하고 translation 기반 콘텐츠이면 로컬 중심에 맞춰 자식 위치를 재배치한다. 계산 중심과 자동 지형 높이·높이 오프셋으로 루트 위치와 tile.world를 갱신한다.

        #changeI3DMPosition(object: THREE.Object3D, info: ParserInfo) -> void
            의존:
                defined — 자동 지형 높이 결과 존재 여부 판정; 함수: {defined()}
                UDrawArg — 콘텐츠 중심점의 렌더 지형 높이 조회; 함수: {_drawArg.getRenderHeightAtPoint()}
                UDEF — 무효 지형 높이 식별; 상수: {INVALID, TERRAIN_NO_DATA}
                THREE — 최종 위치 복제; 함수: {Vector3.clone()}
            동작: I3DM을 계산 중심의 X·Y와 기존 또는 자동 지형 높이·높이 오프셋에 배치하고 tile.world를 갱신한다.

        #changeCMPTPosition(object: THREE.Object3D, info: ParserInfo, editCenter: boolean) -> void
            의존: TILES_TYPE — 합성 타일 내부 콘텐츠 종류 분기; 상수: {B3DM, I3DM, PNTS}
            동작: CMPT의 각 내부 콘텐츠 형식에 맞는 위치 보정을 실행한다.

        #changePNTSPosition(object: THREE.Object3D, info: ParserInfo) -> void
            의존:
                defined — 자동 지형 높이 결과 존재 여부 판정; 함수: {defined()}
                UDrawArg — 콘텐츠 중심점의 렌더 지형 높이 조회; 함수: {_drawArg.getRenderHeightAtPoint()}
                UDEF — 무효 지형 높이 식별; 상수: {INVALID, TERRAIN_NO_DATA}
                UMathEngine — 지리 위도의 Google 렌더 스케일 계산; 정적 함수: {getRealScaleAtGeographic()}
                THREE — 최종 위치 복제; 함수: {Vector3.clone()}
            동작: PNTS를 계산 중심과 자동 지형 높이·높이 오프셋에 배치하고 위도별 렌더 스케일을 적용한 뒤 tile.world를 갱신한다.

    내부 형식별 파싱
        #parseCMPT(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준: 취소 뒤 적용하지 않은 복합 파서 결과의 즉시 자원 해제 소유권은 정의되어 있지 않다. [확인 Q-012]
            의존:
                deferred — 파싱 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument, parser와 결과 타일 존재 여부 판정; 함수: {defined()}
                UCmptParser — 합성 타일 파싱; 생성자: {new UCmptParser()}; 함수: {parse()}
                TILES_TYPE — 내부 콘텐츠와 완료 타일 종류 분기; 상수: {B3DM, I3DM, PNTS, CMPT}
            동작:
                실행 전 요청 상태·draw argument·타일 처분을 검사한다.
                parser 완료 callback에서 요청 상태를 다시 검사한 뒤 내부 타일별 후처리를 실행하고 CMPT 타일로 완료한다.

        #parseI3DM(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준: 취소 뒤 적용하지 않은 인스턴스 파서 결과의 즉시 자원 해제 소유권은 정의되어 있지 않다. [확인 Q-012]
            의존:
                deferred — 파싱 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument와 parser 존재 여부 판정; 함수: {defined()}
                UI3dmParser — 인스턴스 타일 파싱; 생성자: {new UI3dmParser()}; 함수: {parse()}
            동작:
                실행 전 요청 상태·draw argument·타일 처분을 검사한다.
                parser 완료 callback에서 요청 상태를 다시 검사한 뒤 I3DM 결과를 후처리한다.

        #parsePNTS(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준: 취소 뒤 적용하지 않은 포인트 파서 결과의 즉시 자원 해제 소유권은 정의되어 있지 않다. [확인 Q-012]
            의존:
                deferred — 파싱 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument와 parser 존재 여부 판정; 함수: {defined()}
                UPntsParser — 점군 타일 파싱; 생성자: {new UPntsParser()}; 함수: {parse()}
                Coordinates — region 중심의 EPSG:4978 좌표를 EPSG:4326으로 변환; 정적 함수: {transformPoint()}
                THREE — 로컬·월드 변환 행렬 분해와 region 회전 보정; 생성자: {new Vector3(), new Quaternion()}; 함수: {Matrix4.premultiply(), decompose()}
            동작:
                실행 전 요청 상태·draw argument·타일 처분을 검사한다.
                parser 완료 callback에서 처분·요청 상태를 재검사한다. 월드 변환이 있으면 point 행렬을 선행 곱해 분해하고, 아니면 region의 EPSG:4978 중심을 지리 좌표로 바꿔 회전을 보정한 뒤 후처리한다.

        #parseVCTR(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            의존:
                deferred — 기본 VCTR 처리 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument 존재 여부 판정; 함수: {defined()}
            동작: 타일별 요청 상태와 draw argument만 검사하고 콘텐츠 해석 없이 타일로 완료한다.

        #parseB3DM(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준: 취소 뒤 적용하지 않은 배치 모델 파서 결과의 즉시 자원 해제 소유권은 정의되어 있지 않다. [확인 Q-012]
            의존:
                deferred — 파싱 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument와 parser 존재 여부 판정; 함수: {defined()}
                UB3dmParser — Batched 3D Model 파싱; 생성자: {new UB3dmParser()}; 함수: {setDracoDecodePath(), setWorkerLimit(), parse()}
                UDEF — Draco decoder 경로 제공; 상수: {DRACO_DECODER_PATH}
            동작:
                실행 전 요청 상태·draw argument·타일 처분을 검사한다.
                parser 완료 callback에서 처분·요청 상태를 다시 검사하고 B3DM 결과를 후처리한다.

        #parseGLB(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준: 취소 뒤 적용하지 않은 GLB 로더 결과의 즉시 자원 해제 소유권은 정의되어 있지 않다. [확인 Q-012]
            의존:
                deferred — 파싱 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument·앱·loader 존재 여부 판정; 함수: {defined()}
                UGLTFLoader — GLB 파싱과 Draco·KTX2 decoder 설정; 생성자: {new UGLTFLoader()}; 함수: {setDracoDecodePath(), setWorkerLimit(), parse()}
                KTX2Loader — transcoder 경로와 renderer 지원 설정; 함수: {isSetPath(), setTranscoderPath(), isSupported(), detectSupport()}
                UDEF — decoder·transcoder 경로 제공; 상수: {DRACO_DECODER_PATH, TRANS_CODER_PATH}
                U3dApp — KTX2 지원 판정용 renderer 조회; 함수: {_app.getRenderer()}
                THREE — 기존 GLB 재질 해제와 렌더 속성 조정; 함수: {Object3D.traverse(), Material.dispose()}
                TILES_TYPE — 결과 형식 지정; 상수: {GLB}
            동작:
                실행 전 요청 상태·draw argument·타일 처분을 검사한다.
                loader 완료 callback에서 기존 재질을 정리하고 처분·요청 상태를 재검사한 뒤 GLB 결과를 후처리한다.

    내부 파싱 결과 연결
        #afterParseB3DM(result: B3DMParseResult, info: ParserInfo) -> void
            의존:
                defined — scene·배치 정보·refine·그룹 설정 존재 여부 판정; 함수: {defined()}
                U3dMessage — scene 누락 오류 기록; 정적 함수: {error()}
                THREE — 순회 callback의 메시 판정; 생성자: {Mesh}
                U3DTilesMesh — BIM 레벨·목록 설정; 함수: {setBIMLevelLengthList(), setMakeLevel()}
                TILES_TYPE — 타일 형식 지정; 상수: {B3DM}
            동작:
                scene에 배치 테이블·형식 정보를 연결하고 타일 메시 목록을 준비한 뒤 위치 계산을 시작한다.
                위치 계산의 순회 callback에서 렌더 순서, URL, BIM 그룹 정보, 레벨과 tileset 참조를 메시마다 연결하고 재질을 보정한다.
                타일 형식·기본 refine·바이트 크기를 저장하고 옵션에 따라 레벨 그룹을 구성하거나 해제한다.

        #afterParseI3DM(result: I3DMParseResult, info: ParserInfo) -> void
            의존:
                defined — 배치 정보·형식·refine 존재 여부 판정; 함수: {defined()}
                TILES_TYPE — 타일 형식 지정; 상수: {I3DM}
            동작: scene의 배치 정보와 렌더 순서를 설정하고 위치 계산 후 메시·단위 메시 목록, 기본 refine와 바이트 크기를 타일에 저장한다.

        #afterParsePNTS(result: PNTSParseResult, info: ParserInfo) -> void
            의존:
                defined — point·배치 정보·형식·refine 존재 여부 판정; 함수: {defined()}
                U3dMessage — point 누락 오류 기록; 정적 함수: {error()}
                THREE — 순회 callback의 점 객체 판정; 생성자: {Points}
                TILES_TYPE — 타일 형식 지정; 상수: {PNTS}
            동작:
                point의 배치·형식 정보를 연결하고 위치 계산을 시작한다.
                위치 계산의 순회 callback에서 렌더 순서, URL과 tileset 참조를 단위 점 객체에 연결한다.
                타일 형식·기본 refine·메시 목록과 바이트 크기를 저장한다.

        #afterParseGLB(result: GLBParseResult, info: ParserInfo) -> void
            의존:
                defined — scene·배치 정보·형식·refine 존재 여부 판정; 함수: {defined()}
                U3dMessage — scene 누락 오류 기록; 정적 함수: {error()}
                THREE — 순회 callback의 메시 판정; 생성자: {Mesh}
                TILES_TYPE — 타일 형식 지정; 상수: {GLB}
            동작:
                scene의 배치·형식 정보를 연결하고 위치 계산을 시작한다.
                위치 계산의 순회 callback에서 렌더 순서, URL과 tileset 참조를 단위 메시로 연결한다.
                타일 형식·기본 refine·메시 목록과 바이트 크기를 저장한다.

        #setBatchLevelGroup(parent: UGroup, level: number) -> boolean
            의존:
                defined — 부모·자식·메시 레벨 정보 존재 여부 판정; 함수: {defined()}
                UGroup — 이름 접두사별 부모 그룹 생성과 재배치; 생성자: {new UGroup()}; 함수: {add()}
                U3DTilesMesh — 메시별 레벨 길이 설정과 make level 전달; 함수: {setBIMLevelLengthList(), setMakeLevel()}
                String extension — 대소문자 무시 그룹 이름 비교; 함수: {equalIgnoreCase()}
            동작:
                지정 레벨의 이름 길이 또는 특수 구분자로 자식 그룹 이름을 자른다.
                각 그룹의 mesh callback에서 메시별 레벨 길이를 갱신하고 현재 make level을 전달하며, 같은 접두사의 기존 또는 새 부모 그룹 아래 원래 그룹을 재배치한다.

        #setUnGroup(group: UGroup) -> void
            의존:
                defined — 그룹과 자식 존재 여부 판정; 함수: {defined()}
                UGroup — 중첩 그룹 판정; 생성자: {UGroup}
            동작: 바로 아래 UGroup의 메시를 꺼내 부모의 직접 children 배열로 평탄화하고 메시 이름을 기존 그룹 이름으로 바꾼다.

        #getReplaceTile(tile: U3DTileset) -> U3DTileset
            의존: U3DTileset — JSON 교체 연결 조회; 속성 읽기: {replaceTile}
            동작: replaceTile 연결을 끝까지 따라가 최종 콘텐츠 타일을 반환한다.

    내부 진단
        __$testTileContentRequestLifecycle() -> boolean
            처리 기준: 실제 레이어의 타일·캐시·로더 상태를 변경하지 않고 격리된 가짜 상태를 사용한다.
            동작: 격리 객체에서 _adoptTileContentRequest와 _cancelTileContentRequest를 실행하여 같은 요청 상태의 새 updateId 승계, 공유 Promise 유지, 다운로드·파서 파라미터 갱신, 최종 requestUrl abort, work 비활성화, Promise 실패와 Map identity 정리를 검사한다.

        __$testTileContentSlotRelease() -> boolean
            처리 기준:
                #processQueue() 접근을 위해 실제 생성된 인스턴스에 bind되어 실행되어야 한다.
                레이어의 로더와 addParserQueue를 가짜 구현으로 잠시 교체한 뒤 종료 전에 복원하며 실제 네트워크 요청과 WorkProcess 큐 작업을 만들지 않는다.
            의존:
                deferred — 관찰용 슬롯·파서 Deferred 생성; 함수: {deferred()}
                UDEF — 가짜 타일의 다운로드·파싱 상태 구성; 상수: {TILES_STATE._DOWNLOADING, TILES_STATE._PARSING}
                TILES_TYPE — 파서 경로 유도용 magic 버퍼 구성; 상수: {B3DM}
                Web API — magic 버퍼 인코딩; 생성자: {new TextEncoder()}
            동작:
                파서 등록 관찰을 위해 addParserQueue를 관찰용 Deferred를 반환하는 가짜 구현으로 잠시 바꾸었다가 종료 시 복원한다.
                사전 폐기와 네트워크 실패 경로에서 반환 Promise와 슬롯 반납 Deferred가 함께 실패하고, 파서 경로에서는 파서 등록 직후 슬롯만 먼저 반납되며 반환 Promise가 파서 완료를 기다리는지 검사한다.

        __$testGroupCheck(showLog: boolean = false) -> boolean
            인터페이스: showLog는 현재 구현에서 사용하지 않는다.
            처리 기준: 현재 소스와 검사한 사용처에서는 이 진단 메서드를 호출하는 활성 경로를 찾지 못했다.
            의존:
                UGroup — 레이어 장면 그룹 계층 조회; 속성 읽기: {_group.children}
                U3DTilesMesh — 렌더 메시 종류와 연결 tileset 판정; 생성자: {U3DTilesMesh}; 속성 읽기: {_tileset}
                Host global __GError__ — 그룹·메시·타일 상태 위반 기록; 함수: {__GError__()}
            동작: 현재 그룹 계층의 visible, U3DTilesMesh 종류, 연결 tileset, 처분 상태와 부모 타일 표시 적합성을 검사해 전체 통과 여부를 반환한다.

ModelTileContentRequestPhase 타입 정의
    "queued" | "downloading" | "parser-queued" | "parsing"
        타일 콘텐츠 작업의 WorkProcess 대기·다운로드·파서 대기·파싱 단계를 구분한다.

ModelTileContentRequestState 타입 정의
    tileId: string
    tile: U3DTileset
    sourceUrl: string
    requestUrl: string
    updateId: string | number
    callbackId: string
    promise: Promise<U3DTileset>
    phase: ModelTileContentRequestPhase
    cancelled: boolean
    settled: boolean
    networkStarted: boolean
    networkCompleted: boolean
    work?: U3dQuadTileWork
    queueInfo?: ModelTileContentQueueInfo
    parserItem?: ModelTileParserQueueItem
        한 타일의 다운로드부터 파싱 완료까지를 여러 탐색 세대가 공유하기 위한 내부 상태다.

ModelTileContentQueueInfo 타입 정의
    url: string
    tile: U3DTileset
    updateId: string | number
    requestState: ModelTileContentRequestState
        다운로드 WorkProcess와 #processQueue()가 공유하는 변경 가능한 파라미터다.

ModelTileParserQueueItem 타입 정의
    buf: ArrayBuffer
    info: ModelTileContentQueueInfo
    tile: U3DTileset
    updateId: string | number
    requestState: ModelTileContentRequestState
        다운로드 결과와 같은 요청 상태를 형식별 파서 WorkProcess에 전달한다.

viewSizeOffsetFunction 함수 타입 정의
    (tile: import('@U3DTileset').U3DTileset) -> number
        타일별 screen-space error 보정 배수를 반환한다.

TileCheckContext 타입 정의
    updateId: string | number
    campos: THREE.Vector3
    frustum: UFrustum
    drawBufferHeight: number
    cameraDenominator: number
    viewSizeOffset: number | viewSizeOffsetFunction
    isViewSizeOffsetFunction: boolean
    maximumScreenSpaceError: number
    maximumScreenSpaceErrorThird: number
        한 탐색 주기 동안 재귀 타일 판정이 공유하는 카메라·SSE 스냅샷이며 해당 update 주기 안에서만 유효하다.

U3dModelTilesLayerCO extends U3dModelLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        baseurl: string
            tileset JSON 또는 콘텐츠의 기준 URL
        name: string
            레이어 이름
        apikey?: string
            요청 URL에 결합할 API 키
        usebox?: boolean
            타일 bounding box 도우미 표시 여부
        proxyurl?: string
            useproxy가 true일 때 사용할 프록시 URL
        useproxy?: boolean = false
            프록시 사용 여부
        rotation?: DegreeEulerLike
            degree 단위 레이어 추가 회전
        heightOffset?: number
            meter 단위 레이어 추가 높이
        maximumScreenSpaceError?: number = 32
            타일 세분화 허용 화면 공간 오차
        viewSizeOffset?: number | viewSizeOffsetFunction
            SSE 판정 보정 배수 또는 타일별 계산 함수
        renderOrder?: number
            메시 렌더 순서
        cacheSize?: number
            타일 메시 LRU 캐시 제한
        updateCycleTime?: number
            타일 탐색 갱신 주기
        autoHeight?: boolean
            레이어 중심의 지형 높이 자동 적용 여부
        batchGroupPath?: string
            batchGroup JSON 경로
        setLevelGroup?: boolean
            BIM 배치 그룹을 레벨별로 재구성할지 여부
        type?: string = "3dtiles"
            서버 등록 레이어 형식
        makeLevel?: number = 0
            BIM 검색에 포함할 최대 그룹 레벨
        BIMLevelLengthList?: Array | object
            BIM 그룹 이름의 레벨별 길이 기준
```

## 4. 공통 처리 기준과 제약

```spec
initialize()와 update() 실행 전에는 setApp()으로 앱, 장면과 draw argument가 연결되어야 한다.
타일 탐색의 한 updateId 안에서는 #createCheckContext()로 만든 카메라·프러스텀·SSE 문맥을 재귀 탐색 전체가 공유한다.
탐색 callback은 updateId로 이전 세대의 장면 연결을 차단하지만, 같은 타일 ID와 sourceUrl의 다운로드·파싱은 _activeTileContentRequests의 기존 상태를 새 세대가 이어받는다.
아직 WorkProcess 큐에 있는 작업은 최신 세대가 이어받지 않았을 때 제거하고, 시작된 다운로드는 updateId 변경만으로 abort하지 않는다.
disposeTile(), removeAllTiles(), clear(), refresh()와 dispose()에서 타일이 실제로 불필요해진 경우에만 저장된 최종 requestUrl로 네트워크 취소를 전달한다.
동일 URL의 메시 자원은 _cacheTiles에서 공유되며 캐시 보유 여부에 따라 disposeTile()이 참조 해제 또는 완전 삭제를 선택한다.
ADD refine은 완료된 타일을 독립적으로 표시하고 REPLACE refine은 같은 부모의 대상 타일 완료를 모아 교체한다.
VCTR 본문 파싱은 기본 클래스의 책임 밖이며 하위 U3dVectorTileLayer가 addParserQueue()를 재정의해 처리한다.
위치 계산은 EPSG:4978, EPSG:4326과 Google 렌더 좌표 변환 지원을 전제로 한다.
배치 그룹 레벨 재구성은 메시와 그룹에 getBIMLevelLengthList(), setBIMLevelLengthList()와 setMakeLevel()이 제공된 상태를 전제로 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
