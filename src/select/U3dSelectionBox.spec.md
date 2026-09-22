# U3dSelectionBox 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dSelectionBox`는 three.js 예제 `SelectionBox`를 확장하여, 마우스 드래그로 그린 화면 상자를 카메라 절두체로 바꾸고 그 안에 들어오는 mesh와 인스턴스 메시의 개별 인스턴스를 찾는 판정기다. 박스 선택 모드의 `U3dSelect`가 포인터 이벤트마다 이 객체에 좌표를 넘기고 결과를 받아 실제 선택 객체로 변환한다.

### 1.2 책임 범위

- 포인터 이벤트의 정규화 좌표(NDC)를 시작점·끝점으로 보관하고, 같은 좌표를 `U3dSelect`가 작업 정보(`work.points`)로 다시 읽을 수 있게 별도 보관한다.
- 포인터 이동·종료 시 기반 `select()`를 실행하여 상자 안의 일반 객체 목록과 인스턴스 메시별 인스턴스 ID 목록을 돌려준다.
- 기반 `searchChildInFrustum()`을 재정의하여 절두체 판정을 점(bounding sphere 중심) 대신 월드 변환한 bounding box 교차로 수행하고, 인스턴스 메시는 `InstancedMesh2`의 `instances` 엔티티 배열을 기준으로 개별 인스턴스를 검사한다.
- 렌더러 캔버스 위에 드래그 상자를 그리는 DOM helper(`USelectionHelper`)를 만들고 해제한다.
- 책임 경계: 포인터 이벤트 등록·해제, 지도 조작 잠금, 검사 대상 scene 수집과 결과를 컴포넌트·하이라이트로 바꾸는 일은 `U3dSelect`가 담당한다.

### 1.3 주요 동작 방식

`U3dSelect.#setSelectBoxMode()`가 카메라와 대상 레이어 scene을 묶은 그룹으로 이 객체를 만들고 `setHelper(renderer)`로 상자 DOM helper를 붙인다. 앱의 `mousedown`·`mousemove`·`mouseup` 이벤트가 오면 `pointerDown()`·`pointerMove()`·`pointerUp()`이 `U3dMouseEvent`의 NDC 좌표를 시작점·끝점에 기록한다. 이동·종료 시 시작점과 끝점의 x 또는 y가 같으면 절두체가 무효하므로 검색을 건너뛰고 빈 객체 목록을 만들며, 그 외에는 기반 `select()`가 절두체를 갱신하고 `searchChildInFrustum()`으로 scene을 재귀 순회한다. 재정의한 순회는 mesh·line·points를 bounding box 교차로 판정하고, 인스턴스 메시는 `instances` 배열의 보이는 엔티티마다 인스턴스 행렬을 적용한 bounding box로 판정하여 `instances[uuid]`에 인스턴스 ID를 모은다. `USelectionHelper`는 렌더러 캔버스의 `pointerdown`·`pointermove`·`pointerup`으로 상자 div를 캔버스 부모 요소에 그리고 지운다.

인스턴스 메시 중 `instances` 배열이 없는 메시(`InstancedMesh2.addLOD()`가 만든 하위 LOD 메시처럼 상위 메시의 인스턴스를 공유해 그리기만 하는 메시)는 인스턴스 판정을 건너뛰고 자식 순회만 계속한다.

### 1.4 주요 사용처와 연계 대상

- `U3dSelect`(`union3d/select/U3dSelect.js`): 박스 선택 모드에서 생성·이벤트 전달·`setScene()`·`getStartPointNormalized()`·`getEndPointNormalized()`·`dispose()`를 사용하는 유일한 저장소 내 호출자다.
- `SelectionBox`·`SelectionHelper`(`union3d/lib/three/interactive/`): 절두체 계산과 상자 DOM 표시의 기반 구현이다.
- `U3dMouseEvent`(`union3d/event/U3dMouseEvent.js`): 앱 이벤트가 전달하는 NDC 좌표의 소유자다.

## 3. 정규 자연어 수도코드

```spec
U3dSelectionBox extends SelectionBox 클래스 정의
    역할: 화면 상자 절두체 안의 객체·인스턴스를 찾는 판정기이며 export된다.

    helperDomName: string = 'selectBox'
        setHelper()가 만드는 상자 div의 CSS 클래스 이름

    mouseEvent: {startPoint: {normalizedX: number|undefined, normalizedY: number|undefined}, endPoint: {normalizedX: number|undefined, normalizedY: number|undefined}}
        U3dSelect가 작업 정보(work.points)로 읽는 시작·끝 NDC 좌표 보관소이며 기반 startPoint·endPoint와 별도로 유지한다.

    helper: USelectionHelper|undefined
        setHelper()가 만드는 상자 DOM helper. 만들기 전에는 undefined다.

    scene: Object3D
        기반 SelectionBox가 검색 루트로 사용하는 객체이며 setScene()이 교체한다.

    camera: Camera
        기반 SelectionBox가 절두체 계산에 사용하는 카메라이며 setCamera()가 교체한다.

    constructor(camera: Camera, scene: Object3D, deep: number = Number.MAX_VALUE, helperDomName: string = 'selectBox')
        인터페이스:
            camera: 절두체를 만들 카메라
            scene: 검색 루트. U3dSelect는 대상 레이어 scene들을 자식으로 넣은 UGroup을 전달한다.
            deep: 절두체 원거리 평면까지의 거리(월드 단위)
            helperDomName: 상자 div의 CSS 클래스 이름
        의존: SelectionBox — 절두체 검색 기반; 상속: {constructor}
        동작:
            기반 생성자에 camera, scene, deep을 전달하여 startPoint, endPoint, collection, instances를 초기화한다.
            helperDomName을 저장하고 mouseEvent의 시작·끝 좌표를 undefined로 초기화한다.

    포인터 좌표 반영 책임 그룹
        역할: 앱 mouse 이벤트의 NDC 좌표를 시작점·끝점과 mouseEvent에 기록하고, 이동·종료 시 절두체 검색 결과를 만든다.

        pointerDown(event: U3dMouseEvent|MouseEvent) -> void
            인터페이스: event: isU3dMouseEvent가 true이면 normalizedX·normalizedY를 그대로 사용하고, 그 외에는 DOM 이벤트로 보고 정규화한다.
            처리 기준:
                이벤트의 종류(isU3dMouseEvent)만 판정하며 helper 상태나 버튼은 확인하지 않는다.
                DOM 이벤트 경로는 U3dMouseEvent.computeNormalize()의 반환 키(x, y)가 아니라 normalizedX·normalizedY를 읽으므로 좌표가 undefined가 된다. [확인 Q-002]
            의존:
                U3dMouseEvent — 화면 픽셀→NDC 변환; 정적 함수: {computeNormalize()}; 속성 읽기: {isU3dMouseEvent, normalizedX, normalizedY}
                SelectionBox — 시작점 보관; 속성 쓰기: {startPoint}
            동작:
                이벤트 종류에 따라 NDC 좌표를 얻는다.
                기반 startPoint를 (normalizedX, normalizedY, 0.5)로 설정한다.
                mouseEvent.startPoint에 같은 NDC 좌표를 기록한다.

        pointerMove(event: U3dMouseEvent|MouseEvent) -> {instances: Record<string, Array<number>>, objects: Array<Object3D>}|undefined
            인터페이스:
                event: pointerDown과 같은 종류 판정을 적용한다.
                반환: helper가 드래그 중(isDown)이면 인스턴스 메시 uuid별 인스턴스 ID 목록과 상자 안 일반 객체 목록, 드래그 중이 아니면 undefined
            처리 기준:
                helper를 null 확인 없이 읽으므로 setHelper() 전에 호출하면 TypeError로 종료한다.
                DOM 이벤트 경로의 좌표 undefined 문제는 pointerDown과 같다. [확인 Q-002]
            의존:
                U3dMouseEvent — 화면 픽셀→NDC 변환; 정적 함수: {computeNormalize()}; 속성 읽기: {isU3dMouseEvent, normalizedX, normalizedY}
                SelectionBox — 절두체 갱신과 재귀 검색; 함수: {select()}; 속성 읽기·쓰기: {startPoint, endPoint, instances}
                SelectionHelper(helper) — 드래그 진행 여부; 속성 읽기: {helper.isDown}
            동작:
                이벤트 종류에 따라 NDC 좌표를 얻는다.
                helper.isDown이 false이면 아무것도 바꾸지 않고 undefined를 반환한다.
                기반 endPoint를 (normalizedX, normalizedY, 0.5)로 설정한다.
                startPoint와 endPoint의 x 또는 y가 같으면 절두체가 무효하므로 검색하지 않고 objects를 빈 배열로 둔다.
                그렇지 않으면 기반 select()를 실행한다. select()는 절두체를 갱신한 뒤 재정의한 searchChildInFrustum()으로 scene을 순회하며, 그 결과 collection을 objects로 받는다.
                mouseEvent.endPoint에 NDC 좌표를 기록한다.
                기반 instances와 objects를 반환한다. 좌표가 같아 검색을 건너뛴 경우 instances는 비우지 않은 이전 검색 결과다. [확인 Q-003]

        pointerUp(event: U3dMouseEvent|MouseEvent) -> {instances: Record<string, Array<number>>, objects: Array<Object3D>}
            인터페이스:
                event: pointerDown과 같은 종류 판정을 적용한다.
                반환: 인스턴스 메시 uuid별 인스턴스 ID 목록과 상자 안 일반 객체 목록
            처리 기준:
                helper.isDown을 확인하지 않고 항상 검색하므로 드래그 없이 mouseup만 와도 결과를 만든다.
                DOM 이벤트 경로의 좌표 undefined 문제는 pointerDown과 같다. [확인 Q-002]
            의존:
                U3dMouseEvent — 화면 픽셀→NDC 변환; 정적 함수: {computeNormalize()}; 속성 읽기: {isU3dMouseEvent, normalizedX, normalizedY}
                SelectionBox — 절두체 갱신과 재귀 검색; 함수: {select()}; 속성 읽기·쓰기: {startPoint, endPoint, instances}
            동작:
                이벤트 종류에 따라 NDC 좌표를 얻어 기반 endPoint를 (normalizedX, normalizedY, 0.5)로 설정한다.
                startPoint와 endPoint의 x 또는 y가 같으면 검색하지 않고 objects를 빈 배열로 둔다.
                그렇지 않으면 기반 select()를 실행한다. select()는 절두체를 갱신한 뒤 재정의한 searchChildInFrustum()으로 scene을 순회하며, 그 결과 collection을 objects로 받는다.
                mouseEvent.endPoint에 NDC 좌표를 기록한다.
                기반 instances와 objects를 반환한다. 좌표가 같아 검색을 건너뛴 경우 instances는 비우지 않은 이전 검색 결과다. [확인 Q-003]

    좌표 조회 책임 그룹
        역할: 기반 좌표(Vector3)와 U3dSelect용 NDC 보관값을 그대로 돌려준다.

        getStartPoint() -> Vector3
            인터페이스: 반환: 기반 startPoint 참조
            의존: SelectionBox — 시작점 참조; 속성 읽기: {startPoint}
            동작: 기반 startPoint 속성을 반환한다.

        getEndPoint() -> Vector3
            인터페이스: 반환: 기반 endPoint 참조
            의존: SelectionBox — 끝점 참조; 속성 읽기: {endPoint}
            동작: 기반 endPoint 속성을 반환한다.

        getStartPointNormalized() -> {normalizedX: number|undefined, normalizedY: number|undefined}
            인터페이스: 반환: mouseEvent.startPoint 참조. U3dSelect가 work.points의 첫 항목으로 사용한다.
            동작: mouseEvent.startPoint를 반환한다.

        getEndPointNormalized() -> {normalizedX: number|undefined, normalizedY: number|undefined}
            인터페이스: 반환: mouseEvent.endPoint 참조. U3dSelect가 work.points의 둘째 항목으로 사용한다.
            동작: mouseEvent.endPoint를 반환한다.

    검색 대상 교체 책임 그룹
        역할: 이미 만든 판정기의 검색 루트와 카메라를 바꾼다.

        setScene(scene: Object3D) -> void
            인터페이스: scene: 새 검색 루트. U3dSelect는 박스 모드를 다시 켤 때 새 대상 scene 그룹을 전달한다.
            의존: SelectionBox — 검색 루트 보관; 속성 쓰기: {scene}
            동작: 기반 scene 속성을 교체한다. 이전 검색 결과(collection, instances)는 지우지 않는다.

        setCamera(camera: Camera) -> void
            인터페이스: camera: 새 절두체 계산 카메라
            의존: SelectionBox — 절두체 카메라 보관; 속성 쓰기: {camera}
            동작: 기반 camera 속성을 교체한다.

    setHelper(renderer: WebGLRenderer) -> void
        인터페이스: renderer: 상자 div를 붙일 캔버스(domElement)의 소유 렌더러
        처리 기준: 기존 helper가 있어도 해제하지 않고 새 helper로 덮어쓰므로 이전 helper의 캔버스 리스너가 남는다. U3dSelect는 박스 모드 진입마다 새 U3dSelectionBox를 만들어 한 번만 호출한다.
        의존: SelectionHelper(helper) — 상자 DOM helper 생성 결과 보관(기반 SelectionHelper 파생 객체); 속성 쓰기: {helper}
        동작:
            renderer와 helperDomName으로 USelectionHelper를 만들어 helper에 보관한다.

    dispose() -> void
        처리 기준: helper가 없으면 아무것도 하지 않는다. 기반 collection·instances는 정리하지 않는다.
        의존: SelectionHelper(helper) — 캔버스 pointer 리스너 해제와 상자 제거; 함수: {helper.dispose(), helper.onSelectOver()}; 속성 읽기: {helper.element}
        동작:
            helper가 있고 상자 div(helper.element)가 아직 문서에 붙어 있으면 helper.onSelectOver()로 상자를 제거한다. 실제 실행은 USelectionHelper가 재정의한 onSelectOver()다.
            helper.dispose()로 캔버스 pointer 리스너를 해제한다. helper 참조 자체는 남긴다.

    override searchChildInFrustum(frustum: Frustum, object: Object3D) -> void
        역할: 기반 구현(bounding sphere 중심점 포함 판정, count 기반 인스턴스 순회)을 bounding box 교차 판정과 InstancedMesh2 엔티티 기반 인스턴스 순회로 바꾸고, 엔티티 배열이 없는 하위 LOD 메시는 건너뛴다.
        인터페이스:
            frustum: 기반 select()가 갱신한 상자 절두체
            object: 현재 순회 객체. 결과는 기반 collection(일반 객체)과 instances(uuid → 인스턴스 ID 배열)에 누적된다.
        처리 기준:
            isMesh·isLine·isPoints 중 하나인 객체만 판정하고 geometry가 없으면 그 객체와 그 자식 전체를 건너뛴다.
            판정 뒤 children이 있으면 자식마다 재귀하므로 그룹·scene 자체는 판정하지 않고 통과한다.
            인스턴스 메시의 instances가 배열이 아니면(InstancedMesh2.addLOD()가 만든 하위 LOD 메시, createEntities가 false인 메시) 인스턴스 판정과 instances[uuid] 등록을 건너뛴다. 하위 LOD 메시의 인스턴스는 상위 메시 순회에서 이미 판정되므로 결과가 줄지 않는다.
        의존:
            SelectionBox — 검색 결과 저장소; 속성 읽기·쓰기: {instances, collection}
            Frustum — 절두체 교차 판정; 함수: {intersectsBox()}
            InstancedMesh2 — 인스턴스 메시 판정 대상; 함수: {getMatrixAt()}; 속성 읽기: {isInstancedMesh, instances, uuid, geometry}
            InstancedEntity — 인스턴스 가시성·ID; 속성 읽기: {visible, id}
            Object3D — 순회 대상; 속성 읽기: {isMesh, isLine, isPoints, geometry, matrixWorld, children}
            BufferGeometry — 경계 상자; 함수: {computeBoundingBox()}; 속성 읽기: {boundingBox}
        동작:
            객체가 isMesh·isLine·isPoints 중 하나이면 판정을 시작하고, geometry가 없으면 여기서 반환한다.
            객체가 isInstancedMesh이면 object.instances가 배열인지 판정한다.
                배열이면 geometry.boundingBox가 없을 때 computeBoundingBox()로 만들고 이를 공통 상자로 사용한다.
                instances[object.uuid]를 빈 배열로 초기화한다.
                각 엔티티에 대해 visible이 false이면 건너뛰고, 그 외에는 getMatrixAt(id)로 얻은 인스턴스 행렬을 공통 상자에 적용한 뒤 절두체와 교차하면 인스턴스 ID를 instances[object.uuid]에 추가한다.
                배열이 아니면(하위 LOD 메시) 인스턴스 판정과 instances[uuid] 등록을 하지 않는다.
            인스턴스 메시가 아니면
                geometry.boundingBox가 없으면 computeBoundingBox()로 만든다.
                boundingBox에 matrixWorld를 적용한 상자가 절두체와 교차하면 객체를 collection에 추가한다.
            판정 여부와 관계없이 children이 있으면 각 자식에 대해 같은 검사를 재귀한다.

USelectionHelper extends SelectionHelper 클래스 정의
    역할: 렌더러 캔버스의 pointer 이벤트로 드래그 상자 div를 그리는 기반 helper에, 상자가 문서에 없을 때의 제거 예외만 막는 모듈 내부 파생 클래스다. export되지 않는다.

    USelectionHelper.constructor(renderer: WebGLRenderer, cssClassName: string = 'selectBox')
        인터페이스:
            renderer: domElement에 pointerdown·pointermove·pointerup 리스너를 거는 렌더러
            cssClassName: 상자 div에 붙일 CSS 클래스
        의존: SelectionHelper — 상자 div 생성과 캔버스 pointer 리스너 등록; 상속: {constructor}
        동작: 기반 생성자에 renderer와 cssClassName을 그대로 전달한다.

    override onSelectOver() -> void
        역할: 상자 div 제거 시 부모가 없을 때의 예외를 막는다.
        처리 기준: 시작점과 끝점이 다른 div에서 발생하여 상자가 아직 붙지 않았거나 이미 제거된 경우 아무것도 하지 않는다.
        의존: SelectionHelper — 상자 div 제거; 함수: {onSelectOver()}; 속성 읽기: {element}
        동작: element.parentElement가 있을 때만 기반 onSelectOver()로 상자 div를 부모에서 제거한다.
```

## 4. 공통 처리 기준과 제약

```spec
- 시작점·끝점은 캔버스 기준 NDC(-1~1) 좌표이며 z는 항상 0.5다. 화면 픽셀 좌표는 이 객체가 보관하지 않는다.
- 이동·종료 시 시작점과 끝점의 x 또는 y가 같으면 절두체 평면이 퇴화하므로 기반 select()를 호출하지 않고 객체 목록을 빈 배열로 만든다.
- 절두체 판정 기준은 bounding sphere 중심점이 아니라 월드(또는 인스턴스) 변환한 bounding box와 절두체의 교차이므로, 상자에 일부만 걸친 객체도 선택 후보가 된다.
- 인스턴스 메시의 결과는 instances[uuid]에 InstancedEntity.id(인스턴스 인덱스) 배열로 누적되며, U3dSelect가 컴포넌트의 instanceId와 대조하여 실제 선택 객체로 바꾼다.
- 모듈 상수 _box3·_matrix는 검색 중 재사용하는 임시 객체이며 반환값에 노출되지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
