# UAnalySkyLine 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UAnalySkyLine`은 앱 렌더러의 스카이라인 후처리 패스를 활성화하고 스타일을 설정하며, 화면 캡처 배열에서 하늘·지면·초과 영역의 픽셀 수를 집계하는 분석 클래스다.

### 1.2 책임 범위

- 앱과 렌더러에 이미 등록된 스카이라인 패스를 연결한다.
- 패스 활성화·비활성화와 분석 활성 상태를 변경한다.
- 스타일 입력의 선택 조건에 따라 패스의 선·초과 색상·지면·하늘 설정을 호출한다.
- 화면 배열의 세 채널을 독립적으로 집계하고 deferred 객체를 종결한다.

### 1.3 주요 동작 방식

앱 연결·활성화·스타일 설정·화면 집계의 진입에서 렌더러와 패스 참조를 갱신한다. 등록 패스가 없는 경우 스타일 설정은 자신을 반환하고, 화면 집계는 deferred 객체를 reject한다. 패스 자체의 생성과 렌더링은 렌더러·후처리 패스가 담당한다.

### 1.4 주요 사용처와 연계 대상

- `union3d/app/GeOnDT.js`의 분석 클래스 공개 목록에 포함된다.
- 기반 클래스 `UAnaly`, 앱 `U3dApp`, 렌더러 `URenderer`, 후처리 패스 `USkyLinePass`와 연계한다.
- `deferred()`가 화면 집계 결과의 전달 객체를 만들고 `__GError__()`가 비동기 실패 메시지를 전달한다.

## 3. 정규 자연어 수도코드

```spec
UAnalySkyLine extends UAnaly 클래스 정의

    #renderer: URenderer | undefined = undefined
        앱에서 조회하여 보관하는 렌더러 참조

    #skyLinePass: USkyLinePass | undefined = undefined
        렌더러에 등록된 스카이라인 패스 인스턴스 참조

    name: string = 'SkyLine'
        생성자가 설정하는 분석 이름이며 외부에서도 변경할 수 있다.

    constructor(opt: UAnalySkyLineCO = {})
        인터페이스: opt는 받지만 기반 생성자에 전달하거나 현재 생성 동작에 사용하지 않는다.
        의존: UAnaly — 기반 분석 상태 초기화; 생성자: {constructor()}
        동작:
            인수 없이 기반 생성자를 실행하고 name을 'SkyLine'으로 설정한다.

    override setApp(app: U3dApp) -> this
        의존: UAnaly — 앱 연결; 함수: {setApp()}
        동작:
            기반 setApp(app)을 실행한 뒤 렌더러와 패스를 연결하고, 성공 여부를 확인하지 않고 자신을 반환한다.

    override active() -> this
        의존:
            UAnaly — 분석 활성 상태 변경; 함수: {active()}
            URenderer — 후처리 패스 활성화; 함수: {activePass()}
            UDEF — 스카이라인 패스 식별; 상수: {POSTPASS.SKYLINE}
        동작:
            렌더러와 패스 연결을 시도한다.
            성공 여부와 관계없이 저장한 렌더러에서 스카이라인 패스를 true로 활성화한다. 렌더러가 undefined이면 이 접근에서 동기 예외가 발생한다.
            기반 active()를 실행한 뒤 자신을 반환한다.

    override deactive() -> this
        의존:
            UAnaly — 분석 비활성 상태 변경; 함수: {deactive()}
            URenderer — 후처리 패스 비활성화; 함수: {activePass()}
            USkyLinePass — 캡처 버퍼 정리; 함수: {clearPixelBuffer()}
            UDEF — 스카이라인 패스 식별; 상수: {POSTPASS.SKYLINE}
        동작:
            기반 deactive()를 먼저 실행한다.
            렌더러가 falsy이면 자신을 반환한다.
            저장한 렌더러에서 스카이라인 패스를 false로 비활성화한다.
            저장한 패스가 truthy이면 픽셀 버퍼를 비우고 자신을 반환한다.

    setStyle(style: SkyLineStyle) -> this
        의존:
            defined — null과 undefined를 제외한 값 판별; 함수: {defined()}
            USkyLinePass — 스타일 반영; 함수: {setLine(), setOverColor(), setGround(), setSky()}
        동작:
            렌더러와 패스를 연결하며 false를 반환하면 스타일에 접근하지 않고 자신을 반환한다.
            저장한 패스를 사용하고 style의 일곱 필드를 읽는다.
            lineColor 또는 lineSize가 truthy이면 두 값을 setLine()에 전달한다. 둘 다 falsy이면 호출하지 않는다.
            overColor가 truthy이면 setOverColor()에 전달한다.
            useGroundColor가 null 또는 undefined가 아니면 false도 포함하여 groundColor와 함께 setGround()에 전달한다.
            useSkyColor가 null 또는 undefined가 아니면 false도 포함하여 skyColor와 함께 setSky()에 전달한다.
            위 순서로 적용한 뒤 자신을 반환한다. 스타일과 패스에 대한 추가 유효성 검사나 색상 객체 변환은 수행하지 않는다.

    getScreenInfo() -> ReturnType<typeof deferred>
        의존:
            deferred — 결과 전달 객체 생성; 함수: {deferred()}
            UAnaly — 분석 활성 상태 조회; 함수: {isActive()}
            USkyLinePass — 화면 배열 요청; 함수: {getDepthArray()}
            __GError__ — 비동기 실패 메시지 전달; 함수: {__GError__()}
        동작:
            deferred 객체를 먼저 생성한다.
            분석이 비활성이면 패스 연결을 시도하지 않고 인수 없이 reject한 객체를 반환한다.
            분석이 활성 상태이면 렌더러와 패스를 연결하고 false를 반환하면 인수 없이 reject한 객체를 반환한다.
            저장한 패스에서 getDepthArray()를 호출하고 반환 객체의 then·catch에 집계와 오류 처리를 등록한 뒤 최초 생성한 deferred 객체를 반환한다.
            배열이 전달되면 인덱스를 0부터 4씩 증가시키며 첫째·둘째·셋째 채널이 각각 0.5보다 클 때 ground·sky·over를 독립적으로 증가시킨다. 넷째 채널은 집계하지 않는다.
            sky·ground·over와 total = 배열 길이 / 4를 가진 객체로 deferred를 resolve한다. 채널별 분류는 상호 배타적이지 않으며 배열 길이의 나머지를 검증하지 않는다.
            catch 경로에서는 원래 분석 인스턴스와 '화면 정보를 읽는 중 오류가 발생 하였습니다.', 코드 '9863216'으로 __GError__()를 호출한 뒤 deferred를 인수 없이 reject한다.
            getDepthArray() 호출이나 then·catch 등록 전에 발생한 동기 예외는 위 catch로 변환하지 않고 호출자에게 전달한다.

    #setPass() -> boolean
        의존:
            UAnaly — 연결된 앱 참조 조회; 속성 읽기: {_app}
            U3dApp — 렌더러 조회; 함수: {getRenderer()}
            URenderer — 등록 패스 조회; 함수: {hasPass(), getPass()}
            UDEF — 스카이라인 패스 식별; 상수: {POSTPASS.SKYLINE}
        동작:
            _app에서 getRenderer()를 호출하여 반환값으로 #renderer를 갱신한다. _app이 undefined이면 이 접근에서 동기 예외가 발생한다.
            #renderer가 falsy이면 #skyLinePass를 비우지 않고 false를 반환한다.
            렌더러의 hasPass(SKYLINE)가 false이면 이전 #skyLinePass를 유지하고 false를 반환한다.
            등록 패스가 있으면 getPass(SKYLINE).instance를 #skyLinePass에 저장하고, instance의 값은 추가 확인하지 않고 true를 반환한다.

UAnalySkyLineCO_Content 타입 정의
    name?: string = 'SkyLine'
        선언된 이름 옵션이며 현재 생성자는 이 값을 읽지 않는다.

UAnalySkyLineCO extends UAnalyCO 부분 타입 명세
    UAnalySkyLineCO_Content와 Omit<UAnalyCO, never>를 합성한 생성 옵션 타입

SkyLineStyle 타입 정의
    lineColor?: ColorLike
        스카이라인 경계선 색상
    lineSize?: number
        경계선 두께
    overColor?: ColorLike
        초과 영역 색상
    useGroundColor?: boolean
        지면 색상 적용 여부
    groundColor?: ColorLike
        지면 색상
    useSkyColor?: boolean
        하늘 색상 적용 여부
    skyColor?: ColorLike
        하늘 색상
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
