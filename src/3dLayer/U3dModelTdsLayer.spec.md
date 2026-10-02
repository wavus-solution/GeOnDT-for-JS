# U3dModelTdsLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

3DS 모델의 XML 또는 모델 목록을 기반 로더로 읽고, 모델 이름에 따른 층별 사용자 그룹 생성과 위치 이동을 제공한다. 파일·그룹·메시 메타데이터 조회·갱신과 선택 그룹 연결도 담당한다. `U3dApp.createTdsModelLayer()`와 `createModelTdsLayer()`에서 생성하며 실제 파일 로딩은 `U3dModelBasicLayer`에 맡긴다.

## 3. 정규 자연어 수도코드

```spec
U3dModelTdsLayerCO 타입 정의
    기반 타입: Omit<U3dModelBasicLayerCO, 'location' | 'scale'> & U3dModelTdsLayerCO_Content
    부모의 location·scale 설명을 자식이 실제 받는 벡터 호환 입력으로 대체한다.

U3dModelTdsLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        baseUrl?: string
            모델 데이터를 받아올 주소다.
        baseurl?: string
            baseUrl의 기존 소문자 호환 키다.
        position?: Vector3Like
            모델 위치이며 location이 falsy일 때 위치 선택에도 사용한다.
        location?: Vector3Like
            모델 위치이며 truthy이면 position보다 우선한다. Vector3는 참조를 유지한다.
        scale?: Vector3Like
            크기이며 undefined 기본값은 새 단위벡터다.
        rotation?: Vector3Like
            회전이며 undefined 기본값은 영좌표 객체다.
        type?: string
            undefined 기본값은 animation이다.
        animationSpeed?: number
            저장 속도이며 undefined 기본값은 1이다.
        animationspeed?: number
            animationSpeed의 기존 소문자 호환 키다.
        containMetaData?: boolean
            메타데이터 사용 여부이며 undefined 기본값은 false이다.
        usePositionOffset?: boolean
            위치 보정 사용 여부이며 undefined 기본값은 false이다.
        positionOffsetName?: string
            위치 갱신 키이며 undefined 기본값은 position_offset이다.
        jsonFileName?: string
            메타데이터 파일 이름이며 undefined 기본값은 metaData.json이다.
        userGroupDataName?: string
            사용자 그룹 저장 키이며 undefined 기본값은 userGroupData이다.
        setAveragePosition?: boolean
            평균 중심 배치 여부이며 undefined 기본값은 false이다.
        setUserGroupFunction?: U3dModelTdsGroupFunction | null
            분류 교체 함수이며 undefined이면 기본 함수를 저장한다. null이면 직접 이름 분류 경로를 사용한다.
        userGroupParams?: U3dModelTdsGroupParams
            저장할 분류 설정 참조이며 undefined이면 새 빈 객체를 만든다.

U3dModelTdsGroupParams 타입 정의
    기반 타입: Record<string, unknown> & U3dModelTdsGroupParams_Content
    사용자 분류 함수가 읽는 추가 키를 허용하며 기본 분류 키의 의미를 구체화한다.

U3dModelTdsGroupParams_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        floorCount?: number
            분류를 시작할 층 번호다.
        height?: number
            층간 높이 이동량이다.
        commonName?: string
            결과 그룹 이름에 붙일 공통 접미사이며 기본 분류 함수 사용 시 필수다. 빈 문자열은 허용한다.
        commonChar?: string
            이름의 층 번호 비교에 사용하는 문자다.
        seperator?: string
            이름을 분리하는 문자이며 생략하면 자동 밑줄 분리다.

U3dModelTdsGroupFunction 함수 타입 정의
    () -> Record<string, Array<ModelMesh>> | undefined
    인터페이스:
        현재 레이어를 this로 받아 결과 이름별 원본 배열을 담은 객체를 반환한다.
        setFloorFromGroupName에서 정상 처리하려면 반환 객체가 필요하며 빈 객체와 빈 원본 배열은 허용한다.
        기본 함수는 필요한 설정이 없으면 undefined를 반환한다. undefined·null 결과를 setFloorFromGroupName에서 사용하면 TypeError가 발생한다.

U3dModelTdsGroupEntry 부분 타입 명세
    이 명세에서 사용하는 필드:
        meshName: string | undefined
            자식의 저장 재질 이름 또는 현재 재질 이름이다.
        oriGroupName: string | undefined
            자식이 반환한 메타데이터 원본 그룹 이름이다.

U3dModelTdsMeshMetaData 부분 타입 명세
    이 명세에서 사용하는 필드:
        fileMetaData, groupMetaData, meshMetaData, userGroupData: unknown
            외부 파일과 사용자 JSON에 따른 메타데이터 참조다. 그룹 부재이면 그룹·메시 항목이 undefined이다.

U3dModelTdsStyledMaterial 타입 정의
    기반 타입: Material & U3dModelTdsStyledMaterial_Content
    선택 표시에 사용하는 색과 최초 원본 스타일을 가진 재질이다.

U3dModelTdsStyledMaterial_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        color: Color
            현재 재질 색이다.
        _oriColor?: Color
            최초 선택 때 복제한 원래 색이다.
        _oriOpacity?: number
            최초 선택 때 저장한 원래 불투명도다.

U3dModelTdsFloorOwner 타입 정의
    기반 타입: Pick<U3dModelTdsLayer, '_group' | 'getMeshName'>
    층 복제 조립에 필요한 원본 그룹과 메시 이름 조회 권한이다.

U3dModelTdsLayer extends U3dModelBasicLayer 클래스 정의
    의존: U3dModelBasicLayer — 모델 로딩 기반; 상속: {U3dModelBasicLayer}

    static OPT_KEYS: Array<string> = 부모 키와 TDS 고유 정본 키 목록
        의존: U3dModelBasicLayer — 상속 옵션 키; 속성 읽기: {OPT_KEYS}
        부모 키에 position·location·scale·rotation·animationSpeed·positionOffsetName·jsonFileName·userGroupDataName·setAveragePosition·setUserGroupFunction·userGroupParams를 추가한다.

    _classtype, _className: string = U3dModelTdsLayer
    _userGroupList: Array<UGroup>
        정규화된 baseUrl이 정의된 생성 경로에서 빈 배열로 만들며 등록·조회·해제가 공유한다.
    _setUserGroupFunction: U3dModelTdsGroupFunction | null
        기본값은 userGroupFunction이며 this가 레이어인 층 분류 교체 지점이다.
    _userGroupParams: U3dModelTdsGroupParams
        기본 빈 객체이며 설정과 조회는 복사 없이 같은 참조를 사용한다.
    _positionOffsetName: string = position_offset
    _jsonFileName: string = metaData.json
    _userGroupDataName: string = userGroupData
    _animationSpeed: number = 1
    _mixers: Array<AnimationMixer>
        생성 시 빈 배열이며 현재 단위에서 애니메이션 믹서를 추가하지 않는다.
    _clock: UClock
    _action: AnimationAction | undefined
    _averagePos: Vector3 | undefined
    _setAveragePosition: boolean = false
    _activeInterval: number | undefined
        animateInterval에서 생성하는 타이머 식별자이며 정지 시 속성 자체를 삭제한다.

    constructor(opt: Partial<U3dModelTdsLayerCO> = {})
        인터페이스: 모델 주소·위치·크기·회전, 메타데이터와 층 분류 옵션을 받는다.
        의존:
            U3dModelBasicLayer — 기반 상태 생성; 생성자: {super()}
            normalizeOptionKeys — 상속 옵션과 기존 표기 호환; 함수: {normalizeOptionKeys()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            defined — null·undefined 판정; 함수: {defined()}
            THREE.Vector3 — 기본 위치·크기와 위치 변환; 생성자: {new THREE.Vector3()}
            UClock — 시간 상태; 생성자: {new UClock()}
        동작:
            new.target의 OPT_KEYS로 옵션 키를 정규화한 결과를 opt에 재할당하고 부모 생성자에 전달한다.
            정규화는 원본 옵션 객체를 변경하지 않으며 null 또는 객체가 아닌 입력은 빈 옵션으로 바꾼다.
            baseurl·animationspeed를 포함한 대소문자 변형을 정본 키로 읽는다. 정본과 다른 표기를 함께 전달하면 다른 표기의 값이 우선하며, 다른 표기가 여러 개이면 입력 열거 순서의 마지막 값이 우선한다.
            부모 생성 후 식별자와 이름을 설정하고 opt.baseUrl을 _baseUrl에 저장한다. 주소가 null 또는 undefined이면 나머지 자식 초기화를 하지 않고 반환한다. [확인 Q-001]
            position과 scale의 undefined 기본값은 각각 새 영벡터와 단위벡터, rotation은 영좌표 객체이며 type은 animation이다. 믹서 목록·시계·미정의 action과 animationSpeed 기본값 1을 저장한다.
            사용자 그룹 목록을 비우고 containMetaData·usePositionOffset·setAveragePosition의 undefined 기본값 false를 저장한다. 이름 옵션 세 개와 averagePos의 미정의 상태를 초기화한다.
            setUserGroupFunction이 undefined이면 기본 함수를 저장하고 userGroupParams가 undefined이면 새 빈 객체를 저장한다.
            location이 truthy이면 그것을, 아니면 position을 _location으로 사용한다. Vector3이면 참조를 유지하고 아니면 x·y·z를 새 Vector3에 복사한다. 두 입력이 없으면 성분 접근에서 예외가 발생한다. [확인 Q-001]

    override initialize() -> void
        인터페이스: 모델 초기화를 시작하며 완료 Promise를 반환하지 않는다.
        의존:
            U3dModelLayer — 공통 초기화; 함수: {prototype.initialize.call()}
            UDrawArg — 좌표 변환; 함수: {getGeographicToWorld()}
            U3dModelBasicLayer — 초기화 배치 상태; 함수: {get3DBoxFromGoogleBox()}; 속성 읽기: {_needXml, _drawArg, _geoLocation, _object, _title, _boundingBox}; 속성 쓰기: {_bbox3D}
            THREE.Vector3 — 경계 중심; 생성자: {new THREE.Vector3()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            U3dModelLayer.initialize를 현재 레이어에 적용한다. _needXml이 정확히 true이면 XML 요청 완료 후 모델 로딩을 시작한다.
            그 외에는 _location이 정의되지 않았을 때만 _geoLocation을 월드 좌표로 변환한다. _object._xml을 새 객체로 만들고 제목을 기록한다.
            _boundingBox로 만든 새 _bbox3D의 중심을 구하여 min과 max에서 빼고 _location을 더한다. 이후 모델 로딩을 시작한다.

    setUserGroupParams(params: U3dModelTdsGroupParams) -> void
        인터페이스: 기본 층 분류 콜백이 읽을 설정 객체를 저장한다.
        의존: defined — null·undefined 판정; 함수: {defined()}
        동작:
            params가 null 또는 undefined이면 반환하고 그 외에는 _userGroupParams 참조를 그대로 교체한다.

    getUserGroupParams() -> U3dModelTdsGroupParams | undefined
        인터페이스: 현재 분류 설정의 저장 참조를 반환한다.
        동작:
            _userGroupParams를 그대로 반환한다.

    setUserGroupFunction(func: U3dModelTdsGroupFunction) -> void
        인터페이스: 레이어를 this로 받아 그룹 이름별 원본 객체 목록을 반환하는 분류 함수를 설정한다.
        의존: defined — null·undefined 판정; 함수: {defined()}
        동작:
            func가 null 또는 undefined이면 반환하고 그 외에는 _setUserGroupFunction을 교체한다.

    getUserGroupFunction() -> U3dModelTdsGroupFunction | null | undefined
        인터페이스: 현재 분류 함수 참조를 반환한다.
        동작:
            _setUserGroupFunction을 그대로 반환한다.

    override dispose() -> void
        인터페이스: 모델과 사용자 그룹 상태를 정리하지만 부모의 완료 Promise는 반환하지 않는다.
        의존:
            U3dModelLayer — 모델 삭제·상위 해제; 함수: {prototype.deleteMesh.call(), prototype.dispose.call()}
            UScene — 표시 객체 분리; 함수: {remove()}
            U3dModelBasicLayer — 해제 대상 상태; 속성 읽기: {_object, _scene}
        동작:
            U3dModelLayer.deleteMesh로 _object를 삭제한 뒤 _scene에서 제거한다. 사용자 그룹 목록을 새 빈 배열로 교체하고 위치 복원 없이 타이머를 정지한다.
            U3dModelLayer.dispose를 호출하며 반환값은 전달하지 않는다. 즉시 부모 U3dModelBasicLayer.dispose를 경유하지 않는다. [확인 Q-002]

    override getBoundingBox() -> Box3 | undefined
        인터페이스: 저장 경계가 Box3일 때만 별도 복사본을 반환한다.
        의존:
            THREE.Box3 — 경계 종류와 복제; 함수: {clone()}
            U3dModelBasicLayer — 저장 경계; 속성 읽기: {_bbox3D}
        동작:
            _bbox3D가 truthy이고 THREE.Box3의 인스턴스이면 clone 결과를 반환한다. 그 외에는 undefined이다. [확인 Q-002]

    setPosition(geo: GeoPosition) -> void
        인터페이스: 지리 좌표로 레이어 위치와 직접 자식 위치를 옮긴다.
        의존:
            U3dApp — 월드 좌표 변환; 함수: {getGeographicToWorld()}
            U3dModelBasicLayer — 배치 문맥과 상태; 속성 읽기: {_drawArg, _group, _geoLocation, _bbox3D}; 속성 쓰기: {_geoLocation.x, _geoLocation.y, _geoLocation.z, _height}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            _drawArg·그 내부 _app·_group·geo·geo.x·geo.y 중 하나라도 정의되지 않았으면 반환한다.
            _geoLocation의 x·y를 먼저 갱신하고 두 성분으로 월드 변환한다. geo.z가 정의되었으면 _height·변환 위치 z·_geoLocation.z를 함께 갱신한다.
            _bbox3D의 min·max에서 이전 _location을 빼고 새 월드 위치를 더한다. _location과 _position에 같은 새 위치 참조를 저장한다.
            _group의 직접 자식 position을 새 위치로 설정하며 별도의 행렬 갱신은 하지 않는다.

    setGroupOriginPosition() -> void
        인터페이스: 현재 그룹과 그 직접 자식 메시의 위치를 원위치로 보관한다.
        의존: U3dModelBasicLayer — 원본 모델 그룹; 속성 읽기: {_group}
        동작:
            _group.children의 각 객체에 position.clone을 _oriPosition으로 저장하고 해당 객체의 직접 자식에도 같은 방식으로 저장한다. 더 깊게 순회하지 않으며 그룹 부재를 검사하지 않는다.

    getAllUserGroupList() -> Array<UGroup> | undefined
        인터페이스: 등록된 사용자 그룹 배열 자체를 반환한다.
        의존: defined — null·undefined 판정; 함수: {defined()}
        동작:
            _userGroupList가 정의되어 있으면 그 참조를 반환하고 아니면 undefined이다.

    setFloorFromGroupName(floorCount: number, height?: number, commonName?: string, commonChar?: string, seperator?: string) -> Array<UGroup> | undefined
        인터페이스: 원본 그룹을 층별로 이동하고 자식을 복제한 사용자 그룹 목록을 반환한다. 등록 목록에 자동 추가하지 않는다.
        처리 기준:
            기본 분류 함수를 실행하려면 commonName이 필요하며 빈 문자열은 허용한다. 생략하면 기본 함수의 undefined 결과를 조립에 전달하여 TypeError가 발생한다.
            사용자 분류 함수로 교체했으면 commonName 필요 여부는 해당 함수에 따르며 반환 객체의 조건은 U3dModelTdsGroupFunction을 따른다.
        의존:
            U3dModelBasicLayer — 그룹 처리 문맥; 속성 읽기: {_drawArg, _group}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            floorCount가 정의되지 않으면 반환한다. height와 commonChar가 정의되지 않으면 각각 0과 0 문자열을 적용하고 seperator가 정의되지 않으면 내부 분리 문자로 밑줄을 사용한다. 콜백 설정에는 생략된 seperator를 undefined로 남긴다.
            _drawArg._app을 먼저 읽고 _group이 정의되지 않았으면 반환한다. 원본 목록을 조회한다.
            원본 위치·자식 이름 연결이 변경되고 처리 플래그는 성공 끝에서 false로 초기화된다. 콜백·복제 실패의 예외와 실패 전 변경을 복구하지 않는다. [확인 Q-003]

    animateInterval(interval: number | String, x?: number, y?: number, z?: number) -> void
        인터페이스: 50ms 반복 호출로 사용자 그룹의 층간 이동량을 증가시킨다. interval*10 회수 경계까지 처리한다.
        의존:
            타이머 — 반복 예약·해제; 함수: {setInterval(), clearInterval()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            interval이 정의되지 않으면 반환하고 String 객체이면 숫자로 곱셈 변환한다. x가 정의되지 않으면 x=0이며 y 또는 z가 정의되지 않은 경우에도 x만 0으로 바꾼다. [확인 Q-004]
            이동량 세 값을 interval*10으로 나누는 초기 계산 후 그룹을 영 이동량으로 배치하고 기존 타이머가 있으면 해제한다.
            count=0에서 50ms 타이머를 시작한다. 매 회 세 목표값을 interval*10으로 나누고 세 나눗셈 결과가 목표값과 모두 엄격히 같거나 count가 interval*10과 느슨하게 같으면 타이머를 해제하고 _activeInterval을 undefined로 설정한 뒤 삭제한다.
            해제한 회차도 각 나눗셈 결과에 count를 곱해 이동을 호출한 다음 count를 증가시킨다. 생성한 타이머 식별자를 _activeInterval에 저장한다.

    stopAnimation(positionInit?: boolean) -> void
        인터페이스: 이동 타이머를 정지하고 요청 시 원위치 이동량을 적용한다.
        의존:
            타이머 — 예약 해제; 함수: {clearInterval()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            _activeInterval이 정의되었으면 타이머를 해제하고 undefined를 대입한 다음 속성을 삭제한다. positionInit이 truthy일 때만 영 이동량을 적용한다.

    moveUserGroupPosition(x?: number, y?: number, z?: number) -> void
        인터페이스: 등록 그룹 순서별로 층간 이동량을 적용한다.
        의존: defined — null·undefined 판정; 함수: {defined()}
        동작:
            _userGroupList가 정의되지 않았으면 반환하고 정의되지 않은 각 좌표는 0으로 대체한다.
            등록 목록 길이를 먼저 저장하고 각 이름으로 실제 원본 목록을 조회한다. 새 좌표 객체, 전체 길이, 전체 길이-i 순서를 전달한다. 조회 실패 결과에 별도 가드를 추가하지 않는다.

    setUserGroupPosition(group: Array<Object3D>, position?: Vector3Like, floorCount?: number, order?: number) -> void
        인터페이스: 원위치와 층간 이동량으로 전달된 객체 목록의 위치를 다시 계산한다.
        의존:
            THREE.Vector3 — 입력 위치 변환; 생성자: {new THREE.Vector3()}
            WebGLRenderer — 그림자 갱신 요청; 속성 읽기: {shadowMap}; 속성 쓰기: {shadowMap.needsUpdate}
            U3dModelBasicLayer — 배치 문맥; 속성 읽기: {_drawArg, _group}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            정의되지 않은 floorCount·order·position은 각각 1·0·새 영벡터로 대체한다. Vector3가 아닌 위치는 x·y·z로 새 Vector3를 설정한다.
            각 좌표와 floorCount의 곱을 구한 뒤 _drawArg._app을 읽는다. shadowMap이 정의되고 enabled가 truthy이면 needsUpdate를 true로 만든다.
            그 다음 _group이 정의되지 않았으면 반환한다. group이 비어 있지 않으면 각 원위치 성분에 앞선 곱을 더하고 order와 해당 이동량의 곱을 빼 position을 설정하며 _isFloorSet을 true로 만든다.
            전체 위치 처리 후 전달 목록의 _isFloorSet을 false로 되돌린다. group과 _oriPosition의 부재를 검사하지 않으며 별도 행렬 갱신은 없다.

    addUserGroup(group: UGroup) -> void
        인터페이스: 같은 이름이 없는 사용자 그룹을 등록한다.
        의존: defined — null·undefined 판정; 함수: {defined()}
        동작:
            _userGroupList에서 이름이 엄격히 같은 항목을 찾고 없을 때만 전달 객체를 그대로 push한다.

    setSelectGrouping(group: Array<ModelMesh>, groupName: string) -> UGroup | undefined
        인터페이스: 선택 메시들을 이름이 있는 사용자 그룹으로 구성한다.
        의존:
            createUserGroup — 선택 그룹 구성; 정적 함수: {create.call()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            createUserGroup.create를 현재 레이어를 this로 적용하여 실행하고 정의된 결과만 반환한다.

    getUserGroupList(groupName?: string, origin?: boolean) -> Object3D | Array<ModelMesh> | Array<UGroup> | undefined
        인터페이스: 원본 이름 그룹 또는 사용자 그룹에 대응하는 원본 메시 목록을 조회한다.
        의존:
            createUserGroup — 그룹 검색; 정적 함수: {getUserGroupList.call()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            origin이 정의되지 않으면 false를 적용한다. 현재 레이어를 this로 외부 검색 함수를 실행하여 정의된 결과만 반환한다. 예외는 User Group Get Error 로그로 기록하고 undefined를 반환한다.

    removeSelectGroup(group: UGroup) -> void
        인터페이스: 사용자 그룹과 관련 메타데이터를 외부 그룹 관리자로 제거한다.
        의존:
            createUserGroup — 그룹 제거; 정적 함수: {remove.call()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            저장 키 이름을 얻고 정의되지 않았으면 userGroupData를 사용한다. 현재 레이어를 this로 외부 remove를 호출한다.

    getMeshName(mesh: ModelMesh) -> string | undefined
        인터페이스: 저장된 재질 이름 또는 현재 단일 재질의 이름을 얻는다.
        의존: defined — null·undefined 판정; 함수: {defined()}
        동작:
            _uMemoryMaterialName이 정의되었으면 그것을 선택하고 아니면 정의된 material의 name, 재질이 없으면 빈 문자열을 선택한다. 선택값이 정의되고 빈 문자열이 아니면 반환한다.
            그 외에 material과 그 name이 정의되어 있으면 _uMemoryMaterialName에 name을 저장하고 빈 문자열도 그대로 반환한다. 나머지는 undefined이며 재질 배열을 펼치지 않는다.

    override getMeshMetaData(obj: ModelMesh) -> U3dModelTdsMeshMetaData | undefined
        인터페이스: 파일·그룹·메시·사용자 그룹 메타데이터를 묶어 반환한다.
        의존:
            ModelMesh — 메타데이터 그룹 이름; 함수: {getMetaDataGroupName(), getParent()}
            U3dModelBasicLayer — 파일 메타데이터; 속성 읽기: {_metaDataObject}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            obj가 정의되지 않거나 _containMetaData가 falsy이거나 _metaDataObject가 정의되지 않으면 반환한다. _containMetaData가 truthy인 경로에서 try 밖에서 메시 이름을 얻고 정의된 이름일 때만 후속 처리한다.
            _containMetaData가 truthy인 경로의 try 안에서 객체의 메타데이터 그룹 이름이 없으면 부모 이름을 _metaDataGroupName에 저장한다. 파일 metadata, 사용자 그룹 저장 키에 해당하는 files 항목, 객체 그룹 이름에 해당하는 files 항목을 읽는다.
            그룹이 존재하면 objects의 메시 이름 항목이 정의된 경우에만 fileMetaData·groupMetaData·meshMetaData·userGroupData 묶음을 반환한다. 그룹 자체가 없으면 groupMetaData와 meshMetaData가 undefined인 묶음을 반환한다.
            그룹은 있으나 메시 항목이 없으면 undefined이다. try 내부 오류는 metadata load fail 로그로 기록한다.

    setMetaDataByUser(target: string, key: string, value: string) -> void
        인터페이스: 그룹 또는 그룹#메시의 메타데이터 키에 JSON 문자열을 해석해 기록한다.
        의존:
            Object3D — 변경 위치 반영; 함수: {updateMatrix(), updateMatrixWorld()}
            U3dModelBasicLayer — 갱신 대상 메타데이터와 객체; 속성 읽기: {_metaDataObject, _object}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            target·key·value가 정의되지 않거나 메타데이터 사용이 꺼져 있거나 메타데이터 객체가 없으면 반환한다. target을 #으로 분리해 첫 두 항목을 그룹 이름과 메시 이름으로 사용하며 이 분리는 try 밖이다.
            try 안에서 없는 그룹을 metadata·objects 빈 객체로 생성한다. 메시 이름이 없으면 그룹 metadata[key]에 JSON.parse(value)를 기록한다. 메시 이름이 있으면 objects를 필요 시 만든 뒤 기존 메시 객체의 key를 갱신하거나 새 메시 객체를 등록한다.
            JSON 해석 전에 생성한 빈 그룹·objects는 해석 실패 시에도 남는다. key가 _positionOffsetName일 때만 후속 위치 반영을 수행한다.
            _object 직접 자식에서 그룹 이름을 찾는다. 그룹과 메시 이름이 모두 있으면 저장 재질 이름 또는 material.name이 맞는 첫 메시만, 그룹은 있고 메시 이름은 없으면 그 그룹의 모든 자식을 _updateMetaDataFn.update에 전달한다.
            이름 그룹이 없으면 _updateMetaDataFn이 정의된 첫 그룹을 찾아 그 자식 모두를 갱신한다. 이후 _object.matrixWorldNeedsUpdate=true와 updateMatrix·updateMatrixWorld를 차례로 적용한다.
            try 내부 오류는 metadata update fail 로그로 기록하며 앞선 변경을 되돌리지 않는다.

    applyUserGroup(group: UGroup, key: string) -> void
        인터페이스: 그룹 자식의 메시 이름과 원본 그룹 이름을 메타데이터 저장 키 아래 기록한다.
        의존:
            U3dModelBasicLayer — 저장 대상 파일 메타데이터; 속성 읽기: {_metaDataObject}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            group이 정의되지 않거나 _containMetaData가 falsy이거나 _metaDataObject가 정의되지 않거나 자식이 비었으면 반환한다.
            files[key]가 정의되지 않았으면 빈 객체를 만들고 group.name 키에 목록을 저장한다. 서버 저장은 실행하지 않는다.

    getUserGroupDataName() -> string
        인터페이스: 사용자 그룹 메타데이터의 저장 키를 반환한다.
        의존: defined — null·undefined 판정; 함수: {defined()}
        동작:
            _userGroupDataName이 정의되지 않았으면 userGroupData를, 그 외에는 저장된 이름을 반환한다.

    getUserGroupData() -> Record<string, Array<U3dModelTdsGroupEntry>> | undefined
        인터페이스: 메타데이터에서 사용자 그룹 저장 항목을 조회한다.
        의존:
            U3dModelBasicLayer — 파일별 사용자 데이터; 속성 읽기: {_metaDataObject}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            _metaDataObject가 정의되었을 때만 저장 키를 조회하며 정의되지 않은 키는 userGroupData로 대체한다. files[key]가 정의되었으면 그 참조를 반환하고 그 외에는 undefined이다.

    override parseXML(xml: XMLHttpRequest) -> void
        인터페이스: XML의 파일 목록·경계·크기·지리 위치·회전을 현재 상태에 반영한다.
        의존:
            UDEF — 파일 이름 처리; 정적 함수: {removeExt(), getFilename()}
            U3dModelBasicLayer — XML 배치 상태; 함수: {get3DBoxFromGoogleBox()}; 속성 읽기: {_xmlList, _object, _listModel, _path, _height, _drawArg}; 속성 쓰기: {_title, _boundingBox, _bbox3D, _height, _geoLocation}
            UDrawArg — 월드 변환; 함수: {getGeographicToWorld()}
            THREE.Vector3 — 경계 중심; 생성자: {new THREE.Vector3()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            responseXML을 _xmlList에 먼저 추가하고 Title 첫 텍스트를 _title에 저장한다. _object._xml을 새 객체로 만들어 제목을 기록하고 첫 파일 이름을 undefined로 설정한다.
            file 요소를 순회하며 _firstFileName이 정의되지 않은 경우에만 현재 파일의 첫 점 앞 문자열을 _firstFileName에 저장한다. 정의된 파일명은 경로를 뺀 이름에서 확장자를 제거해 name을 만들고 baseurl=_path·fileName과 함께 기존 _listModel에 추가한다. 파일명 미정의 분기의 name은 layer+인덱스이나 앞선 문자열 분리에서 먼저 실패할 수 있다.
            BoundingBox 네 속성을 Number로 변환하여 _boundingBox를 교체하고 _bbox3D를 계산한다. Scale 세 속성도 Number로 변환하여 _scale을 교체한다.
            Height 요소가 정의되고 _height가 정확히 0일 때만 해당 첫 텍스트를 숫자로 바꿔 저장한다. Location 세 속성을 숫자로 바꿔 _geoLocation에 저장한다.
            지리 좌표 중 하나라도 truthy이면 월드 변환하여 _location을 교체하고 _bbox3D의 중심을 min·max에서 뺀 뒤 _location을 더한다. 모두 0이거나 falsy이면 위치와 이 경계 이동을 건너뛴다.
            Rotation 세 속성을 숫자로 바꿔 _rotation을 교체한다. 누락 노드·잘못된 구조의 예외를 잡지 않으며 앞선 배열 추가와 상태 변경은 남는다.

    getUserGroupMesh(mesh: ModelMesh, selector?: U3dSelect, group?: Array<ModelMesh>) -> void
        인터페이스: 메시가 속한 사용자 그룹의 원본들을 선택기에 등록하고 선택 목록을 선택적으로 누적한다.
        의존:
            U3dSelect — 선택기 생성·등록; 생성자: {new U3dSelect()}; 함수: {clearSelect(), addSelected(), getObjectKey(), setSelectedAsKey()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            사용자 그룹 메타데이터를 얻고 selector가 정의되지 않았으면 point 모드 선택기를 만든다. 생성한 선택기를 반환하지 않는다.
            입력 메시의 _userGroupName을 순회하고 메타데이터에 해당 이름이 정의되었을 때만 원본 선택 목록을 조회한다. 목록이 정의되고 비었으면 메서드 전체를 반환한다.
            목록이 비어 있지 않고 selector가 U3dSelect 인스턴스이면 그 그룹을 처리하기 전에 clearSelect한다. 각 후보 메시의 _userGroupName이 현재 그룹 이름과 같은 항목마다 처리한다.
            group 인수가 정의되어 있으면 uuid가 같은 항목이 없을 때 후보 메시를 추가한다. 후보와 입력의 메시 이름이 다르면 addSelected한다.
            같은 이름 후보의 객체 키를 얻어 setSelectedAsKey에 전달한다. 중복 그룹 이름에 따른 반복 처리와 메타데이터·이름 배열 부재 예외를 별도로 막지 않는다.

    getGroupMeshes() -> Array<Object3D> | undefined
        인터페이스: 모델 그룹의 직접 자식 배열 참조를 반환한다.
        의존:
            U3dModelBasicLayer — 모델 그룹; 속성 읽기: {_group}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            _group 또는 children이 정의되지 않으면 undefined이며 그 외에는 children 자체를 반환한다.

initWithXML() -> Promise<U3dModelTdsLayer>
    인터페이스: this로 전달된 레이어의 XML을 요청한다.
    의존:
        deferred — 수동 완료 객체; 함수: {deferred()}
        XMLHttpRequest — XML 요청; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send()}
        defined — null·undefined 판정; 함수: {defined()}
    동작:
        deferred와 XMLHttpRequest를 먼저 만든다. _xmlUrl이 정의된 경우 MIME을 text/xml로 지정하고 GET 비동기 요청을 보낸다.
        onload의 this는 요청 객체이다. status가 200이면 this로 전달받아 보관한 레이어의 parseXML을 호출한 뒤 레이어로 resolve한다. 404이면 주소와 파일 부재 로그만 출력한다.
        주소 부재·다른 상태·네트워크 오류에 대한 resolve·reject 처리는 없고 parseXML 예외도 잡지 않는다. deferred를 반환한다. [확인 Q-005]

loadModel() -> Promise<U3dModelTdsLayer | undefined>
    인터페이스: this 레이어의 U3F 또는 목록 로딩 후 완료 상태를 통지한다.
    의존:
        UDEF — Promise 생성; 정적 함수: {createPromise()}
        U3dModelBasicLayer — U3F 초기화; 함수: {initializeU3f()}
        UDrawArg — 화면 갱신 요청; 함수: {setUpdateDate()}
        U3dLayer — 레이어 완료 알림; 함수: {resolve()}
    동작:
        createPromise 실행기에서 _useU3f가 정의되고 truthy이면 initializeU3f 완료 후 자신으로 resolve한다. 그 외에는 목록 로딩에 resolve를 전달한다.
        UDEF.createPromise는 deferred 기반 완료 객체를 반환하며 then은 같은 완료 객체를 반환한다. 성공 시 _isLoaded=true, setUpdateDate, 레이어 resolve(self)를 순서대로 실행한다. 완료 값은 U3F 경로의 레이어 또는 목록 경로의 undefined이며 콜백의 반환값으로 치환되지 않는다.
        완료를 기다리며 등록한 성공 콜백의 예외는 deferred가 __GSError__로 기록하며 이미 반영한 상태는 남는다. UDEF 실행기의 동기 예외는 인수 없는 reject로 종결되지만 이 함수는 모델 비동기 실패를 바깥 reject로 연결하지 않는다. [확인 Q-005]

loadListModel(resolve?: function) -> void
    인터페이스: this 레이어의 선택된 시작 인덱스부터 모델을 병렬 로딩한다.
    의존:
        U3dModelBasicLayer — 모델 로더; 함수: {load()}
        Promise — 전체 완료; 정적 함수: {all()}
        __GError__ — 로딩 실패 기록; 함수: {__GError__()}
        defined — null·undefined 판정; 함수: {defined()}
    동작:
        시작 인덱스는 0이며 _needXml이 truthy이고 _object._xml이 정의되었으면 _firstFileName과 name이 처음 엄격히 같은 항목의 인덱스로 바꾼다. 일치가 없으면 0을 유지한다.
        시작 인덱스부터 목록 끝까지 load를 호출하여 결과를 Promise.all로 모은다. 시작 인덱스 앞의 항목은 로딩하지 않는다.
        모두 성공하면 객체 후처리를 실행한 다음 resolve가 정의된 경우 인수 없이 현재 레이어를 this로 호출한다.
        Promise.all 또는 성공 콜백 실패는 5536043 로그 호출로 연결하며 외부 완료 함수를 호출하지 않는다. 동기 load 예외는 이 catch의 범위 밖이다. 함수 자체는 Promise를 반환하지 않는다. [확인 Q-005]

userGroupFunction() -> Record<string, Array<ModelMesh>> | undefined
    인터페이스: this 레이어의 기본 층 분류 함수이며 그룹 이름별 원본 객체 목록을 만든다.
    의존: defined — null·undefined 판정; 함수: {defined()}
    동작:
        설정 객체를 얻어 floorCount를 먼저 읽은 다음 설정 객체의 정의 여부를 검사한다. commonName·commonChar가 정의되지 않으면 반환한다.
        seperator가 정의되지 않았으면 밑줄을 사용하고 자동 분리 모드로 둔다. 원본 목록을 조회한다.
setAfterLoadedObjects(objects: Array<Object3D>) -> void
    인터페이스: this 레이어의 로딩 객체 배율과 선택적인 평균 중심 위치를 반영한다.
    동작:
        objects가 falsy이거나 비었으면 반환한다. _averagePos의 선택적 clone을 한 번 호출하여 별도 위치를 준비한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
