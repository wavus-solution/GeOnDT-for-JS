# ULocalENUHelper 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`ULocalENUHelper`는 대상 객체의 위치와 quaternion을 읽어 동·북·상 방향으로 이름 붙인 세 개의 축 화살표를 표시한다. 지리 좌표에서 ENU 기준계를 별도로 계산하지 않고 대상의 로컬 X·Y·Z 축을 회전한 방향을 사용한다.

### 1.2 책임 범위

축별 `ArrowHelper` 세 개를 그룹의 자식으로 소유하고 방향·위치·가시성을 갱신한다. 앱의 렌더 직전 callback 등록과 표시 장면의 변경·해제를 관리한다.

### 1.3 주요 동작 방식

생성 시 축을 구성하고 대상 자세를 반영한 뒤 기본 외부 장면에 등록한다. 자동 갱신이 켜진 상태에서 show()하면 uuid를 키로 렌더 callback을 등록한다. 이전 quaternion과 helper 위치가 대상 값과 같으면 방향·위치 계산을 생략한다.

### 1.4 주요 사용처와 연계 대상

`GeOnDT.object.ULocalENUHelper`로 제공된다. `UGroup`, 앱의 외부 장면·렌더 callback, Three의 `ArrowHelper` 및 position·quaternion을 제공하는 대상 객체와 연계된다.

## 3. 정규 자연어 수도코드

```spec
ULocalENUHelperCO 타입 정의
    object: Object3D | U3dComponentPosition
        position·quaternion을 읽어 표시 자세를 결정할 대상
    arrowLength: 100
        선언상 숫자 100만 허용하는 리터럴 타입이며 구현은 입력값을 화살표 길이로 사용한다. [확인 Q-001]
    app: U3dApp
        외부 장면과 렌더 callback을 제공하는 앱
    autoUpdate: boolean
        자동 갱신 입력이며 생성자의 || true 처리 때문에 false도 true로 바뀐다. [확인 Q-002]

ULocalENUHelper extends UGroup 클래스 정의
    의존: UGroup — 표시 그룹 기반; 상속: {UGroup}

    _disposed: boolean = false
        외부에서도 쓸 수 있으며 dispose()의 중복 호출 억제에 사용하는 상태

    #isInit: boolean = false
        축 생성 여부이며 갱신·등록·가시성 변경의 실행 조건

    #autoUpdate: boolean = true
        렌더 callback에서 대상 자세를 자동으로 읽을지 결정하는 상태

    #arrowLength: number = 100
        다음 initArrows()에서 생성할 축의 길이

    #renderScene: Scene | undefined = undefined
        마지막으로 registerScene()에서 등록한 장면

    #quaternion: Quaternion = 단위 회전
        마지막으로 반영한 대상 quaternion
        의존: Quaternion — 회전 비교용 값; 생성자: {new Quaternion()}

    constructor(options: ULocalENUHelperCO)
        의존: UGroup — 부모 초기화; 생성자: {super(options)}
        동작:
            options를 부모 생성자에 전달한 뒤 object 참조를 저장한다.
            object·quaternion·position 중 하나라도 falsy이면 이후 초기화를 하지 않고 생성자에서 반환한다. [확인 Q-003]
            앱을 저장하고 autoUpdate에는 입력값 또는 true, arrowLength에는 입력값 또는 100을 적용한다. [확인 Q-001] [확인 Q-002]
            입력 autoUpdate 또는 true로 자동 갱신을 설정한다. 아직 #isInit가 false이므로 이 단계에서는 callback을 등록하지 않는다.
            축을 생성하고 대상 자세를 반영한다.
            기본 장면에 등록한 뒤 축을 표시하고 필요하면 callback을 등록한다.

    initArrows() -> void
        의존:
            ArrowHelper — 축 생성; 생성자: {new ArrowHelper()}
            Vector3 — 축 방향·원점; 생성자: {new Vector3()}
            Material — 깊이·투명 설정; 속성 쓰기: {transparent, depthTest}
            Line·Mesh — 선·원뿔 렌더 순서; 속성 쓰기: {renderOrder}
            UGroup — 자식 등록; 함수: {add()}
        동작:
            대상 또는 앱이 없으면 아무것도 하지 않는다.
            원점을 (0, 0, 0)으로 하여 #arrowLength 길이의 화살표 세 개를 만든다.
            동쪽은 X 방향·초록색, 북쪽은 Y 방향·파란색, 위쪽은 Z 방향·빨간색으로 만든다.
            각 화살표의 선·원뿔이 있으면 renderOrder를 1000으로 지정하고, material이 있으면 transparent를 켜고 depthTest를 끈다.
            세 화살표를 자신의 자식으로 추가하고 각 참조를 저장한 뒤 #isInit를 true로 바꾼다.
            이미 생성된 경우를 검사하거나 이전 화살표를 제거하지 않는다. 반복 호출하면 기존 자식은 남고 보관 참조만 새 화살표로 바뀐다. [확인 Q-004]

    updateArrows() -> void
        의존:
            Quaternion — 회전 변경 판정; 함수: {equals()}
            Vector3 — 위치 비교·축 회전; 함수: {equals(), applyQuaternion(), normalize()}
            ArrowHelper — 방향 반영; 함수: {setDirection()}
            UGroup — 표시 위치; 속성 읽기·쓰기: {position}
        동작:
            초기화되지 않았거나 대상·앱이 없으면 아무것도 하지 않는다.
            대상의 quaternion 또는 position이 없으면 아무것도 하지 않는다.
            저장된 quaternion과 대상 quaternion이 같고 자신의 position도 대상 position과 같으면 계산을 생략한다.
            대상 quaternion을 내부 값에 복사한다.
            공유 작업 벡터 E·N·U를 각각 X·Y·Z 단위 벡터로 초기화한 뒤 복사한 quaternion으로 회전하고 정규화한다.
            계산한 세 방향을 각 화살표에 반영하고 대상 position을 자신의 position에 복사한다.

    setAutoUpdate(autoUpdate: boolean = true) -> void
        동작:
            입력값을 #autoUpdate에 그대로 저장한다.
            값이 true이면 렌더 callback 등록을 시도하고 false이면 해제한다.

    #addUpdateListener() -> void
        의존:
            U3dApp — 렌더 callback 존재 확인·등록·해제; 함수: {hasRenderBefore(), setRenderBefore(), removeRenderBefore()}
            UGroup — callback 식별자; 속성 읽기: {uuid}
        동작:
            초기화되지 않았거나 대상·앱이 없으면 아무것도 하지 않는다.
            자신의 uuid에 이미 callback이 등록되어 있으면 그대로 둔다.
            uuid로 렌더 직전 callback을 등록한다.
                #autoUpdate가 true이면 대상 자세를 반영한다.
                false이면 자신의 uuid에 등록된 callback을 제거한다.

    #removeUpdateListener() -> void
        의존:
            U3dApp — 렌더 callback 존재 확인·해제; 함수: {hasRenderBefore(), removeRenderBefore()}
            UGroup — callback 식별자; 속성 읽기: {uuid}
        동작:
            앱이 없거나 자신의 uuid에 callback이 없으면 아무것도 하지 않는다.
            자신의 uuid에 등록된 callback을 제거한다.

    show() -> void
        의존: ArrowHelper — 축 가시성; 속성 쓰기: {visible}
        동작:
            초기화되지 않았거나 대상·앱이 없으면 아무것도 하지 않는다.
            존재하는 세 화살표의 visible을 true로 바꾼다.
            #autoUpdate가 true이면 callback 등록을 시도한다.

    hide() -> void
        의존: ArrowHelper — 축 가시성; 속성 쓰기: {visible}
        동작:
            초기화되지 않았거나 대상·앱이 없으면 아무것도 하지 않는다.
            존재하는 세 화살표의 visible을 false로 바꾸고 callback을 해제한다.

    registerScene(scene: Scene | undefined = this.#renderApp.getExternalScene()) -> void
        의존:
            U3dApp — 생략한 장면 선택; 함수: {getExternalScene()}
            Scene — 장면 등록·제거; 함수: {add(), remove()}
        동작:
            인수를 생략하거나 undefined를 전달하면 본문의 검사보다 먼저 앱에서 기본 외부 장면을 얻는다. 앱이 초기화되지 않은 객체에서는 이 기본값 평가가 실패할 수 있다. [확인 Q-003]
            초기화되지 않았거나 대상·앱·scene이 없으면 아무것도 하지 않는다.
            이전 등록 장면이 있고 새 장면과 다르면 이전 장면에서 자신을 제거한다.
            새 장면을 저장하고 그 장면에 자신을 추가한다.

    override dispose() -> void
        의존:
            UGroup — 부모 해제 동작; 함수: {dispose()}
            ArrowHelper — 보관 중인 축 자원 해제; 함수: {dispose()}
            Scene — 표시 그룹 제거; 함수: {remove()}
        동작:
            _disposed가 true이면 아무것도 하지 않는다.
            _disposed를 true로 바꾼 뒤 부모 dispose()를 호출한다.
            보관 중인 각 화살표가 있으면 dispose()를 호출한다.
            렌더 callback을 해제한다.
            마지막 등록 장면이 있으면 자신을 제거하고 장면 참조를 비운 뒤 #isInit를 false로 바꾼다.
```

## 4. 공통 처리 기준과 제약

```spec
대상의 position·quaternion 자체를 변경하지 않고 값을 복사하여 축을 갱신한다. matrixWorld를 읽거나 부모 변환을 보정하지 않는다.
축 생성에 사용하는 material 설정 보조 함수는 initArrows()의 선·원뿔 material 설정 동작에 포함된다.
show()·hide()는 세 화살표의 visible만 바꾸며 그룹 자신의 visible은 변경하지 않는다.
hide() 뒤 setAutoUpdate(true)를 호출하면 축이 숨겨져 있어도 callback이 다시 등록될 수 있다.
dispose() 이후에도 대상·앱·화살표 참조는 남는다. 공개 initArrows()는 _disposed를 검사하지 않으므로 재호출로 축을 만들 수 있으나 이후 dispose()는 _disposed 검사로 반환한다. [확인 Q-004]
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
