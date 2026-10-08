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
                _clickId 또는 _dblClickId가 undefined가 아니면 null·undefined가 아닌 각 식별자의 앱 이벤트를 unkey로 해제하고 이 분석의 off()를 호출한다. 식별자가 null인 경우에도 off()는 실행한다.
                앱 모드를 UDEF.APP_MODE._AREA로 하고 폴리곤 측정 타입을 설정한다.
                getSceneComment()가 null·undefined가 아니면 _poiGroup을 등록한다.
                onClick·onDblClick을 이 객체에 bind하여 click·dblclick에 연결하고 반환 식별자를 저장한다.
                document의 mousemove에 _boundMouseMove를 capture=false로 등록한다. 반복 활성화에서 새 바인딩 함수를 만들지 않는다.

    override deactive() -> void
        의존:
            UAnaly — 비활성 전환·분석 리스너 해제; 함수: {super.deactive.call()}; 속성 읽기: {_isActive, _app}
            U3dApp — 앱 입력 연결 해제; 함수: {unkey()}
            document — DOM 입력 해제; 함수: {removeEventListener()}
        동작:
            _isActive가 falsy이면 종료한다.
            _isActive가 truthy인 경우 부모 비활성화를 먼저 호출한다.
                _app이 falsy이면 부모 처리만 완료한 채 종료한다. 식별자·가이드 상태·라벨 참조는 추가로 바꾸지 않는다.
                _app이 truthy인 경우 다음 입력 해제와 확정을 수행한다.
                    null·undefined가 아닌 두 앱 이벤트 식별자를 해제하고 같은 _boundMouseMove를 capture=false로 DOM에서 해제한다.
                    두 식별자와 _poi를 undefined로 한 뒤 현재 측정을 확정한다.
                    확정이 정상 종료한 뒤 _setMouseMove를 false로 한다. 확정 예외 시 이 마지막 변경은 실행하지 않는다.

    override clear() -> void
        의존:
            UAnaly — 결과 그룹의 자식 정리·장면 분리; 함수: {super.clear.call()}; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 화면 갱신; 함수: {update()}
        동작:
            super.clear.call(this)로 부모의 결과 그룹 정리를 먼저 실행한다.
            defined(_app)으로 앱의 null·undefined 여부를 판정한다.
            그 판정이 참일 때 측정 피처 정리를 수행한다.
            _app이 falsy이면 종료하고 그 밖에는 app.update()를 호출한다.
            _setMouseMove는 바꾸지 않으며 앞선 정리에서 예외가 나면 후속 갱신하지 않는다.

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
        인터페이스: e: 지형 교차 조회에 사용할 앱 클릭 이벤트다.
        의존:
            UAnaly — 실행 인자·지형 교차; 함수: {intersectTerrain()}; 속성 읽기: {_drawArg}
            defined — 교차 결과 유무; 함수: {defined()}
            UDEF — 디버그 로그 설정; 속성 읽기: {debug}
            console — 교차 실패 안내; 함수: {info()}
            UDrawArg — 지리 좌표 변환·점 추가; 함수: {getWorldToGeographic(), addMeasurePoint()}
        동작:
            _drawArg가 falsy이면 종료한다.
            _drawArg가 truthy인 경우 다음 클릭 처리를 수행한다.
                intersectTerrain(e)로 교차점을 조회한다. null·undefined이면 UDEF.debug가 truthy일 때 picking is null을 출력하고 종료한다.
                교차가 있으면 월드 x·y·z를 지리 좌표로 변환하고 반환 좌표의 원본 참조를 측정점으로 추가한 뒤 라벨을 갱신한다.
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
        동작:
            _setMouseMove를 false로 먼저 설정한 뒤 현재 측정을 확정한다.
            활성 상태를 검사하지 않으며 확정 예외가 발생해도 가이드 상태는 false로 남는다.

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
            모든 제거가 정상 종료한 경우에만 _features를 새 빈 배열로 바꾼다. 제거 예외 시 원래 배열 참조가 남는다.

    _commitFeature() -> void
        의존:
            UAnaly — 연결 앱; 속성 읽기: {_app}
            U3dApp — 측정점 확정; 함수: {commitMeasurePoint()}
            defined — 확정 결과 유무; 함수: {defined()}
        동작:
            _poi를 undefined로 먼저 바꾸며 기존 라벨을 장면에서 제거하지 않는다.
            _app이 falsy이면 종료하고 그 밖에는 app.commitMeasurePoint()를 호출한다.
            반환 결과가 false이면 목록에 보관하지 않는다. false가 아니고 null·undefined도 아니면 _features에 원본 참조를 추가한다.
            앱 확정에서 예외가 나도 _poi 참조는 이미 비워진 상태다.

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
