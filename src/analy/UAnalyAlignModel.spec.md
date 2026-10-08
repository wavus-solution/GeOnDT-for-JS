# UAnalyAlignModel 명세

> 상태: 구현 관찰 초안

## 1. 개요

UAnalyGizmoModel을 상속하여 기준 모델과 대상 목록의 정렬 편집 기능을 분석 API로 연결한다.
U3dApp의 AlignModel 분석으로 생성·활성화하거나 이름을 지정한 분석으로 등록한다.
실제 정렬과 미리보기·핸들 계산은 별도 논리적 소스 단위인 UAlignControls가 담당한다.

## 3. 정규 자연어 수도코드

```spec
UAnalyAlignModel extends UAnalyGizmoModel 클래스 정의
    의존: UAnalyGizmoModel — 기즈모 분석 기반 클래스; 상속: {UAnalyGizmoModel}

    name: string = 'AlignModel'
        앱에서 분석을 식별하는 이름이며 외부에서도 변경할 수 있다.
    _targetList: Array<Object3D> = 빈 배열
        컨트롤에서 조회한 정렬 대상 목록의 원본 참조다.
    _reference: Object3D | undefined = undefined
        컨트롤에서 조회한 정렬 기준 대상의 원본 참조다.
    _control: UGizmoControls | undefined = undefined
        부모의 컨트롤 연결 필드를 이 생성자에서도 초기화한다. 런타임에는 정렬 컨트롤을 저장한다.

    constructor(opt?: UAnalyAlignModelCO)
        인터페이스: opt: 분석 이름을 지정하는 옵션이며 생략 시 AlignModel을 사용한다.
        의존:
            UAnalyGizmoModel — 기반 기즈모 초기화; 생성자: {super()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
        동작:
            부모를 opt 없이 초기화하고 opt가 falsy이면 빈 객체로 대체한다.
            opt.name이 undefined이면 name을 AlignModel로 하고 그 밖의 값은 그대로 저장한다. null·false·0·빈 문자열은 defaultValue에서 대체하지 않는다.
            _control·_reference를 undefined로 하고 _targetList를 새 빈 배열로 초기화한다.
            상속 옵션 type은 부모에게 전달하지 않는다. [확인 Q-001]

    override active() -> void
        역할: 분석을 활성화하고 정렬 컨트롤 이벤트를 분석 갱신·변경·편집 종료에 연결한다.
        의존:
            UAnaly — 활성 상태 전환; 함수: {prototype.active.call()}; 속성 읽기: {_isActive, _app}
            UAnalyGizmoModel — 클릭 식별자·편집 종료; 함수: {onEnd()}; 속성 읽기: {_clickId}
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 기존 클릭 연결 해제; 함수: {unkey()}
            UAlignControls — 컨트롤 이벤트 연결; 함수: {addEventListener()}
        동작:
            _isActive가 truthy이면 종료한다.
            UAnaly.prototype.active.call(this)로 활성 상태를 먼저 설정하며 UAnalyGizmoModel.active()는 호출하지 않는다.
            _clickId가 null·undefined가 아니면 연결 앱의 click 이벤트에서 해당 식별자를 해제한다. 이 클래스는 새 click 이벤트를 등록하지 않는다.
            _isActive가 falsy인 경우 다음 컨트롤 연결을 수행한다.
                _control이 falsy이면 컨트롤 생성을 시도한다.
                생성 시도 후에도 _control이 falsy이면 종료한다.
                _control이 truthy인 경우 change에 update, objectChange에 objectChange, mouseUp에 상속 onEnd를 각각 이 분석 객체를 this로 묶어 등록한다.

    override update() -> void
        의존:
            UAnaly — 앱 갱신 요청; 함수: {prototype.update.call()}
            UAlignControls — 핸들 갱신; 함수: {updateHandle()}
        동작:
            UAnaly.prototype.update.call(this)를 먼저 호출하며 UAnalyGizmoModel.update()의 대상·레이저 갱신은 호출하지 않는다.
            _control이 truthy이면 updateHandle()을 호출한다. 분석 활성 여부는 검사하지 않는다.

    override createGizmo() -> void
        역할: 연결 앱의 카메라·DOM·장면으로 정렬 컨트롤을 만들고 주석 장면에 등록한다.
        의존:
            UAnaly — 앱과 분석 장면 연결; 속성 읽기: {_app, _scene, _sceneComment}
            UAnalyGizmoModel — 기존 컨트롤 해제; 함수: {removeGizmo()}
            __GInfo__ — 앱 미연결 안내; 함수: {__GInfo__()}
            U3dApp — 컨트롤 생성 입력; 함수: {getSceneComment()}; 속성 읽기: {_camera, _renderer}
            URenderer — 이벤트 DOM; 속성 읽기: {domElement}
            UAlignControls — 정렬 컨트롤; 생성자: {new UAlignControls()}
            UScene — 주석 장면 등록; 함수: {add()}
        동작:
            _app 또는 _sceneComment가 falsy이면 setApp을 먼저 실행하라는 7041621 안내를 출력하고 종료한다. 기존 컨트롤을 제거하지 않는다.
            상속 removeGizmo()로 이전 컨트롤을 제거한다.
            앱의 _camera·_renderer.domElement와 분석 _scene, app.getSceneComment() 결과, _app 참조를 camera·domelement·scene·sceneComment·app 옵션으로 전달하여 UAlignControls를 생성하고 _control에 저장한다.
            분석 _sceneComment에 새 컨트롤을 추가한다. 이벤트 연결은 여기서 수행하지 않는다.
            생성·등록 예외를 이 메서드에서 잡지 않으며 기존 컨트롤 제거를 되돌리지 않는다.

    override objectChange() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UEventDispatcher — 분석 변경 통지; 함수: {dispatchEvent()}
        동작:
            _control이 null·undefined이면 컨트롤 생성을 시도한다.
            현재 _reference·_targetList의 원본 참조를 reference·targetList 속성으로 담은 새 data 객체를 만든다.
            type이 onChange이고 data가 새 객체, control이 현재 _control인 이벤트를 전달한다. 생성 시도가 안내만 출력하고 끝난 경우에도 control은 undefined인 채 전달한다.

    override clear() -> void
        의존: UAnalyGizmoModel — 대상 장면 초기화와 컨트롤 해제; 함수: {removeGizmo()}; 속성 쓰기: {_targetScenes}
        동작:
            _targetScenes를 새 빈 배열로 바꾼다.
            _control이 falsy이면 종료하고 그 밖에는 상속 removeGizmo()를 호출한다.
            _reference·_targetList는 바꾸지 않으며 UAnaly.clear()를 호출하지 않는다.

    override getControl() -> UGizmoControls | undefined
        인터페이스: 반환: 현재 연결된 컨트롤의 원본 참조이며 미생성·해제 상태이면 undefined
        동작: 현재 _control을 그대로 반환하며 컨트롤을 생성하지 않는다.

    override setMode(mode: string | number) -> void
        인터페이스: mode: align·left·center·right 또는 각각에 대응하는 숫자 0·1·2·3
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAlignControls — 모드 조회·설정; 함수: {getMode(), setMode()}
            Web API — 미지원 입력 경고; 함수: {console.warn()}
        동작:
            컨트롤이 null·undefined이면 입력 검사보다 먼저 컨트롤 생성을 시도한다.
            숫자는 모드 배열 ['align', 'left', 'center', 'right']의 해당 속성으로 치환한다. 정상적인 정수 인덱스 0~3 밖의 숫자는 지원 모드가 아니며 반올림·범위 보정하지 않는다.
            문자열은 소문자로 바꾸되 공백을 제거하지 않는다. 그 밖의 입력은 변환하지 않는다.
            변환값이 지원 모드 Set에 없으면 변환된 값과 지원 목록을 console.warn으로 출력하고 그 호출 결과를 반환한다.
            유효한 모드여도 _control이 falsy이면 종료한다.
            control.getMode()가 변환된 mode와 같으면 종료하고 그 밖에는 control.setMode(mode)를 호출한다. 컨트롤 자체의 모드 변환 결과를 이 클래스에서 보정하지 않는다.

    setObjects(reference: Object3D, targets: Array<Object3D>) -> void
        인터페이스:
            reference: 정렬 기준 모델
            targets: 정렬 대상 모델 목록
        의존:
            UAnaly — 활성 상태 조회; 함수: {isActive()}
            defined — null·undefined 판정; 함수: {defined()}
            UAlignControls — 대상 등록과 실제 등록 결과; 함수: {setObjects(), getReference(), getTargetList()}
        동작:
            isActive()가 falsy이거나 _control이 null·undefined이면 아무것도 등록하지 않고 종료한다. 컨트롤 생성도 시도하지 않는다.
            control.setObjects(reference, targets)를 호출한다.
            컨트롤의 getReference() 결과를 _reference에, getTargetList() 결과를 _targetList에 순서대로 저장한다. 입력 객체나 배열을 복사하지 않으며 컨트롤이 선택·가공한 반환 참조를 저장한다.
            위임·조회 예외를 잡지 않는다. getTargetList()만 실패하면 먼저 저장한 _reference는 되돌리지 않는다.

    setSpacing(spacing: number) -> void
        인터페이스: spacing: 컨트롤에 전달할 정렬 간격이며 이 분석 클래스에서 단위·범위를 변환하지 않는다.
        의존:
            UAlignControls — 간격 설정; 함수: {setSpacing()}
        동작:
            _control이 falsy이면 종료하며 생성·활성화하지 않는다.
            _control이 truthy인 경우 다음 순서로 간격과 분석을 갱신한다.
                control.setSpacing(spacing)을 호출한다. 위임에서 예외가 나면 이후 갱신하지 않는다.
                분석 갱신을 수행한다.

    getSpacing() -> number | undefined
        인터페이스: 반환: 컨트롤의 현재 정렬 간격이며 컨트롤이 falsy이면 undefined
        의존:
            UAlignControls — 간격 조회; 함수: {getSpacing()}
        동작: _control이 falsy이면 undefined를 반환하고 그 밖에는 control.getSpacing() 결과를 그대로 반환한다.

    override getMode() -> string
        인터페이스: 반환: 컨트롤이 보고하는 모드 문자열이며 컨트롤 또는 조회 결과가 null·undefined이면 빈 문자열
        의존:
            UAlignControls — 실제 모드 조회; 함수: {getMode()}
        동작:
            _control이 falsy이면 컨트롤 생성을 시도한다.
            control?.getMode() 결과가 null·undefined이면 빈 문자열을 반환하고 그 밖에는 그 결과를 그대로 반환한다. setMode의 입력명으로 역변환하지 않는다.

    override deactive() -> void
        의존: UAnalyGizmoModel — 기즈모 분석 비활성화; 함수: {super.deactive()}
        동작:
            super.deactive()를 먼저 호출한다. 부모 경로의 this.clear()는 이 클래스의 clear로 재정의되어 있다.
            부모가 정상 반환하면 _reference를 undefined로 하고 _targetList를 새 빈 배열로 바꾼다. 부모가 비활성 상태로 즉시 반환한 경우에도 수행한다.
            부모에서 예외가 나면 후속 참조 초기화는 수행하지 않는다.

UAnalyAlignModelCO_Content 부분 타입 명세
    name?: string = 'AlignModel'
        분석 이름 옵션이다.

UAnalyAlignModelCO 부분 타입 명세
    UAnalyGizmoModelCO와 UAnalyAlignModelCO_Content의 합성 타입이다.
    name?: string = 'AlignModel'
        부모의 GizmoModel 기본값 대신 이 클래스가 사용하는 이름 기본값이다.
    type?: string = 'analy'
        상속 타입이 선언하는 분석 타입 옵션이지만 이 생성자는 부모에게 전달하지 않는다. [확인 Q-001]

AlignControlTC_Content 타입 정의
    addEventListener: function(string, Function) -> void
        이벤트 이름과 함수로 컨트롤 이벤트를 연결하는 국소 타입이다.
    getMode: function() -> string
        컨트롤의 실제 모드 문자열을 조회하는 국소 타입이다.

AlignControlTC 타입 정의
    UAlignControls와 AlignControlTC_Content의 합성 타입이다.
    이 클래스의 이벤트·모드 연계에 사용하는 타입 단언이며 getControl의 공개 반환 타입을 대체하지 않는다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
