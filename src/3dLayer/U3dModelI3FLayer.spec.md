# U3dModelI3FLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

`U3dModelI3FLayer`는 I3F 모델 정보 URL을 읽고 카메라 주변 타일을 검색하여 워커 로딩과 메시 생성을 두 작업 큐로 나누어 수행하는 모델 레이어다. `GeOnDT.model.U3dModelI3FLayer`로 제공되며 `tutorial-official/i3fModel.html`에서 사용한다. 타일 자료 해석은 `I3FTile`, 파일 파싱은 `I3fLoadTask`와 협력하고, 현재 단위는 읽어 온 자료의 장면 반영과 작업 취소·자원 해제를 담당한다.

## 3. 정규 자연어 수도코드

```spec
U3dI3FMeshRequest 부분 타입 명세
    이 명세에서 사용하는 필드:
        url: string
            같은 타일에서 요청을 구분하는 모델 파일 주소
        tile: I3FTile
            요청 소유 타일
        work?, parseWork?: U3dQuadTileWork
            각각 파일 로딩·장면 반영 단계의 취소 대상
        completion?: DeferredPromise<void>
            현재 단계의 완료 제어 객체

TILE_MESH_REQUESTS: WeakMap<I3FTile, Map<string, U3dI3FMeshRequest>>
    타일과 URL별 현재 요청 레코드다. 해제 후 같은 타일을 재선택해도 이전 레코드는 새 요청을 소유하지 않는다.

__managerI3f: LoadingManager
    모듈 평가 시 한 번 만들며 레이어 인스턴스들이 _manager로 공유한다.
    의존: THREE.LoadingManager — 공유 로딩 관리자; 생성자: {new THREE.LoadingManager()}

__loaderI3f: UFileLoader
    모듈 평가 시 __managerI3f로 만들고 crossOrigin을 anonymous, 응답 형식을 arraybuffer로 설정한다. 레이어의 loader 초기 참조이며 getLayerInfo의 별도 JSON 로더는 이 객체를 사용하지 않는다.
    의존: UFileLoader — 공유 파일 로더; 생성자: {new UFileLoader()}; 함수: {setResponseType()}; 속성 쓰기: {crossOrigin}

UseGlobalDeleteMeshes: boolean = true
    삭제 대기열을 레이어끼리 공유하는 고정 선택값이다.

GlobalDeleteMeshes: Array = 빈 배열
    즉시 삭제하지 않은 그룹 묶음을 레이어끼리 공유한다.

TEMP_SPHERE: Sphere
    주변 검색과 작업 필터가 중심·반지름을 덮어쓰는 모듈 공유 임시 구다.
    의존: THREE.Sphere — 임시 검색 영역; 생성자: {new THREE.Sphere()}

U3dI3FColor 타입 정의
    r, g, b: number

U3dI3FMaterialGroup 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
        imagename?: string
        start, count: number
        color: U3dI3FColor

U3dI3FRenderObject 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
        box: Array<number>
            형상 경계의 축별 최솟값·최댓값 쌍이다.
        vertex, uvs, normals: Float32Array
        indices: Uint32Array
        color: U3dI3FColor
        position: Vector3Like
        imagename?: string
        isMerged?: boolean
        materialGroup?: Array<U3dI3FMaterialGroup>

U3dModelI3FLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 모델 레이어 기반; 상속: {U3dModelLayer}

    #processItems: Array<I3FTile> = 빈 배열
        현재 로딩 또는 표시 대상으로 선택한 타일이다.
    #searchNewTile: Set<I3FTile> = 빈 Set
        이번 검색에서 새로 추가할 타일이다.
    static g_TaskProcessor: UTaskProcessor
        클래스 평가 시 I3fLoadTask 경로와 동시 작업 수 3으로 생성하며 외부에서 교체할 수 있다.
        의존: UTaskProcessor — 공유 워커 작업 처리; 생성자: {new UTaskProcessor()}
    metaDataFunction: function | undefined
        메타데이터 수신 callback이며 외부에서 변경할 수 있다.
    initialized: boolean
        부모 생성 시 false이며 initialize의 성공 callback은 true, 거부 callback은 false를 기록한다. 외부에서도 상속 setter로 변경할 수 있다. update는 이 값이 falsy이면 타일 검색을 중단하고 truthy이면 나머지 사전 조건을 검사한다. default 방식의 삭제 대기열 처리는 이 상태 검사보다 먼저 실행한다.

    constructor(opt = {})
        인터페이스:
            baseurl은 I3F 모델 정보 URL이다. 선택 옵션 limitdistance의 공개 JSDoc 기본값은 220이다. [확인 Q-001]
            선택 옵션 useproxy의 공개 JSDoc 기본값은 true다. [확인 Q-009]
            그 밖의 공개 옵션은 searchoffestz·usebox·minlevel·maxlevel·_mindatalevel·maxdatalevel·modelDetail·proxyurl·typedeletemesh·needXml·metaDataFunction이다. modeldetail·fixcolor도 구현에서 읽는다.
        의존:
            U3dModelLayer — 기반 상태 생성; 생성자: {super()}
            defined — null·undefined 누락 여부 판정; 함수: {defined()}
            defaultValue — undefined 기본값 대체; 함수: {defaultValue()}
            U3dMessage — URL 누락 알림; 정적 함수: {info()}; 상수: {CNT.LAYER.NON_BASEURL}
            THREE — 영역·카메라 상태와 재질 종류; 생성자: {new THREE.Box3(), new THREE.Vector3()}; 속성 읽기: {MeshStandardMaterial, MeshLambertMaterial}
            UCheckTime — 갱신 간격 관리; 생성자: {new UCheckTime()}
            deferredPromise — 취소 상태 객체; 함수: {deferredPromise()}
        동작:
            부모 생성 후 _classtype을 정한다. baseurl이 null 또는 undefined이면 메시지 1683172를 기록하고 나머지 초기화 없이 반환한다.
            limitdistance가 undefined일 때만 280, searchoffestz는 -200, usebox는 false로 대체한다. null·0·false·빈 문자열은 그대로 저장한다.
            minlevel·maxlevel·_mindatalevel·maxdatalevel이 각각 undefined일 때만 15·17·17·17로 대체하여 저장한다.
            modelDetail이 truthy이면 그 값, 아니면 modeldetail을 선택한다. 선택 결과가 undefined일 때만 high로 대체한다. 최종값이 정확히 high이면 MeshStandardMaterial, 아니면 MeshLambertMaterial을 선택한다.
            fixcolor·proxyurl·useproxy·typedeletemesh·needXml이 각각 undefined일 때만 undefined·'./proxy.jsp?url='·false·immediate·true로 대체하여 저장한다.
            _url에는 입력 baseurl을 보관하고 마지막 슬래시까지 _baseUrl로 저장한다. _crs를 EPSG:3857로 정한다.
            빈 경계 Box3, 객체·상태·재질 사전, 타일 목록, 삭제 배열, 워커 URL 사전을 만든다. 루트·현재 위치는 undefined이며 전역 재질 사용·변경 플래그·병합 사용은 false다.
            metaDataFunction을 보관하고 원점 카메라 벡터와 시간 검사기를 만든다. metaDataFunction의 null도 그대로 보관한다.
            모듈 공유 LoadingManager와 arraybuffer용 UFileLoader 참조를 보관하고 취소용 deferred를 만든다.

    get BaseUrl() -> string
        동작: _baseUrl을 반환한다.
    get ProxyUrl() -> string
        동작: _useproxy가 truthy이면 _proxyurl을, 아니면 빈 문자열을 반환한다.
    get StateObjects() -> object
        동작: _stateObjects 원본 사전을 반환한다.
    get Objects() -> object
        동작: _objects 원본 사전을 반환한다.
    get MinLevel() -> number
        동작: _minlevel을 반환한다.
    set MinLevel(value: number) -> void
        동작: _minlevel에 입력을 그대로 저장한다.
    get MaxLevel() -> number
        동작: _maxlevel을 반환한다.
    set MaxLevel(value: number) -> void
        동작: _maxlevel에 입력을 그대로 저장한다.
    get MinDataLevel() -> number
        동작: _mindatalevel을 반환한다.
    set MinDataLevel(value: number) -> void
        동작: _mindatalevel에 입력을 그대로 저장한다.
    get MaxDataLevel() -> number
        동작: _maxdatalevel을 반환한다.
    set MaxDataLevel(value: number) -> void
        동작: _maxdatalevel에 입력을 그대로 저장한다.
    get UseGlobalMaterial() -> boolean
        동작: _useGlobalMaterial을 반환한다.
    set UseGlobalMaterial(value: boolean) -> void
        동작: _useGlobalMaterial에 입력을 그대로 저장한다.
    get loader() -> UFileLoader
        동작: _loader를 반환한다.
    set loader(value: UFileLoader) -> void
        동작: _loader에 입력을 그대로 저장한다. getLayerInfo는 이 값 대신 별도 로더를 생성한다.
    get limitDistance() -> number
        동작: _limitDistance를 반환한다.
    set limitDistance(value: number) -> void
        동작: _limitDistance에 입력을 그대로 저장한다. 변경 플래그는 켜지 않는다.
    get curPosition()
        동작: _curPosition을 반환한다.
    set curPosition(value) -> void
        인터페이스: 초기값은 undefined이며 현재 단위는 외부 입력을 저장·반환할 뿐 별도 형태를 선언하거나 검사하지 않는다.
        동작: _curPosition에 입력 참조를 그대로 저장한다.
    get useBox() -> boolean
        동작: _useBox를 반환한다.
    set useBox(value: boolean) -> void
        동작: _useBox에 입력을 그대로 저장한다.
    get typeDeleteMesh() -> string
        동작: _typeDeleteMesh를 반환한다.
    set typeDeleteMesh(value: string) -> void
        동작: _typeDeleteMesh에 입력을 그대로 저장한다.
    get deleteMeshes() -> Array
        동작: _deleteMeshes 원본 배열을 반환한다.
    set deleteMeshes(value: Array) -> void
        동작: _deleteMeshes에 입력 참조를 그대로 저장한다.
    get fixColor() -> ColorRepresentation | undefined
        동작: _fixColor를 반환한다.
    set fixColor(value: ColorRepresentation | undefined) -> void
        동작: _fixColor에 입력을 그대로 저장한다. 기존 재질을 순회하여 바꾸지는 않는다.
    get searchOffsetZ() -> number
        동작: _searchOffsetZ를 반환한다.
    set searchOffsetZ(value: number) -> void
        동작: _searchOffsetZ에 입력을 그대로 저장한다. 현재 검색 계산은 이 값을 읽지 않는다.

    override initialize() -> void
        의존:
            U3dLayer — 초기화·완료 상태와 수명; 함수: {initialize(), isReady(), _resolveReady(), _rejectReady()}; 속성 읽기: {_disposed}; 속성 쓰기: {initialized}
            defined — 값 존재 여부; 함수: {defined()}
            U3dMessage — 레이어 정보 실패 알림; 정적 함수: {info()}; 상수: {CNT.LAYER.ERROR_LOAD_LAYER}
        동작:
            부모 initialize를 인수 없이 호출하여 부모의 초기화 상태·이벤트를 먼저 반영하고 ProxyUrl과 _url을 이어 getLayerInfo에 URL을 전달한다.
            성공 callback 진입 시 이미 해제되었으면 AbortError로 실패 처리하고 정보·경계·완료 상태를 반영하지 않는다.
            성공 callback에서 경계가 준비된 시점에 #computeRectangle을 호출할 callback을 만든다.
            initialized를 true로 정하고 _resolveReady가 정의되어 있으면 인수 없이 레이어 수신자로 호출한다. 성공 callback은 true를 반환하지만 initialize는 반환하지 않는다.
            성공 처리의 반환 Promise에 연결한 catch에서는 initialized를 false로 정하고 메시지 6811194를 기록한 뒤 _rejectReady가 정의되어 있으면 원래 실패 사유를 전달한다. callback은 false를 반환한다. 원래 요청에 성공·실패 분기를 따로 만들지 않는다.
            이미 완료한 레이어의 정보 반영 예외는 로그에 남기고 완료 상태를 유지한다.
            성공 callback의 정보 반영·영역 계산 예외를 직접 잡아 initialized를 false로 정하고 레이어 _rejectReady에 전달한 뒤 false를 반환한다. 레이어의 공통 완료 인터페이스가 실패 사유를 Error로 정규화한다.

    #computeRectangle() -> void
        의존:
            defined — 영역 정보 유무; 함수: {defined()}
            U3dMessage — 영역 누락 알림; 정적 함수: {info()}; 상수: {CNT.CMM.NON_BBOX}
            UMathEngine — 지도 영역 생성; 정적 함수: {createUGeoRect()}
            UDEF — 좌표계; 상수: {GOOGLE}
            THREE.Box3 — 누락된 경계 생성; 생성자: {new THREE.Box3()}
            U3dLayer — 지도 경계 상태; 속성 읽기: {_boundingBox}; 속성 쓰기: {_rectangle, _rectangle3d}
        동작:
            _boundingBox가 정의되지 않으면 메시지 3726520을 기록하고 종료한다.
            minx·miny·maxx·maxy와 축 차이 및 GOOGLE로 사각형을 만들어 _rectangle에 저장하고 _rectangle3d에도 같은 참조를 저장한다.
            _box3가 falsy일 때만 새 Box3를 만든다. 존재 여부와 관계없이 _box3.min·max를 경계의 xyz 값으로 갱신한다.
            readHeader_가 보관한 루트 Box3와 _box3는 같은 참조이므로 해당 경계를 제자리 변경한다. 기존 _sphere를 다시 계산하지 않는다.

    override show(show, refresh) -> void
        의존: U3dModelLayer — 표시 상태; 함수: {show()}
        동작:
            show가 정확히 false일 때 clear를 호출한다.
            부모 show에 두 인수를 전달하고 반환값은 전달하지 않는다.

    clear() -> void
        의존:
            defined — 루트 존재; 함수: {defined()}
            I3FTile — 타일 순회; 정적 함수: {traverse()}
        동작:
            #processItems를 새 빈 배열로 바꾸고 _change=true로 정한 뒤 이전 카메라 위치를 원점으로 정한다.
            _rootItem이 정의되어 있을 때만 트리의 각 타일을 삭제 처리한다.
            UseGlobalDeleteMeshes가 true이면 전역 삭제 배열, 아니면 deleteMeshes의 모든 기존 항목을 해제한다. 배열을 비우지는 않는다. [확인 Q-003]

    override update(drawArg: UDrawArg = this._drawArg, curTime: number, force: boolean = false) -> void
        의존:
            U3dLayer — 실행 가능 상태와 보관한 프레임 인수; 속성 읽기: {initialized, _drawArg, _disposed}
            UDrawArg — 카메라와 루트 가시성; 함수: {getCameraPosition(), intersectsSphere()}
            UCheckTime — 갱신 간격; 함수: {isUpdate(), updateTime()}
        동작:
            typeDeleteMesh가 default이면 선택된 전역 또는 인스턴스 삭제 배열이 비어 있지 않을 때 끝 항목 하나를 꺼내 해제한다.
            _disposed가 truthy이거나 initialized·_rootItem·drawArg·_rBush 중 falsy가 있으면 종료한다.
            루트 Sphere가 truthy이고 this._drawArg의 구 교차 결과가 false이면 현재 #processItems를 모두 삭제 처리한 뒤 배열 길이를 0으로 만들고 _change=true로 정하여 종료한다. 화면 안으로 복귀하면 위치가 같아도 다음 시간 검사에서 다시 검색할 수 있다.
            시간 검사기의 isUpdate가 true일 때만 카메라 이동과 주변 검색을 수행한다.
                force가 truthy일 때만 이전 카메라 위치를 원점으로 바꾼다.
                force와 관계없이 현재 카메라 위치를 얻어 이전 위치와 다르면 _change를 true로 정하고 이전 위치에 현재 위치를 복사한다.
                따라서 force가 truthy여도 검색을 무조건 실행하지는 않는다. 시간 검사를 통과한 뒤 카메라가 원점이 아니거나 _change가 이미 true여야 검색에 진입한다.
                _change가 true이면 다음 검색·등록을 수행한다.
                    _change를 false로 내린다.
                    기존 처리 타일이 후보 집합에 있으면 후보에서만 제거하고, 없으면 삭제 처리 후 #processItems에서 제거한다.
                    남은 후보의 disposed를 false로 정하고 #processItems에 추가한 뒤 URL 로딩 작업을 등록한다.
            조기 종료하지 않았으면 isUpdate 결과와 관계없이 updateTime(10)을 호출한다. curTime은 읽지 않는다.

    addQueueByMeshUrl(result: I3FTile) -> void
        인터페이스: 작업 실행기는 callback과 filter의 this를 selector인 레이어로 지정한다.
        의존:
            I3FTile — 파일 목록·작업·포함 판정; 속성 읽기: {Meshes, disposed, Sphere}; 속성 쓰기: {work}; 함수: {containBySphere()}
            U3dQuadTileWork — 작업 생성; 생성자: {new U3dQuadTileWork()}
            U3dModelLayer — 로딩 큐; 속성 읽기: {_workProcess}; 함수: {_workProcess.add()}
            UDrawArg — 필터 카메라; 함수: {getCameraPosition()}
            U3dLayer — 필터의 프레임 인수·진입 가능 상태; 속성 읽기: {_drawArg, _disposed, _visible}
            UDEF — 작업과 상태 상수; 상수: {_MSG_WORK._UPDATE_MESH_BUILDING, TILE_STATE._start}
            defined — 필터 입력 존재; 함수: {defined()}
        동작:
            레이어 _disposed가 truthy이거나 _visible이 false이거나 result.disposed가 truthy이면 종료한다.
            이 조건을 통과하면 각 Meshes에 다음 작업을 수행한다.
                _baseUrl + url에 객체 또는 상태가 이미 있으면 건너뛴다.
                타일·URL에 새 요청 레코드를 등록한다. selector를 레이어로 정하고 파일 정보·타일·URL·request를 parameter로 넣어 #loadMesh를 callback으로 등록한다.
                작업 cancel은 해당 요청을 취소한다. filter는 먼저 요청 소유권·표시 가능 상태를 확인하며 현재 요청이 아니면 즉시 false를 반환한다.
                현재 요청이고 info가 정의되고 타일이 미해제이며 URL 상태가 존재하면 카메라를 읽거나 가시성을 재검사하지 않고 즉시 true를 반환한다.
                위 조건이 false이면 카메라 중심 필터 구의 z를 타일 Sphere 중심 z로 바꾸고 타일의 containBySphere와 절두체 교차가 모두 true일 때 true를 반환한다.
                두 번째 판정은 disposed와 URL 등록 여부를 다시 요구하지 않는다. info가 없으면 무조건 false로 끝나는 것이 아니라 이후 info.tile 접근에서 예외가 발생할 수 있다.
                필터의 두 번째 판정도 탈락하면 이 요청을 취소하고 false를 반환한다.
                request.work와 tile.work에 새 작업을 기록하고 _workProcess.add 후 StateObjects[url]을 _start로 정한다. tile.work는 마지막 작업만 가리켜도 요청 사전에는 파일별 작업이 모두 남는다.

    addQueueByParsedMesh(url: string, tile: I3FTile, meshes: Array) -> void
        인터페이스: meshes는 properties와 children을 가진 파싱 결과 묶음의 배열이다. 작업 callback과 filter의 this는 레이어다.
        의존:
            I3FTile — 작업·가시성; 속성 읽기: {disposed, Sphere}; 속성 쓰기: {work2}; 함수: {containBySphere()}
            U3dQuadTileWork — 장면 반영 작업; 생성자: {new U3dQuadTileWork()}
            U3dModelLayer — 생성 큐; 속성 읽기: {_workProcess2}; 함수: {_workProcess2.add()}
            UDrawArg — 필터 카메라; 함수: {getCameraPosition()}
            U3dLayer — 필터의 프레임 인수·진입 가능 상태; 속성 읽기: {_drawArg, _disposed, _visible}
            UDEF — 작업 종류; 상수: {_MSG_WORK._UPDATE_MESH_BUILDING}
            defined — 필터 입력 존재; 함수: {defined()}
        동작:
            URL의 객체·상태가 없으면 종료한다.
            레이어 _disposed가 truthy이거나 _visible이 false이거나 tile.disposed가 truthy이면 종료한다.
            이 조건을 통과하면 다음 작업을 수행한다.
                타일·URL의 기존 요청을 이어받고 없을 때만 등록한다. 레이어 selector와 url·tile·meshes·request parameter로 작업을 만들고 #loadParsedMesh를 callback으로 등록한다.
                작업 cancel은 해당 요청을 취소한다. filter는 현재 요청인지 먼저 판정하고 아니면 false를 반환한다.
                현재 요청이고 info가 정의되고 타일이 미해제이며 URL 상태가 있으면 true를 반환한다.
                그렇지 않으면 실행기의 this._drawArg에서 카메라를 얻고 필터 구의 z를 타일 높이로 바꾼 뒤 타일 포함·절두체 교차가 모두 true일 때 true를 반환한다.
                이 두 번째 판정은 disposed·URL 등록 여부를 다시 검사하지 않는다. info가 없으면 이후 info.tile 접근에서 예외가 발생할 수 있다.
                필터의 두 번째 판정도 탈락하면 이 요청을 취소하고 false를 반환한다.
                request.parseWork와 tile.work2에 작업을 보관하고 _workProcess2에 추가한다.

    #createFilterSphereByPosition(camPos: Vector3, sphere: Sphere = new THREE.Sphere()) -> Sphere
        의존: THREE.Sphere — 필터 구 기본값; 생성자: {new THREE.Sphere()}
        동작: 입력 sphere 원본의 중심을 camPos로 복사하고 반지름을 limitDistance로 정한 뒤 같은 sphere를 반환한다.

    override dispose() -> Promise<boolean>
        의존:
            U3dModelLayer — 부모 해제; 함수: {dispose()}
            U3dLayer — 공유 워커 사용권의 신규 등록 차단과 반환; 함수: {_releaseTaskProcessors()}; 속성 쓰기: {_taskProcessorDisposing}
            defined — 색인·재질 존재; 함수: {defined()}
            RBush(_rBush) — 공간 색인 제거; 함수: {_rBush.clear()}
            THREE.Texture — 공유 텍스처 해제 시도; 함수: {dispose()}
        동작:
            _taskProcessorDisposing을 true로 정하여 새 공유 워커 사용을 차단하고 try에서 부모 dispose를 호출하여 반환 Promise를 보관한다.
            _rBush가 정의되어 있으면 색인을 비운다. 색인 존재 여부와 관계없이 이어서 레이어 clear를 호출한다.
            _materials가 정의되어 있으면 각 키에 대응하는 실제 항목의 texture를 검사하여 정의된 텍스처를 dispose하고 재질 사전을 새 빈 객체로 바꾼다.
            동기 정리가 끝나면 부모가 반환한 Promise를 그대로 반환한다. 기다리는 동작을 추가하지 않으며 동기 정리 중 예외가 나면 호출자에게 전달한다.
            정상 반환과 동기 예외 모두 finally에서 _releaseTaskProcessors를 호출하여 이 레이어의 공유 풀 사용권을 반환한다.

    getBoundingBox() -> Box3
        처리 기준: baseurl이 있는 생성 및 정상 헤더 처리를 마친 레이어의 경계다. 생성자가 조기 종료한 객체에는 이 메서드의 필드 준비가 보장되지 않는다.
        동작: _box3 원본 참조를 반환한다.

    getLayerInfo(url: string) -> Promise<object>
        인터페이스: 완료 값은 JSON 원본 참조이며 반환 객체는 UDEF.createPromise가 만든 deferred다.
        의존:
            UDEF — Promise 생성; 정적 함수: {createPromise()}
            UFileLoader — JSON 요청; 생성자: {new UFileLoader()}; 함수: {setResponseType(), load()}; 속성 쓰기: {crossOrigin}
        동작:
            UDEF.createPromise의 Yield 이후 callback에서 별도 UFileLoader를 만들고 crossOrigin anonymous·응답 json으로 URL을 요청한다. 오류 callback은 값 없이 reject한다.
            구성 호출이 반환하면 원본 data로 resolve한다.
            나중에 호출되는 onload 자체에는 try/catch가 없다. 헤더·색인 처리 예외는 이 메서드가 직접 reject로 바꾸지 않는다. 로더의 비동기 callback 오류 경로에 따라 반환 완료 객체가 대기 상태에 남을 수 있다. [확인 Q-010]

    #loadMesh(info) -> Promise<undefined> | undefined
        인터페이스: info의 tile·mesh.url·request를 사용한다. info.url은 읽지 않는다. request는 파일별 현재 소유권과 완료 객체를 보관한다.
        의존:
            UDEF — 파일 URL 검증; 정적 함수: {assert()}
            deferredPromise — 워커 완료 상태; 함수: {deferredPromise()}
            UTaskProcessor — 파일 파싱 예약; 함수: {scheduleTask()}
            U3dLayer — 공유 워커 사용권 확보와 해제 상태 검사; 함수: {_useTaskProcessor()}
            UWorkerParameter — 워커 요청; 생성자: {new UWorkerParameter()}
        동작:
            info.mesh.url을 assert하고 BaseUrl을 접두한다. 요청이 현재 소유자가 아니거나 타일이 절두체 밖이면 해당 요청을 취소하고 undefined를 반환한다.
            deferred를 만들어 request.completion에 저장하고 _modelUrlMap의 타일 id별 배열에 URL을 추가하며 이번 배열 참조를 보관한다.
            try에서 _useTaskProcessor로 공유 g_TaskProcessor의 레이어 사용권을 확보한 뒤 I3fLoadTask/load와 URL·_info.rect·_info.rect3d를 예약한다. 예약 단계의 동기 예외는 요청 취소와 이번 워커 기록 정리 후 거부된 deferred 반환으로 종결한다.
            워커 성공 callback에서 요청 소유권·절두체·items 존재를 다시 검사한다. 하나라도 탈락하면 요청을 취소하며, 통과하면 장면 반영 큐에 넘기고 값 없이 resolve한다. 장면 반영·텍스처 완료는 기다리지 않는다.
            워커 거부 또는 성공 callback 예외도 요청 취소 후 값 없이 reject한다.
            종료 시 tile.work가 이번 request.work와 같을 때만 지운다. id별 사전이 이번 URL 배열 참조와 같을 때만 첫 일치 URL을 제거하고 빈 배열을 지운다. 재선택이 만든 새 배열·작업은 건드리지 않는다.
            호출자에게 deferred를 반환한다. try보다 앞의 info·request·URL 검증에서 발생한 예외는 이 예약 실패 처리에 포함되지 않는다.

    #setMaterial(isColorSet: boolean, color: U3dI3FColor) -> MeshStandardMaterial | MeshLambertMaterial
        의존:
            THREE — 재질 구성과 색 적용; 생성자: {new MeshStandardMaterial(), new MeshLambertMaterial()}; 상수: {DoubleSide}; 함수: {Color.set()}
            U3dLayer — 표시 속성; 속성 읽기: {_opacity, _transparent}
            defined — 고정 색 존재; 함수: {defined()}
        동작:
            선택된 _modelMaterial 생성자로 DoubleSide·toneMapped false 재질을 만들고 metalness 0.5·roughness 0.1·레이어 opacity·transparent를 넣는다.
            fixColor가 정의되어 있으면 color.set(fixColor), 아니고 isColorSet이 truthy이면 color.set(color.r, color.g, color.b)를 호출한다. 재질을 반환한다.

    #setTexture(imageName: string, url: string, material: MeshStandardMaterial | MeshLambertMaterial, mesh: UMesh = null) -> void
        의존:
            defined — 이름·공유 재질 존재; 함수: {defined()}
            UDEF — 파일 경로 추출; 정적 함수: {getPath()}
            UTextureLoader — 개별 텍스처 요청; 생성자: {new UTextureLoader()}; 함수: {load()}
            THREE.Material — 텍스처 반영; 속성 쓰기: {map}
            UMesh — 로딩 중 표시 제어; 속성 쓰기: {visible}
        동작:
            imageName이 정의되고 길이가 양수일 때만 진행한다.
            UseGlobalMaterial이 truthy이고 이름의 재질 항목이 정의되며 texture가 truthy이면 그 texture를 material.map에 공유한다.
            그 외에는 mesh가 truthy일 때 visible을 false로 내리고 _proxyurl + URL의 디렉터리 + imageName을 요청한다. _useproxy는 검사하지 않는다.
            로드 완료 callback에서 material.map에 결과를 넣고 mesh가 truthy이면 visible을 true로 만든다. 실패 callback·dispose 이후 판정은 없다.

    #createUnitMesh(obj: U3dI3FRenderObject, url: string, group: UGroup, meshId: string) -> void
        인터페이스: meshId는 원본 응답의 객체 순번과 그 객체 안의 부품 순번을 담은 사용 메시 키다. url은 원본 I3F 파일을 구분한다.
        의존:
            UMesh — 장면 메시와 영속 키; 생성자: {new UMesh()}; 정적 함수: {_createPuid()}; 함수: {add(), setManualUpdate()}
            UGroup — 메시 등록; 함수: {add()}; 속성 읽기: {userData}
            U3dObject — 레이어 식별; 속성 읽기: {_name}
            UEventDispatcher — 로드 알림; 함수: {dispatchEvent()}
            U3dEvent — 이벤트 종류; 상수: {MESH.LOADED}
            UDEF — 모델 분류; 상수: {UMESH_TYPE._complexBuilding}
        동작:
            형상 생성 전에 layer 종류와 레이어 이름으로 데이터 사용자를 구분하고 url·meshId를 조합하여 puid를 만든다. 키가 유효하지 않으면 자원을 생성하기 전에 예외로 종료한다.
            isMerged가 truthy이면 각 materialGroup에 대해 uvs 길이가 0인지를 색 사용 조건으로 재질을 만들고 uvs가 있으며 imagename이 truthy이면 텍스처를 설정한다.
            병합 재질 순서에 맞춘 materialIndex와 start·count·name·imageName을 geometry.groups에 보관하고 재질 배열로 UMesh를 생성한다. 병합 경로의 텍스처 로딩에는 mesh를 전달하지 않아 메시 가시성을 내리지 않는다.
            비병합이면 단일 재질로 UMesh를 만든 뒤 uvs가 있으며 imagename이 truthy일 때 mesh를 포함하여 텍스처를 설정한다.
            재질 색·텍스처 선택은 uv attribute의 생성 성공 여부가 아니라 원본 obj.uvs.length로 판정한다. 임의 검사에서 uv가 제외되어도 텍스처 요청은 남을 수 있다.
            메시 위치를 obj.position으로, 그림자 수신·생성을 false로, isI3fMesh를 true로 정한다. 생성한 boxhelper가 null이 아닐 때만 helper를 메시 자식으로 추가한다.
            레이어 이름·complexBuilding 분류·puid를 메시 속성에 넣고 userData.fileName에 obj.name을 쓴 뒤 userData 전체를 group.userData 원본 참조로 바꾼다. userData 공유는 puid에 영향을 주지 않는다. [확인 Q-008]
            group에 메시를 추가하고 setManualUpdate 후 MESH.LOADED 이벤트를 발행한다.

    #loadParsedMesh(info) -> Promise<undefined>
        인터페이스: info.url·tile·mesh·request를 읽는다. request는 현재 파일 요청의 소유권과 두 단계 작업을 연결하며 반환 객체는 UDEF.createPromise의 deferred다.
        의존:
            UDEF — Promise와 완료 상태; 정적 함수: {createPromise()}; 상수: {TILE_STATE._end}
            defined — 타일·속성 존재; 함수: {defined()}
            UGroup — 그룹 생성과 장면 등록; 생성자: {new UGroup()}; 함수: {add(), setManualUpdate()}
            U3dLayer — 레이어 장면; 속성 읽기: {_group}
        동작:
            UDEF.createPromise가 Yield 이후 실행하는 callback에서 요청 소유권과 타일 절두체를 판정한다. 탈락하면 값 없이 reject 후 종료한다.
            각 items 항목마다 UGroup을 만들어 Objects[url] 배열에 먼저 등록하고 레이어 _group에 추가한 뒤 setManualUpdate를 호출한다. 메시 생성 중 이벤트가 숨김·해제를 요청해도 기존 타일 해제 경로가 진행 중 그룹을 찾을 수 있다.
            properties가 정의되면 own key를 group.userData에 복사한다. properties 유무와 관계없이 각 children으로 메시를 생성하며 원본 items의 x와 children의 k를 배열로 직렬화하여 사용 메시 키로 전달한다. 이름·좌표·자원이 같아도 두 위치가 다르면 구분하고 같은 파일의 같은 위치 재로딩은 같은 puid를 받는다.
            각 children 생성 직전과 각 그룹 완료 직전에 현재 요청인지 다시 확인하며 소유권을 잃었으면 값 없이 reject하고 종료한다.
            그룹 완료 시 StateObjects[url]을 _end로 정하고 tile.work2가 이번 request.parseWork와 같을 때만 지운다.
            전부 순회한 후 값 없이 resolve한다. 빈 items이면 상태와 work2는 바꾸지 않고 resolve한다.
            반환 완료 객체를 request.completion에 저장한다. 성공 시 타일·URL의 등록이 이번 request와 같은 경우만 제거하고 빈 타일 등록도 지운다. 실패 시 해당 요청을 취소한다.
            callback 예외는 UDEF.createPromise가 원래 사유로 reject하며 가시성·소유권 탈락의 값 없는 reject와 구분한다. 이미 추가된 그룹은 여기서 직접 되돌리지 않고 기존 타일 해제 경로가 회수한다.

    mergeVertices(tolerance: number, useClone: boolean) -> void
        의존: U3dModelBasicLayer — 형상 정점 병합; 함수: {prototype.mergeVertices.call()}
        동작: U3dModelBasicLayer.prototype.mergeVertices를 현재 레이어 this와 두 인수로 호출하며 반환값은 전달하지 않는다.

    setMetaData(mesh: UMesh) -> false | undefined
        인터페이스: metaDataFunction은 레이어를 this로 전체 메타데이터를 받으며 반환값은 사용하지 않는다.
        의존:
            defined — 자료 존재; 함수: {defined()}
            Web API — 속성 JSON 요청; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send()}; 속성 읽기: {status, responseText}; 속성 쓰기: {onload}
            U3dMessage — 요청 오류 알림; 정적 함수: {info()}; 상수: {CNT.LAYER.ERROR_LOAD_DATA}
        동작:
            mesh.userData가 정의되지 않았으면 종료한다. metaurl을 읽어 XMLHttpRequest를 만들고 JSON MIME을 설정한 뒤 비동기 GET으로 open한다.
            onload의 this는 XMLHttpRequest다. status가 200이면 responseText를 JSON.parse한다.
                파싱 결과가 정의되어 있을 때만 metaDataFunction의 함수 여부를 검사하여 호출하고 mesh._meta를 변경한다.
                    기존 mesh._meta가 정의되어 있으면 먼저 undefined로 만든다.
                    기존 _meta의 정의 여부와 관계없이 메타데이터의 mesh.userData.fileName 항목을 mesh._meta에 저장한다.
                파싱 결과가 null이면 callback과 _meta 변경을 모두 생략한다.
            status가 404이면 메시지 6825248을 기록하고 그 밖의 status는 무동작이다.
            같은 URL로 open을 다시 호출한 뒤 send한다. 동기 예외는 메시지 6825452를 기록하고 false를 반환하며 onload 내부 예외는 이 catch의 대상이 아니다.

deleteMesh_(self: U3dModelI3FLayer, mesh) -> void
    의존:
        THREE — 그룹·객체 종류와 자원 해제; 속성 읽기: {Group, Object3D}; 함수: {BufferGeometry.dispose(), Object3D.clear()}
        defined — 자원 유무; 함수: {defined()}
    동작:
        mesh가 배열이면 각 항목이 Group 또는 Object3D일 때 직접 자식들의 geometry·material만 해제하고 항목을 clear한다. Object3D의 하위 타입인 Mesh도 이 분기에 포함되므로 그 자신의 자원은 이 분기에서 해제하지 않는다. 삭제 대기열의 항목 자체는 제거하지 않는다. [확인 Q-003]
        배열의 그 밖의 항목은 자기 geometry·material을 해제한다.
        단일 입력은 Group일 때만 직접 자식 자원을 해제하고 clear한다. 그 밖은 입력과 해당 자원이 정의되어 있을 때 자기 geometry·material을 해제한다.
        재질 해제는 현재 레이어를 this로 deleteMaterial_에 맡긴다. 재귀적으로 모든 후손을 방문하지 않는다.

deleteMaterial_(material: Common_Material | Array<Common_Material>) -> void
    인터페이스: this는 해제 정책을 제공하는 U3dModelI3FLayer다. material은 메시의 재질 또는 재질 배열이며 material.dispose의 수신자는 레이어가 아니다.
    의존:
        THREE.Material(material) — 재질 해제; 함수: {dispose()}
        THREE.Texture(material.map) — 비공유 맵 해제; 함수: {dispose()}
    동작:
        배열이면 각 항목, 아니면 단일 재질을 대상으로 한다. this.UseGlobalMaterial이 falsy이고 map이 truthy일 때만 map을 먼저 dispose한다.
        map 해제 조건과 관계없이 재질을 dispose한다.

isFrustumByTile(self: U3dModelI3FLayer, tile: I3FTile) -> boolean
    의존:
        U3dLayer — 레이어 프레임 인수; 속성 읽기: {_drawArg}
        UDrawArg — 가시성 판정기; 속성 읽기: {_frustum}
        UFrustum — 타일 가시성; 함수: {intersectsSphere()}
        I3FTile — 타일 경계; 속성 읽기: {Sphere}
    동작: self._drawArg._frustum.intersectsSphere에 tile.Sphere를 전달한 결과를 반환한다.

processDeleteMesh(self: U3dModelI3FLayer, i3fTile: I3FTile) -> void
    의존:
        I3FTile — 취소 대상; 속성 읽기: {work, work2, id, Meshes}; 속성 쓰기: {disposed, work, work2}
        U3dQuadTileWork — 대기 작업 취소; 함수: {setActive()}
        UTaskProcessor — 진행 작업 중단; 함수: {allExecTask()}
        UWorkerParameter — 중단 요청; 생성자: {new UWorkerParameter()}
        UGroup — 장면에서 분리; 함수: {remove()}
        U3dLayer — 레이어 그룹; 속성 읽기: {_group}
    동작:
        i3fTile.disposed를 true로 정한다. 요청 사전이 있으면 파일별 모든 요청을 취소하여 큐와 완료 대기를 정리한다.
        i3fTile.work가 truthy이면 해당 작업을 비활성화하고 i3fTile.work를 undefined로 정한다.
        i3fTile.work2가 truthy이면 해당 작업을 비활성화하고 i3fTile.work2를 undefined로 정한다.
        id별 _modelUrlMap 항목이 truthy이면 각 URL을 I3fLoadTask/abort로 공유 g_TaskProcessor의 모든 워커에 요청하고 id 항목을 삭제한다. 반환 Promise를 기다리지 않으며 반환값이 있을 때 catch를 연결해 중단 요청의 거부를 소비한다.
        각 Meshes의 _baseUrl + url로 Objects를 조회하고 groups가 falsy이면 이후 상태 제거·해제 없이 건너뛴다.
        groups가 배열이면 각 그룹, 아니면 단일 그룹을 레이어 _group에서 제거하고 URL 상태를 삭제한다.
        typeDeleteMesh가 immediate이면 바로 자원을 해제한다.
        그 밖에는 UseGlobalDeleteMeshes가 true이면 GlobalDeleteMeshes, 아니면 레이어 deleteMeshes에 groups를 추가한다.

isStateByMeshUrl(self: U3dModelI3FLayer, url: string) -> boolean
    의존: defined — URL 등록 여부; 함수: {defined()}
    동작: Objects[url] 또는 StateObjects[url]이 정의되어 있으면 true, 모두 없으면 false를 반환한다.

registerMeshRequest(tile: I3FTile, url: string) -> U3dI3FMeshRequest
    동작: 타일별 사전이 없으면 만든다. tile·url을 가진 새 레코드를 URL에 등록하여 이전 레코드를 대체하고 반환한다.

isCurrentMeshRequest(request: U3dI3FMeshRequest) -> boolean
    인터페이스: this는 U3dModelI3FLayer다.
    의존:
        U3dLayer — 레이어 수명·표시 상태; 속성 읽기: {_disposed, _visible}
        I3FTile — 타일 해제 상태; 속성 읽기: {disposed}
    동작: 레이어가 미해제이고 _visible이 false가 아니며 타일도 미해제이고, 사전의 타일·URL 등록과 request가 같은 객체일 때만 true를 반환한다.

cancelMeshRequest(request: U3dI3FMeshRequest) -> void
    인터페이스: this는 U3dModelI3FLayer다.
    의존:
        U3dQuadTileWork — 두 단계 큐의 실행 차단; 함수: {setActive()}
        I3FTile — 이번 요청 작업 참조 정리; 속성 읽기·쓰기: {work, work2}
    동작:
        사전에 현재 등록된 레코드가 request와 같을 때만 URL 등록과 StateObjects[url]을 삭제하고, 빈 타일 사전도 삭제한다. 이미 만든 Objects 그룹과 다른 요청의 상태는 제거하지 않는다.
        현재 등록 소유자인지와 관계없이 이번 request의 work·parseWork를 각각 비활성화한다. tile.work·work2가 이번 작업과 같을 때만 지우고 현재 completion이 있으면 값 없이 reject한다.

removeStateByMeshUrl(self: U3dModelI3FLayer, url: string) -> void
    동작: StateObjects[url]과 Objects[url]에 undefined를 대입한 뒤 두 프로퍼티를 차례로 삭제한다.
```

## 4. 공통 처리 기준과 제약

```spec
생성자가 baseurl 누락으로 조기 종료한 경우에도 부모 상태와 클래스 private 필드는 남는다. 이후 메서드는 별도의 부분 초기화 보호를 공통으로 수행하지 않는다.
공개 setter와 원본 사전·배열 반환은 값을 복제하거나 검증하지 않는다. 외부 변경은 이후 조회·검색·해제에 반영될 수 있다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
