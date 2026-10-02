# U3dVectorTileLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

모델 타일 레이어를 상속하여 VCTR 콘텐츠를 읽고 포인트와 레이블을 표시한다. 부모의 다운로드·캐시·파서 큐를 사용하지만 타일 탐색과 장면 등록은 재정의한다. 타일 안의 POI를 이름과 공간 위치로 묶어 중복 표시를 제한하고 카메라와의 거리·프러스텀으로 가시 상태를 결정한다. `GeOnDT`의 model 이름공간에 공개되며 `UTestManager`의 벡터 타일 검사 대상이다.

## 3. 정규 자연어 수도코드

```spec
U3dVectorTileLayerCO 타입 정의
    기반 타입: U3dModelTilesLayerCO & U3dVectorTileLayerCO_Content
    모델 타일 설정에 레이블 표시와 공간 그룹 크기를 추가한다.

U3dVectorTileLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        baseurl, name: string
            부모 타일 데이터 주소와 레이어 이름이다.
        font?: string
            파서 생성 시 사용하는 글꼴이며 undefined이면 Roboto, "Noto Sans KR", Arial이다.
        fontSize?: number
            파서 생성 시 사용하는 글자 크기이며 undefined이면 17이다.
        imgUrl?, imgExt?: string
            이미지 주소와 확장자이며 전달한 값 그대로 저장한다.
        clusterRadius?: number
            위치 키의 평면 좌표를 나누는 크기이며 undefined이면 50을 저장한다. 0·null은 대체하지 않는다.
        cacheSize?: number
            전달한 값과 관계없이 생성자가 원본 옵션 객체의 값을 100으로 덮어쓴다.

VctrTile 타입 정의
    기반 타입: U3DTileset & VctrTile_Content
    상속받은 타일에 벡터 표시 상태를 더한 교차 타입이다.

VctrTile_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        children?: Array<VctrTile>
            재귀 탐색 대상이다.
        level?, geometricError?: number
            거리 판정과 파서 입력에 사용한다.
        updateId?: string | number
            부모와 같은 갱신 세대 ID를 보관한다.
        userData?: object
            메시 목록과 좌표 참조를 보관한다.
        visible?, disposed?, needPositionUpdate?: boolean
            장면 연결 상태·해제 여부·부모 위치 미준비 상태다.
        promise?: DeferredObject<U3dQuadTile>
            선언상 쿼드 타일 완료 객체지만 실제 부모 setPromise는 U3DTileset을 전달한다. [확인 Q-003]
        complete?: boolean
            선언상 boolean이지만 부모는 TILE_STATE 값을 저장한다. [확인 Q-003]

U3dVectorTileLayer extends U3dModelTilesLayer 클래스 정의
    의존: U3dModelTilesLayer — 다운로드·캐시·타일 상태와 수명주기 제공; 상속: {U3dModelTilesLayer}

    #visibleMap: Map<string, Set<U3dPOI>> = 빈 Map
        위치 키별 등록 순서와 후보 POI 참조를 보유한다.

    static g_useOrigin: boolean = false
        지역별 부모 방향 위치 보정값의 선택을 바꾸는 공개 설정이다.

    constructor(opt: U3dVectorTileLayerCO)
        인터페이스: 부모 타일 옵션과 레이블·이미지·공간 그룹 설정을 받는다.
        의존:
            U3dModelTilesLayer — 기본 초기화; 생성자: {super()}
            defaultValue — undefined 기본값 선택; 함수: {defaultValue()}
        동작:
            원본 opt.cacheSize를 100으로 바꾼 뒤 부모 생성자에 같은 객체를 전달한다.
            클래스 식별자를 U3dVectorTileLayer, 종류를 vectorTile로 저장한다.
            font·fontSize·clusterRadius는 undefined 기본값을 적용하고 imgUrl·imgExt는 전달 값을 저장한다.
            저장한 _font는 파서 생성 입력으로 사용한다. [확인 Q-001]

    _updateLabels(property: 'fontFamily' | 'fontSize', value: string | number) -> undefined
        인터페이스: 캐시된 메시의 직접 자식이 지원하는 글꼴 설정 함수를 호출한다.
        의존:
            U3dModelTilesLayer — 부모 캐시; 속성 읽기: {_dataCache}
            LRUCache — 캐시 항목 순회; 함수: {values()}
            label — 직접 자식의 동적 setter; 콜백: {setFontFamily(), setFontSize()}
        동작:
            레이어의 밑줄 접두어 속성에 값을 저장한다.
            캐시 항목의 메시별 직접 자식에서 속성에 대응하는 setter를 찾고 함수인 경우 자식을 this로 호출한다.
            fontFamily는 _fontFamily에 저장되며 파서 생성 입력 _font는 바뀌지 않는다. [확인 Q-001]

    setFont(font: string) -> undefined
        동작:
            fontFamily 설정을 전달하여 현재 캐시의 레이블 글꼴을 바꾼다.

    setFontSize(size: number) -> undefined
        동작:
            fontSize 설정을 전달하여 저장 크기와 현재 캐시의 레이블 크기를 바꾼다.

    override addParserQueue(fnc: (item: ModelTileParserQueueItem) -> DeferredObject<U3DTileset>, param: ModelTileParserQueueItem) -> Promise<U3DTileset>
        의존:
            U3dModelTilesLayer — 파서 예약; 함수: {addParserQueue()}
            deferred — 즉시 완료 객체; 함수: {deferred()}
        동작:
            VCTR 타입이면 입력 파서를 전용 함수로 바꾸고 requestState를 포함한 param 참조를 부모 큐에 전달한다.
            다른 타입이면 파싱하지 않고 param.tile로 resolve한 완료 객체를 반환한다.

    override update(drawArg: UDrawArg, curTime: number, force: boolean = false) -> undefined
        의존:
            U3dModelTilesLayer — 갱신·영역·시간·캐시와 세대 상태; 함수: {isStopUpdate(), removeAllTiles(), isStateChange(), updateCancel(), getUpdateId()}; 속성 읽기: {_initializedJson, _box3, _checkTime, _updateCycleTime, _geometricError, _viewSizeOffset, _sphere, _dataCache, _rootTileSet}; 속성 쓰기: {_curPostion}
            U3dLayer — 초기화와 저장 문맥; 함수: {isInitialized()}; 속성 읽기: {_drawArg}
            UDrawArg — 카메라·영역 조회; 함수: {getCameraPosition(), intersectsBox()}
            UCheckTime — 갱신 주기; 함수: {isUpdate(), updateTime()}
            LRUCache — 캐시 유무; 함수: {length()}
            defined — 문맥 유무; 함수: {defined()}
        동작:
            중지·미초기화·JSON 미초기화·저장 drawArg 부재·박스 부재이면 끝낸다.
            갱신 주기가 아니고 force가 false이면 다음 주기 시간을 기록하고 끝낸다.
            geometricError와 저장 viewSizeOffset을 곱한 거리 한도를 만들며 함수형 offset은 호출하지 않는다. [확인 Q-002]
            입력 drawArg에서 카메라를 읽고 저장 drawArg로 박스 교차를 검사한다.
            카메라가 없거나 박스 밖이거나 구에서의 거리가 한도를 넘으면 캐시가 비어 있지 않을 때만 removeAllTiles를 호출하고 주기를 기록한다.
            isStateChange가 false이면 주기만 기록한다.
            이전 세대를 취소하고 새 updateId로 루트 타일의 자식 탐색을 시작한 뒤 주기를 기록한다.

    override searchTiles(tile: U3DTileset, parent: U3DTileset | string | number | undefined, updateId?: string | number, isFirst: boolean = true, checkContext?: TileCheckContext) -> undefined
        의존:
            U3dModelTilesLayer — 취소·영역·콘텐츠 요청·해제; 함수: {isCancel(), createViewBox(), checkTile(), setPromise(), disposeTile()}
            U3dLayer — 박스 생성 인수; 속성 읽기: {_drawArg}
            defined — 박스 유무; 함수: {defined()}
        동작:
            parent가 문자열 또는 숫자이면 기존 두 인수 호출로 해석하여 그 값을 updateId로 사용한다. 그 외에는 세 번째 인수 updateId를 사용한다.
            parent 타일, isFirst와 checkContext는 벡터 탐색에 사용하지 않는다.
            취소 세대이면 반환하고 자식이 있으면 각 자식의 updateId를 설정한다.
            viewBox가 없으면 저장 drawArg를 추가 인수로 전달하여 부모 createViewBox를 호출한다.
            checkTile이 true이면 setPromise를 호출하고 해당 자식 promise에 성공 콜백을 등록한다.
            tile.children이 있는 경우 각 성공 콜백에서 val.disposed가 false이면 addGroup 후 완료 타일·현재 tile·updateId 순서로 인수를 전달하여 그 타일의 자식을 즉시 탐색한다.
            성공 결과가 disposed이면 콜백을 끝낸다.
            checkTile이 false인 자식은 disposeTile로 해제한다.
            형제 완료를 기다리지 않고 전체 탐색 완료 Promise도 반환하지 않는다.

    override addGroup(tile: U3DTileset, updateId?: string | number) -> undefined
        의존:
            U3dModelTilesLayer — 취소 판정; 함수: {isCancel()}
            U3dLayer — 저장 문맥과 장면 그룹; 속성 읽기: {_drawArg, _group}
            UDrawArg — 카메라 위치; 함수: {getCameraPosition()}
            UGroup — 메시 장면 등록; 함수: {add()}
        동작:
            취소 세대이면 끝낸다.
            메시 목록이 비어 있지 않으면 카메라 위치를 얻어 각 메시의 직접 자식 POI 가시 상태를 갱신한다.
            tile.visible이 false인 동안 각 메시를 레이어 그룹에 추가하고 마지막에 tile.visible을 true로 설정한다.

    override deleteMesh(mesh: Object3D) -> undefined
        의존:
            U3dPOI — POI 종류 판정; 상수: {U3dPOI}
            U3dModelTilesLayer — 메시 삭제; 함수: {deleteMesh()}
        동작:
            mesh가 없으면 끝낸다.
            mesh가 있고 U3dPOI이면 가시 맵에서 제거한 뒤 부모 deleteMesh를 호출한다.
            다른 종류의 mesh도 부모 deleteMesh를 호출한다.

    override deallocateMesh(mesh: Object3D) -> undefined
        의존:
            U3dPOI — POI 종류 판정; 상수: {U3dPOI}
            U3dModelTilesLayer — 캐시 보존 해제; 함수: {deallocateMesh()}
        동작:
            mesh가 없으면 끝낸다.
            mesh가 있고 U3dPOI이면 가시 맵에서 제거한 뒤 부모 deallocateMesh를 호출한다.
            다른 종류의 mesh도 부모 deallocateMesh를 호출한다.

    addVisibleState(mesh: U3dPOI) -> boolean
        동작:
            메시가 없으면 false를 반환한다.
            mesh가 있는 경우:
                positionKey가 없으면 이름과 좌표로 키를 계산하여 userData에 저장한다.
                같은 키가 없으면 메시 하나의 Set을 Map에 등록하고 메시와 모든 자식을 표시한 뒤 true를 반환한다.
                기존 Set에 없는 메시이면 메시와 모든 자식을 숨기고 후보에 추가한다.
            이미 등록된 메시의 가시 상태는 건드리지 않고 true를 반환한다.

    removeVisibleState(mesh: U3dPOI) -> undefined
        의존: U3dPOI — 대체 후보 종류 판정; 상수: {U3dPOI}
        동작:
            mesh가 없으면 끝낸다.
            mesh가 있는 경우:
                기존 visible을 기억한 뒤 메시와 모든 자식을 숨긴다.
                positionKey가 없으면 계산하여 저장한다.
            Map에 키나 메시가 없으면 끝내고 있으면 Set에서 제거한다.
            Set이 비면 키를 삭제한다.
            제거 전 visible이 true였으면 남은 후보 중 최초 U3dPOI와 모든 자식을 표시한다.

    search(name: string) -> Array<{mesh: U3dPOI, position: Vector3 | undefined}>
        동작:
            Map 키가 입력 부분 문자열을 포함하면 해당 Set의 첫 메시와 _position 참조를 결과에 넣는다.
            visible 여부로 거르지 않으며 Map 순서로 새 배열을 반환한다.

    isUpdateVCTRPoint(vctr: U3dPOI, tile: U3DTileset, campos: Vector3) -> boolean
        의존:
            U3dModelTilesLayer — 저장 거리 배율; 속성 읽기: {_viewSizeOffset}
            U3dLayer — 저장 판정 문맥; 속성 읽기: {_drawArg}
            UDrawArg — POI 구의 프러스텀 교차; 함수: {intersectsSphere()}
        동작:
            입력 셋 중 하나가 없거나 저장 구가 프러스텀 밖이면 false를 반환한다.
            카메라와 저장 위치의 거리를 계산한다.
            _farDistance가 1024·2048·4096·8192·16384·32768·65536·131072 중 하나이면 한도는 farDistance의 6배다.
            아니면 farDistance에 tile.level의 nullish 기본값 1, 0.8과 저장 viewSizeOffset을 곱한다. [확인 Q-002]
            거리가 한도보다 엄격하게 작을 때 true를 반환한다.

    override setHeightOffset(offset: number) -> undefined
        의존:
            defined — 파서 유무; 함수: {defined()}
            UVctrParser — 파서 높이 상태; 속성 쓰기: {_heightOffset}
            U3dModelTilesLayer — 레이어 높이 저장; 속성 쓰기: {_heightOffset}
        동작:
            _heightOffset에 값을 저장하고 파서가 이미 있으면 파서의 같은 이름 속성에도 값을 쓴다.
            부모 높이 이동 메서드를 호출하지 않고 기존 메시 위치를 순회하지 않는다.

    deleteBoxHelper() -> undefined
        의존:
            THREE.Box3Helper — 장면 자식 종류 판정; 상수: {Box3Helper}
            U3dLayer — 연결 앱; 속성 읽기: {_app}
        동작:
            앱 장면의 직접 자식 배열에서 Box3Helper를 splice하고 인덱스를 되돌린다.
            레이어 소속을 거르거나 dispose를 호출하지 않는다.

    override __$testGroupCheck(showLog: boolean = false) -> boolean
        의존:
            Vector3DTilePoints — 그룹 종류 확인; 상수: {Vector3DTilePoints}
            __GError__ — 불일치 로그; 함수: {__GError__()}
            U3dModelTilesLayer — 타일 판정; 함수: {checkTile()}
            U3dLayer — 저장 문맥과 검사 그룹; 속성 읽기: {_drawArg, _group}
        동작:
            그룹의 직접 자식 종류·연결 타일·타일 visible와 disposed·checkTile 결과를 검사한다.
            POI의 구·키 존재, 거리상 숨겨야 할 POI의 visible, POI와 직접 자식의 visible 일치, 표시 POI 키의 Map 존재를 검사한다.
            발견한 불일치는 로그를 남기고 false로 누적하며 showLog는 읽지 않는다.

    __$testTilesetCheck(showLog: boolean = false, tileset: VctrTile = this._rootTileSet) -> boolean
        의존:
            __GError__ — 불일치 로그; 함수: {__GError__()}
            U3dModelTilesLayer — 루트와 타일 판정; 함수: {checkTile()}; 속성 읽기: {_rootTileSet}
            U3dLayer — 검사 그룹; 속성 읽기: {_group}
        동작:
            각 자식에서 숨김·해제 상태와 그룹 포함 관계를 대조한다.
            표시 타일이면 메시 가시 상태와 표시 POI의 키·Map 존재도 대조한다.
            checkTile이 true인 자식은 부모도 해제된 경우를 제외하고 disposed를 오류로 본다.
            checkTile이 false인데 disposed가 아니어도 오류로 본다.
            모든 자식에 재귀하여 불일치 로그와 false를 누적한다.

    __$testVisibleMap(showLog: boolean = false) -> boolean
        의존:
            __GError__ — 오류 개수 로그; 함수: {__GError__()}
            __GInfo__ — 정상 개수 로그; 함수: {__GInfo__()}
        동작:
            각 Set에서 노드 visible이 true이거나 직접 자식 중 하나가 visible인 노드를 센다.
            개수가 1보다 많으면 오류 로그와 false를 누적한다.
            0개는 실패로 판정하지 않으며 showLog이면 정상 개수도 기록한다.

_parseVCTR(obj: ModelTileParserQueueItem) -> DeferredObject<U3DTileset>
    인터페이스: 레이어를 this로 받아 콘텐츠 버퍼를 해석하며 resolve·reject 값은 타일이다.
    의존:
        deferred — 완료 객체; 함수: {deferred()}
        defined — 입력 판정; 함수: {defined()}
        UVctrParser — VCTR 파싱; 생성자: {new UVctrParser()}; 함수: {parse()}
        U3dMessage — 파싱 실패 정보; 함수: {info()}
    동작:
        obj의 updateId를 지역 값으로 잡고 취소·drawArg 부재·disposed·영역 이탈이면 타일로 reject한다.
        disposed와 영역 이탈에는 failMsg를 기록한다.
        파서가 없으면 이미지·높이·drawArg와 _font·_fontSize로 생성한다. [확인 Q-001]
        byteOffset 0과 타일·info.tileset을 전달하여 parse를 호출한다.
        성공 콜백에서 처음 잡은 세대의 취소와 결과 유무·영역을 다시 검사한다.
        points가 있으면 addVCTR 완료 후 points.userData에 batchTable을 연결한다.
        result.points가 있는 경우 addVCTR 완료 후 boundingVolume이 없으면 계층에 볼륨을 만들고 _calcPosition을 호출한 뒤 타일로 resolve한다.
        points가 없으면 타일로 즉시 resolve한다.
        addVCTR 실패는 타일로 reject하고 파서 실패는 7144604 정보 로그 후 타일로 reject한다.
        비동기 대기 중 부모 requestState가 승계되어도 지역 updateId는 바뀌지 않는다. [확인 Q-004]

addVCTR(result: object, tile: VctrTile, updateId: number) -> DeferredObject<void>
    인터페이스: 레이어를 this로 받아 points 갱신과 타일 등록을 연결한다.
    의존:
        deferred — 완료 객체; 함수: {deferred()}
        defined — 입력·갱신 결과 유무; 함수: {defined()}
    동작:
        result나 tile이 없으면 값 없이 reject한다.
        points가 없으면 값 없이 resolve한다.
        points에 타일 level·geometricError와 레이어 viewRatio를 넣고 update를 호출한다.
        update 결과가 있으면 취소 여부를 검사하여 취소 시 deleteMesh 후 reject한다.
        취소되지 않은 결과를 등록할 때 userData에는 기존 truthy 참조 또는 새 빈 객체를 대입하고 meshes에는 기존 truthy 배열 또는 새 빈 배열을 대입한다.
        결과에 _tileset·_tileLevel을 연결하고 타일의 meshes 배열에 추가한다.
        이 등록에서 타일 type은 vctr로 설정한다.
        refine이 없는 경우(null 또는 undefined)에만 refine을 REPLACE로 설정한다.
        update 결과가 없어도 resolve하며 update 실패는 값 없이 reject한다.

_calcPosition(object: Object3D, tile: VctrTile, info: object) -> DeferredObject<void>
    인터페이스: 레이어를 this로 받아 좌표 참조를 기록하고 조건부 부모 방향 보정을 적용한다.
    의존:
        defined — 입력 판정; 함수: {defined()}
        deferred — 완료 객체; 함수: {deferred()}
        Coordinates — 좌표 변환; 함수: {transformPoint()}
        THREE.Vector3 — 중심 벡터; 생성자: {new Vector3()}
    동작:
        object.userData.rtcCenter가 있으면 사용하고 없으면 타일과 조상 transform 존재 여부를 검사한다.
        transform이 있으면 누적 행렬의 평행이동을 중심으로 사용한다.
        없으면 필요한 worldBox를 만들고 그 중심의 위경도·높이를 EPSG:4978로 변환한다.
        중심을 위경도 좌표계(EPSG:4326)와 월드 좌표(EPSG:3857)로 변환한다.
        object.userData와 info.tile에 geographic·google·epsg4978 참조를 기록하고 별도 world 벡터도 저장한다.
        object.position이 없을 때만 world 벡터를 position으로 설정한다.
        isUseBox이고 기존 boxHelper가 있으면 주석 그룹에 추가한다.
        region이 있는 양수 level 타일에서 부모 meshes가 있으면 부모 방향 보정을 수행한다.
        g_useOrigin이면 scalar -0.045·factor 0.45, 아니면 정수 위도 33 초과에서 -0.040·0.5, 나머지에서 -0.038·0.42를 선택한다.
        같은 region·level 조건에서 부모 meshes가 없으면 needPositionUpdate를 true로 설정한다.
        마지막에 값 없이 resolve한 완료 객체를 반환한다.

computeTransform(info: object) -> Matrix4
    의존:
        defined — 변환 유무; 함수: {defined()}
        THREE.Matrix4 — 행렬 생성; 생성자: {new Matrix4()}
    동작:
        현재 타일 transform.elements를 복사하거나 단위행렬을 만든다.
        부모부터 루트 방향으로 순회하여 transform이 있는 조상의 행렬을 앞에서 곱한 새 행렬로 바꾼다.
        최종 누적 행렬을 반환한다.

_upReposition(object: Object3D, tile: VctrTile, parent: VctrTile, scalar: number, factor: number | undefined) -> Object3D | undefined
    의존:
        defined — 부모 준비 여부; 함수: {defined()}
        THREE.Vector3 — 원본 위치 보관; 생성자: {new Vector3()}
    동작:
        factor가 undefined이면 0.45를 선택한다.
        부모 complete가 null 또는 undefined이거나 첫 메시가 없으면 반환한다.
        부모 첫 메시의 최초 위치를 orgPosition_에 보관하고 그 복사본의 x·y를 정수로, z를 0으로 만든다.
        현재 object 위치의 복사본도 z를 0으로 만든다.
        scalar에 (1 - 35 / geographic.y) * factor를 더하여 현재 위치에서 부모 위치로 lerp한다.
        결과 xyz를 object.position에 쓰고 object를 반환한다.

_updateVCTRPoint(vctr: Object3D, tile: VctrTile, campos: Vector3) -> boolean
    의존: THREE.Sphere — POI 구 생성; 생성자: {new Sphere()}
    동작:
        레이어를 this로 받아 저장 _shpere가 없으면 _position과 반경 2로 만든다.
        isUpdateVCTRPoint가 true이면 addVisibleState 결과를 반환한다.
        아니면 removeVisibleState 후 false를 반환한다.

createBoundingVolume(tile: VctrTile | undefined) -> undefined
    의존:
        defined — 입력·볼륨 유무; 함수: {defined()}
        U3DTilesBoundingVolume — 타일 볼륨 생성; 생성자: {new U3DTilesBoundingVolume()}
    동작:
        타일이 없으면 끝낸다.
        boundingVolume이 없고 originBoundingValue가 있으면 공유 단위 inverseTileTransform과 undefined 타일 변환으로 볼륨을 만든다.
        자식이 있으면 각 자식에 재귀한다.

getPositionKey(vctr: U3dPOI) -> string
    동작:
        레이어를 this로 받아 이름, x와 y를 clusterRadius로 나눈 반올림 값, z를 10으로 나눈 반올림 값을 밑줄로 연결한다.

setVisiblePOI(poi: Object3D, visible: boolean = false) -> undefined
    동작:
        poi.visible을 지정 값으로 바꾸고 모든 자식에 재귀한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
