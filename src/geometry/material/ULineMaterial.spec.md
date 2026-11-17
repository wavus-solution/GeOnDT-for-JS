# ULineMaterial 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`ULineMaterial`은 실선·점선과 불투명·반투명 선의 외곽·끝점·대시 경계에 픽셀 커버리지를 적용한다. MSAA가 없는 촬영 대상에서도 색상 패스의 경계 블렌딩을 사용한다.

### 1.2 책임 범위

- 색상용 재질을 투명 렌더 목록에서 합성하되 opacity가 1인 선 내부는 불투명하게 유지한다.
- 요청된 transparent·blending·alphaToCoverage 상태와 실제 색상 패스의 상태를 구분한다.
- 두께 단위, 대시 길이·간격·오프셋, 깊이 설정과 geometry 데이터를 보존하며 셰이더에서 필터 영역만 확장한다.
- 실제 뷰포트·DPR과 복제·사용자 렌더 콜백을 관리한다.

### 1.3 주요 동작 방식

기반 생성자가 만든 인스턴스에 커버리지 상태를 연결하고, vertex shader에서 외곽 물리 픽셀 1개의 필터 영역을 확보한다. 화면 두께는 화면 선형 UV로 계산하고 월드 두께는 카메라 ray와 선분의 거리를 사용한다. fragment shader는 유한 선분으로 자른 대시 적분과 외곽 커버리지를 alpha에 반영한다. 데이터 패스는 커버리지 모드를 끄고 기반 마스크를 사용한다.

월드 두께의 직선과 둥근 끝마개는 같은 광선·선분의 실제 거리와 반지름을 사용한다. 직선의 부호만 옆 방향에서 정하며, 끝마개에는 부호 반전이 불연속인 직선 커버리지를 중복 적용하지 않는다. 가까운 원근 시점에서도 직선이 끝마개보다 넓어지거나 원 내부에 AA 이음매가 생기지 않는다.

공유 정점의 이웃 attribute와 U_LINE_JOIN define이 있으면 실선 연결부를 화면 이등분선으로 나누어 같은 영역이 여러 번 합성되지 않게 한다. 경계에 놓인 픽셀은 한 선분만 소유하고 실제 viewport의 위치·크기를 사용한다. 이 마스크는 색상과 좌표 출력에 공통으로 적용하며 점선에는 적용하지 않는다. 월드 두께의 직교 투영은 평행 시선과 투영 평면의 선분 거리로 계산한다.

### 1.4 주요 사용처와 연계 대상

- `U3dLine`과 `ULandNormalDirectionHelper`가 색상 재질로 사용한다.
- `createLineSegmentsWorldPositionMaterial()`이 복제본을 데이터 출력 모드로 전환한다.
- `U3dApp.createRenderer()`가 앱 renderer를 생성 직후 자동 연결하며, 일반 Three.js renderer는 attachRenderer로 연결한다.

## 2. 요구사항과 품질 기준

```spec
실선·점선과 불투명·반투명 조합 모두 경계 AA를 사용해야 한다.
MSAA 없는 렌더 대상에서도 경계 커버리지가 표시되어야 한다.
opacity가 1인 선 내부는 불투명하게 유지해야 한다.
유효한 실제 점선 주기와 점유율을 고정 최소 주기로 변경하지 않아야 한다.
좌표 출력용 마스크에는 색상용 확장·블렌딩을 적용하지 않아야 한다.
depthTest·depthWrite와 렌더 객체 수·geometry 데이터를 변경하지 않아야 한다.
연결된 renderer에서는 사용자 콜백의 일반 할당·메서드·클래스 필드 선언과 관계없이 실제 그리기 직전에 AA 값을 갱신해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
ULineMaterial extends LineMaterial 클래스 정의
    의존: LineMaterial — 선 재질의 기반; 상속: {LineMaterial}

    static attachRenderer(renderer: WebGLRenderer) -> void
        동작:
            renderer 계약을 확인한다.
            실제 draw 직전에 AA를 갱신하도록 renderer를 연결한다.

    static detachRenderer(renderer: WebGLRenderer) -> void
        동작:
            renderer 계약을 확인한다.
            연결이 소유한 함수만 복원하고 연결 상태를 해제한다.

    vertexShader: string
        기반 초기화 뒤 initializeMaterial이 상태·uniform·렌더 연결과 외곽 필터 영역을 구성한 값

    fragmentShader: string
        createFragmentShader가 실선·점선 공통 커버리지와 기반 데이터 마스크를 구성한 값

    override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, object: Object3D, group: Group | null) -> void
        동작:
            연결되지 않은 renderer의 기존 콜백 경로에서 AA uniform을 갱신한다.

    _setLineCoverageEnabled(enabled: boolean) -> void
        동작:
            내부 색상 패스 모드를 전환한다.

    override copy(source: this) -> this
        의존: LineMaterial — 기반 재질의 상태와 uniform 복사; 함수: {copy()}
        동작:
            기반 copy를 호출한다.
            요청 상태와 커버리지 모드를 복사한다.
            복사된 vertex·fragment shader를 중복 없이 확장한 뒤 현재 재질을 반환한다.

ULineCoverageState 타입 정의
    enabled: boolean
    requestedTransparent: boolean
    requestedBlending: Blending
    requestedAlphaToCoverage: boolean
    viewport: Vector4
    mainResolution: Vector2
    renderHook?: Material.onBeforeRender

ULineRendererBinding 타입 정의
    active: boolean
    originalRenderBufferDirect: WebGLRenderer.renderBufferDirect
    originalDispose: WebGLRenderer.dispose
    renderBufferDirect: WebGLRenderer.renderBufferDirect
    dispose: WebGLRenderer.dispose

assertRenderer(renderer: WebGLRenderer) -> void
    동작:
        renderer가 없거나 isWebGLRenderer가 true가 아니거나 필요한 draw·dispose·뷰포트·DPR·대상 조회 메서드가 없으면 TypeError를 발생시킨다.

```

## 4. 공통 처리 기준과 제약

```spec
재질 인스턴스별 셰이더만 바꾸고 전역 ShaderLib는 변경하지 않는다.
요청 상태와 콜백 관계는 WeakMap으로 관리하고 프레임마다 임시 뷰포트 객체를 생성하지 않는다.
사용자 onBeforeCompile 콜백의 복사 여부는 기반 Three.js 계약을 따른다.
데이터 출력 모드는 vertex·fragment의 U_LINE_ANTIALIAS 매크로도 비활성화한다.
renderer 연결은 기존 draw·dispose와 외부에서 추가한 래퍼를 보존하며 dispose 시 자동 해제한다.
일반 Three.js에서 클래스 필드 콜백을 사용할 때는 renderer 생성 후 attachRenderer를 호출한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
