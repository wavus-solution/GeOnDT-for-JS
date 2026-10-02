# UDevToolView 명세

> 상태: 구현 관찰 초안

## 1. 개요

앱 컨테이너 위에 Status, Settings, Debug 탭을 구성하여 실행 상태를 조회하고 앱 설정을 변경한다. 사용자 탭·입력 행·그래프와 주기적 갱신 콜백도 제공한다. `U3dApp.createDevToolView()`에서 생성하며, GUI의 실제 입력 요소와 폴더는 `UGUI`에 위임한다.

## 3. 정규 자연어 수도코드

```spec
UDevToolViewCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        element?: HTMLDivElement
            지정한 요소를 창의 뼈대로 사용한다.
        cssStyle?: UGUICSSStyle
            생략하면 DefaultCssStyle 전체를 사용하며 부분 객체와 기본 객체를 병합하지 않는다.
        width?: number
            UGUI에 전달하는 창 너비이다.
        title?: string = 'Development Tools'
            루트 창 제목이다.
        draggable?: boolean = true
            머리글 드래그 허용 여부이다.

UGUICSSStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        position?: string = 'absolute'
        maxHeight?: string = '88vh'
        top?: string = '25px'
        right?: string = '25px'
        left?: string = ''
        zIndex?: string = '9999999999'
            위 기본값은 cssStyle 객체 전체를 생략할 때 사용한다.

UDevToolPlacement 부분 타입 명세
    이 명세에서 사용하는 필드:
        top, right, bottom, left?: string
            각 방향의 CSS 값이며 빈 문자열은 인라인 값을 해제한다.

Controller_VALUE 타입 정의
    number | string | function | boolean

GUI_Contoller_OPT 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
            표시 이름이자 상태 키의 원본이다.
        value: Controller_VALUE
            숫자·문자열·불리언은 입력 행, 함수는 실행 버튼의 값이다.
        min?: Contoller_MIN_VAULE
            숫자 하한 또는 선택 목록이며 UGUI에 전달한다.
        tabName, folderName?: string
        max, step?: number
        onChange, onFinishChange?: function
            입력 콜백은 생성된 컨트롤러를 this로 받아 변경값을 인자로 받는다.
        listen?: boolean = true
        readOnly?: boolean = false

GUI_DevToolController_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        setTitle: (title: string) -> GUI_DevToolController
            행의 일반 텍스트 도움말을 지정하며 같은 컨트롤러를 반환한다.

GUI_DevToolController 타입 정의
    THREE_GUI_Controller & GUI_DevToolController_Content

GUI_TAB_INFO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
            탭 식별자이며 버튼의 번역된 표시명과 다를 수 있다.
        button: HTMLButtonElement
        panel: HTMLDivElement
        gui?: UGUI
            입력 행이나 폴더가 처음 필요할 때 생성한다.
        state: Record<string, any>
            반환된 탭 정보에서 접근할 수 있는 실제 상태 객체이다.

UDevToolMapControlField 부분 타입 명세
    이 명세에서 사용하는 필드:
        key: keyof FactorOption
        group, label, help: string
        kind?: 'boolean'
        min, max?: number
        integer, degrees?: boolean
        options?: Array<[number, string]>
            엔진 값과 UI 표시명 사이의 대응이다.

GUI_TemplateState 부분 타입 명세
    이 명세에서 사용하는 필드:
        improveTexture?: 'none' | 'low' | 'medium' | 'high' | 'ultra'
        maxProcess, pixelRatio, tileRatio, modelTileRatio, tileUpdateSensitivity?: number
        pixelResolution?: PIXELRE_SOLUTION_OPTION
        postProcess, sunFlare, shadow?: boolean
        postOption?: PostProcessParam
        toneExposure, intensityLight, intensitySunLight, modelUpdateOffset?: number
            정의된 필드만 대응 앱 API에 전달한다.

UDevToolGraphSeriesOpt 부분 타입 명세
    이 명세에서 사용하는 필드:
        traceName: string
        label?: string
        lineColor?: string = '#c792ea'
        lineDash?: Array<number> = [5, 4]

GUI_GRAPH_OPT 부분 타입 명세
    이 명세에서 사용하는 필드:
        tabName, folderName?: string
        upperValue?: number = 60
        lowerValue?: number = 0
        lineColor?: string = '#67d5b5'
        label?: string
        lineDash?: Array<number> = []
        additionalSeries?: Array<UDevToolGraphSeriesOpt> = []
        maxPoints?: number = 120

UDevToolGraphSeriesInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        label, lineColor: string
        getValue: () -> number | string
        history, lineDash: Array<number>

GUI_GRAPH_INFO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        title: string
        wrapper, scaleLabels: HTMLDivElement
        canvas: HTMLCanvasElement
        getValue: () -> any
        upperValue, lowerValue, maxPoints: number
        lineColor: string
        history: Array<number>
        series?: Array<UDevToolGraphSeriesInfo>

GUI_GRAPH_INFO 타입 정의
    GUI_GRAPH_OPT & GUI_GRAPH_INFO_Content

UDevToolView 클래스 정의
    #tabs: Map<string, GUI_TAB_INFO> = 빈 Map
        삽입 순서대로 탭을 보관한다.
    #tabControllerCache: Map<string, Array<THREE_GUI_Controller>> = 빈 Map
        탭별 재귀 컨트롤러 목록이며 추가·제거 경로에서 무효화한다.
    #graphs: Array<GUI_GRAPH_INFO> = 빈 배열
        그래프의 DOM과 값 조회 함수, 측정 이력을 소유한다.
    #updateCallbacks: Set<function> = 빈 Set
        같은 함수 참조는 한 번만 등록한다.
    #initialTemplate: GUI_TemplateState
        생성 시점의 품질 설정이며 refresh로 갱신하지 않는다.
    #initialControlFactors: FactorOption | undefined
        컨트롤러 영역 생성 시 factor의 얕은 복사본이다.
    #refreshFeedbackTimer: number = 0
        갱신 완료 문구를 복원하는 타이머이다.

    constructor(app: U3dApp, opt: UDevToolViewCO = {})
        의존:
            defined — 옵션 존재 여부와 기본값 선택; 함수: {defined()}
            defaultValue — 옵션 존재 여부와 기본값 선택; 함수: {defaultValue()}
            U3dMessage — 로그 기록; 함수: {__GError__()}
            U3dApp — 앱 설정과 실행 상태 연계; 속성 읽기: {_container}
            UGUI — GUI 구성과 조회; 생성자: {new UGUI()}; 속성 읽기: {$children}
            Web API — 화면 요소와 호스트 기능 사용; 함수: {document.createElement()}; 속성 쓰기: {HTMLElement.style, HTMLElement.id}
        동작:
            app이 정의되지 않으면 오류 로그 후 생성자 본문을 종료한다.
            앱과 컨테이너를 보관하고 템플릿 이름을 auto, 표시 여부를 true, RAF 번호를 0으로 둔다.
            현재 품질 설정을 초기 복원 기준으로 저장한다.
            opt.element 또는 새 div를 선택하고 지정 CSS 또는 기본 CSS를 적용하여 id를 UDevToolView로 둔다.
            maxHeight가 정의되면 요소의 높이 제한과 overflow hidden을 지정한다.
            컨테이너가 없으면 요소와 앱 참조가 남은 상태로 종료한다.
            루트 UGUI를 생성한다. 생성 결과가 없으면 오류를 기록하고 종료한다.
            갱신 도구막대와 탭 컨테이너를 만든다.
            Status, Settings, Debug 탭을 순서대로 추가한다.
            설정 입력과 상태 표시를 구성한 뒤 Status를 선택한다.

    onUpdate(callback: (view: UDevToolView) -> void) -> () -> void
        동작:
            callback이 함수가 아니면 Error를 던진다.
            콜백을 Set에 추가하고 갱신 루프 시작을 요청한다.
            해당 콜백만 해제하는 함수를 반환한다.

    offUpdate(callback?: (view: UDevToolView) -> void) -> void
        의존: defined — null과 undefined 판정; 함수: {defined()}
        동작:
            callback이 정의되지 않으면 전체를, 아니면 같은 함수 참조만 Set에서 지운다.
            상태 갱신 함수가 없고 콜백도 없으면 루프를 중단한다.

    getWidth() -> number | undefined
        의존: UGUI — GUI 구성과 조회; 함수: {getWidth()}
        동작: 루트 GUI가 있으면 너비를 반환하고 없으면 undefined를 반환한다.

    setWidth(width: number) -> void
        의존:
            defined — 루트 GUI 존재 판정; 함수: {defined()}
            UGUI — GUI 구성과 조회; 함수: {setWidth()}
        동작: 루트 GUI가 없으면 종료하고, 있으면 루트와 이미 생성된 탭 GUI들의 너비를 변경한다.

    getMaxHeight() -> string | undefined
        의존: UGUI — GUI 구성과 조회; 함수: {getMaxHeight()}
        동작: 루트 GUI의 최대 높이를 반환하고 없으면 undefined를 반환한다.

    setMaxHeight(maxHeight: number | string) -> void
        의존:
            defined — 루트 GUI 존재 판정; 함수: {defined()}
            UGUI — GUI 구성과 조회; 함수: {setMaxHeight()}
        동작: 루트 GUI가 있으면 최대 높이를 전달한다.

    setPlacement(placement: UDevToolPlacement) -> void
        의존:
            defined — 입력과 방향 값의 존재 판정; 함수: {defined()}
            Web API — 화면 요소와 호스트 기능 사용; 속성 쓰기: {HTMLElement.style}
        동작: 요소나 placement가 없으면 종료하고, 정의된 top·right·bottom·left만 덮어쓴다. 빈 문자열도 적용한다.

    getController(name: string) -> THREE_GUI_Controller | undefined
        의존:
            defined — 이름 존재 판정; 함수: {defined()}
            UGUI — GUI 구성과 조회; 함수: {getController()}
        동작: name이 정의되지 않으면 undefined를 반환하고, 탭 삽입 순서로 조회하여 처음 찾은 컨트롤러를 반환한다. 없으면 undefined이다.

    getControllersInFolder(folderName: string, tabName?: string) -> Array<THREE_GUI_Controller>
        의존:
            defined — 이름과 탭 지정 여부 판정; 함수: {defined()}
            UGUI — GUI 구성과 조회; 함수: {getControllersInFolder()}
        동작:
            folderName이 정의되지 않으면 빈 배열을 반환한다.
            tabName이 정의되면 해당 탭의 폴더 목록 또는 빈 배열을 반환한다.
            tabName이 없으면 모든 탭에서 조회한 목록을 합쳐 반환한다.

    getControllersInTab(tabName: string) -> Array<THREE_GUI_Controller>
        의존: defined — 탭 이름 존재 판정; 함수: {defined()}
        동작:
            tabName이 정의되지 않으면 빈 배열을 반환한다.
            해당 탭의 재귀 컨트롤러 목록을 새 배열로 복사하여 반환한다.

    removeController(name: string, tabName?: string) -> boolean
        의존:
            defined — 입력 존재 판정; 함수: {defined()}
            UGUI — GUI 구성과 조회; 함수: {removeController()}
        동작:
            name이 정의되지 않으면 false를 반환한다.
            tabName을 지정했으면 해당 탭에서 제거하고, 아니면 탭 순서대로 처음 성공한 제거에서 멈춘다.
            제거 성공 시 그 탭의 컨트롤러 캐시를 지우고 true를 반환하며, 못 찾으면 false를 반환한다.

    removeFolder(name: string, tabName?: string) -> boolean
        의존:
            defined — 입력 존재 판정; 함수: {defined()}
            UGUI — GUI 구성과 조회; 함수: {removeFolder()}
        동작:
            name이 정의되지 않으면 false를 반환한다.
            지정 탭 또는 전체 탭 순서에서 처음 제거되는 폴더를 찾는다.
            제거 성공 시 같은 탭·폴더 이름의 그래프를 제거하고 컨트롤러 캐시를 지운 뒤 true를 반환한다.
            제거된 폴더가 없으면 false를 반환한다.

    show() -> void
        의존: UGUI — GUI 구성과 조회; 함수: {show()}
        동작: 표시 여부를 true로 두고 루트 GUI를 보인 뒤 루프 시작을 요청한다.

    hide() -> void
        의존: UGUI — GUI 구성과 조회; 함수: {hide()}
        동작: 표시 여부를 false로 두고 루트 GUI를 숨긴 뒤 루프를 중단한다.

    hasTab(name: string) -> boolean
        동작: #tabs에 해당 이름이 있는지 반환한다.

    addTab(name: string) -> GUI_TAB_INFO | undefined
        의존:
            defined — 입력 존재 판정; 함수: {defined()}
            U3dMessage — 로그 기록; 함수: {__GInfo__()}
            Web API — 화면 요소와 호스트 기능 사용; 함수: {document.createElement(), HTMLElement.appendChild(), HTMLElement.addEventListener()}
        동작:
            name이 정의되지 않거나 문자열 변환 후 trim 결과가 비면 undefined를 반환한다.
            실제 키는 trim하지 않은 문자열 변환값으로 사용한다.
            같은 키가 있으면 안내 로그를 남기고 기존 탭을 선택하여 실제 탭 정보 객체를 반환한다.
            새 버튼과 숨긴 패널을 만들고 버튼 클릭에 탭 선택을 연결한다.
            빈 state와 아직 없는 gui를 가진 탭 정보를 Map에 저장한다.
            새 탭을 선택하고 탭 정보 원본을 반환한다.

    removeTab(name: string) -> void
        의존:
            UGUI — GUI 구성과 조회; 함수: {destroy()}
            Web API — 화면 요소와 호스트 기능 사용; 함수: {HTMLElement.remove()}
        동작:
            이름의 탭이 없으면 종료한다.
            Status 제거 시 상태 갱신 함수를 비우며 사용자 콜백도 없으면 루프를 멈춘다.
            탭의 그래프와 컨트롤러 캐시를 제거한다.
            탭 GUI를 파괴하고 버튼·패널을 제거한 뒤 Map에서 지운다.
            활성 탭을 제거했으면 활성 이름을 비우고 남은 첫 탭이 있을 때 선택한다.

    addFolder(name: string, tabName: string = this.#activeTabName) -> THREE_GUI | undefined
        의존:
            defined — 폴더 이름 존재 판정; 함수: {defined()}
            UGUI — GUI 구성과 조회; 함수: {addFolder()}
        동작:
            name이 정의되지 않으면 undefined를 반환한다.
            탭 정보와 지연 생성 GUI를 구한다.
            GUI가 있으면 문자열로 변환한 name으로 폴더를 추가한다.
            폴더가 생기면 해당 탭의 캐시를 무효화하고 생성 결과를 반환한다.

    addController(itemOpt: GUI_Contoller_OPT) -> GUI_DevToolController | undefined
        의존:
            defined — 옵션 존재 여부와 탭 기본값 선택; 함수: {defined()}
            defaultValue — 옵션 존재 여부와 탭 기본값 선택; 함수: {defaultValue()}
            UGUI — GUI 구성과 조회; 함수: {addFolder(), addController()}
            THREE_GUI_Controller — 입력 행의 표시와 콜백 연결; 함수: {onChange(), onFinishChange()}; 속성 읽기: {_name, domElement}
            U3dMessage — 로그 기록; 함수: {__GSError__(), __GInfo__(), __GError__()}
            Web API — 화면 요소와 호스트 기능 사용; 속성 쓰기: {HTMLElement.title}
        동작:
            옵션 객체·문자열 name·정의된 value 조건이 아니면 오류 로그 후 undefined를 반환한다.
            지정 탭 또는 활성 탭을 조회하고 GUI를 구하며 둘 중 하나가 없으면 undefined를 반환한다.
            folderName이 정의되면 문자열로 변환해 폴더를 만들고, 아니면 탭 GUI를 부모로 쓴다. 부모가 없으면 오류 로그 후 종료한다.
            name의 모든 공백을 제거하고 소문자로 바꾼 키에 value를 저장한다. 같은 상태 키는 기존 값도 덮어쓴다.
            옵션에 부모·state·property를 추가하여 UGUI 입력 행을 만든다. 실패하면 undefined를 반환한다.
            함수인 onChange·onFinishChange만 래핑하여 컨트롤러를 this로 호출하고, 성공 반환 후 변경 위치와 값을 기록하며 콜백 반환값을 돌려준다.
            setTitle을 컨트롤러에 붙인다. 문자열이면 DOM title을 대입하고, 아니면 오류만 기록하며 두 경우 모두 같은 컨트롤러를 반환한다.
            탭의 캐시를 무효화하고 컨트롤러를 반환한다.

    addGraph(title: string, traceName: string, opt: GUI_GRAPH_OPT = {}) -> HTMLCanvasElement | undefined
        의존:
            defined — 선택 옵션과 기본 탭 판정; 함수: {defined()}
            defaultValue — 선택 옵션과 기본 탭 판정; 함수: {defaultValue()}
            Web API — 화면 요소와 호스트 기능 사용; 함수: {document.createElement(), HTMLElement.appendChild(), HTMLElement.append(), HTMLElement.replaceChildren()}; 속성 쓰기: {HTMLElement.style, HTMLElement.textContent, HTMLCanvasElement.width, HTMLCanvasElement.height}
        동작:
            지정 탭 또는 활성 탭의 GUI를 구하고 없으면 undefined를 반환한다.
            additionalSeries가 undefined가 아닌 배열 외 값이면 TypeError를 던진다.
            기본 선과 추가 선을 순서대로 검증한다. 선이 객체가 아니거나 배열이면, 정의된 label이 문자열이 아니면 TypeError를 던진다.
            lineDash 생략 시 기본 선은 빈 배열, 추가 선은 [5, 4]를 쓴다. 배열이 아니거나 원소가 유한한 0 이상 숫자가 아니면 TypeError를 던진다.
            각 선의 실제 컨트롤러 값 조회 함수를 만든다. 어느 하나라도 만들지 못하면 DOM을 붙이지 않고 종료한다.
            label은 nullish이면 traceName, lineColor는 falsy이면 기본 선 #67d5b5·추가 선 #c792ea를 사용하고 점선 배열은 복사한다.
            folderName이 정의되면 폴더를 구하고, 그 자식 영역 또는 탭 자식 영역을 호스트로 쓴다. 호스트가 없으면 종료한다.
            정의된 상한·하한은 안전한 수로 변환하고, 생략하면 60·0을 쓴다.
            280×96 canvas와 제목·눈금 DOM을 만들며, 선이 둘 이상이면 각 이름·색·점선 여부의 범례를 추가한다.
            maxPoints는 안전한 수로 변환한 뒤 falsy이면 120으로 대체하고 1 이상으로 제한한다. 정수화하지 않는다.
            호스트에 DOM을 추가하고 원본 선의 조회 함수·이력, 추가 선·눈금·범위를 #graphs에 저장한 뒤 canvas를 반환한다.

    removeGraph(title: string) -> void
        의존: Web API — 화면 요소와 호스트 기능 사용; 함수: {HTMLElement.remove()}
        동작: #graphs를 뒤에서 순회하며 같은 title의 모든 wrapper를 제거하고 항목을 배열에서 지운다.

    removeAllGraph() -> void
        의존: Web API — 화면 요소와 호스트 기능 사용; 함수: {HTMLElement.remove()}
        동작: 모든 그래프 wrapper를 제거하고 #graphs를 새 빈 배열로 바꾼다.

    dispose() -> void
        의존:
            Web API — 화면 요소와 호스트 기능 사용; 함수: {window.clearTimeout()}
            UGUI — GUI 구성과 조회; 함수: {destroy()}
        동작:
            갱신 피드백 타이머를 취소하고 번호를 0으로 둔다. 루트 GUI가 없으면 여기서 종료한다.
            루프를 중단하고 상태 갱신 함수와 사용자 콜백을 지운다.
            탭 이름 복사본을 순회하며 각 탭을 제거하고 Map을 비운다.
            루트 GUI를 파괴하고 GUI·요소·컨테이너·앱·초기 factor 참조를 undefined로 둔다.

    #isControllerOption(opt: GUI_Contoller_OPT) -> boolean
        의존: defined — 옵션과 value 존재 판정; 함수: {defined()}
        동작: opt가 정의된 객체이고 name이 문자열이며 value가 null·undefined가 아닌 경우에만 true를 반환한다.

    #initializeTabs() -> void
        의존:
            defined — 루트 GUI 존재 판정; 함수: {defined()}
            Web API — 화면 요소와 호스트 기능 사용; 함수: {document.createElement(), HTMLElement.addEventListener(), HTMLElement.setAttribute(), HTMLElement.appendChild(), window.clearTimeout(), window.setTimeout()}
            UGUI — GUI 구성과 조회; 속성 읽기: {$children}
        동작:
            루트 GUI가 없으면 종료한다.
            갱신 버튼과 탭 버튼·패널 컨테이너를 만들어 루트 자식 영역에 추가한다.
            갱신 버튼을 누르면 표시값을 갱신한다.
            기존 피드백 타이머를 취소한 후 완료 문구·색을 보여 주고, 1500ms 후 원래 문구·색으로 돌리는 타이머를 저장한다.

    #selectTab(name: string) -> void
        의존: Web API — 화면 요소와 호스트 기능 사용; 속성 쓰기: {HTMLElement.style}
        동작: 활성 이름을 저장하고 모든 탭을 순회하여 해당 이름만 패널을 보이며 버튼 색도 선택 상태로 바꾼다.

    #getTab(tabName: string = 'Settings') -> GUI_TAB_INFO | undefined
        동작: #tabs의 tabName 항목을 반환한다.

    #invalidateTabControllerCache(tabName?: string) -> void
        의존: defined — 탭 이름 존재 판정; 함수: {defined()}
        동작: tabName이 정의되었을 때 해당 탭의 캐시 항목만 삭제한다.

    #getTabControllers(tabName: string) -> Array<THREE_GUI_Controller>
        의존: UGUI — GUI 구성과 조회; 함수: {controllersRecursive()}
        동작:
            캐시가 있으면 그 배열을 그대로 반환한다.
            없으면 해당 탭 GUI의 재귀 컨트롤러 배열 또는 빈 배열을 캐시에 저장하고 반환한다.

    #getTabGui(tab: GUI_TAB_INFO | undefined) -> UGUI | undefined
        의존: UGUI — GUI 구성과 조회; 생성자: {new UGUI()}
        동작:
            tab이 없으면 undefined, 기존 tab.gui가 있으면 그 객체를 반환한다.
            컨테이너가 없으면 undefined를 반환한다.
            현재 너비를 읽어 패널을 wrapper로 하는 제목 없는 투명 UGUI를 생성하고 tab.gui에 저장하여 반환한다.

    #buildStatus() -> void
        의존:
            defined — 앱·폴더 존재 판정; 함수: {defined()}
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getUpdateFps(), getDrawFps(), getProcessManager(), getLoadingRate(), getLoadingNow(), getLoadingTotal(), getTerrainLayer(), getInstanceImageLayers(), getInstanceModelLayers()}; 속성 읽기: {_rStats, _uStats, _uwStats, _ulStats, _dStats, _renderer, _drawArg, _imageProcess, _heightProcess, _modelProcess, _modelWorkProcesses}
            UProcessManager — 작업량과 가시화 지연 조회; 함수: {getAdaptiveProcessState(), getVisualizationLatencyState()}
            UDEF.resourceManager — 자원 수와 메모리 조회; 함수: {getGeometryCount(), getTextureCount(), getMaterialCount(), getListenEventCount(), getRenderObjectAmount(), estimateGPUMemory(), getResourceSize()}
            UInstancedMesh — 인스턴스 수 조회; 상수: {ALL_INSTANCES_COUNT, VISIBLE_INSTANCES_COUNT}
            THREE_GUI — 폴더와 입력 구성; 함수: {add(), close()}
            THREE_GUI_Controller — 입력 행의 표시와 콜백 연결; 함수: {name(), disable(), hide(), updateDisplay()}
            Web API — 화면 요소와 호스트 기능 사용; 속성 읽기: {performance.memory}; 속성 쓰기: {HTMLCanvasElement.style}; 함수: {HTMLElement.replaceChildren(), document.createElement()}
        동작:
            앱이 없거나 상태 갱신 함수가 이미 있으면 종료한다.
            Frame·Queue·Draw·Memory 폴더에 읽기 전용 수치 행을 만들고, Frame 외 폴더를 닫는다.
            응답 FPS·동시 작업 수·가시화 지연·Heap와 GPU 합계 그래프를 만든다. 지연 그래프는 최초 완료 표본 전까지 숨긴다.
            상태 갱신 함수를 등록하여 앱 FPS와 작업 상한·지연·로딩·그리기 수치 및 자원 수치를 읽는다.
            지연 상태가 running이고 lastMs가 null이 아니면 완료 표본으로 본다. 완료 표본이 처음 유효해질 때 이력을 비우고 지연 그래프를 보인다.
            지연 그래프 상한은 기존 상한과 lastMs를 100ms 단위로 올린 값 중 큰 값으로 바꾼다.
            작업 그래프 상한은 양의 유한한 configuredMaxProcess, 아니면 1이다. 상한이 바뀌면 이력도 비워 서로 다른 상한의 측정값을 혼합하지 않는다.
            큐가 없으면 '-'로, 있으면 _queueBuffer 길이와 _remainProcess를 누락 시 0으로 표시한다.
            가시 레이어의 자식 수를 합산하고 지형 타일·인스턴스·리소스 관리자 수를 표시한다.
            GPU 메모리를 추정한 뒤 GPU 크기와 totalJSHeapSize를 MB로 읽어 합계와 한도를 표시한다.
            상태 갱신의 마지막에 그래프와 Status 컨트롤러 표시를 갱신한다.
            주기적 갱신 루프를 시작한다.

    #runUpdateLoop() -> void
        의존: Web API — 화면 요소와 호스트 기능 사용; 함수: {console.error()}
        동작: 상태 갱신 함수를 호출한 뒤 각 사용자 콜백에 현재 view를 전달한다. 사용자 콜백의 예외는 개별 기록하고 다음 콜백을 계속 실행한다.

    #startUpdateLoop() -> void
        의존: Web API — 화면 요소와 호스트 기능 사용; 함수: {performance.now(), requestAnimationFrame()}
        동작:
            RAF가 이미 있거나 창이 숨겨져 있거나 갱신 함수와 콜백이 모두 없으면 종료한다.
            즉시 한 번 갱신하고 현재 시각을 저장한다.
            RAF 콜백에서 숨김 또는 모든 갱신 대상 소멸을 확인하면 RAF 번호를 0으로 두고 재예약하지 않는다.
            직전 시각이 falsy이거나 250ms 이상 지났으면 시각을 저장하고 갱신한 뒤 다음 RAF를 예약한다.

    #stopUpdateLoop() -> void
        의존: Web API — 화면 요소와 호스트 기능 사용; 함수: {cancelAnimationFrame()}
        동작: 저장된 RAF 번호가 falsy이면 종료하고, 아니면 예약을 취소한 뒤 번호를 0으로 둔다.

    #buildSettings() -> void
        의존:
            defined — 앱 존재 판정; 함수: {defined()}
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getPostOption(), getImproveLevel(), isPostProcess(), getSunFlare(), isUseShadow(), getIntensityLight(), getIntensitySunLight(), getMaxProcess(), getPixelResolutionLevel(), getPixelRatio(), getRatioTileSize(), getRatioModelTileSize(), getTileUpdateSensitivity(), getToneMappingExposure(), setImproveValue(), setPostOption(), setMaxProcess(), setRatioTileSize(), setRatioModelTileSize(), restartQuadTree(), setTileUpdateSensitivity(), setPixelResolution(), setPixelRatio(), setToneMappingExposure(), setPostProcess(), setIntensityLight(), setIntensitySunLight(), setSunFlare(), setShadow()}
            THREE_GUI — 폴더와 입력 구성; 함수: {title()}
            THREE_GUI_Controller — 입력 행의 표시와 콜백 연결; 함수: {name(), setTitle()}
        동작:
            앱이 없으면 종료하고 Settings 버튼을 설정으로 표시한다.
            품질 설정·작업설정·렌더링·조명·설정 관리 폴더와 각 입력 행을 추가한다.
            Settings state가 없으면 품질 버튼까지만 구성한 뒤 종료한다. 있으면 앱 조회값으로 초기화한다.
            후처리 값이 없으면 대비 1.022, 밝기 1.1, AO·Bloom false, Bloom 강도 0.75를 사용한다.
            낮음은 low·HD·최대 작업 12·태양 플레어와 후처리 끔, 보통은 medium·FHD·18·플레어와 후처리 켬·AO와 Bloom 끔, 높음은 high·QHD·24·modelUpdateOffset 0·플레어와 후처리 및 AO와 Bloom 켬 템플릿을 적용한다.
            최대 작업은 2~60 정수, 타일·모델 타일 배율은 0.3~3의 0.1 단위, 갱신 민감도는 0.1~5의 0.1 단위 입력 완료 시 적용한다. 배율 변경은 쿼드트리도 재시작한다.
            렌더링 영역은 텍스쳐 보정, 해상도 UHD·QHD·FHD·HD·SD, 픽셀 배율, 톤 맵 노출, 후처리 사용·대비·밝기·AO·Bloom·Bloom 강도를 조절한다.
            텍스쳐 보정은 improvetexture 상태에 연결하며 낮음·보통·높음·매우 높음을 각각 low·medium·high·ultra로 전달한다. 변경 시 setImproveValue 적용 후 restartQuadTree를 호출하여 기존 지형 타일도 새 단계로 생성한다. 갱신·품질 프리셋·초기 설정 복원은 기존 상태 동기화 경로로 선택값을 맞춘다.
            픽셀 배율은 입력 완료 시, 나머지 렌더링 항목은 변경 시 적용하며 후처리 옵션은 state의 다섯 값을 함께 전달한다.
            환경광·태양광은 0 이상의 0.1 단위 입력 완료 시 적용하고 실제 앱 값으로 표시를 다시 맞춘다.
            플레어·그림자는 변경 즉시 대응 API를 호출한다.
            지도 컨트롤러 영역을 구성한다.
            초기 설정 복원 버튼은 초기 factor를 복원한 다음 초기 품질 템플릿을 적용한다.

    #buildMapControlSettings() -> void
        의존:
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getMapControl()}
            UMapControlBase — 지도 입력 factor 연계; 함수: {getFactor()}
            UGUI — GUI 구성과 조회; 함수: {addFolder(), addController()}
            THREE_GUI — 폴더와 입력 구성; 함수: {addFolder(), close()}
            THREE_GUI_Controller — 입력 행의 표시와 콜백 연결; 함수: {setTitle()}; 속성 읽기: {domElement}
            U3dMessage — 로그 기록; 함수: {__GInfo__()}
        동작:
            앱 컨트롤·Settings 탭·GUI 중 하나라도 없으면 종료한다.
            현재 factor를 얕게 복사하여 초기 기준을 보관하고 입력 state를 현재 값으로 채운다.
            컨트롤러 폴더와 적용 상태·초기 복원 행을 추가한다.
            MAP_CONTROL_FIELDS에 따라 팬·회전 관성, 감도, 줌, 앵커, 입력 방식·충돌의 닫힌 하위 폴더와 입력을 만든다.
            각 입력은 listen false이며 모드 선택은 표시 문자열, 각도는 도 단위이다. 정수 필드만 step 1을 지정한다.
            입력 완료 시 검증·적용하고 성공 로그 또는 오류 메시지를 상태 행과 도움말에 표시한다.
            성공·실패 후 실제 앱 값을 다시 표시한다.
            컨트롤러 초기 복원 버튼은 초기 factor를 복원하고 안내를 표시한다.
            폴더를 닫고 Settings 컨트롤러 캐시를 무효화한다.

    #setMapControlFactor(field: UDevToolMapControlField, value: Controller_VALUE) -> void
        의존:
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getMapControl()}
            UMapControlBase — 지도 입력 factor 연계; 함수: {getFactor(), setControlType()}; 상수: {CONTROL_CASE.PAN}
        동작:
            컨트롤러가 없으면 Error를 던진다. factor 원본을 조회한다.
            boolean 필드는 불리언 외 입력에 TypeError를 던진다.
            나머지는 options가 있으면 표시명으로 엔진 숫자를 찾고, 아니면 입력값을 사용한다.
            숫자 외 타입·비유한 값·field.min 미만·field.max 초과·정수 필드의 비정수이면 RangeError를 던진다.
            minDistance의 0과 firstPersonModeKey의 37~40은 RangeError를 던진다.
            degrees 필드는 도를 라디안으로 변환하고 변경 필드를 덮은 factor 복사본으로 관계를 검사한다.
            최소 줌 거리가 최대보다 크거나 팬 앵커 최소 거리가 최대보다 크면 RangeError를 던진다.
            setControlType에 복사본의 moveType과 PAN을 전달한 뒤 원본 factor의 해당 필드만 대입한다.

    #syncMapControlState() -> void
        의존:
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getMapControl()}
            UMapControlBase — 지도 입력 factor 연계; 함수: {getFactor()}
        동작:
            컨트롤러 또는 Settings state가 없으면 종료한다.
            각 factor를 mapcontrol_ 접두사 키에 복사하며 options는 엔진 값의 표시명, 숫자 각도는 라디안에서 도로 변환한다.

    #resetMapControlSettings() -> void
        의존:
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getMapControl()}
            UMapControlBase — 지도 입력 factor 연계; 함수: {setControlType(), getFactor()}; 상수: {CONTROL_CASE.PAN}
        동작: 컨트롤러 또는 초기 factor가 없으면 종료한다. 초기 moveType과 PAN으로 컨트롤 방식을 설정한 뒤 초기 factor를 실제 factor 원본에 덮어쓴다.

    #captureTemplateFromApp() -> GUI_TemplateState
        의존:
            defined — 앱 존재 판정; 함수: {defined()}
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getPostOption(), getImproveLevel(), getMaxProcess(), getPixelResolutionLevel(), getPixelRatio(), getRatioTileSize(), getRatioModelTileSize(), getTileUpdateSensitivity(), isPostProcess(), getSunFlare(), isUseShadow(), getToneMappingExposure(), getIntensityLight(), getIntensitySunLight(), getModelUpdateOffset()}
        동작: 앱이 없으면 빈 객체를 반환한다. 품질·작업·조명·갱신 값을 조회하여 새 객체로 반환하고 postOption은 없으면 빈 객체, 있으면 얕은 복사본으로 저장한다.

    refresh() -> void
        의존: THREE_GUI_Controller — 입력 행의 표시와 콜백 연결; 함수: {updateDisplay()}
        동작:
            앱이나 루트 GUI가 없으면 종료한다.
            앱 값 동기화 후 상태 갱신 함수를 호출한다.
            Settings state가 없을 때도 모든 사용자 탭 컨트롤러 표시를 갱신한다.

    #syncStateFromApp() -> void
        의존:
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getImproveLevel(), isPostProcess(), getSunFlare(), isUseShadow(), getIntensityLight(), getIntensitySunLight(), getMaxProcess(), getPixelResolutionLevel(), getPixelRatio(), getRatioTileSize(), getRatioModelTileSize(), getTileUpdateSensitivity(), getToneMappingExposure(), getPostOption()}
            THREE_GUI_Controller — 입력 행의 표시와 콜백 연결; 함수: {updateDisplay()}
        동작:
            앱이나 Settings state가 없으면 종료한다.
            improvetexture·품질·작업·조명 값을 실제 앱 조회값으로 덮어쓴다. 후처리 속성이 nullish이면 기존 표시값을 유지한다.
            컨트롤 factor 표시를 맞춘다.
            모든 탭 컨트롤러의 표시만 갱신하며 입력 콜백과 앱 setter를 호출하지 않는다.

    #getSettingsTabState() -> Record<string, any> | undefined
        동작: Settings 탭의 state 원본 또는 undefined를 반환한다.

    #applyTemplate(setting: GUI_TemplateState, templateName: string) -> void
        의존:
            defined — 개별 필드 존재 판정; 함수: {defined()}
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {setImproveValue(), setPostProcess(), setPostOption(), setSunFlare(), setShadow(), setMaxProcess(), setPixelResolution(), setPixelRatio(), setRatioTileSize(), setRatioModelTileSize(), setTileUpdateSensitivity(), setToneMappingExposure(), setIntensityLight(), setIntensitySunLight(), setModelUpdateOffset(), restartQuadTree()}
        동작:
            앱이나 setting이 없으면 종료한다.
            정의된 improveTexture·postProcess·postOption·sunFlare·shadow·maxProcess·pixelResolution·pixelRatio·tileRatio·modelTileRatio·tileUpdateSensitivity·toneExposure·intensityLight·intensitySunLight·modelUpdateOffset을 이 순서로 각 setter에 전달한다.
            improveTexture가 none이어도 setter에 전달하지만 현재 U3dApp은 값 0을 적용하지 않는다. [확인 Q-001]
            쿼드트리를 재시작하고 실제 앱 값을 표시한 뒤 템플릿 이름을 저장한다.

    #resolveGraphValueGetter(tabGui: UGUI | undefined, traceName: string) -> function | undefined
        의존:
            U3dMessage — 로그 기록; 함수: {__GSError__()}
            UGUI — GUI 구성과 조회; 함수: {getController()}
            THREE_GUI_Controller — 입력 행의 표시와 콜백 연결; 속성 읽기: {object, property}
        동작:
            tabGui가 없으면 오류 로그 후 undefined를 반환한다.
            traceName이 문자열이 아니면 Error를 던진다. 대응 컨트롤러가 없으면 오류 로그 후 undefined를 반환한다.
            컨트롤러의 object 원본 참조를 보관하고 호출 시 그 객체의 현재 controller.property 값을 읽는 함수를 반환한다.

    #drawGraph(canvas: HTMLCanvasElement, values: Array<number>, upperValue: number = 60, lowerValue: number = 0, lineColor: string = '#67d5b5', clearCanvas: boolean = true, lineDash: Array<number> = []) -> void
        의존: Web API — 화면 요소와 호스트 기능 사용; 함수: {HTMLCanvasElement.getContext(), CanvasRenderingContext2D.clearRect(), CanvasRenderingContext2D.fillRect(), CanvasRenderingContext2D.setLineDash(), CanvasRenderingContext2D.beginPath(), CanvasRenderingContext2D.moveTo(), CanvasRenderingContext2D.lineTo(), CanvasRenderingContext2D.stroke(), CanvasRenderingContext2D.arc(), CanvasRenderingContext2D.fill()}
        동작:
            canvas 또는 2D 컨텍스트가 없으면 종료한다.
            배열 values의 각 값과 양 끝값을 안전한 숫자로 변환하고 범위의 작은 값·큰 값을 정한다. 표시 범위 폭은 최소 1이다.
            clearCanvas가 true이면 배경과 상하 기준선을 다시 그리고, false이면 기존 그림 위에 선을 추가한다.
            8픽셀 안쪽 영역에 시간순 점을 균등 배치하며 y 값은 범위 안으로 제한한다. 지정 색·점선으로 선과 마지막 점을 그린 뒤 점선을 초기화한다.

    #toSafeNumber(value: number | string) -> number
        동작: 유한한 숫자는 그대로, 문자열은 parseFloat 결과가 유한하면 그 수를 반환한다. 그 외 값은 Number로 변환한다. 변환 결과가 비유한이면 0을 반환하며 변환 자체의 예외는 전파한다.

    #clampGraphValue(value: number | string, lowerValue: number, upperValue: number) -> number
        동작: 세 값을 안전한 숫자로 바꾸고 하한·상한이 역전되면 작은 값과 큰 값을 뒤집어 사용하여 value를 구간 안으로 제한한다.

    #updateGraphs() -> void
        의존: defined — maxPoints 존재 판정; 함수: {defined()}
        동작:
            각 그래프의 현재 getter 값을 구간 안으로 제한하여 history 뒤에 넣는다.
            maxPoints가 정의되고 길이가 이를 초과하면 가장 오래된 값 하나를 제거한다.
            기본 선을 배경 초기화와 함께 그리고 각 추가 선도 같은 구간·개수 제한으로 이력을 갱신하여 덧그린다.

    #removeGraphsByTab(tabName: string) -> void
        의존: Web API — 화면 요소와 호스트 기능 사용; 함수: {HTMLElement.remove()}
        동작: 배열 뒤에서부터 같은 탭 이름의 그래프 wrapper와 배열 항목을 모두 제거한다.

    #removeGraphsByFolder(folderName: string, tabName?: string) -> void
        의존:
            defined — 탭 지정 여부 판정; 함수: {defined()}
            Web API — 화면 요소와 호스트 기능 사용; 함수: {HTMLElement.remove()}
        동작: 배열 뒤에서부터 같은 폴더 이름이고 tabName이 없거나 같은 탭인 그래프 wrapper와 배열 항목을 제거한다.

    __testDevToolView(showLog: boolean = false, app: U3dApp | undefined = undefined) -> boolean
        의존:
            U3dApp — 앱 설정과 실행 상태 연계; 함수: {getDevToolView(), createDevToolView()}
            Web API — 화면 요소와 호스트 기능 사용; 함수: {console.log()}
        동작:
            앱이 없거나 조회·생성한 개발 도구가 UDevToolView 인스턴스가 아니면 false를 반환한다.
            전용 시험 이름의 이전 그래프·입력·폴더·탭을 정리한다.
            시험 탭·폴더·읽기 전용 숫자 입력과 그래프를 추가한다.
            호출 여부를 표시하는 갱신 콜백을 등록하고 창을 숨겼다 다시 보인다.
            반환된 해제 함수와 offUpdate(undefined)를 호출하여 사용자 콜백을 해제한다.
            생성 결과·콜백 호출·컨트롤러 조회 결과를 불리언으로 결합한다.
            showLog가 true이면 결과를 기록하고 시험 항목을 다시 정리한 뒤 결과를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
탭 정보·컨트롤러·canvas는 실제 관리 객체를 반환하므로 외부 조작이 가능하다. 외부에서 UGUI를 직접 변경하면 컨트롤러 캐시의 무효화가 자동으로 수행되는 것은 아니다.
일반 입력 행의 상태 키는 표시명 원문에서 공백을 제거하고 소문자로 바꾼 값이다. name()으로 표시명을 번역해도 이 키는 바뀌지 않는다.
품질 프리셋과 초기 품질 복원은 #applyTemplate을 공유한다. 지도 factor는 별도 초기 복원 경로를 가지며 품질 프리셋만으로 바뀌지 않는다.
상태 갱신과 사용자 콜백은 화면 RAF를 공유하며 숨김 시 중단한다. 탭 선택만 바꾸면 루프는 계속된다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
