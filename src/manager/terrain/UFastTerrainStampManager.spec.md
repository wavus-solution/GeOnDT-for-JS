# UFastTerrainStampManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

앱별로 공유되는 Fast 도장 관리자이다. U3dLayer를 상속하거나 지도 레이어 목록에 등록하지 않으며, 도장 등록과 표시 자료·GPU 자원의 수명을 관리한다. Helper가 계산한 최초 지면 접점의 다각형과 경계선을 한 논리 도장으로 받는다. 도형이 달라질 때만 GPU에서 거리 snapshot을 만들고 기존 지형 shader가 그 자료를 읽어 단색 또는 두 색 Gradient를 합성한다. 독립 지형 메시를 추가하거나 지형을 다시 렌더하지 않는다. 화면 후처리용 위치·법선 캡처도 만들지 않는다.

지면 교차 계산·4코너·대표선·옆면은 Helper가 소유한다. 도형과 스타일의 사본은 UFastTerrainStamp가, 표시 GLSL·metadata는 UFastTerrainStampMaterial이, 기존 지형 draw와 고정 uniform binding은 UTerrainMesh가 소유한다. 앱에 새 큐나 영상 레이어를 등록하지 않는다.

## 2. 요구사항과 품질 기준

```spec
기존 지면 다각형·노출 경계·열린 선을 보존하며 다수 도형을 임의의 사각형으로 바꾸지 않는다.
Helper 하나에 한 논리 도장과 앞·뒤 snapshot을 사용하고 타일별 도장을 생성하지 않는다.
도형·world 선폭이 변하지 않으면 거리 snapshot을 다시 굽지 않는다.
표현·표시 변경은 거리 snapshot을 보존하고 metadata와 내부 채움 합성을 바꾸며 renderOrder·생성 순서의 source-over를 유지한다.
원래 terrain geometry·LOD·가시성을 사용하고 같은 논리 타일의 최상위 지형에서 한 번만 합성한다.
별도 지형 표시 draw를 추가하지 않는다. 마지막 도장 제거·앱 종료의 소유 자원은 한 번만 반납한다.
```

## 3. 정규 자연어 수도코드

```spec
MANAGERS: WeakMap<object, UFastTerrainStampManager> = 빈 등록부
    앱별 관리자를 공유하며 조회만으로 자원을 만들지 않는다.

UFastTerrainStampManager 클래스 정의
    #state: UFastTerrainStampManagerState
    _disposed: boolean = false

    constructor(app: U3dApp)
        의존:
            U3dApp — 렌더 준비 등록과 외부 장면 조회; 함수: {setRenderBefore(), getExternalScene()}
            Scene — 종료 이벤트 구독; 함수: {addEventListener()}
        동작:
            app의 setRenderBefore와 removeRenderBefore가 함수가 아니면 TypeError를 던진다.
            소유 상태와 장면 종료 callback을 만든다.
            key로 등록한 render callback은 해제 전일 때만 현재 renderer·scene·camera로 준비한다.
            외부 Scene이 있으면 dispose 이벤트를 구독한다.

    static _get(app: U3dApp) -> UFastTerrainStampManager | undefined
        동작: MANAGERS의 현재 앱 값을 반환한다.

    static _getOrCreate(app: U3dApp) -> UFastTerrainStampManager
        동작:
            MANAGERS의 관리자가 없거나 처분되었으면 생성하여 등록한다.
            사용 가능한 관리자를 반환한다.

    static _getDisplayMaterial(ownerLayer: U3dLayer | undefined, object: Object3D) -> UFastTerrainStampMaterial | undefined
        의존: U3dLayer — 소유 앱 조회; 속성 읽기: {_app}
        동작:
            ownerLayer의 앱에 연결된 관리자가 없거나 처분되었으면 undefined를 반환한다.
            표시 snapshot 수가 양수이며 receivers에 object가 있을 때만 공용 표시 재질을 반환한다.
                의존: UFastTerrainStampMaterial — 활성 수 조회; 함수: {_getCount()}
            그 외에는 undefined를 반환한다.

    _addStamp(stamp: UFastTerrainStamp) -> void
        동작:
            관리자가 해제되었으면 Error를 던진다.
            stamps에 등록하고 dirty를 예약한다.

    _removeStamp(stamp: UFastTerrainStamp, retire?: Function) -> void
        동작:
            처분되었거나 등록 Set에서 제거하지 못했으면 종료한다.
            마지막 등록이면 retire와 함께 관리자를 해제하고 아니면 dirty를 예약한다.

    _markDirty() -> void
        동작: 해제 전일 때만 dirty를 true로 둔다.

    _getStamps() -> Array<UFastTerrainStamp>
        동작: 등록 Set을 새 배열로 복사하여 반환한다.

    _getStats() -> object
        동작:
            stamps는 등록 수, activeStamps는 마지막 수집의 표시 도형 수, tiles는 receiver 수를 반환한다.
            cachedTiles는 0, batches는 texture page 수, revision은 표시 자료 세대이다.
            updates·bakes는 자료 갱신·도형 snapshot 횟수이고 displayDraws는 0이다. 실제 GPU 전송량이나 FPS를 뜻하지 않는다.

    dispose(retire?: Function) -> void
        의존:
            U3dApp — 렌더 준비 해제; 함수: {removeRenderBefore()}
            Scene — 종료 구독 해제; 함수: {removeEventListener()}
        동작:
            이미 처분되었으면 종료하고 최초 호출이면 _disposed를 먼저 true로 둔다.
            렌더·종료 callback을 끊고 MANAGERS의 현재 값이 자신일 때만 제거한다.
            소유 자원을 한 번 반납한다.

UFastTerrainStampSnapshot 부분 타입 명세
    row: UFastTerrainStampRenderState
        도장 소유의 읽기 전용 상태 참조이다.
    page, slot, front, layer: number
        page·촬영 영역 위치·앞뒤 번호·표시 slice이다.
    bounds: Box2
    unit, geometryRevision, meterWidth: number
        거리 단위의 world 길이, 마지막 도형 세대와 world 선폭이다.

UFastTerrainStampManagerState 부분 타입 명세
    app: U3dApp
    key: string
    externalScene: Scene | undefined
    onDispose: Function | undefined
    stamps: Set<UFastTerrainStamp>
    rows: Array<UFastTerrainStampRenderState>
    records: Array<UFastTerrainStampSnapshot>
    entries: Map<UFastTerrainStampRenderState, UFastTerrainStampSnapshot>
    pages: Array<WebGLArrayRenderTarget>
    slots: Array<Array<boolean>>
    dirty: boolean
    revision: number
    origin: Vector3
    originReady: boolean
    material: UFastTerrainStampMaterial
    baker: object | undefined
    receivers: Set<Object3D>
    visibleTiles: Map<U3dQuadTile, Object3D>
    stats: {updates: number, bakes: number, displayDraws: number}

```

## 4. 공통 처리 기준과 제약

```spec
고정 world XY snapshot으로 지형 위에 근사 표시한다. 최초 지형 교차의 원래 polygon과 경계는 CPU에서 보존한다.
앞·뒤 slice는 완성된 도형을 교체하는 장치이며 별도 비동기 CPU 지면 계산을 추가하지 않는다.
최초 page 하나의 RGBA16F 저장량은 약 256MiB이며 page는 관리자 수명 동안 재사용한다. 모든 숨김에서도 page를 유지하고 마지막 등록 제거 때 반납한다.
같은 앱의 Fast 도장만 서로 정렬한다. 일반 UTerrainStamp는 원래 경로로 유지하며 Fast는 선택된 지형 재질 위에 합성한다.
앱별 registry와 수명은 관리자가 소유한다. 지형 메시의 cached shader binding은 UTerrainMesh가 보존하고 새 관리자 자료에 연결한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
