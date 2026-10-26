# UAnalyArea 명세

> 상태: 구현 관찰 초안

## 1. 개요

UAnaly를 상속하여 클릭·마우스 이동·더블클릭 또는 위경도 좌표 배열로 면적 측정을 진행한다.
U3dApp의 Area 분석으로 생성·활성화하고 UDrawArg에 측정점을 전달하며 결과를 주석 장면의 라벨로 표시한다.
실제 측정 면적과 지리·월드 좌표 변환은 UDrawArg와 앱의 측정 계층에 위임한다.

## 3. 정규 자연어 수도코드

```spec
UAnalyArea extends UAnaly 클래스 정의
    의존: UAnaly — 분석 상태·앱 연결·교차 조회·이벤트 기반; 상속: {UAnaly}

    name: string = 'Area'
        앱의 분석 등록·조회에 사용하는 이름이다.
    _clickId: string | null | undefined = undefined
        앱의 클릭 연결 식별자다.
    _dblClickId: string | null | undefined = undefined
        앱의 더블클릭 연결 식별자다.
    override _poiGroup: UGroup = 새 UGroup
        결과 라벨을 담으며 생성자가 부모의 그룹 참조를 새 그룹으로 교체한다.
    _features: Array<UMeasureFeature> = 빈 배열
        앱에서 확정한 측정 피처의 원본 참조를 등록 순서로 보관한다.
    _setMouseMove: boolean = false
        마우스 이동으로 마지막 가이드 점을 갱신할지 나타낸다.
    _poi: UCssBilboard | undefined = undefined
        현재 측정 중인 라벨이며 확정 시 참조만 비운다.
    _boundMouseMove: function(MouseEvent) -> void
        생성 시 이 객체를 this로 묶은 _onMouseMove이며 DOM 등록·해제에서 같은 함수 참조를 사용한다.

    constructor(opt?: UAnalyAreaCO)
        인터페이스: opt: 분석 이름 옵션이며 생략 시 Area를 사용한다.
        의존:
            UAnaly — 기반 분석 초기화; 생성자: {super()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UGroup — 라벨 그룹 생성; 생성자: {new UGroup()}
        동작:
            부모를 opt 없이 초기화하고 opt가 falsy이면 빈 객체로 대체한다.
            opt.name이 undefined이면 name을 Area로 하고 그 밖의 값은 그대로 저장한다. null·빈 문자열·false·0은 대체하지 않는다.
            두 클릭 식별자와 _poi를 undefined로, _poiGroup을 새 그룹으로, _features를 새 빈 배열로 초기화한다.
            _setMouseMove를 false로 하고 _onMouseMove를 현재 객체에 bind하여 _boundMouseMove에 저장한다.
            상속 옵션 type은 부모에게 전달하지 않는다. [확인 Q-001]

    override active() -> void
        역할: 앱의 폴리곤 측정 모드와 입력 이벤트를 연결한다.
        의존:
            UAnaly — 활성 상태·앱·분석 이벤트; 함수: {super.active.call(), off()}; 속성 읽기: {_app}
            U3dApp — 측정 모드·주석 장면·입력 연결; 함수: {unkey(), setMode(), setPolygonMeasureType(), getSceneComment(), on()}
            UDEF — 면적 앱 모드; 속성 읽기: {APP_MODE._AREA}
            UScene — 라벨 그룹 등록; 함수: {add()}
            document — DOM 입력 연결; 함수: {addEventListener()}
        동작:
            활성 여부와 무관하게 super.active.call(this)를 먼저 호출한다.
            _app이 falsy이면 활성 상태만 유지하고 종료한다.
            _app이 truthy인 경우 다음 앱 연결을 수행한다.
                _clickId 또는 _dblClickId가 undefined가 아니면 null·undefined가 아닌 각 식별자의 앱 이벤트만 unkey로 해제한다. 소비자의 분석 이벤트 구독은 유지한다.
                앱 모드를 UDEF.APP_MODE._AREA로 하고 폴리곤 측정 타입을 설정한다.
                getSceneComment()가 null·undefined가 아니면 _poiGroup을 등록한다.
                onClick·onDblClick을 이 객체에 bind하여 click·dblclick에 연결하고 반환 식별자를 저장한다.
                우클릭 누름·놓음과 Esc를 고유 키로 연결하고 document의 mousemove에 _boundMouseMove를 capture=false로 등록한다.

    override deactive() -> void
        의존: U3dApp — 소유 입력 해제; 함수: {unkey()}; Web API — 이동 해제; 함수: {document.removeEventListener()}
        동작: 비활성이면 종료한다. 활성 상태를 false로 바꾸고 보조 입력·자신의 임시 선택 강조를 해제한다.
            앱이 없으면 종료한다. 앱이 있으면 자신의 클릭·더블클릭 키와 문서 이동 함수를 해제하고 키를 undefined로 초기화한다.
            현재 입력을 종료하며 소비자가 등록한 분석 이벤트 구독은 유지한다.

    override clear() -> void
        의존:
            UAnaly — 결과 그룹의 자식 정리·장면 분리; 함수: {super.clear.call()}; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 화면 갱신; 함수: {update()}
        동작:
            super.clear.call(this)로 부모의 결과 그룹을 정리하고 장면에서 분리한다.
            defined(_app)으로 앱의 null·undefined 여부를 판정한다.
            그 판정이 참일 때 측정 피처 정리를 수행한다.
            _app이 falsy이면 종료하고 그 밖에는 app.update()를 호출한다.
            피처 정리가 완료되면 이동 안내를 false로 초기화하고 활성 상태이면 빈 그룹을 주석 장면에 다시 연결한다. 앞선 정리의 예외는 전달한다.

    drawArea(coordList: Array<UGPoint>) -> void
        인터페이스: coordList: WGS84 위경도 좌표계(EPSG:4326)의 x는 경도(도), y는 위도(도), z는 실제 높이(m)인 측정점 배열이다. 면적 수치는 반환하지 않고 결과 라벨에 표시한다. [확인 Q-002]
        의존:
            UAnaly — 연결 앱·실행 인자; 속성 읽기: {_drawArg, _app}
            UGPoint — 좌표 객체 보완; 생성자: {new UGPoint()}; 속성 읽기: {isGPoint, isVector3, x, y, z}
            UDrawArg — 측정점 추가; 함수: {addMeasurePoint()}
        동작:
            _drawArg가 falsy이면 종료하고 그 다음 _app이 falsy이면 종료한다.
            _drawArg와 _app이 모두 truthy이면 다음 측정을 진행한다.
                coordList.forEach로 존재하는 원소를 순서대로 처리한다. 각 원소의 isGPoint 또는 isVector3가 falsy이면 x·y·z로 새 UGPoint를 만들어 추가한다. 두 표식이 모두 truthy이면 원소의 원본 참조를 그대로 추가한다.
                입력 배열의 원소를 새 점으로 교체하지 않으며 각 addMeasurePoint 반환값은 사용하지 않는다.
                라벨을 갱신한 뒤 측정을 확정한다.
            활성 여부나 빈 배열은 별도로 검사하지 않는다. 중간 예외가 나면 이미 추가한 점을 되돌리지 않는다.

    onClick(e: U3dMouseEvent) -> void
        중복 종료점: 입력 중 마지막 고정 점과 같은 월드 위치의 우클릭은 점·고정 라벨을 추가하지 않는다. 다른 위치의 우클릭 점 추가와 연속 우클릭 종료 판정은 유지한다.
        인터페이스: e: 지형 교차 조회에 사용할 앱 클릭 이벤트다.
        처리 기준: 진행 중인 측정에서 원본 입력이 isTrusted === true이고 detail === 2이면 더블클릭의 첫 클릭에서 이미 확정한 끝점을 다시 추가하지 않고 종료한다. 이때 교차 조회와 라벨 갱신도 생략한다. 명시적 호출·합성 입력과 새 측정의 첫 클릭에는 적용하지 않는다.
        의존:
            UAnaly — 실행 인자·지형 교차; 함수: {intersectTerrain()}; 속성 읽기: {_drawArg}
            defined — 교차 결과 유무; 함수: {defined()}
            UDEF — 디버그 로그 설정; 속성 읽기: {debug}
            console — 교차 실패 안내; 함수: {info()}
            UDrawArg — 지리 좌표 변환·점 추가; 함수: {getWorldToGeographic(), addMeasurePoint()}
        동작:
            입력 중이 아니면 확정 도형 선택을 먼저 시도하고 적중하면 종료한다.
            _drawArg가 falsy이면 종료한다.
            _drawArg가 truthy인 경우 다음 클릭 처리를 수행한다.
                intersectTerrain(e)로 교차점을 조회한다. null·undefined이면 UDEF.debug가 truthy일 때 picking is null을 출력하고 종료한다.
                교차가 있으면 월드 x·y·z를 지리 좌표로 변환하고 첫 좌표를 실행 인자로 추가한다. 진행 중이면 이전 안내 점을 클릭 위치에 고정하고 새 안내 점을 한 번의 갱신으로 추가한 뒤 라벨을 갱신한다.
                라벨 갱신이 정상 종료하고 _setMouseMove가 falsy이면 같은 지리 좌표 참조를 가이드 끝점으로 한 번 더 추가한 뒤 _setMouseMove를 true로 한다.
            활성 상태를 별도로 검사하지 않는다.

    _onMouseMove(e: MouseEvent) -> void
        인터페이스: e: 정규화 좌표로 변환할 DOM 마우스 이벤트다.
        의존:
            UAnaly — 활성 조회·앱·지형 교차; 함수: {isActive(), intersectTerrain()}; 속성 읽기: {_app}
            U3dApp — 측정 레이어 조회; 함수: {getMeasureLayer()}
            U3dMouseEvent — 입력 좌표 정규화; 함수: {computeNormalize()}
            defined — 교차 결과 유무; 함수: {defined()}
            UDEF — 디버그 로그 설정; 속성 읽기: {debug}
            console — 교차 실패 안내; 함수: {info()}
            U3dShaderMeasureLayer — 가이드 끝점 갱신; 함수: {updateLastPosition()}
        동작:
            isActive()가 falsy이거나 _setMouseMove가 falsy이면 종료한다.
            _app이 falsy이면 종료한다.
            _app이 truthy인 경우 측정 레이어를 먼저 조회한 뒤 e를 computeNormalize로 변환하고 normalizedX·normalizedY를 담은 새 이벤트 객체로 지형 교차를 조회한다.
                교차가 null·undefined이면 UDEF.debug가 truthy일 때 picking is null을 출력하고 종료한다.
                교차가 있으면 measureLayer와 updateLastPosition이 null·undefined가 아닌 경우 교차점의 원본 참조로 가이드 끝점을 갱신한다.
                레이어·메서드가 없어 갱신을 생략한 경우에도 라벨을 갱신한다.

    onDblClick() -> void
        동작: 현재 측정의 종료 처리를 실행하며 활성 상태는 유지한다.

    getFeatures() -> Array<UMeasureFeature>
        동작: 이 분석의 확정 피처 목록을 새 배열로 반환한다. 피처 자체는 원본 참조다.

    override _forgetMeasureFeature(feature: UMeasureFeature) -> void
        동작: 부모에게 해당 피처의 라벨 정리를 위임한 뒤 자신의 확정 목록에서 제거한다.

    drawStop() -> void
        의존: U3dShaderMeasureLayer — 편집 상태와 안내 점 정리; 함수: {getMeasureVectors(), clearDrawFeature(), cancelLastPosition()}
        동작: 레이어가 없거나 입력 중이 아니면 종료한다. 안내 점 하나를 뺀 고정 점 수를 구하고 이동 안내를 false로 바꾼다.
            고정 점이 3개 미만이면 현재 임시 도형과 현재 라벨만 제거한다. 화면 갱신과 라벨 참조 정리 후 feature·type이 undefined이고 value가 0인 measureend를 전달한다.
            충분하면 안내 점을 제거하고 면적 라벨을 갱신한 뒤 피처를 확정한다.
            현재 라벨 참조를 undefined로 한다. 화면 갱신을 요청한다.

    drawTextLabel() -> void
        의존:
            UAnaly — 실행 인자; 속성 읽기: {_drawArg}
            UDrawArg — 카메라·면적·지리 위치; 함수: {getCamera(), getTextPositionToMeasureArea(), getMeasureArea()}
            defined — 위치·면적·라벨 유무; 함수: {defined()}
            U3dBilboard — 텍스트 라벨 생성; 함수: {makeText()}
            UGroup — 생성 라벨 등록; 함수: {add()}
            UCssBilboard — 기존 라벨 갱신·원래 측정값 보관; 함수: {setLabel(), setPosition()}; 속성 쓰기: {userData.value}
        동작:
            _drawArg가 falsy이면 종료한다. 카메라가 falsy이면 종료하고 지리 라벨 위치가 null·undefined이면 종료한다.
            _drawArg가 truthy이고 카메라·위치가 유효한 경우 면적 msize를 조회한다.
                msize가 null·undefined가 아니면 다음 변환을 수행한다.
                그 밖에는 0m²를 사용한다.
                _poi가 null·undefined가 아니면 기존 라벨의 문자열을 먼저 바꾸고 배치 좌표를 설정한다.
                그 밖에는 position·text·value(msize)를 담은 새 옵션으로 makeText를 호출하고 반환값을 _poi에 저장한 뒤 _poiGroup에 등록한다.
                이후 _poi가 falsy이면 종료하고 그 밖에는 userData.value에 단위 변환 전 msize를 그대로 저장한다.
            라벨 생성·장면 등록·투영 예외는 잡지 않으며 후속 처리를 실행하지 않는다.

    _clearMeasureFeature() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 측정 피처 제거; 함수: {removeMeasureFeature()}
        동작:
            앱 유무를 검사하기 전에 현재 측정을 확정한다.
            _app이 falsy이면 종료한다.
            현재 _features의 길이를 매번 읽는 인덱스 순회로 각 원본 피처를 app.removeMeasureFeature에 전달한다. 반환값은 사용하지 않는다.
            모든 제거가 정상 종료한 경우에만 _features를 새 빈 배열로 바꾸고 라벨 매핑·현재 라벨 목록·선택·가이드를 초기화한다. 제거 예외 시 원래 배열 참조가 남는다.

    _commitFeature() -> void
        의존: U3dApp — 편집 피처 확정; 함수: {commitMeasurePoint()}
        동작: 현재 라벨 참조를 undefined로 하고 앱이 없으면 종료한다. 앱의 확정 반환이 false·null·undefined이면 보관하지 않는다.
            유효한 피처를 확정 목록에 추가하고 현재 라벨 목록의 소유권을 연결한 뒤 measureend를 전달한다.

UAnalyAreaCO_Content 부분 타입 명세
    name?: string = 'Area'
        분석 식별 이름 옵션이다.

UAnalyAreaCO 부분 타입 명세
    UAnalyCO와 UAnalyAreaCO_Content의 합성 타입이다.
    name?: string = 'Area'
        분석 식별 이름 옵션이다.
    type?: string = 'analy'
        상속 타입이 선언하는 분석 타입 옵션이지만 이 생성자는 부모에게 전달하지 않는다. [확인 Q-001]

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
