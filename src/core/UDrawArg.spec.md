# UDrawArg 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UDrawArg`는 앱, 렌더링 scene, camera, frustum, terrain tile cache와 모델 tile cache를 묶어 3D 화면 표출 과정에서 공유하는 실행 인자 객체다.

이 문서는 현재 구현에서 확인한 terrain tile 조회와 terrain height 조회 동작을 중심으로 기록한다.

### 1.2 책임 범위

`UDrawArg`는 world 좌표와 level을 terrain tile cache key로 변환하고, 현재 앱의 최대 level 또는 호출자가 지정한 level에서 시작해 사용 가능한 terrain tile을 찾는다.

`UDrawArg`는 terrain tile의 height sampling 결과를 render height로 반환하고, meter 단위 height가 필요하면 Google 좌표의 실제 scale을 적용한다.

책임 경계: tile geometry 내부의 bilinear height 계산은 `U3dQuadTile`이 담당한다.

### 1.3 주요 동작 방식

단일 height 조회는 필요 시 근접 좌표 캐시를 먼저 확인한 뒤, 현재 앱의 최대 terrain level부터 부모 tile 방향으로 cache를 찾는다. 찾은 tile에서 유효한 height를 얻지 못하면 실제 tile level보다 한 단계 낮은 level부터 다시 탐색한다.

배열 height 조회는 한 번의 batch query 안에서 직전 tile cursor와 마지막 성공 level을 재사용하여 매 point마다 최고 LOD부터 다시 찾는 비용을 줄인다.

### 1.4 주요 사용처와 연계 대상

`getRenderHeightAtPoint`는 `U3dApp.getRenderHeightAtPoint`, frustum helper, 분석 기능, road geometry, model layer, vector layer, walk controls 등 terrain 기준 z 값을 필요로 하는 여러 호출부에서 사용된다.

`getMaxLevelTileFromWorld`는 `U3dLodComponentLayer`와 `U3dVectorLayer`에서 위치에 맞는 terrain tile 조회에 사용된다.

`getLevelTileFromWorld`는 `U3dModelLayer.setTileFromEditedModel`에서 특정 level 이하의 tile 재탐색에 사용된다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
terrain tile lookup은 cache에 없는 tile을 생성하지 않고 기존 `_cacheTiles` 항목만 반환해야 한다.
render height 조회는 유효한 height를 찾지 못하면 `UDEF.TERRAIN_NO_DATA`를 반환해야 한다.
meter height 조회는 유효한 render height에만 `UMathEngine.getRealScaleAtGoogle(y)` 결과를 곱해야 한다.
근접 좌표 height cache는 `useCache`, `readCache` 또는 `writeCache` 옵션으로 명시된 경우에만 읽거나 써야 한다.
배열 render height 조회는 입력 point 순서를 보존한 height 배열을 반환해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: `getRenderHeightAtPoint`는 terrain 기준 z 값이 필요한 렌더링, 분석, geometry 생성 경로에서 반복 호출된다.
우선순위: batch 조회에서는 직전 tile cursor와 마지막 성공 level을 재사용해 반복 tile lookup을 줄인다.
제한 조건: fast tile lookup은 level마다 `UMathEngine.MetersToTile`을 반복 호출하지 않고 시작 level의 tile index에서 부모 index를 정수 산술로 계산한다.
```

## 3. 정규 자연어 수도코드

```spec
UDrawArg 클래스 정의

    _cacheTiles: UCache = 새 UCache
        업데이트되어 작업이 완료된 terrain quad tile 저장소

    _quantizedHeightCache: Map<number, UDrawArgQuantizedHeightCacheItem> = 빈 Map
        근접 좌표 render height 재사용 저장소

    constructor(app, scene, sceneComment, camera, frustum, grRect)
        인터페이스:
            렌더링과 terrain 조회에 필요한 앱 및 scene 참조를 보관한다.
            app: 앱 인스턴스
            scene: 렌더링 대상 scene
            sceneComment: comment 표시용 scene
            camera: 렌더링 camera
            frustum: 가시 영역 판정 객체
            grRect: 렌더링 기준 Google rectangle
            오류: app, scene 또는 grRect가 없으면 `__GError__`를 호출하고 초기화를 중단한다.

        동작:
            app이 없으면 생성 실패 오류를 기록하고 종료한다.
            scene이 없으면 생성 실패 오류를 기록하고 종료한다.
            grRect가 없으면 생성 실패 오류를 기록하고 종료한다.
            `_app`, `_renderer`, `_camera`, `_scene`, `_sceneComment`, `_frustum`, `_grRectangle`을 저장한다.

    dispose() -> void
        인터페이스:
            `UDrawArg`가 보관한 app, scene, camera, frustum과 cache 참조를 해제한다.
            부수 효과: terrain tile cache, model tile cache와 quantized height cache가 비워진다.

        동작:
            앱 및 렌더링 관련 참조를 `undefined`로 바꾼다.
            `_cacheTiles`와 `_cacheModelTiles`를 비운다.
            `_quantizedHeightCache`를 비운다.

    getTileFromWorld(worldInX: number, worldInY: number, level: number) -> U3dQuadTile | undefined
        인터페이스:
            world 좌표와 level에 해당하는 terrain tile을 cache에서 조회한다.

        동작:
            `UMathEngine.MetersToTile(worldInX, worldInY, level)`로 tile index를 계산한다.
            `_cacheTiles.createKey(tileIndex.x, tileIndex.y, level)`로 cache key를 만든다.
            `_cacheTiles.get(key)` 결과를 반환한다.

    getMaxLevelTileFromWorld(worldInX: number, worldInY: number, limitLevel: number = 5) -> U3dQuadTile | undefined
        인터페이스:
            app의 최대 level부터 지정한 최소 level까지 내려가며 world 좌표에 해당하는 terrain tile을 조회한다.

        동작:
            `_getMaxLevelTileFromWorldFaster(worldInX, worldInY, this._app._maxlevel, limitLevel)`를 호출한다.
            fast lookup 결과가 있으면 `tile`을 반환한다.
            fast lookup 결과가 없으면 `undefined`를 반환한다.

    getLevelTileFromWorld(worldInX: number, worldIny: number, level: number) -> U3dQuadTile | undefined
        인터페이스:
            호출자가 전달한 level부터 기본 최소 level까지 내려가며 world 좌표에 해당하는 terrain tile을 조회한다.

        동작:
            `_getMaxLevelTileFromWorldFaster(worldInX, worldIny, level)`를 호출한다.
            fast lookup 결과가 있으면 `tile`을 반환한다.
            fast lookup 결과가 없으면 `undefined`를 반환한다.

    #createHeightQuery() -> UDrawArgRenderHeightQuery
        인터페이스:
            배열 render height 조회에서 공유할 임시 query 상태를 만든다.

        동작:
            `tileCursor`, `lastSuccessfulLevel`, `cacheWriteCount`를 가진 query 객체를 반환한다.

    #getQuantizedHeightCacheKey(x: number, y: number) -> number
        인터페이스:
            근접한 Google 좌표를 같은 height cache key로 묶는다.

        동작:
            x와 y를 `HEIGHT_CACHE_GRID_SIZE`로 나눈 뒤 반올림한다.
            각 축 값에 `HEIGHT_CACHE_KEY_OFFSET`을 더한다.
            `qx * HEIGHT_CACHE_KEY_STRIDE + qy`를 반환한다.

    #getQuantizedHeightCache(x: number, y: number) -> UDrawArgQuantizedHeightCacheItem | undefined
        인터페이스:
            근접 좌표 height cache에서 유효한 z 값을 가진 항목을 조회한다.

        동작:
            `#getQuantizedHeightCacheKey(x, y)`로 cache key를 만든다.
            `_quantizedHeightCache`에서 항목을 조회한다.
            항목의 `z`가 `_isValidHeight`를 통과하면 항목을 반환한다.
            그 외에는 `undefined`를 반환한다.

    #setQuantizedHeightCache(x: number, y: number, z: number, level: number, tileKey?: string) -> void
        인터페이스:
            유효한 render height를 근접 좌표 cache에 저장한다.
            부수 효과: cache 크기가 기준 이상이면 오래된 항목 일부가 삭제될 수 있다.

        동작:
            z가 유효하지 않거나 level이 유한한 숫자가 아니면 종료한다.
            `_quantizedHeightCache.size`가 `HEIGHT_CACHE_MAX_SIZE` 이상이면 `#trimQuantizedHeightCache()`를 호출한다.
            좌표 cache key에 `{ z, level, tileKey }`를 저장한다.

    #setQuantizedHeightCacheForQuery(x: number, y: number, z: number, level: number, tileKey, query, cacheOptions) -> void
        인터페이스:
            cache 옵션과 batch write 제한을 적용해 근접 좌표 height cache에 저장한다.

        동작:
            `cacheOptions.writeCache`가 아니면 종료한다.
            query가 있고 `query.cacheWriteCount`가 `cacheOptions.maxCacheWritesPerBatch` 이상이면 종료한다.
            `#setQuantizedHeightCache(x, y, z, level, tileKey)`를 호출한다.
            query가 있으면 `query.cacheWriteCount`를 1 증가시킨다.

    #trimQuantizedHeightCache() -> void
        인터페이스:
            height cache가 가득 찼을 때 오래된 항목을 한 번에 일부 제거한다.

        동작:
            `_quantizedHeightCache.keys()`를 순회한다.
            순회한 key를 삭제한다.
            삭제 수가 `HEIGHT_CACHE_TRIM_SIZE`에 도달하면 중단한다.

    #removeQuantizedHeightCacheByTileKey(tileKey: string) -> void
        인터페이스:
            제거되는 terrain tile에서 추출된 height cache 항목을 함께 제거한다.

        동작:
            tileKey가 정의되지 않았으면 종료한다.
            `_quantizedHeightCache`를 순회한다.
            항목의 `tileKey`가 입력 tileKey와 같으면 해당 cache 항목을 삭제한다.

    getHeightAtPoint(x: number, y: number, options = {}) -> number
        인터페이스:
            Google 좌표의 terrain height를 meter 단위로 반환한다.

        동작:
            `getRenderHeightAtPoint(x, y, options)`로 render height를 조회한다.
            render height가 유효하지 않으면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            `UMathEngine.getRealScaleAtGoogle(y)`로 meter scale을 구한다.
            `renderHeight * meterScale`을 반환한다.

    getRenderHeightAtPoint(x, y?: number, options = {}) -> number | Array<number>
        인터페이스:
            단일 Google 좌표 또는 `{ x, y }` point 배열의 terrain render height를 반환한다.
            options.useCache: true이면 cache read와 write를 모두 허용한다.
            options.readCache: true이면 cache read를 허용한다.
            options.writeCache: true이면 cache write를 허용한다.
            options.maxCacheWritesPerBatch: batch 조회 중 cache write 허용 횟수

        동작:
            `getRenderHeightCacheOptions(options)`로 cache 옵션을 정규화한다.
            x가 배열이고 y가 정의되지 않았으면 batch 조회를 수행한다.
                `#createHeightQuery()`로 query를 만든다.
                입력 point 배열을 순서대로 순회한다.
                각 point를 `#getRenderHeightAtPointWithQuery(point.x, point.y, query, cacheOptions)`로 조회해 결과 배열에 저장한다.
                결과 배열을 반환한다.
            cache read가 허용되면 `#getQuantizedHeightCache(x, y)`를 조회한다.
            cache 항목이 있으면 `cachedHeight.z`를 반환한다.
            `_getMaxLevelTileFromWorldFaster(x, y, this._app._maxlevel)`로 tile 조회를 시작한다.
            tile이 있고 `tile.getRealLevel()` 결과가 8보다 큰 동안 반복한다.
                `tile.getHeightAtPoint(x, y)`로 render height를 조회한다.
                height가 유효하면 cache 옵션에 따라 `#setQuantizedHeightCacheForQuery`를 호출하고 반복을 중단한다.
                현재 실제 level보다 한 단계 낮은 level로 `_getMaxLevelTileFromWorldFaster`를 다시 호출한다.
            마지막 value가 null 또는 undefined이면 `UDEF.TERRAIN_NO_DATA`를 반환한다.
            그 외에는 value를 반환한다.

    #getRenderHeightAtPointWithQuery(x: number, y: number, query, cacheOptions) -> number
        인터페이스:
            batch 조회에서 query 상태를 재사용해 단일 point의 render height를 계산한다.

        동작:
            cache read가 허용되면 `#getQuantizedHeightCache(x, y)`를 조회한다.
            cache 항목이 있으면 `cachedHeight.z`를 반환한다.
            app의 `_maxlevel`, 기본 최소 level 5, `query.lastSuccessfulLevel`로 시작 level을 정한다.
            마지막 성공 level이 있으면 한 단계 높은 level의 tile을 먼저 확인한다.
                tile이 있고 height가 유효하면 query cursor와 마지막 성공 level을 갱신하고 height를 반환한다.
            시작 level부터 최소 level까지 반복한다.
                `#getRenderHeightTileAtLevel(x, y, level, minLevel, query)`로 tile을 조회한다.
                tile 또는 tile level이 없으면 반복을 중단한다.
                tile height가 유효하면 query cursor와 마지막 성공 level을 갱신하고 height를 반환한다.
                실패하면 현재 tile level보다 한 단계 낮은 level로 계속한다.
            `UDEF.TERRAIN_NO_DATA`를 반환한다.

    #getRenderHeightTileAtLevel(x: number, y: number, level: number, minLevel: number, query)
        인터페이스:
            지정한 level 범위에서 render height 조회에 사용할 tile과 실제 level을 찾는다.

        동작:
            `_getMaxLevelTileFromWorldFaster(x, y, level, minLevel, query)`에 위임한다.

_getMaxLevelTileFromWorld(worldInX: number, worldIny: number, level: number, maxLevel: number = 5) -> U3dQuadTile | undefined
    인터페이스:
        지정한 level부터 최소 level까지 `getTileFromWorld`로 순차 조회한다.

    동작:
        level이 maxLevel 이상인 동안 반복한다.
            `getTileFromWorld(worldInX, worldIny, level)`을 호출한다.
            tile이 있으면 tile을 반환한다.
            level을 1 낮춘다.
        찾지 못하면 `undefined`를 반환한다.

_getMaxLevelTileFromWorldFaster(worldInX: number, worldInY: number, level: number, minLevel: number = 5, query) -> object | undefined
    인터페이스:
        cursor 재사용과 부모 index 산술 탐색으로 world 좌표가 포함된 terrain tile을 찾는다.

    동작:
        level과 minLevel을 유한한 정수로 정규화한다.
        `_cacheTiles`가 없거나 시작 level이 최소 level보다 낮으면 `undefined`를 반환한다.
        `_getTileFromRenderHeightQueryCursor(worldInX, worldInY, startLevel, query)`를 호출한다.
        cursor tile을 재사용할 수 있으면 `{ tile, level, tileKey }`를 반환한다.
        `_findTerrainTileByParentWalk(worldInX, worldInY, startLevel, endLevel)` 결과를 반환한다.

_findTerrainTileByParentWalk(worldInX: number, worldInY: number, startLevel: number, endLevel: number) -> object | undefined
    인터페이스:
        시작 level의 tile index에서 부모 tile index를 따라가며 cache tile을 찾는다.

    동작:
        `UMathEngine.MetersToTile(worldInX, worldInY, startLevel)`을 한 번 호출한다.
        시작 tile index를 현재 x, y로 둔다.
        currentLevel을 startLevel부터 endLevel까지 낮추며 반복한다.
            현재 x, y, currentLevel로 cache key를 만든다.
            `_cacheTiles.get(key)`로 tile을 조회한다.
            tile이 있고 disposed 상태가 아니면 `{ tile, level, tileKey }`를 반환한다.
            x와 y를 각각 `Math.floor(value / 2)`로 바꿔 부모 tile index로 이동한다.
        찾지 못하면 `undefined`를 반환한다.

_getTileFromRenderHeightQueryCursor(x: number, y: number, level: number, query) -> U3dQuadTile | undefined
    인터페이스:
        batch query의 직전 tile이 현재 좌표에도 재사용 가능한지 검사한다.

    동작:
        query의 `tileCursor`에서 tile과 level을 읽는다.
        tile이 없거나 cursor level이 입력 level과 다르면 `undefined`를 반환한다.
        tile의 `_rectangle3d.ptLeftBottom`과 `_rectangle3d.ptRightTop`이 있으면 해당 범위에 좌표가 포함되는지 확인한다.
        rectangle 정보가 없으면 tile의 `_minx`, `_maxx`, `_miny`, `_maxy`가 모두 유한한지 확인한다.
        확인한 범위에 x, y가 포함되면 tile을 반환한다.
        그 외에는 `undefined`를 반환한다.

_isValidHeight(height) -> boolean
    인터페이스:
        height 값이 terrain no-data 값이 아닌 유효한 값인지 판정한다.

    동작:
        height가 정의되어 있고 `UDEF.TERRAIN_NO_DATA`와 `UDEF.INVALID`가 아니면 true를 반환한다.
        그 외에는 false를 반환한다.

getRenderHeightCacheOptions(options = {}) -> object
    인터페이스:
        render height cache 옵션을 read/write 플래그와 batch write 제한으로 정규화한다.

    동작:
        `options.useCache === true`이면 read와 write를 모두 허용한다.
        `options.readCache === true`이면 read를 허용한다.
        `options.writeCache === true`이면 write를 허용한다.
        `options.maxCacheWritesPerBatch`가 유한한 숫자이면 0 이상 정수로 제한한다.
        batch write 제한이 없으면 `Infinity`를 사용한다.
```

## 4. 공통 계약과 제약

```spec
`getMaxLevelTileFromWorld`와 `getLevelTileFromWorld`는 query 없이 `_getMaxLevelTileFromWorldFaster`를 호출하므로 parent-walk cache 조회에서 `tile.isDisposed()`가 true인 tile을 반환하지 않는다.
근접 좌표 height cache는 tile 객체를 직접 저장하지 않고 `z`, `level`, `tileKey`만 저장한다.
batch query의 `tileCursor`는 같은 batch 조회 안에서만 재사용된다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
