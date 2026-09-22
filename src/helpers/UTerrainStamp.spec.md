# UTerrainStamp 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UTerrainStamp`는 지형 tile 위에 polygon·circle 기반 fill, gradient, texture와 mask overlay를 적용하거나 polyline을 그리기 위한 stamp 상태를 관리한다. terrain render 직전에는 현재 tile에 영향을 주는 stamp만 골라 shader uniform이 사용할 metadata texture를 준비한다.

### 1.2 책임 범위

- stamp 인스턴스의 app, 대상 레이어, polygon·circle·polyline 도형, 스타일, texture, 가시성 상태를 관리한다.
- app의 image layer 목록과 target layer 조건을 기준으로 overlay registry를 구성한다.
- layer별로 수명이 안정적인 render binding을 유지하고 renderer가 render 직전에 사용할 tile별 stamp metadata를 갱신한다.
- URL별 texture atlas를 lazy 생성하고 이미지 load 완료 시 전체 stamp state를 dirty 처리한다.
- tile bounds와 겹치는 stamp 후보만 골라 tile별 metadata DataTexture를 캐시한다.
- 마지막 stamp가 제거된 layer state와 state가 소유한 metadata texture를 해제한다.
- layer state가 다시 생성될 때 캐시된 terrain material이 기존 uniform 참조로 새 state를 즉시 읽도록 binding을 재사용한다.
- layer state의 최초 생성·최종 해제는 app render나 QuadTileSet update를 강제로 요청하지 않고 다음 terrain render에서 현재 binding 상태로 반영한다.

책임 경계: `UTerrainStamp`는 terrain shader 주입 자체를 수행하지 않고 `GTerrainOverlayShader`가 연결한 uniform 값을 갱신한다. stamp 인스턴스는 자신을 scene에 추가하지 않으며 app과 layer의 수명은 호출자가 관리한다.

### 1.3 주요 동작 방식

stamp는 `setApp()`으로 app context에 연결된 뒤 `visible`이 true이고 유효한 도형이 있을 때만 검색 대상 layer의 registry에 등록된다. 등록 시 외부 입력을 shader용 cache로 복사·정규화한다. render 직전에는 registry cache를 전역 DataTexture의 row로 직렬화하고, tile bounds가 있으면 현재 tile과 겹치는 후보만 담은 별도 DataTexture를 선택한다. shader는 각 row의 도형, 색상, mode, polyline 두께와 texture mapping metadata를 읽어 fill·mask·polyline 결과를 계산한다.

관찰된 실행 특성: `UTerrainMesh` 계열의 material render 직전 경로에서 tile mesh 단위로 `updateRenderUniforms()`가 호출될 수 있다. 큰 world 좌표의 정밀도 손실을 줄이기 위해 overlay origin 기준 상대 좌표를 사용하고, CSS pixel 단위 polyline 두께는 renderer pixel ratio를 함께 전달해 framebuffer pixel 단위로 환산한다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.terrain.UTerrainStamp` 공개 namespace
- `tutorial-official/animationComponents.html`의 polygon texture stamp와 mask stamp 예제
- `GTerrainOverlayShader`의 terrain overlay uniform과 fragment 합성 경로
- `UTerrainMesh`의 shader 연결과 tile draw 직전 uniform 갱신 경로
- `UFrustumHelper`가 생성·갱신하는 시야 영역 fill polygon과 outline polyline stamp

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
stamp는 polygon, circle 또는 polyline 도형만 registry에 등록해야 한다.
polygon 도형은 최소 3개의 점을 가져야 하며 shader point 상한을 넘는 점은 registry cache 생성 시 상한까지만 사용해야 한다.
polyline 도형은 최소 2개의 유효한 점과 0보다 큰 선 두께를 가져야 하며 선 두께 단위는 meters 또는 pixels로 정규화해야 한다.
circle 도형은 center와 0보다 큰 유한한 radius를 가져야 한다.
도형 없는 stamp 인스턴스는 생성할 수 있지만 registry에는 등록하지 않아야 한다.
visible이 false이거나 dispose된 stamp는 registry에서 제거되어 shader 후보에 포함되지 않아야 한다.
setter가 유효한 변경을 수행하면 관련 layer state를 dirty 처리하여 다음 render에서 uniform texture를 다시 작성해야 한다.
getPoints(), getCircle(), getStyle(), getColor(), getGradientColor()는 외부 변경이 내부 상태를 직접 흔들지 않도록 복사 가능한 값을 복사해 반환해야 한다.
texture는 문자열 URL일 때만 이미지 atlas 대상으로 사용하고, texture가 없거나 load되지 않았으면 color 또는 gradient fill 경로를 사용해야 한다.
textureFit은 stretch 또는 contain만 허용하고 그 외 값은 stretch로 보정해야 한다.
textureFit contain은 texture가 있는 4점 polygon에서만 네 꼭짓점 warp 기준으로 사용해야 한다.
mappingFrame은 유효한 3~4개의 world 좌표만 사용하고, 존재하면 polygon 포함 영역과 별개로 texture와 gradient가 공유하는 UV 기준 프레임에 우선 적용해야 한다.
gradientDirection은 vertical 또는 horizontal만 허용하고 그 외 값은 vertical로 보정해야 한다.
mode는 fill 또는 mask 이름과 shader mode 숫자만 허용하고 그 외 값은 자동 layer 기준으로 처리해야 한다.
targetLayer가 있으면 targetLayer보다 renderOrder가 높은 image layer만 검색하고 targetLayer 자체에는 등록하지 않아야 한다.
mode를 생략하고 targetLayer가 있으면 검색된 layer에 mask mode를 사용하며, mode를 명시하면 검색된 layer에 해당 mode를 사용해야 한다.
app의 image layer 목록이 바뀌면 render-before callback 갱신에서 stamp별 검색 layer를 다시 계산해야 한다.
tile bounds가 있으면 tile과 겹치지 않는 stamp를 해당 tile metadata texture에서 제외해야 한다.
tile과 겹치는 stamp가 maxStampsPerTile을 넘으면 tile 중심에서 overlay bounds까지의 거리 기준으로 가까운 stamp를 우선해야 한다.
큰 world 좌표는 overlay origin 기준 상대 좌표로 변환하고 splitDifference 방식으로 JS 단계의 차분 정밀도를 보정해야 한다.
texture atlas 최대 이미지 수는 atlas texture 또는 URL entry가 만들어지기 전에만 변경할 수 있어야 한다.
document가 없는 환경에서는 atlas uniform 구조를 유지하기 위해 1x1 fallback DataTexture를 사용해야 한다.
마지막 stamp가 layer state에서 제거되면 전역·tile별 metadata texture와 finalizer 등록을 해제하고 layer state의 강한 참조를 제거해야 한다.
마지막 stamp 제거 뒤에도 layer별 render binding의 uniform 객체 참조는 유지하고, count 0과 공유 빈 metadata texture를 가리켜야 한다.
한 번 생성된 layer별 render binding은 활성 stamp가 0개여도 render state 조회에서 반환하여 terrain material이 stamp 유무에 따라 shader program을 반복 전환하지 않게 해야 한다.
같은 layer에 stamp가 다시 등록되면 새 layer state는 기존 render binding을 재사용하여 캐시된 terrain material이 dispose된 이전 texture를 참조하지 않게 해야 한다.
layer state의 최초 생성과 최종 해제는 app render나 QuadTileSet update를 강제로 요청하지 않고 다음 terrain render에서 반영해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: terrain tile render 직전에 object별 uniform 값을 반복 갱신할 수 있다.
우선순위: stamp 포함 판정과 mask 결과를 보존하면서 tile별 shader 입력 개수와 texture 재작성 범위를 줄인다.
재사용 기준: layer별 state, 전역 stamp DataTexture, tile별 metadata texture cache, texture atlas, scratch 배열과 Vector는 반복 render에서 재사용해야 한다.
격리 기준: frame 사이에 유지되는 전체 stamp 목록, 전역 상대 origin과 tile 후보 배열은 layer state별로 소유하여 다른 image layer의 render 갱신이 덮어쓰지 않아야 한다.
제한 조건: 전체 stamp 개수는 registry 수집 단계에서 shader row 상한으로 먼저 자르지 않고 tile별 후보 선정 뒤에만 row 상한을 적용해야 한다.
자원 기준: tile별 cache는 object identity와 bounds key 및 texture revision이 같으면 기존 metadata texture를 재사용해야 한다.
자원 기준: 비활성 binding용 빈 metadata texture는 모듈 전체에서 한 장만 공유하고, binding WeakMap 값은 layer를 역참조하지 않아야 한다.
갱신 기준: 좌표·스타일 변경과 layer state의 생성·해제는 추가 app render나 QuadTileSet update 요청을 만들지 않아야 한다.
검증 기준: 많은 stamp가 넓게 분포한 입력에서 멀리 떨어진 stamp가 현재 tile 후보를 밀어내지 않는지 확인해야 한다.
검증 기준: meters와 pixels polyline이 renderer pixel ratio 변화에도 각각 world 두께와 CSS pixel 두께 의미를 유지하는지 확인해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
UTerrainStampPointLike 타입 정의
    x, y: number
        지형 stamp가 사용하는 world XY 좌표
    z?: number
        선택적인 world 높이이며 생략하면 0으로 처리한다.

UTerrainStampCircleValue 타입 정의
    center: Vector3 | UTerrainStampPointLike
        circle의 world 중심점
    radius: number
        circle의 world 단위 반지름

_terrainStampStateByLayer: WeakMap<object, object> = 빈 WeakMap
    layer로 stamp render state를 찾는 약한 색인이다.

_terrainStampRenderBindingByLayer: WeakMap<object, object> = 빈 WeakMap
    layer state가 해제·재생성되어도 terrain material이 같은 uniform 객체를 참조하게 하는 layer별 약한 색인이다.
    binding 값은 layer를 역참조하지 않아 layer key와 함께 회수될 수 있다.

_terrainStampStates: Set<object> = 빈 Set
    모든 활성 layer state를 순회하고 빈 state를 해제하기 위해 state를 강하게 보유한다.

_terrainStampAppStates: WeakMap<object, object> = 빈 WeakMap
    app별 stamp Set과 render-before callback 수명주기를 보관한다.

_terrainStampTileTextureFinalizer: FinalizationRegistry | undefined
    의존:
        Web API — tile object 회수 callback 등록 기반 생성; 생성자: {new FinalizationRegistry()}
        DataTexture — 회수된 tile의 metadata texture 해제; 함수: {dispose()}
    FinalizationRegistry를 지원하는 환경에서만 생성한다.

UTerrainStampAtlas 클래스 정의
    atlasSize: number
        atlas canvas 한 변의 픽셀 크기이다.
    cellSize: number
        atlas 안에서 URL 이미지 한 장이 차지하는 정사각 cell 크기이다.
    cellsPerRow: number
        atlas 한 행에 배치할 cell 수이다.
    maxImages: number
        atlas에 등록할 수 있는 서로 다른 이미지 URL의 최대 수이다.
    entries: Map<string, object>
        정규화된 URL별 atlas cell과 load 상태를 보관한다.
    canvas: HTMLCanvasElement | undefined
        브라우저 환경에서 atlas 픽셀을 합성하는 canvas이다.
    context: CanvasRenderingContext2D | undefined = undefined
        atlas canvas의 2D 그리기 context이며 getTexture와 loadEntry의 사용 가능 조건 분기를 제어한다.
    texture: CanvasTexture | DataTexture | undefined = undefined
        shader에 전달할 atlas texture 또는 document 부재 fallback texture이며 getTexture 재사용과 setMaxImages 차단 조건 분기를 제어한다.

    constructor()
        역할: URL별 stamp 이미지를 한 장의 atlas texture cell로 관리하는 상태를 초기화한다.
        동작:
            기본 atlas 크기, cell 크기, cell 배치 수와 최대 이미지 수를 저장한다.
            URL entry Map, canvas, context와 texture 참조를 빈 상태로 둔다.

    setMaxImages(value: number) -> boolean
        역할: atlas가 사용되기 전 URL image 최대 수를 변경한다.
        처리 기준:
            texture 또는 entry가 이미 만들어졌으면 경고하고 false를 반환한다.
            value가 0보다 큰 유한한 정수로 변환되지 않으면 경고하고 false를 반환한다.
        의존: Web API — 경고 출력; 함수: {console.warn()}
        동작:
            최대 이미지 수의 제곱근을 올림해 한 줄 cell 수를 계산한다.
            cell 크기를 곱한 atlas 크기를 2의 거듭제곱으로 보정해 저장한다.

            cellsPerRow와 maxImages를 갱신하고 true를 반환한다.

    getMaxImages() -> number
        동작: 현재 atlas 최대 이미지 수를 반환한다.

    getTexture() -> CanvasTexture | DataTexture
        역할: shader uniform에 연결할 atlas texture를 lazy 생성해 반환한다.
        의존:
            Three texture API — document 또는 2D context 부재 fallback과 브라우저 atlas texture 구성; 생성자: {new DataTexture(), new CanvasTexture()}; 상수: {RGBAFormat, FloatType, LinearFilter, ClampToEdgeWrapping}; 속성 쓰기: {needsUpdate, minFilter, magFilter, wrapS, wrapT, generateMipmaps, flipY}
            Web API — canvas 생성과 2D context 조회; 함수: {document.createElement(), getContext(), clearRect()}
        동작:
            기존 texture가 있으면 그대로 반환한다.
            document가 없으면 1x1 흰색 DataTexture를 만들고 저장해 반환한다.
            canvas를 atlas 크기로 만들고 2D context를 얻는다.
            2D context를 얻지 못하면 1x1 흰색 DataTexture를 만들고 저장해 반환한다.
            canvas를 비우고 linear filter와 clamp wrapping을 가진 CanvasTexture를 만들어 저장한 뒤 반환한다.

    getEntry(url: string) -> object | undefined
        역할: texture URL에 대응하는 atlas cell entry를 반환하고 없으면 새로 등록한다.
        처리 기준: 빈 URL이면 undefined를 반환한다.
        의존: Web API — 경고 출력; 함수: {console.warn()}
        동작:
            URL 문자열을 정규화하고 기존 entry가 있으면 반환한다.
            maxImages를 넘으면 경고하고 undefined를 반환한다.
            다음 cell index의 row와 column으로 atlas UV rect를 계산한다.
            unloaded entry를 Map에 저장하고 이미지 load를 시작한다.

            새 entry를 반환한다.

    loadEntry(entry: object, x: number, y: number) -> void
        역할: atlas entry의 이미지 URL 후보를 순차 load한다.
        의존: Web API — 모든 URL 후보가 실패했을 때 경고 출력; 함수: {console.warn()}
        동작:
            atlas texture를 준비한다.
            context가 없거나 Image 생성자가 없으면 load를 시도하지 않는다.
            URL 후보 목록을 만든다.

            후보가 소진되면 entry를 unloaded 상태로 두고 경고한다.
            현재 후보 URL의 Image load 함수를 호출하고 실패 callback에서 다음 후보를 시도한다.

    loadImage(entry: object, x: number, y: number, url: string, onError: Function) -> void
        역할: 단일 이미지 후보를 atlas cell에 그리는 비동기 load를 시작한다.
        의존:
            Web API — 이미지 로드와 canvas 그리기; 생성자: {new Image()}; 콜백: {onload, onerror}; 속성 쓰기: {crossOrigin, src}
            CanvasRenderingContext2D — atlas cell 갱신; 함수: {clearRect(), drawImage()}
        동작:
            Image를 만들고 entry에 보관한다.
            anonymous CORS를 설정한다.
            load 성공 callback에서 cell을 비우고 이미지를 cell 크기로 그린다.
            load 성공 callback에서 entry를 loaded로 표시하고 atlas texture와 전체 stamp state를 dirty 처리한다.

            load 실패 callback에서 onError를 호출한다.
            Image src를 설정해 load를 시작한다.

_textureAtlas: UTerrainStampAtlas
    모든 stamp 인스턴스가 공유하는 URL texture atlas이다.

UTerrainStamp 클래스 정의
    #disposed: boolean = false
        true가 되면 setter가 실행되어도 registry에 다시 등록하지 않는다.

    #app: object | undefined
        app별 stamp 등록과 image layer 검색에 사용하는 현재 app이다.

    #searchLayers: Array<object> = 빈 배열
        현재 app과 targetLayer 기준으로 registry를 연결할 image layer 목록이다.

    visible: boolean = false
        registry 등록 허용 여부이며 true이고 유효한 도형과 검색 layer가 있을 때만 등록된다.

    type: 'polygon' | 'circle' | 'polyline' = 'polygon'
        현재 도형 종류이며 registry cache와 circle getter의 도형 조건 분기를 제어한다.

    points: Array<Vector3 | UTerrainStampPointLike> | undefined
        polygon의 꼭짓점 또는 polyline의 경유점으로 사용하는 world 좌표 점 목록이다.

    center: Vector3 | UTerrainStampPointLike | undefined = undefined
        circle 도형의 world 좌표 중심이며 circle cache와 getter의 유효성 조건 분기를 제어한다.

    radius: number | undefined = undefined
        circle 도형의 양수 world 단위 반지름이며 circle getter의 유효성 조건 분기를 제어한다.

    lineWidth: number = 1
        polyline의 0보다 큰 선 두께이다.

    lineWidthUnits: 'meters' | 'pixels' = 'meters'
        polyline 선 두께를 world meter 또는 CSS pixel로 해석하는 단위이다.

    color, gradientColor: string | number | Color | undefined
        texture가 없거나 load 전일 때 사용할 기본 색상과 선택적 gradient 끝 색상이다.

    opacity: number = 1
        color fill alpha의 원본 입력값이다.

    gradientDirection: 'vertical' | 'horizontal' = 'vertical'
        gradient 진행 방향이며 허용되지 않은 값은 vertical로 보정된다.

    texture: string | undefined
        atlas에 등록할 이미지 URL이며 문자열이 아니면 cache 생성 시 texture를 사용하지 않는다.

    textureOpacity, textureScale: number | undefined
        texture 전체 불투명도와 mapping frame 배율의 원본 입력값이다.

    textureUseAlpha: boolean | undefined
        false일 때만 이미지 alpha를 무시한다.

    textureFit: 'stretch' | 'contain' = 'stretch'
        texture mapping 방식이며 허용되지 않은 값은 stretch로 보정된다.

    mappingFrame: Array<Vector3> | undefined
        polygon 포함 영역과 별개로 texture와 gradient의 UV 좌표계를 공유하게 하는 3~4점 world 기준 프레임이다.

    expectTexture: boolean = false
        shader metadata에 texture 기대 여부를 기록하는 값이다.

    targetLayer: object | undefined
        검색 layer 범위와 자동 mask mode를 정하는 기준 layer이다.

    mode: number | undefined
        명시한 fill 또는 mask shader mode이며 undefined이면 targetLayer 유무로 자동 결정한다.

    maxStampsPerTile: number = TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS
        registry 동기화 시 layer state에 반영할 tile별 최대 row 수의 원본 입력값이다.

    static setTextureAtlasMaxImages(value: number) -> boolean
        동작: 전역 texture atlas의 최대 이미지 수 변경 결과를 반환한다.

    static getTextureAtlasMaxImages() -> number
        동작: 전역 texture atlas의 현재 최대 이미지 수를 반환한다.

    static getRenderState(layer: object) -> object | undefined
        역할: terrain material이 사용할 layer별 stamp uniform 상태를 조회한다.
        인터페이스:
            결과의 activeCount는 현재 layer registry의 stamp 수이다.
            uniforms는 count, objectRelative, pixelRatio, stampDataTexture, stampDataTextureSize와 textureAtlas의 layer별 안정적인 동일 참조를 제공한다.
        동작:
            layer의 stamp state를 조회한다.

            등록된 stamp cache가 있으면 state가 보유한 render binding을 반환한다.
            활성 state가 없으면 이전에 생성된 layer render binding을 조회해 반환하고, binding도 없으면 undefined를 반환한다.

    static updateRenderUniforms(layer: object, renderContext: object = {}) -> void
        역할: render 직전 현재 tile object에 맞는 overlay uniform 값을 갱신한다.
        인터페이스: renderContext.object는 현재 terrain render object이고 renderContext.renderer는 pixel ratio를 제공한다.
        동작:
            layer의 기존 stamp state를 조회한다.

            state가 없으면 종료한다.
            state와 renderContext로 overlay uniform을 갱신한다.

    static refreshAppLayerStates(app: object) -> boolean
        역할: app의 image layer 구성이 바뀌었는지 stamp별 검색 layer를 갱신한다.
        동작:
            app stamp state를 조회한다.

            app state가 없거나 stamp가 없으면 false를 반환한다.
            등록된 stamp를 순회하며 검색 layer 갱신 여부를 누적한다.
            하나 이상 갱신되었으면 true를 반환한다.

    constructor(opt: object = {})
        역할: stamp의 도형, 스타일, layer 적용 상태를 초기화하고 가능한 경우 registry에 등록한다.
        인터페이스:
            visible은 최초 registry 등록 허용 여부이며 생략하면 false이다.
            type은 polygon, circle 또는 polyline이고 생략하면 polygon이다.
            polygon과 polyline은 points를 사용하고 circle은 center와 radius를 사용한다.
            polyline의 lineWidth는 생략하면 1이고 lineWidthUnits는 meters 또는 pixels이다.
            color·opacity·gradientColor·gradientDirection은 texture가 없거나 아직 load되지 않은 fill 표현을 정한다.
            texture·textureOpacity·textureUseAlpha·textureScale·textureFit은 이미지 atlas와 UV 표현을 정한다.
            mappingFrame은 polygon 포함 영역과 별개로 texture·gradient가 공유할 3~4점 world UV 프레임이다.
            targetLayer와 mode는 적용 layer 범위와 fill·mask 처리를 정하고 maxStampsPerTile은 tile별 row 상한을 정한다.
        처리 기준:
            도형 옵션이 없으면 빈 stamp로 생성하고 registry에 등록하지 않는다.
            도형 옵션이 있으나 유효하지 않으면 오류를 기록하고 registry에 등록하지 않는다.
        의존:
            defaultValue — 기본값 선택; 함수: {defaultValue()}
            __GError__ — 유효하지 않은 도형 오류 기록; 함수: {__GError__()}
        동작:
            visible, fill·gradient·texture 값과 targetLayer, mode, lineWidth, lineWidthUnits 및 maxStampsPerTile을 기본값과 함께 저장한다.
            textureFit, gradientDirection, mode와 lineWidthUnits를 허용 값으로 보정하고 mappingFrame을 최대 4개의 유효한 좌표 복사본으로 정규화한다.

            도형 관련 옵션이 없으면 생성만 마치고 종료한다.
            도형 옵션이 있으면 type에 맞는 도형을 설정한다.

            도형 설정이 실패하면 오류를 기록하고 종료한다.
            현재 상태를 registry에 동기화한다.

    setApp(app: object | undefined) -> UTerrainStamp
        역할: stamp가 적용될 app context를 변경한다.
        동작:
            기존 registry와 이전 app stamp set에서 자신을 제거한다.

            새 app을 저장하고 app stamp set에 등록한다.

            새 app과 targetLayer 기준 검색 layer를 계산한다.

            disposed 상태라도 app stamp set 등록과 layer 검색은 수행하며, registry 동기화 단계에서만 재등록을 중단한다. [확인 Q-003]

            자신을 반환한다.

    getApp() -> object | undefined
        동작: 현재 app 참조를 반환한다.

    setTargetLayer(layer: object | undefined) -> UTerrainStamp
        역할: 검색 layer 경계와 mode 생략 시 자동 mask 기준이 되는 대상 layer를 변경한다.
        동작:
            현재 targetLayer와 같은 입력이면 자신을 반환한다.
            기존 registry에서 제거하고 targetLayer를 저장한다.

            app과 targetLayer 기준 검색 layer를 다시 계산한다.

            registry를 다시 동기화하고 자신을 반환한다.

    getTargetLayer() -> object | undefined
        동작: 현재 targetLayer 참조를 반환한다.

    도형 변경 책임 그룹
        역할: stamp의 polygon, circle 또는 polyline 도형 정보를 변경하고 registry를 동기화한다.

        setPoints(points: Array<Vector3 | UTerrainStampPointLike>) -> UTerrainStamp | undefined
            인터페이스: 현재 type이 polyline이면 경유점으로, 그 외에는 polygon 꼭짓점으로 사용한다.
            처리 기준:
                polyline은 유효한 점 2개 이상과 현재의 양수 lineWidth가 필요하다.
                polygon은 유효한 점 3개 이상이 필요하며 실패하면 오류를 기록하고 undefined를 반환한다.
            의존: __GError__ — 도형 입력 오류 기록; 함수: {__GError__()}
            동작:
                현재 type을 확인해 polyline 또는 polygon 검증·설정 경로를 선택한다.

                설정이 실패하면 오류를 기록하고 undefined를 반환한다.
                registry를 동기화하고 자신을 반환한다.

        getPoints() -> Array<Vector3 | UTerrainStampPointLike> | undefined
            동작:
                현재 points가 배열이 아니면 undefined를 반환한다.
                polygon 꼭짓점 또는 polyline 경유점의 복사본을 담은 새 배열을 반환한다.

        setCircle(center: Vector3 | UTerrainStampPointLike, radius: number) -> UTerrainStamp | undefined
            처리 기준: center가 없거나 radius가 양수가 아니면 오류를 기록하고 undefined를 반환한다.
            의존: __GError__ — circle 입력 오류 기록; 함수: {__GError__()}
            동작:
                circle center와 radius를 설정한다.

                설정이 실패하면 오류를 기록하고 undefined를 반환한다.
                registry를 동기화하고 자신을 반환한다.

        getCircle() -> UTerrainStampCircleValue | undefined
            의존: defined — circle 속성 존재 여부 판정; 함수: {defined()}
            동작:
                현재 type이 circle이 아니거나 center 또는 radius가 없으면 undefined를 반환한다.
                center 복사본과 radius를 반환한다.

        update(opt: object = {}) -> UTerrainStamp | undefined
            역할: 도형과 스타일 변경을 한 번에 적용하고 registry 동기화를 한 번만 수행한다.
            인터페이스:
                opt는 생성자와 같은 도형·스타일 필드 중 이번에 변경할 값만 받는다.
                points는 opt.type이 polyline이거나 type이 생략된 현재 도형이 polyline이면 polyline 경유점으로 사용한다.
            처리 기준:
                points가 전달되었고 선택된 polygon 또는 polyline 설정이 실패하면 오류를 기록하고 undefined를 반환한다.
                center 또는 radius가 전달되었고 circle 설정이 실패하면 오류를 기록하고 undefined를 반환한다.
            의존: __GError__ — 도형 입력 오류 기록; 함수: {__GError__()}
            동작:
                전달된 points가 있으면 opt.type과 현재 type을 기준으로 polyline 또는 polygon 인스턴스 상태를 먼저 설정한다.

                그 뒤 center 또는 radius가 있으면 circle 도형을 설정하며, 이 검증이 실패하면 앞에서 바꾼 points 상태를 되돌리지도, registry를 동기화하지도 않은 채 undefined를 반환한다. [확인 Q-001]

                스타일 값을 적용한다.

                registry를 동기화하고 자신을 반환한다.

    스타일 변경 책임 그룹
        역할: stamp의 fill·gradient·texture·mapping·polyline 표현과 적용 layer 기준을 변경하고 registry를 동기화한다.

        setStyle(style: object = {}) -> UTerrainStamp
            인터페이스:
                style은 color, opacity, gradientColor, gradientDirection, texture 계열 값, mappingFrame, expectTexture, targetLayer, mode, lineWidth와 lineWidthUnits 중 변경할 값만 받는다.
            동작:
                전달된 스타일 속성만 적용한다.

                registry를 동기화하고 자신을 반환한다.

        getStyle() -> object
            인터페이스: 결과는 color, opacity, gradientColor, gradientDirection, texture, textureOpacity, textureUseAlpha, textureScale, textureFit, mappingFrame, expectTexture, lineWidth와 lineWidthUnits를 포함한다.
            동작:
                color와 gradientColor를 복사하고 mappingFrame의 각 점도 복사한다.

                fill·gradient·texture·mappingFrame·polyline 스타일 값을 plain object로 묶어 반환한다.

        setColor(color: string | number | Color) -> UTerrainStamp
            동작:
                color를 저장한다.
                registry를 동기화하고 자신을 반환한다.

        getColor() -> string | number | Color
            동작: 현재 color의 복사 가능한 값을 복사해 반환한다.

        setOpacity(opacity: number) -> UTerrainStamp
            동작:
                opacity를 저장한다.
                registry를 동기화하고 자신을 반환한다.

        getOpacity() -> number
            동작: 현재 opacity를 반환한다.

        setGradient(color: string | number | Color, direction: string = this.gradientDirection) -> UTerrainStamp
            동작:
                gradientColor를 저장하고 gradientDirection을 허용 값으로 보정해 저장한다.

                registry를 동기화하고 자신을 반환한다.

        getGradientColor() -> string | number | Color | undefined
            동작: 현재 gradientColor의 복사 가능한 값을 복사해 반환한다.

        setGradientDirection(direction: string) -> UTerrainStamp
            동작:
                gradientDirection을 허용 값으로 보정해 저장한다.

                registry를 동기화하고 자신을 반환한다.

        getGradientDirection() -> 'vertical' | 'horizontal'
            동작: 현재 gradientDirection을 반환한다.

        clearGradient() -> UTerrainStamp
            동작:
                gradientColor를 undefined로 제거한다.
                registry를 동기화하고 자신을 반환한다.

        setTexture(texture: string | undefined, options: object = {}) -> UTerrainStamp
            동작:
                texture 값을 저장한다.
                options에 포함된 textureOpacity, textureUseAlpha, textureScale과 textureFit만 갱신한다.
                textureFit은 허용 값으로 보정해 저장한다.

                registry를 동기화하고 자신을 반환한다.

        getTexture() -> string | undefined
            동작: 현재 texture 값을 반환한다.

        clearTexture() -> UTerrainStamp
            동작:
                texture, textureOpacity, textureUseAlpha와 textureScale을 undefined로 제거한다.
                textureFit을 stretch로 되돌린다.
                registry를 동기화하고 자신을 반환한다.

        setTextureOpacity(opacity: number) -> UTerrainStamp
            동작:
                textureOpacity를 저장한다.
                registry를 동기화하고 자신을 반환한다.

        getTextureOpacity() -> number | undefined
            동작: 현재 textureOpacity를 반환한다.

        setTextureUseAlpha(useAlpha: boolean) -> UTerrainStamp
            동작:
                textureUseAlpha를 저장한다.
                registry를 동기화하고 자신을 반환한다.

        getTextureUseAlpha() -> boolean | undefined
            동작: 현재 textureUseAlpha를 반환한다.

        setTextureScale(scale: number) -> UTerrainStamp
            동작:
                textureScale을 저장한다.
                registry를 동기화하고 자신을 반환한다.

        getTextureScale() -> number | undefined
            동작: 현재 textureScale을 반환한다.

        setTextureFit(fit: 'stretch' | 'contain') -> UTerrainStamp
            동작:
                textureFit을 허용 값으로 보정해 저장한다.

                registry를 동기화하고 자신을 반환한다.

        getTextureFit() -> 'stretch' | 'contain'
            동작: 현재 textureFit을 반환한다.

    표시와 수명주기 책임 그룹
        역할: registry 등록 여부와 폐기 상태를 관리한다.

        setMaxStampsPerTile(value: number) -> UTerrainStamp
            동작:
                maxStampsPerTile 값을 저장한다.
                registry를 동기화하고 자신을 반환한다.

        getMaxStampsPerTile() -> number
            동작: 현재 maxStampsPerTile 값을 반환한다.

        setVisible(visible: boolean) -> UTerrainStamp
            동작:
                visible이 true일 때만 true로 저장한다.
                registry를 동기화하고 자신을 반환한다.

        getVisible() -> boolean
            동작: 현재 visible 값을 반환한다.

        clear() -> UTerrainStamp
            동작:
                visible을 false로 바꿔 이후 render 후보에서 제외한다.
                현재 stamp를 모든 layer registry에서 제거하고 비어진 layer state를 해제한다.

                자신을 반환한다.

        dispose() -> void
            처리 기준: dispose 이후 setter가 호출되어도 registry에 다시 등록하지 않는다.
            동작:
                registry에서 제거한다.

                app stamp set에서 자신을 제거한다.

                app 참조를 undefined로 지운다.
                disposed 상태를 true로 확정하지만 이후 setApp()의 app stamp set 등록은 별도 차단하지 않는다. [확인 Q-003]

    #syncRegistry() -> void
        역할: 현재 visible, disposed와 도형 상태를 layer registry에 반영한다.
        동작:
            disposed 상태이면 종료한다.
            visible이 false이면 registry에서 제거하고 종료한다.

            현재 stamp cache를 registry에 등록한다.

    #refreshSearchLayers() -> boolean
        역할: app의 현재 image layer 목록에 맞게 stamp 등록 대상 layer를 갱신한다.
        동작:
            app과 targetLayer 기준 새 검색 layer 목록을 계산한다.

            새 목록과 기존 목록의 순서별 논리 layer가 모두 같으면 false를 반환한다.

            기존 registry에서 제거하고 검색 layer 목록을 교체한다.

            registry를 동기화하고 true를 반환한다.

    #applyStyle(style: object = {}) -> void
        역할: 전달된 style 속성만 현재 인스턴스에 반영한다.
        동작:
            color, opacity, gradientColor과 texture·alpha·scale·fit 중 전달된 값만 저장한다.
            mappingFrame은 유효한 3~4점 좌표 복사본으로 정규화하고, lineWidth는 기존 값을 fallback으로 하는 양수로 보정한다.

            gradientDirection, textureFit, mode와 lineWidthUnits를 각각 허용 값으로 보정하고 expectTexture를 boolean으로 저장한다.

            targetLayer가 전달되면 저장한다.
            app과 targetLayer 기준 검색 layer 목록을 다시 계산한다.

    #registerTerrainOverlay() -> void
        역할: 현재 stamp 상태의 normalized cache를 적용 대상 layer state에 등록한다.
        의존: defined — cache와 mode 존재 여부 판정; 함수: {defined()}
        동작:
            기존 registry 등록분을 먼저 제거한다.

            현재 type에 맞춰 polygon, circle 또는 polyline cache를 만든다.

            cache 생성에 실패하면 종료한다.
            검색 layer를 순회한다.
            현재 stamp가 mask 동작인지 판정한다.

            mask stamp가 targetLayer 자체에 해당하면 state를 만들지 않고 다음 layer로 넘어간다.

            layer별 mode를 계산하고 mode가 없으면 state를 만들지 않고 다음 layer로 넘어간다.

            실제 출력할 layer의 state만 생성하거나 조회한다.

            stamp cache에 mode, owner와 targetLayer를 더해 state cacheByStamp에 저장한다.
            render binding의 activeCount를 현재 cache 수로 동기화한다.

            maxStampsPerTile이 있으면 state 한도를 갱신한다.

            state를 dirty 처리한다.
            성공·조기 종료·오류 여부와 관계없이 비어 있는 layer state를 찾아 자원을 해제한다.

    #unregisterTerrainOverlay(cleanupEmptyStates: boolean = false) -> void
        역할: 모든 layer state에서 현재 stamp cache를 제거하고 요청된 경우 비어진 state를 해제한다.
        동작:
            전체 terrain stamp state를 순회하며 현재 stamp cache가 삭제된 state만 dirty 처리하고 render binding의 activeCount를 동기화한다.

            cleanupEmptyStates가 true이면 cache가 비어진 state를 별도 배열에 수집한다.
            순회가 끝난 뒤 수집한 state의 GPU texture와 registry 소유권을 해제한다.

    #setShape(opt: object = {}) -> boolean
        의존: defaultValue — 생략한 type을 polygon으로 선택; 함수: {defaultValue()}
        동작:
            type 생략값은 polygon으로 사용한다.
            type이 polygon이면 polygon points 설정 결과를 반환한다.

            type이 circle이면 circle shape 설정 결과를 반환한다.

            type이 polyline이면 points와 lineWidth를 사용한 polyline 설정 결과를 반환한다.

            지원하지 않는 type이면 false를 반환한다.

    #setPolygonPoints(points: Array<Vector3 | UTerrainStampPointLike>) -> boolean
        처리 기준: points는 좌표값이 유효한 점 3개 이상의 배열이어야 한다.
        동작:
            입력이 유효하지 않으면 false를 반환한다.

            type을 polygon으로 저장하고 points를 저장한다.
            center와 radius를 undefined로 제거하고 true를 반환한다.

    #setPolylinePoints(points: Array<Vector3 | UTerrainStampPointLike>, lineWidth: number) -> boolean
        처리 기준: points는 좌표값이 유효한 점 2개 이상의 배열이고 lineWidth는 0보다 큰 유한한 수여야 한다.
        동작:
            lineWidth를 양수로 변환하고 points와 함께 유효성을 검사한다.

            입력이 유효하지 않으면 false를 반환한다.
            type을 polyline으로 저장하고 points와 보정한 lineWidth를 저장한다.
            center와 radius를 undefined로 제거하고 true를 반환한다.

    #setCircleShape(center: Vector3 | UTerrainStampPointLike, radius: number) -> boolean
        처리 기준: center가 있고 radius가 0보다 큰 유한한 수여야 한다.
        동작:
            radius를 Number로 변환한다.
            입력이 유효하지 않으면 false를 반환한다.

            type을 circle로 저장하고 center와 radius를 저장한다.
            points를 undefined로 제거하고 true를 반환한다.

    #createPolygonStampCache() -> object | undefined
        역할: polygon stamp를 shader texture row에 쓰기 좋은 독립 cache로 변환한다.
        의존:
            Vector3 — plain point 복사; 생성자: {new Vector3()}
            Color — fill과 gradient 색상 정규화; 생성자: {new Color()}
            defined — points와 texture 존재 여부 판정; 함수: {defined()}
            TERRAIN_OVERLAY_SHADER — polygon type과 point 상한; 상수: {TYPE_POLYGON, MAX_POINTS}
        동작:
            points가 없거나 3개 미만이면 undefined를 반환한다.
            shader point 상한까지 points를 자르고 좌표 유효성을 검사한 뒤 각각 Vector3로 복사한다.

            유효한 복사 결과가 3개 미만이면 undefined를 반환한다.
            문자열 texture URL만 texture 값으로 채택한다.
            shader type, points, fill·gradient, texture 옵션, mappingFrame 복사본과 expectTexture를 담은 cache를 반환한다.

    #createPolylineStampCache() -> object | undefined
        역할: polyline stamp를 shader가 선분 거리로 판정할 수 있는 독립 cache로 변환한다.
        의존:
            Vector3 — 경유점 복사; 생성자: {new Vector3()}
            Color — 선 색상 정규화; 생성자: {new Color()}
            defined — points 존재 여부 판정; 함수: {defined()}
            TERRAIN_OVERLAY_SHADER — polyline type과 point 상한; 상수: {TYPE_POLYLINE, MAX_POINTS}
        동작:
            points가 없거나 2개 미만이면 undefined를 반환한다.
            shader point 상한까지 points를 자르고 좌표 유효성을 검사한 뒤 각각 Vector3로 복사한다.

            lineWidth를 양수로 보정하고, 유효한 점이 2개 미만이거나 두께가 양수가 아니면 undefined를 반환한다.

            선 색상과 0~1 opacity를 만들고 lineWidthUnits를 meters 또는 pixels로 보정한다.

            texture·gradient를 사용하지 않는 polyline type, points, 선 두께와 단위 및 색상 cache를 반환한다.

    #createCircleStampCache() -> object | undefined
        역할: circle stamp를 shader texture row에 쓰기 좋은 독립 cache로 변환한다.
        의존:
            Vector3 — center 복사; 생성자: {new Vector3()}; 함수: {clone()}
            Color — fill과 gradient 색상 정규화; 생성자: {new Color()}
            defined — center와 texture 존재 여부 판정; 함수: {defined()}
            TERRAIN_OVERLAY_SHADER — circle type; 상수: {TYPE_CIRCLE}
        동작:
            center가 없으면 undefined를 반환한다.
            center를 복사하고 radius를 Number로 변환한다.
            center XY와 radius가 유효하지 않으면 undefined를 반환한다.
            문자열 texture URL만 texture 값으로 채택한다.
            shader type, center, radius, color, gradient, opacity, texture, texture 옵션과 expectTexture를 담은 cache를 반환한다.

    #resolveTextureOpacity(defaultOpacity: number) -> number
        의존: defined — 문자열 texture 존재 여부 판정; 함수: {defined()}
        동작:
            textureOpacity가 유한한 수이면 0에서 1 사이로 clamp해 반환한다.
            문자열 texture가 있으면 1을 반환한다.
            texture가 없으면 defaultOpacity를 0에서 1 사이로 clamp해 반환한다.

    #resolveTextureScale() -> number
        동작: textureScale이 0보다 큰 유한한 수이면 그 값을 반환하고 아니면 1을 반환한다.

    #resolveTextureFit() -> string
        동작: 현재 textureFit을 허용 값으로 보정해 반환한다.

setTerrainStampMaxStampsPerTile(state: object, value: number) -> void
    역할: layer state가 한 tile에서 shader에 전달할 최대 stamp row 수를 보정한다.
    의존: TERRAIN_OVERLAY_SHADER — shader가 지원하는 최대 row 수; 상수: {MAX_OVERLAYS}
    동작:
        value를 양의 정수와 shader 최대 row 수 범위로 보정하고 유효하지 않으면 shader 최대 row 수를 사용한다.
        state가 없거나 기존 한도와 같으면 종료한다.
        보정한 한도를 저장하고 state를 dirty 처리한다.

getTerrainStampLayerMode(stamp: UTerrainStamp, layer: object) -> number | undefined
    역할: 명시 mode와 targetLayer를 기준으로 현재 layer에 기록할 shader mode를 결정한다.
    의존:
        defined — mode와 targetLayer 존재 여부 판정; 함수: {defined()}
        TERRAIN_OVERLAY_SHADER — fill·mask mode 값; 상수: {MODE_FILL, MODE_MASK}
    동작:
        stamp에 명시 mode가 있으면 그대로 반환한다.
        targetLayer가 있으면 targetLayer와 같은 layer에는 undefined를, 그 외 검색 layer에는 mask mode를 반환한다.

        targetLayer가 없으면 fill mode를 반환한다.

resolveTerrainStampMode(mode: string | number | undefined) -> number | undefined
    의존:
        defined — mode 존재 여부 판정; 함수: {defined()}
        TERRAIN_OVERLAY_SHADER — fill·mask mode 값; 상수: {MODE_FILL, MODE_MASK}
    동작:
        mode가 없으면 undefined를 반환한다.
        문자열 fill과 mask는 대응 shader mode 숫자로 변환한다.
        숫자가 shader fill 또는 mask mode와 같으면 반환하고 그 외 값은 undefined로 보정한다.

resolveTerrainStampLineWidthUnits(units: string | undefined) -> 'meters' | 'pixels'
    동작: units가 pixels이면 pixels를 반환하고 그 외 값은 meters로 보정한다.

isTerrainStampMaskMode(stamp: UTerrainStamp) -> boolean
    역할: stamp가 target layer 기반 또는 명시 mask 동작인지 판정한다.
    동작: mode가 mask이거나 targetLayer가 정의되어 있으면 true를 반환한다.

getTerrainStampMaskTargetLayer(stamp: UTerrainStamp) -> object | undefined
    역할: mask 적용에서 제외할 stamp의 target layer를 얻는다.
    동작: targetLayer가 정의되어 있으면 반환하고 아니면 undefined를 반환한다.

updateTerrainOverlayUniforms(stampState: object, renderContext: object = {}) -> void
    역할: render 직전 stamp state와 tile object에 맞는 shader metadata uniform 값을 갱신한다.
    의존: WebGLRenderer(renderContext.renderer) — CSS pixel 두께 환산용 renderer 배율 조회; 함수: {getPixelRatio()}
    동작:
        state가 dirty이면 전역 overlay texture를 다시 작성한다.

        현재 object의 bounds에 맞는 metadata texture와 overlay 수를 적용한다.

        object의 matrixWorld translation을 world origin으로 구한다.

        object origin과 선택한 overlay origin의 정밀도 보정 차이를 uniform objectRelative에 기록한다.

        renderer pixel ratio가 0보다 큰 유한한 값이면 uniform pixelRatio에 저장하고 아니면 1을 저장한다.

updateTerrainOverlayTexture(stampState: object) -> void
    역할: registry 전체의 살아 있는 overlay cache를 전역 DataTexture에 직렬화한다.
    의존:
        Vector3 — 선택한 전역 상대 origin 복사; 함수: {copy()}
        DataTexture — 전역 metadata texture를 GPU upload 대상으로 표시; 속성 쓰기: {needsUpdate}
        TERRAIN_OVERLAY_SHADER — fallback row 상한; 상수: {MAX_OVERLAYS}
    동작:
        state entries를 비운다.
        state cacheByStamp를 순회하며 visible이 false가 아닌 cache의 world bounds를 계산한다.

        현재 state의 target layer 자체에 적용될 mask cache는 제외하고 나머지를 state entries에 수집한다.

        fallbackCount를 shader 최대 row 수로 제한한다.
        fallbackCount가 0이면 원점, 아니면 첫 overlay 대표점을 state의 전역 상대 origin으로 선택한다.

        fallbackCount만큼 overlay row를 전역 DataTexture에 쓴다.

        전역 DataTexture를 needsUpdate로 표시하고 uniform stampDataTexture를 전역 texture로 연결한다.
        dirty를 해제하고 textureRevision을 증가시킨다.

resolveOverlayRelativeOrigin(target: Vector3, overlays: Array<object>, count: number) -> Vector3
    역할: 여러 overlay 좌표를 공통 상대 좌표로 바꿀 기준 원점을 선택한다.
    의존: Vector3(target) — 상대 원점 초기화와 복사; 함수: {set(), copy()}
    동작:
        count가 0 이하이면 target을 영점으로 만들고 반환한다.
        첫 overlay가 circle이면 center를, 그 외에는 첫 point를 대표점으로 찾는다.

        대표점이 없으면 target을 영점으로 만들고, 있으면 대표점을 target에 복사해 반환한다.

resolveObjectWorldOrigin(target: Vector3, object: object) -> Vector3
    역할: 현재 terrain render object의 world translation을 상대 좌표 계산용 원점으로 구한다.
    의존:
        Vector3(target) — world translation 저장; 함수: {set()}
        Object3D(object) — world transform translation 조회; 속성 읽기: {matrixWorld.elements}
    동작:
        matrixWorld elements가 없으면 target을 영점으로 만들고 반환한다.
        matrixWorld의 translation 세 성분을 숫자로 변환해 target에 저장하고 반환한다.

applyObjectOverlayTexture(stampState: object, object: object) -> void
    역할: 현재 tile object에 사용할 metadata texture, overlay 수와 상대 좌표 origin을 선택한다.
    의존:
        Vector3 — 전역 또는 tile별 상대 origin 복사; 함수: {copy()}
        Web API — tile object 회수 시 새 metadata texture 해제를 예약; 함수: {FinalizationRegistry.register()}
    동작:
        object와 연결된 tile의 여러 bounds 표현을 정규 XY bounds로 변환한다.

        bounds가 없거나 state entries가 비어 있으면 전역 metadata texture, 제한된 전체 개수와 state 전역 origin을 uniform에 적용하고 종료한다.
        bounds key와 object identity로 기존 tile cache를 조회한다.

        cache revision과 bounds key가 현재 값이면 기존 cache를 그대로 사용한다.
        cache가 없거나 오래되었으면 기존 metadata texture를 재사용하고, texture가 없으면 새 DataTexture를 만든다.

        새 tile texture이고 FinalizationRegistry를 지원하면 texture와 token을 state 소유 Set에 넣고 object 회수 callback을 등록한다.
        FinalizationRegistry가 없는 환경에서는 새 tile texture를 state 소유 Set에 넣지 않는다. [확인 Q-002]
        현재 tile과 겹치는 overlay를 새 cache에 직렬화하고 object identity로 저장한다.

        cache의 texture와 count를 uniform에 적용하고 cache origin을 scratch origin에 복사한다.

buildTileOverlayTexture(stampState: object, tileBounds: object, boundsKey: string, texture: DataTexture) -> object
    역할: 현재 tile bounds와 겹치는 stamp 후보만 골라 metadata texture cache 항목을 만든다.
    의존:
        Vector3 — tile별 상대 origin 생성과 현재 origin 복사; 생성자: {new Vector3()}; 함수: {copy()}
        DataTexture(texture) — 직렬화 완료를 GPU upload 대상으로 표시; 속성 쓰기: {needsUpdate}
        TERRAIN_OVERLAY_SHADER — tile별 row 상한; 상수: {MAX_OVERLAYS}
    동작:
        state 한도와 shader row 한도 중 작은 값을 tile limit으로 사용한다.
        state의 tile 후보 배열을 비운다.
        state entries에서 현재 state의 target mask를 제외한다.

        나머지 중 bounds가 32 world unit margin까지 겹치는 overlay만 후보로 수집한다.

        후보가 limit을 넘으면 tile 중심에서 각 overlay bounds까지의 최단 거리 제곱을 비교해 가까운 순서로 정렬한다.

        count를 후보 수와 limit 중 작은 값으로 정한다.
        선택 후보가 없으면 영점, 있으면 첫 후보의 대표점을 상대 좌표 origin으로 정한다.

        count 범위의 후보를 metadata texture row에 직렬화하고 texture를 needsUpdate로 표시한다.

        boundsKey, count, origin, revision과 texture를 가진 cache 항목을 반환한다.

isTargetMaskOverlayForState(stampState: object, overlay: object) -> boolean
    역할: mask overlay가 자신의 target layer state에 잘못 포함되는 경우를 식별한다.
    의존:
        defined — targetLayer 존재 여부 판정; 함수: {defined()}
        TERRAIN_OVERLAY_SHADER — mask mode 값; 상수: {MODE_MASK}
    동작:
        overlay mode가 mask가 아니면 false를 반환한다.
        overlay owner의 targetLayer가 없으면 false를 반환한다.
        owner의 targetLayer와 현재 state layer가 같은지 반환한다.

isStampTargetLayer(stamp: object, layer: object) -> boolean
    역할: stamp 또는 cache owner의 targetLayer가 현재 layer와 같은 논리 layer인지 판정한다.
    의존: defined — targetLayer와 layer 존재 여부 판정; 함수: {defined()}
    동작:
        stamp.targetLayer를 우선 사용하고 없으면 stamp.owner.targetLayer를 대체 값으로 사용한다.
        targetLayer와 layer가 모두 존재하고 같은 논리 layer인지 반환한다.

writeOverlayToTexture(texture: DataTexture, row: number, overlay: object) -> void
    역할: normalized overlay cache 하나를 shader metadata DataTexture 한 row에 기록한다.
    의존:
        Vector3 — bounds corner 구성; 함수: {set()}
        TERRAIN_OVERLAY_SHADER — 도형 type과 기본 fill mode; 상수: {TYPE_CIRCLE, TYPE_POLYLINE, MODE_FILL}
    동작:
        overlay 도형의 XY bounds를 계산한다.

        bounds의 최소·최대점을 현재 overlay origin 상대 좌표로 변환한다.

        texture URL이 있으면 atlas entry를 얻고 loaded 여부를 hasTexture로 기록한다.

        type, pointCount, hasTexture와 textureOpacity를 column 0에 쓴다.
        circle이면 center와 radius 및 radius 제곱을 column 1에 쓴다.
        polygon 또는 polyline이면 각 점을 상대 좌표로 바꿔 column 1부터 순서대로 쓴다.
        color와 alpha 또는 texture alpha 사용 여부를 column 9에 쓴다.
        atlas UV rect 또는 기본 rect를 column 10에 쓴다.
        mode와 expectTexture를 column 14의 앞 두 값에 쓴다.
        polyline이면 lineWidth와 pixels 단위 여부를 column 14의 나머지 두 값에 쓰고, 다른 도형이면 0을 쓴다.
        texture가 없는 gradient 색상과 방향을 column 15에 쓴다.

        bounds를 column 11에 쓴다.
        texture basis와 warp를 column 12와 13에 쓴다.

        각 column의 RGBA 기록은 공통 texel writer를 사용한다.

writeOverlayTextureBasisToTexture(texture: DataTexture, row: number, overlay: object) -> void
    역할: texture local UV 계산에 필요한 affine basis와 4점 warp 값을 기록한다.
    의존:
        Vector3 — UV 기준점 복사와 basis·warp 벡터 계산; 함수: {set(), copy(), subVectors(), sub()}
        TERRAIN_OVERLAY_SHADER — circle type 판정; 상수: {TYPE_CIRCLE}
    동작:
        circle은 center와 radius로 정사각 기준 프레임을 만든다.
        polygon에 유효한 mappingFrame이 있으면 첫 점을 origin, 두 번째 점을 U 기준, 네 번째 점 또는 세 번째 점을 V 기준으로 우선 사용한다.
        contain 조건의 4점 polygon은 점 순서를 origin, U점, warp점, V점으로 사용한다.

        texture가 있는 일반 polygon은 첫 변 방향과 모든 점의 투영 범위로 회전 정사각 프레임을 준비한다.

        그 외 point 기반 도형은 첫 점, 두 번째 점과 마지막 점을 basis 기준으로 사용한다.
        회전 정사각 프레임을 준비하지 않았으면 도형 중심을 기준으로 textureScale을 basis에 적용한다.

        basis 점들을 overlay origin 상대 좌표로 변환한다.

        상대 origin에서 U점과 V점까지의 벡터를 계산하고, contain 4점이면 네 번째 꼭짓점의 bilinear warp 보정 벡터도 계산한다.
        column 12와 13에 texture basis와 warp 값을 쓴다.

preparePolygonTextureFrame(overlay: object) -> boolean
    역할: texture가 있는 일반 polygon의 점 분포를 덮는 회전 정사각 UV 프레임을 만든다.
    의존: Vector3 — 축 정규화, 점 투영과 frame 기준점 계산; 함수: {subVectors(), lengthSq(), normalize(), set(), dot(), addScaledVector(), copy()}
    동작:
        points가 없으면 false를 반환한다.
        첫 점에서 두 번째 점으로 향하는 벡터를 U축 후보로 만든다.
        U축 길이가 거의 0이면 polygon의 axis-aligned bounds를 origin·U점·V점으로 사용하고 true를 반환한다.

        U축을 정규화하고 XY 평면에서 수직인 V축을 만든다.
        모든 점의 평균 중심을 구하고, 각 점을 U·V축에 투영해 두 축의 최소·최대 범위를 구한다.

        두 축 중 더 큰 span과 textureScale로 정사각형 반변 길이를 정하고 투영 범위의 중심을 world 중심으로 환산한다.
        중심에서 U·V축 방향으로 정사각 origin·U점·V점을 만들고 true를 반환한다.

applyOverlayTextureScaleToBasis(overlay: object, quadPoint: Vector3 | undefined) -> void
    역할: 선택된 UV 기준점을 도형 중심에 대해 textureScale 배율로 확대·축소한다.
    의존:
        Vector3 — 배율 중심과 기준점 이동 계산; 함수: {copy(), add(), multiplyScalar(), sub()}
        TERRAIN_OVERLAY_SHADER — circle type 판정; 상수: {TYPE_CIRCLE}
    동작:
        textureScale이 양수가 아니거나 1이면 아무것도 바꾸지 않는다.
        circle은 center를, contain 4점은 네 점의 평균을, 그 외는 origin·U점·V점의 평균을 배율 중심으로 선택한다.
        각 UV 기준점을 중심에서 떨어진 방향으로 textureScale만큼 이동한다.

shouldFitTextureToPolygonPoints(overlay: object) -> boolean
    역할: polygon 꼭짓점 warp로 texture contain을 적용할 수 있는지 판정한다.
    동작: texture가 있고 textureFit이 contain이며 점이 정확히 4개일 때만 true를 반환한다.

scaleTextureBasisPoint(point: Vector3, center: Vector3, scale: number) -> Vector3
    역할: texture 기준점을 중심에 대한 배율 위치로 이동한다.
    동작: point에서 center를 빼고 scale을 곱한 뒤 center를 다시 더해 point를 반환한다.

getOverlayPointsCenter(target: Vector3, points: Array<Vector3>) -> Vector3
    역할: 여러 overlay 점의 산술 평균 중심을 구한다.
    동작: target을 영점으로 초기화해 모든 점을 더하고 점 개수로 나눈 target을 반환한다.

createOverlayTexture() -> DataTexture
    역할: stamp metadata row를 저장할 고정 크기 float DataTexture를 만든다.
    의존:
        Three texture API — float RGBA metadata texture 생성과 sampler 설정; 생성자: {new DataTexture()}; 상수: {RGBAFormat, FloatType, NearestFilter, ClampToEdgeWrapping}; 속성 쓰기: {minFilter, magFilter, wrapS, wrapT, generateMipmaps, flipY, needsUpdate}
        TERRAIN_OVERLAY_SHADER — metadata texture 열·행 크기; 상수: {TEXTURE_WIDTH, MAX_OVERLAYS}
    동작:
        shader TEXTURE_WIDTH와 MAX_OVERLAYS 및 RGBA 네 채널 크기의 Float32Array를 만든다.
        nearest filter, clamp wrapping, mipmap 비활성화와 flipY 비활성화를 설정한 DataTexture를 반환한다.

_emptyTerrainStampDataTexture: DataTexture | undefined
    활성 stamp가 없는 render binding이 안전하게 참조할 모듈 공유 빈 metadata texture이다.

getEmptyTerrainStampDataTexture() -> DataTexture
    역할: 비활성 render binding용 빈 metadata texture를 한 장만 lazy 생성해 반환한다.
    동작:
        공유 texture가 없으면 새 metadata texture를 만들어 저장한다.

        공유 texture를 반환한다.

getTerrainOverlayTextureAtlas() -> CanvasTexture | DataTexture
    역할: shader uniform에서 공유할 atlas texture를 반환한다.
    동작: 전역 atlas의 lazy texture 결과를 반환한다.

getTerrainOverlayTextureAtlasEntry(url: string) -> object | undefined
    역할: texture URL에 대응하는 공유 atlas cell 정보를 반환한다.
    동작: 전역 atlas에서 URL entry를 생성하거나 조회한 결과를 반환한다.

resolveTerrainStampTextureFit(fit: unknown) -> 'stretch' | 'contain'
    역할: texture fit 입력을 지원 문자열로 정규화한다.
    동작: 문자열을 소문자로 바꾸고 허용 집합에 없으면 stretch를 반환한다.

resolveTerrainStampGradientDirection(direction: unknown) -> 'vertical' | 'horizontal'
    역할: gradient 방향 입력을 지원 문자열로 정규화한다.
    동작: 문자열을 소문자로 바꾸고 허용 집합에 없으면 vertical을 반환한다.

getTerrainStampGradientDirectionCode(direction: unknown) -> number
    역할: 정규화된 gradient 방향을 shader 숫자 코드로 변환한다.
    동작: 방향을 정규화하고 horizontal이면 1, 그 외에는 0을 반환한다.

cloneTerrainStampValue(value: unknown) -> unknown
    역할: getter가 내부 객체 상태를 직접 노출하지 않도록 복사 가능한 값을 복사한다.
    동작:
        값이 없으면 그대로 반환한다.
        clone 함수가 있으면 clone 결과를, 일반 객체이면 얕은 복사본을, 원시값이면 원래 값을 반환한다.

isValidTerrainStampPoint(point: object | undefined) -> boolean
    역할: stamp 점의 필수 숫자 좌표가 유한한지 검사한다.
    동작: x와 y가 유한하고 z가 없거나 유한할 때만 true를 반환한다.

getPositiveTerrainStampNumber(value: unknown, fallback: number) -> number
    역할: 양수 숫자 입력을 안전하게 변환한다.
    동작: 숫자 변환 결과가 유한한 양수이면 반환하고, 변환 실패·예외·그 외 값이면 fallback을 반환한다.

normalizeTerrainStampMappingFrame(frame: Array<Vector3 | UTerrainStampPointLike> | undefined) -> Array<Vector3> | undefined
    역할: 외부 mappingFrame을 내부에서 독립적으로 사용할 유효한 좌표 복사본으로 정규화한다.
    의존: Vector3 — 좌표 복사; 생성자: {new Vector3()}; 함수: {clone()}
    동작:
        frame이 배열이 아니거나 점이 3개 미만이면 undefined를 반환한다.
        앞에서 최대 4개 점만 읽고 각 점의 x와 y가 유한한지 검사한다.
        잘못된 점이 하나라도 있으면 undefined를 반환한다.
        clone을 지원하면 clone하고 아니면 z 생략값을 0으로 둔 Vector3를 만들어 반환한다.

cloneTerrainStampMappingFrame(frame: Array<Vector3> | undefined) -> Array<Vector3> | undefined
    역할: getter 반환용 mapping frame 복사본을 만든다.
    동작: 배열이면 각 점의 clone 또는 새 Vector3 복사본 배열을 반환하고 배열이 아니면 undefined를 반환한다.

nextPowerOfTwo(value: number) -> number
    역할: 요청 크기 이상인 가장 작은 2의 거듭제곱을 계산한다.
    동작: 1에서 시작해 value 이상이 될 때까지 2를 곱한 결과를 반환한다.

getTerrainOverlayTextureUrlCandidates(url: string) -> Array<string>
    역할: 원본 stamp texture URL과 page 기준 대체 URL 후보를 만든다.
    동작:
        원본 URL만 가진 배열을 만든다.
        document 또는 URL API가 없으면 원본 배열을 반환한다.
        root-relative URL이면 document.baseURI 기준 page 상대 URL을 중복 없이 추가한다.
        후보 배열을 반환한다.

getOverlayReferencePoint(overlay: object | undefined) -> Vector3 | undefined
    역할: overlay 상대 좌표계의 대표 world 점을 선택한다.
    동작: overlay가 없으면 undefined를, circle이면 center를, 그 외에는 첫 point를 반환한다.

getOverlayBoundsXY(overlay: object) -> object
    역할: overlay 도형이 영향을 줄 수 있는 world XY 범위를 계산한다.
    의존: TERRAIN_OVERLAY_SHADER — circle·polyline type 판정; 상수: {TYPE_CIRCLE, TYPE_POLYLINE}
    동작:
        circle이면 center에서 radius만큼 확장한 XY bounds를 반환한다.
        polygon과 polyline은 모든 point의 최소·최대 XY로 bounds를 만든다.

        polyline이면 lineWidth의 절반만큼 네 방향 bounds를 확장해 반환한다.

getPointBoundsXY(points: Array<object>) -> object
    역할: polygon 또는 polyline 점 목록의 XY 최소·최대 범위를 계산한다.
    동작: 모든 점의 x와 y를 숫자로 변환해 minX, minY, maxX와 maxY를 누적한 bounds를 반환한다.

getObjectTileBoundsXY(object: object) -> object | undefined
    역할: 서로 다른 terrain tile 구현의 bounds 위치를 공통 XY bounds로 변환한다.
    의존:
        terrain render object(object) — tile과 object bounds 접근; 함수: {getTile()}; 속성 읽기: {_tile, _boundingBox}
        terrain tile(tile) — tile bounds 접근; 함수: {getBoundingbox()}; 속성 읽기: {_boundingbox, _boundingBox, _rectangle3d}
    동작:
        getTile() 결과를 우선하고 없으면 object._tile을 사용한다.
        tile의 getBoundingbox(), _boundingbox, _boundingBox, object._boundingBox 순서로 첫 bounds 후보를 정규화한다.

        정규 bounds가 있으면 반환하고, 없으면 tile._rectangle3d를 같은 방식으로 정규화해 반환한다.

getBoundsCenterXY(bounds: object) -> object
    역할: tile 후보 거리 정렬에 사용할 bounds 중심을 계산한다.
    동작: X와 Y 최소·최대의 평균 좌표를 가진 객체를 반환한다.

getBoundsKey(bounds: object) -> string
    역할: 객체 identity와 무관하게 같은 tile bounds를 식별할 cache key를 만든다.
    동작: minX, minY, maxX와 maxY를 쉼표로 이어 반환한다.

normalizeBoundsXY(bounds: object | undefined) -> object | undefined
    역할: 지원하는 여러 bounds 표현을 minX·minY·maxX·maxY 구조로 통일한다.
    동작:
        bounds가 없으면 undefined를 반환한다.
        minx·miny·maxx·maxy 숫자가 있으면 축별 최소·최대 순서를 보정해 반환한다.
        min·max point가 있으면 해당 x·y를 같은 구조로 보정해 반환한다.
        ptLeftBottom·ptRightTop point가 있으면 해당 x·y를 같은 구조로 보정해 반환한다.
        지원하는 형태가 아니면 undefined를 반환한다.

intersectsBoundsXY(a: object | undefined, b: object | undefined, margin: number = 0) -> boolean
    역할: 두 XY bounds가 margin을 포함해 겹치는지 보수적으로 판정한다.
    처리 기준: 어느 bounds든 없으면 overlay를 잘못 제거하지 않도록 true를 반환한다.
    동작: 두 bounds가 모두 있으면 네 축 범위가 margin 안에서 겹치는지 반환한다.

getPointBoundsDistanceSq(point: object, bounds: object) -> number
    역할: tile 중심에서 overlay bounds까지의 최단 거리 제곱을 후보 우선순위로 계산한다.
    동작:
        point가 bounds 안에 있는 축의 거리는 0으로 둔다.
        밖에 있는 축은 가까운 경계까지의 차이를 구한다.
        두 축 차이의 제곱합을 반환해 제곱근 계산 없이 정렬에 사용한다.

copyOverlayCornerToRelative(target: Vector3, worldCorner: Vector3, origin: Vector3) -> Vector3
    역할: world 좌표점을 공통 overlay origin 기준 정밀도 보정 상대 좌표로 바꾼다.
    의존: Vector3(target) — 상대 좌표 저장; 함수: {set()}
    동작: 세 축의 정밀도 보정 차이를 target에 저장해 반환한다.

setSplitDifferenceVector(target: Vector3, value: object, origin: object) -> Vector3
    역할: 큰 world 좌표의 직접 뺄셈에서 생기는 정밀도 손실을 줄여 상대 좌표를 만든다.
    의존: Vector3(target) — 세 축 상대 좌표 저장; 함수: {set()}
    동작:
        value와 origin의 x·y·z를 각각 숫자로 변환하고 생략값은 0으로 사용한다.
        각 축을 float32 high 부분과 나머지 low 부분으로 나눠 차이를 계산한다.

        세 축 결과를 target에 저장하고 반환한다.

splitDifference(value: number, origin: number) -> number
    역할: 두 큰 수의 상대 차이를 high·low 부분으로 나눠 계산한다.
    의존: Math — float32 high 부분 분리; 함수: {fround()}
    동작:
        value와 origin을 각각 float32 high 부분으로 만든다.
        원래 값에서 high 부분을 뺀 low 부분을 각각 구한다.
        high끼리의 차이와 low끼리의 차이를 더해 반환한다.

writeOverlayTexel(texture: DataTexture, row: number, column: number, r: number, g: number, b: number, a: number) -> void
    역할: metadata DataTexture의 지정 row와 column에 RGBA 값을 기록한다.
    동작: texture 폭과 RGBA 네 채널로 1차원 offset을 계산해 image data의 연속 네 항목을 갱신한다.

createTerrainStampRenderBinding() -> object
    역할: terrain material이 state 재생성 전후에 계속 참조할 layer별 uniform binding을 만든다.
    의존:
        Vector2 — stampDataTextureSize uniform 값; 생성자: {new Vector2()}
        Vector3 — objectRelative uniform 값; 생성자: {new Vector3()}
        TERRAIN_OVERLAY_SHADER — uniform texture 크기와 기본 row 상한; 상수: {TEXTURE_WIDTH, MAX_OVERLAYS}
    동작:
        count 0, 영점 objectRelative, pixelRatio 1과 공유 빈 stampDataTexture uniform을 만든다.

        texture 크기와 공유 atlas uniform을 함께 만든다.

        activeCount 0과 uniforms를 가진 binding을 반환한다.

getTerrainStampRenderBinding(layer: object, create: boolean = false) -> object | undefined
    동작:
        layer가 객체나 함수가 아니면 undefined를 반환한다.
        기존 layer render binding을 조회한다.
        create가 true이고 binding이 없으면 새 binding을 만들어 layer별 WeakMap에 저장한다.

        binding을 반환한다.

createTerrainStampState(layer: object) -> object
    역할: layer별 stamp registry와 활성 GPU 자원 상태를 만든다.
    동작:
        layer render binding을 생성하거나 조회하고 새 활성 전역 metadata texture를 만든다.

        기존 binding의 activeCount, count, objectRelative와 pixelRatio를 초기값으로 되돌린다.
        binding의 stampDataTexture를 새 활성 texture로, texture atlas를 현재 공유 atlas로 교체한다.

        cacheByStamp Map, 전역 metadata texture와 object별 tile cache WeakMap을 연결한다.
        frame 사이에 유지할 전체 stamp entries, tile 후보 배열과 전역 상대 origin을 state 전용 재사용 객체로 만든다.
        render binding 참조를 활성 state에 저장한다.
        state 해제 시 tile texture와 FinalizationRegistry 등록을 정리할 texture Set과 token Set을 만든다.
        dirty=true, revision=0과 기본 maxStampsPerTile을 가진 state를 반환한다.

getTerrainStampState(layer: object, create: boolean = false) -> object | undefined
    의존: defined — layer와 state layer 존재 여부 판정; 함수: {defined()}
    동작:
        layer가 객체나 함수가 아니면 undefined를 반환한다.
        기존 layer state를 조회한다.
        create가 true이고 state가 없으면 새 state를 만들고 WeakMap과 전체 state Set에 등록한다.

        state에 layer 참조가 없으면 현재 layer를 저장한다.
        state를 반환한다.

updateTerrainStampRenderBindingCount(state: object) -> void
    역할: layer별 안정 binding의 공개 활성 stamp 수를 registry와 맞춘다.
    동작: render binding이 있으면 activeCount를 cacheByStamp 크기로 바꾼다.

releaseTerrainStampState(state: object) -> void
    역할: stamp가 없는 layer state의 GPU texture, finalizer 등록과 registry 소유권을 해제한다.
    처리 기준: state가 없거나 cacheByStamp에 stamp가 남아 있으면 아무것도 해제하지 않는다.
    의존:
        Three texture API — 전역·tile별 metadata texture 해제; 함수: {dispose()}
        Web API — tile finalizer 등록 해제; 함수: {FinalizationRegistry.unregister()}
        defined — layer 참조 존재 여부 판정; 함수: {defined()}
    동작:
        layer와 render binding 참조를 보관한다.
        render binding의 activeCount와 uniform count를 0으로 바꾸고 좌표·pixel ratio를 초기화한다.
        binding의 stampDataTexture를 모듈 공유 빈 texture로 먼저 교체한 뒤 state 소유 전역 metadata texture를 dispose한다.

        모든 finalizer token을 unregister한 뒤 token Set을 비운다.
        state 소유 Set의 tile metadata texture를 모두 dispose하고 Set을 비운다. FinalizationRegistry가 없으면 새 tile texture가 이 Set에 등록되지 않는다. [확인 Q-002]
        tile WeakMap을 새 빈 WeakMap으로 교체하고 cacheByStamp, entries와 tile 후보 배열을 비우며 전역 상대 origin을 영점으로 되돌린다.
        layer가 있으면 활성 state WeakMap 색인을 삭제하고 state의 layer와 render binding 참조를 지운다.
        전체 state Set에서 state를 제거한다.

releaseEmptyTerrainStampStates() -> void
    역할: 등록 cache가 없는 layer state를 안전하게 수집한 뒤 일괄 해제한다.
    동작:
        전체 state Set을 순회해 cacheByStamp가 빈 state를 임시 배열에 수집한다.
        수집이 끝난 뒤 각 state의 자원과 소유권을 해제한다.

markAllTerrainStampStatesDirty() -> void
    역할: atlas 이미지 load 완료를 모든 layer metadata texture의 다음 재작성으로 연결한다.
    동작: 전체 terrain stamp state를 순회하며 textureDirty를 true로 바꾼다.

getTerrainStampAppState(app: object, create: boolean = false) -> object | undefined
    의존: defined — app 존재 여부 판정; 함수: {defined()}
    동작:
        app이 객체나 함수가 아니면 undefined를 반환한다.
        기존 app state를 조회한다.
        create가 true이고 state가 없으면 빈 stamp Set을 가진 state를 만들어 app WeakMap에 저장한다.
        state를 반환한다.

registerTerrainStampApp(app: object, stamp: UTerrainStamp) -> void
    역할: app별 stamp set에 stamp를 등록하고 render-before 갱신 callback을 연결한다.
    의존: U3dApp(app) — render-before callback 존재 확인과 등록; 함수: {hasRenderBefore(), setRenderBefore()}
    동작:
        app stamp state를 생성하거나 조회한다.

        app state가 없으면 종료한다.
        stamp를 app state set에 추가한다.
        app이 render-before API를 제공하고 같은 key가 없으면 refresh callback을 등록한다.

unregisterTerrainStampApp(app: object, stamp: UTerrainStamp) -> void
    역할: app별 stamp set에서 stamp를 제거하고 마지막 stamp가 사라지면 callback을 해제한다.
    의존: U3dApp(app) — render-before callback 제거; 함수: {removeRenderBefore()}
    동작:
        app stamp state를 조회한다.

        app state가 없으면 종료한다.
        stamp를 set에서 제거한다.
        남은 stamp가 있으면 종료한다.
        app이 removeRenderBefore를 제공하면 UTerrainStamp key callback을 제거한다.
        app state WeakMap 항목을 삭제한다.

isSameTerrainStampLayerList(a: Array<object>, b: Array<object>) -> boolean
    역할: renderOrder 순서까지 포함해 두 검색 layer 목록이 같은지 판정한다.
    동작:
        배열 참조가 같으면 true를 반환한다.
        어느 쪽이 배열이 아니거나 길이가 다르면 false를 반환한다.
        같은 index의 layer를 순회하며 하나라도 다른 논리 layer이면 false를 반환한다.

        모두 같으면 true를 반환한다.

getSearchLayers(app: object, targetLayer: object | undefined) -> Array<object>
    역할: app의 image layer 중 stamp registry에 적용할 layer 목록을 renderOrder 내림차순으로 계산한다.
    의존:
        U3dApp(app) — image layer 목록 조회; 함수: {getImageLayers()}
        U3dLayer(layer, targetLayer) — render 순서와 layer 식별값 조회; 함수: {getRenderOrder()}
    동작:
        app.getImageLayers() 결과가 비어 있거나 배열이 아니면 빈 배열을 반환한다.
        layer를 renderOrder 내림차순으로 정렬한다.
        targetLayer가 있으면 같은 논리 layer를 찾고, targetLayer 자체를 제외한 뒤 그 renderOrder보다 높은 layer만 남긴다.

        중복을 제거한 layer 배열을 반환한다.

isSameTerrainStampLayer(layer: object, targetLayer: object) -> boolean
    의존:
        defined — layer와 식별값 존재 여부 판정; 함수: {defined()}
        U3dLayer(layer, targetLayer) — 이름 기반 동일성 판정; 함수: {getName()}; 속성 읽기: {_id, _name}
    동작:
        어느 한쪽이 없으면 false를 반환한다.
        참조가 같으면 true를 반환한다.
        양쪽 _id가 있고 같으면 true를 반환한다.
        getName() 또는 _name 값이 양쪽에 있고 같으면 true를 반환한다.
        그 외에는 false를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
layer별 활성 state는 WeakMap으로 색인하지만 순회를 위해 전체 state Set과 state.layer가 강한 참조를 유지한다. 마지막 stamp 제거 시 해당 state의 자원과 강한 참조를 함께 해제해야 한다.
layer별 render binding은 별도 WeakMap에서 state 수명보다 오래 유지하고 layer를 역참조하지 않아야 한다. 같은 layer의 state 재생성 시 uniform 객체는 재사용하고 그 value만 새 활성 자원으로 교체해야 한다.
비활성 render binding은 dispose된 state texture가 아니라 count 0과 모듈 공유 빈 metadata texture를 가리켜야 한다.
한 번 생성된 render binding은 활성 state가 없어도 조회 가능해야 하며, terrain material은 이 빈 binding으로 stamp shader program과 uniform 참조를 유지해야 한다.
전체 stamp entries, 전역 상대 origin과 tile 후보 배열은 layer state 사이에서 공유하지 않아야 한다.
layer state 생성·해제와 stamp 좌표·스타일 update는 app render 또는 QuadTileSet update를 강제로 요청하지 않아야 한다.
app별 stamp set은 WeakMap으로 관리하고 마지막 stamp가 제거되면 render-before callback과 app state를 제거해야 한다.
registry cache는 외부 입력 Vector3와 Color 객체를 직접 공유하지 않고 등록 시점의 복사본과 정규화 값을 사용해야 한다.
texture atlas는 URL별 cell을 공유하고 atlas가 가득 차면 texture fill 대신 color fill fallback이 가능하도록 undefined entry를 반환해야 한다.
tile bounds를 알 수 없는 object는 overlay 누락을 피하기 위해 전역 overlay texture 기준으로 처리해야 한다.
bounds 정보가 불완전하면 overlay 후보를 제거하지 않아야 한다.
tile 후보 교차 판정은 overlay bounds에 32 world unit margin을 적용해야 한다.
DataTexture는 0~15 column의 float RGBA row metadata layout을 사용하고 shader 상수의 TEXTURE_WIDTH와 MAX_OVERLAYS 크기를 따라야 한다.
texture image URL 후보는 원본 URL을 먼저 시도하고 root-relative URL이면 document.baseURI 기준 상대 후보를 추가로 시도해야 한다.
mappingFrame은 polygon 포함 판정과 bounds를 바꾸지 않고 여러 polygon stamp가 공유할 texture·gradient UV 좌표계만 정해야 한다.
polyline의 meters 두께는 world 거리로, pixels 두께는 renderer pixel ratio를 반영한 CSS pixel 의미로 shader에 전달해야 한다.
maxStampsPerTile은 개별 stamp 속성으로 입력되지만 같은 layer state가 공유하는 한도이므로, registry에 동기화되는 stamp의 값이 해당 state 한도를 갱신한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
