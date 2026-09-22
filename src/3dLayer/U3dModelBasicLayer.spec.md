# U3dModelBasicLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dModelBasicLayer`는 서로 다른 형식의 3D 모델과 이미지 자료를 레이어 객체로 로드하고 배치하는 공통 기반 클래스다.

### 1.2 책임 범위

모델 목록과 XML 배치 정보, 형식별 로더 연결, 로드 결과의 재질·변환·장면 연결, 표시·투명도·메타데이터와 해제를 담당한다. 타일 작업 기반과 앱·장면 수명은 부모 계열을 사용하며, 파일 형식의 파싱은 각 로더·파서에 맡긴다.

### 1.3 주요 동작 방식

앱 연결 시 부모 초기화 후 XML 또는 생성 옵션으로 배치를 정하고 모델 목록을 로드한다. 목록의 각 항목은 확장자로 로더를 선택하며, 형식별 후처리가 객체를 추가·교체하고 호출자의 완료 객체에 결과를 전달한다.

관찰된 실행 특성: 자체 deferred는 이미 종결된 결과에 콜백을 등록하면 동기 실행될 수 있다. 형식별 반환 대상과 실패 전달 경로가 서로 같지 않으며, 초기화 등록과 모델 로딩 완료는 별개다.

### 1.4 주요 사용처와 연계 대상

`GeOnDT.model.U3dModelBasicLayer`로 공개된다. `U3dMultipleComponentLayer`, `U3dModelTdsLayer`, `U3dModelStaticLayer`가 상속하며, `U3dLodComponentLayer`는 초기화·표시의 기반 구현을 직접 호출한다. `tutorial-official/mergeVerticesObj.html`은 직접 생성과 정점 병합 사용처다.

## 3. 정규 자연어 수도코드

```spec
BoundingBox2D 부분 타입 명세
    이 명세에서 사용하는 필드:
        minx, miny, maxx, maxy: number
            경계의 XY 최솟값·최댓값이다.
        minz?, maxz?: number
            생략 가능한 Z 경계이며 상자 변환에서 nullish이면 0을 사용한다.

ModelInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        name, baseurl, fileName, ext: string
            이름, 자료 기준 주소, 파일 이름과 확장자의 공개 선언이다. 런타임은 ext 생략 시 파일 이름에서 추출하고 일부 로더는 baseurl 생략 시 레이어 주소를 사용한다. [확인 Q-010]
        resolve?: (value: unknown) -> void
            완료 결과를 받으며 model의 멤버로 호출된다.
        reject?: (reason?: unknown) -> void
            실패 이유를 받으며 model의 멤버로 호출된다.

U3dModelBasicLayerCO extends U3dModelLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
            옵션 타입에서는 필수지만 생성자는 Partial 옵션을 받는다.
        baseUrl?, path?, xmlUrl?, u3fUrl?, srs?: string
            모델 기준 주소, XML 파일 목록의 주소, XML 요청 주소, U3F 입력과 원본 좌표계 설정이다.
        title: string = ''
            XML을 사용하지 않을 때 객체 XML 메타데이터에 넣는 제목이다.
        node?: number
            객체의 _nodeID에 저장한다.
        color?: string
            재질의 색상 대체 설정이다.
        side: number = 2
            모델 재질의 면 설정이다.
        type: string = 'model'
            레이어 종류다.
        ext: string = '3ds'
            기본 모델 형식이다.
        drawLine: boolean = true
            U3F·DAE·3DS의 외곽선 생성을 제어한다.
        needTexture: boolean = true
            3DS 로더의 텍스처 사용 설정이다.
        needXml: boolean = true
            XML 배치 정보를 먼저 읽을지 여부다.
        listModel: Array<ModelInfo> = []
            순서대로 로드를 요청할 모델 정보다.
        useLod?: boolean
            U3F 목록 경로의 텍스처 선택을 제어하며 런타임 기본값은 false다.
        yUp: boolean = false
            OBJ 좌표 변환과 배치 위치 적용에 관여한다.
        scale: Vector3 = {x: 1, y: 1, z: 1}
            크기 설정이며 런타임은 XML 미사용일 때 이 기본 객체를 적용한다.
        location?: string
            공개 선언은 문자열이지만 배치 구현은 x·y·z 객체로 읽는다. [확인 Q-009]
        geoLocation: GeoPosition = {x: 0, y: 0, z: 0}
            위경도 배치 입력이다.
        rotation: Vector3Like = {x: 0, y: 0, z: 0}
            배치 회전 입력이며 적용 시 각 성분에 PI/180을 곱한다.
        boundingBox: BoundingBox2D = {minx: 0, miny: 0, maxx: 0, maxy: 0}
            배치 영역이다.
        height: number = 0
            고도 레이어 사용 시 더할 높이다.
        useU3f: boolean = false
            목록 로드 대신 전체 U3F 초기화 경로를 선택한다.
        containMetaData: boolean = false
            3DS 메타데이터 요청·조회와 후처리를 제어한다.
        usePositionOffset: boolean = false
            3DS 메타데이터 수신 뒤 로더 offset 사용을 켠다.
        object?: UGroup
            원본 그룹이라는 공개 선언이 있으나 현재 생성자는 opt.object를 직접 사용하지 않고 부모가 생성한 _group을 사용한다.
        printSprite?: boolean
            PNG를 평면 대신 Sprite로 추가할지 여부다.

ModelObject3D extends Object3D 부분 타입 명세
    이 명세에서 사용하는 필드:
        _xml?: KeyValue
            제목·기준 파일 등 배치 관련 정보를 담는다.
        _name?, _ext?: string
            레이어 이름과 로드 형식 표시다.
        _drawArg?: UDrawArg
            렌더링·좌표 변환 연결이다.
        _nodeID?: number
            생성 옵션의 노드 식별자다.
        af?: boolean
            전체 U3F 초기화에서 true로 저장한다.
        animations?: Array<AnimationClip>
            GLB 애니메이션 복제본을 보관한다.
        hasGizmo?
            존재하면 removeGizmoUI()로 편집 UI를 제거한다.
        setManualUpdate?: () -> void
            고도 변경 후 수동 갱신을 알리는 연결이다.

U3dModelBasicLayerCompletion 부분 타입 명세
    이 명세에서 사용하는 필드:
        resolve: (value?: any) -> void
            형식마다 다른 성공값을 전달한다. 완료 함수의 반환값은 사용하지 않는다.
        reject: (reason?: any) -> void
            기존 실패 이유를 전달한다. 레이어에 부착된 완료 제어에도 사용하는 연결이다.

U3dModelBasicLayerU3fTarget 부분 타입 명세
    이 명세에서 사용하는 필드:
        _classtype, _name: string
            메시 이름과 레이어 연결을 읽는다.
        _opacity: number
            표시 불투명도 상태를 읽는다.
        _drawLine
            외곽선 생성 설정을 읽는다.
        _object: ModelObject3D
            복원한 메시를 추가하는 표시 그룹이다.
        settingModelLayerMaterial: (material: ModelMaterial) -> void
            레이어의 재정의 가능한 재질 설정을 같은 수신 객체로 호출한다.

U3dModelBasicLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 공통 모델 레이어 기반; 상속: {U3dModelLayer}

    static OPT_KEYS: Array<string>
        부모 키에 drawLine·needTexture·needXml·listModel·useLod·yUp·geoLocation·boundingBox·useU3f·u3fUrl·xmlUrl·containMetaData·printSprite·containMetaData·usePositionOffset을 이어 붙인다. containMetaData 중복을 포함하며 배열과 필드는 외부 변경을 차단하지 않는다.

    modelType: object
        OBJ='obj', TDS='3ds', DAE='dae', U3F='u3f', FBX='fbx', JPG='jpg', PNG='png', GLB='glb', GLTF='gltf', UMESH='umesh'로 초기화한다. 외부 쓰기가 가능하고 load가 현재 값으로 지원 여부와 분기 대상을 읽는다.

    constructor(opt: Partial<U3dModelBasicLayerCO> = {})
        의존:
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_group}
            normalizeOptionKeys — 실제 생성자 계열 키로 옵션 정규화; 함수: {normalizeOptionKeys()}
            U3dModelLayer — 부모 초기화; 생성자: {super()}
            defaultValue — undefined 입력의 기본값 선택; 함수: {defaultValue()}
            UGroup — 후처리 대상 그룹 초기화; 생성자: {new UGroup()}
            THREE — 배치 값 객체와 면 설정; 생성자: {new Vector3()}; 상수: {DoubleSide}
        동작:
            new.target으로 옵션을 정규화한 뒤 부모 생성자를 호출한다.
            클래스 이름과 미로드·미표시·미초기화 상태를 저장한다. 부모 _group을 _object와 공유하고 별도 _drawObject와 _objectList·_xmlList를 준비한다.
            객체 이름을 name 또는 빈 문자열로 지정하고 위치를 원점으로 만든 뒤 node를 _nodeID에 저장한다.
            색상·기준 주소·면·종류·확장자·외곽선·텍스처·XML·모델 목록·경로·LOD·Y-up·좌표계 설정을 저장한다. undefined만 기본값으로 대체하며 listModel은 복사하지 않는다.
            needXml이 falsy일 때만 크기·위치·위경도·회전·경계를 옵션과 기본값에서 저장한다. 위치 기본값은 undefined다.
            제목·높이·U3F·XML 주소·비디오 목록·메타데이터·offset·Sprite 설정을 저장하고 modelType을 구성한다.

    override setApp(app: U3dApp) -> void
        의존:
            defined — null·undefined 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_group}
            U3dLayer — 앱 연결 상태 보관; 속성 쓰기: {_app, _camera, _frustum, _drawArg, _quadtreeSet, _light}
            U3dApp — 앱 렌더 연결; 속성 읽기: {_camera, _frustum, _drawArg, _quadtreeSet}
            UDrawArg — 조명 조회; 함수: {getLight()}
        동작:
            앱·카메라·프러스텀을 저장하고 app._drawArg가 truthy일 때만 현재 _drawArg를 교체한다.
            quadtree를 저장한다. _light에는 app._drawArg가 nullish이면 undefined를, 아니면 getLight() 결과를 쓰므로 이전 조명을 유지하지 않는다.
            _group이 정의되었으면 현재 _drawArg를 연결한다.
            app._drawArg의 truthy 여부와 _group 존재 여부에 관계없이 동적으로 선택되는 initialize를 호출하고 결과를 그대로 반환한다.

    override initialize() -> void
        의존:
            defined — null·undefined 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태와 완료 인터페이스; 속성 읽기: {_drawArg, reject, resolve}
            U3dLayer — 기반 초기화·이벤트·장면 연결; 함수: {prototype.initialize.call()}
            UDrawArg — 위경도 변환; 함수: {getGeographicToWorld()}
        동작:
            U3dLayer.initialize를 직접 호출한다. 부모 모델 레이어의 별도 연결을 호출한 것으로 확장하지 않는다.
            needXml===true이면 XML 완료 뒤 모델 로드를 등록하고 성공·실패에 레이어 resolve/reject를 값 없이 호출한다.
            needXml===true가 아닌 경로에서는 다음을 실행한다.
                location이 정의되지 않았고 geoLocation이 정의되었을 때만 월드 위치를 계산한다.
                위치 계산 여부와 관계없이 객체 XML 제목을 만든다. boundingBox가 정의되었으면 _bbox3D를 저장한다.
                모델 로드를 시작하고 성공·실패에 레이어 resolve/reject를 값 없이 호출한다.
            어느 경로에서도 로드 완료 객체를 반환하지 않는다.

    reLoad() -> Promise<string>
        의존:
            deferred — 재로드 완료 객체; 함수: {deferred()}
        동작:
            모델 목록 로드를 다시 실행하고 성공하면 별도 완료 객체를 값 없이 종결한다. 실패하면 이유의 message를 거부값으로 전달하며, 이유가 null·undefined여도 undefined로 거부하여 대기 상태를 끝낸다. [확인 Q-001]

    initializeU3f() -> Promise<boolean>
        의존:
            defined — null·undefined 검사; 함수: {defined()}
            deferred — 초기화 완료 객체; 함수: {deferred()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_drawArg}
            UDrawArg — 갱신과 로딩 UI; 함수: {setUpdateDate()}
            U3dApp — 로딩 UI 종료; 함수: {endloadingBar()}
            THREE — 메시 종류 판정; 속성 읽기: {Mesh}
            Web API — 취소 로그; 함수: {console.info()}
        동작:
            baseUrl이 정의되지 않았으면 별도 완료 객체를 값 없이 거부하고 반환한다.
            u3fUrl과 baseUrl로 자료를 요청한다. 요청 실패는 로그만 남기며 별도 완료 객체에 연결하지 않는다. [확인 Q-002]
            요청 성공 시 메시를 구성한다. 결과가 없거나 메시 구성 실패이면 로그를 남기고 별도 완료 객체를 종결하지 않는다. [확인 Q-005]
            메시 구성 완료 뒤 _location·_scale을 parseVector3로 읽어 객체의 위치·크기에 복사한다.
            _rotation을 같은 helper로 읽고 복제한 벡터에만 PI/180을 곱하여 객체 회전에 적용한다. Vector3 하위 타입과 일반 x·y·z 입력 모두 원본 회전 설정을 보존하므로 반복 로딩에서도 같은 각도를 적용한다.
            af=true로 하고 행렬을 갱신한 뒤 drawArg를 갱신한다.
            Mesh 하위 타입을 포함한 자손에서 이미지 URL이 있으면 첫 텍스처를 요청하여 material.map과 needsUpdate를 설정한다. 텍스처 완료는 기다리지 않고 로딩 UI를 종료한 뒤 true로 종결한다.

    override createModel() -> boolean
        동작:
            타일 모델 생성 작업을 수행하지 않고 true를 반환한다.

    parseXML(xml: XMLHttpRequest) -> void
        의존:
            defined — null·undefined 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_drawArg}
            UDEF — 파일 이름·확장자 분리; 정적 함수: {getFilename(), removeExt()}
            UDrawArg — 위치 변환; 함수: {getGeographicToWorld()}
            Web API — XML 노드·속성 조회; 함수: {getElementsByTagName(), getAttribute()}; 속성 읽기: {responseXML, firstChild.data}
        동작:
            responseXML을 _xmlList에 추가하고 첫 Title의 첫 텍스트를 제목과 객체 XML 제목으로 저장한다. 필수 노드·텍스트의 존재를 별도로 검사하지 않는다.
            file 노드마다 파일 이름을 읽어 모델 목록에 추가한다. 정의된 이름이면 확장자를 뺀 이름을, 아니면 layer와 순번을 name으로 쓰고 baseurl에는 _path를 사용한다.
            첫 Scale·Location·Rotation·BoundingBox의 속성을 Number로 읽는다. Height가 있으면 텍스트를 Number로 저장한다.
            Location의 위경도를 월드 위치로 변환하고 경계에서 _bbox3D를 구성한다. 기존 목록을 비우지 않는다.

    updateHeightTile(tile: KeyValue, parent: KeyValue, drawArg: UDrawArg) -> void
        의존:
            defined — null·undefined 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_group}
            THREE — 경계 생성; 생성자: {new Box3()}
            URaycaster — 지형 교차; 함수: {set(), intersectObjects()}
        동작:
            tile·parent·drawArg·scene·camera·group 중 필요한 값이 정의되지 않았으면 종료한다. group.updateHeight_가 정의되었으면 false여도 종료한다.
            타일 메시와 각 직계 자식 메시의 bbox가 없으면 객체에서 계산한다. 자식 bbox 중심보다 Z가 1000 큰 위치에서 아래 방향 ray를 보낸다.
            parent._group의 자손 교차가 있으면 첫 교차 Z를 자식 위치에 쓰고, 없으면 parent._parent가 있을 때 그 그룹에 같은 검사를 한다.
            모든 직계 자식에서 교차를 얻었으면 updateHeight_=true로 한다. 빈 그룹도 이 조건을 만족한다.

    override updateHeight() -> boolean
        동작: 고도를 변경하지 않고 false를 반환한다.

    updateHeightDetail() -> boolean
        동작: 상세 고도를 변경하지 않고 false를 반환한다.

    override refresh() -> void
        의존:
            UDrawArg — 갱신 알림; 함수: {setUpdateDate()}
            defined — null·undefined 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_drawArg}
        동작: _drawArg가 정의되었을 때만 갱신 날짜를 변경한다.

    getBoundingBox() -> Box3
        의존: THREE — 객체 경계 계산; 생성자: {new Box3()}; 함수: {Box3.setFromObject()}
        동작: _object 전체의 경계를 새 Box3에 계산하여 반환한다.

    checkIsExistModel(name: string, baseurl?: string) -> boolean
        동작: 모델 정보 검색 결과를 boolean으로 바꾸어 반환한다.

    getModelInfo(name: string, baseurl?: string) -> ModelInfo | undefined
        동작:
            현재 _listModel에서 name이 엄격히 같은 항목을 순서대로 찾는다. baseurl이 truthy이면 주소도 엄격히 같아야 한다.
            첫 일치 항목의 원본 참조를 반환하고 없으면 undefined를 반환한다.

    load(model: ModelInfo, textureUrl?: string) -> Promise<ModelObject3D>
        의존:
            defined — 파일 이름·확장자 존재 검사; 함수: {defined()}
            deferred — 항목 완료 인터페이스 부착; 함수: {deferred()}
            UDEF — 작업 완료 객체와 파일 이름; 정적 함수: {createPromise(), removeExt()}
            Web API — 입력·로딩 오류 로그; 함수: {console.error()}
        동작:
            model.resolve가 falsy일 때만 model 자체에 deferred 인터페이스를 붙인다.
            완료 인터페이스를 붙였는지와 관계없이 이름·주소를 검색하고 미등록이면 같은 model 참조를 목록에 추가한다. 이어 UDEF.createPromise로 파일 검증과 형식 선택 작업을 등록한다.
            별도 로딩 결과의 resolve/reject는 첫 호출에서 완료 상태를 기록하고 외부 완료 객체를 종결한 뒤 nullish가 아닌 model.resolve/model.reject를 멤버 호출한다. 이후 호출은 무시하여 성공 통지 중 발생한 콜백 예외가 모델 실패의 중복 통지로 바뀌지 않게 한다. 초기 입력 검증과 FBX 실패의 외부 거부는 이 연결을 사용하지 않는다.
            fileName이 정의되지 않았으면 이름을 포함한 오류를 로그로 남기고 거부한다.
            ext가 정의되었으면 확장자 없는 fileName에 덧붙이고, 추출 확장자와 엄격히 다르면 로그·거부한다. 일치하면 기존 확장자를 제거한 뒤 다시 붙인다.
            ext가 없으면 파일 이름의 확장자를 사용한다. 점이 없거나 추출 값이 비었으면 로그·거부한다. 확장자 비교는 이 단계에서 대소문자를 정규화하지 않는다.
            현재 modelType 값들에 ext.toLowerCase()가 없으면 로그·거부한다. 통과하면 String(ext).toLowerCase()로 로더를 선택하며, 이 선택은 model.resolve의 원래 존재 여부와 무관하다.
            OBJ·3DS·DAE를 각 로더로 전달하고 각 성공 후처리를 등록한다. textureUrl은 3DS에만 전달한다.
            u3f는 문자열 분기로 선택하여 loadU3FLoader 완료를 별도 deferred에 전달하고 후처리를 등록한다.
            FBX·JPG·PNG·UMESH도 형식별 로딩과 성공 후처리를 연결한다. FBX는 실패 로그 뒤 외부 거부를 호출하지만 다른 연결에는 공통 실패 전달을 추가하지 않는다. [확인 Q-005]
            GLB와 GLTF는 같은 분기에서 GLB 로더로 읽으며, 로딩 성공 시 장면 후처리를 실행한다. 로더의 비동기 거부, 요청 설정의 동기 예외와 장면 후처리 예외는 별도 로딩 결과의 reject로 보내 외부 완료 객체와 모델에 같은 이유를 전달한다. 이미 성공을 통지했다면 뒤의 예외로 실패를 중복 통지하지 않는다.
            외부에서 바꾼 modelType 값으로 지원 검사를 통과해도 switch의 분기값과 일치하지 않으면 로더를 시작하거나 완료 객체를 종결하지 않는다. GLB 분기에서 직접 잡은 예외 이외의 등록 작업 안 동기 예외는 UDEF.createPromise가 값 없이 거부하며, 이후 로더 callback의 실패와 구분한다.
            반환 타입은 ModelObject3D로 선언되어 있지만 GLB는 로더 결과 객체, U3F는 레이어, 이미지와 UMESH는 레이어 객체 그룹을 완료값으로 전달한다. [확인 Q-003]

    getU3FInfo(model: ModelInfo | KeyValue | string | undefined, baseurl: string) -> DeferredObject<any>
        의존:
            UFileLoader — 바이너리 요청; 생성자: {new UFileLoader()}; 함수: {setResponseType(), load()}; 속성 쓰기: {crossOrigin}
            U3FParser — 자료 파싱; 생성자: {new U3FParser()}; 함수: {parse()}
            deferred — 완료 객체; 함수: {deferred()}
        동작:
            model.baseurl을 요청 주소로 직접 읽는다. model 자체가 없으면 요청 전에 예외가 발생하며 문자열 입력의 주소를 별도 보정하지 않는다. [확인 Q-002]
            익명 crossOrigin과 arraybuffer 응답으로 로드한다. 성공 시 같은 완료 객체·baseurl·model을 파서 옵션에 전달한다.
            파서 반환값이 undefined이면 false로 거부한 뒤 반환값으로 resolve도 호출한다. 요청 실패는 false로 거부한다.

    getTexture(url: string) -> Promise<Texture>
        의존:
            UTextureLoader — 텍스처 요청; 생성자: {new UTextureLoader()}; 함수: {load()}
            deferred — 완료 객체; 함수: {deferred()}
        동작:
            텍스처 로드 성공 시 updateMatrix 후 텍스처로 종결한다. 진행·오류 callback 모두 값 없이 거부한다. [확인 Q-008]

    getObjectCenter() -> Vector3
        의존: THREE — 경계 계산; 생성자: {new Box3()}; 함수: {Box3.setFromObject()}
        동작: _object의 경계 중심을 기존 _objectCenter에 저장하고 같은 벡터 참조를 반환한다.

    override dispose() -> Promise<boolean>
        의존:
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_scene, _app}
            U3dModelLayer — 그룹·레이어 해제; 함수: {fncDeleteGroup(), prototype.dispose.call()}
            THREE.Scene — 장면 분리; 함수: {remove()}
        동작:
            _object를 fncDeleteGroup에 전달한다. _scene이 truthy이면 그 장면에서 제거하고, 아니면 앱 장면이 있을 때 제거한다.
            U3dModelLayer.dispose를 직접 호출하고 반환값을 그대로 전달한다.

    override update() -> void
        동작: _isLoaded가 truthy일 때만 메타데이터 기준 높이를 갱신한다.

    updateHeightByMetadata() -> void
        의존:
            defined — null·undefined 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_drawArg}
            U3dApp — 앱 모드·고도 레이어 조회; 함수: {getMode(), getHeightLayers()}
            U3dLayer(heightLayer) — 고도 레이어 표시 판정; 함수: {getVisible()}
            UDEF — 편집 모드; 상수: {APP_MODE._GIZMO}
            UMathEngine — 월드 축척 환산; 정적 함수: {getRealScaleAtGoogle()}
        동작:
            drawArg의 앱이 GIZMO 모드이면 종료한다. 정의되어 있고 getVisible()!==false인 고도 레이어가 하나라도 있는지 찾는다.
            고도 레이어가 있으면 먼저 1/getRealScaleAtGoogle(location)을 구하고 (geoLocation.z+height)에 곱한 높이를 사용한다. 없으면 location.z를 사용한다.
            현재 객체 Z와 엄격히 다를 때만 위치를 쓰고 존재하는 setManualUpdate를 호출한다.

    override show(show: boolean) -> void
        의존:
            defined — null·undefined 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_drawArg, _scene}
            THREE.Scene — 장면 표시 연결; 함수: {getObjectById(), remove(), add()}
            U3dModelLayer — 부모 표시 상태; 함수: {prototype.show.call()}
        동작:
            drawArg의 앱·scene·object가 정의되지 않았으면 종료한다.
            객체가 장면에 있고 show가 falsy이면 제거하고, 없고 truthy이면 추가한다.
            기즈모가 truthy일 때만 UI를 제거한다.
            기즈모 유무와 장면 추가·제거 여부에 관계없이 U3dModelLayer.show에 show만 전달한다. 부모 반환값은 전달하지 않는다.

    editUndo(object: ModelObject3D) -> void
        의존:
            THREE.Scene — 객체 교체; 함수: {getObjectById(), remove(), add()}
            defined — null·undefined 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_scene}
        동작:
            현재 객체가 장면에 있으면 그 객체를 제거한다.
            기존 객체의 장면 존재 여부에 관계없이 _object를 입력 참조로 교체한 뒤 장면에 추가한다. 기존 객체를 해제하지 않는다.

    override setOpacity(val: number) -> void
        의존:
            defined — 자손 재질 존재 검사; 함수: {defined()}
            U3dLayer — 투명도 상태; 함수: {prototype.setOpacity.call()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_opacity, _transparent}
        동작:
            U3dLayer.setOpacity를 직접 호출한 뒤 _object의 자손을 순회한다.
            정의된 재질을 배열로 취급하여 각 opacity에 현재 _opacity를 쓴다. userData._keepTransparent가 truthy이면 transparent를 유지하고 아니면 _transparent를 쓴다.

    setVisibleByName(name: string, visible: boolean) -> void
        의존: THREE — 메시 종류 판정; 속성 읽기: {Mesh}
        동작: Mesh 하위 타입인 자손 중 이름이 엄격히 같은 메시의 material.alphaTest를 visible의 truthy 여부에 따라 0 또는 1로 쓰고 needsUpdate=true로 한다. Object3D.visible은 바꾸지 않는다.

    get3DBoxFromGoogleBox(googleBox: BoundingBox2D) -> UBox3
        의존:
            THREE — 경계 벡터; 생성자: {new Vector3()}
            UBox3 — 3D 경계; 생성자: {new UBox3()}
        동작: XY 경계와 nullish이면 0인 Z 경계로 min·max 벡터를 만들어 새 UBox3를 반환한다.

    override getMetaData() -> any
        의존:
            U3dModelLayer — 부모 메타데이터; 함수: {prototype.getMetaData.call()}
            UMeta — 자식 정보 추가; 함수: {addChild()}
        동작: 부모의 메타데이터에 ext·path·needXml·baseUrl·listModel을 담은 정보를 추가하고 같은 메타 객체를 반환한다.

    getMeshMetaData(obj: ModelMesh) -> U3dModelBasicMeshMetaData | false | undefined
        의존:
            Web API — 조회 오류 로그; 함수: {console.log()}
            defined — null·undefined 검사; 함수: {defined()}
        동작:
            obj가 정의되지 않았거나 메타데이터 사용이 falsy이거나 _metaDataObject가 없으면 undefined로 종료한다.
            _uMemoryMaterialName이 정의되었으면 그것을, 아니면 material.name을 사용한다. 이름이 없거나 빈 문자열이면 같은 선택식을 한 번 더 수행한다.
            이름이 정의되었으면 try 안에서 _metaDataGroupName이 없을 때 parent.name을 저장하고 files의 해당 그룹을 조회한다.
            그룹이 없으면 false다. 객체별 메타가 정의되었으면 fileMetaData·groupMetaData·meshMetaData를 반환한다.
            객체별 메타가 없으면 fileMetaData·groupMetaData·meshMetaData=undefined를 반환한다.
            try 내부 예외는 로그 뒤 undefined로 끝난다. try 이전의 material 접근 오류는 여기서 잡지 않는다.

    skClone(source: ModelMesh) -> any
        의존: USkinnedMesh — 재사용 복제; 정적 함수: {cloneForReuse()}
        동작: source를 복제 함수에 전달하고 결과를 그대로 반환한다.

    mergeVertices(tolerance: number, useClone: boolean) -> void
        의존:
            defined — 복제 그룹 존재 검사; 함수: {defined()}
            U3dLayer — 상속받은 실행 상태; 속성 읽기: {_group, _scene}
            UGroup — 병합 표시 그룹; 생성자: {new UGroup()}
            U3dGeometryUtil — 정점 병합; 함수: {mergeVertices()}
            THREE.Scene — 그룹 등록·제거; 함수: {add(), remove()}
        동작:
            현재 _object를 순회 대상으로 보관한 뒤 _object를 _group으로 바꾼다.
            scene의 직계 자식 중 name+'_mergeVerticesMeshes'와 이름이 같은 그룹의 isMesh 자손을 숨기고 geometry·material·메시를 순서대로 dispose한 뒤 장면에서 제거한다.
            useClone이 truthy이면 새 UGroup을 같은 이름으로 장면에 추가한다.
            순회 대상의 isMesh 자손마다 geometry를 복제해 tolerance로 병합한다. 복제 경로에서는 메시·재질도 복제하고 원본 material.visible=false, 복제 material.visible=true로 한 뒤 새 그룹에 추가한다.
            비복제 경로에서는 원본 자식 geometry를 병합 결과로 교체한다. 변환을 추가로 보정하거나 이전 geometry를 별도로 해제하지 않는다.

loadModel() -> Promise<void>
    인터페이스: this는 로드를 시작할 U3dModelBasicLayer다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        deferred — 로드 완료 객체; 함수: {deferred()}
        UDrawArg — 로드 후 갱신; 함수: {setUpdateDate()}
    동작:
        useU3f가 정의되고 truthy이면 전체 U3F 초기화를 시작하고 성공 시 _isLoaded=true·갱신 알림 뒤 값 없이 종결한다. 해당 비동기 실패는 별도 연결하지 않는다. [확인 Q-005]
        그 외에는 현재 목록을 로드한다. 성공 시 같은 상태·갱신을 반영하고, 실패하면 받은 오류로 거부한다. 동기 예외도 거부한다.

initWithXML()
    인터페이스: this는 XML 설정을 가진 U3dModelBasicLayer다. onload의 this는 XMLHttpRequest다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        deferred — XML 완료 객체; 함수: {deferred()}
        Web API — XML 요청·오류 로그; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send(), console.error()}; 콜백: {onload}
    동작:
        XML 주소가 정의되었으면 text/xml 응답으로 비동기 GET을 보낸다.
        status===200이면 parseXML 후 레이어로 종결한다. 404이면 파일 부재를 로그로 남긴다. 주소 부재·다른 상태·요청 오류를 종결하는 별도 경로는 없다. [확인 Q-004]

convertObj2Mesh(self: U3dModelBasicLayer, objs: Array<KeyValue>, drawArg: UDrawArg)
    의존:
        defined — 자료·장면 존재 검사; 함수: {defined()}
        deferred — 메시 구성 완료 객체; 함수: {deferred()}
    동작:
        objs·drawArg 또는 drawArg._scene이 정의되지 않았으면 null을 반환한다.
        전체 순회 뒤 true로 종결한 deferred를 반환한다. 실패를 별도로 잡거나 이미 추가한 메시를 되돌리지 않는다.

loadListModel()
    인터페이스: this는 현재 모델 목록을 가진 U3dModelBasicLayer다.
    동작:
        현재 _listModel의 길이를 매 반복에서 읽으며 각 항목을 순서대로 동적 load에 전달한다. 모은 결과를 Promise.all로 반환한다.

loadU3FLoader(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        UDrawArg — 갱신 알림; 함수: {setUpdateDate()}
        U3dApp — 로딩 UI 종료; 함수: {endloadingBar()}
        THREE — 메시 종류; 속성 읽기: {Mesh}
        Web API — 취소 로그; 함수: {console.info()}
    동작:
        레이어 baseUrl이 정의되지 않았으면 undefined를 반환한다. 그 외에는 모델과 baseUrl로 파서 결과를 요청하고 그 완료 객체 자체를 반환한다.
        요청 실패는 로그를 남긴다. 요청 성공 시 메시 구성 결과가 없으면 같은 완료 객체에 false 거부를 시도하고, 구성 실패도 로그를 남긴다.
        구성 성공 후 _location·_scale을 parseVector3로 읽어 객체의 위치·크기에 복사한다. 이 배치는 _useLOD 여부와 무관하다.
        _rotation을 같은 helper로 읽고 복제한 벡터에만 PI/180을 곱하여 객체 회전에 적용한다. Vector3 하위 타입과 일반 x·y·z 입력 모두 원본 회전 설정을 보존하므로 반복 로딩에서도 같은 각도를 적용한다.
        matrixWorldNeedsUpdate=true로 하고 행렬 갱신 뒤 drawArg에 알린다.
        Mesh 자손에 이미지가 있으면 useLOD가 truthy일 때 첫 URL, 아니면 마지막 URL의 텍스처를 요청한다. 성공한 텍스처를 material에 적용하되 완료를 기다리지 않는다.
        로딩 UI를 끝내고 원래 파서 완료 객체에 true 완료를 시도한다. 이미 종결된 파서 결과가 대체된 것으로 간주하지 않는다.

loadMTLLoader(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — 로컬 자료·파싱 결과·주소 존재 검사; 함수: {defined()}
        UDEF — 완료 객체; 정적 함수: {createPromise()}
        UMTLLoader — MTL 자료 로드; 생성자: {new UMTLLoader()}; 함수: {parse(), setPath(), setCrossOrigin(), load()}
        __GInfo__ — 완료 로그; 함수: {__GInfo__()}
        Web API — 지연 실행·오류 로그; 함수: {setTimeout(), console.error()}
    동작:
        localmtldata가 정의되었으면 타이머에서 파싱한다. 결과가 정의되었으면 preload 후 그 재질 집합으로 완료하고, 아니면 로그 뒤 값 없이 거부한다. 이 경로에서는 원격 요청을 하지 않는다.
        localmtldata가 정의되지 않은 원격 경로는 model.baseurl이 정의되었으면 사용하고 아니면 레이어 baseUrl을 사용한다. 마지막에 슬래시가 없으면 추가한다.
        경로와 anonymous crossOrigin을 설정하고 fileName의 마지막 점 앞 부분에 .mtl을 붙여 로드한다.
        성공 로그 뒤 preload하고 재질 집합으로 완료한다. 실패는 로그 뒤 값 없이 거부하며 진행 callback은 상태를 바꾸지 않는다.

loadOBJLoader(promise: U3dModelBasicLayerCompletion, model: ModelInfo & KeyValue, materials: any)
    인터페이스: this는 U3dModelBasicLayer이며 promise의 resolve/reject를 멤버 호출한다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        UOBJLoader — OBJ 자료 로드; 생성자: {new UOBJLoader()}; 함수: {parse(), setMaterials(), setPath(), load()}
        __GInfo__ — 완료 로그; 함수: {__GInfo__()}
        __GError__ — 오류 로그; 함수: {__GError__()}
        Web API — 지연 로컬 파싱; 함수: {setTimeout()}
    동작:
        localobjdata가 정의되었으면 타이머에서 파싱하고 정의된 결과는 로그 후 완료, 없으면 오류 로그 후 값 없이 거부한다. 이 경로에서는 전달된 materials와 원격 주소를 사용하지 않는다.
        localobjdata가 정의되지 않은 원격 경로는 materials를 설정하고 정의된 model.baseurl 또는 레이어 baseUrl을 경로로 사용한다. OBJ 경로 끝에 슬래시를 별도로 추가하지 않는다.
        fileName의 마지막 점 앞 부분에 .obj를 붙여 로드한다. 성공은 로그 뒤 객체로 완료하고, 실패는 오류 message를 로그에 포함한 뒤 값 없이 거부한다.
        전달받은 promise를 그대로 반환한다.

loadFBX(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존: deferred — 중계 완료 객체; 함수: {deferred()}
    동작: FBX 로더의 성공 결과 또는 실패 이유를 별도 deferred에 그대로 전달하고 반환한다.

loadGLB(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존: deferred — 중계 완료 객체; 함수: {deferred()}
    동작:
        GLB 로더를 시작하고 성공 결과의 userData.inputNmae에 model.name을 저장한 뒤 결과로 완료한다. 실패 이유는 별도 deferred에 전달한다.
        성공 callback 안에서 userData 접근이 실패한 경우를 별도 거부 경로로 만들지 않는다.

loadUMESH(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존: deferred — 중계 완료 객체; 함수: {deferred()}
    동작: UMESH 로더의 성공 결과 또는 실패 이유를 별도 deferred에 그대로 전달하고 반환한다.

loadJPG(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존: deferred — 중계 완료 객체; 함수: {deferred()}
    동작: JPG 로더 성공 결과를 별도 deferred로 전달하고 반환한다. 실패 callback은 연결하지 않는다. [확인 Q-005]

loadJPGLoader(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        deferred — 이미지 완료 객체; 함수: {deferred()}
        THREE — 이미지·Sprite 생성; 생성자: {new TextureLoader(), new SpriteMaterial(), new Sprite()}; 함수: {TextureLoader.load()}
    동작:
        model.baseurl이 정의되었으면 그대로, 아니면 레이어 baseUrl+'/'에 fileName을 붙여 텍스처를 요청한다. 오류 callback은 등록하지 않는다.
        성공 경로의 useSprite는 false이므로 평면 표시 분기를 사용한다.
        평면 표시 분기에서 만든 Mesh에 레이어 renderOrder를 지정하여 _object에 추가하고 메시로 완료한다.

afterLoadJPG(promise: U3dModelBasicLayerCompletion) -> void
    인터페이스: this는 U3dModelBasicLayer이며 promise.resolve를 멤버 호출한다.
    의존: UDrawArg — 갱신 알림; 함수: {setUpdateDate()}
    동작:
        레이어 기본 객체에 배치 변환을 적용한다.
        matrixWorldNeedsUpdate=true로 하고 행렬을 갱신한다. _name을 기록하고 drawArg 갱신 뒤 _object로 완료한다.

loadPNG(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존: deferred — 중계 완료 객체; 함수: {deferred()}
    동작: PNG 로더 성공 결과를 별도 deferred로 전달하고 반환한다. 실패 callback은 연결하지 않는다. [확인 Q-005]

loadPNGLoader(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        deferred — 이미지 완료 객체; 함수: {deferred()}
        THREE — 이미지·Sprite 생성; 생성자: {new TextureLoader(), new SpriteMaterial(), new Sprite()}; 함수: {TextureLoader.load()}
    동작:
        model.baseurl이 정의되었으면 그대로, 아니면 레이어 baseUrl에 fileName을 붙여 텍스처를 요청한다. JPG의 대체 주소와 달리 슬래시를 추가하지 않는다. 오류 callback은 등록하지 않는다.
        printSprite가 정의되었으면 그 값을 사용하고 아니면 false다. truthy이면 흰색 SpriteMaterial·Sprite를 만들어 _object에 추가하고 Sprite로 완료한다.
        평면 표시 분기에서만 만든 Mesh에 레이어 renderOrder를 지정하여 _object에 추가하고 메시로 완료한다. Sprite 분기에서는 이 단계와 비공개 평면 구성을 실행하지 않는다.

afterLoadPNG(promise: U3dModelBasicLayerCompletion) -> void
    인터페이스: this는 U3dModelBasicLayer이며 promise.resolve를 멤버 호출한다.
    의존: UDrawArg — 갱신 알림; 함수: {setUpdateDate()}
    동작:
        레이어 기본 객체에 배치 변환을 적용한다.
        matrixWorldNeedsUpdate=true로 하고 행렬을 갱신한다. _name을 기록하고 drawArg 갱신 뒤 _object로 완료한다.

loadFBXLoader(model: ModelInfo & KeyValue)
    의존:
        deferred — 파일 완료 객체; 함수: {deferred()}
        UFBXLoader — FBX 로딩; 생성자: {new UFBXLoader()}; 함수: {load()}
    동작:
        model.baseurl+fileName으로 로드하고 성공 callback의 try에서 원본 객체로 완료한다. catch는 받은 오류로 거부한다.
        로더의 진행·실패 callback을 등록하지 않는다.

loadGLBLoader(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        deferred — 파일 완료 객체; 함수: {deferred()}
        UDRACOLoader — 압축 해제 연결; 생성자: {new UDRACOLoader()}; 함수: {setPath()}
        UDEF — decoder 경로; 상수: {DRACO_DECODER_PATH}
        UGLTFLoader — GLB 로딩; 생성자: {new UGLTFLoader()}; 함수: {setDRACOLoader(), load()}
        U3dMessage — 실패 로그; 정적 함수: {info()}
    동작:
        DRACO decoder 경로를 설정하여 GLTF 로더에 연결한다.
        정의된 model.baseurl 또는 레이어 baseUrl에서 마지막 슬래시 한 개를 제거한 뒤 '/'와 fileName을 붙인다.
        성공은 GLTF 결과 객체로 완료하고, 실패는 안내 로그 뒤 오류로 거부한다. 진행 callback은 상태를 바꾸지 않는다.

afterLoadGLB(promise: U3dModelBasicLayerCompletion, model: KeyValue) -> void
    인터페이스: this는 U3dModelBasicLayer이며 model은 GLTF 로더 결과다. promise.resolve는 멤버 호출한다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        UMesh — 메시 종류; 속성 읽기: {UMesh}
        THREE — 메시 종류·재질·애니메이션; 속성 읽기: {Mesh}; 생성자: {new AnimationMixer()}
        UDEF — 교체 객체 해제; 정적 함수: {disposeObject3D()}
        defaultValue — 재질 대체값; 함수: {defaultValue()}
    동작:
        model.scene을 재사용 복제한다.
        복제본에 배치 변환을 적용한 뒤 UMesh 또는 Mesh 하위 타입 자손의 geometry 경계를 계산한다.
        model.userData.inputNmae가 정의되었으면 복제본 이름을 그 값으로 바꾼다. 이 최종 이름과 같은 직계 자식을 찾아 제거·해제한 뒤 _ext='glb'를 쓴다. 입력 이름이 없으면 원본 장면 이름으로 교체 대상을 찾는다.
        isMesh가 truthy인 자손은 그림자 송수신을 켜고, 재질이 정의되었으면 단일 재질을 배열로 취급하여 각 재질을 처리한다.
        각 재질에서 metalness가 truthy일 때만 defaultValue(현재값,0.7)를, roughness가 truthy일 때만 defaultValue(현재값,0.4)를 쓴다.
        두 속성의 truthy 여부와 관계없이 처리 중인 재질의 toneMapped·fog를 false로 하고 원본 투명 상태를 보관한다.
        복제 모델을 _object에 추가하고 _drawObject로 저장한다.
        model.animations의 각 clip을 복제하여 같은 복제본을 _object.animations와 복제 모델 animations 양쪽에 추가한다. 복제 모델을 대상으로 AnimationMixer를 저장한다.
        _object.matrixWorldNeedsUpdate=false로 쓴 뒤 행렬을 갱신하고 원래 GLTF 결과 model로 완료한다.

loadUMESHLoader(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        deferred — 파일 완료 객체; 함수: {deferred()}
        UMeshParser — UMESH 로딩; 생성자: {new UMeshParser()}; 함수: {load()}
        U3dMessage — 실패 로그; 정적 함수: {info()}
    동작:
        정의된 model.baseurl 또는 레이어 baseUrl의 마지막 슬래시 한 개를 제거한 뒤 '/'와 fileName을 붙인다.
        성공은 파서 결과로 완료하고 실패는 안내 로그 뒤 오류로 거부한다. 진행 callback은 상태를 바꾸지 않는다.

afterLoadUMESH(promise: U3dModelBasicLayerCompletion, model: Array<ModelMesh>) -> void
    인터페이스: this는 U3dModelBasicLayer이며 promise.resolve를 멤버 호출한다.
    동작:
        각 메시의 _ext='umesh'를 쓰고 _object에 추가할 때마다 _object의 행렬을 갱신한다.
        배치 변환·동일 이름 교체를 추가로 수행하지 않고 _object로 완료한다.

afterLoadFBX(promise: U3dModelBasicLayerCompletion, model: ModelInfo & KeyValue, object: ModelMesh) -> void
    인터페이스: this는 U3dModelBasicLayer이며 promise.resolve를 멤버 호출한다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        THREE — 메시 종류; 속성 읽기: {Mesh}
        UDEF — 교체 자원 해제; 정적 함수: {disposeObject3D()}
        UDrawArg — 갱신 알림; 함수: {setUpdateDate()}
    동작:
        원본 로드 객체의 배치와 Mesh 자손 경계를 갱신한다.
        model.name과 같은 기존 직계 자식을 찾은 뒤 원본을 재사용 복제하고 복제 이름을 model.name으로 쓴다.
        기존 객체가 정의되었으면 제거·해제한다.
        기존 객체 유무와 관계없이 복제본을 _object에 추가하여 _drawObject로 저장한다.
        _object.matrixWorldNeedsUpdate=true와 행렬·갱신 알림을 반영하고, 추가한 복제본이 아닌 원본 로드 객체로 완료한다.

afterLoadU3F(promise: U3dModelBasicLayerCompletion) -> void
    인터페이스: this는 U3dModelBasicLayer이며 promise.resolve를 멤버 호출한다.
    동작: 레이어 자체를 완료값으로 전달한다.

loadOBJ(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존: UDEF — OBJ 완료 객체; 정적 함수: {createPromise()}
    동작:
        완료·거부 함수를 묶어 MTL 로드를 시작한다. MTL 성공 결과를 materials로 넘겨 OBJ 로더를 실행하도록 등록한다. 공통 실패 연결은 없다. [확인 Q-005]

afterLoadOBJ(promise: U3dModelBasicLayerCompletion, model: ModelInfo & KeyValue, object: ModelMesh) -> void
    인터페이스: this는 U3dModelBasicLayer이며 promise.resolve를 멤버 호출한다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        THREE — 메시 종류·대체 색상; 속성 읽기: {Mesh}; 생성자: {new Color()}
        U3dModelLayer — 중심 재설정; 함수: {setOriginCenter()}
        UDEF — 모델 종류와 교체 자원 해제; 상수: {UMESH_TYPE._complexBuilding}; 정적 함수: {disposeObject3D()}
        UDrawArg — 갱신 알림; 함수: {setUpdateDate()}
    동작:
        Mesh 하위 타입 자손마다 _yUp이 truthy일 때만 다음 축·좌표 보정을 실행한다.
            matrixWorldNeedsUpdate=true로 하고 위치 속성의 각 XYZ를 변환하여 같은 배열에 덮어쓴다.
            해당 자식 행렬에 '+X+Y+Z'에서 '-X-Y+Z'로의 기저 변환을 만들고 위치·quaternion·scale로 분해한다. 이어 중심을 재설정하고 자식 행렬을 갱신한다.
        _yUp 여부와 관계없이 각 Mesh 자손의 경계·레이어 이름·복합 건물 종류·renderOrder를 저장한다.
        자손의 재질이 정의되었으면 단일 재질을 배열로 취급하여 각 shininess=30을 쓴다. 색상은 _color가 정의되었을 때만 대체한다.
        색상 대체 여부와 관계없이 해당 재질의 fog=false·현재 opacity를 쓰고 원본 transparent를 보관한다.
        레이어 기본 객체에 배치 변환을 적용하고 _objectList에서 _object와 이름이 같은 항목을 모두 교체하며 없으면 추가한다.
        기본 객체 행렬을 갱신한 뒤 로드 object.name=model.name으로 한다. 같은 이름의 기존 직계 자식이 정의되었으면 제거·해제한다.
        기존 자식 유무와 관계없이 원본 로드 객체를 추가하고 _drawObject로 저장한다.
        갱신을 알리고 로드 object로 완료한다.

loadDae(model: ModelInfo & KeyValue)
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        deferred — 파일 완료 객체; 함수: {deferred()}
        UColladaLoader — DAE 로딩; 생성자: {new UColladaLoader()}; 함수: {load()}
    동작:
        model이 정의되지 않았으면 undefined로 종료한다. ext는 모델 값 또는 레이어 값으로 선택하지만 요청 주소에는 쓰지 않는다.
        정의된 model.baseurl을, 아니면 레이어 baseUrl을 사용한다. 대체 주소가 정의되지 않았으면 undefined로 종료한다.
        주소 끝에 슬래시가 없으면 붙이고 fileName으로 로드한다. 성공 결과 또는 오류를 완료 객체에 전달하고 반환한다.

afterLoadDAE(promise: U3dModelBasicLayerCompletion, model: ModelInfo & KeyValue, object: ModelMesh) -> void
    인터페이스: this는 U3dModelBasicLayer다. object.scene을 후처리하며 model 인수는 읽지 않는다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
        THREE — 메시 종류·경계·색상·외곽선; 속성 읽기: {Mesh, LineSegments}; 생성자: {new Vector3(), new Color(), new EdgesGeometry(), new LineSegments(), new LineBasicMaterial(), new Box3()}
        U3dModelLayer — 중심 설정; 함수: {setOriginCenter()}
        UDEF — 모델 종류·교체 자원 해제; 상수: {UMESH_TYPE._complexBuilding}; 정적 함수: {disposeObject3D()}
        THREE.Scene — 장면 연결; 함수: {remove(), add()}
    동작:
        입력의 scene을 대상으로 Mesh 하위 타입 자손을 순회하고 position 속성이 없으면 해당 자식을 건너뛴다.
        경계를 계산하여 중심을 _oriCenter에 저장한다. !((중심X>1 && 중심X<-1) || (중심Y<1 && 중심Y>-1))일 때 정점에서 중심 XY와 경계 최소 Z를 빼고 경계를 다시 계산한다. [확인 Q-007]
        정점 중심 보정 여부와 관계없이 중심을 재설정하고 레이어 이름·복합 건물 종류를 기록한다. 정의된 재질은 단일값을 배열로 취급한다.
        각 재질에서 _color가 정의되었을 때만 색상을 대체한다. 색상 대체 여부와 관계없이 자식이 LineSegments가 아니면 opacity·metalness=0.1과 원본 transparent 보관을 적용한다.
        drawLine이 truthy이고 position 속성이 있으면 검은색·선폭 2 외곽선을 추가한다.
        외곽선 생성 여부와 관계없이 자손 처리를 마친 scene 객체에 배치 변환과 행렬 갱신을 적용한다. _objectList에서 같은 이름의 모든 항목을 교체하거나 없으면 추가한다.
        현재 장면의 같은 이름 직계 자식을 순방향 순회하며 제거하고 로드 scene을 추가한다. 이어 _object의 같은 이름 첫 자식을 제거·해제하고 로드 scene을 _object에 추가한다.
        최종 _object 경계의 min.z<0일 때만 _defaultHeight=-min.z를 저장한다.
        경계 높이 조건과 관계없이 로드 scene으로 완료한다.

load3DS(model: ModelInfo & KeyValue, textureUrl?: string)
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — 로더·주소·첫 파일 기준 존재 검사; 함수: {defined()}
        UDEF — 파일 완료 객체; 정적 함수: {createPromise()}
        UTDSLoader — 3DS 로딩; 생성자: {new UTDSLoader()}; 함수: {setPath(), setResourcePath(), load(), dispose()}
        U3dModelLayer — 첫 파일 중심; 함수: {setOriginCenter()}
    동작:
        needTexture·drawArg·side·color·needXml로 로더를 만든다. 로더가 정의되지 않았으면 값 없이 거부한다.
        정의된 model.baseurl 또는 레이어 baseUrl을 사용하고 대체 주소가 정의되지 않았으면 완료하지 않고 실행을 끝낸다. 끝 슬래시가 없으면 붙여 setPath에 전달한다. [확인 Q-005]
        textureUrl이 정의되었으면 resourcePath로 사용하고 아니면 모델 주소를 사용한다.
        _containMetaData가 truthy이면 metaData.json을 별도로 요청한다.
            수신 callback에서 JSON 파싱값·fileName을 로더에 저장하고 같은 메타 객체를 레이어에 저장한다.
            이 callback에서 _usePositionOffset이 truthy일 때만 로더 _useOffset=true로 한다. _usePositionOffset만 켜져 있고 _containMetaData가 falsy이면 메타데이터 요청과 offset 변경 모두 하지 않는다.
        메타데이터 사용 여부와 관계없이 모델을 요청하며 메타데이터 수신을 기다리지 않는다.
        모델 성공 시 로더를 dispose한다. _averagePos가 정의되지 않았고 _setAveragePosition이 truthy이며 목록이 둘 이상일 때만 첫 파일 판정을 한다.
            fileName의 첫 점 앞 부분과 정의된 XML _firstFileName을 대소문자 무시 비교한다. 두 이름이 일치하고 자식이 있으면 첫 자식의 중심을 설정하고 그 position 복제본을 _averagePos로 저장한다.
        첫 파일 판정·중심 저장 여부와 관계없이 원본 모델로 완료하고, 모델 요청 실패는 오류로 거부한다.

afterLoad3DS(promise: U3dModelBasicLayerCompletion, model: ModelInfo & KeyValue, object: ModelMesh)
    인터페이스: this는 U3dModelBasicLayer이며 전달받은 promise와 이 함수가 만드는 완료 객체를 별도로 종결한다.
    의존:
        defined — 비디오·중심·재질·외곽선·교체 객체 존재 검사; 함수: {defined()}
        UDEF — 후처리 완료·종류·해제; 정적 함수: {createPromise(), disposeObject3D()}; 상수: {UMESH_TYPE._complexBuilding}
        THREE — 메시·선 종류, 색상·외곽선·경계; 속성 읽기: {Mesh, LineSegments}; 생성자: {new Color(), new EdgesGeometry(), new LineSegments(), new LineBasicMaterial(), new Box3()}
        U3dApp — 비디오 레이어; 함수: {createVideoLayer()}
        U3dModelLayer — 중심 설정; 함수: {setOriginCenter()}
        Web API — 후처리 오류 로그; 함수: {console.error()}
    동작:
        별도 완료 객체의 try 안에서 object.name=model.name으로 쓰고 Mesh 하위 타입 자손을 순회한다.
        videourl이 정의되었으면 각 자식과 레이어 배치 설정으로 비디오 레이어를 만들어 _videoLayer에 추가한다.
        레이어 이름·복합 건물 종류를 쓰고 XML 첫 파일 이름이 없거나 현재 파일 이름과 대소문자 무시 비교가 다르면 자식 중심을 설정한다.
        정의된 재질은 단일값을 배열로 취급한다. 각 재질에서 _color가 정의되었을 때만 색상을 대체하며, 색상 대체 여부와 관계없이 자식이 LineSegments가 아니면 opacity·metalness=0.1과 원본 transparent 보관을 적용한다.
        _drawLine이 truthy이고 geometry·position 속성이 정의되었을 때만 검은색·선폭 2 외곽선을 추가한다.
        외곽선 생성 여부와 관계없이 각 Mesh 자손의 geometry 경계를 계산한다.
        자손 처리를 마친 뒤 _setAveragePosition이 falsy일 때만 로드 object에 배치 변환을 적용한다.
        배치 변환 적용 여부와 관계없이 object.matrixWorldNeedsUpdate=true와 행렬 갱신을 반영한다. 같은 이름의 기존 직계 자식이 정의되었으면 제거·해제한다.
        기존 자식 유무와 관계없이 로드 객체를 추가하여 _drawObject로 저장한다.
        레이어 객체의 경계 min.z<0이면 _defaultHeight=-min.z를 저장한다.
        _containMetaData가 truthy일 때만 각 Mesh 자식의 부모에 존재하는 _updateMetaDataFn.update를 child·레이어 인수로 멤버 호출하고 레이어 객체 행렬을 다시 갱신한다.
        정상 후처리를 마치면 메타데이터 사용 여부와 관계없이 전달된 promise를 object로 먼저 종결하고 별도 완료 객체는 값 없이 완료한다. try 오류는 로그 뒤 전달 promise를 object로 거부하고 별도 완료 객체는 값 없이 거부한다.

readJsonFile(file: string, callback: (data: string) -> void) -> false | undefined
    인터페이스: callback에 요청 본문 문자열을 전달하며 수신 객체는 지정하지 않는다.
    의존:
        Web API — 메타데이터 요청; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send(), console.log()}; 콜백: {onreadystatechange}
        defined — null·undefined 검사; 함수: {defined()}
    동작:
        file 또는 callback이 정의되지 않았으면 undefined로 종료한다.
        application/json MIME으로 비동기 GET을 시작한다. readyState===4 && status===200인 callback에서 responseText를 전달한다.
        요청 설정의 동기 예외는 로그 뒤 false를 반환하고 정상 등록은 undefined다. 비동기 callback의 예외와 요청 실패를 별도 처리하지 않는다.

setObjectPosition(object?: ModelObject3D) -> void
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defined — null·undefined 검사; 함수: {defined()}
    동작:
        object가 정의되지 않았으면 레이어 _object를 대상으로 삼는다.
        location이 정의되었으면 yUp이 truthy일 때 원점, 아니면 location을 position에 복사한다.
        _location·_yUp 분기와 독립적으로 _scale이 정의되었으면 크기를 복사하고, _rotation이 정의되었으면 회전을 적용한다. 각 적용 입력은 parseVector3로 읽는다.
        회전 적용은 helper 반환 벡터를 복제한 뒤 복사본에만 PI/180을 곱하고 Euler로 설정한다. Vector3 하위 타입과 일반 x·y·z 입력 모두 원본 회전 설정을 보존하므로 반복 호출에서도 같은 각도를 적용한다.

parseVector3(val: Vector3 | Vector3Like) -> Vector3
    의존: THREE — 벡터 종류·생성; 속성 읽기: {Vector3}; 생성자: {new Vector3()}
    동작: Vector3 하위 타입이면 입력 참조를 그대로 반환하고 아니면 x·y·z로 새 Vector3를 만든다.

getBasisTransform(from: string, to: string, targetMatrix: Matrix4) -> Matrix4 | null
getConvertedVec3(data: Array<number> | Float32Array, offset: number, isPosition: boolean) -> Array<number>
    인터페이스: this는 U3dModelBasicLayer다.
    의존:
        defaultValue — 원본 좌표계 기본값; 함수: {defaultValue()}
        ol.proj — 좌표계 변환; 함수: {get(), transform()}
        UDrawArg — 월드 좌표 변환; 함수: {getGeographicToWorld()}
    동작:
        offset부터 XYZ를 새 배열로 읽고 Y=-기존Z, Z=기존Y로 바꾼다. 입력 배열은 변경하지 않는다.
        isPosition이 truthy이면 _srs가 undefined일 때만 EPSG:5186으로 대체하고 해당 좌표계의 XY를 EPSG:4326으로 변환한다. 변환 XY와 교체한 Z를 월드 위치 변환에 전달한다.
        위치 변환 결과 XYZ를 새 배열로 반환한다. isPosition이 falsy이면 축 교체 결과만 새 배열로 반환한다.

keepMaterialTransparent(material: Material) -> void
    의존:
        defined — null·undefined 검사; 함수: {defined()}
    동작:
        material이 falsy이거나 isMaterial이 falsy이거나 transparent가 정의되지 않았으면 종료한다.
        userData가 falsy이면 빈 객체로 바꾸고 transparent가 truthy일 때만 _keepTransparent에 그 값을 저장한다. false일 때 기존 보관값을 지우지 않는다.
```

## 4. 공통 처리 기준과 제약

```spec
목록·장면·재질과 완료 객체는 원본 참조를 공유하는 경로가 있다. 제거와 dispose는 같지 않으며 형식별 추가·교체·해제 순서를 따른다.
defined는 null·undefined를 부재로 판정하지만 defaultValue는 undefined만 대체한다. null과 false·0·빈 문자열을 같은 기본값 처리로 합치지 않는다. 형식별 주소 조합을 하나의 정규화 규칙으로 일반화하지 않는다.
수신 레이어의 재정의 가능한 메서드는 동적 호출을 유지한다. 이름을 지정한 부모 prototype 호출은 그 기반 구현을 직접 선택한다.
deferred 완료 객체의 then/catch는 같은 완료 객체를 돌려주며 이미 종결된 결과의 callback이 동기 실행될 수 있다. callback 등록·자료 수신·후처리·레이어 완료는 각 실행에 기록한 경계를 따른다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
