# UAnimationManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

장면의 애니메이션 컨트롤러를 등록하고 앱이 지정한 청크별로 외부 갱신을 실행한다. 한 순환의 대상 목록과 기준 시각을 고정하여 작업을 분산하며, 이동·회전 보간 자체는 각 UAnimationController가 담당한다.

## 3. 정규 자연어 수도코드

```spec
UAnimationManager 클래스 정의
    #app: U3dApp
        draw 작업을 요청할 앱 참조
    #controllers: Array<AnimationController>
        현재 등록된 컨트롤러의 원본 배열
    #index: Map<AnimationController, number>
        컨트롤러별 원본 배열 위치
    #isRunning: boolean
        매니저의 실행 상태 표시
    #frameSnapshot: Array<AnimationController>
        현재 청크 순환의 고정 대상 목록
    #frameUnitSize: number
        한 청크에 배정할 대상 수
    #frameNow: number
        현재 순환에 공유하는 performance 기준 밀리초 시각
    #lastUpdateErrorTime: WeakMap<AnimationController, number> = 빈 WeakMap
        컨트롤러별 마지막 오류 경고 시각

    constructor(app: U3dApp)
        의존:
            defined — 앱 존재 판정; 함수: {defined()}
            U3dMessage — 앱 누락 오류 보고; 함수: {__GError__()}
        동작:
            app이 null 또는 undefined이면 __GError__에 현재 객체, 앱 누락 메시지와 코드 '4986317'을 전달하고 반환한다.
                이 경로에서는 #lastUpdateErrorTime만 필드 초기화되고 나머지 관리 상태는 초기화되지 않는다. [확인 Q-003]
            app을 #app에 저장하고 #controllers와 #frameSnapshot을 빈 배열, #index를 빈 Map으로 초기화한다.
            #isRunning을 false, #frameUnitSize와 #frameNow를 0으로 설정한다.

    getControllers() -> Array<AnimationController> | undefined
        동작:
            #controllers의 원본 참조를 반환하므로 호출자의 배열 변경이 등록 목록에 직접 반영된다.
            생성자가 앱 누락으로 조기 반환한 객체에서는 undefined를 반환한다. [확인 Q-003]

    add(controller: AnimationController) -> void
        동작:
            controller가 falsy이거나 #index에 이미 등록되어 있으면 변경 없이 반환한다.
            현재 배열 끝 위치를 #index에 기록하고 controller를 #controllers 끝에 추가한다.

    remove(controller: AnimationController) -> void
        동작:
            #index에서 controller의 위치를 찾지 못하면 반환한다.
            해당 위치를 마지막 컨트롤러로 대체한 뒤 배열 끝과 대상의 인덱스 항목을 제거한다.
            마지막 컨트롤러가 제거 대상과 다르면 옮겨진 위치를 #index에 반영한다.
            컨트롤러의 정지·폐기는 호출하지 않고 기존 #frameSnapshot과 오류 경고 시각은 유지한다.

    start() -> void
        동작: #isRunning을 true로 설정한다.

    stop() -> void
        동작: #isRunning을 false로 설정한다.

    update(nowChunkIndex: number, totalChunkIndex: number) -> void
        역할: 현재 청크의 등록 컨트롤러를 공통 시각으로 갱신한다.
        인터페이스:
            nowChunkIndex는 0부터 시작하는 청크 번호이며 totalChunkIndex는 전체 청크 수이다.
            JSDoc은 두 인수를 필수 number로 선언하지만 실행 중에는 누락값을 보정한다. [확인 Q-002]
        의존:
            defined — 스냅샷 항목 존재 판정; 함수: {defined()}
            U3dApp(#app) — draw 작업 요청; 함수: {drawWork()}
            UAnimationController(controller) — 갱신 대상 판정과 실행; 함수: {updateExternally()}; 속성 읽기: {isRunning, isPaused, disposed}
            Web API — 순환·오류 시각 측정과 경고 출력; 함수: {performance.now(), console.warn()}
        동작:
            등록 수가 0이면 #frameSnapshot을 비우고 #frameUnitSize를 0으로 설정한다.
                실행 중이면 stop을 선택적으로 호출한 뒤 반환하며 #frameNow와 오류 경고 시각은 유지한다.
                이미 정지 상태여도 반환한다.
            등록 대상이 있고 정지 상태이면 실행 상태로 전환한다.
            #app.drawWork(20)을 호출한다.
            nowChunkIndex가 null 또는 undefined이면 청크 번호 0을 사용한다.
            totalChunkIndex가 number이고 0보다 클 때만 그대로 사용하며 그 외에는 전체 청크 수 1을 사용한다. [확인 Q-002]
            청크 번호가 0이거나 #frameSnapshot이 없거나 비어 있으면 순환을 새로 준비한다.
                #frameNow에 performance.now()를 저장한다.
                기존 #frameSnapshot 배열을 비운 뒤 진입 시 등록 수만큼 #controllers의 항목 참조를 복사한다.
                스냅샷 길이를 전체 청크 수로 나눈 값을 올림하여 #frameUnitSize에 저장한다.
            그 외에는 기존 스냅샷, 청크 크기와 시각을 재사용하며 긴 실행 공백을 별도로 판정하지 않는다. [확인 Q-001]
            스냅샷이 비어 있거나 청크 크기가 0 이하이면 반환한다.
            시작 위치는 청크 번호와 청크 크기의 곱으로, 끝 위치는 시작 위치에 청크 크기를 더한 값과 스냅샷 길이 중 작은 값으로 정한다.
            시작 위치가 스냅샷 길이 이상이면 반환한다.
            시작 위치부터 끝 위치 직전까지 스냅샷 항목을 순서대로 확인한다.
                항목이 null 또는 undefined이거나 현재 #index에 없으면 건너뛴다.
                실행 중도 일시 정지도 아닌 항목 또는 disposed인 항목은 등록에서 제거하고 건너뛴다.
                나머지 항목은 일시 정지 상태도 포함하여 controller를 수신 객체로 updateExternally에 #frameNow를 전달한다.
                updateExternally 호출에서 발생한 예외를 잡고 실제 현재 시각을 다시 측정한다.
                    해당 컨트롤러의 경고 이력이 없거나 마지막 경고 이후 5000ms 이상이면 #lastUpdateErrorTime을 현재 시각으로 갱신한다.
                        console.warn에 '[UAnimationManager] 컨트롤러 갱신 실패:', controller와 예외를 전달한다.
                    경고 간격 미만이면 경고를 생략하고 다음 항목으로 진행한다.
                    실패한 컨트롤러를 제거하지 않으므로 이후 순환에서도 갱신을 시도한다.
```

## 4. 공통 처리 기준과 제약

```spec
AnimationController는 UAnimationController를 참조하는 타입 별칭이며 이 단위에서 별도 구조를 소유하지 않는다.
정상 생성된 객체의 등록 변경은 add와 remove로 관리한다. getControllers가 반환한 원본 배열을 직접 변경하면 #index는 자동으로 동기화되지 않는다.
start와 stop은 상태 표시만 변경하며 컨트롤러 자체의 실행·일시 정지나 앱의 호출 예약을 제어하지 않는다.
스냅샷에 없는 신규 대상은 다음 스냅샷 생성 때 반영하며, 제거된 대상은 현재 등록 여부로 실행에서 제외한다. 같은 객체가 실행 차례 전에 재등록되면 기존 스냅샷 항목으로 실행될 수 있다.
remove로 제거되어도 기존 스냅샷 참조는 다음 재구성 또는 등록 수 0인 update까지 남을 수 있다.
update의 예외 격리는 updateExternally 호출에만 적용하며 drawWork와 상태 속성 조회, 오류 보고 자체의 예외까지 포괄하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
