# UAnalySection 명세

> 상태: 구현 관찰 초안

## 1. 개요

횡단면·종단면·원형·원기둥 입력 영역에 겹치는 모델을 선택하고 측정 형상과 라벨을 관리하는 분석 클래스다.

- 책임 범위: 입력 이벤트 연결, 측정점·미리보기·영역 결과의 생명주기, 영역과 모델의 교차 판정 및 U3dSelect로의 모델 선택 위임.
- 주요 동작 방식: 측정 레이어의 도형과 모델 경계 상자를 먼저 비교하고, 입력 모드에 따라 종단면의 광선 교차 또는 원기둥 높이 교차를 추가 판정한다.
- 주요 사용처와 연계 대상: U3dApp의 Section 분석, UAnaly, U3dSelect, 측정 레이어, UMesh, Three.js, OpenLayers.

## 3. 정규 자연어 수도코드

```spec
UAnalySection extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반; 상속: {UAnaly}

    static OPT_KEYS: Array<string> = 부모 OPT_KEYS와 'name'
        의존: UAnaly — 부모 옵션 키; 속성 읽기: {OPT_KEYS}
    name: string = 'Section'
    _clickId: string|undefined = undefined
    _dblClickId: string|undefined = undefined
    _poiGroup: UGroup = 새 UGroup
        의존: UGroup — 라벨 그룹; 생성자: {new UGroup()}
    _drawPoint: Array<Vector3> = 빈 배열
    _filteredList: Array<string> = 빈 배열
    _filteredObject: Record<string, FilteredEntry | undefined> = 빈 사전
    _extension: string = 'base'
    _pickList: Array<UMesh> = 빈 배열
    _selector: U3dSelect | undefined = undefined
    _curCircle: U3dCircle | UMesh | undefined = undefined
    _feature: unknown = undefined
    _featurePoints: Array<object> = 빈 배열
    _lineWidth: number = 0.1
    _selectLayer: SelectLayerLike | undefined = undefined
    _onChange: Function|undefined = undefined
    _spriteImageUrl: string|undefined = undefined
    _spriteMap: Texture|undefined = undefined
    _spriteMat: SpriteMaterial|undefined = undefined
    _sprite: Sprite|undefined = undefined
    _prevLine: MeasurePOILike | undefined = undefined
    _measureFeature: unknown = undefined
    _currentGroup: UGroup|undefined = undefined
    _currentPoi: MeasurePOILike | undefined = undefined
    constructor(opt?: UAnalySectionCO)
        의존:
            UAnaly — 부모 초기화; 생성자: {new UAnaly()}
            normalizeOptionKeys — 생성 옵션 정규화; 함수: {normalizeOptionKeys()}
            defaultValue — 직접 기능; 함수: {defaultValue()}
            UGroup — 생성; 생성자: {new UGroup()}
        동작:
            부모를 옵션 없이 초기화하고 opt가 falsy이면 빈 객체로 대체한다. 실제 생성 클래스의 OPT_KEYS로 옵션 키를 정규화한다.
            name이 undefined이면 Section을 사용한다. 클릭 키·원형 객체·측정 도형은 undefined, 입력점·필터 식별자·선택 형상·측정점은 빈 배열, 필터 정보는 빈 사전으로 초기화한다. 라벨 그룹을 새로 만들고 extension=base, 선 너비=0.1로 둔다.

    override setApp(app: U3dApp) -> void
        의존:
            UAnaly — 부모 앱 연결과 기존 앱; 함수: {setApp()}; 속성 읽기: {_app}
            U3dSelect — 모델 선택 소유자; 생성자: {new U3dSelect()}; 함수: {setApp(), remove()}
        동작:
            _selector가 truthy이고 연결한 앱이 app과 같으면 부모 setApp(app)만 호출하고 반환한다.
            그 외에는 _selector가 truthy이면 기존 선택기를 remove()로 제거한다.
            부모 setApp(app)을 호출하고 기본 옵션으로 U3dSelect를 생성한다. 별도 식별 정책 플래그 없이 선택기의 공통 식별을 사용하며, 앱을 연결한 뒤 _selector에 저장한다.
            선택기의 active()와 setMode()는 호출하지 않으며 Section의 입력 이벤트 등록을 유지한다.

    static #reportSelectionError(error: unknown) -> void
        의존: Web API — 선택 실패 기록; 함수: {console.error()}
        동작:
            콘솔 error에 UAnalySection selection failed와 원래 error를 전달한다.

    override active() -> void
        의존:
            UAnaly — 활성화·입력·장면; 함수: {active(), off()}; 속성 읽기: {_app, _type, _sceneComment}
            U3dApp — 모드·미리보기; 함수: {setMode(), setProperties()}; 속성 쓰기: {_mode}
            UDEF — 분석 모드; 상수: {APP_MODE._SECTION, DEPTH_PREVLINE_TYPE.BASE}
            THREE.TextureLoader — 이미지 요청; 함수: {load()}
            Object3D — 장면 연결; 함수: {add()}
            defaultValue — 직접 기능; 함수: {defaultValue()}
            defined — 직접 기능; 함수: {defined()}
            THREE.TextureLoader — 생성; 생성자: {new TextureLoader()}
            THREE.SpriteMaterial — 생성; 생성자: {new SpriteMaterial()}
            THREE.Sprite — 생성; 생성자: {new Sprite()}
        동작:
            부모 active()를 실행한다. 클릭 또는 더블클릭 키가 남아 있으면 자신의 이벤트를 모두 해제한다.
            앱 모드를 SECTION으로 저장하고 setMode로 적용한다. 이전 앱 입력 리스너를 해제한 뒤 측정 레이어를 연결하고 현재 _type에 맞는 입력 이벤트를 등록한다.
            앱의 BASE 미리보기 속성을 _extension 또는 undefined 기본값 base로 설정하고 onChange를 자신에 바인딩한다.
            이미지 URL이 정의되어 있으면 텍스처를 요청한다. 성공·진행 콜백은 비어 있고 실패는 콘솔에 기록한다. 흰 스프라이트를 새로 만들며 크기 1000, depthWrite=false, transparent=true, opacity=0.7로 설정한다.
            미리보기 라벨을 만들고 존재하면 숨긴다. 주석 장면이 존재하면 라벨 그룹을 추가한다.

    override deactive() -> void
        의존:
            UAnaly — 활성 상태·비활성화; 함수: {deactive()}; 속성 읽기: {_isActive, _app}
            U3dApp — 입력 해제; 함수: {unkey(), off()}
        동작:
            _isActive가 falsy이면 종료한다.
            _isActive가 truthy이면:
                부모 deactive()를 실행한다. 앱의 click·change 키를 해제하고 두 이벤트 전체를 off한다. _clickId와 _onChange를 undefined로 둔다.

    override clear() -> void
        의존:
            UAnaly — 장면·강조·앱; 함수: {removeAllHighlight()}; 속성 읽기: {_app, _sceneComment}
            U3dApp — 측정 도형·갱신; 함수: {setUpdateDate()}; 속성 읽기: {_measureLayer}
            UMeasureLayer — 그리기 해제; 함수: {clearDrawFeature()}
            UDEF — 자원 해제; 함수: {disposeObject3D()}
            Object3D — 장면 수명; 함수: {traverse(), clear(), remove()}
            defined — 직접 기능; 함수: {defined()}
            UGroup — 생성; 생성자: {new UGroup()}
        동작:
            필터 전체를 제거한다.
            _poiGroup이 defined이면:
                자식이 있으면 그룹을 순회하여 자원을 해제하고 clear한다. 주석 장면에서 그룹을 분리하고 _poiGroup을 새 그룹으로 교체하며 _filteredObject·_filteredList를 비운다.
                _pickList가 비어 있지 않으면 각 형상을 해제·장면 분리한 뒤 _pickList를 새 빈 배열로 바꾼다. 스프라이트가 정의되어 있으면 장면에서 분리한다.
            선택기의 모델 선택과 외곽선을 해제하고 측정 레이어의 그리기 도형을 비운다. 측정 도형을 확정한 뒤 제거하고 강조를 모두 해제한 후 앱 갱신을 요청한다.

    setLineWidth(width: number) -> void
        동작:
            _lineWidth에 width를 그대로 저장한다.

    getLineWidth() -> number
        동작:
            _lineWidth를 반환한다.

    passToClickEvent(func: EventCallBack, event?: string) -> void
        의존:
            UAnaly — 분석 이벤트 구독; 함수: {on()}
            defined — 직접 기능; 함수: {defined()}
        동작:
            func가 정의되지 않았으면 종료한다.
            func가 정의되어 있으면 event가 정의되지 않은 경우 click, 그 외에는 지정한 event에 자신의 on으로 등록한다.

    setGridSpriteImage(url: string, size?: number, opacity?: number) -> void
        의존:
            THREE.TextureLoader — 이미지 요청; 함수: {load()}
            defined — 직접 기능; 함수: {defined()}
            THREE.TextureLoader — 생성; 생성자: {new TextureLoader()}
            THREE.SpriteMaterial — 생성; 생성자: {new SpriteMaterial()}
            THREE.Sprite — 생성; 생성자: {new Sprite()}
        동작:
            url이 정의되지 않았으면 종료한다.
            url이 정의되어 있으면:
                size가 정의되지 않았거나 음수이면 1000, opacity가 정의되지 않았거나 음수이면 0.7을 사용한다. 0은 유지한다.
                URL을 저장하고 텍스처를 요청한다. 성공·진행 콜백은 비어 있고 실패는 콘솔에 기록한다.
                흰 스프라이트를 새로 만들고 sizeAttenuation=false, 세 축 크기=size, depthWrite=false, transparent=true와 지정 opacity를 적용한다. 이전 자원을 직접 해제하거나 새 스프라이트를 장면에 추가하지 않는다.

    removeFilter(id: string) -> void
        의존:
            UAnaly — 앱·장면·이벤트; 속성 읽기: {_app, _sceneComment}; 함수: {dispatchEvent()}
            U3dApp — 주석 장면·갱신; 속성 읽기: {_sceneComment}; 함수: {changeUpdate()}
            UMesh·U3dCircle — 표시 형상의 실행 중 식별자; 속성 읽기: {id}
            UDEF — 자원 해제; 함수: {disposeObject3D()}
            Object3D — 장면 분리; 함수: {remove()}
            defined — 직접 기능; 함수: {defined()}
        동작:
            _sceneComment가 falsy이면 종료한다. 장면 자식과 선택 형상 배열을 잡고 식별자를 문자열로 만든 뒤 장면 자식이 없으면 종료한다.
            식별자를 대소문자 없이 비교하여 첫 선택 형상을 해제하고 선택 형상 목록에서 일치 항목을 모두 제외한다.
            장면에서 같은 식별자의 UMesh 또는 U3dCircle을 찾지 못하면 종료한다.
            장면에서 같은 식별자의 형상을 찾으면:
                필터 식별자 목록에서 일치 항목을 모두 제외한다. 입력 id와 정확히 일치하는 사전 항목의 poiGroupID로 라벨 그룹을 찾고 존재하면 해제·분리한다.
                _sceneComment가 truthy이면 해당 필터의 arr를 순회하며 각 모델 또는 결과 기술자의 선택을 선택기 어댑터로 해제한다. 각 해제 오류는 콘솔에 기록하고 다음 항목을 계속 처리한다.
                필터 사전 항목을 undefined로 쓴 뒤 삭제한다. 이전 선택 형상 배열과 찾은 형상을 장면 remove에 전달한다.
                _sceneComment가 truthy이면 측정 도형을 비운 뒤 click 이벤트를 보내고 changeUpdate를 호출한다.

    removeAllFilter() -> void
        의존:
            UMesh — 표시 형상의 실행 중 식별자; 속성 읽기: {id}
            defined — 직접 기능; 함수: {defined()}
        동작:
            _pickList가 defined이면 진입 시 배열을 forEach하며 각 형상의 Object3D.id를 문자열로 바꿔 removeFilter에 전달한다. removeFilter가 배열을 교체해도 원래 배열의 반복은 계속한다. 표시 형상에 모델 재로딩용 puid를 부여하지 않는다.

    getFilteredList() -> Array<string>
        동작:
            _filteredList 원본 배열을 반환한다.

    getFilteredObject() -> Record<string, unknown>
        동작:
            _filteredObject 원본 사전을 반환한다.

    override setType(type: string) -> void
        의존:
            UAnaly — 분석 유형; 속성 쓰기: {_type}
            defined — 직접 기능; 함수: {defined()}
        동작:
            type이 정의되지 않았으면 종료한다. 정의되어 있으면 _type에 그대로 저장한다. 즉시 이벤트를 다시 연결하지 않는다.

    getResultFromCoordinate(point1: GeoPosition, point2: GeoPosition) -> void
        의존:
            UAnaly — 앱·그리기 인자; 속성 읽기: {_app, _drawArg}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
            UDrawArg — 좌표 변환; 함수: {getGeographicToWorld()}
            Object3D — 라벨 연결; 함수: {add()}
            defined — 직접 기능; 함수: {defined()}
            THREE.Vector3 — 생성; 생성자: {new Vector3()}
        동작:
            두 입력 중 하나라도 정의되지 않았으면 종료한다.
            두 입력이 정의되어 있으면:
                두 위경도 좌표를 THREE.Vector3로 만든 뒤 그리기 인자의 getGeographicToWorld에 각 x·y·z를 전달하여 변환한다. 각 점의 라벨을 만들고 없으면 건너뛴다.
                라벨의 두 번째 자식 머티리얼이 있으면 size=15로 두고 이름을 measure로 설정한다. 첫 라벨은 루트 그룹에 add하고 두 번째 라벨은 마지막 그룹의 children 배열에 직접 추가한다.
                extension이 extensions이면 각 점의 수직선을 그린다. 두 점의 거리선을 요청한 뒤 앱을 갱신한다. _currentGroup을 새로 설정하지 않는다.

    clearSelect() -> void
        의존: U3dSelect — 선택·외곽선·재로딩 구독 해제; 함수: {clearSelect()}
        동작:
            _selector가 truthy이면 clearSelect(true)에 모델 선택과 외곽선·모델별 재로딩 구독 해제를 위임한다.
            단면 영역과 측정 도형은 이 메서드에서 제거하지 않는다.

    addSelected(object: UMesh | Array<UMesh>) -> void
        의존:
            UAnaly — 연결 앱·그리기 인자·선택 이벤트; 속성 읽기: {_app, _drawArg}; 함수: {dispatchEvent()}
            U3dApp — 소속 레이어 존재 확인; 함수: {getLayer()}
            UMesh — 소속 레이어; 함수: {getLayerName()}
            U3dSelect(selector) — 모델 선택과 공통 선택 키; 함수: {addSelected(), getObjectKey()}
            UDrawArg — 배열·그 밖의 입력 갱신; 함수: {setUpdateDate()}
            defined — 레이어 존재 판정; 함수: {defined()}
        동작:
            object가 UMesh이면 소속 레이어 존재 여부를 잡고 선택기의 addSelected(object)를 호출한다.
            object가 UMesh이면 반환 Promise의 거부에 원래 오류 기록을 연결하며 공개 호출은 Promise를 반환하지 않는다. 동기 호출 오류는 그대로 밖으로 전달된다.
            object가 UMesh이고 소속 레이어가 없으면 선택 완료를 기다리지 않고 현재 선택 모델 목록을 읽는다. 각 모델의 selector.getObjectKey 결과를 키, 모델 원본을 값으로 한 사전을 data로 하는 select 이벤트를 발송한 뒤 반환한다. 키 구성 규칙을 Section에서 다시 분기하지 않는다.
            object가 UMesh이고 소속 레이어가 있으면 별도 select 이벤트 없이 반환한다.
            object가 배열이면 각 항목에 addSelected를 재귀 호출한다.
            배열 또는 그 밖의 입력은 마지막에 그리기 인자를 갱신한다.

    getDistanceLine(start: WorldPositionVector3, end: WorldPositionVector3, getLine?: boolean) -> U3dLine | undefined
        의존:
            Object3D — 거리선 연결; 함수: {add()}
            defined — 직접 기능; 함수: {defined()}
            U3dLine — 생성; 생성자: {new U3dLine()}
        동작:
            getLine이 falsy이고 _currentGroup이 없으면 undefined를 반환한다. 그룹 이름 또는 빈 문자열을 라벨 식별자로 사용한다.
            start·end가 모두 THREE.Vector3이고 라벨 식별자가 정의되어 있으면:
                두 원본 벡터로 너비 0.5·흰색 U3dLine을 만든다. depthTest·depthWrite를 false로 둔다.
                getLine이 falsy이고 현재 그룹이 있으면 선을 그룹에 추가한다. 선을 반환한다.
            그 외에는 undefined를 반환한다.

    intersectMesh(cylinder: U3dCylinder, bottom: number, height: number, mesh: UMesh, invert?: boolean) -> boolean
        의존:
            defined — 입력 존재 검사; 함수: {defined()}
        동작:
            원기둥 또는 geometry가 정의되지 않았거나, bottom과 height가 모두 정의되지 않았거나, mesh가 정의되지 않았으면 false를 반환한다.
            try 내부 오류는 콘솔에 Intersect Mesh checking Error로 기록하고 false를 반환한다. 예외 경로에서 별도 복원을 추가하지 않는다.

    drawVerticalLine(dist: Vector3, name?: string) -> void
        의존:
            UAnaly — 그리기 인자; 속성 읽기: {_drawArg}
            U3dApp — 수직 지점; 함수: {closestPointAtVector3_()}
            U3dBilboard — 라벨; 함수: {setPosition(), setLabel(), setPointSize(), setPointColor()}
            UDEF — 이전 선 해제; 함수: {disposeObject3D()}
            Object3D — 선 수명; 함수: {add(), remove()}
            defined — 직접 기능; 함수: {defined()}
            THREE.Vector3 — 생성; 생성자: {new Vector3()}
            U3dBilboard — 직접 기능; 정적 함수: {makeBilboard()}
        동작:
            dist가 THREE.Vector3가 아니면 종료한다.
            dist가 THREE.Vector3이면:
                복제 좌표의 z를 1000 올려 closestPointAtVector3_를 조회하고 결과가 정의되지 않았으면 z=0을 사용한다.
                결과 높이에서 dist까지 현재 너비의 원기둥 선을 만들고 결과 높이를 소수 둘째 자리 m 라벨로 표시한다.
                이전 수직 라벨이 있으면 위치·문자를 갱신하고 이전 선을 해제·분리한 뒤 새 선을 연결한다. 없으면 초록색·크기 3 빌보드와 새 선을 만든다.
                선 z를 두 높이 차의 절반으로 둔다. 기존 수직 라벨을 재사용하는 경로에서만 입력 name으로 라벨·선 이름을 바꾼다. name이 prevLine이 아니면 마지막 라벨 그룹의 children에 직접 추가하고, prevLine이면 미리보기에 없는 수직 라벨만 연결한다.

addEventListener(type: string) -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱; 속성 읽기: {_app}
        U3dApp — 입력 구독; 함수: {off(), on()}
        UMeasureLayer — 측정 형식; 함수: {setMeasureType()}
    동작:
        선택 레이어가 정의되지 않았으면 종료한다.
        _selectLayer가 truthy이면:
            crossSection·longitudinal·circle·cylinder 각 모드에서 기존 click·dblclick 이벤트를 off한다.
            crossSection은 횡단면 클릭·더블클릭, longitudinal은 종단면 클릭·더블클릭을 자신에 bind하여 등록하고 측정 형식을 Polygon으로 설정한다.
            circle·cylinder는 해당 클릭만 자신에 bind하여 등록하고 측정 형식을 PointBuffer로 설정한다. 등록 결과가 nullish이면 키를 undefined로 둔다.

longitudinalClick(e: U3dMouseEvent) -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱·그리기 인자·장면·갱신; 속성 읽기: {_app, _drawArg, _sceneComment}; 함수: {update()}
        U3dApp — 모델·지형·입력·갱신; 함수: {setUpdateDate(), on(), off()}
        UDrawArg — 좌표 변환; 함수: {getWorldToGeographic()}
        UMeasureLayer — 측정점; 함수: {addMeasurePoint()}
        UMeasureLayer — 그리기 해제; 함수: {clearDrawFeature()}
        UDEF — 그룹 해제·디버그 진단; 함수: {disposeObject3D()}; 속성 읽기: {debug}
        Object3D — 표시 연결·행렬; 함수: {add(), updateMatrixWorld()}
        UAnaly — 모델·지형 교차; 함수: {intersectModel(), intersectTerrain()}
        defined — 직접 기능; 함수: {defined()}
        UGroup — 생성; 생성자: {new UGroup()}
    동작:
        측정 레이어가 없으면 종료한다. 이전 확정 도형이 남아 있으면 그리기·현재 라벨 그룹·측정 도형을 정리하고 앱을 갱신한다.
        입력점이 두 개 이상이면:
            정규화 화면 좌표로 스프라이트 교차 라벨을 갱신한다. 점 수가 3 이하이면 첫 두 점, 그보다 많으면 마지막 두 점의 거리선을 요청한다. 끝점이 정의되어 있으면 위경도 변환 결과를 측정 레이어에 추가하고 반환 도형이 정의되어 있으면 저장한다. 종료한다.
        입력점이 두 개 미만이면:
            모델 교차 중 z가 NaN이 아닌 첫 점을 찾고 없으면 지형 교차를 사용한다. 점이 없으면 종료한다.
            점이 있으면 선택을 비우고 측정점을 추가한다. 라벨을 만든다. 현재 그룹이 없으면 새 measure 그룹을 만들고 라벨을 추가한다.
            점을 입력 목록에 추가한다. 마지막 점이 정의되어 있으면 스프라이트를 이동하고 미리보기를 표시하며, 이 경로에서 _prevLine이 falsy이면 새 미리보기를 만든다. mousemove를 연결한다. 마지막 점이 정의되지 않았으면 미리보기를 숨기고 mousemove를 off한다.
            스프라이트가 있으면 행렬 갱신 후 장면에 추가한다. 라벨 그룹 이름을 analysisSection으로 두고 장면에 추가한 뒤 앱과 분석을 갱신한다.

getSelectLayer() -> SelectLayerLike | undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱; 속성 읽기: {_app}
        U3dApp — 측정 레이어; 속성 읽기: {_measureLayer}
    동작:
        앱의 _measureLayer 원본을 반환한다.

crossSectionClick(e: U3dMouseEvent) -> boolean|void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱·그리기 인자·장면; 속성 읽기: {_app, _drawArg, _sceneComment}
        U3dApp — 교차점·갱신; 함수: {intersectAtPixel(), setUpdateDate()}
        UDrawArg — 좌표 변환; 함수: {getWorldToGeographic()}
        UMeasureLayer — 측정점; 함수: {addMeasurePoint()}
        UMeasureLayer — 그리기 해제; 함수: {clearDrawFeature()}
        UDEF — 그룹 해제; 함수: {disposeObject3D()}
        Object3D — 표시 연결; 함수: {add()}
        defined — 직접 기능; 함수: {defined()}
        U3dBilboard — 직접 기능; 정적 함수: {makePoint()}
        UGroup — 생성; 생성자: {new UGroup()}
    동작:
        _sceneComment가 정의되지 않았으면 false를 반환한다. _sceneComment가 defined인 경로에서 이전 확정 도형이 남아 있으면 그리기·현재 그룹·측정 도형을 정리하고 앱을 갱신한다.
        _sceneComment가 defined이면 측정 레이어를 조회한다. 측정 레이어가 없으면 종료한다. intersectAtPixel(e, true)의 첫 점을 선택하고 z가 NaN 또는 음수이면 원본 점의 z를 0으로 바꾼다.
        점이 없으면 디버그 조건에서 로그를 남기고 종료한다.
        _sceneComment가 defined이고 점이 있으면 빌보드 점 라벨을 만들고 라벨 그룹이 비었거나 현재 그룹이 없으면 새 그룹을 만들며, 그 외에는 현재 그룹에 추가한다. 장면에 루트 그룹을 연결하고 원본 점을 입력 목록에 저장한 뒤 선택을 비운다. 위경도 좌표의 측정점을 추가하고 반환 도형이 정의되어 있으면 저장한다.

crossSectionDblclick() -> boolean
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        Web API — 높이 입력; 함수: {prompt()}
        UAnaly — 앱·이벤트; 속성 읽기: {_app, _type}; 함수: {dispatchEvent()}
        Object3D — 장면·거리선 연결; 함수: {add()}
        BufferGeometry — 갱신 정점의 경계 계산; 함수: {computeBoundingBox(), computeBoundingSphere()}
        Vector3 — 기준점에 대한 거리선 위치 변환; 함수: {sub()}
        THREE.Vector3 — 생성; 생성자: {new Vector3()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        먼저 높이를 prompt로 요청한다. 취소 null도 이후 Number 변환에서 0이 된다.
        입력점이 두 개보다 많으면:
            첫 점을 끝에 붙여 닫고 입력 높이에서 각 변의 U3dLine을 만든 다음 평면 형상을 만든다.
            평면 형상이 있으면 형상의 위치 z를 Number(입력 높이)로 설정하고 정점 x·y는 입력점에서 형상 위치를 뺀 상대좌표, 정점 z는 0으로 저장한다. 유효하지 않은 항목을 만나면 입력점과 미리보기를 정리하고 반복을 중단한다.
            평면 형상이 있으면 position 속성을 갱신 대상으로 표시하고 geometry의 경계 상자·경계 구를 다시 계산한다. 각 거리선의 위치에서 형상 위치를 빼고 add()로 자식에 연결한 뒤 형상을 장면에 추가한다.
        점 개수와 무관하게 입력 높이로 교차 모델을 구하고 비어 있지 않으면 선택한다.
        평면 형상과 라벨 그룹 자식이 있으면 형상 원본과 Object3D.id의 문자열을 선택 형상·필터 목록에 등록하고 마지막 라벨 그룹 이름도 그 문자열로 바꾼다. 원래 숫자 id를 사전 키로 사용하여 arr·type·poiGroupID를 기록한다. 높이는 취소가 아닌 경우 Number 변환값, 취소이면 undefined를 저장한다.
        측정점을 확정하고 입력점을 비우며 click을 발송한 뒤 true를 반환한다.

makePoint(point: Vector3 | {x: number, y: number, z: number}, prevObj?: MeasurePOILike) -> MeasurePOILike | undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        defined — 직접 기능; 함수: {defined()}
        U3dBilboard — 직접 기능; 정적 함수: {makePoint()}
        U3dBilboard — 직접 기능; 정적 함수: {makeBilboard()}
    동작:
        point가 정의되지 않았으면 undefined를 반환한다.
        point가 정의되어 있으면:
            z를 소수 첫째 자리 m 문자로 만든다. extension이 base이면 기존 라벨의 위치만 갱신하거나 makePoint로 새 점을 만든다.
            extension이 base가 아니면 기존 라벨의 위치·문자를 갱신하거나 makeBilboard로 새 라벨을 만든다.
            라벨이 정의되어 있으면 점 크기를 3으로 설정하고 반환한다.

longitudinalDblclick() -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱·이벤트; 속성 읽기: {_app, _type}; 함수: {dispatchEvent()}
        U3dApp — 입력 해제; 함수: {off()}
        Object3D — 장면 연결·숨김; 함수: {add(), remove(), traverse()}
        BufferGeometry — 갱신 정점의 경계 계산; 함수: {computeBoundingBox(), computeBoundingSphere()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        입력점이 세 개 이하이면 종료한다.
        입력점이 세 개보다 많으면:
            마지막과 첫 점의 거리선을 요청하고 첫 점을 끝에 붙인 뒤 인덱스 1의 점을 제거한다. 평면 형상을 만들고 없으면 종료한다.
            평면 형상이 있으면 정점마다 입력점에서 형상의 위치를 뺀 상대좌표를 저장한다. 유효하지 않은 항목을 만나면 _drawPoint·스프라이트·미리보기·mousemove를 정리하고 반복을 중단한다. position 속성을 갱신 대상으로 표시하고 geometry의 경계 상자·경계 구를 다시 계산한다.
            형상을 장면과 선택 형상 배열에 추가하고 높이 0으로 교차 후보를 구한다. 후보가 비어 있지 않으면 collisionMesh로 각각 검사하고 참인 모델을 선택한다. 정밀 결과가 비어 있지 않은 때만 후보 목록을 정밀 결과로 대체한다.
            입력점·스프라이트·미리보기·mousemove를 정리하고 현재 그룹이 있으면 이름을 형상의 Object3D.id 문자열로 바꾼다. 필터 목록에는 그 문자열, 필터 사전에는 숫자 id 키로 arr·type·poiGroupID를 저장한다.
            측정점을 확정하고 click을 발송한 뒤 _currentGroup을 undefined로 둔다.

circleClick(e: U3dMouseEvent) -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱·그리기 인자·갱신·이벤트; 속성 읽기: {_app, _drawArg, _type}; 함수: {update(), dispatchEvent()}
        U3dApp — 지형·입력·갱신; 함수: {intersectTerrainAtPixel(), on(), off(), setUpdateDate()}
        UDrawArg — 좌표 변환; 함수: {getWorldToGeographic()}
        UMeasureLayer — 측정점; 함수: {addMeasurePoint()}
        UMeasureLayer — 그리기 해제; 함수: {clearDrawFeature()}
        UDEF — 라벨 해제; 함수: {disposeObject3D()}
        Object3D — 표시 연결·행렬; 함수: {add(), remove(), updateMatrixWorld()}
        UAnaly — 지형 교차; 함수: {intersectTerrain()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        측정 레이어 또는 지형 교차점이 없으면 종료한다.
        측정 레이어와 지형 교차점이 있으면:
            이전 측정 도형이 있으면 _feature로 옮기고 그리기·측정 도형을 비운 뒤 앱을 갱신한다. _prevLine이 falsy이면 새 미리보기를 만든다. _prevLine이 truthy이면 표시한다.
            점 라벨을 만들어 circleType_startPoint로 명명하고 _currentPoi에 저장한다. 원본 교차점을 입력 목록에, 위경도 좌표를 측정점 목록에 넣고 addMeasurePoint의 결과를 _measureFeature에 저장한다. mousemove를 연결한다.
            입력점이 두 개보다 적으면 스프라이트 행렬·라벨 장면을 갱신하고 종료한다.
            입력점이 두 개 이상이면 mousemove 리스너를 해제한다. _curCircle이 defined이면 선택을 비우고 교차 모델을 구해 선택한다.
            _curCircle이 defined이면 측정점 목록을 빈 배열로, _curCircle을 undefined로 초기화하고 원형과 거리 라벨을 미리보기에서 장면 좌표로 옮긴다. 형상·필터 식별자·선택기가 현재 보관한 모델 참조 배열·type·poiGroupID를 저장하고 측정 도형·미리보기·_feature를 정리한 뒤 장면에 추가한다.
            입력점이 두 개 이상이면 _drawPoint를 빈 배열로 바꾼다. _currentPoi가 truthy이면 자원을 해제하고 _currentPoi를 undefined로 초기화한다. 두 번째 클릭의 click을 발송한 뒤 스프라이트 행렬·라벨 장면·분석을 갱신한다.

cylinderClick(e: U3dMouseEvent) -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱·그리기 인자·갱신·이벤트; 속성 읽기: {_app, _drawArg, _type}; 함수: {update(), dispatchEvent()}
        U3dApp — 모델·지형·입력·갱신; 함수: {setUpdateDate(), on(), off()}
        UDrawArg — 좌표 변환; 함수: {getWorldToGeographic()}
        UMeasureLayer — 측정점; 함수: {addMeasurePoint()}
        UMeasureLayer — 그리기 해제; 함수: {clearDrawFeature()}
        Object3D — 표시 연결·행렬·숨김; 함수: {add(), remove(), updateMatrixWorld(), traverse()}
        UAnaly — 모델·지형 교차; 함수: {intersectModel(), intersectTerrain()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        측정 레이어가 없으면 종료한다. 이전 측정 도형이 있으면 _feature로 옮기고 그리기·측정 도형을 비운 뒤 앱을 갱신한다.
        입력점이 하나 이상이면:
            원본 이벤트 clientX·clientY로 원기둥 미리보기를 갱신하고 오류는 콘솔에 기록한다. 스프라이트·미리보기를 숨기고 원기둥을 미리보기에서 분리하여 장면 좌표로 옮긴다. 미리보기 자원과 mousemove를 정리한다.
            _curCircle이 defined이면:
                원본을 curCylinder로 잡고 선택 형상과 Object3D.id 문자열을 등록하며 _curCircle=undefined로 만든다. 마지막 라벨 그룹 이름을 같은 문자열로 바꾸고 선택을 비운 뒤 높이 0의 후보를 구한다.
                후보와 시작·끝 점이 존재하면 높이 절댓값과 상하 방향으로 intersectMesh를 호출한다. 교차하고 _isPicked가 정의되지 않은 모델만 선택하고 나머지 중 이미 선택된 키는 해제한다.
                측정점 목록·_feature·측정 도형·_drawPoint를 비우고 선택기가 현재 보관한 모델 참조 배열·type·poiGroupID를 저장하여 장면에 추가한다.
            현재 원기둥 존재 여부와 무관하게 click을 발송하고 종료한다.
        입력점이 하나 미만이면:
            모델 교차 중 z가 NaN이 아닌 첫 점, 없으면 지형 교차를 사용하고 없으면 종료한다. 위경도 좌표를 측정점 목록과 레이어에 추가한 결과를 _measureFeature에 저장한다.
            점 라벨을 만들고 없으면 종료한다. 점 라벨이 있으면 measure로 명명하고 입력점·라벨 그룹에 추가한다. 스프라이트를 이동하고 미리보기를 표시하며 _prevLine이 falsy이면 새 미리보기를 만든 뒤 mousemove를 연결한다.
            스프라이트 행렬·장면을 갱신하고 그룹 이름을 CylinderArea로 설정하여 장면에 추가한다. click을 보내고 분석을 갱신한다.

isSelected(object: UMesh | {layerName: string, id: unknown}) -> boolean
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존: defined — 현재 선택 여부; 함수: {defined()}
    동작:
        선택기가 현재 보관한 대상이 defined인지 반환한다.

removeEventListener() -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 연결 앱; 속성 읽기: {_app}
        U3dApp — 입력 해제; 함수: {unkey()}
        defined — 등록 키 존재; 함수: {defined()}
    동작:
        click·dblclick 키가 각각 defined이면 앱에서 해당 키를 unkey하고 undefined로 만든다.
        모델 재로딩 구독은 선택기가 유지하며 입력 모드 재활성화에서 해제하지 않는다.

clearMeasureFeature() -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱; 속성 읽기: {_app}
        U3dApp — 측정 도형 해제; 함수: {removeMeasureFeature()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        측정점을 먼저 확정한다. _measureFeature가 정의되어 있으면 앱 removeMeasureFeature로 제거하고 undefined로 둔다.

commitFeature() -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱; 속성 읽기: {_app}
        U3dApp — 측정점 확정; 함수: {commitMeasurePoint()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        앱 commitMeasurePoint의 결과가 정의되어 있으면 _measureFeature를 그 결과로 교체한다.

getScreenToWorld_(x: number, y: number, name?: string, prevObj?: MeasurePOILike) -> MeasurePOILike | undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱; 속성 읽기: {_app}
        THREE.Raycaster — 스프라이트 교차; 함수: {intersectObject()}
        Object3D — 미리보기 연결; 함수: {add(), remove()}
        UDEF — 이전 선 해제; 함수: {disposeObject3D()}
        THREE.Vector3 — 생성; 생성자: {new Vector3()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        교차가 있으면:
            첫 점을 복사하고 prevLine 외 이름은 measure로 맞춘다. 입력점이 하나 이상인 measure이면 위치를 목록에 추가한다.
            입력점이 두 개 이상이면 마지막 두 점을 선 끝으로 사용하되 점 수가 3보다 많으면 마지막 점과 현재 위치를 사용한다. 이전 미리보기 선의 자원을 해제하고 현재 너비의 선을 만든다. 이 경로에서 이전 선을 부모의 remove로 직접 분리하지는 않는다.
            점 라벨을 만들고 이름을 지정한다. measure이면 현재 그룹에 연결하고 extensions에서 수직선을 그린다.
            prevLine이면 새 선을 미리보기에 연결하여 상대 좌표와 userData.line을 설정하고 수직 라벨을 갱신하여 상대 좌표로 옮긴다.
            _drawPoint[1]을 현재 위치로 쓴다. index 0 존재 여부를 추가 검증하지 않는다.
        교차가 없으면 콘솔에 기록한다. 생성 라벨이 정의되어 있으면 반환하고 그 외에는 prevObj를 반환한다.

getCylinderToWorld_(x: number, y: number, name?: string, prevObj?: MeasurePOILike) -> MeasurePOILike | undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱·그리기 인자; 속성 읽기: {_app, _drawArg}
        U3dApp — 카메라·영역; 함수: {getCamera(), container()}
        Web API — 화면 크기; 함수: {getBoundingClientRect()}
        Camera — 카메라 행렬; 함수: {updateMatrixWorld()}
        THREE.Raycaster — 스프라이트 교차; 함수: {setFromCamera(), intersectObject()}
        UDrawArg — 좌표 변환; 함수: {getWorldToGeographic()}
        UMeasureLayer — 측정점·위치; 함수: {addMeasurePoint(), updateLastPosition()}
        U3dBilboard — 거리 라벨; 함수: {setLabel(), setPosition()}
        UDEF — 이전 원기둥 해제; 함수: {disposeObject3D()}
        Object3D — 표시 연결·행렬; 함수: {add(), remove(), updateMatrixWorld()}
        THREE.Raycaster — 생성; 생성자: {new Raycaster()}
        THREE.Vector3 — 생성; 생성자: {new Vector3()}
        THREE.Vector2 — 생성; 생성자: {new Vector2()}
        defined — 직접 기능; 함수: {defined()}
        U3dBilboard — 직접 기능; 정적 함수: {makeText()}
    동작:
        새 Raycaster를 만들고 컨테이너 폭·높이로 client 좌표를 정규화한다. 컨테이너 left·top은 빼지 않는다. 카메라·스프라이트 행렬을 갱신하고 스프라이트 교차를 구한다.
        교차가 있으면:
            첫 교차점을 복사하고 prevLine 외 이름은 measure로 맞춘다. 첫 입력점 높이의 수평 끝점에서 반경, 교차점과 첫 점의 z 차로 부호 있는 높이를 구한다.
            반경 선·거리 라벨과 높이 선·높이 라벨을 생성 또는 재사용한다. prevObj가 truthy이고 prevObj.userData.distanceLabel이 falsy이면 새 거리 라벨을 distanceLabel에 저장한다. prevObj가 truthy이고 prevObj.userData.verticalLabel이 falsy이면 새 높이 라벨을 verticalLabel에 저장한다. 라벨은 소수 둘째 자리 m이며 높이 문자는 절댓값이다.
            거리·높이 선은 원기둥 children 배열에 직접 넣는다. prevObj가 truthy이면 이전 원기둥을 해제·부모 분리한 뒤 새 형상을 userData.cylinder에 저장하고 이전 점 기준 상대 좌표로 옮긴다.
            끝점을 위경도로 변환하되 z는 끝점 z로 덮어쓴다. 측정점이 하나이면 레이어에 추가하고 마지막 위치를 갱신한 다음 측정점 목록에 넣는다.
            점 라벨을 만들고 필요하면 원기둥을 children에 직접 붙인다. measure이면 그룹·입력점·현재 원기둥을 갱신하고 extensions 수직선을 그린다.
            prevLine이면 수직 라벨을 갱신·상대 좌표로 옮기고 미리보기에 원기둥을 연결한다.
        교차가 없으면 콘솔에 기록한다. 생성 라벨이 정의되어 있으면 반환하고 그 외에는 prevObj를 반환한다.

getCircleToWorld_(e: U3dMouseEvent, name?: string, prevObj?: MeasurePOILike) -> MeasurePOILike | undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱·그리기 인자; 속성 읽기: {_app, _drawArg}
        UAnaly — 지형 교차; 함수: {intersectTerrain()}
        UDrawArg — 좌표 변환; 함수: {getWorldToGeographic()}
        UMeasureLayer — 측정점·위치; 함수: {addMeasurePoint(), updateLastPosition()}
        U3dBilboard — 거리 라벨; 함수: {setLabel(), setPosition()}
        UDEF — 이전 원형 해제·디버그 진단; 함수: {disposeObject3D()}; 속성 읽기: {debug}
        Object3D — 표시 연결; 함수: {add(), remove()}
        defined — 직접 기능; 함수: {defined()}
        THREE.Vector3 — 생성; 생성자: {new Vector3()}
        U3dBilboard — 직접 기능; 정적 함수: {makeText()}
        U3dBilboard — 직접 기능; 정적 함수: {makePoint()}
    동작:
        측정점 목록이 비었으면 prevObj를 반환한다. 이벤트 e가 정의되지 않았으면 디버그 조건에서 로그를 남기고 undefined를 반환한다. 이벤트의 instanceof 검사는 수행하지 않는다.
        지형 교차점이나 위경도 변환 결과가 없으면 prevObj를 반환한다.
        지형 교차점과 위경도 변환 결과가 있으면:
            측정점 수가 하나이면 레이어에 추가하고 마지막 위치를 갱신한 뒤 변환 결과를 목록에 넣는다. 그 후 원본 교차점의 z를 첫 입력점보다 낮지 않게 제한한다.
            시작점부터 교차점까지 3차원 거리로 반경과 거리선을 만들고 중간 위치의 소수 둘째 자리 m 라벨을 생성 또는 재사용한다.
            prevObj가 없으면 점 라벨을 만들어 원형을 연결하고 시작 라벨도 원형에 연결하여 위치를 0으로 옮긴 뒤 루트 그룹에 넣어 반환한다.
            prevObj가 있으면 위치를 갱신하고 이전 원형을 해제·부모 분리한 뒤 userData.circle에 새 원형을 저장하여 연결하고 prevObj를 반환한다.

getMergedMeshDivision(mesh: UMesh, region: Pick<OLGeometry, 'intersectsExtent'>, height: number, arr: Array<UMesh>) -> Array<UMesh>|undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱·그리기 인자; 속성 읽기: {_app, _drawArg}
        U3dApp — 레이어 조회; 함수: {getLayerByName()}
        U3dLayer — 영역별 모델 분할; 함수: {mergedMeshDivision()}
        UMesh — 경계·레이어; 함수: {getBBox(), getLayerName()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        앱·그리기 인자를 먼저 얻는다. mesh가 정의되지 않았으면 undefined를 반환한다. height가 nullish이면 0으로 둔다.
        _isMerged가 정의되어 truthy인 경로이면:
            레이어를 찾아 mergedMeshDivision이 정의된 경우 분할하고 결과 nullish는 빈 배열로 둔다.
            mesh가 defined이면 분할 결과 중 falsy 모델과 이미 선택된 모델은 건너뛴다.
        mesh가 정의되어 있고 _isMerged가 정의되어 truthy인 조건을 만족하지 않으면 경계 상자 높이만 비교하여 height 이상인 원본 모델을 arr에 추가한다. arr 원본을 반환한다.

onChange(e: U3dMouseEvent) -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 앱; 속성 읽기: {_app, _type}
        Object3D — 미리보기 행렬; 함수: {updateMatrixWorld()}
        defined — 직접 기능; 함수: {defined()}
    동작:
        이벤트 origin.clientX·clientY를 try 이전에 읽는다. 앱이 정의되지 않았으면 종료한다.
        _app이 defined이면 try 안에서 모드별 미리보기를 갱신한다. longitudinal·crossSection은 스프라이트와 미리보기가 모두 보일 때 정규화 좌표를 사용한다. circle은 이벤트를, cylinder는 client 좌표를 전달한다.
        미리보기가 정의되고 UGroup이면 행렬을 갱신한다. try 내부 오류는 Mouse Move onChange Event Error 로그로 기록한다.

getIntersectMesh(height?: number) -> Array<UMesh> | undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UAnaly — 그리기 인자; 속성 읽기: {_drawArg}
        UDrawArg — 모델 장면·좌표; 함수: {getInstanceScenesFromModelLayers(), getWorldToGoogle()}
        UMeasureFeature — 측정 영역; 함수: {getGeometry(), getType()}
        UMesh — 경계·BIM 유형; 함수: {getBBox(), isBIM()}
        OLGeometry — 영역 교차; 함수: {intersectsExtent()}
        Object3D — 모델 순회; 함수: {traverse()}
        defined — 직접 기능; 함수: {defined()}
        U3dMessage — 직접 기능; 정적 함수: {info()}
        UDEF — 측정 도형 유형; 상수: {MEASURE_TYPE.POINTBUFFER}
    동작:
        그리기 인자를 얻고 height가 nullish이면 0으로 둔다. 모델 레이어 장면 목록과 빈 결과 배열·3DTiles 감지 false를 준비한다.
        _feature가 falsy이면 undefined를 반환한다.
        _feature가 truthy이면:
            먼저 getGeometry()로 영역을 얻는다. 도형 형식이 POINTBUFFER이면 측정 도형과 그리기 인자·모드 상태를 전달한다.
            각 장면을 순회한다. USharedMesh가 아닌 UMesh 또는 U3DTilesMesh만 대상으로 한다. isBIM이 정의되어 있고 false를 반환하면 3DTiles 감지만 하고 해당 모델을 건너뛴다.
            경계 상자가 있는 모델의 두 모서리를 getWorldToGoogle로 변환해 영역 교차를 검사한다. 교차하고 _isPicked가 정의되지 않았으며 미선택이면 병합 분할·높이 필터를 적용한다. 반환 배열이 있으면 결과 참조로 사용한다.
            3DTiles를 감지했으면 다중 선택 미지원 메시지를 한 번 표시한다. 결과 배열을 반환한다.

removePrevLine() -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        UDEF — 미리보기 해제; 함수: {disposeObject3D()}
        Object3D — 부모 분리; 함수: {remove()}
    동작:
        미리보기가 정의되어 있으면 자원을 해제하고 부모가 있으면 분리한 뒤 _prevLine을 undefined로 둔다.

createPrevLine() -> MeasurePOILike | undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        Object3D — 라벨 연결; 함수: {add()}
        U3dBilboard — 직접 기능; 정적 함수: {makePoint()}
        U3dBilboard — 직접 기능; 정적 함수: {makeBilboard()}
    동작:
        extension이 base이면 원점의 makePoint, 그 외에는 원점의 makeBilboard로 미리보기를 만든다. 정의되어 있으면 이름을 prevLine으로 하고 라벨 그룹에 추가한다. 원본 라벨 또는 undefined를 반환한다.

getSelectedModels() -> Array<UMesh>
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존: U3dSelect — 현재 선택 모델; 함수: {getSelected()}
    동작:
        선택기가 있으면 getSelected() 결과에서 UMesh인 모델만 고른 새 배열을 반환한다.
        선택기가 없으면 빈 배열을 반환한다.

findSelectedObject(object: UMesh | {layerName: string, id: unknown}) -> USelect | undefined
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존:
        U3dSelect — 선택 키와 현재 객체 조회; 함수: {getObjectKey(), getSelectedAsKey(), getSelected()}
        UMesh — 결과 기술자의 레이어·현재 식별값 대응; 함수: {getLayerName()}; 정적 함수: {_getObjectId()}
    동작:
        선택기가 없으면 undefined를 반환한다.
        선택기가 있고 object가 UMesh이면 선택기 키를 구하고 문자열인 경우 현재 객체를 조회하여 반환하며 문자열이 아니면 undefined를 반환한다.
        선택기가 있고 object가 기술자이면 선택 목록에서 레이어 이름과 공통 조회 식별값이 기술자의 layerName·id에 각각 엄격히 같은 UMesh를 찾아 반환한다. 식별값은 puid 또는 현재 객체 uuid이며 문자열로 강제 변환하거나 userData에서 별도 ID를 찾지 않는다.

removeSelectedObject(object: UMesh | {layerName: string, id: unknown}) -> void
    인터페이스: this는 호출 또는 bind로 연결한 UAnalySection 인스턴스다.
    의존: U3dSelect — 단일 모델 선택·외곽선 해제; 함수: {removeSelected()}
    동작:
        선택기가 보관한 현재 대상을 조회하고 결과가 truthy이면 선택기가 존재하는 경우 그 대상을 removeSelected에 전달한다.

UAnalySectionCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string = 'Section'
            분석 이름이며 부모 옵션은 생성자에 전달하지 않는다.
SelectLayerLike 타입 정의
    setMeasureType: (type: string) => void — 입력 도형 형식 지정
    addMeasurePoint: (geo: object) => unknown — 위경도 측정점 추가
FilteredEntry 타입 정의
    arr: Array<UMesh | {layerName: string, id: unknown}> — 필터에 속한 모델 또는 선택 기술자
    type: string — 확정한 입력 모드
    poiGroupID: string | number — 라벨 그룹 식별자
    height?: number — 횡단면 입력 높이
MeasurePOILike_Content 타입 정의
    setPosition?: Function — 측정 라벨의 선택 기능
    setLabel?: Function — 측정 라벨의 선택 기능
    setPointSize?: Function — 측정 라벨의 선택 기능
    setPointColor?: Function — 측정 라벨의 선택 기능
    getUid?: Function — 측정 라벨의 선택 기능
MeasurePOILike 타입 정의 = Object3D & MeasurePOILike_Content
UAnalySectionRayContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _app: U3dApp | undefined
        _sprite: Sprite | undefined
UAnalySectionRegionContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _type: string
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
