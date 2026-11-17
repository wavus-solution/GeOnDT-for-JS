# UAnalyRoute 명세

> 상태: 구현 관찰 초안

## 1. 개요

지점으로 경로를 만들고 카메라 또는 모델을 주행시키는 분석 클래스다. 경로의 선·시작 및 끝 라벨·색상·이미지를 관리하며, 재생에는 UTween을 사용한다.

- 책임 범위: 좌표 입력과 경로 보간, 경로 표시, 재생·진행·완료 이벤트, 시점 방향과 지형 충돌 높이, GLTF 모델 주행 연결.
- 주요 동작 방식: ULineGeometry의 경로 비율 위치를 재생 콜백에서 읽어 카메라·모델을 이동한다. 이미지·모델은 로더 콜백으로 적용하며 공개 호출은 자신을 즉시 반환한다.
- 주요 사용처와 연계 대상: U3dApp의 Route 분석, hugeVolumeComponent 예제의 임도 주행, UAnaly, ULineGeometry, UTween, U3dBilboard, Three.js.

## 3. 정규 자연어 수도코드

```spec
const OFF_SET: number = 0.0001
const Z_FIGHT_OPT: {polygonOffset: boolean, polygonOffsetFactor: number, polygonOffsetUnits: number} = {true, -80, 1}
UAnalyRoute extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반; 상속: {UAnaly}

    static OPT_KEYS: Array<string> = 부모 OPT_KEYS와 'name', 'lineWidth'
        의존: UAnaly — 부모 옵션 키; 속성 읽기: {OPT_KEYS}
    name: string = 'Route'
    _classtype: string = 'UAnalyRoute'
    static Event: {UPDATE: string, COMPLETE: string, START: string, STOP: string, PROGRESS: string}
        의존: UAnaly — 부모 이벤트 값; 속성 읽기: {Event}
        부모 Event를 펼친 뒤 update·complete·start·stop·progress 이름을 대응 대문자 키로 덮어쓴다.
    _positions, _geoPositions, _vertices: Array<Vector3> = 빈 배열
    _curIdx, _currentPos: number = 0
    _lineColor: string = '#fe5f55'
    _lineOpacity: number = 1
    _lineGeom: ULineGeometry | undefined = undefined
    _lineMaterial, _textureMaterial: MeshLambertMaterial | undefined = undefined
    _lineMesh: Mesh | undefined = undefined
    _speed: number = 50
    _isTween: boolean = false
    _cameraHeight: number = 2
    _cameraPolar: number = 5
    _cameraAzimuth: number = 0
    _startPoi, _endPoi: Object3D | undefined = undefined
    _poiGroup: UGroup
    _lineImageUrl: string | undefined = undefined
    _tension: number = 0.5
    _segment: number = 10
    _lineWidth: number = 5
    _tween: UTween | undefined = undefined

    constructor(options: UAnalyRouteCO = {})
        의존:
            UAnaly — 부모 초기화; 생성자: {new UAnaly()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            normalizeOptionKeys — 생성 옵션 정규화; 함수: {normalizeOptionKeys()}
            UGroup — 라벨 그룹; 생성자: {new UGroup()}
        동작:
            옵션 없이 부모를 초기화한다. options가 truthy이면 실제 생성 클래스의 OPT_KEYS로 옵션 키를 정규화하고 값의 원본을 유지한다. null은 이후 name 읽기에서 기존대로 예외가 발생한다. 식별자를 UAnalyRoute로 하고 name·lineWidth가 undefined이면 각각 Route·5를 사용한다. positions·geoPositions·vertices를 빈 배열로 만들고 인덱스 0, 선 색 #fe5f55·불투명도 1, 속도 50·진행 0·재생 false, 높이 2·상하 각도 5·방위각 0, tension 0.5·분할 간격 10을 저장한다.
            형상·머터리얼·메시·시작/끝 라벨·이미지 URL·트윈은 undefined로 두며 라벨 그룹을 새로 만든다. 부모 옵션은 전달하지 않는다.

    override setApp(app: U3dApp) -> this
        의존:
            UAnaly — 앱 연결; 함수: {setApp()}
            ULineGeometry — 경로 생성; 생성자: {new ULineGeometry()}
            U3dApp — 지형 조회 연계; 속성 읽기: {_drawArg}
            THREE.MeshLambertMaterial — 선·이미지 표시; 생성자: {new MeshLambertMaterial()}
            THREE.Mesh — 경로 메시; 생성자: {new Mesh()}
        동작:
            부모 setApp(app)을 실행한다. 현재 너비·tension, curveType=line·ground=true와 app·drawarg로 경로 형상을 만들고 분석 식별자를 이름으로 설정한다.
            현재 선 색·불투명도와 앞면 표시로 기본 머터리얼을 만들며 투명 여부는 불투명도가 1과 다른지로 정한다. 흰색·불투명도 1·transparent=true·앞면의 이미지 머터리얼도 만든다. 양쪽에 Z_FIGHT_OPT를 적용한다.
            형상과 두 머터리얼 배열로 메시를 만들고 자신을 반환한다. 재호출 시 이전 자원을 직접 해제하지 않는다.

    override active() -> this
        의존:
            UAnaly — 활성화·장면·앱; 함수: {active()}; 속성 읽기: {_scene, _app}
            U3dApp — 라벨 장면; 속성 읽기: {_sceneComment}
            Object3D — 연결; 함수: {add()}
            UDEF — 즉시 이미지 갱신 설정; 속성 쓰기: {isImmediateUpdateImageModel}
        동작:
            부모 active()를 실행하고 경로 메시를 분석 장면, 라벨 그룹을 앱 주석 장면에 추가한다. 전역 즉시 이미지 갱신을 true로 만들고 자신을 반환한다.

    override deactive() -> this
        의존:
            UAnaly — 활성 상태와 비활성화; 속성 읽기: {_isActive}; 함수: {deactive()}
            UDEF — 즉시 이미지 갱신 설정; 속성 쓰기: {isImmediateUpdateImageModel}
        동작:
            진입 시 _isActive가 falsy이면 자신을 반환한다.
            진입 시 _isActive가 truthy이면:
                지리 좌표 수가 2 미만이면 경로를 비운다.
                부모 deactive()를 실행한 뒤 전역 즉시 이미지 갱신을 false로 만들고 자신을 반환한다.

    override clear() -> this
        의존:
            UAnaly — 부모 정리·장면·앱; 함수: {clear()}; 속성 읽기: {_scene, _app}
            U3dApp — 비행 중지·갱신; 함수: {stopFly(), setUpdateDate()}
            ULineGeometry — 경로 제거; 함수: {clear()}
            Object3D — 메시 분리; 함수: {remove()}
        동작:
            경로 메시를 장면에서 분리하고 app.stopFly(), 경로 형상 clear()를 순서대로 실행한다. 지리 좌표 배열을 교체하고 진행률을 0, 양 끝 라벨 참조를 undefined로 만든다.
            부모 clear()를 실행한 뒤 앱 갱신을 요청하고 자신을 반환한다. 자체 _tween·_isTween을 직접 초기화하거나 메시·머터리얼·이미지를 dispose하지 않는다. [확인 Q-001]

    addPointOrg(point: U3dMouseEvent | Vector3 | {x: number, y: number, z: number}) -> this
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dMouseEvent — 이벤트 종류; 생성자: {U3dMouseEvent}
            THREE.Vector3 — 월드 입력 종류·지리 입력 생성; 생성자: {Vector3, new Vector3()}
            U3dApp — 좌표 입력·변환; 함수: {closestPointAtPixel(), vector3ToGeoGraphic(), geographicToVector3()}
            ULineGeometry — 지점·중심; 함수: {addPoint(), getCenterPosition()}
            defined — 이미지 머터리얼 존재; 함수: {defined()}
        동작:
            이벤트는 지형에서 클릭 월드 좌표와 그 지리 좌표를 구하고, Vector3는 월드 원본과 그 변환 좌표를 사용한다. 그 밖의 객체는 x·y·z로 지리 Vector3를 만든 뒤 월드 변환한다.
            월드 점을 한 번 addPoint하고 메시가 있으면 형상 중심을 복사한다. truthy 지리 좌표를 원본 목록에 추가한다.
            지리 좌표 수가 1 이하이면 시작 라벨, 그 외에는 끝 라벨을 만들고 자신을 반환한다. 중간점 보간은 하지 않는다.

    getPoints() -> Array<Vector3>
        의존:
            ULineGeometry — 경로 원본; 함수: {getPoints()}
        동작:
            형상 getPoints()의 원본 배열을 그대로 반환한다.

    addPoint(point: U3dMouseEvent | Vector3 | {x: number, y: number, z: number}) -> this
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dMouseEvent — 이벤트 종류; 생성자: {U3dMouseEvent}
            THREE.Vector3 — 입력 종류·지리 점; 생성자: {Vector3, new Vector3()}
            U3dApp — 좌표 입력·변환; 함수: {closestPointAtPixel(), vector3ToGeoGraphic(), geographicToVector3()}
            ULineGeometry — 경로·형상·길이 갱신; 함수: {addPoint(), getPoints(), updateGeometry(), getCenterPosition(), spline.updateArcLengths()}
            defined — 이미지 머터리얼 존재; 함수: {defined()}
        동작:
            이벤트는 지형 클릭 월드 점과 변환 지리 점, Vector3는 월드 원본과 변환 지리 점, 그 밖의 객체는 새 지리 Vector3와 월드 변환을 사용한다.
            지리 좌표 목록이 비어 있으면 월드 점 하나를 addPoint하고 truthy 지리 점을 보관한다.
            메시가 있으면 형상 중심을 복사한다.
            지리 점 수가 1 이하이면 시작 라벨, 그 외에는 끝 라벨을 만들고 자신을 반환한다.

    start(speed?: number, repeat?: boolean) -> this
        의존:
            UAnaly — 앱·이벤트; 속성 읽기: {_app}; 함수: {dispatchEvent()}
            ULineGeometry — 점 수·길이; 함수: {getPoints(), getLength()}
            defined — 기존 트윈·속도; 함수: {defined()}
            UTween — 재생 생성·설정·연결·중지; 생성자: {new UTween()}; 함수: {stop(), to(), onUpdate(), onComplete(), onStop(), repeat(), start()}
            U3dApp — 비행·모드·그리기; 함수: {stopFly(), getMode(), setMode(), setFreePolarAngle(), drawFast(), drawDefault()}; 속성 읽기·쓰기: {_mapControl, _currentTween, _drawArg, _camera}
            UDEF — 주행 모드; 속성 읽기: {APP_MODE._ROUTE}
        동작:
            점 수가 0이면 자신을 반환한다. 기존 트윈이 정의되어 있으면 stop()을 호출한 뒤 app.stopFly()를 실행한다.
            speed가 정의되어 있으면 _speed에 저장한다.
            전체 길이×(1-현재 진행률)을 속도/3.6으로 나누고 1000을 곱해 기간을 구한다. 현재 앱 모드가 주행이 아니면 컨트롤 상태를 저장하고 주행 모드로 바꾸며, 이어서 주행 모드를 다시 설정하고 상하 각도 제한을 푼다.
            현재 진행률·drawarg·updatedistance=20·useground=true로 UTween을 만들고 목표 진행률 1과 기간, 갱신·완료·중지 콜백을 등록한다.
            갱신 콜백의 this는 UTween이 제공한 진행 상태다. 재생 true, 빠른 그리기, 컨트롤 route 모드 설정 뒤 해당 progress로 카메라를 이동한다. 전체 길이를 다시 읽고 남은 거리와 양수 속도일 때의 남은 초(그 외 0)를 계산하여 route 원본·progress·percent·totalLength·remainLength·remainSec의 progress 이벤트, 이어서 분석 원본의 update 이벤트를 보낸다.
            완료 콜백은 컨트롤 none, 재생 false·진행 0, 기본 그리기, 분석/컨트롤/앱 트윈 참조 undefined 순으로 반영하고 complete 이벤트를 보낸다.
            중지 콜백은 컨트롤 none, 재생 false, target.z를 현재 카메라 z로 설정, 기본 그리기, 세 트윈 참조 undefined 뒤 stop 이벤트를 보낸다. UTween 부모 생성자가 설치한 인스턴스 stop은 실제 재생 중일 때 중지 콜백을 호출한다.
            컨트롤·앱에 트윈을 먼저 저장하고 repeat가 truthy이면 무한 반복을 설정한다. 트윈을 시작하고 start 이벤트를 보낸 뒤 분석 _tween을 저장하여 자신을 반환한다. 이벤트의 재진입은 이 저장 순서를 관찰하며 재생 true는 첫 갱신에서 설정한다. [확인 Q-003]

    modelStart(speed?: number, model?: Object3D, repeat?: boolean) -> this
        의존:
            UAnaly — 앱·이벤트; 속성 읽기: {_app}; 함수: {dispatchEvent()}
            ULineGeometry — 점 수·길이; 함수: {getPoints(), getLength()}
            defined — 속도; 함수: {defined()}
            UTween — 모델 재생; 생성자: {new UTween()}; 함수: {to(), onUpdate(), onComplete(), onStop(), repeat(), start()}
            U3dApp — 각도·컨트롤·카메라; 함수: {setFreePolarAngle()}; 속성 읽기: {_mapControl, _drawArg, _camera}
        동작:
            점 수가 0이면 자신을 반환한다.
            speed가 정의되어 있으면 _speed에 저장한다.
            start와 같은 현재 남은 길이·속도 계산으로 기간을 정한 뒤 상하 각도 제한을 푼다. 기존 트윈을 중지하거나 앱 모드를 바꾸지는 않는다.
            UTween 진행 상태 this를 사용하는 갱신 콜백은 재생 true, 컨트롤 fpv, 모델 이동 뒤 update 이벤트를 보낸다. progress 이벤트는 보내지 않는다.
            완료 콜백은 컨트롤 none·재생 false·진행 0·분석 트윈 undefined 뒤 complete 이벤트를 보낸다. 중지 콜백은 컨트롤 none·재생 true, target.z를 카메라 z로 변경하고 분석 트윈을 undefined로 만들며 stop 이벤트는 보내지 않는다.
            repeat가 truthy이면 무한 반복을 설정한다. 이어서 시작하고 start 이벤트를 보낸 후 _tween에 저장한다. 컨트롤·앱 트윈 참조에는 등록하지 않는다. model 생략 시에도 재생·이벤트는 진행되며 자신을 반환한다. [확인 Q-001]

    restart() -> this
        동작:
            진행률을 0으로 만든 뒤 기본 인수로 카메라 주행 start()를 호출하여 자신을 반환한다.

    stop() -> this
        의존:
            UTween — 현재 트윈 중지 요청; 함수: {stop()}
        동작:
            _isTween이 truthy이면 현재 트윈 stop()을 호출하고 재생 상태를 false로 만든다. 첫 갱신 전에는 _isTween이 false여서 중지 요청을 보내지 않는다. 자신을 반환한다. [확인 Q-003]

    setCurrentPos(v?: number) -> this
        동작:
            v가 falsy이면 0, 아니면 v를 저장하여 자신을 반환한다. 범위 제한이나 즉시 이동은 수행하지 않는다.

    loadModel(loadFile: string, positionList: Array<WorldPositionVector3>, name: string, speed: number) -> this
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            GLTFLoader — 모델 요청; 생성자: {new GLTFLoader()}; 함수: {load()}
            THREE.AmbientLight — 모델 광원; 생성자: {new AmbientLight()}
            Object3D — 모델·광원·변환; 함수: {add(), traverse(), updateMatrix(), updateMatrixWorld()}
            ULineGeometry — 경로 초기화; 함수: {clear()}
            U3dApp — 주석 장면·갱신; 속성 읽기: {_sceneComment}; 함수: {setUpdateDate()}
            defined — 기존 지리 목록; 함수: {defined()}
        동작:
            GLTF 요청을 등록하고 즉시 자신을 반환한다. 완료 Promise와 오류 콜백은 제공하지 않는다.
            로딩 성공 콜백은 gltf.scene의 첫 자식 행렬을 갱신하고 루트 이름을 설정한다. 첫 자식을 positionList[0]에 복사·scale 20·회전 0·up z축으로 설정하여 행렬을 갱신한다. 루트 _light에 흰색 AmbientLight를 만들고 요청 시 잡은 주석 장면에 광원·모델을 추가한다.
            루트를 traverse하여 isMesh인 객체의 castShadow=true, 단일 머터리얼 depthWrite=false, position=0·x 회전=-π/36으로 바꾼다.
            지리 목록이 정의되어 있으면 새 배열로 바꾸고 현재 형상을 clear한다. positionList 순서로 addPoint를 호출하고 선을 숨긴 뒤 현재 주석 장면 children의 마지막 원소를 pop한다. 자식 부모 링크는 갱신하지 않는다. [확인 Q-002]
            첫 자식으로 modelStart(speed,child,true)를 실행하고 앱 갱신을 요청한다. 빈 자식·빈 경로·배열 머터리얼의 추가 검사는 없으며 이 클래스가 성공 콜백 예외를 직접 처리하지는 않는다.

    getAngle() -> number
        동작:
            현재 상하 각도 설정을 반환한다.

    setAngle(angle: number) -> this
        동작:
            상하 각도를 저장하여 자신을 반환한다. 범위 검증은 없고 카메라 이동 계산에서 사용하며 모델 이동의 고정 기울기에는 적용하지 않는다.

    setAzimuth(angle: number) -> this
        동작:
            방위각을 저장하여 자신을 반환한다.

    getAzimuth() -> number
        동작:
            현재 방위각 설정을 반환한다.

    getHeight() -> number
        동작:
            현재 경로 기준 높이를 반환한다.

    setHeight(value: number) -> this
        동작:
            이후 카메라·모델 이동의 높이를 저장하고 자신을 반환한다.

    getSpeed() -> number
        동작:
            현재 주행 속도를 반환한다.

    setSpeed(speed: number) -> this
        동작:
            속도를 저장한다. _isTween이 truthy이면 기본 인수 start()로 카메라 주행을 다시 시작하며 자신을 반환한다.

    showLine() -> this
        의존:
            UAnaly — 분석 장면; 속성 읽기: {_scene}
            Object3D — 메시 연결; 함수: {add()}
        동작:
            분석 장면에 메시를 추가하고 양 끝 라벨을 표시하여 자신을 반환한다.

    hideLine() -> this
        의존:
            UAnaly — 분석 장면; 속성 읽기: {_scene}
            Object3D — 메시 분리; 함수: {remove()}
        동작:
            분석 장면에서 메시를 분리하고 양 끝 라벨을 숨겨 자신을 반환한다.

    showLineLabel() -> this
        동작:
            시작·끝 라벨이 각각 truthy이면 visible=true로 만들고 자신을 반환한다.

    hideLineLabel() -> this
        동작:
            시작·끝 라벨이 각각 truthy이면 visible=false로 만들고 자신을 반환한다.

    getLineColor() -> string
        동작:
            현재 선 색 문자열을 반환한다.

    setLineColor(color: string) -> this
        의존:
            Color — 색상 지정; 함수: {set()}
        동작:
            선 색을 저장하고 기본 머터리얼의 색상과 needsUpdate=true를 설정하여 자신을 반환한다.

    getLineWidth() -> number
        동작:
            현재 경로 너비를 반환한다.

    setLineWidth(width: number) -> this
        의존:
            ULineGeometry — 너비 반영; 속성 쓰기: {width}; 함수: {update()}
        동작:
            너비를 저장하고 현재 형상의 width에 반영·전체 갱신하여 자신을 반환한다.

    getLineOpacity() -> number
        동작:
            현재 경로 불투명도를 반환한다.

    setLineOpacity(opacity: number) -> this
        동작:
            설정을 저장하고 경로 메시의 모든 머터리얼에 transparent=true·opacity를 쓰고 자신을 반환한다. needsUpdate는 추가로 설정하지 않는다.

    override getScene() -> UScene
        의존:
            UAnaly — 분석 장면; 속성 읽기: {_scene}
        동작:
            현재 분석 장면 원본을 반환한다.

    getParameter() -> {positions: Array<Vector3>, speed: number}
        동작:
            지리 좌표 배열 원본과 현재 속도를 담은 새 객체를 반환한다. 배열을 복사하지 않는다.

    setLineImage(url: string, rotation?: number) -> this
        의존:
            UTextureLoader — 이미지 요청; 생성자: {new UTextureLoader()}; 함수: {load()}
            Texture — 이미지 원점·중심; 함수: {offset.set(), center.set()}
        동작:
            URL을 저장하고 이미지 요청을 등록하여 자신을 즉시 반환한다.
            성공 콜백은 받은 텍스처의 offset=0·center=0.5, rotation을 falsy이면 0으로 설정한다. 그 시점의 이미지 머터리얼 map으로 적용하고 map.needsUpdate=true·opacity=1·material.needsUpdate=true로 만든다. 실패 통지·요청 역전 차단·기존 텍스처 해제는 추가하지 않는다.

    #move(delta: number) -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 카메라·컨트롤·갱신; 속성 읽기: {_camera, _mapControl}; 함수: {setUpdateDate()}
            ULineGeometry — 경로 위치; 함수: {getPointAt()}
            Vector3 — 위치·시선 반영; 함수: {copy()}
            Camera — 시선; 함수: {lookAt()}
            UMapControl — 줌 갱신; 함수: {zoomChanged()}
        동작:
            delta가 1-OFF_SET보다 크면 종료한다. 현재 앱·형상·카메라·컨트롤을 잡고 delta 위치에 현재 높이를 더한 뒤 (delta+OFF_SET)%1의 앞쪽 점을 읽는다.
            카메라가 있으면 위치를 복사한다. 카메라 유무와 무관하게 컨트롤 target을 복사하고 zoomChanged(true)를 실행한다.
            카메라가 있으면 lookAt을 적용한다. 이어서 카메라 유무와 무관하게 앱 갱신을 요청하고 현재 진행률을 저장한다.

    #moveModel(model: Object3D | undefined, delta: number) -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 컨트롤·갱신; 속성 읽기: {_mapControl}; 함수: {setUpdateDate()}
            ULineGeometry — 경로 위치; 함수: {getPointAt()}
            Object3D — 모델 위치·시선; 함수: {lookAt()}
            Vector3 — 위치 반영; 함수: {copy()}
            UMapControl — 줌 갱신; 함수: {zoomChanged()}
            defined — 모델 존재; 함수: {defined()}
        동작:
            delta가 1-OFF_SET보다 크거나 model이 null·undefined이면 종료한다. 앱·형상·컨트롤을 잡고 현재 경로점에 높이를 더한 뒤 앞쪽 점을 읽는다.
            model이 정의되어 있으면:
            모델 position 복사·컨트롤 zoomChanged(true)·모델 lookAt·앱 갱신·현재 진행 저장 순으로 반영한다. 컨트롤 target은 바꾸지 않는다.

    #startPoi(position: Vector3) -> void
        의존:
            U3dBilboard — 시작 라벨; 함수: {makeBilboard()}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 주석 장면; 속성 읽기: {_sceneComment}
            Object3D — 연결; 함수: {add()}
        동작:
            position 원본과 text=Start로 라벨을 만들어 참조를 덮어쓰고 라벨 그룹에 추가한 뒤 그룹을 현재 주석 장면에 연결한다. 기존 시작 라벨은 별도로 제거하지 않는다.

    #endPoi(position: Vector3) -> void
        의존:
            defined — 기존 끝 라벨; 함수: {defined()}
            U3dBilboard — 끝 라벨; 함수: {makeBilboard()}
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 주석 장면; 속성 읽기: {_sceneComment}
            Object3D — 연결·분리; 함수: {add(), remove()}
        동작:
            정의된 기존 끝 라벨을 그룹에서 분리하고 참조를 undefined로 만든다. position 원본·text=End로 새 라벨을 만들어 그룹과 현재 주석 장면에 연결한다. 이전 라벨을 dispose하지 않는다.

UAnalyRouteCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string = 'Route'
        lineWidth?: number = 5
            이름과 경로 너비를 설정하며 부모 옵션은 생성자에 전달하지 않는다.

UAnalyRouteGroundContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _app: U3dApp | undefined
            지형 조회 시점의 앱을 사용한다.

UAnalyRouteViewContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _app: U3dApp | undefined
        _cameraHeight, _cameraAzimuth, _cameraPolar: number
            시선 계산 시점의 높이·각도와 지형 조회 앱이다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
