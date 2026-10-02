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

    _dataCache: LRUCache
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

    _bimLevelLengthList: Record<number, number> | Array<number> | undefined
        BIM 레벨별 그룹 이름 길이 기준

    static OPT_KEYS: Array<string>
        부모 옵션 키에 타일 주소·요청·표시·BIM 설정의 정본 키를 추가한다.
        의존: U3dModelLayer — 상속 옵션 키; 속성 읽기: {OPT_KEYS}

    _dataCacheSize: number
        콘텐츠 캐시의 최대 항목 수이며 생성자에서 cacheSize의 기본값 500을 적용한다.

    constructor(opt: U3dModelTilesLayerCO)
        역할: 모델 타일 탐색·로딩·파싱·캐시 상태와 좌표 변환 전제조건을 초기화한다.

        처리 기준:
            cacheSize는 생략하면 500, updateCycleTime은 생략하면 200, maximumScreenSpaceError는 생략하면 32을 사용한다.
            makeLevel을 생략하면 BIM 레벨 기준 수에서 1을 뺀 값을 사용하며 명시한 0도 getMakeLevel()에서 같은 자동 계산 경로로 처리한다. [확인 Q-005]
            bimLevelLengthList가 정의되지 않았으면 등록 형식과 관계없이 getBIMLevelLengthList()가 {0:4, 1:4, 2:6, 3:9, 4:20}인 새 객체를 반환한다. 기본 분류표 자체를 필드에 저장하지는 않는다.
            defaultValue는 undefined만 기본값으로 바꾸므로 null·false·0은 별도로 걸러내지 않는다. rotation과 heightOffset의 || 기본값은 falsy 입력을 영 회전과 0으로 대체한다.
            normalizeOptionKeys는 소문자·기존 BIMLevelLengthList 입력을 정본 키로 연결하고 원본 키를 보존한다. 정본 키와 별칭을 함께 주면 순회한 비정본 별칭의 마지막 값이 정본 값을 덮어쓴다.
            전역 proj4가 없거나 geocent 투영을 지원하지 않으면 오류를 기록하고, EPSG:4978 정의가 없으면 등록한다.

        의존:
            normalizeOptionKeys — 생성 옵션 키 호환 변환; 함수: {normalizeOptionKeys()}
            U3dModelLayer — 기반 모델 레이어 초기화; 함수: {constructor()}
            defaultValue — 선택 옵션과 기본값 결합; 함수: {defaultValue()}
            defined — 옵션과 좌표계 정의 존재 여부 판정; 함수: {defined()}
            UGroup — 바운딩 도우미 그룹 생성; 생성자: {new UGroup()}
            THREE — 박스·구 생성; 생성자: {new Box3(), new Sphere()}
            UCheckTime — 갱신 주기 검사기 생성; 생성자: {new UCheckTime()}
            Guid — 최초 작업 식별자 생성; 함수: {Guid()}
            LRUCache — 콘텐츠 캐시 생성; 생성자: {new LRUCache()}
            UFileLoader — arraybuffer 로더 생성과 응답 형식 설정; 생성자: {new UFileLoader()}; 함수: {setResponseType()}; 속성 쓰기: {crossOrigin}
            U3dMessage — proj4와 geocent 지원 오류 기록; 정적 함수: {error()}; 상수: {CNT.TILES.NON_PROJ4_PROJECTION_GEOCENT, CNT.TILES.NON_PROJ4}
            Web API — UTF-8 디코더 생성; 생성자: {new TextDecoder()}
            Host global __GEONDT__ — proj4 투영과 EPSG:4978 정의 조회·등록; 속성 읽기: {proj4.Proj.projections}; 함수: {proj4.defs()}

        동작:
            new.target의 OPT_KEYS로 입력을 정규화한 결과를 부모 생성자에 전달한 뒤 URL, 프록시, 바운딩 도우미, 자동 높이와 BIM 옵션을 저장한다. useProxy가 false일 때만 proxyUrl을 빈 문자열로 만든다.
            BIM 레벨 목록으로 기본 makeLevel을 계산하고 viewSizeOffset 입력을 정규화한다.
            카메라 이전·현재 위치, 회전, 높이, 작업 식별자와 파서 지연 생성 상태를 준비한다.
            제한 캐시와 공용 arraybuffer 로더를 생성한다.
            proj4의 geocent 투영과 EPSG:4978 정의를 확인한다.

    get _basename() -> string | undefined
        동작: _baseName의 저장값을 그대로 반환한다.

    set _basename(value: string | undefined) -> void
        동작: _baseName에 입력값을 그대로 저장한다.

    get _apikey() -> string
        동작: _apiKey의 저장값을 그대로 반환한다.

    set _apikey(value: string) -> void
        동작: _apiKey에 입력값을 그대로 저장한다.

    get _proxyurl() -> string
        동작: _proxyUrl의 저장값을 그대로 반환한다.

    set _proxyurl(value: string) -> void
        동작: _proxyUrl에 입력값을 그대로 저장한다.

    get _useproxy() -> boolean
        동작: _useProxy의 저장값을 그대로 반환한다.

    set _useproxy(value: boolean) -> void
        동작: _useProxy에 입력값을 그대로 저장한다.

    get _BIMLevelLengthList() -> Record<number, number> | Array<number> | undefined
        동작: _bimLevelLengthList의 저장값을 그대로 반환한다.

    set _BIMLevelLengthList(value: Record<number, number> | Array<number> | undefined) -> void
        동작: _bimLevelLengthList에 입력값을 그대로 저장한다.

    투명도와 갱신 상태 책임 그룹
        역할: 로드된 모델의 표현과 타일 탐색 실행 여부를 제어한다.

        override setOpacity(val: number) -> void
            처리 기준: 루트 tileset이 없으면 캐시 메시에도 불투명도를 적용하지 않고 종료한다.
            의존: U3dLayer — 기본 불투명도 저장; 함수: {prototype.setOpacity.call()}
            동작:
                U3dLayer.setOpacity를 현재 레이어로 직접 호출하여 기본 설정을 먼저 저장한다.
        setStopUpdate(stop: boolean = false) -> void
            동작: #stopUpdate에 입력값을 저장한다.

        isStopUpdate() -> boolean
            동작: #stopUpdate를 반환한다.

        isStateChange(curPosition: THREE.Vector3 = this._drawArg.getCameraPosition(), force?: boolean) -> boolean
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                UDrawArg — 생략한 현재 위치 조회; 함수: {_drawArg.getCameraPosition()}
        override update(drawArg: UDrawArg, curTime?: number, force: boolean = false) -> void
            인터페이스: drawArg과 curTime은 현재 구현에서 사용하지 않고 연결된 _drawArg를 조회한다. viewSizeOffset이 함수이면 현재 레이어를 this로 하고 루트 tileset을 인수로 호출한다.

            처리 기준:
                갱신 중지, 미초기화, 루트 JSON 미완료, draw argument 누락 또는 바운딩 박스 누락 상태에서는 실행하지 않는다.
                갱신 주기를 통과하지 못했고 force가 falsy일 때만 다음 검사 시각을 갱신하고 종료한다. force는 이 주기 제한을 우회한다.
                레이어 박스가 프러스텀 밖이거나 카메라와 레이어 구의 거리가 geometricError × viewSizeOffset × 2를 넘으면, 캐시 길이 또는 활성 요청 수가 0보다 클 때만 표시 타일을 제거하고 다음 검사 시각을 갱신해 종료한다.

            의존:
                U3dLayer — 상속받은 초기화와 draw argument 상태 사용; 함수: {isInitialized()}; 속성 읽기: {_drawArg}
                defined — draw argument 존재 여부 판정; 함수: {defined()}
                UDrawArg — 카메라 위치와 레이어 박스 교차 여부 조회; 함수: {getCameraPosition(), intersectsBox()}
                UCheckTime — 갱신 주기 판정과 다음 검사 시각 갱신; 함수: {isUpdate(), updateTime()}
                THREE — 레이어 구와 카메라 사이 거리 계산; 함수: {Sphere.distanceToPoint()}
                LRUCache — 표시 타일 존재 여부에 사용할 캐시 길이 조회; 함수: {length()}

            동작:
                갱신 중지와 초기화 선행조건을 검사한다.
                동적 viewSizeOffset을 계산하고 레이어 공간 범위를 벗어나면 위 캐시·활성 요청 조건에 따라 타일을 제거한다.
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
            의존: U3dModelLayer — 애플리케이션과 모델 작업 프로세스 연결; 함수: {prototype.setApp.call()}
            동작: app을 U3dModelLayer.setApp()에 전달한다.

        override getTileCallback() -> void
            동작: 이 레이어는 쿼드트리 타일 콜백 경로를 사용하지 않으므로 아무 값도 반환하지 않는다.

        override dispose() -> Promise<boolean>
            의존:
                U3dModelLayer — 기반 레이어 자원 처분; 함수: {prototype.dispose.call()}
                defined — 루트 tileset 존재 여부 판정; 함수: {defined()}
            동작:
                이전 탐색을 무효화하고 모든 활성 타일 콘텐츠 요청을 취소한 뒤 캐시와 루트 타일 계층을 정리하고 루트 참조를 제거한다.
                U3dModelLayer.dispose()를 호출하고 같은 Promise를 반환한다.

        isInitializedJson() -> boolean
            동작: _initializedJson을 반환한다.

        updateCancel() -> void
            의존: Web API — 새 작업 식별 시각 조회; 함수: {performance.now()}
            동작: performance.now() 결과가 falsy이면 Date.now()를 사용하여 _updateId를 교체한다.

        isCancel(updateId: string | number | undefined) -> boolean
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

        override initialize() -> Promise<U3DTileset> | false | undefined
            처리 기준:
                baseUrl이 정의되지 않았으면 undefined를, draw argument가 정의되지 않았으면 false를 동기 반환한다.
                루트 자식의 boundingVolume에 region, sphere 또는 box가 없으면 초기화 Promise와 레이어 생성 결과를 거부한다.
                배치 그룹 요청은 루트 JSON 초기화와 병렬로 시작하며 완료를 기다리지 않는다.

            의존:
                U3dModelLayer — 공통 초기화; 함수: {prototype.initialize.call()}
                U3dLayer — 상속받은 draw argument와 생성자에서 deferred(self)로 부여한 레이어 완료 처리; 함수: {resolve(), reject()}; 속성 읽기: {_drawArg}
                defined — 필수 설정·응답·바운딩 데이터 존재 여부 판정; 함수: {defined()}
                UFileLoader — 루트 JSON 요청; 생성자: {new UFileLoader()}; 함수: {setResponseType(), load()}; 속성 쓰기: {crossOrigin}
                deferred — 초기화 결과 Promise 생성; 함수: {deferred()}
                U3DTileset — 루트 타일 계층 생성; 생성자: {new U3DTileset()}
                THREE — 지리 중심과 바운딩 구 계산; 생성자: {new Vector3()}; 함수: {Box3.getCenter(), getBoundingSphere()}
                UMathEngine — 높이의 렌더 좌표 스케일 환산; 정적 함수: {getRealScaleAtGeographic(), getRealScaleAtGoogle()}
                U3dMessage — 응답·draw argument·바운딩 오류 기록; 정적 함수: {error()}; 상수: {CNT.CMM.NON_SERVER_DATA_1, CNT.CMM.NON_DRAWARG_1, CNT.TILES.NOT_SUPPORTED_BOUND}

            동작:
                기반 레이어를 초기화하고 baseUrl과 draw argument를 확인한 뒤 배치 그룹 경로가 정의되었으면 그룹 JSON 요청을 시작한다. 성공 callback은 반환 객체를 자체 _batchGroup에 저장한다.
                루트 JSON을 요청하고, 응답 callback에서 복제한 JSON으로 U3DTileset을 생성한다.

                응답 callback은 첫 루트 자식의 바운딩 종류로 지리 범위를 정하고 루트 geometricError를 저장한다. 각 루트 자식의 지리 경계로 레이어 높이 범위와 타일 박스·구를 구성하며 _heightOffset이 truthy일 때만 렌더 배율을 환산하여 레이어 박스 Z에 더한다. 이 높이 보정과 레이어 구 계산은 자식별 반복 안에서 수행한다.
                초기화 완료 상태를 설정하고 강제 갱신한 뒤 반환 Promise를 루트 타일로 resolve한다. self.resolve가 정의되어 있을 때만 레이어 자신을 전달하여 레이어 생성 결과도 resolve한다.
                요청 오류와 중단은 초기화 Promise와 레이어 생성 결과를 reject한다.

        getTile(uri: string, object?: U3DTileset) -> U3DTileset | undefined
            의존: U3DTileset — 콘텐츠 URI·첫 메시 UUID와 자식 계층 조회; 속성 읽기: {content.uri, userData.meshes, children}
            동작:
                object가 falsy이면 루트를 사용한다.
                선택한 객체의 children이 truthy이면 객체 자체가 아닌 자식부터 URI나 첫 메시 UUID가 일치하는지 검사하고, 일치하지 않는 자식은 재귀 탐색하여 첫 결과를 반환한다.
                자식이 없거나 일치 항목이 없으면 undefined다.

        override createModel() -> void
            동작: 모델 생성은 콘텐츠 파서 경로에서 수행하므로 아무 작업도 하지 않는다.

        setOffset(offsetX: number, offsetY: number, offsetZ: number) -> void
            의존: U3dLayer — 상속받은 레이어 그룹 위치 사용; 속성 읽기·쓰기: {_group.position}
            동작: 현재 그룹 위치에 각 축 오프셋을 더하고 마지막 입력값을 자체 상태 _offset에 저장한다.

        viewSizeOffset(offset?: number | viewSizeOffsetFunction) -> void
            처리 기준: 먼저 입력의 truthy 여부를 검사하고 Function 인스턴스이거나 > 0 비교를 통과할 때 원값을 저장한다. 생략·null·false·0·NaN과 음수는 1로 복원한다. 숫자 비교는 강제 변환이므로 런타임의 양수 문자열이나 true도 원값 그대로 저장할 수 있다.
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
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 도우미 레이어 식별자 존재 여부 판정; 함수: {defined()}
                THREE — 장면 자식의 박스 도우미 종류 판정; 생성자: {Box3Helper}
                UDrawArg — 애플리케이션 장면 자식 조회; 속성 읽기: {_app._scene.children}
            동작: 앱 장면 children 중 Box3Helper이고 userData.layerType이 현재 _classtype과 같은 모든 도우미의 visible을 true로 설정한다. 레이어 인스턴스 ID로 구분하지 않는다.

        hideViewBoxHelper() -> void
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 도우미 레이어 식별자 존재 여부 판정; 함수: {defined()}
                THREE — 장면 자식의 박스 도우미 종류 판정; 생성자: {Box3Helper}
                UDrawArg — 애플리케이션 장면 자식 조회; 속성 읽기: {_app._scene.children}
            동작: 앱 장면 children 중 Box3Helper이고 userData.layerType이 현재 _classtype과 같은 모든 도우미의 visible을 false로 설정한다. 레이어 인스턴스 ID로 구분하지 않는다.

        clearViewBoxHelper() -> void
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 도우미 레이어 식별자 존재 여부 판정; 함수: {defined()}
                THREE — 장면 자식의 박스 도우미 종류 판정; 생성자: {Box3Helper}
                UDrawArg — 애플리케이션 장면 자식 배열 조회·변경; 속성 읽기·쓰기: {_app._scene.children}
            동작: 앱 장면 children 배열에서 Box3Helper이고 userData.layerType이 현재 _classtype과 같은 항목을 splice한다. 인스턴스 ID 구분, parent 참조 해제와 자원 dispose는 하지 않는다.

        setAutoHeight(autoHeight: boolean) -> void
            처리 기준:
                활성화하면 레이어 바운딩 박스 중심 한 점의 지형 높이를 전체 그룹 높이에 사용한다. [확인 Q-008]
                높이 조회가 무효이면 0을 사용하고 비활성화하면 그룹 Z 위치를 0으로 복원한다.
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 지형 높이 조회 결과 존재 여부 판정; 함수: {defined()}
                UDEF — 무효 지형 높이 식별; 상수: {INVALID, TERRAIN_NO_DATA}
                UDrawArg — 렌더 좌표의 지형 높이 조회; 함수: {getRenderHeightAtPoint()}
                THREE — 레이어 박스 중심 벡터 생성; 생성자: {new Vector3()}; 함수: {Box3.getCenter()}
                U3dLayer — 상속받은 레이어 그룹 사용; 속성 읽기·쓰기: {_group.position.z}
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
                U3dLayer — 상속받은 레이어 그룹 사용; 속성 읽기·쓰기: {_group.children}
                U3dModelLayer — 상속받은 모델 캐시 사용; 속성 읽기·쓰기: {_cacheModelInTile, _cacheModeles}
                deferred — 비동기 정리 결과 생성; 함수: {deferred()}
            동작:
                이전 탐색을 무효화하고 모든 활성 콘텐츠 요청, 그룹 자식, 콘텐츠 캐시, 루트 계층과 모델 캐시를 정리한다.
                성공하면 resolve하고 동기 예외는 reject한다.

        clearCache() -> void
            의존: LRUCache — 캐시 값 목록 조회와 제거; 함수: {values(), clear()}
            동작: 캐시의 각 메시를 완전히 삭제한 뒤 모든 항목을 제거한다.

        override refresh() -> void
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
                UDEF — refine와 타일 완료 상태 판정; 상수: {TILE_REFINE.ADD, TILES_STATE._END}
                TILES_TYPE — 부모 경계 타일 판정; 상수: {BOUND}
                U3DTileset — 타일 계층·작업·표시 상태 변경; 속성 읽기·쓰기: {type, refine, children, parent, promise, loadCount, loadList, complete, work, failMsg}
                U3dQuadTileWork — 대기 중인 형제 작업 비활성화; 함수: {setActive()}
            동작:
                checkContext를 생략하면 updateId를 포함한 기본 판정 문맥을 만들고 취소된 세대이면 종료하며 필요한 viewBox를 준비한다.
                isFirst가 truthy이면 월드 구의 프러스텀 교차를 검사하고 교차하지 않을 때 타일을 정리한 뒤 부모 완료 수만 증가시키고 반환한다.
                이후 부모 refine 경로별로 타일 요청 Promise를 준비한다.
                타일 Promise 완료 callback은 이전 세대이면 종료한다. 부모가 BOUND 또는 ADD이면 깊이 1로 판정하여 통과한 타일의 완료 상태가 _END일 때 표시하고 결과 목록을 같은 isFirst로 재귀 탐색한다. 미통과이면 loadList를 undefined로 하고 해당 타일을 표시한 뒤 자식을 정리한다. 두 경우 모두 부모 loadCount를 늘린다.
                REPLACE 경로는 isFirst=false로 바꾸고 깊이 3의 결과를 재귀 탐색한다. 깊이 판정 실패 시 loadList를 undefined로, complete를 _END로 만든다. 부모 loadCount가 loadList 길이와 같아지면 각 최종 대체 타일 중 _END인 타일을 표시하고, loadList가 undefined인 타일의 자식을 정리하며 parent.parent까지 조상 그룹을 회수한다.
                REPLACE 실패 callback은 이전 세대이면 종료한다. 각 형제의 최종 대체 타일 중 현재 updateId에 속하고 phase가 queued 또는 parser-queued인 work만 비활성화한다. 진행 중인 다운로드·파서는 이 조건으로 중단하지 않는다. 각 조상 그룹은 parent까지 _END로 회수하고 부모를 다시 표시한다.
                예약된 tile.promise를 반환한다.

        setPromise(tile: U3DTileset, updateId: string | number | undefined) -> void
            의존:
                UDEF — 완료와 캐시 상태 구분; 상수: {TILES_STATE._END, TILES_STATE._CACHED}
                U3DTileset — 작업 Promise와 실패·완료 상태 변경; 속성 읽기·쓰기: {promise, failMsg, complete}
            동작:
                다운로드 요청 Promise를 타일에 저장한다.
                성공 callback은 failMsg를 빈 문자열로 바꾸고 _CACHED 상태가 아닐 때만 _END로 설정한다.
                실패 callback은 workedTile.disposed가 falsy일 때만 해당 타일을 정리한다.

        checkTile(tile: U3DTileset, campos?: THREE.Vector3, checkContext?: TileCheckContext) -> boolean
            의존:
                defined — 타일·카메라·바운딩 정보 존재 여부 판정; 함수: {defined()}
                U3DTileset — 뷰 박스와 갱신별 판정 캐시 사용; 속성 읽기·쓰기: {viewBox, _checkUpdateId, _checkResult}
            동작: checkContext가 falsy이면 먼저 새 문맥을 만든다. 타일 또는 레이어 geometricError가 정의되지 않았으면 false다. viewBox가 없으면 구성하고도 없을 때 false를 반환한다. 명시한 checkContext가 defined일 때만 문맥 updateId와 타일 _checkUpdateId가 같은 캐시를 재사용하며, 그 외에는 상세 SSE를 계산하고 이 명시 문맥 조건에서만 ID·결과를 저장한다.

        checkTileDepth(tile: U3DTileset, depth: number = 2, results: Array<U3DTileset> = [], checkContext?: TileCheckContext) -> boolean
        _createTileContentRequestUrl(sourceUrl: string) -> string
            동작: 원본 콘텐츠 URL에 현재 프록시 URL과 API 키를 결합하여 UFileLoader 요청·취소에 공통으로 사용할 최종 URL을 반환한다.

        _isTileContentRequestCancelled(item: ModelTileParserQueueItem | ModelTileContentQueueInfo | undefined) -> boolean
            처리 기준:
                requestState가 있으면 updateId 변경만으로 취소하지 않는다.
                requestState가 없는 기존 호환 경로에서는 타일 dispose 또는 오래된 updateId를 취소로 판정한다.
            동작: item 또는 item.tile이 falsy이면 true다. requestState가 없으면 item.tile.disposed 또는 이전 updateId 여부를 반환한다. 상태가 있으면 state.cancelled, state.settled, state.tile.disposed 또는 Map의 현재 상태 identity 불일치 중 하나로 취소를 판정한다.

        _adoptTileContentRequest(state: ModelTileContentRequestState, updateId: string | number) -> Promise<U3DTileset>
            처리 기준: 기존 Promise·work·다운로드·파서를 새로 만들지 않는다.
            동작: 상태와 존재하는 다운로드·파서 파라미터의 updateId를 최신 세대로 갱신하고 state.tile.disposed=false로 복원한다. 기존 공유 Promise를 그대로 반환한다.

        _finishTileContentRequest(state: ModelTileContentRequestState, settle: "resolve" | "reject", tile: U3DTileset) -> void
            처리 기준: Map과 tile.work는 현재 상태·work의 객체 identity가 일치할 때만 제거한다.
            동작: 상태가 없거나 이미 settled이면 종료한다. 먼저 settled=true로 표시하고 identity가 같은 Map 항목과 tile.work를 제거한다. 그 뒤 settle이 resolve이면 공유 Promise를 resolve하고 아니면 reject한다. 동기 완료 callback은 이미 소유권이 정리된 상태에서 실행된다.

        _cancelTileContentRequest(tile: U3DTileset) -> boolean
            처리 기준:
                카메라 updateId 변경만으로는 호출하지 않는다.
                다운로드가 시작되었고 아직 완료되지 않았으며 최종 요청 URL이 로딩 중일 때만 실제 abort를 호출한다.
                UFileLoader의 URL 공유 AbortController 때문에 같은 URL의 다른 소비자도 함께 중단될 수 있다. [확인 Q-010]
                실행 중인 파서는 즉시 중단하지 못하므로 상태를 취소하고 완료 결과 적용을 차단한다.
            의존:
                UFileLoader — 최종 요청 URL의 로딩 조회와 실제 네트워크 중단; 함수: {_loader.isLoading(), abort()}
                U3dQuadTileWork — 큐 작업 비활성화; 함수: {setActive()}
            동작:
                tile이 falsy이거나 현재 상태가 없거나 이미 cancelled 또는 settled이면 false다.
                tile이 truthy이고 살아 있는 요청 상태이면 cancelled=true로 표시하고 존재하는 work를 비활성화한 뒤 실패 메시지를 설정한다. 필요한 경우 저장된 requestUrl을 abort한다.
                    그 요청의 공유 Promise를 실패 완료하고 true를 반환한다.

        _cancelAllTileContentRequests() -> void
            동작: 활성 상태 목록을 복사한 뒤 각 타일 요청을 멱등하게 취소한다.

        addRequestQueue(tile: U3DTileset, updateId: string | number) -> Promise<U3DTileset>
            처리 기준:
                호출 세대가 오래되면 먼저 실패한다. complete가 _END 이상이면 disposed=false로 하고 URL 검사 없이 완료한다. 미완료 타일은 사용자 URL·URI, 콘텐츠 URI·URL 순으로 주소를 찾고, 주소 없는 BOUND는 성공하며 그 외에는 실패한다.
                같은 타일 ID와 sourceUrl의 활성 상태가 있으면 기존 작업의 updateId를 최신 세대로 바꾸고 같은 Promise를 반환한다.
                같은 타일 ID의 sourceUrl이 바뀌면 이전 콘텐츠 상태를 폐기하고 새 파이프라인을 만든다.
                캐시가 있으면 메시 참조를 타일로 되돌리고 다운로드 없이 완료한다.
                JSON 타일이 실제 콘텐츠 타일로 교체되면 새 타일에 대해 다운로드 경로를 다시 예약한다.
            의존:
                U3dModelLayer — 상속받은 다운로드 작업 프로세스; 속성 읽기: {_workProcess}
                deferred — 외부에 반환할 작업 Promise와 슬롯 반납 Deferred 생성; 함수: {deferred()}
                UDEF — 작업 메시지와 타일 상태 판정·변경; 상수: {_MSG_WORK._UPDATE_MESH_BUILDING, TILES_STATE._END, TILES_STATE._DOWNLOADING, TILES_STATE._PARSING}
                U3DTileset — 콘텐츠 URL, 메시, 작업과 상태 변경; 속성 읽기·쓰기: {content, baseURL, type, userData, complete, disposed, work, failMsg}
                U3dQuadTileWork — 다운로드 작업 생성과 큐 대기 작업 비활성화; 생성자: {new U3dQuadTileWork()}; 함수: {setActive()}
                WorkProcess — 우선순위 callback과 함께 다운로드 작업 등록; 함수: {_workProcess.add()}
                LRUCache — URL별 메시 캐시 조회·등록; 함수: {_dataCache.has(), get(), put()}
                U3dEvent — 단위 메시 로드 이벤트 종류; 상수: {MESH.LOADED}
                U3dLayer — 메시 로드 이벤트 발행; 함수: {dispatchEvent()}
                U3dMessage — 취소 파라미터 오류 기록; 정적 함수: {error()}; 상수: {CNT.TILES.NOT_CANCEL_WORK}
                TILES_TYPE — 경계·JSON 타일 종류 판정; 상수: {BOUND, JSON}
            동작:
                요청 시점에 취소 여부·완료 상태·URL·활성 상태·메시 캐시 순으로 검사한다.
                캐시 적중이면 메시 배열을 복제하지 않고 같은 참조를 타일에 연결하며 각 메시의 texture 재할당과 _tileset 연결을 갱신한다. 캐시 unitMeshes가 truthy일 때만 그 참조와 각 단위 메시도 연결한다. complete=_END로 만든 뒤 다운로드 없이 완료한다.
                같은 활성 상태를 이어받지 않는 경우 성공 callback을 캐시 조회 전에 등록한다. workedTile.userData.meshes가 truthy일 때만 unitMeshes의 각 항목에 로드 이벤트를 발행하고, 그 뒤 workedTile.userData.url이 캐시에 없을 때 메시·바이트 크기와 존재하는 unitMeshes 참조를 캐시에 넣는다. 캐시 적중 완료도 이 callback을 실행한다.
                캐시가 없으면 기존 다운로드·파싱 상태의 work를 비활성화하고 최종 requestUrl과 공유 Promise를 가진 ModelTileContentRequestState를 Map에 등록하며 complete=_DOWNLOADING으로 바꾼다.
                WorkProcess가 실행하는 callback은 다운로드·형식 분기를 시작하고 네트워크 완료 시점에 settle되는 슬롯 반납 Deferred를 WorkProcess에 반환하며, JSON 교체 타일은 재귀 요청한다. 타일 파이프라인의 성공·실패는 공유 Promise를 정확히 한 번 완료하는 경로로 전달한다.
                작업 filter callback은 아직 큐에 있는 상태의 최신 세대·dispose·타일 상태를 검사한다.
                타일 완료 여부를 결정하는 Promise를 반환한다.

        distanceToCameraPosition(tile: U3DTileset, useSphere?: boolean, position?: THREE.Vector3) -> number
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 위치와 바운딩 볼륨 존재 여부 판정; 함수: {defined()}
                UDrawArg — 기본 카메라 위치 조회; 함수: {_drawArg.getCameraPosition()}
                THREE — 점과 구·박스 사이 거리 계산; 함수: {Sphere.distanceToPoint(), Box3.distanceToPoint()}
            동작: position이 정의되지 않았으면 카메라 위치를 조회하고 여전히 없으면 0을 반환한다. useSphere가 truthy이고 worldSphere가 정의되어 있으면 구까지의 거리를 반환한다. 아니면 worldBox가 정의되어 있을 때 박스까지의 거리를 반환하고 둘 다 사용할 수 없으면 0이다. 구 내부의 음수 거리를 0으로 제한하지 않는다.

        addParserQueue(fnc: (item: ModelTileParserQueueItem) -> DeferredObject<U3DTileset>, item: ModelTileParserQueueItem) -> Promise<U3DTileset>
            인터페이스: fnc는 현재 레이어를 this로 하고 item을 전달하여 호출한다. 파서가 resolve한 값 대신 item.tile로 외부 Promise를 완료한다.
            처리 기준:
                파서나 항목이 없으면 undefined 대신 실패 완료한 Promise를 반환하여 호출 인터페이스를 유지한다.
                파서의 동기 예외 또는 then/catch가 없는 반환값은 외부 Promise가 대기 상태로 남지 않도록 실패 처리한다.
                dispose 이후 늦게 완료된 파서 결과는 성공으로 적용하지 않는다.
            의존:
                U3dModelLayer — 상속받은 파서 작업 프로세스; 속성 읽기: {_workProcess2}
                deferred — 파서 완료 Promise 생성; 함수: {deferred()}
                UDEF — 파싱 작업 메시지와 상태 판정; 상수: {_MSG_WORK._UPDATE_MESH_BUILDING, TILES_STATE._PARSING}
                U3dQuadTileWork — 파서 작업과 취소 callback 구성; 생성자: {new U3dQuadTileWork()}
                WorkProcess — 파서 작업 등록; 함수: {_workProcess2.add()}
            동작:
                WorkProcess callback이 입력으로 전달된 파서를 현재 레이어 문맥으로 안전하게 실행하도록 위임한다.
                requestState가 있을 때만 phase=parser-queued와 parserItem을 저장하며 work도 연결한다. callback 시작 시 상태가 있으면 phase=parsing으로 바꾼 뒤 fnc를 호출한다. 취소 callback은 상태가 있으면 cancelled=true로 하고 item.tile로 외부 Promise를 reject한다.
                filter callback은 item·tile·requestState가 없으면 false다. 아직 큐에 있는 상태의 최신 세대·명시적 취소·settled·Map identity·타일 처분·_PARSING 상태를 검사한다.
                파서 완료 시 dispose 이후 늦게 끝난 결과인지 재검사한 뒤 파서 결과를 타일 단위 Promise로 변환해 반환한다.

        override show(show: boolean, refresh?: boolean) -> void
            의존:
                U3dModelLayer — 공통 표시 상태 변경; 함수: {prototype.show.call()}
                LRUCache — 캐시 항목 수 조회; 함수: {_dataCache.length()}
            동작:
                기반 표시 처리는 항상 실행한다.
                show가 falsy일 때 캐시 또는 활성 콘텐츠 요청이 있으면 모든 타일을 정리한다.
                show가 falsy일 때 캐시·요청 유무와 관계없이 이전 카메라 위치를 초기화한다.

        override disposeTile(tile: U3dQuadTile | U3DTileset, updateId?: string | number) -> void
            처리 기준: 현재 URL 단위 취소는 같은 URL의 다른 소비자에게 영향을 줄 수 있다. [확인 Q-010]
            의존:
                defined — 도우미·메시·자식 존재 여부 판정; 함수: {defined()}
                UFileLoader — 활성 상태 취소가 false인 호환 경로에서 최종 요청 URL 조회·중단; 함수: {_loader.isLoading(), abort()}
                LRUCache — 캐시 소유 메시 여부 판정; 함수: {_dataCache.has()}
                UGroup — 레이어·도우미 그룹에서 객체 제거; 함수: {_groupComment.remove(), _group.remove()}
                U3dLayer — 상속받은 장면에서 박스 도우미 제거; 함수: {_scene.remove()}
                U3dQuadTileWork — 타일 작업 비활성화; 함수: {setActive()}
                UDEF — 초기 타일 상태 복원; 상수: {TILES_STATE._NONE}
                U3DTileset — 원본 JSON 타일과 자식 계층·자원 상태 변경; 속성 읽기·쓰기: {originalTile, parent, children, userData, complete, disposed, promise, work, boundInfo}
            동작:
                타일이 없거나 isU3dQuadTile 플래그가 truthy이거나 userData가 없으면 종료한다. updateId가 truthy이고 현재 세대와 다를 때만 종료하므로 생략·0·빈 문자열은 세대 검사를 우회한다. 먼저 disposed=true로 표시한 뒤 활성 요청을 취소한다. 취소 결과가 false이면 원본 URL로 최종 요청 URL을 재구성해 로딩 중일 때 호환 abort를 시도한다. 이후 타일 updateId에 입력값을 저장한다.
                boxHelper가 정의되었으면 도우미 그룹과 상속받은 _scene에서 제거하되 userData의 참조는 지우지 않는다.
                타일 그룹은 조건 없이 제거한다.
                meshes가 정의되었을 때 URL 캐시가 있으면 각 메시를 deallocate하고 없으면 delete한 뒤 meshes를 undefined로 바꾼다.
                같은 meshes 존재 분기 안에서 unitMeshes가 truthy일 때만 unitMeshes를 undefined로 바꾼다.
                남은 work가 truthy이면 비활성화한 뒤 참조를 비운다. JSON 교체 타일은 부모 children의 일치 ID를 원본으로 되돌리고 원본을 재초기화하며 replaceTile·originalTile 연결을 지운다. boundInfo와 promise를 비우고 complete=_NONE으로 만든 뒤 자식을 같은 updateId로 재귀 정리한다. 선행 disposed는 setPromise 실패 callback의 동기 재진입을 차단한다.

    계층·메타데이터와 BIM 설정
        getParent(object?: U3DTileset) -> U3DTileset | undefined
            동작: object가 null·undefined이면 undefined이며 그 외에는 object.parent를 그대로 반환한다.

        getChildren(object?: U3DTileset) -> Array<U3DTileset> | undefined
            의존: defined — 객체와 children 존재 여부 판정; 함수: {defined()}
            동작: object와 children이 정의되었고 자식이 하나 이상 있으면 원본 children 배열을 반환하며 그 외에는 undefined다.

        loadMetaData(url?: string) -> Promise<object> | undefined
            처리 기준:
                이미 메타데이터가 있으면 즉시 해당 JSON으로 완료한다.
                URL이 없고 batchGroupPath도 없으면 undefined를 반환한다.
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

        getBatchGroupProperty(groupName: string) -> unknown
            의존:
                defined — 배치 그룹과 직접 일치 항목 존재 여부 판정; 함수: {defined()}
                Console API — 배치 그룹 미초기화 오류 기록; 함수: {console.error()}
            동작: 정확한 그룹의 Properties를 반환하거나 groupName 접두사와 일치하는 하위 그룹의 이름·Properties 목록을 반환한다.

        getBatchGroup() -> object | undefined
            의존: defined — 배치 그룹 경로와 데이터 존재 여부 판정; 함수: {defined()}
            동작: batchGroupPath와 _batchGroup이 모두 있으면 배치 그룹 객체를 반환한다.

        setMakeLevel(level?: number) -> void
            의존:
                U3dLayer — 상속받은 레이어 장면; 속성 읽기: {_scene}
                defined — 레벨과 배치 그룹 존재 여부 판정; 함수: {defined()}
                THREE — 장면 메시 판정과 순회; 생성자: {Mesh}; 함수: {Scene.traverse()}
            동작: level이 정의되지 않았으면 종료한다. 정의되었으면 저장하고 _scene.children이 비어 있지 않으며 _batchGroup이 정의되었을 때만 상속받은 레이어 장면 전체를 순회하여 모든 THREE.Mesh에 같은 make level을 적용한다.

        getMakeLevel() -> number | undefined
            의존: defined — 명시 레벨과 BIM 레벨 기준 존재 여부 판정; 함수: {defined()}
            동작: 0이 아닌 명시 레벨을 반환하고, 그렇지 않으면 BIM 레벨 기준 수에서 1을 뺀 값을 저장·반환한다. [확인 Q-005]

        setBIMLevelLengthList(list: Record<number, number> | Array<number>) -> void
            처리 기준: 배열과 숫자 키 객체를 받으며 기본 분류표도 숫자 키 객체다.
            의존: defined — 입력 존재 여부 판정; 함수: {defined()}
            동작: 하나 이상의 키를 가진 레벨별 이름 길이 기준을 저장한다.

        getBIMLevelLengthList() -> Record<number, number> | Array<number>
            의존: defined — 사용자 설정 목록 존재 여부 판정; 함수: {defined()}
            동작: _bimLevelLengthList가 정의되었으면 같은 목록 참조를 반환한다. 없으면 등록 형식과 관계없이 {0:4, 1:4, 2:6, 3:9, 4:20}인 새 객체를 호출마다 반환하며 이 기본 객체를 필드에 저장하지 않는다.

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
            동작: 재질이 정의되었으면 단일 재질 또는 각 배열 원소의 truthy인 map을 dispose한 뒤 재질을 dispose한다. geometry가 정의되었으면 해제하되 재질·map·geometry의 참조는 보존한다. _tileset이 truthy일 때만 undefined로 바꾸고 removed 이벤트를 발행한 다음 존재하는 비어 있지 않은 자식을 재귀 해제한다.

        override deleteMesh(mesh: THREE.Object3D) -> void
            처리 기준: 비동기 재질 해제를 기다리지 않고 나머지 삭제를 계속한다. [확인 Q-007]
            의존:
                U3dModelLayer — 상속받은 라벨 그룹; 속성 읽기: {_labelGroup}
                defined — 메시 자원·라벨·자식·사용자 dispose 존재 여부 판정; 함수: {defined()}
                THREE — geometry 해제, 자식 제거와 제거 이벤트 발행; 함수: {BufferGeometry.dispose(), Object3D.clear(), dispose(), dispatchEvent()}
                UGroup — 라벨 그룹에서 라벨 제거; 함수: {_labelGroup.remove()}
            동작: mesh가 정의되지 않았으면 종료한다. _tileset이 truthy일 때만 비우고 재질·geometry·라벨이 각각 정의되었으면 해제 후 참조를 undefined로 바꾼다. 재질 해제 Promise는 기다리지 않는다. 자식이 정의되고 비어 있지 않을 때만 재귀 삭제 후 clear한다. mesh.dispose가 정의된 함수이면 호출하고 마지막에 removed 이벤트를 발행한다.

        addGroup(tile: U3DTileset) -> void
            의존:
                U3dLayer — 상속받은 렌더 그룹; 속성 읽기: {_group}
                UGroup — 타일 메시를 레이어 그룹에 추가; 함수: {_group.add()}
                U3DTileset — 표시 상태와 메시 목록 변경; 속성 읽기·쓰기: {visible, userData.meshes}
            동작: 아직 표시되지 않은 타일을 visible로 바꾸고 보유 메시를 레이어 그룹에 추가한다.

        removeGroup(tile: U3DTileset) -> void
            의존:
                U3dLayer — 상속받은 렌더 그룹; 속성 읽기: {_group}
                UGroup — 타일 메시를 레이어 그룹에서 제거; 함수: {_group.remove()}
                U3DTileset — 표시 상태와 메시 목록 변경; 속성 읽기·쓰기: {visible, userData.meshes}
            동작: 표시 중인 타일을 숨김 상태로 바꾸고 보유 메시를 레이어 그룹에서 제거한다.

        removeGroupUpTree(tile: U3DTileset, target: U3DTileset, setType: number = UDEF.TILES_STATE._CACHED) -> void
            의존:
                UDEF — 완료·캐시 상태 변경; 상수: {TILES_STATE._END, TILES_STATE._CACHED}
                U3DTileset — 부모 계층과 완료 상태 변경; 속성 읽기·쓰기: {parent, id, complete}
            동작: tile의 부모부터 target 직전까지 표시를 제거하고 완료 타일의 상태를 setType으로 바꾼다.

        cesiumFromRadians(longitude: number, latitude: number, height: number) -> THREE.Vector3
    내부 공간 판정과 계층 구성
        #isTransform(info: ModelTileTransformInfo) -> boolean
        #transformPoint(vector3: Vector3) -> Vector3Like
        #changeRotation(tile: U3DTileset, rotationQuaternion: THREE.Quaternion) -> void
        #intersectsSphere(frustum: THREE.Frustum, sphere: THREE.Sphere, geometricError: number) -> boolean
        #createCheckContext(campos: THREE.Vector3 = this._drawArg.getCameraPosition(), updateId: string | number = this.getUpdateId()) -> TileCheckContext
            의존:
                U3dLayer — 상속받은 앱·렌더 문맥; 속성 읽기: {_app, _drawArg}
                UDrawArg — 카메라 위치·프러스텀과 카메라 SSE 분모 조회; 함수: {_drawArg.getCameraPosition(), _camera.getDenominator()}; 속성 읽기: {_drawArg._frustum}
                U3dApp — renderer draw buffer 높이 조회; 함수: {_app.getDrawBufferHeight()}
            동작: 새 객체에 updateId, campos와 현재 프러스텀의 같은 참조, draw buffer 높이, 카메라 SSE 분모, _viewSizeOffset과 함수 여부, maximumScreenSpaceError와 그 1/3을 저장한다. 위치·프러스텀을 복제하지 않는다.

        #checkTileDetail(tile: U3DTileset, checkContext: TileCheckContext) -> boolean
        #createBox(bondingbox: UGeoBox) -> UBox3
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                UDrawArg — geographic 최소·최대점을 월드 좌표(EPSG:3857)로 변환; 함수: {_drawArg.getGeographicToGoogle()}
                THREE — 변환 결과의 최소·최대 벡터 생성; 생성자: {new Vector3()}
                UBox3 — 렌더 좌표 바운딩 박스 생성; 생성자: {new UBox3()}
            동작: geographic box의 최소·최대점을 렌더 좌표로 바꾸고 축별 순서를 정규화하여 UBox3를 반환한다.

        #createBoxHelper(bondingbox: UGeoBox, color?: number) -> object
            인터페이스: 생성한 UBox3를 bbox에, 같은 박스를 사용하는 THREE.Box3Helper를 helper에 담아 반환한다.
            의존:
                defined — 색상 생략 판정; 함수: {defined()}
                THREE — 박스 도우미 생성; 생성자: {Box3Helper}
            동작: 색상이 null 또는 undefined이면 0xffff00을 사용한다. 지리 경계를 렌더 박스로 변환하고 그 박스와 색상으로 도우미를 만든다.

        #searchChildren(tile: U3DTileset, drawArg: UDrawArg, color?: number) -> void
            인터페이스: drawArg은 현재 구현에서 사용하지 않고, color를 생략하면 본문에서 0x00ffff로 보정한다.
            의존:
                defined — 콘텐츠·레벨·부모·바운딩 정보와 자식 존재 여부 판정; 함수: {defined()}
                TILES_TYPE — URI 확장자 기반 타일 종류 설정; 상수: {B3DM, JSON, I3DM, CMPT, PNTS, GLB, BOUND}
                U3DTileset — 콘텐츠 URI, 레벨, 바운딩 정보와 자식 계층 변경; 속성 읽기·쓰기: {content.uri, type, level, parent, boundingVolume, children}
            동작:
                콘텐츠 URI로 타일 종류를 추정하고 부모 레벨 다음 값으로 누락 레벨을 채우며 콘텐츠가 없으면 BOUND로 설정한다.
                region, sphere 또는 box의 geographicBox를 렌더 박스로 바꾸고 선택적으로 도우미를 만들어 타일에 연결한다.
                같은 분류와 박스 구성을 모든 자식에 재귀 적용한다.

        #addUserBox(tile: U3DTileset, box: UBox3, boxHelper?: THREE.Box3Helper) -> void
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 도우미와 geometry 존재 여부 판정; 함수: {defined()}
                THREE — 월드 구 생성·계산, 장면 등록과 미사용 geometry 해제; 생성자: {new Sphere()}; 함수: {Box3.getBoundingSphere(), Scene.add(), BufferGeometry.dispose()}
                U3DTileset — 사용자 박스·도우미와 월드 바운딩 저장; 속성 쓰기: {userData.box, userData.boxHelper, worldBox, worldSphere}
            동작: 입력 box의 같은 참조를 userData.box와 worldBox에 저장하고 새 worldSphere를 계산한다. usebox가 켜져 있고 boxHelper가 정의되었을 때만 userData.boxHelper에 저장하고 앱 장면에 등록한다. usebox가 꺼진 경로에서는 전달된 도우미와 geometry가 정의되었을 때 geometry만 해제한다.

        async #disposeMaterial(material: THREE.Material | Array<THREE.Material>) -> Promise<void>
            처리 기준: Yield()가 실제 다음 렌더 프레임으로 실행을 넘긴다는 보장은 없으며 호출자인 deleteMesh()는 이 Promise를 기다리지 않는다. [확인 Q-007]
            의존:
                defined — material.map 존재 여부 판정; 함수: {defined()}
                Yield — texture 해제 전 실행 양보; 함수: {Yield()}
                Web API — ImageBitmap 종류 판정과 CPU 이미지 닫기; 생성자: {ImageBitmap}; 함수: {ImageBitmap.close()}
                THREE — texture와 material GPU 자원 해제; 함수: {Texture.dispose(), Material.dispose()}
            동작: 재질 배열이면 각 원소의 재귀 해제를 시작하되 기다리지 않는다. 단일 재질의 map이 정의된 경우에만 Yield를 await하고 map.image가 ImageBitmap인 경우에만 닫은 뒤 texture를 해제하여 map 참조를 지운다. 이후 재질을 해제하며 map이 없는 재질은 양보 없이 바로 해제한다.

        #computeRectangle() -> void
            의존:
                U3dLayer — 상속받은 좌표 변환 문맥과 영역 상태; 속성 읽기: {_drawArg}; 속성 쓰기: {_rectangle, _rectangle3d}
                defined — 레이어 geographic bounding box 존재 여부 판정; 함수: {defined()}
                Console API — bounding box 누락 오류 기록; 함수: {console.error()}
                UDrawArg — geographic 최소·최대점을 월드 좌표(EPSG:3857)로 변환; 함수: {_drawArg.getGeographicToGoogle()}
                UMathEngine — geographic rectangle 생성; 정적 함수: {createUGeoRect()}
                UDEF — rectangle 좌표계 식별; 상수: {GOOGLE}
                THREE — 렌더 바운딩 박스 최소·최대점 설정; 생성자: {new Vector3()}; 함수: {Box3.set()}
            동작: _boundingBox의 각 축 최소·최대 순서를 정규화하고 geographic rectangle과 같은 참조의 rectangle3d를 만든 뒤 렌더 좌표 _box3를 갱신한다.

    내부 다운로드와 형식 분기
        #processQueue(info: ModelTileContentQueueInfo, slotDone: DeferredObject<U3DTileset>) -> DeferredObject<U3DTileset>
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
                로드 성공 callback은 먼저 networkCompleted=true로 표시한다. 상태가 유효하지 않거나 응답이 비었으면 반환 Promise와 slotDone을 모두 실패시킨다. 첫 네 바이트의 magic이 {로 시작하면 JSON을 해석해 계층을 확장하고 기존 tile.complete=_NONE으로 만든 뒤 두 결과를 확장된 타일로 성공시킨다. JSON 경로는 _DOWNLOADING 검사를 거치지 않는다.
                바이너리는 현재 complete가 _DOWNLOADING인지 검사한 뒤 _PARSING으로 바꾸고 magic별 파서를 파서 작업 큐에 전달한다. 파서 완료 연결 직후 slotDone만 resolve하여 다운로드 슬롯을 반납하며 반환 Promise는 파서 성공·실패를 따른다. 지원하지 않는 magic, 동기 처리 예외와 로드 오류 callback은 두 결과를 모두 실패시킨다. 로드 오류 callback은 networkCompleted를 바꾸지 않는다.
                카메라 updateId 변경만으로 네트워크 abort 또는 callback 제거를 수행하지 않는다.

        #redefineMesh(mesh: ModelMesh, result: ModelTileBatchResult) -> ModelMesh
        #isAbsolutePath(url: string) -> boolean
            동작: 문자열 어디에든 http: 또는 https:가 있으면 true, 둘 다 없으면 false를 반환한다. 접두어인지 확인하거나 URL을 파싱하지 않는다.

        #defineBatchGroup() -> Promise<object> | undefined
            의존:
                defined — 배치 그룹 경로 존재 여부 판정; 함수: {defined()}
                deferred — JSON 로드 결과 Promise 생성; 함수: {deferred()}
                UFileLoader — batchGroup JSON 로드; 생성자: {new UFileLoader()}; 함수: {setResponseType(), load()}
            동작: batchGroupPath가 없으면 undefined를 반환한다. 경로에 http: 또는 https:가 포함되면 그대로 사용하고, 아니면 base URL·proxy URL에 결합하여 JSON을 비동기로 읽는 Promise를 반환한다.

    내부 좌표 변환과 배치 후처리
        #calcPosition(object: THREE.Object3D, tile: U3DTileset, info: ParserInfo, callback?: function) -> Promise<void>
            처리 기준: rtcCenter, 타일 transform 또는 worldBox 중심 중 어느 경로로도 중심을 얻지 못하면 실패한다.
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                deferred — 좌표 반영 완료 Promise 생성; 함수: {deferred()}
                defined — 중심·변환·월드 박스·도우미 존재 여부 판정; 함수: {defined()}
                Coordinates — EPSG:4326·4978 좌표 변환; 정적 함수: {transformPoint()}
                UDrawArg — 월드·지리·월드 좌표 변환; 함수: {_drawArg.getWorldToGeographic(), getGeographicToGoogle()}
                THREE — 중심·로컬 박스·레이어 회전 생성; 생성자: {new Vector3(), new Box3(), new Quaternion(), new Euler()}; 함수: {Box3.getCenter(), Quaternion.setFromEuler()}
                UGroup — 디버그 박스 도우미 등록; 함수: {_groupComment.add()}
                TILES_TYPE — 형식별 위치 보정 분기; 상수: {B3DM, I3DM, CMPT, PNTS, GLB}
            동작:
                rtcCenter가 없으면 타일 계층의 transform 보유 여부를 먼저 판정한다.
                transform이 있으면 결합 행렬의 translation 성분을 중심으로 사용한다. transform도 없으면 worldBox 중심을 EPSG:4978로 변환한다.
                얻은 중심을 위경도 좌표로 변환한다.
                콘텐츠 중심을 지리·월드·EPSG:4978 좌표로 저장하고 메시 계층의 로컬 박스와 회전을 계산한다.
                콘텐츠 종류에 맞는 위치 보정을 수행하고 완료 Promise를 반환한다.

        #computeTransform(info: ModelTileTransformInfo) -> Matrix4
        #calcTraverse(object: ModelMesh, result: ModelTileCalculationInfo, quaternion: Quaternion) -> void
        #calcScale(object: ModelMesh, tile: U3DTileset, center: Vector3Like, geoCenter: Vector3Like) -> void
        #changeB3DMPosition(object: THREE.Object3D, info: ParserInfo) -> void
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 자동 지형 높이 결과 존재 여부 판정; 함수: {defined()}
                THREE — translation 사용 시 로컬 중심과 자식 위치 계산, 최종 위치 복제; 생성자: {new Vector3()}; 함수: {Box3.getCenter(), Object3D.traverse(), Vector3.subVectors(), clone()}
                UDrawArg — 콘텐츠 중심점의 렌더 지형 높이 조회; 함수: {_drawArg.getRenderHeightAtPoint()}
                UDEF — 무효 지형 높이 식별; 상수: {INVALID, TERRAIN_NO_DATA}
            동작:
                먼저 B3DM 스케일을 보정한다. info.useTranslation이 truthy이면 로컬 박스 중심을 새 중심과 object.userData.world로 사용하고, translation이 있는 자식 위치를 중심-기존 위치로 바꾼다.
                X·Y는 중심으로 지정한다. info.editCenter가 truthy일 때만 중심 Z의 nullish 기본값 0을 사용하고 자동 지형 높이를 적용한다. _autoHeight가 truthy이면 지형 높이가 undefined·null·INVALID·TERRAIN_NO_DATA일 때 중심 Z로 대체한 뒤 region이 truthy이면 region.box3D.min.z, 아니면 box.geographicBox.min.z를 뺀다.
                editCenter가 falsy이면 자동 지형 높이를 조회하지 않고 center.z를 그대로 사용한다. 선택한 높이에 #scaledHeightOffset을 더해 Z를 정하고 최종 위치를 복제하여 tile.world에 저장한다.

        #changeI3DMPosition(object: THREE.Object3D, info: ParserInfo) -> void
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 자동 지형 높이 결과 존재 여부 판정; 함수: {defined()}
                UDrawArg — 콘텐츠 중심점의 렌더 지형 높이 조회; 함수: {_drawArg.getRenderHeightAtPoint()}
                UDEF — 무효 지형 높이 식별; 상수: {INVALID, TERRAIN_NO_DATA}
                THREE — 최종 위치 복제; 함수: {Vector3.clone()}
            동작: X·Y는 콘텐츠 월드 중심을 사용하고 초기 높이는 기존 object.position.z ?? 0이다. _autoHeight가 truthy일 때만 지형 높이를 조회하며 무효 값이면 기존 높이로 대체한다. 이 자동 높이 분기 안에서 region이 truthy이면 region.box3D.min.z, 아니면 box.geographicBox.min.z를 뺀다. 높이 오프셋을 더하여 Z를 설정하고 최종 위치를 복제하여 tile.world에 저장한다.

        #changeCMPTPosition(object: THREE.Object3D, info: ParserInfo, editCenter: boolean) -> void
            의존:
                defined — 콘텐츠 형식 존재 여부 판정; 함수: {defined()}
                TILES_TYPE — 합성 타일 내부 콘텐츠 종류 분기; 상수: {B3DM, I3DM, PNTS}
            동작: object.userData._objectType이 정의되지 않았으면 종료한다. B3DM, I3DM 또는 PNTS일 때만 해당 위치 보정을 실행하며 그 외 형식에는 아무 작업도 하지 않는다.

        #changePNTSPosition(object: THREE.Object3D, info: ParserInfo) -> void
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                defined — 자동 지형 높이 결과 존재 여부 판정; 함수: {defined()}
                UDrawArg — 콘텐츠 중심점의 렌더 지형 높이 조회; 함수: {_drawArg.getRenderHeightAtPoint()}
                UDEF — 무효 지형 높이 식별; 상수: {INVALID, TERRAIN_NO_DATA}
                UMathEngine — 지리 위도의 Google 렌더 스케일 계산; 정적 함수: {getRealScaleAtGeographic()}
                THREE — 최종 위치 복제; 함수: {Vector3.clone()}
            동작: X·Y는 콘텐츠 월드 중심을 사용하고 초기 높이는 center.z ?? 0이다. _autoHeight가 truthy일 때만 지형 높이를 조회하며 무효 값이면 초기 높이로 대체한 뒤 region 또는 box의 최소 높이를 뺀다. Z에는 선택 높이와 오프셋을 합산하고 지리 위도 배율의 역수를 기존 X·Y·Z scale 각각에 곱한다. 최종 위치를 복제하여 tile.world에 저장한다.

    내부 형식별 파싱
        #parseCMPT(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준: 취소 뒤 적용하지 않은 복합 파서 결과의 즉시 자원 해제 소유권은 정의되어 있지 않다. [확인 Q-012]
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
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
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                deferred — 파싱 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument와 parser 존재 여부 판정; 함수: {defined()}
                UI3dmParser — 인스턴스 타일 파싱; 생성자: {new UI3dmParser()}; 함수: {parse()}
            동작:
                실행 전 요청 상태·draw argument·타일 처분을 검사한다.
                parser 완료 callback에서 요청 상태를 다시 검사한 뒤 I3DM 결과를 후처리한다.

        #parsePNTS(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준: 취소 뒤 적용하지 않은 포인트 파서 결과의 즉시 자원 해제 소유권은 정의되어 있지 않다. [확인 Q-012]
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                deferred — 파싱 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument와 parser 존재 여부 판정; 함수: {defined()}
                UPntsParser — 점군 타일 파싱; 생성자: {new UPntsParser()}; 함수: {parse()}
                THREE — 로컬·월드 변환 행렬 분해와 region 회전 보정; 생성자: {new Vector3(), new Quaternion()}; 함수: {Matrix4.premultiply(), decompose()}
            동작:
                실행 전 요청 상태·draw argument·타일 처분을 검사한다.
                parser 완료 callback에서 처분·요청 상태를 재검사하고 유효하지 않으면 실패한다.
                tile._worldFromLocalTransform이 truthy이면 point 행렬에 선행 곱한 뒤 분해한다.
                tile._worldFromLocalTransform이 falsy이고 boundingVolume.region이 있으면 region의 EPSG:4978 중심을 지리 좌표로 바꿔 회전을 보정한다.
                위 변환 유무와 관계없이 유효한 결과를 후처리하고 타일로 완료한다.

        #parseVCTR(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
                deferred — 기본 VCTR 처리 완료 Promise 생성; 함수: {deferred()}
                defined — draw argument 존재 여부 판정; 함수: {defined()}
            동작: 타일별 요청 상태와 draw argument만 검사하고 콘텐츠 해석 없이 타일로 완료한다.

        #parseB3DM(obj: ModelTileParserQueueItem) -> Promise<U3DTileset>
            처리 기준: 취소 뒤 적용하지 않은 배치 모델 파서 결과의 즉시 자원 해제 소유권은 정의되어 있지 않다. [확인 Q-012]
            의존:
                U3dLayer — 상속받은 렌더 문맥; 속성 읽기: {_drawArg}
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
                U3dLayer — 상속받은 앱·렌더 문맥; 속성 읽기: {_app, _drawArg}
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
                loader는 최초 호출 시에만 만들고 Draco 경로·작업자 수 4와 KTX2 경로를 설정한다. KTX2 미지원 상태이며 앱이 정의된 경우에만 renderer로 지원 여부를 판정한다. parse에는 애니메이션·카메라 건너뛰기를 지정한다.
                완료 callback은 재질이 truthy인 노드만 처리한다. 현재 고정 옵션 overrideMaterials=true이므로 기존 단일 또는 배열 원소 재질을 dispose한 뒤 mesh.material.depthWrite=true와 opacity<1에 따른 transparent를 설정한다. 재질 객체를 새로 만들거나 배열 원소별로 이 속성을 설정하지는 않는다.
                그 뒤 처분·요청 상태를 재검사하고 유효할 때만 결과 type=GLB와 buf.byteLength를 지정하여 후처리한다. 실패 경로는 타일로 reject한다.

    내부 파싱 결과 연결
        #afterParseB3DM(result: B3DMParseResult, info: ParserInfo) -> void
            의존:
                U3dLayer — 상속받고 모델 레이어에서 보정한 렌더 순서; 속성 읽기: {_renderOrder}
                defined — scene·배치 정보·refine·그룹 설정 존재 여부 판정; 함수: {defined()}
                U3dMessage — scene 누락 오류 기록; 정적 함수: {error()}
                THREE — 순회 callback의 메시 판정; 생성자: {Mesh}
                U3DTilesMesh — BIM 레벨·목록 설정; 함수: {setBIMLevelLengthList(), setMakeLevel()}
                TILES_TYPE — 타일 형식 지정; 상수: {B3DM}
            동작:
                정의된 batchTable·type만 scene 사용자 데이터에 연결하고 meshes·unitMeshes가 falsy이면 각각 빈 배열로 준비한다. 위치 계산을 호출하되 반환 Promise를 기다리지 않는다.
                위치 계산의 순회 callback은 THREE.Mesh에서만 렌더 순서와 URL을 연결한다. _batchGroup이 정의되었으면 해당 이름의 항목이 있을 때만 그룹·레벨 정보를 적용하되 _isBIM은 항목 유무와 무관하게 true로 만든다. 배치 그룹이 없을 때는 등록 형식이 BIM인 경우만 _isBIM=true다. 재질 보정 결과를 unitMeshes에 추가하고 _tileset을 연결한다.
                타일 type은 B3DM으로 지정하고 refine이 정의되지 않은 경우에만 REPLACE로 설정한다. object.byteLength에 결과 크기를 저장하고 meshes에 object를 추가한 뒤 목록 byteLength가 truthy이면 더하고 아니면 이번 크기로 대입한다. _setLevelGroup이 정의되어 있고 truthy일 때만 그룹 구성을 수행한다. batchGroupPath가 정의되었으면 레벨 수-1부터 0까지 구성하고 false 결과에서 중단하며, 경로가 없으면 그룹을 해제한다.

        #afterParseI3DM(result: I3DMParseResult, info: ParserInfo) -> void
            의존:
                U3dLayer — 상속받고 모델 레이어에서 보정한 렌더 순서; 속성 읽기: {_renderOrder}
                defined — 배치 정보·형식·refine 존재 여부 판정; 함수: {defined()}
                TILES_TYPE — 타일 형식 지정; 상수: {I3DM}
            동작: 정의된 batchTable·type만 scene 사용자 데이터에 연결하고 렌더 순서를 지정한 뒤 위치 계산을 호출하되 반환 Promise를 기다리지 않는다. meshes와 unitMeshes가 falsy이면 빈 배열로 준비한다. type은 I3DM으로 지정하고 refine이 정의되지 않았을 때만 REPLACE로 설정한다. object.byteLength를 결과 크기로 지정하고 meshes에 추가한 뒤 목록 byteLength가 truthy이면 더하고 아니면 이번 크기로 대입한다. scene 자신을 unitMeshes에도 추가한다.

        #afterParsePNTS(result: PNTSParseResult, info: ParserInfo) -> void
            의존:
                U3dLayer — 상속받고 모델 레이어에서 보정한 렌더 순서; 속성 읽기: {_renderOrder}
                defined — point·배치 정보·형식·refine 존재 여부 판정; 함수: {defined()}
                U3dMessage — point 누락 오류 기록; 정적 함수: {error()}
                THREE — 순회 callback의 점 객체 판정; 생성자: {Points}
                TILES_TYPE — 타일 형식 지정; 상수: {PNTS}
            동작:
                정의된 batchTable·type만 point 사용자 데이터에 연결하고 meshes·unitMeshes가 falsy이면 각각 빈 배열로 준비한다. 위치 계산을 호출하되 반환 Promise를 기다리지 않는다.
                위치 계산의 순회 callback은 THREE.Points일 때만 렌더 순서·URL·tileset 참조를 연결하고 unitMeshes에 추가한다.
                type을 PNTS로 지정하고 refine이 정의되지 않았을 때만 REPLACE로 설정한다. object.byteLength에 결과 크기를 지정하고 meshes에 object를 추가하며 목록 byteLength가 truthy이면 더하고 아니면 이번 크기로 대입한다.

        #afterParseGLB(result: GLBParseResult, info: ParserInfo) -> void
            의존:
                U3dLayer — 상속받고 모델 레이어에서 보정한 렌더 순서; 속성 읽기: {_renderOrder}
                defined — scene·배치 정보·형식·refine 존재 여부 판정; 함수: {defined()}
                U3dMessage — scene 누락 오류 기록; 정적 함수: {error()}
                THREE — 순회 callback의 메시 판정; 생성자: {Mesh}
                TILES_TYPE — 타일 형식 지정; 상수: {GLB}
            동작:
                정의된 batchTable·type만 scene 사용자 데이터에 연결하고 meshes·unitMeshes가 falsy이면 각각 빈 배열로 준비한다. 위치 계산을 호출하되 반환 Promise를 기다리지 않는다.
                위치 계산의 순회 callback은 THREE.Mesh일 때만 렌더 순서·URL·tileset 참조를 연결하고 unitMeshes에 추가한다.
                type을 GLB로 지정하고 refine이 정의되지 않았을 때만 REPLACE로 설정한다. object.byteLength에 결과 크기를 지정하고 meshes에 object를 추가하며 목록 byteLength가 truthy이면 더하고 아니면 이번 크기로 대입한다.

        #setBatchLevelGroup(parent: UGroup, level: number) -> boolean
        #setUnGroup(group: UGroup) -> void
        #getReplaceTile(tile: U3DTileset) -> U3DTileset
    내부 진단
        __$testTileContentRequestLifecycle() -> boolean
            처리 기준: 실제 레이어의 타일·캐시·로더 상태를 변경하지 않고 격리된 가짜 상태를 사용한다.
            의존: deferred — 공유 요청 완료·실패를 관찰할 격리 Deferred 생성; 함수: {deferred()}
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
            처리 기준: UTestManager.execTestLayer()가 직접 클래스의 __$test 메서드를 수집하여 실제 인스턴스에 바인딩해 실행한다.
            의존:
                U3dLayer — 상속받은 렌더 그룹; 속성 읽기: {_group}
                UGroup — 레이어 장면 그룹 계층 조회; 속성 읽기: {_group.children}
                U3DTilesMesh — 렌더 메시 종류와 연결 tileset 판정; 생성자: {U3DTilesMesh}; 속성 읽기: {_tileset}
                Host global __GError__ — 그룹·메시·타일 상태 위반 기록; 함수: {__GError__()}
            동작: 현재 그룹의 4단계 계층을 순회한다. 각 그룹·객체의 visible이 falsy이거나 마지막 노드가 U3DTilesMesh가 아니거나 메시·연결 tileset이 숨겨졌거나 tileset이 없거나 disposed이면 오류를 기록하고 해당 분기의 다음 형제로 진행한다. 마지막 타일에 부모가 있을 때만 부모 표시 적합성을 검사한다. 위반이 하나라도 있으면 false, 없으면 true다.

_rad(deg: number) -> number
    동작: deg에 Math.PI를 곱한 뒤 180으로 나누어 라디안 값을 반환한다.

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
    promise: DeferredObject<U3DTileset>
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
        타일별 screen-space error 보정 배수를 반환한다. update()에서는 레이어를 this로 하고 루트를 받으며, INTERNAL.checkTileDetail()에서는 TileCheckContext를 this로 하고 판정 타일을 받는다.

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

ModelTileCameraOwner 타입 정의
    기반 타입: Pick<U3dModelTilesLayer, '_curPostion' | '_prevPostion' | 'getUpdateId'>
    비공개 계산에 전달하는 레이어의 상태·조작 범위다.

ModelTileDepthOwner 타입 정의
    기반 타입: Pick<U3dModelTilesLayer, 'checkTile'>
    비공개 계산에 전달하는 레이어의 상태·조작 범위다.

ModelTileErrorOwner 타입 정의
    기반 타입: Pick<U3dModelTilesLayer, '_geometricError'>
    비공개 계산에 전달하는 레이어의 상태·조작 범위다.

ModelTileTraversalOwner 타입 정의
    기반 타입: Pick<U3dModelTilesLayer, '_drawArg'>
    비공개 계산에 전달하는 레이어의 상태·조작 범위다.

ModelTileMeshOwner 타입 정의
    기반 타입: Pick<U3dModelTilesLayer, '_app' | '_opacity' | 'getName'>
    비공개 계산에 전달하는 레이어의 상태·조작 범위다.

ModelTileBatchOwner 타입 정의
    기반 타입: Pick<U3dModelTilesLayer, 'getBIMLevelLengthList' | 'getMakeLevel'>
    비공개 계산에 전달하는 레이어의 상태·조작 범위다.

ModelTileOpacityOwner 타입 정의
    기반 타입: Pick<U3dModelTilesLayer, '_rootTileSet' | '_dataCache'>
    비공개 계산에 전달하는 레이어의 상태·조작 범위다.

ModelTilePriorityOwner 타입 정의
    기반 타입: Pick<U3dModelTilesLayer, 'distanceToCameraPosition'>
    비공개 계산에 전달하는 레이어의 상태·조작 범위다.

ModelTileTransformInfo 타입 정의
    tile: U3DTileset
        변환을 찾거나 합성할 타일이다.

ModelTileBoundInfo 타입 정의
    center: Vector3
        원본 월드 구 중심 참조다.
    gCenter: Vector3Like
        box이면 원본 지리 중심, region이면 좌표 변환 결과다.
    radius: number
        월드 구 반지름이다.
    parent: U3DTileset
        경계를 제공한 원본 타일이다.

ModelTileCalculationInfo 타입 정의
    tile: U3DTileset
    localBox: Box3
    layerQuaternion: Quaternion
    geographic: Vector3Like
    editCenter, useTranslation: boolean
    callback?: (this: U3dModelTilesLayer, object: ModelMesh) -> void
        메시 순회의 공유 상태이며 콜백은 원본 레이어를 this로 받아 각 노드의 자식 순회 전에 실행된다.

ModelTileBatchResult 타입 정의
    batchTable: unknown
        메시 사용자 데이터에 그대로 연결할 파싱 결과의 배치 테이블이다.

U3dModelTilesLayerCO 타입 정의
    기반 타입: U3dModelLayerCO & U3dModelTilesLayerCO_Content
    모델 레이어 설정과 타일별 설정을 결합한다.

U3dModelTilesLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        baseUrl?, baseurl?: string
            타일 주소의 정본과 기존 표기이며 어느 쪽이든 입력할 수 있다.
        name: string
            레이어 이름이다.
        baseName?, basename?: string
            콘텐츠 기준 이름의 정본과 기존 표기다.
        apiKey?, apikey?: string
            요청 URL에 그대로 덧붙일 인증 문자열이며 생략하면 빈 문자열이다.
        useBox?, usebox?: boolean
            경계 도우미 표시 여부이며 생략하면 false다.
        proxyUrl?, proxyurl?: string
            프록시 접두 주소이며 생략하면 ./proxy.jsp?url=이다.
        useProxy?, useproxy?: boolean
            프록시 사용 여부이며 생략하면 false다.
        rotation?: DegreeEulerLike
            추가 회전, 도 단위이며 falsy 입력은 영 회전으로 대체한다.
        heightOffset?: number
            추가 높이, 미터 단위이며 falsy 입력은 0으로 대체한다.
        maximumScreenSpaceError?: number = 32
            세분화에 사용할 최대 화면 공간 오차다.
        viewSizeOffset?: number | viewSizeOffsetFunction
            화면 오차 배수 또는 계산 함수이며 입력은 viewSizeOffset()이 정규화한다.
        renderOrder?: number
            메시 렌더 순서다.
        cacheSize?: number = 500
            타일 메시 캐시의 최대 항목 수다.
        updateCycleTime?: number = 200
            타일 탐색 갱신 간격, 밀리초다.
        autoHeight?: boolean = false
            중심점의 지형 높이를 레이어 높이에 반영할지 여부다.
        batchGroupPath?: string
            배치 그룹 JSON 경로다.
        setLevelGroup?: boolean = false
            BIM 이름별 그룹 계층 생성 여부다.
        type?: string = "3dtiles"
            등록 형식이며 BIM 형식은 3dtiles_BIM이다.
        makeLevel?: number
            생략하면 분류표 항목 수에서 1을 뺀 값이며 getMakeLevel()은 명시한 0도 자동 계산한다. [확인 Q-005]
        bimLevelLengthList?, BIMLevelLengthList?: Record<number, number> | Array<number>
            단계별 이름 길이의 정본과 기존 표기다.

```

## 4. 공통 처리 기준과 제약

```spec
initialize()와 update() 실행 전에는 setApp()으로 앱, 장면과 draw argument가 연결되어야 한다.
타일 탐색의 한 updateId 안에서는 #createCheckContext()로 만든 카메라·프러스텀·SSE 문맥을 재귀 탐색 전체가 공유한다.
탐색 callback은 updateId로 이전 세대의 장면 연결을 차단하지만, 같은 타일 ID와 sourceUrl의 다운로드·파싱은 _activeTileContentRequests의 기존 상태를 새 세대가 이어받는다.
아직 WorkProcess 큐에 있는 작업은 최신 세대가 이어받지 않았을 때 제거하고, 시작된 다운로드는 updateId 변경만으로 abort하지 않는다.
disposeTile(), removeAllTiles(), clear(), refresh()와 dispose()에서 타일이 실제로 불필요해진 경우에만 저장된 최종 requestUrl로 네트워크 취소를 전달한다.
동일 URL의 메시 자원은 _dataCache에서 공유되며 캐시 보유 여부에 따라 disposeTile()이 참조 해제 또는 완전 삭제를 선택한다.
ADD refine은 완료된 타일을 독립적으로 표시하고 REPLACE refine은 같은 부모의 대상 타일 완료를 모아 교체한다.
VCTR 본문 파싱은 기본 클래스의 책임 밖이며 하위 U3dVectorTileLayer가 addParserQueue()를 재정의해 처리한다.
위치 계산은 EPSG:4978, EPSG:4326과 월드 좌표(EPSG:3857) 변환 지원을 전제로 한다.
배치 그룹 레벨 재구성은 메시와 그룹에 getBIMLevelLengthList(), setBIMLevelLengthList()와 setMakeLevel()이 제공된 상태를 전제로 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
