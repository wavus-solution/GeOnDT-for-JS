# U3dGroupLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dGroupLayer`는 `U3dLayer`를 상속하여 여러 자식 레이어의 표시·투명도·이벤트·작업 상태를 한 그룹에서 제어한다.

### 1.2 책임 범위

자식 목록의 참조, 부모 그룹 연결, 가시성 전달, 추가 시 경계 상자 누적, 상태 집계와 자식 해제 호출을 담당한다. 경계 상자 누적·중심 계산의 세부 구현은 비공개 계열에 두며 등록·표시·이벤트·해제 제어는 일반 계열에 둔다. 자식의 실제 타일 생성·렌더링·비동기 해제는 해당 자식 구현의 책임이다.

### 1.3 주요 동작 방식

생성 옵션의 자식 배열을 복제하지 않고 보관한다. 최초 자식은 즉시 표시 상태와 부모 그룹을 전달받으며, 나중에 추가한 자식은 ready·then 유무에 따라 표시 시점이 달라진다. LOADED 이벤트는 그룹에, 다른 이벤트는 자식에 연결한다. 해제는 자식의 비동기 완료를 기다리지 않는다.

### 1.4 주요 사용처와 연계 대상

- `union3d/app/U3dApp.js::createModelGroupLayer()`가 렌더 컨텍스트를 전달하여 생성·등록한다.
- `union3d/3dLayer/U3dLayerList.js::removeLayer()`가 자식 목록을 먼저 조회해 제거한 뒤 그룹을 해제한다.
- `union3d/3dLayer/U3dMaskLayer.js::createMaskValue()`가 `_listlayer`를 읽어 자식 캐시를 탐색한다.
- `U3dLayer`는 기본 상태·이벤트와 deferred 초기화를, `U3dMessage`는 실패 로그를 제공한다.

## 2. 요구사항과 품질 기준

```spec
공개 메서드의 인수·반환, 자식 호출 순서, 오류 전달과 비동기 완료 시점을 보존한다.
자식 배열 및 경계 상자의 참조 공유와 외부 변경이 후속 호출에 반영되는 동작을 보존한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dGroupLayerCO_Content 타입 정의
    listlayer?: Array<U3dGroupLayerChild> = []
        최초 자식 배열이며 전달한 배열 자체를 보관한다.

U3dGroupLayerCO 타입 정의
    U3dLayerCO & U3dGroupLayerCO_Content 별칭

U3dGroupLayerChild_Content 타입 정의
    getBoundingBox: function() -> U3dGroupLayerBoundingBox
        추가 시 누적할 자식의 경계 상자를 반환한다.
    setEmissiveColor: function(number, number, number) -> boolean
        자식의 자체 발광 색상 설정 함수다.
    ready?, then?: DeferredReadyFunc
        준비 성공·실패를 연결하는 선택적 함수다. ready를 우선한다.
    catch?: DeferredCatchFunc
        실패 콜백 등록용 선언이며 그룹은 ready 또는 then의 반환 객체에서 catch를 호출한다.

U3dGroupLayerChild 타입 정의
    U3dLayer & U3dGroupLayerChild_Content 별칭

U3dGroupLayerBoundingBox 타입 정의
    Box3 | undefined 별칭

U3dGroupLayer extends U3dLayer 클래스 정의
    의존: U3dLayer — 기본 레이어 계약; 상속: {U3dLayer}

    _listlayer: Array<U3dGroupLayerChild>
        자식 배열이다. 생성 입력 및 getChildren 반환값과 공유하며 외부 내부 연계 코드에서도 접근한다.

    override _boundingBox: Box3 | undefined
        생성 완료 시 undefined이며 addLayer로 누적한다. 반환 참조와 외부 대입을 통해 변경될 수 있다.

    constructor(opt: U3dGroupLayerCO = {})
        의존:
            U3dLayer — 기반 초기화와 상태; 생성자: {super()}; 속성 읽기: {_drawArg, _visible}
            UDEF — 그룹 종류; 상수: {LAYER_TYPE.GROUP, PROCESS.TYPE.GROUP}
            defaultValue — undefined 기본값 선택; 함수: {defaultValue()}
            defined — null·undefined 존재 판정; 함수: {defined()}
            U3dGroupLayerChild(layer) — 초기 자식 연결; 함수: {show(), setGroupLayer()}
        동작:
            opt로 기반 생성자를 호출하고 그룹 종류·클래스명·작업 종류를 설정한다.
            opt.listlayer가 undefined이면 새 빈 배열을 사용하고 그 외에는 입력을 그대로 보관한다.
            _app을 undefined로 만든 뒤 _drawArg가 존재하면 그 _app을 보관한다.
            현재 자식 목록을 인덱스 순으로 읽으며 각 자식에 현재 _visible로 show를 호출한 다음 부모 그룹을 자신으로 설정한다.
            초기 자식의 경계 상자는 조회하지 않고 _boundingBox를 undefined로 설정한다.

    override setOpacity(val: number) -> void
        인터페이스: val은 자식에 전달할 투명도다.
        의존:
            U3dLayer — 그룹 자체의 투명도 저장; 함수: {super.setOpacity()}
            U3dGroupLayerChild(layer) — 자식 투명도 전달; 함수: {setOpacity()}
        동작:
            기반 setOpacity를 먼저 호출한 뒤 자식을 배열 반복자 순서로 순회하며 같은 val을 전달한다.

    override dispose() -> Promise<boolean>
        인터페이스: 반환의 true는 자식 해제 호출과 그룹 상태 반영의 완료이며 자식 비동기 작업의 완료가 아니다.
        처리 기준: 자식 호출에서 동기 예외가 발생하면 그 예외를 전달하고 이후 자식 호출·그룹 상태 반영을 수행하지 않는다.
        의존:
            deferred — 직접 완료 가능한 반환 객체; 함수: {deferred()}
            U3dGroupLayerChild(layer) — 자식 해제; 함수: {dispose()}
            U3dLayer — 해제 상태; 속성 쓰기: {_disposed}
        동작:
            deferred 객체를 만들고 자식을 배열 반복자 순서로 순회하며 dispose를 호출한다. 자식 반환값은 기다리지 않는다.
            _disposed를 true로 설정하고 _listlayer를 새 빈 배열로 교체한다.
            반환 객체를 true로 resolve하고 그 객체를 반환한다. 기존 배열과 경계 상자, 부모 연결은 별도로 지우지 않는다.

    override initialize() -> void
        의존: deferred(this) — 기반 생성자가 부착한 완료 제어; 함수: {resolve()}
        동작: 자신에게 부착된 resolve를 자신을 인수로 호출한다. 기반 initialize는 호출하지 않는다.

    override getWorkingLevel2() -> number
        의존: U3dGroupLayerChild(layer) — 표시 중인 자식 작업 수; 함수: {getVisible(), getWorkingLevel2()}
        동작: 합계를 0으로 시작하고 자식을 배열 반복자 순서로 순회하며 getVisible 결과가 truthy인 자식의 getWorkingLevel2 결과를 더해 반환한다.

    override getWorkingLevel3() -> number
        의존: U3dGroupLayerChild(layer) — 표시 중인 자식 작업 수; 함수: {getVisible(), getWorkingLevel3()}
        동작: 합계를 0으로 시작하고 자식을 배열 반복자 순서로 순회하며 getVisible 결과가 truthy인 자식의 getWorkingLevel3 결과를 더해 반환한다.

    override on(event: string, callback: EventCallBack, once?: boolean, name?: string) -> string
        인터페이스: callback·once·name은 선택된 수신 대상에 그대로 전달한다. 반환은 name이 truthy이면 name이며 그 외에는 빈 문자열이다.
        의존:
            U3dLayer — 그룹 자체의 이벤트 등록; 함수: {prototype.on.call()}; 속성 읽기: {EVENT.LOADED}
            U3dGroupLayerChild(layer) — 자식 이벤트 등록; 함수: {on()}
        동작:
            event가 현재 constructor.EVENT.LOADED와 엄격히 같으면 기반 on을 그룹 receiver로 호출한다.
            그 외에는 자식을 배열 반복자 순서로 순회하며 각 자식의 on을 호출한다.
            등록 대상의 반환값을 사용하지 않고 name 또는 빈 문자열을 반환한다.

    override once(event: string, callback: EventCallBack, name?: string) -> string
        동작: 현재 인스턴스의 on에 event·callback·true·name을 전달하고 반환값을 그대로 반환한다.

    override off(event?: string, callback?: function | string) -> void
        인터페이스: callback은 제거할 함수 또는 이름이다. event 생략은 그룹 자체가 아닌 자식으로 전달된다.
        의존:
            U3dLayer — 그룹 자체의 이벤트 해제; 함수: {prototype.off.call()}; 속성 읽기: {EVENT.LOADED}
            U3dGroupLayerChild(layer) — 자식 이벤트 해제; 함수: {off()}
        동작:
            event가 현재 constructor.EVENT.LOADED와 엄격히 같으면 기반 off를 그룹 receiver로 호출한다.
            그 외에는 자식을 배열 반복자 순서로 순회하며 event와 callback을 전달한다.

    override show(show: boolean) -> void
        의존:
            defined — 앱 존재 판정; 함수: {defined()}
            U3dMessage — 렌더 컨텍스트 누락 안내; 정적 함수: {info()}; 상수: {CNT.CMM.NON_DRAWARG_1}
            U3dLayer — 현재 표시 상태; 속성 쓰기·읽기: {_visible}
            U3dGroupLayerChild(layer) — 자식 표시 전환; 함수: {show()}
            U3dApp(_app) — 일괄 변경 후 갱신; 함수: {forceUpdate()}
        동작:
            _app이 null 또는 undefined이면 클래스명과 NON_DRAWARG_1, 코드 4742967로 안내하고 상태 변경 없이 종료한다.
            _visible에 show를 저장한다.
            현재 자식 목록을 인덱스 순으로 읽으며 각 자식에 당시 _visible과 false를 전달해 show를 호출한다.
            순회가 정상 종료하면 현재 _app의 forceUpdate를 한 번 호출한다.

    getChildren() -> Array<U3dGroupLayerChild>
        동작: _listlayer 자체를 반환한다. 복사하거나 읽기 전용으로 만들지 않는다.

    addLayer(layer: U3dGroupLayerChild) -> boolean
        인터페이스: 반환의 true는 등록·경계 반영의 완료이며 준비 콜백의 완료를 기다리지 않는다.
        처리 기준: 자식 메서드의 동기 예외는 전달하며 앞서 변경한 부모·표시·경계 상태를 되돌리지 않는다.
        의존:
            defined — 비동기 진입점과 경계 존재 판정; 함수: {defined()}
            U3dLayer — 그룹 이름과 표시 상태; 속성 읽기: {_name, _visible}
            U3dGroupLayerChild(layer) — 부모 연결·준비·표시·경계 조회; 함수: {setGroupLayer(), ready(), then(), getBoundingBox(), show()}; 속성 읽기: {_name}
            반환된 준비 객체 — 실패 연결; 함수: {catch()}
            U3dMessage — 준비 실패 로그; 정적 함수: {error()}; 상수: {CNT.LAYER.ERROR_ADD_GROUP_1}
        동작:
            목록 indexOf 결과가 느슨한 비교로 -1이 아니거나 자식 _name과 그룹 _name이 느슨하게 같으면 false를 반환한다. 다른 자식의 이름은 비교하지 않는다.
            자식의 부모 그룹을 자신으로 설정한다.
            ready가 null·undefined가 아니면 ready에 성공 콜백을 등록하고 반환 객체의 catch에 코드 2775786의 실패 로그를 연결한다.
            ready가 없고 then이 존재하면 then에 같은 성공 콜백을 등록하고 반환 객체의 catch에 코드 2775457의 실패 로그를 연결한다.
            성공 콜백은 실행 당시의 그룹 _visible로 해당 자식의 show를 호출한다. 두 진입점이 없으면 즉시 같은 표시 호출을 한다.
            자식 getBoundingBox 결과가 존재하면 그룹 경계 상태와 자식 경계를 전달하여 누적한다.
            현재 _listlayer에 자식을 추가하고 true를 반환한다.

    getBoundingBox() -> Box3 | undefined
        동작: _boundingBox 자체를 반환한다. 생성 입력·외부 배열 변경으로 목록에 있는 자식의 경계는 다시 계산하지 않는다.

    override getCenter() -> GooglePositionVector3 | null
        동작: 그룹 경계 상태를 비공개 계산에 전달하고 반환된 새 중심 벡터 또는 null을 그대로 반환한다.

    setEmissiveColor(r: number, g: number, b: number) -> boolean
        인터페이스: r·g·b는 자식에 전달할 색상 채널 값이다. 반환은 자식 반환값의 집계가 아니라 동기 예외 발생 여부다.
        의존: U3dGroupLayerChild(layer) — 자체 발광색 전달; 함수: {setEmissiveColor()}
        동작:
            자식을 배열 반복자 순서로 순회하며 r·g·b를 전달하고 정상 종료하면 true를 반환한다. 빈 목록도 true다.
            순회 중 동기 예외가 발생하면 이후 순회를 중단하고 false를 반환한다. 앞선 자식 변경은 유지한다.

    override getStateTileLength() -> number
        의존: U3dGroupLayerChild(layer) — 상태 타일 수 조회; 함수: {getStateTileLength()}
        동작: 합계를 0으로 시작하고 현재 자식 목록을 인덱스 순으로 읽으며 가시성에 관계없이 getStateTileLength 결과를 더해 반환한다.

    override printStateTiles() -> number
        의존:
            U3dGroupLayerChild(layer) — 상태 타일 진단; 함수: {getStateTileLength(), getName(), printStateTiles()}
            Web API(console) — 진단 출력; 함수: {info()}
        동작:
            현재 자식 목록을 인덱스 순으로 읽으며 getStateTileLength 결과가 0보다 큰 자식만 대상으로 삼는다.
            해당 인덱스 자식의 이름을 name: 접두어와 출력한 뒤 다시 해당 인덱스 자식의 printStateTiles를 호출하고 대상 수를 증가시킨다.
            대상 수가 0이면 "layers is completed! "를 출력한다.
            대상 자식 수를 반환한다.

    override printNotCompleteStateTiles(print?: boolean) -> number
        인터페이스: print는 현재 사용하지 않으며 자식에게도 전달하지 않는다.
        의존:
            U3dGroupLayerChild(layer) — 미완료 상태 진단; 함수: {getStateTileLength(), getName(), printNotCompleteStateTiles()}
            Web API(console) — 진단 출력; 함수: {info()}
        동작:
            현재 자식 목록을 인덱스 순으로 읽으며 getStateTileLength 결과가 0보다 큰 자식만 대상으로 삼는다.
            해당 인덱스 자식의 이름을 name: 접두어와 출력한 뒤 다시 해당 인덱스 자식의 printNotCompleteStateTiles를 인수 없이 호출하고 대상 수를 증가시킨다.
            대상 자식 수를 반환한다. 대상이 없으면 별도 완료 문구를 출력하지 않는다.

    override createModel(tile: U3dQuadTile, opt?: object) -> void
        동작: 빈 본문으로 아무 작업도 수행하지 않는다.

    override disposeTile(tile: U3dQuadTile) -> void
        동작: 빈 본문으로 아무 작업도 수행하지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
defined 판정은 null과 undefined만 부재로 취급하며 truthy 검사나 함수 여부 검사로 대체하지 않는다.
인덱스 순회는 반복 중 목록 교체·추가와 같은 인덱스의 자식 변경을 후속 접근에 반영한다. 배열 반복자 순회는 진입 시 얻은 배열 반복자를 유지한다.
기존 자식 메서드 반환값을 새로 기다리거나 성공 여부로 해석하지 않는다. 명시적인 catch가 없는 동기 예외는 그대로 전달한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
