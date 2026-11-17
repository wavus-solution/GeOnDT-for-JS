# USkirtNode 명세

> 상태: 구현 관찰 초안

## 1. 개요

동적 스커트가 참조할 이웃의 좌표·방향·작업 종류와 고도 적용 변경 번호·지오메트리 ID를 보관한다. `UHeightSkirt1_0`이 이웃을 검색할 때 생성하고 `USkirtInfo`가 완료 비교에 사용한다. 검색 중에는 부모 좌표로 이동하며, 완료 후에는 실제 타일과 지오메트리 참조를 해제하고 비교용 숫자는 보존한다.

```spec
```

## 3. 정규 자연어 수도코드

```spec
USkirtNode 클래스 정의
    x, y, z: number
        검색 중인 타일 열·행·레벨
    direction: string | undefined
        대상 타일에서 바라본 이웃 방향
    #geometry: UPlaneBufferGeometry | undefined
        현재 검색에서 사용할 지오메트리
    #tile: U3dQuadTile | undefined
        현재 검색에서 사용할 타일
    #key: string | undefined
        실제 타일을 연결했을 때 보존하는 키
    #workType: string | undefined
        완료 비교에도 보존하는 작업 종류
    #heightScaleRatio: number | undefined
        이웃 표시 높이를 자기 로컬 높이로 바꾸는 완료 시점의 배율비
    _heightRevision: number | undefined
        연결 당시 이웃 타일의 고도 적용 변경 번호
    _geometryId: number | undefined
        연결 당시 이웃 지오메트리의 고유 ID

    get heightRevision() -> number | undefined
        동작: _heightRevision을 반환한다.
    set heightRevision(value: number | undefined) -> void
        동작: _heightRevision에 입력을 저장한다.
    get geometryId() -> number | undefined
        동작: _geometryId를 반환한다.
    set geometryId(value: number | undefined) -> void
        동작: _geometryId에 입력을 저장한다.

    constructor(x: number, y: number, z: number, direction: string | undefined)
        동작: 좌표와 방향을 저장한다.
    getWorkType() -> string | undefined
        동작: #workType을 반환한다.
    setWorkType(workType: string) -> void
        동작: #workType에 입력을 저장한다.
    getTile() -> U3dQuadTile | undefined
        동작: #tile을 반환한다.
    setTile(tile: U3dQuadTile, heightScaleRatio: number = 1) -> void
        의존: U3dQuadTile — 실제 타일 키와 고도 변경 번호; 함수: {getKey()}; 속성 읽기: {heightRevision}
        동작:
            #tile에 입력 참조를, #key에 타일 키를 저장한다.
            호출자가 계산한 heightScaleRatio를 #heightScaleRatio에 저장한다.
            _heightRevision에 tile.heightRevision을 저장한다. 이후 타일 변경은 스냅샷을 바꾸지 않는다.
    getGeometry() -> UPlaneBufferGeometry | undefined
        동작: #geometry를 반환한다.
    setGeometry(geometry: UPlaneBufferGeometry) -> void
        의존: UPlaneBufferGeometry — 실제 지오메트리 식별자; 속성 읽기: {id}
        동작: #geometry에 입력 참조를 저장하고 _geometryId에 geometry.id를 저장한다.
    getKey() -> string
        동작: #key가 truthy이면 반환하고, 아니면 x_y_z 형식의 검색 키를 반환한다.
    changeParentNode() -> void
        동작: x와 y를 2로 나눈 내림값으로, z를 1 감소한 값으로 변경한다.
    equals(node: USkirtNode) -> boolean
        동작: x·y·z와 #heightScaleRatio·_heightRevision·_geometryId가 모두 같으면 true, 아니면 false를 반환한다. 부모 검색 중에는 양쪽의 세 비교값이 모두 undefined여서 좌표·레벨만 비교한다. 좌표와 배율이 같아도 고도 변경 번호·geometry ID가 달라지면 false이다.
    clear() -> void
        동작: #tile과 #geometry만 undefined로 만들고 좌표·키·작업 종류·배율비·고도 변경 번호·지오메트리 ID는 보존한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
