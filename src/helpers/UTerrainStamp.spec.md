# UTerrainStamp 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UTerrainStamp`는 지형 tile 위에 polygon·circle 기반 fill, gradient, texture와 mask overlay를 적용하거나 polyline을 그리기 위한 stamp 상태를 관리한다. 현재 tile의 후보 metadata를 준비하고, 타일 전체가 같은 단색인 경우에만 CPU에서 계산한 합성색을 재사용한다. 작은 단색 집합의 확정 내부/외부를 float uniform으로 전달하고 경계는 원래 정밀도로 판정한다. 단색 polygon·polyline 후보가 16개 이하이면 4/8/16개 상한의 고정 호출, 17~128개이면 공유 metadata를 직접 읽는 동적 반복 program을 사용한다. 이미지·gradient·mask·circle이 섞인 집합은 범용 정밀 경로를 유지한다. raster 해상도는 줄이지 않는다.

### 1.2 책임 범위

- stamp 인스턴스의 app, 대상 레이어, polygon·circle·polyline 도형, 스타일, texture, 가시성 상태를 관리한다.
- app의 image layer 목록과 target layer 조건을 기준으로 overlay registry를 구성한다.
- layer별로 수명이 안정적인 render binding을 유지하고 renderer가 render 직전에 사용할 tile별 stamp metadata를 갱신한다.
- URL별 texture atlas를 lazy 생성하고 이미지 load 완료 시 전체 stamp state를 dirty 처리한다.
- 단색 내부 타일은 기존 row의 renderOrder와 누적 alpha 조기 종료를 그대로 계산한 상수색으로 출력한다. 저해상도 합성 target이나 별도 갱신 주기를 사용하지 않는다.
- tile bounds와 겹치는 stamp 후보를 고르고 같은 순서의 후보 조합끼리 metadata DataTexture를 공유한다.
- 공유 texture의 비활성 조합을 나누어 회수하고, 같은 행 수의 유휴 저장소는 layer 전용 풀에서 재사용한다. 마지막 stamp가 제거되면 활성 texture와 풀의 소유 참조를 함께 해제한다. Helper가 명시한 동기 배치에 한해 독점 texture의 최종 dispose 책임을 외부 정리 함수로 이전할 수 있다.
- layer state가 다시 생성될 때 캐시된 terrain material이 기존 uniform 참조로 새 state를 즉시 읽도록 binding을 재사용한다.
- layer state의 최초 생성·최종 해제는 app render나 QuadTileSet update를 강제로 요청하지 않고 다음 terrain render에서 현재 binding 상태로 반영한다.

책임 경계: 기본 도형 GLSL은 `GTerrainOverlayShader`가 제공하고, 단색 내부 타일 전용 variant는 이 단위의 비공개 구현이 연결한다. stamp 인스턴스는 자신을 scene에 추가하지 않으며 app과 layer의 수명은 호출자가 관리한다.

### 1.3 주요 동작 방식

stamp는 `setApp()`으로 app context에 연결된 뒤 `visible`이 true이고 유효한 도형이 있을 때만 검색 대상 layer의 registry에 등록된다. 등록 시 외부 입력을 shader용 cache로 복사·정규화한다. render-before에서는 app의 레이어 registry를 갱신한다. tile draw 직전에 후보 조합의 DataTexture를 고르고, float metadata와 tile bounds로 단색 내부 여부를 판정하여 상수색 또는 정밀 row variant를 선택한다. 후보 순서가 같으면 타일 위치와 무관하게 metadata와 상대 좌표 원점을 공유하고 빈 후보는 공용 빈 texture를 사용한다. row shader는 각 row의 도형, 색상, mode, polyline 두께와 texture mapping metadata를 읽어 결과를 계산한다.

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
getPoints(), getCenter(), getCircle(), getStyle(), getColor(), getGradientColor()는 외부 변경이 내부 상태를 직접 흔들지 않도록 복사 가능한 값을 복사해 반환해야 한다.
texture는 문자열 URL일 때만 이미지 atlas 대상으로 사용하고, URL이 지정된 채움은 atlas에 이미지가 준비되기 전까지 opacity와 무관하게 투명해야 한다.
준비된 이미지의 alpha는 textureOpacity와 textureUseAlpha로 계산하고, expectTexture가 false일 때 합성 alpha로 사용해야 한다.
texture가 없을 때만 color 또는 gradient fill과 opacity를 사용해야 한다.
textureFit은 stretch 또는 contain만 허용하고 그 외 값은 stretch로 보정해야 한다.
textureFit contain은 texture가 있는 4점 polygon에서만 네 꼭짓점 warp 기준으로 사용해야 한다.
mappingFrame은 유효한 3~4개의 world 좌표만 사용하고, 존재하면 polygon 포함 영역과 별개로 texture와 gradient가 공유하는 UV 기준 프레임에 우선 적용해야 한다.
gradientDirection은 vertical 또는 horizontal만 허용하고 그 외 값은 vertical로 보정해야 한다.
mode는 fill 또는 mask 이름과 shader mode 숫자만 허용하고 그 외 값은 자동 layer 기준으로 처리해야 한다.
채움 mode의 targetLayer가 있으면 그보다 renderOrder가 높은 image layer만 검색하고 targetLayer 자체에는 등록하지 않아야 한다.
명시 mask 또는 mode 생략과 targetLayer 조합은 모든 image layer를 검색한다. targetLayer 위에는 mask, targetLayer 자신과 아래에는 낮은 순서의 stamp 합성을 막는 가림 mode로 등록해야 한다. targetLayer 없는 명시 mask는 검색된 layer에 mask mode를 사용한다.
app의 image layer 목록이 바뀌면 render-before callback 갱신에서 stamp별 검색 layer를 다시 계산해야 한다.
영상 마스크가 적용되는 재질에 지형 벡터가 합성되어 있으면 배경 영상만 제거하고 벡터의 색·투명도를 유지한다. 벡터가 없는 픽셀은 기존처럼 버린다. 안팎을 함께 표시할 벡터 레이어는 최상위 배경지도보다 높은 renderOrder를 사용하고, 영상 레이어의 투명 합성은 켜 두어야 한다.
마스크에서 벡터를 유지할 때는 마스크보다 위에서 이미 누적한 채움·외곽선의 premultiplied 색과 alpha도 벡터 위에 합성해야 한다. 마스크보다 아래의 도장은 합성하지 않으며, 불투명 도장의 기존 조기 종료 규칙은 유지한다.

대상 영상이 지정된 mask는 현재 타일 또는 표시 중인 부모의 텍스처·지형 전환·부착이 모두 준비된 경우에만 배경을 가린다. 준비 상태가 바뀌면 도형 revision이 같아도 타일 후보를 다시 선정하며, 타일을 특정할 수 없으면 해당 mask를 보류한다.
기존 row 경로에서는 tile bounds가 있으면 tile과 겹치지 않는 stamp를 해당 tile metadata texture에서 제외해야 한다.
기존 row 경로에서 tile과 겹치는 stamp가 maxStampsPerTile을 넘으면 tile 중심에서 overlay bounds까지의 거리 기준으로 가까운 stamp를 우선해야 한다.
정밀 경로와 상수색 경로는 동일한 tile 후보·상한·renderOrder·0.96 누적 alpha 조기 종료를 적용해야 한다.
단색 내부 여부를 증명할 수 없는 tile은 정밀 경로로 처리한다. 선 bounds·다각형 변·원 경계와 교차하거나 이미지·gradient·mask가 보이는 tile은 상수색으로 대체하지 않는다.
같은 타일 내부에서 변하지 않는 premultiplied RGB와 alpha만 합성하여 재사용한다. 별도 raster texture의 보간·양자화에 따른 경계 열화를 허용하지 않는다.
큰 world 좌표는 overlay origin 기준 상대 좌표로 변환하고 splitDifference 방식으로 JS 단계의 차분 정밀도를 보정해야 한다.
texture atlas 최대 이미지 수는 atlas texture 또는 URL entry가 만들어지기 전에만 변경할 수 있어야 한다.
document가 없는 환경에서는 atlas uniform 구조를 유지하기 위해 1x1 fallback DataTexture를 사용해야 한다.
마지막 stamp가 layer state에서 제거되면 전역·공유 후보 조합 metadata texture와 layer state의 강한 참조를 제거해야 한다. Helper 전용 동기 배치가 정리 함수를 지정하면 texture만 그 함수에 이전하며, state·binding·옛 record의 참조 제거는 배치 반환 전에 완료해야 한다.
마지막 stamp 제거 뒤에도 layer별 render binding의 uniform 객체 참조는 유지하고, count 0과 공유 빈 metadata texture를 가리켜야 한다.
한 번 생성된 layer별 render binding은 활성 stamp가 0개여도 render state 조회에서 반환해야 한다. 도장 지원 binding의 존재 여부는 유지하고, 합성 활성 여부에 따른 row/합성 variant만 별도로 선택한다.
같은 layer에 stamp가 다시 등록되면 새 layer state는 기존 render binding을 재사용하여 캐시된 terrain material이 dispose된 이전 texture를 참조하지 않게 해야 한다.
layer state의 최초 생성과 최종 해제는 app render나 QuadTileSet update를 강제로 요청하지 않고 다음 terrain render에서 반영해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: terrain tile render 직전에 object별 uniform 값을 반복 갱신할 수 있다.
갱신 기준: 현재 stamp revision과 tile bounds에 대해 판정하며 별도 저주기 합성으로 이전 형상을 지연 출력하지 않는다.
자원 기준: 상수색 경로는 Vector4와 기존 후보 metadata를 재사용하고 별도의 render target·mesh·material을 만들지 않는다.
재사용 기준: tile cache의 revision·bounds·공유 texture 유효성이 같으면 단색 판정과 합성색을 재사용한다.
품질 기준: 경계와 외곽선은 기존 화면 해상도의 도형 판정을 보존한다. 내부 합성색의 float 연산 반올림 이외의 해상도 손실은 만들지 않는다.
우선순위: stamp 포함 판정과 mask 결과를 보존하면서 tile별 shader 입력 개수와 texture 재작성 범위를 줄인다.
재사용 기준: layer별 state, 전역 stamp DataTexture, 후보 조합별 metadata texture, tile별 후보 선택 cache, texture atlas, scratch 배열과 Vector는 반복 render에서 재사용해야 한다.
격리 기준: frame 사이에 유지되는 전체 stamp 목록, 전역 상대 origin과 tile 후보 배열은 layer state별로 소유하여 다른 image layer의 render 갱신이 덮어쓰지 않아야 한다.
제한 조건: 전체 stamp 개수는 registry 수집 단계에서 shader row 상한으로 먼저 자르지 않고 tile별 후보 선정 뒤에만 row 상한을 적용해야 한다.
자원 기준: tile별 cache는 object identity와 정규화한 네 bounds 좌표 및 texture revision이 같고 공유 texture가 퇴출되지 않았으면 기존 후보 선택 결과를 재사용해야 한다.
자원 기준: 공유 후보 조합 texture는 현재·직전 렌더 프레임의 작업 집합을 보호하고 비활성 조합만 회수해야 한다. 프레임별 회수는 Map 256개를 목표로 최대 64개씩 처리하되, Map 512개 초과분은 보관 압력 해소를 위해 추가 회수한다. 보호 중인 작업 집합은 상한 때문에 퇴출하지 않는다. 프레임 정보를 받지 못하면 기존 전체 256개 LRU를 사용한다.
자원 기준: 퇴출한 texture와 backing array는 같은 layer의 같은 행 수 저장소로만 재사용한다. 풀은 총 128개 및 CPU backing 4MiB 이내이며 GPU에는 같은 float 저장소 크기가 추가로 남을 수 있다. 퇴출 뒤 두 번의 관찰 render 프레임을 기다리고, 사용할 저장소가 없으면 새로 생성한다. GPU 완료를 동기적으로 기다리지 않는다.
정확성 기준: 퇴출된 data record의 texture·후보·색 배열 참조를 비우고 그 record 자체를 재활성화하지 않는다. 빌린 배열은 영점으로 초기화한 뒤 새 조합의 metadata를 작성하고 needsUpdate를 설정한다. 후보 선택·순서·상한·상대 원점·색과 shader 분기는 바꾸지 않는다.
자원 기준: 마지막 사용 layer state를 해제할 때 활성 조합과 풀에 보관한 texture를 각각 한 번만 dispose하거나 Helper 정리 함수에 한 번 이전하고 풀의 개수·byte 합계를 비워야 한다. 정리 함수가 정상 반환한 뒤에는 그 함수의 소유자가 정확히 한 번 dispose하며, 거부할 때는 소유권을 저장하기 전에 예외를 던져야 한다.
갱신 기준: 보관 중인 같은 순서의 후보 객체와 atlas 세대가 같으면 다른 Stamp의 변경만으로 직렬화·업로드하지 않아야 한다. 빈 후보도 revision 변경으로 새 texture 작성·업로드를 요청하지 않아야 한다.
재사용 기준: 직전 세대의 타일은 추가·제거·교체된 Stamp의 이전/새 범위와 겹치지 않고 후보 상한·atlas가 같을 때 후보와 coverage를 재사용한다. 여러 세대를 건너뛴 타일은 전체 후보를 다시 선정한다.
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
    nextIndex: number = 0
        아직 할당한 적 없는 다음 cell index이다.
    freeIndices: Array<number> = 빈 배열
        명시적으로 해제되어 다시 할당할 수 있는 cell index 목록이다.
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
            다음 cell index를 0으로 두고 재사용할 cell 목록을 비운다.

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
            Three texture API — document 또는 2D context 부재 fallback과 브라우저 atlas texture 구성; 생성자: {new DataTexture(), new CanvasTexture()}; 상수: {RGBAFormat, FloatType, LinearFilter, ClampToEdgeWrapping, SRGBColorSpace}; 속성 쓰기: {needsUpdate, minFilter, magFilter, wrapS, wrapT, generateMipmaps, flipY, colorSpace}
            Web API — canvas 생성과 2D context 조회; 함수: {document.createElement(), getContext(), clearRect()}
        동작:
            기존 texture가 있으면 그대로 반환한다.
            document가 없으면 1x1 흰색 DataTexture를 만들고 저장해 반환한다.
            canvas를 atlas 크기로 만들고 2D context를 얻는다.
            2D context를 얻지 못하면 1x1 흰색 DataTexture를 만들고 저장해 반환한다.
            canvas를 비우고 linear filter와 clamp wrapping을 가진 CanvasTexture를 만든다.
            canvas의 이미지 RGB를 GPU에서 선형 색상으로 변환해 읽도록 SRGBColorSpace를 지정하고 저장한 뒤 반환한다. 이미지 alpha는 색 공간 변환 대상이 아니다.

    getEntry(url: string) -> object | undefined
        역할: texture URL에 대응하는 atlas cell entry를 반환하고 없으면 새로 등록한다.
        처리 기준: 빈 URL이면 undefined를 반환한다.
        의존: Web API — 경고 출력; 함수: {console.warn()}
        동작:
            URL 문자열을 정규화하고 기존 entry가 있으면 반환한다.
            재사용할 cell이 없고 다음 cell index가 maxImages에 도달했으면 경고하고 undefined를 반환한다.
            해제된 cell을 우선 사용하고 없으면 다음 cell index를 할당해 row와 column으로 atlas UV rect를 계산한다.
            cell index를 포함한 unloaded entry를 Map에 저장하고 이미지 load를 시작한다.

            새 entry를 반환한다.

    releaseEntry(url: string) -> boolean
        역할: URL의 atlas cell과 진행 중인 이미지 load 연결을 해제한다.
        처리 기준: 등록되지 않은 URL이면 false를 반환한다.
        의존:
            Web API — 이미지 load callback과 src 연결 제거; 함수: {removeAttribute()}; 속성 쓰기: {onload, onerror}
            CanvasRenderingContext2D — 해제한 cell의 픽셀 제거; 함수: {clearRect()}
            Three texture API — atlas GPU upload 요청; 속성 쓰기: {needsUpdate}
        동작:
            Map에서 entry를 먼저 제거하고 cell index를 재사용 목록에 넣는다.
            Image callback과 src 연결 및 entry의 Image 참조를 제거한다.
            cell을 비우고 texture와 전체 stamp state를 dirty 처리한 뒤 true를 반환한다.

    loadEntry(entry: object, x: number, y: number) -> void
        역할: atlas entry의 이미지 URL 후보를 순차 load한다.
        의존: Web API — 모든 URL 후보가 실패했을 때 경고 출력; 함수: {console.warn()}
        동작:
            atlas texture를 준비한다.
            context가 없거나 Image 생성자가 없으면 load를 시도하지 않는다.
            URL 후보 목록을 만든다.

            다음 후보를 시도하기 전에 현재 Map의 entry와 같은 객체인지 확인하며 해제되거나 대체되었으면 중단한다.
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
            성공·실패 callback에서 현재 Map의 entry와 같은 객체인지 확인하며 해제되거나 대체되었으면 중단한다.
            load 성공 callback에서 cell을 비우고 이미지를 cell 크기로 그린다.
            load 성공 callback에서 entry를 loaded로 표시하고 atlas texture와 전체 stamp state를 dirty 처리한다.

            load 실패 callback에서 onError를 호출한다.
            Image src를 설정해 load를 시작한다.

_textureAtlas: UTerrainStampAtlas
    모든 stamp 인스턴스가 공유하는 URL texture atlas이다.

UTerrainStamp 클래스 정의
    static _addCompositeShader(shader: object, uniforms: object) -> void
        동작:
    #disposed: boolean = false
        true가 되면 setter가 실행되어도 registry에 다시 등록하지 않는다.

    #app: object | undefined
        app별 stamp 등록과 image layer 검색에 사용하는 현재 app이다.

    #searchLayers: Array<object> = 빈 배열
        현재 app과 targetLayer 기준으로 registry를 연결할 image layer 목록이다.

    #registeredCache: object | undefined
        직전 등록의 복사·정규화된 좌표/스타일 snapshot이며 동일 내용의 재등록을 생략하는 비교 기준이다. 등록 해제 시 비운다.

    #registeredSearchLayers: Array<object> | undefined
        직전 등록의 검색 layer 목록이며 객체 identity와 순서를 비교한다. 등록 해제 시 참조를 비운다.

    #helperBatch: object | undefined
        명시적으로 포함된 Helper 도장의 현재 동기 배치 문맥이다. 중첩 전의 문맥을 보관했다가 종료 시 복구하며 다음 프레임에 유지하지 않는다.

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
        texture가 없을 때 사용할 기본 색상과 선택적 gradient 끝 색상이다.

    opacity: number = 1
        texture가 없는 color 또는 gradient fill alpha의 원본 입력값이다.

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
        채움 알파 검사에서 제외되지 않은 행의 합성 alpha를 1로 사용할지 정하는 값이며, 이미지 준비 전 투명 대기 여부를 제어하지 않는다.

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

    static releaseTexture(url: string) -> boolean
        역할: 표시 중인 도장이 사용하지 않는 이미지 URL의 공용 atlas cache를 명시적으로 해제한다.
        인터페이스:
            표시 중인 도장이 사용하는 URL 또는 등록되지 않은 URL이면 false, 해제했으면 true를 반환한다.
            숨겨진 도장이 같은 URL을 다시 사용하면 이미지를 다시 load하므로 URL은 호출자가 유효하게 유지해야 한다.
            Blob URL 자체는 해제하지 않으며 모든 사용자 정리와 revokeObjectURL 호출은 호출자가 책임진다.
        처리 기준: url이 문자열이 아니면 TypeError를 던진다.
        동작:
            전체 활성 layer state의 stamp cache에 같은 texture URL이 있으면 false를 반환한다.
            atlas의 해당 URL entry를 해제하고 결과를 반환한다.

    static getRenderState(layer: object) -> object | undefined
        역할: terrain material이 사용할 layer별 stamp uniform 상태를 조회한다.
        인터페이스:
            결과의 activeCount는 현재 layer registry의 stamp 수이다.
            uniforms는 count, objectRelative, pixelRatio, stampDataTexture, stampDataTextureSize와 textureAtlas의 layer별 안정적인 동일 참조를 제공한다.
        동작:
            layer의 영속 render binding을 직접 조회해 반환하며, 한 번도 생성되지 않았으면 undefined를 반환한다.

            마지막 stamp가 해제된 뒤에도 같은 binding 참조를 반환하고, 재등록 시 그 binding의 uniform 값만 갱신한다.

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
            이 동기 호출에서 공유할 전체 image layer 목록을 한 번 조회·정렬한다.
            등록된 stamp를 순회하며 같은 app에 속한 stamp에는 정렬 목록을 전달하고 검색 layer 갱신 여부를 누적한다.
            목록은 다음 갱신이나 setter 호출에 재사용하지 않으며, 각 stamp의 target 조건은 별도로 적용한다.
            하나 이상 갱신되었으면 true를 반환한다.

    static _withHelperBatch(stamps: Iterable<UTerrainStamp>, callback: Function, retire?: Function, onStampError?: Function) -> T
        역할: Helper 소유 도장의 중간 등록을 합치고 최종 layer 해제 texture의 정리 소유권을 선택적으로 이전한다.
        인터페이스:
            stamps는 이번 동기 작업에 포함할 도장 목록이다.
            callback은 include(stamp)를 받아 동기적으로 변경하고 T를 반환한다. 새 도장은 변경 전에 include로 포함하며 include는 입력 도장을 반환한다.
            retire는 독점 DataTexture 하나를 받아 정리 소유권을 인수한다. 생략하면 즉시 dispose한다. 정상 반환 후에는 수신자가 정확히 한 번 dispose하며, 인수를 거부할 때는 저장 전에 예외를 던진다.
            onStampError는 실제 commit에서 실패한 도장과 원래 오류를 관찰한다. 도장을 변경하지 않으며, 기존 Error·AggregateError 전파를 대신하거나 삼키지 않는다. 중첩되어 바깥으로 합친 도장은 실제 바깥 commit의 관찰자에게만 전달한다.
        처리 기준:
            callback 안에서는 await와 중간 렌더를 수행하지 않는다. 포함하지 않은 일반 도장은 즉시 동작한다.
            도장별 마지막 변경 순서를 보존하며, callback 실패 시 이미 변경된 값은 되돌리지 않고 등록·해제를 확정한다.
            callback 또는 지정된 retire·onStampError가 함수가 아니거나 include 입력이 도장이 아니면 TypeError이다. 종료 후 include 호출은 Error이며 thenable 반환은 TypeError이다.
        의존: Three texture API — 정리 함수가 없거나 인수를 거부한 texture 해제; 함수: {DataTexture.dispose()}
        동작:
            포함한 도장의 바깥 배치 문맥과 직전 등록 layer 목록을 저장한다. dispose가 인스턴스 참조를 지워도 옛 등록을 제거할 수 있도록 목록을 배치가 보유한다.
            callback을 실행하고 발생한 오류를 저장한다. setter와 해제 요청은 pending 목록에서 삭제 후 다시 추가하여 마지막 변경 순서로 모은다.
            callback 종료 뒤 같은 도장이 바깥 배치에도 포함되어 있으면 바깥 pending으로 합친다. 그 밖의 도장은 disposed·visible 상태에 따라 제거하거나 최종 값으로 한 번 등록한다.

            등록에 사용할 전체 layer 목록은 commit의 app별로 한 번 정렬하고 각 도장의 최종 target 조건을 적용한다.

            도장별 검색·등록 실패 때 남은 등록을 제거하고 원래 오류를 수집한 뒤 해당 도장과 오류를 onStampError에 통지한다. 통지 함수가 던진 추가 오류도 수집하며 나머지 도장 처리를 계속한다. 작업 callback·자원 정리 오류는 특정 도장에 귀속하여 통지하지 않는다.
            이번 배치가 건드린 동일 state가 아직 활성 Set에 있으며 비어 있을 때만 해제하여 texture를 내부 목록에 모은다.

            도장별 바깥 문맥을 finally에서 복구한다. registry·binding·옛 tile record와 state의 참조가 끊긴 뒤 texture만 retire에 넘기거나 즉시 dispose한다.
            retire가 예외로 인수를 거부하면 해당 texture를 직접 dispose하고 오류를 저장한다. 공용 빈 texture는 이전하지 않는다.
            배치의 도장·app·state·texture 참조를 비운다. 오류 하나는 원래 객체로 재전파하고 여러 오류는 AggregateError로 전달하며, 없으면 callback 결과를 반환한다.

    constructor(opt: object = {})
        역할: stamp의 도형, 스타일, layer 적용 상태를 초기화하고 가능한 경우 registry에 등록한다.
        인터페이스:
            visible은 최초 registry 등록 허용 여부이며 생략하면 false이다.
            type은 polygon, circle 또는 polyline이고 생략하면 polygon이다.
            polygon과 polyline은 points를 사용하고 circle은 center와 radius를 사용한다.
            polyline의 lineWidth는 생략하면 1이고 lineWidthUnits는 meters 또는 pixels이다.
            color·opacity·gradientColor·gradientDirection은 texture가 없는 fill 표현을 정한다.
            texture URL이 있으면 이미지가 준비되기 전까지 자동으로 투명하게 대기한다.
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

            새 app과 targetLayer 기준 검색 layer를 계산한다. Helper 배치 안에서는 최종 commit까지 계산을 미룬다.

            disposed 상태라도 app stamp set 등록과 layer 검색은 수행하며, registry 동기화 단계에서만 재등록을 중단한다. [확인 Q-003]

            자신을 반환한다.

    getApp() -> object | undefined
        동작: 현재 app 참조를 반환한다.

    setTargetLayer(layer: object | undefined) -> UTerrainStamp
        역할: 검색 layer 경계와 mode 생략 시 자동 mask 기준이 되는 대상 layer를 변경한다.
        동작:
            현재 targetLayer와 같은 입력이면 자신을 반환한다.
            기존 registry에서 제거하고 targetLayer를 저장한다.

            app과 targetLayer 기준 검색 layer를 다시 계산한다. Helper 배치 안에서는 최종 commit까지 계산을 미룬다.

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

        setCenter(center: Vector3 | UTerrainStampPointLike) -> UTerrainStamp | undefined
            처리 기준: center가 올바르지 않거나 현재 도형이 유효하지 않으면 기존 도형을 유지하고 undefined를 반환한다.
            의존: THREE.Vector3 — polygon·polyline의 현재 중심과 이동량 계산; 생성자: {new Vector3()}; 함수: {multiplyScalar()}
            동작:
                center와 현재 도형의 점을 월드 좌표로 검증한다.

                circle이면 radius를 유지하고 center를 입력 좌표의 복사본으로 바꾼다.

                polygon과 polyline이면 화면에 사용하는 최대 16개 점의 산술 평균을 현재 중심으로 계산한다.
                새 중심까지의 이동량을 모든 저장 점에 더해 기존 모양과 크기를 유지한다.
                변경된 도형을 registry에 동기화하고 자신을 반환한다.

        getCenter() -> Vector3 | undefined
            의존: THREE.Vector3 — 중심 복사와 polygon·polyline 중심 계산 결과 생성; 생성자: {new Vector3()}; 함수: {multiplyScalar()}
            동작:
                circle이면 유효한 center를 복사한 새 Vector3를 반환한다.

                polygon과 polyline이면 화면에 사용하는 최대 16개 점의 산술 평균을 새 Vector3로 반환한다.

                유효한 도형이 없으면 undefined를 반환한다.

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
        처리 기준: 명시적으로 포함된 Helper 배치 안에서는 setter의 인스턴스 값과 dispose 상태를 즉시 변경하되 registry 변경과 마지막 state 해제는 배치 반환 전에 확정한다. 일반 호출은 즉시 반영한다.

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
            commit 전인 Helper 배치에 포함되어 있으면 마지막 변경 순서로 pending에 기록하고 종료한다.
            disposed 상태이면 종료한다.
            visible이 false이면 registry에서 제거하고 종료한다.

            현재 stamp cache를 registry에 등록한다.

    #refreshSearchLayers(sortedLayers?: Array<object>) -> boolean
        역할: app의 현재 image layer 목록에 맞게 stamp 등록 대상 layer를 갱신한다.
        동작:
            app과 targetLayer 기준 새 검색 layer 목록을 계산하며, 같은 app 갱신에서 전달된 전체 정렬 목록이 있으면 조회·정렬을 반복하지 않는다.

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
            app과 targetLayer 기준 검색 layer 목록을 다시 계산한다. Helper 배치 안에서는 최종 commit까지 계산을 미룬다.

    #registerTerrainOverlay() -> void
        역할: 현재 stamp 상태를 정규화하고 변경된 layer 등록만 갱신한다.
        동작:
            현재 type에 맞춰 좌표와 스타일의 복사본을 만든다. 유효하지 않으면 이전 snapshot과 등록을 지우고 종료한다.

            검색 layer 객체의 순서와 정규화된 데이터가 정확히 같은지 비교한다. 다를 때만 이전 등록을 해제하고 새 snapshot을 보관한다.

            layer별 mode를 확인한다. 출력 자격이 없어진 기존 등록은 제거하고 실제 출력 layer의 state만 생성/조회한다.

            도형/스타일 또는 mode·targetLayer·renderOrder가 바뀌었거나 등록이 없을 때만 cacheByStamp를 기록하고 dirty를 세운다.
            내용이 같은 호출도 maxStampsPerTile의 마지막 지정값을 layer 공유 상한에 반영한다.

            오류 시 현재 등록 목록을 해제에 전달한 뒤 snapshot과 등록을 지우고 재전파한다. 새 layer 일부만 등록한 뒤 실패해도 그 등록을 제거한다.
            일반 도장은 전체 빈 state를 정리한다. Helper 배치는 건드린 state identity를 모아 배치 끝에서만 빈 state를 정리한다.

    #unregisterTerrainOverlay(cleanupEmptyStates: boolean = false) -> void
        역할: 등록 비교 snapshot과 현재 stamp cache를 제거하고 요청된 경우 비어진 state를 해제한다.
        동작:
            commit 전인 Helper 배치에서는 마지막 변경 순서로 pending에 기록하고 종료한다.
            현재 등록 layer 목록을 보관한 뒤 비교 snapshot을 비운다. 인스턴스 목록이 없으면 Helper 배치가 보관한 최초 목록을 사용한다.
            Helper 배치에서는 보관한 등록 layer만 조회하여 stamp cache를 제거하고 dirty·activeCount를 갱신한다. 건드린 state를 모은 뒤 종료하여 마지막 자원 정리를 배치에 맡긴다.

            Helper 배치 밖에서는 전체 terrain stamp state를 순회하며 현재 stamp cache가 삭제된 state만 dirty 처리하고 render binding의 activeCount를 동기화한다.

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
    동작: mode가 mask이거나, mode가 정의되지 않았고 targetLayer가 정의되어 있으면 true를 반환한다. 명시 fill이면 targetLayer가 있어도 false이다.

getTerrainStampSearchTargetLayer(stamp: UTerrainStamp) -> object | undefined
    역할: 검색 대상 image layer를 좁힐 기준 layer를 얻는다.
    동작:
        targetLayer가 없으면 undefined를 반환한다.
        mask이면 target 자신과 아래에도 가림 mode를 등록해야 하므로 undefined를 반환하고, 채움이면 targetLayer를 반환한다.

updateTerrainOverlayUniforms(stampState: object, renderContext: object = {}) -> void
    역할: render 직전 stamp state와 tile object에 맞는 shader metadata uniform 값을 갱신한다.
    의존: WebGLRenderer(renderContext.renderer) — CSS pixel 두께 환산용 renderer 배율 조회; 함수: {getPixelRatio()}
    동작:
        compositeEnabled를 false, rowCoverage와 rowFill을 공용 영점 배열, plainRowLimit을 0으로 초기화하고 renderer 프레임에 따라 비활성 texture를 회수한다.
        state가 dirty이면 overlay 후보와 변경 범위를 다시 수집한다.

        현재 object의 bounds에 맞는 metadata texture와 overlay 수를 적용한다.

        uniform stampDataTextureSize의 높이를 선택된 texture의 실제 행 수로 바꾼다.
        object의 matrixWorld translation을 world origin으로 구한다.

        object origin과 선택한 overlay origin의 정밀도 보정 차이를 uniform objectRelative에 기록한다.

        renderer pixel ratio가 0보다 큰 유한한 값이면 uniform pixelRatio에 저장하고 아니면 1을 저장한다.

updateTerrainOverlayTexture(stampState: object) -> void
    역할: registry 전체의 살아 있는 overlay cache와 타일 검색 자료를 갱신한다.
    의존:
        TERRAIN_OVERLAY_SHADER — fallback row 상한; 상수: {MAX_OVERLAYS}
    동작:
        state entries를 비운다.
        전체 후보 bounds를 빈 범위로 초기화한다.
        state cacheByStamp를 순회하며 visible이 false가 아닌 cache의 world bounds를 최초 한 번 계산한다. 정규화 snapshot이 교체되지 않으면 계산된 bounds를 재사용한다.

        현재 state의 target layer 자체에 적용될 mask cache는 제외하고 나머지를 state entries에 수집한다.

        수집한 cache의 world bounds를 합쳐 전체 후보 bounds를 갱신한다.
        entries를 renderOrder와 생성 순서로 정렬한다.

        직전 목록과 현재 목록의 변경 범위 및 위치와 무관한 무효화 조건을 기록한다.
        전체 bounds의 네 성분이 모두 유한할 때만 넓은 범위 제외를 활성화한다.
        현재 수집 목록으로 보수적인 타일 후보 검색 자료를 갱신한다.
        fallbackCount를 shader 최대 row 수로 제한한다.
        fallbackCount 안의 texture URL은 기존 순서대로 atlas entry를 요청하여 cell 선점·이미지 load 순서를 유지한다.
        전역 숫자 metadata의 직렬화는 bounds 없는 draw에서 실제 사용될 때까지 미룬다.
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
        DataTexture — 전역 metadata 변경 upload 표시; 속성 쓰기: {needsUpdate}
    동작:
        object와 연결된 tile의 현재 bounds를 매번 읽어 state 소유 작업 객체에 정규 XY bounds를 기록한다.

        bounds가 없거나 state entries가 비어 있으면 shader row 상한으로 fallbackCount를 정한다.
            전역 metadata의 직렬화 세대가 현재와 다르면 최신 fallbackCount와 첫 overlay 대표점으로 전역 origin을 정하고 전역 row를 작성한다.
            다시 작성한 전역 texture를 needsUpdate로 표시하고 globalTextureRevision을 현재 세대로 갱신한다.
            전역 metadata texture, fallbackCount와 전역 origin을 uniform에 적용하고 종료한다.
        object identity로 기존 tile cache를 조회하고 저장된 네 좌표와 현재 bounds를 비교한다.

        cache가 직전 세대이고 bounds·texture가 유효하며 후보 상한·atlas가 그대로이고 변경된 이전/새 도형 범위와 겹치지 않으면 cache revision만 진행한다. 여러 세대를 건너뛴 타일에는 적용하지 않는다.
        cache revision과 네 bounds 좌표가 현재 값이고 빌린 공유 항목의 texture가 살아 있으면 기존 cache를 사용한다.
        그 외에는 현재 tile의 후보 조합을 선택하고 object identity로 cache를 저장한다.

        cache.data의 texture와 count를 uniform에 적용하고 data.origin을 scratch origin에 복사한다.
        data의 마지막 사용 프레임을 기록하고 cache의 compositeEnabled와 유효한 compositeColor, rowCoverage와 data.plainRowLimit·rowFill을 현재 draw의 uniform에 적용한다.

buildTileOverlayTexture(stampState: object, tileBounds: object, cache?: object) -> object
    역할: 현재 tile의 후보를 선택하고 동일 후보 조합의 texture를 공유하는 cache 항목을 만든다.
    의존:
        Vector3 — tile별 상대 origin 생성과 현재 origin 복사; 생성자: {new Vector3()}; 함수: {copy()}
        Vector4 — 타일이 소유한 합성색 최초 생성; 생성자: {new Vector4()}
        DataTexture — 퇴출 자원 해제와 변경 데이터 upload 표시; 함수: {dispose()}; 속성 쓰기: {needsUpdate}
        TERRAIN_OVERLAY_SHADER — tile별 row 상한; 상수: {MAX_OVERLAYS}
    동작:
        state 한도와 shader row 한도 중 작은 값을 tile limit으로 사용한다.
        state의 tile 후보 배열을 비운다.
        유한한 전체 후보 bounds와 tile이 32 world unit margin에서도 겹치지 않으면 개별 stamp 순회를 생략한다.

        전체 bounds 밖이 아니면 보수적인 공간 색인 후보를 조회한다. 색인이 비활성이거나 불리한 범위이면 전체 entries를 사용한다.
        검색 후보에서 현재 state의 target mask를 제외한다.

        나머지 중 bounds가 32 world unit margin까지 겹치는 overlay만 후보로 수집한다.

        후보가 limit을 넘으면 tile 중심에서 각 overlay bounds까지의 최단 거리 제곱을 비교해 가까운 순서로 정렬한다.

        count를 후보 수와 limit 중 작은 값으로 정한다.
        상한 때문에 거리 순으로 후보를 줄였으면 남은 후보를 renderOrder와 생성 순서로 다시 정렬한다.

        선택 순서대로 생성 ID를 연결하여 공유 Map의 key를 만든다.
        count가 0이면 공용 빈 data를 선택하고 texture를 다시 작성하지 않는다.
        count가 양수이면 공유 Map에서 key에 해당하는 data를 찾는다.
            없으면 프레임 추적을 하지 않는 수동 호출에서만 Map 크기 256 이상일 때 가장 오래된 항목을 제거하고 공통 회수 경로에 반환한다. 프레임 추적 중인 활성 조합은 draw 도중 퇴출하지 않는다.
            없으면 count 이상의 최소 2의 거듭제곱 행 수로 풀을 조회하고 사용할 저장소가 없으면 texture를 만든다.
            선택한 texture와 count, 새 origin, 초기 revision을 가진 data를 만든다. 이전 tile WeakMap이 참조하는 퇴출 record는 재사용하지 않는다.
            data revision이 현재 revision과 다르면 같은 순서의 후보 객체와 atlas 세대가 달라졌는지 판정한다.
                달라졌으면 첫 후보 대표점을 origin으로 정하고 선택 후보를 row에 기록한다.
                    직렬화된 metadata의 단색 적합성과 4/8/16/128개 상한을 data.plainRowLimit에 저장한다. 4/8/16 경로만 같은 Float32 색·유효 알파를 rowFill에 기록하고 128 경로는 공유 metadata를 직접 읽는다.
                    texture를 needsUpdate로 표시한다.
                같으면 origin·metadata·색 배열을 유지한다. 두 경우 모두 data revision을 현재 값으로 저장한다.
            key를 Map의 마지막으로 이동하여 새로 선택된 조합의 보관 순서를 갱신한다.
        기존 cache가 없으면 Vector4 합성색을 가진 cache를 만든다. 재계산에서는 같은 타일의 cache와 합성색을 재사용한다.
        직전 cache의 data 참조·coverageVersion과 현재 texture 버전·bounds 네 숫자가 같으면 기하 판정을 다시 하지 않고 cache.revision만 갱신해 반환한다. 다른 후보 변경 때문에 layer 세대만 증가한 경우도 이 조건으로 재사용한다.
        data.plainRowLimit이 4/8/16이면 cache 소유 Float32Array(16), 128이면 별도 Float32Array(128)를 최초 한 번 만들고 0으로 초기화한다. 두 저장소는 같은 타일의 다음 경로 전환에 재사용한다.
        128 경로는 내부·외부와 CSS 픽셀 선의 거리 하한을 분류한다.
        나머지는 선택된 float metadata·count·origin·tile bounds로 단색 내부 여부와 합성색을 계산한다. 4/8/16만 coverage를 전달하며, 범용 경로는 공용 영점 배열을 연결하고 상수색이 불가능한 첫 후보에서 판정을 종료한다.
        같은 cache에 bounds 네 숫자·revision·texture 버전인 coverageVersion과 data·compositeEnabled·compositeColor·rowCoverage를 갱신해 반환한다. 다음 draw에서 덮어쓰는 bounds 작업 객체의 참조는 보관하지 않는다.

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
        color를 column 17의 RGB에 쓴다.
        column 17의 alpha에는 hasTexture가 1이면 textureUseAlpha의 0/1 값을 쓴다.
        hasTexture가 0이고 texture URL이 있으면 opacity와 무관하게 alpha 0을 쓴다.
        hasTexture가 0이고 texture URL이 없으면 opacity를 0~1로 제한한 alpha를 쓴다.
        atlas UV rect 또는 기본 rect를 column 18에 쓴다.
        mode와 expectTexture를 column 22의 앞 두 값에 쓴다.
        polyline이면 lineWidth와 pixels 단위 여부를 column 22의 나머지 두 값에 쓰고, 다른 도형이면 0을 쓴다.
        texture가 없는 gradient 색상과 방향을 column 23에 쓴다.

        bounds를 column 19에 쓴다.
        texture basis와 warp를 column 20과 21에 쓴다.

        각 column의 RGBA 기록은 공통 texel writer를 사용한다.

writeOverlayTextureBasisToTexture(texture: DataTexture, row: number, overlay: object) -> void
    역할: texture local UV 계산에 필요한 affine basis와 4점 warp 값을 기록한다.
    의존:
        Vector3 — UV 기준점 복사와 basis·warp 벡터 계산; 함수: {set(), copy(), subVectors(), sub()}
        TERRAIN_OVERLAY_SHADER — circle type 판정; 상수: {TYPE_CIRCLE}
    동작:
        texture URL과 gradientColor가 모두 없으면 basis 두 column을 0으로 기록하고 좌표 변환 없이 종료한다. 로딩 중인 texture URL이 있으면 아래 계산을 유지하며, 스타일 전환으로 row를 다시 작성할 때 현재 값에 맞춰 basis를 갱신한다.
        circle은 center와 radius로 정사각 기준 프레임을 만든다.
        polygon에 유효한 mappingFrame이 있으면 첫 점을 origin, 두 번째 점을 U 기준, 네 번째 점 또는 세 번째 점을 V 기준으로 우선 사용한다.
        contain 조건의 4점 polygon은 점 순서를 origin, U점, warp점, V점으로 사용한다.

        texture가 있는 일반 polygon은 첫 변 방향과 모든 점의 투영 범위로 회전 정사각 프레임을 준비한다.

        그 외 point 기반 도형은 첫 점, 두 번째 점과 마지막 점을 basis 기준으로 사용한다.
        회전 정사각 프레임을 준비하지 않았으면 도형 중심을 기준으로 textureScale을 basis에 적용한다.

        basis 점들을 overlay origin 상대 좌표로 변환한다.

        상대 origin에서 U점과 V점까지의 벡터를 계산하고, contain 4점이면 네 번째 꼭짓점의 bilinear warp 보정 벡터도 계산한다.
        column 20과 21에 texture basis와 warp 값을 쓴다.

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

createOverlayTexture(rowCapacity: number = TERRAIN_OVERLAY_SHADER.MAX_OVERLAYS) -> DataTexture
    역할: 지정한 행 수의 stamp metadata를 저장할 float DataTexture를 만든다.
    의존:
        Three texture API — float RGBA metadata texture 생성과 sampler 설정; 생성자: {new DataTexture()}; 상수: {RGBAFormat, FloatType, NearestFilter, ClampToEdgeWrapping}; 속성 쓰기: {minFilter, magFilter, wrapS, wrapT, generateMipmaps, flipY, needsUpdate}
        TERRAIN_OVERLAY_SHADER — metadata texture 열·행 크기; 상수: {TEXTURE_WIDTH, MAX_OVERLAYS}
    동작:
        shader TEXTURE_WIDTH와 rowCapacity 및 RGBA 네 채널 크기의 Float32Array를 만든다.
        nearest filter, clamp wrapping, mipmap 비활성화와 flipY 비활성화를 설정한 DataTexture를 반환한다.

_emptyTerrainStampDataTexture: DataTexture | undefined
    활성 stamp가 없는 render binding이 안전하게 참조할 모듈 공유 빈 metadata texture이다.

getEmptyTerrainStampDataTexture() -> DataTexture
    역할: 비활성 render binding용 빈 metadata texture를 한 장만 lazy 생성해 반환한다.
    동작:
        공유 texture가 없으면 1행 metadata texture를 만들어 저장한다.

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

compareTerrainStampRenderOrder(a: object, b: object) -> number
    역할: stamp 합성에 사용할 렌더 순서를 비교한다.
    동작: renderOrder의 차를 반환하고 같으면 creationId의 차를 반환하며, 생략된 값은 0으로 본다.

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

getObjectTileBoundsXY(object: object, target: object) -> object | undefined
    역할: 서로 다른 terrain tile 구현의 bounds 위치를 공통 XY bounds로 변환한다.
    의존:
        terrain render object(object) — tile과 object bounds 접근; 함수: {getTile()}; 속성 읽기: {_tile, _boundingBox}
        terrain tile(tile) — tile bounds 접근; 함수: {getBoundingbox()}; 속성 읽기: {_boundingbox, _boundingBox, _rectangle3d}
    동작:
        getTile() 결과를 우선하고 없으면 object._tile을 사용한다.
        tile의 getBoundingbox(), _boundingbox, _boundingBox, object._boundingBox 순서로 첫 bounds 후보를 target에 정규화한다.

        정규 bounds가 있으면 반환하고, 없으면 tile._rectangle3d를 같은 방식으로 정규화해 반환한다.

getBoundsCenterXY(bounds: object) -> object
    역할: tile 후보 거리 정렬에 사용할 bounds 중심을 계산한다.
    동작: X와 Y 최소·최대의 평균 좌표를 가진 객체를 반환한다.

areBoundsXYEqual(a: object, b: object) -> boolean
    역할: 객체 identity와 무관하게 tile bounds의 네 숫자가 같은지 비교한다.
    동작: minX, minY, maxX와 maxY가 모두 같으면 true를 반환한다. 이전 문자열 key의 동치를 보존하여 NaN끼리와 양·음의 0끼리도 같은 값으로 취급한다.

normalizeBoundsXY(bounds: object | undefined, target: object) -> object | undefined
    역할: 지원하는 여러 bounds 표현을 minX·minY·maxX·maxY 구조로 통일한다.
    동작:
        bounds가 없으면 undefined를 반환한다.
        minx·miny·maxx·maxy가 모두 유한하면 축별 최소·최대 순서를 보정한다.
        그렇지 않고 min·max point의 x·y가 모두 유한하면 같은 구조로 보정한다.
        그렇지 않고 ptLeftBottom·ptRightTop point가 있으면 해당 x·y를 별도의 유효성 제한 없이 같은 구조로 보정한다.
        지원하는 형태가 아니면 undefined를 반환한다.
        외부 속성을 모두 읽어 보정한 뒤 target의 네 좌표에 기록하고 같은 객체를 반환한다.

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
        TERRAIN_OVERLAY_SHADER — uniform texture 폭; 상수: {TEXTURE_WIDTH}
    동작:
        합성 활성 여부 false와 premultiplied 합성색 Vector4(0,0,0,0)를 함께 만든다.
        plainRowLimit의 초기값 0과 rowCoverage·rowFill이 가리킬 공용 영점 Float32Array(16)·Float32Array(64)를 연결한다.
        count 0, 영점 objectRelative, pixelRatio 1과 공유 빈 stampDataTexture uniform을 만든다.

        shader texture 폭과 빈 texture의 높이 1 및 공유 atlas uniform을 함께 만든다.

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
        plainRowLimit은 0, rowCoverage·rowFill은 공용 영점 배열로 되돌려 이전 state의 단색 후보 경로를 재사용하지 않는다. atlasRevision은 0으로 초기화한다.
        전역 metadata의 마지막 직렬화 세대 globalTextureRevision은 -1로 시작한다.
        binding의 stampDataTexture를 새 활성 texture로, texture atlas를 현재 공유 atlas로 교체한다.

        cacheByStamp Map, 전역 metadata texture와 object별 tile cache WeakMap을 연결한다.
        frame 사이에 유지할 전체 stamp entries, tile 후보 배열, bounds 정규화 작업 객체와 전역 상대 origin을 state 전용 재사용 객체로 만든다.
        render binding 참조를 활성 state에 저장한다.
        후보 조합별 texture를 소유하는 빈 Map과 공용 빈 texture·count 0·영점 origin을 가진 빈 data를 만든다.

        같은 layer의 유휴 저장소를 보관할 행 수별 풀과 개수·byte 합계를 초기화한다.
        dirty=true, revision=0과 기본 maxStampsPerTile을 가진 state를 반환한다. 합성 활성 여부와 색은 초기화한다.

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

releaseTerrainStampState(state: object, retire?: Function) -> void
    역할: stamp가 없는 layer state의 GPU texture와 registry 소유권을 해제한다.
    처리 기준: state가 없거나 cacheByStamp에 stamp가 남아 있으면 아무것도 해제하지 않는다.
    의존:
        Three texture API — 전역·tile별 metadata texture 해제; 함수: {dispose()}
        defined — layer 참조 존재 여부 판정; 함수: {defined()}
    동작:
        layer와 render binding 참조를 보관한다.
        render binding의 activeCount와 uniform count를 0으로 바꾸고 좌표·pixel ratio를 초기화한다.
        binding의 stampDataTexture를 모듈 공유 빈 texture로 먼저 교체한 뒤 state 소유 전역 metadata texture를 내부 retire에 넘기거나, retire가 없으면 dispose한다. retire가 있으면 state의 전역 texture 참조도 비운다. Helper 배치는 내부 목록 수집 함수를 전달하여 외부 정리 callback을 참조 제거 이후에 호출한다.

        binding의 texture 높이를 1로 바꾼다.
        상수색 활성 uniform을 false로 바꾸고 색을 0으로 초기화한다. 별도 합성 GPU 자원은 없다.
        plainRowLimit은 0, rowCoverage·rowFill은 공용 영점 배열로 되돌려 해제한 tile cache의 배열 참조를 끊는다. 변경 추적의 직전 entry 목록도 비우고 공간 색인 참조를 해제한다.
        공유 Map의 활성 texture와 유휴 풀을 같은 retire로 반환하고 각 후보 record·Map·풀의 소유 참조를 비운다. retire가 없으면 즉시 해제한다.
        tile WeakMap을 새 빈 WeakMap으로 교체하고 cacheByStamp, entries와 tile 후보 배열을 비우며 전역 상대 origin을 영점으로 되돌린다.
        layer가 있으면 활성 state WeakMap 색인을 삭제하고 state의 layer와 render binding 참조를 지운다.
        전체 state Set에서 state를 제거한다.

releaseEmptyTerrainStampStates() -> void
    역할: 등록 cache가 없는 layer state를 안전하게 수집한 뒤 일괄 해제한다.
    동작:
        전체 state Set을 순회해 cacheByStamp가 빈 state를 임시 배열에 수집한다. 빈 state가 처음 발견될 때만 배열을 만든다.
        수집이 끝난 뒤 각 state의 자원과 소유권을 해제한다.

markAllTerrainStampStatesDirty() -> void
    역할: atlas 이미지 load 완료를 모든 layer metadata texture의 다음 재작성으로 연결한다.
    동작: 전체 terrain stamp state를 순회하며 textureDirty를 true로 바꾸고 atlasRevision을 증가시킨다. 위치와 무관하게 공유 metadata와 타일 분류를 무효화한다.

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

        등록 callback은 layer 목록만 갱신한다.
        후보 metadata와 타일별 상수색 판정은 실제 terrain draw의 updateRenderUniforms에서 갱신한다. render-before에서 별도 합성 render를 실행하지 않는다.

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

getSearchLayers(app: object, targetLayer?: object, sortedLayers?: Array<object>) -> Array<object>
    역할: app의 image layer 중 stamp registry에 적용할 layer 목록을 renderOrder 내림차순으로 계산한다.
    의존:
        U3dApp(app) — image layer 목록 조회; 함수: {getImageLayers()}
        U3dLayer(layer, targetLayer) — render 순서와 layer 식별값 조회; 함수: {getRenderOrder()}
    동작:
        같은 동기 갱신에서 준비한 전체 sortedLayers가 전달되면 그 목록을 사용한다.
        전달되지 않았으면 app.getImageLayers()를 조회하여 비어 있거나 배열이 아니면 빈 배열을 반환하고, 나머지는 renderOrder 내림차순으로 정렬한다.
        선택한 목록이 비어 있으면 targetLayer의 속성은 읽지 않고 그 목록을 반환한다.
        targetLayer가 있으면 같은 논리 layer를 찾고, targetLayer 자체를 제외한 뒤 그 renderOrder보다 높은 layer만 남긴다.

        직접 정렬한 목록은 참조 중복을 제거해 반환한다. 전달받은 목록은 이미 중복이 제거되어 있으므로 target 필터 결과 또는 원래 목록을 반환하며, 공유 목록을 제자리에서 변경하지 않는다.

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
한 번 생성된 render binding은 활성 state가 없어도 조회 가능해야 하며, terrain material은 이 빈 binding으로 stamp uniform 참조를 유지해야 한다. 비활성 합성 경로는 row variant의 count 0으로 표시한다.
전체 stamp entries, 전역 상대 origin과 tile 후보 배열은 layer state 사이에서 공유하지 않아야 한다.
layer state 생성·해제와 stamp 좌표·스타일 update는 app render 또는 QuadTileSet update를 강제로 요청하지 않아야 한다.
app별 stamp set은 WeakMap으로 관리하고 마지막 stamp가 제거되면 render-before callback과 app state를 제거해야 한다.
registry cache는 외부 입력 Vector3와 Color 객체를 직접 공유하지 않고 등록 시점의 복사본과 정규화 값을 사용해야 한다.
texture atlas는 URL별 cell을 공유하고 atlas가 가득 차 새 URL의 cell을 할당할 수 없으면 undefined entry를 반환해야 한다.
entry를 얻지 못한 URL의 채움도 이미지 준비 전과 동일하게 투명해야 한다.
tile bounds를 알 수 없는 object는 overlay 누락을 피하기 위해 전역 overlay texture 기준으로 처리해야 한다.
bounds 정보가 불완전하면 overlay 후보를 제거하지 않아야 한다.
tile 후보 교차 판정은 overlay bounds에 32 world unit margin을 적용해야 한다.
DataTexture의 row 폭은 shader TEXTURE_WIDTH의 24 float RGBA texel이다. 0번은 도형 metadata, 1~16번은 점, 17~23번은 채움·atlas·bounds·UV·mode·gradient를 저장한다. 타일별 metadata 높이는 실제 후보 수에 맞는 2의 거듭제곱이며 MAX_OVERLAYS 상한을 따른다. 상수색 경로도 동일한 후보를 사용한다.
texture image URL 후보는 원본 URL을 먼저 시도하고 root-relative URL이면 document.baseURI 기준 상대 후보를 추가로 시도해야 한다.
mappingFrame은 polygon 포함 판정과 bounds를 바꾸지 않고 여러 polygon stamp가 공유할 texture·gradient UV 좌표계만 정해야 한다.
polyline의 meters 두께는 world 거리로, pixels 두께는 renderer pixel ratio를 반영한 CSS pixel 의미로 shader에 전달해야 한다.
maxStampsPerTile은 개별 stamp 속성으로 입력되지만 같은 layer state가 공유하는 한도이므로, registry에 동기화되는 stamp의 값이 해당 state 한도를 갱신한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
