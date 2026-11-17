# UGroup 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`UGroup`은 `THREE.Group`의 장면 그래프 그룹 기능에 객체 동일성 기반 자식·컴포넌트 구성원 관리, 이벤트 디스패치, 순환 자식 선택, 메시 조회와 재질 상태 일괄 변경 기능을 결합한다.

### 1.2 책임 범위

- `add()`, `remove()`, `clear()`, `fastClear()`로 Object3D 자식과 별도 컴포넌트 구성원을 관리한다.
- `getComponents()`는 컴포넌트 목록의 복사본, `getMembers()`는 Object3D 자식 다음에 컴포넌트가 오는 전체 목록의 복사본을 반환한다.
- 컴포넌트는 getWorldPosition() 함수를 제공하고 isObject3D가 truthy가 아닌 객체이며, 등록 시 렌더 부모·컴포넌트 부모를 변경하지 않는다. 하나의 컴포넌트를 여러 그룹에 독립적으로 등록할 수 있다.
- 공개 add/remove 인자 타입은 Three.js 원본과 동일한 단일 Object3D 인자 선언으로 유지하고, 복수 인자는 arguments로 처리하며, 구현 내부에서 UGroupMember로 선언하여 컴포넌트를 판별한다. 타입 검사 호출부에서 컴포넌트를 직접 넘길 때는 명시적인 타입 단언이 필요하다.
- children/next()/traverse() 및 그룹 변환은 Object3D 자식만 처리한다. getChildren()은 컴포넌트도 포함한 복사본을 반환한다. 컴포넌트는 자동 복제·직렬화하지 않는다.
- 현재 자식 배열을 참조하는 순환 선택기를 통해 자식을 하나씩 반환한다.
- 자식 제거 시 제거 대상과 그룹에 각각 제거 이벤트를 전달한다.
- 하위 메시의 기하 경계 중심을 평균하여 그룹 중심을 계산한다.
- 하위 일반 메시·일반 컴포넌트의 알파 재질을 변경한다. 인스턴스 컴포넌트·메시는 경고하고 건너뛴다. 색상·투명도는 컴포넌트 API에 위임하여 인스턴스별로 적용한다.
책임 경계: `remove()`·`clear()`·`fastClear()`는 구성원 등록만 정리하며 렌더링 자원을 해제하지 않는다. 이 클래스에는 레이어 이름으로 메시를 찾는 `getMesh()`나 자원을 해제하는 `removeMesh()`가 없다.

### 1.3 주요 동작 방식

모듈 초기화 시 `UEventDispatcher`의 prototype 기능을 결합하고, 생성 시 `THREE.Group`과 `UEventDispatcher`의 인스턴스 상태를 초기화한다. 자식 배열을 참조하는 동적 순환 선택기를 만들고, `WeakSet`으로 `add()`를 통해 등록한 객체의 중복 추가를 막는다.

`remove()`는 직접 자식 배열에서 객체를 찾고, 식별 집합과 배열이 불일치하면 객체 식별자를 비교하는 대체 검색을 수행한다. 실제 제거 시 대상의 `removed` 이벤트와 그룹의 `childremoved` 이벤트를 동기적으로 전달한다.

재질 관련 함수는 전체 하위 트리와 하위 UGroup의 논리 컴포넌트를 순회한다. 알파 변경은 인스턴스 공유 재질에 접근하기 전에 건너뛰고 경고한다. 색상·투명도는 논리 컴포넌트의 API로 위임한다.

### 1.4 주요 사용처와 연계 대상

- `U3dLayer`는 레이어별 렌더 객체를 담는 기본 그룹으로 `UGroup`을 생성하고 외부에 제공한다.
- `U3dApp`은 모델, 지형, 분석, 사용자 객체와 주석 렌더 루트 그룹을 구성한다.
- `UOBJParser`, `UMeshParser`, `UTDSLoader`, `UGLTFLoader`는 파싱하거나 로드한 객체의 계층을 구성한다.
- `U3dModelWFSLayer`와 `U3dModelU3FLayer`는 `next()`로 그림자 갱신 대상을 나누어 선택한다.
- `U3dImageLayer`는 `childadded`와 `childremoved` 이벤트의 `child`를 사용하여 새 자식에 clipping plane을 적용하거나 제거한다.
- `URenderer`는 프레임별 렌더 객체 기록 그룹을 `fastClear()`로 비운다.
- `createUserGroup`과 `U3dModelTdsLayer`는 선택 메시를 사용자 지정 그룹으로 구성하고 공개 API에서 `UGroup`을 반환하거나 입력받는다.
- `U3dPOI`, `ULocalENUHelper`, `UBox3HelperGroup`, `U3dCloud`와 `Vector3DTilePoints`는 `UGroup`을 상속하여 자체 객체 계층을 구성한다.

## 3. 정규 자연어 수도코드

```spec
UGroupComponent 타입 정의
    U3dComponentPosition | U3dComponentInstancedPosition
    렌더 부모를 바꾸지 않고 그룹에 등록하는 일반·인스턴스 컴포넌트다.

UGroupMember 타입 정의
    THREE.Object3D | UGroupComponent
    직접 렌더 자식 또는 논리 컴포넌트 구성원이다.

UGroupCO extends UEventDispatcherCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            생성할 그룹 이름이다.
        drawarg?: import('@UDrawArg').UDrawArg | undefined
            그룹과 함께 보관할 렌더링 실행 인자다.

UGroup_AlphaMaterial extends THREE.Material 부분 타입 명세
    이 명세에서 사용하는 필드:
        alphaMap?: THREE.Texture | null
        _alphaMap?: THREE.Texture | null
            removeAlphaMap()이 임시 보관한 alpha map이다.
        alphaTest?: number
        _alphaTest?: number | null
            원본 타입에 선언된 필드이며 그룹 변경 전 값은 아래 별도 필드로 보관한다.
        _groupAlphaTest?: number
            setAlphaTest()가 처음 변경하기 전의 값을 보관한다.

_removedEvent: { type: "removed" }
    모듈의 모든 UGroup 인스턴스가 자식 removed 알림에 재사용하는 이벤트 객체

_childRemovedEvent: { type: "childremoved", child: Object3D | null }
    모듈의 모든 UGroup 인스턴스가 그룹 childremoved 알림에 재사용하는 이벤트 객체

UGroup extends THREE.Group 클래스 정의
    의존:
        THREE.Group — 장면 그래프 그룹 기반; 상속: {THREE.Group}
        subExtends — UEventDispatcher prototype 기능과 생성 상태 결합; 함수: {subExtends(), subSuper()}
        UEventDispatcher — 이벤트 등록과 디스패치 기능 제공; 생성자: {new UEventDispatcher()}

    동작: 클래스 정의 뒤 subExtends(UGroup, UEventDispatcher)를 실행하여 UGroup에 없는 UEventDispatcher prototype 멤버와 subSuper()를 결합한다.

    #idMap: WeakSet<Object3D> = 새 WeakSet
        add()를 통해 등록한 직접 자식의 객체 식별 집합

    #components: Set<UGroupComponent> = 새 Set
        렌더 부모를 바꾸지 않는 논리 구성원의 객체 동일성 집합

    name: string = 빈 문자열
        생성 옵션의 truthy name을 보관하는 그룹 이름이다.

    #iterator: DynamicCycler<Object3D> | undefined = undefined
        생성 시점의 children 배열 객체를 참조하는 순환 선택기

    _drawArg: UDrawArg | undefined = undefined
        생성 옵션으로 받은 렌더링 실행 인자

    _boundingBox: THREE.Box3 | undefined = undefined
        생성 시 undefined로 초기화되며 현재 활성 UGroup 실행 흐름에서는 갱신되지 않는 시스템 내부 경계 상태

    constructor(opt: UGroupCO = {})
        역할: 장면 그래프 그룹, 이벤트 상태, 자식 식별 집합과 순환 선택기를 초기화한다.
        의존:
            THREE.Group — 그룹 기반 상태 초기화; 생성자: {super()}; 속성 읽기: {children}
            subExtends — 결합된 UEventDispatcher 생성 상태 복사; 함수: {subSuper()}
            UEventDispatcher — subSuper()로 복사할 이벤트 상태 생성; 생성자: {UEventDispatcher}
            createDynamicCycler — 현재 children 배열을 사용하는 선택기 생성; 함수: {createDynamicCycler()}
        동작:
            THREE.Group 기반 상태를 초기화한다.
            UEventDispatcher 인스턴스의 자체 상태를 현재 객체에 복사한다.
            opt.name이 truthy이면 name에 저장하고, 아니면 빈 문자열을 저장한다.
            opt.drawarg를 _drawArg에 저장한다.
            생성 시점의 children 배열 객체를 참조하는 DynamicCycler를 생성하여 #iterator에 저장한다.

    next() -> THREE.Object3D | undefined
        역할: 동적 순환 선택기가 정한 다음 자식을 반환한다.
        의존: DynamicCycler(#iterator) — 다음 자식 선택; 함수: {next()}
        동작: #iterator가 있으면 next() 결과를 반환하고, 없으면 undefined를 반환한다. [확인 Q-001]

    has(object: UGroupMember) -> boolean
        역할: 객체가 add()를 통해 현재 그룹의 식별 집합에 등록되었는지 확인한다.
        동작: 논리 컴포넌트이면 #components에서, 아니면 #idMap에서 객체 동일성을 조회한다.

    override add(object: THREE.Object3D) -> this
        역할: 아직 식별 집합에 없는 객체 하나를 직접 자식으로 추가한다.
        처리 기준:
            object가 falsy이거나 #idMap에 이미 있으면 상태를 변경하지 않는다.
            기반 THREE.Group처럼 가변 인자를 순서대로 처리하며 인수가 없으면 현재 그룹을 반환한다.
            기반 add가 object 추가를 거부하거나 이벤트 listener가 오류를 던져도 이미 완료된 기반 상태 변경은 되돌리지 않는다.
        의존:
            THREE — 기반 자식 추가; 함수: {Group.prototype.add.call()}
            UEventDispatcher — 혼합된 현재 그룹의 컴포넌트 추가 알림; 함수: {dispatchEvent()}
        동작:
            인수가 둘 이상이면 각 인수에 같은 add를 순서대로 적용한 뒤 현재 그룹을 반환한다.
            object가 falsy이면 현재 그룹을 반환한다.
            object가 truthy이면 등록 여부를 확인하고, 이미 등록되어 있으면 현재 그룹을 반환한다.
            논리 컴포넌트인지 검사한다.
            컴포넌트이면 #components Set에 등록한 뒤 componentadded 이벤트({component: object})를 그룹에 전달하고 반환한다. 중복 등록은 이벤트를 발생시키지 않는다.
            Object3D이면 THREE.Group.prototype.add로 object의 기존 부모를 해제하고 현재 그룹의 자식에 추가하도록 요청한다.
            기반 add가 object를 추가하면 object의 added 이벤트와 현재 그룹의 childadded 이벤트가 동기적으로 전달된다. [확인 Q-004]
            childadded 이벤트 전달 중에는 object가 아직 #idMap에 등록되지 않은 상태다.
            기반 add의 실제 추가 여부와 관계없이 정상 반환한 object를 #idMap에 등록한다. [확인 Q-005]
            현재 그룹을 반환한다.

    override remove(object: THREE.Object3D) -> this
        역할: 입력 객체를 직접 자식과 식별 집합에서 제거하고 제거 이벤트를 전달한다.
        인터페이스: arguments로 받은 객체·컴포넌트를 순서대로 처리한다.
        처리 기준:
            인수가 없으면 상태를 변경하지 않는다. 각 입력이 falsy이면 해당 입력은 건너뛴다.
            둘 이상의 인수를 받으면 각 인수를 같은 remove() 처리로 순서대로 제거한다.
            직접 자식 배열과 #idMap이 불일치하면 치명적 오류를 기록하고 식별자 비교로 대체 대상을 찾는다.
        의존:
            __GError__ — 자식 배열과 식별 집합 불일치 기록; 함수: {__GError__()}
            THREE.Group(this) — 직접 자식 위치 조회와 제거; 속성 읽기·쓰기: {children}
            THREE.Object3D(object) — 부모 연결 해제와 removed 이벤트 전달; 함수: {dispatchEvent()}; 속성 쓰기: {parent}
            UEventDispatcher(this) — childremoved 이벤트 전달; 함수: {dispatchEvent()}
        동작:
            인수가 둘 이상이면 각 인수에 remove()를 호출한 뒤 현재 그룹을 반환한다.
            object가 falsy이면 현재 그룹을 반환한다.
            object가 truthy이면 논리 컴포넌트인지 검사한다.
            컴포넌트이면 #components에서 삭제하고 실제 삭제된 경우에만 componentremoved 이벤트({component: object})를 그룹에 전달한 뒤 반환한다. 렌더 객체나 레이어 등록은 변경하지 않는다.
            Object3D이면 children에서 object의 객체 동일성 위치를 찾는다.
            직접 위치가 없지만 #idMap에 등록되어 있으면 오류 코드 7517757을 기록하고 각 자식과 object의 getId() 결과가 같은 위치를 찾는다.
            제거 위치를 찾은 경우:
                입력 object의 parent를 null로 바꾸고 children에서 찾은 위치의 객체를 제거한다. [확인 Q-005]
                입력 object가 dispatchEvent()를 제공하면 모듈 공용 removed 이벤트를 전달한다.
                모듈 공용 childremoved 이벤트의 child에 입력 object를 넣어 현재 그룹에서 전달한 뒤 child를 null로 되돌린다. [확인 Q-004]
            입력 object를 #idMap에서 삭제하고 현재 그룹을 반환한다.

    getComponents() -> Array<UGroupComponent>
        동작: 등록 순서의 컴포넌트 목록 복사본을 반환한다.

    getMembers() -> Array<UGroupMember>
        의존: THREE.Group — 장면 그래프 직접 자식; 속성 읽기: {children}
        동작: 직접 자식 다음에 등록 컴포넌트를 나열한 복사본을 반환한다. 하위 그룹은 펼치지 않는다.

    override clear() -> this
        동작: 현재 구성원 목록의 복사본을 얻어 각 항목의 등록을 해제하고 현재 그룹을 반환한다. 해제 이벤트를 전달하고 렌더 자원은 보존한다.

    fastClear() -> void
        역할: 이벤트 전달이나 자원 해제 없이 직접 자식 기록을 빠르게 비운다.
        의존: THREE.Group(this) — 직접 자식 배열 초기화; 속성 쓰기: {children.length}
        동작:
            children 길이를 0으로 바꾼다.
            #idMap을 새 WeakSet으로 교체한다.
            #components를 비운다. componentremoved 이벤트는 전달하지 않는다.

    getCenter() -> THREE.Vector3
        의존:
            THREE.Group — 부모·자손의 월드 행렬 및 트리 순회; 함수: {updateWorldMatrix(), traverse()}
            THREE.Vector3 — 중심 누적과 월드 좌표 변환; 생성자: {new Vector3()}; 함수: {applyMatrix4(), add(), divideScalar()}
            THREE.BufferGeometry — 현재 기하 경계 산출; 함수: {computeBoundingBox()}
            THREE.Box3 — 비어 있지 않은 기하 중심; 함수: {isEmpty(), getCenter()}
            UGroupComponent — 컴포넌트의 월드 위치; 함수: {getWorldPosition()}
        동작:
            중심 누적 벡터와 작업 벡터를 만들고 그룹·부모·자손의 월드 행렬을 갱신한다.
            하위 THREE.Mesh 중 geometry가 있는 메시의 boundingBox를 계산한다. 경계가 없거나 비어 있으면 생략하고 경계 중심에 matrixWorld를 적용한다.
            변환한 x·y·z가 모두 유한한 점만 중심에 더하고 개수를 늘린다.
            하위 그룹에 등록된 각 컴포넌트의 getWorldPosition 결과도 세 좌표가 유한할 때만 한 점으로 포함한다. 같은 컴포넌트는 한 번만 처리한다.
            유효한 점 개수가 있으면 평균을, 없으면 (0, 0, 0) 벡터를 반환한다.

    getChildren() -> Array<UGroupMember>
        동작: 직접 자식 다음에 등록 컴포넌트를 나열한 복사본을 반환한다. 하위 그룹은 펼치지 않으며 반환 배열 변경은 등록 상태에 영향을 주지 않는다.

    getParent(component?: UGroupComponent) -> THREE.Object3D | undefined
        의존: THREE.Group — 장면 그래프 부모; 속성 읽기: {parent}
        동작:
            component가 undefined가 아니면 논리 컴포넌트인지와 이 그룹의 구성원인지 확인하여 모두 참이면 this, 아니면 undefined를 반환한다. null도 이 판정 경로다.
            component가 undefined이면 장면 그래프 parent를 반환하되 nullish일 때 undefined를 반환한다. 부모 연결·구성원 등록은 변경하지 않는다.

    removeAlphaMap() -> void
        동작: 알파 재질 순회에서 alphaMap이 nullish이면 생략한다. 그 밖에는 _alphaMap이 nullish일 때만 원래 map을 보관하고 alphaMap을 null, needsUpdate를 true로 설정한다. 텍스처는 해제하지 않는다.

    resetAlphaMap() -> void
        동작: 알파 재질 순회에서 _alphaMap이 nullish이면 생략한다. 그 밖에는 alphaMap에 보관 참조를 복원하고 _alphaMap을 null, needsUpdate를 true로 설정한다.

    setAlphaTest(alphaFilter: number) -> void
        의존:
            defined — 입력·현재 alphaTest 유효성; 함수: {defined()}
            Web API — 입력 부재 오류; 함수: {console.error()}
        동작:
            alphaFilter가 null 또는 undefined이면 console.error 후 종료한다.
            알파 재질을 순회하여 alphaTest가 defined인 재질만 처리한다. _groupAlphaTest가 nullish일 때 변경 전 값을 보관하고 alphaTest를 입력값, needsUpdate를 true로 설정한다.

    setOpacity(opacity: number) -> void
        의존:
            THREE.Group — 하위 메시 순회; 함수: {traverse()}
            THREE.Material — 투명도와 셰이더 갱신; 속성 읽기·쓰기: {opacity, transparent, needsUpdate}
            UGroupComponent — 컴포넌트별 투명도; 함수: {setOpacity()}
        동작:
            하위 THREE.Mesh의 단일·배열 material을 순회한다. transparent가 opacity < 1 결과와 다르면 needsUpdate를 true로 바꾸고, transparent와 opacity를 적용한다. 직접 트리에 있는 인스턴스 메시를 별도로 제외하지 않는다.
            논리 구성원은 중복 없이 자체 setOpacity에 위임하여 인스턴스별 값을 유지한다.

    setColor(color: THREE.ColorRepresentation) -> void
        의존:
            THREE.Group — 하위 메시 순회; 함수: {traverse()}
            THREE.Color — 재질 색상 적용; 함수: {set()}
            UGroupComponent — 컴포넌트별 색상; 함수: {setColor()}
        동작:
            하위 THREE.Mesh의 단일·배열 material 중 color가 nullish가 아니면 set(color)를 호출한다. 별도 needsUpdate 설정이나 직접 트리의 인스턴스 메시 제외는 없다.
            논리 구성원은 중복 없이 자체 setColor에 위임한다.

    getId(object: THREE.Object3D & Partial<{ getUid: () -> string | number | undefined, _uuid: string | number, _id: string | number }>) -> string | number | undefined
        역할: 자식 배열 불일치 복구 검색에 사용할 객체 식별자를 조회한다.
        의존:
            식별 가능 THREE.Object3D(object) — 사용자 식별자 또는 대체 식별자 조회; 함수: {getUid()}; 속성 읽기: {uuid, _uuid, _id}
            defined — getUid와 반환 식별값 존재 확인; 함수: {defined()}
        동작:
            object.getUid가 정의되어 있으면 호출 결과를 얻고, 그 결과가 null·undefined가 아니면 반환한다.
            getUid가 없거나 결과가 null·undefined이면 object.uuid, object._uuid, object._id 중 첫 truthy 값을 반환한다. 이 값은 현재 구성원 검색에만 사용하며 puid에 등록하지 않는다.

isGroupComponent(object: UGroupMember) -> boolean
    동작: object가 truthy이고 isObject3D가 falsy이며 getWorldPosition이 함수일 때만 true를 반환한다. getVectorPosition 존재로 판정하지 않는다.

forEachGroupComponent(group: UGroup, callback: function(UGroupComponent) -> void) -> void
    의존: THREE.Group — 자손 그룹 순회; 함수: {traverse()}
    동작:
        호출마다 방문 Set을 만들고 group의 트리를 순회한다.
        UGroup인 노드의 등록 컴포넌트 복사본을 얻는다. 이미 방문한 객체는 생략하고, 아니면 Set에 추가한 뒤 callback을 호출한다. 같은 컴포넌트가 여러 그룹에 있어도 한 번만 처리한다.

forEachAlphaMaterial(group: UGroup, operation: string, callback: function(UGroup_AlphaMaterial) -> void) -> void
    의존:
        THREE.Group — 트리 재질 순회; 함수: {traverse()}
        UGroupComponent — 인스턴스 판정·일반 렌더 객체; 함수: {getInstanced(), getObject()}
        Web API — 인스턴스 공유 재질 변경 생략 안내; 함수: {console.warn()}
    동작:
        호출마다 방문 재질 Set과 경고 객체 Set을 만든다.
        group 트리의 각 객체에서 isInstancedMesh 또는 isInstancedMesh2가 truthy이면 객체·operation을 포함해 한 번 경고하고 재질 접근을 생략한다.
        그 밖에 material이 truthy이면 단일·배열을 순회하여 처음 만난 재질만 방문 Set에 넣고 callback을 호출한다.
        등록 컴포넌트를 중복 없이 순회한다. getInstanced가 truthy이면 공유 객체를 읽기 전에 경고하고, 아니면 getObject 결과가 nullish가 아닐 때 같은 재질 처리로 그 객체의 트리를 순회한다.

unionBoundingBox(object: unknown) -> void
    처리 기준: 소스에 남아 있으나 현재 UGroup의 활성 메서드에서 호출하지 않는 경계 합성 함수다. this는 UGroup이다.
    의존:
        defined — 기하·경계 존재 확인; 함수: {defined()}
        THREE.Box3 — 누적 경계 합성; 함수: {union()}
    동작:
        UMesh 또는 U3dGeometry이면 geometry와 그 boundingBox가 없을 때 반환한다. UGroup이면 그 _boundingBox가 없을 때 반환한다.
        지원 객체의 경계를 position만큼 이동한 새 경계로 만든다. 회전·scale·matrixWorld는 적용하지 않는다.
        this._boundingBox가 없으면 계산한 box를 그대로 저장한다. 기존 경계가 있고 box가 truthy이면 기존 경계에 union한다. 미지원 객체는 box가 undefined이다.

translateBox(box: THREE.Box3, point: THREE.Vector3Like) -> THREE.Box3
    의존:
        THREE.Vector3 — 원본 경계 좌표의 복제·이동; 함수: {clone(), add()}
        THREE.Box3 — 새 이동 경계; 생성자: {new Box3()}
    동작: box.min·max를 각각 복제하여 point를 더한 뒤 새 Box3로 반환한다. 원본 box·point는 바꾸지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
자식 중복 여부는 객체 식별자로 비교하지 않고 #idMap의 객체 동일성으로 판정한다.
#idMap과 children의 일관성은 기반 add가 객체를 실제로 추가하고 이벤트 listener가 오류 없이 끝난 뒤 UGroup의 add(), remove(), fastClear()만으로 자식을 변경할 때 유지된다.
children 또는 상속한 attach()로 자식을 직접 변경하면 #idMap, parent 연결과 제거 이벤트가 같은 경로로 갱신되지 않는다.
add()에 현재 그룹 자신을 입력하면 기반 add는 자식 추가를 거부하지만 #idMap은 현재 그룹을 등록한다. [확인 Q-005]
add()와 remove()는 자식의 geometry, texture 또는 material을 해제하지 않는다.
fastClear()는 자식의 parent 연결을 끊거나 removed 및 childremoved 이벤트를 전달하지 않으며 렌더링 자원도 해제하지 않는다.
fastClear()는 #iterator를 다시 만들지 않으므로 DynamicCycler의 내부 위치는 유지되고 같은 children 배열의 변경된 길이를 사용한다.
#iterator는 생성 당시 children 배열 객체를 계속 참조하므로 children의 원소 변경은 반영하지만 children 속성에 새 배열을 대입하면 next()는 교체 전 배열을 계속 사용한다.
removeAlphaMap(), resetAlphaMap(), setAlphaTest()는 하위 일반 메시와 등록된 일반 컴포넌트를 처리하며 인스턴스는 경고 후 건너뛴다.
removeAlphaMap()은 alphaMap texture를 dispose하지 않고 _alphaMap으로 참조만 옮기며 resetAlphaMap()은 해당 참조를 alphaMap으로 복원한다.
setOpacity()와 setColor()는 하위 자손의 배열 material도 처리하고 컴포넌트 API에 위임한다.
알파 재질 변경은 material.needsUpdate를 true로 설정한다.
setAlphaTest()는 이전 alphaTest를 _groupAlphaTest에 저장하지만 UGroup은 이를 복원하는 함수를 제공하지 않는다.
자식 추가·제거 이벤트 listener가 오류를 던지면 오류는 호출자에게 전달되고, 이벤트 전달 뒤에 예정된 #idMap 갱신이나 공용 이벤트 객체 초기화는 실행되지 않을 수 있다.
UGroup의 이벤트 등록·해제·전달은 THREE.EventDispatcher에서 상속한 구현이 아니라 모듈 초기화에서 결합한 UEventDispatcher 구현을 따른다.
UGroup이 정의한 동작은 동기적으로 실행되며 listener, getUid() 또는 컴포넌트 API 등 직접 호출한 의존에서 발생한 오류를 잡거나 완료된 앞 단계 상태를 되돌리지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
