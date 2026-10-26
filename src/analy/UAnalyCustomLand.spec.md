# UAnalyCustomLand 명세

> 상태: 구현 관찰 초안

## 1. 개요

`UAnalyCustomLand`는 지도에서 그리거나 직접 전달한 외곽선과 목표 높이로 편집 지형을 생성·수정·조회·제거하는 분석 진입점이다. 입력을 편집 박스와 선택적 경사 영역으로 바꾼 뒤, 전체 영역을 포함하는 가시 고도 레이어를 선택하여 `CustomLand`를 생성한다. 생성한 객체는 앱의 편집 목록과 공간 인덱스에 등록하고 해당 영역의 지형 갱신을 요청한다.

일반 소스는 공개 API, 입력·오류 처리와 수명주기 순서를 담당한다. 비공개 소스는 외곽선·경사·경계 박스와 데이터 레이어 선택을 계산한다. UMF 요청·파싱은 `U3dHeightXYZLayer`, 실제 체적 계산은 `CustomLand`의 책임이며 이 분석은 `getVolume()`으로 진입만 연결한다.

`U3dApp.activeAnalysis('CustomLand')` 또는 `getAnalysis('CustomLand')`로 접근한다. `tutorial-official/customLand.html`은 외곽선·높이·경사 설정을 전달해 생성하고 결과를 조회·수정·제거하는 대표 사용처다.

## 3. 정규 자연어 수도코드

```spec
UAnalyCustomLandCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            undefined이면 'CustomLand'이며 앱 편집 목록을 구분하는 키로도 사용한다.
        maxarea?: number
            undefined이면 1000000이다. 선언은 km² 너비로 설명하지만 실제 면적 판정은 _maxArea의 제곱을 사용한다. [확인 Q-005]
        height?: number
            undefined이면 0을 _height에 저장한다. 개별 생성 옵션의 height를 대신 채우지는 않는다.
        style?: CustomLandStyleCO
            draw 생성에 전달할 스타일 원본
        drawStyle?: any
            draw 생성·설정에 전달할 원본

UAnalyCustomLandCO extends UAnalyCO 부분 타입 명세
    UAnalyCustomLandCO_Content를 합성한다. 부모 생성자에는 opt를 전달하지 않는다.

CustomLandStyleCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        fill?: string
            선언 기본값은 'rgba(255,0,0,0.2)'이다.
        stroke?: string
            선언 기본값은 'rgba(255,0,0,0.5)'이다.
        width?: number
            선언 기본값은 1이다.
        radius?: number
            선언 기본값은 3이다. 이 분석의 setStyle은 위 기본값을 직접 주입하지 않는다.

DataOPT_Input 부분 타입 명세
    이 명세에서 사용하는 필드:
        id?: string
            null·undefined이면 GUID를 문자열로 생성한다. 수정 시 기존 ID를 자동 재사용하지 않는다.
        geoVertex: Array<GeoPosition>
            외곽선 위경도 입력. 계산 성공 시 새 Vector3 배열로 교체된다.
        height: number
            목표 지형 높이. 0도 유효하며 입력 전체를 Number로 정규화하지 않는다.
        inclineEdit?: boolean
            truthy이면 경사 계산 경로를 사용한다.
        insideIncline?: boolean
            inclineEdit도 truthy일 때 내부 경사 생성 경로를 사용한다.
        inclineRate?: number
            사용 시 truthy이면 Number 변환하고 falsy이면 1로 대체한다. 변환 결과를 다시 검증하지 않는다.
        insidePrecision?: number
            내부 경사 보간에서 falsy이면 10으로 대체한다. 정수·양수 검증은 하지 않는다.
        dataLevel?: number
            truthy이면 보존하고 falsy이면 선택 레이어의 _maxlevel로 대체한다.

DataOPT 부분 타입 명세
    이 명세에서 사용하는 필드:
        id?: string
        geoVertex?: Array<GeoPosition>
        height?, inclineRate?, insidePrecision?, dataLevel?: number
        inclineEdit?, insideIncline?: boolean
            위 입력 필드의 의미는 DataOPT_Input과 같다. 입력과 중간 결과를 같은 옵션 객체에 기록하며 단계별로 미설정일 수 있다.
        insideError?: boolean
            내부 경사 생성 실패 표시. 새 계산 시작 시 자동 초기화하지 않는다.
        drawarg?: UDrawArg
            계산에 사용한 좌표·높이 조회 인자
        center?: WorldPositionVector3
            외곽선 extent 중심의 월드 좌표이며 Z는 렌더 높이 또는 대체값 0이다.
        box?, inclineBox?: UBox3
            기본 편집 영역과 경사 영역의 경계 박스
        geos?: Double_Array<number>
            폐합 지리 좌표. 마지막 항목이 첫 항목과 같은 배열 참조일 수 있다.
        vertex?, inclineVertex?: Array<WorldPositionVector3>
            기본·경사 월드 외곽선
        oriVertex?, textureGeoVertex?, inclineGeoVertex?, drawGeoVertex?: Array<GeoPositionVector3>
            최초 변환 외곽선과 용도별 지리 외곽선. oriVertex는 입력 배열 자체가 아니라 최초 변환 배열이다.
        inclineBevelThickness?, inclineBevelSize?: number
            경사 계산에 사용하는 두께와 버퍼 크기
        url?: string
            선택 레이어의 _baseUrl
        unitHeight?, heightScale?, heightOffset?: number
            선택 레이어에서 전달한 표본 크기와 고도 복원 기본값
        dataLayer?: U3dHeightXYZLayer
            원본 고도 조회를 위임할 실제 레이어 객체

UAnalyCustomLand extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반; 상속: {UAnaly}

    name: string = 'CustomLand'
        외부 쓰기가 가능한 분석 이름. 등록·제거 시 현재 값을 앱 편집 목록의 키로 사용한다.
    _classtype: string = 'UAnalyCustomLand'
        부모가 제공한 진단 필드를 이 단위의 이름으로 초기화한다.
    #event: object
        clickId와 dblClickId는 undefined로 시작하는 이벤트 등록 ID다.
    _maxArea: number = 1000000
        면적 제한 비교에 제곱하여 사용하는 설정값
    _height: number = 0
        생성 옵션 높이의 보관값이며 현재 단위의 계산 경로에서는 읽지 않는다.
    _endPoint: boolean = false
        더블클릭 완료 시 true, 입력 상태 정리 시 false가 된다.
    _pickList: Array<{x: number, y: number}> = 빈 배열
        현재 외곽선 입력이며 조회 API는 원본 참조를 반환한다.
    _customLandList: Array<CustomLand> = 빈 배열
        생성·복원한 편집 지형 목록
    _selectType: string = 'Polygon'
        지도 입력 방식을 선택한다.
    _poiGroup: UGroup
        입력점과 면적 안내 객체를 연결하는 그룹
    _drawAreaPoi: Object3D | undefined
        마지막 면적 안내 객체
    _areaPoi, _guidPoi: Array<Object3D> = 빈 배열
        면적 안내와 입력점 안내 객체를 각각 보관한다.
    _features: Array<OLFeature> = 빈 배열
        확정한 측정 피처 목록
    _topFeature: Record<string, OLFeature | undefined> = 빈 객체
        ID별 편집 계산 피처
    _style: OLStyle | CustomLandStyleCO | undefined
        스타일 원본
    _drawStyle: OLStyle | undefined
        그리기 스타일 원본
    _draw: UDraw | undefined
        필요할 때 생성하고 정리 시 해제하는 도형 생성기
    _iclineEdit: Object3D | undefined
        setInclineEdit로 저장하는 모델 참조. 생성 옵션의 inclineEdit를 대신하지 않는다.

    constructor(opt?: UAnalyCustomLandCO)
        의존:
            UAnaly — 기본 초기화; 생성자: {new UAnaly()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UGroup — 안내 그룹 생성; 생성자: {new UGroup()}
        동작:
            옵션 없이 부모를 초기화하고 opt가 falsy이면 빈 객체를 사용한다.
            _classtype을 'UAnalyCustomLand'로 지정하고 name·maxarea·height에 undefined 기본값을 적용한다.
            입력·객체·피처·안내 목록을 비우고 Polygon 선택으로 시작한다.
            안내 그룹을 새로 만들고 style·drawStyle은 입력 참조를 보관한다. draw와 마지막 안내는 undefined로 둔다.

    override setApp(app: U3dApp) -> void
        의존: UAnaly — 현재 객체에 부모의 앱 연결 적용; 함수: {prototype.setApp.call()}
        동작: 현재 객체를 수신자로 하여 부모 setApp에 app을 전달한다.

    override active() -> void
        의존:
            UAnaly — 활성화와 앱 참조; 함수: {prototype.active.call()}; 속성 읽기: {_app}
            U3dApp — 안내 장면; 속성 읽기: {_sceneComment}
            THREE.Object3D(_sceneComment) — 안내 그룹 연결; 함수: {add()}
        동작:
            부모 활성화 뒤 입력 이벤트를 등록한다.
            앱이 falsy이면 종료하고, 아니면 안내 그룹을 앱의 주석 장면에 추가한다.

    override deactive() -> void
        의존: UAnaly — 활성 상태와 비활성화; 속성 읽기: {_isActive}; 함수: {prototype.deactive.call()}
        동작:
            _isActive가 falsy이면 종료한다.
            _isActive가 truthy이면 부모 비활성화 후 입력을 중단한다.

    override addDefaultEvent() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 모드와 이벤트; 속성 쓰기: {_mode}; 함수: {setPolygonMeasureType(), on()}; 상수: {EVENT.CLICK, EVENT.DBLCLICK}
            UDEF — 분석 모드; 상수: {APP_MODE._AVERAGEHEIGHT}
        동작:
            두 등록 ID 중 하나라도 undefined가 아니면 기존 입력을 중단한다.
            _app이 truthy일 때만 다음 등록 단계를 진행하며, falsy이면 종료한다.
                앱 모드를 _AVERAGEHEIGHT로 정하고 다각형 측정 모드를 설정한다.
                앱 생성자의 CLICK·DBLCLICK 이벤트에 현재 분석 객체를 this로 묶은 callback을 등록하고 반환 ID를 보관한다.

    stopDraw() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 이벤트 해제; 함수: {unkey()}; 상수: {EVENT.CLICK, EVENT.DBLCLICK}
            defined — 등록 ID 존재 판정; 함수: {defined()}
        동작:
            _app이 truthy일 때 다음을 수행하며, falsy이면 ID·입력 상태를 유지한 채 종료한다.
                null·undefined가 아닌 각 ID에 대해 이벤트 종류와 ID로 해제하고 해당 ID를 undefined로 바꾼다.
                이후 입력 상태를 정리한다.

    setCustomLandToApp(customLand: CustomLand) -> void
        의존:
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            U3dApp — 분석별 편집 Set과 인덱스; 속성 읽기: {_editHeightBoxList}; 함수: {getIndexManager()}
            CustomLand — 사용할 경계 선택; 함수: {getInclineEdit(), getInclineBox(), getBox()}
            UIndexManager — 공간 등록; 함수: {insert()}
            defined — 경계 존재 판정; 함수: {defined()}
        동작:
            현재 name의 앱 편집 Set을 만들거나 재사용하여 객체를 추가한다.
            경사 편집이면 경사 박스, 아니면 기본 박스를 얻는다. 박스가 null·undefined이면 Set 등록은 남긴 채 종료한다.
            박스의 XY 범위와 객체, 새 metadata Map을 'CustomLand' 인덱스에 등록한다.

    areaPoiClear() -> void
        의존:
            UDEF — 안내 객체 해제; 함수: {disposeObject3D()}
            UGroup — 안내 연결 제거; 함수: {remove()}
        동작: 면적 안내 목록이 없거나 비었으면 종료한다. 아니면 각 객체를 해제·제거하고 _areaPoi를 새 빈 배열로 바꾼다. _drawAreaPoi는 바꾸지 않는다.

    setInclineEdit(inclineEdit: Object3D) -> void
        인터페이스: 선택된 모델 참조이며 경사 생성 여부를 정하는 boolean 옵션이 아니다.
        동작: 입력을 _iclineEdit에 저장한다.

    setStyle(style: OLStyle | CustomLandStyleCO) -> void
        의존: UDraw — 스타일 전달; 함수: {setStyle()}
        동작: 원본 style을 저장하고 _draw가 truthy이면 그대로 전달한다. 누락 필드의 기본값을 이 메서드에서 채우지 않는다.

    setDrawStyle(style: OLStyle) -> void
        의존: UDraw — 그리기 스타일 전달; 함수: {setDrawStyle()}
        동작: 원본 style을 저장하고 _draw가 truthy이면 그대로 전달한다.

    override clear(useRemoveEditLandAll?: boolean) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAnaly — 부모 정리; 함수: {prototype.clear.call()}
        동작:
            useRemoveEditLandAll이 null·undefined이면 true로 대체한다.
            useRemoveEditLandAll이 truthy이면 편집 지형을 모두 제거한다.
            부모를 정리한 뒤 입력 상태와 내부 도형 생성기를 순서대로 정리한다. false여도 이 단계는 수행한다.

    getGeoVertex() -> Array<{x: number, y: number}>
        동작: 현재 _pickList 원본 참조를 반환한다.

    checkHeightByLayer(box: UBox3) -> boolean
        의존:
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            U3dApp — 고도 레이어 목록; 함수: {getHeightLayers()}
            U3dHeightLayer — 표시·경계 조회; 함수: {getVisible(), getBoundingBox()}
            THREE.Box3 — 교차 판정; 함수: {intersectsBox()}
        동작:
            입력 박스를 복제하고 복제본 min.z와 max.z만 0으로 바꾼다.
            표시값이 정확히 false인 레이어는 건너뛴다. 나머지 실제 경계와 복제본이 교차하면 즉시 true, 끝까지 없으면 false를 반환한다.
            레이어 박스의 Z는 바꾸지 않으므로 단순 XY 교차만으로 판정하지 않는다.

    getParam() -> Array<CustomLandCO>
        의존: CustomLand — 재생성 파라미터; 함수: {getParameter()}
        동작: 각 객체의 getParameter 반환값을 순서대로 새 배열에 담는다. 반환된 항목은 추가 복제하지 않는다.

    setParam(param: Array<CustomLandCO>) -> void
        의존:
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            CustomLand — 복원 객체; 생성자: {new CustomLand()}
            U3dApp — 지형 갱신; 함수: {updateHeightLayers()}
        동작:
            항목마다 CustomLand를 생성하고 기존 목록 뒤에 추가한 뒤 앱에 등록한다.
            항목의 inclineBox가 truthy이면 그것을, 아니면 box를 사용하여 지형을 갱신한다. 입력 재계산·중복 ID 검사·기존 목록 초기화는 하지 않으며 예외를 그대로 전달한다.

    setSelectType(type: string) -> void
        동작: type이 'Polygon' 또는 'Box'일 때만 _selectType을 바꾸고 그 밖의 값이면 유지한다.

    getFeatures() -> Array<OLFeature>
        동작: _features 원본 참조를 반환한다.

    addEditLand(options: DataOPT_Input) -> Promise<void>
        의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
        동작: addCustomLand 사용을 안내하는 경고를 출력한 뒤 입력을 전달하고 결과를 그대로 반환한다.

    getEditLand() -> Array<CustomLand>
        의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
        동작: getCustomLandList 사용을 안내하는 경고를 출력한 뒤 해당 반환값을 전달한다.

    addCustomLand(options: DataOPT_Input) -> Promise<void>
        인터페이스: 공개 선언은 단일 옵션이다. 런타임은 Array 입력도 처리한다. [확인 Q-003]
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            deferredPromise — 완료 객체; 함수: {deferredPromise(), then(), catch(), resolve(), reject()}
            UDraw — 도형 생성기 준비; 생성자: {new UDraw()}; 함수: {setApp()}
            U3dMessage — 동기 예외 기록; 정적 함수: {error()}
        동작:
            새 deferredPromise를 만들고 _draw가 falsy이면서 앱이 truthy이면 현재 스타일로 UDraw를 생성해 앱을 연결한다.
            options가 Array이면 항목별 추가 함수를 현재 this와 입력에 묶고 Promise 체인으로 순차 실행한다. 앞 항목이 거절되면 뒤 항목은 실행하지 않으며 전체 결과를 resolve 또는 reject한다.

            Array가 아니면서 Object이면 한 항목을 즉시 추가하고 그 완료·실패를 전달한다.
            두 종류에 속하지 않는 입력은 TypeError로 거절한다. try 안의 동기 예외는 반환 Promise로 전달하고 '2613781' 오류를 기록한다.
            deferredPromise를 반환한다. 이미 추가한 항목은 후속 실패 시 되돌리지 않는다.

    editCustomLand(id: string, option: DataOPT_Input) -> Promise<void> | undefined
        의존:
            defined — 인수·단계 결과 검사; 함수: {defined()}
            UAnaly — 연결 앱; 속성 읽기: {_app}
            CustomLand — 이전 중심 조회; 함수: {getCenter()}
            deferredPromise — 완료 객체; 함수: {deferredPromise(), resolve(), reject()}
            UDraw — 도형 생성기 준비; 생성자: {new UDraw()}; 함수: {setApp()}
            __GInfo__ — 레이어 선택 실패 안내; 함수: {__GInfo__()}
            Web API — 필수 인수 누락 안내; 함수: {console.error()}
        동작:
            id 또는 option이 null·undefined이면 로그 후 undefined를 반환한다. 해당 객체가 없을 때도 undefined다.
            기존 중심 참조를 보관하고 deferredPromise를 만든 뒤 기존 객체를 먼저 제거한다. 실패 시 기존 객체를 자동 복원하지 않는다. [확인 Q-004]
            draw가 없고 앱이 있으면 생성·연결한다. 전달받은 option을 기존 파라미터와 병합하지 않고 기본 편집 옵션으로 계산하며 결과가 없으면 reject한다.
            새 중심이 존재하고 X·Y 각각의 floor 값 차이의 절댓값이 모두 4 미만이면 새 중심의 Z만 기존 Z로 덮는다.
            inclineEdit가 truthy이면 경사 옵션을 계산하고 결과가 없으면 reject한다.
            현재 고도 목록으로 데이터 옵션을 선택한다. 실패하면 안내 후 reject한다.
            새 객체 생성 결과와 무관하게 입력 상태를 정리하고 resolve한다. 새 ID는 option.id 또는 새 GUID다. [확인 Q-002]
            별도 바깥 catch가 없으므로 보호되지 않은 단계의 예외는 그대로 호출자에게 전달된다.

    getCustomLandList() -> Array<CustomLand>
        의존: defined — 목록 존재 판정; 함수: {defined()}
        동작: _customLandList가 null·undefined이 아니면 원본을, 아니면 새 빈 배열을 반환한다.

    getCustomLand(id: string) -> CustomLand | undefined
        동작: _customLandList에서 id가 엄격 일치하는 첫 객체를 반환하고 없으면 undefined를 반환한다.

    removeEditLandById(id: string) -> void
        의존:
            CustomLand — 객체 해제; 함수: {dispose()}
            UDraw — 마지막 도형 생성기 해제; 함수: {dispose()}
        동작:
            목록에서 ID가 같은 첫 객체를 찾고 없으면 종료한다.
            앱 등록을 제거한 뒤 현재 목록에서 객체의 위치를 다시 찾아 dispose하고 목록에서 제거한다.
            목록이 비었고 draw가 truthy이면 draw를 해제하고 undefined로 바꾼다. 예외는 그대로 전달한다.

    removeCustomLandById(id: string) -> void
        동작: ID를 전달하여 삭제를 실행하고 반환값을 그대로 전달한다.

    removeEditLandAll() -> void
        의존:
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            U3dApp — 앱 편집 목록·갱신; 속성 읽기: {_editHeightBoxList}; 함수: {getIndexManager(), updateHeightLayers()}
            CustomLand — 박스 조회와 해제; 함수: {getInclineEdit(), getInclineBox(), getBox(), dispose()}
            UIndexManager — 공간 등록 제거; 함수: {remove()}
            defined — 박스 존재 판정; 함수: {defined()}
        동작:
            현재 name의 앱 편집 Set을 먼저 삭제한다.
            각 객체에서 경사 여부에 맞는 박스를 고른다. 박스가 null·undefined이면 그 객체의 인덱스 제거·지형 갱신·dispose를 건너뛴다.
            박스가 있으면 인덱스에서 제거하고 지형을 갱신한 뒤 객체를 dispose한다.
            순회 후 목록을 새 빈 배열로 바꾸고 측정 피처와 내부 draw를 정리한다. _pickList·_endPoint를 초기화하는 경로는 호출하지 않는다.

    removeCustomLandAll() -> void
        동작: 전체 제거를 실행하고 반환값을 전달한다.

    getVolume(id: string, progressFunc?: Function) -> Promise<CustomLand> | undefined
        의존:
            defined — 대상 존재 판정; 함수: {defined()}
            CustomLand — 토공량 분석 진입; 함수: {getVolume()}
        동작: ID로 객체를 찾아 없으면 undefined를 반환하고, 있으면 progressFunc를 전달해 받은 결과를 그대로 반환한다.

    cancelDrawFeature() -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 측정 레이어; 속성 읽기: {_measureLayer}
            UDEF — 안내 해제; 함수: {disposeObject3D()}
            UGroup — 안내 연결 제거; 함수: {remove()}
            U3dShaderMeasureLayer — 측정 피처 제거; 함수: {removeFeature()}
        동작:
            앱이 falsy이면 종료한다.
            면적 안내가 있으면 마지막 객체를 숨김·해제·그룹 제거한 뒤 목록에서 뺀다.
            측정 피처가 있으면 측정 레이어가 존재할 때 제거를 요청하고 목록에서 마지막 항목을 뺀다. 입력 좌표와 _drawAreaPoi 참조는 바꾸지 않는다.

    #click(e: U3dMouseEvent) -> void
        의존:
            UAnaly — draw 인자와 앱; 속성 읽기: {_drawArg, _app}
            UDrawArg — 좌표·측정·갱신; 속성 읽기: {_app}; 함수: {getWorldToGeographic(), getMeasureArea(), getTextPositionToMeasureArea(), getGeographicToWorld(), setUpdateDate()}
            U3dApp — 교차점·높이·측정 및 장면; 함수: {intersectAtPixel(), getRenderHeightAtPoint()}; 속성 읽기: {_measureLayer, _sceneComment}
            U3dShaderMeasureLayer — 측정 좌표; 함수: {setMeasurePoints(), addMeasurePoint()}
            U3dBilboard — 안내 생성; 정적 함수: {makeBilboard()}
            UDEF — 디버그·무효 높이·해제; 상수: {debug, INVALID, TERRAIN_NO_DATA}; 함수: {disposeObject3D()}
            UGroup — 안내 연결; 함수: {add(), remove()}
            Vector3 — three의 안내 위치 벡터; 생성자: {new Vector3()}
            THREE.Object3D(_sceneComment) — 안내 그룹 연결; 함수: {add()}
            defined — 교차점·측정값·안내 존재 판정; 함수: {defined()}
            Web API — 교차점 부재 안내; 함수: {console.info()}
        동작:
            intersectAtPixel(e, true)의 첫 교차점을 사용하고 원본 point.z가 NaN 또는 음수이면 0으로 바꾼다. 점이 없으면 디버그 모드에서 안내 후 종료한다.
            점을 지리 좌표로 바꿔 _pickList에 추가한다.
            Box 입력이면 추가 후 점 개수로 분기한다.
                1개이면 clear를 실행하여 기존 편집 지형까지 제거한 뒤 현재 점 하나로 입력 목록을 다시 만들고 시작 안내를 추가한다.
                2개이면 다음 순서로 처리한다.
                    측정점과 입력 목록에 같은 결과를 사용하며 끝 안내를 추가한다.
                그 밖에는 목록을 앞의 두 점으로 교체하고 이후 안내·갱신 없이 종료한다.
            Polygon이면 클릭 안내를 추가하고 측정 레이어에 현재 지리 좌표를 전달한다. 만든 안내는 _guidPoi에도 보관한다.
            측정 면적과 안내 위치를 조회한다. 위치가 존재하면 월드 XY로 변환한다.
                면적이 없으면 '0m²'로 둔다.
                안내 위치의 렌더 높이가 null·undefined·INVALID·TERRAIN_NO_DATA이면 0으로 대체한다.
                이전 면적 안내가 있으면 해제·그룹 제거하고 _areaPoi에 있으면 뺀다. 새 안내를 _drawAreaPoi·그룹·_areaPoi에 연결한다.
            앱 참조가 truthy이면 주석 장면에 안내 그룹을 연결하고, drawArg의 갱신 시각을 변경한다.

    #dblClick() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 측정 확정·제거; 함수: {commitMeasurePoint(), removeMeasureFeature()}
            OLFeature(feature) — 측정점 개수; 함수: {getMeasureVectors()}
            UDEF — 안내 해제; 함수: {disposeObject3D()}
            UGroup — 안내 연결 제거; 함수: {remove()}
        동작:
            _app이 truthy일 때 다음을 수행하며, falsy이면 종료한다.
                측정을 확정한 반환값을 _features에 추가한다.
                피처가 truthy이고 측정점이 2개 이하이면 앱에서 피처를 제거한다. 이 분기에서 면적 안내가 truthy이면 그것도 해제·그룹 제거한다.
                _features와 _areaPoi의 해당 항목은 이 단계에서 빼지 않는다. _drawAreaPoi를 undefined로, _endPoint를 true로 바꾸고 입력점 안내를 정리한다.

    #clearGuidPoi() -> void
        의존:
            UDEF — 안내 객체 해제; 함수: {disposeObject3D()}
            UGroup — 안내 연결 제거; 함수: {remove()}
        동작: _guidPoi의 각 객체를 해제·그룹 제거하고 새 빈 배열로 바꾼다.

    #removeAppEditListById(findIndex: CustomLand) -> void
        의존:
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            defined — draw·피처 존재 판정; 함수: {defined()}
            __GError__ — draw 인자 누락; 함수: {__GError__()}
            U3dApp — 앱 목록·지형 갱신; 속성 읽기: {_editHeightBoxList}; 함수: {getIndexManager(), updateHeightLayers()}
            CustomLand — 박스 선택; 함수: {getInclineEdit(), getInclineBox(), getBox()}
            UIndexManager — 공간 등록 제거; 함수: {remove()}
            UDraw — 편집 피처 제거; 함수: {removeFeature()}
        동작:
            drawArg가 null·undefined이면 '1427723' 오류 후 종료한다. 객체가 현재 목록에 없어도 종료한다.
            앱의 현재 name Set에서 객체를 빼고 Set이 비면 키를 삭제한다.
            경사 여부에 맞는 박스를 골라 해당 XY 인덱스를 제거한다.
            draw와 ID의 top feature가 존재하면 피처를 제거하고 키를 삭제한 뒤 같은 키에 undefined를 다시 대입한다.
            해당 박스로 지형 갱신을 요청한다. 객체 dispose와 로컬 목록 제거는 호출자가 담당한다.

    #setDataOption(opt: DataOPT, layers?: Array<U3dHeightXYZLayer>) -> DataOPT | false
        의존:
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            U3dApp — 고도 목록; 함수: {getHeightLayers()}
        동작:
            layers가 falsy이면 연결 앱의 고도 목록을 조회한다.
            목록이 없거나 비었거나 option 또는 option.box가 falsy이면 false를 반환한다.
    #setLandOption(options?: DataOPT) -> DataOPT | undefined
        의존:
            defined — 입력·ID·중복·필수값 확인; 함수: {defined()}
            Guid — 새 ID; 함수: {Guid()}
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            UEventDispatcher — 면적 초과 이벤트; 함수: {dispatchEvent()}
            U3dMessage — 중복·계산 오류; 정적 함수: {error()}; 상수: {CNT.ANALY.EXIST_CUSTOMLAND}
        동작:
            options가 null·undefined이면 새 객체로 대체한다.
            대체 후 options가 truthy이면 다음을 수행하며, falsy이면 undefined를 반환한다.
                drawArg와 app을 얻은 뒤 try 구간으로 진입한다. ID가 null·undefined이면 String(Guid())를 원본 옵션에 기록한다.
                같은 ID의 객체가 있으면 '3721954' 오류를 기록하고 마지막 입력 안내·피처를 취소한 뒤 종료한다.
                geoVertex 또는 height가 null·undefined이면 종료한다. 값 전체의 숫자 정규화·빈 배열 검증은 하지 않는다.
                면적 검증 callback은 계산된 size.x × size.y가 _maxArea²보다 클 때 'Maximum Size' 오류 이벤트를 발행하고 false, 그 밖에는 true를 반환한다. 메시지는 _maxArea에 'km² 이하'를 붙인다. [확인 Q-005]
                try 내부 예외는 '2636045' 오류로 기록하고 undefined를 반환한다. 이미 변경된 옵션·피처 상태는 되돌리지 않는다.

    #setInclineLandOption(opts: DataOPT) -> DataOPT | undefined
        의존:
            defined — 입력·draw 확인; 함수: {defined()}
            U3dMessage — 계산 오류; 정적 함수: {error()}
        동작:
            opts가 null·undefined이면 종료한다. insideError가 truthy이거나 draw가 null·undefined여도 종료한다.
            try 내부 예외는 '2638663' 오류로 기록하고 undefined를 반환하며 부분 변경은 되돌리지 않는다.

    #createCustomLand(options: DataOPT) -> CustomLand | undefined
        의존:
            defined — 옵션 존재 판정; 함수: {defined()}
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            CustomLand — 편집 객체; 생성자: {new CustomLand()}
            U3dApp — 지형 갱신; 함수: {updateHeightLayers()}
            U3dMessage — 생성·등록 오류; 정적 함수: {error()}
        동작:
            옵션이 null·undefined이면 종료한다.
            CustomLand를 생성하여 로컬 목록에 추가한 뒤 앱에 등록한다.
            inclineBox가 truthy이면 그것을, 아니면 box를 사용해 지형을 갱신한다.
            try 내부 예외는 '2639384' 오류만 기록한다. 생성 전 실패이면 undefined, 객체 생성 후 실패이면 만들어진 객체를 반환하며 이미 한 등록은 되돌리지 않는다. [확인 Q-002]

    #addCustomLand_(options: DataOPT) -> Promise<void>
        의존:
            UAnaly — draw 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱; 속성 읽기: {_app}
            U3dApp — 고도 레이어; 함수: {getHeightLayers()}
            defined — 목록 존재 판정; 함수: {defined()}
            deferredPromise — 완료 객체; 함수: {deferredPromise(), resolve(), reject()}
            __GInfo__ — 레이어 부재 안내; 함수: {__GInfo__()}
        동작:
            deferredPromise를 만들고 연결 앱의 고도 목록을 한 번 얻는다. 없거나 비었으면 '5123164' 안내 후 reject한다.
            기본 편집 옵션을 계산하고 falsy이면 reject한다.
            계산된 inclineEdit가 truthy이면 경사 옵션을 계산하고 falsy이면 reject한다.
            처음 전달한 옵션과 앞서 얻은 레이어 목록으로 데이터 옵션을 완성한다. 앞 단계는 같은 옵션을 변경하므로 그 결과가 이어진다. falsy이면 '5136956' 안내 후 reject한다.
            편집 객체를 생성하고 반환값이 truthy일 때만 입력 상태를 정리한다.
            생성 결과가 undefined여도 resolve한다. 바깥 try로 전달된 예외만 reject하며 deferredPromise를 반환한다. [확인 Q-002]

    #clearDrawFeature() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 측정 레이어; 속성 읽기: {_measureLayer}
            U3dShaderMeasureLayer — 측정 피처 정리; 함수: {clearDrawFeature(), removeFeature()}
            defined — 레이어와 조건값 존재 판정; 함수: {defined()}
        동작:
            앱이 falsy이거나 측정 레이어가 null·undefined이면 종료하여 목록을 유지한다.
            측정 레이어의 현재 그리기 피처를 정리한 뒤 _features의 각 항목을 제거하고 새 빈 배열로 바꾼다. defined(_features.length > 0)은 boolean을 검사하므로 길이 0도 이 경로에 들어간다.

    #clearInDrawFeature() -> void
        의존:
            defined — draw와 layer 존재 판정; 함수: {defined()}
            UDraw — 피처·생성기 해제; 속성 읽기: {layer}; 함수: {removeFeature(), dispose()}
            U3dShaderMeasureLayer — draw 레이어 정리; 함수: {clearDrawFeature()}
            Web API — 피처 제거 오류; 함수: {console.info()}
        동작:
            draw 또는 draw.layer가 null·undefined이면 정리 없이 종료한다.
            _topFeature의 각 키에서 현재 draw가 truthy이면 피처 제거를 시도한다. 항목별 예외는 'remove error'를 출력하고 나머지를 계속한다.
            예외 없이 완료한 항목이 하나라도 있으면 _topFeature를 빈 객체로 바꾸고 처음 얻은 layer의 draw feature를 정리한다. 모두 실패하거나 키가 없으면 저장소를 유지한다.
            마지막에 현재 draw가 truthy이면 dispose하고 undefined로 바꾼다. 마지막 layer 정리·dispose의 예외는 여기서 잡지 않는다.

    #clearState() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 갱신 시각; 함수: {setUpdateDate()}
        동작:
            _endPoint를 false로, _pickList를 새 빈 배열로 바꾼 뒤 측정 피처를 정리한다.
            앱이 truthy이면 갱신 시각을 변경한다.

getStyle(fill: ColorRepresentation, stroke: ColorRepresentation, width: number, radius: number) -> OLStyle
    처리 기준: 현재 모듈에는 호출·export가 없으며 공개 스타일 설정은 이 함수를 거치지 않는다.
    의존: ol — OpenLayers 스타일 조립; 생성자: {new ol.style.Fill(), new ol.style.Stroke(), new ol.style.Circle(), new ol.style.Style()}
    동작: fill 색으로 Fill, stroke 색과 width로 Stroke를 만든다. 같은 채움·선과 radius로 Circle을 만들고 이를 image로, 앞의 채움·선을 fill·stroke로 갖는 새 Style을 반환한다.

```

## 4. 공통 처리 기준과 제약

```spec
생성의 기본 도형·경사·데이터 단계는 같은 옵션 객체를 순차 갱신한다. 중도 실패 시 옵션·피처·이미 등록한 객체를 일괄 원복하는 트랜잭션은 없다.
원본 데이터 선택은 _getHeightTilePayload를 제공하는 실제 레이어를 보존한다. 이 분석에서 포맷을 파싱하지 않으며 레이어 전역 복원값은 CustomLand에 전달할 기본값이다.
입력 상태 정리, 편집 지형 제거, 입력 이벤트 해제는 서로 다른 경계다. clear(false)는 편집 지형을 보존하고, removeEditLandAll은 입력 좌표·종료 상태 초기화를 대신하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
