# GDecalTerrainShader 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`GDecalTerrainShader`는 지형 재질의 GLSL 원문에 지형 decal 평가 코드를 끼워 넣는 셰이더 정의 객체다. path·area·circle 세 종류의 벡터 피처를 packed texture로 받아 픽셀마다 직접 평가하거나, 미리 만들어 둔 합성(composite) texture를 sampling해서 지형 기본 색 위에 얹는다.

### 1.2 책임 범위

- 지형 재질의 vertex·fragment 셰이더 원문에서 정해진 앵커 문자열을 찾아 decal 조각을 주입한다.
- packed texture의 texel 조회 좌표 규칙과 선형 레이아웃 해석 규칙을 정의한다.
- 현재 재질 구간(render order 범위)과 현재 합성 batch에 속하는 피처만 그리도록 판정한다.
- path·area·circle 각각의 hit 판정, 색상 선택과 누적·삭제(hole) 규칙을 정의한다.
- 책임 경계: uniform 값과 define 조합을 실제로 채우고 재질에 연결하는 일은 `UShaderTerrainDecalUtils`와 `UTerrainMaterial`이, packed texture의 생성은 `UTerrainDecalPrepareTask`와 `UShaderTerrainDecalUtils`가, 합성 texture의 렌더와 소유권은 `UTerrainDecalCompositeComposer`가 담당한다.

### 1.3 주요 동작 방식

`setVertexShader()`와 `setFragmentShader()`가 three.js가 만든 셰이더 원문의 `void main() {`을 각각 `replaceVertexShader`·`replaceFragmentShader` 조각으로 교체해 선언과 평가 함수를 앞에 붙이고, `#include <worldpos_vertex>`와 `#include <map_fragment>` 뒤에 varying 기록과 색 합성 호출을 덧붙인다. vertex 조각은 tile 정점 좌표에 `tileScale`을 곱해 decal local 좌표를 varying으로 넘기고, fragment 조각은 그 좌표로 `USE_TERRAIN_DECAL_HYBRID`이면 합성 texture sampling과 직접 평가를 함께 반영하고, `USE_TERRAIN_DECAL_COMPOSITE`이면 완성된 합성 texture 한 번만 sampling하고, 그렇지 않고 `USE_TERRAIN_DECAL`이면 path → area → circle 순으로 직접 평가한 결과를 지형 기본 색 위에 합성한다.

관찰된 실행 특성: area 외곽 판정은 픽셀마다 다각형 점 목록 전체를 순회하므로, 점 texel 좌표를 반복마다 증분으로 진행하는 형태로 작성되어 있다.

### 1.4 주요 사용처와 연계 대상

- `UTerrainMaterial`이 `onBeforeCompile`에서 `setVertexShader()`와 `setFragmentShader()`를 호출해 지형 재질 program을 만든다.
- `union3d/manager/terrain/UTerrainDecalCompositeComposer.js`가 `replaceFragmentShader`를 자체 `ShaderMaterial`의 fragment 앞부분으로 재사용하고 `getMergedDecalColor()`를 호출해 offscreen batch를 그린다.
- `union3d/manager/terrain/UShaderTerrainDecalUtils.js`가 이 조각이 선언한 uniform 이름과 define 이름에 맞춰 실제 uniform 객체와 DataTexture를 만든다.
- packed texture의 선형 레이아웃과 index 반올림 규칙은 `union3d/worker/task/model/vector/UTerrainDecalPrepareTask.js`의 packing 결과와 같은 계약을 공유한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
주입은 three.js 원본 셰이더의 `void main() {`, `#include <worldpos_vertex>`, `#include <map_fragment>` 앵커를 전제로 하며, 주입 뒤에도 원본 chunk의 실행 순서를 유지해야 한다.
현재 재질이 담당하는 render order 구간을 벗어난 피처는 그 재질에서 그려서는 안 된다.
합성 batch 실행에서는 현재 batch 순번에 속한 피처만 그려야 하며, batch 순번을 쓰지 않는 직접 평가에서는 모든 피처가 대상이어야 한다.
합성 texture 경로와 직접 평가 경로는 동시에 실행되지 않아야 한다.
packed texture의 정수 index 복원은 packing을 만든 main-thread·worker와 같은 반올림 규칙을 사용해야 한다.
fill alpha가 -1.0인 area는 색을 더하지 않고 이미 누적된 decal 결과를 지우는 hole로 처리해야 한다.
같은 픽셀에서 여러 피처가 겹치면 path, area, circle 순으로 뒤에 평가한 결과가 위에 놓여야 한다.
decal 합성 결과는 지형 기본 색의 알파를 보존한 상태로 그 위에 얹혀야 한다.
```

## 3. 정규 자연어 수도코드

```spec
TERRAIN_RENDER_ORDER_MAX: number = 3.4e38
    render order 상한값이며 nextRenderOrder 초기값으로 사용한다. 상한이 열려 있으면 재질 구간 판정이 모든 피처를 대상으로 삼는다.

BUCKET_COUNT: number = 256
    area·circle bucket meta uniform 배열의 고정 길이이며 GLSL 배열 선언 크기로 문자열 보간된다. bucket grid의 가로·세로 곱이 이 값을 넘으면 배열 범위를 벗어난 index를 조회한다. [확인 Q-001]

GDecalTerrainShader: 모듈 상수 셰이더 정의 객체
    지형 decal 평가에 필요한 이름, uniform 초기 정의, 주입용 GLSL 조각과 두 주입 함수를 담아 export한다.

    의존:
        THREE — uniform 초기값 벡터 생성; 생성자: {new THREE.Vector2(), new THREE.Vector4()}

GDecalTerrainShader.name: string = "GDecalTerrainShader"
    셰이더 정의 이름이다.

GDecalTerrainShader.uniforms: Record<string, {value: unknown}>
    fragment·vertex 조각이 선언하는 uniform의 초기 정의 집합이다. 이 저장소의 소비자는 이 집합을 읽지 않고 각자 uniform 객체를 만들어 재질에 연결하므로, 현재는 uniform 이름과 초기값을 모아 둔 선언 기준으로만 존재한다. [확인 Q-002]

GDecalTerrainShader.uniforms.threshold: {value: 1.0}
    bounds 판정에 더하는 여유 폭이며 style stroke width가 0 이하일 때 사용하는 기본 선 굵기다.

GDecalTerrainShader.uniforms.depthOffset: {value: 0.0001}
    깊이 보정용 초기값이며 두 GLSL 조각 어디에도 선언·사용되지 않는다. [확인 Q-003]

GDecalTerrainShader.uniforms.tileScale: {value: {x: 1.0, y: 1.0}}
    tile 정점 좌표를 decal local 좌표로 바꾸는 배율이며 vertex 조각이 사용한다.

GDecalTerrainShader.uniforms.materialRenderOrder, GDecalTerrainShader.uniforms.nextRenderOrder: {value: number}
    현재 재질이 담당하는 render order 구간의 하한과 상한이며 초기값은 0.0과 TERRAIN_RENDER_ORDER_MAX다.

GDecalTerrainShader.uniforms.pathSegmentDataTexture, GDecalTerrainShader.uniforms.pathSegmentDataTexSize: {value: undefined}
    path segment 좌표 texture와 그 texel 크기다. segment 1개가 texel 1개이며 채널은 (x1, y1, x2, y2)다.

GDecalTerrainShader.uniforms.pathSegmentMetaTexture, GDecalTerrainShader.uniforms.pathSegmentMetaTexSize: {value: undefined}
    path segment meta texture와 그 texel 크기다. segment 1개가 texel 1개이며 채널은 (pathStyleIndex, strokeWidth, visible, shaderLayerRenderOrder)다.

GDecalTerrainShader.uniforms.pathStyleTexture, GDecalTerrainShader.uniforms.pathStyleTexSize: {value: undefined}
    path style texture와 그 texel 크기다. style 1개가 texel 2개이며 앞 texel은 RGBA 색, 뒤 texel의 x 채널은 합성 batch 순번이다.

GDecalTerrainShader.uniforms.pathFullBounds: {value: undefined}
    path 전체를 감싸는 local 경계 (minX, minY, maxX, maxY)이며 픽셀 조기 종료 판정에 사용한다.

GDecalTerrainShader.uniforms.pathSegmentCount: {value: 0}
    유효한 path segment 수이며 0 이하이면 path 평가를 하지 않는다.

GDecalTerrainShader.uniforms.pathUseBuckets: {value: 0}
    0 이하이면 bucket 없이 segment를 직접 순회하고, 0보다 크면 bucket index texture를 사용한다.

GDecalTerrainShader.uniforms.pathBucketGrid: {value: {x: 8, y: 8}}
    path bucket 격자의 가로·세로 개수이며 bucket meta texel 수를 계산하는 데도 사용한다.

GDecalTerrainShader.uniforms.pathBucketIndexTexture, GDecalTerrainShader.uniforms.pathBucketIndexTexSize: {value: undefined}
    path bucket index texture와 그 texel 크기다. 앞쪽 texel은 bucket meta, 뒤쪽 texel은 RGBA 네 채널에 묶은 segment index다.

GDecalTerrainShader.uniforms.areaDataTexture, GDecalTerrainShader.uniforms.areaDataTexSize: {value: undefined}
    area 선형 레이아웃 texture와 그 texel 크기다. 앞쪽 areaCount개 texel이 행 header, 그 뒤가 점 목록이다.

GDecalTerrainShader.uniforms.areaStyleTexture, GDecalTerrainShader.uniforms.areaStyleTexSize: {value: undefined}
    area style texture와 그 texel 크기다. 행 1개가 area 1개이고 열 0은 fill 색, 열 1은 stroke 색, 열 2는 옵션이다.

GDecalTerrainShader.uniforms.areaBoundsTexture, GDecalTerrainShader.uniforms.areaBoundsTexSize: {value: undefined}
    area별 local 경계 texture와 그 texel 크기다. 행 1개의 열 0 texel이 그 area의 (minX, minY, maxX, maxY)다.

GDecalTerrainShader.uniforms.areaFullBounds: {value: undefined}
    area 전체를 감싸는 local 경계이며 픽셀 조기 종료와 bucket index 계산의 기준 범위다.

GDecalTerrainShader.uniforms.areaCount: {value: 0}
    area 행 수이며 0 이하이면 area 평가를 하지 않고 행 index의 상한 검사에도 사용한다.

GDecalTerrainShader.uniforms.areaBucketMeta: {value: Array<Vector4>}
    bucket별 (시작 행, 행 수) 목록이며 길이 BUCKET_COUNT의 영 벡터 배열로 시작한다.

GDecalTerrainShader.uniforms.areaBucketGrid: {value: {x: 8, y: 8}}
    area bucket 격자의 가로·세로 개수다.

GDecalTerrainShader.uniforms.circleDataTexture, GDecalTerrainShader.uniforms.circleDataTexSize: {value: undefined}
    circle 데이터 texture와 그 texel 크기다. 행 1개가 texel 1개이며 채널은 (centerX, centerY, radius, shaderLayerRenderOrder)다.

GDecalTerrainShader.uniforms.circleStyleTexture, GDecalTerrainShader.uniforms.circleStyleTexSize: {value: undefined}
    circle style texture와 그 texel 크기다. 행 1개가 texel 3개이며 순서대로 fill 색, stroke 색, 옵션이다.

GDecalTerrainShader.uniforms.circleBounds: {value: undefined}
    circle 전체를 감싸는 local 경계이며 픽셀 조기 종료와 bucket index 계산의 기준 범위다.

GDecalTerrainShader.uniforms.circleCount: {value: 0}
    circle 행 수이며 0 이하이면 circle 평가를 하지 않고 행 index의 상한 검사에도 사용한다.

GDecalTerrainShader.uniforms.circleBucketMeta: {value: Array<Vector4>}
    bucket별 (시작 행, 행 수) 목록이며 길이 BUCKET_COUNT의 영 벡터 배열로 시작한다.

GDecalTerrainShader.uniforms.circleBucketGrid: {value: {x: 8, y: 8}}
    circle bucket 격자의 가로·세로 개수다.

GDecalTerrainShader.uniforms.terrainDecalCompositeTexture, GDecalTerrainShader.uniforms.terrainDecalCompositeBounds: {value: undefined}
    미리 합성해 둔 premultiplied alpha 결과 texture와 그 결과가 덮는 local 경계다. 직접 평가 경로에서는 연결하지 않는다.

GDecalTerrainShader.uniforms.terrainCompositionBatchIndex: {value: 0}
    합성 실행에서 이번에 그릴 batch 순번이다.

GDecalTerrainShader.uniforms.terrainCompositeRasterBounds: {value: undefined}
    합성 raster가 덮는 local 경계이며 이 단위의 GLSL 조각은 선언하지 않고 합성기 자신의 vertex 셰이더가 선언·사용한다.

GDecalTerrainShader.uniforms.terrainCompositeRasterTexelSize: {value: {x: 0, y: 0}}
    합성 target texel 1개의 local 크기이며 축소된 합성에서 최소 선 굵기를 보정하는 데 사용한다.

GDecalTerrainShader.uniforms.threshold.value: number = 1.0
    복제 전 초기 여유 폭이다.

GDecalTerrainShader.uniforms.depthOffset.value: number = 0.0001
    복제 전 초기 깊이 보정값이다.

GDecalTerrainShader.uniforms.materialRenderOrder.value: number = 0.0
    복제 전 초기 render order 하한이다.

GDecalTerrainShader.uniforms.nextRenderOrder.value: number = TERRAIN_RENDER_ORDER_MAX
    복제 전 초기 render order 상한이다.

GDecalTerrainShader.uniforms.pathSegmentCount.value, GDecalTerrainShader.uniforms.pathUseBuckets.value, GDecalTerrainShader.uniforms.areaCount.value, GDecalTerrainShader.uniforms.circleCount.value, GDecalTerrainShader.uniforms.terrainCompositionBatchIndex.value: number = 0
    복제 전 초기값이며 어떤 피처도 연결되지 않은 상태를 뜻한다.

GDecalTerrainShader.uniforms.tileScale.value: THREE.Vector2 = (1.0, 1.0)
    복제 전 초기 tile 배율이다.

GDecalTerrainShader.uniforms.pathBucketGrid.value, GDecalTerrainShader.uniforms.areaBucketGrid.value, GDecalTerrainShader.uniforms.circleBucketGrid.value: THREE.Vector2 = (8, 8)
    복제 전 초기 bucket 격자이며 실제 격자는 상태를 만드는 쪽이 채운다.

GDecalTerrainShader.uniforms.terrainCompositeRasterTexelSize.value: THREE.Vector2 = (0, 0)
    복제 전 초기 target texel 크기이며 0이면 최소 선 굵기 보정을 하지 않는다.

GDecalTerrainShader.uniforms.areaBucketMeta.value, GDecalTerrainShader.uniforms.circleBucketMeta.value: Array<THREE.Vector4>
    복제 전 초기 bucket meta 배열이며 길이는 BUCKET_COUNT이고 각 항목은 새로 만든 영 벡터다.

GDecalTerrainShader.uniforms.pathSegmentDataTexture.value, GDecalTerrainShader.uniforms.pathSegmentDataTexSize.value, GDecalTerrainShader.uniforms.pathSegmentMetaTexture.value, GDecalTerrainShader.uniforms.pathSegmentMetaTexSize.value, GDecalTerrainShader.uniforms.pathStyleTexture.value, GDecalTerrainShader.uniforms.pathStyleTexSize.value, GDecalTerrainShader.uniforms.pathFullBounds.value, GDecalTerrainShader.uniforms.pathBucketIndexTexture.value, GDecalTerrainShader.uniforms.pathBucketIndexTexSize.value: undefined
    복제 전 초기값이며 실제 path texture와 크기·경계는 상태를 만드는 쪽이 채운다.

GDecalTerrainShader.uniforms.areaDataTexture.value, GDecalTerrainShader.uniforms.areaDataTexSize.value, GDecalTerrainShader.uniforms.areaStyleTexture.value, GDecalTerrainShader.uniforms.areaStyleTexSize.value, GDecalTerrainShader.uniforms.areaBoundsTexture.value, GDecalTerrainShader.uniforms.areaBoundsTexSize.value, GDecalTerrainShader.uniforms.areaFullBounds.value: undefined
    복제 전 초기값이며 실제 area texture와 크기·경계는 상태를 만드는 쪽이 채운다.

GDecalTerrainShader.uniforms.circleDataTexture.value, GDecalTerrainShader.uniforms.circleDataTexSize.value, GDecalTerrainShader.uniforms.circleStyleTexture.value, GDecalTerrainShader.uniforms.circleStyleTexSize.value, GDecalTerrainShader.uniforms.circleBounds.value: undefined
    복제 전 초기값이며 실제 circle texture와 크기·경계는 상태를 만드는 쪽이 채운다.

GDecalTerrainShader.uniforms.terrainDecalCompositeTexture.value, GDecalTerrainShader.uniforms.terrainDecalCompositeBounds.value, GDecalTerrainShader.uniforms.terrainCompositeRasterBounds.value: undefined
    복제 전 초기값이며 합성 결과 texture와 두 경계는 합성기가 채운다.

GDecalTerrainShader.replaceVertexShader: string
    vertex 셰이더의 `void main() {`을 대체하는 GLSL 조각 원문이다. 다음 선언과 계산을 담고 `void main() {`을 다시 열어 원본 본문이 이어지게 한다.
        varying vDecalWorldPosition(vec3)과 vDecalLocalPosition(vec2), uniform tileScale(vec2)을 선언한다.
        main 시작 직후 정점 position의 xy에 tileScale을 곱해 vDecalLocalPosition에 넣는다. 이 값이 이후 모든 decal 평가의 local 좌표계다.

GDecalTerrainShader.replaceFragmentShader: string
    fragment 셰이더의 `void main() {`을 대체하는 GLSL 조각 원문이다. BUCKET_COUNT를 배열 크기로 보간한 uniform 배열 선언을 포함하고, 아래 평가 규칙을 담은 뒤 `void main() {`을 다시 열어 원본 본문이 이어지게 한다.
        vDecalWorldPosition과 vDecalLocalPosition varying, threshold·materialRenderOrder·nextRenderOrder uniform을 선언한다. vDecalWorldPosition은 선언만 있고 이 조각의 어떤 계산에도 쓰이지 않는다. [확인 Q-004]
        대상 판정과 define 분기 규칙은 다음과 같다.
            재질 구간 판정은 피처의 shaderLayerRenderOrder가 materialRenderOrder 이상이고 nextRenderOrder 미만일 때만 참이다. 하한은 포함하고 상한은 포함하지 않는다.
            packed 정수 index 복원은 실수 채널값에 0.5를 더한 뒤 내림하며, 이 규칙 덕분에 -1 padding이 -1로 복원되어 무효 index 판정에 쓰인다.
            USE_TERRAIN_DECAL_COMPOSITION_BATCH를 정의하면 batch 판정은 피처의 packed batch 순번과 terrainCompositionBatchIndex를 같은 복원 규칙으로 정수화해 비교하고, 정의하지 않으면 항상 참이다. 합성은 batch 하나씩 그려야 Layer·Feature 총순서를 재현할 수 있다.
            USE_TERRAIN_DECAL_COMPOSITE_RASTER를 정의하면 선 굵기는 terrainCompositeRasterTexelSize의 두 성분 중 큰 값의 절반을 하한으로 올려, 상한으로 축소된 합성에서 subpixel 외곽선이 사라지지 않게 한다. texel 크기가 0 이하이면 보정하지 않고, define이 없으면 입력 굵기를 그대로 쓴다.
            선 굵기 기본값 규칙은 style의 stroke width가 0보다 크면 그 값을, 그렇지 않으면 threshold를 쓰는 것이다.
        packed texture 조회 레이아웃 규칙은 다음과 같다.
            texel 조회는 texture 크기를 최소 1로 보정한 뒤 (x + 0.5, y + 0.5)를 크기로 나눈 uv로 수행해 texel 중심을 읽는다.
            선형 index 조회는 index에 0.5를 더한 값을 보정한 가로 크기로 나눠 내림한 값을 행으로 삼고, index에서 행과 가로 크기의 곱을 뺀 값을 열로 삼은 다음 같은 texel 중심 규칙으로 읽는다. 행을 정할 때 0.5를 더하는 것은 GPU 나눗셈이 폭의 정확한 배수에서 1 ULP 작게 나와 한 행 앞을 가리키고 열이 가로 크기와 같아지는 것을 막기 위한 것이며, 0.5를 더하면 경계에서 최소 0.5/가로 크기만큼 떨어져 열이 0 이상 가로 크기 미만의 정수로 떨어진다.
            area 데이터는 선형 레이아웃이며 texel [0, 행 수) 구간이 행 header vec4(pointCount, shaderLayerRenderOrder, compositionBatchIndex, pointStart)이고, 각 행의 점 목록은 header가 가리키는 pointStart부터 이어진다. 점 조회는 pointStart에 점 index를 더한 선형 index의 xy 채널을 읽는다.
            bucket index는 기준 경계의 크기를 최소 1e-6으로 보정하고 정규화 좌표를 0 이상 0.999999 이하로 자른 뒤 격자 크기를 곱해 내림하며, 행 우선으로 (cellY * gridX + cellX)를 만든다. 상한을 1보다 작게 자르므로 경계 위의 픽셀도 마지막 cell에 들어간다.
            경계 포함 판정은 경계 네 변에 여유 폭을 더한 사각형에 점이 있는지를 경계값 포함으로 검사한다.
            선분 거리 판정은 점을 선분에 투영한 매개변수를 0과 1로 자른 최근접점까지의 제곱거리를 쓰며, 선분 길이 제곱이 0이면 1e-6으로 나눠 0 나눗셈을 피한다.
        decal 누적 상태와 합성 규칙은 다음과 같다.
            누적 상태는 premultiplied RGB, 알파, 커버리지 세 값을 함께 들고 다닌다. 커버리지를 알파와 따로 유지해야 하나의 피처 안에서 fill과 stroke가 나눠 덮은 픽셀의 이음새가 투명해지지 않는다.
            피처 하나를 누적할 때는 알파와 커버리지를 0 이상 1 이하로 자르고 둘을 곱한 값을 source 알파로 삼아, 새 피처를 기존 결과 위에 얹는 방향으로 premultiplied RGB와 알파를 갱신한다. 커버리지는 커버리지끼리 같은 방향으로 누적한다.
            누적 상태끼리 병합할 때도 나중 상태를 앞선 상태 위에 얹으며, 남는 비율은 나중 상태의 자른 알파·커버리지로 계산하되 더해지는 항은 자르지 않은 나중 상태값을 그대로 쓴다.
            지우기는 지울 커버리지를 0 이상 1 이하로 자른 뒤 남는 비율을 premultiplied RGB·알파·커버리지에 모두 곱한다. area hole이 이 경로를 사용한다.
            누적 상태를 기본 색 위에 얹을 때는 자른 알파가 0 이하이면 기본 색을 그대로 반환하고, 그렇지 않으면 premultiplied RGB를 알파로 되돌린 뒤 기본 색과 source-over로 합성해 straight alpha 색을 만든다. 알파로 나눌 때는 1e-6을 하한으로 두어 0 나눗셈을 피한다.
            straight alpha decal 색 하나를 기본 색 위에 얹는 경로도 자른 알파가 0 이하이면 기본 색을 그대로 반환하고, 그렇지 않으면 같은 source-over 규칙을 적용한다. 합성 texture sampling 결과가 이 경로를 사용한다.
        USE_TERRAIN_DECAL_COMPOSITE를 정의하면 합성 결과 sampling 규칙이 추가된다.
            terrainDecalCompositeBounds로 local 좌표를 uv로 바꾸고 경계 크기는 최소 1e-6으로 보정한다.
            uv가 0과 1 사이를 벗어나면 완전 투명을 반환해 합성 범위 밖에 색을 만들지 않는다.
            읽은 값은 premultiplied alpha이므로 자른 알파가 0보다 클 때만 straight alpha로 되돌려 반환하고, 0 이하이면 완전 투명을 반환한다.
        USE_PATH_DECAL을 정의하면 path 평가 규칙이 추가된다.
            path는 polyline이 아니라 선형 segment index로 참조하며 style index는 packing 단계에서 Feature마다 하나씩 부여된다.
            segment 하나의 누적 판정 순서는 index 범위 검사, style index가 0 미만이면 중단, 재질 구간 판정, style의 batch 순번으로 batch 판정, meta의 visible이 0.5 이하이면 중단이다. 그다음 선 굵기를 확정하고 segment 좌표를 읽는다.
            선 굵기와 AA 반경을 더한 segment AABB 밖이면 거리 계산 없이 중단한다. 안이면 선분 거리와 양쪽 경계의 smoothstep 차로 커버리지를 계산하므로 한 픽셀보다 가는 선도 부분 커버리지를 갖는다.
            같은 Feature의 연속된 segment는 커버리지 최댓값으로 한 번만 합성한다. 더 큰 커버리지가 나오면 해당 Feature를 합성하기 전 상태로 돌아가 새 값으로 합성하므로 반투명 이음새가 진해지지 않는다. Worker와 즉시 경로는 원본 segment 순서대로 bucket에 등록해 같은 Feature의 연속성을 유지한다.
            픽셀 진입 시 pathSegmentCount가 0 이하이거나 pathFullBounds에 threshold와 AA 반경 두 배의 여유를 준 범위 밖이면 빈 상태를 반환한다.
            pathUseBuckets가 0 이하이면 고정 상한 256회 반복으로 segment index를 0부터 직접 순회하고 pathSegmentCount에 도달하면 반복을 끊는다. 상한을 고정한 것은 모바일·WebGL1 드라이버의 루프 최적화 부담을 줄이기 위한 것이며, segment 수가 상한을 넘는 상태를 이 경로로 연결하면 남은 segment는 평가되지 않는다.
            pathUseBuckets가 0보다 크면 bucket index texel에서 시작 texel과 texel 수를 정수로 복원하고, bucket meta 영역의 texel 수(격자 가로 곱 세로)를 더한 위치부터 차례로 읽는다.
            bucket texel 위치가 0 미만이거나 texture 전체 texel 수 이상이면 그 항목만 건너뛴다.
            bucket texel 하나의 RGBA 네 채널을 각각 segment index로 복원해 최대 네 개의 후보를 같은 누적 판정에 넘긴다.
        USE_AREA_DECAL을 정의하면 area 평가 규칙이 추가된다.
            외곽·내부 판정은 점 목록을 한 번 순회하면서 최소 제곱거리와 홀짝 교차 수를 함께 구한다.
            점 texel 좌표의 시작값은 pointStart에 0.5를 더한 값을 보정한 가로 크기로 나눠 내림한 행과 pointStart에서 그 행과 가로 크기의 곱을 뺀 열로 구하며, 선형 index 조회와 같은 나눗셈 오차 회피 규칙을 쓴다. 그 뒤 반복마다 열을 1 늘리고 가로 크기에 닿으면 열을 0으로 되돌리며 행을 1 늘리는 방식으로 증분 진행하고, uv 변환은 미리 구한 역수 곱으로 처리한다.
            첫 비교 대상 이전 점은 점 목록의 마지막 점이므로 닫힌 다각형의 마지막 변까지 모두 검사된다.
            교차 판정은 현재 점과 이전 점의 y가 검사 점 y를 서로 다른 방향으로 지날 때만 유효하고, 그 변과 수평선의 교점 x가 검사 점 x 이상일 때 교차 수를 1 늘린다. 두 y가 같아 분모가 0이 되는 경우를 막기 위해 분모에 1e-6을 더한다.
            반환값은 최소 거리의 제곱근에 안팎 부호를 적용한 거리이며 내부는 음수, 외부는 양수다.
            픽셀 진입 시 areaCount가 0 이하이거나 areaFullBounds에 threshold와 AA 반경 두 배의 여유를 준 범위 밖이면 빈 상태를 반환한다.
            bucket meta uniform 배열에서 시작 행과 행 수를 정수로 복원하고 그 행들을 순회하며, 행 index가 0 미만이거나 areaCount 이상이면 건너뛴다.
            행마다 fill 색과 옵션 texel, 행 header를 먼저 읽어 재질 구간 판정과 batch 판정을 하고 옵션의 visible이 0.5 이하이면 건너뛴다.
            옵션의 마지막 채널이 0.5를 넘으면 clipping된 다각형이 tile 전체를 덮는 경우이므로, 교차 검사 없이 fill alpha가 -1.0이면 커버리지 1로 지우고 그렇지 않으면 커버리지 1로 fill을 누적한 뒤 다음 행으로 넘어간다.
            그 외에는 선 굵기를 확정하고 stroke 색과 행별 경계 texel을 읽어, 선 굵기와 AA 반경을 더한 행 경계 밖이면 건너뛴다.
            header의 점 수가 3 미만이면 건너뛰고, 그렇지 않으면 pointStart와 점 수로 부호 있는 최소 거리를 구한다.
            내부와 외부의 외곽선 경계에 smoothstep을 적용해 fill 커버리지와 전체 커버리지를 구하고, 그 차를 stroke 커버리지로 사용한다.
            fill alpha가 -1.0이면 fill 커버리지만큼 지운다. 지우기와 stroke는 서로 다른 부분을 차지하므로 기존 상태의 잔여율은 1 - fillCoverage - strokeAlpha로 계산한다.
            일반 면은 fill과 stroke의 premultiplied 색·알파를 더해 한 Feature로 합성한다. 두 영역을 순차 합성하지 않아 접점에 투명한 틈이 생기지 않는다.
        USE_CIRCLE_DECAL을 정의하면 circle 평가 규칙이 추가된다.
            픽셀 진입 시 circleCount가 0 이하이거나 circleBounds에 threshold 여유를 준 범위 밖이면 빈 상태를 반환한다.
            bucket meta uniform 배열에서 시작 행과 행 수를 정수로 복원하고 그 행들을 순회하며, 행 index가 0 미만이거나 circleCount 이상이면 건너뛴다.
            행의 데이터 texel과 style texel 세 개(행 번호에 3을 곱한 선형 index부터 fill, stroke, 옵션)를 읽고, 데이터의 마지막 채널로 재질 구간 판정, 옵션의 마지막 채널로 batch 판정을 한다.
            선 굵기를 확정한 뒤 옵션의 visible이 0.5 이하이면 건너뛴다.
            중심과 반지름에 반지름과 선 굵기를 더한 지역 경계를 만들어 그 밖이면 건너뛴다.
            안티에일리어싱 폭은 중심 거리의 화면 변화량을 최소 0.0001로 보정해 쓰고, 바깥 마스크는 반지름 경계의 smoothstep 보수, 안쪽 마스크는 반지름에서 선 굵기를 뺀 값을 0으로 자른 내부 반지름 경계의 smoothstep 보수다. stroke 마스크는 두 마스크의 차를 0 이상 1 이하로 자른 값이다.
            fill 커버리지는 fill alpha가 0 이상일 때만 안쪽 마스크이고 음수 alpha이면 0이다. circle 커버리지는 fill 커버리지와 stroke 마스크의 합을 1로 자른 값이다.
            circle 커버리지가 0보다 크면 fill과 stroke를 겹치는 레이어가 아니라 한 픽셀을 나누는 영역으로 보고, 각 색에 자른 알파와 자기 마스크를 곱해 더한 premultiplied RGB와 알파, 그리고 circle 커버리지를 담은 상태 하나를 만들어 결과에 병합한다.
        진입점 규칙은 다음과 같다.
            병합 상태 조회는 빈 상태에서 시작해 정의된 define에 따라 path, area, circle 순으로 각 평가 결과를 병합하므로 뒤에 병합한 종류가 위에 놓인다.
            병합 색 조회는 병합 상태의 자른 알파가 0 이하이면 완전 투명을, 그렇지 않으면 premultiplied RGB를 알파로 되돌린 straight alpha 색을 반환한다. offscreen 합성기가 batch 하나를 색으로 얻을 때 이 함수를 호출한다.

GDecalTerrainShader.setVertexShader(vertexShader: string) -> string
    역할: three.js가 만든 지형 vertex 셰이더 원문에 decal local 좌표 계산과 world 좌표 varying 기록을 주입한다.

    인터페이스:
        vertexShader: 주입 대상 vertex 셰이더 원문이며 `void main() {`과 `#include <worldpos_vertex>`를 포함해야 한다.
        반환: 두 곳을 교체한 새 셰이더 원문.

    처리 기준:
        문자열 교체이므로 각 앵커의 첫 번째 출현만 대체하며, 앵커가 없으면 원문을 그대로 통과시켜 decal 좌표가 만들어지지 않는다.
        world 좌표 varying은 원본 셰이더가 world position을 계산하는 define 조합에서만 실제 값을 담는다.

    동작:
        `void main() {`을 replaceVertexShader 조각으로 교체해 varying·uniform 선언과 decal local 좌표 계산을 본문 앞에 넣고 main을 다시 연다.
        `#include <worldpos_vertex>` 뒤에 조건부 대입을 덧붙여, USE_ENVMAP·DISTANCE·USE_SHADOWMAP·USE_TRANSMISSION 중 하나가 정의되었거나 spot light 좌표 수가 0보다 크면 계산된 world position의 xyz를 vDecalWorldPosition에 넣고, 그 밖에는 영 벡터를 넣는다.

GDecalTerrainShader.setFragmentShader(fragmentShader: string) -> string
    역할: three.js가 만든 지형 fragment 셰이더 원문에 decal 평가 함수와 기본 색 위 합성 호출을 주입한다.

    인터페이스:
        fragmentShader: 주입 대상 fragment 셰이더 원문이며 `void main() {`과 `#include <map_fragment>`를 포함해야 한다.
        반환: 두 곳을 교체한 새 셰이더 원문.

    처리 기준:
        문자열 교체이므로 각 앵커의 첫 번째 출현만 대체하며, 앵커가 없으면 원문을 그대로 통과시켜 decal이 그려지지 않는다.
        합성 경로와 직접 평가 경로는 define 우선순위로 하나만 선택되고, 두 define이 모두 없으면 주입한 평가 함수는 호출되지 않는다.
        합성 호출은 map chunk가 diffuseColor를 확정한 다음에 놓여야 지형 기본 색 위에 decal이 얹힌다.

    동작:
        `void main() {`을 replaceFragmentShader 조각으로 교체해 선언과 평가 함수를 본문 앞에 넣고 main을 다시 연다.
        `#include <map_fragment>` 뒤에 define 분기를 덧붙여, USE_TERRAIN_DECAL_HYBRID가 정의되어 있으면 합성 texture sampling 색을 먼저 합성한 뒤 같은 좌표의 직접 평가 병합 상태를 이어서 합성한다. 두 집합의 범위가 합성 번짐 여유까지 포함해 겹치지 않을 때만 호출부가 이 define을 켜므로 한 픽셀에 두 집합이 함께 기여하지 않고 두 합성의 순서가 결과를 바꾸지 않는다.
        USE_TERRAIN_DECAL_HYBRID가 없고 USE_TERRAIN_DECAL_COMPOSITE가 정의되어 있으면 decal local 좌표로 합성 texture를 sampling한 straight alpha 색을 diffuseColor 위에 합성한다.
        두 define이 모두 없고 USE_TERRAIN_DECAL이 정의되어 있으면 decal local 좌표의 병합 상태를 구해 diffuseColor 위에 합성한다.
```

## 4. 공통 처리 기준과 제약

```spec
- packed texture 레이아웃 계약: path segment는 좌표 texel과 meta texel을 index로 1:1 대응시키고, path style은 색 texel과 batch texel 두 개를 style index마다 사용한다. area는 앞쪽 행 header 구간과 뒤쪽 점 목록을 하나의 선형 texture에 담고 header가 pointStart로 점 시작을 가리키며, area style은 열 3개(fill, stroke, 옵션)·행 1개 구조, area 경계는 열 1개·행 1개 구조다. circle은 행마다 데이터 texel 1개와 style texel 3개를 사용한다. 이 계약은 UTerrainDecalPrepareTask의 packing, UShaderTerrainDecalUtils의 DataTexture 생성, UTerrainDecalCompositeComposer의 batch 범위 조회와 공유하므로 한쪽만 바꾸지 않는다.
- 정수 index 복원 계약: 실수 채널의 정수 index는 0.5를 더한 뒤 내림으로 복원하며, 무효 index는 -1로 padding한다. packing 쪽 반올림 규칙이 달라지면 무효 판정과 style 참조가 함께 깨진다.
- bucket 계약: bucket index는 기준 경계와 격자만으로 계산하므로 bucket meta를 만든 쪽과 같은 경계·격자를 uniform으로 연결해야 한다. area·circle의 bucket meta는 길이 BUCKET_COUNT의 uniform 배열이므로 격자 가로·세로의 곱이 BUCKET_COUNT를 넘지 않아야 하고, path의 bucket meta는 index texture 앞부분에 두어 격자 가로·세로 곱만큼의 texel을 차지한다.
- 선·면 AA 계약: local 좌표의 화면 미분은 피처별 분기 전에 한 번 계산한다. 두 방향 미분 길이 합의 절반을 AA 반경으로 쓰되 긴 bucket 변의 절반으로 제한한다. 후보 생성은 긴 bucket 변 하나만큼 확장하고 raster의 추가 두께도 AA 반경 이하로 제한해 경계가 후보에서 잘리지 않게 한다. 극단적인 축소에서 더 넓은 AA가 필요하면 후보 여유와 셰이더 상한을 함께 조정해야 한다.
- 알파 표현 계약: 누적 상태의 RGB는 premultiplied, 기본 색과 주고받는 색은 straight alpha다. 합성 texture도 premultiplied로 저장되므로 sampling 경계에서 되돌린다. fill alpha -1.0은 색이 아니라 hole 표식이고, circle의 음수 fill alpha는 fill 없음을 뜻한다.
- 나눗셈 하한 계약: 알파 되돌림과 선분·교차 계산은 1e-6, 안티에일리어싱 폭은 0.0001, texture 크기와 경계 크기는 각각 1과 1e-6을 하한으로 두어 0 나눗셈으로 결과가 무한이 되는 것을 막는다.
- define 조합 제약: 직접 평가에는 USE_TERRAIN_DECAL과 종류별 USE_PATH_DECAL·USE_AREA_DECAL·USE_CIRCLE_DECAL이 필요하고, 합성 결과 sampling에는 USE_TERRAIN_DECAL_COMPOSITE가 필요하다. 둘 중 하나만 켜면 두 경로는 상호 배타이므로 전환할 때 이전 define을 남기지 않아야 한다. USE_TERRAIN_DECAL_HYBRID는 두 경로를 함께 쓰는 유일한 조합이며 합성 texture 선언이 필요하므로 USE_TERRAIN_DECAL_COMPOSITE와 직접 평가 define을 함께 켜야 한다. 이때 direct 대상 필터가 packed batch 순번이 음수인 Feature만 직접 평가하므로 정적 대상이 합성 결과와 직접 평가에서 두 번 그려지지 않는다. USE_TERRAIN_DECAL_COMPOSITION_BATCH와 USE_TERRAIN_DECAL_COMPOSITE_RASTER는 offscreen 합성 실행에서만 정의한다.
- 주입 앵커 제약: 두 주입 함수는 `void main() {`, `#include <worldpos_vertex>`, `#include <map_fragment>`가 원본 셰이더에 있다고 전제하며, 조각이 main을 다시 여는 형태이므로 원문의 중괄호 짝을 바꾸지 않는다. replaceFragmentShader를 재질 주입 대신 독립 셰이더의 앞부분으로 재사용하는 쪽은 본문과 닫는 중괄호를 직접 이어 붙여야 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
