# UGroup 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`UGroup`은 `THREE.Group`의 장면 그래프 그룹 기능에 객체 동일성 기반 자식 관리, 이벤트 디스패치, 순환 자식 선택, 메시 조회와 재질 상태 일괄 변경 기능을 결합한다.

### 1.2 책임 범위

- `add()`, `remove()`와 `fastClear()`로 직접 자식 배열과 객체 식별 집합을 관리한다.
- 현재 자식 배열을 참조하는 순환 선택기를 통해 자식을 하나씩 반환한다.
- 자식 제거 시 제거 대상과 그룹에 각각 제거 이벤트를 전달한다.
- 하위 메시의 기하 경계 중심을 평균하여 그룹 중심을 계산한다.
- 직접 자식의 alpha map과 alpha test를 변경하고, 전체 하위 트리 메시의 opacity와 color를 변경한다.
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

    has(object: THREE.Object3D) -> boolean
        역할: 객체가 add()를 통해 현재 그룹의 식별 집합에 등록되었는지 확인한다.
        동작: #idMap의 객체 동일성 조회 결과를 반환한다.

    override add(object: THREE.Object3D) -> this
        역할: 아직 식별 집합에 없는 객체 하나를 직접 자식으로 추가한다.
        처리 기준:
            object가 falsy이거나 #idMap에 이미 있으면 상태를 변경하지 않는다.
            기반 THREE.Group의 가변 인자 add 인터페이스와 달리 첫 번째 object 하나만 처리한다.
            기반 add가 object 추가를 거부하거나 이벤트 listener가 오류를 던져도 이미 완료된 기반 상태 변경은 되돌리지 않는다.
        의존: THREE.Group — 기반 자식 추가; 함수: {add()}
        동작:
            object 또는 등록 여부를 확인하고 추가할 수 없으면 현재 그룹을 반환한다.
            THREE.Group.prototype.add로 object의 기존 부모를 해제하고 현재 그룹의 자식에 추가하도록 요청한다.
            기반 add가 object를 추가하면 object의 added 이벤트와 현재 그룹의 childadded 이벤트가 동기적으로 전달된다.
            childadded 이벤트 전달 중에는 object가 아직 #idMap에 등록되지 않은 상태다.
            기반 add의 실제 추가 여부와 관계없이 정상 반환한 object를 #idMap에 등록한다. [확인 Q-005]
            현재 그룹을 반환한다.

    override remove(object: THREE.Object3D) -> this
        역할: 입력 객체를 직접 자식과 식별 집합에서 제거하고 제거 이벤트를 전달한다.
        인터페이스: 첫 object 뒤에 추가 객체를 전달하면 익명 arguments 목록을 통해 함께 처리한다.
        처리 기준:
            첫 object가 falsy이면 상태를 변경하지 않는다.
            첫 object가 truthy이고 둘 이상의 인수를 받으면 각 인수를 같은 remove() 처리로 순서대로 제거한다.
            직접 자식 배열과 #idMap이 불일치하면 치명적 오류를 기록하고 식별자 비교로 대체 대상을 찾는다.
        의존:
            __GError__ — 자식 배열과 식별 집합 불일치 기록; 함수: {__GError__()}
            THREE.Group(this) — 직접 자식 위치 조회와 제거; 속성 읽기·쓰기: {children}
            THREE.Object3D(object) — 부모 연결 해제와 removed 이벤트 전달; 함수: {dispatchEvent()}; 속성 쓰기: {parent}
            UEventDispatcher(this) — childremoved 이벤트 전달; 함수: {dispatchEvent()}
        동작:
            인수가 둘 이상이면 각 인수에 remove()를 호출한 뒤 현재 그룹을 반환한다.
            children에서 object의 객체 동일성 위치를 찾는다.
            직접 위치가 없지만 #idMap에 등록되어 있으면 오류 코드 7517757을 기록하고 각 자식과 object의 getId() 결과가 같은 위치를 찾는다.
            제거 위치를 찾으면 입력 object의 parent를 null로 바꾸고 children에서 찾은 위치의 객체를 제거한다. [확인 Q-005]
            입력 object가 dispatchEvent()를 제공하면 모듈 공용 removed 이벤트를 전달한다.
            모듈 공용 childremoved 이벤트의 child에 입력 object를 넣어 현재 그룹에서 전달한 뒤 child를 null로 되돌린다. [확인 Q-004]
            입력 object를 #idMap에서 삭제하고 현재 그룹을 반환한다.

    fastClear() -> void
        역할: 이벤트 전달이나 자원 해제 없이 직접 자식 기록을 빠르게 비운다.
        의존: THREE.Group(this) — 직접 자식 배열 초기화; 속성 쓰기: {children.length}
        동작:
            children 길이를 0으로 바꾼다.
            #idMap을 새 WeakSet으로 교체한다.

    getCenter() -> THREE.Vector3
        역할: 하위 메시 geometry 경계 상자 중심들의 산술 평균을 계산한다.
        인터페이스: geometry.computeBoundingBox()를 호출하므로 각 대상 geometry의 boundingBox를 다시 계산한다.
        의존:
            THREE.Group(this) — 직접 자식 순회; 속성 읽기: {children}
            THREE.Object3D — 직접 자식별 하위 트리 순회와 변환 적용; 함수: {traverse()}; 속성 읽기: {matrixWorld}
            THREE.Mesh — 메시와 geometry 확인; 속성 읽기: {isMesh, geometry}
            THREE.BufferGeometry — geometry 경계 상자 계산과 조회; 함수: {computeBoundingBox()}; 속성 읽기: {boundingBox}
            THREE.Box3 — 경계 상자 복사와 중심 계산; 생성자: {new THREE.Box3()}; 함수: {copy(), getCenter()}
            THREE.Vector3 — 중심 누적, 변환과 평균 계산; 생성자: {new THREE.Vector3()}; 함수: {applyMatrix4(), add(), divideScalar()}
            defined — geometry와 boundingBox 존재 확인; 함수: {defined()}
        동작:
            누적 중심, 재사용 경계 상자, 임시 중심 Vector와 유효 메시 수를 초기화한다.
            각 직접 자식의 하위 트리를 순회한다.
                isMesh가 true이고 geometry가 정의된 대상의 geometry boundingBox를 계산한다.
                계산된 boundingBox가 없으면 대상을 건너뛴다.
                geometry boundingBox 중심을 구하고 현재 직접 자식의 matrixWorld를 적용한다.
                변환한 중심을 누적하고 유효 메시 수를 증가시킨다.
            누적 중심을 유효 메시 수로 나눈 결과를 반환한다. [확인 Q-003]

    getChildren() -> Array<THREE.Object3D>
        역할: 현재 직접 자식 배열을 조회한다.
        인터페이스: 반환된 배열은 내부 children과 같은 가변 배열이다.
        의존: THREE.Group(this) — 직접 자식 배열 조회; 속성 읽기: {children}
        동작: children이 truthy이면 해당 배열을 반환하고, 아니면 새 빈 배열을 반환한다.

    getParent() -> THREE.Object3D | undefined
        역할: 현재 부모 객체를 조회한다.
        의존:
            THREE.Object3D(this) — 부모 객체 조회; 속성 읽기: {parent}
            defined — parent 존재 확인; 함수: {defined()}
        동작: parent가 null 또는 undefined가 아니면 parent를 반환하고, 아니면 undefined를 반환한다.

    직접 자식 alpha 재질 상태 책임 그룹
        역할: 직접 자식의 단일 또는 배열 material에서 alpha map과 alpha test 상태를 변경한다.

        removeAlphaMap() -> void
            의존: defined — material과 alphaMap 존재 확인; 함수: {defined()}
            동작:
                getChildren()으로 현재 직접 자식을 조회한다.
                각 자식에 material이 있으면 단일 material 또는 material 배열을 순회한다.
                alphaMap이 정의된 각 material은 현재 alphaMap을 _alphaMap에 저장하고 alphaMap을 null로 바꾼다.

        resetAlphaMap() -> void
            의존: defined — material과 임시 alphaMap 존재 확인; 함수: {defined()}
            동작:
                getChildren()으로 현재 직접 자식을 조회한다.
                각 자식에 material이 있으면 단일 material 또는 material 배열을 순회한다.
                _alphaMap이 정의된 각 material은 alphaMap에 _alphaMap을 복원하고 _alphaMap을 null로 바꾼다.

        setAlphaTest(alphaFilter: number) -> void
            처리 기준: alphaFilter가 null 또는 undefined이면 오류를 출력하고 재질을 변경하지 않는다.
            의존:
                defined — 입력, material과 alphaTest 존재 확인; 함수: {defined()}
                Web API console — 미정의 입력 오류 출력; 함수: {error()}
            동작:
                getChildren()으로 현재 직접 자식을 조회한다.
                각 자식에 material이 있으면 단일 material 또는 material 배열을 순회한다.
                alphaTest가 정의된 각 material은 현재 alphaTest를 _alphaTest에 저장하고 alphaTest를 alphaFilter로 바꾼다.

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
        역할: 전체 하위 트리의 THREE.Mesh 재질을 투명 처리하고 opacity를 변경한다.
        의존:
            THREE.Object3D(this) — 전체 하위 객체 순회; 함수: {traverse()}
            THREE.Mesh — 변경 대상 판정과 material 접근; 생성자: {THREE.Mesh}; 속성 읽기: {material}
            THREE.Material — 투명도 상태 변경; 속성 쓰기: {transparent, opacity}
        동작: 현재 그룹과 하위 객체를 순회하여 각 THREE.Mesh의 material.transparent를 true, material.opacity를 입력값으로 바꾼다.

    setColor(color: THREE.ColorRepresentation) -> void
        역할: 전체 하위 트리의 THREE.Mesh 재질 색상을 변경한다.
        의존:
            THREE.Object3D(this) — 전체 하위 객체 순회; 함수: {traverse()}
            THREE.Mesh — 변경 대상 판정과 material 접근; 생성자: {THREE.Mesh}; 속성 읽기: {material}
            THREE.Color — 입력 색상 변환; 생성자: {new THREE.Color()}
            THREE.Material — 재질 색상 변경; 속성 쓰기: {color}
        동작: 현재 그룹과 하위 객체를 순회하여 각 THREE.Mesh의 material.color에 입력값으로 생성한 새 THREE.Color를 저장한다.

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
getChildren(), children 또는 상속한 attach()로 자식을 직접 변경하면 #idMap, parent 연결과 제거 이벤트가 같은 경로로 갱신되지 않는다.
add()에 현재 그룹 자신을 입력하면 기반 add는 자식 추가를 거부하지만 #idMap은 현재 그룹을 등록한다. [확인 Q-005]
add()와 remove()는 자식의 geometry, texture 또는 material을 해제하지 않는다.
fastClear()는 자식의 parent 연결을 끊거나 removed 및 childremoved 이벤트를 전달하지 않으며 렌더링 자원도 해제하지 않는다.
fastClear()는 #iterator를 다시 만들지 않으므로 DynamicCycler의 내부 위치는 유지되고 같은 children 배열의 변경된 길이를 사용한다.
#iterator는 생성 당시 children 배열 객체를 계속 참조하므로 children의 원소 변경은 반영하지만 children 속성에 새 배열을 대입하면 next()는 교체 전 배열을 계속 사용한다.
removeAlphaMap(), resetAlphaMap(), setAlphaTest()는 직접 자식만 처리하고 하위 자손을 순회하지 않는다.
removeAlphaMap()은 alphaMap texture를 dispose하지 않고 _alphaMap으로 참조만 옮기며 resetAlphaMap()은 해당 참조를 alphaMap으로 복원한다.
setOpacity()와 setColor()는 하위 자손까지 순회하지만 배열 material을 개별 material로 펼치지 않는다.
재질 변경 함수는 material.needsUpdate를 변경하지 않는다.
setAlphaTest()는 이전 alphaTest를 _alphaTest에 저장하지만 UGroup은 이를 복원하는 함수를 제공하지 않는다.
자식 추가·제거 이벤트 listener가 오류를 던지면 오류는 호출자에게 전달되고, 이벤트 전달 뒤에 예정된 #idMap 갱신이나 공용 이벤트 객체 초기화는 실행되지 않을 수 있다.
UGroup의 이벤트 등록·해제·전달은 THREE.EventDispatcher에서 상속한 구현이 아니라 모듈 초기화에서 결합한 UEventDispatcher 구현을 따른다.
UGroup이 정의한 동작은 동기적으로 실행되며 listener, getUid() 또는 dispose() 등 직접 호출한 의존에서 발생한 오류를 잡거나 완료된 앞 단계 상태를 되돌리지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
