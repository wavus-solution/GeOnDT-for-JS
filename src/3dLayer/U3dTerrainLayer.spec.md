# U3dTerrainLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dTerrainLayer`는 쿼드트리 타일이 소유한 기본 지형 메시 `UTileMesh`를 그대로 자기 그룹에 넣고 빼는 지형 레이어이다. 모델 레이어 기반 클래스의 장면·그룹·캐시·타일 처분 흐름을 지형 종류로 바꾸어 사용하며, 자기 작업물을 새로 만들지 않으므로 캐시 정리에서 타일의 geometry와 머티리얼을 해제하지 않는다.

### 1.2 책임 범위

- 레이어 종류와 타일 처리 종류를 지형(TERRAIN)으로 초기화하고 장면 이름을 `Terrain`으로 둔다.
- 타일이 보이거나 숨겨질 때 `tile._mesh`를 그룹에 추가·제거하고 타일 키로 캐시에 등록·제거한다.
- 캐시 정리 경로에서 타일 메시를 그룹에서만 떼어내고 geometry·머티리얼 해제는 타일에 맡긴다.
- 디버그 바운드 표시 시 그룹 안 각 타일의 바운딩 박스를 렌더 전에 그린다.

책임 경계: 타일 메시와 geometry의 생성·해제는 `U3dQuadTile`과 `UTileMesh`가, geometry 공유분의 소유자 수는 `UPlaneBufferGeometry`가, 지형 위 이미지 표현은 이미지 레이어가 담당한다.

### 1.3 주요 동작 방식

앱이 지형 종류로 분류한 이 레이어는 타일 가시성 전환마다 `addTileFromScene()`·`removeTileFromScene()`로 타일 메시를 그룹과 캐시에 넣고 뺀다. 타일이 처분되면 상위 클래스의 타일 처분 흐름이 캐시 항목을 삭제하면서 `deleteMesh()`를 호출하는데, 이 레이어는 그 메시를 그룹에서만 떼어낸다. 타일 geometry의 공유분은 타일이 갖고 있고 머티리얼은 `UTileMesh.DEFAULT_BASIC_MATERIAL` 공용이므로, 여기서 해제하면 다른 소유자가 쓰는 GL 자원이 지워지기 때문이다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp.getInstanceTerrainLayers()`가 이 레이어를 지형 레이어 목록으로 돌려주고, `U3dQuadSet`이 그 목록을 `_terrainLayer`로 보관한다.
- `U3dQuadTile.setVisible()`과 `UDrawArg.addTerrainFromTile()`·`removeTerrainFromTile()`이 타일 가시성 전환마다 `addTileFromScene()`·`removeTileFromScene()`을 호출한다.
- `U3dLayerList.disposeTileNoModel()`이 타일 처분 시 `U3dModelLayer.disposeTile()`을 거쳐 `U3dLayer.disposeTileByKey()`에 이르고, 그 캐시 삭제 콜백 `U3dModelLayer.fncDeleteGroup()`이 이 레이어의 `deleteMesh()`를 호출한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
타일 메시를 그룹과 캐시에서 제거할 때 타일 geometry의 공유분과 공용 머티리얼을 해제해서는 안 된다.
```

## 3. 정규 자연어 수도코드

```spec
U3dTerrainLayer extends U3dModelLayer 클래스 정의
    의존:
        U3dModelLayer — 장면·그룹·캐시와 타일 처분 흐름 제공; 상속: {U3dModelLayer}

    constructor(opt = {})
        역할: 모델 레이어를 지형 레이어 종류로 초기화한다.

        처리 기준:
            opt가 null이면 상위 생성자 실행 뒤 안내 로그만 남기고 지형 종류 설정을 건너뛴다. [확인 Q-001]

        의존:
            U3dModelLayer — 상위 레이어 초기화와 장면 접근; 함수: {constructor()}; 속성 읽기: {_scene}
            defined — opt 존재 여부 판정; 함수: {defined()}
            UDEF — 지형 레이어와 지형 타일 처리 식별자 제공; 상수: {LAYER_TYPE.TERRAIN, PROCESS.TYPE.TERRAIN}
            Web API — 초기화 중단 안내 출력; 함수: {console.info()}

        동작:
            상위 생성자에 opt를 전달한다.
            opt가 정의되지 않았으면 안내를 출력하고 종료한다.
            _classtype을 'U3dTerrainLayer', 장면 이름을 'Terrain'으로 두고 _type과 _tileName을 지형 식별자로 바꾼다.
            _visible을 true로 설정한다.

    override debugBound(isDebug: boolean, color: number = 0x00ff00) -> boolean
        역할: 상위 디버그 바운드 표시에 더해 그룹 안 각 타일의 바운딩 박스를 렌더 전에 그린다.

        인터페이스:
            isDebug가 true이면 표시를 켜고 false이면 끈다.
            반환: 상위가 상태를 새로 바꾸었으면 true, 이미 같은 상태여서 처리하지 않았으면 false

        처리 기준:
            상위 debugBound()가 false를 반환하면 아무 것도 추가하지 않고 false를 반환한다.
            렌더 전 콜백은 isDebug가 true일 때만 상위와 같은 eventId로 등록하며, 같은 키의 콜백은 누적되고 제거는 상위의 debugBound(false)가 eventId 단위로 수행한다.

        의존:
            U3dLayer — 상위 디버그 표시 처리, 그룹과 디버그 상태 접근; 함수: {debugBound(), getGroup()}; 속성 읽기: {_debug.eventId, _debug.objectBound, _app}
            UGroup — 그룹 자식 열거; 함수: {getChildren()}
            U3dApp — 렌더 전 콜백 등록; 함수: {setRenderBefore()}
            UTileMesh — 메시가 속한 타일 조회; 함수: {getTile()}
            U3dQuadTile — 타일 바운딩 박스 조회; 함수: {getBoundingbox()}
            UBox3HelperGroup — 바운딩 박스 추가와 확정; 함수: {add(), commit()}

        동작:
            상위 debugBound()에 isDebug와 color를 전달하고 false이면 false를 반환한다.
            isDebug이면 eventId로 렌더 전 콜백을 등록한다.
                콜백은 그룹의 각 자식 메시에서 타일을 얻어 그 바운딩 박스를 color로 objectBound에 추가하고 확정한다.
            true를 반환한다.

    override dispose() -> undefined
        역할: 참조용 레이어이므로 상위 처분을 실행하지 않는다.
        처리 기준: 상위 dispose()는 Promise<boolean>을 반환하지만 이 구현은 아무 것도 반환하지 않는다. [확인 Q-002]
        동작: 아무 작업도 하지 않는다.

    isTexture(tile) -> boolean
        역할: 캐시된 타일 메시의 머티리얼에 텍스처 맵이 있는지 판정한다.

        처리 기준:
            tile이 없거나 캐시 항목 또는 머티리얼이 없으면 false를 반환한다.
            머티리얼이 배열이면 첫 머티리얼의 map만 검사한다.

        의존:
            defined — 입력·캐시 항목·map 존재 여부 판정; 함수: {defined()}
            U3dLayer — 타일 키의 캐시 항목 조회; 함수: {getCache()}

        동작:
            tile의 캐시 항목과 머티리얼을 조회한다.
            머티리얼이 배열이면 첫 요소의 map, 아니면 머티리얼의 map이 정의되어 있을 때 true를 반환하고 그 외에는 false를 반환한다.

    override addTileFromScene(tile) -> void
        역할: 보이게 된 타일의 메시를 그룹과 캐시에 등록한다.

        처리 기준: tile 또는 tile._mesh가 없으면 아무 작업도 하지 않는다.

        의존:
            U3dLayer — 그룹과 캐시 접근; 함수: {getGroup()}; 속성 읽기: {_cache}
            UGroup — 메시 추가; 함수: {add()}
            UCache — 타일 키로 메시 등록; 함수: {add()}
            U3dQuadTile — 타일 키와 메시 조회; 함수: {getKey()}; 속성 읽기: {_mesh}

        동작:
            그룹에 tile._mesh를 추가한다.
            타일 키로 tile._mesh를 캐시에 등록한다.

    override removeTileFromScene(tile) -> void
        역할: 숨겨진 타일의 메시를 그룹과 캐시에서 제거한다.

        처리 기준:
            tile 또는 tile._mesh가 없으면 아무 작업도 하지 않는다.
            메시의 geometry와 머티리얼은 해제하지 않는다.

        의존:
            U3dLayer — 그룹과 캐시 접근; 함수: {getGroup()}; 속성 읽기: {_cache}
            UGroup — 메시 제거; 함수: {remove()}
            UCache — 타일 키 항목 제거; 함수: {remove()}
            U3dQuadTile — 타일 키와 메시 조회; 함수: {getKey()}; 속성 읽기: {_mesh}

        동작:
            그룹에서 tile._mesh를 제거한다.
            타일 키의 캐시 항목을 제거한다.

    override deleteMesh(mesh: Three.js Object3D) -> void
        역할: 캐시 삭제 콜백이 넘긴 타일 메시를 그룹에서만 떼어낸다.

        처리 기준:
            mesh가 없으면 아무 작업도 하지 않는다.
            상위 U3dModelLayer.deleteMesh()와 달리 geometry와 머티리얼을 dispose하지 않는다. 타일 geometry의 공유분은 타일이 갖고 있고 머티리얼은 공용이기 때문이다.

        의존:
            defined — mesh 존재 여부 판정; 함수: {defined()}
            U3dLayer — 그룹 접근; 함수: {getGroup()}
            UGroup — 메시 제거; 함수: {remove()}

        동작:
            그룹에서 mesh를 제거한다.
```

## 4. 공통 처리 기준과 제약

```spec
이 레이어의 캐시 항목은 타일이 소유한 UTileMesh 자체이며 레이어가 만든 작업물이 아니다. 그룹·캐시에서 빼는 어떤 경로도 그 메시의 geometry나 머티리얼을 해제하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
