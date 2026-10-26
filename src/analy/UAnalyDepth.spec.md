# UAnalyDepth 명세

> 상태: 구현 관찰 초안

## 1. 개요

`UAnalyDepth`는 클릭한 지점 또는 위경도 두 지점을 이용하여 구간 거리와 지형 기준 높이차를 표시한다. 지점·선·라벨, 측정 ID와 결과를 관리하고 앱의 클릭·더블클릭·마우스 이동을 연결한다. 좌표 환산·실제 거리 계산은 앱과 `UMathEngine`에 맡긴다.

앱의 Depth 분석 등록에서 생성되며 대표 사용처는 `tutorial-official/analysisDepth.html`이다. 측정 이벤트와 결과 조회·삭제, 대상 설정과 라벨 표시를 조합하여 사용한다.

## 3. 정규 자연어 수도코드

```spec
UAnalyDepthCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string = 'Depth'
            분석 이름
        intersectColor1?: number = 0x000066
            대상 교차 미리보기 구체 색상
        intersectColor2?: number = 0x660000
            대상 미교차 미리보기 구체 색상
        labelVisibilityList?: Array<boolean>
            바닥 높이·수직 높이차·지점 고도·구간 거리 순서의 가시성
        intersectcolor1?, intersectcolor2?: number
            대응하는 정본 색상 키의 이전 소문자 별칭
        labelvisibilitylist?: Array<boolean>
            labelVisibilityList의 이전 소문자 별칭

UAnalyDepthPointData 타입 정의
    x, y, z: number
        위경도와 고도 결과
    fromTerrain: number
        지형 기준 높이차; 좌표 입력의 base 모드에서는 런타임 undefined이다. [확인 Q-001]
    fromPrePoint: number
        직전 지점까지 거리(m)
    mesh?: Object3D | undefined
        교차 목록 첫 객체; 실제 선택한 교차점의 객체와 다를 수 있다.

UAnalyDepthResult 타입 정의
    length: number
        수집 지점의 fromPrePoint 합계(m)
    points: Array<UAnalyDepthPointData>
        지점 목록; 단일 클릭 완료 경로는 좌표 변환 결과 하나를 그대로 저장한다. [확인 Q-002]

UAnalyDepthLineState 타입 정의
    _lineWidth: number
        선 원기둥 반지름
    _labelVisibilityList: Array<boolean>
        라벨 가시성 설정의 원본 참조
    _distanceLabelList: Array<UCssBilboard>
        거리 라벨을 추가할 원본 추적 목록

UAnalyDepthPointState 타입 정의
    _labelVisibilityList: Array<boolean>
        라벨 가시성 설정의 원본 참조
    _baseLabelList: Array<UCssBilboard>
        지점 고도 라벨을 추가할 원본 추적 목록

TEMP_POSITION: Vector3 = 새 벡터
    미리보기 공용 위치이며 인스턴스 간 공유한다.
TEMP_VECTOR2: Vector2 = 새 벡터
    공용 화면 좌표
raycast: Raycaster = 새 Raycaster
    클릭·미리보기 교차 조회용 공유 객체
LINE_MATERIAL: MeshBasicMaterial = 흰색, depthTest=false, depthWrite=false
    의존: THREE — 공유 선 재질; 생성자: {new MeshBasicMaterial()}
    선들이 같은 재질을 공유하며 개별 선 해제 경로에서 이 재질도 해제될 수 있다. [확인 Q-003]

UAnalyDepth extends UAnaly 클래스 정의
    name: string = 'Depth'
        외부에서 수정 가능한 분석 이름
    _poiGroup: UGroup = 새 그룹
        측정과 미리보기 객체의 표출 그룹
    _drawPoint: Array<Vector3> = 빈 배열
        진행 중 선택한 원본 좌표 참조
    _distanceList: Array<string | number> = 빈 배열
        완료 측정의 식별자이며 조회 API가 원본을 반환한다.
    _distanceObject: Record<string | number, UAnalyDepthResult | undefined> = 빈 객체
        완료 결과 저장소
    _extension: string = 'extensions'
        수직선 생성 여부와 앱 속성 설정에 쓰는 모드
    _intersectFuntion: function | undefined = undefined
        클릭 교차점 선택 콜백
    _target: Array<Object3D> | undefined = undefined
        교차 대상 목록; 빈 배열과 undefined의 클릭·미리보기 경로가 다르다.
    _helperSphere: Mesh | undefined = undefined
        대상 교차 상태 표시 구체
    _isIntersect: boolean = false
        최근 미리보기 교차 상태
    _infos: Array<UAnalyDepthPointData> = 빈 배열
        완료 전 지점 결과
    _bottomLabelList, _verticalLabelList, _baseLabelList, _distanceLabelList: Array<UCssBilboard> = 빈 배열
        가시성 설정과 삭제에 사용하는 네 종류 라벨 목록
    _intersectColor1: number = 0x000066
    _intersectColor2: number = 0x660000
    _labelVisibilityList: Array<boolean> = [true, true, true, true]
        입력 배열 참조를 그대로 저장한다.
    _lineWidth: number = 0.15
    _sprite, _spriteMat, _spriteMap, _spriteImageUrl = undefined
        격자 표출 객체와 이미지 참조
    _onChange: function | undefined = undefined
    _clickId, _dblClickId: string | null | undefined = undefined
        앱 클릭·더블클릭 등록 식별자
    _currentPoi: Object3D | undefined = undefined
    _prevLine: UCssBilboard | undefined = undefined

    static OPT_KEYS: Array<string> = 부모 키와 name·intersectColor1·intersectColor2·labelVisibilityList
        의존: UAnaly — 부모 옵션 키 목록; 속성 읽기: {OPT_KEYS}
        정본·이전 소문자 키 정규화에 사용한다.

    constructor(opt?: UAnalyDepthCO)
        의존:
            UAnaly — 기반 초기화; 생성자: {super()}
            normalizeOptionKeys — 옵션 키 정규화; 함수: {normalizeOptionKeys()}
            Object — 기존 상속 옵션 보존; 정적 함수: {getPrototypeOf(), setPrototypeOf()}
            defaultValue — undefined 대체; 함수: {defaultValue()}
            UGroup — 표출 그룹; 생성자: {new UGroup()}
        동작:
            옵션 없이 부모를 초기화하고 falsy opt를 빈 객체로 대체한다.
            new.target의 OPT_KEYS로 자신의 옵션 키를 정규화한다. 입력 객체는 수정하지 않으며 변환이 필요한 키만 복사본에 정본 키로 추가한다.
            원본이 object이고 정규화 결과가 별도 객체이면 원본의 프로토타입을 적용하여 상속된 정본 옵션 읽기를 보존한다.
            소문자 별칭과 정본이 함께 있으면 별칭의 값이 정본에 대입되는 공통 정규화 순서를 따른다.
            name·두 색상·가시성 목록은 undefined일 때만 각각 'Depth'·0x000066·0x660000·네 true 목록으로 대체한다.
            측정 목록·결과·라벨·진행 상태를 비우고 선 두께를 0.15로 설정한다.
            격자·이벤트·대상·미리보기 참조를 undefined로 초기화한다.

    override active() -> void
        의존:
            UAnaly — 활성·이벤트; 함수: {prototype.active.call(), off()}; 속성 읽기: {_app, _isActive}
            U3dApp — 모드·교차 설정·이벤트·장면; 함수: {setMode(), setBoundingTree(), on(), off(), setProperties(), getSceneComment()}
            UDEF — 모드·속성 키; 상수: {APP_MODE._DEPTH, DEPTH_PREVLINE_TYPE.EXTENSIONS}
            defined — 존재 판별; 함수: {defined()}
            defaultValue — 기본값; 함수: {defaultValue()}
            THREE — 격자·구체 생성; 생성자: {new SpriteMaterial(), new Sprite(), new SphereGeometry(), new MeshBasicMaterial(), new Mesh()}
            UGroup — 표출 그룹; 생성자: {new UGroup()}; 함수: {add()}
            UScene — 분석 그룹 등록; 함수: {add()}
        동작:
            _isActive가 falsy인 경우에만:
                부모 active()를 적용한다.
                클릭·더블클릭 식별자가 남아 있으면 분석 객체의 off()를 호출한다.
                앱을 DEPTH 모드로 전환하고 bounding tree를 켠다.
                클릭·더블클릭을 현재 객체에 bind하여 앱에 등록하고 반환값을 _clickId·_dblClickId에 각각 저장한다.
                EXTENSIONS 앱 속성에 _extension의 undefined 기본값 'extensions'를 저장한다.
                _onChange가 falsy이면 현재 객체에 bind한 함수를 _onChange에 보관하고, truthy이면 기존 앱 mousemove 등록을 제거한다.
                _sprite가 defined가 아니면 크기 5000·흰색·깊이 쓰기 없음·투명·opacity 0 격자를 생성하여 _sprite에 저장한다.
                _poiGroup가 falsy이면 새 그룹을 _poiGroup에 저장한다.
                그룹 이름을 'anlaysisDepth'로 설정한다.
                _helperSphere가 falsy이면 반지름 1·32×16 분할·검정·opacity 0.3·투명 구체를 생성하여 _helperSphere에 저장한다.
                주석 장면에 표출 그룹이 없으면 추가한다.
                구체·기존 미리보기·격자를 중복 없이 표출 그룹에 추가한다.
    override deactive() -> void
        의존:
            UAnaly — 비활성·분석 이벤트 제거; 함수: {prototype.deactive.call()}; 속성 읽기: {_app, _isActive}
            U3dApp — 설정·이벤트·장면; 함수: {setBoundingTree(), unkey(), off()}; 속성 읽기: {_scene.children}; 속성 쓰기: {_scene.children}
            UGroup — 표출 객체 분리; 함수: {remove()}
            UDEF — 해제; 정적 함수: {disposeObject3D()}
        동작:
            _isActive가 truthy인 경우에만:
                부모 deactive()를 먼저 적용한다.
                _drawPoint.length가 0보다 크면 측정을 완료하고 prevMesh 이름의 장면 자식을 필터링한 뒤 _drawPoint를 빈 배열로 교체한다.
                bounding tree를 끄고 앱 클릭·더블클릭 식별자, mousemove와 모든 click·change 리스너를 제거한다.
                _helperSphere가 truthy이면 그룹에서 분리하고 해제한 뒤 _helperSphere를 undefined로 바꾼다.
                _prevLine이 truthy이면 그룹에서 분리하고 해제한 뒤 _prevLine을 undefined로 바꾼다.
                _clickId·_dblClickId·_onChange·_currentPoi를 undefined로 바꾼다. 완료 결과와 격자는 유지한다.
    override clear() -> void
        의존:
            defined — 존재 판별; 함수: {defined()}
            UGroup — 자식 정리; 함수: {clear(), remove()}; 속성 읽기: {children}
            UDEF — 자원 해제; 정적 함수: {disposeObject3D()}
            U3dApp — 갱신·이벤트·장면; 함수: {setUpdateDate(), off()}; 속성 읽기: {_scene.children}; 속성 쓰기: {_scene.children}
            UAnaly — 분석 알림; 함수: {dispatchEvent()}; 속성 읽기: {_app}
        동작:
            _poiGroup가 defined인 경우에만:
                측정을 완료한다.
                그룹의 직접 자식 중 이름이 measure인 객체를 해제하고 모든 자식을 그룹에서 제거한다.
                결과·ID·선택점·수집 결과를 비우고 격자가 truthy이면 그룹에서 제거한다.
            구체를 숨기고 미리보기를 해제·숨김·분리한 뒤 참조를 비운다.
            선택점이 남아 있으면 prevMesh 장면 객체를 필터링하고 선택점을 비운다.
            네 라벨 목록을 해제·초기화한다.
            앱 갱신을 요청하고 mousemove를 제거한 뒤 data 없는 click 이벤트를 알린다.

    setGridSpriteImage(url: string, size?: number, opacity?: number) -> void
        의존:
            defined — 입력 판별; 함수: {defined()}
            THREE — 이미지·격자 생성; 생성자: {new TextureLoader(), new SpriteMaterial(), new Sprite()}; 함수: {TextureLoader.load()}
            Web API — 실패 기록; 함수: {console.log()}
        동작:
            url이 null·undefined이면 종료한다.
            size·opacity가 null·undefined 또는 음수이면 각각 1000·0.7로 대체하고 0과 상한 밖 양수는 유지한다.
            URL을 저장하고 텍스처 로드를 시작한다. 성공·진행 callback은 비어 있고 실패는 지정 안내 문구와 오류를 console.log()에 전달한다.
            반환 텍스처로 새 재질과 격자를 즉시 생성·저장하고 세 축 크기와 opacity를 적용한다.
            depthWrite=false로 두며 transparent에는 boolean 변환 없이 opacity 수치를 그대로 저장한다. [확인 Q-004]
            이전 격자·재질·텍스처를 해제하거나 장면에서 교체하지 않는다. [확인 Q-005]

    setLineWidth(width: number) -> void
        동작: 검증 없이 선 두께를 저장한다. 기존 선을 다시 생성하지 않는다.
    getLineWidth() -> number
        동작: 저장한 _lineWidth를 반환한다.

    removePOI(id: string) -> void
        의존:
            defined — 존재 판별; 함수: {defined()}
            U3dApp — 주석 장면·갱신; 속성 읽기: {_sceneComment}; 함수: {setUpdateDate()}
            UScene — 객체 분리; 함수: {remove()}; 속성 읽기: {children}
            UGroup — 객체 분리; 함수: {remove()}; 속성 읽기: {children}
            UDEF — 해제; 정적 함수: {disposeObject3D()}
            UAnaly — 알림; 함수: {dispatchEvent()}; 속성 읽기: {_app}
        동작:
            표출 그룹·id가 없거나 Number(id)와 같은 id인 직접 자식이 없으면 종료한다.
            _poiGroup가 truthy이고 id와 removeTarget가 defined인 경우:
                전달된 id 키의 결과를 undefined로 쓴 뒤 삭제하고 Number(id)와 같은 ID 목록 항목 하나를 제거한다.
                주석 장면의 anlaysisDepth 그룹에서 같은 객체를 찾아 그룹과 표출 그룹에서 분리한다.
                주석 장면과 표출 그룹에서 대상 객체를 제거한다.
                하위 라벨을 목록에서 제거·해제한다.
                대상 객체를 해제하고 click 이벤트를 알린 뒤 앱 갱신을 요청한다.
    getDistanceList() -> Array<string | number>
        동작: 원본 _distanceList 참조를 반환한다.
    getDistanceObject(id: string = undefined) -> UAnalyDepthResult | Record<string | number, UAnalyDepthResult | undefined> | undefined
        의존: defined — 키 존재 판별; 함수: {defined()}
        동작: id가 null·undefined이면 결과 저장소 원본을, 그 밖에는 해당 키의 결과 참조를 반환한다.
    setLabelVisibility(valueList: Array<boolean> = [true, true, true, true]) -> void
        의존: UCssBilboard — 라벨 표시; 속성 쓰기: {visible}
        동작:
            입력 배열 참조를 저장한다.
            바닥·수직·고도·거리 목록의 각 라벨 visible에 입력 배열의 0·1·2·3 값을 각각 적용한다. 짧은 배열의 누락값은 undefined로 전달한다.
    getLabelVisibility() -> Array<boolean>
        동작: 저장한 가시성 배열 원본 참조를 반환한다.
    override setType(type: string) -> void
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            defined — 입력 판별; 함수: {defined()}
            U3dApp — 속성 변경; 함수: {setProperties()}
            UDEF — 속성 키; 상수: {DEPTH_PREVLINE_TYPE.EXTENSIONS, DEPTH_PREVLINE_TYPE.BASE}
        동작:
            type이 null·undefined이면 종료한다.
            type을 저장하고 정확히 'extensions'이면 EXTENSIONS=true·BASE=false, 그 밖에는 반대로 앱 속성을 설정한다.

    getResultFromCoordinate(point1: GeoPosition, point2: GeoPosition) -> void
        의존:
            defined — 입력 판별; 함수: {defined()}
            THREE — 입력·결과 벡터; 생성자: {new Vector3()}
            UDrawArg — 위경도 변환; 함수: {getGeographicToWorld()}
            U3dApp — 위경도 결과·갱신; 함수: {vector3ToGeoGraphic(), setUpdateDate()}
            UMathEngine — 실제 거리; 정적 함수: {getMeterDistanceByGooglePoints()}
            UGroup — 측정 그룹; 생성자: {new UGroup()}; 함수: {add()}
            UCssBilboard — 지점 자식 추가; 함수: {add()}
            UAnaly — 결과 알림; 함수: {dispatchEvent()}; 속성 읽기: {_app}
        동작:
            두 입력 중 null·undefined가 있으면 종료한다.
            입력을 별도 Vector3으로 복사하고 drawArg로 월드 좌표 두 점을 만든다.
            각 점의 기본 POI를 만들며 실패하면 그 시점까지 만든 객체·상태를 그대로 남기고 종료한다.
            첫 점은 새 UGroup을 현재 측정으로 만들어 표출 그룹에 추가하고 두 점 POI를 그 그룹에 추가한다.
            extensions 모드에서만 각 점 수직선을 만들고 그 부모를 POI에 붙이며 높이차를 수집한다.
            두 월드 점을 위경도로 환산하고 null·undefined 결과는 영벡터로 대체한다.
            실제 거리로 두 번째 fromPrePoint를, 첫 번째는 0으로 하여 두 결과를 기존 _infos 뒤에 추가한다. base 모드 fromTerrain은 undefined이다. [확인 Q-001]
            두 점을 연결하고 결과 저장을 완료한다.
            현재 ID의 결과로 click·end를 순서대로 알리고 앱 갱신을 요청한 뒤 선택점과 현재 측정을 비운다.

    getDistanceFromCoordinate(point1: GeoPosition, point2: GeoPosition) -> number | undefined
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            defined — 입력 판별; 함수: {defined()}
            UDrawArg — 좌표 변환; 함수: {getGeographicToWorld()}
            UMathEngine — 실제 거리; 정적 함수: {getMeterDistanceByGooglePoints()}
        동작: 입력 중 null·undefined가 있으면 undefined를 반환하고, 그 밖에는 두 입력을 월드 좌표로 변환한 실제 거리를 반환한다.

    getDistanceLine(start: WorldPositionVector3, end: WorldPositionVector3, visible?: boolean) -> UMesh | undefined
        의존:
            defined — 입력 판별; 함수: {defined()}
            THREE — 입력 종류; 상수: {Vector3}
            UGroup — 현재 측정 확보·선 등록; 생성자: {new UGroup()}; 함수: {add()}
        동작:
            현재 측정이 defined가 아니면 표출 그룹 마지막 자식 또는 새 미등록 그룹을 현재 측정으로 저장한다.
            이 상태 변경 후 start·end가 defined인 Vector3이고 현재 측정 id가 defined인지 검사하여 아니면 종료한다.
            start·end가 defined인 Vector3이고 id가 defined인 경우:
                거리 선과 라벨을 생성한다.
                visible이 truthy이면 선만 표출 그룹에 추가한다.
                visible이 falsy이면 수집 결과를 현재 ID로 저장하고 ID를 목록에 추가한 뒤 현재 측정에 선을 붙인다.
                생성 선을 반환한다.
    drawVerticalLine(position: WorldPositionVector3, visible: boolean = false, addList: boolean = true) -> Object3D | undefined
        의존:
            UAnaly — 렌더 인자; 속성 읽기: {_drawArg}
            defined — 존재 판별; 함수: {defined()}
            UDrawArg — 앱 접근; 속성 읽기: {_app}
            U3dApp — 지형 높이; 함수: {getRenderHeightAtPoint()}
            UMathEngine — 미터 환산; 정적 함수: {getRealScaleAtGoogle()}
            UDEF — 높이 무효값; 상수: {INVALID, TERRAIN_NO_DATA}
            THREE — 끝점; 생성자: {new Vector3()}
            U3dBilboard — 높이·바닥 표출; 정적 함수: {makeText(), makePoint(), makeBilboard()}
            UCssBilboard — 스타일·부모 연결; 함수: {setPointColor(), setPointSize(), add()}; 속성 쓰기: {visible, position}
            UGroup — 표출; 함수: {add()}
        동작:
            position이 defined가 아니고 Vector3도 아니면 종료한다. defined인 일반 객체는 이 검사에서 통과하여 clone() 부재로 실패할 수 있다. [확인 Q-006]
            position을 복사하여 z를 1000 늘리지만 그 복사본은 이후 사용하지 않는다.
            환산 배율과 지형 높이를 얻고 높이가 null·undefined·INVALID·TERRAIN_NO_DATA이면 0으로 대체한다.
            signed 높이차에 환산 배율을 곱하여 _verticalLength와 소수 둘째 자리 m 라벨을 설정한다.
            수직 라벨에 가시성 1을 적용하고 선의 자식으로 등록하며 선 위치를 로컬 높이차 절반으로 바꾼다.
            addList가 truthy이면 수직 라벨을 추적 목록에 추가한다.
            바닥점을 로컬 z=지형높이-지점높이로 만들고 녹색·크기 3으로 설정한다.
            지형 고도의 소수 둘째 자리 m 라벨에 가시성 0을 적용하고 addList가 truthy이면 바닥 라벨을 추적한다.
            선 userData에 수직·바닥 POI와 라벨을 연결하고 바닥 POI의 자식으로 선을 붙인다.
            visible이 truthy이면 시작 높이의 소수 첫째 자리 빌보드를 추가하고 바닥 POI를 월드 위치로 옮겨 표출 그룹에 추가·반환한다.
            그 밖에는 바닥 POI가 부모인 선을 반환한다.

    passToClickEvent(func: EventCallBack, event?: string) -> void
        의존:
            defined — 입력 판별; 함수: {defined()}
            UAnaly — 분석 이벤트 등록; 함수: {on()}
        동작: func가 null·undefined이면 종료하고 event가 null·undefined이면 click, 그 밖에는 해당 event에 함수를 등록한다.
    setIntersectTarget(target: Object3D | Array<Object3D> | null | undefined) -> void
        의존: defined — 대상 해제 판별; 함수: {defined()}
        동작: null·undefined이면 대상을 비우고 배열이면 그 원본을 저장하며 그 밖에는 한 항목 배열로 감싼다.
    setIntersectFunction(func: function | undefined) -> void
        인터페이스: 교차 배열을 받아 point를 가진 객체 또는 null·undefined를 반환한다. 실제 호출 this는 분석 객체이다.
        동작: 입력 함수를 검증 없이 _intersectFuntion에 저장한다.
    getIntersectFunction() -> function | undefined
        동작: 저장한 교차 선택 함수를 반환한다.

    #click(e: U3dMouseEvent) -> void
        의존:
            THREE — 화면 교차·오프셋; 생성자: {new Vector3()}; 함수: {Raycaster.setFromCamera(), Raycaster.intersectObjects(), Raycaster.intersectObject()}
            UAnaly — 기본 교차·갱신·알림; 함수: {intersectModel(), intersectTerrain(), update(), dispatchEvent()}; 속성 읽기: {_app, _isActive}
            U3dApp — 카메라·이벤트·위경도 변환; 속성 읽기: {_camera}; 함수: {on(), vector3ToGeoGraphic()}
            UCssBilboard — 지점·선 연결; 함수: {add(), setPosition()}
            UGroup — 표시 객체; 함수: {add()}
            defined — 값 판별; 함수: {defined()}
        동작:
            _isActive와 app._camera가 truthy인 경우에만:
                비활성 또는 카메라가 없으면 종료하고 화면 좌표로 공유 Raycaster를 설정한다.
                대상 배열이 있고 길이가 양수이면 그 대상으로 교차 조회하고 구체를 다시 등록한다. 교차가 없으면 즉시 종료한다.
                그 밖에는 부모 intersectModel()로 조회한다.
                _intersectFuntion이 truthy이면 분석 객체를 receiver로 교차 배열을 넘겨 호출한다. 반환이 falsy이면 종료하고, 그 밖에는 반환 객체의 point를 선택점으로 사용하며 격자·지형 대체 조회는 하지 않는다.
                _intersectFuntion이 falsy인 경우에만:
                    선택점이 null·undefined이고 _target이 falsy이면 대체 조회를 수행한다. 빈 대상 배열은 truthy이므로 이 경로에 진입하지 않는다.
                        격자가 truthy이면 행렬을 갱신하고 격자 교차를 조회하여 첫 교차점이 있으면 선택한다.
                        그 뒤에도 선택점이 null·undefined이면 지형 교차를 조회한다.
                최종 점이 defined가 아니면 종료한다.
                point3d가 defined이면 기본 POI를 생성하고 없으면 종료한다.
                현재 측정이 없으면 POI를 대표로 표출 그룹에 추가하고, 있으면 대표 위치와의 오프셋으로 자식 POI를 배치한다.
                원본 point 참조를 선택점 목록에 추가하고 extensions 모드에서 수직선을 만들며 높이차를 얻는다.
                _target이 null·undefined이고 격자가 truthy이면 격자를 보이게 한다.
                격자가 truthy이면 대상 설정 여부와 무관하게 선택점 위치로 이동하고, 표출 그룹에 없을 때만 등록한다.
                첫 점이고 이동 함수가 있으면 앱 mousemove를 등록한다.
                두 점 이상이면 직전 두 점 거리 선을 만들고 현재 점 기준으로 로컬 이동하여 POI에 붙이며 거리를 얻는다.
                화면 갱신을 요청하고 위경도로 변환한 점 결과를 수집한다. mesh는 최종 선택 교차가 아닌 intersects[0].object이다.
                지점 결과로 click·change를 순서대로 알린다.
    #dblClick(e?: U3dMouseEvent) -> void
        의존:
            U3dApp — 좌표 변환·장면·이벤트; 함수: {vector3ToGeoGraphic(), off()}; 속성 읽기: {_scene.children}; 속성 쓰기: {_scene.children}
            UCssBilboard — 미리보기 숨김; 함수: {traverse()}; 속성 쓰기: {visible}
            UAnaly — 완료 알림; 함수: {dispatchEvent()}; 속성 읽기: {_app}
        동작:
            두 점 이상이면 마지막 두 점으로 선을 생성하고 전체 수집 결과를 저장한다.
            한 점이면 length 0·변환 좌표 하나의 결과를 현재 ID로 저장하고 ID를 추가한다. [확인 Q-002]
            한 점 완료 경로는 _infos를 비우지 않는다. [확인 Q-009]
            격자·미리보기와 모든 자식·별도 거리선·구체를 숨긴다.
            prevMesh 이름의 장면 자식을 필터링한다.
            현재 측정 ID의 결과를 확보하고 앱 mousemove를 제거한 뒤 dblclick·end를 순서대로 알린다.
            알림 후 현재 측정과 선택점 배열을 비운다.

    #getScreenToWorld_(x: number, y: number, name: string, prevObj: UCssBilboard | undefined) -> UCssBilboard | undefined
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            U3dApp — 카메라·지형 높이; 속성 읽기: {_camera}; 함수: {getRenderHeightAtPoint()}
            THREE — 교차·변환; 함수: {Camera.updateMatrixWorld(), Sprite.updateMatrixWorld(), Raycaster.setFromCamera(), Raycaster.intersectObjects(), Raycaster.intersectObject()}
            UMathEngine — 거리; 정적 함수: {getMeterDistanceByGooglePoints()}
            UCssBilboard — 미리보기 연결·이동; 함수: {setPosition(), add()}
            UGroup — 미리보기 등록; 함수: {add()}
            defined — 결과 판별; 함수: {defined()}
        동작:
            app._camera가 falsy이면 prevObj를 반환한다.
            app._camera가 truthy인 경우에는:
                카메라·격자 행렬을 갱신하고 화면 좌표로 교차를 조회한다. 대상 배열이 truthy이면 그 배열, 아니면 격자를 조회한다.
                교차가 있으면 첫 point를 공유 TEMP_POSITION에 복사하고 _isIntersect=true로 설정한다.
                대상이 truthy이고 교차가 없으면 격자로 재조회하여 성공한 경우 위치를 복사하고 _isIntersect=false·구체 visible=true로 설정한다.
                대상이 truthy인데 두 조회 모두 실패해도 공유 위치·교차 상태를 갱신하지 않고 후속을 계속한다. [확인 Q-007]
                대상이 falsy이고 교차가 없으면 구체를 숨기고 prevObj를 반환한다.
                구체와 대상이 있으면 공유 위치와 _isIntersect에 맞는 색상을 구체에 적용한다.
                prevObj가 falsy이고 _drawPoint.length가 1 이상이면 마지막 선택점에서 공유 위치까지 추적 목록 없는 거리선을 만들어 표출 그룹에 추가한다.
                prevObj가 있으면 공유 위치로 이동한다.
                    prevObj.userData.distanceLine이 truthy인 경우:
                        새 원기둥을 만들고 이전 선을 해제한다.
                        거리 라벨을 새 거리·선과 POI 오프셋으로 갱신한다.
                        새 선에 거리·기존 라벨을 연결하여 미리보기 참조를 바꾸고 표출 그룹에 추가한다.
                    prevObj.userData.verticalLine이 truthy이면 지형 높이를 조회하여 falsy를 0으로 대체하고 수직 정보와 라벨을 갱신·교체한다.
                    prevObj를 반환한다.
                기존 prevObj 반환 이후의 신규 생성 경로에서는 추적 목록 없는 기본 POI를 만들어 name을 적용하고 표출 그룹에 추가한다.
                추적 목록 없는 수직선을 만들고 부모·거리선·라벨·바닥 참조를 POI에 연결한다.
                거리 라벨과 수직 라벨의 로컬 위치를 맞추어 POI의 자식으로 옮기고 POI를 반환한다. 선택점 없이 이 경로에 도달하면 distanceLine 부재로 실패할 수 있다. [확인 Q-008]
    #onChange(e: U3dMouseEvent) -> void
        의존:
            defined — 앱 판별; 함수: {defined()}
            UAnaly — 연결·활성 상태; 속성 읽기: {_app, _isActive}
        동작:
            앱이 null·undefined 또는 비활성이면 종료한다.
            기존 미리보기와 거리선을 보이게 한다.
            격자가 보이거나 대상이 truthy이면 화면 좌표로 미리보기를 갱신하고 defined 반환만 _prevLine에 저장한다. [확인 Q-008]

    #getDistanceLine_(start: WorldPositionVector3, end: WorldPositionVector3, addList: boolean = true) -> UMesh
    #getBasicPoint(position: Vector3 | Vector3Like, addList: boolean = true) -> UCssBilboard | undefined
    #setResultInfo(id: number) -> void
        동작:
            집계가 완료된 뒤 _distanceObject[id]에 저장하고 _infos를 새 빈 배열로 교체한다.

    #removeLabelList(target: Object3D) -> void
        의존:
            Object3D — 하위 순회; 함수: {traverse()}
            UDEF — 라벨 해제; 정적 함수: {disposeObject3D()}
        동작:
            자식이 있는 경우 target을 포함하여 순회하고 네 추적 목록의 각 첫 일치 라벨을 목록에서 제거·해제한다.
    #clearLabelList() -> void
        의존:
            UDEF — 라벨 해제; 정적 함수: {disposeObject3D()}
            Object3D — 부모 분리; 함수: {remove()}
        동작: 네 추적 목록의 truthy 라벨을 해제한 뒤 남은 부모에서 분리하고 네 목록을 각각 새 빈 배열로 교체한다.

updateDistanceLabel(label: UCssBilboard | undefined, length: number, parent: UMesh, offset: Vector3) -> void
    의존: UCssBilboard — 거리 라벨 갱신; 함수: {setLabel(), setPosition()}; 속성 쓰기: {visible}
    동작: label이 falsy이면 종료하고 실제 거리의 소수 둘째 자리 m 문자열·선 위치와 offset 차이·visible=true를 적용한다.

createOrUpdateCylinder(start: Vector3, end: Vector3, width: number, old: UMesh | undefined) -> UMesh
    의존: UDEF — 이전 선 해제; 정적 함수: {disposeObject3D()}
    동작:
        old가 truthy이면 해제한 뒤 새 선을 반환한다.

refreshVerticalInfo(poi: Object3D, endZ: number, tmpPos: Vector3, lineW: number) -> UMesh
    의존:
        UMathEngine — 고도 환산; 정적 함수: {getRealScaleAtGoogle()}
        UCssBilboard — 위치·문자열; 함수: {setLabel(), setPosition()}; 속성 쓰기: {visible}
        Object3D — 기존 선 분리; 함수: {remove()}
        UDEF — 이전 수직선 해제; 정적 함수: {disposeObject3D()}
    동작:
        로컬 높이차 절반 위치와 미터 환산 signed _verticalLength를 적용한다.
        고도·수직·바닥점·바닥라벨의 위치·문자열을 갱신하고 visible=true로 강제한다.
        이전 수직선을 부모에서 분리·해제하고 새 선을 반환한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
