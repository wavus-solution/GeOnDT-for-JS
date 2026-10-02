# UGroup 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`UGroup`은 `THREE.Group`의 장면 그래프 그룹 기능에 객체 동일성 기반 자식·컴포넌트 구성원 관리, 이벤트 디스패치, 순환 자식 선택, 메시 조회와 재질 상태 일괄 변경 기능을 결합한다.

### 1.2 책임 범위

- `add()`, `remove()`, `clear()`, `fastClear()`로 Object3D 자식과 별도 컴포넌트 구성원을 관리한다.
- `getComponents()`는 컴포넌트 목록의 복사본, `getMembers()`는 Object3D 자식 다음에 컴포넌트가 오는 전체 목록의 복사본을 반환한다.
- 컴포넌트는 getVectorPosition()을 제공하고 isObject3D가 아닌 객체이며, 등록 시 렌더 부모·컴포넌트 부모를 변경하지 않는다. 하나의 컴포넌트를 여러 그룹에 독립적으로 등록할 수 있다.
- 공개 add/remove 인자 타입은 Three.js 원본과 동일한 단일 Object3D 인자 선언으로 유지하고, 복수 인자는 arguments로 처리하며, 구현 내부에서 UGroupMember로 선언하여 컴포넌트를 판별한다. 타입 검사 호출부에서 컴포넌트를 직접 넘길 때는 명시적인 타입 단언이 필요하다.
- children/next()/traverse() 및 그룹 변환은 Object3D 자식만 처리한다. getChildren()은 컴포넌트도 포함한 복사본을 반환한다. 컴포넌트는 자동 복제·직렬화하지 않는다.
- 현재 자식 배열을 참조하는 순환 선택기를 통해 자식을 하나씩 반환한다.
- 자식 제거 시 제거 대상과 그룹에 각각 제거 이벤트를 전달한다.
- 하위 메시의 기하 경계 중심을 평균하여 그룹 중심을 계산한다.
- 하위 일반 메시·일반 컴포넌트의 알파 재질을 변경한다. 인스턴스 컴포넌트·메시는 경고하고 건너뛴다. 색상·투명도는 컴포넌트 API에 위임하여 인스턴스별로 적용한다.
- 레이어 이름으로 메시를 조회하거나 일치하는 메시의 geometry, texture와 material을 해제한다.

책임 경계: 일반 `remove()`와 `fastClear()`는 자식의 렌더링 자원을 해제하지 않으며, 자원 해제는 `removeMesh()`가 별도로 수행한다.

### 1.3 주요 동작 방식

모듈 초기화 시 `UEventDispatcher`의 prototype 기능을 결합하고, 생성 시 `THREE.Group`과 `UEventDispatcher`의 인스턴스 상태를 초기화한다. 자식 배열을 참조하는 동적 순환 선택기를 만들고, `WeakSet`으로 `add()`를 통해 등록한 객체의 중복 추가를 막는다.

`remove()`는 직접 자식 배열에서 객체를 찾고, 식별 집합과 배열이 불일치하면 객체 식별자를 비교하는 대체 검색을 수행한다. 실제 제거 시 대상의 `removed` 이벤트와 그룹의 `childremoved` 이벤트를 동기적으로 전달한다.

재질 관련 함수는 직접 자식 또는 전체 하위 트리를 순회하여 alpha map, alpha test, opacity와 color를 변경한다. `removeMesh()`는 하위 트리에서 조건에 맞는 `UMesh` 자원을 직접 해제한 뒤 그룹에서 제거를 시도한다.

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
UGroupCO extends UEventDispatcherCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            생성할 그룹 이름이다.
        drawarg?: UDrawArg
            그룹과 함께 보관할 렌더링 실행 인자다.

UGroup_AlphaMaterial extends THREE.Material 부분 타입 명세
    이 명세에서 사용하는 필드:
        alphaMap?: THREE.Texture | null
        _alphaMap?: THREE.Texture | null
            removeAlphaMap()이 임시 보관한 alpha map이다.
        alphaTest?: number
        _alphaTest?: number | null
            setAlphaTest()가 변경 직전 값을 보관하는 필드다.

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

    #iterator: DynamicCycler<Object3D> | undefined = undefined
        생성 시점의 children 배열 객체를 참조하는 순환 선택기

    _drawArg: UDrawArg | undefined = undefined
        생성 옵션으로 받은 렌더링 실행 인자

    _boundingBox: THREE.Box3 | undefined = undefined
        생성 시 undefined로 초기화되며 현재 활성 UGroup 실행 흐름에서는 갱신되지 않는 시스템 내부 경계 상태

    constructor(opt: UGroupCO = {})
        역할: 장면 그래프 그룹, 이벤트 상태, 자식 식별 집합과 순환 선택기를 초기화한다.
        의존:
            THREE.Group — 그룹 기반 상태 초기화와 생성 옵션 반영; 생성자: {new THREE.Group()}; 속성 읽기: {children}; 속성 쓰기: {name}
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
        동작: 컴포넌트는 #components에서, Object3D는 #idMap에서 객체 동일성을 조회한다.

    override add(object: THREE.Object3D) -> this
        역할: 아직 식별 집합에 없는 객체 하나를 직접 자식으로 추가한다.
        처리 기준:
            object가 falsy이거나 #idMap에 이미 있으면 상태를 변경하지 않는다.
            기반 THREE.Group처럼 가변 인자를 순서대로 처리하며 인수가 없으면 현재 그룹을 반환한다.
            기반 add가 object 추가를 거부하거나 이벤트 listener가 오류를 던져도 이미 완료된 기반 상태 변경은 되돌리지 않는다.
        의존: THREE.Group — 기반 자식 추가; 함수: {add()}
        동작:
            object 또는 등록 여부를 확인하고 추가할 수 없으면 현재 그룹을 반환한다.
            컴포넌트이면 #components Set에 등록한 뒤 componentadded 이벤트({component: object})를 그룹에 전달하고 반환한다. 중복 등록은 이벤트를 발생시키지 않는다.
            Object3D이면 THREE.Group.prototype.add로 object의 기존 부모를 해제하고 현재 그룹의 자식에 추가하도록 요청한다.
            기반 add가 object를 추가하면 object의 added 이벤트와 현재 그룹의 childadded 이벤트가 동기적으로 전달된다.
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
            컴포넌트이면 #components에서 삭제하고 실제 삭제된 경우에만 componentremoved 이벤트({component: object})를 그룹에 전달한 뒤 반환한다. 렌더 객체나 레이어 등록은 변경하지 않는다.
            Object3D이면 children에서 object의 객체 동일성 위치를 찾는다.
            직접 위치가 없지만 #idMap에 등록되어 있으면 오류 코드 7517757을 기록하고 각 자식과 object의 getId() 결과가 같은 위치를 찾는다.
            제거 위치를 찾으면 입력 object의 parent를 null로 바꾸고 children에서 찾은 위치의 객체를 제거한다. [확인 Q-005]
            입력 object가 dispatchEvent()를 제공하면 모듈 공용 removed 이벤트를 전달한다.
            모듈 공용 childremoved 이벤트의 child에 입력 object를 넣어 현재 그룹에서 전달한 뒤 child를 null로 되돌린다. [확인 Q-004]
            입력 object를 #idMap에서 삭제하고 현재 그룹을 반환한다.

    getComponents() -> Array<UGroupComponent>
        등록 순서의 컴포넌트 목록 복사본을 반환한다.

    getMembers() -> Array<UGroupMember>
        직접 자식 다음에 등록 컴포넌트를 나열한 복사본을 반환한다. 하위 그룹은 펼치지 않는다.

    override clear() -> this
        getMembers()의 각 항목을 remove()로 해제하고 현재 그룹을 반환한다. 해제 이벤트를 전달하고 렌더 자원은 보존한다.

    fastClear() -> void
        추가 동작: #components도 비우되 componentremoved 이벤트는 전달하지 않는다.
        역할: 이벤트 전달이나 자원 해제 없이 직접 자식 기록을 빠르게 비운다.
        의존: THREE.Group(this) — 직접 자식 배열 초기화; 속성 쓰기: {children.length}
        동작:
            children 길이를 0으로 바꾼다.
            #idMap을 새 WeakSet으로 교체한다.

    getCenter() -> THREE.Vector3
        그룹의 월드 행렬을 갱신한다. 하위 메시의 geometry boundingBox 중심에 각 메시의 matrixWorld를 적용한다.
        하위 UGroup에 등록된 컴포넌트는 getWorldPosition() 값을 하나의 중심으로 포함한다. 동일 컴포넌트는 한 번만 계산한다.
        유효한 메시 중심과 컴포넌트 위치를 평균한다. 빈 그룹 또는 유효한 중심이 없으면 (0, 0, 0)을 반환한다.

    getChildren() -> Array<UGroupMember>
        직접 Object3D 자식 다음에 등록 컴포넌트를 나열한 목록 복사본을 반환한다. 하위 그룹은 펼치지 않는다.
        반환 배열을 변경해도 등록 상태는 변경되지 않는다. 렌더 자식만 필요하면 children을 사용한다.

    getParent(component?: UGroupComponent) -> THREE.Object3D | undefined
        인자가 없으면 그룹의 장면 그래프 부모 또는 undefined를 반환한다.
        컴포넌트를 전달하면 현재 그룹의 직접 구성원일 때 this를, 아니면 undefined를 반환한다.
        컴포넌트의 기존 부모와 다른 그룹의 등록 상태는 변경하지 않는다.

    removeAlphaMap() -> void
        하위 일반 메시 및 일반 컴포넌트의 단일·배열 material을 순회한다.
        alphaMap을 _alphaMap에 한 번 보관하고 null로 바꾼다. 텍스처를 해제하지 않는다.

    resetAlphaMap() -> void
        같은 범위의 material에 보관된 _alphaMap이 있으면 복원하고 보관 참조를 null로 바꾼다.

    setAlphaTest(alphaFilter: number) -> void
        undefined/null 입력은 console.error 후 종료한다.
        같은 범위의 material의 alphaTest를 변경하며 최초 값을 _groupAlphaTest에 보관한다.
        Three.js 내부 _alphaTest와 백업을 분리한다. 원복 함수는 제공하지 않는다.

    알파 재질 공통 처리
        인스턴스 컴포넌트는 getInstanced()로 확인하여 공유 렌더 객체를 순회하기 전에 건너뛴다.
        isInstancedMesh/isInstancedMesh2인 직접 메시도 건너뛴다.
        건너뛴 인스턴스마다 함수명과 대상 객체를 포함한 console.warn을 한 번 출력한다.
        같은 컴포넌트·재질은 호출당 한 번만 처리하며 변경한 material.needsUpdate를 true로 설정한다.

    getMesh(layername?: string) -> UMesh | THREE.Object3D | undefined
        역할: 레이어 이름과 일치하는 직접 UMesh 또는 첫 직접 자식을 조회한다.
        의존:
            THREE.Group(this) — 직접 자식 순서 조회; 속성 읽기: {children}
            defined — layername과 children 존재 확인; 함수: {defined()}
            UMesh — 레이어 이름 검색 대상 판정; 생성자: {UMesh}; 속성 읽기: {_ulayername}
        동작:
            layername이 정의되면 children을 앞에서부터 순회하여 UMesh이면서 _ulayername이 같은 첫 대상을 반환한다.
            layername이 정의되지 않으면 첫 직접 자식이 있을 때 해당 자식을 반환한다.
            대상을 찾지 못하면 undefined를 반환한다.

    removeMesh(layername?: string) -> boolean
        역할: 하위 트리에서 레이어 이름 조건에 맞는 UMesh의 렌더링 자원을 해제하고 현재 그룹에서 제거를 시도한다.
        처리 기준:
            layername을 생략하면 순회 중 만난 모든 UMesh가 대상 조건을 충족한다.
            대상은 단일 material과 map을 가지며 geometry, map과 material이 각각 dispose()를 제공해야 한다.
            material.map 하나만 texture 해제 대상으로 취급하며 UMesh.dispose()와 다른 texture 해제는 호출하지 않는다.
            자원 해제 중 발생한 오류는 호출자에게 전달한다.
        의존:
            THREE.Object3D(this) — 현재 그룹과 하위 객체 순회; 함수: {traverse()}
            UMesh — 해제 대상과 레이어 이름 판정 및 자원 참조 해제; 생성자: {UMesh}; 속성 읽기: {_ulayername}; 속성 읽기·쓰기: {geometry, material}
            THREE.BufferGeometry — 메시 geometry 해제; 함수: {dispose()}
            THREE.Texture — material map 해제; 함수: {dispose()}
            THREE.Material — map 참조와 material 해제; 함수: {dispose()}; 속성 읽기·쓰기: {map}
            defined — children과 layername 존재 확인; 함수: {defined()}
        동작:
            children이 정의되어 있으면 현재 그룹의 전체 하위 트리를 순회한다.
            각 UMesh에서 layername이 없거나 _ulayername이 같으면 geometry를 dispose하고 geometry 참조를 undefined로 바꾼다.
            대상 material.map을 dispose하고 map 참조를 undefined로 바꾼다.
            대상 material을 dispose하고 material 참조를 undefined로 바꾼다.
            현재 그룹의 remove(mesh)로 대상을 직접 자식에서 제거하도록 순회 callback에 맡긴다.
            순회 callback의 true 결과와 관계없이 함수 끝에서 false를 반환한다. [확인 Q-002]

    setOpacity(opacity: number) -> void
        하위 메시의 단일·배열 material의 opacity를 입력값으로, transparent를 opacity < 1로 설정한다.
        하위 UGroup의 등록 컴포넌트는 중복 없이 setOpacity(opacity)에 위임한다. 인스턴스의 공유 재질을 직접 변경하지 않는다.

    setColor(color: THREE.ColorRepresentation) -> void
        하위 메시의 단일·배열 material 중 color가 있는 재질의 색상을 설정한다.
        하위 UGroup의 등록 컴포넌트는 중복 없이 setColor(color)에 위임한다. 인스턴스의 공유 재질을 직접 변경하지 않는다.

    getId(object: THREE.Object3D & Partial<{ getUid: () -> string | number | undefined, _uuid: string | number, _id: string | number }>) -> string | number | undefined
        역할: 자식 배열 불일치 복구 검색에 사용할 객체 식별자를 조회한다.
        의존:
            식별 가능 THREE.Object3D(object) — 사용자 식별자 또는 대체 식별자 조회; 함수: {getUid()}; 속성 읽기: {uuid, _uuid, _id}
            defined — getUid 존재 확인; 함수: {defined()}
        동작:
            object.getUid가 정의되어 있으면 호출 결과를 반환한다.
            아니면 object.uuid, object._uuid, object._id 중 첫 truthy 값을 반환한다.

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
UGroup이 정의한 동작은 동기적으로 실행되며 listener, getUid() 또는 dispose() 등 직접 호출한 의존에서 발생한 오류를 잡거나 완료된 앞 단계 상태를 되돌리지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
