# UHeightUtil 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UHeightUtil`은 지형 지오메트리의 사용자 편집 영역 반영, 메시 표면 높이 조회, 수치 선형 보간과 부모 고도 타일의 사분면별 자식 데이터 생성을 제공하는 정적 유틸리티다.

### 1.2 책임 범위

- 커스텀 지형의 평탄 영역과 경사 영역을 타일 지오메트리 정점에 반영한다.
- 하나의 공유 레이캐스터로 입력 XY 위치에서 메시와 교차하는 Z 값을 조회한다.
- 두 수치 또는 두 2차원 점을 선형 보간한다.
- `NaN`과 지정된 `noData` 값을 판별하고, 부모 고도 데이터의 사분면을 자식 타일 크기로 재표본화한다.
- 타일 좌표를 정점 인덱스로 변환하고 JSTS 도형을 생성하는 내부 계산을 담당한다.
- 책임 경계: 원본 고도 데이터의 다운로드·해석·캐시와 생성된 지오메트리의 소유·처분은 호출자가 담당한다.

### 1.3 주요 동작 방식

커스텀 지형 편집에서는 타일의 바운딩 박스와 정점 배열을 기준으로 후보 인덱스 범위를 구한 뒤, 각 정점을 JSTS 점으로 변환하여 평탄 또는 경사 편집 영역 포함 여부를 판정한다. 높이 조회에서는 입력 위치를 복제해 수직 레이를 구성하고 메시의 `raycast()` 결과에서 Z 값을 반환한다. 부모 고도 재표본화에서는 선택한 사분면의 각 원본 표본을 자식 배열의 2 x 2 블록 기준점에 배치하고, 수평·수직·대각 이웃과의 중간값을 나머지 칸에 기록한다.

### 1.4 주요 사용처와 연계 대상

- `U3dHeightLayer`는 `createHeightData()`로 부모 타일의 고도를 자식 타일 데이터로 만들고, `isNoDataValue()`로 원시 고도 표본을 판별하며, `updateGeometryWidthBox()`로 커스텀 지형 편집을 적용한다.
- `UHeightFilter`는 `getOriginZ()`로 분석 메시의 표면 높이를 조회한다.
- `UDrawArg`는 커스텀 지형 편집의 영역, 높이와 경사 계산 정보를 제공한다.
- `U3dQuadTile`은 실제 축척, 타일 레벨과 중심 Y 등 지형 편집에 필요한 타일 상태를 제공한다.

## 3. 정규 자연어 수도코드

```spec
UHeightUtil 모듈 정의
    DEFAULT_H: number = 99999
        getZ()의 하향 레이 시작 Z 값

    DEFAULT_H_MINUS: number = -99999
        getZ()의 상향 레이 시작 Z 값

    UHeightUtil 클래스 정의
        static raycaster: URaycaster = 새 URaycaster
            모든 높이 조회 호출이 재사용하는 단일 정적 레이캐스터
            의존:
                URaycaster — 메시 표면 교차 검사에 사용할 레이 생성; 생성자: {new URaycaster()}

        static updateGeometryWidthBox(geometry: UPlaneBufferGeometry, customLand: UDrawArg, skirt: boolean | undefined, tile: U3dQuadTile) -> boolean | undefined
            역할: 커스텀 지형의 평탄·경사 편집 영역을 타일 지오메트리 정점 높이에 반영한다.
            인터페이스:
                반환: 필수 입력이 없으면 undefined, 평탄 영역 정점을 처리했거나 경사 영역에서 현재 높이와 계산 높이가 달랐으면 true, 그렇지 않으면 false
            처리 기준:
                skirt가 정의되지 않으면 false로 처리한다.
                geometry에 boundingBox가 없으면 현재 정점으로 계산한다.
                geometry가 getOffset()을 제공하고 그 결과가 truthy이면 해당 오프셋을 사용하고, 아니면 각 축이 0인 오프셋을 사용한다.
                geometry가 getOffsetBox()를 제공하면 반환 박스를 인덱스 계산 범위로 사용하고, 아니면 boundingBox를 사용한다.
                타일 레벨이 15보다 크면 편집 도형의 안쪽 buffer 간격을 0으로 사용한다.
                경사 편집이 활성화되면 후보 정점 범위는 평탄 영역이 아니라 경사 영역 박스로 다시 계산한다.
            의존:
                defined — 필수 입력과 skirt 정의 여부 판정; 함수: {defined()}
                UMathEngine — Google 좌표의 실제 축척으로 편집 높이 환산; 정적 함수: {getRealScaleAtGoogle()}
                UPlaneBufferGeometry(geometry) — 정점·경계·오프셋 조회와 편집 범위 기록; 함수: {computeBoundingBox(), getOffset(), getOffsetBox(), setCustomBox()}; 속성 읽기: {attributes.position, boundingBox}
                UDrawArg(customLand) — 평탄·경사 편집 정보와 경사 높이 계산; 함수: {getBox(), getInclineEdit(), getInclineBox(), getHeight(), getInclineZValue()}; 속성 읽기: {id}
                U3dQuadTile(tile) — 타일 축척·레벨·중심 위치 조회; 함수: {getScale()}; 속성 읽기: {_rlevel, _centerY}
                __GEONDT__.jsts — 포함 판정용 GeometryFactory 생성; 생성자: {geom.GeometryFactory}
                JSTS Geometry — 편집 경계 축소와 점 포함 여부 판정; 함수: {buffer(), contains()}
            동작:
                geometry, customLand 또는 tile이 정의되지 않으면 undefined를 반환한다.
                customLand에서 평탄 영역과 경사 편집 여부를 읽고, 경사 편집이면 경사 영역도 읽는다.
                geometry의 경계 박스, 좌표 오프셋과 인덱스 계산용 박스를 준비한다.
                tile._centerY의 실제 축척 역수를 customLand 높이에 곱해 적용 높이를 계산하고 tile의 축척을 읽는다.
                position 정점 수의 제곱근을 한 변의 정점 수로 사용하고, skirt이면 편집 계산 크기에서 2를 뺀다.
                tile._rlevel이 15 이하이면 레벨 값을 JSTS 음수 buffer 크기로 사용하고, 그보다 크면 0을 사용한다.
                평탄 영역 박스의 후보 정점 범위를 계산하고 평탄 영역 polygon을 만들어 안쪽으로 buffer한다.
                경사 편집이면 경사 영역 polygon을 같은 방식으로 만들고 후보 정점 범위를 경사 영역 박스 기준으로 교체한다.
                후보 범위의 최솟값은 0 이상, 최댓값은 skirt 여부에 따른 정점 범위 이하로 제한하고 geometry.setCustomBox()에 범위·높이·customLand.id를 기록한다.
                후보 범위를 행과 열 순서로 순회하면서 position 배열 인덱스를 구한다.
                각 정점의 X·Y·Z에 tile 축척을 곱하고 geometry 오프셋을 더한 좌표로 JSTS 점을 만든다.
                평탄 영역이 점을 포함하면 position 배열의 Z를 적용 높이로 바꾸고 편집 발생 상태를 true로 설정한다.
                평탄 영역 밖이고 경사 영역이 점을 포함하면 customLand.getInclineZValue()로 경사 Z를 계산한다.
                현재 position Z와 경사 Z가 같으면 해당 정점을 건너뛰고, 경사 Z가 적용 높이보다 크면 적용 높이로 제한한다.
                현재 position Z가 적용 높이보다 크면 절토 경로로 들어가 적용 높이와 경사 Z의 차이를 적용 높이 위로 대칭 이동한 제한 Z를 구하고, 현재 값이 제한 Z보다 클 때만 낮춘다.
                현재 position Z가 적용 높이 이하이면 성토 경로로 들어가 현재 값이 경사 Z보다 낮을 때만 높인다.
                경사 영역에서 동일 값으로 건너뛴 경우가 아니면 실제 배열 변경 여부와 관계없이 편집 발생 상태를 true로 설정한다.
                순회가 끝나면 편집 발생 상태를 반환한다. [확인 Q-001]

        static getOriginZ(pos: THREE.Vector3, mesh: THREE.Object3D) -> number
            역할: 입력 XY에서 Z = -10부터 위쪽으로 메시를 검사하여 가장 가까운 교차점 높이를 조회한다.
            의존:
                THREE.Vector3 — 상향 레이 방향 생성; 생성자: {new THREE.Vector3()}
                URaycaster(raycaster) — 레이 원점과 방향 설정; 함수: {set()}
                THREE.Object3D(mesh) — 레이 교차 결과 수집; 함수: {raycast()}
            동작:
                pos를 복제하고 복제 좌표의 Z를 -10으로 바꾼다.
                공유 raycaster를 복제 좌표에서 양의 Z 방향으로 설정한다.
                mesh.raycast()가 채운 결과를 distance 오름차순으로 정렬한다.
                교차 결과가 있으면 첫 결과의 point.z를 반환하고, 없으면 -9999를 반환한다. [확인 Q-002]

        static getZ(pos: THREE.Vector3, mesh: THREE.Object3D) -> number
            역할: 입력 XY의 위쪽에서 아래 방향을 먼저 검사하고 실패하면 아래쪽에서 위 방향을 검사하여 메시 교차점 높이를 조회한다.
            의존:
                THREE.Vector3 — 하향·상향 레이 방향 생성; 생성자: {new THREE.Vector3()}
                URaycaster(raycaster) — 레이 원점과 방향 설정; 함수: {set()}
                THREE.Object3D(mesh) — 레이 교차 결과 수집; 함수: {raycast()}
            동작:
                pos를 복제하고 Z를 DEFAULT_H로 바꾼 뒤 공유 raycaster를 음의 Z 방향으로 설정한다.
                mesh.raycast() 결과가 있으면 별도 정렬 없이 첫 결과의 point.z를 반환한다.
                결과가 없으면 같은 복제 좌표의 Z를 DEFAULT_H_MINUS로 바꾸고 양의 Z 방향으로 다시 검사한다.
                두 번째 결과가 있으면 별도 정렬 없이 첫 결과의 point.z를 반환하고, 두 방향 모두 결과가 없으면 0을 반환한다. [확인 Q-002]

        static lerp(a: number, b: number, x: number) -> number
            역할: 두 수치 사이의 선형 보간값을 계산한다.
            동작: a + x * (b - a)를 반환한다.

        static interpolation(x1: number, y1: number, x2: number, y2: number, interpolate: number) -> [number, number]
            역할: 두 2차원 점의 X와 Y를 같은 비율로 선형 보간한다.
            동작:
                x1과 x2, y1과 y2를 각각 interpolate 비율로 보간한다.
                계산한 X와 Y를 2개 원소 배열로 반환한다.

        static isNoDataValue(value: number, noData: number | undefined) -> boolean
            역할: 고도값이 NaN 또는 호출자가 지정한 noData 값인지 판정한다.
            의존:
                defined — noData 정의 여부 판정; 함수: {defined()}
                ECMAScript Number — NaN 판정; 정적 함수: {isNaN()}
            동작:
                value가 NaN이면 true를 반환한다.
                noData가 정의되어 있고 value와 noData가 엄격히 같으면 true를 반환한다.
                그 밖에는 false를 반환한다.

        static #subDivideSWTile(parentData: ArrayLike<number>, size: number, noData: number | undefined) -> Float32Array
            역할: 부모 데이터의 남서 사분면을 같은 size x size 크기의 자식 고도 배열로 재표본화한다.
            의존:
                Float32Array — 자식 고도 배열 생성; 생성자: {new Float32Array()}
            동작:
                size 제곱 길이의 Float32Array를 만든다.
                y와 x를 각각 0 이상 size / 2 미만으로 순회하여 기준값, 동쪽값, 북쪽값과 북동 대각값을 읽는다.
                각 부모 기준값을 자식 배열 2 x 2 블록의 남서 칸에 기록한다.
                동쪽·북쪽·북동 대각 이웃과의 보간값을 각각 남동·북서·북동 칸에 기록한다.
                완성한 자식 배열을 반환한다.

        static #subDivideSETile(parentData: ArrayLike<number>, size: number, noData: number | undefined) -> Float32Array
            역할: 부모 데이터의 남동 사분면을 같은 size x size 크기의 자식 고도 배열로 재표본화한다.
            의존:
                Float32Array — 자식 고도 배열 생성; 생성자: {new Float32Array()}
            동작:
                size 제곱 길이의 Float32Array를 만든다.
                y는 0 이상 size / 2 미만, x는 size / 2 이상 size 미만으로 순회하여 기준값, 서쪽값, 북쪽값과 북서 대각값을 읽는다.
                각 부모 기준값을 자식 배열 2 x 2 블록의 남동 칸에 기록한다.
                서쪽·북서 대각·북쪽 이웃과의 보간값을 각각 남서·북서·북동 칸에 기록한다.
                완성한 자식 배열을 반환한다.

        static #subDivideNWTile(parentData: ArrayLike<number>, size: number, noData: number | undefined) -> Float32Array
            역할: 부모 데이터의 북서 사분면을 같은 size x size 크기의 자식 고도 배열로 재표본화한다.
            의존:
                Float32Array — 자식 고도 배열 생성; 생성자: {new Float32Array()}
            동작:
                size 제곱 길이의 Float32Array를 만든다.
                y는 size / 2 이상 size 미만, x는 0 이상 size / 2 미만으로 순회하여 기준값, 동쪽값, 남쪽값과 남동 대각값을 읽는다.
                각 부모 기준값을 자식 배열 2 x 2 블록의 북서 칸에 기록한다.
                남쪽·남동 대각·동쪽 이웃과의 보간값을 각각 남서·남동·북동 칸에 기록한다.
                완성한 자식 배열을 반환한다.

        static #subDivideNETile(parentData: ArrayLike<number>, size: number, noData: number | undefined) -> Float32Array
            역할: 부모 데이터의 북동 사분면을 같은 size x size 크기의 자식 고도 배열로 재표본화한다.
            의존:
                Float32Array — 자식 고도 배열 생성; 생성자: {new Float32Array()}
            동작:
                size 제곱 길이의 Float32Array를 만든다.
                y와 x를 각각 size / 2 이상 size 미만으로 순회하여 기준값, 서쪽값, 남쪽값과 남서 대각값을 읽는다.
                각 부모 기준값을 자식 배열 2 x 2 블록의 북동 칸에 기록한다.
                남서 대각·남쪽·서쪽 이웃과의 보간값을 각각 남서·남동·북서 칸에 기록한다.
                완성한 자식 배열을 반환한다.

        static createHeightData(parentData: ArrayLike<number>, parentGeometry: UPlaneBufferGeometry, quadname: string, noData: number | undefined) -> Float32Array | undefined
            역할: 부모 고도 데이터에서 지정한 타일 사분면을 선택하여 자식 타일의 원시 고도 배열을 생성한다.
            인터페이스:
                반환: 필수 입력이 없거나 quadname이 지원하는 네 방향 상수와 일치하지 않으면 undefined, 그 밖에는 size x size Float32Array
            처리 기준:
                parentGeometry가 skirt를 사용하면 getSegmentCount()에서 2를 뺀 값을 size로 사용하고, 아니면 getSegmentCount()를 그대로 사용한다.
            의존:
                defined — 필수 입력 정의 여부 판정; 함수: {defined()}
                UPlaneBufferGeometry(parentGeometry) — skirt 여부와 부모 표본 크기 조회; 함수: {isSkirt(), getSegmentCount()}
                UDEF — 생성할 부모 사분면 판정; 상수: {TILE_QUADNAME.SOUTHWEST, TILE_QUADNAME.SOUTHEAST, TILE_QUADNAME.NORTHWEST, TILE_QUADNAME.NORTHEAST}
                __GInfo__ — 필수 입력 누락 정보 기록; 함수: {__GInfo__()}
            동작:
                parentData, parentGeometry 또는 quadname이 정의되지 않으면 식별 코드 7840800으로 누락 정보를 기록하고 undefined를 반환한다.
                parentGeometry의 skirt 여부와 segment 수로 재표본화 size를 계산한다.
                quadname이 SOUTHWEST, SOUTHEAST, NORTHWEST 또는 NORTHEAST이면 대응하는 사분면 분할 메서드에 parentData, size와 noData를 전달한다.
                지원하는 사분면과 일치하지 않으면 undefined를 반환하고, 일치하면 생성된 Float32Array를 반환한다. [확인 Q-003]

    getIndex(p: {x: number, y: number}, min: {x: number, y: number}, max: {x: number, y: number}, nx: number, ny: number) -> [number, number]
        역할: 평면 좌표를 주어진 X·Y 분할 수의 정수 인덱스로 변환한다.
        동작:
            X는 min.x에서 max.x로 증가하는 비율을, Y는 max.y에서 min.y로 내려가는 비율을 계산한다.
            각 비율에 nx 또는 ny를 곱하고 내림한 X·Y 인덱스를 반환한다.

    getIndexFromTile(point: {x: number, y: number}, min: {x: number, y: number}, max: {x: number, y: number}, size: number, skirt: boolean) -> [number, number]
        역할: 점을 포함하는 타일 정점 인덱스를 구하고 일부 외곽 범위를 skirt 정책에 맞춰 제한한다.
        동작:
            point를 size x size 분할 인덱스로 변환한다.
            X 인덱스가 skirt이면 1, 아니면 0인 시작값보다 작을 때 skirt이면 0, 아니면 시작값으로 바꾼다.
            Y 인덱스가 size보다 크면 skirt이면 size + 1, 아니면 size로 바꾼다.
            조정한 인덱스를 반환한다.

    getBoundIndexFromBox(box: {min: {x: number, y: number}, max: {x: number, y: number}}, min: {x: number, y: number}, max: {x: number, y: number}, size: number, skirt: boolean) -> {min: {x: number, y: number}, max: {x: number, y: number}}
        역할: 편집 박스의 두 모서리를 포함하는 정점 인덱스 경계를 계산한다.
        동작:
            box.min과 box.max를 각각 타일 정점 인덱스로 변환한다.
            두 결과의 축별 최솟값과 최댓값으로 min·max 인덱스 객체를 만들어 반환한다.

    getVertexIndex(x: number, y: number, size: number) -> number
        역할: size 너비의 정점 격자 좌표를 XYZ 연속 배열의 X 원소 인덱스로 변환한다.
        동작: ((y * size) + x) * 3을 반환한다.

    getJstsPolygon(coords: Array<{x: number, y: number, z?: number}>, factory: JSTS.GeometryFactory) -> JSTS.Polygon
        역할: 입력 좌표들을 닫힌 선형 링으로 구성하여 JSTS polygon을 생성한다.
        의존:
            JSTS.GeometryFactory(factory) — polygon 생성; 함수: {createPolygon()}
        동작:
            coords의 각 좌표를 JSTS Coordinate로 변환해 새 배열에 순서대로 추가한다.
            첫 좌표를 다시 변환하여 배열 끝에 추가하고 factory.createPolygon() 결과를 반환한다.

    getJstsPoint(coord: {x: number, y: number, z?: number}, factory: JSTS.GeometryFactory) -> JSTS.Point
        역할: 입력 좌표로 JSTS point를 생성한다.
        의존:
            JSTS.GeometryFactory(factory) — point 생성; 함수: {createPoint()}
        동작:
            coord를 JSTS Coordinate로 변환하고 factory.createPoint() 결과를 반환한다.

    getJstsCoord(vector: {x: number, y: number, z?: number}) -> JSTS.Coordinate
        역할: 벡터형 좌표를 JSTS Coordinate로 변환한다.
        의존:
            __UNION3D__.jsts — 2차원 또는 3차원 Coordinate 생성; 생성자: {geom.Coordinate}
        동작:
            vector.z가 undefined가 아니면 X·Y·Z로 Coordinate를 생성한다.
            아니면 X·Y만으로 Coordinate를 생성한다.
            생성한 Coordinate를 반환한다. [확인 Q-001]

    getZValue(data: ArrayLike<number>, size: number, x: number, y: number) -> number
        역할: 행 우선 고도 배열에서 지정한 격자 좌표의 값을 읽는다.
        동작: data[(size * y) + x]를 반환한다.

    interpolateHeightValue(target: number, next: number, noData: number | undefined) -> number
        역할: 기준 표본의 noData 영역을 보존하면서 기준값과 이웃값의 중간 고도를 계산한다.
        처리 기준:
            기준값이 noData이면 이웃값을 사용하지 않는다.
            이웃값만 noData이면 기준값을 유지한다.
        동작:
            UHeightUtil.isNoDataValue()로 target을 판정하고, noData이면 noData가 null 또는 undefined가 아닐 때 그 값을 반환하며 아니면 NaN을 반환한다.
            UHeightUtil.isNoDataValue()로 next를 판정하고, noData이면 target을 반환한다.
            두 값이 모두 유효하면 산술 평균을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
UHeightUtil은 인스턴스를 생성하지 않고 모든 공개 기능과 raycaster를 정적 상태로 제공한다.
높이 조회 함수는 입력 pos를 복제하므로 입력 벡터의 좌표를 변경하지 않지만, 하나의 정적 raycaster 상태를 호출 사이에 공유한다.
getOriginZ()와 getZ()는 mesh.raycast()를 직접 호출하며 하위 객체를 별도로 순회하지 않는다.
updateGeometryWidthBox()는 position 정점 수가 완전제곱이고 정점이 정사각 격자의 행 우선 XYZ 순서로 저장되었다고 가정한다.
updateGeometryWidthBox()는 position.needsUpdate, 노멀과 boundingBox를 갱신하지 않으며 호출자가 후속 지오메트리 갱신을 담당한다.
updateGeometryWidthBox()의 후보 범위 순회는 min과 max 인덱스를 모두 포함한다.
updateGeometryWidthBox()는 geometry.setCustomBox()를 정점 포함 여부 판정 전에 호출하므로 실제 정점 변경이 없어도 커스텀 박스 정보가 기록될 수 있다.
사분면 분할 함수는 size가 짝수이고 parentData가 size x size 행 우선 배열이라는 전제에서 2 x 2 자식 블록을 채운다. 입력 길이와 size의 정수·짝수 여부는 검사하지 않는다. [확인 Q-003]
사분면 분할의 보간값은 기준 표본과 한 이웃 표본의 산술 평균이며, 대각 칸도 네 표본의 이중 선형 보간이 아니라 기준 표본과 대각 이웃의 평균을 사용한다.
noData 판정은 NaN 또는 엄격한 값 일치만 사용하며, Infinity와 유효 범위 밖 수치는 noData로 처리하지 않는다.
부모 기준 표본이 noData이면 해당 기준점에서 파생되는 보간 칸도 noData로 유지하고, 이웃만 noData이면 기준값을 복제한다.
Array.matrix는 입력한 행·열 크기의 2차원 배열을 만들고 모든 칸에 같은 initial 값을 저장한다. 각 행은 서로 다른 배열 객체다.
Array.matrixSimple은 입력한 행 수만큼 서로 다른 빈 배열을 가진 2차원 배열을 만든다.
Array.matrix와 Array.matrixSimple은 UHeightUtil 모듈을 불러오는 즉시 전역 Array 생성자의 속성을 대입하며 기존 동명 속성이 있어도 덮어쓴다.
UHeightUtil의 함수들은 직접 호출한 외부 함수, 동적 입력 메서드, 전역 객체 또는 배열 접근에서 발생한 오류를 잡거나 이미 변경한 정점 상태를 되돌리지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
