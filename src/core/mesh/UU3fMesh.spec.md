# UU3fMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

U3F 데이터에서 복원한 건물 메시의 텍스처 해상도 변경, 병합 메시 분리와 분리 자원의 정리를 제공한다.

### 1.2 책임 범위

현재 메시와 같은 분리 그룹의 재질·텍스처 참조를 관리한다. 파일 다운로드 정책, 타일 표시 판단과 편집 이벤트 생성은 모델 레이어가 담당한다.

### 1.3 주요 동작 방식

UModelMesh를 상속하고 버전·텍스처 주소·병합 상태를 보관한다. 텍스처는 비동기로 교체하고, 분리 요청은 버전에 맞는 파서와 레이어가 연결한 생성 callback으로 처리한다.

### 1.4 주요 사용처와 연계 대상

U3dModelU3FLayer가 메시를 만들고 텍스처 변경을 요청한다. U3dModelLayer가 분리·편집·복원을 연결하며 U3FParser가 버전별 정점 분리 함수를 제공한다.

## 3. 정규 자연어 수도코드

```spec
UU3fMesh extends UModelMesh 클래스 정의
    의존: UModelMesh — 모델 수명·geometry·material과 레이어 조회의 기반; 상속: {UModelMesh}

    _classtype: string = 'UU3fMesh'
    _utype: number = UDEF.UMESH_TYPE._building
        의존: UDEF — 건물 메시 분류; 상수: {UMESH_TYPE._building}
    _uUrl: string | undefined
    _uImageUrls: Array<string> = []
    _curImagelevel: number = -1
    _changingTexture: boolean = false
    _isMerged: boolean = false
    _majorversion, _minorversion: number | undefined
    createModelMesh: function | undefined
        레이어가 연결하는 분리 결과의 메시 생성 callback. 초기값은 undefined이며 mergedMeshDivision이 정의 여부를 조건으로 생성 호출을 제어한다.
    castShadow: boolean = false
    receiveShadow: boolean = false
    material: ModelMaterial | Array<ModelMaterial> | undefined
        부모가 준비한 재질이며 해제 시 undefined가 될 수 있다.

    constructor(geometry: ModelBufferGeometry = new UBufferGeometry(), material: Material | Array<Material> | undefined, opt: object)
        의존:
            UModelMesh — 형상·재질 초기화; 생성자: {super()}; 속성 쓰기: {userData.useShadow}
            UBufferGeometry — 기본 형상; 생성자: {new UBufferGeometry()}
            UDEF — 건물 메시 분류; 상수: {UMESH_TYPE._building}
        동작:
            기반 메시를 생성하고 클래스·메시 종류와 텍스처 주소·상태를 초기화한다.
            opt에서 U3F 주·부 버전을 보관하고 createModelMesh를 undefined로 둔다.
            그림자 수신·투영을 false로 두고 userData.useShadow를 [true, true, 0]으로 기록한다.

    onAfterRender() -> void
        의존: UDEF.resourceManager — 렌더 후 자원 등록; 함수: {addObjectResource()}
        동작: 주 버전이 2이고 부 버전이 3일 때만 현재 메시를 관리값 125로 자원 관리자에 등록한다.

    override dispose() -> void
        의존: UModelMesh — 기반 메시 수명과 자원 해제; 함수: {super.dispose()}; 속성 읽기: {_disposed, _opt}
        동작:
            이미 해제되었으면 종료한다.
            _opt가 있으면 빌린 texture 참조만 undefined로 하고, 이미지 목록·이미지 레벨·로딩 상태·생성 callback을 undefined로 만든다.
            기반 dispose를 호출하여 실제 메시 수명과 소유 자원을 정리한다.

    changeTextureImage(level: number, parent?: ModelMesh) -> void
        인터페이스: level은 이미지 주소 목록의 인덱스다. parent가 제공되면 응답 적용 전에 parent.cancel() 결과를 확인한다. 완료 Promise는 반환하지 않는다.
        의존:
            UModelMesh — 모델 수명과 렌더 자원; 속성 읽기: {_disposed, _sleeping, material, id}
            UTextureLoader — 비동기 이미지 로드; 생성자: {new UTextureLoader()}; 함수: {load(), setCancel()}
            UDEF — 텍스처 크기 변경 방지 설정; 함수: {noResizeTexture()}
            ModelMesh(parent) — 부모의 취소 여부와 장면; 함수: {cancel(), _drawArg._scene.getObjectById(), _drawArg._scene.remove()}
            Texture — 새 응답·이전 텍스처 정리; 함수: {texture.dispose(), material._oriMap.dispose(), material.map.dispose(), material._oriMap.close(), material.map.close()}
            defined — 값의 존재 판정; 함수: {defined()}
        동작:
            해제·휴면·로딩 중·현재와 같은 level·재질 부재이면 종료한다. level이 0 미만 또는 이미지 목록 범위 밖이어도 종료한다.
            _changingTexture를 true로 한 뒤 해당 URL의 이미지를 요청한다.
            성공 응답에서 이미 해제·휴면 상태이면 로딩 상태를 풀고 새 texture를 해제한다. material 존재 여부는 이 조기 종료 조건에 포함되지 않는다.
            parent가 정의되어 있으면 다음 취소 여부를 확인한다.
                parent.cancel()이 true이면 현재 id의 장면 객체가 있을 때 장면에서 제거하고, 새 texture와 메시를 해제한 뒤 종료한다.
            재질이 있으면 새 texture와 현재 객체의 _wrapping 값을 크기 변경 방지 설정에 전달한다. 이 단위는 _wrapping을 초기화하지 않는다. _oriMap이 있으면 이전 값을 해제하고 새 texture로 교체한다. 기존 map이 있으면 해제한다. 병합 메시이면 이때 해제한 이전 텍스처의 close도 호출한다.
            material이 있는 분기에서만 material.map에 새 texture를 연결하고 needsUpdate를 켠 뒤 현재 level을 기록하고 로딩 상태를 푼다. 응답 시 material이 없어졌으면 새 texture 정리와 로딩 상태 갱신 없이 끝난다. [확인 Q-002]
            오류·중단 callback에서는 로딩 상태를 풀고 로그를 남긴다. parent.cancel()이 true이면 로더에도 취소를 요청한다.

    changeSharedTextureImage(level: number, sharedMeshList?: Array<ModelMesh>) -> void
        인터페이스: level은 이미지 주소 목록의 인덱스다. sharedMeshList는 같은 텍스처를 사용하는 형제 메시 목록이다. 완료 Promise는 반환하지 않는다.
        의존:
            UModelMesh — 모델 수명과 부모·재질; 속성 읽기: {_disposed, _sleeping, parent, material}
            UTextureLoader — 비동기 이미지 로드; 생성자: {new UTextureLoader()}; 함수: {load(), setCancel()}
            UDEF — 텍스처 크기 변경 방지 설정; 함수: {noResizeTexture()}
            Texture — 사용하지 않는 응답과 이전 텍스처 정리; 함수: {dispose(), close()}
            ModelMesh — 형제 수명·재질·원본 참조와 부모 취소 판정; 속성 읽기: {_disposed, _sleeping, material, _opt.texture}; 함수: {parent.cancel()}
            defined — 값의 존재 판정; 함수: {defined()}
        동작:
            자기 부모를 보관한다. 해제·휴면·로딩 중·현재와 같은 level·재질 부재 또는 level 범위 밖이면 종료한다.
            로딩 상태를 true로 하고 이미지를 요청한다. 성공 때 해제·휴면 상태이면 상태를 풀고 새 texture를 해제한다. 재질 부재만으로 이 조기 종료 경로에 들어가지는 않는다.
            새 texture와 초기화하지 않은 현재 _wrapping 값을 크기 변경 방지 설정에 전달하고 이전 텍스처를 Set에 모은다. 단일 재질이면 _oriMap·map을 교체한다. 배열 재질이면 barrierMaterial을 제외한 각 재질을 같은 texture로 교체한다.
            단일 재질이 있거나 배열 재질이면 현재 level을 기록하고 로딩 상태를 푼다. 배열은 비었거나 전부 barrierMaterial이어도 순회 뒤 이 상태 갱신을 수행한다. 자기와 형제 중 새 texture를 연결할 재질이 없을 때 응답 texture를 별도로 해제하지는 않는다. [확인 Q-001]
            sharedMeshList가 있고 길이가 0보다 크면 형제를 순회하되 자신·해제·휴면 메시를 제외한다.
                child._isMerged가 falsy이면 배열 재질은 각 원소를, 단일 재질은 그 재질을 갱신한 뒤 해당 형제의 level을 기록한다.
            자신과 형제 중 아직 해제되지 않은 메시의 map·_oriMap·_opt.texture를 사용 중인 참조로 모은다. 휴면 형제도 이 참조 수집에는 포함한다.
            이전 텍스처 중 사용 중인 참조에 없는 것만 한 번 해제하고 자신이 병합 메시이면 close도 호출한다.
            오류·중단 때는 상태를 풀고 로그를 남긴다. 보관한 부모의 cancel()이 true이면 로더에 취소를 요청한다.

    isMerged() -> boolean
        동작: 현재 _isMerged 값을 반환한다.

    mergedMeshDivision(removedList?: Array<string>) -> USharedMesh | undefined
        인터페이스: removedList는 생성에서 제외할 분리 ID 목록이다. 결과는 생성 callback이 반환한 분리 메시 루트이며 분리 불가이면 undefined이다.
        의존:
            UModelMesh — 복원 옵션·형상·타일; 속성 읽기: {_opt, geometry, _tile}
            U3FParser — 버전별 정점 분리 함수 선택; 정적 함수: {getSpliter()}
            defined — 옵션·결과·callback 존재 판정; 함수: {defined()}
        동작:
            _opt·meshinfo가 없거나 meshinfo가 비면 종료한다. vertexSplit이 없으면 주·부 버전이 모두 truthy일 때 버전별 함수를 조회하며 없으면 종료한다.
            vertexSplit에 _opt·meshinfo와 position·uv·normal 배열을 전달하고 이후 _opt.vertexSplit을 undefined로 만든다.
            분리 결과가 있으면 원본 meshinfo를 id별로 찾아 각 결과의 composedPuid·rootPuid를 복원하고 modelurl에 현재 _uUrl을 기록한다. oid로 구성 관계를 다시 추정하지 않는다.
            createModelMesh가 정의되어 있으면 removedList에 결과의 id 또는 composedPuid가 포함된 항목을 제외한다. 남은 항목이 없으면 생성 callback 없이 종료한다.
            남은 결과·원본 texture·타일·타일 draw argument·tileInfo를 createModelMesh에 전달한다. 호출 수신자는 현재 메시지만 레이어는 bound callback을 연결한다. 반환값이 정의되어 있으면 그대로 반환한다.

    removeDivisionMeshes(app: U3dApp, removeList: Array<string>, mergedMeshId: string) -> boolean
        인터페이스: app은 레이어 조회에 사용한다. removeList에는 같은 병합 원본의 분리 ID를 추가하므로 입력 배열도 변경된다. 실제 그룹 정리를 수행하면 true이다.
        의존:
            UModelMesh — 레이어 이름 조회; 함수: {getLayerName()}
            U3dApp — 소유 레이어 조회; 함수: {getLayerByName()}
            U3dModelLayer — 원본·편집·삭제 기록; 함수: {getModelById(), getEditedEventById(), deleteRemovedUidList()}; 속성 읽기·쓰기: {editedEvent, editedList}; 속성 읽기: {_sharedMaterial}
            Object3D — 분리 그룹 순회·부모 제거; 함수: {traverse(), removeFromParent()}
            UDEF — 각 객체의 수명 종료; 함수: {disposeObject3D()}
            BufferGeometry·Material·Texture — 그룹 소유 자원의 해제; 함수: {dispose()}
            defined — 앱·레이어·편집 모드 존재 판정; 함수: {defined()}
        동작:
            app 또는 해당 레이어가 없으면 false를 반환한다. 원본 병합 메시를 조회하고 편집 이벤트를 순회한다.
            split 참조가 정의되어 있고 mergedMeshId와 엄격히 같으면 이벤트 id를 removeList에 추가한다. 식별값의 대소문자나 타입을 변환하지 않는다.
            목록이 비었거나, 목록 중 편집 이벤트가 없거나 mode가 정의된 항목이 하나라도 있으면 false를 반환한다.
            중복 ID를 한 번씩 처리한다. editedList에 있는 항목만 목록에서 제거하고 대상 메시를 모은다. 부모가 합성 모델이면 그 부모를 모은다. 이벤트 기록을 먼저 삭제하고 삭제 ID 등록도 제거한다.
            원본의 geometry·material·map·_oriMap, 레이어 공유 재질과 분리 그룹의 _opt.texture는 빌린 자원으로 모은다.
            모은 메시의 하위 노드를 순회하여 빌리지 않은 geometry·material·texture를 해제 Set에 모으고 노드의 geometry·material·_opt.texture·_opt.material 연결을 비운다.
            각 최상위 메시의 dispose 경로를 실행하고 부모에서 제거한다. 소유 자원 Set을 한 번씩 해제한 뒤 true를 반환한다.

    #changeTextureDivisionMesh(material: ModelMaterial, texture: Texture, previousTextures: Set<Texture>) -> void
        인터페이스: previousTextures는 교체한 이전 텍스처의 해제 후보를 추가할 공용 집합이다.
        의존:
            ModelMaterial — 교체 대상 재질; 속성 읽기·쓰기: {map, _oriMap}; 속성 읽기: {name, _exceptTexture}
            Texture — 새 map 업로드 예약; 속성 쓰기: {needsUpdate}
            defined — 텍스처와 제외 표시 존재 판정; 함수: {defined()}
        동작:
            이름이 barrierMaterial이면 종료한다.
            material._exceptTexture가 정의되어 있으면 텍스처를 화면에서 제외한다.
                material._oriMap이 없고 material.map이 있으면 material.map을 material._oriMap에 보관한다.
                반대로 material._oriMap이 있고 material.map이 없으면 이전 _oriMap을 previousTextures에 모으고 material._oriMap을 새 texture로 교체한다.
                material.map을 undefined로 하고 종료한다.
            일반 재질은 기존 material.map이 있으면 previousTextures에 모은 뒤 새 texture를 material.map으로 연결하고 map.needsUpdate를 켠다.
```

## 4. 공통 처리 기준과 제약

```spec
휴면 모델은 자원을 보유할 수 있으므로 공유 텍스처 사용 여부를 확인할 때 해제 모델과 구분한다.
분리 메시의 장면 등록·편집 정책과 LOD 대응은 레이어가 담당한다. 이 객체의 createModelMesh는 외부에서 연결한 생성 경로다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
