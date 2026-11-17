# Tween 명세

> 상태: 구현 관찰 초안

## 1. 개요

객체의 수치 속성을 지정한 시간에 따라 보간하고, 실행 중인 트윈의 반복·연결·콜백을 관리한다.
`TWEEN.update()`를 호출하는 프레임 루프가 실행 시점을 제공하며 카메라 이동과 객체 애니메이션에서 사용한다.

## 3. 정규 자연어 수도코드

```spec
TWEEN: object
TWEEN.REVISION: string = '13'

TWEEN.getAll() -> Array<object>
    동작: 내부 실행 배열 자체를 반환한다.

TWEEN.removeAll() -> void
    동작: 실행 배열을 새 빈 배열로 교체하고 진행 중인 갱신의 다음 위치를 0으로 되돌린다. 트윈의 중단 콜백은 호출하지 않는다. 콜백에서 새로 등록한 트윈은 해당 갱신에서 처리한다.

TWEEN.add(tween: object) -> void
    동작: 실행 배열 끝에 트윈을 추가한다. 중복 등록을 검사하지 않는다.

TWEEN.remove(tween: object) -> void
    동작: 같은 객체가 처음 나타나는 실행 배열 항목을 제거한다. 없으면 배열을 보존한다. 제거 위치가 진행 중인 갱신의 다음 위치보다 앞이면 그 위치를 하나 줄여 남은 항목을 건너뛰지 않는다.

TWEEN.update(time?: number) -> boolean
    의존: Web API — 기본 단조 시각; 함수: {performance.now()}
    동작:
        실행 배열이 비었으면 false를 반환한다.
        시각이 생략되었으면 브라우저 performance.now가 있을 때 그 값을, 아니면 Date.now를 사용한다.
        호출별 다음 위치를 등록하고 현재 위치의 트윈 참조를 보관한 뒤 다음 위치를 먼저 늘려 트윈을 갱신한다.
        갱신이 false이면 보관한 트윈이 아직 목록에 있는 경우에만 제거하고 진행 중인 갱신 위치를 보정한다. 콜백에서 앞쪽 항목이나 현재 항목을 제거해도 완료한 트윈이 남거나 후속 항목이 생략되지 않는다.
        완료 항목이 다음 위치의 바로 앞에 있으면 그 위치를 사용하고, 참조가 다를 때만 목록에서 다시 찾는다. 실행 목록 전체를 복사하지 않는다.
        갱신 도중 추가된 연결 트윈도 같은 호출에서 배열 끝까지 처리한다.
        정상·예외 종료 모두 이번 호출의 위치 등록을 회수한다. 사용자 콜백 오류는 그대로 전달한다.
        실행 배열이 처음부터 비어 있지 않았으면 true를 반환한다.

TWEEN.Tween(object: object) -> void
    인터페이스: new로 생성하면 object의 수치 속성을 보간하는 트윈 인스턴스가 된다.
    동작:
        대상 참조와 초기 속성의 숫자 변환값을 보관하고 목표·반복용 시작값을 빈 객체로 만든다.
        재생 시간 1000, 반복 0, 지연 0, 미재생·미정지 상태와 빈 연결 목록을 초기화한다.
        선형 완화와 선형 보간을 기본 함수로 선택한다.
        시작·갱신·완료·중단 콜백 필드를 null로 초기화한다.

TWEEN.Tween._onStartCallback: Function | null = null
TWEEN.Tween._onUpdateCallback: Function | null = null
TWEEN.Tween._onCompleteCallback: Function | null = null
TWEEN.Tween._onStopCallback: Function | null = null

TWEEN.Tween.to(properties: object, duration?: number) -> this
    동작: 목표 속성 객체를 보관하고 duration이 undefined가 아니면 재생 시간을 교체한 뒤 자신을 반환한다.

TWEEN.Tween.pause() -> void
    동작:
        _paused가 true이면 종료한다.
        _paused가 false이면:
            일시정지 상태와 Date의 현재 밀리초를 저장하고 실행 목록에서 자신을 제거한다.

TWEEN.Tween.play() -> void
    동작:
        _paused가 false이면 종료한다.
        _paused가 true이면:
            정지 시간을 시작 시각에 더하고 정지 상태를 해제한 뒤 실행 목록에 다시 등록한다.

TWEEN.Tween.start(time?: number) -> this
    의존: Web API — 기본 단조 시각; 함수: {performance.now()}
    동작:
        실행 목록에 자신을 등록하고 재생 상태와 시작 콜백 미호출 상태를 설정한다.
        제공 시각 또는 performance.now와 Date.now의 기존 선택 결과에 지연 시간을 더해 시작 시각을 정한다.
        목표 배열이 비었으면 해당 속성의 시작값 구성을 건너뛴다. 비어 있지 않으면 현재 속성값을 앞에 붙인 새 배열을 목표로 저장한다.
        대상의 현재 값을 시작값으로 읽고 배열 이외는 숫자로 변환한다. 반복용 시작값은 그 값 또는 0으로 저장한 뒤 자신을 반환한다.

TWEEN.Tween.stop() -> this
    동작:
        _isPlaying이 false이면 자신을 반환한다.
        _isPlaying이 true이면:
            실행 목록에서 자신을 제거하고 재생 상태를 해제한다.
            중단 콜백이 있으면 대상을 this로 호출한다.
            연결 트윈들을 중단한 뒤 자신을 반환한다.

TWEEN.Tween.stopChainedTweens() -> void
    동작: 연결 목록의 각 트윈에 stop을 호출한다. 빈 목록이면 호출하지 않는다.

TWEEN.Tween.delay(amount: number) -> this
    동작: 시작 지연 시간을 저장하고 자신을 반환한다.

TWEEN.Tween.repeat(times: number) -> this
    동작: 남은 반복 횟수를 저장하고 자신을 반환한다. Infinity이면 횟수를 차감하지 않는다.

TWEEN.Tween.yoyo(yoyo: boolean) -> this
    동작: 반복 때 시작값과 끝값을 뒤집을지 저장하고 자신을 반환한다.

TWEEN.Tween.easing(easing: Function) -> this
    동작: 진행률을 변환할 완화 함수를 저장하고 자신을 반환한다.

TWEEN.Tween.interpolation(interpolation: Function) -> this
    동작: 배열 목표를 보간할 함수를 저장하고 자신을 반환한다.

TWEEN.Tween.chain() -> this
    동작: 전달된 arguments를 연결 목록으로 저장하고 자신을 반환한다.

TWEEN.Tween.onStart(callback: Function) -> this
    동작: 시작 콜백을 저장하고 자신을 반환한다. 콜백은 대상을 this로 받는다.

TWEEN.Tween.onUpdate(callback: Function) -> this
    동작: 갱신 콜백을 저장하고 자신을 반환한다. 콜백은 대상을 this로, 완화된 진행률을 인수로 받는다.

TWEEN.Tween.onComplete(callback: Function) -> this
    동작: 완료 콜백을 저장하고 자신을 반환한다. 콜백은 대상을 this로 받는다.

TWEEN.Tween.onStop(callback: Function) -> this
    동작: 중단 콜백을 저장하고 자신을 반환한다. 콜백은 대상을 this로 받는다.

TWEEN.Tween.update(time: number) -> boolean
    동작:
        시작 시각 전이면 속성과 콜백을 바꾸지 않고 true를 반환한다.
        첫 갱신이면 시작 콜백을 호출하고 첫 호출 완료를 기록한다.
        재생 시간이 0이면 진행률을 1로 정하고 그 외에는 경과 시간을 재생 시간으로 나눈다. 1보다 큰 값만 1로 제한한 뒤 완화 함수를 적용한다.
        배열 목표는 보간 함수로 계산한다. 문자열 목표는 시작값 기준 상대 숫자로 해석하며 숫자 목표만 선형 보간해 대상에 쓴다.
        갱신 콜백이 있으면 완화된 진행률을 전달한다.
        갱신 콜백 뒤 _isPlaying이 false이면 완료 콜백과 연결 트윈을 실행하지 않고 false를 반환한다.
        진행률이 1이고 반복이 남았으면 유한 횟수를 차감하고 상대 목표·yoyo 방향과 시작값을 갱신한 뒤 현재 시각과 지연으로 재시작하여 true를 반환한다.
        진행률이 1이고 반복이 없으면 완료 콜백을 호출하고 연결 트윈을 같은 시각으로 시작한 뒤 false를 반환한다.
        그 외에는 true를 반환한다.

TWEEN.Tween.setForce(bool: unknown) -> void
    동작: 값을 boolean으로 변환해 지역 강제 표식에 저장한다. 현재 stop 경로는 이 표식을 검사하지 않는다.

TWEEN.Easing: object
TWEEN.Easing.Linear: object
TWEEN.Easing.Quadratic: object
TWEEN.Easing.Cubic: object
TWEEN.Easing.Quartic: object
TWEEN.Easing.Quintic: object
TWEEN.Easing.Sinusoidal: object
TWEEN.Easing.Exponential: object
TWEEN.Easing.Circular: object
TWEEN.Easing.Elastic: object
TWEEN.Easing.Back: object
TWEEN.Easing.Bounce: object
TWEEN.Easing.Linear.None(k: number) -> number
    동작: 입력 진행률을 반환한다.
TWEEN.Easing.Quadratic.In(k: number) -> number
    동작: 이차 진입 곡선 k의 제곱을 반환한다.
TWEEN.Easing.Quadratic.Out(k: number) -> number
    동작: 이차 이탈 곡선 k 곱하기 2-k를 반환한다.
TWEEN.Easing.Quadratic.InOut(k: number) -> number
    동작: 중간점 전후를 나누어 이차 진입과 이탈 곡선을 연결한다.
TWEEN.Easing.Cubic.In(k: number) -> number
    동작: 삼차 진입 곡선을 반환한다.
TWEEN.Easing.Cubic.Out(k: number) -> number
    동작: 끝점 기준 삼차 이탈 곡선을 반환한다.
TWEEN.Easing.Cubic.InOut(k: number) -> number
    동작: 중간점 전후를 나누어 삼차 진입과 이탈을 연결한다.
TWEEN.Easing.Quartic.In(k: number) -> number
    동작: 사차 진입 곡선을 반환한다.
TWEEN.Easing.Quartic.Out(k: number) -> number
    동작: 끝점 기준 사차 이탈 곡선을 반환한다.
TWEEN.Easing.Quartic.InOut(k: number) -> number
    동작: 중간점 전후를 나누어 사차 진입과 이탈을 연결한다.
TWEEN.Easing.Quintic.In(k: number) -> number
    동작: 오차 진입 곡선을 반환한다.
TWEEN.Easing.Quintic.Out(k: number) -> number
    동작: 끝점 기준 오차 이탈 곡선을 반환한다.
TWEEN.Easing.Quintic.InOut(k: number) -> number
    동작: 중간점 전후를 나누어 오차 진입과 이탈을 연결한다.
TWEEN.Easing.Sinusoidal.In(k: number) -> number
    동작: 코사인으로 완만하게 시작하는 곡선을 반환한다.
TWEEN.Easing.Sinusoidal.Out(k: number) -> number
    동작: 사인으로 완만하게 끝나는 곡선을 반환한다.
TWEEN.Easing.Sinusoidal.InOut(k: number) -> number
    동작: 코사인으로 시작과 끝을 완화한 곡선을 반환한다.
TWEEN.Easing.Exponential.In(k: number) -> number
    동작: 입력 0은 0으로 보존하고 1024의 지수 진입 곡선을 반환한다.
TWEEN.Easing.Exponential.Out(k: number) -> number
    동작: 입력 1은 1로 보존하고 2의 지수 이탈 곡선을 반환한다.
TWEEN.Easing.Exponential.InOut(k: number) -> number
    동작: 양 끝점을 보존하고 중간점에서 지수 진입과 이탈을 연결한다.
TWEEN.Easing.Circular.In(k: number) -> number
    동작: 원호 진입 곡선을 제곱근으로 계산한다.
TWEEN.Easing.Circular.Out(k: number) -> number
    동작: 끝점 기준 원호 이탈 곡선을 제곱근으로 계산한다.
TWEEN.Easing.Circular.InOut(k: number) -> number
    동작: 중간점에서 원호 진입과 이탈을 연결한다.
TWEEN.Easing.Elastic.In(k: number) -> number
    동작: 양 끝점을 보존하고 주기 0.4의 지수·사인 탄성 진입 곡선을 계산한다.
TWEEN.Easing.Elastic.Out(k: number) -> number
    동작: 양 끝점을 보존하고 주기 0.4의 감쇠 지수·사인 탄성 이탈 곡선을 계산한다.
TWEEN.Easing.Elastic.InOut(k: number) -> number
    동작: 양 끝점을 보존하고 중간점에서 탄성 진입과 이탈을 연결한다.
TWEEN.Easing.Back.In(k: number) -> number
    동작: 상수 1.70158을 사용하는 되당김 진입 곡선을 반환한다.
TWEEN.Easing.Back.Out(k: number) -> number
    동작: 끝점 기준 되당김 이탈 곡선을 반환한다.
TWEEN.Easing.Back.InOut(k: number) -> number
    동작: 되당김 계수에 1.525를 곱하고 중간점 전후 곡선을 연결한다.
TWEEN.Easing.Bounce.In(k: number) -> number
    동작: 1-k의 반동 이탈을 반전하여 진입값을 계산한다.
TWEEN.Easing.Bounce.Out(k: number) -> number
    동작: 2.75로 나눈 세 경계를 기준으로 네 이차식 구간의 반동값을 반환한다.
TWEEN.Easing.Bounce.InOut(k: number) -> number
    동작: 중간점 전에는 반동 진입을 절반 축소하고 이후에는 반동 이탈을 절반 축소하여 0.5를 더한다.

TWEEN.Interpolation: object
TWEEN.Interpolation.Utils: object
TWEEN.Interpolation.Linear(v: Array<number>, k: number) -> number
    동작: 진행률에 해당하는 인접 구간을 선형 보간하고 범위 밖은 첫 구간 또는 마지막 구간으로 외삽한다.
TWEEN.Interpolation.Bezier(v: Array<number>, k: number) -> number
    동작: 각 제어점에 Bernstein 계수와 진행률 거듭제곱을 곱한 값을 합산한다.
TWEEN.Interpolation.CatmullRom(v: Array<number>, k: number) -> number
    동작: 처음과 끝 제어점이 같으면 순환 인덱스로, 그 외에는 끝점 복제와 외삽으로 네 제어점의 삼차 곡선을 계산한다.
TWEEN.Interpolation.Utils.Linear(p0: number, p1: number, t: number) -> number
    동작: 두 점의 차이에 t를 곱한 뒤 첫 점을 더한다.
TWEEN.Interpolation.Utils.Bernstein(n: number, i: number) -> number
    동작: n의 팩토리얼을 i와 n-i의 팩토리얼 곱으로 나눈다.
TWEEN.Interpolation.Utils.Factorial(n: number) -> number
    동작: 지역 배열에 저장된 값이 있으면 재사용하고 아니면 2부터 n까지 곱한 값을 저장해 반환한다.
TWEEN.Interpolation.Utils.CatmullRom(p0: number, p1: number, p2: number, p3: number, t: number) -> number
    동작: 양쪽 이웃 점의 차이로 절반 접선을 계산하고 두 끝점과 접선을 삼차식으로 보간한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
