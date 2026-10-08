# U3dProcess 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

등록된 레이어 콜백과 타일의 상태에서 실행 가능한 작업 후보를 만들고 거리별 대기 큐에 등록한다.

### 1.2 책임 범위

콜백의 표시·초기화·공간·레벨 조건과 진행 중 작업 중복을 확인한다. 실제 비동기 작업 실행과 슬롯 회수는 하위 처리기가 담당한다.

### 1.3 주요 동작 방식

후보 수집과 큐 등록을 분리한다. 큐 등록은 타일 상태를 초기화한 뒤 카메라까지의 거리로 우선순위 구간을 선택한다.

### 1.4 주요 사용처와 연계 대상

`U3dQuadTileProcess`가 상속하며 `UFrameState`와 `UModelFrameState`가 작업 후보를 수집한다.

## 3. 정규 자연어 수도코드

```spec
U3dProcess extends U3dObject 클래스 정의
    constructor(opt = {})
        의존:
            U3dObject — 기반 상태 초기화; 생성자: {constructor()}
            defaultValue — 옵션 기본값 선택; 함수: {defaultValue()}
            UDEF — 기본 실행 한도와 작업 종류; 상수: {DEFAULT_MAX_PROCESS, PROCESS.TYPE.IMAGE}
            U3dQueue — 대기 큐 생성; 생성자: {new U3dQueue()}
        동작:
            기반 생성자를 호출한다.
            _classtype을 U3dProcess로 저장한다.
            opt의 name·layer·maxprocess·callback·parameter·drawarg·type·useMultiBuffer를 대응 필드에 저장한다.
            기본값은 각각 process·undefined·DEFAULT_MAX_PROCESS·빈 배열·undefined·undefined·IMAGE·true다.
            거리 경계를 500·1000·2000으로, 구간 인덱스를 0·1·2로 저장한다.
            다중 버퍼이면 경계 개수에 1을 더한 수, 아니면 1을 큐 생성자에 전달한다.
            진행 수를 0, 폐기 표식을 false로 초기화한다.

    dispose() -> void
        동작:
            _layer 참조를 undefined로 지우고 _dispose를 true로 설정한다.
            대기 큐를 비운다.

    getMaxProcess()
        동작: _maxProcess를 반환한다.

    setMaxProcess(maxProcess = UDEF.DEFAULT_MAX_PROCESS) -> void
        의존: UDEF — 생략된 한도의 기본값; 상수: {DEFAULT_MAX_PROCESS}
        동작: 입력값을 검사하거나 실행 중 슬롯을 변경하지 않고 _maxProcess에 저장한다.

    getLayer()
        동작: _layer를 반환한다.

    add(item, force, isOnly, scope) -> number
        동작:
            네 입력을 전달하여 작업 후보를 수집한다.
            후보마다 work만 큐 등록에 전달하며 tile 인수는 전달하지 않는다.
            후보 목록의 길이를 반환한다. 다중 버퍼의 누락된 tile 경로는 확인 대상으로 둔다. [확인 Q-001]

    enqueueWork(work, tile) -> void
        의존:
            defined — 작업과 레이어 상태 설정 함수 존재 검사; 함수: {defined()}
            UDEF — 레이어 타일 상태 초기값; 상수: {TILE_STATE._none}
            작업 scope — 레이어 타일 상태 반영; 함수: {setStateTile()}
            U3dQuadTile — 상자 기준 거리 조회; 함수: {distanceToCameraPosition()}
            U3dQueue — 큐 등록; 함수: {enqueue()}
        동작:
            work가 정의되지 않았으면 반환한다.
            scope에 상태 설정 함수가 있으면 work.item의 상태를 _none으로 설정한다.
            다중 버퍼이면 마지막 구간 인덱스를 거리 경계 배열의 길이로 시작한다.
                tile에 false를 전달하여 카메라까지 상자 기준 거리를 구한다. tile이 없으면 거리 조회를 수행할 수 없다. [확인 Q-001]
                거리가 경계보다 작은 첫 구간의 index를 선택하고 반복을 종료한다.
                일치하는 경계가 없거나 경계 배열이 비었으면 처음 정한 마지막 구간을 사용한다.
                work와 선택한 index를 큐에 전달한다.
            다중 버퍼가 아니면 work만 큐에 전달한다.

    _getTerrainWork(item: U3dQuadTile, force: unknown, completedWorkTile: U3dQuadTile, emptyResult: U3dQuadTileTask[]) -> U3dQuadTileTask[] | undefined
        처리 기준:
            엔진 내부 수집 진입점이며 emptyResult는 작업이 없을 때 변경 없이 반환할 빈 배열이다.
            모듈 초기화 때 보관한 표준 getWork 함수와 현재 함수의 동일성으로 외부 재정의를 구분한다.
        동작:
            현재 getWork를 한 번 조회하여 재정의 경로의 호출 대상으로 보관한다.
            표준 함수가 아니면 같은 처리기를 수신자로 하여 보관한 함수에 item·force·undefined·undefined·completedWorkTile 다섯 인수로 동기 호출하고 반환값을 그대로 반환한다.
            표준 함수이면 선택 레이어 인수 둘을 undefined로 하여 후보를 수집하고 emptyResult를 빈 결과의 대체 배열로 전달한다.
            작업이 있는 반환 배열은 독립적으로 생성하고, emptyResult는 채우거나 처리기 필드에 보관하지 않는다.

    getWork(item: U3dQuadTile, force?: unknown, isOnly?: unknown, scope?: Partial<{getName: () => string}>, completedWorkTile?: U3dQuadTile) -> U3dQuadTileTask[] | undefined
        동작:
            같은 처리기를 수신자로 다섯 입력을 전달하여 후보를 수집한다.
            emptyResult를 전달하지 않으므로 정상 수집의 반환 배열은 비어 있어도 호출마다 독립적이다.

    getWorking() -> boolean
        동작: _remainProcess > 0 결과를 반환한다. 대기 큐의 길이는 판정하지 않는다.

    getWorkingCount() -> number
        동작: _remainProcess를 반환한다.

    getWorkingLevel2() -> number
        의존: U3dQueue — 대기 개수 조회; 속성 읽기: {length}
        동작: _remainProcess와 대기 큐 길이의 합을 반환한다.

    getWorkingLevel3() -> number
        의존: U3dQueue — 대기 개수 조회; 속성 읽기: {length}
        동작: _remainProcess와 대기 큐 길이의 합을 반환한다.

    getType()
        동작: _type을 반환한다.

    update() -> void
        동작: 빈 본문이며 상태를 변경하지 않고 반환한다.

collectProcessWork(item: U3dQuadTile, force: unknown, isOnly: unknown, scope: Partial<{getName: () => string}> | undefined, completedWorkTile: U3dQuadTile | undefined, emptyResult?: U3dQuadTileTask[]) -> U3dQuadTileTask[] | undefined
    의존:
        defined — 선택 인수와 레이어 계약 존재 검사; 함수: {defined()}
        __GError__ — 잘못된 타일 보고; 함수: {__GError__()}
        U3dMessage — 미준비 레이어 안내; 함수: {info()}; 속성 읽기: {CNT.PROCESS}
        U3dQuadTile — 수명·부모 대기 작업 조회; 함수: {isDisposed(), getParent()}; 속성 읽기: {item._rlevel, item._key, item._rectangle3d, item._drawArg}
        부모 타일 — 같은 이름의 진행 작업 검사; 함수: {isWaitWork()}
        completedWorkTile — 완료 기록 조회와 영상 캐시 소실 시 기록 해제; 함수: {hasEndWork(), deleteEndWork()}
        등록 callback.scope — 레이어 조건·초기화 통지·영상 완료 검사; 함수: {getName(), isDisposed(), getVisible(), isInitialized(), then(), ready(), intersects3D(), isTileWorkComplete(), getCache()}; 속성 읽기: {_box3, _minlevel, _useMaxLevel, _maxlevel}
        UDEF — 완료 검사 대상 작업 종류; 상수: {PROCESS.TYPE.HEIGHT, PROCESS.TYPE.IMAGE}
        UDrawArg — 레이어 경계 가시성 검사; 함수: {intersectsBox()}
        U3dApp — 초기화 완료 후 타일 갱신 요청; 함수: {forceUpdate()}
        U3dQuadTileTask — 후보 객체 생성; 생성자: {new U3dQuadTileTask()}
    동작:
        item이 없거나 isDisposed 결과가 참이면 오류 0173930을 보고하고 undefined를 반환한다.
        처리기 _dispose가 참이면 콜백을 순회하지 않는다. 결과 배열은 첫 후보가 생길 때 그 작업을 포함하여 만든다.
        등록 콜백 배열을 인덱스 순으로 순회한다.
            isOnly가 정의된 참 값이고 scope와 그 getName이 정의되어 있으면 이름이 다른 콜백을 건너뛴다.
            콜백 scope가 폐기되었으면 원본 콜백 배열에서 현재 요소를 splice하고 다음 인덱스로 진행한다. [확인 Q-002]
            scope가 숨김이면 건너뛴다.
            scope의 _box3가 정의되어 있으면 초기화·가시성 조건을 검사한다.
                초기화되지 않았고 isRegisteUpdate도 거짓이면 then을 우선하고 없으면 ready를 사용하여 준비 통지를 연결한다.
                준비 통지의 수신자는 처리기 그리기 인자의 앱에 forceUpdate를 호출한 뒤 callback.isRegisteUpdate를 false로 설정한다.
                통지를 연결했으면 안내를 기록하고 isRegisteUpdate를 true로 설정한 뒤 현재 콜백을 건너뛴다.
                두 준비 통지 함수가 모두 없으면 별도 안내를 기록하고 건너뛴다.
                이미 isRegisteUpdate가 참이면 초기화 완료를 다시 요구하지 않고 경계 가시성 검사로 진행한다.
                item의 그리기 인자로 scope._box3가 화면과 교차하지 않으면 건너뛴다.
            정의된 최소 레벨이 타일 레벨보다 높으면 건너뛴다.
            _useMaxLevel이 참일 때만 정의된 최대 레벨이 타일 레벨보다 낮은 콜백을 건너뛴다.
            intersects3D가 있으면 타일 rectangle3d와 레벨을 전달하고 거짓 결과이면 건너뛴다.
            타일 키와 레이어 이름을 연결하여 작업 이름을 만든다.
            부모가 그 이름의 작업을 기다리고 있으면 건너뛴다.
            선택 인수 completedWorkTile에 같은 이름의 완료 기록이 있으면 생성 전 검사를 수행한다.
                고도 작업이면 건너뛴다.
                영상 작업이면 isTileWorkComplete가 있을 때 먼저 호출하고 엄격한 true 여부를 저장한 다음 getCache를 호출한다.
                캐시가 truthy이거나 자체 완료 결과가 true이면 건너뛴다. 둘 다 아니면 완료 기록을 해제한다.
                영상·고도 외의 작업 종류이면 이 완료 기록으로 제외하지 않는다.
            나머지 후보는 type·name·scope·fnc·item·force·active=true로 작업 객체를 생성한다. 첫 후보는 새 배열의 첫 요소로, 이후 후보는 같은 배열의 끝에 추가한다.
        후보가 있으면 결과 배열을 반환한다. 후보가 없으면 emptyResult를 변경 없이 반환하고, 이 인수가 null 또는 undefined이면 새 빈 배열을 반환한다. force는 레이어 조건·대기 중복·완료 검사를 우회하지 않고 새 작업에 그대로 전달한다.
        completedWorkTile을 생략한 독립 수집은 종전처럼 완료 기록으로 제외하지 않는다.

disposeQueue(queue) -> void
    의존:
        defined — 디큐 결과 존재 검사; 함수: {defined()}
        U3dQueue — 항목 회수와 초기화; 함수: {dequeue(), clear()}
        대기 작업 — 후보 자원 정리; 함수: {dispose()}
    동작:
        큐에서 항목을 꺼내고 정의된 항목마다 dispose를 호출한 뒤 다음 항목을 꺼낸다.
        정의되지 않은 항목이 반환되면 반복을 끝내고 큐를 clear한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
