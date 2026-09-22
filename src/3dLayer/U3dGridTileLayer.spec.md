# U3dGridTileLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dGridTileLayer`는 타일 경계와 격자 설정을 받아 일정 간격으로 상자 테두리를 배치하는 `U3dModelLayer`의 파생 레이어다. 격자는 타일 키별 그룹으로 보관하며 레이어의 장면 그룹에 등록한다.

### 1.2 책임 범위

- 격자 높이·간격·최소 레벨·색상·투명도와 생성 허용 여부를 관리한다.
- 격자 생성 조건·그룹 등록·캐시·제거는 일반 소스에서 제어하며, 인덱스 계산과 상자 구성·배치는 비공개 구현으로 분리한다.
- 책임 경계: 앱 연결·기반 레이어 표시·기반 모델 타일 판정은 `U3dModelLayer`에 위임한다. 상자 geometry·재질 공유는 `UBox3Helper`가 담당한다.

### 1.3 주요 동작 방식

생성자는 기반 레이어를 초기화하고 격자 설정 및 전용 캐시를 만든다. 타일 생성 요청은 기반 모델 판정을 먼저 호출한 뒤 격자 자체의 가시성·레벨·중복 조건을 검사한다. 격자 인덱스 범위를 순회하여 상자를 추가하고 완성한 그룹을 캐시와 장면에 연결한다.

설정의 직접 대입과 명시적 설정 메서드는 입력 변환·재생성 여부가 다르다. `refresh()`는 현재 타일 캐시와 격자 캐시에 모두 있는 타일만 다시 만들며, 프레임 `update()`는 빈 구현이다.

### 1.4 주요 사용처와 연계 대상

- `union3d/app/GeOnDT.js`가 `GeOnDT.model.U3dGridTileLayer`로 공개한다.
- `union3d/app/U3dApp.js`의 `createGridTileLayer()`가 앱·렌더 컨텍스트를 옵션에 넣고 생성·등록한다.
- `tutorial-official/gridTile.html`이 직접 생성, 표시 전환 및 격자 크기·높이 변경을 예시로 제공한다.
- `UCache`는 타일 키별 격자 그룹을, `UBox3HelperGroup`과 `UBox3Helper`는 상자 목록 및 공유 렌더 자원을 제공한다.

## 2. 요구사항과 품질 기준

```spec
격자 생성은 타일 경계와 최소 레벨, 격자 생성 허용 상태 및 동일 타일 키의 기존 캐시 여부를 반영해야 한다.
설정 대입, 설정 메서드, 일괄 설정의 입력 변환·재생성·조기 종료 차이를 구분할 수 있어야 한다.
타일별 제거와 전체 제거는 각각의 캐시·장면 연결 및 자원 해제 순서를 보존해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dGridTileLayerCO_Content 타입 정의
    showGridTile?: boolean = true
        격자 생성 허용 여부다. 기반 레이어의 표시 상태와 별도 필드다.
    height?: number = 100
        상자 높이 계산에 사용하는 값이다. 실제 상자 범위는 INTERNAL.populateGrid에 기술한다.
    size?: number = 50
        x·y 격자 중심 사이의 간격이자 상자 경계 계산에 사용하는 값이다.
    minlevel?: number = 17
        생성 가능한 타일의 최소 _rlevel이다.
    gridColor?: number = 0xffffff
        격자 색상이다.
    gridOpacity?: number = 0.3
        격자 재질의 opacity 값이다. 1 미만인지에 따라 transparent를 정한다.

U3dGridTileLayerCO 타입 정의
    U3dModelLayerCO & U3dGridTileLayerCO_Content 별칭

U3dGridTileBounds 타입 정의
    _minx, _miny, _maxx, _maxy: number
        배치할 타일의 x·y 최소·최대 경계다.

U3dGridTileLayout 타입 정의
    minX, minY: number
        상자 중심 배치의 기준 좌표다.
    tileMinX, tileMaxX: number
        x 순회 시작 인덱스와 포함하지 않는 종료 인덱스다.
    tileMaxY, tileMinY: number
        y 순회 시작 인덱스와 포함하지 않는 종료 인덱스다.

U3dGridTileStyleState 타입 정의
    _gridOpacity: number
        상자를 만들 때마다 다시 읽는 레이어의 불투명도다.
    _boxMaterial: LineBasicMaterial | undefined
        최초 상자 재질 참조를 저장하는 슬롯이다. 전체 레이어의 다른 상태와 메서드는 이 경계에 포함하지 않는다.

U3dGridTileLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 앱·장면·기반 모델 타일 처리; 상속: {U3dModelLayer}

    _showGridTile
        격자 생성 분기에서 읽는 현재 설정값이다. 직접 대입과 설정 메서드로 변경 가능하다.
    _height, _size
        직접 대입은 값을 그대로 저장하고 setHeight·setSize는 Number 변환 후 저장한다.
    _minlevel, _gridColor, _gridOpacity
        현재 생성·스타일 설정값이다. 숫자 범위 보정이나 불변화는 없다.
    _GridConfig: object
        생성 시 여섯 설정값을 같은 이름의 밑줄 필드로 복사한 별도 객체다. getGridTile이 참조를 반환하지만 이후 설정 변경과 자동 동기화되지 않는다. [확인 Q-001]
    _gridCache: UCache
        타일 _key에 대응하는 UBox3HelperGroup을 저장한다.
    _boxMaterial: THREE.LineBasicMaterial | undefined = undefined
        최초로 저장한 상자 재질 참조다. 타일 제거·재생성 시 초기화하지 않으며 helper의 공유 재질일 수 있다. [확인 Q-004]
    _meshMaterial: THREE.MeshBasicMaterial | undefined = undefined
        중복 검사를 통과한 첫 생성에서 만드는 검정 재질이다. 격자 상자에 사용하거나 이 클래스에서 직접 해제하지 않는다. [확인 Q-007]

    constructor(opt: U3dGridTileLayerCO = {})
        인터페이스: 기반 레이어가 설치한 resolve 멤버가 정의되어 있으면 현재 레이어를 인수로 호출한다. 일반 함수의 this는 현재 레이어이며 함수 여부를 별도로 검사하지 않는다.
        처리 기준: 격자 옵션 기본값은 undefined일 때만 적용한다. null·0·false를 일괄 기본값으로 바꾸지 않는다.
        의존:
            U3dModelLayer — 기반 상태 초기화; 생성자: {new U3dModelLayer()}
            UDEF — 모델 레이어 종류 지정; 상수: {LAYER_TYPE.MODEL, PROCESS.TYPE.MODEL}
            defaultValue — 옵션의 undefined 대체; 함수: {defaultValue()}
            defined — 완료 수신자 존재 판정; 함수: {defined()}
            UCache — 격자 캐시 생성; 생성자: {new UCache()}
            UCheckTime — 시간 상태 객체 생성; 생성자: {new UCheckTime()}
            U3dLayer — 상속된 완료 상태 종결; 함수: {resolve()}
        동작:
            opt를 기반 생성자에 전달한 뒤 _type·_tileName을 MODEL 계열로, _className을 U3dGridTileLayer로 설정한다.
            _meshGeometry·_meshMaterial·_boxMaterial을 undefined로 초기화한다.
            여섯 격자 옵션을 읽어 현재 필드에 저장하고 그 값을 _GridConfig의 별도 객체에 복사한다.
            _gridCache와 _checkTime을 생성한다. _checkTime과 _meshGeometry는 이 클래스의 후속 실행에서 사용하지 않는다.
            resolve가 null·undefined가 아니면 resolve(this)를 호출한다. 타일 생성 완료를 기다리는 절차는 없다.

    override refresh() -> void
        처리 기준: _drawArg와 그 _cacheTiles._items가 준비되어 있어야 한다. 이 구현은 해당 경로의 존재를 검사하지 않는다.
        의존:
            U3dLayer — 상속된 렌더 컨텍스트 접근; 속성 읽기: {_drawArg}
            UDrawArg — 현재 타일 캐시 접근; 속성 읽기: {_cacheTiles}
            UCache — 타일 목록과 격자 키 존재 확인; 속성 읽기: {_items}; 함수: {has()}
        동작:
            _drawArg._cacheTiles._items의 값 목록을 조회한다. 기반 refresh는 호출하지 않는다.
            각 타일의 키가 _gridCache에 있을 때만 기존 격자를 먼저 제거하고 해당 타일의 격자를 다시 생성한다. 캐시에 없는 타일을 새로 채우는 전체 재생성은 아니다.

    get showGridTile()
        동작: _showGridTile을 null·undefined 검사 후 그대로 반환한다.
    set showGridTile(value) -> void
        동작: 검사·재생성·기반 표시 변경 없이 _showGridTile에 그대로 대입한다.
    get height()
        동작: _height를 null·undefined 검사 후 그대로 반환한다. Number 변환은 하지 않는다.
    set height(value) -> void
        동작: 검사·숫자 변환·재생성 없이 _height에 대입한다.
    get size()
        동작: _size를 null·undefined 검사 후 그대로 반환한다. Number 변환은 하지 않는다.
    set size(value) -> void
        동작: 검사·숫자 변환·재생성 없이 _size에 대입한다.
    get minlevel()
        동작: _minlevel을 null·undefined 검사 후 그대로 반환한다.
    set minlevel(value) -> void
        동작: 검사·재생성 없이 _minlevel에 대입한다.
    get gridColor()
        동작: _gridColor를 null·undefined 검사 후 그대로 반환한다.
    set gridColor(value) -> void
        의존:
            defined — 보관 재질 존재 판정; 함수: {defined()}
            THREE.Color — 보관 재질의 색상 변경; 함수: {set()}
        동작: _gridColor에 값을 대입한다. _boxMaterial이 정의되어 있으면 color가 null·undefined가 아닐 때 color.set(value)를 호출한다. 재생성은 하지 않는다.
    get gridOpacity()
        동작: _gridOpacity를 null·undefined 검사 후 그대로 반환한다.
    set gridOpacity(value) -> void
        의존:
            defined — 보관 재질 존재 판정; 함수: {defined()}
            THREE.LineBasicMaterial — 보관 재질의 투명도 변경; 속성 쓰기: {opacity, transparent}
        동작: _gridOpacity에 값을 대입한다. _boxMaterial이 정의되어 있으면 opacity를 해당 값으로, transparent를 value < 1의 결과로 설정한다. 재생성은 하지 않는다.

    setHeight(value, refresh: boolean = true) -> void
        의존: defined — 입력 존재 판정; 함수: {defined()}
        동작: value가 null·undefined이면 종료한다. 그 외에는 Number(value)를 _height에 저장하며 refresh가 truthy이면 기존 캐시의 격자를 재생성한다.
    getHeight() -> number
        동작: _height를 Number로 변환해 반환한다. 값이 undefined이면 NaN, null이면 0이 될 수 있다.
    setSize(value, refresh: boolean = true) -> void
        의존: defined — 입력 존재 판정; 함수: {defined()}
        동작: value가 null·undefined이면 종료한다. 그 외에는 Number(value)를 _size에 저장하며 refresh가 truthy이면 기존 캐시의 격자를 재생성한다. 유한한 양수인지 검사하지 않는다. [확인 Q-003]
    getSize() -> number
        동작: _size를 Number로 변환해 반환한다. 값이 undefined이면 NaN, null이면 0이 될 수 있다.
    setShowGridTile(value) -> void
        의존: defined — 입력 존재 판정; 함수: {defined()}
        동작: value가 null·undefined가 아닐 때만 _showGridTile에 저장한다. 기존 그룹을 숨기거나 제거하지 않는다.
    getShowGridTile()
        동작: _showGridTile을 검사나 변환 없이 반환한다.
    setMinLevel(value) -> void
        의존: defined — 입력 존재 판정; 함수: {defined()}
        동작: value가 null·undefined가 아닐 때만 _minlevel에 저장한다. 기존 격자를 재검사하거나 재생성하지 않는다.
    getMinLevel()
        동작: _minlevel을 검사나 변환 없이 반환한다.
    setGridColor(value) -> void
        의존:
            defined — 입력·보관 재질 존재 판정; 함수: {defined()}
            THREE.Color — 보관 재질의 색상 변경; 함수: {set()}
        동작: value가 null·undefined이면 종료한다. _gridColor를 저장하고 정의된 _boxMaterial의 color가 있으면 set(value)를 호출한다. 모든 상자를 순회하거나 재생성하지 않는다. [확인 Q-004]
    getGridColor()
        동작: _gridColor를 검사나 변환 없이 반환한다.
    setGridOpacity(value) -> void
        의존:
            defined — 입력·보관 재질 존재 판정; 함수: {defined()}
            THREE.LineBasicMaterial — 보관 재질의 투명도 변경; 속성 쓰기: {opacity, transparent}
        동작: value가 null·undefined이면 종료한다. _gridOpacity를 저장하고 정의된 _boxMaterial의 opacity와 value < 1에 따른 transparent를 변경한다. 범위 보정·모든 상자 순회·재생성은 하지 않는다. [확인 Q-004]
    getGridOpacity()
        동작: _gridOpacity를 검사나 변환 없이 반환한다.

    override show(show: boolean) -> void
        의존: U3dModelLayer — 기반 표시 상태 변경; 함수: {prototype.show.call()}
        동작:
            기반 show를 같은 this와 show 인수로 먼저 호출하고 그 반환값을 전달하지 않는다.
            show가 truthy이면 _showGridTile을 true로 저장한다. falsy이면 hide를 호출하므로 기반 show(false)가 한 번 더 호출된다.
    hide() -> void
        의존: U3dModelLayer — 기반 레이어 숨김; 함수: {prototype.show.call()}
        동작: 기반 show(false)를 먼저 호출하고 _showGridTile을 false로 저장한다. _gridCache를 지우거나 disposeGridTile을 호출하지 않는다. 기반 숨김으로 장면 그룹에서 분리된 격자가 캐시에 남을 수 있다. [확인 Q-005]

    setGridTile(isShow, height?, size?, minlevel?, gridColor?, gridOpacity?) -> void
        의존: defined — 대체값 존재 판정; 함수: {defined()}
        동작:
            _showGridTile을 isShow로 먼저 저장한다. falsy이면 전체 격자를 제거하고 다른 설정은 적용하지 않은 채 종료한다. 기반 레이어의 표시 상태를 변경하지 않는다.
            height·size·minlevel·gridColor·gridOpacity 순서로 한 필드씩 확인하고 저장한다. 각 입력이 null·undefined이면 현재 getter 결과로 대체하며, 대체값도 null·undefined이면 그 시점에 종료한다. 숫자 getter가 반환한 NaN은 defined 검사를 통과한다.
            한 값의 확인 직후 다음 값 확인으로 넘어가기 전에 대응 setter를 호출한다. 높이·간격 setter에는 refresh=false를 전달하며 색상·투명도 setter는 보관 재질도 변경할 수 있다. 뒤의 값 때문에 종료하거나 예외가 나도 앞서 저장한 설정은 되돌리지 않는다.
            다섯 값의 적용을 마쳤으면 기존 캐시의 격자를 재생성한다. _GridConfig 객체는 갱신하지 않는다. [확인 Q-001]
    getGridTile()
        의존: defined — 설정 기록 존재 판정; 함수: {defined()}
        동작: _GridConfig가 null·undefined이면 undefined를 반환하고 그 외에는 저장값을 그대로 반환한다. 초기 객체를 유지한 경우 같은 객체 참조이며, 외부에서 교체한 값의 종류도 검사하지 않는다. 현재 설정 필드를 다시 읽거나 복제하지 않으며 반환 객체의 변경도 현재 설정 필드에 자동 반영되지 않는다. [확인 Q-001]

    override setApp(app: U3dApp) -> void
        의존: U3dModelLayer — 앱 연결과 기반 작업 프로세스 설정; 함수: {prototype.setApp.call()}
        동작: 같은 this와 app으로 기반 setApp을 호출한다. 추가 격자 초기화는 하지 않는다.
    override update(drawArg: UDrawArg) -> void
        동작: 빈 본문으로 아무 작업도 하지 않는다. drawArg를 읽거나 기반 update를 호출하지 않고 undefined로 종료한다.

    override createModel(tile: U3dQuadTile) -> undefined
        처리 기준:
            격자 계산은 타일의 _minx·_maxx·_miny·_maxy와 같은 수치 좌표 공간에서 수행하며 별도의 투영·지형 높이 보정은 없다.
            크기·높이·불투명도의 유효 범위나 생성 상자 수 상한을 검사하지 않는다. size의 0·음수·비유한 값에 대한 거부 정책은 없다. [확인 Q-003]
        의존:
            U3dModelLayer — 기반 타일 판정; 함수: {prototype.createModel.call()}
            U3dLayer — 상속된 레이어 장면 그룹 접근; 속성 읽기: {_group}
            defined — 타일·중복 캐시 존재 판정; 함수: {defined()}
            U3dQuadTile — 타일 상태·레벨·경계 입력; 속성 읽기: {_disposed, _rlevel, _key, _minx, _maxx, _miny, _maxy}
            THREE.Color — 이번 생성에 사용할 색상 객체 구성; 생성자: {new THREE.Color()}
            THREE.MeshBasicMaterial — 초기 검정 재질 구성; 생성자: {new THREE.MeshBasicMaterial()}
            UBox3HelperGroup — 타일별 상자 그룹 구성; 생성자: {new UBox3HelperGroup()}
            UCache — 중복 확인 및 타일 그룹 등록; 함수: {get(), add()}
            UGroup — 레이어 장면 그룹에 등록; 함수: {add()}
        동작:
            기반 createModel을 먼저 호출한다. false 등 반환값을 이후 격자 생성 여부에 사용하지 않으며 기반 호출이 던진 예외도 포착하지 않는다. 따라서 undefined 타일은 뒤의 자체 검사 전에 기반 구현에서 실패할 수 있다. [확인 Q-006]
            타일이 null·undefined이거나 _disposed가 truthy이거나 _showGridTile이 falsy이면 종료한다.
            높이·간격·최소 레벨·색상을 현재 getter로 읽고 Color 객체를 만든다. 그 다음 _rlevel < minlevel이면 종료하므로 색상 처리가 레벨 검사보다 먼저 실행된다.
            타일 경계와 간격으로 이번 상자 배치 범위를 구한다.
            gridTile#와 타일 키를 결합한 이름의 새 그룹을 만든 후 _gridCache에서 같은 키의 값이 정의되어 있으면 종료한다. 캐시 그룹을 장면에 다시 붙이지 않으며 방금 만든 빈 그룹을 명시적으로 해제하지 않는다. [확인 Q-005]
            _meshMaterial이 falsy일 때 검정 MeshBasicMaterial을 만든다. 이 재질은 뒤의 상자 생성에는 전달하지 않는다. [확인 Q-007]
            그룹·배치 범위·간격·높이·색상과 레이어의 현재 스타일 상태로 상자를 채운다.
            순회가 끝나면 빈 그룹이라도 타일 키로 캐시에 저장하고 레이어 _group에 추가한다. 성공 표시나 기반 반환값을 반환하지 않는다. [확인 Q-006]

    disposeGridTile(tile?: U3dQuadTile, all?: boolean) -> void
        의존:
            defined — 전체 제거 플래그·타일·그룹 존재 판정; 함수: {defined()}
            UDEF — 객체 계층 및 렌더 자원 해제; 정적 함수: {disposeObject3D()}
            U3dLayer — 상속된 레이어 장면 그룹 접근; 속성 읽기: {_group}
            UCache — 격자 조회·삭제·목록 순회·초기화; 함수: {get(), remove(), items(), clear()}
            UGroup — 레이어·타일 그룹 연결 제거; 함수: {remove(), clear()}
        동작:
            all이 정의되어 있고 truthy이면 레이어 _group 전체를 disposeObject3D에 전달한 뒤 clear한다. 캐시에 남은 각 그룹도 disposeObject3D에 전달하고 마지막에 캐시를 비운다. 격자 이외의 _group 자식도 첫 해제 범위에 들어간다.
            전체 제거가 아니고 tile이 null·undefined이면 종료한다. 해당 키의 격자 그룹이 정의되어 있으면 캐시에서 삭제하고 _group에서 분리한 뒤 객체 계층을 해제하고 그룹을 비운다.
            _boxMaterial·_meshMaterial 참조는 초기화하지 않는다. 공유 helper 자원과 재질 참조의 유효성은 별도 확인이 필요하다. 해제 중 예외는 포착하지 않는다. [확인 Q-004]
    override disposeTile(tile: U3dQuadTile) -> void
        의존: U3dModelLayer — 기반 타일 해제; 함수: {prototype.disposeTile.call()}
        동작: 해당 타일의 격자를 먼저 제거하고 같은 this와 tile로 기반 disposeTile을 호출한다.
    override dispose() -> void
        의존:
            U3dLayer — 상속된 장면·그룹 접근; 속성 읽기: {_scene, _group}
            UScene — 레이어 그룹 분리; 함수: {remove()}
            U3dModelLayer — 기반 모델 캐시·레이어 해제; 함수: {prototype.dispose.call()}
        동작: _scene에서 _group을 먼저 분리하고 전체 격자를 제거한 다음 기반 dispose를 호출한다. 기반의 완료 객체를 반환하거나 기다리지 않는다. [확인 Q-008]

getAssertValue(value)
    의존:
        defined — null·undefined 판정; 함수: {defined()}
        UDEF — 값 존재 단언; 정적 함수: {assert()}
    동작: defined(value)의 결과를 assert에 전달하고 통과하면 원래 값을 반환한다. null·undefined이면 오류 로그 후 Error를 던지며 0·false·NaN은 이 존재 검사를 통과한다.
```

## 4. 공통 처리 기준과 제약

```spec
설정 필드와 _GridConfig 기록, 격자 생성 허용 상태와 기반 레이어의 표시 상태는 각각 별개다. 한 상태를 바꿨다고 다른 상태도 갱신된 것으로 간주하지 않는다.
직접 접근자의 setter는 null·undefined도 저장하지만 setHeight·setSize·setShowGridTile·setMinLevel·setGridColor·setGridOpacity는 해당 값을 무시한다. getter의 존재 단언과 getHeight·getSize의 숫자 변환도 구분한다.
격자 전용 캐시와 기반 레이어의 그룹은 같은 타일 그룹을 참조할 수 있고 helper의 geometry·재질은 다른 helper와 공유될 수 있다. 단일 소유 객체처럼 해제·변경 효과를 일반화하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
