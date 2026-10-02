# U3dHeightLayer 명세

## 1. 개요

### 1.1 목적과 의미

`U3dHeightLayer`는 타일 단위 고도 데이터를 지형 지오메트리로 변환하고 타일 메시에 적용하는 고도 레이어의 공통 기반 클래스다. 직접 고도 데이터를 가져올 수 없는 타일에는 부모 타일의 캐시와 지오메트리에서 분할한 데이터를 적용한다.

### 1.2 책임 범위

- 고도 레이어의 종류와 높이 타일 처리 종류를 초기화한다.
- 타일 키별 `UPlaneBufferGeometry`를 정적 저장소에서 조회·등록·제거한다.
- 고도 버퍼를 좌표계 스케일과 레이어 우선순위에 따라 지형 정점에 반영한다.
- 부모 타일 기반 대체 고도 생성과 타일 작업 상태 전이를 처리한다.
- 캐시된 고도 데이터의 사용자 요청 재적용과 커스텀 지형 편집 영역 반영을 처리한다.
- 타일 지오메트리 처분과 고도 레이어 가시성 변경에 필요한 쿼드트리 재생성을 연결한다.
- 책임 경계: 원격 고도 데이터 요청, 압축 해제, 바이너리 형식 변환과 URL 생성은 하위 클래스가 담당한다.

### 1.3 주요 동작 방식

하위 클래스가 준비한 고도 배열을 받으면 타일 키의 공유 평면 지오메트리를 조회하거나 생성한다. 각 표본에 데이터 스케일·오프셋과 EPSG:3857 위치 보정값을 적용해 정점 Z를 계산하고, 같은 타일에 여러 고도 레이어가 적용되면 NoData 여부와 `renderOrder`를 기준으로 값을 병합한다. 이후 높이 범위와 바운딩 볼륨을 기록하고, 커스텀 지형 편집 및 품질 설정에 따른 노멀 계산을 수행하고 갱신한 attribute에 GPU 재업로드를 표시한 뒤 지오메트리를 타일 메시에 연결한다.

### 1.4 주요 사용처와 연계 대상

- `U3dHeightXYZLayer`가 이 클래스를 상속한다. 실제 타일 다운로드 전에 `createHeight()`로 공통 조건을 검사하고, 번 레벨·최대 레벨 초과·다운로드 실패 시 `createParentHeight()`를 사용한다.
- `U3dLayer.setApp()`은 높이 타일 처리 종류에 `createHeight()`를 타일 프로세스 콜백으로 등록한다.
- `U3dApp`은 커스텀 지형 편집 범위의 타일에 `updateHeightByUser()`를 호출하고, 고도 레이어 제거 시 쿼드트리를 재구성한다.
- `UHeightUtil`은 부모 고도 데이터 분할과 커스텀 지형 편집을 수행한다.
- `UPlaneBufferGeometry`는 타일별 지형 정점, 노멀, 바운딩 볼륨과 커스텀 편집 영역을 보유한다.

## 3. 정규 자연어 수도코드

```spec
U3dHeightLayer extends U3dLayer 클래스 정의
    의존:
        U3dLayer — 공통 레이어 상태와 타일 처리 생명주기 제공; 상속: {U3dLayer}

    _burnLevels: Array<number>
        하위 클래스가 부모 고도 대체 여부를 판단할 때 사용하는 번 레벨 목록

    _dataScale: number = 1.0
        원본 고도 표본에 곱하는 값

    _dataOffset: number = 0.0
        스케일 적용 후 고도 표본에 더하는 값

    _majorVersion, _minorVersion: number = 1, 0
        고도 자료 형식의 주·부 버전이며 생성자가 기록한다.

    _width, _height: number | undefined
        입력 고도 배열의 가로·세로 표본 수

    _skirt: boolean | undefined
        타일 가장자리 스커트 정점 사용 여부

    _segVertex: number | undefined
        지형 평면 생성에 사용하는 정점 분할 기준값

    _defaultHeight: number | undefined
        스커트 가장자리에 적용하는 기본 고도

    _heightScale: number = 1.0
        타일 메시 Z축에 적용하는 지형 높이 배율

    _headerCache: UCache | undefined = 새 UCache
        타일 키별 고도 타일 헤더(scale, offset, noData, 격자 크기)를 보관하는 캐시

    static g_taskProcessor: UPlaneBufferGeometry | undefined = undefined
        애플리케이션 처분 경로에서 해제하는 정적 작업 처리기 참조

    static terrains: Map<string, UPlaneBufferGeometry> = 빈 Map
        타일 키별 공유 지형 지오메트리 저장소

    constructor(opt: U3dHeightLayerCO = {})
        역할: 고도 레이어의 공통 식별자와 부모 고도 대체 설정을 초기화한다.

        인터페이스:
            opt.burnlevels: 부모 타일 고도를 대신 사용할 레벨 목록이며 생략하면 빈 배열을 사용한다.

        의존:
            U3dLayer — 상위 레이어 상태 초기화; 함수: {constructor()}
            UDEF — 고도 레이어와 높이 타일 처리 식별자 제공; 상수: {LAYER_TYPE.HEIGHT, PROCESS.TYPE.HEIGHT}
            UCache — 고도 타일 헤더 캐시 생성; 생성자: {new UCache()}

        동작:
            상위 레이어 생성자에 opt를 전달한다.
            레이어 종류와 타일 처리 종류를 HEIGHT로 설정한다.
            _burnLevels에 opt.burnlevels 또는 빈 배열을 저장한다.
            _useMaxLevel을 false로 설정한다.
            형식 버전 1.0, 데이터 스케일 1.0, 오프셋 0.0, 높이 배율 1.0을 기록하고 빈 헤더 캐시를 만든다.

    공유 지형 저장소 책임 그룹
        역할: 타일 키별 공유 지형 지오메트리의 존재와 수명주기를 관리한다.

        static getTerrains(key: string) -> UPlaneBufferGeometry | undefined
            인터페이스: 반환: key에 등록된 공유 지형 지오메트리이며 없으면 undefined
            동작: terrains에서 key의 값을 조회하여 반환한다.

        static setTerrains(key: string, value: UPlaneBufferGeometry) -> void
            인터페이스:
                key: 등록할 타일 키
                value: 공유할 지형 지오메트리
            동작: terrains에 key와 value를 저장한다.

        static deleteTerrains(key: string) -> void
            인터페이스: key: 제거할 타일 키
            동작: terrains에서 key를 삭제한다.

        static hasTerrains(key: string) -> boolean
            인터페이스: 반환: key에 지형 지오메트리가 등록되어 있는지 여부
            동작: terrains의 key 보유 여부를 반환한다.

    getHeightScale() -> number
        역할: 현재 지형 높이 배율 설정을 조회한다.
        인터페이스: 반환: _heightScale에 저장된 값
        동작: _heightScale을 반환한다.

    setHeightScale(scale: number | null | undefined = 1.0) -> void
        역할: 지형 높이 배율 설정과 현재 캐시 타일 메시의 Z축 배율을 변경한다.

        인터페이스:
            scale: 지형 높이에 적용할 배율이며 생략하거나 undefined 또는 null이면 1.0을 사용한다.

        처리 기준:
            scale이 문자열이면 현재 배율과 타일 메시를 변경하지 않고 TypeError를 발생시킨다.
            _heightScale에는 기본값 처리한 scale과 0.1 중 큰 값을 저장한다.
            현재 타일 메시에는 _heightScale에 저장한 보정 배율을 적용한다.
            캐시 키, 타일 또는 메시를 찾지 못한 항목은 변경하지 않는다.

        의존:
            U3dLayer — 캐시 키와 draw argument 사용; 함수: {getCacheKeys()}; 속성 읽기: {_drawArg}
            UDrawArg — 캐시 키에 해당하는 현재 타일 조회; 함수: {getTile()}
            U3dQuadTile — 타일 메시 조회; 함수: {getMesh()}
            UTileMesh — 메시 Z축 배율 변경; 속성 쓰기: {scale.z}

        동작:
            _heightScale에 보정한 값을 저장한다.
            캐시 키를 순회해 조회 가능한 각 타일 메시의 scale.z에 _heightScale의 보정 배율을 기록한다.

    createParentHeight(tile: U3dQuadTile, opt: U3dHeightWorkOption) -> undefined
        역할: 부모 타일의 캐시 데이터와 지오메트리에서 자식 타일의 대체 고도를 생성한다.

        인터페이스:
            tile: 고도를 생성할 자식 타일
            opt.work: 작업 상태 메시지를 받을 객체
            opt.promise: 생성 완료 여부를 받을 선택적 deferred 객체

        처리 기준:
            tile 또는 _drawArg가 없으면 가능한 경우 false로 완료하고 종료한다.
            처분된 tile은 상태를 초기화하고 false로 완료한다.
            부모 타일 또는 부모 메시가 없으면 자식 타일 상태를 END로 기록하고 false로 완료한다.
            부모 고도 데이터 생성에 실패하면 자식 타일을 재시작 가능한 상태로 되돌리고 false로 완료한다.
            자식 지오메트리 반영에 실패하면 자식 데이터·헤더 캐시를 제거하고 재시작 가능한 상태로 되돌린다.
            부모가 로딩 중이면 TILE.LOAD 이벤트를 한 번 기다린다.
            이벤트 시점에 부모 고도가 로드되지 않았거나 자식이 처분되었으면 자식의 LOADING 상태를 해제하고 false로 완료한다.

        의존:
            defined — 선택 입력과 객체 존재 여부 판정; 함수: {defined()}
            U3dLayer — draw argument·고도 캐시 사용과 타일 작업 상태 변경; 함수: {setStateTile(), resetStateTile(), restartTile()}; 속성 읽기: {_drawArg, _cache}
            U3dQuadTile(tile) — 자식 타일 상태·부모·키 조회; 함수: {isDisposed(), getParent(), getKey()}; 속성 읽기: {_quadname}
            U3dQuadTile(tileParent) — 부모 메시·키·작업 단계 조회와 로드 이벤트 등록; 함수: {getMesh(), getKey(), getWorkStep(), once()}
            U3dQuadTile(parent) — 이벤트로 전달된 부모의 고도 로드 상태 조회; 함수: {isHeightLoaded()}
            UCache — 부모 데이터·헤더 조회, 자식 데이터·헤더 확정과 실패 항목 제거; 함수: {get(), add(), has(), remove()}
            UHeightUtil — 부모 고도의 자식 사분면 데이터 생성; 정적 함수: {createHeightData()}
            U3dEvent — 부모 타일 로드 이벤트 이름 제공; 상수: {TILE.LOAD}
            UDEF — 타일 상태와 부모 작업 단계 식별; 상수: {TILE_STATE.{_loading, _end}, PROCESS.WORK_STATE.LOADING}
            U3dHeightWorkOption.work(work) — 작업 상태 전달; 콜백: {setMsg()}
            U3dHeightWorkOption.promise(promise) — 비동기 결과 전달; 콜백: {resolve()}

        동작:
            선행조건을 검사하고 실패 사유에 맞게 타일 상태, 메시지와 promise를 처리한다.
            부모 지오메트리 존재 여부를 확인한다.
            부모 지오메트리가 있으면 생성 절차를 즉시 실행하여 부모 고도 캐시, 부모 지오메트리와 사분면 이름으로 자식 데이터를 생성한다.
            생성한 자식 데이터와 부모 헤더를 지오메트리에 반영하고 타일에 연결한다.
            지오메트리 반영이 성공한 경우에만 자식 데이터와 복사한 헤더를 활성 캐시에 저장한다.
            생성이 완료되면 자식 타일 상태를 END로 설정하고 promise를 true로 완료한다.
            부모가 로딩 중이면 TILE.LOAD 콜백에 같은 생성 절차를 위임한다.
                이벤트 시점에 생성 조건을 충족하지 못하면 자식 상태를 초기화하고 promise를 false로 완료한다.
            그 외의 부모 작업 상태는 실패 처리한다.

    override updateHeight(tile?: U3dQuadTile, ioBuf?: ArrayLike<number>, headerBuf?: U3dHeightTileHeader) -> boolean | undefined
        역할: 고도 표본 배열을 타일의 공유 지형 지오메트리 정점에 반영한다.

        인터페이스:
            tile: 갱신할 타일이며 JSDoc에서 선택 입력으로 선언되어 있다.
            ioBuf: _width와 _height에 대응하는 고도 표본 배열
            headerBuf: 해당 ioBuf에만 적용할 타일별 격자 크기, scale, offset과 NoData 정보
            반환: 갱신하면 true이고 ioBuf가 없으면 undefined

        처리 기준:
            ioBuf가 없으면 아무 상태도 변경하지 않는다.
            ioBuf가 있고 tile이 없으면 tile 속성 접근 중 오류가 발생한다. [확인 Q-003]
            ioBuf 길이는 _width와 _height의 곱과 같아야 하며 다르면 지오메트리를 변경하기 전에 Error를 던진다.
            타일 헤더가 있으면 헤더의 width와 height가 레이어 격자 크기와 같아야 한다.
            _width와 _height는 양의 정수여야 하며, 타일 헤더의 width·height와 앱 분할값으로 생성할 지오메트리 격자는 표본 격자와 스커트 정점 수를 포함해 정확히 일치해야 한다. 위반하면 지오메트리를 변경하기 전에 Error를 던진다.
            앱과 기존 병합 대상 레이어는 공유 지오메트리를 만들거나 변경하기 전에 확인한다.
            고도는 `(표본 * scale + offset) * (1 / 실제 좌표 스케일)`로 계산하며, 타일 헤더가 있으면 헤더의 scale·offset·noData를, 없으면 레이어의 _dataScale·_dataOffset을 사용한다.
            원시 NoData와 비유한 계산 결과는 UDEF.TERRAIN_NO_DATA로 변환하며 실제 해발 0m는 유효한 높이로 유지한다.
            다른 레이어와 병합할 때 한 값만 UDEF.TERRAIN_NO_DATA이면 유효한 값을 사용하고, 그 외에는 renderOrder가 높은 레이어의 값을 사용한다.
            tile._layer가 가리키는 기존 레이어를 앱에서 찾지 못하면 `targetLayer is null!` Error를 던진다.
            최소·최대 높이는 undefined 여부로 초기화 상태를 판정하여 0을 유효한 높이로 유지한다.
            바운딩 볼륨은 커스텀 지형 편집을 적용하기 전에 갱신하며 편집 후 다시 계산하지 않는다. [확인 Q-005]
            갱신을 마치면 position attribute에, 노멀을 다시 계산한 경우 normal attribute에도 GPU 재업로드 표시(needsUpdate)를 남긴다. 같은 attribute 객체를 공유하는 타일 지오메트리와 지형 메시가 다음 렌더에서 함께 다시 올린다.

        의존:
            defined — 고도 표본 존재 여부 판정; 함수: {defined()}
            U3dLayer — 앱과 레이어 우선순위·이름 사용; 속성 읽기: {_app, _renderOrder, _name}
            U3dQuadTile — 타일 키와 공간 정보 사용; 함수: {getKey()}; 속성 읽기: {_centerY, _LongitudeSpan, _LatitudeSpan, _minx, _maxy, _layer}; 속성 쓰기: {_layer}
            UMathEngine — EPSG:3857 위치의 실제 좌표 스케일 환산; 정적 함수: {getRealScaleAtGoogle()}
            UPlaneBufferGeometry — 공유 지형 생성, 높이 범위·바운딩 상태 반영, 노멀 재계산과 GPU 재업로드 표시; 생성자: {new UPlaneBufferGeometry()}; 함수: {computeVertexNormals()}; 속성 읽기: {boundingBox, boundingSphere}; 속성 쓰기: {_maxHeight, _minHeight, attributes.position.needsUpdate, attributes.normal.needsUpdate}
            U3dApp — 기존 고도 레이어와 개선 품질 조회; 함수: {getLayer(), getImproveValue()}
            UDEF — 노멀 재계산 품질 기준 제공; 상수: {IMPROVE_TEXTURE_LEVEL.low}
            THREE.Box3 — 지형 바운딩 구 갱신; 함수: {getBoundingSphere()}; 속성 쓰기: {min.z, max.z}

        동작:
            입력 표본 수, 타일·지오메트리 격자 크기, 앱과 기존 병합 대상 레이어를 먼저 검증한다.
            앱의 개선 품질을 타일 갱신당 한 번 조회하여 노멀 재계산 여부를 확정한다.
            스커트 여부에 따라 평면 분할 크기를 정하고 타일 중심 Y에서 좌표 스케일 역수를 계산한다.
            타일 키의 공유 지오메트리를 조회하고, 없으면 타일 범위와 분할 설정으로 생성해 등록한다.
            우선 적용된 레이어 이름을 tile._layer에 기록한다.
            최소·최대 높이를 지오메트리와 boundingBox에 기록하고 boundingSphere를 갱신한다.
            커스텀 지형 편집 영역을 반영한다.
            개선 품질이 low보다 높으면 전체 정점 노멀을 다시 계산한다.
            position attribute에 재업로드를 표시하고, 노멀을 다시 계산했으면 normal attribute에도 표시한다.
            갱신을 마치면 true를 반환한다.

    updateHeightByUser(_tile: U3dHeightUserTileInfoOption, skey?: string) -> boolean
        역할: 캐시된 원본 고도 데이터로 현재 쿼드트리 타일의 지형을 다시 적용한다.

        인터페이스:
            _tile: 다시 적용할 타일의 인덱스와 범위 정보
            skey: 사용할 캐시 키이며 생략하면 _tile.x, _tile.y, _tile.level로 생성한다.
            반환: 재적용 완료 여부

        처리 기준:
            _tile, 캐시 데이터 또는 현재 타일이 없으면 false를 반환한다.
            기존 스커트 정보가 있으면 고도 재적용 전에 제거한다.
            메시 지오메트리를 dispose()하지 않으며, 재적용된 정점 자료는 updateHeight()가 남긴 needsUpdate 표시로 다시 올린다. 공유 지오메트리의 dispose()는 공유분 반납이므로 재업로드 강제 수단으로 쓸 수 없다.

        의존:
            defined — 입력·캐시·타일 존재 여부 판정; 함수: {defined()}
            U3dLayer — 고도 캐시와 draw argument 사용; 속성 읽기: {_cache, _drawArg}
            UCache — 타일 캐시 키 생성과 고도 데이터 조회; 함수: {createKey(), get()}
            UDrawArg — 캐시 키에 해당하는 현재 타일 조회; 함수: {getTile()}
            U3dQuadTile — 스커트 정보 확인·초기화; 함수: {getSkirtInfo(), clearSkirtInfo()}

        동작:
            입력으로 캐시 키를 확정하고 캐시 데이터와 현재 타일을 조회한다.
            현재 타일의 스커트 정보를 제거한 뒤 캐시 고도를 지오메트리에 다시 반영한다.
            공유 지오메트리를 타일에 다시 연결한다.
            재적용을 마치면 true를 반환한다.

    changeHeight(tile: U3dQuadTile) -> void
        역할: 타일 키의 공유 지오메트리를 타일 메시에 연결하고 고도 로드 완료 상태로 표시한다.

        처리 기준:
            공유 지오메트리 또는 tile._mesh가 없으면 아무 작업도 하지 않는다.
            새로 연결하는 메시에는 현재 getHeightScale() 결과를 적용한다.

        의존:
            defined — 공유 지오메트리와 메시 존재 여부 판정; 함수: {defined()}
            U3dQuadTile — 타일 키·메시 조회와 지오메트리·로드 상태 변경; 함수: {getKey(), getMesh(), changeGeometry(), setHeightLoaded()}; 속성 읽기: {_mesh}
            UTileMesh — 메시 Z축 배율 변경; 속성 쓰기: {scale.z}

        동작:
            타일 키의 공유 지오메트리를 조회한다.
            지오메트리와 메시가 있으면 현재 높이 배율을 메시 Z축에 적용한다.
            공유 지오메트리를 타일에 연결하고 고도 로드 완료 상태로 표시한다.

    updateGeometryWidthBoxList(geometry: UPlaneBufferGeometry, tile: U3dQuadTile) -> void
        역할: 현재 타일과 교차하는 CustomLand 편집 객체를 지형 지오메트리에 반영한다.

        처리 기준:
            높이 편집 박스 목록이 없거나 비어 있으면 기존 커스텀 박스를 지우고 종료한다.
            편집 목록이 있으면 기존 커스텀 박스를 모두 지운 뒤 현재 검색 결과로 다시 구성한다.
            앱, 인덱스 관리자와 반복 가능한 검색 결과가 준비된 상태를 전제로 한다.

        의존:
            U3dLayer — draw argument와 앱 사용; 속성 읽기: {_drawArg, _app}
            UDrawArg — 높이 편집 박스 목록 조회; 함수: {getEditHeightBoxList()}
            UPlaneBufferGeometry — 바운딩 박스와 커스텀 박스 관리; 함수: {getCustomBox(), clearCustomBox(), computeBoundingBox()}; 속성 읽기: {boundingBox}
            U3dApp — 공간 인덱스 관리자 조회; 함수: {getIndexManager()}
            UIndexManager — 타일 범위의 CustomLand 검색; 함수: {search()}
            UIndexItem — 검색된 CustomLand 객체 조회; 속성 읽기: {key}
            UHeightUtil — CustomLand 높이의 지오메트리 반영; 정적 함수: {updateGeometryWidthBox()}
            U3dQuadTile — CustomLand 검색 범위 제공; 속성 읽기: {_minx, _miny, _maxx, _maxy}

        동작:
            높이 편집 목록이 비어 있으면 남아 있는 커스텀 박스를 지우고 종료한다.
            필요한 경우 geometry의 boundingBox를 계산한다.
            인덱스 관리자에서 타일 범위와 교차하는 CustomLand 항목을 검색한다.
            기존 커스텀 박스를 지우고 검색된 각 CustomLand를 geometry에 반영한다.

    override disposeTile(tile: U3dQuadTile, opt?: Partial<{deletefunc: Function}>) -> void
        역할: 타일 키의 공유 지형 지오메트리와 상위 레이어의 타일 자원을 정리한다.

        처리 기준:
            공유 지오메트리가 있으면 먼저 dispose()를 호출하고 정적 저장소에서 제거한다.
            타일 헤더는 공유 지오메트리 존재 여부와 관계없이 활성 헤더 캐시에서 제거한다.
            terrains는 레이어 식별자 없이 타일 키만 사용하며, 여러 레이어가 공유할 수 있는 지오메트리를 현재 레이어의 disposeTile()이 제거한다. [확인 Q-006]

        의존:
            U3dLayer — 상위 타일 캐시·상태·취소 작업 정리; 함수: {disposeTile()}
            U3dQuadTile — 지오메트리 조회 키 제공; 속성 읽기: {_key}
            UPlaneBufferGeometry — 공유분 반납이며 이 레이어가 만든 지오메트리는 단독 소유이므로 즉시 GL 자원이 해제된다; 함수: {dispose()}

        동작:
            tile._key의 공유 지오메트리를 조회한다.
            지오메트리가 있으면 처분하고 정적 저장소에서 제거한다.
            같은 타일 키의 활성 헤더를 제거한다.
            나머지 타일 정리를 U3dLayer.disposeTile()에 위임한다.

    override show(show: boolean, refresh: boolean = true) -> void
        역할: 고도 레이어 가시성 변경 전에 애플리케이션 쿼드트리를 다시 생성한다.

        인터페이스:
            show: 적용할 가시성
            refresh: 상위 가시성 변경 후 앱 갱신 여부로 선언된 값

        처리 기준:
            _drawArg 또는 앱이 없으면 아무 작업도 하지 않는다.
            refresh는 상위 show() 호출에 전달하지 않아 항상 상위 기본값 true가 사용된다. [확인 Q-007]

        의존:
            defined — draw argument와 앱 존재 여부 판정; 함수: {defined()}
            U3dLayer — 현재 레이어 수신자로 상위 가시성 직접 호출; 함수: {prototype.show.call()}; 속성 읽기: {_drawArg}
            UDrawArg — 연결된 앱 조회; 속성 읽기: {_app}
            U3dApp — 쿼드트리 처분과 재생성; 함수: {disposeQuadTree(), createQuadTreeSet()}

        동작:
            앱의 기존 쿼드트리를 처분하고 새 쿼드트리 집합을 생성한다.
            show만 전달하여 U3dLayer.show()를 호출한다.

    override getWorkingLevel2() -> number
        역할: 높이 타일 프로세스의 전체 진행 작업 수를 Level 2 작업 수로 제공한다.

        의존:
            defined — 타일 프로세스 존재 여부 판정; 함수: {defined()}
            U3dLayer — 현재 타일 프로세스 사용; 속성 읽기: {_tileProcess}
            TileProcess — 전체 진행 작업 수 조회; 함수: {getWorkingCount()}

        동작:
            _tileProcess가 있으면 getWorkingCount()를 반환하고, 없으면 0을 반환한다.

    override getWorkingLevel3() -> number
        역할: 높이 타일 프로세스의 전체 진행 작업 수를 Level 3 작업 수로 제공한다.
        동작: getWorkingLevel2() 결과를 반환한다.

    override createHeight(tile: U3dQuadTile, opt: U3dHeightWorkOption = {}) -> boolean | Promise<boolean>
        역할: 하위 클래스가 고도 생성 작업을 시작하기 전에 공통 선행조건을 검사한다.

        인터페이스:
            tile: 생성 가능 여부를 검사할 타일
            opt.work: 타입에서는 필수지만 현재 구현이 선택적으로 사용하는 작업 객체 [확인 Q-010]
            반환: JSDoc은 boolean 또는 Promise<boolean>으로 선언하지만 현재 구현은 동기 boolean만 반환한다. [확인 Q-008]

        처리 기준:
            tile, tile._mesh 또는 tile._drawArg가 없으면 false를 반환한다.
            처분된 타일, 보이지 않는 레이어, 최소 레벨 미만 타일과 레이어 범위 밖 타일은 상태를 초기화하고 false를 반환한다.
            타일 상태가 LOADING 이상이면 기존 작업을 유지하고 false를 반환한다.
            opt.work가 있으면 식별 가능한 실패 사유를 setMsg()로 전달한다.

        의존:
            defined — 필수 상태와 객체 존재 여부 판정; 함수: {defined()}
            U3dLayer — 가시성·최소 레벨 사용과 타일 범위·상태 검사·초기화; 함수: {intersects(), getStateTile(), resetStateTile()}; 속성 읽기: {_visible, _minlevel}
            U3dQuadTile — 생성 선행조건과 공간 정보 제공; 속성 읽기: {_mesh, _drawArg, _disposed, _rlevel, _rectangle}
            UDEF — 중복 작업 판정 기준 제공; 상수: {TILE_STATE._loading}
            U3dHeightWorkOption.work(work) — 실패 사유 전달; 콜백: {setMsg()}

        동작:
            필수 타일 상태, 레이어 가시성, 최소 레벨과 공간 교차 여부를 순서대로 검사한다.
            실패 조건에 따라 메시지를 전달하고 필요한 경우 타일 상태를 초기화한다.
            현재 타일 상태가 LOADING 이상인지 검사한다.
            모든 조건을 통과하면 true를 반환하고 그 외에는 false를 반환한다.

    override dispose() -> Promise<boolean>
        역할: 상위 레이어 자원을 처분하고 고도 데이터 캐시 참조를 해제한다.

        처리 기준:
            정적 terrains 저장소는 이 메서드에서 직접 정리하지 않는다.

        의존:
            U3dLayer — 현재 레이어 수신자로 상위 처분 직접 호출; 함수: {prototype.dispose.call()}; 속성 쓰기: {_cache, _disposed}

        동작:
            U3dLayer.dispose()를 호출한다.
            _cache를 undefined로 설정하고 _disposed를 true로 설정한다.
            상위 처분 Promise를 반환한다.

    checkDEMBufValidation(frontBuf: number, backBuf: number, tile: U3dQuadTile, x: number, y: number) -> number
        역할: 두 고도 표본 차이가 기준을 넘으면 backBuf를 frontBuf로 대체하고 진단 정보를 남긴다.

        인터페이스:
            frontBuf: 대체에 사용할 앞 고도 값
            backBuf: 검사할 뒤 고도 값
            tile: 오류 위치를 계산할 타일
            x, y: 타일 내부 표본 인덱스
            반환: 유지하거나 대체한 고도 값

        처리 기준:
            디버그 위치 계산은 타일 너비를 64등분한 값을 사용한다.
            현재 updateHeight() 실행 경로에서는 이 메서드를 호출하지 않는다.

        의존:
            U3dLayer — 디버그 설정과 앱 사용; 속성 읽기: {_isDeBug, _app}
            U3dQuadTile — 문제 타일 키와 공간 범위 제공; 속성 읽기: {_key, _rectangle3d}
            UGeoRect — 디버그 위치 계산용 타일 범위 제공; 속성 읽기: {ptLeftBottom, nWidth}
            U3dPOI — 문제 위치 진단 객체 생성; 생성자: {new U3dPOI()}
            U3dApp — 진단 POI 등록; 함수: {addPOI()}
            Web API — 경고 출력; 함수: {console.warn()}

        동작:
            두 값의 차이가 2500을 초과하면 5000 초과 경고를 출력한다. [확인 Q-009]
            디버그 모드이면 타일 범위와 x, y로 문제 위치를 계산해 타일 키 레이블의 U3dPOI를 앱에 추가한다.
            기준을 초과하면 frontBuf를, 그 외에는 backBuf를 반환한다.

U3dHeightSampleState 타입 정의
    _name: string | undefined
        병합 여부 판정에 사용하는 현재 레이어 이름
    _dataScale, _dataOffset: number
        헤더가 없을 때의 표본 복원 설정
    _defaultHeight: number | undefined
        정점 처리 시점마다 조회하는 가장자리 기본 높이

U3dHeightSampleResult 타입 정의
    maxHeight, minHeight: number | undefined
        가장자리를 제외한 정점의 높이 범위이며 내부 정점이 없으면 undefined
    merged: boolean
        다른 레이어의 기존 높이와 병합한 경우 true

U3dHeightLayerCO_Content 타입 정의
    burnlevels?: Array<number>
        부모 타일 고도를 대신 사용할 번 레벨 목록이며 생략하면 빈 배열을 사용한다.

U3dHeightLayerCO extends U3dLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        U3dHeightLayerCO_Content의 모든 필드
            기반 U3dLayerCO 옵션에 위 고도 레이어 옵션 필드를 합친 생성 옵션 타입이며 필드 의미는 U3dHeightLayerCO_Content 타입 정의에 기록한다.

U3dHeightWorkOption 타입 정의
    work: {setMsg: (msg: string) => void}
        작업 상태 메시지를 받는 객체
    promise?: {resolve: (value: boolean) => void}
        부모 고도 생성 결과를 받는 선택적 deferred 객체

U3dHeightUserTileInfoOption 타입 정의
    x, y, level: number
        캐시 키를 구성하는 타일 인덱스와 레벨
    minx, miny, maxx, maxy: number
        선언된 타일 범위이며 현재 updateHeightByUser() 구현은 직접 사용하지 않는다.

U3dHeightTileHeader 타입 정의
    major, minor: number
        고도 타일 자료 형식의 주·부 버전
    width, height: number
        고도 타일의 X·Y축 표본 수이며 updateHeight()가 레이어 격자 크기와 대조한다.
    sampleType: number
        고도 표본의 자료형 식별값
    scale, offset: number
        updateHeight()가 레이어 기본값보다 우선 적용하는 표본 스케일과 오프셋
    noData: number | undefined
        원시 자료의 NoData 표본값이며 없으면 undefined
    count: number
        고도 타일의 실제 값 개수
```

## 4. 공통 처리 기준과 제약

```spec
updateHeight()를 호출하기 전에 하위 클래스는 _width, _height, _segVertex, _skirt와 _defaultHeight를 유효한 값으로 준비해야 한다.
지형 갱신 경로는 _app, _drawArg, 레이어 캐시와 타일 메시가 설정된 상태를 전제로 한다.
고도 입력 배열은 _width와 _height의 곱에 해당하는 표본을 정확히 제공해야 하며, 타일 헤더와 앱 분할값으로 생성되는 지오메트리의 격자 크기도 이 값과 일치해야 한다.
지오메트리 내부 NoData는 Float32 정밀도로 정규화된 UDEF.TERRAIN_NO_DATA 예약값을 사용하며 실제 높이 0과 구분한다.
타일 키가 같은 고도 레이어는 static terrains의 동일한 UPlaneBufferGeometry를 공유한다.
공유 지오메트리의 등록과 제거 키에는 레이어 식별자가 포함되지 않는다.
createParentHeight()에서 실패 메시지를 기록하는 경로는 opt.work가 제공된 상태를 전제로 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
