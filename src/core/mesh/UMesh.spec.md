# UMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

Three.js Mesh에 엔진의 수명 관리, 형상 조회, 표시 설정, 레이어 연결과 식별자 조회를 제공한다.

### 1.2 책임 범위

자기 메시의 경계·재질·그림자와 렌더 직전 callback을 관리한다. 데이터 로딩 및 모델의 병합·분할 정책은 레이어가 담당한다.

### 1.3 주요 동작 방식

Three.js Mesh를 생성하고 U3dObject의 인스턴스 상태를 합성한다. 표시 및 형상 API는 현재 geometry·material을 읽거나 변경하며, 해제 시 먼저 수명을 종료한 뒤 소유 자원을 정리한다.

### 1.4 주요 사용처와 연계 대상

UModelMesh 계열, I3F 모델, 선택기와 분석 기능이 사용한다. 일부 도형은 UMesh 메서드를 합성하여 도형 전용 표시 처리에 연결한다.

## 3. 정규 자연어 수도코드

```spec
UMesh extends THREE.Mesh 클래스 정의
    의존: THREE.Mesh — 기반 메시; 상속: {Mesh}

    puid: string | undefined
        엔진이 자동 해제·재로딩하는 데이터 메시의 영속 식별자. 데이터 사용자(레이어·분석 객체 등)가 등록하며 일반 사용자 모델·배치와 공유 렌더 자원에는 부여하지 않는다. 미부여 상태에는 native id·uuid를 대신 저장하지 않는다.
    _classtype: string = 'UMesh'
    _disposed: boolean = false
    _utype: number | undefined = UDEF.UMESH_TYPE._default
        의존: UDEF — 초기 메시 분류; 상수: {UMESH_TYPE._default}
    _ulayername: string | undefined
    _sphere: Sphere | undefined
    _bbox: Box3 | undefined
    _tile: U3dQuadTile | undefined
    _opt, _uproperties, _metaDataGroupName, _uMemoryMaterialName: any
    _meta: UMeta | null | undefined = null
    name: string
    castShadow: boolean = false
    receiveShadow: boolean = true
    _intersect: undefined
    _beforeRenderCallbacks: Map<string, function> | undefined

    constructor(geometry: BufferGeometry = new UBufferGeometry(), material: Material, opt: UMeshCO = {})
        의존:
            THREE.Mesh — 기반 생성; 생성자: {super()}
            UBufferGeometry — 기본 형상; 생성자: {new UBufferGeometry()}
            U3dObject — 공통 인스턴스 상태; 생성자: {new U3dObject()}
            assign — 공통 상태 합성; 함수: {assign()}
        동작:
            geometry와 material로 기반 메시를 만들고 U3dObject 상태를 복사한다.
            opt.name이 truthy이면 name에 반영하고 아니면 기존 이름을 유지한다.
            opt.utype이 truthy이면 _utype에 저장한다.
            opt.bbox가 truthy이면 _bbox에 저장한다.
            opt.tile이 truthy이면 _tile에 저장한다.
            castShadow를 false, receiveShadow를 true로 하고 _intersect는 undefined로 초기화한다.
            렌더러가 실행할 onBeforeRender를 등록하며 생성 이전에 합성된 callback 저장소를 초기화하지 않는다.

    static _assignPuids(ownerId: string, dataId: string | number, root: Object3D, usageId: string | number) -> void
        인터페이스: root는 보조 객체 추가·재부모화 이전의 원본 계층이다. usageId는 같은 데이터의 배치를 구분하며 일반 파일 로딩·사용자 배치에는 이 등록 함수를 사용하지 않는다.
        동작:
            ownerId·dataId·usageId를 먼저 검사하여 잘못된 식별값이 JSON 직렬화 과정에서 null 등으로 바뀌기 전에 예외를 발생시킨다.
            root의 자식 경로를 빈 배열로 시작한다. 현재 노드에 ownerId·dataId와 JSON 문자열 [usageId, 자식 경로]로 구성한 puid를 저장한다.
            각 자식의 순번을 경로에 추가하여 재귀 방문한다. Mesh뿐 아니라 원본 그룹에도 각각의 키를 부여하며 기존 puid가 있으면 덮어쓴다.

    static _getObjectId(object: Object3D & {puid?: string}) -> string
        인터페이스: 현재 객체의 조회·편집 키를 반환한다. 반환 문자열만으로 자동 재로딩 대상인지 판정하지 않는다.
        동작: object.puid가 비어 있지 않은 문자열이면 그 값을 반환하고 아니면 object.uuid를 반환한다. puid를 생성하거나 객체에 값을 저장하지 않는다.

    static _createPuid(ownerId: string, dataId: string | number, meshId: string | number) -> string
        인터페이스:
            ownerId는 데이터를 로드하여 메시를 생성·관리하는 주체의 식별값이다. 같은 앱에서 레이어·분석 등 종류가 다른 동명 주체까지 구분하고 재로딩 동안 유지한다. 사용자 계정 식별자가 아니다.
            dataId는 원본 데이터, meshId는 그 데이터의 사용 위치·부품을 구분한다. 같은 데이터의 반복 배치는 meshId로 구분한다. 문자열·안전 정수를 받으며 숫자 0과 빈 문자열도 식별값이다.
            반환값은 데이터 사용자까지 포함한 불투명 식별 키다. 서로 다른 LOD의 대응 관계는 구성하지 않는다.
        동작:
            ownerId가 비어 있지 않은 문자열이 아니면 TypeError를 던진다.
            dataId와 meshId가 문자열도 안전 정수도 아니거나 음의 0이면 TypeError를 던진다.
            ownerId·dataId·meshId를 순서대로 담은 배열을 JSON 문자열로 반환하여 값의 경계·타입과 이름 안의 구분자를 보존한다.

    override onBeforeRender(...args) -> void
        인터페이스: 렌더러가 전달한 모든 인수를 등록 callback에 그대로 전달한다.
        동작: _beforeRenderCallbacks가 Map이 아니면 종료한다. 등록 순서대로 각 callback을 메시 this와 args로 실행한다.

    addBeforeRenderCallback(key: string, callback: function) -> void
        인터페이스: callback은 렌더 직전 전달된 인수와 메시 this로 호출된다.
        동작: callback이 함수가 아니면 종료한다. 저장소가 Map이 아니면 생성하고 key에 callback을 저장하여 같은 key의 기존 함수를 교체한다.

    removeBeforeRenderCallback(key: string) -> void
        동작: callback 저장소가 있으면 해당 key를 삭제한다.

    override dispose() -> void
        의존:
            THREE.Mesh — 기반 해제 알림; 함수: {super.dispose()}
            UDEF — 메시 소유 렌더 자원 해제; 정적 함수: {disposeResource()}
        동작:
            이미 _disposed이면 종료한다. 먼저 _disposed를 true로 설정한 뒤 기반 dispose를 호출하여 재진입을 차단한다.
            렌더 callback 저장소를 비우고 유형·속성·구·타일·메타 참조를 undefined로 바꾼다.
            메시와 _opt에 연결된 렌더 자원을 공통 해제기에 전달한다.

    getTile() -> U3dQuadTile | undefined
        동작: _tile을 반환한다.
    getParent() -> Object3D | null
        의존: THREE.Mesh — 기반 부모 참조; 속성 읽기: {parent}
        동작: parent를 반환한다.

    getVertexes(isAbsolute) -> BufferAttribute | Array<number> | undefined
        의존:
            THREE.Mesh — 형상과 메시 위치; 속성 읽기: {geometry, position}
            defined — 형상과 정점 존재 판정; 함수: {defined()}
            BufferGeometry — 정점 접근; 함수: {getAttribute()}
            __GError__ — 형상 누락 보고; 함수: {__GError__()}
        동작:
            geometry 또는 position attribute가 없으면 오류를 보고하고 undefined를 반환한다.
            isAbsolute이 falsy이면 position attribute 자체를 반환한다.
            truthy이면 마지막 정점 하나를 제외하고 순회한다. 각 정점의 X 성분을 세 번 읽어 position.x·y·z를 각각 더한 평탄한 숫자 배열로 반환한다. 회전·축척·부모 변환은 적용하지 않는다. [확인 Q-001]

    getAbsoluteVertex(vertexX, vertexY, vertexZ) -> Vector3
        의존:
            THREE.Mesh — 메시 위치; 속성 읽기: {position}
            THREE — 좌표 결과 생성; 생성자: {new Vector3()}
        동작: 세 입력에 메시 position의 각 성분을 더한 새 Vector3를 반환한다.

    traverseFace(callback) -> void
        인터페이스: 정상 면 순회 callback의 this는 메시이며 인수는 정점 인덱스 세 개의 배열이다.
        의존:
            THREE.Mesh — 면 순회의 기반 형상; 속성 읽기: {geometry}
            defined — 형상·정점·인덱스 존재 판정; 함수: {defined()}
            BufferGeometry — 정점 접근; 함수: {getAttribute()}
            __GError__ — 형상 누락 보고; 함수: {__GError__()}
        동작:
            geometry 또는 position이 없으면 오류를 보고하고 callback(undefined)를 호출하지만 조기 종료하지 않는다. [확인 Q-002]
            geometry.index가 있으면 그 배열을 사용한다. 없으면 마지막 정점 하나를 제외한 순번 배열을 만든다.
            인덱스를 세 개씩 묶어 callback을 메시 this로 호출하며 세 개 미만의 마지막 잔여 인덱스는 처리하지 않는다.

    getMaterialIndexAsFace(face) -> number | undefined
        의존:
            THREE.Mesh — 재질 그룹의 기반 형상; 속성 읽기: {geometry}
            defined — 형상·재질 그룹 존재 판정; 함수: {defined()}
            __GError__ — 형상 누락 보고; 함수: {__GError__()}
            __GInfo__ — 그룹 부재 안내; 함수: {__GInfo__()}
        동작:
            geometry가 없으면 오류를 보고하고 undefined를 반환한다.
            결과를 0으로 시작한다. 각 그룹의 start 이상 start+count-1 미만인 정수에 face[0]이 일치하면 그 그룹 materialIndex로 결과를 교체한다.
            그룹이 없으면 안내를 출력한다. 마지막으로 기록한 결과를 반환한다.

    getNormalAsFace(face) -> Array<object> | undefined
        의존:
            THREE.Mesh — 정점 법선 저장소; 속성 읽기: {geometry}
            __GInfo__ — 잘못된 면 입력 안내; 함수: {__GInfo__()}
        동작: face가 배열이 아니거나 길이가 3 미만이면 안내 후 종료한다. 각 인덱스의 normal 성분을 x·y·z 객체로 모아 반환한다.

    getVertexAsFace(face, isAbsolute) -> Array<object> | undefined
        의존:
            THREE.Mesh — 정점 좌표 저장소; 속성 읽기: {geometry}
            __GInfo__ — 잘못된 면 입력 안내; 함수: {__GInfo__()}
        동작:
            face가 배열이 아니거나 길이가 3 미만이면 안내 후 종료한다.
            각 정점의 position 성분을 읽는다. isAbsolute이 truthy이면 메시 위치를 더한 Vector3로 바꾸고, 그 외에는 x·y·z 객체 그대로 결과 배열에 넣어 반환한다.

    getMetaDataGroupName() -> any
        의존: defined — 메타데이터 그룹 존재 판정; 함수: {defined()}
        동작: _metaDataGroupName이 defined이면 반환하고 아니면 undefined를 반환한다.
    getUType() -> number | undefined
        동작: _utype을 반환한다.
    setUType(type) -> void
        동작: _utype에 type을 저장한다.
    setType(type) -> void
        동작: type을 setUType에 전달한다.
    getType() -> number | undefined
        동작: getUType의 결과를 반환한다.

    distanceToCameraPosition(vec3, useSphere) -> number
        의존:
            THREE.Mesh — 거리 계산 가능 여부; 속성 읽기: {geometry}
            defined — 입력·형상·구 존재 판정; 함수: {defined()}
            UDEF — 무효 결과; 상수: {INVALID}
            Sphere — 구에서 점까지 거리; 함수: {distanceToPoint()}
            Box3 — 박스에서 점까지 거리; 함수: {distanceToPoint()}
        동작: vec3 또는 geometry가 없으면 INVALID를 반환한다. useSphere가 truthy이고 _sphere가 있으면 구의 거리를 반환하고, 그 외에는 새로 계산한 경계 박스의 거리를 반환한다.

    animationOpacity(layer: U3dLayer, min: number = 0.3, max: number = 1) -> void
        의존:
            THREE.Mesh — 페이드할 재질; 속성 읽기: {material}
            defined — 레이어 존재 판정; 함수: {defined()}
            U3dLayer — 페이드 설정; 속성 읽기: {_animation, _transparent, _opacityDist}
        동작:
            layer가 defined인 경우에만 다음 설정을 수행한다.
                layer._animation === true이면 단일·배열 재질의 opacity를 min으로 설정하고 animationOpacity 이름의 렌더 callback을 등록한다.
                    callback에서 opacity가 max 이상이면 max로 보정하고 레이어의 transparent 설정을 복원한다. 그 미만이면 transparent를 true로 하고 _opacityDist만큼 더한다.
                    단일 재질이 완료되거나 배열의 모든 재질이 이번 실행에서 완료 판정을 받으면 callback을 제거한다.
            layer가 없거나 layer._animation이 true가 아니면 아무 설정 없이 종료한다.

    computeBoundingBox() -> void
        의존:
            THREE — 경계 박스 생성과 객체 경계 계산; 생성자: {new Box3()}; 함수: {setFromObject(), getBoundingSphere()}
            USphere — 경계 구 생성; 생성자: {new USphere()}
        동작: 경계 박스와 구가 없으면 생성한다. 현재 메시의 객체 경계로 박스를 갱신하고 그 박스를 감싸는 구도 갱신한다.
    getBoundingBox() -> Box3
        의존: THREE — 경계 박스 생성; 생성자: {new Box3()}
        동작:
            _bbox가 없으면 새 박스를 생성한다.
            경계를 매번 다시 계산한 뒤 _bbox 자체를 반환한다.
    getBBox() -> Box3
        동작: getBoundingBox의 결과를 반환한다.
    override raycast(a, b) -> void
        의존:
            THREE.Mesh — 기반 광선 교차와 표시 여부; 함수: {super.raycast()}; 속성 읽기: {visible}
            UDEF — 지형 타일 유형; 상수: {UMESH_TYPE._tile}
        동작: 메시가 visible이거나 a._useVisible이 falsy이거나 유형이 지형 타일이면 기반 raycast에 a·b를 전달한다.

    getUid() -> string
        동작: 현재 메시를 공통 식별 함수에 전달하여 자동 재로딩 대상의 puid 또는 현재 인스턴스의 uuid를 반환한다.
    getOid() -> string | number | Array<number> | undefined
        의존: THREE.Mesh — 원본 피처 속성; 속성 읽기: {userData}
        동작: userData.oid 자체를 반환하며 값이 없으면 undefined이다. 런타임 ID나 puid로 대체하지 않는다.
    getLayerName() -> string | undefined
        동작: _ulayername을 반환한다.
    setLayerName(layername) -> void
        동작: _ulayername에 layername을 저장한다.

    getColor() -> Color
        의존: THREE.Mesh — 표시 색상 저장소; 속성 읽기: {material}
        동작: 배열 재질이면 첫 재질을 사용한다. _oriColor가 truthy이면 그 값을, 아니면 color를 반환한다.
    setColor(color) -> void
        의존:
            THREE.Mesh — 표시 색상을 바꿀 재질; 속성 읽기: {material}
            THREE — 색상 해석; 생성자: {new Color()}
            defined — 색상 존재 판정; 함수: {defined()}
            console — 오류 보고; 함수: {error()}
        동작:
            입력으로 Color를 만든다. color가 defined이면 단일 또는 배열의 각 material을 처리한다.
                material._oriColor가 truthy이면 _oriColor를 color로 교체한다.
                material.color를 color로 교체한다. 모든 재질에 같은 Color 참조를 저장한다.
            예외가 나면 오류를 출력하며 이미 변경된 재질은 복구하지 않는다.
    getOpacity() -> number
        의존:
            THREE.Mesh — 일반 재질의 opacity 저장소; 속성 읽기: {material}
            도형 합성 대상(this) — 도형의 opacity 조회; 함수: {_getGeometryOpacity()}
        동작: 합성 대상이 _getGeometryOpacity 함수를 제공하면 호출 결과를 반환한다. 그 외에는 배열의 첫 재질 또는 단일 재질에서 _oriOpacity가 truthy이면 그 값을, 아니면 opacity를 반환한다.
    setOpacity(opacity) -> void
        의존:
            THREE.Mesh — 일반 opacity를 바꿀 재질; 속성 읽기: {material}
            도형 합성 대상(this) — 도형의 opacity 반영; 함수: {_setGeometryOpacity()}
        동작: 합성 대상이 _setGeometryOpacity 함수를 제공하면 위임하고 종료한다. 그 외에는 단일·배열 재질의 transparent를 opacity < 1로 설정하고, 기존 transparent와 달랐던 재질에만 needsUpdate를 켠 뒤 opacity를 저장한다.
    setLabelText(labelText) -> void
        의존:
            THREE.Mesh — 연결 라벨 저장소; 속성 읽기: {userData}
            defined — 라벨 존재 판정; 함수: {defined()}
            label — 연결된 라벨 문구 변경; 함수: {setLabel()}
        동작: userData.label이 있으면 labelText로 라벨을 갱신한다.
    getLabel() -> object | undefined
        의존: THREE.Mesh — 연결 라벨 저장소; 속성 읽기: {userData}
        동작: userData.label을 반환한다.

    #ensureShaderBrightness(material, name) -> void
        의존: THREE — GLSL 버전 제한; 상수: {GLSL3}
        동작:
            material이 없거나 ShaderMaterial이 아니면 예외를 던진다. GLSL3도 예외를 던진다.
            uniforms 저장소와 name의 uniform이 없으면 값 1로 준비한다.
            fragmentShader에 해당 float uniform 선언이 없으면 precision 선언 뒤, 그마저 없으면 선두 version 줄 뒤, 둘 다 없으면 맨 앞에 삽입한다.
            밝기 적용 표식이 없으면 gl_FragColor 대입 뒤 RGB에 uniform을 곱하는 구문과 표식을 삽입한다.
            셰이더 문자열이 바뀐 경우에만 fragmentShader를 교체하고 needsUpdate를 켠다.

    setBrightness(input) -> void
        의존:
            THREE.Mesh — 밝기를 바꿀 재질; 속성 읽기: {material}
            도형 합성 대상(this) — 도형의 밝기 반영; 함수: {_setGeometryBrightness()}
            defined — 재질 존재 판정; 함수: {defined()}
            Color — 일반 재질 색상 배율; 함수: {multiplyScalar()}
            console — 셰이더 보정 실패 보고; 함수: {warn()}
        동작:
            합성 대상이 _setGeometryBrightness 함수를 제공하면 input을 전달하고 종료한다.
            material이 defined인 경우에만 input을 Number로 변환한다. 변환값이 유한하지 않으면 종료한다.
                material.isShaderMaterial이 truthy이면 밝기 uniform을 준비한 뒤 변환한 값을 저장한다. 준비 실패는 경고하고 해당 재질만 건너뛴다.
                일반 재질은 현재 색상에 밝기값을 곱한다. 성공적으로 처리한 재질은 needsUpdate를 켠다.

    hasReachedShadowTime(updateTime) -> boolean
        의존: THREE.Mesh — 원래 그림자 설정의 저장소; 속성 읽기·쓰기: {userData}
        동작: userData.useShadow가 없으면 현재 castShadow·receiveShadow와 시각 0을 기록한다. 원래 두 설정이 모두 false이면 false, 그 외에는 updateTime이 저장 시각보다 큰지 반환한다.
    applyShadow(apply, updateTime) -> void
        의존: THREE.Mesh — 원래 그림자 설정의 저장소; 속성 읽기·쓰기: {userData}
        동작:
            userData.useShadow가 없으면 현재 그림자 설정과 updateTime을 기록하고, apply가 falsy일 때만 두 그림자를 끈 뒤 종료한다.
            기존 기록이 있으면 apply가 truthy일 때 저장된 그림자 설정을 복원하고 아니면 둘 다 끈다. 마지막 적용 시각을 updateTime으로 바꾼다.

UMeshCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        utype?: number
        bbox?: Box3
        tile?: U3dQuadTile | undefined | null
UMeshCO extends U3dObjectCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
        utype?: number
        bbox?: Box3
        tile?: U3dQuadTile | undefined | null
```

## 4. 공통 처리 기준과 제약

```spec
puid는 엔진이 자동 해제·재로딩하는 데이터에서 같은 데이터 사용자의 같은 데이터·사용 위치·부품을 다시 연결할 때만 사용한다. 일반 사용자 모델·배치·공유 렌더 자원에는 부여하지 않으며 현재 인스턴스 조회에는 uuid를 사용한다. 위치·형상 추정이나 실행 중 생성한 Three.js id·uuid로 데이터 간 동일성을 만들지 않는다.
데이터 사용자 간 충돌은 키에 포함한 ownerId로 구분한다. 이 값의 유일성은 생성·등록 주체가 보장하며 UMesh가 이름만으로 종류를 추정하지 않는다. LOD 간 객체 대응은 레이어 또는 LOD 관리 객체의 책임이다.
기반 copy/clone은 puid를 복사하지 않는다. 새 복제본은 미부여 상태이고, 기존 대상에 copy하면 대상의 puid는 바뀌지 않는다. 등록·재사용 시 같은 사용 메시인지 판정하고 키를 부여하는 책임은 데이터 사용자에 있다.
userData.oid는 원본 데이터 추적 속성이며 puid와 독립적이다. puid 구성은 이 속성을 엔진 식별값으로 읽거나 변경하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
