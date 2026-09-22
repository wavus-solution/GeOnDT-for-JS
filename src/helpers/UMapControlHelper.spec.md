# UMapControlHelper 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UMapControlHelper`는 지도 조작 기준점과 커서를 원형 메시 두 개로 표시한다. 위치·가시성·카메라 방향에 따른 회전·표시 크기를 외부 호출로 갱신한다.

### 1.2 책임 범위

원형 geometry 하나, 기준점·커서 material 두 개와 메시 두 개를 생성·관리한다. 디버그 옵션을 켜면 조작 컨트롤러의 target을 추적하는 구형 메시와 렌더 직전 callback을 추가한다.

### 1.3 주요 동작 방식

두 표시 메시는 같은 geometry를 공유하며 처음에는 숨겨진 상태로 앱의 기본 장면에 등록된다. 현재 앱 카메라가 직교 카메라인지에 따라 표시 크기와 바라보는 방향을 계산한다. 일반 표시의 위치·크기 갱신은 호출자가 수행하고 디버그 표시는 렌더 callback에서 갱신한다.

### 1.4 주요 사용처와 연계 대상

`UMapControlBase.enableCheckHelper()`가 생성하고 `disableCheckHelper()`가 해제한다. 앱의 장면·현재 카메라·렌더 callback과 `UDEF`의 앵커 텍스처·기준 해상도를 사용한다.

## 3. 정규 자연어 수도코드

```spec
UMapControlHelperCO 타입 정의
    app: U3dApp
        장면·현재 카메라·렌더 callback을 제공하는 앱
    drawArg: UDrawArg
        생성 시 보관하며 이후 이 클래스의 계산에서는 읽지 않는 실행 인자
    camera: UCamera
        필수로 선언되어 있으나 구현은 이 필드를 읽지 않고 앱의 현재 카메라를 사용한다. [확인 Q-001]
    controller: UMapControlBase
        디버그 메시가 추적하는 target의 소유자
    color: string | number | Color
        텍스처 없는 기준점 메시의 초기 색상
    isDebug: boolean
        구형 target 표시와 렌더 callback 생성 여부

UMapControlHelper 클래스 정의
    isDisposed: boolean = false
        외부에서도 쓸 수 있으며 표시 제어 메서드의 조기 반환을 결정하는 해제 상태

    #animationId: 타이머 식별자 | undefined = undefined
        가시성 반전 예약의 식별자

    #debugEventId: string = 'UMapControlHelper_Debug'
        디버그 렌더 callback의 등록·해제 키

    constructor(option: UMapControlHelperCO)
        의존:
            U3dApp — 장면·카메라·렌더 callback; 함수: {getScene(), getCamera(), setRenderBefore()}
            UDEF — 텍스처·크기 환산 기준; 속성 읽기: {RESOURCE.ANCHOR_POINT.TEXTURE, PIXEL_RESOLUTION.QHD}
            THREE — 표시용 자원; 생성자: {new CircleGeometry(), new SphereGeometry(), new MeshBasicMaterial()}
            UMesh — 기준점·커서·디버그 메시; 생성자: {new UMesh()}; 속성 쓰기: {renderOrder, receiveShadow, castShadow, visible, position, scale}
            Scene — 메시 등록; 함수: {add()}
            UMapControlBase — 추적 위치; 속성 읽기: {target}
            UCamera — 원근 크기 계산; 함수: {getDenominator()}; 속성 읽기: {position}
            UOrthographicCamera — 직교 크기 계산; 속성 읽기: {isOrthographicCamera, top, bottom, zoom}
            Vector3 — 원근 거리 계산; 함수: {distanceTo()}
        동작:
            앱·실행 인자·컨트롤러를 보관한다. color가 falsy이면 0x00ff00, isDebug가 falsy이면 false를 사용한다.
            반지름 1, 분할 수 16인 원형 geometry를 생성한다.
            앵커 텍스처가 있으면 기준점 material에 해당 텍스처와 색상 0xC7C7C7을 지정한다.
            텍스처가 없으면 기준점 material에 선택된 color와 opacity 0.15를 지정한다.
            커서 material은 빨간색으로 생성하며 두 material 모두 transparent를 켜고 depthTest를 끈다.
            같은 geometry로 기준점·커서 메시를 생성하고 renderOrder를 각각 1000·999로 지정한다.
            두 메시의 그림자 수신·투영과 가시성을 끄고 앱 장면에 등록한다.
            디버그가 켜져 있으면 반지름 1, 가로·세로 분할 수 24의 구형 geometry와 빨간색·depthTest false의 별도 material을 생성한다.
                구형 메시의 renderOrder를 1000으로 지정해 장면에 등록한다.
            디버그가 켜져 있으면 #debugEventId로 다음 렌더 직전 callback을 등록한다.
                구형 메시의 위치에 현재 controller.target을 복사한다.
                앱의 현재 카메라에서 isOrthographicCamera가 truthy이면 크기를 8 × (top - bottom) / zoom / QHD 높이로 정한다.
                그 밖에는 크기를 8 × 카메라와 target의 거리 × (getDenominator() 결과 또는 1) / QHD 높이로 정한다.
                계산한 크기를 구형 메시의 세 축 스케일에 적용한다.

    dispose() -> void
        의존:
            U3dApp — 장면·디버그 callback 해제; 함수: {getScene(), removeRenderBefore()}
            Scene — 메시 제거; 함수: {remove()}
            BufferGeometry — 원형·구형 geometry 해제; 함수: {dispose()}
            Material — 표시 material 해제; 함수: {dispose()}
        동작:
            디버그가 켜져 있으면 #debugEventId의 callback을 해제한다.
            디버그 메시가 있으면 장면에서 제거하고 그 geometry·material을 해제한 뒤 메시 참조를 비운다.
            기준점·커서 메시가 있으면 앱 장면에서 각각 제거한다.
            공유 원형 geometry와 두 material을 해제한 뒤 기준점·커서 메시 참조를 비운다.
            isDisposed를 true로 바꾼다. 이미 해제된 상태에 대한 조기 반환은 없다.
            예약된 가시성 타이머는 취소하지 않는다. 나중에 실행되는 callback의 표시 변경은 isDisposed 검사로 중단된다.

    computeSize(position: Vector3) -> this
        인터페이스: position은 원근 카메라와 표시 위치 사이의 거리를 계산하는 기준이다.
        의존:
            U3dApp — 현재 카메라 선택; 함수: {getCamera()}
            UDEF — 기준 해상도; 속성 읽기: {PIXEL_RESOLUTION.QHD}
            UCamera — 원근 크기 환산; 함수: {getDenominator()}; 속성 읽기: {position}
            UOrthographicCamera — 직교 분기·시야 높이; 속성 읽기: {isOrthographicCamera, top, bottom, zoom}
            Vector3 — 원근 거리 계산; 함수: {distanceTo()}
            UMesh — 표시 크기; 속성 쓰기: {scale}
        동작:
            isDisposed가 true이면 즉시 자신을 반환한다.
            앱의 현재 카메라가 직교이면 (top - bottom) / zoom / QHD 높이를 단위 크기로 사용한다.
                기준점 스케일은 단위 크기 × 20, 커서 스케일은 단위 크기 × 20 × 2 / 9로 설정한다.
            원근이면 카메라와 position 사이 거리 × (getDenominator() 결과 또는 1) / QHD 높이를 단위 크기로 사용한다.
                기준점 스케일은 단위 크기 × 18, 커서 스케일은 단위 크기 × 3으로 설정한다.
            카메라를 기준으로 표시 방향을 갱신하고 자신을 반환한다.

    setVisible(visible: boolean = false, autoHide: boolean = false) -> this
        의존: Web API — 가시성 반전 예약; 함수: {clearTimeout(), setTimeout()}
        동작:
            isDisposed가 true이면 즉시 자신을 반환한다.
            예약 식별자가 truthy이면 기존 타이머를 취소한다.
            autoHide가 true이면 200ms 뒤 visible의 반대 값을 기본 autoHide로 적용한 뒤 예약 식별자를 비우는 callback을 등록한다.
            존재하는 기준점·커서 메시의 visible을 입력값으로 바꾸고 자신을 반환한다.

    setPosition(position: Vector3) -> this
        동작:
            isDisposed가 true이면 즉시 자신을 반환한다.
            기준점·커서 메시가 있으면 각각의 position에 입력 벡터의 값을 복사한다.
            표시 방향을 갱신하고 자신을 반환한다.

    lookAt(position?: Vector3) -> this
        의존:
            U3dApp — 현재 카메라 선택; 함수: {getCamera()}
            UOrthographicCamera — 직교 분기·방향; 속성 읽기: {isOrthographicCamera, quaternion}
            UCamera — 원근 시선 대상; 속성 읽기: {position}
            Vector3 — 카메라 방향 변환; 함수: {applyQuaternion()}
            UMesh — 메시 방향 변경; 함수: {lookAt()}
        동작:
            isDisposed가 true이면 즉시 자신을 반환한다.
            앱의 현재 카메라가 직교이면 (0, 0, -1)을 카메라 quaternion으로 회전한다.
                기준점 메시가 있으면 그 위치에서 회전한 방향 벡터를 뺀 지점을 두 메시가 바라보게 한다. 입력 position은 사용하지 않는다.
            원근이면 position이 null 또는 undefined일 때 카메라 위치를 사용하고, 그 밖에는 입력 위치를 두 메시의 시선 대상으로 사용한다.
            자신을 반환한다.

    setColor(color: string | number | Color) -> this
        동작:
            isDisposed가 true이면 즉시 자신을 반환한다.
            #color에 입력값만 저장하고 자신을 반환한다. 생성된 material의 색상은 바꾸지 않는다. [확인 Q-002]
```

## 4. 공통 처리 기준과 제약

```spec
현재 카메라를 읽는 내부 접근자와 직교 카메라 판정 보조 함수는 각 호출자의 카메라 선택·분기 동작에 포함된다.
공유 작업 벡터 forward·lookTarget은 lookAt()의 계산용이며 호출자가 전달한 위치 벡터를 변경하지 않는다.
타입 선언의 필수 필드 여부와 별개로 생성자는 color·isDebug에 || 기반 기본값을 적용하며 잘못된 앱·컨트롤러 입력을 별도로 검증하지 않는다.
두 메시가 공유하는 원형 geometry는 helper가 해제하며 UDEF에서 가져온 앵커 텍스처는 helper가 직접 해제하지 않는다.
일반 표시 제어는 디버그 구형 메시의 가시성을 함께 변경하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
