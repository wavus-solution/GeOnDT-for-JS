# U3dModelBIMObjLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

`U3dModelBIMObjLayer`는 MTL·OBJ와 JSON 메타데이터를 연결하여 파일별 배치, 개별 객체 표시·선택 및 서버의 제어 케이스를 제공한다. 부모 레이어의 앱·그룹·수명주기를 사용하고, 자체 로딩은 파일별 순차 실행한다. 제어 케이스는 위치·제외·레벨·속성 변경 자료이며 조회·저장은 렌더 객체에 자동 적용하는 작업과 구분된다.

`GeOnDT.model.U3dModelBIMObjLayer`로 제공되며 `U3dApp.createModelBIMObjLayer()`가 생성·등록한다. 직접 협력 대상은 `U3dModelLayer`, `UMTLLoader`, `UOBJLoader`, 앱의 좌표·고도 변환 및 XMLHttpRequest이다.

## 3. 정규 자연어 수도코드

```spec
U3dBIMLocation 타입 정의
    문자열 성분을 허용하는 파일·제어 위치다. setPosition은 문자열 성분을 숫자로 바꾸며 원본 객체를 수정한다.
    x: number | string
    y: number | string
    z: number | string

U3dBIMSourceFile 부분 타입 명세
    파일 URL·병합 파일·메타 파일 키는 생성 옵션에 따라 바뀌므로 추가 이름과 값은 Record<string, unknown>으로 받는다. 고정 배치 필드만 기록한다.
    이 명세에서 사용하는 필드:
        location: U3dBIMLocation
            원본 배치 위치다.
        boundingbox: {minz: number}
            원본 경계이며 minz는 자동 고도에서 사용한다.

U3dModelBIMObjLayerCO extends U3dModelLayerCO 부분 타입 명세
    부모 모델 옵션에 BIM 옵션을 합성한다. 생성자는 Partial을 받아 누락 항목에서 부분 초기화 상태로 반환할 수 있다. BIM 생성자가 직접 읽는 소문자 옵션 이름을 유지한다.
    이 명세에서 사용하는 필드:
        layername: string
        serverurl: string
        baseurl: string
        metaData: {files: Record<string, U3dBIMSourceFile>, cases?: Array<string>}
        useproxy?: boolean
            nullish이면 false를 사용한다.
        proxyurl?: string
            nullish이면 './proxy.jsp?url='을 사용한다.
        name?: string
            nullish이면 'U3dModelBIMObjLayer'를 사용한다.
        autoHeight?: boolean
        mergeFileUrlKey?: string
            nullish이면 'wavefrontobj_basepath'를 사용한다.
        mergeFileKey?: string
            nullish이면 'wavefrontobj_merge_file'을 사용한다.
        metaFileKey?: string
            nullish이면 'metadata_file'을 사용한다.

U3dBIMMetaRecord 타입 정의
    원본 메타데이터의 필드명과 값은 입력 자료가 결정한다. MetaData 생성자는 같은 사전에서 metaIdKey·metaParentKey·metaNameKey·fileNameKey·objectTypeKey·typeKey·tagKey·propertiesKey도 선택적으로 읽어 실제 데이터 키를 정한다.
    기반 타입: Record<string, unknown>

U3dBIMTreeState 부분 타입 명세
    tree는 현재 루트, list는 삽입 순서, map은 ID별 마지막 등록 노드다. 비공개 트리 조립은 이 세 참조를 직접 수정한다.
    이 명세에서 사용하는 필드:
        tree: Array<MetaData>
        list: Array<MetaData>
        map: Record<string, MetaData>

U3dBIMMaterial extends Material 부분 타입 명세
    Three.js Material에 색상·텍스처와 BIM 복원 상태를 더한다. map은 선택 복원 시 해제 대상이 될 수 있다.
    이 명세에서 사용하는 필드:
        color: Color
        map?: Texture | null
        _oriColor?: Color
        _oriOpacity?: number

U3dBIMMesh 부분 타입 명세
    단일·배열 재질을 사용하는 Three.js Mesh에 BIM 상태를 더한다. getMeta는 메타데이터 연결 성공 시에만 생긴다.
    기반 타입: Mesh<BufferGeometry, U3dBIMMaterial | Array<U3dBIMMaterial>>
    이 명세에서 사용하는 필드:
        _orlMaterial?: U3dBIMMaterial | Array<U3dBIMMaterial>
        _meta?: MetaData
        getMeta?: () => MetaData
        _utype?: number
        _ulayername?: string

U3dBIMFile 타입 정의
    생성 시 파일 입력을 조합하고 OBJ·메타데이터 로드 뒤 선택 속성을 채우는 상태다. location·boundingBox는 원본 자료와 공유한다.
    name: string
    modelUrl: string
    metaFileUrl?: string
    mergeFile: string
    materialsFile: string
    location: U3dBIMLocation
    boundingBox: {minz: number}
    _objectLength?: number
    _objectMap?: Record<string, U3dBIMMesh>
    _nonMatchMeta?: U3dBIMMetaRecord
    _objectMetaTree?: MetaDataTree

U3dBIMControlFile 타입 정의
    파일별 속성·레벨·위치·제외 설정이다. change_position은 새 케이스에서 빈 객체이며 세 성분이 모두 존재할 때만 위치 조회 결과를 만든다.
    change_attributes: Record<string, unknown>
    change_level: Record<string, {start_level: number}>
    change_position: Partial<{longitude: number | string, latitude: number | string, transHeight: number | string}>
    exclusion_globalids: Array<string>

U3dBIMControlData 타입 정의
    저장할 케이스 내용이다. export가 만든 바깥 객체와 달리 files는 케이스 원본과 공유한다.
    name?: string
    description?: string
    files: Record<string, U3dBIMControlFile>

U3dBIMControlResponse 타입 정의
    서버 읽기 결과 또는 신규 케이스 구성 자료다. json·time·url 누락의 처리는 ControlCase 생성자에 따르며 flag의 nullish 기본값은 update다.
    json: U3dBIMControlData
    time: string
    url: string
    flag?: string
        nullish이면 'update'를 사용한다.

U3dBIMLevelEntry 타입 정의
    레벨 목록 조회가 새로 만드는 ID·시작 레벨 항목이다.
    id: string
    level: number

U3dBIMPropertiesEntry 타입 정의
    속성 목록 조회가 새로 만드는 ID·속성 항목이다. properties는 저장 자료와 공유될 수 있다.
    id: string
    properties: unknown

U3dModelBIMObjLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 상속 기반; 상속: {U3dModelLayer}
    _classtype: string = 'U3dModelBIMObjLayer'
    _useproxy: boolean = false
    _proxyurl: string = './proxy.jsp?url='
    _layername: string
    _metaData: U3dModelBIMObjLayerCO.metaData
    _autoHeight: boolean | undefined
    _object: UGroup
    _getControlUrl: string = '/v1/getBIMControlFile'
    _setControlUrl: string = '/v1/setBIMControlFile'
    _serverUrl: string
    _mergeFileUrlKey: string = 'wavefrontobj_basepath'
    _mergeFileKey: string = 'wavefrontobj_merge_file'
    _metaFileKey: string = 'metadata_file'
    _files: Record<string, U3dBIMFile>
    _controlFileUrlList: Array<string>
    _controlCases: Record<string, ControlCase>
    _bbox: Box3 | undefined

    U3dModelBIMObjLayer.constructor(opt: Partial<U3dModelBIMObjLayerCO> = {})
        의존:
            U3dModelLayer — 부모 생성; 생성자: {new U3dModelLayer()}
            U3dLayer — 부모가 만든 그룹·주소; 속성 읽기: {_group, _baseUrl}
            UDEF — 레이어 종류; 상수: {LAYER_TYPE.MODEL}
            defined — nullish 판정; 함수: {defined()}
            defaultValue — nullish 기본값; 함수: {defaultValue()}
            Web API(console) — 진단 기록; 함수: {info()}
        동작:
            부모 생성 후 opt, layername, serverurl, metaData, metaData.files, baseurl 순으로 정의 여부를 검사하고 첫 누락에서 로그를 남겨 부분 초기화 상태로 종료한다.
            정상 입력이면 클래스 식별자, MODEL 종류, 프록시 설정(false, './proxy.jsp?url='), 이름, 레이어명, 메타데이터 참조와 autoHeight를 저장하고 _object를 부모 _group과 공유한다.
            제어 읽기·쓰기 경로를 '/v1/getBIMControlFile', '/v1/setBIMControlFile'로 정한다.
            파일 URL·병합 파일·메타 파일 키를 각각 wavefrontobj_basepath, wavefrontobj_merge_file, metadata_file로 기본 설정한다.
            각 파일을 검증하고 유효한 항목만 _files에 등록한다. 파일의 위치·경계는 원본 참조이며 materialsFile은 'materials.mtl'이다.
            cases의 URL을 분할하여 '#'가 포함된 첫 부분의 마지막 문자만 케이스 번호로 사용하고 '/레이어명/번호'를 _controlFileUrlList에 추가한다. _controlCases는 빈 객체로 시작한다. [확인 Q-001]

    override U3dModelBIMObjLayer.show(show: boolean, refresh: boolean = true) -> void
        의존:
            U3dLayer — 표시 상태와 앱; 속성 읽기·쓰기: {_visible}; 속성 읽기: {_app}
            U3dApp(_app) — 화면 갱신; 함수: {forceUpdate()}
            defined — nullish 판정; 함수: {defined()}
        동작:
            _visible과 show가 엄격히 같으면 종료하고 다르면 상속 _visible 속성에 show를 대입한다. 이 setter는 가시성의 참·거짓 전환에 따라 SHOW 또는 HIDE를 통지하므로 단순 데이터 필드 대입이 아니다.
            속성 대입이 반환된 뒤 refresh가 참이고 _app이 정의되어 있으면 forceUpdate를 호출한다. 부모 show의 그룹 정리·작업 취소 경로는 호출하지 않는다.

    override U3dModelBIMObjLayer.initialize() -> void
        의존:
            U3dModelLayer — 상속된 초기화 진입점; 함수: {prototype.initialize.call()}
            U3dLayer — 초기화 구현과 생성자에서 부착한 완료 제어; 함수: {initialize(), resolve(), reject()}
            defined — nullish 판정; 함수: {defined()}
        동작:
            _classtype이 정의되지 않았거나 정확히 'U3dModelBIMObjLayer'가 아니면 종료한다.
            부모 initialize 후 현재 레이어를 receiver로 load를 실행한다. 성공하면 레이어 자체로 resolve하고 실패하면 받은 이유로 reject한다.

    U3dModelBIMObjLayer.isValidMetaData(name: string, metaData?: U3dBIMSourceFile) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
            Web API(console) — 진단 기록; 함수: {error()}
        동작:
            metaData가 정의되지 않으면 false를 반환한다.
            _mergeFileUrlKey, _mergeFileKey, location, boundingbox 순서로 정의 여부만 검사한다. 누락한 첫 항목을 오류 로그로 남기고 false를 반환하며 모두 정의되어 있으면 true를 반환한다. 빈 문자열이나 내부 필드의 완전성은 검사하지 않는다.

    U3dModelBIMObjLayer.getBoundingBox() -> Box3
        의존:
            THREE.Box3 — 객체 경계; 생성자: {new THREE.Box3()}; 함수: {setFromObject()}
            defined — nullish 판정; 함수: {defined()}
        동작:
            _bbox가 정의되지 않은 경우에만 _object에서 Box3를 계산해 보관하고 같은 상자 참조를 반환한다.

    U3dModelBIMObjLayer.getFileNames() -> Array<string>
        동작:
            _files의 현재 키 배열을 반환한다.

    U3dModelBIMObjLayer.getControlCases() -> Record<string, ControlCase>
        동작:
            _controlCases 원본 객체를 반환한다.

    U3dModelBIMObjLayer.setAutoHeight(autoHeight: boolean) -> void
        의존:
            U3dApp(_app) — 지형 높이; 함수: {getHeightAtGeographicPoint()}
            U3dLayer — 앱 연결; 속성 읽기: {_app}
        동작:
            _autoHeight를 저장하고 각 파일의 현재 지리 위치를 조회한다.
            autoHeight가 참이면 앱의 지형 고도에서 파일 boundingBox.minz를 빼고, 거짓이면 파일 원본 location.z로 되돌린다.
            계산한 위치를 파일별로 적용한다. 위치 조회 실패는 별도로 방어하지 않는다.

    U3dModelBIMObjLayer.getPosition(fileName?: string) -> GeoPositionVector3 | undefined
        의존:
            UGroup(_object) — 직계 자식; 함수: {getChildren()}
            U3dApp(_app) — 좌표 변환; 함수: {vector3ToGeoGraphic()}
            U3dLayer — 앱 연결; 속성 읽기: {_app}
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName이 정의되지 않으면 undefined를 반환한다. _object의 직계 자식 중 이름이 일치하는 첫 객체의 위치를 앱으로 지리 좌표 변환하여 반환하며 없으면 undefined를 반환한다.

    U3dModelBIMObjLayer.setPosition(fileName?: string, location: U3dBIMLocation) -> void
        의존:
            UGroup(_object) — 직계 자식; 함수: {getChildren()}
            U3dApp(_app) — 좌표 변환; 함수: {geographicToVector3()}
            THREE.Object3D — 위치 반영; 함수: {updateMatrix()}
            THREE.Box3 — 경계 갱신; 생성자: {new THREE.Box3()}; 함수: {setFromObject()}
            U3dLayer — 앱 연결; 속성 읽기: {_app}
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName 또는 location이 정의되지 않으면 종료한다.
            전달받은 location 원본의 x·y·z가 문자열이면 각 속성을 Number로 바꾼 뒤 앱의 geographicToVector3로 변환한다.
            이름이 일치하는 직계 자식 모두에 변환 위치를 적용하고 z가 문자열이면 다시 숫자로 바꾼다. 해당 자식의 updateMatrix를 호출한다.
            일치 자식의 유무와 관계없이 _object에서 새 Box3를 계산하여 _bbox를 교체한다.

    U3dModelBIMObjLayer.getPositionControl(controlCaseName: string, fileName?: string) -> U3dBIMLocation | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            _controlCases[controlCaseName] 또는 fileName이 정의되지 않으면 undefined를 반환한다. 그 외에는 해당 ControlCase에 fileName을 전달하여 getPosition 결과를 반환한다.

    U3dModelBIMObjLayer.setPositionControl(controlCaseName: string, fileName?: string, position: U3dBIMLocation) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스·fileName·position 또는 position의 x·y·z 중 정의되지 않은 값이 있으면 false를 반환한다. 그 외에는 _controlCases[controlCaseName]의 setPosition에 fileName과 position을 전달하여 설정 결과를 반환한다.

    U3dModelBIMObjLayer.isExclusionControl(controlCaseName: string, fileName?: string, objectName: string) -> boolean | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스가 정의되지 않으면 undefined를 반환하고, 그 외에는 _controlCases[controlCaseName]의 isExclusion에 fileName·objectName을 전달하여 제외 여부를 반환한다.

    U3dModelBIMObjLayer.getExclusionControlList(controlCaseName: string, fileName?: string) -> Array<string> | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스가 정의되지 않으면 undefined를 반환하고, 그 외에는 _controlCases[controlCaseName]의 getExclusionList에 fileName을 전달하여 제외 목록 원본을 반환한다.

    U3dModelBIMObjLayer.getLevelControl(controlCaseName: string, fileName?: string, objectName: string) -> number | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스가 정의되지 않으면 undefined를 반환하고, 그 외에는 _controlCases[controlCaseName]의 getChangeLevel에 fileName·objectName을 전달하여 레벨 조회 결과를 반환한다.

    U3dModelBIMObjLayer.getLevelControlList(controlCaseName: string, fileName?: string) -> Array<U3dBIMLevelEntry> | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스가 정의되지 않으면 undefined를 반환하고, 그 외에는 _controlCases[controlCaseName]의 getChangeLevelList에 fileName을 전달하여 새 레벨 목록을 반환한다.

    U3dModelBIMObjLayer.getPropertiesControl(controlCaseName: string, fileName?: string, objectName: string) -> unknown
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스가 정의되지 않으면 undefined를 반환한다. fileName·objectName으로 대상 메타데이터 meta를 조회한다.
            _controlCases[controlCaseName]의 getChangeProperties에 같은 fileName·objectName을 전달하여 저장 자료 exportMeta를 얻는다.
            exportMeta가 정의되면 exportMeta[meta.propertiesKey]를 반환하고 아니면 undefined를 반환한다. meta가 없더라도 앞의 조회는 실행하며 exportMeta가 정의된 경우의 meta.propertiesKey 접근을 방어하지 않는다.

    U3dModelBIMObjLayer.getPropertiesControlList(controlCaseName: string, fileName?: string) -> Array<U3dBIMPropertiesEntry> | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스가 정의되지 않으면 undefined를 반환한다. _controlCases[controlCaseName]의 getChangePropertiesList에 fileName을 전달하여 새 목록 list를 받는다.
            list의 각 항목 node에 대해 fileName·node.id로 meta를 조회하고 node.properties를 기존 node.properties[meta.propertiesKey]로 교체한다. 같은 list를 반환하며 목록·메타데이터·저장 속성의 존재를 추가 검사하지 않는다. 케이스 원본의 바깥 저장 항목은 교체하지 않는다.

    U3dModelBIMObjLayer.setExclusionControl(controlCaseName: string, fileName?: string, objectName: string, value?: boolean, isSetChild?: boolean) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스·fileName·objectName·value가 정의되지 않으면 false를 반환하고 메타데이터가 없어도 false를 반환한다.
            isSetChild가 참이면 자신을 포함한 하위 트리를 선행 순회한다.
                순회 callback에서 child의 ID를 얻는다.
                얻은 ID와 fileName·value를 _controlCases[controlCaseName]의 setExclusion에 전달한다.
                개별 설정 반환값과 무관하게 true를 반환한다.
            isSetChild가 거짓이면 조회한 meta의 ID를 얻는다.
                그 ID와 fileName·value로 같은 케이스의 setExclusion을 실행하여 반환값을 그대로 반환한다.

    U3dModelBIMObjLayer.setLevelControl(controlCaseName: string, fileName?: string, objectName: string, value?: number | string | null, isSetChild?: boolean) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스·fileName·objectName 또는 조회 메타데이터가 정의되지 않으면 false를 반환한다.
            value가 정의되면 Number로 변환하고 NaN 또는 유한하지 않은 값이면 false를 반환한다. null과 undefined는 삭제 의미로 그대로 전달한다.
            isSetChild가 참이면 자신을 포함한 하위 트리를 선행 순회한다.
                callback에서 child의 ID를 얻는다.
                얻은 ID와 fileName·변환한 value를 _controlCases[controlCaseName]의 setChangeLevel에 전달한다. 개별 반환값과 무관하게 순회 뒤 true를 반환한다.
            isSetChild가 거짓이면 조회한 meta의 ID를 얻는다.
                그 ID와 fileName·변환한 value로 같은 케이스의 setChangeLevel을 실행하여 설정 결과를 반환한다.

    U3dModelBIMObjLayer.setPropertiesControl(controlCaseName: string, fileName?: string, objectName: string, value?: unknown) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            케이스·fileName·objectName 또는 메타데이터가 없으면 false를 반환한다.
            변환 전 value가 정의된 문자열일 때만 문자열 분기로 진입한다. 빈 문자열이면 undefined로 바꾼다.
            비어 있지 않은 문자열이면 먼저 JSON.parse로 해석하고, 이어 meta.export로 받은 새 객체의 meta.propertiesKey 속성에 해석 결과를 넣어 value를 그 객체로 교체한다. 이 과정의 예외는 false로 반환한다. 문자열 'null'도 propertiesKey 값이 null인 export 객체가 되며 삭제 분기로 다시 판정하지 않는다.
            비문자열 입력은 그대로 유지한다. meta.getId로 저장 대상 ID를 얻는다.
            _controlCases[controlCaseName]의 setChangeProperties에 fileName·해당 ID·최종 value를 전달하여 결과를 반환한다. 실제 null·undefined와 빈 문자열 입력은 삭제로, 'null' 문자열은 export 객체 저장으로 이어진다.

    U3dModelBIMObjLayer.createControlCase(caseName?: string) -> ControlCase | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
            Web API(console) — 진단 기록; 함수: {error()}
        동작:
            caseName이 정의되지 않으면 undefined를 반환하고 같은 이름이 이미 있으면 오류 로그 후 undefined를 반환한다.
            현재 날짜를 패딩 없는 '년-월-일 시:분:초'로 만들고 모든 파일에 빈 변경 속성·레벨·위치 객체와 제외 배열을 만든다.
            flag가 'add'인 ControlCase를 생성하여 이름별 사전과 URL 목록에 등록하고 객체를 반환한다.

    U3dModelBIMObjLayer.exportControlCase(caseName?: string, useProxy?: boolean) -> Promise<void>
        의존:
            defined — nullish 판정; 함수: {defined()}
            deferred — 완료 제어; 함수: {deferred()}
            Web API — 비동기 JSON 요청; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send()}; 콜백: {onreadystatechange}; 속성 읽기: {status, readyState, responseText}
        동작:
            deferred를 만들고 caseName이 없거나 이름으로 조회한 케이스가 없으면 문자열 이유로 거부하여 반환한다.
            조회한 controlCase의 export 결과를 params로 두고 flag·lastModifyTime과 JSON으로 묶어 POST한다. _useproxy 또는 useProxy가 정확히 true이면 프록시를 붙이며 _serverUrl에 이미 붙은 프록시는 제거하지 않는다.
            readystatechange에서 status가 200이 아니면 readyState와 무관하게 즉시 거부한다. 200이고 readyState가 4이면 controlCase의 flag를 'update'로 바꾼다. [확인 Q-003]
            같은 완료 callback에서 controlCase.getUrl로 재조회할 URL을 얻는다.
            얻은 URL과 새 controlList를 loadControlTask에 전달하고 결과를 기다린다.
            성공하면 채워진 controlList를 setControlCase에 전달하여 사전에 반영하고 외부 deferred를 완료한다. setControlCase 반환 deferred는 기다리지 않는다. 재조회 실패는 전달하고 요청 설정·send 중 동기 예외는 고정 문자열로 거부한다.

    U3dModelBIMObjLayer.getControlCaseByName(name: string) -> ControlCase | undefined
        동작:
            _controlCases[name]을 그대로 반환한다.

    U3dModelBIMObjLayer.getMateDataTree(fileNme?: string) -> MetaDataTree | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileNme이 정의되지 않았거나 해당 파일의 _objectMetaTree가 정의되지 않으면 undefined를 반환한다. 파일 자체가 없는 경우의 속성 접근은 방어하지 않으며 트리가 있으면 원본을 반환한다. [확인 Q-004]

    U3dModelBIMObjLayer.getObjectById(fileName?: string, id?: string) -> U3dBIMMesh | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName 또는 id가 정의되지 않으면 undefined를 반환한다. 파일과 _objectMap이 정의된 경우 해당 ID 객체를 반환하고 그 외에는 undefined를 반환한다.

    U3dModelBIMObjLayer.getMetaById(fileName?: string, id?: string) -> MetaData | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName 또는 id가 정의되지 않으면 undefined를 반환한다. 파일과 _objectMetaTree가 있으면 그 트리의 getMap 결과에서 id 항목을 반환하고 그 외에는 undefined를 반환한다.

    override U3dModelBIMObjLayer.setOpacity(opacity: number, fileName?: string) -> void
        의존:
            UGroup(_object) — 대상 탐색; 함수: {getChildren()}
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName이 지정되면 이름이 일치하는 첫 직계 자식을 대상으로 하고, 찾지 못하거나 이름이 없으면 전체 _object를 대상으로 한다.
    override U3dModelBIMObjLayer.resetOpacity(fileName?: string) -> void
        의존:
            UGroup(_object) — 대상 탐색; 함수: {getChildren()}
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName이 지정되면 일치하는 첫 직계 자식을 대상으로 하고 없으면 전체 _object를 대상으로 한다.
    U3dModelBIMObjLayer.resetPosition(fileName?: string) -> void
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            유효한 fileName이 지정되면 그 파일만 배열에 담고, 아니면 _files 전체를 사용한다.
            Object.keys로 얻은 각 키와 복사한 파일 원본 location을 setPosition에 전달한다. 단일 파일 배열의 키는 파일명이 아니라 '0'이다. [확인 Q-005]

    U3dModelBIMObjLayer.showObject(fileName?: string, id?: string, visible?: boolean) -> void
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName 또는 id가 정의되지 않으면 종료한다. visible이 정의되지 않았으면 false로 삼고 조회한 객체가 있을 때 visible의 참·거짓에 따라 객체.visible을 true 또는 false로 설정한다.

    U3dModelBIMObjLayer.select(fileName?: string, id?: string, color?: ColorRepresentation, opacity?: number) -> void
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName 또는 id가 없으면 종료하고 해당 메타데이터가 없으면 종료한다.
            color가 정의되지 않았으면 빨강(0xff0000)을 사용한다. opacity 인수의 정의 여부와 무관하게 선택 opacity는 1이다. [확인 Q-006]
            자신과 하위 메타데이터를 선행 순회한다.
                callback에서 현재 meta의 ID를 얻는다.
                fileName과 해당 ID로 객체를 조회한다.
    U3dModelBIMObjLayer.clear() -> void
        의존:
            UGroup(_object) — 메시 순회; 함수: {traverse()}
            THREE.Mesh — 메시 판별; 상수: {THREE.Mesh}
        동작:
            전체 _object를 순회하여 재질이 있는 Mesh만 처리한다.
            복원이 반환된 뒤 같은 Mesh의 visible을 true로 바꾼다. Mesh가 아니거나 material이 falsy인 객체는 변경하지 않는다.

    U3dModelBIMObjLayer.load() -> Promise<void>
        의존:
            defined — nullish 판정; 함수: {defined()}
            deferred — 완료 제어; 함수: {deferred()}
            전역 진단 — 진행·오류 기록; 함수: {__GInfo__()}
        동작:
            deferred를 만들고 _files의 값 배열을 얻는다.
            파일이 하나 이상이면 시작 로그를 남기고 네이티브 Promise 연결로 loadTask를 파일 순서대로 실행한다. 모두 끝나면 인수 없이 완료하고 연결이 거부되면 같은 이유로 거부한다.
            파일이 없으면 deferred를 종결하지 않은 채 반환한다. 동기 예외는 로그 후 e.message로 거부한다. [확인 Q-008]

    U3dModelBIMObjLayer.makeMetaTree(rootName: string, metaList: Array<U3dBIMMetaRecord>) -> MetaDataTree | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            metaList 또는 rootName이 정의되지 않으면 undefined를 반환한다.
            빈 MetaDataTree인 tree를 만든다.
            입력 순서대로 각 원본 항목의 rootName을 덮어쓰고 그 항목으로 MetaData인 meta를 생성한다.
            생성한 meta를 tree.add에 전달한다. 모든 입력 처리 후 tree를 반환한다.

ControlCase 클래스 정의
    url: string
    flag: string
    name: string
    description: string
    files: Record<string, U3dBIMControlFile>
    lastModifyTime: string

    ControlCase.constructor(opt: Partial<U3dBIMControlResponse> = {})
        의존:
            defined — nullish 판정; 함수: {defined()}
            defaultValue — nullish 기본값; 함수: {defaultValue()}
            Web API(console) — 진단 기록; 함수: {error()}
        동작:
            json, time, url 순서로 정의 여부를 검사하여 첫 누락이면 오류 로그 후 부분 초기화 상태로 종료한다. 정상 입력이면 url, flag(기본 'update'), json의 name·description·files 원본 참조와 time을 저장한다.

    ControlCase.export() -> U3dBIMControlData
        동작:
            name·description·files를 가진 새 객체를 반환한다. files는 원본 참조다.

    ControlCase.setName(name: string) -> void
        동작:
            name에 입력 name 값을 저장한다.

    ControlCase.getName() -> string | undefined
        동작:
            name 값을 그대로 반환한다.

    ControlCase.getUrl() -> string | undefined
        동작:
            url 값을 그대로 반환한다.

    ControlCase.setUrl(url: string) -> void
        동작:
            url에 입력 url 값을 저장한다.

    ControlCase.setFlag(flag: string) -> void
        동작:
            flag에 입력 flag 값을 저장한다.

    ControlCase.getFlag() -> string | undefined
        동작:
            flag 값을 그대로 반환한다.

    ControlCase.setDescription(description: string) -> void
        동작:
            description에 입력 description 값을 저장한다.

    ControlCase.getDescription() -> string | undefined
        동작:
            description 값을 그대로 반환한다.

    ControlCase.getPosition(fileName?: string) -> U3dBIMLocation | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName이나 파일이 없으면 undefined를 반환한다. change_position과 longitude·latitude·transHeight가 모두 정의된 경우 각각 x·y·z인 새 객체를 반환하고 아니면 undefined를 반환한다.

    ControlCase.setPosition(fileName?: string, position: U3dBIMLocation) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName, position.x·y·z 또는 파일이 정의되지 않으면 false를 반환한다. change_position이 없으면 생성하고 longitude·latitude·transHeight에 입력 성분을 그대로 저장한 뒤 true를 반환한다. position 자체의 누락은 방어하지 않는다.

    ControlCase.getExclusionList(fileName?: string) -> Array<string> | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            fileName이나 파일이 정의되지 않으면 undefined를 반환하고 그 외에는 exclusion_globalids 원본 배열을 반환한다.

    ControlCase.isExclusion(fileName?: string, objectName: string) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            제외 목록이 없거나 길이가 0이면 false를 반환한다. 항목 중 objectName과 엄격히 같은 값이 있으면 true, 없으면 false를 반환한다.

    ControlCase.setExclusion(fileName?: string, objectName: string, value?: boolean) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            파일의 현재 제외 목록을 조회한다.
            제외 목록·objectName·value 중 정의되지 않은 값이 있으면 false를 반환한다.
            value가 truthy이면 이미 있는 값은 그대로 두고 아니면 추가한다. falsy이면 앞에서 뒤로 순회하면서 일치 항목을 splice하되 인덱스를 되돌리지 않는다. 처리 후 true를 반환한다.

    ControlCase.setChangeLevel(fileName?: string, objectName: string, value?: number | string | null) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            파일이나 objectName이 정의되지 않으면 false를 반환한다.
            value가 정의되면 Number로 변환하고 NaN이 아니며 유한할 때만 change_level[objectName]에 start_level을 저장한다. 유효하지 않은 숫자는 변경 없이 true를 반환한다. nullish value이면 해당 키를 삭제한 뒤 true를 반환한다.

    ControlCase.getChangeLevel(fileName?: string, ObjectName: string) -> number | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            파일이 정의되지 않아도 종료하지 않고 change_level에 접근한다. change_level과 해당 ObjectName 항목이 정의되면 start_level을 반환하고 그 외에는 undefined를 반환한다. [확인 Q-010]

    ControlCase.getChangeLevelList(fileName?: string) -> Array<U3dBIMLevelEntry> | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            파일이 없으면 undefined를 반환한다. change_level의 키 순서대로 id·level 객체를 새 배열에 담아 반환한다. change_level 자체의 누락은 방어하지 않는다.

    ControlCase.setChangeProperties(fileName?: string, objectName: string, value?: unknown) -> boolean
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            파일이나 objectName이 정의되지 않으면 false를 반환한다. 변환 전 입력 value가 null 또는 undefined일 때만 change_attributes[objectName]을 삭제한다.
            변환 전 value가 정의되어 있으면 저장 분기로 진입한다. 문자열이면 JSON.parse로 해석하고 실패 시 false를 반환하며, 성공한 해석 결과 또는 원래 비문자열 값을 change_attributes[objectName]에 저장한다.
            해석 후 정의 여부를 다시 판정하지 않으므로 문자열 'null'은 null을 저장하고 키를 유지한다. 실제 null 입력은 키를 삭제한다. 저장·삭제 후 true를 반환한다.

    ControlCase.getChangeProperties(fileName?: string, ObjectName: string) -> unknown
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            파일이 없으면 undefined를 반환하고 아니면 change_attributes[ObjectName]의 원본 값을 반환한다.

    ControlCase.getChangePropertiesList(fileName?: string) -> Array<U3dBIMPropertiesEntry> | undefined
        의존:
            defined — nullish 판정; 함수: {defined()}
        동작:
            파일이 없으면 undefined를 반환한다. change_attributes의 키 순서로 id·properties 객체를 새 배열에 담아 반환하며 각 properties는 원본 참조다.

MetaData 클래스 정의
    metaIdKey: string
    metaParentKey: string
    metaNameKey: string
    fileNameKey: string
    rootNameKey: string
    objectTypeKey: string
    typeKey: string
    tagKey: string
    propertiesKey: string
    id: unknown
    name: unknown
    parentId: unknown
    fileName: unknown
    rootName: unknown
    objectType: unknown
    type: unknown
    tag: unknown
    properties: unknown
    text: unknown
    children: Array<MetaData>

    MetaData.constructor(opt: U3dBIMMetaRecord = {})
        의존:
            defined — nullish 판정; 함수: {defined()}
            defaultValue — nullish 기본값; 함수: {defaultValue()}
        동작:
            키 이름은 metaIdKey='GlobalId', metaParentKey='Parent_GlobalId', metaNameKey='Name', fileNameKey='FileName', objectTypeKey='ObjectType', typeKey='Type', tagKey='Tag', propertiesKey='Properties'로 기본 설정한다.
            rootNameKey는 opt.rootNameKey가 아니라 opt.fileNameKey를 사용하며 그 값이 nullish이면 'rootName'이다. [확인 Q-011]
            각 키가 가리키는 원본 속성을 id·name·parentId·fileName·rootName·objectType·type·tag·properties에 저장하고 children을 빈 배열로 만든다.
            name이 정의되고 빈 문자열이 아니면 text에 name을 저장하며 아니면 'unnamed'를 저장한다.

    MetaData.export() -> U3dBIMMetaRecord
        동작:
            현재 키 이름으로 id·name·parentId·fileName·objectType·type·tag·properties를 담은 새 객체를 반환한다. rootName과 children은 포함하지 않고 properties는 같은 참조다.

    MetaData.getId() -> unknown
        동작:
            id의 현재 값을 그대로 반환한다.

    MetaData.getName() -> unknown
        동작:
            name의 현재 값을 그대로 반환한다.

    MetaData.getFileName() -> unknown
        동작:
            fileName의 현재 값을 그대로 반환한다.

    MetaData.getRootName() -> unknown
        동작:
            rootName의 현재 값을 그대로 반환한다.

    MetaData.getProperties() -> unknown
        동작:
            properties의 현재 값을 그대로 반환한다.

    MetaData.getParentId() -> unknown
        동작:
            parentId의 현재 값을 그대로 반환한다.

    MetaData.getIdKey() -> string
        동작:
            metaIdKey의 현재 값을 그대로 반환한다.

    MetaData.getParentKey() -> string
        동작:
            metaParentKey의 현재 값을 그대로 반환한다.

    MetaData.getChildren() -> Array<MetaData>
        동작:
            children의 현재 값을 그대로 반환한다.

    MetaData.setRootName(rootName: string) -> void
        동작:
            rootName 속성에 입력값을 저장한다.

MetaDataTree 클래스 정의
    tree: Array<MetaData>
    list: Array<MetaData>
    map: Record<string, MetaData>

    MetaDataTree.constructor()
        동작:
            tree·list를 빈 배열로, map을 빈 객체로 생성한다.

    MetaDataTree.getTree() -> Array<MetaData>
        동작:
            tree 원본 배열을 반환한다.

    MetaDataTree.getList() -> Array<MetaData>
        동작:
            list 원본 배열을 반환한다.

    MetaDataTree.getMap() -> Record<string, MetaData>
        동작:
            map 원본 객체를 반환한다.

    MetaDataTree.add(meta: MetaData) -> void
        동작:
    MetaDataTree.traverse(callback: function) -> void
        동작:
            getTree로 현재 루트 배열을 얻는다.
            그 배열의 각 루트와 입력 callback을 모듈 traverse에 전달하여 현재 순서대로 선행 순회한다.

async loadTask(metaData: U3dBIMFile) -> Promise<void>
    의존:
        deferred — 완료 제어; 함수: {deferred()}
    동작:
        아래 호출은 모두 현재 레이어를 receiver로 실행하고 각 단계의 완료를 await한 뒤 다음 단계로 진행한다.
        metaData.modelUrl·materialsFile로 MTL을 읽어 materials를 얻는다.
        같은 modelUrl·mergeFile과 앞서 얻은 materials로 OBJ를 읽어 object를 얻는다.
        metaData와 object를 전달하여 메시 설정·배치를 적용한다.
        metaData.metaFileUrl과 같은 object로 메타 파일을 읽어 json을 얻는다.
        같은 metaData·object와 앞서 얻은 json을 전달하여 메타데이터를 연결한다.
        레이어의 제어 URL 목록을 읽어 controlCaseList를 얻는다.
        그 controlCaseList를 사전에 반영한 뒤 내부 deferred를 완료한다. 어느 단계에서 예외가 나도 'BIM obj load error'로 거부한다. async 반환은 이 deferred를 채택한다.

setControlCase(controlCaseList?: Array<U3dBIMControlResponse>) -> Promise<void>
    의존:
        defined — nullish 판정; 함수: {defined()}
        deferred — 완료 제어; 함수: {deferred()}
        전역 진단 — 진행·오류 기록; 함수: {__GInfo__()}
    동작:
        목록이 없거나 비어 있으면 인수 없이 완료한 deferred를 반환한다.
        시작 로그 후 각 응답의 json·time·url로 ControlCase인 controlCases를 생성한다. 응답의 flag는 전달하지 않는다.
        생성한 controlCases.getName으로 이름을 얻고 정의되지 않았을 때만 unnamed1부터 순차 이름을 정한다. 빈 문자열은 그대로 사용한다.
        controlCases.setName에 정한 이름을 전달한 뒤 _controlCases[이름]에 같은 인스턴스를 덮어쓴다. 기존 사전과 URL 목록은 비우지 않는다.
        완료 로그와 함께 deferred를 완료하고 생성·이름 설정·등록 중 동기 예외는 고정 오류 문자열로 거부한다.

loadControlTask(controlFileUrl: string, resultList: Array<U3dBIMControlResponse>) -> Promise<void>
    의존:
        defined — nullish 판정; 함수: {defined()}
        deferred — 완료 제어; 함수: {deferred()}
        Web API — 비동기 JSON 요청; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send()}; 콜백: {onreadystatechange}; 속성 읽기: {status, readyState, responseText}
        Web API(console) — 진단 기록; 함수: {debug()}
    동작:
        프록시, 이미 프록시를 포함할 수 있는 _serverUrl, 읽기 경로와 controlFileUrl을 결합하여 비동기 GET을 시작한다.
        상태 변경에서 status가 200이 아니면 readyState와 무관하게 로그를 남기고 성공 완료한다. 200이고 readyState가 4이면 JSON을 해석한다. [확인 Q-003]
        params.data가 없으면 로그만 남기고 완료한다. 있으면 그 객체의 url을 입력 URL로 변경해 resultList에 추가하고 완료한다.
        요청 설정·send 중 동기 예외는 고정 문자열로 거부한다. 나중에 실행되는 callback의 JSON 예외는 이 catch가 잡지 않는다.

loadControlCases() -> Promise<Array<U3dBIMControlResponse> | undefined>
    의존:
        defined — nullish 판정; 함수: {defined()}
        deferred — 완료 제어; 함수: {deferred()}
        전역 진단 — 진행·오류 기록; 함수: {__GInfo__()}
    동작:
        _controlFileUrlList가 없거나 비어 있으면 인수 없이 완료한 deferred를 반환한다.
        목록이 있으면 시작 로그 후 각 URL을 순서대로 읽어 결과 배열에 모은다.
        모든 읽기 후 완료 로그와 결과 배열로 완료한다. 연결 거부는 이유를 그대로 전달하고 동기 예외는 고정 문자열로 거부한다.

setMetaDate(metaData: U3dBIMFile, object: Object3D, json: Record<string, U3dBIMMetaRecord>) -> Promise<void>
    의존:
        THREE.Object3D(object) — 메시 순회; 함수: {traverse()}
        THREE.Mesh — 메시 판별; 상수: {THREE.Mesh}
        defined — nullish 판정; 함수: {defined()}
        deferred — 완료 제어; 함수: {deferred()}
        전역 진단 — 진행·오류 기록; 함수: {__GInfo__()}
    동작:
        metaData가 정의되지 않으면 인수 없이 완료한다. json이 정의되지 않으면 입력 오류 문자열로 거부한다.
        Object.values(json)과 metaData.name을 각각 metaList·rootName으로 전달하여 tree를 얻는다.
        얻은 tree.getMap으로 ID 사전 map을 얻고 미연결 자료 nonMatchMeta는 json의 얕은 복사본으로 만든다.
        object를 순회하며 Mesh인 child만 집계한다. map[child.name]인 meta가 정의되면 meta.getId 결과를 child.name과 엄격히 비교한다.
            같으면 child._meta에 meta를 저장하고 호출 시 자신의 _meta를 반환하는 getMeta 메서드를 붙인다. nonMatchMeta에서 child.name 키를 삭제하고 일치 개수를 늘린다.
            meta는 있지만 ID가 다르면 meta.getId와 meta.getIdKey 결과를 포함한 불일치 로그를 남긴다. map에 meta가 없으면 불일치 로그도 남기지 않는다.
        각 Mesh callback에서 집계 수를 늘리고 그 수가 metaData._objectLength와 같아지는 순간에만 _nonMatchMeta와 _objectMetaTree를 저장하고 통계 로그 후 완료한다. Mesh가 0개이거나 집계 수가 예상 수에 한 번도 도달하지 않으면 완료하지 않는다. 예상 수가 실제보다 작아도 중간에 같아지면 완료하며 이후 순회는 계속된다. 동기 예외는 고정 문자열로 거부한다. [확인 Q-009]

loadMetaFile(metaFileUrl?: string, object: Object3D) -> Promise<Record<string, U3dBIMMetaRecord> | undefined>
    의존:
        defined — nullish 판정; 함수: {defined()}
        deferred — 완료 제어; 함수: {deferred()}
        전역 진단 — 진행·오류 기록; 함수: {__GInfo__()}
        Web API — 비동기 JSON 요청; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send()}; 콜백: {onreadystatechange}; 속성 읽기: {status, readyState, responseText}
    동작:
        metaFileUrl이 정의되지 않으면 인수 없이 완료하고 object가 없으면 입력 오류로 거부한다.
        시작 로그 후 비동기 GET을 요청하며 status가 200이 아니면 readyState와 무관하게 거부한다. 200이고 readyState가 4이면 완료 로그 후 JSON을 해석한 결과로 완료한다. [확인 Q-003]
        요청 설정·send 중 동기 예외는 메시지를 붙인 문자열로 거부한다. 비동기 callback의 JSON 예외는 밖으로 전파된다.

setOBJ(metaData: U3dBIMFile, object: Object3D) -> Promise<void>
    의존:
        THREE.Mesh — 메시 판별; 상수: {THREE.Mesh}
        THREE.Object3D(object) — 메시 순회; 함수: {traverse()}
        U3dLayer — 앱·렌더 순서; 속성 읽기: {_app, _renderOrder}
        U3dApp(_app) — 높이·좌표 변환; 함수: {getHeightAtGeographicPoint(), geographicToVector3()}
        UGroup(_object) — 결과 등록; 함수: {add()}
        defined — nullish 판정; 함수: {defined()}
        deferred — 완료 제어; 함수: {deferred()}
        전역 진단 — 진행·오류 기록; 함수: {__GInfo__()}
    동작:
        object, metaData, name, location 또는 boundingBox가 정의되지 않으면 입력 오류로 거부한다.
        object 이름을 지정하고 _objectLength를 0으로 초기화한다.
        Mesh 수를 세고 _objectMap이 없으면 생성하여 이름별 Mesh를 등록한다. 기존 map의 다른 항목은 제거하지 않는다.
        autoHeight가 참이면 지형 고도에서 boundingBox.minz를 빼고 아니면 원본 z를 사용한다. x·y·선택한 z를 앱으로 좌표 변환하여 object 위치에 적용한다.
        레이어 _object에 object를 추가하고 완료 로그 후 deferred를 완료한다. 동기 예외는 고정 오류 문자열로 거부한다.

loadOBJLoader(modelUrl: string, mergeFile: string, materials: MTLLoader.MaterialCreator) -> Promise<Object3D>
    의존:
        UOBJLoader — OBJ 읽기; 생성자: {new UOBJLoader()}; 함수: {setMaterials(), setPath(), load()}; 콜백: {성공, 진행, 오류}
        defined — nullish 판정; 함수: {defined()}
        deferred — 완료 제어; 함수: {deferred()}
        전역 진단 — 진행·오류 기록; 함수: {__GInfo__()}
    동작:
        deferred와 UOBJLoader를 먼저 만든다. materials, modelUrl, mergeFile 중 정의되지 않은 값이 있으면 입력 오류로 거부한다.
        재질·기준 경로를 설정하고 '/' + mergeFile을 로드한다. 시작·성공 로그를 남기고 성공 객체로 완료하며 오류 callback은 고정 문자열로 거부한다. 진행 callback은 아무 처리도 하지 않는다.

loadMTLLoader(modelUrl: string, materialsFile: string) -> Promise<MTLLoader.MaterialCreator>
    의존:
        UMTLLoader — MTL 읽기; 생성자: {new UMTLLoader()}; 함수: {setPath(), setCrossOrigin(), load()}; 콜백: {성공, 진행, 오류}
        MaterialCreator — 재질 준비; 함수: {preload()}
        defined — nullish 판정; 함수: {defined()}
        deferred — 완료 제어; 함수: {deferred()}
        전역 진단 — 진행·오류 기록; 함수: {__GInfo__()}
    동작:
        deferred와 UMTLLoader를 먼저 만든다. modelUrl 또는 materialsFile이 정의되지 않으면 입력 오류로 거부한다.
        기준 경로와 crossOrigin 'anonymous'를 설정하고 '/' + materialsFile을 로드한다. 성공 callback에서 materials.preload 후 완료 로그를 남기고 재질로 완료한다. 오류 callback은 고정 문자열로 거부하고 진행 callback은 무동작이다.

traverse(meta: MetaData, callback: function) -> void
    의존:
        defined — nullish 판정; 함수: {defined()}
    동작:
        meta가 정의되지 않으면 종료한다. callback이 truthy이면 현재 meta를 먼저 전달한다.
        callback 이후 meta.getChildren으로 현재 자식 배열을 조회한다.
        그 배열이 정의되고 길이가 0보다 크면 각 자식과 같은 callback으로 이 모듈 함수를 재귀 호출한다. callback이 자식 배열을 바꾸면 그 변경을 따라가며 순환은 검사하지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
정의 여부는 defined를 통해 null과 undefined만 누락으로 판정하며 빈 문자열·0·false는 별도로 명시된 분기에서만 구분한다.
공개 상태와 원본 참조를 반환하는 조회는 읽기 전용이 아니다. 케이스 files·제외 배열, 메타데이터 properties·children, 트리 tree·list·map을 공유한 결과의 변경은 원본에 반영된다. 새로 만든 위치 객체·키 배열·목록 항목의 바깥 구조는 공유하지 않으며 각 메서드의 반환 규칙을 따른다.
자체 deferred는 네이티브 Promise와 다르며 공개 완료 API의 계약은 then 또는 await로 관찰한다. 빈 파일 목록과 Mesh 집계 수가 예상 수에 도달하지 않는 미종결 경로는 각 심벌에 별도로 명세한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
