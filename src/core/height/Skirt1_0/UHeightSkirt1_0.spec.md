# UHeightSkirt1_0 명세

> 상태: 구현 관찰 초안

## 1. 개요

`U3dApp.setMethodHeight()`가 1_0 모드에서 렌더 직전에 실행한다. 표시 후보 지형 타일의 네 방향 이웃을 찾아 경계 정점 높이를 맞추고, 완료된 이웃 관계와 같으면 정점 쓰기를 생략한다. 고도 자료의 다운로드·소유권·레이어 우선순위는 이 단위가 결정하지 않는다.

## 3. 정규 자연어 수도코드

```spec
UHeightSkirt1_0 클래스 정의
    static computeDynamicSkirt(app: U3dApp) -> void
        의존:
            U3dApp — 지형·고도 레이어와 프러스텀; 함수: {getTerrainLayer(), getInstanceHeightLayers()}; 속성 읽기: {_frustum}
            U3dQuadTile — 고도 준비와 완료 정보; 함수: {isHeightLoaded(), setSkirtInfo()}
            USkirtInfo — 타일 참조 해제; 함수: {clear()}
        동작:
            지형 레이어나 고도 레이어 목록이 없거나 고도 레이어 수가 0이면 종료한다.
            지형 그룹의 자식 목록이 없거나 비어 있으면 종료한다.
            자식 메시마다 고도 로드가 완료되고 지오메트리가 존재하며 프러스텀에 들어오는 타일만 처리한다.
            한 방향이라도 변경했으면 position attribute가 있을 때 needsUpdate를 켜고, 새 이웃 정보의 타일 참조를 해제한 뒤 타일에 완료 정보로 저장한다.

    static computeUpSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo) -> boolean
        의존:
            U3dQuadTile — 완료 정보와 메시 배율; 함수: {getSkirtInfo(), getScale()}
            USkirtInfo — 방향별 완료 비교와 작업 선택; 함수: {equalsNode(), getWorkType(), get()}; 상수: {DIRECTION.UP}
            UPlaneBufferGeometry — 정점 간격과 기본 높이; 함수: {getRatio(), getSkirtIndex(), getDefaultHeight()}
        동작:
            기존 완료 정보와 위쪽 작업이 같으면 false를 반환한다.
            작업 종류·이웃·정점 배열·간격과 자기·이웃 배율·기본 높이를 방향당 한 번 준비하고 위쪽 경계와 안쪽 자기 정점 인덱스를 순회한다.
            경계 정점 쓰기를 수행한 뒤 true를 반환한다.

    static computeDownSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo) -> boolean
        의존:
            U3dQuadTile — 완료 정보와 메시 배율; 함수: {getSkirtInfo(), getScale()}
            USkirtInfo — 방향별 완료 비교와 작업 선택; 함수: {equalsNode(), getWorkType(), get()}; 상수: {DIRECTION.DOWN}
            UPlaneBufferGeometry — 정점 간격과 기본 높이; 함수: {getRatio(), getSkirtIndex(), getDefaultHeight()}
        동작:
            기존 완료 정보와 아래쪽 작업이 같으면 false를 반환한다.
            작업 종류·이웃·정점 배열·간격과 자기·이웃 배율·기본 높이를 방향당 한 번 준비하고 아래쪽 경계와 안쪽 자기 정점 인덱스를 순회한다.
            경계 정점 쓰기를 수행한 뒤 true를 반환한다.

    static computeLeftSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo) -> boolean
        의존:
            U3dQuadTile — 완료 정보와 메시 배율; 함수: {getSkirtInfo(), getScale()}
            USkirtInfo — 방향별 완료 비교와 작업 선택; 함수: {equalsNode(), getWorkType(), get()}; 상수: {DIRECTION.LEFT}
            UPlaneBufferGeometry — 정점 간격과 기본 높이; 함수: {getRatio(), getSkirtIndex(), getDefaultHeight()}
        동작:
            기존 완료 정보와 왼쪽 작업이 같으면 false를 반환한다.
            작업 종류·이웃·정점 배열·간격과 자기·이웃 배율·기본 높이를 방향당 한 번 준비하고 왼쪽 경계와 안쪽 자기 정점 인덱스를 순회한다.
            경계 정점 쓰기를 수행한 뒤 true를 반환한다.

    static computeRightSkirt(tile: U3dQuadTile, geometry: UPlaneBufferGeometry, skirtInfo: USkirtInfo) -> boolean
        의존:
            U3dQuadTile — 완료 정보와 메시 배율; 함수: {getSkirtInfo(), getScale()}
            USkirtInfo — 방향별 완료 비교와 작업 선택; 함수: {equalsNode(), getWorkType(), get()}; 상수: {DIRECTION.RIGHT}
            UPlaneBufferGeometry — 정점 간격과 기본 높이; 함수: {getRatio(), getSkirtIndex(), getDefaultHeight()}
        동작:
            기존 완료 정보와 오른쪽 작업이 같으면 false를 반환한다.
            작업 종류·이웃·정점 배열·간격과 자기·이웃 배율·기본 높이를 방향당 한 번 준비하고 오른쪽 경계와 안쪽 자기 정점 인덱스를 순회한다.
            경계 정점 쓰기를 수행한 뒤 true를 반환한다.

    static findNearGeometry(tile: U3dQuadTile, terrainLayer: U3dTerrainLayer) -> USkirtInfo
        의존:
            U3dQuadTile — 타일 키와 자기 메시; 함수: {getKey(), getMesh()}
            UTileMesh — 이웃과 자기의 표시 배율; 속성 읽기: {scale.z}
            USkirtInfo — 이웃 목록 생성·등록; 생성자: {new USkirtInfo()}; 함수: {set()}; 상수: {DIRECTION}
            USkirtNode — 이웃 검색; 생성자: {new USkirtNode()}; 함수: {getKey(), changeParentNode(), equals(), setTile(), setGeometry()}
            U3dTerrainLayer — 실제 메시 조회; 함수: {getCacheByKey()}
        동작:
            자기 메시의 Z 배율을 읽고 메시가 없으면 1을 사용한다.
            타일의 x·y·실제 레벨에서 네 방향 검색 노드를 만든다.
            각 방향은 최대 5회 현재 키의 메시를 찾고, 없으면 이웃과 자기 검색 좌표를 함께 부모로 올린다.
            두 검색 노드가 같아지면 해당 방향 검색을 종료한다.
            이웃 메시를 찾았으면 이웃 Z 배율을 자기 배율로 나눈 비율과 실제 타일·지오메트리를 노드에 연결하여 결과에 등록하고, 네 방향 검색 결과를 반환한다.

setSkirtValue(workType: string, vertices: ArrayLike<number>, offsetX: number, offsetY: number, tileScale: object, defaultHeight: number, targetIndex: number, selfIndex: number, skirtNode: USkirtNode | undefined, targetScale: object | undefined, direction: string = 'x') -> void
    인터페이스: tileScale과 targetScale은 x·y·z 배율 성분을 가진 객체이며 getScale()의 반환값을 사용한다.
    의존:
        USkirtNode — 이웃 자료; 함수: {getGeometry()}
        UPlaneBufferGeometry — 이웃 정점 보간; 함수: {getSkirtIndex(), getPointAtIndex()}
        isWrong — 유효하지 않은 수치 판정; 함수: {isWrong()}
        UDEF — 오류 대체 높이; 상수: {TERRAIN_NO_DATA}
        __GInfo__ — 계산 오류 알림; 함수: {__GInfo__()}
    동작:
        SET_DEFAULT이면 기본 높이를 사용한다.
        SET_SELF이면 자기 안쪽 정점 높이를 사용한다.
        SET_VALUE이면 경계의 월드 XY를 이웃 격자 인덱스로 환산한다. 정수와의 차이가 0.001 미만이면 올림, 아니면 내림을 사용한다.
        이웃의 내부 정점 두 개를 배율로 환산하여 지정 방향 거리 비율로 보간한다. 다음 인덱스가 내부 폭 또는 높이와 같으면 시작 높이를 그대로 사용한다.
        SET_VALUE의 보간 결과는 이웃 표시 높이이므로 자기 Z 배율로 나누어 로컬 높이로 환산한다.
        기본 높이 경로가 아니고 결과가 falsy이면서 0이 아니면 기존 경계 높이로 대체한다. 정상 0은 그대로 사용한다.
        isWrong 결과가 참이면 알림을 남기고 TERRAIN_NO_DATA로 대체한 뒤 대상 Z에 기록한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
