# U3dQuadTile 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dQuadTile`은 terrain quadtree의 개별 tile을 표현하며, tile geometry에 로드된 height grid에서 Google 좌표에 해당하는 render height를 조회한다.

이 문서는 현재 구현에서 확인한 height sampling 관련 동작을 중심으로 기록한다.

### 1.2 책임 범위

`U3dQuadTile`은 자신의 geometry position buffer, row width, tile rectangle을 사용해 좌표를 tile 내부 grid 좌표로 변환하고 bilinear interpolation으로 z 값을 계산한다.

책임 경계: world 좌표에 해당하는 tile을 cache에서 찾고 여러 LOD fallback을 수행하는 책임은 `UDrawArg`에 있다.

### 1.3 주요 동작 방식

현재 height 조회의 실제 경로는 `getHeightAtPoint`이다. 이 함수는 height data와 geometry 정보를 확인한 뒤 64x64 height grid에서 주변 네 정점의 z 값을 읽고, X축 보간과 Y축 보간을 차례로 수행한다.

`getHeightAtPointPrev`는 이전 sampling 방식을 보존한 비교용 함수로 남아 있으며 현재 `getHeightAtPoint`가 호출하지 않는다.

### 1.4 주요 사용처와 연계 대상

`UDrawArg.getRenderHeightAtPoint`는 조회한 terrain tile의 `getHeightAtPoint`를 호출해 render height를 얻는다.

`UDrawArg`의 height fallback 경로는 `U3dQuadTile.getRealLevel`, `U3dQuadTile.isDisposed`, `U3dQuadTile._rectangle3d`와 함께 동작한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
height data가 로드되지 않았으면 height 조회는 `UDEF.TERRAIN_NO_DATA`를 반환해야 한다.
geometry position buffer, row width 또는 tile rectangle이 유효하지 않으면 `getHeightAtPoint`는 `UDEF.TERRAIN_NO_DATA`를 반환해야 한다.
`getHeightAtPoint`는 Google 좌표를 tile rectangle 기준의 grid 좌표로 변환한 뒤 네 grid point의 z 값을 bilinear interpolation으로 섞어야 한다.
grid index는 height grid 범위인 `0` 이상 `width - 1` 이하로 제한되어야 한다.
보간 비율은 `0` 이상 `1` 이하로 제한되어야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: `getHeightAtPoint`는 terrain height 조회 경로에서 반복 호출된다.
우선순위: geometry, position buffer, row width와 rectangle 참조를 지역 변수로 읽어 반복 property lookup을 줄인다.
제한 조건: `getHeightAtPoint`는 helper 함수 `mix()`를 호출하지 않고 inline lerp 식으로 보간한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dQuadTile extends U3dObject 클래스 정의

    checkHeightLoaded() -> boolean
        인터페이스:
            tile height data 로드 여부를 반환한다.

        동작:
            `isHeightLoaded()` 결과를 반환한다.

    getHeightAtPointPrev(x: number, y: number) -> number
        인터페이스:
            이전 방식으로 tile geometry에서 Google 좌표에 해당하는 z 값을 계산한다.
            반환: 구글 스케일이 적용된 z 값 또는 `UDEF.TERRAIN_NO_DATA`

        동작:
            `isHeightLoaded()`가 false이면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            height grid width를 64로 둔다.
            `_rectangle3d.ptLeftBottom`과 `_rectangle3d.ptRightTop`에서 minx, miny, maxx, maxy를 읽는다.
            Google 좌표를 tile 내부 grid 절대 좌표인 indexX와 indexY로 변환한다.
            `Math.floor`와 `Math.ceil` 결과를 `THREE.MathUtils.clamp`로 grid 범위에 제한한다.
            `getHeightByXY`로 A, B, C, D 네 grid point의 z 값을 읽는다.
            `mix(B, C, indexX)`로 위쪽 행을 보간한다.
            `mix(A, D, indexX)`로 아래쪽 행을 보간한다.
            `mix(bottomMixValue, topMixValue, indexY)` 결과를 반환한다.

    getHeightAtPoint(x: number, y: number) -> number
        인터페이스:
            tile geometry의 position buffer에서 Google 좌표에 해당하는 render height z 값을 bilinear interpolation으로 계산한다.
            반환: 구글 스케일이 적용된 z 값 또는 `UDEF.TERRAIN_NO_DATA`

        동작:
            `isHeightLoaded()`가 false이면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            `_mesh.geometry`, `geometry.attributes.position.array`, `geometry._uwidth`, `_rectangle3d`를 지역 변수로 읽는다.
            position buffer, row width 또는 rectangle이 없으면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            height grid width를 64로 둔다.
            rectangle에서 minx, miny, maxx, maxy를 읽는다.
            rectangle 너비와 높이의 역수를 계산한다.
            너비 또는 높이 역수가 유한하지 않으면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            Google 좌표를 tile 내부 grid 절대 좌표로 변환한다.
                indexX는 `(x - minx) * invWidth * width`이다.
                indexY는 `(maxy - y) * invHeight * width`이다.
            indexX와 indexY의 정수부를 `Math.floor`로 구한다.
            정수부와 정수부 + 1을 각각 `clampHeightGridIndex`로 grid 범위에 제한해 네 grid index를 만든다.
            indexX와 indexY의 소수부를 `clampHeightMix`로 보간 비율에 제한한다.
            `getHeightByGrid(positionArray, rowWidth, minIndexX, maxIndexY)`로 A 값을 읽는다.
            `getHeightByGrid(positionArray, rowWidth, minIndexX, minIndexY)`로 B 값을 읽는다.
            `getHeightByGrid(positionArray, rowWidth, maxIndexX, minIndexY)`로 C 값을 읽는다.
            `getHeightByGrid(positionArray, rowWidth, maxIndexX, maxIndexY)`로 D 값을 읽는다.
            B에서 C로 X축 보간해 위쪽 행 값을 계산한다.
            A에서 D로 X축 보간해 아래쪽 행 값을 계산한다.
            위쪽 행 값에서 아래쪽 행 값으로 Y축 보간한 값을 반환한다.

    isDisposed() -> boolean
        인터페이스:
            tile disposed 상태를 반환한다.

        동작:
            `_disposed` 값을 반환한다.

getHeightByGrid(positionArray, rowWidth, x: number, y: number) -> number
    인터페이스:
        평평한 position buffer에서 grid 좌표에 해당하는 정점의 z 값을 반환한다.
        positionArray: `[x0, y0, z0, x1, y1, z1, ...]` 형태의 geometry position buffer
        rowWidth: 한 행의 정점 개수
        x: grid column index
        y: grid row index

    동작:
        `(((y + 1) * rowWidth) + (x + 1)) * 3`으로 정점 buffer index를 계산한다.
        position buffer의 z component인 `positionArray[idx + 2]`를 반환한다.

clampHeightGridIndex(value: number, width: number) -> number
    인터페이스:
        height grid index를 유효 범위로 제한한다.

    동작:
        value를 0 이상으로 제한한다.
        결과를 `width - 1` 이하로 제한해 반환한다.

clampHeightMix(value: number) -> number
    인터페이스:
        보간 비율을 0 이상 1 이하로 제한한다.

    동작:
        value를 0 이상으로 제한한다.
        결과를 1 이하로 제한해 반환한다.
```

## 4. 공통 계약과 제약

```spec
`getHeightAtPoint`의 `width`는 height grid 해상도이고 현재 구현에서 64로 고정되어 있다.
`geometry._uwidth`는 position buffer의 행 너비이며 skirt를 포함할 수 있다.
`getHeightByGrid`는 skirt를 제외한 terrain grid 영역을 참조하기 위해 x와 y에 각각 1을 더해 position buffer index를 계산한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
