# UTerrainDecalCompositeComposer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

Worker가 준비한 packed terrain 도형 texture를 Layer와 Feature의 총순서대로 offscreen RenderTarget에 미리 합성한다. terrain tile이 매 프레임 도형 전체를 다시 평가하는 direct 경로 대신, 한 번 합성한 결과 texture를 sampling만 하도록 만드는 것이 목적이다. 합성 작업은 하나의 프레임에서 끝내지 않아도 되며, 허용된 draw 수와 프레임 deadline 안에서 재개할 수 있는 job으로 나뉜다.

### 1.2 책임 범위

합성 job의 진행 상태, 미완성 RenderTarget, 임시 raster material, program anchor와 공용 geometry·camera를 이 단위가 소유한다. 합성 결과를 담은 RenderTarget의 소유권은 완료 시 반환하는 `TerrainBufferState`로 이전되고, 그 뒤의 수명주기는 호출자가 책임진다.

책임 경계: 합성 요청 시점, 프레임 예산 배분, 합성 결과를 tile presentation에 반영하는 순서는 `UTerrainDecalComposeScheduler`가 결정한다. 입력 packed DataTexture와 그 uniform은 호출자가 소유하므로 이 단위는 읽기만 하고 해제하지 않는다.

### 1.3 주요 동작 방식

`createJob`이 packed 도형 범위와 tile 범위로 content 범위를 정하고 공용 batch raster material과 fullscreen scene을 갖춘 job을 만든다. `step`은 renderer 상태를 저장한 뒤 job을 진행하고, 어떤 결과에서도 저장한 상태를 되돌린다. job 진행은 두 단계로 나뉜다. 준비 단계는 packed row를 프레임 deadline 안에서 점진적으로 순회하여 batch별 local 범위와 최소 외곽선 두께를 모으고, 이를 근거로 target 해상도와 gutter를 포함한 합성 범위를 확정한다. 실행 단계는 host 구간마다 RenderTarget을 만들어 한 번 비우고, batch 순번을 uniform으로 바꾸며 batch 수만큼 fullscreen draw를 반복한다. 모든 host 구간을 끝내면 완성 target 소유권을 결과 상태로 넘기고 job을 등록에서 제거한다.

### 1.4 주요 사용처와 연계 대상

- 호출자: `union3d/manager/terrain/UTerrainDecalComposeScheduler.js`가 합성 실행기로 이 클래스의 기본 인스턴스를 만들고, `createJob`·`step`·`compose`·`disposeJob`·`dispose`를 호출한다.
- 입력 생산자: `UTerrainDecalPrepareTask`가 packing한 결과를 `UShaderTerrainDecalUtils`가 DataTexture 상태로 만들어 `TerrainCompositeInput.sourceState`로 전달한다.
- shader 계약: `GDecalTerrainShader.replaceFragmentShader`의 decal 평가 본문을 합성 material의 fragment shader에 그대로 사용하므로, packed 레이아웃과 평가 규칙을 함께 유지해야 한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
합성 결과는 premultiplied alpha RGBA8 RenderTarget에 저장하고, host 구간마다 별도 target을 갖는다.
합성 순서는 합성 계획의 batch 순번 순서를 그대로 따라야 하며, 같은 target에서 앞선 batch가 뒤 batch에 덮이는 관계를 보존해야 한다.
결과 상태에는 입력 packed 상태의 tileScale uniform과 합성 local 범위를 함께 담아야 한다. tileScale이 빠지면 terrain material이 texture의 한 점만 sampling한다.
합성 도중 변경한 renderer 상태는 성공·실패와 무관하게 이번 step에서 변경한 범위까지 되돌려야 한다.
완성한 RenderTarget 소유권은 결과 상태로 한 번만 이전하고, 이전하지 않은 target과 임시 material은 job 정리에서 회수해야 한다.
합성기가 소유한 공용 geometry는 job 정리로 해제하지 않고 합성기 정리에서만 해제해야 한다.
입력 계약이 유효하지 않거나 이미 중단된 요청은 job을 만들지 않고 예외로 알려야 한다.
예외를 밖으로 전달하기 전에는 해당 job의 자원을 회수해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: render-before마다 호출되며, 한 번의 step은 호출자가 준 draw 수 상한과 deadline 안에서만 진행한다.
우선순위: 원본 외곽선 두께를 보존하는 해상도를 우선하되, 기본 해상도 대비 배율 상한과 renderer texture 상한을 넘지 않는다. 상한에 걸려 줄어든 해상도는 shader coverage 보정으로 대신한다.
제한 조건: content 범위는 tile mesh가 덮는 범위 안으로 잘라 tile 밖 영역에 해상도를 쓰지 않는다.
제한 조건: 같은 define 집합의 job이 연달아 끝나도 shader program을 다시 link하지 않도록, 어떤 scene에도 그리지 않는 anchor material이 program 참조를 유지한다.
제한 조건: 준비 단계의 packed row 순회는 일정 row 수마다 deadline을 확인하여 한 프레임을 독점하지 않는다.
검증 기준: 합성기가 보유한 program anchor 수는 진단용 접근자로 확인한다.
```

## 3. 정규 자연어 수도코드

```spec
TERRAIN_COMPOSITE_DEFAULT_RESOLUTION: number = 512
    합성 생성 옵션이 해상도를 주지 않을 때 사용하는 기본 content 해상도

TERRAIN_COMPOSITE_GUTTER_TEXELS: number = 3
    content 범위 밖으로 넓히는 여유 texel 수. LinearFilter sampling이 경계 밖 texel을 읽어도 도형이 잘리지 않게 한다.

TERRAIN_COMPOSITE_SCISSOR_PADDING_TEXELS: number = 2
    batch scissor를 양쪽으로 넓히는 여유 texel 수. 가는 path가 scissor 경계에서 잘리지 않게 한다.

TERRAIN_COMPOSITE_MAX_RESOLUTION_SCALE: number = 8
    기본 해상도 대비 content 해상도 배율 상한의 기본값

TERRAIN_COMPOSITE_SETUP_CHECK_INTERVAL: number = 32
    준비 단계에서 deadline을 다시 확인하기까지 처리하는 packed row 수

TERRAIN_COMPOSITE_PATH_STYLE_TEXELS: number = 2
    path style 하나가 차지하는 texel 수. packed style 배열에서 style 순번을 offset으로 바꿀 때 사용한다.

TerrainCompositeRasterJob 타입 정의
    composer: UTerrainDecalCompositeComposer
        job을 만든 합성기이며 소유권 확인과 설정 조회에 사용한다.
    input: TerrainCompositeInput
        job을 만든 합성 입력
    material: ShaderMaterial
        모든 host 구간과 batch가 공유하는 임시 raster material
    programAnchorKey: string
        material defines로 만든 program anchor key
    scene: Scene
        fullscreen raster mesh 하나를 담은 scene
    contentBounds: Vector4
        도형 전체의 tile-local 범위이며 gutter를 포함하지 않는다.
    bounds: Vector4
        gutter를 포함한 합성 local 범위이며 결과 상태로 함께 이전된다.
    targetWidth, targetHeight: number = 0
        준비 단계에서 확정한 target 해상도
    compositeVariants: Array<TerrainCompositeVariant> = 빈 배열
        host 구간별 합성 결과이며 실행 단계에서 필요한 순서로 채운다.
    batchExecutionList: Array<number>
        실제로 실행할 계획 batch 순번 목록. hybrid 에서는 정적 대상이 있는 batch 만 담아 빈 draw 를 발행하지 않는다.
    batchBounds: Map<number, Vector4> = 빈 Map
        batch 순번별 local 범위
    batchBoundsValid: boolean = true
        packed 범위 계약이 유효한지 여부이며 false이면 모든 batch가 전체 target을 사용한다.
    setupStateIndex: number = 0
        범위를 준비 중인 packed 상태 순번
    setupRowIndex: number = 0
        범위를 준비 중인 packed row 순번
    setupDone: boolean = false
        batch 범위와 target 크기 준비 완료 여부
    minimumStrokeWidth: number = 양의 무한
        확인된 최소 외곽선 반경이며 무한이면 두께 근거가 없다는 뜻이다.
    coverageFallbackEnabled: boolean = false
        해상도 상한 때문에 shader coverage 보정이 필요한지 여부
    variantIndex: number = 0
        현재 host 구간 순번
    batchIndex: number = 0
        현재 합성 batch 순번
    variantCleared: boolean = false
        현재 host 구간 target을 이미 비웠는지 여부
    done: boolean = false
        전체 합성 완료 여부
    disposed: boolean = false
        job 정리 여부
    materialReleased: boolean = false
        임시 material 정리 여부
    targetsTransferred: boolean = false
        완성 target 소유권 이전 여부
    state: TerrainBufferState | undefined = undefined
        완료 뒤 이전한 buffer 상태

TerrainCompositeProgramAnchor 타입 정의
    material: ShaderMaterial
        job material과 define 집합만 같고 texture uniform이 없는 material
    scene: Scene
        compile에만 사용하는 anchor scene

TerrainCompositeStepStopReason 타입 정의
    'pixel-budget' | 'draw-cap' | 'deadline'
        합성 step 이 이번 프레임에서 더 진행하지 못한 사유다. 호출자는 pixel-budget 만 다르게 처리해 그 작업을 queue 뒤로 보낼지 정하고, draw-cap 과 deadline 은 호출자가 이미 프레임 상단에서 같은 조건을 확인하므로 기존 진행 처리와 같다.

TerrainCompositeRendererState 타입 정의
    renderTarget: WebGLRenderTarget | null
        이전 render target이며 null은 캔버스를 뜻한다.
    activeCubeFace: number
        이전 cube face 순번
    activeMipmapLevel: number
        이전 mipmap level
    viewport: Vector4
        이전 viewport
    scissor: Vector4
        이전 scissor 범위
    scissorTest: boolean
        이전 scissor test 상태
    clearColor: Color
        이전 clear 색상
    clearAlpha: number
        이전 clear alpha
    autoClear: boolean
        이전 autoClear 설정

TerrainCompositeInput 부분 타입 명세
    이 명세에서 사용하는 필드:
        tileKey: string
            합성 대상 terrain tile key이며 target texture 이름에 포함한다.
        generation: number
            합성 요청이 속한 tile 세대이며 target texture 이름에 포함한다.
        revision: number
            합성 요청이 속한 tile revision이며 결과 상태에 그대로 전달한다.
        tileLocalBounds?: Array<number>
            tile mesh가 덮는 tile-local 범위이며 `[minX, minY, maxX, maxY]` 형식이다. 생략하면 packed 도형 범위를 그대로 쓴다.
        sourceState: TerrainBufferState
            packed DataTexture와 uniform을 담은 입력 상태이며 호출자가 소유한다.
        compositionPlan?: TerrainDecalCompositionPlan
            batch 목록을 담은 합성 계획이며 `compositionMode`가 `precomposed`여야 한다.
        variants: Array<TerrainCompositeVariant>
            합성할 host 구간 목록이며 하나 이상이어야 한다.
        renderer?: WebGLRenderer
            합성을 실행할 renderer이며 계약 확인 대상이다.
        signal?: AbortSignal
            취소와 dispose를 알리는 신호

TerrainBufferState 부분 타입 명세
    이 명세에서 사용하는 필드:
        defines?: Record<string, number>
            입력에서는 packed 도형 평가에 필요한 define이고, 결과에서는 composite sampling 경로를 켜는 define이다.
        uniforms?: Record<string, IUniform>
            입력에서는 packed texture와 tileScale을 담고, 결과에서는 tileScale과 합성 범위를 담는다.
        packedStates?: Partial<{path: TerrainBucketState, area: TerrainBucketState, circle: TerrainBucketState}>
            batch 범위를 계산할 때 참조하는 packed 원본
        compositeVariants?: Array<TerrainCompositeVariant>
            결과 상태로 이전하는 host 구간별 RenderTarget
        hasTranslucentDecal?: boolean
            1 미만 알파를 사용하는 decal 포함 여부
        forceMaterialUpdate?: boolean
            material 강제 갱신 여부
        revision?: number
            변경 버전
        byteLength?: number
            추정 바이트 크기
        staticCompositeByteLength?: number
            결과가 보유한 합성 target만의 추정 바이트 크기이며 packed 입력 크기를 포함하지 않는다.

TerrainCompositeVariant 부분 타입 명세
    이 명세에서 사용하는 필드:
        materialRenderOrder: number
            host image material의 렌더 순서이며 이 구간이 합성할 shader layer 하한을 정한다.
        nextRenderOrder: number
            다음 준비된 image material의 렌더 순서이며 이 구간의 상한을 정한다.
        hostKey?: string
            담당 host 구간을 식별하는 key
        textureReadyRevision?: number
            texture 준비 구성이 바뀔 때 증가하는 revision
        renderTarget?: {texture: Texture, dispose: () => void}
            합성 결과를 담은 offscreen RenderTarget

UTerrainDecalCompositeComposer 클래스 정의

    _resolution: number
        기본 content 해상도

    _maxResolutionScale: number
        stroke 보존을 위해 content 해상도를 기본 해상도의 몇 배까지 키울지의 상한

    _geometry: PlaneGeometry
        모든 job과 anchor가 공유하는 fullscreen quad geometry

    _camera: Camera
        matrix 자동 갱신을 끈 fullscreen 전용 camera

    _jobs: Set<TerrainCompositeRasterJob> = 빈 Set
        아직 완료하거나 정리하지 않은 합성 job

    _programAnchors: Map<WebGLRenderer, Map<string, TerrainCompositeProgramAnchor>> = 빈 Map
        renderer별 define 집합 key와 program anchor의 대응

    _disposed: boolean = false
        합성기 정리 여부

    constructor(opt: Partial<{resolution: number, maxResolutionScale: number}> = {})
        역할: 해상도 정책을 확정하고 모든 job이 공유할 geometry와 camera를 만든다.

        인터페이스:
            opt.resolution: 기본 content 해상도이며 숫자로 바꿀 수 없거나 0이면 기본값 512를 쓴다.
            opt.maxResolutionScale: 기본 해상도 대비 content 해상도 배율 상한이며 숫자로 바꿀 수 없거나 0이면 기본값 8을 쓴다.

        처리 기준:
            두 설정은 소수점을 버린 뒤 1 미만이면 1로 올린다. 음수를 주면 기본값이 아니라 1이 된다.

        의존:
            THREE — 공용 geometry와 fullscreen camera 생성; 생성자: {new THREE.PlaneGeometry(), new THREE.Camera()}; 함수: {updateMatrixWorld()}; 속성 쓰기: {Camera.matrixAutoUpdate}

        동작:
            opt.resolution 을 숫자로 바꾸고 falsy 이면 기본 해상도로 대체한 뒤 소수점을 버려 1 이상으로 보정하여 _resolution 에 저장한다.
            opt.maxResolutionScale 을 같은 방식으로 보정하여 _maxResolutionScale 에 저장한다.
            opt.batchSplitMaxEdgeTexels 을 소수점 버린 정수로 바꾸고 유한한 양수일 때만 _batchSplitMaxEdgeTexels 에 저장하며, 그 밖의 값은 전부 비활성(0)으로 둔다.
            2×2 크기의 quad geometry 를 만들어 _geometry 에 보관한다.
            camera 를 만들고 matrix 자동 갱신을 끈 뒤 world matrix 를 한 번 갱신하여 _camera 에 보관한다.

    compose(input: TerrainCompositeInput) -> TerrainBufferState
        역할: 프레임 제한 없이 한 번의 호출에서 모든 host 구간과 batch를 합성한다.

        인터페이스:
            input: 합성 입력이며 renderer 를 반드시 담아야 한다.
            반환: 모든 host 구간이 완성된 buffer 상태

        처리 기준:
            input.renderer 가 없으면 job 을 만들지 않고 TypeError 로 실패한다.
            draw 수 상한과 deadline 을 양의 무한으로 주므로 한 번의 진행에서 완료되어야 하며, 완료되지 않거나 결과 상태가 없으면 Error 로 실패한다.
            실패하면 이번에 만든 job 의 자원을 회수한 뒤 예외를 그대로 전달한다.

        동작:
            input.renderer 를 확인하고 없으면 TypeError 를 던진다.
            합성 job 을 만든다.
            draw 수 상한과 deadline 을 무한으로 주어 job 을 한 번 진행한다.
            진행 결과가 완료가 아니거나 결과 상태가 없으면 Error 를 던진다.
            어느 단계에서든 예외가 발생하면 job 을 정리한 뒤 같은 예외를 다시 던진다.
            완료된 결과 상태를 반환한다.

    createJob(input: TerrainCompositeInput) -> TerrainCompositeRasterJob
        역할: 여러 프레임에 걸쳐 재개할 수 있는 합성 job과 그 job이 쓸 GPU 자원 계약을 준비한다.

        인터페이스:
            input: 합성 입력이며 job 이 끝날 때까지 참조를 유지한다.
            반환: 미완성 target 과 진행 상태를 소유한 job

        처리 기준:
            이미 정리된 합성기이면 TypeError 로 실패한다.
            입력 계약을 확인한 뒤에도 요청이 이미 중단되었으면 job 을 만들지 않고 TypeError 로 실패한다.
            job material 의 program anchor key 는 define 집합만으로 정한다. shader 문자열과 material 플래그는 모든 job 이 같으므로 defines 가 다르지 않으면 같은 program 을 쓴다.
            target 해상도와 batch 범위는 이 단계에서 정하지 않고 첫 진행의 준비 단계로 넘긴다.
            fullscreen mesh 는 합성기가 소유한 공용 geometry 를 사용하므로 job 정리에서 geometry 를 해제하지 않는다.

        의존:
            THREE — fullscreen raster scene 과 mesh 구성; 생성자: {new THREE.Scene(), new THREE.Mesh()}; 함수: {Scene.add(), Mesh.updateMatrix()}; 속성 쓰기: {Mesh.frustumCulled, Mesh.matrixAutoUpdate}
            Web API — 요청 중단 여부 확인; 속성 읽기: {AbortSignal.aborted}

        동작:
            _disposed 이면 TypeError 를 던진다.
            입력 계약을 확인한다.
            input.signal 이 이미 중단 상태이면 TypeError 를 던진다.
            packed 도형 범위와 tile 범위로 content 범위를 정하고, 같은 값을 복제해 합성 범위 초기값으로 삼는다.
            합성 범위를 uniform 으로 갖는 공용 batch raster material 을 만든다.
            공용 geometry 와 그 material 로 fullscreen mesh 를 만들어 frustum culling 과 matrix 자동 갱신을 끄고 matrix 를 한 번 갱신한 뒤 새 scene 에 넣는다.
            material defines 의 key 를 정렬하여 key 와 값의 쌍을 직렬화한 program anchor key 를 만든다.
            계획이 투영한 정적 대상 batch 순번으로 실행 목록을 만든다.
            진행 상태와 결과 자리를 초기값으로 채운 job 을 만들어 _jobs 에 등록하고 반환한다.

    step(job: TerrainCompositeRasterJob, renderer: WebGLRenderer, opt: Partial<{maxDrawCalls: number, deadlineMs: number, remainingWeightedMp: number, frameAdmitted: boolean}> = {}) -> {done: boolean, drawCalls: number, progressed: boolean, weightedMpUsed: number, stopReason?: TerrainCompositeStepStopReason, state?: TerrainBufferState}
        역할: 허용된 draw 수와 프레임 deadline 안에서 job을 진행하고, 완료되면 결과 상태를 만들어 돌려준다.

        인터페이스:
            job: 이 합성기가 만든 진행 중인 job
            renderer: 현재 프레임 renderer
            opt.maxDrawCalls: 이번 진행에서 허용할 draw 수이며 유한하지 않으면 제한하지 않는다.
            opt.deadlineMs: 이번 프레임의 종료 시각이며 유한하지 않으면 제한하지 않는다.
            opt.remainingWeightedMp: 이번 프레임에 남은 가중 픽셀(메가픽셀)이며 유한한 0 이상이 아니면 제한하지 않는다.
            opt.frameAdmitted: 이번 프레임에서 이미 다른 작업이 clear 나 draw 를 발행했는지 여부이며 생략하면 아직 없음으로 본다.
            반환: done 은 전체 합성 완료 여부, drawCalls 는 이번 진행의 draw 수, progressed 는 이번 진행에서 무언가 진행했는지 여부, weightedMpUsed 는 이번 진행이 소비한 가중 픽셀이며, stopReason 은 더 진행하지 못한 사유로 완료하거나 정상 종료했으면 없다. state 는 완료했을 때만 담긴다.

        처리 기준:
            이미 완료한 job 을 다시 진행하면 보관한 결과 상태를 그대로 돌려주고 draw 를 하지 않는다.
            요청이 중단되었으면 job 자원을 즉시 회수하고 완료가 아닌 결과를 돌려준다. 이 결과에는 결과 상태가 없다. [확인 Q-002]
            renderer 상태 저장은 try 블록 밖에서 수행하므로 저장에 실패하면 job 이 정리되지 않은 채 예외가 전달된다. [확인 Q-003]
            진행과 상태 복구를 모두 시도한 뒤 예외를 전달하며, 진행 실패와 복구 실패가 함께 발생하면 진행 실패를 우선 전달한다.
            예외를 전달하기 전에는 job 자원을 회수한다.
            결과 상태를 만드는 과정이 실패하면 job 자원을 회수한 뒤 예외를 전달한다.

        의존:
            Web API — 요청 중단 여부 확인; 속성 읽기: {AbortSignal.aborted}

        동작:
            job 이 이 합성기의 것이고 실행 가능한지, renderer 가 합성 명령을 실행할 수 있는지 확인한다.
            job.done 이면 보관한 결과 상태와 함께 완료 결과를 돌려준다.
            job.input.signal 이 중단 상태이면 job 을 정리하고 진행 없음 결과를 돌려준다.
            이번 진행에서 바꿀 renderer 상태를 저장한다.
            job 을 진행하고 예외는 실패로 보관한다.
            진행 성공·실패와 무관하게 저장한 renderer 상태를 되돌리고, 복구 실패는 보관한 실패가 없을 때만 실패로 삼는다.
            실패가 있으면 job 을 정리한 뒤 그 실패를 던진다.
            진행 결과가 완료이면 완성 target 소유권을 결과 상태로 이전하고, 이전이 실패하면 job 을 정리한 뒤 예외를 던진다.
            진행 결과를 반환한다.

    disposeJob(job: TerrainCompositeRasterJob) -> void
        역할: 미완성 job의 임시 material과 아직 이전하지 않은 RenderTarget을 회수한다.

        인터페이스:
            job: 정리할 합성 job이며 다른 합성기의 job, 값이 없는 입력과 이미 정리한 job은 무시한다.

        처리 기준:
            완료한 job 은 target 소유권을 이미 결과 상태로 넘겼으므로 target 을 해제하지 않고 임시 material 만 정리한다.
            공용 geometry 와 camera 는 합성기가 소유하므로 여기서 해제하지 않는다.

        의존:
            THREE — 이전하지 않은 합성 target 해제; 함수: {WebGLRenderTarget.dispose()}

        동작:
            job 이 없거나 이 합성기의 job 이 아니거나 이미 정리되었으면 아무것도 하지 않는다.
            임시 raster material 을 정리한다.
            target 소유권을 이전하지 않았으면 host 구간별 RenderTarget 을 순회하여 해제하고 결과 목록을 비운다.
            job 을 정리 상태로 표시하고 _jobs 에서 제거한다.

    dispose() -> void
        역할: 합성기가 소유한 남은 job 자원, program anchor와 공용 geometry를 정리한다.

        처리 기준:
            이미 정리했으면 아무것도 하지 않는다.
            남은 job 을 먼저 정리한 뒤 정리 상태로 표시하므로, job 정리 중에는 아직 새 job 생성이 막히지 않는다.
            camera 는 해제할 자원을 갖지 않으므로 그대로 둔다.

        동작:
            _jobs 의 현재 목록을 복제하여 각 job 을 정리한다.
            _disposed 를 true 로 만들어 이후 job 생성을 막는다.
            보유한 program anchor 를 모두 정리하여 program 참조를 놓는다.
            공용 geometry 를 해제한다.

    resolveTerrainCompositeSeparationMargin(contentBounds?: Array<number>, maxTextureSize: number) -> number
        역할: hybrid 실행에서 정적 합성 결과가 자기 범위 밖으로 번질 수 있는 최대 폭을 계산한다.

        인터페이스:
            contentBounds: 정적·동적을 모두 포함하는 tile-local [minX, minY, maxX, maxY] 상한 범위
            maxTextureSize: renderer texture 한 변 상한
            반환: tile-local 여유 거리이며 계산할 수 없으면 NaN 이다.

        처리 기준:
            정리된 합성기, 형식이 어긋난 범위, 유한하지 않은 값은 계산하지 않고 NaN 을 돌려준다. 호출부가 0 으로 낙관하지 않게 하려는 것이다.
            renderer texture 상한을 모르면 target 이 더 작게 잡힐 수 있어 여유를 과소평가하므로 계산하지 않는다.
            content 폭과 높이는 합성기가 범위를 최소 1 로 넓히는 clamp 를 함께 반영한다.
            content 픽셀 수는 최소 content 해상도 이상이므로 texel 크기의 상한은 content 크기를 그 해상도로 나눈 값이다. 분모는 기본 해상도가 아니라 실제 최소 content 해상도다.
            여유는 그 texel 상한에 sampling footprint texel 수를 곱한 값이다. 합성 raster 의 최소 외곽선 보정 절반 texel 과 결과 texture 의 LinearFilter sampling 1 texel 을 합한 값이며 batch scissor padding 은 coverage 를 넓히지 않아 넣지 않는다.

        동작:
            정리 상태와 입력 형식, renderer 상한을 확인하고 하나라도 어긋나면 NaN 을 반환한다.
            content 크기를 clamp 와 함께 구하고 최소 content 해상도를 계산한다.
            texel 상한에 sampling footprint texel 수를 곱해 반환한다.

    get programAnchorCount() -> number
        역할: 진단과 측정에서 확인할 수 있도록 현재 보유한 program anchor 수를 renderer 합산으로 알려준다.

        인터페이스: 반환: renderer 별 anchor 수의 합

        동작: _programAnchors 의 renderer 별 anchor Map 크기를 모두 더해 반환한다.

계약 검증 책임 그룹
    역할: job을 만들거나 진행하기 전에 입력, renderer와 job 소유권이 계약을 갖췄는지 확인하고 어긋나면 TypeError로 실패시킨다.

    validateTerrainCompositeInput(input: TerrainCompositeInput) -> void
        역할: 합성 입력이 job을 만들 수 있는 계약을 갖췄는지 확인한다.

        처리 기준:
            renderer 계약을 먼저 확인한다.
            합성 계획의 compositionMode 가 `precomposed` 나 `hybrid` 가 아니면 실패한다. 계획 자체가 없어도 같은 판정으로 실패한다.
            hybrid 는 실행할 정적 batch 가 하나도 없으면 실패한다. 합성할 것이 없는데 job 을 만들면 빈 결과를 정상 완료로 이전하기 때문이다.
            packed 입력 상태의 uniform 이 없으면 실패한다.
            host 구간 목록이 배열이 아니거나 비어 있으면 실패한다. precomposed 는 계획의 batch 목록이 비어 있는지 확인하지 않는다. [확인 Q-001]

        동작:
            renderer 가 합성 명령을 실행할 수 있는지 확인한다.
            합성 계획의 mode 를 확인하고 hybrid 이면 실행 목록이 비어 있는지 함께 확인한다.
            packed 입력의 uniform, host 구간 목록을 차례로 확인하고 어긋나는 첫 항목에서 TypeError 를 던진다.

    resolveTerrainCompositeBatchExecutionList(compositionPlan?: TerrainDecalCompositionPlan) -> Array<number>
        역할: 합성기가 실제로 실행할 계획 batch 순번 목록을 만든다.

        인터페이스:
            compositionPlan: 실행할 합성 계획
            반환: 오름차순 계획 batch 순번 목록

        처리 기준:
            계획이 정적 대상 batch 순번을 투영해 주면 그 목록만 실행한다. 전체 batch 를 돌면서 batch 별 필터만 켜면 정적 대상이 없는 batch 에 빈 draw 가 발행되므로 실행 목록 자체를 걸러 낸다.
            투영을 제공하지 않는 계획은 기존처럼 전체 batch 를 순서대로 실행한다.
            정수가 아니거나 batch 범위를 벗어난 순번은 버린다.

        동작:
            투영이 없으면 0 부터 batch 수까지의 순번 목록을 만들어 반환한다.
            투영이 있으면 유효한 순번만 순서대로 모아 반환한다.

    validateTerrainCompositeRenderer(renderer?: WebGLRenderer) -> void
        역할: 현재 프레임 renderer가 합성 명령을 실행할 수 있는지 확인한다.

        처리 기준:
            render 와 setRenderTarget 이 모두 함수여야 한다. 합성 실행에 사용하는 그 밖의 renderer 멤버는 확인하지 않는다.

        의존:
            THREE — renderer 실행 계약 확인; 속성 읽기: {WebGLRenderer.render, WebGLRenderer.setRenderTarget}

        동작:
            renderer 의 render 와 setRenderTarget 이 함수가 아니면 TypeError 를 던진다.

    validateTerrainCompositeRasterJob(composer: UTerrainDecalCompositeComposer, job: TerrainCompositeRasterJob) -> void
        역할: job이 현재 합성기에 속하고 계속 실행할 수 있는 상태인지 확인한다.

        처리 기준:
            값이 없는 job 과 다른 합성기의 job 은 소유권 위반으로 실패한다.
            이미 정리한 job 은 실행 불가로 실패한다.

        동작:
            job 이 없거나 job.composer 가 현재 합성기가 아니면 TypeError 를 던진다.
            job 이 이미 정리되었으면 TypeError 를 던진다.

합성 진행 책임 그룹
    역할: 준비 단계와 실행 단계를 프레임 제한 안에서 순서대로 진행하고, 어디까지 진행했는지를 job 상태에 남긴다.

    terrainCompositeWeightedMp(pixels: number, isClear: boolean = false) -> number
        역할: 실제 target 픽셀 수를 프레임 예산 단위인 가중 메가픽셀로 환산한다.

        인터페이스:
            pixels: 이번 발행이 덮는 실제 target 픽셀 수
            isClear: clear 발행이면 true 이며 생략하면 draw 로 본다.
            반환: 가중 메가픽셀이며 유효하지 않은 입력은 0 이다.

        처리 기준:
            유한하지 않거나 0 이하인 픽셀 수는 0 으로 본다.
            clear 는 draw 보다 같은 픽셀에서 훨씬 싸므로 0.16 을 곱한다. 이 값은 특정 GPU 와 장면에서 GPU 시간을 재 얻은 실험값이며 장비 일반값이 아니다.
            단위는 메가픽셀이다.

        동작:
            픽셀 수를 검사해 유효하면 clear 여부에 따른 가중치를 곱하고 100만으로 나눈 값을 돌려준다.

    terrainCompositeBatchWeightedMp(job: TerrainCompositeRasterJob, variant: TerrainCompositeVariant, batchIndex: number) -> number
        역할: batch draw 하나가 덮을 실제 target 픽셀 수를 발행 전에 계산해 가중 메가픽셀로 돌려준다.

        인터페이스:
            job: 진행 중인 합성 job
            variant: 현재 host 구간
            batchIndex: 계산할 batch 순번
            반환: 이 draw 의 가중 메가픽셀

        처리 기준:
            scissor 를 정하는 것과 같은 규칙으로 사각형을 구하되 renderer 상태는 바꾸지 않는다.
            target 크기가 유한하지 않거나 0 이하이면 0 이다.
            batch 범위 계약이 유효하지 않거나 합성 범위가 유효하지 않으면 target 전면을 덮는 것으로 본다.
            사각형 계산에는 scissor 여백 texel 을 같은 값으로 적용한다.
            계산한 사각형이 비면 0 이다.

        동작:
            target 크기를 확인하고 batch 범위가 없으면 전면 비용을 돌려준다.
            합성 범위와 batch 범위의 유한성을 확인하고 어긋나면 전면 비용을 돌려준다.
            batch 범위를 target 픽셀 사각형으로 환산하고 여백을 더해 잘라낸 뒤 그 면적의 가중 비용을 돌려준다.

    drawTerrainCompositeBatch(job: TerrainCompositeRasterJob, renderer: WebGLRenderer, camera: Camera, variant: TerrainCompositeVariant, batchCount: number) -> void
        역할: 현재 실행 순서의 batch 하나를 scissor와 계획 batch 순번을 적용해 그리고 다음 batch·host 구간으로 진행한다.

        인터페이스:
            job: 진행 중인 합성 job
            renderer: 현재 프레임 renderer
            camera: fullscreen quad 를 그대로 투영하는 camera
            variant: 현재 host 구간
            batchCount: 이번 합성 계획의 batch 개수

        처리 기준:
            예산 판단과 발행을 분리하려고 떼어낸 것이며 진행 규칙은 예산 도입 전과 같다.
            batch 범위 계약이 유효하면 그 batch 의 local 범위로, 아니면 전체 target 으로 scissor 를 정한다.
            batch 순번을 늘리고 batch 수를 채우면 다음 host 구간으로 넘어가 batch 순번과 비움 표시를 초기화한다.

        의존:
            THREE — batch draw 실행; 함수: {WebGLRenderer.render()}; 속성 쓰기: {ShaderMaterial.uniformsNeedUpdate}

        동작:
            이번 batch 의 scissor 를 정한다.
            batch 순번 uniform 을 갱신하고 갱신 표시를 세운 뒤 fullscreen scene 을 한 번 그린다.
            batch 순번을 늘리고 batch 수를 채웠으면 다음 host 구간으로 넘어간다.

    advanceTerrainCompositeRasterJob(job: TerrainCompositeRasterJob, renderer: WebGLRenderer, camera: Camera, opt: Partial<{maxDrawCalls: number, deadlineMs: number, remainingWeightedMp: number, frameAdmitted: boolean}>) -> {done: boolean, drawCalls: number, progressed: boolean, weightedMpUsed: number, stopReason?: TerrainCompositeStepStopReason}
        역할: 프레임 제한 안에서 host 구간과 batch 순서를 진행한다.

        인터페이스:
            camera: fullscreen quad 를 그대로 투영하는 camera
            반환: done 은 모든 host 구간을 끝냈는지 여부, drawCalls 는 이번 진행의 draw 수, progressed 는 준비 또는 draw 가 한 번이라도 진행했는지 여부, weightedMpUsed 는 이번 진행이 소비한 가중 픽셀, stopReason 은 더 진행하지 못한 사유다.

        처리 기준:
            draw 수 상한은 유한한 값일 때만 적용하며 소수점을 버린 뒤 1 미만이면 1 로 올린다. 따라서 상한을 0 으로 주어도 매 진행마다 최소 한 번은 draw 한다.
            deadline 은 유한한 값일 때만 적용하고 보정하지 않는다.
            픽셀 예산은 유한한 0 이상일 때만 적용하고, 음수·숫자 아님·무한이면 예산을 쓰지 않는 것으로 본다.
            예산을 쓰지 않으면 발행 전 면적을 계산하지 않고 곧바로 그린다. 채택되지 않은 예산 기능이 기본 경로에 좌표 계산 비용을 더하지 않게 하기 위해서다.
            픽셀 예산은 발행 전에 판단하며, 이번 프레임에서 아직 아무 것도 입장하지 않았으면 예산을 넘겨도 한 단위만 허용한다. 이 최소 진행 허용은 프레임 전체에서 한 번뿐이며 deadline 은 무시하지 않는다.
            아직 비우지 않은 host 구간은 target 전면 clear 비용과 그 구간 첫 batch 의 scissor 비용을 합쳐 하나의 입장 단위로 판단한다. clear 만 먼저 발행하면 전면 비용이 예산을 우회하기 때문이다.
            입장한 뒤에는 clear 와 첫 draw 사이에서 픽셀 예산을 다시 확인하지 않는다.
            입장이 거절되면 clear 와 draw 를 모두 발행하지 않고 비움 표시, host 구간 순번, batch 순번을 그대로 둔다.
            batch 가 없는 host 구간의 입장 비용은 clear 뿐이다. 이미 비운 구간의 다음 batch 는 그 batch 의 scissor 비용만으로 판단한다.
            가중 픽셀은 draw 가 덮는 실제 target 픽셀에 1 을, clear 가 덮는 전면 픽셀에 0.16 을 곱해 메가픽셀 단위로 센다. 0.16 은 특정 GPU 와 장면에서 GPU 시간을 재 얻은 실험값이며 장비 일반값이 아니다.
            draw 의 실제 픽셀은 scissor 를 정하는 것과 같은 규칙으로 발행 전에 계산하며, batch 범위 계약이 유효하지 않거나 target 크기가 유효하지 않으면 target 전면으로 본다. 계산한 사각형이 비면 0 이다.
            deadline 은 host 구간을 다루기 전에도 확인해 이미 지났으면 발행하지 않는다.
            batch 수는 합성 계획의 batch 목록 길이이며 계획이 없으면 0 이다. batch 수가 0 이면 host 구간마다 target 을 비우기만 하고 완료로 끝난다. [확인 Q-001]
            준비 단계가 끝나지 않았으면 이번 진행에서는 draw 를 하지 않는다. 준비가 끝났더라도 그 시점에 deadline 을 넘었으면 draw 없이 미완료로 돌아간다.
            host 구간의 target 은 그 구간을 처음 다룰 때 한 번만 비우며, 비우기 전에 program anchor 를 확보한다.
            batch 범위 계약이 유효하지 않으면 모든 batch 가 전체 target 을 대상으로 그린다.
            draw 수 상한은 draw 직후에만 확인하고 deadline 은 준비 완료 직후·host 구간 진입 직전·draw 직후에 확인하며, 모든 host 구간을 끝낸 경우에는 모든 제한과 무관하게 완료로 돌아간다.

        의존:
            THREE — host 구간 target 초기화와 batch draw 실행; 함수: {WebGLRenderer.setClearColor(), WebGLRenderer.clear(), WebGLRenderer.render()}; 속성 쓰기: {ShaderMaterial.uniformsNeedUpdate}
            Web API — 프레임 deadline 비교용 monotonic 시각 조회; 함수: {performance.now()}

        동작:
            합성 계획의 batch 수를 확인하고 draw 수 상한과 deadline 을 유한 여부에 따라 확정한다.
            준비가 끝나지 않았으면 준비 단계를 진행하고, 여전히 끝나지 않았거나 준비 직후 deadline 을 넘었으면 미완료로 돌아간다.
            남은 host 구간마다 deadline 을 먼저 확인하고 그 구간의 합성 결과와 target 을 확보해 renderer 에 연결한다.
            아직 비우지 않은 구간이면 예산이 켜져 있을 때만 clear 비용과 첫 batch draw 비용을 더한 입장 단위를 계산해 판단하고, 거절되면 아무 것도 발행하지 않고 미완료로 돌아간다. 비용 계산은 예산이 켜져 있을 때만 실행하도록 함수로 넘긴다.
            입장하면 job material 과 같은 program 을 붙잡는 anchor 를 확보한 뒤 scissor 를 해제하고 target 전체를 투명색으로 비운다.
            그 구간에 batch 가 있으면 입장 단위에 포함한 첫 batch 를 이어서 그린다.
            현재 batch 순번이 batch 수 이상이면 다음 host 구간으로 넘어가 batch 순번과 비움 표시를 초기화한다.
            이미 비운 구간의 다음 batch 는 예산이 켜져 있을 때만 그 batch 의 scissor 비용으로 판단하고, 거절되면 발행하지 않고 미완료로 돌아간다. 이 비용 계산도 같은 이유로 함수로 넘긴다.
            판단을 통과한 batch 를 그리고 draw 수를 늘린다.
            모든 host 구간을 끝냈으면 완료로 돌아가고, 그렇지 않으면 draw 수 상한이나 deadline 을 넘긴 경우 그 사유와 함께 미완료로 돌아간다.

    advanceTerrainCompositeRasterSetup(job: TerrainCompositeRasterJob, renderer: WebGLRenderer, deadlineMs: number) -> boolean
        역할: packed row를 프레임 deadline 안에서 점진적으로 순회해 batch 범위, 최소 외곽선 두께와 target 배치를 확정한다.

        인터페이스:
            deadlineMs: 이번 프레임의 종료 시각
            반환: 항상 true 이며 준비가 진행됐음을 뜻한다. 준비 완료 여부는 job 의 준비 완료 표시로 확인한다.

        처리 기준:
            packed 상태는 path, area, circle 순서로 순회하고 각 상태의 row 를 순번대로 처리한다.
            packed 상태가 없으면 row 0 개로 보고, row 수가 0 이상 정수가 아니면 계약 위반으로 판정한다.
            계약 위반을 만나면 batch 범위 계약을 무효로 표시하고 남은 상태를 건너뛴다. 그때까지 모은 최소 외곽선 두께는 유지하며 target 배치는 계속 계산한다.
            row 를 일정 수만큼 처리할 때마다 deadline 을 확인하고, 넘었으면 target 배치를 계산하지 않고 준비 미완료로 돌아간다. 다음 진행은 마지막 상태·row 순번에서 재개한다.
            target 배치는 renderer 의 texture 한 변 상한을 함께 반영하며, 상한이 유한하지 않으면 설정 상한만 적용한다.
            해상도 상한 때문에 요청 해상도를 채우지 못하면 shader coverage 보정용 texel 크기 uniform 을 채우고, 그렇지 않으면 0 을 넣어 보정을 끈다.

        의존:
            THREE — 합성 범위와 texel 크기 uniform 갱신; 속성 읽기: {WebGLRenderer.capabilities}; 속성 쓰기: {ShaderMaterial.uniformsNeedUpdate}
            Web API — 프레임 deadline 비교용 monotonic 시각 조회; 함수: {performance.now()}

        동작:
            packed 입력에서 path, area, circle 순서의 상태 목록을 만든다.
            남은 상태의 row 수를 확인하여 계약 위반이면 batch 범위 계약을 무효로 표시하고 순회를 끝낸다.
            현재 상태의 row 를 다 처리했으면 다음 상태로 넘어가 row 순번을 초기화한다.
            row 하나를 batch 범위에 합치고, 실패하면 batch 범위 계약을 무효로 표시하고 순회를 끝낸다.
            처리한 row 가 확인 간격에 이르면 deadline 을 확인하고 넘었으면 준비 미완료로 돌아간다.
            content 범위, 모은 최소 외곽선 두께, 기본 해상도, renderer texture 상한과 배율 상한으로 target 배치를 계산한다.
            계산한 gutter 포함 범위를 job 의 합성 범위에 복사하고 target 해상도와 coverage 보정 필요 여부를 저장한다.
            합성 범위 uniform 을 갱신하고, coverage 보정이 필요하면 합성 범위를 target 해상도로 나눈 texel 크기를, 아니면 0 을 texel 크기 uniform 에 넣는다.
            uniform 갱신 표시를 세우고 준비 완료로 표시한다.

packed row 범위 수집 책임 그룹
    역할: packed texture의 도형 종류별 레이아웃을 shader와 같은 규칙으로 해석해 batch 순번별 local 범위와 최소 외곽선 두께를 모은다.

    resolveTerrainCompositePackedStates(sourceState: TerrainBufferState) -> Array<TerrainBucketState | undefined>
        역할: packed 입력에서 path, area, circle 순서의 bucket 상태를 순서 있는 목록으로 복원한다.

        처리 기준:
            이 순서는 batch 범위 수집과 content 범위 계산이 함께 사용하는 도형 종류 순번의 근거이며, 없는 종류는 목록에서 빼지 않고 값이 없는 항목으로 둔다.

        동작:
            packed 상태의 path, area, circle 을 그 순서대로 담은 목록을 반환한다.

    appendTerrainCompositeBatchBoundsRow(job: TerrainCompositeRasterJob, stateIndex: number, state?: TerrainBucketState, row: number) -> boolean
        역할: 도형 종류 순번에 맞는 해석기로 packed row 하나를 batch 범위에 합친다.

        인터페이스:
            stateIndex: path 는 0, area 는 1, 그 밖은 circle 로 해석하는 종류 순번
            반환: packed 계약이 유효한지 여부이며 false 는 이후 순회를 중단시킨다.

        처리 기준:
            packed 상태가 없으면 계약 위반으로 판정한다.
            style 두께가 없는 row 가 사용할 기본 두께는 packed 입력의 threshold uniform 이며, 숫자로 바꿀 수 없거나 falsy 이면 0 으로, 음수이면 0 으로 보정한다.

        동작:
            packed 상태가 없으면 false 를 반환한다.
            packed 입력의 threshold uniform 으로 기본 외곽선 두께를 정한다.
            종류 순번이 0 이면 path, 1 이면 area, 그 밖이면 circle 해석기로 row 를 처리한 결과를 반환한다.

    appendTerrainCompositePathBatchBoundsRow(job: TerrainCompositeRasterJob, state: TerrainBucketState, segmentIndex: number, fallbackStrokeWidth: number) -> boolean
        역할: path segment 하나의 양 끝점과 두께로 batch 범위를 넓힌다.

        인터페이스:
            segmentIndex: packed segment 순번이며 데이터와 메타 배열의 texel 위치를 정한다.
            fallbackStrokeWidth: style 두께가 없을 때 사용할 기본 두께

        처리 기준:
            데이터, segment 메타, style 배열 중 하나라도 없거나 이번 segment 의 texel 4 개를 데이터·메타 배열에서 읽을 수 없으면 계약 위반이다.
            segment 메타의 style 순번이 음수이면 그 segment 를 건너뛰고 유효로 판정한다.
            style 순번을 style 배열 offset 으로 바꿀 때 style 하나가 차지하는 texel 수를 곱하며, 그 offset 의 batch 순번 위치를 읽을 수 없으면 계약 위반이다.
            최소 외곽선 두께는 segment 메타의 외곽선 사용 표시가 0.5 를 넘고 style 의 외곽선 불투명도가 0 보다 클 때만 갱신하며, 0 두께가 해상도 계산을 무한으로 만들지 않도록 아주 작은 하한을 적용한다.

        동작:
            필요한 배열과 texel 범위를 확인하고 어긋나면 false 를 반환한다.
            segment 메타에서 style 순번을 shader 와 같은 방식으로 해석하고 음수이면 true 를 반환한다.
            style offset 에서 batch 순번을 해석해 형식이 깨진 값은 계약 위반으로, 음수는 hybrid 의 direct 대상 제외로 처리한다.
            segment 메타의 두께를 기본 두께와 견주어 확정한다.
            외곽선을 실제로 그리는 segment 이면 최소 외곽선 두께를 갱신한다.
            양 끝점의 최소·최대 좌표를 두께만큼 넓힌 범위를 batch 범위에 합친 결과를 반환한다.

    appendTerrainCompositeAreaBatchBoundsRow(job: TerrainCompositeRasterJob, state: TerrainBucketState, row: number, fallbackStrokeWidth: number) -> boolean
        역할: area 행의 미리 계산된 범위와 두께로 batch 범위를 넓힌다.

        처리 기준:
            area 데이터 texture 는 선형 레이아웃이므로 행 header 가 texel 순서대로 놓이며, header 의 세 번째 성분이 batch 순번이다.
            style 은 행마다 12 개 성분을, 범위는 행마다 4 개 성분을 차지한다.
            데이터, style, 범위 배열 중 하나라도 없거나 이번 행이 요구하는 성분 위치를 읽을 수 없으면 계약 위반이다.
            최소 외곽선 두께는 style 의 외곽선 사용 표시가 0.5 를 넘고 외곽선 불투명도가 0 보다 클 때만 갱신한다.
            batch 순번이 형식이 깨진 값이면 계약 위반이고, 음수면 hybrid 가 direct 대상으로 표시한 row 이므로 최소 두께와 batch 범위에 넣지 않고 정상으로 건너뛴다.

        동작:
            필요한 배열과 성분 범위를 확인하고 어긋나면 false 를 반환한다.
            행 header 에서 batch 순번을 해석해 형식이 깨진 값은 계약 위반으로, 음수는 제외로 처리한다.
            style 두께를 기본 두께와 견주어 확정한다.
            외곽선을 실제로 그리는 행이면 최소 외곽선 두께를 갱신한다.
            행의 범위를 두께만큼 넓혀 batch 범위에 합친 결과를 반환한다.

    appendTerrainCompositeCircleBatchBoundsRow(job: TerrainCompositeRasterJob, state: TerrainBucketState, row: number, fallbackStrokeWidth: number) -> boolean
        역할: circle 행의 중심과 반경, 두께로 batch 범위를 넓힌다.

        처리 기준:
            circle 은 데이터 배열에서 중심 두 성분과 반경 한 성분을, style 배열에서 행마다 12 개 성분을 차지하며 batch 순번은 style 의 마지막 성분이다.
            데이터 또는 style 배열이 없거나 요구하는 성분 위치를 읽을 수 없으면 계약 위반이다.
            반경이 음수이면 0 으로 보정한 뒤 두께를 더한다.
            batch 순번이 형식이 깨진 값이면 계약 위반이고, 음수면 hybrid 가 direct 대상으로 표시한 row 이므로 제외한다.

        동작:
            필요한 배열과 성분 범위를 확인하고 어긋나면 false 를 반환한다.
            style 마지막 성분에서 batch 순번을 해석해 형식이 깨진 값은 계약 위반으로, 음수는 제외로 처리한다.
            style 두께를 기본 두께와 견주어 확정한다.
            외곽선을 실제로 그리는 행이면 최소 외곽선 두께를 갱신한다.
            중심에서 반경과 두께를 더한 정사각 범위를 batch 범위에 합친 결과를 반환한다.

    mergeTerrainCompositeJobBatchBounds(job: TerrainCompositeRasterJob, batchIndex: number, minX: number, minY: number, maxX: number, maxY: number) -> boolean
        역할: row 하나의 범위를 해당 batch의 누적 범위에 합치고, 합칠 수 없는 입력을 계약 위반으로 알린다.

        인터페이스:
            반환: 범위와 batch 순번이 유효하여 합쳤는지 여부

        처리 기준:
            batch 순번이 정수가 아니거나 음수이거나 합성 계획의 batch 수 이상이면 합치지 않는다. 계획이 없으면 batch 수가 0 이므로 모든 순번이 이 판정에서 걸린다.
            네 좌표 중 하나라도 유한하지 않거나 최대가 최소보다 작으면 합치지 않는다. 최대와 최소가 같은 폭 0 범위는 허용한다.

        의존:
            THREE — batch 범위 누적 값 생성; 생성자: {new THREE.Vector4()}

        동작:
            batch 순번과 네 좌표의 유효성을 확인하고 어긋나면 false 를 반환한다.
            해당 batch 의 누적 범위가 없으면 이번 범위로 새로 만들고, 있으면 최소·최대를 넓힌다.
            합쳤음을 알리는 true 를 반환한다.

    decodeTerrainCompositePackedIndex(value: number) -> number
        역할: shader와 같은 규칙으로 packed 실수 index를 정수 index로 해석한다.

        처리 기준:
            shader 의 반올림 계약과 같게 0.5 를 더한 뒤 내림한다. 유한하지 않은 값은 유효한 index 가 없다는 뜻의 음수로 돌려준다.

        동작:
            값이 유한하면 0.5 를 더해 내림한 정수를, 아니면 -1 을 반환한다.

    decodeTerrainCompositeBatchIndexOrNaN(value: unknown) -> number
        역할: packed batch 순번을 해석하되 형식이 깨진 값과 합성 대상 제외 표시를 구분한다.

        인터페이스:
            value: packed 실수 index
            반환: 정수 index 이며 형식이 깨진 값은 NaN 이다.

        처리 기준:
            hybrid 계획은 direct 대상 Feature 의 batch 순번을 음수로 표시한다. 그 row 는 합성 대상이 아니므로 건너뛰어야 하고, 실수 채널이 깨진 값은 이전처럼 무효로 다뤄야 한다.
            두 경우를 같은 -1 로 뭉개면 깨진 row 가 조용히 제외되어 batch scissor 가 실제보다 작아질 수 있다.

        동작:
            유한한 값이면 shader 와 같은 반올림 규칙으로 정수를 만들고, 유한하지 않으면 NaN 을 반환한다.

    resolveTerrainCompositeStrokeWidth(styleStrokeWidth: number, fallbackStrokeWidth: number) -> number
        역할: shader와 같은 규칙으로 style 두께와 기본 두께 중 실제로 사용할 두께를 정한다.

        처리 기준:
            style 두께가 유한하고 0 보다 클 때만 style 두께를 쓰고, 그 밖에는 기본 두께로 대체한다.

        동작:
            style 두께가 유한하고 0 보다 크면 style 두께를, 아니면 기본 두께를 반환한다.

합성 범위와 target 배치 책임 그룹
    역할: packed 도형 범위와 tile 범위, 최소 외곽선 두께로 합성할 local 범위와 target 해상도를 정한다.

    resolveTerrainCompositeContentBounds(sourceState: TerrainBufferState, tileLocalBounds?: Array<number>) -> Vector4
        역할: packed 도형 범위를 tile mesh가 덮는 범위 안으로 잘라 해상도를 tile 안쪽에 집중시킨다.

        인터페이스:
            tileLocalBounds: tile-local 범위 `[minX, minY, maxX, maxY]` 이며 생략하면 packed 범위를 그대로 쓴다.
            반환: `[minX, minY, maxX, maxY]` 순서의 content 범위

        처리 기준:
            외곽선 두께 기준의 clip padding 이 큰 feature 는 packed 범위가 tile 보다 훨씬 넓어질 수 있다. terrain material 은 tile 안쪽만 sampling 하므로 tile 밖 영역에 해상도를 쓰면 tile 안쪽이 그만큼 거칠어진다.
            tile 범위가 배열이 아니거나 성분이 4 개 미만이거나 앞 4 개 성분 중 하나라도 유한하지 않으면 자르지 않는다.
            tile 범위의 두 점은 순서가 뒤바뀌어 있을 수 있으므로 최소·최대를 다시 정한다.
            교차 범위의 폭이나 높이가 0 이하이면 도형이 전부 tile 밖이라는 뜻이므로 빈 target 을 만들지 않도록 packed 범위를 그대로 쓴다.

        의존:
            THREE — 교차 content 범위 값 생성; 생성자: {new THREE.Vector4()}

        동작:
            packed 도형 범위만으로 content 범위를 구한다.
            tile 범위가 유효하지 않으면 그 content 범위를 그대로 반환한다.
            tile 범위의 최소·최대를 정리하고 content 범위와의 교차를 구한다.
            교차가 비면 packed content 범위를, 아니면 교차 범위를 반환한다.

    resolvePackedTerrainCompositeContentBounds(sourceState: TerrainBufferState) -> Vector4
        역할: packed 도형 종류별 전체 범위를 하나의 content 범위로 합친다.

        처리 기준:
            row 수가 0 이하인 종류와 전체 범위 배열이 없거나 성분이 4 개 미만이거나 유한하지 않은 종류는 건너뛴다.
            합칠 범위가 하나도 없으면 폭과 높이가 1 인 원점 범위를 사용한다.
            폭이나 높이가 0 이하로 남으면 최소값에 1 을 더해 0 크기 target 을 만들지 않는다.

        의존:
            THREE — packed content 범위 값 생성; 생성자: {new THREE.Vector4()}

        동작:
            path, area, circle 순서의 packed 상태 목록을 만든다.
            유효한 종류의 전체 범위를 최소·최대로 합친다.
            합친 결과가 유한하지 않으면 원점 단위 범위를 반환한다.
            폭이나 높이가 0 이하이면 1 로 늘린 범위를 반환한다.

    resolveTerrainCompositeContentPixelSize(contentWidth: number, contentHeight: number, minimumStrokeWidth: number, baseResolution: number, rendererMaxTextureSize: number, maxResolutionScale: number) -> {minimumContentResolution: number, contentPixelWidth: number, contentPixelHeight: number, coverageFallbackEnabled: boolean}
        역할: 합성 target 의 content 픽셀 크기와 최소 content 해상도를 계산한다.

        인터페이스:
            contentWidth: content 폭
            contentHeight: content 높이
            minimumStrokeWidth: 확인된 최소 외곽선 반경이며 모르면 Infinity 다.
            baseResolution: 기본 content 해상도
            rendererMaxTextureSize: renderer texture 한 변 상한
            maxResolutionScale: 기본 해상도 대비 배율 상한
            반환: 최소 content 해상도, content 픽셀 폭·높이, 상한 축소 여부

        처리 기준:
            target 배치와 hybrid 분리 여유 계산이 같은 규칙을 쓰도록 분리한 함수다.
            요청 texel 크기는 최소 외곽선 반경의 두 배이며 반경을 모르면 제한하지 않는다.
            상한은 설정 배율 상한과 renderer 상한에서 gutter 를 뺀 값 중 작은 값이고, 최소 content 해상도는 기본 해상도와 그 상한 중 작은 값이다.
            요청 픽셀 수가 상한을 넘으면 상한으로 줄이고 그 경우를 상한 축소로 알린다.

        동작:
            기본 해상도·배율·renderer 상한으로 content 픽셀 상한과 최소 해상도를 정한다.
            요청 픽셀 수를 최소 해상도와 상한 사이로 맞춰 content 픽셀 폭·높이와 상한 축소 여부를 반환한다.

    resolveTerrainCompositeRasterLayout(contentBounds: Vector4, minimumStrokeWidth: number, baseResolution: number, rendererMaxTextureSize: number, maxResolutionScale: number = TERRAIN_COMPOSITE_MAX_RESOLUTION_SCALE) -> {bounds: Vector4, width: number, height: number, coverageFallbackEnabled: boolean}
        역할: 원본 외곽선을 보존할 target 해상도와 gutter를 포함한 합성 범위를 계산한다.

        인터페이스:
            minimumStrokeWidth: 확인된 최소 외곽선 반경이며 유한하지 않으면 두께 근거가 없다는 뜻이다.
            baseResolution: 기본 content 해상도
            rendererMaxTextureSize: renderer texture 한 변 상한이며 유한하지 않으면 설정 상한만 적용한다.
            maxResolutionScale: 기본 해상도 대비 배율 상한이며 생략하면 기본값 8 을 쓴다.
            반환: bounds 는 gutter 를 포함한 합성 범위, width 와 height 는 gutter 를 더한 target 해상도, coverageFallbackEnabled 는 요청 해상도를 채우지 못했는지 여부

        처리 기준:
            content 폭과 높이는 아주 작은 하한을 적용하여 0 으로 나누지 않는다.
            요청 texel 크기는 최소 외곽선 반경의 두 배이며, 두께 근거가 없으면 무한으로 두어 요청 해상도를 기본 해상도로 남긴다.
            설정 상한은 기본 해상도와 배율 상한의 곱이고, 하드웨어 상한은 renderer 상한에서 양쪽 gutter 를 뺀 값이다. 둘 중 작은 값을 1 이상으로 보정하여 content 해상도 상한으로 삼는다.
            최소 content 해상도는 기본 해상도와 상한 중 작은 값이므로 상한이 기본 해상도보다 작으면 기본 해상도를 보장하지 않는다.
            요청 해상도가 상한을 넘어 줄어들면 coverage 보정이 필요하다고 알린다.
            gutter 는 확정한 texel 크기만큼 네 방향으로 범위를 넓히고 해상도에 양쪽 gutter 를 더해 반영한다.

        의존:
            THREE — gutter 포함 합성 범위 값 생성; 생성자: {new THREE.Vector4()}

        동작:
            content 폭과 높이에 하한을 적용한다.
            같은 규칙을 쓰는 공용 계산으로 content 픽셀 폭·높이와 상한 축소 여부를 구한다.
            확정한 content 해상도로 texel 크기를 다시 구하고 그 크기의 gutter 만큼 범위를 넓힌다.
            gutter 를 더한 해상도와 요청 해상도를 채우지 못했는지 여부를 함께 반환한다.

GPU 자원 생성 책임 그룹
    역할: 합성에 사용하는 raster material, host 구간별 RenderTarget과 합성 결과 항목을 필요한 시점에 한 번씩 만든다.

    createTerrainCompositeRasterMaterial(sourceState: TerrainBufferState, bounds: Vector4) -> ShaderMaterial
        역할: 실제 terrain decal 평가기를 공유하면서 premultiplied alpha로 출력하는 batch raster material을 만든다.

        인터페이스:
            sourceState: packed texture 와 define 이 연결된 상태이며 define 과 uniform 을 그대로 물려받는다.
            bounds: 합성 local 범위이며 uniform 으로 참조를 공유하므로 준비 단계에서 값을 바꾸면 그대로 반영된다.

        처리 기준:
            packed 상태의 define 에 합성 batch 경로와 raster 경로 define 을 더해 job material 의 program 을 가른다.
            vertex 단계는 fullscreen quad 의 NDC 좌표를 합성 범위 안의 tile-local 좌표로 환산하여 decal 평가에 넘기고, decal world 좌표는 사용하지 않으므로 0 으로 둔다.
            fragment 단계는 decal 평가 결과 색을 알파로 미리 곱해 출력하고, 알파가 0 이하이면 픽셀을 버린다.
            이미 premultiplied 로 출력하므로 source 계수는 One 을, destination 계수는 1 에서 source 알파를 뺀 값을 사용한다.
            깊이 판정과 기록을 끄고 양면을 그리며 tone mapping 을 적용하지 않는다.

        의존:
            THREE — premultiplied raster material 생성과 blending 설정; 생성자: {new THREE.ShaderMaterial(), new THREE.Vector2()}; 상수: {DoubleSide, CustomBlending, AddEquation, OneFactor, OneMinusSrcAlphaFactor}; 속성 쓰기: {transparent, depthTest, depthWrite, side, toneMapped, blending, blendEquation, blendSrc, blendDst, blendEquationAlpha, blendSrcAlpha, blendDstAlpha}
            GDecalTerrainShader — decal 평가 fragment 본문 재사용; 속성 읽기: {replaceFragmentShader}

        동작:
            packed 상태의 define 에 합성 batch·raster define 을 더하고, packed uniform 에 host 구간 렌더 순서 상·하한, batch 순번, 합성 범위와 texel 크기 uniform 을 더한다.
            fullscreen quad 좌표를 합성 범위 안의 tile-local 좌표로 환산하는 vertex shader 를 붙인다.
            decal 평가 본문에 알파 사전 곱 출력과 알파 0 이하 버림을 더한 fragment shader 를 붙인다.
            투명 출력, 깊이 판정·기록 해제, 양면 렌더링, tone mapping 해제와 premultiplied 전용 blending 계수를 설정하여 반환한다.

    createTerrainCompositeRenderTarget(width: number, height: number, name: string) -> WebGLRenderTarget
        역할: 합성 결과를 담을 premultiplied RGBA8 offscreen target을 만든다.

        인터페이스:
            name: 진단용 texture 이름
            반환: 깊이·스텐실 버퍼가 없는 합성 target

        처리 기준:
            가로와 세로는 1 미만이면 1 로 올린다.
            sampling 은 선형 필터를 쓰고 mipmap 은 만들지 않으며, 경계 밖 좌표는 가장자리 값으로 고정한다.
            premultiplied 결과를 그대로 보존해야 하므로 색 공간 변환을 적용하지 않고 multisample 도 사용하지 않는다.

        의존:
            THREE — 합성 RenderTarget 생성과 texture 설정; 생성자: {new THREE.WebGLRenderTarget()}; 상수: {RGBAFormat, UnsignedByteType, LinearFilter, NoColorSpace, ClampToEdgeWrapping}; 속성 쓰기: {Texture.name, Texture.generateMipmaps, Texture.colorSpace, Texture.wrapS, Texture.wrapT, WebGLRenderTarget.samples}

        동작:
            1 이상으로 보정한 크기로 RGBA8 target 을 만들고 깊이·스텐실 버퍼를 끈다.
            texture 이름을 넣고 mipmap 생성과 색 공간 변환을 끄며 양방향 wrap 을 가장자리 고정으로 설정한다.
            multisample 수를 0 으로 두고 target 을 반환한다.

    resolveTerrainCompositeVariant(job: TerrainCompositeRasterJob, variantIndex: number) -> TerrainCompositeVariant
        역할: 현재 host 구간의 합성 결과 항목과 RenderTarget을 필요할 때 한 번만 만든다.

        인터페이스:
            variantIndex: host 구간 순번
            반환: 해당 host 구간의 합성 결과 항목

        처리 기준:
            이미 만든 구간이면 그 항목을 그대로 쓴다. target 은 준비 단계가 해상도를 확정한 뒤에만 만들어진다.
            host 구간 identity 와 texture 준비 revision 을 입력 항목에서 그대로 보존해야 잘못된 host 에 결과가 재사용되지 않는다.
            target texture 이름에는 tile key, 세대, revision 과 host material 렌더 순서를 이어 붙여 진단에서 구간을 구분할 수 있게 한다.

        동작:
            이미 만든 host 구간 결과가 있으면 그대로 반환한다.
            입력의 해당 host 구간에서 렌더 순서 상·하한, host key 와 texture 준비 revision 을 옮긴다.
            확정된 target 해상도와 진단용 이름으로 RenderTarget 을 만들어 항목에 넣는다.
            만든 항목을 합성 결과 목록에 추가하고 반환한다.

renderer 연결과 복구 책임 그룹
    역할: 합성 대상 target과 그리기 범위를 renderer에 연결하고, 합성 전 renderer 상태를 저장하여 되돌린다.

    prepareTerrainCompositeVariantRenderer(renderer: WebGLRenderer, job: TerrainCompositeRasterJob, variant: TerrainCompositeVariant) -> void
        역할: 현재 host 구간의 target과 렌더 순서 범위를 renderer와 job material에 연결한다.

        처리 기준:
            renderer 의 viewport 설정자는 canvas pixelRatio 를 곱하므로 RenderTarget 픽셀 단위와 어긋난다. 그래서 target 자체의 viewport 를 지정하고 target 연결이 그 값을 적용하게 한다.
            합성은 target 을 직접 비우고 그리므로 자동 비움을 끈다.

        의존:
            THREE — target viewport 지정과 renderer 연결; 함수: {Vector4.set(), WebGLRenderer.setRenderTarget()}; 속성 쓰기: {WebGLRenderer.autoClear}

        동작:
            host 구간 target 의 viewport 를 확정된 target 해상도 전체로 지정하고 renderer 에 그 target 을 연결한다.
            renderer 의 자동 비움을 끈다.
            job material 의 host 구간 렌더 순서 상·하한 uniform 을 이번 구간 값으로 갱신한다.

    applyTerrainCompositeBatchScissor(renderer: WebGLRenderer, variant: TerrainCompositeVariant, batchBounds: Vector4 | null, compositeBounds: Vector4, width: number, height: number) -> void
        역할: batch의 local 범위를 target 픽셀 scissor로 바꾸어 그리는 영역을 줄인다.

        인터페이스:
            batchBounds: batch 의 local 범위이며 null 이면 scissor 를 해제한다.
            compositeBounds: 전체 합성 local 범위
            width, height: target 해상도

        처리 기준:
            renderer 의 scissor 설정자는 canvas pixelRatio 를 곱하므로 RenderTarget 에 직접 기록하고 target 연결이 그 값을 적용하게 한다.
            batch 범위가 없거나 범위·해상도 값 중 하나라도 유한하지 않거나 합성 범위나 해상도가 0 이하이면 target 전체를 대상으로 삼고 scissor 판정을 끈다.
            선형 필터 sampling 과 가는 path 가 경계에서 잘리지 않도록 최소·최대에 여유 texel 을 더한다.
            변환한 범위가 비면 폭과 높이가 0 인 scissor 를 기록하여 이번 batch 를 실제로 그리지 않게 한다.

        의존:
            THREE — target scissor 기록과 renderer 연결; 함수: {Vector4.set(), WebGLRenderer.setRenderTarget()}; 속성 쓰기: {WebGLRenderTarget.scissorTest}

        동작:
            합성 범위의 폭과 높이를 구하고 batch 범위·합성 범위·해상도의 유효성을 확인한다.
            유효하지 않으면 target 전체 scissor 를 기록하고 scissor 판정을 끈 뒤 target 을 다시 연결하고 끝낸다.
            batch 범위를 합성 범위 대비 비율로 바꾸어 최소는 내림하고 여유 texel 을 뺀 뒤 0 이상으로, 최대는 올림하고 여유 texel 을 더한 뒤 해상도 이하로 자른다.
            범위가 비면 폭과 높이가 0 인 scissor 를, 아니면 그 픽셀 범위를 target 에 기록한다.
            scissor 판정을 켜고 target 을 다시 연결한다.

    captureTerrainCompositeRendererState(renderer: WebGLRenderer) -> TerrainCompositeRendererState
        역할: 합성 중 변경할 renderer 상태를 복구용으로 저장한다.

        인터페이스:
            반환: 이번 진행이 끝난 뒤 되돌릴 renderer 상태이며 viewport, scissor 와 clear 색상은 복제한 값이다.

        처리 기준:
            renderer 가 돌려주는 값 객체는 이후 renderer 내부에서 다시 쓰일 수 있으므로 복제하여 보관한다.

        의존:
            THREE — 현재 renderer 상태 조회; 생성자: {new THREE.Vector4(), new THREE.Color()}; 함수: {getRenderTarget(), getActiveCubeFace(), getActiveMipmapLevel(), getViewport(), getScissor(), getScissorTest(), getClearColor(), getClearAlpha()}; 속성 읽기: {WebGLRenderer.autoClear}

        동작:
            현재 render target, cube face 와 mipmap level 을 읽는다.
            viewport, scissor 와 clear 색상을 새 값 객체로 받아 복제하고 scissor 판정, clear alpha 와 자동 비움 설정을 함께 담아 반환한다.

    restoreTerrainCompositeRendererState(renderer: WebGLRenderer, state: TerrainCompositeRendererState) -> void
        역할: 저장한 renderer 상태를 되돌려 다음 scene 렌더가 같은 조건에서 시작하게 한다.

        처리 기준:
            합성은 target 자체의 viewport 와 scissor 만 바꾸므로 캔버스 설정은 그대로 남아 있다. target 을 되돌린 뒤 캔버스용 설정자를 호출하면 pixelRatio 가 적용되어 target 범위를 덮어쓰므로, 이전 target 이 캔버스일 때만 viewport 와 scissor 를 복원한다.
            clear 색상·알파와 자동 비움 설정은 이전 target 종류와 무관하게 복원한다.

        의존:
            THREE — renderer 상태 복구; 함수: {setRenderTarget(), setViewport(), setScissor(), setScissorTest(), setClearColor()}; 속성 쓰기: {WebGLRenderer.autoClear}

        동작:
            이전 render target 을 cube face 와 mipmap level 과 함께 되돌린다.
            이전 target 이 캔버스이면 viewport, scissor 와 scissor 판정을 복원한다.
            clear 색상과 알파를 복원하고 자동 비움 설정을 되돌린다.

program anchor 유지 책임 그룹
    역할: job material이 해제되어도 같은 define 집합의 shader program이 파괴되지 않도록 renderer별 anchor를 유지하고 정리한다.

    ensureTerrainCompositeProgramAnchor(composer: UTerrainDecalCompositeComposer, renderer: WebGLRenderer, job: TerrainCompositeRasterJob) -> void
        역할: job과 같은 program을 쓰는 anchor material을 renderer마다 define 집합별로 한 번 compile해 둔다.

        처리 기준:
            three 는 material 을 해제할 때 사용 횟수가 0 이 된 program 을 파괴한다. 같은 define 집합의 job 이 겹치지 않고 연달아 끝나면 job 마다 shader 를 다시 link 하므로, 어떤 scene 에도 그리지 않고 texture uniform 도 없는 anchor material 이 program 참조를 유지한다.
            program cache key 의 출력 색 공간은 연결된 render target 에 따라 달라지므로, job target 을 연결한 뒤에 호출해야 job 과 같은 program 을 붙잡는다.
            compile 을 제공하지 않는 renderer 에서는 anchor 없이 기존 동작을 유지한다.
            같은 define 집합의 anchor 가 이미 있으면 다시 만들지 않는다.
            compile 이 실패하면 참조가 없는 anchor material 만 해제하고 예외를 job 의 실패 처리로 넘긴다.
            anchor 는 renderer 를 key 로 보관하므로 합성기를 정리할 때까지 유지된다. [확인 Q-004]

        의존:
            THREE — anchor scene·mesh 구성과 program compile; 생성자: {new THREE.Scene(), new THREE.Mesh(), new THREE.Vector4()}; 함수: {Scene.add(), Mesh.updateMatrix(), WebGLRenderer.compile(), ShaderMaterial.dispose()}; 속성 읽기: {ShaderMaterial.defines, WebGLRenderer.compile}; 속성 쓰기: {Mesh.frustumCulled, Mesh.matrixAutoUpdate}

        동작:
            renderer 가 compile 을 제공하지 않으면 아무것도 하지 않는다.
            해당 renderer 의 anchor 보관소를 찾거나 새로 만들고, job 의 anchor key 가 이미 있으면 끝낸다.
            job material 의 define 만 복제하고 uniform 은 비운 상태로 anchor material 을 만든다.
            공용 geometry 와 그 material 로 mesh 를 만들어 frustum culling 과 matrix 자동 갱신을 끄고 matrix 를 한 번 갱신한 뒤 anchor scene 에 넣는다.
            공용 camera 로 anchor scene 을 compile 하고, 실패하면 anchor material 을 해제한 뒤 예외를 다시 던진다.
            성공하면 anchor key 로 material 과 scene 을 보관한다.

    disposeTerrainCompositeProgramAnchors(composer: UTerrainDecalCompositeComposer) -> void
        역할: 보유한 program anchor를 모두 정리해 shader program 참조를 놓는다.

        처리 기준:
            anchor scene 과 mesh 는 별도로 해제할 자원이 없고 geometry 는 합성기가 소유하므로 material 만 해제한다.

        의존:
            THREE — anchor material 해제; 함수: {ShaderMaterial.dispose()}

        동작:
            renderer 별 anchor 보관소를 순회하여 각 anchor material 을 해제하고 보관소를 비운다.
            renderer 별 보관소 목록 자체도 비운다.

자원 회수와 결과 이전 책임 그룹
    역할: 임시 material을 한 번만 해제하고, 완료한 job의 target 소유권을 결과 buffer 상태로 한 번만 이전한다.

    releaseTerrainCompositeJobMaterial(job: TerrainCompositeRasterJob) -> void
        역할: job이 소유한 임시 raster material을 한 번만 해제한다.

        처리 기준:
            packed source texture 는 호출자가 소유하므로 여기서 해제하지 않는다.
            완료 경로와 정리 경로가 모두 이 해제를 호출하므로 이미 해제했으면 아무것도 하지 않는다.

        의존:
            THREE — 임시 raster material 해제; 함수: {ShaderMaterial.dispose()}

        동작:
            이미 해제했으면 아무것도 하지 않는다.
            job material 을 해제하고 해제 표시를 세운다.

    finishTerrainCompositeRasterJob(job: TerrainCompositeRasterJob) -> TerrainBufferState
        역할: 완료한 job의 RenderTarget 소유권을 결과 buffer 상태로 한 번만 이전하고 job을 등록에서 제거한다.

        인터페이스:
            반환: presentation 으로 이전할 완성 상태

        처리 기준:
            이미 결과 상태를 만들었으면 그 상태를 그대로 돌려주어 두 번 이전하지 않는다.
            vertex shader 의 tile-local 좌표 계산은 composite 경로에서도 tileScale 을 사용한다. 결과 상태에 tileScale 이 없으면 material 이 이전 uniform 을 비우고 새 program 에는 0 이 올라가 모든 픽셀이 texture 의 한 점만 sampling 하므로, 타일 전체가 단색이 되거나 통째로 사라진다.
            입력 packed 상태에 tileScale uniform 이 없으면 결과 uniform 에서도 생략한다.
            precomposed 결과 define 은 입력 packed define 을 물려받지 않고 terrain decal 사용과 composite sampling 경로 두 개만 켠다. 반투명 decal 포함과 material 강제 갱신은 항상 알린다.
            hybrid 결과는 정적 합성 texture 와 동적 packed DataTexture 를 한 material 에서 함께 써야 하므로 입력 packed define 과 uniform 을 모두 물려받고 composite sampling 과 hybrid 경로 define 을 더 켠다. 이때 packed 입력의 소유권이 결과 상태로 옮겨졌음을 함께 알려 scheduler 가 같은 자원을 두 번 해제하지 않게 한다.
            추정 바이트 크기는 target 해상도와 host 구간 수로 계산한 픽셀 바이트에 부가 비용을 더한 값이며, hybrid 는 물려받은 packed 입력의 추정 크기도 더한다.
            합성 target 만의 크기는 전체 크기와 별도로 기록한다. 다음 revision 이 이 target 을 그대로 물려받을 때 전체 크기를 더하면 그 안에 이미 들어 있는 packed 크기가 revision 마다 겹쳐 쌓이므로, 물려받을 쪽이 target 크기만 골라 쓸 수 있어야 한다.
            결과 상태의 tile 기준점은 packed 입력 상태의 기준점을 값 사본으로 옮긴다. 합성 범위는 packed 입력의 tile-local 좌표에서 나오므로 그 기준점이 결과의 좌표계이며, 예약 옵션의 기준점은 예약 시점의 tile 값이라 이 입력이 packing 된 기준점과 다를 수 있어 쓰지 않는다. 입력에 기준점이 없으면 결과에도 없다.
            소유권을 이전한 뒤에는 임시 material 을 해제하고 job 을 완료로 표시하여 합성기 등록에서 제거한다.

        동작:
            결과 상태가 이미 있으면 그것을 반환한다.
            입력 packed 상태의 tileScale uniform 값을 확인한다.
            입력 packed 상태의 tile 기준점을 값 사본으로 만든다.
            hybrid 이면 입력 packed define·uniform 에 composite sampling 과 hybrid define, 합성 범위 uniform, host 구간별 target 목록, 기준점 사본, 소유권 이전 표시를 더해 결과 상태를 만든다.
            hybrid 가 아니면 composite 경로 define, tileScale 과 합성 범위 uniform, host 구간별 target 목록, 반투명 표시, 강제 갱신 표시, 입력 revision, 기준점 사본과 추정 바이트 크기로 결과 상태를 만든다.
            두 경우 모두 합성 target 만의 추정 크기를 결과 상태에 함께 기록한다.
            임시 raster material 을 해제한다.
            결과 상태를 job 에 보관하고 소유권 이전과 완료를 표시한 뒤 합성기 등록에서 job 을 제거하고 결과 상태를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
입력 packed DataTexture와 그 uniform은 호출자가 소유하므로 이 단위는 읽기만 하고 해제하지 않는다. hybrid 결과만 예외로 그 uniform 참조를 결과 상태로 물려주고 소유권 이전을 알린다.
hybrid 계획은 정적 대상 batch만 실행하고 direct 대상은 음수 batch 순번으로 표시되어 합성에서 구조적으로 제외된다. 실행 목록과 음수 표시는 역할이 달라 한쪽만으로는 hybrid를 정확히 실행할 수 없다.
공용 geometry와 camera는 합성기가 소유하며 job 정리에서 해제하지 않고 합성기 정리에서만 해제한다.
완성 target 소유권은 결과 buffer 상태로 한 번만 이전하며, 이전하지 않은 target은 job 정리가 회수한다.
renderer의 viewport·scissor 설정자는 canvas pixelRatio를 곱하므로, target 픽셀 단위 지정에는 RenderTarget의 viewport와 scissor만 사용한다.
합성 batch 순번과 packed index·두께 해석은 shader의 같은 계약을 따르므로 한쪽만 바꾸지 않는다.
공개 진입점이 예외를 밖으로 전달할 때는 그 전에 해당 job의 자원을 회수한다. 다만 renderer 상태 저장 단계의 실패는 이 보장에서 벗어난다.
batch draw 분할(_batchSplitMaxEdgeTexels)은 개발 옵션이며 기본은 비활성이다. 켜져 있어도 target·viewport·quad·uniform texel 크기와 최종 출력 해상도는 바꾸지 않고 scissor 사각형만 정수 격자 조각으로 나눈다. 조각은 서로 겹치지 않고 원래 scissor를 정확히 덮으며, 한 batch의 모든 조각을 끝낸 뒤에만 다음 batch로 넘어가 variant→batch 실행 순서와 hole·alpha 계약을 그대로 유지한다. 조각마다 draw 한 번으로 예산에 계상하고 픽셀 예산에는 조각의 실제 면적을 반영한다. target 전면 clear는 host 구간마다 한 번뿐이며 조각마다 다시 지우지 않는다. 분할은 draw 하나의 크기만 줄이므로 전면 clear·첫 texture 업로드·program link 비용은 줄지 않는다.
batch 범위를 확정하지 못한 draw(batchBounds가 없거나 범위 계산이 무효인 경우)는 원래 전체 target을 덮으므로, 분할이 켜져 있으면 그 전체 사각형을 같은 규칙으로 나눈다. 그래야 가장 큰 발행이 분할에서 빠지지 않는다. 분할이 꺼져 있으면 기존대로 scissor를 끄고 전체 target을 한 번에 그린다. 조각 한 변 상한보다 작아 격자가 1×1이 되는 draw는 나누지 않으며, 이때도 기존 경로와 같은 scissor를 쓴다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
