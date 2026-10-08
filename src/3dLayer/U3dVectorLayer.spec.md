# U3dVectorLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

`U3dVectorLayer`는 앱의 사용자 레이어로 도형을 등록하고, 그룹·라벨 표시와 도형별 갱신 콜백을 연결한다. 동적 갱신을 사용하면 위치를 타일 키별로 색인하여 타일 진입·이탈에 따라 도형을 표시한다. 자동 높이는 앱의 지형 높이 갱신에 도형을 등록하는 방식이며, 저장 데이터로 실제 도형을 만드는 책임은 `loadWork()` 호출자의 콜백에 있다.

`GeOnDT.vector.U3dVectorLayer`로 노출되며 `sample-viewer/objectControl.html`·`objectExpression.html`에서 도형을 묶어 사용한다. `U3dModelKmlLayer`의 기반 클래스이고 `U3dPathGeometry`는 생성한 경로 도형을 이 레이어에 등록한다.

## 3. 정규 자연어 수도코드

```spec
U3dVectorLayerCO extends U3dLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        uselight?: boolean = false
            조명 사용 저장값이며 이 단위에서 재질에 직접 적용하지 않는다.
        autoHeight?: boolean = false
            지형 높이 자동 갱신 등록 여부
        defaultZoffset?: number = 0
            후속 지형 높이 콜백에 더할 높이
        dynamicUpdate?: boolean = false
            타일별 도형 가시성 관리 여부
        renderOffset?: number = 0
            도형 추가 시 지원하는 도형에 전달할 렌더 오프셋
        scaleRatio?: number = 1
            도형 높이 축척 비율

U3dVectorLayerEMI extends U3dLayerEMI 부분 타입 명세
    이 명세에서 사용하는 필드:
        SAVE, LOAD: string
            저장 결과와 복원 항목 처리 결과의 이벤트 이름

U3dVectorTileIndexState 부분 타입 명세
    이 명세에서 사용하는 필드:
        _geomList: Map<string, U3dGeometry>
        _modelAtTile: Map<string, Set<string>>
        _indexAtModel: Map<string, Map<string, boolean>>
        _workBuffer: Record<string, unknown>
            기반 선언은 Record이지만 실제 값은 타일 작업 키 Set이다.
        _minlevel, _maxlevel: number
        _mercator: UMercator | undefined
            도형 목록·색인·레벨·투영 계산기의 원본 상태이며 스냅샷을 생성하지 않는다.

U3dVectorLayerEMD: U3dVectorLayerEMI
    의존: U3dLayer — 기반 이벤트 이름 제공; 속성 읽기: {EVENT}
    U3dLayer.EVENT를 복사하고 SAVE='save', LOAD='load'를 추가한 가변 객체
    U3dVectorLayerEMD.SAVE: string = 'save'
    U3dVectorLayerEMD.LOAD: string = 'load'

U3dVectorLayer extends U3dLayer 클래스 정의
    의존: U3dLayer — 장면·그룹·타일 상태와 레이어 수명 관리; 상속: {U3dLayer}

    static EVENT: U3dVectorLayerEMI = U3dVectorLayerEMD
        이벤트 상수 객체와 같은 참조
    autoHeight: boolean = false
        외부에서 쓰기가 가능하며 추가·제거·자동 높이 설정 경로가 현재 값을 읽는다.
    _uselight: boolean = false
    _defaultZoffset: number = 0
    _geomList: Map<string, U3dGeometry> = 빈 Map
        UUID별 등록 도형
    _updateGeomList: Map<string, U3dGeometry> = 빈 Map
        updateFunction으로 표시 여부를 정할 도형
    _dynamicUpdate: boolean = false
    _modelAtTile: Map<string, Set<string>> = 빈 Map
        타일 키별 도형 UUID
    _indexAtModel: Map<string, Map<string, boolean>> = 빈 Map
        도형별 타일 진입 여부
    _workBuffer: Set<string> = 빈 Set
        색인 등록 또는 타일 진입 후 보관하는 타일 키
    _renderOffset: number = 0
    _scaleRatio: number = 1
    _mercator: UMercator | undefined
    _checkTime: UCheckTime
    _autoHeightList: Map<string, U3dGeometry> = 빈 Map
        자동 높이 갱신에 등록한 도형

    constructor(opt: U3dVectorLayerCO = {})
        인터페이스: opt는 기반 레이어 옵션과 도형 표시·높이·동적 갱신 설정이다.
        의존:
            U3dLayer — 기반 초기화; 함수: {constructor()}
            UDEF — 사용자 레이어와 처리 종류; 상수: {LAYER_TYPE.USER, PROCESS.TYPE.USER}
            defaultValue — undefined일 때만 기본값 선택; 함수: {defaultValue()}
            UMercator — 동적 색인용 투영 계산기; 생성자: {new UMercator()}
            UCheckTime — 갱신 간격 관리; 생성자: {new UCheckTime()}
            DeferredResolveFunc — 존재할 때 레이어 생성 완료 전달; 콜백: {resolve()}
        동작:
            opt로 기반 생성자를 실행하고 _type과 _tileName을 USER로 설정한다.
            uselight와 dynamicUpdate는 undefined일 때 false, scaleRatio는 undefined일 때 1을 저장한다.
            autoHeight와 defaultZoffset은 falsy이면 각각 false와 0을 저장하고 renderOffset은 null 또는 undefined이면 0을 저장한다.
            도형·갱신·양방향 색인·자동 높이 목록을 빈 Map으로, _workBuffer를 빈 Set으로 초기화한다.
            dynamicUpdate가 truthy이면 UMercator를 생성하고 UCheckTime은 조건 없이 생성한다.
            resolve가 존재하면 현재 인스턴스를 인수로 멤버 호출한다.

    getUseLight() -> boolean
        동작: _uselight를 반환한다.

    setUseLight(val: boolean) -> void
        동작: val을 _uselight에 저장하며 기존 도형의 재질은 변경하지 않는다.

    addGeometry(geom: U3dGeometry) -> void
        의존:
            U3dLayer — 렌더 그룹과 그리기 인수; 속성 읽기: {_group, _drawArg}
            U3dObject — 레이어 이름; 함수: {getName()}
            U3dGeometry — 종류 판정·변경 이벤트·레이어 연결; 함수: {addEventListener(), setLayer()}
            U3dPathGeometry — 경로 도형 판정과 완료 이벤트; 함수: {once()}
            도형 — 지원하는 기능의 동적 연결; 함수: {setScaleRatio(), setRenderOffset(), setLayerName(), initAnimation()}; 속성 읽기: {animation, updateFunction, position, uuid}
        동작:
            축척이 1이 아니고 도형이 setScaleRatio를 제공하면 현재 비율을 전달한다.
            렌더 오프셋이 truthy이고 도형이 setRenderOffset을 제공하면 현재 오프셋을 전달한다.
            UUID로 _geomList에 보관하고 _group에 추가한다.
            U3dGeometry이면서 U3dPathGeometry가 아니면 change 이벤트에 현재 인스턴스를 바인딩한 변환 처리를 등록한다.
            setLayerName이 있으면 레이어 이름을 전달하고 setLayer로 현재 레이어를 연결한다.
            animation이 truthy이고 _drawArg가 있으면 initAnimation을 선택적으로 실행한다.
            동적 갱신이 켜져 있고 투영 계산기가 존재하면:
                updateFunction이 없으면 경로 도형의 end 이벤트에 색인 처리를 바인딩한다.
                updateFunction이 없고 x와 y가 모두 0이면 종료하여 아래 자동 높이 등록도 건너뛴다.
                updateFunction이 없고 원점이 아니면 색인에 등록하고 도형을 숨긴다.
                updateFunction이 있으면 _updateGeomList에 보관한다.
            autoHeight가 truthy이면 자동 높이에 등록한다.

    getGeometries() -> IterableIterator<U3dGeometry>
        동작: _geomList.values()의 실시간 반복자를 반환한다.

    getGeometryArray() -> Array<U3dGeometry>
        동작: 현재 등록된 도형 참조들을 담은 새 배열을 반환한다.

    setScaleRatio(val: number) -> void
        의존: 도형 — 축척 적용·수동 갱신 연결; 함수: {setScaleRatio(), setManualUpdate()}; 속성 읽기·쓰기: {position.z, userData.originHeight}
        동작:
            등록 도형을 순회한다.
            setScaleRatio가 있으면 val을 전달한다.
            없으면 originHeight가 falsy일 때 현재 z를 저장하고 originHeight / val을 z에 적용한 뒤 setManualUpdate를 선택적으로 실행한다.
            모든 도형 처리 뒤 _scaleRatio에 val을 저장한다. 0 등 입력의 수치 검증은 하지 않는다.

    override show(show: boolean) -> void
        의존:
            U3dLayer — 레이어 표시 상태와 그룹; 속성 읽기·쓰기: {_visible}; 속성 읽기: {_group}
            UGroup — 도형 배치; 함수: {clear(), add()}
            도형 — 라벨 표시 조건; 함수: {getLabel(), getShowLabel()}; 속성 읽기: {visible}
        동작:
            _visible과 show가 같으면 종료한다.
            _visible을 저장하고 show가 truthy이면 갱신을 실행한다.
            _visible이 false이면 그룹을 비우고 등록 도형의 라벨을 숨긴다.
            그 외에는 모든 등록 도형을 그룹에 넣고 visible인 도형의 라벨은 getShowLabel이 있으면 그 결과, 없으면 show로 표시한다.

    removeGeometry(geom: U3dGeometry) -> void
        의존:
            U3dLayer — 그룹 접근; 속성 읽기: {_group}
            UGroup — 도형 분리; 함수: {remove()}
            도형 — 레이어 연결 해제와 이벤트; 함수: {setLayerName(), setLayer(), dispatchEvent()}
        동작:
            geom이 falsy이면 종료한다.
            UUID를 등록 목록에서 삭제하고 그룹에서 분리한 뒤 지원하는 레이어 이름·레이어 연결을 undefined로 바꾼다.
            geom이 truthy이고 _dynamicUpdate가 truthy이면 타일 색인을 제거한다.
            geom이 truthy이고 autoHeight가 truthy이면 자동 높이 등록을 제거한다.
            도형에 BEFORE_DISPOSE와 DISPOSE를 순서대로 발생시킨다. 자원 dispose는 하지 않는다.
            geom이 truthy이면 위 정리 후 갱신한다.
            _updateGeomList에서는 삭제하지 않는다. [확인 Q-001]

    override update() -> void
        의존:
            U3dLayer — 기반 갱신과 표시 상태; 함수: {update()}; 속성 읽기: {_visible}
            UEventDispatcher — 갱신 이벤트; 함수: {dispatchEvent()}
            UCheckTime — 갱신 시점과 다음 간격; 함수: {isUpdate(), updateTime()}
            도형 — 표시 여부 계산 확장 지점; 콜백: {updateFunction()}
        동작:
            레이어가 보이지 않거나 _updateGeomList가 비었으면 종료한다.
            isUpdate가 true이면 UPDATE 이벤트를 발생시키고 상위 update를 인수 없이 호출한다.
                갱신 목록의 각 도형에 updateFunction이 있으면 현재 레이어를 인수로 도형의 멤버 함수로 호출한다. 제거 후 남은 목록도 순회 대상이다. [확인 Q-001]
                _visible이 truthy이고 geom.updateFunction이 truthy이면 콜백 결과로 도형·라벨·그룹 표시를 반영한다.
            위 시간 조건과 무관하게 조기 종료하지 않은 정상 경로의 끝에서 updateTime(20)을 호출한다.
            이벤트·사용자 콜백 예외는 잡지 않으므로 뒤의 처리와 updateTime도 실행되지 않는다.

    setDynamicUpdate(val: boolean) -> void
        의존: UMercator — 투영 계산기 초기화; 생성자: {new UMercator()}
        동작:
            _dynamicUpdate를 저장하고 val이 falsy이면 종료한다. 기존 색인·표시를 초기화하지 않는다.
            _mercator가 없으면 새 UMercator를 _mercator에 저장한다.
            기존 도형의 updateFunction이 있으면 갱신 목록에 추가한다.
            없는 도형은 이미 색인이 있거나 x와 y가 모두 0이면 건너뛴다.
            val이 truthy이면 위에서 건너뛰지 않은 도형에 색인을 생성한다.
            이미 등록된 도형을 즉시 숨기지 않는다.

    override addTileFromScene(tile: U3dQuadTile) -> void
        의존:
            U3dLayer — 표시·레벨·타일 상태; 함수: {getStateTile(), setStateTile()}; 속성 읽기: {_visible, _minlevel}
            U3dQuadTile — 키와 레벨; 함수: {getKey()}; 속성 읽기: {_key, _rlevel}
            UDEF — 처리 상태; 상수: {TILE_STATE._loading, TILE_STATE._end}
        동작:
            tile._key가 truthy이면 그 값, 아니면 getKey의 결과를 키로 사용한다.
            동적 갱신 꺼짐·레이어 숨김·타일 레벨이 최소 레벨 미만이면 타일을 end로 설정하고 종료한다.
            기존 상태를 nullish일 때 0으로 보아 loading 이상이면 end로 설정하고 종료한다.
            판단 중 도형별 표시 요청을 일반 소스의 도형·라벨·그룹 반영에 연결한다.

    override removeTileFromScene(tile: U3dQuadTile) -> undefined
        의존:
            U3dQuadTile — 키 조회; 함수: {getKey()}; 속성 읽기: {_key}
        동작:
            동적 갱신이 꺼져 있으면 종료한다.
            tile._key 또는 getKey의 키가 _workBuffer에 없으면 종료한다.
            _dynamicUpdate가 truthy인 경우 판단 중 도형별 숨김 요청을 일반 소스의 도형·라벨·그룹 반영에 연결한다.

    addPoint(x: number, y: number, z: number) -> void
        의존:
            U3dPoint — 점 생성; 생성자: {new U3dPoint()}
            THREE — 좌표 생성; 생성자: {new Vector3()}
        동작: 입력 좌표 하나로 U3dPoint를 생성하여 등록한다.

    addLine(vec3: Vector3) -> void
        의존: U3dLine — 선 생성; 생성자: {new U3dLine()}
        동작: vec3 하나를 coordinates 배열에 넣어 U3dLine을 생성하여 등록한다.

    override getScene() -> UScene
        의존: U3dLayer — 장면 조회; 함수: {getScene()}
        동작: 상위 getScene의 결과를 그대로 반환한다.

    clear() -> void
        의존:
            defined — 라벨 존재 판정; 함수: {defined()}
            UDEF — 도형 자원 해제 진입점; 정적 함수: {disposeObject3D()}
            도형 — 연결 해제·라벨 접근·이벤트; 함수: {setLayerName(), setLayer(), getLabel(), dispatchEvent()}
            라벨 — 자원 해제와 부모 분리; 함수: {dispose()}
            Object3D — 라벨 분리; 함수: {remove()}
            U3dLayer — 그룹 접근; 속성 읽기: {_group}
            UGroup — 그룹 비우기; 함수: {clear()}
        동작:
            등록된 도형마다 disposeObject3D로 해제하며 전달한 콜백은 처리 대상의 레이어 연결을 해제한다.
            _dynamicUpdate가 truthy이면 색인을 제거한다.
            autoHeight가 truthy이면 자동 높이 등록을 해제한다.
            라벨이 있으면 dispose하고 부모가 있으면 분리한다.
            도형에 BEFORE_DISPOSE·DISPOSE 이벤트를 이 순서로 발생시킨다.
            기존 _geomList를 비운 뒤 새 Map으로 교체하고 _updateGeomList·그룹을 비운 다음 갱신한다.
            _workBuffer를 별도로 비우지 않으며 조건이 꺼진 색인·자동 높이 정리도 실행하지 않는다.

    override updateDetail(tile: U3dQuadTile, opt?: object) -> void
        동작: 빈 본문으로 아무 처리 없이 종료한다.

    setAutoHeight(value: boolean) -> void
        동작:
            autoHeight에 value를 저장한다.
            등록된 각 도형에 value가 truthy이면 자동 높이를 적용한다.
            value가 falsy이면 각 도형의 자동 높이 등록을 해제한다.

    getAutoHeight() -> boolean
        동작: 현재 autoHeight를 반환한다.

    saveWork() -> {geometries: Array<Partial<{type: string, param: Record<string, unknown>}>>, name: string} | undefined
        의존:
            defined — getParam 존재 판정; 함수: {defined()}
            도형 — 저장 자료 조회; 함수: {getParam()}; 속성 읽기: {_className}
            UEventDispatcher — 저장 이벤트; 함수: {dispatchEvent()}
            U3dObject — 이름 저장값; 속성 읽기: {_name}
        동작:
            getParam이 정의된 도형만 type=_className, param=getParam 결과로 모은다.
            결과 배열을 SAVE 이벤트의 data로 전달한다.
            배열이 비었으면 undefined, 그 외에는 같은 배열과 레이어 이름을 가진 새 객체를 반환한다.

    loadWork(savedData: Partial<{type: string, param: Record<string, unknown>}> | Array<Partial<{type: string, param: Record<string, unknown>}>>, callback: function) -> Promise<Array<any>>
        인터페이스: callback은 저장 항목의 얕은 복사본을 받아 도형 생성·등록을 담당하며 반환값 또는 Promise 완료값을 전체 결과 배열에 제공한다.
        의존:
            defined — 복사된 항목 존재 판정; 함수: {defined()}
            callback — 항목 복원 실행; 콜백: {callback()}
            UEventDispatcher — 항목 완료 알림; 함수: {dispatchEvent()}
            Web API — 중복 이름 안내; 함수: {console.warn()}
        동작:
            단일 항목을 배열로 감싸고 항목마다 최상위만 복사한다. param 등 중첩 참조는 원본과 공유한다.
            복사본이 정의되지 않았으면 건너뛴다.
            param.name이 truthy이고 같은 이름의 도형이 있으면 경고하고 건너뛴다.
            callback을 즉시 호출하여 결과를 Promise.resolve로 감싼다. 동기 예외는 호출 자체에서 전파되어 Promise.all에 도달하지 않는다.
            각 Promise의 성공 후 별도 then에서 LOAD 이벤트에 {object: 완료값, save: 복사본}을 전달한다.
            원본 Promise 목록의 Promise.all을 반환하므로 콜백 Promise 거절은 전체 결과를 거절한다. LOAD 리스너 예외는 별도 then의 거절이며 이 반환 Promise의 거절로 합쳐지지 않는다.

    getBoundingBox() -> Box3
        의존: THREE — 전체 도형 경계 생성·확장; 생성자: {new Box3()}; 함수: {expandByObject()}
        동작: 새 Box3를 등록 도형마다 expandByObject로 확장해 반환하며 도형이 없으면 빈 Box3이다.

    getGeometryByName(name: string) -> U3dGeometry | undefined
        동작: 등록 순서대로 이름을 비교하여 첫 일치 도형을 반환하고 없으면 undefined를 반환한다.

    removeAllGeometries() -> void
        의존:
            도형 — 레이어 연결 해제·이벤트; 함수: {setLayerName(), setLayer(), dispatchEvent()}
            U3dLayer — 그룹 접근; 속성 읽기: {_group}
            UGroup — 그룹 비우기; 함수: {clear()}
        동작:
            등록 도형마다 지원하는 레이어 이름·레이어 연결을 해제한다.
            _dynamicUpdate가 truthy이면 색인을 제거한다.
            autoHeight가 truthy이면 자동 높이 등록을 해제한다.
            도형에 BEFORE_DISPOSE·DISPOSE를 순서대로 발생시키되 도형 자원은 직접 해제하지 않는다.
            _geomList와 그룹을 비운 뒤 갱신한다.
            _updateGeomList는 비우지 않는다. [확인 Q-001]

    #setVisibleGeometry(geom: Object3D, isShow: boolean) -> void
        의존:
            도형 — 라벨 표시 조건; 함수: {getLabel(), getShowLabel()}; 속성 읽기·쓰기: {visible}
            U3dLayer — 그룹 접근; 속성 읽기: {_group}
            UGroup — 그룹 구성 반영; 함수: {add(), remove()}; 속성 읽기: {children}
        동작:
            getLabel이 있으면 숨김은 false, 표시 요청은 getShowLabel이 있을 때 그 반환값을 라벨 visible에 반영한다.
            geom이 falsy이거나 도형 visible이 isShow와 같으면 종료한다. 라벨 처리는 이 판정보다 먼저 실행된다.
            도형 visible을 바꾸고 숨김이면 현재 그룹 구성원을 제거하며 표시이면 그룹에 없는 도형을 추가한다.

    #transform(obj: Object3D) -> void
        의존:
            U3dGeometry — 좌표·변환 완료·재질 처리; 함수: {needTransform(), getPositions(), setVertex(), setMaterial()}; 속성 쓰기: {_needTransform}
            U3dLayer — 그리기 인수; 속성 읽기: {_drawArg}
            UMathEngine — 좌표 변환; 정적 함수: {getGeographicToGoogle()}
            THREE — 변환 좌표와 자세 계산; 생성자: {new Vector3(), new Euler(), new Quaternion()}; 함수: {setFromEuler()}
        동작:
            needTransform 결과가 falsy이거나 _drawArg가 없으면 종료한다.
            getPositions 결과가 nullish이면 빈 배열을 사용하고 각 좌표를 getGeographicToGoogle로 바꾼 새 Vector3 배열을 setVertex에 전달한다.
            rotation이 있으면 같은 Euler 값으로 새 Quaternion을 계산하여 obj.quaternion에 복사한다.
            _needTransform을 false로 바꾸고 _needMaterial이 truthy이며 setMaterial이 있으면 _drawArg로 재질을 적용한다.
            _drawArg가 truthy인 진행 경로에서 동적 갱신이 켜져 있고 UUID 색인이 없으면 색인을 생성한다.

    #vertexChanged(e: Event & {data: Object3D | undefined}) -> void
        동작: e.data가 truthy이면 해당 도형을 변환한다.

    #removeTileIndex(object: Object3D) -> void
    #setTileIndex(object: Object3D | {type: string, data: Object3D}) -> void
        의존:
            defined — 그리기 인수·입력 존재 판정; 함수: {defined()}
            U3dLayer — 그리기 인수; 속성 읽기: {_drawArg}
        동작:
            투영 계산기가 없거나 그리기 인수가 정의되지 않았으면 종료한다.
            data가 정의된 이벤트 입력이면 data의 position·uuid, 그 외에는 입력 자체의 position·uuid를 사용한다.
            위치나 UUID가 정의되지 않았거나 현재 _drawArg가 falsy이면 종료한다.
            x와 y가 모두 0이면 종료한다.
    #applyAutoHeight(mesh: Object3D) -> void
        의존:
            U3dLayer — 앱 참조; 속성 읽기: {_app}
            U3dApp — 자동 높이 등록·현재 높이 조회; 함수: {addAutoHeightUpdate(), getRenderHeightAtPoint()}
            defined — 저장값·높이 존재 판정; 함수: {defined()}
            UDEF — 무효 높이 값; 상수: {INVALID, TERRAIN_NO_DATA}
            도형 — 수동 갱신 연결; 함수: {setManualUpdate()}
        동작:
            autoHeight가 falsy이거나 앱·mesh가 없거나 이미 등록된 UUID이면 종료한다.
            현재 z를 originalHeight로 보관하고 현재 x·y·mesh를 앱의 자동 높이 갱신에 등록한다.
                후속 콜백은 전달된 z에 (_defaultZoffset || 0)을 더해 mesh.position.z와 autoHeightValue에 저장하고 setManualUpdate를 선택적으로 실행한다.
            UUID를 _autoHeightList에 보관한다.
            autoHeightValue가 정의되어 있으면 그 값으로 z를 복구하고 수동 갱신한다.
            autoHeightValue가 정의되지 않은 경우 현재 렌더 높이를 조회한다.
                높이가 정의되고 INVALID·TERRAIN_NO_DATA가 아닌 값이면 autoHeightValue에 그대로 저장하고 z에 적용한 뒤 수동 갱신한다. 오프셋을 더하지 않는다. [확인 Q-002]

    #removeAutoHeight(mesh: Object3D) -> void
        의존:
            U3dLayer — 앱 참조; 속성 읽기: {_app}
            U3dApp — 자동 높이 등록 해제; 함수: {removeAutoHeightUpdate()}
            도형 — 수동 갱신 연결; 함수: {setManualUpdate()}
        동작:
            앱·mesh가 없거나 UUID가 자동 높이 목록에 없으면 종료한다.
            현재 x·y·mesh로 앱의 등록을 해제하고 _autoHeightList에서 UUID를 지운다.
            originalHeight가 truthy일 때만 z를 복원하고 수동 갱신한다. 원래 높이 0은 복원되지 않는다. [확인 Q-003]

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
