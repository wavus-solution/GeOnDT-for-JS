# USpeedModelFilter 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 책임

포인트 데이터의 밀도를 평면 정점에서 워커로 계산하고 RGBA 실수 텍스처와 색상 범례로 표시한다. 메시를 레이어에 연결하여 렌더 전 카메라 추적을 수행하고, 마우스로 평면을 탐색하여 위치·깊이·밀도 POI를 표시한다. 데이터에서 만든 키로 워커를 공유하고 참조 수가 0이 되면 해제한다.

### 1.2 주요 동작 방식

생성자는 밀도용 3중 버퍼와 워커를 준비한다. 생성 좌표로 계산 평면의 중심과 회전을 정한 뒤 평면 정점을 워커에 보내 첫 메시를 만든다. 이동하면 표시 위치를 먼저 바꾸고 정점을 세 구간으로 나누어 다시 계산한다. 계산 완료 시 텍스처를 교체한다. 기본 갱신 주기는 100ms이며 작업 중에는 추가 계산을 시작하지 않는다.

### 1.3 주요 사용처와 연계 대상

`GeOnDT.geom.USpeedModelFilter`로 공개된다. `service/underground/js/SpeedFilter.js`는 필터 생성·레이어 연결·위치 및 검색 제어를 수행한다. 기반 `U3dGeometry`는 공통 도형 상태와 이벤트를 제공하며, 실제 렌더링 대상은 별도 `THREE.Mesh`이다. 밀도 계산 자체는 `USpeedModelTask.js` 워커가 담당한다.

## 3. 정규 자연어 수도코드

```spec
USpeedModelFilterCO 타입 정의
    U3dGeometryCO와 USpeedModelFilterCO_Content를 교차한 생성 옵션이다.

USpeedModelFilterCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        width, height?: number = 50
        widthSegments, heightSegments?: number = 1000
        globalMinDensity, globalMaxDensity?: number
        useGlobalDensity?: boolean = true
        maxDistance?: number = 5000
        distanceFromCamera?: number = 50000
        followCamera?: boolean = false
        camera?: Camera
        updateMinDistance?: number = 100
        data?: Array<{position: Vector3Like}>
        onAfterUpdate?: (self: USpeedModelFilter, position: Vector3) => void
        verticalScale?: number = 1.0
        borderColor?: ColorRepresentation = 0xff0000
        borderOpacity?: number = 1.0
    followCamera를 제외한 옵션은 논리합 기본값을 적용하므로 false·0도 대체된다. [확인 Q-001]

USpeedModelFilterSearchInfo 타입 정의
    eventKey: string | null | undefined
    depthPOI, positionPOI, valuePOI: U3dPOI | null | undefined
    cursorPosition: Vector3 | undefined
    cursorUV: Vector2 | undefined
    cursorValue: number
        검색 이벤트 키, 표시 POI와 마지막 검색 결과를 보관한다.

USpeedModelFilterMesh_Content 타입 정의
    setScaleRatio: (ratio: number) => void
    setLayer: (layer: U3dLayer) => void

USpeedModelFilterMesh 타입 정의
    Mesh와 USpeedModelFilterMesh_Content의 교차 타입이다.

USpeedModelFilterDataBuffer_Content 타입 정의
    total, now: number
    buffer: () => Float32Array

USpeedModelFilterDataBuffer 타입 정의
    Record<number, Float32Array>와 USpeedModelFilterDataBuffer_Content의 교차 타입이다.

USpeedModelFilterDensityBuffer_Content 타입 정의
    min, max: number

USpeedModelFilterDensityBuffer 타입 정의
    Float32Array와 USpeedModelFilterDensityBuffer_Content의 교차 타입이다.

USpeedModelFilterEMI_Content 타입 정의
    SEARCH, BEFORE_UPDATE, UPDATE: string
        검색 결과와 밀도 계산 전후를 알리는 이벤트 이름이다. 발생 위치와 데이터는 각 실행에 따른다.

USpeedModelFilterEMI 타입 정의
    U3dGeometryEMI와 USpeedModelFilterEMI_Content의 교차 타입이다.

USpeedModelFilter extends U3dGeometry 클래스 정의
    의존:
        U3dGeometry — 공통 도형과 이벤트; 상속: {extends U3dGeometry}

    static EVENT: USpeedModelFilterEMI
        기반 EVENT를 재정의하며 SEARCH='search', UPDATE='update', BEFORE_UPDATE='beforeUpdate'를 더한다.
    static workers: Map<string, {worker: UTaskProcessor, count: number}>
        키별 공유 워커와 참조 수이다. 초기값은 빈 Map이다.
    isInitWorker: boolean = false
    #dummy: Object3D
    #distanceFromCamera: number = 10
    #followCamera: boolean = false
    #camera: Camera | undefined = undefined
    #worker: UTaskProcessor | undefined = undefined
    #prePosition, #preCameraPosition: Vector3
    #updateTime: number = 0
    #isWorkerWorking: boolean = false
    searchInfo: USpeedModelFilterSearchInfo
        초기 cursorValue는 0이고 나머지 필드는 undefined이다.
    #app: U3dApp | undefined = undefined
    #workerKey: string | undefined = undefined
    uuid, classtype, type: string
    width, height, widthSegments, heightSegments: number
    globalMinDensity, globalMaxDensity: number | undefined
    useGlobalDensity: boolean
    inputBuffer: {partSize: number, totalElements: number, splitPoints: Array<number>, chunks: Array<Float32Array>} | undefined
    dataBuffer: USpeedModelFilterDataBuffer | undefined
    maxDistance, updateMinDistance: number
    data: Array<{position: Vector3Like}> | undefined
    onAfterUpdate: Function | undefined
    verticalScale: number
    borderColor: Color
    borderOpacity: number
    filter: USpeedModelFilterMesh | undefined

    constructor(opt: USpeedModelFilterCO = {})
        의존:
            U3dGeometry — 기반 초기화; 생성자: {new U3dGeometry(opt)}
            UDEF — 식별자 생성; 정적 함수: {createUUID()}
            UTaskProcessor — 워커 풀; 생성자: {new UTaskProcessor()}; 함수: {allExecTask()}
            UWorkerParameter — 워커 요청; 생성자: {new UWorkerParameter()}
            THREE — 변환과 색상; 생성자: {Object3D(), Color()}
        동작:
            기반 생성 후 UUID를 만들고 type과 classtype을 USpeedModelFilter로 저장한다.
            크기·분할·거리·스케일·테두리 옵션은 falsy이면 타입에 기록한 기본값으로 대체한다. 전역 최소·최대 0은 undefined가 되고 useGlobalDensity=false도 true가 된다. followCamera만 nullish이면 false로 대체한다. [확인 Q-001]
            입력 분할 정보는 크기 0과 빈 배열로 시작한다. 정점 수 곱하기 4 길이의 Float32Array 세 개를 만든다. dataBuffer.buffer의 this는 dataBuffer이며 호출마다 now=(now+1)%3으로 이동한 버퍼를 반환한다.
            data는 opt.data 또는 빈 배열을 보관한다. 데이터 키를 계산한다.
            키가 있으면 공유 Map의 기존 참조 수를 증가시키거나 워커 3개의 풀을 만들어 initSearchIndex 요청에 data를 전달한다. 새 풀과 count=1을 Map에 기록하며 isInitWorker를 true로 바꾼다.
            onAfterUpdate와 카메라 옵션을 보관하고 dummy Object3D와 테두리 Color를 만든다. 콜백은 인스턴스 멤버 호출로 실행하므로 this는 필터 인스턴스이다.

    dispose() -> void
        의존:
            UTaskProcessor — 마지막 공유 워커 해제; 함수: {dispose()}
        동작:
            검색을 끄고 메시를 제거한다.
            inputBuffer와 dataBuffer를 undefined로 지운다. 저장된 키의 공유 참조 수를 감소시키고 0일 때 워커를 해제하고 Map에서 제거한다.
            worker, workerKey와 data를 undefined로 지우고 isInitWorker를 false로 만든다.

    getDistanceFromCamera() -> number
        동작: #distanceFromCamera를 반환한다.

    createFilter(position: Vector3 | {x: number, y: number, z: number}) -> Promise<USpeedModelFilterMesh | undefined> | undefined
        의존:
            THREE — 입력과 양 끝점; 생성자: {Vector3()}
        동작:
            입력이 falsy이면 undefined를 반환한다. isVector3가 없으면 x·y·z를 복사하여 벡터를 만든다.
            position이 있으면 입력을 두 번 복사하고 x에서 width/2를 빼거나 더한 양 끝점을 만들어 생성 결과를 반환한다.

    removeFilter() -> void
        동작: 메시 제거를 실행한다.

    getFilter() -> USpeedModelFilterMesh | undefined
        동작: filter 참조를 반환한다.

    setScaleRatio(ratio: number) -> void
        동작: verticalScale만 저장한다. 메시 변경은 메시 자체의 setScaleRatio 콜백 또는 위치 갱신에서 수행한다.

    getSearchInfo() -> USpeedModelFilterSearchInfo
        동작: searchInfo 원본 참조를 반환한다.

    async #createFilter() -> Promise<USpeedModelFilterMesh | undefined>
        의존:
            deferred — 완료 전달 객체; 함수: {deferred()}
            THREE — 세분화 평면; 생성자: {PlaneGeometry()}
        동작:
            입력 버퍼·출력 버퍼·워커 중 하나라도 없으면 undefined로 완료한다.
            크기와 분할 수로 평면을 만들고 정점 배열을 워커에 전달한다.
            성공하면 밀도를 버퍼와 텍스처로 변환하고 전역 최소·최대가 truthy이면 이를, 아니면 버퍼 최소·최대를 사용하여 재질과 메시를 만든다.
            현재 시각을 기록하고 작업 중 상태를 해제한 다음 렌더 전 콜백을 등록하고 메시로 resolve한다.
            실패하면 오류로 reject하며 이 경로는 작업 중 상태를 해제하지 않는다. [확인 Q-002]

    setApp(app: U3dApp) -> void
        동작: #app 참조를 저장한다.

    #createFilterMesh(geometry: PlaneGeometry, material: ShaderMaterial) -> USpeedModelFilterMesh
        의존:
            THREE — 표시 메시; 생성자: {Mesh()}
            UDEF — 렌더 순서; 속성 읽기: {RENDER_ORDER.SPEED_MODEL_FILTER}
            U3dGeometry — 메시 수신 객체로 레이어 연결 및 이름 조회; 함수: {setLayer()}; 속성 읽기: {name}
            U3dApp — 렌더 전 콜백 제거; 함수: {removeRenderBefore()}
        동작:
            받은 지오메트리와 재질로 메시를 만들고 이름과 렌더 순서를 설정한다.
            메시의 setScaleRatio 콜백은 필터의 비율을 저장하고 메시 z를 이전 scale.y로 나눈 뒤 새 비율을 곱하며 scale.y도 바꾼다.
            메시의 setLayer 콜백은 메시를 this로 하여 기반 setLayer를 호출한다. layer._app이 있으면 필터 app을 저장하고 렌더 콜백을 등록하며, 없고 기존 app이 있으면 콜백을 제거하고 app을 지운다.
            frustumCulled=false, userData.exceptAO=true로 설정한다. dummy의 위치·회전을 복사하고 위치 z와 scale.y에 verticalScale을 반영하여 반환한다.

    #removeFilter() -> void
        의존:
            U3dApp — 렌더 연결 제거; 함수: {removeRenderBefore()}
        동작:
            메시가 있으면 숨기고 geometry, 밀도 텍스처, 재질을 해제한다. 텍스처 uniform을 undefined로 바꾸고 부모에서 메시를 제거하며 filter를 undefined로 지운다.
            app이 있으면 UUID의 렌더 전 콜백을 제거한다.

    #setBeforeRender() -> void
        의존:
            U3dApp — 렌더 전 콜백 등록; 함수: {hasRenderBefore(), setRenderBefore()}
        동작:
            filter나 app이 없으면 종료한다. UUID 콜백이 없을 때 인스턴스에 바인딩한 프레임 갱신을 등록한다.

    #updateFilter(renderer: WebGLRenderer, scene: Scene, camera: Camera) -> void
        동작:
            카메라·필터·부모가 없거나 필터가 숨김이면 종료한다.
             #followCamera가 true이면 현재 렌더 카메라를 저장하고 추적 위치를 계산한다.

    #updatePositionFromCamera(force: boolean = false) -> void
        인터페이스: onAfterUpdate 호출의 this는 필터 인스턴스이다.
        의존:
            THREE — 정면 목표 위치; 생성자: {Vector3()}
            U3dGeometry — 갱신 전 이벤트; 함수: {dispatchEvent()}
        동작:
            필터가 없거나 미등록·숨김이면 종료한다. 카메라가 없거나 추적과 force가 모두 false이면 종료한다. force가 아니고 이전 카메라와의 거리가 updateMinDistance 미만이면 종료한다.
            force이면 이전 계산 위치를 원점으로 초기화한다. 현재 카메라 위치를 기록하고 카메라 정면 방향에 거리와 카메라 위치를 적용한다.
            목표 z를 -height/2로 대입하지만 dummy에는 목표 y만 반영한다. dummy 위치를 메시로 복사하고 z와 scale.y에 verticalScale을 반영한 뒤 onAfterUpdate가 있으면 호출한다.
            dummy와 이전 계산 위치의 거리가 updateMinDistance 미만이면 종료한다. BEFORE_UPDATE에 표시 위치의 복사본을 전달하고 dummy와 force로 계산 갱신을 호출한다.

    override setPosition(x: Vector3 | Vector3Like | number, y?: number, z?: number) -> void
        인터페이스: 부모와 호환되는 벡터 또는 숫자 X·Y·Z 인자 형식을 받되 기존 필터의 월드 좌표(EPSG:3857) 의미를 유지한다. 일반 좌표 객체도 받는다. 숫자 입력의 Y 생략값은 0이고 Z 생략값은 현재 계산 평면의 Z이다.
        동작: force=false로 공통 위치 설정을 실행한다.

    forceSetPosition(x: Vector3 | Vector3Like | number, y?: number, z?: number) -> void
        인터페이스: setPosition과 같은 좌표를 받으며 워커 중복 실행이나 완료 후 재실행을 강제하지 않는다.
        동작: force=true로 공통 위치 설정을 실행하여 100ms 갱신 제한만 우회한다.

    #setPosition(x: Vector3 | Vector3Like | number, y: number | undefined, z: number | undefined, force: boolean) -> void
        인터페이스: onAfterUpdate 호출의 this는 필터 인스턴스이다.
        의존:
            THREE — 숫자 또는 일반 객체 입력의 좌표 벡터; 생성자: {Vector3()}
            U3dGeometry — 갱신 전 이벤트; 함수: {dispatchEvent()}
        동작:
            x가 숫자가 아니면서 falsy이면 종료한다. 필터가 없거나 미등록·숨김이면 종료한다.
            x가 숫자이면 x·y·z로 새 벡터를 만들되 z가 undefined이면 dummy.position.z를 사용한다. 그 밖의 입력은 원본 참조를 사용한다.
            position.isVector3가 falsy이면 position.x와 position.y가 모두 truthy일 때만 두 성분과 dummy.position.z로 벡터를 만들고, 아니면 종료한다. 일반 객체의 입력 Z는 무시한다.
            메시 위치를 벡터로 바꾸고 z와 scale.y에 verticalScale을 반영한 뒤 BEFORE_UPDATE와 계산 갱신에 배율 적용 전 벡터를 전달한다.
            onAfterUpdate가 있으면 인스턴스와 표시 위치를 전달한다.
            부모 setPosition은 호출하지 않으므로 좌표 목록과 변환 필요 상태를 갱신하거나 CHANGE 이벤트를 추가하지 않는다. App 연결이나 좌표 변환도 요구하지 않는다.

    setFollowCamera(camera: Camera, enable: boolean = true, distance: number = 300000) -> void
        동작:
            camera가 falsy이면 종료한다. 카메라와 추적 여부를 보관하고 distance가 null이 아닐 때 거리를 저장한다.
            enable과 camera가 참이면 추적 위치를 갱신한다. 이후 카메라가 없으면 추적을 끈다.

    setDistanceFromCamera(distance: number, force: boolean = false) -> void
        동작:
            거리를 저장한다. 추적 또는 force가 참이고 카메라가 있으면 force=true로 추적 위치를 갱신한다.

    #updatePosition(position: Vector3, force: boolean = false) -> void
        동작:
            필터가 없거나 미등록·숨김이면 종료한다. 워커 작업 중이거나 버퍼 또는 워커가 없으면 종료한다.
            force가 아니고 마지막 갱신 후 100ms 미만이면 종료한다. 현재 시각을 기록하고 dummy의 x·y만 입력으로 바꾼 뒤 기존 z를 유지하여 월드 행렬을 갱신한다.
            데이터가 없거나 비었거나 메시·geometry가 없으면 종료한다. 정점의 전체 성분 수를 세 구간으로 나누며 앞의 두 구간 크기는 3의 배수로 내림하고 마지막 구간에 나머지를 둔다.
            분할 크기가 달라졌을 때만 원본 position 배열을 공유하는 세 subarray와 성분 단위 시작 오프셋을 캐시한다. this.filter.geometry가 있으면 dummy 위치를 복사해 두고 세 워커 계산을 요청한다.
            Promise.all 완료 시 작업 중 상태를 해제한다. 결과 세 개 중 하나라도 없으면 이전 계산 위치를 요청 당시 복사본으로 바꾸고 종료한다.
            this.filter.geometry가 있으면 존재하는 densityList들을 결합 버퍼로 만들고 마지막 결과의 currentPosition으로 완료 처리한다. 검색 활성 및 커서 위치가 있으면 커서 y를 dummy.y로 바꾸어 다시 조회한다.
            실패 시 작업 중 상태만 해제하며 오류를 다시 던지지 않는다.

    getPosition() -> Vector3 | undefined
        동작: 메시가 있으면 표시 위치의 복사본을 반환하고 없으면 undefined를 반환한다. 표시 위치의 z에는 verticalScale이 적용되어 있다.

    #completeTask(currentPosition: Array<number>, dataBuffer: USpeedModelFilterDensityBuffer | undefined) -> void
        의존:
            U3dGeometry — 계산 완료 이벤트; 함수: {dispatchEvent()}
        동작:
            필터가 없으면 종료한다. currentPosition을 모듈 공유 positionVec에 기록한다.
            filter와 this.filter.material.uniforms가 있으면 새 밀도 텍스처를 만든다. useGlobalDensity에 따라 전역 또는 버퍼 최소·최대를 userData와 해당 uniform에 기록한다. 기존 densityTexture uniform이 있으면 텍스처를 해제하고 새 것으로 교체하며 재질 갱신을 요청한다.
            dummy 회전을 메시로 복사하고 이전 계산 위치를 positionVec로 갱신한다. UPDATE에 공유 positionVec 참조를 전달한다. 메시 위치와 onAfterUpdate는 이 단계에서 바꾸거나 호출하지 않는다.

    setDensityRatio(ratio: number) -> void
        동작: 필터가 없으면 종료한다. 재질에 densityRatio uniform이 있을 때만 값을 설정한다. 현재 생성 재질에는 이 uniform이 없다.

    setUseGlobalDensity(value: boolean) -> void
        동작: useGlobalDensity를 저장한다.

    getUseGlobalDensity() -> boolean
        동작: useGlobalDensity를 반환한다.

    setMinDensity(value: number) -> void
        동작: 메시 재질에 minDensity uniform이 있으면 값을 바꾸고, 메시 유무와 관계없이 globalMinDensity를 저장한다.

    getMinDensity() -> number | undefined
        동작: globalMinDensity를 반환한다.

    setMaxDensity(value: number) -> void
        동작: 메시 재질에 maxDensity uniform이 있으면 값을 바꾸고, 메시 유무와 관계없이 globalMaxDensity를 저장한다.

    getMaxDensity() -> number | undefined
        동작: globalMaxDensity를 반환한다.

    setLegend(stops: Array<{value: number, color: ColorRepresentation}> = []) -> void
        의존:
            __GInfo__ — 범례 수 안내; 함수: {__GInfo__()}
            THREE — 범례 색상; 생성자: {Color()}
        동작:
            입력이 없거나 비었으면 종료한다. 10개 초과 시 5219860 안내를 출력하고 앞의 10개만 사용한다.
            각 항목의 color가 truthy이면 그것을, 아니면 항목 자체를 Color에 넣는다. value가 undefined이면 인덱스 곱하기 1000을 사용한다. 최소·최대를 구하고 10개 미만이면 마지막 색상과 값으로 배열을 채운다.
            필터가 없으면 종료한다. 존재하는 colorMap, valueMap, mapLength uniform에 배열과 실제 사용 개수를 저장한다.
            filter가 있는 경로에서 최소·최대가 각각 truthy일 때만 해당 설정을 바꾼다.

    setSimplify(simplify: boolean = false) -> void
        동작: 필터와 재질의 simplify uniform이 있을 때만 값을 바꾼다.

    setTopography(isTopo: boolean = false) -> void
        동작: 필터와 재질의 isTopo uniform이 있을 때만 값을 바꾼다.

    async #createCursorPOI() -> Promise<void>
        의존:
            U3dApp — 검색 표시 생성; 함수: {createPOI()}
            __GSError__ — 생성 오류 기록; 함수: {__GSError__()}
        동작:
            app이 없으면 종료한다. 깊이·위치·속도 POI 중 없는 항목을 현재 메시 위치로 순서대로 생성하여 searchInfo에 저장한다.
            생성 오류를 기록하고 다시 던지지 않는다.

    setVisibleSearchCursor(visible: boolean) -> void
        의존:
            U3dPOI — 표시 전환; 함수: {show(), hide()}
        동작: 메시 재질 uniforms가 있으면 isSearch를 1 또는 0으로 바꾼다. 존재하는 세 검색 POI를 visible에 따라 표시하거나 숨긴다.

    updateSearchCursor(worldPosition: Vector3, uv: Vector2 | undefined) -> void
        의존:
            U3dApp — 위치 표시 변환; 함수: {vector3ToGeoGraphic()}
            U3dPOI — 검색 위치와 문자열; 함수: {setPosition(), setLabel()}
            THREE — 검색 상태 생성; 생성자: {Vector3(), Vector2()}
        동작:
            worldPosition이 없거나 x 또는 z가 falsy이거나 uv가 없으면 종료한다. 가능한 경우 searchUv uniform을 갱신한다.
            공유 searchPOIVec에 위치를 복사하고 x에서 45000을 빼 깊이 POI에 전달한다. 깊이 문자열은 worldPosition.z를 메시 scale.y 또는 1로 나눠 정수로 표시한다.
            위치 POI와 app이 있으면 위경도로 변환하여 소수 두 자리 라벨을 만들고 복사 위치의 z에 25000을 더하여 배치한다.
            worldPosition과 uv가 있으면 UV의 밀도를 조회하고 cursorValue에 저장하되 falsy 값은 NaN으로 대체한다. 값 POI는 복사 위치의 z에서 2000을 빼고 x에 25000을 더해 배치하며 Vp를 소수 두 자리 m/s로 표시한다.
            cursorPosition이 없으면 새 Vector3를 저장한다.
            cursorUV가 없으면 새 Vector2를 저장한다.
            cursorPosition과 cursorUV에 입력 값을 복사한다.

    getFilterValue(uv: Vector2) -> number | undefined
        동작:
            uv나 dataBuffer가 없으면 undefined를 반환한다. 현재 버퍼에서 round(width*uv.x/(width/widthSegments))와 round(height*(1-uv.y)/(height/heightSegments))로 정점 인덱스를 구한다.
            행 우선 인덱스의 RGBA 첫 성분을 반환한다. UV 범위 제한은 수행하지 않는다.

    async enableMouseSearch(callback?: Function) -> Promise<void>
        인터페이스: callback은 position: Vector3 | null과 value: number | null을 가진 결과 객체를 받는다.
        의존:
            __GInfo__ — 중복·표시 불가 안내; 함수: {__GInfo__()}
            U3dApp — 이벤트·피킹·화면 갱신; 함수: {on(), getMapControl(), intersectFromScene(), drawDefault(), drawFast()}
            UMapControlBase — 조작 상태; 속성 읽기: {STATE.NONE}
            U3dGeometry — 검색 결과 이벤트; 함수: {dispatchEvent()}
        동작:
            이벤트 키가 있으면 5226313 안내 후 종료한다. app·메시·부모가 없거나 숨김이면 5226528 안내 후 종료한다.
            #app이 있으면 POI 생성을 기다리고 커서를 숨긴 뒤 mousemove 콜백을 등록하고 반환 키를 저장한다.
            콜백에서 app·메시·부모가 없거나 숨김이면 커서를 숨기고 종료한다. 지도 조작 상태가 NONE이 아니면 숨기고 현재 시각을 기록한다. 마지막 조작부터 400ms 미만이면 종료한다.
            필터만 피킹한다. 교차점이 없으면 함수인 callback에 position=null과 value=null을 전달하고 커서를 숨기며 기본 그리기를 호출한다.
            #app이 있고 교차점이 있으면 첫 점의 위치·UV로 검색 커서를 갱신하고 표시한다. cursorPosition 또는 null과 cursorValue를 SEARCH 이벤트와 함수인 callback에 전달하고 빠른 그리기를 호출한다.

    #clearSearchInfo() -> void
        의존:
            U3dPOI — 검색 표시 해제; 함수: {hide()}
            U3dApp — 검색 POI 제거; 함수: {removePOI()}
        동작:
            depthPOI가 있으면 숨기고 app을 통해 제거한 뒤 depthPOI를 undefined로 지운다.
            positionPOI가 있으면 숨기고 app을 통해 제거한 뒤 positionPOI를 undefined로 지운다.
            valuePOI가 있으면 숨기고 app을 통해 제거한 뒤 valuePOI를 undefined로 지운다.
            app이 없는 경우 각 제거 호출만 생략한다.
            cursorPosition과 eventKey를 undefined로 지우고 cursorValue를 0으로 바꾼다. cursorUV는 유지한다.

    disableMouseSearch() -> void
        의존:
            U3dApp — 검색 이벤트 제거와 화면 갱신; 함수: {unkey(), drawDefault()}
        동작:
            이벤트 키와 app이 있으면 mousemove 등록을 해제하고 기본 그리기를 호출한 뒤 키를 지운다.
            커서를 숨기고 검색 정보를 지운다.

    async createFilterByCoordinate(startPosition: Vector3 | {x: number, y: number, z: number}, endPosition: Vector3 | {x: number, y: number, z: number}) -> Promise<USpeedModelFilterMesh | undefined>
        의존:
            deferred — 완료 전달 객체; 함수: {deferred()}
            THREE — 기준축과 회전; 생성자: {Vector3(), Matrix4()}
            __GSError__ — 생성 오류 기록; 함수: {__GSError__()}
        동작:
            버퍼·워커·양 끝점이 없거나 데이터가 비었으면 deferred.reject() 결과를 반환한다.
            Vector3 인스턴스가 아닌 입력만 복사한다. 양 끝점의 평균을 dummy 위치로 저장한 후 두 입력 벡터의 z를 0으로 바꾼다. 따라서 Vector3 원본도 변경된다.
            끝점 차이를 정규화한 x축의 길이 제곱이 0이면 reject하지만 후속 실행은 계속된다. [확인 Q-003]
            위쪽 축 (0,0,1)과 교차곱으로 직교축을 만들어 dummy 회전을 설정한다. 메시 생성 완료 시 filter로 resolve하며 실패 시 오류 기록 후 reject한다.

    #getDensityValueWebWorker(array: ArrayLike<number>, offset?: number) -> Promise<{densityList: Array<number>, currentPosition: Array<number>}>
        의존:
            deferred — 계산 완료 전달; 함수: {deferred()}
            UTaskProcessor — 비동기 계산; 함수: {scheduleTask()}
            UWorkerParameter — 계산 요청; 생성자: {new UWorkerParameter()}
        동작:
            워커가 없으면 deferred.reject() 결과를 반환한다. dummy 월드 행렬을 갱신하고 복사하며 작업 중 상태를 true로 바꾼다.
            calculateDensities 요청에 정점 배열, 행렬 성분, maxDistance, dummy 위치 배열, 성분 오프셋과 updateTime을 넣어 예약한다.
            성공·실패를 deferred의 resolve·reject로 전달한다. 이 함수 자체는 작업 중 상태를 해제하지 않는다.

    #setDataBuffer(...dataList: Array<number>) -> USpeedModelFilterDensityBuffer | undefined
        동작:
            배열 인자가 없으면 undefined를 반환한다. 다음 순환 버퍼를 얻어 입력 배열 순서대로 밀도를 R에, 0을 G와 B에, 1을 A에 기록한다.
            0을 제외한 값에서 min·max를 구하여 버퍼 속성으로 부착하고 반환한다. 유효 값이 없으면 Infinity와 -Infinity를 유지한다.

    #createDensityTexture(dataBuffer?: USpeedModelFilterDensityBuffer) -> DataTexture
        의존:
            THREE — 밀도 텍스처; 생성자: {DataTexture()}; 속성 읽기: {RGBAFormat, FloatType, LinearFilter}
        동작:
            입력이 falsy이면 다음 순환 버퍼를 사용한다. 폭 widthSegments+1, 높이 heightSegments+1의 RGBA Float 텍스처를 만든다.
            flipY=true, 최소·확대 필터 LinearFilter, needsUpdate=true로 설정하고 버퍼 min·max를 텍스처에도 부착하여 반환한다.

    #createDensityMaterial(densityTexture: DataTexture, minDensity: number, maxDensity: number, width: number, height: number) -> ShaderMaterial
        의존:
            THREE — 밀도 재질과 초기 범례; 생성자: {ShaderMaterial(), Vector2(), Color()}; 속성 읽기: {NormalBlending, DoubleSide}
        동작:
            최소와 최대 사이를 10등분한 각 구간 끝값을 valueMap으로 만든다. 색상은 ff0000, FF8241, A5F59B, 8CFAAA, 3CEBD2, 0AA5EB, 5A37FA, 12075A, 12075A, 12075A이다.
            transparent=true, NormalBlending, depthTest=true, depthWrite=true, DoubleSide의 재질을 만든다. uniform에는 밀도 텍스처·최소·최대·mapLength=10, simplify=false, isTopo=false, searchUv=(0,0), isSearch=0, planeSize=(width,height), searchThickness=100, depthOffset=0을 둔다.
            정점 셰이더는 UV를 전달하고 모델·뷰·투영 행렬과 로그 깊이·깊이 오프셋 코드를 적용한다.
            색상 계산은 최소 또는 첫 범례 이하를 첫 색상, 최대 또는 마지막 범례 이상을 마지막 색상으로 한다. 중간 구간은 연속 모드에서 선형 보간하고 simplify 모드에서는 구간 시작 색상을 쓴다.
            지형 모드이면 UV의 y-0.003과 x-0.0007 위치에서 단순화 색상을 비교하고 차이가 0.0001 이상이면 붉은 경계를 표시한다.
            밀도 절댓값 0.000001 이상인 셀만 알파 1이고 나머지는 0이다. 검색 시 각 축 searchThickness/planeSize 폭의 십자선을 붉게 혼합한다. 빈 셀도 discard하지 않아 깊이를 기록한다. 로그 깊이 코드를 포함한 재질을 반환한다.

    static getWorkerKey(data: Array<{position: Vector3Like}>) -> string | undefined
        동작:
            배열이 아니거나 길이가 0이면 undefined를 반환한다. 해시를 0x811c9dc5로 시작하고 각 혼합은 입력을 32비트 정수로 만든 뒤 XOR 및 0x01000193 곱셈을 unsigned 32비트로 반영한다.
            바깥 배열을 max(1,floor(length/128)) 간격으로 끝까지 샘플링한다. 깊이가 3을 넘으면 0xdeadbeef, nullish이면 0x12345678을 혼합한다.
            수는 비유한일 때 0x7fffffff, 아니면 round(num*1e-2)를 혼합한다. 문자열은 앞 16개 문자 코드와 전체 길이, boolean은 1 또는 0, bigint는 문자열로 처리한다.
            숫자 x·y·z 객체는 0x01과 각 성분을 혼합한다. 배열은 0x02와 길이를 섞고 max(1,floor(length/8)) 간격으로 최대 8개를 재귀 처리한다.
            일반 객체는 0x03과 키 수를 혼합하고 Object.keys 순서를 유지하여 같은 방식으로 최대 8개 키 이름·값을 재귀 처리한다. 함수·심벌 등 나머지는 0xabcdef를 혼합한다.
            바깥 배열 길이를 마지막으로 혼합하여 길이_16진수해시 문자열을 반환한다. 제한 샘플과 양자화 기반 키이므로 데이터 전체의 동일성을 보장하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
