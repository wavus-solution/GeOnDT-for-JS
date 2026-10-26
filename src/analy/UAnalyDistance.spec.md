# UAnalyDistance 명세

> 상태: 구현 관찰 초안

## 1. 개요

클릭으로 지정하거나 위경도 좌표 목록으로 전달한 경로의 누적 거리를 라벨로 표시하는 분석 클래스다. 두 위경도 좌표의 거리를 표출 없이 계산하는 API도 제공한다.

앱에 연결한 뒤 활성화하면 클릭·더블클릭·문서 마우스 이동을 연결한다. 클릭은 경로와 고정 라벨을 추가하고 마우스 이동은 안내 끝점과 안내 라벨을 갱신한다. 더블클릭·Esc·우클릭 두 번·비활성화에서는 충분한 고정 점만 확정하고 부족한 임시 입력은 취소한다. 초기화는 저장한 측정과 라벨을 제거한다. 거리 계산은 UMathEngine, 측정점과 피처 관리는 앱의 측정 레이어가 담당한다.

U3dApp의 기본 분석 등록과 `activeAnalysis('Distance')`에서 사용한다. `tutorial-official/measure.html`은 인터랙티브 측정·drawDistance·두 점 거리 계산의 대표 사용처다.

## 3. 정규 자연어 수도코드

```spec
UAnalyDistance extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반; 상속: {UAnaly}

    static OPT_KEYS: Array<string> = UAnaly.OPT_KEYS와 'name'
        의존: UAnaly — 부모 옵션 정본; 속성 읽기: {OPT_KEYS}

    name: string = 'Distance'
        앱이 구별하는 분석 이름이며 외부 쓰기를 차단하지 않는다.
    _clickId, _dblClickId: string | null | undefined = undefined
        마지막 클릭·더블클릭 등록 이름
    _poiGroup: UGroup
        고정 라벨과 안내 라벨을 담는 표출 그룹
    #features: Array<UMeasureFeature> = 빈 배열
        이 분석이 확정한 측정 피처 원본 참조 목록
    #setMouseMove: boolean = false
        클릭으로 안내 끝점을 추가한 뒤 이동 갱신을 허용하는 상태
    helperPoi: UCssBilboard | undefined = undefined
        안내 라벨 원본 참조이며 외부에서 교체할 수 있다.
    #boundMouseMove: (e: MouseEvent) -> void
        생성 시 한 번 바인딩하여 등록·해제에 재사용하는 이동 함수

    constructor(opt?: UAnalyDistanceCO)
        인터페이스: opt는 분석 이름을 전달한다.
        의존:
            UAnaly — 기반 생성; 생성자: {new UAnaly()}
            defaultValue — undefined의 기본값 선택; 함수: {defaultValue()}
            normalizeOptionKeys — 생성 옵션 키 정규화; 함수: {normalizeOptionKeys()}
            UGroup — 라벨 그룹 생성; 생성자: {new UGroup()}
        동작:
            부모 생성자를 옵션 없이 실행하고 falsy opt를 빈 객체로 대체한 뒤 new.target의 OPT_KEYS로 정규화한다.
            name이 undefined이면 'Distance'를 사용하며 그 밖의 값은 그대로 저장한다.
            이벤트 키를 undefined로 두고 새 그룹·빈 피처 목록·false인 이동 상태를 설정한다.
            안내 라벨을 undefined로 두고 현재 인스턴스에 바인딩한 이동 함수를 저장한다.

    override active() -> void
        의존:
            UAnaly — 활성 상태와 앱; 함수: {active()}; 속성 읽기: {_app}
            U3dApp — 분석 모드·측정 유형·주석 장면·이벤트; 함수: {unkey(), setMode(), setLineStringMeasureType(), getSceneComment(), on()}
            UDEF — 거리 분석 모드와 고유 이벤트 이름; 상수: {APP_MODE._DISTANCE}; 정적 함수: {createUUID()}
            UScene — 라벨 그룹 연결; 함수: {add()}
            Web API — 문서 이동 이벤트 등록; 함수: {document.addEventListener()}
        동작:
            부모 active를 먼저 실행하고 앱이 falsy이면 활성 상태만 변경한 채 종료한다.
            저장한 각 클릭·더블클릭 키가 null·undefined가 아니면 앱에서 해당 등록만 해제하며 분석 객체의 리스너는 지우지 않는다.
            _app이 truthy이면 다음 연결을 수행한다.
                앱을 거리 모드로 바꾸고 측정 유형을 LineString으로 설정한 뒤 라벨 그룹을 주석 장면에 연결한다.
                클릭과 더블클릭에 각각 현재 공개 메서드를 인스턴스에 바인딩하고 새 UUID를 등록 이름으로 지정하여 반환한 키를 저장한다.
                우클릭 누름·놓음과 Esc를 고유 키로 연결하고 문서 mousemove에 저장된 이동 함수를 capture=false로 등록한다.

    override deactive() -> void
        의존: U3dApp — 소유 입력 해제; 함수: {unkey()}; Web API — 이동 해제; 함수: {document.removeEventListener()}
        동작: 비활성이면 종료한다. 활성 상태를 false로 바꾸고 보조 입력·자신의 임시 선택 강조를 해제한다.
            앱이 없으면 종료한다. 앱이 있으면 자신의 클릭·더블클릭 키와 문서 이동 함수를 해제하고 키를 undefined로 초기화한다.
            현재 입력을 종료하며 소비자가 등록한 분석 이벤트 구독은 유지한다.

    override clear() -> void
        의존:
            UAnaly — 라벨 그룹 정리·활성 여부·앱과 화면 갱신; 함수: {clear(), isActive(), update()}; 속성 읽기: {_app}
            U3dApp — 주석 장면 조회; 함수: {getSceneComment()}
            UScene — 활성 측정의 빈 라벨 그룹 재연결; 함수: {add()}
            defined — 앱 존재 판정; 함수: {defined()}
        동작:
            부모 clear를 먼저 실행하고 빈 경우를 포함해 라벨 그룹을 장면에서 분리한다.
            해제한 안내 라벨의 helperPoi 참조를 undefined로 바꾸고 이동 상태를 false로 초기화하여 다음 클릭에 새 안내 끝점을 추가하도록 한다.
            _app이 null·undefined가 아니면 편집 중 피처와 이 분석이 확정했던 피처를 제거한다.
            앱이 있고 활성 상태이면 주석 장면을 조회하여 null·undefined가 아닌 장면에 빈 라벨 그룹을 다시 연결한다.
            화면 갱신을 요청하며 활성 상태·입력 이벤트·이벤트 키는 유지한다.

    getDistanceFromCoordinate(point1?: GeoPosition | null, point2?: GeoPosition | null) -> number | undefined
        인터페이스: point1·point2는 x=경도, y=위도, z=높이인 위경도 좌표계(EPSG:4326)의 좌표이며 반환은 두 점 거리(m)다.
        의존:
            defined — 입력 존재 판정; 함수: {defined()}
            UAnaly — 실행 인자 참조; 속성 읽기: {_drawArg}
            UDrawArg — 위경도 좌표 변환; 함수: {getGeographicToWorld()}
            UMathEngine — 두 월드 좌표의 실제 거리; 정적 함수: {getMeterDistanceByGooglePoints()}
        동작:
            어느 한 점이 null·undefined이거나 실행 인자가 falsy이면 undefined를 반환한다.
            첫 번째 점 다음 두 번째 점 순서로 x·y·z를 읽어 월드 좌표(EPSG:3857)로 변환한다.
            변환한 두 좌표의 미터 거리를 반환하며 입력 좌표·측정점·라벨은 변경하지 않는다.

    drawDistance(coordList: Array<GeoPosition | UGPoint>) -> void
        인터페이스: coordList는 순서대로 연결할 위경도 좌표계(EPSG:4326)의 목록이다.
        의존:
            UAnaly — 앱·실행 인자와 화면 갱신; 함수: {update()}; 속성 읽기: {_app, _drawArg}
            UGPoint — 일반 좌표 입력을 측정점으로 변환; 생성자: {new UGPoint()}
            UDrawArg — 측정점 추가; 함수: {addMeasurePoint()}
            U3dApp — 측정 레이어·표출 위치와 장면; 함수: {getMeasureLayer(), geographicToVector3(), getSceneComment()}
            UScene — 라벨 그룹 연결; 함수: {add()}
        동작:
            앱 또는 실행 인자가 falsy이거나 앱의 측정 레이어가 falsy이면 점·라벨·피처를 변경하지 않고 종료한다.
            각 좌표의 isGPoint·isVector3가 모두 truthy이면 원본을 쓰고 그 밖에는 x·y·z로 새 UGPoint를 만든다.
            각 점을 측정에 추가한 다음 월드 좌표(EPSG:3857)로 변환하여 고정 라벨을 추가한다.
            빈 목록이어도 라벨 그룹을 주석 장면에 연결하고 편집 중 피처를 확정한 뒤 화면 갱신을 요청한다.
            기존 측정점을 지우거나 측정 유형을 변경하지 않는다.

    onClick(e: U3dMouseEvent) -> void
        중복 종료점: 입력 중 마지막 고정 점과 같은 월드 위치의 우클릭은 점·고정 라벨을 추가하지 않는다. 다른 위치의 우클릭 점 추가와 연속 우클릭 종료 판정은 유지한다.
        의존:
            UAnaly — 실행 인자·앱과 교차 조회; 함수: {intersectTerrain()}; 속성 읽기: {_drawArg, _app}
            U3dApp — 측정 레이어 조회; 함수: {getMeasureLayer()}
            defined — 교차점 존재 판정; 함수: {defined()}
            UDEF — 디버그 출력 여부; 속성 읽기: {debug}
            UDrawArg — 교차점의 위경도 변환·측정점 추가; 함수: {getWorldToGeographic(), addMeasurePoint()}
            Web API — 미적중 알림; 함수: {console.info()}
        동작:
            진행 중인 native 더블클릭의 두 번째 클릭은 생략한다. 입력 중이 아니면 확정 도형 선택을 먼저 시도하고 적중하면 새 입력을 시작하지 않는다.
            실행 인자 참조를 확보하고 교차 조회를 실행한 다음 실행 인자가 falsy이면 종료한다.
            교차점이 null·undefined이면 debug일 때 'picking is null'을 출력하고 종료한다. x·y·z 중 유한수가 아닌 값이 있어도 점·라벨·이동 상태를 변경하지 않고 종료한다.
            앱이 연결되어 있으나 측정 레이어가 falsy이면 점·라벨·이동 상태를 변경하지 않고 종료한다.
            _drawArg가 truthy이면 교차점을 위경도 좌표계(EPSG:4326)로 변환한다. 변환 결과가 없거나 x·y·z 중 유한수가 아닌 값이 있으면 기존 상태를 보존하고 종료한다. 유효한 첫 좌표는 실행 인자로 추가한다. 진행 중이면 이전 안내 점을 클릭 위치에 고정하고 새 안내 점을 한 번의 갱신으로 추가한 뒤 고정 라벨을 추가한다.
            이동 상태가 false이면 같은 좌표 객체를 안내 끝점으로 한 번 더 추가하고 이동 상태를 true로 바꾼다.

    #onMouseMove(e: MouseEvent) -> void
        의존:
            UAnaly — 활성 여부·앱과 교차 조회; 함수: {isActive(), intersectTerrain()}; 속성 읽기: {_app}
            U3dApp — 측정 레이어·지도 캔버스 조회; 함수: {getMeasureLayer(), getRenderer()}
            U3dShaderMeasureLayer — 안내 끝점 상태·갱신; 속성 읽기: {_measureVectors}; 함수: {updateLastPosition()}
            U3dMouseEvent — 화면 좌표 정규화; 정적 함수: {computeNormalize()}
            defined — 교차점 존재 판정; 함수: {defined()}
            UDEF — 디버그 출력 여부; 속성 읽기: {debug}
            Web API — 미적중 알림; 함수: {console.info()}
        동작:
            비활성 상태이거나 이동 상태가 false이거나 앱이 falsy이면 종료한다.
            측정 레이어가 falsy이거나 _measureVectors.length가 0이면 교차 조회·끝점·라벨 갱신 없이 종료한다.
            이벤트 대상이 현재 렌더러의 지도 캔버스가 아니면 종료한다. 마우스를 정규화하고 두 값이 유한수이며 [-1, 1] 안일 때만 normalizedX·normalizedY를 가진 객체로 교차 조회한다.
            교차점이 null·undefined이면 debug일 때 'mouse target is null'을 출력하고 종료한다. x·y·z 중 유한수가 아닌 값이 있으면 기존 측정과 안내 라벨을 보존하고 종료한다.
            앞선 활성·안내 상태와 측정점 조건을 통과하고 _app이 truthy이면 마지막 점을 교차점으로 갱신하고 반환한 피처가 있을 때만 안내 라벨을 갱신한다. 좌표 변환 실패로 마지막 점 갱신이 생략되면 안내 라벨도 보존한다.

    onDblClick() -> void
        동작: 현재 측정의 종료 처리를 실행하며 활성 상태는 유지한다.

    getFeatures() -> Array<UMeasureFeature>
        동작: 이 분석의 확정 피처 목록을 새 배열로 반환한다. 피처 자체는 원본 참조다.

    override _forgetMeasureFeature(feature: UMeasureFeature) -> void
        동작: 부모에게 해당 피처의 라벨 정리를 위임한 뒤 자신의 확정 목록에서 제거한다.

    drawStop() -> void
        의존: U3dShaderMeasureLayer — 편집 상태와 안내 점 정리; 함수: {getMeasureVectors(), clearDrawFeature(), cancelLastPosition()}
        동작: 레이어가 없거나 입력 중이 아니면 종료한다. 안내 점 하나를 뺀 고정 점 수를 구하고 이동 안내를 false로 바꾼다.
            고정 점이 2개 미만이면 현재 임시 도형과 현재 라벨만 제거한다. 화면 갱신과 안내 라벨 정리 후 feature·type이 undefined이고 value가 0인 measureend를 전달한다.
            충분하면 안내 점을 제거하고 피처를 확정한다.
            안내 라벨을 해제하고 helperPoi를 undefined로 한다. 화면 갱신을 요청한다.

    drawTextLabel(point3d: Vector3, isHelper: boolean = false) -> void
        인터페이스: point3d는 월드 좌표(EPSG:3857)의 라벨 위치이며 isHelper는 안내 라벨 갱신 여부다.
        의존:
            UAnaly — 실행 인자·앱 참조; 속성 읽기: {_drawArg, _app}
            U3dApp — 측정 레이어 조회; 함수: {getMeasureLayer()}
            UDrawArg — 누적 길이 조회; 함수: {getMeasureLength()}
            UCssBilboard — 안내 라벨 갱신; 함수: {setLabel(), setPosition()}
            UGroup — 생성 라벨 연결; 함수: {add()}
        동작:
            실행 인자가 falsy이면 종료한다.
            앱이 연결되어 있으나 측정 레이어가 falsy이면 누적 길이를 조회하거나 라벨을 생성·갱신하지 않고 종료한다.
            누적 길이를 String·parseFloat로 변환한 뒤 toFixed(0)으로 소수 없이 표시하고 'm'을 붙인다.
            _drawArg가 truthy이면 다음 라벨 표시를 수행한다.
                isHelper가 truthy이고 helperPoi가 truthy이면 문자 다음 위치 순으로 기존 라벨을 갱신한다.
                isHelper가 truthy이고 helperPoi가 falsy이면 다음 생성을 수행한다.
                    생성한 원본 참조를 helperPoi에 저장한 뒤 그룹에 추가한다.
                isHelper가 falsy이면 다음 생성을 수행한다.
                    생성한 원본 참조를 그룹에 추가하고 helperPoi는 바꾸지 않는다.

    #clearMeasureFeature() -> void
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp — 저장 피처 제거; 함수: {removeMeasureFeature()}
        동작:
            편집 중 피처를 먼저 확정한 뒤 앱이 falsy이면 종료한다.
            저장 목록을 인덱스 순으로 읽어 각 피처를 앱에서 제거하고 정상 완료 뒤 목록을 새 빈 배열로 교체한다.

    #commitFeature() -> void
        의존: U3dApp — 편집 피처 확정; 함수: {commitMeasurePoint()}
        동작: 앱이 없으면 종료한다. 앱의 확정 반환이 false·null·undefined이면 보관하지 않는다.
            유효한 피처를 확정 목록에 추가하고 현재 라벨 목록의 소유권을 연결한 뒤 measureend를 전달한다.

UAnalyDistanceCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string = 'Distance'
            분석 이름이며 undefined에만 'Distance'를 적용한다.
        type?: string
            상속 타입이 제공하지만 이 생성자는 부모에 옵션을 전달하지 않아 적용되지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
앱 연결은 상속한 setApp으로 수행하며 생성자에 앱을 전달하는 계약은 없다.
외부 호출·변환·라벨 생성·해제에서 발생한 예외는 잡지 않고 전달하며 앞서 반영한 상태를 되돌리지 않는다.
거리 표시는 편집 중인 측정 피처의 누적 길이를 사용하며 이 분석만의 별도 거리 저장소를 만들지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
