# USkyLinePass 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지형과 전체 모델의 깊이를 각각 렌더링하여 스카이라인 경계와 영역별 색상을 표시하고, 분석용 화면 배열을 비동기로 제공한다.

### 1.2 책임 범위

깊이·부호화 렌더 대상과 재질을 소유하고 크기·스타일·카메라를 갱신한다. 화면 읽기는 렌더 프레임에서 수행하고 완료 데이터를 요청자에게 전달한다.

### 1.3 주요 동작 방식

지형 이외의 객체를 잠시 숨겨 지형 깊이를 얻은 뒤 표시를 복원하여 전체 깊이를 얻는다. 캡처 시작 전 요청만 하나의 읽기를 공유하고, 읽기 시작 후의 조회는 다음 캡처에 배정한다. 버퍼 정리·해제는 대기와 읽기 중인 모든 요청을 취소한다.

### 1.4 주요 사용처와 연계 대상

`URenderer`가 생성·활성화하며 `UAnalySkyLine`이 스타일 설정, 화면 조회와 버퍼 정리를 요청한다. `GSkyLineShader`와 `GSkyLingEncodingMaterial`은 화면 표시와 부호화를 담당한다.

## 3. 정규 자연어 수도코드

```spec
USkyLinePass extends ShaderPass 클래스 정의
    의존: ShaderPass — 후처리 기반; 상속: {ShaderPass}
    _disposed: boolean = false
        해제 후 재사용과 중복 해제를 막는 엔진 내부 상태다.
    #renderDepth: number = 0
        진행 중인 렌더 호출 수다. 해제 요청 뒤 마지막 호출이 끝날 때 실제 자원을 회수한다.
    #far: number = 1000
    #near: number = 0.08
    #scene: Scene | undefined = undefined
    #camera: Camera | undefined = undefined
    #depthAllTexture: DepthTexture | undefined = undefined
    #depthAllRenderTarget: WebGLRenderTarget | undefined = undefined
    #depthTerrainTexture: DepthTexture | undefined = undefined
    #depthTerrainRenderTarget: WebGLRenderTarget | undefined = undefined
    #encodingMaterial: GSkyLingEncodingMaterial | undefined = undefined
    #encodingRenderTarget: WebGLRenderTarget | undefined = undefined
    #pixelBuffer: Float32Array | undefined = undefined
        완료한 읽기에서 다음 읽기에 재사용할 수 있는 배열 하나를 보관한다. 진행 중인 GPU 읽기의 배열은 보관하지 않는다.
    #density: number = 0.6
    #lineSize: number = 5.0
    #lineColor: Color
        RGB (1, 0, 0)으로 생성한다.
    #overColor: Color
        RGB (0.8, 0, 0)으로 생성한다.
    #groundColor: Color
        RGB (0.8, 0.8, 0)으로 생성한다.
    #skyColor: Color
        RGB (0, 0, 0.8)으로 생성한다.
    #useGroundColor: boolean = true
    #useSkyColor: boolean = true
    #width: number | undefined = undefined
    #height: number | undefined = undefined
    #dataCapture: USkyLineCaptureRequest | undefined = undefined
        다음 캡처를 기다리는 조회들이 공유한다.
    #readingCaptures: Set<USkyLineCaptureRequest> = 빈 Set
        이미 시작한 읽기의 완료·실패·취소를 요청별로 추적한다.

    constructor(scene, camera, width, height)
        의존:
            ShaderPass — 표시 셰이더 연결; 생성자: {constructor()}; 속성 읽기: {uniforms}
            GSkyLineShader — 표시용 셰이더; 상수: {GSkyLineShader}
            DepthTexture — 깊이 텍스처; 생성자: {new DepthTexture()}
            WebGLRenderTarget — 렌더 대상; 생성자: {new WebGLRenderTarget()}
            GSkyLingEncodingMaterial — 분석용 부호화 재질; 생성자: {new GSkyLingEncodingMaterial()}
        동작:
            표시 셰이더로 부모를 초기화하고 scene·camera를 보관한다.
            지형과 전체 화면용 깊이 텍스처를 각각 만들고 HalfFloatType·깊이 텍스처 연결·stencilBuffer=false인 렌더 대상을 만든다.
            FloatType·stencilBuffer=false인 부호화 렌더 대상을 만들고 width·height와 표시 uniform의 깊이 텍스처·near·far·resolution을 설정한다.
            크기·두 깊이 텍스처·near·far를 부호화 재질에 전달한다.
            밀도·경계선·초과 색상·지면·하늘의 현재 기본값을 각각 적용한다.

    clearPixelBuffer()
        의존: UAbortError — 화면 요청 취소 사유; 생성자: {new UAbortError()}
        동작:
            #readingCaptures의 요청을 배열로 복사하고 #dataCapture가 truthy이면 그 요청도 추가한다.
            #dataCapture와 #pixelBuffer를 undefined로 바꾸고 #readingCaptures를 비운다.
            복사한 모든 요청의 Promise를 UAbortError로 거부한다. 늦은 GPU 완료는 읽기 집합에서 해당 요청을 삭제할 수 없어 무시된다.

    override dispose()
        동작:
            _disposed가 truthy이면 반환한다.
            진입 시 _disposed가 falsy이면:
                _disposed를 true로 먼저 설정하고 요청 취소·버퍼 정리를 수행한다.
                #renderDepth가 0이면 실제 자원을 해제한다. 렌더 중이면 실제 해제는 마지막 render의 finally로 미룬다.

    #disposeResources()
        의존:
            DepthTexture — 소유 텍스처 해제; 함수: {dispose()}
            WebGLRenderTarget — 소유 렌더 대상 해제; 함수: {dispose()}
            GSkyLingEncodingMaterial — 소유 부호화 재질 해제; 함수: {dispose()}
            ShaderPass — 기반 재질·전체 화면 도형 해제; 함수: {dispose()}
        동작:
            존재하는 전체 깊이 텍스처·렌더 대상, 지형 깊이 텍스처·렌더 대상, 부호화 렌더 대상·재질을 순서대로 해제한다.
            자원 하나의 dispose가 예외를 던져도 나머지 해제를 계속 시도하며 최초 예외 값을 보관한다. 부모 dispose도 한 번 시도하고 실패가 하나라도 있었으면 최초 예외를 그대로 던진다.

    override setSize(width: number, height: number)
        의존:
            WebGLRenderTarget — 크기 갱신; 함수: {setSize()}
            ShaderPass — 표시 uniform 접근; 속성 읽기: {uniforms}
        동작:
            이미 읽기 시작한 캡처는 지역 배열 참조를 유지하므로 새 크기로 바뀌지 않는다.
            세 렌더 대상을 새 크기로 설정한다.
            #pixelBuffer가 truthy이면 width*height*4 길이의 새 Float32Array로 교체한다.
            #width·#height와 표시·부호화 재질의 resolution을 갱신한다.

    getSize()
        동작: 현재 width와 height를 가진 새 객체를 반환한다.

    setDensity(density = this.#density)
        의존: ShaderPass — 표시 uniform 접근; 속성 읽기: {uniforms}
        동작: 0.1 미만이면 0.1, 0.9 초과이면 0.9로 제한한 값을 보관하고 density uniform에 쓴다.

    setLine(color = this.#lineColor, size = this.#lineSize)
        의존:
            Color — 색상 정규화; 생성자: {new Color()}
            ShaderPass — 표시 uniform 접근; 속성 읽기: {uniforms}
        동작:
            color가 Color 인스턴스가 아니면 Color를 생성한다.
            size를 1~10으로 제한하고 색상·크기를 보관한 뒤 lineSize와 lineColor uniform을 갱신한다.

    setOverColor(color = this.#overColor)
        의존:
            Color — 색상 정규화; 생성자: {new Color()}
            ShaderPass — 표시 uniform 접근; 속성 읽기: {uniforms}
        동작: Color 인스턴스가 아니면 변환하고 저장한 뒤 overColor uniform의 RGB를 갱신한다.

    setGround(use = this.#useGroundColor, color = this.#groundColor)
        의존:
            Color — 색상 정규화; 생성자: {new Color()}
            ShaderPass — 표시 uniform 접근; 속성 읽기: {uniforms}
        동작: Color 인스턴스가 아니면 변환하고 use와 색상을 저장한다. 표시 uniform에는 use의 truthy에 따라 1 또는 0과 색상의 RGB를 쓴다.

    setSky(use = this.#useSkyColor, color = this.#skyColor)
        의존:
            Color — 색상 정규화; 생성자: {new Color()}
            ShaderPass — 표시 uniform 접근; 속성 읽기: {uniforms}
        동작: Color 인스턴스가 아니면 변환하고 use와 색상을 저장한다. 표시 uniform에는 use의 truthy에 따라 1 또는 0과 색상의 RGB를 쓴다.

    override render(renderer: URenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget) -> void
        의존:
            URenderer — 렌더 상태·장면·전체 화면 렌더와 비동기 픽셀 읽기; 함수: {getRenderTarget(), getRenderGroup(), setRenderTarget(), render(), readRenderTargetPixelsAsync()}; 속성 읽기·쓰기: {autoClear}
            UDEF — 지형 종류; 상수: {RENDER_TYPE.TERRAIN}
            ShaderPass — 표시 후처리; 함수: {render()}; 속성 읽기: {textureID, _fsQuad}
        동작:
            _disposed가 truthy이면 렌더 자원에 접근하지 않고 반환한다.
            autoClear와 기존 렌더 대상을 보관한 뒤 _disposed가 truthy이면 반환한다. 아니면 호출별 visibleCache를 빈 배열로 만든다. renderComplete는 false로 시작하며 #renderDepth를 증가시킨다.
            try에서:
                autoClear를 false로 바꾸고 렌더 그룹에서 이름이 TERRAIN이 아니며 visible인 객체를 숨겨 visibleCache에 저장한다.
                지형 렌더 대상 설정 전·후 및 첫 깊이 render 뒤에 _disposed를 검사하여 truthy이면 중단한다.
                저장한 객체의 visible을 true로 복원하고 visibleCache를 비운다. 전체 깊이 대상 설정 후 및 두 번째 render 뒤에도 _disposed가 truthy이면 중단한다.
                현재 #dataCapture를 capture에 보관한다. capture가 truthy이면:
                    #dataCapture를 undefined로 바꾸고 capture를 #readingCaptures에 추가한다. 새 조회는 다음 캡처를 기다리며, 새 대기 요청이 없는 프레임은 같은 읽기를 중복 실행하지 않는다.
                    내부 try에서 부호화 재질의 입력 텍스처를 readBuffer.texture로 연결하고 전체 화면 도형의 재질과 렌더 대상을 바꾼다. _disposed가 falsy일 때만 부호화 화면을 렌더한다.
                    capture가 아직 #readingCaptures에 있을 때만:
                        #pixelBuffer가 nullish이면 width*height*4 길이의 새 Float32Array를 만들고, 아니면 보관한 배열을 pixelBuffer로 사용한다.
                        #pixelBuffer를 undefined로 바꾸어 진행 중인 읽기에 전달한 배열을 다른 읽기에 빌려주지 않는다.
                        지역 pixelBuffer로 비동기 픽셀 읽기를 요청한다.
                        성공 콜백에서 #readingCaptures.delete(capture)가 false이면 무시한다. true이면 #pixelBuffer가 falsy이고 pixelBuffer.length가 현재 width*height*4와 같을 때만 그 배열을 #pixelBuffer에 보관하고, 해당 요청의 Promise를 지역 배열로 resolve한다.
                        비동기 실패에서는 #readingCaptures.delete(capture)가 true일 때만 그 요청을 이유 없이 reject한다.
                    내부 try의 동기 오류도 #readingCaptures.delete(capture)가 true일 때만 이유 없이 reject한다. 다른 진행 중인 읽기나 다음 캡처의 대기는 종결하지 않는다.
                _disposed가 truthy이면 중단한다. 아니면 autoClear를 원래 값으로 복원한 뒤 부모 render를 호출하고 renderComplete를 !_disposed로 갱신한다.
            finally에서:
                visibleCache에 아직 남은 객체의 visible을 true로 복원한다. 호출별 목록이므로 중첩 렌더의 복원 목록을 덮어쓰지 않는다.
                가시성 복원에 예외가 있어도 renderComplete가 falsy이면 autoClear와 기존 렌더 대상을 복원한다. 정상 완료 시에는 부모 render가 남긴 렌더 대상과 상태를 그대로 유지한다.
                상태 복원에 예외가 있어도 #renderDepth를 감소시킨다.
                진입 시 _disposed가 falsy인 렌더 호출은, 카운터 감소 후 _disposed가 truthy이고 #renderDepth가 0일 때만 실제 자원을 해제한다.
            깊이·부모 render의 오류는 finally의 복원·정리 뒤 호출자에게 전달한다. 렌더 중 미룬 실제 해제의 오류도 render 호출자에게 전달된다. 복원·해제에서 추가 예외가 발생하면 JavaScript finally 규칙에 따라 그 예외가 앞선 예외를 대체할 수 있다.

    updateState(camera)
        동작: #camera를 입력 참조로 교체한다.

    getDepthArray() -> Promise<Float32Array>
        의존:
            deferredPromise — 공유 캡처 완료 객체 생성; 함수: {deferredPromise()}
            UAbortError — 해제 후 조회의 취소 사유; 생성자: {new UAbortError()}
        동작:
            #dataCapture가 truthy이면 기존 Promise를 반환하여 캡처 시작 전 조회들만 공유한다.
            없으면 새 deferredPromise를 만든다. _disposed가 truthy이면 UAbortError로 거부한 뒤 반환한다.
            사용 가능한 패스에서는 promise를 가진 요청을 동기적으로 #dataCapture에 등록하고 그 Promise를 반환한다. 이미 읽기 시작한 요청이 있어도 다음 캡처의 대기 요청을 만들며, 별도 Yield 등록을 기다리지 않으므로 바로 뒤의 취소도 요청을 찾는다.

USkyLineCaptureRequest 타입 정의
    promise: DeferredPromise<Float32Array>
        같은 캡처 요청자들이 공유하는 완료 객체다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
