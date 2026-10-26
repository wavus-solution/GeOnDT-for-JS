# UAnalyHeightLimit 명세

> 상태: 구현 관찰 초안

## 1. 개요

`UAnalyHeightLimit`는 영역·제한 높이로 `UHeightFilter`를 생성하고, 기존 모델·사용자 레이어·CustomModel 장면 및 이후 로드된 메시를 필터에 전달한다. 실제 영역 교차·높이 판정과 결과 이벤트는 `UHeightFilter`가 담당한다. 필터별 검색 재실행은 필터의 `find` 이벤트와 연결한다.

앱의 기본 분석 등록 및 `getAnalysis('HeightLimit')`에서 사용한다. `tutorial-official/analysisHeightLimit.html`은 영역 입력, 필터 생성·설정과 전체 제거의 대표 사용처다. 활성화는 로드 감시를 시작하고 비활성화는 감시를 해제하지만 필터·표시 장면을 제거하지 않는다.

## 3. 정규 자연어 수도코드

```spec
UAnalyHeightLimitCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            분석 이름이며 undefined이면 'HeightLimit'다.

UAnalyHeightLimitCO extends UAnalyCO 부분 타입 명세
    UAnalyHeightLimitCO_Content를 합성한 생성 옵션이다. 부모 생성에는 opt를 전달하지 않는다.

UAnalyHeightLimitFilterOptions 부분 타입 명세
    이 명세에서 사용하는 필드:
        id?: string
            중복되지 않는 필터 식별자이며 실제 생성에는 필요하다.
        geometry?: OLGeometry
            필터 영역의 다각형 도형이며 실제 생성에는 필요하다.
        height?: number
            제한 높이이며 실제 생성에는 필요하다.
        layers?: Array<string>
            대상 레이어 이름 목록이며 생략하면 필터가 레이어 이름을 제한하지 않는다.

UAnalyHeightLimit extends UAnaly 클래스 정의
    의존: UAnaly — 분석 상태·장면·앱 연결; 상속: {UAnaly}

    static OPT_KEYS: Array<string>
        부모 키 목록과 name을 결합한 생성 옵션 정규화 목록이다.
        의존: UAnaly — 부모 옵션 키; 속성 읽기: {OPT_KEYS}
    name: string = 'HeightLimit'
        분석 이름
    _poiGroup: UGroup
        부모의 그룹을 별도 객체로 대체하며 활성화 때 앱의 주석 장면에 연결한다.
    geometry: OLGeometry | undefined = undefined
        외부 쓰기를 허용하는 호환 상태이며 이 단위의 분석 경로에서는 읽지 않는다.
    selected: Array<UMesh> = 빈 배열
        외부 쓰기를 허용하는 호환 상태이며 필터 결과 저장소와 별개다.
    depth: number = 10
        외부 쓰기를 허용하는 호환 상태이며 extrudeOption.depth로 전달되지 않는다.
    extrudeOption: ExtrudeGeometryOptions
        steps 1, depth 1, bevelEnabled true와 bevelThickness·bevelSize·bevelOffset·bevelSegments 0인 객체다. 새 필터 생성에 현재 참조를 전달한다.
    materialOption: MeshLambertMaterialParameters
        opacity 0.5, side FrontSide, transparent true, color 0xff0000인 객체다. 새 필터 생성에 현재 참조를 전달한다.
    filters: Record<string, UHeightFilter> = 빈 객체
        ID별 필터 저장소이며 공개 접근·반환은 복사본이 아니다. 외부에서 항목이나 객체를 교체할 수 있고 후속 조회·탐색·제거는 현재 값을 읽는다.
    _loadedListeners: Record<string, Function> = 빈 객체
        레이어 이름별로 등록한 로드 콜백

    constructor(opt?: UAnalyHeightLimitCO)
        인터페이스: opt는 분석 이름을 전달한다.
        의존:
            UAnaly — 기본 분석 초기화; 생성자: {new UAnaly()}
            defaultValue — undefined 이름 대체; 함수: {defaultValue()}
            UGroup — 표시 그룹 생성; 생성자: {new UGroup()}
            normalizeOptionKeys — 생성 옵션의 호환 키 정규화; 함수: {normalizeOptionKeys()}
            THREE — 재질 기본 앞면; 상수: {FrontSide}
        동작:
            옵션 없이 부모를 생성하고 falsy opt를 빈 객체로 대체한 뒤 new.target 기준으로 옵션 키를 정규화한다.
            name에 undefined 기본값을 적용하고 별도 표시 그룹을 만든다.
            geometry·selected·depth와 두 스타일 객체를 위 초기값으로 생성한다.
            로드 리스너·선택 상태 _selected·필터 저장소를 각각 빈 객체로 만든다.

    override active() -> void
        의존:
            UAnaly — 활성 상태 전환과 연결 앱; 함수: {active()}; 속성 읽기: {_app}
            U3dApp — 표시 그룹 연결; 속성 읽기: {_sceneComment}
            Scene — 표시 그룹 부착; 함수: {add()}
        동작:
            부모 active를 현재 객체에 적용한다.
            _app이 falsy이면 종료한다.
            _app이 truthy이면 주석 장면에 표시 그룹을 추가하고 로드 감시를 등록한다.

    override deactive() -> void
        의존: UAnaly — 비활성 상태와 분석 이벤트 해제; 함수: {deactive()}
        동작:
            레이어의 로드 감시를 먼저 해제한다.
            부모 deactive를 현재 객체에 적용한다. 필터·표시 그룹은 제거하지 않는다.

    override clear() -> void
        동작: 아무 처리도 하지 않으며 부모 clear도 호출하지 않는다.

    addChange(callback: function(): void) -> void
        동작: 콜백을 저장하거나 호출하지 않고 아무 처리도 하지 않는다.

    removeChange(callback: function(): void) -> void
        동작: 콜백을 조회하거나 제거하지 않고 아무 처리도 하지 않는다.

    addFilter(options?: UAnalyHeightLimitFilterOptions) -> UHeightFilter | null
        인터페이스: geometry·height·id는 실제 생성에 필요하며 layers는 대상 레이어 이름 목록이다. 생략·falsy options도 런타임에서 빈 객체로 처리한다.
        의존:
            UAnaly — 연결 앱과 분석 장면; 속성 읽기: {_app, _scene}
            defined — null·undefined 검사; 함수: {defined()}
            __GError__ — 오류 보고; 함수: {__GError__()}
            UHeightFilter — 필터 생성·표시 메시·검색 재실행 이벤트; 생성자: {new UHeightFilter()}; 함수: {getMesh(), on()}; 속성 읽기: {id}
            Scene — 필터 메시 등록; 함수: {add()}
        동작:
            options가 falsy이면 빈 객체로 대체한다.
            geometry가 null·undefined이면 9144475 오류를 보고하고 null을 반환한다.
            height가 null·undefined이면 9144620 오류를 보고하고 null을 반환한다. 0은 허용한다.
            id가 null·undefined이거나 현재 filters[id]가 null·undefined이 아니면 9144817 오류를 보고하고 null을 반환한다. 빈 문자열 ID도 허용한다.
            id·geometry·height·layers, 연결 앱, 현재 돌출·재질 옵션 참조로 새 필터를 생성한다.
            필터 메시가 null·undefined이면 9145336 오류를 보고하고 null을 반환한다. 이미 생성한 필터를 별도로 정리하지 않는다.
            필터를 반환한 filter.id 키로 저장한다.
            현재 분석을 this로 고정하고 첫 인수를 이 필터로 고정한 검색 함수를 find 이벤트에 등록한다.
            분석 장면에 필터 메시를 추가한다.
            같은 필터로 현재 레이어를 즉시 검색하고 생성한 필터를 반환한다.
            생성·이벤트 등록·장면 추가·검색에서 발생한 예외는 그대로 전달하며 이미 반영한 상태는 되돌리지 않는다.

    removeFilter(filter: UHeightFilter | string) -> void
        동작: 문자열이면 그 값으로, 아니면 filter.id로 ID 제거를 호출하고 반환값은 전달하지 않는다.

    removeFilterById(name: string) -> void
        의존:
            UAnaly — 분석 장면; 속성 읽기: {_scene}
            defined — 필터 존재 검사; 함수: {defined()}
            Scene — UUID 검색과 분리; 함수: {getObjectByProperty(), remove()}
        동작:
            filters[name]이 null·undefined이면 종료한다.
            필터가 있으면 분석 장면에서 uuid가 name인 객체를 찾아 있으면 분리하고 filters[name]을 삭제한다.
            필터 결과 clear·이벤트 해제·geometry나 material 해제는 호출하지 않는다.

    removeFilterAll() -> void
        의존:
            UAnaly — 분석 장면; 속성 읽기: {_scene}
            defined — 메시 존재 검사; 함수: {defined()}
            UHeightFilter — 표시 메시·결과 초기화; 함수: {getMesh(), clear()}
            Scene — UUID 검색과 분리; 함수: {getObjectByProperty(), remove()}
        동작:
            시작 시점의 필터 키 목록을 순회하며 각 키의 현재 필터에서 메시를 얻는다.
            메시가 null·undefined이면 해당 항목의 이후 처리를 건너뛴다.
            메시가 있으면 그 uuid로 장면 객체를 찾아 있으면 분리하고 현재 키의 필터 결과를 clear한 뒤 해당 키를 삭제한다.
            정상 순회가 끝나면 filters를 새 빈 객체로 교체한다. 메시가 없던 항목도 이 교체로 등록부에서 사라진다.
            자원 dispose나 find 이벤트 해제는 하지 않으며 예외가 발생하면 나머지 처리와 최종 저장소 교체는 실행하지 않는다.

    getFilters() -> Record<string, UHeightFilter>
        동작: 현재 filters 객체 자체를 반환한다.

    getFiltersById(name: string) -> UHeightFilter | undefined
        동작: filters[name] 값을 그대로 반환하며 없는 키는 undefined다.

    _findAllLayer(filter: UHeightFilter) -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 모델·사용자 레이어·가상 모델 분석 조회; 함수: {getInstanceModelLayers(), getInstanceUserLayers(), getAnalysis()}
            UAnaly(CustomModel) — 가상 모델 장면; 속성 읽기: {_scene}
            defined — 분석·장면 존재 검사; 함수: {defined()}
            UDEF — 가상 모델 분석·장면 검증; 정적 함수: {assert()}
        동작:
            _app이 falsy이면 종료한다.
            _app이 truthy이면 다음을 수행한다.
                모델 레이어 목록 순서로 탐색하고, 선택적 사용자 레이어 조회가 null·undefined이면 빈 목록을 사용하여 이어서 탐색한다.
                CustomModel 분석과 그 장면이 null·undefined이 아닌지 assert하고 현재 장면 자식들을 순서대로 직접 탐색한다. assert 이후에도 별도 fallback은 없다.

    _findMeshRaw(scene: Object3D, filter?: UHeightFilter) -> void
        의존: defined — 필터 존재 검사; 함수: {defined()}
        동작:
            filter가 null·undefined이면 현재 필터 키 목록을 만들고 각 키의 필터가 null·undefined이 아닌 항목을 순서대로 선택한다.
            filter가 지정되었으면 그 필터만 선택한다.
    _findMesh(layer: U3dLayer, filter?: UHeightFilter) -> void
        의존:
            defined — 필터 존재 검사; 함수: {defined()}
            U3dLayer — 표시 상태·이름·장면; 함수: {getVisible(), getName(), getScene()}
            U3dMultipleComponentLayer — 컴포넌트 종류 판정·조회; 상속: {U3dMultipleComponentLayer}; 함수: {getComponents()}
            UHeightFilter — 레이어 허용 판정; 함수: {isIncludeLayer()}
        동작:
            layer.getVisible()이 falsy이면 종료한다.
            filter가 null·undefined이 아니면 단일 목록으로, 아니면 현재 filters의 값 목록으로 순회한다.
            필터가 null·undefined이거나 그 필터가 layer.getName()을 허용하지 않으면 건너뛴다.
            다중 컴포넌트 레이어이면 getComponents 결과가 falsy일 때 빈 배열로 대체한다.
                해당 컴포넌트 목록 처리가 끝나면 메서드를 반환하여 후속 필터는 처리하지 않는다. [확인 Q-001]
            일반 레이어이면 현재 필터마다 getScene()으로 표시 장면을 얻는다.
    _addLoadEventListener() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 현재 모델 레이어 조회; 함수: {getInstanceModelLayers()}
            U3dLayer — 이름별 로드 이벤트 등록; 함수: {getName(), addEventListener()}
            U3dEvent — 모델 로드 이벤트 이름; 상수: {MESH.LOADED}
            defined — 중복 리스너 검사; 함수: {defined()}
        동작:
            _app이 falsy이면 종료한다.
            _app이 truthy이면 다음을 수행한다.
                모델 레이어만 조회하고 순서대로 각 이름을 얻는다.
                같은 이름의 리스너가 null·undefined이 아니면 건너뛴다.
                새 이름이면 _loadedListener를 현재 분석에 bind한 함수를 이름별로 저장한 뒤 레이어 로드 이벤트에 등록한다. 사용자 레이어는 여기서 감시하지 않는다.

    _removeLoadListeners() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 이름별 현재 레이어 조회; 함수: {getLayerByName()}
            U3dLayer — 로드 이벤트 해제; 함수: {removeEventListener()}
            U3dEvent — 모델 로드 이벤트 이름; 상수: {MESH.LOADED}
            defined — 레이어 존재 검사; 함수: {defined()}
        동작:
            앱이 falsy이면 저장한 리스너도 유지하고 종료한다.
            앱이 truthy이면 시작 시점의 리스너 이름들을 현재 앱에서 조회한다.
            레이어가 null·undefined이면 건너뛰고 아니면 해당 이름에 저장한 콜백을 로드 이벤트에서 해제한다.
            정상 순회가 끝나면 리스너 저장소를 새 빈 객체로 교체한다. 중간 예외는 그대로 전달한다.

    _loadedListener(e: DispatchInputEvent) -> void
        의존: UHeightFilter — 로드 메시 분석; 함수: {match()}
        동작: e.data를 그대로 메시로 사용하여 시작 시점의 필터 키 목록을 순회하고 각 키의 현재 필터에 match를 호출한다. 별도 표시·레이어 검증 없이 전달하며 중간 예외는 후속 호출을 중단한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
