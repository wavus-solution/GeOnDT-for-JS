# UAnalyMultipleComponent 명세

> 상태: 구현 관찰 초안

## 1. 개요

지도의 다중 컴포넌트 레이어와 연결하여 단일·구간·영역 배치 및 도로 작성을 제어한다.
선택한 컴포넌트와 도로에는 하이라이트와 기즈모 편집을 연결한다.
주요 사용처는 U3dApp의 분석 등록·조회와 GeOnDT.analysis 공개 생성자이다.

## 3. 정규 자연어 수도코드

```spec
UAnalyMultipleComponent extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반; 상속: {UAnaly}

    name: string = 'multipleComponent'
        분석 등록 이름이며 외부에서 변경할 수 있다.
    color: ColorRepresentation | undefined = undefined
        외부에서 변경할 수 있으며 edit에서 defined 조건으로 읽어 기즈모 색상을 선택한다.

    static OPT_KEYS: Array<string>
        부모 옵션과 name·scale·rotation·lineVisible의 정본 키 목록이다.
        의존: UAnaly — 부모 옵션 키; 속성 읽기: {OPT_KEYS}

    constructor(opt?: UAnalyMultipleComponentCO)
        의존:
            UAnaly — 기반 초기화; 생성자: {new UAnaly()}
            normalizeOptionKeys — 생성 키 호환; 함수: {normalizeOptionKeys()}
            defaultValue — 누락 옵션 기본값; 함수: {defaultValue()}
            UGroup — 도로와 표출 그룹; 생성자: {new UGroup()}
            UDEF — 기본 렌더 순서; 상수: {RENDER_ORDER.MODEL}
        동작:
            opt의 falsy 입력을 빈 객체로 대체하고 new.target의 OPT_KEYS로 normalizeOptionKeys를 적용한 뒤 부모를 옵션 없이 초기화한다.
            이름·선 가시성·크기·회전을 opt에서 정하며 크기·회전 객체는 복사하지 않는다.
            모델 모드, 간격 10, 곡선률 0.5, 방향 'follwLine', 편집 모드 'translate'로 시작한다.
            도로 목록과 이름 'Road' 그룹, 표출 그룹을 새로 만들고 선택·이벤트·선·POI 참조를 초기화한다.
            도로 너비·높이는 각각 10, 기본 스타일은 깊이 읽기·쓰기 true와 MODEL 렌더 순서이며 부가 옵션은 빈 객체이다.

    get additionalOpt() -> UAnalyMultipleComponentAdditionalOption
        동작: #additionalOpt 원본 참조를 반환한다.

    setAdditionalOpt(opt: UAnalyMultipleComponentAdditionalOption) -> void
        동작: 부가 옵션 참조를 #additionalOpt에 그대로 저장한다.

    setStyle(opt: Partial<UAnalyMultipleComponentStyle>) -> void
        의존: defined — 누락 판정; 함수: {defined()}
        동작:
            renderOrder가 존재하고 Number 변환 결과가 NaN이 아니면 변환 전 값을 저장한다.
            depthTest와 depthWrite는 각각 존재하는 boolean일 때만 바꾼다.

    override removeEventListener(type?: string, listener?: UEventDispatcherListener) -> void
        의존:
            UEventDispatcher — 분석 이벤트 제거; 함수: {removeEventListener()}
            defined — 누락 판정; 함수: {defined()}
        동작:
            부모의 이벤트 제거를 먼저 실행한다.
            type과 listener가 모두 없으면 앱 리스너를 제거하고 현재 작업을 끝낸다.

    override clear() -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            UAnaly — 기반 표출 정리; 함수: {clear()}
            U3dApp — 앱의 뷰·오버레이 제거; 함수: {removeAllView(), removeAllOverlay()}; 속성 읽기: {_viewList, _overlayList}
            defined — 앱 존재 판정; 함수: {defined()}
        동작:
            비활성화 후 부모를 정리하고 현재 작업을 끝낸다.
            컴포넌트·도로·선택을 이 순서로 정리한다.
            _app이 없으면 종료하며 뷰·오버레이 목록이 각각 비어 있지 않으면 앱 전체 목록을 제거한다.

    finishWork() -> void
        동작: 단일·구간·도로·영역 작업을 차례로 끝내며 생성 완료를 기다리지는 않는다.

    setSelect(active: boolean, type?: string) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_isActive, _app}
            U3dApp — 클릭 연결; 함수: {on()}
            U3dMultipleComponentLayer — 배치 도움 객체 해제; 함수: {setHelperPosition()}
            defined — 상태 판정; 함수: {defined()}
        동작:
            앱 리스너와 기즈모를 없애고 작업을 끝낸다.
            _isActive가 false이면 활성화한다.
            레이어가 있으면 도움 객체를 해제한다.
            active가 false이고 _selected가 있으면 선택을 취소한다.
            active가 true이면 type의 falsy 값을 'component'로 대체하여 저장하고 클릭 선택을 등록한다.

    addSingle(isCreateOnModel: boolean = false) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_drawArg, _isActive}
            UDrawArg — 선택 해제 뒤 화면 갱신; 함수: {setUpdateDate()}
            defined — 선택 판정; 함수: {defined()}
        동작:
            앱 리스너와 기즈모를 제거한다.
            #isCreateOnModel에 isCreateOnModel을 저장한다.
            _selected가 있으면 색상을 복원하고 _selected를 undefined로 바꾼 뒤 화면 갱신을 요청한다.
            _isActive가 false이면 활성화한다.
            단일 클릭을 연결한 뒤 _type을 'model'로 바꾼다.

    addInterval(interval: number, opt: UAnalyMultipleComponentIntervalOption = {}, isCreateOnModel: boolean = false) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app, _drawArg, _isActive}
            UDrawArg — 입력 위경도 변환; 함수: {getGeographicToWorld()}
            ULineGeometry — 구간 선 생성·교체; 생성자: {new ULineGeometry()}; 함수: {setPoints(), dispose()}
            defaultValue — 대화식 간격 기본값; 함수: {defaultValue()}
            defined — 앱·선택 판정; 함수: {defined()}
        동작:
            _app이 있으면
                #isCreateOnModel에 isCreateOnModel을 저장한다.
                opt.points가 비어 있지 않으면 각 x·y와 z || 0을 월드 좌표로 변환한다.
                직접 입력에서는 opt.lineTension이 undefined일 때만 현재 곡선률을 쓰고 0이면 직선 타입으로 선을 만든다.
                선에서 interval 간격의 좌표·회전을 얻어 생성을 시작하고 즉시 종료한다.
                직접 입력이 아니면 리스너·기즈모를 제거하고 opt.lineTension이 undefined가 아닐 때만 기존 선을 dispose하고 교체한다.
                _selected가 있으면 색상을 복원하고 _selected를 undefined로 바꾼다.
                _interval은 interval에 defaultValue를 적용하여 저장한다.
                _isActive가 false이면 활성화한다.
                클릭·더블클릭을 등록한 뒤 _type을 'model'로 바꾼다.

    addArea(interval: number, mode: string = 'area', opt: UAnalyMultipleComponentAreaOption = {}) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app, _isActive}
            ol — 입력 다각형·투영; 생성자: {new Polygon()}; 함수: {transform()}
            U3dShaderMeasureLayer — 영역 그리기 설정; 함수: {clearDrawFeature(), setMeasureType()}
            UDEF — 영역·원 모드; 상수: {SELECT_MODE, MEASURE_TYPE}
            defaultValue — 대화식 간격 기본값; 함수: {defaultValue()}
            defined — 앱·선택 판정; 함수: {defined()}
        동작:
            _app이 있으면
                opt.points가 비어 있지 않으면 x·y로 Polygon을 만들고 EPSG:4326에서 EPSG:3857로 변환한다.
                직접 입력 영역에서 interval 간격의 배치점을 얻어 생성을 시작하고 종료한다.
                그 밖에는 리스너·기즈모·측정 중 도형을 제거한다.
                _selected가 있으면 색상을 복원하고 _selected를 undefined로 바꾼다.
                mode가 AREA이면 POLYGON, CIRCLE이면 POINTBUFFER로 설정하며 다른 mode이면 종료한다.
                _interval은 interval에 defaultValue를 적용하여 저장한다.
                _isActive가 false이면 활성화한다.
                영역 이벤트를 등록하고 _type을 'model'로 바꾼다.

    #addSingleEventListener() -> void
        의존:
            U3dApp — 단일 클릭 연결; 함수: {on()}
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
        동작: this를 묶은 단일 클릭을 등록하고 앱 이벤트 키를 보관한다.
    #addIntervalEventListener() -> void
        의존:
            U3dApp — 구간 이벤트 연결; 함수: {on()}
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
        동작: 구간 클릭·더블클릭을 this에 묶어 등록하고 키를 보관한다.
    #addAreaEventListener() -> void
        의존:
            U3dApp — 영역 이벤트 연결; 함수: {on()}
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
        동작: 영역 클릭·더블클릭을 this에 묶어 등록하고 키를 보관한다.

    #singleClick(e: U3dMouseEvent) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app, _scene}
            U3dApp — 배치 표면 조회; 함수: {closestPointAtPixel()}
            U3dMultipleComponentLayer — 모델 설정과 단일 생성; 함수: {addPosition()}; 속성 읽기: {_drawObject, _scale, _rotation}
            THREE — 배치 변환 기본값; 생성자: {new Vector3(), new Euler()}
            UEventDispatcher — 생성·클릭 통지; 함수: {dispatchEvent()}
            defined — 배치·기본값 판정; 함수: {defined()}
        동작:
            모델 위 배치 여부를 반전한 지형 전용 인자와 분석 장면으로 교차점을 구하고 위치나 레이어가 없으면 종료한다.
            모델의 다음 이름 번호를 얻는다.
            부가 옵션 위에 이름·위치 복사본·스타일을 덮으며 스타일은 부가 스타일보다 분석 스타일을 우선한다.
            scale·rotation이 없으면 레이어 기본값으로 각각 새 Vector3·Euler를 만들고 단일 컴포넌트를 생성한다.
            결과를 높이 보정한 뒤 결과가 있으면 create, 이어서 click 이벤트를 보낸다.

    #intervalClick(e: U3dMouseEvent) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            U3dApp — 표면 조회; 함수: {closestPointAtPixel()}
            ULineGeometry — 입력점 추가와 중심; 함수: {addPoint(), getCenterPosition()}
            UMesh — 가이드 표출; 생성자: {new UMesh()}
            UGroup — 가이드 연결·분리; 함수: {add(), remove()}
            UEventDispatcher — 클릭 통지; 함수: {dispatchEvent()}
            defined — 입력·선·메시 판정; 함수: {defined()}
        동작:
            교차점이 없으면 종료하며 높이에 0.1을 더한 뒤 선이 없으면 종료한다.
            선에 점을 넣고 인덱스를 늘린다.
            선 가시성이 true이면 기존 메시를 분리하고 같은 geometry와 현재 material로 메시를 새로 만들어 중심에 놓고 표출 그룹에 추가한다.
            _lineGeom이 있고 _lineIdx가 1 이하이면 시작 POI, 그 뒤에는 종료 POI를 놓는다.
            click을 통지한다.
    #intervalDblClick(e: U3dMouseEvent) -> void
        의존: UEventDispatcher — 종료 클릭 통지; 함수: {dispatchEvent()}
        동작: 구간 생성을 시작하고 dblclick을 통지한다.
    #areaDblClick(e: U3dMouseEvent) -> void
        의존: UEventDispatcher — 종료 클릭 통지; 함수: {dispatchEvent()}
        동작: 영역 생성을 시작하고 dblclick을 통지한다.

    #finishInterval() -> void
        의존: defined — 선·결과 존재 판정; 함수: {defined()}
        동작:
            _lineGeom이 있으면
                선이 없으면 종료하고 현재 간격으로 배치점을 얻는다.
                결과가 있으면 비동기 생성을 시작하고 선과 POI를 비운다.
    #finishArea() -> void
        의존:
            U3dShaderMeasureLayer — 도형 확정·제거; 함수: {commitFeature(), removeFeature()}; 속성 읽기: {_measureFeature}
            UMeasureFeature — 영역 자료; 함수: {getGeometry()}
            OLGeometry — 영역 범위; 함수: {getExtent()}
            defined — 측정 식별자 판정; 함수: {defined()}
        동작:
            분석과 측정 레이어의 도형 식별자가 모두 없거나 서로 다르면 종료한다.
            식별자를 비우고 POI를 정리한 뒤 측정 도형을 확정한다.
            도형이 없으면 종료하며 geometry나 길이 4 이상 extent가 없으면 도형을 제거하고 종료한다.
            현재 간격의 영역점을 구해 생성을 시작하고 측정 도형을 제거한다.

    #getPointsByInterval(lineGeom: ULineGeometry, interval: number) -> Array<UAnalyMultipleComponentPlacement>
        의존:
            UAnaly — 상속 실행 인자; 속성 읽기: {_app, _drawArg}
            U3dApp — callback의 모델 높이 조회; 함수: {closestPointAtVector3_()}
            UDrawArg — callback의 지형 높이 조회; 함수: {getRenderHeightAtPoint()}
        동작:
            현재 모델 위 배치 여부·방향과 앱 모델 높이·렌더 지형 높이를 읽는 callback을 전달한다.
    async #createAtPoints(points: Array<UAnalyMultipleComponentPlacement>) -> Promise<void>
        의존:
            U3dMultipleComponentLayer — 배치 생성; 함수: {addPosition()}; 속성 읽기: {_scale, _drawObject, _setInstanced}
            THREE — 기본 크기; 생성자: {new Vector3()}
            UEventDispatcher — 묶음 생성 통지; 함수: {dispatchEvent()}
            U3dMessage — 항목별 실패; 함수: {__GError__()}
            Web API — 전체 실패 대체 로그; 함수: {console.error()}
            defined — 레이어·성공 결과 판정; 함수: {defined()}
        동작:
            _layer가 있으면
                레이어가 없으면 종료하고 시작 번호를 얻는다.
                분석 스타일이 부가 스타일보다 우선하며 부가 옵션의 rotation은 각 배치점 rotation으로 덮어쓴다.
                점을 순회하여 이름·좌표·회전·스타일과 isUpdate를 정하며 인스턴스 모드는 마지막 항목만 isUpdate=true이다.
                각 addPosition 결과를 Promise로 받고 생성 후 높이를 보정하도록 연결한다.
                항목 실패는 0219705 로그와 undefined로 바꾸고 Promise.all 완료 뒤 defined 결과만 create 배열로 통지한다.
                addPosition의 동기 예외를 포함한 전체 실패는 전역 __GSError__가 truthy이면 그 함수로, 아니면 console.error로 전달한다.

    #repositionComponent(component: U3dComponentPosition) -> void
        동작:
    override setApp(app: U3dApp) -> void
        의존:
            UAnaly — 앱 연결; 함수: {setApp()}
            U3dApp — 측정 레이어; 함수: {getMeasureLayer()}
            ULineGeometry — 가이드 선; 생성자: {new ULineGeometry()}
            THREE — 가이드 재질; 생성자: {new LineBasicMaterial()}
            defined — 선 생성 판정; 함수: {defined()}
        동작:
            부모를 연결하고 앱의 측정 레이어를 얻는다.
            곡선률이 0이면 직선 타입, 그 밖에는 tension을 넘겨 새 선을 만들고 클래스 식별 이름을 붙인다.
            현재 선 색·불투명도·너비와 depthTest=false로 새 재질을 만든다. 이전 선·재질을 여기서 dispose하지 않는다.
    override active() -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            UAnaly — 활성 상태; 함수: {active()}
            U3dApp — 주석 장면; 함수: {getSceneComment()}
            UScene — 표출 그룹 등록; 함수: {add()}
        동작: 부모 활성화 후 표출 그룹을 앱 주석 장면에 추가한다.
    override deactive() -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_isActive, _app}
            UAnaly — 비활성화와 분석 이벤트 제거; 함수: {deactive()}
            U3dShaderMeasureLayer — 측정 도형 취소; 함수: {clearDrawFeature()}
            U3dApp — 주석 장면·화면 갱신; 함수: {getSceneComment(), setUpdateDate()}
            UScene — 표출 그룹 분리; 함수: {remove()}
            U3dMultipleComponentLayer — 도움 객체 해제; 함수: {setHelperPosition()}
            defined — 상태 판정; 함수: {defined()}
        동작:
            _isActive가 true이면
                비활성이면 종료하고 부모를 비활성화한 뒤 앱 리스너·기즈모를 제거한다.
                _areaFeature가 없을 때만 측정 도형을 비우고 식별자를 undefined로 정한다.
                표출 그룹을 장면에서 분리한다.
                _lineMesh가 있으면 선을 비운다.
                POI를 정리한다.
                레이어가 있으면 도움 객체를 해제하고 앱 갱신 시점을 바꾼다.

    setLayer(layer: U3dMultipleComponentLayer) -> void
        의존: U3dMultipleComponentLayer — instanceof 판정; 속성 읽기: {U3dMultipleComponentLayer}
        동작: 지정 클래스와 그 하위 인스턴스일 때만 _layerMap.component_layer와 _layer에 같은 참조를 저장한다.
    getLayer() -> U3dMultipleComponentLayer | undefined
        동작: _layer 참조를 반환한다.
    getSelected() -> ComponentObject | U3dRoad | undefined
        동작: _selected 원본 참조를 반환하며 인스턴스 컴포넌트도 선택될 수 있다.

    checkIsExistLight(name: string) -> boolean
        의존:
            U3dApp — 뷰 광원 목록; 속성 읽기: {_viewLightList}
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
        동작: 앱 목록의 id와 name이 엄격히 같은 항목이 있으면 true, 없으면 false를 반환한다.
    getLineMesh() -> Object3D | undefined
        의존: defined — 메시 존재 판정; 함수: {defined()}
        동작: _lineMesh가 있으면 같은 참조, 없으면 undefined를 반환한다.
    setLineMaterial(opt: UAnalyMultipleComponentLineStyle) -> void
        의존: THREE — 선 재질 생성; 생성자: {new LineBasicMaterial()}
        동작: 색·불투명도·너비를 저장하고 depthTest=false인 재질을 새로 만든다. 기존 선 메시의 material을 교체하거나 이전 재질을 dispose하지 않는다.

    lineMeshShow() -> void
        의존: defined — 메시 존재 판정; 함수: {defined()}
        동작: 선 메시가 있으면 visible=true로 바꾸고 이후 선 표출 설정도 true로 정한다.
    lineMeshHide() -> void
        의존: defined — 메시 존재 판정; 함수: {defined()}
        동작: 선 메시가 있으면 visible=false로 바꾸고 이후 선 표출 설정도 false로 정한다.

    async setComponentData(savedData: ComponentParam | Array<ComponentParam>) -> Promise<U3dComponentPosition | undefined>
        의존:
            U3dMultipleComponentLayer — 저장 자료 복원; 함수: {loadWork()}
            U3dMessage — 레이어 부재; 함수: {__GError__()}
            defined — 레이어 판정; 함수: {defined()}
        동작:
            레이어가 없으면 1512677 로그를 남기고 문자열로 reject한 완료 객체를 반환한다.
            loadWork의 결과 배열에서 첫 값으로 resolve하고 실패 시 오류의 _componentName이 있으면 그 값으로, 없으면 원래 실패값으로 reject한다.
            빈 배열 결과는 undefined로 완료한다.

    isLoadModel(name: string, baseurl?: string) -> Object3D | undefined
        의존:
            U3dMultipleComponentLayer — 캐시 조회; 함수: {checkIsExistModel(), getLoadedModel()}
            U3dMessage — 누락 안내; 함수: {__GInfo__()}
        동작:
            name이나 레이어가 falsy이면 각각 3513238·7214638 안내 후 종료한다.
            name·baseurl로 존재를 검사하고 없으면 undefined, 있으면 name만으로 로드 모델을 반환한다.
    readyModel(name: string, baseurl: string) -> void
        의존:
            U3dMultipleComponentLayer — 로드 모델 선택; 함수: {getLoadedModel()}; 속성 쓰기: {_drawObject}
            U3dMessage — 누락 안내; 함수: {__GInfo__()}
        동작:
            name·baseurl 또는 레이어가 falsy이면 안내 후 종료한다.
            baseurl은 검증에만 쓰고 name으로 모델을 찾아 없으면 안내하며 있으면 _drawObject로 저장한다.
    async loadModel(modelData: object) -> Promise<object | undefined>
        의존:
            표준 Promise — 캐시 완료 관찰; 함수: {Promise.resolve()}
            U3dMultipleComponentLayer — 모델 조회·로딩; 함수: {getModelInfo(), loadModel(), getLoadedModel()}; 속성 읽기: {_scene, _object}; 속성 쓰기: {_drawObject}
            UScene — 원본 분리; 함수: {remove()}
            U3dMessage — 조회 실패; 함수: {__GError__()}
            defined — 레이어 판정; 함수: {defined()}
        동작:
            _layer가 있으면
                레이어가 없으면 undefined로 완료하며 있으면 앱 리스너를 제거한다.
                modelData.name·baseurl로 캐시를 찾고 없으면 loadModel을 기다려 성공 시 원본 객체를 장면에서 분리하고 그 모델로 resolve하며 실패하면 reject한다.
                캐시가 준비되어 있으면 name으로 모델을 찾아 _drawObject에 저장해 반환하며 찾지 못하면 7316614 로그 후 undefined로 완료한다. 반환하지 않는 별도 거절 객체는 만들지 않는다.
                준비 중 캐시는 완료 후 같은 조회를 수행하며 찾지 못하면 1514735 로그 후 reject하고 캐시 실패도 reject한다.
                async 함수 자체로 결과와 예외를 전달하며 준비 중 캐시의 실패 사유를 보존한다.
    addComponent(modelData: object) -> Promise<object | undefined>
        의존: U3dMessage — 이전 API 안내; 함수: {__GInfo__()}
        동작: 7317515 안내 뒤 loadModel 결과를 반환한다.
    clearComponent() -> void
        의존:
            U3dMultipleComponentLayer — 전체 제거; 함수: {removeAllComponent()}; 속성 읽기: {_scene}; 속성 쓰기: {_objectList}
            UGroup — 장면 자식 종류 판정; 속성 읽기: {UGroup}
            defined — 레이어·선 판정; 함수: {defined()}
        동작:
            레이어가 있으면 장면 children에서 UGroup 자식을 배열 splice로 제거하고 _objectList를 비운 뒤 컴포넌트를 모두 제거한다.
            _lineMesh가 있으면 선을 비운다.
            POI를 정리한다.
    clearSelect() -> void
        의존: defined — 선택 판정; 함수: {defined()}
        동작: _selected가 있으면 색상을 복원하고 _selected를 undefined로 바꾼다.
    removeSelected(selected?: ComponentObject | U3dRoad) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            U3dComponentPosition — 컴포넌트 instanceof 판정; 속성 읽기: {U3dComponentPosition}
            U3dApp — 오버레이 제거; 함수: {removeOverlay()}
            U3dMultipleComponentLayer — 컴포넌트 제거; 함수: {removeComponent()}
            defined — 입력·선택·기즈모 판정; 함수: {defined()}
        동작:
            selected가 없으면 현재 선택을 쓰며 대상이 없으면 종료한다.
            컴포넌트와 그 하위 타입이면 overlay 목록을 앱에서 제거하고 레이어에서 컴포넌트를 제거한다.
            컴포넌트가 아닌 대상이면 name으로 도로를 제거한다.
            _controlObj가 있으면 기즈모를 제거한다.
    saveComponent() -> object | undefined
        의존:
            U3dMultipleComponentLayer — 배치 저장; 함수: {saveWork()}
            defined — 레이어 판정; 함수: {defined()}
        동작: 레이어가 없으면 undefined, 있으면 saveWork 결과를 그대로 반환한다.
    setMapTime(time: Date | string | number, intensity?: number) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            U3dApp — 태양 시간; 함수: {setTimeSun()}
            U3dMessage — 제거된 밝기 옵션 안내; 함수: {__GInfo__()}
        동작: intensity가 truthy이면 안내하고 앱이 있으면 time을 변환하지 않고 setTimeSun에 전달한다.
    getMapTime() -> object | undefined
        의존:
            U3dApp — 태양 시간 조회; 함수: {getTimeSun()}
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
        동작: 앱이 있으면 태양 시간을 반환하고 앱이 없으면 undefined를 반환한다.

    override getScene() -> UScene
        의존: UAnaly — 상속받은 실행 상태; 속성 읽기: {_scene}
        동작: _scene 원본 참조를 반환한다.

    edit(mode?: string) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_scene, _app}
            U3dComponentPosition — 컴포넌트 종류·변환; 속성 읽기: {U3dComponentPosition, instancedInfo, _setInstanced, instanceId, _object, _bbox, position, scale, rotation}
            U3dRoad — 도로 중심; 함수: {getRoadCenter()}
            THREE — 숨김 제어 객체; 생성자: {new SphereGeometry(), new MeshToonMaterial(), new Mesh()}
            UGizmoControls — 편집 대상·모드; 함수: {setMode(), attach()}
            UScene — 제어 객체 연결; 함수: {add(), remove()}
            U3dApp — 주석 장면; 함수: {getSceneComment()}
            defined — 대상·기즈모·변환 판정; 함수: {defined()}
        동작:
            _selected가 있으면
                선택이 없으면 종료하고 mode가 'none'이면 기즈모를 제거하여 종료한다.
                활성화한다.
                _control이 없으면 생성한다.
                mode를 저장·적용한다.
                기존 제어 객체를 분리하고 color 또는 하이라이트 색의 새 구체 메시를 만든다.
                인스턴스 컴포넌트는 instancedInfo의 변환 복사본을 쓰며 이름·ID가 없으면 중단한다.
                일반 컴포넌트는 위치를 쓰되 rotate 모드이고 자식이 하나이면 위치를 복사하여 경계 중심 z를 더한다.
                일반 컴포넌트의 실제 Vector3 크기와 Euler 회전만 복사하고 도로는 getRoadCenter를 위치로 쓴다.
                제어 객체를 숨겨 변환을 적용하고 분석 장면에 넣어 컨트롤에 attach한 뒤 컨트롤을 주석 장면에 넣는다.
    resetGizmo() -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            U3dComponentPosition — 초기 변환과 행렬·자식 복원; 함수: {setPosition(), setScale(), setRotation(), updateMatrix(), updateChildrenMatrix()}; 속성 읽기: {_initObject, _initPosition, instancedInfo, position, rotation, scale, _object, overlay, poi}
            THREE — 대체 기본 변환; 생성자: {new Vector3(), new Euler()}; 함수: {updateMatrixWorld()}
            U3dView — 카메라 오버레이 이동; 함수: {moveViewPosition()}
            U3dPOI — 라벨 이동; 함수: {setPosition()}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
            defined — 초기값·라벨 판정; 함수: {defined()}
        동작:
            선택이 없으면 종료한다.
            인스턴스는 _initObject가 있을 때 instancedInfo·컴포넌트·모델 객체·기즈모의 변환을 복원하고 행렬을 갱신한다.
            일반 대상은 _initObject가 있으면 그 변환을 쓰고 없으면 초기 위치 또는 현재 위치와 회전 0·크기 1을 쓴다.
            일반 대상의 기즈모·컴포넌트 변환과 모델 첫 자식 회전을 복원한다.
            첫 overlay에 camera가 있으면 카메라 위치를 제어 객체 위치 + _shift로 바꾸고 overlay를 this로 moveViewPosition을 호출한다.
            poi가 있으면 초기 위치 또는 현재 위치에 zOffset을 더해 이동하고 앱 갱신을 요청한다.
    setScale(scale: Vector3 | number) -> void
        의존:
            U3dMultipleComponentLayer — 배치 기본 크기; 함수: {setScale()}
            defined — 레이어 판정; 함수: {defined()}
        동작: 레이어가 있을 때만 크기를 전달한다.
    setRotation(degree: number, axis: Vector3) -> void
        의존:
            U3dMultipleComponentLayer — 기본 회전; 함수: {setRotation()}
            defined — 레이어 판정; 함수: {defined()}
        동작: 레이어가 있을 때만 각도와 축을 전달한다.
    setSelectedRotation(degreeX: number, degreeY: number, degreeZ: number) -> void
        의존:
            U3dComponentPosition — 선택 회전; 함수: {setRotation()}
            defined — 선택 판정; 함수: {defined()}
        동작: 선택이 있으면 각 축의 degree를 radian으로 변환한 객체를 setRotation에 전달한다.
    setCurrentLight(light: any) -> boolean
        동작: 입력을 사용하지 않고 false를 반환한다.
    getCurrentLight() -> boolean
        동작: false를 반환한다.
    setIntervalDirection(direction: string) -> void
        동작: front·back·left·right 중 하나가 아니면 Error를 던지고 유효하면 방향을 저장한다.
    lightAnalysis(options: any) -> void
        동작: 인수를 사용하지 않고 아무 작업 없이 종료한다.
    cameraAnalysis(options: ViewAnalyOption) -> Promise<boolean> | undefined
        의존:
            deferredPromise — 호출 완료; 함수: {deferredPromise()}
            U3dComponentPosition — 오버레이 조회; 함수: {getOverlays()}; 속성 읽기: {overlay}
            U3dView — 카메라 분석; 함수: {viewAnalysis()}
            defined — options.componenet 선택; 함수: {defined()}
        동작:
            options.componenet이 없으면 현재 선택을 쓰고 있으면 그 값을 쓴다.
            overlay 길이가 0이면 undefined로 종료하고 첫 getOverlays 결과를 카메라 뷰로 사용한다.
            뷰 자체를 this로 viewAnalysis를 호출하며 동기 성공이면 true, 동기 예외이면 false로 resolve한다. 반환된 분석 완료를 기다리지는 않는다.
    endLightAnaly(component: ComponentObject) -> void
        동작: 인수를 사용하지 않고 아무 작업 없이 종료한다.

    addRoad() -> void
        의존:
            UScene — 도로 그룹 연결; 함수: {add()}
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_isActive, _scene}
        동작:
            리스너를 제거하고 작업을 끝낸다.
            _isActive가 false이면 활성화한다.
            도로 그룹을 분석 장면에 넣고 도로 이벤트를 연결하며 도로 모드로 바꾼다.
    setRoadImage(url: string) -> void
        동작: 이후 도로 생성에 사용할 _roadImageUrl을 저장한다.
    setRoadWidth(width: number) -> void
        동작: 전역 isNaN 판정이 true이면 무시하고 아니면 변환하지 않은 width를 저장한다.
    setRoadHeight(height: number) -> void
        동작: 전역 isNaN 판정이 true이면 무시하고 아니면 변환하지 않은 height를 저장한다.
    setRoad(options: U3dRoadOption | Array<U3dRoadOption>) -> Promise<U3dRoad> | undefined
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app, _scene}
            deferredPromise — 단일 도로 완료; 함수: {deferredPromise()}
            defaultValue — 크기·이미지 기본값; 함수: {defaultValue()}
            U3dRoad — 도로 생성과 라벨·좌표; 생성자: {new U3dRoad()}; 함수: {setLabel(), hideLabel(), setCoordinates()}; 속성 읽기: {mesh}
            UGroup — 도로 메시 연결; 함수: {add()}
            UScene — 도로 그룹 연결; 함수: {add()}
            defined — 입력·메시 판정; 함수: {defined()}
        동작:
            options가 있으면
                options가 배열이면 각 항목의 setRoad를 호출하되 완료를 모으지 않고 undefined를 반환한다.
                단일 입력에 positions가 없으면 종료하며 너비·높이·이미지는 도로 기본값을 적용한다.
                앱과 현재 분석 dispatcher를 연결한 도로를 생성하고 mesh가 있으면 visible을 적용한다.
                labelcenter로 라벨을 놓고 labelVisible이 falsy이면 숨긴 뒤 좌표를 적용하여 목록과 그룹·장면에 추가한다.
                성공 시 도로로 resolve하며 설정 예외는 메시지를 포함한 문자열로 reject한 완료 객체를 반환한다. 생성자 예외는 try 밖에서 발생한다.
    getRoads() -> Array<U3dRoad>
        동작: _roads 배열 원본 참조를 반환한다.
    clearRoad() -> void
        의존:
            U3dRoad — 라벨 제거; 함수: {removeLabel()}
            UDEF — 도로 자원 해제; 함수: {disposeObject3D()}
            UGroup — 그룹 비우기; 함수: {clear()}; 속성 읽기: {children}
            defined — 목록 판정; 함수: {defined()}
        동작:
            리스너·기즈모를 제거하고 작업을 끝낸다.
            도로 목록이 있으면 라벨을 제거하고 현재 그룹 children을 직접 순회하여 해제한 뒤 그룹·목록·현재 도로를 비운다.
            POI를 정리한다.
    saveRoad() -> Array<U3dRoadSaveData>
        의존:
            U3dRoad — 도로 저장; 함수: {getParam()}
            defined — 결과 판정; 함수: {defined()}
        동작: 각 도로 getParam의 defined 결과만 순서대로 새 배열에 담아 반환한다.
    showLabel() -> void
        의존:
            U3dRoad — 도로 라벨; 함수: {showLabel()}
            U3dMultipleComponentLayer — 컴포넌트 라벨; 함수: {showLabel()}
            defined — 레이어 판정; 함수: {defined()}
        동작: 도로 라벨을 각각 보이고 레이어가 있으면 컴포넌트 라벨도 보인다.
    setIntervalTension(tension: number) -> void
        의존:
            ULineGeometry — 다음 선 계산 설정; 속성 읽기: {spline}
            THREE — spline 곡선 설정; 속성 쓰기: {curveType, tension}
            defined — 선 판정; 함수: {defined()}
        동작: 곡선률을 저장하며 선이 있으면 0일 때 spline.curveType을 catmullrom으로 정하고 tension을 바꾼다. geometry 재계산은 호출하지 않는다.
    hideLabel() -> void
        의존:
            U3dRoad — 도로 라벨; 함수: {hideLabel()}
            U3dMultipleComponentLayer — 컴포넌트 라벨; 함수: {hideLabel()}
            defined — 레이어 판정; 함수: {defined()}
        동작: 도로 라벨을 각각 숨기고 레이어가 있으면 컴포넌트 라벨도 숨긴다.

    clearLine() -> void
        의존:
            ULineGeometry — 선 초기화; 함수: {clear()}
            defined — 선 판정; 함수: {defined()}
        동작: 선이 있으면 clear하고 선 인덱스를 0으로 정한다. 선 메시 참조는 비우지 않는다.
    startPoi(position: Vector3) -> void
        의존:
            U3dBilboard — 시작 표식; 정적 함수: {makeBilboard()}
            UGroup — 표식 연결; 함수: {add()}
            defined — 표식 판정; 함수: {defined()}
        동작: 위치와 'Start' 텍스트로 새 표식을 만들고 있으면 startPoi 이름으로 표출 그룹에 추가한다.
    endPoi(position: Vector3) -> void
        의존:
            UDEF — 이전 표식 해제; 함수: {disposeObject3D()}
            U3dBilboard — 종료 표식; 정적 함수: {makeBilboard()}
            UGroup — 표식 연결·분리; 함수: {add(), remove()}
            U3dRoad — 길이 라벨; 속성 읽기: {length}
            defined — 표식·도로 판정; 함수: {defined()}
        동작:
            종료 표식이 있으면 해제·분리하고 참조를 비운다.
            현재 도로가 있으면 길이가 1000보다 클 때만 km 소수 첫째 자리, 그 밖에는 m 반올림 텍스트를 쓰며 도로가 없으면 'end'를 쓴다.
            새 종료 표식이 있으면 endPoi 이름으로 표출 그룹에 추가한다.
    removeListeners() -> void
        의존:
            U3dApp — 앱 이벤트 해제; 함수: {unkey()}
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
        동작: 보관한 type·id로 각 이벤트를 해제한 뒤 키 배열을 새 빈 배열로 바꾼다.
    areaClick(e: U3dMouseEvent) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            U3dApp — 표면·지리좌표; 함수: {closestPointAtPixel(), vector3ToGeoGraphic()}
            THREE — 지리좌표 대체값; 생성자: {new Vector3()}
            U3dShaderMeasureLayer — 측정점 추가; 함수: {addMeasurePoint()}; 속성 읽기: {_measurePoints}
            UEventDispatcher — 클릭 통지; 함수: {dispatchEvent()}
            defined — 교차점 판정; 함수: {defined()}
        동작:
            교차점을 지리좌표로 변환하고 nullish 결과를 새 Vector3로 대체하여 측정점에 추가한 뒤 도형 ID를 저장한다.
            그 뒤 position이 없으면 종료하며 있으면 z에 0.1을 더한다.
            측정점 수가 정확히 1이면 시작 POI, 그 밖에는 종료 POI를 만들고 click을 통지한다.
    finishSingle() -> void
        의존:
            U3dMultipleComponentLayer — 도움 객체 해제; 함수: {setHelperPosition()}
            defined — 레이어 판정; 함수: {defined()}
        동작: 레이어가 있으면 도움 객체 위치를 undefined로 정한다.
    getPointsByArea(geom: UAnalyMultipleComponentAreaGeometry, interval: number = 10) -> Array<UAnalyMultipleComponentPlacement>
        의존: UAnaly — 높이 조회 객체 전달; 속성 읽기: {_drawArg}
        동작:
    finishRoad() -> void
        의존:
            U3dRoad — 도로 마무리; 함수: {update()}; 속성 읽기: {_startPoi, _endPoi}; 속성 쓰기: {_startPoi, _endPoi}
            UDEF — 도로 표식 해제; 함수: {disposeObject3D()}
            defined — 현재 도로 판정; 함수: {defined()}
        동작:
            _road가 있으면
                현재 도로가 있으면 update(undefined,true)를 호출하고 시작·종료 표식을 해제해 참조를 비운 뒤 현재 도로를 비우고 POI를 정리한다.
    clearPOI() -> void
        의존:
            UDEF — 표식 해제; 함수: {disposeObject3D()}
            UGroup — 표출 그룹 비우기; 함수: {clear()}
        동작: 분석의 시작·종료 표식이 truthy이면 각각 해제하고 참조를 비운 뒤 표출 그룹의 모든 자식을 분리한다.
    selectObject(e: U3dMouseEvent) -> void
        의존:
            U3dComponentPosition — 선택 종류 판정; 속성 읽기: {U3dComponentPosition}
            UEventDispatcher — 선택 통지; 함수: {dispatchEvent()}
            defined — 선택·기즈모 판정; 함수: {defined()}
        동작:
            기즈모 mouseUp 직후이면 억제 플래그만 false로 바꾸고 종료한다.
            _selected가 있으면 색상을 복원하고 _selected를 undefined로 바꾼다.
            교차 대상을 찾는다.
            대상이 있으면 하이라이트하고 선택을 저장한 뒤 컴포넌트와 하위 타입은 model, 그 밖에는 road인 select 이벤트를 보낸다.
            대상이 없으면 기즈모를 제거한다.
            _control이 있으면 현재 모드로 편집을 다시 연결한다.
    getSelectObject(e: U3dMouseEvent) -> ComponentObject | U3dRoad | undefined
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            URaycaster — 비가시 메시 교차; 함수: {setFromCamera(), intersectObject()}
            U3dApp — 카메라; 속성 읽기: {_camera}
            U3dMultipleComponentLayer — 컴포넌트 선택; 함수: {getIntersect()}
            defined — 교차 판정; 함수: {defined()}
        동작:
            모듈 공용 INVISIBLE_RAY는 usevisible=false로 만들어지며 e의 normalizedX·normalizedY와 앱 카메라로 방향을 설정한다.
            road 선택이면 도로 그룹의 첫 교차 object와 mesh.uuid가 같은 도로를 찾아 마지막 일치 도로를 반환한다.
            그 밖에는 레이어 getIntersect(e,INVISIBLE_RAY)의 결과를 반환한다.
    highLightColor(selected: U3dComponentPosition | U3dRoad, off: boolean) -> void
        의존:
            U3dComponentPosition — 컴포넌트 종류와 재질; 속성 읽기: {U3dComponentPosition}; 함수: {restoreMaterial(), pickMaterial()}
            THREE — 도로 재질 반영; 속성 읽기: {uniforms}; 속성 쓰기: {needsUpdate}
        동작:
            대상이 falsy이면 종료한다.
            컴포넌트와 하위 타입은 off이면 restoreMaterial, 아니면 하이라이트 색·불투명도 0.6으로 pickMaterial을 호출한다.
            도로는 material.uniforms.color가 있으면 off일 때 흰색, 아니면 하이라이트 색으로 바꾸고 needsUpdate=true로 정한다.
    createGizmo() -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            UGizmoControls — 편집 컨트롤; 생성자: {new UGizmoControls()}; 함수: {addEventListener()}
            U3dApp — 입력 카메라·DOM; 속성 읽기: {_camera, _renderer}
        동작:
            앱 카메라·렌더러 DOM·앱으로 컨트롤을 새로 만든다.
            objectChange를 변환 반영 함수에 묶고 mouseUp은 _isGizmoMouseUp=true로 만드는 callback으로 연결한다.
    removeGizmo() -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app, _scene}
            U3dApp — 이벤트 해제; 함수: {unkey()}
            UGizmoControls — 컨트롤 해제; 함수: {detach(), dispose()}
            UScene — 제어 객체 분리; 함수: {remove()}
            defined — 컨트롤 판정; 함수: {defined()}
        동작: 컨트롤이 있으면 change 키를 해제하고 detach·dispose한 뒤 컨트롤을 비우고 제어 객체를 장면에서 분리하여 참조를 비운다.
    #gizmoChange() -> void
        의존:
            UGizmoControls — 편집 모드; 함수: {getMode()}
            U3dComponentPosition — 후속 행렬; 함수: {updateMatrix(), updateChildrenMatrix()}; 속성 읽기: {_object}
            THREE — 모델 행렬; 함수: {updateMatrixWorld()}
            defined — 제어 객체·선택 판정; 함수: {defined()}
        동작:
            _controlObj가 없으면 종료하고 컨트롤 모드를 구한 뒤 선택이 없으면 종료한다.
            _controlObj와 _selected가 있으면:
                결과가 false이면 종료하고 true이면 모델의 월드 행렬·컴포넌트 행렬·자식 행렬을 선택적으로 갱신한다.

    #addRoadEventListener() -> void
        의존:
            U3dApp — 도로 이벤트; 함수: {on()}
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
        동작: 도로 클릭·더블클릭을 this에 묶어 연결하고 키를 보관한다.
    #roadClick(e: U3dMouseEvent) -> void
        의존:
            UAnaly — 상속받은 실행 상태; 속성 읽기: {_app}
            U3dRoad — 도로 작성; 생성자: {new U3dRoad()}; 함수: {checkDistance(), addPoint()}; 속성 읽기: {mesh, _startPoi, _endPoi, coordinates}
            U3dApp — 교차점·좌표 변환; 함수: {closestPointAtPixel(), vector3ToGeoGraphic()}
            UGroup — 메시·표식 연결; 함수: {add()}
            THREE — 좌표 대체값; 생성자: {new Vector3()}
            UEventDispatcher — 오류·클릭 통지; 함수: {dispatchEvent()}
            defined — 도로·메시·표식 판정; 함수: {defined()}
        동작:
            현재 도로가 없으면 road_목록길이 이름과 현재 크기·이미지·레이어·앱·분석 dispatcher로 만들고 목록·그룹에 추가한다.
            지형 교차점을 조회하고 도로 자체를 this로 거리 상태를 검사한다.
            CLOSE·FAR·MAXIMUM_SIZE이면 각 error 이벤트를 보내고 종료한다.
            나머지는 z에 0.1을 더하여 점을 추가하고 성공하면 도로 시작·종료 표식을 표출 그룹에 추가한다.
            addPoint 결과와 무관하게 지리좌표 변환 또는 새 Vector3를 coordinates에 추가하고 click을 보낸다.
    #roadDblClick(e: U3dMouseEvent) -> void
        의존:
            UEventDispatcher — 종료 클릭 통지; 함수: {dispatchEvent()}
            U3dRoad — 완료 라벨; 함수: {setLabel(), hideLabel()}
        동작: 도로를 마무리하고 dblclick을 보낸 뒤 목록 마지막 도로에 road_인덱스 라벨을 설정하고 숨긴다.
    removeRoad(name: string) -> void
        의존:
            U3dRoad — 라벨 제거; 함수: {removeLabel()}
            UDEF — 메시 자원 해제; 함수: {disposeObject3D()}
            UGroup — 메시 분리; 함수: {remove()}
        동작: 이름이 같은 첫 도로의 라벨과 메시를 해제·분리하고 목록에서 한 항목을 제거한 뒤 종료한다.
    #createIndex(layer: U3dMultipleComponentLayer) -> number
        동작:
INVISIBLE_RAY: URaycaster
    의존: URaycaster — 선택용 공용 광선; 생성자: {new URaycaster()}
    usevisible=false로 모듈 초기화 때 생성하며 선택 조회마다 카메라 방향을 다시 설정한다.

UAnalyMultipleComponentCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string = 'multipleComponent'
        scale?: Vector3Like = {x:1,y:1,z:1}
        rotation?: Vector3Like = {x:0,y:0,z:0}
        lineVisible?: boolean = true
            대화식 구간 가이드 표출 여부이다.

UAnalyMultipleComponentPlacement 부분 타입 명세
    이 명세에서 사용하는 필드:
        position: Vector3
            배치할 월드 좌표이며 생성 후 높이 보정에서 원본이 바뀔 수 있다.
        rotation: Euler | undefined
            구간 접선에서 계산한 회전 또는 영역 배치의 undefined이다.

UAnalyMultipleComponentAdditionalOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        style?: Record<string, unknown>
            분석 스타일을 나중에 덮어 합성한다.
        scale?: Vector3Like
            지정하면 원본 참조가 생성 옵션에 전달된다.
        rotation?: Euler | Vector3Like
            단일 배치에는 보존하고 구간·영역 배치에는 각 배치점 회전을 사용한다.

UAnalyMultipleComponentIntervalOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        points?: Array<GeoPosition>
            비어 있지 않으면 이벤트 작성 대신 직접 배치한다.
        lineTension?: number
            undefined이면 현재 곡선률을 쓰며 직접 입력 경로는 0일 때 직선 타입을 사용한다.

UAnalyMultipleComponentAreaOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        points?: Array<GeoPosition>
            비어 있지 않으면 x·y로 영역을 만들어 직접 배치한다.

UAnalyMultipleComponentStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        renderOrder: number
            숫자로 변환 가능한 입력이면 변환 전 값을 저장하는 런타임 판정을 사용한다.
        depthTest, depthWrite: boolean
            각각 boolean일 때만 기존 값을 바꾼다.

UAnalyMultipleComponentLineStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        color: string
        opacity, width: number
            다음 가이드 메시가 사용하는 새 재질의 색·불투명도·너비이다.

UAnalyMultipleComponentAreaGeometry 부분 타입 명세
    이 명세에서 사용하는 필드:
        getExtent: function(): UAnalyMultipleComponentAreaExtent
            현재 영역의 월드 좌표 경계를 반환한다.
        intersectsExtent: function(Array<number>): boolean
            점으로 축소한 extent와 영역의 교차 여부를 반환한다.

UAnalyMultipleComponentAreaExtent 부분 타입 명세
    배열이면 minX·minY·maxX·maxY 순서를 사용하고 객체이면 min·max의 x·y를 사용하며 undefined는 경계 부재이다.

UAnalyMultipleComponentSamplingContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        isCreateOnModel: function(): boolean
            모델 높이 조회 전과 지형 대체 판정에서 각각 현재 상태를 다시 읽는다.
        getDirection: function(): string
            방향별 분기에서 현재 방향을 다시 읽는다.
        getModelHeight: function(Vector3): UAnalyMultipleComponentModelHeight
            높이 조회 시작점으로 모델 표면 z를 얻는다.
        getTerrainHeight: function(number, number): number
            월드 좌표 x·y의 렌더 지형 높이를 얻는다.

UAnalyMultipleComponentModelHeight 부분 타입 명세
    모델 교차점의 z 또는 교차 결과가 없을 때의 undefined이다.

U3dRoadOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        positions: Array<GeoPosition>
            도로의 지리좌표 목록이다.
        name?: string
        width, height?: number
        imageUrl?: string
        visible, labelVisible?: boolean
        labelcenter?: WorldPosition
            도로 라벨의 월드 위치이다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
