# UAnaly 명세

> 상태: 구현 관찰 초안

## 1. 개요

분석 클래스의 기반으로 활성 상태와 앱 연결을 보관하고, 모델·지형·레이어 장면의 교차 조회와 선택 메시의 하이라이트를 제공한다.
거리·높이 분석 등의 하위 클래스가 이벤트와 측정 기능을 확장하며, U3dApp은 분석 객체에 자신을 연결한다.
공개 제어부가 대상 선택·교차 조회·선택 목록·화면 갱신을 담당하고 비공개 구현에 병합 후보 재교차와 재질 색상 처리를 위임한다.

## 3. 정규 자연어 수도코드

```spec
UAnaly extends UEventDispatcher 클래스 정의
    의존: UEventDispatcher — 이벤트 기반 클래스; 상속: {UEventDispatcher}

    static OPT_KEYS: Array<string> = ['type']
        생성 옵션 키 목록이다.
    _type: string = 'analy'
        생성 옵션으로 정한 분석 타입이다.
    _classtype: string = 'UAnaly'
        클래스 식별 문자열이다.
    _scene: UScene
        생성한 분석 장면이며 getScene()이 원본 참조를 반환한다.
    _app: U3dApp | undefined
        setApp()으로 연결한 앱이다.
    _drawArg: UDrawArg | undefined
        앱에서 받은 렌더링 실행 인자다.
    _sceneComment: UScene | undefined
        앱에서 받은 주석 장면 참조다.
    _selectedList: Array<Ananlysis_Mesh> = 빈 배열
        하이라이트를 설정한 메시 목록이며 같은 메시가 중복 등록될 수 있다.
    _selectedMeasureFeature: UMeasureFeature | undefined
        분석이 선택한 측정 피처 원본 참조다.
    _measureInputKeys: Map<string, string | null | undefined> = 빈 Map
        분석이 등록한 우클릭·키보드 입력의 고유 키다.
    _measureRightClick: UAnalyMeasureRightClickState
        직전 우클릭 누름·정상 클릭 정보이며 비활성화에서 초기화한다.
    _currentMeasureLabels: Array<UCssBilboard> = 빈 배열
        현재 편집에 속하는 고정 라벨 목록이다.
    _measureFeatureLabels: Map<UMeasureFeature, Array<UCssBilboard>> = 빈 Map
        확정 피처별 고정 라벨 소유 목록이다.
    _isActive: boolean = false
        분석 활성 여부이며 isActive()가 현재 값을 읽는다.
    _poiGroup: UGroup
        분석 결과 표출용 그룹이다.
    _targetLayerName: string | undefined = undefined
        undefined이면 지형, 빈 문자열이면 모델·지형 및 앱이 함께 제공하는 장면, 그 밖에는 지정 레이어를 측정한다.

    constructor(opt?: UAnalyCO)
        의존:
            UEventDispatcher — 이벤트 기반 초기화; 생성자: {super()}
            normalizeOptionKeys — 생성 옵션 키 정규화; 함수: {normalizeOptionKeys()}
            defaultValue — undefined만 기본값으로 대체; 함수: {defaultValue()}
            UScene — 분석 장면 생성; 생성자: {new UScene()}
            UGroup — 표출 그룹 생성; 생성자: {new UGroup()}
        동작:
            부모를 초기화하고 falsy인 opt를 빈 객체로 대체한 뒤 new.target의 OPT_KEYS에 따라 옵션 키를 정규화한다.
            opt.type이 undefined이면 'analy', 아니면 전달된 값 그대로 _type에 저장한다.
            클래스 식별값과 장면·주석 장면·선택 목록·활성 상태·표출 그룹·대상 레이어 이름을 초기화한다.

    active() -> void
        동작: _isActive를 true로 설정한다.

    isActive() -> boolean
        동작: _isActive를 반환한다.

    deactive() -> void
        의존: UEventDispatcher — 등록 이벤트 전체 해제; 함수: {removeEventListenerAll()}
        동작: _isActive를 false로 설정한 뒤 분석 객체의 이벤트 리스너를 모두 제거한다.

    clear() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UDEF — 그룹 자식 정리; 정적 함수: {disposeObject3D()}
            U3dApp — 주석 장면 조회; 속성 읽기: {_sceneComment}
            UScene — 표출 그룹 분리; 함수: {remove()}
            UGroup — 자식 목록과 그룹 정리; 속성 읽기: {children}; 함수: {clear()}
        동작:
            _app이 falsy이면 종료한다.
            _poiGroup이 존재하고 자식 수가 0보다 크면 현재 자식 배열을 앞에서부터 순회하며 각 자식을 정리한다. [확인 Q-002]
            같은 조건에서 앱의 주석 장면에서 그룹을 제거하고 그룹을 비운다.

    override on(type: string, listener: EventCallBack, once?: boolean, name?: string) -> string | null
        인터페이스: listener는 이벤트 발생 시 분석 객체를 this로 받아 호출되며 반환값은 등록 이름 또는 중복 등의 경우 null이다.
        의존: UEventDispatcher — 이벤트 등록; 함수: {on()}
        동작: 부모 on()을 현재 객체에 적용하고 반환값을 그대로 반환한다.

    override off(type?: string, listener?: function | string) -> void
        의존: UEventDispatcher — 이벤트 해제; 함수: {off()}
        동작: 부모 off()에 인수를 전달한다. 런타임은 함수뿐 아니라 이벤트 식별 문자열도 처리한다.

    update() -> void
        의존:
            defined — 앱 존재 판정; 함수: {defined()}
            U3dApp — 렌더 갱신 요청; 함수: {changeUpdate()}
        동작: _app이 null·undefined이면 종료하고, 아니면 앱에 갱신을 요청한다.

    getFeatures() -> Array<UMeasureFeature | OLFeature>
        동작: 기반 구현은 새 빈 배열을 반환하며 하위 분석이 소유한 확정 피처 목록을 제공한다.

    getFeatureResult(feature: UMeasureFeature | OLFeature) -> UAnalyFeatureResult | undefined
        의존: U3dApp — 측정 레이어 조회; 함수: {getMeasureLayer()}
        동작: 자신의 확정 목록에 없거나 월드 좌표 조회가 없는 피처·레이어 부재에는 undefined를 반환한다. 유효한 측정에는 원본 피처 참조·유형·실제 값(m 또는 ㎡)과 좌표·스타일 사본을 반환한다.

    getFeatureResults() -> Array<UAnalyFeatureResult>
        동작: 자신의 확정 목록에서 유효한 결과만 새 배열로 반환한다.

    getFeatureCoordinates(feature: UMeasureFeature) -> Array<Vector3Like>
        의존: U3dApp — 월드 좌표의 위경도 변환; 함수: {vector3ToGeoGraphic()}
        동작: 각 월드 좌표를 위경도·높이의 새 x·y·z 객체로 반환한다. 앱 부재이면 수치만 복사한다.

    getFeatureStyle(feature: UMeasureFeature) -> UAnalyFeatureStyle
        의존: THREE — 색상 독립 복사; 생성자: {new Color()}
        동작: 레이어와 피처 스타일을 병합하고 채움·선 색상은 새 Color로 반환한다. 미지정 색은 흰색·노란색, 굵기와 불투명도는 1을 사용한다.

    removeFeature(feature: UMeasureFeature) -> boolean
        의존: U3dApp — 도형 제거; 함수: {removeMeasureFeature()}
        동작: 앱·소유권이 없거나 앱의 삭제 결과가 false이면 false를 반환한다. 소유 목록과 라벨을 정리하고 자신의 선택을 해제한 뒤 measuredelete를 전달하며 화면을 갱신하고 true를 반환한다.

    setFeatureStyle(feature: UMeasureFeature, style: U3dShaderMeasureLayerStyle) -> boolean
        의존: U3dShaderMeasureLayer — 소유 피처 스타일 적용; 함수: {getFeatures(), setFeatureStyle()}
        동작: 소유·등록 피처와 스타일이 유효하면 레이어에 위임하고 measurestylechange에 현재 적용 스타일을 전달하며 true를 반환한다. 아니면 false를 반환한다.

    resetFeatureStyle(feature: UMeasureFeature) -> boolean
        의존: U3dShaderMeasureLayer — 기본 스타일 복원; 함수: {resetFeatureStyle()}
        동작: 소유 피처의 복원이 성공하면 measurestylechange에 현재 스타일을 전달하고 true, 아니면 false를 반환한다.

    clearMeasureFeatureSelection() -> void
        의존: U3dShaderMeasureLayer — 임시 강조 해제; 함수: {setFeatureSelected()}
        동작: 선택이 없으면 종료한다. 선택 참조를 먼저 비우고 임시 강조를 해제한 뒤 measureunselect를 전달한다.

    pickMeasureFeature(event: U3dMouseEvent) -> UMeasureFeature | undefined
        의존: UDrawArg — 카메라; 함수: {getCamera()}; U3dShaderMeasureLayer — 후보·편집 피처·강조; 함수: {getFeatures(), getMeasureFeature(), setFeatureSelected()}
        동작: 레이어·카메라가 없으면 undefined를 반환한다. 편집 중·숨김 피처를 제외한 선·폴리곤에서 카메라 깊이 범위와 교차하는 부분을 투영하고 내부 또는 정규화 거리 0.025 미만의 가장 가까운 도형을 선택한다. 비유한 입력·변환 또는 전체가 깊이 범위 밖인 후보는 제외한다.
            미적중이면 기존 선택을 해제한다. 새 적중은 이전 선택을 해제하고 저장 스타일과 분리된 강조를 설정하며 실제 값·유형·입력 위치를 measureselect로 전달한다.

    _forgetMeasureFeature(feature: UMeasureFeature) -> void
        동작: 해당 라벨 목록을 해제하고 매핑에서 제거한다. 하위 분석은 이 호출 뒤 자신의 확정 목록도 제거한다.

    _disposeMeasureLabels(labels: Array<UCssBilboard>) -> void
        의존: UDEF — 렌더링 자원 해제; 함수: {disposeObject3D()}; UGroup — 그룹 분리; 함수: {remove()}
        동작: 중복을 제외한 각 라벨의 자원을 해제하고 그룹에서 분리한다.

    _registerMeasureFeature(feature: UMeasureFeature) -> void
        동작: 현재 라벨 목록을 피처에 연결하고 새 현재 목록을 만든 뒤 유형·실제 값·피처를 measureend로 전달한다.

    _bindMeasureInput(click: function(U3dMouseEvent), stop: function()) -> void
        의존: U3dApp — 입력·캔버스 조회; 함수: {on(), getRenderer()}; UDEF — 고유 키; 함수: {createUUID()}
        동작: 이전 소유 입력을 해제한 뒤 mousedown·mouseup·keydown을 고유 키로 등록한다.
            동일 캔버스의 우클릭 중 누름 500ms·이동 8px 이하만 클릭으로 전달한다. 이전 정상 클릭과 300ms·8px 이내의 연속 입력은 종료로 전달한다. 드래그·다른 대상·시간 역행은 이전 후보를 초기화하며 Esc도 종료를 호출한다.

    _isRepeatedMeasureRightClick(event: U3dMouseEvent, position: Vector3) -> boolean
        동작: 원본 버튼이 우클릭일 때 안내 끝점 앞의 마지막 고정 점과 비교한다. 거리 제곱이 1e-12 이하이면 좌표 왕복 변환 오차 범위의 동일 위치로 판정한다. 고정 점 부재나 다른 버튼이면 false다.

    _unbindMeasureInput() -> void
        의존: U3dApp — 소유 키 해제; 함수: {unkey()}
        동작: 자신의 보조 입력만 해제하고 키 목록과 이전 우클릭 상태를 초기화한다.

    getAnalysisOption() -> void
        동작: 아무 작업도 하지 않고 undefined로 종료한다.

    setAnalysisOption() -> void
        동작: 아무 작업도 하지 않고 undefined로 종료한다.

    getScene() -> UScene
        동작: _scene 원본 참조를 반환한다.

    setApp(app: U3dApp) -> void
        의존: U3dApp(app) — 실행 인자·주석 장면 연결; 속성 읽기: {_drawArg, _sceneComment}
        동작: _app을 저장한 뒤 앱의 _drawArg와 _sceneComment를 참조로 저장한다.

    setTargetLayerName(layerName: string | undefined) -> void
        동작: _targetLayerName을 전달받은 값으로 설정한다.

    getTargetLayerName() -> string | undefined
        동작: _targetLayerName을 반환한다.

    intersectModel(e: U3dMouseEvent) -> Array<Intersection>
        의존:
            UDrawArg — 카메라 조회; 함수: {getCamera()}
            defined — 좌표 존재 판정; 함수: {defined()}
            URaycaster — 화면 좌표 교차 광선 생성; 생성자: {new URaycaster()}; 함수: {setFromCamera()}
            THREE — 화면 좌표 벡터 생성; 생성자: {new Vector2()}
        동작:
            카메라가 falsy이거나 normalizedX·normalizedY 중 하나가 null·undefined이면 빈 배열을 반환한다.
            화면 정규화 좌표로 카메라 광선을 설정한다.
            모델 장면 교차 목록을 조회하여 반환한다.

    intersectTerrain(e: U3dMouseEvent | {normalizedX: any, normalizedY: any}) -> Vector3 | undefined
        의존:
            UDrawArg — 카메라 조회; 함수: {getCamera()}
            defined — 카메라·좌표 존재 판정; 함수: {defined()}
            URaycaster — 화면 좌표 교차 광선 생성; 생성자: {new URaycaster()}; 함수: {setFromCamera()}
            THREE — 화면 좌표 벡터 생성; 생성자: {new Vector2()}
        동작:
            카메라 또는 normalizedX·normalizedY 중 하나가 null·undefined이면 undefined를 반환한다.
            화면 정규화 좌표로 카메라 광선을 설정한다.
            현재 대상 설정의 교차 목록을 구한다.
            교차가 없으면 undefined를 반환한다.
            첫 교차점의 z가 전역 isNaN() 판정으로 NaN이거나 0보다 작으면 해당 점 원본의 z를 0으로 변경한다.
            첫 교차점 원본 참조를 반환한다.

    getIntersectsForMeasure(raycaster: URaycaster) -> Array<Intersection>
        의존:
            defined — 대상 이름 존재 판정; 함수: {defined()}
            U3dApp — 모델·지형 장면 조회; 함수: {getInstanceScenesFromModelAndTerrainLayers()}
        동작:
            대상 이름이 null·undefined이면 지형 교차 목록을 반환한다.
            대상 이름을 문자열로 변환하고 빈 문자열이면 앱의 모델·지형 장면 또는 빈 배열을 사용하여 교차 목록을 반환한다.
            그 밖에는 변환된 레이어 이름으로 교차 목록을 반환한다.

    getIntersectsFromTerrain(raycaster: URaycaster, recursive?: boolean) -> Array<Intersection>
        의존:
            defined — 실행 인자·재귀 옵션 존재 판정; 함수: {defined()}
            UDrawArg — 지형 장면 조회; 함수: {getTerrainScene()}
            URaycaster — 지형 장면 교차; 함수: {intersectObject()}
        동작:
            _drawArg가 null·undefined이면 빈 배열을 반환한다.
            recursive가 null·undefined이면 true로 대체하고 지형 장면을 교차 조회한다.
            교차 배열을 distance 오름차순으로 제자리 정렬하여 반환한다.

    getIntersectsFromModel(raycaster: URaycaster, recursive?: boolean) -> Array<Intersection>
        의존:
            defined — 실행 인자·재귀 옵션 존재 판정; 함수: {defined()}
            UDrawArg — 모델 장면 조회; 함수: {getInstanceScenesFromModelLayers()}
        동작:
            _drawArg가 null·undefined이면 빈 배열을 반환한다.
            recursive가 null·undefined이면 true로 대체하고 모델 장면 목록을 조회한다.
            조회된 장면을 교차 조회하여 반환한다.

    getIntersectsFromAll(raycaster: URaycaster, recursive?: boolean) -> Array<Intersection>
        의존:
            defined — 실행 인자·재귀 옵션 존재 판정; 함수: {defined()}
            UDrawArg — 전체 장면 조회; 함수: {getInstanceScenesFromAll()}
        동작:
            _drawArg가 null·undefined이면 빈 배열을 반환한다.
            recursive가 null·undefined이면 true로 대체하고 전체 장면 목록을 조회한다.
            조회된 장면을 교차 조회하여 반환한다.

    getIntersectsFromLayerName(raycaster: URaycaster, layerName: string, recursive?: boolean) -> Array<Intersection>
        의존:
            defined — 앱 존재 판정; 함수: {defined()}
            U3dApp — 레이어 조회; 함수: {getLayerByName()}
            U3dLayer — 레이어 장면 조회; 함수: {getScene()}
        동작:
            _app이 null·undefined이거나 조회한 레이어의 장면이 falsy이면 빈 배열을 반환한다.
            장면 하나와 recursive를 넘겨 교차 목록을 반환한다.

    getIntersectsFromScenes(raycaster: URaycaster, scenes: Array<UScene>, recursive?: boolean) -> Array<Intersection>
        의존:
            defined — 실행 인자·앱 존재 판정; 함수: {defined()}
            URaycaster — 장면 자식 교차; 함수: {intersectObjects()}
            UDrawArg — 분할에 사용할 앱 조회; 속성 읽기: {_app}
        동작:
            recursive가 null·undefined이면 true로 대체한다.
            장면 순서대로 각 장면의 children을 교차 조회하여 결과 배열을 연결한다.
            distance 오름차순으로 정렬하여 반환한다.

    save() -> string
        동작: 'Object'를 반환한다.

    load(data?: any) -> void
        동작: 인수를 사용하지 않고 undefined로 종료한다.

    getType() -> void
        동작: _type을 조회하지 않고 undefined로 종료한다.

    setType(type: string) -> void
        동작: 인수를 저장하지 않고 undefined로 종료한다.

    addDefaultEvent() -> void
        동작: 이벤트를 등록하지 않고 undefined로 종료한다.

    setHighlight(object: Object3D, color?: ColorRepresentation) -> void
        의존:
            THREE.Object3D — 하위 객체 순회; 함수: {traverse()}
            defined — 재질 존재 판정; 함수: {defined()}
        동작:
            object 자신과 하위 객체를 순회하며 isMesh가 truthy이고 material이 존재하는 메시를 찾는다.
            각 메시의 _isPicked를 true로 설정하고 _selectedList에 추가한다.
            순회 완료 후 갱신을 요청한다.

    removeHighlight(object: Ananlysis_Mesh) -> void
        의존: defined — 재질 존재 판정; 함수: {defined()}
        동작:
            선택 목록에서 isMesh가 truthy이고 전달한 객체와 동일하며 재질이 존재하는 항목들의 _isPicked를 undefined로 설정한다.
            선택 목록에서 전달한 객체와 동일한 첫 항목만 제거한다.
            갱신을 요청한다.

    removeAllHighlight() -> void
        의존:
            THREE.Object3D — 선택 메시와 하위 객체 순회; 함수: {traverse()}
            defined — 재질 존재 판정; 함수: {defined()}
        동작:
            각 선택 항목 자신과 하위 객체를 순회한다.
            mesh.isMesh가 truthy이고 재질이 존재하면 _isPicked를 undefined로 설정한다.
            선택 목록을 새 빈 배열로 교체한다.
            갱신을 요청한다.

UAnalyFeatureResult 부분 타입 명세
    feature: UMeasureFeature
        확정 피처의 원본 참조다.
    type: string | undefined
        도형 유형이다.
    value: number
        거리(m) 또는 면적(㎡)의 실제 단위 값이다.
    coordinates: Array<Vector3Like>
        각 좌표의 x=경도, y=위도, z=높이인 독립 객체 목록이다.
    style: UAnalyFeatureStyle
        적용 스타일의 새 객체이며 채움·선 색상은 독립 Color다.

UAnalyFeatureStyle 부분 타입 명세
    U3dShaderMeasureLayerRenderStyle에서 채움·선 색상 타입을 THREE.Color로 지정한 타입이다.

UAnalyMeasureRightClickState 부분 타입 명세
    down: {time: number, x: number, y: number, target: EventTarget | null} | undefined
        현재 누름의 시간·화면 위치·원본 대상이다.
    previous: {time: number, x: number, y: number} | undefined
        직전 정상 우클릭의 시간·위치다.

UAnalyCO extends UEventDispatcherCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        type?: string = 'analy'
            분석 타입의 초기값이며 생략하면 'analy'를 사용한다.

Ananlysis_Mesh extends Common_Mesh 부분 타입 명세
    이 명세에서 사용하는 필드:
        _isPicked?: boolean
            분석 하이라이트 적용 여부다.

UAnalyMergedMeshLayer extends U3dLayer 부분 타입 명세
    이 명세에서 사용하는 필드:
        mergedMeshDivision: undefined | function(Object3D): (Array<Object3D> | undefined)
            레이어를 this로 사용하여 병합 모델을 분할하고 분할 결과 목록을 반환하는 내부 연계 함수다.
```

## 4. 공통 처리 기준과 제약

```spec
교차 조회와 하이라이트는 활성 상태와 무관하게 직접 호출할 수 있다.
하이라이트 해제는 저장 색상만 복원하며 transparent와 needsUpdate는 되돌리지 않는다.
표출 그룹 clear()와 하이라이트 선택 목록 정리는 서로 독립적이다.
교차 조회·재질 처리·외부 호출의 예외는 별도 catch 없이 호출자에게 전달하며, 이미 변경한 상태를 되돌리지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
