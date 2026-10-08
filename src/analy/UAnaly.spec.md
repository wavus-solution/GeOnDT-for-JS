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
