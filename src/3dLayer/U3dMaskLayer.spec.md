# U3dMaskLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

모델의 높이를 타일별 격자 셀에 반영하고 박스로 표시하는 레이어다. 바람길 분석에서 위치별 마스크 값을 조회하는 데 사용한다.

### 1.2 책임 범위

마스크 생성·조회·수동 값 변경, 참조 레이어의 폴리곤 검사, 박스 형상 생성과 정리를 담당한다. 모델 타일의 기본 처리와 등록은 U3dModelLayer를 사용한다.

### 1.3 주요 동작 방식

타일에 격자를 만든 뒤 모델 폴리곤과 격자 점을 비교하여 셀 높이를 누적한다. 셀별 geometry를 병합한 메시를 타일별로 보관하고, 갱신 시 기반 생성 조건에 따라 표시 그룹을 연결하거나 분리한다.

### 1.4 주요 사용처와 연계 대상

GeOnDT.model.U3dMaskLayer로 노출한다. UAnalyParticle.createMask()가 생성·타일 마스크 준비·모델 값 반영을 연결하고 UParticleEngine이 격자의 셀 값을 사용한다.

## 3. 정규 자연어 수도코드

```spec
U3dMaskLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        infoLayer?: Object
            모델 폴리곤을 조회할 레이어이며 생략하면 값 생성 작업은 완료되지 않는다. [확인 Q-001]
        drawarg?: Object
            마스크 좌표 변환과 타일 캐시 조회에 사용하는 실행 인수다.
        level?: number = 17
            마스크 레벨과 _minlevel을 정한다.
        height?: number = 30
            격자 표시 높이와 박스 바닥 높이다.
        segments?: number = 20
            정사각형 격자의 한 축 셀 개수다.
        setmaskbox?: boolean = true
            셀 값 갱신 시 박스 geometry를 준비할지 정한다.
        boxcolor?: string | number = 0x00ff33
            박스 재질의 색상이다.
        boxopacity?: number = 0.5
            재질 opacity이며 1 미만이면 transparent와 forceSinglePass를 켠다.
        extent?: Array<unknown> = []
            _extent에 보관하는 범위 정보다.
        datalevel?: number = 15
            _dataLevel에 보관하는 레벨이다.
        dembaseurl?: string
            타입에만 있으며 현재 실행 코드에서 사용하지 않는다.
        name
            생성자는 이름이 undefined이면 Guid 결과를 사용한다. 선언의 기반 옵션 경로는 해석되지 않는다. [확인 Q-006]

U3dMaskLayerCO 타입 정의
    기존 선언은 U3dModelLayerCO와 Content의 교집합이다. 기반 타입의 @U3dModelLayer 경로가 현재 tsconfig에 없어 선언 생성에서는 Omit<any, never>로 남는다. [확인 Q-006]

U3dMaskLayerCellData 부분 타입 명세
    이 명세에서 사용하는 필드:
        value: number
            셀 높이다.
        infoName?: string
            값을 제공한 메시 식별자다.
        infoLayer?: string
            값을 제공한 레이어 이름이다.
        mesh?: UMesh
            수동 셀 갱신 후 연결된 표시 메시다.

U3dMaskLayerGridData 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
            격자 그룹 이름이다.
        xLength: number
            가로 셀 개수다.
        yLength: number
            세로 셀 개수다.
        mask: Array<U3dMaskLayerCellData>
            셀 값을 보관하는 배열이다.
        size: Vector3
            셀 크기이며 모듈의 공유 벡터를 참조한다.
        startPosition: Vector3
            타일 왼쪽 위의 시작점이다.
        _checkPoints: Array<number>
            값을 검사한 격자 점 번호다.
        gridHelper: GridHelper
            위치와 표시 격자를 제공한다.
        planeGeometry: PlaneGeometry
            점 포함 검사에 사용할 샘플 평면이다.

U3dMaskLayerPolygon 부분 타입 명세
    이 명세에서 사용하는 필드:
        vertices: Array<{pos: Vector3Like}>
            메시 위치를 더하기 전의 정점 목록이다.
        _zValue?: number
            내부 점 판정으로 갱신한 높이다.

U3dMaskLayerNeighborIndices 부분 타입 명세
    이 명세에서 사용하는 필드:
        southWest: number
            아래 왼쪽 셀 번호다.
        southEast: number
            아래 오른쪽 셀 번호다.
        northWest: number
            위 왼쪽 셀 번호다.
        northEast: number
            위 오른쪽 셀 번호다.

U3dMaskLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 모델 레이어 기반; 상속: {U3dModelLayer}

    _masks: object = 빈 객체
        타일 키별 격자와 셀 값을 보관한다.
    _meshLoadList: Array = 빈 배열
        값 반영 대상으로 처리한 메시 식별자를 보관한다.
    _boxGeometryList: object = 빈 객체
        격자 그룹 이름별 병합 전 박스 geometry 목록이다.
    _tileMeshMap: Map = 빈 Map
        타일별 가장 최근 생성한 병합 메시를 보관한다. 제거 메서드가 항목을 삭제하지 않는다. [확인 Q-004]
    _size
        모든 격자와 레이어가 모듈 SIZE 벡터를 참조한다. 새 격자의 크기 계산이 기존 격자 크기도 바꾼다. [확인 Q-009]
    _level, _height, _segments, _setMaskBox, _boxColor, _boxOpacity, _extent, _dataLevel
        생성 옵션을 보관하고 격자·값·표시를 결정하는 상태다.
    _drawArg, _infoLayer, _maskBoxList, _geometryUtil, _maskBoxMaterial, _edgelineMaterial, _checkTime, _mercator
        실행 인수, 참조 레이어와 생성·조회·표시 작업에서 사용하는 객체다.

    constructor(opt?: U3dMaskLayerCO)
        의존:
            U3dModelLayer — 기반 생성; 생성자: {super()}
            defaultValue — undefined 옵션의 기본값 적용; 함수: {defaultValue()}
            Guid — 기본 이름 생성; 함수: {Guid()}
            UGroup — 박스 그룹 준비; 생성자: {new UGroup()}
            U3dGeometryUtil — geometry 병합 도구 준비; 생성자: {new U3dGeometryUtil()}
            THREE — 박스와 외곽선 재질 준비; 생성자: {new MeshBasicMaterial(), new LineBasicMaterial()}
            UCheckTime — 갱신 시점 검사기 준비; 생성자: {new UCheckTime()}
            UMercator — 좌표 변환기 준비; 생성자: {new UMercator()}
        동작:
            opt가 falsy이면 빈 객체로 바꾸고 기반 생성자를 실행한다. 자체 옵션의 키를 정규화하지 않는다.
            Guid를 호출한 뒤 opt.name이 undefined일 때 그 결과를 이름으로 선택한다. _masks와 geometry 목록은 빈 객체, 메시 이력은 빈 배열, 메시 맵은 빈 Map으로 초기화한다. [확인 Q-006]
            drawarg와 infoLayer를 보관하고 level을 _level과 _minlevel에 적용한다. 타입 노드의 기본값을 사용하되 defaultValue는 null을 대체하지 않는다.
            UGroup과 geometry 도구를 생성하고 박스 재질의 색상·opacity를 옵션으로 설정한다. wireframe은 false이고 opacity < 1이면 transparent와 forceSinglePass가 true다.
            외곽선은 검정색·linewidth 2로 생성한다. 갱신 검사기와 mercator를 생성하고 extent·datalevel을 보관한다.

    override setApp(app: U3dApp) -> void
        의존: U3dModelLayer — 기반 setApp으로 애플리케이션 연결; 함수: {prototype.setApp.call()}
        동작: 기반 prototype의 setApp을 현재 인스턴스와 app으로 호출하고 반환값은 전달하지 않는다.

    override disposeTile(tile: U3dQuadTile) -> void
        의존:
            U3dModelLayer — 기반 disposeTile로 타일 정리; 함수: {prototype.disposeTile.call()}
            UDEF — 맵에 보관된 메시 정리; 정적 함수: {disposeObject3D()}
        동작:
            기반 disposeTile을 먼저 실행한다.
            removeGroupMeshes.call(tile._key)로 호출하여 키는 this에만 전달하고 key 인수는 생략한다. helper는 key 부재로 반환하여 그룹을 정리하지 않는다. [확인 Q-002]
            _tileMeshMap에 키가 있으면 해당 메시를 disposeObject3D로 정리한다. 맵 항목은 삭제하지 않는다. [확인 Q-004]

    override createModel(tile: U3dQuadTile) -> boolean
        의존: U3dLayer — 범위 밖 타일 초기화와 상한; 함수: {resetStateTile()}; 속성 읽기: {_maxlevel}
        동작:
            tile._rlevel이 _minlevel 미만 또는 _maxlevel 초과이면 타일 상태를 초기화하고 false를 반환한다.
            그 외에는 tile과 현재 _drawArg로 createModelByFrustum을 호출하여 생성 허용 여부를 그대로 반환한다. true는 새 메시 생성 완료를 보장하지 않는다.

    removeAll() -> void
        의존:
            UDEF — 메시와 그룹 정리; 정적 함수: {disposeObject3D()}
            U3dLayer — 전체 타일 상태 초기화와 루트 그룹; 함수: {resetStateTileAll()}; 속성 읽기: {_group}
            THREE.Object3D — 부모 연결과 하위 객체 정리; 함수: {remove(), traverse(), clear()}
            THREE.BufferGeometry — 격자·박스 geometry 해제; 함수: {dispose()}
            THREE.Material — 하위 메시 재질 해제; 함수: {dispose()}
        동작:
            _tileMeshMap.keys() 결과의 forEach를 사용한다. 그 메서드가 없는 실행 환경에서는 여기서 예외가 발생한다. [확인 Q-003]
            각 맵 메시를 정리하고 부모에서 분리한다. 같은 키의 마스크가 있으면 gridHelper와 planeGeometry의 dispose를 선택적으로 호출하고 마스크 항목을 삭제한다.
            geometry 목록의 모든 원소를 dispose하고 _boxGeometryList를 새 빈 객체로 바꾼다. _tileMeshMap은 비우지 않는다. [확인 Q-004]
            _maskBoxList를 정리하고 부모에서 분리한 뒤 clear한다. 메시 이력을 비우고 전체 타일 상태를 초기화한다.
            루트 그룹을 traverse하여 geometry와 material이 있는 객체에 각각 dispose를 호출하고 루트 그룹을 clear한다. 앞 단계에서 예외가 발생하면 후속 정리는 실행하지 않는다.

    override createModelByFrustum(tile: U3dQuadTile, drawArg: UDrawArg, force?: boolean) -> boolean
        인터페이스: 반환값은 기반 레이어의 생성 조건 통과 여부다. force는 기반 API의 선택 인수이며 현재 기반 구현에서는 사용하지 않는다.
        의존:
            U3dModelLayer — 기반 createModelByFrustum의 생성 허용 판정; 함수: {prototype.createModelByFrustum.call()}
            U3dLayer — 표시 그룹 접근; 속성 읽기: {_group}
            THREE.Object3D — 그룹 분리; 함수: {remove()}
        동작:
            기반 prototype 함수를 현재 인스턴스·tile·drawArg·force로 호출한다.
            결과가 false이면 루트 자식을 순회하여 이름에 tile.getKey()가 포함된 그룹을 숨기고 루트에서 분리한 뒤 false를 반환한다.
            children.forEach 도중 같은 자식 배열에서 제거하므로 연속된 일치 그룹 중 일부는 다음 순회에서 건너뛸 수 있다.
            허용되었고 _tileMeshMap에 tile._key가 있으면 추가 생성 없이 true를 반환한다. 없으면 저장된 geometry로 메시 생성을 시도한 뒤 true를 반환한다. 형상 부재로 메시 생성 결과가 undefined여도 기반 판정 결과는 true다. [확인 Q-004]

    override dispose() -> Promise<boolean>
        의존:
            U3dLayer — 장면과 루트 그룹; 속성 읽기: {_scene, _group}
            THREE.Scene — 장면에서 그룹 분리; 함수: {remove()}
            U3dModelLayer — 기반 dispose로 종료; 함수: {prototype.dispose.call()}
            THREE.Material — 두 레이어 재질 해제; 함수: {dispose()}
        동작:
            장면에서 루트 그룹을 분리하고 기반 dispose의 반환 객체를 보관한 뒤 removeAll을 동기적으로 실행한다.
            박스와 외곽선 재질을 차례로 dispose하고 보관한 기반 Promise를 같은 참조로 반환한다. 추가 Promise를 생성하거나 기반 완료를 기다린 뒤 정리하지 않는다.
            동기 예외는 그대로 전파되어 후속 정리와 반환을 중단한다. 정상 반환된 Promise는 기반 완료 값과 실패를 전달한다. 예외를 가로채거나 정리 순서를 보장하는 finally는 없다.

    override update(drawArg: UDrawArg) -> void
        의존:
            UCheckTime — 갱신 시점 판정; 함수: {isUpdate()}
            U3dModelLayer — 기반 update로 갱신; 함수: {prototype.update.call()}
        동작:
            _checkTime.isUpdate()가 truthy일 때만 drawArg._cacheTiles._items의 값을 순회한다.
            disposed가 아니고 메시가 있으며 실제 레벨이 _minlevel 이상인 타일마다 createModel을 실행한다. 이후 기반 update를 호출한다.

    override initialize() -> void
        의존: U3dModelLayer — U3dLayer에 선언된 initialize를 상속받은 호출 경로; 함수: {prototype.initialize.call()}
        동작: U3dModelLayer.prototype을 통해 상속된 U3dLayer.initialize를 현재 인스턴스로 호출하고 반환값은 전달하지 않는다.

    createMask(tile: U3dQuadTile) -> void
        의존:
            defined — 타일과 격자 존재 여부; 함수: {defined()}
            U3dQuadTile — 격자를 식별할 타일 키 조회; 함수: {getKey()}
        동작:
            tile이 null·undefined이면 반환한다. tile.getKey()로 얻은 키의 격자가 없을 때만 빈 객체를 등록한 뒤 격자를 초기화한다. 기존 격자는 갱신하지 않는다.

    getMaskByTileKey(key: string) -> any
        의존: defined — 마스크 사전과 항목 존재 여부; 함수: {defined()}
        동작: 사전과 해당 키가 모두 존재하면 동일 격자 객체를 반환하고 그 외에는 undefined를 반환한다.

    getKeyByPosition(position: WorldPosition, level?: number) -> object
        의존:
            defined — 크기·레벨 존재 판정; 함수: {defined()}
            UDrawArg — 월드 좌표를 Google 좌표로 변환; 함수: {getWorldToGoogle()}
            UMercator — 변환기 준비와 타일 좌표 계산; 생성자: {new UMercator()}; 함수: {MetersToTile()}
        동작:
            _size가 없으면 undefined를 반환한다. 공개 반환 선언은 object다. [확인 Q-007]
            위치의 x·y만 사용하며 z는 계산에 사용하지 않는다.
            크기 복사본에 1 / 2^(level - _level)을 곱한다. level이 null·undefined이면 _level을 사용한다.
            FIRST_X_POS=-492134.011, FIRST_Y_POS=495993.967을 기준으로 격자 전체 크기와 위치를 나눈 floor 값으로 로컬 셀 위치를 계산한다.
            drawArg로 위치를 Google 좌표로 변환한다. _mercator가 falsy이면 새로 생성하고 MetersToTile에 level과 출력 배열을 전달한다.
            변환된 타일 X_Y_level 문자열과 셀 x·y 인덱스 객체를 반환한다.

    setMaskObject(tileKey: string, index: object, object: object) -> void
        의존: defined — 격자·타일·셀 값 존재 여부; 함수: {defined()}
        동작:
            키로 격자를 조회한다. 없으면 _cacheModelTiles.get(tileKey)의 truthy 결과 또는 _cacheTiles.get(tileKey)에서 타일을 찾아, 타일이 있을 때 마스크를 만들고 다시 조회한다.
            x·y를 셀 키로 바꾸고 기존 셀과 value가 있으면 value를 0으로 직접 덮어쓴다.
            전달 객체를 값 갱신에 사용한 뒤, 해당 셀의 mesh에 생성 결과를 넣고 visible을 true로 바꾼다.
            인덱스 범위나 메시 생성 성공을 별도로 검증하지 않으므로 셀·mesh가 없으면 속성 접근에서 예외가 발생할 수 있다. [확인 Q-008]

    getMaskObject(tileKey: string, index: object) -> object
        의존: defined — 격자·셀 존재 여부; 함수: {defined()}
        동작:
            격자를 조회하고 없으면 undefined를 반환한다.
            x·y로 구한 키의 셀이 있으면 동일 셀 객체를 반환하고 없으면 undefined다. 공개 선언은 object다. [확인 Q-007]

    createMaskValue(tileKey: string) -> Promise<void>
        의존:
            UDEF — 비동기 실행 등록과 종료 상태; 정적 함수: {createPromise()}; 상수: {TILE_STATE._end}
            defined — 레이어·캐시·격자 존재 판정; 함수: {defined()}
            U3dGroupLayer — 자식 레이어 캐시 선택; 속성 읽기: {_listlayer}
            UCache — 타일 키의 모델 그룹 조회; 함수: {get()}
            UMesh — 마스크 반영 대상 판정과 식별 정보; 함수: {getUid()}
            USharedMesh — 공유 메시 제외 판정; 상수: {USharedMesh}
            CSG — geometry를 폴리곤으로 변환; 정적 함수: {fromGeometry()}
            THREE.Box3 — 모델 경계 조회; 함수: {setFromObject()}
            THREE.Object3D — 캐시 그룹 순회; 함수: {traverse()}
            U3dLayer — 타일 완료 상태와 로그 분류; 함수: {setStateTileByKey()}; 속성 읽기: {_classtype}
            U3dMessage — 실패 안내; 정적 함수: {info()}; 상수: {CNT.MASK.ERROR_ADD_MASK_2}
        동작:
            createPromise에 처리를 등록한다. _infoLayer가 없으면 resolve·reject를 호출하지 않아 미완료로 남는다. [확인 Q-001]
            그룹 레이어이고 _listlayer가 있으면 자식 순서대로 캐시에서 tileKey의 첫 그룹을 선택한다. 자식이 없거나 일치 그룹이 없으면 성공 완료한다.
            일반 참조 레이어는 _cache가 없으면 즉시 성공 완료하고, 캐시 항목이 없어도 성공 완료한다.
            캐시 그룹이 있으면 공유 tempBBox에 전체 경계를 구하고 교차 타일 키 목록을 얻는다.
            그룹을 순회하며 USharedMesh가 아닌 UMesh만 처리하고 이미 _meshLoadList에 식별자가 있으면 건너뛴다. geometry를 CSG.fromGeometry(geometry, 0)으로 변환한다.
            타일에 마스크 격자가 있을 때 각 폴리곤 정점에 메시 위치를 더한다. 시작점보다 왼쪽·위쪽이거나 시작점과의 X·Y 거리 절댓값이 _size × 각 축 셀 수보다 크면 제외한다.
            경계 안 정점이 하나라도 있는 폴리곤과 타일 키를 중복 없이 모은다. 빈 타일·폴리곤·정점 목록은 해당 반복을 건너뛴다.
            두 결과 목록이 모두 비어 있지 않으면 키마다 폴리곤의 점 포함 검사를 등록하고, 검사 완료를 기다리기 전에 메시 식별자를 이력에 넣는다.
            모든 검사가 성공하면 요청한 tileKey의 박스 메시를 만들고 해당 타일을 _end로 바꾼 뒤 resolve한다.
            후속 Promise 실패는 안내 코드 2214595를 남겨 원래 오류로 reject한다. 등록 콜백의 try 안에서 발생한 오류는 2214833으로 안내하고 reject한다.

createMaskGrid(tile: U3dQuadTile) -> void
    의존:
        U3dQuadTile — 격자 키와 타일 경계·시작점 조회; 함수: {getKey()}; 속성 읽기: {_boundingbox, _minx, _maxy}
        THREE.Vector3 — 격자 시작점 생성; 생성자: {new Vector3()}
        THREE.Box3 — 타일 크기 계산; 함수: {getSize()}
    동작:
        tile.getKey()의 기존 빈 격자에 segments × segments개의 셀을 만든다. fill에 전달한 단일 {value: 0} 객체를 모든 셀이 공유한다. [확인 Q-005]
        타일 boundingbox의 크기를 공유 SIZE에 넣고 1 / segments를 곱한다. 레이어 _size와 grid.size는 이 동일 벡터를 참조한다. [확인 Q-009]
        시작점은 (tile._minx, tile._maxy, 0)이고 이름은 MaskGrid_와 타일 키를 연결한다. 양 축 길이를 segments로, _checkPoints를 빈 배열로 설정한다.
        표시 격자와 샘플 평면을 준비한다.

getIntersectTile(bbox: Box3) -> Array<string> | undefined
    의존:
        defined — 실행 인수·모델 캐시 존재 판정; 함수: {defined()}
        THREE.Box3 — 타일 경계 교차 판정; 함수: {intersectsBox()}
    동작:
        _drawArg가 없으면 undefined를 반환한다. 모델 타일 캐시가 없으면 빈 배열을 반환한다.
        모델 타일의 실제 레벨이 _minlevel과 같고 boundingbox가 bbox와 교차할 때만 tile.getKey()를 배열에 추가하여 반환한다.

createGridHelper(tile: U3dQuadTile) -> void
    의존:
        U3dQuadTile — 표시할 타일 키와 중심 조회; 함수: {getKey()}; 속성 읽기: {_center}
        THREE — 격자 표시와 샘플 평면 생성; 생성자: {new GridHelper(), new PlaneGeometry()}
        THREE.BufferGeometry — 격자 행렬 적용; 함수: {applyMatrix4()}
        THREE.Object3D — 변환 갱신과 그룹 연결; 함수: {updateMatrix(), add()}
    동작:
        _size.x × xLength와 ceil((xLength+yLength)/2)로 GridHelper를 만든다. geometry에 현재 행렬을 적용하고 위치를 타일 중심에 맞춘 뒤 z에 _height를 더한다.
        X 회전을 PI/2로, 이름을 MaskGridHelper_와 키로, _layername을 레이어 이름으로 설정하고 updateMatrix한다.
        격자에 helper를 보관하고 가로·세로 크기는 _size × 각 길이, 양 축 세분화 인수는 모두 xLength인 PlaneGeometry를 생성한다.
        이름에 대응하는 그룹을 얻어 helper를 연결한다.

checkPolygonInPoint(key: string, intersectList: Array<U3dMaskLayerPolygon>, mesh: UMesh, val: number) -> Promise<void>
    의존:
        UDEF — 비동기 실행 등록; 정적 함수: {createPromise()}
        UMesh — 메시 식별 정보 조회; 함수: {getUid(), getLayerName()}
        THREE.BufferGeometry — 샘플 평면 복제와 해제; 함수: {clone(), dispose()}
        defined — 기존 이웃 셀 값 존재 여부; 함수: {defined()}
        U3dMessage — 검사 실패 안내; 정적 함수: {info()}; 상수: {CNT.MASK.ERROR_ADD_MASK_2}
        Web API — 예외 출력; 함수: {console.log()}
    동작:
        비동기 콜백에서 격자의 평면을 복제하고 position 배열을 일반 배열로 복사한다. 체크 이력과 메시 위치·식별자·레이어 이름을 읽는다. 이 준비는 내부 try 밖에서 실행한다.
        position 배열을 3개씩 읽어 helper의 x·y 위치를 더한 검사점을 만든다. position이나 폴리곤 목록이 비면 포함 검사 없이 평면을 해제하고 resolve한다.
        각 폴리곤에 대한 포함 판정이 truthy이면 메시 식별 정보와 폴리곤 _zValue로 새 값 객체를 만든다.
        이미 검사한 점은 아래 왼쪽·아래 오른쪽·위 왼쪽·위 오른쪽의 고정된 네 방향 셀 키를 순회한다. 셀과 value가 존재하면서 기존 값이 _zValue보다 작을 때 먼저 갱신한다.
        해당 점 주변 셀에 값을 적용하고 점 번호가 이력에 없으면 추가한다.
        정상 경로에서는 복제한 평면을 dispose하고 resolve한다. try 내부 예외는 console.log와 안내 코드 2219561을 남겨 reject하며 그 경로에서는 평면 dispose에 도달하지 않는다.

calculateMaskIndex(idx: number, maskGrid: U3dMaskLayerGridData, val: U3dMaskLayerCellData) -> void
    동작:
        점의 네 방향 셀 키를 구한다.
        아래 왼쪽을 갱신하고 아래 오른쪽이 다른 키면 갱신한다. idx >= xLength이면 위 왼쪽과, 다른 키인 위 오른쪽도 순서대로 갱신한다.

setMaskValue(maskGrid: U3dMaskLayerGridData, key: number, val: U3dMaskLayerCellData) -> void
    의존: defined — 셀 배열·키·기존 값 존재 판정; 함수: {defined()}
    동작:
        maskGrid.mask와 val.value를 먼저 읽는다. 배열이나 key가 없으면 반환하고 0 <= key < mask.length일 때만 셀에 접근한다.
        기존 value가 정의되어 있고 0이 아니면 기존 값이 새 값보다 클 때 기존 객체를 유지하고, 그 외에는 전달한 val 객체로 교체한다. 기존 value가 0 또는 미정의여도 val로 교체한다.
        _setMaskBox가 truthy이면 해당 셀의 박스 geometry를 준비한다.

createMaskBox(maskGrid: U3dMaskLayerGridData, key: number) -> void
    의존:
        defined — 격자·키·그룹·값 존재 판정; 함수: {defined()}
        THREE.BoxGeometry — 박스 형상 생성; 생성자: {new BoxGeometry()}
        THREE.BufferAttribute — 정점 위치 반영; 함수: {setXYZ()}
        String 확장 — geometry 이름 비교; 함수: {equalIgnoreCase()}
    동작:
        격자나 키가 없으면 반환하고 이름에 대응하는 그룹을 얻는다. 그룹이나 셀 value가 없으면 반환한다.
        MaskBox_와 열·행 인덱스로 이름을 만든다. value - _height가 음수이면 생성하지 않는다.
        그룹 geometry 목록에서 대소문자 무시 이름 비교로 첫 항목을 찾는다. 목록이 없거나 일치 항목이 없으면 조회 결과는 undefined다. 기존 형상이 있으면 재생성하고, 없으면 셀 가로·세로 크기와 value-_height 깊이로 BoxGeometry를 만들어 이름과 빈 groups를 설정한다.
        셀 키와 가로 셀 수로 샘플 평면의 기준 점 번호를 얻는다.
        각 박스 정점을 평면 기준 x + 셀 너비/2, y - 셀 높이/2, (value+_height)/2만큼 옮겨 setXYZ로 저장한 뒤 그룹의 geometry 목록 끝에 추가한다. 목록 부재를 여기서 보완하지 않으므로 추가할 목록이 없으면 예외가 전파된다.

removeGroupMeshes(key: string) -> void
    의존:
        defined — 키·격자·그룹 존재 판정; 함수: {defined()}
        UMesh — 메시 판정과 해제; 함수: {dispose()}
        THREE.BufferGeometry — geometry 해제; 함수: {dispose()}
        THREE.Material — 재질 해제; 함수: {dispose()}
        THREE.Object3D — 그룹 순회와 분리; 함수: {traverse(), remove()}
    동작:
        key가 없으면 즉시 반환한다. 격자가 없으면 반환하고 이름의 그룹을 얻는다.
        그룹을 순회하여 UMesh인 자식의 geometry, material, 메시를 차례로 dispose한 뒤 그룹에서 제거한다. 현재 disposeTile 경로는 key 인수를 전달하지 않아 첫 조건에서 끝난다. [확인 Q-002]

createMaskBoxMesh(key: string) -> UMesh | undefined
    의존:
        defined — 키·격자·그룹·geometry 목록 존재 판정; 함수: {defined()}
        U3dGeometryUtil — geometry 병합; 함수: {mergeGeometries()}
        UMesh — 병합 메시 생성과 레이어 이름 설정; 생성자: {new UMesh()}; 함수: {setLayerName()}
        U3dLayer — 레이어 이름 조회; 함수: {getName()}
        THREE — 외곽선 생성; 생성자: {new EdgesGeometry(), new LineSegments()}
        THREE.Object3D — 메시와 외곽선 연결; 함수: {add()}
    동작:
        키나 격자가 없으면 반환한다. 격자 이름의 그룹을 얻고 그룹·geometry 목록이 없거나 비었으면 반환한다.
        목록을 mergeGeometries(list, false)로 병합하고 공유 _maskBoxMaterial로 UMesh를 생성한다. helper의 위치를 복사한 뒤 z는 0으로 설정한다.
        레이어 이름을 설정하고 _tileMeshMap에 key와 새 메시를 저장한다. 기존 맵 메시를 이 단계에서 해제하지 않는다.
        메시 이름을 그룹 이름으로 정하고 EdgesGeometry 및 공유 외곽선 재질의 LineSegments를 만들어 메시 아래, 메시를 그룹 아래 연결하고 반환한다.

regenerateGeometry(geometry: BufferGeometry, maskGrid: U3dMaskLayerGridData, value: number) -> BoxGeometry | undefined
    의존:
        defined — geometry 존재 판정; 함수: {defined()}
        THREE.BoxGeometry — 대체 형상 생성; 생성자: {new BoxGeometry()}
        THREE.BufferGeometry(geometry) — 이전 형상 해제; 함수: {dispose()}
        String 확장 — 이름 비교; 함수: {equalIgnoreCase()}
    동작:
        geometry가 없으면 undefined를 반환한다. 셀 크기와 value-_height 깊이의 새 BoxGeometry에 빈 groups와 이전 이름을 설정한다.
        그룹 목록에서 대소문자 무시 이름 비교로 첫 항목을 찾아 있으면 splice한다. 이전 geometry를 dispose한 뒤 새 geometry를 반환한다.

getGroupByName(name: string) -> UGroup | undefined
    의존:
        defined — 이름 존재 판정; 함수: {defined()}
        UGroup — 표시 그룹 생성; 생성자: {new UGroup()}
        THREE.Object3D — 루트에 그룹 연결; 함수: {add()}
        String 확장 — 그룹 이름 비교; 함수: {equalIgnoreCase()}
    동작:
        name이 없으면 undefined를 반환한다. 루트 자식의 이름을 대소문자 무시 비교하여 첫 그룹이 있으면 그대로 반환한다.
        없으면 UGroup을 생성하여 이름을 정하고 루트에 추가한다. 그 이름의 _boxGeometryList 항목을 빈 배열로 초기화하고 그룹을 반환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
