# UAnalyHeight 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UAnalyHeight`는 사용자가 클릭한 위치의 높이·고도를 측정해 POI로 표출하고, 화면 전체에 고도별 색상 범례를 적용하는 `HeightPass` 후처리를 제어하는 분석 객체다.

### 1.2 책임 범위

- 클릭 이벤트로 모델·지형 높이를 측정하고 높이 텍스트 POI를 관리한다.
- 사용자 범례 스타일(`Record<고도, 색상>`)을 검증·보관하고 HeightPass의 스타일 uniform과 DataTexture로 변환한다.
- 높이 색상 가시화(`isApply`)와 HEIGHT 패스 활성화를 제어한다.
- 고도 후처리 제외 목록(setExceptObjects 등)을 소유·관리하고 HeightPass에 전달한다.
- 책임 경계: 실제 합성 렌더와 제외 집합의 하위 펼침은 `HeightPass`가, 등고선(`isTopo`) 상태는 등고선 분석이 담당한다.

### 1.3 주요 동작 방식

클릭 측정은 `active()`가 등록한 click callback이 모델 우선, 지형 fallback으로 교차 높이를 구해 POI를 만든다. 범례는 `setUserStyle()`이 저장한 스타일을 `setHeightVisible(true)` 시점에 DataTexture로 변환해 HeightPass uniform에 기록하고 패스를 활성화한다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp.activeAnalysis('Height')`가 이 분석 객체를 생성·활성화한다.
- `HeightPass`의 `uniforms`(isApply, styleMode, styleCount, userStyleData)에 렌더러의 패스 인스턴스를 통해 직접 기록한다.
- 등고선 분석이 같은 HEIGHT 패스의 `isTopo` uniform을 공유한다.

## 2. 요구사항과 품질 기준

```spec
- 높이 색상 가시화(setHeightVisible)는 클릭 측정 활성 상태(active/deactive)와 독립적으로 제어되어야 한다.
- 스타일 항목 수는 MAX_STYLE_ENTRIES를 초과할 수 없고 mode는 band 또는 mix만 허용한다.
- 저장된 스타일은 입력 객체의 복사본이며 이후 호출자가 원본을 수정해도 적용 스타일이 바뀌어서는 안 된다.
- 범례를 끌 때 등고선(isTopo)이 켜져 있으면 공유 HEIGHT 패스를 비활성화해서는 안 된다.
- 제외 목록에 등록된 대상은 범례 색상과 등고선이 적용되지 않고 본연의 색상으로 표시되어야 한다. Object3D는 하위 전체가, 컴포넌트 포지션은 그 컴포넌트만(일반 메쉬 타입은 복제 형상, 인스턴스 타입은 공유 InstancedMesh 중 해당 인스턴스만) 제외되어야 한다.
- 패스가 생성되기 전에 등록된 제외 목록도 setHeightVisible(true) 시점에 패스로 전달되어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
defaultStyle: Record<string, string>
    band 모드와 0~600 구간 5단계 색상으로 이루어진 기본 범례 스타일이며 생성자와 스타일 미설정 가시화에 사용한다.

MAX_STYLE_ENTRIES: number = 256
    setUserStyle()이 허용하는 최대 숫자 키 항목 수의 모듈 원본 값이다.

isExceptTarget(target: any) -> boolean
    역할: 고도 후처리 제외 대상으로 허용하는 값인지 판정하는 모듈 함수다.
    동작: isObject3D가 true인 객체이거나, getObject와 getInstancedId가 모두 함수인 컴포넌트 포지션 계약 객체이면 true를 반환한다.

UAnalyHeightCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            분석 타입 이름이며 생략하면 'Height'를 사용한다.

UAnalyHeightCO extends UAnalyCO 부분 타입 명세
    UAnalyCO 전체 필드에 UAnalyHeightCO_Content를 합성한 생성자 옵션 타입이다.

UAnalyHeight extends UAnaly 클래스 정의
    의존: UAnaly — 분석 공통 상태(_app, _isActive)와 활성·비활성·정리·교차 조회 제공; 상속: {UAnaly}

    static MAX_STYLE_ENTRIES: number = 256
        모듈 상수를 공개한 최대 범례 스타일 항목 수다.

    name: string
        분석 이름이며 생성 옵션이 없으면 'Height'다.

    _clickId: string | null | undefined
        등록된 클릭 이벤트 ID이며 미등록이면 undefined다.

    _dblClickId: string | undefined
        더블클릭 이벤트 ID 예약 필드이며 현재 등록 경로가 없다.

    _poiGroup: UGroup
        측정 결과 높이 POI를 담는 그룹이다.

    _style: Record<string, string> | undefined
        저장된 사용자 범례 스타일 복사본이다.

    _styleDirty: boolean
        스타일 변경 후 uniform 반영 전임을 나타내는 플래그다.

    #exceptObjects: Set<Object3D | U3dComponentPosition>
        고도 후처리 제외 대상 루트 집합이며 HeightPass와 참조로 공유된다.

    _app: U3dApp | undefined
        UAnaly가 선언·연결하는 앱 참조이며 이 클래스는 읽기만 한다.

    _isActive: boolean
        UAnaly가 관리하는 클릭 측정 활성 상태이며 이 클래스는 읽기만 한다.

    constructor(opt?: UAnalyHeightCO)
        의존:
            defaultValue — 이름 기본값 대체; 함수: {defaultValue()}
            UGroup — POI 그룹 생성; 생성자: {new UGroup()}
        동작:
            상위 분석 상태를 초기화하고 이름을 옵션 또는 'Height'로 정한다.
            클릭 이벤트 ID를 미등록 상태로, POI 그룹을 빈 그룹으로 준비한다.
            기본 범례 스타일을 저장한다.

    override active() -> void
        역할: 클릭 측정 모드를 켜고 높이 POI 그룹을 주석 장면에 붙인다.
        처리 기준: 앱이 연결되지 않았으면 상위 활성화만 수행한다.
        의존:
            UAnaly — 상위 활성화와 앱 참조; 함수: {active()}; 속성 읽기: {_app}
            U3dApp(_app) — 이벤트 등록·해제와 모드 전환; 함수: {on(), unkey()}; 속성 쓰기: {_mode}; 속성 읽기: {_sceneComment}
            UDEF — 높이 측정 모드 상수; 상수: {APP_MODE._HEIGHT}
        동작:
            상위 분석을 활성화한다.
            기존 클릭 등록이 있으면 해제하고 앱 모드를 높이 측정으로 바꾼다.
            클릭 callback을 등록하고 POI 그룹을 주석 장면에 추가한다.

    override deactive() -> void
        처리 기준: 활성 상태가 아니면 아무것도 하지 않는다.
        의존:
            UAnaly — 상위 비활성화와 상태 읽기; 함수: {deactive()}; 속성 읽기: {_isActive, _app}
            U3dApp(_app) — 클릭 이벤트 해제; 함수: {unkey()}
        동작:
            상위 분석을 비활성화한다.
            앱이 있으면 등록된 클릭 이벤트를 해제하고 이벤트 ID를 비운다.

    override clear() -> void
        의존:
            UAnaly — 상위 정리와 앱 참조; 함수: {clear()}; 속성 읽기: {_app}
            U3dApp(_app) — 갱신 시각 변경; 함수: {setUpdateDate()}
        동작: 상위 분석 정리를 수행하고 앱이 있으면 갱신 시각을 변경한다.

    drawHeight(val) -> void
        역할: 폐기 예정 별칭이며 setHeightVisible() 사용을 권장한다.
        동작: 입력 값으로 높이 색상 가시화를 설정한다.

    setHeightVisible(visible: boolean) -> boolean
        역할: 화면 전체 고도 색상 범례의 표시 여부를 설정한다.
        인터페이스: 반환은 설정 성공 여부이며 클릭 측정 활성 상태와는 독립적이다.
        처리 기준:
            visible이 boolean이 아니거나 앱이 없으면 false를 반환한다.
            렌더러에서 HEIGHT 패스를 얻지 못하면 오류 코드 8522792를 보고하고 false를 반환한다.
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp(_app) — 렌더러 조회; 함수: {getRenderer()}
            URenderer — 패스 조회와 활성화; 함수: {getPass(), activePass()}
            UDEF — HEIGHT 패스 이름; 상수: {POSTPASS.HEIGHT}
            __GError__ — 패스 부재 오류 보고; 함수: {__GError__()}
        동작:
            패스 uniforms의 isApply에 입력 값을 기록한다.
            끄는 경우 등고선 uniform(isTopo)이 꺼져 있을 때만 HEIGHT 패스를 비활성화하고 true를 반환한다.
            켜는 경우 저장된 스타일이 없으면 기본 스타일을 dirty 상태로 채우고, 스타일 uniform과 패스 생성 전에 등록된 제외 목록을 반영한 뒤 HEIGHT 패스를 활성화하고 true를 반환한다.

    isHeightVisible() -> boolean
        인터페이스: 반환은 현재 HEIGHT 패스에 범례 적용(isApply)이 켜져 있는지 여부다.
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp(_app) — 렌더러 조회; 함수: {getRenderer()}
            URenderer — 패스 조회; 함수: {getPass()}
            UDEF — HEIGHT 패스 이름; 상수: {POSTPASS.HEIGHT}
        동작: 패스 uniforms의 isApply 값을 boolean으로 변환해 반환한다.

    setUserStyle(style: Record<string, string>) -> boolean
        역할: 고도 구간별 색상 범례 스타일을 검증하고 복사해 저장한다.
        인터페이스: style의 mode 키는 "band" 또는 "mix", 숫자 문자열 키는 기준 고도, 값은 rgba()/css 색상 문자열이다.
        처리 기준:
            객체가 아니거나 배열이면 false를 반환한다.
            mode가 band·mix 밖의 값이면 경고 후 false를 반환한다.
            숫자 키 항목이 MAX_STYLE_ENTRIES를 초과하면 경고 후 false를 반환하며 0개는 허용한다.
        의존: U3dMessage — 잘못된 스타일 경고; 정적 함수: {warn()}
        동작: 입력을 얕은 복사로 저장하고 dirty 표시 후 즉시 uniform 반영을 시도하고 true를 반환한다.

    getUserStyle() -> Record<string, string> | undefined
        동작: 저장된 스타일의 얕은 복사본을, 없으면 undefined를 반환한다.

    setExceptObjects(objects: Object3D | U3dComponentPosition | Array<Object3D | U3dComponentPosition>) -> boolean
        역할: 고도 색상 범례와 등고선 후처리에서 제외할 대상 목록을 교체 설정한다.
        인터페이스:
            Object3D는 렌더 시점의 하위 객체 전체가 함께 제외되고, 컴포넌트 포지션은 그 컴포넌트만(인스턴스 타입은 해당 인스턴스만) 제외된다.
            빈 배열은 전체 해제를 뜻하며, 반환은 설정 성공 여부다.
        처리 기준: 항목 중 하나라도 허용 대상이 아니면 목록을 바꾸지 않고 경고 후 false를 반환한다.
        의존: U3dMessage — 잘못된 인수 경고; 정적 함수: {warn()}
        동작:
            모든 항목의 허용 여부를 배열 every 판정 callback으로 확인한다.
            제외 집합을 비우고 입력 대상들로 다시 채운 뒤 패스에 동기화하고 true를 반환한다.

    addExceptObject(object: Object3D | U3dComponentPosition) -> boolean
        처리 기준: 허용 대상이 아니면 경고 후 false를 반환한다.
        의존: U3dMessage — 잘못된 인수 경고; 정적 함수: {warn()}
        동작:
            입력의 허용 여부를 판정한다.
            제외 집합에 대상을 추가하고 패스에 동기화한 뒤 true를 반환한다.

    removeExceptObject(object: Object3D | U3dComponentPosition) -> boolean
        인터페이스: 반환은 목록에 있어 실제로 제거된 경우에만 true다.
        동작: 제외 집합에서 대상을 제거하고 제거된 경우에만 패스에 동기화한다.

    clearExceptObjects() -> void
        처리 기준: 집합이 이미 비어 있으면 아무것도 하지 않는다.
        동작: 제외 집합을 모두 비우고 패스에 동기화한다.

    getExceptObjects() -> Array<Object3D | U3dComponentPosition>
        인터페이스: 반환 배열은 복사본이며 수정해도 실제 목록은 바뀌지 않는다.
        동작: 제외 집합의 항목을 배열로 복사해 반환한다.

    #syncExceptObjects() -> void
        역할: 제외 집합 참조를 HEIGHT 패스에 전달하고 다시 그리기를 요청한다.
        처리 기준: 앱·렌더러·패스가 아직 없으면 전달을 건너뛰며 이후 setHeightVisible(true)에서 다시 동기화된다.
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp(_app) — 렌더러 조회와 갱신 시각 변경; 함수: {getRenderer(), setUpdateDate()}
            URenderer — 패스 조회; 함수: {getPass()}
            HeightPass — 제외 루트 집합 등록; 함수: {_setExceptObjects()}
            UDEF — HEIGHT 패스 이름; 상수: {POSTPASS.HEIGHT}
        동작: 렌더러의 HEIGHT 패스 인스턴스에 제외 집합 참조를 전달하고 앱 갱신 시각을 변경한다.

    #updateStyleUniforms() -> void
        역할: 저장된 스타일을 HEIGHT 패스의 스타일 uniform과 텍스처로 반영한다.
        처리 기준: 앱이 없거나 dirty가 아니면 무동작이고, 패스 uniforms를 얻지 못하면 dirty를 유지한 채 종료한다.
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp(_app) — 렌더러 조회와 갱신 시각 변경; 함수: {getRenderer(), setUpdateDate()}
            URenderer — 패스 조회; 함수: {getPass()}
            DataTexture(previousTexture) — 교체된 이전 스타일 텍스처 처분; 함수: {dispose()}
        동작:
            스타일에서 정렬된 고도·색 항목을 얻는다.
            styleMode uniform에 band이면 1, 아니면 0을 기록한다.
            styleCount uniform에 항목 수를 0개 그대로 포함해 기록한다.
            새 스타일 텍스처를 만들어 userStyleData uniform을 교체하고 이전 텍스처를 처분한다.
            dirty를 해제하고 앱 갱신 시각을 변경한다.

    #createStyleTexture(entries: Array<{height: number, color: string}>) -> DataTexture
        역할: 정렬된 스타일 항목을 GHeightShader의 2행 스타일 텍스처 계약으로 변환한다.
        처리 기준: rgba() 색상은 알파를 분리해 0~1로 clamp하고 알파가 없거나 숫자가 아니면 1을 사용한다.
        의존:
            Color — css 색상 문자열 해석; 생성자: {new THREE.Color()}
            MathUtils — 투명도 clamp; 정적 함수: {clamp()}
            DataTexture — 스타일 텍스처 생성; 생성자: {new THREE.DataTexture()}
            RGBAFormat — 포맷 상수; 상수: {THREE.RGBAFormat}
            FloatType — 픽셀 타입 상수; 상수: {THREE.FloatType}
        동작:
            항목별로 0행에 RGB와 투명도를, 1행 r에 기준 고도를 쌓고 폭(항목 수, 최소 1) 크기로 0 패딩한다.
            Float RGBA DataTexture를 만들어 needsUpdate를 켜고 반환한다.

    #click(e: U3dMouseEvent) -> void
        역할: 클릭 위치의 높이를 측정해 텍스트 POI로 표출한다.
        의존:
            UAnaly — 모델·지형 교차 조회, 앱 참조와 분석 갱신; 함수: {intersectModel(), intersectTerrain(), update()}; 속성 읽기: {_app}
            UMathEngine — EPSG:3857 실축척 환산; 정적 함수: {getRealScaleAtGoogle()}
            U3dBilboard — 높이 텍스트 POI 생성; 정적 함수: {makeBilboard()}
            UGroup(_poiGroup) — POI 보관; 함수: {add()}
            U3dApp(_app) — 장면 갱신 요청과 주석 장면 접근; 함수: {draw(), setUpdateDate()}; 속성 읽기: {_sceneComment}
        동작:
            앱이 없으면 종료한다.
            모델 교차 목록에서 z가 유효한 첫 교차점으로 실축척 환산 높이 텍스트 POI를 만들어 그룹과 주석 장면에 추가한다.
            모델 POI를 만들지 못한 경우에만 지형 교차 높이로 같은 형식의 POI를 만들고, 지형 위치도 없으면 종료한다.
            장면 다시 그리기와 갱신 시각 변경, 분석 update를 요청한다.

    #getStyleEntries() -> Array<{height: number, color: string}>
        동작: 저장된 스타일(없으면 기본 스타일)에서 mode를 제외한 유한 숫자 키를 고도 오름차순 항목으로 변환해 반환한다.

    #getStyleMode() -> string
        동작: 저장된 스타일 mode가 "band"이면 "band", 아니면 "mix"를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
- HEIGHT 패스 uniform 접근은 항상 렌더러의 현재 패스 인스턴스(getPass().instance)를 통해 수행하며, 패스와 이 분석은 uniforms 객체를 공유 상태로 사용한다.
- 스타일 텍스처의 2행 레이아웃(0행 색, 1행 고도)은 GHeightShader의 텍스처 계약과 함께 변경해야 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
