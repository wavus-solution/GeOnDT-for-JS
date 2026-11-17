# UAnalyRoad 명세

> 상태: 구현 관찰 초안

## 1. 개요

도로의 클릭 입력·끝점 편집·기즈모 이동·선택·병합과 교차로 갱신을 앱에 연결하는 분석 클래스다. 도로 형상·차선·라벨 생성은 U3dRoadExtension에 맡기며 이 분석은 도로 목록과 입력 모드를 관리한다.

- 책임 범위: 도로 생성 설정·복원·저장, 앱 이벤트 등록과 해제, 선택·편집 상태, 격자 안내와 그룹 연결, 교차 영역·교차선 및 병합 결과 반영.
- 주요 동작 방식: 입력 모드에 따라 click·dblclick·mousemove를 등록하고 앱의 지형 위치를 도로에 전달한다. 교차로 계산은 동기 실행한 뒤 완료된 Promise를 반환하며 병합은 하위 생성 완료를 기다린다.
- 주요 사용처와 연계 대상: U3dApp의 Road 분석 생성, UAnaly, U3dRoadExtension, UGizmoControls, Three.js 및 OpenLayers·JSTS의 도형 교차.

## 3. 정규 자연어 수도코드

```spec
UAnalyRoad extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반 기능; 상속: {UAnaly}

    static OPT_KEYS: Array<string> = 부모 OPT_KEYS와 'name', 'drawStopLine', 'scale', 'rotation'
        의존: UAnaly — 부모 옵션 키; 속성 읽기: {OPT_KEYS}
        생성 옵션을 정본 키로 읽기 위한 목록이다.
    name: string = 'Road'
    color: ColorRepresentation
        기즈모 이동 기준 구의 색상이며 생성자에서 값을 설정하지 않는다.
    _mouseMoveId, _controlId: string | undefined
    _layer: U3dVectorLayer | undefined = undefined
    _eventKeys: Array<{type: string, id: string | null}> = 빈 배열
    _selected: U3dRoadExtension | Mesh | Array<U3dRoadExtension> | undefined = undefined
    _editMode: string = 'translate'
    _control: UGizmoControlsEx | undefined = undefined
    _controlObj: Mesh | undefined
    _road: U3dRoadExtension | undefined = undefined
    _roads: Array<U3dRoadExtension> = 빈 배열
    _intersections: Array<{line: Object3D, points: Array<GeoPosition>}> = 빈 배열
    _isDrawStopLine: boolean = true
    _roadGroup, _absorptionGroup, _roadLineGroup: UGroup
    _roadColor: string = '#000000'
    _roadLine: number = 1
    _roadWidth, _roadHeight: number = 10
    _scale: Vector3Like = {x: 1, y: 1, z: 1}
    _rotation: Vector3Like = {x: 0, y: 0, z: 0}
    _endPoi, _startPoi: Object3D | undefined = undefined
    _poiGroup: UGroup
    _layerMap: Record<string, unknown> = 빈 객체
    _editPointGroup: Array<Object3D> = 빈 배열
    _roadImageUrl: string | undefined
    _grid: Mesh | undefined
    _isGizmoMouseUp: boolean = false
        입력·편집·공유 그룹 상태다. 밑줄 필드와 원본 목록은 쓰기를 차단하지 않는다.

    constructor(opt: UAnalyRoadCO = {})
        의존:
            UAnaly — 기반 초기화; 생성자: {new UAnaly()}; 속성 읽기: {_scene}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            normalizeOptionKeys — 생성 옵션 키; 함수: {normalizeOptionKeys()}
            UGroup — 도로·병합·차선·POI 그룹; 생성자: {new UGroup()}
        동작:
            옵션 없이 부모를 초기화한다. opt가 truthy이면 실제 생성 클래스의 OPT_KEYS로 키를 정규화하며 필요한 경우에만 객체를 복사하고 값의 원본 참조를 유지한다. 명시적인 null은 이후 이름 읽기에서 기존대로 예외가 발생한다.
            name이 undefined이면 'Road', drawStopLine이 undefined이면 true를 저장하며 scale·rotation은 입력 원본 또는 선언한 기본 객체를 사용한다.
            도로·이벤트·편집점 목록과 선택·진행 중 도로를 초기화하고 편집 모드를 translate로 설정한다. 도로 그룹 이름을 roadMeshGroup, 장면 이름을 analyRoad로 설정한다.
            입력 scale·rotation·drawStopLine은 상태로 보관하며 이 클래스의 생성·편집 처리에서 추가로 적용하지 않는다.

    override setApp(app: U3dApp) -> this
        의존: UAnaly — 앱 연결; 함수: {setApp()}
        동작: 부모 setApp(app)을 실행하고 자신을 반환한다.

    override active() -> this
        의존:
            UAnaly — 활성 상태와 주석 장면; 함수: {active()}; 속성 읽기: {_sceneComment}
            Object3D — POI 그룹 연결; 함수: {add()}
        동작: 부모 active()를 실행하고 주석 장면이 있으면 POI 그룹을 추가한 뒤 자신을 반환한다.

    override deactive() -> this
        의존:
            UAnaly — 비활성·앱 연결; 함수: {deactive()}; 속성 읽기: {_isActive, _app}
            U3dRoadExtension — 편집점 상태; 속성 읽기·쓰기: {_editPoints.visible}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
            defined — 존재 판정; 함수: {defined()}
        동작:
            진입 시 _isActive가 falsy이면 자신을 반환한다.
            진입 시 _isActive가 truthy이면:
                부모 deactive()를 실행한다. 부모가 활성 상태를 변경한 뒤에도 입력 등록과 기즈모를 해제하고 선택을 undefined로 만든다.
                각 도로의 정의된 편집점 그룹을 숨기고 앱 갱신을 요청한 뒤 자신을 반환한다. 진행 중 도로를 확정하거나 도로 목록을 비우지는 않는다.

    setLayer(layer: U3dVectorLayer | undefined) -> this
        동작: layer 원본을 저장하고 자신을 반환한다.

    getLayer() -> U3dVectorLayer | undefined
        동작: 현재 레이어 원본 또는 undefined를 반환한다.

    setRoadImage(url: string) -> this
        동작: 이후 생성할 도로의 이미지 주소를 저장하고 자신을 반환한다. 기존 도로는 다시 설정하지 않는다.

    getSelected() -> U3dRoadExtension | Mesh | Array<U3dRoadExtension> | undefined
        동작: 현재 선택 원본을 반환한다. 모드에 따라 도로·편집점·병합 선택 배열이며 선택 전에는 undefined다.

    setSelect(active: boolean) -> this
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 클릭 등록; 함수: {on()}
            defined — 선택 존재; 함수: {defined()}
        동작:
            입력·기즈모를 해제하고 진행 중 도로를 확정한다.
            active가 falsy이고 선택이 정의되어 있으면 선택 원본의 color를 undefined로 쓰고 선택을 비운다.
            active가 truthy이면 선택 콜백을 이 객체에 bind하여 click에 등록하고 키를 저장한다. 분석 활성화는 호출하지 않는다. 자신을 반환한다.

    removeClickedRoad() -> this
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 클릭 등록; 함수: {on()}
        동작:
            입력·기즈모를 해제하고 진행 중 도로를 확정한다.
            클릭 제거 콜백을 bind하여 등록·보관하고 자신을 반환한다.

    override clear() -> this
        의존: UAnaly — 기반 정리; 함수: {clear()}
        동작:
            부모 clear()를 먼저 실행한다.
            입력·기즈모 해제, 진행 도로 확정, 모든 도로 정리, 선택 정리를 순서대로 실행하여 자신을 반환한다. 내부 정리 호출의 중복도 실행하며 어느 단계든 동기 예외는 전파한다.

    clearSelect() -> this
        의존: defined — 선택 존재; 함수: {defined()}
        동작:
            _selected가 정의되어 있으면 하이라이트를 끈 뒤 undefined로 만든다. 하이라이트의 동기 예외가 발생하면 선택 비우기에 도달하지 않는다.
            자신을 반환한다.

    removeRoad(road: U3dRoadExtension) -> this
        의존:
            defined — 입력·기즈모 존재; 함수: {defined()}
            UAnaly — 장면; 속성 읽기: {_scene}
            Object3D — 메시 분리; 함수: {remove()}
        동작:
            road가 null·undefined이면 자신을 반환한다. 메시가 truthy이면 도로 그룹에서 제거한다.
            장면 자식을 증가하는 인덱스로 순회하며 _roadName이 같은 자식을 제거하므로 연속 항목은 건너뛸 수 있다. 도로 목록에서는 같은 이름의 첫 항목만 삭제한다.
            road가 정의되어 있고 _controlObj가 정의되어 있으면 기즈모를 해제한다.
            도로·메시 자원을 dispose하지 않고 자신을 반환한다.

    saveRoad() -> Array<object>
        의존:
            U3dRoadExtension — 저장 값; 함수: {getParam()}
            defined — 결과 존재; 함수: {defined()}
        동작: 현재 목록 순서로 각 도로의 getParam()을 호출하고 null·undefined가 아닌 결과 원본만 새 배열에 담아 반환한다.

    setRoad(options: object | Array<object>) -> this
        의존:
            defined — 존재 판정; 함수: {defined()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UAnaly — 앱·장면; 속성 읽기: {_app, _scene}
            U3dRoadExtension — 생성·복원·정렬; 생성자: {new U3dRoadExtension()}; 함수: {setCoordinates(), sortLineAndMesh()}
            Object3D — 그룹 연결; 함수: {add()}
            __GError__ — 후속 실패; 함수: {__GError__()}
        동작:
            options가 null·undefined이면 자신을 반환한다.
            options가 정의되어 있고 options가 Array이면 forEach 콜백에서 순서대로 각 원소에 setRoad()를 호출하며 완료를 기다리는 비동기 처리는 없다.
            단일 객체에서 positions가 null·undefined이면 자신을 반환한다. width·line·height·imageUrl이 undefined인 필드만 현재 생성 기본값으로 대체한다.
            현재 목록 길이에 따른 road이름, type=road, 앱·dispatcher와 설정으로 도로를 생성한다. 좌표를 설정하고 목록에 추가한 뒤 truthy 메시를 도로 그룹에 넣고 그룹을 장면에 연결한다.
            options가 정의되어 있으면:
                단일 객체 경로에서 opts.positions가 정의되어 있으면 현재 마지막 도로의 교차 갱신 성공 후 그 시점의 모든 도로를 정렬하는 후속 작업을 등록한다. 비동기 실패·정렬 예외는 3060042에 기록한다. 도로 생성·교차 진입의 동기 예외는 전파하며 자신은 후속 완료 전에 반환한다.

    setDrawGridImage(url: string, opacity?: number) -> Promise<void>
        의존:
            defined — 존재 판정; 함수: {defined()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            deferredPromise — 완료 제어; 함수: {deferredPromise()}
            THREE.TextureLoader — 이미지 요청 객체; 생성자: {new TextureLoader()}
            THREE.MeshBasicMaterial — 격자 표시; 생성자: {new MeshBasicMaterial()}
            THREE.PlaneGeometry — 격자 형상; 생성자: {new PlaneGeometry()}
            THREE.Mesh — 격자 메시; 생성자: {new Mesh()}
            TextureLoader — 이미지 요청; 함수: {load()}
            UAnaly — 주석 장면; 속성 읽기: {_sceneComment}
            Object3D — 장면 연결·행렬; 함수: {add(), updateMatrixWorld()}
        동작:
            URL이 null·undefined이면 문자열 이유로 거절한 Promise를 반환한다.
            TextureLoader로 이미지를 요청하며 로딩 실패 콜백에서 문자열 거절을 시도한다. 생성된 map으로 DoubleSide 머터리얼과 1×1 평면을 만든다. geometry·mesh가 정의되지 않은 검사 경로도 문자열로 거절한다.
            depthWrite=false, transparent=true, opacity는 undefined일 때만 1, visible=false로 구성하고 행렬을 갱신한다. _grid를 교체하여 주석 장면이 있으면 추가한 뒤 값 없이 성공한다.
            이미지 로딩 완료를 기다리지 않으므로 늦은 오류는 이미 성공한 Promise를 바꾸지 않는다. 기존 격자·자원은 제거하지 않으며 동기 구성 예외는 호출 지점으로 전파한다.

    gridShow(isShow?: boolean) -> this
        의존: defined — 격자·입력 존재; 함수: {defined()}
        동작: 격자가 null·undefined이면 자신을 반환한다. isShow가 null·undefined이면 true로 대체하여 visible에 저장하고 자신을 반환한다.

    editPosition() -> this
        의존:
            defined — 선택·기즈모 존재; 함수: {defined()}
            THREE.SphereGeometry — 이동 기준 형상; 생성자: {new SphereGeometry()}
            THREE.MeshToonMaterial — 이동 기준 표시; 생성자: {new MeshToonMaterial()}
            THREE.Mesh — 이동 기준 메시; 생성자: {new Mesh()}
            U3dRoadExtension — 중심 조회; 함수: {getRoadCenter()}
            UGizmoControls — 편집 연결; 함수: {setMode(), attach()}
            UAnaly — 장면·주석 장면; 속성 읽기: {_scene, _sceneComment}
            Object3D — 연결·분리; 함수: {add(), remove()}
        동작:
            _selected가 null·undefined이면 자신을 반환한다.
            _selected가 정의되어 있으면 활성화한다.
            _selected가 정의되어 있으면:
                _control이 정의되어 있지 않으면 기즈모를 생성한다. 생성 후에도 없으면 자신을 반환한다.
            현재 모드를 설정하고 기존 기준 객체가 있으면 장면에서만 분리한다. 반지름 10·분할 64×32 구를 현재 color의 머터리얼로 새로 만들어 선택 도로 중심에 두고 숨긴다.
            기준 구를 장면에 추가하고 기즈모를 attach한다. 기즈모를 장면에 먼저 추가한 뒤 주석 장면이 있으면 다시 추가하므로 최종 부모는 주석 장면이다. 자신을 반환한다.

    resetGizmo() -> this
        의존:
            defined — 선택·기준 객체·POI 존재; 함수: {defined()}
            THREE.Vector3 — POI 기준; 생성자: {new Vector3()}
            U3dPOI — POI 이동; 함수: {setPosition()}
            UGizmoControlsEx — 표시 갱신; 함수: {update()}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
        동작: 선택 또는 기준 객체가 null·undefined이면 자신을 반환한다. 원본 _initPosition을 기준 객체·선택의 position에 복사하고 POI가 있으면 그 zOffset을 더한 위치를 전달한다. 기즈모가 없으면 여기서 반환하고 있으면 update()와 앱 갱신 후 자신을 반환한다.

    override removeEventListener() -> this
        동작: 분석이 등록한 앱 입력과 자체 리스너를 비우고 자신을 반환한다. 부모와 달리 매개변수를 받지 않는다.

    addRoad(roadLine?: number, roadWidth?: number, useDrawGrid?: boolean) -> this
        의존:
            defined — 설정 존재; 함수: {defined()}
            UAnaly — 활성·장면; 속성 읽기: {_isActive, _scene}
            Object3D — 도로 그룹 연결; 함수: {add()}
            __GError__ — 격자 실패; 함수: {__GError__()}
        동작:
            입력 등록을 해제한다.
            _isActive가 falsy이면 활성화한다.
            정의된 roadLine·roadWidth만 저장한다. useDrawGrid가 truthy이면 고정 grid2.png 주소·opacity=0.7로 격자 구성을 요청하고 비동기 실패를 3060041에 기록한다.
            도로 그룹을 장면에 추가하고 생성 입력을 등록한다. 기존 도로를 확정하거나 기즈모를 해제하지 않고 자신을 반환한다.

    getGrid() -> Mesh | undefined
        동작: 현재 격자 원본 또는 undefined를 반환한다.

    edtiRoad() -> Promise<void>
        의존:
            defined — 진행 도로·편집점 존재; 함수: {defined()}
            deferredPromise — 완료 제어; 함수: {deferredPromise()}
            UAnaly — 활성·앱; 속성 읽기: {_isActive, _app}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
        동작:
            공개 이름 edtiRoad를 유지한다. 진행 중 도로가 정의되어 있으면 이유 없이 거절한 Promise를 반환한다.
            진행 도로 확정과 입력 해제를 실행한다.
            _isActive가 falsy이면 활성화한다.
            정의된 각 편집점 그룹을 표시하고 앱 갱신 후 편집 입력을 등록하여 값 없이 성공한 Promise를 반환한다. 등록·갱신 동기 예외는 전파한다.

    combineRoad() -> Promise<void>
        의존:
            defined — 진행 도로·편집점 존재; 함수: {defined()}
            deferredPromise — 완료 제어; 함수: {deferredPromise()}
            UAnaly — 활성·앱; 속성 읽기: {_isActive, _app}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
        동작:
            진행 중 도로가 정의되어 있으면 이유 없이 거절한 Promise를 반환한다. 진행 도로 확정과 입력 해제를 실행한다.
            _isActive가 falsy이면 활성화한다.
            선택을 새 배열로 바꾸고 각 편집점 그룹의 자식을 숨긴다. 앱 갱신 후 병합 입력을 등록하고 값 없이 성공한다. 실제 두 도로의 병합 완료를 뜻하지 않으며 동기 예외는 전파한다.

    isDrawRoad() -> boolean
        의존: defined — 진행 도로 존재; 함수: {defined()}
        동작: _road가 null·undefined가 아니면 true, 아니면 false를 반환한다.

    revertRoad() -> this
        의존:
            defined — 진행 도로; 함수: {defined()}
            U3dRoadExtension — 중심선·입력선과 확정; 속성 읽기·쓰기: {origin, center, _endPoi}; 함수: {update()}
            Object3D — 끝 POI 분리; 함수: {remove()}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
        동작:
            진행 도로가 null·undefined이면 자신을 반환한다.
            _road가 정의되어 있으면:
                road.origin 길이가 2이면 도로를 제거하고 확정한다.
            기존 끝 POI가 truthy이면 그룹에서 제거하고 그 뒤 그룹의 뒤에서 두 번째 자식을 새 끝 POI로 저장하여 도로를 update()한다. 앱 갱신 후 자신을 반환한다. 빈·단일 origin에 대한 추가 검사는 없다.

    getRoads() -> Array<U3dRoadExtension>
        동작: 현재 도로 배열 원본을 반환한다. 외부 변경은 후속 작업에 반영된다.

    clearRoad() -> this
        의존:
            defined — 선택·도로 목록·편집점; 함수: {defined()}
            U3dRoadExtension — 라벨·노드·편집점 제거; 함수: {removeLabel(), removeNoeds(), removeEditPoints()}
            UAnaly — 장면; 속성 읽기: {_scene}
            Object3D — 그룹·자식 분리; 함수: {remove(), clear()}
        동작:
            입력·기즈모를 해제하고 진행 도로를 확정한다.
            정의된 선택을 비운다. 도로 목록이 정의되어 있으면 각 도로의 라벨·노드·편집점을 순서대로 제거하고 남은 truthy 편집점 그룹을 장면에서 분리한다.
            편집점 배열을 교체하고 도로 그룹을 비우며 도로 배열을 교체하고 진행 도로를 undefined로 만든다. 도로 그룹을 장면에서 분리하여 자신을 반환한다. 격자·병합·차선 그룹을 정리하거나 메시 자원을 직접 dispose하지 않는다.

    showLabel() -> this
        의존: U3dRoadExtension — 표시; 함수: {showLabel()}
        동작: 모든 도로에 showLabel()을 호출하고 자신을 반환한다.

    hideLabel() -> this
        의존: U3dRoadExtension — 숨김; 함수: {hideLabel()}
        동작: 모든 도로에 hideLabel()을 호출하고 자신을 반환한다.

    getRoadByName(name: string) -> U3dRoadExtension | undefined
        의존: defined — 조회 결과; 함수: {defined()}
        동작: 이름이 엄격히 같은 첫 원본 도로를 반환하고 없으면 undefined를 반환한다.

    getAbsorption(road1: U3dRoadExtension, road2: U3dRoadExtension, type: Array<string>) -> Promise<void>
        의존:
            deferredPromise — 완료 제어; 함수: {deferredPromise()}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dRoadExtension — 병합 도로 생성·완료; 생성자: {new U3dRoadExtension()}; 함수: {createAbsorption()}
            Object3D — 메시 등록; 함수: {add()}
        동작:
            현재 도로 설정과 isAbsorption=true로 새 도로를 생성하고 목록·truthy 메시를 도로 그룹에 먼저 추가한다. 이 구성 단계 동기 예외는 그대로 전파한다.
            createAbsorption(road1, road2, type)의 결과를 Promise.resolve로 관찰하여 하위 성공 뒤 값 없이 성공하고 거절 이유를 그대로 전달한다. 이 호출의 동기 예외도 결과 Promise로 거절한다.
            완료 전에 결과 Promise를 반환하며 실패해도 이미 등록한 병합 도로를 복구하지 않는다.

    getIntersections(last: U3dRoadExtension, isTRoad?: boolean) -> Promise<Array<{line: Object3D, points: Array<GeoPosition>}>>
        의존:
            deferredPromise — 완료 제어; 함수: {deferredPromise()}
            U3dRoadExtension — 차선·폭; 속성 읽기: {lines, width}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 교차점 좌표 변환; 함수: {geographicToVector3(), vector3ToGeoGraphic()}
            defined — 보정 메시 존재; 함수: {defined()}
        동작:
            메시가 truthy이면 현재 기존 도로의 lines와 영역 교차를 계산하여 각 교차 묶음의 첫·마지막 원본 점을 목록에 넣는다. 기존 선 하나라도 교차가 없고 isTRoad가 truthy이면 영역 재계산 표시를 켠다.
            받은 모든 벡터를 영역 보정 목록에 모으고 교차점 목록의 첫·마지막 원본을 교차 목록에 추가한다.
            재계산 표시가 켜져 있으면 모은 벡터와 last.width로 보정 메시를 만들고, 정의된 결과에 대해 기존 선들의 교차를 다시 계산하여 목록에 추가한다. 벡터가 둘 미만인 경로도 이 함수에 전달된다. [확인 Q-003]
            남은 각 선과 점 묶음을 도로에 반영한다.
            빈 결과도 포함하여 원시 교차 목록을 값으로 성공한 Promise를 반환한다. 계산·반영은 Promise 반환 전에 동기 실행하므로 예외는 동기로 전파하며 생성한 임시 영역 메시를 해제하지 않는다.

    #removeClickedRoadHandler(e: U3dMouseEvent) -> void
        동작: 클릭한 도로를 구하여 removeRoad()에 전달한다. 미선택도 undefined로 전달하여 그 메서드의 무동작 경로를 사용한다.

    #removeEventListener() -> void
        의존:
            UAnaly — 앱·상속 이벤트 저장소; 속성 읽기: {_app}; 속성 쓰기: {_listeners}
            U3dApp — 이벤트 해제; 함수: {unkey()}
        동작: 등록 순서대로 type·id를 unkey에 전달하되 null·undefined 키는 undefined로 전달한다. 등록 배열을 새 배열로 바꾸고 자체 _listeners를 새 객체로 비운다. 중간 예외는 이후 초기화를 생략하고 전파한다.

    #finishRoad() -> void
        의존:
            defined — 진행 도로; 함수: {defined()}
            U3dRoadExtension — 입력 확정; 함수: {update()}
            Object3D — POI 그룹 분리; 함수: {clear()}
        동작: 진행 도로가 정의되어 있으면 update(undefined, true) 후 진행 참조를 undefined로 만들고 POI 그룹을 비운다. 입력 이벤트는 해제하지 않는다.

    #select(e: U3dMouseEvent) -> void
        의존:
            defined — 선택·기즈모 존재; 함수: {defined()}
            UAnaly — 선택 이벤트; 함수: {dispatchEvent()}
        동작:
            _isGizmoMouseUp이 truthy이면 false로 초기화하고 종료한다.
            기존 선택이 정의되어 있으면 하이라이트를 끄고 선택을 비운다.
            클릭 도로를 구한다. 정의된 도로이면 하이라이트 후 선택을 저장하고 selected·type=road·원본 event의 select 이벤트를 보낸다. 하이라이트가 동기로 실패하면 이후 선택 반영에 도달하지 않는다. [확인 Q-001]
            클릭 도로가 없으면 기즈모를 해제한다.
            _control이 정의되어 있으면 이 객체의 동적 edit(_editMode)를 호출한다. 이 클래스에는 edit 구현이 없다. [확인 Q-004]

    #getSelectObject(e: U3dMouseEvent) -> U3dRoadExtension | undefined
        의존:
            URaycaster — 화면 광선; 생성자: {new URaycaster()}; 함수: {setFromCamera()}
            defined — 광선·교차 존재; 함수: {defined()}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 카메라; 속성 읽기: {_camera}
        동작:
            광선 객체가 정의되지 않거나 app._camera가 falsy이면 undefined를 반환한다. 이벤트 정규 좌표와 카메라로 광선을 설정한다.
            app._camera가 truthy이면 도로 그룹 첫 교차를 구하고 정의된 경우 해당 메시의 도로를 찾아 반환한다.

    #checkIsTRoad(e: U3dMouseEvent, road: U3dRoadExtension) -> U3dRoadExtension | undefined
        의존:
            URaycaster — 화면 광선·그룹 교차; 생성자: {new URaycaster()}; 함수: {setFromCamera(), intersectObject()}
            defined — 광선·교차 존재; 함수: {defined()}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 카메라; 속성 읽기: {_camera}
            THREE.BufferGeometry — 메시 종류 판정; 생성자: {BufferGeometry}
        동작:
            광선이 정의되지 않거나 카메라가 falsy이면 undefined를 반환한다. 정규 좌표·카메라로 도로 그룹의 교차 목록을 구하며 없거나 비어 있으면 undefined를 반환한다.
            app._camera가 truthy이면 순서대로 geometry가 BufferGeometry이고 이름이 road.name+'_mesh'와 다른 교차의 도로를 조회하여 선택을 덮어쓴다. 마지막 조건 충족 교차의 조회 결과를 반환하며 가장 가까운 한 개로 조기 종료하지 않는다.

    #highLightColor(selected: Mesh, off: boolean) -> Promise<void>
        의존: deferredPromise — 완료 제어; 함수: {deferredPromise()}
        동작: selected.material의 단일 color를 off이면 흰색, 아니면 #fe5f55로 설정하고 opacity=0.5·needsUpdate=true로 바꾼 뒤 값 없이 성공한 Promise를 반환한다. 배열 머터리얼의 별도 처리는 없으며 접근 예외는 동기로 전파한다. [확인 Q-001]

    #createGizmo() -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 카메라·DOM; 속성 읽기: {_camera, _renderer.domElement}
            UGizmoControls — 기즈모·이벤트; 생성자: {new UGizmoControls()}; 함수: {addEventListener()}
        동작: camera·domelement·app으로 기즈모를 생성·보관하고 objectChange와 mouseUp 콜백을 이 객체에 bind하여 등록한다.

    #removeGizmo() -> void
        의존:
            defined — 기즈모 존재; 함수: {defined()}
            UAnaly — 앱·장면; 속성 읽기: {_app, _scene}
            U3dApp — 이벤트 해제; 함수: {unkey()}
            UGizmoControlsEx — 분리·해제; 함수: {detach(), dispose()}
            Object3D — 기준 객체 분리; 함수: {remove()}
        동작: 기즈모가 정의되어 있으면 앱의 change·_controlId를 해제하고 detach·dispose 후 _control을 undefined로 만든다. 기준 객체를 분석 장면에서 분리하고 참조를 비운다. 기준 구의 자원을 직접 dispose하거나 주석 장면의 기즈모를 별도로 remove하지 않는다.

    #gizmoChange() -> void
        의존:
            THREE.Vector3 — 중심; 생성자: {new Vector3()}
            defined — 중심·POI 존재; 함수: {defined()}
            Box3 — 도로 형상 중심; 함수: {getCenter()}
            U3dPOI — 라벨 이동; 함수: {setPosition()}
        동작: 새 영벡터에 존재하는 선택 도로 geometry.boundingBox의 중심을 구한다. 기준 객체 위치 복사본에서 중심을 빼서 truthy 메시의 위치에 반영하고 POI가 정의되어 있으면 기준 객체 위치 원본을 전달한다. 선택·기준 객체의 추가 존재 검사는 없다.

    #gizmoMouseUp() -> void
        동작: _isGizmoMouseUp을 true로 설정하여 다음 선택 입력 한 번을 건너뛰게 한다.

    #addRoadAddEventListener() -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 입력 등록; 함수: {on()}
        동작: 생성 click과 dblclick 콜백을 이 객체에 bind하여 순서대로 등록하고 각각 키를 배열에 보관한다.

    #addRoadEditEventListener() -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 입력 등록; 함수: {on()}
        동작: 끝점 선택 click·편집 종료 dblclick·끝점 이동 mousemove를 순서대로 bind 등록한 뒤 세 키를 순서대로 보관한다.

    #addRoadCombineEventListener() -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 입력 등록; 함수: {on()}
        동작: 병합 선택 click 콜백을 bind하여 등록하고 키를 보관한다.

    #combineRoadHandler(e: U3dMouseEvent) -> void
        의존:
            Web API — 사용자 병합 확인; 함수: {confirm()}
            Web API(console) — 선택·실패 기록; 함수: {log()}
            Object3D — 편집점 분리; 함수: {remove()}
        동작:
            현재 선택 배열을 원본 참조로 잡고 길이가 정확히 2이면 첫 항목을 삭제한다.
            클릭 도로 조회 성공 콜백을 등록한다. 성공하면 같은 배열에 도로를 추가하고 이름을 출력한다. 길이가 2이면 사용자 확인을 받는다. 취소하면 배열 길이를 0으로 만든다.
            조합 길이가 2이면 병합 완료를 기다리는 체인을 반환하는 콜백을 등록한다. 성공하면 각 도로의 조합 type과 같은 자식 편집점을 증가하는 배열 순회 중 그룹에서 제거한다. 전역 편집점 배열의 원소 대신 배열 자체 uuid를 자식 uuid와 비교하므로 보통 배열 항목은 남는다. 마지막에 선택 배열 길이를 0으로 만든다. [확인 Q-005]
            전체 체인의 거절·후속 예외는 console.log로 기록한다. 원래 이벤트 핸들러는 체인을 반환하지 않는다.

    #selectRoad(e: U3dMouseEvent) -> Promise<U3dRoadExtension>
        의존:
            deferredPromise — 완료 제어; 함수: {deferredPromise()}
            URaycaster — 입력 광선; 생성자: {new URaycaster()}; 함수: {setFromCamera()}
            defined — 광선·선택 존재; 함수: {defined()}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 카메라; 속성 읽기: {_camera}
        동작:
            광선 미정의·카메라 falsy이면 각각 문자열 이유로 거절한다. 광선을 설정한 뒤 클릭 도로 조회를 별도로 실행한다.
            도로가 정의되어 있으면 같은 도로로 성공하고 아니면 문자열 이유로 거절한 Promise를 반환한다. 동기 광선·선택 오류는 전파한다.

    #endEdit(e: U3dMouseEvent) -> void
        의존:
            defined — 선택·대상; 함수: {defined()}
            U3dRoadExtension — 차선 정렬; 함수: {sortLineAndMesh()}
            UAnaly — 종료 이벤트; 함수: {dispatchEvent()}
            __GError__ — 후속 실패; 함수: {__GError__()}
        동작:
            _selected가 정의되어 있으면 같은 이름의 첫 도로를 찾고 선택 하이라이트를 끈 뒤 선택을 비운다.
            대상 도로가 정의되어 있으면 교차 갱신 성공 후 현재 모든 도로를 정렬하는 후속 작업을 등록하며 실패를 3060043에 기록한다.
            후속 완료를 기다리지 않고 원본 e를 dblclick 이벤트로 통지한다. 교차 진입 등 앞선 동기 예외는 이벤트 통지 전에 전파한다.

    #editRoad(e: U3dMouseEvent) -> void
        의존:
            defined — 선택·대상 도로; 함수: {defined()}
            UAnaly — 앱·오류 이벤트; 속성 읽기: {_app}; 함수: {dispatchEvent()}
            U3dApp — 픽셀 위치·화면 갱신; 함수: {closestPointAtPixel(), setUpdateDate()}
            U3dRoadExtension — 거리 판정·끝점 변경; 함수: {checkDistance(), reducePoint(), addPoint()}
            Web API — 삭제 확인; 함수: {confirm()}
            Web API(console) — 확장 진단; 함수: {log()}
        동작:
            _selected가 null·undefined이면 종료한다. 이벤트 위치를 구하고 편집점 이름과 같은 첫 도로를 찾는다. 도로가 없거나 origin 길이가 2 미만이면 종료한다.
            type=end이면 현재 끝점, 아니면 시작점을 기준으로 고른다.
            _selected가 정의되어 있으면:
            CLOSE이면 close 오류, MAXIMUM_SIZE이면 maximum size 오류를 통지하고 즉시 종료한다.
            _selected가 정의된 REDUCE 경로에서 반대 끝점과의 거리가 road.height 미만일 때 사용자 삭제 확인을 받는다. 확인하면 도로 제거와 선택 정리를 실행하지만 이어서 원래 도로의 reducePoint도 호출한다. end가 아닌 편집은 start 인수를 전달한다.
            그 외 상태이면 늘리기 로그 후 addPoint를 호출하며 시작 편집에는 start를 전달한다. 끝에서 앱 갱신을 요청한다.

    #selectEditPoint(e: U3dMouseEvent) -> void
        의존:
            URaycaster — 편집점 선택; 생성자: {new URaycaster()}; 함수: {setFromCamera(), intersectObjects()}
            defined — 광선·선택·교차; 함수: {defined()}
            UAnaly — 앱·이벤트; 속성 읽기: {_app}; 함수: {dispatchEvent()}
            U3dApp — 카메라; 속성 읽기: {_camera}
        동작:
            광선이 정의되지 않거나 app._camera가 falsy이면 종료한다. 정규 좌표로 편집점 목록을 재귀 교차한다.
            app._camera가 truthy이면:
                _selected가 정의되어 있으면 하이라이트를 끄고 비운다. editPoint[0]가 정의되어 있으면 그 메시를 선택하고 하이라이트한다.
                원본 e를 mousemove 이벤트로 통지한다.

    #roadClick(e: U3dMouseEvent) -> void
        의존:
            defined — 진행 도로·격자·POI; 함수: {defined()}
            U3dRoadExtension — 생성·거리·입력; 생성자: {new U3dRoadExtension()}; 함수: {checkDistance(), addPoint()}
            UAnaly — 앱·이벤트; 속성 읽기: {_app}; 함수: {dispatchEvent()}
            U3dApp — 픽셀 위치·좌표 변환·줌; 함수: {closestPointAtPixel(), vector3ToGeoGraphic()}; 속성 읽기: {_zoomLevel}
            Object3D — 도로·POI 연결; 함수: {add()}
        동작:
            진행 도로가 없으면 현재 설정과 road_목록길이 이름으로 생성하여 목록·truthy 메시를 도로 그룹에 추가한다.
            closestPointAtPixel(e,true)로 위치를 구하고 현재 도로에 checkDistance(position)를 호출한다.
            origin이 비어 있고 격자가 정의되어 있으면 round(2^(19-zoomLevel)×100)으로 세 축 scale을 설정하고 표시한다. 위치 x·y는 입력과 같고 z는 0.05를 더한다.
            CLOSE·MAXIMUM_SIZE이면 해당 오류 이벤트를 통지하고 종료한다. 나머지는 addPoint가 truthy일 때 정의된 시작·끝 POI를 그룹에 추가한다.
            addPoint가 falsy여도 입력 위치의 지리 좌표를 coordinates에 추가하고 click 이벤트로 원본 e를 통지한다.

    #roadDblClick(e: U3dMouseEvent) -> void
        의존:
            defined — 진행 도로·격자·편집점; 함수: {defined()}
            UAnaly — 종료 이벤트·장면; 함수: {dispatchEvent()}; 속성 읽기: {_scene}
            U3dRoadExtension — 편집점 생성·정렬; 함수: {createEditPoint(), sortLineAndMesh()}
            Object3D — 그룹 추가; 함수: {add()}
        동작:
            진행 도로를 확정한 뒤 dblclick 이벤트를 먼저 통지한다.
            진행 도로가 정의되지 않고 격자가 정의되어 있으면 격자를 숨긴다. 현재 마지막 도로의 첫·마지막 origin을 _start·_end로 저장하고 편집점을 생성한다. 마지막 도로가 없는 경우의 방어 검사는 없다.
            정의된 편집점 그룹을 장면에 추가·숨김 처리하고 그 자식 원본을 전역 편집점 배열에 추가한다.
            다른 이름의 T 도로가 선택되면 마지막 도로 _isTRoad를 true로 설정한다.
            현재 _isTRoad로 교차 갱신 후 모든 도로를 정렬하는 후속 작업을 등록한다. 비동기 실패에서는 debugger 문만 실행하며 동기 교차 오류는 그대로 전파한다.

    #updateIntersectMesh(vectors: Array<Vector3>, width: number) -> Mesh | undefined
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 지리 좌표 변환; 함수: {vector3ToGeoGraphic()}
        동작:
            결과가 undefined이면 undefined를 반환한다. 아니면 각 점을 그 시점 앱의 지리 좌표로 변환한다.
    #intersectionUpdate(info: UAnalyRoadIntersection) -> void
        의존:
            defined — 대상 존재; 함수: {defined()}
            U3dRoadExtension — 교차 반영; 함수: {drawIntersection()}
        동작: 모든 도로를 순회하여 name이 info.line._roadName과 같은 마지막 도로를 선택한다. 정의되어 있으면 원본 line·points로 drawIntersection()을 호출한다.

    #findRoadByMesh(obj: Object3D) -> U3dRoadExtension | undefined
        동작: 메시 UUID가 obj.uuid와 같은 마지막 원본 도로를 반환하고 없으면 undefined를 반환한다.

    #intersectRoad(ray: URaycaster) -> Intersection | undefined
        의존:
            URaycaster — 그룹 교차; 함수: {intersectObject()}
            defined — 결과 존재; 함수: {defined()}
        동작: 도로 그룹의 교차 결과가 null·undefined·빈 배열이면 undefined를 반환하고 아니면 첫 교차 원본을 반환한다.

UAnalyRoadCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string = 'Road'
        drawStopLine?: boolean = true
        scale?: Vector3Like
        rotation?: Vector3Like
            생성자는 이름·정지선 상태·변환 설정을 보관하며 부모 옵션은 전달하지 않는다.

UGizmoControlsEx 부분 타입 명세
    이 명세에서 사용하는 필드:
        update, dispose: function() -> void
        addEventListener: function(type: string, listener: Function) -> void
            UGizmoControls에 필요한 구현 멤버를 합성한 내부 타입이다.

IntersectionTarget 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
        _olGeom, geometry: object | undefined
        center: Array<WorldPositionVector3> | undefined
            교차 비교 이름·OpenLayers 도형·높이 보정 기준이다.

UAnalyRoadGizmoMembers 부분 타입 명세
    이 명세에서 사용하는 필드:
        update, dispose: function() -> void
        addEventListener: function(type: string, listener: Function) -> void
            UGizmoControlsEx에 합성한 추가 계약이다.

UAnalyRoadData 부분 타입 명세
    이 명세에서 사용하는 필드:
        positions: Array<GeoPosition> | undefined
        width, line, height: number | undefined
        imageUrl: string | undefined
            복원 입력의 지리 좌표·도로 생성 설정이다.

UAnalyRoadIntersection 부분 타입 명세
    이 명세에서 사용하는 필드:
        line: Object3D
        points: Array<GeoPosition>
            교차 선과 그 구간의 원본 점이다.

UAnalyRoadAppContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _app: U3dApp | undefined
            각 좌표 변환에서 현재 앱을 읽는 계약이다.

UAnalyRoadIntersectionContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _app: U3dApp | undefined
        _roads: Array<U3dRoadExtension>
            T자 보정의 각 변환·폭 계산에서 현재 값을 읽는다.

UAnalyRoadGroupedIntersections 부분 타입 명세
    이 명세에서 사용하는 필드:
        lineGroup: Array<Object3D>
        pointList: Double_Array<GeoPosition>
            같은 인덱스의 선과 반영 점 목록이다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
