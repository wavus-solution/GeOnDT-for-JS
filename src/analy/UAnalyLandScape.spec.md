# UAnalyLandScape 명세

> 상태: 구현 관찰 초안

## 1. 개요

조망시점은 카메라가 위치할 곳, 조망점은 카메라가 바라볼 곳이다. `UAnalyLandScape`는 두 목록의 등록·조회·설정·삭제, 가시영역 표시, 선택한 건물의 층별 관측점 생성과 카메라 이동·회전을 담당한다. 관측점 표시는 `ViewPoint`·POI, 가시영역 생성·충돌 표시는 `UViewBox`에 맡긴다.

앱의 기본 분석 등록과 `getAnalysis('LandScape')`에서 사용한다. `tutorial-official/landscape.html`, `tutorial-official/analysisView.html`이 직접 사용처다. 앱은 부모의 `setApp()`으로 연결하고, `active()`·`deactive()`·`clear()`는 서로 다른 수명 단계를 제공한다.

## 3. 정규 자연어 수도코드

```spec
UAnalyLandScapeCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            분석 이름이며 기본값은 'LandScape'다.
        floorHeight, floorZOffset, startOffsetDistance?: number
            층 높이·층 높이 보정·가시영역 시작 보정이며 기본값은 각각 3·0.5·5다.
        lineAzimuth, linePolar, lineMinDistance, lineMaxDistance?: number
            기본값은 각각 50·0·300·10000이다.
        lineColor?: string
            가시영역 기본 색상이며 '#f25f5c'다.
        lineOpacity, lineInterval?: number
            기본값은 각각 0.5·0.5다.
        viewBoxHeight?: number
            가시영역 높이며 기본값은 undefined다.
UAnalyLandScapeCO extends UAnalyCO 부분 타입 명세
    UAnalyLandScapeCO_Content를 합성하며 부모 생성에는 options를 전달하지 않는다.
UViewPointCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        position?: U3dMouseEvent | Vector3 | Vector3Like
            클릭 이벤트·월드 위치 Vector3·위경도 일반 객체 중 하나이며 생성하려면 값이 필요하다.
        name, color, image, label?: string
            관측점 이름과 POI 색상·이미지 주소·라벨이다.
        imageSize?: number
            POI 이미지 크기다.
        imageOffset, labelOffset?: Vector2Like
            POI 이미지·라벨 표시 보정이다.
UComputeFloorCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        floorHeight, offsetHeight?: number
            undefined이면 현재 floorHeight·floorZOffset을 같은 옵션 객체에 대입한다.
        name?: string
            첫 '{floor}'를 층수로 바꾸는 이름이며 기본값은 '{floor}층'이다.
        color, image?: string
            생성 POI의 색상·이미지다.
        imageOffset, labelOffset?: Vector2Like
            imageOffset만 생성에 전달하며 labelOffset은 읽지 않는다.
        imageSize?: number
            생성 POI의 이미지 크기다.
UViewTargetByViewPointCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        azimuth, polar, distance?: number
            모두 null·undefined가 아니어야 생성하며 값의 범위는 검증하지 않는다.
UViewTargetByViewPointCO extends UViewPointCO 부분 타입 명세
    UViewTargetByViewPointCO_Content를 합성한 조망점 생성 입력이다.
UAnalyLandScapeUpdateCallback 함수 타입 정의
    (vp: ViewPoint, viewTargetKey: string | number, event: unknown) -> void
    인터페이스: 카메라 fly 이벤트마다 시점 객체·보정된 조망점 키·이벤트를 받으며 receiver를 지정하지 않는다.
UAnalyLandScapeAnimationCallback 함수 타입 정의
    (vp: ViewPoint | undefined, vt: ViewPoint | undefined) -> void
    인터페이스: this는 분석 객체이며 알림 시점의 두 관측점을 받는다. 전체 종료 직후 vt는 undefined일 수 있다.
UAnalyLandScapeAnimateCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        onStart, onEnd, onComplete?: UAnalyLandScapeAnimationCallback
            이동 시작·이행·전체 종료 알림이다.
        onUpdate?: UAnalyLandScapeUpdateCallback
            카메라 fly 이벤트 알림이다.
UAnalyLandScapeLineOptions_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        azimuth, polar, distance, opacity, startOffset?: number
            undefined이면 각각 현재 lineAzimuth·linePolar·lineMinDistance·lineOpacity·startOffsetDistance를 사용한다.
        color?: ColorRepresentation
            undefined이면 현재 lineColor를 사용한다.
        angle?: number
            호환 입력이며 현재는 읽지 않는다.
UAnalyLandScapeLineOptions extends UAnalyLandScapeLineOptions_Content 부분 타입 명세
    임의의 문자열 키와 unknown 값을 함께 허용하며 입력 원본에 가시영역 생성 자료를 보충한다.
UAnalyLandScapeBuilding 부분 타입 명세
    이 명세에서 사용하는 필드:
        position: Vector3
            geometry 경계 경로에서 z를 더하는 객체 위치다.
        getBBox?: function(): Box3
            _bbox 조회보다 먼저 호출하는 경계 갱신 함수다.
        _bbox?: Box3
            있으면 min.z만 기준으로 사용한다.
        geometry?: BufferGeometry
            _bbox가 없을 때 boundingBox를 조회·계산하는 대상이다.
UAnalyLandScapeCollision_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        point?: Vector3
            선분 끝점으로 재사용하는 교차점 원본이다.
        object?: Object3D
            교차 객체다.
UAnalyLandScapeCollision extends UAnalyLandScapeCollision_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        distance: number
            가장 가까운 교차점 선택을 위한 비교 거리다.
UTweenChain 부분 타입 명세
    UTween의 체이닝 타입 보존용이며 런타임 객체를 만들지 않는다.

UAnalyLandScape extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반 기능; 상속: {UAnaly}

    static OPT_KEYS: Array<string>
        부모 키와 name·층별 높이·가시영역 생성 옵션의 정본 카멜 표기를 결합한다.
        의존: UAnaly — 부모 정규화 목록; 속성 읽기: {OPT_KEYS}
    static EVENT: Record<string, string>
        부모 EVENT 속성에 MOVE_END: 'moveEnd'를 더한 변경 가능한 객체다.
    name: string = 'LandScape'
        생성 옵션으로 정하는 분석 이름이며 외부 쓰기를 허용한다.
    isClicked: boolean = false
        외부 쓰기를 허용하는 호환 상태이며 이 단위의 활성 경로에서는 읽지 않는다.
    floorHeight: number = 3
        이후 층별 생성의 기본 높이 간격이다.
    floorZOffset: number = 0.5
        이후 층별 생성의 기본 높이 보정이다.
    startOffsetDistance: number = 5
        이후 drawLine의 시작 보정 기본값이다.
    lineAzimuth: number = 50
        이후 drawLine의 방위각 기본값이다.
    linePolar: number = 0
        이후 drawLine의 상하각 기본값이다.
    lineMinDistance: number = 300
        이후 drawLine의 거리 기본값이다.
    lineMaxDistance: number = 10000
        보존하는 호환 설정이며 drawLine에는 사용하지 않는다.
    lineDistance: number | undefined = undefined
        detectCollision의 충돌 거리 비교 초기값이며 null·undefined이면 Infinity다.
    lineColor: string = '#f25f5c'
        이후 drawLine의 색상 기본값이다.
    lineOpacity: number = 0.5
        이후 drawLine의 불투명도 기본값이다.
    lineInterval: number = 0.5
        보존하는 호환 설정이며 drawLine에는 사용하지 않는다.
    selectPoiOptions: object
        인스턴스가 공유하는 변경 가능한 선택 POI 옵션이다. 초기 label은 '선택지점', imageOffset은 (0,0), labelOffset은 (0,-10)이며 두 중첩 객체는 DEFAULT_POI_OPT와 공유한다.
    isSelected: boolean = false
        건물 선택 상태이며 외부 쓰기를 허용한다.
    viewBoxHeight: number | undefined = undefined
        이후 drawLine에서 사용하는 상자 높이다.
    _viewPoints, _viewTargets: Array<ViewPoint> = 빈 배열
        관측점 저장소이며 외부에 실제 배열을 반환한다.
    _viewPointIdx, _viewTargetIdx: number = -1
        현재 관측점 인덱스이며 삭제할 때 보정하지 않는다.
    _viewbox: UViewBox | undefined = undefined
        실제 가시영역이며 _viewBox와 별개다.
    _points: Double_Array<Vector3> = 빈 배열
        충돌 검사 선분 목록이며 drawLine은 이 목록을 채우지 않는다.
    _selected: Object3D | undefined = undefined
        선택 건물이다.
    _selectedViewPoint: ViewPoint | undefined = undefined
        선택 지점의 임시 관측점이다.
    #selectionMaterials: Array<Material> = 빈 배열
        선택 표시를 위해 이 분석이 복제하여 소유한 재질이며 원본 재질·texture는 소유하지 않는다.
    _currentTweenPromise: DeferredPromise<void> | undefined = undefined
        flyTo 완료·중단에 사용하는 deferredPromise다.

    constructor(options?: UAnalyLandScapeCO)
        의존:
            UScene(_renderScene) — 초기 선분 연결; 함수: {add()}
            normalizeOptionKeys — 생성 옵션 표기 정규화; 함수: {normalizeOptionKeys()}
            UAnaly — 부모 초기화; 생성자: {new UAnaly()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UScene — 자체 표시 장면; 생성자: {new UScene()}
            UGroup — POI 표시 그룹; 생성자: {new UGroup()}
            THREE — 초기 선분; 생성자: {new LineBasicMaterial(), new BufferGeometry(), new BufferAttribute(), new Line()}
        동작:
            falsy options를 빈 객체로 대체한 뒤 new.target의 OPT_KEYS로 정규화하고 부모를 인수 없이 초기화한다.
            이름·분석 설정은 공개 필드의 기본값을 undefined에만 적용한다.
            관측점 배열과 인덱스, 선택 상태·회전 핸들을 초기화하고 공유 선택 POI 옵션을 참조한다.
            렌더 장면과 선분 재질·geometry·6요소 Float32 위치 속성·선분 객체를 생성하여 장면에 연결하고 POI 그룹을 만든다.
    select(active: boolean) -> void
        의존:
            U3dApp — 클릭 등록; 함수: {on()}
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            이전 클릭 키가 있으면 해제한다.
            active가 참이면 click에 건물 선택 콜백을 등록한다.
            active가 거짓이면 클릭 키를 다시 해제하고 현재 선택을 해제한다.
    clearSelect() -> void
        의존:
            UGroup(_pointGroup) — 임시 POI 분리; 함수: {remove()}
            U3dPOI — 임시 표시 해제; 함수: {hide(), dispose()}
            THREE.Material — 선택 표시용 복제 재질 해제; 함수: {dispose()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            #selectionMaterials의 복제 재질 목록을 따로 보관하고 #selectionMaterials를 빈 배열로 교체하여 재진입 시 중복 해제를 막는다.
            _selected가 있으면 선택 전 _originMaterial의 원본 참조를 material에 복원하고 _originMaterial·_selected를 undefined, isSelected를 false로 바꾼다.
            _selectedViewPoint가 있으면 POI를 숨기고 해제·분리한 뒤 _selectedViewPoint를 undefined로 바꾼다.
            따로 보관한 복제 재질만 해제하며 원본 재질과 공유 texture는 해제하지 않는다.
    override getAnalysisOption() -> object
        동작: floorZOffset, startOffsetDistance, lineAzimuth, linePolar, lineMinDistance, lineColor, lineOpacity, lineInterval의 현재 값만 새 객체로 반환한다.
    override setAnalysisOption(options: UAnalyLandScapeCO = {}) -> void
        의존: defaultValue — 누락 값 유지; 함수: {defaultValue()}
        동작: 조회하는 여덟 설정과 viewBoxHeight만 입력의 undefined일 때 현재 값을 유지하여 저장하며 floorHeight·lineMaxDistance·name은 적용하지 않는다.
    override active() -> void
        의존:
            UScene(주석 장면) — POI 그룹 연결; 함수: {add()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 속성 읽기: {_app}; 함수: {active()}
            U3dApp — 주석 장면; 함수: {getSceneComment()}
        동작: 부모를 활성화하고 _app이 있으면 주석 장면에 POI 그룹을 추가한다.
    override deactive() -> void
        의존:
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 속성 읽기: {_app}; 함수: {deactive()}
            U3dApp — 카메라 모드; 함수: {setPanMode()}
        동작:
            부모를 비활성화한 뒤 회전 핸들의 중단을 요청한다.
            _app이 있으면 pan 모드로 바꾸며 관측점·가시영역은 지우지 않는다.
    override clear() -> void
        의존:
            UScene(주석 장면) — POI 그룹 분리; 함수: {remove()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 속성 읽기: {_app}; 함수: {update()}
            U3dApp — 주석 장면과 갱신 시각; 함수: {getSceneComment(), setUpdateDate()}
        동작:
            가시영역·시점·조망점·선택·클릭 키를 순서대로 정리한다.
            _app의 주석 장면에서 POI 그룹을 분리하고 갱신한 뒤 _app이 있으면 갱신 시각을 바꾼다.
            이동·회전·순회 예약 타이머는 이 메서드에서 중단하지 않는다. [확인 Q-004]
    isBuilding() -> boolean
        동작: _building이 undefined가 아니면 true를 반환하며 _selected·isSelected는 검사하지 않는다.
    drawLine(viewPointKey?: number | string, viewTargetKey?: number | string, options?: UAnalyLandScapeLineOptions) -> void
        인터페이스: options는 보충한 기본값과 start·end·height·app이 원본에 기록되는 입력이다.
        의존:
            UScene(_scene) — 가시영역 교체; 함수: {remove(), add()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 속성 읽기: {_scene, _app, _drawArg}; 함수: {update()}
            defined — null·undefined 판정; 함수: {defined()}
            defaultValue — 기본값; 함수: {defaultValue()}
            UViewBox — 생성과 충돌; 생성자: {new UViewBox()}; 함수: {detectCollision()}; 속성 읽기: {mesh}
            UDrawArg — 충돌 장면; 함수: {getInstanceScenesFromModelAndTerrainLayers()}
        동작:
            undefined 키를 현재 인덱스로 대체해 두 관측점을 조회하고 하나라도 없으면 종료한다.
            options 또는 새 객체에 azimuth·polar·distance·color·opacity·startOffset을 현재 설정으로 보충한다.
            기존 _viewbox가 있으면 mesh만 장면에서 분리한다.
            두 위치의 복사본·현재 높이·앱을 같은 옵션 객체에 대입해 UViewBox를 생성하고 장면에 연결한다.
            _drawArg가 제공하는 모델·지형 장면으로 충돌 검사를 요청한 뒤 갱신한다.
            angle은 읽지 않으며 생성 옵션의 기본값은 현재 공개 설정 필드에서 얻는다.
    removeLines() -> void
        의존:
            UScene(_scene) — 가시영역 분리; 함수: {remove()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}; 속성 읽기: {_scene}
            defined — null·undefined 판정; 함수: {defined()}
        동작: _viewbox가 있으면 mesh를 분리하고 참조를 비운 뒤 갱신한다. UViewBox 자원 해제는 호출하지 않는다.
    detectCollision() -> void
        의존:
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_drawArg}
            defined — null·undefined 판정; 함수: {defined()}
            Web API — 작업 예약·취소; 함수: {setTimeout(), clearTimeout()}
            UDrawArg — 모델 장면; 함수: {getInstanceScenesFromModelLayers()}
        동작:
            모듈 공유 workerID의 타이머가 있으면 취소하고 1밀리초 후 작업으로 교체한다.
            교차 point가 있으면 선분 끝점 참조를 그 point로 바꾸고 작업 종료 후 workerID를 비운다.
            빈 _points는 충돌 계산을 하지 않으며 여러 인스턴스가 예약 키를 공유한다.

    getViewPointList() -> Array<ViewPoint>
        동작: _viewPoints 원본 배열을 반환한다.
    getViewTargetList() -> Array<ViewPoint>
        동작: _viewTargets 원본 배열을 반환한다.
    getViewPointParams() -> Array<object>
        의존: ViewPoint — 저장 입력; 함수: {getParameter()}
        동작: 조망시점 순서대로 getParameter 결과를 모은 새 배열을 반환한다.
    getViewTargetParams() -> Array<object>
        의존: ViewPoint — 저장 입력; 함수: {getParameter()}
        동작: 조망점 순서대로 getParameter 결과를 모은 새 배열을 반환한다.
    setViewPoint(key: string | number, skipfly?: boolean, onUpdateCallback?: UAnalyLandScapeUpdateCallback) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            조회한 시점이 있으면 배열 인덱스를 저장한다.
            skipfly가 falsy이면 기존 이동을 중단하고 현재 인덱스 쌍으로 이동을 요청하며 Promise는 반환하지 않는다.
    setViewTarget(key: string | number, skipfly?: boolean) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            조회한 조망점이 있으면 배열 인덱스를 저장한다.
            skipfly가 falsy이면 기존 이동을 중단하고 현재 인덱스 쌍으로 이동을 요청하며 Promise는 반환하지 않는다.
    getCurrentViewPoint() -> ViewPoint | undefined
        동작: _viewPoints의 _viewPointIdx 위치를 반환하며 범위 밖이면 undefined다.
    getCurrentViewTarget() -> ViewPoint | undefined
        동작: _viewTargets의 _viewTargetIdx 위치를 반환하며 범위 밖이면 undefined다.
    addViewPoint(options: UViewPointCO) -> ViewPoint | undefined
        의존:
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}
        동작: addViewPoint_ 결과를 얻은 뒤 성공 여부와 무관하게 다시 갱신하고 결과를 반환한다.
    addViewPoint_(options: UViewPointCO) -> ViewPoint | undefined
        의존:
            UGroup(_pointGroup) — POI 연결; 함수: {add()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}
            defined — null·undefined 판정; 함수: {defined()}
            Web API — 중복 진단; 함수: {console.error()}
        동작:
            입력으로 관측점을 만들고 생성되지 않으면 종료한다.
            같은 이름의 시점이 있으면 오류를 출력하고 종료한다.
            POI를 그룹·관측점을 시점 목록에 등록하고 갱신한 뒤 관측점을 반환한다.
    addViewTarget(options: UViewPointCO) -> ViewPoint | undefined
        의존:
            UGroup(_pointGroup) — POI 연결; 함수: {add()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}
            defined — null·undefined 판정; 함수: {defined()}
            Web API — 중복 진단; 함수: {console.error()}
        동작:
            관측점을 만들고 생성되지 않으면 종료한다.
            같은 이름의 조망점이 있으면 오류를 출력하고 종료한다.
            POI를 그룹·관측점을 조망점 목록에 등록하고 갱신한 뒤 관측점을 반환한다.
    getViewPoint(key: string | number | ViewPoint) -> ViewPoint | undefined
        동작: 시점 목록의 키에 해당하는 객체를 반환한다.
    getViewTarget(key: string | number | ViewPoint) -> ViewPoint | undefined
        동작: 조망점 목록의 키에 해당하는 객체를 반환한다.
    removeViewPoint(key: string | number) -> void
        의존:
            UGroup(_pointGroup) — POI 분리; 함수: {remove()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}
            defined — null·undefined 판정; 함수: {defined()}
            U3dPOI — 표시 해제; 함수: {hide(), dispose()}
        동작:
            조회 결과가 없으면 종료한다.
            POI를 숨기고 해제·분리한 뒤 시점 배열에서 제거하고 갱신한다.
    removeViewTarget(key: string | number) -> void
        의존:
            UGroup(_pointGroup) — POI 분리; 함수: {remove()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}
            defined — null·undefined 판정; 함수: {defined()}
            U3dPOI — 표시 해제; 함수: {hide(), dispose()}
        동작:
            조회 결과가 없으면 종료한다.
            POI를 숨기고 해제·분리한 뒤 조망점 배열에서 제거하고 갱신한다.
    removeAllViewPoints() -> void
        의존:
            UGroup(_pointGroup) — POI 분리; 함수: {remove()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}
            U3dPOI — 표시 해제; 함수: {hide(), dispose()}
        동작: 현재 시점 배열을 인덱스 순회해 각 POI를 숨기고 해제·분리한 뒤 새 빈 배열로 저장소를 교체하고 갱신한다.
    removeAllViewTargets() -> void
        의존:
            UGroup(_pointGroup) — POI 분리; 함수: {remove()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}
            U3dPOI — 표시 해제; 함수: {hide(), dispose()}
        동작: 현재 조망점 배열을 인덱스 순회해 각 POI를 숨기고 해제·분리한 뒤 새 빈 배열로 저장소를 교체하고 갱신한다.
    show() -> void
        의존: ViewPoint — 표출; 함수: {show()}
        동작: 시점 목록 다음 조망점 목록을 인덱스 순회하여 show(true)를 호출한다.
    hide() -> void
        의존: ViewPoint — 표출; 함수: {show()}
        동작: 시점 목록 다음 조망점 목록을 인덱스 순회하여 show(false)를 호출한다.
    goToViewPoint(key: string | number, distance?: number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작: falsy distance를 500으로 대체하고 시점이 있으면 그 위치의 위쪽 이동을 요청한다.
    goToViewTarget(key: string | number, distance?: number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작: falsy distance를 500으로 대체하고 조망점이 있으면 그 위치의 위쪽 이동을 요청한다.
    #goToPoint(target: Vector3, distance: number) -> void
        의존:
            U3dApp — 카메라 이동; 함수: {flyToPosition()}
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
        동작: target 복사본의 z에 distance를 더하고 _app이 있으면 그 위치에서 원본 target을 보는 이동을 요청한다.
    addViewTargetByViewPoint(viewPointKey: string | number, options: UViewTargetByViewPointCO) -> void
        의존:
            UGroup(_pointGroup) — 새 조망점 POI 연결; 함수: {add()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 함수: {update()}
            defined — null·undefined 판정; 함수: {defined()}
            ViewPoint — 직접 생성; 생성자: {new ViewPoint()}
            defaultValue — 스타일 상속; 함수: {defaultValue()}
        동작:
            azimuth·polar·distance 중 하나라도 null·undefined이거나 원본 시점이 없으면 종료한다.
            name·label·color는 입력을 쓰고 image·imageSize·imageOffset·labelOffset은 undefined이면 원본 POI에서 가져와 ViewPoint를 직접 만든다.
            중복 검사·geoPosition 변환·change 등록 없이 POI 그룹과 조망점 목록에 추가하고 갱신한다.
    resetView() -> void
        의존:
            U3dApp — 모드 복귀; 함수: {setPanMode()}; 속성 읽기: {_mapControl}
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
        동작: _app이 없으면 종료하며 lookAt 모드일 때만 pan 모드로 바꾸고 시점 인덱스 0·조망점 인덱스 -1로 초기화한다.
    nextViewPoint(onUpdateCallback?: UAnalyLandScapeUpdateCallback) -> Promise<void> | undefined
        동작: 시점 인덱스가 목록 길이-1보다 작으면 증가시켜 flyTo 결과를 반환하고 아니면 undefined를 반환한다.
    prevViewPoint(onUpdateCallback?: UAnalyLandScapeUpdateCallback) -> Promise<void> | undefined
        동작: 시점 인덱스가 0보다 크면 감소시켜 flyTo 결과를 반환하고 아니면 undefined를 반환한다.
    nextViewTarget(onUpdateCallback?: UAnalyLandScapeUpdateCallback) -> Promise<void> | undefined
        동작: 조망점 인덱스가 목록 길이-1보다 작으면 증가시켜 flyTo 결과를 반환하고 아니면 undefined를 반환한다.
    prevViewTarget(onUpdateCallback?: UAnalyLandScapeUpdateCallback) -> Promise<void> | undefined
        동작: 조망점 인덱스가 0보다 크면 감소시켜 flyTo 결과를 반환하고 아니면 undefined를 반환한다.
    flyTo(viewPointKey: string | number, viewTargetKey: string | number, onUpdateCallack?: UAnalyLandScapeUpdateCallback) -> Promise<void> | undefined
        인터페이스: onUpdateCallack은 시점 객체·보정된 조망점 키·fly 이벤트를 받으며 receiver를 지정하지 않는다.
        의존:
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp(app) — 이동·모드; 함수: {setMode(), stopFly(), flyToPosition()}; 속성 읽기: {_mapControl, _currentTween}
            UDEF — 경관 모드; 상수: {APP_MODE._LANDSCAPE}
            UEventDispatcher — 제어 이벤트; 함수: {addEventListener(), removeEventListener()}
            deferredPromise — 완료 제어; 함수: {deferredPromise()}
        동작:
            _app이 없으면 undefined를 반환하며 기존 모드가 lookAt이 아니면 키 검사보다 먼저 상태 저장·경관 모드 전환을 한다.
            _app이 있으면 -1 키만 0으로 바꾸어 조회하고 하나라도 없으면 undefined를 반환한다.
            두 인덱스를 저장하고 경관·lookAt 모드로 바꾼 뒤 기존 핸들을 stop·기존 deferredPromise를 reject한다. 앱의 이전 이동도 새 리스너를 등록하기 전에 stopFly로 중단한다.
            새 deferredPromise를 만들고 flyend·fly·flystop에 콜백을 등록한다.
            flyend는 flyend·fly·flystop 리스너를 모두 제거해 resolve한다.
            flystop은 세 리스너를 모두 제거하고 UAbortError로 거절한다. 새 이동·stopAnimate도 이전 Promise를 UAbortError로 거절하며 리스너를 정리한다.
            원본 시점·새 목표로 앱 이동을 요청하고 현재 요청이 미완료이면 앱의 _currentTween을 이동 시작 직후 저장한다. 앱 이동의 동기·비동기 실패도 반환 Promise로 전달한다.
            새 deferredPromise를 저장하고 반환하며 앱 Promise의 이행 자체가 반환 Promise의 완료는 아니다.
    animate(options?: UAnalyLandScapeAnimateCO) -> void
        동작: falsy options를 빈 객체로 바꾸어 순회를 시작하며 완료 Promise는 반환하지 않는다.
    #animate_(options: UAnalyLandScapeAnimateCO) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            Web API — 다음 이동 예약; 함수: {setTimeout()}
            UAnalyLandScapeAnimateCO — 사용자 콜백; 콜백: {onStart, onEnd, onComplete}
        동작:
            다음 조망점 이동 결과가 없으면 조망점 인덱스를 0으로 저장한 뒤 다음 시점 이동을 요청한다.
            다시 결과가 없으면 시점 인덱스 0·조망점 인덱스 -1로 초기화한 뒤 함수인 onComplete를 this와 현재 두 관측점으로 호출하고 종료한다.
            이동이 있으면 함수인 onStart를 this와 현재 두 관측점으로 호출한다.
            현재 관측점 조회는 즉시 호출과 완료 callback 안 호출을 모두 사용한다.
            이동 Promise 이행 시 함수인 onEnd를 같은 방식으로 호출한 뒤 2500밀리초 후 자기 자신을 예약한다.
            이동 거절은 다음 순회를 예약하지 않으며 UAbortError 외 오류는 진단한다. 예약 키는 저장하지 않는다. [확인 Q-004]
    stopAnimate() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작: 현재 핸들이 있으면 stop·현재 deferredPromise가 있으면 reject하며 순회 예약 타이머는 취소하지 않는다. [확인 Q-004]
    computeViewPointByFloor(start: number, end: number, options?: UComputeFloorCO) -> Array<ViewPoint>
        동작: 시점 저장소를 대상으로 층별 생성 결과를 반환한다.
    computeViewTargetByFloor(start: number, end: number, options?: UComputeFloorCO) -> Array<ViewPoint>
        동작: 조망점 저장소를 대상으로 층별 생성 결과를 반환한다.
    #computeViewPointByFloor(ary: Array<ViewPoint>, start: number, end: number, options?: UComputeFloorCO) -> Array<ViewPoint>
        의존:
            UGroup(_pointGroup) — 층별 POI 연결; 함수: {add()}
            defaultValue — 층별 기본값; 함수: {defaultValue()}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            falsy options는 공유 DEFAULT_POI_OPT로 대체하고 floorHeight·offsetHeight의 undefined를 현재 설정으로 보충해 같은 객체를 변경한다.
            start부터 end까지 양끝을 포함해 floorHeight*(층-1)+기준 높이+offsetHeight를 높이로 구한다.
            첫 '{floor}'를 층수로 바꾸고 ary가 조망점 저장소이면 조망점 목록, 아니면 시점 목록에서 중복 이름 접미사를 찾는다.
            임시 선택 관측점의 위치 복사본 z를 산출 높이로 바꾸고 스타일·이름·라벨로 관측점을 만든다. 반복이 실행되는데 임시 선택 관측점이 없으면 오류가 발생한다.
            생성 결과가 있으면 POI 그룹·ary·새 결과 배열에 같은 관측점 참조를 추가한다.
            반복 후 선택을 해제하고 결과 배열을 반환한다.
    #checkDupleName(name: string, type: 'viewPoint' | 'viewTarget', suffix: number) -> string
        동작:
            suffix가 0이면 원래 이름, 아니면 이름+'-'+suffix를 검사한다.
            type에 따라 시점·조망점을 조회해 없으면 검사 이름을 반환한다.
            중복이면 suffix를 1 늘려 재귀 호출한 결과를 반환한다.
    getBuildingHeight() -> number | undefined
        의존:
            선택 건물(_selected) — 동적 경계 조회; 함수: {getBBox()}
            defined — null·undefined 판정; 함수: {defined()}
        동작: _selected가 없거나 선택 객체 getBBox 결과가 null·undefined이면 undefined를 반환하고 아니면 max.z-min.z를 반환한다.
    flyToClick() -> void
        의존:
            U3dApp — 클릭 등록; 함수: {on()}
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            _clickId가 있으면 기존 클릭 키를 해제한다.
            _app이 있으면 클릭 이동 콜백을 등록한다.
    #flyToClick_(e: U3dMouseEvent) -> void
        의존:
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 속성 읽기: {_app}; 함수: {dispatchEvent()}
            U3dApp — 클릭 이동·모드; 함수: {flyToClick(), setMode()}; 속성 읽기: {_mapControl}
            UDEF — 경관 모드; 상수: {APP_MODE._LANDSCAPE}
        동작:
            _app이 없으면 종료하고 클릭 이동 요청·경관 모드 전환·상태 저장을 순서대로 한다.
            _app이 있으면 클릭 키를 해제하고 EVENT.MOVE_END를 즉시 알리며 실제 이동 완료는 기다리지 않는다.
    rotationToClick(repeat: boolean = true, height: number = 200, duration: number = 10000, slow: number = 1) -> void
        의존:
            U3dApp — 클릭 등록; 함수: {on()}
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            _clickId가 있으면 이전 클릭 키를 해제한다.
            _app이 있으면 입력을 바인딩한 클릭 회전 콜백을 등록한다.
    #rotationToClick_(repeat: boolean, height: number, duration: number, slow: number, e: U3dMouseEvent) -> void
        의존:
            U3dApp — 클릭 위치; 함수: {closestPointAtPixel()}
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
        동작: _app에서 가장 가까운 클릭 위치를 얻어 회전을 시작한 뒤 클릭 키를 해제한다.
    #clearClick() -> void
        의존:
            U3dApp — 클릭 해제; 함수: {unkey()}
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
        동작: _app이 있으면 현재 키의 null·undefined를 undefined로 바꾸어 click 해제를 요청한 뒤 키를 비운다.
    startFlyRotation(position: WorldPositionVector3, repeat: boolean = true, height: number = 200, duration: number = 10000, slow: number = 1, size?: number) -> UTween | undefined
        의존:
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_drawArg}
            defined — null·undefined 판정; 함수: {defined()}
            UDrawArg — 카메라·제어 객체; 함수: {getCamera(), getCameraControl()}
            UTween — 회전 진행; 생성자: {new UTween()}; 함수: {to(), onStart(), onComplete(), onUpdate(), repeat(), start()}
        동작:
            position이 null·undefined이면 종료한다.
            position이 있고 _tween이 있으면 기존 회전 핸들에 먼저 중단을 요청한다.
            _drawArg 또는 카메라가 없으면 undefined를 반환한다.
            distance 0→1의 UTween에 _drawArg·fps 30을 전달한다.
            카메라 z에 height를 더하고 control.target에 copy가 있으면 중심을 복사하며 아니면 중심 복사본으로 교체한 뒤 control.update와 camera.lookAt을 실행한다.
            완료 시 repeat가 falsy일 때만 _tween을 비우며 repeat가 참이면 Infinity 반복을 지정한 뒤 start하고 현재 핸들을 반환한다.
    stopFlyRotation() -> void
        의존:
            UTween — 중단; 함수: {stop()}
            defined — null·undefined 판정; 함수: {defined()}
        동작: 현재 _tween이 있으면 인스턴스의 stop을 호출하여 회전을 중단하고 참조를 비운다.
    #createViewPoint(options: UViewPointCO) -> ViewPoint | undefined
        의존:
            THREE — 월드 위치의 instanceof 판정; 속성 읽기: {Vector3}
            UAnaly — 상속받은 분석 연결·갱신; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
            Web API — 필수 입력 진단; 함수: {console.error()}
            U3dApp — 교차·좌표 변환; 함수: {intersectAtPixel(), vector3ToGeoGraphic(), geographicToVector3(), setUpdateDate()}
            U3dMouseEvent 모듈 — 클릭 이벤트의 instanceof 판정; 속성 읽기: {U3dMouseEvent}
            ViewPoint — 관측점 생성; 생성자: {new ViewPoint()}
            U3dPOI — 변경 이벤트; 함수: {on()}
        동작:
            options 또는 position이 null·undefined이면 오류를 출력하고 종료하며 _app이 없어도 종료한다.
            _app이 있고 options와 position이 존재하는 경우:
                position이 U3dMouseEvent이고 첫 교차점이 있으면 면 보정한 원본 교차점을 options.position으로 저장하고 변환한 geoPosition도 같은 options에 기록한다.
                클릭 교차점이 없으면 생성하지 않고 종료한다.
            Vector3이면 원본 position 참조를 유지하고 geoPosition만 기록한다.
            나머지 일반 객체면 원본을 geoPosition에 저장하고 geographicToVector3 결과로 position을 교체한다.
            같은 options로 ViewPoint를 생성하고 POI change에 _app의 갱신 시각을 바꾸는 콜백을 등록한 뒤 관측점을 반환한다.
    #select_(e: U3dMouseEvent) -> void
        의존:
            UGroup(_pointGroup) — 선택 위치 POI 연결; 함수: {add()}
            UAnaly — 기반 분석의 상태·장면·이벤트·갱신; 속성 읽기: {_app}; 함수: {dispatchEvent()}
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 교차 조회; 함수: {intersectAtPixel()}
            UDEF — 건물 판정; 상수: {UMESH_TYPE._building}
            THREE.Material — 선택 표시용 복제와 실패 시 소유 자원 정리; 함수: {clone(), dispose()}
            THREE.Color — 복제 재질의 선택 색상 지정; 함수: {set()}
        동작:
            이전 선택을 먼저 해제한다.
            _app이 있으면 교차 목록을 얻고 없으면 빈 배열로 삼아 첫 건물 종류를 선택한다.
            selected가 없으면 _selected에 undefined·isSelected에 false를 저장하고 data undefined인 select 이벤트를 알린 뒤 종료한다.
            배열 재질은 각 원소를, 단일 재질은 그 하나를 복제하고 복제본의 색상만 '#f25f5c'로 바꾼다. 원본 재질과 이를 공유하는 다른 객체의 색상은 변경하지 않는다.
            복제·색상 지정 중 오류가 발생하면 이미 만든 복제본만 해제하고 오류를 다시 전달하며 원본 material은 교체하지 않는다.
            성공하면 원본 material 참조를 _originMaterial에, 복제본 목록을 #selectionMaterials에 보관하고 단일·배열 형태를 유지하여 선택 객체의 material을 복제본으로 교체한다.
            선택 객체를 저장하고 면 보정한 교차점·기본 name·selectPoiOptions로 _selectedViewPoint를 만든다. 옵션은 기본 name·position을 덮어쓸 수 있다.
            임시 POI를 그룹에 등록하고 isSelected에 true를 저장한 뒤 선택 객체를 data로 select 이벤트를 알린다.

getByNameOrIndex(ary: Array<ViewPoint>, key: string | number | ViewPoint) -> ViewPoint | undefined
    의존: ViewPoint 모듈 — 객체 키의 instanceof 판정; 속성 읽기: {ViewPoint}
    동작: key가 목록 안 ViewPoint 인스턴스면 원본을, 문자열이면 이름이 엄격히 같은 첫 객체를, NaN이 아닌 숫자면 해당 배열 프로퍼티를 반환하고 나머지는 undefined다.
SELECTED_POI_OPT: object
    label '선택지점' 뒤 DEFAULT_POI_OPT의 imageOffset·labelOffset을 얕게 전개한 공유 객체다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
